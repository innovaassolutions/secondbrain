import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { classifyThought, Destination } from "@/lib/classify";
import { sendSlackMessage, addReaction } from "@/lib/slack";
import { convex, api } from "@/lib/convex";

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || "";
const CONFIDENCE_THRESHOLD = parseFloat(
  process.env.CONFIDENCE_THRESHOLD || "0.6"
);

// Destination mapping for fix command
const DESTINATION_MAP: Record<string, Destination> = {
  person: "people",
  people: "people",
  project: "projects",
  projects: "projects",
  idea: "ideas",
  ideas: "ideas",
  admin: "admin",
  vocab: "vocabulary",
  vocabulary: "vocabulary",
  word: "vocabulary",
};

function verifySlackRequest(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  if (!SLACK_SIGNING_SECRET) {
    console.warn("SLACK_SIGNING_SECRET not set, skipping verification");
    return true;
  }

  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp) < fiveMinutesAgo) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", SLACK_SIGNING_SECRET)
      .update(sigBasestring)
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}

// Track in-flight requests to prevent duplicate processing
const processingMessages = new Set<string>();

async function processCapture(
  text: string,
  channelId: string,
  messageTs: string
) {
  if (!convex) {
    console.error("Convex client not initialized");
    return;
  }

  // Check if already processing this message (Slack retries)
  if (processingMessages.has(messageTs)) {
    console.log("Already processing message, skipping:", messageTs);
    return;
  }
  processingMessages.add(messageTs);

  // Also check database for already-processed messages
  const existing = await convex.query(api.inboxLog.getByPostId, {
    slackMessageId: messageTs,
  });
  if (existing) {
    console.log("Message already processed, skipping:", messageTs);
    processingMessages.delete(messageTs);
    return;
  }

  try {
    // Classify the thought using Claude
    const classification = await classifyThought(text);
    console.log("Classification result:", classification);

    const { destination, confidence, title, extractedFields } = classification;

    // Check confidence threshold
    if (confidence < CONFIDENCE_THRESHOLD) {
      // Log as needs_review, don't create record
      await convex.mutation(api.inboxLog.create, {
        originalText: text,
        destination,
        recordTitle: title,
        confidence,
        status: "needs_review",
        slackMessageId: messageTs,
      });

      // Ask for clarification
      await sendSlackMessage(
        channelId,
        `🤔 I'm not sure where this belongs (${Math.round(confidence * 100)}% confident).\n\nRepost with a prefix like \`person:\`, \`project:\`, \`idea:\`, \`admin:\`, or \`vocab:\` to specify.`,
        messageTs
      );

      return;
    }

    // Create record in appropriate table
    let recordId: string | undefined;

    if (destination === "people") {
      const fields = extractedFields as { name: string; context: string; followUps: string[] };
      recordId = await convex.mutation(api.people.create, {
        name: fields.name || title,
        context: fields.context || "",
        followUps: fields.followUps || [],
      });
    } else if (destination === "projects") {
      const fields = extractedFields as { name: string; nextAction: string; notes: string };
      recordId = await convex.mutation(api.projects.create, {
        name: fields.name || title,
        nextAction: fields.nextAction || "Define next action",
        notes: fields.notes || "",
      });
    } else if (destination === "ideas") {
      const fields = extractedFields as { title: string; oneLiner: string; notes: string };
      recordId = await convex.mutation(api.ideas.create, {
        title: fields.title || title,
        oneLiner: fields.oneLiner || "",
        notes: fields.notes || "",
      });
    } else if (destination === "admin") {
      const fields = extractedFields as { task: string; dueDate: string | null; notes: string };
      recordId = await convex.mutation(api.admin.create, {
        task: fields.task || title,
        dueDate: fields.dueDate ? new Date(fields.dueDate).getTime() : undefined,
        notes: fields.notes || "",
      });
    } else if (destination === "vocabulary") {
      const fields = extractedFields as {
        word: string;
        definition: string;
        partOfSpeech: string | null;
        example: string | null;
        source: string | null;
      };
      recordId = await convex.mutation(api.vocabulary.create, {
        word: fields.word || title,
        definition: fields.definition || "",
        partOfSpeech: fields.partOfSpeech || undefined,
        example: fields.example || undefined,
        source: fields.source || undefined,
      });
    }

    // Log to inbox
    await convex.mutation(api.inboxLog.create, {
      originalText: text,
      destination,
      recordTitle: title,
      confidence,
      status: "filed",
      slackMessageId: messageTs,
    });

    // Send confirmation
    const emoji = getDestinationEmoji(destination);
    await addReaction(channelId, messageTs, emoji);
    await sendSlackMessage(
      channelId,
      `${getDestinationIcon(destination)} Filed to *${destination}* as "${title}"\n_Reply \`fix: [destination]\` if I got this wrong_`,
      messageTs
    );
  } catch (error) {
    console.error("Error processing capture:", error);
    await sendSlackMessage(
      channelId,
      `❌ Sorry, I had trouble processing that. Please try again.`,
      messageTs
    );
  } finally {
    // Clean up in-flight tracking
    processingMessages.delete(messageTs);
  }
}

async function processFix(
  text: string,
  channelId: string,
  messageTs: string,
  threadTs: string
) {
  if (!convex) {
    console.error("Convex client not initialized");
    return;
  }

  // Parse the fix command
  const fixMatch = text.match(/^fix:\s*(\w+)/i);
  if (!fixMatch) {
    return;
  }

  const targetDestination = fixMatch[1].toLowerCase();
  console.log("Fix command detected:", { target: targetDestination, threadTs });

  // Look up the original inbox log entry by the parent message timestamp
  const inboxEntry = await convex.query(api.inboxLog.getByPostId, {
    slackMessageId: threadTs,
  });

  if (!inboxEntry) {
    await sendSlackMessage(
      channelId,
      "I couldn't find the original message to fix.",
      messageTs
    );
    return;
  }

  try {
    // Handle delete command
    if (targetDestination === "delete") {
      await convex.mutation(api.inboxLog.markAsDeleted, { id: inboxEntry._id });
      await sendSlackMessage(
        channelId,
        "Got it! Marked as deleted.",
        messageTs
      );
      return;
    }

    // Validate destination
    const newDestination = DESTINATION_MAP[targetDestination];
    if (!newDestination) {
      await sendSlackMessage(
        channelId,
        `Unknown destination "${targetDestination}". Use: people, projects, ideas, admin, vocabulary, or delete`,
        messageTs
      );
      return;
    }

    // Re-classify the original text with the forced destination
    const classification = await classifyThought(
      `${targetDestination}: ${inboxEntry.originalText}`
    );

    // Create record in the new table
    let recordId: string | undefined;
    const { title, extractedFields } = classification;

    if (newDestination === "people") {
      const fields = extractedFields as { name: string; context: string; followUps: string[] };
      recordId = await convex.mutation(api.people.create, {
        name: fields.name || title,
        context: fields.context || "",
        followUps: fields.followUps || [],
      });
    } else if (newDestination === "projects") {
      const fields = extractedFields as { name: string; nextAction: string; notes: string };
      recordId = await convex.mutation(api.projects.create, {
        name: fields.name || title,
        nextAction: fields.nextAction || "Define next action",
        notes: fields.notes || "",
      });
    } else if (newDestination === "ideas") {
      const fields = extractedFields as { title: string; oneLiner: string; notes: string };
      recordId = await convex.mutation(api.ideas.create, {
        title: fields.title || title,
        oneLiner: fields.oneLiner || "",
        notes: fields.notes || "",
      });
    } else if (newDestination === "admin") {
      const fields = extractedFields as { task: string; dueDate: string | null; notes: string };
      recordId = await convex.mutation(api.admin.create, {
        task: fields.task || title,
        dueDate: fields.dueDate ? new Date(fields.dueDate).getTime() : undefined,
        notes: fields.notes || "",
      });
    } else if (newDestination === "vocabulary") {
      const fields = extractedFields as {
        word: string;
        definition: string;
        partOfSpeech: string | null;
        example: string | null;
        source: string | null;
      };
      recordId = await convex.mutation(api.vocabulary.create, {
        word: fields.word || title,
        definition: fields.definition || "",
        partOfSpeech: fields.partOfSpeech || undefined,
        example: fields.example || undefined,
        source: fields.source || undefined,
      });
    }

    // Update the inbox log entry
    await convex.mutation(api.inboxLog.updateRecordId, {
      id: inboxEntry._id,
      recordId: recordId || "",
      newDestination,
      recordTitle: title,
    });

    // Confirm in thread
    await sendSlackMessage(
      channelId,
      `${getDestinationIcon(newDestination)} Got it! Moved to *${newDestination}* as "${title}"`,
      messageTs
    );
  } catch (error) {
    console.error("Error processing fix command:", error);
    await sendSlackMessage(
      channelId,
      "Sorry, I had trouble processing that fix command.",
      messageTs
    );
  }
}

function getDestinationEmoji(destination: string): string {
  const emojis: Record<string, string> = {
    people: "busts_in_silhouette",
    projects: "rocket",
    ideas: "bulb",
    admin: "clipboard",
    vocabulary: "book",
  };
  return emojis[destination] || "white_check_mark";
}

function getDestinationIcon(destination: string): string {
  const icons: Record<string, string> = {
    people: "👥",
    projects: "🚀",
    ideas: "💡",
    admin: "📋",
    vocabulary: "📖",
  };
  return icons[destination] || "✅";
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";

  // Verify the request is from Slack
  if (!verifySlackRequest(body, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  // Handle URL verification challenge
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Handle event callbacks
  if (payload.type === "event_callback") {
    const event = payload.event;

    // Only process messages in channels (not bot messages, not edits)
    if (event.type === "message" && !event.subtype && !event.bot_id) {
      const messageText = event.text;
      const channelId = event.channel;
      const messageTs = event.ts;
      const threadTs = event.thread_ts;

      // Check if this is a thread reply with fix command
      if (threadTs && messageText.toLowerCase().startsWith("fix:")) {
        console.log("Processing fix command:", { text: messageText, threadTs });
        try {
          await processFix(messageText, channelId, messageTs, threadTs);
        } catch (error) {
          console.error("Fix processing failed:", error);
        }
        return NextResponse.json({ ok: true });
      }

      // Skip thread replies that aren't fix commands
      if (threadTs) {
        return NextResponse.json({ ok: true });
      }

      console.log("Processing capture:", { text: messageText, channel: channelId });

      // Process and wait for completion before returning
      // Slack allows up to 3 seconds, but will retry if we're slow
      try {
        await processCapture(messageText, channelId, messageTs);
      } catch (error) {
        console.error("Capture processing failed:", error);
      }

      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ ok: true });
}

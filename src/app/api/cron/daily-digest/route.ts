import { NextRequest, NextResponse } from "next/server";
import { convex, api } from "@/lib/convex";
import { generateDailyDigest, DigestData } from "@/lib/summarize";
import { sendSlackMessage } from "@/lib/slack";

const CRON_SECRET = process.env.CRON_SECRET;
const SLACK_DIGEST_CHANNEL_ID = process.env.SLACK_DIGEST_CHANNEL_ID;

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends it as Authorization: Bearer <secret>)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!convex) {
    return NextResponse.json(
      { error: "Convex client not initialized" },
      { status: 500 }
    );
  }

  if (!SLACK_DIGEST_CHANNEL_ID) {
    return NextResponse.json(
      { error: "SLACK_DIGEST_CHANNEL_ID not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch data from Convex
    const [
      activeProjects,
      stalledProjects,
      overdueAdmin,
      peopleWithFollowUps,
      recentlyCompleted,
      randomVocabWord,
    ] = await Promise.all([
      convex.query(api.projects.getActive, {}),
      convex.query(api.projects.getStalled, {}),
      convex.query(api.admin.getOverdue, {}),
      convex.query(api.people.getWithFollowUps, {}),
      convex.query(api.projects.getRecentlyCompleted, {}),
      convex.query(api.vocabulary.getRandomWord, {}),
    ]);

    const now = Date.now();

    // Prepare data for digest
    const digestData: DigestData = {
      activeProjects: activeProjects.map((p) => ({
        name: p.name,
        nextAction: p.nextAction,
        status: p.status,
      })),
      stalledProjects: stalledProjects.map((p) => ({
        name: p.name,
        nextAction: p.nextAction,
        daysSinceUpdate: Math.floor((now - p.updatedAt) / (1000 * 60 * 60 * 24)),
      })),
      overdueAdmin: overdueAdmin.map((t) => ({
        task: t.task,
        daysPastDue: t.dueDate
          ? Math.floor((now - t.dueDate) / (1000 * 60 * 60 * 24))
          : 0,
      })),
      pendingFollowUps: peopleWithFollowUps.map((p) => ({
        personName: p.name,
        followUps: p.followUps,
      })),
      recentlyCompleted: recentlyCompleted.map((p) => ({
        name: p.name,
      })),
      vocabularyWord: randomVocabWord
        ? {
            word: randomVocabWord.word,
            definition: randomVocabWord.definition,
            partOfSpeech: randomVocabWord.partOfSpeech || undefined,
            example: randomVocabWord.example || undefined,
          }
        : undefined,
    };

    // Mark vocabulary word as shown if one was selected
    if (randomVocabWord) {
      await convex.mutation(api.vocabulary.markAsShown, { id: randomVocabWord._id });
    }

    // Generate digest using Claude
    const digestText = await generateDailyDigest(digestData);

    // Post to Slack
    await sendSlackMessage(SLACK_DIGEST_CHANNEL_ID, digestText);

    return NextResponse.json({
      success: true,
      message: "Daily digest sent",
      stats: {
        activeProjects: activeProjects.length,
        stalledProjects: stalledProjects.length,
        overdueAdmin: overdueAdmin.length,
        pendingFollowUps: peopleWithFollowUps.length,
      },
    });
  } catch (error) {
    console.error("Error generating daily digest:", error);
    return NextResponse.json(
      { error: "Failed to generate daily digest" },
      { status: 500 }
    );
  }
}

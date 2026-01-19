import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || "";

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
    if (
      event.type === "message" &&
      !event.subtype &&
      !event.bot_id
    ) {
      const messageText = event.text;
      const channelId = event.channel;
      const userId = event.user;
      const messageTs = event.ts;

      console.log("Received message:", {
        text: messageText,
        channel: channelId,
        user: userId,
        ts: messageTs,
      });

      // TODO: Process message through Claude classification
      // TODO: Store in Convex
      // TODO: Send confirmation reply

      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ ok: true });
}

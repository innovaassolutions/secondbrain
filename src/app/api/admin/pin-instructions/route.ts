import { NextRequest, NextResponse } from "next/server";
import { sendSlackMessage, pinMessage } from "@/lib/slack";

const INSTRUCTIONS_MESSAGE = `📚 *Second Brain Quick Reference*

*How to capture thoughts:*
Just type your thought naturally - the AI will classify it automatically.

*Optional prefixes to force a category:*
• \`person:\` or \`people:\` → People database
• \`project:\` or \`projects:\` → Projects database
• \`idea:\` or \`ideas:\` → Ideas database
• \`admin:\` → Admin/tasks database

*Examples:*
\`\`\`
person: Met Sarah at conference, works at Acme Corp
project: Build landing page - finish hero section first
idea: What if we added AI search to the app?
admin: Pick up dry cleaning Friday
Call John tomorrow about the proposal
\`\`\`

*Corrections:*
If the bot files something wrong, reply with:
\`fix: [correct destination]\`

Example: \`fix: idea\` to reclassify as an idea`;

export async function POST(request: NextRequest) {
  // Simple auth check - require a secret header
  const authHeader = request.headers.get("x-admin-secret");
  if (authHeader !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await request.json();

  if (!channelId) {
    return NextResponse.json(
      { error: "channelId is required" },
      { status: 400 }
    );
  }

  try {
    // Post the instructions message
    const result = await sendSlackMessage(channelId, INSTRUCTIONS_MESSAGE);

    if (!result?.ts) {
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Pin the message
    await pinMessage(channelId, result.ts);

    return NextResponse.json({
      ok: true,
      message: "Instructions posted and pinned",
      messageTs: result.ts,
    });
  } catch (error) {
    console.error("Error posting instructions:", error);
    return NextResponse.json(
      { error: "Failed to post instructions" },
      { status: 500 }
    );
  }
}

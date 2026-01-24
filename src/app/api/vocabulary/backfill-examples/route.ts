import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { convex, api } from "@/lib/convex";

const CRON_SECRET = process.env.CRON_SECRET;

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return new Anthropic({ apiKey });
}

async function generateExample(word: string, definition: string): Promise<string> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `Generate a single example sentence demonstrating the word "${word}" (meaning: ${definition}) used naturally in context. Return ONLY the example sentence, nothing else.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text.trim().replace(/^["']|["']$/g, "");
}

async function runBackfill() {
  if (!convex) {
    return NextResponse.json(
      { error: "Convex client not initialized" },
      { status: 500 }
    );
  }

  try {
    // Get all vocabulary words
    const allWords = await convex.query(api.vocabulary.list, {});

    // Filter words without examples
    const wordsWithoutExamples = allWords.filter(
      (word) => !word.example || word.example.trim() === ""
    );

    if (wordsWithoutExamples.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All words already have examples",
        updated: 0,
      });
    }

    const results: { word: string; success: boolean; error?: string }[] = [];

    // Process each word
    for (const word of wordsWithoutExamples) {
      try {
        const example = await generateExample(word.word, word.definition);

        await convex.mutation(api.vocabulary.update, {
          id: word._id,
          example,
        });

        results.push({ word: word.word, success: true });
      } catch (error) {
        results.push({
          word: word.word,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Backfilled ${successCount} of ${wordsWithoutExamples.length} words`,
      updated: successCount,
      results,
    });
  } catch (error) {
    console.error("Error backfilling examples:", error);
    return NextResponse.json(
      { error: "Failed to backfill examples" },
      { status: 500 }
    );
  }
}

// GET handler for Vercel MCP access
export async function GET() {
  return runBackfill();
}

export async function POST(request: NextRequest) {
  // Verify authorization (use cron secret or implement your own auth)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runBackfill();
}

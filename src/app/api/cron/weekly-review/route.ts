import { NextRequest, NextResponse } from "next/server";
import { convex, api } from "@/lib/convex";
import { generateWeeklyReview, WeeklyData } from "@/lib/summarize";
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
      weeklyActivity,
      newPeopleCount,
      newIdeasCount,
      newVocabularyCount,
      totalVocabularyCount,
      randomVocabWord,
    ] = await Promise.all([
      convex.query(api.projects.getActive, {}),
      convex.query(api.projects.getStalled, {}),
      convex.query(api.admin.getOverdue, {}),
      convex.query(api.people.getWithFollowUps, {}),
      convex.query(api.projects.getRecentlyCompleted, {}),
      convex.query(api.inboxLog.getWeeklyActivity, {}),
      convex.query(api.people.getRecentCount, { days: 7 }),
      convex.query(api.ideas.getRecentCount, { days: 7 }),
      convex.query(api.vocabulary.getRecentCount, { days: 7 }),
      convex.query(api.vocabulary.getTotalCount, {}),
      convex.query(api.vocabulary.getRandomWord, {}),
    ]);

    const now = Date.now();

    // Prepare data for weekly review
    const weeklyData: WeeklyData = {
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
      weeklyActivity,
      newPeople: newPeopleCount,
      newIdeas: newIdeasCount,
      newVocabulary: newVocabularyCount,
      totalVocabulary: totalVocabularyCount,
    };

    // Mark vocabulary word as shown if one was selected
    if (randomVocabWord) {
      await convex.mutation(api.vocabulary.markAsShown, { id: randomVocabWord._id });
    }

    // Generate weekly review using Claude
    const reviewText = await generateWeeklyReview(weeklyData);

    // Post to Slack
    await sendSlackMessage(SLACK_DIGEST_CHANNEL_ID, reviewText);

    return NextResponse.json({
      success: true,
      message: "Weekly review sent",
      stats: {
        totalCaptures: weeklyActivity.total,
        activeProjects: activeProjects.length,
        newPeople: newPeopleCount,
        newIdeas: newIdeasCount,
      },
    });
  } catch (error) {
    console.error("Error generating weekly review:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly review" },
      { status: 500 }
    );
  }
}

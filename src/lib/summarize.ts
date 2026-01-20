import Anthropic from "@anthropic-ai/sdk";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return new Anthropic({ apiKey });
}

export interface DigestData {
  activeProjects: Array<{
    name: string;
    nextAction: string;
    status: string;
  }>;
  stalledProjects: Array<{
    name: string;
    nextAction: string;
    daysSinceUpdate: number;
  }>;
  overdueAdmin: Array<{
    task: string;
    daysPastDue: number;
  }>;
  pendingFollowUps: Array<{
    personName: string;
    followUps: string[];
  }>;
  recentlyCompleted: Array<{
    name: string;
  }>;
}

export interface WeeklyData extends DigestData {
  weeklyActivity: {
    total: number;
    byDestination: {
      people: number;
      projects: number;
      ideas: number;
      admin: number;
    };
    needsReview: number;
    corrected: number;
  };
  newPeople: number;
  newIdeas: number;
}

const DAILY_DIGEST_PROMPT = `You are a personal productivity assistant. Generate a brief, actionable morning digest based on the following data. Keep it under 180 words, friendly but focused. Use emojis sparingly.

IMPORTANT: Use Slack mrkdwn formatting (NOT standard Markdown):
- Bold text uses single asterisks: *bold* (not **bold**)
- Bullet points use • character
- Numbered lists work normally
- Italics use single underscores: _italic_

Format your response exactly like this:

Good morning! Here's your focus for today:

*Top 3 Actions:*
1. [Most important concrete action from active projects]
2. [Second important action]
3. [Admin item or follow-up if available]

*Might be stuck on:*
• [List any stalled projects - ones not updated in 7+ days]

*Small win to notice:*
• [Any recently completed item or positive progress]

*Daily Spark:*
_"[Inspirational quote about resilience, persistence, or entrepreneurship from a famous entrepreneur, founder, or historical figure - e.g. Steve Jobs, Sara Blakely, Winston Churchill, Marcus Aurelius, Elon Musk, Oprah, etc.]"_
— [Attribution]

Choose quotes that speak to pushing through struggle, finding resilience, embracing failure as learning, or maintaining focus during difficult times. Vary the sources - don't repeat the same person.

If there are overdue admin tasks, mention them prominently. If someone needs a follow-up, include that.

Data:`;

const WEEKLY_REVIEW_PROMPT = `You are a personal productivity assistant. Generate a weekly review summary based on the following data. Keep it under 250 words, insightful but concise. Use emojis sparingly.

IMPORTANT: Use Slack mrkdwn formatting (NOT standard Markdown):
- Bold text uses single asterisks: *bold* (not **bold**)
- Bullet points use • character
- Numbered lists work normally

Format your response exactly like this:

Your week in review:

*What happened:*
• X new captures processed
• Y projects moved forward
• Z new connections logged

*Biggest open loops:*
1. [Most pressing waiting/blocked project]
2. [Overdue admin item if any]
3. [Person needing follow-up if any]

*Suggested focus for next week:*
1. [Actionable recommendation based on data]
2. [Second recommendation]
3. [Third recommendation]

*Recurring theme noticed:*
[One sentence observation about patterns in the week's captures - common topics, areas of focus, etc.]

Be specific and reference actual project/task names from the data.

Data:`;

export async function generateDailyDigest(data: DigestData): Promise<string> {
  const anthropic = getAnthropicClient();

  const dataString = JSON.stringify(data, null, 2);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `${DAILY_DIGEST_PROMPT}\n\n${dataString}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
}

export async function generateWeeklyReview(data: WeeklyData): Promise<string> {
  const anthropic = getAnthropicClient();

  const dataString = JSON.stringify(data, null, 2);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `${WEEKLY_REVIEW_PROMPT}\n\n${dataString}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
}

import Anthropic from "@anthropic-ai/sdk";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  console.log("Anthropic API key present, length:", apiKey.length);
  return new Anthropic({ apiKey });
}

export type Destination = "people" | "projects" | "ideas" | "admin";

export interface ClassificationResult {
  destination: Destination;
  confidence: number;
  title: string;
  extractedFields: PeopleFields | ProjectFields | IdeaFields | AdminFields;
}

export interface PeopleFields {
  name: string;
  context: string;
  followUps: string[];
}

export interface ProjectFields {
  name: string;
  nextAction: string;
  notes: string;
}

export interface IdeaFields {
  title: string;
  oneLiner: string;
  notes: string;
}

export interface AdminFields {
  task: string;
  dueDate: string | null;
  notes: string;
}

const CLASSIFICATION_PROMPT = `You are a classification system for a personal knowledge management tool called Second Brain. Your job is to analyze incoming thoughts and classify them into one of four categories.

Categories:
- people: Information about specific individuals, relationships, follow-ups with people, notes about someone you met or need to contact
- projects: Active work items, goals, tasks with multiple steps, ongoing initiatives
- ideas: Concepts, insights, things to explore later, random thoughts worth saving
- admin: Errands, one-off tasks, appointments, logistics, simple to-dos

Analyze the following thought and return ONLY valid JSON with no additional text.

For "people", extract:
{
  "destination": "people",
  "confidence": 0.0-1.0,
  "title": "Short title (the person's name if mentioned)",
  "extractedFields": {
    "name": "Person's name",
    "context": "How you know them or their role",
    "followUps": ["Things to remember or do regarding this person"]
  }
}

For "projects", extract:
{
  "destination": "projects",
  "confidence": 0.0-1.0,
  "title": "Project name",
  "extractedFields": {
    "name": "Project name",
    "nextAction": "The very next concrete action to take",
    "notes": "Additional context"
  }
}

For "ideas", extract:
{
  "destination": "ideas",
  "confidence": 0.0-1.0,
  "title": "Idea title",
  "extractedFields": {
    "title": "Idea title",
    "oneLiner": "Core insight in one sentence",
    "notes": "Additional thoughts"
  }
}

For "admin", extract:
{
  "destination": "admin",
  "confidence": 0.0-1.0,
  "title": "Task summary",
  "extractedFields": {
    "task": "The task to complete",
    "dueDate": "ISO date string if mentioned, otherwise null",
    "notes": "Additional context"
  }
}

Be decisive. If you're unsure, make your best guess but lower the confidence score. A confidence below 0.6 means the item will be held for manual review.

Thought to classify:`;

export async function classifyThought(
  text: string
): Promise<ClassificationResult> {
  // Check for prefix override (e.g., "person:", "project:", "idea:", "admin:")
  const prefixMatch = text.match(/^(person|people|project|idea|admin):\s*/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1].toLowerCase();
    const cleanText = text.slice(prefixMatch[0].length);
    const destination = prefix === "person" ? "people" : prefix as Destination;

    // Still classify to extract fields, but force the destination
    const result = await callClaude(cleanText);
    return {
      ...result,
      destination,
      confidence: 1.0, // User-specified, so 100% confidence
    };
  }

  return await callClaude(text);
}

async function callClaude(text: string): Promise<ClassificationResult> {
  console.log("Starting Claude classification...");

  try {
    const anthropic = getAnthropicClient();
    console.log("Anthropic client created, calling API...");

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${CLASSIFICATION_PROMPT}\n\n"${text}"`,
        },
      ],
    });

    console.log("Claude API response received, parsing...");
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    console.log("Claude raw response:", content.text);
    const result = JSON.parse(content.text);
    console.log("Parsed classification:", result);
    return result as ClassificationResult;
  } catch (error) {
    console.error("Claude API error:", error instanceof Error ? error.message : error);
    console.error("Full error:", JSON.stringify(error, null, 2));
    throw error;
  }
}

import Anthropic from "@anthropic-ai/sdk";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  console.log("Anthropic API key present, length:", apiKey.length);
  return new Anthropic({ apiKey });
}

export type Destination = "people" | "projects" | "ideas" | "admin" | "vocabulary";

export interface ClassificationResult {
  destination: Destination;
  confidence: number;
  title: string;
  extractedFields: PeopleFields | ProjectFields | IdeaFields | AdminFields | VocabularyFields;
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

export interface VocabularyFields {
  word: string;
  definition: string;
  partOfSpeech: string | null;
  example: string | null;
  source: string | null;
}

const CLASSIFICATION_PROMPT = `You are a classification system for a personal knowledge management tool called Second Brain. Your job is to analyze incoming thoughts and classify them into one of four categories.

Categories:
- people: Information about specific individuals, relationships, follow-ups with people, notes about someone you met or need to contact
- projects: Active work items, goals, tasks with multiple steps, ongoing initiatives
- ideas: Concepts, insights, things to explore later, random thoughts worth saving
- admin: Errands, one-off tasks, appointments, logistics, simple to-dos
- vocabulary: New words to learn, vocabulary words with definitions, terms to remember, words to incorporate into daily use

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

For "vocabulary", extract:
{
  "destination": "vocabulary",
  "confidence": 0.0-1.0,
  "title": "The word itself",
  "extractedFields": {
    "word": "The vocabulary word",
    "definition": "Clear definition of the word",
    "partOfSpeech": "noun/verb/adjective/adverb/etc or null if unknown",
    "example": "Example sentence using the word, or null",
    "source": "Where the word was encountered (book, article, conversation), or null"
  }
}

Be decisive. If you're unsure, make your best guess but lower the confidence score. A confidence below 0.6 means the item will be held for manual review.

Thought to classify:`;

export async function classifyThought(
  text: string
): Promise<ClassificationResult> {
  // Check for prefix override (e.g., "person:", "project:", "idea:", "admin:", "vocab:")
  const prefixMatch = text.match(/^(person|people|project|projects|idea|ideas|admin|vocab|vocabulary|word):\s*/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1].toLowerCase();
    const cleanText = text.slice(prefixMatch[0].length);

    // Map singular prefixes to plural destination names
    const destinationMap: Record<string, Destination> = {
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
    const destination = destinationMap[prefix];

    console.log(`Prefix override detected: "${prefix}" -> "${destination}"`);

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
      model: "claude-opus-4-5-20251101",
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

    // Strip markdown code blocks if present
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonText);
    console.log("Parsed classification:", result);
    return result as ClassificationResult;
  } catch (error) {
    console.error("Claude API error:", error instanceof Error ? error.message : error);
    console.error("Full error:", JSON.stringify(error, null, 2));
    throw error;
  }
}

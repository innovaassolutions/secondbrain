import { WebClient } from "@slack/web-api";

const slackToken = process.env.SLACK_BOT_TOKEN;

export const slack = slackToken ? new WebClient(slackToken) : null;

export async function sendSlackMessage(
  channel: string,
  text: string,
  threadTs?: string
) {
  if (!slack) {
    console.error("Slack client not initialized - SLACK_BOT_TOKEN missing");
    return null;
  }

  return await slack.chat.postMessage({
    channel,
    text,
    thread_ts: threadTs,
  });
}

export async function addReaction(
  channel: string,
  timestamp: string,
  emoji: string
) {
  if (!slack) {
    console.error("Slack client not initialized - SLACK_BOT_TOKEN missing");
    return null;
  }

  return await slack.reactions.add({
    channel,
    timestamp,
    name: emoji,
  });
}

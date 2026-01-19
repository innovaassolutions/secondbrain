"use client";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function SettingsPage() {
  const confidenceThreshold = process.env.NEXT_PUBLIC_CONFIDENCE_THRESHOLD || "0.6";

  return (
    <DashboardLayout
      title="Settings"
      description="System configuration and information"
    >
      <div className="max-w-2xl space-y-6">
        {/* Classification Settings */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6
                        dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900
                         dark:text-zinc-100">
            Classification Settings
          </h2>
          <p className="mt-1 text-sm text-zinc-500
                        dark:text-zinc-400">
            How thoughts are automatically categorized
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-4
                            dark:bg-zinc-900">
              <div>
                <p className="font-medium text-zinc-900
                              dark:text-zinc-100">
                  Confidence Threshold
                </p>
                <p className="text-sm text-zinc-500
                              dark:text-zinc-400">
                  Items below this threshold require manual review
                </p>
              </div>
              <span className="text-2xl font-semibold text-zinc-900
                               dark:text-zinc-100">
                {Math.round(parseFloat(confidenceThreshold) * 100)}%
              </span>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4
                            dark:border-zinc-800">
              <p className="text-sm text-zinc-600
                            dark:text-zinc-400">
                To change the confidence threshold, update the <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">CONFIDENCE_THRESHOLD</code> environment variable.
              </p>
            </div>
          </div>
        </div>

        {/* Slack Integration */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6
                        dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900
                         dark:text-zinc-100">
            Slack Integration
          </h2>
          <p className="mt-1 text-sm text-zinc-500
                        dark:text-zinc-400">
            Capture and digest channel configuration
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-zinc-50 p-4
                            dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-900
                            dark:text-zinc-100">
                Capture Webhook
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-500
                            dark:text-zinc-400">
                /api/webhooks/slack/capture
              </p>
              <p className="mt-2 text-xs text-zinc-500
                            dark:text-zinc-400">
                Configure this URL in your Slack app&apos;s Event Subscriptions
              </p>
            </div>

            <div className="rounded-lg bg-zinc-50 p-4
                            dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-900
                            dark:text-zinc-100">
                Digest Channel
              </p>
              <p className="mt-1 text-xs text-zinc-500
                            dark:text-zinc-400">
                Set <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">SLACK_DIGEST_CHANNEL_ID</code> to receive daily digests and weekly reviews
              </p>
            </div>
          </div>
        </div>

        {/* Cron Jobs */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6
                        dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900
                         dark:text-zinc-100">
            Scheduled Tasks
          </h2>
          <p className="mt-1 text-sm text-zinc-500
                        dark:text-zinc-400">
            Automated digest and review generation
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-4
                            dark:bg-zinc-900">
              <div>
                <p className="font-medium text-zinc-900
                              dark:text-zinc-100">
                  Daily Digest
                </p>
                <p className="text-sm text-zinc-500
                              dark:text-zinc-400">
                  Morning summary of priorities and actions
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700
                               dark:bg-green-900/30 dark:text-green-400">
                7:00 AM SGT
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-4
                            dark:bg-zinc-900">
              <div>
                <p className="font-medium text-zinc-900
                              dark:text-zinc-100">
                  Weekly Review
                </p>
                <p className="text-sm text-zinc-500
                              dark:text-zinc-400">
                  Sunday summary of the week&apos;s activity
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700
                               dark:bg-blue-900/30 dark:text-blue-400">
                Sundays 4:00 PM SGT
              </span>
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6
                        dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900
                         dark:text-zinc-100">
            Environment Variables
          </h2>
          <p className="mt-1 text-sm text-zinc-500
                        dark:text-zinc-400">
            Required configuration for the system
          </p>

          <div className="mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-2 text-left font-medium text-zinc-500
                                 dark:text-zinc-400">
                    Variable
                  </th>
                  <th className="pb-2 text-left font-medium text-zinc-500
                                 dark:text-zinc-400">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 font-mono text-xs text-zinc-900
                                 dark:text-zinc-100">
                    NEXT_PUBLIC_CONVEX_URL
                  </td>
                  <td className="py-2 text-zinc-500
                                 dark:text-zinc-400">
                    Convex deployment URL
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs text-zinc-900
                                 dark:text-zinc-100">
                    ANTHROPIC_API_KEY
                  </td>
                  <td className="py-2 text-zinc-500
                                 dark:text-zinc-400">
                    Claude API for classification
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs text-zinc-900
                                 dark:text-zinc-100">
                    SLACK_BOT_TOKEN
                  </td>
                  <td className="py-2 text-zinc-500
                                 dark:text-zinc-400">
                    Slack bot for responses
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs text-zinc-900
                                 dark:text-zinc-100">
                    SLACK_SIGNING_SECRET
                  </td>
                  <td className="py-2 text-zinc-500
                                 dark:text-zinc-400">
                    Verify Slack requests
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs text-zinc-900
                                 dark:text-zinc-100">
                    SLACK_DIGEST_CHANNEL_ID
                  </td>
                  <td className="py-2 text-zinc-500
                                 dark:text-zinc-400">
                    Channel for digests
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs text-zinc-900
                                 dark:text-zinc-100">
                    CRON_SECRET
                  </td>
                  <td className="py-2 text-zinc-500
                                 dark:text-zinc-400">
                    Secure cron endpoints
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs text-zinc-900
                                 dark:text-zinc-100">
                    CONFIDENCE_THRESHOLD
                  </td>
                  <td className="py-2 text-zinc-500
                                 dark:text-zinc-400">
                    Classification threshold (0.6 default)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

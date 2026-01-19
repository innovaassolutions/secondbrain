# Second Brain System Architecture Plan

## Tech Stack Overview

| Component | Original Stack | Our Stack |
|-----------|---------------|-----------|
| Interface/Capture | Slack | Slack |
| Storage/Database | Notion | Convex |
| Automation | Zapier | Custom Next.js API Routes |
| Intelligence | Claude/ChatGPT | Claude API |
| Hosting | N/A | Vercel |
| Frontend | N/A | Next.js |

---

## Core Architecture Principles

Before diving into implementation details, these are the engineering principles from the source material that guide our design:

1. **Reduce the human's job to one reliable behavior** - Capture to Slack, everything else is automated
2. **Separate memory from compute from interface** - Convex (memory), API routes (compute), Slack + Next.js dashboard (interface)
3. **Treat prompts like APIs** - Structured JSON schemas, no creative variance
4. **Build trust mechanisms** - Audit logs, confidence scores, easy corrections
5. **Default to safe behavior when uncertain** - Hold items below confidence threshold
6. **Make output small, frequent, actionable** - Daily digest <150 words, weekly <250 words
7. **Use "next action" as unit of execution** - Concrete, executable tasks
8. **Prefer routing over organizing** - 4 buckets only (people, projects, ideas, admin)
9. **Keep categories and fields painfully small** - Minimal schema, add complexity only when needed
10. **Design for restart, not perfection** - No backlog guilt, easy to resume
11. **Build one workflow, attach modules later** - Core loop first, enhancements second
12. **Optimize for maintainability over cleverness** - Fewer moving parts, clear logs

---

## System Components

### 1. The Dropbox (Capture Point)
**Purpose:** Frictionless thought capture in under 5 seconds

**Implementation:**
- Slack private channel called `sb-inbox`
- Slack Outgoing Webhook configured to POST to our Next.js API
- One message = one thought, no organizing required
- Bot confirms receipt in thread

**Slack Configuration:**
- Create dedicated bot account for responses
- Set up outgoing webhook on `sb-inbox` channel
- Webhook URL: `https://[your-app].vercel.app/api/webhooks/slack/capture`

---

### 2. The Sorter (Classifier)
**Purpose:** AI determines which bucket each thought belongs to

**Implementation:**
- Next.js API route receives webhook payload
- Calls Claude API with classification prompt
- Returns structured JSON with:
  - `destination`: "people" | "projects" | "ideas" | "admin"
  - `confidence`: 0.0 - 1.0
  - `extracted_fields`: object with relevant data

**Classification Prompt Structure:**
```
You are a classification system. Analyze the following thought and return ONLY valid JSON.

Categories:
- people: Information about specific individuals, relationships, follow-ups with people
- projects: Active work items, goals, tasks with multiple steps
- ideas: Concepts, insights, things to explore later
- admin: Errands, one-off tasks, appointments, logistics

Return format:
{
  "destination": "people|projects|ideas|admin",
  "confidence": 0.0-1.0,
  "title": "Short descriptive title",
  "extracted_fields": { ...category-specific fields... }
}
```

---

### 3. The Form (Schema)
**Purpose:** Consistent data structure enabling reliable queries and automation

**Convex Schema Design:**

```typescript
// schema.ts (conceptual - actual Convex schema)

// People Database
people: {
  name: string,
  context: string,           // How you know them, their role
  followUps: string[],       // Things to remember for next conversation
  lastTouched: number,       // Timestamp
  tags: string[],
  createdAt: number,
  updatedAt: number,
}

// Projects Database
projects: {
  name: string,
  status: "active" | "waiting" | "blocked" | "someday" | "done",
  nextAction: string,        // MUST be concrete and executable
  notes: string,
  tags: string[],
  createdAt: number,
  updatedAt: number,
}

// Ideas Database
ideas: {
  title: string,
  oneLiner: string,          // Core insight in one sentence
  notes: string,
  tags: string[],
  createdAt: number,
}

// Admin Database
admin: {
  task: string,
  dueDate: number | null,
  status: "pending" | "done",
  notes: string,
  createdAt: number,
}

// Inbox Log (Audit Trail)
inboxLog: {
  originalText: string,
  destination: string,
  recordId: string | null,   // ID of created record (null if held)
  recordTitle: string,
  confidence: number,
  status: "filed" | "needs_review" | "corrected",
  slackPostId: string,  // For fix-button responses
  createdAt: number,
}
```

---

### 4. The Filing Cabinet (Memory Store)
**Purpose:** Persistent, queryable storage

**Convex Implementation:**
- Real-time database with automatic syncing
- Built-in queries and mutations
- Serverless functions for complex operations
- Native TypeScript support

**Key Convex Functions Needed:**
```
// Mutations
createPerson(data)
createProject(data)
createIdea(data)
createAdmin(data)
createInboxLog(data)
updateRecord(table, id, data)
markLogAsCorrected(logId, newDestination)

// Queries
getActiveProjecs()
getPeopleWithFollowUps()
getRecentInboxLogs(days)
getItemsNeedingReview()
getWeeklyActivity()
```

---

### 5. The Receipt (Audit Trail)
**Purpose:** Build trust through visibility

**Implementation:**
- Every capture logged to `inboxLog` table
- Fields captured:
  - Original text exactly as typed
  - Where it was filed
  - What title was assigned
  - Confidence score from AI
  - Timestamp
  - Slack post ID (for corrections)
  - Status (filed/needs_review/corrected)

**Dashboard View:**
- Next.js page showing recent inbox activity
- Filter by status, destination, confidence
- Click to see original → result transformation

---

### 6. The Bouncer (Confidence Filter)
**Purpose:** Prevent low-quality classifications from polluting the system

**Implementation:**
- Confidence threshold: 0.6 (configurable)
- If confidence < threshold:
  - Log to inboxLog with status "needs_review"
  - DO NOT create record in destination table
  - Bot replies in Slack: "I'm not sure where this belongs. Could you repost with a prefix like `person:`, `project:`, `idea:`, or `admin:`?"

**Prefix Override System:**
- If message starts with `person:`, `project:`, `idea:`, or `admin:`:
  - Skip classification
  - File directly to specified destination
  - Set confidence to 1.0 (user-specified)

---

### 7. The Tap on the Shoulder (Proactive Surfacing)
**Purpose:** Push useful information without requiring search

**Daily Digest (Morning):**
- Vercel Cron Job at configured time (e.g., 7:00 AM)
- Queries Convex:
  - Active projects with next actions
  - People with pending follow-ups
  - Admin items due today/overdue
- Sends to Claude with summarization prompt
- Posts to Slack DM (or dedicated `sb-digest` channel)

**Daily Digest Format (<150 words):**
```
🌅 Good morning! Here's your focus for today:

**Top 3 Actions:**
1. [Concrete next action from project]
2. [Concrete next action from project]
3. [Admin item or follow-up]

**Might be stuck on:**
- [Project that hasn't moved in 7+ days]

**Small win to notice:**
- [Recently completed item or progress made]
```

**Weekly Review (Sunday):**
- Vercel Cron Job at configured time (e.g., 4:00 PM Sunday)
- Queries Convex:
  - All inbox activity from past 7 days
  - Project status changes
  - New people/ideas added
- Sends to Claude with review prompt

**Weekly Review Format (<250 words):**
```
📊 Your week in review:

**What happened:**
- X new captures processed
- Y projects moved forward
- Z new connections logged

**Biggest open loops:**
1. [Waiting/blocked project]
2. [Overdue admin item]
3. [Person needing follow-up]

**Suggested focus for next week:**
1. [Action recommendation]
2. [Action recommendation]
3. [Action recommendation]

**Recurring theme noticed:**
[Pattern observation from the week's captures]
```

---

### 8. The Fix Button (Correction Mechanism)
**Purpose:** One-step error correction

**Implementation:**
- Bot reply includes instruction: "Reply `fix: [correct destination]` if I got this wrong"
- Slack webhook monitors for replies starting with `fix:`
- API route:
  1. Parses correct destination
  2. Moves record to correct table (or creates if was held)
  3. Updates inboxLog status to "corrected"
  4. Bot confirms: "Got it! Moved to [destination]."

**Fix Command Format:**
```
fix: people      → Reclassify as person
fix: project     → Reclassify as project
fix: idea        → Reclassify as idea
fix: admin       → Reclassify as admin
fix: delete      → Remove entirely (mark as deleted in log)
```

---

## API Routes Structure

```
/api
├── webhooks/
│   └── slack/
│       ├── capture.ts        # Incoming thoughts from sb-inbox
│       └── fix.ts            # Fix command handler
├── cron/
│   ├── daily-digest.ts       # Morning digest generation
│   └── weekly-review.ts      # Sunday review generation
├── ai/
│   ├── classify.ts           # Classification logic
│   └── summarize.ts          # Digest/review generation
└── internal/
    ├── slack.ts         # Slack API wrapper
    └── convex.ts             # Convex client utilities
```

---

## Next.js Dashboard Pages

```
/app
├── page.tsx                  # Dashboard home - today's focus
├── inbox/
│   └── page.tsx              # Inbox log with filters
├── people/
│   └── page.tsx              # People database view
├── projects/
│   └── page.tsx              # Projects database view
├── ideas/
│   └── page.tsx              # Ideas database view
├── admin/
│   └── page.tsx              # Admin tasks view
├── review/
│   └── page.tsx              # Manual review queue
└── settings/
    └── page.tsx              # Configuration (thresholds, timing, etc.)
```

---

## Environment Variables

```env
# Slack
SLACK_BOT_TOKEN=xoxb-xxxx
SLACK_SIGNING_SECRET=xxxx
SLACK_INBOX_CHANNEL_ID=xxxx
SLACK_DIGEST_CHANNEL_ID=xxxx  # Or user ID for DM

# Convex
CONVEX_DEPLOYMENT=xxxx
CONVEX_URL=https://xxxx.convex.cloud

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxx

# App Config
CONFIDENCE_THRESHOLD=0.6
DAILY_DIGEST_HOUR=7
WEEKLY_REVIEW_DAY=0  # 0 = Sunday
WEEKLY_REVIEW_HOUR=16
TIMEZONE=America/New_York
```

---

## Data Flow Diagrams

### Capture Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User types  │────▶│  Slack  │────▶│   Webhook   │
│ in sb-inbox │     │   Channel    │     │  (capture)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┘
                    ▼
           ┌────────────────┐
           │  Claude API    │
           │ (classify.ts)  │
           └───────┬────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   confidence ≥ 0.6    confidence < 0.6
          │                 │
          ▼                 ▼
   ┌──────────────┐   ┌──────────────┐
   │ Create record│   │ Log as       │
   │ in Convex    │   │ needs_review │
   └──────┬───────┘   └──────┬───────┘
          │                  │
          ▼                  ▼
   ┌──────────────┐   ┌──────────────┐
   │ Log to       │   │ Bot asks for │
   │ inboxLog     │   │ clarification│
   └──────┬───────┘   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Bot confirms │
   │ in thread    │
   └──────────────┘
```

### Daily Digest Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Vercel Cron │────▶│ Query Convex │────▶│ Claude API  │
│ (7:00 AM)   │     │ for active   │     │ summarize   │
└─────────────┘     │ items        │     └──────┬──────┘
                    └──────────────┘            │
                                               ▼
                                      ┌──────────────┐
                                      │ Post digest  │
                                      │ to Slack│
                                      └──────────────┘
```

### Fix Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User replies│────▶│  Slack  │────▶│   Webhook   │
│ "fix: idea" │     │   Thread     │     │   (fix)     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┘
                    ▼
           ┌────────────────┐
           │ Look up log by │
           │ post ID        │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │ Move/create    │
           │ record in      │
           │ correct table  │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │ Update log     │
           │ status         │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │ Bot confirms   │
           │ correction     │
           └────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Loop (Week 1)
**Goal:** Capture → Classify → Store → Confirm

1. Set up Convex project with schema
2. Set up Next.js project on Vercel
3. Configure Slack bot and webhook
4. Build `/api/webhooks/slack/capture` route
5. Build Claude classification integration
6. Test end-to-end capture flow

**Success Criteria:** Type a thought in Slack, see it appear in Convex with correct classification

### Phase 2: Trust Mechanisms (Week 2)
**Goal:** Inbox log + Bouncer + Fix button

1. Implement inbox logging for all captures
2. Add confidence threshold filtering
3. Build "needs review" flow with clarification request
4. Build `/api/webhooks/slack/fix` route
5. Build basic dashboard to view inbox log

**Success Criteria:** Low-confidence items held for review, fix command works

### Phase 3: Proactive Surfacing (Week 3)
**Goal:** Daily digest + Weekly review

1. Build daily digest Convex queries
2. Build Claude summarization integration
3. Set up Vercel cron for daily digest
4. Build weekly review queries and prompt
5. Set up Vercel cron for weekly review

**Success Criteria:** Receive useful daily/weekly digests in Slack

### Phase 4: Dashboard (Week 4)
**Goal:** Visual interface for browsing and editing

1. Build dashboard home with today's focus
2. Build database views (people, projects, ideas, admin)
3. Build manual review queue
4. Build settings page
5. Add inline editing capability

**Success Criteria:** Can view and edit all data through web interface

### Phase 5: Polish & Modules (Ongoing)
**Goal:** Refinement and optional enhancements

Potential additions:
- Voice capture (Whisper API integration)
- Calendar integration for meeting prep
- Email forwarding capture
- Mobile PWA for quick capture
- Birthday/anniversary reminders
- Project templates

---

## Cost Estimates

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|----------------------|
| Vercel | 100GB bandwidth, serverless functions | $0 (hobby) - $20 (pro) |
| Convex | 1M function calls, 1GB storage | $0 (starter) - $25 (pro) |
| Claude API | N/A | ~$5-15 (depends on volume) |
| Slack | Self-hosted or cloud | $0 (self-hosted) - $10/user (cloud) |

**Estimated total: $5-50/month** depending on usage and tier choices

---

## Security Considerations

1. **Webhook Verification:** Validate Slack webhook signatures
2. **API Key Protection:** Store all secrets in Vercel environment variables
3. **Convex Auth:** Implement authentication for dashboard access
4. **Rate Limiting:** Protect API routes from abuse
5. **Data Privacy:** All data stored in your own Convex instance
6. **HTTPS:** Enforced by Vercel by default

---

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Webhook fails | No bot confirmation | Check Vercel function logs, retry capture |
| Claude API down | Classification error logged | Items held in inboxLog, retry on next capture |
| Convex unavailable | Function errors | Vercel will retry, check Convex status |
| Low confidence spam | Review queue grows | Batch review through dashboard |
| Slack bot offline | No responses | Check bot token, reconnect |

---

## Operating Manual

### Daily Use
1. Capture thoughts to `sb-inbox` channel as they occur
2. Read morning digest, pick top actions
3. Occasionally check review queue if notified

### Weekly Use
1. Read Sunday review
2. Process any items in review queue
3. Update project statuses if needed

### If You Fall Off
1. **Don't catch up** - no guilt, no backlog processing
2. Do a 10-minute brain dump into `sb-inbox`
3. Resume normal capture tomorrow
4. System continues working automatically

### Maintenance
- Monthly: Review and archive completed projects
- Quarterly: Prune stale ideas, update people context
- As needed: Adjust confidence threshold based on accuracy

---

## Success Metrics

Track these to know the system is working:

1. **Capture consistency:** >5 captures per day average
2. **Classification accuracy:** >85% filed correctly (check via corrections)
3. **Digest engagement:** Reading daily digest >5 days/week
4. **Loop closure:** Projects moving from active → done
5. **Trust maintenance:** Using system for >30 days continuously

---

## Next Steps

1. **Read this plan thoroughly**
2. **Set up accounts:** Vercel, Convex, Slack (if not already)
3. **Start with Phase 1** - get the core capture loop working
4. **Iterate based on actual use** - don't over-engineer upfront
5. **Add complexity only when evidence says it's needed**

Remember: The goal is not a perfect system. The goal is closing open loops and freeing your brain to think instead of remember.

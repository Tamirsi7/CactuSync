# Product Brief: CactuSync
**Positive-Space Group Scheduling**

| | |
|---|---|
| **Author** | Tamir (PM / VC Analyst) |
| **Status** | MVP Shipped |
| **Date** | April 2026 |
| **Version** | 1.0 |

---

## 1. Problem Statement

Scheduling a meeting for groups of 3 or more people is a solved problem in theory and a broken one in practice.

**Root cause:** Existing tools are designed around calendar ownership and individual schedule transparency — not around the simpler question of "when is everyone free?"

### Observed Failure Modes

| Tool | Why It Fails |
|---|---|
| WhatsApp polls | Single-option, no overlap view, no time granularity |
| Doodle | Requires a host to manually enter options; scales poorly beyond 5 slots |
| Google Calendar "find a time" | Assumes every person maintains an accurate, up-to-date calendar. They don't. |
| Calendly | Built for 1:1 booking; not designed for multi-party group sessions |
| Excel / spreadsheet | Offline, manual, no real-time sync |

**Gap:** No lightweight tool exists that lets a group of 3–10 people quickly map their shared free time without requiring calendar setup, account creation, or schedule transparency.

---

## 2. User Insight

> *"People know their free time intuitively. They just don't have it written down anywhere."*

The critical realization: the problem isn't a lack of scheduling tools — it's that all tools try to work *from existing data* (calendar entries, booked slots) rather than asking users to quickly declare availability in the moment.

**Two real contexts that validated the problem:**

1. **University group work** — A 5-person psychology assignment required 3 days and 20+ WhatsApp messages to agree on a single 2-hour slot.
2. **VC deal coordination** — At Cactus Capital, scheduling startup pitches requires syncing at least two analysts. A recurring friction point in a context where speed matters.

Both scenarios share the same structure: small group, variable schedules, no shared calendar infrastructure, time-sensitive coordination need.

---

## 3. Target Users

**Primary:** University students coordinating group assignments, study sessions, or makeup lectures.

**Secondary:** Small teams (startups, VC analysts, academic staff) coordinating recurring multi-party meetings without a shared calendar system.

**User characteristics:**
- 3–10 people per session
- Mixed schedule discipline (some use calendars, most don't)
- Need a result fast (same day or next day)
- Reluctant to share full availability / personal schedule
- Mobile-first but comfortable with web

---

## 4. Solution Overview

CactuSync is a **positive-space scheduler**: instead of asking "when are you busy?", it asks "when are you free?" and overlays all responses into a real-time heatmap.

### Core Interaction Model

1. A session organizer creates a group and gets a shareable link
2. Participants join via the link (no account required)
3. Each person drags across time blocks on a weekly grid to mark free time
4. The grid updates in real time — blocks darken as more people mark the same slot
5. The group identifies the darkest block and books it

### Design Principles

- **Zero calendar dependency** — availability is declared manually, not imported
- **Visual over verbal** — dragging a block is faster and more intuitive than typing or clicking options
- **Privacy by design** — only initials are shown on overlap blocks; no full name or reason required
- **Overlap-first** — the interface is optimized to surface consensus, not individual schedules

---

## 5. Key Features (MVP)

| Feature | Description |
|---|---|
| Session creation | Named group session with shareable link |
| Weekly grid view | 7-day view, 30-min resolution, 8:00–22:00 |
| Drag-to-mark availability | Click and drag to paint free blocks |
| Real-time overlap heatmap | Color intensity = number of overlapping users |
| User initials on blocks | Shows who is available without exposing full identity |
| My Slots panel | Personal confirmed availability shown in sidebar |
| Auth (optional) | Account creation for session admin; join-by-link for participants |

---

## 6. What Was Deliberately Left Out (v1)

| Cut Feature | Reason |
|---|---|
| Calendar sync (Google / Apple) | Adds setup friction; data unreliability makes it misleading |
| Email / push notifications | Out of scope for MVP; coordination happens in existing channels (WhatsApp, Slack) |
| Recurring session support | Adds complexity; most group scheduling is ad hoc |
| Voting / priority ranking | Overlap heatmap already surfaces the consensus; additional voting is redundant |
| Mobile app | Web-responsive covers the use case; native app is post-PMF |

---

## 7. Success Metrics (if taken to v2)

| Metric | Target | Rationale |
|---|---|---|
| Time-to-first-slot-confirmed | < 10 min from session creation | Core job-to-be-done speed |
| Participant completion rate | > 70% of invited users submit availability | Measures friction in the join flow |
| Sessions with 3+ participants | > 50% of all sessions | Validates group (not 1:1) use case |
| Return session rate | > 30% of organizers create a second session | Proxy for product-market fit |

---

## 8. Build Approach: AI-Accelerated PM Prototyping

This MVP was built using **Lovable**, an AI-powered full-stack development platform, without a dedicated engineering team.

**Why this matters for product management:**

The traditional PM workflow — write a spec, hand off to engineering, wait for a sprint — creates a feedback delay that kills early-stage validation. By using AI tools to scaffold, iterate, and ship working software directly, I was able to:

- **Compress the idea-to-artifact cycle** from weeks to hours
- **Test the core interaction model** (drag-to-paint availability) with real users before any engineering investment
- **Maintain product ownership** throughout — design decisions, data model, UX flows all stayed with the PM, not delegated to an engineer

**This is the new PM skill set:** not learning to code, but knowing how to direct AI tools to build what you've designed.

### Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| UI Components | Tailwind CSS + shadcn/ui |
| Auth + Database | Supabase (PostgreSQL, row-level security) |
| Real-time sync | Supabase Realtime |
| Build platform | Lovable (AI full-stack IDE) |

---

## 9. Competitive Positioning

```
                    HIGH SETUP FRICTION
                           │
              Google Cal   │   Calendly
              "find a time"│   (enterprise)
                           │
LOW OVERLAP ───────────────┼─────────────── HIGH OVERLAP
VISIBILITY                 │                VISIBILITY
                           │
         WhatsApp polls    │   ★ CactuSync
         Doodle            │
                           │
                    LOW SETUP FRICTION
```

CactuSync occupies the empty quadrant: **high overlap visibility with low setup friction**. This is the gap no existing product addresses for small groups.

---

## 10. Roadmap (Post-MVP)

**v1.1 — Polish**
- Mobile-responsive grid improvements
- Session expiry / auto-archive
- Copy-link button on creation confirmation

**v1.2 — Collaboration**
- Comment thread on a confirmed slot ("works for me")
- Notification opt-in (email summary when quorum is reached)

**v2.0 — Scale**
- Organization / team workspaces (e.g., all Cactus Capital analysts in one workspace)
- Recurring availability templates ("I'm always free Tue/Thu 14:00–16:00")
- Slack / WhatsApp integration for link sharing with one click

---

*This brief is part of a product portfolio demonstrating end-to-end PM thinking: problem framing, user insight, scoped MVP, and AI-accelerated execution.*

# 🌵 CactuSync — Positive-Space Group Scheduling

> **Find shared availability instantly — no calendar sync, no friction, no excuses.**

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable%20AI-6C63FF?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjFDMTIgMjEgMyAxNSAzIDlDMyA2LjIzOSA1LjIzOSA0IDggNEM5LjY1NyA0IDExLjEzNiA0Ljc4OSAxMiA2QzEyLjg2NCA0Ljc4OSAxNC4zNDMgNCAxNiA0QzE4Ljc2MSA0IDIxIDYuMjM5IDIxIDlDMjEgMTUgMTIgMjEgMTIgMjFaIiBmaWxsPSIjRkY2QjZCIi8+PC9zdmc+)](https://lovable.dev)
[![Status](https://img.shields.io/badge/Status-Live%20MVP-brightgreen?style=flat-square)](https://github.com/Tamirsi7/CactuSync)
[![PM Project](https://img.shields.io/badge/Type-Product%20Management%20Portfolio-blue?style=flat-square)](https://github.com/Tamirsi7)

---

## The Problem I Was Living

Scheduling a group meeting sounds trivial right? It isn't.

I was coordinating a psychology assignment with a 5-person group. What should have taken 2 minutes consumed 20+ messages across three days. We tried WhatsApp polls — they're rigid and only capture a single option. We tried "just check your Google Calendar" — but realistically, most students don't log every class, personal commitment, or casual block. Calendar-based solutions assume a level of discipline that doesn't exist in the real world.

Then the same friction showed up at work. As a VC analyst at **Cactus Capital**, I coordinate startup pitch reviews requiring at least two analysts per session. Same problem, higher stakes.

The tools that exist today fall into two failure modes:
- **Too simple** (WhatsApp polls, Doodle) — rigid, single-option, no overlap visualization
- **Too complex** (Google Calendar sharing, Calendly) — require full schedule transparency, setup overhead, and assume everyone maintains an accurate calendar

**There was a clear gap: a lightweight, zero-friction tool for mapping shared *availability* — not shared *schedules*.**

---

## The Solution: Positive-Space Scheduling

CactuSync flips the model. Instead of asking "when are you busy?", it asks "when are you free?" — and visualizes the overlap in real time.

**Core insight:** People instinctively know their free time even when they haven't logged it anywhere. You don't need calendar sync. You just need a fast, visual way to mark it.

### How It Works

1. **Create a session** — give your group a name, get a shareable link
2. **Paint your availability** — drag across time blocks on a weekly grid
3. **See the overlap** — blocks darken as more people mark the same slot (color-coded by overlap density)
4. **Book the meeting** — the best time is immediately obvious

No account required for participants. No calendar permissions. No spreadsheet gymnastics.

---

## Product Screens

### Sign In / Session Creation
![CactuSync Login](./Screen%201.png)
*Clean entry point — minimal friction to get a group started*

### Live Availability Grid
![CactuSync Scheduler](./Screen%202.png)
*Real-time overlap visualization: darker = more people available. Initials show who's free at a glance.*

**What the interface communicates at a glance:**
- The week range being coordinated (Mar 15–21, 2026)
- Each participant's availability painted as colored blocks with their initials (TA, TC2, etc.)
- Overlap density via color intensity — the darker teal blocks with dots represent slots booked by multiple people
- A "Less → More" legend so the heatmap is immediately interpretable
- A left-panel list of your own confirmed slots for quick reference

---

## How I Built This (The AI-Accelerated PM Workflow)

This project demonstrates how modern PMs can move from **problem identification to working product** using AI-powered development tools — without being blocked by engineering bandwidth.

### Stack
- **Frontend:** React + TypeScript (Vite)
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend / Auth / DB:** Supabase (real-time sync, row-level security)
- **Build Tool:** [Lovable](https://lovable.dev) — AI-powered full-stack development platform

### The AI-First Development Process

Rather than writing boilerplate from scratch, I used **Lovable** to:

1. **Scaffold the full-stack architecture** — auth, database schema, and UI components generated from natural language prompts
2. **Iterate on UI/UX rapidly** — described the "paint-to-select" interaction model and Lovable implemented the drag-select calendar grid
3. **Handle real-time sync logic** — overlap calculation and heatmap coloring implemented through iterative prompting, not manual code
4. **Ship a working MVP in hours, not weeks**

This is exactly the workflow future PMs need to master: using AI tools not as a shortcut, but as **leverage** — to close the gap between product intuition and working software.

---

## Key Product Decisions

| Decision | Rationale |
|---|---|
| **No calendar integration** | Reduces setup friction to near-zero; calendar data is unreliable anyway |
| **Visual drag-select (not dropdowns)** | Matches the mental model of "painting" free time; faster than click-per-slot |
| **Initials on blocks, not full names** | Privacy-preserving; shows *who* is free without exposing full identity to all |
| **Overlap heatmap (not simple overlap)** | Handles groups of 3+; single-overlap tools break at scale |
| **Week-view default** | Most scheduling needs are near-term; week scope reduces cognitive load |
| **Link-share join (no group invite system)** | Removes onboarding friction; anyone with the link can participate |

---

## What This Project Demonstrates

### Product Management Skills
- **Problem discovery from lived experience** — identified the gap from recurring personal and professional friction
- **User empathy without formal research** — synthesized a 5-person group scenario + VC coordination use case into a single product insight
- **Scope discipline (MVP thinking)** — resisted feature creep (no recurring events, no calendar sync, no notifications v1)
- **First-principles UX reasoning** — questioned the dominant paradigm (calendar sync) and designed around the actual user behavior

### Technical Fluency
- **AI-accelerated development** — shipped a full-stack web app using Lovable, demonstrating the modern PM's ability to prototype independently
- **Real-time data modeling** — designed a schema where availability submissions aggregate into an overlap view without server-side calculation overhead
- **Auth + multi-user state** — handled team sessions with per-user data isolation and shared read access

---

## Who This Is For

| User | Use Case |
|---|---|
| Students | Study groups, assignment teams, makeup lecture coordination |
| VC / Startup teams | Coordinating analyst pairs for pitch reviews |
| Academic staff | Office hours scheduling across multiple TAs |
| Any 3–10 person group | Any recurring "when can we all meet?" problem |

---

## The Bigger Picture

CactuSync is a small product, but it represents a specific type of PM thinking I believe in deeply:

> **The best products solve problems that users have stopped complaining about — because they've accepted the friction as inevitable.**

Nobody files a bug report that "WhatsApp polls are bad for scheduling." They just suffer through it. The PM's job is to notice that, care enough to define it clearly, and be resourceful enough to build a solution — even without a dev team.

---

## About the Builder

**Tamir** — Product Management candidate with experience as a VC analyst at Cactus Capital. I build things to understand them, and I use AI tools to ship faster than the traditional PM-to-engineering handoff allows.

[GitHub](https://github.com/Tamirsi7) · Built with [Lovable](https://lovable.dev)

---

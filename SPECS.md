# My Buddy — Feature Specs

## Daily Session System (v6.1)
**Approved: March 31, 2026**

### Core Concept
Each calendar day (midnight to midnight) is an independent session. Core tracker progress and daily/recurring task completions are scoped to the current day. XP earned each day gets permanently banked into the cumulative total.

### Core Trackers (Hydration, Sleep, Meals)
Each tracker has a user-configurable daily goal. XP is awarded in **tiers** based on current slider position — not on the act of sliding:

| Tier | % of Goal | XP Awarded | Buddy State |
|------|-----------|------------|-------------|
| 0 | 0–49% | 0 XP | Sad / Needs care |
| 1 | 50–99% | 5 XP | Content |
| 2 | 100% | 10 XP | Happy |

**Behavior:** At any moment, the app calculates which tier each tracker is in and sets the XP accordingly. Sliding up and then back down recalculates — no double-earning is possible. The daily tracker XP is always: `sum of each tracker's current tier XP`.

### Mood Logic
Mood is determined by **majority vote** across all core trackers:
- Each tracker contributes a mood: Happy (≥100%), Content (50–99%), or Sad (<50%)
- The overall mood = whichever mood has the most votes
- If there's a 3-way tie (one of each), mood = Content (the average)
- If there's a 2-way tie between Happy and Sad (no Content), mood = Content

**Note:** If more trackers are added in the future, this logic may need adjustment for even-number ties.

### Daily / Recurring Tasks
- Each task awards its difficulty XP when checked off: Easy = 10, Medium = 25, Hard = 50
- Unchecking subtracts the XP
- Simple toggle within the daily session
- Recurring tasks only appear on their scheduled days
- Task completions are stored per-day for history tracking

### One-off Tasks
- Same XP values as above (Easy/Medium/Hard)
- Exist **outside** the daily session — they don't reset
- Completing one awards XP permanently
- Can optionally have a due date (future feature)
- Show a "Done [date]" stamp when completed

### Daily XP Calculation
```
dailyXP = (sum of tracker tier XP) + (sum of completed daily/recurring task XP)
```
One-off task XP is added directly to the permanent total, not to dailyXP.

### Day Transition
- When a new day begins, yesterday's `dailyXP` was already banked in real-time
- Today's trackers and daily tasks start fresh (sliders at 0, tasks unchecked)
- Chore completion history is retained in Firebase under `choreLog/{date}`

### History Dots
- 7-dot display (Mon–Sun) on each recurring task
- Reads from stored `choreLog/{date}` for the past 7 days
- Filled dot = task was completed that day
- Today's dot has an accent border

### XP & Leveling
| Level | Name | Total XP Required |
|-------|---------|------------------|
| 1 | Egg | 0 |
| 2 | Sprout | 500 |
| 3 | Bloom | 1,250 |
| 4 | Radiant | 2,250 |
| 5 | Stellar | 3,750 |

### Point Reference
| Source | XP |
|--------|-----|
| Core tracker at 50–99% | 5 |
| Core tracker at 100% | 10 |
| Easy task | 10 |
| Medium task | 25 |
| Hard task | 50 |

# My Buddy — Changelog

## v8.0 — March 31, 2026
### Warm Neutral Theme
- Complete visual overhaul from dark theme to warm neutral palette
- Cream backgrounds (#f5f0ea), warm brown text (#3a2e24), earthy borders
- All UI elements updated: tabs, cards, modals, buttons, inputs, sliders
- Environment scenes retain their own dark palettes for contrast
- iPhone status bar switched to light mode

### One-off Task Filtering
- One-off tasks in the Tasks tab now have filter pills: Upcoming, Last 7 Days, Last 30 Days, All
- Completed one-offs show their completion date and persist in history
- Empty states show context-appropriate messages per filter

### Color Fix Pass
- Comprehensive audit of all 100+ color references ensuring readability on light backgrounds
- Fixed transparent white backgrounds → warm brown tints
- Fixed invisible text on tabs, cards, buttons, and filter pills

---

## v7.0 — March 31, 2026
### Daily Session System Rework
- **Breaking change:** XP from core trackers now uses a tier system (0/5/10 XP per tracker based on 0-49%/50-99%/100% thresholds). No more double-earning from sliding up and down.
- **Daily session model:** Each day is independent. Trackers and daily tasks reset at midnight. XP is banked permanently in real-time.
- **Mood logic reworked:** Now uses majority vote across trackers (Happy/Content/Sad). Ties resolve to Content.
- **One-off tasks** now operate independently of the daily session — XP is permanent, task doesn't reset.

### Bug Fixes
- Fixed: Sliding tracker up/down could award duplicate XP
- Fixed: History dots not loading past days from Firebase correctly
- Fixed: Drag-and-drop on iOS selecting text instead of dragging — added drag handle icon and CSS user-select prevention
- Fixed: choreLog7 now properly syncs today's completions with history view

### New Features
- **Preview mode:** Add `?preview=true` to URL to skip auth and test with sample data
- **SPECS.md:** Formal feature specifications document added to repo
- **CHANGELOG.md:** This file — tracks all releases going forward

---

## v6.0 — March 31, 2026
- Added 7-day completion dot history on recurring tasks
- Added drag-to-reorder for tasks (long-press to pick up)
- Added task edit modal (tap task name to view/edit details)

## v5.0 — March 31, 2026
- Rebuilt slider with custom touch handling for smooth dragging
- Modal keyboard awareness (iOS safe area)
- Task detail/edit modal with name, type, frequency, difficulty editing

## v4.0 — March 31, 2026
- Added 6 environment backgrounds (Office, Living Room, Park, Rave, Beach, Forest)
- Environment picker in Collection tab
- Environment choice syncs to Firebase

## v3.0 — March 31, 2026
- iPhone safe area padding for notch/Dynamic Island
- Redesigned header with accent-colored icon
- Tabs moved below header with better contrast
- XP badge with accent tint

## v2.0 — March 31, 2026
- Firebase Realtime Database integration
- Google Sign-in authentication
- All data syncs to cloud (goals, tasks, birthdays, XP, buddy choice)
- Sign out option in settings

## v1.0 — March 31, 2026
- Initial release
- 4 buddy types (Pip, Slynk, Mochi, Bolt) with 5 evolution stages each
- Core trackers: Hydration, Sleep, Meals
- Task system: Daily, Recurring (various intervals), One-off
- Birthday database with search, filters, notes
- Birthday hat on buddy when wishes are sent
- Dark theme UI with accent colors per buddy

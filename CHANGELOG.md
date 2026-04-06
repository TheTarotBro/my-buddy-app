# My Circle — Changelog

## v1.2 — April 6, 2026
### Reconnect System + Icon + Fixes
- **Cadence system**: Every person gets a "keep in touch" cadence (default: monthly). Options: every 2 weeks, monthly, quarterly, annually, or N/A. Configurable at creation and in the new "Touch" profile tab
- **Touchpoint logging**: New "Touch" tab in person profiles — pick a type (Text, Call, Coffee, Postcard, Gift, Other), add an optional note, tap Log. History shows all past touchpoints
- **Reconnect card**: Homepage surfaces top 5 most overdue people, sorted by overdue ratio (shorter cadences prioritized). Shows days overdue and last contact. "View all" opens full list
- **Data migration**: Existing people automatically get monthly cadence with today as baseline — no flood on day one
- **Date input fix**: Birthday date pickers no longer overflow off the right edge of the screen on iOS
- **New app icon**: Forest green background with tan/cream connected dots forming a C shape
- Birthday wishes are tracked separately and do not reset touchpoint cadences

## v1.0 — April 6, 2026
### Personal CRM Launch
- Complete rebuild from My Buddy habit tracker into My Circle personal CRM
- **People tab (homepage)**: Search bar, upcoming birthdays card (next 3), alphabetical directory with letter headers, zodiac symbols, relationship/interest previews
- **Birthdays tab**: Full zodiac timeline preserved — rainbow color-coded signs, active sign split (upcoming/passed), tappable zodiac info modals, All/This Week/Next 30 Days filters
- **Person profile**: Tabbed modal (Info/Gifts/Events/Notes) with editable name, date, relationships, interests, gift tracking, life events timeline
- **Removed**: All tamagotchi elements — XP, levels, buddy avatars, environment scenes, mood system, daily trackers, task management
- **Kept**: Firebase persistence, Google Auth, day-change detection, birthday today banner, wishes system
- Codebase reduced from ~1260 lines to ~390 lines
- Renamed to "My Circle" throughout (app title, PWA manifest, login screen)
- Data fully backward-compatible — all existing people/birthday data loads seamlessly

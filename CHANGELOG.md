# My Circle — Changelog

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

# Table Naming Strategy

**Date:** 2024-12-19

## Current Table Names

The database currently uses these table names:
- `user_profile` - User profile information
- `coaching_tasks` - Coaching tasks for users
- `coaching_task_progress` - Task progress tracking
- `players_digest` - Player match data digest
- `matches_digest` - Match data digest

## Future Naming (English)

If you want to use English table names, you can:
1. Create database views with English names
2. Rename tables (requires migration)
3. Use aliases in code

### Option 1: Database Views (Recommended)

```sql
-- Create views with English names
CREATE VIEW profiles AS SELECT * FROM user_profile;
CREATE VIEW tasks AS SELECT * FROM coaching_tasks;
CREATE VIEW task_history AS SELECT * FROM coaching_task_progress;
```

### Option 2: Table Renaming (Migration Required)

```sql
ALTER TABLE user_profile RENAME TO profiles;
ALTER TABLE coaching_tasks RENAME TO tasks;
ALTER TABLE coaching_task_progress RENAME TO task_history;
```

## Current Implementation

The code currently uses:
- `user_profile` table (not `profiles`)
- `coaching_tasks` table (not `tasks`)
- `coaching_task_progress` table (not `task_history`)

If you want to switch to English names, update:
- `lib/services/profileService.ts` - Change table names in queries
- All components that query these tables


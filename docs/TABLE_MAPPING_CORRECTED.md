# Table Mapping Correction

**Date:** 2024-12-19  
**Status:** ✅ **CORRECTED**

---

## Critical Table Mapping

The service layer must use the **actual database table names**, not the logical English names:

| Logical Name | Actual Table Name | Usage |
|-------------|-------------------|-------|
| `profiles` | `user_profile` | User profile data |
| `tasks` | `coaching_tasks` | Coaching tasks |
| `task_history` | `task_history` | Task history (unchanged) |

---

## Files Updated

### `lib/services/profileService.ts`

**Before (INCORRECT):**
```typescript
.from('profiles')  // ❌ Wrong table name
.from('tasks')     // ❌ Wrong table name
```

**After (CORRECT):**
```typescript
.from('user_profile')      // ✅ Correct table name
.from('coaching_tasks')    // ✅ Correct table name
```

---

## Implementation Details

### `linkSteamAccount()`
- Uses: `user_profile` table
- Updates: `steam_id` field

### `getProfileOverview()`
- Uses: `user_profile` table (for profile data)
- Uses: `coaching_tasks` table (for active tasks)
- Uses: `user_statistics` table (for aggregated stats - unchanged)

---

## Verification

After deployment, verify:
- [ ] `linkSteamAccount()` successfully updates `user_profile.steam_id`
- [ ] `getProfileOverview()` fetches from `user_profile` and `coaching_tasks`
- [ ] No database errors related to table names
- [ ] Dashboard displays profile and tasks correctly

---

## Summary

✅ **All table names corrected to match actual database schema:**
- `profiles` → `user_profile` ✅
- `tasks` → `coaching_tasks` ✅
- `task_history` → `task_history` ✅ (unchanged)

The service layer now uses the correct table names as required.


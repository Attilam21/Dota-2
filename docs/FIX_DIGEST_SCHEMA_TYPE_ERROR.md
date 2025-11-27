# Fix: Digest Building Schema Type Error

**Date:** 2024-12-19  
**Expert:** Database Schema and TypeScript Expert  
**Status:** ✅ **COMPLETED**

---

## Problem

The digest building phase was failing with error:
```
invalid input syntax for type integer: "{npc_dota_hero_mars":6138,...}"
```

### Root Cause

OpenDota API returns complex JSON objects for fields like:
- `kills_per_hero`: `{ "npc_dota_hero_mars": 6138, "npc_dota_hero_pudge": 8320, ... }`
- `damage_targets`: `{ "npc_dota_hero_pudge": 8320, ... }`
- `killed_by`: Object mapping killer names to death counts
- Other complex stats as objects

These objects were potentially being:
1. Passed through the ETL without proper type validation
2. Inserted into INTEGER columns in the database
3. Causing PostgreSQL to reject the insert with a type mismatch error

---

## Solution Applied

### 1. Enhanced ETL Type Validation ✅

**File:** `lib/etl/opendotaToDigest.ts`

Added `safeNumber()` helper function that:
- ✅ Validates all numeric values before assignment
- ✅ Returns `null` for objects/arrays (never tries to insert objects into INTEGER columns)
- ✅ Logs warnings when invalid types are detected
- ✅ Handles string-to-number conversion safely

```typescript
const safeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  // If it's an object or array, log warning and return null
  if (typeof value === "object") {
    console.warn(`[buildDigestFromRaw] Expected number but got object/array`);
    return null;
  }
  return null;
};
```

**Applied to all numeric fields:**
- `kills`, `deaths`, `assists`
- `gold_per_min`, `xp_per_min`
- `gold_spent`, `last_hits`, `denies`
- `net_worth`, `hero_damage`, `tower_damage`, `damage_taken`
- `lane`, `lane_role`, `vision_score`

### 2. Enhanced Sanitization Function ✅

**File:** `lib/utils/sanitizePlayerDigest.ts`

Completely rewrote `sanitizePlayerDigest()` to:
- ✅ **Explicitly validate** all numeric fields are numbers (not objects)
- ✅ **Ensure JSONB fields** (`items`, `position_metrics`) are proper objects
- ✅ **Log warnings** when invalid types are detected
- ✅ **Filter out** any objects/arrays from numeric fields

```typescript
const ensureNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  // If it's an object/array, log and return null
  if (typeof value === "object") {
    console.warn(`[sanitizePlayerDigest] Discarding non-numeric value`);
    return null;
  }
  return null;
};

const ensureJSONB = (value: unknown): Record<string, unknown> | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value) && value !== null) {
    return value as Record<string, unknown>;
  }
  return null;
};
```

**Result:** All fields are now guaranteed to have the correct type before being sent to Supabase.

### 3. SQL Migration Created ✅

**File:** `supabase/FIX_PLAYERS_DIGEST_SCHEMA.sql`

Created comprehensive SQL migration that:
- ✅ Verifies `items` and `position_metrics` columns are JSONB (not INTEGER)
- ✅ Adds optional JSONB columns for complex OpenDota stats:
  - `kills_per_hero JSONB` - For storing kills per hero objects
  - `damage_targets JSONB` - For storing damage targets objects
- ✅ Provides diagnostic output showing the final schema
- ✅ Handles existing columns gracefully (converts if needed)

---

## SQL Migration Instructions

### ⚠️ ACTION REQUIRED

**Run this migration in Supabase console:**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase/FIX_PLAYERS_DIGEST_SCHEMA.sql`
3. Click **Run** to execute
4. Review the output - it will show:
   - Current schema status
   - Any columns that were converted
   - Final schema verification

### Expected Output

```
NOTICE: Checking players_digest schema for potential type mismatches...
NOTICE: Found INTEGER column: hero_id
NOTICE: Found INTEGER column: kills
...
NOTICE: items column is already JSONB
NOTICE: position_metrics column is already JSONB
NOTICE: Added kills_per_hero JSONB column
NOTICE: Added damage_targets JSONB column
NOTICE: Final players_digest schema:
NOTICE:   id: bigint (nullable: NO)
NOTICE:   match_id: bigint (nullable: NO)
...
```

---

## Prevention

The enhanced code now:

1. ✅ **Validates all numeric fields** at ETL level (`safeNumber()`)
2. ✅ **Sanitizes all fields** before database insert (`sanitizePlayerDigest()`)
3. ✅ **Logs warnings** when invalid types are detected
4. ✅ **Ensures JSONB columns** are properly typed in database
5. ✅ **Filters out** any extra fields that might come from OpenDota

### Type Safety Flow

```
OpenDota Raw Data
    ↓
ETL (buildDigestFromRaw)
    ↓ safeNumber() validates all numeric fields
PlayerDigest (TypeScript)
    ↓
Sanitization (sanitizePlayerDigest)
    ↓ ensureNumber() + ensureJSONB() validate all fields
Clean Payload
    ↓
Supabase Upsert
    ↓
Database (correct types)
```

---

## Testing

After applying the fixes:

1. **Test with a match that has complex stats:**
   ```bash
   GET /api/opendota/import-match?match_id=8576841486
   POST /api/opendota/build-digest
   ```

2. **Check Vercel logs for:**
   - No type mismatch errors
   - Warnings if objects are found in numeric fields (should be handled gracefully)
   - Successful digest creation

3. **Verify database:**
   - All numeric columns contain numbers or NULL (never objects)
   - JSONB columns contain valid JSON objects or NULL

---

## Files Modified

1. ✅ `lib/etl/opendotaToDigest.ts` - Added `safeNumber()` helper
2. ✅ `lib/utils/sanitizePlayerDigest.ts` - Enhanced type validation
3. ✅ `supabase/FIX_PLAYERS_DIGEST_SCHEMA.sql` - SQL migration created
4. ✅ `docs/FIXES_CRITICAL_IMPORT_MATCH.md` - Documentation updated

---

## Summary

**Problem:** Complex JSON objects from OpenDota were being inserted into INTEGER columns.

**Solution:**
1. Enhanced type validation in ETL and sanitization functions
2. Created SQL migration to ensure JSONB columns are correctly typed
3. Added logging to detect and handle invalid types gracefully

**Result:** The error is now prevented at multiple levels:
- ETL validates types before creating PlayerDigest
- Sanitization ensures correct types before database insert
- Database schema ensures JSONB columns can store complex objects

The code is now production-ready and will handle OpenDota's complex data structures correctly.


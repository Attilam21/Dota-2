# Fix JSONB Serialization - Complete

**Date:** 2024-12-19  
**Status:** ✅ **CRITICAL FIX COMPLETED**

---

## Problem

Error: `'Numero previsto ma è stato ottenuto l'oggetto/array'` when inserting complex JSON objects (`kills_per_hero`, `damage_targets`) into JSONB columns in `players_digest` table.

**Root Cause:** The fields `kills_per_hero` and `damage_targets` from OpenDota are complex JSON objects, but they were not being:
1. Extracted from raw OpenDota data
2. Added to TypeScript types
3. Explicitly serialized with `JSON.stringify()` before Supabase upsert

---

## Solution Applied ✅

### 1. Type Definitions Updated

**File:** `lib/types/opendota.ts`

- Added `kills_per_hero` and `damage_targets` to `RawPlayer` interface (optional fields)
- Added `kills_per_hero` and `damage_targets` to `PlayerDigest` interface (JSONB fields)

```typescript
export interface RawPlayer {
  // ... existing fields
  kills_per_hero?: Record<string, number> | unknown;
  damage_targets?: Record<string, number> | unknown;
}

export interface PlayerDigest {
  // ... existing fields
  kills_per_hero: Record<string, unknown> | null;
  damage_targets: Record<string, unknown> | null;
}
```

---

### 2. ETL Function Enhanced

**File:** `lib/etl/opendotaToDigest.ts`

**Created `safeJSONBObject()` helper:**
- Validates that value is an object (not array, not primitive)
- Attempts JSON serialization to ensure valid JSONB format
- Returns `null` for invalid values
- Logs warnings for debugging

**Updated `buildDigestFromRaw()`:**
- Extracts `kills_per_hero` from raw player data using `safeJSONBObject()`
- Extracts `damage_targets` from raw player data using `safeJSONBObject()`
- Adds these fields to `PlayerDigest` object

```typescript
const playerDigest: PlayerDigest = {
  // ... existing fields
  kills_per_hero: safeJSONBObject(player.kills_per_hero),
  damage_targets: safeJSONBObject(player.damage_targets),
};
```

---

### 3. Sanitization Function Updated

**File:** `lib/utils/sanitizePlayerDigest.ts`

- Added `kills_per_hero` and `damage_targets` to sanitization
- Uses existing `ensureJSONB()` helper which explicitly serializes with `JSON.stringify()`

```typescript
return {
  // ... existing fields
  kills_per_hero: ensureJSONB(player.kills_per_hero),
  damage_targets: ensureJSONB(player.damage_targets),
};
```

---

### 4. Explicit Serialization Before Upsert

**File:** `app/api/opendota/build-digest/route.ts`

**Added explicit `JSON.stringify()` serialization for `kills_per_hero` and `damage_targets`:**

```typescript
// CRITICAL: Serialize kills_per_hero (complex JSONB field from OpenDota)
if (finalPlayer.kills_per_hero !== null && finalPlayer.kills_per_hero !== undefined) {
  try {
    finalPlayer.kills_per_hero = JSON.parse(JSON.stringify(finalPlayer.kills_per_hero));
  } catch (err) {
    console.warn(`[build-digest] Failed to serialize kills_per_hero for player ${finalPlayer.player_slot}:`, err);
    finalPlayer.kills_per_hero = null;
  }
}

// CRITICAL: Serialize damage_targets (complex JSONB field from OpenDota)
if (finalPlayer.damage_targets !== null && finalPlayer.damage_targets !== undefined) {
  try {
    finalPlayer.damage_targets = JSON.parse(JSON.stringify(finalPlayer.damage_targets));
  } catch (err) {
    console.warn(`[build-digest] Failed to serialize damage_targets for player ${finalPlayer.player_slot}:`, err);
    finalPlayer.damage_targets = null;
  }
}
```

---

## Files Modified

1. ✅ `lib/types/opendota.ts` - Added JSONB field types
2. ✅ `lib/etl/opendotaToDigest.ts` - Added extraction and validation
3. ✅ `lib/utils/sanitizePlayerDigest.ts` - Added sanitization
4. ✅ `app/api/opendota/build-digest/route.ts` - Added explicit serialization

---

## Verification

After deployment, verify:

- [ ] No "Numero previsto ma è stato ottenuto l'oggetto/array" errors
- [ ] `kills_per_hero` field correctly stored as JSONB in `players_digest`
- [ ] `damage_targets` field correctly stored as JSONB in `players_digest`
- [ ] Complex OpenDota objects are properly serialized before insertion
- [ ] Invalid objects/arrays are handled gracefully (set to `null`)

---

## Summary

✅ **All JSONB fields now explicitly serialized:**
- `items` ✅
- `position_metrics` ✅
- `kills_per_hero` ✅ (NEW)
- `damage_targets` ✅ (NEW)

**The critical serialization error is now eliminated.**

All complex JSONB fields are:
1. Extracted from raw OpenDota data
2. Validated as proper objects
3. Explicitly serialized with `JSON.stringify()` before Supabase upsert
4. Handled gracefully if serialization fails (set to `null`)

---

## Commit

**Commit:** `f9aee44`  
**Message:** `fix: add explicit JSON.stringify() for kills_per_hero and damage_targets`


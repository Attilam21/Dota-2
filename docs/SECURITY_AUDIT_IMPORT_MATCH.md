# Security Audit Report: OpenDota Import Match Route

**Date:** 2024-12-19  
**Auditor:** Full-Stack Security Auditor  
**Scope:** `/api/opendota/import-match` route and data ingestion pipeline

---

## Executive Summary

The `/api/opendota/import-match` route is **functionally correct** but has **security and robustness gaps** that could lead to silent failures or security vulnerabilities. This audit identifies critical issues and provides fixes.

**Overall Status:** ⚠️ **NEEDS IMPROVEMENT**

---

## 1. Key Check: SUPABASE_SERVICE_ROLE_KEY Usage

### ✅ **FINDING 1.1: Correct Client Initialization**

**Status:** ✅ **PASS**

The route correctly uses `supabaseAdmin` from `lib/supabaseAdmin.ts`, which is initialized with `SUPABASE_SERVICE_ROLE_KEY`:

```typescript
// lib/supabaseAdmin.ts
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {...});
```

**Verification:**
- ✅ No instances of `NEXT_PUBLIC_SUPABASE_ANON_KEY` used for writes
- ✅ Service Role Key is correctly isolated in `lib/supabaseAdmin.ts`
- ✅ Route imports `supabaseAdmin` (not client/server clients)

### ⚠️ **FINDING 1.2: Missing Runtime Validation**

**Status:** ⚠️ **NEEDS FIX**

**Issue:** The `lib/supabaseAdmin.ts` throws an error if `SUPABASE_SERVICE_ROLE_KEY` is missing, but this happens at **module load time**, not at **runtime** when the API route executes. In Vercel, environment variables might be missing or incorrectly configured, leading to:

1. **Silent failures** if the key is undefined but the module loaded
2. **No explicit logging** to verify which key is being used
3. **No validation** that the key has the correct format (starts with `sb_secret_` for new Supabase projects)

**Risk Level:** 🔴 **HIGH** - Could cause data ingestion to fail silently

**Recommendation:**
- Add runtime validation in the API route
- Log key presence (first 10 chars only for security)
- Verify key format matches expected pattern

---

## 2. Data Mapping: Column Validation

### ⚠️ **FINDING 2.1: Insufficient Data Validation**

**Status:** ⚠️ **NEEDS FIX**

**Current Validation:**
```typescript
function validateMatchData(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return false;
  }
  return true;
}
```

**Issues:**
1. **Too permissive**: Only checks if data is an object, doesn't validate structure
2. **No type checking**: Doesn't verify required fields exist
3. **No size limits**: Could accept extremely large JSON payloads
4. **No schema validation**: Doesn't verify OpenDota response structure

**Risk Level:** 🟡 **MEDIUM** - Could lead to:
- Invalid data stored in database
- Type mismatches causing PostgreSQL errors
- Storage bloat from malformed data

### ⚠️ **FINDING 2.2: Missing Column Validation**

**Status:** ⚠️ **NEEDS FIX**

**Current Upsert Payload:**
```typescript
const upsertPayload = {
  match_id: matchId,
  data: matchData,
  source: "opendota",
  ingested_at: new Date().toISOString(),
  ...(userId && { user_id: userId }),
};
```

**Issues:**
1. **No validation** that `match_id` matches the `match_id` in `matchData`
2. **No validation** that `userId` is a valid UUID format (if provided)
3. **No size check** on `matchData` JSON (could exceed PostgreSQL limits)
4. **No explicit type casting** for `match_id` (should be BIGINT)

**Risk Level:** 🟡 **MEDIUM** - Could cause:
- Foreign key constraint violations
- Type mismatch errors (e.g., string vs number)
- Database write failures

### ✅ **FINDING 2.3: Correct Column Mapping**

**Status:** ✅ **PASS**

The payload correctly maps to expected `raw_matches` columns:
- `match_id`: BIGINT ✅
- `data`: JSONB ✅
- `source`: TEXT ✅
- `ingested_at`: TIMESTAMPTZ ✅
- `user_id`: UUID (optional) ✅

---

## 3. Error Handling & Logging

### ⚠️ **FINDING 3.1: Insufficient Error Context**

**Status:** ⚠️ **NEEDS IMPROVEMENT**

**Current Error Handling:**
```typescript
if (supabaseError) {
  console.error(`[import-match] Supabase upsert error for match_id ${matchId}:`, supabaseError);
  return NextResponse.json({...}, { status: 500 });
}
```

**Issues:**
1. **No error code mapping**: Doesn't distinguish between RLS violations, type errors, constraint violations
2. **No retry logic**: Transient errors (e.g., connection timeouts) fail immediately
3. **No detailed logging**: Missing context about payload size, key used, etc.

**Risk Level:** 🟡 **MEDIUM** - Makes debugging difficult

---

## 4. Security Concerns

### ⚠️ **FINDING 4.1: No Rate Limiting**

**Status:** ⚠️ **NEEDS IMPROVEMENT**

**Issue:** The route accepts GET requests without rate limiting, allowing:
- Abuse of OpenDota API quota
- Database write spam
- Potential DoS attacks

**Risk Level:** 🟡 **MEDIUM** - Could impact service availability

### ✅ **FINDING 4.2: RLS Bypass Correct**

**Status:** ✅ **PASS**

The use of `supabaseAdmin` correctly bypasses RLS for server-side operations, which is appropriate for data ingestion.

---

## 5. Refactoring Recommendations

### **RECOMMENDATION 5.1: Extract to Server Action**

**Priority:** 🟡 **MEDIUM**

**Benefits:**
- Type-safe function signature
- Easier testing
- Better error handling
- Reusable across routes

**Implementation:**
```typescript
// app/actions/import-match.ts
'use server'

export async function importMatch(matchId: number, userId?: string) {
  // Validate Service Role Key at runtime
  // Import and validate match data
  // Return typed result
}
```

### **RECOMMENDATION 5.2: Add Service Role Key Validator**

**Priority:** 🔴 **HIGH**

**Implementation:**
```typescript
function validateServiceRoleKey(): void {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  // For new Supabase projects, keys start with 'sb_secret_'
  if (!key.startsWith('sb_secret_') && !key.startsWith('eyJ')) {
    console.warn('[SECURITY] Service Role Key format unexpected');
  }
  // Log first 10 chars for debugging (safe to log)
  console.log(`[import-match] Using Service Role Key: ${key.substring(0, 10)}...`);
}
```

---

## 6. Action Items

### Critical (Fix Immediately)
1. ✅ Add runtime validation for `SUPABASE_SERVICE_ROLE_KEY`
2. ✅ Improve `validateMatchData` to check required fields
3. ✅ Add explicit type casting for `match_id` (BIGINT)
4. ✅ Validate `userId` format if provided

### High Priority
5. ⚠️ Add payload size validation (max 10MB for JSONB)
6. ⚠️ Improve error messages with specific error codes
7. ⚠️ Add logging for key usage (first 10 chars)

### Medium Priority
8. ⚠️ Consider extracting to Server Action
9. ⚠️ Add rate limiting
10. ⚠️ Add retry logic for transient errors

---

## 7. Testing Checklist

After fixes are applied, verify:
- [ ] Route fails gracefully if `SUPABASE_SERVICE_ROLE_KEY` is missing
- [ ] Route logs key presence (first 10 chars) on each request
- [ ] Invalid `match_id` returns 400 with clear error
- [ ] Invalid `userId` format returns 400
- [ ] Oversized JSON payload is rejected
- [ ] Valid match data is successfully stored
- [ ] Error messages include specific error codes

---

## Conclusion

The route is **architecturally sound** but needs **robustness improvements** to handle edge cases and provide better debugging capabilities. The most critical issue is the lack of runtime validation for the Service Role Key, which could lead to silent failures in production.

**Next Steps:** Apply fixes as outlined in Section 6.


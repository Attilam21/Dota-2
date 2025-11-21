# Implementation Plan - Sync Player Feature

This plan addresses the missing link between the frontend and the backend sync logic, allowing users to input a Dota 2 Player ID and populate the dashboard.

## User Review Required
> [!IMPORTANT]
> I will be modifying the `sync-player` API endpoint to return a structured JSON response. This might affect any other consumers if they existed (currently none known).

## Proposed Changes

### Frontend Components

#### [NEW] [SyncPlayerPanel.tsx](file:///c:/Users/attil/Desktop/nuovo/Dota-2/src/components/SyncPlayerPanel.tsx)
- Create a new component with:
    - Input field for `playerId`.
    - "Sincronizza dati giocatore" button.
    - Feedback states (loading, error, success).
    - `onSyncCompleted` callback prop.

#### [MODIFY] [PlayerSelector.tsx](file:///c:/Users/attil/Desktop/nuovo/Dota-2/src/components/PlayerSelector.tsx)
- Handle empty player list gracefully.
- Show informative message if no players are found.
- Avoid forcing `DEFAULT_PLAYER_ID` if it's not in the list.

### Dashboard Page

#### [MODIFY] [page.tsx](file:///c:/Users/attil/Desktop/nuovo/Dota-2/src/app/dashboard/page.tsx)
- Import `SyncPlayerPanel`.
- Integrate `SyncPlayerPanel` into the main view, especially for the empty state.
- Implement `refreshData` logic to reload matches and players after sync.
- Update "No matches" message to guide the user to sync.

### Backend API

#### [MODIFY] [route.ts](file:///c:/Users/attil/Desktop/nuovo/Dota-2/src/app/api/fzth/sync-player/route.ts)
- Add strict input validation for `playerId`.
- Wrap logic in `try/catch` for robust error handling.
- Return structured JSON response: `{ status: 'ok', playerId, matchesInserted, ... }`.

### Documentation

#### [MODIFY] [audit_antigravity_dota2.md](file:///c:/Users/attil/Desktop/nuovo/Dota-2/docs/audit_antigravity_dota2.md)
- Add "Test locale" section with verification steps.

## Verification Plan

### Manual Verification
1.  **Empty State**: Open dashboard with empty DB. Verify "Benvenuto" message and Sync Panel visibility.
2.  **Sync Process**: Enter a valid Dota 2 ID (e.g., `36771694` or `86745912`). Click Sync. Verify loading state.
3.  **Success State**: Verify success message. Verify dashboard automatically reloads and shows data (KPIs, matches).
4.  **Error Handling**: Enter invalid ID. Verify error message.

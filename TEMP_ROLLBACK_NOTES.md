# Temporary Test Bypass (Rollback Before Commit)

This workspace currently includes a temporary bypass to allow creating a session without selecting an employee, only for AI flow testing.

## Why
- Needed to test interview/AI pipeline quickly when employee selection blocks session start.

## Files Changed
- `frontend/src/pages/NewSession.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/hooks/useApi.ts`
- `backend/src/routes/session.routes.ts`

## Rollback Steps
1. In `frontend/src/pages/NewSession.tsx`:
- Remove temporary warning text about test mode.
- Restore start guard: do not allow `handleStart` without `selectedEmployeeId`.
- Restore Start button disabled condition to `!selectedEmployeeId || createSession.isPending`.

2. In `frontend/src/lib/api.ts`:
- Change `createSession(employeeId?: string | null)` back to required `createSession(employeeId: string)`.
- Restore body to always include `{ employeeId }`.

3. In `frontend/src/hooks/useApi.ts`:
- Change mutation function argument from optional employeeId back to required string.

4. In `backend/src/routes/session.routes.ts`:
- Remove temporary no-employee branch in POST `/api/sessions`.
- Restore required employee update/activity behavior.

5. Delete this file once rollback is complete.

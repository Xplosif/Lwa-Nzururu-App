---
name: First-login forced setup flow
description: How the isFirstLogin flag drives forced credential change on first use of auto-generated accounts
---

## Rule
When `user.isFirstLogin === true`, App.tsx renders `<SetupAccount />` directly (bypasses Layout), forcing credential change before any navigation.

**Why:** SetupAccount was previously in the unauthenticated route section only. When login sets user state AND navigates to /setup-account in the same tick, React batches the update — by the time the router evaluates, the user is authenticated and /setup-account was unreachable in the auth section, landing on NotFound.

**How to apply:**
- `App.tsx`: Before rendering `<Layout>`, check `if (user.isFirstLogin) return <SetupAccount />;`
- `SetupAccount.tsx`: Has two modes — unauthenticated (uses tempUsername+tempPassword hook) and authenticated (calls PUT /auth/profile with newUsername+newPassword via fetch, skips currentPassword when isFirstLogin=true)
- Backend: PUT /auth/profile skips `currentPassword` verification when `user.isFirstLogin === true`, and sets `isFirstLogin=false` + clears `tempUsername` when username or password is updated.

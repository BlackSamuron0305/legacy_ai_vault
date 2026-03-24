# Frontend Codebase Analysis Report

**Scope:** `d:\legacy_ai_vault\frontend\` — All config files, entry points, pages (39), hooks (6), lib (2), data (1), layout components (5), shared components (3), common components (2), UI components (49), and 1 NavLink component.

---

## Table of Contents

1. [Critical Issues (Must Fix)](#1-critical-issues-must-fix)
2. [Dead Code & Unused Files](#2-dead-code--unused-files)
3. [Hardcoded Values & Security Concerns](#3-hardcoded-values--security-concerns)
4. [Language Inconsistency (German/English)](#4-language-inconsistency-germanenglish)
5. [Missing Error Handling](#5-missing-error-handling)
6. [Code Duplication](#6-code-duplication)
7. [Mock Data in Production](#7-mock-data-in-production)
8. [TypeScript Configuration Issues](#8-typescript-configuration-issues)
9. [DemoMode / DemoSession Assessment](#9-demomode--demosession-assessment)
10. [Architecture & API Concerns](#10-architecture--api-concerns)
11. [Build & Deployment Observations](#11-build--deployment-observations)
12. [Per-File Issue Index](#12-per-file-issue-index)

---

## 1. Critical Issues (Must Fix)

### 1.1 ForgotPassword.tsx — Non-functional Page
**File:** `src/pages/ForgotPassword.tsx`
**Issue:** The entire form is non-functional. There is no `onSubmit` handler, no state management for the email input, and the submit button does nothing. Users who navigate here will be stuck on a dead page.
**Fix:** Implement password reset via `api.forgotPassword()` or remove the route and link.

### 1.2 Hardcoded ElevenLabs Agent ID (Secret Leak)
**Files:**
- `src/pages/Interview.tsx` line 10: `const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_8901kkq04wagefmr6qtbvw8ab0z2";`
- `src/pages/DemoSession.tsx` line 7: `const WIDGET_AGENT_ID = "agent_8901kkq04wagefmr6qtbvw8ab0z2";`

**Issue:** The ElevenLabs agent ID is hardcoded as a fallback in `Interview.tsx` and permanently hardcoded in `DemoSession.tsx`. This is not a secret per se, but it exposes the agent configuration and could be abused. `DemoSession.tsx` has no env var override at all.
**Fix:** Move to environment variable only. Remove hardcoded fallback.

### 1.3 Empty `catch` Blocks Hiding Errors
Seven locations silently swallow errors with no logging, toast, or user feedback:

| File | Line | Context |
|------|------|---------|
| `src/pages/NewSession.tsx` | 29 | `catch {}` — session creation failure is invisible to user |
| `src/pages/Interview.tsx` | 235 | `catch {` — endSession failure silently ignored |
| `src/pages/ReportDetail.tsx` | 35 | `catch {` — PDF generation failure hidden |
| `src/pages/ReportViewer.tsx` | 187 | `catch {` — fallback report load failure hidden |
| `src/pages/Reports.tsx` | 37 | `catch {` — PDF download falling back silently |
| `src/pages/TranscriptReview.tsx` | 104 | `catch {` — transcript polling failure hidden |
| `src/pages/TranscriptReview.tsx` | 129 | `catch {` — reprocess failure hidden |

**Fix:** Add at minimum `toast({ variant: 'destructive', ... })` or `console.error()` in each.

### 1.4 SettingsAccount — Delete Account Button Does Nothing
**File:** `src/pages/Settings.tsx`, `SettingsAccount` function
**Issue:** "Delete Account" button in Danger Zone has no `onClick` handler. It renders but does nothing.
**Fix:** Implement with confirmation dialog + `api.deleteAccount()` or remove the button.

### 1.5 SettingsIntegrations — All Connect Buttons Are Decorative
**File:** `src/pages/Settings.tsx`, `SettingsIntegrations` function
**Issue:** Integration buttons (Notion, Slack, Google Drive, Jira, BambooHR, Internal RAG) have no `onClick` handlers. Slack shows as "Connected" but this is hardcoded state, not from API.
**Fix:** Either implement or clearly mark as "Coming Soon."

---

## 2. Dead Code & Unused Files

### 2.1 `src/App.css` — 100% Dead Code (~50 lines)
Contains the default Vite template CSS: `.logo` spin animation, `.card`, `.read-the-docs`. None of these classes are used anywhere in the app. The entire file can be deleted.

### 2.2 `src/pages/Index.tsx` — Unused Lovable Template Page
Contains placeholder text: "Welcome to Your Blank App — Start building your amazing project here!" This is the default Lovable platform starter page. **It is imported in `App.tsx` but has NO route pointing to it.** Pure dead code.
**Fix:** Delete the file and its import.

### 2.3 `mockData.ts` — Not Imported Anywhere in Production Code
**File:** `src/data/mockData.ts` (~200+ lines)
Searched all `frontend/src/` files for `mockData` — **zero imports found**. The file exports `employees`, `sessions`, `knowledgeCategories`, `reports`, `transcriptSegments`, `extractedTopics`, `activityFeed`, `demoScenarios`, and `teamMembers`, but nothing references them.
**Fix:** Delete or move to a `__test__` directory.

### 2.4 `SettingsTeam` — Defined But Never Routed
**File:** `src/pages/Settings.tsx` line 168
The `SettingsTeam` function component is exported but never imported or used in any route in `App.tsx`. The settings router has routes for profile, account, ai, transcript, output, notifications, integrations, and appearance — but not team. There's a separate `/app/team` route using `Team.tsx` instead.
**Fix:** Remove `SettingsTeam` or route it.

### 2.5 `SettingsWorkspace` — Defined But Never Routed
**File:** `src/pages/Settings.tsx` line ~145
The `SettingsWorkspace` component is defined but never imported or rendered in any route.
**Fix:** Remove or route it under `/app/settings/workspace`.

### 2.6 `@elevenlabs/react` Package — Not Used
**File:** `package.json` lists `@elevenlabs/react` as a dependency.
**Actual usage:** Both `Interview.tsx` and `DemoSession.tsx` use the unpkg CDN script `https://unpkg.com/@elevenlabs/convai-widget-embed` directly — the npm package is never imported.
**Fix:** Remove from `package.json` dependencies.

### 2.7 `lovable-tagger` in `vite.config.ts`
The `componentTagger()` plugin from `lovable-tagger` is loaded in dev mode. This is a Lovable platform debugging tool that injects data attributes. It shouldn't be in a production project's config.
**Fix:** Remove the import and plugin, and remove `lovable-tagger` from `devDependencies`.

---

## 3. Hardcoded Values & Security Concerns

### 3.1 Hardcoded Speaker Name "Sarah Jenkins"
**File:** `src/pages/SessionDetail.tsx` line 206
```tsx
<span>{seg.speaker === 'ai' ? 'LegacyAI' : 'Sarah Jenkins'}</span>
```
All non-AI transcript speakers are rendered as "Sarah Jenkins" regardless of the actual employee.
**Fix:** Use `session.employeeName` or `seg.speakerName`.

### 3.2 Hardcoded Dashboard Stat
**File:** `src/pages/Dashboard.tsx`
"Reports Finalized: 3" is hardcoded as a number, not derived from API data.
**Fix:** Derive from `reports.filter(r => r.status === 'finalized').length`.

### 3.3 Hardcoded Onboarding Data
**File:** `src/pages/Onboarding.tsx` line 89
Employee list is hardcoded: `['Sarah Jenkins — Engineering', 'Marcus Chen — Operations']`. No API calls are made in the entire onboarding flow — departments, employees, and preferences are all local state that is never persisted.
**Fix:** Connect to API or document that this is a design-only prototype page.

### 3.4 Hardcoded Employee Placeholder in Add Dialog
**File:** `src/pages/Employees.tsx` line 29
`placeholder="Sarah Jenkins"` — minor, but shows the pattern of using demo data as defaults.

### 3.5 Hardcoded Team Members in SettingsTeam
**File:** `src/pages/Settings.tsx` line ~169
`SettingsTeam` contains hardcoded array of 4 team members. Not from API. (Component is also unused — see 2.4.)

### 3.6 Hardcoded Template Count in SettingsAI
**File:** `src/pages/Settings.tsx` line 222
"4 templates configured (Engineering, Operations, CS, Executive)" is static text, not derived from data.

### 3.7 Hardcoded Session Detail Timeline
**File:** `src/pages/SessionDetail.tsx`
The session timeline section has hardcoded dates and events not derived from session data.

---

## 4. Language Inconsistency (German/English)

The application is primarily in English. The following files contain German UI text:

### 4.1 `src/pages/DemoMode.tsx` — Entirely in German
All visible text is German: "Willkommen beim LegacyAI Demo", "Dein Name", "Szenario auswählen", "Wähle eine Persona", "Demo starten", "Offboarding", "Onboarding", etc.

### 4.2 `src/pages/DemoSession.tsx` — Entirely in German
Headings, labels, controls all in German: "Demo-Interview", "Score", "Themen erfasst", "Gespräch aktiv", "Onboarding-Begrüßung", "Offboarding-Interview".

### 4.3 `src/components/layout/SearchOverlay.tsx` — German Placeholders and Headings
- Line 44: `placeholder="Suchen – Sessions, Mitarbeiter, Wissen..."`
- Line 77: `heading="Mitarbeiter"` (Employees)
- Line 94: `heading="Wissensbereiche"` (Knowledge Areas)
- Line 100: `{c.cardCount} Karten` (Cards)

**Fix:** Translate all German text to English for consistency, or implement proper i18n.

---

## 5. Missing Error Handling

### 5.1 Admin.tsx — Unhandled Promise Rejections
**File:** `src/pages/Admin.tsx`
- `handleAddKey`: `await api.addApiKey(...)` has no try/catch
- `handleDeleteKey`: `await api.deleteApiKey(...)` has no try/catch
- Both will cause unhandled promise rejections on API failure.

### 5.2 Team.tsx — Unhandled Promise Rejections
**File:** `src/pages/Team.tsx`
- `handleRoleChange`: `await api.updateMemberRole(...)` has no try/catch
- `handleRemoveMember`: `await api.removeMember(...)` has no try/catch

### 5.3 Settings.tsx — Multiple Components Missing Error Handling
- `SettingsProfile.handleSave`: try/finally but no catch — error propagates
- `SettingsWorkspace.handleSave`: same pattern
- `SettingsAI/Output/Appearance.handleSave`: calls `update(local)` which may throw

### 5.4 EmployeeDetail.tsx — Hardcoded Gaps
**File:** `src/pages/EmployeeDetail.tsx`
"Unresolved Gaps" section shows three hardcoded bullet points (vendor contact handover, infrastructure access, budget approval) rather than data from the API.

---

## 6. Code Duplication

### 6.1 `NetworkPattern` SVG Component — Duplicated 3×
Identical animated SVG mesh component defined in:
- `src/pages/Login.tsx` line 7
- `src/pages/Register.tsx` line 7
- `src/pages/RegisterCompany.tsx` line 7

**Fix:** Extract to `src/components/shared/NetworkPattern.tsx` and import.

### 6.2 Chat Panel Pattern — Duplicated
Similar chat panel implementations exist in:
- `src/pages/ReportViewer.tsx` — `ReportChat` component
- `src/pages/CategoryDetail.tsx` — `KnowledgeChat` component
- `src/pages/SessionDetail.tsx` — inline chat overlay

All share the same layout (fixed panel, message list, input, typing indicator). Minor variations in API call.
**Fix:** Extract a shared `ChatPanel` component.

### 6.3 ElevenLabs Widget Integration — Duplicated
Both `Interview.tsx` and `DemoSession.tsx` duplicate the widget script loading logic and define `WIDGET_SCRIPT_URL` independently.
**Fix:** Extract shared ElevenLabs widget utilities.

### 6.4 Footer — Duplicated Across Marketing Pages
The same footer block `© 2026 LegacyAI` + "Back to Home" link is copy-pasted across: About, Blog, Features, Pricing, Security, Privacy, Terms, UseCaseDetail.
**Fix:** Extract a `PublicFooter` component.

### 6.5 Background Blobs — Duplicated
The decorative blob + grain background pattern is duplicated across every marketing page (About, Blog, Features, Pricing, Security, Privacy, Terms, UseCaseDetail).
**Fix:** Extract to a `PublicPageLayout` wrapper component.

---

## 7. Mock Data in Production

### 7.1 `src/data/mockData.ts`
~200+ lines of hardcoded mock data. Not imported anywhere in production code (confirmed via workspace-wide search). Can be safely deleted.

### 7.2 Inline Mock Data
Several components contain hardcoded data that should come from APIs:
- **`NewSession.tsx` lines 7-20:** Session templates hardcoded as an array
- **`Onboarding.tsx`:** Entire 4-step wizard uses local state with hardcoded data
- **`SettingsTeam`:** Hardcoded 4-person team array
- **`SettingsIntegrations`:** Hardcoded 6-integration array with statically set connected/disconnected status
- **`EmployeeDetail.tsx`:** Unresolved gaps are three hardcoded strings
- **`SessionDetail.tsx` line 206:** Non-AI speakers all labeled "Sarah Jenkins"
- **`Dashboard.tsx`:** "Reports Finalized: 3" is a literal

---

## 8. TypeScript Configuration Issues

**File:** `tsconfig.app.json`
```json
"strict": false,
"noImplicitAny": false,
"noUnusedLocals": false,
"noUnusedParameters": false,
"strictNullChecks": false
```

Every safety net is disabled. This allows:
- Implicit `any` types throughout (many components use `any` for API responses)
- Unused imports/variables to accumulate silently
- Null/undefined access without checks
- Type coercion bugs

**Recommendation:** Enable incrementally: `noUnusedLocals` → `noImplicitAny` → `strictNullChecks` → `strict`.

---

## 9. DemoMode / DemoSession Assessment

### Should These Exist?
**DemoMode.tsx** and **DemoSession.tsx** are public demo pages (no auth required) accessible at `/demo` and `/demo/session`.

**Concerns:**
1. **All text in German** while the rest of the app is English (see §4)
2. **DemoSession.tsx** hardcodes the ElevenLabs agent ID with **no env var override** — meaning the production agent is used for demos
3. DemoSession embeds the ElevenLabs widget **publicly without authentication** — anyone can consume API credits
4. The demo scenario selection (Offboarding/Onboarding) passes the choice via URL query params to the agent via `dynamic-variables`, which is fine architecturally
5. Both pages are visually distinct from the main app design (rounded corners, colored accents vs. the sharp/minimal design used elsewhere)

**Recommendation:** If demos are needed, they should:
- Be in English (or respect i18n settings)
- Use a separate ElevenLabs agent ID for demos (to limit cost exposure)
- Potentially require a link token to prevent abuse
- Match the design system of the main application

---

## 10. Architecture & API Concerns

### 10.1 Dual Toaster Systems
**File:** `src/App.tsx` lines 123-124
Both `<Toaster />` (Radix) and `<Sonner />` are rendered simultaneously. Components use both `useToast` (Radix) and `toast()` from Sonner inconsistently.
**Fix:** Pick one toast system and remove the other.

### 10.2 `useClassification.ts` Is Not a Hook
**File:** `src/hooks/useClassification.ts`
Despite being in the `hooks/` directory and named with `use-` prefix, this file contains a plain async function that doesn't use any React hooks. It's just a thin wrapper around `api.getSessionClassification()`.
**Fix:** Either convert to a proper React Query hook or move to a `utils/` directory.

### 10.3 No React.StrictMode
**File:** `src/main.tsx`
The app renders without `<React.StrictMode>`, which helps catch common bugs during development.
**Fix:** Wrap `<App />` in `<React.StrictMode>`.

### 10.4 `package.json` Name Not Updated
**File:** `package.json`
```json
"name": "vite_react_shadcn_ts"
```
This is the Lovable platform template name. Should be `"legacy-ai-frontend"` or similar.

### 10.5 Interview.tsx — Shadow DOM Hacking
**File:** `src/pages/Interview.tsx`
The component traverses the ElevenLabs widget's shadow DOM to find and programmatically click start/end buttons. This is extremely fragile — any widget update can break it.
```tsx
// Traverses shadow roots to find buttons
const root = widget?.shadowRoot;
```

### 10.6 Interview.tsx — Type Mismatch in endSession
**File:** `src/pages/Interview.tsx`
The `endSession` API call passes `{ agentId }` but the TypeScript type definition for the endpoint doesn't include this field. Works at runtime because TS strict mode is off, but indicates a type gap.

### 10.7 AppLayout.tsx Imports JoinCompany Page Directly
**File:** `src/components/layout/AppLayout.tsx` line 7
A layout component imports a full page component (`JoinCompany`) to render inline when users don't have a workspace. This couples the layout to page logic.

---

## 11. Build & Deployment Observations

### 11.1 Dockerfile Uses Old nginx Approach
**File:** `Dockerfile`
The multi-stage build copies the static build to nginx. The nginx config proxies `/api/` to `backend:3001`, which couples the frontend Docker image to a specific backend service name.

### 11.2 Vercel Config Also Present
**File:** `vercel.json`
Contains rewrites to proxy `/api/` and `/ws/`. Having both Docker/nginx and Vercel deployment configs may cause confusion about which is canonical.

### 11.3 Console Statements in Production Code
- `src/pages/Interview.tsx` line 152: `console.debug(...)` — ElevenLabs conversation started
- `src/pages/Interview.tsx` line 163: `console.debug(...)` — ElevenLabs conversation ended
- `src/pages/NotFound.tsx` line 8: `console.error(...)` — 404 logging

The debug statements in Interview.tsx should be removed or gated behind a debug flag.

---

## 12. Per-File Issue Index

| Severity | File | Issue |
|----------|------|-------|
| 🔴 CRITICAL | `src/pages/ForgotPassword.tsx` | Entire page non-functional |
| 🔴 CRITICAL | `src/pages/NewSession.tsx:29` | Empty catch — session creation failures invisible |
| 🔴 CRITICAL | `src/pages/Settings.tsx` (SettingsAccount) | Delete Account button does nothing |
| 🟠 HIGH | `src/pages/Interview.tsx:10` | Hardcoded ElevenLabs agent ID fallback |
| 🟠 HIGH | `src/pages/DemoSession.tsx:7` | Hardcoded ElevenLabs agent ID, no env var |
| 🟠 HIGH | `src/pages/SessionDetail.tsx:206` | All speakers hardcoded as "Sarah Jenkins" |
| 🟠 HIGH | `src/pages/Admin.tsx` | API calls with no try/catch |
| 🟠 HIGH | `src/pages/Team.tsx` | API calls with no try/catch |
| 🟠 HIGH | `src/pages/Interview.tsx` | Shadow DOM traversal — fragile |
| 🟠 HIGH | `tsconfig.app.json` | All strict checks disabled |
| 🟡 MEDIUM | `src/App.css` | 100% dead code — entire file |
| 🟡 MEDIUM | `src/pages/Index.tsx` | Unused Lovable template page |
| 🟡 MEDIUM | `src/data/mockData.ts` | 200+ lines not imported anywhere |
| 🟡 MEDIUM | `src/pages/DemoMode.tsx` | All text in German |
| 🟡 MEDIUM | `src/pages/DemoSession.tsx` | All text in German |
| 🟡 MEDIUM | `src/components/layout/SearchOverlay.tsx` | German UI text mixed in |
| 🟡 MEDIUM | `src/App.tsx` | Dual toaster (Sonner + Radix) |
| 🟡 MEDIUM | `src/pages/Login.tsx:7` | NetworkPattern duplicated (also Register, RegisterCompany) |
| 🟡 MEDIUM | `src/pages/Dashboard.tsx` | Hardcoded "Reports Finalized: 3" |
| 🟡 MEDIUM | `src/pages/Onboarding.tsx` | No API calls — entirely local/hardcoded |
| 🟡 MEDIUM | `src/pages/Settings.tsx:168` | SettingsTeam defined but never routed |
| 🟡 MEDIUM | `src/pages/Settings.tsx:~145` | SettingsWorkspace defined but never routed |
| 🟡 MEDIUM | `src/pages/Settings.tsx` (Integrations) | All Connect buttons are decorative |
| 🟡 MEDIUM | `src/pages/EmployeeDetail.tsx` | Unresolved gaps are hardcoded strings |
| 🟡 MEDIUM | `src/hooks/useClassification.ts` | Not actually a React hook |
| 🟡 MEDIUM | `package.json` | `@elevenlabs/react` installed but never imported |
| 🟡 MEDIUM | `src/pages/Interview.tsx:152,163` | console.debug in production |
| 🟡 MEDIUM | `src/pages/Interview.tsx` | endSession passes agentId not in TS type |
| 🟡 MEDIUM | Marketing pages (8 files) | Footer/blobs duplicated across every page |
| 🔵 LOW | `package.json` | Name still "vite_react_shadcn_ts" |
| 🔵 LOW | `src/main.tsx` | No React.StrictMode |
| 🔵 LOW | `vite.config.ts` | lovable-tagger dev dependency |
| 🔵 LOW | `src/pages/Employees.tsx:29` | Placeholder "Sarah Jenkins" |
| 🔵 LOW | `src/pages/Settings.tsx:222` | Hardcoded "4 templates configured" |
| 🔵 LOW | `vercel.json` + `Dockerfile` | Two deployment strategies may cause confusion |

---

## TEMP_ROLLBACK_NOTES

Searched the entire `frontend/` directory for `TEMP_ROLLBACK` — **no matches found**. The `TEMP_ROLLBACK_NOTES.md` file exists at the repository root level but has no references or impact within the frontend codebase.

---

## Summary Statistics

- **Files with critical issues:** 3
- **Files with high-severity issues:** 5
- **Files with medium-severity issues:** 19
- **Total dead code files:** 3 (App.css, Index.tsx, mockData.ts)
- **Empty catch blocks:** 7
- **German text in English app:** 3 files
- **Duplicate code patterns:** 5 (NetworkPattern, ChatPanel, Footer, Blobs, ElevenLabs widget)
- **Hardcoded values replacing dynamic data:** 8+
- **Non-functional UI elements:** 3 (ForgotPassword form, Delete Account button, Integration Connect buttons)
- **Unused exports/components:** 3 (SettingsTeam, SettingsWorkspace, Index page)
- **Unused npm packages:** 2 (@elevenlabs/react, lovable-tagger)

# ABES Attendance Tracker (Chrome/Edge Extension + Web Dashboard)

A secure, local-first browser companion and analytics dashboard designed specifically for students of **ABES Engineering College** (`erp.abes.ac.in`).

It automatically captures attendance snapshots whenever you legitimately log in and view your ERP attendance page. It allows you to track attendance, calculate bunk allowances, simulate lecture scenarios, and view analytics anytime **without repeatedly re-logging into the ERP or entering OTPs**.

---

## Architecture & Security Principles

```
  ┌───────────────────────────────────────────────┐
  │       Official ABES ERP Portal (Web)          │
  │            https://erp.abes.ac.in/            │
  └──────────────────────┬────────────────────────┘
                         │ (Authenticated by Student via standard credentials & OTP)
                         ▼
  ┌───────────────────────────────────────────────┐
  │    Extension Content Script (Passive Reader)  │
  │  - Resilient DOM table parser                 │
  │  - Dynamic header matcher (regex)             │
  │  - Zero access to credentials / passwords     │
  │  - Zero OTP interception or CAPTCHA bypass    │
  └──────────────────────┬────────────────────────┘
                         │ (Clean parsed data snapshot)
                         ▼
  ┌───────────────────────────────────────────────┐
  │    Local-First Storage (On Your Machine)      │
  │  - chrome.storage.local / LocalStorage        │
  │  - Historical snapshots & subject metrics     │
  └──────────────┬─────────────────┬──────────────┘
                 │                 │
                 ▼                 ▼
  ┌────────────────────────┐  ┌──────────────────────────────────────────┐
  │  Extension Popup UI    │  │    React + TypeScript Dashboard          │
  │  - Instant percentage  │  │    - 88% Radial Progress Gauge           │
  │  - ERP status dot      │  │    - 12 Enrolled Subjects Breakdown      │
  │  - Quick bunk cushion  │  │    - Interactive What-If Simulator       │
  │  - 1-click open dash   │  │    - 75% / 80% / 85% Target Planners     │
  └────────────────────────┘  │    - Historical Progression Chart        │
                              └──────────────────────────────────────────┘
```

### Security Compliance Checklist
- **Zero Credential Access**: The extension never reads, intercepts, or stores your student username, password, or cookies.
- **Zero OTP Bypass**: Does not interact with or automate OTP authentication.
- **Zero CAPTCHA Tampering**: Respects ERP security and never bypasses verification forms.
- **Local-First Privacy**: Attendance snapshots are stored exclusively on your local device.
- **Passive Read Only**: The parser only activates when an authenticated student visits their attendance view.
- **Session Expiry Handling**: If an ERP session times out, the system notifies you: *"ERP session expired — please login normally to sync again"*, preserving all previously cached data.

---

## How to Install the Extension in Chrome / Edge

1. **Build the extension and dashboard**:
   ```bash
   npm run build
   ```
2. **Open Extensions in Chrome or Edge**:
   - In Google Chrome, go to: `chrome://extensions/`
   - In Microsoft Edge, go to: `edge://extensions/`
3. **Enable Developer Mode**:
   - Toggle the **Developer mode** switch in the top-right corner.
4. **Load Unpacked Extension**:
   - Click the **Load unpacked** button in the top-left corner.
   - Select the `extension` folder inside this repository:
     `c:\Users\aniv8\Desktop\ERP\extension`
5. **Pin the Extension**:
   - Click the puzzle piece (Extensions) icon on your browser toolbar and pin **ABES Attendance Tracker**.

---

## How to Run the Web Dashboard Locally

You can use the dashboard in two ways:

### Option A: As an Extension Tab (Zero Setup)
Click **Open Full Dashboard** from the extension popup. The built dashboard opens in a browser tab directly from extension resources (`chrome-extension://<id>/dashboard/index.html`).

### Option B: As a Standalone Dev Server
Run the Vite development server:
```bash
npm run dev:dashboard
```
Open `http://localhost:5173/` in your browser. The dashboard automatically syncs with local storage and comes preloaded with the official ABES sample dataset.

---

## How the Extension Detects the ABES Attendance Page

The detection and parsing pipeline resides in [`extension/src/parser/attendance-parser.ts`](file:///c:/Users/aniv8/Desktop/ERP/extension/src/parser/attendance-parser.ts) and [`extension/src/parser/dom-selectors.ts`](file:///c:/Users/aniv8/Desktop/ERP/extension/src/parser/dom-selectors.ts):

1. **Host Matching**:
   The content script only activates on `*://erp.abes.ac.in/*`.
2. **Session Verification**:
   Before parsing, it inspects the document for session expiry triggers:
   - Login URLs (`Login.aspx`, `default.aspx`)
   - Visible `<input type="password">` elements
   - Text banners like `"session expired"` or `"please login again"`
3. **Dynamic Column Mapping**:
   Instead of hardcoding numeric column indices (e.g. assuming column 0 is always Code), the parser scans `<th>` or first `<tr>` elements against case-insensitive regex patterns:
   - **Subject Code**: `/subject\s*code|sub\s*code|paper\s*code|^code$/i`
   - **Subject Name**: `/subject\s*name|subject|^course\s*name|^paper\s*name$/i`
   - **Total Lectures**: `/total\s*lecture|total\s*classes|total|conducted|held/i`
   - **Present**: `/^present|^attended|^pres$/i`
   - **Absent**: `/^absent|^abs$/i`
   - **Percentage**: `/%\s*attendance|\(%\)|percentage|att\s*%|^%$/i`
4. **Data Validation**:
   - Validates that extracted totals equal or exceed attended lectures.
   - Computes percentages with fallback math if the ERP cell is empty.
   - Extracts overall total rows or aggregates individual subject rows.

---

## Customizing Selectors if ABES ERP Changes

All selectors are strictly isolated in a single configuration file:
[`extension/src/parser/dom-selectors.ts`](file:///c:/Users/aniv8/Desktop/ERP/extension/src/parser/dom-selectors.ts)

If the college updates their table classes or IDs, open that file and adjust the candidates:
```ts
export const ABES_ERP_SELECTORS: ERPSelectors = {
  tableCandidates: [
    'table#tblAttendance',
    'table#gvAttendance',
    'table.attendance-table',
    'table.table-bordered',
    'table',
  ],
  // ... regex matchers can also be updated here
};
```
Then run `npm run build:extension`.

---

## Attendance Mathematics & Formulas

### 1. Attendance Percentage
$$\text{Attendance (\%)} = \frac{\text{Present}}{\text{Total}} \times 100$$

### 2. Classes Required to Reach Target $T$ (e.g. 75%, 80%, 85%)
Let $x$ be future consecutive lectures attended:
$$\frac{P + x}{T_{\text{total}} + x} \ge T \implies x = \left\lceil \frac{T \cdot T_{\text{total}} - P}{1 - T} \right\rceil$$

### 3. Maximum Classes That Can Be Skipped (Bunk Cushion)
Let $y$ be lectures missed while staying $\ge 75\%$:
$$\frac{P}{T_{\text{total}} + y} \ge 0.75 \implies y = \left\lfloor \frac{P - 0.75 \cdot T_{\text{total}}}{0.75} \right\rfloor$$

### 4. Projected Attendance
- **If next $N$ classes attended**:
  $$P_{\text{new}} = \frac{P + N}{T_{\text{total}} + N} \times 100$$
- **If next $N$ classes missed**:
  $$P_{\text{new}} = \frac{P}{T_{\text{total}} + N} \times 100$$

---

## Verification & Testing

To run the automated mathematical and parser test suites:
```bash
# Test calculator math and edge cases
node test/calculator.test.cjs

# Test resilient DOM parsing and session expiry detection
npx tsx test/parser.test.mjs
```

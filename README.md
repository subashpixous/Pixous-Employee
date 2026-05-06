# Pixous EMS — Employee Management System

A clean, fast, single-page web application for managing employee records,
ESI / PF details, identity documents, nominee information, and bank details.
Built from the Pixous Perundurai employee spreadsheet.

---

## ✨ Features

- **Two-role login** — Administrator (full access) and Staff (read-only directory).
- **Searchable directory** — search by name, Aadhaar, PAN, mobile, email,
  bank name, IFSC, address, qualification — anywhere in the record. (`Ctrl + K`
  jumps to the search box.)
- **Live filtering** — filter by gender; sort by name or recent additions.
- **Detailed profile pages** — every employee field organised into five
  sections (Personal · Identity & Statutory · Contact · Nominee & Family · Bank).
- **Photo management** — upload a profile photo from any image; a default
  avatar is shown until one is set. Photos are stored locally as base64.
- **Admin panel** — add new employees, edit existing ones, delete records,
  reset all data back to the original spreadsheet seed.
- **CSV export** — download the full directory as CSV at any time.
- **Print-friendly profiles** — clean layout for printing or saving to PDF.
- **Stats strip** — total / male / female / married counts at a glance.
- **Responsive** — works on phones, tablets, and desktops.

---

## 🚀 Getting started

The app is pure HTML / CSS / JavaScript — **no build step, no dependencies**.

### Option A — open the file directly

Just double-click `index.html`. It will open in your browser and work
immediately. Photos and edits persist in your browser's localStorage.

> Note: Some browsers (Chrome especially) restrict `file://` access for
> certain features. If photo uploads or fonts misbehave, use Option B.

### Option B — run a tiny local web server (recommended)

From the `employee-management-system` folder:

```bash
# Python 3 (built into macOS / Linux / Windows with Python installed)
python3 -m http.server 8080

# or with Node.js
npx serve .
```

Then open <http://localhost:8080> in your browser.

### Option C — host it anywhere

Upload the entire folder to any static host: GitHub Pages, Netlify, Vercel,
Cloudflare Pages, Firebase Hosting, S3, or your own server. No backend,
no database, no environment variables.

---

## 🔑 Default credentials

Shown on the login screen for convenience:

| Role           | Username | Password    |
| -------------- | -------- | ----------- |
| Administrator  | `admin`  | `admin123`  |
| Staff          | `user`   | `user123`   |

**Change these in `js/auth.js`** before deploying anywhere shared. The
`CREDENTIALS` object is at the top of the file.

---

## 📁 Project structure

```
employee-management-system/
├── index.html              ← single-page app entry
├── README.md
├── css/
│   └── style.css           ← all styling (design tokens at the top)
├── js/
│   ├── seed-data.js        ← initial 20 employees from your Excel sheet
│   ├── store.js            ← localStorage abstraction (CRUD)
│   ├── auth.js             ← login / logout / role checks
│   ├── views.js            ← view rendering (login, dashboard, profile, admin)
│   └── app.js              ← router + bootstrap
└── assets/
    └── default-avatar.svg  ← fallback profile picture
```

---

## 🛠 How it works

- **Storage** — all data lives in the browser's `localStorage` under the
  key `pixous_ems_employees_v1`. The first time the app loads, it seeds
  this from the 20 records in `js/seed-data.js` (extracted from your Excel
  sheet). After that, every change you make sticks.
- **Router** — hash-based (e.g. `#/dashboard`, `#/profile/3`). No server
  rewrites needed. Refresh works everywhere.
- **Search** — runs against a flattened string of every field per record,
  so any term anywhere in the data will match.
- **Photos** — read with `FileReader`, stored as base64 data-URLs inline
  with each employee record. There's a soft 2 MB limit per photo.

---

## 🧹 Resetting

Admins can wipe all changes and reload the original spreadsheet data using
the **Reset to seed** button on the Admin panel. This clears every edit,
photo, and added employee.

---

## 🎨 Customisation

**Colours / fonts** — open `css/style.css`. Everything is driven by CSS
variables at the top of the file (`--accent`, `--ink`, `--bg`, etc.).
Change one value, the whole app updates.

**Add a new field** — three places to update:

1. `js/seed-data.js` — add the field to existing records (optional).
2. `js/views.js` — add it to the profile detail grid (`renderProfile`)
   and the admin form (`renderAdminForm`).
3. `js/views.js` — add it to the CSV export `fields` array if you want it
   in exports.

**Brand the login screen** — open `js/views.js`, find `renderLogin`, and
edit the `<h1>` and copy in `.login-screen__panel--brand`.

---

## ⚠️ Production notes

This is a **client-side only** application. It is ideal for:

- Single-machine HR use
- Internal directories within a small team
- Demos and proofs of concept

It is **not** suited for multi-user production environments because:

- All data lives in the browser — different machines have different data.
- Passwords are stored in plain JavaScript and are visible to anyone with
  the source code.
- There is no server-side validation.

For multi-user production, port the storage layer (`js/store.js`) to a
real backend (Node + Express + Postgres, Firebase, Supabase, etc.) and
replace `js/auth.js` with proper hashed passwords and sessions.

---

## 📝 License

Use freely for the Pixous business. No external dependencies, no tracking,
no telemetry.

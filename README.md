# Crypto Backtest Journal

A personal web app for logging crypto backtesting sessions: pair, chart snapshot, setup parameters, and outcome. Frontend is a static React app on GitHub Pages; data lives in a Google Sheet with chart images in Google Drive, served through a Google Apps Script web app.

## 1. Create the Google Sheet

1. Create a new Google Sheet (any name). Copy its ID from the URL: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.
2. Leave it empty — the backend creates the `Entries` tab and header row automatically on first use.

## 2. Create the Drive folder for chart images

1. Create a folder in Google Drive (e.g. "Backtest Journal Charts"). Copy its ID from the URL: `https://drive.google.com/drive/folders/<DRIVE_FOLDER_ID>`.

## 3. Deploy the Apps Script backend

1. Go to [script.google.com](https://script.google.com) → New project.
2. Delete the default code and paste in the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
3. Go to **Project Settings → Script Properties**, add:
   - `SHEET_ID` = the Sheet ID from step 1
   - `DRIVE_FOLDER_ID` = the folder ID from step 2
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (required for the public frontend to call it — see note below)
5. Authorize the requested permissions (Sheets + Drive access) when prompted.
6. Copy the deployment's **Web app URL** — you'll need it in step 5.

> Note: Because this app is authenticated by "Execute as: Me" rather than per-user login, the deployment URL itself acts as the access boundary. Anyone with the URL can read/write your journal. Since GitHub Pages (free tier) also requires a public repo, this URL will be visible in your site's source and JS bundle. This is fine for a personal, low-stakes journal, but don't put sensitive account info in it. Re-deploy (Deploy → Manage deployments → Edit) if you ever need to rotate the URL.

## 4. Configure the frontend

```bash
cp .env.example .env
```

Set `VITE_API_URL` in `.env` to the Web app URL from step 3.

## 5. Run locally

```bash
npm install
npm run dev
```

## 6. Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings → **Secrets and variables → Actions**, add a repository secret `VITE_API_URL` with the same Apps Script Web app URL.
3. In repo settings → **Pages**, set Source to **GitHub Actions**.
4. Push to `main` — the included workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) builds and deploys automatically.
5. If your repo name isn't `crypto-backtest-journal`, update the `base` path in [`vite.config.js`](vite.config.js) to match (`/<your-repo-name>/`).

## Updating the backend

If you change `apps-script/Code.gs`, paste the updated code into the Apps Script editor and create a **new deployment version** (Deploy → Manage deployments → Edit → New version) — editing the file alone doesn't update the live web app.

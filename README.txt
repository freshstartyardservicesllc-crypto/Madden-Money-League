# MML26 GitHub Pages Website

## 1) Upload files
Upload these files to your GitHub repo root (so `index.html` is in the top folder):

- index.html
- styles.css
- script.js
- teams.json
- /assets (folder)

## 2) Turn on GitHub Pages
Repo → Settings → Pages → Deploy from branch → `main` → `/ (root)`

## 3) Set your Discord invite
Open `script.js` and replace:

`DISCORD_INVITE_URL: "PASTE_YOUR_DISCORD_INVITE_LINK_HERE"`

with your invite link.

## 4) Updating teams (free + easy)
Edit `teams.json`:
- status: "Open" or "Taken"
- owner: put the user’s gamertag/discord name
Commit changes. The site updates automatically.

## Optional: Use a Google Sheet instead of teams.json
1) Make a Google Sheet with columns:
   team, ovr, tier, status, owner
2) File → Share → Publish to web → CSV
3) Paste the published CSV URL into `CONFIG.SHEET_CSV_URL`
4) Set `TEAMS_SOURCE: "sheet"`

That’s it.
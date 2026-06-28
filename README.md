# Goal Organizer 🎯

A beautiful, fully customizable goal-tracking page to organize your **long-term** and **short-term** goals — inspired by structured execution timetables.

**Live site →** `https://<your-username>.github.io/<repo-name>/`

---

## Features

- ✏️ **Edit Mode** — click any text on the page to edit it in place
- 💾 **Auto-save** — all changes persist in your browser via `localStorage`
- 📤 **Export JSON** — download your current data as a portable file
- 📥 **Import JSON** — restore or share your data across devices
- ➕ **Add/Delete Goals** — manage your long-term and short-term goal lists dynamically
- 🖨️ **Print / PDF** — clean print layout built in
- 📱 **Responsive** — works on mobile, tablet, and desktop

---

## Customize Your Content

### Option A — Edit in the Browser (easiest)
1. Open the site
2. Click **✏️ Edit Mode** in the toolbar
3. Click any text to edit it
4. Click **💾 Save** when done
5. Use **📤 Export JSON** to back it up

### Option B — Edit the source data directly
Open [`data.js`](data.js) and change the `DEFAULT_DATA` object.
This is the permanent default — useful when you want to commit your goals to git.

---

## Deploy to GitHub Pages

### Prerequisites
- A GitHub account
- This repo pushed to GitHub

### Steps

**1. Push this folder to GitHub:**
```bash
cd goal-organizer
git init
git add .
git commit -m "Initial commit: Goal Organizer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

**2. Enable GitHub Pages:**
- Go to your repo → **Settings** → **Pages**
- Under **Source**, select **GitHub Actions**
- Click **Save**

**3. That's it!**
The workflow at `.github/workflows/deploy.yml` will automatically run and publish your site.
Check the **Actions** tab to watch it deploy in real time.

Your site will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

---

## File Structure

```
goal-organizer/
├── index.html              ← Page structure
├── style.css               ← All styling (design system)
├── data.js                 ← All default content (edit this!)
├── app.js                  ← App logic (rendering, edit mode, etc.)
├── .github/
│   └── workflows/
│       └── deploy.yml      ← GitHub Actions CI/CD pipeline
└── README.md               ← This file
```

---

## How GitHub Actions Works (Plain English)

```
You push code to GitHub
        ↓
GitHub detects the push and reads deploy.yml
        ↓
GitHub spins up a fresh Ubuntu server (the "runner")
        ↓
Runner checks out your code
        ↓
Runner packages your files into an artifact
        ↓
GitHub Pages picks up that artifact and publishes it
        ↓
Your site is live with a public HTTPS URL 🎉
```

It's completely free for public repos and runs in ~30 seconds.

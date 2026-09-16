# Field Engineer Learning Website

A self-paced, interactive learning site for transitioning from Army operations leadership into a **Field Engineer** role in commercial construction — built around a 4-week program and specific prep for interviewing at JE Dunn Construction on the Meta El Paso data center project.

It's a fully static site (HTML/CSS/vanilla JS, no build step, no frameworks) that works offline and deploys to GitHub Pages automatically via GitHub Actions on every push to `main`.

## Quick Start

Because the site loads its content from JSON files via `fetch()`, most browsers (Chrome in particular) block those requests when you open `index.html` directly from disk (`file://...`). Run a tiny local server instead:

```bash
# Option A — no dependencies, just Python (already on most machines)
python3 -m http.server 8000

# Option B — via the included npm script (same thing)
npm start
```

Then open **http://localhost:8000** in your browser.

> If you do open `index.html` directly and see a yellow warning banner about content not loading, that's this CORS restriction — switch to one of the options above.

## Deploying to GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`, which builds and deploys the site to GitHub Pages automatically on every push to `main`. GitHub Pages itself needs to be pointed at that workflow once (this one click can't be done via API/token — it requires repo admin access in the browser):

1. Go to **Settings → Pages** in the repo.
2. Under "Build and deployment," set **Source** to **`GitHub Actions`** (not "Deploy from a branch").
3. Save. The next push to `main` (or a manual re-run of the "Deploy to GitHub Pages" workflow under the **Actions** tab) will publish the site.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two, and stays up to date automatically on every future push to `main`.

## What's Here

| Week | Status | Content |
|---|---|---|
| **Week 1 — Foundations** | ✅ Complete | Interactive site hierarchy, daily responsibilities timeline, 30+ term glossary, Army-to-Construction translator |
| **Week 2 — FE Deep Dive** | 🟡 Structure ready, sample data | Responsibilities matrix, interactive decision trees, scenario problem-solver |
| **Week 3 — Interview Prep** | 🟡 Structure ready, sample data | Interview question bank, talking points, JE Dunn culture |
| **Week 4 — Final Prep** | 🟡 Structure ready, sample data | Mock interview simulator, printable checklist, one-page quick reference |
| **Real Construction** | 🟡 Structure ready, sample data | Video library, daily habit tracker, red flags library (interactive decision trees), case studies, expert Q&A |

Weeks 2-4 and Real Construction ship with fully working, interactive components — they're just seeded with a handful of examples instead of the full content set. Add more by editing JSON, no code changes required (see below).

## Repo Structure

```
field-engineer-learning/
├── README.md
├── .gitignore
├── index.html                # Single-page app shell — all routing happens client-side via URL hash
├── package.json
├── .github/workflows/
│   └── deploy-pages.yml      # Builds and deploys to GitHub Pages on every push to main
├── css/
│   ├── styles.css            # Core styles, components, color scheme, print styles
│   └── responsive.css        # Mobile/tablet breakpoints
├── js/
│   ├── app.js                # Routing, theming, progress tracking, data loading, most section rendering
│   ├── scenarios.js          # Decision tree navigator, scenario problem-solver, mock interview simulator
│   ├── glossary.js           # Reusable searchable/filterable glossary component
│   └── real-construction.js  # Video library, habit tracker, red flags tree, case studies, expert Q&A
├── content/
│   ├── week1/                # Complete: hierarchy, terminology, army-to-construction, meta-context
│   ├── week2/                # Sample data: fe-responsibilities, decision-trees, common-scenarios
│   ├── week3/                # Sample data: interview-questions, talking-points, je-dunn-culture
│   ├── week4/                # Sample data: mock-interview, resume-tips, closing-checklist
│   └── real-construction/    # Sample data: videos, habits, red-flags, case-studies, expert-qa
├── images/                   # hierarchy-chart.svg, daily-schedule.svg, decision-tree.svg, meta-project-map.svg
└── docs/                     # GLOSSARY.md, ARMY_TRANSLATION.md, INTERVIEW_GUIDE.md, QUICK_REFERENCE.md
```

## Adding Content to Weeks 2-4 and Real Construction

Every section on the site is rendered from a JSON file — there's no content hardcoded in the HTML for these sections. To add more:

1. Open the relevant file in `content/weekN/` or `content/real-construction/`.
2. Follow the existing shape (look at the `_note` field and the first entry as a template).
3. Add new objects to the array (`terms`, `scenarios`, `questions`, `responsibilities`, etc.).
4. Save and refresh — no rebuild step needed.

For example, to add a 4th decision tree to Week 2, add a new object to the `scenarios` array in `content/week2/decision-trees.json` following the `nodes` structure already there (each node is either a yes/no question or a terminal action).

## Features

- **Hash-based single-page routing** — `#week1`, `#week2`, `#glossary`, etc. Deep-linkable and back-button friendly.
- **Progress tracking** — visited weeks are stored in `localStorage` and reflected in the header bar, sidebar, and home page.
- **Dark mode** — toggle in the header, persisted across visits, respects `prefers-color-scheme` on first load.
- **Real-time glossary search & category filtering**, with a "Download / Print" button that expands to show all terms before opening the print dialog.
- **Interactive SVG hierarchy chart** — click/tap any role for a detail panel; keyboard accessible.
- **Interactive decision trees** — click through yes/no branches to the correct action, with a breadcrumb trail.
- **Scenario problem-solver** — expandable real-world site problems with correct actions and common mistakes.
- **Mock interview simulator** — pick a flow, answer, reveal the model answer, self-rate, get a session score.
- **Printable checklist and quick reference** with browser-native print styling.
- **Fully responsive** — mobile (<640px), tablet (640-1024px), desktop (>1024px), with a collapsing hamburger nav.

## Technical Stack

- HTML5, CSS3 (Flexbox/Grid, no preprocessor), vanilla JavaScript (no frameworks, no build tooling)
- Content as data: everything content-related lives in `content/**/*.json`
- SVG graphics for diagrams (crisp at any zoom, small file size)
- `localStorage` for progress, theme, and checklist state — nothing leaves your browser

## Browser Compatibility

Tested against current Chrome, Firefox, Safari, and Edge. Uses standard `fetch`, CSS custom properties, and CSS Grid — no polyfills included, so very old browsers (IE11 and earlier) are not supported.

## License

MIT — do whatever you'd like with this.

# GreenWave Farm-Season Plots — React app

Interactive viewer for the GreenWave kelp farming dataset, built with React + Vite + Recharts. Renders sample and harvest data for every farm-season as a chart you can hover, filter, and search.

This is a React rewrite of the original single-file `farm_season_plots.html`. The data is now stored in a separate JSON file the app fetches at runtime, which is what makes it suitable for hosting on a static site service like Cloudflare Pages.

## Quick start

Prerequisites: **Node.js 18+** and **Python 3.10+** with pandas/openpyxl. If you don't have Node yet, install from [nodejs.org](https://nodejs.org/) — the LTS version is fine.

```bash
# 1. Install dependencies (one time only)
npm install

# 2. Export the data from the Excel file to JSON
cd scripts
python3 export_data.py
cd ..

# 3. Start a development server (auto-reloads as you edit)
npm run dev
# Open http://localhost:5173

# 4. When ready to deploy, build the static files
npm run build
# Output goes into ./dist/
```

## How the pieces fit together

```
┌───────────────────────────────┐
│ GreenWave_anon_kcf...xlsx     │  Source data (don't edit)
└─────────────┬─────────────────┘
              │ python scripts/export_data.py
              ▼
┌───────────────────────────────┐
│ public/farm_season_data.json  │  Data the app fetches (215 KB)
└─────────────┬─────────────────┘
              │ npm run build
              ▼
┌───────────────────────────────┐
│ dist/                         │  Static files for Cloudflare
│   index.html                  │
│   farm_season_data.json       │
│   assets/index-xxx.js (5 MB)  │
│   assets/index-xxx.css        │
└───────────────────────────────┘
```

To **update data**: re-run `python scripts/export_data.py`, then `npm run build`.

To **change visuals**: edit React components in `src/`, then `npm run build`.

## File layout

```
greenwave-react/
├── README.md
├── package.json              ← npm dependencies
├── vite.config.js            ← build tool config
├── tailwind.config.js        ← color palette + scan paths
├── postcss.config.js         ← CSS pipeline (rarely edited)
├── index.html                ← HTML shell (rarely edited)
├── scripts/
│   └── export_data.py        ← Excel → JSON converter
├── public/
│   └── farm_season_data.json ← generated, do not edit by hand
├── src/
│   ├── main.jsx              ← React entry point (rarely edited)
│   ├── index.css             ← Tailwind directives
│   ├── App.jsx               ← top-level component
│   └── components/
│       ├── Header.jsx        ← page header + search box
│       ├── TagFilters.jsx    ← filter buttons
│       ├── TableOfContents.jsx  ← sidebar links
│       ├── FarmSeasonSection.jsx ← one farm-season block
│       └── PanelChart.jsx    ← individual Plotly chart
└── dist/                     ← built output (generated, gitignore this)
```

## Making changes — recipes

### Change a color

Edit `tailwind.config.js`. The brand colors are defined there:

```js
colors: {
  brand: {
    green: '#1D9E75',      // samples
    orange: '#D85A30',     // harvests
    gold: '#B8860B',       // outplanting (used elsewhere)
    ...
  },
},
```

Chart-specific colors are also defined at the top of `src/components/PanelChart.jsx`:

```js
const COLOR_SAMPLE = '#1D9E75';
const COLOR_DAILY = '#0F6E50';
const COLOR_HARVEST = '#D85A30';
```

After editing, run `npm run dev` to see the change live, or `npm run build` to bake it into the static output.

### Change the header text

Edit `src/components/Header.jsx`. The `<h1>` and the summary line are right there in the JSX.

### Add a new filter tag

Filter buttons come from two places:
- **Which tag groups appear**: edit `TAG_GROUPS` at the top of `src/components/TagFilters.jsx`
- **Which tags exist on each farm-season**: edit the `rollup_tags(g)` function in `scripts/export_data.py`, then re-run the export

### Show different stats in the header

Edit `src/App.jsx` to pass new props to `<Header>`, and `src/components/Header.jsx` to display them.

### Tweak chart appearance

Almost all chart settings live in `src/components/PanelChart.jsx`. Common changes:
- **Colors**: edit the `COLOR_SAMPLE`, `COLOR_DAILY`, `COLOR_HARVEST` constants at the top
- **Chart height**: change `height={320}` on the `<ResponsiveContainer>`
- **Date label angle**: change `angle={-30}` on the `<XAxis>`
- **Tooltip contents**: edit the `CustomTooltip` component at the top of the file

## Deploying to Cloudflare Pages

1. Push this folder to a GitHub repo
2. In Cloudflare → Pages → "Create a project" → "Connect to Git"
3. Pick the repo, then for build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Save — Cloudflare builds and deploys automatically on every push

The data file (`farm_season_data.json`) is committed to the repo, so updates to data only require re-running `export_data.py` locally, then `git push`. Cloudflare rebuilds automatically.

If you'd rather skip GitHub entirely, you can also do a "Direct upload" — drag the `dist/` folder into Cloudflare's web interface after running `npm run build`.

## Troubleshooting

**"Failed to load data: HTTP 404"** when opening the page → You haven't run `python scripts/export_data.py` yet, or it failed.

**Charts don't render, blank page** → Open your browser's developer console (F12 → Console tab). Most issues show up there.

**`npm install` fails** → You probably have an old Node.js version. Check with `node --version`; you need 18 or higher.

**`npm run build` says "out of memory"** → Plotly is a big library. Try `NODE_OPTIONS=--max-old-space-size=4096 npm run build`.

## What I deliberately kept simple

- No TypeScript (one less language to learn)
- No router (it's a single page; the # anchors are enough for navigation)
- No state management library (React's built-in `useState` is plenty for this)
- No tests (you're a small team; eyeballs are fine for now)
- No backend (everything is static; no server to manage)

If/when any of those become real pain points, they can be added incrementally.

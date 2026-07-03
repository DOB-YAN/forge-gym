# FORGE — Gym Tracker

A mobile-first workout tracker for **ABEL** and **KENENI**.

## Features

- **Weekly schedule** — Mon–Sun with your muscle groups pre-configured
- **Custom exercises** — Add your own workouts, patterns, and set counts per day
- **Dual user logging** — Track kg & reps for both ABEL (blue) and KENENI (green)
- **Last week comparison** — See last week's same-day numbers so you never go backwards
- **Progress charts** — Max kg, total reps, and volume over time
- **Body metrics** — Optional weekly weight & height tracking with graphs
- **Rest timer** — 1-minute (or custom) timer between sets
- **Data backup** — Export/import JSON so you never lose progress

## Run on Your Phone

### Option 1: Same Wi-Fi (easiest for testing)

1. Open a terminal in this folder
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. Look for the **Network** URL in the terminal (e.g. `http://192.168.x.x:5173`)
4. Open that URL on your phone (same Wi-Fi as your PC)

### Option 2: Install as app (PWA-style)

1. Open the site in Chrome/Safari on your phone
2. **Android:** Menu → "Add to Home screen"
3. **iPhone:** Share → "Add to Home Screen"

### Option 3: Deploy online (permanent link)

Deploy the `dist` folder to [Netlify Drop](https://app.netlify.com/drop) or run:

```bash
npm run build
npx serve dist -l 3000 --host
```

## Quick Start

1. Go to **Schedule** → expand a day → add your exercises
2. Go to **Today** → switch between ABEL/KENENI → log kg & reps → Save
3. Use **⏱ Rest** after each exercise block
4. Check **Progress** and **Body** tabs for charts

## Schedule

| Day | Focus |
|-----|-------|
| Monday | Chest · Shoulders · Biceps |
| Tuesday | Back · Biceps · Forearm |
| Wednesday | Rest |
| Thursday | Arms (Biceps · Triceps · Forearm · Shoulders) |
| Friday | Chest · Back |
| Saturday | Leg Day |
| Sunday | Rest |

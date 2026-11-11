# Clean Clash

A small browser stopwatch that turns chores into a competition against your own best times.

**Live demo:** https://moneeeeeee.github.io/clean-clash-v2/

## What it does

- Times a named chore with a start, stop and reset stopwatch
- Saves every attempt in the browser and ranks the five fastest times per chore
- Tells you when you set a new personal best
- Lets you clear one chore, or all of them (with a second click to confirm)
- Works offline and needs no account, since everything is stored in `localStorage`

## Tech

HTML, CSS and JavaScript, with no frameworks or build step.

| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `style.css` | Layout and responsive styling |
| `script.js` | Stopwatch, storage and leaderboard logic |

## Run it locally

Clone the repository and open `index.html` in a browser.

```bash
git clone https://github.com/moneeeeeee/clean-clash.git
cd clean-clash
```

## How it works

Each attempt is stored as `{ ms, attempt, date }` under the key `chore_<name>`. Times are kept in
milliseconds and sorted numerically, so the ranking stays correct for any duration. Times saved by
an earlier version of the app (as `hh:mm:ss` text) are converted automatically when the page loads.

## What I learned

This was my first project using browser storage. The main lessons were to store raw values
(milliseconds) instead of formatted text, and to keep reading, writing and rendering in separate
functions so each one is easy to test by hand.

## Next step

Clean Clash is the single-player prototype for [Task Titans](https://github.com/moneeeeeee/task-titans),
a full-stack version with accounts, groups and shared leaderboards.

## License

MIT

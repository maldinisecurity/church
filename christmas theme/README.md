# Christmas Theme Overlay (KICC Wolverhampton)

This folder holds an OBS-ready overlay that layers on more Christmas mood without touching your existing service/offering tickers. Drop `index.html` into OBS as a browser source and adjust width/height to taste (e.g., 1100×700).

What's inside
- Pine/cranberry/gold palette with subtle garland + twinkles + slow snow.
- Header with countdown to next Sunday 11:00 AM.
- Cards for Celebration, Candlelight moment, and Scripture (rotates locally—no API).
- Candlelight badge to highlight the moment.
- Decorative dividers and consistent icons.
- Optional bells loop (muted by default) using your `emmanuel-god-with-us-142275.mp3` file. If you prefer silence, delete the `<audio>` tag or change the source.

Quick tweaks
- Swap header colors: edit `--pine`, `--evergreen`, `--cranberry`, `--gold` in the `:root`.
- Change times: update the time strings in the cards and the countdown target hour (search `setHours(11, 0, 0, 0);`).
- Verse list: update the `verses` array in the script.
- Disable audio toggle: remove the `<audio>` + button markup and related JS.
- Speed of snow: change the `snowfall` animation duration (default 26s) in CSS.

Files
- `index.html` – self-contained overlay with all styling and JS. No external assets beyond the Google Fonts.

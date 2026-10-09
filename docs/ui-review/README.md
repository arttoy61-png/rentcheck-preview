# Rent Check UI review — 2026-10-09

Base main: `494780e6b5c794105b898ad2cfa55e6033bcf9c1` (dot's six data JSON updates).

## Scope

- Header: light background, navy wordmark, compact 3 global entries and 5 topic tabs.
- Desktop: 400 px list at wide widths, 360/320 px at narrower widths. Detail replaces list in the same column. Map width does not change when detail opens.
- Mobile: map first; low / middle / tall list levels with buttons and a handle; detail also has large / small controls, retaining existing close/collapse behavior.
- Repeated large calendar entry is removed visually. The existing calendar submenu remains the single entry. Dates, filtering, and popup callbacks are unchanged.
- Long card titles are visually limited to two lines; original DOM title and detail remain complete. No generated display names or photos.
- Source coverage text is available from the information button; unverified district labels, application dates, and warnings in cards/details are preserved.
- Camera persistence: clear the previous region camera on explicit region/view changes; persist settled camera and current state together; suppress intermediate camera snapshots; migrate pre-fix mismatched camera state once. Existing user-location privacy scrubber retained.
- Landscape: shorter header/filter chrome keeps an actual scrollable list visible.

## Changed runtime files

1. `app/index.html` — loads two UI files only.
2. `app/ui-polish.css` — isolated design overrides; original stylesheet untouched.
3. `app/ui-polish.js` — sheet-size buttons/handle and source-coverage dialog only.
4. `app/app.js` — state persistence changes only; dot's renderers/content not rewritten.
5. `app/kakao-map-engine.js` — suppress intermediate camera notifications and notify after an update completes.

## Data / key boundary

`app/data/**`, `app/articles/**`, all record fields/IDs/source URLs, `config.public.js`, `kakao-session.js`, and `kakao-autoconnect.js` are byte-identical to the base. No credentials are present in this report or the transfer bundle.

The referenced `GPT-INTEGRATION.md` was not found in current main or the retrievable attachments. This commit does not guess new field mappings or claim that dot's newly added fields are all rendered. Existing fields consumed by current renderers remain in use.

## Actual verification

See `browser-results.json`: 25 tests with isolated headless Chromium, using the live allowed Pages origin with the proposed local source responses substituted inside that browser context. Kakao SDK, geocoding, and map tiles were real network requests. No main, production site, or public-preview deployment was modified for testing.

Checks include desktop 1440×900; mobile emulation 390×844; additional 1280×800, 1024×768, 768×1024, 375×667, 430×932, and landscape 844×390. SDK auto-connect, refresh after region change, immediate refresh, tools/articles return, calendar, detail scroll/close, sheet sizes, and topic switching were exercised. This is not physical iPhone Safari testing.

## Integration

Only merge after comparing current main with this base. There were no overlapping modified files in dot's six-JSON commit. A later `app.js` or map-engine edit requires hunk-by-hunk reconciliation; do not copy an old whole version over it. Keep the preview deployment separate from production `rent-check.kr`.

This branch is a review commit only. The existing Pages workflow watches main, so this branch must not be merged or dispatched without separate approval.

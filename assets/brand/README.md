# Saving Companion — Brand Assets

Monogram-based logo (interlocking "S" + "C") in a teal gradient, paired with the Space Grotesk wordmark. Source: the polished monogram board supplied by the team, cropped and exported at production resolution.

## Files

**Mark only** (icon/avatar use)
- `mark-transparent.png` — 1024×1024, transparent background. Default choice for compositing onto anything.
- `mark-on-cream.png` / `mark-on-dark.png` — 1024×1024, mark centered on a solid cream (`#F4F1EA`) or ink (`#111917`) square.

**App icons** (no further padding needed — safe zone already applied)
- `app-icon-dark.png` — 1024×1024, rounded-square, ink background. Primary app icon.
- `app-icon-cream.png` — 1024×1024, rounded-square, cream background. Alt / light-mode icon.
- Drop straight into Xcode's App Icon asset or Android's adaptive-icon foreground+background.

**Favicons**
- `favicon-512.png`, `favicon-192.png`, `favicon-32.png` — ink background square, use `favicon-32.png` (or a generated `.ico`) for the browser tab, `favicon-192.png` for PWA manifest / Android home screen, `512` for splash/app-store listings.

**Wordmark only**
- `wordmark-transparent.png` — ink-colored "Saving Companion" text, transparent background, for pairing with your own layout.
- `wordmark-cream.png` — same, recolored cream, for use on dark backgrounds.

**Lockups** (mark + wordmark combined, ready to place)
- `lockup-horizontal-transparent.png` / `-cream.png` / `-dark.png` — mark left, wordmark right. Use in a nav bar / header.
- `lockup-vertical-transparent.png` / `-cream.png` / `-dark.png` — mark above wordmark, centered. Use for splash screens, cover pages.

**Social**
- `social-square-cream-1080.png` / `social-square-dark-1080.png` — 1080×1080 profile-photo/post format.
- `og-banner-cream-1200x630.png` / `og-banner-dark-1200x630.png` — 1200×630 Open Graph / link-preview banner for the website.

All PNGs are exported at high resolution (2–3× the sizes listed) so they downscale cleanly for any smaller use (favicon, nav bar, app store thumbnail, etc). These are raster exports, not vector — plenty for web, app, and social use at the sizes above; if you later need true vector (large-format print), the mark should be re-traced professionally from these files.

## Colors
- Ink: `#111917`
- Cream: `#F4F1EA`
- Teal (deep): `#0E9E92`
- Mint (bright, gradient highlight): `#5FE9DC` / `#22D3C5`

## Usage guidelines
- **Minimum size**: don't render the mark below 24px — the interlock detail disappears below that.
- **Clear space**: keep padding around the mark at least equal to the width of one letterform stroke on every side (already built into the icon/lockup exports).
- **Backgrounds**: use the cream-bg or transparent variant on light surfaces, the dark-bg variant on ink/dark surfaces. Don't place the raw teal gradient mark directly on busy photography without a solid backing shape.
- **Don't**: recolor the mark outside the teal gradient, stretch it non-uniformly, add drop shadows/outlines, or rotate it.

## For Claude Code
Copy the whole `brand/` folder into your repo (e.g. `public/brand/` or `assets/brand/`) and reference directly:
- Website favicon → `favicon-32.png` (or convert to `.ico`)
- Website header logo → `lockup-horizontal-cream.png` (light header) or `lockup-horizontal-dark.png` (dark header)
- Website OG/social meta tags → `og-banner-cream-1200x630.png`
- iOS/Android app icon → `app-icon-dark.png`
- App splash screen → `lockup-vertical-dark.png` or `mark-on-dark.png`

# Living Library — Setup & Control Guide

Quick reference for the person on setup and control duty during the exhibit.

---

## Domain links

Replace `YOUR-DOMAIN` with your actual deployment URL (e.g. `living-library.vercel.app` or your custom domain). If deploying locally, use `http://localhost:3000`.

| Purpose | URL |
|---------|-----|
| **Main library** (visitor-facing bookshelf) | `https://YOUR-DOMAIN/` |
| **Control panel** (operator: exhibit + interview in one page) | `https://YOUR-DOMAIN/exhibit/control` |
| **Device 1** (tablet/phone display) | `https://YOUR-DOMAIN/exhibit/device/1` |
| **Device 2** | `https://YOUR-DOMAIN/exhibit/device/2` |
| **Device 3** | `https://YOUR-DOMAIN/exhibit/device/3` |
| **Device 4** | `https://YOUR-DOMAIN/exhibit/device/4` |
| **Exhibit test** (video only, no face detection; responds to kill switch) | `https://YOUR-DOMAIN/exhibit/test` |
| **Audio test** (debug: record + transcribe) | `https://YOUR-DOMAIN/interview/test` |

*`/interview` redirects to `/exhibit/control`.*

---

## Controls by location

### 1. Control panel — `/exhibit/control` (or `/interview`)

**Use:** Single page for all operator controls — video exhibit and audio interview.

**Video exhibit section:**
| Control | What it does |
|---------|--------------|
| **Playing** button | Normal mode — devices show video. Tap to set. |
| **Killed** button | Kill switch — all devices go black. Use for emergencies or breaks. |
| **Device 1–4** links | Opens the device URL for that tablet/phone. Bookmark each device on its own screen. |

**Audio interview section:**
| Control | What it does |
|---------|--------------|
| **play intro** | Plays intro + question → records 1 min → saves to library. Does not play outro. |
| **play outro** | Plays the thank-you clip whenever you choose. Use after a session or anytime. |
| **play all** | Plays intro + outro in full (no recording). For preview or testing. |
| **Space bar** | Shortcut for play intro (when not running) |

**Flow:** Click **play intro** → intro + question plays → 1 min recording → story saved → click **play outro** when the visitor is ready to hear it. Use **play all** to preview the full audio (no recording).

---

### 2. Device screens — `/exhibit/device/1` through `/exhibit/device/4`

**Use:** Full-screen display on each tablet/phone. One URL per device.

| Behavior | Description |
|----------|-------------|
| **Tap to start** | Visitor taps to unmute and play video |
| **Face detection** | When a face is detected, screen goes black and stays black until page is refreshed. Requires camera permission. |
| **Kill switch** | When control is set to "Killed", all devices go black |

*Tip: Grant camera access when prompted so face detection works. On HTTPS only.*

---

### 3. Main library — `/`

**Use:** Visitor-facing interactive bookshelf.

| Control | What it does |
|---------|--------------|
| **Add Book** | Opens dialog to add a story manually (text entry) |
| **Drag** | Pan around the bookshelf |
| **Click a book** | Opens story detail |

---

## Environment variables (for setup)

These go in `.env.local` or your hosting provider (e.g. Vercel):

| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` | Database connection (required for saving stories) |
| `OPENAI_API_KEY` | Required for transcription and story extraction |
| `NEXT_PUBLIC_EXHIBIT_VIDEO_1` | (Optional) Override video URL for device 1 |
| `NEXT_PUBLIC_EXHIBIT_VIDEO_2` | (Optional) Override video URL for device 2 |
| `NEXT_PUBLIC_EXHIBIT_VIDEO_3` | (Optional) Override video URL for device 3 |
| `NEXT_PUBLIC_EXHIBIT_VIDEO_4` | (Optional) Override video URL for device 4 |

If video env vars are not set, default Cloudinary videos are used.

**Audio files** (in `public/audio/`): `library_question.mp3` (intro + question), `exhibit-outro.mp3` (thank-you).

---

## Quick checklist for setup

1. [ ] Deploy app and note the domain
2. [ ] Set `POSTGRES_URL` and `OPENAI_API_KEY` in env
3. [ ] Open `/exhibit/control` on the operator computer
4. [ ] Set video exhibit mode to **Playing**
5. [ ] Load `/exhibit/device/1` through `/exhibit/device/4` on each device (full screen)
6. [ ] Test: play intro (records 1 min), play outro when ready, then try play all (preview)

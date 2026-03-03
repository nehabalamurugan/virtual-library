# Living Library

This app now supports two contribution paths:

- Online web form (`/`) for typed submissions.
- Exhibit audio mode (`/interview`) for operator-run, spoken interviews.

Both paths save to the same Vercel Postgres database and display on the main wall.

## Environment setup

Copy `.env.example` to `.env.local` and set:

- `POSTGRES_URL`: Vercel Postgres connection string.
- `OPENAI_API_KEY`: OpenAI API key for Whisper transcription and entry extraction.

## Database setup

Run the SQL in `sql/init.sql` against your Vercel Postgres database.

## Run locally

```bash
npm install
npm run dev
```

## Routes

- `/` - Living Library wall + typed `share yours` flow.
- `/interview` - Exhibit audio mode (operator start and optional auto-start).

## Exhibit operator notes

- Keep `/interview` open in fullscreen on the operator machine.
- Use room speaker output and a directional mic pointed at the chair.
- Manual mode: click **start session** (or press `Space`) when the participant sits.
- Auto mode: click **arm auto-start** and let voice/noise near the chair trigger a session.
- Use **disarm auto-start** when you need quiet setup between visitors.
- The system asks both prompts, records timed answers, transcribes, and posts automatically.

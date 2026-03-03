# Audio for the Living Library

## Exhibit interview flow

For the `/interview` exhibit mode, place four pre-recorded audio files here:

- `exhibit-intro.mp3` — Welcome and instructions (then 20s pause)
- `exhibit-question-1.mp3` — "Tell me about a time in your life when a book meant the most to you." (then 1 min recording)
- `exhibit-question-2.mp3` — "What is the name of the book?" (then 30 sec recording)
- `exhibit-outro.mp3` — Thank-you / conclusion

Flow: intro → 20s wait → Q1 → 1 min record → Q2 → 30 sec record → outro. If Q1/Q2 files are missing, the app falls back to browser text-to-speech.

## Book story recordings

Books from the art installation can include a short recording of the visitor telling their story. The path is stored in the database: each book has an `audioFile` field (filename only). The app builds the full path from `AUDIO_BASE_PATH` in `lib/books.ts`.

Place MP3 files here with the same names as in the database:

- `mara-bell-jar.mp3` — The Bell Jar
- `lia-little-prince.mp3` — The Little Prince
- `anon-mans-search.mp3` — Man's Search for Meaning
- `eli-giovannis-room.mp3` — Giovanni's Room
- `tom-giving-tree.mp3` — The Giving Tree
- `rania-prophet.mp3` — The Prophet
- `anon-night.mp3` — Night

To add audio for a new book, set `audioFile: 'your-file.mp3'` on the book in `lib/books.ts` and put `your-file.mp3` in this folder.

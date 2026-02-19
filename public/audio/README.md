# Audio for the Living Library

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

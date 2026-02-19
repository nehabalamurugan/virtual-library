export type BookSize = 'small' | 'medium' | 'large' | 'tall' | 'wide'

/** A single visitor's story for a book (one recommendation). */
export interface Recommendation {
  id: string
  visitorName: string
  story: string
  dateAdded: string
  /** Filename in public/audio/ (e.g. "mara-bell-jar.mp3"). */
  audioFile?: string
}

/** One book (work) with one or more recommendations. */
export interface Book {
  id: string
  title: string
  author: string
  recommendations: Recommendation[]
  rotation: number
  size: BookSize
  thickness: number
}

/** Payload when adding a new story (from Add Book dialog). Merge into existing book if same title+author. */
export interface AddRecommendationPayload {
  title: string
  author: string
  visitorName: string
  story: string
  dateAdded: string
}

/** Base path for art-installation audio. */
export const AUDIO_BASE_PATH = '/audio'

export function getRecommendationAudioUrl(rec: Recommendation): string | undefined {
  if (!rec.audioFile) return undefined
  const base = AUDIO_BASE_PATH.replace(/\/$/, '')
  const file = rec.audioFile.replace(/^\//, '')
  return `${base}/${file}`
}

/** Whether this book has any recommendation with audio. */
export function bookHasAudio(book: Book): boolean {
  return book.recommendations.some((r) => r.audioFile)
}

function rec(
  id: string,
  visitorName: string,
  story: string,
  dateAdded: string,
  audioFile?: string
): Recommendation {
  return { id, visitorName, story, dateAdded, audioFile }
}

export const initialBooks: Book[] = [
  {
    id: '1',
    title: 'The Bell Jar',
    author: 'Sylvia Plath',
    rotation: -1.2,
    size: 'medium',
    thickness: 2,
    recommendations: [
      rec(
        '1-1',
        'Mara, 24',
        'I read this in the psych ward when I was nineteen. A nurse left it on my nightstand. I didn\'t ask for it. I remember thinking Plath understood something about me that I hadn\'t even said out loud yet. I kept it under my pillow for weeks. I\'m better now. I still have that copy.',
        '2025-03-15',
        'mara-bell-jar.mp3'
      ),
      rec(
        '1-2',
        'Anonymous',
        'I picked it up in a used bookstore the summer after my freshman year. I was supposed to be pre-med. I read it in two days and then changed my major. Everyone thought I was having a crisis. Maybe I was. But that book made me feel less alone in it.',
        '2025-06-20'
      ),
    ],
  },
  {
    id: '2',
    title: 'Beloved',
    author: 'Toni Morrison',
    rotation: 0.8,
    size: 'large',
    thickness: 4,
    recommendations: [
      rec(
        '2-1',
        'James, 67',
        'My mother never talked about her mother. There was a silence in our house that went back generations. When I read Beloved, I understood the silence. Not why it existed -- I already knew that. But that the silence was its own kind of language. I read it once a year now, on her birthday.',
        '2025-03-18'
      ),
    ],
  },
  {
    id: '3',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupery',
    rotation: -0.5,
    size: 'small',
    thickness: 1,
    recommendations: [
      rec(
        '3-1',
        'Lia, 31',
        'My father read this to me every night in Greek before he left. I was five. I didn\'t see him again until I was twenty-two. When we finally sat across from each other, neither of us knew what to say. So I pulled it from my bag and set it on the table between us. He cried. It was enough.',
        '2025-04-02',
        'lia-little-prince.mp3'
      ),
    ],
  },
  {
    id: '4',
    title: 'Man\'s Search for Meaning',
    author: 'Viktor E. Frankl',
    rotation: 1.5,
    size: 'tall',
    thickness: 3,
    recommendations: [
      rec(
        '4-1',
        'Anonymous',
        'I lost my son to an overdose in 2019. For a year I didn\'t read anything. I didn\'t do anything. A grief counselor gave me this book and I threw it across the room. But I picked it up eventually. It didn\'t fix me. Nothing fixes you. But Frankl convinced me that I could carry this and still mean something.',
        '2025-04-10',
        'anon-mans-search.mp3'
      ),
    ],
  },
  {
    id: '5',
    title: 'Giovanni\'s Room',
    author: 'James Baldwin',
    rotation: -0.9,
    size: 'medium',
    thickness: 2,
    recommendations: [
      rec(
        '5-1',
        'Eli, 28',
        'I was raised in a town of 600 people in rural Texas. I knew I was gay at twelve. I found Baldwin in the public library when I was sixteen and read the whole thing sitting on the floor between shelves. That was the first time I thought: maybe there is a world for me somewhere.',
        '2025-04-22',
        'eli-giovannis-room.mp3'
      ),
    ],
  },
  {
    id: '6',
    title: 'When Breath Becomes Air',
    author: 'Paul Kalanithi',
    rotation: 0.4,
    size: 'small',
    thickness: 2,
    recommendations: [
      rec(
        '6-1',
        'Dr. Chen, 45',
        'I am an oncologist. I give people bad news for a living. I know the clinical language for every kind of dying. This book reminded me that on the other side of every diagnosis I deliver, there is someone trying to figure out how to keep living. I keep it in my desk drawer at the hospital.',
        '2025-05-01'
      ),
    ],
  },
  {
    id: '7',
    title: 'The God of Small Things',
    author: 'Arundhati Roy',
    rotation: -1.8,
    size: 'wide',
    thickness: 3,
    recommendations: [
      rec(
        '7-1',
        'Priya, 37',
        'I was born in Kerala, like the twins in the book. I left when I was ten and never went back. Roy writes about that place like she\'s pulling it out of my chest. The love laws. The things that are allowed and not allowed. I have never felt so seen and so destroyed by the same book.',
        '2025-05-14'
      ),
    ],
  },
  {
    id: '8',
    title: 'A Little Life',
    author: 'Hanya Yanagihara',
    rotation: 0.7,
    size: 'large',
    thickness: 5,
    recommendations: [
      rec(
        '8-1',
        'S., 26',
        'I know everyone says this book is too much. I know. But I was in an abusive relationship for four years and nobody talked about what it does to you after. Not the bruises. The after. This book understood the after. I have never underlined so many sentences in my life.',
        '2025-05-28'
      ),
    ],
  },
  {
    id: '9',
    title: 'The Giving Tree',
    author: 'Shel Silverstein',
    rotation: -0.3,
    size: 'small',
    thickness: 1,
    recommendations: [
      rec(
        '9-1',
        'Tom, 72',
        'My wife of forty-four years just passed. She read this to all three of our kids every night. I couldn\'t read it for months after she died. Then one night my granddaughter climbed into my lap with it. I read it to her and I could hear my wife\'s voice in my own. I don\'t know what that means but it meant everything.',
        '2025-06-05',
        'tom-giving-tree.mp3'
      ),
    ],
  },
  {
    id: '10',
    title: 'The Stranger',
    author: 'Albert Camus',
    rotation: 1.1,
    size: 'medium',
    thickness: 1,
    recommendations: [
      rec(
        '10-1',
        'K., 19',
        'I read this the week I dropped out of college. Everyone was panicking but me. I felt nothing. Then Meursault felt nothing. And I realized that feeling nothing was its own kind of feeling, and that scared me enough to call my mom. I\'m back in school now. Different school though.',
        '2025-06-18'
      ),
    ],
  },
  {
    id: '11',
    title: 'Crying in H Mart',
    author: 'Michelle Zauner',
    rotation: -1.4,
    size: 'medium',
    thickness: 3,
    recommendations: [
      rec(
        '11-1',
        'Joon, 33',
        'My mom is Korean. I\'m adopted. I grew up in Minnesota with white parents who loved me but couldn\'t teach me kimchi jjigae. I read this book in one sitting and sobbed for two hours. Not because I lost a mother, but because I never had the one I was supposed to.',
        '2025-07-02'
      ),
    ],
  },
  {
    id: '12',
    title: 'The Prophet',
    author: 'Kahlil Gibran',
    rotation: 0.6,
    size: 'tall',
    thickness: 2,
    recommendations: [
      rec(
        '12-1',
        'Rania, 58',
        'We read from this at my daughter\'s wedding. We read from it at my husband\'s funeral. The same book held both days. Gibran wrote that joy and sorrow are inseparable. I didn\'t believe it when I was young. Now I know it\'s the truest thing anyone ever wrote.',
        '2025-07-20',
        'rania-prophet.mp3'
      ),
    ],
  },
  {
    id: '13',
    title: 'Norwegian Wood',
    author: 'Haruki Murakami',
    rotation: -0.6,
    size: 'large',
    thickness: 3,
    recommendations: [
      rec(
        '13-1',
        'Daniel, 29',
        'My best friend killed himself our junior year of college. I stopped sleeping. I stopped eating. Someone put Murakami in my hands and said "he writes about loss the way it actually feels." They were right. It doesn\'t resolve. It just goes on. And somehow that was what I needed to hear.',
        '2025-08-03'
      ),
    ],
  },
  {
    id: '14',
    title: 'Where the Wild Things Are',
    author: 'Maurice Sendak',
    rotation: 1.3,
    size: 'wide',
    thickness: 2,
    recommendations: [
      rec(
        '14-1',
        'Grace, 40',
        'I read this to my daughter the night before her first day of kindergarten. She was terrified. I told her she was Max and the world was full of wild things but that she would always have a home to come back to where her supper would be waiting. She\'s in high school now. She still references it when she\'s scared.',
        '2025-08-15'
      ),
    ],
  },
  {
    id: '15',
    title: 'Night',
    author: 'Elie Wiesel',
    rotation: -1.0,
    size: 'small',
    thickness: 2,
    recommendations: [
      rec(
        '15-1',
        'Anonymous',
        'I am the granddaughter of a survivor. My grandfather never spoke about what happened. He died when I was fourteen. Two years later my mother gave me this book and said "now you\'ll understand why he couldn\'t talk about it." I have never been the same person I was before I read it.',
        '2025-09-01',
        'anon-night.mp3'
      ),
    ],
  },
  {
    id: '16',
    title: 'Anna Karenina',
    author: 'Leo Tolstoy',
    rotation: 0.8,
    size: 'large',
    thickness: 4,
    recommendations: [
      rec(
        '16-1',
        'Anonymous',
        'A friend of mine is a philosophy professor. He\'s teaching a class about love and care, and he wanted to have a novel in the syllabus. He said, "You should read Anna Karenina. Have you guys read it? It took me so long—isn\'t it amazing?" I hadn\'t read it. He said we should read it and assigned it. So I\'m gonna put it on the list.',
        '2026-02-18'
      ),
    ],
  },
  {
    id: '17',
    title: 'The Glass Bead Game',
    author: 'Hermann Hesse',
    rotation: -1.2,
    size: 'tall',
    thickness: 3,
    recommendations: [
      rec(
        '17-1',
        'Anonymous',
        'The first time I read this book I didn\'t read the paper version—I listened to an audiobook. This was back in the Napster era. I had it on my Mac: I downloaded MP3s of all the individual chapters, but the filenames started with random letters, so when they sorted alphabetically I lost the order. I ended up listening in a completely random sequence. The book is already ethereal, brainy, mystical—you don\'t always know what\'s going on; you\'re just flowing through—and hearing it deconstructed like that somehow matched. It was a unique experience. Later I bought the paper copy and read it properly. That kind of accident wouldn\'t usually happen with a regular book.',
        '2026-02-18'
      ),
    ],
  },
  {
    id: '18',
    title: 'Stories of Your Life and Others',
    author: 'Ted Chiang',
    rotation: -0.5,
    size: 'medium',
    thickness: 2,
    recommendations: [
      rec(
        '18-1',
        'Anonymous',
        'Anything by Ted Chiang. You\'ve probably all read something by him. If you want to read something with futuristic technology, sci-fi that really makes you think—Ted Chiang is the one.',
        '2026-02-18'
      ),
    ],
  },
  {
    id: '19',
    title: 'The Scarlet Pimpernel',
    author: 'Baroness Orczy',
    rotation: 1.1,
    size: 'medium',
    thickness: 2,
    recommendations: [
      rec(
        '19-1',
        'Anonymous',
        'What\'s my favorite? I\'m reading something called The Scarlet Pimpernel, which is about the French Revolution. It was written a long time ago—I don\'t know exactly when. It\'s just a fun adventure story.',
        '2026-02-18'
      ),
    ],
  },
  {
    id: '20',
    title: 'The White Hotel',
    author: 'D. M. Thomas',
    rotation: -0.9,
    size: 'wide',
    thickness: 3,
    recommendations: [
      rec(
        '20-1',
        'Anonymous',
        'I read a book about the Holocaust during a period when enough time had passed that fiction writers were starting to write about it—there wasn\'t a lot early on because it was just too horrifying. I read something called The White Hotel. It was weird. It unlocked something in me. My mother had a very tragic story; it was very traumatic for me as a small child. Reading this book unlocked something that felt completely unrelated, and I had a dream about my mother that put me at peace with her and the trauma. It wasn\'t about mothers or daughters; it was a non sequitur. I read a lot of fiction, all different histories and genres, and that book stayed with me. I went back to it thirty years later and thought: whoa. Incredible. Thank you for helping me remember that.',
        '2026-02-18'
      ),
    ],
  },
  {
    id: '21',
    title: 'Jesus\' Son',
    author: 'Denis Johnson',
    rotation: 0.4,
    size: 'small',
    thickness: 2,
    recommendations: [
      rec(
        '21-1',
        'Anonymous',
        'I read the collection of short stories Jesus\' Son by Denis Johnson in 2021 when I was getting sober. It\'s about addiction and the fallout from that. For obvious reasons it really resonated with me in that moment; I felt a deep kinship with the author and the characters. They\'re not comforting stories—they\'re deeply, deeply sad, nihilistic, no happy ending. But I was seen by the book in a weird way. I derived emotional comfort from that experience, just from having my experience validated.',
        '2026-02-18'
      ),
    ],
  },
  {
    id: '22',
    title: 'The Goldfinch',
    author: 'Donna Tartt',
    rotation: -0.7,
    size: 'large',
    thickness: 4,
    recommendations: [
      rec(
        '22-1',
        'Anonymous',
        'I brought a book with me. She said, "Oh, what are you reading?" I told her—The Goldfinch. She said, "You\'re reading that while you wait here for me?" I said yeah. She said, "Well, then come back when you can\'t read anymore." So I had to go walk around the Stanford Mall for a while longer, until I was really ready to come in and have a baby.',
        '2026-02-18'
      ),
    ],
  },
]

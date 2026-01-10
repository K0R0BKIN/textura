# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Textura** is a modern dictionary web application that reimagines how people look up words. Built with Next.js 15, TypeScript, and Tailwind CSS, it aims to be "the Notion/Linear for dictionaries" - beautiful, fast, and specialized for word lookup.

**Core Philosophy:**
- Literary aesthetic (serifs, warm browns, typography-focused like Claude's UI)
- Laser-focused on word lookup (no learning gimmicks)
- Maximum information density with progressive disclosure
- Multiple lookup modes beyond simple search
- Eventually multi-language with AI-powered cross-language definitions

## Current Status

**Branch:** `vibecode-textura` (orphan branch for vibecoding experiment)

**Implementation Status:** Building Phase 1 (Foundation & Direct Lookup)

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Data Source (Phase 1):** Free Dictionary API (https://api.dictionaryapi.dev)
- **Data Source (Future):** Claude API for multi-language and AI features

## Data Model

Understanding the lexicographic hierarchy:

```
Query ("bit")
  └─ Headword (English "bit")
      └─ Etymon¹ ("bit" from Old English "bite")
          ├─ Lexeme: bit (noun)
          │   ├─ Sense 1: "small piece"
          │   │   ├─ Sub-sense 1.1: "a short time"
          │   │   └─ Sub-sense 1.2: "a short distance"
          │   └─ Sense 2: "12.5 cents"
          └─ Lexeme: bit (verb - past tense of bite)
      └─ Etymon² ("bit" from "binary digit")
          └─ Lexeme: bit (noun)
              └─ Sense: "1/8 of a byte"
```

**Key Terms:**
- **Query**: What user types
- **Headword**: Entry in a specific language's dictionary
- **Etymon**: Words with shared etymology (homograph groups)
- **Lexeme**: Part-of-speech variant (noun, verb, adjective)
- **Sense**: Distinct meaning
- **Sub-sense**: Refinement of a meaning

## Lookup Modes

### 1. Direct Lookup (Phase 1 - In Progress)
User types a word → instant entry page with definitions

**Features:**
- Autocomplete from static word list
- Persistent search box in top bar
- Immediate navigation on Enter

### 2. Reverse Lookup (Phase 3)
User types description → results page with matching words

Example: `"thing you put in a horse's mouth"` → "bit"

**Detection:** Length >5 words, natural language patterns

### 3. Fill-in-the-Blanks (Phase 3)
User types phrase with underscore → suggestions

Example: `"let that _ in"` → "sink"

### 4. Contextual Lookup (Phase 4)
User pastes quote, selects word → AI finds exact meaning in context

**Flow:**
1. Click clip icon → attach snippet
2. Paste text: "He grabbed the horse's bit and led it to the stable"
3. Select "bit" → AI opens correct etymon (equipment, not computer)
4. Snippet stays in sidebar for reference

### 5. Web Search (Phase 3+)
Fallback for words not in dictionary → AI generates entry from web

## UI Layout

### Three-Column Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] [Search Bar....................] [Lang Toggle]       │
├──────────┬──────────────────────────────────┬───────────────┤
│          │  [Dictionary] [Thesaurus] ←Sticky│               │
│   TOC    │                                  │    Sidebar    │
│  (Left)  │         Content (Middle)         │    (Right)    │
│          │                                  │               │
│  bit[en]★│  bit¹  /bɪt/ 🔊                  │  [Empty or    │
│  ├─bit¹  │                                  │   Snippet]    │
│  │ ├─noun│  noun • plural bits              │               │
│  │ └─verb│                                  │               │
│  └─bit²  │  1. informal a small amount    →│               │
│    └─noun│     "a bit of cake"              │               │
│          │                                  │               │
│  bit[es] │  2. equipment...                →│               │
│          │                                  │               │
└──────────┴──────────────────────────────────┴───────────────┘
```

### TOC (Left Column)

**Structure:**
- Headwords at top (two lines: term + language, summary)
- Expandable to show etymons + lexemes
- First headword selected and expanded by default

**Interaction:**
- Click headword → expand/collapse
- Click lexeme → scroll to content
- Hover language → star icon to favorite (persists in localStorage)

**Phase 1 Note:** Single language (English) only, no multi-language sorting yet

### Content Area (Middle Column)

**Sticky Tab Bar:** [Dictionary] [Thesaurus]
- Global state affecting all etymons
- Dictionary: shows examples
- Thesaurus: shows synonym/antonym chips

**Scrollable Content:**

**Etymon Header:**
- Large serif: `bit¹`
- IPA (dimmed): `/bɪt/`
- Audio button: 🔊

**Lexeme Header:**
- Part of speech + inflections: `noun • plural bits`

**Senses (Dictionary Tab):**
```
1. informal a small amount                                    →
   "I'll have a bit of cake"
```
- Tags inline (informal, nautical, etc.)
- Example inline or below
- Chevron always visible (→)

**Senses (Thesaurus Tab):**
```
1. informal a small amount                                    →
   Synonyms: [piece] [portion] [morsel]
   Antonyms: [lot] [whole]
```
- Horizontal chip layout
- Clicking chip → navigate to that word

**Phase 1 Note:** Chevron is visual only (sub-pages in Phase 2)

### Sidebar (Right Column)

**Phase 1:** Empty (placeholder)
**Phase 4:** Snippet widget for contextual lookup
**Future:** Illustrations for certain word categories

### Search Box

**Landing Page:**
- Centered, large
- "Textura" logo above
- Auto-focused

**Entry Page:**
- Top bar (persistent)
- Smaller than landing
- Autocomplete dropdown
- Same functionality

**Phase 1:** Simple direct lookup only
**Phase 4:** Transforms for contextual mode (clip button, textarea)

## Design System

### Color Palette (Literary Aesthetic)

```css
--bg-primary: #FAF9F6;      /* Warm off-white (Alabaster) */
--text-primary: #2C2416;     /* Deep brown-black */
--accent: #A0522D;           /* Muted terracotta/rust */
--text-secondary: #6B5D52;   /* Warm gray */
```

### Typography

- **Headings:** Serif (Crimson Pro, Lora, or Georgia fallback)
- **Body/Definitions:** Serif for readability
- **UI Elements:** Sans-serif (Inter, system fonts)
- **IPA:** Monospace

### Spacing

- Line height: 1.6-1.8 for readability
- Generous whitespace
- Subtle dividers (no harsh lines)

### Interaction Principles

- Smooth transitions
- Skeleton loading states
- Hover states on interactive elements
- Always-visible affordances (chevrons, buttons - no hover-only UI)

## Implementation Phases

### Phase 1: Foundation & Direct Lookup (Current)

**Goal:** Working dictionary with basic lookup

**Key Files:**
```
app/
├── page.tsx                   # Landing page
├── word/[query]/page.tsx     # Entry page
├── layout.tsx                # Root layout
├── globals.css               # Design tokens

components/
├── SearchBox.tsx             # Search with autocomplete
├── LanguageToggle.tsx        # Placeholder (non-functional)
├── TOC.tsx                   # Table of contents
├── TabBar.tsx                # Dictionary/Thesaurus tabs
├── EntryContent.tsx          # Main content orchestrator
├── EtymonSection.tsx         # Etymon display
├── LexemeSection.tsx         # Part of speech + senses
├── SenseItem.tsx             # Individual sense with chevron
└── Sidebar.tsx               # Right column (empty for now)

hooks/
├── useDictionary.ts          # API fetching
└── useLocalStorage.ts        # Cache/favorites

lib/
├── api.ts                    # Dictionary API client
├── cache.ts                  # localStorage wrapper
└── types.ts                  # TypeScript types
```

**Features:**
- Landing page with centered search
- Entry page with three-column layout
- Autocomplete (static word list ~10k words in `public/words.json`)
- Dictionary/Thesaurus tabs
- TOC with headword + lexemes
- Audio pronunciation
- Literary aesthetic
- Loading states
- Error handling (404, network)

**API:** Free Dictionary API
- Endpoint: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- No auth required
- Rate limit: 450 requests per 5 minutes

**Caching:**
- localStorage for last 50 lookups
- Key: `query` (lowercase)
- TTL: 24 hours

**Phase 1 Limitation:** API doesn't separate etymons by etymology, only by partOfSpeech. Treat entire response as single etymon for now. AI reorganization comes in Phase 5.

### Phase 2: Sense Sub-Pages

**Goal:** Drill into individual senses

**New Files:**
- `app/word/[query]/sense/[senseId]/page.tsx`
- `components/Breadcrumbs.tsx`

**Features:**
- Click chevron → sense detail page
- Breadcrumbs (← Back, bit¹ › noun › sense 1)
- Persistent etymon + lexeme headers
- Sub-senses and extended examples
- Tabs still work on sub-page

### Phase 3: Reverse & Fill-in-Blanks Lookup

**Goal:** Natural language search

**New Files:**
- `app/results/page.tsx`
- `lib/modeDetection.ts`

**Features:**
- Mode detection (underscore, word count)
- Results page
- Typo detection
- Web search fallback

### Phase 4: Contextual Lookup

**Goal:** Quote-based search with AI

**New Files:**
- `components/SnippetInput.tsx`
- `components/SnippetWidget.tsx`
- `lib/contextAnalysis.ts`

**Features:**
- Search box transformation (clip → textarea)
- Snippet sidebar widget
- AI-powered context analysis (requires Phase 5)

### Phase 5: AI Integration & Multi-Language

**Goal:** Full AI features

**New Files:**
- `app/api/lookup/route.ts`
- `app/api/analyze-context/route.ts`
- `lib/aiClient.ts`
- `lib/prompts.ts`

**Features:**
- Multi-language support
- Cross-language definitions
- Context-aware etymon selection
- AI-powered reverse lookup
- Web search generation

### Phase 6: Polish & Optimization

**Goal:** Production-ready

**Features:**
- Responsive design
- Keyboard shortcuts
- Performance optimization
- Analytics
- PWA features
- Accessibility

## TypeScript Types

```typescript
// Core data model
interface Query {
  text: string;
  mode: 'direct' | 'reverse' | 'fill-in-blanks' | 'contextual' | 'web-search';
  snippet?: string;
}

interface Headword {
  term: string;
  language: string;  // ISO code
  summary: string;
  etymons: Etymon[];
  isFavorited?: boolean;
}

interface Etymon {
  id: string;
  label: string;        // e.g., "bit¹"
  origin?: string;
  phonetic?: string;    // IPA
  audioUrl?: string;
  lexemes: Lexeme[];
}

interface Lexeme {
  id: string;
  partOfSpeech: string;
  inflections?: string;  // e.g., "plural bits"
  senses: Sense[];
}

interface Sense {
  id: string;
  definition: string;
  tags?: string[];       // informal, nautical, offensive, etc.
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  subSenses?: Sense[];
}

// UI state
interface TOCState {
  expandedHeadwords: Set<string>;
  selectedLexeme?: string;
}

interface TabState {
  current: 'dictionary' | 'thesaurus';
}

interface SidebarContent {
  type: 'snippet' | 'illustration' | null;
  data?: any;
}
```

### Free Dictionary API Response Structure

```typescript
interface DictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text: string;
    audio?: string;
  }>;
  origin?: string;  // Top-level (shared across all meanings)
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }>;
    synonyms: string[];  // Part-of-speech level
    antonyms: string[];
  }>;
}
```

**Mapping Notes:**
- API groups by `partOfSpeech` (lexeme level)
- `origin` is shared (not per-etymon)
- For Phase 1: single etymon per word
- Synonyms/antonyms at both definition and partOfSpeech levels

## Testing

### Test Words

- **hello** - Simple, basic functionality
- **bit** - Multiple parts of speech
- **run** - Many meanings (complex)
- **serendipity** - Rich etymology
- **xyz123** - Not found (error handling)
- **helo** - Typo (suggestion testing)

### Phase 1 Checklist

- [ ] Landing page loads with auto-focused search
- [ ] Autocomplete shows suggestions as user types
- [ ] Enter navigates to entry page
- [ ] Entry page shows three columns
- [ ] TOC displays headword + lexemes
- [ ] Etymon header shows word, IPA, audio button
- [ ] Lexeme headers show part of speech
- [ ] Senses display with tags and examples
- [ ] Dictionary/Thesaurus tabs switch content
- [ ] Thesaurus tab shows synonym/antonym chips
- [ ] Clicking synonym navigates to that word
- [ ] Audio button plays pronunciation
- [ ] Top bar search works with autocomplete
- [ ] Literary aesthetic visible (serifs, warm colors)
- [ ] "xyz123" shows friendly error

## Important Implementation Notes

### Autocomplete
- Use static word list in `public/words.json`
- ~10k common English words
- Client-side filtering (fast)
- No API calls for autocomplete

### Caching Strategy
- localStorage for recently looked-up words
- Max 50 entries
- 24-hour TTL
- Reduces API calls and improves speed

### Chevron Behavior (Phase 1)
- Chevrons visible on all senses
- Non-functional until Phase 2
- Visual affordance only
- Don't disable or hide them

### Tab State
- Global state (affects all etymons in view)
- Persistent across navigation
- Phase 1: Simple useState in parent component
- Phase 2+: May need URL param for deep linking

### Language Toggle (Phase 1)
- Placeholder component (non-functional)
- Shows "EN" or similar
- No click behavior yet
- Prepare structure for Phase 5

### Sidebar (Phase 1)
- Empty container
- Basic styling to match design
- Ready for snippet widget in Phase 4

## Code Style Preferences

- Use TypeScript strictly
- Functional components with hooks
- Server components where possible (Next.js App Router)
- Tailwind for styling (utility-first)
- Keep components focused (single responsibility)
- Avoid premature abstraction
- Comment only when logic isn't self-evident

## Success Criteria

**Phase 1 is successful if:**
- Direct lookup works flawlessly
- UI is beautiful (literary aesthetic evident)
- Fast and responsive
- TOC navigation intuitive
- Tabs switch smoothly
- Foundation ready for Phase 2+

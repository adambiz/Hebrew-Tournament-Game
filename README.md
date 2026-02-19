# 1 Against 95 - Hebrew Learning Game

## Bilingual UI (English + German)

- The UI now supports two languages: `English` and `Deutsch`.
- A language selector is shown on the start screen as two buttons: `English` and `Deutsch`.
- First load defaults to English (`en`).
- The selected UI language is persisted in `localStorage` under `hebrewGame_uiLanguage_v1`.
- On reload, the saved language is restored automatically.

### Prompt Source Behavior

- The prompt above the Hebrew input keeps using `#german-word` for compatibility.
- In runtime, the displayed source text is selected by language:
  - `en`: uses `english`, then falls back to `german`, then `hebrew`.
  - `de`: uses `german`, then falls back to `english`, then `hebrew`.
- This fallback logic is implemented via `window.HebrewGame.i18n.getPromptText(...)`, so prompts are never blank.

### i18n Runtime API

- Namespace: `window.HebrewGame.i18n`
- Methods:
  - `t(key, vars?)`
  - `getLanguage()`
  - `setLanguage(lang)`
  - `getPromptText(wordData)`
  - `applyStaticDomTranslations(root?)`
- Event: `hebrewGame:languageChanged` with `detail: { language }`

## Project Structure

```
1-Against-95/
├── data/
│   └── hebrew-german-words.csv      # Word and phrase data source
├── scripts/
│   ├── game-modules/                # Modular components
│   │   ├── game-core.js             # Core functionality, gameState object, initialization
│   │   ├── game-opponents.js        # AI opponent simulation logic
│   │   ├── game-powerups.js         # Power-up implementation and management
│   │   ├── game-rounds.js           # Round progression, scoring, elimination
│   │   ├── game-words.js            # Word handling, verification, scoring
│   │   └── round-results.js         # Round results screen generation and display
│   ├── fallback-word-lists.js       # Backup word data if CSV fails
│   ├── game.js                      # Namespace + compatibility shim
│   ├── heroes.js                    # Player/opponent class definitions
│   ├── keyboard.js                  # Hebrew keyboard implementation
│   ├── new-word-lists-loader.js     # CSV loading functionality
│   ├── quality/
│   │   ├── check-duplicate-globals.sh # Duplicate top-level declaration check
│   │   └── smoke-test-checklist.md     # Manual smoke tests
│   └── store.js                     # Power-up store implementation
├── styles/
│   ├── css-modules/                 # Modular CSS components
│   │   ├── css-animations.css       # Animation effects
│   │   ├── css-base.css             # Base styling
│   │   ├── css-game-over.css        # Game over screen styling
│   │   ├── css-keyboard.css         # Keyboard styling
│   │   ├── css-responsive.css       # Responsive design
│   │   ├── css-round-results.css    # Round results styling
│   │   ├── css-round-screen.css     # Round screen styling
│   │   ├── css-start-screen.css     # Start screen styling (table-based layout)
│   │   ├── css-store.css            # Store styling
│   │   └── css-visibility.css       # Visibility overrides
│   └── main.css                     # CSS import manager
└── index.html                       # Main HTML (contains all screens)
```

## Refactor Update (2026-02-13)

- Script loading is now explicit in `index.html` (no `document.write` module loading).
- Lifecycle wiring is centralized in `game-core.js` with one submit path.
- `window.HebrewGame` namespace is now the primary contract (`core`, `ui`, `words`, `powerups`, `debug`).
- Round results rendering is isolated in `round-results.js`; round flow stays in `game-rounds.js`.
- CSV loading now includes parsing + validation (schema, round constraints, duplicate rows, trailing-space normalization).
- Start button is data-gated: game cannot start until word data is loaded and validated.
- Debug UI is disabled by default via `window.DEBUG_UI = false`.

### Quality Checks

- Duplicate globals check:
  - `bash scripts/quality/check-duplicate-globals.sh`
- Manual smoke test checklist:
  - `scripts/quality/smoke-test-checklist.md`

## Game Architecture

### Core Components

- **gameState**: Central state object in game-core.js
- **showScreen(id)**: Manages screen transitions
- **Hero class**: Player and opponent instance template
- **Round progression**: Managed by incrementing gameState.currentRound
- **Words structure**: Single words vs phrases (isPhrase property)
- **Screens**: start-screen, round-screen, round-results, game-over

### Game Flow

1. **Initialize**: loadHighScores -> showScreen('start-screen')
2. **Start Game**: startGame -> generateOpponents -> startNextRound
3. **Round Flow**: startNextRound -> startNextWord -> checkWord -> completeRound
4. **Game End**: endGame -> displayHighScores -> resetGame

## Key Implementation Details

### CSS Structure

- CSS modules imported via main.css
- Start screen uses table-based layout for cross-browser compatibility
- Round results visibility fixed through improved structure
- Game title styled with gradient underline and color highlights

### JavaScript Components

- **gameState.player**: Player object properties include score, name, eliminated
- **gameState.opponents**: Array of opponent objects
- **gameState.powerUpsActive**: Tracks active power-ups per word/round
- **displayRoundResults**: Renders redesigned round results screen
- **startGame**: Entry point with input validation
- **completeRound**: Complex function handling round transitions (layout issues fixed)

## Known Issues & Solutions

### CSS Issues

- **Table vs. Flexbox**: Start screen uses table layout after flexbox failed to render properly
- **Specificity Conflicts**: Use targeted selectors for round results screen
- **Z-Index Issues**: Round results screen visibility fixed with improved structure
- **Mobile Responsiveness**: Screen stacking managed through media queries in css-responsive.css
- **CSS Class Name Collisions**: Use specific class names for score displays to avoid conflicts between game and high scores

### JavaScript Issues

- **Event Handler Conflicts**: Modified original startGame function rather than adding listeners
- **Function Overriding Pattern**: Used for enhancing existing functions
- **Word Index Bugs**: Using currentIndex checks before setTimeout to prevent double-incrementing
- **Animation Racing**: Ensuring transitions complete before starting the next word with proper timing
```javascript
const originalFunction = someFunction;
someFunction = function() {
  originalFunction();
  // New functionality
};
```

## Recent Changes (2025-03-24)

- Implemented table-based start screen layout
- Enhanced title styling with spans for number highlighting
- Added input validation with shake animation
- Improved high scores display with medal icons
- Fixed round transitions

## Recent Changes (2025-03-25)

- Implemented interactive letter editing with replacement (instead of insertion)
- Added submit button to replace auto-submission of words
- Created sequential letter checking animation with point indicators
- Fixed issues with word skipping and double incrementing
- Improved transitions between words to prevent flashing of old content
- Enhanced visibility of incorrect letters in feedback displays

## Recent Changes (2025-04-01)

- Fixed scoring system to prevent double-counting of points and coins
- Implemented race condition protection in word submission flow
- Standardized scoring rules: exactly 1 point per correct letter, 1 coin per perfect word
- Added processing flag to prevent duplicate score calculations
- Enhanced logging for score tracking and verification
- Fixed multi-word phrases scoring to correctly award coins per word

## Recent Changes (2025-04-02)

- Added functionality to close power-up menu when clicking outside it
- Fixed Hebrew keyboard mapping to match standard Israeli layout
- Added Enter key shortcut for submitting answers when word is complete
- Fixed keyboard consistency issues between rounds
- Improved physical keyboard event handler management
- Enhanced keyboard reset function to maintain consistent behavior

## Recent Changes (2025-04-03)

- Enhanced Letter Filter power-up with improved functionality:
- Reduced price from 4 to 2 coins for better accessibility
- Changed filtering logic to disable all similar-sounding letters not in the current word
- Added support for multi-word phrases with dynamic updating when switching words
- Improved visual feedback to clarify which letters are being filtered
- Fixed Easier Word power-up to properly handle multiple applications:
- Fixed issues that caused game freezes in multi-word rounds
- Implemented proper tracking of original word data for scoring
- Ensured consistency when transitioning between different round types
- Added better user feedback about which round level the word comes from
- Updated power-up store descriptions to better reflect functionality
- Added letterFilterActive flag to track power-up state across word changes

## Recent Changes (2025-04-06)

- Redesigned the round results screen:
  - Combined rank and completion information into a single visual element
  - Improved score and rewards display with clear icons and labels
  - Fixed button layout issues to ensure consistent side-by-side arrangement
  - Removed redundant "Current Ranking:" text for cleaner interface
  - Added animation effects for celebration icon and reward highlights
  - Implemented better visual hierarchy with medals for top rankings
  - Ensured proper responsive behavior across all screen sizes

- Enhanced store interface:
  - Fixed layout issues with store items to prevent squeezing
  - Improved spacing and visual design for better usability
  - Added click-outside-to-close functionality for better UX
  - Enhanced visual feedback for purchasable vs. non-purchasable items

- Created mockup for improved round screen with:
  - Enhanced information hierarchy in the round header
  - Visual progress bar showing completion through the round
  - Improved word challenge area with clearer visual structure
  - Upgraded tournament status section with badge-style indicators
  - Better champions display with consistent styling and medal indicators
  - Enhanced power-up button with counter badge
  - Refined keyboard layout for better usability

## Technical Notes for Future Sessions

1. **Browser Compatibility**: Chrome on Mac required table-based layout for start screen
2. **gameState Modifications**: Always preserve existing properties when modifying
3. **Screen Transitions**: Use `window.DEBUG_UI = true` plus `window.logDebug(...)` for temporary diagnostics
4. **Diagnostic Approach**: Created standalone test file to isolate CSS issues
5. **Function Enhancement**: Safe pattern is to store and call original function
6. **CSS Selector Specificity**: Use class name prefixes to avoid styling conflicts (e.g., result-score-value vs score-value)
7. **Animation Racing**: Use a combination of setTimeout and opacity transitions when switching screens/words
8. **Race Conditions**: Always store current index values before timeouts to prevent double-incrementing
9. **Element Consistency**: For letter elements, ensure equal size/styling between states with consistent CSS
10. **Transition Pattern**: Use opacity transitions with prepareNextWord/transitionToNextWord approach for smooth visual changes
11. **Asynchronous Operations**: Use processing flags (like isProcessingWordSubmission) to prevent duplicate function calls during animations
12. **Scoring System**: Score calculation should happen exactly once per word - track using flags if necessary
13. **Debug Verification**: Log before/after values when updating critical game state values to verify changes
14. **Event Handlers**: Ensure event handlers are properly removed between rounds to avoid duplicate/inconsistent behavior
15. **Keyboard Shortcuts**: Implement keyboard shortcuts (like Enter) to improve user experience
16. **Power-up State Management**: When power-ups affect the keyboard (like Letter Filter), ensure state is properly updated when switching between words in phrases
17. **DOM Structure Modifications**: When fixing layout issues, address the structure at the source rather than just applying CSS overrides
18. **Visual Hierarchy**: Use color, size, and spacing to create clear separation between different information areas
19. **Responsive Design**: Ensure buttons and interactive elements remain accessible on smaller screens

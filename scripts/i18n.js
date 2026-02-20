/**
 * Lightweight EN/DE/HE runtime localization helpers.
 */
(function bootstrapI18n() {
    const STORAGE_KEY = 'hebrewGame_uiLanguage_v1';
    const DEFAULT_LANGUAGE = 'en';
    const SUPPORTED_LANGUAGES = new Set(['en', 'de', 'he']);
    const HEBREW_CUE_FALLBACK = '👂🔊';
    const HEBREW_CUE_GENERIC_PALETTE = [
        '🌟', '🧩', '🚀', '🗺️', '🎯', '⚓', '🎈', '🔥', '🌈', '🎵'
    ];
    const HEBREW_CUE_TOKEN_GROUPS = [
        { emoji: '🐱', tokens: ['cat', 'katze', 'חתול'] },
        { emoji: '🐶', tokens: ['dog', 'hund', 'כלב'] },
        { emoji: '🐟', tokens: ['fish', 'fisch', 'דג'] },
        { emoji: '🐢', tokens: ['turtle', 'schildkrote', 'schildkroete', 'צב'] },
        { emoji: '🦄', tokens: ['unicorn', 'einhorn', 'חד הקרן', 'חדקרן'] },
        { emoji: '🐉', tokens: ['dragon', 'drache', 'drachen', 'דרקון'] },
        { emoji: '🐵', tokens: ['monkey', 'affe', 'קוף'] },
        { emoji: '🐭', tokens: ['mouse', 'maus', 'עכבר'] },
        { emoji: '🐼', tokens: ['panda', 'פנדה'] },
        { emoji: '🐺', tokens: ['wolf', 'זאב'] },
        { emoji: '🐻', tokens: ['bear', 'bar', 'bär', 'דוב'] },
        { emoji: '🦙', tokens: ['llama', 'lama', 'לאמה', 'הלאמה'] },
        { emoji: '🏴‍☠️', tokens: ['pirate', 'pirat', 'פיראט'] },
        { emoji: '👽', tokens: ['alien', 'חייזר'] },
        { emoji: '🤖', tokens: ['robot', 'roboter', 'רובוט'] },
        { emoji: '🧑‍🏫', tokens: ['teacher', 'lehrer', 'lehrerin', 'מורה'] },
        { emoji: '🧒', tokens: ['child', 'kind', 'junge', 'madchen', 'mädchen', 'ילד', 'ילדה'] },
        { emoji: '👩', tokens: ['woman', 'frau', 'אישה'] },
        { emoji: '👨', tokens: ['man', 'mann', 'איש'] },
        { emoji: '👨', tokens: ['father', 'vater', 'אב'] },
        { emoji: '👦', tokens: ['son', 'sohn', 'בן'] },
        { emoji: '✋', tokens: ['hand', 'יד'] },
        { emoji: '🦶', tokens: ['foot', 'fuss', 'fuß', 'רגל'] },
        { emoji: '👃', tokens: ['nose', 'nase', 'אף'] },
        { emoji: '👄', tokens: ['mouth', 'mund', 'פה'] },
        { emoji: '🌙', tokens: ['moon', 'mond', 'ירח'] },
        { emoji: '⭐', tokens: ['star', 'sterne', 'stern', 'כוכב', 'כוכבים'] },
        { emoji: '☁️', tokens: ['cloud', 'wolke', 'wolken', 'עננ'] },
        { emoji: '⚡', tokens: ['lightning', 'blitz', 'ברק'] },
        { emoji: '💨', tokens: ['wind', 'רוח'] },
        { emoji: '🌊', tokens: ['sea', 'meer', 'ים'] },
        { emoji: '🏝️', tokens: ['island', 'insel', 'אי'] },
        { emoji: '⛰️', tokens: ['mountain', 'berg', 'הר'] },
        { emoji: '🌳', tokens: ['tree', 'baum', 'עץ'] },
        { emoji: '🌸', tokens: ['flower', 'blume', 'rose', 'פרח', 'שושנה'] },
        { emoji: '☀️', tokens: ['sun', 'sonne', 'שמש'] },
        { emoji: '🏃', tokens: ['run', 'rennt', 'lauft', 'läuft', 'רץ', 'רצה', 'רצים'] },
        { emoji: '🦘', tokens: ['jump', 'spring', 'קופץ', 'קופצת'] },
        { emoji: '✈️', tokens: ['fly', 'flieg', 'fliegen', 'טס', 'טסה', 'מטיס'] },
        { emoji: '⛵', tokens: ['sail', 'segeln', 'מפליג'] },
        { emoji: '🚗', tokens: ['ride', 'fahrt', 'fährt', 'נוסע', 'נוסעת', 'רוכב', 'car', 'auto', 'מכונית'] },
        { emoji: '💃', tokens: ['dance', 'tanzt', 'tanzen', 'רוקד', 'רוקדים'] },
        { emoji: '🎮', tokens: ['play', 'spielt', 'spielen', 'מנגן', 'משחק'] },
        { emoji: '🎨', tokens: ['draw', 'malt', 'מצייר', 'מציירת'] },
        { emoji: '🛠️', tokens: ['build', 'baut', 'bauen', 'בונה', 'בונים', 'מכין'] },
        { emoji: '🔍', tokens: ['find', 'findet', 'מוצא'] },
        { emoji: '🛡️', tokens: ['guard', 'bewacht', 'שומר'] },
        { emoji: '🚀', tokens: ['rocket', 'rakete', 'raketen', 'רקטה'] },
        { emoji: '🛸', tokens: ['spaceship', 'raumschiff', 'חללית'] },
        { emoji: '🚤', tokens: ['boat', 'boot', 'סירה'] },
        { emoji: '🚆', tokens: ['train', 'zug', 'רכבת'] },
        { emoji: '🗺️', tokens: ['map', 'karte', 'מפה'] },
        { emoji: '🧭', tokens: ['compass', 'kompass', 'מצפן'] },
        { emoji: '🔑', tokens: ['key', 'schlussel', 'schlüssel', 'מפתח'] },
        { emoji: '💎', tokens: ['treasure', 'schatz', 'אוצר'] },
        { emoji: '🏰', tokens: ['castle', 'schloss', 'burg', 'ארמון', 'טירה'] },
        { emoji: '🪁', tokens: ['kite', 'עפיפון'] },
        { emoji: '🎩', tokens: ['hat', 'hut', 'כובע'] },
        { emoji: '🦸', tokens: ['cape', 'umhang', 'גלימה'] },
        { emoji: '⛑️', tokens: ['helmet', 'helm', 'קסדה'] },
        { emoji: '🎒', tokens: ['backpack', 'rucksack', 'תרמיל'] },
        { emoji: '🪙', tokens: ['coin', 'coins', 'münze', 'muenze', 'מטבע'] },
        { emoji: '✨', tokens: ['magic', 'zauber', 'קסם', 'שיקוי'] },
        { emoji: '🍫', tokens: ['chocolate', 'schokolade', 'שוקולד'] },
        { emoji: '🍰', tokens: ['cake', 'kuchen', 'עוגה'] },
        { emoji: '🍪', tokens: ['cookies', 'kekse', 'cookie', 'עוגיות'] },
        { emoji: '🍕', tokens: ['pizza', 'פיצה'] },
        { emoji: '🍿', tokens: ['popcorn', 'פופקורן'] },
        { emoji: '🍦', tokens: ['ice cream', 'eiscreme', 'גלידה'] },
        { emoji: '🍌', tokens: ['banana', 'banane', 'בננה'] },
        { emoji: '🍎', tokens: ['apple', 'apfel', 'תפוח'] },
        { emoji: '🍊', tokens: ['orange', 'oranges', 'תפוז'] },
        { emoji: '🍞', tokens: ['bread', 'brot', 'לחם'] },
        { emoji: '🍵', tokens: ['tea', 'tee', 'תה'] },
        { emoji: '☕', tokens: ['coffee', 'kaffee', 'קפה'] },
        { emoji: '💧', tokens: ['water', 'wasser', 'מים'] },
        { emoji: '🍇', tokens: ['grapes', 'trauben', 'ענבים'] },
        { emoji: '🍬', tokens: ['candies', 'bonbons', 'סוכריות'] },
        { emoji: '🏫', tokens: ['school', 'schule', 'בית הספר'] },
        { emoji: '📚', tokens: ['book', 'buch', 'buecher', 'bücher', 'ספר'] },
        { emoji: '🪟', tokens: ['window', 'fenster', 'חלון'] },
        { emoji: '💻', tokens: ['computer', 'מחשב'] },
        { emoji: '📞', tokens: ['phone', 'telefon', 'טלפון'] },
        { emoji: '🏠', tokens: ['home', 'hause', 'haus', 'בית', 'הביתה'] },
        { emoji: '🏠', tokens: ['roof', 'dach', 'גג'] },
        { emoji: '🪴', tokens: ['garden', 'garten', 'גן'] },
        { emoji: '🛣️', tokens: ['street', 'strasse', 'straße', 'רחוב'] },
        { emoji: '🏙️', tokens: ['city', 'stadt', 'עיר'] },
        { emoji: '📅', tokens: ['day', 'tag', 'heute', 'today', 'יום'] },
        { emoji: '🌃', tokens: ['night', 'nacht', 'לילה'] },
        { emoji: '🫂', tokens: ['friend', 'freund', 'freunden', 'חבר'] },
        { emoji: '❓', tokens: ['what', 'was', 'מה'] },
        { emoji: '👤', tokens: ['who', 'wer', 'מי'] },
        { emoji: '👉', tokens: ['there', 'dort', 'שם'] },
        { emoji: '👈', tokens: ['here', 'hier', 'כאן'] },
        { emoji: '➕', tokens: ['also', 'auch', 'גם'] },
        { emoji: '🤝', tokens: ['with', 'mit', 'עם'] },
        { emoji: '🔝', tokens: ['on', 'auf', 'על'] },
        { emoji: '👎', tokens: ['bad', 'schlecht', 'רע'] }
    ];

    const translations = {
        en: {
            'document.title': '1 vs 95 - Hebrew Learning Game',
            'language.label': 'Language',
            'language.english': 'English',
            'language.german': 'Deutsch',
            'language.hebrew': 'עברית',
            'label.you': 'You',
            'title.against': 'vs',

            'start.createChampion': 'Create Your Champion',
            'start.panelCopy': 'Choose your hero name and enter the arena.',
            'start.playerNamePlaceholder': 'Enter your hero name',
            'start.playerNameAria': 'Player name',
            'start.startButton': 'Start Game',
            'start.startButtonAria': 'Start game',
            'start.avatarSelectLabel': 'Choose your avatar',
            'start.moreAvatars': 'More Avatars',
            'start.moreAvatarsAria': 'Show more avatars',
            'start.selectedAvatarAlt': 'Selected avatar',
            'start.selectedAvatarAltWithId': 'Selected avatar #{id}',
            'start.avatarLabel': 'Avatar',
            'start.avatarLabelWithId': 'Avatar #{id}',
            'start.avatarGridAria': 'Choose avatar',
            'start.avatarChoiceAria': 'Select avatar {id}',
            'start.avatarPagerPrevAria': 'Show previous avatars',
            'start.avatarPagerNextAria': 'Show next avatars',
            'start.avatarEmptyAria': 'No avatar selected',
            'start.topChampions': 'Top Champions',
            'start.loadingWords': 'Loading words...',
            'start.wordsLoadedAnnounce': 'Word list loaded. You can start the game.',
            'start.wordsLoadFailButton': 'Could not load words',
            'start.wordsLoadFailTitle': 'Word list could not be loaded',
            'start.loadingToastTitle': 'Still loading',
            'start.loadingToastDesc': 'Word lists are still loading. Please wait a moment.',

            'round.label': 'Round',
            'round.scoreLabel': 'Score',
            'round.coinsLabel': 'Coins',
            'round.score': 'Score: {score}',
            'round.coins': 'Coins: {coins}',
            'round.promptPlaceholder': 'Word',
            'round.ttsControlsAria': 'Read-aloud controls',
            'round.playHebrewAria': 'Read Hebrew text',
            'round.playLabel': 'Read',
            'round.autoToggleAria': 'Toggle auto-read',
            'round.autoLabel': 'Auto',
            'round.answerFieldAria': 'Hebrew answer field',
            'round.wordCounter': 'Word {current} of {total}',
            'round.powerups': 'Power-Ups',
            'round.powerupsOpenAria': 'Open power-up menu',
            'round.submit': 'Check Answer',
            'round.submitAria': 'Check answer',
            'round.ofSix': 'of 6',
            'round.heroes': 'Heroes',
            'round.remaining': 'remaining',
            'round.yourRank': 'Your Rank',
            'round.nextUp': 'Up Next: Round {round}',
            'round.nextUpPrefix': 'Up Next: Round',
            'round.description.finalResults': 'Final results',
            'round.description.1': 'Single words with 2 Hebrew letters',
            'round.description.2': 'Single words with 4 Hebrew letters',
            'round.description.3': 'Single words with 6 Hebrew letters',
            'round.description.4': 'Hebrew phrases with two words',
            'round.description.5': 'Hebrew sentences with three words',
            'round.description.6': 'Hebrew sentences with four words',
            'round.noWordsTitle': 'No words available',
            'round.noWordsDesc': 'Word data for this round could not be loaded.',
            'round.startedAnnounce': 'Round {round} started. {words} words in this round.',
            'round.type.twoWords': 'This round contains two-word phrases.',
            'round.type.threeWords': 'This round contains three-word sentences.',
            'round.type.fourWords': 'This round contains four-word sentences.',
            'round.clickHint': 'Click a letter to edit that position.',
            'round.sentencesToastTitle': 'Round {round}: Sentences',
            'round.debugCheatAnnounce': 'Debug cheat active. Round {round} finished in first place.',
            'round.completedAnnounce': 'Round {round} complete. You earned {coins} coins.',
            'round.completedShort': 'Round complete!',

            'results.roundComplete': 'Round {round} completed!',
            'results.completedSuffix': 'completed!',
            'results.totalScorePrefix': 'Total score:',
            'results.thisRoundPrefix': 'This round:',
            'results.coinsEarnedPrefix': 'Coins earned:',
            'results.yourCoinsPrefix': 'Your coins:',
            'results.totalScore': 'Total score: {score}',
            'results.thisRound': 'This round: {score}',
            'results.coinsEarned': 'Coins earned: {coins}',
            'results.yourCoins': 'Your coins: {coins}',
            'results.openShop': 'Open Shop',
            'results.openShopAria': 'Open shop',
            'results.nextRound': 'Next Round',
            'results.nextRoundAria': 'Go to next round',
            'results.state.eliminated': 'Eliminated this round',
            'results.state.champion': 'Round winner!',
            'results.state.top3': 'Great! Podium finish',
            'results.state.survived': 'You advance!',
            'results.rankLabel': 'Your Rank',
            'results.points': 'Points',
            'results.roundPoints': 'Round points',
            'results.coinsEarnedLabel': 'Coins earned',
            'results.totalCoins': 'Total coins',
            'results.pointsSuffix': ' points',
            'results.coinsSuffix': ' coins',
            'results.eliminatedButton': 'Eliminated',
            'results.finalResultsButton': 'Final Results',
            'results.outBadge': 'OUT',
            'results.outBadgeAria': 'Eliminated',

            'store.overlayAria': 'Power-Up Shop',
            'store.title': 'Power-Up Shop',
            'store.closeAria': 'Close shop',
            'store.backToResults': 'Back to results',
            'store.coinsSuffix': ' coins',
            'store.openedAnnounce': 'Shop opened.',
            'store.closedAnnounce': 'Shop closed.',
            'store.buy': 'Buy Power-Up',
            'store.buyAria': 'Buy {name}',
            'store.ownedLabel': 'Owned',
            'store.owned': 'Owned: {count}',
            'store.purchasedTitle': 'Power-up purchased',
            'store.purchasedDesc': '{name} was purchased.',
            'store.notEnoughTitle': 'Not enough coins',
            'store.notEnoughDesc': '{name} costs {price} coins.',
            'store.needMoreCoinsBadge': 'Need coins',

            'powerup.double_points.name': 'Double Points',
            'powerup.double_points.description': 'Doubles points for the current word',
            'powerup.letter_filter.name': 'Letter Filter',
            'powerup.letter_filter.description': 'Disables similar-sounding letters not in the current word',
            'powerup.second_chance_round.name': 'Second Chance',
            'powerup.second_chance_round.description': 'Retry on mistakes (entire round)',
            'powerup.easier_word.name': 'Easier Word',
            'powerup.easier_word.description': 'Gives an easier word with fewer letters (stackable)',
            'powerups.noneTitle': 'No power-ups available',
            'powerups.noneDesc': 'You currently have no power-ups. Buy some between rounds.',
            'powerups.openMenuAria': 'Open power-up menu',
            'powerups.noneAvailableAria': 'No power-ups available yet',
            'powerups.doublePointsTitle': 'Double points activated',
            'powerups.doublePointsDesc': 'Points for this word are doubled.',
            'powerups.letterFilterActiveTitle': 'Letter filter active',
            'powerups.letterFilterActiveDesc': '{count} similar-sounding letters were hidden for this word.',
            'powerups.letterFilterTitle': 'Letter filter',
            'powerups.letterFilterNoneDesc': 'No letters could be filtered for this word.',
            'powerups.secondChanceTitle': 'Second chance activated',
            'powerups.secondChanceDesc': 'You now have an extra attempt for all words in this round.',
            'powerups.cannotSimplifyTitle': 'Cannot simplify further',
            'powerups.cannotSimplifyDesc': 'You are already at the easiest word level.',
            'powerups.errorTitle': 'Error',
            'powerups.noEasierWordDesc': 'No easier word could be found.',
            'powerups.newWordMsg': 'New word: {word} (Level {level}, original points are kept)',
            'powerups.simplifiedThreeWord': 'Simplified to a three-word sentence (Level {level}, original points are kept)',
            'powerups.simplifiedTwoWord': 'Simplified to a two-word phrase (Level {level}, original points are kept)',
            'powerups.simplifiedShortPhrase': 'Simplified to a shorter phrase (Level {level}, original points are kept)',
            'powerups.simplifiedSingleWord': 'Simplified to a single word (Level {level}, original points are kept)',
            'powerups.wordSimplifiedTitle': 'Word simplified',

            'word.announcePerfect': 'Perfect answer. {points} points and {coins} coins.',
            'word.announceChecked': 'Answer checked. {points} points.',
            'word.toastSuper': 'Great!',
            'word.toastAlmost': 'Almost!',
            'word.toastError': 'Error',
            'word.perfectDesc': '+{points} points, {coinText}',
            'word.perfectDescOriginal': '+{points} points from the original {letters}-letter {wordDesc}, {coinText}',
            'word.imperfectDesc': '+{points} points',
            'word.imperfectDescOriginal': '+{points} points from the original {letters}-letter word',
            'word.secondChanceTitle': 'Second chance',
            'word.secondChanceRoundDesc': 'Round bonus active: try once more.',
            'word.secondChanceSingleDesc': 'You can try once more.',
            'word.wordSingle': 'word',
            'word.wordPlural': 'words',
            'word.coinSingle': '1 coin',
            'word.coinPlural': '{count} coins',

            'opponents.boostTitle': 'Need a boost?',
            'opponents.boostDesc': 'Use power-ups to gain an edge over the competition.',

            'final.tournamentCompleteTitle': 'Tournament complete!',
            'final.podiumTitle': 'Final Podium',
            'final.podiumAria': 'Top 3 in final',
            'final.scoreHunt': 'Final Score Hunt',
            'final.baseScore': 'Base score',
            'final.coinBonusPrefix': 'Coin bonus (',
            'final.coinBonusSuffix': ' x 2)',
            'final.total': 'Final total',
            'final.rank': 'Final rank: {rank} of {total}',
            'final.rankPrefix': 'Final rank:',
            'final.rankValue': '{rank} of {total}',
            'final.newHighscore': 'New High Score!',
            'final.finalistsRace': 'Finalists Score Race',
            'final.championshipLeaderboard': 'Championship Leaderboard',
            'final.playAgain': 'Play Again',
            'final.playAgainAria': 'Play again',
            'final.highscoreEmpty': 'No high scores yet. Be the first!',
            'final.titleChampion': 'Jackpot Champion!',
            'final.copyChampion': 'You reached rank 1 and won the full score hunt.',
            'final.titleStrongRun': 'Strong run!',
            'final.copyStrongRun': 'You gave it your all and still finished with a strong result.',
            'final.titleStrongFinale': 'Strong finale!',
            'final.copyStrongFinale': 'Clean finish. You carried a lot of points into the finale.',
            'final.highScoreDetails': 'You moved up to rank #{position} with {score} points.',
            'final.announceComplete': 'Tournament complete. Final score {score} points. Rank {rank} of {total}.',

            'highscores.empty': 'No high scores yet. Be the first!',

            'tts.noVoiceTitle': 'No Hebrew voice found',
            'tts.noVoiceDesc': 'Read-aloud is disabled. Install a Hebrew voice in your browser or operating system.',
            'tts.read': 'Read',
            'tts.audioUnavailable': 'Audio unavailable',
            'tts.noVoiceShort': 'No Hebrew voice',
            'tts.readAria': 'Read Hebrew text',
            'tts.unavailableAria': 'Hebrew read-aloud unavailable',
            'tts.autoOn': 'Auto on',
            'tts.autoOff': 'Auto off',
            'tts.autoDisableAria': 'Disable auto-read',
            'tts.autoEnableAria': 'Enable auto-read',

            'keyboard.hebrewLetter': 'Hebrew letter {letter}',
            'keyboard.backspace': 'Backspace',

            'hero.avatarAlt': 'Avatar of {name}',
            'hero.avatarFallbackName': 'hero',

            'loader.fetchFailed': 'Word lists could not be loaded: {status} {statusText}',
            'loader.csvEmpty': 'The CSV file is empty',
            'loader.requiredColumns': 'CSV requires columns: round,german,hebrew (additional optional columns are allowed)',
            'loader.expectedColumns': 'Line {line}: expected at least 3 columns',
            'loader.invalidRound': "Line {line}: invalid round value '{round}'",
            'loader.duplicateRow': "Line {line}: duplicate row '{key}'",
            'loader.fallbackUnavailable': 'Fallback word lists are not available',
            'loader.missingRoundWords': 'Missing words for {roundKey}',
            'loader.rowValuesRequired': '{row}: German and Hebrew values are required',
            'loader.invalidRoundValue': "{row}: Invalid round '{round}'. Expected 1-6",
            'loader.roundWordCount': "{row}: Round {round} expects {expected} Hebrew word(s), got {actual} ('{hebrew}')",
            'loader.fallbackDuplicate': "Duplicate fallback row '{key}'",

            'ttsDebug.openAria': 'Open TTS debug mode',
            'ttsDebug.closeAria': 'Close TTS debug mode',
            'ttsDebug.close': 'Close',
            'ttsDebug.title': 'TTS Debug Review',
            'ttsDebug.copy': 'Play all entries, mark problematic pronunciations, then copy the flagged list.',
            'ttsDebug.filterPlaceholder': 'Filter (German / English / Hebrew / Round)',
            'ttsDebug.filterAria': 'Filter TTS debug list',
            'ttsDebug.copyFlagged': 'Copy Flagged',
            'ttsDebug.clearFlagged': 'Clear Flags',
            'ttsDebug.ready': 'Ready.',
            'ttsDebug.emptyLoading': 'Word data is still loading.',
            'ttsDebug.noData': 'No data available. Check whether the CSV was loaded.',
            'ttsDebug.noFilterMatch': 'No matches for the current filter.',
            'ttsDebug.statusFilter': 'Filter: {visible}/{total}. Sentences: {sentences}. Word issues: {wordIssues}.',
            'ttsDebug.statusEntries': 'Entries: {visible}/{total}. Rows with issues: {issueRows}. Sentences: {sentences}. Word issues: {wordIssues}.',
            'ttsDebug.metaHebrew': 'Hebrew: {value}',
            'ttsDebug.metaVocalized': 'Vocalized: {value}',
            'ttsDebug.metaTts': 'TTS: {value}',
            'ttsDebug.metaSpoken': 'Spoken: {value}',
            'ttsDebug.emptyValue': 'empty',
            'ttsDebug.rowHeadline': '#{row} · Round {round} · {source}',
            'ttsDebug.listen': 'Listen',
            'ttsDebug.sentenceMarked': 'Sentence: flagged',
            'ttsDebug.sentenceUnclear': 'Sentence: unclear/unnatural',
            'ttsDebug.issueStress': 'Stress',
            'ttsDebug.issuePronunciation': 'Pronunciation',
            'ttsDebug.copyNone': 'No flagged issues to copy.',
            'ttsDebug.copySuccess': 'Copied: {count} rows with issues.',
            'ttsDebug.copyFailed': 'Copy failed. Please try again.',
            'ttsDebug.clearNone': 'There are no flags to clear.',
            'ttsDebug.clearDone': 'All flags were cleared.',
            'ttsDebug.ttsUnavailable': 'TTS is not available.',
            'ttsDebug.playing': 'Playing #{row} (Round {round}).',
            'ttsDebug.playFailed': 'Could not play #{row}.',
            'ttsDebug.reportTitle': '# Hebrew Tournament TTS issues',
            'ttsDebug.reportCreated': '# created_at: {timestamp}',

            'misc.avatar': 'Avatar'
        },
        de: {
            'document.title': '1 gegen 95 - Hebräisch-Lernspiel',
            'language.label': 'Sprache',
            'language.english': 'English',
            'language.german': 'Deutsch',
            'language.hebrew': 'עברית',
            'label.you': 'Du',
            'title.against': 'gegen',

            'start.createChampion': 'Erstelle deinen Champion',
            'start.panelCopy': 'Wähle deinen Held*innennamen und betrete die Arena.',
            'start.playerNamePlaceholder': 'Gib deinen Held*innennamen ein',
            'start.playerNameAria': 'Spielername',
            'start.startButton': 'Spiel starten',
            'start.startButtonAria': 'Spiel starten',
            'start.avatarSelectLabel': 'Wähle dein Avatar',
            'start.moreAvatars': 'Mehr Avatare',
            'start.moreAvatarsAria': 'Weitere Avatare zeigen',
            'start.selectedAvatarAlt': 'Ausgewählter Avatar',
            'start.selectedAvatarAltWithId': 'Ausgewählter Avatar #{id}',
            'start.avatarLabel': 'Avatar',
            'start.avatarLabelWithId': 'Avatar #{id}',
            'start.avatarGridAria': 'Avatar auswählen',
            'start.avatarChoiceAria': 'Avatar {id} auswählen',
            'start.avatarPagerPrevAria': 'Vorherige Avatare anzeigen',
            'start.avatarPagerNextAria': 'Nächste Avatare anzeigen',
            'start.avatarEmptyAria': 'Kein Avatar ausgewählt',
            'start.topChampions': 'Top-Champions',
            'start.loadingWords': 'Wörter werden geladen...',
            'start.wordsLoadedAnnounce': 'Wortliste geladen. Du kannst das Spiel starten.',
            'start.wordsLoadFailButton': 'Wörter konnten nicht geladen werden',
            'start.wordsLoadFailTitle': 'Wortliste konnte nicht geladen werden',
            'start.loadingToastTitle': 'Noch am Laden',
            'start.loadingToastDesc': 'Die Wortlisten werden noch geladen. Bitte kurz warten.',

            'round.label': 'Runde',
            'round.scoreLabel': 'Punkte',
            'round.coinsLabel': 'Münzen',
            'round.score': 'Punkte: {score}',
            'round.coins': 'Münzen: {coins}',
            'round.promptPlaceholder': 'Wort',
            'round.ttsControlsAria': 'Vorlese-Steuerung',
            'round.playHebrewAria': 'Hebräischen Text vorlesen',
            'round.playLabel': 'Vorlesen',
            'round.autoToggleAria': 'Automatisches Vorlesen umschalten',
            'round.autoLabel': 'Auto',
            'round.answerFieldAria': 'Hebräisches Antwortfeld',
            'round.wordCounter': 'Wort {current} von {total}',
            'round.powerups': 'Boni',
            'round.powerupsOpenAria': 'Bonusmenü öffnen',
            'round.submit': 'Antwort prüfen',
            'round.submitAria': 'Antwort prüfen',
            'round.ofSix': 'von 6',
            'round.heroes': 'Helden',
            'round.remaining': 'übrig',
            'round.yourRank': 'Dein Rang',
            'round.nextUp': 'Als Nächstes: Runde {round}',
            'round.nextUpPrefix': 'Als Nächstes: Runde',
            'round.description.finalResults': 'Finale Ergebnisse',
            'round.description.1': 'Einzelwörter mit 2 hebräischen Buchstaben',
            'round.description.2': 'Einzelwörter mit 4 hebräischen Buchstaben',
            'round.description.3': 'Einzelwörter mit 6 hebräischen Buchstaben',
            'round.description.4': 'Hebräische Ausdrücke mit zwei Wörtern',
            'round.description.5': 'Hebräische Sätze mit drei Wörtern',
            'round.description.6': 'Hebräische Sätze mit vier Wörtern',
            'round.noWordsTitle': 'Keine Wörter verfügbar',
            'round.noWordsDesc': 'Die Wortdaten für diese Runde konnten nicht geladen werden.',
            'round.startedAnnounce': 'Runde {round} gestartet. {words} Wörter in dieser Runde.',
            'round.type.twoWords': 'Diese Runde enthält Ausdrücke mit zwei Wörtern.',
            'round.type.threeWords': 'Diese Runde enthält Sätze mit drei Wörtern.',
            'round.type.fourWords': 'Diese Runde enthält Sätze mit vier Wörtern.',
            'round.clickHint': 'Klicke auf einen Buchstaben, um diese Position zu bearbeiten.',
            'round.sentencesToastTitle': 'Runde {round}: Sätze',
            'round.debugCheatAnnounce': 'Debug-Cheat aktiv. Runde {round} als Spitzenplatz abgeschlossen.',
            'round.completedAnnounce': 'Runde {round} abgeschlossen. Du hast {coins} Münzen verdient.',
            'round.completedShort': 'Runde abgeschlossen!',

            'results.roundComplete': 'Runde {round} abgeschlossen!',
            'results.completedSuffix': 'abgeschlossen!',
            'results.totalScorePrefix': 'Gesamtpunkte:',
            'results.thisRoundPrefix': 'Diese Runde:',
            'results.coinsEarnedPrefix': 'Verdiente Münzen:',
            'results.yourCoinsPrefix': 'Deine Münzen:',
            'results.totalScore': 'Gesamtpunkte: {score}',
            'results.thisRound': 'Diese Runde: {score}',
            'results.coinsEarned': 'Verdiente Münzen: {coins}',
            'results.yourCoins': 'Deine Münzen: {coins}',
            'results.openShop': 'Shop öffnen',
            'results.openShopAria': 'Shop öffnen',
            'results.nextRound': 'Nächste Runde',
            'results.nextRoundAria': 'Zur nächsten Runde',
            'results.state.eliminated': 'In dieser Runde ausgeschieden',
            'results.state.champion': 'Rundensieger!',
            'results.state.top3': 'Stark! Podiumsplatz',
            'results.state.survived': 'Du kommst weiter!',
            'results.rankLabel': 'Dein Rang',
            'results.points': 'Punkte',
            'results.roundPoints': 'Rundenpunkte',
            'results.coinsEarnedLabel': 'Verdiente Münzen',
            'results.totalCoins': 'Gesamtmünzen',
            'results.pointsSuffix': ' Punkte',
            'results.coinsSuffix': ' Münzen',
            'results.eliminatedButton': 'Ausgeschieden',
            'results.finalResultsButton': 'Finale Ergebnisse',
            'results.outBadge': 'RAUS',
            'results.outBadgeAria': 'Ausgeschieden',

            'store.overlayAria': 'Bonus-Shop',
            'store.title': 'Bonus-Shop',
            'store.closeAria': 'Shop schließen',
            'store.backToResults': 'Zurück zu den Ergebnissen',
            'store.coinsSuffix': ' Münzen',
            'store.openedAnnounce': 'Shop geöffnet.',
            'store.closedAnnounce': 'Shop geschlossen.',
            'store.buy': 'Bonus kaufen',
            'store.buyAria': '{name} kaufen',
            'store.ownedLabel': 'Besitz',
            'store.owned': 'Besitz: {count}',
            'store.purchasedTitle': 'Bonus gekauft',
            'store.purchasedDesc': '{name} wurde gekauft.',
            'store.notEnoughTitle': 'Nicht genug Münzen',
            'store.notEnoughDesc': '{name} kostet {price} Münzen.',
            'store.needMoreCoinsBadge': 'Mehr Münzen nötig',

            'powerup.double_points.name': 'Doppelte Punkte',
            'powerup.double_points.description': 'Verdoppelt die Punkte für das aktuelle Wort',
            'powerup.letter_filter.name': 'Buchstabenfilter',
            'powerup.letter_filter.description': 'Deaktiviert ähnlich klingende Buchstaben, die im aktuellen Wort nicht vorkommen',
            'powerup.second_chance_round.name': 'Zweite Chance',
            'powerup.second_chance_round.description': 'Erneuter Versuch bei Fehlern (gesamte Runde)',
            'powerup.easier_word.name': 'Einfacheres Wort',
            'powerup.easier_word.description': 'Gibt ein leichteres Wort mit weniger Buchstaben (stapelbar)',
            'powerups.noneTitle': 'Keine Boni verfügbar',
            'powerups.noneDesc': 'Du hast aktuell keine Boni. Kaufe welche zwischen den Runden.',
            'powerups.openMenuAria': 'Bonusmenü öffnen',
            'powerups.noneAvailableAria': 'Noch keine Boni verfügbar',
            'powerups.doublePointsTitle': 'Doppelte Punkte aktiviert',
            'powerups.doublePointsDesc': 'Die Punkte für dieses Wort werden verdoppelt.',
            'powerups.letterFilterActiveTitle': 'Buchstabenfilter aktiv',
            'powerups.letterFilterActiveDesc': '{count} ähnlich klingende Buchstaben wurden für dieses Wort ausgeblendet.',
            'powerups.letterFilterTitle': 'Buchstabenfilter',
            'powerups.letterFilterNoneDesc': 'Für dieses Wort konnten keine Buchstaben gefiltert werden.',
            'powerups.secondChanceTitle': 'Zweite Chance aktiviert',
            'powerups.secondChanceDesc': 'Du hast jetzt bei allen Wörtern dieser Runde eine zusätzliche Chance.',
            'powerups.cannotSimplifyTitle': 'Nicht weiter vereinfachbar',
            'powerups.cannotSimplifyDesc': 'Du bist bereits auf der einfachsten Wortstufe.',
            'powerups.errorTitle': 'Fehler',
            'powerups.noEasierWordDesc': 'Es konnte kein einfacheres Wort gefunden werden.',
            'powerups.newWordMsg': 'Neues Wort: {word} (Stufe {level}, ursprüngliche Punkte bleiben erhalten)',
            'powerups.simplifiedThreeWord': 'Vereinfacht auf einen Satz mit drei Wörtern (Stufe {level}, ursprüngliche Punkte bleiben erhalten)',
            'powerups.simplifiedTwoWord': 'Vereinfacht auf einen Ausdruck mit zwei Wörtern (Stufe {level}, ursprüngliche Punkte bleiben erhalten)',
            'powerups.simplifiedShortPhrase': 'Vereinfacht auf einen kürzeren Ausdruck (Stufe {level}, ursprüngliche Punkte bleiben erhalten)',
            'powerups.simplifiedSingleWord': 'Vereinfacht auf ein Einzelwort (Stufe {level}, ursprüngliche Punkte bleiben erhalten)',
            'powerups.wordSimplifiedTitle': 'Wort vereinfacht',

            'word.announcePerfect': 'Perfekte Antwort. {points} Punkte und {coins} Münzen.',
            'word.announceChecked': 'Antwort geprüft. {points} Punkte.',
            'word.toastSuper': 'Super!',
            'word.toastAlmost': 'Fast!',
            'word.toastError': 'Fehler',
            'word.perfectDesc': '+{points} Punkte, {coinText}',
            'word.perfectDescOriginal': '+{points} Punkte aus dem ursprünglichen {letters}-Buchstaben-{wordDesc}, {coinText}',
            'word.imperfectDesc': '+{points} Punkte',
            'word.imperfectDescOriginal': '+{points} Punkte aus dem ursprünglichen {letters}-Buchstaben-Wort',
            'word.secondChanceTitle': 'Zweite Chance',
            'word.secondChanceRoundDesc': 'Rundenbonus aktiv: Versuch es noch einmal.',
            'word.secondChanceSingleDesc': 'Du kannst es noch einmal versuchen.',
            'word.wordSingle': 'Wort',
            'word.wordPlural': 'Wörter',
            'word.coinSingle': '1 Münze',
            'word.coinPlural': '{count} Münzen',

            'opponents.boostTitle': 'Brauchst du einen Schub?',
            'opponents.boostDesc': 'Nutze Boni, um dir einen Vorteil gegenüber der Konkurrenz zu verschaffen.',

            'final.tournamentCompleteTitle': 'Turnier abgeschlossen!',
            'final.podiumTitle': 'Finales Podium',
            'final.podiumAria': 'Top 3 im Finale',
            'final.scoreHunt': 'Finale Punktejagd',
            'final.baseScore': 'Basispunkte',
            'final.coinBonusPrefix': 'Münzbonus (',
            'final.coinBonusSuffix': ' x 2)',
            'final.total': 'Endsumme',
            'final.rank': 'Endrang: {rank} von {total}',
            'final.rankPrefix': 'Endrang:',
            'final.rankValue': '{rank} von {total}',
            'final.newHighscore': 'Neuer Highscore!',
            'final.finalistsRace': 'Punkte-Rennen der Finalisten',
            'final.championshipLeaderboard': 'Meisterschaftsrangliste',
            'final.playAgain': 'Nochmal spielen',
            'final.playAgainAria': 'Nochmal spielen',
            'final.highscoreEmpty': 'Noch keine Highscores. Sei die erste Person!',
            'final.titleChampion': 'Jackpot-Champion!',
            'final.copyChampion': 'Du hast Platz 1 erreicht und die volle Punktejagd gewonnen.',
            'final.titleStrongRun': 'Starker Lauf!',
            'final.copyStrongRun': 'Du warst voll dabei und hast trotzdem ein starkes Endergebnis geholt.',
            'final.titleStrongFinale': 'Starkes Finale!',
            'final.copyStrongFinale': 'Sauber abgeschlossen. Du hast viele Punkte ins Finale gebracht.',
            'final.highScoreDetails': 'Du bist mit {score} Punkten auf Platz #{position} vorgerückt.',
            'final.announceComplete': 'Turnier abgeschlossen. Endstand {score} Punkte. Rang {rank} von {total}.',

            'highscores.empty': 'Noch keine Highscores. Sei die erste Person!',

            'tts.noVoiceTitle': 'Keine hebräische Stimme gefunden',
            'tts.noVoiceDesc': 'Vorlesen ist deaktiviert. Installiere eine hebräische Stimme im Browser oder Betriebssystem.',
            'tts.read': 'Vorlesen',
            'tts.audioUnavailable': 'Audio nicht verfügbar',
            'tts.noVoiceShort': 'Keine hebr. Stimme',
            'tts.readAria': 'Hebräischen Text vorlesen',
            'tts.unavailableAria': 'Hebräisches Vorlesen nicht verfügbar',
            'tts.autoOn': 'Auto an',
            'tts.autoOff': 'Auto aus',
            'tts.autoDisableAria': 'Automatisches Vorlesen deaktivieren',
            'tts.autoEnableAria': 'Automatisches Vorlesen aktivieren',

            'keyboard.hebrewLetter': 'Hebräischer Buchstabe {letter}',
            'keyboard.backspace': 'Löschen',

            'hero.avatarAlt': 'Avatar von {name}',
            'hero.avatarFallbackName': 'Heldin oder Held',

            'loader.fetchFailed': 'Wortlisten konnten nicht geladen werden: {status} {statusText}',
            'loader.csvEmpty': 'Die CSV-Datei ist leer',
            'loader.requiredColumns': 'CSV benötigt die Spalten: round,german,hebrew (weitere optionale Spalten sind erlaubt)',
            'loader.expectedColumns': 'Zeile {line}: erwartet wurden 3 Spalten',
            'loader.invalidRound': "Zeile {line}: ungültiger Rundenwert '{round}'",
            'loader.duplicateRow': "Zeile {line}: doppelte Zeile '{key}'",
            'loader.fallbackUnavailable': 'Fallback-Wortlisten sind nicht verfügbar',
            'loader.missingRoundWords': 'Fehlende Wörter für {roundKey}',
            'loader.rowValuesRequired': '{row}: Deutsche und hebräische Werte sind erforderlich',
            'loader.invalidRoundValue': "{row}: Ungültige Runde '{round}'. Erwartet 1-6",
            'loader.roundWordCount': "{row}: Runde {round} erwartet {expected} hebräische(s) Wort/Wörter, erhalten: {actual} ('{hebrew}')",
            'loader.fallbackDuplicate': "Doppelte Fallback-Zeile '{key}'",

            'ttsDebug.openAria': 'TTS-Debugmodus öffnen',
            'ttsDebug.closeAria': 'TTS-Debugmodus schließen',
            'ttsDebug.close': 'Schließen',
            'ttsDebug.title': 'TTS Debug Review',
            'ttsDebug.copy': 'Spiele alle Einträge ab, markiere problematische Aussprachen und kopiere danach die markierte Liste.',
            'ttsDebug.filterPlaceholder': 'Filtern (Deutsch / Englisch / Hebräisch / Runde)',
            'ttsDebug.filterAria': 'TTS-Debugliste filtern',
            'ttsDebug.copyFlagged': 'Markierte kopieren',
            'ttsDebug.clearFlagged': 'Markierungen löschen',
            'ttsDebug.ready': 'Bereit.',
            'ttsDebug.emptyLoading': 'Wortdaten werden noch geladen.',
            'ttsDebug.noData': 'Keine Daten verfügbar. Prüfe, ob die CSV geladen wurde.',
            'ttsDebug.noFilterMatch': 'Kein Treffer für den aktuellen Filter.',
            'ttsDebug.statusFilter': 'Filter: {visible}/{total}. Sätze: {sentences}. Wort-Probleme: {wordIssues}.',
            'ttsDebug.statusEntries': 'Einträge: {visible}/{total}. Zeilen mit Problemen: {issueRows}. Sätze: {sentences}. Wort-Probleme: {wordIssues}.',
            'ttsDebug.metaHebrew': 'Hebräisch: {value}',
            'ttsDebug.metaVocalized': 'Vokalisiert: {value}',
            'ttsDebug.metaTts': 'TTS: {value}',
            'ttsDebug.metaSpoken': 'Gesprochen: {value}',
            'ttsDebug.emptyValue': 'leer',
            'ttsDebug.rowHeadline': '#{row} · Runde {round} · {source}',
            'ttsDebug.listen': 'Anhören',
            'ttsDebug.sentenceMarked': 'Satz: markiert',
            'ttsDebug.sentenceUnclear': 'Satz: unklar/unnat.',
            'ttsDebug.issueStress': 'Stress',
            'ttsDebug.issuePronunciation': 'Aussprache',
            'ttsDebug.copyNone': 'Keine markierten Probleme zum Kopieren.',
            'ttsDebug.copySuccess': 'Kopiert: {count} Zeilen mit Problemen.',
            'ttsDebug.copyFailed': 'Kopieren fehlgeschlagen. Bitte erneut versuchen.',
            'ttsDebug.clearNone': 'Es gibt keine Markierungen zum Löschen.',
            'ttsDebug.clearDone': 'Alle Markierungen wurden gelöscht.',
            'ttsDebug.ttsUnavailable': 'TTS ist nicht verfügbar.',
            'ttsDebug.playing': 'Spiele #{row} (Runde {round}) ab.',
            'ttsDebug.playFailed': 'Konnte #{row} nicht abspielen.',
            'ttsDebug.reportTitle': '# Hebrew Tournament TTS issues',
            'ttsDebug.reportCreated': '# created_at: {timestamp}',

            'misc.avatar': 'Avatar'
        }
    };

    const heTranslations = {
        'document.title': '1 נגד 95 - משחק לימוד עברית',
        'language.label': 'שפה',
        'language.english': 'English',
        'language.german': 'Deutsch',
        'language.hebrew': 'עברית',
        'label.you': 'אתה',
        'title.against': 'נגד',

        'start.createChampion': 'צור את הגיבור שלך',
        'start.panelCopy': 'צור גיבור והיכנס לזירה.',
        'start.playerNamePlaceholder': 'הזן שם גיבור',
        'start.playerNameAria': 'שם שחקן',
        'start.startButton': 'התחל משחק',
        'start.startButtonAria': 'התחל משחק',
        'start.avatarSelectLabel': 'בחר דמות',
        'start.moreAvatars': 'עוד דמויות',
        'start.moreAvatarsAria': 'הצג עוד דמויות',
        'start.selectedAvatarAlt': 'דמות נבחרת',
        'start.selectedAvatarAltWithId': 'דמות נבחרת #{id}',
        'start.avatarLabel': 'דמות',
        'start.avatarLabelWithId': 'דמות #{id}',
        'start.avatarGridAria': 'בחר דמות',
        'start.avatarChoiceAria': 'בחר דמות {id}',
        'start.avatarPagerPrevAria': 'הצג דמויות קודמות',
        'start.avatarPagerNextAria': 'הצג דמויות הבאות',
        'start.avatarEmptyAria': 'לא נבחרה דמות',
        'start.topChampions': 'אלופי הצמרת',
        'start.loadingWords': 'טוען מילים...',
        'start.wordsLoadedAnnounce': 'רשימת המילים נטענה. אפשר להתחיל לשחק.',
        'start.wordsLoadFailButton': 'לא ניתן לטעון מילים',
        'start.wordsLoadFailTitle': 'לא ניתן היה לטעון את רשימת המילים',
        'start.loadingToastTitle': 'עדיין טוען',
        'start.loadingToastDesc': 'רשימות המילים עדיין נטענות. המתן רגע.',

        'round.label': 'סיבוב',
        'round.scoreLabel': 'ניקוד',
        'round.coinsLabel': 'מטבעות',
        'round.score': 'ניקוד: {score}',
        'round.coins': 'מטבעות: {coins}',
        'round.promptPlaceholder': 'מילה',
        'round.ttsControlsAria': 'פקדי הקראה',
        'round.playHebrewAria': 'הקרא טקסט עברי',
        'round.playLabel': 'נגן',
        'round.autoToggleAria': 'הפעל או כבה הקראה אוטומטית',
        'round.autoLabel': 'אוטומטי',
        'round.answerFieldAria': 'שדה תשובה בעברית',
        'round.wordCounter': 'מילה {current} מתוך {total}',
        'round.powerups': 'בונוסים',
        'round.powerupsOpenAria': 'פתח תפריט בונוסים',
        'round.submit': 'בדוק תשובה',
        'round.submitAria': 'בדוק תשובה',
        'round.ofSix': 'מתוך 6',
        'round.heroes': 'גיבורים',
        'round.remaining': 'נותרו',
        'round.yourRank': 'הדירוג שלך',
        'round.nextUp': 'בהמשך: סיבוב {round}',
        'round.nextUpPrefix': 'בהמשך: סיבוב',
        'round.description.finalResults': 'תוצאות סופיות',
        'round.description.1': 'מילים בודדות עם 2 אותיות בעברית',
        'round.description.2': 'מילים בודדות עם 4 אותיות בעברית',
        'round.description.3': 'מילים בודדות עם 6 אותיות בעברית',
        'round.description.4': 'ביטויים בעברית בני שתי מילים',
        'round.description.5': 'משפטים בעברית בני שלוש מילים',
        'round.description.6': 'משפטים בעברית בני ארבע מילים',
        'round.noWordsTitle': 'אין מילים זמינות',
        'round.noWordsDesc': 'לא ניתן היה לטעון את המילים לסיבוב הזה.',
        'round.startedAnnounce': 'סיבוב {round} התחיל. {words} מילים בסיבוב הזה.',
        'round.type.twoWords': 'הסיבוב הזה כולל ביטויים בני שתי מילים.',
        'round.type.threeWords': 'הסיבוב הזה כולל משפטים בני שלוש מילים.',
        'round.type.fourWords': 'הסיבוב הזה כולל משפטים בני ארבע מילים.',
        'round.clickHint': 'לחץ על אות כדי לערוך את המיקום הזה.',
        'round.sentencesToastTitle': 'סיבוב {round}: משפטים',
        'round.debugCheatAnnounce': 'מצב דיבאג פעיל. סיבוב {round} הסתיים במקום הראשון.',
        'round.completedAnnounce': 'סיבוב {round} הושלם. הרווחת {coins} מטבעות.',
        'round.completedShort': 'הסיבוב הושלם!',

        'results.roundComplete': 'סיבוב {round} הושלם!',
        'results.completedSuffix': 'הושלם!',
        'results.totalScorePrefix': 'ניקוד כולל:',
        'results.thisRoundPrefix': 'הסיבוב הזה:',
        'results.coinsEarnedPrefix': 'מטבעות שהורווחו:',
        'results.yourCoinsPrefix': 'המטבעות שלך:',
        'results.totalScore': 'ניקוד כולל: {score}',
        'results.thisRound': 'הסיבוב הזה: {score}',
        'results.coinsEarned': 'מטבעות שהורווחו: {coins}',
        'results.yourCoins': 'המטבעות שלך: {coins}',
        'results.openShop': 'פתח חנות',
        'results.openShopAria': 'פתח חנות',
        'results.nextRound': 'לסיבוב הבא',
        'results.nextRoundAria': 'עבור לסיבוב הבא',
        'results.state.eliminated': 'הודחת בסיבוב הזה',
        'results.state.champion': 'מנצח הסיבוב!',
        'results.state.top3': 'מעולה! מקום על הפודיום',
        'results.state.survived': 'עלית לשלב הבא!',
        'results.rankLabel': 'הדירוג שלך',
        'results.points': 'נקודות',
        'results.roundPoints': 'נקודות סיבוב',
        'results.coinsEarnedLabel': 'מטבעות שהורווחו',
        'results.totalCoins': 'סך המטבעות',
        'results.pointsSuffix': ' נקודות',
        'results.coinsSuffix': ' מטבעות',
        'results.eliminatedButton': 'הודחת',
        'results.finalResultsButton': 'תוצאות סופיות',
        'results.outBadge': 'בחוץ',
        'results.outBadgeAria': 'הודח',

        'store.overlayAria': 'חנות בונוסים',
        'store.title': 'חנות בונוסים',
        'store.closeAria': 'סגור חנות',
        'store.backToResults': 'חזרה לתוצאות',
        'store.coinsSuffix': ' מטבעות',
        'store.openedAnnounce': 'החנות נפתחה.',
        'store.closedAnnounce': 'החנות נסגרה.',
        'store.buy': 'קנה בונוס',
        'store.buyAria': 'קנה {name}',
        'store.ownedLabel': 'בבעלותך',
        'store.owned': 'בבעלותך: {count}',
        'store.purchasedTitle': 'הבונוס נרכש',
        'store.purchasedDesc': '{name} נרכש.',
        'store.notEnoughTitle': 'אין מספיק מטבעות',
        'store.notEnoughDesc': '{name} עולה {price} מטבעות.',
        'store.needMoreCoinsBadge': 'חסרים מטבעות',

        'powerup.double_points.name': 'כפל נקודות',
        'powerup.double_points.description': 'מכפיל נקודות למילה הנוכחית',
        'powerup.letter_filter.name': 'מסנן אותיות',
        'powerup.letter_filter.description': 'מכבה אותיות דומות בצליל שאינן במילה',
        'powerup.second_chance_round.name': 'הזדמנות שנייה',
        'powerup.second_chance_round.description': 'ניסיון חוזר במקרה של טעות (לכל הסיבוב)',
        'powerup.easier_word.name': 'מילה קלה יותר',
        'powerup.easier_word.description': 'נותן מילה קלה יותר עם פחות אותיות (ניתן לערימה)',
        'powerups.noneTitle': 'אין בונוסים זמינים',
        'powerups.noneDesc': 'כרגע אין לך בונוסים. קנה בין הסיבובים.',
        'powerups.openMenuAria': 'פתח תפריט בונוסים',
        'powerups.noneAvailableAria': 'עדיין אין בונוסים זמינים',
        'powerups.doublePointsTitle': 'כפל נקודות הופעל',
        'powerups.doublePointsDesc': 'הנקודות למילה הזו מוכפלות.',
        'powerups.letterFilterActiveTitle': 'מסנן אותיות פעיל',
        'powerups.letterFilterActiveDesc': '{count} אותיות דומות הוסתרו עבור המילה הזו.',
        'powerups.letterFilterTitle': 'מסנן אותיות',
        'powerups.letterFilterNoneDesc': 'לא ניתן היה לסנן אותיות למילה הזו.',
        'powerups.secondChanceTitle': 'הזדמנות שנייה הופעלה',
        'powerups.secondChanceDesc': 'כעת יש לך ניסיון נוסף לכל המילים בסיבוב הזה.',
        'powerups.cannotSimplifyTitle': 'אי אפשר לפשט יותר',
        'powerups.cannotSimplifyDesc': 'אתה כבר ברמת המילה הקלה ביותר.',
        'powerups.errorTitle': 'שגיאה',
        'powerups.noEasierWordDesc': 'לא נמצאה מילה קלה יותר.',
        'powerups.newWordMsg': 'מילה חדשה: {word} (רמה {level}, הנקודות המקוריות נשמרות)',
        'powerups.simplifiedThreeWord': 'פושט למשפט בן שלוש מילים (רמה {level}, הניקוד המקורי נשמר)',
        'powerups.simplifiedTwoWord': 'פושט לביטוי בן שתי מילים (רמה {level}, הניקוד המקורי נשמר)',
        'powerups.simplifiedShortPhrase': 'פושט לביטוי קצר יותר (רמה {level}, הניקוד המקורי נשמר)',
        'powerups.simplifiedSingleWord': 'פושט למילה בודדת (רמה {level}, הניקוד המקורי נשמר)',
        'powerups.wordSimplifiedTitle': 'המילה פושטה',

        'word.announcePerfect': 'תשובה מושלמת. {points} נקודות ו-{coins} מטבעות.',
        'word.announceChecked': 'התשובה נבדקה. {points} נקודות.',
        'word.toastSuper': 'מצוין!',
        'word.toastAlmost': 'כמעט!',
        'word.toastError': 'שגיאה',
        'word.perfectDesc': '+{points} נקודות, {coinText}',
        'word.perfectDescOriginal': '+{points} נקודות מהמילה המקורית ({letters} אותיות), {coinText}',
        'word.imperfectDesc': '+{points} נקודות',
        'word.imperfectDescOriginal': '+{points} נקודות מהמילה המקורית ({letters} אותיות)',
        'word.secondChanceTitle': 'הזדמנות שנייה',
        'word.secondChanceRoundDesc': 'בונוס סיבוב פעיל: נסה שוב.',
        'word.secondChanceSingleDesc': 'אפשר לנסות שוב.',
        'word.wordSingle': 'מילה',
        'word.wordPlural': 'מילים',
        'word.coinSingle': 'מטבע 1',
        'word.coinPlural': '{count} מטבעות',

        'opponents.boostTitle': 'צריך דחיפה?',
        'opponents.boostDesc': 'השתמש בבונוסים כדי להשיג יתרון על המתחרים.',

        'final.tournamentCompleteTitle': 'הטורניר הושלם!',
        'final.podiumTitle': 'פודיום סופי',
        'final.podiumAria': 'שלושת הראשונים בגמר',
        'final.scoreHunt': 'ציד הנקודות הסופי',
        'final.baseScore': 'ניקוד בסיס',
        'final.coinBonusPrefix': 'בונוס מטבעות (',
        'final.coinBonusSuffix': ' x 2)',
        'final.total': 'סה״כ סופי',
        'final.rank': 'דירוג סופי: {rank} מתוך {total}',
        'final.rankPrefix': 'דירוג סופי:',
        'final.rankValue': '{rank} מתוך {total}',
        'final.newHighscore': 'שיא חדש!',
        'final.finalistsRace': 'מירוץ נקודות של העולים לגמר',
        'final.championshipLeaderboard': 'טבלת אליפות',
        'final.playAgain': 'שחק שוב',
        'final.playAgainAria': 'שחק שוב',
        'final.highscoreEmpty': 'עדיין אין שיאים. תהיה הראשון!',
        'final.titleChampion': 'אלוף הג׳קפוט!',
        'final.copyChampion': 'הגעת למקום 1 וזכית בכל ציד הנקודות.',
        'final.titleStrongRun': 'ריצה חזקה!',
        'final.copyStrongRun': 'נתת הכול וסיימת עם תוצאה חזקה.',
        'final.titleStrongFinale': 'סיום חזק!',
        'final.copyStrongFinale': 'סיום נקי. הבאת הרבה נקודות לגמר.',
        'final.highScoreDetails': 'עלית למקום #{position} עם {score} נקודות.',
        'final.announceComplete': 'הטורניר הושלם. ניקוד סופי {score} נקודות. דירוג {rank} מתוך {total}.',

        'highscores.empty': 'עדיין אין שיאים. תהיה הראשון!',

        'tts.noVoiceTitle': 'לא נמצאה קול עברי',
        'tts.noVoiceDesc': 'הקראה מושבתת. התקן קול עברי בדפדפן או במערכת ההפעלה.',
        'tts.read': 'נגן',
        'tts.audioUnavailable': 'אודיו לא זמין',
        'tts.noVoiceShort': 'אין קול עברי',
        'tts.readAria': 'הקרא טקסט עברי',
        'tts.unavailableAria': 'הקראה עברית לא זמינה',
        'tts.autoOn': 'אוטומטי פועל',
        'tts.autoOff': 'אוטומטי כבוי',
        'tts.autoDisableAria': 'כבה הקראה אוטומטית',
        'tts.autoEnableAria': 'הפעל הקראה אוטומטית',

        'keyboard.hebrewLetter': 'אות עברית {letter}',
        'keyboard.backspace': 'מחיקה',

        'hero.avatarAlt': 'דמות של {name}',
        'hero.avatarFallbackName': 'גיבור',

        'loader.fetchFailed': 'לא ניתן היה לטעון את רשימות המילים: {status} {statusText}',
        'loader.csvEmpty': 'קובץ ה-CSV ריק',
        'loader.requiredColumns': 'CSV דורש עמודות: round,german,hebrew (עמודות נוספות הן אופציונליות)',
        'loader.expectedColumns': 'שורה {line}: צפויות לפחות 3 עמודות',
        'loader.invalidRound': "שורה {line}: ערך סיבוב לא תקין '{round}'",
        'loader.duplicateRow': "שורה {line}: שורה כפולה '{key}'",
        'loader.fallbackUnavailable': 'רשימות מילים חלופיות אינן זמינות',
        'loader.missingRoundWords': 'חסרות מילים עבור {roundKey}',
        'loader.rowValuesRequired': '{row}: ערכי גרמנית ועברית הם חובה',
        'loader.invalidRoundValue': "{row}: סיבוב לא תקין '{round}'. צפוי 1-6",
        'loader.roundWordCount': "{row}: סיבוב {round} מצפה ל-{expected} מילה/מילים בעברית, התקבל {actual} ('{hebrew}')",
        'loader.fallbackDuplicate': "שורת גיבוי כפולה '{key}'",

        'ttsDebug.openAria': 'פתח מצב דיבאג TTS',
        'ttsDebug.closeAria': 'סגור מצב דיבאג TTS',
        'ttsDebug.close': 'סגור',
        'ttsDebug.title': 'סקירת דיבאג TTS',
        'ttsDebug.copy': 'נגן את כל הרשומות, סמן הגיות בעייתיות ואז העתק את הרשימה המסומנת.',
        'ttsDebug.filterPlaceholder': 'סינון (גרמנית / אנגלית / עברית / סיבוב)',
        'ttsDebug.filterAria': 'סנן רשימת דיבאג TTS',
        'ttsDebug.copyFlagged': 'העתק מסומנים',
        'ttsDebug.clearFlagged': 'נקה סימונים',
        'ttsDebug.ready': 'מוכן.',
        'ttsDebug.emptyLoading': 'נתוני המילים עדיין נטענים.',
        'ttsDebug.noData': 'אין נתונים זמינים. בדוק אם ה-CSV נטען.',
        'ttsDebug.noFilterMatch': 'אין תוצאות למסנן הנוכחי.',
        'ttsDebug.statusFilter': 'מסנן: {visible}/{total}. משפטים: {sentences}. בעיות מילים: {wordIssues}.',
        'ttsDebug.statusEntries': 'רשומות: {visible}/{total}. שורות עם בעיות: {issueRows}. משפטים: {sentences}. בעיות מילים: {wordIssues}.',
        'ttsDebug.metaHebrew': 'עברית: {value}',
        'ttsDebug.metaVocalized': 'מנוקד: {value}',
        'ttsDebug.metaTts': 'TTS: {value}',
        'ttsDebug.metaSpoken': 'מושמע: {value}',
        'ttsDebug.emptyValue': 'ריק',
        'ttsDebug.rowHeadline': '#{row} · סיבוב {round} · {source}',
        'ttsDebug.listen': 'האזן',
        'ttsDebug.sentenceMarked': 'משפט: סומן',
        'ttsDebug.sentenceUnclear': 'משפט: לא ברור/לא טבעי',
        'ttsDebug.issueStress': 'הטעמה',
        'ttsDebug.issuePronunciation': 'הגייה',
        'ttsDebug.copyNone': 'אין בעיות מסומנות להעתקה.',
        'ttsDebug.copySuccess': 'הועתק: {count} שורות עם בעיות.',
        'ttsDebug.copyFailed': 'ההעתקה נכשלה. נסה שוב.',
        'ttsDebug.clearNone': 'אין סימונים לניקוי.',
        'ttsDebug.clearDone': 'כל הסימונים נוקו.',
        'ttsDebug.ttsUnavailable': 'TTS לא זמין.',
        'ttsDebug.playing': 'מנגן #{row} (סיבוב {round}).',
        'ttsDebug.playFailed': 'לא ניתן לנגן את #{row}.',
        'ttsDebug.reportTitle': '# Hebrew Tournament TTS issues',
        'ttsDebug.reportCreated': '# created_at: {timestamp}',

        'misc.avatar': 'דמות'
    };

    translations.he = Object.assign({}, translations.en, heTranslations);

    let currentLanguage = loadStoredLanguage();

    function normalizeLanguage(value) {
        const candidate = String(value || '').trim().toLowerCase();
        if (!candidate) return DEFAULT_LANGUAGE;
        if (candidate.startsWith('de')) return 'de';
        if (candidate === 'iw' || candidate.startsWith('he')) return 'he';
        if (candidate.startsWith('en')) return 'en';
        return DEFAULT_LANGUAGE;
    }

    function loadStoredLanguage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const normalized = normalizeLanguage(stored);
            return SUPPORTED_LANGUAGES.has(normalized) ? normalized : DEFAULT_LANGUAGE;
        } catch (_error) {
            return DEFAULT_LANGUAGE;
        }
    }

    function persistLanguage(language) {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch (_error) {
            // Ignore storage failures.
        }
    }

    function interpolate(template, vars) {
        return String(template || '').replace(/\{(\w+)\}/g, function replaceVar(match, name) {
            if (!vars || vars[name] === undefined || vars[name] === null) return '';
            return String(vars[name]);
        });
    }

    function resolveKey(language, key) {
        const langPack = translations[language] || {};
        if (Object.prototype.hasOwnProperty.call(langPack, key)) {
            return langPack[key];
        }

        const fallbackPack = translations[DEFAULT_LANGUAGE] || {};
        if (Object.prototype.hasOwnProperty.call(fallbackPack, key)) {
            return fallbackPack[key];
        }

        return key;
    }

    function t(key, vars, options = {}) {
        const language = normalizeLanguage(options.language || currentLanguage);
        return interpolate(resolveKey(language, key), vars);
    }

    function applyDocumentLanguage() {
        const html = document.documentElement;
        if (html) {
            html.setAttribute('lang', currentLanguage === 'he' ? 'he' : (currentLanguage === 'de' ? 'de' : 'en'));
        }
        if (document.body) {
            document.body.dataset.uiLanguage = currentLanguage;
        }
        document.title = t('document.title');
    }

    function applyStaticDomTranslations(root = document) {
        if (!root || typeof root.querySelectorAll !== 'function') return;

        root.querySelectorAll('[data-i18n-key]').forEach(function translateText(node) {
            const key = node.getAttribute('data-i18n-key');
            if (!key) return;
            node.textContent = t(key);
        });

        root.querySelectorAll('[data-i18n-placeholder]').forEach(function translatePlaceholder(node) {
            const key = node.getAttribute('data-i18n-placeholder');
            if (!key) return;
            node.setAttribute('placeholder', t(key));
        });

        root.querySelectorAll('[data-i18n-aria-label]').forEach(function translateAriaLabel(node) {
            const key = node.getAttribute('data-i18n-aria-label');
            if (!key) return;
            node.setAttribute('aria-label', t(key));
        });

        root.querySelectorAll('[data-i18n-title]').forEach(function translateTitle(node) {
            const key = node.getAttribute('data-i18n-title');
            if (!key) return;
            node.setAttribute('title', t(key));
        });
    }

    function normalizePromptText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function escapeRegex(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function normalizeCueSource(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/ä/g, 'a')
            .replace(/ö/g, 'o')
            .replace(/ü/g, 'u')
            .replace(/ß/g, 'ss')
            .replace(/[^\w\u0590-\u05ff\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function sourceHasToken(source, token) {
        const normalizedToken = normalizeCueSource(token);
        if (!normalizedToken) return false;

        if (/^[a-z0-9_]+$/.test(normalizedToken)) {
            const tokenPattern = new RegExp(`(^|\\s)${escapeRegex(normalizedToken)}(\\s|$)`);
            return tokenPattern.test(source);
        }

        return source.indexOf(normalizedToken) !== -1;
    }

    function buildDeterministicCue(source) {
        if (!source) return '';

        let hash = 0;
        for (let i = 0; i < source.length; i++) {
            hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
        }

        const paletteSize = HEBREW_CUE_GENERIC_PALETTE.length;
        const primaryIndex = hash % paletteSize;
        const secondaryIndex = (Math.floor(hash / paletteSize) + 3) % paletteSize;
        const primary = HEBREW_CUE_GENERIC_PALETTE[primaryIndex];
        const secondary = HEBREW_CUE_GENERIC_PALETTE[secondaryIndex];

        if (primary === secondary) return primary;
        return `${primary} ${secondary}`;
    }

    function inferEmojiCue(wordData) {
        if (!wordData || typeof wordData !== 'object') return '';

        const cueSource = normalizeCueSource([
            wordData.german || '',
            wordData.english || '',
            wordData.hebrew || '',
            wordData.hebrewVocalized || wordData.hebrew_vocalized || ''
        ].join(' '));
        if (!cueSource) return '';

        const matched = [];
        for (const group of HEBREW_CUE_TOKEN_GROUPS) {
            if (!group || !group.emoji || !Array.isArray(group.tokens)) continue;
            const hasToken = group.tokens.some(function tokenMatcher(token) {
                return sourceHasToken(cueSource, token);
            });
            if (!hasToken) continue;
            if (!matched.includes(group.emoji)) {
                matched.push(group.emoji);
            }
            if (matched.length >= 3) break;
        }

        if (matched.length > 0) {
            return matched.join(' ');
        }

        return buildDeterministicCue(cueSource);
    }

    function getPromptText(wordData) {
        if (!wordData || typeof wordData !== 'object') return '';

        const german = normalizePromptText(wordData.german || '');
        const english = normalizePromptText(wordData.english || '');
        const hebrew = normalizePromptText(wordData.hebrew || '');
        const emoji = normalizePromptText(wordData.emoji || '');
        const inferredEmoji = normalizePromptText(inferEmojiCue(wordData));

        if (currentLanguage === 'de') {
            return german || english || hebrew;
        }
        if (currentLanguage === 'he') {
            return emoji || inferredEmoji || HEBREW_CUE_FALLBACK;
        }
        return english || german || hebrew;
    }

    function setLanguage(nextLanguage, options = {}) {
        const normalized = normalizeLanguage(nextLanguage);
        const changed = normalized !== currentLanguage;
        currentLanguage = normalized;

        if (!options.skipPersist) {
            persistLanguage(currentLanguage);
        }

        applyDocumentLanguage();
        applyStaticDomTranslations();

        if (changed || options.forceEvent) {
            window.dispatchEvent(new CustomEvent('hebrewGame:languageChanged', {
                detail: {
                    language: currentLanguage
                }
            }));
        }

        return currentLanguage;
    }

    function getLanguage() {
        return currentLanguage;
    }

    applyDocumentLanguage();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function onDomReady() {
            applyDocumentLanguage();
            applyStaticDomTranslations();
        });
    } else {
        applyDocumentLanguage();
        applyStaticDomTranslations();
    }

    window.HebrewGame = window.HebrewGame || {};
    window.HebrewGame.i18n = window.HebrewGame.i18n || {};
    window.HebrewGame.i18n.t = t;
    window.HebrewGame.i18n.getLanguage = getLanguage;
    window.HebrewGame.i18n.setLanguage = setLanguage;
    window.HebrewGame.i18n.getPromptText = getPromptText;
    window.HebrewGame.i18n.inferEmojiCue = inferEmojiCue;
    window.HebrewGame.i18n.applyStaticDomTranslations = applyStaticDomTranslations;
})();

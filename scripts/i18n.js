/**
 * Lightweight EN/DE runtime localization helpers.
 */
(function bootstrapI18n() {
    const STORAGE_KEY = 'hebrewGame_uiLanguage_v1';
    const DEFAULT_LANGUAGE = 'en';
    const SUPPORTED_LANGUAGES = new Set(['en', 'de']);

    const translations = {
        en: {
            'document.title': '1 vs 95 - Hebrew Learning Game',
            'language.label': 'Language',
            'language.english': 'English',
            'language.german': 'Deutsch',
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
            'results.state.champion': 'Round winner! Rank 1',
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
            'results.state.champion': 'Rundensieger! Platz 1',
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

    let currentLanguage = loadStoredLanguage();

    function normalizeLanguage(value) {
        const candidate = String(value || '').trim().toLowerCase();
        if (!candidate) return DEFAULT_LANGUAGE;
        if (candidate.startsWith('de')) return 'de';
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
            html.setAttribute('lang', currentLanguage === 'de' ? 'de' : 'en');
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

    function getPromptText(wordData) {
        if (!wordData || typeof wordData !== 'object') return '';

        const german = normalizePromptText(wordData.german || '');
        const english = normalizePromptText(wordData.english || '');
        const hebrew = normalizePromptText(wordData.hebrew || '');

        if (currentLanguage === 'de') {
            return german || english || hebrew;
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
            applyStaticDomTranslations();
        });
    } else {
        applyStaticDomTranslations();
    }

    window.HebrewGame = window.HebrewGame || {};
    window.HebrewGame.i18n = window.HebrewGame.i18n || {};
    window.HebrewGame.i18n.t = t;
    window.HebrewGame.i18n.getLanguage = getLanguage;
    window.HebrewGame.i18n.setLanguage = setLanguage;
    window.HebrewGame.i18n.getPromptText = getPromptText;
    window.HebrewGame.i18n.applyStaticDomTranslations = applyStaticDomTranslations;
})();

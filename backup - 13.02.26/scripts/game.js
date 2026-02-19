/**
 * Backward-compatibility shim.
 * Core loading now happens through explicit script tags in index.html.
 */
(function attachGameNamespace() {
    const HebrewGame = window.HebrewGame = window.HebrewGame || {};

    HebrewGame.core = HebrewGame.core || {};
    HebrewGame.ui = HebrewGame.ui || {};
    HebrewGame.words = HebrewGame.words || {};
    HebrewGame.powerups = HebrewGame.powerups || {};
    HebrewGame.debug = HebrewGame.debug || {};

    // Deprecated global wrappers maintained for compatibility.
    if (typeof window.startGame !== 'function') {
        window.startGame = function startGameWrapper() {
            if (HebrewGame.core && typeof HebrewGame.core.startGame === 'function') {
                return HebrewGame.core.startGame.apply(null, arguments);
            }
        };
    }

    if (typeof window.submitWord !== 'function') {
        window.submitWord = function submitWordWrapper() {
            if (HebrewGame.words && typeof HebrewGame.words.submitWord === 'function') {
                return HebrewGame.words.submitWord.apply(null, arguments);
            }
        };
    }

    if (typeof window.completeRound !== 'function') {
        window.completeRound = function completeRoundWrapper() {
            if (HebrewGame.ui && typeof HebrewGame.ui.completeRound === 'function') {
                return HebrewGame.ui.completeRound.apply(null, arguments);
            }
        };
    }
})();

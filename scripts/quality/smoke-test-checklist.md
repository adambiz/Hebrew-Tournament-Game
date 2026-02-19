# Smoke Test Checklist

Run this checklist manually after major gameplay changes.

1. Start game with empty name: input shakes once and round does not start.
2. Start game with valid name: round 1 starts exactly once.
3. Submit via `Submit Word` button: score updates once.
4. Submit via `Enter`: score updates once (no duplicate processing).
5. Try typing beyond word length in single-word rounds: no extra letters are accepted.
6. Try typing beyond word length in phrase rounds: no extra letters are accepted.
7. Complete a perfect phrase: round coins earned equals coins added to total coins.
8. Open and close store overlay: close button, X button, and backdrop click all work.
9. Buy a power-up in store: inventory increments and coins decrease consistently.
10. Complete a round: results screen appears once with stable rankings and next-step buttons.

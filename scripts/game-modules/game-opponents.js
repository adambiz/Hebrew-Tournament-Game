/**
 * Opponent simulation functions
 */

function getI18nApi() {
    return window.HebrewGame && window.HebrewGame.i18n
        ? window.HebrewGame.i18n
        : null;
}

function t(key, vars) {
    const i18nApi = getI18nApi();
    if (i18nApi && typeof i18nApi.t === 'function') {
        return i18nApi.t(key, vars);
    }
    return key;
}

// Simulate opponent progress for the current word
function simulateOpponentProgress(maxPointsPossible) {
    // Only simulate for active opponents
    const activeOpponents = gameState.opponents.filter(opponent => !opponent.eliminated);
    
    // For each opponent, simulate their performance on this word
    activeOpponents.forEach(opponent => {
        // Calculate probability of getting letters correct based on skill level
        const skillFactor = opponent.skillLevel / 100;
        
        // Determine how many points the opponent earns
        let pointsEarned = 0;
        
        // ROUND-SPECIFIC HANDLING
        if (gameState.currentRound === 1) { // ROUND 1 (2-letter words)
            // Elite opponents in round 1 - virtually guaranteed perfect scores
            if (opponent.isElite || opponent.skillLevel >= 90) {
                // 99.5% chance of perfect score for elites in round 1
                if (Math.random() < 0.995) {
                    pointsEarned = maxPointsPossible;
                } else {
                    // Very rare chance of a single mistake
                    pointsEarned = maxPointsPossible - 1;
                }
            }
            // Strong opponents (skill 80+) in round 1 - mostly perfect with occasional mistakes
            else if (opponent.skillLevel >= 80) {
                if (Math.random() < 0.9) {
                    pointsEarned = maxPointsPossible;
                } else {
                    pointsEarned = maxPointsPossible - 1;
                }
            }
            // Average opponents in round 1 - still perform well but make more mistakes
            else if (opponent.skillLevel >= 50) {
                const perfChance = 0.5 + (opponent.skillLevel - 50) / 100;
                if (Math.random() < perfChance) {
                    pointsEarned = maxPointsPossible;
                } else {
                    pointsEarned = Math.max(1, maxPointsPossible - Math.floor(Math.random() * 2));
                }
            }
            // Weaker opponents - struggle even in round 1
            else {
                const perfChance = opponent.skillLevel / 100;
                if (Math.random() < perfChance) {
                    pointsEarned = maxPointsPossible;
                } else {
                    pointsEarned = Math.max(1, maxPointsPossible - Math.floor(Math.random() * 2));
                }
            }
        }
        else if (gameState.currentRound === 2) { // ROUND 2 (4-letter words)
            // Elite opponents in round 2 - still very high performance
            if (opponent.isElite || opponent.skillLevel >= 90) {
                if (Math.random() < 0.90) {
                    pointsEarned = maxPointsPossible;
                } else {
                    // Slight chance of a small mistake
                    pointsEarned = Math.max(maxPointsPossible - 1, Math.floor(maxPointsPossible * 0.9));
                }
            }
            // Strong opponents (skill 80+) - good performance
            else if (opponent.skillLevel >= 80) {
                if (Math.random() < 0.80) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.9) {
                    pointsEarned = maxPointsPossible - 1;
                } else {
                    pointsEarned = Math.floor(maxPointsPossible * 0.7);
                }
            }
            // Others use regular simulation
            else {
                pointsEarned = null; // Signal to use standard calculation
            }
        }
        else if (gameState.currentRound === 3) { // ROUND 3 (6-letter words)
            // Elite opponents should still perform well but make more mistakes
            if (opponent.isElite) {
                const perfectChance = 0.80; // 80% chance for perfect words
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else {
                    // If not perfect, they'll still get most letters right
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 2);
                }
            }
            // Very strong opponents (90+) also get many perfect words
            else if (opponent.skillLevel >= 90) {
                const perfectChance = 0.75;
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.9) {
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 2);
                } else {
                    pointsEarned = maxPointsPossible - 3;
                }
            }
            // Strong opponents (80+) should still get some perfect words
            else if (opponent.skillLevel >= 80) {
                const perfectChance = 0.5 + ((opponent.skillLevel - 80) / 100);
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.7) {
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 2);
                } else {
                    pointsEarned = Math.floor(maxPointsPossible * 0.7);
                }
            }
            // Others use standard simulation
            else {
                pointsEarned = null;
            }
        }
        else if (gameState.currentRound === 4) { // ROUND 4 (2-word phrases)
            // Even elite opponents struggle with 2-word phrases
            if (opponent.isElite) {
                const perfectChance = 0.70; // 70% chance for perfect phrases
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.85) {
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 2);
                } else {
                    pointsEarned = Math.floor(maxPointsPossible * 0.85);
                }
            }
            // Very strong opponents (90+)
            else if (opponent.skillLevel >= 90) {
                const perfectChance = 0.60;
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.8) {
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 2);
                } else {
                    pointsEarned = Math.floor(maxPointsPossible * 0.8);
                }
            }
            // Others use standard simulation with penalty for phrases
            else {
                pointsEarned = null;
                // Apply a phrase difficulty factor when we calculate below
                opponent.phraseDifficultyFactor = 0.80; // 20% harder than single words
            }
        }
        else if (gameState.currentRound === 5) { // ROUND 5 (3-word sentences)
            // Even elite opponents struggle significantly with 3-word sentences
            if (opponent.isElite) {
                const perfectChance = 0.55; // 55% chance for perfect sentences
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.75) {
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 3);
                } else {
                    pointsEarned = Math.floor(maxPointsPossible * 0.75);
                }
            }
            // Very strong opponents (90+)
            else if (opponent.skillLevel >= 90) {
                const perfectChance = 0.45;
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.7) {
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 3);
                } else {
                    pointsEarned = Math.floor(maxPointsPossible * 0.7);
                }
            }
            // Others use standard simulation with penalty for sentences
            else {
                pointsEarned = null;
                // Apply a sentence difficulty factor when we calculate below
                opponent.phraseDifficultyFactor = 0.65; // 35% harder than single words
            }
        }
        else if (gameState.currentRound === 6) { // ROUND 6 (4-word sentences)
            // Even elite opponents struggle significantly with 4-word sentences
            if (opponent.isElite) {
                const perfectChance = 0.40; // 40% chance for perfect sentences
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.7) {
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 4);
                } else {
                    pointsEarned = Math.floor(maxPointsPossible * 0.7);
                }
            }
            // Very strong opponents (90+)
            else if (opponent.skillLevel >= 90) {
                const perfectChance = 0.30;
                if (Math.random() < perfectChance) {
                    pointsEarned = maxPointsPossible;
                } else if (Math.random() < 0.6) {
                    pointsEarned = maxPointsPossible - Math.ceil(Math.random() * 4);
                } else {
                    pointsEarned = Math.floor(maxPointsPossible * 0.65);
                }
            }
            // Others use standard simulation with penalty for sentences
            else {
                pointsEarned = null;
                // Apply a sentence difficulty factor when we calculate below
                opponent.phraseDifficultyFactor = 0.5; // 50% harder than single words
            }
        }
        
        // For rounds/opponents that didn't get special handling
        if (pointsEarned === null) {
            // Elite opponents have a performance bonus throughout ALL rounds
            const elitePerformanceBonus = opponent.performanceBonus || null;
            
            // Early rounds bonus for elite and strong opponents
            const earlyRoundsBonus = (gameState.currentRound <= 2 && opponent.firstRoundBonus) ? 
                                   opponent.firstRoundBonus : 0;
            
            // If opponent is elite with performance bonus, they get near-perfect scores consistently
            if (elitePerformanceBonus && Math.random() < elitePerformanceBonus) {
                pointsEarned = maxPointsPossible;
            }
            // If opponent has early round bonus and we're in early rounds, they also get near-perfect scores
            else if (earlyRoundsBonus && Math.random() < earlyRoundsBonus) {
                pointsEarned = maxPointsPossible;
            }
            // Otherwise, calculate normal performance
            else {
                // Calculate base probability of getting max points (perfect word)
                let perfectProbability = opponent.perfectWordCapability || 0.3 * Math.pow(skillFactor, 1.5);
                
                // Apply phrase difficulty factor if applicable (for rounds 4-6)
                if (opponent.phraseDifficultyFactor) {
                    perfectProbability *= opponent.phraseDifficultyFactor;
                    // Clear the factor after use
                    delete opponent.phraseDifficultyFactor;
                }
                
                if (Math.random() < perfectProbability) {
                    // Perfect word - all points
                    pointsEarned = maxPointsPossible;
                    
                    // Top-skilled opponents (90+) get bonus consistency
                    if (opponent.skillLevel >= 90 && Math.random() < 0.9) {
                        // Ensure top opponents consistently score well
                        pointsEarned = maxPointsPossible;
                    }
                } else {
                    // Imperfect word - some points based on skill
                    // Calculate minimum points (higher skill = higher minimum)
                    let minPoints = Math.floor(maxPointsPossible * 0.4 * skillFactor);
                    
                    // In later rounds (3+), increase the minimum points for high-skill opponents
                    if (gameState.currentRound >= 3 && opponent.skillLevel >= 80) {
                        // Increase minimum success rate for skilled opponents in later rounds
                        minPoints = Math.max(minPoints, Math.floor(maxPointsPossible * 0.7));
                    }
                    
                    // For phrases (rounds 4-6), reduce the minimum points based on round
                    if (gameState.currentRound >= 4) {
                        const difficultyReduction = 1.0 - (gameState.currentRound - 3) * 0.1;
                        minPoints = Math.floor(minPoints * difficultyReduction);
                    }
                    
                    // Random points between min and max, weighted by skill
                    const maxRandom = maxPointsPossible - minPoints;
                    const randomPoints = Math.floor(Math.random() * maxRandom * skillFactor);
                    
                    pointsEarned = minPoints + randomPoints;
                    
                    // Ensure high-skilled opponents (80+) rarely score very poorly
                    if (opponent.skillLevel >= 80 && pointsEarned < maxPointsPossible * 0.6) {
                        pointsEarned = Math.floor(maxPointsPossible * 0.6 + Math.random() * maxPointsPossible * 0.3);
                    }
                    
                    // Elite opponents almost never make major mistakes - ensure minimum performance
                    if (opponent.isElite && pointsEarned < maxPointsPossible * 0.7) {
                        pointsEarned = Math.floor(maxPointsPossible * 0.7 + Math.random() * maxPointsPossible * 0.2);
                    }
                    
                    // In phrase rounds (4-6), even elite opponents should sometimes make mistakes
                    if (opponent.isElite && gameState.currentRound >= 4) {
                        const phrasePenalty = (gameState.currentRound - 3) * 0.1;
                        if (Math.random() < phrasePenalty) {
                            // Reduce points by 1-3 letters
                            pointsEarned = Math.max(
                                Math.floor(pointsEarned * 0.9), 
                                pointsEarned - Math.ceil(Math.random() * 3)
                            );
                        }
                    }
                }
            }
        }
        
        // Apply consistent performance based on opponent's consistency factor
        // Higher consistency means less variance in performance
        const previousWordCount = gameState.currentWordIndex;
        const currentRound = gameState.currentRound - 1; // 0-indexed for array access
        
        // Only apply consistency if we have previous performance to reference and not in first few words
        if (previousWordCount > 1 && opponent.roundScores[currentRound]) {
            const avgPointsPerWord = opponent.roundScores[currentRound] / previousWordCount;
            
            // Blend new points with consistent historical performance
            // (But less consistency influence in early rounds to ensure proper difficulty curve)
            const consistencyFactor = gameState.currentRound === 1 
                ? Math.min(0.5, opponent.consistency) 
                : opponent.consistency;
                
            pointsEarned = Math.round(
                (pointsEarned * (1 - consistencyFactor)) + 
                (avgPointsPerWord * consistencyFactor)
            );
        }
        
        // Apply some small randomness to make it more interesting, but less for high-skilled opponents
        // Elite opponents get almost no randomness, especially in early rounds
        let randomVariance = opponent.isElite ? 0.01 : (0.1 - (0.08 * (opponent.skillLevel / 100)));
        
        // Reduce randomness in early rounds
        if (gameState.currentRound <= 2) {
            randomVariance = randomVariance / 3;
        }
        
        // Increase randomness in rounds 4-6 for phrases
        if (gameState.currentRound >= 4) {
            randomVariance = randomVariance * (1 + (gameState.currentRound - 3) * 0.2);
        }
        
        const randomFactor = 1 - randomVariance + (Math.random() * randomVariance * 2);
        pointsEarned = Math.floor(pointsEarned * randomFactor);
        
        // Ensure points don't exceed maximum possible
        pointsEarned = Math.min(pointsEarned, maxPointsPossible);
        
        // For round 1, elite opponents should almost never score less than perfect
        if (gameState.currentRound === 1 && opponent.isElite) {
            if (pointsEarned < maxPointsPossible) {
                // 95% chance to correct back to perfect
                if (Math.random() < 0.95) {
                    pointsEarned = maxPointsPossible;
                }
            }
        }
        
        // Add points to opponent's score
        opponent.score += pointsEarned;
        
        // Track round scores for later
        if (!opponent.roundScores[gameState.currentRound - 1]) {
            opponent.roundScores[gameState.currentRound - 1] = 0;
        }
        opponent.roundScores[gameState.currentRound - 1] += pointsEarned;
    });
    
    // After all opponents have earned points, check if player has fallen behind top performers
    // and show an encouraging message if they're struggling
    if (gameState.currentWordIndex >= 2 && gameState.player) { // Only check after a few words
        const topOpponents = [...gameState.opponents]
            .filter(o => !o.eliminated)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
            
        const playerScore = gameState.player.score;
        const topScore = topOpponents[0] ? topOpponents[0].score : 0;
        
        // If player is falling significantly behind the leaders
        if (topScore > playerScore * 1.3 && gameState.currentRound <= 2) {
            // Show an encouraging hint about power-ups occasionally
            if (Math.random() < 0.3 && !gameState.encouragementShown) {
                gameState.encouragementShown = true;
                
                setTimeout(() => {
                    toast({
                        title: t('opponents.boostTitle'),
                        description: t('opponents.boostDesc'),
                        variant: "default"
                    });
                }, 1000);
            }
        }
    }
}

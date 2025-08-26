/**
 * Universal Tournament Structure Generator
 * Creates predetermined tournament structures for any participant count
 * Eliminates the need for complex dynamic calculations during tournaments
 */

/**
 * Calculate the optimal tournament structure for any number of participants
 * @param {number} participantCount - Number of tournament participants
 * @returns {Object} Complete tournament structure with rounds, advancement mappings, and bye placements
 */
export function generateTournamentStructure(participantCount) {
  if (participantCount < 2) {
    throw new Error('Tournament requires at least 2 participants');
  }

  const structure = {
    participantCount,
    rounds: [],
    advancementMap: {},
    byePlacements: {},
    totalRounds: 0
  };

  // Calculate round structure
  let remaining = participantCount;
  let currentRound = 1;

  while (remaining > 1) {
    const matches = Math.floor(remaining / 2);
    const byes = remaining % 2;
    
    structure.rounds.push({
      round: currentRound,
      matches,
      byes,
      participantsEntering: remaining,
      participantsAdvancing: matches + byes
    });

    remaining = matches + byes;
    currentRound++;
  }

  structure.totalRounds = structure.rounds.length;

  // Generate bye placement strategy FIRST to reserve positions
  generateByePlacements(structure);
  
  // Generate advancement mappings AFTER bye placements to avoid conflicts
  generateAdvancementMappings(structure);

  return structure;
}

/**
 * Generate advancement mappings showing who advances to the next round
 * This tracks which match winners move forward, but not their specific positions
 * Position assignment happens during bracket population
 * @param {Object} structure - Tournament structure to populate
 */
function generateAdvancementMappings(structure) {
  for (let roundIndex = 0; roundIndex < structure.rounds.length - 1; roundIndex++) {
    const currentRound = structure.rounds[roundIndex];
    const nextRound = structure.rounds[roundIndex + 1];
    
    // All match winners from current round advance to next round
    // But they don't get specific position assignments here
    for (let match = 1; match <= currentRound.matches; match++) {
      const matchKey = `${currentRound.round}-${match}`;
      
      structure.advancementMap[matchKey] = {
        toRound: nextRound.round,
        fromRound: currentRound.round,
        fromMatch: match,
        advances: true  // Simply indicates this match winner advances
      };
    }
  }
}

/**
 * Generate bye advancement tracking
 * This tracks which byes advance to the next round
 * @param {Object} structure - Tournament structure to populate
 */
function generateByePlacements(structure) {
  for (let roundIndex = 0; roundIndex < structure.rounds.length; roundIndex++) {
    const currentRound = structure.rounds[roundIndex];
    
    if (currentRound.byes > 0) {
      const nextRoundIndex = roundIndex + 1;
      
      if (nextRoundIndex < structure.rounds.length) {
        const nextRound = structure.rounds[nextRoundIndex];
        
        const byeKey = `${currentRound.round}-bye`;
        structure.byePlacements[byeKey] = {
          toRound: nextRound.round,
          fromRound: currentRound.round,
          advances: true  // Simply indicates this bye advances
        };
      }
    }
  }
}


/**
 * Check if a match winner advances to the next round
 * @param {Object} structure - Tournament structure
 * @param {number} round - Round number
 * @param {number} match - Match number
 * @returns {Object|null} Advancement info or null if no advancement
 */
export function getAdvancementDestination(structure, round, match) {
  const matchKey = `${round}-${match}`;
  return structure.advancementMap[matchKey] || null;
}

/**
 * Check if a bye advances from a specific round
 * @param {Object} structure - Tournament structure
 * @param {number} round - Round number
 * @returns {Object|null} Bye advancement info or null if no bye in this round
 */
export function getByePlacement(structure, round) {
  const byeKey = `${round}-bye`;
  return structure.byePlacements[byeKey] || null;
}

/**
 * Validate tournament structure for correctness
 * @param {Object} structure - Tournament structure to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
export function validateTournamentStructure(structure) {
  // Check that each round reduces participants correctly
  for (let i = 0; i < structure.rounds.length; i++) {
    const round = structure.rounds[i];
    const expectedAdvancing = round.matches + round.byes;
    
    if (i < structure.rounds.length - 1) {
      const nextRound = structure.rounds[i + 1];
      if (expectedAdvancing !== nextRound.participantsEntering) {
        throw new Error(`Round ${round.round} advancement mismatch: ${expectedAdvancing} advancing but ${nextRound.participantsEntering} entering next round`);
      }
    }
  }
  
  // Check that final round has exactly 1 participant
  const finalRound = structure.rounds[structure.rounds.length - 1];
  if (finalRound.participantsAdvancing !== 1) {
    throw new Error(`Final round should advance 1 participant, but advances ${finalRound.participantsAdvancing}`);
  }
  
  return true;
}

/**
 * Generate a human-readable tournament bracket preview
 * @param {Object} structure - Tournament structure
 * @returns {string} Formatted tournament structure description
 */
export function formatTournamentStructure(structure) {
  let output = `Tournament Structure for ${structure.participantCount} participants:\n\n`;
  
  structure.rounds.forEach(round => {
    output += `Round ${round.round}: ${round.matches} matches, ${round.byes} byes (${round.participantsEntering} → ${round.participantsAdvancing})\n`;
  });
  
  output += `\nTotal Rounds: ${structure.totalRounds}\n`;
  
  // Show advancement mappings
  output += '\nAdvancement Mappings:\n';
  Object.entries(structure.advancementMap).forEach(([fromKey, destination]) => {
    output += `  ${fromKey} winner → Round ${destination.toRound}\n`;
  });
  
  // Show bye placements
  output += '\nBye Placements:\n';
  Object.entries(structure.byePlacements).forEach(([byeKey, destination]) => {
    output += `  ${byeKey} → Round ${destination.toRound}\n`;
  });
  
  return output;
}
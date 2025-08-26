/**
 * Test file for tournament structure generator
 * Run with: node test_tournament_structure.js
 */

import { 
  generateTournamentStructure, 
  validateTournamentStructure, 
  formatTournamentStructure,
  getAdvancementDestination,
  getByePlacement
} from './src/utils/tournamentStructure.js';

console.log('🏆 Testing Tournament Structure Generator\n');

// Test various participant counts
const testCounts = [5, 8, 15, 19, 31, 32, 64];

testCounts.forEach(count => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing ${count} participants:`);
  console.log('='.repeat(50));
  
  try {
    const structure = generateTournamentStructure(count);
    validateTournamentStructure(structure);
    console.log(formatTournamentStructure(structure));
    
    // Test specific scenarios
    console.log('\n🔍 Testing specific lookups:');
    
    // Test first match advancement
    const firstMatchDestination = getAdvancementDestination(structure, 1, 1);
    if (firstMatchDestination) {
      console.log(`Round 1 Match 1 winner → Round ${firstMatchDestination.toRound} Match ${firstMatchDestination.toMatch} Position ${firstMatchDestination.toPosition}`);
    }
    
    // Test bye placement if Round 1 has a bye
    const round1 = structure.rounds[0];
    if (round1.byes > 0) {
      const byePlacement = getByePlacement(structure, 1);
      if (byePlacement) {
        console.log(`Round 1 bye → Round ${byePlacement.toRound} Match ${byePlacement.toMatch} Position ${byePlacement.toPosition}`);
      }
    }
    
    console.log('✅ Structure validated successfully!');
    
  } catch (error) {
    console.error(`❌ Error with ${count} participants:`, error.message);
  }
});

// Test specific scenarios that were problematic before
console.log('\n' + '='.repeat(70));
console.log('🎯 Testing Specific Problem Scenarios');
console.log('='.repeat(70));

// Test the user's 19-participant scenario
console.log('\n📊 19 Participants (User\'s Current Tournament):');
const structure19 = generateTournamentStructure(19);
console.log(formatTournamentStructure(structure19));

// Verify Round 2 Match 2 advancement
const round2match2 = getAdvancementDestination(structure19, 2, 2);
console.log(`\n🔍 Round 2 Match 2 winner should go to: Round ${round2match2.toRound} Match ${round2match2.toMatch} Position ${round2match2.toPosition}`);

// Verify Round 4 bye placement
const round4bye = getByePlacement(structure19, 4);
if (round4bye) {
  console.log(`🔍 Round 4 bye should go to: Round ${round4bye.toRound} Match ${round4bye.toMatch} Position ${round4bye.toPosition}`);
}

console.log('\n✨ All tests completed!');
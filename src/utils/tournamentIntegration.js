/**
 * Tournament Integration Module
 * Connects the JavaScript tournament structure generator with the database system
 */

import { generateTournamentStructure, validateTournamentStructure } from './tournamentStructure.js';
import { supabase } from './supabase.js';

/**
 * Create a tournament with predetermined structure
 * @param {string} tournamentName - Name of the tournament
 * @param {number} participantCount - Number of participants
 * @returns {Promise<Object>} Tournament creation result
 */
export async function createUniversalTournament(tournamentName, participantCount) {
  try {
    // Generate tournament structure
    const structure = generateTournamentStructure(participantCount);
    validateTournamentStructure(structure);
    
    // Create tournament record
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert([{
        name: tournamentName,
        status: 'setup',
        total_rounds: structure.totalRounds,
        participant_limit: participantCount
      }])
      .select()
      .single();
    
    if (tournamentError) throw tournamentError;
    
    // Store tournament structure in database
    const { error: structureError } = await supabase
      .rpc('store_tournament_structure', {
        tournament_uuid: tournament.id,
        structure_json: structure
      });
    
    if (structureError) throw structureError;
    
    return {
      success: true,
      tournament,
      structure,
      message: `Tournament created with ${structure.totalRounds} rounds for ${participantCount} participants`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate brackets for a tournament using predetermined structure
 * @param {string} tournamentId - Tournament UUID
 * @returns {Promise<Object>} Bracket generation result
 */
export async function generateUniversalBrackets(tournamentId) {
  try {
    // Verify tournament exists and get participant count
    const { data: participants, error: participantError } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('status', 'registered');
    
    if (participantError) throw participantError;
    
    if (!participants || participants.length < 2) {
      throw new Error('Tournament must have at least 2 registered participants');
    }
    
    // Get stored tournament structure
    const { data: structure, error: structureError } = await supabase
      .rpc('get_tournament_structure', { tournament_uuid: tournamentId });
    
    if (structureError) throw structureError;
    if (!structure) throw new Error('Tournament structure not found');
    
    // Verify participant count matches
    if (participants.length !== structure.participantCount) {
      // Regenerate structure for actual participant count
      const newStructure = generateTournamentStructure(participants.length);
      validateTournamentStructure(newStructure);
      
      // Update stored structure
      await supabase.rpc('store_tournament_structure', {
        tournament_uuid: tournamentId,
        structure_json: newStructure
      });
    }
    
    // Generate brackets using universal system
    const { data: totalRounds, error: bracketError } = await supabase
      .rpc('generate_tournament_brackets_universal', { tournament_uuid: tournamentId });
    
    if (bracketError) throw bracketError;
    
    // Update tournament status
    await supabase
      .from('tournaments')
      .update({ status: 'active' })
      .eq('id', tournamentId);
    
    return {
      success: true,
      totalRounds,
      message: `Brackets generated successfully with ${totalRounds} rounds`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Advance tournament winner using predetermined mappings
 * @param {string} bracketId - Bracket UUID
 * @param {string} winnerId - Winner participant UUID
 * @returns {Promise<Object>} Advancement result
 */
export async function advanceTournamentWinnerUniversal(bracketId, winnerId) {
  try {
    const { data: result, error } = await supabase
      .rpc('advance_tournament_winner_universal', {
        bracket_uuid: bracketId,
        winner_participant_id: winnerId
      });
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Winner advanced successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Advance tournament byes using predetermined mappings
 * @param {string} tournamentId - Tournament UUID
 * @returns {Promise<Object>} Bye advancement result
 */
export async function advanceTournamentByesUniversal(tournamentId) {
  try {
    const { error } = await supabase
      .rpc('advance_tournament_byes_universal', { tournament_uuid: tournamentId });
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Byes advanced successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get tournament structure for debugging/display
 * @param {string} tournamentId - Tournament UUID
 * @returns {Promise<Object>} Tournament structure
 */
export async function getTournamentStructure(tournamentId) {
  try {
    const { data: structure, error } = await supabase
      .rpc('get_tournament_structure', { tournament_uuid: tournamentId });
    
    if (error) throw error;
    
    return {
      success: true,
      structure
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Auto-complete match using universal system (for testing)
 * @param {string} bracketId - Bracket UUID
 * @returns {Promise<Object>} Auto-complete result
 */
export async function autoCompleteMatchUniversal(bracketId) {
  try {
    // Get bracket details
    const { data: bracket, error: bracketError } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('id', bracketId)
      .single();
    
    if (bracketError) throw bracketError;
    
    // Randomly select winner
    const winnerId = Math.random() < 0.5 ? bracket.participant1_id : bracket.participant2_id;
    
    if (!winnerId) {
      throw new Error('Cannot auto-complete match with missing participants');
    }
    
    // Advance the winner
    const advancementResult = await advanceTournamentWinnerUniversal(bracketId, winnerId);
    if (!advancementResult.success) throw new Error(advancementResult.error);
    
    // Advance any pending byes
    const byeResult = await advanceTournamentByesUniversal(bracket.tournament_id);
    if (!byeResult.success) throw new Error(byeResult.error);
    
    return {
      success: true,
      winnerId,
      message: 'Match auto-completed successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Migration helper: Convert existing tournament to universal system
 * @param {string} tournamentId - Existing tournament UUID
 * @returns {Promise<Object>} Migration result
 */
export async function migrateTournamentToUniversal(tournamentId) {
  try {
    // Get tournament participant count
    const { data: participants, error: participantError } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('status', 'registered');
    
    if (participantError) throw participantError;
    
    // Generate and store structure
    const structure = generateTournamentStructure(participants.length);
    validateTournamentStructure(structure);
    
    const { error: structureError } = await supabase
      .rpc('store_tournament_structure', {
        tournament_uuid: tournamentId,
        structure_json: structure
      });
    
    if (structureError) throw structureError;
    
    return {
      success: true,
      structure,
      message: `Tournament migrated to universal system (${structure.totalRounds} rounds)`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
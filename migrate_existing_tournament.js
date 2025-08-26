/**
 * Migration Script: Convert Existing Tournament to Universal System
 * Run with: node migrate_existing_tournament.js
 */

import { createClient } from '@supabase/supabase-js';
import { generateTournamentStructure, formatTournamentStructure } from './src/utils/tournamentStructure.js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateExistingTournament() {
  try {
    console.log('🔄 Migrating existing tournament to universal system...\n');
    
    // Get the most recent tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (tournamentError) throw tournamentError;
    
    console.log(`Found tournament: ${tournament.name} (ID: ${tournament.id})`);
    
    // Get participant count
    const { data: participants, error: participantError } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('status', 'registered');
    
    if (participantError) throw participantError;
    
    console.log(`Participants: ${participants.length}`);
    
    // Generate universal tournament structure
    const structure = generateTournamentStructure(participants.length);
    console.log('\nGenerated tournament structure:');
    console.log(formatTournamentStructure(structure));
    
    // Store structure in database
    console.log('📁 Storing tournament structure in database...');
    const { error: structureError } = await supabase
      .rpc('store_tournament_structure', {
        tournament_uuid: tournament.id,
        structure_json: structure
      });
    
    if (structureError) throw structureError;
    
    console.log('✅ Tournament structure stored successfully!');
    
    // Verify storage
    console.log('🔍 Verifying stored structure...');
    const { data: storedStructure, error: verifyError } = await supabase
      .rpc('get_tournament_structure', { tournament_uuid: tournament.id });
    
    if (verifyError) throw verifyError;
    
    if (storedStructure) {
      console.log('✅ Structure verification successful!');
      console.log(`Stored structure has ${storedStructure.totalRounds} rounds`);
      
      // Show key mappings for current tournament state
      console.log('\n📊 Key advancement mappings for current tournament:');
      console.log(`Round 2 Match 2 winner → Round ${storedStructure.advancementMap['2-2'].toRound} Match ${storedStructure.advancementMap['2-2'].toMatch} Position ${storedStructure.advancementMap['2-2'].toPosition}`);
      
      if (storedStructure.byePlacements['4-bye']) {
        const byePlacement = storedStructure.byePlacements['4-bye'];
        console.log(`Round 4 bye → Round ${byePlacement.toRound} Match ${byePlacement.toMatch} Position ${byePlacement.toPosition}`);
      }
      
    } else {
      throw new Error('Structure not found after storage');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Apply the database schema: Run universal_tournament_system.sql in Supabase');
    console.log('2. Update TournamentBracketView to use autoCompleteMatchUniversalWrapper');
    console.log('3. Test the new system with your existing tournament');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateExistingTournament();
}
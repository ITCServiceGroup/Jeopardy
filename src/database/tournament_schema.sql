-- Tournament System Database Schema
-- This file contains the database schema additions for the tournament/bracket challenge system

-- Create tournaments table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'setup',
    max_participants INTEGER,
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER,
    tournament_type VARCHAR(20) NOT NULL DEFAULT 'single_elimination',
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    winner_name TEXT,
    CONSTRAINT tournaments_status_check CHECK (status = ANY (ARRAY['setup', 'registration', 'active', 'completed', 'cancelled'])),
    CONSTRAINT tournaments_type_check CHECK (tournament_type = ANY (ARRAY['single_elimination', 'double_elimination']))
);

-- Create tournament_participants table
CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    seed_number INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'registered',
    eliminated_in_round INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tournament_participants_status_check CHECK (status = ANY (ARRAY['registered', 'active', 'eliminated', 'winner'])),
    CONSTRAINT tournament_participants_unique_name UNIQUE (tournament_id, participant_name)
);

-- Create tournament_brackets table  
CREATE TABLE tournament_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    participant1_id UUID REFERENCES tournament_participants(id),
    participant2_id UUID REFERENCES tournament_participants(id),
    winner_id UUID REFERENCES tournament_participants(id),
    match_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    game_session_id UUID REFERENCES game_sessions(id),
    bye_match BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT tournament_brackets_status_check CHECK (match_status = ANY (ARRAY['pending', 'in_progress', 'completed', 'bye'])),
    CONSTRAINT tournament_brackets_unique_match UNIQUE (tournament_id, round_number, match_number)
);

-- Create tournament_available_names table (for pre-approved participant names)
CREATE TABLE tournament_available_names (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants(status);
CREATE INDEX idx_tournament_brackets_tournament ON tournament_brackets(tournament_id);
CREATE INDEX idx_tournament_brackets_round ON tournament_brackets(round_number);
CREATE INDEX idx_tournament_brackets_status ON tournament_brackets(match_status);
CREATE INDEX idx_tournament_available_names_active ON tournament_available_names(is_active);

-- Create tournament bracket generation function
CREATE OR REPLACE FUNCTION generate_tournament_brackets(tournament_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    participant_count INTEGER;
    calculated_total_rounds INTEGER;
    current_round INTEGER := 1;
    current_match INTEGER := 1;
    participants_cursor CURSOR FOR 
        SELECT id, participant_name 
        FROM tournament_participants 
        WHERE tournament_id = tournament_uuid 
        AND status = 'registered'
        ORDER BY gen_random_uuid();
    participant_record RECORD;
    participant_ids UUID[];
    i INTEGER;
    j INTEGER;
    next_power_of_2 INTEGER;
BEGIN
    -- Get participant count
    SELECT COUNT(*) INTO participant_count
    FROM tournament_participants
    WHERE tournament_id = tournament_uuid AND status = 'registered';
    
    IF participant_count < 2 THEN
        RAISE EXCEPTION 'Need at least 2 participants to generate brackets';
    END IF;
    
    -- Calculate next power of 2 and total rounds
    next_power_of_2 := POWER(2, CEIL(LOG(2, participant_count)));
    calculated_total_rounds := LOG(2, next_power_of_2);
    
    -- Update tournament with total rounds
    UPDATE tournaments 
    SET total_rounds = calculated_total_rounds
    WHERE id = tournament_uuid;
    
    -- Clear any existing brackets
    DELETE FROM tournament_brackets WHERE tournament_id = tournament_uuid;
    
    -- Collect participant IDs
    participant_ids := ARRAY[]::UUID[];
    FOR participant_record IN participants_cursor LOOP
        participant_ids := array_append(participant_ids, participant_record.id);
    END LOOP;
    
    -- Add byes if needed (to reach next power of 2)
    WHILE array_length(participant_ids, 1) < next_power_of_2 LOOP
        participant_ids := array_append(participant_ids, NULL);
    END LOOP;
    
    -- Generate first round brackets
    i := 1;
    current_match := 1;
    WHILE i <= array_length(participant_ids, 1) LOOP
        -- Check if this is a bye match (one participant is NULL)
        IF participant_ids[i] IS NULL OR participant_ids[i+1] IS NULL THEN
            INSERT INTO tournament_brackets (
                tournament_id, round_number, match_number,
                participant1_id, participant2_id, match_status, bye_match,
                winner_id
            ) VALUES (
                tournament_uuid, current_round, current_match,
                participant_ids[i], participant_ids[i+1], 'bye', TRUE,
                COALESCE(participant_ids[i], participant_ids[i+1])
            );
        ELSE
            INSERT INTO tournament_brackets (
                tournament_id, round_number, match_number,
                participant1_id, participant2_id, match_status, bye_match
            ) VALUES (
                tournament_uuid, current_round, current_match,
                participant_ids[i], participant_ids[i+1], 'pending', FALSE
            );
        END IF;
        
        i := i + 2;
        current_match := current_match + 1;
    END LOOP;
    
    -- Generate placeholder brackets for subsequent rounds
    FOR round_num IN 2..calculated_total_rounds LOOP
        current_match := 1;
        FOR match_num IN 1..(POWER(2, calculated_total_rounds - round_num)) LOOP
            INSERT INTO tournament_brackets (
                tournament_id, round_number, match_number,
                match_status
            ) VALUES (
                tournament_uuid, round_num, current_match, 'pending'
            );
            current_match := current_match + 1;
        END LOOP;
    END LOOP;
    
    RETURN calculated_total_rounds;
END;
$$ LANGUAGE plpgsql;

-- Create function to advance winners to next round
CREATE OR REPLACE FUNCTION advance_tournament_winner(bracket_uuid UUID, winner_participant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_tournament_id UUID;
    current_round INTEGER;
    current_match INTEGER;
    next_round INTEGER;
    next_match INTEGER;
    next_bracket_id UUID;
BEGIN
    -- Get current bracket info
    SELECT tournament_id, round_number, match_number
    INTO current_tournament_id, current_round, current_match
    FROM tournament_brackets
    WHERE id = bracket_uuid;
    
    -- Update current bracket with winner
    UPDATE tournament_brackets
    SET winner_id = winner_participant_id,
        match_status = 'completed',
        completed_at = CURRENT_TIMESTAMP
    WHERE id = bracket_uuid;
    
    -- Calculate next round position
    next_round := current_round + 1;
    next_match := CEIL(current_match / 2.0);
    
    -- Find the next round bracket
    SELECT id INTO next_bracket_id
    FROM tournament_brackets
    WHERE tournament_id = current_tournament_id
    AND round_number = next_round
    AND match_number = next_match;
    
    -- If next bracket exists, add winner
    IF next_bracket_id IS NOT NULL THEN
        -- Determine if this is participant1 or participant2 slot
        IF current_match % 2 = 1 THEN
            -- Odd match number goes to participant1
            UPDATE tournament_brackets
            SET participant1_id = winner_participant_id
            WHERE id = next_bracket_id;
        ELSE
            -- Even match number goes to participant2
            UPDATE tournament_brackets
            SET participant2_id = winner_participant_id
            WHERE id = next_bracket_id;
        END IF;
    ELSE
        -- This was the final match, update tournament winner
        UPDATE tournaments
        SET winner_name = (SELECT participant_name FROM tournament_participants WHERE id = winner_participant_id),
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP
        WHERE id = current_tournament_id;
        
        -- Update winner participant status
        UPDATE tournament_participants
        SET status = 'winner'
        WHERE id = winner_participant_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tournament tables
CREATE TRIGGER update_tournament_available_names_updated_at
    BEFORE UPDATE ON tournament_available_names
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add tournament_id to game_sessions table
ALTER TABLE game_sessions ADD COLUMN tournament_id UUID REFERENCES tournaments(id);

-- Create index for tournament games
CREATE INDEX idx_game_sessions_tournament ON game_sessions(tournament_id);

-- Enable Row Level Security for tournament tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_available_names ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for tournament tables
CREATE POLICY "Enable read access for all users" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON tournaments FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON tournament_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON tournament_participants FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON tournament_brackets FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON tournament_brackets FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON tournament_available_names FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON tournament_available_names FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournament_available_names FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON tournament_available_names FOR DELETE USING (true);
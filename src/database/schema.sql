-- Jeopardy Game Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable row level security globally
ALTER DATABASE CURRENT SET row_security = on;

-- Tech Types table (for categorizing different technologies/topics)
CREATE TABLE tech_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table (for organizing questions by category within tech types)
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table to link categories with tech types (many-to-many relationship)
CREATE TABLE category_tech_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    tech_type_id INTEGER NOT NULL REFERENCES tech_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, tech_type_id)
);

-- Questions table (stores all game questions)
CREATE TABLE questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB,
    correct_answers JSONB NOT NULL,
    points INTEGER NOT NULL DEFAULT 100,
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments table (manages tournament events)
CREATE TABLE tournaments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tournament_type VARCHAR(50) DEFAULT 'single_elimination',
    status VARCHAR(50) DEFAULT 'setup',
    max_participants INTEGER,
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER,
    created_by TEXT,
    winner_name TEXT,
    second_place_name TEXT,
    third_place_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tournament participants table
CREATE TABLE tournament_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    seed_number INTEGER,
    status VARCHAR(50) DEFAULT 'registered',
    eliminated_in_round INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, participant_name)
);

-- Tournament structure storage table
CREATE TABLE tournament_structures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID UNIQUE NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    participant_count INTEGER NOT NULL,
    total_rounds INTEGER NOT NULL,
    structure_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tournament brackets table (manages tournament matches)
CREATE TABLE tournament_brackets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    participant1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    participant2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
    match_status VARCHAR(50) DEFAULT 'pending',
    bye_match BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tournament_id, round_number, match_number)
);

-- Game sessions table (tracks individual games)
CREATE TABLE game_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    tech_type_id INTEGER REFERENCES tech_types(id) ON DELETE SET NULL,
    player1_name TEXT,
    player2_name TEXT,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner INTEGER, -- 1 for player1, 2 for player2, NULL for tie/incomplete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE
);

-- Game statistics table (tracks question-by-question performance)
CREATE TABLE game_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tech_type_id INTEGER REFERENCES tech_types(id) ON DELETE SET NULL,
    current_player INTEGER NOT NULL, -- 1 or 2
    player1_name TEXT,
    player2_name TEXT,
    question_category TEXT,
    correct BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tournament available names table (pre-approved tournament names)
CREATE TABLE tournament_available_names (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Markets table (geographic locations)
CREATE TABLE markets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Associate tournaments and available names with a market (nullable for backward compatibility)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES markets(id) ON DELETE SET NULL;
ALTER TABLE tournament_available_names ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES markets(id) ON DELETE SET NULL;

-- Indexes for market-related queries
CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(is_active);
CREATE INDEX IF NOT EXISTS idx_tournaments_market_id ON tournaments(market_id);
CREATE INDEX IF NOT EXISTS idx_tournament_available_names_market_id ON tournament_available_names(market_id);


-- Create indexes for better performance
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_points ON questions(points);
CREATE INDEX idx_category_tech_types_category ON category_tech_types(category_id);
CREATE INDEX idx_category_tech_types_tech_type ON category_tech_types(tech_type_id);
CREATE INDEX idx_game_sessions_tech_type ON game_sessions(tech_type_id);
CREATE INDEX idx_game_sessions_tournament ON game_sessions(tournament_id);
CREATE INDEX idx_game_sessions_winner ON game_sessions(winner);
CREATE INDEX idx_game_stats_session ON game_statistics(game_session_id);
CREATE INDEX idx_game_stats_question ON game_statistics(question_id);
CREATE INDEX idx_game_stats_tech_type ON game_statistics(tech_type_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants(status);
CREATE INDEX idx_tournament_brackets_tournament ON tournament_brackets(tournament_id);
CREATE INDEX idx_tournament_brackets_round ON tournament_brackets(round_number);
CREATE INDEX idx_tournament_brackets_status ON tournament_brackets(match_status);
CREATE INDEX idx_tournament_structures_tournament_id ON tournament_structures(tournament_id);
CREATE INDEX idx_tournament_available_names_active ON tournament_available_names(is_active);

-- Functions

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update game session scores
CREATE OR REPLACE FUNCTION update_game_session_scores()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE game_sessions
  SET
    player1_score = (
      SELECT COALESCE(SUM(
        CASE
          WHEN gs.correct AND gs.current_player = 1 THEN q.points
          WHEN NOT gs.correct AND gs.current_player = 1 THEN -q.points
          ELSE 0
        END
      ), 0)
      FROM game_statistics gs
      JOIN questions q ON q.id = gs.question_id
      WHERE gs.game_session_id = NEW.game_session_id
    ),
    player2_score = (
      SELECT COALESCE(SUM(
        CASE
          WHEN gs.correct AND gs.current_player = 2 THEN q.points
          WHEN NOT gs.correct AND gs.current_player = 2 THEN -q.points
          ELSE 0
        END
      ), 0)
      FROM game_statistics gs
      JOIN questions q ON q.id = gs.question_id
      WHERE gs.game_session_id = NEW.game_session_id
    )
  WHERE id = NEW.game_session_id;

  -- Update winner based on current scores
  UPDATE game_sessions
  SET winner = CASE
    WHEN player1_score > player2_score THEN 1
    WHEN player2_score > player1_score THEN 2
    ELSE NULL
  END
  WHERE id = NEW.game_session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to store tournament structure
CREATE OR REPLACE FUNCTION store_tournament_structure(tournament_uuid UUID, structure_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  participant_count INTEGER;
  total_rounds_param INTEGER;
BEGIN
  -- Extract key values from structure
  participant_count := (structure_json->>'participantCount')::INTEGER;
  total_rounds_param := (structure_json->>'totalRounds')::INTEGER;

  -- Insert or update tournament structure
  INSERT INTO tournament_structures (tournament_id, participant_count, total_rounds, structure_data)
  VALUES (tournament_uuid, participant_count, total_rounds_param, structure_json)
  ON CONFLICT (tournament_id)
  DO UPDATE SET
    participant_count = EXCLUDED.participant_count,
    total_rounds = EXCLUDED.total_rounds,
    structure_data = EXCLUDED.structure_data;

  -- Update tournament with total rounds
  UPDATE tournaments
  SET total_rounds = total_rounds_param
  WHERE id = tournament_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get tournament structure
CREATE OR REPLACE FUNCTION get_tournament_structure(tournament_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  structure JSONB;
BEGIN
  SELECT structure_data INTO structure
  FROM tournament_structures
  WHERE tournament_id = tournament_uuid;

  RETURN structure;
END;
$$ LANGUAGE plpgsql;

-- Function to generate tournament brackets
CREATE OR REPLACE FUNCTION generate_tournament_brackets_universal(tournament_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  tournament_structure JSONB;
  participant_count INTEGER;
  round_data JSONB;
  round_info RECORD;
  current_participant_idx INTEGER := 1;
  current_match INTEGER;
  participants_cursor CURSOR FOR
    SELECT id, participant_name
    FROM tournament_participants
    WHERE tournament_id = tournament_uuid
    AND status = 'registered'
    ORDER BY gen_random_uuid();
  participant_record RECORD;
  participant_ids UUID[];
BEGIN
  -- Get tournament structure
  SELECT structure_data INTO tournament_structure
  FROM tournament_structures
  WHERE tournament_id = tournament_uuid;

  IF tournament_structure IS NULL THEN
    RAISE EXCEPTION 'Tournament structure not found. Call store_tournament_structure first.';
  END IF;

  participant_count := (tournament_structure->>'participantCount')::INTEGER;

  -- Clear any existing brackets
  DELETE FROM tournament_brackets WHERE tournament_id = tournament_uuid;

  -- Collect participant IDs randomly
  participant_ids := ARRAY[]::UUID[];
  FOR participant_record IN participants_cursor LOOP
    participant_ids := array_append(participant_ids, participant_record.id);
  END LOOP;

  -- Generate brackets for each round
  FOR round_info IN
    SELECT
      (value->>'round')::INTEGER as round_number,
      (value->>'matches')::INTEGER as matches,
      (value->>'byes')::INTEGER as byes
    FROM jsonb_array_elements(tournament_structure->'rounds') as value
  LOOP
    current_match := 1;

    -- Generate matches for this round
    FOR i IN 1..round_info.matches LOOP
      IF round_info.round_number = 1 THEN
        -- First round: assign actual participants
        INSERT INTO tournament_brackets (
          tournament_id, round_number, match_number,
          participant1_id, participant2_id, match_status, bye_match
        ) VALUES (
          tournament_uuid, round_info.round_number, current_match,
          participant_ids[current_participant_idx],
          participant_ids[current_participant_idx + 1],
          'pending', FALSE
        );
        current_participant_idx := current_participant_idx + 2;
      ELSE
        -- Later rounds: placeholder brackets
        INSERT INTO tournament_brackets (
          tournament_id, round_number, match_number,
          match_status, bye_match
        ) VALUES (
          tournament_uuid, round_info.round_number, current_match,
          'pending', FALSE
        );
      END IF;
      current_match := current_match + 1;
    END LOOP;

    -- Handle byes for this round
    FOR i IN 1..round_info.byes LOOP
      INSERT INTO tournament_brackets (
        tournament_id, round_number, match_number,
        participant1_id, match_status, bye_match, winner_id
      ) VALUES (
        tournament_uuid, round_info.round_number, current_match,
        participant_ids[current_participant_idx],
        'completed', TRUE, participant_ids[current_participant_idx]
      );
      current_participant_idx := current_participant_idx + 1;
      current_match := current_match + 1;
    END LOOP;
  END LOOP;

  -- Auto-advance any completed byes
  PERFORM advance_tournament_byes_universal(tournament_uuid);

  RETURN (tournament_structure->>'totalRounds')::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to advance tournament byes
CREATE OR REPLACE FUNCTION advance_tournament_byes_universal(tournament_uuid UUID)
RETURNS VOID AS $$
DECLARE
  tournament_structure JSONB;
  bye_placements JSONB;
  bye_record RECORD;
  bye_key TEXT;
  destination JSONB;
  destination_round INTEGER;
  next_bracket_id UUID;
BEGIN
  -- Get tournament structure
  SELECT structure_data INTO tournament_structure
  FROM tournament_structures
  WHERE tournament_id = tournament_uuid;

  IF tournament_structure IS NULL THEN
    RAISE EXCEPTION 'Tournament structure not found for tournament %', tournament_uuid;
  END IF;

  -- Get bye placements
  bye_placements := tournament_structure->'byePlacements';

  -- Process all bye matches that need advancement
  FOR bye_record IN
    SELECT id, winner_id, round_number, match_number
    FROM tournament_brackets
    WHERE tournament_id = tournament_uuid
      AND bye_match = TRUE
      AND winner_id IS NOT NULL
      AND match_status = 'completed'
    ORDER BY round_number, match_number
  LOOP
    bye_key := bye_record.round_number || '-bye';
    destination := bye_placements->bye_key;

    IF destination IS NOT NULL THEN
      -- Extract destination round
      destination_round := (destination->>'toRound')::INTEGER;

      -- Check if bye winner is already placed in destination round
      IF NOT EXISTS (
        SELECT 1 FROM tournament_brackets
        WHERE tournament_id = tournament_uuid
        AND round_number = destination_round
        AND (participant1_id = bye_record.winner_id OR participant2_id = bye_record.winner_id)
      ) THEN
        -- Find first available bracket in destination round
        SELECT id INTO next_bracket_id
        FROM tournament_brackets
        WHERE tournament_id = tournament_uuid
        AND round_number = destination_round
        AND bye_match = FALSE
        AND (participant1_id IS NULL OR participant2_id IS NULL)
        ORDER BY match_number
        LIMIT 1;

        IF next_bracket_id IS NOT NULL THEN
          -- Place bye winner in first available position
          UPDATE tournament_brackets
          SET participant1_id = CASE
            WHEN participant1_id IS NULL THEN bye_record.winner_id
            ELSE participant1_id
          END,
          participant2_id = CASE
            WHEN participant1_id IS NOT NULL AND participant2_id IS NULL THEN bye_record.winner_id
            ELSE participant2_id
          END
          WHERE id = next_bracket_id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to advance tournament winner
CREATE OR REPLACE FUNCTION advance_tournament_winner_universal(bracket_uuid UUID, winner_participant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_tournament_id UUID;
  current_round INTEGER;
  current_match INTEGER;
  tournament_structure JSONB;
  advancement_map JSONB;
  match_key TEXT;
  destination JSONB;
  destination_round INTEGER;
  next_bracket_id UUID;
  available_regular_brackets INTEGER;
  available_bye_brackets INTEGER;
  total_rounds INTEGER;
  final_round_participants UUID[];
  semifinal_round_participants UUID[];
  losing_finalist_id UUID;
  third_place_candidates UUID[];
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

  -- Get tournament structure
  SELECT structure_data INTO tournament_structure
  FROM tournament_structures
  WHERE tournament_id = current_tournament_id;

  IF tournament_structure IS NULL THEN
    RAISE EXCEPTION 'Tournament structure not found for tournament %', current_tournament_id;
  END IF;

  -- Get advancement mappings
  advancement_map := tournament_structure->'advancementMap';
  match_key := current_round || '-' || current_match;
  destination := advancement_map->match_key;

  -- If no destination, this is the final match
  IF destination IS NULL THEN
    -- Get total rounds to determine final/semifinal rounds
    total_rounds := (tournament_structure->>'totalRounds')::INTEGER;

    -- Get the losing finalist (2nd place)
    SELECT CASE
      WHEN participant1_id = winner_participant_id THEN participant2_id
      ELSE participant1_id
    END INTO losing_finalist_id
    FROM tournament_brackets
    WHERE id = bracket_uuid;

    -- Determine 3rd place from semifinal losers (previous round)
    IF total_rounds >= 2 THEN
      SELECT ARRAY_AGG(
        CASE
          WHEN winner_id = participant1_id THEN participant2_id
          ELSE participant1_id
        END
      ) INTO third_place_candidates
      FROM tournament_brackets
      WHERE tournament_id = current_tournament_id
        AND round_number = total_rounds - 1
        AND match_status = 'completed'
        AND winner_id IS NOT NULL
        AND (participant1_id IS NOT NULL AND participant2_id IS NOT NULL);
    END IF;

    -- Update tournament with winner and places
    UPDATE tournaments
    SET winner_name = (SELECT participant_name FROM tournament_participants WHERE id = winner_participant_id),
        second_place_name = (SELECT participant_name FROM tournament_participants WHERE id = losing_finalist_id),
        third_place_name = (
          SELECT participant_name
          FROM tournament_participants
          WHERE id = COALESCE(third_place_candidates[1], NULL)
        ),
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
    WHERE id = current_tournament_id;

    -- Update participant statuses
    UPDATE tournament_participants
    SET status = 'winner'
    WHERE id = winner_participant_id;

    UPDATE tournament_participants
    SET status = 'eliminated'
    WHERE id = losing_finalist_id;

    -- Mark semifinal losers as eliminated if not already
    IF third_place_candidates IS NOT NULL THEN
      UPDATE tournament_participants
      SET status = 'eliminated'
      WHERE id = ANY(third_place_candidates);
    END IF;

    RETURN TRUE;
  END IF;

  -- Extract destination round
  destination_round := (destination->>'toRound')::INTEGER;

  -- Check available slots in destination round
  SELECT COUNT(*) INTO available_regular_brackets
  FROM tournament_brackets
  WHERE tournament_id = current_tournament_id
  AND round_number = destination_round
  AND bye_match = FALSE
  AND (participant1_id IS NULL OR participant2_id IS NULL);

  SELECT COUNT(*) INTO available_bye_brackets
  FROM tournament_brackets
  WHERE tournament_id = current_tournament_id
  AND round_number = destination_round
  AND bye_match = TRUE
  AND participant1_id IS NULL;

  -- Try to find a regular match position first
  IF available_regular_brackets > 0 THEN
    SELECT id INTO next_bracket_id
    FROM tournament_brackets
    WHERE tournament_id = current_tournament_id
    AND round_number = destination_round
    AND bye_match = FALSE
    AND (participant1_id IS NULL OR participant2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;

    -- Place winner in first available position
    UPDATE tournament_brackets
    SET participant1_id = CASE
      WHEN participant1_id IS NULL THEN winner_participant_id
      ELSE participant1_id
    END,
    participant2_id = CASE
      WHEN participant1_id IS NOT NULL AND participant2_id IS NULL THEN winner_participant_id
      ELSE participant2_id
    END
    WHERE id = next_bracket_id;

  ELSIF available_bye_brackets > 0 THEN
    -- No regular positions available, but there's a bye position
    SELECT id INTO next_bracket_id
    FROM tournament_brackets
    WHERE tournament_id = current_tournament_id
    AND round_number = destination_round
    AND bye_match = TRUE
    AND participant1_id IS NULL
    ORDER BY match_number
    LIMIT 1;

    -- Place winner in bye position and mark as completed
    UPDATE tournament_brackets
    SET participant1_id = winner_participant_id,
        winner_id = winner_participant_id,
        match_status = 'completed'
    WHERE id = next_bracket_id;

  ELSE
    RAISE EXCEPTION 'No available bracket found in Round %', destination_round;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_available_names_updated_at
    BEFORE UPDATE ON tournament_available_names
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_game_session_scores_trigger
    AFTER INSERT OR UPDATE ON game_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_game_session_scores();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_tech_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_available_names ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Enable all access for categories" ON categories FOR ALL TO public USING (true) WITH CHECK (true);

-- Category tech types policies
CREATE POLICY "Enable all access for category_tech_types" ON category_tech_types FOR ALL TO public USING (true) WITH CHECK (true);

-- Questions policies
CREATE POLICY "Enable all access for questions" ON questions FOR ALL TO public USING (true) WITH CHECK (true);

-- Game sessions policies
CREATE POLICY "Enable all access for game_sessions" ON game_sessions FOR ALL TO public USING (true) WITH CHECK (true);

-- Game statistics policies
CREATE POLICY "Enable all access for game_statistics" ON game_statistics FOR ALL TO public USING (true) WITH CHECK (true);

-- Tournaments policies
CREATE POLICY "Enable read access for all users" ON tournaments FOR SELECT TO public USING (true);
CREATE POLICY "Enable write access for all users" ON tournaments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournaments FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON tournaments FOR DELETE TO public USING (true);

-- Tournament participants policies
CREATE POLICY "Enable read access for all users" ON tournament_participants FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON tournament_participants FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON tournament_participants FOR UPDATE TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete participants in setup" ON tournament_participants FOR DELETE TO public USING (
    EXISTS (
        SELECT 1 FROM tournaments t
        WHERE t.id = tournament_participants.tournament_id
        AND t.status = 'setup'
    )
);

-- Tournament brackets policies
CREATE POLICY "Enable read access for all users" ON tournament_brackets FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON tournament_brackets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournament_brackets FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON tournament_brackets FOR DELETE TO public USING (true);
CREATE POLICY "Allow delete brackets in setup" ON tournament_brackets FOR DELETE TO public USING (
    EXISTS (
        SELECT 1 FROM tournaments t
        WHERE t.id = tournament_brackets.tournament_id
        AND t.status = 'setup'
    )
);

-- Tournament available names policies
CREATE POLICY "Enable read access for all users" ON tournament_available_names FOR SELECT TO public USING (true);
CREATE POLICY "Enable write access for all users" ON tournament_available_names FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournament_available_names FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON tournament_available_names FOR DELETE TO public USING (true);

-- Markets policies
CREATE POLICY "Enable read access for all users" ON markets FOR SELECT TO public USING (true);
CREATE POLICY "Enable write access for all users" ON markets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON markets FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON markets FOR DELETE TO public USING (true);

-- Drop existing views
DROP VIEW IF EXISTS tech_performance_stats;

-- Drop existing tables (in correct order due to dependencies)
DROP TABLE IF EXISTS game_statistics;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS category_tech_types;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS tech_types;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create game session scores trigger function
CREATE OR REPLACE FUNCTION update_game_session_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Update scores in game_sessions
    WITH player_scores AS (
        SELECT 
            game_session_id,
            SUM(CASE WHEN correct AND current_player = 1 THEN question_value ELSE 0 END) as p1_score,
            SUM(CASE WHEN correct AND current_player = 2 THEN question_value ELSE 0 END) as p2_score
        FROM game_statistics
        WHERE game_session_id = NEW.game_session_id
        GROUP BY game_session_id
    )
    UPDATE game_sessions
    SET 
        player1_score = player_scores.p1_score,
        player2_score = player_scores.p2_score,
        winner = CASE 
            WHEN player_scores.p1_score > player_scores.p2_score THEN 1
            WHEN player_scores.p2_score > player_scores.p1_score THEN 2
            ELSE NULL
        END
    FROM player_scores
    WHERE game_sessions.id = player_scores.game_session_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create tech_types table
CREATE TABLE tech_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tech_types_name_check CHECK (name = ANY (ARRAY['Install'::TEXT, 'Service'::TEXT]))
);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create game_sessions table
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tech_type_id INTEGER REFERENCES tech_types(id),
    player1_name TEXT NOT NULL,
    player2_name TEXT NOT NULL,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    winner INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT game_sessions_winner_check CHECK (winner = ANY (ARRAY[1, 2]))
);

-- Create questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice',
    correct_answers JSONB DEFAULT '[]'::JSONB,
    options JSONB NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_question_type CHECK (question_type = ANY (ARRAY['multiple_choice', 'check_all', 'true_false'])),
    CONSTRAINT valid_correct_answers CHECK (jsonb_typeof(correct_answers) = 'array'),
    CONSTRAINT options_is_array CHECK (jsonb_typeof(options) = 'array'),
    CONSTRAINT questions_points_check CHECK (points = ANY (ARRAY[200, 400, 600, 800, 1000]))
);

-- Create category_tech_types table
CREATE TABLE category_tech_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    tech_type_id INTEGER REFERENCES tech_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT category_tech_types_category_id_tech_type_id_key UNIQUE (category_id, tech_type_id)
);

-- Create game_statistics table
CREATE TABLE game_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    tech_type_id INTEGER REFERENCES tech_types(id),
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    player1_name TEXT NOT NULL,
    player2_name TEXT NOT NULL,
    current_player INTEGER NOT NULL,
    correct BOOLEAN NOT NULL,
    question_category TEXT,
    question_value INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT game_statistics_current_player_check CHECK (current_player = ANY (ARRAY[1, 2]))
);

-- Create indexes
CREATE INDEX idx_category_tech_types_category ON category_tech_types(category_id);
CREATE INDEX idx_category_tech_types_tech_type ON category_tech_types(tech_type_id);
CREATE INDEX idx_game_sessions_tech_type ON game_sessions(tech_type_id);
CREATE INDEX idx_game_sessions_winner ON game_sessions(winner);
CREATE INDEX idx_game_stats_session ON game_statistics(game_session_id);
CREATE INDEX idx_game_stats_question ON game_statistics(question_id);
CREATE INDEX idx_game_stats_tech_type ON game_statistics(tech_type_id);
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_points ON questions(points);

-- Create triggers
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_session_scores_trigger
    AFTER INSERT OR UPDATE ON game_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_game_session_scores();

-- Create views
CREATE VIEW tech_performance_stats AS
SELECT 
    tt.name as tech_type,
    COUNT(DISTINCT gs.id) as total_games,
    COUNT(DISTINCT gs.player1_name) + COUNT(DISTINCT gs.player2_name) as unique_players,
    AVG(GREATEST(gs.player1_score, gs.player2_score)) as best_score,
    AVG(LEAST(gs.player1_score, gs.player2_score)) as lowest_score,
    (
        SELECT COUNT(*) FILTER (WHERE gst.correct = true)::DOUBLE PRECISION / 
               NULLIF(COUNT(*), 0)::DOUBLE PRECISION
        FROM game_statistics gst
        JOIN game_sessions gs2 ON gs2.id = gst.game_session_id
        WHERE gs2.tech_type_id = tt.id
    ) as correct_answer_rate
FROM tech_types tt
LEFT JOIN game_sessions gs ON gs.tech_type_id = tt.id
GROUP BY tt.id, tt.name;

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_tech_types ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON questions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON questions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON game_statistics FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON game_statistics FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON game_sessions FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON category_tech_types FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON category_tech_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON category_tech_types FOR DELETE USING (auth.role() = 'authenticated');

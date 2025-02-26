-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON categories;

DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON questions;

DROP POLICY IF EXISTS "Enable read access for all users" ON game_statistics;
DROP POLICY IF EXISTS "Enable insert for all users" ON game_statistics;

-- Create new open policies
CREATE POLICY "Enable all access for categories"
ON categories FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for questions"
ON questions FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for game_statistics"
ON game_statistics FOR ALL
USING (true)
WITH CHECK (true);

-- Verify RLS is still enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;

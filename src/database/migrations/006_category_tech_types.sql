-- Create new join table for categories and tech types
CREATE TABLE IF NOT EXISTS category_tech_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  tech_type_id INTEGER REFERENCES tech_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, tech_type_id)
);

-- Copy existing tech type assignments to the new join table
INSERT INTO category_tech_types (category_id, tech_type_id)
SELECT id, tech_type_id
FROM categories
WHERE tech_type_id IS NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_category_tech_types_category ON category_tech_types(category_id);
CREATE INDEX IF NOT EXISTS idx_category_tech_types_tech_type ON category_tech_types(tech_type_id);

-- Drop the old tech_type_id column
ALTER TABLE categories DROP COLUMN IF EXISTS tech_type_id;

-- Update RLS policies
ALTER TABLE category_tech_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON category_tech_types
  FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users" ON category_tech_types
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON category_tech_types
  FOR DELETE USING (auth.role() = 'authenticated');

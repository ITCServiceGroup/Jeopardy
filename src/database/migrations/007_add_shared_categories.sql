-- Add categories that belong to both tech types
WITH shared_categories AS (
  INSERT INTO categories (name) VALUES
    ('Safety and Compliance'),
    ('Testing and Troubleshooting'),
    ('Equipment Documentation'),
    ('Customer Communication')
  RETURNING id, name
)
INSERT INTO category_tech_types (category_id, tech_type_id)
SELECT 
  c.id,
  t.id
FROM shared_categories c
CROSS JOIN tech_types t;

-- Add some test questions for shared categories
WITH safety_category AS (
  SELECT id FROM categories WHERE name = 'Safety and Compliance' LIMIT 1
)
INSERT INTO questions (category_id, question, answer, options, points)
SELECT 
  id,
  'What is the first step when approaching any equipment service or installation?',
  'Check for safety hazards',
  ARRAY['Start working immediately', 'Call supervisor', 'Check for safety hazards', 'Review documentation'],
  400
FROM safety_category;

WITH docs_category AS (
  SELECT id FROM categories WHERE name = 'Equipment Documentation' LIMIT 1
)
INSERT INTO questions (category_id, question, answer, options, points)
SELECT 
  id,
  'Which document should be reviewed first when troubleshooting equipment?',
  'Equipment manual',
  ARRAY['Service history', 'Equipment manual', 'Installation guide', 'Warranty card'],
  600
FROM docs_category;

-- Add shared categories
INSERT INTO categories (name) VALUES
  ('Safety and Compliance'),
  ('Testing and Troubleshooting'),
  ('Equipment Documentation'),
  ('Customer Communication'),
  ('Installation Procedures'),
  ('Service Protocols'),
  ('Network Configuration'),
  ('Quality Assurance')
ON CONFLICT (name) DO NOTHING;

-- Link categories to tech types
WITH install_categories AS (
  SELECT id FROM categories WHERE name IN (
    'Installation Procedures',
    'Network Configuration',
    'Safety and Compliance',
    'Equipment Documentation',
    'Customer Communication'
  )
),
service_categories AS (
  SELECT id FROM categories WHERE name IN (
    'Service Protocols',
    'Testing and Troubleshooting',
    'Safety and Compliance',
    'Equipment Documentation',
    'Customer Communication',
    'Quality Assurance'
  )
)
INSERT INTO category_tech_types (category_id, tech_type_id)
SELECT id, 1 FROM install_categories
UNION
SELECT id, 2 FROM service_categories;

-- Add sample questions
INSERT INTO questions (category_id, question, answer, options, points) 
VALUES
  -- Safety and Compliance
  (
    (SELECT id FROM categories WHERE name = 'Safety and Compliance'),
    'What is the first step before starting any installation?',
    'Check for safety hazards',
    '[
      "Start unpacking equipment",
      "Call the customer",
      "Check for safety hazards",
      "Review documentation"
    ]'::jsonb,
    100
  ),
  (
    (SELECT id FROM categories WHERE name = 'Safety and Compliance'),
    'When is Personal Protective Equipment (PPE) required?',
    'Any time hazards are present',
    '[
      "Only when working with electricity",
      "Any time hazards are present",
      "Only when supervisor requires it",
      "During winter months"
    ]'::jsonb,
    200
  ),
  (
    (SELECT id FROM categories WHERE name = 'Safety and Compliance'),
    'What should you do if you encounter an unsafe working condition?',
    'Stop work immediately and report it',
    '[
      "Continue working carefully",
      "Stop work immediately and report it",
      "Ignore it if deadline is tight",
      "Fix it yourself"
    ]'::jsonb,
    300
  ),

  -- Installation Procedures
  (
    (SELECT id FROM categories WHERE name = 'Installation Procedures'),
    'What should be verified before mounting equipment?',
    'Wall load capacity',
    '[
      "Wall color",
      "Room temperature",
      "Wall load capacity",
      "Customer preference"
    ]'::jsonb,
    300
  ),
  (
    (SELECT id FROM categories WHERE name = 'Installation Procedures'),
    'In what order should cable management be performed?',
    'Plan, Label, Route, Secure',
    '[
      "Route, Secure, Plan, Label",
      "Label, Route, Plan, Secure",
      "Plan, Label, Route, Secure",
      "Secure, Route, Label, Plan"
    ]'::jsonb,
    400
  ),

  -- Testing and Troubleshooting
  (
    (SELECT id FROM categories WHERE name = 'Testing and Troubleshooting'),
    'Which tool is used to test network connectivity?',
    'Network cable tester',
    '[
      "Screwdriver",
      "Network cable tester",
      "Hammer",
      "Tape measure"
    ]'::jsonb,
    400
  ),
  (
    (SELECT id FROM categories WHERE name = 'Testing and Troubleshooting'),
    'What is the first step in troubleshooting?',
    'Identify and document the problem',
    '[
      "Replace components",
      "Call support",
      "Identify and document the problem",
      "Restart the system"
    ]'::jsonb,
    200
  ),

  -- Customer Communication
  (
    (SELECT id FROM categories WHERE name = 'Customer Communication'),
    'How should you address customer concerns?',
    'Listen actively and acknowledge',
    '[
      "Dismiss if unreasonable",
      "Listen actively and acknowledge",
      "Refer to manager immediately",
      "Offer discount"
    ]'::jsonb,
    100
  ),
  (
    (SELECT id FROM categories WHERE name = 'Customer Communication'),
    'When should installation progress be communicated?',
    'At regular intervals and milestones',
    '[
      "Only when complete",
      "When problems occur",
      "At regular intervals and milestones",
      "If customer asks"
    ]'::jsonb,
    200
  ),

  -- Network Configuration
  (
    (SELECT id FROM categories WHERE name = 'Network Configuration'),
    'What information is needed before network setup?',
    'IP addressing scheme',
    '[
      "Router color",
      "IP addressing scheme",
      "Office hours",
      "Building age"
    ]'::jsonb,
    300
  ),
  (
    (SELECT id FROM categories WHERE name = 'Network Configuration'),
    'Which security feature should be enabled first?',
    'Firewall',
    '[
      "Guest network",
      "Firewall",
      "Remote access",
      "WiFi password"
    ]'::jsonb,
    400
  );

-- Add sample game sessions
INSERT INTO game_sessions 
  (tech_type_id, player1_name, player2_name, start_time, end_time, player1_score, player2_score, winner)
VALUES
  (1, 'John', 'Alice', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 800, 600, 1),
  (2, 'Bob', 'Carol', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', 500, 700, 2),
  (1, 'Dave', 'Eve', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 900, 850, 1);

-- Add sample game statistics
WITH game_plays AS (
  SELECT 
    gs.id as game_session_id,
    gs.tech_type_id,
    gs.player1_name,
    gs.player2_name,
    q.id as question_id,
    CASE ROW_NUMBER() OVER (PARTITION BY gs.id ORDER BY q.id) % 2 
      WHEN 0 THEN 1 
      ELSE 2 
    END as current_player,
    CASE WHEN RANDOM() > 0.3 THEN true ELSE false END as correct
  FROM game_sessions gs
  CROSS JOIN LATERAL (
    SELECT id 
    FROM questions 
    ORDER BY RANDOM() 
    LIMIT 5
  ) q
)
INSERT INTO game_statistics 
  (game_session_id, tech_type_id, question_id, player1_name, player2_name, current_player, correct)
SELECT 
  game_session_id,
  tech_type_id,
  question_id,
  player1_name,
  player2_name,
  current_player,
  correct
FROM game_plays;

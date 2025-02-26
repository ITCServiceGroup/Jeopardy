-- Insert initial Install Tech categories with category_tech_types assignments
WITH inserted_categories AS (
  INSERT INTO categories (name) VALUES
    ('Installation Basics'),
    ('Equipment Setup'),
    ('Safety Procedures'),
    ('Tools and Equipment'),
    ('Installation Standards'),
    ('Troubleshooting'),
    ('Maintenance'),
    ('Diagnostics'),
    ('Repair Techniques'),
    ('Service Standards')
  RETURNING id, name
)
INSERT INTO category_tech_types (category_id, tech_type_id)
SELECT 
  c.id,
  t.id
FROM inserted_categories c
CROSS JOIN tech_types t
WHERE 
  (c.name IN ('Installation Basics', 'Equipment Setup', 'Safety Procedures', 'Tools and Equipment', 'Installation Standards') 
   AND t.name = 'Install')
  OR 
  (c.name IN ('Troubleshooting', 'Maintenance', 'Diagnostics', 'Repair Techniques', 'Service Standards') 
   AND t.name = 'Service');

-- Insert Install Tech questions
INSERT INTO questions (category_id, question, answer, options, points) VALUES
  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Installation Basics' AND t.name = 'Install'), 
   'What is the minimum clearance required around an outdoor unit?',
   '24 inches',
   ARRAY['12 inches', '18 inches', '24 inches', '36 inches'],
   200),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Equipment Setup' AND t.name = 'Install'),
   'What is the recommended height for mounting a thermostat?',
   '5 feet',
   ARRAY['4 feet', '5 feet', '6 feet', '7 feet'],
   400),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Safety Procedures' AND t.name = 'Install'),
   'Which safety equipment is required for refrigerant handling?',
   'Safety goggles and gloves',
   ARRAY['Hard hat only', 'Safety goggles and gloves', 'Steel-toed boots only', 'High-visibility vest'],
   600);

-- Insert Service Tech questions
INSERT INTO questions (category_id, question, answer, options, points) VALUES
  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Troubleshooting' AND t.name = 'Service'),
   'What is the first step in diagnosing a non-functioning AC unit?',
   'Check power supply',
   ARRAY['Replace filter', 'Check refrigerant', 'Check power supply', 'Clean coils'],
   200),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Maintenance' AND t.name = 'Service'),
   'How often should air filters be checked in a residential system?',
   'Monthly',
   ARRAY['Weekly', 'Monthly', 'Quarterly', 'Annually'],
   400),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Diagnostics' AND t.name = 'Service'),
   'What tool is used to measure refrigerant pressure?',
   'Manifold gauge set',
   ARRAY['Multimeter', 'Thermometer', 'Manifold gauge set', 'Pressure washer'],
   600);

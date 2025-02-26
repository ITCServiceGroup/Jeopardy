-- Additional Install Tech Questions
INSERT INTO questions (category_id, question, answer, options, points) VALUES
  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Installation Basics' AND t.name = 'Install'),
   'What is the minimum slope required for condensate drain lines?',
   '1/4 inch per foot',
   ARRAY['1/8 inch per foot', '1/4 inch per foot', '1/2 inch per foot', '1 inch per foot'],
   800),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Installation Basics' AND t.name = 'Install'),
   'What is the maximum distance between duct supports?',
   '4 feet',
   ARRAY['3 feet', '4 feet', '5 feet', '6 feet'],
   1000),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Equipment Setup' AND t.name = 'Install'),
   'What is the minimum distance required between indoor and outdoor disconnect boxes?',
   'Within sight and 50 feet',
   ARRAY['10 feet', '25 feet', 'Within sight and 50 feet', '100 feet'],
   800),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Tools and Equipment' AND t.name = 'Install'),
   'Which tool is used to ensure proper refrigerant line brazing?',
   'Nitrogen pressure regulator',
   ARRAY['Pressure gauge', 'Nitrogen pressure regulator', 'Flow meter', 'Temperature probe'],
   600),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Installation Standards' AND t.name = 'Install'),
   'What is the minimum R-value required for attic ductwork insulation?',
   'R-8',
   ARRAY['R-4', 'R-6', 'R-8', 'R-10'],
   400);

-- Additional Service Tech Questions
INSERT INTO questions (category_id, question, answer, options, points) VALUES
  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Troubleshooting' AND t.name = 'Service'),
   'What could cause a condenser unit to short cycle?',
   'Low refrigerant charge',
   ARRAY['Dirty filter', 'Low refrigerant charge', 'Loose wiring', 'High humidity'],
   800),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Troubleshooting' AND t.name = 'Service'),
   'What is the most common cause of frozen evaporator coils?',
   'Restricted airflow',
   ARRAY['Low refrigerant', 'Restricted airflow', 'Dirty condenser', 'Faulty thermostat'],
   1000),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Maintenance' AND t.name = 'Service'),
   'How often should condenser coils be cleaned?',
   'Annually',
   ARRAY['Monthly', 'Quarterly', 'Semi-annually', 'Annually'],
   400),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Repair Techniques' AND t.name = 'Service'),
   'What is the proper method for recovering refrigerant?',
   'Use EPA-approved recovery machine',
   ARRAY['Vent to atmosphere', 'Use EPA-approved recovery machine', 'Transfer to another unit', 'Pump down system'],
   600),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Service Standards' AND t.name = 'Service'),
   'What is the maximum allowable superheat deviation?',
   '±2°F',
   ARRAY['±1°F', '±2°F', '±5°F', '±10°F'],
   800);

-- High-value Install Tech Questions
INSERT INTO questions (category_id, question, answer, options, points) VALUES
  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Safety Procedures' AND t.name = 'Install'),
   'What is the OSHA requirement for fall protection in residential installations?',
   '6 feet or higher',
   ARRAY['4 feet or higher', '6 feet or higher', '8 feet or higher', '10 feet or higher'],
   1000),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Tools and Equipment' AND t.name = 'Install'),
   'Which refrigerant leak detection method is most accurate?',
   'Electronic leak detector',
   ARRAY['Soap bubbles', 'UV dye', 'Electronic leak detector', 'Pressure test'],
   800);

-- High-value Service Tech Questions
INSERT INTO questions (category_id, question, answer, options, points) VALUES
  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Diagnostics' AND t.name = 'Service'),
   'What is the proper method for testing a dual capacitor?',
   'Microfarad test with power off',
   ARRAY['Voltage test', 'Microfarad test with power off', 'Resistance test', 'Amperage test'],
   1000),

  ((SELECT c.id FROM categories c 
    INNER JOIN category_tech_types ctt ON c.id = ctt.category_id 
    INNER JOIN tech_types t ON t.id = ctt.tech_type_id 
    WHERE c.name = 'Repair Techniques' AND t.name = 'Service'),
   'What is the correct procedure for replacing a TXV?',
   'Remove power, recover refrigerant, replace valve, pressure test, evacuate, recharge',
   ARRAY[
     'Remove power, replace valve, recharge system',
     'Recover refrigerant, replace valve, recharge',
     'Remove power, recover refrigerant, replace valve, pressure test, evacuate, recharge',
     'Replace valve while system is running'
   ],
   800);

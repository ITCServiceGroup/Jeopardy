DO $$ 
DECLARE 
    networking_id UUID;
    fiber_id UUID;
    wifi_id UUID;
    troubleshooting_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';
    SELECT id INTO fiber_id FROM categories WHERE name = 'Fiber Optics';
    SELECT id INTO wifi_id FROM categories WHERE name = 'WiFi';
    SELECT id INTO troubleshooting_id FROM categories WHERE name = 'Troubleshooting';

    -- Missing Networking questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'How do you run a traceroute on Chrome OS?',
    'multiple_choice',
    '["Open the terminal and type \"tracepath [destination]\"", "Use the Chrome browser''s developer tools", "Install a third-party trace route extension", "Use the Settings menu to perform a traceroute"]'::jsonb,
    '["Open the terminal and type \"tracepath [destination]\""]'::jsonb,
    200);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'How do you check for packet loss on Mac?',
    'multiple_choice',
    '["Use Terminal to run \"ping [IP Address] -c [number of tests]\" and review the summary", "Use the Activity Monitor to observe network traffic", "Open Safari and use a packet loss testing website", "Use the Network Utility app and select Packet Loss"]'::jsonb,
    '["Use Terminal to run \"ping [IP Address] -c [number of tests]\" and review the summary"]'::jsonb,
    400);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'How do you check for packet loss on Chrome OS?',
    'multiple_choice',
    '["Install a network monitoring app from the Chrome Web Store", "Use the Chrome browser''s network diagnostics tool", "Open a web browser and visit an IP lookup website", "Open the Terminal (Crosh shell) and run \"ping [IP Address] -c [number of tests]\""]'::jsonb,
    '["Open the Terminal (Crosh shell) and run \"ping [IP Address] -c [number of tests]\""]'::jsonb,
    400);

    -- Missing Fiber questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'Fiber optic cables are more resistant to environmental factors like moisture and temperature changes compared to copper cables.',
    'true_false',
    '["True", "False"]'::jsonb,
    '["True"]'::jsonb,
    200);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'Which of the following are common causes of fiber optic connector contamination?',
    'check_all',
    '["Fingerprints and oils from handling", "Dust and airborne particles", "Excessive bending of the cable", "Improper cleaning techniques"]'::jsonb,
    '["Fingerprints and oils from handling", "Dust and airborne particles", "Improper cleaning techniques"]'::jsonb,
    400);

    -- Missing WiFi questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (wifi_id,
    'What are WiFi channels?',
    'multiple_choice',
    '["Specific frequency ranges within the WiFi spectrum used to transmit data between devices", "Physical pathways that WiFi signals follow to reach their destinations", "Security protocols used to encrypt WiFi communications", "Hardware components in a WiFi router that manage signal distribution"]'::jsonb,
    '["Specific frequency ranges within the WiFi spectrum used to transmit data between devices"]'::jsonb,
    200);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (wifi_id,
    'Which of the following can cause WiFi interference?',
    'check_all',
    '["Microwave ovens operating nearby", "Cordless phones using 2.4 GHz frequency", "LED light bulbs", "Neighboring WiFi networks on the same channel"]'::jsonb,
    '["Microwave ovens operating nearby", "Cordless phones using 2.4 GHz frequency", "Neighboring WiFi networks on the same channel"]'::jsonb,
    400);

    -- Missing Troubleshooting questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (troubleshooting_id,
    'A customer''s laptop won''t connect to WiFi, but other devices in the house are working fine. What steps should you take?',
    'check_all',
    '["Check if the laptop is in Airplane Mode", "Restart the router and ONT", "Forget and reconnect to the WiFi network on the laptop", "Update the WiFi driver on the laptop"]'::jsonb,
    '["Check if the laptop is in Airplane Mode", "Forget and reconnect to the WiFi network on the laptop", "Update the WiFi driver on the laptop"]'::jsonb,
    400);

END $$;

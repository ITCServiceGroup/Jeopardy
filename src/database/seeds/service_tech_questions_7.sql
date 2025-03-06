DO $$ 
DECLARE 
    networking_id UUID;
    fiber_id UUID;
    infrastructure_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';
    SELECT id INTO fiber_id FROM categories WHERE name = 'Fiber Optics';
    SELECT id INTO infrastructure_id FROM categories WHERE name = 'Infrastructure';

    -- Remaining Networking questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'How do you find the External (Public) IP on Windows?',
    'check_all',
    '["Open Command Prompt and run \"nslookup myip.opendns.com resolver1.opendns.com\"", "Open Command Prompt and run \"ipconfig\"", "Select Start > Settings > Network & internet > Wi-Fi, then select the Wi-Fi network you''re connected to and look for your IP address listed next to IPv4 address", "Open a web browser and visit an IP lookup website"]'::jsonb,
    '["Open Command Prompt and run \"nslookup myip.opendns.com resolver1.opendns.com\"", "Open a web browser and visit an IP lookup website"]'::jsonb,
    400);

    -- More Fiber questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'Which of the following are common causes of fiber optic cable signal degradation?',
    'check_all',
    '["Excessive bending or kinking of the cable", "Using high-quality connectors", "Splicing cables improperly", "Exposure to extreme seasonal temperatures"]'::jsonb,
    '["Excessive bending or kinking of the cable", "Splicing cables improperly"]'::jsonb,
    400);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'An Ethernet cable has four pairs of copper wires. Which pair(s) can be used to deliver Power over Ethernet (PoE)?',
    'check_all',
    '["The blue pair (pins 4 and 5) and the brown pair (pins 7 and 8)", "The orange pair (pins 1 and 2) and the green pair (pins 3 and 6)", "All four pairs can be used in certain PoE standards", "It depends on the PoE standard being used"]'::jsonb,
    '["The blue pair (pins 4 and 5) and the brown pair (pins 7 and 8)", "All four pairs can be used in certain PoE standards", "It depends on the PoE standard being used"]'::jsonb,
    1000);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'What is packet loss and what does it indicate?',
    'multiple_choice',
    '["Packet loss is the increase in packet size to enhance data transmission speed", "Packet loss is the deliberate dropping of packets by firewalls to prevent unauthorized access", "Packet loss refers to the delay in packet delivery due to high network traffic", "Packet loss occurs when data packets fail to reach their destination, indicating potential network issues such as congestion, hardware failures, or poor signal quality"]'::jsonb,
    '["Packet loss occurs when data packets fail to reach their destination, indicating potential network issues such as congestion, hardware failures, or poor signal quality"]'::jsonb,
    600);

END $$;

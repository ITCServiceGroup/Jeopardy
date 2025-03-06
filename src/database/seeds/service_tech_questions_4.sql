DO $$ 
DECLARE 
    networking_id UUID;
    fiber_id UUID;
    tools_id UUID;
    wifi_id UUID;
    documentation_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';
    SELECT id INTO fiber_id FROM categories WHERE name = 'Fiber Optics';
    SELECT id INTO tools_id FROM categories WHERE name = 'Tools';
    SELECT id INTO wifi_id FROM categories WHERE name = 'WiFi';
    SELECT id INTO documentation_id FROM categories WHERE name = 'Documentation';

    -- Documentation questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (documentation_id,
    'When documenting network issues, which information is essential to include?',
    'check_all',
    '["Specific error messages or symptoms observed", "Time and duration of the issue", "List of affected devices or services", "Customer''s internet browsing history"]'::jsonb,
    '["Specific error messages or symptoms observed", "Time and duration of the issue", "List of affected devices or services"]'::jsonb,
    400);

    -- More WiFi questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (wifi_id,
    'What factors affect WiFi signal strength?',
    'check_all',
    '["Distance from the router", "Physical obstacles like walls and furniture", "Router''s firmware version", "Number of devices connected"]'::jsonb,
    '["Distance from the router", "Physical obstacles like walls and furniture", "Number of devices connected"]'::jsonb,
    400);

    -- Additional Fiber questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'Which of the following are types of fiber optic cables?',
    'check_all',
    '["Single-mode fiber", "Multi-mode fiber", "Twisted pair fiber", "Plastic optical fiber"]'::jsonb,
    '["Single-mode fiber", "Multi-mode fiber", "Plastic optical fiber"]'::jsonb,
    400);

    -- Additional Networking questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'How do you find the Internal (Private) IP on Windows?',
    'check_all',
    '["Open Command Prompt and run \"nslookup myip.opendns.com resolver1.opendns.com\"", "Open Command Prompt and run \"ipconfig\"", "Select Start > Settings > Network & internet > Wi-Fi, then select the Wi-Fi network you''re connected to and look for your IP address listed next to IPv4 address", "Open a web browser and visit an IP lookup website"]'::jsonb,
    '["Open Command Prompt and run \"ipconfig\"", "Select Start > Settings > Network & internet > Wi-Fi, then select the Wi-Fi network you''re connected to and look for your IP address listed next to IPv4 address"]'::jsonb,
    200);

    -- Tools questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (tools_id,
    'How do you open the Terminal on Mac?',
    'check_all',
    '["Open Finder, navigate to Applications > Utilities, and double-click Terminal", "Press Command + Space to open Spotlight, type \"Terminal,\" and press Enter", "Open Safari and navigate to a Terminal website", "Use Launchpad, search for Terminal, and click the icon"]'::jsonb,
    '["Open Finder, navigate to Applications > Utilities, and double-click Terminal", "Press Command + Space to open Spotlight, type \"Terminal,\" and press Enter", "Use Launchpad, search for Terminal, and click the icon"]'::jsonb,
    200);

    -- More advanced WiFi questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (wifi_id,
    'Which settings should be checked when configuring a router for optimal performance?',
    'check_all',
    '["WiFi channel selection to minimize interference", "Band steering configuration for dual-band routers", "Router physical placement in the home", "Quality of Service (QoS) settings"]'::jsonb,
    '["WiFi channel selection to minimize interference", "Band steering configuration for dual-band routers", "Quality of Service (QoS) settings"]'::jsonb,
    800);

END $$;

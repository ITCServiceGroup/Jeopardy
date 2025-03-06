DO $$ 
DECLARE 
    networking_id UUID;
    wifi_id UUID;
    fiber_id UUID;
    tools_id UUID;
    troubleshooting_id UUID;
    infrastructure_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';
    SELECT id INTO wifi_id FROM categories WHERE name = 'WiFi';
    SELECT id INTO fiber_id FROM categories WHERE name = 'Fiber Optics';
    SELECT id INTO tools_id FROM categories WHERE name = 'Tools';
    SELECT id INTO troubleshooting_id FROM categories WHERE name = 'Troubleshooting';
    SELECT id INTO infrastructure_id FROM categories WHERE name = 'Infrastructure';

    -- Networking questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'What is the difference between an Internal (Private) and an External (Public) IP address?',
    'multiple_choice',
    '["An Internal (Private) IP address can be accessed from outside the local network, whereas an External (Public) IP address is only accessible within the local network", "An Internal (Private) IP address is used within a local network and is not routable on the internet, while an External (Public) IP address is assigned by an ISP and is used to identify devices on the internet", "Internal (Private) IP addresses are always static, while External (Public) IP addresses are always dynamic", "There is no difference; Internal and External IP addresses are interchangeable terms"]'::jsonb,
    '["An Internal (Private) IP address is used within a local network and is not routable on the internet, while an External (Public) IP address is assigned by an ISP and is used to identify devices on the internet"]'::jsonb,
    400);

    -- More WiFi questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (wifi_id,
    'A customer''s smart home devices (e.g., lights, plugs) disconnect when the microwave runs. What is the most likely cause?',
    'multiple_choice',
    '["The ONT''s optical power is too low", "The smart devices use 2.4 GHz WiFi", "The microwave is blocking the fiber signal", "The router''s firmware is outdated"]'::jsonb,
    '["The smart devices use 2.4 GHz WiFi"]'::jsonb,
    200);

    -- More Fiber questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'Single-mode fiber optic cables are optimized for long-distance, high-bandwidth communication.',
    'true_false',
    '["True", "False"]'::jsonb,
    '["True"]'::jsonb,
    200);

    -- Tools questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (tools_id,
    'How do you open the Terminal on a Chromebook?',
    'check_all',
    '["Press Ctrl + Alt + T to open the Crosh shell", "Open the Settings menu, navigate to Advanced > Developers, and launch the Linux Terminal", "Use the Chrome browser and go to chrome://terminal", "Click the Launcher, search for \"Terminal,\" and open the app"]'::jsonb,
    '["Press Ctrl + Alt + T to open the Crosh shell", "Open the Settings menu, navigate to Advanced > Developers, and launch the Linux Terminal", "Click the Launcher, search for \"Terminal,\" and open the app"]'::jsonb,
    200);

    -- More Troubleshooting questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (troubleshooting_id,
    'A customer complains about slow internet speeds despite having a strong signal. What troubleshooting steps should you take?',
    'check_all',
    '["Run a speed test over Ethernet to rule out WiFi issues", "Check for devices consuming excessive bandwidth on the network", "Replace the ONT with a higher-speed variant", "Ensure the router''s firmware is up to date"]'::jsonb,
    '["Run a speed test over Ethernet to rule out WiFi issues", "Check for devices consuming excessive bandwidth on the network", "Ensure the router''s firmware is up to date"]'::jsonb,
    600);

    -- Infrastructure questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (infrastructure_id,
    'What is the purpose of network redundancy in fiber optic networks?',
    'check_all',
    '["To provide backup paths in case of fiber breaks or equipment failures", "To enable load balancing across multiple paths", "To increase the maximum speed of data transmission", "To ensure service continuity during maintenance"]'::jsonb,
    '["To provide backup paths in case of fiber breaks or equipment failures", "To enable load balancing across multiple paths", "To ensure service continuity during maintenance"]'::jsonb,
    1000);
END $$;

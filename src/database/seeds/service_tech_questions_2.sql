DO $$ 
DECLARE 
    networking_id UUID;
    fiber_id UUID;
    tools_id UUID;
    wifi_id UUID;
    troubleshooting_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';
    SELECT id INTO fiber_id FROM categories WHERE name = 'Fiber Optics';
    SELECT id INTO tools_id FROM categories WHERE name = 'Tools';
    SELECT id INTO wifi_id FROM categories WHERE name = 'WiFi';
    SELECT id INTO troubleshooting_id FROM categories WHERE name = 'Troubleshooting';

    -- Networking questions continued
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'How do you run a traceroute on Windows?',
    'multiple_choice',
    '["Open Command Prompt and type \"tracert [destination]\"", "Open PowerShell and type \"trace-route [destination]\"", "Open the Run window and type \"tracert [destination]\"", "Use the Network and Sharing Center to perform a traceroute"]'::jsonb,
    '["Open Command Prompt and type \"tracert [destination]\""]'::jsonb,
    200);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'How do you check for packet loss on Windows?',
    'multiple_choice',
    '["Use Command Prompt to run \"ping -n [number of tests] [IP address]\" and analyze the loss statistics", "Open Device Manager and check network adapters", "Use the Control Panel''s Network and Sharing Center", "Open PowerShell and run Get-PacketLoss"]'::jsonb,
    '["Use Command Prompt to run \"ping -n [number of tests] [IP address]\" and analyze the loss statistics"]'::jsonb,
    400);

    -- Fiber Optics questions continued
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'How does fiber transmit voice, data, and video?',
    'multiple_choice',
    '["By converting the signals into electrical pulses that travel through copper conductors", "By converting the signals into light pulses that travel through optical fibers", "By modulating radio frequency waves that are sent along the fiber", "By converting the signals into analog signals that are amplified and transmitted"]'::jsonb,
    '["By converting the signals into light pulses that travel through optical fibers"]'::jsonb,
    400);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'Which of the following are benefits of using fiber optic cables over traditional copper cables?',
    'check_all',
    '["Higher bandwidth capacity", "Immunity to electromagnetic interference", "Lower installation costs", "Longer transmission distances without signal loss"]'::jsonb,
    '["Higher bandwidth capacity", "Immunity to electromagnetic interference", "Longer transmission distances without signal loss"]'::jsonb,
    400);

    -- Troubleshooting questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (troubleshooting_id,
    'Which steps should you take if the ONT''s optical light is off or the alarm light is red?',
    'check_all',
    '["Check for tight bends/kinks in the fiber line", "Verify the fiber connector is fully seated in the ONT", "Reboot the customer''s WiFi router", "Inspect the fiber connector for dirt or damage"]'::jsonb,
    '["Check for tight bends/kinks in the fiber line", "Verify the fiber connector is fully seated in the ONT", "Inspect the fiber connector for dirt or damage"]'::jsonb,
    400);

    -- WiFi questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (wifi_id,
    'Which of the following are benefits of Mesh WiFi systems compared to 3rd-party extenders?',
    'check_all',
    '["Dedicated backhaul for communication between extenders", "Reduced bandwidth due to signal rebroadcasting", "Centralized management via a mobile app", "Consistent performance with adaptive routing"]'::jsonb,
    '["Dedicated backhaul for communication between extenders", "Centralized management via a mobile app", "Consistent performance with adaptive routing"]'::jsonb,
    400);

END $$;

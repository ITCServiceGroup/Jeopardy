DO $$ 
DECLARE 
    networking_id UUID;
    fiber_id UUID;
    tools_id UUID;
    wifi_id UUID;
    security_id UUID;
    troubleshooting_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';
    SELECT id INTO fiber_id FROM categories WHERE name = 'Fiber Optics';
    SELECT id INTO tools_id FROM categories WHERE name = 'Tools';
    SELECT id INTO wifi_id FROM categories WHERE name = 'WiFi';
    SELECT id INTO security_id FROM categories WHERE name = 'Security';
    SELECT id INTO troubleshooting_id FROM categories WHERE name = 'Troubleshooting';

    -- Additional Fiber questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'Fiber optic cables are immune to electromagnetic interference.',
    'true_false',
    '["True", "False"]'::jsonb,
    '["True"]'::jsonb,
    200);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'Fiber optic cables are more flexible and easier to install than copper cables.',
    'true_false',
    '["True", "False"]'::jsonb,
    '["False"]'::jsonb,
    200);

    -- Additional Security questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (security_id,
    'Which of the following are common network security threats?',
    'check_all',
    '["Distributed Denial of Service (DDoS) attacks", "Man-in-the-middle attacks", "Router firmware updates", "Malware and virus infections"]'::jsonb,
    '["Distributed Denial of Service (DDoS) attacks", "Man-in-the-middle attacks", "Malware and virus infections"]'::jsonb,
    1000);

    -- Additional Troubleshooting questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (troubleshooting_id,
    'A customer reports that some websites won''t load on their laptop, but others work fine. What could be the issue?',
    'multiple_choice',
    '["DNS server issues causing resolution problems", "Incorrect date and time settings on the laptop", "Fiber attenuation due to a damaged cable", "Browser cache or cookies causing conflicts"]'::jsonb,
    '["DNS server issues causing resolution problems"]'::jsonb,
    200);

    -- Additional Tools questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (tools_id,
    'How do you open the Command Prompt on Windows?',
    'check_all',
    '["Press Windows + R to open the Run dialog, type \"cmd,\" and press Enter", "Click Start, type \"Command Prompt\" in the search bar, and select it", "Open File Explorer, navigate to C:\\Windows\\System32, and double-click cmd.exe", "Use the Task Manager to launch Command Prompt"]'::jsonb,
    '["Press Windows + R to open the Run dialog, type \"cmd,\" and press Enter", "Click Start, type \"Command Prompt\" in the search bar, and select it", "Open File Explorer, navigate to C:\\Windows\\System32, and double-click cmd.exe"]'::jsonb,
    200);

    -- Update the load file to include this new file
END $$;

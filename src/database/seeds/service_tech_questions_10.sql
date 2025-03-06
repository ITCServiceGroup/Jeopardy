DO $$ 
DECLARE 
    networking_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';

    -- Missing Questions
    -- 1. Question 7
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'What is a MAC address and why is it important?',
    'multiple_choice',
    '["A type of IP address that dynamically assigns network locations to devices, allowing them to connect to different networks seamlessly without manual configuration", "A protocol used to encrypt data transmissions, ensuring secure communication between devices on a network by preventing unauthorized access to the information being sent", "A unique identifier assigned to every network device, acting like a \"name tag\" that allows data packets to reach the correct device on a local network, essentially ensuring that data is sent to the intended recipient within a network", "A software license key embedded in network hardware, required to activate and authenticate devices for use on a secure network infrastructure"]'::jsonb,
    '["A unique identifier assigned to every network device, acting like a \"name tag\" that allows data packets to reach the correct device on a local network, essentially ensuring that data is sent to the intended recipient within a network"]'::jsonb,
    400);

    -- 2. Question 28
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'A customer reports that some websites won''t load on their laptop, but others work fine. What could be the issue?',
    'multiple_choice',
    '["DNS server issues causing resolution problems", "Incorrect date and time settings on the laptop", "Fiber attenuation due to a damaged cable", "Browser cache or cookies causing conflicts"]'::jsonb,
    '["DNS server issues causing resolution problems"]'::jsonb,
    200);

    -- 3. Question 30
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'What does MSAP stand for, and why does clearing the MSAP help with provisioning issues?',
    'multiple_choice',
    '["Managed Service Access Point; clearing it updates firmware to resolve provisioning conflicts", "Master Service Access Protocol; clearing it resets network configurations to default settings", "Multi Signal Access Point; clearing it enhances signal strength for better provisioning", "Multi Service Access Platform; clearing it removes stored device serial numbers in the ONT, allowing new devices to be attached and provisioned"]'::jsonb,
    '["Multi Service Access Platform; clearing it removes stored device serial numbers in the ONT, allowing new devices to be attached and provisioned"]'::jsonb,
    800);

    -- 4. Question 34
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'Which of the following are types of fiber optic cables?',
    'check_all',
    '["Single-mode fiber", "Multi-mode fiber", "Twisted pair fiber", "Plastic optical fiber"]'::jsonb,
    '["Single-mode fiber", "Multi-mode fiber", "Plastic optical fiber"]'::jsonb,
    400);

END $$;

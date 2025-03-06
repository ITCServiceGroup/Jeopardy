DO $$ 
DECLARE 
    networking_id UUID;
    fiber_id UUID;
    tools_id UUID;
    wifi_id UUID;
    security_id UUID;
    infrastructure_id UUID;
    monitoring_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';
    SELECT id INTO fiber_id FROM categories WHERE name = 'Fiber Optics';
    SELECT id INTO tools_id FROM categories WHERE name = 'Tools';
    SELECT id INTO wifi_id FROM categories WHERE name = 'WiFi';
    SELECT id INTO security_id FROM categories WHERE name = 'Security';
    SELECT id INTO infrastructure_id FROM categories WHERE name = 'Infrastructure';
    SELECT id INTO monitoring_id FROM categories WHERE name = 'Monitoring';

    -- Infrastructure questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (infrastructure_id,
    'In a typical fiber network installation, what is the correct order of components from the network to the customer?',
    'multiple_choice',
    '["OLT → Router → ONT → NIU → Customer Devices", "OLT → NIU → ONT → Router → Customer Devices", "ONT → OLT → NIU → Router → Customer Devices", "NIU → OLT → ONT → Router → Customer Devices"]'::jsonb,
    '["OLT → NIU → ONT → Router → Customer Devices"]'::jsonb,
    800);

    -- Security questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (security_id,
    'Which network security practices should be recommended to customers?',
    'check_all',
    '["Use strong, unique WiFi passwords", "Keep router firmware updated", "Share WiFi password with neighbors", "Use guest network for visitors"]'::jsonb,
    '["Use strong, unique WiFi passwords", "Keep router firmware updated", "Use guest network for visitors"]'::jsonb,
    400);

    -- Monitoring questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (monitoring_id,
    'Which metrics are important to monitor in a fiber optic network?',
    'check_all',
    '["Optical power levels at various points", "Bit error rates and signal quality", "Network traffic patterns", "Customer browsing habits"]'::jsonb,
    '["Optical power levels at various points", "Bit error rates and signal quality", "Network traffic patterns"]'::jsonb,
    800);

    -- Advanced Networking questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'What is MSAP stand for, and why does clearing the MSAP help with provisioning issues?',
    'multiple_choice',
    '["Managed Service Access Point; clearing it updates firmware to resolve provisioning conflicts", "Master Service Access Protocol; clearing it resets network configurations to default settings", "Multi Signal Access Point; clearing it enhances signal strength for better provisioning", "Multi Service Access Platform; clearing it removes stored device serial numbers in the ONT, allowing new devices to be attached and provisioned"]'::jsonb,
    '["Multi Service Access Platform; clearing it removes stored device serial numbers in the ONT, allowing new devices to be attached and provisioned"]'::jsonb,
    800);

    -- Advanced Fiber questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'What is GPON and how does it work?',
    'multiple_choice',
    '["A type of copper-based network that uses electrical signals for data transmission", "A point-to-multipoint technology using optical splitters to serve multiple endpoints from a single fiber", "A wireless technology for long-distance internet connectivity", "A backup power system for fiber networks during outages"]'::jsonb,
    '["A point-to-multipoint technology using optical splitters to serve multiple endpoints from a single fiber"]'::jsonb,
    1000);

    -- Advanced Tools questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (tools_id,
    'What is the purpose of an Optical Time-Domain Reflectometer (OTDR) in fiber optic networks?',
    'multiple_choice',
    '["To measure the light intensity emitted by a fiber optic cable", "To detect faults, splices, and bends by sending light pulses and analyzing reflections", "To convert optical signals to electrical signals for analysis", "To amplify optical signals for long-distance transmission"]'::jsonb,
    '["To detect faults, splices, and bends by sending light pulses and analyzing reflections"]'::jsonb,
    800);

END $$;

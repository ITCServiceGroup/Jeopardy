-- Clean up existing data
DELETE FROM game_statistics;
DELETE FROM questions;
DELETE FROM category_tech_types;
DELETE FROM categories;

-- Ensure Service tech type exists
INSERT INTO tech_types (name) 
VALUES ('Service') 
ON CONFLICT (name) DO NOTHING;

-- Create variable to store Service tech type ID
DO $$ 
DECLARE 
    service_type_id INTEGER;
    networking_id UUID;
    fiber_id UUID;
    tools_id UUID;
    wifi_id UUID;
    troubleshooting_id UUID;
    documentation_id UUID;
    security_id UUID;
    infrastructure_id UUID;
    monitoring_id UUID;
BEGIN
    -- Get Service tech type ID
    SELECT id INTO service_type_id FROM tech_types WHERE name = 'Service';

    -- Insert categories
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'Networking') RETURNING id INTO networking_id;
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'Fiber Optics') RETURNING id INTO fiber_id;
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'Tools') RETURNING id INTO tools_id;
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'WiFi') RETURNING id INTO wifi_id;
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'Troubleshooting') RETURNING id INTO troubleshooting_id;
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'Documentation') RETURNING id INTO documentation_id;
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'Security') RETURNING id INTO security_id;
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'Infrastructure') RETURNING id INTO infrastructure_id;
    INSERT INTO categories (id, name) VALUES 
        (gen_random_uuid(), 'Monitoring') RETURNING id INTO monitoring_id;

    -- Link categories to Service tech type
    INSERT INTO category_tech_types (category_id, tech_type_id)
    VALUES 
        (networking_id, service_type_id),
        (fiber_id, service_type_id),
        (tools_id, service_type_id),
        (wifi_id, service_type_id),
        (troubleshooting_id, service_type_id),
        (documentation_id, service_type_id),
        (security_id, service_type_id),
        (infrastructure_id, service_type_id),
        (monitoring_id, service_type_id);

    -- Insert Networking questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id, 
    'What is a traceroute?',
    'multiple_choice',
    '["A network diagnostic tool that maps the path data takes to reach a destination", "A software used to increase internet speed", "A method to encrypt network traffic", "A tool to block unwanted websites"]'::jsonb,
    '["A network diagnostic tool that maps the path data takes to reach a destination"]'::jsonb,
    200);

    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'What is a MAC address and why is it important?',
    'multiple_choice',
    '["A type of IP address that dynamically assigns network locations to devices, allowing them to connect to different networks seamlessly without manual configuration", "A protocol used to encrypt data transmissions, ensuring secure communication between devices on a network by preventing unauthorized access to the information being sent", "A unique identifier assigned to every network device, acting like a \"name tag\" that allows data packets to reach the correct device on a local network, essentially ensuring that data is sent to the intended recipient within a network", "A software license key embedded in network hardware, required to activate and authenticate devices for use on a secure network infrastructure"]'::jsonb,
    '["A unique identifier assigned to every network device, acting like a \"name tag\" that allows data packets to reach the correct device on a local network, essentially ensuring that data is sent to the intended recipient within a network"]'::jsonb,
    400);

    -- Continuing with more Networking questions...
    -- (I'll continue with the rest of the questions in subsequent chunks due to length limits)

END $$;

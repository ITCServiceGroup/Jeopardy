DO $$ 
DECLARE 
    networking_id UUID;
    fiber_id UUID;
    troubleshooting_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO networking_id FROM categories WHERE name = 'Networking';
    SELECT id INTO fiber_id FROM categories WHERE name = 'Fiber Optics';
    SELECT id INTO troubleshooting_id FROM categories WHERE name = 'Troubleshooting';

    -- Missing Networking questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (networking_id,
    'How do you run a traceroute on Mac?',
    'check_all',
    '["Open Terminal and type \"traceroute [destination]\"", "Open Terminal and type \"sudo mtr -n [destination]\"", "Open Safari and navigate to a traceroute website", "Use Network Utility and select Trace Route"]'::jsonb,
    '["Open Terminal and type \"traceroute [destination]\"", "Open Terminal and type \"sudo mtr -n [destination]\""]'::jsonb,
    400);

    -- Missing Fiber questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (fiber_id,
    'What does NDP stand for, and what is its role in a fiber optic network?',
    'multiple_choice',
    '["Network Data Processing; the method of handling data packets within a network", "Neighbor Discovery Protocol; a set of processes used in IPv6 networks to discover other devices on the network", "Network Demarcation Point; it serves as the physical point where the service provider''s network ends and the customer''s internal network begins", "Network Distribution Point; a node in a network where data is distributed to various devices"]'::jsonb,
    '["Network Demarcation Point; it serves as the physical point where the service provider''s network ends and the customer''s internal network begins"]'::jsonb,
    600);

    -- Additional Troubleshooting questions
    INSERT INTO questions (category_id, question, question_type, options, correct_answers, points) VALUES
    (troubleshooting_id,
    'A customer reports intermittent internet drops during rainstorms. The ONT''s optical light remains green. Which factors could explain this?',
    'check_all',
    '["Water leaking into the NIU", "A corroded Ethernet cable between the ONT and router", "Signal reflection due to a dirty APC connector", "Overloaded GPON during peak weather-related usage"]'::jsonb,
    '["Water leaking into the NIU", "A corroded Ethernet cable between the ONT and router"]'::jsonb,
    800);

END $$;

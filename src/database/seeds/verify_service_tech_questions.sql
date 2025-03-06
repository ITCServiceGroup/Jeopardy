-- Verify the data was loaded correctly

-- Check tech type
SELECT name, id FROM tech_types WHERE name = 'Service';

-- Total question count (should be 50)
SELECT COUNT(*) as total_questions FROM questions;

-- Check categories and their question counts
SELECT 
    c.name AS category_name,
    COUNT(q.id) AS question_count,
    STRING_AGG(DISTINCT q.points::text, ', ' ORDER BY q.points::text) AS point_values,
    COUNT(DISTINCT q.question_type) AS question_type_count,
    STRING_AGG(DISTINCT q.question_type, ', ') AS question_types
FROM categories c
LEFT JOIN questions q ON q.category_id = c.id
WHERE EXISTS (
    SELECT 1 
    FROM category_tech_types ct 
    JOIN tech_types t ON t.id = ct.tech_type_id 
    WHERE ct.category_id = c.id AND t.name = 'Service'
)
GROUP BY c.name
ORDER BY c.name;

-- Questions by point value
SELECT 
    points,
    COUNT(*) as count,
    STRING_AGG(DISTINCT question_type, ', ') as types_at_this_point_value
FROM questions q
WHERE EXISTS (
    SELECT 1 
    FROM categories c
    JOIN category_tech_types ct ON ct.category_id = c.id
    JOIN tech_types t ON t.id = ct.tech_type_id
    WHERE q.category_id = c.id AND t.name = 'Service'
)
GROUP BY points
ORDER BY points;

-- Questions by type
SELECT 
    question_type,
    COUNT(*) as count,
    STRING_AGG(DISTINCT points::text, ', ' ORDER BY points::text) as point_values
FROM questions q
WHERE EXISTS (
    SELECT 1 
    FROM categories c
    JOIN category_tech_types ct ON ct.category_id = c.id
    JOIN tech_types t ON t.id = ct.tech_type_id
    WHERE q.category_id = c.id AND t.name = 'Service'
)
GROUP BY question_type
ORDER BY question_type;

-- Show questions with multiple correct answers
SELECT 
    c.name as category,
    q.points,
    q.question_type,
    jsonb_array_length(q.correct_answers) as num_correct_answers,
    q.question
FROM questions q
JOIN categories c ON c.id = q.category_id
WHERE jsonb_array_length(q.correct_answers) > 1
AND EXISTS (
    SELECT 1 
    FROM category_tech_types ct 
    JOIN tech_types t ON t.id = ct.tech_type_id 
    WHERE ct.category_id = c.id AND t.name = 'Service'
)
ORDER BY c.name, q.points;

-- Detailed listing of all questions
SELECT 
    c.name as category,
    q.points,
    q.question_type,
    jsonb_array_length(q.correct_answers) as num_correct_answers,
    CASE 
        WHEN LENGTH(q.question) > 50 
        THEN LEFT(q.question, 47) || '...' 
        ELSE q.question 
    END as truncated_question
FROM questions q
JOIN categories c ON c.id = q.category_id
WHERE EXISTS (
    SELECT 1 
    FROM category_tech_types ct 
    JOIN tech_types t ON t.id = ct.tech_type_id 
    WHERE ct.category_id = c.id AND t.name = 'Service'
)
ORDER BY c.name, q.points;

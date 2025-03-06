-- Run all service tech questions in order
\i service_tech_questions.sql
\i service_tech_questions_2.sql
\i service_tech_questions_3.sql
\i service_tech_questions_4.sql
\i service_tech_questions_5.sql
\i service_tech_questions_6.sql
\i service_tech_questions_7.sql
\i service_tech_questions_8.sql
\i service_tech_questions_9.sql

-- Note: All files should be in the same directory as this file

-- To load the questions:
-- psql -d your_database_name -f load_service_tech_questions.sql

-- To verify the data was loaded correctly:
-- psql -d your_database_name -f verify_service_tech_questions.sql

-- This will:
-- 1. Clean up existing data
-- 2. Create the Service tech type if it doesn't exist
-- 3. Create all categories and link them to the Service tech type
-- 4. Insert all questions with their options and correct answers
-- 5. Maintain referential integrity throughout the process

-- Categories Created:
-- - Networking
-- - Fiber Optics
-- - Tools
-- - WiFi
-- - Troubleshooting
-- - Documentation
-- - Security
-- - Infrastructure
-- - Monitoring

-- Question Types:
-- - multiple_choice: Single correct answer
-- - check_all: Multiple correct answers
-- - true_false: True/False questions

-- Point Values: 200, 400, 600, 800, 1000

-- After loading, verify the count:
-- SELECT COUNT(*) FROM questions; -- Should return 50 questions
-- SELECT c.name, COUNT(q.id)
-- FROM categories c
-- LEFT JOIN questions q ON q.category_id = c.id
-- GROUP BY c.name
-- ORDER BY c.name;

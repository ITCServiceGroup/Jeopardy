-- Drop and recreate the questions table with proper array type
ALTER TABLE questions 
ALTER COLUMN options TYPE JSONB USING array_to_json(options)::JSONB;

-- Add check constraint to ensure options is an array
ALTER TABLE questions
ADD CONSTRAINT options_is_array CHECK (jsonb_typeof(options) = 'array');

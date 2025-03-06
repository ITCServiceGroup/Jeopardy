# Service Tech Questions Seed Files

This directory contains SQL seed files for loading Service Tech questions into the database.

## Files

- `load_service_tech_questions.sql` - Main loader that runs all files in order
- `service_tech_questions_[1-7].sql` - Question data split into manageable chunks
- `verify_service_tech_questions.sql` - SQL queries to verify data was loaded correctly

## Usage

1. Ensure all files are in the same directory
2. Connect to your database
3. Run the loader:
   ```bash
   psql -d your_database_name -f load_service_tech_questions.sql
   ```
4. Verify the data:
   ```bash
   psql -d your_database_name -f verify_service_tech_questions.sql
   ```

## Content Structure

### Categories
- Networking
- Fiber Optics
- Tools
- WiFi
- Troubleshooting
- Documentation
- Security
- Infrastructure
- Monitoring

### Question Types
- `multiple_choice`: Single correct answer
- `check_all`: Multiple correct answers possible
- `true_false`: True/False questions

### Point Values
- 200 (Easy)
- 400 (Medium)
- 600 (Challenging)
- 800 (Hard)
- 1000 (Expert)

### Tech Type
All questions are assigned to the "Service" tech type.

## Verification Queries

The verification script checks:
1. Tech type existence
2. Category distribution
3. Question point distribution
4. Question type distribution
5. Orphaned questions
6. Multiple-answer questions

## Warning

Running these files will:
1. Delete existing game statistics
2. Delete existing questions
3. Delete existing category tech type associations
4. Delete existing categories

Make sure to backup any existing data before running the seed files.

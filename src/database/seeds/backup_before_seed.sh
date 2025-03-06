#!/bin/bash

# Default database name
DB_NAME="your_database_name"

# Parse command line arguments
while getopts "d:" opt; do
  case $opt in
    d) DB_NAME="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    exit 1
    ;;
  esac
done

# Create timestamps for backup files
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup existing data
echo "Creating backup of existing data..."

# Backup tech types
psql -d "$DB_NAME" -t -A -c "SELECT json_agg(row_to_json(t)) FROM tech_types t;" > "$BACKUP_DIR/tech_types_$TIMESTAMP.json"

# Backup categories
psql -d "$DB_NAME" -t -A -c "SELECT json_agg(row_to_json(c)) FROM categories c;" > "$BACKUP_DIR/categories_$TIMESTAMP.json"

# Backup category tech types
psql -d "$DB_NAME" -t -A -c "SELECT json_agg(row_to_json(ct)) FROM category_tech_types ct;" > "$BACKUP_DIR/category_tech_types_$TIMESTAMP.json"

# Backup questions
psql -d "$DB_NAME" -t -A -c "SELECT json_agg(row_to_json(q)) FROM questions q;" > "$BACKUP_DIR/questions_$TIMESTAMP.json"

# Backup game statistics
psql -d "$DB_NAME" -t -A -c "SELECT json_agg(row_to_json(gs)) FROM game_statistics gs;" > "$BACKUP_DIR/game_statistics_$TIMESTAMP.json"

echo "Backups created in $BACKUP_DIR with timestamp $TIMESTAMP"
echo "Now running seed files..."

# Run the seed files
psql -d "$DB_NAME" -f load_service_tech_questions.sql

echo "Seed files completed. Running verification..."

# Run verification
psql -d "$DB_NAME" -f verify_service_tech_questions.sql

echo "Process complete. Backups are stored in the $BACKUP_DIR directory."
echo "To restore from backup, use the restore_from_backup.sh script."

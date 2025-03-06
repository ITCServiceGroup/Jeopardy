#!/bin/bash

# Default database name
DB_NAME="your_database_name"
BACKUP_TIMESTAMP=""

# Parse command line arguments
while getopts "d:t:" opt; do
  case $opt in
    d) DB_NAME="$OPTARG"
    ;;
    t) BACKUP_TIMESTAMP="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    exit 1
    ;;
  esac
done

# Check if timestamp was provided
if [ -z "$BACKUP_TIMESTAMP" ]; then
    echo "Please provide a backup timestamp with -t option"
    echo "Available backups:"
    ls -1 backups/tech_types_*.json | sed 's/backups\/tech_types_\(.*\)\.json/\1/'
    exit 1
fi

# Check if backup files exist
if [ ! -f "backups/tech_types_${BACKUP_TIMESTAMP}.json" ]; then
    echo "Backup files for timestamp $BACKUP_TIMESTAMP not found"
    exit 1
fi

echo "Restoring from backup timestamp: $BACKUP_TIMESTAMP"

# Clean existing data
psql -d "$DB_NAME" -c "
DELETE FROM game_statistics;
DELETE FROM questions;
DELETE FROM category_tech_types;
DELETE FROM categories;
DELETE FROM tech_types;
"

# Function to restore a table from JSON backup
restore_table() {
    local table=$1
    local file="backups/${table}_${BACKUP_TIMESTAMP}.json"
    local json_content
    
    if [ -f "$file" ]; then
        json_content=$(cat "$file")
        if [ "$json_content" != "null" ]; then
            echo "Restoring $table..."
            psql -d "$DB_NAME" -c "
                CREATE TEMPORARY TABLE tmp_${table} AS SELECT * FROM ${table} WITH NO DATA;
                WITH json_data AS (
                    SELECT json_array_elements('$json_content'::json) AS data
                )
                INSERT INTO ${table}
                SELECT * FROM json_populate_recordset(null::${table}, (SELECT array_to_json(array_agg(data)) FROM json_data));
                DROP TABLE tmp_${table};
            "
        else
            echo "No data to restore for $table"
        fi
    else
        echo "Backup file for $table not found"
    fi
}

# Restore data in the correct order
restore_table "tech_types"
restore_table "categories"
restore_table "category_tech_types"
restore_table "questions"
restore_table "game_statistics"

echo "Restore complete. Running verification..."
psql -d "$DB_NAME" -f verify_service_tech_questions.sql

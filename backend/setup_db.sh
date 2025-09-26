#!/bin/bash

# Database setup script for Network Simulator Backend

echo "Network Simulator Backend - Database Setup"
echo "=========================================="

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "Error: PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Default database configuration
DB_NAME=${DATABASE_NAME:-"network_simulator"}
DB_USER=${DATABASE_USER:-"postgres"}
DB_HOST=${DATABASE_HOST:-"localhost"}
DB_PORT=${DATABASE_PORT:-"5432"}

echo "Setting up database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"

# Create database if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Database '$DB_NAME' created or already exists"
else
    echo "✗ Failed to create database"
    exit 1
fi

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✓ Database migrations completed successfully"
else
    echo "✗ Database migrations failed"
    exit 1
fi

echo ""
echo "Database setup completed!"
echo "You can now start the server with: python run.py"
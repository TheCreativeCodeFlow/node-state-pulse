@echo off
REM Database setup script for Network Simulator Backend (Windows)

echo Network Simulator Backend - Database Setup
echo ==========================================

REM Default database configuration
if not defined DATABASE_NAME set DATABASE_NAME=network_simulator
if not defined DATABASE_USER set DATABASE_USER=postgres
if not defined DATABASE_HOST set DATABASE_HOST=localhost
if not defined DATABASE_PORT set DATABASE_PORT=5432

echo Setting up database: %DATABASE_NAME%
echo Host: %DATABASE_HOST%:%DATABASE_PORT%
echo User: %DATABASE_USER%

REM Check if PostgreSQL is accessible
pg_isready -h %DATABASE_HOST% -p %DATABASE_PORT% -U %DATABASE_USER% >nul 2>&1
if errorlevel 1 (
    echo Error: Cannot connect to PostgreSQL. Please ensure PostgreSQL is running and accessible.
    pause
    exit /b 1
)

REM Create database if it doesn't exist
psql -h %DATABASE_HOST% -p %DATABASE_PORT% -U %DATABASE_USER% -tc "SELECT 1 FROM pg_database WHERE datname = '%DATABASE_NAME%'" | findstr /C:"1" >nul
if errorlevel 1 (
    echo Creating database %DATABASE_NAME%...
    psql -h %DATABASE_HOST% -p %DATABASE_PORT% -U %DATABASE_USER% -c "CREATE DATABASE %DATABASE_NAME%"
    if errorlevel 1 (
        echo Error: Failed to create database
        pause
        exit /b 1
    )
    echo Database '%DATABASE_NAME%' created successfully
) else (
    echo Database '%DATABASE_NAME%' already exists
)

REM Run Alembic migrations
echo Running database migrations...
alembic upgrade head
if errorlevel 1 (
    echo Error: Database migrations failed
    pause
    exit /b 1
)

echo.
echo Database setup completed successfully!
echo You can now start the server with: python run.py
pause
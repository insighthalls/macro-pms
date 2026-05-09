@echo off
echo =====================================================
echo  MACRO PMS - Prisma Migration to Supabase
echo =====================================================
echo.

cd /d "C:\Users\Administrator\Downloads\MACRO PMS\backend-slice"

echo Installing dependencies first...
call npm install

echo.
echo Running Prisma generate...
call npx prisma generate

echo.
echo Running Prisma migration (initial schema)...
call npx prisma migrate dev --name init

echo.
echo Running seed data...
call npx prisma db seed

echo.
echo =====================================================
echo  Done! Database is ready.
echo =====================================================
pause

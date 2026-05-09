@echo off
echo =====================================================
echo  MACRO PMS - Prisma DB Push + Seed
echo =====================================================
echo.

cd /d "C:\Users\Administrator\Downloads\MACRO PMS\backend-slice"

echo Pushing schema to Supabase (db push)...
call npx prisma db push --accept-data-loss

echo.
echo Running seed data...
call npx prisma db seed

echo.
echo =====================================================
echo  Done!
echo =====================================================
pause

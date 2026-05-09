@echo off
echo =====================================================
echo  MACRO PMS - Push tsconfig fix
echo =====================================================
echo.

cd /d "C:\Users\Administrator\Downloads\MACRO PMS"

echo Staging tsconfig fix...
git add backend-slice/tsconfig.json

echo Committing...
git commit -m "fix: remove prisma from tsconfig include (seed.ts outside rootDir)"

echo Pushing to GitHub...
git push origin main

echo.
echo =====================================================
echo  Done! Check GitHub Actions for the new run.
echo =====================================================
pause

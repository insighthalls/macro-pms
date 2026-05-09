@echo off
echo =====================================================
echo  MACRO PMS - Fix TypeScript errors (Deploy #4)
echo =====================================================
echo.

cd /d "C:\Users\Administrator\Downloads\MACRO PMS"

echo Staging all changes...
git add -A

echo Committing...
git commit -m "fix: resolve all TS errors (BadRequest, ok signature, userId->sub, noUncheckedIndexedAccess)"

echo Pushing to GitHub...
git push origin main

echo.
echo =====================================================
echo  Done! Check GitHub Actions for Deploy #4.
echo =====================================================
pause

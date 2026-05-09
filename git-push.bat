@echo off
set GITHUB_USER=YOUR-GITHUB-USERNAME
cd /d "C:\Users\Administrator\Downloads\MACRO PMS"
git remote add origin https://github.com/%GITHUB_USER%/macro-pms.git
git branch -M main
git push -u origin main
echo.
echo =====================================================
echo Done! Code is now on GitHub.
echo =====================================================
pause

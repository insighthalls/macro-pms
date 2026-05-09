@echo off
cd /d "C:\Users\Administrator\Downloads\MACRO PMS"
git add .github/workflows/deploy.yml
git commit -m "fix: decouple frontend deploy from backend (frontend deploys independently)"
git push origin main
echo.
echo Done! Frontend will now deploy even if backend has issues.
pause

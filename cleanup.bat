@echo off
echo 🔧 Stopping related processes...
taskkill /F /IM node.exe /T
taskkill /F /IM adb.exe /T
taskkill /F /IM java.exe /T
taskkill /F /IM gradle.exe /T

echo Deleting node_modules and build cache...
rd /s /q node_modules
rd /s /q .expo
rd /s /q android\.gradle
rd /s /q android\.cxx
del /f /q package-lock.json

echo 🧹 Cleaning npm cache...
npm cache clean --force

echo  Done. You can now run `npm install` again.
pause

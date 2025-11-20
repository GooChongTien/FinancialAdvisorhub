@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -NoProfile -File "%SCRIPT_DIR%ping-email-function.ps1"
endlocal


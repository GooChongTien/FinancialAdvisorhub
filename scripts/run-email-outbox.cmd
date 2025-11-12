@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -NoProfile -File "%SCRIPT_DIR%email-outbox-cron.ps1" -SupabaseUrl "https://jeaqhtghoyrnptlsfhqt.supabase.co" -ServiceRoleKey "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYXFodGdob3lybnB0bHNmaHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc1MTg1OSwiZXhwIjoyMDc3MzI3ODU5fQ.tJhh7POJta25XD1qHMBmBy8qehUR-P2xeoCI8_vpXJ4"
endlocal

param(
  [string]$EnvFile = ".env.local"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
  Write-Host "Env file not found: $EnvFile" -ForegroundColor Red
  exit 1
}

$lines = Get-Content $EnvFile | Where-Object { $_ -match '=' }
$url = ($lines | Where-Object { $_ -like 'VITE_SUPABASE_URL=*' }) -replace 'VITE_SUPABASE_URL=',''
$anon = ($lines | Where-Object { $_ -like 'VITE_SUPABASE_ANON_KEY=*' }) -replace 'VITE_SUPABASE_ANON_KEY=',''

if ([string]::IsNullOrWhiteSpace($url) -or [string]::IsNullOrWhiteSpace($anon)) {
  Write-Host "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in $EnvFile" -ForegroundColor Red
  exit 1
}

# Extract project ref from https://<ref>.supabase.co
$host = ([Uri]$url).Host
$projectRef = $host.Split('.')[0]
$fnUrl = "https://$projectRef.functions.supabase.co/email-sender"

try {
  $res = Invoke-RestMethod -Uri $fnUrl -Method Get -Headers @{ Authorization = "Bearer $anon" }
  $out = (ConvertTo-Json $res -Compress)
  $ts = Get-Date -Format o
  "$ts $out" | Tee-Object -File "scripts/ping-email-function.log" -Append | Out-Null
} catch {
  $_ | Out-String | Tee-Object -File "scripts/ping-email-function.log" -Append | Out-Null
  exit 1
}


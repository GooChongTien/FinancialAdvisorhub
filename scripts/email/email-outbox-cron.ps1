param(
  [string]$SupabaseUrl = "https://jeaqhtghoyrnptlsfhqt.supabase.co",
  [string]$ServiceRoleKey = ""
)

if ([string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
  Write-Host "Missing -ServiceRoleKey. Aborting." -ForegroundColor Red
  exit 1
}

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $here "..")

$env:SUPABASE_URL = $SupabaseUrl
$env:SUPABASE_SERVICE_ROLE_KEY = $ServiceRoleKey

Push-Location $root
try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is required to process the outbox." -ForegroundColor Red
    exit 1
  }
  Write-Host "Processing email_outbox at $(Get-Date -Format o)" -ForegroundColor Cyan
  node scripts/process-email-outbox.mjs | Tee-Object -File "scripts\\email-outbox-cron.log" -Append
} catch {
  $_ | Out-String | Tee-Object -File "scripts\\email-outbox-cron.log" -Append | Out-Null
  exit 1
} finally {
  Pop-Location
}


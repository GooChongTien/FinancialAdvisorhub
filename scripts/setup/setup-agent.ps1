# OpenAI Agent Integration Setup for Supabase
# PowerShell script to deploy Edge Functions and set secrets

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OpenAI Agent Integration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Supabase CLI is installed
Write-Host "[Step 1] Checking Supabase CLI..." -ForegroundColor Yellow
$supabasePath = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabasePath) {
    Write-Host "[ERROR] Supabase CLI is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Using npm (recommended)" -ForegroundColor White
    Write-Host "  npm install -g supabase" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Using Scoop" -ForegroundColor White
    Write-Host "  scoop install supabase" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3: Download from https://github.com/supabase/cli/releases" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "[OK] Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Step 2: Check if Supabase is running
Write-Host "[Step 2] Checking Supabase status..." -ForegroundColor Yellow
$supabaseStatus = supabase status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] No local Supabase instance running" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Choose setup option:" -ForegroundColor Yellow
    Write-Host "  1. Start local Supabase (for development/testing)" -ForegroundColor White
    Write-Host "  2. Link to production Supabase project" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Enter your choice (1 or 2)"

    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "[INFO] Starting local Supabase..." -ForegroundColor Cyan
        supabase start

        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to start Supabase" -ForegroundColor Red
            exit 1
        }

        $deployTarget = "local"
        Write-Host "[OK] Local Supabase started" -ForegroundColor Green
    }
    elseif ($choice -eq "2") {
        Write-Host ""
        Write-Host "[INFO] Linking to production Supabase..." -ForegroundColor Cyan
        Write-Host "You will need your project reference ID from Supabase dashboard" -ForegroundColor Yellow
        Write-Host "(Find it at: https://app.supabase.com/project/_/settings/general)" -ForegroundColor Gray
        Write-Host ""

        supabase link

        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to link project" -ForegroundColor Red
            exit 1
        }

        $deployTarget = "production"
        Write-Host "[OK] Project linked" -ForegroundColor Green
    }
    else {
        Write-Host "[ERROR] Invalid choice" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Supabase is running" -ForegroundColor Green
    $deployTarget = "local"
}

Write-Host ""

# Step 3: Read secrets from .env file
Write-Host "[Step 3] Reading environment variables..." -ForegroundColor Yellow

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    $envFile = ".env.example"
}

Write-Host "[INFO] Reading from $envFile" -ForegroundColor Cyan

# Extract secrets
$openaiKey = (Get-Content $envFile | Select-String "^OPENAI_API_KEY=(.+)$").Matches.Groups[1].Value
$workflowId = (Get-Content $envFile | Select-String "^AGENT_WORKFLOW_ID=(.+)$").Matches.Groups[1].Value

if (-not $openaiKey) {
    Write-Host "[ERROR] OPENAI_API_KEY not found in $envFile" -ForegroundColor Red
    exit 1
}

if (-not $workflowId) {
    Write-Host "[ERROR] AGENT_WORKFLOW_ID not found in $envFile" -ForegroundColor Red
    exit 1
}

$keyPreview = $openaiKey.Substring(0, [Math]::Min(20, $openaiKey.Length))
Write-Host "[OK] Found OPENAI_API_KEY: $keyPreview..." -ForegroundColor Green
Write-Host "[OK] Found AGENT_WORKFLOW_ID: $workflowId" -ForegroundColor Green
Write-Host ""

# Step 4: Set secrets
Write-Host "[Step 4] Setting Supabase secrets..." -ForegroundColor Yellow

if ($deployTarget -eq "local") {
    Write-Host "[INFO] Setting secrets for local development..." -ForegroundColor Cyan

    supabase secrets set OPENAI_API_KEY="$openaiKey" --local
    supabase secrets set AGENT_WORKFLOW_ID="$workflowId" --local
    supabase secrets set AGENT_BASE_URL="https://api.openai.com/v1" --local
    supabase secrets set AGENT_TIMEOUT="30000" --local
    supabase secrets set AGENT_MAX_RETRIES="3" --local
} else {
    Write-Host "[INFO] Setting secrets for production..." -ForegroundColor Cyan

    supabase secrets set OPENAI_API_KEY="$openaiKey"
    supabase secrets set AGENT_WORKFLOW_ID="$workflowId"
    supabase secrets set AGENT_BASE_URL="https://api.openai.com/v1"
    supabase secrets set AGENT_TIMEOUT="30000"
    supabase secrets set AGENT_MAX_RETRIES="3"
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to set secrets" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Secrets configured successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy Edge Function
Write-Host "[Step 5] Deploying agent-chat Edge Function..." -ForegroundColor Yellow

if ($deployTarget -eq "local") {
    supabase functions deploy agent-chat
} else {
    supabase functions deploy agent-chat --no-verify-jwt
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to deploy Edge Function" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check function logs: supabase functions logs agent-chat" -ForegroundColor Gray
    Write-Host "  2. Verify function files exist in supabase/functions/agent-chat/" -ForegroundColor Gray
    Write-Host "  3. Check for TypeScript syntax errors" -ForegroundColor Gray
    exit 1
}

Write-Host "[OK] Edge Function deployed successfully" -ForegroundColor Green
Write-Host ""

# Step 6: Verify deployment
Write-Host "[Step 6] Verifying deployment..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Deployed functions:" -ForegroundColor Cyan
supabase functions list

Write-Host ""
Write-Host "Recent logs:" -ForegroundColor Cyan
supabase functions logs agent-chat --tail 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your OpenAI Agent integration is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Navigate to http://localhost:5177" -ForegroundColor White
Write-Host "  2. Click 'Mira Chat' in the sidebar" -ForegroundColor White
Write-Host "  3. Send a test message: 'Hello, Mira!'" -ForegroundColor White
Write-Host ""

if ($deployTarget -eq "local") {
    Write-Host "Local Supabase URLs:" -ForegroundColor Cyan
    Write-Host "  Dashboard: http://localhost:54323" -ForegroundColor Gray
    Write-Host "  API: http://localhost:54321" -ForegroundColor Gray
    Write-Host "  Function: http://localhost:54321/functions/v1/agent-chat" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Test the function with curl:" -ForegroundColor Yellow
Write-Host ""

if ($deployTarget -eq "local") {
    Write-Host 'curl -X POST http://localhost:54321/functions/v1/agent-chat `' -ForegroundColor Gray
    Write-Host '  -H "Content-Type: application/json" `' -ForegroundColor Gray
    Write-Host '  -H "Accept: text/event-stream" `' -ForegroundColor Gray
    Write-Host '  -d "{\"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}], \"mode\": \"stream\"}"' -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

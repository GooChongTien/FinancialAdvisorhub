@echo off
echo ========================================
echo OpenAI Agent Integration Setup
echo ========================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Supabase CLI is not installed!
    echo.
    echo Please install Supabase CLI first:
    echo.
    echo Option 1: Using npm
    echo   npm install -g supabase
    echo.
    echo Option 2: Using Scoop
    echo   scoop install supabase
    echo.
    echo Option 3: Download from https://github.com/supabase/cli/releases
    echo.
    pause
    exit /b 1
)

echo [OK] Supabase CLI is installed
echo.

REM Check if project is linked
echo Checking Supabase project link...
supabase status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [INFO] No local Supabase project running.
    echo.
    echo Choose setup option:
    echo   1. Link to existing Supabase project (PRODUCTION)
    echo   2. Start local Supabase (DEVELOPMENT)
    echo.
    set /p choice="Enter choice (1 or 2): "

    if "%choice%"=="1" (
        echo.
        echo [INFO] Linking to production Supabase project...
        echo You'll need your project reference ID from Supabase dashboard
        echo.
        supabase link
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Failed to link project
            pause
            exit /b 1
        )
        set DEPLOY_TARGET=production
    ) else if "%choice%"=="2" (
        echo.
        echo [INFO] Starting local Supabase...
        supabase start
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Failed to start local Supabase
            pause
            exit /b 1
        )
        set DEPLOY_TARGET=local
    ) else (
        echo [ERROR] Invalid choice
        pause
        exit /b 1
    )
) else (
    echo [OK] Supabase is running locally
    set DEPLOY_TARGET=local
)

echo.
echo ========================================
echo Step 1: Set Environment Secrets
echo ========================================
echo.

REM Read secrets from .env.local or .env.example
if exist .env.local (
    echo [INFO] Reading secrets from .env.local
    set ENV_FILE=.env.local
) else (
    echo [INFO] Reading secrets from .env.example
    set ENV_FILE=.env.example
)

REM Extract OpenAI API Key
for /f "tokens=2 delims==" %%a in ('findstr /B "OPENAI_API_KEY=" %ENV_FILE%') do set OPENAI_API_KEY=%%a

REM Extract Agent Workflow ID
for /f "tokens=2 delims==" %%a in ('findstr /B "AGENT_WORKFLOW_ID=" %ENV_FILE%') do set AGENT_WORKFLOW_ID=%%a

if "%OPENAI_API_KEY%"=="" (
    echo [ERROR] OPENAI_API_KEY not found in %ENV_FILE%
    pause
    exit /b 1
)

if "%AGENT_WORKFLOW_ID%"=="" (
    echo [ERROR] AGENT_WORKFLOW_ID not found in %ENV_FILE%
    pause
    exit /b 1
)

echo [INFO] Found OPENAI_API_KEY: %OPENAI_API_KEY:~0,20%...
echo [INFO] Found AGENT_WORKFLOW_ID: %AGENT_WORKFLOW_ID%
echo.

REM Set secrets based on deployment target
if "%DEPLOY_TARGET%"=="local" (
    echo [INFO] Setting secrets for local development...
    supabase secrets set OPENAI_API_KEY=%OPENAI_API_KEY% --local
    supabase secrets set AGENT_WORKFLOW_ID=%AGENT_WORKFLOW_ID% --local
    supabase secrets set AGENT_BASE_URL=https://api.openai.com/v1 --local
    supabase secrets set AGENT_TIMEOUT=30000 --local
    supabase secrets set AGENT_MAX_RETRIES=3 --local
) else (
    echo [INFO] Setting secrets for production...
    supabase secrets set OPENAI_API_KEY=%OPENAI_API_KEY%
    supabase secrets set AGENT_WORKFLOW_ID=%AGENT_WORKFLOW_ID%
    supabase secrets set AGENT_BASE_URL=https://api.openai.com/v1
    supabase secrets set AGENT_TIMEOUT=30000
    supabase secrets set AGENT_MAX_RETRIES=3
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to set secrets
    pause
    exit /b 1
)

echo [OK] Secrets configured successfully
echo.

echo ========================================
echo Step 2: Deploy Edge Function
echo ========================================
echo.

echo [INFO] Deploying agent-chat Edge Function...

if "%DEPLOY_TARGET%"=="local" (
    supabase functions deploy agent-chat
) else (
    supabase functions deploy agent-chat --no-verify-jwt
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to deploy Edge Function
    pause
    exit /b 1
)

echo [OK] Edge Function deployed successfully
echo.

echo ========================================
echo Step 3: Verify Deployment
echo ========================================
echo.

echo [INFO] Listing deployed functions...
supabase functions list

echo.
echo [INFO] Checking function logs (last 10 lines)...
supabase functions logs agent-chat --tail 10

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Your OpenAI Agent integration is ready!
echo.
echo Next steps:
echo   1. Navigate to http://localhost:5177
echo   2. Click "Mira Chat" in the sidebar
echo   3. Send a test message: "Hello, Mira!"
echo.

if "%DEPLOY_TARGET%"=="local" (
    echo [INFO] Local Supabase URL: http://localhost:54321
    echo [INFO] Function URL: http://localhost:54321/functions/v1/agent-chat
) else (
    echo [INFO] Check your Supabase dashboard for the production URL
)

echo.
pause

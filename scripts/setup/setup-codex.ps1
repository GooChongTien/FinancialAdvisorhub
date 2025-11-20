# Setup Codex in Cursor - Quick Setup Script
# This script helps you set up OpenAI Codex in Cursor IDE

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Codex Setup for Cursor IDE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Cursor is installed
$cursorPath = "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe"
if (-not (Test-Path $cursorPath)) {
    Write-Host "⚠️  Cursor IDE not found at: $cursorPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install Cursor from: https://cursor.sh" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit
    }
}
else {
    Write-Host "✅ Cursor IDE found" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Setup Checklist:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Install Codex Extension:" -ForegroundColor White
Write-Host "   - Open Cursor IDE" -ForegroundColor Gray
Write-Host "   - Press Ctrl+Shift+X to open Extensions" -ForegroundColor Gray
Write-Host "   - Search for 'Codex' or 'OpenAI Codex'" -ForegroundColor Gray
Write-Host "   - Click Install" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Sign In to Codex:" -ForegroundColor White
Write-Host "   - Click the Codex icon in the sidebar" -ForegroundColor Gray
Write-Host "   - Sign in with your ChatGPT account (recommended)" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Configure Codex:" -ForegroundColor White
Write-Host "   - Switch to GPT-5-Codex model (recommended for coding)" -ForegroundColor Gray
Write-Host "   - Adjust reasoning effort (start with 'medium')" -ForegroundColor Gray
Write-Host "   - Set approval mode to 'Agent' (default)" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Verify Setup:" -ForegroundColor White
Write-Host "   - Open Codex chat panel" -ForegroundColor Gray
Write-Host "   - Try a simple prompt like: 'Explain this codebase'" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Configuration files created:" -ForegroundColor Green
Write-Host "   - .vscode/settings.json (Codex settings)" -ForegroundColor Gray
Write-Host "   - AGENTS.md (Custom instructions for Codex)" -ForegroundColor Gray
Write-Host "   - CODEX_SETUP.md (Detailed setup guide)" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Read CODEX_SETUP.md for detailed instructions" -ForegroundColor White
Write-Host "   2. Install the Codex extension in Cursor" -ForegroundColor White
Write-Host "   3. Sign in and start using Codex!" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "   - Codex Docs: https://developers.openai.com/codex/ide" -ForegroundColor White
Write-Host "   - Codex GitHub: https://github.com/openai/codex" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to open the setup guide..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Try to open the setup guide
if (Test-Path "CODEX_SETUP.md") {
    try {
        Start-Process "CODEX_SETUP.md"
    }
    catch {
        Write-Host "Could not open CODEX_SETUP.md automatically. Please open it manually." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Setup complete! Happy coding with Codex! 🚀" -ForegroundColor Green


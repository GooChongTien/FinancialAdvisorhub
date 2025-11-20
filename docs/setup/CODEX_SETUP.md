# Codex Setup Guide for Cursor

This guide will help you set up OpenAI Codex in Cursor IDE.

## What is Codex?

Codex is OpenAI's coding agent that can read, modify, and run code. It helps you build faster, squash bugs, and understand unfamiliar code. With the Codex extension, you can use Codex side-by-side in your IDE or delegate tasks to the cloud.

**Reference:** [OpenAI Codex IDE Extension Documentation](https://developers.openai.com/codex/ide)

---

## Step 1: Install the Codex Extension

### Option A: Install from Cursor Extension Marketplace

1. Open Cursor IDE
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac) to open the Extensions view
3. Search for "Codex" or "OpenAI Codex"
4. Click **Install** on the "Codex" extension by OpenAI
5. Wait for installation to complete

### Option B: Install Directly

1. Open Cursor IDE
2. Go to the Extensions view (`Ctrl+Shift+X`)
3. Click the `...` menu in the Extensions view
4. Select "Install from VSIX..." (if available)
5. Download the Codex extension from: https://marketplace.visualstudio.com/items?itemName=openai.codex

### Option C: Command Line Installation

```powershell
# Open Cursor and use the command palette
# Press Ctrl+Shift+P and type: "Extensions: Install Extensions"
# Then search for "Codex"
```

---

## Step 2: Locate Codex in Cursor

After installation:

1. **Check the left sidebar** - Codex should appear as an icon in the activity bar
2. **If hidden in Cursor:**
   - Cursor displays extensions horizontally by default
   - Codex might be in collapsed items
   - **Pin it** by right-clicking the Codex icon and selecting "Pin"
   - Reorganize the order of extensions to make Codex more accessible

### Move Codex to Right Sidebar (Optional)

To move Codex to the right sidebar next to Cursor chat:

1. Go to **Settings** (`Ctrl+,`)
2. Search for "activity bar" in Workbench settings
3. Change the orientation to **"vertical"**
4. **Restart Cursor** to see the changes
5. Now you can drag the Codex icon to the right of your editor screen
6. Codex will appear as an additional tab in the sidebar
7. After moving, you can reset the activity bar orientation to "horizontal"

---

## Step 3: Sign In to Codex

1. Click on the Codex icon in the sidebar
2. You'll be prompted to sign in
3. **Recommended:** Sign in with your **ChatGPT account**
   - You get usage credits with your ChatGPT plan
   - No additional setup required
4. **Alternative:** Use an API key (requires additional setup)
   - See [Codex Pricing](https://developers.openai.com/codex/pricing) for details

---

## Step 4: Configure Codex

### Basic Configuration

Codex is now ready to use! The default settings work well for most cases:

- **Model:** GPT-5 (default) or GPT-5-Codex (recommended for coding)
- **Approval Mode:** Agent (Codex can read files, make edits, and run commands automatically)
- **Reasoning Effort:** Medium (good balance of speed and depth)

### Switch to GPT-5-Codex (Recommended)

1. Open the Codex chat panel
2. Look for the model switcher under the chat input
3. Select **GPT-5-Codex** (optimized version of GPT-5 for agentic coding)

### Adjust Reasoning Effort

- **Low:** Fast responses, good for simple tasks
- **Medium:** Balanced (default)
- **High:** More complex tasks, takes longer, uses more tokens

### Approval Modes

- **Chat:** Just chat, no file access or edits
- **Agent:** (Default) Can read files, make edits, run commands (needs approval for network access)
- **Agent (Full Access):** Full access without approval (use with caution)

---

## Step 5: Using Codex

### Basic Usage

1. Open Codex from the sidebar
2. Type your prompt in the chat input
3. Codex will respond and can make changes to your code

### Reference Files in Prompts

You can reference any file in your editor by tagging it:

```
Use @example.tsx as a reference to add a new page named "Resources" to the app that contains a list of resources defined in @resources.ts
```

### Keyboard Shortcuts

1. Press the **Settings icon** in the Codex chat
2. Select **"Keyboard shortcuts"**
3. Bind commands like:
   - Toggle Codex chat
   - Add to Codex context
   - Other Codex commands

---

## Step 6: Project-Specific Configuration

### AGENTS.md File

Create an `AGENTS.md` file in your project root for custom instructions. Codex will automatically read this file to understand your project's context and preferences.

See `AGENTS.md` in this project for project-specific instructions.

### VS Code Settings

The `.vscode/settings.json` file contains Codex-specific settings. See that file for configuration options.

---

## Troubleshooting

### Codex Extension Not Showing

1. **Restart Cursor completely**
2. Check if the extension is installed: Go to Extensions view and search for "Codex"
3. Make sure you're using a compatible version of Cursor
4. Try uninstalling and reinstalling the extension

### Service Worker Errors

If you encounter service worker errors:

1. Run the `fix-cursor-codex.ps1` script in this project:
   ```powershell
   .\fix-cursor-codex.ps1
   ```
2. Restart Cursor completely
3. Update Cursor to the latest version

### Windows-Specific Issues

- Codex on Windows is still experimental
- For best experience, consider using WSL (Windows Subsystem for Linux)
- See [Codex on Windows Guide](https://developers.openai.com/codex/guides/codex-on-windows)

### Extension Not Working

1. Check your internet connection
2. Verify you're signed in to Codex
3. Check your ChatGPT plan/credits
4. Look at the Codex chat for error messages
5. Check Cursor's output panel for extension errors

---

## Additional Resources

- [Codex IDE Extension Docs](https://developers.openai.com/codex/ide)
- [Codex GitHub Repository](https://github.com/openai/codex)
- [Codex Configuration Guide](https://developers.openai.com/codex/ide/configuration)
- [Codex Pricing](https://developers.openai.com/codex/pricing)
- [Prompting Codex Guide](https://developers.openai.com/codex/guides/prompting-codex)

---

## Next Steps

1. ✅ Install Codex extension
2. ✅ Sign in with ChatGPT account
3. ✅ Switch to GPT-5-Codex model
4. ✅ Try a simple prompt like: "Explain this codebase structure"
5. ✅ Reference files using `@filename` syntax
6. ✅ Customize settings in `.vscode/settings.json` if needed

Happy coding with Codex! 🚀


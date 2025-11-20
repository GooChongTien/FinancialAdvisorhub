# Codex Quick Start - Sign In Guide

## Step-by-Step: Opening and Signing In to Codex

### Step 1: Open Codex Panel

**Option A: Using the Sidebar**
1. Look at the **left sidebar** of Cursor (the activity bar with icons)
2. Find the **Codex icon** (it may be in collapsed items if Cursor uses horizontal layout)
3. Click the Codex icon to open the Codex panel

**Option B: Using Command Palette**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open Command Palette
2. Type: `Codex: Open Codex` or `Codex: Show Codex`
3. Press Enter

**Option C: Using Keyboard Shortcut**
1. Go to Settings → Keyboard Shortcuts (`Ctrl+K Ctrl+S`)
2. Search for "Codex"
3. Set a custom shortcut for "Codex: Toggle Codex" if not already set
4. Use that shortcut to open Codex

### Step 2: Sign In to Codex

Once the Codex panel is open:

1. **Look for a "Sign In" button or prompt** in the Codex chat panel
2. **Click "Sign In"** or the authentication button
3. **Choose your sign-in method:**
   - **Recommended:** Sign in with ChatGPT account
     - This uses your existing ChatGPT plan credits
     - No additional setup needed
   - **Alternative:** Use API key (requires additional configuration)

### Step 3: Verify Sign-In

After signing in, you should see:
- ✅ Your account information in the Codex panel
- ✅ Ability to type messages in the chat input
- ✅ Model selector (should show GPT-5 or GPT-5-Codex)

### Troubleshooting: Can't Find Codex Icon?

**If Codex icon is not visible:**

1. **Check if extension is installed:**
   - Press `Ctrl+Shift+X` to open Extensions
   - Search for "Codex"
   - If not installed, click "Install"

2. **Restart Cursor:**
   - Close Cursor completely
   - Reopen Cursor
   - Codex should appear in the sidebar

3. **Check extension status:**
   - In Extensions view, find "Codex"
   - Make sure it's enabled (not disabled)
   - Check for any error messages

4. **Move Codex to visible location:**
   - If using horizontal activity bar, Codex might be hidden
   - Right-click on the activity bar area
   - Look for "Pin" option or reorganize extensions
   - Or change activity bar to vertical (Settings → Workbench → Activity Bar → Orientation → Vertical)

### Step 4: First Use

Once signed in, try these prompts:

1. **Test connection:**
   ```
   Hello, can you help me understand this codebase?
   ```

2. **Reference a file:**
   ```
   Explain @package.json
   ```

3. **Ask about project structure:**
   ```
   What is the architecture of this AdvisorHub project?
   ```

---

## Still Having Issues?

1. **Check Codex extension page:**
   - Go to Extensions (`Ctrl+Shift+X`)
   - Find "Codex" extension
   - Check the extension page for any error messages or requirements

2. **Check Cursor version:**
   - Codex requires a recent version of Cursor
   - Update Cursor if needed

3. **Check internet connection:**
   - Codex needs internet to sign in and work
   - Verify your connection is working

4. **Check ChatGPT account:**
   - Make sure your ChatGPT account is active
   - Verify you have available credits/usage

5. **Run the fix script:**
   ```powershell
   .\fix-cursor-codex.ps1
   ```
   Then restart Cursor

---

## Need More Help?

- See `CODEX_SETUP.md` for detailed setup instructions
- Check [Codex Documentation](https://developers.openai.com/codex/ide)
- Review [Codex GitHub](https://github.com/openai/codex) for issues


# Codex Sign-In Troubleshooting

## No Sign-In Button? Here's What to Do

If you don't see a sign-in button in Codex, try these solutions:

### Solution 1: You Might Already Be Signed In

**Check your sign-in status:**
1. Look at the Codex panel
2. Check the top-right corner of the Codex panel for:
   - Your account/email
   - A profile icon
   - Settings icon (gear)
3. If you see these, you're already signed in! ✅

**To verify:**
- Try typing a message in the Codex chat input
- If it works, you're signed in

---

### Solution 2: Trigger Sign-In by Using Codex

Sometimes the sign-in prompt appears when you first try to use Codex:

1. **Type a message** in the Codex chat input (even if it looks disabled)
2. **Press Enter** or click Send
3. This should trigger a sign-in prompt if you're not signed in

---

### Solution 3: Check Codex Settings

1. **Look for a Settings icon** (gear ⚙️) in the Codex panel
2. Click it to open Codex settings
3. Look for:
   - "Account" or "Authentication" section
   - "Sign In" option
   - "API Key" option

---

### Solution 4: Use Command Palette

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `Codex: Sign In` or `Codex: Authenticate`
3. Press Enter
4. This should open the sign-in flow

---

### Solution 5: Check Extension Status

1. Press `Ctrl+Shift+X` to open Extensions
2. Find "Codex" extension
3. Check if there are any error messages
4. Look for a "Sign In" button in the extension details panel
5. Try clicking "Reload" or "Restart Extension"

---

### Solution 6: Restart Codex Extension

1. Press `Ctrl+Shift+P`
2. Type: `Developer: Reload Window`
3. Press Enter
4. This reloads Cursor and all extensions
5. Check Codex again

---

### Solution 7: Check for Notifications

1. Look at the **bottom-right corner** of Cursor
2. Check for any notification badges or messages
3. Sometimes sign-in prompts appear as notifications
4. Click any notification to see if it's related to Codex sign-in

---

### Solution 8: Manual API Key Setup

If you prefer to use an API key instead:

1. Press `Ctrl+Shift+P`
2. Type: `Codex: Configure API Key` or `Codex: Set API Key`
3. Enter your OpenAI API key
4. Note: This requires additional setup (see Codex docs)

---

### Solution 9: Check Codex Panel Content

Look at what's actually displayed in the Codex panel:

**If you see:**
- Empty chat interface → Try typing a message
- "Welcome" message → Look for a sign-in link in the text
- Error message → Note the error and check Codex docs
- Loading spinner → Wait for it to finish loading

---

### Solution 10: Verify Extension Installation

1. Go to Extensions (`Ctrl+Shift+X`)
2. Search for "Codex"
3. Make sure it shows "Installed" (not "Install")
4. Check the version number
5. If outdated, update it
6. If not installed, install it and restart Cursor

---

## Still Can't Sign In?

### Check These:

1. **Internet Connection**
   - Codex needs internet to sign in
   - Verify your connection is working

2. **Cursor Version**
   - Codex requires a recent version of Cursor
   - Update Cursor if needed

3. **Extension Compatibility**
   - Make sure Codex extension is compatible with your Cursor version
   - Check the extension page for requirements

4. **Firewall/Proxy**
   - Corporate firewalls might block sign-in
   - Check if you need to configure proxy settings

---

## Alternative: Check Codex Status via Terminal

You can also check if Codex CLI is installed and configured:

```powershell
# Check if Codex CLI is available
codex --version

# If installed, check status
codex status
```

---

## Next Steps

1. Try typing a message in Codex chat - this often triggers sign-in
2. Check the Settings icon in Codex panel
3. Use Command Palette: `Codex: Sign In`
4. Restart Cursor completely
5. Check for any error messages in the Codex panel

---

## Need More Help?

- [Codex Documentation](https://developers.openai.com/codex/ide)
- [Codex GitHub Issues](https://github.com/openai/codex/issues)
- Check Cursor's output panel for extension errors:
  - View → Output
  - Select "Codex" from the dropdown


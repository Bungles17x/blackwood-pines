# Troubleshooting Browser Errors

## Important Note
Most of the console errors you see are **NOT related to your game** - they're caused by browser extensions interfering with the page. Your game will still work perfectly despite these errors.

## Quick Fix: Use Incognito Mode
**I've created a script for you:** `launch-chrome-incognito.bat`

Simply double-click this file to launch Chrome in Incognito mode at `http://localhost:3000`. This automatically eliminates all extension errors.

## Common Issues and Solutions

### Service Worker Errors
**Error:** `The FetchEvent for "..." resulted in a network error response`

**Solution:** I've added a script to clear service workers automatically. If you still see this error:
1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear Service Workers
4. Refresh the page

### WebSocket Connection Errors
**Error:** `WebSocket connection to 'ws://localhost:24678/?token=...' failed`

**Solution:** This is Vite's hot module replacement (HMR) trying to connect. It's not critical for the game to work:
- For development: This error is normal and won't affect functionality
- For production: Use `npm run serve` instead of `npm run dev`

### Browser Extension Interference
**Errors:** 
- `redirectionChainSiteScript.js:1 [cently:rd:site] failed to patch window.location setter`
- `contentScript.js:2 i18next: languageChanged en-US`
- `[Violation] Permissions policy violation: unload is not allowed in this document`
- `Unchecked runtime.lastError: The message port closed before a response was received` (repeated many times)

**Impact:** These errors **DO NOT affect your game** - they're just extension communication failures. Your game will work perfectly despite these console errors.

**Solution:** These are caused by browser extensions. The "message port closed" error in particular is very common with Chrome extensions. To test the game cleanly:

1. **Open Incognito/Private Window:**
   - Chrome: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P
   - Edge: Ctrl+Shift+N

2. **Or temporarily disable extensions:**
   - Open browser settings
   - Go to Extensions
   - Disable all extensions
   - Restart browser
   - Test the game

3. **Specific problematic extensions to disable:**
   - Ad blockers
   - Translation extensions
   - Privacy extensions
   - Custom script injectors

### Network Errors
**Error:** `Failed to load resource: net::ERR_FAILED`

**Solution:** 
1. Make sure the dev server is running: `npm run dev`
2. Check that you're accessing `http://localhost:3000`
3. Try a different browser (Chrome, Firefox, Edge)
4. Clear browser cache and cookies

## Recommended Testing Workflow

### For Development:
```bash
npm run dev
```
Then open in Incognito window at `http://localhost:3000`

### For Production Testing:
```bash
npm run build
npm run serve
```
Then open in Incognito window at `http://localhost:3000`

## Still Having Issues?

1. Try a different browser
2. Restart your computer
3. Check Windows Firewall settings
4. Verify Node.js is working: `node --version`
5. Clear all browser data for localhost

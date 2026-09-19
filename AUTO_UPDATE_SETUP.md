# Auto-Update Setup for Blackwood Pines

## 🔄 How Auto-Update Works

Your Blackwood Pines game now includes automatic update functionality using GitHub Releases. When you launch the game, it will:

1. Check for updates from GitHub Releases
2. Show an update modal with progress
3. Automatically download and install updates
4. Restart with the new version

## 📋 Required Setup

### **Step 1: Update GitHub Username**

You need to replace `YOUR_GITHUB_USERNAME` in `package.json`:

**In `package.json` (line ~58):**
```json
"publish": {
  "provider": "github",
  "owner": "YOUR_GITHUB_USERNAME", // ← Change this to your actual GitHub username
  "repo": "blackwood-pines"
}
```

The auto-updater automatically reads this configuration, so you only need to update it in one place!

### **Step 2: Create GitHub Personal Access Token**

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it these permissions:
   - `repo` (full control of private repositories)
   - `workflow` (for GitHub Actions)
4. Copy the token

### **Step 3: Build and Publish**

**RECOMMENDED: Use the secure batch file**

Double-click `build-and-publish.bat` and enter your token when prompted. This will:
- Delete old GitHub releases automatically
- Build the game
- Publish the new release to GitHub
- Never save your token to any file

**OR use command line:**

Set this environment variable before building:

**Windows PowerShell:**
```powershell
$env:GH_TOKEN="your_github_token_here"
```

**Windows CMD:**
```cmd
set GH_TOKEN=your_github_token_here
```

### **Step 4: Push Your Code to GitHub**

```bash
git add .
git commit -m "Add auto-update functionality"
git push origin main
```

## 🚀 Publishing Updates

### **Method 1: Automatic (Recommended)**

Use the `npm run dist-win` command with the token set:

```powershell
$env:GH_TOKEN="your_token"
npm run dist-win
```

This will:
- Build the game
- Create the installer
- **Automatically publish to GitHub Releases**

### **Method 2: Manual**

1. Build the game: `npm run dist-win`
2. Go to GitHub → Releases
3. Click "Create a new release"
4. Tag version: `v1.0.0`
5. Release title: `Version 1.0.0`
6. Upload the `.exe` file from the `release` folder
7. Click "Publish release"

## 🎮 How Users Get Updates

1. User launches the installed game
2. Game checks GitHub for updates
3. If a newer version exists, the update modal appears
4. Game downloads and installs the update automatically
5. Game restarts with the new version

## 📝 Version Numbers

Update the version in `package.json` before each release:

```json
"version": "1.0.0"  // ← Increment this
```

Version format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (e.g., 1.0.0 → 1.0.1)

## 🔧 Testing Auto-Update

### **Test Locally (Without GitHub)**

To test the update UI without publishing:

1. Open `electron-main.cjs`
2. Comment out the auto-update check on startup:
```javascript
// if (process.env.NODE_ENV !== 'development') {
//   autoUpdater.checkForUpdates();
// }
```

3. Build and run the game - the update modal won't appear
4. Uncomment to re-enable

### **Test with Real Updates**

1. Publish version 1.0.0
2. Install it
3. Update version to 1.0.1 in `package.json`
4. Publish version 1.0.1
5. Launch the installed 1.0.0 - it should detect 1.0.1 and update

## ⚠️ Important Notes

- **GitHub repository must be public** for auto-updater to work
- **GH_TOKEN is required** for automatic publishing
- **Each release needs a new version number**
- **Users can still play without internet** (just won't get updates)
- **Updates download in the background** and install on quit

## 🎯 Summary

1. ✅ Replace `YOUR_GITHUB_USERNAME` in both files
2. ✅ Create GitHub Personal Access Token
3. ✅ Set `GH_TOKEN` environment variable
4. ✅ Push code to GitHub
5. ✅ Run `npm run dist-win` to build and publish
6. ✅ Users get automatic updates!

**Your game will now update automatically!** 🚀

# Auto-Update Setup for Blackwood Pines

## 🔄 How Auto-Update Works

Your Blackwood Pines game includes an opt-in update flow using GitHub Releases. When you launch the installed game, it will:

1. Check for updates from GitHub Releases
2. Show a non-blocking notification when a release is available
3. Let the player review release notes and download with visible progress
4. Install and restart only after the player confirms

Checks are deduplicated, retried from the update dialog, and skipped in development builds. Browser players use the deployed build metadata to reload when a newer build is published.

## 📋 Required Setup

### **Step 1: Verify GitHub Release Settings**

The GitHub owner and repository are configured in `package.json`:

```json
"publish": {
  "provider": "github",
  "owner": "Bungles17x",
  "repo": "blackwood-pines"
}
```

Keep this configuration aligned with the repository that publishes the installer.

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
2. Game checks GitHub for updates after the window is ready
3. If a newer version exists, a non-blocking notification appears
4. The player opens the update dialog, reviews the release notes, and starts the download
5. The player installs and restarts when the download is complete

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

To test the renderer without publishing:

1. Run `npm run dev` for the browser build, or `npm run electron-dev` for Electron.
2. Browser builds exercise the build-metadata reload path.
3. Electron update checks run only in packaged builds, so use a published release to test GitHub update discovery and installation.

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
- **Updates never download silently**; the player starts the download from the update dialog
- **Downloaded updates install only after confirmation**, while the updater is also configured to install on a normal app quit

## 🎯 Summary

1. ✅ Verify the GitHub owner and repository in `package.json`
2. ✅ Create a GitHub Personal Access Token
3. ✅ Set the `GH_TOKEN` environment variable
4. ✅ Push code to GitHub
5. ✅ Run `npm run dist-win` to build and publish
6. ✅ Users receive an opt-in update notification

**Your game is ready to deliver opt-in updates!**

# Build and Publish Guide

## 🚀 Quick Start

### **Double-click**: `build-and-publish.bat`

This will:
1. ✅ Delete all old GitHub releases automatically
2. ✅ Build your game
3. ✅ Publish a new release to GitHub
4. ✅ Keep your token secure (never saved to files)

## 🔐 Security Features

- Token is entered as hidden input (not visible on screen)
- Token is only used during the build session
- Token is never saved to any file
- Script uses PowerShell for secure handling

## ⚠️ First-Time Setup

If you get a "cannot be loaded because running scripts is disabled" error:

**Option 1: Allow scripts temporarily (Recommended)**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Option 2: Allow scripts for current user**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then run `build-and-publish.bat` again.

## 📋 What Happens During Build

1. **Prompts for GitHub token** (hidden input)
2. **Fetches existing releases** from GitHub
3. **Deletes old releases** (keeps releases clean)
4. **Builds the game** with Vite
5. **Creates Windows installer** with Electron Builder
6. **Publishes to GitHub Releases** automatically

## 🎮 After Publishing

- Your game will be available at: https://github.com/Bungles17x/blackwood-pines/releases
- Users can download the installer
- Auto-updates will work when users launch the game
- Future updates just need version bump + rebuild

## 🔧 Manual Publishing (If Script Fails)

If the automatic script doesn't work, you can manually delete releases:

1. Go to: https://github.com/Bungles17x/blackwood-pines/releases
2. Delete old releases manually
3. Run: `npm run dist-win` (with GH_TOKEN set)

## 📝 Version Numbers

Update version in `package.json` before each release:

```json
"version": "1.0.0"  // Increment this
```

The script will use this version for the GitHub release tag.

## ✅ Requirements

- GitHub Personal Access Token with `repo` permissions
- Node.js and npm installed
- Internet connection
- PowerShell (included with Windows)

**Your build system is ready to automatically manage releases!** 🚀

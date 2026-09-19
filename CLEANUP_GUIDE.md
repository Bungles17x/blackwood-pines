# GitHub Repository Cleanup Guide

## 🧹 Clean Your GitHub Repository

I've created two scripts to clean up your Blackwood Pines repository.

## 📋 Option 1: Delete Releases Only

**Double-click**: `delete-releases.bat`

This will:
- ✅ Delete all GitHub releases
- ✅ Keep git tags intact
- ✅ Quick cleanup

Use this if you just want to remove release artifacts but keep version tags.

## 🧹 Option 2: Complete Cleanup (Recommended)

**Double-click**: `clean-repository.bat`

This will:
- ✅ Delete all GitHub releases
- ✅ Delete all git tags
- ✅ Complete fresh start
- ✅ Fixes "broken releases"

Use this if you have broken releases or want a completely clean slate.

## 🔐 Security

Both scripts:
- Prompt for GitHub token (hidden input)
- Never save token to files
- Only use token during the session

## ⚠️ First-Time Setup

If you see "running scripts is disabled" error:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then run the batch file again.

## 🎯 What Gets Deleted

### **delete-releases.bat**
- GitHub release pages
- Release assets (installers, zips)
- Release notes

### **clean-repository.bat** (More thorough)
- Everything from delete-releases.bat
- Git tags (refs/tags/*)
- Version references
- Complete clean slate

## 🚀 After Cleanup

After cleaning your repository:

1. **Build and publish** a fresh release:
   ```
   Double-click: build-and-publish.bat
   ```

2. **Your repository will have**:
   - Only the latest release
   - Clean version tags
   - No broken artifacts

## 📝 When to Use Each

### **Use delete-releases.bat when:**
- You want to keep version history
- Tags are important for you
- Just cleaning up release artifacts

### **Use clean-repository.bat when:**
- You have broken releases
- Tags are messed up
- Want a complete fresh start
- Starting over with releases

## ✅ Verification

After running either script, check:
```
https://github.com/Bungles17x/blackwood-pines/releases
```

The page should be empty (no releases).

## 🎮 Next Steps

After cleanup:
1. Double-click `build-and-publish.bat`
2. Enter your GitHub token
3. Publish a clean, working release

**Your repository will be clean and ready for fresh releases!** 🧹

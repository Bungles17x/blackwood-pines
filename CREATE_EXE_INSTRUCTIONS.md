# Creating an Executable for Blackwood Pines

## 🎮 How to Create Your EXE File

### **Option 1: Use the Batch File (Easiest)**
1. **Double-click**: `build-exe.bat`
2. **Wait** for the build process (may take 1-2 minutes)
3. **Find your EXE** in the `release` folder: `Blackwood Pines Setup 1.0.0.exe`

### **Option 2: Manual Commands**
If you can use a clean terminal:
```bash
npm run dist-win
```

## 🖥️ How to Run the Game as EXE

### **Option 1: Quick Test (No EXE needed)**
1. **Double-click**: `run-electron.bat`
2. This builds and runs the game in Electron immediately

### **Option 2: After Creating EXE**
1. **Navigate to**: `release` folder
2. **Double-click**: `Blackwood Pines Setup 1.0.0.exe`
3. **Install** the game
4. **Run** from your desktop/start menu

## 📋 What's Included in the EXE

Your executable will include:
- ✅ Complete Blackwood Pines game
- ✅ All new features (mobile controls, save/load, achievements, etc.)
- ✅ Desktop app window (1280x720)
- ✅ Standalone (no browser needed)

## 🔧 If You Have Terminal Issues

Since your terminal is spamming, **use the batch files**:
- `build-exe.bat` - Creates the Windows installer
- `run-electron.bat` - Runs the game directly

**No terminal commands needed!**

## 📁 Output Location

After building, your files will be in:
```
release/
├── Blackwood Pines Setup 1.0.0.exe (Windows installer)
└── [Other installer files]
```

## 🎯 Features in Your EXE

- **Mobile touch controls** (virtual joystick + buttons)
- **Save/load game system** (persistent saves)
- **10 new collectible items** (matches, compass, rope, etc.)
- **Achievement system** (10 achievements)
- **Generator audio fix** (stops on death/escape)
- **Desktop window mode** (better performance)

**Enjoy your Blackwood Pines executable!** 🌲🎮

# Blackwood Pines - 3D Survival Horror Game

A first-person 3D survival horror game set in a dark foggy forest. Evade the stalker, search for generator parts, and escape through the forestry gate.

### Install OR Play on browser for Free!!

## Run Locally

**Prerequisites:** Node.js

### Development Server
For development with hot-reload:
```bash
npm install
npm run dev
```

**To avoid browser extension errors, use the provided script:**
- Double-click `launch-chrome-incognito.bat` to open Chrome in Incognito mode
- Or manually open `http://localhost:3000` in an Incognito/Private window

### Production Server
To test the production build locally:
```bash
npm run build
npm run serve
```
Open your browser to `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deploy to GitHub Pages

This project is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Manual Deployment Setup

1. Push this repository to GitHub
2. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions
3. Push to the `main` branch to trigger automatic deployment

The GitHub Actions workflow will:
- Build the project using `npm run build`
- Deploy the `dist` folder to GitHub Pages
- Provide a live URL for your game

### Play on GitHub Pages

Once deployed, your game will be available at:
```
https://yourusername.github.io/blackwood-pines/
```

## Game Controls

- **WASD / Arrow Keys**: Move
- **Mouse**: Look around
- **Space**: Jump
- **Shift**: Sprint
- **C**: Toggle crouch
- **F**: Toggle flashlight
- **T**: Toggle UV blacklight mode
- **R**: Use battery
- **G**: Throw bottle (distraction)
- **X**: Use magnesium flare
- **M**: Open map
- **E**: Interact / Lean right
- **Q**: Lean left
- **H / Alt**: Hold breath
- **Escape**: Pause menu

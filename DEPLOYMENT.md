# GitHub Pages Deployment Guide

This project is configured for automatic deployment to GitHub Pages.

## Deployment Steps

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**:
   - Go to GitHub and create a new repository
   - Name it something like `blackwood-pines`
   - Make sure it's set to Public

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/blackwood-pines.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to **Settings** > **Pages**
   - Under **Build and deployment**, select **Source** as **GitHub Actions**
   - The workflow will automatically deploy your site

5. **Automatic Deployment**:
   - Every time you push to the `main` branch, the GitHub Actions workflow will:
     - Build the project using `npm run build`
     - Deploy the `dist` folder to GitHub Pages
   - Your site will be available at: `https://YOUR_USERNAME.github.io/blackwood-pines/`

## Local Testing

To test the production build locally:

```bash
npm run build
npm run preview
```

Then open `http://localhost:4173` in your browser.

## Manual Build

To build the project without deploying:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Configuration

- **Vite Config**: The project uses relative paths (`base: './'`) for GitHub Pages compatibility
- **Build Output**: Built files are placed in the `dist` directory
- **GitHub Actions**: The workflow automatically builds and deploys on push to main

## Troubleshooting

If you encounter 404 errors on GitHub Pages:

1. Make sure the repository is **Public**
2. Check that GitHub Pages is enabled in Settings
3. Verify the GitHub Actions workflow completed successfully
4. Wait a few minutes for GitHub to process the deployment

The deployment workflow handles all the build and deployment steps automatically.
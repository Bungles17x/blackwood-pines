# Blackwood Pines - Build and Publish to GitHub
# This script pushes code, deletes old releases, and publishes a new one

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Blackwood Pines - Build and Publish to GitHub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 0: Push code to GitHub
Write-Host "Step 0: Pushing code to GitHub..." -ForegroundColor Yellow
Write-Host ""

git add .
git commit -m "Update auto-update system with in-game notifications" -m "Generated with [Devin](https://devin.ai)" -m "Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>" 2>$null
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Git push failed or nothing to push. Continuing with build..." -ForegroundColor Yellow
} else {
    Write-Host "Code pushed to GitHub successfully!" -ForegroundColor Green
}

Write-Host ""

# Get GitHub token
$token = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Building Blackwood Pines..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Clean release folder
Write-Host "Step 1: Cleaning release folder..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "release") {
    Write-Host "Release folder exists, attempting to clean..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    try {
        Remove-Item -Path "release" -Recurse -Force -ErrorAction Stop
        Write-Host "Release folder cleaned successfully." -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Release folder is locked. Please close any running instances of Blackwood Pines." -ForegroundColor Red
        pause
        exit 1
    }
} else {
    Write-Host "Release folder is already clean." -ForegroundColor Green
}

Write-Host ""

# Step 2: Delete old releases
Write-Host "Step 2: Deleting old GitHub releases..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        Authorization = "token $plainToken"
        Accept = "application/vnd.github.v3+json"
    }

    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/Bungles17x/blackwood-pines/releases" -Headers $headers

    if ($releases.Count -gt 0) {
        Write-Host "Found $($releases.Count) old release(s). Deleting..." -ForegroundColor Yellow

        foreach ($release in $releases) {
            Write-Host "  Deleting release: $($release.name) (ID: $($release.id))" -ForegroundColor Red
            Invoke-RestMethod -Uri "https://api.github.com/repos/Bungles17x/blackwood-pines/releases/$($release.id)" -Method Delete -Headers $headers | Out-Null
        }

        Write-Host "Old releases deleted successfully!" -ForegroundColor Green
    } else {
        Write-Host "No old releases found." -ForegroundColor Green
    }
} catch {
    Write-Host "Error deleting releases: $_" -ForegroundColor Red
    Write-Host "Continuing with build..." -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Build the game
Write-Host "Step 3: Building the game..." -ForegroundColor Yellow
Write-Host ""

$env:GH_TOKEN = $plainToken
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# Step 4: Create executable and publish
Write-Host "Step 4: Creating Windows executable and publishing to GitHub..." -ForegroundColor Yellow
Write-Host ""

npm run dist-win

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "SUCCESS! Game built and published to GitHub" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Check your GitHub Releases page:" -ForegroundColor Cyan
Write-Host "https://github.com/Bungles17x/blackwood-pines/releases" -ForegroundColor Cyan
Write-Host ""
pause

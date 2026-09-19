# Blackwood Pines - Build and Publish to GitHub
# This script deletes old releases and publishes a new one

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Blackwood Pines - Build and Publish to GitHub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Get GitHub token
$token = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Building Blackwood Pines..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Delete old releases
Write-Host "Step 1: Deleting old GitHub releases..." -ForegroundColor Yellow
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

# Step 2: Build the game
Write-Host "Step 2: Building the game..." -ForegroundColor Yellow
Write-Host ""

$env:GH_TOKEN = $plainToken
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# Step 3: Create executable and publish
Write-Host "Step 3: Creating Windows executable and publishing to GitHub..." -ForegroundColor Yellow
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

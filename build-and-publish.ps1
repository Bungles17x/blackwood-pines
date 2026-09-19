# Blackwood Pines - Build and Publish to GitHub
# This script pushes code, deletes old releases, and publishes a new one

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Blackwood Pines - Build and Publish to GitHub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── PIN GATE ──────────────────────────────────────────────────────────────────
$CORRECT_HASH = "e9a460b9dd621295d6929c485cd6c7ab543fa6883b2ccde91482b311c3b2cef6"
$maxAttempts  = 3
$attempt      = 0
$unlocked     = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    $pinInput  = Read-Host "Enter PIN to continue" -AsSecureString
    $pinPlain  = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
                    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pinInput))
    $pinBytes  = [System.Text.Encoding]::UTF8.GetBytes($pinPlain)
    $pinHash   = ([System.Security.Cryptography.SHA256]::Create().ComputeHash($pinBytes) |
                    ForEach-Object { $_.ToString("x2") }) -join ""

    if ($pinHash -eq $CORRECT_HASH) {
        $unlocked = $true
        Write-Host "Access granted." -ForegroundColor Green
        Write-Host ""
        break
    } else {
        $remaining = $maxAttempts - $attempt
        if ($remaining -gt 0) {
            Write-Host "Incorrect PIN. $remaining attempt(s) remaining." -ForegroundColor Red
        }
    }
}

if (-not $unlocked) {
    Write-Host "Access denied. Exiting." -ForegroundColor Red
    Start-Sleep -Seconds 2
    exit 1
}
# ─────────────────────────────────────────────────────────────────────────────

# Step 0: Push code to GitHub
Write-Host "Step 0: Pushing code to GitHub..." -ForegroundColor Yellow
Write-Host ""

# Ensure the remote is pointing to the correct repository
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl -ne "https://github.com/Bungles17x/blackwood-pines.git") {
    Write-Host "Setting remote origin to Bungles17x/blackwood-pines..." -ForegroundColor Yellow
    git remote set-url origin https://github.com/Bungles17x/blackwood-pines.git
}

# Generate a timestamped commit message
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMessage = "Update game build - $timestamp"

git add .
$commitOutput = git commit -m $commitMessage 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Committed: $commitMessage" -ForegroundColor Green
} else {
    Write-Host "Nothing new to commit, pushing existing HEAD..." -ForegroundColor Yellow
}

# Force-push with lease: overwrites remote only if it hasn't changed since our last fetch.
# This avoids non-fast-forward errors from diverged histories.
git push origin main --force-with-lease

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Git push failed. Trying regular force push..." -ForegroundColor Yellow
    git push origin main --force
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Git push failed entirely. Check your credentials." -ForegroundColor Red
        Write-Host "Continuing with build..." -ForegroundColor Yellow
    } else {
        Write-Host "Code pushed to GitHub successfully!" -ForegroundColor Green
    }
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

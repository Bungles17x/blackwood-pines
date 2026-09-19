# Delete All GitHub Releases for Blackwood Pines
# This script deletes all releases (both working and broken) from the repository

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Delete All GitHub Releases" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Get GitHub token
$token = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Fetching releases from GitHub..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        Authorization = "token $plainToken"
        Accept = "application/vnd.github.v3+json"
    }

    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/Bungles17x/blackwood-pines/releases" -Headers $headers

    if ($releases.Count -gt 0) {
        Write-Host "Found $($releases.Count) release(s)." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Deleting all releases..." -ForegroundColor Red
        Write-Host ""

        foreach ($release in $releases) {
            Write-Host "  Deleting: $($release.name) (Tag: $($release.tag_name), ID: $($release.id))" -ForegroundColor Red
            try {
                Invoke-RestMethod -Uri "https://api.github.com/repos/Bungles17x/blackwood-pines/releases/$($release.id)" -Method Delete -Headers $headers | Out-Null
                Write-Host "    ✓ Deleted successfully" -ForegroundColor Green
            } catch {
                Write-Host "    ✗ Failed to delete: $_" -ForegroundColor Red
            }
        }

        Write-Host ""
        Write-Host "All releases deleted successfully!" -ForegroundColor Green
    } else {
        Write-Host "No releases found. Repository is already clean." -ForegroundColor Green
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure your token has 'repo' permissions." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Check your repository:" -ForegroundColor Cyan
Write-Host "https://github.com/Bungles17x/blackwood-pines/releases" -ForegroundColor Cyan
Write-Host ""
pause

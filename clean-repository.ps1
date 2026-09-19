# Clean GitHub Repository - Delete Releases and Tags
# This script deletes all releases AND their associated tags

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Clean GitHub Repository" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will delete:" -ForegroundColor Yellow
Write-Host "  - All GitHub releases" -ForegroundColor Yellow
Write-Host "  - All git tags" -ForegroundColor Yellow
Write-Host ""

# Get GitHub token
$token = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$headers = @{
    Authorization = "token $plainToken"
    Accept = "application/vnd.github.v3+json"
}

# Step 1: Delete all releases
Write-Host ""
Write-Host "Step 1: Deleting all releases..." -ForegroundColor Yellow
Write-Host ""

try {
    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/Bungles17x/blackwood-pines/releases" -Headers $headers

    if ($releases.Count -gt 0) {
        Write-Host "Found $($releases.Count) release(s)." -ForegroundColor Yellow

        foreach ($release in $releases) {
            Write-Host "  Deleting release: $($release.name) (Tag: $($release.tag_name))" -ForegroundColor Red
            try {
                Invoke-RestMethod -Uri "https://api.github.com/repos/Bungles17x/blackwood-pines/releases/$($release.id)" -Method Delete -Headers $headers | Out-Null
                Write-Host "    ✓ Release deleted" -ForegroundColor Green
            } catch {
                Write-Host "    ✗ Failed: $_" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No releases found." -ForegroundColor Green
    }
} catch {
    Write-Host "Error deleting releases: $_" -ForegroundColor Red
}

# Step 2: Delete all tags
Write-Host ""
Write-Host "Step 2: Deleting all tags..." -ForegroundColor Yellow
Write-Host ""

try {
    $tags = Invoke-RestMethod -Uri "https://api.github.com/repos/Bungles17x/blackwood-pines/git/refs/tags" -Headers $headers

    if ($tags.Count -gt 0) {
        Write-Host "Found $($tags.Count) tag(s)." -ForegroundColor Yellow

        foreach ($tag in $tags) {
            $tagName = $tag.ref -replace "refs/tags/", ""
            Write-Host "  Deleting tag: $tagName" -ForegroundColor Red
            try {
                Invoke-RestMethod -Uri "https://api.github.com/repos/Bungles17x/blackwood-pines/git/refs/tags/$tagName" -Method Delete -Headers $headers | Out-Null
                Write-Host "    ✓ Tag deleted" -ForegroundColor Green
            } catch {
                Write-Host "    ✗ Failed: $_" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No tags found." -ForegroundColor Green
    }
} catch {
    Write-Host "Error deleting tags: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "Repository cleaned successfully!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Check your repository:" -ForegroundColor Cyan
Write-Host "https://github.com/Bungles17x/blackwood-pines/releases" -ForegroundColor Cyan
Write-Host ""
pause

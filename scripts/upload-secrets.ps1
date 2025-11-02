# Script to upload all secrets to Cloudflare Workers
# Usage: .\scripts\upload-secrets.ps1

$ErrorActionPreference = "Continue"
$envFile = ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading secrets to Cloudflare Workers..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
        return
    }
    
    if ($line -match '^([^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        $value = $value -replace '^"(.*)"$', '$1'
        $value = $value -replace "^'(.*)'$", '$1'
        
        if ([string]::IsNullOrWhiteSpace($key) -or [string]::IsNullOrWhiteSpace($value)) {
            return
        }
        
        Write-Host "Uploading $key..." -ForegroundColor Yellow
        
        try {
            $value | pnpm wrangler secret put $key 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Success: $key" -ForegroundColor Green
                $script:successCount++
            } else {
                Write-Host "  Failed: $key" -ForegroundColor Red
                $script:failCount++
            }
        } catch {
            Write-Host "  Failed: $key" -ForegroundColor Red
            $script:failCount++
        }
    }
}

Write-Host ""
Write-Host "Upload completed: $successCount succeeded, $failCount failed" -ForegroundColor Cyan

if ($failCount -gt 0) {
    exit 1
}

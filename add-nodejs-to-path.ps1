$nodePath = "C:\Program Files\nodejs"
$npmPath = "C:\Users\l\AppData\Roaming\npm"

Write-Host "Current PATH:" -ForegroundColor Green
$env:Path

# Check if Node.js is already in PATH
if ($env:Path -notlike "*$nodePath*") {
    Write-Host "Adding Node.js to PATH..." -ForegroundColor Yellow
    $env:Path = "$env:Path;$nodePath"
    [Environment]::SetEnvironmentVariable("Path", $env:Path, "User")
    Write-Host "Node.js added to PATH successfully!" -ForegroundColor Green
} else {
    Write-Host "Node.js is already in PATH." -ForegroundColor Green
}

# Check if npm is already in PATH
if ($env:Path -notlike "*$npmPath*") {
    Write-Host "Adding npm global modules to PATH..." -ForegroundColor Yellow
    $env:Path = "$env:Path;$npmPath"
    [Environment]::SetEnvironmentVariable("Path", $env:Path, "User")
    Write-Host "npm global modules added to PATH successfully!" -ForegroundColor Green
} else {
    Write-Host "npm global modules are already in PATH." -ForegroundColor Green
}

Write-Host "Updated PATH:" -ForegroundColor Green
$env:Path

# Test Node.js and npm
Write-Host "Testing Node.js version:" -ForegroundColor Green
try {
    & node --version
    Write-Host "Node.js is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "Error running node: $_" -ForegroundColor Red
}

Write-Host "Testing npm version:" -ForegroundColor Green
try {
    & npm --version
    Write-Host "npm is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "Error running npm: $_" -ForegroundColor Red
}

Write-Host "You may need to close and reopen PowerShell for the PATH changes to take effect."
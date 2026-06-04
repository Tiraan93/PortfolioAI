$nodeDir = "C:\Program Files\nodejs"
$npm = Join-Path $nodeDir "npm.cmd"

if (-not (Test-Path $npm)) {
  Write-Error "Node.js was not found at $nodeDir. Install from https://nodejs.org/ and restart the terminal."
  exit 1
}

$env:PATH = "$nodeDir;$env:PATH"
Set-Location $PSScriptRoot

if (Test-Path ".next") {
  Write-Host "Clearing old build cache..."
  Remove-Item -Recurse -Force ".next"
}

Write-Host "Starting at http://localhost:3003/portfolio"
& $npm run dev

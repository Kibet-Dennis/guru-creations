<#
Normalize asset filenames in the workspace `Assets/` folder.

This script will:
- Replace spaces with hyphens
- Convert names to lowercase
- Remove duplicate dots
- Rename directories and files recursively

Run from the repository root in PowerShell (Windows):

  cd "c:\Users\denni\OneDrive\Desktop\coding space\guru-creations"
  .\scripts\normalize-assets.ps1

It will rename files in-place. Make a backup or commit before running.
#>

$root = Join-Path $PSScriptRoot ".."
$assets = Join-Path $root "Assets"

if (-not (Test-Path $assets)) {
    Write-Host "Assets folder not found at: $assets" -ForegroundColor Red
    exit 1
}

# Helper to normalize a name
function Normalize-Name($name) {
    $n = $name -replace "\s+","-"               # spaces -> hyphen
    $n = $n -replace "[^\w\-.]","-"           # replace unusual chars with hyphen
    $n = $n -replace "[-]{2,}","-"              # collapse multiple hyphens
    $n = $n -replace "\.{2,}","."              # collapse multiple dots
    return $n.ToLower()
}

# 1) Rename directories bottom-up
Get-ChildItem -Path $assets -Recurse -Directory | Sort-Object { $_.FullName.Split('\').Count } -Descending | ForEach-Object {
    $old = $_.FullName
    $parent = Split-Path $old -Parent
    $newName = Normalize-Name $_.Name
    $newPath = Join-Path $parent $newName
    if ($old -ne $newPath) {
        Write-Host "Renaming directory:`n  $old`n -> $newPath`n"
        try { Rename-Item -Path $old -NewName $newName -ErrorAction Stop } catch { Write-Warning $_ }
    }
}

# 2) Rename files
Get-ChildItem -Path $assets -Recurse -File | ForEach-Object {
    $old = $_.FullName
    $parent = Split-Path $old -Parent
    $newName = Normalize-Name $_.Name
    $newPath = Join-Path $parent $newName
    if ($old -ne $newPath) {
        Write-Host "Renaming file:`n  $old`n -> $newPath`n"
        try { Rename-Item -Path $old -NewName $newName -ErrorAction Stop } catch { Write-Warning $_ }
    }
}

Write-Host "Asset normalization complete." -ForegroundColor Green

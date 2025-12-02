# Generates placeholder favicon-32.png (PNG) and favicon.ico (ICO containing that PNG)
# Writes files to frontend/assets/icons/ and root /favicon.ico

$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="

$pngBytes = [Convert]::FromBase64String($pngBase64)
$pngPath = Join-Path -Path $PSScriptRoot -ChildPath "..\frontend\assets\icons\favicon-32.png"
$pngPath = (Resolve-Path $pngPath).ProviderPath

# Ensure directory exists
$dir = Split-Path $pngPath -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

[System.IO.File]::WriteAllBytes($pngPath, $pngBytes)
Write-Output "Wrote PNG: $pngPath"

# Build ICO header (ICONDIR + ICONDIRENTRY) then append PNG bytes.
# ICONDIR: Reserved(2 bytes)=0, Type(2)=1, Count(2)=1
$iconDir = [byte[]](0x00,0x00,0x01,0x00,0x01,0x00)

# ICONDIRENTRY (16 bytes): width(1), height(1), colorCount(1), reserved(1), planes(2), bitCount(2), bytesInRes(4), imageOffset(4)
$width = 32
$height = 32
$colorCount = 0
$reserved = 0
$planes = 1
$bitCount = 32
$bytesInRes = $pngBytes.Length
$imageOffset = 6 + 16 # 22

$entry = New-Object System.Collections.Generic.List[Byte]
$entry.Add([byte]$width)
$entry.Add([byte]$height)
$entry.Add([byte]$colorCount)
$entry.Add([byte]$reserved)
$entry.AddRange([BitConverter]::GetBytes([uint16]$planes))
$entry.AddRange([BitConverter]::GetBytes([uint16]$bitCount))
$entry.AddRange([BitConverter]::GetBytes([uint32]$bytesInRes))
$entry.AddRange([BitConverter]::GetBytes([uint32]$imageOffset))

# Combine
$icoBytes = New-Object System.Collections.Generic.List[Byte]
$icoBytes.AddRange($iconDir)
$icoBytes.AddRange($entry.ToArray())
$icoBytes.AddRange($pngBytes)

$icoPath = Join-Path -Path $PSScriptRoot -ChildPath "..\frontend\assets\icons\favicon.ico"
$icoPath = (Resolve-Path $icoPath -ErrorAction SilentlyContinue)
if (-not $icoPath) { $icoPath = Join-Path -Path $PSScriptRoot -ChildPath "..\frontend\assets\icons\favicon.ico" } else { $icoPath = $icoPath.ProviderPath }

[System.IO.File]::WriteAllBytes($icoPath, $icoBytes.ToArray())
Write-Output "Wrote ICO: $icoPath"

# Also write root favicon.ico for some platforms
$rootIco = Join-Path -Path $PSScriptRoot -ChildPath "..\..\..\favicon.ico"
$rootIco = (Resolve-Path $rootIco -ErrorAction SilentlyContinue)
if (-not $rootIco) { $rootIco = Join-Path -Path $PSScriptRoot -ChildPath "..\..\..\favicon.ico" } else { $rootIco = $rootIco.ProviderPath }
[System.IO.File]::WriteAllBytes($rootIco, $icoBytes.ToArray())
Write-Output "Wrote root ICO: $rootIco"

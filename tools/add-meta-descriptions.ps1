# Adds default meta descriptions to frontend HTML files missing them.
# Inserts a description based on the <title> when possible.

$frontend = Join-Path (Get-Item .).FullName 'frontend'
$files = Get-ChildItem -Path $frontend -Filter *.html -Recurse
$changed = @()
foreach ($f in $files) {
  $path = $f.FullName
  $content = Get-Content -Raw -Path $path

  # Skip if a meta description already exists (handle double or single quotes)
  if ($content.IndexOf('name="description"', [System.StringComparison]::InvariantCultureIgnoreCase) -ne -1 -or $content.IndexOf("name='description'", [System.StringComparison]::InvariantCultureIgnoreCase) -ne -1) {
    continue
  }

  if ($content -match '(?si)<title>\s*(.*?)\s*</title>') {
    $title = $matches[1].Trim()
  } else {
    $title = 'Mkopaji'
  }

  $desc = "$title - Apply online for instant, secure loans via M-Pesa. Fast approvals. MKOPAJI."
  # Use single quotes inside the meta tag and expand $desc
  $meta = "    <meta name='description' content='$desc'>"

  if ($content -match '(?si)(<title>.*?</title>)') {
    $new = $content -replace '(?si)(<title>.*?</title>)', "`$1`n$meta"
  } elseif ($content -match '(?si)(<head[^>]*>)') {
    $new = $content -replace '(?si)(<head[^>]*>)', "`$1`n$meta"
  } else {
    # fallback: prepend to file
    $new = "$meta`n`n$content"
  }

  Set-Content -Path $path -Value $new -Encoding UTF8
  $changed += $path
  Write-Output "Inserted meta description into: $path"
}

Write-Output "Total files updated: $($changed.Count)"

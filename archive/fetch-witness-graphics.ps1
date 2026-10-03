# Fetch the missing the-witness.net graphics/engine-tech posts into raw/witness-pages/.
$ErrorActionPreference = 'Continue'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$pages = Join-Path $here 'raw\witness-pages'
New-Item -ItemType Directory -Force -Path $pages | Out-Null

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
$idx = Get-Content (Join-Path $here 'raw\witness-post-index.json') -Raw | ConvertFrom-Json

# Only graphics / engine-tech cluster
$want = $idx.PSObject.Properties.Name | Where-Object {
  $_ -match 'graphics-tech|hemicube|irradiance|lightmap|lighting|shadow|mipmap|seamless|shader|texturing|color-grading|water|depth-jam|concurrent-world|engine-tech|kriging|island-paint|experiments-in-texturing'
}

Write-Host ("targets: " + $want.Count)
foreach ($k in ($want | Sort-Object)) {
  $url = $idx.$k
  $name = ($url -replace '^https?://the-witness\.net/news/\d{4}/\d{2}/', '') -replace '/$', ''
  $file = Join-Path $pages ($name + '.html')
  if (Test-Path $file) { Write-Host "have  $name"; continue }
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers @{ 'User-Agent' = $ua } -TimeoutSec 45
    Set-Content -Path $file -Value $r.Content -NoNewline -Encoding UTF8
    Write-Host ("ok    {0,-70} {1}" -f $name, $r.Content.Length)
  } catch {
    Write-Host "ERR   $name :: $($_.Exception.Message)"
  }
  Start-Sleep -Milliseconds 250
}
Write-Host 'done'

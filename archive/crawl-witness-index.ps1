# Crawl the-witness.net archive index pages and collect every post URL.
# Saves raw HTML + a JSON index of discovered posts.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$raw  = Join-Path $here 'raw\witness-index'
New-Item -ItemType Directory -Force -Path $raw | Out-Null

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
$base = 'http://the-witness.net/news/'

$targets = @()
# engine tech category, paginated
1..8 | ForEach-Object { $targets += if ($_ -eq 1) { 'category/engine-tech/' } else { "category/engine-tech/page/$_/" } }
# author archive for castano
1..5 | ForEach-Object { $targets += if ($_ -eq 1) { 'author/castano/' } else { "author/castano/page/$_/" } }
# monthly archives around the GI series
foreach ($y in 2010, 2011, 2012) { foreach ($m in 1..12) { $targets += ('{0}/{1:d2}/' -f $y, $m) } }
# the AltDevBlogADay page
$targets += 'altdevblogaday/'

$found = @{}
$i = 0
foreach ($t in $targets) {
  $i++
  $url = $base + $t
  $file = Join-Path $raw (($t -replace '[/]', '_') + '.html')
  if (Test-Path $file) {
    $html = Get-Content $file -Raw
  } else {
    try {
      $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers @{ 'User-Agent' = $ua } -TimeoutSec 40
      if ($r.StatusCode -ne 200) { Write-Host "SKIP $url $($r.StatusCode)"; continue }
      $html = $r.Content
      Set-Content -Path $file -Value $html -NoNewline -Encoding UTF8
    } catch {
      Write-Host "ERR  $url $($_.Exception.Message)"
      continue
    }
  }
  $ms = [regex]::Matches($html, 'https?://the-witness\.net/news/(\d{4})/(\d{2})/([a-z0-9\-]+)/')
  $n = 0
  foreach ($m in $ms) {
    $key = "$($m.Groups[1].Value)-$($m.Groups[2].Value)-$($m.Groups[3].Value)"
    if (-not $found.ContainsKey($key)) { $found[$key] = $m.Value; $n++ }
  }
  Write-Host ("{0,3}/{1} {2} -> new {3} (total {4})" -f $i, $targets.Count, $t, $n, $found.Count)
}

$out = [ordered]@{}
foreach ($k in ($found.Keys | Sort-Object)) { $out[$k] = $found[$k] }
$out | ConvertTo-Json -Depth 3 | Set-Content -Path (Join-Path $here 'raw\witness-post-index.json') -Encoding UTF8
Write-Host "`nTOTAL POSTS: $($found.Count)"
foreach ($k in ($found.Keys | Sort-Object)) { Write-Host $k }

param(
  [string]$BaseUrl = 'http://localhost:3000',
  [string]$Session = 'imports-public-review',
  [string]$OutputDirectory = 'outputs/public-review'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$checks = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'page-check.js')
$resultDirectory = [IO.Path]::GetFullPath((Join-Path $projectRoot $OutputDirectory))
New-Item -ItemType Directory -Path $resultDirectory -Force | Out-Null
$results = [System.Collections.Generic.List[object]]::new()

function Invoke-Browser {
  param([string[]]$BrowserArguments)
  $raw = & npx --yes agent-browser --session $Session --json @BrowserArguments
  if ($LASTEXITCODE -ne 0) { throw "agent-browser failed: $($BrowserArguments -join ' ')`n$raw" }
  $response = ($raw -join "`n") | ConvertFrom-Json
  if (-not $response.success) { throw "Browser command failed: $($response | ConvertTo-Json -Depth 10)" }
  return $response.data
}

try {
  Invoke-Browser -BrowserArguments @('open', "$BaseUrl/contato") | Out-Null
  Invoke-Browser -BrowserArguments @('eval', 'sessionStorage.setItem("imports-tech:intro:v3", "seen")') | Out-Null
  $routes = @('/', '/sobre', '/comunidade', '/contato', '/metricas', '/privacidade', '/termos', '/afiliados')
  $viewports = @(@(1440, 1000), @(1366, 768), @(768, 1024), @(390, 844))
  foreach ($viewport in $viewports) {
    Invoke-Browser -BrowserArguments @('set', 'viewport', [string]$viewport[0], [string]$viewport[1]) | Out-Null
    foreach ($route in $routes) {
      Invoke-Browser -BrowserArguments @('errors', '--clear') | Out-Null
      Invoke-Browser -BrowserArguments @('console', '--clear') | Out-Null
      Invoke-Browser -BrowserArguments @('open', "$BaseUrl$route") | Out-Null
      $raw = $checks | & npx --yes agent-browser --session $Session --json eval --stdin
      if ($LASTEXITCODE -ne 0) { throw "Page checks failed on $route`: $raw" }
      $response = ($raw -join "`n") | ConvertFrom-Json
      if (-not $response.success) { throw "Page checks failed on $route`: $raw" }
      $page = $response.data.result
      $runtime = Invoke-Browser -BrowserArguments @('errors')
      $console = Invoke-Browser -BrowserArguments @('console')
      $record = [pscustomobject]@{ page = $page; runtime = $runtime; console = $console }
      $results.Add($record)
      $results | ConvertTo-Json -Depth 15 | Set-Content -LiteralPath (Join-Path $resultDirectory 'routes.json') -Encoding utf8
      Write-Output "$($page.viewport) $route — $($page.failures.Count) page failures"
    }
  }
} finally {
  Invoke-Browser -BrowserArguments @('close') | Out-Null
}

$failed = @($results | Where-Object { $_.page.failures.Count -gt 0 -or $_.runtime.errors.Count -gt 0 })
if ($failed.Count -gt 0) { throw "$($failed.Count) route checks failed. See $resultDirectory/routes.json" }
Write-Output "Checked $($results.Count) page/viewport combinations. Review console entries in $resultDirectory/routes.json."

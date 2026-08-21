$ports = @(22860, 5000)
foreach ($port in $ports) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -in @("node", "pnpm", "cmd")) {
      Stop-Process -Id $process.Id -Force
      Write-Host "Stopped $($process.ProcessName) on port $port"
    }
  }
}

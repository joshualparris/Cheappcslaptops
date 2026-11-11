#requires -Version 5.1
<#
.SYNOPSIS
    Records one Windows GPU's identification and manually verified resale tests.
.DESCRIPTION
    Read-only hardware discovery. No drivers, benchmarks or stress tests are installed
    or run, and no results are uploaded. Output is written to Documents locally.
    Run after completing the checklist at docs/GPU-SALE-TEST-STATION.md.
.EXAMPLE
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-GpuSaleTest.ps1 -CardId GPU-001
#>
[CmdletBinding()]
param(
    [string]$CardId,
    [string]$OutputDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'GPU-Sale-Tests')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-Check {
    param([string]$Prompt)
    while ($true) {
        $response = (Read-Host "$Prompt [P=Pass, F=Fail, N=Not tested]").Trim().ToUpperInvariant()
        switch ($response) {
            'P' { return 'Pass' }
            'F' { return 'Fail' }
            'N' { return 'Not tested' }
            default { Write-Host 'Enter P, F or N.' -ForegroundColor Yellow }
        }
    }
}

function Protect-CsvText {
    param([AllowNull()][object]$Value)
    $text = [string]$Value
    # Avoid spreadsheet-formula injection when this local CSV is opened in Excel.
    if ($text -match '^\s*[=+@-]') { return "'$text" }
    return $text
}

if ([string]::IsNullOrWhiteSpace($CardId)) {
    $CardId = Read-Host 'Physical card label (e.g. GPU-001)'
}
$CardId = $CardId.Trim().ToUpperInvariant()
if ($CardId -cnotmatch '^GPU-[0-9]{3,5}$') {
    throw 'CardId must look like GPU-001 or GPU-01234. Label the physical card first.'
}

Write-Host ''
Write-Host 'Detected Windows display adapters:' -ForegroundColor Cyan
$gpus = @(Get-CimInstance -ClassName Win32_VideoController | Where-Object { $_.PNPDeviceID -like 'PCI\\VEN_*' })
if ($gpus.Count -eq 0) {
    throw 'No PCI display adapter detected. Inspect Device Manager and install a suitable driver.'
}
for ($index = 0; $index -lt $gpus.Count; $index++) {
    $item = $gpus[$index]
    Write-Host ('  {0}) {1} | Problem code: {2}' -f ($index + 1), $item.Name, $item.ConfigManagerErrorCode)
}
$selectedText = Read-Host 'Number of the physical GPU you are testing'
$selected = 0
if (-not [int]::TryParse($selectedText, [ref]$selected) -or $selected -lt 1 -or $selected -gt $gpus.Count) {
    throw 'Invalid selection; no data was saved.'
}
$gpu = $gpus[$selected - 1]
$deviceCode = $gpu.ConfigManagerErrorCode
$pnpHealthy = ($null -ne $deviceCode -and [int]$deviceCode -eq 0)
$driverReady = ($gpu.Name -notmatch 'Microsoft Basic Display Adapter')

Write-Host ''
Write-Host ('Card label: {0}; Windows: {1}' -f $CardId, $gpu.Name) -ForegroundColor Cyan
Write-Host 'Only enter PASS after personally checking the item. Unknown = N.'
$serial = (Read-Host 'Physical serial number (optional, stays on this PC)').Trim()
$gpuZModel = (Read-Host 'Exact model and VRAM shown in GPU-Z (optional)').Trim()

$visual = Read-Check 'PCB, PCIe contacts, power plugs, fans physically intact'
$gpuz = Read-Check 'GPU-Z correctly identifies model, memory and BIOS'
$graphics = Read-Check '3D load/benchmark completed, no crash or artefacts'
$vram = Read-Check 'VRAM error-detection test completed with ZERO errors'
$fans = Read-Check 'Fans operate normally under load, no abnormal noise'
$outputs = Read-Check 'Applicable video outputs checked with monitor'

$temperatureText = (Read-Host 'Maximum GPU core temperature in degrees C (blank if unknown)').Trim()
$temperature = $null
if ($temperatureText -ne '') {
    $parsed = 0.0
    if (-not [double]::TryParse($temperatureText, [ref]$parsed) -or $parsed -lt 0 -or $parsed -gt 200) {
        throw 'Temperature must be a number between 0 and 200, or blank.'
    }
    $temperature = [Math]::Round($parsed, 1)
}
$notes = (Read-Host 'Faults, test software/version, duration and disclosures (optional)').Trim()

$checks = @($visual, $gpuz, $graphics, $vram, $fans, $outputs)
if ($checks -contains 'Fail') {
    $result = 'FAULT_REPORTED'
} elseif (-not $pnpHealthy -or -not $driverReady) {
    $result = 'REVIEW_DEVICE_OR_DRIVER'
} elseif ($checks -contains 'Not tested' -or $null -eq $temperature) {
    $result = 'INCOMPLETE'
} else {
    $result = 'PASSED_QUICK_SCREEN'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$record = [pscustomobject][ordered]@{
    TimestampLocal = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    CardId = $CardId
    Serial = $serial
    WindowsName = [string]$gpu.Name
    PnpDeviceId = [string]$gpu.PNPDeviceID
    DriverVersion = [string]$gpu.DriverVersion
    PnpProblemCode = $deviceCode
    ExactModelAndVramFromGpuZ = $gpuZModel
    Visual = $visual
    GpuZ = $gpuz
    Graphics3D = $graphics
    Vram = $vram
    Fans = $fans
    VideoOutputs = $outputs
    MaxCoreTempC = $temperature
    Notes = $notes
    Decision = $result
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$jsonPath = Join-Path $OutputDirectory ("{0}-{1}.json" -f $CardId, $stamp)
$csvPath = Join-Path $OutputDirectory 'gpu-sale-register.csv'
$record | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

# Save a human-friendly CSV register. Do not commit real customer/device IDs publicly.
$spreadsheetRow = [pscustomobject][ordered]@{
    TimestampLocal = $record.TimestampLocal
    CardId = $CardId
    Serial = (Protect-CsvText $serial)
    Model = (Protect-CsvText $gpuZModel)
    WindowsName = (Protect-CsvText $gpu.Name)
    DriverVersion = $record.DriverVersion
    PnpProblemCode = $deviceCode
    Visual = $visual
    GpuZ = $gpuz
    Graphics3D = $graphics
    Vram = $vram
    Fans = $fans
    VideoOutputs = $outputs
    MaxCoreTempC = $temperature
    Decision = $result
    Notes = (Protect-CsvText $notes)
}
$spreadsheetRow | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8 -Append

Write-Host ''
Write-Host ('Result: {0}' -f $result) -ForegroundColor Cyan
Write-Host "Saved report: $jsonPath"
Write-Host "Saved register: $csvPath"
if ($result -ne 'PASSED_QUICK_SCREEN') {
    Write-Warning 'NOT ready to advertise as fully tested. Fix/retest or disclose the limitations.'
} else {
    Write-Host 'Quick screen passed. This is not a lifetime guarantee; disclose test duration and results.'
}

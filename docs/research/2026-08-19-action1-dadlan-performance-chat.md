# Chat archive: DadLAN Action1 maximum-performance tuning

**Original discussion:** 19 August 2026  
**Archived:** 25 September 2026  
**Repository:** `joshualparris/Cheappcslaptops`  
**Topic:** Action1 performance tuning for the 10-laptop DadLAN fleet

This file preserves the user-visible conversation that produced the adaptive DadLAN performance-tuning script.

---

## User

> [Message sent at 2026-08-19T05:44:16Z]  
> give me an action1 script to give to all 10 laptops to make them run as fast as possible,

## Assistant

I’d make this a **safe “maximum practical performance” script**, not one that disables Defender, Windows Update, networking, or services the laptops may actually need. It can push power/performance settings, reduce background recording, clean junk, optimise drives appropriately, and report what it changed.

## User

> [Message sent at 2026-08-19T05:45:04Z]  
> but you know the ssd and ram size from our previous conversations, look at those

## Assistant

You’re right — I’ve pulled the fleet details back up. I can tailor this around the actual mix instead of treating them as generic PCs. The big split is **SSDs on #1, #2, #4, #5, #6** and **HDDs on #3, #7, #9, #10**, with #8’s drive needing a fresh detection check; RAM ranges from **16 GB down to 2.5 GB**, so the low-memory machines need different treatment.

## Assistant

Yes. I pulled the fleet details back in, and I’d use **one adaptive PowerShell script** across all 10 rather than maintaining ten separate ones. Action1 currently supports custom PowerShell scripts through **Run Script**, including targeting multiple endpoints/automations.

Your important hardware split is:

- **#1 ProBook x360 435 G8:** 16 GB, NVMe SSD
- **#2 ThinkPad L480:** 8 GB, Samsung 870 EVO SSD
- **#3 Toshiba L850D:** 8 GB, 1 TB HDD
- **#4 HP 4230s:** 8 GB, Samsung 860 EVO SSD
- **#5 Tecra P11:** 8 GB, Toshiba SSD
- **#6 Toshiba L630:** 8 GB, MSI SSD
- **#7 ASUS X553MA:** 8 GB, HDD
- **#8 Toshiba C50D-A:** 8 GB; script will detect its drive
- **#9 Compaq CQ56:** 2.5 GB, HDD — this needs the most aggressive RAM-saving treatment
- **#10 Compaq 610:** HDD; script detects its currently installed RAM rather than assuming it.

### Action1 — `DadLAN Maximum Performance`

Use **PowerShell** as the script language:

```powershell
# ============================================================
# DadLAN - Maximum Practical Performance
# Designed for Josh's 10-laptop DadLAN fleet
# Safe adaptive performance tuning for Windows 10/11
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

Write-Output "========================================"
Write-Output " DadLAN Maximum Performance Optimisation"
Write-Output "========================================"
Write-Output "Computer: $env:COMPUTERNAME"
Write-Output ""

# ------------------------------------------------------------
# 1. Detect hardware
# ------------------------------------------------------------

$ComputerSystem = Get-CimInstance Win32_ComputerSystem
$RAMGB = [math]::Round($ComputerSystem.TotalPhysicalMemory / 1GB, 1)

$OS = Get-CimInstance Win32_OperatingSystem
$SystemDrive = $OS.SystemDrive

$Disk = Get-CimInstance Win32_DiskDrive |
    Where-Object {
        $_.Index -eq (
            Get-CimAssociatedInstance `
                -InputObject (Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$SystemDrive'") `
                -ResultClassName Win32_DiskPartition |
            Select-Object -First 1 -ExpandProperty DiskIndex
        )
    } |
    Select-Object -First 1

Write-Output "RAM: $RAMGB GB"
Write-Output "System drive: $SystemDrive"

if ($Disk) {
    Write-Output "Disk: $($Disk.Model)"
}

# ------------------------------------------------------------
# 2. High Performance power plan
# ------------------------------------------------------------

Write-Output ""
Write-Output "[1] Configuring maximum AC performance..."

# High Performance
powercfg.exe /setactive SCHEME_MIN | Out-Null

# CPU minimum 100% while plugged in
powercfg.exe /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 100

# CPU maximum 100%
powercfg.exe /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMAX 100

# Active CPU cooling
powercfg.exe /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR SYSCOOLPOL 0

# Never power down storage while plugged in
powercfg.exe /setacvalueindex SCHEME_CURRENT SUB_DISK DISKIDLE 0

# Disable PCIe link-state power saving on AC
powercfg.exe /setacvalueindex SCHEME_CURRENT SUB_PCIEXPRESS ASPM 0

powercfg.exe /setactive SCHEME_CURRENT

# ------------------------------------------------------------
# 3. Make sure Windows is allowed to use a page file
# ------------------------------------------------------------

Write-Output "[2] Ensuring automatic page file..."

$cs = Get-CimInstance Win32_ComputerSystem

if (-not $cs.AutomaticManagedPagefile) {
    Set-CimInstance `
        -InputObject $cs `
        -Property @{AutomaticManagedPagefile=$true} | Out-Null
}

# IMPORTANT:
# Do NOT disable pagefile, particularly on CQ56 / low-RAM PCs.

# ------------------------------------------------------------
# 4. Reduce Windows visual overhead for every real user
# ------------------------------------------------------------

Write-Output "[3] Reducing visual effects..."

$UserSIDs = Get-ChildItem Registry::HKEY_USERS |
    Where-Object {
        $_.PSChildName -match '^S-1-5-21-' -and
        $_.PSChildName -notmatch '_Classes$'
    }

foreach ($UserSID in $UserSIDs) {

    $SID = $UserSID.PSChildName

    $VisualEffects =
        "Registry::HKEY_USERS\$SID\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects"

    New-Item $VisualEffects -Force | Out-Null

    New-ItemProperty `
        -Path $VisualEffects `
        -Name VisualFXSetting `
        -Value 2 `
        -PropertyType DWord `
        -Force | Out-Null

    # Disable transparency
    $Personalize =
        "Registry::HKEY_USERS\$SID\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"

    New-Item $Personalize -Force | Out-Null

    New-ItemProperty `
        -Path $Personalize `
        -Name EnableTransparency `
        -Value 0 `
        -PropertyType DWord `
        -Force | Out-Null

    # Disable taskbar animations
    $ExplorerAdvanced =
        "Registry::HKEY_USERS\$SID\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"

    New-Item $ExplorerAdvanced -Force | Out-Null

    New-ItemProperty `
        -Path $ExplorerAdvanced `
        -Name TaskbarAnimations `
        -Value 0 `
        -PropertyType DWord `
        -Force | Out-Null

    # Faster menus
    $Desktop =
        "Registry::HKEY_USERS\$SID\Control Panel\Desktop"

    Set-ItemProperty `
        -Path $Desktop `
        -Name MenuShowDelay `
        -Value "20"
}

# ------------------------------------------------------------
# 5. Disable Xbox background recording / Game DVR
# ------------------------------------------------------------

Write-Output "[4] Disabling background game recording..."

$GameDVRPolicy =
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR"

New-Item $GameDVRPolicy -Force | Out-Null

New-ItemProperty `
    -Path $GameDVRPolicy `
    -Name AllowGameDVR `
    -Value 0 `
    -PropertyType DWord `
    -Force | Out-Null

foreach ($UserSID in $UserSIDs) {

    $SID = $UserSID.PSChildName

    $GameConfig =
        "Registry::HKEY_USERS\$SID\System\GameConfigStore"

    New-Item $GameConfig -Force | Out-Null

    New-ItemProperty `
        -Path $GameConfig `
        -Name GameDVR_Enabled `
        -Value 0 `
        -PropertyType DWord `
        -Force | Out-Null
}

# ------------------------------------------------------------
# 6. Enable Windows Game Mode
# ------------------------------------------------------------

Write-Output "[5] Enabling Game Mode..."

foreach ($UserSID in $UserSIDs) {

    $SID = $UserSID.PSChildName

    $GameBar =
        "Registry::HKEY_USERS\$SID\Software\Microsoft\GameBar"

    New-Item $GameBar -Force | Out-Null

    New-ItemProperty `
        -Path $GameBar `
        -Name AutoGameModeEnabled `
        -Value 1 `
        -PropertyType DWord `
        -Force | Out-Null

    New-ItemProperty `
        -Path $GameBar `
        -Name AllowAutoGameMode `
        -Value 1 `
        -PropertyType DWord `
        -Force | Out-Null
}

# ------------------------------------------------------------
# 7. Stop browsers wasting RAM in background
# ------------------------------------------------------------

Write-Output "[6] Disabling browser background processes..."

$EdgePolicy = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
New-Item $EdgePolicy -Force | Out-Null

New-ItemProperty `
    -Path $EdgePolicy `
    -Name BackgroundModeEnabled `
    -Value 0 `
    -PropertyType DWord `
    -Force | Out-Null

New-ItemProperty `
    -Path $EdgePolicy `
    -Name StartupBoostEnabled `
    -Value 0 `
    -PropertyType DWord `
    -Force | Out-Null

$ChromePolicy = "HKLM:\SOFTWARE\Policies\Google\Chrome"
New-Item $ChromePolicy -Force | Out-Null

New-ItemProperty `
    -Path $ChromePolicy `
    -Name BackgroundModeEnabled `
    -Value 0 `
    -PropertyType DWord `
    -Force | Out-Null

# ------------------------------------------------------------
# 8. Disable consumer suggestions / Windows advertising
# ------------------------------------------------------------

Write-Output "[7] Reducing unnecessary Windows background content..."

$CloudContent =
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent"

New-Item $CloudContent -Force | Out-Null

New-ItemProperty `
    -Path $CloudContent `
    -Name DisableWindowsConsumerFeatures `
    -Value 1 `
    -PropertyType DWord `
    -Force | Out-Null

# Windows 11 Widgets
$Dsh =
    "HKLM:\SOFTWARE\Policies\Microsoft\Dsh"

New-Item $Dsh -Force | Out-Null

New-ItemProperty `
    -Path $Dsh `
    -Name AllowNewsAndInterests `
    -Value 0 `
    -PropertyType DWord `
    -Force | Out-Null

# Windows 10 News & Interests
$Feeds =
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Feeds"

New-Item $Feeds -Force | Out-Null

New-ItemProperty `
    -Path $Feeds `
    -Name EnableFeeds `
    -Value 0 `
    -PropertyType DWord `
    -Force | Out-Null

# ------------------------------------------------------------
# 9. Extra tuning for LOW RAM systems
# ------------------------------------------------------------

if ($RAMGB -le 4) {

    Write-Output ""
    Write-Output "*** LOW RAM MODE ENABLED ($RAMGB GB) ***"

    # CQ56 and any other <=4GB machines receive stronger tuning.

    foreach ($UserSID in $UserSIDs) {

        $SID = $UserSID.PSChildName

        $Content =
            "Registry::HKEY_USERS\$SID\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"

        New-Item $Content -Force | Out-Null

        $Values = @(
            "ContentDeliveryAllowed",
            "OemPreInstalledAppsEnabled",
            "PreInstalledAppsEnabled",
            "PreInstalledAppsEverEnabled",
            "SilentInstalledAppsEnabled",
            "SubscribedContent-338388Enabled",
            "SubscribedContent-338389Enabled",
            "SubscribedContent-353694Enabled",
            "SubscribedContent-353696Enabled",
            "SystemPaneSuggestionsEnabled"
        )

        foreach ($Value in $Values) {

            New-ItemProperty `
                -Path $Content `
                -Name $Value `
                -Value 0 `
                -PropertyType DWord `
                -Force | Out-Null
        }
    }
}

# ------------------------------------------------------------
# 10. Clean temporary files
# ------------------------------------------------------------

Write-Output "[8] Cleaning temporary files..."

$TempLocations = @(
    "$env:SystemRoot\Temp",
    "$env:TEMP"
)

foreach ($Location in $TempLocations) {

    if (Test-Path $Location) {

        Get-ChildItem `
            -Path $Location `
            -Force `
            -Recurse `
            -ErrorAction SilentlyContinue |
        Where-Object {
            $_.LastWriteTime -lt (Get-Date).AddDays(-2)
        } |
        Remove-Item `
            -Force `
            -Recurse `
            -ErrorAction SilentlyContinue
    }
}

# ------------------------------------------------------------
# 11. Optimise the system drive
# Windows chooses appropriate SSD/HDD optimisation with /O
# ------------------------------------------------------------

Write-Output "[9] Optimising system storage..."

$DriveLetter = $SystemDrive.TrimEnd(":")

Start-Process `
    -FilePath "$env:SystemRoot\System32\defrag.exe" `
    -ArgumentList "$DriveLetter`: /O /H" `
    -Wait `
    -NoNewWindow

# ------------------------------------------------------------
# 12. Keep TCP autotuning at Microsoft's normal performance mode
# ------------------------------------------------------------

Write-Output "[10] Checking network performance..."

netsh int tcp set global autotuninglevel=normal | Out-Null

# ------------------------------------------------------------
# 13. Flush stale DNS cache
# ------------------------------------------------------------

ipconfig /flushdns | Out-Null

# ------------------------------------------------------------
# 14. Final report
# ------------------------------------------------------------

Write-Output ""
Write-Output "========================================"
Write-Output " DadLAN optimisation complete"
Write-Output "========================================"
Write-Output "Computer : $env:COMPUTERNAME"
Write-Output "RAM      : $RAMGB GB"

if ($Disk) {
    Write-Output "Disk     : $($Disk.Model)"
}

if ($RAMGB -le 4) {
    Write-Output "Profile  : LOW-RAM performance mode"
}
elseif ($RAMGB -le 8) {
    Write-Output "Profile  : Standard DadLAN performance"
}
else {
    Write-Output "Profile  : High-memory performance"
}

Write-Output ""
Write-Output "Configured:"
Write-Output " - High Performance power plan"
Write-Output " - Maximum AC CPU performance"
Write-Output " - Automatic page file"
Write-Output " - Reduced Windows animations"
Write-Output " - Transparency disabled"
Write-Output " - Game DVR disabled"
Write-Output " - Game Mode enabled"
Write-Output " - Browser background processes disabled"
Write-Output " - Windows suggestions/widgets reduced"
Write-Output " - Temporary files cleaned"
Write-Output " - System drive optimised"
Write-Output ""
Write-Output "REBOOT RECOMMENDED"
Write-Output "========================================"

exit 0
```

### Why I prefer this to a random “debloat Windows” script

It deliberately **doesn't** disable Defender, Windows Update, the Action1 agent, SysMain, memory compression, networking services, audio services, the page file or dozens of supposedly “unnecessary” Windows services. On machines like **#9 with only 2.5 GB RAM and an HDD**, some common internet “performance tweaks” would actually make paging and responsiveness worse.

The storage optimisation is also adaptive: Windows' `defrag /O` requests the appropriate optimisation for the media rather than blindly treating an SSD like an HDD.

I'd create it in **Configuration → Script Library → New Script → PowerShell**, which is the workflow Action1 documents, then run it against the 10 DadLAN endpoints.

**After this, the biggest remaining performance gains are hardware-specific rather than Windows tweaks:** #9 and #10 are where more RAM/SSD work will produce dramatically more benefit than another registry tweak.

## User

> [Message sent at 2026-09-25T10:35:13Z]  
> Push this whole conversation to our most relevant GitHub repo

---

## Archive note

The most relevant accessible repository was identified as **`joshualparris/Cheappcslaptops`**, because it contains the laptop fleet/refurbishment documentation and scripts. This archive was added directly to its `main` branch.

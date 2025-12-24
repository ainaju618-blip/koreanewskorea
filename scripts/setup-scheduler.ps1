# ============================================
# Korea NEWS - Windows Task Scheduler Setup
# Created: 2025-12-24
# Purpose: Register automation tasks in Windows Task Scheduler
# ============================================
# Run this script as Administrator:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-scheduler.ps1
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Korea NEWS - Task Scheduler Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$TaskName = "KoreaNews-FullAutomation"
$TaskDescription = "Korea NEWS Full Automation - Scrape + AI Rewrite + Publish"
$WorkingDir = "d:\cbt\koreanews"
$BatFile = "$WorkingDir\scripts\koreanews-full-automation.bat"

# Schedule times (12 times per day: 09:30 to 20:30)
$ScheduleTimes = @(
    "09:30", "10:30", "11:30", "12:30",
    "13:30", "14:30", "15:30", "16:30",
    "17:30", "18:30", "19:30", "20:30"
)

Write-Host "[Step 1] Checking prerequisites..." -ForegroundColor Yellow

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "[ERROR] Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Running as Administrator" -ForegroundColor Green

# Check if batch file exists
if (-not (Test-Path $BatFile)) {
    Write-Host "[ERROR] Batch file not found: $BatFile" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Batch file found: $BatFile" -ForegroundColor Green

Write-Host ""
Write-Host "[Step 2] Removing existing tasks..." -ForegroundColor Yellow

# Remove existing tasks with same prefix
$existingTasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "$TaskName*" }
if ($existingTasks) {
    foreach ($task in $existingTasks) {
        Write-Host "  Removing: $($task.TaskName)" -ForegroundColor Gray
        Unregister-ScheduledTask -TaskName $task.TaskName -Confirm:$false
    }
    Write-Host "[OK] Existing tasks removed" -ForegroundColor Green
} else {
    Write-Host "[OK] No existing tasks found" -ForegroundColor Green
}

Write-Host ""
Write-Host "[Step 3] Creating scheduled tasks..." -ForegroundColor Yellow

# Create action (run the batch file)
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$BatFile`"" -WorkingDirectory $WorkingDir

# Create principal (run whether user is logged on or not)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

# Task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

# Create tasks for each scheduled time
$createdCount = 0
foreach ($time in $ScheduleTimes) {
    $taskNameWithTime = "$TaskName-$($time.Replace(':', ''))"

    Write-Host "  Creating task for $time... " -NoNewline

    # Create daily trigger at specific time
    $trigger = New-ScheduledTaskTrigger -Daily -At $time

    try {
        # Register the task
        Register-ScheduledTask `
            -TaskName $taskNameWithTime `
            -Description "$TaskDescription (Daily at $time)" `
            -Action $action `
            -Trigger $trigger `
            -Principal $principal `
            -Settings $settings `
            -Force | Out-Null

        Write-Host "[OK]" -ForegroundColor Green
        $createdCount++
    }
    catch {
        Write-Host "[FAILED] $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[Step 4] Verification..." -ForegroundColor Yellow

# Verify tasks were created
$verifyTasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "$TaskName*" }
$verifyCount = ($verifyTasks | Measure-Object).Count

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Created $verifyCount / $($ScheduleTimes.Count) scheduled tasks" -ForegroundColor $(if ($verifyCount -eq $ScheduleTimes.Count) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "Schedule times:" -ForegroundColor White
foreach ($time in $ScheduleTimes) {
    Write-Host "  - $time" -ForegroundColor Gray
}
Write-Host ""
Write-Host "To view tasks:" -ForegroundColor Yellow
Write-Host "  taskschd.msc" -ForegroundColor White
Write-Host "  or: Get-ScheduledTask | Where-Object { `$_.TaskName -like 'KoreaNews*' }" -ForegroundColor White
Write-Host ""
Write-Host "To run manually:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName '$TaskName-0930'" -ForegroundColor White
Write-Host ""
Write-Host "To remove all tasks:" -ForegroundColor Yellow
Write-Host "  scripts\remove-scheduler.ps1" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Tasks will only run when 'full_automation_enabled' is TRUE in Admin UI!" -ForegroundColor Yellow
Write-Host ""

# ============================================
# Korea NEWS - Remove Scheduled Tasks
# Created: 2025-12-24
# Purpose: Unregister automation tasks from Windows Task Scheduler
# ============================================
# Run this script as Administrator:
#   powershell -ExecutionPolicy Bypass -File scripts\remove-scheduler.ps1
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Korea NEWS - Remove Scheduled Tasks" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$TaskNamePrefix = "KoreaNews-FullAutomation"

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "[ERROR] Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Running as Administrator" -ForegroundColor Green
Write-Host ""

# Find existing tasks
Write-Host "Finding Korea NEWS scheduled tasks..." -ForegroundColor Yellow
$tasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "$TaskNamePrefix*" }
$taskCount = ($tasks | Measure-Object).Count

if ($taskCount -eq 0) {
    Write-Host "[INFO] No Korea NEWS scheduled tasks found" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "Found $taskCount task(s):" -ForegroundColor White
foreach ($task in $tasks) {
    Write-Host "  - $($task.TaskName)" -ForegroundColor Gray
}
Write-Host ""

# Confirm removal
$confirm = Read-Host "Remove all $taskCount tasks? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "[CANCELLED] No tasks were removed" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Removing tasks..." -ForegroundColor Yellow

$removedCount = 0
foreach ($task in $tasks) {
    Write-Host "  Removing: $($task.TaskName)... " -NoNewline
    try {
        Unregister-ScheduledTask -TaskName $task.TaskName -Confirm:$false
        Write-Host "[OK]" -ForegroundColor Green
        $removedCount++
    }
    catch {
        Write-Host "[FAILED] $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Removal Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Removed $removedCount / $taskCount task(s)" -ForegroundColor $(if ($removedCount -eq $taskCount) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "To re-create tasks, run:" -ForegroundColor Yellow
Write-Host "  scripts\setup-scheduler.ps1" -ForegroundColor White
Write-Host ""

# Ollama Auto-Restart Monitor Script
# Usage: Run as Administrator or via Task Scheduler
# Location: scripts/ollama-monitor.ps1

$OllamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
$LogFile = "C:\Users\user\ollama-monitor.log"
$CheckInterval = 10  # seconds

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage -ErrorAction SilentlyContinue
}

function Test-OllamaRunning {
    $process = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
    return $null -ne $process
}

function Test-OllamaResponding {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-OllamaService {
    Write-Log "Starting Ollama service..."

    # Kill any zombie processes first
    Get-Process -Name "ollama*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    # Start Ollama serve
    Start-Process -FilePath $OllamaPath -ArgumentList "serve" -WindowStyle Hidden

    # Wait for it to be ready
    $maxWait = 30
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        if (Test-OllamaResponding) {
            Write-Log "Ollama started successfully after $waited seconds"
            return $true
        }
    }

    Write-Log "ERROR: Ollama failed to start within $maxWait seconds"
    return $false
}

# Main monitoring loop
Write-Log "=========================================="
Write-Log "Ollama Monitor Started"
Write-Log "Checking every $CheckInterval seconds"
Write-Log "=========================================="

while ($true) {
    $isRunning = Test-OllamaRunning
    $isResponding = Test-OllamaResponding

    if (-not $isRunning) {
        Write-Log "WARNING: Ollama process not found - restarting..."
        Start-OllamaService
    }
    elseif (-not $isResponding) {
        Write-Log "WARNING: Ollama not responding - restarting..."
        Start-OllamaService
    }

    Start-Sleep -Seconds $CheckInterval
}

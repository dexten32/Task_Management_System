param (
    [string]$TestName = "All"
)

$resultsFile = "performance_results.log"
$tests = @(
    [pscustomobject]@{ Name = "Load Test"; Script = "load_test.js" },
    [pscustomobject]@{ Name = "Stress Test"; Script = "stress_test.js" },
    [pscustomobject]@{ Name = "Spike Test"; Script = "spike_test.js" },
    [pscustomobject]@{ Name = "Soak Test"; Script = "soak_test.js" }
)

function Run-Test($test) {
    if (-not $test) { return }
    $name = $test.Name
    $script = $test.Script
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $date = Get-Date -Format 'yyyy-MM-dd'
    
    Write-Host "`n>>> Starting $name at $timestamp using $script`n" -ForegroundColor Cyan
    
    $tempFile = [System.IO.Path]::GetTempFileName()
    
    # Run k6. Using '--no-color' to avoid ANSI codes in captured output.
    # Redirecting 2>&1 to capture errors, but we will filter them in the summary.
    k6 run --no-color $script 2>&1 | Tee-Object -FilePath $tempFile
    
    $fullOutput = Get-Content $tempFile -Raw
    
    $summaryPart = ""
    # Extract from metric keywords
    if ($fullOutput -match "(?s)(checks\._total.*|data_received.*|http_req_duration.*|checks\.\.\..*)") {
        $summaryPart = $matches[0]
    }
    else {
        $summaryPart = $fullOutput 
    }

    # Clean up line by line
    $summaryLines = $summaryPart -split "\r?\n"
    $cleanLines = @()
    foreach ($line in $summaryLines) {
        $l = $line.Trim()
        # Skip noise and status lines
        if ($l -match "^running \(.*\)" -or $l -match "^default\s+\[.*\]" -or $l -match "k6 : time=" -or $l -match "At .*:line") {
            continue
        }
        # Skip PowerShell error track noise
        if ($l -match "^\+ CategoryInfo" -or $l -match "^\+ FullyQualifiedErrorId" -or $l -match "^\+ ~~~") {
            continue
        }
        # Strip common k6 decorative characters that might survive --no-color
        $safeLine = $line -replace "[^\x20-\x7E]", "" 
        $cleanLines += $safeLine.TrimEnd()
    }
    
    $finalSummary = ($cleanLines -join "`n").Trim()

    Add-Content -Path $resultsFile -Value "`n================================================"
    Add-Content -Path $resultsFile -Value "TEST NAME: $name"
    Add-Content -Path $resultsFile -Value "DATE: $date"
    Add-Content -Path $resultsFile -Value "TIME: $timestamp"
    Add-Content -Path $resultsFile -Value "================================================"
    Add-Content -Path $resultsFile -Value $finalSummary
    Add-Content -Path $resultsFile -Value "`n"
    
    Remove-Item $tempFile
    Write-Host "`n>>> $name finished. Results appended to $resultsFile.`n" -ForegroundColor Green
}

if ($TestName -eq "All") {
    foreach ($test in $tests) {
        Run-Test $test
    }
}
else {
    $selectedTest = $tests | Where-Object { $_.Name -match $TestName }
    if ($selectedTest) {
        if ($selectedTest -is [array]) {
            Run-Test $selectedTest[0]
        }
        else {
            Run-Test $selectedTest
        }
    }
    else {
        Write-Error "Test '$TestName' not found. Available tests: Load, Stress, Spike, Soak"
    }
}

$pathDirs = $env:PATH -split ';'
$output = "--- Full PATH Environment Variable ---\n"
$output += $env:PATH + "\n\n"
$output += "--- Checking Directories for node.exe or npm ---\n"

foreach ($dir in $pathDirs) {
    if (Test-Path $dir) {
        $nodePath = Join-Path $dir "node.exe"
        $npmPath = Join-Path $dir "npm.cmd"
        $nodeExists = Test-Path $nodePath
        $npmExists = Test-Path $npmPath
        
        $output += "$dir : "
        if ($nodeExists -or $npmExists) {
            $output += "FOUND (node: $nodeExists, npm: $npmExists)\n"
        } else {
            $output += "NOT FOUND\n"
        }
    } else {
        $output += "$dir : DIRECTORY NOT FOUND\n"
    }
}

Set-Content -Path "c:\Users\loges\OneDrive\Desktop\Tally\Tally_accounting\backend\ops\path_check_results.txt" -Value $output
Write-Output "Path check complete."

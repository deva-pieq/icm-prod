param (
    [Parameter(Mandatory = $true)]
    [string[]]$Paths
)

Add-Type -AssemblyName Microsoft.VisualBasic
$ErrorActionPreference = 'Stop'

foreach ($raw in $Paths) {
    $resolved = Resolve-Path -LiteralPath $raw -ErrorAction SilentlyContinue
    if (-not $resolved) {
        Write-Warning "Path not found (skipped): $raw"
        continue
    }

    foreach ($r in $resolved) {
        $full = $r.Path
        if (-not (Test-Path -LiteralPath $full)) {
            Write-Warning "Path not found (skipped): $full"
            continue
        }

        try {
            if (Test-Path -LiteralPath $full -PathType Container) {
                [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory(
                    $full,
                    [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,
                    [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)
            } else {
                [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(
                    $full,
                    [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,
                    [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)
            }
            Write-Output "Recycled: $full"
        } catch {
            Write-Warning "Failed to recycle $full : $($_.Exception.Message)"
        }
    }
}

Write-Output "Done. All items moved to Recycle Bin (if found)."
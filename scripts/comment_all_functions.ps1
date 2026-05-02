function Split-Name([string]$name) {
    return (($name -replace '([a-z0-9])([A-Z])', '$1 $2') -replace '_', ' ').Trim().ToLower()
}

function Build-Comment([string]$name) {
    $words = Split-Name $name
    if ($name -match '^get') { return "Gets $words." }
    if ($name -match '^set') { return "Sets $words." }
    if ($name -match '^update') { return "Updates $words." }
    if ($name -match '^render') { return "Renders $words." }
    if ($name -match '^build') { return "Builds $words." }
    if ($name -match '^handle') { return "Handles $words." }
    if ($name -match '^initialize') { return "Initializes $words." }
    if ($name -match '^normalize') { return "Normalizes $words." }
    if ($name -match '^close') { return "Closes $words." }
    if ($name -match '^open') { return "Opens $words." }
    if ($name -match '^add') { return "Adds $words." }
    if ($name -match '^delete') { return "Deletes $words." }
    if ($name -match '^save') { return "Saves $words." }
    if ($name -match '^move') { return "Moves $words." }
    if ($name -match '^allow') { return "Allows $words." }
    if ($name -match '^drop') { return "Handles $words." }
    if ($name -match '^toggle') { return "Toggles $words." }
    if ($name -match '^clear') { return "Clears $words." }
    if ($name -match '^attach') { return "Attaches $words." }
    if ($name -match '^populate') { return "Populates $words." }
    if ($name -match '^bind') { return "Binds $words." }
    if ($name -match '^map') { return "Maps $words." }
    if ($name -match '^resolve') { return "Resolves $words." }
    return "Handles $words."
}

$files = @(
    'scripts/boards.js',
    'scripts/boards-form.js',
    'scripts/boards-subtasks.js',
    'scripts/boards-dnd.js',
    'scripts/boards-template.js'
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) { continue }
    $lines = Get-Content $file
    $out = New-Object System.Collections.Generic.List[string]

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match '^function\s+([A-Za-z0-9_]+)\s*\(') {
            $name = $Matches[1]
            $prev = ''
            for ($k = $out.Count - 1; $k -ge 0; $k--) {
                if (($out[$k]).Trim() -ne '') {
                    $prev = ($out[$k]).Trim()
                    break
                }
            }

            if (-not $prev.StartsWith('//')) {
                $out.Add('// ' + (Build-Comment $name))
            }
        }
        $out.Add($line)
    }

    Set-Content $file -Value $out -Encoding UTF8
    Write-Host "Commented: $file"
}

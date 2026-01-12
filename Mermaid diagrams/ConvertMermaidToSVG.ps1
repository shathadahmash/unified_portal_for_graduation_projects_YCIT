# =========================================
# Mermaid Batch Converter Script (PowerShell)
# Converts all .mmd files to SVG
# Supports sequence, flowchart, class, state, etc.
# =========================================

# Path to the folder containing .mmd files
$sourceFolder = "E:\Unified_portal_ForGraduationProjects_InYemeni_Universities\Mermaid diagram"

# Output folder
$outputFolder = Join-Path $sourceFolder "SVG_output"

# Create output folder if it doesn't exist
if (!(Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder
}

# Set Mermaid theme (default, forest, dark)
$theme = "forest"

# Set width and height (optional)
$width = 800
$height = 600

# Loop through each .mmd file in the folder
Get-ChildItem -Path $sourceFolder -Filter "*.mmd" | ForEach-Object {
    $inputFile = $_.FullName
    $outputFile = Join-Path $outputFolder ($_.BaseName + ".svg")

    Write-Host "Converting $($_.Name) to SVG..."

    # Run Mermaid CLI
    mmdc -i $inputFile -o $outputFile -t $theme -w $width -H $height

    Write-Host "Saved SVG: $outputFile`n"
}

Write-Host "All .mmd files have been converted!" how to run this 
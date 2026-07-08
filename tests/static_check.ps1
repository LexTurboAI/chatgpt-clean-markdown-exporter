$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "..\ChatGPT-Clean-Markdown-Exporter.user.js"
$text = Get-Content $scriptPath -Raw

$required = @(
    "@name         ChatGPT Clean Markdown Exporter",
    "@version      0.1.0",
    "@match        https://chatgpt.com/*",
    "@match        https://chat.openai.com/*",
    "GM_registerMenuCommand",
    "[IMAGE REMOVED: user-upload]",
    "[IMAGE REMOVED: generated-image]"
)

foreach ($item in $required) {
    if ($text -notlike "*$item*") {
        throw "Missing expected marker: $item"
    }
}

$forbidden = @(
    "@require",
    "html2canvas",
    "JSZip",
    "data:image/",
    "readAsDataURL",
    "sediment://"
)

foreach ($item in $forbidden) {
    if ($text -like "*$item*") {
        throw "Forbidden marker found: $item"
    }
}

Write-Host "Static check passed." -ForegroundColor Green

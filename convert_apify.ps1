
$raw = Get-Content 'e:\WEB\apify_sample.json' -Raw | ConvertFrom-Json
$items = $raw.value
Write-Host "Total raw items: $($items.Count)"

$processed = @()

foreach ($it in $items) {
    if (-not $it.text -or $it.text.Trim().Length -lt 10) { continue }

    # Extract images
    $images = @()
    if ($it.media) {
        foreach ($m in $it.media) {
            $imgUri = $null
            if ($m.image -and $m.image.uri) { $imgUri = $m.image.uri }
            elseif ($m.thumbnail) { $imgUri = $m.thumbnail }
            if ($imgUri -and (-not ($images -contains $imgUri))) {
                $images += $imgUri
            }
        }
    }
    if ($images.Count -eq 0) {
        $images += 'dalat-sample.png'
    }

    $processed += [PSCustomObject]@{
        postId = $it.postId
        text = $it.text
        time = $it.time
        url = $it.url
        likes = $it.likes
        images = $images
    }
}

Write-Host "Processed valid rental posts: $($processed.Count)"
$outJs = "/** Auto-generated from Apify Dataset **/`nconst APIFY_INITIAL_POSTS = " + ($processed | ConvertTo-Json -Depth 6) + ";"
[System.IO.File]::WriteAllText('e:\WEB\apify-data.js', $outJs, [System.Text.Encoding]::UTF8)
Write-Host "Written e:\WEB\apify-data.js successfully!"

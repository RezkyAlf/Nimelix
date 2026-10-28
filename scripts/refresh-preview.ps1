$ErrorActionPreference = 'Stop'
$entries = @(
 @('naruto',20), @('naruto-shippuden',1735), @('bleach',269),
 @('death-note',1535), @('fullmetal-alchemist-brotherhood',5114), @('hunter-x-hunter',11061),
 @('my-hero-academia',31964), @('one-punch-man',30276), @('mob-psycho-100',32182),
 @('haikyuu',20583), @('blue-lock',49596), @('vinland-saga',37521),
 @('dr-stone',38691), @('tokyo-ghoul',22319), @('tokyo-revengers',42249),
 @('black-clover',34572), @('mashle',52211), @('dandadan',57334),
 @('kaiju-no-8',52588), @('bocchi-the-rock',47917), @('your-lie-in-april',23273),
 @('violet-evergarden',33352), @('a-silent-voice',28851), @('your-name',32281)
)
$results = @()
foreach ($entry in $entries) {
 $slug = $entry[0]
 $pageUrl = 'https://myanimelist.net/anime/' + $entry[1]
 try {
  $html = (Invoke-WebRequest $pageUrl -TimeoutSec 20).Content
  $imageMatch = [regex]::Match($html, 'property="og:image"\s+content="([^"]+)"')
  $titleMatch = [regex]::Match($html, 'property="og:title"\s+content="([^"]+)"')
  if (!$imageMatch.Success -or !$titleMatch.Success) { throw 'Metadata poster/judul tidak ditemukan' }
  $imageUrl = [System.Net.WebUtility]::HtmlDecode($imageMatch.Groups[1].Value)
  $title = [System.Net.WebUtility]::HtmlDecode($titleMatch.Groups[1].Value)
  Invoke-WebRequest $imageUrl -OutFile ('public/images/posters/' + $slug + '.jpg') -TimeoutSec 20
  $genres = @([regex]::Matches($html, '<span itemprop="genre"[^>]*>([^<]+)</span>') | ForEach-Object { [System.Net.WebUtility]::HtmlDecode($_.Groups[1].Value) } | Select-Object -Unique)
  $results += [ordered]@{ id=$slug; source='preview'; title=$title; poster=('/images/posters/'+$slug+'.jpg'); genres=$genres; referenceUrl=$pageUrl; imageSource=$imageUrl }
  Write-Output ($slug + ' OK')
 } catch { Write-Output ($slug + ' FAILED: ' + $_.Exception.Message) }
}
if ($results.Count -eq 0) { throw 'Tidak ada anime yang berhasil diunduh' }
$json = ConvertTo-Json -InputObject @($results) -Depth 5
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'src/lib/preview-extra.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ('Total tambahan: ' + $results.Count)

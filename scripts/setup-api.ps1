$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root '.env.local'
$text = if (Test-Path -LiteralPath $file) { [IO.File]::ReadAllText($file) } else { '' }
$text = [regex]::Replace($text, '(?m)^ANIME_API_BASE_URL=[^\r\n]*\r?\n?', '')
if ($text -notmatch '(?m)^ALLOWED_STREAM_HOSTS=') { $text += "ALLOWED_STREAM_HOSTS=vsys-srv.berkasdrive.com,vsys-meledak.dlgan.my.id,www.blogger.com,filedon.co,odvidhide.com,video.sumantritelnologi.workers.dev`n" }
[IO.File]::WriteAllText($file, $text)
Write-Output 'Scraper AnimeBatch siap. Restart website setelah perubahan environment.'

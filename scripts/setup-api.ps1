$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root '.env.local'
$text = if (Test-Path -LiteralPath $file) { [IO.File]::ReadAllText($file) } else { '' }
$value = 'ANIME_API_BASE_URL=https://api.otakudesu.natee.my.id/api/v1/anime'
if ($text -match '(?m)^ANIME_API_BASE_URL=') { $text = [regex]::Replace($text, '(?m)^ANIME_API_BASE_URL=[^\r\n]*', $value) } else { $text += "`n$value`n" }
if ($text -notmatch '(?m)^ALLOWED_STREAM_HOSTS=') { $text += "ALLOWED_STREAM_HOSTS=www.blogger.com,odvidhide.com,mega.nz,pixeldrain.com`n" }
[IO.File]::WriteAllText($file, $text)
Write-Output 'otakudesu-be publik dikonfigurasi. Restart website setelah perubahan environment.'

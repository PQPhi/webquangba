$ErrorActionPreference = 'Stop'

$base = 'http://localhost:5118/api'
$outFile = 'd:\Git\webquangba\scripts\verify_external_api_result.json'

try {
  $email = "copilot.test.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@mail.local"
  $password = 'Admin@123'

  $registerBody = @{ email = $email; matKhau = $password } | ConvertTo-Json
  try {
    $register = Invoke-RestMethod -Uri "$base/Auth/register" -Method Post -ContentType 'application/json' -Body $registerBody
  } catch {
    $register = [pscustomobject]@{
      success = $false
      message = $_.Exception.Message
    }
  }

  $loginBody = @{ email = $email; matKhau = $password } | ConvertTo-Json
  $login = Invoke-RestMethod -Uri "$base/Auth/login" -Method Post -ContentType 'application/json' -Body $loginBody

  if (-not $login.token) {
    throw 'Khong nhan duoc token tu API login.'
  }

  $headers = @{ Authorization = "Bearer $($login.token)" }

  $title = "Bai viet test $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
  $createBody = @{
    tieuDe = $title
    noiDung = 'Noi dung ban dau'
    danhMucId = 1
    trangThai = 'Draft'
  } | ConvertTo-Json

  Invoke-RestMethod -Uri "$base/BaiViet" -Method Post -Headers $headers -ContentType 'application/json' -Body $createBody | Out-Null

  $list = Invoke-RestMethod -Uri "$base/BaiViet" -Method Get -Headers $headers
  $created = $list | Where-Object { $_.tieuDe -eq $title } | Select-Object -First 1

  if ($null -eq $created) {
    throw 'Khong tim thay bai vua tao trong danh sach BaiViet.'
  }

  $updatedTitle = "$title - edited"
  $updateBody = @{
    id = $created.id
    tieuDe = $updatedTitle
    noiDung = 'Noi dung da sua'
    danhMucId = 1
    tacGiaId = $created.tacGiaId
    trangThai = 'Published'
  } | ConvertTo-Json

  Invoke-RestMethod -Uri "$base/BaiViet/$($created.id)" -Method Put -Headers $headers -ContentType 'application/json' -Body $updateBody | Out-Null

  $detail = Invoke-RestMethod -Uri "$base/BaiViet/$($created.id)" -Method Get -Headers $headers

  $result = [pscustomobject]@{
    ok = $true
    email = $email
    registerSuccess = $register.success
    loginSuccess = $login.success
    createdId = $created.id
    createdTitle = $title
    updatedTitle = $detail.tieuDe
    updatedContent = $detail.noiDung
    updatedStatus = $detail.trangThai
    verifiedAtUtc = [DateTime]::UtcNow.ToString('o')
  }

  $result | ConvertTo-Json -Depth 5 | Out-File -FilePath $outFile -Encoding utf8
  Write-Output "RESULT_FILE=$outFile"
} catch {
  $errorResult = [pscustomobject]@{
    ok = $false
    error = $_.Exception.Message
    verifiedAtUtc = [DateTime]::UtcNow.ToString('o')
  }
  $errorResult | ConvertTo-Json -Depth 5 | Out-File -FilePath $outFile -Encoding utf8
  Write-Output "RESULT_FILE=$outFile"
  exit 1
}

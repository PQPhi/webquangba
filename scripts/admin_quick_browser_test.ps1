$ErrorActionPreference = 'Stop'

$base = 'http://localhost:5118/api'
$out = 'd:\Git\webquangba\scripts\admin_browser_quick_test.json'

$loginByPassword = $null
$loginByMatKhau = $null

try {
  $loginByPassword = Invoke-RestMethod -Uri "$base/Auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"admin@tanthuanadong.gov.vn","password":"Admin@123"}'
} catch {
  $loginByPassword = [pscustomobject]@{
    success = $false
    message = $_.Exception.Message
  }
}

try {
  $loginByMatKhau = Invoke-RestMethod -Uri "$base/Auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"admin@tanthuanadong.gov.vn","matKhau":"Admin@123"}'
} catch {
  $loginByMatKhau = [pscustomobject]@{
    success = $false
    message = $_.Exception.Message
  }
}

$token = if ($loginByPassword.token) { $loginByPassword.token } else { $loginByMatKhau.token }
if (-not $token) {
  throw 'Khong lay duoc token login tu ca password va matKhau'
}

$headers = @{ Authorization = "Bearer $token" }
$title = "UI quick test $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"

$createBody = @{
  tieuDe = $title
  noiDung = 'Noi dung tao tu quick test'
  danhMucId = 1
  trangThai = 'Draft'
} | ConvertTo-Json

Invoke-RestMethod -Uri "$base/BaiViet" -Method Post -Headers $headers -ContentType 'application/json' -Body $createBody | Out-Null

$list = Invoke-RestMethod -Uri "$base/BaiViet" -Method Get -Headers $headers
$created = $list | Where-Object { $_.tieuDe -eq $title } | Select-Object -First 1
if ($null -eq $created) {
  throw 'Tao bai viet xong nhung khong tim thay trong danh sach'
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
  loginPasswordSuccess = $loginByPassword.success
  loginMatKhauSuccess = $loginByMatKhau.success
  createdId = $created.id
  createdTitle = $title
  updatedTitle = $detail.tieuDe
  updatedContent = $detail.noiDung
  updatedStatus = $detail.trangThai
  checkedAt = (Get-Date).ToString('s')
}

$result | ConvertTo-Json -Depth 5 | Out-File -FilePath $out
Write-Output $out

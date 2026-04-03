$ErrorActionPreference = 'Continue'

Write-Output "Test 1: Login with 'password' field"
try {
  $resp1 = Invoke-RestMethod -Uri 'http://localhost:5118/api/Auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"admin@tanthuanadong.gov.vn","password":"Admin@123"}'
  Write-Output "SUCCESS:"
  $resp1 | ConvertTo-Json -Depth 5 | Write-Output
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
  Write-Output "Details: $($_.ErrorDetails.Message)"
}

Write-Output ""
Write-Output "Test 2: Login with 'matKhau' field"
try {
  $resp2 = Invoke-RestMethod -Uri 'http://localhost:5118/api/Auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"admin@tanthuanadong.gov.vn","matKhau":"Admin@123"}'
  Write-Output "SUCCESS:"
  $resp2 | ConvertTo-Json -Depth 5 | Write-Output
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
  Write-Output "Details: $($_.ErrorDetails.Message)"
}

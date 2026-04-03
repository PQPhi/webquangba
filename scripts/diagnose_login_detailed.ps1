$ErrorActionPreference = 'Stop'

Write-Output "=== Testing Backend 5118 Login Endpoint ==="
Write-Output ""

$uri = 'http://localhost:5118/api/Auth/login'
$email = 'admin@tanthuanadong.gov.vn'
$password = 'Admin@123'

# Test 1: Check endpoint responds
Write-Output "1. Testing endpoint connectivity..."
try {
  $test = Invoke-WebRequest -Uri $uri -Method Options -UseBasicParsing -TimeoutSec 5
  Write-Output "   ✓ Endpoint responds"
} catch {
  Write-Output "   ✗ Endpoint unreachable: $($_.Exception.Message)"
  exit 1
}

# Test 2: Try with password field
Write-Output ""
Write-Output "2. Trying with 'password' field..."
$body1 = @{
  email = $email
  password = $password
} | ConvertTo-Json

Write-Output "   Body: $body1"
try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json' -Body $body1 -UseBasicParsing
  Write-Output "   ✓ SUCCESS: $resp"
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  Write-Output "   ✗ Error $statusCode"
  try {
    $err = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($err)
    $errBody = $reader.ReadToEnd()
    Write-Output "   Error body: $errBody"
    $reader.Dispose()
  } catch {}
}

# Test 3: Try with matKhau field
Write-Output ""
Write-Output "3. Trying with 'matKhau' field..."
$body2 = @{
  email = $email
  matKhau = $password
} | ConvertTo-Json

Write-Output "   Body: $body2"
try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json' -Body $body2 -UseBasicParsing
  Write-Output "   ✓ SUCCESS: $resp"
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  Write-Output "   ✗ Error $statusCode"
  try {
    $err = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($err)
    $errBody = $reader.ReadToEnd()
    Write-Output "   Error body: $errBody"
    $reader.Dispose()
  } catch {}
}

# Test 4: Try with both fields
Write-Output ""
Write-Output "4. Trying with both 'password' and 'matKhau' fields..."
$body3 = @{
  email = $email
  password = $password
  matKhau = $password
} | ConvertTo-Json

Write-Output "   Body: $body3"
try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json' -Body $body3 -UseBasicParsing
  Write-Output "   ✓ SUCCESS: $resp"
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  Write-Output "   ✗ Error $statusCode"
  try {
    $err = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($err)
    $errBody = $reader.ReadToEnd()
    Write-Output "   Error body: $errBody"
    $reader.Dispose()
  } catch {}
}

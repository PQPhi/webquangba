$base = 'http://localhost:5118/api'

$resp = $null
try {
  $resp = Invoke-WebRequest -Uri "$base/Auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"admin@tanthuanadong.gov.vn","matKhau":"Admin@123"}' -UseBasicParsing
  Write-Output "HTTP Status: $($resp.StatusCode)"
  Write-Output "Response:"
  Write-Output $resp.Content
} catch {
  Write-Output "HTTP Status: $($_.Exception.Response.StatusCode)"
  Write-Output "Error Response:"
  $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  $streamReader.BaseStream.Position = 0
  $errorBody = $streamReader.ReadToEnd()
  Write-Output $errorBody
  $streamReader.Close()
}

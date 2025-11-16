# Step 1: Authenticate and get JWT token
$loginBody = @{
    email = "sonicprime1963@gmail.com"
    password = "Khoinguyen0504@"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3010/auth/login" `
    -Method Post `
    -Body $loginBody `
    -ContentType "application/json"

$token = $loginResponse.data.token
if (-not $token) {
    Write-Error "Login failed: $($loginResponse | ConvertTo-Json -Compress)"
    exit 1
}

# Step 2: Send message to chatbot
$chatBody = @{
    message = "cây của tôi có ổn không"
    history = @()
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

$chatResponse = Invoke-RestMethod -Uri "http://localhost:3010/api/ai/chatbot" `
    -Method Post `
    -Headers $headers `
    -Body $chatBody `
    -ContentType "application/json"

Write-Output "Chatbot response:"
$chatResponse | ConvertTo-Json -Depth 5
# Supabase Keep-Alive Ping Script
$url = "https://lvspugkfgaxtfidzlqrc.supabase.co/rest/v1/words?limit=1"
$headers = @{
    "apikey" = "sb_publishable_ukYYuq9mlAVGjuoi8kQTxg_xpYHlzCu"
    "Authorization" = "Bearer sb_publishable_ukYYuq9mlAVGjuoi8kQTxg_xpYHlzCu"
}

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Output "[$date] Supabase Ping Successful. Found $($response.Count) words."
} catch {
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Error "[$date] Supabase Ping Failed: $_"
}

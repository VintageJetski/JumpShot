import urllib.request
import urllib.error

try:
    # Download the working dashboard from the deployed site
    with urllib.request.urlopen('https://csjumpshot.replit.app/') as response:
        html_content = response.read().decode('utf-8')
    
    # Write to the client/public directory
    with open('client/public/complete-dashboard.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"Successfully downloaded {len(html_content)} characters")
    print("File saved as client/public/complete-dashboard.html")
    
except urllib.error.URLError as e:
    print(f"Error downloading: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
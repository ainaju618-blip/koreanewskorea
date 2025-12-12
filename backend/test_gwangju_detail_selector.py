from bs4 import BeautifulSoup

file_path = "gwangju_detail_dump.html"

selectors = {
    'detail_title': 'div.board_view_head h6',
    'detail_content': 'div.board_view_body', 
    'detail_date': 'div.board_view_info span:first-child', 
    'detail_image': 'div.view_image img',
}

try:
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()
        
    soup = BeautifulSoup(html, 'html.parser')
    
    print("--- Testing Selectors ---")
    
    # Title
    t_elem = soup.select_one(selectors['detail_title'])
    print(f"Title: {t_elem.get_text(strip=True) if t_elem else 'NOT FOUND'}")
    
    # Date
    d_elem = soup.select_one(selectors['detail_date'])
    print(f"Date: {d_elem.get_text(strip=True) if d_elem else 'NOT FOUND'}")
    
    # Content
    c_elem = soup.select_one(selectors['detail_content'])
    print(f"Content: Found? {'YES' if c_elem else 'NO'}")
    if c_elem:
        print(f"Content Preview: {c_elem.get_text(strip=True)[:50]}...")
        
    # Image
    i_elem = soup.select_one(selectors['detail_image'])
    print(f"Image: {i_elem['src'] if i_elem else 'NOT FOUND'}")
    
except Exception as e:
    print(f"Error: {e}")

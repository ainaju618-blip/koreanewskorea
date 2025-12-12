import os

env_path = r"d:\cbt\koreanews\.env"
target_path = r"d:\cbt\koreanews\web\.env.local"

if not os.path.exists(env_path):
    print(f"Error: {env_path} not found.")
    exit(1)

env_vars = {}
try:
    # Try multiple encodings
    content = ""
    for enc in ['utf-8', 'utf-8-sig', 'cp949', 'latin1']:
        try:
            with open(env_path, "r", encoding=enc) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue
            
    if not content:
        # Final fallback
        with open(env_path, "r", encoding='utf-8', errors='ignore') as f:
            content = f.read()

    for line in content.splitlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            key, val = line.split("=", 1)
            env_vars[key] = val
except Exception as e:
    print(f"Error reading .env: {e}")
    exit(1)

new_content = ""

# URL
url = env_vars.get("SUPABASE_URL") or env_vars.get("VITE_SUPABASE_URL")
if url:
    new_content += f"NEXT_PUBLIC_SUPABASE_URL={url}\n"
else:
    print("Warning: SUPABASE_URL not found.")

# Key (Prioritize Anon Key for Client)
key = env_vars.get("VITE_SUPABASE_ANON_KEY") or env_vars.get("SUPABASE_ANON_KEY") or env_vars.get("SUPABASE_KEY")
if key:
    new_content += f"NEXT_PUBLIC_SUPABASE_ANON_KEY={key}\n"
else:
    print("Warning: SUPABASE_ANON_KEY not found.")

try:
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Successfully created {target_path}")
    print(new_content)
except Exception as e:
    print(f"Error writing .env.local: {e}")

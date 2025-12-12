import subprocess
import time

def run_step(script_name, description):
    print(f"\n[{description}] Running {script_name}...")
    try:
        # Run python script and wait for completion
        result = subprocess.run(["python", script_name], check=True)
        if result.returncode == 0:
            print(f"-> {script_name} Completed Successfully.")
            return True
        else:
            print(f"[!] {script_name} Failed.")
            return False
    except subprocess.CalledProcessError as e:
        print(f"[!] Error running {script_name}: {e}")
        return False
    except Exception as e:
        print(f"[!] Unexpected error: {e}")
        return False

def main():
    print("==========================================")
    print("   Korea News Bot - Automated Pipeline    ")
    print("==========================================")
    
    # Step 1: Collection
    # Note: rss_collector.py creates scraped_news_raw.json
    if not run_step("rss_collector.py", "Step 1: RSS News Collection"):
        return

    time.sleep(1) # Brief pause

    # Step 2: AI Rewriting
    # Note: ai_rewriter.py reads scraped_news_raw.json -> creates news_drafts.json
    if not run_step("ai_rewriter.py", "Step 2: AI Rewriting (Gemini/OpenAI)"):
        return

    time.sleep(1)

    # Step 3: DB Loading
    # Note: db_loader.py reads news_drafts.json -> inserts into Supabase
    if not run_step("db_loader.py", "Step 3: Uploading to Supabase DB"):
        return

    print("\n==========================================")
    print("       All Steps Completed Successfully!      ")
    print("==========================================")

if __name__ == "__main__":
    main()

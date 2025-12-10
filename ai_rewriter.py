from openai import OpenAI
import json
import os
from dotenv import load_dotenv

# Load API Key from .env
# Load API Key from .env
try:
    load_dotenv(encoding='utf-8')
except Exception:
    try:
        load_dotenv(encoding='cp949') 
    except Exception:
        load_dotenv() 

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

class AIRewriter:
    def __init__(self):
        if not client:
            print("[!] Warning: OPENAI_API_KEY not found. Running in MOCK MODE.")

    def rewrite_article(self, article, tone="calm_and_trustworthy"):
        """
        AI를 사용하여 기사를 한국어로 번역 및 재구성(Re-write)하는 함수
        """
        # MOCK MODE: Return ORIGINAL data if no API key
        if not client:
            return {
                "korean_title": article['title'], # Use original English title
                "korean_body": article['summary'], # Use original English summary
                "korean_insight": "Insight unavailable (No API Key)",
                "category": "News" # Default category
            }

        prompt = f"""
        You are 'K-Bot', a veteran journalist for 'Korea NEWS'.
        Your task is to rewrite the following English news into a professional Korean news article.

        [Original Article]
        Title: {article['title']}
        Summary: {article['summary']}
        Source: {article['source']}

        [Guidelines]
        1. **Language:** Korean (Standard News Style).
        2. **Translation:** Do NOT just translate. Understand the context and rewrite it.
        3. **Tone:** Calm, trustworthy, and professional (dry but insightful).
        4. **Structure:**
           - **Headline:** Catchy but not clickbait.
           - **Lead:** Summarize the core fact in one sentence.
           - **Body:** Explain the details based on the summary.
           - **Insight:** Add one sentence about "What this means for Korea/Education/AI industry".
        5. **Category Classification:** Choose ONE from [AI, Education, Gwangju, Jeonnam, Naju, Economy, World].

        [Output Format (JSON Only)]
        {{
            "korean_title": "...",
            "korean_body": "...",
            "korean_insight": "...",
            "category": "..."
        }}
        """

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini", 
                messages=[
                    {"role": "system", "content": "You are a professional news editor. Output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            content = response.choices[0].message.content
            cleaned_content = self._clean_json_string(content)
            return json.loads(cleaned_content)
        except Exception as e:
            print(f"[!] AI Rewrite Error: {e}")
            return None

    def _clean_json_string(self, json_string):
        """
        Removes markdown code blocks (```json ... ```) to prevent parsing errors.
        """
        if json_string.startswith("```"):
            # Remove first line (```json) and last line (```)
            lines = json_string.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            return "\n".join(lines)
        return json_string

    def process_batch(self, input_file="scraped_news_raw.json", output_file="news_drafts.json"):
        print("=== Starting AI Rewriting ===")
        
        # Load raw news
        if not os.path.exists(input_file):
            print(f"[!] Input file {input_file} not found.")
            return

        raw_news_list = []
        encodings = ['utf-8', 'utf-8-sig', 'cp949', 'latin-1']
        for enc in encodings:
            try:
                with open(input_file, "r", encoding=enc) as f:
                    raw_news_list = json.load(f)
                print(f"[*] Successfully loaded {input_file} with encoding: {enc}")
                break
            except Exception as e:
                pass
        
        if not raw_news_list:
            print(f"[!] Failed to load JSON file with any encoding.")
            return

        drafts = []
        # Process ALL articles
        for i, article in enumerate(raw_news_list):
            print(f"[*] Processing ({i+1}/{len(raw_news_list)}): {article['title'][:30]}...")
            result = self.rewrite_article(article)
            
            if result:
                draft = {
                    "original_title": article['title'],
                    "title": result.get('korean_title', article['title']),
                    "body": result.get('korean_body', article['summary']),
                    "insight": result.get('korean_insight', ''),
                    "category": result.get('category', 'News'),
                    "source": article['source'],
                    "link": article['link'],
                    "status": "draft",
                    "created_at": article['published_at'] 
                }
                drafts.append(draft)
                print(f"  -> Done: {draft['title'][:30]}...")

        # Save drafts
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(drafts, f, ensure_ascii=False, indent=4)
        print(f"=== Rewriting Complete. Saved {len(drafts)} drafts to {output_file} ===")

if __name__ == "__main__":
    rewriter = AIRewriter()
    rewriter.process_batch()

import os
import json
import re
from google import genai
from google.genai import types

api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

issue_body = os.environ.get("ISSUE_BODY", "")
issue_title = os.environ.get("ISSUE_TITLE", "")

# Collect existing relevant file paths and contents to give Gemini context
tracked_extensions = (".html", ".css", ".js", ".json")
codebase_context = {}

for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root or ".github" in root:
        continue
    for file in files:
        if file.endswith(tracked_extensions):
            path = os.path.relpath(os.path.join(root, file), ".")
            try:
                with open(path, "r", encoding="utf-8") as f:
                    codebase_context[path] = f.read()
            except Exception:
                pass

prompt = f"""
You are an expert game developer automating updates for a web-based RPG.

TASK:
Title: {issue_title}
Instructions: {issue_body}

CURRENT REPOSITORY FILES:
{json.dumps(codebase_context, indent=2)}

OUTPUT FORMAT INSTRUCTIONS:
Return ONLY valid JSON mapping file paths to their full updated file contents. 
Do not wrap the JSON in commentary or conversational fluff.
Format:
{{
  "path/to/file.ext": "full updated content here",
  "path/to/new_file.ext": "full content here"
}}
"""

response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_mime_type="application/json"
    )
)

raw_text = response.text.strip()
# Remove accidental markdown wrapping if present
raw_text = re.sub(r"^```json\s*", "", raw_text)
raw_text = re.sub(r"\s*```$", "", raw_text)

try:
    files_to_update = json.loads(raw_text)
    for file_path, content in files_to_update.items():
        # Prevent path traversal
        norm_path = os.path.normpath(file_path)
        if norm_path.startswith("..") or os.path.isabs(norm_path):
            continue
        os.makedirs(os.path.dirname(norm_path), exist_ok=True) if os.path.dirname(norm_path) else None
        with open(norm_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully updated/created: {norm_path}")
except Exception as e:
    print(f"Failed to parse or write files: {e}")
    print("Raw output:", raw_text)
    exit(1)

from email.mime import text
import os
from dotenv import load_dotenv

load_dotenv()

MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

SYSTEM_PROMPT = (
    "You rewrite short ideas into prompts for the Stable Diffusion text-to-image model. "
    "Keep the user's subject and intent. Add lighting, setting, mood, camera angle and "
    "quality keywords. Write comma-separated descriptive phrases, maximum 50 words. "
    "Output ONLY the improved prompt, with no quotes, no explanation and no preamble."
)


def enhance_prompt(user_prompt: str) -> str:
    api_key = ((os.getenv("GROQ_API_KEY") or "").split() or [""])[0]
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")

    from groq import Groq

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=600,
        reasoning_effort="low",
    )
    text = (response.choices[0].message.content or "").strip()
    if not text:
     raise RuntimeError("The LLM returned an empty response. Try again.")
    return text
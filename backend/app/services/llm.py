import os
from dotenv import load_dotenv

load_dotenv(override=True)

MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
MAX_WORDS = 45

SYSTEM_PROMPT = (
    "You rewrite short ideas into prompts for the Stable Diffusion text-to-image model. "
    "Keep the user's subject and intent. Output ONE line of 8 to 12 comma-separated phrases, "
    "40 words maximum. Cover: subject details, setting, lighting, mood, camera angle, and at most "
    "ONE style or quality tag. Never repeat a word or phrase. Do not use filler like "
    "'high quality', '8k', '4k', 'hyper realistic' or 'cinematic' more than once in total. "
    "Output ONLY the prompt, with no quotes, no explanation and no preamble."
)


def clean_prompt(text: str, max_words: int = MAX_WORDS) -> str:
    """Remove repeated phrases and trim to a length Stable Diffusion can actually read."""
    seen_phrases = set()
    used_words = set()
    kept = []
    total_words = 0

    for phrase in text.replace("\n", " ").split(","):
        phrase = phrase.strip().strip('."\'')
        if not phrase:
            continue

        key = phrase.lower()
        if key in seen_phrases:
            continue

        words = key.split()
        # Skip phrases that add no new words (e.g. "cinematic" after "cinematic mood")
        if all(w in used_words for w in words):
            continue
        if total_words + len(words) > max_words:
            break

        seen_phrases.add(key)
        used_words.update(words)
        kept.append(phrase)
        total_words += len(words)

    return ", ".join(kept)


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
        temperature=0.5,
        max_tokens=600,
        reasoning_effort="low",
    )
    raw = (response.choices[0].message.content or "").strip()
    text = clean_prompt(raw)
    if not text:
        raise RuntimeError("The LLM returned an empty response. Try again.")
    return text
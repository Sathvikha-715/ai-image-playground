# Prompt Enhancer Experiment

**Goal:** measure how LLM prompt enhancement (Groq + `openai/gpt-oss-20b`) changes a Stable Diffusion image.

**Setup:** Stable Diffusion v1.5 on a Colab T4 GPU, 512x512, 30 steps, guidance scale 7.5, seed `3572992927`. The seed, steps and guidance were identical for every run, so **only the prompt changed**.

---

## 1. Plain prompt (baseline)

> Bangalore airport in the day

![Plain prompt](images/airport_plain.png)

---

## 2. First enhanced prompt (too long and repetitive)

> Bangalore International Airport, midday, bright daylight, wide-angle shot from ground level, bustling crowds, modern architecture, reflective glass surfaces, crisp sky, vibrant city vibe, high resolution, cinematic lighting, vibrant colors, realistic style, 8k quality, sharp focus, atmospheric depth, subtle motion blur, dynamic composition, HDR, cinematic mood, realistic textures, detailed signage, bustling taxiway, serene blue sky, high clarity, cinematic atmosphere, cinematic lighting, hyper realistic, 4k, ultra detailed, cinematic composition, vibrant atmosphere, dynamic perspective, realistic lighting, high detail, cinematic, realistic, high quality, sharp focus, cinematic, vibrant, realistic, detailed, high resolution, 8k, 4k, cinematic, realistic, hyper-detailed, high-quality, cinematic, realistic, high detail.

**Problems found:**

- Over 100 words long.
- Heavy repetition: "cinematic" appears about 9 times and "realistic" about 8 times. "8k", "4k" and "sharp focus" repeat too.
- Stable Diffusion's text encoder (CLIP) reads only the first 77 tokens, so most of this prompt was cut off and ignored. The repeated filler also used up space that useful details needed.
- The model ignored the "maximum 50 words" instruction in my system prompt.

---

## 3. Cleaned enhanced prompt (after the fix)

> Bangalore airport terminal, bright daylight, bustling crowds, wide-angle view, reflective glass surfaces, vibrant signage, serene atmosphere, subtle shadows, panoramic perspective, modern architecture, subtle lens flare

![Enhanced prompt](images/airport_enhanced.png)

About 25 words in 11 phrases, with no repeated words, well inside the 77-token limit.

---

## What I changed to fix it

1. **Stricter system prompt:** 8 to 12 comma-separated phrases, 40 words maximum, no repeated words, at most one quality tag.
2. **`clean_prompt()` in the backend (`llm.py`):** removes duplicate phrases, skips phrases that add no new words, and stops at 45 words. This guarantees a usable prompt even when the LLM ignores instructions.
3. **Lower temperature (0.5):** less rambling output.

---

## Observations

- The enhancer adds useful scene details that the plain prompt lacked (glass surfaces, wide-angle view, signage, lens flare).
- LLM output can contradict itself: "bustling crowds" and "serene atmosphere" pull in opposite directions.
- Prompt length matters: keep prompts well under 77 tokens, because anything beyond that has no effect.
- Relying on instructions alone is not enough, so I added a code-level cleanup step as a safety net.
- My comparison of the two images (fill this in after looking at them):
  - What changed:
  - What is better:
  - What is worse:

---

## Limitations

- One prompt and one seed were tested, so this is a small sample, not a statistical result.
- Image quality was judged visually, with no automated metric (such as CLIP similarity).
- Stable Diffusion v1.5 often produces garbled text on signs and aircraft.
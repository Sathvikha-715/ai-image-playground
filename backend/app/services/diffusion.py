import base64
import io
import os
import random
import time
from datetime import datetime

OUTPUT_DIR = "generated_images"
_pipe = None


def get_pipe():
    """Load the model once, the first time it's needed."""
    global _pipe
    if _pipe is None:
        try:
            import torch
            from diffusers import StableDiffusionPipeline
        except ImportError:
            raise RuntimeError("PyTorch/Diffusers not installed. Run the backend on Colab.")

        if not torch.cuda.is_available():
            raise RuntimeError("No GPU available. Run the backend on Colab.")

        _pipe = StableDiffusionPipeline.from_pretrained(
            "stable-diffusion-v1-5/stable-diffusion-v1-5",
            torch_dtype=torch.float16,
            low_cpu_mem_usage=False,
            use_safetensors=True,
        ).to("cuda")
    return _pipe


def generate_image(prompt, negative_prompt, steps, guidance_scale, seed, width, height):
    pipe = get_pipe()
    import torch

    if seed is None:
        seed = random.randint(0, 2**32 - 1)
    generator = torch.Generator("cuda").manual_seed(seed)

    start = time.time()
    image = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        width=width,
        height=height,
        generator=generator,
    ).images[0]
    elapsed = round(time.time() - start, 2)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    image_path = f"{OUTPUT_DIR}/img_{timestamp}_{seed}.png"
    image.save(image_path)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "image_base64": image_base64,
        "seed": seed,
        "steps": steps,
        "guidance_scale": guidance_scale,
        "generation_time_s": elapsed,
        "image_path": image_path,
    }
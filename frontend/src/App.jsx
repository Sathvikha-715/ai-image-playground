import { useState } from "react";

const DEFAULT_NEGATIVE = "blurry, distorted, low quality";

export default function App() {
  const [apiUrl, setApiUrl] = useState(localStorage.getItem("apiUrl") || "");
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState(DEFAULT_NEGATIVE);
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(7.5);
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function saveUrl(value) {
    setApiUrl(value);
    localStorage.setItem("apiUrl", value);
  }

  async function run(seedToUse) {
    if (!apiUrl.trim()) return setError("Paste your Colab public URL first.");
    if (!prompt.trim()) return setError("Please enter a prompt.");

    setLoading(true);
    setError("");

    const body = {
      prompt,
      negative_prompt: negative,
      steps: Number(steps),
      guidance_scale: Number(guidance),
      seed: seedToUse,
      width: 512,
      height: 512,
    };

    try {
      const res = await fetch(`${apiUrl.trim().replace(/\/$/, "")}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ? JSON.stringify(err.detail) : `Server error ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(`${e.message}. Check that Colab is running and the URL is current.`);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setPrompt("");
    setNegative(DEFAULT_NEGATIVE);
    setSteps(30);
    setGuidance(7.5);
    setSeed("");
    setResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 px-6 py-4 text-xl font-semibold">
        ✦ GenStudio
      </nav>

      <main className="mx-auto grid max-w-6xl gap-8 p-6 md:grid-cols-2">
        {/* LEFT: controls */}
        <section className="space-y-5">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Backend URL (from Colab)</label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm"
              placeholder="https://something.trycloudflare.com"
              value={apiUrl}
              onChange={(e) => saveUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Describe your image</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
              placeholder="A futuristic Bangalore city at night..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Negative prompt</label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Steps: {steps}</label>
            <input
              type="range" min="10" max="50" step="5"
              className="w-full"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Guidance scale: {guidance}</label>
            <input
              type="range" min="1" max="15" step="0.5"
              className="w-full"
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Seed (leave empty for random)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
              placeholder="e.g. 12345"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => run(seed === "" ? null : Number(seed))}
              disabled={loading}
              className="flex-1 rounded-lg bg-violet-600 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Image"}
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg border border-slate-700 px-4 hover:bg-slate-800"
            >
              Clear
            </button>
          </div>

          {loading && (
            <p className="text-sm text-slate-400">
              The first image can take 1–2 minutes while the model loads. Later ones take about 5 seconds.
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>

        {/* RIGHT: result */}
        <section className="flex flex-col items-center justify-start gap-4">
          {result ? (
            <>
              <img
                src={`data:image/png;base64,${result.image_base64}`}
                alt="Generated"
                className="w-full max-w-md rounded-xl border border-slate-800"
              />
              <p className="text-sm text-slate-400">
                Seed {result.seed} · {result.steps} steps · guidance {result.guidance_scale} · {result.generation_time_s}s
              </p>
              <div className="flex gap-3">
                <a
                  href={`data:image/png;base64,${result.image_base64}`}
                  download={`image_${result.seed}.png`}
                  className="rounded-lg bg-slate-800 px-4 py-2 hover:bg-slate-700"
                >
                  Download
                </a>
                <button
                  onClick={() => run(null)}
                  disabled={loading}
                  className="rounded-lg bg-slate-800 px-4 py-2 hover:bg-slate-700 disabled:opacity-50"
                >
                  Regenerate (new seed)
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-96 w-full max-w-md items-center justify-center rounded-xl border border-dashed border-slate-700 text-slate-500">
              Your image will appear here
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
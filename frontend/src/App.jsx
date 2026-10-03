import { useState } from "react";

const DEFAULT_NEGATIVE = "blurry, distorted, low quality";

const STYLES = {
  None: { suffix: "", negative: "" },
  Realistic: {
    suffix: "photorealistic, natural lighting, sharp focus",
    negative: "cartoon, drawing, painting",
  },
  Cinematic: {
    suffix: "cinematic lighting, dramatic composition, film still",
    negative: "flat lighting",
  },
  Anime: {
    suffix: "anime style, vibrant colors, clean line art",
    negative: "photo, realistic, 3d render",
  },
  "3D Render": {
    suffix: "3d render, octane render, soft studio lighting",
    negative: "flat, sketch, photo",
  },
  Watercolor: {
    suffix: "watercolor painting, soft washes, paper texture",
    negative: "photo, sharp edges, 3d render",
  },
  "Digital Art": {
    suffix: "digital art, detailed illustration, concept art",
    negative: "photo, blurry",
  },
};

export default function App() {
  const [view, setView] = useState("create");
  const [apiUrl, setApiUrl] = useState(localStorage.getItem("apiUrl") || "");
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [style, setStyle] = useState("None");
  const [negative, setNegative] = useState(DEFAULT_NEGATIVE);
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(7.5);
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  function saveUrl(value) {
    setApiUrl(value);
    localStorage.setItem("apiUrl", value);
  }

  function baseUrl() {
    return apiUrl.trim().replace(/\/$/, "");
  }

  async function enhancePrompt() {
    if (!apiUrl.trim()) return setError("Paste your Colab public URL first.");
    if (!prompt.trim()) return setError("Please enter a prompt.");

    setEnhancing(true);
    setError("");

    try {
      const res = await fetch(`${baseUrl()}/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ? JSON.stringify(err.detail) : `Server error ${res.status}`);
      }
      const data = await res.json();
      setOriginalPrompt(prompt);
      setPrompt(data.enhanced);
    } catch (e) {
      setError(`${e.message}. Check that Colab is running and the URL is current.`);
    } finally {
      setEnhancing(false);
    }
  }

  async function run(seedToUse) {
    if (!apiUrl.trim()) return setError("Paste your Colab public URL first.");
    if (!prompt.trim()) return setError("Please enter a prompt.");

    setLoading(true);
    setError("");

    const preset = STYLES[style];
    const finalPrompt = preset.suffix ? `${prompt}, ${preset.suffix}` : prompt;
    const finalNegative = preset.negative ? `${negative}, ${preset.negative}` : negative;

    const body = {
      prompt: finalPrompt,
      negative_prompt: finalNegative,
      steps: Number(steps),
      guidance_scale: Number(guidance),
      seed: seedToUse,
      width: 512,
      height: 512,
    };

    try {
      const res = await fetch(`${baseUrl()}/generate`, {
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

  async function loadHistory() {
    if (!apiUrl.trim()) return setHistoryError("Paste your Colab public URL on the Create page first.");

    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await fetch(`${baseUrl()}/history`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setHistory(await res.json());
    } catch (e) {
      setHistoryError(`${e.message}. Check that Colab is running, the URL is current, and the history code is pulled.`);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this image?")) return;
    try {
      const res = await fetch(`${baseUrl()}/history/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setHistory((items) => items.filter((item) => item.id !== id));
    } catch (e) {
      setHistoryError(e.message);
    }
  }

  function reuseSettings(item) {
    setPrompt(item.prompt);
    setOriginalPrompt("");
    setStyle("None");
    setNegative(item.negative_prompt || DEFAULT_NEGATIVE);
    setSteps(item.steps);
    setGuidance(item.guidance_scale);
    setSeed(String(item.seed));
    setError("");
    setView("create");
  }

  function openHistory() {
    setView("history");
    loadHistory();
  }

  function handleClear() {
    setPrompt("");
    setOriginalPrompt("");
    setStyle("None");
    setNegative(DEFAULT_NEGATIVE);
    setSteps(30);
    setGuidance(7.5);
    setSeed("");
    setResult(null);
    setError("");
  }

  const busy = loading || enhancing;

  const tabClass = (name) =>
    `rounded-lg px-3 py-1 text-sm ${
      view === name ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-slate-800"
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <span className="text-xl font-semibold">✦ GenStudio</span>
        <div className="flex gap-2">
          <button className={tabClass("create")} onClick={() => setView("create")}>
            Create
          </button>
          <button className={tabClass("history")} onClick={openHistory}>
            History
          </button>
        </div>
      </nav>

      {view === "create" ? (
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
                rows={5}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
                placeholder="A futuristic Bangalore city at night..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={enhancePrompt}
                  disabled={busy}
                  className="rounded-lg border border-violet-500 px-3 py-1 text-sm text-violet-300 hover:bg-violet-950 disabled:opacity-50"
                >
                  {enhancing ? "Enhancing..." : "✨ Enhance Prompt"}
                </button>
                {originalPrompt && (
                  <button
                    onClick={() => {
                      setPrompt(originalPrompt);
                      setOriginalPrompt("");
                    }}
                    className="text-sm text-slate-400 underline"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-400">Style</label>
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                {Object.keys(STYLES).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
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
                disabled={busy}
                className="flex-1 rounded-lg bg-violet-600 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Image"}
              </button>
              <button
                onClick={handleClear}
                disabled={busy}
                className="rounded-lg border border-slate-700 px-4 hover:bg-slate-800 disabled:opacity-50"
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
                    disabled={busy}
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
      ) : (
        <main className="mx-auto max-w-6xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Generations</h2>
            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {historyLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {historyError && <p className="mb-4 text-sm text-red-400">{historyError}</p>}

          {!historyLoading && !historyError && history.length === 0 && (
            <p className="text-slate-500">No images yet. Generate one on the Create page.</p>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
              >
                <img
                  src={`${baseUrl()}/history/${item.id}/image`}
                  alt={item.prompt}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <div className="space-y-2 p-4">
                  <p className="line-clamp-3 text-sm text-slate-200">{item.prompt}</p>
                  <p className="text-xs text-slate-400">
                    Seed {item.seed} · {item.steps} steps · guidance {item.guidance_scale} · {item.generation_time_s}s
                  </p>
                  <p className="text-xs text-slate-500">{item.created_at}</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => reuseSettings(item)}
                      className="rounded-lg bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700"
                    >
                      Reuse settings
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-lg border border-red-900 px-3 py-1 text-sm text-red-400 hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
import { useState } from "react";

const DEFAULT_NEGATIVE = "blurry, distorted, low quality";

export default function Compare({ baseUrl }) {
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [negative, setNegative] = useState(DEFAULT_NEGATIVE);
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(7.5);
  const [seed, setSeed] = useState("12345");
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [status, setStatus] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState("");

  const busy = enhancing || status !== "";

  async function post(path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ? JSON.stringify(err.detail) : `Server error ${res.status}`);
    }
    return res.json();
  }

  async function fillBWithEnhancedA() {
    if (!baseUrl) return setError("Paste your Colab URL on the Create page first.");
    if (!promptA.trim()) return setError("Write prompt A first.");

    setEnhancing(true);
    setError("");
    try {
      const data = await post("/enhance", { prompt: promptA });
      setPromptB(data.enhanced);
    } catch (e) {
      setError(`${e.message}. Check that Colab is running and the URL is current.`);
    } finally {
      setEnhancing(false);
    }
  }

  async function compare() {
    if (!baseUrl) return setError("Paste your Colab URL on the Create page first.");
    if (!promptA.trim() || !promptB.trim()) return setError("Write both prompts first.");

    setError("");
    setResultA(null);
    setResultB(null);

    // One shared seed, so only the prompt differs between A and B
    const sharedSeed = seed === "" ? Math.floor(Math.random() * 2 ** 31) : Number(seed);
    setSeed(String(sharedSeed));

    const settings = {
      negative_prompt: negative,
      steps: Number(steps),
      guidance_scale: Number(guidance),
      seed: sharedSeed,
      width: 512,
      height: 512,
    };

    try {
      setStatus("Generating A...");
      setResultA(await post("/generate", { prompt: promptA, ...settings }));
      setStatus("Generating B...");
      setResultB(await post("/generate", { prompt: promptB, ...settings }));
    } catch (e) {
      setError(`${e.message}. Check that Colab is running and the URL is current.`);
    } finally {
      setStatus("");
    }
  }

  function renderPanel(letter, result) {
    const label = `Result ${letter}`;
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-semibold text-violet-300">{label}</p>
        {result ? (
          <>
            <img
              src={`data:image/png;base64,${result.image_base64}`}
              alt={label}
              className="w-full max-w-md rounded-xl border border-slate-800"
            />
            <p className="text-xs text-slate-400">
              Seed {result.seed} · {result.steps} steps · guidance {result.guidance_scale} · {result.generation_time_s}s
            </p>
            <a
              href={`data:image/png;base64,${result.image_base64}`}
              download={`compare_${letter.toLowerCase()}_${result.seed}.png`}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Download
            </a>
          </>
        ) : (
          <div className="flex aspect-square w-full max-w-md items-center justify-center rounded-xl border border-dashed border-slate-700 text-slate-500">
            {status === `Generating ${letter}...` ? status : "Waiting"}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h2 className="text-lg font-semibold">Compare two prompts (same seed and settings)</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Prompt A</label>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
            placeholder="Bangalore airport in the day"
            value={promptA}
            onChange={(e) => setPromptA(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Prompt B</label>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3"
            placeholder="Write a second prompt, or fill B from A with the button below"
            value={promptB}
            onChange={(e) => setPromptB(e.target.value)}
          />
          <button
            onClick={fillBWithEnhancedA}
            disabled={busy}
            className="mt-2 rounded-lg border border-violet-500 px-3 py-1 text-sm text-violet-300 hover:bg-violet-950 disabled:opacity-50"
          >
            {enhancing ? "Enhancing..." : "✨ Fill B with enhanced A"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-4">
          <label className="mb-1 block text-sm text-slate-400">Negative prompt (shared)</label>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
            value={negative}
            onChange={(e) => setNegative(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Steps: {steps}</label>
          <input
            type="range" min="10" max="50" step="5" className="w-full"
            value={steps} onChange={(e) => setSteps(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Guidance: {guidance}</label>
          <input
            type="range" min="1" max="15" step="0.5" className="w-full"
            value={guidance} onChange={(e) => setGuidance(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Seed (empty = random, shared)</label>
          <input
            type="number"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={compare}
            disabled={busy}
            className="w-full rounded-lg bg-violet-600 py-2 font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {status || "Compare"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {renderPanel("A", resultA)}
        {renderPanel("B", resultB)}
      </div>
    </main>
  );
}
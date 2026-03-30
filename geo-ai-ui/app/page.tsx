"use client";

import Image from "next/image";
import { UploadCloud } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import ExpandableSection from "@/components/ExpandableSection";
import ImageGrid from "@/components/ImageGrid";
import InsightBox from "@/components/InsightBox";
import MetricsGrid from "@/components/MetricsGrid";
import ResultCard from "@/components/ResultCard";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

type RiskLabel = "LOW" | "MODERATE" | "HIGH";

type PredictionResult = {
  probability: number;
  explanation: string;
  insightMode?: "groq" | "local" | "default";
  insightStatus?: string;
  metrics: {
    vegetation: number;
    slope: number;
    rainfall: number;
    elevation: number;
    soil: string;
    boulders: number;
    ruins: number;
    structures: number;
    lat: number;
    lon: number;
  };
  shap: { feature: string; value: number }[];
  images: {
    original: string;
    detection: string;
    segmentation: string;
    combined: string;
    heatmap: string;
  };
};

type HistoryItem = {
  id: string;
  timestamp: string;
  probability: number;
  lat: number;
  lon: number;
  risk: RiskLabel;
};

const STAGES = ["Analyzing terrain", "Running detection", "Generating segmentation", "Scoring erosion risk", "Building AI insight"];

function getRiskLabel(probability: number): RiskLabel {
  if (probability < 0.3) return "LOW";
  if (probability < 0.7) return "MODERATE";
  return "HIGH";
}

function shapInsight(feature: string, value: number): string {
  const key = feature.toLowerCase();
  const intensity = Math.abs(value) > 1 ? "strongly" : Math.abs(value) > 0.45 ? "moderately" : "slightly";

  if (key.includes("vegetation")) {
    return value < 0
      ? `Vegetation ${intensity} reduces erosion risk in this area.`
      : `Lower vegetation coverage ${intensity} increases erosion risk.`;
  }
  if (key.includes("slope")) {
    return value >= 0
      ? `Steeper slope ${intensity} increases erosion risk.`
      : `Slope profile ${intensity} helps stabilize the terrain.`;
  }
  if (key.includes("rain")) {
    return value >= 0
      ? `Rainfall patterns ${intensity} increase erosion pressure.`
      : `Current rainfall effect ${intensity} lowers erosion pressure.`;
  }
  if (key.includes("elevation")) {
    return value >= 0
      ? `Elevation context ${intensity} pushes risk upward.`
      : `Elevation context ${intensity} reduces erosion tendency.`;
  }
  if (key.includes("soil")) {
    return value >= 0
      ? `Soil characteristics ${intensity} increase susceptibility.`
      : `Soil characteristics ${intensity} improve terrain stability.`;
  }
  if (key.includes("boulder")) {
    return value >= 0
      ? `Boulder distribution ${intensity} contributes to higher risk.`
      : `Boulder distribution ${intensity} helps reduce erosion.`;
  }
  if (key.includes("ruin") || key.includes("structure")) {
    return value >= 0
      ? `Built features ${intensity} increase local erosion risk.`
      : `Built features ${intensity} help reduce local erosion risk.`;
  }

  return value >= 0
    ? `${feature} ${intensity} increases erosion risk.`
    : `${feature} ${intensity} reduces erosion risk.`;
}

export default function Page() {
  const [lat, setLat] = useState("22.5726");
  const [lon, setLon] = useState("88.3639");
  const [apiKey, setApiKey] = useState("");
  const [useCustomApiKey, setUseCustomApiKey] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confidence, setConfidence] = useState(0.5);
  const [showVegetation, setShowVegetation] = useState(true);
  const [showRuins, setShowRuins] = useState(true);
  const [showStructures, setShowStructures] = useState(true);
  const [showBoulders, setShowBoulders] = useState(true);
  const [showOthers, setShowOthers] = useState(true);
  const [useAiInsight, setUseAiInsight] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("geo-ai-history");
      if (!raw) return;
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (Array.isArray(parsed)) {
        setHistory(parsed.slice(0, 12));
      }
    } catch {
      // ignore invalid local history
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [loading]);

  const imageItems = useMemo(() => {
    if (!result?.images) {
      const fallback = uploadUrl;
      if (!fallback) return [];
      return [{ label: "Original", src: fallback }];
    }

    return [
      { label: "Original", src: result.images.original },
      { label: "Detection", src: result.images.detection },
      { label: "Segmentation", src: result.images.segmentation },
      { label: "Combined", src: result.images.combined },
      { label: "Heatmap", src: result.images.heatmap }
    ];
  }, [result, uploadUrl]);

  const metrics = useMemo(() => {
    if (!result) return [];

    return [
      { label: "Vegetation", value: result.metrics.vegetation.toFixed(2) },
      { label: "Slope", value: `${result.metrics.slope.toFixed(2)} deg` },
      { label: "Rainfall", value: `${result.metrics.rainfall.toFixed(2)} mm` },
      { label: "Elevation", value: `${result.metrics.elevation.toFixed(2)} m` },
      { label: "Soil", value: result.metrics.soil },
      { label: "Boulders", value: result.metrics.boulders.toFixed(3) },
      { label: "Ruins", value: result.metrics.ruins.toFixed(3) },
      { label: "Structures", value: result.metrics.structures.toFixed(3) },
      { label: "Coordinates", value: `${result.metrics.lat.toFixed(4)}, ${result.metrics.lon.toFixed(4)}` }
    ];
  }, [result]);

  const keySourceLabel = useMemo(() => {
    if (!useCustomApiKey) {
      return "Env";
    }
    return apiKey.trim() ? "Custom" : "Custom (missing)";
  }, [useCustomApiKey, apiKey]);

  const riskLabel = useMemo<RiskLabel | null>(() => {
    if (!result) return null;
    return getRiskLabel(result.probability);
  }, [result]);

  async function runPrediction() {
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    if (!selectedFile) {
      setError("Please upload a satellite image before running prediction.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("lat", String(parsedLat));
      formData.append("lon", String(parsedLon));
      if (useCustomApiKey && apiKey.trim()) {
        formData.append("apiKey", apiKey.trim());
      }
      formData.append("confidence", confidence.toFixed(2));
      formData.append("showVegetation", String(showVegetation));
      formData.append("showRuins", String(showRuins));
      formData.append("showStructures", String(showStructures));
      formData.append("showBoulders", String(showBoulders));
      formData.append("showOthers", String(showOthers));
      formData.append("useAiInsight", String(useAiInsight));

      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        const details = typeof payload?.details === "string" ? payload.details : "";
        throw new Error(payload?.error ? `${payload.error}${details ? `: ${details}` : ""}` : "Prediction failed");
      }

      const parsedResult = payload as PredictionResult;
      setResult(parsedResult);

      const risk = getRiskLabel(parsedResult.probability);
      const item: HistoryItem = {
        id: `${Date.now()}`,
        timestamp: new Date().toISOString(),
        probability: parsedResult.probability,
        lat: parsedLat,
        lon: parsedLon,
        risk,
      };

      setHistory((prev) => {
        const next = [item, ...prev].slice(0, 12);
        window.localStorage.setItem("geo-ai-history", JSON.stringify(next));
        return next;
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdfReport() {
    if (!result) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const margin = 40;
    let y = 48;
    doc.setFontSize(18);
    doc.text("Geo AI System - Terrain Report", margin, y);

    y += 24;
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 18;
    doc.text(`Coordinates: ${result.metrics.lat.toFixed(4)}, ${result.metrics.lon.toFixed(4)}`, margin, y);
    y += 18;
    doc.text(`Erosion Probability: ${(result.probability * 100).toFixed(2)}%`, margin, y);
    y += 18;

    const risk = getRiskLabel(result.probability);
    doc.text(`Risk Zone: ${risk}`, margin, y);

    y += 24;
    doc.setFontSize(12);
    doc.text("Key Metrics", margin, y);
    y += 16;
    doc.setFontSize(10);

    const metricLines = metrics.map((m) => `${m.label}: ${m.value}`);
    for (const line of metricLines) {
      doc.text(line, margin, y);
      y += 14;
      if (y > 760) {
        doc.addPage();
        y = 48;
      }
    }

    y += 10;
    doc.setFontSize(12);
    doc.text("Explanation", margin, y);
    y += 16;
    doc.setFontSize(10);
    const explanationLines = doc.splitTextToSize(result.explanation, 500);
    doc.text(explanationLines, margin, y);
    y += explanationLines.length * 13 + 16;

    doc.setFontSize(12);
    doc.text("Top SHAP Features", margin, y);
    y += 16;
    doc.setFontSize(10);
    for (const item of result.shap) {
      doc.text(`${item.feature}: ${item.value.toFixed(3)}`, margin, y);
      y += 14;
      if (y > 760) {
        doc.addPage();
        y = 48;
      }
    }

    doc.save("geo-ai-report.pdf");
  }

  async function onUploadFile(file: File | undefined) {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setUploadUrl(objectUrl);
    setError("");

    try {
      const exifr = await import("exifr");
      const gps = await exifr.gps(file);
      if (gps?.latitude && gps?.longitude) {
        setLat(String(Number(gps.latitude).toFixed(6)));
        setLon(String(Number(gps.longitude).toFixed(6)));
      }
    } catch {
      // EXIF GPS is optional.
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1300px] px-4 py-6 md:px-6 md:py-10">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-dim">Geo AI System</p>
          <h1 className="mt-2 font-[var(--font-sora)] text-2xl text-ink md:text-3xl">Terrain Intelligence</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="panel h-fit p-5 lg:sticky lg:top-6">
          <p className="mb-4 text-sm font-semibold text-ink">Controls</p>

          <label className="mb-2 block text-xs uppercase tracking-wide text-dim">Satellite Image</label>

          <div className="mb-3 overflow-hidden rounded-xl border border-borderSoft bg-slate-950/45">
            {uploadUrl ? (
              <div className="relative h-32 w-full">
                <Image src={uploadUrl} alt="Uploaded preview" fill unoptimized className="object-cover" />
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-dim">Image preview appears here</div>
            )}
          </div>

          <label className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-borderSoft bg-slate-900/40 px-4 py-6 text-sm text-dim transition hover:border-white/30">
            <UploadCloud className="h-4 w-4" />
            Upload Image
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => onUploadFile(e.target.files?.[0])}
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wide text-dim">Latitude</label>
              <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wide text-dim">Longitude</label>
              <input className="input" value={lon} onChange={(e) => setLon(e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div className="mt-4">
            <MapPicker
              lat={Number(lat) || 0}
              lon={Number(lon) || 0}
              onChange={(nextLat, nextLon) => {
                setLat(nextLat.toFixed(6));
                setLon(nextLon.toFixed(6));
              }}
            />
          </div>

          <div className="mt-4 rounded-xl border border-borderSoft bg-slate-900/45 p-3">
            <p className="text-xs uppercase tracking-wide text-dim">Model Settings</p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-dim">
                <span>Detection Confidence</span>
                <span>{confidence.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="h-2 w-full cursor-pointer"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink">
              <label className="flex items-center gap-2"><input type="checkbox" checked={showVegetation} onChange={(e) => setShowVegetation(e.target.checked)} />Vegetation</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showRuins} onChange={(e) => setShowRuins(e.target.checked)} />Ruins</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showStructures} onChange={(e) => setShowStructures(e.target.checked)} />Structures</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showBoulders} onChange={(e) => setShowBoulders(e.target.checked)} />Boulders</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showOthers} onChange={(e) => setShowOthers(e.target.checked)} />Others</label>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-borderSoft bg-slate-900/35 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-dim">Active Key Source</p>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  keySourceLabel === "Env"
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                    : keySourceLabel === "Custom"
                    ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                    : "border-amber-400/30 bg-amber-500/10 text-amber-200"
                }`}
              >
                {keySourceLabel}
              </span>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={useCustomApiKey}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setUseCustomApiKey(checked);
                  if (!checked) {
                    setApiKey("");
                  }
                }}
              />
              Use custom GROQ API key
            </label>

            {useCustomApiKey ? (
              <div className="mt-3">
                <label className="mb-2 block text-xs uppercase tracking-wide text-dim">Custom GROQ API Key</label>
                <input
                  type="password"
                  className="input"
                  placeholder="gsk_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="mt-1 text-xs text-dim/80">Stored only in memory for this session.</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-dim/80">Using server environment key GROQ_API_KEY.</p>
            )}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={useAiInsight} onChange={(e) => setUseAiInsight(e.target.checked)} />
            Enable AI Insight (GROQ)
          </label>

          <button className="button-primary mt-5 w-full" onClick={runPrediction} disabled={loading}>
            {loading ? "Analyzing terrain..." : "Predict"}
          </button>

          {loading ? <p className="mt-3 text-xs text-dim">{STAGES[stageIndex]}...</p> : null}

          {result ? (
            <button className="mt-3 w-full rounded-xl border border-borderSoft px-4 py-2 text-sm text-ink hover:bg-white/5" onClick={downloadPdfReport}>
              Download PDF Report
            </button>
          ) : null}

          {error ? <p className="mt-3 text-xs text-high">{error}</p> : null}
        </aside>

        <section className="space-y-4">
          {!result && !loading ? (
            <div className="panel flex min-h-[320px] items-center justify-center p-6 text-center">
              <div>
                <p className="text-sm text-dim">Upload terrain image and run prediction.</p>
              </div>
            </div>
          ) : null}

          {loading && !result ? (
            <section className="panel flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center animate-fadeUp">
              <p className="text-[11px] uppercase tracking-[0.24em] text-dim">Erosion Risk</p>
              <p className="mt-3 font-[var(--font-sora)] text-5xl text-ink md:text-7xl">Analyzing...</p>
              <div className="mt-7 h-2.5 w-full max-w-xl overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 animate-pulseSoft rounded-full bg-white/45" />
              </div>
            </section>
          ) : null}

          {result ? <ResultCard probability={result.probability} /> : null}

          {(loading || result) ? (
            <InsightBox
              text={result?.explanation ?? ""}
              loading={loading}
              risk={riskLabel ?? "MODERATE"}
              mode={result?.insightMode ?? "default"}
                status={result?.insightStatus}
            />
          ) : null}

          <div className="space-y-3">
            <ExpandableSection title="Visual Analysis" subtitle="Detection, segmentation and combined output">
              <ImageGrid items={imageItems} />
            </ExpandableSection>

            <ExpandableSection title="Terrain Metrics" subtitle="Model input features">
              <MetricsGrid metrics={metrics} />
            </ExpandableSection>

            <ExpandableSection title="Model Explanation (SHAP)" subtitle="Top feature contributions">
              <div className="grid gap-3 md:grid-cols-2">
                {(result?.shap ?? []).map((item) => (
                  <div
                    key={item.feature}
                    className={`rounded-xl border p-4 ${
                      item.value >= 0
                        ? "border-high/25 bg-high/5"
                        : "border-low/25 bg-low/5"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-dim">{item.feature}</p>
                    <p className={`mt-2 text-sm font-medium leading-relaxed ${item.value >= 0 ? "text-rose-200" : "text-emerald-200"}`}>
                      {shapInsight(item.feature, item.value)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-borderSoft bg-slate-950/50 p-4">
                <p className="mb-3 text-sm text-dim">Feature impact chart</p>
                <div className="space-y-2">
                  {(result?.shap ?? []).map((item) => {
                    const width = `${Math.min(100, Math.abs(item.value) * 180)}%`;
                    return (
                      <div key={`bar-${item.feature}`}>
                        <div className="mb-1 flex items-center justify-between text-xs text-dim">
                          <span>{item.feature}</span>
                          <span className={item.value >= 0 ? "text-high" : "text-low"}>
                            {item.value >= 0 ? "increases risk" : "reduces risk"}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div
                            className={`h-2 rounded-full ${item.value >= 0 ? "bg-high" : "bg-low"}`}
                            style={{ width }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ExpandableSection>

            <ExpandableSection title="Recent Predictions" subtitle="Local history (last 12 runs)">
              {history.length === 0 ? <p className="text-sm text-dim">No runs recorded yet.</p> : null}
              <div className="space-y-2">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-borderSoft bg-slate-950/40 px-3 py-2 text-xs">
                    <div className="text-dim">
                      {new Date(item.timestamp).toLocaleString()} | {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                    </div>
                    <div className="font-semibold text-ink">{(item.probability * 100).toFixed(1)}% {item.risk}</div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          </div>
        </section>
      </div>
    </main>
  );
}

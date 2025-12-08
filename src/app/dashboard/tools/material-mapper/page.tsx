"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface MatchedBMF {
  bmf_name: string;
  confidence: "high" | "medium" | "low";
  matched_materials: string[];
  reason: string;
}

interface MapperResult {
  extracted_materials: string[];
  matched_bmfs: MatchedBMF[];
  unmatched_materials: string[];
  processing_time_ms: number;
  cost_usd: number;
}

export default function MaterialMapperPage() {
  const [strategy, setStrategy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MapperResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategy.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(
        `${apiUrl}/v1/agents/agents.ecoservices.material_mapper/invoke`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputs: { strategy_description: strategy },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const confidenceColor = {
    high: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-xl font-mono text-gray-800 mb-2">Material Mapper</h1>
        <p className="text-sm font-mono text-gray-500">
          Describe your building strategy and discover the materials and flows involved.
        </p>
      </header>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <textarea
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="solar panels on the roof, rainwater collection system, green walls with native plants..."
            className="w-full h-32 p-4 pr-12 font-mono text-sm text-gray-800 placeholder-gray-300 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gray-400 transition-colors"
            disabled={isLoading}
          />
          <p className="mt-2 text-xs font-mono text-gray-400">
            More detail can be helpful. Try describing materials, systems, and design goals.
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!strategy.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 font-mono text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-mono text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="flex gap-6 text-sm font-mono text-gray-500">
            <span>{result.extracted_materials.length} materials extracted</span>
            <span>{result.matched_bmfs.length} flows matched</span>
            <span>{(result.processing_time_ms / 1000).toFixed(1)}s</span>
          </div>

          {/* Matched BMFs */}
          {result.matched_bmfs.length > 0 && (
            <section>
              <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
                Matched Flows
              </h2>
              <div className="grid gap-3">
                {result.matched_bmfs.map((bmf, i) => (
                  <div
                    key={i}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-mono text-gray-800">{bmf.bmf_name}</h3>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded ${confidenceColor[bmf.confidence]}`}
                      >
                        {bmf.confidence}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-gray-500 mb-2">
                      {bmf.reason}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bmf.matched_materials.map((mat, j) => (
                        <span
                          key={j}
                          className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Extracted Materials */}
          <section>
            <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
              Extracted Materials ({result.extracted_materials.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {result.extracted_materials.map((mat, i) => {
                const isMatched = result.matched_bmfs.some((bmf) =>
                  bmf.matched_materials.includes(mat)
                );
                return (
                  <span
                    key={i}
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      isMatched
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mat}
                  </span>
                );
              })}
            </div>
          </section>

          {/* Unmatched */}
          {result.unmatched_materials.length > 0 && (
            <section>
              <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
                Unmatched Materials ({result.unmatched_materials.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.unmatched_materials.map((mat, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { BipartiteGraph, BipartiteItem, BipartiteConnection } from "@/components/ui/BipartiteGraph";

interface MatchedBMF {
  bmf_name: string;
  flow_type?: "inflow" | "outflow" | "both";
  confidence: "high" | "medium" | "low";
  matched_materials: string[];
  reason: string;
}

interface EcosystemConnection {
  bmf_name: string;
  ecosystem_service: string;
  relationship_type: string;
}

interface SupplementaryConnection {
  bmf_name: string;
  ecosystem_service: string;
  text: string;
  direction?: string;
}

interface EcosystemServiceDetail {
  name: string;
  description: string;
  category: string;
  supplementary_connections: SupplementaryConnection[];
}

interface MapperResult {
  extracted_materials: string[];
  matched_bmfs: MatchedBMF[];
  unmatched_materials: string[];
  ecosystem_connections: EcosystemConnection[];
  ecosystem_services: string[];
  ecosystem_service_details: Record<string, EcosystemServiceDetail>;
  processing_time_ms: number;
  cost_usd: number;
}

interface ProgressState {
  stage: "idle" | "stage1" | "stage2" | "stage3" | "complete" | "error";
  message: string;
  currentChunk?: number;
  totalChunks?: number;
  elapsedMs?: number;
}

export default function MaterialMapperPage() {
  const [strategy, setStrategy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MapperResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Streaming progress state
  const [progress, setProgress] = useState<ProgressState>({ stage: "idle", message: "" });
  const [extractedMaterials, setExtractedMaterials] = useState<string[]>([]);
  const [matchedBmfs, setMatchedBmfs] = useState<MatchedBMF[]>([]);
  const [ecosystemConnections, setEcosystemConnections] = useState<EcosystemConnection[]>([]);
  const [ecosystemServices, setEcosystemServices] = useState<string[]>([]);
  const [ecosystemServiceDetails, setEcosystemServiceDetails] = useState<Record<string, EcosystemServiceDetail>>({});
  const [selectedEcosystemService, setSelectedEcosystemService] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategy.trim() || isLoading) return;

    // Reset state
    setIsLoading(true);
    setError(null);
    setResult(null);
    setExtractedMaterials([]);
    setMatchedBmfs([]);
    setEcosystemConnections([]);
    setEcosystemServices([]);
    setEcosystemServiceDetails({});
    setSelectedEcosystemService(null);
    setProgress({ stage: "idle", message: "Connecting..." });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

      // Use the streaming endpoint
      const response = await fetch(
        `${apiUrl}/v1/agents/agents.ecoservices.material_mapper/invoke/stream`,
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

      // Read the SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              handleStreamEvent(event);
            } catch (parseErr) {
              console.warn("Failed to parse SSE event:", line);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setProgress({ stage: "error", message: "Failed to connect" });
    } finally {
      setIsLoading(false);
    }
  }, [strategy, isLoading]);

  const handleStreamEvent = useCallback((event: Record<string, unknown>) => {
    const eventType = event.event_type as string;
    const message = event.message as string || "";
    const elapsedMs = event.elapsed_ms as number | undefined;

    switch (eventType) {
      case "stage1_start":
        setProgress({
          stage: "stage1",
          message: message || "Analyzing strategy...",
          elapsedMs
        });
        break;

      case "stage1_complete":
        // Show extracted materials IMMEDIATELY
        const materials = event.extracted_materials as string[] || [];
        setExtractedMaterials(materials);
        setProgress({
          stage: "stage1",
          message: message || `Found ${materials.length} materials`,
          elapsedMs
        });
        break;

      case "stage2_start":
        // All chunks start running in parallel immediately
        setProgress({
          stage: "stage2",
          message: message || "Matching to BMF database (parallel)...",
          totalChunks: event.total_chunks as number,
          currentChunk: 0,
          elapsedMs
        });
        break;

      case "stage2_chunk_complete":
        // Add new matches incrementally
        const chunkBmfs = event.matched_bmfs as MatchedBMF[] || [];
        if (chunkBmfs.length > 0) {
          setMatchedBmfs(prev => {
            // Deduplicate by bmf_name
            const existingNames = new Set(prev.map(b => b.bmf_name));
            const newBmfs = chunkBmfs.filter(b => !existingNames.has(b.bmf_name));
            return [...prev, ...newBmfs];
          });
        }
        setProgress(prev => ({
          ...prev,
          currentChunk: event.current_chunk as number,
          message: message || `Chunk ${event.current_chunk}/${event.total_chunks} complete`,
          elapsedMs
        }));
        break;

      case "stage3_start":
        setProgress({
          stage: "stage3",
          message: message || "Fetching ecosystem service connections...",
          elapsedMs
        });
        break;

      case "stage3_complete":
        // Set ecosystem data
        const connections = event.ecosystem_connections as EcosystemConnection[] || [];
        const services = event.ecosystem_services as string[] || [];
        const serviceDetails = event.ecosystem_service_details as Record<string, EcosystemServiceDetail> || {};
        setEcosystemConnections(connections);
        setEcosystemServices(services);
        setEcosystemServiceDetails(serviceDetails);
        setProgress({
          stage: "stage3",
          message: message || `Found ${services.length} ecosystem services`,
          elapsedMs
        });
        break;

      case "complete":
        setProgress({
          stage: "complete",
          message: message || "Complete!",
          elapsedMs
        });
        break;

      case "result":
        // Final result - update everything
        setResult({
          extracted_materials: event.extracted_materials as string[] || [],
          matched_bmfs: event.matched_bmfs as MatchedBMF[] || [],
          unmatched_materials: event.unmatched_materials as string[] || [],
          ecosystem_connections: event.ecosystem_connections as EcosystemConnection[] || [],
          ecosystem_services: event.ecosystem_services as string[] || [],
          ecosystem_service_details: event.ecosystem_service_details as Record<string, EcosystemServiceDetail> || {},
          processing_time_ms: event.processing_time_ms as number || 0,
          cost_usd: event.cost_usd as number || 0,
        });
        setEcosystemServiceDetails(event.ecosystem_service_details as Record<string, EcosystemServiceDetail> || {});
        setProgress({ stage: "complete", message: "Analysis complete" });
        break;

      case "error":
        setError(event.error as string || "Unknown error");
        setProgress({ stage: "error", message: message || "Error occurred" });
        break;
    }
  }, []);

  const confidenceColor = {
    high: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };

  // Show either streaming state or final result
  const showExtractedMaterials = result?.extracted_materials || extractedMaterials;
  const showMatchedBmfs = result?.matched_bmfs || matchedBmfs;
  const showEcosystemConnections = result?.ecosystem_connections || ecosystemConnections;
  const showEcosystemServices = result?.ecosystem_services || ecosystemServices;
  const showEcosystemServiceDetails = result?.ecosystem_service_details || ecosystemServiceDetails;

  // Handle ecosystem service click
  const handleEcosystemServiceClick = useCallback((item: { id: string; label: string }) => {
    setSelectedEcosystemService(prev => prev === item.id ? null : item.id);
  }, []);

  // Get selected service details
  const selectedServiceDetail = selectedEcosystemService
    ? showEcosystemServiceDetails[selectedEcosystemService]
    : null;

  // Prepare BipartiteGraph data - only show BMFs with outflow that have connections
  const bipartiteData = useMemo(() => {
    if (showEcosystemConnections.length === 0) return null;

    // Get unique BMFs that have ecosystem connections
    const bmfNames = [...new Set(showEcosystemConnections.map(c => c.bmf_name))];

    // Filter to only BMFs that can have outflows
    const outflowBmfs = showMatchedBmfs.filter(
      bmf => bmf.flow_type === "outflow" || bmf.flow_type === "both"
    );
    const outflowBmfNames = new Set(outflowBmfs.map(b => b.bmf_name));

    // Left items: BMFs with connections (filtered to those with outflow capability)
    const leftItems: BipartiteItem[] = bmfNames
      .filter(name => outflowBmfNames.has(name))
      .sort()
      .map(name => ({ id: name, label: name }));

    // Right items: Ecosystem services (sorted)
    const rightItems: BipartiteItem[] = showEcosystemServices
      .sort()
      .map(name => ({ id: name, label: name }));

    // Connections: Only for BMFs in our filtered list, deduplicated
    const validBmfNames = new Set(leftItems.map(i => i.id));
    const seenConnections = new Set<string>();
    const connections: BipartiteConnection[] = showEcosystemConnections
      .filter(c => validBmfNames.has(c.bmf_name))
      .filter(c => {
        const key = `${c.bmf_name}-${c.ecosystem_service}`;
        if (seenConnections.has(key)) return false;
        seenConnections.add(key);
        return true;
      })
      .map(c => ({
        sourceId: c.bmf_name,
        targetId: c.ecosystem_service,
      }));

    return { leftItems, rightItems, connections };
  }, [showMatchedBmfs, showEcosystemConnections, showEcosystemServices]);

  return (
    <div className="p-8 max-w-5xl">
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

      {/* Progress Indicator */}
      {isLoading && progress.stage !== "idle" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="font-mono text-sm text-blue-800">{progress.message}</p>
              {progress.stage === "stage2" && progress.totalChunks && (
                <div className="mt-2">
                  <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${((progress.currentChunk || 0) / progress.totalChunks) * 100}%`
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-mono text-blue-600">
                    Chunk {progress.currentChunk || 0} of {progress.totalChunks}
                  </p>
                </div>
              )}
            </div>
            {progress.elapsedMs && (
              <span className="text-xs font-mono text-blue-500">
                {(progress.elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5" />
          <p className="font-mono text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Streaming Results - Show as data comes in */}
      {(showExtractedMaterials.length > 0 || showMatchedBmfs.length > 0) && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="flex gap-6 text-sm font-mono text-gray-500">
            <span className="flex items-center gap-1">
              {progress.stage === "complete" && <CheckCircle2 size={14} className="text-green-600" />}
              {showExtractedMaterials.length} materials extracted
            </span>
            <span>{showMatchedBmfs.length} flows matched</span>
            {showEcosystemServices.length > 0 && (
              <span>{showEcosystemServices.length} ecosystem services</span>
            )}
            {result?.processing_time_ms && (
              <span>{(result.processing_time_ms / 1000).toFixed(1)}s</span>
            )}
          </div>

          {/* Extracted Materials - Show IMMEDIATELY after Stage 1 */}
          {showExtractedMaterials.length > 0 && (
            <section className={isLoading && progress.stage === "stage1" ? "animate-pulse" : ""}>
              <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
                Extracted Materials ({showExtractedMaterials.length})
                {isLoading && progress.stage !== "complete" && (
                  <span className="ml-2 text-green-600 normal-case">✓ Ready</span>
                )}
              </h2>
              <div className="flex flex-wrap gap-2">
                {showExtractedMaterials.map((mat, i) => {
                  const isMatched = showMatchedBmfs.some((bmf) =>
                    bmf.matched_materials.includes(mat)
                  );
                  return (
                    <span
                      key={i}
                      className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
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
          )}

          {/* Ecosystem Service Connections - BipartiteGraph visualization */}
          {bipartiteData && bipartiteData.connections.length > 0 && (
            <section>
              <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
                Ecosystem Service Connections
                {isLoading && progress.stage === "stage3" && (
                  <span className="ml-2 text-blue-600 normal-case animate-pulse">Loading...</span>
                )}
              </h2>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 overflow-x-auto">
                <BipartiteGraph
                  leftItems={bipartiteData.leftItems}
                  rightItems={bipartiteData.rightItems}
                  connections={bipartiteData.connections}
                  leftHeader={`Building Flows (${bipartiteData.leftItems.length})`}
                  rightHeader={`Ecosystem Services (${bipartiteData.rightItems.length})`}
                  rowHeight={28}
                  columnWidth={220}
                  connectionAreaWidth={180}
                  connectionColor="#cbd5e1"
                  highlightColor="#2563eb"
                  onRightItemClick={handleEcosystemServiceClick}
                  selectedRightId={selectedEcosystemService}
                />
              </div>

              {/* Ecosystem Service Detail Panel */}
              {selectedServiceDetail && (
                <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50/50 animate-fadeIn">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-mono text-gray-800 font-medium">
                        {selectedServiceDetail.name}
                      </h3>
                      {selectedServiceDetail.category && (
                        <span className="text-xs font-mono text-blue-600 uppercase tracking-wider">
                          {selectedServiceDetail.category}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedEcosystemService(null)}
                      className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>

                  {selectedServiceDetail.description && (
                    <p className="text-sm font-mono text-gray-600 mb-4">
                      {selectedServiceDetail.description}
                    </p>
                  )}

                  {selectedServiceDetail.supplementary_connections.length > 0 && (
                    <div className="border-t border-blue-200 pt-3">
                      <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                        Material Connections
                      </h4>
                      <div className="space-y-1">
                        {selectedServiceDetail.supplementary_connections.map((conn, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm font-mono text-gray-600"
                          >
                            <span className="text-gray-400">{conn.bmf_name}</span>
                            <span className="text-gray-300">→</span>
                            <span className="text-gray-500">{conn.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Matched BMFs - Show incrementally as chunks complete */}
          {showMatchedBmfs.length > 0 && (
            <section>
              <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
                Matched Flows ({showMatchedBmfs.length})
                {isLoading && progress.stage === "stage2" && (
                  <span className="ml-2 text-blue-600 normal-case animate-pulse">Finding more...</span>
                )}
              </h2>
              <div className="grid gap-3">
                {showMatchedBmfs.map((bmf, i) => (
                  <div
                    key={i}
                    className="p-4 border border-gray-200 rounded-lg animate-fadeIn"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-mono text-gray-800">{bmf.bmf_name}</h3>
                      <div className="flex gap-2">
                        {bmf.flow_type && bmf.flow_type !== "both" && (
                          <span className="text-xs font-mono text-gray-400 px-2 py-0.5 rounded bg-gray-50">
                            {bmf.flow_type}
                          </span>
                        )}
                        <span
                          className={`text-xs font-mono px-2 py-0.5 rounded ${confidenceColor[bmf.confidence]}`}
                        >
                          {bmf.confidence}
                        </span>
                      </div>
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

          {/* Unmatched - Only show when complete */}
          {result && result.unmatched_materials.length > 0 && (
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

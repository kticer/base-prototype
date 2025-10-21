import { useState, useEffect, useMemo } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { InboxNavBar } from "../components/inbox/InboxNavBar";
import SubmissionTable, { type Submission } from "../components/inbox/SubmissionTable";
import { validateFolderStructure, safeJsonParse } from "../utils/validation";
import { useNavigate } from "react-router-dom";
import GlobalChatPanel from "../components/chatbot/GlobalChatPanel";
import { PrototypeControls } from "../components/settings/PrototypeControls";
import { FeatureFlagsModal } from "../components/settings/FeatureFlagsModal";
import { useStore } from "../store";

export default function InboxPage() {
  usePageTitle("Submissions – iThenticate Prototype");
  const navigate = useNavigate();
  const { chat } = useStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortKey, setSortKey] = useState<'student' | 'title' | 'submitted' | 'grade' | 'similarity' | 'aiWriting' | 'flags' | 'viewed'>('submitted');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [topTab, setTopTab] = useState<'list' | 'insights'>('list');

useEffect(() => {
  const loadSubmissions = async () => {
    try {
      const res = await fetch("/data/folder_structure.json");
      if (!res.ok) {
        throw new Error(`Failed to load folder structure: ${res.status} ${res.statusText}`);
      }
      
      const rawData = await res.json();
      const data = validateFolderStructure(rawData);
      // Build maps of documentId -> metadata from the tree
      const dateMap: Record<string, string> = {};
      const similarityMap: Record<string, number> = {};
      const collectMetadata = (items: any[]) => {
        for (const it of items) {
          if (it.type === 'document') {
            dateMap[it.id] = it.dateAdded;
            if (typeof it.similarity === 'number') {
              similarityMap[it.id] = it.similarity;
            }
          }
          if (it.type === 'folder' && it.children) collectMetadata(it.children);
        }
      };
      collectMetadata(data as any[]);
      const extractDocuments = (items: any[]): string[] => {
        const ids: string[] = [];
        for (const item of items) {
          if (item.type === "document") ids.push(item.id);
          if (item.type === "folder" && item.children) {
            ids.push(...extractDocuments(item.children));
          }
        }
        return ids;
      };

      const allDocIds = extractDocuments(data as any[]);
      const docMetadataMap: Record<string, { title: string; author: string; similarity?: number }> = {};

      await Promise.all(
        allDocIds.map(async (id) => {
          const url = `/data/documents/${id}.json`;
          console.log(`[fetch] Trying to load ${url}`);
          const res = await fetch(url);
          const text = await res.text();

          if (text.startsWith('<!DOCTYPE html')) {
            console.error(`[ERROR] ${url} returned HTML instead of JSON`);
            throw new Error(`Missing or misnamed JSON file: ${url}`);
          }

          try {
            const json = safeJsonParse(text, (data): data is Record<string, unknown> => typeof data === 'object' && data !== null);
            // Validate that it has the expected document structure
            if (json.title && json.author) {
              docMetadataMap[id] = json as { title: string; author: string; similarity?: number };
            } else {
              console.warn(`[WARNING] Document ${id} missing required metadata`);
              docMetadataMap[id] = { title: 'Unknown', author: 'Unknown' };
            }
          } catch (e) {
            console.error(`[ERROR] Failed to parse JSON from ${url}`, e);
            throw e;
          }
        })
      );

      // Build flat submissions list
      const flat: Submission[] = allDocIds.map((id) => ({
        id,
        title: docMetadataMap[id]?.title ?? 'Unknown',
        author: docMetadataMap[id]?.author ?? 'Unknown',
        // Use similarity from folder_structure.json, not from document JSON
        similarity: typeof similarityMap[id] === 'number' ? similarityMap[id] : null,
        aiWriting: null,
        flags: 0,
        viewedAt: null,
        grade: null,
        submittedAt: dateMap[id] ?? '',
      }));

      // Prototype overrides: ensure specific grading and AI writing patterns for the first 8 submissions
      if (flat.length >= 1) {
        // Choose the first 8 (or fewer if not available)
        const target = flat.slice(0, Math.min(8, flat.length));

        // Grades: 5 graded (2 A's, 1 B, 1 C, plus 1 additional B for prototype completeness)
        const plannedGrades: number[] = [96, 92, 85, 76, 88];
        for (let i = 0; i < target.length && i < plannedGrades.length; i++) {
          target[i].grade = plannedGrades[i];
        }

        // AI writing: 1 at 100%, 4 more between 17% and 30%
        const aiWritingValues: number[] = [100, 28, 25, 22, 17];
        for (let i = 0; i < target.length && i < aiWritingValues.length; i++) {
          target[i].aiWriting = aiWritingValues[i];
        }

        // Special case: the 100% AI writing submission -> 0% similarity and 1 flag
        const idx100 = target.findIndex(s => s.aiWriting === 100);
        if (idx100 >= 0) {
          target[idx100].similarity = 0;
          target[idx100].flags = 1;
        }

        // Write back to flat
        for (let i = 0; i < target.length; i++) {
          flat[i] = target[i];
        }
      }

      // Specific prototype rule: make "The 2018 Golden Globes Jam" ungraded
      try {
        const jamIdx = flat.findIndex((s) => (s.title || '').toLowerCase() === 'the 2018 golden globes jam');
        if (jamIdx >= 0) {
          flat[jamIdx].grade = null;
        }
      } catch {}
      setSubmissions(flat);
      setLoading(false);
    } catch (error) {
      console.error("Error loading folder structure:", error);
      setLoading(false);
    }
  };
  
  loadSubmissions();
}, []);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const getSimilarityScalar = (v: Submission['similarity']): number => {
    if (v === null || typeof v === 'undefined') return Number.NEGATIVE_INFINITY;
    const arr = Array.isArray(v) ? v : [v];
    const nums = arr.map((n) => (typeof n === 'number' ? n : Number(n))).filter((n) => !Number.isNaN(n));
    return nums.length ? Math.max(...nums) : Number.NEGATIVE_INFINITY;
  };

  const getAiWritingScalar = (v: Submission['aiWriting']): number => {
    if (v === null || typeof v === 'undefined') return Number.NEGATIVE_INFINITY;
    const arr = Array.isArray(v) ? v : [v];
    const nums = arr.map((n) => (typeof n === 'number' ? n : Number(n))).filter((n) => !Number.isNaN(n));
    return nums.length ? Math.max(...nums) : Number.NEGATIVE_INFINITY;
  };

  const getGradeScalar = (v: Submission['grade']): number => {
    if (v === null || typeof v === 'undefined') return Number.NEGATIVE_INFINITY;
    const num = typeof v === 'number' ? v : Number(v);
    return Number.isNaN(num) ? Number.NEGATIVE_INFINITY : num;
  };

  const filtered = useMemo(() => {
    const arr = [...submissions];
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const cmpString = (s1: string, s2: string) => s1.localeCompare(s2);
      const dateNum = (iso?: string | null) => {
        if (!iso) return Number.NEGATIVE_INFINITY;
        const t = new Date(iso).getTime();
        return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
      };

      switch (sortKey) {
        case 'student': {
          const c = cmpString(a.author || '', b.author || '');
          if (c !== 0) return c * dir;
          return cmpString(a.title || '', b.title || '') * dir;
        }
        case 'submitted':
          return (dateNum(a.submittedAt) - dateNum(b.submittedAt)) * dir;
        case 'grade':
          return (getGradeScalar(a.grade) - getGradeScalar(b.grade)) * dir;
        case 'similarity':
          return (getSimilarityScalar(a.similarity) - getSimilarityScalar(b.similarity)) * dir;
        case 'aiWriting':
          return (getAiWritingScalar(a.aiWriting ?? null) - getAiWritingScalar(b.aiWriting ?? null)) * dir;
        case 'flags':
          return ((a.flags ?? 0) - (b.flags ?? 0)) * dir;
        case 'viewed':
          return (dateNum(a.viewedAt ?? null) - dateNum(b.viewedAt ?? null)) * dir;
        default:
          return 0;
      }
    });
    return arr;
  }, [submissions, sortKey, sortDir]);

  const paginatedItems = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;

  // Compute metrics for chat context (memoized for performance)
  const inboxMetrics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: submissions.length,
      graded: submissions.filter(s => s.grade !== null && s.grade !== undefined).length,
      ungraded: submissions.filter(s => s.grade === null || s.grade === undefined).length,
      highSimilarity: submissions.filter(s => getSimilarityScalar(s.similarity) > 40).length,
      mediumSimilarity: submissions.filter(s => {
        const sim = getSimilarityScalar(s.similarity);
        return sim >= 20 && sim <= 40;
      }).length,
      lowSimilarity: submissions.filter(s => getSimilarityScalar(s.similarity) < 20).length,
      recentSubmissions: submissions.filter(s => {
        try {
          const submittedDate = new Date(s.submittedAt);
          return submittedDate >= sevenDaysAgo;
        } catch {
          return false;
        }
      }).length,
      avgSimilarity: submissions.length > 0
        ? Math.round((submissions.reduce((sum, s) => sum + (getSimilarityScalar(s.similarity) || 0), 0) / submissions.length) * 10) / 10
        : 0,
    };
  }, [submissions]);

  // Context data for chat (after helper functions are defined)
  const chatContext = {
    screen: 'inbox' as const,
    totalSubmissions: submissions.length,
    selectedCount: selectedIds.size,
    avgSimilarity: inboxMetrics.avgSimilarity,
    // Computed metrics for instant, accurate answers
    metrics: inboxMetrics,
    // Deterministic triage scoring weights (for transparency)
    triageWeights: {
      flagWeight: 100,
      aiHighBonus: 80,
      aiFactor: 0.6,
      simFactor: 0.8,
      simHighBonusThreshold: 40,
      simHighBonus: 20,
      ungradedBonus: 30,
      recencyMaxBonus: 30,
      recencyHalfLifeDays: 7,
    },
    // Submissions with computed priority score and rank (capped to 50)
    submissions: (() => {
      const toScalar = (val: number | number[] | null | undefined) => {
        if (val === null || typeof val === 'undefined') return null;
        return Array.isArray(val) ? Math.max(...val) : Number(val);
      };
      const daysSince = (iso?: string) => {
        if (!iso) return Infinity;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) return Infinity;
        const ms = Date.now() - t;
        return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
      };
      const W = {
        flagWeight: 100,
        aiHighBonus: 80,
        aiFactor: 0.6,
        simFactor: 0.8,
        simHighBonusThreshold: 40,
        simHighBonus: 20,
        ungradedBonus: 30,
        recencyMaxBonus: 30,
        recencyHalfLifeDays: 7,
      };
      const withScores = submissions.map((s) => {
        const sim = getSimilarityScalar(s.similarity);
        const ai = toScalar(s.aiWriting);
        const flags = typeof s.flags === 'number' ? s.flags : 0;
        const ungraded = s.grade === null || typeof s.grade === 'undefined';
        const age = daysSince(s.submittedAt);
        let score = 0;
        score += flags * W.flagWeight;
        if (typeof ai === 'number') score += ai >= 90 ? W.aiHighBonus : ai * W.aiFactor;
        if (sim > Number.NEGATIVE_INFINITY) {
          score += sim * W.simFactor;
          if (sim >= W.simHighBonusThreshold) score += W.simHighBonus;
        }
        if (ungraded) score += W.ungradedBonus;
        const recency = Math.max(0, W.recencyMaxBonus - Math.floor((age / W.recencyHalfLifeDays) * W.recencyMaxBonus));
        score += recency;
        return { s, score };
      });
      const ranked = withScores
        .sort((a, b) => b.score - a.score || (new Date(b.s.submittedAt).getTime() - new Date(a.s.submittedAt).getTime()))
        .map((entry, idx) => ({ entry, rank: idx + 1 }));
      return ranked.map(({ entry, rank }) => ({
        id: entry.entry?.s?.id ?? entry.s.id,
        title: entry.entry?.s?.title ?? entry.s.title,
        author: entry.entry?.s?.author ?? entry.s.author,
        similarity: getSimilarityScalar(entry.entry?.s?.similarity ?? entry.s.similarity),
        aiWriting: toScalar(entry.entry?.s?.aiWriting ?? entry.s.aiWriting),
        flags: typeof (entry.entry?.s?.flags ?? entry.s.flags) === 'number' ? (entry.entry?.s?.flags ?? entry.s.flags)! : 0,
        grade: entry.entry?.s?.grade ?? entry.s.grade,
        submittedAt: entry.entry?.s?.submittedAt ?? entry.s.submittedAt,
        priorityScore: Math.round(entry.score * 10) / 10,
        priorityRank: rank,
      })).slice(0, 50);
    })(),
    // Convenience: explicit priority order as IDs and brief summary
    topPriorityIds: (() => {
      const toScalar = (val: number | number[] | null | undefined) => {
        if (val === null || typeof val === 'undefined') return null;
        return Array.isArray(val) ? Math.max(...val) : Number(val);
      };
      const daysSince = (iso?: string) => {
        if (!iso) return Infinity;
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) return Infinity;
        const ms = Date.now() - t;
        return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
      };
      const W = {
        flagWeight: 100,
        aiHighBonus: 80,
        aiFactor: 0.6,
        simFactor: 0.8,
        simHighBonusThreshold: 40,
        simHighBonus: 20,
        ungradedBonus: 30,
        recencyMaxBonus: 30,
        recencyHalfLifeDays: 7,
      };
      return submissions
        .map((s) => {
          const sim = getSimilarityScalar(s.similarity);
          const ai = toScalar(s.aiWriting);
          const flags = typeof s.flags === 'number' ? s.flags : 0;
          const ungraded = s.grade === null || typeof s.grade === 'undefined';
          const age = daysSince(s.submittedAt);
          let score = 0;
          score += flags * W.flagWeight;
          if (typeof ai === 'number') score += ai >= 90 ? W.aiHighBonus : ai * W.aiFactor;
          if (sim > Number.NEGATIVE_INFINITY) {
            score += sim * W.simFactor;
            if (sim >= W.simHighBonusThreshold) score += W.simHighBonus;
          }
          if (ungraded) score += W.ungradedBonus;
          const recency = Math.max(0, W.recencyMaxBonus - Math.floor((age / W.recencyHalfLifeDays) * W.recencyMaxBonus));
          score += recency;
          return { id: s.id, score, submittedAt: s.submittedAt };
        })
        .sort((a, b) => b.score - a.score || (new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
        .map((x) => x.id)
        .slice(0, 50);
    })(),
  };

  // Dynamic, context-aware suggestions based on inbox state
  const promptSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    // Priority: Ungraded submissions
    if (inboxMetrics.ungraded > 0) {
      suggestions.push(`Which of the ${inboxMetrics.ungraded} ungraded submissions should I prioritize?`);
    }

    // High-risk submissions
    if (inboxMetrics.highSimilarity > 0) {
      suggestions.push(`Show me the ${inboxMetrics.highSimilarity} high-risk submission${inboxMetrics.highSimilarity > 1 ? 's' : ''} that need immediate review`);
    }

    // Recent submissions needing attention
    if (inboxMetrics.recentSubmissions > 0) {
      suggestions.push(`Help me plan my grading for the ${inboxMetrics.recentSubmissions} recent submission${inboxMetrics.recentSubmissions > 1 ? 's' : ''}`);
    }

    // Overall workload management
    if (inboxMetrics.ungraded > 5) {
      suggestions.push("What's a realistic grading schedule for my workload?");
    }

    // Comparison and patterns
    if (submissions.length > 10) {
      suggestions.push("Are there any patterns in similarity scores I should investigate?");
    }

    // Selected items actions
    if (selectedIds.size > 0) {
      suggestions.push(`What should I do with these ${selectedIds.size} selected submissions?`);
    }

    // If no specific suggestions, offer general ones
    if (suggestions.length === 0) {
      suggestions.push("How is my class performing overall?");
      suggestions.push("Which students might need academic integrity follow-up?");
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }, [inboxMetrics, submissions.length, selectedIds.size]);

  const areAllSelected = filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id));
  const toggleSelectAll = () => {
    if (areAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((item) => item.id)));
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  // No padding hack; chat integrates into layout below nav bars

  return (
    <div className="min-h-screen w-full relative">
      {/* Prototype Controls */}
      <PrototypeControls />

      {/* Main content area */}
      <div className="bg-gray-50">
        <InboxNavBar title="Submissions" onSearchChange={() => {}} screen="inbox" />
        <div className="bg-white border-b px-6 py-2 flex gap-6 text-sm">
          <button
            className={`font-semibold pb-1 whitespace-nowrap ${
              topTab === 'list' ? 'border-b-2 border-blue-500 text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setTopTab('list')}
          >
            Submission List
          </button>
          <button
            className={`font-semibold pb-1 whitespace-nowrap ${
              topTab === 'insights' ? 'border-b-2 border-blue-500 text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setTopTab('insights')}
          >
            Insights
          </button>
        </div>
        <div className="px-8 pb-8 pt-4">
          <div className="flex items-stretch gap-0">
            <div className="flex-1 min-w-0">
            {topTab === 'list' && (
            <>
          {/* Action Toolbar */}
          <div className="bg-white px-4 py-2 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-700 font-medium">Manage submissions</div>
              <div className="flex items-center gap-2">
                {["Download", "Delete"].map((label) => (
                  <button
                    key={label}
                    disabled={selectedIds.size === 0}
                    className={`text-sm px-3 py-1.5 rounded border ${
                      selectedIds.size === 0
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SubmissionTable
            items={paginatedItems}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onToggleSelectAll={toggleSelectAll}
            areAllSelected={areAllSelected}
            onOpen={(id) => {
              const url = `/data/documents/${id}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            onOpenGrading={(id) => {
              const url = `/data/documents/${id}?tab=grading`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={(key) => {
              setCurrentPage(1);
              if (key === sortKey) {
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
              } else {
                setSortKey(key);
                setSortDir('asc');
              }
            }}
          />
          <div className="flex justify-end items-center mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-6">
              Page {currentPage} of {totalPages}
              <button
                className="ml-3 px-2 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ◄
              </button>
              <button
                className="ml-2 px-2 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                ►
              </button>
            </div>
          </div>
            </>
            )}

            {topTab === 'insights' && (
              <InsightsPanel submissions={filtered} />
            )}
            </div>

            {/* Chat integrated as sibling in layout (shrink mode) */}
            <GlobalChatPanel
              contextData={chatContext}
              promptSuggestions={promptSuggestions}
            />
          </div>
        </div>
      </div>

      {/* Feature Flags Modal */}
      <FeatureFlagsModal />
    </div>
  );
}

function InsightsPanel({ submissions }: { submissions: Submission[] }) {
  const withSim = submissions.filter((s) => typeof s.similarity !== 'undefined' && s.similarity !== null);
  const flattenSims: number[] = withSim
    .flatMap((s) => (Array.isArray(s.similarity) ? s.similarity : [s.similarity as number]))
    .filter((n) => typeof n === 'number') as number[];
  const avgSim = flattenSims.length ? Math.round((flattenSims.reduce((a, n) => a + n, 0) / flattenSims.length) * 10) / 10 : 0;
  const distribution = [
    { label: '0–24%', count: withSim.filter((d) => topVal(d.similarity) < 25).length },
    { label: '25–49%', count: withSim.filter((d) => topVal(d.similarity) >= 25 && topVal(d.similarity) < 50).length },
    { label: '50–74%', count: withSim.filter((d) => topVal(d.similarity) >= 50 && topVal(d.similarity) < 75).length },
    { label: '75–100%', count: withSim.filter((d) => topVal(d.similarity) >= 75).length },
  ];

  function topVal(v: Submission['similarity']): number {
    if (v === null || typeof v === 'undefined') return -1;
    const arr = Array.isArray(v) ? v : [v];
    const vals = arr.filter((n): n is number => typeof n === 'number');
    return vals.length ? Math.max(...vals) : -1;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white border rounded p-4">
        <div className="text-sm text-gray-500">Total Submissions</div>
        <div className="text-2xl font-semibold">{submissions.length}</div>
      </div>
      <div className="bg-white border rounded p-4">
        <div className="text-sm text-gray-500">Average Similarity</div>
        <div className="text-2xl font-semibold">{avgSim}%</div>
      </div>
      <div className="bg-white border rounded p-4">
        <div className="text-sm text-gray-500">Distribution</div>
        <div className="mt-2 space-y-1">
          {distribution.map((b) => (
            <div key={b.label} className="flex justify-between text-sm">
              <span className="text-gray-600">{b.label}</span>
              <span className="font-medium">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-3 bg-white border rounded p-4">
        <div className="text-sm text-gray-600">
          More detailed insights (per-assignment, per-student, common sources) can be added here.
        </div>
      </div>
    </div>
  );
}

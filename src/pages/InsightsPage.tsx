import { useEffect, useMemo, useState } from 'react';
import { InboxNavBar } from '../components/inbox/InboxNavBar';
import InboxTabs from '../components/inbox/InboxTabs';
import { usePageTitle } from '../hooks/usePageTitle';
import type { FolderOrDocument } from '../types';
import GlobalChatPanel from '../components/chatbot/GlobalChatPanel';
import { PrototypeControls } from '../components/settings/PrototypeControls';
import { FeatureFlagsModal } from '../components/settings/FeatureFlagsModal';
import { useStore } from '../store';

export default function InsightsPage() {
  usePageTitle('Insights – iThenticate Prototype');
  const { chat } = useStore();
  const [rootItems, setRootItems] = useState<FolderOrDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/data/folder_structure.json');
        if (!res.ok) throw new Error(`Failed to load folder structure: ${res.status}`);
        const data = await res.json();

        // Collect document metadata
        const extractDocs = (items: FolderOrDocument[]): { id: string }[] => {
          const list: { id: string }[] = [];
          for (const item of items) {
            if ((item as any).type === 'document') list.push({ id: (item as any).id });
            if ((item as any).type === 'folder' && (item as any).children) {
              list.push(...extractDocs((item as any).children));
            }
          }
          return list;
        };
        const docs = extractDocs(data);

        const meta: Array<{ id: string; title: string; author: string; similarity?: number }> = [];
        await Promise.all(
          docs.map(async (d) => {
            const r = await fetch(`/data/documents/${d.id}.json`);
            const t = await r.text();
            if (t.startsWith('<!DOCTYPE html')) return; // skip bad files in prototype
            try {
              const j = JSON.parse(t);
              meta.push({ id: d.id, title: j.title ?? 'Unknown', author: j.author ?? 'Unknown', similarity: j.similarity });
            } catch {
              // ignore parse errors in prototype
            }
          })
        );

        // Attach similarity if present at item level preferred
        setRootItems(data);
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    // flatten documents from tree
    const flatten = (items: FolderOrDocument[]): any[] =>
      items.flatMap((it: any) => (it.type === 'folder' ? flatten(it.children || []) : [ it ]));
    const docs = flatten(rootItems);

    const total = docs.length;
    const withSim = docs.filter((d: any) => typeof d.similarity === 'number');
    const avgSim = withSim.length ? Math.round((withSim.reduce((a: number, d: any) => a + (d.similarity || 0), 0) / withSim.length) * 10) / 10 : 0;

    // simple top sources aggregation from document-level similarity (placeholder)
    const distribution = [
      { label: '0–24%', count: withSim.filter((d: any) => d.similarity < 25).length },
      { label: '25–49%', count: withSim.filter((d: any) => d.similarity >= 25 && d.similarity < 50).length },
      { label: '50–74%', count: withSim.filter((d: any) => d.similarity >= 50 && d.similarity < 75).length },
      { label: '75–100%', count: withSim.filter((d: any) => d.similarity >= 75).length },
    ];

    return { total, avgSim, distribution };
  }, [rootItems]);

  // Context data for chat
  const chatContext = {
    screen: 'insights',
    stats,
    totalDocuments: stats.total,
    avgSimilarity: stats.avgSim,
  };

  const promptSuggestions = [
    "Summarize the similarity insights",
    "How many submissions have high similarity?",
    "What's the distribution of similarity scores?",
  ];

  return (
    <div className="flex min-h-screen w-screen relative">
      {/* Prototype Controls */}
      <PrototypeControls />

      {/* Main content area */}
      <div
        className="flex-1 bg-gray-50 w-full transition-all duration-300"
        style={chat.isOpen && chat.displayMode === 'shrink' ? { marginRight: `${chat.panelWidth}px` } : {}}
      >
        <InboxNavBar title="My Files" onSearchChange={() => {}} screen="insights" />
        <InboxTabs />

        <div className="px-8 pb-8 pt-6">
          {loading && <div>Loading insights...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded p-4">
                <div className="text-sm text-gray-500">Total Submissions</div>
                <div className="text-2xl font-semibold">{stats.total}</div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-sm text-gray-500">Average Similarity</div>
                <div className="text-2xl font-semibold">{stats.avgSim}%</div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-sm text-gray-500">Distribution</div>
                <div className="mt-2 space-y-1">
                  {stats.distribution.map((b) => (
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
          )}
        </div>
      </div>

      {/* Global Chat Panel */}
      <GlobalChatPanel
        contextData={chatContext}
        promptSuggestions={promptSuggestions}
      />

      {/* Feature Flags Modal */}
      <FeatureFlagsModal />
    </div>
  );
}

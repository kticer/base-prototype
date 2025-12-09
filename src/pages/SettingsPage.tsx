import { useEffect, useState } from 'react';
import { InboxNavBar } from '../components/inbox/InboxNavBar';
import InboxTabs from '../components/inbox/InboxTabs';
import { usePageTitle } from '../hooks/usePageTitle';
import { PrototypeControls } from '../components/settings/PrototypeControls';
import { FeatureFlagsModal } from '../components/settings/FeatureFlagsModal';

type AssignmentSettings = {
  assignmentName: string;
  dueDate: string;
  allowLateSubmissions: boolean;
  similarityThreshold: number;
  enableAIWritingCheck: boolean;
  allowedFileTypes: string;
};

const DEFAULT_SETTINGS: AssignmentSettings = {
  assignmentName: '',
  dueDate: '',
  allowLateSubmissions: false,
  similarityThreshold: 20,
  enableAIWritingCheck: true,
  allowedFileTypes: 'pdf,docx,txt',
};

export default function SettingsPage() {
  usePageTitle('Settings – iThenticate Prototype');
  const [settings, setSettings] = useState<AssignmentSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ith_assignment_settings');
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem('ith_assignment_settings', JSON.stringify(settings));
    setSaved('Settings saved');
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="flex min-h-screen w-screen relative">
      {/* Prototype Controls */}
      <PrototypeControls />

      {/* Main content area */}
      <div className="flex-1 bg-gray-50 w-full transition-all duration-300">
        <InboxNavBar title="Settings" onSearchChange={() => {}} />
        <InboxTabs />
        <div className="px-8 pb-8 pt-6">
          <div className="max-w-3xl bg-white border rounded p-6 space-y-5">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Assignment Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={settings.assignmentName}
                onChange={(e) => setSettings({ ...settings, assignmentName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={settings.dueDate}
                  onChange={(e) => setSettings({ ...settings, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Similarity Threshold (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full border rounded px-3 py-2"
                  value={settings.similarityThreshold}
                  onChange={(e) => setSettings({ ...settings, similarityThreshold: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="late"
                type="checkbox"
                checked={settings.allowLateSubmissions}
                onChange={(e) => setSettings({ ...settings, allowLateSubmissions: e.target.checked })}
              />
              <label htmlFor="late" className="text-sm text-gray-700">Allow late submissions</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="ai"
                type="checkbox"
                checked={settings.enableAIWritingCheck}
                onChange={(e) => setSettings({ ...settings, enableAIWritingCheck: e.target.checked })}
              />
              <label htmlFor="ai" className="text-sm text-gray-700">Enable AI writing checks</label>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Allowed File Types (comma-separated)</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={settings.allowedFileTypes}
                onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Settings</button>
              {saved && <span className="text-green-600 text-sm">{saved}</span>}
            </div>
            <div className="text-xs text-gray-500">These settings are stored locally for the prototype.</div>
          </div>
        </div>
      </div>

      {/* Feature Flags Modal */}
      <FeatureFlagsModal />
    </div>
  );
}

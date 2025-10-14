import { useState } from "react";
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useStore } from "../../store";
import { StateManagementPanel } from "./StateManagementPanel";

interface FeedbackPanelProps {
  activeTab: string;
}

export function FeedbackPanel({ activeTab }: FeedbackPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuickMarkSet, setSelectedQuickMarkSet] = useState("6th-8th Science Argument (Common Core)");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Summary Comment": true,
    "Video Summary": false,
    "Pinned Feedback": false,
  });

  // Get summary comment from store
  const summaryComment = useStore((state) => state.summaryComment);
  const updateSummaryComment = useStore((state) => state.updateSummaryComment);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const quickMarkCategories = [
    {
      name: "Awk.",
      color: "bg-blue-100 text-blue-800",
      tags: ["Improve paraphrasing", "Ital.", "Missing Quote", "Needs topic", "P/A Agreement"]
    },
    {
      name: "Cap. Error",
      color: "bg-purple-100 text-purple-800",
      tags: ["C/S", "CutQ", "Explain your Evidence", "Float", "Frag."]
    },
    {
      name: "C/S",
      color: "bg-green-100 text-green-800",
      tags: ["Hyph.", "Improve paraphrasing", "Insert", "Ital.", "Missing Quote"]
    },
    {
      name: "Frag.",
      color: "bg-red-100 text-red-800",
      tags: ["Needs topic", "P/A Agreement", "Run-on", "Simplify", "S/V Agreement"]
    },
    {
      name: "Weak transition",
      color: "bg-orange-100 text-orange-800",
      tags: ["Tense shift", "Transpose", "Weak transition"]
    }
  ];

  if (activeTab === "QuickMarks") {
    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search all QuickMarks"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* QuickMark Set Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">QuickMark set</label>
          <select
            value={selectedQuickMarkSet}
            onChange={(e) => setSelectedQuickMarkSet(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="6th-8th Science Argument (Common Core)">6th-8th Science Argument (Common Core)</option>
            <option value="9th-12th Science Argument">9th-12th Science Argument</option>
            <option value="General Writing">General Writing</option>
          </select>
        </div>

        {/* Create QuickMark Button */}
        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Create QuickMark
        </button>

        {/* Sorted by label */}
        <div className="text-sm text-gray-600">
          Sorted by: A - Z
        </div>

        {/* QuickMark Categories */}
        <div className="space-y-2">
          {quickMarkCategories.map((category) => (
            <div key={category.name} className="space-y-1">
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                {category.name}
              </div>
              <div className="flex flex-wrap gap-1">
                {category.tags.map((tag) => (
                  <button
                    key={tag}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (activeTab === "Summary") {
    return (
      <div className="space-y-4">
        {/* Summary Comment Section */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection("Summary Comment")}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-700">Summary Comment</span>
            {expandedSections["Summary Comment"] ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections["Summary Comment"] && (
            <div className="p-4 bg-white border rounded-lg">
              <textarea
                value={summaryComment}
                onChange={(e) => updateSummaryComment(e.target.value)}
                placeholder="Your thesis could be strengthened with some more support. Support for your thesis should come from primary (original documents, interviews, and personal experiences) and secondary (information that has been processed or interpreted by someone else) sources..."
                rows={6}
                maxLength={1000}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex justify-between items-center">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View full summary comment ↓
                </button>
                <div className="text-xs text-gray-500">
                  {summaryComment.length}/1000 characters
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Summary Section */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection("Video Summary")}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-700">Video Summary</span>
            {expandedSections["Video Summary"] ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections["Video Summary"] && (
            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">
                Video summary content would appear here
              </div>
            </div>
          )}
        </div>

        {/* Pinned Feedback Section */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection("Pinned Feedback")}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-700">Pinned Feedback</span>
            {expandedSections["Pinned Feedback"] ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections["Pinned Feedback"] && (
            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">
                Pinned feedback content would appear here
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
import { useState } from 'react';

interface AIWritingPanelProps {
  /** Overall AI detection percentage (0-100) */
  overallPercentage: number;
  /** Number of pages in the document */
  totalPages: number;
  /** AI-generated only segments */
  aiGeneratedOnly: {
    count: number;
    percentage: number;
  };
  /** AI-paraphrased segments */
  aiParaphrased: {
    count: number;
    percentage: number;
  };
  /** Per-page breakdown for the visualization bar */
  pageBreakdown?: Array<{
    page: number;
    aiPercentage: number;
  }>;
}

export function AIWritingPanel({
  overallPercentage,
  totalPages,
  aiGeneratedOnly,
  aiParaphrased,
  pageBreakdown,
}: AIWritingPanelProps) {
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  return (
    <div className="px-4 py-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">{overallPercentage}% detected as AI</h2>
          <button className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-600 hover:bg-gray-100">
            <span className="text-sm font-bold">i</span>
          </button>
        </div>
        <p className="text-gray-600 text-base">
          The percentage indicates the combined amount of likely AI-generated text as well as likely AI-generated text that was also likely AI-paraphrased.
        </p>
      </div>

      {/* Submission Breakdown */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="2" cy="6" r="1" fill="currentColor" />
            <circle cx="2" cy="12" r="1" fill="currentColor" />
            <circle cx="2" cy="18" r="1" fill="currentColor" />
          </svg>
          Submission Breakdown
        </h3>

        {/* Visual bar */}
        <div className="mb-2">
          <div className="flex h-12 rounded overflow-hidden border border-gray-300">
            {pageBreakdown && pageBreakdown.length > 0 ? (
              pageBreakdown.map((page, idx) => (
                <div
                  key={idx}
                  className="flex-1 relative group"
                  style={{
                    backgroundColor: page.aiPercentage > 80 ? '#67C7D4' :
                                      page.aiPercentage > 50 ? '#8DD4DE' :
                                      page.aiPercentage > 20 ? '#B3E1E8' : '#D9EEF2',
                  }}
                  title={`Page ${page.page}: ${page.aiPercentage}% AI`}
                >
                  {/* Divider between pages */}
                  {idx < pageBreakdown.length - 1 && (
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-white opacity-50" />
                  )}
                </div>
              ))
            ) : (
              // Default: show all pages as high AI
              Array.from({ length: totalPages }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-[#67C7D4]"
                  style={{
                    borderRight: idx < totalPages - 1 ? '1px solid rgba(255,255,255,0.5)' : 'none',
                  }}
                />
              ))
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>page 1</span>
            <span>page {totalPages}</span>
          </div>
        </div>

        {/* AI-generated only */}
        <div className="flex items-start gap-3 mb-4 p-3 bg-gray-50 rounded">
          <div className="w-12 h-12 rounded-full bg-[#67C7D4] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-1">
              <h4 className="font-semibold text-base">
                {aiGeneratedOnly.count} AI-generated only
              </h4>
              <span className="text-xl font-bold">{aiGeneratedOnly.percentage}%</span>
            </div>
            <p className="text-sm text-gray-600">
              Likely AI-generated text from a large-language model.
            </p>
          </div>
        </div>

        {/* AI-paraphrased */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
          <div className="w-12 h-12 rounded-full bg-[#9B7EBD] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-1">
              <h4 className="font-semibold text-base">
                {aiParaphrased.count} AI-generated text that was AI-paraphrased
              </h4>
              <span className="text-xl font-bold">{aiParaphrased.percentage}%</span>
            </div>
            <p className="text-sm text-gray-600">
              Likely AI-generated text that was likely revised using an AI-paraphrase tool or word spinner.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
          <h3 className="font-bold text-base mb-2">FAQs</h3>
          <a href="#" className="text-blue-600 text-xs hover:underline inline-flex items-center gap-1 whitespace-nowrap">
            View FAQs
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="font-bold text-base mb-2">Resources</h3>
          <a href="#" className="text-blue-600 text-xs hover:underline inline-flex items-center gap-1 whitespace-nowrap">
            Explore
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="font-bold text-base mb-2">Guides</h3>
          <a href="#" className="text-blue-600 text-xs hover:underline inline-flex items-center gap-1 whitespace-nowrap">
            View guides
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="text-blue-600 text-sm font-medium mb-2 flex items-center gap-1 hover:underline"
        >
          {showDisclaimer ? 'Hide Disclaimer' : 'Show Disclaimer'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d={showDisclaimer ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
        </button>
        {showDisclaimer && (
          <p className="text-sm text-gray-600 leading-relaxed">
            Our AI writing assessment is designed to help educators identify text that might be prepared by a generative AI tool. Our AI writing assessment may not always be accurate (i.e., our AI models may produce either false positive results or false negative results), so it should not be used as the sole basis for adverse actions against a student. It takes further scrutiny and human judgment in conjunction with an organization's application of its specific academic policies to determine whether any academic misconduct has occurred.
          </p>
        )}
      </div>
    </div>
  );
}

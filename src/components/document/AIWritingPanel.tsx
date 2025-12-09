import {
  SmartRobotIcon,
  ParaphraseAiIcon,
  MultipleChoiceIcon,
  InformationIcon,
} from './AIWritingIcons';

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
}: AIWritingPanelProps) {
  return (
    <div className="px-4 py-4 bg-surface border border-surface-outline shadow-elevation-2">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-headline-small text-surface-on-surface">
            {overallPercentage}% detected as AI
          </h2>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <InformationIcon className="w-6 h-6 text-surface-on-surface-variant-1" />
          </button>
        </div>
        <p className="text-body-medium text-surface-on-surface">
          The percentage indicates the combined amount of likely AI-generated text as well as likely AI-generated text that was also likely revised by AI.
        </p>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-surface-outline mb-4" />

      {/* Submission Breakdown */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MultipleChoiceIcon className="w-6 h-6 text-surface-on-surface-variant-1" />
            <h3 className="text-title-medium text-surface-on-surface">
              Submission Breakdown
            </h3>
          </div>

          {/* Visual bar */}
          <div className="flex flex-col">
            <div className="h-7 border border-surface-outline rounded relative">
              {/* Background segments */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 border-surface-outline"
                    style={{
                      borderRight: idx < totalPages - 1 ? '1px solid' : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Colored gradient segments (example positioning - adjust based on actual data) */}
              <div
                className="absolute top-[1px] bottom-[1px] rounded bg-gradient-to-b from-[#bc92ff] to-[#741dff] opacity-70"
                style={{ left: '27.25%', width: '19.62%' }}
              />
              <div
                className="absolute top-[1px] bottom-[1px] rounded bg-gradient-to-b from-[#bc92ff] to-[#741dff] opacity-70"
                style={{ left: '52.66%', width: '8.34%' }}
              />
              <div
                className="absolute top-[1px] bottom-[1px] rounded bg-gradient-to-b from-[#8beeff] to-[#00b3d1] opacity-70"
                style={{ left: '69.26%', width: '8.4%' }}
              />
            </div>

            {/* Page labels */}
            <div className="flex justify-between mt-0">
              <span className="text-body-small-italic text-surface-outline-dark">page 1</span>
              <span className="text-body-small-italic text-surface-on-surface-variant-2">page {totalPages}</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {/* AI-generated only */}
          <div className="flex gap-6 items-start px-2 py-1 rounded-lg">
            <div className="flex gap-2 items-start flex-1">
              <div className="w-8 h-8 rounded-full bg-custom-cyan-container flex items-center justify-center flex-shrink-0">
                <SmartRobotIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-label-large text-surface-on-surface flex-shrink-0">
                {aiGeneratedOnly.count}
              </div>
              <div className="flex-1">
                <h4 className="text-label-large text-surface-on-surface-variant-2">
                  AI-generated only
                </h4>
                <p className="text-body-medium text-surface-on-surface-variant-2">
                  Likely AI-generated text from a large-language model.
                </p>
              </div>
            </div>
            <div className="text-label-medium text-surface-on-surface flex-shrink-0">
              {aiGeneratedOnly.percentage}%
            </div>
          </div>

          {/* AI-paraphrased */}
          <div className="flex gap-6 items-start px-2 py-1 rounded-lg">
            <div className="flex gap-2 items-start flex-1">
              <div className="w-8 h-8 rounded-full bg-custom-purple-container flex items-center justify-center flex-shrink-0">
                <ParaphraseAiIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-label-large text-surface-on-surface flex-shrink-0">
                {aiParaphrased.count}
              </div>
              <div className="flex-1">
                <h4 className="text-label-large text-surface-on-surface-variant-2">
                  AI-generated text that was revised by AI
                </h4>
                <p className="text-body-medium text-surface-on-surface-variant-2">
                  Likely AI-generated text that was likely revised using an AI paraphrase tool or AI bypasser tool.
                </p>
              </div>
            </div>
            <div className="text-label-medium text-surface-on-surface flex-shrink-0">
              {aiParaphrased.percentage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

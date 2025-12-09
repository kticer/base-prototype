import { useState } from 'react';
import {
  HelpIcon,
  BookIcon,
  StarIcon,
  OpenNewWindowIcon,
  ArrowDropUpIcon,
} from './AIWritingIcons';

export function AIWritingLearnMore() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Cards Grid */}
      <div className="flex flex-wrap gap-4 justify-center py-2">
        {/* FAQs Card */}
        <div className="flex-1 min-w-0 bg-primary-on-primary flex flex-col gap-6 items-center px-2 py-6 rounded-lg shadow-elevation-1">
          <div className="flex flex-col gap-2 items-center w-full">
            <HelpIcon className="w-9 h-9 text-surface-on-surface-variant-1" />
            <h3 className="text-title-large text-surface-on-surface-variant-1 text-center">
              FAQs
            </h3>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-center w-full">
            <a
              href="https://www.turnitin.com/products/features/ai-writing-detection/faq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-medium text-semantic-informative underline decoration-solid hover:text-[#005299]"
            >
              View FAQs
            </a>
            <OpenNewWindowIcon className="w-5 h-5 text-semantic-informative" />
          </div>
        </div>

        {/* Resources Card */}
        <div className="flex-1 min-w-0 bg-primary-on-primary flex flex-col gap-6 items-center px-2 py-6 rounded-lg shadow-elevation-1">
          <div className="flex flex-col gap-2 items-center w-full">
            <BookIcon className="w-9 h-9 text-surface-on-surface-variant-1" />
            <h3 className="text-title-large text-surface-on-surface-variant-1 text-center">
              Resources
            </h3>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-center w-full">
            <a
              href="https://www.turnitin.com/resources/academic-integrity-in-the-age-of-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-medium text-semantic-informative underline decoration-solid hover:text-[#005299]"
            >
              Explore
            </a>
            <OpenNewWindowIcon className="w-5 h-5 text-semantic-informative" />
          </div>
        </div>

        {/* Guides Card */}
        <div className="flex-1 min-w-0 bg-primary-on-primary flex flex-col gap-6 items-center px-2 py-6 rounded-lg shadow-elevation-1">
          <div className="flex flex-col gap-2 items-center w-full">
            <StarIcon className="w-9 h-9 text-surface-on-surface-variant-1" />
            <h3 className="text-title-large text-surface-on-surface-variant-1 text-center">
              Guides
            </h3>
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-center w-full">
            <a
              href="https://help.turnitin.com/ai-writing-detection.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-medium text-semantic-informative underline decoration-solid hover:text-[#005299]"
            >
              View guides
            </a>
            <OpenNewWindowIcon className="w-5 h-5 text-semantic-informative" />
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="flex flex-col w-full">
        <button
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="flex h-8 items-center justify-center min-w-[64px] p-2 rounded-lg hover:bg-gray-100"
        >
          <div className="flex items-start px-2">
            <span className="text-label-medium text-semantic-informative text-center">
              {showDisclaimer ? 'Hide Disclaimer' : 'Show Disclaimer'}
            </span>
          </div>
          <div className="flex items-center justify-center w-3">
            <ArrowDropUpIcon
              className={`w-5 h-5 text-semantic-informative transition-transform ${
                showDisclaimer ? '' : 'rotate-180'
              }`}
            />
          </div>
        </button>

        {showDisclaimer && (
          <div className="flex px-4 py-2 w-full">
            <p className="text-body-small text-surface-on-surface">
              Our AI writing assessment is designed to help educators identify text that might
              be prepared by a generative AI tool. Our AI writing assessment may not always be
              accurate (it may misidentify writing that is likely AI generated as AI generated
              and AI paraphrased or AI bypassed or likely AI generated and AI paraphrased or
              AI bypassed writing as only AI generated), so it should not be used as the sole
              basis for adverse actions against a student. It takes further scrutiny and human
              judgment in conjunction with an organization's application of its specific
              academic policies to determine whether any academic misconduct has occurred.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

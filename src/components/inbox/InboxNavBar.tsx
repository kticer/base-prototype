import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpIcon } from '../document/HeaderIcons';

// Simple icon components for the header
function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.1667 2.49993C14.3856 2.28106 14.6454 2.10744 14.9314 1.98899C15.2173 1.87054 15.5238 1.80957 15.8334 1.80957C16.1429 1.80957 16.4494 1.87054 16.7353 1.98899C17.0213 2.10744 17.2811 2.28106 17.5 2.49993C17.7189 2.7188 17.8925 2.97863 18.011 3.2646C18.1294 3.55057 18.1904 3.85706 18.1904 4.16659C18.1904 4.47612 18.1294 4.78262 18.011 5.06859C17.8925 5.35455 17.7189 5.61439 17.5 5.83326L6.25002 17.0833L2.08335 18.3333L3.33335 14.1666L14.5834 2.91659L14.1667 2.49993Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AppsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.33333 3.33325H8.33333V8.33325H3.33333V3.33325Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.6667 3.33325H16.6667V8.33325H11.6667V3.33325Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.6667 11.6667H16.6667V16.6667H11.6667V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.33333 11.6667H8.33333V16.6667H3.33333V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ExpandMoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.59 8.59L12 13.17L7.41 8.59L6 10L12 16L18 10L16.59 8.59Z"/>
    </svg>
  );
}

type InboxNavBarProps = {
  title?: string;
  subtitle?: string;
  onSearchChange?: (value: string) => void;
};

export const InboxNavBar: React.FC<InboxNavBarProps> = ({
  title = "Student submissions",
  subtitle = "The Impact of Climate Change on Biodiversity",
  onSearchChange
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-variant-1 border-b-2 border-surface-outline px-4 py-2 flex items-center">
      <div className="flex items-center gap-6 w-full max-w-[1408px] mx-auto">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center shrink-0 hover:opacity-80 transition-opacity"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Turnitin"
            className="h-10 w-auto select-none"
            draggable={false}
          />
        </button>

        {/* Divider */}
        <div className="h-full w-0.5 bg-surface-outline" />

        {/* Title & Subtitle */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h1 className="font-heading text-headline-small text-surface-on-surface-variant-1">
            {title}
          </h1>
          <div className="flex items-center gap-1">
            <span className="font-sans font-semibold text-[16px] leading-6 tracking-[0.25px] text-surface-on-surface-variant-2">
              {subtitle}
            </span>
            <button className="hover:bg-black/5 rounded-lg p-0.5 transition-colors">
              <ExpandMoreIcon className="w-6 h-6 text-surface-on-surface-variant-2" />
            </button>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Edit Settings */}
          <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl hover:bg-black/5 transition-colors">
            <EditIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-small text-surface-on-surface-variant-1 leading-4">
              Edit Settings
            </span>
          </button>

          {/* Divider */}
          <div className="h-10 w-0.5 bg-surface-outline" />

          {/* Tools */}
          <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl hover:bg-black/5 transition-colors">
            <AppsIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-small text-surface-on-surface-variant-1 leading-4">
              Tools
            </span>
          </button>

          {/* Help */}
          <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl hover:bg-black/5 transition-colors">
            <HelpIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-small text-surface-on-surface-variant-1 leading-4">
              Help
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

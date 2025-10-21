import { useRef, useEffect } from 'react';
import { DocumentPageWithBadges } from './DocumentPageWithBadges';
import { FloatingCommentCards } from '../feedback/FloatingCommentCards';
import DocumentPageControls from './DocumentPageControls';
import type { DocumentData } from '../../types';

interface DocumentContentProps {
  doc: DocumentData;
  pages: React.ReactNode[];
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  currentPage: number;
  onCurrentPageChange: (page: number) => void;
  wordCount: number;
  paperOffset: number;
  showComments: boolean;
  scale: number;
}

export function DocumentContent({
  doc,
  pages,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  currentPage,
  onCurrentPageChange,
  wordCount,
  paperOffset,
  showComments,
  scale,
}: DocumentContentProps) {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // IntersectionObserver to update currentPage on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibleEntries.length > 0) {
          const index = pageRefs.current.findIndex(
            (ref) => ref === visibleEntries[0].target,
          );
          if (index !== -1) {
            onCurrentPageChange(index + 1);
          }
        }
      },
      {
        root: document.querySelector('.overflow-auto'),
        threshold: 0.6,
      },
    );

    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pages, onCurrentPageChange]);

  // Calculate the combined transform for zoom and scale
  const combinedScale = (zoom / 100) * scale;

  return (
    <div
      className="absolute inset-0 overflow-auto p-3 md:p-6 bg-gray-50 scroll-smooth"
      style={{
        paddingRight: showComments ? '340px' : '24px',
      }}
    >
      <div className="w-full flex justify-center relative">
        <div
          className="max-w-[872px] w-full relative transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(${paperOffset}px) scale(${combinedScale})`,
            transformOrigin: 'top center',
          }}
        >
          {pages.map((pageContent, i) => (
            <DocumentPageWithBadges
              key={i}
              pageContent={[
                ...(
                  i === 0
                    ? [
                        <div key="header" className="mb-10 text-left">
                          <h1 className="text-2xl font-bold mb-2">
                            {doc.title}
                          </h1>
                          <p className="text-md text-gray-700">{doc.author}</p>
                        </div>,
                      ]
                    : []
                ),
                pageContent,
              ]}
              pageNumber={i + 1}
              highlights={doc.highlights.filter((h) => h.page === i + 1)}
              matchCards={doc.matchCards}
              className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-md rounded mb-4 px-6 md:px-12 py-8 md:py-16 transition-opacity duration-300 opacity-100 leading-[32px]"
              data-page-number={i + 1}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
            />
          ))}

          {/* Floating Comment Cards - positioned inside the transformed paper container */}
          {showComments && <FloatingCommentCards />}
        </div>
      </div>

      {/* Document Page Controls - Fixed position at bottom left */}
      <div className="fixed bottom-4 left-4 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <DocumentPageControls
            currentPage={currentPage}
            totalPages={pages.length}
            zoom={zoom}
            wordCount={wordCount}
            scale={scale}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onZoomReset}
          />
        </div>
      </div>
    </div>
  );
}

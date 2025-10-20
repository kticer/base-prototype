import { useEffect, useState } from 'react';

interface LayoutDimensions {
  paperOffset: number;
  commentOffset: number;
  showComments: boolean;
  scale: number; // New: scale factor for the paper
}

export function useResponsiveLayout(
  showCommentColumn: boolean,
  sidebarVisible: boolean = true,
  chatPanelWidth: number = 0, // New: chat panel width when in shrink mode
  chatDisplayMode: 'overlay' | 'shrink' = 'overlay'
) {
  const [dimensions, setDimensions] = useState<LayoutDimensions>({
    paperOffset: 0,
    commentOffset: 0,
    showComments: showCommentColumn,
    scale: 1.0,
  });

  useEffect(() => {
    const calculateLayout = () => {
      const viewportWidth = window.innerWidth;
      
      // console.log('🔧 Layout Calculation:', {
      //   viewportWidth,
      //   showCommentColumn,
      // });

      // Don't calculate on very small screens
      if (viewportWidth < 768) {
        // console.log('📱 Small screen detected, hiding comments');
        setDimensions({
          paperOffset: 0,
          commentOffset: 0,
          showComments: false,
          scale: 0.7, // Scale down on mobile
        });
        return;
      }

      // Layout constants
      const PAPER_WIDTH = 872; // max-width of paper container (fixed aspect ratio)
      const COMMENT_WIDTH = 320; // w-80 = 320px
      const COMMENT_OVERLAP = 8; // allowed overlap
      const SIDEBAR_WIDTH = sidebarVisible
        ? (viewportWidth >= 1280 ? 384 : viewportWidth >= 1024 ? 320 : 384)
        : 0; // xl:w-96, lg:w-80, w-96, or hidden
      const CHAT_WIDTH = chatDisplayMode === 'shrink' ? chatPanelWidth : 0;
      const PADDING = 24; // base padding

      // Calculate available space (with some buffer for scroll bars)
      const availableWidth = Math.max(viewportWidth - SIDEBAR_WIDTH - CHAT_WIDTH - 20, 400);
      
      // Calculate total needed width
      const totalNeededWidth = showCommentColumn 
        ? PAPER_WIDTH + COMMENT_WIDTH - COMMENT_OVERLAP + PADDING * 2
        : PAPER_WIDTH + PADDING * 2;

      // console.log('📏 Layout Dimensions:', {
      //   PAPER_WIDTH,
      //   COMMENT_WIDTH,
      //   COMMENT_OVERLAP,
      //   SIDEBAR_WIDTH,
      //   PADDING,
      //   availableWidth,
      //   totalNeededWidth,
      //   excess: totalNeededWidth - availableWidth,
      // });
      
      let finalDimensions: LayoutDimensions;

      // Calculate scale based on available width
      // We want to maintain paper width but scale if necessary
      const idealPaperSpace = showCommentColumn ? PAPER_WIDTH : PAPER_WIDTH + PADDING * 2;
      const availableForPaper = showCommentColumn
        ? availableWidth - COMMENT_WIDTH - PADDING * 2
        : availableWidth - PADDING * 2;

      // Determine if we need to scale or hide comments
      let scale = 1.0;
      let hideComments = false;

      if (availableWidth < 1000 && showCommentColumn) {
        // Below 1000px with comments: hide comments and scale paper to fit
        hideComments = true;
        const scaleNeeded = Math.min(1.0, (availableWidth - PADDING * 2) / PAPER_WIDTH);
        scale = Math.max(0.6, scaleNeeded); // Minimum 60% scale
      } else if (availableForPaper < PAPER_WIDTH) {
        // Scale paper to fit available space
        scale = Math.max(0.6, availableForPaper / PAPER_WIDTH);
      }

      if (!showCommentColumn || hideComments) {
        // No comments, just center the scaled paper
        finalDimensions = {
          paperOffset: 0,
          commentOffset: 0,
          showComments: false,
          scale,
        };
        // console.log('🚫 No comments mode, scale:', scale);
      } else if (totalNeededWidth <= availableWidth && scale >= 1.0) {
        // Everything fits perfectly at 100%
        finalDimensions = {
          paperOffset: 0,
          commentOffset: -COMMENT_OVERLAP,
          showComments: true,
          scale: 1.0,
        };
        // console.log('✅ Everything fits perfectly');
      } else {
        // Scale down to fit
        finalDimensions = {
          paperOffset: 0,
          commentOffset: -COMMENT_OVERLAP,
          showComments: true,
          scale,
        };

        // console.log('⚠️ Scaling paper to fit:', {
        //   scale: `${Math.round(scale * 100)}%`,
        //   availableWidth,
        //   availableForPaper,
        // });
      }

      // console.log('🎯 Final Layout Decision:', finalDimensions);
      setDimensions(finalDimensions);
    };

    calculateLayout();
    
    // Debounced resize handler for better performance
    let resizeTimeout: NodeJS.Timeout;
    const debouncedCalculateLayout = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateLayout, 100);
    };
    
    window.addEventListener('resize', debouncedCalculateLayout);
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedCalculateLayout);
    };
  }, [showCommentColumn, sidebarVisible, chatPanelWidth, chatDisplayMode]);

  return dimensions;
}
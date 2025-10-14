import { useEffect, useState } from 'react';

interface LayoutDimensions {
  paperOffset: number;
  commentOffset: number;
  showComments: boolean;
}

export function useResponsiveLayout(showCommentColumn: boolean, sidebarVisible: boolean = true) {
  const [dimensions, setDimensions] = useState<LayoutDimensions>({
    paperOffset: 0,
    commentOffset: 0,
    showComments: showCommentColumn,
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
        });
        return;
      }
      
      // Layout constants
      const PAPER_WIDTH = 872; // max-width of paper container
      const COMMENT_WIDTH = 320; // w-80 = 320px
      const COMMENT_OVERLAP = 8; // allowed overlap
      const SIDEBAR_WIDTH = sidebarVisible 
        ? (viewportWidth >= 1280 ? 384 : viewportWidth >= 1024 ? 320 : 384) 
        : 0; // xl:w-96, lg:w-80, w-96, or hidden
      const PADDING = 24; // base padding
      
      // Calculate available space (with some buffer for scroll bars)
      const availableWidth = Math.max(viewportWidth - SIDEBAR_WIDTH - 20, 400);
      
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

      if (!showCommentColumn) {
        // No comments, just center the paper
        finalDimensions = {
          paperOffset: 0,
          commentOffset: 0,
          showComments: false,
        };
        // console.log('🚫 No comments mode');
      } else if (totalNeededWidth <= availableWidth) {
        // Everything fits perfectly
        finalDimensions = {
          paperOffset: 0,
          commentOffset: -COMMENT_OVERLAP,
          showComments: true,
        };
        // console.log('✅ Everything fits perfectly');
      } else {
        // Need to adjust positioning
        const excessWidth = totalNeededWidth - availableWidth;
        const maxPaperShift = Math.min(excessWidth * 0.6, 200); // Limit paper shift
        
        // Calculate if comments will still be visible after adjustment
        const finalCommentRight = PAPER_WIDTH + COMMENT_WIDTH - COMMENT_OVERLAP - maxPaperShift;
        const commentsStillVisible = finalCommentRight <= availableWidth - PADDING;
        
        finalDimensions = {
          paperOffset: -maxPaperShift,
          commentOffset: -COMMENT_OVERLAP,
          showComments: commentsStillVisible,
        };
        
        // console.log('⚠️ Tight fit, adjusting:', {
        //   excessWidth,
        //   maxPaperShift,
        //   finalCommentRight,
        //   commentsStillVisible,
        //   availableForComments: availableWidth - PADDING,
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
  }, [showCommentColumn, sidebarVisible]);

  return dimensions;
}
import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Props for the Badge component
 */
interface BadgeProps {
  /** Number to display in the badge (alternative to text) */
  number?: number;
  /** Text to display in the badge (alternative to number) */
  text?: string;
  /** Background color of the badge */
  color: string;
  /** Whether the badge is currently selected */
  isSelected?: boolean;
  /** Click handler for the badge */
  onClick?: () => void;
  /** Additional CSS classes to apply */
  className?: string;
  /** Additional inline styles to apply */
  style?: React.CSSProperties;
}

/**
 * Reusable badge component for displaying numbers or text with color coding
 * Used for match card indices, source counts, and other labeled indicators
 * 
 * @param props - Badge configuration props
 * @example
 * ```tsx
 * <Badge number={1} color="#CC1476" isSelected={true} onClick={handleClick} />
 * <Badge text="Mult" color="#6B7280" />
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  number,
  text,
  color,
  isSelected = false,
  onClick,
  className = '',
  style = {},
}) => {
  const backgroundColor = isSelected ? color : `${color}B3`; // Full opacity when selected, 70% when not (increased from 30%)
  
  return (
    <div
      className={`flex items-center gap-1 text-xs font-medium text-white rounded-full px-2 py-0.5 cursor-pointer transition-all duration-200 hover:scale-105 ${className}`}
      style={{
        backgroundColor,
        ...style,
      }}
      onClick={onClick}
    >
      <MagnifyingGlassIcon className="w-3 h-3" />
      <span>{text || number}</span>
    </div>
  );
};
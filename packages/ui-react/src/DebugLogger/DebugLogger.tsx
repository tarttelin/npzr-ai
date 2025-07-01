import React from 'react';
import { LoggerOutput } from '../LoggerOutput';
import { LoggerProvider, useLogger } from '../LoggerProvider';

export interface DebugLoggerProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  width?: number;
  height?: number;
  autoScroll?: boolean;
}

// Internal component that uses the logger context
const DebugLoggerContent: React.FC<Omit<DebugLoggerProps, 'isVisible' | 'onToggle'>> = (props) => {
  const { setIsVisible } = useLogger();
  
  return (
    <LoggerOutput
      {...props}
      // The LoggerOutput component handles visibility through the LoggerProvider context
    />
  );
};

export const DebugLogger: React.FC<DebugLoggerProps> = ({
  isVisible = false,
  onToggle,
  ...props
}) => {
  return (
    <LoggerProvider defaultVisible={isVisible}>
      <DebugLoggerContent {...props} />
    </LoggerProvider>
  );
};
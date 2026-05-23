import React, { forwardRef } from 'react';

interface PContentProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const PContent = forwardRef<HTMLParagraphElement, PContentProps>(
  ({ children, className, ...props }, ref) => (
    <p ref={ref} className={className} {...props}>
      {children}
    </p>
  )
);

PContent.displayName = 'PContent';
export default PContent;

import React, { forwardRef } from 'react';

interface H4TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const H4Title = forwardRef<HTMLHeadingElement, H4TitleProps>(
  ({ children, className, ...props }, ref) => (
    <h4 ref={ref} className={className} {...props}>
      {children}
    </h4>
  )
);

H4Title.displayName = 'H4Title';
export default H4Title;

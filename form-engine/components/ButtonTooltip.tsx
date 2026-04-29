import { useState } from "react";

const ButtonTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
}> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!content.trim()) return <>{children}</>;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap"
          style={{
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {content}
          {/* Flèche pointant vers le bas */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-t-gray-900 border-l-4 border-l-transparent border-r-4 border-r-transparent" />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translate(-50%, 4px) scale(0.96);
          }
          to { 
            opacity: 1; 
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ButtonTooltip;


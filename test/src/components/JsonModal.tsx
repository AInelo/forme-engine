import React, { useState } from 'react';
import { X, Copy, Check, FileJson } from 'lucide-react';

interface JsonModalProps {
  formName: string;
  data: Record<string, unknown>;
  onClose: () => void;
}

export default function JsonModal({ formName, data, onClose }: JsonModalProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const fieldCount = Object.keys(data).length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-xl">
              <FileJson className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Données soumises</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {formName} · {fieldCount} champ{fieldCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copied
                ? <><Check className="w-3.5 h-3.5 text-green-600" /> <span className="text-green-600">Copié</span></>
                : <><Copy className="w-3.5 h-3.5" /> Copier</>
              }
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fields summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
          {Object.entries(data).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-md text-xs text-gray-600"
            >
              <span className="text-gray-400 font-mono">{key}</span>
              <span className="text-gray-300">·</span>
              <span className="text-teal-600 font-medium truncate max-w-[120px]">
                {Array.isArray(value)
                  ? `[${(value as unknown[]).length}]`
                  : value === null || value === undefined || value === ''
                  ? <span className="text-gray-300 italic">vide</span>
                  : String(value)}
              </span>
            </span>
          ))}
        </div>

        {/* JSON Content */}
        <div className="overflow-y-auto flex-1 p-4">
          <pre className="text-xs font-mono bg-gray-950 text-emerald-400 p-4 rounded-xl overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
            {json}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

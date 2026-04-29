import React from 'react';
import { X, Eye, Edit, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface ModalHeaderProps {
  isViewMode: boolean;
  hasFilledData: boolean;
  fieldName: string;
  basedOnValue: number;
  onClose: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  isViewMode,
  hasFilledData,
  fieldName,
  basedOnValue,
  onClose,
  onExpandAll,
  onCollapseAll
}) => {
  const getIcon = () => {
    if (isViewMode) return <Eye className="h-4 w-4 sm:h-5 sm:w-5" />;
    if (hasFilledData) return <Edit className="h-4 w-4 sm:h-5 sm:w-5" />;
    return <Plus className="h-4 w-4 sm:h-5 sm:w-5" />;
  };

  const getTitle = () => {
    if (isViewMode) return "Visualisation";
    if (hasFilledData) return "Modifier";
    return "Remplir";
  };

  return (
    <div className="bg-gradient-to-r from-[#008080] to-[#006666] p-4 sm:p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold">
              {getTitle()} {fieldName}
            </h3>
            <p className="text-teal-100 text-xs sm:text-sm">
              {basedOnValue} série{basedOnValue > 1 ? 's' : ''} à {isViewMode ? 'visualiser' : 'compléter'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
      
      <div className="mt-4 flex space-x-2">
        <button
          type="button"
          onClick={onExpandAll}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
        >
          <ChevronDown className="h-3 w-3" />
          <span>Tout ouvrir</span>
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
        >
          <ChevronUp className="h-3 w-3" />
          <span>Tout fermer</span>
        </button>
      </div>
    </div>
  );
};


export default ModalHeader;
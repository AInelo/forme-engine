import React from 'react';
import { Save } from 'lucide-react';
import ValidationBtn from '../../../button/ValidationBtn';
import CancelBtn from '../../../button/CancelBtn';
import Button from '../../../button/Button';


interface ModalFooterProps {
  isViewMode: boolean;
  onClose: () => void;
  onClear?: () => void;
  onSave: () => void;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  isViewMode,
  onClose,
  onClear,
  onSave
}) => {
  return (
    <div className="bg-gray-50 border-t border-gray-200 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        {isViewMode ? (
          <CancelBtn
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
          >
            Fermer
          </CancelBtn>
        ) : (
          <>
            {onClear && (
              <Button
                variant="red-flag"
                type="button"
                onClick={onClear}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5"
              >
                Effacer tout
              </Button>
            )}
            <ValidationBtn
              type="button"
              onClick={onSave}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#008080] to-[#006666] text-white rounded-lg hover:from-[#007070] hover:to-[#005555] transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Save className="h-4 w-4" />
              <span>Sauvegarder</span>
            </ValidationBtn>
          </>
        )}
      </div>
    </div>
  );
};


export default ModalFooter;
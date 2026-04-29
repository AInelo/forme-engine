import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import CancelBtn from '../../button/CancelBtn';
import ValidationBtn from '../../button/ValidationBtn';

interface FormNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onPreviousVisible?: () => void; // Navigation intelligente (sauter les sections cachées)
  onNextVisible?: () => void; // Navigation intelligente (sauter les sections cachées)
  onSubmit?: () => void;
  onClearAll: () => void;
  isFirstSection: boolean;
  isLastSection: boolean;
  isValidating?: boolean;
  onSubmitButtonText?: string;
  showStepNavigation?: boolean;
  displayDeleteButton?: boolean; // Contrôle l'affichage du bouton de suppression
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  onPrevious,
  onNext,
  onPreviousVisible,
  onNextVisible,
  onSubmit,
  onClearAll,
  isFirstSection,
  isLastSection,
  isValidating = false,
  onSubmitButtonText,
  showStepNavigation = true,
  displayDeleteButton = true
}) => {
  // Utiliser la navigation intelligente pour "Précédent" (pas de validation nécessaire)
  const handlePrevious = onPreviousVisible || onPrevious;
  // Toujours utiliser onNext qui contient la validation + navigation intelligente intégrée
  // onNextVisible n'est plus utilisé directement car la validation est maintenant intégrée dans onNext
  const handleNext = onNext;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const submitLabel = onSubmitButtonText ?? 'Soumettre';

  const handleClearAll = () => {
    onClearAll();
    setShowDeleteModal(false);
  };

  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Supprimer toutes les données
              </h3>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteModal(false);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer toutes les données du formulaire ?
              Cette action est irréversible et effacera également les données sauvegardées.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <strong>Attention :</strong> Toutes vos données seront définitivement perdues.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteModal(false);
              }}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearAll?.();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!showStepNavigation) {
    return (
      <>
        <div className="mt-8 w-full max-w-2xl flex flex-col items-center gap-4">
          <ValidationBtn
            type="submit"
            onClick={onSubmit}
            disabled={isValidating}
            className="min-w-[200px]"
          >
            {isValidating ? 'Validation...' : submitLabel}
          </ValidationBtn>

          {displayDeleteButton && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              className="group relative p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Supprimer toutes les données"
            >
              <Trash2 size={20} className="transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>

        {/* Modal de confirmation */}
        <DeleteConfirmationModal />
      </>
    );
  }

  return (
    <>
      {/* Version Desktop - normale */}
      <div className="hidden md:flex justify-between items-center gap-2 mt-8 w-full max-w-2xl">
        <CancelBtn
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePrevious?.();
          }}
          disabled={isFirstSection}
        >
          Précédent
        </CancelBtn>

        {/* Bouton de suppression centré */}
        {displayDeleteButton && (
          <div className="flex-1 flex justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              className="group relative p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Supprimer toutes les données"
            >
              <Trash2 size={20} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
        )}

        {!isLastSection ? (
          <ValidationBtn
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext?.();
            }}
            disabled={isValidating}
          >
            {isValidating ? 'Validation...' : 'Suivant'}
          </ValidationBtn>
        ) : (
          <ValidationBtn type="submit" onClick={onSubmit}>
            {submitLabel}
          </ValidationBtn>
        )}
      </div>

      {/* Version Mobile - Tab Bar fixée en bas */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg z-50 mobile-nav-slide-up">
        <div className="flex justify-between items-center gap-3 max-w-md mx-auto">
          <CancelBtn
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePrevious?.();
            }}
            disabled={isFirstSection}
            className="flex-1 min-h-[44px]"
          >
            Précédent
          </CancelBtn>

          {/* Bouton de suppression mobile centré */}
          {displayDeleteButton && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              className="group relative p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Supprimer toutes les données"
            >
              <Trash2 size={20} className="transition-transform group-hover:scale-110" />
            </button>
          )}

          {!isLastSection ? (
            <ValidationBtn
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext?.();
              }}
              disabled={isValidating}
              className="flex-1 min-h-[44px]"
            >
              {isValidating ? 'Validation...' : 'Suivant'}
            </ValidationBtn>
          ) : (
            <ValidationBtn
              // type="submit"
              type="button"
              onClick={onSubmit}
              className="flex-1 min-h-[44px]"
            >
              {/* Simuler */}
              {submitLabel}
            </ValidationBtn>
          )}
        </div>

        {/* Espace pour les iPhone avec home indicator */}
        <div className="h-safe-area-inset-bottom"></div>
      </div>

      {/* Modal de confirmation */}
      <DeleteConfirmationModal />
    </>
  );
};

export default FormNavigation;

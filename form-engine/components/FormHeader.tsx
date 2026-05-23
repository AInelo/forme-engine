import React from 'react';
import { getLocalizedText } from '../FormFieldWrapper';
import type { FormStructure, HeaderOptions } from '../types/formTypeStructure';

interface FormHeaderProps {
  form: FormStructure;
  currentLang: string;
  headerOptions?: HeaderOptions;
}

const FormHeader: React.FC<FormHeaderProps> = ({ form, currentLang, headerOptions }) => {
  // Gestion de la visibilité : si visible === false, ne pas rendre le composant
  if (headerOptions?.visible === false) {
    return null;
  }

  // Si type === "custom" et customHeader est défini, rendre le composant personnalisé
  if (headerOptions?.type === "custom" && headerOptions?.customHeader) {
    return <>{headerOptions.customHeader}</>;
  }

  // Header par défaut (comportement actuel)
  return (
    <div
      className="mb-8 p-6 text-white rounded-lg shadow-lg w-full max-w-4xl"
      style={{ backgroundColor: "var(--fe-primary)" }}
    >
      <h1 className="text-3xl font-bold mb-2">
        {getLocalizedText(form.name, currentLang)}
      </h1>
      <p className="text-white/80 mb-2">
        {getLocalizedText(form.description, currentLang)}
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
          Fournisseur: {form.provider}
        </span>
        <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
          Statut: {form.status}
        </span>
        {form.version && (
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
            Version: {form.version}
          </span>
        )}
      </div>
    </div>
  );
};

export default FormHeader;
import React from "react";
import type { FormField, Section } from "./types/formTypeStructure";
import { Eye, Edit, Plus, ArrowRight } from "lucide-react";
import ValidationBtn from "../button/ValidationBtn";
import ButtonTooltip from "./components/ButtonTooltip";


// Import des composants standards
import BoolFormField from "./ui/BoolFormField";
import CheckboxFormField from "./ui/CheckboxFormField";
import DateFormField from "./ui/DateFormField";
import DropdownFormField from "./ui/DropdownFormField";
import FileFormField from "./ui/FileFormField";
import NumberFormField from "./ui/NumberFormField";
import PasswordFormField from "./ui/PasswordFormField";
import RadioFormField from "./ui/RadioFormField";
import TextareaFormField from "./ui/TextareaFormField";
import TextFormField from "./ui/TextFormField";

// Import des composants spéciaux
import ImageFormField from "./ui/special/ImageFormField";
import VideoFormField from "./ui/special/VideoFormField";
import AudioFormField from "./ui/special/AudioFormField";
import PDFFormField from "./ui/special/PDFFormField";
import VoiceFormField from "./ui/special/VoiceFormField";
import DocumentFormField from "./ui/special/DocumentFormField";
import TipTapFormField from "./ui/special/TipTapFormField";
import OTPRenderer from "./components/OTPRenderer";
// import { useResponsiveSize } from "./FormFieldWrapper";

interface FieldRendererProps {
  field: FormField;
  currentLang?: string;
  className?: string;
  name?: string;
  formValues?: Record<string, any>;
  allSections?: Section[];
  currentSectionIndex?: number;
  // Nouvelles props pour les boutons de contrôle
  showControlButtons?: boolean;
  hasFilledData?: boolean;
  basedOnValue?: number; // Valeur du champ nombre pour les repeat groups
  onOpenModal?: () => void;
  onOpenEdit?: () => void;
  onOpenView?: () => void;
  dependentFieldNameTransformed?: string;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  currentLang = "fr",
  className = "",
  name,
  formValues,
  allSections = [],
  currentSectionIndex = 0,
  showControlButtons = false,
  hasFilledData = false,
  basedOnValue = 0,
  onOpenModal,
  onOpenEdit,
  onOpenView,
  dependentFieldNameTransformed
}) => {
  const fieldKey = name ?? field.fieldName;
  const defaultValue = formValues?.[fieldKey];


  const renderControlButtons = () => {
    if (!showControlButtons) return null;

    return (
      <div className="flex justify-end mb-4 space-x-2">
        {!hasFilledData && basedOnValue > 0 ? (
          /* Bouton Remplir - affiché quand aucune donnée n'est remplie ET quand basedOnValue > 0 */
          <ButtonTooltip content="Remplir les champs du groupe répétable">
            <ValidationBtn
              type="button"
              numerator={15}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenModal?.();
              }}
            >
              Suivant
              <ArrowRight size={20} />
            </ValidationBtn>
          </ButtonTooltip>
        ) : hasFilledData ? (
          /* Boutons Modifier et Voir - affichés quand des données sont remplies */
          <>
            <ButtonTooltip content="Modifier les données du groupe">
              <ValidationBtn
                type="button"
                numerator={15}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenEdit?.();
                }}
              >
                <Edit size={20} />
              </ValidationBtn>
            </ButtonTooltip>
            <ButtonTooltip content="Voir les données en lecture seule">
              <ValidationBtn
                type="button"
                numerator={15}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenView?.();
                }}
              >
                <Eye size={20} />
              </ValidationBtn>
            </ButtonTooltip>
          </>
        ) : null}
      </div>
    );
  };



  const renderField = () => {
    switch (field.fieldType) {
      case "text":
        return (
          <TextFormField
            field={field as FormField & { fieldType: "text" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
            allSections={allSections}
            currentSectionIndex={currentSectionIndex}
          />
        );

      case "textarea":
        return (
          <TextareaFormField
            field={field as FormField & { fieldType: "textarea" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "password":
        return (
          <PasswordFormField
            field={field as FormField & { fieldType: "password" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "number":
        return (
          <NumberFormField
            field={field as FormField & { fieldType: "number" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "radio":
        return (
          <RadioFormField
            field={field as FormField & { fieldType: "radio" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "checkbox":
        return (
          <CheckboxFormField
            field={{
              ...(field as FormField & { fieldType: "checkbox" }),
              selectOptions: (field as any).selectOptions ?? [],
            }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "bool":
        return (
          <BoolFormField
            field={field as FormField & { fieldType: "bool" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "dropdown":
        // Debug logs
        if (dependentFieldNameTransformed) {
          // console.log('🔍 [FieldRenderer] Passing dependentFieldNameTransformed to DropdownFormField:', {
            // fieldName: field.fieldName,
            // name,
            // dependentFieldNameTransformed,
            // hasDynamicFilterRule: !!(field as any).dynamicFilterRule,
            // dependentFieldName: (field as any).dynamicFilterRule?.dependentFieldName
          // });
        }
        return (
          <DropdownFormField
            field={{
              ...(field as FormField & { fieldType: "dropdown" }),
              selectOptions: (field as any).selectOptions ?? [],
              
            }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
            dependentFieldNameTransformed={dependentFieldNameTransformed}
          />
        );

      case "file":
        return (
          <FileFormField
            field={field as FormField & { fieldType: "file" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "date":
        return (
          <DateFormField
            field={field as FormField & { fieldType: "date" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      // Champs spéciaux
      case "IMAGE":
        return (
          <ImageFormField
            field={field as FormField & { fieldType: "IMAGE" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "VIDEO":
        return (
          <VideoFormField
            field={field as FormField & { fieldType: "VIDEO" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "AUDIO":
        return (
          <AudioFormField
            field={field as FormField & { fieldType: "AUDIO" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "PDF":
        return (
          <PDFFormField
            field={field as FormField & { fieldType: "PDF" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "VOICE":
        return (
          <VoiceFormField
            field={field as FormField & { fieldType: "VOICE" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "DOCUMENT":
        return (
          <DocumentFormField
            field={field as FormField & { fieldType: "DOCUMENT" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      case "TIP_TAP_DOC_TEXT":
        return (
          <TipTapFormField
            field={field as FormField & { fieldType: "TIP_TAP_DOC_TEXT" }}
            currentLang={currentLang}
            className={className}
            name={name}
            defaultValue={defaultValue}
          />
        );

      default:
        return (
          <div className="text-red-500 font-semibold">
            Champ non supporté : <code>{field.fieldType}</code>
          </div>
        );
    }
  };



  return (
    <div  
 
    >
      
      {renderField()}

      {renderControlButtons()}
    </div>
  );
};

export default FieldRenderer;

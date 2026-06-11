
import {type FormStructure, type FormField, type Section, type ProgressBarType, type HeaderOptions, type ContainerStylesOptions} from '../../../types/formTypeStructure'
import type { UseFormReturn } from "react-hook-form";


export interface FormEngineProps {
  form: FormStructure;
  formId: string;
  onSubmit: (data: Record<string, any>) => void;
  currentLang?: string;
  submitButtonText?: string;
  paginationMode?: "byFields" | "bySection"; // Mode de pagination (optionnel, peut être défini dans form.layoutOptions.paginationMode) : "byFields" = par nombre de champs (défaut), "bySection" = une section = une page. La prop a priorité sur form.layoutOptions.
}

export interface FieldValidationError {
  fieldName: string;
  fieldLabel: string;
  errors: string[]; // Messages d'erreur pour ce champ
}

export interface FormValidationResult {
  isValid: boolean;
  touched: boolean;
  allRequiredFieldsFilled: boolean;
  visibleFieldsCount: number;
  requiredFieldsCount: number;
  // Nouveaux champs pour les erreurs détaillées
  invalidFields?: FieldValidationError[]; // Champs avec erreurs de validation Zod
  untouchedRequiredFields?: FieldValidationError[]; // Champs requis non touchés
  emptyRequiredFields?: FieldValidationError[]; // Champs requis vides
}

export interface FormEngineContentProps {
  form: FormStructure;
  formId: string;
  onSubmit: (data: Record<string, any>) => void;
  currentLang: string;
  navigation: any;
  allFields: FormField[];
  handleFieldChange: (id: string, value: any) => void;
  onClearAll: () => void;
  methods: UseFormReturn;
  submitButtonText: string;
  paginationMode?: "byFields" | "bySection";
  progressBarType?: ProgressBarType;
  sections?: Section[];
  headerOptions?: HeaderOptions;
  displayDeleteButton?: boolean;
  containerStyles?: ContainerStylesOptions;
  mobileNavSticky?: boolean;
}
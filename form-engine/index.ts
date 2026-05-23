// Composant principal
export { default as FormEngine } from './components/core/FormEngine';

// Types structurels du formulaire
export type {
  FormStructure,
  FormTheme,
  FormField,
  Section,
  FormRepeatGroup,
  SelectOption,
  ResponseInForm,
  ConditionalDisplayRule,
  ConditionalDisplayGroup,
  ConditionalOperator,
  TypeComputation,
  ValidationRule,
  ValidationType,
  RepeatRule,
  OTPFormFieldExecOptions,
  EmailFormFieldExecOptions,
  OTPFormFieldLink,
  FileToBucketManage,
  UploadOption,
  DeleteOption,
  FormEngineLayoutOptions,
  ProgressBarType,
  HeaderOptions,
  ContainerStyles,
  ContainerStylesOptions,
  DynamicFilterRule,
  DynamicFilteringDataSourceElement,
  DetailInfosConfig,
} from './types/formTypeStructure';

// Enum des champs spéciaux (valeur runtime, pas seulement type)
export { SpecialField } from './types/formTypeStructure';

// Types des props du composant FormEngine
export type {
  FormEngineProps,
  FieldValidationError,
  FormValidationResult,
} from './components/core/types/formEngine.types';

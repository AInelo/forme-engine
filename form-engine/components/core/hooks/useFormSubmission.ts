import type { UseFormReturn } from "react-hook-form";
import type { FormStructure } from "../../../types/formTypeStructure";
import type { FormValidationResult } from "../types/formEngine.types";
import toast from "react-hot-toast";
import { prepareFormDataBeforeSubmit, flattenOTPFields } from "../../../types/formUtils";
import { normalizeFormData } from "../../../types/repeatRules";

const useFormSubmission = (
  methods: UseFormReturn,
  form: FormStructure,
  validatePage: () => Promise<FormValidationResult>,
  onSubmit: (data: Record<string, any>) => void,
  setIsValidating: (value: boolean) => void
) => {
  const handleSubmitWithValidation = async () => {
    setIsValidating(true);
    try {
      const result = await validatePage();
      
      // Afficher les erreurs détaillées par champ
      if (result.invalidFields && result.invalidFields.length > 0) {
        result.invalidFields.forEach(field => {
          field.errors.forEach(error => {
            toast.error(`${field.fieldLabel} : ${error}`);
          });
        });
        return;
      }
      
      if (result.emptyRequiredFields && result.emptyRequiredFields.length > 0) {
        result.emptyRequiredFields.forEach(field => {
          toast.error(`${field.fieldLabel} : ${field.errors[0]}`);
        });
        return;
      }
      
      if (result.untouchedRequiredFields && result.untouchedRequiredFields.length > 0) {
        result.untouchedRequiredFields.forEach(field => {
          toast.error(`${field.fieldLabel} : ${field.errors[0]}`);
        });
        return;
      }
      
      const data = methods.getValues();
      const completedData = prepareFormDataBeforeSubmit(data, form.sections);
      const flattenedData = flattenOTPFields(completedData, form.sections); // 🆕 Aplatir les champs OTP
      const normalizedData = normalizeFormData(flattenedData, form.sections);

      onSubmit(normalizedData);
      
      toast.success(`Formulaire soumis avec succès ! 🎉 (${result.requiredFieldsCount} champs requis traités)`);
    } finally {
      setIsValidating(false);
    }
  };

  return { handleSubmitWithValidation };
};

export default useFormSubmission;
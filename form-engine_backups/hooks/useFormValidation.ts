import { useFormContext } from 'react-hook-form';
import type { FormField } from '../types/formTypeStructure';

export const useFormValidation = () => {
  const { trigger, formState } = useFormContext();

  const validateFields = async (fields: FormField[]): Promise<boolean> => {

    const fieldNames = fields.map(f => f.fieldName as string);
    
    if (fieldNames.length === 0) {
      return true;
    }
    
    try {
      const valid = await trigger(fieldNames);
      if (!valid) {
        console.log('Validation échouée, erreurs:', formState.errors);
      }
      return valid;
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return false;
    }
  };

  return {
    validateFields,
    formState
  };
};
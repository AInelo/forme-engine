import { useFormContext } from "react-hook-form";
import { useFormStore } from "../../store/useFormStore";
import { useCallback, useEffect } from "react";
import { normalizeFormData } from "../../types/repeatRules";
import type { Section } from "../../types/formTypeStructure";




const FormSyncComponent: React.FC<{
  formId: string;
  sections: Section[];
}> = ({ formId, sections }) => {
  const { watch } = useFormContext();
  const setAllFormValues = useFormStore(state => state.setAllFormValues);

  const syncFormData = useCallback((data: Record<string, any>) => {
    const normalizedData = normalizeFormData(data, sections);
    setAllFormValues(formId, normalizedData);
  }, [formId, sections, setAllFormValues]);

  useEffect(() => {
    const subscription = watch(syncFormData);
    // console.log(JSON.stringify(syncFormData), null, 2); // Debugging output
    // Initial sync when the component mounts
    return () => subscription.unsubscribe();
  }, [watch, syncFormData]);

  return null;
};

export default FormSyncComponent;
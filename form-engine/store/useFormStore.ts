// 📁 src/store/useFormStore.ts
import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Section } from '../types/formTypeStructure';
import { normalizeFormData } from '../types/repeatRules';

interface FormState {
  forms: Record<string, Record<string, any>>; // { [formId]: { fieldId: value } }
  setFormValue: (formId: string, fieldName: string, value: any) => void;
  setAllFormValues: (formId: string, values: Record<string, any>) => void;
  getFormValues: (formId: string) => Record<string, any>;
  clearForm: (formId: string) => void;
  clearAll: () => void;
}

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      forms: {},
      setFormValue: (formId, fieldName, value) =>
        set((state) => ({
          forms: {
            ...state.forms,
            [formId]: {
              ...state.forms[formId],
              [fieldName]: value,
            },
          },
        })),

      setAllFormValues: (formId, values) =>
        set((state) => ({
          forms: {
            ...state.forms,
            [formId]: values,
          },
        })),

      getFormValues: (formId) => get().forms[formId] || {},

      clearForm: (formId) =>
        set((state) => {
          const newForms = { ...state.forms };
          delete newForms[formId];
          return { forms: newForms };
        }),

      clearAll: () => set({ forms: {} }),
    }),
    {
      name: 'multi-form-drafts',
    }
  )
);

// ✅ Mise à jour : on utilise les `sections` au lieu des `subSections`
export const useFormPersistence = (
  formId: string,
  sections: Section[]
) => {
  const formStore = useFormStore();

  const savedValues = formStore.getFormValues(formId);

  const syncFormData = useCallback(
    (watchedValues: Record<string, any>) => {
      const normalizedValues = normalizeFormData(watchedValues, sections);
      formStore.setAllFormValues(formId, normalizedValues);
    },
    [formId, sections]
  );

  return {
    savedValues,
    syncFormData,
  };
};

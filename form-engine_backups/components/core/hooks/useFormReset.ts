
import type { UseFormReturn } from "react-hook-form";
import type { FormField } from "../../../types/formTypeStructure";
import { useCallback } from "react";
import { useFormStore } from "../../../store/useFormStore";
import { useOTPTokenStore } from "../../../store/useOTPTokenStore";
import toast from "react-hot-toast";

const useFormReset = (
  methods: UseFormReturn,
  allFields: FormField[],
  formId: string,
  navigation: any
) => {
  const handleClearAll = useCallback(() => {
    try {
      // 1. Réinitialiser React Hook Form avec valeurs vides
      const defaultValues = Object.fromEntries(
        allFields.map((field) => [field.fieldName, ""])
      );
      methods.reset(defaultValues);

      // 2. Supprimer du localStorage
      localStorage.removeItem(`form_${formId}`);

      // 3. Réinitialiser Zustand
      useFormStore.getState().clearForm(formId);

      // 3.5. Nettoyer les tokens OTP associés au formulaire
      useOTPTokenStore.getState().clearAllOTPTokens(formId);

      // 4. Navigation forcée à la première section
      setTimeout(() => {
        navigation.goToFirst();
      }, 0);

      // 5. Toast succès
      toast.success("Toutes les données ont été supprimées ! 🗑️", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#10b981",
          color: "white",
          fontWeight: "bold",
        },
        icon: "✅",
      });

      console.log("✅ Form cleared successfully:", formId);
    } catch (error) {
      console.error("❌ Error clearing form:", error);
      toast.error("Erreur lors de la suppression des données", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#ef4444",
          color: "white",
          fontWeight: "bold",
        },
        icon: "❌",
      });
    }
  }, [methods, allFields, formId, navigation]);

  return { handleClearAll };
};

export default useFormReset;

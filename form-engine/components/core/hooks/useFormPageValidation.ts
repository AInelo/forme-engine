import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FormValidationResult, FieldValidationError } from "../types/formEngine.types";
import type { FormField, ResponseInForm, ValidationRule } from "../../../types/formTypeStructure";
import { shouldDisplayFormField, shouldDisplaySection } from "../../../types/displayRules";
import { useFormValidation } from "../../../hooks/useFormValidation";
import { getLocalizedText, extractErrorMessages } from "../../../FormFieldWrapper";
import { hasOTPField, getOTPField } from "../../../types/formUtils";

const useFormPageValidation = (navigation: any, methods: UseFormReturn, currentLang: string = "fr", paginationMode: "byFields" | "bySection" = "byFields") => {
    const [isValidating, setIsValidating] = useState(false);
    const { validateFields, formState } = useFormValidation();

    const validatePage = async (): Promise<FormValidationResult> => {
        setIsValidating(true);

        try {
            const values = methods.getValues();

            // Convertir les valeurs pour les règles d'affichage
            const allResponseInForms: Record<string, ResponseInForm> = {};
            Object.entries(values).forEach(([key, value]) => {
                allResponseInForms[key] = { responseValue: value };
            });

            // ÉTAPE 1: Récupérer uniquement les champs de la page actuelle
            const currentPageFields = navigation.pagedFields || [];
            const currentSection = navigation.currentSection;
            // Adapter le message selon le mode de pagination
            const currentStepInfo = paginationMode === "bySection" 
                ? `Section ${navigation.sectionIndex + 1}`
                : `Section ${navigation.sectionIndex + 1}, Page ${navigation.fieldPage + 1}`;
            
            // console.log(`📄 Page actuelle: ${currentStepInfo}, Champs bruts:`, currentPageFields.length);

            // 🆕 Vérifier si la section actuelle contient un OTP
            const isOTPSection = currentSection ? hasOTPField(currentSection) : false;
            const otpField = isOTPSection && currentSection ? getOTPField(currentSection) : undefined;

            // 🆕 Pour les sections OTP, valider que l'OTP a été rempli
            if (isOTPSection && otpField) {
                const otpValue = values[otpField.fieldName];
                const otpLength = otpField.otpFormFieldExecOptions?.otpLength ?? 6;
                
                // Vérifier que l'OTP est rempli (string de la bonne longueur)
                if (!otpValue || typeof otpValue !== "string" || otpValue.length !== otpLength) {
                    const fieldLabel = getLocalizedText(otpField.label, currentLang);
                    return {
                        isValid: false,
                        touched: true,
                        allRequiredFieldsFilled: false,
                        visibleFieldsCount: 1,
                        emptyRequiredFields: [{
                            fieldName: otpField.fieldName,
                            fieldLabel,
                            errors: [`Le code OTP doit contenir ${otpLength} chiffres`]
                        }],
                        invalidFields: [],
                        untouchedRequiredFields: [],
                        requiredFieldsCount: 1
                    };
                }
                
                // Si l'OTP est rempli, la validation passe (pas besoin de valider les autres champs de la section)
                return {
                    isValid: true,
                    touched: true,
                    allRequiredFieldsFilled: true,
                    visibleFieldsCount: 1,
                    emptyRequiredFields: [],
                    invalidFields: [],
                    untouchedRequiredFields: [],
                    requiredFieldsCount: 1
                };
            }

            // ÉTAPE 2: Filtrer les champs visibles selon les règles d'affichage
            const visibleCurrentPageFields = currentPageFields.filter((field: FormField) => {
                // Vérifier si la section actuelle est visible
                const sectionVisible = shouldDisplaySection(currentSection, allResponseInForms);
                
                // Vérifier si le champ lui-même doit être affiché
                const shouldDisplay = shouldDisplayFormField(field, allResponseInForms);
                
                const isVisible = sectionVisible && shouldDisplay;

                if (isVisible) {
                    // console.log(`✅ [Champ visible ${currentStepInfo}] ${field.fieldName}`);
                } else {
                    // console.log(`🚫 [Champ masqué ${currentStepInfo}] ${field.fieldName} - SectionVisible: ${sectionVisible}, ShouldDisplay: ${shouldDisplay}`);
                }

                return isVisible;
            });

            // ÉTAPE 3: Gérer les champs répétés (repeat groups) pour la page actuelle
            const repeatFieldsForCurrentPage = visibleCurrentPageFields
                .filter((f: FormField) => f.repeatGroup)
                .flatMap((f: FormField) => {
                    const group = f.repeatGroup!;
                    const instanceCount = values[group.fieldName]?.length ?? 0;

                    const repeatedFields: FormField[] = [];

                    for (let i = 0; i < instanceCount; i++) {
                        for (const baseField of group.formFields) {
                            const repeatedField = {
                                ...baseField,
                                fieldName: `${group.fieldName}_${baseField.fieldName}_${i}`
                            };

                            if (shouldDisplayFormField(repeatedField, allResponseInForms)) {
                                repeatedFields.push(repeatedField);
                            }
                        }
                    }

                    return repeatedFields;
                });

            // ÉTAPE 4: Combiner tous les champs à vérifier pour cette page
            const allFieldsToCheck = [...visibleCurrentPageFields, ...repeatFieldsForCurrentPage];

            // console.log(`🔍 Validation ${currentStepInfo}:`, {
            //     totalFields: allFieldsToCheck.length,
            //     fieldNames: allFieldsToCheck.map(f => f.fieldName)
            // });

            // ÉTAPE 5: Validation des champs avec react-hook-form
            const isValid = await validateFields(allFieldsToCheck);

            // Créer une map des champs pour retrouver rapidement les infos
            const fieldsMap = new Map(allFieldsToCheck.map(f => [f.fieldName, f]));

            // ÉTAPE 6: Identifier les champs requis
            const requiredFields = allFieldsToCheck.filter((field) => {
                const isRequired = field.validations?.some(
                    (v: ValidationRule) => v.validationType === "required"
                );
                if (isRequired) {
                    // console.log(`[Required] Champ requis sur ${currentStepInfo}: ${field.fieldName}`);
                }
                return isRequired;
            });

            // ÉTAPE 7: Vérifier que tous les champs requis ont été touchés
            const allRequiredFieldsTouched = requiredFields.every((field) => {
                const isTouched = !!methods.formState.touchedFields?.[field.fieldName];
                if (!isTouched) {
                    console.warn(`[Non touché] Champ requis non touché: ${field.fieldName}`);
                }
                return isTouched;
            });

            // ÉTAPE 8: Vérifier que tous les champs requis sont remplis
            const allRequiredFieldsFilled = requiredFields.every((field) => {
                const fieldValue = values[field.fieldName];
                const filled = Array.isArray(fieldValue)
                    ? fieldValue.length > 0
                    : fieldValue !== undefined && fieldValue !== null && fieldValue !== '';

                if (!filled) {
                    console.warn(`[Non rempli] Champ requis vide: ${field.fieldName} →`, fieldValue);
                } else {
                    // console.log(`[Rempli] Champ requis rempli: ${field.fieldName} →`, fieldValue);
                }

                return filled;
            });

            // ÉTAPE 9: Vérifier si tous les champs (requis ou non) ont été touchés
            const allFieldsTouched = allFieldsToCheck.every((field) => {
                return !!methods.formState.touchedFields?.[field.fieldName];
            });

            // ÉTAPE 10: Extraire les erreurs détaillées pour les toasts
            // 10.1: Erreurs de validation Zod
            const invalidFields: FieldValidationError[] = [];
            if (methods.formState.errors) {
                Object.entries(methods.formState.errors).forEach(([fieldName, error]) => {
                    const field = fieldsMap.get(fieldName);
                    if (field && error) {
                        const messages = extractErrorMessages(error);
                        if (messages.length > 0) {
                            invalidFields.push({
                                fieldName,
                                fieldLabel: getLocalizedText(field.label, currentLang),
                                errors: messages
                            });
                        }
                    }
                });
            }

            // 10.2: Champs requis non touchés
            const untouchedRequiredFields: FieldValidationError[] = [];
            requiredFields.forEach(field => {
                const isTouched = !!methods.formState.touchedFields?.[field.fieldName];
                if (!isTouched) {
                    untouchedRequiredFields.push({
                        fieldName: field.fieldName,
                        fieldLabel: getLocalizedText(field.label, currentLang),
                        errors: ["Champ requis non rempli"]
                    });
                }
            });

            // 10.3: Champs requis vides
            const emptyRequiredFields: FieldValidationError[] = [];
            requiredFields.forEach(field => {
                const value = values[field.fieldName];
                const filled = Array.isArray(value) 
                    ? value.length > 0 
                    : value !== undefined && value !== null && value !== '';
                if (!filled) {
                    emptyRequiredFields.push({
                        fieldName: field.fieldName,
                        fieldLabel: getLocalizedText(field.label, currentLang),
                        errors: ["Champ requis"]
                    });
                }
            });

            const result = {
                isValid: isValid && allRequiredFieldsFilled,
                touched: allRequiredFieldsTouched, // Pour handleNext/handleSubmit
                allRequiredFieldsFilled,
                visibleFieldsCount: allFieldsToCheck.length,
                requiredFieldsCount: requiredFields.length,
                // Informations supplémentaires pour debug
                currentStep: currentStepInfo,
                sectionIndex: navigation.sectionIndex,
                fieldPage: navigation.fieldPage,
                allFieldsTouched, // Si vous voulez vérifier tous les champs
                fieldNames: allFieldsToCheck.map(f => f.fieldName),
                // NOUVEAUX: Détails des erreurs pour les toasts
                invalidFields,
                untouchedRequiredFields,
                emptyRequiredFields
            };

            // console.log(`📋 Résultat validation ${currentStepInfo}:`, {
            //     isValid: result.isValid,
            //     touched: result.touched,
            //     allRequiredFieldsFilled: result.allRequiredFieldsFilled,
            //     visibleFieldsCount: result.visibleFieldsCount,
            //     requiredFieldsCount: result.requiredFieldsCount
            // });

            return result;

        } catch (error) {
            console.error("Erreur lors de la validation de la page:", error);
            return {
                isValid: false,
                touched: false,
                allRequiredFieldsFilled: false,
                visibleFieldsCount: 0,
                requiredFieldsCount: 0,
                invalidFields: [],
                untouchedRequiredFields: [],
                emptyRequiredFields: []
            };
        } finally {
            setIsValidating(false);
        }
    };

    return { validatePage, isValidating, setIsValidating };
};

export default useFormPageValidation;


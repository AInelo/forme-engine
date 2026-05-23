// components/atoms/formfield/types/validation.ts

import { z } from "zod";
import { type FormField } from "./formTypeStructure";

export const createZodSchema = (formFields: FormField[]) => {
    const schema: Record<string, any> = {};

    formFields.forEach((field) => {
        let zodSchema: any;

        // Définir le schéma de base selon le type
        switch (field.fieldType) {
            case "text":
            case "dropdown":
            case "radio":
                zodSchema = z.string();
                break;
            case "textarea":
                zodSchema = z.string();
                break;
            case "date":
                zodSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
                    message: "Date invalide",
                });
                break;
            case "number":
                zodSchema = z.coerce.number(); // Conversion automatique string -> number
                break;
            case "bool":
                zodSchema = z.boolean();
                break;
            case "checkbox":
                zodSchema = z.array(z.string()).optional();
                break;
            case "file":
                // Type de base: File, File[], null ou undefined
                zodSchema = z.union([
                    z.instanceof(File),
                    z.array(z.instanceof(File)),
                    z.null(),
                    z.undefined()
                ]);
                break;
            default:
                zodSchema = z.string();
        }

        // Appliquer les validations
        field.validations?.forEach((rule) => {
            
            let errMsg: string;

            if (rule.errMsg) {
            errMsg = rule.errMsg;
            } else if (rule.validationType) {
            errMsg = getDefaultErrorMessage(rule.validationType, rule.value);
            } else {
            errMsg = "Unknown validation error";
            }

            


            // const errMsg = rule.errMsg || getDefaultErrorMessage(rule.validationType, rule.value);
            
            switch (rule.validationType) {
                case "required":
                    if (field.fieldType === "text" || field.fieldType === "textarea" || field.fieldType === "dropdown" || field.fieldType === "radio") {
                        zodSchema = zodSchema.min(1, errMsg);
                    } else if (field.fieldType === "checkbox") {
                        zodSchema = z.array(z.string()).min(1, errMsg);
                    } else if (field.fieldType === "bool") {
                        zodSchema = zodSchema.refine((val: boolean) => val === true, { message: errMsg });
                    } else if (field.fieldType === "number") {
                        zodSchema = zodSchema.refine((val: number) => val !== null && val !== undefined, { message: errMsg });
                    } else if (field.fieldType === "file") {
                        zodSchema = zodSchema.refine(
                            (val: any) => {
                                // Vérifier si val est un File, un File[], ou un FileList avec au moins un fichier
                                if (val instanceof File) return true;
                                if (Array.isArray(val)) return val.length > 0 && val.every(f => f instanceof File);
                                if (val && typeof val.length === 'number') return val.length > 0;
                                return false;
                            },
                            { message: errMsg }
                        );
                    }
                    break;
                case "minLength":
                    if (zodSchema instanceof z.ZodString) {
                        zodSchema = zodSchema.min(rule.value as number, errMsg);
                    }
                    break;
                case "maxLength":
                    if (zodSchema instanceof z.ZodString) {
                        zodSchema = zodSchema.max(rule.value as number, errMsg);
                    }
                    break;
                case "regex":
                    if (zodSchema instanceof z.ZodString) {
                        zodSchema = zodSchema.regex(new RegExp(rule.value as string), errMsg);
                    }
                    break;
                case "email":
                    if (zodSchema instanceof z.ZodString) {
                        zodSchema = zodSchema.email(errMsg);
                    }
                    break;
                case "number":
                    zodSchema = z.coerce.number().refine((val) => !isNaN(val), {
                        message: errMsg,
                    });
                    break;
                case "phone_number": 
                    if (zodSchema instanceof z.ZodString) {
                        zodSchema = zodSchema.regex(
                            /^\+?[1-9]\d{1,14}$/,
                            errMsg
                        );
                    }
                    break;
                case "fileSize":
                case "fileType":
                    if (zodSchema instanceof z.ZodType) {
                        if (rule.validationType === "fileSize") {
                            const maxSize = Number(rule.value);
                            const validateSize = (input: unknown): boolean => {
                                if (input == null || input === "") {
                                    return true;
                                }
                                if (Array.isArray(input)) {
                                    return input.every((entry) => validateSize(entry));
                                }
                                if (input instanceof File) {
                                    return input.size <= maxSize;
                                }
                                // Valeurs déjà transformées (URL, string, etc.) -> validation déjà effectuée à l'upload
                                return true;
                            };
                            zodSchema = zodSchema.refine(validateSize, errMsg);
                        } else {
                            const allowedTypes = Array.isArray(rule.value)
                                ? (rule.value as string[])
                                : [];

                            const allowedExtensions = allowedTypes
                                .map((type) => {
                                    if (!type) return null;
                                    const cleaned = type.toLowerCase();
                                    if (cleaned.includes("/")) {
                                        return cleaned.split("/").pop() ?? null;
                                    }
                                    return cleaned.startsWith(".")
                                        ? cleaned.slice(1)
                                        : cleaned;
                                })
                                .filter((ext): ext is string => Boolean(ext));

                            const matchesAllowedType = (mime: string | undefined): boolean => {
                                if (allowedTypes.length === 0) {
                                    return true;
                                }
                                if (!mime) {
                                    return false;
                                }
                                return allowedTypes.includes(mime);
                            };

                            const matchesAllowedExtension = (value: string | undefined): boolean => {
                                if (allowedTypes.length === 0) {
                                    return true;
                                }
                                if (!value) return false;
                                const lowerValue = value.toLowerCase();
                                // Essayer de décoder l'URL pour obtenir le chemin
                                let target = lowerValue;
                                let filenameFromQuery: string | null = null;
                                try {
                                    const url = new URL(lowerValue);
                                    target = url.pathname.toLowerCase();
                                    filenameFromQuery =
                                        url.searchParams.get("filename") ??
                                        url.searchParams.get("file") ??
                                        url.searchParams.get("file_name") ??
                                        null;
                                } catch {
                                    target = lowerValue;
                                }
                                const queryTarget = filenameFromQuery
                                    ? filenameFromQuery.toLowerCase()
                                    : null;

                                return allowedExtensions.some((ext) => {
                                    if (target.endsWith(`.${ext}`)) {
                                        return true;
                                    }
                                    if (queryTarget && queryTarget.endsWith(`.${ext}`)) {
                                        return true;
                                    }
                                    return false;
                                });
                            };

                            const validateType = (input: unknown): boolean => {
                                if (input == null || input === "") {
                                    return true;
                                }
                                if (Array.isArray(input)) {
                                    return input.every((entry) => validateType(entry));
                                }
                                if (input instanceof File) {
                                    return matchesAllowedType(input.type);
                                }
                                if (typeof input === "string") {
                                    // Valeur déjà transformée (URL) : on valide via extension
                                    return matchesAllowedExtension(input) || allowedTypes.length === 0;
                                }
                                return true;
                            };

                            zodSchema = zodSchema.refine(validateType, errMsg);
                        }
                    }
                    break;
            }
        });

        // Si pas de validation required, rendre le champ optionnel
        const hasRequired = field.validations?.some(v => v.validationType === "required");
        if (!hasRequired) {
            zodSchema = zodSchema.optional();
        }

        schema[field.fieldName] = zodSchema;
    });

    return z.object(schema);
};

// Fonction helper pour les messages d'erreur par défaut
function getDefaultErrorMessage(validationType: string, value?: any): string {
    switch (validationType) {
        case "required": return "Ce champ est obligatoire";
        case "minLength": return `Minimum ${value} caractères`;
        case "maxLength": return `Maximum ${value} caractères`;
        case "regex": return "Format invalide";
        case "email": return "Email invalide";
        case "number": return "Nombre invalide";
        case "fileSize": return "Fichier trop volumineux";
        case "fileType": return "Type de fichier non autorisé";
        case "phone_number": return "Numéro de téléphone invalide";
        default: return "Valeur invalide";
    }
}





















































// import { z } from "zod";
// import { type FormField } from "./formTypeStructure";

// export const createZodSchema = (formFields: FormField[]) => {
//     const schema: Record<string, any> = {};

//     formFields.forEach((field) => {
//         let zodSchema: any;

//         switch (field.fieldType) {
//             case "text":
//             case "dropdown":
//             case "radio":
//                 zodSchema = z.string();
//                 break;
//             case "date":
//                 zodSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
//                     message: "Date invalide",
//                 });
//                 break;
//             case "bool":
//                 zodSchema = z.boolean();
//                 break;
//             case "file":
//                 zodSchema = z
//                     .instanceof(File)
//                     .or(z.array(z.instanceof(File)))
//                     .refine((files) => (Array.isArray(files) ? files.length > 0 : !!files), {
//                         message: "Un fichier est requis",
//                     });
//                 break;
//             default:
//                 zodSchema = z.any();
//         }

//         field.validations?.forEach((rule) => {
//             // Message d'erreur par défaut si non fourni
//             const errMsg = rule.errMsg || (() => {
//                 switch (rule.validationType) {
//                     case "required": return "Ce champ est obligatoire";
//                     case "minLength": return `Minimum ${rule.value} caractères`;
//                     case "maxLength": return `Maximum ${rule.value} caractères`;
//                     case "regex": return "Format invalide";
//                     case "email": return "Email invalide";
//                     case "number": return "Nombre invalide";
//                     case "fileSize": return "Fichier trop volumineux";
//                     case "fileType": return "Type de fichier non autorisé";
//                     case "phone_number": return "Numéro de téléphone invalide";
//                     default: return "Valeur invalide";
//                 }
//             })();
//             switch (rule.validationType) {
//                 case "required":
//                     if (zodSchema instanceof z.ZodString || zodSchema instanceof z.ZodArray) {
//                         zodSchema = zodSchema.nonempty(errMsg);
//                     } else if (zodSchema instanceof z.ZodBoolean) {
//                         zodSchema = zodSchema.refine(val => val !== null, {
//                             message: errMsg,
//                         });
//                     }
//                     break;
//                 case "minLength":
//                     if (zodSchema instanceof z.ZodString) {
//                         zodSchema = zodSchema.min(rule.value as number, errMsg);
//                     }
//                     break;
//                 case "maxLength":
//                     if (zodSchema instanceof z.ZodString) {
//                         zodSchema = zodSchema.max(rule.value as number, errMsg);
//                     }
//                     break;
//                 case "regex":
//                     if (zodSchema instanceof z.ZodString) {
//                         zodSchema = zodSchema.regex(new RegExp(rule.value as string), errMsg);
//                     }
//                     break;
//                 case "email":
//                     if (zodSchema instanceof z.ZodString) {
//                         zodSchema = zodSchema.email(errMsg);
//                     }
//                     break;
//                 case "number":
//                     if (zodSchema instanceof z.ZodAny) {
//                         zodSchema = z.number().refine((val) => !isNaN(val), {
//                             message: errMsg,
//                         });
//                     }
//                     break;
//                 case "fileSize":
//                     if (zodSchema instanceof z.ZodType) {
//                         zodSchema = zodSchema.refine(
//                             (file: File | File[]) =>
//                                 Array.isArray(file)
//                                     ? file.every((f) => f.size <= (rule.value as number))
//                                     : file.size <= (rule.value as number),
//                             errMsg
//                         );
//                     }
//                     break;
//                 case "fileType":
//                     if (zodSchema instanceof z.ZodType) {
//                         zodSchema = zodSchema.refine(
//                             (file: File | File[]) =>
//                                 Array.isArray(file)
//                                     ? file.every((f) => (rule.value as string[]).includes(f.type))
//                                     : (rule.value as string[]).includes(file.type),
//                             errMsg
//                         );
//                     }
//                     break;
//                 case "phone_number": 
//                     if (zodSchema instanceof z.ZodString) {
//                         zodSchema = zodSchema.regex(
//                             /^\+?[1-9]\d{1,14}$/,
//                             errMsg
//                         );
//                     }
//                     break;
//                 case "textarea": 
//                     zodSchema = z.string();
//                     break;
//             }
//         });

//         schema[field.formFieldId] = zodSchema;
//     });

//     return z.object(schema);
// };



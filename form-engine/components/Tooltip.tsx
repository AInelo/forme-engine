import { useState } from "react";

const Tooltip: React.FC<{
  tooltipContent?: string;
  helpTextContent?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}> = ({ tooltipContent = '', helpTextContent = '', children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipId] = useState(() => `tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const hasContent = tooltipContent.trim() || helpTextContent.trim();

  if (!hasContent) return <>{children}</>;

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-3'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-slate-800 border-t-[8px] border-l-transparent border-r-transparent border-l-[8px] border-r-[8px]',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-slate-800 border-b-[8px] border-l-transparent border-r-transparent border-l-[8px] border-r-[8px]',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-slate-800 border-l-[8px] border-t-transparent border-b-transparent border-t-[8px] border-b-[8px]',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-slate-800 border-r-[8px] border-t-transparent border-b-transparent border-t-[8px] border-b-[8px]'
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 px-4 py-3 text-sm font-medium text-white bg-slate-500 rounded-xl shadow-2xl max-w-2xl min-w-80 backdrop-blur-sm border border-slate-700 ${positionClasses[position]}`}
          style={{
            animation: 'tooltipFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            lineHeight: '1.5',
            wordWrap: 'break-word',
            hyphens: 'auto'
          }}
        >
          <div className="relative space-y-2">
            <ul className="list-disc list-inside space-y-1">
              {tooltipContent && <li>{tooltipContent}</li>}
              {helpTextContent && <li>{helpTextContent}</li>}
            </ul>
          
          </div>
            <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
        </div>
      )}

      <style>{`
        @keyframes tooltipFadeIn {
          from { 
            opacity: 0; 
            transform: translateY(8px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Tooltip;




//  const validatePage = async () => {
//       const isValid = await validateFields(navigation.pagedFields);
//       const values = methods.getValues();
      
//       // Convertir les valeurs du formulaire en format ResponseInForm pour les règles d'affichage
//       const allResponseInForms: Record<string, ResponseInForm> = {};
//       Object.entries(values).forEach(([key, value]) => {
//         allResponseInForms[key] = { responseValue: value };
//       });

//       // Filtrer les champs selon leurs conditions d'affichage
//       const visiblePagedFields = navigation.pagedFields.filter((field: FormField) => 
//         shouldDisplayFormField(field, allResponseInForms)
//       );

//       // Générer les champs répétés (uniquement pour les champs visibles)
//       const repeatFields = visiblePagedFields
//         .filter((f: FormField) => f.repeatGroup)
//         .flatMap((f: FormField) => {
//           const group = f.repeatGroup!;
//           const instanceCount = values[group.fieldName]?.length ?? 0;
          
//           const repeatedFields: FormField[] = [];
          
//           for (let i = 0; i < instanceCount; i++) {
//             for (const baseField of group.formFields) {
//               const repeatedField = {
//                 ...baseField,
//                 fieldName: `${group.fieldName}_${baseField.fieldName}_${i}`
//               };
              
//               // Vérifier si le champ répété doit être affiché
//               if (shouldDisplayFormField(repeatedField, allResponseInForms)) {
//                 repeatedFields.push(repeatedField);
//               }
//             }
//           }
          
//           return repeatedFields;
//         });

//       // Tous les champs à vérifier (visibles uniquement)
//       const allFieldsToCheck = [...visiblePagedFields, ...repeatFields];

//       // Vérifier si tous les champs requis et visibles ont été touchés
//       const touched = allFieldsToCheck.every((field) => {
//         const required = field.validations?.some(
//           (v: ValidationRule) => v.validationType === "required"
//         );
        
//         // Si le champ n'est pas requis, on considère qu'il est "touché"
//         if (!required) return true;
        
//         // Vérifier si le champ requis a été touché
//         return !!methods.formState.touchedFields?.[field.fieldName];
//       });

//       // Validation supplémentaire : vérifier que tous les champs requis et visibles ont une valeur
//       const allRequiredFieldsFilled = allFieldsToCheck.every((field) => {
//         const required = field.validations?.some(
//           (v: ValidationRule) => v.validationType === "required"
//         );
        
//         if (!required) return true;
        
//         const fieldValue = values[field.fieldName];
        
//         // Vérifier selon le type de champ
//         if (Array.isArray(fieldValue)) {
//           return fieldValue.length > 0;
//         }
        
//         return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
//       });

//       return { 
//         isValid, 
//         touched, 
//         allRequiredFieldsFilled,
//         visibleFieldsCount: allFieldsToCheck.length,
//         requiredFieldsCount: allFieldsToCheck.filter(f => 
//           f.validations?.some(v => v.validationType === "required")
//         ).length
//       };
//     };

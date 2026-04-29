import type {  Section } from "./formTypeStructure";


/**
 * Normalise les données reçues depuis react-hook-form, en restructurant
 * les champs des groupes répétables dans un format par tableau d’objets.
 *
 * @param flatData Données plates de RHF (ex: champ_0, champ_1, etc.)
 * @param sections Sections du formulaire (chacune contient des champs)
 * @returns Données restructurées prêtes à être persistées ou envoyées
 */
export function normalizeFormData(
  flatData: Record<string, any>,
  sections: Section[]
): Record<string, any> {
  const result: Record<string, any> = {};
  const usedKeys = new Set<string>();

  const markUsedKeysForGroup = (groupFieldName: string) => {
    usedKeys.add(groupFieldName);
    for (const key of Object.keys(flatData)) {
      if (key === groupFieldName || key.startsWith(`${groupFieldName}_`)) {
        usedKeys.add(key);
      }
    }
  };

  for (const section of sections) {
    for (const field of section.formFields) {
      const group = field.repeatGroup;

      if (group) {
        const storedGroupValue = flatData[group.fieldName];

        if (Array.isArray(storedGroupValue)) {
          result[group.fieldName] = storedGroupValue.map((instance) => {
            if (!instance || typeof instance !== "object") {
              return instance;
            }

            const normalizedInstance: Record<string, any> = {};

            for (const childField of group.formFields) {
              const value = instance[childField.fieldName];

              if (childField.repeatGroup) {
                const nestedGroupFieldName = childField.repeatGroup.fieldName;
                const nestedValue = instance[nestedGroupFieldName];

                if (Array.isArray(nestedValue)) {
                  normalizedInstance[nestedGroupFieldName] = nestedValue.map((nestedEntry) => {
                    if (!nestedEntry || typeof nestedEntry !== "object") {
                      return nestedEntry;
                    }

                    const normalizedNestedEntry: Record<string, any> = {};

                    childField.repeatGroup!.formFields.forEach((nestedField) => {
                      if (nestedEntry[nestedField.fieldName] !== undefined) {
                        normalizedNestedEntry[nestedField.fieldName] = nestedEntry[nestedField.fieldName];
                      }
                    });

                    return normalizedNestedEntry;
                  });

                  markUsedKeysForGroup(nestedGroupFieldName);
                }

                if (value !== undefined) {
                  normalizedInstance[childField.fieldName] = value;
                }
              } else if (value !== undefined) {
                normalizedInstance[childField.fieldName] = value;
              }
            }

            return normalizedInstance;
          });
        } else {
          result[group.fieldName] = [];
        }

        markUsedKeysForGroup(group.fieldName);
        continue;
      }

      if (!usedKeys.has(field.fieldName) && flatData[field.fieldName] !== undefined) {
        result[field.fieldName] = flatData[field.fieldName];
        usedKeys.add(field.fieldName);
      }
    }
  }

  // Ajouter les champs restants (hors repeatGroups et clés temporaires)
  for (const [key, value] of Object.entries(flatData)) {
    if (!usedKeys.has(key)) {
      result[key] = value;
    }
  }

  return result;
}
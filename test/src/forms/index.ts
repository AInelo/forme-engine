import type { FormStructure } from 'form-engine';
import { registrationForm } from './registrationForm';
import { surveyForm } from './surveyForm';
import { conditionalForm } from './conditionalForm';

export interface FormEntry {
  id: string;
  label: string;
  description: string;
  form: FormStructure;
}

export const allForms: FormEntry[] = [
  {
    id: "inscription",
    label: "Inscription",
    description: "Pagination par section · Validation · Dropdown avec recherche",
    form: registrationForm,
  },
  {
    id: "satisfaction",
    label: "Satisfaction",
    description: "Radio · Checkbox · Bool · Textarea",
    form: surveyForm,
  },
  {
    id: "conditionnel",
    label: "Conditionnel",
    description: "Champs affichés selon la valeur d'un autre champ",
    form: conditionalForm,
  },
];

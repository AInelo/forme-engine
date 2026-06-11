import type { FormStructure } from 'forme-engine';
import { registrationForm } from './registrationForm';
import { surveyForm } from './surveyForm';
import { conditionalForm } from './conditionalForm';
import { noBannerForm } from './noBannerForm';
import { mobileInlineNavForm } from './mobileInlineNavForm';
import { halfWidthForm } from './halfWidthForm';

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
  {
    id: "sans-banner",
    label: "Sans banner",
    description: "headerOptions.visible = false · pas d'en-tête",
    form: noBannerForm,
  },
  {
    id: "nav-inline",
    label: "Nav inline mobile",
    description: "mobileNavSticky: false · boutons en flux sur mobile",
    form: mobileInlineNavForm,
  },
  {
    id: "grille",
    label: "Grille half/full",
    description: "width: half · deux champs côte à côte · mix half + full",
    form: halfWidthForm,
  },
];

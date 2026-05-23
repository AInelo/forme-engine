import type { FormStructure } from 'form-engine';

export const conditionalForm: FormStructure = {
  name: "Affichage conditionnel",
  provider: "Sublime World",
  description: "Champs affichés dynamiquement selon le profil sélectionné",
  status: "ACTIVE",
  isDeclaration: 0,
  isTest: 1,
  theme: {
    primaryColor: "#e67e22", // orange
  },
  layoutOptions: {
    paginationMode: "byFields",
    progressBarType: { type: "default_step", visible: true },
    displayDeleteButton: true,
  },
  sections: [
    {
      sectionId: "cond-s1",
      title: "Profil professionnel",
      formFields: [
        {
          formFieldId: "cond-nom",
          fieldName: "nom_complet",
          fieldType: "text",
          label: "Nom complet",
          response: { responseValue: "" },
          placeholder: "Prénom Nom",
          validations: [
            { validationType: "required", errMsg: "Le nom est requis" },
          ],
        },
        {
          formFieldId: "cond-situation",
          fieldName: "situation",
          fieldType: "dropdown",
          label: "Situation professionnelle",
          response: { responseValue: "" },
          selectOptions: [
            { value: "salarie", label: "Salarié" },
            { value: "independant", label: "Indépendant / Freelance" },
            { value: "etudiant", label: "Étudiant" },
            { value: "retraite", label: "Retraité" },
          ],
          validations: [
            { validationType: "required", errMsg: "La situation est requise" },
          ],
        },

        // Visible uniquement si "salarie"
        {
          formFieldId: "cond-entreprise",
          fieldName: "nom_entreprise",
          fieldType: "text",
          label: "Nom de l'entreprise",
          response: { responseValue: "" },
          placeholder: "Ex : Sublime World SAS",
          conditionalDisplay: {
            rules: { fieldName: "situation", operator: "==", value: "salarie" },
          },
          validations: [
            { validationType: "required", errMsg: "Le nom de l'entreprise est requis" },
          ],
        },
        {
          formFieldId: "cond-poste",
          fieldName: "intitule_poste",
          fieldType: "text",
          label: "Intitulé du poste",
          response: { responseValue: "" },
          placeholder: "Ex : Développeur senior",
          conditionalDisplay: {
            rules: { fieldName: "situation", operator: "==", value: "salarie" },
          },
        },

        // Visible uniquement si "independant"
        {
          formFieldId: "cond-siret",
          fieldName: "siret",
          fieldType: "text",
          label: "Numéro SIRET",
          response: { responseValue: "" },
          placeholder: "000 000 000 00000",
          conditionalDisplay: {
            rules: { fieldName: "situation", operator: "==", value: "independant" },
          },
        },
        {
          formFieldId: "cond-activite",
          fieldName: "secteur_activite",
          fieldType: "dropdown",
          label: "Secteur d'activité",
          response: { responseValue: "" },
          selectOptions: [
            { value: "tech", label: "Technologie / Numérique" },
            { value: "conseil", label: "Conseil / Consulting" },
            { value: "creation", label: "Création / Design" },
            { value: "sante", label: "Santé" },
            { value: "education", label: "Éducation" },
            { value: "autre", label: "Autre" },
          ],
          conditionalDisplay: {
            rules: { fieldName: "situation", operator: "==", value: "independant" },
          },
        },

        // Visible uniquement si "etudiant"
        {
          formFieldId: "cond-etablissement",
          fieldName: "etablissement",
          fieldType: "text",
          label: "Établissement scolaire",
          response: { responseValue: "" },
          placeholder: "Université, école...",
          conditionalDisplay: {
            rules: { fieldName: "situation", operator: "==", value: "etudiant" },
          },
        },
        {
          formFieldId: "cond-niveau",
          fieldName: "niveau_etudes",
          fieldType: "radio",
          label: "Niveau d'études",
          response: { responseValue: "" },
          selectOptions: [
            { value: "licence", label: "Licence (Bac+3)" },
            { value: "master", label: "Master (Bac+5)" },
            { value: "doctorat", label: "Doctorat" },
          ],
          conditionalDisplay: {
            rules: { fieldName: "situation", operator: "==", value: "etudiant" },
          },
        },

        // Champ commun visible pour salarie + independant
        {
          formFieldId: "cond-revenu",
          fieldName: "tranche_revenu",
          fieldType: "radio",
          label: "Tranche de revenus mensuels nets",
          response: { responseValue: "" },
          selectOptions: [
            { value: "moins_2000", label: "Moins de 2 000 €" },
            { value: "2000_4000", label: "2 000 € – 4 000 €" },
            { value: "4000_7000", label: "4 000 € – 7 000 €" },
            { value: "plus_7000", label: "Plus de 7 000 €" },
          ],
          conditionalDisplay: {
            rules: [
              { fieldName: "situation", operator: "==", value: "salarie" },
              { fieldName: "situation", operator: "==", value: "independant" },
            ],
            logic: "OR",
          },
        },
      ],
    },
  ],
};

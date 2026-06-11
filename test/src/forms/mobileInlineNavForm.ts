import type { FormStructure } from 'forme-engine';

export const mobileInlineNavForm: FormStructure = {
  name: "Navigation mobile inline",
  provider: "Sublime World",
  description: "Test de mobileNavSticky: false — boutons en flux, pas de barre fixée en bas",
  status: "ACTIVE",
  isDeclaration: 0,
  isTest: 1,
  theme: {
    primaryColor: "#0f766e",
  },
  layoutOptions: {
    paginationMode: "bySection",
    progressBarType: { type: "section_bubble", visible: true },
    headerOptions: { visible: true, type: "default" },
    displayDeleteButton: true,
    mobileNavSticky: false,
  },
  sections: [
    {
      sectionId: "min-s1",
      title: "Étape 1 — Identité",
      formFields: [
        {
          formFieldId: "min-prenom",
          fieldName: "prenom",
          fieldType: "text",
          label: "Prénom",
          response: { responseValue: "" },
          placeholder: "Votre prénom",
          width: "half",
          validations: [
            { validationType: "required", errMsg: "Le prénom est requis" },
          ],
        },
        {
          formFieldId: "min-nom",
          fieldName: "nom",
          fieldType: "text",
          label: "Nom",
          response: { responseValue: "" },
          placeholder: "Votre nom",
          width: "half",
          validations: [
            { validationType: "required", errMsg: "Le nom est requis" },
          ],
        },
        {
          formFieldId: "min-email",
          fieldName: "email",
          fieldType: "text",
          label: "Email",
          response: { responseValue: "" },
          placeholder: "exemple@email.com",
          validations: [
            { validationType: "required", errMsg: "L'email est requis" },
            { validationType: "email", errMsg: "Email invalide" },
          ],
        },
      ],
    },
    {
      sectionId: "min-s2",
      title: "Étape 2 — Projet",
      formFields: [
        {
          formFieldId: "min-sujet",
          fieldName: "sujet",
          fieldType: "dropdown",
          label: "Sujet",
          response: { responseValue: "" },
          selectOptions: [
            { value: "dev", label: "Développement" },
            { value: "design", label: "Design" },
            { value: "conseil", label: "Conseil" },
          ],
          validations: [
            { validationType: "required", errMsg: "Le sujet est requis" },
          ],
        },
        {
          formFieldId: "min-message",
          fieldName: "message",
          fieldType: "textarea",
          label: "Description du projet",
          response: { responseValue: "" },
          placeholder: "Décrivez votre projet...",
          validations: [
            { validationType: "required", errMsg: "La description est requise" },
            { validationType: "minLength", value: 20, errMsg: "Minimum 20 caractères" },
          ],
        },
      ],
    },
  ],
};

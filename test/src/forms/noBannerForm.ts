import type { FormStructure } from 'forme-engine';

export const noBannerForm: FormStructure = {
  name: "Formulaire sans banner",
  provider: "Sublime World",
  description: "Test d'un formulaire sans header/banner",
  status: "ACTIVE",
  isDeclaration: 0,
  isTest: 1,
  theme: {
    primaryColor: "#7c3aed",
  },
  layoutOptions: {
    paginationMode: "bySection",
    progressBarType: { type: "section_bubble", visible: true },
    headerOptions: { visible: false },
    displayDeleteButton: false,
  },
  sections: [
    {
      sectionId: "nb-s1",
      title: "Contact",
      formFields: [
        {
          formFieldId: "nb-nom",
          fieldName: "nom",
          fieldType: "text",
          label: "Nom complet",
          response: { responseValue: "" },
          placeholder: "Votre nom",
          validations: [
            { validationType: "required", errMsg: "Le nom est requis" },
          ],
        },
        {
          formFieldId: "nb-email",
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
        {
          formFieldId: "nb-message",
          fieldName: "message",
          fieldType: "textarea",
          label: "Message",
          response: { responseValue: "" },
          placeholder: "Votre message...",
          validations: [
            { validationType: "required", errMsg: "Le message est requis" },
            { validationType: "minLength", value: 10, errMsg: "Minimum 10 caractères" },
          ],
        },
      ],
    },
  ],
};

import type { FormStructure } from 'form-engine';

export const surveyForm: FormStructure = {
  name: "Enquête de satisfaction",
  provider: "Sublime World",
  description: "Évaluez votre expérience avec notre service",
  status: "ACTIVE",
  isDeclaration: 0,
  isTest: 1,
  theme: {
    primaryColor: "#7c3aed", // violet
  },
  layoutOptions: {
    paginationMode: "bySection",
    progressBarType: { type: "linear", visible: true },
    displayDeleteButton: false,
  },
  sections: [
    {
      sectionId: "survey-s1",
      title: "Votre évaluation",
      formFields: [
        {
          formFieldId: "survey-note",
          fieldName: "note_globale",
          fieldType: "radio",
          label: "Note globale (1 à 5)",
          response: { responseValue: "" },
          selectOptions: [
            { value: "1", label: "⭐ 1 — Très insatisfait" },
            { value: "2", label: "⭐⭐ 2 — Insatisfait" },
            { value: "3", label: "⭐⭐⭐ 3 — Neutre" },
            { value: "4", label: "⭐⭐⭐⭐ 4 — Satisfait" },
            { value: "5", label: "⭐⭐⭐⭐⭐ 5 — Très satisfait" },
          ],
          validations: [
            { validationType: "required", errMsg: "Veuillez donner une note" },
          ],
        },
        {
          formFieldId: "survey-aspects",
          fieldName: "aspects_apprecies",
          fieldType: "checkbox",
          label: "Qu'avez-vous apprécié ? (plusieurs choix possibles)",
          response: { responseValue: [] },
          selectOptions: [
            { value: "interface", label: "Interface utilisateur" },
            { value: "rapidite", label: "Rapidité d'exécution" },
            { value: "support", label: "Support client" },
            { value: "prix", label: "Rapport qualité / prix" },
            { value: "fonctionnalites", label: "Richesse des fonctionnalités" },
          ],
        },
        {
          formFieldId: "survey-recommande",
          fieldName: "recommanderait",
          fieldType: "bool",
          label: "Recommanderiez-vous notre service à un collègue ?",
          response: { responseValue: false },
        },
      ],
    },
    {
      sectionId: "survey-s2",
      title: "Vos commentaires",
      formFields: [
        {
          formFieldId: "survey-commentaire",
          fieldName: "commentaire_libre",
          fieldType: "textarea",
          label: "Commentaire libre",
          response: { responseValue: "" },
          placeholder: "Partagez votre expérience en quelques mots...",
          validations: [
            { validationType: "required", errMsg: "Le commentaire est requis" },
            { validationType: "minLength", value: 20, errMsg: "Minimum 20 caractères" },
          ],
        },
        {
          formFieldId: "survey-amelioration",
          fieldName: "suggestion_amelioration",
          fieldType: "textarea",
          label: "Suggestions d'amélioration",
          response: { responseValue: "" },
          placeholder: "Qu'est-ce qui pourrait être amélioré ?",
        },
        {
          formFieldId: "survey-contact",
          fieldName: "email_contact",
          fieldType: "text",
          label: "Email (si vous souhaitez être recontacté)",
          response: { responseValue: "" },
          placeholder: "votre@email.com",
          validations: [
            { validationType: "email", errMsg: "Email invalide" },
          ],
        },
      ],
    },
  ],
};

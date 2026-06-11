import type { FormStructure } from 'forme-engine';

export const halfWidthForm: FormStructure = {
  name: "Disposition en grille",
  provider: "Sublime World",
  description: "Démonstration du layout width: half — deux champs côte à côte",
  status: "ACTIVE",
  isDeclaration: 0,
  isTest: 1,
  theme: {
    primaryColor: "#b45309",
  },
  layoutOptions: {
    paginationMode: "bySection",
    progressBarType: { type: "section_bubble", visible: true },
    headerOptions: { visible: true, type: "default" },
    displayDeleteButton: false,
    mobileNavSticky: false,
  },
  sections: [
    {
      sectionId: "hw-s1",
      title: "Informations personnelles",
      formFields: [
        // Ligne 1 : two halves
        {
          formFieldId: "hw-prenom",
          fieldName: "prenom",
          fieldType: "text",
          label: "Prénom",
          response: { responseValue: "" },
          placeholder: "Votre prénom",
          width: "half",
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
        {
          formFieldId: "hw-nom",
          fieldName: "nom",
          fieldType: "text",
          label: "Nom de famille",
          response: { responseValue: "" },
          placeholder: "Votre nom",
          width: "half",
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
        // Ligne 2 : two halves
        {
          formFieldId: "hw-dob",
          fieldName: "date_naissance",
          fieldType: "date",
          label: "Date de naissance",
          response: { responseValue: "" },
          width: "half",
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
        {
          formFieldId: "hw-tel",
          fieldName: "telephone",
          fieldType: "text",
          label: "Téléphone",
          response: { responseValue: "" },
          placeholder: "+33 6 00 00 00 00",
          width: "half",
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
        // Ligne 3 : full width seul
        {
          formFieldId: "hw-email",
          fieldName: "email",
          fieldType: "text",
          label: "Email (pleine largeur)",
          response: { responseValue: "" },
          placeholder: "exemple@email.com",
          width: "full",
          validations: [
            { validationType: "required", errMsg: "Requis" },
            { validationType: "email", errMsg: "Email invalide" },
          ],
        },
      ],
    },
    {
      sectionId: "hw-s2",
      title: "Adresse",
      formFields: [
        // Ligne 1 : full
        {
          formFieldId: "hw-rue",
          fieldName: "rue",
          fieldType: "text",
          label: "Rue et numéro (pleine largeur)",
          response: { responseValue: "" },
          placeholder: "12 rue des Acacias",
          width: "full",
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
        // Ligne 2 : half + half
        {
          formFieldId: "hw-cp",
          fieldName: "code_postal",
          fieldType: "text",
          label: "Code postal",
          response: { responseValue: "" },
          placeholder: "75001",
          width: "half",
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
        {
          formFieldId: "hw-ville",
          fieldName: "ville",
          fieldType: "text",
          label: "Ville",
          response: { responseValue: "" },
          placeholder: "Paris",
          width: "half",
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
        // Ligne 3 : half + half (dropdown + dropdown)
        {
          formFieldId: "hw-pays",
          fieldName: "pays",
          fieldType: "dropdown",
          label: "Pays",
          response: { responseValue: "" },
          width: "half",
          enableSearch: true,
          selectOptions: [
            { value: "fr", label: "France" },
            { value: "be", label: "Belgique" },
            { value: "ch", label: "Suisse" },
            { value: "ci", label: "Côte d'Ivoire" },
            { value: "sn", label: "Sénégal" },
          ],
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
        {
          formFieldId: "hw-region",
          fieldName: "region",
          fieldType: "dropdown",
          label: "Région",
          response: { responseValue: "" },
          width: "half",
          selectOptions: [
            { value: "idf", label: "Île-de-France" },
            { value: "paca", label: "PACA" },
            { value: "aura", label: "Auvergne-Rhône-Alpes" },
            { value: "occ", label: "Occitanie" },
          ],
          validations: [{ validationType: "required", errMsg: "Requis" }],
        },
      ],
    },
  ],
};

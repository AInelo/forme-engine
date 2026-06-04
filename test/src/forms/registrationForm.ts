import type { FormStructure } from 'forme-engine';

export const registrationForm: FormStructure = {
  name: "Formulaire d'inscription",
  provider: "Sublime World",
  description: "Inscription standard avec validation",
  status: "ACTIVE",
  isDeclaration: 0,
  isTest: 1,
  theme: {
    primaryColor: "#1a56db", // bleu indigo
  },
  layoutOptions: {
    paginationMode: "bySection",
    progressBarType: { type: "section_bubble", visible: true },
    headerOptions: { visible: true, type: "default" },
    displayDeleteButton: true,
  },
  sections: [
    {
      sectionId: "reg-s1",
      title: "Informations personnelles",
      formFields: [
        {
          formFieldId: "reg-prenom",
          fieldName: "prenom",
          fieldType: "text",
          label: "Prénom",
          response: { responseValue: "" },
          placeholder: "Votre prénom",
          width: "half",
          validations: [
            { validationType: "required", errMsg: "Le prénom est requis" },
            { validationType: "minLength", value: 2, errMsg: "Minimum 2 caractères" },
          ],
        },
        {
          formFieldId: "reg-nom",
          fieldName: "nom",
          fieldType: "text",
          label: "Nom de famille",
          response: { responseValue: "" },
          placeholder: "Votre nom",
          width: "half",
          validations: [
            { validationType: "required", errMsg: "Le nom est requis" },
          ],
        },
        {
          formFieldId: "reg-email",
          fieldName: "email",
          fieldType: "text",
          label: "Adresse email",
          response: { responseValue: "" },
          placeholder: "exemple@email.com",
          validations: [
            { validationType: "required", errMsg: "L'email est requis" },
            { validationType: "email", errMsg: "Email invalide" },
          ],
        },
        {
          formFieldId: "reg-password",
          fieldName: "mot_de_passe",
          fieldType: "password",
          label: "Mot de passe",
          response: { responseValue: "" },
          placeholder: "Minimum 8 caractères",
          validations: [
            { validationType: "required", errMsg: "Le mot de passe est requis" },
            { validationType: "minLength", value: 8, errMsg: "Minimum 8 caractères" },
          ],
        },
      ],
    },
    {
      sectionId: "reg-s2",
      title: "Coordonnées",
      formFields: [
        {
          formFieldId: "reg-phone",
          fieldName: "telephone",
          fieldType: "text",
          label: "Téléphone",
          response: { responseValue: "" },
          placeholder: "+33 6 00 00 00 00",
          validations: [
            { validationType: "required", errMsg: "Le téléphone est requis" },
          ],
        },
        {
          formFieldId: "reg-pays",
          fieldName: "pays",
          fieldType: "dropdown",
          label: "Pays de résidence",
          response: { responseValue: "" },
          enableSearch: true,
          selectOptions: [
            { value: "fr", label: "France" },
            { value: "ci", label: "Côte d'Ivoire" },
            { value: "sn", label: "Sénégal" },
            { value: "cm", label: "Cameroun" },
            { value: "mg", label: "Madagascar" },
            { value: "tn", label: "Tunisie" },
            { value: "ma", label: "Maroc" },
            { value: "be", label: "Belgique" },
            { value: "ch", label: "Suisse" },
          ],
          validations: [
            { validationType: "required", errMsg: "Le pays est requis" },
          ],
        },
        {
          formFieldId: "reg-naissance",
          fieldName: "date_naissance",
          fieldType: "date",
          label: "Date de naissance",
          response: { responseValue: "" },
          validations: [
            { validationType: "required", errMsg: "La date de naissance est requise" },
          ],
        },
        {
          formFieldId: "reg-cgv",
          fieldName: "accepte_cgv",
          fieldType: "bool",
          label: "J'accepte les conditions générales d'utilisation",
          response: { responseValue: false },
          validations: [
            { validationType: "required", errMsg: "Vous devez accepter les CGV" },
          ],
        },
      ],
    },
  ],
};

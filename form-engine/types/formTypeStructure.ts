// components/atoms/formfield/types/formTypeStructure.ts

// =============================================
// ===          ELEMENTARY VALUES       ========
// =============================================

/**
 * Represents a generic response value that can be of various types.
 *
 * @property responseValue - The value of the response, which can be a string, an array of strings,
 * a number, an array of numbers, a boolean, a File, or an array of Files.
 */
export interface ResponseInForm {
    responseValue: string | string[] | number | number[] | boolean | File | File[] | null;
}


/**
 * Représente une option sélectionnable dans un champ de formulaire de type sélection.
 *
 * @property value - La valeur unique associée à l’option (utilisée en interne).
 * @property label - Le libellé affiché à l’utilisateur. Peut être une chaîne de caractères ou un objet de traductions par langue.
 * @property points - (Optionnel) Nombre de points associés à cette option, utilisé pour des calculs ou des scores.
 * @property icon - (Optionnel) Icône à afficher à côté de l’option dans l’interface utilisateur.
 */
export interface SelectOption {
    value: string;
    label: string | { [lang: string]: string };
    points?: number; // dans le cas d'un jeu de choix
    icon?: string; // Optionnel : pour l’UI (ex : icône affichée à côté)
}
// =============================================
// ===          ELEMENTARY VALUES       ========
// =============================================






// =============================================
// === CONDITIONAL DISPLAY STRUCTURES       ====
// =============================================

export type ConditionalOperator = 
  | "==" 
  | "!=" 
  | ">" 
  | "<" 
  | "IN" 
  | "NOT IN" 
  | "CONTAINS" 
  | "NOT CONTAINS";

/**
 * Méthodes d’agrégation de valeurs de plusieurs champs
 */
export type TypeComputation = "SOMME" | "MULTIPLICATION";

/**
 * Une règle unique de condition d'affichage.
 */
export interface ConditionalDisplayRule {
  /**
   * Clé(s) technique(s) des champs sur lesquels appliquer la règle.
   * Peut être utilisé si formFieldId n’est pas renseigné.
   */
  fieldName?: string | string[];

  /**
   * ID(s) unique(s) des champs (UUID).
   * Peut remplacer ou compléter fieldName.
   */
  formFieldId?: string | string[];

  /**
   * La valeur ou les valeurs attendues (cible de comparaison).
   */
  value?: string | number | boolean | string[] | number[];

  /**
   * L’opérateur de comparaison.
   */
  operator?: ConditionalOperator;

  /**
   * Comparaison à une valeur numérique (dans le cas d’une agrégation ou d’un champ nombre).
   */
  numeric_compare_to?: number;

  /**
   * Si plusieurs champs sont ciblés, méthode d’agrégation des valeurs.
   * Exemple : SOMME, MULTIPLICATION
   */
  typeComputation?: TypeComputation;
}

/**
 * Groupe de règles à combiner selon une logique AND ou OR
 */
export interface ConditionalDisplayGroup {
  rules: ConditionalDisplayRule | ConditionalDisplayRule[];
  logic?: "AND" | "OR";
}


// =============================================
// === CONFITION OF VALIDATION OF FORMFIELD ====
// =============================================

/**
 * Represents the available validation types for form fields.
 *
 * - `"required"`: Ensures the field is not empty.
 * - `"minLength"`: Validates that the field value meets a minimum length.
 * - `"maxLength"`: Validates that the field value does not exceed a maximum length.
 * - `"regex"`: Validates the field value against a regular expression pattern.
 * - `"email"`: Ensures the field value is a valid email address.
 * - `"number"`: Ensures the field value is a valid number.
 * - `"fileSize"`: Validates the size of an uploaded file.
 * - `"phone_number"`: Ensures the field value is a valid phone number.
 * - `"textarea"`: Indicates the field is a textarea input.
 * - `"fileType"`: Validates the type of an uploaded file.
 */
export type ValidationType =
    | "required"
    | "minLength"
    | "maxLength"
    | "regex"
    | "email"
    | "number"
    | "fileSize"
    | "phone_number" 
    | "textarea"
    | "fileType";


/**
 * Represents a validation rule for a form field.
 *
 * @property validationType - The type of validation to apply (e.g., required, minLength, pattern).
 * @property value - The value associated with the validation rule. This can be a number, a string, or an array of strings, depending on the validation type.
 * @property errMsg - The error message to display if the validation fails.
 */
export interface ValidationRule {
    validationType?: ValidationType;
    value?: number | string | string[];
    errMsg: string;
}
// =============================================
// === CONFITION OF VALIDATION OF FORMFIELD ====
// =============================================













// =============================================
// ===          REPETITION RULES            ====
// =============================================


/**
 * Décrit la logique de répétition d’un groupe de champs selon une valeur numérique saisie dans un autre champ.
 */
export interface RepeatRule {


  /**
   * Limite maximale du nombre de répétitions autorisées (optionnelle).
   */
  max?: number;

  /**
   * Limite minimale du nombre de répétitions requises (optionnelle).
   */
  min?: number;

  /**
   * Indique si on pré-remplit automatiquement un ensemble vide (utile pour le rendu initial).
   */
  prefillEmpty?: boolean;
}










export interface FormRepeatGroup {
    repeatGroupId: string;     // ID unique du groupe répétable
    fieldName: string;         // Clé technique, comme pour FormField
    label: string | { [lang: string]: string };  // Libellé du groupe
    minRepeats?: number;       // Nombre minimum d’instances
    maxRepeats?: number;       // Nombre maximum d’instances
    initialRepeats?: number;   // Nombre d'instances créées initialement
    formFields: FormField[];   // Champs contenus dans chaque répétition
    position?: number;         // Position d'affichage
    conditionalDisplay?: ConditionalDisplayGroup;
}



export enum SpecialField {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  DOCUMENT = "DOCUMENT",
  PDF = "PDF",
  VOICE = "VOICE",
  TIP_TAP_DOC_TEXT = "TIP_TAP_DOC_TEXT",
  OTP = "OTP",
}



// =============================================
// ===     OTP FORM FIELD EXEC OPTIONS    ======
// =============================================

export interface OTPFormFieldExecOptions {
  serverDns: string;
  /** Endpoint relatif, ex: /api/otp/send */
  postApiEndPoint: string;
  /** Payload à envoyer avec la requête OTP (sera fusionné avec les données du formulaire) */
  payload?: Record<string, any> | Map<string, unknown>;
  /** Headers additionnels à joindre à la requête */
  extraHeaders?: Record<string, string>;
  /** Token Bearer pour l'authentification */
  bearer?: string;
  /** Timeout en ms pour la requête */
  timeoutMs?: number;
  /** Nombre de cases OTP (défaut: 6) */
  otpLength?: number;
  /** Nom du champ Email qui doit déclencher l'envoi de l'OTP (dans une section précédente) */
  linkedEmailFieldName?: string;
  /** Configuration pour l'envoi initial de l'OTP (quand l'email est saisi). Si non défini, utilise la même config que la vérification */
  sendOTPApiConfig?: {
    serverDns: string;
    postApiEndPoint: string;
    payload?: Record<string, any> | Map<string, unknown>;
    extraHeaders?: Record<string, string>;
    bearer?: string;
  };
  /** Activer la validation automatique quand tous les chiffres sont saisis (défaut: false) */
  autoValidate?: boolean;
  /** Activer le bouton "Renvoyer le code" (défaut: true) */
  enableResend?: boolean;
  /** Délai minimum en secondes entre deux envois de code (défaut: 60) */
  resendCooldownSeconds?: number;
}


// =============================================
// ===  EMAIL FORM FIELD EXEC OPTIONS    ======
// =============================================

export interface EmailFormFieldExecOptions {
  /** Si true, déclenche automatiquement l'envoi d'OTP quand l'email est validé */
  triggerOTPSend?: boolean;
  /** Nom du champ OTP lié (optionnel, pour validation) */
  linkedOTPFieldName?: string;
  /** Configuration API pour l'envoi d'OTP */
  otpSendApiConfig?: {
    serverDns: string;
    postApiEndPoint: string;
    payload?: Record<string, any> | Map<string, unknown>;
    extraHeaders?: Record<string, string>;
    bearer?: string;
  };
}

export interface OTPFormFieldLink {
  fieldName: string;
  fieldType: "email" | "favoris";
}














// =============================================
// ===     FILE TO BUCKET MANAGEMENT     ======
// =============================================



export interface FileToBucketManage {
  uploadOption: UploadOption;
  deleteOption: DeleteOption;
}

/**
 * Options pour l’upload d’un fichier vers le bucket.
 * Correspond à POST /api/files/upload-file (ou /upload-files pour du multi).
 */
export interface UploadOption {
  /** Base URL du service, ex: https://bucket.urmaphalab.com */
  serverDns: string;
  /** Endpoint relatif, ex: /api/files/upload-file */
  postApiEndPoint: string;
  /**
   * Payload non sérialisé : sera converti en multipart/form-data.
   * Clés attendues par l’API :
   * - file : File ou Blob (obligatoire)
   * - secret_key : string (obligatoire)
   * - folder_name : string (optionnel, défaut “general”)
   * - filename : string (optionnel, sans extension)
   * - files / filenames pour la variante multi-upload
   */
  payload?: Map<string, unknown> | Record<string, unknown>;
  /** Optionnel : Authorization: Bearer ... si l’API évolue en nécessite */
  bearer?: string;
  /** Headers supplémentaires à joindre à la requête (hors Content-Type géré par FormData) */
  extraHeaders?: Record<string, string>;
  /** Timeout en ms, si l’on veut borner la requête */
  timeoutMs?: number;
  /** Optionnel : hook pour logger ou transformer la réponse brute */
  onResponse?(response: Response): Promise<void>;
}

/**
 * Options pour supprimer un fichier du bucket.
 * Compatible avec:
 *  - DELETE /api/files/delete-file
 *  - DELETE /api/files/delete-file-by-url
 */
export interface DeleteOption {
  /** Base URL du service, ex: https://bucket.urmaphalab.com */
  serverDns: string;
  /** Endpoint relatif, ex: /api/files/delete-file */
  deleteApiEndPoint: string;
  /**
   * Payload JSON envoyé en body (ou query string).
   * Clés possibles suivant la route utilisée :
   * - secret_key : string (obligatoire)
   * - folder_name : string (optionnel, défaut “general”)
   * - filename : string (obligatoire si delete-file)
   * - file_url : string (obligatoire si delete-file-by-url)
   */
  payload?: Record<string, unknown> | Map<string, unknown>;
  /** Optionnel : Authorization: Bearer ... */
  bearer?: string;
  /** Headers additionnels à envoyer */
  extraHeaders?: Record<string, string>;
  /** Timeout en ms pour cette requête */
  timeoutMs?: number;
  /** Optionnel : hook pour logger ou transformer la réponse brute */
  onResponse?(response: Response): Promise<void>;
}














// =============================================
// ===     THE FORM CORE COMPONENTS     ========
// =============================================

/**
 * Represents a form field definition with metadata, validation, and display options.
 *
 * @property formFieldId - Unique identifier for the form field (UUID or generated).
 * @property fieldName - Internal technical key for the field.
 * @property slug - Optional, human-readable key for URLs or UI.
 * @property dataLabel - Optional, label used for export or processing.
 * @property fieldType - Type of the form field (e.g., text, dropdown, date, etc.).
 * @property label - Field label, can be a string or a multilingual object.
 * @property response - The response value or list of responses for the field.
 * @property selectOptions - Optional, list of selectable options for select, radio, or checkbox fields.
 * @property validations - Optional, array of validation rules for the field.
 * @property position - Optional, display order of the field.
 * @property placeholder - Optional, placeholder text, can be a string or multilingual object.
 * @property tooltip - Optional, tooltip text, can be a string or multilingual object.
 * @property helpText - Optional, help text, can be a string or multilingual object.
 * @property example - Optional, example value, can be a string or multilingual object.
 * @property conditionalDisplay - Optional, conditional display logic for the field.
 */
export interface FormField {
    formFieldId: string;                              // ID unique (UUID ou généré)
    fieldName: string;                                // Clé technique interne
    slug?: string;                                    // Clé lisible pour URL / UI
    fieldType: 
        | "text"
        | "textarea"
        | "dropdown"
        | "radio"
        | "checkbox"
        | "date"
        | "number"
        | "bool"
        | "file"
        | "password"
        | SpecialField;
    label: string | { [lang: string]: string };       // Label multilingue
    repeatGroup ?: FormRepeatGroup; // Groupe répétable (optionnel)
    repeatRule?: RepeatRule; // Règle de répétition (optionnelle)
    response: ResponseInForm;                 // Réponse ou liste de réponses
    selectOptions?: SelectOption[];                   // Options pour select/radio/checkbox
    validations?: ValidationRule[];                   // Liste des règles de validation
    position?: number;                                // Ordre d'affichage
    placeholder?: string | { [lang: string]: string };
    tooltip?: string | { [lang: string]: string };
    helpText?: string | { [lang: string]: string };
    example?: string | { [lang: string]: string };
    enableSearch?: boolean;
    dynamicFilterRule?: DynamicFilterRule;
    conditionalDisplay?: ConditionalDisplayGroup;      // Logique d'affichage conditionnel
    fileToBucketManage?: FileToBucketManage;           // Gestion des fichiers vers le bucket
    width?: "full" | "half";                            // Largeur du champ: "full" = 100% (mobile), "half" = 50% (tablet+)
    otpFormFieldExecOptions?: OTPFormFieldExecOptions;  // Options pour l'envoi et validation OTP
    emailFormFieldExecOptions?: EmailFormFieldExecOptions; // Options pour les champs Email qui déclenchent l'envoi d'OTP
    flattenOnSubmit?: boolean;                          // Si true, aplatir le champ dans le JSON final (défaut: true pour OTP)
    detailInfos?: DetailInfosConfig;                    // Configuration pour générer automatiquement des champs de détails selon l'option sélectionnée
}

/**
 * Configuration pour générer automatiquement des champs de détails
 * quand une option est sélectionnée dans un dropdown, radio ou checkbox.
 * 
 * @property [optionValue] - Pour chaque valeur d'option, définir les champs de détails à générer
 * @property formFields - Liste des champs à générer pour cette option
 * @property label - Label optionnel pour le groupe de détails (peut être multilingue)
 */
export interface DetailInfosConfig {
  [optionValue: string]: {
    formFields: FormField[];
    label?: string | { [lang: string]: string };
  };
}

export interface DynamicFilterRule {
  dependentFieldName: string;           // Le champ dont dépend ce filtre
  filterType: "exact" | "hierarchical"; // Type de filtrage
  dataSource: {
    type: "static" | "external";        // Source des données
    data: Record<string, DynamicFilteringDataSourceElement[]>;
    // OU
    endpoint?: string;                  // Pour données externes
  };
  // Optionnel : transformation des données
  transform?: {
    valueKey: string;                   // Clé pour la valeur
    labelKey: string;                   // Clé pour le label
  };
}

export interface DynamicFilteringDataSourceElement {
  value: string;
  label: string | { [lang: string]: string };
}


/**
 * Sous-section regroupant des champs.
 */
/**
 * Represents a subsection within a form structure.
 *
 * @property subSectionId - Unique identifier for the subsection.
 * @property title - Optional title of the subsection. Can be a string, a localized object, or null.
 * @property subTitle - Optional subtitle of the subsection. Can be a string, a localized object, or null.
 * @property isSpacer - Optional visual spacer indicator (e.g., for visual separation).
 * @property position - Optional display order of the subsection.
 * @property formFields - Array of form fields contained in this subsection.
 */
export interface Section {
    sectionId: string;
    title?: string | { [lang: string]: string } | null;  // Titre optionnel de la section
    subTitle?: string | { [lang: string]: string } | null;  // Sous-titre optionnel de la section
    isSpacer?: string;                    // Pour gestion visuelle (ex : séparation)
    position?: number;                    // Ordre d'affichage de la sous-section
    formFields: FormField[];
    conditionalDisplay?: ConditionalDisplayGroup;      // Logique d'affichage conditionnel
}


/**
 * Structure complète d’un formulaire.
 */
/**
 * Represents the structure of a form.
 *
 * @property name - The name of the form.
 * @property provider - The author or provider of the form.
 * @property description - A general description of the form.
 * @property status - The activation status of the form. Can be "ACTIVE" or "INACTIVE".
 * @property isDeclaration - Indicates if the form is an official declaration (1 = yes, 0 = no).
 * @property isTest - Indicates if the form is a test form (1 = yes, 0 = no).
 * @property version - (Optional) The version of the form.
 * @property createdAt - (Optional) The ISO date when the form was created.
 * @property updatedAt - (Optional) The ISO date when the form was last updated.
 * @property sections - The sections that compose the form.
 */
export interface FormTheme {
    primaryColor?: string; // Code hex de la couleur principale, ex: "#008080"
}

export interface FormStructure {
    name: string;                         // Nom du formulaire
    provider: string;                     // Auteur / fournisseur
    description: string;                  // Description générale
    status: "ACTIVE" | "INACTIVE";        // Statut d'activation
    isDeclaration: number;                // 1 = déclaration officielle
    isTest: number;                       // 1 = formulaire de test
    version?: string;                     // Version du formulaire
    createdAt?: string;                   // Date de création (ISO)
    updatedAt?: string;                   // Date de mise à jour (ISO)
    sections: Section[];                  // Sections composant le formulaire
    theme?: FormTheme;                    // Thème visuel (couleur principale)
    layoutOptions?: FormEngineLayoutOptions; // Options de layout et pagination du formulaire
}
// =============================================
// ===        THE FORM COMPONENTS       ========
// =============================================




// =============================================
// ===        FORM ENGINE LAYOUTOPTIONS       ========
// =============================================

export interface FormEngineLayoutOptions {
  paginationMode?: "byFields" | "bySection"; // Mode de pagination: "byFields" = par nombre de champs (défaut), "bySection" = une section = une page
  progressBarType?: ProgressBarType;
  headerOptions?: HeaderOptions;
  displayDeleteButton?: boolean;
  containerStyles?: ContainerStylesOptions; // Styles personnalisés pour les conteneurs
}


export interface ProgressBarType {
  type: "default_step" | "custom" | "pastel" | "linear" | "section_bubble" | "section_bubble_pastel";
  colors?: {
    background: string;
    foreground: string;
  };
  visible?: boolean;
}

export interface HeaderOptions {
  visible?: boolean;                    // Contrôle de visibilité du header
  type: "default" | "custom";           // Type de header : "default" = header par défaut, "custom" = composant personnalisé
  customHeader?: React.ReactNode;       // Composant React personnalisé à afficher si type === "custom"
}

// Interface pour les styles d'un conteneur
export interface ContainerStyles {
  borderColor?: string;        // Couleur de la bordure (ex: "#e5e7eb", "slate-200", "rgb(226, 232, 240)")
  borderWidth?: string | number; // Épaisseur de la bordure (ex: "2px", 2, "1px", "0.5rem")
  backgroundColor?: string;     // Couleur de fond (ex: "#ffffff", "white", "#F6F6F6", "rgb(246, 246, 246)")
}

// Options de styles pour les conteneurs du FormEngine
export interface ContainerStylesOptions {
  mainContainer?: ContainerStyles;    // Styles pour le grand conteneur (qui contient sections + boutons)
  sectionContainer?: ContainerStyles; // Styles pour le petit conteneur (qui contient la section)
}
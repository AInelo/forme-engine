<div align="center">

# `@ainelo/form-engine`

**A powerful, JSON-driven React form engine** — conditional logic, multi-step pagination, OTP, file uploads, repeat groups, multilingual labels, and more. Build complex forms without writing form code.

[![npm version](https://img.shields.io/npm/v/@ainelo/form-engine?color=teal&style=flat-square)](https://www.npmjs.com/package/@ainelo/form-engine)
[![license](https://img.shields.io/npm/l/@ainelo/form-engine?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://react.dev/)

</div>

---

## Overview

`@ainelo/form-engine` lets you describe a form as a **plain JSON object** and render it as a fully functional, validated, multi-step React form. No boilerplate. No manual `useState` for every field. You define the structure — the engine handles the rest.

**Key capabilities:**

- **All standard field types** — text, textarea, dropdown, radio, checkbox, date, number, boolean, password, file
- **Rich media fields** — image, video, audio, document, PDF, voice recording
- **Rich text editor** — TipTap integration
- **OTP verification** — built-in phone/email OTP flow with resend logic
- **File-to-bucket uploads** — upload and delete files via a configurable API
- **Conditional display** — show/hide sections and fields based on other field values
- **Repeat groups** — dynamic lists of fields (e.g. list of passengers, children, etc.)
- **Multi-step pagination** — by section or by field count, with progress bar
- **Multilingual labels** — every text supports `{ fr: "...", en: "..." }` objects
- **Zod validation** — automatic schema generation from field definitions
- **Form persistence** — draft saving via Zustand
- **Theming** — primary color + per-container style overrides

---

## Installation

```bash
npm install @ainelo/form-engine
```

### Peer dependencies

The following packages must be installed in your project:

```bash
npm install react react-dom react-hook-form zod zustand lucide-react react-hot-toast \
  @tiptap/react @tiptap/starter-kit @tiptap/extension-image \
  @tiptap/extension-link @tiptap/extension-placeholder
```

---

## Quick start

```tsx
import { FormEngine } from "@ainelo/form-engine";
import type { FormStructure } from "@ainelo/form-engine";

const form: FormStructure = {
  name: "Contact",
  provider: "Acme Corp",
  description: "Simple contact form",
  status: "ACTIVE",
  isDeclaration: 0,
  isTest: 0,
  theme: { primaryColor: "#008080" },
  layoutOptions: {
    paginationMode: "bySection",
    progressBarType: { type: "linear", visible: true },
  },
  sections: [
    {
      sectionId: "section-contact",
      title: { fr: "Vos informations", en: "Your information" },
      formFields: [
        {
          formFieldId: "f-name",
          fieldName: "full_name",
          fieldType: "text",
          label: { fr: "Nom complet", en: "Full name" },
          response: { responseValue: "" },
          width: "half",
          validations: [
            { validationType: "required", errMsg: "Le nom est requis" },
          ],
        },
        {
          formFieldId: "f-email",
          fieldName: "email",
          fieldType: "text",
          label: "Email",
          response: { responseValue: "" },
          width: "half",
          validations: [
            { validationType: "required", errMsg: "L'email est requis" },
            { validationType: "email", errMsg: "Email invalide" },
          ],
        },
      ],
    },
  ],
};

export default function App() {
  return (
    <FormEngine
      form={form}
      formId="contact-form"
      onSubmit={(data) => console.log(data)}
      currentLang="fr"
      submitButtonText="Envoyer"
    />
  );
}
```

---

## `<FormEngine>` props

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `form` | `FormStructure` | ✅ | — | The complete form definition object |
| `formId` | `string` | ✅ | — | Unique instance ID — used for draft persistence |
| `onSubmit` | `(data: Record<string, any>) => void` | ✅ | — | Called when the form is valid and submitted |
| `currentLang` | `string` | | `"fr"` | Active language code for multilingual labels |
| `submitButtonText` | `string` | | `"Continuer"` | Label of the submit / next button |
| `paginationMode` | `"byFields" \| "bySection"` | | `"byFields"` | Overrides `form.layoutOptions.paginationMode` |

---

## Form structure reference

### `FormStructure`

The root object passed to the `form` prop.

```ts
{
  name: string;
  provider: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  isDeclaration: number;   // 1 = official declaration, 0 = standard
  isTest: number;          // 1 = test, 0 = production
  version?: string;
  createdAt?: string;      // ISO date string
  updatedAt?: string;      // ISO date string
  sections: Section[];
  theme?: FormTheme;
  layoutOptions?: FormEngineLayoutOptions;
}
```

---

### `FormTheme`

```ts
{
  primaryColor?: string;  // Hex color — e.g. "#008080"
}
```

---

### `FormEngineLayoutOptions`

```ts
{
  paginationMode?: "byFields" | "bySection";
  progressBarType?: ProgressBarType;
  headerOptions?: HeaderOptions;
  displayDeleteButton?: boolean;       // Show "clear all" button — default: true
  containerStyles?: ContainerStylesOptions;
}
```

#### `ProgressBarType`

| `type` value | Description |
|---|---|
| `"default_step"` | Classic numbered steps |
| `"linear"` | Horizontal progress bar |
| `"pastel"` | Pastel-toned step bar |
| `"custom"` | Custom colors via `colors` |
| `"section_bubble"` | Bubble indicators per section |
| `"section_bubble_pastel"` | Pastel bubble indicators |

```ts
progressBarType: {
  type: "linear",
  visible: true,
  colors: {
    background: "#e5e7eb",
    foreground: "#008080",
  },
}
```

#### `HeaderOptions`

```ts
{
  visible?: boolean;
  type: "default" | "custom";
  customHeader?: React.ReactNode;  // Only used when type === "custom"
}
```

#### `ContainerStylesOptions`

Customize the border and background of the form containers:

```ts
{
  mainContainer?: ContainerStyles;    // Outer container (sections + buttons)
  sectionContainer?: ContainerStyles; // Inner container (each section)
}

// ContainerStyles
{
  borderColor?: string;         // e.g. "#e5e7eb"
  borderWidth?: string | number; // e.g. "1px" or 1
  backgroundColor?: string;     // e.g. "#f9fafb"
}
```

---

### `Section`

A section groups related fields. Each section becomes a page in `"bySection"` mode.

```ts
{
  sectionId: string;
  title?: string | { [lang: string]: string } | null;
  subTitle?: string | { [lang: string]: string } | null;
  isSpacer?: string;
  position?: number;
  formFields: FormField[];
  conditionalDisplay?: ConditionalDisplayGroup;
}
```

---

### `FormField`

The core building block. Every field in `section.formFields` follows this shape:

```ts
{
  formFieldId: string;           // Unique ID — UUID recommended
  fieldName: string;             // Technical key — becomes the key in onSubmit data
  slug?: string;                 // Human-readable key for URLs / exports
  fieldType: FieldType;          // See table below
  label: string | { [lang: string]: string };
  response: { responseValue: string | string[] | number | number[] | boolean | File | File[] | null };
  selectOptions?: SelectOption[];
  validations?: ValidationRule[];
  position?: number;
  placeholder?: string | { [lang: string]: string };
  tooltip?: string | { [lang: string]: string };
  helpText?: string | { [lang: string]: string };
  example?: string | { [lang: string]: string };
  width?: "full" | "half";
  enableSearch?: boolean;
  conditionalDisplay?: ConditionalDisplayGroup;
  repeatGroup?: FormRepeatGroup;
  repeatRule?: RepeatRule;
  fileToBucketManage?: FileToBucketManage;
  otpFormFieldExecOptions?: OTPFormFieldExecOptions;
  emailFormFieldExecOptions?: EmailFormFieldExecOptions;
  detailInfos?: DetailInfosConfig;
  dynamicFilterRule?: DynamicFilterRule;
  flattenOnSubmit?: boolean;
}
```

#### Field types

| `fieldType` | UI rendered | Notes |
|---|---|---|
| `"text"` | Text input | Also used for email with validation |
| `"textarea"` | Multi-line input | |
| `"dropdown"` | Select list | Requires `selectOptions`. Supports `enableSearch` |
| `"radio"` | Radio buttons | Requires `selectOptions` |
| `"checkbox"` | Checkboxes | Requires `selectOptions` |
| `"date"` | Date picker | |
| `"number"` | Numeric input | |
| `"bool"` | Toggle / switch | |
| `"file"` | File upload | Generic |
| `"password"` | Password input | Masked |
| `"IMAGE"` | Image upload | Preview included |
| `"VIDEO"` | Video upload | |
| `"AUDIO"` | Audio upload | |
| `"DOCUMENT"` | Document upload | |
| `"PDF"` | PDF upload | |
| `"VOICE"` | Voice recording | Browser mic |
| `"TIP_TAP_DOC_TEXT"` | Rich text editor | TipTap-powered |
| `"OTP"` | OTP code input | Requires `otpFormFieldExecOptions` |

---

### `SelectOption`

Used with `dropdown`, `radio`, and `checkbox` fields:

```ts
{
  value: string;
  label: string | { [lang: string]: string };
  points?: number;  // Score / weight for quiz-like forms
  icon?: string;    // Icon name or URL
}
```

---

### `ValidationRule`

```ts
{
  validationType?: ValidationType;
  value?: number | string | string[];
  errMsg: string;  // Error message displayed to the user
}
```

#### Validation types

| `validationType` | `value` type | Description |
|---|---|---|
| `"required"` | — | Field must not be empty |
| `"minLength"` | `number` | Minimum character count |
| `"maxLength"` | `number` | Maximum character count |
| `"regex"` | `string` | Must match the given pattern |
| `"email"` | — | Must be a valid email address |
| `"number"` | — | Must be a valid number |
| `"fileSize"` | `number` | Max file size in bytes |
| `"phone_number"` | — | Must be a valid phone number |
| `"fileType"` | `string[]` | Allowed MIME types — e.g. `["image/png", "image/jpeg"]` |

---

## Conditional display

Show or hide a section or field based on the values of other fields.

```ts
{
  rules: ConditionalDisplayRule | ConditionalDisplayRule[];
  logic?: "AND" | "OR";   // Default: "AND"
}
```

### `ConditionalDisplayRule`

```ts
{
  fieldName?: string | string[];       // Target by technical key
  formFieldId?: string | string[];     // Target by UUID
  operator?: ConditionalOperator;
  value?: string | number | boolean | string[] | number[];
  numeric_compare_to?: number;         // For aggregation comparisons
  typeComputation?: "SOMME" | "MULTIPLICATION";
}
```

### Operators

`"=="` · `"!="` · `">"` · `"<"` · `"IN"` · `"NOT IN"` · `"CONTAINS"` · `"NOT CONTAINS"`

### Examples

```ts
// Show field only if "has_vehicle" equals "yes"
conditionalDisplay: {
  rules: { fieldName: "has_vehicle", operator: "==", value: "yes" },
}

// Show section if country is France OR Belgium
conditionalDisplay: {
  rules: { fieldName: "country", operator: "IN", value: ["FR", "BE"] },
}

// Show if score1 + score2 > 10
conditionalDisplay: {
  rules: {
    fieldName: ["score1", "score2"],
    typeComputation: "SOMME",
    operator: ">",
    numeric_compare_to: 10,
  },
}
```

---

## Repeat groups

A `FormRepeatGroup` defines a block of fields that users can repeat N times (e.g. list of children, co-applicants).

```ts
// On FormField
repeatGroup: {
  repeatGroupId: string;
  fieldName: string;
  label: string | { [lang: string]: string };
  minRepeats?: number;
  maxRepeats?: number;
  initialRepeats?: number;
  formFields: FormField[];
  position?: number;
  conditionalDisplay?: ConditionalDisplayGroup;
}

repeatRule: {
  min?: number;
  max?: number;
  prefillEmpty?: boolean;   // Pre-fill one empty instance on initial render
}
```

---

## OTP field

```ts
{
  formFieldId: "f-otp",
  fieldName: "otp_code",
  fieldType: "OTP",
  label: "Code de vérification",
  response: { responseValue: "" },
  otpFormFieldExecOptions: {
    serverDns: "https://api.example.com",
    postApiEndPoint: "/api/otp/verify",
    otpLength: 6,
    linkedEmailFieldName: "email",   // Triggers OTP send when this field is filled
    sendOTPApiConfig: {
      serverDns: "https://api.example.com",
      postApiEndPoint: "/api/otp/send",
      bearer: "my-token",
    },
    autoValidate: true,
    enableResend: true,
    resendCooldownSeconds: 60,
  },
}
```

To trigger OTP send automatically from the email field, add `emailFormFieldExecOptions` to it:

```ts
{
  formFieldId: "f-email",
  fieldName: "email",
  fieldType: "text",
  label: "Email",
  response: { responseValue: "" },
  validations: [{ validationType: "email", errMsg: "Email invalide" }],
  emailFormFieldExecOptions: {
    triggerOTPSend: true,
    linkedOTPFieldName: "otp_code",
    otpSendApiConfig: {
      serverDns: "https://api.example.com",
      postApiEndPoint: "/api/otp/send",
    },
  },
}
```

---

## File uploads to a bucket

Add `fileToBucketManage` to any file-type field to automatically upload on selection and delete on removal:

```ts
fileToBucketManage: {
  uploadOption: {
    serverDns: "https://bucket.example.com",
    postApiEndPoint: "/api/files/upload-file",
    payload: { secret_key: "my-secret", folder_name: "avatars" },
    bearer: "my-token",
    timeoutMs: 30000,
  },
  deleteOption: {
    serverDns: "https://bucket.example.com",
    deleteApiEndPoint: "/api/files/delete-file",
    payload: { secret_key: "my-secret", folder_name: "avatars" },
  },
}
```

---

## Dynamic filter (cascading dropdowns)

Filter a dropdown's options based on another field's selected value:

```ts
{
  formFieldId: "f-city",
  fieldName: "city",
  fieldType: "dropdown",
  label: "Ville",
  response: { responseValue: "" },
  dynamicFilterRule: {
    dependentFieldName: "country",   // When "country" changes, reload city options
    filterType: "exact",
    dataSource: {
      type: "static",
      data: {
        FR: [
          { value: "paris", label: "Paris" },
          { value: "lyon", label: "Lyon" },
        ],
        BE: [
          { value: "bruxelles", label: "Bruxelles" },
          { value: "liege", label: "Liège" },
        ],
      },
    },
  },
}
```

---

## Detail fields on selection

Automatically reveal additional fields when the user selects a specific option:

```ts
{
  formFieldId: "f-sector",
  fieldName: "sector",
  fieldType: "dropdown",
  label: "Secteur",
  response: { responseValue: "" },
  selectOptions: [
    { value: "agri", label: "Agriculture" },
    { value: "other", label: "Autre" },
  ],
  detailInfos: {
    other: {
      label: "Précisez votre secteur",
      formFields: [
        {
          formFieldId: "f-sector-detail",
          fieldName: "sector_detail",
          fieldType: "text",
          label: "Secteur exact",
          response: { responseValue: "" },
        },
      ],
    },
  },
}
```

---

## Multilingual support

Every `label`, `placeholder`, `tooltip`, `helpText`, and `example` field accepts either a plain string or a language map:

```ts
label: { fr: "Nom complet", en: "Full name", es: "Nombre completo" }
```

Pass `currentLang="en"` to `<FormEngine>` to switch the active language at runtime.

---

## What `onSubmit` receives

The `onSubmit` callback receives a flat `Record<string, any>` where each key is a field's `fieldName`. File fields return the uploaded URL (if `fileToBucketManage` is configured) or the `File` object. Repeat groups return an array of objects.

```ts
// Example output
{
  full_name: "Alice Dupont",
  email: "alice@example.com",
  sector: "other",
  sector_detail: "Fintech",
  passengers: [
    { passenger_name: "Bob", passenger_age: 32 },
    { passenger_name: "Carol", passenger_age: 28 },
  ],
  id_document: "https://bucket.example.com/files/doc-abc123.pdf",
}
```

---

## License

MIT © [Lionel TOTON](mailto:totonlionel@gmail.com)

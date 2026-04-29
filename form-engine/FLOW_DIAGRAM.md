# 🎯 Diagramme de Flux - Validation et Blocage

## 📊 Vue d'Ensemble du Flux

```
┌─────────────────────────────────────────────────────────────────┐
│                    UTILISATEUR CLIQUE "SUIVANT"                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FormNavigation.tsx (ligne 142-153)                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  <ValidationBtn                                           │  │
│  │    onClick={onNext}           ← Appelle handleNext        │  │
│  │    disabled={isValidating}    ← Bloque si validation      │  │
│  │  >                                                          │  │
│  │    {isValidating ? 'Validation...' : 'Suivant'}           │  │
│  │  </ValidationBtn>                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│        useFormNavigationActions.ts (handleNext)                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  setIsValidating(true)     ← Bloque les boutons          │  │
│  │                                                           │  │
│  │  const result = await validatePage()                     │  │
│  │     ↓                                                     │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  useFormPageValidation.ts                           │ │  │
│  │  │  ┌───────────────────────────────────────────────┐  │ │  │
│  │  │  │  1. Récupérer les valeurs actuelles           │  │ │  │
│  │  │  │  2. Filtrer champs VISIBLES                   │  │ │  │
│  │  │  │  3. Gérer repeat groups                       │  │ │  │
│  │  │  │  4. Combiner tous les champs                  │  │ │  │
│  │  │  │  5. ✅ Validation Zod (isValid)               │  │ │  │
│  │  │  │  6. Identifier champs requis                  │  │ │  │
│  │  │  │  7. Vérifier touchés (touched)                │  │ │  │
│  │  │  │  8. Vérifier remplis (allRequiredFieldsFilled)│  │ │  │
│  │  │  │  9. Retourner résultat                        │  │ │  │
│  │  │  └───────────────────────────────────────────────┘  │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATIONS EN CASCADE                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  if (!isValid)                                          │   │
│  │    ❌ toast.error("Champs invalides ⚠️")                │   │
│  │    return; ← ARRÊT                                       │   │
│  │  ▼                                                       │   │
│  │  if (!touched)                                          │   │
│  │    ❌ toast.error("Compléter tous les champs ✋")        │   │
│  │    return; ← ARRÊT                                       │   │
│  │  ▼                                                       │   │
│  │  if (!allRequiredFieldsFilled)                          │   │
│  │    ❌ toast.error("Champs obligatoires 📝")              │   │
│  │    return; ← ARRÊT                                       │   │
│  │  ▼                                                       │   │
│  │  ✅ TOUTES LES VALIDATIONS PASSÉES                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
              ❌ ERREUR   ✅ SUCCÈS
                    │         │
                    ▼         ▼
┌───────────────────────┐  ┌─────────────────────────────┐
│  BLOCAGE              │  │  NAVIGATION AUTORISÉE       │
│  ┌───────────────────┐│  │  ┌─────────────────────────┐│
│  │ setIsValidating   ││  │  │ navigation.goToNext()   ││
│  │   = false         ││  │  │                         ││
│  │                   ││  │  │ toast.success("🎉")     ││
│  │ User reste sur    ││  │  │                         ││
│  │ même page         ││  │  │ setIsValidating         ││
│  │                   ││  │  │   = false               ││
│  │ Erreur affichée   ││  │  │                         ││
│  │ sous champ        ││  │  │ User passe à page       ││
│  │ + toast error     ││  │  │ suivante                ││
│  │                   ││  │  │                         ││
│  └───────────────────┘│  │  └─────────────────────────┘│
└───────────────────────┘  └─────────────────────────────┘
```

---

## 🔍 Flux Détail : Validation Zod

```
┌─────────────────────────────────────────────────────────────────┐
│         useFormValidation.ts (validateFields)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Mapper les noms de champs                            │  │
│  │     fieldNames = fields.map(f => f.fieldName)            │  │
│  │                                                           │  │
│  │  2. Appeler trigger() de React Hook Form                 │  │
│  │     const valid = await trigger(fieldNames)              │  │
│  │        ↓                                                 │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │  React Hook Form va chercher le schéma Zod       │  │  │
│  │  │  associé à chaque champ                          │  │  │
│  │  │                                                   │  │  │
│  │  │  Pour chaque champ:                              │  │  │
│  │  │  ┌─────────────────────────────────────────────┐ │  │  │
│  │  │  │  Exemple: Email                             │ │  │  │
│  │  │  │  ------------------------------------------- │ │  │  │
│  │  │  │  validations: [                             │ │  │  │
│  │  │  │    { type: "required", msg: "..." }         │ │  │  │
│  │  │  │    { type: "email", msg: "..." }            │ │  │  │
│  │  │  │  ]                                           │ │  │  │
│  │  │  │                   ↓                         │ │  │  │
│  │  │  │  Zod Schema:                                │ │  │  │
│  │  │  │  z.string()                                 │ │  │  │
│  │  │  │    .min(1, "Champ requis")                  │ │  │  │
│  │  │  │    .email("Format invalide")                │ │  │  │
│  │  │  └─────────────────────────────────────────────┘ │  │  │
│  │  │                                                   │  │  │
│  │  │  Valide la valeur actuelle contre le schéma      │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  3. Retourner le résultat                               │  │
│  │     return valid;                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Affichage des Erreurs - Double Canal

```
┌─────────────────────────────────────────────────────────────────┐
│                  DOUBLE AFFICHAGE D'ERREUR                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CANAL 1 : Sous le Champ                                │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  FormFieldWrapper.tsx (ligne 194-252)             │  │   │
│  │  │                                                     │  │   │
│  │  │  showError = (isTouched && invalid) ||             │  │   │
│  │  │             isSubmitted                            │  │   │
│  │  │                                                     │  │   │
│  │  │  {showError && errorMessages.map(msg =>            │  │   │
│  │  │    <p className="text-red-500">{msg}</p>           │  │   │
│  │  │  )}                                                 │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  Rendu :                                                │   │
│  │  ╔════════════════════════════════════════════╗        │   │
│  │  ║ Email                                      ║        │   │
│  │  ╠════════════════════════════════════════════╣        │   │
│  │  ║ [email invalide                    ]       ║        │   │
│  │  ╠════════════════════════════════════════════╣        │   │
│  │  ║ ❌ Format d'email invalide                 ║        │   │
│  │  ╚════════════════════════════════════════════╝        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CANAL 2 : Toast Flottant                               │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  useFormNavigationActions.ts                       │  │   │
│  │  │  import toast from "react-hot-toast"               │  │   │
│  │  │                                                     │  │   │
│  │  │  toast.error("Des champs sont invalides ⚠️")       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  Rendu :                                                │   │
│  │  ┌──────────────────────────────────────────┐          │   │
│  │  │  ❌ Des champs sont invalides ⚠️         │          │   │
│  │  └──────────────────────────────────────────┘          │   │
│  │                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Cycle de Vie du Bouton "Suivant"

```
┌─────────────────────────────────────────────────────────────────┐
│                    ÉTAT INITIAL                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  isValidating = false                                     │  │
│  │  disabled = false                                         │  │
│  │  text = "Suivant"                                         │  │
│  │  ↓                                                        │  │
│  │  ╔════════════════════╗                                   │  │
│  │  ║ [  Suivant  ]     ║  ← Cliquable                     │  │
│  │  ╚════════════════════╝                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ User clique
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VALIDATION EN COURS                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  setIsValidating(true)                                    │  │
│  │  disabled = true                                          │  │
│  │  text = "Validation..."                                   │  │
│  │  ↓                                                        │  │
│  │  ╔════════════════════╗                                   │  │
│  │  ║[  Validation...  ]║  ← Grisé, non cliquable          │  │
│  │  ╚════════════════════╝                                   │  │
│  │                                                           │  │
│  │  ⏳ validatePage() en cours...                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
              ❌ ERREUR   ✅ SUCCÈS
                    │         │
                    ▼         ▼
┌───────────────────────┐  ┌─────────────────────────────┐
│  RETOUR ÉTAT INITIAL  │  │  NAVIGATION                 │
│  ┌───────────────────┐│  │  ┌─────────────────────────┐│
│  │ setIsValidating   ││  │  │ navigation.goToNext()   ││
│  │   = false         ││  │  │                         ││
│  │                   ││  │  │ setIsValidating         ││
│  │ ╔═══════════════╗ ││  │  │   = false               ││
│  │ ║ [  Suivant  ] ║ ││  │  │                         ││
│  │ ╚═══════════════╝ ││  │  │ User va sur page        ││
│  │                   ││  │  │ suivante                ││
│  │ Toast error       ││  │  │                         ││
│  │ Reste sur page    ││  │  │ Toast success           ││
│  └───────────────────┘│  │  └─────────────────────────┘│
└───────────────────────┘  └─────────────────────────────┘
```

---

## 📋 Checklist de Validation

```
┌─────────────────────────────────────────────────────────────────┐
│              VALIDATION CHECKLIST (useFormPageValidation)       │
│                                                                 │
│  ☐ 1. Champs visibles identifiés                               │
│      └─ shouldDisplaySection()                                 │
│      └─ shouldDisplayFormField()                               │
│                                                                 │
│  ☐ 2. Repeat groups gérés                                      │
│      └─ Instances dynamiques                                   │
│      └─ Nommage unique (_0, _1, _2...)                         │
│                                                                 │
│  ☐ 3. Validation Zod déclenchée                                │
│      └─ trigger(fieldNames)                                    │
│      └─ Schéma généré automatiquement                          │
│                                                                 │
│  ☐ 4. Champs requis identifiés                                 │
│      └─ validations.some(v => v.type === "required")           │
│                                                                 │
│  ☐ 5. Touchés vérifiés                                         │
│      └─ formState.touchedFields                                │
│                                                                 │
│  ☐ 6. Remplis vérifiés                                         │
│      └─ Valeur != undefined && != null && != ''               │
│      └─ Array.length > 0 pour tableaux                         │
│                                                                 │
│  ☐ 7. Résultat retourné                                        │
│      └─ isValid                                                 │
│      └─ touched                                                 │
│      └─ allRequiredFieldsFilled                                │
│      └─ Compteurs                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Résumé Visuel

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  UTILISATEUR                                                    │
│     │                                                            │
│     │ Clic "Suivant"                                            │
│     ▼                                                            │
│  ┌──────────────────────┐                                       │
│  │  handleNext()        │                                       │
│  │  ├─ validatePage()   │                                       │
│  │  ├─ Toast error?     │  ❌                                   │
│  │  ├─ ✅ OK?           │  → Bloque + retour                    │
│  │  └─ goToNext()       │  ✅ Success                           │
│  └──────────────────────┘                                       │
│     │                                                            │
│     ├─❌─→ Toast error                                          │
│     │     Reste sur page                                        │
│     │                                                            │
│     └─✅─→ Toast success                                        │
│           Passe page suivante                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Date** : 2024  
**Auteur** : Auto (Diagrammes de flux)  
**Status** : ✅ Diagrammes complets


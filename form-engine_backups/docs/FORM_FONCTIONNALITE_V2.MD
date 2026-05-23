# Form Engine V2 - Pagination par Section et Layout Responsive

## Vue d'ensemble

La version 2 du Form Engine introduit plusieurs fonctionnalités majeures :
1. **Pagination par section** : possibilité d'afficher tous les champs d'une section sur une seule page
2. **Contrôle de largeur des champs** : système permettant de définir si un champ prend toute la largeur ou la moitié de l'espace disponible
3. **Champ OTP (One-Time Password)** : champ spécialisé pour la validation OTP avec pré-validation serveur, auto-validation, renvoi de code et liaison Email
4. **DynamicSearch dans les RepeatGroups** : support complet de la recherche dans les dropdowns avec filtrage dynamique dans les groupes répétables
5. **Barre de progression dynamique avec ConditionalDisplay** : ajustement automatique de la progression selon les sections et champs visibles, navigation intelligente qui saute les sections cachées

---

## 1. Pagination par Section

### Description

Le mode de pagination par section permet d'afficher tous les champs d'une section sur une seule page, au lieu de les paginer par nombre de champs (comportement par défaut).

### Configuration

Ajoutez la prop `paginationMode="bySection"` au composant `FormEngine` :

```tsx
<FormEngine
  form={formStructure}
  formId="mon-formulaire"
  onSubmit={handleSubmit}
  paginationMode="bySection"  // 🆕 Nouvelle option
/>
```

### Modes disponibles

- **`"byFields"`** (défaut) : Pagination par nombre de champs (4 champs par page par défaut)
- **`"bySection"`** : Une section = une page (tous les champs de la section affichés)

### Comportement

#### Mode `"bySection"` :
- Tous les champs d'une section sont affichés simultanément
- La navigation se fait section par section (pas de pagination interne)
- La progress bar affiche le nombre de sections (ex: "Étape 1 / 4")
- La validation valide tous les champs de la section avant de passer à la suivante

#### Mode `"byFields"` (défaut) :
- Comportement inchangé par rapport à la V1
- Pagination par nombre de champs (4 par défaut, configurable)
- Compatibilité totale avec les formulaires existants

### Implémentation technique

**Fichiers modifiés :**
- `hooks/useFormNavigation.ts` : Logique conditionnelle selon le mode
- `components/core/FormEngine.tsx` : Passage du mode dans toute la chaîne
- `components/core/FormEngineContent.tsx` : Propagation du mode
- `components/core/hooks/useFormPageValidation.ts` : Adaptation de la validation

---

## 2. Contrôle de Largeur des Champs

### Description

Chaque champ peut maintenant définir sa largeur d'affichage via la propriété `width` dans sa définition.

### Configuration

Ajoutez la propriété `width` à n'importe quel `FormField` :

```tsx
{
  formFieldId: "email",
  fieldName: "email",
  fieldType: "text",
  label: "Email",
  width: "half",  // 🆕 Nouvelle propriété
  // ... autres propriétés
}
```

### Valeurs possibles

- **`"half"`** (défaut) : Le champ prend 50% de la largeur sur écrans larges, 100% sur mobile
- **`"full"`** : Le champ prend 100% de la largeur sur tous les écrans

### Comportement responsive

#### Sur mobile (< 768px) :
- Tous les champs prennent **100% de la largeur** (1 colonne)
- Que le champ soit `width: "half"` ou `width: "full"`

#### Sur tablette et écrans larges (≥ 768px) :
- Champs `width: "half"` : **2 colonnes** (50% chacun)
- Champs `width: "full"` : **1 colonne** (100% de largeur)

### Exemple d'utilisation

```tsx
const formFields = [
  {
    fieldName: "prenom",
    fieldType: "text",
    label: "Prénom",
    width: "half",  // Sera côte à côte avec le champ suivant sur tablet+
  },
  {
    fieldName: "nom",
    fieldType: "text",
    label: "Nom",
    width: "half",  // Sera côte à côte avec le prénom sur tablet+
  },
  {
    fieldName: "adresse",
    fieldType: "textarea",
    label: "Adresse complète",
    width: "full",  // Prend toute la largeur sur tous les écrans
  },
];
```

### Cas spéciaux

**Radio et Checkbox :**
- Les champs de type `radio` et `checkbox` sont **automatiquement exclus** de la règle de largeur forcée
- Ils conservent leur taille naturelle pour un meilleur rendu visuel
- Le texte à côté des cases reste correctement aligné

### Implémentation technique

**Fichiers modifiés :**
- `types/formTypeStructure.ts` : Ajout de `width?: "full" | "half"` à `FormField`
- `components/FormSection.tsx` : 
  - Fonction `getFieldWidthClass()` pour déterminer les classes CSS
  - Classes Tailwind arbitraires pour forcer la largeur des inputs (sauf radio/checkbox)
  - Grid responsive : `grid-cols-1 tablet:grid-cols-2`

**Classes CSS appliquées :**
- `width: "half"` → `col-span-1 w-full`
- `width: "full"` → `col-span-1 tablet:col-span-2 w-full`
- Grid container : `grid grid-cols-1 tablet:grid-cols-2 gap-6`

---

## 3. Modifications des Composants

### RepeatGroupModal

**Problème résolu :** La modale des repeat groups prenait toute la largeur de l'écran.

**Solution :**
- Largeur maximale réduite de `max-w-6xl` à `max-w-4xl`
- Largeur adaptative : `w-[90%] sm:w-auto` (90% sur mobile, auto sur tablet+)

**Fichier modifié :** `repeat-groupe-renderer/components/RepeatGroupModal.tsx`

---

## 4. Rétrocompatibilité

### Mode par défaut

- Le mode `"byFields"` reste le **défaut** pour garantir la rétrocompatibilité
- Tous les formulaires existants continuent de fonctionner sans modification

### Propriété width

- Si `width` n'est pas spécifiée, la valeur par défaut est `"half"`
- Les formulaires existants sans `width` conservent leur comportement (2 colonnes sur tablet+)

---

## 5. Exemple complet

```tsx
<FormEngine
  form={{
    name: "Formulaire V2",
    provider: "Equipe",
    description: "Test de la V2",
    status: "ACTIVE",
    isDeclaration: 0,
    isTest: 1,
    sections: [
      {
        sectionId: "section1",
        title: "Informations personnelles",
        formFields: [
          {
            formFieldId: "prenom",
            fieldName: "prenom",
            fieldType: "text",
            label: "Prénom",
            width: "half",  // 🆕
            response: { responseValue: "" },
            validations: [{ validationType: "required", errMsg: "Obligatoire" }],
          },
          {
            formFieldId: "nom",
            fieldName: "nom",
            fieldType: "text",
            label: "Nom",
            width: "half",  // 🆕
            response: { responseValue: "" },
          },
          {
            formFieldId: "adresse",
            fieldName: "adresse",
            fieldType: "textarea",
            label: "Adresse",
            width: "full",  // 🆕
            response: { responseValue: "" },
          },
        ],
      },
    ],
  }}
  formId="form-v2"
  onSubmit={handleSubmit}
  paginationMode="bySection"  // 🆕
/>
```

---

## 6. Points d'attention

### Validation

- En mode `"bySection"`, la validation vérifie **tous les champs de la section** avant de passer à la suivante
- Les messages d'erreur s'affichent par champ via des toasts

### Performance

- Le mode `"bySection"` peut afficher plus de champs simultanément
- Le filtrage dynamique et les règles conditionnelles fonctionnent normalement

### Navigation

- En mode `"bySection"`, la navigation est simplifiée (pas de `fieldPage`)
- Les fonctions `goToNext()`, `goToPrevious()`, `goToFirst()`, `goToLast()` fonctionnent correctement

---

## 7. Tests

Un formulaire de test complet est disponible dans :
- `pages/form-engine-visualise/FormEngineVisualise2.tsx`

Ce formulaire contient 4 sections avec différents types de champs et configurations de largeur pour tester toutes les fonctionnalités.

---

## 8. Champ OTP (One-Time Password)

### Description

Le Form Engine V2 introduit un champ spécialisé pour la validation OTP (One-Time Password), permettant une étape de pré-validation côté serveur au sein du formulaire. Ce champ est conçu pour être utilisé dans des processus d'authentification ou de vérification.

### Caractéristiques principales

- **Affichage en modal** : Le champ OTP s'affiche automatiquement dans une modale dédiée
- **Section isolée** : Le champ OTP doit être dans sa propre section (seul champ de la section)
- **Validation serveur** : Envoi du code OTP au serveur pour vérification
- **Gestion de redirection** : Support d'une URL de callback après validation réussie
- **Liaison Email** : Possibilité de lier le champ OTP à un champ Email précédent pour envoi automatique
- **Auto-validation** : Option pour valider automatiquement quand tous les chiffres sont saisis
- **Renvoi de code** : Bouton pour renvoyer le code OTP avec système de cooldown
- **Envoi avant navigation** : Détection automatique de la prochaine section OTP et envoi du code avant navigation
- **Blocage de navigation** : Empêche la navigation depuis une section OTP si le code n'est pas validé
- **Feedback utilisateur** : Toasts d'erreur explicites pour code incorrect, incomplet ou erreur serveur

### Configuration de base

```tsx
{
  formFieldId: "OTP_FIELD",
  fieldName: "code_otp",
  fieldType: "OTP",  // Utiliser SpecialField.OTP
  label: "Code de vérification",
  response: { responseValue: "" },
  position: 1,
  otpFormFieldExecOptions: {
    serverDns: "https://api.example.com",
    postApiEndPoint: "/api/otp/verify",
    otpLength: 6,  // Nombre de cases OTP (défaut: 6)
    timeoutMs: 15000,  // Timeout en ms (défaut: 15000)
    payload: {
      action: "verify_otp",
    },
    extraHeaders: {
      "Content-Type": "application/json",
    },
    bearer: "token_here",  // Optionnel
  },
  flattenOnSubmit: true,  // Aplatir le champ dans le JSON final
  validations: [
    { validationType: "required", errMsg: "Le code OTP est obligatoire" },
  ],
}
```

### Options de configuration

#### `otpFormFieldExecOptions`

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `serverDns` | `string` | **Requis** | URL de base du serveur |
| `postApiEndPoint` | `string` | **Requis** | Endpoint relatif pour la vérification |
| `otpLength` | `number` | `6` | Nombre de cases OTP |
| `timeoutMs` | `number` | `15000` | Timeout de la requête en millisecondes |
| `payload` | `object` | `{}` | Données additionnelles à envoyer (fusionnées avec les données du formulaire) |
| `extraHeaders` | `object` | `{}` | Headers HTTP additionnels |
| `bearer` | `string` | `undefined` | Token Bearer pour l'authentification |
| `linkedEmailFieldName` | `string` | `undefined` | Nom du champ Email lié (dans une section précédente) |
| `sendOTPApiConfig` | `object` | `undefined` | Configuration séparée pour l'envoi initial (si différente de la vérification) |
| `autoValidate` | `boolean` | `false` | Activer la validation automatique quand tous les chiffres sont saisis |
| `enableResend` | `boolean` | `true` | Activer le bouton "Renvoyer le code" |
| `resendCooldownSeconds` | `number` | `60` | Délai minimum en secondes entre deux renvois |

### Comportement de validation

#### Réponse serveur attendue

Le serveur doit retourner un JSON avec la structure suivante :

```json
{
  "success": true,
  "message": "Code OTP validé avec succès",
  "call_back_url": "https://example.com/redirect"  // Optionnel
}
```

#### Cas de succès (`success: true`)

- Si `call_back_url` est présent : Un lien "Continuer sur" s'affiche dans la modale
- Si `call_back_url` est absent : Le formulaire continue normalement (section suivante ou soumission)
- Le bouton "Valider OTP" se transforme en "Soumettre le formulaire" (si dernière section) ou "Continuer"

#### Cas d'échec (`success: false`)

- Un message d'erreur s'affiche dans la modale
- L'utilisateur peut réessayer de saisir le code
- Le bouton "Renvoyer le code" reste disponible (si activé)

### Auto-validation

L'auto-validation permet de valider automatiquement le code OTP dès que tous les chiffres sont saisis, sans cliquer sur le bouton "Valider OTP".

#### Activation

```tsx
otpFormFieldExecOptions: {
  // ... autres options ...
  autoValidate: true,  // Activer l'auto-validation
}
```

#### Comportement

- Quand l'utilisateur saisit le dernier chiffre, la validation se déclenche automatiquement après 100ms
- Un indicateur de chargement s'affiche pendant la validation
- En cas d'erreur, l'utilisateur peut corriger et réessayer
- En cas de succès, le bouton se transforme automatiquement

### Renvoi de code OTP

Le bouton "Renvoyer le code" permet à l'utilisateur de demander un nouveau code OTP si celui-ci n'a pas été reçu ou a expiré.

#### Activation

```tsx
otpFormFieldExecOptions: {
  // ... autres options ...
  enableResend: true,  // Activer le bouton (défaut: true)
  resendCooldownSeconds: 60,  // Délai entre renvois (défaut: 60)
}
```

#### Comportement

- Le bouton s'affiche uniquement si :
  - `enableResend !== false`
  - L'OTP n'est pas encore validé
  - Un email lié est disponible
- Pendant le cooldown, le bouton affiche "Renvoyer (Xs)" et est désactivé
- Après le cooldown, le bouton redevient actif avec le texte "Renvoyer le code"
- Un toast de succès/erreur s'affiche après chaque tentative de renvoi

#### Configuration d'envoi

Si `sendOTPApiConfig` est défini, il sera utilisé pour le renvoi. Sinon, la configuration de vérification est réutilisée.

```tsx
otpFormFieldExecOptions: {
  serverDns: "https://api.example.com",
  postApiEndPoint: "/api/otp/verify",
  sendOTPApiConfig: {  // Configuration séparée pour l'envoi
    serverDns: "https://api.example.com",
    postApiEndPoint: "/api/otp/send",
    payload: {
      action: "send_otp",
    },
  },
}
```

### Liaison Email-OTP

Le champ OTP peut être lié à un champ Email dans une section précédente pour déclencher l'envoi automatique du code.

#### Configuration du champ Email

```tsx
{
  formFieldId: "EMAIL_FIELD",
  fieldName: "email_contact",
  fieldType: "text",
  label: "Email de contact",
  validations: [
    { validationType: "required", errMsg: "L'email est obligatoire" },
    { validationType: "email", errMsg: "Format d'email invalide" },
  ],
  emailFormFieldExecOptions: {
    triggerOTPSend: true,  // Déclencher l'envoi automatique
    linkedOTPFieldName: "code_otp",  // Nom du champ OTP lié
    otpSendApiConfig: {
      serverDns: "https://api.example.com",
      postApiEndPoint: "/api/otp/send",
      payload: {
        action: "send_otp",
      },
    },
  },
}
```

#### Configuration du champ OTP

```tsx
{
  formFieldId: "OTP_FIELD",
  fieldName: "code_otp",
  fieldType: "OTP",
  otpFormFieldExecOptions: {
    // ... autres options ...
    linkedEmailFieldName: "email_contact",  // Nom du champ Email lié
  },
}
```

#### Comportement

1. L'utilisateur saisit son email dans le champ Email
2. Après validation réussie (format email valide), l'OTP est envoyé automatiquement
3. Un indicateur visuel (spinner) s'affiche pendant l'envoi
4. Un toast de succès confirme l'envoi
5. L'email est affiché dans la modale OTP : "Code envoyé à : email@example.com"

### Navigation et affichage

#### Mode `"byFields"`

- La section OTP est affichée seule sur la page (exception au comportement normal)
- Le modal s'ouvre automatiquement à l'arrivée sur la section

#### Mode `"bySection"`

- La section OTP est affichée seule sur la page
- Le modal s'ouvre automatiquement à l'arrivée sur la section

### Envoi OTP avant navigation

Le Form Engine V2 détecte automatiquement si la prochaine section contient un champ OTP et envoie le code **avant** de naviguer vers cette section. Cela garantit que l'utilisateur arrive sur la section OTP avec le code déjà envoyé.

#### Fonctionnement

1. **Détection automatique** : Lorsque l'utilisateur clique sur "Suivant", le système calcule la prochaine section à afficher
2. **Vérification OTP** : Si la prochaine section contient un champ OTP, le système :
   - Récupère le champ Email lié (via `linkedEmailFieldName`)
   - Vérifie que le champ Email a une valeur
   - Envoie automatiquement le code OTP via l'API configurée (`sendOTPApiConfig` ou configuration par défaut)
3. **Navigation conditionnelle** :
   - **Succès** : Un toast de succès s'affiche ("Code de vérification envoyé !") et la navigation continue
   - **Échec** : Un toast d'erreur s'affiche avec le message d'erreur et la navigation est **bloquée** (l'utilisateur reste sur la section actuelle)

#### Gestion des erreurs

Les erreurs suivantes sont gérées avec des messages explicites :

- **Champ Email lié vide** : "Le champ lié '[nom]' est vide"
- **Champ Email lié introuvable** : "Linked field not found for OTP field: [nom]"
- **Timeout** : "Délai d'attente dépassé pour la requête OTP"
- **Erreur réseau** : Message d'erreur du serveur ou message générique
- **Erreur serveur** : Message retourné par l'API (`responseData.message`)

#### Avantages

- **Expérience utilisateur améliorée** : L'utilisateur n'a pas à attendre l'envoi du code après être arrivé sur la section OTP
- **Détection précoce des erreurs** : Les problèmes d'envoi sont détectés avant la navigation, évitant à l'utilisateur d'être bloqué sur une section OTP sans code
- **Feedback immédiat** : Les toasts informent clairement l'utilisateur du succès ou de l'échec de l'envoi

### Blocage de navigation si OTP non validé

Le système empêche la navigation depuis une section OTP si le code n'a pas été correctement rempli et validé.

#### Fonctionnement

Lorsque l'utilisateur tente de naviguer depuis une section contenant un champ OTP :

1. **Vérification préalable** : Le système vérifie si :
   - La section actuelle contient un champ OTP
   - Le champ OTP est requis (via `validations`)
   - La valeur OTP est vide ou incomplète (longueur < `otpLength`)

2. **Blocage conditionnel** :
   - Si l'OTP est requis mais **non rempli ou incomplet** : Navigation bloquée + toast d'erreur
   - Si l'OTP est rempli avec la bonne longueur : La validation de page vérifie sa validité et la navigation peut continuer

#### Message d'erreur

Un toast d'erreur explicite s'affiche :

```
⚠️ Veuillez remplir et valider le code OTP avant de continuer. Le code doit contenir X chiffres.
```

#### Intégration avec la validation de page

Cette vérification complète celle effectuée dans `useFormPageValidation`, qui vérifie également la longueur du code OTP. Les deux vérifications travaillent ensemble pour garantir que l'utilisateur ne peut pas avancer sans un code OTP valide.

### Feedback utilisateur pour code OTP incorrect

Le système affiche des toasts d'erreur clairs lorsque l'utilisateur saisit un code OTP incorrect ou incomplet.

#### Toasts d'erreur

**Code OTP incorrect** :
- Lors de la validation manuelle (bouton "Valider OTP") : `❌ Code OTP invalide. Veuillez réessayer.`
- Lors de l'auto-validation : `❌ [message d'erreur du serveur]`
- Message personnalisé si le serveur retourne un message spécifique

**Code OTP incomplet** :
- `Code OTP incomplet. Le code doit contenir X chiffres.`

**Erreur serveur** :
- Le message d'erreur retourné par le serveur est affiché dans le toast
- Si `success: false` dans la réponse : Le message du serveur (`responseData.message`) est utilisé
- En cas d'erreur réseau ou timeout : Message d'erreur approprié

#### Gestion des erreurs serveur

Le hook `useOTPHandler` vérifie maintenant explicitement si le serveur retourne `success: false` dans la réponse, même si le status HTTP est 200. Dans ce cas, une erreur est lancée avec le message du serveur, qui remonte jusqu'à `handleValidateOTP` pour affichage dans un toast.

#### Comportement selon le type de validation

- **Validation manuelle** : Toast d'erreur immédiat si le code est incorrect
- **Auto-validation** : Toast d'erreur immédiat si le code est incorrect, permettant à l'utilisateur de corriger rapidement
- **Code correct** : Pas de toast d'erreur, la validation réussit et le bouton se transforme en "Continuer" ou "Soumettre le formulaire"

### Stockage du token d'authentification OTP

Le Form Engine V2 permet de stocker et réutiliser le token d'authentification retourné par l'API OTP lors de la validation réussie. Ce token peut être utilisé ultérieurement pour authentifier d'autres requêtes API.

#### Caractéristiques principales

- **Extraction automatique** : Le token est automatiquement extrait depuis différentes structures de réponse API
- **Stockage persistant** : Les tokens sont stockés dans un store Zustand avec persistance localStorage
- **Gestion de l'expiration** : Vérification automatique de l'expiration et suppression des tokens expirés
- **Isolation par formulaire et champ** : Chaque formulaire et chaque champ OTP a son propre token (clé composite `formId` + `fieldName`)
- **Nettoyage automatique** : Les tokens sont supprimés lors du `clearForm` ou de la redirection callback

#### Format du token d'authentification

Le système supporte différents formats de réponse API et normalise le token dans une structure standardisée :

```typescript
interface OTPAuthToken {
  access_token: string;        // Requis : Token d'accès
  token_type?: string;          // Optionnel : Type de token (défaut: "bearer")
  expires_in?: number;         // Optionnel : Durée de validité en secondes
  expires_at?: number;         // Optionnel : Timestamp Unix d'expiration (calculé depuis expires_in)
}
```

#### Réponse serveur attendue

Le serveur peut retourner le token dans différents formats :

**Format 1 : Token dans `authToken`**
```json
{
  "success": true,
  "message": "Code OTP validé avec succès",
  "authToken": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

**Format 2 : Token directement dans la réponse**
```json
{
  "success": true,
  "message": "Code OTP validé avec succès",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Format 3 : Clé contenant "token" (détection automatique)**
```json
{
  "success": true,
  "message": "Code OTP validé avec succès",
  "myAuthToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Le système détecte automatiquement la clé contenant "token" (insensible à la casse) et extrait le token.

#### Extraction automatique

La fonction `extractAuthToken` recherche automatiquement le token dans la réponse API :

1. **Recherche de la clé** : Cherche une clé contenant "token" (insensible à la casse)
2. **Extraction des propriétés** : Extrait `access_token`, `token_type`, `expires_in`
3. **Calcul de l'expiration** : Calcule `expires_at` si `expires_in` est présent
4. **Normalisation** : Retourne un objet `OTPAuthToken` standardisé

#### Stockage dans le store Zustand

Les tokens sont stockés dans un store Zustand avec persistance localStorage :

```typescript
// Structure de stockage
tokens: {
  [formId]: {
    [fieldName]: OTPAuthToken
  }
}
```

**Exemple** :
```typescript
tokens: {
  "form-123": {
    "code_otp": {
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: 1704067200
    }
  }
}
```

#### Méthodes du store

Le store `useOTPTokenStore` expose les méthodes suivantes :

- **`setOTPToken(formId, fieldName, token)`** : Stocker un token
- **`getOTPToken(formId, fieldName)`** : Récupérer un token
- **`clearOTPToken(formId, fieldName)`** : Supprimer un token spécifique
- **`clearAllOTPTokens(formId?)`** : Supprimer tous les tokens (optionnellement pour un formId)

#### Fonctions utilitaires

**Vérification de l'expiration** :
```typescript
import { isTokenExpired } from '../store/useOTPTokenStore';

const token = getOTPToken('form-123', 'code_otp');
if (token && !isTokenExpired(token)) {
  // Token valide
}
```

**Récupération d'un token valide** :
```typescript
import { getValidOTPToken } from '../store/useOTPTokenStore';

const token = getValidOTPToken('form-123', 'code_otp');
if (token) {
  // Token valide et non expiré
  // Si le token était expiré, il a été automatiquement supprimé
}
```

#### Intégration automatique

Le token est automatiquement stocké lors de la validation réussie de l'OTP :

1. **Validation OTP** : L'utilisateur saisit et valide le code OTP
2. **Réponse serveur** : Le serveur retourne le token dans la réponse
3. **Extraction** : `extractAuthToken` extrait le token depuis la réponse
4. **Stockage** : Le token est stocké dans le store avec la clé `formId` + `fieldName`
5. **Disponibilité** : Le token est disponible pour utilisation ultérieure

#### Utilisation du token stocké

Pour utiliser le token dans d'autres requêtes API :

```typescript
import { getValidOTPToken } from '../store/useOTPTokenStore';

// Récupérer le token valide
const token = getValidOTPToken(formId, 'code_otp');

if (token) {
  // Utiliser le token dans une requête API
  const response = await fetch('https://api.example.com/protected', {
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
    },
  });
}
```

#### Nettoyage automatique

Les tokens sont automatiquement nettoyés dans les cas suivants :

1. **Lors du `clearForm`** : Tous les tokens associés au formulaire sont supprimés
2. **Lors de la redirection callback** : Les tokens sont supprimés avant la redirection
3. **Lors de l'expiration** : Les tokens expirés sont automatiquement supprimés lors de la récupération via `getValidOTPToken`

#### Configuration

Aucune configuration supplémentaire n'est nécessaire. Le stockage du token fonctionne automatiquement dès qu'un champ OTP est configuré avec `formId` et `fieldName`.

**Note** : Le `formId` doit être passé au composant `FormEngine` et propagé jusqu'à `OTPRenderer` pour que le stockage fonctionne correctement.

#### Exemple complet

```tsx
<FormEngine
  form={formStructure}
  formId="form-123"  // 🆕 Nécessaire pour le stockage du token
  onSubmit={handleSubmit}
/>

// Dans le formulaire
{
  formFieldId: "OTP_FIELD",
  fieldName: "code_otp",  // 🆕 Utilisé comme clé de stockage
  fieldType: "OTP",
  otpFormFieldExecOptions: {
    serverDns: "https://api.example.com",
    postApiEndPoint: "/api/otp/verify",
    // ... autres options ...
  },
}

// Après validation réussie, le token est stocké automatiquement
// Récupération ultérieure :
import { getValidOTPToken } from '../store/useOTPTokenStore';
const token = getValidOTPToken('form-123', 'code_otp');
```

### Aplatissement des données

Par défaut, le champ OTP est aplati dans le JSON final lors de la soumission :

```json
{
  "code_otp": "123456",
  // ... autres champs ...
}
```

Pour désactiver l'aplatissement :

```tsx
{
  // ... autres propriétés ...
  flattenOnSubmit: false,  // Ne pas aplatir le champ OTP
}
```

### Exemple complet

```tsx
{
  sectionId: "OTP_SECTION",
  title: "Vérification OTP",
  subTitle: "Veuillez saisir le code de vérification reçu",
  position: 5,
  formFields: [
    {
      formFieldId: "OTP_FIELD",
      fieldName: "code_otp",
      fieldType: "OTP",
      label: "Code de vérification",
      response: { responseValue: "" },
      position: 1,
      helpText: "Un code de vérification à 6 chiffres vous a été envoyé.",
      otpFormFieldExecOptions: {
        serverDns: "https://api.example.com",
        postApiEndPoint: "/api/otp/verify",
        otpLength: 6,
        timeoutMs: 15000,
        linkedEmailFieldName: "email_contact",
        autoValidate: true,
        enableResend: true,
        resendCooldownSeconds: 60,
        payload: {
          action: "verify_otp",
        },
        extraHeaders: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
      flattenOnSubmit: true,
      validations: [
        { validationType: "required", errMsg: "Le code OTP est obligatoire" },
      ],
    },
  ],
}
```

### Fichiers implémentés

- `types/formTypeStructure.ts` : Types `OTPFormFieldExecOptions` et `EmailFormFieldExecOptions`
- `hooks/useOTPHandler.ts` : Gestion de la validation, renvoi et cooldown, vérification explicite de `success: false` dans les réponses serveur, extraction et stockage automatique du token d'authentification
- `hooks/useEmailOTPTrigger.ts` : Envoi automatique depuis le champ Email
- `ui/special/OTPFormField.tsx` : Composant d'affichage des cases OTP
- `components/OTPModal.tsx` : Modale d'affichage du champ OTP
- `components/OTPRenderer.tsx` : Orchestration de la logique OTP, affichage des toasts d'erreur pour code incorrect, nettoyage des tokens lors de la redirection callback
- `types/formUtils.ts` : Fonctions utilitaires de liaison Email-OTP (`hasOTPField`, `getOTPField`, `findLinkedEmailField`, `findSectionIndexForField`)
- `components/core/hooks/useFormNavigationActions.ts` : Détection de la prochaine section OTP, envoi automatique avant navigation, blocage de navigation si OTP non validé
- `components/core/FormEngineContent.tsx` : Passage des paramètres nécessaires (`form`, `formValues`, `paginationMode`) à `useFormNavigationActions`
- `store/useOTPTokenStore.ts` : Store Zustand pour la gestion des tokens d'authentification OTP avec persistance localStorage, fonctions utilitaires pour vérifier l'expiration et récupérer des tokens valides
- `components/core/hooks/useFormReset.ts` : Nettoyage des tokens OTP lors du `clearForm`

---

## 9. DynamicSearch dans les RepeatGroups

### Description

Le Form Engine V2 supporte maintenant le **DynamicSearch** (recherche dans les dropdowns avec `enableSearch: true`) dans les **RepeatGroups**. Cette fonctionnalité permet de rechercher parmi les options filtrées dynamiquement dans les champs dropdown des groupes répétables.

### Problème résolu

Dans les RepeatGroups, les noms de champs sont transformés selon le pattern `{repeatGroupName}_{fieldName}_{index}`. Le problème initial était que `DropdownFormField` utilisait le nom original du champ parent (`dependentFieldName`) au lieu du nom transformé, ce qui empêchait la détection correcte de la valeur du champ parent et donc le fonctionnement du DynamicSearch.

### Solution implémentée

La solution consiste à **passer explicitement le nom transformé du champ parent** via une prop `dependentFieldNameTransformed` depuis `RepeatGroupRenderer` jusqu'à `DropdownFormField`. Cette approche est plus stable et maintenable que le parsing automatique.

### Fonctionnement

#### 1. Calcul du nom transformé

Dans `RepeatGroupRenderer` ou `SeriesItem`, le nom transformé du champ parent est calculé pour chaque champ avec `dynamicFilterRule` :

```typescript
const dependentFieldNameTransformed = subField.dynamicFilterRule
  ? buildTempFieldName(subField.dynamicFilterRule.dependentFieldName, index)
  : undefined;
```

**Exemple** :
- Champ enfant : `commune` (index 0)
- Champ parent : `departement`
- Nom transformé du parent : `parcelles_departement_0`

#### 2. Propagation de la prop

La prop `dependentFieldNameTransformed` est passée à travers la chaîne de composants :
- `RepeatGroupRenderer` / `SeriesItem` → `FieldRenderer` → `DropdownFormField`

#### 3. Utilisation dans DropdownFormField

`DropdownFormField` utilise le nom transformé si fourni, sinon le nom original (pour compatibilité avec les champs simples) :

```typescript
const dependentFieldNameToWatch = field.dynamicFilterRule 
  ? (dependentFieldNameTransformed || field.dynamicFilterRule.dependentFieldName)
  : null;

// Utilisation avec fallback sur getValues() pour éviter les problèmes de timing
const dependentValueFromWatch = dependentFieldNameToWatch ? watch(dependentFieldNameToWatch) : null;
const dependentValueFromGetValues = dependentFieldNameToWatch ? getValues(dependentFieldNameToWatch) : null;
const dependentValue = dependentValueFromWatch !== undefined && dependentValueFromWatch !== null && dependentValueFromWatch !== ''
  ? dependentValueFromWatch 
  : (dependentValueFromGetValues !== undefined && dependentValueFromGetValues !== null && dependentValueFromGetValues !== '' ? dependentValueFromGetValues : null);
```

### Support des RepeatGroups imbriqués

Pour les RepeatGroups imbriqués, le pattern de nom est adapté :

```typescript
const nestedGroupBaseName = buildNestedGroupFieldName(subField.repeatGroup.fieldName, index);
const dependentFieldNameTransformed = childField.dynamicFilterRule
  ? `${nestedGroupBaseName}_${childField.dynamicFilterRule.dependentFieldName}_${nestedIndex}`
  : undefined;
```

**Exemple** :
- RepeatGroup parent : `parcelles` (index 0)
- RepeatGroup enfant : `batiments` (nestedIndex 0)
- Champ enfant : `etage`
- Champ parent : `numero`
- Nom transformé du parent : `parcelles_batiments_0_numero_0`

### Configuration

Aucune configuration supplémentaire n'est nécessaire. La fonctionnalité fonctionne automatiquement pour tous les champs dropdown avec `dynamicFilterRule` dans les RepeatGroups, à condition que :

1. Le champ ait `enableSearch: true` pour activer la recherche
2. Le champ ait `dynamicFilterRule` pour le filtrage dynamique
3. Le champ soit dans un RepeatGroup

### Exemple d'utilisation

```typescript
{
  formFieldId: "PARC_ARRONDISSEMENT",
  fieldName: "arrondissement",
  fieldType: "dropdown",
  label: "Arrondissement",
  enableSearch: true,  // Active la recherche
  dynamicFilterRule: {
    dependentFieldName: "commune",  // Le nom original (sera transformé automatiquement)
    filterType: "hierarchical",
    dataSource: {
      type: "static",
      data: group_arrondissementByCommune
    }
  }
}
```

### Avantages de cette solution

1. **Source unique de vérité** : La transformation est calculée au bon endroit (dans `RepeatGroupRenderer`)
2. **Pas de parsing fragile** : Pas besoin de regex ou de détection automatique
3. **Maintenabilité** : Si le format change, un seul endroit à modifier
4. **Compatibilité rétroactive** : La prop est optionnelle, donc les champs simples continuent de fonctionner
5. **Support des nested groups** : Le pattern est adapté pour les RepeatGroups imbriqués

### Fichiers modifiés

- `ui/DropdownFormField.tsx` : Ajout de la prop `dependentFieldNameTransformed` et logique de fallback
- `FieldRenderer.tsx` : Passage de la prop `dependentFieldNameTransformed` à `DropdownFormField`
- `RepeatGroupRenderer.tsx` : Calcul et passage de `dependentFieldNameTransformed` pour les champs simples
- `repeat-groupe-renderer/components/SeriesItem.tsx` : Calcul et passage de `dependentFieldNameTransformed` pour tous les champs (simples et nested)

### État

- ✅ Filtrage dynamique des options : **Fonctionne** (via `useRepeatGroupDynamicFiltering`)
- ✅ Détection du champ parent : **Fonctionne** (via `dependentFieldNameTransformed`)
- ✅ DynamicSearch : **Fonctionne correctement** dans les RepeatGroups
- ✅ Support des RepeatGroups imbriqués : **Fonctionne**

---

## 10. Migration depuis V1

### Pour activer la pagination par section

1. Ajoutez `paginationMode="bySection"` au composant `FormEngine`
2. Aucune autre modification nécessaire

### Pour utiliser le contrôle de largeur

1. Ajoutez `width: "half"` ou `width: "full"` aux champs souhaités
2. Les champs sans `width` utilisent `"half"` par défaut (comportement identique)

### Pour utiliser le champ OTP

1. Créez une section dédiée avec un seul champ de type `"OTP"`
2. Configurez `otpFormFieldExecOptions` avec les paramètres de votre API
3. (Optionnel) Liez un champ Email pour l'envoi automatique
4. (Optionnel) Activez `autoValidate: true` pour la validation automatique
5. (Optionnel) Configurez `enableResend` et `resendCooldownSeconds` pour le renvoi

### Pour utiliser le DynamicSearch dans les RepeatGroups

Aucune configuration supplémentaire n'est nécessaire. La fonctionnalité fonctionne automatiquement pour tous les champs dropdown avec `dynamicFilterRule` dans les RepeatGroups. Il suffit de :

1. Ajouter `enableSearch: true` au champ dropdown
2. Configurer `dynamicFilterRule` avec le champ parent
3. Le nom transformé du champ parent sera calculé et passé automatiquement

#### Comment nous l'avons implémenté

- **Propagation du nom transformé** : `RepeatGroupRenderer`/`SeriesItem` calculent `dependentFieldNameTransformed` via `buildTempFieldName` (pattern `{repeat}_{field}_{index}`) et le transmettent jusqu'à `DropdownFormField` via `FieldRenderer`.
- **Sécurisation côté UI** : `DropdownFormField` observe ce nom via `watch()` mais utilise aussi `getValues()` en fallback pour éviter le décalage RHF (le `watch()` se déclenchait avant que `setValue()` ne finisse).
- **Gestion des nested groups** : même approche appliquée aux RepeatGroups imbriqués (`{parentRepeat}_{childRepeat}_{index}_{field}_{nestedIndex}`) afin que chaque niveau récupère la bonne valeur dépendante.

#### Difficultés rencontrées

- Les logs montraient des `dependentValue: undefined` car RHF déclenchait `watch()` avant que la valeur du parent soit commitée : le dropdown dépendant restait désactivé et les options filtrées disparaissaient.
- Les noms transformés n'étaient pas accessibles dans `DropdownFormField`, ce qui obligeait à parser la string du `name` — approche fragile rejetée au profit de la propagation explicite.
- Les RepeatGroups imbriqués multipliaient le problème : sans calcul récursif du nom transformé il devenait impossible de retrouver la valeur du parent.

---

## 11. Barre de Progression Dynamique avec ConditionalDisplay

### Description

Le Form Engine V2 introduit une **barre de progression dynamique** qui s'ajuste automatiquement en temps réel selon les sections et champs visibles via les règles `ConditionalDisplay`. Cette fonctionnalité garantit que la progression reflète toujours uniquement les étapes visibles, offrant une expérience utilisateur précise et cohérente.

### Caractéristiques principales

- **Ajustement en temps réel** : La barre de progression se met à jour automatiquement quand des sections/champs apparaissent ou disparaissent
- **Comptage précis** : Seules les sections et pages avec des champs visibles sont comptées dans le total
- **Navigation automatique** : Redirection automatique vers les sections/pages visibles si la section/page actuelle devient cachée
- **Navigation intelligente** : Les boutons Précédent/Suivant sautent automatiquement les sections/pages cachées
- **Pourcentage cohérent** : Le pourcentage de progression correspond toujours à la réalité du formulaire

### Fonctionnement

#### Calcul de la visibilité

Le système calcule en temps réel la visibilité de chaque section et de chaque page :

```typescript
// Calcul de la visibilité des sections
const sectionVisibility = useMemo(() => {
  return form.sections.map((section) => {
    try {
      return shouldDisplaySection(section, allResponseInForms);
    } catch (error) {
      return true; // Fallback : afficher en cas d'erreur
    }
  });
}, [form.sections, allResponseInForms]);

// Calcul de la visibilité des pages (nombre de champs visibles par page)
const pageVisibility = useMemo(() => {
  return form.sections.map((section, sectionIdx) => {
    if (!sectionVisibility[sectionIdx]) {
      return []; // Section cachée = aucune page visible
    }
    const fields = section.formFields || [];
    const totalPages = Math.ceil(fields.length / fieldsPerPage);
    const pageCounts = new Array(totalPages).fill(0);
    
    fields.forEach((field, index) => {
      const pageIndex = Math.floor(index / fieldsPerPage);
      if (shouldDisplayFormField(field, allResponseInForms)) {
        pageCounts[pageIndex] = (pageCounts[pageIndex] || 0) + 1;
      }
    });
    
    return pageCounts;
  });
}, [form.sections, sectionVisibility, allResponseInForms, fieldsPerPage]);
```

#### Calcul des étapes visibles

La barre de progression ne compte que les pages avec des champs visibles :

```typescript
// Total d'étapes visibles
const totalVisibleSteps = pageVisibility.reduce((sum, pages) => {
  return sum + pages.filter(count => count > 0).length;
}, 0) || 1;

// Étape actuelle visible
const currentVisibleStep = useMemo(() => {
  let step = 0;
  for (let i = 0; i < pageVisibility.length; i++) {
    const pages = pageVisibility[i] || [];
    const visiblePages = pages.filter((count) => count > 0);
    
    if (i < sectionIndex) {
      step += visiblePages.length;
    } else if (i === sectionIndex) {
      for (let pageIdx = 0; pageIdx <= fieldPage && pageIdx < pages.length; pageIdx++) {
        if (pages[pageIdx] > 0) {
          step += 1;
        }
      }
      return Math.max(1, step);
    }
  }
  return 1;
}, [pageVisibility, sectionIndex, fieldPage]);
```

### Navigation automatique

Le système redirige automatiquement l'utilisateur si la section ou page actuelle devient cachée :

#### Redirection si section cachée

```typescript
useEffect(() => {
  if (sectionVisibility && !sectionVisibility[navigation.sectionIndex]) {
    // Chercher la prochaine section visible
    const nextVisible = sectionVisibility.findIndex(
      (visible, idx) => visible && idx > navigation.sectionIndex
    );
    if (nextVisible !== -1) {
      navigation.goToStep(nextVisible, 0);
      return;
    }
    
    // Sinon, chercher la section visible précédente
    const previousVisible = sectionVisibility.lastIndexOf(
      true, 
      navigation.sectionIndex - 1
    );
    if (previousVisible !== -1) {
      navigation.goToStep(previousVisible, 0);
    }
  }
}, [sectionVisibility, navigation.sectionIndex, navigation.goToStep]);
```

#### Redirection si page vide

Si une page devient vide (tous ses champs sont cachés), l'utilisateur est automatiquement redirigé vers la prochaine page visible.

### Navigation intelligente

Les boutons Précédent/Suivant utilisent des fonctions spéciales qui sautent les sections/pages cachées :

```typescript
const goToPreviousVisible = () => {
  // Chercher la page/section visible précédente
  // Sauter automatiquement les sections/pages cachées
};

const goToNextVisible = () => {
  // Chercher la page/section visible suivante
  // Sauter automatiquement les sections/pages cachées
};
```

### Exemple concret

**Scénario initial :**
- Formulaire avec 6 sections (6 pages au total)
- Barre de progression : "Étape 2 sur 6" (33%)

**Action : L'utilisateur sélectionne "Entreprise" (cache la section "Particulier")**

**Résultat immédiat :**
1. `sectionVisibility` est recalculé → section "Particulier" marquée comme cachée
2. `pageVisibility` est recalculé → la page de la section "Particulier" n'est plus comptée
3. `totalVisibleSteps` passe de 6 à 5 (1 section retirée)
4. `currentVisibleStep` est recalculé si nécessaire
5. **Barre de progression mise à jour** : "Étape 2 sur 5" (40%)
6. Le pourcentage augmente car il y a moins d'étapes totales

**Action : L'utilisateur coche "Possédez-vous un véhicule ?" (affiche la section "Véhicule")**

**Résultat immédiat :**
1. `sectionVisibility` est recalculé → section "Véhicule" marquée comme visible
2. `pageVisibility` est recalculé → la page de la section "Véhicule" est comptée
3. `totalVisibleSteps` passe de 5 à 6 (1 section ajoutée)
4. **Barre de progression mise à jour** : "Étape 2 sur 6" (33%)
5. Le pourcentage diminue car il y a plus d'étapes totales

### Configuration

Aucune configuration supplémentaire n'est nécessaire. La fonctionnalité fonctionne automatiquement dès qu'un formulaire utilise des règles `ConditionalDisplay` sur les sections ou les champs.

#### Exemple de configuration

```typescript
{
  sectionId: "PARTICULIER_SECTION",
  title: "Informations particulières",
  conditionalDisplay: {
    logic: "AND",
    rules: [
      {
        fieldName: "type_personne",
        operator: "==",
        value: "particulier"
      }
    ]
  },
  formFields: [
    // ... champs de la section ...
  ]
}
```

### Comportement selon le mode de pagination

#### Mode `"bySection"`

- Le total d'étapes correspond au nombre de sections visibles
- L'étape actuelle correspond à la position de la section visible actuelle
- La navigation saute automatiquement les sections cachées

#### Mode `"byFields"`

- Le total d'étapes correspond au nombre de pages avec des champs visibles
- L'étape actuelle correspond à la position de la page visible actuelle
- Les pages vides (sans champs visibles) ne sont pas comptées
- La navigation saute automatiquement les pages vides

### Implémentation technique

#### Fichiers modifiés

- `components/core/FormEngine.tsx` : Calcul de `sectionVisibility` et `pageVisibility` basés sur les valeurs du formulaire
- `hooks/useFormNavigation.ts` : 
  - Accepte `sectionVisibility` et `pageVisibility` en paramètres
  - Calcule `totalVisibleSteps` et `currentVisibleStep` basés uniquement sur les pages visibles
  - Implémente `goToPreviousVisible()` et `goToNextVisible()` pour la navigation intelligente
- `components/core/FormEngineContent.tsx` : 
  - Utilise `sectionVisibility` et `pageVisibility` depuis `navigation`
  - Ajoute des `useEffect` pour la navigation automatique
  - Met à jour `FormProgressBar` pour utiliser `totalVisibleSteps` et `currentVisibleStep`
- `components/FormNavigation.tsx` : Utilise `goToPreviousVisible` et `goToNextVisible` si disponibles

#### Comment nous l'avons implémenté

1. **Calcul de la visibilité** : Dans `FormEngine.tsx`, nous calculons `sectionVisibility` et `pageVisibility` en convertissant les valeurs du formulaire en format `ResponseInForm` et en utilisant `shouldDisplaySection()` et `shouldDisplayFormField()`.

2. **Passage au hook de navigation** : Ces valeurs sont passées à `useFormNavigation` qui calcule les étapes visibles et expose les fonctions de navigation intelligente.

3. **Navigation automatique** : Des `useEffect` dans `FormEngineContent.tsx` surveillent les changements de visibilité et redirigent automatiquement l'utilisateur si nécessaire.

4. **Barre de progression** : `FormProgressBar` utilise `totalVisibleSteps` et `currentVisibleStep` au lieu de `totalSteps` et `currentStep`, garantissant que seules les étapes visibles sont comptées.

#### Difficultés rencontrées

- **Erreur "Rendered fewer hooks than expected"** : Les hooks (`useMemo`) étaient appelés conditionnellement selon le mode de pagination, violant les règles des hooks de React. **Solution** : Tous les hooks ont été déplacés avant les conditions pour garantir qu'ils sont toujours appelés dans le même ordre.

- **Problèmes de timing avec React Hook Form** : Les valeurs du formulaire n'étaient pas toujours à jour lors du calcul de la visibilité. **Solution** : Utilisation de `useMemo` avec les bonnes dépendances et conversion des valeurs en format `ResponseInForm` à chaque changement.

- **Erreurs TypeScript** : Le narrowing de type empêchait la vérification de `paginationMode` dans les fonctions de navigation. **Solution** : Utilisation de variables locales pour capturer la valeur et éviter le narrowing.

### Avantages

1. **Expérience utilisateur améliorée** : La progression est toujours précise et reflète la réalité du formulaire
2. **Navigation fluide** : Pas de blocage sur des sections/pages vides, navigation automatique
3. **Cohérence** : Le pourcentage correspond toujours aux étapes visibles
4. **Performance** : Calculs optimisés avec `useMemo` pour éviter les recalculs inutiles
5. **Rétrocompatibilité** : Fonctionne même sans `ConditionalDisplay` (fallback vers comportement normal)

### Exemple d'utilisation

Un formulaire de test complet est disponible dans :
- `pages/form-engine-visualise/FormEngineVisualise2.tsx` (troisième FormEngine : "Conditional Display & Dynamic Progress Test")

Ce formulaire contient :
- Des sections conditionnelles basées sur le type de personne
- Des sections conditionnelles basées sur des booléens (véhicule)
- Des sections conditionnelles basées sur des comparaisons numériques (âge < 18)
- Des champs conditionnels au sein d'une section (puissance/cylindrée selon le type de véhicule)

### Aucune breaking change

- Tous les formulaires existants fonctionnent sans modification
- Le comportement par défaut reste identique à la V1
- Le champ OTP, le DynamicSearch des RepeatGroups et la barre de progression dynamique sont des fonctionnalités additionnelles, non intrusives

---

## 12. Génération Automatique de Champs "Autre"

### Description

Le Form Engine V2 introduit une **génération automatique de champs texte "autre"** pour les champs de type `dropdown`, `radio` et `checkbox`. Lorsque l'utilisateur sélectionne l'option "autre" ou "autres", un champ texte est automatiquement généré et affiché immédiatement après le champ parent, sans nécessiter de configuration `conditionalDisplay`.

### Caractéristiques principales

- **Génération automatique** : Aucune configuration `conditionalDisplay` nécessaire
- **Détection intelligente** : Détecte automatiquement les options "autre" ou "autres" (valeur exacte)
- **Position automatique** : Affiché immédiatement après le champ parent
- **Label dérivé** : Le label est généré automatiquement au format "Autre [label parent]"
- **Héritage de validation** : Si le champ parent est `required`, le champ "autre" est aussi `required`
- **Support multilingue** : Les labels sont générés dans toutes les langues du champ parent
- **Nettoyage automatique** : La valeur est supprimée automatiquement quand "autre"/"autres" est désélectionné
- **Support RepeatGroups** : Fonctionne également dans les RepeatGroups avec gestion des noms transformés

### Fonctionnement

#### Détection de l'option "autre"

Le système détecte automatiquement les champs éligibles en vérifiant si leurs `selectOptions` contiennent une option avec la valeur exacte `"autre"` ou `"autres"` :

```typescript
const eligibleFields = fields.filter(field => 
  (field.fieldType === 'dropdown' || 
   field.fieldType === 'radio' || 
   field.fieldType === 'checkbox') &&
  field.selectOptions?.some(opt => {
    const optionValue = typeof opt.value === 'string' ? opt.value : String(opt.value);
    return optionValue === 'autre' || optionValue === 'autres';
  })
);
```

#### Génération du champ "autre"

Quand l'utilisateur sélectionne "autre" ou "autres", un champ texte est généré avec :

- **`fieldName`** : `"autre_${parentFieldName}"` (ex: `"autre_langue_preferee"`)
- **`formFieldId`** : `"autre_${parentFormFieldId}"`
- **`label`** : `"Autre ${parentLabel}"` (ex: "Autre Langue préférée")
- **`fieldType`** : `"text"`
- **`validations`** : Hérite du `required` si le parent est required
- **`width`** : Hérite de la largeur du parent (défaut: `"half"`)

#### Gestion selon le type de champ

**Dropdown et Radio :**
- Vérification de la valeur exacte : `value === "autre"` ou `value === "autres"`
- Un seul champ texte généré

**Checkbox (multi-choix) :**
- Vérification si le tableau contient "autre" ou "autres"
- **Un seul champ texte partagé** même si plusieurs valeurs "autres" sont sélectionnées
- Le champ apparaît si au moins une valeur "autres" est cochée

### Configuration

Aucune configuration supplémentaire n'est nécessaire. La fonctionnalité fonctionne automatiquement dès qu'un champ `dropdown`, `radio` ou `checkbox` contient une option avec la valeur `"autre"` ou `"autres"`.

#### Exemple de configuration

```typescript
{
  formFieldId: "LANGUE_FIELD",
  fieldName: "langue_preferee",
  fieldType: "dropdown",
  label: "Langue préférée",
  response: { responseValue: "" },
  validations: [
    { validationType: "required", errMsg: "Veuillez sélectionner une langue" },
  ],
  selectOptions: [
    { value: "fr", label: "Français" },
    { value: "en", label: "Anglais" },
    { value: "es", label: "Espagnol" },
    { value: "autre", label: "Autre" },  // 🆕 Option "autre" détectée automatiquement
  ],
}
```

Quand l'utilisateur sélectionne "Autre", un champ texte "Autre Langue préférée" apparaît automatiquement.

### Exemples d'utilisation

#### Dropdown avec "autre"

```typescript
{
  formFieldId: "PAYS_FIELD",
  fieldName: "pays_origine",
  fieldType: "dropdown",
  label: "Pays d'origine",
  selectOptions: [
    { value: "fr", label: "France" },
    { value: "us", label: "États-Unis" },
    { value: "autre", label: "Autre" },
  ],
}
```

**Résultat** : Quand "Autre" est sélectionné, un champ texte `"autre_pays_origine"` avec le label "Autre Pays d'origine" apparaît.

#### Radio avec "autre" (required)

```typescript
{
  formFieldId: "EDUCATION_FIELD",
  fieldName: "niveau_education",
  fieldType: "radio",
  label: "Niveau d'éducation",
  validations: [
    { validationType: "required", errMsg: "Veuillez sélectionner un niveau" },
  ],
  selectOptions: [
    { value: "bac", label: "Baccalauréat" },
    { value: "licence", label: "Licence" },
    { value: "autre", label: "Autre" },
  ],
}
```

**Résultat** : Quand "Autre" est sélectionné, un champ texte `"autre_niveau_education"` avec le label "Autre Niveau d'éducation" apparaît et est **requis** (hérite du required du parent).

#### Checkbox avec "autres" (multi-choix)

```typescript
{
  formFieldId: "INTERETS_FIELD",
  fieldName: "interets",
  fieldType: "checkbox",
  label: "Centres d'intérêt",
  response: { responseValue: [] },
  selectOptions: [
    { value: "sport", label: "Sport" },
    { value: "musique", label: "Musique" },
    { value: "autres", label: "Autres" },
  ],
}
```

**Résultat** : Quand "Autres" est coché (même avec d'autres options), **un seul champ texte partagé** `"autre_interets"` avec le label "Autre Centres d'intérêt" apparaît.

#### Support multilingue

```typescript
{
  formFieldId: "PREFERENCE_FIELD",
  fieldName: "preference",
  fieldType: "dropdown",
  label: {
    fr: "Préférence",
    en: "Preference",
  },
  selectOptions: [
    { value: "option1", label: { fr: "Option 1", en: "Option 1" } },
    { value: "autre", label: { fr: "Autre", en: "Other" } },
  ],
}
```

**Résultat** : Le champ "autre" généré aura le label :
- En français : "Autre Préférence"
- En anglais : "Other Preference"

### Support dans les RepeatGroups

La fonctionnalité fonctionne également dans les **RepeatGroups**, avec gestion automatique des noms de champs transformés.

#### Fonctionnement dans les RepeatGroups

Dans un RepeatGroup, les noms de champs sont transformés selon le pattern `{repeatGroupName}_{fieldName}_{index}`. Le système gère automatiquement cette transformation :

1. **Détection** : Les champs avec "autre"/"autres" sont détectés dans chaque série du RepeatGroup
2. **Génération** : Les champs "autre" sont générés avec les noms transformés (ex: `"autre_membres_langue_0"`)
3. **Affichage** : Les champs "autre" apparaissent immédiatement après leurs champs parents dans chaque série
4. **Sauvegarde** : Les valeurs sont sauvegardées dans les données du RepeatGroup avec le nom `"autre_${fieldName}"`

#### Exemple dans un RepeatGroup

```typescript
{
  formFieldId: "MEMBER_LANGUE",
  fieldName: "langue",
  fieldType: "dropdown",
  label: "Langue préférée",
  selectOptions: [
    { value: "fr", label: "Français" },
    { value: "en", label: "Anglais" },
    { value: "autre", label: "Autre" },
  ],
}
```

**Dans le RepeatGroup "membres" (index 0)** :
- Champ parent : `"membres_langue_0"`
- Champ "autre" généré : `"autre_membres_langue_0"`
- Label : "Autre Langue préférée"
- Sauvegarde : `{ langue: "autre", autre_langue: "Allemand" }`

### Nettoyage automatique

Quand l'utilisateur désélectionne "autre" ou "autres", le champ texte disparaît et sa valeur est automatiquement supprimée du formulaire :

```typescript
useEffect(() => {
  // Si "autre"/"autres" n'est plus sélectionné mais le champ "autre" a une valeur
  if (!shouldHaveOtherField && formValues[otherFieldName]) {
    setValue(otherFieldName, '', { shouldValidate: false, shouldTouch: false });
  }
}, [formValues, eligibleFields, setValue]);
```

### Intégration dans les données finales

Les champs "autre" générés sont des champs `FormField` normaux, donc ils apparaissent automatiquement dans les données finales du formulaire lors de la soumission :

```json
{
  "langue_preferee": "autre",
  "autre_langue_preferee": "Allemand",
  "niveau_education": "autre",
  "autre_niveau_education": "Doctorat",
  "interets": ["sport", "autres"],
  "autre_interets": "Danse"
}
```

### Implémentation technique

#### Fichiers créés/modifiés

**Nouveau fichier :**
- `hooks/useAutoOtherField.ts` : Hook personnalisé pour générer les champs "autre"

**Fichiers modifiés :**
- `components/FormSection.tsx` : Utilise `useAutoOtherField` et injecte les champs "autre" après leurs parents
- `repeat-groupe-renderer/components/SeriesItem.tsx` : Support des champs "autre" dans les RepeatGroups
- `repeat-groupe-renderer/hooks/useRepeatGroupLogic.ts` : Sauvegarde et préremplissage des champs "autre" dans les RepeatGroups

#### Architecture du hook `useAutoOtherField`

```typescript
export const useAutoOtherField = (
  fields: FormField[],
  currentLang: string = 'fr'
): Record<string, FormField> => {
  // 1. Filtrer les champs éligibles (dropdown/radio/checkbox avec "autre"/"autres")
  const eligibleFields = useMemo(() => { /* ... */ }, [fields]);

  // 2. Générer les champs "autre" dynamiquement
  const autoOtherFields = useMemo(() => {
    // Pour chaque champ éligible, vérifier si "autre"/"autres" est sélectionné
    // Si oui, générer un FormField de type "text"
  }, [eligibleFields, formValues, currentLang]);

  // 3. Nettoyage automatique quand "autre"/"autres" est désélectionné
  useEffect(() => { /* ... */ }, [formValues, eligibleFields, setValue]);

  return autoOtherFields;
};
```

#### Injection dans FormSection

```typescript
// Générer les champs "autre"
const autoOtherFields = useAutoOtherField(visibleFields, currentLang);

// Injecter les champs "autre" après leurs champs parents
const fieldsWithAutoOther = useMemo(() => {
  const result: FormField[] = [];
  visibleFields.forEach(field => {
    result.push(field);
    const otherField = autoOtherFields[field.fieldName];
    if (otherField) {
      result.push(otherField);
    }
  });
  return result;
}, [visibleFields, autoOtherFields]);
```

#### Support dans les RepeatGroups

Dans `SeriesItem.tsx`, les champs sont transformés avec leurs noms de RepeatGroup avant d'être passés au hook :

```typescript
const fieldsWithTransformedNames = useMemo(() => {
  return filteredRepeatGroupFields.map(subField => ({
    ...subField,
    fieldName: buildTempFieldName(subField.fieldName, index),
    formFieldId: `${subField.formFieldId}_${index}`,
  }));
}, [filteredRepeatGroupFields, index, buildTempFieldName]);

const autoOtherFields = useAutoOtherField(fieldsWithTransformedNames, currentLang);
```

### Difficultés rencontrées

1. **Gestion des noms transformés dans les RepeatGroups** : Les noms de champs sont transformés selon le pattern `{repeatGroupName}_{fieldName}_{index}`, ce qui nécessite une adaptation du hook pour fonctionner avec ces noms transformés. **Solution** : Création de champs avec noms transformés avant de passer au hook, puis adaptation des noms des champs "autre" générés.

2. **Sauvegarde dans les RepeatGroups** : Les champs "autre" doivent être sauvegardés avec le bon nom dans les données du RepeatGroup. **Solution** : Modification de `saveGroups()` pour détecter et sauvegarder les champs "autre" avec le nom `"autre_${fieldName}"`.

3. **Préremplissage lors de l'édition** : Les valeurs des champs "autre" doivent être préremplies lors de l'édition d'un RepeatGroup. **Solution** : Modification de `prefillTempFields()` pour préremplir les champs "autre" depuis les données sauvegardées.

### Avantages

1. **Simplicité** : Aucune configuration `conditionalDisplay` nécessaire
2. **Automatisation** : Génération automatique basée sur la détection de "autre"/"autres"
3. **Cohérence** : Labels et validations hérités automatiquement du champ parent
4. **Flexibilité** : Support des champs simples et des RepeatGroups
5. **Expérience utilisateur** : Affichage immédiat et nettoyage automatique
6. **Support multilingue** : Génération automatique des labels dans toutes les langues
7. **Intégration transparente** : Les champs "autre" apparaissent naturellement dans les données finales

### Exemple d'utilisation

Un formulaire de test complet est disponible dans :
- `pages/form-engine-visualise/FormEngineVisualise2.tsx` (cinquième FormEngine : "Auto Other Field Test")

Ce formulaire contient :
- Des champs dropdown avec "autre" (required et optional)
- Des champs radio avec "autre" (required et optional)
- Des champs checkbox avec "autres" (required et optional)
- Un champ multilingue avec "autre"
- Un RepeatGroup avec des champs dropdown, radio et checkbox contenant "autre"/"autres"

### Aucune breaking change

- Tous les formulaires existants fonctionnent sans modification
- La fonctionnalité est **purement additive** : elle ne modifie pas le comportement des champs existants
- Les champs "autre" sont générés uniquement si une option "autre"/"autres" est présente et sélectionnée

---

## 13. Génération Automatique de Champs de Détails (GetDetailInfos)

### Description

Le Form Engine V2 introduit une **génération automatique de champs de détails** pour les champs de type `dropdown`, `radio` et `checkbox`. Lorsqu'une option avec `detailInfos` configuré est sélectionnée, un groupe de champs de détails est automatiquement généré et affiché immédiatement en dessous du champ parent, sans nécessiter de configuration `conditionalDisplay` ou de modal.

Cette fonctionnalité permet de collecter des informations détaillées sur chaque choix fait dans un champ unichoix ou multichoix, similaire aux RepeatGroups mais déclenchée par la sélection d'une option.

### Caractéristiques principales

- **Génération automatique** : Aucune configuration `conditionalDisplay` nécessaire
- **Affichage inline** : Les champs apparaissent directement en dessous du champ parent (pas de modal)
- **Support unichoix** : Pour dropdown/radio, un seul groupe de détails par option sélectionnée
- **Support multichoix** : Pour checkbox, un groupe de détails par option cochée
- **Conteneur visuel** : Les groupes de détails sont affichés dans un conteneur avec fond gris et bordure
- **Label personnalisable** : Chaque groupe peut avoir son propre label (optionnel, peut être multilingue)
- **Nettoyage automatique** : Les valeurs sont supprimées automatiquement quand une option est désélectionnée
- **Support RepeatGroups** : Fonctionne également dans les RepeatGroups avec gestion des noms transformés

### Fonctionnement

#### Configuration de detailInfos

Pour chaque option qui nécessite des détails, on configure `detailInfos` avec les champs à générer :

```typescript
{
  formFieldId: "VEHICULE_FIELD",
  fieldName: "type_vehicule",
  fieldType: "dropdown",
  label: "Type de véhicule",
  selectOptions: [
    { value: "voiture", label: "Voiture" },
    { value: "moto", label: "Moto" },
  ],
  detailInfos: {
    "voiture": {
      label: "Détails de la voiture",  // Optionnel
      formFields: [
        {
          formFieldId: "MARQUE",
          fieldName: "marque",
          fieldType: "text",
          label: "Marque",
          validations: [{ validationType: "required", errMsg: "Obligatoire" }],
        },
        // ... autres champs
      ],
    },
  },
}
```

#### Génération des champs de détails

Quand l'utilisateur sélectionne une option avec `detailInfos`, les champs sont générés avec :

- **`fieldName`** : `"{parentFieldName}_{optionValue}_{detailFieldName}"` (ex: `"type_vehicule_voiture_marque"`)
- **`formFieldId`** : `"{parentFormFieldId}_{optionValue}_{detailFormFieldId}"`
- **`label`** : Conservé depuis la configuration `detailInfos`
- **`fieldType`** : Conservé depuis la configuration
- **`validations`** : Conservées depuis la configuration
- **`width`** : Hérite de la largeur du parent si non spécifiée

#### Gestion selon le type de champ

**Unichoix (dropdown/radio) :**
- Une seule option peut être sélectionnée à la fois
- Un seul groupe de détails est affiché pour l'option sélectionnée
- Si l'utilisateur change d'option, le groupe précédent disparaît et un nouveau apparaît

**Multichoix (checkbox) :**
- Plusieurs options peuvent être cochées simultanément
- **Un groupe de détails par option cochée** avec `detailInfos`
- Chaque groupe est indépendant et peut avoir ses propres valeurs
- Si une option est décochée, son groupe disparaît et ses valeurs sont nettoyées

### Configuration

#### Structure DetailInfosConfig

```typescript
export interface DetailInfosConfig {
  [optionValue: string]: {
    formFields: FormField[];
    label?: string | { [lang: string]: string };
  };
}
```

#### Exemple de configuration complète

```typescript
{
  formFieldId: "VEHICULE_DROPDOWN",
  fieldName: "type_vehicule",
  fieldType: "dropdown",
  label: "Type de véhicule",
  selectOptions: [
    { value: "voiture", label: "Voiture" },
    { value: "moto", label: "Moto" },
    { value: "velo", label: "Vélo" },
  ],
  detailInfos: {
    "voiture": {
      label: "Détails de la voiture",
      formFields: [
        {
          formFieldId: "VOITURE_MARQUE",
          fieldName: "marque",
          fieldType: "text",
          label: "Marque",
          response: { responseValue: "" },
          validations: [
            { validationType: "required", errMsg: "La marque est obligatoire" },
          ],
          placeholder: "Ex: Toyota",
        },
        {
          formFieldId: "VOITURE_MODELE",
          fieldName: "modele",
          fieldType: "text",
          label: "Modèle",
          response: { responseValue: "" },
          placeholder: "Ex: Corolla",
        },
        {
          formFieldId: "VOITURE_ANNEE",
          fieldName: "annee",
          fieldType: "number",
          label: "Année",
          response: { responseValue: "" },
          placeholder: "Ex: 2020",
        },
      ],
    },
    "moto": {
      label: "Détails de la moto",
      formFields: [
        {
          formFieldId: "MOTO_CYLINDREE",
          fieldName: "cylindree",
          fieldType: "number",
          label: "Cylindrée (cc)",
          response: { responseValue: "" },
          placeholder: "Ex: 600",
        },
      ],
    },
  },
}
```

### Exemples d'utilisation

#### Dropdown avec détails (unichoix)

```typescript
{
  formFieldId: "PAYS_DROPDOWN",
  fieldName: "pays_visite",
  fieldType: "dropdown",
  label: "Pays visité",
  selectOptions: [
    { value: "france", label: "France" },
    { value: "espagne", label: "Espagne" },
  ],
  detailInfos: {
    "france": {
      label: "Détails du séjour en France",
      formFields: [
        { fieldName: "ville", fieldType: "text", label: "Ville visitée" },
        { fieldName: "duree", fieldType: "number", label: "Durée (jours)" },
      ],
    },
  },
}
```

**Résultat** : Quand "France" est sélectionné, un groupe "Détails du séjour en France" apparaît avec les champs "Ville visitée" et "Durée (jours)".

#### Radio avec détails (unichoix)

```typescript
{
  formFieldId: "EDUCATION_RADIO",
  fieldName: "niveau_education",
  fieldType: "radio",
  label: "Niveau d'éducation",
  selectOptions: [
    { value: "licence", label: "Licence" },
    { value: "master", label: "Master" },
  ],
  detailInfos: {
    "licence": {
      label: "Détails de la licence",
      formFields: [
        { fieldName: "domaine", fieldType: "text", label: "Domaine" },
        { fieldName: "etablissement", fieldType: "text", label: "Établissement" },
      ],
    },
    "master": {
      label: "Détails du master",
      formFields: [
        { fieldName: "specialite", fieldType: "text", label: "Spécialité" },
        { fieldName: "annee_obtention", fieldType: "number", label: "Année d'obtention" },
      ],
    },
  },
}
```

**Résultat** : 
- Sélectionner "Licence" → Groupe "Détails de la licence" avec Domaine et Établissement
- Changer pour "Master" → Le groupe licence disparaît, groupe "Détails du master" apparaît

#### Checkbox avec détails (multichoix)

```typescript
{
  formFieldId: "INTERETS_CHECKBOX",
  fieldName: "interets",
  fieldType: "checkbox",
  label: "Centres d'intérêt",
  selectOptions: [
    { value: "sport", label: "Sport" },
    { value: "musique", label: "Musique" },
    { value: "lecture", label: "Lecture" },
  ],
  detailInfos: {
    "sport": {
      label: "Détails - Sport",
      formFields: [
        { fieldName: "niveau", fieldType: "text", label: "Niveau" },
        { fieldName: "frequence", fieldType: "text", label: "Fréquence" },
      ],
    },
    "musique": {
      label: "Détails - Musique",
      formFields: [
        { fieldName: "instrument", fieldType: "text", label: "Instrument" },
        { fieldName: "style", fieldType: "text", label: "Style musical" },
      ],
    },
  },
}
```

**Résultat** : 
- Cocher "Sport" → Groupe "Détails - Sport" apparaît
- Cocher aussi "Musique" → Groupe "Détails - Musique" apparaît (deux groupes visibles)
- Décocher "Sport" → Groupe Sport disparaît et ses valeurs sont nettoyées

### Support dans les RepeatGroups

La fonctionnalité fonctionne également dans les **RepeatGroups**, avec gestion automatique des noms de champs transformés.

#### Fonctionnement dans les RepeatGroups

Dans un RepeatGroup, les noms de champs sont transformés selon le pattern `{repeatGroupName}_{fieldName}_{index}`. Le système gère automatiquement cette transformation :

1. **Détection** : Les champs avec `detailInfos` sont détectés dans chaque série du RepeatGroup
2. **Transformation** : Les champs sont transformés avec leurs noms de RepeatGroup avant d'être passés au hook
3. **Génération** : Les groupes de détails sont générés avec les noms transformés (ex: `"membres_langue_0_fr_niveau"`)
4. **Affichage** : Les groupes apparaissent immédiatement après leurs champs parents dans chaque série
5. **Sauvegarde** : Les valeurs sont sauvegardées avec le format `"{parentFieldName}_{optionValue}_{detailFieldName}"`

#### Exemple dans un RepeatGroup

```typescript
{
  formFieldId: "COMPETENCE_NIVEAU",
  fieldName: "niveau",
  fieldType: "dropdown",
  label: "Niveau",
  selectOptions: [
    { value: "avance", label: "Avancé" },
    { value: "expert", label: "Expert" },
  ],
  detailInfos: {
    "avance": {
      label: "Détails - Niveau avancé",
      formFields: [
        { fieldName: "annees_experience", fieldType: "number", label: "Années d'expérience" },
        { fieldName: "certification", fieldType: "text", label: "Certification" },
      ],
    },
  },
}
```

**Dans le RepeatGroup "competences" (index 0)** :
- Champ parent : `"competences_niveau_0"` = `"avance"`
- Champs de détails générés : 
  - `"competences_niveau_0_avance_annees_experience"`
  - `"competences_niveau_0_avance_certification"`
- Sauvegarde : `{ niveau: "avance", niveau_avance_annees_experience: 5, niveau_avance_certification: "AWS Certified" }`

### Nettoyage automatique

Quand l'utilisateur désélectionne une option, le groupe de détails associé disparaît et toutes ses valeurs sont automatiquement supprimées :

```typescript
useEffect(() => {
  // Pour checkbox : nettoyer uniquement les champs des options non sélectionnées
  if (parentField.fieldType === 'checkbox') {
    Object.keys(parentField.detailInfos).forEach(optionValue => {
      if (!parentValue.includes(optionValue)) {
        // Nettoyer les champs de cette option
        detailConfig.formFields.forEach(detailField => {
          setValue(detailFieldName, '', { shouldValidate: false, shouldTouch: false });
        });
      }
    });
  }
  // Pour dropdown/radio : nettoyer si une autre option est sélectionnée
  else {
    Object.keys(parentField.detailInfos).forEach(optionValue => {
      if (optionValue !== currentOptionValue) {
        // Nettoyer les champs de cette option
      }
    });
  }
}, [formValues, eligibleFields, setValue]);
```

### Intégration dans les données finales

Les champs de détails générés sont des champs `FormField` normaux, donc ils apparaissent automatiquement dans les données finales du formulaire lors de la soumission :

```json
{
  "type_vehicule": "voiture",
  "type_vehicule_voiture_marque": "Toyota",
  "type_vehicule_voiture_modele": "Corolla",
  "type_vehicule_voiture_annee": 2020,
  "niveau_education": "licence",
  "niveau_education_licence_domaine": "Informatique",
  "niveau_education_licence_etablissement": "Université de Paris",
  "interets": ["sport", "musique"],
  "interets_sport_niveau": "Avancé",
  "interets_sport_frequence": "Quotidien",
  "interets_musique_instrument": "Guitare",
  "interets_musique_style": "Rock"
}
```

### Implémentation technique

#### Fichiers créés/modifiés

**Nouveau fichier :**
- `hooks/useDetailInfos.ts` : Hook personnalisé pour générer les groupes de champs de détails

**Fichiers modifiés :**
- `types/formTypeStructure.ts` : Ajout de l'interface `DetailInfosConfig` et de la propriété `detailInfos` à `FormField`
- `components/FormSection.tsx` : Utilise `useDetailInfos` et injecte les groupes de détails avec conteneur visuel
- `repeat-groupe-renderer/components/SeriesItem.tsx` : Support des groupes de détails dans les RepeatGroups
- `repeat-groupe-renderer/hooks/useRepeatGroupLogic.ts` : Sauvegarde et préremplissage des champs de détails dans les RepeatGroups

#### Architecture du hook `useDetailInfos`

```typescript
export interface DetailInfoGroup {
  groupLabel?: string;
  fields: FormField[];
  optionValue: string;
}

export const useDetailInfos = (
  fields: FormField[],
  currentLang: string = 'fr'
): Record<string, DetailInfoGroup[]> => {
  // 1. Filtrer les champs éligibles (dropdown/radio/checkbox avec detailInfos)
  const eligibleFields = useMemo(() => { /* ... */ }, [fields]);

  // 2. Générer les groupes de champs de détails dynamiquement
  const detailInfosGroups = useMemo(() => {
    // Pour chaque champ éligible et chaque option sélectionnée avec detailInfos
    // Générer un groupe de champs avec les noms transformés
  }, [eligibleFields, formValues, currentLang]);

  // 3. Nettoyage automatique quand une option est désélectionnée
  useEffect(() => { /* ... */ }, [formValues, eligibleFields, setValue]);

  return detailInfosGroups;
};
```

#### Injection dans FormSection

```typescript
// Générer les groupes de détails
const detailInfosGroups = useDetailInfos(visibleFields, currentLang);

// Injecter les groupes après leurs champs parents
const fieldsWithAutoOtherAndDetails = useMemo(() => {
  const result: Array<FormField | { type: 'detail-group', group: DetailInfoGroup }> = [];
  
  visibleFields.forEach(field => {
    result.push(field);
    
    // Injecter les groupes de détails
    const detailGroups = detailInfosGroups[field.fieldName];
    if (detailGroups && detailGroups.length > 0) {
      detailGroups.forEach(group => {
        result.push({ type: 'detail-group', group });
      });
    }
  });
  
  return result;
}, [visibleFields, detailInfosGroups]);
```

#### Rendu avec conteneur visuel

```typescript
{fieldsWithAutoOtherAndDetails.map((item) => {
  if (item.type === 'detail-group') {
    return (
      <div className="col-span-1 tablet:col-span-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {item.group.groupLabel && (
          <h4 className="font-semibold text-gray-700 mb-3 text-sm">
            {item.group.groupLabel}
          </h4>
        )}
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
          {item.group.fields.map(detailField => (
            <FieldRenderer key={detailField.fieldName} field={detailField} />
          ))}
        </div>
      </div>
    );
  }
  
  return <FieldRenderer key={item.fieldName} field={item} />;
})}
```

#### Support dans les RepeatGroups

Dans `SeriesItem.tsx`, les champs sont transformés avec leurs noms de RepeatGroup avant d'être passés au hook :

```typescript
const fieldsWithTransformedNames = useMemo(() => {
  return filteredRepeatGroupFields.map(subField => ({
    ...subField,
    fieldName: buildTempFieldName(subField.fieldName, index),
    formFieldId: `${subField.formFieldId}_${index}`,
  }));
}, [filteredRepeatGroupFields, index, buildTempFieldName]);

const detailInfosGroups = useDetailInfos(fieldsWithTransformedNames, currentLang);
```

Les noms générés suivent le pattern : `"{repeatGroupName}_{parentFieldName}_{index}_{optionValue}_{detailFieldName}"`

### Difficultés rencontrées

1. **Gestion des noms transformés dans les RepeatGroups** : Les noms de champs sont transformés selon le pattern `{repeatGroupName}_{fieldName}_{index}`, ce qui nécessite une adaptation du hook pour fonctionner avec ces noms transformés. **Solution** : Création de champs avec noms transformés avant de passer au hook, puis conservation de ces noms pour les champs de détails générés.

2. **Récupération des valeurs depuis existingGroupData** : Dans les RepeatGroups, les valeurs sont sauvegardées avec un format différent de celui utilisé dans les noms transformés. **Solution** : Construction de la clé de récupération en combinant `originalFieldName`, `optionValue` et le nom original du champ de détail.

3. **Sauvegarde dans les RepeatGroups** : Les champs de détails doivent être sauvegardés avec le bon format dans les données du RepeatGroup. **Solution** : Modification de `saveGroups()` pour détecter et sauvegarder les champs de détails avec le format `"{parentFieldName}_{optionValue}_{detailFieldName}"`.

4. **Préremplissage lors de l'édition** : Les valeurs des champs de détails doivent être préremplies lors de l'édition d'un RepeatGroup. **Solution** : Modification de `prefillTempFields()` pour préremplir les champs de détails depuis les données sauvegardées, en gérant à la fois les cas unichoix et multichoix.

### Avantages

1. **Simplicité** : Aucune configuration `conditionalDisplay` nécessaire, tout est déclaratif dans `detailInfos`
2. **Flexibilité** : Support des champs simples et des RepeatGroups
3. **Expérience utilisateur** : Affichage inline immédiat, pas de modal à ouvrir
4. **Organisation visuelle** : Conteneur avec fond et bordure pour distinguer les groupes de détails
5. **Indépendance** : Chaque groupe de détails est indépendant (important pour checkbox multichoix)
6. **Nettoyage automatique** : Les valeurs sont supprimées automatiquement quand une option est désélectionnée
7. **Support multilingue** : Les labels de groupes peuvent être multilingues
8. **Intégration transparente** : Les champs de détails apparaissent naturellement dans les données finales

### Exemple d'utilisation

Un formulaire de test complet est disponible dans :
- `pages/form-engine-visualise/FormEngineVisualise2.tsx` (sixième FormEngine : "GetDetailInfos Test")

Ce formulaire contient :
- Des champs dropdown avec `detailInfos` (unichoix) - ex: Type de véhicule avec détails pour Voiture et Moto
- Des champs radio avec `detailInfos` (unichoix) - ex: Niveau d'éducation avec détails pour Licence et Master
- Des champs checkbox avec `detailInfos` (multichoix) - ex: Centres d'intérêt avec détails pour Sport, Musique et Lecture
- Un RepeatGroup avec un champ dropdown contenant `detailInfos` - ex: Compétences avec détails pour les niveaux Avancé et Expert

### Lien avec les instructions GetDetailInfos (FORM_FONCTIONNALITE_V2_INSTRUCTIONS.MD 43–48)

Les lignes 43–48 du fichier `FORM_FONCTIONNALITE_V2_INSTRUCTIONS.MD` décrivent le besoin métier suivant :
- Pouvoir recueillir des **détails** (un ou plusieurs champs) sur les choix faits dans un champ unichoix ou multichoix (`dropdown`, `radio`, `checkbox`)
- Pour un **unichoix**, générer un ensemble de champs de détail pour **l’unique option sélectionnée**
- Pour un **multichoix**, générer un ensemble de champs de détail **pour chaque option cochée**, de façon automatique

Cette fonctionnalité a été intégrée dans le Form Engine V2 via le mécanisme `detailInfos` détaillé ci‑dessus :
- Côté **modèle**, chaque `FormField` unichoix/multichoix peut définir `detailInfos` pour une ou plusieurs valeurs d’option. Pour chaque valeur concernée, on décrit une liste de `formFields` de détail qui seront générés.
- Côté **mécanique de formulaire**, le hook `useDetailInfos` détecte dynamiquement les options sélectionnées qui possèdent un `detailInfos`, génère les champs correspondants (avec des `fieldName`/`formFieldId` systématiquement dérivés du champ parent et de la valeur de l’option), et nettoie leurs valeurs quand l’option est désélectionnée.
- Côté **rendu**, `FormSection` (et `SeriesItem` pour les RepeatGroups) injectent ces groupes de détails juste en dessous du champ parent, dans un conteneur visuel dédié, sans nécessiter de configuration `conditionalDisplay` ni de modal.

En pratique :
- Pour un champ **unichoix** (`dropdown`/`radio`), une seule option peut être active, donc **un seul groupe de détails** est affiché à la fois (celui de l’option sélectionnée).
- Pour un champ **multichoix** (`checkbox`), chaque option cochée qui possède un `detailInfos` génère **son propre groupe de détails**, ce qui permet d’avoir des informations distinctes pour chaque élément choisi.
- Dans les **RepeatGroups**, les mêmes règles s’appliquent, avec des noms de champs transformés (`{repeatGroupName}_{fieldName}_{index}`) gérés automatiquement par `useDetailInfos` et `useRepeatGroupLogic`.

Ce bloc de fonctionnalité correspond donc exactement au “GetDetailInfos” souhaité dans les instructions : un système générique et automatisé pour générer, afficher et nettoyer des champs de détails liés aux choix de l’utilisateur dans les champs unichoix et multichoix, sans casser la rétrocompatibilité.

### Aucune breaking change

- Tous les formulaires existants fonctionnent sans modification
- La fonctionnalité est **purement additive** : elle ne modifie pas le comportement des champs existants
- Les groupes de détails sont générés uniquement si `detailInfos` est configuré et qu'une option correspondante est sélectionnée
- La propriété `detailInfos` est optionnelle, donc les champs sans cette configuration fonctionnent normalement


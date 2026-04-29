## Form Engine – Fonctionnalités actuelles (v1)

Cette note recense les briques fonctionnelles aujourd’hui disponibles dans le moteur de formulaires (`apps/core/src/components/atoms/form-engine`). Elle s’appuie sur le code source des composants, hooks et types présents dans le dossier pour documenter précisément ce que le moteur sait faire à date.

---

### 1. Architecture générale
- **Entrée unique `FormEngine`** : reçoit une structure de formulaire `FormStructure`, un identifiant `formId`, un callback `onSubmit` et des options d’UI (langue, texte du bouton). Il instancie `react-hook-form`, applique la validation Zod et orchestre tous les sous-composants (`FormEngineContent`, navigation, sections, etc.).
- **Découpage par couches** :
  - `components/core` : logique métier (initialisation, navigation, validation, soumission, synchronisation).
  - `components/` : rendu UI (header, progress bar, navigation, sections).
  - `ui/` : bibliothèque de champs.
  - `repeat-groupe-renderer/` : moteur de répétition avec modale.
  - `hooks/` et `store/` : logique partagée (navigation, validation, filtrage, persistance).
  - `types/` : modèle de données (formulaire, règles de validation, filtres dynamiques, gestion des fichiers).

---

### 2. Modèle de données et typage fort
- **`FormStructure`, `Section`, `FormField`** : décrivent la hiérarchie des sections, champs, options, validations, règles conditionnelles, groupes répétables, etc. (`types/formTypeStructure.ts`).
- **Affichage conditionnel** : `ConditionalDisplayRule` + `ConditionalDisplayGroup` supportent les opérateurs `==`, `!=`, `>`, `<`, `IN`, `NOT IN`, `CONTAINS`, `NOT CONTAINS`, les agrégations (`SOMME`, `MULTIPLICATION`) et les comparaisons numériques.
- **Validation déclarative** : chaque champ dispose d’un tableau de `ValidationRule` (required, min/max length, regex, email, phone, fileSize, fileType, etc.).
- **Gestion de fichiers distante** : les champs peuvent embarquer une configuration `fileToBucketManage` (upload/delete) décrivant les endpoints, payloads, headers et hooks.
- **Répétition hiérarchique** : `FormRepeatGroup` permet d’imbriquer des groupes répétables (y compris des repeat dans un repeat) avec bornes min/max, nombre initial et règles de display.

---

### 3. Initialisation du formulaire & persistance
- **Extraction des champs** : `extractAllFields` aplati toutes les sections pour calculer les valeurs par défaut et bâtir le schéma Zod.
- **Zod + React Hook Form** : `createZodSchema` fabrique dynamiquement un schéma par champ (string, number coercé, bool, array, file…) et applique les validations déclarées. `useForm` est instancié avec `mode: "onTouched"` pour accélérer les retours utilisateurs.
- **Valeurs par défaut intelligentes** : pour chaque champ, on priorise les brouillons persistés (`useFormPersistence` via Zustand) puis les réponses existantes (`field.response.responseValue`).
- **Réhydratation initiale** : un `useEffect` marque tous les champs non vides comme “touched” afin que la validation visuelle reflète l’état chargé.
- **Persistance automatique** :
  - `useFormStore` (Zustand + middleware `persist`) sauvegarde chaque formulaire dans `localStorage` (`multi-form-drafts`).
  - `FormSyncComponent` observe les valeurs RHF (`watch`) et pousse des données normalisées (`normalizeFormData`) dans le store pour garantir la cohérence repeat groups / champs simples.
- **Reset global** : le hook `useFormReset` réinitialise RHF, purge `localStorage`, vide Zustand et renvoie l’utilisateur à la première section, avec feedback toast.

---

### 4. Navigation multi-étapes
- **Pagination automatique** : `useFormNavigation` découpe chaque section en pages de `fieldsPerPage` (4 par défaut) et expose `sectionIndex`, `fieldPage`, `pagedFields`, total d’étapes et état “first/last”.
- **Actions avancées** : `goToPrevious`, `goToNext`, `goToFirst`, `goToLast`, `goToStep` permettent de se déplacer précisément. Un `fadeKey` unique (index + compteur) force les re-render pour des animations fluides.
- **UI dédiée** :
  - `FormProgressBar` affiche la progression globale (Étape X/Y).
  - `FormHeader` montre titre, description, fournisseur, statut, version.
  - `FormNavigation` gère les boutons précédent/suivant/soumettre, inclut un bouton “trash” centré ouvrant un modal de confirmation, et adapte le layout mobile (bar fixe + safe-area).

---

### 5. Affichage conditionnel & nettoyage
- **Section & champ gating** : `FormSection` utilise `shouldDisplaySection` et `shouldDisplayFormField` pour ne rendre que ce qui est autorisé, en loggant les erreurs et en collectant des statistiques (nombre de champs visibles, cachés, requis masqués…).
- **Auto-clean** : à chaque changement de page/section (`fadeKey`), `FormSection` nettoie les valeurs obsolètes du store (champs qui ont disparu après filtrage conditionnel).
- **Fallbacks résilients** : en cas d’erreur de règle, la section/champ est quand même affiché(e) pour éviter de bloquer l’utilisateur et les erreurs sont remontées via callbacks.

---

### 6. Filtrage dynamique des options
- **Hook transverse `useDynamicFiltering`** :
  - observe toutes les valeurs RHF (`watch`);
  - applique la règle `dynamicFilterRule` des champs `dropdown` pour filtrer les `selectOptions` à la volée sur la base d’un champ dépendant.
- **Spécialisation par contexte** :
  - `useSectionDynamicFiltering` pour ne recalculer que les champs présents sur la page courante (optimisation performance).
  - `useRepeatGroupDynamicFiltering` gère les noms temporaires des repeat groups (`{repeatName}_{field}_{index}`) et filtre chaque instance indépendamment.
- **Logs détaillés** : traces console pour diagnostiquer les filtres (valeurs dépendantes, options retenues, etc.).

---

### 7. Validation et feedback utilisateur
- **Validation granulaire par page** :
  - `useFormPageValidation` restreint la validation aux champs visibles de la page courante (sections + champs conditionnels + instances de repeat).
  - Il distingue 3 catégories d’erreurs : `invalidFields` (erreurs Zod), `untouchedRequiredFields`, `emptyRequiredFields`.
  - Retourne aussi des métriques (nombre total de champs, champs requis, step courant) utilisées pour les toasts.
- **Actions de navigation** :
  - `useFormNavigationActions.handleNext` déclenche `validatePage`, affiche des toasts d’erreur champ par champ via `react-hot-toast` et ne passe à la section suivante que si tout est conforme.
  - `useFormSubmission` réutilise la même validation, prépare et normalise les données (`prepareFormDataBeforeSubmit` + `normalizeFormData`), déclenche `onSubmit` et affiche un toast de succès.
- **Wrapper d’UI `FormFieldWrapper`** :
  - gère `label`, icône d’info (tooltip + helpText), mention obligatoire, exemples, erreurs (y compris imbriquées).
  - propose `extractErrorMessages` pour uniformiser les retours quel que soit le format RHF/Zod.
  - embarque des hooks responsives (`useResponsiveSize`, `useCurrentBreakpoint`) pour adapter largeur/hauteur/radius des inputs.

---

### 8. Bibliothèque de champs
- **Champs standards** : texte, textarea, mot de passe, nombre, booléen, radio, checkbox, dropdown, date, fichier.
- **Champs multimédia spéciaux** (`ui/special/`) : image, vidéo, audio, PDF, document générique, enregistrement vocal, éditeur riche TipTap.
- **Composants transverses** :
  - `ResponsiveInput` pour ajuster la taille aux breakpoints.
  - `Tooltip`, `ButtonTooltip`, `ValidationBtn`, `CancelBtn` pour harmoniser les interactions.
- **Paramétrage par champ** : chaque composant reçoit `field`, `currentLang`, `defaultValue` pour afficher les traductions (`getLocalizedText`) et précharger les brouillons.

---

### 9. Gestion des fichiers (File Bucket Manager)
- **Hook `useFileBucketManager`** :
  - expose `uploadFile`, `deleteFile`, états `isUploading/isDeleting`, `error`, `resetError`.
  - prend en compte les overrides dynamiques de payload (ex : injecter un filename construit depuis le champ).
  - standardise la construction d’URL absolues, l’assemblage `FormData`, l’ajout d’headers (Bearer…), les timeouts et le parsing des réponses.
  - déduis automatiquement `filename` à partir de la réponse API, de l’URL ou du nom de fichier local.
- **Sécurité UX** : erreurs mises en état pour être ré-affichées, support des callbacks `onResponse` pour tracer les réponses backend.

---

### 10. Groupes répétables (Repeat Groups)
- **Déclenchement conditionnel** : un champ nombre “maître” (ex. “Nombre d’enfants”) pilote l’ouverture d’une modale de saisie groupée dès qu’il est > 0.
- **Gestion d’état `useRepeatGroupLogic`** :
  - construit des noms temporaires (`{repeat}_{field}_{index}`) pour éditer les occurrences dans la modale sans casser les valeurs principales.
  - sait pré-remplir (`prefillTempFields`) depuis les réponses déjà enregistrées, sauvegarder (`saveGroups`) en recopiant les valeurs dans RHF, et nettoyer (`clearGroups`) toutes les entrées (y compris groupes imbriqués).
  - calcule `hasFilledData`, `basedOnValue`, maintient la liste des occurrences développées (`expandedSeries`).
- **Modale riche (`RepeatGroupModal`)** :
  - pilotée par `useModalLogic` (ouverture auto, mode vue/édition, blocage du scroll body, animations GSAP).
  - boutons contextuels dans `FieldRenderer` pour ouvrir/remplir/modifier/voir.
- **Animations** : `useSeriesAnimations` applique GSAP pour le toggle d’expansion/repli, optimisé mobile (durée, stagger).
- **Filtrage dynamique dédié** : `useRepeatGroupDynamicFiltering` conserve l’isolement des filtres par occurrence.

---

### 11. Soumission & normalisation finale
- **Préparation** :
  - `prepareFormDataBeforeSubmit` complète les champs masqués avec leurs valeurs par défaut pour garantir un payload exhaustif.
  - `normalizeFormData` transforme les clés aplaties des repeat groups en tableaux d’objets structurés (y compris repeat imbriqués), supprime les clés temporaires et fusionne les valeurs restantes.
- **Callback utilisateur** : `onSubmit` reçoit toujours un objet cohérent, prêt à être envoyé à l’API métier.

---

### 12. Actions utilisateur & UX additionnelle
- **Bouton “Tout supprimer”** : accessible partout, ouvre un modal de confirmation (icône, message d’alerte, double bouton) puis déclenche `useFormReset`.
- **Comportements mobiles** : barre de navigation collée en bas avec `safe-area` + animation, boutons large touch.
- **Toasts centralisés** : toutes les validations (next/submit/reset) utilisent `react-hot-toast` pour conserver des messages homogènes.
- **Internationalisation** : `getLocalizedText` (labels, placeholders, aide, exemples) + `currentLang` passé à chaque composant pour basculer dynamiquement de langue.

---

### 13. Hooks utilitaires complémentaires
- `useFormNavigationActions`, `useFormPageValidation`, `useFormSubmission`, `useFormReset` : encapsulent la logique métier pour conserver un `FormEngine.tsx` concis.
- `useFormStore` + `useFormPersistence` : exposent `savedValues`, `syncFormData`, `clearForm`, `clearAll`.
- `useFormValidation` : fine couche au-dessus de RHF (`trigger`) pour valider un sous-ensemble de champs.
- `useDynamicFiltering` & variantes : gèrent toute la logique de dépendances entre champs sélectionnables.
- `useFileBucketManager` : isolent les appels réseau d’upload/suppression avec prise en charge des erreurs, timeouts, reformatage des payloads.

---

### 14. Points d’attention actuels
- `FormSection` contient des TODO (“onFieldChange”) signalant des props encore commentées.
- Les logs console sont nombreux (debug filtrage, validation…). Ils sont utiles en dev mais pourront être conditionnés par environnement si nécessaire.
- Certaines fonctionnalités (ex : monitoring TFU) sont préparées mais commentées, preuve que le moteur est pensé pour être étendu.

---

**Résumé** : Le form-engine fournit déjà un ensemble complet pour construire des formulaires complexes multi-sections : typage riche, affichage conditionnel, navigation paginée, validation progressive, persistance automatique, groupes répétables avec modale animée, bibliothèque de champs (incluant médias), gestion d’upload distant et UX soignée (toasts, tooltips, responsive). Toute nouvelle évolution peut s’appuyer sur cette base stable documentée ci-dessus.



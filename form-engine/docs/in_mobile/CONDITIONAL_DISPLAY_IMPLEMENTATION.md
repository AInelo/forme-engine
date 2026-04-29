# 📋 Implémentation de l'Affichage Conditionnel dans le FormEngine

## 🎯 Vue d'Ensemble

Ce document décrit tous les ajustements effectués pour permettre au FormEngine de réagir dynamiquement à la présence de règles `ConditionalDisplay` sur les sections et les champs de formulaire. Ces ajustements garantissent une expérience utilisateur fluide avec une navigation intelligente et une validation adaptative.

---

## 📁 Architecture des Ajustements

### 1. **Fonctions d'Évaluation des Conditions** (`displayRules.ts`)

#### Fonctions Centrales

Le système utilise des fonctions centralisées pour évaluer les conditions d'affichage :

- **`shouldDisplaySection()`** : Évalue si une section doit être affichée selon son `conditionalDisplay`
- **`shouldDisplayFormField()`** : Évalue si un champ doit être affiché selon son `conditionalDisplay`
- **`evaluateConditionalDisplay()`** : Fonction utilitaire qui gère l'absence de règles (retourne `true` par défaut)
- **`evaluateConditionalDisplayGroup()`** : Évalue un groupe de règles avec logique `AND` ou `OR`

#### Opérateurs Supportés

Le système supporte les opérateurs suivants :
- `==` : Égalité
- `!=` : Inégalité
- `>` : Supérieur à
- `<` : Inférieur à
- `IN` : Appartient à une liste
- `NOT IN` : N'appartient pas à une liste
- `CONTAINS` : Contient une valeur (pour les tableaux)
- `NOT CONTAINS` : Ne contient pas une valeur (pour les tableaux)

#### Calculs Supportés

- **`SOMME`** : Addition de plusieurs valeurs numériques
- **`MULTIPLICATION`** : Multiplication de plusieurs valeurs numériques

---

### 2. **Filtrage des Sections et Champs** (`FormSection.tsx`)

#### Évaluation de la Visibilité de la Section

```typescript
const shouldShowSection = React.useMemo(() => {
  try {
    const result = shouldDisplaySection(section, allResponseInForms);
    return result;
  } catch (error) {
    // Gestion d'erreur avec logging détaillé
    console.error('5-❌ FormSection - Erreur évaluation section', {
      sectionTitle: section.title ? getLocalizedText(section.title, currentLang) : 'Sans titre',
      error,
      section,
      allResponseInForms
    });
    
    // Notification du composant parent
    onConditionalError?.(error as Error, { section });
    
    // Fallback : afficher la section en cas d'erreur
    return true;
  }
}, [section, allResponseInForms, onConditionalError, currentLang]);
```

**Caractéristiques :**
- Évaluation memoizée pour optimiser les performances
- Gestion d'erreurs robuste avec fallback
- Callback d'erreur vers le composant parent
- Logging détaillé pour le debugging

#### Filtrage des Champs Visibles

```typescript
const { visibleFields, evaluationErrors } = React.useMemo(() => {
  const errors: string[] = [];
  const visible: FormField[] = [];

  fields.forEach(field => {
    try {
      const shouldShow = shouldDisplayFormField(field, allResponseInForms);
      
      if (shouldShow) {
        visible.push(field);
      }
    } catch (error) {
      console.error(`9-❌ FormSection - Erreur évaluation champ "${field.fieldName}"`, {
        fieldName: field.fieldName,
        error,
        field,
        allResponseInForms
      });
      
      errors.push(`Field ${field.fieldName}: ${(error as Error).message}`);
      onConditionalError?.(error as Error, { section, field });
      // Fallback : afficher le champ en cas d'erreur
      visible.push(field);
    }
  });

  return { 
    visibleFields: visible,
    evaluationErrors: errors
  };
}, [fields, allResponseInForms, section, onConditionalError]);
```

**Caractéristiques :**
- Filtrage individuel de chaque champ
- Collecte des erreurs d'évaluation
- Fallback pour éviter les pertes de données
- Statistiques de debug

#### Rendu Conditionnel

```typescript
// Cas 1 : Section cachée par les conditions d'affichage
if (!shouldShowSection) {
  return null; // Ne rien rendre
}

// Cas 2 : Section visible mais aucun champ à afficher
if (visibleFields.length === 0) {
  return null; // Ne rien rendre
}

// Cas 3 : Rendu normal de la section avec ses champs visibles
return (
  <View key={fadeKey} style={styles.sectionContainer}>
    {/* Titre, sous-titre, et champs visibles */}
  </View>
);
```

**Avantages :**
- Sections et champs cachés ne sont pas rendus (optimisation performance)
- Pas de messages de debug indésirables en production
- Interface utilisateur propre et cohérente

---

### 3. **Navigation Dynamique** (`FormEngineContent.tsx`)

#### Calcul de la Visibilité des Sections et Pages

```typescript
// Calcul de la visibilité de chaque section
const sectionVisibility = useMemo(() => {
  return form.sections.map((section) => {
    try {
      return shouldDisplaySection(section, allResponseInForms);
    } catch (error) {
      console.error('[FormEngineContent] Erreur évaluation section', { 
        sectionId: section.sectionId, 
        error 
      });
      return true; // Fallback
    }
  });
}, [form.sections, allResponseInForms]);

// Calcul de la visibilité de chaque page (basé sur les champs visibles)
const pageVisibility = useMemo(() => {
  return form.sections.map((section, sectionIdx) => {
    if (!sectionVisibility[sectionIdx]) {
      return []; // Section cachée = aucune page visible
    }

    const fields = section.formFields || [];
    const totalPages = Math.ceil(fields.length / FIELDS_PER_PAGE);
    const pageCounts = new Array(totalPages).fill(0);

    fields.forEach((field, index) => {
      const pageIndex = Math.floor(index / FIELDS_PER_PAGE);
      try {
        if (shouldDisplayFormField(field, allResponseInForms)) {
          pageCounts[pageIndex] = (pageCounts[pageIndex] || 0) + 1;
        }
      } catch (error) {
        console.error('[FormEngineContent] Erreur évaluation champ', {
          sectionId: section.sectionId,
          fieldName: field.fieldName,
          error,
        });
        pageCounts[pageIndex] = (pageCounts[pageIndex] || 0) + 1; // Fallback
      }
    });

    return pageCounts;
  });
}, [form.sections, sectionVisibility, allResponseInForms]);
```

**Fonctionnalités :**
- Calcul en temps réel de la visibilité
- Comptage des champs visibles par page
- Gestion d'erreurs avec fallback
- Optimisation avec `useMemo`

#### Navigation Automatique vers les Sections/Pages Visibles

```typescript
// Redirection automatique si la section actuelle devient cachée
useEffect(() => {
  if (!sectionVisibility[navigation.sectionIndex]) {
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

// Redirection automatique si la page actuelle devient vide
useEffect(() => {
  const pageCounts = pageVisibility[navigation.sectionIndex];
  if (!pageCounts || pageCounts.length === 0) {
    return;
  }

  const currentPageCount = pageCounts[navigation.fieldPage] || 0;
  if (currentPageCount > 0) {
    return; // Page actuelle contient des champs visibles
  }

  // Chercher la prochaine page visible dans la section actuelle
  const nextPage = pageCounts.findIndex(
    (count, idx) => count > 0 && idx > navigation.fieldPage
  );
  if (nextPage !== -1) {
    navigation.goToStep(navigation.sectionIndex, nextPage);
    return;
  }

  // Chercher la page visible précédente dans la section actuelle
  for (let idx = navigation.fieldPage - 1; idx >= 0; idx--) {
    if (pageCounts[idx] > 0) {
      navigation.goToStep(navigation.sectionIndex, idx);
      return;
    }
  }

  // Si aucune page visible dans la section actuelle, chercher dans les autres sections
  const nextSectionIndex = pageVisibility.findIndex(
    (counts, idx) => sectionPageCounts[idx] > 0 && idx > navigation.sectionIndex
  );
  if (nextSectionIndex !== -1) {
    const nextPageIndex = pageVisibility[nextSectionIndex].findIndex(
      (count) => count > 0
    );
    navigation.goToStep(nextSectionIndex, Math.max(0, nextPageIndex));
    return;
  }

  // Chercher la dernière section/page visible précédente
  for (let idx = navigation.sectionIndex - 1; idx >= 0; idx--) {
    if (sectionPageCounts[idx] > 0) {
      const counts = pageVisibility[idx];
      const lastPage = (() => {
        for (let pageIdx = counts.length - 1; pageIdx >= 0; pageIdx--) {
          if (counts[pageIdx] > 0) {
            return pageIdx;
          }
        }
        return 0;
      })();
      navigation.goToStep(idx, lastPage);
      return;
    }
  }
}, [pageVisibility, sectionPageCounts, navigation.sectionIndex, navigation.fieldPage, navigation.goToStep]);
```

**Avantages :**
- Navigation automatique et transparente
- Pas de blocage sur des sections/pages vides
- Expérience utilisateur fluide

#### Navigation Intelligente (Boutons Précédent/Suivant)

```typescript
// Navigation vers la page/section visible précédente
const goToPreviousVisible = React.useCallback(() => {
  const currentPages = pageVisibility[navigation.sectionIndex] || [];

  // Chercher dans les pages de la section actuelle
  for (let pageIdx = navigation.fieldPage - 1; pageIdx >= 0; pageIdx--) {
    if (currentPages[pageIdx] > 0) {
      navigation.goToStep(navigation.sectionIndex, pageIdx);
      return;
    }
  }

  // Chercher dans les sections précédentes
  for (let sectionIdx = navigation.sectionIndex - 1; sectionIdx >= 0; sectionIdx--) {
    const pages = pageVisibility[sectionIdx] || [];
    for (let pageIdx = pages.length - 1; pageIdx >= 0; pageIdx--) {
      if (pages[pageIdx] > 0) {
        navigation.goToStep(sectionIdx, pageIdx);
        return;
      }
    }
  }
}, [navigation, pageVisibility]);

// Navigation vers la page/section visible suivante
const goToNextVisible = React.useCallback(() => {
  const currentPages = pageVisibility[navigation.sectionIndex] || [];

  // Chercher dans les pages de la section actuelle
  for (let pageIdx = navigation.fieldPage + 1; pageIdx < currentPages.length; pageIdx++) {
    if (currentPages[pageIdx] > 0) {
      navigation.goToStep(navigation.sectionIndex, pageIdx);
      return;
    }
  }

  // Chercher dans les sections suivantes
  for (let sectionIdx = navigation.sectionIndex + 1; sectionIdx < pageVisibility.length; sectionIdx++) {
    const pages = pageVisibility[sectionIdx] || [];
    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
      if (pages[pageIdx] > 0) {
        navigation.goToStep(sectionIdx, pageIdx);
        return;
      }
    }
  }
}, [navigation, pageVisibility]);
```

**Fonctionnalités :**
- Saut automatique des sections/pages cachées
- Navigation bidirectionnelle (précédent/suivant)
- Optimisation avec `useCallback`
- Expérience utilisateur intuitive

---

### 4. **Barre de Progression Dynamique** (`FormEngineContent.tsx`)

> ⚠️ **IMPORTANT** : La barre de progression réagit **en temps réel** aux changements de visibilité des sections et champs. Elle s'ajuste automatiquement lorsque des sections ou champs sont cachés ou affichés selon les conditions d'affichage.

#### Principe de Fonctionnement

La barre de progression ne compte **que les étapes visibles** selon les conditions d'affichage actuelles. Cela signifie que :

- ✅ Si une section est cachée, elle n'est **pas comptée** dans le total
- ✅ Si un champ est caché, sa page peut ne plus être comptée si elle devient vide
- ✅ Le pourcentage de progression se **réajuste automatiquement** quand des sections/champs apparaissent ou disparaissent
- ✅ L'utilisateur voit toujours un pourcentage de progression **précis et cohérent**

#### Exemple Concret

**Scénario initial :**
- Formulaire avec 5 sections (10 pages au total)
- Barre de progression : "Étape 3 sur 10" (30%)

**Après qu'une section soit cachée :**
- 4 sections visibles (7 pages au total)
- Barre de progression : "Étape 2 sur 7" (28.5%)
- **La barre s'ajuste automatiquement** pour refléter le nouveau total

#### Calcul des Étapes Visibles

```typescript
// Calcul du nombre total d'étapes visibles
// ⚠️ IMPORTANT : Ne compte QUE les pages qui contiennent des champs visibles
const totalVisibleSteps = sectionPageCounts.reduce(
  (sum, pages) => sum + pages, 
  0
) || 1;

// Calcul de l'étape actuelle visible
// ⚠️ IMPORTANT : Compte uniquement les pages visibles parcourues
const currentVisibleStep = useMemo(() => {
  let step = 0;
  for (let i = 0; i < pageVisibility.length; i++) {
    const pages = pageVisibility[i] || [];
    // Filtrer uniquement les pages avec des champs visibles (count > 0)
    const visiblePages = pages.filter((count) => count > 0);
    
    if (i < navigation.sectionIndex) {
      // Compter toutes les pages visibles des sections précédentes
      step += visiblePages.length;
    } else if (i === navigation.sectionIndex) {
      // Compter les pages visibles jusqu'à la page actuelle
      for (let pageIdx = 0; pageIdx <= navigation.fieldPage && pageIdx < pages.length; pageIdx++) {
        if (pages[pageIdx] > 0) {
          step += 1;
        }
      }
      return Math.max(1, step);
    }
  }
  return 1;
}, [pageVisibility, navigation.sectionIndex, navigation.fieldPage]);
```

**Points clés :**
- `pageVisibility` contient le nombre de champs visibles par page
- Seules les pages avec `count > 0` sont comptées
- Le calcul est recalculé à chaque changement de visibilité

#### Utilisation dans la Progress Bar

```typescript
<FormProgressBar 
  currentStep={currentVisibleStep}   // Étape actuelle (uniquement visibles)
  totalSteps={totalVisibleSteps}     // Total d'étapes (uniquement visibles)
/>
```

**Comportement dynamique :**

1. **Quand une section est cachée :**
   - `sectionVisibility` change → `pageVisibility` est recalculé
   - `totalVisibleSteps` diminue automatiquement
   - `currentVisibleStep` est recalculé si nécessaire
   - La barre de progression se met à jour instantanément

2. **Quand un champ est caché :**
   - `pageVisibility` change pour la page concernée
   - Si la page devient vide (`count = 0`), elle n'est plus comptée
   - `totalVisibleSteps` diminue
   - La barre de progression se met à jour

3. **Quand une section/champ est affiché :**
   - Le processus inverse se produit
   - `totalVisibleSteps` augmente
   - La barre de progression se met à jour

**Résultat :**
- ✅ La barre de progression reflète **uniquement** les étapes visibles
- ✅ Le pourcentage de progression est **précis** et **cohérent**
- ✅ L'utilisateur voit **exactement** où il en est dans le formulaire
- ✅ **Mise à jour en temps réel** lors des changements de visibilité
- ✅ **Pas de confusion** : le pourcentage correspond toujours à la réalité

---

### 5. **Validation Intelligente** (`useFormPageValidation.ts`)

#### Filtrage des Champs Visibles avant Validation

```typescript
// Filtrage des champs de la page actuelle selon leur visibilité
const visibleCurrentPageFields = currentPageFields.filter((field: FormField) => {
  // Vérification de la visibilité de la section
  const sectionVisible = shouldDisplaySection(currentSection, allResponseInForms);
  
  // Vérification de la visibilité du champ individuel
  const shouldDisplay = shouldDisplayFormField(field, allResponseInForms);
  
  // Logique combinée : section visible ET champ visible
  const isVisible = sectionVisible && shouldDisplay;

  // Logging pour le debugging
  if (isVisible) {
    console.log(`✅ [Champ visible ${currentStepInfo}] ${field.fieldName}`);
  } else {
    console.log(`🚫 [Champ masqué ${currentStepInfo}] ${field.fieldName} - SectionVisible: ${sectionVisible}, ShouldDisplay: ${shouldDisplay}`);
  }

  return isVisible;
});
```

**Avantages :**
- Seuls les champs visibles sont validés
- Pas d'erreurs de validation pour les champs cachés
- Logging détaillé pour le debugging

#### Nettoyage des Valeurs des Champs Cachés

```typescript
// Nettoyage des valeurs des champs cachés pour éviter les erreurs
allFieldsInForm.forEach((field: FormField) => {
  const fieldName = field.fieldName;
  const fieldValue = cleanedValues[fieldName];
  
  // Vérifier si le champ est actuellement visible
  const isCurrentlyVisible = shouldDisplayFormField(field, tempResponseInForms);
  
  if (!isCurrentlyVisible && fieldValue !== undefined) {
    // Nettoyer selon le type de champ
    if (field.fieldType === 'text' || field.fieldType === 'textarea') {
      if (typeof fieldValue === 'string' && fieldValue.trim() === '') {
        cleanedValues[fieldName] = undefined;
      }
    } else if (field.fieldType === 'number') {
      if (isNaN(Number(fieldValue))) {
        cleanedValues[fieldName] = undefined;
      }
    } else if (field.fieldType === 'checkbox') {
      if (!Array.isArray(fieldValue)) {
        cleanedValues[fieldName] = [];
      }
    }
  }
});
```

**Fonctionnalités :**
- Nettoyage automatique des valeurs invalides
- Gestion spécifique par type de champ
- Prévention des erreurs de validation
- Préservation des données valides

---

## 📊 Résumé des Ajustements

### ✅ Fonctionnalités Implémentées

1. **Évaluation des Conditions**
   - Fonctions centralisées pour sections et champs
   - Support de tous les opérateurs conditionnels
   - Calculs mathématiques (SOMME, MULTIPLICATION)
   - Gestion d'erreurs robuste avec fallback

2. **Filtrage Dynamique**
   - Sections cachées ne sont pas rendues (`return null`)
   - Champs cachés ne sont pas rendus
   - Pas de messages de debug indésirables
   - Optimisation des performances

3. **Navigation Automatique**
   - Redirection automatique vers la prochaine section/page visible
   - Détection des sections/pages vides
   - Navigation bidirectionnelle intelligente
   - Pas de blocage sur des pages vides

4. **Navigation Intelligente**
   - Boutons Précédent/Suivant qui sautent les sections/pages cachées
   - Navigation fluide et intuitive
   - Optimisation avec `useCallback`
   - Expérience utilisateur améliorée

5. **Barre de Progression Dynamique** ⚠️ **RÉAGIT EN TEMPS RÉEL**
   - Compte **uniquement** les étapes visibles (sections/champs cachés exclus)
   - Calcul précis de la position actuelle
   - **Mise à jour automatique** quand des sections/champs sont cachés ou affichés
   - **Ajustement du pourcentage** en temps réel (ex: 30% → 28.5% si section cachée)
   - Pourcentage de progression **exact et cohérent** avec la réalité du formulaire
   - **Réaction instantanée** aux changements de conditions d'affichage

6. **Validation Conditionnelle**
   - Seuls les champs visibles sont validés
   - Pas d'erreurs pour les champs cachés
   - Nettoyage automatique des valeurs invalides
   - Logging détaillé pour le debugging

7. **Gestion d'Erreurs**
   - Fallback (afficher par défaut) en cas d'erreur
   - Logging détaillé pour le debugging
   - Callbacks vers le composant parent
   - Prévention des crashes

8. **Statistiques de Debug**
   - Métriques sur les champs visibles/cachés
   - Informations détaillées pour le développement
   - Callbacks pour le monitoring
   - Support du mode debug

---

## 🔄 Flux d'Exécution

### Scénario 1 : Section Cachée

1. L'utilisateur modifie une valeur qui cache une section
2. `sectionVisibility` est recalculé → section marquée comme cachée
3. `pageVisibility` est recalculé → pages de la section ne sont plus comptées
4. **`totalVisibleSteps` diminue automatiquement** (ex: de 10 à 7 étapes)
5. `useEffect` détecte que la section actuelle est cachée
6. Navigation automatique vers la prochaine section visible
7. `FormSection` retourne `null` (section non rendue)
8. **Barre de progression mise à jour en temps réel** :
   - `currentVisibleStep` recalculé
   - `totalVisibleSteps` mis à jour
   - Pourcentage de progression ajusté (ex: 30% → 28.5%)

### Scénario 2 : Champ Caché

1. L'utilisateur modifie une valeur qui cache un champ
2. `pageVisibility` est recalculé → page peut devenir vide (`count = 0`)
3. **Si la page devient vide, elle n'est plus comptée dans `totalVisibleSteps`**
4. `useEffect` détecte que la page actuelle est vide
5. Navigation automatique vers la prochaine page visible
6. `FormSection` filtre les champs → champ non rendu
7. Validation ignore le champ caché
8. **Barre de progression mise à jour** :
   - `totalVisibleSteps` diminue si la page devient vide
   - `currentVisibleStep` ajusté si nécessaire
   - Pourcentage recalculé automatiquement

### Scénario 3 : Navigation Manuelle

1. L'utilisateur clique sur "Précédent" ou "Suivant"
2. `goToPreviousVisible` ou `goToNextVisible` est appelé
3. Recherche de la prochaine section/page visible
4. Navigation vers cette section/page
5. **Barre de progression mise à jour** :
   - `currentVisibleStep` recalculé selon la nouvelle position
   - Pourcentage mis à jour (ex: 30% → 40%)
6. Validation des champs visibles uniquement

### Scénario 4 : Section/Champ Affiché (Inverse)

1. L'utilisateur modifie une valeur qui **affiche** une section/champ précédemment caché
2. `sectionVisibility` ou `pageVisibility` est recalculé
3. **`totalVisibleSteps` augmente automatiquement** (ex: de 7 à 10 étapes)
4. **Barre de progression mise à jour en temps réel** :
   - `totalVisibleSteps` augmente
   - `currentVisibleStep` peut rester identique ou être ajusté
   - Pourcentage de progression ajusté (ex: 50% → 40% car plus d'étapes)
5. La section/champ devient visible et affiché

---

## 🎯 Avantages de l'Implémentation

### Pour l'Utilisateur

- ✅ **Navigation fluide** : Pas de blocage sur des pages vides
- ✅ **Interface propre** : Pas de sections/champs inutiles affichés
- ✅ **Progression claire et dynamique** : 
  - Barre de progression qui s'ajuste automatiquement
  - Pourcentage toujours précis et cohérent
  - Réaction en temps réel aux changements de visibilité
  - Pas de confusion : le pourcentage correspond toujours à la réalité
- ✅ **Expérience intuitive** : Navigation naturelle

### Pour le Développeur

- ✅ **Code maintenable** : Fonctions centralisées et réutilisables
- ✅ **Debugging facile** : Logging détaillé et statistiques
- ✅ **Performance optimisée** : Memoization et filtrage efficace
- ✅ **Gestion d'erreurs robuste** : Fallbacks et callbacks

### Pour le Système

- ✅ **Performance** : Rendu conditionnel optimisé
- ✅ **Mémoire** : Pas de composants inutiles en mémoire
- ✅ **Validation** : Seulement les champs pertinents
- ✅ **Scalabilité** : Architecture extensible

---

## 📝 Notes Techniques

### Conversion des Données

Les valeurs du formulaire sont converties en format `ResponseInForm` pour l'évaluation :

```typescript
// Format original
{ firstName: "John", age: 25 }

// Format converti pour l'évaluation
{ 
  firstName: { responseValue: "John" }, 
  age: { responseValue: 25 } 
}
```

### Memoization

Tous les calculs de visibilité utilisent `useMemo` pour optimiser les performances :
- `sectionVisibility` : Recalculé uniquement si `form.sections` ou `allResponseInForms` changent
- `pageVisibility` : Recalculé uniquement si `form.sections`, `sectionVisibility` ou `allResponseInForms` changent
- `currentVisibleStep` : Recalculé uniquement si `pageVisibility` ou la navigation change

### Callbacks

Le système fournit des callbacks pour le monitoring :
- `onConditionalChange` : Notifie les changements de statistiques
- `onConditionalError` : Notifie les erreurs d'évaluation

---

## 🔍 Exemples d'Utilisation

### Exemple 1 : Section Conditionnelle

```json
{
  "sectionId": "section-2",
  "title": "Informations Complémentaires",
  "conditionalDisplay": {
    "logic": "AND",
    "rules": [
      {
        "fieldName": "hasAdditionalInfo",
        "operator": "==",
        "value": "yes"
      }
    ]
  },
  "formFields": [...]
}
```

**Comportement :**
- La section n'est affichée que si `hasAdditionalInfo == "yes"`
- Si la valeur change, la section apparaît/disparaît automatiquement
- La navigation saute automatiquement cette section si elle est cachée

### Exemple 2 : Champ Conditionnel

```json
{
  "fieldName": "phoneNumber",
  "fieldType": "text",
  "label": { "fr": "Numéro de téléphone" },
  "conditionalDisplay": {
    "logic": "AND",
    "rules": [
      {
        "fieldName": "contactMethod",
        "operator": "==",
        "value": "phone"
      }
    ]
  }
}
```

**Comportement :**
- Le champ n'est affiché que si `contactMethod == "phone"`
- Si la valeur change, le champ apparaît/disparaît automatiquement
- La validation ignore ce champ s'il est caché

### Exemple 3 : Conditions Multiples

```json
{
  "conditionalDisplay": {
    "logic": "OR",
    "rules": [
      {
        "fieldName": "age",
        "operator": ">",
        "numeric_compare_to": 18
      },
      {
        "fieldName": "hasParentalConsent",
        "operator": "==",
        "value": "yes"
      }
    ]
  }
}
```

**Comportement :**
- Affiché si `age > 18` OU `hasParentalConsent == "yes"`
- Logique `OR` : au moins une condition doit être vraie
- Logique `AND` : toutes les conditions doivent être vraies

### Exemple 4 : Réaction de la Barre de Progression

**Scénario : Formulaire avec 5 sections (10 pages au total)**

**État initial :**
- Toutes les sections sont visibles
- Barre de progression : "Étape 3 sur 10" (30%)
- L'utilisateur est à la page 3 de la section 2

**Action : L'utilisateur change une valeur qui cache la section 3**

**Résultat immédiat :**
1. `sectionVisibility[2]` devient `false` (section 3 cachée)
2. `pageVisibility` est recalculé → les pages de la section 3 ne sont plus comptées
3. `totalVisibleSteps` passe de 10 à 7 (3 pages de la section 3 retirées)
4. `currentVisibleStep` est recalculé :
   - Si l'utilisateur était avant la section 3 : reste à 3
   - Si l'utilisateur était dans la section 3 : navigation automatique
5. **Barre de progression mise à jour** : "Étape 3 sur 7" (42.8%)
6. Le pourcentage augmente car il y a moins d'étapes totales

**Action : L'utilisateur change une valeur qui affiche à nouveau la section 3**

**Résultat immédiat :**
1. `sectionVisibility[2]` redevient `true` (section 3 visible)
2. `pageVisibility` est recalculé → les pages de la section 3 sont comptées
3. `totalVisibleSteps` passe de 7 à 10 (3 pages de la section 3 rajoutées)
4. `currentVisibleStep` reste identique (3)
5. **Barre de progression mise à jour** : "Étape 3 sur 10" (30%)
6. Le pourcentage diminue car il y a plus d'étapes totales

**Points clés :**
- ✅ La barre de progression **réagit instantanément** aux changements
- ✅ Le pourcentage est **toujours précis** et reflète la réalité
- ✅ L'utilisateur voit **exactement** où il en est
- ✅ **Pas de confusion** : le total correspond toujours aux étapes visibles

---

## 🚀 Conclusion

L'implémentation de l'affichage conditionnel dans le FormEngine est complète et robuste. Elle permet :

- ✅ Une réaction dynamique aux changements de valeurs
- ✅ Une navigation intelligente et fluide
- ✅ **Une barre de progression qui s'ajuste en temps réel** aux changements de visibilité
- ✅ Une validation adaptative
- ✅ Une expérience utilisateur optimale
- ✅ Un code maintenable et extensible

**Points forts de la barre de progression :**
- ⚠️ **Réaction en temps réel** : S'ajuste automatiquement quand des sections/champs sont cachés ou affichés
- 📊 **Précision** : Le pourcentage reflète toujours la réalité du formulaire
- 🔄 **Cohérence** : Pas de confusion, le total correspond toujours aux étapes visibles
- ⚡ **Performance** : Calcul optimisé avec `useMemo` pour éviter les recalculs inutiles

Tous les ajustements sont documentés, testés et prêts pour la production.

---

**Date de création :** 2024  
**Version :** 1.0.0  
**Auteur :** URMAPHA Lab


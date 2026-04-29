# 🔍 Problème du DynamicSearch dans les RepeatGroups

## 📋 Description du Problème

Le **DynamicSearch** (recherche dans les dropdowns avec `enableSearch: true`) ne fonctionne pas correctement dans les **RepeatGroups** à cause d'un problème de transformation des noms de champs.

## 🔴 Symptômes

1. **Dans les champs simples** : La recherche fonctionne normalement
2. **Dans les RepeatGroups** : 
   - La recherche ne filtre pas les options correctement
   - Les options filtrées ne se mettent pas à jour quand on tape dans le champ de recherche
   - Le champ parent (`dependentFieldName`) n'est pas correctement détecté

## 🔍 Analyse Technique

### 1. Transformation des noms dans les RepeatGroups

Dans un RepeatGroup, les noms de champs sont transformés selon le pattern :
```
{repeatGroupName}_{fieldName}_{index}
```

**Exemple** :
- Nom original : `department`
- Nom transformé pour l'index 0 : `addresses_department_0`
- Nom transformé pour l'index 1 : `addresses_department_1`

### 2. Problème dans `DropdownFormField.tsx`

**Ligne 71-73** :
```typescript
const dependentValue = field.dynamicFilterRule 
  ? watch(field.dynamicFilterRule.dependentFieldName)
  : null;
```

**Le problème** :
- `field.dynamicFilterRule.dependentFieldName` contient le **nom original** (ex: `department`)
- Mais dans un RepeatGroup, le champ parent a un **nom transformé** (ex: `addresses_department_0`)
- Donc `watch('department')` ne trouve pas la valeur car elle est stockée sous `addresses_department_0`

### 3. Impact sur le DynamicSearch

Le `useEffect` qui filtre les options (lignes 145-164) dépend de `field.selectOptions` :
```typescript
useEffect(() => {
    // ...
    const filtered = field.selectOptions?.filter(option => {
        const labelText = getLocalizedText(option.label, currentLang);
        const labelSlug = createSlug(labelText);
        return labelSlug.includes(querySlug);
    }) || [];
    setFilteredOptions(filtered);
}, [searchQuery, field.selectOptions, field.enableSearch, currentLang]);
```

**Le problème** :
- Si `dependentValue` est `undefined` (car on regarde le mauvais champ), alors `isDisabled` est `true`
- Mais même si `isDisabled` n'est pas le problème principal, le vrai problème est que :
  - Le filtrage dynamique (`useRepeatGroupDynamicFiltering`) met à jour `field.selectOptions` correctement
  - MAIS le `watch()` pour `dependentValue` ne fonctionne pas, donc le champ peut être désactivé incorrectement

## ✅ Solution Proposée

### Solution 1 : Détecter le nom transformé du champ parent

Dans `DropdownFormField.tsx`, détecter si on est dans un RepeatGroup en analysant le `name` prop, puis transformer le `dependentFieldName` en conséquence.

**Code à modifier** :
```typescript
const fieldName = name ?? field.fieldName.toString();

// 🆕 Détecter si on est dans un RepeatGroup (pattern: {group}_{field}_{index})
const isInRepeatGroup = name && /^(.+)_(.+)_(\d+)$/.test(name);
let dependentFieldName = field.dynamicFilterRule?.dependentFieldName;

if (isInRepeatGroup && dependentFieldName) {
  // Extraire le nom du groupe et l'index du nom actuel
  const match = name.match(/^(.+)_(.+)_(\d+)$/);
  if (match) {
    const [, groupName, , index] = match;
    // Transformer le nom du champ parent : {group}_{dependentField}_{index}
    dependentFieldName = `${groupName}_${dependentFieldName}_${index}`;
  }
}

const dependentValue = field.dynamicFilterRule 
  ? watch(dependentFieldName)
  : null;
```

### Solution 2 : Passer le nom transformé via une prop

Modifier `FieldRenderer` pour passer le nom transformé du champ parent si on est dans un RepeatGroup.

## 🎯 Fichiers à Modifier

1. **`apps/core/src/components/atoms/form-engine/ui/DropdownFormField.tsx`**
   - Lignes 70-73 : Modifier la logique de récupération de `dependentValue`

## 📝 Notes

- Le filtrage dynamique (`useRepeatGroupDynamicFiltering`) fonctionne correctement et met à jour `field.selectOptions`
- Le problème est uniquement dans la détection du champ parent pour déterminer si le champ doit être désactivé
- La recherche elle-même (filtrage par `searchQuery`) devrait fonctionner une fois que `field.selectOptions` est correctement mis à jour

## ✅ Solution Implémentée

### Approche : Prop explicite (Solution 2)

La solution choisie est de **passer explicitement le nom transformé du champ parent** via une prop `dependentFieldNameTransformed` depuis `RepeatGroupRenderer` jusqu'à `DropdownFormField`. Cette approche est plus stable et maintenable que le parsing automatique.

### Fichiers modifiés

1. **`DropdownFormField.tsx`**
   - Ajout de la prop optionnelle `dependentFieldNameTransformed?: string`
   - Utilisation de cette prop dans la logique de `watch()` avec fallback sur `getValues()`
   - Si `dependentFieldNameTransformed` est fourni, il est utilisé, sinon on utilise le nom original

2. **`FieldRenderer.tsx`**
   - Ajout de la prop optionnelle `dependentFieldNameTransformed?: string`
   - Passage de cette prop à `DropdownFormField` dans le case "dropdown"

3. **`RepeatGroupRenderer.tsx`** (et `SeriesItem.tsx`)
   - Calcul de `dependentFieldNameTransformed` pour chaque champ avec `dynamicFilterRule`
   - Utilisation de `buildTempFieldName()` pour transformer le nom du champ parent
   - Passage de cette prop à `FieldRenderer` pour tous les champs (simples et nested)

### Code de la solution

**Dans `RepeatGroupRenderer.tsx` / `SeriesItem.tsx` :**
```typescript
// Calculer le nom transformé du champ parent si dynamicFilterRule existe
const dependentFieldNameTransformed = subField.dynamicFilterRule
  ? buildTempFieldName(subField.dynamicFilterRule.dependentFieldName, index)
  : undefined;

// Passer à FieldRenderer
<FieldRenderer
  field={subField}
  name={tempName}
  dependentFieldNameTransformed={dependentFieldNameTransformed}
  // ... autres props
/>
```

**Dans `DropdownFormField.tsx` :**
```typescript
// Utiliser le nom transformé si fourni (pour les RepeatGroups), sinon le nom original
const dependentFieldNameToWatch = field.dynamicFilterRule 
  ? (dependentFieldNameTransformed || field.dynamicFilterRule.dependentFieldName)
  : null;

// Utiliser getValues() comme fallback pour éviter les problèmes de timing
const dependentValueFromWatch = dependentFieldNameToWatch ? watch(dependentFieldNameToWatch) : null;
const dependentValueFromGetValues = dependentFieldNameToWatch ? getValues(dependentFieldNameToWatch) : null;
const dependentValue = dependentValueFromWatch !== undefined && dependentValueFromWatch !== null && dependentValueFromWatch !== ''
  ? dependentValueFromWatch 
  : (dependentValueFromGetValues !== undefined && dependentValueFromGetValues !== null && dependentValueFromGetValues !== '' ? dependentValueFromGetValues : null);
```

### Avantages de cette solution

1. **Source unique de vérité** : La transformation est calculée au bon endroit (dans `RepeatGroupRenderer`)
2. **Pas de parsing fragile** : Pas besoin de regex ou de détection automatique
3. **Maintenabilité** : Si le format change, un seul endroit à modifier
4. **Compatibilité rétroactive** : La prop est optionnelle, donc les champs simples continuent de fonctionner
5. **Support des nested groups** : Le pattern est adapté pour les RepeatGroups imbriqués

## 🔄 État Actuel

- ✅ Filtrage dynamique des options : **Fonctionne** (via `useRepeatGroupDynamicFiltering`)
- ✅ Détection du champ parent : **Fonctionne** (via `dependentFieldNameTransformed`)
- ✅ DynamicSearch : **Fonctionne correctement** dans les RepeatGroups


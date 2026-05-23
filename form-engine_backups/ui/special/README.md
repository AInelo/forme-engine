# 🎨 Champs Spéciaux du FormEngine

Ce dossier contient les composants UI spécialisés pour des types de champs avancés.

## 📋 Types Disponibles

### 1. **IMAGE** - Upload d'Images
**Composant** : `ImageFormField.tsx`

**Caractéristiques** :
- ✅ Upload par drag & drop ou clic
- ✅ Preview de l'image sélectionnée
- ✅ Validation automatique du type MIME
- ✅ Affichage de la taille du fichier
- ✅ Boutons : Voir (agrandir) et Supprimer

**Formats acceptés** : JPG, PNG, GIF, WEBP

**Exemple d'utilisation** :
```typescript
{
  fieldType: "IMAGE",
  fieldName: "photo_profil",
  label: "Photo de profil",
  validations: [
    {
      validationType: "fileSize",
      value: 5242880, // 5MB
      errMsg: "L'image ne doit pas dépasser 5MB"
    }
  ]
}
```

---

### 2. **PDF** - Upload de PDF avec Preview
**Composant** : `PDFFormField.tsx`

**Caractéristiques** :
- ✅ Upload par drag & drop ou clic
- ✅ Preview dans un iframe
- ✅ Validation automatique du type PDF
- ✅ Bouton pour ouvrir dans un nouvel onglet
- ✅ Affichage de la taille du fichier

**Formats acceptés** : PDF uniquement

**Exemple d'utilisation** :
```typescript
{
  fieldType: "PDF",
  fieldName: "justificatif",
  label: "Justificatif",
  validations: [
    {
      validationType: "fileType",
      value: ["application/pdf"],
      errMsg: "Seuls les fichiers PDF sont acceptés"
    }
  ]
}
```

---

### 3. **VIDEO** - Upload de Vidéos
**Composant** : `VideoFormField.tsx`

**Caractéristiques** :
- ✅ Upload par drag & drop ou clic
- ✅ Preview avec player vidéo HTML5
- ✅ Validation automatique du type vidéo
- ✅ Affichage de la taille du fichier
- ✅ Contrôles play/pause intégrés

**Formats acceptés** : MP4, WEBM, AVI, etc.

---

### 4. **AUDIO** - Upload d'Audio
**Composant** : `AudioFormField.tsx`

**Caractéristiques** :
- ✅ Upload par drag & drop ou clic
- ✅ Player audio intégré
- ✅ Boutons play/pause
- ✅ Validation automatique du type audio
- ✅ Affichage de la taille du fichier

**Formats acceptés** : MP3, WAV, OGG, etc.

---

### 5. **VOICE** - Enregistrement Vocal
**Composant** : `VoiceFormField.tsx`

**Caractéristiques** :
- 🎙️ Enregistrement via microphone navigateur
- ⏱️ Timer de durée d'enregistrement
- ▶️ Playback de l'enregistrement
- ❌ Suppression de l'enregistrement
- 🔴 Indicateur visuel pendant l'enregistrement
- 🔒 Gestion des permissions microphone

**Format de sortie** : Blob audio WebM

**Permissions requises** : Accès au microphone

**Exemple d'utilisation** :
```typescript
{
  fieldType: "VOICE",
  fieldName: "message_vocal",
  label: "Message vocal"
}
```

---

### 6. **DOCUMENT** - Upload de Documents Office
**Composant** : `DocumentFormField.tsx`

**Caractéristiques** :
- ✅ Upload par drag & drop ou clic
- ✅ Icônes par type de fichier (Word, Excel, PPT)
- ✅ Validation automatique du type
- ✅ Affichage de la taille du fichier

**Formats acceptés** : .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt

---

### 7. **TIP_TAP_DOC_TEXT** - Éditeur de Texte Riche
**Composant** : `TipTapFormField.tsx`

**Caractéristiques** :
- ⚠️ **À implémenter** : Interface basique avec textarea
- 📝 Support du rich text formatting
- 🖼️ Insertion d'images
- 📊 Création de tableaux
- 🔗 Liens hypertextes
- 📋 Options de formatage (gras, italique, etc.)

**Note** : L'intégration complète de TipTap Editor est à faire. Un textarea de base est fourni en attendant.

---

## 🔌 Intégration dans FieldRenderer

Tous ces composants sont automatiquement intégrés dans `FieldRenderer.tsx` :

```typescript
// Le FieldRenderer détecte automatiquement le type et rend le bon composant
case "IMAGE":
  return <ImageFormField field={field} ... />;
case "PDF":
  return <PDFFormField field={field} ... />;
// etc.
```

---

## 🎨 Design System

Tous les composants suivent la même charte graphique :

- **Couleur principale** : Teal (#008080)
- **Drag & drop** : Border teal-500 avec bg teal-50 au survol
- **Icônes** : Lucide React
- **Responsive** : Mobile-first design
- **Accessibilité** : Support clavier et screen readers

---

## 📝 Validation

Tous les types spéciaux peuvent utiliser les validations standard :

```typescript
validations: [
  {
    validationType: "required",
    errMsg: "Ce champ est obligatoire"
  },
  {
    validationType: "fileSize",
    value: 10485760, // 10MB
    errMsg: "Le fichier ne doit pas dépasser 10MB"
  },
  {
    validationType: "fileType",
    value: ["image/png", "image/jpeg"],
    errMsg: "Seuls les PNG et JPEG sont acceptés"
  }
]
```

---

## 🚀 Utilisation dans un Formulaire JSON

```json
{
  "fieldType": "IMAGE",
  "fieldName": "avatar",
  "formFieldId": "avatar_001",
  "label": {
    "fr": "Votre photo de profil",
    "en": "Your profile picture"
  },
  "validations": [
    {
      "validationType": "required",
      "errMsg": "Une photo de profil est requise"
    },
    {
      "validationType": "fileSize",
      "value": 2097152,
      "errMsg": "L'image ne doit pas dépasser 2MB"
    }
  ],
  "response": {
    "responseValue": null
  }
}
```

---

## 🔧 Développement Futur

### Améliorations prévues :

1. **TipTap** : Implémenter l'éditeur de texte riche complet
2. **Compression** : Ajouter la compression d'images côté client
3. **Upload progressif** : Barre de progression pour gros fichiers
4. **Multi-upload** : Support pour plusieurs fichiers simultanés
5. **Cropping** : Outil de recadrage d'images
6. **Filtres** : Filtres pour images (niveau basique)

---

## 📚 Ressources

- [Lucide Icons](https://lucide.dev/)
- [TipTap Editor](https://tiptap.dev/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File)

---

**Dernière mise à jour** : 2024
**Maintenu par** : Équipe FiscPredict


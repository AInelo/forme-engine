# Guide rapide : créer et supprimer des fichiers via l’API Bucket URMAPHA

## Pré-requis communs
- Clé secrète (`secret_key`) : `urmaphabucket` (modifiable via `.env`).
- Base URL (développement) : `http://localhost:5000`. Remplacez-la par `https://bucket.urmaphalab.com` en production.
- Toutes les requêtes (hors streaming et santé) doivent inclure la clé secrète dans le body ou la query string.

---

## 1. Créer (uploader) un fichier

### Endpoint
```
POST /api/files/upload-file
```

### Paramètres principaux
- `file` (**obligatoire**) : fichier à envoyer (`multipart/form-data`).
- `folder_name` (optionnel) : dossier de destination (défaut `general`).
- `filename` (optionnel) : nom personnalisé (sans extension). L’API normalise automatiquement le nom et rajoute l’extension originale.
- `secret_key` (**obligatoire**) : clé d’accès.

### Exemple cURL
```bash
curl -X POST http://localhost:5000/api/files/upload-file \
  -F "file=@/chemin/vers/mon-fichier.pdf" \
  -F "folder_name=documents" \
  -F "filename=rapport-2024" \
  -F "secret_key=urmaphabucket"
```

### Réponse attendue
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "originalname": "mon-fichier.pdf",
    "filename": "rapport-2024.pdf",
    "folder": "documents",
    "path": "/home/admin/urmapha-bucket/documents/rapport-2024.pdf",
    "url": "http://localhost:5000/api/files/find-file?filename=rapport-2024.pdf&foldername=documents&secret_key=urmaphabucket"
  }
}
```
Note : conservez `data.url` si vous souhaitez utiliser la suppression par URL plus tard.

### Upload multiple (optionnel)
```
POST /api/files/upload-files
```
Utilisez le champ `files` (tableau) et un JSON `filenames` pour des noms personnalisés.

---

## 2. Supprimer un fichier par dossier + nom

### Endpoint
```
DELETE /api/files/delete-file
```

### Paramètres
- `folder_name` (body ou query) : dossier contenant le fichier (défaut `general`).
- `filename` (body ou query) : nom du fichier tel qu’il apparaît dans le bucket (normalisé).
- `secret_key` : clé d’accès.

### Exemple cURL (JSON body)
```bash
curl -X DELETE http://localhost:5000/api/files/delete-file \
  -H "Content-Type: application/json" \
  -d '{
    "folder_name": "documents",
    "filename": "rapport-2024.pdf",
    "secret_key": "urmaphabucket"
  }'
```

### Réponse attendue
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "filename": "rapport-2024.pdf",
    "folder": "documents",
    "path": "/home/admin/urmapha-bucket/documents/rapport-2024.pdf"
  }
}
```

En cas d’erreur :
- `400` si `filename` manquant.
- `404` si le fichier n’existe pas.

---

## 3. Supprimer un fichier à partir de l’URL de téléchargement

### Endpoint
```
DELETE /api/files/delete-file-by-url
```

### Paramètres
- `file_url` : URL renvoyée lors de l’upload (`data.url`).
- `secret_key` : clé d’accès.

### Exemple cURL
```bash
curl -X DELETE http://localhost:5000/api/files/delete-file-by-url \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "http://localhost:5000/api/files/find-file?filename=rapport-2024.pdf&foldername=documents&secret_key=urmaphabucket",
    "secret_key": "urmaphabucket"
  }'
```

### Réponse attendue
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "filename": "rapport-2024.pdf",
    "folder": "documents",
    "path": "/home/admin/urmapha-bucket/documents/rapport-2024.pdf"
  }
}
```

Erreurs possibles :
- `400` si l’URL est absente ou mal formée.
- `404` si le fichier n’existe plus.

---

## 4. Bonnes pratiques
- Toujours vérifier les codes HTTP pour confirmer l’opération.
- Conserver un log des URLs générées lors de l’upload si vous comptez les réutiliser pour la suppression par URL.
- Les noms de fichiers sont normalisés (minuscules, accents retirés, etc.) : utilisez la valeur renvoyée par l’API pour toute opération ultérieure.
- Pour supprimer plusieurs fichiers, répétez les appels DELETE (boucle ou script).

Avec ce guide, vous pouvez gérer le cycle de vie de vos fichiers (création/suppression) via le bucket URMAPHA en toute simplicité.

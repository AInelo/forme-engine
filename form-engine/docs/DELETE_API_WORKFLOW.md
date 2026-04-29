# Fonctionnement de la suppression de fichiers dans le Bucket URMAPHA

## Vue d'ensemble

L'API expose deux parcours de suppression pour retirer des fichiers stockés sur le bucket :

1. **Suppression par dossier + nom de fichier** (`DELETE /api/files/delete-file`)
2. **Suppression par URL directe** (`DELETE /api/files/delete-file-by-url`)

Dans les deux cas, la requête doit inclure la `secret_key` (dans le body ou en query) pour passer le middleware d'authentification `validateSecretKey`.

---

## 1. Suppression par dossier et nom de fichier

### Endpoint
```
DELETE /api/files/delete-file
```

### Paramètres attendus
- `folder_name` (body ou query) : dossier où se trouve le fichier (défaut : dossier configuré dans `.env`, typiquement `general`).
- `filename` (body ou query) : nom exact du fichier tel qu'il est stocké (normalisé lors de l'upload).
- `secret_key` : clé d'accès au bucket.

### Flux côté backend
1. `FileController.deleteFile` lit `folder_name` et `filename`.
2. Si `filename` est manquant → réponse `400` (`Filename is required`).
3. Sinon, appel `FileService.deleteFile(folderName, filename)`.
4. `FileService.deleteFile` vérifie l'existence via `FileUtils.fileExists`, puis supprime le fichier avec `fs.unlinkSync`. Si le fichier n'existe pas → erreur `FILE_NOT_FOUND`.
5. Réponse `200` avec confirmation (`File deleted successfully`) et détails (`filename`, `folder`, `path`).
6. En cas d'erreur non gérée → `500` (`Internal server error`).

### Exemple cURL
```bash
curl -X DELETE http://localhost:5000/api/files/delete-file \
  -H "Content-Type: application/json" \
  -d '{
    "folder_name": "documents",
    "filename": "rapport-2024.pdf",
    "secret_key": "urmaphabucket"
  }'
```

---

## 2. Suppression via l'URL de téléchargement

### Endpoint
```
DELETE /api/files/delete-file-by-url
```

### Paramètres attendus
- `file_url` (body ou query) : URL renvoyée par l'upload (`/api/files/find-file?...`).
- `secret_key` : clé d'accès au bucket.

### Flux côté backend
1. `FileController.deleteFileByUrl` récupère `file_url`.
2. Si `file_url` est absent → réponse `400` (`File URL is required`).
3. `FileService.deleteFileByUrl` parse l'URL via `new URL(fileUrl)` et extrait `foldername` & `filename` (query params).
4. Si l'URL ne contient pas ces paramètres → erreur `INVALID_FILE_URL` (`400`).
5. Sinon, délègue à `deleteFile(folderName, filename)` pour effectuer la suppression physique.
6. Retour `200` avec confirmation et les informations du fichier supprimé (`filename`, `folder`, `path`).
7. `FILE_NOT_FOUND` → réponse `404`. Autres erreurs → `500`.

### Exemple cURL
```bash
curl -X DELETE http://localhost:5000/api/files/delete-file-by-url \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "http://localhost:5000/api/files/find-file?filename=rapport-2024.pdf&foldername=documents&secret_key=urmaphabucket",
    "secret_key": "urmaphabucket"
  }'
```

---

## Gestion des erreurs
- `400 Bad Request` : paramètres manquants ou URL invalide.
- `404 Not Found` : fichier introuvable (dossier/nom incorrects ou déjà supprimé).
- `500 Internal Server Error` : erreur inattendue lors de la suppression.

---

## Rappels importants
- Les noms de fichiers sont normalisés lors de l'upload (minuscules, caractères spéciaux nettoyés). Utilisez la valeur retournée par l'API (`data.filename`) pour toute suppression ultérieure.
- La suppression directe via `DELETE` sur `/api/files/find-file` n'est **pas** supportée ; il faut passer par les endpoints dédiés.
- Le middleware CORS est géré côté backend Express, donc les clients front peuvent appeler ces routes directement si l'origine est autorisée via `CORS_ALLOWED_ORIGINS`.

Ce document peut être partagé avec les équipes front/backend pour clarifier le fonctionnement complet du cycle de suppression des fichiers dans le bucket URMAPHA.

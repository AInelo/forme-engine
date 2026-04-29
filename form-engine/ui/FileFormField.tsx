import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { UploadCloud, Loader2, ExternalLink, Trash2 } from "lucide-react";
import classNames from "classnames";

import { FormFieldWrapper } from "../FormFieldWrapper";
import type { FormField } from "../types/formTypeStructure";
import { useFileBucketManager } from "../hooks/useFileBucketManager";
import { extractFileNameFromUrl } from "../utils/fileName";

interface FileFormField extends FormField {
  fieldType: "file";
}

interface FileFormFieldProps {
  field: FileFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string | string[];
  className?: string;
}

interface UploadedFileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  filename?: string;
  uploading: boolean;
  error?: string | null;
}

const generateId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.startsWith("video/")) return "🎬";
  if (fileType.startsWith("audio/")) return "🎵";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word")) return "📝";
  if (fileType.includes("excel") || fileType.includes("sheet")) return "📊";
  return "📎";
};

const FileFormField: React.FC<FileFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
  defaultValue,
}) => {
  const { setValue } = useFormContext();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>(() => {
    if (typeof defaultValue === "string" && defaultValue.trim().length > 0) {
      return [
        {
          id: generateId(),
          name: extractFileNameFromUrl(defaultValue) ?? defaultValue,
          size: 0,
          type: "",
          url: defaultValue,
          filename: extractFileNameFromUrl(defaultValue) ?? undefined,
          uploading: false,
          error: null,
        },
      ];
    }
    if (Array.isArray(defaultValue)) {
      return defaultValue
        .filter((url) => typeof url === "string" && url.trim().length > 0)
        .map((url) => ({
          id: generateId(),
          name: extractFileNameFromUrl(url) ?? url,
          size: 0,
          type: "",
          url,
          filename: extractFileNameFromUrl(url) ?? undefined,
          uploading: false,
          error: null,
        }));
    }
    return [];
  });
  const [componentError, setComponentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fieldName = name ?? field.fieldName.toString();
  const isMultiple = useMemo(
    () => Array.isArray(field.response?.responseValue) || Array.isArray(defaultValue),
    [field.response?.responseValue, defaultValue]
  );
  const {
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting,
    error: bucketError,
    resetError,
    hasUploadSupport,
    hasDeleteSupport,
  } = useFileBucketManager(field.fileToBucketManage);

  const effectiveError = componentError ?? bucketError ?? null;
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (uploadedFiles.length > 0) {
      const urls = uploadedFiles
        .filter((f) => f.url && !f.error)
        .map((f) => f.url!) ?? [];
      setValue(
        fieldName,
        isMultiple ? urls : urls[0] ?? null,
        { shouldValidate: false, shouldTouch: false }
      );
    }
  }, [uploadedFiles, fieldName, isMultiple, setValue]);

  const updateFilesState = (
    producer: (previous: UploadedFileInfo[]) => UploadedFileInfo[]
  ) => {
    setUploadedFiles((prev) => {
      const next = producer(prev);
      const successfulUrls = next.filter((f) => f.url && !f.error).map((f) => f.url!) ?? [];
      setValue(
        fieldName,
        isMultiple ? successfulUrls : successfulUrls[0] ?? null,
        { shouldValidate: true, shouldTouch: true }
      );
      return next;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!hasUploadSupport) {
      setComponentError(
        "Configuration d'upload manquante pour ce champ (fileToBucketManage)."
      );
      return;
    }

    resetError();
    setComponentError(null);

    const selectedFiles = Array.from(files);

    if (!isMultiple) {
      updateFilesState(() => []);
    }

    await Promise.all(
      selectedFiles.map(async (file) => {
        const id = generateId();
        updateFilesState((prev) => {
          const baseEntry: UploadedFileInfo = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            uploading: true,
            url: undefined,
            filename: undefined,
            error: null,
          };
          if (isMultiple) {
            return [...prev, baseEntry];
          }
          return [baseEntry];
        });

        try {
          const result = await uploadFile({ file });
          updateFilesState((prev) =>
            prev.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    uploading: false,
                    url: result.url,
                    name:
                      result.originalName ??
                      result.filename ??
                      extractFileNameFromUrl(result.url) ??
                      entry.name,
                    filename: result.filename ?? extractFileNameFromUrl(result.url),
                    error: null,
                  }
                : entry
            )
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Échec du téléversement du fichier.";
          updateFilesState((prev) =>
            prev.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    uploading: false,
                    error: message,
                  }
                : entry
            )
          );
        }
      })
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files);
    }
  };

  const removeFile = async (id: string) => {
    resetError();
    setComponentError(null);

    const target = uploadedFiles.find((file) => file.id === id);
    if (!target) return;

    if (target.url && hasDeleteSupport) {
      try {
        await deleteFile({
          filename: target.filename ?? extractFileNameFromUrl(target.url ?? ""),
          fileUrl: target.url,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Échec de la suppression du fichier distant.";
        updateFilesState((prev) =>
          prev.map((entry) =>
            entry.id === id ? { ...entry, error: message } : entry
          )
        );
        return;
      }
    }

    updateFilesState((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div
        className={classNames(
          "relative border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
          dragActive
            ? "border-teal-500 bg-teal-50 scale-[1.02]"
            : "border-gray-300 hover:border-teal-400 hover:bg-gray-50",
          className,
          isUploading && "pointer-events-none opacity-60"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          multiple={isMultiple}
          ref={fileInputRef}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div
              className={classNames(
                "p-3 rounded-full transition",
                dragActive
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-teal-600 hover:bg-teal-100"
              )}
            >
              <UploadCloud size={24} />
            </div>

          <div>
            <p className="text-base font-medium text-gray-700 mb-1">
              {dragActive
                ? "Déposez vos fichiers ici"
                : "Glissez-déposez vos fichiers"}
            </p>
            <p className="text-sm text-gray-500">
              ou{" "}
              <span className="text-teal-600 font-medium hover:underline">
                cliquez pour parcourir
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Formats variés supportés. Chaque fichier est envoyé dès sa sélection.
            </p>
          </div>
        </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Fichier(s) ({uploadedFiles.length}) :
          </div>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className={classNames(
                "flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow",
                file.error && "border-red-300"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="text-lg">{getFileIcon(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {file.size ? formatFileSize(file.size) : "En ligne"}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.url && !file.uploading && (
                  <button
                    type="button"
                    onClick={() => window.open(file.url, "_blank")}
                    className="p-2 hover:bg-teal-50 rounded-full transition-colors"
                  >
                    <ExternalLink size={18} className="text-teal-600" />
                  </button>
                )}
                {file.uploading && (
                  <Loader2 size={18} className="animate-spin text-teal-600" />
                )}
                <button
                  type="button"
                  onClick={() => void removeFile(file.id)}
                  className="p-2 hover:bg-red-100 rounded-full disabled:opacity-60"
                  disabled={file.uploading || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 size={18} className="animate-spin text-red-500" />
                  ) : (
                    <Trash2 size={18} className="text-red-500" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {effectiveError && (
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {effectiveError}
        </div>
      )}
    </FormFieldWrapper>
  );
};

export default FileFormField;


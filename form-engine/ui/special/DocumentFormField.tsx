import React, { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  UploadCloud,
  FileText,
  Loader2,
  ExternalLink,
  Trash2,
} from "lucide-react";
import classNames from "classnames";

import { FormFieldWrapper } from "../../FormFieldWrapper";
import { SpecialField, type FormField } from "../../types/formTypeStructure";
import { useFileBucketManager } from "../../hooks/useFileBucketManager";
import { extractFileNameFromUrl } from "../../utils/fileName";

interface DocumentFormField extends FormField {
  fieldType: SpecialField.DOCUMENT;
}

interface DocumentFormFieldProps {
  field: DocumentFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

interface UploadedDocumentInfo {
  url: string;
  name: string;
  size?: number;
  type?: string;
  bucketFilename?: string;
}

const DocumentFormField: React.FC<DocumentFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
  defaultValue,
}) => {
  const { setValue } = useFormContext();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedDocument, setUploadedDocument] =
    useState<UploadedDocumentInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fieldName = name ?? field.fieldName.toString();
  const didInitRef = useRef(false);
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

  const effectiveError = errorMessage ?? bucketError ?? null;

  useEffect(() => {
    if (typeof defaultValue === "string" && defaultValue.trim().length > 0) {
      setUploadedDocument({
        url: defaultValue,
        name: extractFileNameFromUrl(defaultValue) ?? defaultValue,
        bucketFilename: extractFileNameFromUrl(defaultValue) ?? undefined,
      });
      if (!didInitRef.current) {
        setValue(fieldName, defaultValue, {
          shouldValidate: false,
          shouldTouch: false,
        });
        didInitRef.current = true;
      }
    }
  }, [defaultValue, fieldName, setValue]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "ppt":
      case "pptx":
        return "📊";
      default:
        return "📄";
    }
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
      void handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!hasUploadSupport) {
      setErrorMessage(
        "Configuration d'upload manquante pour ce champ (fileToBucketManage)."
      );
      return;
    }

    resetError();
    setErrorMessage(null);

    try {
      const result = await uploadFile({ file });
      setUploadedDocument({
        url: result.url,
        name:
          result.originalName ??
          result.filename ??
          extractFileNameFromUrl(result.url) ??
          file.name,
        size: file.size,
        type: file.type,
        bucketFilename: result.filename ?? extractFileNameFromUrl(result.url),
      });
      setValue(fieldName, result.url, {
        shouldValidate: true,
        shouldTouch: true,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Échec de l'upload du document.";
      setErrorMessage(message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFile(e.target.files[0]);
    }
  };

  const removeDocument = async () => {
    resetError();
    setErrorMessage(null);

    if (uploadedDocument && hasDeleteSupport) {
      try {
        await deleteFile({
          filename:
            uploadedDocument.bucketFilename ??
            extractFileNameFromUrl(uploadedDocument.url ?? "") ??
            undefined,
          fileUrl: uploadedDocument.url,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Échec de la suppression du fichier distant.";
        setErrorMessage(message);
        return;
      }
    }

    setUploadedDocument(null);
    setValue(fieldName, null, {
      shouldValidate: true,
      shouldTouch: true,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div className="space-y-4">
        {/* Zone de drop */}
        {!uploadedDocument && (
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
              accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.pdf"
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
                      ? "Déposez votre document ici"
                      : "Glissez-déposez votre document"}
                  </p>
                  <p className="text-sm text-gray-500">
                    ou{" "}
                    <span className="text-teal-600 font-medium hover:underline">
                      cliquez pour parcourir
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Formats acceptés : Word, Excel, PowerPoint, TXT, PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Affichage du document sélectionné */}
        {uploadedDocument && (
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {getFileIcon(uploadedDocument.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {uploadedDocument.name}
                </p>
                {uploadedDocument.size && (
                  <p className="text-sm text-gray-500">
                    {formatFileSize(uploadedDocument.size)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.open(uploadedDocument.url, "_blank")}
                className="p-2 hover:bg-teal-50 rounded-full transition-colors"
              >
                <ExternalLink size={18} className="text-teal-600" />
              </button>
              <button
                type="button"
                onClick={() => void removeDocument()}
                className="p-2 hover:bg-red-100 rounded-full transition-colors disabled:opacity-60"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin text-red-500" />
                ) : (
                  <Trash2 size={18} className="text-red-500" />
                )}
              </button>
            </div>
          </div>
        )}

        {effectiveError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {effectiveError}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
};

export default DocumentFormField;


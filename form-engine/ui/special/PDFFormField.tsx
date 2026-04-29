import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { UploadCloud, FileText, Eye, Loader2, Trash2 } from "lucide-react";
import classNames from "classnames";

import { FormFieldWrapper } from "../../FormFieldWrapper";
import { SpecialField, type FormField } from "../../types/formTypeStructure";
import { useFileBucketManager } from "../../hooks/useFileBucketManager";
import { extractFileNameFromUrl } from "../../utils/fileName";

interface PDFFormField extends FormField {
  fieldType: SpecialField.PDF;
}

interface PDFFormFieldProps {
  field: PDFFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

interface UploadedPDFInfo {
  url: string;
  name: string;
  size?: number;
  bucketFilename?: string;
}

const PDFFormField: React.FC<PDFFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
  defaultValue,
}) => {
  const { setValue } = useFormContext();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedPDF, setUploadedPDF] = useState<UploadedPDFInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fieldName = name ?? field.fieldName.toString();
  const didInitRef = useRef(false);
  const previousPreviewRef = useRef<string | null>(null);
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

  const clearPreview = useCallback(() => {
    if (
      previousPreviewRef.current &&
      previousPreviewRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(previousPreviewRef.current);
    }
    previousPreviewRef.current = null;
    setPreviewUrl(null);
    setPreviewStatus("idle");
    setPreviewMessage(null);
  }, []);

  const setPreviewFromBlob = useCallback(
    (blob: Blob) => {
      clearPreview();
      const objectUrl = URL.createObjectURL(blob);
      previousPreviewRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      setPreviewStatus("ready");
      setPreviewMessage(null);
    },
    [clearPreview]
  );

  const loadPreviewFromRemote = useCallback(
    async (url: string) => {
      if (!url) {
        clearPreview();
        return;
      }
      setPreviewStatus("loading");
      setPreviewMessage(null);
      try {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const blob = await response.blob();
        const contentTypeHeader =
          response.headers.get("Content-Type")?.toLowerCase() ?? "";
        const blobType = blob.type?.toLowerCase() ?? "";
        const fileName =
          extractFileNameFromUrl(url)?.toLowerCase() ??
          url.split("?")[0].toLowerCase();

        const isProbablyPdf =
          contentTypeHeader.includes("pdf") ||
          blobType.includes("pdf") ||
          fileName.endsWith(".pdf");

        if (!isProbablyPdf) {
          throw new Error("Le fichier distant n'est pas un PDF.");
        }

        const normalizedBlob = blobType.includes("pdf")
          ? blob
          : new Blob([blob], { type: "application/pdf" });

        setPreviewFromBlob(normalizedBlob);
      } catch (error) {
        clearPreview();
        setPreviewStatus("error");
        setPreviewMessage(
          "Prévisualisation impossible. Utilisez le bouton « Ouvrir » pour consulter le PDF."
        );
        console.warn("[PDFFormField] Preview fetch failed:", error);
      }
    },
    [clearPreview, setPreviewFromBlob]
  );

  useEffect(() => {
    if (typeof defaultValue === "string" && defaultValue.trim().length > 0) {
      setUploadedPDF({
        url: defaultValue,
        name: extractFileNameFromUrl(defaultValue) ?? defaultValue,
        bucketFilename: extractFileNameFromUrl(defaultValue) ?? undefined,
      });
      setPreviewStatus("loading");
      setPreviewMessage(null);
      void loadPreviewFromRemote(defaultValue);
      if (!didInitRef.current) {
        setValue(fieldName, defaultValue, {
          shouldValidate: false,
          shouldTouch: false,
        });
        didInitRef.current = true;
      }
    } else {
      clearPreview();
      setUploadedPDF(null);
    }
  }, [defaultValue, fieldName, loadPreviewFromRemote, setValue, clearPreview]);

  useEffect(() => {
    return () => {
      if (previousPreviewRef.current && previousPreviewRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previousPreviewRef.current);
      }
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
    // Vérifier que c'est bien un PDF
    if (file.type !== "application/pdf") {
      alert("Veuillez sélectionner un fichier PDF valide");
      return;
    }

    if (!hasUploadSupport) {
      setErrorMessage(
        "Configuration d'upload manquante pour ce champ (fileToBucketManage)."
      );
      return;
    }

    resetError();
    setErrorMessage(null);

    setPreviewFromBlob(file);
    setPreviewStatus("ready");
    setPreviewMessage(null);

    try {
      const result = await uploadFile({ file });
      setUploadedPDF({
        url: result.url,
        name:
          result.originalName ??
          result.filename ??
          extractFileNameFromUrl(result.url) ??
          file.name,
        size: file.size,
        bucketFilename: result.filename ?? extractFileNameFromUrl(result.url),
      });
      setValue(fieldName, result.url, {
        shouldValidate: true,
        shouldTouch: true,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Échec de l'upload du PDF.";
      setErrorMessage(message);
      clearPreview();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFile(e.target.files[0]);
    }
  };

  const removePDF = async () => {
    resetError();
    setErrorMessage(null);

    if (uploadedPDF && hasDeleteSupport) {
      try {
        await deleteFile({
          filename:
            uploadedPDF.bucketFilename ??
            extractFileNameFromUrl(uploadedPDF.url ?? "") ??
            undefined,
          fileUrl: uploadedPDF.url,
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

    setUploadedPDF(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    previousPreviewRef.current = null;
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
        {!uploadedPDF && !previewUrl && (
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
              accept="application/pdf"
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
                  <FileText size={24} />
                </div>

                <div>
                  <p className="text-base font-medium text-gray-700 mb-1">
                    {dragActive
                      ? "Déposez votre PDF ici"
                      : "Glissez-déposez votre PDF"}
                  </p>
                  <p className="text-sm text-gray-500">
                    ou{" "}
                    <span className="text-teal-600 font-medium hover:underline">
                      cliquez pour parcourir
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Format accepté : PDF uniquement
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview du PDF */}
        {(uploadedPDF ||
          previewUrl ||
          previewStatus === "loading" ||
          previewStatus === "error") && (
          <div className="space-y-3">
            {/* Boutons d'action */}
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <FileText size={20} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {uploadedPDF?.name}
                  </p>
                  {(uploadedPDF?.size ?? previewUrl) && (
                    <p className="text-sm text-gray-500">
                      {uploadedPDF?.size
                        ? formatFileSize(uploadedPDF.size)
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                {uploadedPDF && (
                  <button
                    type="button"
                    onClick={() => window.open(uploadedPDF.url, "_blank")}
                    className="p-2 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <Eye size={20} className="text-teal-600" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void removePDF()}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
                  title="Supprimer"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 size={20} className="animate-spin text-red-500" />
                  ) : (
                    <Trash2 size={20} className="text-red-500" />
                  )}
                </button>
              </div>
            </div>

            {previewStatus === "loading" ? (
              <div className="border border-dashed border-gray-200 rounded-lg bg-white p-6 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
                <Loader2 size={24} className="animate-spin text-teal-600" />
                <span>Génération de l'aperçu en cours…</span>
              </div>
            ) : previewUrl ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <iframe
                  src={previewUrl}
                  className="w-full h-96"
                  title="Aperçu PDF"
                />
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-lg bg-white p-6 text-center text-sm text-gray-500">
                {previewMessage ??
                  "Aperçu indisponible. Utilisez le bouton « Ouvrir » pour consulter le PDF."}
              </div>
            )}
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

export default PDFFormField;

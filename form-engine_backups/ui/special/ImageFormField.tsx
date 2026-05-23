import React, { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { UploadCloud, Eye, Loader2, Trash2 } from "lucide-react";
import classNames from "classnames";

import { FormFieldWrapper } from "../../FormFieldWrapper";
import { SpecialField, type FormField } from "../../types/formTypeStructure";
import { useFileBucketManager } from "../../hooks/useFileBucketManager";
import { extractFileNameFromUrl } from "../../utils/fileName";

interface ImageFormField extends FormField {
  fieldType: SpecialField.IMAGE;
}

interface ImageFormFieldProps {
  field: ImageFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

interface UploadedImageInfo {
  url: string;
  name: string;
  size?: number;
  type?: string;
  bucketFilename?: string;
}

const ImageFormField: React.FC<ImageFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
  defaultValue,
}) => {
  const { setValue } = useFormContext();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadedImageInfo | null>(
    null
  );
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
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
      setUploadedImage({
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
    // Vérifier que c'est bien une image
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide");
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

    const localUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(localUrl);

    try {
      const result = await uploadFile({ file });
      setUploadedImage({
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
        err instanceof Error ? err.message : "Échec de l'upload de l'image.";
      setErrorMessage(message);
    } finally {
      URL.revokeObjectURL(localUrl);
      setLocalPreviewUrl(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFile(e.target.files[0]);
    }
  };

  const removeImage = async () => {
    resetError();
    setErrorMessage(null);

    if (uploadedImage && hasDeleteSupport) {
      try {
        await deleteFile({
          filename:
            uploadedImage.bucketFilename ??
            extractFileNameFromUrl(uploadedImage.url ?? "") ??
            undefined,
          fileUrl: uploadedImage.url,
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

    setUploadedImage(null);
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
        {!uploadedImage && !localPreviewUrl && (
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
              accept="image/*"
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
                      ? "Déposez votre image ici"
                      : "Glissez-déposez votre image"}
                  </p>
                  <p className="text-sm text-gray-500">
                    ou{" "}
                    <span className="text-teal-600 font-medium hover:underline">
                      cliquez pour parcourir
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Formats acceptés : JPG, PNG, GIF, WEBP
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview de l'image */}
        {(uploadedImage || localPreviewUrl) && (
          <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <div className="relative group">
              <img
                src={localPreviewUrl ?? uploadedImage?.url ?? ""}
                alt="Aperçu"
                className="w-full h-auto max-h-96 object-contain"
              />

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  {uploadedImage && (
                    <button
                      type="button"
                      onClick={() => window.open(uploadedImage.url, "_blank")}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Eye size={20} className="text-teal-600" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeImage()}
                    className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors disabled:opacity-60"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 size={20} className="animate-spin text-red-600" />
                    ) : (
                      <Trash2 size={20} className="text-red-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {uploadedImage?.name}
                  </p>
                  {(uploadedImage?.size ?? localPreviewUrl) && (
                    <p className="text-sm text-gray-500">
                      {uploadedImage?.size
                        ? formatFileSize(uploadedImage.size)
                        : ""}
                    </p>
                  )}
                </div>
                {isUploading && (
                  <Loader2 size={20} className="animate-spin text-teal-600" />
                )}
              </div>
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

export default ImageFormField;

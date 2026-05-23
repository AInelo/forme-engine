import React, { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { UploadCloud, Music, Play, Pause, Loader2, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

import { FormFieldWrapper } from "../../FormFieldWrapper";
import { SpecialField, type FormField } from "../../types/formTypeStructure";
import { useFileBucketManager } from "../../hooks/useFileBucketManager";
import { extractFileNameFromUrl } from "../../utils/fileName";

interface AudioFormField extends FormField {
  fieldType: SpecialField.AUDIO;
}

interface AudioFormFieldProps {
  field: AudioFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

interface UploadedAudioInfo {
  url: string;
  name: string;
  size?: number;
  type?: string;
  bucketFilename?: string;
}

const AudioFormField: React.FC<AudioFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
  defaultValue,
}) => {
  const { setValue } = useFormContext();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedAudio, setUploadedAudio] = useState<UploadedAudioInfo | null>(
    null
  );
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
      setUploadedAudio({
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
    if (!file.type.startsWith("audio/")) {
      alert("Veuillez sélectionner un fichier audio valide");
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
      setUploadedAudio({
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
        err instanceof Error ? err.message : "Échec de l'upload du fichier audio.";
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

  const removeAudio = async () => {
    resetError();
    setErrorMessage(null);

    if (uploadedAudio && hasDeleteSupport) {
      try {
        await deleteFile({
          filename:
            uploadedAudio.bucketFilename ??
            extractFileNameFromUrl(uploadedAudio.url ?? "") ??
            undefined,
          fileUrl: uploadedAudio.url,
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

    setUploadedAudio(null);
    setLocalPreviewUrl(null);
    setIsPlaying(false);
    setValue(fieldName, null, {
      shouldValidate: true,
      shouldTouch: true,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div className="space-y-4">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
            dragActive
              ? "border-teal-500 bg-teal-50 scale-[1.02]"
              : "border-gray-300 hover:border-teal-400 hover:bg-gray-50",
            (uploadedAudio || localPreviewUrl) && "hidden",
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
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div
                className={cn(
                  "p-3 rounded-full transition",
                  dragActive
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-teal-600 hover:bg-teal-100"
                )}
              >
                <Music size={24} />
              </div>

              <div>
                <p className="text-base font-medium text-gray-700 mb-1">
                  {dragActive
                    ? "Déposez votre audio ici"
                    : "Glissez-déposez votre audio"}
                </p>
                <p className="text-sm text-gray-500">
                  ou{" "}
                  <span className="text-teal-600 font-medium hover:underline">
                    cliquez pour parcourir
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Formats acceptés : MP3, WAV, OGG, etc.
                </p>
              </div>
            </div>
          </div>
        </div>

        {(uploadedAudio || localPreviewUrl) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Music size={20} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {uploadedAudio?.name}
                  </p>
                  {uploadedAudio?.size && (
                    <p className="text-sm text-gray-500">
                      {formatFileSize(uploadedAudio.size)}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void removeAudio()}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={20} className="animate-spin text-red-500" />
                ) : (
                  <Trash2 size={20} className="text-red-500" />
                )}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div className="flex items-center space-x-3 p-4 bg-white">
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-60"
                  disabled={!(uploadedAudio || localPreviewUrl)}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <div className="flex-1">
                  <audio
                    ref={audioRef}
                    src={localPreviewUrl ?? uploadedAudio?.url ?? undefined}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
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

export default AudioFormField;


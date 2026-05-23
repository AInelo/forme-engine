import React, { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Mic, MicOff, Play, Pause, Loader2, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

import { FormFieldWrapper } from "../../FormFieldWrapper";
import type { FormField } from "../../types/formTypeStructure";
import { SpecialField } from "../../types/formTypeStructure";
import { useFileBucketManager } from "../../hooks/useFileBucketManager";
import { extractFileNameFromUrl } from "../../utils/fileName";

interface VoiceFormField extends FormField {
  fieldType: SpecialField.VOICE;
}

interface VoiceFormFieldProps {
  field: VoiceFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

interface UploadedVoiceInfo {
  url: string;
  filename?: string;
}

const VoiceFormField: React.FC<VoiceFormFieldProps> = ({
  field,
  name,
  currentLang = "fr",
  className,
  defaultValue,
}) => {
  const { setValue } = useFormContext();
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [remoteInfo, setRemoteInfo] = useState<UploadedVoiceInfo | null>(null);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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
      setAudioUrl(defaultValue);
      setRemoteInfo({
        url: defaultValue,
        filename: extractFileNameFromUrl(defaultValue),
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

  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      console.error(
        "L'API mediaDevices.getUserMedia n'est pas disponible dans ce contexte."
      );
      alert(
        "L'enregistrement audio n'est pas pris en charge par votre navigateur ou ce contexte (HTTPS requis)."
      );
      return;
    }

    resetError();
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (!hasUploadSupport) {
          setErrorMessage(
            "Configuration d'upload manquante pour ce champ (fileToBucketManage)."
          );
          stream.getTracks().forEach((track) => track.stop());
          stopTimer();
          return;
        }

        const localUrl = URL.createObjectURL(blob);
        setAudioUrl(localUrl);
        setRemoteInfo(null);

        try {
          const result = await uploadFile({
            file: blob,
            fallbackFilename: `voice-${Date.now()}.webm`,
          });
          setAudioUrl(result.url);
          setRemoteInfo({
            url: result.url,
            filename: result.filename ?? extractFileNameFromUrl(result.url),
          });
          setValue(fieldName, result.url, {
            shouldValidate: true,
            shouldTouch: true,
          });
          URL.revokeObjectURL(localUrl);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Échec du téléversement de l'enregistrement.";
          setErrorMessage(message);
        }

        stream.getTracks().forEach((track) => track.stop());
        stopTimer();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Erreur d'accès au microphone:", error);
      alert("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const removeRecording = async () => {
    resetError();
    setErrorMessage(null);

    if (remoteInfo && hasDeleteSupport) {
      try {
        await deleteFile({
          filename:
            remoteInfo.filename ?? extractFileNameFromUrl(remoteInfo.url ?? ""),
          fileUrl: remoteInfo.url,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Échec de la suppression de l'enregistrement distant.";
        setErrorMessage(message);
        return;
      }
    }

    if (audioUrl && audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setRemoteInfo(null);
    setDuration(0);
    setValue(fieldName, null, {
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div className="space-y-4">
        {!audioUrl && (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
              isRecording
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-teal-400 hover:bg-gray-50",
              className
            )}
          >
            <div className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "p-4 rounded-full transition-all duration-300",
                    isRecording
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  )}
                  disabled={isUploading}
                >
                  {isRecording ? <Mic size={32} /> : <MicOff size={32} />}
                </button>

                <div>
                  <p className="text-base font-medium text-gray-700 mb-1">
                    {isRecording
                      ? "Enregistrement en cours..."
                      : "Enregistrer un message vocal"}
                  </p>
                  {isRecording && (
                    <p className="text-lg font-bold text-red-600">
                      {formatDuration(duration)}
                    </p>
                  )}
                  {!isRecording && (
                    <p className="text-sm text-gray-500">
                      Cliquez sur le bouton pour commencer
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {audioUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-60"
                  disabled={!audioUrl}
                >
                  <Play size={20} />
                </button>
                <audio
                  ref={audioRef}
                  src={audioUrl ?? undefined}
                  onTimeUpdate={(e) => {
                    const audio = e.currentTarget;
                    if (audio.duration) {
                      setDuration(audio.currentTime);
                    }
                  }}
                />
                <span className="text-sm text-gray-700 font-medium">
                  {formatDuration(duration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isUploading && (
                  <Loader2 size={18} className="animate-spin text-teal-600" />
                )}
                <button
                  type="button"
                  onClick={() => void removeRecording()}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
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

export default VoiceFormField;


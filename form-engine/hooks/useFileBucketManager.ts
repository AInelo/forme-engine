import { useCallback, useMemo, useState } from "react";
import type {
  DeleteOption,
  FileToBucketManage,
  UploadOption,
} from "../types/formTypeStructure";
import { extractFileNameFromUrl } from "../utils/fileName";

type NormalizedPayload = Record<string, unknown>;

export interface UploadFileParams {
  file: File | Blob;
  /**
   * Payload à fusionner avec la configuration statique avant l'appel API.
   * Permet d'injecter dynamiquement des informations comme le filename.
   */
  payloadOverrides?: Record<string, unknown>;
  /**
   * Nom de fichier à utiliser si l'on convertit un Blob en File.
   * Ignoré si `file` est déjà une instance de File.
   */
  fallbackFilename?: string;
}

export interface UploadSuccess {
  url: string;
  filename?: string;
  originalName?: string;
  folder?: string;
  raw: any;
}

export interface DeleteFileParams {
  filename?: string;
  fileUrl?: string;
  payloadOverrides?: Record<string, unknown>;
}

export interface DeleteSuccess {
  success: boolean;
  raw: any;
}

const isMap = (
  payload?: Map<string, unknown> | Record<string, unknown>
): payload is Map<string, unknown> => payload instanceof Map;

const normalizePayload = (
  payload?: Map<string, unknown> | Record<string, unknown>
): NormalizedPayload => {
  if (!payload) {
    return {};
  }
  if (isMap(payload)) {
    return Object.fromEntries(payload.entries());
  }
  return { ...payload };
};

const buildAbsoluteUrl = (serverDns: string, endpoint: string): string => {
  const base = serverDns.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const path = endpoint.replace(/^\/+/, "");
  return `${base}/${path}`;
};

const appendFormDataValue = (
  formData: FormData,
  key: string,
  value: unknown
) => {
  if (value === undefined || value === null) {
    return;
  }

  if (value instanceof File || value instanceof Blob) {
    formData.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => appendFormDataValue(formData, key, entry));
    return;
  }

  if (typeof value === "object") {
    formData.append(key, JSON.stringify(value));
    return;
  }

  formData.append(key, String(value));
};

const pickFilename = (
  data: Record<string, any>,
  fallbackUrl?: string,
  fallbackFile?: File
): string | undefined => {
  const candidates = [
    data?.filename,
    data?.fileName,
    data?.generatedFilename,
    data?.generatedFileName,
    data?.generated_filename,
    data?.storedFilename,
    data?.storedFileName,
    data?.name,
  ].filter((value) => typeof value === "string" && value.trim().length > 0) as string[];

  if (candidates.length > 0) {
    return candidates[0];
  }

  const derivedFromUrl = extractFileNameFromUrl(fallbackUrl);
  if (derivedFromUrl) {
    return derivedFromUrl;
  }

  return fallbackFile?.name;
};

const prepareFileInstance = (
  file: File | Blob,
  fallbackFilename?: string
): File => {
  if (file instanceof File) {
    return file;
  }
  const name =
    fallbackFilename ?? `upload-${Date.now()}.${(file.type || "bin").split("/").pop() ?? "bin"}`;
  return new File([file], name, { type: file.type || "application/octet-stream" });
};

const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs?: number,
  controller?: AbortController
): Promise<T> => {
  if (!timeoutMs || timeoutMs <= 0 || !controller) {
    return promise;
  }

  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return promise.finally(() => {
    clearTimeout(timeout);
  });
};

const callUploadEndpoint = async (
  option: UploadOption,
  params: UploadFileParams
): Promise<UploadSuccess> => {
  const controller = new AbortController();
  const url = buildAbsoluteUrl(option.serverDns, option.postApiEndPoint);
  const basePayload = normalizePayload(option.payload);
  const mergedPayload: NormalizedPayload = {
    ...basePayload,
    ...(params.payloadOverrides ?? {}),
  };

  const fileToSend = prepareFileInstance(params.file, params.fallbackFilename);
  const formData = new FormData();

  Object.entries(mergedPayload).forEach(([key, value]) => {
    if (key === "file") {
      return;
    }
    appendFormDataValue(formData, key, value);
  });

  formData.append("file", fileToSend);

  const headers: Record<string, string> = {
    ...(option.extraHeaders ?? {}),
  };

  if (option.bearer) {
    headers.Authorization = `Bearer ${option.bearer}`;
  }

  const fetchPromise = fetch(url, {
    method: "POST",
    headers,
    body: formData,
    signal: controller.signal,
  });

  const response = await withTimeout(
    fetchPromise,
    option.timeoutMs,
    controller
  );

  if (option.onResponse) {
    try {
      await option.onResponse(response.clone());
    } catch (err) {
      console.warn("[FileBucketUpload] onResponse hook error:", err);
    }
  }

  let payload: any = null;
  try {
    payload = await response.clone().json();
  } catch {
    // ignore JSON parse error, will be handled below
  }

  if (!response.ok) {
    const message =
      payload?.message ??
      `Upload failed with status ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  if (payload?.success === false) {
    throw new Error(payload?.message ?? "Upload failed");
  }

  const data = payload?.data ?? {};
  const fileUrl =
    data.url ?? data.file_url ?? data.downloadUrl ?? data.path ?? null;

  if (!fileUrl) {
    throw new Error(
      "Upload succeeded but no URL was returned by the API response."
    );
  }

  return {
    url: fileUrl,
    filename: pickFilename(data, fileUrl, fileToSend),
    originalName: data.originalname ?? data.originalName ?? undefined,
    folder: data.folder ?? data.folder_name ?? undefined,
    raw: payload,
  };
};

const callDeleteEndpoint = async (
  option: DeleteOption,
  params?: DeleteFileParams
): Promise<DeleteSuccess> => {
  const controller = new AbortController();
  const url = buildAbsoluteUrl(option.serverDns, option.deleteApiEndPoint);

  const basePayload = normalizePayload(option.payload);
  const overridePayload = normalizePayload(params?.payloadOverrides);

  if (params?.filename) {
    overridePayload.filename = params.filename;
  }

  if (params?.fileUrl) {
    overridePayload.file_url = params.fileUrl;
  }

  const mergedPayload: NormalizedPayload = {
    ...basePayload,
    ...overridePayload,
  };

  const isDeleteByUrl = option.deleteApiEndPoint.includes("delete-file-by-url");
  const isDeleteByFilename = option.deleteApiEndPoint.includes("delete-file") && !isDeleteByUrl;

  if (
    isDeleteByFilename &&
    !mergedPayload.filename &&
    typeof mergedPayload.file_url === "string"
  ) {
    const inferred = extractFileNameFromUrl(mergedPayload.file_url);
    if (inferred) {
      mergedPayload.filename = inferred;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(option.extraHeaders ?? {}),
  };

  if (option.bearer) {
    headers.Authorization = `Bearer ${option.bearer}`;
  }

  const fetchPromise = fetch(url, {
    method: "DELETE",
    headers,
    body: JSON.stringify(mergedPayload),
    signal: controller.signal,
  });

  const response = await withTimeout(
    fetchPromise,
    option.timeoutMs,
    controller
  );

  if (option.onResponse) {
    try {
      await option.onResponse(response.clone());
    } catch (err) {
      console.warn("[FileBucketDelete] onResponse hook error:", err);
    }
  }

  let payload: any = null;
  try {
    payload = await response.clone().json();
  } catch {
    // ignore JSON parse error, will be handled below
  }

  if (!response.ok) {
    const message =
      payload?.message ??
      `Delete failed with status ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  if (payload?.success === false) {
    throw new Error(payload?.message ?? "Delete failed");
  }

  return {
    success: true,
    raw: payload,
  };
};

export const useFileBucketManager = (config?: FileToBucketManage) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadOption = config?.uploadOption;
  const deleteOption = config?.deleteOption;

  const uploadFile = useCallback(
    async (params: UploadFileParams): Promise<UploadSuccess> => {
      if (!uploadOption) {
        throw new Error(
          "Upload option is not configured for this field (fileToBucketManage.uploadOption missing)."
        );
      }
      setIsUploading(true);
      setError(null);
      try {
        return await callUploadEndpoint(uploadOption, params);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected upload error";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadOption]
  );

  const deleteFile = useCallback(
    async (params?: DeleteFileParams): Promise<DeleteSuccess> => {
      if (!deleteOption) {
        throw new Error(
          "Delete option is not configured for this field (fileToBucketManage.deleteOption missing)."
        );
      }
      setIsDeleting(true);
      setError(null);
      try {
        return await callDeleteEndpoint(deleteOption, params);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected delete error";
        setError(message);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteOption]
  );

  const resetError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      uploadFile,
      deleteFile,
      isUploading,
      isDeleting,
      error,
      resetError,
      hasUploadSupport: Boolean(uploadOption),
      hasDeleteSupport: Boolean(deleteOption),
    }),
    [
      uploadFile,
      deleteFile,
      isUploading,
      isDeleting,
      error,
      resetError,
      uploadOption,
      deleteOption,
    ]
  );
};

export type FileBucketManagerHook = ReturnType<typeof useFileBucketManager>;


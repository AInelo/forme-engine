export const extractFileNameFromUrl = (
  value?: string | null
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const decodeSafe = (input: string): string => {
    try {
      return decodeURIComponent(input);
    } catch {
      return input;
    }
  };

  const extractFromPath = (input: string): string | undefined => {
    const sanitized = input.split("?")[0];
    const segments = sanitized.split(/[\\/]/).filter(Boolean);
    if (segments.length === 0) {
      return sanitized ? decodeSafe(sanitized) : undefined;
    }
    return decodeSafe(segments[segments.length - 1]);
  };

  try {
    const url = new URL(value);
    const candidateParamKeys = ["filename", "file", "file_name", "name"];

    for (const key of candidateParamKeys) {
      const paramValue = url.searchParams.get(key);
      if (paramValue) {
        const normalized = paramValue.split("/").filter(Boolean).pop() ?? paramValue;
        return decodeSafe(normalized);
      }
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      return decodeSafe(pathSegments[pathSegments.length - 1]);
    }
  } catch {
    // Not a valid URL, fall back to basic extraction below
  }

  return extractFromPath(value);
};



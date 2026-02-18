import { useEffect, useState, useCallback } from "react";
import { writePdfToCache, shareFile } from "@/utils/index";

export const usePdfShare = (
  base64: string | undefined,
  fileName: string | undefined
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fileUri, setFileUri] = useState<string | null>(null);

  useEffect(() => {
    if (!base64 || !fileName) return;
    setIsLoading(true);
    writePdfToCache(base64, fileName)
      .then(setFileUri)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [base64, fileName]);

  const handleShare = useCallback(async () => {
    if (fileUri && fileName) await shareFile(fileUri, fileName);
  }, [fileUri, fileName]);

  return { fileUri, handleShare, isLoading };
};

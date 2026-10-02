import { useState, useCallback } from 'preact/hooks';
import qrTool from '../tools/qr/index.js';

export function useQrReader() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reading, setReading] = useState(false);
  const [copied, setCopied] = useState(false);

  const read = useCallback(async (file) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      setResult(null);
      setError('Please select an image file.');
      return;
    }
    setReading(true);
    setResult(null);
    setError(null);
    setCopied(false);
    try {
      const imageData = await qrTool.fileToImageData(file);
      const decoded = qrTool.decode(imageData);
      if (!decoded) {
        setError('No QR code found in image.');
      } else {
        setResult(decoded);
      }
    } catch {
      setError('Could not read the image file.');
    } finally {
      setReading(false);
    }
  }, []);

  const copy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [result]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setReading(false);
    setCopied(false);
  }, []);

  return { result, error, reading, copied, read, copy, reset };
}

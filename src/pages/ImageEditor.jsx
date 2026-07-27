import { useState, useRef, useMemo, useCallback, useEffect } from 'preact/hooks';
import { ToolPage } from '../components/layout/ToolPage.jsx';
import { useWasmTool } from '../hooks/useWasmTool.js';
import './ImageEditor.css';

const toNum = (v) => (v === '' || v == null ? undefined : Number(v));
const extensionFor = (type) => (type.split('/')[1] || 'png').replace('jpeg', 'jpg');

export function ImageEditor() {
  const loader = useMemo(() => () => import('../tools/image/index.js'), []);
  const { ready, error, api } = useWasmTool(loader);

  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const urlRef = useRef(null);

  const [image, setImage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [version, setVersion] = useState(0);

  const [resizeW, setResizeW] = useState('');
  const [resizeH, setResizeH] = useState('');
  const [lockAspect, setLockAspect] = useState(true);

  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState('');
  const [cropH, setCropH] = useState('');

  const [textContent, setTextContent] = useState('');
  const [textSize, setTextSize] = useState(32);
  const [textColor, setTextColor] = useState('#000000');

  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [grayscale, setGrayscale] = useState(0);
  const [saturate, setSaturate] = useState(1);

  const [exportType, setExportType] = useState('image/png');
  const [quality, setQuality] = useState(0.9);

  const hasImage = !!image;
  const formats = (api && api.FORMATS) || [];

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    container.innerHTML = '';
    if (canvasRef.current) container.appendChild(canvasRef.current);
  }, [version, image, ready]);

  useEffect(() => {
    return () => {
      if (urlRef.current && api) api.revokeObjectURL(urlRef.current);
    };
  }, [api]);

  const renderPreview = useCallback(() => setVersion((v) => v + 1), []);

  const applyTransform = useCallback(
    (fn) => {
      if (!api || !canvasRef.current) return;
      canvasRef.current = fn(canvasRef.current);
      renderPreview();
    },
    [api, renderPreview],
  );

  const onFileSelect = useCallback(
    async (file) => {
      if (!api || !file) return;
      setLoadError(null);
      try {
        const result = await api.loadImage(file);
        if (urlRef.current) api.revokeObjectURL(urlRef.current);
        urlRef.current = result.url;
        const canvas = api.drawImageTo(
          api.createCanvas(result.width, result.height),
          result.image,
        );
        canvasRef.current = canvas;
        setImage(result);
        renderPreview();
      } catch (e) {
        setLoadError(`Failed to load image: ${e.message}`);
      }
    },
    [api, renderPreview],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const onDragOver = useCallback((e) => e.preventDefault(), []);

  const doFlip = useCallback((axis) => applyTransform((c) => api.flip(c, axis)), [api, applyTransform]);
  const doRotate = useCallback(
    (deg) => applyTransform((c) => api.rotate(c, deg)),
    [api, applyTransform],
  );
  const doResize = useCallback(() => {
    applyTransform((c) =>
      api.resize(c, { width: toNum(resizeW), height: toNum(resizeH), lock: lockAspect }),
    );
  }, [api, applyTransform, resizeW, resizeH, lockAspect]);
  const doCrop = useCallback(() => {
    applyTransform((c) =>
      api.crop(c, {
        x: Number(cropX) || 0,
        y: Number(cropY) || 0,
        width: toNum(cropW),
        height: toNum(cropH),
      }),
    );
  }, [api, applyTransform, cropX, cropY, cropW, cropH]);
  const doAddText = useCallback(() => {
    applyTransform((c) =>
      api.drawText(c, { text: textContent, size: Number(textSize), color: textColor }),
    );
  }, [api, applyTransform, textContent, textSize, textColor]);
  const doApplyFilters = useCallback(() => {
    applyTransform((c) =>
      api.applyFilters(c, { brightness, contrast, grayscale, saturate }),
    );
  }, [api, applyTransform, brightness, contrast, grayscale, saturate]);

  const doReset = useCallback(() => {
    if (!api || !image) return;
    canvasRef.current = api.drawImageTo(
      api.createCanvas(image.width, image.height),
      image.image,
    );
    renderPreview();
  }, [api, image, renderPreview]);

  const doDownload = useCallback(async () => {
    if (!api || !canvasRef.current) return;
    const opts =
      exportType === 'image/png' ? { type: exportType } : { type: exportType, quality: Number(quality) };
    const blob = await api.export(canvasRef.current, opts);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image.${extensionFor(exportType)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [api, exportType, quality]);

  return (
    <ToolPage
      title="Image Editor"
      description="Edit images in your browser — resize, flip, rotate, crop, add text, and apply filters."
      loading={!ready && !error}
      error={error}
    >
      {!hasImage && (
        <div class="upload-zone" onDragOver={onDragOver} onDrop={onDrop}>
          <label class="upload-button">
            Choose image
            <input
              type="file"
              accept="image/*"
              aria-label="Choose image"
              onChange={(e) => onFileSelect(e.target.files && e.target.files[0])}
            />
          </label>
          <p>or drag and drop</p>
        </div>
      )}

      {loadError && (
        <div class="image-error" role="alert">
          {loadError}
        </div>
      )}

      <div class="image-workspace">
        <div class="image-controls">
          <fieldset>
            <legend>Resize</legend>
            <label>
              Width
              <input
                type="number"
                aria-label="Resize width"
                value={resizeW}
                onInput={(e) => setResizeW(e.target.value)}
              />
            </label>
            <label>
              Height
              <input
                type="number"
                aria-label="Resize height"
                value={resizeH}
                onInput={(e) => setResizeH(e.target.value)}
              />
            </label>
            <label class="image-check">
              <input
                type="checkbox"
                aria-label="Lock aspect ratio"
                checked={lockAspect}
                onChange={(e) => setLockAspect(e.target.checked)}
              />
              Lock aspect ratio
            </label>
            <button type="button" disabled={!hasImage} onClick={doResize}>
              Resize
            </button>
          </fieldset>

          <fieldset>
            <legend>Flip</legend>
            <button type="button" disabled={!hasImage} onClick={() => doFlip('horizontal')}>
              Flip Horizontal
            </button>
            <button type="button" disabled={!hasImage} onClick={() => doFlip('vertical')}>
              Flip Vertical
            </button>
          </fieldset>

          <fieldset>
            <legend>Rotate</legend>
            <button type="button" disabled={!hasImage} onClick={() => doRotate(-90)}>
              Rotate Left
            </button>
            <button type="button" disabled={!hasImage} onClick={() => doRotate(90)}>
              Rotate Right
            </button>
          </fieldset>

          <fieldset>
            <legend>Crop</legend>
            <label>
              X
              <input
                type="number"
                aria-label="Crop X"
                value={cropX}
                onInput={(e) => setCropX(e.target.value)}
              />
            </label>
            <label>
              Y
              <input
                type="number"
                aria-label="Crop Y"
                value={cropY}
                onInput={(e) => setCropY(e.target.value)}
              />
            </label>
            <label>
              Width
              <input
                type="number"
                aria-label="Crop width"
                value={cropW}
                onInput={(e) => setCropW(e.target.value)}
              />
            </label>
            <label>
              Height
              <input
                type="number"
                aria-label="Crop height"
                value={cropH}
                onInput={(e) => setCropH(e.target.value)}
              />
            </label>
            <button type="button" disabled={!hasImage} onClick={doCrop}>
              Crop
            </button>
          </fieldset>

          <fieldset>
            <legend>Text</legend>
            <label>
              Text
              <input
                type="text"
                aria-label="Text content"
                placeholder="Watermark"
                value={textContent}
                onInput={(e) => setTextContent(e.target.value)}
              />
            </label>
            <label>
              Size
              <input
                type="number"
                aria-label="Text size"
                value={textSize}
                onInput={(e) => setTextSize(e.target.value)}
              />
            </label>
            <label>
              Color
              <input
                type="color"
                aria-label="Text color"
                value={textColor}
                onInput={(e) => setTextColor(e.target.value)}
              />
            </label>
            <button type="button" disabled={!hasImage} onClick={doAddText}>
              Add Text
            </button>
          </fieldset>

          <fieldset>
            <legend>Filters</legend>
            <label>
              Brightness
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                aria-label="Brightness"
                value={brightness}
                onInput={(e) => setBrightness(Number(e.target.value))}
              />
            </label>
            <label>
              Contrast
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                aria-label="Contrast"
                value={contrast}
                onInput={(e) => setContrast(Number(e.target.value))}
              />
            </label>
            <label>
              Grayscale
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                aria-label="Grayscale"
                value={grayscale}
                onInput={(e) => setGrayscale(Number(e.target.value))}
              />
            </label>
            <label>
              Saturate
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                aria-label="Saturate"
                value={saturate}
                onInput={(e) => setSaturate(Number(e.target.value))}
              />
            </label>
            <button type="button" disabled={!hasImage} onClick={doApplyFilters}>
              Apply Filters
            </button>
          </fieldset>

          <div class="image-controls-actions">
            <button type="button" class="image-reset" disabled={!hasImage} onClick={doReset}>
              Reset
            </button>
          </div>
        </div>

        <div class="image-preview-area">
          <div class="image-preview" ref={previewRef} />
          <div class="image-export">
            <label>
              Format
              <select
                aria-label="Export format"
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                {formats.map((f) => (
                  <option key={f} value={f}>
                    {f.replace('image/', '').toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            {exportType !== 'image/png' && (
              <label>
                Quality
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  aria-label="Quality"
                  value={quality}
                  onInput={(e) => setQuality(Number(e.target.value))}
                />
              </label>
            )}
            <button type="button" class="image-download" disabled={!hasImage} onClick={doDownload}>
              Download
            </button>
          </div>
        </div>
      </div>
    </ToolPage>
  );
}

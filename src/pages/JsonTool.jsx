import { useState, useCallback, useMemo } from 'preact/hooks';
import { ToolPage } from '../components/layout/ToolPage.jsx';
import { useWasmTool } from '../hooks/useWasmTool.js';
import './shared-tool.css';

export function JsonTool() {
  const loader = useMemo(() => () => import('../tools/json/index.js'), []);
  const { ready, error, api } = useWasmTool(loader);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const validate = useCallback(() => {
    if (!api) return;
    const result = api.validate(input);
    setValidationResult(result);
    if (result.valid) {
      setOutput(api.format(input));
    } else {
      setOutput('');
    }
  }, [api, input]);

  const minify = useCallback(() => {
    if (!api) return;
    try {
      setOutput(api.minify(input));
      setValidationResult({ valid: true, error: null });
    } catch (e) {
      setValidationResult({ valid: false, error: e.message });
    }
  }, [api, input]);

  const format = useCallback(() => {
    if (!api) return;
    try {
      setOutput(api.format(input));
      setValidationResult({ valid: true, error: null });
    } catch (e) {
      setValidationResult({ valid: false, error: e.message });
    }
  }, [api, input]);

  return (
    <ToolPage
      title="JSON Tool"
      description="Validate, format, minify, and query JSON data."
      loading={!ready && !error}
      error={error}
    >
      <label class="tool-label">
        Input
        <textarea
          class="tool-textarea"
          rows="10"
          placeholder='{"key": "value"}'
          value={input}
          onInput={(e) => setInput(e.target.value)}
        />
      </label>

      <div class="tool-actions">
        <button type="button" onClick={validate}>Validate &amp; Format</button>
        <button type="button" onClick={minify}>Minify</button>
        <button type="button" onClick={format}>Format</button>
      </div>

      {validationResult && (
        <div class={`validation-badge ${validationResult.valid ? 'valid' : 'invalid'}`}>
          {validationResult.valid ? 'Valid JSON' : `Invalid: ${validationResult.error}`}
        </div>
      )}

      {output && (
        <label class="tool-label">
          Output
          <textarea class="tool-textarea tool-output" rows="10" value={output} readOnly />
        </label>
      )}
    </ToolPage>
  );
}

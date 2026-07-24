import { useState, useCallback, useMemo } from 'preact/hooks';
import { ToolPage } from '../components/layout/ToolPage.jsx';
import { useWasmTool } from '../hooks/useWasmTool.js';
import './shared-tool.css';

export function XmlTool() {
  const loader = useMemo(() => () => import('../tools/xml/index.js'), []);
  const { ready, error, api } = useWasmTool(loader);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const validate = useCallback(() => {
    if (!api) return;
    const result = api.validate(input);
    setValidationResult(result);
    if (!result.valid) {
      setOutput('');
    }
  }, [api, input]);

  const format = useCallback(() => {
    if (!api) return;
    try {
      const formatted = api.format(input);
      setOutput(formatted);
      setValidationResult({ valid: true, error: null });
    } catch (e) {
      setValidationResult({ valid: false, error: e.message });
      setOutput('');
    }
  }, [api, input]);

  return (
    <ToolPage
      title="XML Tool"
      description="Validate and format XML documents."
      loading={!ready && !error}
      error={error}
    >
      <label class="tool-label">
        Input
        <textarea
          class="tool-textarea"
          rows="10"
          placeholder="<root><item>value</item></root>"
          value={input}
          onInput={(e) => setInput(e.target.value)}
        />
      </label>

      <div class="tool-actions">
        <button type="button" onClick={validate}>Validate</button>
        <button type="button" onClick={format}>Format</button>
      </div>

      {validationResult && (
        <div class={`validation-badge ${validationResult.valid ? 'valid' : 'invalid'}`}>
          {validationResult.valid ? 'Valid XML' : `Invalid: ${validationResult.error}`}
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

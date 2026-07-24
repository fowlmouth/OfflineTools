import { useState, useCallback, useMemo } from 'preact/hooks';
import { ToolPage } from '../components/layout/ToolPage.jsx';
import { useWasmTool } from '../hooks/useWasmTool.js';
import './shared-tool.css';

const FORMAT_LABELS = {
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  unknown: '—',
};

export function DataTool() {
  const loader = useMemo(() => () => import('../tools/data/index.js'), []);
  const { ready, error, api } = useWasmTool(loader);
  const [input, setInput] = useState('');
  const [queryExpr, setQueryExpr] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState(null);

  const detectedFormat = useMemo(() => {
    if (!api || !input.trim()) return 'unknown';
    return api.detect(input);
  }, [api, input]);

  const runQuery = useCallback(() => {
    if (!api || !queryExpr.trim()) return;
    try {
      const result = api.queryData(input, queryExpr.trim());
      setOutput(result);
      setStatus({ type: 'valid', message: `${FORMAT_LABELS[detectedFormat]} → query result` });
    } catch (e) {
      setOutput('');
      setStatus({ type: 'invalid', message: e.message });
    }
  }, [api, input, queryExpr, detectedFormat]);

  const format = useCallback(() => {
    if (!api) return;
    try {
      setOutput(api.format(input));
      setStatus({ type: 'valid', message: `Valid ${FORMAT_LABELS[detectedFormat]}` });
    } catch (e) {
      setOutput('');
      setStatus({ type: 'invalid', message: e.message });
    }
  }, [api, input, detectedFormat]);

  const convertToJSON = useCallback(() => {
    if (!api) return;
    try {
      setOutput(api.toJSON(input));
      setStatus({ type: 'valid', message: `Valid ${FORMAT_LABELS[detectedFormat]}` });
    } catch (e) {
      setOutput('');
      setStatus({ type: 'invalid', message: e.message });
    }
  }, [api, input, detectedFormat]);

  return (
    <ToolPage
      title="Data Explorer"
      description="Validate, convert, and query JSON, YAML, and XML data. Format is auto-detected."
      loading={!ready && !error}
      error={error}
    >
      <div class="data-input-row">
        <label class="tool-label data-input-label">
          Input
          <textarea
            class="tool-textarea data-textarea"
            rows="12"
            placeholder={'{"key": "value"}  /  key: value  /  <root>…</root>'}
            value={input}
            onInput={(e) => setInput(e.target.value)}
          />
        </label>
        <div class={`format-badge format-${detectedFormat}`}>
          {FORMAT_LABELS[detectedFormat]}
        </div>
      </div>

      <div class="query-row">
        <input
          type="text"
          class="query-input"
          placeholder=".field"
          value={queryExpr}
          onInput={(e) => setQueryExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runQuery();
          }}
        />
        <button type="button" class="query-run" onClick={runQuery}>Run Query</button>
      </div>

      <div class="tool-actions">
        <button type="button" onClick={format}>Format</button>
        <button type="button" onClick={convertToJSON}>Convert to JSON</button>
      </div>

      {status && (
        <div class={`validation-badge ${status.type === 'valid' ? 'valid' : 'invalid'}`}>
          {status.type === 'valid' ? status.message : `Invalid: ${status.message}`}
        </div>
      )}

      {output && (
        <label class="tool-label">
          Output
          <textarea class="tool-textarea tool-output" rows="12" value={output} readOnly />
        </label>
      )}
    </ToolPage>
  );
}

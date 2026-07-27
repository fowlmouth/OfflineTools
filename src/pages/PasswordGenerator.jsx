import { useState, useEffect } from 'preact/hooks';
import { ToolPage } from '../components/layout/ToolPage.jsx';
import { usePasswordGenerator } from '../hooks/usePasswordGenerator.js';
import './PasswordGenerator.css';

export function PasswordGenerator() {
  const pw = usePasswordGenerator();
  const [batchCount, setBatchCount] = useState(5);

  useEffect(() => {
    pw.generate();
  }, []);

  return (
    <ToolPage
      title="Password Generator"
      description="Create strong, random passwords offline, in your browser. Uses cryptographically secure randomness."
    >
      <div class="pw-display">
        <input
          class="pw-output"
          type="text"
          readOnly
          value={pw.password}
          aria-label="Generated password"
        />
        <button type="button" class="pw-copy" onClick={pw.copy}>
          {pw.copied ? 'Copied!' : 'Copy'}
        </button>
        <button type="button" class="pw-generate" onClick={pw.generate}>
          Generate
        </button>
      </div>

      <div class={`pw-strength pw-strength-${pw.strength.score}`}>
        <span class="pw-strength-label">{pw.strength.label}</span>
        <span class="pw-strength-bits">{pw.strength.bits} bits</span>
        <div class="pw-strength-bar">
          <div class="pw-strength-fill" style={{ width: `${(pw.strength.score / 4) * 100}%` }} />
        </div>
      </div>

      <div class="pw-slider">
        <label for="pw-length-input">Length</label>
        <input
          id="pw-length-input"
          type="range"
          min="1"
          max="128"
          step="1"
          value={pw.length}
          onInput={(e) => pw.setLength(parseInt(e.target.value, 10))}
        />
        <span class="pw-slider-value">{pw.length}</span>
      </div>

      <fieldset class="pw-options">
        <label class="pw-checkbox">
          <input
            type="checkbox"
            checked={pw.lowercase}
            onChange={(e) => pw.setOption('lowercase', e.target.checked)}
          />
          Lowercase (a–z)
        </label>
        <label class="pw-checkbox">
          <input
            type="checkbox"
            checked={pw.uppercase}
            onChange={(e) => pw.setOption('uppercase', e.target.checked)}
          />
          Uppercase (A–Z)
        </label>
        <label class="pw-checkbox">
          <input
            type="checkbox"
            checked={pw.numbers}
            onChange={(e) => pw.setOption('numbers', e.target.checked)}
          />
          Numbers (0–9)
        </label>
        <label class="pw-checkbox">
          <input
            type="checkbox"
            checked={pw.symbols}
            onChange={(e) => pw.setOption('symbols', e.target.checked)}
          />
          Symbols (!@#…)
        </label>
        <label class="pw-checkbox">
          <input
            type="checkbox"
            checked={pw.excludeAmbiguous}
            onChange={(e) => pw.setExcludeAmbiguous(e.target.checked)}
          />
          Exclude ambiguous (il1Lo0O)
        </label>
      </fieldset>

      <div class="pw-bulk">
        <label class="pw-bulk-count">
          How many?
          <input
            type="number"
            min="1"
            max="100"
            value={batchCount}
            onChange={(e) => setBatchCount(clampInt(e.target.value, 1, 100))}
          />
        </label>
        <button type="button" class="pw-bulk-run" onClick={() => pw.generateBatch(batchCount)}>
          Generate Batch
        </button>
      </div>

      {pw.batch.length > 0 && (
        <ul class="pw-batch-list">
          {pw.batch.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      )}
    </ToolPage>
  );
}

function clampInt(value, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

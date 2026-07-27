import { ToolPage } from '../components/layout/ToolPage.jsx';
import { useColorToolkit } from '../hooks/useColorToolkit.js';
import { PALETTE_SCHEMES } from '../tools/color/palette.js';
import './ColorToolkit.css';

export function ColorToolkit() {
  const c = useColorToolkit();

  return (
    <ToolPage
      title="Color Toolkit"
      description="Convert between HEX, RGB, and HSL, check WCAG contrast, and generate palettes — all offline."
    >
      <section class="color-section">
        <h2>Pick a color</h2>
        <div class="color-picker-row">
          <label class="color-native">
            <span class="sr-only">Base color</span>
            <input
              type="color"
              value={c.valid ? c.base : '#000000'}
              onInput={(e) => c.setBase(e.target.value)}
            />
          </label>
          <label class="color-field">
            HEX
            <input
              type="text"
              value={c.base}
              aria-invalid={!c.valid}
              onInput={(e) => c.setBase(e.target.value)}
            />
          </label>
          <div
            class="color-preview"
            style={{ background: c.valid ? c.base : 'transparent' }}
          />
        </div>
      </section>

      <section class="color-section">
        <h2>Conversions</h2>
        <dl class="color-conversions">
          <div class="color-conversion">
            <dt>HEX</dt>
            <dd>
              <button type="button" class="color-copy" onClick={() => c.copy(c.base)}>
                {c.base}
              </button>
            </dd>
          </div>
          <div class="color-conversion">
            <dt>RGB</dt>
            <dd>{c.rgb ? `${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}` : '—'}</dd>
          </div>
          <div class="color-conversion">
            <dt>HSL</dt>
            <dd>{c.hsl ? `${c.hsl.h}°, ${c.hsl.s}%, ${c.hsl.l}%` : '—'}</dd>
          </div>
        </dl>
      </section>

      <section class="color-section">
        <h2>Contrast checker</h2>
        <div class="color-contrast-inputs">
          <label class="color-contrast-field">
            Foreground
            <input
              type="color"
              value={c.foreground}
              onInput={(e) => c.setForeground(e.target.value)}
            />
          </label>
          <label class="color-contrast-field">
            Background
            <input
              type="color"
              value={c.background}
              onInput={(e) => c.setBackground(e.target.value)}
            />
          </label>
          <div
            class="color-contrast-sample"
            style={{ color: c.foreground, background: c.background }}
          >
            Aa
          </div>
        </div>
        <div class="color-contrast-result">
          <span class="color-ratio">{c.contrast.toFixed(2)}:1</span>
          <span class={`color-badge ${c.wcag.aa ? 'pass' : 'fail'}`}>AA</span>
          <span class={`color-badge ${c.wcag.aaa ? 'pass' : 'fail'}`}>AAA</span>
        </div>
      </section>

      <section class="color-section">
        <h2>Palette</h2>
        <label class="color-scheme">
          Scheme
          <select value={c.scheme} onChange={(e) => c.setScheme(e.target.value)}>
            {PALETTE_SCHEMES.map((s) => (
              <option key={s} value={s}>{capitalize(s)}</option>
            ))}
          </select>
        </label>
        <ul class="color-swatches">
          {c.palette.map((color) => (
            <li
              key={color}
              class="color-swatch"
              style={{ background: color }}
              onClick={() => c.copy(color)}
              title={`Copy ${color}`}
            >
              <span class="color-swatch-label">{color}</span>
            </li>
          ))}
        </ul>
      </section>
    </ToolPage>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

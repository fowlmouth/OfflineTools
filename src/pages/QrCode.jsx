import { useState, useRef, useCallback } from 'preact/hooks';
import { ToolPage } from '../components/layout/ToolPage.jsx';
import { useQrReader } from '../hooks/useQrReader.js';
import qrTool from '../tools/qr/index.js';
import './QrCode.css';

const QR_MODES = [
  { value: 'text', label: 'Plain Text' },
  { value: 'url', label: 'URL' },
  { value: 'vcard', label: 'Contact Card (vCard)' },
  { value: 'decode', label: 'Decode Image' },
];

function buildVCard({ firstName, lastName, phone, email, org }) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (firstName || lastName) {
    lines.push(`FN:${firstName} ${lastName}`);
    lines.push(`N:${lastName};${firstName};;;`);
  }
  if (phone) lines.push(`TEL:${phone}`);
  if (email) lines.push(`EMAIL:${email}`);
  if (org) lines.push(`ORG:${org}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export function QrCode() {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [vcardFields, setVcardFields] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    org: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const qrRef = useRef(null);
  const qrInstance = useRef(null);
  const reader = useQrReader();

  const generate = useCallback(() => {
    let data = text;
    if (mode === 'vcard') {
      data = buildVCard(vcardFields);
    }
    if (!data) return;

    const qr = qrTool.create({ data });
    qrInstance.current = qr;

    const container = qrRef.current;
    if (container) {
      container.innerHTML = '';
      qr.append(container);
    }
  }, [text, mode, vcardFields]);

  const download = useCallback(() => {
    if (qrInstance.current) {
      qrInstance.current.download({ name: 'qr-code', extension: 'png' });
    }
  }, []);

  const onFileChange = useCallback(
    (e) => {
      const file = e.target.files && e.target.files[0];
      setSelectedFile(file || null);
      reader.reset();
    },
    [reader],
  );

  return (
    <ToolPage title="QR Code Generator" description="Generate QR codes for text, URLs, and contact cards, or read a QR code from an image.">
      <div class="qr-modes">
        {QR_MODES.map((m) => (
          <button
            key={m.value}
            class={`qr-mode-btn ${mode === m.value ? 'active' : ''}`}
            onClick={() => setMode(m.value)}
            type="button"
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'decode' ? (
        <div class="qr-decode">
          <label class="qr-input-label">
            Image file
            <input type="file" accept="image/*" onChange={onFileChange} />
          </label>

          <div class="qr-actions">
            <button
              type="button"
              onClick={() => reader.read(selectedFile)}
              disabled={!selectedFile || reader.reading}
            >
              {reader.reading ? 'Reading...' : 'Read QR Code'}
            </button>
          </div>

          {reader.error && (
            <p class="qr-error" role="alert">{reader.error}</p>
          )}

          {reader.result && (
            <div class="qr-decode-result">
              <label class="qr-input-label">
                Decoded text
                <textarea rows="4" readOnly value={reader.result} />
              </label>
              <div class="qr-actions">
                <button type="button" onClick={reader.copy}>
                  {reader.copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {mode === 'vcard' ? (
            <div class="qr-vcard-fields">
              <label>
                First Name
                <input
                  type="text"
                  value={vcardFields.firstName}
                  onInput={(e) => setVcardFields({ ...vcardFields, firstName: e.target.value })}
                />
              </label>
              <label>
                Last Name
                <input
                  type="text"
                  value={vcardFields.lastName}
                  onInput={(e) => setVcardFields({ ...vcardFields, lastName: e.target.value })}
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={vcardFields.phone}
                  onInput={(e) => setVcardFields({ ...vcardFields, phone: e.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={vcardFields.email}
                  onInput={(e) => setVcardFields({ ...vcardFields, email: e.target.value })}
                />
              </label>
              <label>
                Organization
                <input
                  type="text"
                  value={vcardFields.org}
                  onInput={(e) => setVcardFields({ ...vcardFields, org: e.target.value })}
                />
              </label>
            </div>
          ) : (
            <label class="qr-input-label">
              {mode === 'url' ? 'URL' : 'Text'}
              <textarea
                rows="4"
                placeholder={mode === 'url' ? 'https://example.com' : 'Enter text...'}
                value={text}
                onInput={(e) => setText(e.target.value)}
              />
            </label>
          )}

          <div class="qr-actions">
            <button type="button" onClick={generate} disabled={mode === 'vcard' ? !Object.values(vcardFields).some(Boolean) : !text}>
              Generate
            </button>
            <button type="button" onClick={download} disabled={!qrInstance.current}>
              Download PNG
            </button>
          </div>

          <div ref={qrRef} class="qr-output" />
        </>
      )}
    </ToolPage>
  );
}

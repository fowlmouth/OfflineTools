export default {
  validate: (input) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      return { valid: false, error: errorNode.textContent };
    }
    return { valid: true, error: null };
  },
  format: (input) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      throw new Error(errorNode.textContent);
    }
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(doc);
    return prettyPrint(xmlString);
  },
};

function prettyPrint(xml) {
  const PADDING = '  ';
  let formatted = '';
  let indent = 0;

  // Normalize the xml: remove existing whitespace between tags
  const normalized = xml.replace(/(>)\s*(<)/g, '$1\n$2').split('\n');

  for (const node of normalized) {
    const trimmed = node.trim();
    if (!trimmed) continue;

    // Closing tag
    if (trimmed.startsWith('</')) {
      indent = Math.max(0, indent - 1);
    }

    formatted += PADDING.repeat(indent) + trimmed + '\n';

    // Opening tag (not self-closing, not closing, not declaration)
    if (
      trimmed.startsWith('<') &&
      !trimmed.startsWith('</') &&
      !trimmed.startsWith('<?') &&
      !trimmed.endsWith('/>') &&
      !trimmed.includes('</')
    ) {
      indent++;
    }
  }

  return formatted.trimEnd();
}

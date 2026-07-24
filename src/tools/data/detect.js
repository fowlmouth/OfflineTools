const YAML_KEY_PATTERN = /^\s*[a-zA-Z_][\w\-]*\s*:/m;
const YAML_LIST_PATTERN = /^\s*-\s+/m;

export function detectFormat(input) {
  const trimmed = input.trim();

  if (trimmed === '') {
    return 'unknown';
  }

  const firstChar = trimmed[0];

  if (firstChar === '{' || firstChar === '[') {
    return 'json';
  }

  if (firstChar === '<') {
    return 'xml';
  }

  if (YAML_KEY_PATTERN.test(trimmed) || YAML_LIST_PATTERN.test(trimmed)) {
    return 'yaml';
  }

  return 'unknown';
}

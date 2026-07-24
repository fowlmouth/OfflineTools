import yaml from 'js-yaml';
import { detectFormat } from './detect.js';
import { query } from './query.js';

function xmlToObj(node) {
  if (node.nodeType === 9) {
    return xmlToObj(node.documentElement);
  }
  if (node.nodeType !== 1) return null;

  const attributes = Array.from(node.attributes);
  const children = Array.from(node.children);
  const textContent = (node.textContent || '').trim();
  const hasChildren = children.length > 0;

  if (!hasChildren) {
    if (attributes.length > 0) {
      const result = {};
      for (const attr of attributes) {
        result['@' + attr.name] = attr.value;
      }
      if (textContent) {
        result['#text'] = textContent;
      }
      return result;
    }
    return textContent;
  }

  const result = {};
  for (const attr of attributes) {
    result['@' + attr.name] = attr.value;
  }

  for (const child of children) {
    const childObj = xmlToObj(child);
    if (result[child.tagName] !== undefined) {
      if (!Array.isArray(result[child.tagName])) {
        result[child.tagName] = [result[child.tagName]];
      }
      result[child.tagName].push(childObj);
    } else {
      result[child.tagName] = childObj;
    }
  }

  return result;
}

function objToXml(obj, rootName, indent) {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) {
    return `${pad}<${rootName}/>`;
  }
  if (typeof obj !== 'object') {
    return `${pad}<${rootName}>${obj}</${rootName}>`;
  }

  const inner = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('@')) continue;
    if (key === '#text') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        inner.push(objToXml(item, key, indent + 1));
      }
    } else {
      inner.push(objToXml(value, key, indent + 1));
    }
  }

  const hasInner = inner.length > 0;
  const textPart = obj['#text'] ? obj['#text'] : '';

  if (!hasInner && !textPart) {
    return `${pad}<${rootName}/>`;
  }
  if (!hasInner) {
    return `${pad}<${rootName}>${textPart}</${rootName}>`;
  }

  return `${pad}<${rootName}>\n${inner.join('\n')}\n${pad}</${rootName}>`;
}

function prettyPrintXml(input) {
  const PADDING = '  ';
  let formatted = '';
  let indentLevel = 0;

  const normalized = input.replace(/(>)\s*(<)/g, '$1\n$2').split('\n');

  for (const node of normalized) {
    const trimmed = node.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted += PADDING.repeat(indentLevel) + trimmed + '\n';

    if (
      trimmed.startsWith('<') &&
      !trimmed.startsWith('</') &&
      !trimmed.startsWith('<?') &&
      !trimmed.endsWith('/>') &&
      !trimmed.includes('</')
    ) {
      indentLevel++;
    }
  }

  return formatted.trimEnd();
}

function parseByFormat(input, format) {
  switch (format) {
    case 'json':
      return JSON.parse(input);
    case 'yaml':
      return yaml.load(input);
    case 'xml': {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'application/xml');
      const errorNode = doc.querySelector('parsererror');
      if (errorNode) {
        throw new Error(errorNode.textContent);
      }
      return xmlToObj(doc);
    }
    default:
      throw new Error(`Cannot parse unknown format`);
  }
}

export default {
  detect(input) {
    return detectFormat(input);
  },

  parse(input, format) {
    const fmt = format || detectFormat(input);
    return { format: fmt, data: parseByFormat(input, fmt) };
  },

  validate(input) {
    const format = detectFormat(input);
    if (format === 'unknown') {
      return { format, valid: false, error: 'Could not detect format' };
    }
    try {
      parseByFormat(input, format);
      return { format, valid: true, error: null };
    } catch (e) {
      return { format, valid: false, error: e.message };
    }
  },

  format(input, format) {
    const fmt = format || detectFormat(input);
    const data = parseByFormat(input, fmt);
    switch (fmt) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'yaml':
        return yaml.dump(data, { indent: 2 });
      case 'xml': {
        const rootName = Object.keys(data)[0];
        return objToXml(data[rootName], rootName, 0);
      }
      default:
        throw new Error(`Cannot format unknown format`);
    }
  },

  toJSON(input, format) {
    const fmt = format || detectFormat(input);
    const data = parseByFormat(input, fmt);
    return JSON.stringify(data, null, 2);
  },

  queryData(input, expr, format) {
    const fmt = format || detectFormat(input);
    const data = parseByFormat(input, fmt);
    const result = query(data, expr);
    return JSON.stringify(result === undefined ? null : result, null, 2);
  },
};

const IDENTIFIER_RE = /[a-zA-Z_$][\w$-]*/;

function parseQuery(expr) {
  const ops = [];
  let i = 0;
  const s = expr.trim();

  if (s === '' || s === '.') {
    return ops;
  }

  if (s[i] === '.') i++;

  while (i < s.length) {
    if (s[i] === '.') {
      i++;
      const rest = s.slice(i);
      const match = rest.match(IDENTIFIER_RE);
      if (!match) {
        throw new Error(`Expected field name at position ${i}`);
      }
      ops.push({ type: 'field', name: match[0] });
      i += match[0].length;
    } else if (s[i] === '[') {
      i++;
      if (s[i] === ']') {
        ops.push({ type: 'iterate' });
        i++;
      } else {
        const rest = s.slice(i);
        const match = rest.match(/^\d+/);
        if (!match) {
          throw new Error(`Expected number at position ${i}`);
        }
        ops.push({ type: 'index', value: parseInt(match[0], 10) });
        i += match[0].length;
        if (s[i] !== ']') {
          throw new Error(`Expected ']' at position ${i}`);
        }
        i++;
      }
    } else {
      const rest = s.slice(i);
      const match = rest.match(IDENTIFIER_RE);
      if (!match) {
        throw new Error(`Unexpected character '${s[i]}' at position ${i}`);
      }
      ops.push({ type: 'field', name: match[0] });
      i += match[0].length;
    }
  }

  return ops;
}

function applyOps(data, ops) {
  let current = data;
  let streaming = false;

  for (const op of ops) {
    if (op.type === 'iterate') {
      if (!streaming) {
        if (Array.isArray(current)) {
          streaming = true;
        } else if (current != null && typeof current === 'object') {
          current = Object.values(current);
          streaming = true;
        } else {
          current = [];
          streaming = true;
        }
      } else {
        current = current.flat();
      }
    } else if (op.type === 'field') {
      if (streaming) {
        current = current.map(
          (item) =>
            (item != null && typeof item === 'object') ? item[op.name] : undefined,
        );
      } else {
        current =
          (current != null && typeof current === 'object')
            ? current[op.name]
            : undefined;
      }
    } else if (op.type === 'index') {
      if (streaming) {
        current = current.map((item) =>
          Array.isArray(item) ? item[op.value] : undefined,
        );
      } else {
        current = Array.isArray(current) ? current[op.value] : undefined;
      }
    }
  }

  return current;
}

export function query(data, expr) {
  const ops = parseQuery(expr);
  return applyOps(data, ops);
}

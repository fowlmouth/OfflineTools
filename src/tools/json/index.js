/**
 * JSON tool interface.
 *
 * When the WASM module is ready, replace the implementations below
 * with calls into the actual WASM exports.
 */

export default {
  validate: (input) => {
    try {
      JSON.parse(input);
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },
  format: (input, indent = 2) => {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, indent);
  },
  minify: (input) => {
    return JSON.stringify(JSON.parse(input));
  },
};

import { useState, useEffect } from 'preact/hooks';

/**
 * Loads a WASM-based tool module on demand.
 *
 * @param {() => Promise<{ default: object }>} loader - dynamic import function for the tool's glue module
 * @returns {{ ready: boolean, error: Error | null, api: object | null }}
 */
export function useWasmTool(loader) {
  const [state, setState] = useState({
    ready: false,
    error: null,
    api: null,
  });

  useEffect(() => {
    let cancelled = false;

    loader()
      .then((module) => {
        if (!cancelled) {
          setState({ ready: true, error: null, api: module.default });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ ready: false, error: err, api: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  return state;
}

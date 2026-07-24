import { useState, useRef, useEffect, useCallback } from 'preact/hooks';

export function useWakeLock(options = {}) {
  const doc = options.document ?? document;
  const getWakeLockApi = options.getWakeLockApi ?? defaultGetWakeLockApi;

  const [active, setActive] = useState(false);
  const sentinelRef = useRef(null);
  const desiredRef = useRef(false);

  const supported = isSupported(getWakeLockApi);

  const release = useCallback(() => {
    desiredRef.current = false;
    const sentinel = sentinelRef.current;
    if (sentinel) {
      try {
        sentinel.release();
      } catch {}
      sentinelRef.current = null;
    }
    setActive(false);
  }, []);

  const request = useCallback(() => {
    desiredRef.current = true;
    const api = getWakeLockApi();
    if (!api) return;
    if (sentinelRef.current) {
      try {
        sentinelRef.current.release();
      } catch {}
      sentinelRef.current = null;
    }
    api.request('screen')
      .then((sentinel) => {
        if (!desiredRef.current) {
          try {
            sentinel.release();
          } catch {}
          return;
        }
        sentinelRef.current = sentinel;
        setActive(true);
      })
      .catch(() => {
        setActive(false);
      });
  }, [getWakeLockApi]);

  useEffect(() => {
    function onVisibilityChange() {
      if (doc.visibilityState === 'visible' && desiredRef.current) {
        request();
      }
    }
    doc.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      doc.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [doc, request]);

  useEffect(() => {
    return () => {
      desiredRef.current = false;
      const sentinel = sentinelRef.current;
      if (sentinel) {
        try {
          sentinel.release();
        } catch {}
        sentinelRef.current = null;
      }
    };
  }, []);

  return { supported, active, request, release };
}

function isSupported(getWakeLockApi) {
  try {
    const api = getWakeLockApi();
    return !!api && typeof api.request === 'function';
  } catch {
    return false;
  }
}

function defaultGetWakeLockApi() {
  return typeof navigator !== 'undefined' ? navigator.wakeLock : undefined;
}

import { useCallback, useEffect, useState } from 'react';

export function useFetch(fn, deps = []) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    let vivant = true;
    setData(undefined); setError(null);
    fn().then((d) => vivant && setData(d)).catch((e) => vivant && setError(e));
    return () => { vivant = false; };
  }, deps);
  useEffect(() => run(), [run]);
  return { data, error, reload: run };
}

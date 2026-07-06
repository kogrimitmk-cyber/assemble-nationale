import { useCallback, useEffect, useState } from 'react';

// Petit hook de chargement : data=undefined pendant le fetch, error si échec.
export function useFetch(fn, deps = []) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    let vivant = true;
    setData(undefined);
    setError(null);
    fn().then((d) => vivant && setData(d)).catch((e) => vivant && setError(e));
    return () => { vivant = false; };
  }, deps);

  useEffect(() => run(), [run]);
  return { data, error, reload: run };
}

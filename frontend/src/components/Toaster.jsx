import { useEffect, useState } from 'react';

export function toast(msg) {
  window.dispatchEvent(new CustomEvent('an-toast', { detail: msg }));
}

export default function Toaster() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timer;
    const h = (e) => {
      setMsg(e.detail);
      setShow(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShow(false), 3600);
    };
    window.addEventListener('an-toast', h);
    return () => { window.removeEventListener('an-toast', h); clearTimeout(timer); };
  }, []);
  return <div className={`toast${show ? ' show' : ''}`} role="status" aria-live="polite">{msg}</div>;
}

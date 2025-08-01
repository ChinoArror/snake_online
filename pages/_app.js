import '../styles/globals.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  // 注册 Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker 注册成功:', registration.scope);
          })
          .catch(error => {
            console.log('Service Worker 注册失败:', error);
          });
      });
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
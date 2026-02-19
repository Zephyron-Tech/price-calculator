import { Html, Head, Main, NextScript } from 'next/document';

// Runs synchronously before first paint — prevents flash of wrong theme.
const themeScript = `(function(){try{var s=localStorage.getItem('clearway-theme');if(s==='light'||(s===null&&!window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('light')}}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="cs">
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

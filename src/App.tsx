import React, { useEffect, useRef } from 'react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If rendered inside Vite React root, embed the standalone HTML view cleanly
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
      <iframe
        src="/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="DAW Creator Material Suite"
      />
    </div>
  );
}


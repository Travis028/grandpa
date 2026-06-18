import { useEffect, useState } from 'react';

const FLOWERS = ['🌸', '🌺', '🕊️', '🌿', '✨'];

export default function FloatingFlowers() {
  const [flowers, setFlowers] = useState([]);

  useEffect(() => {
    // Generate random flowers
    const newFlowers = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      char: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
      left: `${Math.random() * 100}%`,
      animationDuration: `${15 + Math.random() * 20}s`,
      animationDelay: `${-Math.random() * 20}s`,
      fontSize: `${1 + Math.random() * 1.5}rem`,
      opacity: 0.1 + Math.random() * 0.3
    }));
    setFlowers(newFlowers);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden'
    }}>
      <style>
        {`
          @keyframes floatUp {
            0% {
              transform: translateY(100vh) rotate(0deg);
            }
            100% {
              transform: translateY(-20vh) rotate(360deg);
            }
          }
        `}
      </style>
      {flowers.map(f => (
        <span
          key={f.id}
          style={{
            position: 'absolute',
            left: f.left,
            bottom: '-10%',
            fontSize: f.fontSize,
            opacity: f.opacity,
            animation: `floatUp ${f.animationDuration} linear infinite`,
            animationDelay: f.animationDelay,
            userSelect: 'none'
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  );
}

import { useEffect, useState } from 'react';

export function Clock({ large = false }: { large?: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  const time = `${hr}:${m.toString().padStart(2, '0')}`;

  const day = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (large) {
    return (
      <div className="text-center no-select">
        <div className="font-display font-semibold tracking-tight text-slatey-900 tabular-nums" style={{ fontSize: 'clamp(4rem, 14vw, 9rem)', lineHeight: 1 }}>
          {time}
          <span className="text-sage-500 text-3xl sm:text-5xl ml-2">{ampm}</span>
        </div>
        <div className="mt-2 text-xl sm:text-2xl text-slatey-700 font-semibold">{day}</div>
      </div>
    );
  }

  return (
    <div className="no-select">
      <div className="font-display text-2xl text-slatey-900 tabular-nums">{time} {ampm}</div>
      <div className="text-sm text-slatey-700">{day}</div>
    </div>
  );
}

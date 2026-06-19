import { Loader2 } from 'lucide-react';

export default function Loader({ size = 24, color = 'rgba(99,102,241,0.6)', fullPage = false }) {
  const inner = <Loader2 size={size} style={{ color }} className="animate-spin" />;

  if (!fullPage) return inner;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#040210' }}>
      {inner}
    </div>
  );
}

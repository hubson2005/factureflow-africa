import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MiniStat({ label, value, icon: Icon, color, trend, trendUp }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 500 }}>{label}</span>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ color: 'white', fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{value}</span>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: trendUp ? '#22c55e' : '#ef4444', fontSize: '11px', fontWeight: 600 }}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

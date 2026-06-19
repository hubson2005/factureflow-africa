import { motion } from 'framer-motion';
import { Crown, CheckCircle } from 'lucide-react';

export default function LockedFeaturePanel({ requiredPlan, featureName, icon: Icon }) {
  const isPro      = requiredPlan === 'pro';
  const color      = isPro ? '#ff8c00' : '#f7c948';
  const emoji      = isPro ? '🚀' : '💼';
  const planLabel  = isPro ? 'PRO' : 'BUSINESS';
  const price      = isPro ? '15 000 FCFA / an' : '25 000 FCFA / an';

  const proFeatures      = ['8 liens sociaux', 'QR Code Premium', 'Analytics & Temps réel', 'Mode Événement', '10 produits Marketplace', '3 PDFs'];
  const businessFeatures = ['17 liens sociaux', 'QR Code dynamique', 'Analytics avancés', 'CRM & Leads', 'Automatisations', 'Toutes les intégrations', 'Marketplace illimitée', 'Support VIP'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', gap: '20px', textAlign: 'center', padding: '40px 32px' }}
    >
      {/* Icon */}
      <div style={{ position: 'relative' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: color + '18', border: '1px solid ' + color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          {Icon && <Icon size={32} color={color + '99'} />}
        </div>
        <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.9)', border: '2px solid ' + color + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
          🔒
        </div>
      </div>

      {/* Text */}
      <div>
        <p style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>{featureName}</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 6px' }}>
          Disponible à partir de l'offre
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: color + '18', border: '1px solid ' + color + '44', borderRadius: '100px', padding: '5px 14px', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px' }}>{emoji}</span>
          <span style={{ color, fontSize: '13px', fontWeight: 700 }}>{planLabel}</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: '6px 0 0' }}>{price}</p>
      </div>

      {/* Feature list */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px', maxWidth: '320px', width: '100%' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
          {emoji} Inclus dans l'offre {planLabel}
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(isPro ? proFeatures : businessFeatures).map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              <CheckCircle size={12} color={color} /> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `linear-gradient(135deg,${color},${color}aa)`, borderRadius: '14px', padding: '12px 28px', color: 'white', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: `0 8px 24px ${color}33` }}>
        <Crown size={15} /> Passer en {planLabel} — {price}
      </a>
    </motion.div>
  );
}

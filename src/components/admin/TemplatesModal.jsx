import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PROFILE_TEMPLATES } from '../../constants/dashboard';
import Modal from '../shared/Modal';

export default function TemplatesModal({ onClose, onApply }) {
  return (
    <Modal open onClose={onClose} title="Templates" subtitle="Configurez votre profil en un seul clic" maxWidth="580px">
      <div style={{ padding: '16px 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
        {PROFILE_TEMPLATES.map(t => {
          const [c1, c2] = t.theme_color.split('|');
          return (
            <button key={t.id} onClick={() => onApply(t)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.transform = 'scale(1.01)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'scale(1)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: `linear-gradient(135deg,${c1},${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{t.emoji}</div>
                <div>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '14px', margin: 0 }}>{t.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{t.platformKeys.length} plateformes</p>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0 }}>{t.desc}</p>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

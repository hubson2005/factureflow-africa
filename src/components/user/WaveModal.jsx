import React from 'react';
import { motion } from 'framer-motion';

export default function WaveModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0a1e',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px',
          padding: '28px 24px',
          maxWidth: '360px', width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: '60px', height: '60px', borderRadius: '18px',
          background: 'linear-gradient(135deg,#0057FF,#0099FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,87,255,0.4)',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
        </div>

        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
          🔓 Débloquer cette fonctionnalité
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
          Le <strong style={{ color: 'rgba(255,255,255,0.8)' }}>username personnalisé</strong> est une
          fonctionnalité premium.
        </p>

        <div style={{
          background: 'rgba(0,87,255,0.1)', border: '1px solid rgba(0,87,255,0.3)',
          borderRadius: '14px', padding: '16px', marginBottom: '14px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '8px' }}>
            Envoyez votre paiement via <strong style={{ color: '#60a5fa' }}>Wave CI</strong> au numéro :
          </p>
          <p style={{ color: 'white', fontSize: '26px', fontWeight: 800, margin: '0 0 4px' }}>
            +225 05 76 03 12 12
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
            Montant : à définir selon votre offre
          </p>
        </div>

        <a
          href="https://wa.me/2250576031212"
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '13px', background: '#25D366',
            borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 700,
            textDecoration: 'none', marginBottom: '10px',
          }}
        >
          WhatsApp — Envoyer la preuve
        </a>

        <button
          type="button" onClick={onClose}
          style={{
            width: '100%', padding: '11px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px',
            color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer',
          }}
        >
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}
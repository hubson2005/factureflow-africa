import React from 'react';

/**
 * Generic empty-state card with an optional icon, title, subtitle and CTA.
 *
 * Usage:
 *   <EmptyState
 *     icon={<Link2 size={28} color="rgba(255,255,255,0.15)" />}
 *     title="Aucune plateforme configurée"
 *     subtitle="Cliquez sur Ajouter pour commencer"
 *     action={<button onClick={…}>Ajouter</button>}
 *   />
 */
export default function EmptyState({ icon, title, subtitle, action, style = {} }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '2px dashed rgba(255,255,255,0.12)',
      borderRadius: '18px',
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      ...style,
    }}>
      {icon && <div style={{ marginBottom: '4px' }}>{icon}</div>}
      {title && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600, margin: 0 }}>
          {title}
        </p>
      )}
      {subtitle && (
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: 0 }}>
          {subtitle}
        </p>
      )}
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
}
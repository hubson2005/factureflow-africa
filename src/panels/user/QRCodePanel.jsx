import QRCodeDisplay from '../../components/dashboard/QRCodeDisplay';

/**
 * Standalone panel that wraps the shared QRCodeDisplay widget.
 * Renders the QR code for the active profile's public URL.
 */
export default function QRCodePanel({ profileId, username, isActivated }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <div>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>QR Code</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
          Partagez votre profil en un scan
        </p>
      </div>
      <QRCodeDisplay profileId={profileId} username={username} isActive={isActivated} />
    </div>
  );
}

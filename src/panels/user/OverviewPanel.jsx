import React from 'react';

import {
  Radio,
  BarChart3,
  UserPlus,
  Link2,
  ArrowUpRight,
  Loader2,
  Save,
  AtSign,
  BadgeCheck,
  CalendarClock,
} from 'lucide-react';

import ProfileHeader from './ProfileHeader';
import StatsCard from './StatsCard';
import QRCodeDisplay from './QRCodeDisplay';

export default function OverviewPanel({
  profile = {},
  onNavigate = () => {},
  onUpdate = () => {},
  onSave = () => {},
  hasChanges = false,
  saving = false,
}) {

  // ─────────────────────────────────────────────
  // Quick Actions
  // ─────────────────────────────────────────────
  const quickActions = [
    {
      label: 'Temps réel',
      icon: Radio,
      color: '#22c55e',
      section: 'realtime',
      desc: 'Visiteurs en direct',
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      color: '#6366f1',
      section: 'analytics',
      desc: 'Performances',
    },
    {
      label: 'Leads',
      icon: UserPlus,
      color: '#f59e0b',
      section: 'leads',
      desc: 'Gérer les contacts',
    },
    {
      label: 'Plateformes',
      icon: Link2,
      color: '#0ea5e9',
      section: 'platforms',
      desc: `${profile?.links?.length || 0} lien(s)`,
    },
  ];

  // ─────────────────────────────────────────────
  // Toggle Component
  // ─────────────────────────────────────────────
  const Toggle = ({ value, onClick }) => (
    <button
      onClick={onClick}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '100px',
        background: value
          ? '#22c55e'
          : 'rgba(255,255,255,0.1)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.25s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: '3px',
          left: value ? '23px' : '3px',
          transition: 'all 0.25s ease',
        }}
      />
    </button>
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >

      {/* ───────────────── Header ───────────────── */}
      <div>
        <h2
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 800,
            margin: 0,
          }}
        >
          Vue d'ensemble
        </h2>

        <p
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '13px',
            margin: '4px 0 0',
          }}
        >
          Bienvenue sur votre dashboard SocialApp
        </p>
      </div>

      {/* ───────────────── Quick Actions ───────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: '10px',
        }}
      >
        {quickActions.map((action) => (
          <button
            key={action.section}
            onClick={() => onNavigate(action.section)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform =
                'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'rgba(255,255,255,0.04)';
              e.currentTarget.style.transform =
                'translateY(0)';
            }}
          >

            {/* Icon */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: `${action.color}22`,
                border: `1px solid ${action.color}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <action.icon
                size={17}
                color={action.color}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <p
                style={{
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {action.label}
              </p>

              <p
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '11px',
                  margin: '2px 0 0',
                }}
              >
                {action.desc}
              </p>
            </div>

            <ArrowUpRight
              size={14}
              color="rgba(255,255,255,0.2)"
            />
          </button>
        ))}
      </div>

      {/* ───────────────── Profile Card ───────────────── */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
        }}
      >

        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom:
              '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            Mon profil
          </span>

          {hasChanges && (
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background:
                  'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {saving ? (
                <Loader2
                  size={11}
                  className="animate-spin"
                />
              ) : (
                <Save size={11} />
              )}

              Sauvegarder
            </button>
          )}
        </div>

        {/* Avatar */}
        <ProfileHeader
          profile={profile}
          onUpdate={onUpdate}
        />

        {/* Username */}
        <div
          style={{
            borderTop:
              '1px solid rgba(255,255,255,0.08)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AtSign
            size={14}
            color="rgba(255,255,255,0.35)"
          />

          <span
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '12px',
              minWidth: '80px',
            }}
          >
            Username
          </span>

          <input
            type="text"
            value={profile?.username || ''}
            onChange={(e) =>
              onUpdate({
                username: e.target.value,
              })
            }
            placeholder="ex: hubson"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '12px',
              outline: 'none',
              flex: 1,
            }}
          />
        </div>

        {/* Verified Badge */}
        <div
          style={{
            borderTop:
              '1px solid rgba(255,255,255,0.08)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <BadgeCheck
              size={14}
              color="rgba(255,255,255,0.35)"
            />

            <div>
              <span
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                }}
              >
                Badge vérifié
              </span>

              <p
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '10px',
                  margin: '2px 0 0',
                }}
              >
                Affiche ✓ vert sur le profil public
              </p>
            </div>
          </div>

          <Toggle
            value={profile?.is_verified}
            onClick={() =>
              onUpdate({
                is_verified:
                  !profile?.is_verified,
              })
            }
          />
        </div>

        {/* Expiration */}
        <div
          style={{
            borderTop:
              '1px solid rgba(255,255,255,0.08)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CalendarClock
            size={14}
            color="rgba(255,255,255,0.35)"
          />

          <span
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '12px',
              minWidth: '80px',
            }}
          >
            Expiration
          </span>

          <input
            type="date"
            value={profile?.expiry_date || ''}
            onChange={(e) =>
              onUpdate({
                expiry_date: e.target.value,
              })
            }
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '12px',
              outline: 'none',
              flex: 1,
            }}
          />
        </div>
      </div>

      {/* ───────────────── Stats + QR ───────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0,1fr) minmax(260px,280px)',
          gap: '16px',
        }}
      >
        <StatsCard profileId={profile?.id} />

        <QRCodeDisplay
          profileId={profile?.id}
          username={profile?.username}
        />
      </div>

    </div>
  );
}
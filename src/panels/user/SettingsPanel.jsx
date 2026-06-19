// src/components/SettingsPanel.jsx

import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  Bell,
  Eye,
  CalendarClock,
  Activity,
  Loader2,
  MousePointerClick
} from 'lucide-react';

import { toast } from 'sonner';
import { supabase } from '@/lib/supabase'; // adapte le chemin si nécessaire

export default function SettingsPanel({ profile }) {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [language, setLanguage] = useState(
    () => localStorage.getItem('app_language') || 'fr'
  );

  const [notifView, setNotifView] = useState(
    () => localStorage.getItem('notif_view') !== 'false'
  );

  const [notifClick, setNotifClick] = useState(
    () => localStorage.getItem('notif_click') !== 'false'
  );

  const [notifExpiry, setNotifExpiry] = useState(
    () => localStorage.getItem('notif_expiry') !== 'false'
  );

  const [threshold, setThreshold] = useState(
    () => parseInt(localStorage.getItem('notif_threshold') || '10')
  );

  const notifGranted =
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted';

  const LANGUAGES = [
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'es', label: '🇪🇸 Español' },
    { code: 'ar', label: '🇲🇦 العربية' },
    { code: 'pt', label: '🇧🇷 Português' },
  ];

  const handlePasswordChange = async () => {
    if (!newPwd || newPwd.length < 6) {
      toast.error('Mot de passe trop court (6 caractères minimum)');
      return;
    }

    if (newPwd !== confirmPwd) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setPwdLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPwd,
    });

    setPwdLoading(false);

    if (error) {
      toast.error('Erreur : ' + error.message);
      return;
    }

    toast.success('Mot de passe mis à jour !');

    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  const saveLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('app_language', code);

    toast.success('Langue mise à jour');
  };

  const saveNotifPref = (key, value) => {
    if (key === 'view') {
      setNotifView(value);
      localStorage.setItem('notif_view', String(value));
    }

    if (key === 'click') {
      setNotifClick(value);
      localStorage.setItem('notif_click', String(value));
    }

    if (key === 'expiry') {
      setNotifExpiry(value);
      localStorage.setItem('notif_expiry', String(value));
    }

    if (key === 'threshold') {
      setThreshold(value);
      localStorage.setItem('notif_threshold', String(value));
    }

    toast.success('Préférence sauvegardée');
  };

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '100px',
        background: value
          ? '#6366f1'
          : 'rgba(255,255,255,0.1)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.3s',
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
          transition: 'left 0.3s',
        }}
      />
    </button>
  );

  const Row = ({ icon: Icon, label, desc, right }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 16px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Icon
          size={15}
          color="rgba(255,255,255,0.35)"
        />

        <div>
          <p
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              fontWeight: 500,
              margin: 0,
            }}
          >
            {label}
          </p>

          {desc && (
            <p
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '11px',
                margin: '2px 0 0',
              }}
            >
              {desc}
            </p>
          )}
        </div>
      </div>

      {right}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '640px',
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 800,
            margin: 0,
          }}
        >
          Paramètres
        </h2>

        <p
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '12px',
            margin: '4px 0 0',
          }}
        >
          Sécurité, langue et notifications
        </p>
      </div>

      {/* Password */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck
              size={15}
              color="#a78bfa"
            />
          </div>

          <div>
            <p
              style={{
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              Changer le mot de passe
            </p>

            <p
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '11px',
                margin: '2px 0 0',
              }}
            >
              Sécurisez votre compte
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '4px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '9px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {[
            {
              val: newPwd,
              set: setNewPwd,
              ph: 'Nouveau mot de passe',
            },
            {
              val: confirmPwd,
              set: setConfirmPwd,
              ph: 'Confirmer le mot de passe',
            },
          ].map(({ val, set, ph }) => (
            <input
              key={ph}
              type="password"
              value={val}
              onChange={(e) => set(e.target.value)}
              placeholder={ph}
              style={{
                marginTop: '8px',
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          ))}

          <button
            onClick={handlePasswordChange}
            disabled={
              pwdLoading ||
              !newPwd ||
              !confirmPwd
            }
            style={{
              marginTop: '4px',
              padding: '10px',
              background:
                newPwd && confirmPwd
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : 'rgba(255,255,255,0.07)',
              border: 'none',
              borderRadius: '10px',
              color:
                newPwd && confirmPwd
                  ? 'white'
                  : 'rgba(255,255,255,0.3)',
              fontSize: '12px',
              fontWeight: 600,
              cursor:
                newPwd && confirmPwd
                  ? 'pointer'
                  : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {pwdLoading ? (
              <Loader2
                size={13}
                className="animate-spin"
              />
            ) : (
              <ShieldCheck size={13} />
            )}

            Mettre à jour le mot de passe
          </button>
        </div>
      </div>

      {/* Language */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'rgba(14,165,233,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Globe
              size={15}
              color="#38bdf8"
            />
          </div>

          <div>
            <p
              style={{
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              Langue de l'interface
            </p>

            <p
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '11px',
                margin: '2px 0 0',
              }}
            >
              Choisissez votre langue préférée
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '12px 16px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() =>
                saveLanguage(lang.code)
              }
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border:
                  '1px solid ' +
                  (language === lang.code
                    ? 'rgba(56,189,248,0.5)'
                    : 'rgba(255,255,255,0.1)'),
                background:
                  language === lang.code
                    ? 'rgba(56,189,248,0.12)'
                    : 'rgba(255,255,255,0.04)',
                color:
                  language === lang.code
                    ? '#38bdf8'
                    : 'rgba(255,255,255,0.55)',
                fontSize: '12px',
                fontWeight:
                  language === lang.code
                    ? 700
                    : 400,
                cursor: 'pointer',
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background:
                  'rgba(34,197,94,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell
                size={15}
                color="#22c55e"
              />
            </div>

            <div>
              <p
                style={{
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Notifications
              </p>

              <p
                style={{
                  color:
                    'rgba(255,255,255,0.3)',
                  fontSize: '11px',
                  margin: '2px 0 0',
                }}
              >
                {notifGranted
                  ? '🟢 Push activées'
                  : '🔴 Push désactivées'}
              </p>
            </div>
          </div>

          {!notifGranted && (
            <button
              onClick={async () => {
                const p =
                  await Notification.requestPermission();

                if (p === 'granted') {
                  toast.success(
                    'Notifications activées !'
                  );
                }
              }}
              style={{
                padding: '7px 12px',
                background:
                  'rgba(34,197,94,0.12)',
                border:
                  '1px solid rgba(34,197,94,0.3)',
                borderRadius: '9px',
                color: '#22c55e',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Activer
            </button>
          )}
        </div>

        <Row
          icon={Eye}
          label="Nouvelle visite"
          desc="Alerte à chaque vue"
          right={
            <Toggle
              value={notifView}
              onChange={(v) =>
                saveNotifPref('view', v)
              }
            />
          }
        />

        <Row
          icon={MousePointerClick}
          label="Clic sur un lien"
          desc="Alerte lors d'un clic"
          right={
            <Toggle
              value={notifClick}
              onChange={(v) =>
                saveNotifPref('click', v)
              }
            />
          }
        />

        <Row
          icon={CalendarClock}
          label="Expiration du profil"
          desc="Rappel avant expiration"
          right={
            <Toggle
              value={notifExpiry}
              onChange={(v) =>
                saveNotifPref('expiry', v)
              }
            />
          }
        />

        {/* Threshold */}
        <div
          style={{
            borderTop:
              '1px solid rgba(255,255,255,0.07)',
            padding: '13px 16px',
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
            <Activity
              size={15}
              color="rgba(255,255,255,0.35)"
            />

            <div>
              <p
                style={{
                  color:
                    'rgba(255,255,255,0.8)',
                  fontSize: '13px',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                Seuil de regroupement
              </p>

              <p
                style={{
                  color:
                    'rgba(255,255,255,0.3)',
                  fontSize: '11px',
                  margin: '2px 0 0',
                }}
              >
                Notifier tous les{' '}
                <strong
                  style={{
                    color: '#a78bfa',
                  }}
                >
                  {threshold}
                </strong>{' '}
                visiteurs
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {[1, 5, 10, 25, 50].map((n) => (
              <button
                key={n}
                onClick={() =>
                  saveNotifPref(
                    'threshold',
                    n
                  )
                }
                style={{
                  width: '32px',
                  height: '28px',
                  borderRadius: '8px',
                  border:
                    '1px solid ' +
                    (threshold === n
                      ? 'rgba(167,139,250,0.5)'
                      : 'rgba(255,255,255,0.1)'),
                  background:
                    threshold === n
                      ? 'rgba(167,139,250,0.15)'
                      : 'rgba(255,255,255,0.04)',
                  color:
                    threshold === n
                      ? '#a78bfa'
                      : 'rgba(255,255,255,0.4)',
                  fontSize: '11px',
                  fontWeight:
                    threshold === n
                      ? 700
                      : 400,
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// ProfileCard.jsx
// Carte profil alignée exactement à la même hauteur que la carte "Mon QR Code"

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ───────────────────────────────────────────────────────────── */
/* CSS */
/* ───────────────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

*,*::before,*::after{
  box-sizing:border-box;
  margin:0;
  padding:0;
}

:root{
  --card:#1a1c21;
  --border:rgba(255,255,255,0.07);
  --hover:#22252c;
  --hover2:#2a2d35;
  --orange:#f5841f;
  --green:#22d07a;
  --blue:#4d9cf8;
  --t1:#f0f0f0;
  --t2:#9fa3b0;
  --t3:#5c6070;
}

/* Carte principale */
.pc-root{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:24px;
  padding:18px 18px 16px;
  font-family:'DM Sans',sans-serif;
  color:var(--t1);

  display:flex;
  flex-direction:column;
  gap:14px;

  width:100%;
  height:100%;
  min-height:405px;
  max-height:405px;
  overflow:hidden;
}

/* Ligne principale */
.pc-top{
  display:flex;
  align-items:center;
  gap:14px;
}

/* Avatar */
.pc-avatar-wrap{
  position:relative;
  flex-shrink:0;
}

.pc-avatar,
.pc-avatar-fallback{
  width:58px;
  height:58px;
  border-radius:50%;
}

.pc-avatar{
  object-fit:cover;
  display:block;
  border:2px solid var(--border);
  background:var(--hover);
}

.pc-avatar-fallback{
  background:linear-gradient(135deg,#f5841f,#ff6b35);
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:'Syne',sans-serif;
  font-size:22px;
  font-weight:700;
  color:#fff;
  border:2px solid var(--border);
}

.pc-avatar-edit{
  position:absolute;
  bottom:-2px;
  right:-2px;
  width:22px;
  height:22px;
  border-radius:50%;
  background:var(--orange);
  border:2px solid var(--card);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:11px;
  cursor:pointer;
  transition:transform .15s;
}

.pc-avatar-edit:hover{
  transform:scale(1.1);
}

/* Infos */
.pc-info{
  flex:1;
  min-width:0;
  overflow:hidden;
}

.pc-name{
  font-family:'Syne',sans-serif;
  font-size:16px;
  font-weight:700;
  display:flex;
  align-items:center;
  gap:7px;
  flex-wrap:wrap;
  line-height:1.2;
  word-break:break-word;
}

.pc-verified{
  width:18px;
  height:18px;
  border-radius:50%;
  background:var(--blue);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:10px;
  color:#fff;
  flex-shrink:0;
}

.pc-role{
  font-size:12.5px;
  color:var(--t2);
  margin-top:2px;
  line-height:1.35;
}

.pc-handle{
  font-size:12.5px;
  color:var(--t2);
  margin-top:3px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

/* Actions */
.pc-quick{
  display:flex;
  gap:6px;
  margin-left:auto;
  flex-shrink:0;
}

.pc-qbtn{
  width:30px;
  height:30px;
  border-radius:8px;
  background:var(--hover);
  border:1px solid var(--border);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:14px;
  cursor:pointer;
  color:var(--t2);
  transition:all .12s;
}

.pc-qbtn:hover{
  background:var(--hover2);
  color:var(--t1);
}

/* URL */
.pc-url-wrap{
  display:flex;
  align-items:center;
  gap:8px;
  background:var(--hover);
  border:1px solid var(--border);
  border-radius:10px;
  padding:10px 13px;
  cursor:pointer;
}

.pc-url-text{
  flex:1;
  min-width:0;
  font-size:13px;
  color:var(--blue);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.pc-copy-btn{
  background:none;
  border:none;
  cursor:pointer;
  color:var(--t3);
  font-size:16px;
  flex-shrink:0;
}

.pc-copy-btn.ok{
  color:var(--green);
}

/* Meta */
.pc-meta{
  display:flex;
  align-items:center;
  gap:8px;
  color:var(--t3);
  font-size:12px;
  margin-bottom:auto;
}

.pc-meta strong{
  color:var(--t2);
  font-weight:500;
}

/* Stats */
.pc-stats{
  display:flex;
  border-top:1px solid var(--border);
  padding-top:12px;
  flex-shrink:0;
}

.pc-stat{
  flex:1;
  text-align:center;
  padding:0 8px;
  border-right:1px solid var(--border);
}

.pc-stat:last-child{
  border-right:none;
}

.pc-stat-num{
  font-family:'Syne',sans-serif;
  font-size:17px;
  font-weight:700;
  color:var(--orange);
}

.pc-stat-lbl{
  font-size:10px;
  color:var(--t3);
  margin-top:2px;
}

/* Skeleton */
.sk{
  background:rgba(255,255,255,.06);
  border-radius:7px;
  animation:pulse 1.6s ease-in-out infinite;
}

@keyframes pulse{
  0%,100%{opacity:1}
  50%{opacity:.4}
}

/* Toast */
.pc-toast{
  position:fixed;
  bottom:22px;
  left:50%;
  transform:translateX(-50%);
  background:var(--card);
  border:1px solid rgba(34,208,122,.3);
  color:var(--green);
  font-size:12.5px;
  font-weight:600;
  padding:9px 18px;
  border-radius:30px;
  z-index:200;
}
`;

/* ───────────────────────────────────────────────────────────── */
/* Composant */
/* ───────────────────────────────────────────────────────────── */
export default function ProfileCard({ showStats = true }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .limit(1)
          .maybeSingle();

        setProfile(
          data || {
            display_name: "SocialApp",
            role: "Fondateur & CEO",
            handle: "social",
            website_url: "https://www.socialapp.work/social",
            member_since: "25/04/2027",
            avatar_url: null,
            avatar_letter: "S",
          }
        );
      } catch {
        setProfile({
          display_name: "SocialApp",
          role: "Fondateur & CEO",
          handle: "social",
          website_url: "https://www.socialapp.work/social",
          member_since: "25/04/2027",
          avatar_url: null,
          avatar_letter: "S",
        });
      }

      setLoading(false);
    };

    load();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profile?.website_url || "");
      setCopied(true);
      showToast("✓ Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("⚠ Impossible de copier");
    }
  };

  return (
    <>
      <style>{STYLE}</style>

      <div className="pc-root">
        {/* Top */}
        <div className="pc-top">
          <div className="pc-avatar-wrap">
            {loading ? (
              <div
                className="sk"
                style={{ width: 58, height: 58, borderRadius: "50%" }}
              />
            ) : profile?.avatar_url && !imgError ? (
              <img
                className="pc-avatar"
                src={profile.avatar_url}
                alt={profile.display_name}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="pc-avatar-fallback">
                {profile?.avatar_letter || "S"}
              </div>
            )}

            <div className="pc-avatar-edit">✏</div>
          </div>

          <div className="pc-info">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div className="sk" style={{ height: 17, width: "65%" }} />
                <div className="sk" style={{ height: 13, width: "45%" }} />
                <div className="sk" style={{ height: 13, width: "35%" }} />
              </div>
            ) : (
              <>
                <div className="pc-name">
                  {profile?.display_name || "SocialApp"}
                  <span className="pc-verified">✓</span>
                </div>
                <div className="pc-role">
                  {profile?.role || "Fondateur & CEO"}
                </div>
                <div className="pc-handle">
                  @{profile?.handle || "social"}
                </div>
              </>
            )}
          </div>

          <div className="pc-quick">
            <div className="pc-qbtn">✏</div>
            <div className="pc-qbtn">↗</div>
          </div>
        </div>

        {/* URL */}
        {loading ? (
          <div className="sk" style={{ height: 42, borderRadius: 10 }} />
        ) : (
          <div className="pc-url-wrap" onClick={handleCopy}>
            <span className="pc-url-text">
              {profile?.website_url}
            </span>
            <button className={`pc-copy-btn${copied ? " ok" : ""}`}>
              {copied ? "✓" : "⧉"}
            </button>
          </div>
        )}

        {/* Date */}
        {loading ? (
          <div className="sk" style={{ height: 16, width: "55%" }} />
        ) : (
          <div className="pc-meta">
            🕐 Membre depuis le <strong>{profile?.member_since}</strong>
          </div>
        )}

        {/* Stats */}
        {showStats && !loading && (
          <div className="pc-stats">
            <div className="pc-stat">
              <div className="pc-stat-num">4 210</div>
              <div className="pc-stat-lbl">Vues</div>
            </div>

            <div className="pc-stat">
              <div
                className="pc-stat-num"
                style={{ color: "#22d07a" }}
              >
                215
              </div>
              <div className="pc-stat-lbl">Leads</div>
            </div>

            <div className="pc-stat">
              <div
                className="pc-stat-num"
                style={{ color: "#4d9cf8" }}
              >
                842
              </div>
              <div className="pc-stat-lbl">Clics</div>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="pc-toast">{toast}</div>}
    </>
  );
}
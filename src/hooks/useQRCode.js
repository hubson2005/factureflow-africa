import { useEffect, useState } from "react";

// Genere une image QR code (data URL PNG) a partir d'un texte/URL, cote client,
// sans appel reseau externe (pas de depeendance a un service tiers pour un
// element qui doit apparaitre sur une facture officielle).
//
// Necessite le paquet npm "qrcode" (leger, largement utilise, pas de dependances
// natives) :   npm install qrcode
//
// Usage : const { dataUrl, loading, error } = useQRCode(invoice.fne_qr_token);
export function useQRCode(text, options = {}) {
  const [dataUrl, setDataUrl] = useState(null);
  const [loading, setLoading] = useState(!!text);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!text) {
      setDataUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    import("qrcode")
      .then((QRCode) => QRCode.toDataURL(text, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: options.width || 256,
        color: {
          dark: options.darkColor || "#000000",
          light: options.lightColor || "#FFFFFF",
        },
      }))
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [text, options.width, options.darkColor, options.lightColor]);

  return { dataUrl, loading, error };
}
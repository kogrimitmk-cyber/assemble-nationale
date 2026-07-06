// ═══════════════════════════════════════════════════════════════
// TOTP (RFC 6238) — Authentification à deux facteurs
// Implémenté avec le module natif `crypto` : aucune dépendance
// supplémentaire. Compatible Google Authenticator, FreeOTP, Aegis…
// ═══════════════════════════════════════════════════════════════

const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Encode un Buffer en Base32 (sans padding, format otpauth). */
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

/** Décode une chaîne Base32 en Buffer. */
function base32Decode(str) {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Génère un nouveau secret TOTP (20 octets aléatoires, Base32). */
function genererSecret() {
  return base32Encode(crypto.randomBytes(20));
}

/** Calcule le code HOTP à 6 chiffres pour un compteur donné. */
function hotp(secretBase32, compteur) {
  const cle = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(compteur));
  const hmac = crypto.createHmac('sha1', cle).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 1_000_000).padStart(6, '0');
}

/**
 * Vérifie un code TOTP. Tolère ±1 fenêtre de 30 s pour absorber
 * les horloges légèrement décalées (fréquent sur mobile).
 */
function verifierCode(secretBase32, code, fenetre = 1) {
  if (!secretBase32 || !/^\d{6}$/.test(String(code || '').trim())) return false;
  const codePropre = String(code).trim();
  const compteurActuel = Math.floor(Date.now() / 1000 / 30);
  for (let i = -fenetre; i <= fenetre; i++) {
    const attendu = hotp(secretBase32, compteurActuel + i);
    if (crypto.timingSafeEqual(Buffer.from(attendu), Buffer.from(codePropre))) {
      return true;
    }
  }
  return false;
}

/** Construit l'URL otpauth:// à saisir/scanner dans l'application OTP. */
function urlOtpAuth(secretBase32, compte, emetteur = 'AN Connect Tchad') {
  const label = encodeURIComponent(`${emetteur}:${compte}`);
  const issuer = encodeURIComponent(emetteur);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = { genererSecret, verifierCode, urlOtpAuth };

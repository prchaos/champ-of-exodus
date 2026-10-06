import * as OTPAuth from "otpauth";

// RFC 6238 defaults (30s period, 6 digits, SHA1) — the values every
// authenticator app (Google Authenticator, Microsoft Authenticator) assumes
// when it isn't told otherwise.
const ISSUER = "Champ of Exodus Admin";

function buildTotp(secretBase32: string, username?: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: username ?? "admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildOtpauthUrl(secretBase32: string, username: string): string {
  return buildTotp(secretBase32, username).toString();
}

/** Allows one step (±30s) of clock drift between server and authenticator app. */
export function verifyTotpToken(secretBase32: string, token: string): boolean {
  const delta = buildTotp(secretBase32).validate({ token, window: 1 });
  return delta !== null;
}

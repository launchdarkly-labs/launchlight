export const FORCE_VARIATION_COOKIE = "webexp_force"; // <flagKey>:<variationKey>
export const PREVIEW_TOKEN_COOKIE = "webexp_preview";
export const DEVICE_ID_COOKIE = "webexp_did"; // anonymous device key

export function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : null;
}



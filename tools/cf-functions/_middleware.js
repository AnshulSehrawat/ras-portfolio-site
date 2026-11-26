// Password gate for the whole site (owner 2026-11-26: private, free, no card). The password is the Pages secret
// SITE_PASSWORD; the owner's copy is in the macOS Keychain, item "RA.S portfolio site". Any username works.
export async function onRequest({ request, env, next }) {
  const [scheme, enc] = (request.headers.get("Authorization") || "").split(" ");
  if (scheme === "Basic" && enc && env.SITE_PASSWORD) {
    const pass = atob(enc).split(":").slice(1).join(":");
    if (pass === env.SITE_PASSWORD) return next();
  }
  return new Response("Private site", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="RA.S portfolio", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

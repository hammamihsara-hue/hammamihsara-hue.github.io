/**
 * Preview gate: the whole site sits behind HTTP Basic Auth while it is
 * shown privately. The password lives in the SITE_PASSWORD project secret —
 * delete the secret (and redeploy) to open the site to the world.
 * Any username is accepted; only the password matters.
 */
export async function onRequest(context) {
  const password = context.env.SITE_PASSWORD;
  if (!password) return context.next(); // no secret set → site is public

  const header = context.request.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(':') + 1);
      if (given === password) return context.next();
    } catch {
      // fall through to the challenge
    }
  }

  return new Response('this book is not yet public — please open with the password.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="sara h. hammami"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

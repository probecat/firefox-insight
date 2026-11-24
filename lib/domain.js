// Maps a URL to the site it is tracked under (its registrable domain, e.g.
// mail.google.com -> google.com, news.bbc.co.uk -> bbc.co.uk).
//
// The full Public Suffix List is about 230 KB, so this is an approximation.
// It keeps the last two labels. It keeps three when the second-level label is
// a common ccTLD registry level (co.uk, com.au, ne.jp, ...) or a popular
// shared-hosting suffix (github.io, ...).

const CC_SECOND_LEVELS = new Set([
  'ac', 'asn', 'co', 'com', 'edu', 'gen', 'go', 'gob', 'gouv', 'gov', 'govt', 'idv',
  'k12', 'ltd', 'mil', 'ne', 'net', 'nhs', 'nic', 'nom', 'or', 'org', 'plc', 'police', 'sch',
]);

const SHARED_SUFFIXES = new Set([
  'appspot.com', 'azurewebsites.net', 'blogspot.com', 'cloudfront.net', 'codeberg.page',
  'deno.dev', 'firebaseapp.com', 'fly.dev', 'github.io', 'gitlab.io', 'glitch.me',
  'herokuapp.com', 'myshopify.com', 'neocities.org', 'netlify.app', 'ngrok-free.app',
  'ngrok.io', 'onrender.com', 'pages.dev', 'readthedocs.io', 's3.amazonaws.com',
  'sourceforge.io', 'surge.sh', 'translate.goog', 'vercel.app', 'web.app', 'workers.dev',
]);

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** Returns the tracked site for a URL, or null for untracked URLs. */
export function domainOf(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  const host = u.hostname.replace(/\.$/, '');
  if (IPV4.test(host) || host.startsWith('[')) return host;

  const labels = host.split('.');
  if (labels.length < 2) return null; // localhost, intranet names

  const lastTwo = labels.slice(-2).join('.');
  const [sld, tld] = labels.slice(-2);
  const suffixIsTwoLabels =
    SHARED_SUFFIXES.has(lastTwo) || (tld.length === 2 && CC_SECOND_LEVELS.has(sld));

  if (!suffixIsTwoLabels) return lastTwo;
  return labels.length >= 3 ? labels.slice(-3).join('.') : null;
}

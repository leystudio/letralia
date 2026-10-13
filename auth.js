const config = window.LETRALIA_SUPABASE || {};
export const authReady = Boolean(config.url && config.anonKey);
export let client = null;
let initializing;
export async function initAuth() {
  if (!authReady) return null;
  if (client) return client;
  if (!initializing) initializing = (async () => {
    if (!window.supabase?.createClient) await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('./vendor/supabase-2.57.4.js', import.meta.url).href;
      const timeout = setTimeout(() => reject(new Error('No pudimos cargar las cuentas. Inténtalo de nuevo.')), 12000);
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = () => { clearTimeout(timeout); reject(new Error('No pudimos cargar las cuentas.')); };
      document.head.append(script);
    });
    client = window.supabase.createClient(config.url, config.anonKey, {
      global: { fetch: (url, options = {}) => fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(15000) }) },
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
    });
    return client;
  })().catch(error => { initializing = null; throw error; });
  return initializing;
}
export async function getSession() {
  if (!await initAuth()) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}
export async function signInWithEmail(email) {
  if (!await initAuth()) throw new Error('Las cuentas todavía no están disponibles. Puedes jugar como invitado.');
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  if (error) throw error;
}
export async function signOut() {
  if (!client) return;
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
export function onAuthChange(callback) {
  if (!client) return () => {};
  // Do not make database calls while Supabase holds its authentication lock.
  const { data } = client.auth.onAuthStateChange((event, session) => setTimeout(() => callback(event, session), 0));
  return () => data.subscription.unsubscribe();
}
export function consumeAuthError() {
  const hash = new URLSearchParams(location.hash.slice(1)), query = new URLSearchParams(location.search);
  if (!hash.has('error') && !query.has('error')) return false;
  history.replaceState(null, '', location.pathname);
  return true;
}

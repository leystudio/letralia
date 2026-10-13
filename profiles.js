import { client } from './auth.js?v=26';
import { createProgressStore } from './progress-store.js?v=26';
export const avatars = [
  { id: 'fox', emoji: '🦊', name: 'Zorro' }, { id: 'lion', emoji: '🦁', name: 'León' },
  { id: 'rabbit', emoji: '🐰', name: 'Conejo' }, { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'tiger', emoji: '🐯', name: 'Tigre' }, { id: 'unicorn', emoji: '🦄', name: 'Unicornio' }
];
let storage;
try { storage = localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw Error('Storage unavailable'); }, removeItem() {} }; }
export const store = createProgressStore({ storage, upload: saveProgress,
  notify: message => window.dispatchEvent(new CustomEvent('letralia-storage-warning', { detail: message })) });
export const readLocalProgress = () => store.read('letralia-v1');
export function saveGuestProgress(data) { return store.write('letralia-v1', data); }
export function clearGuestProgress() { store.remove('letralia-v1'); }
export const activeChildId = store.activeId;
export const setActiveChildId = store.setActive;
export const queueProgress = store.queue;
export const flushPending = store.flush;
export function setAccount(userId) { store.setOwner(userId); }
const cacheKey = () => `letralia-account:${store.ownerId()}:children`;
function requireAccount() { if (!client || !store.ownerId()) throw Error('Vuelve a entrar con tu correo.'); }
export async function listChildren() {
  requireAccount(); const owner = store.ownerId();
  const { data, error } = await client.from('children').select('id,nickname,avatar,age_band,created_at').order('created_at');
  if (owner !== store.ownerId()) throw Error('La cuenta cambió.');
  if (error) { const cached = store.read(cacheKey()); if (!navigator.onLine && cached) return cached; throw error; }
  const children = data || []; store.write(cacheKey(), children); return children;
}
function validate(changes) {
  const nickname = String(changes.nickname || '').trim();
  if (!nickname || nickname.length > 24) throw Error('El apodo debe tener entre 1 y 24 caracteres.');
  if (!avatars.some(a => a.id === changes.avatar)) throw Error('Elige un avatar.');
  return { nickname, avatar: changes.avatar };
}
export async function addChild(draft) {
  requireAccount();
  if (!['4-5', '6-7', '8+'].includes(draft.age_band)) throw Error('Elige un rango de edad.');
  const { data, error } = await client.from('children').insert({ ...validate(draft), age_band: draft.age_band }).select('id,nickname,avatar,age_band').single();
  if (error) throw error; return data;
}
export async function updateChild(id, changes) {
  requireAccount(); const { error } = await client.from('children').update(validate(changes)).eq('id', id);
  if (error) throw error;
}
export async function deleteChild(id) {
  requireAccount(); const { error } = await client.from('children').delete().eq('id', id);
  if (error) throw error; store.forget(id);
}
export async function saveProgress(childId, data, owner = store.ownerId()) {
  requireAccount(); if (owner !== store.ownerId()) throw Error('La cuenta cambió.');
  const { error } = await client.from('progress').upsert({ child_id: childId, data });
  if (error) throw error;
}
export async function syncOnFirstUse(childId) {
  requireAccount(); const owner = store.ownerId(), cached = store.cached(childId);
  if (cached?.pending_sync) {
    await store.flush(childId).catch(() => {});
    if (owner !== store.ownerId()) throw Error('La cuenta cambió.');
    return { data: store.cached(childId)?.data || cached.data, recovered: false };
  }
  if (!navigator.onLine) {
    if (cached) return { data: cached.data, recovered: false };
    throw Error('Conecta este equipo a internet para abrir este perfil por primera vez.');
  }
  const guest = store.read('letralia_guest_imported_by') ? {} : readLocalProgress() || {};
  const { data, error } = await client.rpc('initialize_child_progress', { target_child: childId, guest_data: guest });
  if (owner !== store.ownerId()) throw Error('La cuenta cambió.');
  if (error) { if (cached && !error.code) return { data: cached.data, recovered: false }; throw error; }
  store.acceptCloud(childId, data.data);
  if (data.imported) store.write('letralia_guest_imported_by', owner);
  return { data: data.data, recovered: data.imported };
}

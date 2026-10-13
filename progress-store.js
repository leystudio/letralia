// Per-account caches never overwrite the original guest progress.
export function createProgressStore({ storage, upload, online = () => navigator.onLine, notify = () => {} }) {
  let owner = null, active = null, epoch = 0;
  const timers = new Map(), running = new Map(), memory = new Map();
  const prefix = id => `letralia-account:${id}:`;
  const key = (id, user = owner) => `${prefix(user)}progress:${id}`;
  function read(k) { if (memory.has(k)) return memory.get(k); try { return JSON.parse(storage.getItem(k) || 'null'); } catch { return null; } }
  function write(k, value) {
    memory.set(k, value);
    try { storage.setItem(k, JSON.stringify(value)); memory.delete(k); return true; }
    catch { notify('No hay espacio para guardar en este equipo. Mantén esta página abierta hasta sincronizar.'); return false; }
  }
  function remove(k) { memory.delete(k); try { storage.removeItem(k); } catch {} }
  function setOwner(id) {
    if (owner === id) return;
    epoch++; owner = id; active = null;
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear(); running.clear(); remove('letralia_active_child');
  }
  function setActive(id) {
    active = owner ? id : null;
    if (active) write('letralia_active_child', { owner, id: active }); else remove('letralia_active_child');
  }
  function cached(id) { return owner ? read(key(id)) : null; }
  function acceptCloud(id, data) { write(key(id), { data, pending_sync: false }); }
  function queue(id, data) {
    if (!owner || !id || id !== active) return;
    write(key(id), { data: JSON.parse(JSON.stringify(data)), pending_sync: true, revision: crypto.randomUUID() });
    clearTimeout(timers.get(id));
    timers.set(id, setTimeout(() => { timers.delete(id); flush(id).catch(() => {}); }, 2000));
  }
  async function flush(id) {
    if (!owner || !id || !online()) return;
    if (running.has(id)) return running.get(id);
    const user = owner, generation = epoch, k = key(id);
    const job = (async () => {
      while (owner === user && epoch === generation && online()) {
        const record = read(k);
        if (!record?.pending_sync) break;
        await upload(id, record.data, user);
        if (owner !== user || epoch !== generation) return;
        const latest = read(k);
        if (latest?.revision === record.revision) write(k, { ...latest, pending_sync: false });
      }
    })();
    running.set(id, job);
    try { await job; } finally { if (running.get(id) === job) running.delete(id); }
  }
  async function flushAll(ids) { await Promise.all(ids.map(id => flush(id))); }
  function forget(id) { clearTimeout(timers.get(id)); timers.delete(id); remove(key(id)); if (active === id) setActive(null); }
  function forgetOwner() {
    if (!owner) return;
    const keys = new Set(memory.keys());
    try { for (let i = 0; i < storage.length; i++) keys.add(storage.key(i)); } catch {}
    for (const k of keys) if (k?.startsWith(prefix(owner))) remove(k);
    setOwner(null);
  }
  return { read, write, remove, setOwner, setActive, cached, acceptCloud, queue, flush, flushAll, forget, forgetOwner,
    activeId: () => active, ownerId: () => owner };
}

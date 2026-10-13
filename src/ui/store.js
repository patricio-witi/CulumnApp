// Datos personales (registro de crisis, plan, síntomas): privados para cada persona.
// En claude.ai se guardan en el almacenamiento privado del artifact (data/users/<id>/…, invisible incluso para
// el dueño del artifact); fuera de claude.ai (GitHub Pages) quedan solo en este navegador.
const LS_KEY = 'columna-mi-caso-v1';
const EMPTY = () => ({ v: 1, diary: [], plan: {}, symptoms: {}, questions: {}, walk: { minutes: 10, days: 3 } });

function readLocal() {
  try { const s = localStorage.getItem(LS_KEY); if (s) return { ...EMPTY(), ...JSON.parse(s) }; } catch (e) { /* sin almacenamiento */ }
  return EMPTY();
}
function writeLocal(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
}

export class PersonalStore {
  constructor() {
    this.data = readLocal();
    this.mode = 'local'; // 'local' | 'db'
    this.listeners = new Set();
    this.writing = false;
    this.pending = false;
    this.error = null;
    this.ready = this.connect();
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(this.data); }

  async connect() {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      this.ref = db.doc(`data/users/${id}/columna`);
      this.downloads = await c.use('downloads');
      let first = true;
      this.unsub = this.ref.onSnapshot((snap) => {
        const d = snap.exists ? snap.data() : null;
        if (d) {
          this.data = { ...EMPTY(), ...JSON.parse(JSON.stringify(d)) };
          this.mode = 'db';
          this.emit();
        } else if (first) {
          // primera vez en claude.ai: si había datos en este navegador, se suben al almacenamiento privado
          this.mode = 'db';
          const local = readLocal();
          if (local.diary.length || Object.keys(local.plan).length) { this.data = local; this.save(); }
          this.emit();
        }
        first = false;
      }, (e) => { this.error = e.code; this.mode = 'local'; this.emit(); });
    } catch (e) {
      this.mode = 'local';
    }
  }

  get(key) { return this.data[key]; }

  set(key, value) {
    this.data = { ...this.data, [key]: value };
    this.emit();
    return this.save();
  }

  // una escritura a la vez; si llegan cambios mientras tanto, se escribe el último estado al terminar
  async save() {
    writeLocal(this.data);
    if (this.mode !== 'db' || !this.ref) return;
    if (this.writing) { this.pending = true; return; }
    this.writing = true;
    try {
      do {
        this.pending = false;
        await this.ref.set(JSON.parse(JSON.stringify(this.data)));
      } while (this.pending);
      this.error = null;
    } catch (e) {
      this.error = e?.code || 'unavailable';
      this.emit();
    } finally {
      this.writing = false;
    }
  }

  // ofrecer un archivo: con la capacidad de descargas en claude.ai, o con un enlace normal fuera de ella
  async download(filename, text, mime = 'text/plain') {
    if (this.downloads) {
      try { await this.downloads.save({ filename, data: text }); return 'saved'; } catch (e) { return e?.code || 'error'; }
    }
    try {
      const url = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return 'saved';
    } catch (e) { return 'error'; }
  }
}

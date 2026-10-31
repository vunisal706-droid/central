/* Asistente del cole · Capitoolappciones
   Buscador que responde con el texto exacto de los documentos del centro:
   Plan de Centro (proyectocentro), CapiGuía y protocolos de Convive+.
   Los documentos se leen de sus propias apps, así que siempre está al día.
   No usa IA ni envía nada fuera: todo se busca en el propio dispositivo. */
(function () {
  'use strict';

  const BASE = '/';                       // vunisal706-droid.github.io/
  const CACHE = 'capi-asistente-v1';
  const PC = BASE + 'proyectocentro/';
  const FUENTES_PC = [
    ['resumenes', 'Plan de Centro · Resumen'],
    ['pe', 'Proyecto Educativo'],
    ['rof', 'ROF'],
    ['gestion', 'Proyecto de Gestión'],
    ['anexos', 'Plan de Centro · Anexos']
  ];

  // ── Texto ─────────────────────────────────────────────────────
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const STOP = new Set(('a al algo algun alguna algunas alguno algunos ante antes aquel aquella aquello asi aun cada como con contra cual cuales cuando de del desde donde dos el ella ellas ellos en entre era es esa esas ese eso esos esta estas este esto estos fue fueron ha han hasta hay la las le les lo los mas me mi mis muy nada ni no nos o os otra otras otro otros para pero poco por porque que quien se sea segun ser si sido sin sobre son su sus tambien tan tanto te tiene tienen todo todos tu tus un una unas uno unos y ya yo hacer hago hace hacemos tengo debo debe deben puedo puede pueden quiero cosa cosas forma manera caso vez veces mismo misma cuanto cuantos cuanta cuantas cual qué cómo ademas dentro fuera parte etc').split(' ').map(norm));
  const SUF = ['amientos', 'imientos', 'amiento', 'imiento', 'aciones', 'iciones', 'idades', 'mente', 'acion', 'icion', 'ciones', 'cion', 'idad', 'ables', 'ibles', 'able', 'ible', 'istas', 'ista', 'ando', 'iendo', 'adas', 'ados', 'idas', 'idos', 'ada', 'ado', 'ida', 'ido', 'aran', 'eran', 'ar', 'er', 'ir', 'es', 'as', 'os', 'a', 'o', 'e', 's'];
  function raiz(w) {
    if (w.length <= 4) return w;
    for (const s of SUF) if (w.endsWith(s) && w.length - s.length >= 4) return w.slice(0, -s.length);
    return w;
  }
  const palabras = t => norm(t).split(/[^a-z0-9ñ]+/).filter(w => w.length > 1 && !STOP.has(w));
  const raices = t => palabras(t).map(raiz);

  // Sinónimos del día a día del cole (se buscan también estas palabras)
  const SINONIMOS = [
    ['lluvia', 'llueve', 'llover', 'lluvioso', 'mal tiempo'],
    ['recreo', 'patio', 'descanso'],
    ['entrada', 'entrar', 'llegada', 'puerta', 'cancela'],
    ['salida', 'salir', 'recogida', 'recoger'],
    ['falta', 'faltas', 'ausencia', 'absentismo', 'asistencia', 'justificante'],
    ['enfermo', 'enferma', 'malo', 'mala', 'fiebre', 'vomita', 'enfermedad', 'salud', 'accidente', 'herida', 'botiquin', 'medicacion', 'medicamento'],
    ['sustituto', 'sustituta', 'sustitucion', 'nuevo', 'nueva', 'incorporacion', 'acabas de llegar', 'llegar', 'primera semana', 'recien llegado'],
    ['parte', 'incidencia', 'conducta', 'convivencia', 'sancion', 'correccion', 'castigo'],
    ['pelea', 'agresion', 'pegar', 'golpe'],
    ['acoso', 'bullying', 'ciberacoso', 'maltrato'],
    ['padres', 'madres', 'familia', 'familias', 'tutores legales'],
    ['deberes', 'tareas', 'tarea'],
    ['examen', 'examenes', 'prueba', 'pruebas', 'control'],
    ['nota', 'notas', 'calificacion', 'evaluacion', 'evaluar', 'boletin'],
    ['repetir', 'repite', 'promocion', 'promocionar', 'permanencia'],
    ['excursion', 'salida escolar', 'actividad complementaria', 'extraescolar'],
    ['guardia', 'guardias', 'vigilancia', 'vigilar'],
    ['movil', 'telefono', 'dispositivo'],
    ['horario', 'hora', 'jornada'],
    ['lectura', 'leer', 'lector', 'comprension lectora'],
    ['problemas', 'resolucion de problemas', 'matematicas'],
    ['dificultad', 'dificultades', 'neae', 'refuerzo', 'diversidad', 'apoyo'],
    ['reunion', 'reuniones', 'claustro', 'consejo escolar', 'ciclo', 'etcp'],
    ['tutoria', 'tutor', 'tutora'],
    ['comedor', 'almuerzo', 'desayuno'],
    ['festivo', 'vacaciones', 'puente', 'no hay cole', 'dia sin cole', 'no lectivo']
  ].map(g => g.map(x => raices(x).join(' ')));
  // Devuelve término → {w: peso, b: palabra de la pregunta de la que sale}
  function expandir(rs) {
    const out = new Map(rs.map(r => [r, { w: 1, b: r }]));
    rs.forEach(r => SINONIMOS.forEach(g => {
      if (g.some(x => x === r || x.split(' ').includes(r))) g.forEach(x => x.split(' ').forEach(y => { if (!out.has(y) && !STOP.has(y)) out.set(y, { w: 0.8, b: r }); }));
    }));
    return out;
  }

  // ── Fuentes ───────────────────────────────────────────────────
  async function traer(url, tipo) {
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      try { const c = await caches.open(CACHE); c.put(url, r.clone()); } catch (e) { }
      return await r.text();
    } catch (e) {
      try { const c = await caches.open(CACHE); const m = await c.match(url); if (m) return await m.text(); } catch (e2) { }
      return null;
    }
  }
  const limpio = t => String(t || '').replace(/\s+/g, ' ').trim();

  function trocearBloques(bloques, base, maxLen) {
    // bloques: [{tipo:'h', txt, id} | {tipo:'t', txt}] → trozos con su encabezado
    const out = []; let cab = base.cab, ancla = base.ancla, buf = [], len = 0;
    const cerrar = () => { if (buf.length && len > 40) out.push({ ...base, sub: cab, ancla, bloques: buf.slice() }); buf = []; len = 0; };
    bloques.forEach(b => {
      if (b.tipo === 'h') { cerrar(); cab = b.txt; if (b.id) ancla = b.id; return; }
      if (len + b.txt.length > maxLen && len > 200) cerrar();
      buf.push(b.txt); len += b.txt.length;
    });
    cerrar();
    return out;
  }
  function bloquesDeHTML(root) {
    const out = [];
    const walk = el => {
      for (const n of el.children) {
        const tag = n.tagName;
        if (/^H[1-6]$/.test(tag)) out.push({ tipo: 'h', txt: limpio(n.textContent), id: n.id || null });
        else if (tag === 'TABLE') n.querySelectorAll('tr').forEach(tr => { const t = [...tr.children].map(td => limpio(td.textContent)).filter(Boolean).join(' · '); if (t) out.push({ tipo: 't', txt: t }); });
        else if (/^(P|LI|BLOCKQUOTE|DD|DT|PRE)$/.test(tag)) { const t = limpio(n.textContent); if (t) out.push({ tipo: 't', txt: t }); }
        else if (/^(UL|OL|DIV|SECTION|ARTICLE|DL)$/.test(tag)) {
          if (n.children.length) walk(n); else { const t = limpio(n.textContent); if (t) out.push({ tipo: 't', txt: t }); }
        }
      }
    };
    walk(root);
    return out;
  }

  async function cargarPlanCentro() {
    const trozos = [];
    for (const [f, nombre] of FUENTES_PC) {
      const s = await traer(PC + 'data/' + f + '.js');
      if (!s) continue;
      let arr;
      try { arr = JSON.parse(s.slice(s.indexOf('=[') + 1).trim().replace(/;$/, '')); } catch (e) { continue; }
      arr.forEach(sec => {
        const doc = new DOMParser().parseFromString('<div>' + (sec.html || '') + '</div>', 'text/html');
        const docNombre = f === 'anexos' ? sec.titulo : nombre;
        const base = { fuente: 'Plan de Centro', doc: docNombre, sec: f === 'anexos' ? '' : sec.titulo, cab: '', ancla: sec.id, url: PC + '#', peso: f === 'resumenes' ? 1.08 : 1 };
        trocearBloques(bloquesDeHTML(doc.body.firstChild), base, 850).forEach(t => trozos.push(t));
      });
    }
    return trozos;
  }

  async function cargarCapiGuia() {
    const s = await traer(BASE + 'capiguia/index.html');
    if (!s) return [];
    const doc = new DOMParser().parseFromString(s, 'text/html');
    const trozos = [];
    doc.querySelectorAll('section[id]').forEach(sec => {
      const h2 = sec.querySelector('h2');
      const titulo = limpio(h2 ? h2.textContent.replace(/^\s*\d+\s*/, '') : sec.id);
      const base = { fuente: 'CapiGuía', doc: 'CapiGuía', sec: titulo, ancla: sec.id, url: BASE + 'capiguia/#', peso: 1.3 };
      // Cada desplegable es una pregunta con su respuesta
      sec.querySelectorAll('details').forEach(d => {
        const q = limpio((d.querySelector('summary') || {}).textContent);
        const body = d.querySelector('.details-body') || d;
        const bl = bloquesDeHTML(body).filter(b => b.tipo === 't');
        if (!bl.length) { const t = limpio(body.textContent.replace(q, '')); if (t) bl.push({ tipo: 't', txt: t }); }
        trocearBloques(bl, { ...base, cab: q }, 1100).forEach(t => trozos.push(t));
        d.remove();
      });
      const resto = bloquesDeHTML(sec).filter(b => !(b.tipo === 'h' && b.txt === limpio(h2 && h2.textContent)));
      trocearBloques(resto, { ...base, cab: '' }, 850).forEach(t => trozos.push(t));
    });
    return trozos;
  }

  async function cargarProtocolos() {
    const s = await traer(BASE + 'parteconvivencia/index.html');
    if (!s) return [];
    const doc = new DOMParser().parseFromString(s, 'text/html');
    const tab = doc.getElementById('tab-protocolos');
    if (!tab) return [];
    const trozos = [];
    const intro = limpio((tab.querySelector('.hint') || {}).textContent);
    let seccion = 'Protocolos de actuación';
    tab.querySelectorAll('.section-title, .person-row').forEach(el => {
      if (el.classList.contains('section-title')) { seccion = limpio(el.textContent); return; }
      const nombre = limpio((el.querySelector('.name') || {}).textContent);
      const sub = limpio((el.querySelector('.sub') || {}).textContent);
      if (!nombre) return;
      const enlace = el.tagName === 'A' ? el.getAttribute('href') : null;
      trozos.push({ fuente: 'Convive+', doc: 'Protocolos (Convive+)', sec: seccion, sub: nombre, ancla: '', url: enlace || (BASE + 'parteconvivencia/'), urlDirecta: true,
        bloques: [nombre + (sub ? ': ' + sub : '') + (seccion === 'Protocolos de actuación' && intro ? '. ' + intro : '')], peso: 1 });
    });
    return trozos;
  }

  // ── Índice (BM25) ─────────────────────────────────────────────
  let IDX = null, cargando = null;
  async function preparar() {
    if (IDX) return IDX;
    if (cargando) return cargando;
    cargando = (async () => {
      const partes = await Promise.all([cargarCapiGuia(), cargarPlanCentro(), cargarProtocolos()]);
      const T = partes.flat();
      const df = new Map(), docs = [];
      T.forEach((t, i) => {
        const titulo = raices([t.sec, t.sub].join(' '));
        const cuerpo = raices(t.bloques.join(' '));
        const tf = new Map();
        cuerpo.forEach(r => tf.set(r, (tf.get(r) || 0) + 1));
        titulo.forEach(r => tf.set(r, (tf.get(r) || 0) + 2.5));
        const len = cuerpo.length + titulo.length * 2.5;
        docs.push({ tf, len, texto: norm(t.bloques.join(' ')) });
        tf.forEach((_, r) => df.set(r, (df.get(r) || 0) + 1));
      });
      const avg = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, docs.length);
      IDX = { T, docs, df, avg, N: docs.length };
      return IDX;
    })();
    return cargando;
  }
  function buscar(q, n) {
    const { T, docs, df, avg, N } = IDX;
    const base = raices(q);
    if (!base.length) return [];
    const terms = expandir(base);
    const frase = palabras(q).filter(w => w.length > 3);
    const res = [];
    docs.forEach((d, i) => {
      let s = 0; const cubre = new Set();
      terms.forEach(({ w, b }, r) => {
        const f = d.tf.get(r); if (!f) return;
        const idf = Math.log(1 + (N - df.get(r) + 0.5) / (df.get(r) + 0.5));
        s += w * idf * (f * 2.2) / (f + 1.2 * (1 - 0.75 + 0.75 * d.len / avg));
        cubre.add(b);
      });
      if (!s) return;
      s *= 0.4 + 0.6 * Math.pow(cubre.size / new Set(base).size, 1.5);
      for (let k = 0; k + 1 < frase.length; k++) if (d.texto.includes(norm(frase[k] + ' ' + frase[k + 1]))) s *= 1.25;
      s *= T[i].peso || 1;
      res.push({ i, s });
    });
    res.sort((a, b) => b.s - a.s);
    // Evitar dos trozos casi iguales del mismo apartado
    const out = [], vistos = new Set();
    for (const r of res) {
      const t = T[r.i], k = t.doc + '|' + (t.sub || t.sec);
      if (vistos.has(k)) continue;
      vistos.add(k); out.push({ ...t, score: r.s });
      if (out.length >= n) break;
    }
    return out;
  }

  // ── Días sin cole (calendario del centro) ─────────────────────
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const largo = ds => { const d = new Date(ds + 'T12:00'); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
  async function respuestaCalendario(q) {
    if (!/festiv|vacacion|puente|no hay cole|sin cole|no lectiv|navidad|semana santa|cuando (empieza|acaba|termina)/.test(norm(q))) return '';
    if (!window.CalendarioCole) await new Promise(ok => { const s = document.createElement('script'); s.src = BASE + 'agenda/calendario.js'; s.onload = s.onerror = ok; document.head.appendChild(s); });
    const C = window.CalendarioCole;
    if (!C || !C.proximos) return '';
    try {
      if (C.listo) await Promise.race([C.listo, new Promise(r => setTimeout(r, 2500))]);
      const prox = C.proximos(4) || [];
      if (!prox.length) return '';
      return '<div class="as-cal"><b>📅 Próximos días sin cole</b><ul>' + prox.map(p => '<li>' + esc(p.emoji || '') + ' '
        + (p.hasta && p.hasta !== p.fecha ? '<b>' + esc(p.nombre) + '</b>: del ' + esc(largo(p.fecha)) + ' al ' + esc(largo(p.hasta)) + (p.vuelta ? ' · vuelta el ' + esc(largo(p.vuelta)) : '')
          : '<b>' + esc(largo(p.fecha)) + '</b> · ' + esc(p.nombre)) + '</li>').join('')
        + '</ul><a class="enlace" href="' + BASE + 'agenda/" target="_blank" rel="noopener">Ver el calendario escolar</a></div>';
    } catch (e) { return ''; }
  }

  // ── Interfaz ──────────────────────────────────────────────────
  const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Marca las palabras cuya raíz coincide con la pregunta (o sus sinónimos)
  function resaltar(texto, q) {
    const ts = expandir(raices(q));
    return esc(texto).replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,}/g, w => {
      const n = norm(w);
      return (!STOP.has(n) && ts.has(raiz(n))) ? '<mark>' + w + '</mark>' : w;
    });
  }
  // Puntuación de cada párrafo para enseñar primero el que responde
  function mejoresBloques(t, q) {
    const ts = expandir(raices(q));
    const p = t.bloques.map((b, i) => {
      let s = 0; const vistos = new Set();
      raices(b).forEach(r => { const x = ts.get(r); if (x && !vistos.has(r)) { vistos.add(r); s += x.w; } });
      return { i, s };
    });
    const top = p.slice().sort((a, b) => b.s - a.s)[0];
    if (!top || !top.s) return [0, Math.min(1, t.bloques.length - 1)];
    const i = top.i;
    // El párrafo que responde y el siguiente (suele completar la idea)
    return [i, Math.min(i + 1, t.bloques.length - 1)];
  }
  const enlaceDe = t => t.urlDirecta ? t.url : t.url + (t.ancla || '');
  const ruta = t => [t.doc, t.sec, t.sub].filter((x, i, a) => x && a.indexOf(x) === i).join(' › ');

  const EJEMPLOS = ['¿Qué hago si llueve a la entrada?', '¿Cómo se organiza la vigilancia del recreo?', '¿Qué hago si un alumno se pone malo?', '¿Qué hacer ante un caso de acoso?',
    '¿Cómo se trabaja la lectura en clase?', '¿Cómo se comunican las faltas de asistencia?', 'Soy sustituto, ¿qué tengo que saber?', '¿Cuándo es el próximo día sin cole?'];
  const HIST = 'capi-asistente-historial';
  const leerHist = () => { try { return JSON.parse(localStorage.getItem(HIST)) || []; } catch (e) { return []; } };

  function pintarInicio(box) {
    const h = leerHist();
    box.innerHTML = '<p class="as-hint">Prueba con alguna de estas preguntas:</p><div class="as-chips">' + EJEMPLOS.map(e => '<button class="as-chip">' + esc(e) + '</button>').join('') + '</div>'
      + (h.length ? '<p class="as-hint" style="margin-top:16px">Tus últimas preguntas:</p><div class="as-chips">' + h.map(e => '<button class="as-chip as-hist">' + esc(e) + '</button>').join('') + '</div>' : '');
    box.querySelectorAll('.as-chip').forEach(b => b.onclick = () => { document.getElementById('asPregunta').value = b.textContent; preguntar(); });
  }

  async function preguntar() {
    const inp = document.getElementById('asPregunta'), box = document.getElementById('asRespuesta');
    const q = inp.value.trim();
    if (!q) { pintarInicio(box); return; }
    try { const h = leerHist().filter(x => x !== q); h.unshift(q); localStorage.setItem(HIST, JSON.stringify(h.slice(0, 6))); } catch (e) { }
    if (!IDX) box.innerHTML = '<div class="as-cargando">📚 Leyendo los documentos del centro…</div>';
    try { await preparar(); } catch (e) { }
    if (!IDX || !IDX.N) { box.innerHTML = '<div class="vacio">No he podido leer los documentos. Revisa la conexión e inténtalo de nuevo.</div>'; return; }
    const cal = await respuestaCalendario(q);
    const res = buscar(q, 6);
    const umbral = 2.2;
    let h = cal;
    if (cal && (!res.length || res[0].score < umbral * 3)) {
      // Pregunta de calendario: basta con los próximos días sin cole
    } else if (!res.length || res[0].score < umbral) {
      h += cal ? '' : '<div class="as-nada"><b>No he encontrado nada claro sobre eso en los documentos del centro.</b><br>Prueba con otras palabras (por ejemplo «recreo», «faltas», «evaluación») o consúltalo con Jefatura de Estudios.</div>';
      if (res.length) h += '<p class="as-hint">Quizá te sirva:</p>' + res.slice(0, 3).map(t => filaRes(t, q)).join('');
    } else {
      const t = res[0];
 const [d, hst] = mejoresBloques(t, q), hay = t.bloques.length > (hst - d + 1);
      h += '<article class="as-mejor' + (hay ? '' : ' abierta') + '"><div class="as-ruta">' + esc(ruta(t)) + '</div>'
        + (t.cab && t.cab !== t.sub ? '<h3>' + esc(t.cab) + '</h3>' : '')
        + t.bloques.map((b, k) => '<p class="' + (k >= d && k <= hst ? 'as-clave' : 'as-resto') + '">' + resaltar(b, q) + '</p>').join('')
        + (hay ? '<button class="enlace as-todo">Ver todo el apartado</button> ' : '')
        + '<a class="enlace" href="' + esc(enlaceDe(t)) + '" target="_blank" rel="noopener">Leer en ' + esc(t.fuente === 'Convive+' && t.urlDirecta && !/parteconvivencia/.test(t.url) ? 'el documento oficial' : t.fuente) + ' →</a></article>';
      const otros = res.slice(1).filter(x => x.score > res[0].score * 0.35).slice(0, 3);
      if (otros.length) h += '<p class="as-hint">También puede servirte:</p>' + otros.map(x => filaRes(x, q)).join('');
    }
    h += '<p class="as-pie">Las respuestas son el texto literal de los documentos del centro. Ante la duda, manda siempre el Plan de Centro vigente.</p>';
    box.innerHTML = h;
    box.querySelectorAll('.as-mas').forEach(b => b.onclick = () => { const f = b.closest('.as-fila'); f.classList.toggle('abierta'); b.textContent = f.classList.contains('abierta') ? 'Ver menos' : 'Ver más'; });
    box.querySelectorAll('.as-todo').forEach(b => b.onclick = () => { b.closest('.as-mejor').classList.add('abierta'); b.remove(); });
  }
  function filaRes(t, q) {
    const txt = t.bloques.join(' ');
    return '<div class="as-fila"><div class="as-ruta">' + esc(ruta(t)) + (t.cab && t.cab !== t.sub ? ' › ' + esc(t.cab) : '') + '</div>'
      + '<p class="as-extracto">' + resaltar(txt.length > 260 ? txt.slice(0, 260) + '…' : txt, q) + '</p>'
      + '<p class="as-completo">' + t.bloques.map(b => resaltar(b, q)).join('<br>') + '</p>'
      + '<div class="as-acc"><button class="enlace as-mas">Ver más</button><a class="enlace" href="' + esc(enlaceDe(t)) + '" target="_blank" rel="noopener">Abrir →</a></div></div>';
  }

  function iniciar() {
    const inp = document.getElementById('asPregunta');
    if (!inp) return;
    document.getElementById('asForm').addEventListener('submit', e => { e.preventDefault(); inp.blur(); preguntar(); });
    pintarInicio(document.getElementById('asRespuesta'));
    // Se precargan los documentos en segundo plano para que la primera respuesta sea rápida
    const pre = () => preparar().catch(() => { });
    if ('requestIdleCallback' in window) requestIdleCallback(pre, { timeout: 4000 }); else setTimeout(pre, 2500);
  }
  window.AsistenteCole = { preguntar, preparar, buscar: (q, n) => IDX ? buscar(q, n || 5) : [], get indice() { return IDX; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

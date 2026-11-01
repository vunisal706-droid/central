// Programas del cole · Sesiones (solo días y horas), fotos → PDF para Séneca, anexos firmados en pantalla
// y ayuda para el informe trimestral (Anexo XV). La asistencia del alumnado no se lleva en la app.
'use strict';

// ─── Sesiones dadas del mes (para las horas y la certificación de junio) ───
const BORR2 = {};
function borrSes(g, gid, mes) {
  const k = gid + '|' + mes; if (BORR2[k]) return BORR2[k];
  const S = (D.sesiones || {})[gid] || {}, fechas = new Set(diasPrevistos(g, mes));
  Object.keys(S).filter(f => f.startsWith(mes)).forEach(f => fechas.add(f));
  return (BORR2[k] = { cambiado: false, filas: [...fechas].sort().map(f => ({ f, imp: !!(S[f] && S[f].impartida), prev: !!(S[f] && S[f].impartida) })) });
}
function rSesiones(g, selMes) {
  const B = borrSes(g, grupoSel, mesResumen), R = resumenMes(grupoSel, mesResumen);
  return '<div class="card"><div class="card-h"><h2>🕒 Sesiones dadas en el mes</h2>' + selMes + '</div>' +
    '<p class="small">Marca los días que se dio clase según la hoja firmada que te entregan. Solo sirve para las <b>horas</b> y el <b>importe</b> (certificación de junio y memoria).</p>' +
    (B.filas.length ? '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0">' + B.filas.map((r, i) => { const d = new Date(r.f + 'T12:00'); return '<label class="chip' + (r.imp ? ' on' : '') + '" style="cursor:pointer;display:flex;gap:6px;align-items:center"><input type="checkbox" data-sdia="' + i + '"' + (r.imp ? ' checked' : '') + ' style="width:16px;height:16px">' + DSEM[d.getDay()].slice(0, 3) + ' ' + d.getDate() + '</label>'; }).join('') + '</div>' : '<p class="small muted">Este grupo no tiene días de sesión (Editar grupo).</p>') +
    '<div class="kpis"><div class="kpi"><b>' + R.imp + '</b><span>sesiones guardadas</span></div><div class="kpi"><b>' + R.horas + ' h</b><span>horas</span></div><div class="kpi"><b>' + R.euros + ' €</b><span>a ' + EUROS[g.mod || 'B'] + ' €/h</span></div></div>' +
    '<div class="pie" style="justify-content:flex-start"><button class="btn" data-acc="guardarSes"' + (B.cambiado ? '' : ' disabled') + '>💾 Guardar ' + esc(MESES[+mesResumen.slice(5) - 1]) + '</button> <button class="btn sec peq" data-acc="xPrev">🖨️ Anexo X con fechas previstas</button></div></div>';
}
function guardarSesiones() {
  const g = D.grupos[grupoSel], B = borrSes(g, grupoSel, mesResumen), h = g.horasSesion || 2;
  B.filas.forEach(r => { const ruta = 'sesiones/' + grupoSel + '/' + r.f; if (r.imp && !r.prev) guardar(ruta, { impartida: true, hi: g.hi || '16:00', hf: g.hf || '18:00', horas: h }); else if (!r.imp && r.prev) guardar(ruta, null); });
  delete BORR2[grupoSel + '|' + mesResumen]; toast('Sesiones de ' + MESES[+mesResumen.slice(5) - 1] + ' guardadas'); render();
}

// ─── Para subir a Séneca: fotos de las hojas → PDF con el nombre exacto ───
function tiposSeneca(mes) {
  const t = [];
  if (DOC_MES[mes.slice(5)]) t.push(['x' + mes, 'Hoja de asistencia de empleado (' + DOC_MES[mes.slice(5)] + ')']);
  const tri = trimestreActual();
  t.push(['inf' + tri, 'Informe de evaluación ' + tri + 'º trimestre.'], ['prog', 'Programación'], ['acta', 'Acta de selección del alumnado'], ['baja', 'Baja alumnado'], ['otros', 'Otros']);
  return t;
}
function rSubir(g) {
  const SB = ((D.subidos || {})[grupoSel]) || {};
  return '<div class="card" style="border-left:5px solid var(--ok)"><div class="card-h"><h2>📤 Para subir a Séneca</h2><span class="small muted">Grupo «' + esc(g.nombre) + '» → Detalle y programación → Archivo a importar</span></div>' +
    '<p class="small">Haz fotos de las hojas firmadas (o elige los escaneos) y la app te da <b>un PDF con el nombre del tipo de documento de Séneca</b>, listo para subir.</p>' +
    tiposSeneca(mesResumen).map(([k, t]) => '<div class="item"><div class="cuerpo"><div class="tt">' + esc(t) + '</div>' + (SB[k] ? '<div class="dd">✔ Subido el ' + esc(fechaCorta(SB[k])) + '</div>' : '') + '</div>' +
      '<label class="btn sec peq" style="cursor:pointer">📷 Fotos → PDF<input type="file" accept="image/*,application/pdf" multiple capture="environment" data-fotos="' + esc(t) + '" style="display:none"></label> ' +
      '<label class="small" style="display:flex;gap:4px;align-items:center;margin:0;color:var(--text)"><input type="checkbox" data-subido="' + k + '"' + (SB[k] ? ' checked' : '') + ' style="width:18px;height:18px">Subido</label></div>').join('') +
    '<p class="small muted">Si eliges varias fotos salen en un solo PDF, en el orden en que las elijas. La programación y el acta también se pueden generar ya hechas en «Documentos del grupo».</p></div>';
}
async function fotosAPdf(files, tipo) {
  toast('⏳ Preparando el PDF…');
  try {
    if (!window.jspdf) await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let primera = true;
    for (const f of files) {
      if (/pdf$/i.test(f.type)) { toast('Los PDF ya escaneados se suben tal cual a Séneca: solo cámbiales el nombre.'); continue; }
      const url = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
      const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
      // Gira a vertical si la foto está apaisada y reduce el tamaño
      const rot = img.width > img.height, W = rot ? img.height : img.width, H = rot ? img.width : img.height, k = Math.min(1, 1800 / Math.max(W, H));
      const c = document.createElement('canvas'); c.width = Math.round(W * k); c.height = Math.round(H * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      if (rot) { x.translate(c.width, 0); x.rotate(Math.PI / 2); }
      x.filter = 'contrast(1.15) brightness(1.05)';
      x.drawImage(img, 0, 0, rot ? c.height : c.width, rot ? c.width : c.height);
      const data = c.toDataURL('image/jpeg', 0.82), mw = 200, mh = 287, r = Math.min(mw / c.width, mh / c.height), w = c.width * r, h = c.height * r;
      if (!primera) pdf.addPage(); primera = false;
      pdf.addImage(data, 'JPEG', (210 - w) / 2, (297 - h) / 2, w, h);
    }
    if (primera) return;
    const nombre = (D.grupos[grupoSel].nombre + ' - ' + tipo).replace(/[\\/:*?"<>|]/g, '').replace(/\.$/, '') + '.pdf';
    pdf.save(nombre); toast('✔ Descargado: ' + nombre);
  } catch (e) { console.warn(e); toast('No se ha podido crear el PDF', 'err'); }
}

// ─── Monitores: rellenar el Anexo X y el XII en pantalla y firmar con el dedo ───
const FKEY = (gid, mes) => 'programas-firma-' + gid + '-' + mes;
function rellenoMon(gid, mes) { try { return JSON.parse(localStorage.getItem(FKEY(gid, mes)) || 'null'); } catch (e) { return null; } }
function dlgRellenar() {
  const g = D.grupos[grupoSel], mes = mesResumen, A = Object.entries(g.alumnos || {}), prev = diasPrevistos(g, mes);
  const R = rellenoMon(grupoSel, mes) || { dias: {}, firma: localStorage.getItem('programas-firma-mia') || '' };
  prev.forEach(f => { if (!R.dias[f]) R.dias[f] = { dada: false, aus: [], obs: '' }; });
  const fechas = Object.keys(R.dias).sort();
  $('dlgIn').innerHTML = '<h2>✍️ ' + esc(g.nombre) + ' · ' + esc(MESES[+mes.slice(5) - 1]) + '</h2><p class="small muted">Marca las sesiones que diste y quién faltó. Se guarda en este móvil u ordenador.</p>' +
    '<div class="tabla"><table><tr><th>Día</th><th>¿Se dio?</th><th>Faltan</th><th>Observaciones</th></tr>' + fechas.map(f => { const x = R.dias[f], d = new Date(f + 'T12:00'); return '<tr><td><b>' + DSEM[d.getDay()].slice(0, 3) + ' ' + d.getDate() + '</b></td><td><input type="checkbox" class="chk" data-rd="' + f + '"' + (x.dada ? ' checked' : '') + '></td><td>' + A.map(([aid, a]) => '<button type="button" class="chip' + (x.aus.includes(aid) ? ' on' : '') + '" data-ra="' + f + '|' + aid + '" style="padding:3px 8px;margin:1px">' + esc(a.siglas) + '</button>').join('') + '</td><td><input data-ro="' + f + '" value="' + esc(x.obs) + '" style="padding:4px"></td></tr>'; }).join('') + '</table></div>' +
    '<label>Tu firma (con el dedo o el ratón)</label><canvas id="firmaCv" width="560" height="150" style="width:100%;max-width:560px;height:150px;border:1px dashed var(--border);border-radius:10px;background:#fff;touch-action:none"></canvas>' +
    '<div><button type="button" class="btn sec peq" id="firmaBorrar">Borrar firma</button></div>' +
    '<div class="pie"><button class="btn sec" id="rlC">Cerrar</button><button class="btn sec" id="rlXII">📄 Anexo XII firmado</button><button class="btn" id="rlX">📄 Anexo X firmado</button></div>';
  $('dlg').showModal();
  const cv = $('firmaCv'), cx = cv.getContext('2d'); cx.lineWidth = 2.2; cx.lineCap = 'round'; cx.strokeStyle = '#1a237e';
  if (R.firma) { const im = new Image(); im.onload = () => cx.drawImage(im, 0, 0); im.src = R.firma; }
  let pinta = false; const pos = e => { const b = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return [(p.clientX - b.left) * cv.width / b.width, (p.clientY - b.top) * cv.height / b.height]; };
  const ini = e => { pinta = true; const [x, y] = pos(e); cx.beginPath(); cx.moveTo(x, y); e.preventDefault(); }, mov = e => { if (!pinta) return; const [x, y] = pos(e); cx.lineTo(x, y); cx.stroke(); e.preventDefault(); }, fin = () => { if (pinta) { pinta = false; R.firma = cv.toDataURL('image/png'); guardarRelleno(); } };
  cv.addEventListener('pointerdown', ini); cv.addEventListener('pointermove', mov); window.addEventListener('pointerup', fin, { once: false });
  const guardarRelleno = () => { try { localStorage.setItem(FKEY(grupoSel, mes), JSON.stringify(R)); if (R.firma) localStorage.setItem('programas-firma-mia', R.firma); } catch (e) { } };
  $('firmaBorrar').onclick = () => { cx.clearRect(0, 0, cv.width, cv.height); R.firma = ''; guardarRelleno(); };
  $('dlgIn').onclick = e => { const b = e.target.closest('[data-ra]'); if (!b) return; const [f, aid] = b.dataset.ra.split('|'), x = R.dias[f]; x.aus = x.aus.includes(aid) ? x.aus.filter(y => y !== aid) : x.aus.concat(aid); b.classList.toggle('on'); guardarRelleno(); };
  $('dlgIn').onchange = e => { const t = e.target; if (t.dataset.rd) R.dias[t.dataset.rd].dada = t.checked; if (t.dataset.ro) R.dias[t.dataset.ro].obs = t.value; guardarRelleno(); };
  $('rlC').onclick = () => $('dlg').close();
  $('rlX').onclick = () => docXFirmado(grupoSel, mes, R);
  $('rlXII').onclick = () => docXIIFirmado(grupoSel, mes, R);
}
const imgFirma = src => src ? '<img src="' + src + '" style="height:30px;max-width:100%">' : '';
function docXFirmado(gid, mes, R) {
  const g = D.grupos[gid], mesTxt = MESES[+mes.slice(5) - 1].toUpperCase() + ' ' + mes.slice(0, 4), F = Object.keys(R.dias).sort().filter(f => R.dias[f].dada), n = Math.max(14, F.length), filas = [];
  for (let i = 0; i < n; i++) { const f = F[i]; filas.push('<tr><td>' + ORD(i + 1) + '</td><td class="c">' + (f ? fechaAnexo(f) : '') + '</td><td class="c">' + (f ? esc((g.hi || '16:00') + ' - ' + (g.hf || '18:00')) : '') + '</td><td class="c">' + (f ? imgFirma(R.firma) : '') + '</td><td>' + (f ? esc(R.dias[f].obs || '') : '') + '</td></tr>'); }
  abrirAnexo(g.nombre + ' - Hoja de asistencia de empleado (' + (DOC_MES[mes.slice(5)] || mesTxt) + ')', ['<h1>ANEXO X. MODELO PARA EL REGISTRO DE LA ASISTENCIA DEL PROFESORADO, MENTORES Y MENTORAS A LAS SESIONES DE ACOMPAÑAMIENTO ESCOLAR Y ACOMPAÑAMIENTO LINGÜÍSTICO PARA ALUMNADO INMIGRANTE.</h1>' +
    cabeceraGrupo(g, mesTxt, false) + '<table class="alto"><colgroup><col style="width:9%"><col style="width:14%"><col style="width:19%"><col style="width:29%"><col style="width:29%"></colgroup><tr><th>Sesión</th><th>Fecha</th><th>Horario</th><th>Firma del mentor/a o profesor/a</th><th>Observaciones (indicar cualquier incidencia)</th></tr>' + filas.join('') + '</table>' +
    '<p class="nota">* Este documento debe ser cumplimentado de forma independiente por grupo y mes de servicio.</p>' + lugarFecha() + firmaDir(true)]);
}
function docXIIFirmado(gid, mes, R) {
  const g = D.grupos[gid], al = g.alumnos || {}, mesTxt = MESES[+mes.slice(5) - 1].toUpperCase() + ' ' + mes.slice(0, 4), F = Object.keys(R.dias).sort().filter(f => R.dias[f].dada), n = Math.max(14, F.length), filas = [], N = nombres(gid);
  for (let i = 0; i < n; i++) { const f = F[i]; const aus = f ? R.dias[f].aus.map(a => N[a] || (al[a] || {}).siglas || '').join(', ') || 'Ninguno' : ''; filas.push('<tr><td>' + ORD(i + 1) + '</td><td class="c">' + (f ? fechaAnexo(f) : '') + '</td><td>' + esc(aus) + '</td><td class="c">' + (f ? imgFirma(R.firma) : '') + '</td></tr>'); }
  abrirAnexo(g.nombre + ' - Anexo XII ausencias ' + mesTxt, ['<h1>ANEXO XII. MODELO PARA EL REGISTRO DE AUSENCIAS DEL ALUMNADO EN EL DESARROLLO DE LOS PROGRAMAS DE ACOMPAÑAMIENTO IMPARTIDOS EN EL CENTRO DOCENTE.</h1>' +
    cabeceraGrupo(g, mesTxt, true) + '<table class="muyalto"><colgroup><col style="width:9%"><col style="width:15%"><col style="width:48%"><col style="width:28%"></colgroup><tr><th>Sesión</th><th>Fecha</th><th>Alumnado ausente<br>(nombre y apellidos)</th><th>Firma del mentor/a o profesor/a</th></tr>' + filas.join('') + '</table>' +
    '<p class="nota">*Entregar a la persona responsable de la coordinación de PROA Andalucía en el centro con carácter mensual.</p>' + lugarFecha() + firmaDir(false)]);
}
// Hojas del monitor: imprimir o rellenar en pantalla
function rHojasMon(g, A, selMes) {
  const prev = diasPrevistos(g, mesResumen), R = rellenoMon(grupoSel, mesResumen), dadas = R ? Object.values(R.dias).filter(x => x.dada).length : 0;
  return '<div class="card"><div class="card-h"><h2>📄 Hojas del mes</h2>' + selMes + '</div>' +
    '<p class="small">Días previstos de ' + esc(MESES[+mesResumen.slice(5) - 1]) + ' (' + esc(diasTxt(g)) + '): <b>' + (prev.map(f => +f.slice(8)).join(', ') || '—') + '</b></p>' +
    '<div class="g2"><div class="card" style="box-shadow:none;margin:0"><b>✍️ En pantalla</b><p class="small muted">Marca los días y quién faltó, firma con el dedo y descarga el Anexo X y el XII ya firmados.' + (dadas ? ' Llevas ' + dadas + ' sesiones marcadas.' : '') + '</p><button class="btn" data-acc="rellenarMon">Rellenar y firmar</button></div>' +
    '<div class="card" style="box-shadow:none;margin:0"><b>🖨️ En papel</b><p class="small muted">Imprime las hojas con las fechas ya puestas y fírmalas a mano.</p><button class="btn sec peq" data-acc="xPrev">Anexo X</button> <button class="btn sec peq" data-acc="xiiBlanco">Anexo XII</button> <button class="btn sec peq" data-acc="xiiiBlanco">Anexo XIII</button></div></div>' +
    '<p class="small muted">Entrega las hojas a dirección a final de mes. Si una sesión no se da, no se recupera.</p></div>';
}

// ─── Informe trimestral (Anexo XV) con ayudas para rellenarlo rápido ───
const CONT_SUG = {
  1: ['Lectura en voz alta con fluidez', 'Comprensión de textos breves', 'Vocabulario', 'Ortografía básica', 'Escritura de oraciones y textos cortos', 'Expresión oral'],
  2: ['Numeración', 'Sumas y restas', 'Multiplicación y tablas', 'División', 'Cálculo mental', 'Resolución de problemas', 'Medida y dinero', 'Fracciones y decimales']
};
const RESP_SUG = {
  q1: ['Sí, es puntual.', 'Casi siempre es puntual.', 'Suele llegar tarde.'],
  q2: ['Participa activamente y termina las tareas.', 'Participa cuando se le anima.', 'Le cuesta participar y terminar las tareas.'],
  q3: ['Sí, tiene un comportamiento adecuado.', 'En general adecuado, con algún aviso puntual.', 'Necesita mejorar su comportamiento.'],
  q4: ['Muy positiva.', 'Positiva.', 'Mejorable.'],
  q5: ['Sí, mejora en la realización de las tareas y en sus resultados.', 'Se observan algunas mejoras.', 'Todavía no se observan mejoras claras.'],
  mejora: ['Seguir reforzando la lectura diaria.', 'Practicar cálculo mental y tablas.', 'Mejorar la organización con la agenda.', 'Mantener la coordinación con la familia.', 'Reforzar la resolución de problemas.']
};
function rInformeXV(A, tri) {
  const C = contXV(grupoSel, tri), lista = k => (C['c' + k] || '').split('\n').map(x => x.trim()).filter(Boolean);
  const chip = (t, attr) => '<button type="button" class="chip" ' + attr + ' style="padding:3px 9px;margin:2px;font-size:.8rem">' + esc(t) + '</button>';
  let h = '<div class="card"><div class="card-h"><h2>📝 Informe trimestral (Anexo XV)</h2><select id="triInf" style="width:auto">' + [1, 2, 3].map(t => '<option value="' + t + '"' + (t === tri ? ' selected' : '') + '>' + t + '.º trimestre</option>').join('') + '</select></div>' +
    '<p class="small muted">1) Elige los contenidos de cada área (valen para todo el grupo). 2) En cada alumno/a, marca cómo va y pulsa las frases que encajen (puedes cambiarlas). 3) Descarga el Anexo XV.</p>' +
    '<div class="g2">' + [1, 2].map(k => '<div><label>Área ' + k + '</label><input data-xvc="a' + k + '" value="' + esc(C['a' + k]) + '"><label>Contenidos (uno por línea)</label><textarea data-xvc="c' + k + '" id="xvc' + k + '" rows="5">' + esc(C['c' + k] || '') + '</textarea>' +
      '<div>' + CONT_SUG[k].filter(s => !lista(k).includes(s)).map(s => chip('＋ ' + s, 'data-xvadd="' + k + '|' + esc(s) + '"')).join('') + '</div></div>').join('') + '</div>';
  if (!A.length) return h + '<p class="muted">El grupo no tiene alumnado.</p></div>';
  h += A.map(([aid, a]) => {
    const inf = ((((D.informes || {})[grupoSel] || {})[aid] || {})['t' + tri]) || {}, hechas = PREG_XV.filter((_, i) => inf['q' + (i + 1)]).length;
    return '<details style="margin:10px 0"><summary>' + esc(a.siglas) + ' <span class="muted small">' + esc(a.curso || '') + ' · ' + (hechas === 5 && inf.mejora ? '✔ completo' : hechas + '/5') + '</span></summary>' +
      (tri > 1 ? '<button type="button" class="btn sec peq" data-xvcopia="' + aid + '" style="margin-top:6px">📋 Copiar del trimestre anterior</button>' : '') +
      [1, 2].map(k => { const it = lista(k); return it.length ? '<p class="small" style="margin-top:8px"><b>' + esc(C['a' + k]) + '</b></p>' + it.map((c, i) => { const v = (inf.e || {})[k + '_' + i] || ''; return '<div style="display:flex;gap:6px;align-items:center;justify-content:space-between;border-bottom:1px solid #edf1f7;padding:4px 0;flex-wrap:wrap"><span>' + esc(c) + '</span><span>' + [['C', 'Conseguido'], ['EP', 'En proceso'], ['SI', 'Sin iniciar']].map(([kk, t]) => '<button type="button" class="chip' + (v === kk ? ' on' : '') + '" data-xvest="' + aid + '|' + k + '_' + i + '|' + kk + '" style="padding:3px 8px;margin:1px;font-size:.78rem">' + t + '</button>').join('') + '</span></div>'; }).join('') : ''; }).join('') +
      PREG_XV.map((q, i) => { const key = 'q' + (i + 1); return '<label>' + esc(q.charAt(0) + q.slice(1).toLowerCase()) + '</label><div>' + RESP_SUG[key].map(s => chip(s, 'data-xvfrase="' + aid + '|' + key + '"')).join('') + '</div><textarea rows="2" data-inf="' + aid + '" data-k="' + key + '">' + esc(inf[key] || '') + '</textarea>'; }).join('') +
      '<label>Propuestas de mejora</label><div>' + RESP_SUG.mejora.map(s => chip('＋ ' + s, 'data-xvfrase="' + aid + '|mejora|add"')).join('') + '</div><textarea rows="2" data-inf="' + aid + '" data-k="mejora">' + esc(inf.mejora || '') + '</textarea></details>';
  }).join('');
  return h + '<div class="pie" style="justify-content:flex-start"><button class="btn" data-acc="anexoXV">📄 Descargar Anexo XV del trimestre</button></div></div>';
}

// ─── Eventos ───
document.addEventListener('click', e => {
  const t = e.target.closest('[data-acc],[data-xvadd],[data-xvest],[data-xvfrase],[data-xvcopia]'); if (!t) return;
  const tri = $('triInf') ? $('triInf').value : 1, base = 'informes/' + grupoSel + '/';
  if (t.dataset.acc === 'guardarSes') return guardarSesiones();
  if (t.dataset.acc === 'rellenarMon') return dlgRellenar();
  if (t.dataset.xvadd) { const [k, s] = t.dataset.xvadd.split('|'), ta = $('xvc' + k), v = (ta.value.trim() ? ta.value.trim() + '\n' : '') + s; guardar(base + '_cont/t' + tri + '/c' + k, v); render(); return; }
  if (t.dataset.xvest) { const [aid, k, v] = t.dataset.xvest.split('|'), cur = (((((D.informes || {})[grupoSel] || {})[aid] || {})['t' + tri] || {}).e || {})[k]; guardar(base + aid + '/t' + tri + '/e/' + k, cur === v ? null : v); t.parentNode.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b === t && cur !== v)); return; }
  if (t.dataset.xvfrase) {
    const [aid, key, add] = t.dataset.xvfrase.split('|'), ta = document.querySelector('[data-inf="' + aid + '"][data-k="' + key + '"]'), frase = t.textContent.replace(/^＋ /, '');
    ta.value = add && ta.value.trim() ? ta.value.trim() + ' ' + frase : frase; guardar(base + aid + '/t' + tri + '/' + key, ta.value); return;
  }
  if (t.dataset.xvcopia) { const aid = t.dataset.xvcopia, prev = ((((D.informes || {})[grupoSel] || {})[aid] || {})['t' + (tri - 1)]); if (!prev) return toast('No hay informe del trimestre anterior'); guardar(base + aid + '/t' + tri, prev); render(); toast('Copiado: revisa y cambia lo necesario'); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.sdia != null) { const B = borrSes(D.grupos[grupoSel], grupoSel, mesResumen); B.filas[+t.dataset.sdia].imp = t.checked; B.cambiado = true; render(); }
  else if (t.dataset.fotos && t.files.length) { fotosAPdf([...t.files], t.dataset.fotos); t.value = ''; }
  else if (t.dataset.subido) guardar('subidos/' + grupoSel + '/' + t.dataset.subido, t.checked ? hoyIso() : null);
  else if (t.id === 'mesResumen') Object.keys(BORR2).forEach(k => { if (!BORR2[k].cambiado) delete BORR2[k]; });
});

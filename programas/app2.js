// Programas del cole · PEM y RdC1, económica del PROA+ y memorias
'use strict';
const eur = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const fLarga = s => s ? new Date(s + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
function triDe(f) { const y = startY(CURSO); if (f < (y + 1) + '-01-07') return 1; if (f < (y + 1) + '-04-01') return 2; return 3; }
const M = () => D.mem || {};
// Logos oficiales FSE+ incrustados (así salen al imprimir y en el Word)
let LOGO_FSE = 'img/logos-fse-proa.png';
fetch('img/logos-fse-proa.png').then(r => r.blob()).then(b => { const fr = new FileReader(); fr.onload = () => { LOGO_FSE = fr.result; }; fr.readAsDataURL(b); }).catch(() => { });
const PALN = c => { const p = PALANCAS.find(x => x.c === c); return p ? p.c + ' · ' + p.t : 'Gastos generales del programa'; };

// ─── Documento imprimible / Word ───
function abrirDoc(titulo, cuerpo, prog) {
  const base = location.href.replace(/[^/]*$/, '');
  const fse = prog === 'PROA+' ? 'Programa de Cooperación Territorial de Orientación, Avance y Enriquecimiento Educativo PROA+ Transfórmate, cofinanciado por el Fondo Social Europeo Plus (FSE+).' : 'Actuación cofinanciada por el Fondo Social Europeo Plus (FSE+). Consejería de Educación de la Junta de Andalucía.';
  const css = '.salto{page-break-before:always;break-before:page}.firma{height:34px}body{font-family:Calibri,Arial,sans-serif;max-width:820px;margin:24px auto;padding:0 20px;color:#111;line-height:1.45;font-size:14px}h1{font-size:19px;text-align:center;margin:6px 0}h2{font-size:16px;color:#1f3f7a;border-bottom:2px solid #1f3f7a;padding-bottom:2px;margin-top:22px}h3{font-size:14px;margin:12px 0 4px}table{width:100%;border-collapse:collapse;margin:6px 0}td,th{border:1px solid #999;padding:5px 7px;vertical-align:top;text-align:left}th{background:#e8effc}.cab{display:flex;justify-content:space-between;align-items:center}.cab img{height:52px}.sub{text-align:center;color:#444;margin:0 0 10px}.fse{font-size:11px;text-align:center;margin-top:28px;color:#333}.bar{text-align:center;margin:16px}.bar button{font-size:15px;padding:8px 14px;margin:0 4px;cursor:pointer}@media print{.bar{display:none}}';
  const html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><style>' + css + '</style></head><body>' +
    (prog === 'PROA' ? '<img src="' + (LOGO_FSE.startsWith('data:') ? LOGO_FSE : base + LOGO_FSE) + '" alt="Cofinanciado por la Unión Europea · Ministerio de Trabajo y Economía Social · Fondos Europeos · Junta de Andalucía, Consejería de Educación" style="width:100%;height:auto;display:block">' : '<div class="cab"><img src="' + base + 'img/junta.jpg" alt=""><img src="' + base + 'img/colegio.png" alt=""></div>') +
    '<h1>' + esc(titulo) + '</h1><p class="sub">CEIP Capitulaciones (18008853) · Santa Fe (Granada) · Curso ' + CURSO.replace('-', '/') + '</p>' + cuerpo +
    '<p class="fse">' + fse + '</p></body></html>';
  const w = window.open('', '_blank');
  if (!w) return toast('Permite las ventanas emergentes para ver el documento', 'err');
  w.document.write(html.replace('</h1>', '</h1><div class="bar"><button onclick="print()">🖨️ Imprimir o PDF</button><button id="bw">📝 Descargar Word</button></div>'));
  w.document.close();
  w.document.getElementById('bw').onclick = () => {
    const b = new Blob(['﻿' + html], { type: 'application/msword' }), a = w.document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = titulo.replace(/[^\wáéíóúñÁÉÍÓÚÑ ]+/g, '').replace(/\s+/g, '_') + '.doc'; a.click();
  };
}
const tabla = (cab, filas) => '<table><tr>' + cab.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr>' + (filas.length ? filas.map(f => '<tr>' + f.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + cab.length + '"><i>Sin datos registrados.</i></td></tr>') + '</table>';
const txt = s => esc(s || '').replace(/\n/g, '<br>');

// ─── 6 · PEM, seguimiento y RdC1 ───
const ORG = [['ed', 'Equipo directivo'], ['etcp', 'ETCP'], ['claustro', 'Claustro'], ['ce', 'Consejo Escolar']];
function rPEM() {
  const P = D.pem || {}, com = Object.values(D.reuniones || {}).filter(r => r.tipo === 'comision').sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  const rev = (k, t) => { const v = (P.rev || {})[k] || {}; return '<div class="card" style="box-shadow:none;margin:8px 0"><h3>' + t + '</h3><div class="g2">' + ORG.map(([o, n]) => '<div><label>' + n + '</label><input type="date" data-pem="rev/' + k + '/' + o + '" value="' + esc(v[o] || '') + '"></div>').join('') + '</div><label>Conclusiones y cambios acordados</label><textarea data-pem="rev/' + k + '/notas">' + esc(v.notas || '') + '</textarea></div>'; };
  return '<div class="card"><div class="card-h"><h2>📌 PEM y seguimiento</h2><div><button class="btn sec peq" data-doc="plan">📄 Plan en una página</button> <button class="btn peq" data-doc="rdc">📊 Datos para la RdC1 y el PAP</button></div></div>' +
    '<p class="small"><b>Comisiones de seguimiento (mínimo 2):</b> ' + (com.length ? com.map(r => fechaCorta(r.fecha)).join(' · ') : '<span class="muted">ninguna todavía</span>') + ' <button class="btn sec peq" data-irreu="comision">＋ Registrar comisión</button></p>' +
    rev('s1', '1.ª revisión semestral del PEM (enero)') + rev('s2', '2.ª revisión semestral y evaluación del PEM (junio)') +
    '<label>Actividades palanca propuestas para el curso que viene</label><textarea data-pem="siguiente">' + esc(P.siguiente || '') + '</textarea></div>';
}
function evidOrden(c) { return Object.values(((D.palancas || {})[c] || {}).evid || {}).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')); }
function docFicha(c) {
  const p = PALANCAS.find(x => x.c === c), v = (D.palancas || {})[c] || {}, ev = evidOrden(c);
  abrirDoc('Ficha de actividad palanca ' + p.c, tabla(['Campo', 'Contenido'], [
    ['Actividad palanca', esc(p.c + ' · ' + p.t)], ['Bloque', esc(p.bloque)], ['Tipo', esc(p.tipo)], ['Reto al que responde', esc(p.reto)],
    ['Objetivo', esc(p.obj)], ['Actuaciones previstas', '<ul>' + p.acc.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul>'],
    ['Indicadores', esc(p.ind)], ['Estado', esc(EST[v.estado || ''][0])]]) +
    [1, 2, 3].map(t => '<h3>' + t + '.º trimestre</h3>' + tabla(['Fecha', 'Actuación realizada', 'Participantes'], ev.filter(e => e.fecha && triDe(e.fecha) === t).map(e => [esc(fechaCorta(e.fecha)), txt(e.texto), esc(e.part || '')]))).join(''), 'PROA+');
}
function docPlan() {
  abrirDoc('Plan de actividades palanca · PROA+ Transfórmate', '<h2>Retos e indicadores</h2>' + tabla(['Reto', 'Indicador', 'Meta'], RETOS.map(r => [esc(r.n + '. ' + r.t), esc(r.ind), esc(r.meta)])) +
    '<h2>Actividades palanca</h2>' + tabla(['N.º', 'Actividad', 'Tipo', 'Reto', 'Estado'], PALANCAS.map(p => [p.n, '<b>' + esc(p.c) + '</b> ' + esc(p.t), esc(p.tipo), esc(p.reto), esc(EST[((D.palancas || {})[p.c] || {}).estado || ''][0])])), 'PROA+');
}
function docRdC() {
  const RT = D.retos || {}, P = D.pem || {}, com = Object.values(D.reuniones || {}).filter(r => r.tipo === 'comision');
  const gas = gastosPorPalanca();
  abrirDoc('Datos para la Rendición de Cuentas (RdC1) y el PAP', '<p><i>Resumen de lo registrado en la app para pasarlo a la plantilla del Ministerio. Comprobad cada campo con la plantilla oficial.</i></p>' +
    '<h2>1. Retos e indicadores</h2>' + tabla(['Reto', 'Indicador', 'Meta', 'Inicial', '1.ª ev.', '2.ª ev.', '3.ª ev.'], RETOS.map(r => { const v = RT[r.id] || {}; return [esc(r.t), esc(r.ind), esc(r.meta), esc(v.ini || ''), esc(v.t1 || ''), esc(v.t2 || ''), esc(v.t3 || '')]; })) +
    '<h2>2. Actividades palanca</h2>' + tabla(['Actividad', 'Estado', 'Actuaciones', 'Gasto'], PALANCAS.map(p => { const ev = evidOrden(p.c); return ['<b>' + esc(p.c) + '</b> ' + esc(p.t), esc(EST[((D.palancas || {})[p.c] || {}).estado || ''][0]), ev.length ? '<ul>' + ev.map(e => '<li>' + esc(fechaCorta(e.fecha)) + ': ' + esc(e.texto) + (e.part ? ' (' + esc(e.part) + ')' : '') + '</li>').join('') + '</ul>' : '—', eur(gas[p.c] || 0)]; })) +
    '<h2>3. Seguimiento</h2>' + tabla(['Actuación', 'Fechas'], [['Comisiones de seguimiento', esc(com.map(r => fechaCorta(r.fecha)).join(', ') || '—')],
      ['Revisión del PEM (enero)', esc(ORG.map(([o, n]) => ((P.rev || {}).s1 || {})[o] ? n + ' ' + fechaCorta(P.rev.s1[o]) : '').filter(Boolean).join(' · ') || '—')],
      ['Revisión y evaluación del PEM (junio)', esc(ORG.map(([o, n]) => ((P.rev || {}).s2 || {})[o] ? n + ' ' + fechaCorta(P.rev.s2[o]) : '').filter(Boolean).join(' · ') || '—')]]) +
    '<h2>4. Ejecución económica</h2>' + tabla(['Concepto', 'Importe'], [['Dotación', eur(ecoDot())], ['Gastado', eur(ecoTot().total)], ['Pagado', eur(ecoTot().pagado)], ['Sin gastar', eur(ecoDot() - ecoTot().total)]]), 'PROA+');
}

// ─── 7 · Económica del PROA+ ───
const TIPOG = { serv: 'Servicio o actividad (empresa)', fung: 'Material fungible', inv: 'Material inventariable', otro: 'Otros' };
const DOCS_CONTRATO = ['3 presupuestos de empresas distintas', 'Memoria justificativa del contrato (nº 07)', 'Requerimiento a la empresa (nº 05)', 'Pliego de condiciones (nº 08)', 'Contrato firmado (nº 09), máximo 1 año y sin prórroga', 'DACI de la empresa (nº 02)', 'Cesión de datos de la empresa (nº 04)', 'Facturas desglosadas con IVA', 'Pago por transferencia', 'Todo subido a Séneca (PROA+ → Datos asociados → Contrato / Documentos que pide la UE)'];
const ecoDot = () => +((D.eco || {}).dotacion || 0);
function ecoTot() { let total = 0, pagado = 0, inv = 0; Object.values((D.eco || {}).gastos || {}).forEach(g => { const t = +g.total || 0; total += t; if (g.pagado) pagado += t; if (g.tipo === 'inv') inv += t; }); return { total, pagado, inv }; }
function gastosPorPalanca() { const r = {}; Object.values((D.eco || {}).gastos || {}).forEach(g => { const k = g.pal || 'gen'; r[k] = (r[k] || 0) + (+g.total || 0); }); return r; }
RENDER.eco = function () {
  const E = D.eco || {}, T = ecoTot(), dot = ecoDot(), rest = dot - T.total, G = Object.entries(E.gastos || {}).sort((a, b) => (b[1].fecha || '').localeCompare(a[1].fecha || ''));
  const C = Object.entries(E.contratos || {}), gp = gastosPorPalanca(), hoy = hoyIso(), lim = (startY(CURSO) + 1) + '-06-30';
  let h = '<div class="card"><div class="card-h"><h2>💶 PROA+ Transfórmate · Gestión económica</h2><button class="btn sec peq" data-doc="eco">📄 Memoria económica</button></div>' +
    '<p class="small muted">El ZTS no tiene dotación económica. Ejecución del PROA+: 1/09/' + startY(CURSO) + ' – 31/08/' + (startY(CURSO) + 1) + '. Memoria económica y justificación antes del 30/06, sin remanente.</p>' +
    '<div class="g2"><div><label>Dotación concedida (€)</label><input type="number" step="0.01" data-eco="dotacion" value="' + esc(E.dotacion || '') + '"></div><div><label>Fecha de ingreso</label><input type="date" data-eco="ingreso" value="' + esc(E.ingreso || '') + '"></div></div>' +
    '<div class="kpis"><div class="kpi"><b>' + eur(dot) + '</b><span>dotación</span></div><div class="kpi"><b>' + eur(T.total) + '</b><span>gastado</span></div><div class="kpi"><b>' + eur(T.pagado) + '</b><span>pagado</span></div><div class="kpi"><b style="color:' + (rest < 0 ? 'var(--bad)' : 'inherit') + '">' + eur(rest) + '</b><span>por gastar</span></div><div class="kpi"><b>' + (T.total ? Math.round(100 * T.inv / T.total) : 0) + ' %</b><span>inventariable</span></div></div>' +
    (dot ? '<div class="barra"><i style="width:' + Math.min(100, Math.round(100 * T.total / dot)) + '%"></i></div>' : '') +
    (rest < 0 ? '<div class="aviso rojo">Los gastos superan la dotación.</div>' : dot && rest > 0 && hoy > (startY(CURSO) + 1) + '-04-30' ? '<div class="aviso">Quedan ' + eur(rest) + ' por gastar y justificar antes del ' + fLarga(lim) + ' (sin remanente).</div>' : '') +
    (T.total - T.pagado > 0 ? '<div class="aviso">Hay ' + eur(T.total - T.pagado) + ' en gastos sin pagar.</div>' : '') + '</div>';
  h += '<div class="card"><h2>Gasto por actividad palanca</h2><div class="tabla"><table><tr><th>Actividad</th><th>Importe</th><th>%</th></tr>' +
    PALANCAS.concat([{ c: 'gen', t: 'Gastos generales del programa' }]).filter(p => gp[p.c]).map(p => '<tr><td>' + esc(p.c === 'gen' ? p.t : p.c + ' · ' + p.t) + '</td><td>' + eur(gp[p.c]) + '</td><td>' + (T.total ? Math.round(100 * gp[p.c] / T.total) : 0) + ' %</td></tr>').join('') +
    (T.total ? '' : '<tr><td colspan="3" class="muted">Sin gastos todavía.</td></tr>') + '</table></div></div>';
  h += '<div class="card"><div class="card-h"><h2>🧾 Gastos y facturas</h2><button class="btn" data-gasto="">＋ Nuevo gasto</button></div>' +
    (G.map(([id, g]) => '<div class="item"><div class="fecha">' + (g.fecha ? fechaCorta(g.fecha) : '') + '</div><div class="cuerpo"><div class="tt">' + esc(g.concepto) + ' · ' + eur(g.total) + '</div><div class="dd">' + esc(g.proveedor || '') + (g.factura ? ' · Factura ' + esc(g.factura) : '') + ' · ' + esc(TIPOG[g.tipo] || '') + '</div><div class="dd">' + esc(PALN(g.pal)) + '</div>' +
      '<div style="margin-top:4px"><span class="tag st-' + (g.pagado ? 'ok' : 'warn') + '">' + (g.pagado ? 'Pagado ' + esc(fechaCorta(g.pagado)) : 'Sin pagar') + '</span> ' + (g.seneca ? '<span class="tag st-ok">En Séneca</span>' : '<span class="tag st-gris">Sin subir a Séneca</span>') + '</div></div><button class="btn sec peq" data-gasto="' + id + '">✏️</button></div>').join('') || '<p class="muted">Aún no hay gastos.</p>') + '</div>';
  h += '<div class="card"><div class="card-h"><h2>📑 Contratos con empresas</h2><button class="btn" data-contrato="">＋ Nuevo contrato</button></div>' +
    (C.map(([id, c]) => { const ok = DOCS_CONTRATO.filter((_, i) => (c.docs || {})['d' + i]).length; return '<div class="item"><div class="cuerpo"><div class="tt">' + esc(c.empresa) + ' · ' + eur(c.importe) + '</div><div class="dd">' + esc(c.objeto || '') + (c.fecha ? ' · ' + esc(fechaCorta(c.fecha)) : '') + '</div><div class="barra" style="margin-top:6px"><i style="width:' + Math.round(100 * ok / DOCS_CONTRATO.length) + '%"></i></div><div class="dd">' + ok + '/' + DOCS_CONTRATO.length + ' documentos del expediente</div></div><button class="btn sec peq" data-contrato="' + id + '">✏️</button></div>'; }).join('') || '<p class="muted">Sin contratos. Si se contrata una empresa, aquí se lleva el expediente.</p>') + '</div>';
  return h;
};
function dlgGasto(id) {
  const g = id ? D.eco.gastos[id] : { fecha: hoyIso(), tipo: 'serv', iva: 21 };
  $('dlgIn').innerHTML = '<h2>' + (id ? 'Editar gasto' : 'Nuevo gasto') + '</h2>' +
    '<label>Concepto</label><input id="gCo" value="' + esc(g.concepto || '') + '" placeholder="Ej.: Taller de convivencia (Anarce)">' +
    '<div class="g2"><div><label>Fecha de la factura</label><input type="date" id="gF" value="' + esc(g.fecha || '') + '"></div><div><label>Tipo</label><select id="gT">' + Object.entries(TIPOG).map(([k, t]) => '<option value="' + k + '"' + (g.tipo === k ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div></div>' +
    '<label>Actividad palanca</label><select id="gP"><option value="gen">Gastos generales del programa</option>' + PALANCAS.map(p => '<option value="' + p.c + '"' + (g.pal === p.c ? ' selected' : '') + '>' + esc(p.c + ' · ' + p.t) + '</option>').join('') + '</select>' +
    '<div class="g2"><div><label>Proveedor</label><input id="gPr" value="' + esc(g.proveedor || '') + '"></div><div><label>N.º de factura</label><input id="gFa" value="' + esc(g.factura || '') + '"></div></div>' +
    '<div class="g2"><div><label>Base imponible (€)</label><input type="number" step="0.01" id="gB" value="' + esc(g.base || '') + '"></div><div><label>IVA (%)</label><input type="number" step="1" id="gI" value="' + esc(g.iva != null ? g.iva : 21) + '"></div><div><label>Total (€)</label><input type="number" step="0.01" id="gTo" value="' + esc(g.total || '') + '"></div></div>' +
    '<div class="g2"><div><label>Fecha de pago</label><input type="date" id="gPa" value="' + esc(g.pagado || '') + '"></div><div><label>Subido a Séneca</label><select id="gS"><option value="">No</option><option value="1"' + (g.seneca ? ' selected' : '') + '>Sí</option></select></div></div>' +
    '<div class="pie">' + (id ? '<button class="btn rojo" id="gDel">Borrar</button>' : '') + '<button class="btn sec" id="gCan">Cancelar</button><button class="btn" id="gSave">Guardar</button></div>';
  $('dlg').showModal();
  const calc = () => { const b = +$('gB').value, i = +$('gI').value; if (b) $('gTo').value = (Math.round(b * (1 + i / 100) * 100) / 100).toFixed(2); };
  $('gB').oninput = calc; $('gI').oninput = calc;
  $('gCan').onclick = () => $('dlg').close();
  if (id) $('gDel').onclick = () => { if (confirm('¿Borrar el gasto?')) { guardar('eco/gastos/' + id, null); $('dlg').close(); render(); } };
  $('gSave').onclick = () => {
    const v = { concepto: $('gCo').value.trim(), fecha: $('gF').value, tipo: $('gT').value, pal: $('gP').value, proveedor: $('gPr').value.trim(), factura: $('gFa').value.trim(), base: +$('gB').value || 0, iva: +$('gI').value || 0, total: +$('gTo').value || 0, pagado: $('gPa').value || null, seneca: !!$('gS').value };
    if (!v.concepto || !v.total) return toast('Pon el concepto y el importe', 'err');
    guardar('eco/gastos/' + (id || uid()), v); $('dlg').close(); render(); toast('Gasto guardado');
  };
}
function dlgContrato(id) {
  const c = id ? D.eco.contratos[id] : {};
  $('dlgIn').innerHTML = '<h2>' + (id ? 'Editar contrato' : 'Nuevo contrato') + '</h2>' +
    '<div class="g2"><div><label>Empresa</label><input id="cE" value="' + esc(c.empresa || '') + '"></div><div><label>Importe (€)</label><input type="number" step="0.01" id="cI" value="' + esc(c.importe || '') + '"></div></div>' +
    '<label>Objeto del contrato</label><input id="cO" value="' + esc(c.objeto || '') + '"><label>Fecha del contrato</label><input type="date" id="cF" value="' + esc(c.fecha || '') + '">' +
    '<label>Expediente</label>' + DOCS_CONTRATO.map((t, i) => '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:600;color:var(--text)"><input type="checkbox" id="cd' + i + '"' + ((c.docs || {})['d' + i] ? ' checked' : '') + ' style="width:20px;height:20px">' + esc(t) + '</label>').join('') +
    '<p class="small muted">Antes de firmar, la empresa entrega su DACI y la cesión de datos.</p>' +
    '<div class="pie">' + (id ? '<button class="btn rojo" id="cDel">Borrar</button>' : '') + '<button class="btn sec" id="cCan">Cancelar</button><button class="btn" id="cSave">Guardar</button></div>';
  $('dlg').showModal();
  $('cCan').onclick = () => $('dlg').close();
  if (id) $('cDel').onclick = () => { if (confirm('¿Borrar el contrato?')) { guardar('eco/contratos/' + id, null); $('dlg').close(); render(); } };
  $('cSave').onclick = () => {
    const docs = {}; DOCS_CONTRATO.forEach((_, i) => { if ($('cd' + i).checked) docs['d' + i] = true; });
    const v = { empresa: $('cE').value.trim(), importe: +$('cI').value || 0, objeto: $('cO').value.trim(), fecha: $('cF').value, docs };
    if (!v.empresa) return toast('Pon la empresa', 'err');
    guardar('eco/contratos/' + (id || uid()), v); $('dlg').close(); render();
  };
}
function docEco() {
  const E = D.eco || {}, T = ecoTot(), gp = gastosPorPalanca(), G = Object.values(E.gastos || {}).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  abrirDoc('Memoria económica · PROA+ Transfórmate', '<h2>1. Resumen</h2>' + tabla(['Concepto', 'Importe'], [['Dotación concedida' + (E.ingreso ? ' (ingreso: ' + esc(fLarga(E.ingreso)) + ')' : ''), eur(ecoDot())], ['Total gastado', eur(T.total)], ['Total pagado', eur(T.pagado)], ['Remanente', eur(ecoDot() - T.total)]]) +
    '<h2>2. Gasto por bloques de actividades palanca</h2>' + tabla(['Actividad palanca', 'Importe', '%'], PALANCAS.concat([{ c: 'gen', t: 'Gastos generales del programa' }]).filter(p => gp[p.c]).map(p => [esc(p.c === 'gen' ? p.t : p.c + ' · ' + p.t), eur(gp[p.c]), (T.total ? Math.round(100 * gp[p.c] / T.total) : 0) + ' %'])) +
    '<h2>3. Relación de gastos</h2>' + tabla(['Fecha', 'Concepto', 'Proveedor', 'Factura', 'Actividad', 'Tipo', 'Total', 'Pago'], G.map(g => [esc(fechaCorta(g.fecha)), esc(g.concepto), esc(g.proveedor || ''), esc(g.factura || ''), esc(g.pal === 'gen' ? 'General' : g.pal), esc(TIPOG[g.tipo] || ''), eur(g.total), esc(g.pagado ? fechaCorta(g.pagado) : 'Pendiente')])) +
    '<h2>4. Contratos</h2>' + tabla(['Empresa', 'Objeto', 'Fecha', 'Importe'], Object.values(E.contratos || {}).map(c => [esc(c.empresa), esc(c.objeto || ''), esc(fechaCorta(c.fecha || '') || ''), eur(c.importe)])), 'PROA+');
}

// ─── 9 · Memorias ───
function datosAcomp() {
  const G = Object.entries(D.grupos || {}); let al = 0, imp = 0, noImp = 0, horas = 0, P = 0, tot = 0, euros = 0, infs = 0, infTot = 0;
  const filas = G.map(([gid, g]) => {
    const n = Object.keys(g.alumnos || {}).length; al += n; let gi = 0, gh = 0, gn = 0;
    Object.values((D.sesiones || {})[gid] || {}).forEach(s => { if (s.impartida) { gi++; gh += +s.horas || 0; Object.values(s.asist || {}).forEach(v => { tot++; if (v === 'P') P++; }); } else gn++; });
    imp += gi; noImp += gn; horas += gh; euros += gh * EUROS[g.mod || 'B'];
    Object.keys(g.alumnos || {}).forEach(a => [1, 2, 3].forEach(t => { infTot++; { const x = (((D.informes || {})[gid] || {})[a] || {})['t' + t]; if (x && (x.q1 || x.texto)) infs++; } }));
    return [esc(g.nombre), esc(ACT[g.act] || ''), esc(g.docente || ''), n, gi, gn, gh + ' h', eur(gh * EUROS[g.mod || 'B'])];
  });
  const R = Object.values(D.reuniones || {});
  return { G, filas, al, imp, noImp, horas, euros, asis: tot ? Math.round(100 * P / tot) : 0, quinc: R.filter(r => r.tipo === 'quincenal').length, fam: R.filter(r => r.tipo === 'familia').length, zts: R.filter(r => r.tipo === 'zts').length, infs, infTot };
}
const memTA = (k, t, ph) => '<label>' + t + '</label><textarea data-mem="' + k + '" placeholder="' + esc(ph || '') + '">' + esc(M()[k] || '') + '</textarea>';
RENDER.memorias = function () {
  const A = datosAcomp(), hechos = p => { const L = PLAZOS.filter(x => x.p === p); return L.filter(x => D.hechos[x.id]).length + '/' + L.length; };
  return '<div class="card"><h2>📄 Memorias y certificaciones</h2><p class="small muted">Los documentos se rellenan solos con lo registrado en la app. Lo que escribáis aquí se añade como valoración. Se pueden imprimir, guardar en PDF o descargar en Word.</p></div>' +
    '<div class="grid">' +
    '<div class="card prog PROAp"><h2>🎯 PROA+ · Memoria justificativa</h2><p class="small muted">Antes del 30/06. Actividades, participación, permanencia y promoción.</p>' +
    memTA('pp_part', 'Participación (alumnado, familias, profesorado)', 'Nº de alumnado participante, familias en talleres…') + memTA('pp_prom', 'Permanencia y promoción', '% de alumnado que promociona, bajas…') + memTA('pp_val', 'Valoración global') + memTA('pp_mej', 'Propuestas de mejora') +
    '<div class="pie" style="justify-content:flex-start"><button class="btn" data-doc="mempp">📄 Generar memoria justificativa</button> <button class="btn sec" data-doc="eco">💶 Memoria económica</button></div></div>' +
    '<div class="card prog PROA"><h2>🧑‍🏫 PROA Andalucía · Certificación de horas</h2><p class="small muted">Se certifica en Séneca del 1 al 30 de junio (firma secretaría y dirección).</p>' +
    '<div class="kpis"><div class="kpi"><b>' + A.G.length + '</b><span>grupos</span></div><div class="kpi"><b>' + A.horas + ' h</b><span>impartidas</span></div><div class="kpi"><b>' + eur(A.euros) + '</b><span>importe</span></div></div>' +
    '<div class="pie" style="justify-content:flex-start"><button class="btn" data-doc="cert">📄 Resumen para certificar</button></div></div>' +
    '<div class="card prog"><h2>📘 Memoria de Autoevaluación · apartado de programas</h2><p class="small muted">ZTS, PROA Andalucía y PROA+ (logros, dificultades y propuestas). Plazos hechos: ZTS ' + hechos('ZTS') + ', PROA ' + hechos('PROA') + ', PROA+ ' + hechos('PROA+') + '.</p>' +
    [['zts', '🌱 ZTS'], ['proa', '🧑‍🏫 PROA Andalucía'], ['pp', '🎯 PROA+']].map(([k, n]) => '<details style="margin:8px 0"><summary>' + n + '</summary>' + memTA('au_' + k + '_log', 'Logros') + memTA('au_' + k + '_dif', 'Dificultades') + memTA('au_' + k + '_mej', 'Propuestas de mejora') + '</details>').join('') +
    '<div class="pie" style="justify-content:flex-start"><button class="btn" data-doc="auto">📄 Generar apartado</button></div></div>' +
    '</div>';
};
function docMemPP() {
  const RT = D.retos || {}, com = Object.values(D.reuniones || {}).filter(r => r.tipo === 'comision').sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  abrirDoc('Memoria justificativa · PROA+ Transfórmate', '<h2>1. Actividades palanca desarrolladas</h2>' +
    PALANCAS.map(p => { const ev = evidOrden(p.c); return '<h3>' + esc(p.c + ' · ' + p.t) + ' <small>(' + esc(EST[((D.palancas || {})[p.c] || {}).estado || ''][0]) + ')</small></h3><p>' + esc(p.obj) + '</p>' + (ev.length ? '<ul>' + ev.map(e => '<li>' + esc(fLarga(e.fecha)) + ': ' + esc(e.texto) + (e.part ? ' — ' + esc(e.part) : '') + '</li>').join('') + '</ul>' : '<p><i>Sin actuaciones registradas.</i></p>'); }).join('') +
    '<h2>2. Retos e indicadores</h2>' + tabla(['Reto', 'Indicador', 'Meta', 'Inicial', 'Final (3.ª ev.)'], RETOS.map(r => { const v = RT[r.id] || {}; return [esc(r.t), esc(r.ind), esc(r.meta), esc(v.ini || ''), esc(v.t3 || v.t2 || v.t1 || '')]; })) +
    '<h2>3. Participación</h2><p>' + txt(M().pp_part) + '</p><h2>4. Permanencia y promoción</h2><p>' + txt(M().pp_prom) + '</p>' +
    '<h2>5. Seguimiento</h2><p>Comisiones de seguimiento: ' + esc(com.map(r => fLarga(r.fecha)).join('; ') || '—') + '.</p>' +
    '<h2>6. Valoración global</h2><p>' + txt(M().pp_val) + '</p><h2>7. Propuestas de mejora</h2><p>' + txt(M().pp_mej) + '</p>' +
    '<p style="margin-top:40px">En Santa Fe, a ____ de ____________ de ' + (startY(CURSO) + 1) + '.</p><p style="margin-top:50px">El director: Víctor Manuel Única Salas</p>', 'PROA+');
}
function docCert() {
  const A = datosAcomp();
  abrirDoc('PROA Andalucía · Resumen de horas para la certificación', '<p>Periodo del programa: 13/10/' + startY(CURSO) + ' – 31/05/' + (startY(CURSO) + 1) + '. Solo se certifican las horas efectivamente impartidas.</p>' +
    tabla(['Grupo', 'Actuación', 'Docente / mentor', 'Alumnado', 'Sesiones', 'No impartidas', 'Horas', 'Importe'], A.filas) +
    tabla(['Total', 'Valor'], [['Horas impartidas', A.horas + ' h'], ['Importe', eur(A.euros)], ['Asistencia media del alumnado', A.asis + ' %'], ['Reuniones quincenales con tutores', A.quinc], ['Citas con familias', A.fam]]) +
    '<p><i>Comprobad que coincide con lo grabado en «Usos del servicio» de Séneca antes de certificar.</i></p>', 'PROA');
}
function docAuto() {
  const A = datosAcomp(), m = M(), PAL = D.palancas || {};
  const sec = (k, n, datos) => '<h2>' + n + '</h2>' + datos + '<h3>Logros</h3><p>' + txt(m['au_' + k + '_log']) + '</p><h3>Dificultades</h3><p>' + txt(m['au_' + k + '_dif']) + '</p><h3>Propuestas de mejora</h3><p>' + txt(m['au_' + k + '_mej']) + '</p>';
  abrirDoc('Memoria de Autoevaluación · Programas ZTS, PROA Andalucía y PROA+',
    sec('zts', '1. Programa de Atención Socioeducativa en ZTS', '<p>Coordinación: Miriam Noemí Romero Rodríguez. Maestras de apoyo ZTS: Miriam Noemí Romero Rodríguez y Cristina Molina Martín. Desdobles de Lengua y Matemáticas en 2.º y 3.º. Reuniones de coordinación registradas: ' + A.zts + '.</p>') +
    sec('proa', '2. PROA Andalucía · Acompañamiento Escolar', tabla(['Dato', 'Valor'], [['Grupos', A.G.length], ['Alumnado atendido', A.al], ['Sesiones impartidas', A.imp], ['Horas impartidas', A.horas + ' h'], ['Asistencia media', A.asis + ' %'], ['Reuniones quincenales con tutores', A.quinc], ['Citas con familias', A.fam], ['Informes trimestrales redactados', A.infs + ' de ' + A.infTot]])) +
    sec('pp', '3. PROA+ Transfórmate', tabla(['Actividad palanca', 'Estado', 'Actuaciones'], PALANCAS.map(p => [esc(p.c + ' · ' + p.t), esc(EST[(PAL[p.c] || {}).estado || ''][0]), evidOrden(p.c).length]))), 'PROA');
}

// ─── Eventos de estos módulos ───
document.addEventListener('click', e => {
  const t = e.target.closest('[data-doc],[data-ficha],[data-gasto],[data-contrato],[data-irreu]'); if (!t) return;
  const d = t.dataset;
  if ('ficha' in d) docFicha(d.ficha);
  else if ('gasto' in d) dlgGasto(d.gasto);
  else if ('contrato' in d) dlgContrato(d.contrato);
  else if ('irreu' in d) { dlgReunion(); $('rTipo').value = d.irreu; }
  else ({ plan: docPlan, rdc: docRdC, eco: docEco, mempp: docMemPP, cert: docCert, auto: docAuto }[d.doc] || (() => { }))();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.pem) guardar('pem/' + t.dataset.pem, t.value.trim() || null);
  else if (t.dataset.eco) { guardar('eco/' + t.dataset.eco, t.value || null); render(); }
  else if (t.dataset.mem) guardar('mem/' + t.dataset.mem, t.value.trim() || null);
});

// ─── Anexos oficiales del PROA Andalucía (copia de los modelos de las Instrucciones de 1/09/2026) ───
const DIRECTOR = 'Víctor Manuel Única Salas';
const PREG_XV = ['¿ES PUNTUAL CON EL PROGRAMA?', '¿CÓMO ES SU NIVEL DE PARTICIPACIÓN EN LA REALIZACIÓN DE LAS TAREAS DENTRO DEL GRUPO?', '¿TIENE UN COMPORTAMIENTO ADECUADO CON LA PERSONA RESPONSABLE DEL GRUPO Y CON LOS COMPAÑEROS/AS?', 'SEGÚN LA INFORMACIÓN EXTRAÍDA DE LA SESIÓN DE EVALUACIÓN, ¿CÓMO VALORARÍA LA PARTICIPACIÓN DEL ALUMNO/A EN EL PROGRAMA?', '¿SE HAN OBSERVADO MEJORAS CUALITATIVAS Y/O CUANTITATIVAS EN EL RENDIMIENTO ACADÉMICO DEL ALUMNO/A? (PARTICIPACIÓN DENTRO DE SU GRUPO-CLASE, REALIZACIÓN DE LAS TAREAS, PREPARACIÓN DE LOS EXÁMENES, MEJORA SUS RESULTADOS ACADÉMICOS CON RESPECTO AL TRIMESTRE ANTERIOR)'];
const ORD = n => n + 'ª';
function abrirAnexo(titulo, paginas) {
  const base = location.href.replace(/[^/]*$/, ''), logo = LOGO_FSE.startsWith('data:') ? LOGO_FSE : base + LOGO_FSE;
  const css = '@page{size:A4;margin:14mm 16mm}*{box-sizing:border-box}body{font-family:"Source Sans 3","Source Sans Pro",Calibri,Arial,sans-serif;color:#000;font-size:10.5pt;margin:0;background:#888}' +
    '.pag{background:#fff;width:210mm;min-height:297mm;margin:10px auto;padding:12mm 16mm;page-break-after:always;break-after:page}.pag:last-child{page-break-after:auto}' +
    '.logos{display:block;width:78%;margin:0 auto 14px}h1{font-size:10.5pt;text-align:center;font-weight:700;margin:0 0 14px;line-height:1.35}' +
    'table{width:100%;border-collapse:collapse;margin:0 0 14px}td,th{border:1px solid #000;padding:2px 5px;vertical-align:top;text-align:left;font-size:10pt}th,.et{background:#d9d9d9;font-weight:700}th{text-align:center;vertical-align:middle}' +
    '.alto td{height:24px}.muyalto td{height:58px}.c{text-align:center}.b{font-weight:700}.nota{font-weight:700;font-style:italic;margin:6px 0 18px}.lugar{text-align:center;margin:14px 0 34px}.firma{text-align:center;line-height:1.3}' +
    '.bar{text-align:center;padding:10px;background:#fff}.bar button{font-size:15px;padding:8px 14px;margin:0 4px;cursor:pointer}@media print{body{background:#fff}.pag{margin:0;width:auto;min-height:0;padding:0}.bar{display:none}}';
  const cuerpo = paginas.map(p => '<div class="pag"><img class="logos" src="' + logo + '" alt="Cofinanciado por la Unión Europea · Ministerio de Trabajo y Economía Social · Fondos Europeos · Junta de Andalucía, Consejería de Educación">' + p + '</div>').join('');
  const html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap" rel="stylesheet"><style>' + css + '</style></head><body>' + cuerpo + '</body></html>';
  const w = window.open('', '_blank');
  if (!w) return toast('Permite las ventanas emergentes para ver el documento', 'err');
  w.document.write(html.replace('<body>', '<body><div class="bar"><button onclick="print()">🖨️ Imprimir o guardar en PDF</button><button id="bw">📝 Descargar Word</button></div>'));
  w.document.close();
  w.document.getElementById('bw').onclick = () => { const b = new Blob(['﻿' + html], { type: 'application/msword' }), a = w.document.createElement('a'); a.href = URL.createObjectURL(b); a.download = titulo.replace(/[^\wáéíóúñÁÉÍÓÚÑ ]+/g, '').replace(/\s+/g, '_') + '.doc'; a.click(); };
}
const lugarFecha = () => '<p class="lugar">En Santa Fe, a______ de _________________________ de _______.</p>';
const firmaDir = sello => '<p class="firma">Fdo.: ' + DIRECTOR + '<br>(Firma de la persona titular de la dirección del centro)' + (sello ? '<br>(Sello oficial del centro en el caso de no usar firma electrónica)' : '') + '</p>';
const fechaAnexo = f => new Date(f + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
function cabeceraGrupo(g, mesTxt, actuacion) {
  return '<table><colgroup><col style="width:17%"><col style="width:36%"><col style="width:30%"><col style="width:9%"><col style="width:8%"></colgroup>' +
    '<tr><td class="et">CENTRO</td><td>CEIP Capitulaciones (Santa Fe)</td><td class="et">CÓDIGO</td><td colspan="2">18008853</td></tr>' +
    (actuacion ? '<tr><td class="et">ACTUACIÓN</td><td>' + (g.act !== 'ALI' ? '☒' : '☐') + ' ACOMPAÑAMIENTO ESCOLAR<br>' + (g.act === 'ALI' ? '☒' : '☐') + ' ACOMPAÑAMIENTO LINGÜÍSTICO PARA ALUMNADO INMIGRANTE</td><td class="et">MES</td><td colspan="2">' + esc(mesTxt) + '</td></tr><tr><td class="et">GRUPO</td><td colspan="4">' + esc(g.nombre) + '</td></tr>'
      : '<tr><td class="et">GRUPO</td><td>' + esc(g.nombre) + '</td><td class="et">MES</td><td colspan="2">' + esc(mesTxt) + '</td></tr>') +
    '<tr><td class="et" rowspan="2">MENTOR/A O PROFESOR/A</td><td rowspan="2">' + esc(g.docente || '') + '</td><td class="et" colspan="' + (actuacion ? 1 : 2) + '">' + (actuacion ? 'MENTOR/A' : 'MENTOR/A (MODALIDAD A)') + '</td><td class="c"' + (actuacion ? ' colspan="2"' : '') + '>' + (g.mod === 'A' ? 'X' : '') + '</td></tr>' +
    '<tr><td class="et" colspan="' + (actuacion ? 1 : 2) + '">' + (actuacion ? 'PROFESOR/A' : 'PROFESOR/A (MODALIDAD B)') + '</td><td class="c"' + (actuacion ? ' colspan="2"' : '') + '>' + (g.mod !== 'A' ? 'X' : '') + '</td></tr></table>';
}
function docAnexoX(gid, mes) {
  const g = D.grupos[gid], S = Object.entries((D.sesiones || {})[gid] || {}).filter(([f, x]) => f.startsWith(mes) && x.impartida).sort();
  const mesTxt = MESES[+mes.slice(5) - 1].toUpperCase() + ' ' + mes.slice(0, 4);
  if (!S.length && !confirm('No hay sesiones impartidas registradas en ' + mesTxt.toLowerCase() + '. ¿Generar el anexo igualmente?')) return;
  const n = Math.max(14, S.length), filas = [];
  for (let i = 0; i < n; i++) { const x = S[i]; filas.push('<tr><td>' + ORD(i + 1) + '</td><td class="c">' + (x ? fechaAnexo(x[0]) : '') + '</td><td class="c">' + (x ? esc((x[1].hi || g.hi || '') + ' - ' + (x[1].hf || g.hf || '')) : '') + '</td><td></td><td>' + (x ? esc(x[1].obs || '') : '') + '</td></tr>'); }
  abrirAnexo('Anexo X ' + g.nombre + ' ' + mesTxt, ['<h1>ANEXO X. MODELO PARA EL REGISTRO DE LA ASISTENCIA DEL PROFESORADO, MENTORES Y MENTORAS A LAS SESIONES DE ACOMPAÑAMIENTO ESCOLAR Y ACOMPAÑAMIENTO LINGÜÍSTICO PARA ALUMNADO INMIGRANTE.</h1>' +
    cabeceraGrupo(g, mesTxt, false) +
    '<table class="alto"><colgroup><col style="width:9%"><col style="width:14%"><col style="width:19%"><col style="width:29%"><col style="width:29%"></colgroup><tr><th>Sesión</th><th>Fecha</th><th>Horario</th><th>Firma del mentor/a o profesor/a</th><th>Observaciones (indicar cualquier incidencia)</th></tr>' + filas.join('') + '</table>' +
    '<p class="nota">* Este documento debe ser cumplimentado de forma independiente por grupo y mes de servicio.</p>' + lugarFecha() + firmaDir(true)]);
}
function docAnexoXII(gid, mes) {
  const g = D.grupos[gid], al = g.alumnos || {}, S = Object.entries((D.sesiones || {})[gid] || {}).filter(([f, x]) => f.startsWith(mes) && x.impartida).sort();
  const mesTxt = MESES[+mes.slice(5) - 1].toUpperCase() + ' ' + mes.slice(0, 4);
  const n = Math.max(14, S.length), filas = [];
  for (let i = 0; i < n; i++) { const x = S[i]; const aus = x ? Object.entries(x[1].asist || {}).filter(([, v]) => v === 'F' || v === 'J').map(([k, v]) => (al[k] ? al[k].siglas : '?') + (v === 'J' ? ' (justificada)' : '')).join(', ') : ''; filas.push('<tr><td>' + ORD(i + 1) + '</td><td class="c">' + (x ? fechaAnexo(x[0]) : '') + '</td><td>' + esc(x ? (aus || 'Ninguno') : '') + '</td><td></td></tr>'); }
  abrirAnexo('Anexo XII ' + g.nombre + ' ' + mesTxt, ['<h1>ANEXO XII. MODELO PARA EL REGISTRO DE AUSENCIAS DEL ALUMNADO EN EL DESARROLLO DE LOS PROGRAMAS DE ACOMPAÑAMIENTO IMPARTIDOS EN EL CENTRO DOCENTE.</h1>' +
    cabeceraGrupo(g, mesTxt, true) +
    '<table class="muyalto"><colgroup><col style="width:9%"><col style="width:15%"><col style="width:48%"><col style="width:28%"></colgroup><tr><th>Sesión</th><th>Fecha</th><th>Alumnado ausente<br>(nombre y apellidos)</th><th>Firma del mentor/a o profesor/a</th></tr>' + filas.join('') + '</table>' +
    '<p class="nota">*Entregar a la persona responsable de la coordinación de PROA Andalucía en el centro con carácter mensual.</p>' + lugarFecha() + firmaDir(false)]);
}
function contXV(gid, tri) { const c = Object.assign({}, ((((D.informes || {})[gid] || {})._cont || {})['t' + tri]) || {}); c.a1 = c.a1 || 'Lengua Castellana y Literatura'; c.a2 = c.a2 || 'Matemáticas'; return c; }
function docAnexoXV(gid, tri) {
  const g = D.grupos[gid], A = Object.entries(g.alumnos || {}).sort((a, b) => (a[1].siglas || '').localeCompare(b[1].siglas || ''));
  if (!A.length) return toast('El grupo no tiene alumnado', 'err');
  const C = contXV(gid, tri), y = startY(CURSO), anio = tri === 1 ? y : y + 1;
  const area = (k, inf) => { const items = (C['c' + k] || '').split('\n').map(x => x.trim()).filter(Boolean); const rows = Math.max(6, items.length), tr = [];
    for (let i = 0; i < rows; i++) { const e = ((inf.e || {})[k + '_' + i]) || ''; tr.push('<tr><td>' + esc(items[i] || '') + '</td><td class="c">' + (items[i] && e === 'C' ? 'X' : '') + '</td><td class="c">' + (items[i] && e === 'EP' ? 'X' : '') + '</td><td class="c">' + (items[i] && e === 'SI' ? 'X' : '') + '</td></tr>'); }
    return '<p class="b">ÁREA: ' + esc(C['a' + k] || '') + '</p><table class="alto"><colgroup><col style="width:58%"><col style="width:14%"><col style="width:14%"><col style="width:14%"></colgroup><tr><th style="text-align:left">CONTENIDOS</th><th>CONSEGUIDO</th><th>EN PROCESO</th><th>SIN INICIAR</th></tr>' + tr.join('') + '</table>'; };
  const pags = [];
  A.forEach(([aid, a]) => {
    const inf = ((((D.informes || {})[gid] || {})[aid] || {})['t' + tri]) || {};
    pags.push('<h1>ANEXO XV. MODELO DE INFORME INDIVIDUALIZADO TRIMESTRAL DEL ALUMNADO.</h1><p class="c b">Curso ' + y + '/' + (y + 1) + '</p>' +
      '<p class="b" style="line-height:1.5">ALUMNO/A: <span style="font-weight:400">' + esc(a.nombre || a.siglas) + '</span><br>TRIMESTRE: <span style="font-weight:400">' + tri + '.º</span><br>NIVEL: <span style="font-weight:400">' + esc(a.curso || '') + ' Educación Primaria</span><br>MENTOR/A o PROFESOR/A: <span style="font-weight:400">' + esc(g.docente || '') + '</span></p>' +
      area(1, inf) + '<br>' + area(2, inf));
    pags.push('<p class="b">VALORACIÓN GLOBAL DEL ALUMNO/A</p><table><colgroup><col style="width:46%"><col></colgroup>' + PREG_XV.map((q, i) => '<tr><td class="b" style="height:' + (i === 4 ? 130 : i === 0 ? 50 : 72) + 'px;text-align:justify">' + q + '</td><td>' + txt(inf['q' + (i + 1)]) + '</td></tr>').join('') + '</table>' +
      '<p class="b">PROPUESTAS DE MEJORA:</p><table><tr><td style="height:46px">' + txt(inf.mejora) + '</td></tr></table>' +
      '<p class="lugar">En Santa Fe, a ________ de ______________ de ' + anio + '</p><p class="firma" style="margin-top:40px">Fdo.: ' + esc(g.docente || '') + '<br>(Firma del mentor/a o profesor/a)</p>');
  });
  abrirAnexo('Anexo XV ' + g.nombre + ' ' + tri + 'T', pags);
}
// Formulario del Anexo XV (informe trimestral) en la app
function rInformeXV(A, tri) {
  const C = contXV(grupoSel, tri);
  const lista = k => (C['c' + k] || '').split('\n').map(x => x.trim()).filter(Boolean);
  let h = '<div class="card"><div class="card-h"><h2>📝 Informe trimestral (Anexo XV)</h2><select id="triInf" style="width:auto">' + [1, 2, 3].map(t => '<option value="' + t + '"' + (t === tri ? ' selected' : '') + '>' + t + '.º trimestre</option>').join('') + '</select></div>' +
    '<p class="small muted">Primero escribe las dos áreas y sus contenidos (valen para todo el grupo). Después, en cada alumno/a, marca cómo va en cada contenido y responde a la valoración. Se entrega al final de cada trimestre, firmado.</p>' +
    '<div class="g2">' + [1, 2].map(k => '<div><label>Área ' + k + '</label><input data-xvc="a' + k + '" value="' + esc(C['a' + k] || (k === 1 ? 'Lengua Castellana y Literatura' : 'Matemáticas')) + '"><label>Contenidos del área ' + k + ' (uno por línea)</label><textarea data-xvc="c' + k + '" rows="5" placeholder="' + (k === 1 ? 'Comprensión lectora\nExpresión escrita' : 'Cálculo\nResolución de problemas') + '">' + esc(C['c' + k] || '') + '</textarea></div>').join('') + '</div>';
  if (!A.length) return h + '<p class="muted">El grupo no tiene alumnado.</p></div>';
  h += A.map(([aid, a]) => {
    const inf = ((((D.informes || {})[grupoSel] || {})[aid] || {})['t' + tri]) || {};
    const hechas = PREG_XV.filter((_, i) => inf['q' + (i + 1)]).length;
    return '<details style="margin:10px 0"><summary>' + esc(a.siglas) + ' <span class="muted small">' + esc(a.curso || '') + ' · ' + hechas + '/5 preguntas' + (inf.mejora ? ' · propuestas ✔' : '') + '</span></summary>' +
      [1, 2].map(k => { const it = lista(k); return it.length ? '<p class="small" style="margin-top:8px"><b>' + esc(C['a' + k] || '') + '</b></p>' + it.map((c, i) => { const v = (inf.e || {})[k + '_' + i] || ''; return '<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;border-bottom:1px solid #edf1f7;padding:4px 0"><span>' + esc(c) + '</span><select data-xve="' + aid + '|' + k + '_' + i + '" style="width:auto"><option value="">—</option><option value="C"' + (v === 'C' ? ' selected' : '') + '>Conseguido</option><option value="EP"' + (v === 'EP' ? ' selected' : '') + '>En proceso</option><option value="SI"' + (v === 'SI' ? ' selected' : '') + '>Sin iniciar</option></select></div>'; }).join('') : ''; }).join('') +
      PREG_XV.map((q, i) => '<label>' + esc(q.charAt(0) + q.slice(1).toLowerCase()) + '</label><textarea rows="2" data-inf="' + aid + '" data-k="q' + (i + 1) + '">' + esc(inf['q' + (i + 1)] || '') + '</textarea>').join('') +
      '<label>Propuestas de mejora</label><textarea rows="2" data-inf="' + aid + '" data-k="mejora">' + esc(inf.mejora || '') + '</textarea></details>';
  }).join('');
  return h + '<div class="pie" style="justify-content:flex-start"><button class="btn peq" data-acc="anexoXV">📄 Anexo XV del trimestre (PDF)</button></div></div>';
}
document.addEventListener('change', e => {
  const t = e.target, tri = $('triInf') ? $('triInf').value : 1;
  if (t.dataset.xvc) { guardar('informes/' + grupoSel + '/_cont/t' + tri + '/' + t.dataset.xvc, t.value.trim() || null); if (t.dataset.xvc[0] === 'c') render(); }
  else if (t.dataset.xve) { const [aid, k] = t.dataset.xve.split('|'); guardar('informes/' + grupoSel + '/' + aid + '/t' + tri + '/e/' + k, t.value || null); }
});

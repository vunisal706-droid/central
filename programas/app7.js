// ─── Alumnado desde Séneca: siglas en la nube, nombres completos solo en este dispositivo ───
const PART = ['de', 'del', 'la', 'las', 'los', 'y', 'da', 'di'];
function parseSeneca(txt) {
  return String(txt || '').split('\n').map(l => l.replace(/\t/g, ' ').trim())
    .filter(l => l && l.includes(',') && !/^(alumno|n[úu]mero total)/i.test(l))
    .map(l => { const [ap, no] = l.split(',').map(x => x.trim().replace(/\s+/g, ' ')); return { ap, no }; })
    .filter(x => x.ap && x.no);
}
function siglasDe(no, ap) {
  return (no + ' ' + ap).split(' ').filter(p => p && !PART.includes(p.toLowerCase())).map(p => p[0].toUpperCase() + '.').join('');
}
function dlgPegarLista() {
  const g = D.grupos[grupoSel]; if (!g) return;
  $('dlgIn').innerHTML = '<h2>📋 Pegar lista de Séneca · ' + esc(g.nombre) + '</h2>' +
    '<p class="small muted">Copia de Séneca la lista del alumnado seleccionado («Apellidos, Nombre», uno por línea) y pégala aquí. En la nube solo se guardan las <b>siglas</b>; los nombres completos se quedan <b>solo en este dispositivo</b> y salen en los anexos oficiales.</p>' +
    '<textarea id="plT" rows="10" placeholder="García López, Ana&#10;Pérez Ruiz, Luis&#10;…"></textarea><div id="plV" class="small" style="margin-top:6px"></div>' +
    '<div class="pie"><button class="btn sec" id="plC">Cancelar</button><button class="btn" id="plOk">Añadir al grupo</button></div>';
  $('dlg').showModal();
  const ver = () => { const L = parseSeneca($('plT').value); $('plV').innerHTML = L.length ? '<b>' + L.length + '</b> alumnos/as: ' + L.map(x => esc(siglasDe(x.no, x.ap))).join(', ') + avisoTam(L.length) : ''; };
  $('plT').oninput = ver;
  $('plC').onclick = () => $('dlg').close();
  $('plOk').onclick = () => {
    const L = parseSeneca($('plT').value); if (!L.length) return toast('No encuentro nombres con el formato «Apellidos, Nombre»', 'err');
    const N = nombres(grupoSel), A = Object.entries(g.alumnos || {}), curso = CURSO_G(g) || '';
    let nuevos = 0, ya = 0;
    L.forEach(x => {
      const full = x.no + ' ' + x.ap;
      if (Object.values(N).some(n => n.toLowerCase() === full.toLowerCase())) { ya++; return; }
      let s = siglasDe(x.no, x.ap);
      // Si ya hay un alumno con esas siglas y sin nombre, se le asigna; si no, se crea uno nuevo
      const libre = A.find(([aid, a]) => a.siglas === s && !N[aid]);
      if (libre) { N[libre[0]] = full; ya++; return; }
      const usadas = A.map(([, a]) => a.siglas); let k = 2, base = s; while (usadas.includes(s)) s = base + k++;
      const aid = uid(); N[aid] = full; A.push([aid, { siglas: s }]);
      guardar('grupos/' + grupoSel + '/alumnos/' + aid, { siglas: s, curso: curso, tutor: '' }); nuevos++;
    });
    try { localStorage.setItem(NKEY(grupoSel), JSON.stringify(N)); } catch (e) { }
    $('dlg').close(); toast(nuevos + ' añadidos' + (ya ? ', ' + ya + ' ya estaban' : '')); render();
  };
}
function avisoTam(n) {
  if (n >= 8 && n <= 10) return '';
  return '<div class="aviso" style="margin-top:6px">⚠️ Las Instrucciones fijan grupos de <b>8 a 10</b> alumnos/as. Este grupo tiene <b>' + n + '</b>' + (n < 8 ? ': falta' + (8 - n > 1 ? 'n ' : ' ') + (8 - n) + '.' : ': sobra' + (n - 10 > 1 ? 'n ' : ' ') + (n - 10) + ' (puede quedar como suplente).') + '</div>';
}
// Copia de seguridad de los nombres (para pasarlos a otro dispositivo sin subirlos a la nube)
function exportarNombres() {
  const out = {}; Object.keys(localStorage).filter(k => k.startsWith('programas-nombres-')).forEach(k => out[k] = localStorage.getItem(k));
  if (!Object.keys(out).length) return toast('No hay nombres guardados en este dispositivo', 'err');
  const b = new Blob([JSON.stringify(out)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = 'nombres-proa-' + hoyIso() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Copia descargada. Guárdala en lugar seguro (no la subas a ningún sitio público).');
}
function importarNombres() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
  i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then(t => {
    let n = 0; try { const o = JSON.parse(t); Object.entries(o).forEach(([k, v]) => { if (k.startsWith('programas-nombres-')) { localStorage.setItem(k, v); n++; } }); } catch (e) { return toast('Ese archivo no es una copia de nombres', 'err'); }
    toast(n ? 'Nombres cargados en este dispositivo' : 'El archivo no tenía nombres', n ? '' : 'err'); render();
  }); };
  i.click();
}
// Se añade al bloque de documentos del grupo
const _rDocsGrupo = rDocsGrupo;
rDocsGrupo = function (g, A) {
  const N = nombres(grupoSel), sin = A.filter(([aid]) => !N[aid]).length;
  const extra = '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><b>Alumnado con nombre completo</b>' + avisoTam(A.length) +
    '<p class="small muted">' + (A.length ? (A.length - sin) + ' de ' + A.length + ' con nombre en este dispositivo.' : 'Aún no hay alumnado.') + ' En la nube solo van las siglas.</p>' +
    '<button class="btn peq" data-acc7="pegar">📋 Pegar lista de Séneca</button> <button class="btn sec peq" data-acc7="exp">💾 Copia de nombres</button> <button class="btn sec peq" data-acc7="imp">📂 Cargar copia</button></div>';
  return _rDocsGrupo(g, A).replace(/<\/div>$/, extra + '</div>');
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-acc7]'); if (!t) return;
  ({ pegar: dlgPegarLista, exp: exportarNombres, imp: importarNombres }[t.dataset.acc7] || (() => { }))();
});

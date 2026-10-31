#!/usr/bin/env python3
"""Genera asistente-datos.json con lo que el asistente no puede leer en vivo:
programaciones didácticas (.docx), documentos de la CapiGuía, «Qué se trabaja en…» (PDF)
y criterios/saberes oficiales por curso (volcados de Séneca de la app SDA).
Uso: python3 generar_datos_asistente.py RUTA_REPOS SALIDA.json"""
import json, re, sys, os, subprocess, zlib, base64
import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

R = sys.argv[1]; OUT = sys.argv[2]
GH = 'https://vunisal706-droid.github.io/'
CURSO_TXT = {'1': '1.º', '2': '2.º', '3': '3.º', '4': '4.º', '5': '5.º', '6': '6.º'}
CICLOS = {'1': '1.º ciclo (1.º y 2.º)', '2': '2.º ciclo (3.º y 4.º)', '3': '3.º ciclo (5.º y 6.º)'}
limpio = lambda t: re.sub(r'\s+', ' ', t or '').strip()
trozos = []

def add(fuente, doc, sec, sub, bloques, url, peso=1.0, cab=''):
    bl = [b for b in bloques if b]
    # trocear si es muy largo
    buf, n = [], 0
    for b in bl:
        if n + len(b) > 900 and n > 200:
            trozos.append(dict(fuente=fuente, doc=doc, sec=sec, sub=sub, cab=cab, ancla='', url=url, urlDirecta=True, bloques=buf, peso=peso)); buf, n = [], 0
        buf.append(b); n += len(b)
    if buf and n > 30:
        trozos.append(dict(fuente=fuente, doc=doc, sec=sec, sub=sub, cab=cab, ancla='', url=url, urlDirecta=True, bloques=buf, peso=peso))

def elementos(d):
    for ch in d.element.body.iterchildren():
        if ch.tag.endswith('}p'): yield Paragraph(ch, d)
        elif ch.tag.endswith('}tbl'): yield Table(ch, d)

ES_SEC = re.compile(r'^([A-ZÑ](\.bis)?|\d+(\.\d+)*)\.\s+\S')
def es_encabezado(p):
    t = limpio(p.text)
    if not t or len(t) > 120: return False
    st = ((p.style.name if p.style is not None else '') or '').lower()
    if 'heading' in st or 'título' in st or 'titulo' in st: return True
    if ES_SEC.match(t) and not t.endswith('.'): return True
    runs = [r for r in p.runs if r.text.strip()]
    return bool(runs) and all(r.bold for r in runs) and not t.endswith('.') and len(t) < 90

def docx_a_trozos(ruta, fuente, nombre, url, peso=1.0, saltar=0):
    d = docx.Document(ruta)
    sec, sub, bl = '', '', []
    def cerrar():
        nonlocal bl
        if bl: add(fuente, nombre, sec, sub, bl, url, peso)
        bl = []
    for i, el in enumerate(elementos(d)):
        if isinstance(el, Table):
            for r in el.rows:
                celdas = []
                for c in r.cells:
                    t = limpio(c.text)
                    if t and (not celdas or celdas[-1] != t): celdas.append(t)
                if celdas: bl.append(' · '.join(celdas))
            continue
        t = limpio(el.text)
        if not t: continue
        if i < saltar: continue
        if es_encabezado(el):
            if ES_SEC.match(t) or len(bl) > 0 or not sub:
                cerrar()
            if re.match(r'^(Curso|Trimestre)\b', t): sub = t if t.startswith('Curso') else (sub.split(' · ')[0] + ' · ' + t if sub.startswith('Curso') else t)
            else: sec, sub = t, ''
            continue
        bl.append(t)
    cerrar()

# 1. Programaciones didácticas
pdir = os.path.join(R, 'proyectocentro/descargas/programaciones')
for f in sorted(os.listdir(pdir)):
    if not f.endswith('.docx'): continue
    m = re.match(r'Programacion_(.+)_(\d)_ciclo\.docx', f)
    ACENTOS = {'Educacion Artistica': 'Educación Artística', 'Educacion Fisica': 'Educación Física', 'Frances Segunda Lengua': 'Francés (Segunda Lengua)',
               'Ingles': 'Inglés', 'Lengua': 'Lengua Castellana y Literatura', 'Matematicas': 'Matemáticas', 'Religion Catolica': 'Religión Católica'}
    area = m.group(1).replace('_', ' ') if m else f
    area = ACENTOS.get(area, area)
    ciclo = CICLOS.get(m.group(2), '') if m else ''
    nombre = f'Programación de {area} · {ciclo}'
    docx_a_trozos(os.path.join(pdir, f), 'Programaciones', nombre, GH + 'proyectocentro/descargas/programaciones/' + f, 1.0, saltar=3)

# 2. Otros documentos en Word
for ruta, fuente, nombre, url in [
    ('proyectocentro/descargas/Propuesta_pedagogica_Infantil.docx', 'Programaciones', 'Propuesta pedagógica de Educación Infantil', GH + 'proyectocentro/descargas/Propuesta_pedagogica_Infantil.docx'),
    ('capiguia/Atencion_a_la_diversidad_en_el_aula.docx', 'CapiGuía', 'Atención a la diversidad en el aula', GH + 'capiguia/Atencion_a_la_diversidad_en_el_aula.docx'),
    ('capiguia/Como_trabajamos_lectura_y_problemas.docx', 'CapiGuía', 'Cómo trabajamos la lectura y los problemas', GH + 'capiguia/Como_trabajamos_lectura_y_problemas.docx'),
    ('capiguia/descargas/Mapa_progresion_contenidos.docx', 'CapiGuía', 'Mapa de progresión de contenidos', GH + 'capiguia/descargas/Mapa_progresion_contenidos.docx')]:
    p = os.path.join(R, ruta)
    if os.path.exists(p): docx_a_trozos(p, fuente, nombre, url, 1.1)

# 3. «Qué se trabaja en X.º de Primaria» (resúmenes para familias)
for n in range(1, 7):
    p = os.path.join(R, f'capiguia/descargas/Que_se_trabaja_en_{n}_Primaria.pdf')
    if not os.path.exists(p): continue
    txt = subprocess.run(['pdftotext', '-layout', p, '-'], capture_output=True, text=True).stdout
    sec, bl = '', []
    for linea in txt.split('\n'):
        t = limpio(linea)
        if not t or re.match(r'^(Página|Pág\.?)\s*\d', t): continue
        if t.isupper() and len(t) < 70:
            if bl: add('CapiGuía', f'Qué se trabaja en {n}.º de Primaria', sec, '', bl, GH + f'capiguia/descargas/Que_se_trabaja_en_{n}_Primaria.pdf', 1.0)
            sec, bl = t.capitalize(), []
            continue
        if bl and not re.search(r'[.:;]$', bl[-1]) and len(bl[-1]) < 300: bl[-1] += ' ' + t
        else: bl.append(t)
    if bl: add('CapiGuía', f'Qué se trabaja en {n}.º de Primaria', sec, '', bl, GH + f'capiguia/descargas/Que_se_trabaja_en_{n}_Primaria.pdf', 1.0)

# 4. Criterios de evaluación y saberes oficiales por curso (app SDA)
sda = open(os.path.join(R, 'sdacapitulaciones/index.html'), encoding='utf-8').read()
cur = json.loads(zlib.decompress(base64.b64decode(re.search(r'var _CURRIC_GZ = "([^"]+)"', sda).group(1)), 16 + zlib.MAX_WBITS))
SAB = cur.get('saberes', {})
URL_SDA = GH + 'sdacapitulaciones/'
for clave, info in cur['primaria'].items():
    nombre = info['n']
    for c, x in info['c'].items():
        curso = CURSO_TXT.get(c, c) + ' de Primaria'
        crit = []
        for comp, lista in (x.get('cr') or {}).items():
            for cod, t in lista: crit.append(f'{cod}. {t}')
        add('Currículo', f'Criterios de evaluación · {nombre}', curso, '', crit, URL_SDA, 1.0)
        for bloque, ids in (x.get('sb') or []):
            add('Currículo', f'Saberes básicos · {nombre}', curso, bloque, [SAB.get(i, '') for i in ids], URL_SDA, 0.95)
# Lengua y Matemáticas (criterios por curso, con sus códigos)
L = sda.split('\n')
def mapa(inicio):
    s = ''
    i = inicio
    while True:
        s += L[i] + '\n'
        if L[i].strip().startswith('};'): break
        i += 1
    s = s.replace('const map = ', '', 1).rstrip().rstrip(';')
    s = re.sub(r'([{,]\s*)(c|t):', r'\1"\2":', s)
    return json.loads(s)
for nombre, marca in [('Matemáticas', "'Matemáticas':{tag:"), ('Lengua Castellana y Literatura', "'Lengua Castellana y Literatura':{tag:")]:
    ini = next(i for i, l in enumerate(L) if marca in l)
    gc = next(i for i in range(ini, ini + 200) if 'getCriterios: function' in L[i])
    m = mapa(gc + 1)
    for curso, lista in m.items():
        add('Currículo', f'Criterios de evaluación · {nombre}', curso.replace('º', '.º') + ' de Primaria', '', [f"{x['c']}. {x['t']}" for x in lista], URL_SDA, 1.0)

# Quitar trozos repetidos (las programaciones comparten apartados comunes)
vistos, unicos = {}, []
for t in trozos:
    k = ' '.join(t['bloques'])
    if k in vistos:
        u = vistos[k]
        if t['fuente'] == 'Currículo' and u['doc'] == t['doc'] and t['sec'] not in u['sec']:
            u['sec'] = u['sec'].replace(' de Primaria', '') + ' y ' + t['sec']
        elif t['fuente'] == 'Programaciones' and u['fuente'] == 'Programaciones' and u['doc'] != t['doc']:
            u['doc'] = 'Programaciones didácticas (apartado común a todas las áreas)'
        continue
    vistos[k] = t; unicos.append(t)
trozos = unicos
json.dump(trozos, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print(len(trozos), 'trozos', os.path.getsize(OUT) // 1024, 'KB', dict(Counter(t['fuente'] for t in trozos)))

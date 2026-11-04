'use strict';
/* ============ Podcast a Vídeo v2 · CEIP Capitulaciones ============ */
const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const ease = p => p<.5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2;
const easeOut = p => 1-Math.pow(1-p,3);
const easeBack = p => { const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2); };
const fmt = s => { s=Math.max(0,Math.round(s)); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=String(s%60).padStart(2,'0'); return h?`${h}:${String(m).padStart(2,'0')}:${x}`:`${m}:${x}`; };
const fmtD = s => { s=Math.max(0,s); return `${Math.floor(s/60)}:${(s%60).toFixed(1).padStart(4,'0')}`; };
function rng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const escapar = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FB='"Baloo 2",Nunito,"Arial Rounded MT Bold",Arial,sans-serif', FN='Nunito,Arial,sans-serif';
const AVISO_ID='2026-11-04-v2', AVISO_TXT='Final con el vídeo del logo, sintonías, efectos de sonido, mejorar la voz, clip para redes y exportar en MP3.';

const PALETAS = [
  {a:'#3346c9',b:'#8a3ee0',c:'#ff9f43'},
  {a:'#ff6b4a',b:'#f2357a',c:'#ffd23f'},
  {a:'#0f9b8e',b:'#2bb3e8',c:'#ffd166'},
  {a:'#e8458b',b:'#7a4ce0',c:'#53e0c1'},
  {a:'#f59e0b',b:'#ef4444',c:'#3b82f6'},
  {a:'#1e3a8a',b:'#0e7490',c:'#f472b6'}
];
const TRANS = ['fundido','iris','deslizar','persiana','barrido','giro','mosaico','destello'];
const FPS = 30, TR = 1.1, VIDEO_MAX = 30;
const SFX = [
  {id:'aplausos',em:'👏',nombre:'Aplausos'},
  {id:'campana',em:'🔔',nombre:'Campana'},
  {id:'redoble',em:'🥁',nombre:'Redoble'},
  {id:'acierto',em:'✨',nombre:'¡Acierto!'},
  {id:'tada',em:'🎺',nombre:'¡Tachán!'},
  {id:'whoosh',em:'💨',nombre:'Zas'},
  {id:'propio',em:'📂',nombre:'Mi sonido…'}
];
const PLANTILLAS_BASE = {
  'Radio Capitulaciones':{titulo:'Radio Capitulaciones',sub:'Episodio 1',paleta:0,sintonia:'epica',ondaEstilo:'barras',trans:'auto'},
  'Valores del mes':{titulo:'Un mes, un valor',sub:'Juntos crecemos',paleta:3,sintonia:'tranquila',ondaEstilo:'circulo',trans:'fundido'},
  'Noticias del cole':{titulo:'Noticias del cole',sub:'CEIP Capitulaciones · Santa Fe',paleta:1,sintonia:'alegre',ondaEstilo:'linea',trans:'auto'}
};
const CLAVES_PLANTILLA=['titulo','sub','introDur','paleta','sintonia','finTipo','fin','finDur','trans','ondaEstilo','nombre','marca','movimiento','fondo','fondoVol','mejorar'];

const S = {
  audio:null,        // podcast original {name,buffer,dur}
  voz:null,          // {buffer, levels, lvRate} (mejorada o no)
  items:[], efectos:[], logo:null,
  logoVid:null,      // {el,dur,w,h,audio}
  musica:{sintonia:null,fondo:null},  // AudioBuffers propios
  synth:{},          // cache de sonidos generados
  mezcla:null, mezclaKey:'',
  cfg:{titulo:'',sub:'',introDur:6,fin:'¡Gracias por escuchar!',finDur:6,finTipo:'video',paleta:0,sintonia:'epica',
       trans:'auto',formato:'h',calidad:'720',ondaEstilo:'barras',nombre:true,marca:false,movimiento:true,fondo:false,fondoVol:8,mejorar:true},
  play:{on:false,t:0,startCtx:0,startT:0,src:null,raf:0},
  nextId:1, ocupado:false
};
let AC=null;
const actx = () => (AC ||= new (window.AudioContext||window.webkitAudioContext)());
const SR = () => S.audio ? S.audio.buffer.sampleRate : 48000;

/* ---------- utilidades UI ---------- */
let toastT;
function toast(t,ms=2600){ const e=$('#toast'); e.textContent=t; e.classList.add('ver'); clearTimeout(toastT); toastT=setTimeout(()=>e.classList.remove('ver'),ms); }
function modal(html){ $('#modalCaja').innerHTML=html; $('#modal').hidden=false; }
function cerrarModal(){ $('#modal').hidden=true; }
function estado(t){ $('#estado').textContent=t||''; }
const pausa = () => new Promise(r=>setTimeout(r,0));

function cargarCfg(){ try{ Object.assign(S.cfg, JSON.parse(localStorage.getItem('podcastvideo_cfg')||'{}')); }catch(e){} }
function guardarCfg(){ try{ localStorage.setItem('podcastvideo_cfg', JSON.stringify(S.cfg)); }catch(e){} }

/* ===================== SÍNTESIS DE SONIDO ===================== */
function ruido(ctx,dur){ const b=ctx.createBuffer(1,Math.ceil(dur*ctx.sampleRate),ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; const s=ctx.createBufferSource(); s.buffer=b; return s; }
function env(g,t,a,peak,dec,sus=0){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(Math.max(sus,0.0001),t+a+dec); }
const hz = n => 440*Math.pow(2,(n-69)/12);   // número MIDI → Hz
function tono(ctx,dest,{f,t,dur,tipo='sine',vol=.2,a=.01,r=.3,det=0,filtro=0}){
  const o=ctx.createOscillator(), g=ctx.createGain(); o.type=tipo; o.frequency.value=f; o.detune.value=det;
  let n=o; if(filtro){ const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=filtro; o.connect(lp); n=lp; }
  n.connect(g); g.connect(dest);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+a);
  g.gain.setValueAtTime(vol,Math.max(t+a,t+dur-r)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.start(t); o.stop(t+dur+.05);
}
function campana(ctx,dest,t,f,vol=.25,dur=2.2){
  const c=ctx.createOscillator(), m=ctx.createOscillator(), mg=ctx.createGain(), g=ctx.createGain();
  c.frequency.value=f; m.frequency.value=f*3.5; mg.gain.setValueAtTime(f*2.2,t); mg.gain.exponentialRampToValueAtTime(1,t+dur);
  m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(dest); env(g,t,.005,vol,dur);
  c.start(t); m.start(t); c.stop(t+dur+.1); m.stop(t+dur+.1);
}
function timbal(ctx,dest,t,f=73,vol=.7){
  const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(f*1.25,t); o.frequency.exponentialRampToValueAtTime(f,t+.08);
  o.connect(g); g.connect(dest); env(g,t,.004,vol,1.6); o.start(t); o.stop(t+1.8);
  const n=ruido(ctx,.3), lp=ctx.createBiquadFilter(), ng=ctx.createGain(); lp.type='lowpass'; lp.frequency.value=500;
  n.connect(lp); lp.connect(ng); ng.connect(dest); env(ng,t,.002,vol*.5,.25); n.start(t);
}
function platillo(ctx,dest,t,dur,vol=.25,subida=0){
  const n=ruido(ctx,dur+subida+.1), hp=ctx.createBiquadFilter(), g=ctx.createGain(); hp.type='highpass'; hp.frequency.value=5500;
  n.connect(hp); hp.connect(g); g.connect(dest);
  if(subida){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+subida); g.gain.exponentialRampToValueAtTime(0.0001,t+subida+dur); }
  else env(g,t,.003,vol,dur);
  n.start(t);
}
function bombo(ctx,dest,t,vol=.9){ const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+.13); o.connect(g); g.connect(dest); env(g,t,.002,vol,.38); o.start(t); o.stop(t+.45); }
function palmada(ctx,dest,t,vol=.35){ for(let k=0;k<3;k++){ const n=ruido(ctx,.2), bp=ctx.createBiquadFilter(), g=ctx.createGain(); bp.type='bandpass'; bp.frequency.value=1300; bp.Q.value=1.2; n.connect(bp); bp.connect(g); g.connect(dest); env(g,t+k*.012,.001,vol,k<2?.03:.16); n.start(t+k*.012); } }
function metal(ctx,dest,notas,t,dur,vol=.09){   // “metales” y cuerdas: sierras desafinadas filtradas
  for(const n of notas) for(const d of [-9,0,9]){
    const o=ctx.createOscillator(), lp=ctx.createBiquadFilter(), g=ctx.createGain(); o.type='sawtooth'; o.frequency.value=hz(n); o.detune.value=d;
    lp.type='lowpass'; lp.frequency.setValueAtTime(500,t); lp.frequency.linearRampToValueAtTime(2600,t+Math.min(.6,dur*.4)); lp.frequency.linearRampToValueAtTime(1400,t+dur);
    o.connect(lp); lp.connect(g); g.connect(dest);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.12); g.gain.setValueAtTime(vol,t+dur-.25); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.start(t); o.stop(t+dur+.05);
  }
}
function colchon(ctx,dest,notas,t,dur,vol=.05){
  for(const n of notas) for(const [tp,d] of [['triangle',-6],['sine',6]]) tono(ctx,dest,{f:hz(n),t,dur,tipo:tp,vol,a:Math.min(1,dur*.35),r:Math.min(1.2,dur*.4),det:d});
}
async function renderSonido(dur,fn,sr=SR()){
  const ctx=new OfflineAudioContext(2,Math.ceil(dur*sr),sr);
  const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4;
  const rev=ctx.createConvolver(), ir=ctx.createBuffer(2,sr*2,sr);
  for(let c=0;c<2;c++){ const d=ir.getChannelData(c); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3.2); }
  rev.buffer=ir; const wet=ctx.createGain(); wet.gain.value=.22;
  const bus=ctx.createGain(); bus.connect(comp); bus.connect(rev); rev.connect(wet); wet.connect(comp); comp.connect(ctx.destination);
  fn(ctx,bus,dur); return ctx.startRendering();
}
function sintonia(tipo,D){
  return renderSonido(D,(c,o,D)=>{
    if(tipo==='epica'){
      // redoble de timbales que crece + platillo + gran acorde de metales en Re mayor
      for(let t=0;t<1.1;t+=.07) timbal(c,o,t,73,.08+.32*t/1.1);
      platillo(c,o,0,1.6,.18,1.1);
      timbal(c,o,1.15,73,.9); timbal(c,o,1.15,55,.6); platillo(c,o,1.15,2.5,.22);
      const acordes=[[50,62,66,69],[47,59,62,66],[43,55,62,67],[45,57,61,64],[50,62,66,69,74]];
      const resto=D-1.15, paso=resto/4.2;
      acordes.forEach((ac,i)=>{ const t=1.15+i*paso, d=i===4?Math.max(1.5,D-t):paso+.15; metal(c,o,ac,t,d,i===4?.075:.065); colchon(c,o,ac.map(n=>n+12),t,d,.025); });
      const mel=[74,76,78,81,78,86];
      mel.forEach((n,i)=>campana(c,o,1.2+i*resto/7,hz(n),.12,2.4));
      timbal(c,o,1.15+4*paso,73,.8); platillo(c,o,1.15+4*paso,2.2,.15);
    } else if(tipo==='alegre'){
      const bpm=124, b=60/bpm, acordes=[[60,64,67],[67,71,74],[69,72,76],[65,69,72]];
      for(let t=0,k=0;t<D-.9;t+=b,k++){
        bombo(c,o,t,.7); if(k%2) palmada(c,o,t,.32);
        const ac=acordes[Math.floor(k/4)%4];
        ac.forEach((n,j)=>tono(c,o,{f:hz(n+12),t:t+j*b/3,dur:.35,tipo:'triangle',vol:.1,a:.004,r:.3,filtro:3500}));
        if(k%4===0) colchon(c,o,ac,t,b*4,.03);
      }
      const fin=D-.9; [72,76,79,84].forEach((n,i)=>tono(c,o,{f:hz(n),t:fin+i*.06,dur:1.1,tipo:'square',vol:.05,a:.005,r:.8,filtro:2600}));
      campana(c,o,fin,hz(96),.12); platillo(c,o,fin,1.2,.12); bombo(c,o,fin,.9);
    } else {
      const acordes=[[57,64,69,72],[53,60,65,69],[48,55,64,67],[55,62,67,71]], paso=D/4;
      acordes.forEach((ac,i)=>colchon(c,o,ac,i*paso,paso+1,.04));
      const mel=[81,79,76,79,84,81,79,76];
      mel.forEach((n,i)=>campana(c,o,.3+i*(D-.8)/8,hz(n),.08,2.6));
    }
  });
}
function fondoSuave(){
  return renderSonido(16,(c,o)=>{
    const acordes=[[57,64,69,72],[53,60,65,69],[48,55,64,67],[55,62,67,71]];
    acordes.forEach((ac,i)=>colchon(c,o,ac,i*4-.5,5.2,.035));
    [81,79,76,77,79,76,74,72].forEach((n,i)=>campana(c,o,.5+i*2,hz(n),.035,3));
  });
}
function efecto(id){
  const durs={aplausos:3,campana:3,redoble:2.6,acierto:1.6,tada:2.2,whoosh:1};
  return renderSonido(durs[id]||2,(c,o,D)=>{
    if(id==='aplausos'){ for(let i=0;i<260;i++){ const t=Math.random()*2.3, v=.05+.2*Math.sin(Math.PI*t/2.5); const n=ruido(c,.08), bp=c.createBiquadFilter(), g=c.createGain(); bp.type='bandpass'; bp.frequency.value=900+Math.random()*1800; bp.Q.value=1; n.connect(bp); bp.connect(g); g.connect(o); env(g,t,.001,v,.06); n.start(t); } }
    else if(id==='campana'){ campana(c,o,0,hz(84),.3,2.8); campana(c,o,.35,hz(79),.25,2.6); }
    else if(id==='redoble'){ for(let t=0;t<1.5;t+=.045){ const n=ruido(c,.08), bp=c.createBiquadFilter(), g=c.createGain(); bp.type='bandpass'; bp.frequency.value=2200; bp.Q.value=.7; n.connect(bp); bp.connect(g); g.connect(o); env(g,t,.001,.05+.25*t/1.5,.06); n.start(t); } bombo(c,o,1.55,1); platillo(c,o,1.55,1,.3); }
    else if(id==='acierto'){ [84,88,91,96].forEach((n,i)=>campana(c,o,i*.09,hz(n),.18,1.2)); }
    else if(id==='tada'){ tono(c,o,{f:hz(67),t:0,dur:.18,tipo:'square',vol:.07,a:.005,r:.1,filtro:2500}); [60,64,67,72].forEach(n=>tono(c,o,{f:hz(n),t:.2,dur:1.8,tipo:'sawtooth',vol:.05,a:.01,r:1.2,filtro:2400})); platillo(c,o,.2,1.6,.2); bombo(c,o,.2); }
    else if(id==='whoosh'){ const n=ruido(c,1), bp=c.createBiquadFilter(), g=c.createGain(); bp.type='bandpass'; bp.Q.value=2; bp.frequency.setValueAtTime(300,0); bp.frequency.exponentialRampToValueAtTime(4000,.45); bp.frequency.exponentialRampToValueAtTime(800,.9); n.connect(bp); bp.connect(g); g.connect(o); g.gain.setValueAtTime(.0001,0); g.gain.exponentialRampToValueAtTime(.5,.45); g.gain.exponentialRampToValueAtTime(.0001,.95); n.start(0); }
  });
}
async function sonidoSintonia(){
  const tipo=S.cfg.sintonia; if(tipo==='ninguna') return null;
  if(tipo==='propia') return S.musica.sintonia;
  const key='sin-'+tipo+'-'+(S.cfg.introDur+1.6)+'-'+SR();
  return S.synth[key] ||= await sintonia(tipo,S.cfg.introDur+1.6);
}
async function sonidoFondo(){
  if(!S.cfg.fondo) return null;
  if($('#oFondoTipo').value==='propia') return S.musica.fondo;
  return S.synth['fondo'+SR()] ||= await fondoSuave();
}
async function sonidoEfecto(ef){ if(ef.tipo==='propio') return ef.buffer; return S.synth['sfx-'+ef.tipo+SR()] ||= await efecto(ef.tipo); }

/* ===================== MEJORAR LA VOZ ===================== */
async function mejorarVoz(buf){
  const sr=buf.sampleRate, ch=Math.min(2,buf.numberOfChannels);
  const ctx=new OfflineAudioContext(ch,buf.length,sr), src=ctx.createBufferSource(); src.buffer=buf;
  const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=85; hp.Q.value=.7;
  const hum=ctx.createBiquadFilter(); hum.type='notch'; hum.frequency.value=50; hum.Q.value=8;
  const barro=ctx.createBiquadFilter(); barro.type='peaking'; barro.frequency.value=280; barro.gain.value=-2.5; barro.Q.value=1;
  const pres=ctx.createBiquadFilter(); pres.type='peaking'; pres.frequency.value=3200; pres.gain.value=3; pres.Q.value=.9;
  const ess=ctx.createBiquadFilter(); ess.type='highshelf'; ess.frequency.value=8500; ess.gain.value=-3;
  const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-24; comp.knee.value=10; comp.ratio.value=3.5; comp.attack.value=.006; comp.release.value=.2;
  src.connect(hp); hp.connect(hum); hum.connect(barro); barro.connect(pres); pres.connect(ess); ess.connect(comp); comp.connect(ctx.destination); src.start();
  const out=await ctx.startRendering();
  // puerta de ruido suave + volumen igualado
  const datos=[...Array(ch).keys()].map(c=>out.getChannelData(c)), win=Math.round(sr*.02), n=Math.ceil(out.length/win), rms=new Float32Array(n);
  for(let i=0;i<n;i++){ let s=0; const a=i*win, b=Math.min(out.length,a+win); for(let j=a;j<b;j+=2){ const v=datos[0][j]; s+=v*v; } rms[i]=Math.sqrt(s/Math.max(1,(b-a)/2)); }
  const ord=Float32Array.from(rms).sort(), suelo=ord[Math.floor(n*.1)]||0, umbral=Math.max(suelo*3,1e-4);
  let voz=0,cuenta=0; for(const v of rms) if(v>umbral){ voz+=v*v; cuenta++; }
  const nivelVoz=Math.sqrt(voz/Math.max(1,cuenta))||.05;
  let gan=clamp(.12/nivelVoz,.5,6), pico=0;
  for(const d of datos) for(let i=0;i<d.length;i+=3){ const v=Math.abs(d[i]); if(v>pico) pico=v; }
  gan=Math.min(gan,.96/Math.max(pico,1e-4)*1.6);
  let gs=1;
  for(let i=0;i<n;i++){
    const obj=rms[i]>umbral?1:.3, a=i*win, b=Math.min(out.length,a+win);
    for(let j=a;j<b;j++){
      gs+= (obj-gs)*(obj>gs?.02:.0015);
      for(const d of datos){ let v=d[j]*gs*gan; if(v>.95) v=.95+Math.tanh(v-.95)*.04; else if(v<-.95) v=-.95-Math.tanh(-v-.95)*.04; d[j]=v; }
    }
    if(i%400===0) await pausa();
  }
  return out;
}
function niveles(buf){
  const rate=50, win=Math.floor(buf.sampleRate/rate), n=Math.ceil(buf.length/win);
  const chs=[...Array(Math.min(2,buf.numberOfChannels)).keys()].map(c=>buf.getChannelData(c)), lv=new Float32Array(n);
  for(let i=0;i<n;i++){ let s=0; const a=i*win, b=Math.min(buf.length,a+win);
    for(let j=a;j<b;j+=4){ let v=0; for(const ch of chs) v+=ch[j]; v/=chs.length; s+=v*v; }
    lv[i]=Math.sqrt(s/Math.max(1,(b-a)/4)); }
  const ord=Array.from(lv).sort((x,y)=>x-y), ref=ord[Math.floor(ord.length*.95)]||1;
  for(let i=0;i<n;i++) lv[i]=clamp(lv[i]/ref,0,1);
  return {levels:lv,lvRate:rate};
}
let vozPend=null;
async function prepararVoz(){
  if(!S.audio){ S.voz=null; return; }
  const key=S.audio.name+S.audio.dur+'|'+S.cfg.mejorar;
  if(S.voz && S.voz.key===key) return;
  if(vozPend && vozPend.key===key) return vozPend.p;
  const p=(async()=>{
    estado(S.cfg.mejorar?'✨ Mejorando la voz…':'');
    const b=S.cfg.mejorar ? await mejorarVoz(S.audio.buffer) : S.audio.buffer;
    S.voz={key,buffer:b,...niveles(b)}; estado(''); S.mezclaKey=''; dibujarLinea();
  })();
  vozPend={key,p}; await p; vozPend=null;
}

/* ===================== MEZCLA FINAL ===================== */
function claveMezcla(tl){ return JSON.stringify([S.voz&&S.voz.key,S.cfg.sintonia,S.cfg.introDur,S.cfg.fondo,S.cfg.fondoVol,$('#oFondoTipo').value,S.efectos.map(e=>[e.id,e.t,e.vol]),tl.P0,tl.finAudio,tl.total,S.cfg.finTipo,!!S.logoVid,!!S.musica.sintonia,!!S.musica.fondo]); }
async function obtenerMezcla(){
  await prepararVoz();
  const tl=TL(), key=claveMezcla(tl);
  if(S.mezcla && S.mezclaKey===key) return S.mezcla;
  estado('🎚️ Preparando el sonido…');
  const sr=SR(), ch=tl.total>1800?1:2;
  const ctx=new OfflineAudioContext(ch,Math.ceil(tl.total*sr),sr);
  const master=ctx.createDynamicsCompressor(); master.threshold.value=-3; master.ratio.value=12; master.attack.value=.002; master.connect(ctx.destination);
  const poner=(buf,t,vol=1,{fadeIn=0,fadeOut=0,offset=0,dur=null,loop=false}={})=>{
    if(!buf) return; const s=ctx.createBufferSource(), g=ctx.createGain(); s.buffer=buf; s.loop=loop; s.connect(g); g.connect(master);
    const d=dur??(buf.duration-offset);
    g.gain.setValueAtTime(fadeIn?0:vol,t); if(fadeIn) g.gain.linearRampToValueAtTime(vol,t+fadeIn);
    if(fadeOut){ g.gain.setValueAtTime(vol,Math.max(t+fadeIn,t+d-fadeOut)); g.gain.linearRampToValueAtTime(0,t+d); }
    s.start(t,offset,loop?undefined:d); if(loop) s.stop(t+d);
  };
  if(S.voz) poner(S.voz.buffer,tl.P0,1);
  const sin=await sonidoSintonia();
  if(sin){ const d=Math.min(sin.duration,tl.P0+1.6); poner(sin,0,.7,{fadeOut:S.cfg.sintonia==='propia'?1.6:.8,dur:d}); }
  const fondo=await sonidoFondo();
  if(fondo && S.voz) poner(fondo,tl.P0,S.cfg.fondoVol/100,{fadeIn:2,fadeOut:3,dur:tl.finAudio-tl.P0,loop:true});
  for(const ef of S.efectos){ const b=await sonidoEfecto(ef); if(b && ef.t<tl.total) poner(b,ef.t,ef.vol); }
  if(tl.finVideo && S.logoVid.audio) poner(S.logoVid.audio,tl.finAudio,1,{fadeOut:.4,dur:Math.min(S.logoVid.audio.duration,tl.total-tl.finAudio)});
  S.mezcla=await ctx.startRendering(); S.mezclaKey=key; estado('');
  return S.mezcla;
}

/* ===================== CARGA DE ARCHIVOS ===================== */
async function cargarAudio(file){
  if(!file) return;
  $('#audioTxt').innerHTML='Leyendo el audio…';
  try{
    pararPreview();
    const buf=await actx().decodeAudioData(await file.arrayBuffer());
    S.audio={name:file.name,buffer:buf,dur:buf.duration}; S.voz=null; S.synth={};
    $('#audioTxt').innerHTML=`<b>${escapar(file.name)}</b> · ${fmt(buf.duration)}`;
    $('#zonaAudio').classList.add('ok');
    if(buf.duration>3600) toast('El audio dura más de una hora: el vídeo tardará bastante en crearse.',4000);
    actualizar(); await prepararVoz();
  }catch(e){
    console.error(e); S.audio=null; $('#zonaAudio').classList.remove('ok');
    $('#audioTxt').innerHTML='<b>No se ha podido leer ese audio.</b> Prueba con un mp3 o m4a.';
  }
  actualizar();
}
async function decodificar(file){ return actx().decodeAudioData(await file.arrayBuffer()); }

async function cargarMedios(files){
  let malos=0;
  for(const f of [...files]){
    try{
      if(f.type.startsWith('video/')) S.items.push(await cargarVideo(f));
      else if(f.type.startsWith('image/')||/\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)) S.items.push(await cargarFoto(f));
      else malos++;
    }catch(e){ console.error(e); malos++; }
    pintarItems(); actualizar();
  }
  if(malos) toast(`${malos} archivo${malos>1?'s':''} no se ${malos>1?'han':'ha'} podido abrir (prueba con JPG, PNG o MP4).`,4000);
}
function miniaturas(src,w,h,item){
  const t=document.createElement('canvas'), k=Math.min(1,220/Math.max(w,h));
  t.width=Math.round(w*k); t.height=Math.round(h*k); t.getContext('2d').drawImage(src,0,0,t.width,t.height); item.thumb=t;
  const s=document.createElement('canvas'); s.width=32; s.height=Math.max(8,Math.round(32*h/w)); s.getContext('2d').drawImage(src,0,0,s.width,s.height); item.tiny=s;
}
async function cargarFoto(f){
  let bmp=await createImageBitmap(f);
  const M=2400, mx=Math.max(bmp.width,bmp.height);
  if(mx>M){ const k=M/mx, b2=await createImageBitmap(bmp,{resizeWidth:Math.round(bmp.width*k),resizeHeight:Math.round(bmp.height*k),resizeQuality:'high'}); bmp.close(); bmp=b2; }
  const it={id:S.nextId++,tipo:'foto',src:bmp,w:bmp.width,h:bmp.height,nombre:f.name};
  miniaturas(bmp,bmp.width,bmp.height,it); return it;
}
function esperar(el,ev){ return new Promise((ok,ko)=>{ el.addEventListener(ev,ok,{once:true}); el.addEventListener('error',ko,{once:true}); }); }
function nuevoVideo(src){
  const v=document.createElement('video'); v.muted=true; v.defaultMuted=true; v.playsInline=true; v.preload='auto';
  v.setAttribute('muted',''); v.setAttribute('playsinline',''); v.src=src; return v;
}
async function cargarVideo(f){
  const v=nuevoVideo(URL.createObjectURL(f));
  await esperar(v,'loadeddata');
  if(!isFinite(v.duration)||!v.videoWidth) throw new Error('vídeo no válido');
  v.currentTime=Math.min(.5,v.duration/2); await esperar(v,'seeked');
  const it={id:S.nextId++,tipo:'video',src:v,w:v.videoWidth,h:v.videoHeight,dur:v.duration,nombre:f.name,tinyCv:document.createElement('canvas')};
  miniaturas(v,v.videoWidth,v.videoHeight,it); it.tinyCv.width=it.tiny.width; it.tinyCv.height=it.tiny.height;
  return it;
}
async function cargarLogoVideo(){
  try{
    const resp=await fetch('logo-final.mp4'); const blob=await resp.blob();
    const v=nuevoVideo(URL.createObjectURL(blob)); await esperar(v,'loadeddata');
    let audio=null; try{ audio=await actx().decodeAudioData(await blob.arrayBuffer()); }catch(e){}
    S.logoVid={el:v,dur:v.duration,w:v.videoWidth,h:v.videoHeight,audio};
  }catch(e){ console.warn('Sin vídeo del logo',e); S.logoVid=null; }
}

/* ---------- lista de fotos y vídeos ---------- */
let dragId=null;
function pintarItems(){
  const box=$('#fotos'); box.innerHTML='';
  S.items.forEach((it,i)=>{
    const d=document.createElement('div'); d.className='foto'; d.draggable=true;
    const c=it.thumb.cloneNode(); c.getContext('2d').drawImage(it.thumb,0,0); d.appendChild(c);
    d.insertAdjacentHTML('beforeend',`<span class="n">${i+1}</span>${it.tipo==='video'?`<span class="tipo">🎬 ${fmt(Math.min(it.dur,VIDEO_MAX))}</span>`:''}
      <button class="x" title="Quitar">✕</button><span class="mov"><button data-m="-1" title="Antes">◀</button><button data-m="1" title="Después">▶</button></span>`);
    d.querySelector('.x').onclick=()=>quitarItem(it.id);
    d.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>moverItem(it.id,+b.dataset.m));
    d.addEventListener('dragstart',()=>{ dragId=it.id; d.classList.add('arrastrando'); });
    d.addEventListener('dragend',()=>{ dragId=null; d.classList.remove('arrastrando'); box.querySelectorAll('.destino').forEach(x=>x.classList.remove('destino')); });
    d.addEventListener('dragover',e=>{ e.preventDefault(); d.classList.add('destino'); });
    d.addEventListener('dragleave',()=>d.classList.remove('destino'));
    d.addEventListener('drop',e=>{ e.preventDefault(); e.stopPropagation(); if(dragId===null||dragId===it.id) return;
      const from=S.items.findIndex(x=>x.id===dragId), [m]=S.items.splice(from,1); S.items.splice(S.items.findIndex(x=>x.id===it.id),0,m); pintarItems(); actualizar(); });
    box.appendChild(d);
  });
  const nf=S.items.filter(x=>x.tipo==='foto').length, nv=S.items.length-nf;
  $('#fotosInfo').textContent=S.items.length?[nf&&`${nf} foto${nf>1?'s':''}`,nv&&`${nv} vídeo${nv>1?'s':''}`].filter(Boolean).join(' · '):'';
  $('#zonaFotos').classList.toggle('ok',S.items.length>0);
}
function quitarItem(id){
  const i=S.items.findIndex(x=>x.id===id); if(i<0) return; const it=S.items[i];
  if(it.tipo==='video'){ it.src.pause(); URL.revokeObjectURL(it.src.src); } else it.src.close?.();
  S.items.splice(i,1); pintarItems(); actualizar();
}
function moverItem(id,d){ const i=S.items.findIndex(x=>x.id===id), j=i+d; if(j<0||j>=S.items.length) return; [S.items[i],S.items[j]]=[S.items[j],S.items[i]]; pintarItems(); actualizar(); }

/* ---------- efectos de sonido ---------- */
function pintarEfectos(){
  $('#sfxBotones').innerHTML=SFX.map(s=>`<button class="sfx-b" data-sfx="${s.id}" type="button">${s.em} ${s.nombre}</button>`).join('');
  document.querySelectorAll('[data-sfx]').forEach(b=>b.onclick=()=>{ if(b.dataset.sfx==='propio') $('#inSfx').click(); else anadirEfecto(b.dataset.sfx); });
  listaEfectos();
}
async function anadirEfecto(tipo,buffer=null,nombre=null){
  const tl=TL(), t=+clamp(S.play.t,0,Math.max(0,tl.total-1)).toFixed(1);
  const info=SFX.find(s=>s.id===tipo);
  S.efectos.push({id:S.nextId++,tipo,t,vol:.8,buffer,nombre:nombre||info.nombre,em:info.em});
  S.efectos.sort((a,b)=>a.t-b.t); listaEfectos(); actualizar();
  const b=buffer||await sonidoEfecto({tipo}); oirBuffer(b);
}
function listaEfectos(){
  $('#efectos').innerHTML=S.efectos.map(e=>`<div class="efecto" data-id="${e.id}"><span class="em">${e.em}</span><span class="nm">${escapar(e.nombre)}</span>
    <button data-a="-1" title="1 s antes">−1s</button><input type="number" step="0.5" min="0" value="${e.t}" title="Segundo"><button data-a="1" title="1 s después">+1s</button>
    <button data-a="ir" title="Ir ahí">👁</button><button data-a="x" title="Quitar">✕</button></div>`).join('');
  document.querySelectorAll('.efecto').forEach(row=>{
    const e=S.efectos.find(x=>x.id===+row.dataset.id);
    row.querySelector('input').onchange=ev=>{ e.t=Math.max(0,+ev.target.value||0); actualizar(); };
    row.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{
      const a=b.dataset.a;
      if(a==='x') S.efectos=S.efectos.filter(x=>x!==e);
      else if(a==='ir'){ irA(Math.max(0,e.t-1.5)); return; }
      else e.t=Math.max(0,+(e.t+(+a)).toFixed(1));
      listaEfectos(); actualizar();
    });
  });
}
let oyendo=null;
function oirBuffer(b){ if(!b) return; try{ oyendo?.stop(); }catch(e){} const c=actx(); c.resume(); const s=c.createBufferSource(); s.buffer=b; s.connect(c.destination); s.start(); oyendo=s; }

/* ===================== LÍNEA DE TIEMPO ===================== */
function lineaTiempo(){
  const I=S.cfg.introDur, items=S.items, conSint=S.cfg.sintonia!=='ninguna';
  const natural=it=>it.tipo==='video'?Math.min(it.dur,VIDEO_MAX):6;
  const P0=S.audio&&conSint?I-.3:0;
  let finAudio = S.audio ? Math.max(P0+S.audio.dur, I+1) : I+items.reduce((s,it)=>s+natural(it),0)+(items.length?0:4);
  const finVideo=S.cfg.finTipo==='video'&&S.logoVid;
  const F=finVideo?S.logoVid.dur:S.cfg.finDur;
  const A=finAudio-I, scenes=[{tipo:'intro',t0:0,t1:items.length?I:finAudio}];
  if(items.length){
    const vids=items.filter(x=>x.tipo==='video'), nF=items.length-vids.length, sumV=vids.reduce((s,v)=>s+natural(v),0);
    const fotoDur=nF?Math.max(3,(A-sumV)/nF):0, k=A/(sumV+nF*fotoDur); let t=I;
    items.forEach((it,i)=>{ const d=(it.tipo==='video'?natural(it):fotoDur)*k; scenes.push({tipo:'item',item:it,idx:i,t0:t,t1:t+d}); t+=d; });
    scenes[scenes.length-1].t1=finAudio;
  }
  scenes.push({tipo:'fin',t0:finAudio,t1:finAudio+F});
  const minD=Math.min(...scenes.map(s=>s.t1-s.t0)), tr=Math.min(TR,minD*.4);
  const r=rng(scenes.length*977+7); let prev='';
  scenes.forEach((s,i)=>{
    if(S.cfg.trans!=='auto'){ s.trans=S.cfg.trans; return; }
    if(i===0){ s.trans='iris'; return; }
    if(i===scenes.length-2){ s.trans='destello'; return; }
    let t; do{ t=TRANS[Math.floor(r()*TRANS.length)]; }while(t===prev); s.trans=prev=t;
  });
  return {scenes,total:finAudio+F,finAudio,tr,I,P0,finVideo:!!finVideo};
}

/* ===================== DIBUJO ===================== */
const buf={A:document.createElement('canvas'),B:document.createElement('canvas'),P:document.createElement('canvas')};
function dims(formato,calidad){ const q=+calidad; if(formato==='v') return q===1080?[1080,1920]:[720,1280]; if(formato==='c') return q===1080?[1080,1080]:[720,720]; return q===1080?[1920,1080]:[1280,720]; }
function rrect(g,x,y,w,h,r){ g.beginPath(); g.roundRect(x,y,w,h,r); }
function fitFont(g,txt,maxW,size,peso='800',fam=FB){ g.font=`${peso} ${size}px ${fam}`; const w=g.measureText(txt).width; if(w>maxW) size=Math.floor(size*maxW/w); g.font=`${peso} ${size}px ${fam}`; return size; }
function nivel(t,tl){
  const v=S.voz; if(!v) return .35+.25*Math.sin(t*5)*Math.sin(t*1.7);
  const i=(t-(tl?tl.P0:0))*v.lvRate; if(i<0||i>=v.levels.length-1) return 0;
  const j=Math.floor(i), f=i-j; return v.levels[j]*(1-f)+v.levels[j+1]*f;
}

/* --- INTRO --- */
function dibujarIntro(g,u,W,H){
  const P=PALETAS[S.cfg.paleta]||PALETAS[0], m=Math.min(W,H), r=rng(42), ang=u*.15;
  const gr=g.createLinearGradient(W/2-Math.cos(ang)*W,H/2-Math.sin(ang)*H,W/2+Math.cos(ang)*W,H/2+Math.sin(ang)*H);
  gr.addColorStop(0,P.a); gr.addColorStop(1,P.b); g.fillStyle=gr; g.fillRect(0,0,W,H);
  // rayos de luz que giran
  g.save(); g.translate(W/2,H*.33); g.rotate(u*.12); g.globalAlpha=.07*clamp(u/1.2,0,1); g.fillStyle='#fff';
  for(let i=0;i<12;i++){ g.rotate(Math.PI/6); g.beginPath(); g.moveTo(0,0); g.lineTo(Math.max(W,H),-m*.08); g.lineTo(Math.max(W,H),m*.08); g.fill(); }
  g.restore();
  for(let i=0;i<14;i++){
    const x=r()*W, y0=r()*H, rad=m*(.03+r()*.12), vel=.02+r()*.05, y=((y0-u*vel*H)%(H+rad*2)+H+rad*2)%(H+rad*2)-rad;
    g.fillStyle=`rgba(255,255,255,${.06+r()*.08})`; g.beginPath(); g.arc(x+Math.sin(u*.8+i)*m*.02,y,rad,0,7); g.fill();
  }
  // chispas doradas tras el golpe
  if(u>1.1){ for(let i=0;i<40;i++){ const a=r()*Math.PI*2, v=.3+r(), q=clamp((u-1.1)*v*.55,0,1); if(q>=1) continue;
    g.globalAlpha=(1-q)*.9; g.fillStyle=i%2?P.c:'#fff'; g.beginPath(); g.arc(W/2+Math.cos(a)*q*W*.55,H*.33+Math.sin(a)*q*H*.55,m*.006*(1-q)+1,0,7); g.fill(); } g.globalAlpha=1; }
  const cx=W/2, vert=H>W, cy=H*(vert?.34:.33), R=m*(vert?.12:.11), ent=easeBack(clamp((u-.15)/.9,0,1));
  for(let k=0;k<3;k++){ const q=((u*.7+k/3)%1); g.strokeStyle=`rgba(255,255,255,${(1-q)*.5})`; g.lineWidth=m*.006; g.beginPath(); g.arc(cx,cy,R*(1+q*1.4)*ent,0,7); g.stroke(); }
  g.save(); g.translate(cx,cy); g.scale(ent,ent);
  g.fillStyle='#fff'; g.shadowColor='rgba(0,0,0,.25)'; g.shadowBlur=m*.04; g.beginPath(); g.arc(0,0,R,0,7); g.fill(); g.shadowBlur=0;
  g.font=`${Math.round(R*1.05)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign='center'; g.textBaseline='middle';
  g.fillText('🎙️',0,R*.06); g.restore();
  const titulo=(S.cfg.titulo||'Mi podcast').trim(); let lineas=[titulo], fs=Math.round(m*(vert?.11:.13));
  g.font=`800 ${fs}px ${FB}`;
  if(g.measureText(titulo).width>W*.86&&titulo.includes(' ')){
    const pal=titulo.split(' '); let best=1,dif=1e9;
    for(let i=1;i<pal.length;i++){ const d=Math.abs(pal.slice(0,i).join(' ').length-pal.slice(i).join(' ').length); if(d<dif){dif=d;best=i;} }
    lineas=[pal.slice(0,best).join(' '),pal.slice(best).join(' ')];
  }
  lineas.forEach(l=>{ g.font=`800 ${fs}px ${FB}`; const w=g.measureText(l).width; if(w>W*.88) fs=Math.floor(fs*W*.88/w); });
  g.font=`800 ${fs}px ${FB}`; g.textBaseline='alphabetic'; g.textAlign='left';
  let ty=cy+R*1.6+fs*.9, n=0;
  for(const l of lineas){
    const w=g.measureText(l).width; let x=cx-w/2;
    for(const ch of l){
      const cw=g.measureText(ch).width, q=clamp((u-1.15-n*.045)/.5,0,1), e=easeBack(q);
      if(q>0){ g.save(); g.globalAlpha=clamp(q*2,0,1); g.translate(x+cw/2,ty+(1-e)*fs*.6); g.rotate((1-e)*.3);
        g.fillStyle='rgba(0,0,0,.18)'; g.fillText(ch,-cw/2+fs*.04,fs*.05); g.fillStyle='#fff'; g.fillText(ch,-cw/2,0); g.restore(); }
      x+=cw; n++;
    }
    ty+=fs*1.02;
  }
  const sub=(S.cfg.sub||'').trim(), qs=easeOut(clamp((u-1.5-n*.045)/.6,0,1));
  if(sub&&qs>0){
    const ss=fitFont(g,sub,W*.8,Math.round(m*(vert?.042:.05)),'700',FN);
    const w=g.measureText(sub).width+ss*1.4, h=ss*1.7, y=ty-fs*.35+ss*.4+(1-qs)*ss;
    g.globalAlpha=qs; g.fillStyle='rgba(255,255,255,.95)'; rrect(g,cx-w/2,y,w,h,h/2); g.fill();
    g.fillStyle=P.a; g.textAlign='center'; g.textBaseline='middle'; g.fillText(sub,cx,y+h/2+ss*.04); g.globalAlpha=1; ty=y+h;
  }
  const qb=clamp((u-1.6)/.6,0,1);
  if(qb>0){
    const nb=21, bw=m*.012, gap=bw*.9, tot=nb*(bw+gap), y=Math.min(H*.93,ty+m*.11);
    g.fillStyle=P.c; g.globalAlpha=qb;
    for(let i=0;i<nb;i++){ const h=m*.012+m*.07*Math.abs(Math.sin(u*4+i*.7))*(1-Math.abs(i-nb/2)/nb); rrect(g,cx-tot/2+i*(bw+gap),y-h/2,bw,h,bw/2); g.fill(); }
    g.globalAlpha=1;
  }
  if(S.logo){
    const lh=m*.16, lw=lh*S.logo.width/S.logo.height, q=easeOut(clamp((u-.3)/.6,0,1));
    g.globalAlpha=q; g.fillStyle='#fff'; rrect(g,m*.04,m*.04,lw+m*.02,lh+m*.02,m*.025); g.fill(); g.drawImage(S.logo,m*.05,m*.05,lw,lh); g.globalAlpha=1;
  }
  // destello del golpe de timbal
  const fl=u>1.1?Math.max(0,1-(u-1.1)/.35):0; if(fl>0){ g.fillStyle=`rgba(255,255,255,${fl*.55})`; g.fillRect(0,0,W,H); }
}

/* --- FOTO / VÍDEO --- */
function fuenteItem(it){
  if(it.tipo==='video'){ const tc=it.tinyCv.getContext('2d'); if(it.src.readyState>=2) tc.drawImage(it.src,0,0,it.tinyCv.width,it.tinyCv.height); return it.tinyCv; }
  return it.tiny;
}
function dibujarItem(g,sc,u,span,W,H){
  const it=sc.item, p=clamp(u/span,0,1), mov=S.cfg.movimiento, r=rng(it.id*131+5);
  if(it.tipo==='video'&&it.src.readyState<2){ g.fillStyle='#111'; g.fillRect(0,0,W,H); return; }
  const ar=it.w/it.h, car=W/H, dif=Math.abs(Math.log(ar/car));
  g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
  if(dif>.2){
    const t=fuenteItem(it), k=Math.max(W/t.width,H/t.height)*1.15;
    g.drawImage(t,(W-t.width*k)/2,(H-t.height*k)/2,t.width*k,t.height*k);
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,0,W,H);
    const z=mov?1+.05*p:1, kk=Math.min(W*.94/it.w,H*.94/it.h)*z, w=it.w*kk, h=it.h*kk, rr=Math.min(W,H)*.02;
    g.save(); g.shadowColor='rgba(0,0,0,.45)'; g.shadowBlur=Math.min(W,H)*.04; rrect(g,(W-w)/2,(H-h)/2,w,h,rr); g.fillStyle='#000'; g.fill(); g.restore();
    g.save(); rrect(g,(W-w)/2,(H-h)/2,w,h,rr); g.clip(); g.drawImage(it.src,(W-w)/2,(H-h)/2,w,h); g.restore();
  } else {
    const k=Math.max(W/it.w,H/it.h); let z=1.02,dx=0,dy=0;
    if(mov){ const m=Math.floor(r()*5), e=ease(p);
      if(m===0) z=1.04+.14*e; else if(m===1) z=1.18-.14*e; else { z=1.14; const a=(e-.5)*.09; if(m===2) dx=a; else if(m===3) dx=-a; else dy=a; } }
    const w=it.w*k*z, h=it.h*k*z; g.drawImage(it.src,(W-w)/2+dx*W,(H-h)/2+dy*H,w,h);
  }
}

/* --- FINAL --- */
function dibujarFin(g,u,W,H,tl){
  if(tl.finVideo){
    const v=S.logoVid, el=v.el;
    g.fillStyle='#f7f7f9'; g.fillRect(0,0,W,H);
    if(el.readyState>=2){
      const k=Math.min(W/v.w,H/v.h)*(W/H>v.w/v.h?1:1), w=v.w*k, h=v.h*k;
      if(Math.abs(W/H-v.w/v.h)>.05){
        // fondo continuo para formatos vertical y cuadrado
        const gr=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.2,W/2,H/2,Math.max(W,H)*.7); gr.addColorStop(0,'#ffffff'); gr.addColorStop(1,'#e9ebf3');
        g.fillStyle=gr; g.fillRect(0,0,W,H);
        const kk=Math.min(W*1.08/v.w,H/v.h), ww=v.w*kk, hh=v.h*kk;
        g.save(); g.globalCompositeOperation='multiply'; g.drawImage(el,(W-ww)/2,(H-hh)/2,ww,hh); g.restore();
      } else g.drawImage(el,(W-w)/2,(H-h)/2,w,h);
    }
    return;
  }
  const P=PALETAS[S.cfg.paleta]||PALETAS[0], m=Math.min(W,H), r=rng(7);
  const gr=g.createRadialGradient(W/2,H/2,m*.1,W/2,H/2,Math.max(W,H)*.75); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.6,'#fbfbff'); gr.addColorStop(1,P.a+'33');
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  const cols=[P.a,P.b,P.c];
  for(let i=0;i<46;i++){
    const ang=r()*Math.PI*2, vel=.25+r()*.6, fr=(u*vel*.22+r()*.5)%1, d=m*(.18+fr*.75), sz=m*(.006+r()*.012), a=clamp(1-fr,0,1)*clamp(u/.5,0,1);
    g.globalAlpha=a*.85; g.fillStyle=cols[i%3];
    const x=W/2+Math.cos(ang+u*.15)*d*(W>H?1.4:1), y=H/2+Math.sin(ang+u*.15)*d*(H>W?1.3:1);
    g.save(); g.translate(x,y); g.rotate(u*2+i); g.fillRect(-sz,-sz,sz*2,sz*2); g.restore();
  }
  g.globalAlpha=1;
  const txt=(S.cfg.fin||'').trim(), vert=H>W;
  if(S.logo){
    const q=clamp((u-.35)/.9,0,1), e=easeBack(q), L=m*(vert?.95:.92)*(.6+.4*e);
    const lw=L*Math.min(1,S.logo.width/S.logo.height), lh=L*Math.min(1,S.logo.height/S.logo.width);
    const cy=txt?(vert?H*.52:H*.6):H/2, bob=Math.sin(u*1.6)*m*.006;
    g.save(); g.globalAlpha=clamp(q*1.6,0,1); g.globalCompositeOperation='multiply'; g.drawImage(S.logo,W/2-lw/2,cy-lh/2+bob,lw,lh); g.restore();
  }
  if(txt){
    const q=easeOut(clamp((u-.1)/.6,0,1)), fs=fitFont(g,txt,W*.86,Math.round(m*(vert?.075:.085)));
    g.globalAlpha=q; g.fillStyle=P.a; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,W/2,H*(vert?.22:.15)-(1-q)*fs*.5); g.globalAlpha=1;
  }
}

/* --- capa: nombre, logo pequeño y ondas --- */
function dibujarOndas(g,t,tl,W,H,P){
  const m=Math.min(W,H), est=S.cfg.ondaEstilo; if(est==='no') return;
  g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=m*.015;
  if(est==='barras'){
    const nb=36, ancho=W*(W>H?.42:.7), bw=ancho/nb*.55, gap=ancho/nb-bw, x0=(W-ancho)/2, yb=H-m*.07, maxH=m*.09;
    for(let i=0;i<nb;i++){ const d=Math.abs(i-(nb-1)/2)/(nb/2), lv=nivel(t-d*.25,tl);
      const h=Math.max(bw,maxH*lv*(1-d*.55)*(.75+.25*Math.sin(t*9+i*1.3))); g.fillStyle=i%2?'rgba(255,255,255,.95)':P.c; rrect(g,x0+i*(bw+gap),yb-h/2,bw,h,bw/2); g.fill(); }
  } else if(est==='linea'){
    const ancho=W*(W>H?.5:.8), x0=(W-ancho)/2, yb=H-m*.075, amp=m*.06, n=80;
    for(const [col,ph,a] of [[P.c,0,.9],['#ffffff',1.7,1]]){
      g.beginPath();
      for(let i=0;i<=n;i++){ const f=i/n, env=Math.sin(Math.PI*f), lv=nivel(t-(1-f)*.6,tl); g.lineTo(x0+f*ancho, yb+Math.sin(f*24+t*7+ph)*amp*lv*env); }
      g.strokeStyle=col; g.globalAlpha=a; g.lineWidth=m*.008; g.lineCap='round'; g.lineJoin='round'; g.stroke();
    }
    g.globalAlpha=1;
  } else if(est==='circulo'){
    const R=m*.065, cx=W-R*2.1, cy=H-R*2.1, nb=40;
    for(let i=0;i<nb;i++){ const a=i/nb*Math.PI*2, lv=nivel(t-(i%10)*.03,tl), L=R*.25+R*.75*lv*(.7+.3*Math.sin(t*8+i));
      g.strokeStyle=i%2?'#fff':P.c; g.lineWidth=m*.007; g.lineCap='round'; g.beginPath(); g.moveTo(cx+Math.cos(a)*R*1.05,cy+Math.sin(a)*R*1.05); g.lineTo(cx+Math.cos(a)*(R*1.05+L),cy+Math.sin(a)*(R*1.05+L)); g.stroke(); }
    g.fillStyle='#fff'; g.beginPath(); g.arc(cx,cy,R,0,7); g.fill(); g.shadowBlur=0;
    g.font=`${Math.round(R*1.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('🎙️',cx,cy+R*.05);
  } else if(est==='puntos'){
    const nb=9, gap=m*.045, x0=W/2-(nb-1)*gap/2, yb=H-m*.075;
    for(let i=0;i<nb;i++){ const lv=nivel(t-Math.abs(i-4)*.07,tl), rr=m*(.009+.022*lv*(1-Math.abs(i-4)/7)); g.fillStyle=i%2?'#fff':P.c; g.beginPath(); g.arc(x0+i*gap,yb,rr,0,7); g.fill(); }
  }
  g.shadowBlur=0;
}
function dibujarCapa(g,t,tl,W,H){
  if(!S.items.length||t<tl.I-.2||t>tl.finAudio) return;
  const a=clamp(Math.min((t-tl.I)/.8,(tl.finAudio-t)/.6),0,1); if(a<=0) return;
  const P=PALETAS[S.cfg.paleta]||PALETAS[0], m=Math.min(W,H);
  g.save(); g.globalAlpha=a;
  if(S.cfg.nombre&&!S.enClip&&(S.cfg.titulo||'').trim()){
    const fs=Math.round(m*.034); g.font=`800 ${fs}px ${FB}`;
    const txt='🎙️ '+S.cfg.titulo.trim(), w=Math.min(g.measureText(txt).width+fs*1.3,W*.7), h=fs*1.7, x=m*.035, y=m*.035;
    const gr=g.createLinearGradient(x,0,x+w,0); gr.addColorStop(0,P.a); gr.addColorStop(1,P.b);
    g.shadowColor='rgba(0,0,0,.3)'; g.shadowBlur=m*.02; g.fillStyle=gr; rrect(g,x,y,w,h,h/2); g.fill(); g.shadowBlur=0;
    g.save(); rrect(g,x,y,w,h,h/2); g.clip(); g.fillStyle='#fff'; g.textBaseline='middle'; g.textAlign='left'; g.fillText(txt,x+fs*.65,y+h/2+fs*.05); g.restore();
  }
  if(S.cfg.marca&&S.logo){
    const lh=m*.11, lw=lh*S.logo.width/S.logo.height, x=W-lw-m*.045, y=m*.035;
    g.globalAlpha=a*.92; g.fillStyle='#fff'; rrect(g,x-m*.008,y-m*.008,lw+m*.016,lh+m*.016,m*.02); g.fill(); g.drawImage(S.logo,x,y,lw,lh); g.globalAlpha=a;
  }
  dibujarOndas(g,t,tl,W,H,P);
  g.restore();
}

/* --- transiciones --- */
function pixelar(src,W,H,bloque){ const P=buf.P, w=Math.max(1,Math.round(W/bloque)), h=Math.max(1,Math.round(H/bloque)); P.width=w; P.height=h; const pg=P.getContext('2d'); pg.imageSmoothingEnabled=true; pg.drawImage(src,0,0,w,h); return P; }
function transicion(g,A,B,p,tipo,W,H){
  const e=ease(p), m=Math.min(W,H); g.save();
  switch(tipo){
    case 'fundido':{ const z=1+.08*e; g.drawImage(A,W*(1-z)/2,H*(1-z)/2,W*z,H*z); g.globalAlpha=e; const z2=1.08-.08*e; g.drawImage(B,W*(1-z2)/2,H*(1-z2)/2,W*z2,H*z2); break; }
    case 'deslizar':{ g.drawImage(A,-e*W*.35,0,W,H); g.fillStyle=`rgba(0,0,0,${e*.4})`; g.fillRect(0,0,W,H); g.shadowColor='rgba(0,0,0,.5)'; g.shadowBlur=m*.05; g.drawImage(B,W*(1-e),0,W,H); break; }
    case 'iris':{ g.drawImage(A,0,0); const R=Math.hypot(W,H)/2*e; g.beginPath(); g.arc(W/2,H/2,R,0,7); g.save(); g.clip(); g.drawImage(B,0,0); g.restore();
      g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=m*.012*(1-e); g.beginPath(); g.arc(W/2,H/2,R,0,7); g.stroke(); break; }
    case 'persiana':{ g.drawImage(A,0,0); const n=9, sw=W/n; g.beginPath(); for(let i=0;i<n;i++){ const q=ease(clamp((p-i*.045)/(1-.045*(n-1)),0,1)); g.rect(i*sw,0,sw*q+1,H); } g.clip(); g.drawImage(B,0,0); break; }
    case 'barrido':{ g.drawImage(A,0,0); const L=W+H, d=-H+e*(L+H); g.beginPath(); g.moveTo(d-H*.2,0); g.lineTo(-H,0); g.lineTo(-H,H); g.lineTo(d-H*.8,H); g.closePath();
      g.save(); g.clip(); g.drawImage(B,0,0); g.restore(); g.strokeStyle=`rgba(255,255,255,${.9*Math.sin(p*Math.PI)})`; g.lineWidth=m*.025; g.beginPath(); g.moveTo(d-H*.2,0); g.lineTo(d-H*.8,H); g.stroke(); break; }
    case 'mosaico':{ const q=1-Math.abs(2*p-1), bloque=1+q*m*.09; g.imageSmoothingEnabled=false; g.drawImage(pixelar(p<.5?A:B,W,H,bloque),0,0,W,H); break; }
    case 'giro':{ g.fillStyle='#111'; g.fillRect(0,0,W,H); g.save(); g.globalAlpha=1-e; g.translate(W/2,H/2); g.rotate(e*.35); g.scale(1-.45*e,1-.45*e); g.drawImage(A,-W/2,-H/2); g.restore();
      g.globalAlpha=e; g.translate(W/2,H/2); g.rotate(-(1-e)*.35); const s=1.45-.45*e; g.scale(s,s); g.drawImage(B,-W/2,-H/2); break; }
    case 'destello':{ const z=1+.06*(1-Math.abs(2*p-1)); g.drawImage(p<.5?A:B,W*(1-z)/2,H*(1-z)/2,W*z,H*z); g.fillStyle=`rgba(255,255,255,${Math.pow(1-Math.abs(2*p-1),1.5)})`; g.fillRect(0,0,W,H); break; }
    default: g.drawImage(B,0,0);
  }
  g.restore();
}

/* --- escena en un instante --- */
function escenasVisibles(tl,t){
  const sc=tl.scenes; let k=sc.findIndex(s=>t>=s.t0&&t<s.t1); if(k<0) k=sc.length-1;
  const out=[{s:sc[k],u:t-(k?sc[k].t0-tl.tr:0),span:(sc[k].t1-sc[k].t0)+(k?tl.tr:0)}];
  if(k+1<sc.length&&t>sc[k].t1-tl.tr){ const n=sc[k+1]; out.push({s:n,u:t-(n.t0-tl.tr),span:(n.t1-n.t0)+tl.tr,p:(t-(sc[k].t1-tl.tr))/tl.tr,trans:sc[k].trans}); }
  return out;
}
// vídeos visibles en un instante: [{el, t}]
function videosVisibles(tl,t){
  const out=[];
  for(const v of escenasVisibles(tl,t)){
    if(v.s.tipo==='item'&&v.s.item.tipo==='video'){ const d=Math.min(v.s.item.dur,VIDEO_MAX); out.push({el:v.s.item.src,t:clamp(v.u,0,1e9)%d}); }
    else if(v.s.tipo==='fin'&&tl.finVideo){ out.push({el:S.logoVid.el,t:clamp(v.u-tl.tr,0,S.logoVid.dur-.05)}); }
  }
  return out;
}
function pintarEscena(g,v,W,H,tl){
  g.save();
  if(v.s.tipo==='intro') dibujarIntro(g,v.u,W,H);
  else if(v.s.tipo==='fin') dibujarFin(g,v.u,W,H,tl);
  else dibujarItem(g,v.s,v.u,v.span,W,H);
  g.restore();
}
function dibujarFrame(g,t,W,H,tl){
  const vs=escenasVisibles(tl,t);
  if(vs.length===1) pintarEscena(g,vs[0],W,H,tl);
  else{
    for(const c of [buf.A,buf.B]) if(c.width!==W||c.height!==H){ c.width=W; c.height=H; }
    pintarEscena(buf.A.getContext('2d'),vs[0],W,H,tl); pintarEscena(buf.B.getContext('2d'),vs[1],W,H,tl);
    transicion(g,buf.A,buf.B,clamp(vs[1].p,0,1),vs[1].trans,W,H);
  }
  dibujarCapa(g,t,tl,W,H);
}

/* ===================== VISTA PREVIA ===================== */
const cv=$('#cv'), g0=cv.getContext('2d');
let TLcache=null;
function TL(){ return TLcache||(TLcache=lineaTiempo()); }
function tamPreview(){ const [w,h]=dims(S.cfg.formato,'720'), k=S.cfg.formato==='h'?1:.75; cv.width=Math.round(w*k); cv.height=Math.round(h*k); $('#pantalla').style.aspectRatio=`${w}/${h}`; }
function todosVideos(){ const l=S.items.filter(i=>i.tipo==='video').map(i=>i.src); if(S.logoVid) l.push(S.logoVid.el); return l; }
function sincronizarVideos(t,reproduciendo){
  const vis=new Map(videosVisibles(TL(),t).map(v=>[v.el,v.t]));
  for(const el of todosVideos()){
    if(!vis.has(el)){ if(!el.paused) el.pause(); continue; }
    const target=vis.get(el);
    if(reproduciendo){ if(el.paused){ el.currentTime=target; el.play().catch(()=>{}); } else if(Math.abs(el.currentTime-target)>.3) el.currentTime=target; }
    else{ if(!el.paused) el.pause(); if(Math.abs(el.currentTime-target)>.04){ el.currentTime=target; el.addEventListener('seeked',()=>{ if(!S.play.on) dibujarPreview(); },{once:true}); } }
  }
}
function dibujarPreview(){
  const tl=TL(); S.play.t=clamp(S.play.t,0,tl.total);
  if(!S.play.on) sincronizarVideos(S.play.t,false);
  dibujarFrame(g0,S.play.t,cv.width,cv.height,tl);
  $('#tiempo').textContent=`${fmt(S.play.t)} / ${fmt(tl.total)}`;
  dibujarCabezal();
}
async function reproducir(){
  if(S.play.on) return pararPreview();
  const tl=TL(); if(S.play.t>=tl.total-.05) S.play.t=0;
  const c=actx(); c.resume();
  $('#btnPlay').disabled=true;
  let mez=null; try{ mez=S.audio?await obtenerMezcla():null; }catch(e){ console.error(e); }
  $('#btnPlay').disabled=false;
  S.play.on=true; $('#btnPlay').textContent='⏸';
  if(mez&&S.play.t<mez.duration){ const src=c.createBufferSource(); src.buffer=mez; src.connect(c.destination); src.start(0,S.play.t); S.play.src=src; }
  S.play.startCtx=c.currentTime; S.play.startT=S.play.t;
  const loop=()=>{
    if(!S.play.on) return;
    S.play.t=S.play.startT+(actx().currentTime-S.play.startCtx);
    if(S.play.t>=tl.total){ S.play.t=tl.total; pararPreview(); dibujarPreview(); return; }
    sincronizarVideos(S.play.t,true); dibujarPreview(); S.play.raf=requestAnimationFrame(loop);
  };
  loop();
}
function pararPreview(){
  S.play.on=false; cancelAnimationFrame(S.play.raf); $('#btnPlay').textContent='▶';
  if(S.play.src){ try{S.play.src.stop();}catch(e){} S.play.src=null; }
  todosVideos().forEach(v=>v.pause());
}
function irA(t){ const on=S.play.on; if(on) pararPreview(); S.play.t=clamp(t,0,TL().total); dibujarPreview(); if(on) reproducir(); }
$('#btnPlay').onclick=reproducir;

/* --- línea de tiempo visual --- */
const lc=$('#lineaT'), lg=lc.getContext('2d');
let lineaBase=null;
function dibujarLinea(){
  const dpr=window.devicePixelRatio||1, W=Math.round(lc.clientWidth*dpr), H=Math.round(84*dpr);
  if(!W) return; lc.width=W; lc.height=H;
  const tl=TL(), P=PALETAS[S.cfg.paleta]||PALETAS[0], X=t=>t/tl.total*W, c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d'), top=20*dpr, alto=H-top-6*dpr;
  g.fillStyle='#e9ecfb'; rrect(g,0,top,W,alto,8*dpr); g.fill();
  for(const s of tl.scenes){
    const x0=X(s.t0), x1=X(s.t1), w=Math.max(1,x1-x0-1*dpr);
    g.save(); rrect(g,x0,top,w,alto,6*dpr); g.clip();
    if(s.tipo==='intro'){ const gr=g.createLinearGradient(x0,0,x1,0); gr.addColorStop(0,P.a); gr.addColorStop(1,P.b); g.fillStyle=gr; g.fillRect(x0,top,w,alto); }
    else if(s.tipo==='fin'){ g.fillStyle='#fff'; g.fillRect(x0,top,w,alto); if(S.logo){ const h=alto*.9, lw=h; g.drawImage(S.logo,x0+(w-lw)/2,top+alto*.05,lw,h); } }
    else{ const th=s.item.thumb, k=Math.max(w/th.width,alto/th.height); g.globalAlpha=.85; g.drawImage(th,x0+(w-th.width*k)/2,top+(alto-th.height*k)/2,th.width*k,th.height*k); g.globalAlpha=1; }
    g.restore();
  }
  if(S.voz){
    g.fillStyle='rgba(255,255,255,.85)'; const lv=S.voz.levels, mid=top+alto/2;
    for(let x=0;x<W;x+=2*dpr){ const t=x/W*tl.total-tl.P0; const i=Math.floor(t*S.voz.lvRate); if(i<0||i>=lv.length) continue; const h=Math.max(1,lv[i]*alto*.42); g.fillRect(x,mid-h,1.4*dpr,h*2); }
  }
  g.font=`${14*dpr}px sans-serif`; g.textAlign='center'; g.textBaseline='middle';
  for(const e of S.efectos){ const x=X(e.t); g.fillStyle=P.c; g.fillRect(x-1*dpr,top,2*dpr,alto); g.fillText(e.em,x,9*dpr); }
  lineaBase=c; dibujarCabezal();
}
function dibujarCabezal(){
  if(!lineaBase) return; const W=lc.width, H=lc.height, dpr=window.devicePixelRatio||1, x=S.play.t/TL().total*W;
  lg.clearRect(0,0,W,H); lg.drawImage(lineaBase,0,0);
  lg.fillStyle='#e8344e'; lg.fillRect(x-1.5*dpr,14*dpr,3*dpr,H-14*dpr); lg.beginPath(); lg.arc(x,14*dpr,5*dpr,0,7); lg.fill();
}
function buscarEn(e){ const r=lc.getBoundingClientRect(); irA(clamp((e.clientX-r.left)/r.width,0,1)*TL().total); }
lc.addEventListener('pointerdown',e=>{ if(!S.audio&&!S.items.length) return; lc.setPointerCapture(e.pointerId); buscarEn(e); lc.onpointermove=ev=>buscarEn(ev); });
lc.addEventListener('pointerup',()=>lc.onpointermove=null);
window.addEventListener('resize',()=>dibujarLinea());

/* ---------- refresco general ---------- */
function actualizar(){
  TLcache=null; const tl=TL(), hay=S.audio||S.items.length;
  $('#btnPlay').disabled=!hay;
  const listo=!!(S.audio&&S.items.length);
  $('#btnCrear').disabled=$('#btnClip').disabled=!listo; $('#btnMp3').disabled=!S.audio;
  let txt='Añade el audio y las fotos o vídeos para empezar.';
  if(S.audio&&!S.items.length) txt='Ahora añade fotos o vídeos.';
  else if(!S.audio&&S.items.length) txt='Falta el audio del podcast.';
  else if(hay){
    const fotos=tl.scenes.filter(s=>s.tipo==='item'&&s.item.tipo==='foto'), media=fotos.length?fotos.reduce((a,s)=>a+s.t1-s.t0,0)/fotos.length:0;
    txt=`Vídeo de ${fmt(tl.total)}`+(fotos.length?` · cada foto unos ${Math.round(media)} s`:'')+(S.efectos.length?` · ${S.efectos.length} efecto${S.efectos.length>1?'s':''}`:'');
    if(media>25) txt+=' · 💡 con más fotos tendrá más movimiento';
  }
  $('#resumen').textContent=txt;
  document.querySelectorAll('.solo-imagen').forEach(e=>e.classList.toggle('oculto',S.cfg.finTipo==='video'&&!!S.logoVid));
  dibujarLinea();
  if(!S.play.on) dibujarPreview();
}

/* ===================== EXPORTAR ===================== */
let cancelar=false;
async function configCodecs(W,H,ch,sr){
  if(!('VideoEncoder' in window)||!('AudioEncoder' in window)||!window.Mp4Muxer) return null;
  const br=W*H>1e6?6e6:3e6; let vcfg=null;
  for(const codec of ['avc1.640028','avc1.4d0028','avc1.42e028','avc1.64001f','avc1.42001f']){
    const c={codec,width:W,height:H,bitrate:br,framerate:FPS};
    try{ if((await VideoEncoder.isConfigSupported(c)).supported){ vcfg=c; break; } }catch(e){}
  }
  if(!vcfg) return null;
  const aac={codec:'mp4a.40.2',sampleRate:sr,numberOfChannels:ch,bitrate:160000};
  try{ if((await AudioEncoder.isConfigSupported(aac)).supported) return {vcfg,acfg:aac,audio:'aac'}; }catch(e){}
  const opus={codec:'opus',sampleRate:48000,numberOfChannels:ch,bitrate:160000};
  try{ if((await AudioEncoder.isConfigSupported(opus)).supported) return {vcfg,acfg:opus,audio:'opus'}; }catch(e){}
  return null;
}
async function remuestrear(ab,sr,ch){
  if(ab.sampleRate===sr&&ab.numberOfChannels===ch) return ab;
  const oc=new OfflineAudioContext(ch,Math.ceil(ab.duration*sr),sr), so=oc.createBufferSource(); so.buffer=ab; so.connect(oc.destination); so.start(); return oc.startRendering();
}
async function prepararVideosExport(lista){
  for(const {el,t} of lista){
    if(Math.abs(el.currentTime-t)>.001||el.readyState<2){
      el.currentTime=t; await new Promise(ok=>{ const to=setTimeout(ok,1500); el.addEventListener('seeked',()=>{ clearTimeout(to); ok(); },{once:true}); });
    }
  }
}
// render(g,t) dibuja el instante t del resultado; videos(t) dice qué vídeos colocar
async function exportarMP4(cfgs,W,H,dur,render,videos,audio,prog){
  const {Muxer,ArrayBufferTarget}=Mp4Muxer, target=new ArrayBufferTarget();
  const ch=cfgs.acfg.numberOfChannels, sr=cfgs.acfg.sampleRate;
  const ab=await remuestrear(audio,sr,ch);
  const muxer=new Muxer({target,video:{codec:'avc',width:W,height:H,frameRate:FPS},audio:{codec:cfgs.audio,numberOfChannels:ch,sampleRate:sr},fastStart:false,firstTimestampBehavior:'offset'});
  let fallo=null;
  const venc=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>fallo=e});
  const aenc=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m),error:e=>fallo=e});
  venc.configure(cfgs.vcfg); aenc.configure(cfgs.acfg);
  const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d',{alpha:false});
  const N=Math.ceil(dur*FPS), totalS=Math.ceil(dur*sr), datos=[...Array(ch).keys()].map(i=>ab.getChannelData(Math.min(i,ab.numberOfChannels-1)));
  let pos=0; const BLK=4096, t0=performance.now();
  for(let i=0;i<N;i++){
    if(cancelar) throw new Error('cancelado'); if(fallo) throw fallo;
    const t=i/FPS;
    await prepararVideosExport(videos(t)); render(g,t);
    const fr=new VideoFrame(c,{timestamp:Math.round(i*1e6/FPS),duration:Math.round(1e6/FPS)}); venc.encode(fr,{keyFrame:i%(FPS*2)===0}); fr.close();
    const hasta=Math.min(totalS,Math.ceil((t+1/FPS)*sr));
    while(pos<hasta){
      const n=Math.min(BLK,totalS-pos), d=new Float32Array(n*ch);
      for(let k=0;k<ch;k++){ const src=datos[k]; if(pos<src.length) d.set(src.subarray(pos,Math.min(src.length,pos+n)),k*n); }
      const ad=new AudioData({format:'f32-planar',sampleRate:sr,numberOfFrames:n,numberOfChannels:ch,timestamp:Math.round(pos/sr*1e6),data:d}); aenc.encode(ad); ad.close(); pos+=n;
    }
    while(venc.encodeQueueSize>8) await new Promise(r=>setTimeout(r,2));
    if(i%15===0){ const tr=(performance.now()-t0)/1000; prog(i/N,i?tr/i*(N-i):0); await pausa(); }
  }
  await venc.flush(); await aenc.flush(); muxer.finalize();
  return new Blob([target.buffer],{type:'video/mp4'});
}
async function exportarTiempoReal(W,H,dur,render,sync,audio,prog){
  const tipos=['video/mp4;codecs="avc1.42E01E,mp4a.40.2"','video/mp4','video/webm;codecs="vp9,opus"','video/webm'];
  const mime=tipos.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t));
  if(!mime) throw new Error('Este navegador no puede crear vídeos. Usa Chrome o Edge.');
  const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d',{alpha:false});
  const ac=actx(); await ac.resume(); const dest=ac.createMediaStreamDestination(), src=ac.createBufferSource(); src.buffer=audio; src.connect(dest);
  const st=c.captureStream(FPS); dest.stream.getAudioTracks().forEach(tr=>st.addTrack(tr));
  const rec=new MediaRecorder(st,{mimeType:mime,videoBitsPerSecond:W*H>1e6?6e6:3e6}), partes=[];
  rec.ondataavailable=e=>{ if(e.data.size) partes.push(e.data); }; const fin=new Promise(ok=>rec.onstop=ok);
  render(g,0); rec.start(1000); const t0=ac.currentTime; src.start();
  await new Promise((ok,ko)=>{
    const iv=setInterval(()=>{
      if(cancelar){ clearInterval(iv); ko(new Error('cancelado')); return; }
      const t=ac.currentTime-t0; if(t>=dur){ clearInterval(iv); ok(); return; }
      sync(t); render(g,t); prog(t/dur,dur-t);
    },1000/FPS);
  }).finally(()=>{ try{src.stop();}catch(e){} todosVideos().forEach(v=>v.pause()); if(rec.state!=='inactive') rec.stop(); });
  await fin; return new Blob(partes,{type:mime.split(';')[0]});
}
function nombreArchivo(extra,ext){ return ((S.cfg.titulo||'podcast').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'podcast')+extra+'.'+ext; }
function modalProgreso(titulo){
  modal(`<h3>${titulo}</h3><p id="eTxt">Preparando…</p><div class="barra"><i id="eBar"></i></div><p id="eResta"></p><div class="botones"><button class="btn sec" id="eCancel">Cancelar</button></div>`);
  $('#eCancel').onclick=()=>{ cancelar=true; };
  return (p,resta)=>{ $('#eBar').style.width=(p*100).toFixed(1)+'%'; $('#eTxt').textContent=`${Math.floor(p*100)} %`; $('#eResta').textContent=resta>1?`Quedan unos ${fmt(resta)}`:''; };
}
function modalListo(blob,nombre,dur,titulo='🎉 ¡Vídeo listo!'){
  const url=URL.createObjectURL(blob), ext=nombre.split('.').pop().toUpperCase(), esAudio=blob.type.startsWith('audio');
  modal(`<h3>${titulo}</h3><p>${fmt(dur)} · ${(blob.size/1048576).toFixed(1)} MB · ${ext}</p>
    ${esAudio?`<audio src="${url}" controls style="width:100%"></audio>`:`<video src="${url}" controls playsinline></video>`}
    <div class="botones"><a class="btn" href="${url}" download="${nombre}">⬇ Descargar</a><button class="btn sec" id="eCerrar">Cerrar</button></div>`);
  $('#eCerrar').onclick=cerrarModal;
}
function modalError(e){
  console.error(e);
  if(e.message==='cancelado'){ cerrarModal(); toast('Cancelado'); return; }
  modal(`<h3>😕 No se ha podido crear</h3><p>${escapar(e.message||String(e))}</p><p>Prueba con calidad Normal o con Chrome/Edge actualizados.</p><div class="botones"><button class="btn" id="eCerrar">Cerrar</button></div>`);
  $('#eCerrar').onclick=cerrarModal;
}
async function generarVideo(W,H,dur,render,videos,audio,prog){
  const cfgs=await configCodecs(W,H,audio.numberOfChannels>1?2:1,audio.sampleRate);
  if(cfgs) return exportarMP4(cfgs,W,H,dur,render,videos,audio,prog);
  $('#eTxt').textContent='Este navegador graba en tiempo real: tarda lo mismo que dura el vídeo. No cambies de pestaña.';
  return exportarTiempoReal(W,H,dur,render,t=>{ const vis=videos(t); for(const el of todosVideos()){ const v=vis.find(x=>x.el===el); if(!v){ el.pause(); continue; } if(el.paused){ el.currentTime=v.t; el.play().catch(()=>{}); } else if(Math.abs(el.currentTime-v.t)>.3) el.currentTime=v.t; } },audio,prog);
}
async function crearVideo(){
  pararPreview(); cancelar=false; await document.fonts.ready;
  const [W,H]=dims(S.cfg.formato,S.cfg.calidad), tl=lineaTiempo(); TLcache=tl;
  const prog=modalProgreso('🎬 Creando tu vídeo…');
  try{
    $('#eTxt').textContent='Preparando el sonido…'; const audio=await obtenerMezcla();
    const blob=await generarVideo(W,H,tl.total,(g,t)=>dibujarFrame(g,t,W,H,tl),t=>videosVisibles(tl,t),audio,prog);
    modalListo(blob,nombreArchivo('',blob.type.includes('mp4')?'mp4':'webm'),tl.total);
  }catch(e){ modalError(e); }
  todosVideos().forEach(v=>v.pause()); dibujarPreview();
}

/* --- clip para redes --- */
function abrirClip(){
  pararPreview(); const tl=TL(), ini=+clamp(S.play.t,tl.P0,Math.max(tl.P0,tl.finAudio-30)).toFixed(0);
  modal(`<h3>📱 Clip para redes</h3><p>Un trozo del episodio en vídeo vertical, con el título arriba${tl.finVideo?' y el logo al final':''}. Ideal para estados de WhatsApp, Instagram o el Tablón.</p>
    <div class="campos">
      <label class="campo">Empieza en (segundo)<input type="number" id="cIni" min="0" step="1" value="${ini}"></label>
      <label class="campo">Duración<select id="cDur"><option value="30">30 segundos</option><option value="45">45 segundos</option><option value="60" selected>1 minuto</option></select></label>
      <label class="campo ancho checks"><label><input type="checkbox" id="cLogo" ${tl.finVideo?'checked':'disabled'}> Terminar con el vídeo del logo</label></label>
    </div><p class="consejo">💡 Antes, pon la vista previa en el momento más divertido del episodio: el clip empezará ahí.</p>
    <div class="botones"><button class="btn" id="cCrear">Crear clip</button><button class="btn sec" id="cCerrar">Cancelar</button></div>`);
  $('#cCerrar').onclick=cerrarModal;
  $('#cCrear').onclick=()=>crearClip(+$('#cIni').value||0,+$('#cDur').value,$('#cLogo').checked);
}
async function crearClip(ini,durClip,conLogo){
  cancelar=false; await document.fonts.ready;
  const tl=lineaTiempo(); TLcache=tl;
  ini=clamp(ini,0,Math.max(0,tl.finAudio-5)); const fin=Math.min(tl.finAudio,ini+durClip), d1=fin-ini;
  const dOut=conLogo&&tl.finVideo?S.logoVid.dur:0, dur=d1+dOut;
  const [W,H]=dims('v',S.cfg.calidad), P=PALETAS[S.cfg.paleta]||PALETAS[0];
  const prog=modalProgreso('📱 Creando el clip…');
  try{
    const mez=await obtenerMezcla(), sr=mez.sampleRate, ch=mez.numberOfChannels;
    const out=new AudioBuffer({length:Math.ceil(dur*sr),numberOfChannels:ch,sampleRate:sr});
    for(let c=0;c<ch;c++){
      const src=mez.getChannelData(c), dst=out.getChannelData(c), a=Math.floor(ini*sr), n=Math.floor(d1*sr), fi=sr*.4, fo=sr*1.2;
      for(let i=0;i<n&&a+i<src.length;i++){ let k=1; if(i<fi) k=i/fi; if(n-i<fo) k=Math.min(k,(n-i)/fo); dst[i]=src[a+i]*k; }
      if(dOut){ const b=Math.floor(tl.finAudio*sr), off=n; for(let i=0;i<Math.floor(dOut*sr)&&b+i<src.length;i++) dst[off+i]=src[b+i]; }
    }
    const real=t=>t<d1?ini+t:tl.finAudio+tl.tr+(t-d1);
    const render=(g,t)=>{
      dibujarFrame(g,real(t),W,H,tl);
      if(t<d1){
        const m=W, a=clamp(Math.min(t/.6,(d1-t)/.5),0,1), fs=Math.round(m*.06);
        g.save(); g.globalAlpha=a;
        const gr=g.createLinearGradient(0,0,W,0); gr.addColorStop(0,P.a); gr.addColorStop(1,P.b); g.fillStyle=gr;
        rrect(g,m*.05,H*.095,W-m*.1,fs*2.6,fs*.6); g.fill();
        g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'🎙️ '+(S.cfg.titulo||'Mi podcast'),W*.82,fs); g.fillText('🎙️ '+(S.cfg.titulo||'Mi podcast'),W/2,H*.095+fs*1.3);
        if(t>d1-4){ const q=easeOut(clamp((t-(d1-4))/.6,0,1)), ss=fitFont(g,'🎧 Escucha el episodio completo',W*.84,Math.round(m*.05),'800',FB);
          g.globalAlpha=a*q; g.fillStyle='#fff'; rrect(g,m*.08,H*.78,W-m*.16,ss*2.2,ss*1.1); g.fill(); g.fillStyle=P.a; g.fillText('🎧 Escucha el episodio completo',W/2,H*.78+ss*1.1); }
        g.restore();
      }
    };
    const videos=t=>videosVisibles(tl,real(t));
    S.enClip=true; let blob; try{ blob=await generarVideo(W,H,dur,render,videos,out,prog); } finally{ S.enClip=false; }
    modalListo(blob,nombreArchivo('-clip',blob.type.includes('mp4')?'mp4':'webm'),dur,'📱 ¡Clip listo!');
  }catch(e){ modalError(e); }
  todosVideos().forEach(v=>v.pause()); dibujarPreview();
}

/* --- solo audio MP3 --- */
async function crearMp3(){
  pararPreview(); cancelar=false;
  const prog=modalProgreso('🎧 Creando el MP3…');
  try{
    $('#eTxt').textContent='Preparando el sonido…';
    const mez=await obtenerMezcla(), ch=mez.numberOfChannels, sr=mez.sampleRate;
    const enc=new lamejs.Mp3Encoder(ch,sr,160), L=mez.getChannelData(0), R=ch>1?mez.getChannelData(1):null, partes=[], blk=1152*20;
    const conv=(src,a,n)=>{ const o=new Int16Array(n); for(let i=0;i<n;i++){ const v=clamp(src[a+i],-1,1); o[i]=v<0?v*32768:v*32767; } return o; };
    const t0=performance.now();
    for(let i=0;i<L.length;i+=blk){
      if(cancelar) throw new Error('cancelado');
      const n=Math.min(blk,L.length-i), b=R?enc.encodeBuffer(conv(L,i,n),conv(R,i,n)):enc.encodeBuffer(conv(L,i,n)); if(b.length) partes.push(new Uint8Array(b));
      if((i/blk)%10===0){ const p=i/L.length, tr=(performance.now()-t0)/1000; prog(p,p?tr/p*(1-p):0); await pausa(); }
    }
    const f=enc.flush(); if(f.length) partes.push(new Uint8Array(f));
    modalListo(new Blob(partes,{type:'audio/mpeg'}),nombreArchivo('','mp3'),mez.duration,'🎧 ¡Audio listo!');
  }catch(e){ modalError(e); }
}
$('#btnCrear').onclick=crearVideo; $('#btnClip').onclick=abrirClip; $('#btnMp3').onclick=crearMp3;

/* ===================== PLANTILLAS ===================== */
function plantillasUsuario(){ try{ return JSON.parse(localStorage.getItem('podcastvideo_plantillas')||'{}'); }catch(e){ return {}; } }
function pintarPlantillas(){
  const us=plantillasUsuario();
  $('#selPlantilla').innerHTML='<option value="">📁 Plantillas…</option><optgroup label="Del cole">'+Object.keys(PLANTILLAS_BASE).map(n=>`<option value="b:${escapar(n)}">${escapar(n)}</option>`).join('')+'</optgroup>'
    +(Object.keys(us).length?'<optgroup label="Mis plantillas">'+Object.keys(us).map(n=>`<option value="u:${escapar(n)}">${escapar(n)}</option>`).join('')+'<option value="borrar">🗑 Borrar una plantilla…</option></optgroup>':'');
}
$('#selPlantilla').onchange=e=>{
  const v=e.target.value; e.target.value=''; if(!v) return;
  if(v==='borrar'){ const us=plantillasUsuario(), n=prompt('¿Qué plantilla borro?\n'+Object.keys(us).join('\n')); if(n&&us[n]){ delete us[n]; localStorage.setItem('podcastvideo_plantillas',JSON.stringify(us)); pintarPlantillas(); toast('Plantilla borrada'); } return; }
  const datos=v.startsWith('b:')?PLANTILLAS_BASE[v.slice(2)]:plantillasUsuario()[v.slice(2)]; if(!datos) return;
  Object.assign(S.cfg,datos); guardarCfg(); volcarCfg(); toast('Plantilla aplicada: '+v.slice(2)); actualizar();
};
$('#btnGuardarPlantilla').onclick=()=>{
  const n=prompt('Nombre de la plantilla (guarda textos, colores, sintonía y estilo):',S.cfg.titulo||''); if(!n) return;
  const us=plantillasUsuario(), d={}; CLAVES_PLANTILLA.forEach(k=>d[k]=S.cfg[k]); us[n]=d;
  try{ localStorage.setItem('podcastvideo_plantillas',JSON.stringify(us)); pintarPlantillas(); toast('Plantilla guardada'); }catch(e){ toast('No se ha podido guardar'); }
};

/* ===================== CONTROLES ===================== */
function zonaSoltar(zona,input,fn){
  input.onchange=()=>{ fn(input.files); input.value=''; };
  ['dragenter','dragover'].forEach(ev=>zona.addEventListener(ev,e=>{ e.preventDefault(); zona.classList.add('encima'); }));
  ['dragleave','drop'].forEach(ev=>zona.addEventListener(ev,()=>zona.classList.remove('encima')));
  zona.addEventListener('drop',e=>{ e.preventDefault(); if(e.dataTransfer.files.length) fn(e.dataTransfer.files); });
}
zonaSoltar($('#zonaAudio'),$('#inAudio'),fs=>cargarAudio(fs[0]));
zonaSoltar($('#zonaFotos'),$('#inFotos'),fs=>cargarMedios(fs));
$('#fotos').addEventListener('dragover',e=>e.preventDefault());

const CAMPOS=[['#tTitulo','titulo'],['#tSub','sub'],['#tIntroDur','introDur','num'],['#tFin','fin'],['#tFinDur','finDur','num'],['#oSintonia','sintonia'],['#oFinTipo','finTipo'],
  ['#oTrans','trans'],['#oFormato','formato'],['#oCalidad','calidad'],['#oOndaEstilo','ondaEstilo'],['#oNombre','nombre','check'],['#oMarca','marca','check'],
  ['#oMovimiento','movimiento','check'],['#oMejorar','mejorar','check'],['#oFondo','fondo','check'],['#oFondoVol','fondoVol','num']];
function volcarCfg(){
  CAMPOS.forEach(([id,k,t])=>{ const el=$(id); if(t==='check') el.checked=!!S.cfg[k]; else el.value=S.cfg[k]; });
  $('#vIntro').textContent=S.cfg.introDur; $('#vFin').textContent=S.cfg.finDur; pintarPaletas(); tamPreview(); notaSintonia();
}
function notaSintonia(){ $('#notaSintonia').textContent=S.cfg.sintonia==='propia'?(S.musica.sintonia?'Tu música: '+fmt(S.musica.sintonia.duration):'Elige un archivo de música'):S.cfg.sintonia==='ninguna'?'':'Creada por la app, sin derechos de autor'; }
CAMPOS.forEach(([id,k,t])=>{
  const el=$(id);
  el.addEventListener(t==='check'||el.tagName==='SELECT'?'change':'input',()=>{
    S.cfg[k]=t==='check'?el.checked:t==='num'?+el.value:el.value; guardarCfg();
    if(k==='introDur') $('#vIntro').textContent=el.value;
    if(k==='finDur') $('#vFin').textContent=el.value;
    if(k==='formato') tamPreview();
    if(k==='sintonia'){ notaSintonia(); if(el.value==='propia'&&!S.musica.sintonia){ $('#inMusica').dataset.para='sintonia'; $('#inMusica').click(); } }
    if(k==='mejorar') prepararVoz().then(actualizar);
    if(['titulo','sub','introDur','paleta'].includes(k)&&!S.play.on) S.play.t=Math.min(S.play.t,Math.max(2,S.cfg.introDur-1.5));
    actualizar();
  });
});
$('#oFondoTipo').onchange=e=>{ if(e.target.value==='propia'&&!S.musica.fondo){ $('#inMusica').dataset.para='fondo'; $('#inMusica').click(); } S.cfg.fondo=$('#oFondo').checked=true; guardarCfg(); actualizar(); };
$('#inMusica').onchange=async e=>{ const f=e.target.files[0], para=e.target.dataset.para; e.target.value=''; if(!f) return;
  try{ S.musica[para]=await decodificar(f); toast('Música cargada: '+f.name); notaSintonia(); actualizar(); }catch(err){ toast('No se ha podido leer esa música'); } };
$('#inSfx').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return;
  try{ anadirEfecto('propio',await decodificar(f),f.name.replace(/\.[^.]+$/,'')); }catch(err){ toast('No se ha podido leer ese sonido'); } };
$('#btnOirSintonia').onclick=async()=>{ const b=$('#btnOirSintonia'); b.textContent='…'; try{ const s=await sonidoSintonia(); if(s) oirBuffer(s); else toast('Sin sintonía'); }catch(e){} b.textContent='▶'; };
function pintarPaletas(){
  const box=$('#paletas'); box.innerHTML='';
  PALETAS.forEach((p,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='paleta'+(i===S.cfg.paleta?' sel':'');
    b.style.background=`linear-gradient(135deg,${p.a},${p.b} 70%,${p.c})`; b.title='Colores '+(i+1);
    b.onclick=()=>{ S.cfg.paleta=i; guardarCfg(); pintarPaletas(); actualizar(); }; box.appendChild(b); });
}
$('#btnLogo').onclick=()=>$('#inLogo').click();
$('#inLogo').onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ S.logo=await createImageBitmap(f); $('#logoMini').src=URL.createObjectURL(f); actualizar(); }catch(err){ toast('No se ha podido abrir esa imagen'); } };
document.addEventListener('keydown',e=>{ if(e.code==='Space'&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)&&(S.audio||S.items.length)){ e.preventDefault(); reproducir(); } });

/* ---------- aviso de novedades (una vez por dispositivo) ---------- */
function aviso(){
  try{ if(localStorage.getItem('podcastvideo_aviso')===AVISO_ID) return; localStorage.setItem('podcastvideo_aviso',AVISO_ID); }catch(e){ return; }
  modal(`<h3>✨ Novedad</h3><p>${AVISO_TXT}</p><div class="botones"><button class="btn" id="avOk">¡Genial!</button></div>`); $('#avOk').onclick=cerrarModal;
}

async function iniciar(){
  cargarCfg(); volcarCfg(); pintarPlantillas(); pintarEfectos();
  try{ const im=new Image(); im.src='LOGO.jpg'; await im.decode(); S.logo=im; }catch(e){}
  try{ await Promise.all([document.fonts.load(`800 60px "Baloo 2"`),document.fonts.load('700 40px Nunito')]); }catch(e){}
  S.play.t=3; actualizar();
  await cargarLogoVideo(); actualizar();
  aviso();
}
iniciar();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});

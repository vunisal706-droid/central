/* ===== Capitulín en el vídeo =====
   Mismo personaje que «¡Muévete con Capitulín!», pero dibujado en vivo con movimientos suaves:
   brazos y piernas flexibles, respira, parpadea, habla, se estira y se encoge al saltar.
   Aparece en los momentos en que la voz del podcast sube (risas, emoción) y reacciona a ella. */

const CAPI_DUR=4.8;
const CAPI_COL={piel:'#FFD4A3',pelo:'#4B2E1F',camiseta:'#ef4444',estrella:'#facc15',brazo:'#facc15',pantalon:'#2563eb',zapato:'#7c2d12',corona:'#fbbf24',coronaB:'#d97706',ojo:'#1f2937',boca:'#7f1d1d',mejilla:'rgba(251,113,133,.45)'};
async function cargarCapitulin(){}   // ya no necesita imágenes

/* ---------- dibujo en vivo (coordenadas del dibujo original: caja -30 -45 180 215) ---------- */
function extremidad(g,x0,y0,ang,largo,curva,grosor,col){
  const a=ang*Math.PI/180, dx=-Math.sin(a)*largo, dy=Math.cos(a)*largo, x1=x0+dx, y1=y0+dy;
  const nx=-dy/largo, ny=dx/largo, mx=(x0+x1)/2+nx*curva*largo*.35, my=(y0+y1)/2+ny*curva*largo*.35;
  g.strokeStyle=col; g.lineWidth=grosor; g.lineCap='round'; g.beginPath(); g.moveTo(x0,y0); g.quadraticCurveTo(mx,my,x1,y1); g.stroke();
  return [x1,y1];
}
function capiDibujar(g,p){
  const C=CAPI_COL;
  // sombra
  g.fillStyle='rgba(15,23,42,.14)'; g.beginPath(); g.ellipse(60,164,32*(1-(p.alto||0)*.4),5,0,0,7); g.fill();
  g.save(); g.translate(0,p.dy||0);
  // estirar y encoger desde los pies
  g.translate(60,160); g.scale(p.sx||1,p.sy||1); g.translate(-60,-160);
  // piernas
  const pierna=(cx,ang,levanta,curva)=>{ const L=levanta?20:34; const [fx,fy]=extremidad(g,cx,122,ang,L,curva,13,C.pantalon);
    g.fillStyle=C.zapato; g.beginPath(); g.ellipse(fx+(cx<60?-1:1),fy+2,10,6,0,0,7); g.fill(); };
  pierna(51.5,p.ll||0,p.llift,p.cl||0); pierna(68.5,p.rl||0,p.rlift,p.cr||0);
  g.save(); g.translate(60,125); g.rotate((p.tilt||0)*Math.PI/180); g.translate(-60,-125);
  // cuerpo (respira)
  const resp=p.resp||0;
  g.fillStyle=C.camiseta; g.beginPath(); g.roundRect(36-resp,82-resp*1.5,48+resp*2,46+resp*1.5,16); g.fill();
  g.fillStyle=C.estrella; g.beginPath();
  [[60,94],[62.6,99.6],[68.6,100.2],[64,104.2],[65.4,110],[60,107],[54.6,110],[56,104.2],[51.4,100.2],[57.4,99.6]].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.fill();
  // brazos de goma
  const brazo=(cx,ang,curva)=>{ const L=33+Math.max(0,Math.abs(ang)-90)/90*20; const [hx,hy]=extremidad(g,cx,90,ang,L,curva,13,C.brazo); g.fillStyle=C.piel; g.beginPath(); g.arc(hx,hy,7.5,0,7); g.fill(); return [hx,hy]; };
  const manoI=brazo(33.5,p.la||0,p.ca||0), manoD=brazo(86.5,p.ra||0,p.cra||0);
  // cabeza (se inclina y asiente)
  g.save(); g.translate(60,84); g.rotate((p.hTilt||0)*Math.PI/180); g.translate(0,p.hDy||0); g.translate(-60,-84);
  g.fillStyle=C.piel; g.beginPath(); g.arc(30,58,6,0,7); g.arc(90,58,6,0,7); g.fill(); g.beginPath(); g.arc(60,56,30,0,7); g.fill();
  g.fillStyle=C.pelo; for(const [x,y,r] of [[37,38,11],[48,30,12],[60,27,12],[72,30,12],[83,38,11],[32,49,7],[88,49,7]]){ g.beginPath(); g.arc(x,y,r,0,7); g.fill(); }
  g.save(); g.translate(60,22); g.rotate((p.corona||0)*Math.PI/180); g.translate(-60,-22);
  g.fillStyle=C.corona; g.strokeStyle=C.coronaB; g.lineWidth=2; g.lineJoin='round'; g.beginPath(); [[42,22],[45,5],[53,14],[60,1],[67,14],[75,5],[78,22]].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#ef4444'; g.beginPath(); g.arc(60,16,3,0,7); g.fill(); g.restore();
  // ojos (parpadean y miran)
  const mx=p.mira||0, cierra=clamp(p.blink||0,0,1), ojo=(x)=>{ g.fillStyle=C.ojo; g.beginPath(); g.ellipse(x+mx,58,4.2*(p.ojoG||1),Math.max(.6,5.4*(1-cierra)*(p.ojoG||1)),0,0,7); g.fill();
    if(cierra<.5){ g.fillStyle='#fff'; g.beginPath(); g.arc(x+1.5+mx,56,1.6,0,7); g.fill(); } };
  ojo(49); ojo(71);
  if(p.ceja){ g.strokeStyle=C.pelo; g.lineWidth=2.4; g.lineCap='round'; g.beginPath(); g.moveTo(44,47-p.ceja); g.lineTo(53,46-p.ceja*1.3); g.moveTo(67,46-p.ceja*1.3); g.lineTo(76,47-p.ceja); g.stroke(); }
  g.fillStyle=C.mejilla; g.beginPath(); g.arc(41,68,4.5,0,7); g.arc(79,68,4.5,0,7); g.fill();
  // boca: sonríe, habla o se sorprende
  const o=clamp(p.o||0,0,1);
  if(o>.08){ g.fillStyle=C.boca; g.beginPath(); g.ellipse(60,72+o,4+o*3,1.5+o*4.5,0,0,7); g.fill(); g.fillStyle='#fb7185'; g.beginPath(); g.ellipse(60,74+o*3,2.5+o*1.5,1+o*1.5,0,0,Math.PI); g.fill(); }
  else { g.strokeStyle=C.boca; g.lineWidth=3; g.lineCap='round'; g.beginPath(); g.moveTo(51,70); g.quadraticCurveTo(60,79+(p.sonrisa||0)*3,69,70); g.stroke(); }
  g.restore(); // cabeza
  g.restore(); // inclinación del cuerpo
  g.restore();
  return {manoI,manoD};
}

/* ---------- acciones: cada una devuelve la postura según el tiempo u ---------- */
const S_=(u,f,a=1,ph=0)=>Math.sin(u*Math.PI*2*f+ph)*a;
const pulsoSalto=(u,per)=>{ const k=(u%per)/per; return k<.18?{fase:'agacha',q:k/.18}:k<.75?{fase:'aire',q:(k-.18)/.57}:{fase:'cae',q:(k-.75)/.25}; };
function saltoP(u,per,alto){ const s=pulsoSalto(u,per); if(s.fase==='agacha') return {dy:0,sy:1-.14*Math.sin(s.q*Math.PI/2),sx:1+.08*Math.sin(s.q*Math.PI/2),air:0};
  if(s.fase==='aire') return {dy:-Math.sin(s.q*Math.PI)*alto,sy:1+.08*Math.sin(s.q*Math.PI),sx:1-.05*Math.sin(s.q*Math.PI),air:1};
  return {dy:0,sy:1-.12*Math.sin(s.q*Math.PI),sx:1+.08*Math.sin(s.q*Math.PI),air:0}; }
const CAPI_ACC={
  saluda:{frases:['¡Hola!','¡Hola, hola!','¡Estoy aquí!'],pose:(u,lv)=>({la:12+S_(u,.5,4),ra:-150+S_(u,2.2,24),cra:.5,ca:-.2,hTilt:-8+S_(u,1.1,4),tilt:-3,sonrisa:1})},
  baila:{frases:['¡A bailar!','¡Qué ritmo!'],notas:true,pose:(u,lv)=>{ const b=S_(u,1.2), r=Math.abs(S_(u,2.4));
    return {la:90+b*55,ra:-90+b*55,ca:.6*b,cra:.6*b,tilt:b*10,hTilt:-b*12,dy:-r*8,ll:b*10,rl:b*10,cl:.3,cr:-.3,sy:1-r*.04,sonrisa:1}; }},
  escucha:{frases:['¡Escucha esto!','¡Qué bien!','¡Hala!'],pose:(u,lv)=>({la:10,ra:-140,cra:.9,hTilt:-14+S_(u,1.6,3)-lv*10,hDy:lv*2,tilt:-5,mira:-1.5,ojoG:1+lv*.15,ceja:lv*3,o:lv>.7?.6:0})},
  salta:{frases:['¡Qué interesante!','¡Toma ya!','¡Hala!'],pose:(u,lv)=>{ const s=saltoP(u,1.15,26); return {la:s.air?150:40,ra:s.air?-150:-40,ca:.3,cra:-.3,dy:s.dy,sx:s.sx,sy:s.sy,ll:s.air?10:0,rl:s.air?-10:0,llift:s.air,rlift:s.air,o:s.air?.8:0,ojoG:s.air?1.15:1,alto:s.air?-s.dy/26:0}; }},
  aplaude:{frases:['¡Bravo!','¡Muy bien!'],prop:'👏',pose:(u,lv)=>{ const c=Math.abs(S_(u,3)); return {la:150+c*16,ra:-150-c*16,ca:.15,cra:-.15,dy:-Math.abs(S_(u,1.5))*6,hTilt:S_(u,.8,6),sonrisa:1,o:c>.8?.35:0}; }},
  duerme:{frases:['¡Uy, me dormí!'],pose:(u,lv)=>{ if(u<2.4) return {la:-20,ra:20,ca:.4,cra:-.4,hTilt:16+S_(u,.4,3),tilt:4,blink:1,resp:1.5+S_(u,.45,1.5),hDy:S_(u,.45,1.5)};
    const v=u-2.4, s=saltoP(v,1.1,30); return {la:155,ra:-155,dy:v<.5?-Math.sin(v/.5*Math.PI)*34:s.dy*.6,sy:s.sy,sx:s.sx,o:v<1?1:.5,ojoG:1.25,ceja:4,llift:v<.5,rlift:v<.5}; },zzz:true},
  vuela:{pose:(u,lv)=>({la:20+S_(u,1.5,8),ra:-172,cra:.1,ll:20+S_(u,2,8),rl:30+S_(u,2,8,1),cl:.4,cr:.4,o:.3,sonrisa:1,corona:S_(u,1,8)}),vuela:true},
  robot:{frases:['Bip, bip, bop','¡Modo robot!'],pose:(u,lv)=>{ const k=Math.floor(u*2.6)%4, P=[[90,-170],[170,-90],[90,-90],[0,-170]][k], q=clamp((u*2.6%1)/.25,0,1);
    return {la:P[0]*q+(1-q)*[0,90,170,90][k],ra:P[1]*q+(1-q)*[-90,-170,-90,-90][k],hTilt:[8,-8,0,4][k]*q,dy:-q*3,o:.2,ojoG:.9}; }},
  fiesta:{frases:['¡Yupi!','¡Fiesta!'],prop:'🎉',confeti:true,pose:(u,lv)=>{ const s=saltoP(u,.95,30); return {la:150+S_(u,2,12),ra:-150+S_(u,2,12,1),ca:.3,cra:-.3,dy:s.dy,sx:s.sx,sy:s.sy,o:.9,llift:s.air,rlift:s.air,ll:s.air?14:0,rl:s.air?-14:0,ojoG:1.1}; }},
  sigue:{frases:['¡No te vayas!','¡Ahora viene lo mejor!','¡Sigue viendo!'],pose:(u,lv)=>({la:20,ra:-100+S_(u,1.8,20),cra:-.2,hTilt:S_(u,1.6,7),tilt:-4,mira:-1.5,sonrisa:1,o:0})},
  escondite:{frases:['¡Cucú!','¿Me ves?'],asoma:true,pose:(u,lv)=>({la:150,ra:-60,ca:-.5,hTilt:-18,mira:-2,blink:(u%1.4)<.12?1:0,sonrisa:1})}
};
const CAPI_FUERTE=['fiesta','salta','aplaude'], CAPI_MEDIO=['baila','escucha','robot','salta'], CAPI_CALMA=['saluda','sigue','escondite','vuela'];

/* ---------- cuándo aparece: en los momentos en que la voz sube ---------- */
function apariciones(tl){
  if(!S.cfg.capitulin||!S.items.length) return [];
  const base={poco:70,normal:40,mucho:22}[S.cfg.capiFrec]||40, r=rng(Math.round(tl.finAudio*10)+S.items.length*7);
  const ini=tl.I+3, fin=tl.finAudio-CAPI_DUR-2; if(fin<=ini) return [];
  // energía de la voz cada medio segundo
  const ener=[]; for(let t=ini;t<fin;t+=.5){ let s=0; for(let k=0;k<5;k++) s+=nivel(t+k*.1,tl); ener.push([t,s/5]); }
  const ord=ener.map(e=>e[1]).sort((a,b)=>a-b), p60=ord[Math.floor(ord.length*.6)]||0, p90=ord[Math.floor(ord.length*.9)]||1;
  const picos=ener.filter((e,i)=>e[1]>=p60&&ener.slice(Math.max(0,i-6),i+7).every(o=>o[1]<=e[1])).sort((a,b)=>b[1]-a[1]);
  const elegidos=[];
  for(const [t,v] of picos){ if(elegidos.every(e=>Math.abs(e.t-t)>base*.7)) elegidos.push({t,v}); }
  // rellena huecos largos con apariciones tranquilas
  elegidos.sort((a,b)=>a.t-b.t);
  const todos=[]; let prev=ini-base*.5;
  for(const e of [...elegidos,{t:fin+base,v:-1}]){ while(e.t-prev>base*1.7){ prev+=base*(.8+r()*.4); if(prev<fin) todos.push({t:prev,v:0}); } if(e.v>=0) todos.push(e); prev=e.t; }
  let ant='';
  return todos.filter(e=>e.t>=ini&&e.t<=fin).map((e,i)=>{
    const lista=e.v===0?CAPI_CALMA:e.v>=p90?CAPI_FUERTE:CAPI_MEDIO; let id; do{ id=lista[Math.floor(r()*lista.length)]; }while(id===ant&&lista.length>1); ant=id;
    const a=CAPI_ACC[id]; return {t0:Math.max(ini,e.t-.9),id,acc:a,lado:i%2?1:-1,frase:a.frases?a.frases[Math.floor(r()*a.frases.length)]:'',seed:Math.floor(r()*1e6)};
  });
}

/* ---------- dibujar la aparición en el instante t ---------- */
function bocadillo(g,x,y,txt,s,haciaIzq){
  g.save(); g.font=`800 ${Math.round(s)}px ${FB}`; const w=g.measureText(txt).width+s*1.2, h=s*1.7, bx=x-w/2, by=y-h;
  g.shadowColor='rgba(0,0,0,.25)'; g.shadowBlur=s*.5; g.fillStyle='#fff'; rrect(g,bx,by,w,h,h/2); g.fill();
  g.beginPath(); const tx=x+(haciaIzq?-w*.18:w*.18); g.moveTo(tx-s*.35,by+h-2); g.lineTo(tx+(haciaIzq?s*.2:-s*.2),by+h+s*.55); g.lineTo(tx+s*.35,by+h-2); g.fill();
  g.shadowBlur=0; g.fillStyle='#1c2070'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,x,by+h/2+s*.05); g.restore();
}
const EMO='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function dibujarCapitulin(g,t,tl,W,H){
  const ap=tl.capi; if(!ap||!ap.length) return;
  const A=ap.find(a=>t>=a.t0&&t<a.t0+CAPI_DUR); if(!A) return;
  const u=t-A.t0, ac=A.acc, m=Math.min(W,H), esc=m*.5/215, r=rng(A.seed), der=A.lado>0, lv=clamp(nivel(t,tl),0,1);
  // entrada con rebote y salida con anticipación
  const ent=clamp(u/.6,0,1), sal=clamp((u-(CAPI_DUR-.55))/.55,0,1);
  let p=ac.pose(u,lv);
  // vida extra: respira, parpadea y se mueve con la voz
  p=Object.assign({resp:S_(u,.6,1.2),hDy:0},p);
  if(p.blink===undefined){ const bk=(u+(A.seed%100)/40)%2.6; p.blink=bk<.13?Math.sin(bk/.13*Math.PI):0; }
  if(!ac.vuela&&!ac.asoma&&A.id!=='duerme'&&A.id!=='robot'){ p.hDy=(p.hDy||0)+lv*2.5; p.hTilt=(p.hTilt||0)+S_(u,.9,2); }
  // al hablar abre y cierra la boca
  const fIni=ac.zzz?2.75:.65, habla=A.frase&&u>fIni+.05&&u<fIni+.95; if(habla&&!(p.o>.5)) p.o=.35+.35*Math.abs(S_(u,4.5));
  // entrada: sube desde abajo estirándose; salida: se encoge y baja
  let ox=0, oy=0, rot=0, sx=p.sx||1, sy=p.sy||1;
  if(!ac.vuela&&!ac.asoma){
    if(ent<1){ const e=easeBack(ent); oy=(1-e)*1.1; sy*=1+(1-ent)*.25*Math.sin(ent*Math.PI); sx*=1-(1-ent)*.12*Math.sin(ent*Math.PI); }
    if(sal>0){ if(sal<.35){ const q=sal/.35; sy*=1-.15*q; sx*=1+.1*q; } else { const q=(sal-.35)/.65; oy=ease(q)*1.15; } }
  }
  p.sx=sx; p.sy=sy;
  const ancho=180*esc, alto=215*esc;
  let x,y;
  if(ac.vuela){
    const q=ease(clamp(u/CAPI_DUR,0,1)), sx0=der?-ancho:W, ex=der?W:-ancho;
    x=lerp(sx0,ex,q); y=lerp(H*.55,H*.05,q)-Math.sin(q*Math.PI)*H*.1; rot=(der?1:-1)*(.5+S_(u,1.3,.08));
    g.save(); g.globalAlpha=.7; g.strokeStyle='rgba(255,255,255,.85)'; g.lineCap='round';
    for(let k=1;k<6;k++){ g.lineWidth=m*.008; const lx=x+ancho/2-(der?1:-1)*(k*m*.045+m*.04), ly=y+alto*(.35+k*.07); g.beginPath(); g.moveTo(lx,ly); g.lineTo(lx-(der?1:-1)*m*.07,ly); g.stroke(); }
    g.restore();
  } else if(ac.asoma){
    const q1=Math.min(easeOut(clamp(u/.6,0,1)),1-ease(clamp((u-2.5)/.35,0,1))), q2=u>3?Math.min(easeOut(clamp((u-3)/.35,0,1)),1-ease(clamp((u-4.1)/.4,0,1)))*.7:0, q=Math.max(q1,q2);
    y=H*.32; rot=der?-.32:.32; x=der?W-ancho*.62*q:-ancho+ancho*.62*q;
  } else {
    x=der?W-ancho*.92:-ancho*.08; y=H-alto*.98+oy*alto;
  }
  g.save(); g.translate(x+ancho/2,y+alto/2); g.rotate(rot); if(!der&&!ac.asoma) g.scale(-1,1);
  g.scale(esc,esc); g.translate(-60,-62.5);
  g.shadowColor='rgba(0,0,0,.25)'; g.shadowBlur=8;
  const manos=capiDibujar(g,p);
  g.shadowBlur=0;
  if(ac.prop&&u>.5&&u<CAPI_DUR-.6){ g.save(); if(!der&&!ac.asoma) g.scale(-1,1); g.font=`36px ${EMO}`; g.textAlign='center'; const mx=(manos.manoI[0]+manos.manoD[0])/2*(!der&&!ac.asoma?-1:1); g.fillText(ac.prop,mx,Math.min(manos.manoI[1],manos.manoD[1])-12+S_(u,2,3)); g.restore(); }
  g.restore();
  // zzz
  if(ac.zzz&&u<2.4){ g.save(); g.font=`800 ${Math.round(m*.05)}px ${FB}`; g.fillStyle='#fff'; g.strokeStyle='#1c2070'; g.lineWidth=m*.006;
    for(let k=0;k<3;k++){ const q=((u*.5+k/3)%1); g.globalAlpha=Math.sin(q*Math.PI); const zx=x+ancho*(der?.25:.75)+(der?-1:1)*q*ancho*.3, zy=y+alto*.15-q*alto*.45; g.strokeText('z',zx,zy); g.fillText('z',zx,zy); } g.restore(); }
  // notas
  if(ac.notas){ g.save(); g.font=`${Math.round(m*.06)}px ${EMO}`; g.textAlign='center';
    for(let k=0;k<5;k++){ const q=((u*.55+k/5)%1); g.globalAlpha=Math.sin(q*Math.PI)*(1-sal); g.fillText(k%2?'🎵':'🎶',x+ancho*(.15+.7*((k*37)%10)/10)+S_(q,1,m*.03,k),y+alto*.25-q*alto*.6); } g.restore(); }
  // confeti
  if(ac.confeti&&u>.4){ const cols=['#ffc93c','#3a55c4','#ef4444','#22c55e','#ffffff'];
    for(let k=0;k<70;k++){ const ang=-Math.PI/2+(r()-.5)*2.4, v=(.4+r())*m*.9, dt=u-.4, cx=x+ancho/2+Math.cos(ang)*v*dt, cy=y+alto*.2+Math.sin(ang)*v*dt+m*.9*dt*dt;
      g.save(); g.translate(cx,cy); g.rotate(dt*8+k); g.globalAlpha=clamp(1-dt/2.5,0,1); g.fillStyle=cols[k%5]; g.fillRect(-m*.009,-m*.006,m*.018,m*.012); g.restore(); } }
  // bocadillo
  if(A.frase&&u>fIni&&u<CAPI_DUR-.75){ const q=easeBack(clamp((u-fIni)/.35,0,1)), s=m*.042*q;
    if(s>2){ const bx=ac.asoma?(der?W-ancho*.7:ancho*.7):x+ancho/2, by=ac.asoma?y+alto*.05:y+alto*.05; bocadillo(g,clamp(bx,m*.18,W-m*.18),by,A.frase,s,!der); } }
}

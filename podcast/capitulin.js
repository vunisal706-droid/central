/* ===== Capitulín en el vídeo: aparece de vez en cuando haciendo cosas graciosas ===== */
/* Dibujo tomado de «¡Muévete con Capitulín!» (mismo personaje y posturas) */
const CAPI_PO={stand:{},up:{la:155,ra:-155},star:{la:130,ra:-130,ll:16,rl:-16},squat:{la:80,ra:-80,sq:1},
 run1:{la:35,ra:-10,llift:1},run2:{la:10,ra:-35,rlift:1},kneeL:{la:40,ra:-40,llift:1},kneeR:{la:40,ra:-40,rlift:1},
 jump:{la:150,ra:-150,dy:-24,ll:6,rl:-6,o:1},flamingo:{la:90,ra:-90,rlift:1},punchL:{la:100,ra:-25},punchR:{la:25,ra:-100},cross:{la:90,ra:-90},
 sideL:{la:30,ra:-165,tilt:-16},sideR:{la:165,ra:-30,tilt:16},plane1:{la:95,ra:-95,tilt:10,rlift:1},plane2:{la:95,ra:-95,tilt:-10,llift:1},
 skL:{la:60,ra:-20,dy:-8,rlift:1,tilt:-8},skR:{la:20,ra:-60,dy:-8,llift:1,tilt:8},hips:{la:28,ra:-28},hero:{la:10,ra:-170},tree:{la:165,ra:-165,rlift:1},
 hug:{la:-55,ra:55},clap:{la:168,ra:-168,prop:'👏'},head:{la:125,ra:-125},dance1:{la:135,ra:-40,ll:8,tilt:-6},dance2:{la:40,ra:-135,rl:-8,tilt:6},
 turn:{la:30,ra:-30,prop:'🔄'},wave:{la:10,ra:-150,prop:'👋'},robot:{la:90,ra:-170},kneeUp:{la:150,ra:-150,rlift:1},cheer:{la:150,ra:-150,o:1,prop:'🎉'},
 shake1:{la:60,ra:-60,tilt:-4},shake2:{la:40,ra:-40,tilt:4},breathIn:{la:155,ra:-155,o:1},sleep:{la:-20,ra:20,prop:'💤'}};
function capiSVG(name){const p=typeof name==='string'?(CAPI_PO[name]||{}):name;const la=p.la||0,ra=p.ra||0,ll=p.ll||0,rl=p.rl||0,dy=(p.dy||0)+(p.sq?14:0),tilt=p.tilt||0;
 const lh=p.sq?18:(p.llift?14:32),rh=p.sq?18:(p.rlift?14:32);
 const leg=(x,h,rot,cx,sx)=>`<g transform="rotate(${rot} ${cx} 124)"><rect x="${x}" y="122" width="13" height="${h}" rx="6" fill="#2563eb"/><ellipse cx="${sx}" cy="${122+h+1}" rx="10" ry="6" fill="#7c2d12"/></g>`;
 const arm=(x,rot,cx)=>{const l=33+Math.max(0,Math.abs(rot)-90)/90*32;return `<g transform="rotate(${rot} ${cx} 90)"><rect x="${x}" y="86" width="13" height="${l}" rx="6.5" fill="#facc15"/><circle cx="${cx}" cy="${87+l}" r="7" fill="#FFD4A3"/></g>`;};
 return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="430" viewBox="-30 -45 180 215"><ellipse cx="60" cy="164" rx="32" ry="5" fill="rgba(15,23,42,.12)"/>
 <g transform="translate(0 ${dy})">${leg(45,lh,ll,51.5,50)}${leg(62,rh,rl,68.5,70)}<g transform="rotate(${tilt} 60 125)">
 <rect x="36" y="82" width="48" height="46" rx="16" fill="#ef4444"/><path d="M60 94 L62.6 99.6 L68.6 100.2 L64 104.2 L65.4 110 L60 107 L54.6 110 L56 104.2 L51.4 100.2 L57.4 99.6Z" fill="#facc15"/>
 <circle cx="30" cy="58" r="6" fill="#FFD4A3"/><circle cx="90" cy="58" r="6" fill="#FFD4A3"/><circle cx="60" cy="56" r="30" fill="#FFD4A3"/>
 <g fill="#4B2E1F"><circle cx="37" cy="38" r="11"/><circle cx="48" cy="30" r="12"/><circle cx="60" cy="27" r="12"/><circle cx="72" cy="30" r="12"/><circle cx="83" cy="38" r="11"/><circle cx="32" cy="49" r="7"/><circle cx="88" cy="49" r="7"/></g>
 <path d="M42 22 L45 5 L53 14 L60 1 L67 14 L75 5 L78 22Z" fill="#fbbf24" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="16" r="3" fill="#ef4444"/>
 <ellipse cx="49" cy="58" rx="4.2" ry="5.4" fill="#1f2937"/><ellipse cx="71" cy="58" rx="4.2" ry="5.4" fill="#1f2937"/><circle cx="50.5" cy="56" r="1.6" fill="#fff"/><circle cx="72.5" cy="56" r="1.6" fill="#fff"/>
 <circle cx="41" cy="68" r="4.5" fill="#fb7185" opacity=".45"/><circle cx="79" cy="68" r="4.5" fill="#fb7185" opacity=".45"/>
 ${p.o?'<ellipse cx="60" cy="73" rx="6" ry="5" fill="#7f1d1d"/>':'<path d="M51 70 Q60 79 69 70" stroke="#7f1d1d" stroke-width="3" fill="none" stroke-linecap="round"/>'}
 ${arm(27,la,33.5)}${arm(80,ra,86.5)}</g></g></svg>`;}

const CAPI_IMG={};
async function cargarCapitulin(){
  await Promise.all(Object.keys(CAPI_PO).map(async k=>{ try{ const im=new Image(); im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(capiSVG(k)); await im.decode(); CAPI_IMG[k]=im; }catch(e){} }));
}
const CAPI_ACC=[
  {id:'saluda',  f:['wave','stand'], ms:450, frase:['¡Hola!','¡Hola, hola!','¡Estoy aquí!']},
  {id:'baila',   f:['dance1','dance2'], ms:380, notas:true, frase:['¡A bailar!','¡Qué ritmo!']},
  {id:'escondite', f:['stand','head'], ms:700, asoma:true, frase:['¡Cucú!','¿Me ves?']},
  {id:'salta',   f:['jump','stand'], ms:420, frase:['¡Qué interesante!','¡Hala!','¡Toma ya!']},
  {id:'aplaude', f:['clap','up'], ms:300, prop:'👏', frase:['¡Bravo!','¡Muy bien!']},
  {id:'duerme',  f:['sleep'], ms:9999, prop:'💤', despierta:true, frase:['¡Uy, me dormí!']},
  {id:'vuela',   f:['hero'], ms:9999, vuela:true},
  {id:'robot',   f:['robot','punchR'], ms:330, frase:['Bip, bip, bop','¡Modo robot!']},
  {id:'fiesta',  f:['cheer','jump'], ms:450, prop:'🎉', confeti:true, frase:['¡Yupi!','¡Fiesta!']},
  {id:'sigue',   f:['hero','wave'], ms:700, frase:['¡No te vayas!','¡Ahora viene lo mejor!','¡Sigue viendo!']}
];
const CAPI_DUR=4.6;
function apariciones(tl){
  if(!S.cfg.capitulin||!S.items.length) return [];
  const base={poco:70,normal:40,mucho:22}[S.cfg.capiFrec]||40, r=rng(Math.round(tl.finAudio*10)+S.items.length*7), out=[];
  let t=tl.I+3+r()*6, prev=-1, lado=r()<.5?1:-1;
  while(t<tl.finAudio-CAPI_DUR-2){
    let k; do{ k=Math.floor(r()*CAPI_ACC.length); }while(k===prev); prev=k;
    const a=CAPI_ACC[k]; lado=-lado;
    out.push({t0:t,acc:a,lado,frase:a.frase?a.frase[Math.floor(r()*a.frase.length)]:'',seed:Math.floor(r()*1e6)});
    t+=CAPI_DUR+base*(.7+r()*.6);
  }
  return out;
}
function bocadillo(g,x,y,txt,s,haciaIzq){
  g.save(); g.font=`800 ${Math.round(s)}px ${FB}`; const w=g.measureText(txt).width+s*1.2, h=s*1.7, bx=x-w/2, by=y-h;
  g.shadowColor='rgba(0,0,0,.25)'; g.shadowBlur=s*.5; g.fillStyle='#fff'; rrect(g,bx,by,w,h,h/2); g.fill();
  g.beginPath(); const tx=x+(haciaIzq?-w*.18:w*.18); g.moveTo(tx-s*.35,by+h-2); g.lineTo(tx+(haciaIzq?s*.2:-s*.2),by+h+s*.55); g.lineTo(tx+s*.35,by+h-2); g.fill();
  g.shadowBlur=0; g.fillStyle='#1c2070'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,x,by+h/2+s*.05); g.restore();
}
function dibujarCapitulin(g,t,tl,W,H){
  const ap=tl.capi; if(!ap||!ap.length) return;
  const A=ap.find(a=>t>=a.t0&&t<a.t0+CAPI_DUR); if(!A) return;
  const u=t-A.t0, ac=A.acc, m=Math.min(W,H), alto=m*.5, ancho=alto*360/430, r=rng(A.seed);
  const ent=easeBack(clamp(u/.55,0,1)), sal=1-ease(clamp((u-(CAPI_DUR-.5))/.5,0,1)), vis=Math.min(ent,sal);
  // postura
  let pose=ac.f[Math.floor(u*1000/ac.ms)%ac.f.length];
  if(ac.despierta&&u>2.6) pose=Math.floor(u*1000/350)%2?'jump':'cheer';
  const im=CAPI_IMG[pose]; if(!im) return;
  let x,y,rot=0,sc=1;
  const derecha=A.lado>0, margen=m*.03;
  if(ac.vuela){
    const p=ease(clamp(u/CAPI_DUR,0,1)), sx=derecha?-ancho:W, ex=derecha?W:-ancho;
    x=lerp(sx,ex,p); y=lerp(H*.62,H*.12,p)-Math.sin(p*Math.PI)*H*.08; rot=derecha?.45:-.45;
    g.save(); g.globalAlpha=.6; for(let k=1;k<6;k++){ g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=m*.006; const lx=x+ancho/2-(derecha?1:-1)*k*m*.05; g.beginPath(); g.moveTo(lx,y+alto*(.3+k*.08)); g.lineTo(lx-(derecha?1:-1)*m*.06,y+alto*(.3+k*.08)); g.stroke(); } g.restore();
  } else if(ac.asoma){
    // se asoma por el borde y se vuelve a esconder
    const asom=Math.min(easeOut(clamp(u/.6,0,1)),1-ease(clamp((u-2.6)/.4,0,1)))+(u>3.1?Math.min(easeOut(clamp((u-3.1)/.3,0,1)),1-ease(clamp((u-4)/.4,0,1)))*.6:0);
    y=H*.38; rot=derecha?-.35:.35;
    x=derecha?W-ancho*.62*asom:-ancho+ancho*.62*asom;
  } else {
    const salto=(pose==='jump')?-alto*.08:0;
    y=H-alto-m*.04+(1-vis)*(alto+m*.1)+salto;
    x=derecha?W-ancho-margen:margen;
  }
  g.save(); g.translate(x+ancho/2,y+alto/2); g.rotate(rot); g.scale(sc,sc);
  g.shadowColor='rgba(0,0,0,.3)'; g.shadowBlur=m*.02; g.drawImage(im,-ancho/2,-alto/2,ancho,alto); g.shadowBlur=0;
  if(ac.prop&&(pose==='clap'||pose==='sleep'||pose==='cheer')){ g.font=`${Math.round(alto*.2)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign='center'; g.fillText(ac.prop,ancho*.3,-alto*.3+Math.sin(u*4)*alto*.02); }
  g.restore();
  // notas musicales
  if(ac.notas){ g.save(); g.font=`${Math.round(alto*.14)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign='center';
    for(let k=0;k<5;k++){ const q=((u*.6+k/5)%1); g.globalAlpha=(1-q)*vis; g.fillText(k%2?'🎵':'🎶',x+ancho*(.2+.6*((k*37)%10)/10)+Math.sin(q*6+k)*alto*.08,y+alto*.2-q*alto*.7); } g.restore(); }
  // confeti
  if(ac.confeti&&u>.4){ const cols=['#ffc93c','#3a55c4','#ef4444','#22c55e','#ffffff'];
    for(let k=0;k<70;k++){ const ang=-Math.PI/2+(r()-.5)*2.4, v=(.4+r())*m*.9, dt=u-.4, cx=x+ancho/2+Math.cos(ang)*v*dt, cy=y+alto*.2+Math.sin(ang)*v*dt+m*.9*dt*dt;
      g.save(); g.translate(cx,cy); g.rotate(dt*8+k); g.globalAlpha=clamp(1-dt/2.5,0,1); g.fillStyle=cols[k%5]; g.fillRect(-m*.009,-m*.006,m*.018,m*.012); g.restore(); } }
  // bocadillo
  if(A.frase&&u>.6&&u<CAPI_DUR-.7){ const q=easeBack(clamp((u-.6)/.35,0,1)), s=m*.04*q;
    if(s>2){ const bx=ac.asoma?(derecha?W-ancho*.75:ancho*.75):x+ancho/2, by=ac.asoma?y-m*.01:y-m*.01; bocadillo(g,clamp(bx,m*.15,W-m*.15),by,A.frase,s,!derecha); } }
}

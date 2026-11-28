/* Portafolio · guion compartido: idioma, tema con tinta, revelado, inclinación de fichas, menú y copiar. */
(function(){
  var root=document.documentElement, body=document.body;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- idioma (ES/EN) con memoria ---------- */
  var langBtn=document.getElementById('lang-toggle');
  function getLang(){try{return localStorage.getItem('lang')||'es'}catch(e){return 'es'}}
  function applyLang(l){
    body.classList.remove('lang-es','lang-en'); body.classList.add('lang-'+l);
    root.lang=l; if(langBtn) langBtn.textContent=(l==='es'?'EN':'ES');
  }
  applyLang(getLang());
  if(langBtn) langBtn.addEventListener('click',function(){
    var next=body.classList.contains('lang-es')?'en':'es';
    applyLang(next); try{localStorage.setItem('lang',next)}catch(e){}
  });

  /* ---------- barra de progreso ---------- */
  var prog=document.getElementById('progress');
  if(prog){
    var ticking=false;
    function paint(){var h=root;var p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);prog.style.width=(p*100)+'%';ticking=false;}
    addEventListener('scroll',function(){if(!ticking){requestAnimationFrame(paint);ticking=true;}},{passive:true});paint();
  }

  /* ---------- revelado al hacer scroll (visible en reposo) ---------- */
  var els=document.querySelectorAll('.rv');
  if(els.length && 'IntersectionObserver' in window && !reduce){
    els.forEach(function(e){ if(e.getBoundingClientRect().top>innerHeight) e.classList.add('pre'); });
    var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.remove('pre');io.unobserve(x.target);}})},{threshold:.12});
    els.forEach(function(e){io.observe(e)});
  }

  /* ---------- inclinación y foco en las fichas ---------- */
  if(!reduce && matchMedia('(hover:hover)').matches){
    document.querySelectorAll('.tilt').forEach(function(c){
      c.addEventListener('mousemove',function(e){
        var r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
        var rx=((y/r.height)-.5)*-6, ry=((x/r.width)-.5)*8;
        c.style.transform='perspective(900px) rotateX('+rx+'deg) rotateY('+ry+'deg) translateY(-4px)';
        c.style.setProperty('--mx',x+'px');c.style.setProperty('--my',y+'px');
      });
      c.addEventListener('mouseleave',function(){c.style.transform='';});
    });
  }

  /* ---------- tema claro/oscuro con mancha de tinta ----------
     36 trazados vectoriales (assets/tinta.json) dibujados en una máscara SVG del documento.
     Con View Transitions, la máscara se aplica a la captura del tema nuevo (o del viejo al volver):
     dentro de la mancha ya se ve el otro tema, fuera sigue el actual. */
  var btn=document.getElementById('theme'), inkPath=document.getElementById('inkpath');
  var FRAMES=36, DUR=1300, OX=.85, OY=.05, paths=null, busy=false;
  if(btn && inkPath){
    fetch('assets/tinta.json').then(function(r){return r.json()}).then(function(j){paths=j;}).catch(function(){});
  }
  function cur(){return root.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}
  function setTheme(t){root.dataset.theme=t;try{localStorage.setItem('tema',t)}catch(e){}}
  function placeMask(){
    var r=btn.getBoundingClientRect(),bx=r.left+r.width/2,by=r.top+r.height/2,W=innerWidth,H=innerHeight;
    var k=Math.max(1, bx/(OX*W), (W-bx)/((1-OX)*W), by/(OY*H), (H-by)/((1-OY)*H))*1.02;
    var fw=W*k, fh=H*k, x=bx-OX*fw, top=by-OY*fh;
    inkPath.setAttribute('transform','translate('+x+' '+top+') scale('+(fw/1600)+' '+(fh/900)+')');
  }
  function playFrames(reverse,onDone){
    var t0=performance.now(), last=-1;
    placeMask();
    function tick(now){
      var q=Math.min(1,(now-t0)/DUR); var i=Math.round(q*(FRAMES-1)); if(reverse)i=FRAMES-1-i;
      if(q>=1){onDone&&onDone();return;}
      if(i!==last){inkPath.setAttribute('d',paths[i]);last=i;}
      requestAnimationFrame(tick);
    }
    inkPath.setAttribute('d',paths[reverse?FRAMES-1:0]);
    requestAnimationFrame(tick);
  }
  if(btn) btn.addEventListener('click',function(){
    if(busy)return;
    var to=cur()==='dark'?'light':'dark';
    if(reduce||!document.startViewTransition||!paths||!inkPath){setTheme(to);return;}
    busy=true;
    placeMask(); inkPath.setAttribute('d',paths[to==='dark'?0:FRAMES-1]);
    root.classList.add(to==='dark'?'ink-in':'ink-out');
    var vt=document.startViewTransition(function(){setTheme(to)});
    vt.ready.then(function(){playFrames(to!=='dark',function(){vt.skipTransition();});});
    vt.finished.then(function(){},function(){}).then(function(){root.classList.remove('ink-in','ink-out');busy=false;});
  });

  /* ---------- tailt: el móvil de la cabecera arranca como la app ----------
     La página de la animación (la misma que lleva la app) va en un iframe sobre la pantalla del móvil.
     Avisa con «lista», «abriendo», «fin» o «sin3d»; aquí se le dice «cargada» para que se abra. */
  var movil=document.getElementById('movil-arranque'), verBtn=document.getElementById('ver-arranque');
  if(movil && verBtn){
    var pant=movil.querySelector('.pantalla'), marco=pant.querySelector('iframe'), enMarcha=false, seguro=null, abrirT=null;
    function cerrarArranque(){
      clearTimeout(seguro);clearTimeout(abrirT);pant.classList.remove('viva');enMarcha=false;verBtn.disabled=false;
      setTimeout(function(){if(!enMarcha)marco.removeAttribute('src');},700);
    }
    function arrancar(){
      if(enMarcha)return;enMarcha=true;verBtn.disabled=true;
      pant.style.background='';marco.src=marco.dataset.src;pant.classList.add('viva');
      seguro=setTimeout(cerrarArranque,14000);
    }
    addEventListener('message',function(e){
      if(!enMarcha||e.source!==marco.contentWindow)return;
      var m={};try{m=JSON.parse(e.data)}catch(x){return}
      if(m.tipo==='lista'){abrirT=setTimeout(function(){try{marco.contentWindow.cargada&&marco.contentWindow.cargada()}catch(x){}},1600);}
      else if(m.tipo==='abriendo'){pant.style.background='transparent';}
      else if(m.tipo==='fin'||m.tipo==='sin3d'){cerrarArranque();}
    });
    verBtn.addEventListener('click',arrancar);
    if(!reduce){ if(document.readyState==='complete')setTimeout(arrancar,500); else addEventListener('load',function(){setTimeout(arrancar,500)}); }
  }

  /* ---------- menú móvil ---------- */
  var nav=document.getElementById('nav'), menu=document.getElementById('menu');
  if(nav && menu){
    menu.addEventListener('click',function(){nav.classList.toggle('open')});
    nav.querySelectorAll('ul a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open')})});
  }

  /* ---------- copiar correo con aviso propio ---------- */
  var toast=document.getElementById('toast');
  document.querySelectorAll('[data-copy]').forEach(function(a){a.addEventListener('click',function(e){
    if(!navigator.clipboard)return;e.preventDefault();
    navigator.clipboard.writeText(a.dataset.copy).then(function(){if(toast){toast.classList.add('show');setTimeout(function(){toast.classList.remove('show')},1800);}}).catch(function(){location.href=a.href;});
  })});
})();

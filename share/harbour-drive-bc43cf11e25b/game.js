(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  function boot(){
    const map=window.HKMAP,height=HKWorld.groundSampler(map.terrain),sim=HKDriving.create(map,height);
    sim.reset('ferry');
    const signals=HKSignals.create(map),world=HKWorld.create($('world'),map,sim,signals,height);
    let dragId=null,dragX=0,dragLook=0;
    const keys={},touch={},held=()=>({throttle:keys.KeyW||keys.ArrowUp||touch.throttle,brake:keys.KeyS||keys.ArrowDown||touch.brake,left:keys.KeyA||keys.ArrowLeft||touch.left,right:keys.KeyD||keys.ArrowRight||touch.right,handbrake:keys.Space});
    let panel='',picked='salisbury',toastTimer=0,lastCollision=0,arrived=false,uiTimer=0,bigTransform=null,lastFocus=null,blockedFrames=0;
    const bars=[];for(let i=0;i<18;i++){const bar=document.createElement('i');bars.push(bar);$('meter').append(bar);}
    function toast(msg,seconds=2){$('toast').textContent=msg;$('toast').classList.add('show');toastTimer=seconds;}
    function clearInputs(){dragLook=0;dragId=null;for(const k in keys)delete keys[k];for(const k in touch)delete touch[k];document.querySelectorAll('.touch .active').forEach(b=>b.classList.remove('active'));}
    function closePanel(){panel='';$('overlay').hidden=true;clearInputs();if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});else $('game').focus({preventScroll:true});}
    function showPanel(name,kicker,title){
      clearInputs();if(!panel)lastFocus=document.activeElement;panel=name;$('panelKicker').textContent=kicker;$('panelTitle').textContent=title;$('overlay').hidden=false;$('panelBody').replaceChildren();$('closePanel').focus({preventScroll:true});
    }
    function addButton(label,cls,action,parent=$('panelBody')){const el=document.createElement('button');el.textContent=label;el.className=cls;el.onclick=action;parent.append(el);return el;}
    function openPause(){
      showPanel('pause','HARBOUR DRIVE','駕駛已暫停');
      const p=document.createElement('p');p.className='panelHint';p.textContent=sim.state.roadName+' · 市區的士';$('panelBody').append(p);
      const actions=document.createElement('div');actions.className='panelActions';$('panelBody').append(actions);addButton('繼續駕駛','primary',closePanel,actions);addButton('街區地圖','subbtn',openMap,actions);addButton('返回天星碼頭','subbtn',()=>reset('ferry'),actions);
    }
    function openSources(){
      showPanel('sources','MAP & MODELS','地圖及模型資料');
      const info=document.createElement('div');info.className='info sourceInfo';info.innerHTML=window.HK_SOURCE_HTML;$('panelBody').append(info);
      for(const a of info.querySelectorAll('a[href$="map.js"]')){
        a.onclick=e=>{e.preventDefault();const url=URL.createObjectURL(new Blob(['window.HKMAP='+JSON.stringify(map)+';'],{type:'text/javascript'}));
          const link=document.createElement('a');link.href=url;link.download='map.js';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
      }
      addButton('返回操作說明','subbtn',openHelp);
    }
    function openHelp(){
      showPanel('help','DRIVER’S GUIDE','駕駛操作');
      $('panelBody').innerHTML='<div class="helpgrid"><div>油門 <kbd>W / ↑</kbd></div><div>煞車 · 停定後倒車 <kbd>S / ↓</kbd></div><div>向左 / 向右轉 <kbd>A D / ← →</kbd></div><div>手掣 <kbd>空白鍵</kbd></div><div>駕駛席 / 外部鏡頭 <kbd>C</kbd></div><div>左右望（按住） <kbd>Q / E</kbd></div><div>調校視角 <kbd>+ − / 滾輪</kbd></div><div>開啟地圖 <kbd>M</kbd></div><div>暫停 / 繼續 <kbd>P / Esc</kbd></div><div>返回天星碼頭 <kbd>R</kbd></div><div>聲音 / 響號 <kbd>V / B</kbd></div></div><p class="info">從右軚駕駛席沿左側車道行駛。在擋風玻璃上左右拖動可望向兩側，放開即回正。使用駕駛席鏡頭接近交通燈時，畫面顯示本車道燈號及距離，路面光帶標示停止線。紅燈和紅黃燈須停車，黃燈在能安全停下時停車。在街區地圖選擇目的地，即可跟隨路線，亦可直接從該處出發。</p><p class="info">道路與海岸 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>。建築輪廓及地形源自香港特別行政區政府地政總署。一般樓宇立面及路面設施經簡化建模。 <button id="sourceBtn" class="linkbtn">資料來源及精度</button></p>';
      $('sourceBtn').onclick=openSources;addButton('返回駕駛','primary',closePanel);
    }
    function reset(id){sim.reset(id);world.resetCamera();closePanel();arrived=false;const p=sim.places.find(q=>q.id===id);toast('已抵達起點 · '+p.name);}
    // Cache only the geographic drawing. Labels, route and player stay sharp
    // when the large district map and the small moving map use different scales.
    const bounds=map.bounds,atlas=document.createElement('canvas'),scale=1.4;
    atlas.width=Math.ceil((bounds[2]-bounds[0])*scale);atlas.height=Math.ceil((bounds[3]-bounds[1])*scale);
    const base=atlas.getContext('2d');base.setTransform(scale,0,0,scale,-bounds[0]*scale,-bounds[1]*scale);
    function line(c,p){c.moveTo(...p[0]);for(let i=1;i<p.length;i++)c.lineTo(...p[i]);}
    function polys(c,rows,col){c.fillStyle=col;for(const b of rows){c.beginPath();line(c,b.p);c.closePath();for(const hole of b.holes||[]){line(c,hole);c.closePath();}c.fill('evenodd');}}
    base.fillStyle='#214749';base.fillRect(bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]);polys(base,map.land,'#344642');polys(base,map.parks,'#3e5c49');polys(base,map.piers,'#516159');polys(base,map.buildings,'#45564e');
    base.lineJoin=base.lineCap='round';
    for(const r of map.roads.filter(r=>r.underpass)){
      base.save();base.strokeStyle=r.covered?'#779497':'#87938b';base.lineWidth=r.w*.6;
      if(r.covered)base.setLineDash([4,4]);base.beginPath();line(base,r.p);base.stroke();base.restore();
    }
    for(const r of map.roads){if(r.l<0)continue;base.strokeStyle=r.w>=9?'#9b9a78':'#77877b';base.lineWidth=Math.max(1.6,r.w*.62);base.beginPath();line(base,r.p);base.stroke();}
    function drawMap(canvas,large){
      if(!canvas||!canvas.clientWidth)return;
      const w=canvas.clientWidth,h=canvas.clientHeight,pr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.round(w*pr)||canvas.height!==Math.round(h*pr)){canvas.width=Math.round(w*pr);canvas.height=Math.round(h*pr);}
      const c=canvas.getContext('2d');c.setTransform(pr,0,0,pr,0,0);c.fillStyle='#214749';c.fillRect(0,0,w,h);
      const s=sim.state,fit=[...sim.places.map(q=>[q.x,q.z]),[s.x,s.z]];
      const minX=Math.min(...fit.map(q=>q[0]))-95,maxX=Math.max(...fit.map(q=>q[0]))+95,minZ=Math.min(...fit.map(q=>q[1]))-70,maxZ=Math.max(...fit.map(q=>q[1]))+110;
      const factor=large?Math.min(w/(maxX-minX),h/(maxZ-minZ)):w/308,midX=large?(minX+maxX)/2:s.x,midZ=large?(minZ+maxZ)/2:s.z;
      const xy=(x,z)=>[(x-midX)*factor+w/2,(z-midZ)*factor+h/2];
      const [ox,oy]=xy(bounds[0],bounds[1]);
      c.drawImage(atlas,ox,oy,atlas.width/scale*factor,atlas.height/scale*factor);
      if(sim.route&&!sim.route.arrived){c.beginPath();for(const [i,p] of sim.route.points.entries()){const xyP=xy(...p);if(!i)c.moveTo(...xyP);else c.lineTo(...xyP);}c.lineJoin='round';c.lineCap='round';c.strokeStyle='#78ded1';c.lineWidth=large?3:2.8;c.stroke();}
      if(large){
        c.textAlign='center';c.font='600 11px "Helvetica Neue","PingFang HK",sans-serif';c.strokeStyle='#263e37';c.lineWidth=3;c.lineJoin='round';
        const labels=[['九 龍 公 園',-18,-425],['維 多 利 亞 港',160,425],['尖 沙 咀 東',694,-250]];
        for(const [text,x,z]of labels){const p=xy(x,z);c.fillStyle='#b1c1ac';c.strokeText(text,...p);c.fillText(text,...p);}
        for(let i=0;i<sim.places.length;i++){const p=sim.places[i],[x,y]=xy(p.x,p.z),active=p.id===picked;c.fillStyle=active?'#f4c45a':'#dfdfce';c.strokeStyle='#213b35';c.lineWidth=2;c.beginPath();c.arc(x,y,active?9:7,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#213630';c.textBaseline='middle';c.font='bold 10px Helvetica, sans-serif';c.fillText(i+1,x,y+.5);}
        c.textBaseline='alphabetic';bigTransform=xy;
      }
      const [px,py]=xy(s.x,s.z);c.save();c.translate(px,py);c.rotate(s.yaw);c.beginPath();c.arc(0,0,large?11:15,0,Math.PI*2);c.fillStyle='#f3c45929';c.fill();c.beginPath();c.moveTo(0,large?-8:-10);c.lineTo(large?5:7,large?6:7);c.lineTo(0,4);c.lineTo(large?-5:-7,large?6:7);c.closePath();c.fillStyle='#ffce5c';c.strokeStyle='#172d27';c.lineWidth=1.7;c.fill();c.stroke();c.restore();
    }
    function openMap(){
      showPanel('map','DISTRICT MAP','尖沙咀街區地圖');
      $('panelBody').innerHTML='<div class="mapwrap"><canvas id="bigMap" aria-label="街區路網及七個目的地"></canvas><span class="north">N<span>▲</span></span><span class="mapkey">▲ 你的的士</span></div><div class="stops" id="stops"></div><div class="panelActions" id="mapActions"></div><p class="panelHint" id="mapHint"></p><div class="mapCredits">© OpenStreetMap contributors · 香港地政總署</div>';
      function select(id){
        picked=id;const place=sim.places.find(p=>p.id===id);
        for(const b of $('stops').children)b.setAttribute('aria-pressed',String(b.dataset.id===picked));
        $('mapHint').textContent=place.name+' · '+place.en;drawMap($('bigMap'),true);
      }
      sim.places.forEach((p,i)=>{const b=addButton((i+1)+' '+p.name,'',()=>select(p.id),$('stops'));b.dataset.id=p.id;});
      addButton('導航到此','primary',()=>{const r=sim.navigate(picked);if(r){arrived=false;closePanel();toast(r.arrived?'已在目的地附近':'開始導航 · '+r.target.name);}else $('mapHint').textContent='目前位置未能連接此路線，可從該處出發。';},$('mapActions'));
      addButton('從這裏出發','subbtn',()=>reset(picked),$('mapActions'));
      $('bigMap').onclick=e=>{const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;let nearest=null,distance=26;
        for(const p of sim.places){const q=bigTransform(p.x,p.z),d=Math.hypot(q[0]-x,q[1]-y);if(d<distance){distance=d;nearest=p;}}if(nearest)select(nearest.id);};
      select(picked);
    }
    $('miniBtn').onclick=openMap;$('helpBtn').onclick=openHelp;$('pauseBtn').onclick=openPause;$('closePanel').onclick=closePanel;$('overlay').onclick=e=>{if(e.target===$('overlay'))closePanel();};
    function toggleSound(){
      const on=HKSound.toggle(),button=$('soundBtn'),label=(on?'關閉':'開啟')+'聲音 (V)';
      button.querySelector('use').setAttribute('href',on?'#i-sound':'#i-mute');button.setAttribute('aria-pressed',String(on));
      button.setAttribute('aria-label',label);button.title=label;toast(on?'引擎聲已開啟 · B 響號':'聲音已關閉');
    }
    $('soundBtn').onclick=toggleSound;
    function switchView(){toast(world.cameraMode());hud();}
    $('viewBtn').onclick=switchView;$('cancelNav').onclick=()=>{sim.cancelRoute();toast('導航已結束');};
    for(const b of document.querySelectorAll('[data-key]')){
      b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch[b.dataset.key]=true;b.classList.add('active');};
      b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>{touch[b.dataset.key]=false;b.classList.remove('active');};
    }
    const driveKeys=['KeyW','KeyS','KeyA','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyE'];
    window.addEventListener('keydown',e=>{
      if(e.metaKey||e.ctrlKey||e.altKey)return;
      if(panel&&e.code==='Tab'){const focusable=[...$('overlay').querySelectorAll('button,a[href]')];if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus();}return;}
      if(!panel&&driveKeys.includes(e.code)){e.preventDefault();keys[e.code]=true;return;}
      if(e.repeat)return;
      if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(panel)closePanel();else openPause();return;}
      if(e.code==='KeyM'){e.preventDefault();if(panel==='map')closePanel();else openMap();return;}
      if(e.code==='KeyH'){if(panel==='help')closePanel();else openHelp();return;}
      if(panel)return;
      if(e.code==='KeyV')toggleSound();
      if(e.code==='KeyB')HKSound.horn();
      if(e.code==='KeyC')switchView();
      if(e.code==='KeyR')reset('ferry');
      if(e.code==='Equal'||e.code==='NumpadAdd')world.zoomBy(.87);
      if(e.code==='Minus'||e.code==='NumpadSubtract')world.zoomBy(1.15);
    });
    window.addEventListener('keyup',e=>{delete keys[e.code];});
    window.addEventListener('blur',clearInputs);document.addEventListener('visibilitychange',()=>{
      clearInputs();
      if(document.hidden&&!panel)openPause();
    });
    $('world').addEventListener('wheel',e=>{e.preventDefault();if(!panel)world.zoomBy(Math.exp(Math.max(-.15,Math.min(.15,e.deltaY*.003))));},{passive:false});
    const windscreen=$('world');
    windscreen.addEventListener('pointerdown',e=>{
      $('game').focus({preventScroll:true});
      if(panel||windscreen.dataset.view!=='driver'||e.button!==0||dragId!==null)return;
      dragId=e.pointerId;dragX=e.clientX;dragLook=0;windscreen.setPointerCapture(dragId);
    });
    windscreen.addEventListener('pointermove',e=>{
      if(e.pointerId===dragId)dragLook=Math.max(-1,Math.min(1,(dragX-e.clientX)/Math.min(190,windscreen.clientWidth*.31)));
    });
    const endLook=e=>{if(e.pointerId===dragId){dragId=null;dragLook=0;}};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])windscreen.addEventListener(event,endLook);
    const fmt=m=>m>=1000?(m/1000).toFixed(1)+' km':Math.round(m)+' m';
    function hud(){
      const s=sim.state,v=Math.round(Math.abs(s.speed)*3.6);$('speed').textContent=v;$('gear').textContent=s.gear;$('streetName').textContent=s.roadName;$('streetEn').textContent=s.roadEn;
      $('odo').innerHTML=(s.odometer/1000).toFixed(2)+' <small>km</small>';bars.forEach((el,i)=>el.classList.toggle('on',i<Math.ceil(v/4)));
      const signal=world.currentSignal;
      $('signalHUD').hidden=!signal;
      if(signal){
        const text={red:'紅燈 · 停車',amber:'黃燈 · 準備停車',redAmber:'紅黃燈 · 保持停車',green:'綠燈 · 可以通行'};
        $('signalTower').dataset.phase=signal.phase;$('signalAdvice').textContent=text[signal.phase];
        $('signalMetres').textContent=Math.max(0,Math.round(signal.distance));$('signalHUD').dataset.phase=signal.phase;
      }
      drawMap($('mini'),false);if(panel==='map')drawMap($('bigMap'),true);
      const r=sim.route;$('mission').hidden=!r;if(r){$('target').textContent=r.target.name;$('remaining').textContent=r.arrived?'已抵達':fmt(r.remaining);
        const turn={'u-turn':'掉頭',right:'右轉',left:'左轉',arrive:'抵達',straight:'直行'};
        $('navMode').textContent=r.arrived?'目的地':fmt(r.turnDistance)+' 後'+(turn[r.nextTurn]||'直行');if(r.arrived&&!arrived){arrived=true;toast('已抵達 · '+r.target.name,3);}}else arrived=false;
    }
    window.addEventListener('resize',()=>{blockedFrames=0;});
    let prev=performance.now();world.frame(0,false);hud();$('loading').hidden=true;$('game').focus({preventScroll:true});
    function tick(now){
      const dt=Math.min(.10,Math.max(0,(now-prev)/1000));prev=now;
      if(!panel){
        signals.step(dt);const input=held();sim.step(dt,input);world.frame(dt,true,input.brake||input.handbrake,(keys.KeyQ?1:0)-(keys.KeyE?1:0)+dragLook);blockedFrames=0;
        if(world.redCrossed)toast('已越過紅燈停止線',2.4);
      }
      else if(blockedFrames++<2)world.frame(0,false);
      uiTimer-=dt;if(uiTimer<=0){uiTimer=.09;hud();HKSound.step(sim.state.speed,held().throttle,!!panel);}
      if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');}
      if(!panel&&!world.redCrossed&&sim.state.collision&&now-lastCollision>4200){
        const message={traffic:'前方有車 · 請煞車',building:'已碰到建築 · 可倒車調整',water:'已到水邊',boundary:'已到地圖邊界',deck:'已到橋面邊緣',headroom:'橋下空間不足 · 請倒車'};
        toast(message[sim.state.collisionKind]);lastCollision=now;
      }
      requestAnimationFrame(tick);
    }requestAnimationFrame(tick);
  }
  window.addEventListener('load',()=>requestAnimationFrame(()=>setTimeout(async()=>{
    try{
      if(location.protocol!=='file:'||window.HK_PHOTO_URI){
        const photo=new Image();photo.src=window.HK_PHOTO_URI||'ground.jpg';
        try{await photo.decode();window.HK_AERIAL=photo;}catch{window.HK_AERIAL=null;}
      }
      boot();
    }catch(err){console.error(err);$('loadingText').textContent='無法載入 3D 街景。請使用已開啟 WebGL 的 Chrome、Safari 或 Edge，並保持遊戲檔案在同一資料夾。';}
  },16)));
})();

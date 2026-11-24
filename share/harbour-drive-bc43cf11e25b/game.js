(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  function boot(){
    const map=window.HKMAP,height=HKWorld.groundSampler(map.terrain),sim=HKDriving.create(map,height);
    const service=HKTaxiService.create(map,sim),taxi=service.state;
    sim.state.taxi=taxi;sim.taxiStands=service.stands;
    const hired=()=>taxi.phase==='hired';
    const signals=HKSignals.create(map),world=HKWorld.create($('world'),map,sim,signals,height);
    const menu=$('titleMenu');
    const film=$('menuFilm'),motionButton=$('menuMotion'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
    let motionOverride=null;
    function syncMenuFilm(){
      const enabled=motionOverride??!reducedMotion.matches;
      const label=enabled?'暫停背景動畫':'播放背景動畫';
      motionButton.title=label;motionButton.setAttribute('aria-label',label);
      motionButton.querySelector('use').setAttribute('href',enabled?'#i-pause':'#i-play');
      if(menu.hidden||menu.inert||document.hidden||!enabled){film.pause();return;}
      film.play().catch(error=>{
        if(error.name==='NotAllowedError'){motionOverride=false;syncMenuFilm();}
      });
    }
    film.addEventListener('playing',()=>film.classList.add('ready'));
    film.addEventListener('error',()=>{film.classList.remove('ready');motionButton.hidden=true;});
    motionButton.onclick=()=>{motionOverride=!(motionOverride??!reducedMotion.matches);syncMenuFilm();};
    reducedMotion.addEventListener('change',()=>{motionOverride=null;syncMenuFilm();});
    document.addEventListener('visibilitychange',syncMenuFilm);
    let started=false,frameId=0,prev=0;
    let dragId=null,dragX=0,dragLook=0;
    const keys={},touch={},held=()=>({throttle:keys.KeyW||keys.ArrowUp||touch.throttle,brake:keys.KeyS||keys.ArrowDown||touch.brake,left:keys.KeyA||keys.ArrowLeft||touch.left,right:keys.KeyD||keys.ArrowRight||touch.right,handbrake:keys.Space});
    let panel='',toastTimer=0,lastCollision=0,arrived=false,uiTimer=0,districtMap=null,lastFocus=null,blockedFrames=0;
    const bars=[];for(let i=0;i<18;i++){const bar=document.createElement('i');bars.push(bar);$('meter').append(bar);}
    function toast(msg,seconds=2){$('toast').textContent=msg;$('toast').classList.add('show');toastTimer=seconds;}
    function clearInputs(){dragLook=0;dragId=null;for(const k in keys)delete keys[k];for(const k in touch)delete touch[k];document.querySelectorAll('.touch .active').forEach(b=>b.classList.remove('active'));}
    function closePanel(){districtMap?.close();delete $('overlay').dataset.panel;panel='';$('overlay').hidden=true;menu.inert=false;syncMenuFilm();clearInputs();prev=performance.now();if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});else $('game').focus({preventScroll:true});}
    function showMenu(){
      cancelAnimationFrame(frameId);
      closePanel();lastFocus=null;
      HKSound.step(sim.state.speed,false,true);
      $('world').inert=true;$('hud').hidden=true;
      $('startLabel').textContent=started?'繼續駕駛':'開始駕駛';
      menu.hidden=false;syncMenuFilm();$('startDrive').focus({preventScroll:true});
    }
    function startDrive(){
      if(menu.hidden||panel)return;
      clearInputs();started=true;menu.hidden=true;syncMenuFilm();
      $('world').inert=false;$('hud').hidden=false;
      world.frame(0,false);hud();$('game').focus({preventScroll:true});
      prev=performance.now();frameId=requestAnimationFrame(tick);
    }
    function showPanel(name,kicker,title){
      districtMap?.close();$('overlay').dataset.panel=name;clearInputs();if(!panel)lastFocus=document.activeElement;panel=name;menu.inert=true;$('panelKicker').textContent=kicker;$('panelTitle').textContent=title;$('overlay').hidden=false;$('panelBody').replaceChildren();$('closePanel').focus({preventScroll:true});
      $('closePanel').setAttribute('aria-label',name==='map'&&!started?'返回主選單':'關閉');syncMenuFilm();
    }
    function addButton(label,cls,action,parent=$('panelBody')){const el=document.createElement('button');el.textContent=label;el.className=cls;el.onclick=action;parent.append(el);return el;}
    function openPause(){
      showPanel('pause','HARBOUR DRIVE','駕駛已暫停');
      const p=document.createElement('p');p.className='panelHint';p.textContent=sim.state.roadName+' · 市區的士';$('panelBody').append(p);
      const actions=document.createElement('div');actions.className='panelActions';$('panelBody').append(actions);addButton('繼續駕駛','primary',closePanel,actions);addButton('街區地圖','subbtn',openMap,actions);addButton('主選單','subbtn',showMenu,actions);
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
      $('panelBody').innerHTML='<div class="helpgrid"><div>油門 <kbd>W / ↑</kbd></div><div>煞車 · 停定後倒車 <kbd>S / ↓</kbd></div><div>向左 / 向右轉 <kbd>A D / ← →</kbd></div><div>手掣 <kbd>空白鍵</kbd></div><div>駕駛席 / 外部鏡頭 <kbd>C</kbd></div><div>左右望（按住） <kbd>Q / E</kbd></div><div>調校視角 <kbd>+ − / 滾輪</kbd></div><div>開啟地圖 <kbd>M</kbd></div><div>暫停 / 繼續 <kbd>P / Esc</kbd></div><div>返回天星碼頭 <kbd>R</kbd></div><div>聲音 / 響號 <kbd>V / B</kbd></div></div><p class="info">從右軚駕駛席沿左側車道行駛。在擋風玻璃上左右拖動可望向兩側，放開即回正。按 C 切換到近距離跟車，可左右拖動畫面環視車身。使用駕駛席鏡頭接近交通燈時，畫面顯示本車道燈號及距離，路面光帶標示停止線。紅燈和紅黃燈須停車，黃燈在能安全停下時停車。街區地圖可拖動，滾輪或雙指可縮放。點選地圖標記或搜尋地名、街道，再選擇導航或從該處出發。</p><p class="info">在地圖選「的士站」，駛入標示 TAXI 的候客位停定。連續候客最長 '+(HKTaxiService.maxWaitSeconds/60)+' 分鐘，乘客上車即自動接單。跟隨導航，在目的地綠色下客位停定收錶。起錶 HK$29 包首兩公里，慢於 12 km/h 按時間跳錶。</p><p class="info">道路與海岸 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>。建築輪廓及地形源自香港特別行政區政府地政總署。一般樓宇立面及路面設施經簡化建模。 <button id="sourceBtn" class="linkbtn">資料來源及精度</button></p>';
      $('sourceBtn').onclick=openSources;addButton(menu.hidden?'返回駕駛':'返回主選單','primary',closePanel);
    }
    function reset(id){if(hired()){toast('載客中 · 請先完成行程');return;}service.clear();sim.reset(id);world.resetCamera();closePanel();arrived=false;hud();const p=typeof id==='object'?id:sim.places.find(q=>q.id===id);toast('已抵達起點 · '+p.name);}
    const atlas=HKCartography.create(map,sim);
    const drawMiniMap=HKDistrictMap.createMini($('mini'),$('miniPins'),atlas,sim);
    function openMap(){
      showPanel('map','',started?'街區地圖':'選擇出發的士站');
      $('closePanel').dataset.back=started?'返回駕駛':'返回主選單';
      districtMap??=HKDistrictMap.create(map,sim,atlas);
      if(!started){
        districtMap.open($('panelBody'),{pickStand(stand){
          if(started||panel!=='map'||!service.stands.includes(stand))return;
          reset(stand);startDrive();
        }});
        return;
      }
      districtMap.open($('panelBody'),{close:closePanel,depart:reset,hired:hired(),navigate:place=>{
        if(hired())return false;
        const r=sim.navigate(place);
        if(!r)return false;
        arrived=false;closePanel();toast(r.arrived?'已在目的地附近':'開始導航 · '+r.target.name);return true;
      }});
    }
    $('startDrive').onclick=()=>{if(started)startDrive();else openMap();};$('menuHelp').onclick=openHelp;
    $('miniBtn').onclick=openMap;$('helpBtn').onclick=openHelp;$('pauseBtn').onclick=openPause;$('closePanel').onclick=closePanel;$('overlay').onclick=e=>{if(e.target===$('overlay'))closePanel();};
    function toggleSound(){
      const on=HKSound.toggle(),button=$('soundBtn'),label=(on?'關閉':'開啟')+'聲音 (V)';
      button.querySelector('use').setAttribute('href',on?'#i-sound':'#i-mute');button.setAttribute('aria-pressed',String(on));
      button.setAttribute('aria-label',label);button.title=label;toast(on?'引擎聲已開啟 · B 響號':'聲音已關閉');
    }
    $('soundBtn').onclick=toggleSound;
    function switchView(){toast(world.cameraMode());hud();}
    $('viewBtn').onclick=switchView;$('cancelNav').onclick=()=>{if(hired())return;sim.cancelRoute();toast('導航已結束');};
    for(const b of document.querySelectorAll('[data-key]')){
      b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch[b.dataset.key]=true;b.classList.add('active');};
      b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>{touch[b.dataset.key]=false;b.classList.remove('active');};
    }
    const driveKeys=['KeyW','KeyS','KeyA','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyE'];
    window.addEventListener('keydown',e=>{
      if(e.defaultPrevented||e.isComposing||e.keyCode===229||e.metaKey||e.ctrlKey||e.altKey)return;
      if(panel&&e.code==='Tab'){const focusable=[...$('overlay').querySelectorAll('button:not(:disabled),input,a[href],[tabindex="0"]')].filter(el=>el.tabIndex>=0&&el.getClientRects().length);if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus();}return;}
      if(!menu.hidden){
        if(panel&&e.code==='Escape'){e.preventDefault();closePanel();}
        return;
      }
      if(panel==='map'&&e.target instanceof HTMLInputElement&&e.code!=='Escape')return;
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
      if(document.hidden&&menu.hidden&&!panel)openPause();
    });
    $('world').addEventListener('wheel',e=>{e.preventDefault();if(!panel)world.zoomBy(Math.exp(Math.max(-.15,Math.min(.15,e.deltaY*.003))));},{passive:false});
    const windscreen=$('world');
    windscreen.addEventListener('pointerdown',e=>{
      $('game').focus({preventScroll:true});
      if(panel||!['driver','chase'].includes(windscreen.dataset.view)||e.button!==0||dragId!==null)return;
      dragId=e.pointerId;dragX=e.clientX;dragLook=0;windscreen.setPointerCapture(dragId);
    });
    windscreen.addEventListener('pointermove',e=>{
      if(e.pointerId!==dragId)return;
      if(windscreen.dataset.view==='chase'){world.orbitCar((e.clientX-dragX)*.009);dragX=e.clientX;return;}
      dragLook=Math.max(-1,Math.min(1,(dragX-e.clientX)/Math.min(190,windscreen.clientWidth*.31)));
    });
    const endLook=e=>{if(e.pointerId===dragId){dragId=null;dragLook=0;}};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])windscreen.addEventListener(event,endLook);
    const fmt=m=>m>=1000?(m/1000).toFixed(1)+' km':Math.round(m)+' m';
    let shownPhase,shownFare;
    function hud(){
      shownPhase=taxi.phase;shownFare=taxi.fare;
      const s=sim.state,v=Math.round(Math.abs(s.speed)*3.6);$('speed').textContent=v;$('gear').textContent=s.gear;$('streetName').textContent=s.roadName;$('streetEn').textContent=s.roadEn;
      $('odo').innerHTML=(s.odometer/1000).toFixed(2)+' <small>km</small>';bars.forEach((el,i)=>el.classList.toggle('on',i<Math.ceil(v/120*bars.length)));
      const inTaiKokTsui=window.HKTaiKokTsui && s.x < (s.z < -2850 ? -565 : -615) && s.z < -2085 && s.z > -3350;
      const cultural=window.HKWestKowloon&&s.x< -810&&s.z> -747;
      const westKowloon=window.HKWestKowloon&&s.x< -365&&s.z< -680&&s.z> -1600;
      const district=cultural?['西九文化區','WEST KOWLOON CULTURAL DISTRICT']:westKowloon?['西九龍','WEST KOWLOON']:inTaiKokTsui?['大角咀','TAI KOK TSUI']:s.z>-955?['尖沙咀','TSIM SHA TSUI']:s.z>-1490?['佐敦','JORDAN']:s.z>-2140?['油麻地','YAU MA TEI']:s.z>-2950?['旺角','MONG KOK']:['太子','PRINCE EDWARD'];
      document.querySelector('.district b').textContent=district[0];document.querySelector('.district span').textContent=district[1];
      const signal=world.currentSignal;
      $('signalHUD').hidden=!signal;
      if(signal){
        const text={red:'紅燈 · 停車',amber:'黃燈 · 準備停車',redAmber:'紅黃燈 · 保持停車',green:'綠燈 · 可以通行'};
        $('signalTower').dataset.phase=signal.phase;$('signalAdvice').textContent=text[signal.phase];
        $('signalMetres').textContent=Math.max(0,Math.round(signal.distance));$('signalHUD').dataset.phase=signal.phase;
      }
      if(panel!=='map')drawMiniMap();
      const waiting=taxi.phase==='waiting',receipt=taxi.phase==='receipt',money='HK$ '+(taxi.fare/100).toFixed(2);
      $('taxiBadge').textContent=hired()?'載客':waiting?'候客':'空車';
      $('taxiReadout').hidden=taxi.phase==='vacant';
      $('taxiCaption').textContent=waiting?'候客時間':receipt?'本程車資':'跳錶車資';
      const t=Math.floor(taxi.wait);
      $('taxiValue').textContent=waiting?Math.floor(t/60)+':'+String(t%60).padStart(2,'0')+' / '+(HKTaxiService.maxWaitSeconds/60)+':00':money;
      const r=sim.route;$('mission').hidden=!r&&!waiting&&!hired()&&!receipt;
      $('cancelNav').hidden=hired()||!r;
      if(waiting||receipt){
        $('target').textContent=waiting?taxi.origin.name:taxi.target.name;
        $('navMode').textContent=waiting?'候客中 · 請保持停車':'乘客已下車 · 行程完成';
        $('remaining').textContent=waiting?'候客':money;arrived=false;return;
      }
      if(hired()&&(service.nearDrop()||!r||r.arrived)){
        $('target').textContent=taxi.target.name;$('remaining').textContent=service.nearDrop()?'停車':fmt(Math.hypot(s.x-taxi.target.x,s.z-taxi.target.z));
        $('navMode').textContent=service.nearDrop()?'靠邊停定，讓乘客下車':'駛往路邊綠色下客位';return;
      }
      if(r){$('target').textContent=r.target.name;$('remaining').textContent=r.arrived?'已抵達':fmt(r.remaining);
        const turn={'u-turn':'掉頭',right:'右轉',left:'左轉',arrive:'抵達',straight:'直行'};
        $('navMode').textContent=r.arrived?'目的地':fmt(r.turnDistance)+' 後'+(turn[r.nextTurn]||'直行');if(r.arrived&&!arrived){arrived=true;toast('已抵達 · '+r.target.name,3);}}else arrived=false;
    }
    window.addEventListener('resize',()=>{blockedFrames=0;});
    $('loading').hidden=true;showMenu();
    function tick(now){
      const elapsed=Math.max(0,(now-prev)/1000),dt=Math.min(.10,elapsed);prev=now;
      if(!panel){
        signals.step(dt);const input=held();sim.step(dt,input);
        const event=service.step(elapsed);
        if(event==='pickup'){arrived=false;toast('乘客已上車 · 前往'+taxi.target.name,4);}
        if(event==='complete')toast('乘客已付款 · HK$ '+(taxi.fare/100).toFixed(2),4);
        world.frame(dt,true,input.brake||input.handbrake,(keys.KeyQ?1:0)-(keys.KeyE?1:0)+dragLook);blockedFrames=0;
        if(world.redCrossed)toast('已越過紅燈停止線',2.4);
      }
      else if(blockedFrames++<2)world.frame(0,false);
      uiTimer-=dt;if(uiTimer<=0||taxi.phase!==shownPhase||taxi.fare!==shownFare){uiTimer=.09;hud();HKSound.step(sim.state.speed,held().throttle,!!panel);}
      if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');}
      if(!panel&&!world.redCrossed&&sim.state.collision&&now-lastCollision>4200){
        const message={traffic:'前方有車 · 請煞車',building:'已碰到建築 · 可倒車調整',water:'已到水邊',boundary:'已到地圖邊界',deck:'已到橋面邊緣',barrier:'已到地道護牆',headroom:'橋下空間不足 · 請倒車'};
        toast(message[sim.state.collisionKind]);lastCollision=now;
      }
      frameId=requestAnimationFrame(tick);
    }
  }
  window.addEventListener('load',()=>requestAnimationFrame(()=>setTimeout(async()=>{
    try{
      // Small overview textures keep the whole district legible while detailed
      // tiles stream around the vehicle. Exact road surfaces are already resident.
      window.HK_BASE_GROUNDS=await Promise.all(HK_GROUND_TILES.map(async region=>{
        const image=new Image();image.src=HKScenery.url(region.base);await image.decode();return image;
      }));
      boot();
    }catch(err){console.error(err);$('loadingText').textContent='無法載入 3D 街景。請使用已開啟 WebGL 的 Chrome、Safari 或 Edge，並保持遊戲檔案在同一資料夾。';}
  },16)));
})();

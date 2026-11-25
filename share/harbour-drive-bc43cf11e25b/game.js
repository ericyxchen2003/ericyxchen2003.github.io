(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  async function boot(){
    const wallet=await HKWallet.open();
    const map=window.HKMAP,height=HKWorld.groundSampler(map.terrain),sim=HKDriving.create(map,height);
    const service=HKTaxiService.create(map,sim),taxi=service.state;
    sim.state.taxi=taxi;sim.taxiStands=service.stands;
    const dayClock=HKDayCycle.createClock();
    const hired=()=>taxi.phase==='hired';
    const signals=HKSignals.create(map),world=HKWorld.create($('world'),map,sim,signals,height);
    const menu=$('titleMenu'),loading=$('loading');
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
    let savedMinute=null;
    function showWallet(){
      $('walletCaption').textContent=wallet.persistent?'餘額':'餘額 · 僅本次';
      $('walletBalance').textContent=HKWallet.format(wallet.balance);
    }
    function settled(result,fare=0,fareFine=0,redLightFine=0){
      if(result.record.minute>dayClock.totalMinutes)dayClock.startAt(result.record.minute);
      showWallet();
      const messages=[];
      if(fare){
        HKSound.payment();
        messages.push('車資入帳 +'+HKWallet.format(fare));
      }
      if(fareFine)messages.push('車資超出參考價上限，罰款 −'+HKWallet.format(fareFine));
      if(redLightFine)messages.push('衝紅燈，罰款 −'+HKWallet.format(redLightFine));
      if(result.fee)messages.push('的士日租 −'+HKWallet.format(result.fee));
      if(messages.length)toast(messages.join('　·　'),4);
    }
    function saveDriving(fare=0,fareFine=0,redLightFine=0){
      if(!started||confirmClear.disabled)return;
      const minute=dayClock.totalMinutes;
      savedMinute=Math.floor(minute);
      wallet.settle(minute,fare,fareFine+redLightFine).then(result=>{
        if(!handleExternalReset(result))settled(result,fare,fareFine,redLightFine);
      });
    }
    const restDialog=$('restDialog');
    restDialog.oncancel=event=>event.preventDefault();
    $('restBtn').onclick=async()=>{
      if(panel||!menu.hidden||taxi.phase!=='waiting')return;
      const wakeMinute=dayClock.totalMinutes+8*60;
      const durationMs=5000;
      panel='rest';
      clearInputs();
      HKSound.step(0,false,true);
      $('restWake').textContent='醒來時間　'+HKDayCycle.format(wakeMinute%1440);
      restDialog.style.setProperty('--rest-duration',durationMs+'ms');
      restDialog.showModal();
      await new Promise(resolve=>setTimeout(resolve,durationMs));
      if(panel!=='rest')return;
      const result=await wallet.settle(wakeMinute);
      if(handleExternalReset(result))return;
      settled(result);
      savedMinute=Math.floor(dayClock.totalMinutes);
      service.clear();
      service.step(0,dayClock.minutes);
      world.setTime(dayClock.minutes);
      hud();
      restDialog.close();
      panel='';
      prev=performance.now();
      if(!result.fee)toast('已休息 8 小時');
      if(document.hidden)openPause();
      else $('game').focus({preventScroll:true});
    };
    window.addEventListener('pagehide',()=>saveDriving());
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
    const clearDialog=$('clearSaveDialog'),confirmClear=$('confirmClear'),cancelClear=$('cancelClear');
    function handleExternalReset(result){
      if(result.resetElsewhere)resetToMenu('本機存檔已在另一個分頁重設。');
      return result.resetElsewhere;
    }
    function resetToMenu(message){
      started=false;savedMinute=null;
      dayClock.startAt(HKDayCycle.defaultStart);
      service.clear();setGuideStand(null);sim.reset();arrived=false;
      restDialog.close();clearDialog.close();loading.hidden=true;
      showWallet();showMenu();$('saveNotice').textContent=message;
    }
    $('clearSave').onclick=()=>{
      $('saveNotice').textContent='';$('clearSaveError').hidden=true;
      clearDialog.showModal();cancelClear.focus();
    };
    cancelClear.onclick=()=>clearDialog.close();
    clearDialog.oncancel=event=>{if(confirmClear.disabled)event.preventDefault();};
    confirmClear.onclick=async()=>{
      if(confirmClear.disabled||!clearDialog.open)return;
      confirmClear.disabled=cancelClear.disabled=true;
      $('clearSaveError').hidden=true;
      try{
        await wallet.reset();
      }catch{
        $('clearSaveError').textContent='未能清除本機存檔，請再試一次。';
        $('clearSaveError').hidden=false;
        return;
      }finally{
        confirmClear.disabled=cancelClear.disabled=false;
      }
      resetToMenu(wallet.persistent?'本機存檔已清除。':'本次遊戲已重設。瀏覽器儲存空間無法使用。');
    };
    function startDrive(){
      // Keep the departure screen on top while the first frame builds nearby scenery.
      world.setTime(dayClock.minutes);world.frame(0,false);
      menu.hidden=true;closePanel();started=true;
      showSound();$('world').inert=false;$('hud').hidden=false;
      hud();loading.hidden=true;$('game').focus({preventScroll:true});
      prev=performance.now();frameId=requestAnimationFrame(tick);
      if(document.hidden)openPause();
    }
    function showPanel(name,kicker,title){
      districtMap?.close();$('overlay').dataset.panel=name;clearInputs();if(!panel)lastFocus=document.activeElement;panel=name;menu.inert=true;$('panelKicker').textContent=kicker;$('panelTitle').textContent=title;$('overlay').hidden=false;$('panelBody').replaceChildren();$('closePanel').focus({preventScroll:true});
      $('closePanel').setAttribute('aria-label',name==='map'&&!started?'返回主選單':'關閉');syncMenuFilm();
    }
    function addButton(label,cls,action,parent=$('panelBody')){const el=document.createElement('button');el.textContent=label;el.className=cls;el.onclick=action;parent.append(el);return el;}
    let guideFromPause=false;
    function dismissPanel(){
      if(panel==='help'&&guideFromPause){openPause();return;}
      closePanel();
    }
    function openPause(){
      const returningFromGuide=panel==='help';
      showPanel('pause','HONG KONG TAXI SIMULATOR','駕駛已暫停');
      const p=document.createElement('p');p.className='panelHint';p.textContent=sim.state.roadName+' · 市區的士';$('panelBody').append(p);
      const actions=document.createElement('div');actions.className='panelActions';$('panelBody').append(actions);
      addButton('繼續駕駛','primary',closePanel,actions);
      const guide=addButton('駕駛操作指南','subbtn',openHelp,actions);
      addButton('街區地圖','subbtn',openMap,actions);addButton('主選單','subbtn',showMenu,actions);
      if(returningFromGuide)guide.focus({preventScroll:true});
    }
    function openSources(){
      showPanel('sources','MAP & MODELS','地圖及模型資料');
      const info=document.createElement('div');info.className='info sourceInfo';info.innerHTML=window.HK_SOURCE_HTML;$('panelBody').append(info);
      for(const a of info.querySelectorAll('a[href$="map.js"]')){
        a.onclick=e=>{e.preventDefault();const url=URL.createObjectURL(new Blob(['window.HKMAP='+JSON.stringify(map)+';'],{type:'text/javascript'}));
          const link=document.createElement('a');link.href=url;link.download='map.js';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
      }
      $('closePanel').setAttribute('aria-label','返回主選單');
      addButton('返回主選單','subbtn',dismissPanel);
    }
    function openHelp(){
      if(panel!=='help')guideFromPause=panel==='pause';
      showPanel('help','DRIVER’S GUIDE','駕駛操作指南');
      $('panelBody').append($('driverGuide').content.cloneNode(true));
      const backLabel=guideFromPause?'返回暫停選單':menu.hidden?'返回駕駛':'返回主選單';
      $('closePanel').setAttribute('aria-label',backLabel);
      addButton(backLabel,'primary',dismissPanel);
    }
    let guideStand=null;
    function setGuideStand(stand){
      guideStand=stand;
      $('rankGuide').hidden=!stand;
      if(stand)$('guideStandName').textContent=stand.name;
    }
    $('dismissRankGuide').onclick=()=>{setGuideStand(null);$('game').focus({preventScroll:true});};
    function updateRankGuide(){
      if(!guideStand)return;
      const s=sim.state,sameLevel=s.layer===guideStand.layer;
      const dy=sameLevel?0:height.surface(s.x,s.z,s.layer)-height.surface(guideStand.x,guideStand.z,guideStand.layer,guideStand.anchor.road.id);
      const distance=Math.hypot(s.x-guideStand.x,s.z-guideStand.z,dy);
      const metres=Math.round(distance)+' 米';
      if($('guideStandDistance').textContent!==metres)$('guideStandDistance').textContent=metres;
      let action='前往此站，駛入 TAXI 候客位停定。';
      if(service.withinBay(guideStand)){
        action=taxi.phase==='waiting'&&taxi.origin===guideStand?'請保持停車，等乘客上車再開車。':'請在候客位停定，乘客會自動上車。';
      }else if(distance<35){
        action=sameLevel?'對準地上的 TAXI 標記，停定等客。':'請駛往候客位所在的道路層。';
      }
      if($('guideStandAction').textContent!==action)$('guideStandAction').textContent=action;
    }
    async function departStand(stand,shift){
      if(panel!=='map'||!service.stands.includes(stand))return;
      if(hired()){toast('載客中 · 請先完成行程');return;}
      if(!started)HKSound.activate();
      panel='departure';cancelAnimationFrame(frameId);clearInputs();HKSound.step(0,false,true);
      $('loadingText').textContent='正在載入'+stand.name+'的街景…';
      loading.classList.add('departing');loading.hidden=false;menu.hidden=true;syncMenuFilm();
      $('overlay').hidden=true;$('hud').hidden=true;$('world').inert=true;
      loading.focus({preventScroll:true});
      let result;
      try{
        // A frame between these callbacks lets the browser paint before synchronous 3D work.
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        if(panel!=='departure')return;
        if(shift){
          result=await wallet.start(shift.minutes,shift.savedMinute);
          if(handleExternalReset(result))return;
          dayClock.startAt(result.record.minute);savedMinute=Math.floor(dayClock.totalMinutes);
        }
        service.clear();sim.reset(stand);setGuideStand(stand);world.resetCamera();arrived=false;
        $('saveNotice').textContent='';startDrive();
      }catch(error){
        console.error(error);
        panel='map';menu.hidden=started;$('hud').hidden=!started;$('world').inert=!started;
        $('overlay').hidden=false;loading.hidden=true;
        const status=$('panelBody').querySelector('.dm-distance');
        if(status){status.setAttribute('role','alert');status.textContent='暫時未能載入站點，請再試一次。';}
        const retry=$('panelBody').querySelector(shift?'.dm-card .dm-nav':'.dm-card .dm-depart');
        (retry||$('closePanel')).focus({preventScroll:true});
        if(started){blockedFrames=2;prev=performance.now();frameId=requestAnimationFrame(tick);}
        return;
      }
      toast('已抵達起點 · '+stand.name);
      if(result)settled(result);
    }
    const atlas=HKCartography.create(map,sim);
    const drawMiniMap=HKDistrictMap.createMini($('mini'),$('miniPins'),atlas,sim);
    function openMap(){
      showPanel('map','',started?'街區地圖':'選擇出發的士站');
      $('closePanel').dataset.back=started?'返回駕駛':'返回主選單';
      districtMap??=HKDistrictMap.create(map,sim,atlas);
      if(!started){
        const savedMinuteOnMap=wallet.minute;
        districtMap.open($('panelBody'),{savedMinute:savedMinuteOnMap,
          pickStand:(stand,minutes)=>departStand(stand,{minutes,savedMinute:savedMinuteOnMap})});
        return;
      }
      const nearest=hired()?null:service.nearestStand();
      districtMap.open($('panelBody'),{close:closePanel,departStand,hired:hired(),nearest,navigate:place=>{
        if(hired())return false;
        const r=sim.navigate(place);
        if(!r)return false;
        setGuideStand(service.stands.includes(place)?place:null);
        arrived=false;closePanel();hud();toast(r.arrived?'已在目的地附近':'開始導航 · '+r.target.name);return true;
      }});
    }
    $('startDrive').onclick=()=>{if(menu.hidden||panel)return;HKSound.activate();if(started)startDrive();else openMap();};$('menuHelp').onclick=openHelp;$('menuSources').onclick=openSources;
    $('miniBtn').onclick=openMap;$('helpBtn').onclick=openHelp;$('pauseBtn').onclick=openPause;$('closePanel').onclick=dismissPanel;$('overlay').onclick=e=>{if(e.target===$('overlay'))dismissPanel();};
    function showSound(){
      const on=HKSound.enabled,button=$('soundBtn'),label=(on?'關閉':'開啟')+'聲音 (V)';
      button.querySelector('use').setAttribute('href',on?'#i-sound':'#i-mute');button.setAttribute('aria-pressed',String(on));
      button.setAttribute('aria-label',label);button.title=label;
    }
    function toggleSound(){
      const on=HKSound.toggle();showSound();toast(on?'聲音已開啟 · B 響號':'聲音已關閉');
    }
    $('soundBtn').onclick=toggleSound;
    const headlightSelect=$('headlights'),headlightControl=$('headlightControl');
    function showHeadlights(){
      const mode=world.headlightMode,on=world.headlightsOn;
      headlightSelect.value=mode;
      headlightControl.classList.toggle('lit',on);
      headlightControl.querySelector('small').hidden=mode!=='auto';
      headlightControl.title=headlightSelect.selectedOptions[0].text+' · '+(on?'已開':'已關')+' (L)';
    }
    function setHeadlights(mode){
      world.setHeadlights(mode);showHeadlights();
      toast('車燈 · '+headlightSelect.selectedOptions[0].text);
    }
    headlightSelect.onchange=()=>{setHeadlights(headlightSelect.value);$('game').focus({preventScroll:true});};
    function switchView(){toast(world.cameraMode());hud();}
    $('viewBtn').onclick=switchView;$('cancelNav').onclick=()=>{if(hired())return;sim.cancelRoute();toast('導航已結束');};
    for(const b of document.querySelectorAll('[data-key]')){
      b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch[b.dataset.key]=true;b.classList.add('active');};
      b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>{touch[b.dataset.key]=false;b.classList.remove('active');};
    }
    const driveKeys=['KeyW','KeyS','KeyA','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyE'];
    window.addEventListener('keydown',e=>{
      if(panel==='rest'||panel==='departure')return;
      if(e.defaultPrevented||e.isComposing||e.keyCode===229||e.metaKey||e.ctrlKey||e.altKey)return;
      if(panel&&e.code==='Tab'){const focusable=[...$('overlay').querySelectorAll('button:not(:disabled),input,select,summary,a[href],[tabindex="0"]')].filter(el=>el.tabIndex>=0&&el.getClientRects().length);if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus();}return;}
      if(!menu.hidden){
        if(panel&&e.code==='Escape'){e.preventDefault();dismissPanel();}
        return;
      }
      if(panel==='map'&&e.target instanceof HTMLInputElement&&e.code!=='Escape')return;
      if(e.target===headlightSelect&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Home','End'].includes(e.code))return;
      if(e.target===$('dismissRankGuide')&&e.code==='Space')return;
      if(!panel&&driveKeys.includes(e.code)){e.preventDefault();keys[e.code]=true;return;}
      if(e.repeat)return;
      if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(panel)dismissPanel();else openPause();return;}
      if(e.code==='KeyM'){e.preventDefault();if(panel==='map')closePanel();else openMap();return;}
      if(e.code==='KeyH'){if(panel==='help')dismissPanel();else openHelp();return;}
      if(panel)return;
      if(e.code==='KeyL')setHeadlights(e.shiftKey?'auto':world.headlightsOn?'off':'on');
      if(e.code==='KeyV')toggleSound();
      if(e.code==='KeyB')HKSound.horn();
      if(e.code==='KeyC')switchView();
      if(e.code==='Equal'||e.code==='NumpadAdd')world.zoomBy(.87);
      if(e.code==='Minus'||e.code==='NumpadSubtract')world.zoomBy(1.15);
    });
    window.addEventListener('keyup',e=>{delete keys[e.code];});
    window.addEventListener('blur',clearInputs);document.addEventListener('visibilitychange',()=>{
      clearInputs();
      if(document.hidden)saveDriving();
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
    const waitTime=seconds=>Math.floor(seconds/60)+':'+String(Math.floor(seconds)%60).padStart(2,'0');
    let shownPhase,shownFare;
    function hud(){
      const time=HKDayCycle.format(dayClock.minutes);
      if($('gameTime').textContent!==time)$('gameTime').textContent=time;
      if(headlightSelect.value!==world.headlightMode||headlightControl.classList.contains('lit')!==world.headlightsOn)showHeadlights();
      shownPhase=taxi.phase;shownFare=taxi.fare;
      const s=sim.state,v=Math.round(Math.abs(s.speed)*3.6);$('speed').textContent=v;$('gear').textContent=s.gear;$('streetName').textContent=s.roadName;$('streetEn').textContent=s.roadEn;
      $('odo').innerHTML=(s.odometer/1000).toFixed(2)+' <small>km</small>';bars.forEach((el,i)=>el.classList.toggle('on',i<Math.ceil(v/120*bars.length)));
      const inTaiKokTsui=window.HKTaiKokTsui && s.x < (s.z < -2850 ? -565 : -615) && s.z < -2085 && s.z > -3350;
      const cultural=window.HKWestKowloon&&s.x< -810&&s.z> -747;
      const westKowloon=window.HKWestKowloon&&s.x< -365&&s.z< -680&&s.z> -1600;
      const district=window.HKHoManTinGuide?.districtAt(s.x,s.z)??window.HKToKwaWanGuide?.districtAt(s.x,s.z)??(window.HKHungGuide?.districtAt(s.x,s.z))??(cultural?['西九文化區','WEST KOWLOON CULTURAL DISTRICT']:westKowloon?['西九龍','WEST KOWLOON']:inTaiKokTsui?['大角咀','TAI KOK TSUI']:s.z>-955?['尖沙咀','TSIM SHA TSUI']:s.z>-1490?['佐敦','JORDAN']:s.z>-2140?['油麻地','YAU MA TEI']:s.z>-2950?['旺角','MONG KOK']:['太子','PRINCE EDWARD']);
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
      updateRankGuide();
      $('restBtn').hidden=!waiting;
      $('taxiBadge').textContent=hired()?'載客':waiting?'候客':'空車';
      $('taxiReadout').hidden=!hired()&&!receipt;
      $('taxiCaption').textContent=receipt?'本程車資':'跳錶車資';
      $('taxiValue').textContent=money;
      $('referenceReadout').hidden=!hired()&&!receipt;
      if(hired()||receipt)$('referenceValue').textContent=HKWallet.formatRange(taxi.minimumFare,taxi.referenceFare);
      const r=sim.route;$('mission').hidden=!r&&!waiting&&!hired()&&!receipt;
      $('cancelNav').hidden=hired()||!r;
      if(waiting||receipt){
        $('target').textContent=waiting?taxi.origin.name:taxi.target.name;
        $('navMode').textContent=waiting?'等待時間（預計等待'+taxi.expectedWaitSeconds+'秒）':taxi.fine?'超出參考價上限 · 罰款 '+HKWallet.format(taxi.fine):'乘客已下車 · 行程完成';
        $('remaining').textContent=waiting?waitTime(taxi.wait):money;
        arrived=false;return;
      }
      if(hired()&&(service.nearDrop()||!r||r.arrived)){
        $('target').textContent=taxi.target.name;$('remaining').textContent=service.nearDrop()?'停車':fmt(Math.hypot(s.x-taxi.target.x,s.z-taxi.target.z));
        $('navMode').textContent=service.nearDrop()?'靠邊停定，讓乘客下車':'駛往路邊綠色下客位';return;
      }
      if(r){$('target').textContent=r.target.name;$('remaining').textContent=r.arrived?'已抵達':fmt(r.remaining);
        const turn={'keep-left':'靠左分流','keep-right':'靠右分流','u-turn':'掉頭',right:'右轉',left:'左轉',arrive:'抵達',straight:'直行'};
        $('navMode').textContent=r.arrived?'目的地':fmt(r.turnDistance)+' 後'+(turn[r.nextTurn]||'直行');if(r.arrived&&!arrived){arrived=true;toast('已抵達 · '+r.target.name,3);}}else arrived=false;
    }
    window.addEventListener('resize',()=>{blockedFrames=0;});
    showWallet();$('loading').hidden=true;showMenu();
    function tick(now){
      const elapsed=Math.max(0,(now-prev)/1000),dt=Math.min(.10,elapsed);prev=now;
      if(!panel){
        dayClock.advance(elapsed);world.setTime(dayClock.minutes);
        signals.step(dt);const input=held();sim.step(dt,input);
        const event=service.step(elapsed,dayClock.minutes);
        if(event==='pickup'){setGuideStand(null);arrived=false;HKSound.pickup();toast('乘客已上車 · 前往'+taxi.target.name,4);}
        world.frame(dt,true,input.brake||input.handbrake,(keys.KeyQ?1:0)-(keys.KeyE?1:0)+dragLook);blockedFrames=0;
        const redLightFine=world.redCrossed&&Math.random()<.5?20000:0; // HK cents
        if(world.redCrossed&&!redLightFine)toast('已越過紅燈停止線',2.4);
        if(event==='complete')saveDriving(taxi.fare,taxi.fine,redLightFine);
        else if(redLightFine||Math.floor(dayClock.totalMinutes)!==savedMinute)saveDriving(0,0,redLightFine);
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
      await boot();
    }catch(err){console.error(err);$('loadingText').textContent='無法載入 3D 街景。請使用已開啟 WebGL 的 Chrome、Safari 或 Edge，並保持遊戲檔案在同一資料夾。';}
  },16)));
})();

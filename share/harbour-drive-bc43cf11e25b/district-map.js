// Interactive district map. View coordinates are CSS pixels over the game's local metre grid.
window.HKDistrictMap=(()=>{
  'use strict';
  const drawings={
    taxi:'<path d="m3 12 2-6h14l2 6v6H3zm0 0h18M6 18v2m12-2v2M9 6V3h6v3M6 15h2m8 0h2"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    arrow:'<path d="m4 12 16-8-6 16-2.5-6.5z"/>',
    bed:'<path d="M3 19V6m18 13V9H9v6m-6 0h18M5.5 10h1"/>',
    bag:'<path d="M4.5 8.5h15l1 12h-17zM9 9V6a3 3 0 0 1 6 0v3"/>',
    museum:'<path d="m3 8 9-5 9 5zM5 11v6m5-6v6m4-6v6m5-6v6M3 20h18"/>',
    train:'<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 11h14M8 21l2-3m6 3-2-3m-5-4h.1m5.8 0h.1"/>',
    tree:'<path d="m12 2 6 8h-3l5 6H4l5-6H6zM12 16v5"/>',
    road:'<path d="m6 21 3-18m9 18L15 3m-3 1v3m0 4v3m0 4v3"/>',
    map:'<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2zM9 3v15m6-12v15"/>',
    building:'<path d="M5 21V4h11v17M3 21h18m-5-10h4v10M8 8h1m3 0h1m-5 4h1m3 0h1m-5 4h1"/>',
    cross:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    locate:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
    fit:'<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    route:'<path d="M4 19v-4a4 4 0 0 1 4-4h10m-4-4 4 4-4 4"/>',
    flag:'<path d="M5 21V4c4-3 9 3 14 0v10c-5 3-10-3-14 0"/>'
  };
  const icon=id=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+drawings[id]+'</svg>';
  const $el=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const pairs=new Map(Array.from('並乾亞併來係俱倉個倫偉側傑備傳傷僑價儀億儉優儲儷兒內兩冊凱別則剛創劃劇劉劍動務勝勞勳勵匯區協參吳呂員啓啟單嚴囪國圍園圓圖團堅報場塊壇壓壘壽夾奧妝婦嬰學宮實寧審寫寬寶專尋對導層屬岡島峽崗崙嵐嶺巒師帳帶幗幣幹幾庫廁廄廈廟廠廣廬廳張強彌彎彥後徑從復徵恆悅愛愷慶應懷戲戶採揚換摺擁擇擋據擬擴擺攝攤數斷於昇時晉暉暢暫曉書會東柵條棗椏楊楓業極榮構槍樂樑樓標樣樹樺橋機橫檔檢檳櫥櫸櫻欄權欽歐歡歲歷殘殮殯殼氣沒涼淨減測準溫滾滿漢潔潤澤濟濤濱灝灣為無煒煙煥熱熾燈營燦爾牆牽狀獎獨現瑩瑪環璽瓊產畫異當疊療發盤眾硤確碼磚礎礦祿禦禮種穌積穎窩筆節範築篩簡簷籌籤粵紀約紅紋納紗級細紹組結絕絡統絲綉經綜綠維網綸綺綽線緣編緬緯練緻縫縮縱總績織繞繪繹繼續羅羣義習聖聯聲職肅腦腫腳膠臨臺與興舊舖艷莊華萊萬葉蓋蔭蔴薈藍藝藥蘭處號衆術衛裏補裝製複見規視覺覽觀訂計訊訓訖託記訪設許診評詢試詩該誌認語誠說誼調請諮諸諾謙講識譚譜議護譽讀變讓讚豎豐貝財貢貨販貴貸費貼貿賀資賓賜賢賣質購賽蹟車軍軒較載輔輛輝輪輸轉辦迴這連週進遊運過達遜遠適選邊邏郵鄉鄧鄰醫釗釘鈀鉅銀銘銜鋪鋼錄錢錦錶鍵鍾鎮鏡鐘鐵鑄鑑鑽鑾長門閉開間閘閣閩闊關陞陰陳陸陽隊階際隨險雋雙雜雞離雲電靄靈靜韻響頂項順須頌預頓領頤頭顏類顯風飛飾餅餘館馬駁駐駒駕駛駿騏騰體髮魚鮑鮮鳥鳳鳴鴉鴨鴻鶴鷹鸛鹹麗麥麵麼黃點齡龍龐',(c,i)=>[c,'并干亚并来系具仓个伦伟侧杰备传伤侨价仪亿俭优储俪儿内两册凯别则刚创划剧刘剑动务胜劳勋励汇区协参吴吕员启启单严囱国围园圆图团坚报场块坛压垒寿夹奥妆妇婴学宫实宁审写宽宝专寻对导层属冈岛峡岗仑岚岭峦师帐带帼币干几库厕厩厦庙厂广庐厅张强弥弯彦后径从复征恒悦爱恺庆应怀戏户采扬换折拥择挡据拟扩摆摄摊数断于升时晋晖畅暂晓书会东栅条枣桠杨枫业极荣构枪乐梁楼标样树桦桥机横档检槟橱榉樱栏权钦欧欢岁历残殓殡壳气没凉净减测准温滚满汉洁润泽济涛滨灏湾为无炜烟焕热炽灯营灿尔墙牵状奖独现莹玛环玺琼产画异当叠疗发盘众硖确码砖础矿禄御礼种稣积颖窝笔节范筑筛简檐筹签粤纪约红纹纳纱级细绍组结绝络统丝绣经综绿维网纶绮绰线缘编缅纬练致缝缩纵总绩织绕绘绎继续罗群义习圣联声职肃脑肿脚胶临台与兴旧铺艳庄华莱万叶盖荫麻荟蓝艺药兰处号众术卫里补装制复见规视觉览观订计讯训讫托记访设许诊评询试诗该志认语诚说谊调请谘诸诺谦讲识谭谱议护誉读变让赞竖丰贝财贡货贩贵贷费贴贸贺资宾赐贤卖质购赛迹车军轩较载辅辆辉轮输转办回这连周进游运过达逊远适选边逻邮乡邓邻医钊钉钯钜银铭衔铺钢录钱锦表键钟镇镜钟铁铸鉴钻銮长门闭开间闸阁闽阔关升阴陈陆阳队阶际随险隽双杂鸡离云电霭灵静韵响顶项顺须颂预顿领颐头颜类显风飞饰饼余馆马驳驻驹驾驶骏骐腾体发鱼鲍鲜鸟凤鸣鸦鸭鸿鹤鹰鹳咸丽麦面么黄点龄龙庞'[i]]));
  const fold=s=>Array.from((s||'').normalize('NFKC').toLowerCase(),c=>pairs.get(c)||c).join('').replace(/[\s'’·._-]/g,'');
  const metric=n=>n>=1000?(n/1000).toFixed(n%1000===0?0:1)+' km':Math.round(n)+' m';
  const cats=()=>HKCartography.categories;
  function categorySymbol(p){
    const cat=cats()[p.kind],mark=$el('span','dm-symbol');mark.style.setProperty('--cat',cat.color);mark.innerHTML=icon(cat.icon);return mark;
  }
  function drawRoute(ctx,route,project,size,selection){
    if(!route?.points.length)return;
    ctx.save();ctx.lineJoin=ctx.lineCap='round';
    ctx.beginPath();route.points.forEach(([x,z],i)=>{const p=project(x,z);if(i)ctx.lineTo(...p);else ctx.moveTo(...p);});
    ctx.strokeStyle='white';ctx.lineWidth=7*size;ctx.stroke();ctx.strokeStyle='#2775da';ctx.lineWidth=4.3*size;ctx.stroke();
    const [endX,endY]=project(...route.points.at(-1));
    if(selection){
      const [px,py]=project(selection.x,selection.z);
      if(Math.hypot(px-endX,py-endY)>12){
        ctx.beginPath();ctx.moveTo(endX,endY);ctx.lineTo(px,py);ctx.setLineDash([2,5]);
        ctx.lineWidth=2;ctx.strokeStyle='#718897';ctx.stroke();ctx.setLineDash([]);
      }
    }
    ctx.beginPath();ctx.arc(endX,endY,4.5*size,0,2*Math.PI);ctx.fillStyle='white';ctx.fill();ctx.strokeStyle='#2768b6';ctx.lineWidth=2*size;ctx.stroke();ctx.restore();
    return [endX,endY];
  }
  function drawVehicle(ctx,x,y,yaw,size){
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.fillStyle='rgba(46,121,221,.16)';ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();
    ctx.rotate(yaw);ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(8.7,9);ctx.lineTo(0,5.3);ctx.lineTo(-8.7,9);ctx.closePath();
    ctx.lineWidth=3;ctx.strokeStyle='white';ctx.stroke();ctx.fillStyle='#287ae0';ctx.fill();ctx.restore();
  }
  function labelLayout(ctx,v,project,keepInside=false,occupied=[]){
    function reserve(x,y,w,h){
      const box=[x-w/2,y-h/2,x+w/2,y+h/2];
      if(keepInside&&(box[0]<1||box[1]<1||box[2]>v.w-1||box[3]>v.h-1))return false;
      if(occupied.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))return false;
      occupied.push(box);return true;
    }
    function onScreen(x,y,pad=4){return x>pad&&x<v.w-pad&&y>pad&&y<v.h-pad;}
    function text(label,x,y,color,font,angle=0){
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=font;
      ctx.strokeStyle='rgba(255,255,251,.9)';ctx.lineWidth=3;ctx.strokeText(label,0,0);ctx.fillStyle=color;ctx.fillText(label,0,0);ctx.restore();
    }
    function drawStreetNames(roads){
      if(v.k>.28){
        const used=new Map();
        const sorted=roads.filter(q=>(q.r.n||q.r.en)&&q.r.l>=0&&q.length*v.k>42).sort((a,b)=>b.rank-a.rank||b.length-a.length);
        for(const q of sorted){
          const label=q.r.n||q.r.en,[x,y]=project(q.x,q.z);
          if(!onScreen(x,y,16)||(!q.rank&&v.k<.9)||used.get(label)?.some(p=>Math.hypot(x-p[0],y-p[1])<300))continue;
          const size=q.rank>1?11:10,font='500 '+size+'px sans-serif';ctx.font=font;
          let a=q.angle;if(a>Math.PI/2)a-=Math.PI;if(a<-Math.PI/2)a+=Math.PI;
          const wide=ctx.measureText(label).width+6;
          if(wide>q.length*v.k*.96||!reserve(x,y,Math.abs(Math.cos(a))*wide+Math.abs(Math.sin(a))*size+6,Math.abs(Math.sin(a))*wide+Math.abs(Math.cos(a))*size+6))continue;
          text(label,x,y,q.rank>1?'#806845':'#778184',font,a);
          if(!used.has(label))used.set(label,[]);used.get(label).push([x,y]);
        }
      }
    }
    return {onScreen,reserve,text,drawStreetNames};
  }
  function create(map,sim,atlas=HKCartography.create(map,sim)){
    const bounds=map.bounds;
    const searchable=atlas.entries.map(p=>({p,fields:[p.name,p.en,p.alias].filter(Boolean).map(fold)}));
    const drivingView={w:0,h:0,dpr:1,x:0,z:0,k:0};
    let teardown=null,lastCar=null;
    function close(){if(teardown){teardown();teardown=null;}}
    function open(parent,actions){
      close();
      const picking=Boolean(actions.pickStand);
      const savedMinute=actions.savedMinute??null;
      let startMinutes=savedMinute===null?HKDayCycle.defaultStart:null;
      const v=picking?{...drivingView,k:0}:drivingView;
      const basePins=atlas.pins.filter(p=>!picking||p.kind==='taxi').sort((a,b)=>b.priority-a.priority);
      const searchRows=picking?searchable.filter(row=>row.p.kind==='taxi'):searchable;
      const root=$el('div','dm');
      root.innerHTML='<div class="dm-surface"><canvas class="dm-canvas" tabindex="0" aria-label="街區地圖，可用方向鍵平移，加減鍵縮放"></canvas><div class="dm-pins"></div></div>'+
        '<div class="dm-find"><div class="dm-search"><span class="dm-brand" aria-hidden="true">'+icon('map')+'</span><input type="text" role="combobox" aria-label="搜尋地點或街道" aria-autocomplete="list" aria-expanded="false" aria-controls="dm-results" placeholder="搜尋地點或街道" autocomplete="off" spellcheck="false"><button class="dm-search-action" type="button" aria-label="搜尋">'+icon('search')+'</button></div>'+
        '<div id="dm-results" class="dm-results" role="listbox" aria-label="搜尋結果" hidden></div><div class="dm-filters" aria-label="地點類別"></div></div>'+
        '<div class="dm-card" hidden></div><div class="dm-tools"></div>'+
        '<div class="dm-caption"><b>港路地圖</b><span class="dm-scale"></span></div><span class="dm-credit">© OpenStreetMap · 香港地政總署</span>';
      parent.append(root);
      const get=sel=>root.querySelector(sel),canvas=get('canvas'),ctx=canvas.getContext('2d'),pinsEl=get('.dm-pins'),find=get('.dm-find'),input=get('input'),results=get('.dm-results'),card=get('.dm-card'),filters=get('.dm-filters'),tools=get('.dm-tools'),scale=get('.dm-scale');
      const controller=new AbortController(),signal=controller.signal;
      const on=(target,event,fn,options={})=>target.addEventListener(event,fn,{...options,signal});
      if(picking){
        root.classList.add('dm-pick');
        const title=$el('h2','dm-pick-title','選擇出發的士站');
        find.prepend(title);filters.hidden=true;
        input.placeholder='搜尋站名或街道';input.setAttribute('aria-label','搜尋出發的士站');
        get('.dm-brand').innerHTML=icon('taxi');
      }
      const buttons=new Map(),pinNodes=new Map(),pointers=new Map();
      let selection=null,destination=null,preview=null,category='',matches=[],index=-1,frame=0;
      const project=(x,z)=>[(x-v.x)*v.k+v.w/2,(z-v.z)*v.k+v.h/2];
      const minZoom=()=>Math.min(.25,(v.w-30)/(bounds[2]-bounds[0]),(v.h-50)/(bounds[3]-bounds[1]));
      function constrain(){v.x=clamp(v.x,bounds[0],bounds[2]);v.z=clamp(v.z,bounds[1],bounds[3]);}
      function refresh(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
      function zoom(scaleFactor,px=v.w/2,py=v.h/2,toX=px,toY=py){
        const k=clamp(v.k*scaleFactor,minZoom(),4.8);
        v.x+=(px-v.w/2)/v.k-(toX-v.w/2)/k;v.z+=(py-v.h/2)/v.k-(toY-v.h/2)/k;v.k=k;constrain();refresh();
      }
      function relocate(first=false){
        v.k=Math.max(v.k||.7,first?(v.w<600?.62:.78):.77);
        v.x=sim.state.x;v.z=sim.state.z;
        if(first){v.x+=(v.w<600?v.w*.17:v.w*.20)/v.k;v.z-=v.h*.23/v.k;}
        constrain();refresh();
      }
      function fit(){
        if(picking&&basePins.length){
          const xs=basePins.map(p=>p.x),zs=basePins.map(p=>p.z);
          const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);
          const top=110,bottom=48,side=v.w<700?33:70;
          v.k=clamp(Math.min((v.w-2*side)/Math.max(1,x1-x0),(v.h-top-bottom)/Math.max(1,z1-z0)),minZoom(),2);
          v.x=(x0+x1)/2;v.z=(z0+z1)/2+(bottom-top)/(2*v.k);refresh();return;
        }
        v.k=minZoom();v.x=(bounds[0]+bounds[2])/2;v.z=(bounds[1]+bounds[3])/2;refresh();
      }
      function resize(){
        v.w=root.clientWidth;v.h=root.clientHeight;v.dpr=Math.min(window.devicePixelRatio||1,2);
        if(!v.w||!v.h)return;
        canvas.width=Math.round(v.w*v.dpr);canvas.height=Math.round(v.h*v.dpr);
        if(picking&&!v.k)fit();
        else if(!picking&&(!v.k||!lastCar||Math.hypot(sim.state.x-lastCar.x,sim.state.z-lastCar.z)>110)){v.k=0;relocate(true);}
        else v.k=clamp(v.k,minZoom(),4.8);
        if(!picking)lastCar={x:sim.state.x,z:sim.state.z};refresh();
      }
      function button(label,iconId,fn,cls=''){
        const b=$el('button',cls);b.type='button';b.title=label;b.setAttribute('aria-label',label);b.innerHTML=icon(iconId);on(b,'click',fn);return b;
      }
      function hideResults(){results.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');index=-1;}
      function clearSelection(){selection=destination=preview=null;card.hidden=true;card.replaceChildren();refresh();}
      function streetLocation(p){
        if(!p.parts)return p;
        const best=p.parts.reduce((a,b)=>Math.hypot(b.x-v.x,b.z-v.z)<Math.hypot(a.x-v.x,a.z-v.z)?b:a);
        return {...p,x:best.x,z:best.z};
      }
      function focusPoint(p){
        v.k=Math.max(v.k,p.kind==='district'?.7:1.15);
        const offsetX=v.w>=700?Math.min(145,v.w*.12):0;
        v.x=p.x-offsetX/v.k;v.z=p.z+(v.w<700?v.h*.10/v.k:0);constrain();refresh();
      }
      function select(raw,recenter=true){
        const p=streetLocation(raw);hideResults();input.blur();clearSelection();
        if(p.kind==='district'){focusPoint(p);canvas.focus({preventScroll:true});return;}
        selection=p;destination=p.destination||sim.mapPoint(p.x,p.z,p.name,p.en,p.street);
        preview=!picking&&destination&&sim.previewRoute(destination);
        if(recenter)focusPoint(p);
        card.hidden=false;
        const meta=$el('div','dm-meta'),type=$el('span','',cats()[p.kind].name);meta.append(categorySymbol(p),type);
        const dismiss=button('關閉地點資料','close',()=>{clearSelection();canvas.focus();},'dm-dismiss');
        const title=$el('h2','',p.name),sub=$el('div','dm-en',p.en&&p.en!==p.name?p.en:'');
        const row=$el('div','dm-actions');
        if(picking){
          const shifts=$el('fieldset','dm-shifts'),legend=$el('legend');shifts.append(legend);
          const options=HKDayCycle.shifts.map(s=>({value:s.minutes,label:s.label+' '+HKDayCycle.format(s.minutes)}));
          if(savedMinute!==null){
            options.unshift({value:null,label:'繼續 '+HKDayCycle.format(savedMinute%1440)});
            shifts.classList.add('resuming');
          }
          function showDeparture(){
            const next=HKWallet.departure(savedMinute,startMinutes),fee=HKWallet.feeBetween(savedMinute,next);
            legend.textContent=fee?'出車時間 · 跨過早上六時，扣日租 '+HKWallet.format(fee):'出車時間';
          }
          showDeparture();
          for(const shift of options){
            const label=$el('label'),radio=$el('input');
            radio.type='radio';radio.name='shift';radio.checked=shift.value===startMinutes;
            radio.onchange=()=>{if(radio.checked){startMinutes=shift.value;showDeparture();}};
            label.append(radio,$el('span','',shift.label));shifts.append(label);
          }
          const confirm=button('從這個的士站出發','flag',()=>actions.pickStand(destination,startMinutes),'dm-nav');
          confirm.append('從這個的士站出發');row.append(confirm);
          const address=$el('p','dm-distance',destination.alias);
          card.append(meta,dismiss,title,sub,address,shifts,row);confirm.focus({preventScroll:true});refresh();return;
        }
        const length=preview?.points.reduce((a,pt,i,path)=>a+(i?Math.hypot(pt[0]-path[i-1][0],pt[1]-path[i-1][1]):0),0);
        const stat=$el('div','dm-distance',preview?'駕駛路程　'+metric(length):destination?'目前位置未有可達路線':'附近沒有可供導航的道路');
        if(preview&&length>2){
          const overview=button('查看全程','fit',()=>{
            const xs=preview.points.map(pt=>pt[0]),zs=preview.points.map(pt=>pt[1]);
            const x0=Math.min(...xs,p.x),x1=Math.max(...xs,p.x),z0=Math.min(...zs,p.z),z1=Math.max(...zs,p.z);
            const padLeft=v.w>=700?100:32,padRight=55,padTop=130,padBottom=v.w<700?Math.min(230,v.h*.34):80;
            v.k=clamp(Math.min((v.w-padLeft-padRight)/Math.max(4,x1-x0),(v.h-padTop-padBottom)/Math.max(4,z1-z0)),minZoom(),3.3);
            v.x=(x0+x1)/2+(padRight-padLeft)/(2*v.k);v.z=(z0+z1)/2+(padBottom-padTop)/(2*v.k);constrain();refresh();
          },'dm-route-fit');overview.append('查看全程');stat.append(overview);
        }
        const nav=button('導航到此','route',()=>{if(!actions.navigate(destination))stat.textContent='目前位置未有可達路線';},'dm-nav');
        nav.append('導航到此');nav.disabled=!preview||actions.hired;row.append(nav);
        if(p.kind==='taxi'){
          const depart=button('從這裏出發','flag',()=>actions.departStand(p.destination),'dm-depart');
          depart.append('從這裏出發');depart.disabled=actions.hired;row.append(depart);
        }
        if(actions.hired)stat.textContent='載客中 · 請先送乘客到目的地';
        card.append(meta,dismiss,title,sub,stat,row);refresh();
      }
      function search(){
        results.replaceChildren();const q=fold(input.value);index=-1;input.removeAttribute('aria-activedescendant');
        const searchAction=get('.dm-search-action');searchAction.innerHTML=icon(q?'close':'search');searchAction.setAttribute('aria-label',q?'清除搜尋':'搜尋');
        if(!q&&!picking){hideResults();return;}
        const rows=[];
        for(const {p,fields} of searchRows){
          let score=0;for(const f of fields){const at=f.indexOf(q);if(at>=0)score=Math.max(score,at===0?(q===f?100:75):48);}
          if(score)rows.push({p,score:score+(p.priority||0)*.12+(p.kind==='district'?5:0)});
        }
        matches=rows.sort((a,b)=>b.score-a.score||a.p.name.length-b.p.name.length).slice(0,picking?rows.length:6).map(r=>r.p);
        for(const [i,p] of matches.entries()){
          const item=$el('div','dm-result');item.id='dm-result-'+i;item.setAttribute('role','option');item.setAttribute('aria-selected','false');
          const desc=$el('span','dm-result-text');desc.append($el('b','',p.name),$el('small','',p.en&&p.en!==p.name?p.en:cats()[p.kind].name));
          item.append(categorySymbol(p),desc);on(item,'pointerdown',e=>e.preventDefault());on(item,'click',()=>choose(p));results.append(item);
        }
        if(!matches.length)results.append($el('p','dm-empty','找不到相符地點'));
        results.hidden=false;input.setAttribute('aria-expanded','true');
      }
      function choose(p){input.value=p.name;setCategory('');select(p);get('.dm-search-action').innerHTML=icon('close');if(!picking)canvas.focus({preventScroll:true});}
      function setCategory(key){
        category=key;for(const [name,b] of buttons)b.setAttribute('aria-pressed',String(category===name));refresh();
      }
      on(input,'input',search);on(input,'focus',search);
      on(input,'keydown',e=>{
        if(e.isComposing||e.keyCode===229)return;
        if(e.key==='Escape'&&!results.hidden){e.preventDefault();hideResults();canvas.focus();return;}
        if(results.hidden||!matches.length)return;
        if(e.key==='Enter'){e.preventDefault();choose(matches[Math.max(0,index)]);return;}
        if(e.key==='ArrowDown'||e.key==='ArrowUp'){
          e.preventDefault();index=index<0?(e.key==='ArrowDown'?0:matches.length-1):(index+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;
          Array.from(results.children).forEach((el,i)=>el.setAttribute('aria-selected',i===index?'true':'false'));
          input.setAttribute('aria-activedescendant',results.children[index].id);
          results.children[index].scrollIntoView({block:'nearest'});
        }
      });
      on(get('.dm-search-action'),'click',()=>{input.value='';input.focus();search();});
      on(root,'focusout',e=>{if(!find.contains(e.relatedTarget))hideResults();});
      if(!picking)for(const [key,label] of [['taxi','的士站'],['sight','地標'],['shop','購物'],['transit','交通'],['park','公園']]){
        const cat=cats()[key],b=button(label,cat.icon,()=>{input.value='';search();clearSelection();setCategory(category===key?'':key);},'dm-chip');
        b.style.setProperty('--cat',cat.color);b.setAttribute('aria-pressed','false');b.append(label);filters.append(b);buttons.set(key,b);
      }
      const stack=$el('div','dm-stack');
      const plus=button('放大','plus',()=>zoom(1.55)),minus=button('縮小','minus',()=>zoom(1/1.55));stack.append(plus,minus);
      tools.append(button('顯示全區','fit',fit,'dm-tool'));
      if(!picking)tools.append(button('我的位置','locate',()=>relocate(),'dm-tool location'));
      tools.append(stack);
      function render(){
        const roads=atlas.paint(ctx,v),{onScreen,reserve,text,drawStreetNames}=labelLayout(ctx,v,project);
        if(!picking)drawRoute(ctx,preview||sim.route,project,1,preview&&selection);
        const [carX,carY]=project(sim.state.x,sim.state.z);
        if(!picking&&onScreen(carX,carY,-20))reserve(carX,carY,34,33);
        const zoomPins=!picking&&v.k>1.48?basePins.concat(atlas.details.filter(p=>{
          const [x,y]=project(p.x,p.z);return onScreen(x,y,12)&&(!category||category===p.kind);
        }).sort((a,b)=>b.area-a.area)):basePins;
        if(v.k<.3)for(const p of atlas.districts){
          const [x,y]=project(p.x,p.z);if(onScreen(x,y,10)&&reserve(x,y,p.name.length*15+12,24))text(p.name,x,y,'#455757','650 15px sans-serif');
        }
        const streets=zoomPins.filter(p=>(!category||category===p.kind)&&p.key!==selection?.key);
        if(selection)streets.unshift(selection);
        const shown=new Set();
        for(const p of streets){
          const [x,y]=project(p.x,p.z),selected=selection?.key===p.key;
          if(!onScreen(x,y,10))continue;
          const font='600 12px -apple-system, BlinkMacSystemFont, sans-serif';ctx.font=font;
          const tw=Math.ceil(ctx.measureText(p.name).width),space=v.k<.23?18:v.k<.45?9:4;
          const named=x+tw+24<v.w&&reserve(x+(tw+5)/2,y,tw+30+space,25+space);
          if(!picking&&!selected&&!named&&(!p.priority||v.k<.3))continue;
          if(!selected&&!named&&!reserve(x,y,21+space,21+space)&&!picking)continue;
          let b=pinNodes.get(p.key);
          if(!b){
            b=$el('button','dm-pin');b.type='button';b.dataset.id=p.key;b.title=p.name;b.setAttribute('aria-label',p.name);
            b.append(categorySymbol(p),$el('span','dm-pin-name',p.name));pinsEl.append(b);pinNodes.set(p.key,b);
            on(b,'click',()=>{hideResults();select(p,picking);});
          }
          b.hidden=false;b.classList.toggle('is-selected',selected);b.lastChild.hidden=!named&&!selected;
          b.style.left=x+'px';b.style.top=y+'px';shown.add(p.key);
        }
        for(const [id,b] of pinNodes)if(!shown.has(id))b.hidden=true;
        if(v.k>=.3)for(const p of atlas.districts){
          const [x,y]=project(p.x,p.z),small=v.k<.27;
          if(!onScreen(x,y,12)||!reserve(x,y,p.name.length*(small?14:19)+10,small?25:38))continue;
          text(p.name,x,y,small?'#465a59':'#657471',(small?'650 14px':'650 19px')+' sans-serif');
          if(!small)text(p.en.toUpperCase(),x,y+18,'#6d7e7c','600 9px sans-serif');
        }
        const [seaX,seaY]=project(98,377);
        if(onScreen(seaX,seaY,8)&&reserve(seaX,seaY,129,35)){
          text('維 多 利 亞 港',seaX,seaY,'#42829b','600 16px sans-serif');
          text('VICTORIA HARBOUR',seaX,seaY+16,'#51849a','600 9px sans-serif');
        }
        drawStreetNames(roads);
        if(!picking&&onScreen(carX,carY,-24))drawVehicle(ctx,carX,carY,sim.state.yaw,1);
        const distances=[10,20,50,100,200,500,1000,2000],unit=distances.filter(m=>m*v.k<=88).at(-1)||10;
        scale.style.width=unit*v.k+'px';scale.textContent=metric(unit);
        minus.disabled=v.k<=minZoom()+.001;plus.disabled=v.k>=4.799;
      }
      const surface=get('.dm-surface');let start=null,dragged=false;
      const local=e=>{const box=canvas.getBoundingClientRect();return [e.clientX-box.left,e.clientY-box.top];};
      on(surface,'wheel',e=>{
        e.preventDefault();hideResults();const [x,y]=local(e);
        zoom(Math.exp(clamp(-e.deltaY*(e.deltaMode?16:1)*.0022,-1,1)),x,y);
      },{passive:false});
      on(surface,'dblclick',e=>{e.preventDefault();zoom(e.shiftKey?1/1.7:1.7,...local(e));});
      on(surface,'pointerdown',e=>{
        if(e.button!==0)return;
        hideResults();const target=e.target.closest('.dm-pin')||canvas;
        if(target===canvas)canvas.focus({preventScroll:true});
        if(pointers.size)dragged=true;else{dragged=false;start=local(e);}
        target.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId,local(e));canvas.classList.add('dragging');
      });
      on(surface,'pointermove',e=>{
        if(!pointers.has(e.pointerId))return;
        const prev=pointers.get(e.pointerId),next=local(e);
        if(start&&Math.hypot(next[0]-start[0],next[1]-start[1])>4)dragged=true;
        const peer=[...pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];
        if(peer){
          const oldDist=Math.hypot(prev[0]-peer[0],prev[1]-peer[1]),newDist=Math.hypot(next[0]-peer[0],next[1]-peer[1]);
          if(oldDist>1&&newDist>1)zoom(newDist/oldDist,(prev[0]+peer[0])/2,(prev[1]+peer[1])/2,(next[0]+peer[0])/2,(next[1]+peer[1])/2);
        }else{v.x-=(next[0]-prev[0])/v.k;v.z-=(next[1]-prev[1])/v.k;constrain();refresh();}
        pointers.set(e.pointerId,next);
      });
      const end=e=>{pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');};
      for(const event of ['pointerup','pointercancel','lostpointercapture'])on(surface,event,end);
      on(surface,'click',e=>{if(dragged&&e.detail){e.preventDefault();e.stopPropagation();}},{capture:true});
      on(root,'keydown',e=>{
        if(e.defaultPrevented||e.target instanceof HTMLInputElement||e.ctrlKey||e.metaKey||e.altKey)return;
        const delta=85/v.k;
        switch(e.key){
          case '+':case '=':zoom(1.5);break;case '-':zoom(1/1.5);break;
          case 'ArrowLeft':v.x-=delta;break;case 'ArrowRight':v.x+=delta;break;
          case 'ArrowUp':v.z-=delta;break;case 'ArrowDown':v.z+=delta;break;
          case 'Home':if(picking)fit();else relocate();break;default:return;
        }
        e.preventDefault();constrain();refresh();
      });
      resize();const observer=new ResizeObserver(resize);observer.observe(root);
      canvas.focus({preventScroll:true});
      teardown=()=>{controller.abort();observer.disconnect();cancelAnimationFrame(frame);root.remove();};
    }
    return {open,close};
  }
  function createMini(canvas,pinsEl,atlas,sim){
    const ctx=canvas.getContext('2d'),buffer=document.createElement('canvas'),base=buffer.getContext('2d');
    const controls=[...canvas.parentElement.querySelectorAll('.north,.miniCredit,.maplabel')];
    const pins=atlas.pins.slice().sort((a,b)=>Number(b.kind==='taxi')-Number(a.kind==='taxi')||b.priority-a.priority);
    const nodes=new Map(),pad=32;
    let cached=null,lastFrame=null,roads=[],controlBoxes=[];
    return function draw(){
      const w=canvas.clientWidth,h=canvas.clientHeight;
      if(!w||!h)return;
      const {x,z,yaw}=sim.state,k=w/308,dpr=Math.min(window.devicePixelRatio||1,2);
      const resized=!cached||cached.w!==w||cached.h!==h||cached.dpr!==dpr;
      const route=sim.route?.arrived?null:sim.route;
      if(!resized&&lastFrame.x===x&&lastFrame.z===z&&lastFrame.yaw===yaw&&lastFrame.route===route)return;
      if(resized){
        canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
        buffer.width=Math.ceil((w+2*pad)*dpr);buffer.height=Math.ceil((h+2*pad)*dpr);
        controlBoxes=controls.map(el=>[el.offsetLeft-1,el.offsetTop-1,el.offsetLeft+el.offsetWidth+1,el.offsetTop+el.offsetHeight+1]);
      }
      // Repaint a small surrounding area only when the vehicle approaches its edge.
      if(resized||Math.abs(x-cached.x)*k>=pad-1||Math.abs(z-cached.z)*k>=pad-1){
        roads=atlas.paint(base,{x,z,k,dpr,w:w+2*pad,h:h+2*pad});
        cached={x,z,w,h,dpr};
      }
      const sx=(pad+(x-cached.x)*k)*dpr,sy=(pad+(z-cached.z)*k)*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.drawImage(buffer,sx,sy,w*dpr,h*dpr,0,0,w,h);
      const project=(px,pz)=>[(px-x)*k+w/2,(pz-z)*k+h/2];
      const occupied=[...controlBoxes,[w/2-13,h/2-13,w/2+13,h/2+13]];
      const end=drawRoute(ctx,route,project,.72);
      if(end)occupied.push([end[0]-6,end[1]-6,end[0]+6,end[1]+6]);
      const {reserve,onScreen,drawStreetNames}=labelLayout(ctx,{w,h,k},project,true,occupied);
      const visible=new Set();
      for(const p of pins){
        const [px,py]=project(p.x,p.z);
        if(!onScreen(px,py,9)||!reserve(px,py,18,18))continue;
        let node=nodes.get(p.key);
        if(!node){node=categorySymbol(p);nodes.set(p.key,node);pinsEl.append(node);}
        node.style.left=px+'px';node.style.top=py+'px';visible.add(p.key);
      }
      for(const [id,node] of nodes)if(!visible.has(id)){node.remove();nodes.delete(id);}
      drawStreetNames(roads);
      drawVehicle(ctx,w/2,h/2,yaw,.74);
      lastFrame={x,z,yaw,route};
    };
  }
  return {create,createMini};
})();

// All cartography uses the same local metre grid as the vehicle and routing graph.
window.HKCartography=(()=>{
  const districts=[
    ...(window.HKCheungShaWanGuide?.districts||[]),...(window.HKShekKipMeiGuide?.districts||[]),...(window.HKShamShuiPoGuide?.districts||[]),...(window.HKKaiTakGuide?.districts||[]),...(window.HKKowloonTongGuide?.districts||[]), ...(window.HKKowloonCityGuide?.districts||[]), ...(window.HKHoManTinGuide?.districts||[]), ...(window.HKHungGuide?.districts||[]), ...(window.HKToKwaWanGuide?.districts||[]),
    ['尖沙咀','Tsim Sha Tsui',58,-290,'tst'],['尖沙咀東','Tsim Sha Tsui East',694,-348,'尖東 ts teast'],
    ['佐敦','Jordan',-210,-1220],['油麻地','Yau Ma Tei',-180,-1870,'ymt'],['旺角','Mong Kok',-170,-2470,'mk'],
    ['太子','Prince Edward',-214,-3180],['大角咀','Tai Kok Tsui',-915,-2850,'tkt'],
    ['西九文化區','West Kowloon Cultural District',-1250,-600,'西九龍文化區 wkcd'],
    ['西九龍','West Kowloon',-900,-1175],['京士柏',"King’s Park",530,-1670]
  ].map(([name,en,x,z,alias])=>({key:'district:'+en,name,en,x,z,alias,kind:'district'}));
  const categories={
    taxi:{name:'的士站',color:'#aa7132',icon:'taxi'},sight:{name:'文化地標',color:'#8162ac',icon:'museum'},shop:{name:'購物',color:'#ba7045',icon:'bag'},
    transit:{name:'交通',color:'#477aa8',icon:'train'},park:{name:'公園',color:'#39865c',icon:'tree'},
    street:{name:'道路',color:'#77838b',icon:'road'},district:{name:'地區',color:'#557478',icon:'map'},
    hotel:{name:'酒店',color:'#9e6790',icon:'bed'},building:{name:'建築',color:'#77828c',icon:'building'},health:{name:'醫療',color:'#be6972',icon:'cross'}
  };
  const namedKinds={hotel:'salisbury hh-kerry hh-grand hh-met-hotel',shop:'ssp-golden ssp-arcade ssp-dragon ssp-apliu ssp-jade ssp-pawn ssp-cafe ssp-food kai-airside kt-festival kt-franki kc-plaza kc-market hmt-plaza hmt-oiman tkw-market tkw-grand hh-ship hh-metropolis harbour langham ladies sneakers electronics computer sino moko goldfish flower nightmarket oc1 oc2 oc3 metroharbour elements',
    transit:'tkw-ferry ferry jordan ymt prince olympic westk-station kowloon-station austin-station mkbridge',park:'csw-garden csw-playground skm-park ssp-park kai-runway kai-garden kai-swt kt-park kt-hill kc-park kc-carpenter hmt-park hmt-sheung-park hmt-hill-park tkw-hoisham tkw-recreation tkw-artpark park artpark hh-waterfront hh-taiwan',street:'kt-broadcast kc-food kc-thai hh-baker hh-sungkit mody nathan gascoigne temple',health:'qeh',
    building:'csw-museum csw-plaza csw-so-uk csw-lei-estate csw-hoi-lai csw-pacifica csw-liberte csw-banyan csw-aqua csw-one csw-sparkle skm-jccac skm-inno skm-oasis skm-sports skm-club skm-chak skm-heights skm-dynasty skm-namshan skm-paktin ssp-police ssp-court ssp-meiho ssp-clinic ssp-garden ssp-tinhau ssp-samtai ssp-kwantai ssp-market kai-revenue kai-trade kai-arena kai-stadium kai-cruise kt-cityu kt-hkbu kt-hospital kt-temple kt-church kt-clp kt-shang kt-education kt-harilela kt-ideal kt-media kc-school hmt-hkmu hmt-jubilee hmt-health hmt-twc hmt-twc-mk hmt-gov hmt-housing hmt-sports tkw-gov tkw-jubilant tkw-sky hh-gov hh-polyu hh-college hh-world hh-intl hh-universal longbeach silversea'};
  const priority='csw-museum csw-plaza csw-so-uk csw-hoi-lai skm-jccac skm-park skm-inno skm-oasis ssp-dragon ssp-golden ssp-arcade ssp-apliu kai-airside kai-stadium kai-runway kt-festival kt-cityu kt-hkbu kt-hospital kt-park kc-park kc-temple kc-market kc-plaza kc-school hmt-hkmu hmt-twc tkw-market tkw-cattle hh-coliseum hh-kwunyum hh-ship ferry harbour park salisbury science palace mplus westk-station olympic langham moko qeh tinhau theatre elements'.split(' ');
  const aliases={...window.HKCheungShaWanGuide?.aliases,...window.HKShekKipMeiGuide?.aliases,...window.HKShamShuiPoGuide?.aliases,...window.HKKaiTakGuide?.aliases,...window.HKKowloonTongGuide?.aliases,'kc-park':'九龙寨城公园 九龍城寨 衙門', 'kc-temple':'侯王古庙 侯王庙', 'kc-market':'九龙城街市 衙前圍道市政大廈 熟食中心', 'kc-plaza':'九龙城广场 KCP', 'kc-school':'香港兆基创意书院 HKICC', 'kc-thai':'小泰國 小泰国 泰國店', 'kc-food':'小潮州 食城', 'hmt-hkmu':'香港都会大学 都大 香港公開大學 HKMU OUHK', 'hmt-jubilee':'香港都会大学 银禧 JCC', 'hmt-health':'香港都会大学 健康护理 IOH', 'hmt-twc':'东华学院 京士柏 TWC', 'hmt-twc-mk':'东华学院 旺角 TWC',palace:'西九故宮 香港故宮',ferry:'尖沙咀天星碼頭 天星小輪',science:'科學館',park:'九龍公園 kowloon park',
    'westk-station':'高鐵 西九龍高鐵站 高铁站 hsr', 'union-square':'ICC Union Square', 'mplus':'mplus m plus', 'austin-station':'Austin MTR'};
  const highlightedNames=new Map([
    ['香港文化中心','sight'],['香港太空館','sight'],['香港歷史博物館','sight'],['天主教玫瑰堂','sight'],
    ['1881 heritage','sight'],['海運大廈','shop'],['星光行','shop'],['重慶大廈a座','shop'],
    ['訊號山花園','park'],['尖沙咀海濱花園','park'],['奧海城海濱公園','park'],['紅磡站','transit']
  ]);
  const featured={250931:['鐘樓','clock tower 尖沙咀鐘樓','sight'],253039:['九龍清真寺','','sight'],
    159627:['K11 MUSEA','K11 人文購物藝術館','shop'],211487:['K11 Art Mall','K11 購物藝術館','shop']};
  function geometry(p,holes=[],closed=false){
    const path=new Path2D();
    function add(r){path.moveTo(...r[0]);for(let i=1;i<r.length;i++)path.lineTo(...r[i]);if(closed)path.closePath();}
    add(p);holes.forEach(add);return path;
  }
  function middle(p){
    let area=0,cx=0,cz=0;
    for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],n=a[0]*b[1]-b[0]*a[1];area+=n;cx+=(a[0]+b[0])*n;cz+=(a[1]+b[1])*n;}
    return Math.abs(area)>.01?[cx/(3*area),cz/(3*area),Math.abs(area/2)]:[...p[0],0];
  }
  function extent(p){
    let x0=Infinity,z0=Infinity,x1=-Infinity,z1=-Infinity;
    for(const [x,z] of p){x0=Math.min(x0,x);z0=Math.min(z0,z);x1=Math.max(x1,x);z1=Math.max(z1,z);}return [x0,z0,x1,z1];
  }
  const visible=(a,v)=>a[2]>=v[0]&&a[0]<=v[2]&&a[3]>=v[1]&&a[1]<=v[3];
  function roadRank(cls){
    if(/motorway|trunk/.test(cls))return 3;
    if(/primary|secondary/.test(cls))return 2;
    return cls?.startsWith('tertiary')?1:0;
  }
  function kindFor(id){return Object.keys(namedKinds).find(k=>namedKinds[k].split(' ').includes(id))||'sight';}
  function create(map,sim){
    const entries=sim.places.map(p=>({...p,key:p.id,kind:kindFor(p.id),destination:p,alias:aliases[p.id],priority:priority.includes(p.id)?100-priority.indexOf(p.id):50}));
    for(const p of sim.taxiStands||[])entries.push({...p,key:p.id,kind:'taxi',destination:p,alias:p.alias+' 出租车站 的士站 taxi rank',priority:34});
    const pins=entries.slice(),searchable=[...entries,...districts],buildings=new Map(),names=new Map(),roadNames=new Map();
    const pinByName=new Map(entries.flatMap(p=>[p.name,p.en].filter(Boolean).map(n=>[n.normalize('NFKC').toLowerCase(),p])));
    const pinAreas=new Map(),groups=new Map();
    function collect(ring){
      const [x,z,area]=middle(ring.p);const n=ring.n||'',en=ring.en||'',f=featured[ring.id];
      const sourceName=n.normalize('NFKC').toLowerCase(),tag=pinByName.get(sourceName)||pinByName.get(en.toLowerCase());
      if(tag&&Math.hypot(tag.destination.x-x,tag.destination.z-z)<300){
        if(area>(pinAreas.get(tag)||0)){tag.x=x;tag.z=z;pinAreas.set(tag,area);}return;
      }
      if(!n&&!en)return;
      const key=sourceName||en.toLowerCase();
      if((names.get(key)?.area||0)>=area)return;
      const knownKind=highlightedNames.get(key);
      const kind=f?.[2]||knownKind||(/公園|花園|休憩|park|garden/i.test(n+' '+en)?'park':/商場|商店|廣場|shopping|mall/i.test(n+' '+en)?'shop':/教堂|鐘樓|博物館|church|museum|temple|theatre/i.test(n+' '+en)?'sight':'building');
      names.set(key,{key:'building:'+key,name:key==='重慶大廈a座'?'重慶大廈':f?.[0]||n||en,en,alias:[n,f?.[1]].filter(Boolean).join(' '),x,z,area,kind,priority:f?82:knownKind?44:0});
    }
    for(const b of map.buildings){
      if(b.foundation||!b.p?.length)continue;
      collect(b);
      // Batch by spatial cell to keep local pans and street-level zoom inexpensive.
      const id=b.id+'|'+b.p[0].join(',')+'|'+b.p.length;
      if(buildings.has(id))continue;buildings.set(id,true);
      const box=extent(b.p),key=Math.floor((box[0]+box[2])/384)+','+Math.floor((box[1]+box[3])/384);
      if(!groups.has(key))groups.set(key,{box:[Infinity,Infinity,-Infinity,-Infinity],path:new Path2D()});
      const g=groups.get(key);g.path.addPath(geometry(b.p,b.holes,true));
      for(let j=0;j<4;j++)g.box[j]=(j<2?Math.min:Math.max)(g.box[j],box[j]);
    }
    for(const p of map.parks)if(p.n||p.en)collect(p);
    for(const p of names.values()){searchable.push(p);if(p.priority)pins.push(p);}
    const roadRows=map.roads.map(r=>{
      const name=r.n||r.en,rank=roadRank(r.cls),p=r.p,box=extent(p);
      let length=0;const pieces=[];
      for(let i=1;i<p.length;i++){const dx=p[i][0]-p[i-1][0],dz=p[i][1]-p[i-1][1];const len=Math.hypot(dx,dz);length+=len;pieces.push(len);}
      let at=length/2,i=0;while(i<pieces.length-1&&at>pieces[i])at-=pieces[i++];
      const a=p[i],b=p[i+1]||a,t=at/(pieces[i]||1),x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
      const row={box,path:geometry(p),r,rank,x,z,length,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};
      if(name&&!(sim.rules.access(r)&1)){
        const street=r.en||r.n;
        if(!roadNames.has(street))roadNames.set(street,{key:'street:'+street,kind:'street',street,name,en:r.en,parts:[]});
        roadNames.get(street).parts.push(row);
      }
      return row;
    }).sort((a,b)=>a.r.l-b.r.l||a.rank-b.rank);
    searchable.push(...roadNames.values());
    const areas=(rows)=>rows.map(p=>({box:extent(p.p),path:geometry(p.p,p.holes,true),kind:p.kind}));
    const land=areas(map.land),parks=areas(map.parks),piers=areas(map.piers),plazas=areas((map.plazas||[]).filter(p=>p.p?.length));
    const details=[...names.values()].filter(p=>!p.priority&&p.area>130);
    const paths=[...map.paths,...(window.HKMongKokPlaces?.walks||[])].map(p=>({box:extent(p.p),path:geometry(p.p)}));
    const pedestrian=[...(window.HKMongKokPlaces?.bridges||[]),...(window.HKMongKokPlaces?.subways||[])].map(p=>({box:extent(p.p),path:geometry(p.p),under:'ends' in p}));
    const washes={wood:'#b0d3b0',park:'#bedfbb',garden:'#c9e4bf',pitch:'#add4ac',playground:'#c2dbb3'};
    function paint(c,v){
      const {k,w,h,x,z,dpr}=v,ox=w/2-x*k,oy=h/2-z*k,box=[-ox/k,-oy/k,(w-ox)/k,(h-oy)/k];
      c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#e9ece9';c.fillRect(0,0,w,h);
      c.setTransform(k*dpr,0,0,k*dpr,ox*dpr,oy*dpr);
      const bounds=map.bounds;c.fillStyle='#aed9e7';c.fillRect(bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]);
      c.lineJoin=c.lineCap='round';
      for(const p of land){c.strokeStyle='#a2ccd8';c.lineWidth=3/k;c.stroke(p.path);c.fillStyle='#f3f2ed';c.fill(p.path,'evenodd');}
      for(const p of piers)if(visible(p.box,box)){c.fillStyle='#e2dfd4';c.fill(p.path,'evenodd');}
      for(const p of plazas)if(visible(p.box,box)){c.fillStyle='#ede6dc';c.fill(p.path,'evenodd');}
      for(const p of parks)if(visible(p.box,box)){c.fillStyle=washes[p.kind]||'#c9dfc0';c.fill(p.path,'evenodd');}
      if(k>.19){
        c.fillStyle=k>.56?'#e2dfd7':'#e8e5df';c.strokeStyle='#d7d3c9';c.lineWidth=.48/k;
        for(const g of groups.values())if(visible(g.box,box)){c.fill(g.path);if(k>1.08)c.stroke(g.path);}
      }
      if(k>.42){
        c.strokeStyle='#f5f2e8';c.lineWidth=Math.max(.8/k,1.55);
        for(const p of paths)if(visible(p.box,box))c.stroke(p.path);
      }
      const roads=roadRows.filter(r=>visible(r.box,box)),ranks=[0,1,2,3];
      const edge=['#d8d6cd','#d7d2c7','#d6bc8f','#d6aa65'],ink=['#fffefd','#fffefa','#fff2ce','#ffd788'];
      function drawLevel(rows){
        for(const rank of ranks){
          const group=rows.filter(q=>q.rank===rank);
          for(const outline of [true,false]){
            c.strokeStyle=outline?edge[rank]:ink[rank];
            for(const {path,r} of group){
              const metres=Math.max(1.7,r.w*.82),floor=[1.55,2.5,3.15,3.9][rank];
              c.lineWidth=Math.max(metres,floor/k)+(outline?(r.l>0?2.1:1.25)/k:0);c.stroke(path);
            }
          }
        }
      }
      c.setLineDash([3/k,3/k]);c.strokeStyle='#b4aa9c';
      for(const q of roads)if(q.r.l<0){c.lineWidth=Math.max(1.2/k,q.r.w*.62);c.stroke(q.path);}
      c.setLineDash([]);drawLevel(roads.filter(q=>q.r.l===0));drawLevel(roads.filter(q=>q.r.l>0));
      if(k>.83){
        c.setLineDash([2.4/k,2.8/k]);c.lineWidth=1.25/k;
        for(const p of pedestrian)if(visible(p.box,box)){c.strokeStyle=p.under?'#9ba6a8':'#afaa98';c.stroke(p.path);}
        c.setLineDash([]);
      }
      c.setTransform(dpr,0,0,dpr,0,0);return roads;
    }
    return {entries:searchable,pins,details,districts,paint};
  }
  return {create,categories};
})();

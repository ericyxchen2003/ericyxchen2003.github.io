// Driving destinations use public ground-level approaches. Scenic pins have no pickup or drop-off action.
window.HKStonecuttersGuide=(()=>{
  const sites=[
    ['terminal','八號貨櫃碼頭','Container Terminal 8',-3650,-3080,'Container Port Road South',-4260,-3030,73,140,'八号货柜码头 CT8'],
    ['dock','昂船洲政府船塢','Government Dockyard',-3087,-2978,'Ngong Shung Road',-3000,-2950,26,52,'政府船坞 Government fleet'],
    ['diving','消防處潛水基地','Fire Services Department Diving Base',-3107,-2985,'Ngong Shung Road',-2841,-3218,22,34,'消防处潜水基地 FSD'],
    ['treatment','昂船洲污水處理廠','Stonecutters Island Sewage Treatment Works',-3276,-3260,'Ngong Shung Road',-3520,-3075,24,74,'昂船洲污水处理厂 淨化海港'],
    ['cargo','昂船洲公眾貨物裝卸區','Stonecutters Island Public Cargo Working Area',-4324,-2574,'Ngong Wan Road',-4495,-2620,26,58,'公众货物装卸区 昂运路'],
    ['control','葵涌海上交通控制站','Kwai Chung Marine Traffic Control Station',-4830,-2940,'Container Port Road South',-4872,-3021,22,28,'葵涌控制站 KCCS'],
    ['transfer','西九龍廢物轉運站','West Kowloon Refuse Transfer Station',-3125,-3439,'Ngong Shung Road',-3050,-3493,17,44,'西九龙废物转运站']
  ];
  const views=[
    ['bridge','昂船洲大橋','Stonecutters Bridge',-5302,-3295,296,520,'昂船洲大桥 青沙公路 八號幹線'],
    ['south','昂船洲海軍基地','Stonecutters Island Naval Base',-3585,-2535,20,140,'昂船洲海军基地 南岸遠景']
  ];
  return {
    places:sites.map(([key,n,en,x,z,road])=>['sci-'+key,n+'（外圍）',en+' · Public approach',114.17+x/103055,22.296-z/110741,road]),
    aliases:Object.fromEntries(sites.map(s=>['sci-'+s[0],s.at(-1)])),
    sights:views.map(([key,name,en,x,z,,,alias])=>({key:'sci-'+key,name,en,x,z,alias,kind:'sight',priority:62,scenicOnly:true,notice:key==='bridge'?'經青沙公路駛過大橋':'沿港區公路可遠望南岸'})),
    models:[...sites.map(s=>[s[1],s[2],...s.slice(6,10)]),...views.map(s=>s.slice(1,7))],
    districts:[['昂船洲','Stonecutters Island',-3920,-2860,'昂船坪 昂船洲 Ngong Shuen Chau']],
    districtAt(x,z){
      if(!HKStonecutters.contains(x,z))return null;
      return x< -5720?['青衣','TSING YI']:['昂船洲','STONECUTTERS ISLAND'];
    }
  };
})();

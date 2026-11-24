/* Transport Department urban ranks, projected into the game metre grid. */
window.HKTaxiRankRows=[
  [144,"奧海城二期","櫻桃街近奧海城第二期","Cherry Street near Olympian City Phase II",-820.7,-2391.5,316844039],
  [145,"登打士街","登打士街介乎廣華街及花園街","Dundas Street between Kwong Wa Street and Fa Yuen Street",255.6,-2184.3,102640450],
  [146,"花園街・奶路臣街","花園街介乎亞皆老街及奶路臣街","Fa Yuen Street between Argyle Street and Nelson Street",131.4,-2536.5,101183519],
  [147,"花園街・太子道西","花園街介乎運動場道及太子道西","Fa Yuen Street between Playing Field Road and Prince Edward Road West",5.3,-3195.2,1188528924],
  [148,"花園街・亞皆老街","花園街近亞皆老街","Fa Yuen Street near Argyle Street",99.0,-2654.2,101183522],
  [149,"港灣豪庭・福利街","褔利街近樂群街","Fuk Lee Street near Lok Kwan St (o/s Metro Harbour View)",-982.1,-3119.1,"w101558292"],
  [150,"維港灣・海帆道","海帆道, 大角咀（維港灣）","Hoi Fan Road, Tai Kok Tsui (Island Harbourview)",-1205.5,-2516.1,"w1189761532"],
  [152,"海景街","海景街介乎櫻桃街及富貴街","Hoi King Street between Cherry Street and Foo Kwai Street",-913.2,-2540.9,"w151226301"],
  [153,"富榮花園・海泓道","海泓道南行線（近富榮花園八座）","Hoi Wang Road S/B (near Charming Garden Block 8)",-593.6,-2067.7,255267934],
  [155,"埃華街","埃華街介乎大角咀道及大政街","Ivy St. between Tai Kok Tsui Road and Tai Ching Street",-871.8,-2812.3,"wn101558250.0"],
  [157,"朗豪坊・砵蘭街","砵蘭街介乎奶路臣街及亞皆老街","Portland Street between Nelson Street and Argyle Street",-120.4,-2512.5,"n150792162.0"],
  [158,"西洋菜南街","西洋菜南街介乎快富街及亞皆老街","Sai Yeung Choi Street South between Fife Street and Argyle Street",-20.6,-2667.3,102554241],
  [159,"山東街","山東街與通菜街及花園街交界","Shantung Street between Tung Choi Street and Fa Yuen Street",115.9,-2413.1,102640431],
  [191,"西九龍站 B2 層","香港西九龍站 B2層","B2/F of Hong Kong West Kowloon Station",-462.4,-985.2,"west-b2"],
  [194,"樂道","樂道近北京道","Lock Road near Peking Road",167.7,-89.2,152073842],
  [197,"香港童軍中心","柯士甸道香港童軍中心外","Austin Road o/s HK Scout Centre",-23.9,-780.1,454467320],
  [198,"寶靈街","寶靈街與彌敦道交界","Bowring St. J/W Nathan Rd.",149.2,-928.8,494487926],
  [199,"金馬倫道","金馬倫道近金馬倫里","Cameron Rd. near Cameron Lane",292.9,-308.8,152073810],
  [200,"廣東道・北京道","廣東道近北京道","Canton Road near Peking Road",-81.9,-56.5,152073812],
  [201,"文化道","文化道","Cultural Drive",-1142.6,-608.9,"k984424585"],
  [202,"加連威老道","加連威老道近漆咸道南","Granville Rd. near Chatham Road S.",532.7,-476.2,1215181726],
  [203,"漢口道","漢口道近海防道","Hankow Road near Haiphong Road",109.8,-154.9,100220097],
  [206,"尖沙咀中心・麼地道","麼地道介乎香格里拉酒店及尖沙咀中心","Mody Rd. between Shangrilla Hotel & TST Centre",732.9,-180.0,103020532],
  [207,"寧波街","寧波街與彌敦道交界","Ning Po St. J/W Nathan Rd.",119.6,-1166.3,149555146],
  [209,"北海街","北海街近彌敦道","Pak Hoi Street near Nathan Road",115.8,-1302.5,102640448],
  [210,"碧街","碧街介乎彌敦道及東方街","Pitt Street between Nathan Road and Tung Fong Street",101.0,-1987.1,99517936],
  [211,"天星碼頭","天星碼頭","Star Ferry Pier",-88.6,207.5,709674306],
  [212,"永星里・鴉打街","永星里介乎鴉打街及彌敦道","Wing Sing Lane between Arthur Street and Nathan Road",83.3,-1651.2,102506135],
  [213,"永星里・石壁道","永星里介乎石壁道及彌敦道","Wing Sing Lane between Cliff Road and Nathan Road",141.4,-1653.1,102506138],
  [214,"吳松街","吳松街與佐敦道交界","Woosung St. J/W Jordan Rd.",19.5,-1068.3,1454667920]
];
/* OSM one-way taxi loop off Cherry Street. */
(() => {
  const olympianTaxiWays=[[198548596,[[-787.7,-2441.3],[-789.8,-2438.8],[-790.6,-2435.9],[-790.5,-2432.5],[-789.0,-2428.2],[-786.1,-2421.6]]],[316844039,[[-786.1,-2421.6],[-783.3,-2414.8],[-781.9,-2411.1],[-782.2,-2408.7],[-783.5,-2407.1],[-785.5,-2405.9],[-796.9,-2401.4],[-824.2,-2390.9],[-827.3,-2390.5],[-829.6,-2391.2],[-831.5,-2393.3],[-833.0,-2396.3],[-835.7,-2403.1]]],[316844190,[[-835.7,-2403.1],[-838.3,-2409.9],[-839.0,-2411.4],[-840.7,-2413.5],[-844.1,-2415.7],[-847.4,-2416.4]]]];
  const map=window.HKMAP;
  for(const [id,p] of olympianTaxiWays){
    map.roads.push({id,osm:id,p,n:'奧海城二期的士通道',en:'Olympian City 2 taxi lane',l:0,cls:'service',one:1,lanes:1,w:5.8,taxiLane:true});
  }
  // B2 boarding coordinates are surveyed. The internal one-way approach and exit
  // are simplified connections to the existing southbound Lin Cheung underpass.
  const profile=[
    [-625.9,-1060.3,-3.4],[-624,-1051,-3.5],[-619,-1044,-3.8],[-611,-1040,-4.2],
    [-540,-1036,-7.4],[-521,-1033,-8.1],[-505,-1026,-8.2],[-489,-1012,-8.2],
    [-451,-969,-8.2],[-448,-960,-8.2],[-450,-952,-8.2],[-456,-946,-8.2],
    [-467,-943,-8.2],[-545,-940,-7.1],[-584,-937,-5.5],[-603,-929,-4.5],
    [-617,-916,-3.9],[-623,-904,-3.5],[-625,-891.5,-3.4]
  ];
  const road={id:'west-b2',n:'西九龍站 B2 的士通道',en:'West Kowloon Station B2 taxi lane',l:-1,w:8.6,one:1,lanes:1,cls:'service',underpass:true,covered:true,bore:true,taxiLane:true,profile,p:profile.map(([x,z])=>[x,z])};
  // Widen the passenger side of the shell alongside the official boarding point.
  road.platformWidth=(x,z,side)=>side===-1?Math.max(0,Math.min(4.2,23-Math.hypot(x+464,z+984))):0;
  map.roads.push(road);
  window.HKNorth.roads.push(road);
  // Clip the existing bore walls over the actual width of the two junctions.
  // The normal tunnel mesh omits wall panels where another lane overlaps.
  for(const r of window.HKNorth.roads.filter(r=>[784464011,784464012,784464014,'west-b2'].includes(r.id))){
    const dense=[r.profile[0]];
    for(const [i,b] of r.profile.entries()){
      if(!i)continue;
      const a=r.profile[i-1],pieces=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);
      for(let j=1;j<=pieces;j++)dense.push(a.map((v,k)=>v+(b[k]-v)*j/pieces));
    }
    r.profile=dense;
  }
  map.terrain.relief.decks.push({id:road.id,l:road.l,w:road.w,p:profile});
})();

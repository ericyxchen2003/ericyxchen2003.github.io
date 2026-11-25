// Roadside arrival points in the game's metre grid. Campus gates share the public road graph.
window.HKHoManTinGuide={
  districts:[
    ['何文田','Ho Man Tin',772,-2320,'homantin hmt'],
    ['加多利山','Kadoorie Hill',620,-3070],
    ['何文田山','Ho Man Tin Hill',670,-2005],
    ['何文田邨','Ho Man Tin Estate',1310,-2290],
    ['愛民邨','Oi Man Estate',916,-1820,'爱民邨']
  ],
  places:[
    ['hmt-hkmu','香港都會大學正校園','Hong Kong Metropolitan University Main Campus',1038,-2221.3,'Good Shepherd Street'],
    ['hmt-jubilee','香港都會大學銀禧學院','HKMU Jubilee College',867.4,-2163.2,'Chung Hau Street'],
    ['hmt-health','香港都會大學賽馬會健康護理學院','HKMU Jockey Club Institute of Healthcare',1032.1,-2372.1,'Sheung Shing Street'],
    ['hmt-twc','東華學院京士柏校舍','Tung Wah College King’s Park Campus',610.8,-1851.4,'Wylie Road'],
    ['hmt-twc-mk','東華學院旺角校舍','Tung Wah College Mong Kok Campus',294,-2435,'Shantung Street'],
    ['hmt-plaza','何文田廣場','Homantin Plaza',1189.1,-2266.6,'Sheung Foo Street'],
    ['hmt-oiman','愛民廣場','Oi Man Plaza',863.8,-1758,'Chung Hau Street'],
    ['hmt-gov','何文田政府合署','Ho Man Tin Government Offices',1065,-2086.6,'Chung Hau Street'],
    ['hmt-housing','房屋委員會總部','Housing Authority Headquarters',1172.1,-2150.3,'Fat Kwong Street'],
    ['hmt-sports','何文田體育館','Ho Man Tin Sports Centre',1038.7,-1739.9,'Hau Man Street'],
    ['hmt-park','何文田公園','Ho Man Tin Park',1106.9,-1700.1,'Chung Yee Street'],
    ['hmt-sheung-park','常盛街公園','Sheung Shing Street Park',1080.5,-2466.9,'Sheung Shing Street'],
    ['hmt-hill-park','何文田山道休憩花園','Ho Man Tin Hill Road Rest Garden',658.3,-1991.6,'Ho Man Tin Hill Road']
  ].map(([id,zh,en,x,z,street])=>[id,zh,en,114.17+x/103055,22.296-z/110741,street]),
  districtAt(x,z){
    if(x<380||x>1790||z< -3420||z> -1390)return null;
    const ring=window.HKHoManTin?.outline;
    if(!ring)return null;
    let inside=false,a=ring[ring.length-1];
    for(const b of ring){
      if((a[1]>z)!==(b[1]>z)&&x<(a[0]-b[0])*(z-b[1])/(a[1]-b[1])+b[0])inside=!inside;
      a=b;
    }
    if(!inside)return null;
    if(z< -2840&&x<780)return ['加多利山','KADOORIE HILL'];
    if(Math.hypot(x-670,z+2005)<118)return ['何文田山','HO MAN TIN HILL'];
    return ['何文田','HO MAN TIN'];
  }
};
if(window.HKTaxiRankRows)HKTaxiRankRows.push(
  [90,'治民街（愛民邨）','治民街','Chi Man Street',831.5,-1667.2,822887090,[1,6.85,1,3.18]],
  [91,'忠孝街（愛民邨）','忠孝街','Chung Hau Street',801.8,-1896.7,353796054,[4,14.35,1,4.98]]
);

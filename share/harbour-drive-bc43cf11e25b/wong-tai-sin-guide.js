// Public road approaches serve the temple grounds, station concourse and bus-only platforms.
window.HKWongTaiSinGuide=(()=>{
  const sites=[
    ['temple','嗇色園黃大仙祠','Sik Sik Yuen Wong Tai Sin Temple',2385,-5256,'Wong Tai Sin Road','黄大仙祠 啬色园 赤松 大殿'],
    ['mall-north','黃大仙中心北館','Temple Mall North',2259,-5051,'Ching Tak Street','黄大仙中心北馆 龍翔中心 龙翔中心'],
    ['mall-south','黃大仙中心南館','Temple Mall South',2475,-4996,'Ching Tak Street','黄大仙中心南馆 黃大仙中心'],
    ['station','港鐵黃大仙站','Wong Tai Sin Station',2410,-5002,'Ching Tak Street','港铁黄大仙站 MTR'],
    ['bus','黃大仙巴士總站','Wong Tai Sin Bus Terminus',2577,-5001,'Ching Tak Street','黄大仙巴士总站 正德街'],
    ['chuk-bus','竹園邨巴士總站','Chuk Yuen Estate Bus Terminus',2303,-5453,'Chuk Yuen Road','竹园邨巴士总站 竹園巴士總站'],
    ['upper','黃大仙上邨','Upper Wong Tai Sin Estate',2200,-5238,'Wong Tai Sin Road','黄大仙上邨'],
    ['lower','黃大仙下邨','Lower Wong Tai Sin Estate',2460,-4820,'Tung Tau Tsuen Road','黄大仙下邨'],
    ['north','竹園北邨','Chuk Yuen North Estate',2412,-5648,'Wing Chuk Street','竹园北邨'],
    ['south','竹園南邨','Chuk Yuen South Estate',2407,-5344,'Nga Chuk Street','竹园南邨'],
    ['tinma','天馬苑','Tin Ma Court',1680,-5263,'Kam Chuk Lane','天马苑'],
    ['fung','鳳凰新村','Fung Wong Chuen',2740,-5341,'Ming Fung Street','凤凰新村 鳳凰邨']
  ];
  const districts=[['黃大仙','Wong Tai Sin',2460,-5110,'黄大仙'],['竹園','Chuk Yuen',2310,-5485,'竹园'],['鳳凰新村','Fung Wong Chuen',2810,-5300,'凤凰新村']];
  return {places:sites.map(([k,n,en,x,z,road])=>['wts-'+k,n,en,114.17+x/103055,22.296-z/110741,road]),
    aliases:Object.fromEntries(sites.map(([k,,,,,,alias])=>['wts-'+k,alias])),districts,
    models:[['竹園邨巴士總站','Chuk Yuen Estate Bus Terminus',2318,-5475,54,56]],
    districtAt(x,z){
      if(x<1455||x>3070||z< -5760||z> -4630)return null;
      if(z< -5250&&x>2650&&z> -5530)return ['鳳凰新村','FUNG WONG CHUEN'];
      if(z< -5360&&x>1950&&x<2680)return ['竹園','CHUK YUEN'];
      if(x<2070&&(z> -5165||z< -5330)||x<2350&&z> -4985||x>2700&&z> -4910)return null;
      return ['黃大仙','WONG TAI SIN'];
    }};
})();
if(window.HKTaxiRankRows)HKTaxiRankRows.push(...[[171,"黃大仙・正德街","正德街","Ching Tak Street",2359,-4965,"lf86041176",[1,16.7,1,4.5]],[172,"竹園・竹園道","竹園道","Chuk Yuen Road",2302,-5454,"wts418306280",[1,31.9,1,4.5]],[181,"鳳凰新村・鳴鳳街","鳴鳳街","Ming Fung Street",2739,-5341,"wts992911437",[1,33.5,1,4.5]],[185,"鳳凰新村・環鳳街","環鳳街","Wan Fung Street",2877,-5299,"wts86041449",[3,16.7,1,2.97]],[187,"鳳凰新村・盈鳳里","盈鳳里","Ying Fung Lane",2711,-5135,"lf86041239",[14,0.7,1,2.97]],[188,"黃大仙・黃大仙道","黃大仙道","Wong Tai Sin Road",2277,-5267,"lf158466582",[7,10.3,1,4.82]]]);

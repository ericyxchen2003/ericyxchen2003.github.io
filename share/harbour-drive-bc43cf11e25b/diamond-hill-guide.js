// Public kerbside arrivals. The two termini have separate ground-level taxi loops.
window.HKDiamondHillGuide=(()=>{
  const sites=[
    ['plaza','荷里活廣場','Plaza Hollywood',3210,-5030,'Lung Poon Street','荷里活广场 荷里活商场'],
    ['station','港鐵鑽石山站','Diamond Hill Station',3200,-4965,'Lung Poon Street','港铁钻石山站 MTR'],
    ['nunnery','志蓮淨苑','Chi Lin Nunnery',3655,-4906,'Chi Lin Drive','志莲净苑 天王殿 大雄殿 萬佛塔 万佛塔'],
    ['garden','南蓮園池','Nan Lian Garden',3563,-4863,'Fung Tak Road','南莲园池 圓滿閣 圆满阁'],
    ['hammer-park','斧山公園','Hammer Hill Park',3696,-4820,'Fung Tak Road','斧山公园'],
    ['fung-park','鳳德公園','Fung Tak Park',2889,-5235,'Fung Tak Road','凤德公园 西遊記 西游记'],
    ['sports','斧山道運動場','Hammer Hill Road Sports Ground',3855,-4835,'Hammer Hill Road','斧山道运动场 田徑場'],
    ['funeral','東華三院鑽石山殯儀館','Diamond Hill Funeral Parlour',3747,-5480,'Po Kong Village Road','东华三院钻石山殡仪馆'],
    ['crematorium','鑽石山火葬場','Diamond Hill Crematorium',3825,-5396,'Po Kong Village Road','钻石山火葬场'],
    ['cemetery','鑽石山金塔墳場','Diamond Hill Urn Cemetery',3906,-5354,'Po Kong Village Road','钻石山金塔坟场 鑽石山墳場 钻石山坟场'],
    ['galaxia','星河明居','Galaxia',3241,-5076,'Lung Poon Street','星河明居'],
    ['fung-tak','鳳德邨','Fung Tak Estate',3159,-5203,'Fung Tak Road','凤德邨 凤德村'],
    ['lung-poon','龍蟠苑','Lung Poon Court',3189,-5189,'Fung Tak Road','龙蟠苑']
  ];
  return {places:sites.map(([k,n,en,x,z,street])=>['dh-'+k,n,en,114.17+x/103055,22.296-z/110741,street]),
    aliases:Object.fromEntries(sites.map(([k,,,,,,text])=>['dh-'+k,text])),
    districts:[['鑽石山','Diamond Hill',3390,-5130,'钻石山']],
    districtAt(x,z){return x>=2800&&x<=4280&&z>=-5920&&z<=-4510&&HKSanPoKong.contains(HKDiamondHillSites.boundary,x,z)?['鑽石山','DIAMOND HILL']:null;}};
})();
if(window.HKTaxiRankRows)HKTaxiRankRows.push(...[[175,"鑽石山・港鐵站公共運輸交匯處","港鐵站公共運輸交匯處","Diamond Hill Station PTI",3308,-4947,"dh108037512",[2,36.7,1,2.97]],[176,"鑽石山・彩虹道公共運輸交匯處","彩虹道公共運輸交匯處","Diamond Hill (Choi Hung Road) PTI",3430,-4690,"dh1064560365",[5,5.5,1,2.97]],[180,"鑽石山・龍蟠街","龍蟠街","Lung Poon Street",3211,-5050,"dh152470473",[7,25.5,-1,8.22]]]);

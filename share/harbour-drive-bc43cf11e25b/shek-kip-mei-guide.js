// The interchange and residential access roads serve different levels of the hillside.
window.HKShekKipMeiGuide=(()=>{
  const areas=[
    ['大窩坪','Tai Wo Ping',-860,-5175,'大窝坪 大窩坪 Tai Wo Ping',[[-1880,-5515],[-1470,-5900],[-525,-5900],[60,-5345],[18,-5082],[-120,-4880],[-405,-4770],[-683,-4788],[-1042,-4870],[-1370,-4780],[-1880,-4880]]],
    ['又一村','Yau Yat Tsuen',385,-4025,'又一村 Yau Yat Chuen',[ [210,-4720],[405,-4840],[740,-4830],[675,-4460],[631,-4150],[558,-3620],[478,-3435],[206,-3490],[184,-3745],[245,-3990],[175,-4200],[220,-4440]]],
    ['石硤尾','Shek Kip Mei',-300,-4295,'石硖尾 石硤尾 白田 南山邨 大坑東邨',[[-1035,-4850],[-670,-4800],[-390,-4770],[-116,-4890],[200,-4800],[225,-4480],[173,-4220],[248,-3990],[180,-3700],[6,-3600],[-302,-3790],[-535,-4010],[-625,-4185],[-824,-4350],[-1150,-4490]]]
  ];
  const rows=[
    ['jccac','賽馬會創意藝術中心','Jockey Club Creative Arts Centre',-451,-4320,'Pak Tin Street','赛马会创意艺术中心 JCCAC 石硖尾工厂大厦'],
    ['park','石硤尾公園','Shek Kip Mei Park',-100,-4449,'Nam Cheong Street','石硖尾公园 足球场 网球场'],
    ['sports','石硤尾公園體育館','Shek Kip Mei Park Sports Centre',-80,-4562,'Nam Cheong Street','石硖尾公园体育馆'],
    ['paktin','白田邨','Pak Tin Estate',-349,-4533,'Pak Wan Street','白田邨 白云街'],
    ['station','石硤尾站','Shek Kip Mei Station',-158,-3942,'Woh Chai Street','石硖尾站 窝仔街'],
    ['namshan','南山邨・南山市場','Nam Shan Estate Market',34,-4054,'Tai Hang Sai Street','南山邨 南山市场 大坑西街'],
    ['inno','創新中心','InnoCentre',581,-4325,'Tat Chee Avenue','创新中心 達之路 达之路 又一村'],
    ['oasis','又一居','Parc Oasis',378,-4202,'Grandeur Road','又一居 瑰丽路 瑰麗路'],
    ['club','又一村花園俱樂部','Yau Yat Chuen Garden City Club',335,-3929,'Cassia Road','又一村花园俱乐部 高槐路'],
    ['chak','澤安邨','Chak On Estate',-582,-4935,'Chak On Road','泽安邨 澤安道 大窝坪'],
    ['heights','畢架山花園','Beacon Heights',-265,-5046,'Lung Ping Road','毕架山花园 筆架山花園 龙坪道'],
    ['dynasty','帝景峰','Dynasty Heights',-764,-5269,'Yin Ping Road','帝景峰 延坪道 大窝坪']
  ];
  function inside(x,z,p){
    let hit=false;
    for(let i=0,j=p.length-1;i<p.length;j=i++){
      const [a,b]=p[i],[c,d]=p[j];
      if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)hit=!hit;
    }
    return hit;
  }
  return {districts:areas.map(a=>a.slice(0,5)),places:rows.map(([k,n,en,x,z,r])=>['skm-'+k,n,en,114.17+x/103055,22.296-z/110741,r]),
    aliases:Object.fromEntries(rows.map(r=>['skm-'+r[0],r[6]])),
    districtAt(x,z){const a=areas.find(r=>inside(x,z,r[5]));return a?[a[0],a[1].toUpperCase()]:null;}
  };
})();

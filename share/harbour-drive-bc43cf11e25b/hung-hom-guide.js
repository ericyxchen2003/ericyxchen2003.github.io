// Roadside arrivals for landmarks whose doors, forecourts or piers are pedestrian-only.
window.HKHungGuide=(()=>{
  const districts=[
    ['紅磡灣','Hung Hom Bay',1630,-690],['黃埔','Whampoa',2055,-951],['大環','Tai Wan',2304,-1210],
    ['鶴園','Hok Yuen',1730,-1665],['老龍坑','Lo Lung Hang',1310,-1750],['十二號山','No. 12 Hill',1092,-1607]
  ];
  const places=[
    ['hh-kwunyum','紅磡觀音廟','Hung Hom Kwun Yum Temple',114.18578,22.30795,'Kun Yam Street'],
    ['hh-coliseum','香港體育館（紅館）','Hong Kong Coliseum',114.18257,22.30169,'Cheong Wan Road'],
    ['hh-waterfront','紅磡海濱長堤','Hung Hom Harbourfront Promenade',114.19246,22.30235,'Tak Fung Street'],
    ['hh-promenade','紅磡海濱花園','Hung Hom Promenade',114.18801,22.30141,'Hung Luen Road'],
    ['hh-kerry','香港嘉里酒店','Kerry Hotel Hong Kong',114.18876,22.30183,'Hung Luen Road'],
    ['hh-metropolis','國際都會・置富都會','Fortune Metropolis',114.18314,22.30246,'Metropolis Drive'],
    ['hh-met-hotel','都會海逸酒店','Harbour Plaza Metropolis',114.18343,22.30157,'Metropolis Drive'],
    ['hh-grand','九龍海逸君綽酒店','Harbour Grand Kowloon',114.19199,22.30306,'Tak Fung Street'],
    ['hh-gov','九龍城政府合署','Kowloon City Government Offices',114.18954,22.31192,'Bailey Street'],
    ['hh-polyu','香港理工大學（主校園）','The Hong Kong Polytechnic University',114.17866,22.30460,'Yuk Choi Road'],
    ['hh-college','香港理工大學紅磡灣校園','PolyU Hung Hom Bay Campus',114.18476,22.30352,'Hung Lok Road'],
    ['hh-world','世界殯儀館','World Funeral Parlour',114.18257,22.30574,'Cheong Hang Road'],
    ['hh-intl','萬國殯儀館','International Funeral Parlour',114.18238,22.30589,'Cheong Hang Road'],
    ['hh-universal','寰宇殯儀館','Universal Funeral Parlour',114.18225,22.30634,'Cheong Hang Road'],
    ['hh-baker','必嘉街・黃埔街食肆','Baker Street & Whampoa Street',114.18464,22.30663,'Baker Street'],
    ['hh-sisun','時新快餐店舊址（黃埔街）','Former Si Sun Fast Food',114.18443,22.30596,'Whampoa Street'],
    ['hh-sungkit','崇潔美食街（步行入口）','Sung Kit Street',114.18865,22.31220,'Sung On Street'],
    ['hh-ship','黃埔號','The Whampoa',114.19003,22.30398,'Shung King Street'],
    ['hh-taiwan','大環山公園','Tai Wan Shan Park',114.19218,22.30613,'Wan Hoi Street']
  ];
  function districtAt(x,z){
    if(x<1300 && !(x>940&&z< -1200&&z> -1870) && !(x>990&&z> -1050&&z< -445))return null;
    if(z< -2300||z>60)return null;
    const d=districts.reduce((a,b)=>Math.hypot(b[2]-x,b[3]-z)<Math.hypot(a[2]-x,a[3]-z)?b:a);
    return [d[0],d[1].toUpperCase()];
  }
  return {places,districts,districtAt};
})();

if(window.HKTaxiRankRows)HKTaxiRankRows.push(...[[89,"庇利街","庇利街","Bailey St.",1928.2,-1813.0,"hh151396480",[2,29.35,-1,11.58]],[93,"紅磡（紅鸞道）公共運輸交匯處","紅磡（紅鸞道）公共運輸交匯處","Hung Hom (Hung Luen Road) Public Transport Interchange",1939.1,-620.3,"hh729450069",[1,22.6,1,3.1]],[102,"愛景街","愛景街","Oi King Street",1816.8,-756.6,"hh320529651",[4,30.1,1,4.43]],[105,"新圍街","新圍街","San Wai St.",1694.6,-1766.0,"hh151396644",[3,13.6,-1,4.98]],[107,"山谷道","山谷道","Valley Rd.",1418.0,-1524.4,"hh151396661",[1,27.1,1,4.73]],[204,"紅磡港鐵站（南候客位）","紅磡港鐵站","Hung Hom MTR Station",1294.9,-801.1,"hh33680201",[10,25.6,1,3.1]],[205,"紅磡港鐵站（北候客位）","紅磡港鐵站","Hung Hom MTR Station",1293.7,-709.4,"hh33680201",[19,31.6,1,3.1]]]);

// Arrival points lie on the carriageway at a public approach to each site.
window.HKLokFuGuide=(()=>{
  const sites=[
    ['estate','樂富邨','Lok Fu Estate',1790,-4440,'Heng Lam Street','乐富邨 老虎岩 Lo Fu Ngam'],
    ['wang','橫頭磡邨','Wang Tau Hom Estate',1803,-4944,'Fu Mei Street','横头磡邨'],
    ['ka','嘉強苑','Ka Keung Court',1480,-4958,'Fu Mei Street','嘉强苑'],
    ['fu','富強苑','Fu Keung Court',1543,-4810,'Fu Wan Street','富强苑'],
    ['tak','德強苑','Tak Keung Court',1628,-4780,'Fu Keung Street','德强苑'],
    ['hong','康強苑','Hong Keung Court',2067,-4534,'Heng Lam Street','康强苑'],
    ['hospital','香港佛教醫院','Hong Kong Buddhist Hospital',1925,-4430,'Heng Lam Street','香港佛教医院 杏林街'],
    ['mall','樂富廣場','Lok Fu Place',1805,-4639,'Wang Tau Hom East Road','乐富广场 樂富中心 Lok Fu Plaza'],
    ['station','港鐵樂富站','Lok Fu Station',1828,-4648,'Wang Tau Hom East Road','港铁乐富站 MTR'],
    ['park','樂富公園','Lok Fu Park',1540,-4479,'Fu On Street','乐富公园 老虎岩'],
    ['morse1','摩士一號公園','Morse Park No. 1',2418,-4546,'Tai Tung Street','摩士公园 摩士一号公园'],
    ['morse2','摩士二號公園','Morse Park No. 2',2307,-4590,'Tung Tau Tsuen Road','摩士公园 摩士二号公园'],
    ['sports','摩士三號公園・體育館','Morse Park No. 3 · Sports Centre',2012,-4689,'Fung Mo Street','摩士公园 摩士三号公园 摩士公园体育馆'],
    ['morse4','摩士四號公園','Morse Park No. 4',2047,-4509,'Heng Lam Street','摩士公园 摩士四号公园'],
    ['pool','摩士公園游泳池','Morse Park Swimming Pool',2065,-5093,'Fung Mo Street','摩士公园游泳池 鳳舞街']
  ];
  const districts=[['樂富','Lok Fu',1780,-4525,'乐富 老虎岩 Lo Fu Ngam'],['橫頭磡','Wang Tau Hom',1770,-4910,'横头磡 橫頭冚']];
  const lokFu=['樂富','LOK FU'],wangTauHom=['橫頭磡','WANG TAU HOM'];
  function within(x,z,ring){
    let inside=false,a=ring.at(-1);
    for(const b of ring){
      if((a[1]>z)!==(b[1]>z)&&x<a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]))inside=!inside;
      a=b;
    }
    return inside;
  }
  return {places:sites.map(([key,n,en,x,z,road])=>['lf-'+key,n,en,114.17+x/103055,22.296-z/110741,road]),
    aliases:Object.fromEntries(sites.map(s=>['lf-'+s[0],s[6]])),districts,
    models:[['樂富公園','Lok Fu Park',1575,-4445,42,100],['摩士公園','Morse Park',2180,-4650,18,150]],
    districtAt(x,z){
      if(x<1395||x>2750||z< -5270||z> -4240)return null;
      for(const area of window.HKLokFuSites?.neighborhoods||[]){
        if(within(x,z,area.ring))return area.wang?wangTauHom:lokFu;
      }
      // The park and the courts west of Junction Road occupy existing Kowloon Tong cells.
      if(x<1650&&(z< -5090||z> -4800&&z< -4650&&x<1620||z> -4650&&x<1450))return null;
      if(x>2540&&z> -4800)return ['新蒲崗','SAN PO KONG'];
      if(x>2200&&z< -4980)return ['黃大仙','WONG TAI SIN'];
      if(x>2345&&z> -4460)return ['東頭','TUNG TAU'];
      return z< -4725&&x<2020?wangTauHom:lokFu;
    }};
})();
if(window.HKTaxiRankRows)HKTaxiRankRows.push([186,'樂富・橫頭磡南道','橫頭磡南道','Wang Tau Hom South Road',1776,-4718,'lf724540465',[1,6.3,1,2.97]]);

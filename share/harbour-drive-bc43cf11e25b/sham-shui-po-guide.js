// Curbside destinations use legal motor streets, including for pedestrian markets.
window.HKShamShuiPoGuide=(()=>{
  const outline=[[-2020,-3510],[-2050,-3750],[-1180,-4520],[-700,-4490],[-602,-4320],[-580,-4180],[-476,-3990],[-312,-3840],[-408,-3320],[-895,-3170],[-1570,-3150]];
  const rows=[
    ['golden','高登電腦中心','Golden Computer Centre',-865,-4029,'Yen Chow Street','高登电脑中心 钦州街 上层'],
    ['arcade','黃金電腦商場','Golden Computer Arcade',-834,-3972,'Fuk Wa Street','黄金商场 黄金电脑商场 福华街 地库'],
    ['dragon','西九龍中心','Dragon Centre',-1029,-3885,'Dragon Centre taxi access','西九龙中心 商场'],
    ['apliu','鴨寮街電子市集','Apliu Street Flea Market',-698,-3687,'Nam Cheong Street','鸭寮街 电子零件 二手影音'],
    ['jade','通州街玉石市場','Tung Chau Street Jade Market',-1179,-3518,'Tung Chau Street','通州街临时街市 深水埗玉石市场'],
    ['police','深水埗警署','Sham Shui Po Police Station',-1150,-3756,'Lai Chi Kok Road','深水埗警署'],
    ['court','前北九龍裁判法院','Former North Kowloon Magistracy',-792,-4301,'Kowloon Road','北九龙裁判法院'],
    ['meiho','美荷樓','Mei Ho House',-684,-4193,'Berwick Street','美荷楼 青年旅舍 石硖尾'],
    ['clinic','深水埗公立醫局','Sham Shui Po Public Dispensary',-851,-3410,'Yee Kuk Street','深水埗公立医局'],
    ['pawn','南昌押','Nam Cheong Pawn Shop',-727,-3652,'Nam Cheong Street','南昌押 战前唐楼'],
    ['garden','嘉頓中心','Garden Centre',-778,-4175,'Castle Peak Road','嘉顿中心 嘉顿钟楼'],
    ['tinhau','深水埗天后廟','Sham Shui Po Tin Hau Temple',-1061,-3584,'Yee Kuk Street','深水埗天后庙'],
    ['samtai','三太子及北帝廟','Sam Tai Tze and Pak Tai Temples',-786,-3678,'Yu Chau Street','深水埗三太子及北帝庙'],
    ['kwantai','深水埗武帝廟','Sham Shui Po Kwan Tai Temple',-890,-3360,'Hai Tan Street','深水埗武帝庙 深水埗关帝庙 關帝廟 海壇街'],
    ['market','北河街市政大廈','Pei Ho Street Municipal Services Building',-909,-3706,'Ki Lung Street','北河街市政大厦 北河街街市'],
    ['food','北河街・街坊食肆','Pei Ho Street eateries',-834,-3704,'Pei Ho Street','北河四街 食街 北河街'],
    ['cafe','大南街・黃竹街小店','Tai Nan Street shops and cafés',-641,-3400,'Tai Nan Street','大南街 黄竹街 咖啡'],
    ['park','深水埗公園','Sham Shui Po Park',-1346,-3872,'Lai Chi Kok Road','深水埗公园']
  ];
  return {districts:[['深水埗','Sham Shui Po',-850,-3900,'深水埗 舊區 Sham Shui Po']],
    places:rows.map(([k,n,en,x,z,r])=>['ssp-'+k,n,en,114.17+x/103055,22.296-z/110741,r]),
    aliases:Object.fromEntries(rows.map(r=>['ssp-'+r[0],r[6]])),
    districtAt(x,z){let inArea=false;
      for(let i=0,j=outline.length-1;i<outline.length;j=i++){
        const [a,b]=outline[i],[c,d]=outline[j];
        if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inArea=!inArea;
      }
      return inArea?['深水埗','SHAM SHUI PO']:null;
    }
  };
})();

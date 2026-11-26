// Drop-offs use the public street entrance rather than the building centroid.
window.HKCheungShaWanGuide=(()=>{
  const boundary=[[-2920,-4890],[-2220,-5400],[-1580,-5360],[-1200,-5215],[-950,-4865],[-935,-4655],[-1120,-4440],[-1360,-4215],[-1810,-3790],[-1720,-3140],[-1880,-3000],[-2510,-3000],[-2920,-3920]];
  const sites=[
    ['museum','李鄭屋漢墓博物館','Lei Cheng Uk Han Tomb Museum',-1011,-4627,'Tonkin Street','李郑屋汉墓博物馆 东汉古墓 東京街 东京街'],
    ['garden','漢花園','Han Garden',-1044,-4590,'Tonkin Street','汉花园'],
    ['lei-estate','李鄭屋邨','Lei Cheng Uk Estate',-1127,-4625,'Po On Road','李郑屋邨 保安道'],
    ['so-uk','蘇屋邨','So Uk Estate',-1358,-5052,'Orchid Street','苏屋邨 兰花街'],
    ['plaza','長沙灣廣場','Cheung Sha Wan Plaza',-2182,-4523,'Cheung Shun Street','长沙湾广场 长顺街 时装批发'],
    ['hoi-lai','海麗邨','Hoi Lai Estate',-2318,-4010,'Hoi Lai Estate taxi access','海丽邨 公共运输交汇处'],
    ['pacifica','宇晴軒','The Pacifica',-2036,-4307,'Tung Chau Street','宇晴轩'],
    ['liberte','昇悅居','Liberté',-2212,-4361,'Lai Chi Kok Road','昇悦居 升悦居 Liberte'],
    ['banyan','泓景臺','Banyan Garden',-2319,-4174,'Sham Shing Road','泓景台'],
    ['aqua','碧海藍天','AquaMarine',-2254,-4003,'Sham Mong Road','碧海蓝天'],
    ['one','一號西九龍','One West Kowloon',-2378,-4166,'Sham Shing Road','一号西九龙'],
    ['sparkle','星匯居','The Sparkle',-1843,-4120,'Tan Lai Street','星汇居'],
    ['playground','長沙灣遊樂場','Cheung Sha Wan Playground',-1463,-4396,'Cheung Sha Wan Road','长沙湾游乐场 长沙湾运动场'],
    ['station','長沙灣站','Cheung Sha Wan Station',-1405,-4365,'Cheung Sha Wan Road','长沙湾站'],
    ['wholesale','長沙灣副食品批發市場','Cheung Sha Wan Wholesale Food Market',-1662,-3110,'Yen Chow Street West','长沙湾副食品批发市场'],
    ['vegetables','長沙灣蔬菜批發市場','Cheung Sha Wan Wholesale Vegetable Market',-1620,-4138,'Lai Chi Kok Road','长沙湾蔬菜批发市场']
  ];
  return {districts:[['長沙灣','Cheung Sha Wan',-1640,-4450,'长沙湾 長沙灣 蘇屋 李鄭屋']],
    places:sites.map(([id,n,en,x,z,street])=>['csw-'+id,n,en,114.17+x/103055,22.296-z/110741,street]),
    aliases:Object.fromEntries(sites.map(([id,,,,,,alias])=>['csw-'+id,alias])),
    districtAt(x,z){
      let inside=false;
      for(let i=0,j=boundary.length-1;i<boundary.length;j=i++){
        const [a,b]=boundary[i],[c,d]=boundary[j];
        if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;
      }
      return inside?['長沙灣','CHEUNG SHA WAN']:null;
    }
  };
})();

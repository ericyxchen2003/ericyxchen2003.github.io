// Entrances snap to public surface streets on the appropriate side of the podium.
window.HKSanPoKongGuide=(()=>{
  const sites=[
    ['mikiki','Mikiki','Mikiki',2751,-4198,'King Fuk Street','新蒲崗商場 新蒲岗商场 譽港灣商場 誉港湾商场'],
    ['latitude','譽・港灣','The Latitude',2812,-4230,'King Fuk Street','誉港湾 譽港灣 譽·港灣'],
    ['aia','友邦九龍金融中心','AIA Financial Centre',3023,-4325,'King Fuk Street','友邦九龙金融中心 AIA'],
    ['rhythm','采頤花園','Rhythm Garden',3303,-4589,'Choi Yee Lane','采颐花园 彩頤里'],
    ['rhythm-mall','采頤花園商場','Rhythm Garden Shopping Centre',3267,-4574,'Choi Yee Lane','采颐花园商场'],
    ['king','景泰苑','King Tai Court',3089,-4333,'King Fuk Street','景泰苑 綠置居'],
    ['yue','越秀廣場','Yue Xiu Plaza',2633,-4159,'Ning Yuen Street','越秀广场'],
    ['playground','彩虹道遊樂場','Choi Hung Road Playground',2806,-4576,'Sheung Hei Street','彩虹道游乐场 球場'],
    ['sports','彩虹道體育館','Choi Hung Road Sports Centre',2768,-4520,'Sheung Hei Street','彩虹道体育馆'],
    ['market','彩虹道街市','Choi Hung Road Market',2665,-4465,'Tseuk Luk Street','彩虹道街市'],
    ['pat-tat','八達工業大廈','Pat Tat Industrial Building',2929,-4533,'Pat Tat Street','八达工业大厦'],
    ['luk-hop','六合工業大廈','Luk Hop Industrial Building',3036,-4520,'Luk Hop Street','六合工业大厦']
  ];
  return {places:sites.map(([k,n,en,x,z,road])=>['spk-'+k,n,en,114.17+x/103055,22.296-z/110741,road]),
    aliases:Object.fromEntries(sites.map(([k,,,,,,alias])=>['spk-'+k,alias])),
    districts:[['新蒲崗','San Po Kong',2940,-4495,'新蒲岗']],
    districtAt(x,z){
      if(x<2425||x>3620||z< -4820||z> -3920)return null;
      return HKSanPoKong.contains(HKSanPoKongSites.boundary,x,z)?['新蒲崗','SAN PO KONG']:null;
    }};
})();
if(window.HKTaxiRankRows)HKTaxiRankRows.push(...[[178,"新蒲崗・康強街","康強街","Hong Keung Street",2793,-4282,"kai1286692274",[7,14.3,1,2.97]],[179,"新蒲崗・錦榮街","錦榮街","Kam Wing Street",2658,-4407,"lf86041212",[2,23.9,1,2.97]],[183,"新蒲崗・寧遠街","寧遠街","Ning Yuen Street",2632,-4167,"kai152360000",[1,51.1,1,2.97]],[189,"新蒲崗・衍慶街","衍慶街","Yin Hing Street",2516,-4338,"lf86041396",[2,10.3,1,2.97]]]);

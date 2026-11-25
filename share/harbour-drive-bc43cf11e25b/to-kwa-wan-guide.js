// Roadside arrivals provide access to destinations inside pedestrian sites.
window.HKToKwaWanGuide = {
  districts: [
    ['土瓜灣','To Kwa Wan',1950,-2505],['馬頭角','Ma Tau Kok',2125,-2845],
    ['馬頭圍','Ma Tau Wai',1720,-2905],['宋皇臺','Sung Wong Toi',2324,-3210]
  ],
  places: [
    ['tkw-market','土瓜灣街市暨政府合署（紅蘋果街市）','To Kwa Wan Market and Government Offices',114.18784,22.31733,'Ma Tau Wai Road'],
    ['tkw-cattle','牛棚藝術村','Cattle Depot Artist Village',114.19148,22.32093,'Ma Tau Kok Road'],
    ['tkw-artpark','牛棚藝術公園','Cattle Depot Art Park',114.1916111,22.3198398,'San Shan Road'],
    ['tkw-recreation','土瓜灣遊樂場','To Kwa Wan Recreation Ground',114.19054,22.31946,'To Kwa Wan Road'],
    ['tkw-ferry','九龍城渡輪碼頭','Kowloon City Ferry Pier',114.19416,22.31815,'San Ma Tau Street'],
    ['tkw-grand','翔龍灣廣場','Grand Waterfront Plaza',114.19324,22.31923,'San Ma Tau Street'],
    ['tkw-sky','傲雲峰','Sky Tower',114.19048,22.32368,'Sung Wong Toi Road'],
    ['tkw-gov','馬頭角道政府合署','Ma Tau Kok Road Government Offices',114.18730,22.32277,'Ma Tau Kok Road'],
    ['tkw-jubilant','欣榮花園','Jubilant Place',114.18910,22.32145,'Pau Chung Street'],
    ['tkw-hoisham','海心公園','Hoi Sham Park',114.19315,22.31503,'Yuk Yat Street']
  ],
  districtAt(x,z){
    if(x<1300||x>3000||z< -3840||z> -2300)return null;
    if(z< -3450)return ['九龍城','KOWLOON CITY'];
    if(x>2700)return ['啟德','KAI TAK'];
    if(x<1570&&z> -3150)return ['何文田','HO MAN TIN'];
    const d=this.districts.reduce((a,b)=>Math.hypot(x-b[2],z-b[3])<Math.hypot(x-a[2],z-a[3])?b:a);
    return [d[0],d[1].toUpperCase()];
  }
};

if(window.HKTaxiRankRows)HKTaxiRankRows.push(...[[92,"福佬村道近太子道西","福佬村道近太子道西","Fuk Lo Tsun Road near Prince Edward Road West",1811.5,-3517.5,"tkw152359871",[6,30.1,1,2.88]],[96,"九龍城碼頭","九龍城碼頭","Kowloon City Ferry Pier",2474.0,-2470.4,"tkw851134674",[4,1.6,1,4.43]],[97,"新碼頭街近翔龍灣","新碼頭街近翔龍灣","San Ma Tau Street near Grand Waterfront",2375.5,-2555.5,"tkw737078838",[2,41.35,1,4.43]],[99,"馬坑涌道","馬坑涌道","Ma Hang Chung Rd.",1879.5,-2657.5,"tkw449337017",[2,76.6,1,2.88]],[100,"美光街","美光街","Mei Kwong Street",2224.7,-2339.1,"tkw54366513",[1,48.85,1,2.88]],[103,"北帝街","北帝街","Pak Tai Street",2023.0,-3033.2,"tkw1188528914",[2,6.85,1,4.43]]]);

// Each arrival is on a public carriageway at the edge of its pedestrian site.
window.HKKowloonCityGuide={
  districts:[['九龍城','Kowloon City',1985,-3700,'九龙城 kowloon city old town']],
  places:[
    ['kc-plaza','九龍城廣場','Kowloon City Plaza',1863,-3841,'Carpenter Road'],
    ['kc-market','九龍城街市及熟食中心','Kowloon City Market and Cooked Food Centre',1934,-3713,'Hau Wong Road'],
    ['kc-park','九龍寨城公園（北門）','Kowloon Walled City Park · North Gate',2060,-4053,'Tung Tau Tsuen Road'],
    ['kc-carpenter','賈炳達道公園','Carpenter Road Park',2100,-3828,'Carpenter Road'],
    ['kc-temple','侯王古廟','Hau Wong Temple',1776,-4074,'Junction Road'],
    ['kc-school','香港兆基創意書院','HKICC Lee Shau Kee School of Creativity',1764,-4222,'Inverness Road'],
    ['kc-food','衙前圍道食街','Nga Tsin Wai Road Restaurants',1951,-3646,'Nga Tsin Wai Road'],
    ['kc-thai','城南道泰國商店','South Wall Road Thai Shops',2158,-3600,'South Wall Road']
  ].map(([key,name,en,x,z,road])=>[key,name,en,114.17+x/103055,22.296-z/110741,road]),
  districtAt(x,z){
    if(z< -4290||z> -3460||x<1570||x>2450)return null;
    return ['九龍城','KOWLOON CITY'];
  }
};
if(window.HKTaxiRankRows)HKTaxiRankRows.push([104,'沙浦道','沙浦道','Sa Po Road',2348.4,-3798.5,'tkw37416158',[4,13.6,1,4.43]]);

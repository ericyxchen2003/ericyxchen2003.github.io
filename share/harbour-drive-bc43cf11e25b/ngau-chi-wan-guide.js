// Public kerbs serve both the housing estates and the pedestrian market lanes.
window.HKNgauChiWanGuide=(()=>{
  const sites=[
    ['hung','彩虹邨','Choi Hung Estate',3867,-4289,'Tse Wai Avenue','彩虹村 彩虹邨天台籃球場 篮球场'],
    ['shek','坪石邨','Ping Shek Estate',4140,-4178,'Ping Shek Estate Taxi Access','坪石村 坪石邨的士站'],
    ['wan','彩雲邨','Choi Wan Estate',4628,-4158,'Clear Water Bay Road','彩云邨 彩云村 彩雲一邨 彩雲二邨'],
    ['civic','牛池灣市政大廈及文娛中心','Ngau Chi Wan Municipal Services Building and Civic Centre',4049,-4244,'Clear Water Bay Road','牛池湾文娱中心 牛池湾市政大厦 牛池灣街市 牛池湾街市'],
    ['home','聖若瑟安老院','St. Joseph’s Home for the Aged',4141,-4250,'Clear Water Bay Road','圣若瑟安老院 安老院舊址 St Joseph'],
    ['gateway','牛池灣鄉牌坊','Ngau Chi Wan Village Gateway',3944,-4400,'Lung Chi Path','牛池湾乡牌坊 牛池湾村 牛池灣鄉 龍池徑'],
    ['station','彩虹站','Choi Hung Station',4088,-4230,'Clear Water Bay Road','彩虹港鐵站 彩虹地铁站 MTR Choi Hung']
  ];
  const boundary=[[3450,-4535],[3510,-4590],[3710,-4640],[3890,-4710],[4200,-4760],[4490,-4860],[5040,-4840],[5040,-4020],[4780,-3920],[4490,-3970],[4270,-3975],[4050,-3905],[3880,-3990],[3790,-4140],[3590,-4240]];
  return {places:sites.map(([key,n,en,x,z,street])=>['ncw-'+key,n,en,114.17+x/103055,22.296-z/110741,street]),
    aliases:Object.fromEntries(sites.map(([key,,,,,,alias])=>['ncw-'+key,alias])),
    districts:[['牛池灣','Ngau Chi Wan',4020,-4350,'牛池湾 彩虹 Choi Hung']],
    districtAt(x,z){return x>=3450&&x<=5050&&z>=-4880&&z<=-3900&&HKSanPoKong.contains(boundary,x,z)?['牛池灣','NGAU CHI WAN']:null;}};
})();
if(window.HKTaxiRankRows)HKTaxiRankRows.push(...[[109,"牛池灣・彩盛里","彩盛里","Choi Shing Lane",4492,-3997,"ncw557918198",[1,0.7,1,4.7]],[126,"坪石邨・地面","坪石邨地面","Ping Shek Estate Taxi Access",4139,-4182,"ncw945700717",[6,14.3,1,2.97]],[142,"坪石交匯處・一樓","坪石一樓","Ping Shek PTI (1/F)",4138,-4227,"ncw1212993231",[2,11.9,1,2.97]],[173,"牛池灣・彩雲聖若瑟小學","彩雲聖若瑟小學","Choi Wan Taxi Access",4269,-4280,"ncw110114365",[1,9.5,1,2.97]],[174,"牛池灣・彩雲巴士總站","彩雲巴士總站","Clear Water Bay Road",4639,-4159,"ncw543338498",[2,33.5,1,8.22]],[177,"牛池灣・豐盛街","豐盛街","Fung Shing Street",4587,-4625,"ncw758096364",[4,1.5,1,4.82]],[182,"牛池灣・牛池灣街","牛池灣街","Ngau Chi Wan Street",4951,-4313,"ncw156407776",[12,19.1,1,2.97]]]);

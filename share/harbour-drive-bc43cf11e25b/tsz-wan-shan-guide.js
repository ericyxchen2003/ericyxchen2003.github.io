// Destinations use public kerbs. The ridge walks and transmitter are scenery above the drop-off.
window.HKTszWanShanGuide=(()=>{
  const sites=[
    ['mall','慈雲山中心','Tsz Wan Shan Shopping Centre',3144,-5854,'Wai Wah Street','慈云山中心 Tsz Wan Shan Centre'],
    ['ching','慈正邨','Tsz Ching Estate',3260,-5960,'Tsz Wan Shan Road','慈正村 正暉樓'],
    ['oi','慈愛苑','Tsz Oi Court',2916,-6066,'Tsz Wan Shan Road','慈爱苑'],
    ['lok','慈樂邨','Tsz Lok Estate',2987,-5618,'Wan Wah Street','慈乐邨 慈乐村'],
    ['man','慈民邨','Tsz Man Estate',3389,-5830,'Tsz Wan Shan Road','慈民村'],
    ['on','慈安苑','Tsz On Court',3231,-5840,'Tsz Wan Shan Road','慈安苑'],
    ['hong','慈康邨','Tsz Hong Estate',3420,-5664,'Yuk Wah Street','慈康村'],
    ['pass-estate','沙田坳邨','Shatin Pass Estate',2534,-5860,'Tsz Wan Shan Road','沙田坳村'],
    ['playground','慈雲山邨中央遊樂場','Tsz Wan Shan Estate Central Playground',3192,-5937,'Tsz Wan Shan Road','慈云山邨中央游乐场 中央球場'],
    ['park','蒲崗村道公園','Po Kong Village Road Park',3368,-5534,'Po Kong Village Road','蒲岗村道公园 高架單車徑 高架单车径 單車場'],
    ['trails','沙田坳道行山入口（法藏寺）','Shatin Pass Road Hiking Access',2495,-5911,'Shatin Pass Road','麦理浩径 麥理浩徑 卫奕信径 衛奕信徑 沙田坳 慈雲山發射站 慈云山发射站']
  ];
  const boundary=[[2440,-6020],[2490,-7210],[3990,-7210],[3990,-5850],[3610,-5620],[3650,-5500],[3780,-5345],[3690,-5118],[3490,-5215],[3295,-5410],[3095,-5480],[2910,-5480],[2805,-5570],[2630,-5650],[2450,-5820]];
  return {places:sites.map(([k,n,en,x,z,road])=>['tws-'+k,n,en,114.17+x/103055,22.296-z/110741,road]),
    aliases:Object.fromEntries(sites.map(([k,,,,,,alias])=>['tws-'+k,alias])),
    districts:[['慈雲山','Tsz Wan Shan',3130,-5880,'慈云山']],
    districtAt(x,z){return x>=2440&&x<=3990&&z>=-7200&&z<=-5110&&HKSanPoKong.contains(boundary,x,z)?['慈雲山','TSZ WAN SHAN']:null;}};
})();
if(window.HKTaxiRankRows)HKTaxiRankRows.push([184,'慈雲山・惠華街','惠華街','Wai Wah Street',3142,-5858,'dh1119165880',[1,18.3,1,4.82]]);

window.HKKaiTakGuide={
 districts:[['啟德','Kai Tak',2950,-3820,'启德 旧机场 跑道 Kai Tak']],
 places:[
  ['kai-revenue','稅務中心','Inland Revenue Centre',2960,-4068,'Concorde Road'],
  ['kai-trade','工業貿易大樓','Trade and Industry Tower',2855,-4033,'Concorde Road'],
  ['kai-airside','AIRSIDE','AIRSIDE',2869,-3851,'Muk Yuen Street'],
  ['kai-stadium','啟德體育園・啟德主場館','Kai Tak Sports Park · Kai Tak Stadium',2682,-2934,'Shing Kai Road'],
  ['kai-arena','啟德體藝館','Kai Tak Arena',2810,-3355,'Muk Tai Street'],
  ['kai-runway','啟德跑道公園','Kai Tak Runway Park',4548,-1082,'Cruise Terminal access'],
  ['kai-swt','宋皇臺公園（規劃用地）','Sung Wong Toi Park (planned site)',2220,-3208,'Sung Wong Toi Road'],
  ['kai-garden','宋王臺花園','Sung Wong Toi Garden',2002,-3190,'Sung Wong Toi Road'],
  ['kai-cruise','啟德郵輪碼頭','Kai Tak Cruise Terminal',4478,-1111,'Cruise Terminal access']
 ].map(([key,n,en,x,z,road])=>[key,n,en,114.17+x/103055,22.296-z/110741,road]),
 aliases:{'kai-revenue':'税务中心 税局','kai-trade':'工业贸易大楼 工贸大楼','kai-stadium':'启德体育园 启德主场馆 啟德體育場','kai-runway':'启德跑道公园 旧机场','kai-swt':'宋皇台公园 规划用地','kai-garden':'宋王台花园 石刻','kai-cruise':'启德邮轮码头'},
 districtAt(x,z){
   if(z<-4500||z> -735||x<1920||x>5050)return null;
   if(Math.abs(x-2220)<88&&Math.abs(z+3208)<64)return ['啟德','KAI TAK'];
   const northern=Math.max(-4460,-3520-(x-2200)*.86);
   if(z<northern||x<Math.max(2170,2470-(z+3250)*.18)&&!(Math.abs(x-1994)<58&&Math.abs(z+3206)<46))return null;
   if(x>3715&&z<-3270||x>4100&&z<-2510||x<3000&&z>-2740)return null;
   return ['啟德','KAI TAK'];
 }
};

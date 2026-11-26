// Navigation endpoints use public carriageways. The summit is reached on foot.
window.HKKowloonTongGuide={
  districts:[['九龍塘','Kowloon Tong',770,-4510,'九龙塘 九龍仔 Kowloon Tong']],
  places:[
    ['kt-festival','又一城','Festival Walk',442,-4528,'Tat Chee Avenue'],
    ['kt-cityu','香港城市大學','City University of Hong Kong',397,-4557,'Tat Chee Avenue'],
    ['kt-media','邵逸夫創意媒體中心','Run Run Shaw Creative Media Centre',-107,-4862,'Tat Hong Avenue'],
    ['kt-hkbu','香港浸會大學（善衡校園）','Hong Kong Baptist University · Ho Sin Hang Campus',955,-4995,'Waterloo Road'],
    ['kt-hospital','香港浸信會醫院','Hong Kong Baptist Hospital',1014,-4825,'Kam Shing Road'],
    ['kt-broadcast','廣播道・香港電台廣播大廈','Broadcast Drive · RTHK Broadcasting House',1090,-5050,'Broadcast Drive'],
    ['kt-hill','筆架山（山腳）','Beacon Hill · Foothills',548,-5209,'Beacon Hill Road'],
    ['kt-park','歌和老街公園','Cornwall Street Park',386,-4752,'Tat Chee Avenue'],
    ['kt-education','九龍塘教育服務中心','Kowloon Tong Education Services Centre',762,-4523,'Suffolk Road'],
    ['kt-temple','中國香港聖殿','Hong Kong China Temple',744,-4891,'Cornwall Street'],
    ['kt-franki','建新中心','Franki Centre',1119,-4774,'Junction Road'],
    ['kt-shang','省善真堂','Shang Sin Chun Tong',726,-4200,'Rutland Quadrant'],
    ['kt-harilela','夏利萊大宅','Harilela Mansion',952,-4045,'Durham Road'],
    ['kt-ideal','理想酒店舊址','Former Ideal Hotel · Kent Road',682,-4652,'Kent Road'],
    ['kt-church','聖德肋撒堂','St. Teresa’s Church',832,-3298,'Prince Edward Road West'],
    ['kt-clp','中電鐘樓文化館（中電總辦事處舊址）','CLP Pulse · Former CLP Head Office',758,-2792,'Argyle Street']
  ].map(([key,name,en,x,z,road])=>[key,name,en,114.17+x/103055,22.296-z/110741,road]),
  aliases:{'kt-festival':'又一城 九龙塘商场','kt-cityu':'城大 香港城市大学 CityU','kt-hkbu':'浸大 香港浸会大学 HKBU','kt-hospital':'浸会医院 浸信会医院','kt-hill':'笔架山 畢架山 毕架山','kt-park':'歌和老街公园','kt-broadcast':'广播道 香港电台','kt-temple':'中国香港圣殿','kt-education':'九龙塘教育服务中心','kt-shang':'省善真堂','kt-harilela':'夏利莱大宅','kt-ideal':'理想酒店旧址 四季薈 My Palace','kt-church':'圣德肋撒堂','kt-clp':'中华电力有限公司行政办事处 中華電力有限公司行政辦事處 中电钟楼文化馆'},
  districtAt(x,z){
    if(x< -525||x>1650||z< -6270||z> -3440||x>=1300&&z>= -4290)return null;
    if(z< -5210)return ['筆架山','BEACON HILL'];
    return ['九龍塘','KOWLOON TONG'];
  }
};
if(window.HKTaxiRankRows)HKTaxiRankRows.push(...[[95,"金城道","金城道","Kam Shing Road",1037.6,-4827.4,"kt152359917",[2,37.5,1,2.97]],[106,"九龍塘站・多福道","九龍塘站・多福道","To Fuk Road",650.9,-4484,"kt1495848938",[1,0.7,1,2.97]],[166,"石硤尾・白雲街","白雲街","Pak Wan Street",-425,-4525.4,"ktn30075672.1",[13,0.7,-1,4.7]],[168,"石硤尾・大坑西街","大坑西街","Tai Hang Sai Street",8.9,-4085.6,963535972,[8,22.3,-1,4.82]]]);

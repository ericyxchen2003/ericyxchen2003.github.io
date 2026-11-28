// Stops on the public approach. The garden is reached on foot from Mei Foo.
window.HKLaiChiKokGuide=(()=>{
  const sites=[
    ['pmh','瑪嘉烈醫院','Princess Margaret Hospital',-3827,-5034,'Princess Margaret Hospital Road','玛嘉烈医院 荔景山'],
    ['kch','葵涌醫院','Kwai Chung Hospital',-3870,-5179,'Kwai Chung Hospital Road','葵涌医院 葵涌医院路'],
    ['academy','饒宗頤文化館','Jao Tsung-I Academy',-2876,-4567,'Castle Peak Road','饶宗颐文化馆 荔枝角医院 翠雅山房 Heritage Lodge'],
    ['centre','荔枝角收押所','Lai Chi Kok Reception Centre',-2624,-4645,'Butterfly Valley Road','荔枝角收押所 蝴蝶谷道'],
    ['terminus','荔枝角（九華徑）巴士總站','Lai Chi Kok (Kau Wa Keng) Bus Terminus',-3408,-5028,'King Lai Path','荔枝角巴士总站 九华径 盈晖台 盈暉臺'],
    ['offices','荔枝角政府合署','Lai Chi Kok Government Offices',-3213,-4881,'Lai Wan Road','荔枝角政府合署 荔湾道'],
    ['park','荔枝角公園','Lai Chi Kok Park',-3259,-4432,'Broadway','荔枝角公园 美孚 百老匯街'],
    ['garden','嶺南之風','Lingnan Garden',-3094,-4356,'Broadway','岭南之风 荔枝角公园 月池'],
    ['ching','清麗苑','Ching Lai Court',-3576,-4804,'Lai King Hill Road','清丽苑'],
    ['harbour-rank','荔灣道過海的士站','Lai Wan Road Cross-harbour Taxi Stand',-3346,-4573,'Lai Wan Road','荔湾道过海的士站 美孚']
  ];
  const boundary=[[-2715,-3460],[-3350,-3460],[-3850,-3870],[-4010,-4270],[-4430,-4910],[-4550,-5530],[-4260,-5990],[-3700,-6190],[-3000,-6030],[-2660,-5820],[-2310,-5560],[-2220,-5400],[-2780,-4990],[-2540,-4690],[-2520,-4500],[-2850,-4290],[-2790,-3960]];
  return {places:sites.map(([id,zh,en,x,z,street])=>['lck-'+id,zh,en,114.17+x/103055,22.296-z/110741,street]),
    aliases:Object.fromEntries(sites.map(([id,,,,,,alias])=>['lck-'+id,alias])),
    districts:[['荔枝角','Lai Chi Kok',-3210,-4630,'荔枝角 美孚 九華徑 蝴蝶谷 荔景山 Mei Foo']],
    districtAt(x,z){
      let odd=false;
      for(let i=0,j=boundary.length-1;i<boundary.length;j=i++){
        const a=boundary[i],b=boundary[j];
        if((a[1]>z)!==(b[1]>z)&&x<a[0]+(z-a[1])*(b[0]-a[0])/(b[1]-a[1]))odd=!odd;
      }
      return odd?['荔枝角','LAI CHI KOK']:null;
    }};
})();

// Ordinary street-facing tenants. The shop, projecting sign and shutter share one clock.
window.HKStreetShops=(()=>{
  const tenants=[
    ['cafe','茶餐廳','CHA CHAAN TENG','#a53931','#267867','#fff0c8'],
    ['cafe','冰室','BING SUTT','#217582','#ae4d35','#fff5d6'],
    ['watch','鐘錶行','WATCHES','#243e72','#73283e','#f8dda4'],
    ['pharmacy','中西藥房','DISPENSARY','#f5e7ca','#e7eddf','#96392e'],
    ['exchange','找換店','MONEY EXCHANGE','#f4bf49','#f7d991','#392d33'],
    ['seafood','海味行','DRIED SEAFOOD','#943b2b','#714832','#ffe4a2'],
    ['bakery','餅家','BAKERY','#aa4b52','#915524','#fff0cd'],
    ['optics','眼鏡店','OPTICAL','#366795','#654779','#f5f3e4'],
    ['books','書局','BOOKS','#514981','#9b373e','#fff0d4']
  ];
  function draw(shop,props,signs,interiors){
    const {x,y,z,nx,nz,w,tenant,blade}=shop;
    const [trade,zh,en,first,second,ink]=tenants[tenant];
    const seed=Math.abs(Math.round(x*17+z*31)),tint=seed%2?second:first;
    const angle=Math.atan2(nx,nz),hours=HKShopLights.hours(x,z);
    const at=(u,h,v)=>[x+nz*u+nx*v,y+h,z-nx*u+nz*v];
    const box=(u,h,v,width,high,depth,c)=>props.add('box',...at(u,h,v),width,high,depth,c,angle);
    const face=(tag,l,r,b,t,depth)=>signs.quad(tag,[at(l,b,depth),at(r,b,depth),at(r,t,depth),at(l,t,depth)],hours);
    const picture={mat:interiors.material,uv:interiors.uv[trade+(seed%2)]};
    const doorW=Math.min(1.15,w*.28),left=-w/2+.10,right=w/2-.10,jamb=right-doorW;
    const span=jamb-left,mid=(jamb+left)/2,frame=trade==='watch'||trade==='seafood'?'#9b7954':'#a7b6af';
    // Keep the display behind the guides. The shallow returns give the window
    // parallax without cutting into the surveyed building or widening the pavement.
    box(0,1.49,.055,w,3.16,.13,'#ada693');
    face(picture,left,jamb,.27,2.80,.145);
    const doorGlass={mat:interiors.material,uv:interiors.uv['lobby'+(seed%2)]};
    face(doorGlass,jamb+.04,right,.10,2.80,.135);
    for(const u of [left-.045,jamb,right+.045])box(u,1.44,.28,.087,2.93,.30,frame);
    box(mid,.18,.27,span,.24,.28,frame);
    box(jamb+doorW*.18,1.12,.27,.044,.43,.055,'#ddc89b');
    box(0,2.86,.30,w,.11,.44,frame);
    const ledge=(h,depth,c)=>box(mid,h,.31,span-.07,.075,depth,c);
    if(trade==='watch'||trade==='optics'){
      ledge(.72,.32,frame);
      if(trade==='optics')ledge(1.39,.19,'#d2dcd8');
      for(let i=0;i<3;i++){
        const u=left+span*(i+.5)/3;
        box(u,.79,.33,span*.19,.08,.21,'#d6c7a5');
        if(trade==='watch'){
          box(u,.96,.32,.12,.29,.075,'#735a43');
          props.add('crown',...at(u,.96,.369),.092,.094,.033,'#dbc58f',angle);
        }
      }
    }else if(trade==='cafe'){
      for(const u of [left+span*.25,left+span*.73]){
        box(u,.79,.30,.64,.075,.30,'#dcc6a0');
        box(u,.47,.27,.09,.57,.11,'#807261');box(u-.2,.62,.20,.24,.41,.12,'#a85f4c');
      }
    }else if(trade==='exchange'){
      ledge(1.02,.38,'#c8b28a');box(mid,1.78,.25,.052,1.44,.075,frame);
    }else if(trade==='bakery'||trade==='seafood'){
      ledge(.64,.31,'#ab8960');
      for(let i=0;i<5;i++){
        const u=left+span*(i+.5)/5;
        if(trade==='bakery')props.add('crown',...at(u,.755,.32),.17,.10,.095,i%2?'#cb8b42':'#ecb960',angle);
        else{
          props.add('tank',...at(u,.85,.30),.14,.37,.12,'#bd905a',angle);
          box(u,.89,.42,.12,.067,.014,'#eed9a5');
        }
      }
    }else{
      // Paperbacks face out on a low bookstand; medicine cartons sit on two shelves.
      for(let row=0;row<(trade==='books'?1:2);row++){
        const base=.64+row*.67;ledge(base,.29,frame);
        for(let i=0;i<5;i++){
          const u=left+span*(i+.5)/5;
          box(u,base+.18,.31,span*.12,.26+(i%3)*.034,.12,
            (trade==='books'?['#bb6955','#c3a35e','#62818a']:['#ebe0cf','#a1b7a0','#e2b5ab'])[i%3]);
        }
      }
    }
    box(0,3.30,.29,w,.86,.54,tint);
    face(HKDetails.shopBoard(zh,en,tint,ink,w*.98,.77,trade),-w*.49,w*.49,2.92,3.69,.57);
    for(const u of [left,right])box(u,1.42,.49,.06,2.88,.08,'#89958f');
    props.shopShutter(at,0,1.42,.49,w-.24,2.88,hours);
    if(blade){
      const tall=seed%3!==0,u=-w*.31,inner=.12,outer=tall?.84:.98,lo=4.08,hi=lo+(tall?1.76:.48);
      box(u,hi+.06,.45,.065,.08,.90,'#74776e');
      box(u,(lo+hi)/2,(inner+outer)/2,.14,hi-lo,outer-inner,tint);
      const tag=HKDetails.shopBoard(zh,'',tint,ink,outer-inner,hi-lo,trade);
      for(const side of [-1,1]){
        const edge=u+side*.075,a=side>0?outer:inner,b=side>0?inner:outer;
        signs.quad(tag,[at(edge,lo,a),at(edge,lo,b),at(edge,hi,b),at(edge,hi,a)],hours);
      }
    }
  }
  return {tenants,draw};
})();

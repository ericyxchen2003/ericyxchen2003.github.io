// The simulation clock advances one game minute per three seconds of active play.
window.HKDayCycle = (() => {
  'use strict';
  const shifts = [
    {label:'早班', minutes:6*60},
    {label:'日班', minutes:16*60+30},
    {label:'夜班', minutes:20*60}
  ];
  const defaultStart = shifts[1].minutes;
  const daySeconds = 72*60;
  const secondsPerMinute = daySeconds/(24*60);
  function createClock(){
    let seconds = defaultStart*secondsPerMinute;
    return {
      get minutes(){return (seconds%daySeconds)/secondsPerMinute;},
      get totalMinutes(){return seconds/secondsPerMinute;},
      startAt(minutes){seconds=minutes*secondsPerMinute;},
      advance(elapsed){seconds+=elapsed;}
    };
  }
  function format(minutes){
    const m=Math.floor(minutes);
    return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  }
  function smooth(a,b,x){
    const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
    return t*t*(3-2*t);
  }
  function lighting(minutes){
    const angle=(minutes/1440-.25)*2*Math.PI;
    const arc=Math.sin(angle), elevation=.92*arc;
    return {
      east:Math.cos(angle),up:elevation,south:.392*arc,
      day:smooth(-.18,.32,elevation),
      twilight:smooth(-.22,-.02,elevation)*(1-smooth(.02,.36,elevation)),
      lamps:1-smooth(-.13,.13,elevation)
    };
  }
  return {shifts,defaultStart,createClock,format,lighting};
})();

// Identical shop hours in near tiles, on both sides of a blade sign and after
// streaming a block back in. Two shared uniforms update the whole district.
window.HKShopLights=(()=>{
  const time={value:0},day={value:1},materials=new WeakMap();
  const firstOpening=8*60, lastOpening=firstOpening+90, firstClosing=21*60;
  let display,shutter;
  function hours(x,z){
    let hash=Math.imul(Math.round(x*10),73856093)^Math.imul(Math.round(z*10),19349663);
    const random=()=>{hash=Math.imul(hash^(hash>>>16),0x45d9f3b);return (hash>>>0)/4294967296;};
    const start=firstOpening+random()*(lastOpening-firstOpening),late=random()<.13;
    return [start,firstClosing+(late?158+random()*136:random()*156)];
  }
  function shade(mat,kind){
    mat.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,{shopMinute:time,shopDay:day});
      shader.vertexShader='attribute vec2 shopHours; uniform float shopMinute; varying float shopOn;\n'+
        shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          shopOn=smoothstep(shopHours.x,shopHours.x+8.0,shopMinute)*
                 (1.0-smoothstep(shopHours.y,shopHours.y+9.0,shopMinute));`);
      let lighting;
      if(kind==='shutter'){
        shader.vertexShader='varying vec2 panelUV;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\npanelUV=uv;');
        shader.fragmentShader='varying vec2 panelUV;\n'+shader.fragmentShader;
        lighting=`float sheet=panelUV.y-shopOn;
          if(shopOn>=1.0 || sheet<0.0) discard;
          float slats=sheet*29.0;
          float ridge=cos(slats*6.28318)*(1.0-smoothstep(0.18,0.65,fwidth(slats)));
          outgoingLight*=sheet<0.028?0.56:0.95+0.16*ridge;`;
      }else if(kind==='display'){
        lighting='outgoingLight *= shopOn*mix(1.0,0.30,shopDay);';
      }else{
        lighting='outgoingLight *= mix(0.075,0.90,shopDay)+shopOn*mix(1.65,0.16,shopDay);';
      }
      shader.fragmentShader='varying float shopOn; uniform float shopDay;\n'+
        shader.fragmentShader.replace('#include <opaque_fragment>',lighting+'\n#include <opaque_fragment>');
    };
    mat.customProgramCacheKey=()=>'shop-'+kind;
    return mat;
  }
  function material(base){
    if(!materials.has(base))materials.set(base,shade(base.clone(),'lettering'));
    return materials.get(base);
  }
  function setTime(minutes,daylight){
    const minute=((minutes%1440)+1440)%1440;
    time.value=minute<firstOpening?minute+1440:minute;day.value=daylight;
    if(display)display.visible=time.value<firstClosing+294+9;
    if(shutter)shutter.visible=time.value<lastOpening+8||time.value>=firstClosing;
  }
  return {hours,material,setTime,get display(){
    if(!display){
      const T=THREE;
      display=shade(new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,
        depthWrite:false,blending:T.AdditiveBlending,opacity:.93}),'display');
      display.forceSinglePass=true;display.visible=time.value<firstClosing+294+9;
    }
    return display;
  },get shutter(){
    if(!shutter){
      shutter=shade(new THREE.MeshLambertMaterial({color:0xb2b6ad,side:THREE.DoubleSide}),'shutter');
      shutter.extensions={derivatives:true};
      shutter.visible=time.value<lastOpening+8||time.value>=firstClosing;
    }
    return shutter;
  }};
})();

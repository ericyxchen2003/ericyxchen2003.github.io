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
  let display;
  function hours(x,z){
    let hash=Math.imul(Math.round(x*10),73856093)^Math.imul(Math.round(z*10),19349663);
    const random=()=>{hash=Math.imul(hash^(hash>>>16),0x45d9f3b);return (hash>>>0)/4294967296;};
    const start=17*60+random()*114,late=random()<.13;
    return [start,21*60+(late?158+random()*136:random()*156)];
  }
  function shade(mat,overlay){
    mat.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,{shopMinute:time,shopDay:day});
      shader.vertexShader='attribute vec2 shopHours; uniform float shopMinute; varying float shopOn;\n'+
        shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          shopOn=smoothstep(shopHours.x,shopHours.x+8.0,shopMinute)*
                 (1.0-smoothstep(shopHours.y,shopHours.y+9.0,shopMinute));`);
      shader.fragmentShader='varying float shopOn; uniform float shopDay;\n'+
        shader.fragmentShader.replace('#include <opaque_fragment>',(overlay?
          'outgoingLight *= shopOn;':'outgoingLight *= mix(0.075,1.0,shopDay)+shopOn*(1.65-0.85*shopDay);')+'\n#include <opaque_fragment>');
    };
    mat.customProgramCacheKey=()=>overlay?'shop-display':'shop-lettering';
    return mat;
  }
  function material(base){
    if(!materials.has(base))materials.set(base,shade(base.clone(),false));
    return materials.get(base);
  }
  function setTime(minutes,daylight){
    time.value=minutes<12*60?minutes+1440:minutes;day.value=daylight;
    if(display)display.visible=time.value>=1020&&time.value<1566;
  }
  return {hours,material,setTime,get display(){
    if(!display){
      const T=THREE;
      display=shade(new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,
        depthWrite:false,blending:T.AdditiveBlending,opacity:.93}),true);
      display.forceSinglePass=true;display.visible=time.value>=1020&&time.value<1566;
    }
    return display;
  }};
})();

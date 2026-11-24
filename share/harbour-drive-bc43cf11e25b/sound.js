/* Unlock driving audio from a menu gesture; the engine starts with the drive. */
window.HKSound=(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  let context,master,engine,tone,pulse,volume,enabled=Boolean(Audio);
  function setup(){
    try{context=new Audio();}catch{enabled=false;return;}
    master=context.createGain();master.gain.value=1;master.connect(context.destination);
    engine=context.createBiquadFilter();engine.type='lowpass';engine.frequency.value=155;engine.Q.value=.65;
    volume=context.createGain();volume.gain.value=0;volume.connect(engine);engine.connect(master);
    tone=context.createOscillator();tone.type='sawtooth';tone.frequency.value=39;tone.connect(volume);tone.start();
    pulse=context.createOscillator();pulse.type='triangle';pulse.frequency.value=19.5;const overtone=context.createGain();overtone.gain.value=.45;pulse.connect(overtone);overtone.connect(volume);pulse.start();
  }
  function activate(){
    if(!enabled)return;
    if(!context)setup();
    if(context&&context.state!=='running')context.resume().catch(()=>{});
  }
  function toggle(){
    enabled=Boolean(Audio)&&!enabled;
    if(enabled)activate();
    if(context)master.gain.setTargetAtTime(enabled?1:0,context.currentTime,.055);
    return enabled;
  }
  function step(speed,throttle,paused){
    if(!enabled||!context)return;const kmh=Math.abs(speed)*3.6,t=context.currentTime;
    const gear=kmh<20?0:kmh<38?1:2, rev=33+(kmh-[0,13,26][gear])*1.1+(throttle?13:0);
    tone.frequency.setTargetAtTime(rev,t,.12);pulse.frequency.setTargetAtTime(rev*.50,t,.12);engine.frequency.setTargetAtTime(120+rev*(throttle?1.15:.7),t,.13);
    volume.gain.setTargetAtTime(paused?0:throttle?.077:.045,t,.1);
  }
  function horn(){
    if(!enabled||!context)return;const t=context.currentTime;
    const g=context.createGain();g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(.038,t+.025);g.gain.setValueAtTime(.038,t+.25);g.gain.exponentialRampToValueAtTime(.001,t+.34);g.connect(master);
    for(const hz of [340,423]){const o=context.createOscillator();o.type='triangle';o.frequency.value=hz;o.connect(g);o.start(t);o.stop(t+.35);o.onended=()=>o.disconnect();}
  }
  function note(start,hz,duration,level,type){
    const oscillator=context.createOscillator(),envelope=context.createGain();
    oscillator.type=type;oscillator.frequency.value=hz;
    envelope.gain.setValueAtTime(0,start);
    envelope.gain.linearRampToValueAtTime(level,start+.008);
    envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(envelope);envelope.connect(master);
    oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
    oscillator.start(start);oscillator.stop(start+duration);
  }
  function pickup(){
    if(!enabled||context?.state!=='running')return;
    const t=context.currentTime;
    note(t,587,.13,.10,'triangle');
    note(t+.15,784,.23,.10,'triangle');
  }
  function payment(){
    if(!enabled||context?.state!=='running')return;
    const t=context.currentTime;
    note(t,1319,.085,.085,'sine');
    note(t+.09,1760,.28,.080,'sine');
    note(t+.09,2850,.11,.024,'sine');
  }
  return {activate,toggle,step,horn,pickup,payment,get enabled(){return enabled;}};
})();

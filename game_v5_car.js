import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x070a12);scene.fog=new THREE.Fog(0x070a12,75,560);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.03,1400);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xa8b8ff,0x11151e,2.0));
const sun=new THREE.DirectionalLight(0xffffff,2.7);sun.position.set(-35,65,30);sun.castShadow=true;scene.add(sun);
const world=new THREE.Group(),road=new THREE.Group(),trafficGroup=new THREE.Group();scene.add(world,road,trafficGroup);
const lanes=[-5.7,-2.85,0,2.85,5.7];
const cars={supra:['SUPRA-X',0xff6b17,330,120,'wide'],gtr:['GTR-X',0xe9eef5,350,118,'gtr'],gt:['GT-V12',0x246bff,365,112,'grand'],rally:['RALLY-X',0xff285c,315,130,'rally'],rx7:['RX-7R',0xffd22e,325,126,'rotary'],silvia:['SILVIA-S',0x7c55ff,310,124,'drift'],evo:['EVO-XR',0x35b9a8,320,132,'rally'],muscle:['V8-BEAST',0x9c2028,305,110,'muscle'],hyper:['HYPER-Z',0x0ee7ff,390,105,'hyper'],retro:['RETRO-GT',0xd6b07a,285,96,'retro']};
const state={car:localStorage.getItem('legend_car')||'gtr',speed:0,nitro:100,distance:0,score:0,running:false,crashed:false,cam:0,steer:0};
const M=(c,metal=.55,rough=.22,em=0)=>new THREE.MeshStandardMaterial({color:c,metalness:metal,roughness:rough,emissive:em,emissiveIntensity:em?2.8:0});
function add(g,o,p){o.position.set(...p);o.castShadow=true;o.receiveShadow=true;g.add(o);return o}
function box(g,w,h,d,c,p,material=M(c)){return add(g,new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material),p)}
function cyl(g,r,h,c,p,rot=[0,0,0],material=M(c)){const o=add(g,new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),material),p);o.rotation.set(...rot);return o}

function loftBody(g,color){
  const sections=[
    [-2.36,.62,.34,.60],[-2.08,.91,.39,.64],[-1.65,1.00,.52,.72],[-.95,1.03,.57,.78],[0,1.06,.58,.80],[.95,1.05,.57,.79],[1.65,1.01,.54,.74],[2.10,.94,.46,.68],[2.36,.72,.36,.60]
  ];
  const n=12,verts=[],idx=[];
  for(const [z,w,low,high] of sections){for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2;const x=Math.cos(a)*w;let y=.66+Math.sin(a)*high;if(y>1.40)y=1.40-(Math.abs(x)/Math.max(w,.01))*.035; if(y<.52)y=.52+Math.abs(Math.cos(a))*.04; verts.push(x,y,z)}}
  for(let s=0;s<sections.length-1;s++)for(let i=0;i<n;i++){const a=s*n+i,b=s*n+(i+1)%n,c=(s+1)*n+(i+1)%n,d=(s+1)*n+i;idx.push(a,b,c,a,c,d)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();return add(g,new THREE.Mesh(geo,M(color,.88,.15)),[0,0,0]);
}
function sideProfile(g,color){
  const shape=new THREE.Shape();
  const pts=[[-2.05,.88],[-1.72,.96],[-1.25,1.02],[-.82,1.10],[-.50,1.40],[.15,1.47],[.82,1.42],[1.20,1.16],[1.82,1.06],[2.16,.93],[2.24,.82],[1.85,.80],[-1.80,.80]];
  shape.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)shape.lineTo(pts[i][0],pts[i][1]);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:1.72,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.035});geo.center();geo.rotateY(Math.PI/2);geo.translate(0,0,0);
  const roof=add(g,new THREE.Mesh(geo,M(color,.88,.16)),[0,0,0]);
  roof.scale.set(.001,1,1); // hidden; body silhouette comes from loft; this keeps the profile geometry ready without duplicating visual mass
  return roof;
}
function wheel(g,x,z,color){
  const tire=add(g,new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.30,32),M(0x050607,.05,.92)),[x,.48,z]);tire.rotation.z=Math.PI/2;
  const rim=add(g,new THREE.Mesh(new THREE.CylinderGeometry(.285,.285,.31,24),M(0x9aa4b2,.94,.15)),[x,.48,z]);rim.rotation.z=Math.PI/2;
  for(let i=0;i<10;i++){const spoke=box(g,.035,.055,.42,0xcfd6de,[x,.48,z],M(0xcfd6de,.92,.14));spoke.rotation.z=Math.PI/2;spoke.rotation.y=i*Math.PI/5}
  const hub=add(g,new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.33,20),M(0x343b46,.9,.16)),[x,.48,z]);hub.rotation.z=Math.PI/2;
}
function makeGTR(color,traffic=false){
  const g=new THREE.Group();g.userData.car='GTR-X';
  const body=M(color,.9,.14),black=M(0x07090d,.18,.72),glass=M(0x071725,.72,.08),chrome=M(0xc7ced7,.95,.12),led=M(0xc9efff,.15,.06,0x9edcff),red=M(0xff174d,.12,.08,0xff174d);
  // R35 proportions: long hood, wide shoulders, short rear deck, low roof.
  loftBody(g,color);
  // hood center and shoulder creases
  box(g,1.25,.035,1.15,color,[0,1.01,-1.15],body);
  for(const x of[-.76,.76])box(g,.055,.035,1.18,0x252a31,[x,1.045,-1.13],M(0x252a31,.75,.22));
  // front fascia and grille
  box(g,1.52,.28,.12,0x080a0e,[0,.72,-2.31],black);
  const grille=box(g,1.34,.34,.045,0x020305,[0,.68,-2.37],M(0x020305,.02,.95));
  box(g,.34,.05,.055,0x16191e,[0,.83,-2.40],M(0x16191e,.75,.25));
  box(g,.78,.055,.04,0x15181e,[0,.55,-2.39],black);
  // R35-like headlights: tall outer lamps and inner LED strips
  for(const x of[-.72,.72]){
    const lamp=box(g,.34,.18,.08,0xdfeeff,[x,.92,-2.30],M(0xdfeeff,.18,.08,0x9edcff));lamp.rotation.z=x>0?-0.12:0.12;
    box(g,.055,.18,.045,0xffffff,[x+(x>0?-0.12:0.12),.92,-2.36],led);
    box(g,.12,.055,.045,0xefffff,[x+(x>0?-0.04:0.04),.84,-2.36],led);
  }
  // lower DRL bars
  for(const x of[-.72,.72])box(g,.13,.30,.05,0xeafaff,[x,.67,-2.37],led);
  // side vents and skirts
  for(const x of[-1,1]){box(g,.13,.30,.42,0x090b10,[x*.98,.70,-.45],black);box(g,.08,.22,.25,0x0b0d12,[x*1.01,.71,-.47],black);box(g,.10,.09,3.05,0x0b0d11,[x*1.01,.49,.15],black)}
  // cabin: steep windshield, roof, rear glass
  const cabin=new THREE.Group();g.add(cabin);
  const cabinMat=M(color,.86,.17);
  const roof=box(cabin,1.45,.12,1.48,color,[0,1.45,.12],cabinMat);roof.scale.x=.98;
  box(cabin,1.38,.06,.74,glass,[0,1.35,-.55],glass);
  box(cabin,1.34,.06,.58,glass,[0,1.37,.72],glass);
  for(const x of[-.71,.71])box(cabin,.055,.40,1.30,0x0b0d11,[x,1.27,.10],black);
  // mirrors
  for(const x of[-1,1]){box(g,.16,.10,.30,black,[x*.99,1.20,-.28],black);box(g,.13,.05,.17,0x709db9,[x*1.01,1.22,-.28],glass)}
  // rear deck and spoiler
  box(g,1.68,.16,.62,color,[0,.91,1.72],body);
  box(g,1.48,.07,.15,black,[0,1.30,1.88],black);for(const x of[-.58,.58])box(g,.06,.26,.08,black,[x,1.17,1.86],black);
  // four circular GT-R tail lamps
  for(const x of[-.48,.48])for(const z of[2.25]){cyl(g,.19,.06,0x2a0b12,[x,.88,z],[Math.PI/2,0,0],red);cyl(g,.105,.065,0xffe2e7,[x,.88,z+.015],[Math.PI/2,0,0],M(0xffe2e7,.1,.08,0xff5a6f))}
  // rear bumper / diffuser / quad exhaust
  box(g,1.60,.24,.13,black,[0,.62,2.33],black);box(g,1.18,.10,.16,0x30343b,[0,.53,2.38],M(0x30343b,.8,.22));
  for(const x of[-.58,-.28,.28,.58])cyl(g,.105,.20,0xb4bcc5,[x,.58,2.42],[Math.PI/2,0,0],chrome);
  for(const x of[-.86,.86])box(g,.06,.07,.22,red,[x,.83,2.34],red);
  // wheels match GT-R wide-track stance
  for(const x of[-.96,.96])for(const z of[-1.43,1.48])wheel(g,x,z,color);
  if(!traffic){
    // real cockpit silhouette
    box(cabin,1.48,.16,.32,0x11151b,[0,1.02,-.72],black);
    for(const x of[-.58,.58]){box(cabin,.52,.62,.72,0x11151a,[x,.74,.40],M(0x11151a,.15,.72));box(cabin,.38,.10,.18,0x1c222b,[x,.99,.40],M(0x1c222b,.25,.42))}
    box(cabin,1.32,.06,.08,0x0b1017,[0,1.15,-1.05],black);
    box(cabin,.56,.06,.05,0x0b3140,[0,1.18,-1.06],M(0x0b3140,.5,.08,0x0bdcff));
    const steering=add(cabin,new THREE.Mesh(new THREE.TorusGeometry(.29,.055,16,40),chrome),[-.53,.94,-.99]);steering.rotation.x=Math.PI/2;
    const hub=cyl(cabin,.07,.10,chrome,[-.53,.94,-.99],[Math.PI/2,0,0],chrome);
    for(let i=0;i<3;i++){const s=box(cabin,.035,.27,.04,0xaeb8c3,[-.53,.94,-.99],chrome);s.rotation.z=i*2.094}
    box(cabin,.72,.06,.06,0x111820,[.28,1.13,-1.02],black);
    box(cabin,.34,.035,.04,0x19d9ff,[.28,1.18,-1.03],M(0x19d9ff,.15,.08,0x19d9ff));
    g.userData.cockpit=new THREE.Vector3(-.02,1.18,-.63);
  }
  return g;
}
function makeGeneric(spec,traffic=false){const [name,color,max,acc,style]=spec;if(name==='GTR-X'||style==='gtr')return makeGTR(color,traffic);const g=makeGTR(color,true);g.userData.car=name;g.scale.set(style==='hyper'?1.02:1,.96,style==='retro'?.98:1);return g}
let player=makeGeneric(cars[state.car]);scene.add(player);

function buildWorld(){const ground=add(world,new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),M(0x0d111b,.02,.98)),[0,-.06,-2500]);ground.rotation.x=-Math.PI/2;const rm=M(0x252a33,.08,.84),line=M(0xf0eee7,.1,.62),rail=M(0x3153ff,.65,.25,0x1d34ff);for(let i=0;i<45;i++){const s=new THREE.Group();const r=add(s,new THREE.Mesh(new THREE.PlaneGeometry(18,40),rm),[0,0,0]);r.rotation.x=-Math.PI/2;for(const x of[-9.5,9.5])box(s,.22,.20,40,0x3153ff,[x,.1,0],rail);for(const x of[-4.275,-1.425,1.425,4.275]){const q=add(s,new THREE.Mesh(new THREE.PlaneGeometry(.13,5),line),[x,.045,-10]);q.rotation.x=-Math.PI/2}s.position.z=20-i*40;road.add(s)}}buildWorld();
const traffic=[];function buildTraffic(){for(let i=0;i<20;i++){const cols=[0xffffff,0x171a20,0xd93d50,0xffc72b,0x487cff,0x26b36b,0x956cff];const t=makeGeneric(['TRAFFIC',cols[i%cols.length],280,100,'gtr'],true);t.userData.speed=65+Math.random()*120;t.userData.lane=1+Math.floor(Math.random()*4);t.position.set(lanes[t.userData.lane],0,-80-i*62-Math.random()*25);trafficGroup.add(t);traffic.push(t)}}buildTraffic();
const roadSegments=[...road.children];
function reset(){state.speed=0;state.nitro=100;state.distance=0;state.score=0;state.crashed=false;player.position.set(0,0,0);player.rotation.set(0,0,0);document.getElementById('crashOverlay')?.remove();traffic.forEach((t,i)=>{t.position.x=lanes[t.userData.lane];t.position.z=-80-i*62-Math.random()*25})}
function crash(){if(state.crashed)return;state.crashed=true;state.speed=0;const d=document.createElement('div');d.id='crashOverlay';d.style.cssText='position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#050711aa;color:#fff;font-family:system-ui;text-align:center';d.innerHTML='<div><div style="font-size:64px;font-weight:1000;color:#ff4b1d">CRASH</div><div>R = restart</div></div>';document.body.appendChild(d)}
function start(){document.getElementById('menu').style.display='none';document.getElementById('hud').style.display='flex';document.getElementById('back').style.display='block';state.running=true;reset()}
function stop(){state.running=false;document.getElementById('menu').style.display='flex';document.getElementById('hud').style.display='none';document.getElementById('back').style.display='none'}
window.addEventListener('legend:start',start);
window.addEventListener('legend:car',e=>{const id=e.detail?.id;if(!cars[id])return;state.car=id;scene.remove(player);player=makeGeneric(cars[id]);scene.add(player);reset()});
document.getElementById('back')?.addEventListener('click',stop);
addEventListener('keydown',e=>{if(e.repeat)return;const k=e.code;window.__keys=window.__keys||{};window.__keys[k]=true;if(k==='KeyR')reset();if(k==='KeyC')state.cam=(state.cam+1)%3;if(k==='Escape')stop()});addEventListener('keyup',e=>{window.__keys=window.__keys||{};window.__keys[e.code]=false});
const keysProxy=()=>window.__keys||{};document.querySelectorAll('.touch').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();(window.__keys||={})[k]=true});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{(window.__keys||={})[k]=false}))});addEventListener('blur',()=>{window.__keys={}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;const keys=keysProxy();if(state.running&&!state.crashed){const d=cars[state.car],gas=keys.KeyW||keys.ArrowUp,brake=keys.KeyS||keys.ArrowDown;if(gas)state.speed+=d[3]*dt;else state.speed-=30*dt;if(brake)state.speed-=110*dt;const boost=(keys.ShiftLeft||keys.ShiftRight)&&state.nitro>0;if(boost){state.speed+=150*dt;state.nitro-=42*dt}else state.nitro=Math.min(100,state.nitro+9*dt);state.speed=THREE.MathUtils.clamp(state.speed,0,d[2]);const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);state.steer+=(steer-state.steer)*Math.min(1,dt*11);player.position.x=THREE.MathUtils.clamp(player.position.x+state.steer*(7.1+state.speed*.018)*dt,-7.15,7.15);player.rotation.z=-state.steer*.055;const ws=state.speed/3.6*.72;for(const s of roadSegments){s.position.z+=ws*dt;if(s.position.z>45){let min=Infinity;for(const q of roadSegments)if(q.position.z<min)min=q.position.z;s.position.z=min-40}}for(const t of traffic){t.position.z+=(t.userData.speed/3.6)*.72*dt;if(t.position.z>35){t.position.z=-1000-Math.random()*700;t.position.x=lanes[1+Math.floor(Math.random()*4)]}if(Math.abs(t.position.x-player.position.x)<1.65&&Math.abs(t.position.z)<2.9)crash()}state.distance+=state.speed/3.6*dt;state.score+=state.speed*dt*.5}
let target;if(state.cam===0)target=new THREE.Vector3(player.position.x-state.steer*.6,3.35,player.position.z+11);else if(state.cam===1)target=new THREE.Vector3(player.position.x-state.steer*.2,2.20,player.position.z+5.8);else {const cp=player.userData.cockpit||new THREE.Vector3(0,1.18,-.63);target=new THREE.Vector3(player.position.x+cp.x-.12,cp.y,player.position.z+cp.z)}camera.position.lerp(target,state.cam===2?.22:.12);camera.lookAt(player.position.x-(state.cam===2?.10:0),state.cam===2?1.20:.82,player.position.z-14);const sp=document.getElementById('speed'),sc=document.getElementById('score'),di=document.getElementById('distance'),ni=document.getElementById('nitro');if(sp)sp.textContent=Math.round(state.speed);if(sc)sc.textContent=Math.floor(state.score).toLocaleString();if(di)di.textContent=Math.floor(state.distance)+' m';if(ni)ni.textContent=Math.round(state.nitro)+'%';renderer.render(scene,camera);requestAnimationFrame(loop)}requestAnimationFrame(loop);
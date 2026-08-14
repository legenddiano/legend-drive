import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.05,700);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.appendChild(renderer.domElement);

const world=new THREE.Group(),road=new THREE.Group(),trafficGroup=new THREE.Group();scene.add(world,road,trafficGroup);
const lanes=[-5.7,-2.85,0,2.85,5.7];
const state={speed:0,nitro:100,distance:0,score:0,running:false,crashed:false,mode:'infinite',env:'neon',car:'supra',steer:0,cam:0};
const keys={};
const defs={
 supra:{name:'SUPRA-X',color:0xff7117,max:330,acc:95,handling:8.8},
 gtr:{name:'GTR-X',color:0xe8edf4,max:350,acc:92,handling:9.4},
 gt:{name:'GT-V12',color:0x246bff,max:365,acc:88,handling:8.2},
 rally:{name:'RALLY-X',color:0xff285b,max:315,acc:105,handling:9.6}
};
const trafficColors=[0xf3f5f7,0x171b22,0xd6384c,0xffc72c,0x3f7cff,0x24b46b,0x8d5cff];

function mat(color,metal=.4,rough=.28,emissive=0){return new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough,emissive:emissive,emissiveIntensity:emissive?2.4:0});}
function box(g,w,h,d,x,y,z,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function wheel(g,x,z,color){const tire=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.28,24),mat(0x08090c,.05,.8));tire.rotation.z=Math.PI/2;tire.position.set(x,.4,z);tire.castShadow=true;g.add(tire);const rim=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.3,20),mat(color,.85,.16));rim.rotation.z=Math.PI/2;rim.position.set(x,.4,z);g.add(rim);}

// Front of every car is -Z. This convention is used everywhere in the driving code.
function makeCar(def,traffic=false){
 const g=new THREE.Group();
 const bodyMat=mat(def.color,.72,.2);
 const lower=box(g,1.95,.45,4.25,0,.57,0,bodyMat);
 lower.scale.y=.92;
 const hood=box(g,1.82,.22,1.28,0,.83,-1.42,bodyMat);hood.rotation.x=-.04;
 const rear=box(g,1.9,.2,.7,0,.77,1.73,bodyMat);
 const cabin=box(g,1.52,.62,1.72,0,1.08,-.05,mat(0x101724,.65,.12));cabin.scale.x=.98;
 const roof=box(g,1.36,.08,1.35,0,1.39,-.05,mat(def.color,.65,.2));
 const windshield=box(g,1.28,.035,.82,0,1.18,-.73,mat(0x77d8ff,.45,.08,0x14384d));windshield.rotation.x=-.18;
 const rearGlass=box(g,1.28,.035,.7,0,1.18,.7,mat(0x172231,.5,.12));rearGlass.rotation.x=.18;
 // aggressive front fascia
 box(g,1.72,.16,.15,0,.53,-2.14,mat(0x080b10,.35,.22));
 box(g,.58,.1,.12,-.58,.82,-2.16,mat(0xf8fcff,.25,.12,0xf8fcff));
 box(g,.58,.1,.12,.58,.82,-2.16,mat(0xf8fcff,.25,.12,0xf8fcff));
 box(g,.72,.09,.1,-.52,.64,2.08,mat(0xff174d,.2,.12,0xff174d));
 box(g,.72,.09,.1,.52,.64,2.08,mat(0xff174d,.2,.12,0xff174d));
 // mirrors
 box(g,.12,.12,.35,-1.04,1.08,-.55,bodyMat);box(g,.12,.12,.35,1.04,1.08,-.55,bodyMat);
 // spoiler on sport cars
 if(def.name!=='GT-V12'){box(g,1.72,.09,.16,0,1.22,1.92,bodyMat);box(g,.09,.38,.08,-.72,1.04,1.84,mat(0x111318,.6,.25));box(g,.09,.38,.08,.72,1.04,1.84,mat(0x111318,.6,.25));}
 for(const x of[-.98,.98])for(const z of[-1.45,1.45])wheel(g,x,z,def.color);
 if(!traffic){const under=box(g,1.45,.035,.18,0,.28,1.98,mat(0x16d9ff,.1,.15,0x16d9ff));under.scale.x=.85;}
 return g;
}

let player=makeCar(defs[state.car]);player.position.set(0,0,8);scene.add(player);

function clearGroup(g){while(g.children.length)g.remove(g.children[0]);}
function lighting(){clearGroup(world);clearGroup(road);const e=state.env;let sky=0x070a18,ground=0x101522,roadColor=0x252a33;
 if(e==='day'){sky=0x87b8d8;ground=0x426448;roadColor=0x343941}
 if(e==='sunset'){sky=0x4b2730;ground=0x3c2927;roadColor=0x2e2d34}
 if(e==='desert'){sky=0xd49a68;ground=0x9a6844;roadColor=0x363337}
 scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,70,420);
 const hemi=new THREE.HemisphereLight(e==='day'?0xe8f5ff:0x8e9cff,0x12151d,2.0);scene.add(hemi);
 const sun=new THREE.DirectionalLight(e==='sunset'?0xffa35c:0xffffff,2.7);sun.position.set(-35,65,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
 const gm=mat(ground,.03,.98),rm=mat(roadColor,.08,.8),line=mat(0xf0eee5,.1,.65),rail=mat(e==='neon'?0x2948ff:0x697078,.65,.25,e==='neon'?0x172cff:0);
 const groundMesh=new THREE.Mesh(new THREE.PlaneGeometry(700,1200),gm);groundMesh.rotation.x=-Math.PI/2;groundMesh.position.set(0,-.03,-300);world.add(groundMesh);
 for(let i=0;i<55;i++){
  const z=30-i*28;const seg=new THREE.Group();
  const r=new THREE.Mesh(new THREE.PlaneGeometry(18,28),rm);r.rotation.x=-Math.PI/2;r.position.y=.01;seg.add(r);
  for(const x of[-9.5,9.5]){box(seg,.22,.22,28,x,.11,0,rail);box(seg,1.25,.035,28,x*1.03,.035,0,gm);}
  for(const x of[-4.275,-1.425,1.425,4.275]){const l=new THREE.Mesh(new THREE.PlaneGeometry(.13,4.8),line);l.rotation.x=-Math.PI/2;l.position.set(x,.04,-3);seg.add(l);}
  if(i%2===0){for(const x of[-11.2,11.2]){box(seg,.1,5.4,.1,e==='neon'?0x252b3a:0x555a60,x,2.7,5,rail);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),mat(e==='neon'?0x25d8ff:0xffedb0,.1,.1,e==='neon'?0x25d8ff:0xffcf63));lamp.position.set(x,5.4,5);seg.add(lamp);}}
  seg.position.z=z;road.add(seg);
 }
 if(e==='neon'){
  for(let i=0;i<60;i++){const side=i%2?-1:1,x=side*(13+Math.random()*26),z=-i*22-Math.random()*20,h=5+Math.random()*24,w=3+Math.random()*5;box(world,w,h,w,0x11182a,x,h/2,z);if(i%3===0)box(world,w*.82,.12,.12,i%2?0xff36c8:0x20dfff,x,h*.68,z-w/2,mat(i%2?0xff36c8:0x20dfff,.1,.12,i%2?0xff36c8:0x20dfff));}
 }else{
  for(let i=0;i<55;i++){const side=i%2?-1:1,x=side*(14+Math.random()*27),z=-i*25-Math.random()*15,h=e==='desert'?2+Math.random()*7:4+Math.random()*12,w=2+Math.random()*6;box(world,w,h,w,e==='desert'?0x8e5f43:0x385047,x,h/2,z);}
 }
}
lighting();

const traffic=[];
function spawnTraffic(i){
 const oncoming=state.mode==='two'&&i%3===0;
 const d={color:trafficColors[i%trafficColors.length],name:'TRAFFIC',max:100};
 const car=makeCar(d,true);
 car.userData.oncoming=oncoming;
 car.userData.speed=oncoming?(62+Math.random()*34):(48+Math.random()*55);
 car.userData.lane=oncoming?Math.floor(Math.random()*2):2+Math.floor(Math.random()*3);
 car.position.x=lanes[car.userData.lane];
 car.position.z=oncoming?(-65-i*34-Math.random()*25):(-45-i*34-Math.random()*25);
 // Oncoming traffic faces +Z and moves +Z. Same-direction traffic faces -Z and moves -Z.
 car.rotation.y=oncoming?Math.PI:0;
 trafficGroup.add(car);traffic.push(car);
}
function rebuildTraffic(){clearGroup(trafficGroup);traffic.length=0;for(let i=0;i<24;i++)spawnTraffic(i);}
rebuildTraffic();

function reset(){state.speed=0;state.nitro=100;state.distance=0;state.score=0;state.crashed=false;player.position.set(0,0,8);player.rotation.set(0,0,0);const old=document.getElementById('crashOverlay');if(old)old.remove();for(let i=0;i<traffic.length;i++){const t=traffic[i];t.position.x=lanes[t.userData.lane];t.position.z=t.userData.oncoming?(-65-i*34-Math.random()*20):(-45-i*34-Math.random()*25);t.rotation.y=t.userData.oncoming?Math.PI:0;}}
function crash(){if(state.crashed)return;state.crashed=true;state.speed*=.18;const d=document.createElement('div');d.id='crashOverlay';d.style.cssText='position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#050711aa;backdrop-filter:blur(5px);font-family:system-ui;color:#fff;text-align:center';d.innerHTML='<div><div style="font-size:64px;font-weight:1000;font-style:italic;color:#ff4b1d">CRASH</div><div style="opacity:.8">R = restart</div></div>';document.body.appendChild(d);}
function start(){document.getElementById('menu').style.display='none';document.getElementById('hud').style.display='flex';document.getElementById('back').style.display='block';state.running=true;reset();}
function stop(){state.running=false;document.getElementById('menu').style.display='flex';document.getElementById('hud').style.display='none';document.getElementById('back').style.display='none';}

// Menu compatibility with the existing Legend Drive UI.
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{const type=b.dataset.open;if(type==='modes'){state.mode='infinite';state.env='neon';start();}else if(type==='garage'){const n=prompt('Choose car: supra / gtr / gt / rally',state.car);if(defs[n]){state.car=n;scene.remove(player);player=makeCar(defs[n]);player.position.set(0,0,8);scene.add(player);}}else if(type==='settings'){state.cam=(state.cam+1)%3;}}));
document.getElementById('back')?.addEventListener('click',stop);
document.getElementById('close')?.addEventListener('click',()=>document.getElementById('modal')?.classList.add('hidden'));

addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')reset();if(e.code==='KeyC')state.cam=(state.cam+1)%3;if(e.code==='Escape')stop();});
addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('.touch').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});b.addEventListener('pointerup',()=>keys[k]=false);b.addEventListener('pointerleave',()=>keys[k]=false);});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

function update(dt){
 if(!state.running||state.crashed)return;
 const d=defs[state.car];
 const gas=keys.KeyW||keys.ArrowUp,brake=keys.KeyS||keys.ArrowDown;
 if(gas)state.speed+=d.acc*dt;else state.speed-=22*dt;
 if(brake)state.speed-=75*dt;
 const boost=(keys.ShiftLeft||keys.ShiftRight)&&state.nitro>0;
 if(boost){state.speed+=125*dt;state.nitro-=38*dt;}else state.nitro=Math.min(100,state.nitro+9*dt);
 state.speed=Math.max(0,Math.min(d.max,state.speed));
 const left=keys.KeyA||keys.ArrowLeft,right=keys.KeyD||keys.ArrowRight;const target=(right?1:0)-(left?1:0);state.steer+=(target-state.steer)*Math.min(1,dt*8);
 player.position.x+=state.steer*(7.5+state.speed*.035)*dt;player.position.x=THREE.MathUtils.clamp(player.position.x,-7.0,7.0);player.rotation.y=state.steer*.09;player.rotation.z=-state.steer*.045;
 // Player advances toward -Z. World traffic is moved independently so relative motion is correct.
 player.position.z-=state.speed*dt*.055;state.distance+=state.speed*dt*.055;state.score+=state.speed*dt*.22;
 for(const t of traffic){
  const relSpeed=t.userData.oncoming?t.userData.speed+state.speed*.055:t.userData.speed-state.speed*.055;
  t.position.z+=t.userData.oncoming? t.userData.speed*dt*.055 : -t.userData.speed*dt*.055;
  // Keep same-direction cars ahead and recycle them behind; keep oncoming cars far ahead and recycle after passing.
  if(!t.userData.oncoming&&t.position.z<player.position.z-80){t.position.z=player.position.z+230+Math.random()*130;t.position.x=lanes[2+Math.floor(Math.random()*3)];}
  if(t.userData.oncoming&&t.position.z>player.position.z+35){t.position.z=player.position.z-230-Math.random()*130;t.position.x=lanes[Math.floor(Math.random()*2)];}
  t.rotation.y=t.userData.oncoming?Math.PI:0;
  const dx=Math.abs(t.position.x-player.position.x),dz=Math.abs(t.position.z-player.position.z);if(dx<1.65&&dz<3.1)crash();
 }
 const targetZ=player.position.z+(state.cam===0?10:state.cam===1?7:15);const targetY=state.cam===0?3.0:state.cam===1?2.2:4.8;camera.position.lerp(new THREE.Vector3(player.position.x-state.steer*.7,targetY,targetZ),1-Math.pow(.001,dt));camera.lookAt(player.position.x,1.0,player.position.z-15);
 document.getElementById('speed').textContent=Math.round(state.speed);document.getElementById('score').textContent=Math.floor(state.score).toLocaleString();document.getElementById('distance').textContent=Math.floor(state.distance)+' m';document.getElementById('nitro').textContent=Math.round(state.nitro)+'%';
}

let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);renderer.render(scene,camera);requestAnimationFrame(loop);}requestAnimationFrame(loop);

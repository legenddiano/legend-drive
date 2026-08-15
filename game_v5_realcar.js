import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $=id=>document.getElementById(id);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x070b14);
scene.fog=new THREE.Fog(0x070b14,70,520);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.05,1200);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xb9c9ff,0x151822,1.8));
const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(-30,55,25);sun.castShadow=true;scene.add(sun);
const world=new THREE.Group();scene.add(world);
const road=new THREE.Group();scene.add(road);
const trafficGroup=new THREE.Group();scene.add(trafficGroup);
const lanes=[-5.7,-2.85,0,2.85,5.7];

const C=(hex,metal=.55,rough=.22,em=0)=>new THREE.MeshStandardMaterial({color:hex,metalness:metal,roughness:rough,emissive:em,emissiveIntensity:em?2.5:0});
const add=(g,o,x,y,z)=>{o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
const box=(g,w,h,d,m,x,y,z)=>add(g,new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m),x,y,z);
const cyl=(g,r,h,m,x,y,z,rotX=0,rotY=0,rotZ=0)=>{const o=add(g,new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),m),x,y,z);o.rotation.set(rotX,rotY,rotZ);return o};

function roundedBody(color){
  const g=new THREE.Group();
  const mat=C(color,.88,.16), dark=C(0x080b10,.2,.72), glass=C(0x071923,.75,.09), chrome=C(0xbfc8d3,.92,.13), white=C(0xdff5ff,.15,.08,0xa9ddff), red=C(0xff173d,.15,.09,0xff173d);
  // Main R35-inspired silhouette: low nose, wide shoulders, fastback cabin, short rear.
  const shape=new THREE.Shape();
  shape.moveTo(-2.38,.60);shape.lineTo(-2.20,.88);shape.lineTo(-1.75,.98);shape.lineTo(-1.05,1.02);shape.lineTo(-.62,1.39);shape.quadraticCurveTo(0,1.57,.64,1.40);shape.lineTo(1.12,1.08);shape.lineTo(1.88,1.00);shape.lineTo(2.28,.86);shape.lineTo(2.36,.61);shape.lineTo(1.80,.55);shape.lineTo(-1.85,.55);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:1.88,bevelEnabled:true,bevelSegments:4,bevelSize:.07,bevelThickness:.05,steps:2});geo.center();geo.rotateY(Math.PI/2);
  add(g,new THREE.Mesh(geo,mat),0,0,0);
  // hood and front bumper
  box(g,1.62,.12,.90,mat,0,.98,-1.47);
  box(g,1.76,.25,.18,dark,0,.68,-2.32);
  box(g,1.18,.12,.06,C(0x050609,.05,.92),0,.78,-2.42);
  // grille surround
  box(g,1.28,.30,.035,C(0x020305,.02,.95),0,.67,-2.44);
  box(g,.42,.055,.045,C(0x1d232c,.7,.22),0,.82,-2.47);
  // headlights
  for(const s of[-1,1]){
    const lamp=box(g,.38,.17,.08,white,s*.73,.91,-2.38);lamp.rotation.z=s*.10;
    box(g,.07,.15,.035,C(0xffffff,.1,.05,0xffffff),s*.61,.91,-2.43);
    box(g,.10,.035,.04,C(0xdfffff,.1,.05,0xa9ddff),s*.79,.85,-2.43);
    box(g,.18,.23,.05,dark,s*.98,.68,-2.39);
  }
  // side skirts and vents
  for(const s of[-1,1]){box(g,.12,.10,3.35,dark,s*1.00,.49,.05);box(g,.16,.26,.46,dark,s*.98,.69,-.38);box(g,.06,.22,.35,C(0x202832,.75,.25),s*1.01,.70,-.40)}
  // roof/glass panels
  box(g,1.48,.10,1.20,mat,0,1.43,.05);
  box(g,1.38,.055,.72,glass,0,1.34,-.55);
  box(g,1.32,.055,.58,glass,0,1.35,.67);
  for(const s of[-1,1])box(g,.055,.43,1.32,dark,s*.73,1.28,.08);
  // mirrors
  for(const s of[-1,1]){box(g,.17,.09,.27,dark,s*1.02,1.18,-.30);box(g,.12,.045,.15,glass,s*1.04,1.20,-.30)}
  // rear deck, wing, bumper
  box(g,1.72,.16,.62,mat,0,.90,1.72);
  box(g,1.48,.07,.16,dark,0,1.28,1.90);
  for(const s of[-1,1])box(g,.055,.27,.08,dark,s*.58,1.14,1.87);
  box(g,1.64,.22,.14,dark,0,.62,2.32);
  // iconic four round tail lights
  for(const s of[-1,1])for(const x of[-.25,.25])cyl(g,.18,.065,red,s*(.52+x),.88,2.39,Math.PI/2,0,0);
  for(const x of[-.86,-.29,.29,.86])cyl(g,.105,.18,chrome,x,.58,2.43,Math.PI/2,0,0);
  // wheels with detailed rims
  for(const s of[-1,1])for(const z of[-1.43,1.42]){
    cyl(g,.49,.32,C(0x050608,.02,.94),s*1.02,.47,z,0,0,Math.PI/2);
    cyl(g,.29,.34,chrome,s*1.03,.47,z,0,0,Math.PI/2);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;const sp=box(g,.035,.045,.40,chrome,s*1.04,.47,z);sp.rotation.y=a}
    cyl(g,.075,.35,dark,s*1.05,.47,z,0,0,Math.PI/2);
  }
  // cockpit interior
  const interior=C(0x11161d,.2,.68), seat=C(0x171b21,.18,.78), dash=C(0x090d13,.15,.72), screen=C(0x082532,.45,.12,0x12d8ff);
  box(g,1.34,.08,.70,dash,0,1.08,-.70);
  for(const s of[-1,1]){box(g,.48,.58,.68,seat,s*.43,.76,.35);box(g,.34,.08,.16,interior,s*.43,1.03,.34)}
  box(g,1.18,.06,.08,dash,0,1.16,-1.05);box(g,.35,.035,.04,screen,.25,1.20,-1.07);
  const wheel=cyl(g,.29,.055,chrome,-.48,.94,-1.03,Math.PI/2,0,0);wheel.rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const sp=box(g,.035,.26,.035,chrome,-.48,.94,-1.03);sp.rotation.z=i*2.094}
  g.userData.cockpit=new THREE.Vector3(-.10,1.18,-.70);
  g.userData.wheels=[];
  return g;
}

function makeCar(color=0xe9eef5,traffic=false){const g=roundedBody(color);g.userData.traffic=traffic;return g}

const player=makeCar(Number('0x'+(localStorage.getItem('legend_car_color')||'e9eef5')));scene.add(player);
const traffic=[];
for(let i=0;i<18;i++){const colors=[0x16191f,0xc82e42,0x2e65d8,0xf2b72d,0x3abf7a,0xeeeeee];const t=makeCar(colors[i%colors.length],true);t.scale.set(.94,.94,.94);t.userData.speed=65+Math.random()*95;t.position.set(lanes[1+Math.floor(Math.random()*4)],0,-90-i*65);trafficGroup.add(t);traffic.push(t)}

const roadMat=C(0x242a34,.05,.9), lineMat=C(0xe9e8df,.1,.65), edgeMat=C(0x1765ff,.55,.25,0x123cff);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),C(0x0c1119,.02,.98));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;world.add(ground);
for(let i=0;i<50;i++){const seg=new THREE.Group();const r=new THREE.Mesh(new THREE.PlaneGeometry(18,40),roadMat);r.rotation.x=-Math.PI/2;seg.add(r);for(const x of[-8.9,8.9])box(seg,.12,.08,40,edgeMat,x,.04,0);for(const x of[-4.275,-1.425,1.425,4.275]){const l=new THREE.Mesh(new THREE.PlaneGeometry(.11,5),lineMat);l.rotation.x=-Math.PI/2;l.position.set(x,.045,-10);seg.add(l)}seg.position.z=20-i*40;road.add(seg)}

const state={running:false,speed:0,score:0,distance:0,nitro:100,cam:0,steer:0,crash:false};
const keys={};
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyC'&&!e.repeat){state.cam=(state.cam+1)%3}if(e.code==='Escape')stop()});
addEventListener('keyup',e=>keys[e.code]=false);
function setHud(){if($('speed'))$('speed').textContent=Math.round(state.speed);if($('score'))$('score').textContent=Math.floor(state.score).toLocaleString();if($('distance'))$('distance').textContent=Math.floor(state.distance)+' m';if($('nitro'))$('nitro').textContent=Math.round(state.nitro)+'%'}
function start(){state.running=true;state.crash=false;state.speed=0;state.score=0;state.distance=0;state.nitro=100;player.position.set(0,0,0);player.rotation.set(0,0,0);$('menu').style.display='none';$('hud').style.display='flex';$('back').style.display='block';traffic.forEach((t,i)=>{t.position.x=lanes[1+Math.floor(Math.random()*4)];t.position.z=-90-i*65-Math.random()*30});}
function stop(){state.running=false;$('menu').style.display='flex';$('hud').style.display='none';$('back').style.display='none'}
$('back')?.addEventListener('click',stop);
addEventListener('legend:start',start);

function crash(){state.crash=true;state.running=false;const d=document.createElement('div');d.id='crashOverlay';d.style.cssText='position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#050712b8;font-family:system-ui;text-align:center';d.innerHTML='<div><div style="font-size:56px;font-weight:1000;font-style:italic">CRASH</div><button id="restart" style="margin-top:18px;padding:13px 28px;border:0;border-radius:10px;background:#ff4d18;color:white;font-weight:900;cursor:pointer">RESTART</button></div>';document.body.appendChild(d);$('restart').onclick=()=>{d.remove();start()}}

function updateCamera(){const target=new THREE.Vector3();if(state.cam===2){const p=player.userData.cockpit||new THREE.Vector3(0,1.15,-.65);target.copy(p).applyMatrix4(player.matrixWorld);camera.position.lerp(target,.22);const look=new THREE.Vector3(0,1.15,-10).applyMatrix4(player.matrixWorld);camera.lookAt(look);camera.fov=78}else if(state.cam===1){const p=new THREE.Vector3(0,1.02,-1.65).applyMatrix4(player.matrixWorld);camera.position.lerp(p,.14);const look=new THREE.Vector3(0,.85,-20).applyMatrix4(player.matrixWorld);camera.lookAt(look);camera.fov=70}else{const p=new THREE.Vector3(0,2.9,7.2).applyMatrix4(player.matrixWorld);camera.position.lerp(p,.10);const look=new THREE.Vector3(0,.65,-14).applyMatrix4(player.matrixWorld);camera.lookAt(look);camera.fov=66}camera.updateProjectionMatrix()}
function tick(dt){if(!state.running){updateCamera();return}const left=keys.ArrowLeft||keys.KeyA,right=keys.ArrowRight||keys.KeyD,up=keys.ArrowUp||keys.KeyW,down=keys.ArrowDown||keys.KeyS,nit=keys.ShiftLeft||keys.ShiftRight;state.steer+=(left?-1:right?1:0-state.steer)*Math.min(1,dt*7);player.position.x+=state.steer*7.2*dt;player.position.x=Math.max(-7.1,Math.min(7.1,player.position.x));const targetSpeed=up?205:(down?70:150);state.speed+=((targetSpeed+(nit&&state.nitro>0?100:0))-state.speed)*dt*1.8;if(nit&&state.nitro>0)state.nitro=Math.max(0,state.nitro-28*dt);else state.nitro=Math.min(100,state.nitro+8*dt);state.distance+=state.speed*dt/3.6;state.score+=state.speed*dt*.65;road.children.forEach(s=>{s.position.z+=state.speed*dt/3.6;if(s.position.z>40)s.position.z-=2000});traffic.forEach(t=>{t.position.z+=(state.speed-t.userData.speed)*dt/3.6;if(t.position.z>25){t.position.z=-900-Math.random()*400;t.position.x=lanes[1+Math.floor(Math.random()*4)]}const dx=Math.abs(t.position.x-player.position.x),dz=Math.abs(t.position.z-player.position.z);if(dx<1.75&&dz<2.9)crash()});player.rotation.z=-state.steer*.055;player.rotation.y=state.steer*.035;setHud()}
let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;tick(dt);updateCamera();renderer.render(scene,camera);requestAnimationFrame(loop)}requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

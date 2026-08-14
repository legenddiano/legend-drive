import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.05,900);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.body.appendChild(renderer.domElement);
scene.background=new THREE.Color(0x070a16);scene.fog=new THREE.Fog(0x070a16,90,500);scene.add(new THREE.HemisphereLight(0x9eb7ff,0x11131b,2.1));const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(-30,60,20);sun.castShadow=true;scene.add(sun);
const world=new THREE.Group(),traffic=new THREE.Group();scene.add(world,traffic);const lanes=[-5.6,-2.8,0,2.8,5.6];
const defs={supra:{name:'SUPRA-X',color:0xff6b16,max:330,acc:58,handling:8.8},gtr:{name:'GTR-X',color:0xdce5ee,max:350,acc:62,handling:9.5},gt:{name:'GT-V12',color:0x246bff,max:365,acc:55,handling:8.5},rally:{name:'RALLY-X',color:0xff2458,max:315,acc:66,handling:9.8}};let carType='gtr';let speed=0,nitro=100,distance=0,score=0,steer=0,running=false,crashed=false,cam=0;const keys={};
const M=(c,metal=.45,rough=.25,em=0)=>new THREE.MeshStandardMaterial({color:c,metalness:metal,roughness:rough,emissive:em,emissiveIntensity:em?2.5:0});
function mesh(g,geo,m,p,s){const o=new THREE.Mesh(geo,m);o.position.set(...p);if(s)o.scale.set(...s);o.castShadow=o.receiveShadow=true;g.add(o);return o}
function wheel(g,x,z,c){mesh(g,new THREE.CylinderGeometry(.43,.43,.3,28),M(0x090b0f,.1,.85),[x,.43,z],[1,1,1]).rotation.z=Math.PI/2;mesh(g,new THREE.CylinderGeometry(.22,.22,.32,20),M(c,.9,.12),[x,.43,z]).rotation.z=Math.PI/2}
function makeCar(d,enemy=false){const g=new THREE.Group(),body=M(d.color,.78,.18),dark=M(0x101722,.55,.1),black=M(0x05070b,.1,.75),chrome=M(0xdce6ef,.9,.13),light=M(0xffffff,.2,.08,0xffffff),red=M(0xff173f,.15,.1,0xff173f);
 // sculpted lower body
 mesh(g,new THREE.SphereGeometry(1,28,14),body,[0,.68,0],[1.18,.42,2.05]);
 mesh(g,new THREE.BoxGeometry(1.82,.32,1.55),body,[0,.78,-.72]);mesh(g,new THREE.BoxGeometry(1.9,.25,1.15),body,[0,.72,1.18]);
 // hood and trunk slopes
 const hood=mesh(g,new THREE.BoxGeometry(1.65,.16,1.35),body,[0,.93,-1.34]);hood.rotation.x=-.05;
 // cabin with sloped roof
 mesh(g,new THREE.SphereGeometry(1,24,12),dark,[0,1.18,-.05],[.78,.45,.92]);
 mesh(g,new THREE.BoxGeometry(1.32,.055,.88),M(0x162638,.35,.08),[0,1.25,-.55]);
 mesh(g,new THREE.BoxGeometry(1.25,.055,.62),M(0x111a26,.35,.1),[0,1.25,.52]);
 // front grille and bumper
 mesh(g,new THREE.BoxGeometry(1.25,.2,.12),black,[0,.58,-2.02]);mesh(g,new THREE.BoxGeometry(.54,.1,.08),black,[0,.72,-2.08]);
 mesh(g,new THREE.BoxGeometry(.48,.11,.08),light,[-.62,.87,-1.98]);mesh(g,new THREE.BoxGeometry(.48,.11,.08),light,[.62,.87,-1.98]);
 // rear lights
 mesh(g,new THREE.BoxGeometry(.58,.1,.08),red,[-.55,.77,1.86]);mesh(g,new THREE.BoxGeometry(.58,.1,.08),red,[.55,.77,1.86]);
 // mirrors
 mesh(g,new THREE.SphereGeometry(.12,12,8),body,[-1.02,1.03,-.58],[1,.7,1.6]);mesh(g,new THREE.SphereGeometry(.12,12,8),body,[1.02,1.03,-.58],[1,.7,1.6]);
 // wide fenders
 for(const x of[-1.0,1.0])for(const z of[-1.3,1.3]){mesh(g,new THREE.SphereGeometry(.55,20,10),body,[x,.55,z],[.48,.45,.62]);wheel(g,x,z,d.color)}
 // splitter, side skirts, spoiler
 mesh(g,new THREE.BoxGeometry(1.95,.08,.28),black,[0,.47,-2.03]);mesh(g,new THREE.BoxGeometry(.16,.13,3.0),black,[-1.04,.46,0]);mesh(g,new THREE.BoxGeometry(.16,.13,3.0),black,[1.04,.46,0]);
 if(d.name!=='GT-V12'){mesh(g,new THREE.BoxGeometry(1.72,.1,.18),body,[0,1.25,1.62]);mesh(g,new THREE.BoxGeometry(.08,.38,.08),black,[-.7,1.05,1.55]);mesh(g,new THREE.BoxGeometry(.08,.38,.08),black,[.7,1.05,1.55]);}
 // exhausts
 mesh(g,new THREE.CylinderGeometry(.1,.1,.18,16),chrome,[-.45,.52,2.0]).rotation.x=Math.PI/2;mesh(g,new THREE.CylinderGeometry(.1,.1,.18,16),chrome,[.45,.52,2.0]).rotation.x=Math.PI/2;
 if(!enemy)mesh(g,new THREE.BoxGeometry(1.5,.035,1.5),M(0x20d8ff,.1,.15,0x20d8ff),[0,.27,.35]);
 return g}
let player=makeCar(defs[carType]);player.position.set(0,0,8);scene.add(player);
function buildRoad(){while(world.children.length)world.remove(world.children[0]);const ground=mesh(world,new THREE.PlaneGeometry(800,1300),M(0x151a20,.02,.98),[0,-.04,-300]);ground.rotation.x=-Math.PI/2;for(let i=0;i<45;i++){const z=30-i*30;const r=mesh(world,new THREE.PlaneGeometry(18,30),M(0x292d34,.1,.72),[0,.01,z]);r.rotation.x=-Math.PI/2;for(const x of[-4.2,-1.4,1.4,4.2]){const l=mesh(world,new THREE.PlaneGeometry(.11,5),M(0xf3f0d8,.1,.65),[x,.04,z-3]);l.rotation.x=-Math.PI/2}for(const x of[-9.3,9.3]){mesh(world,new THREE.BoxGeometry(.18,.35,30),M(0x334bff,.65,.25,0x1520ff),[x,.2,z]);if(i%2===0)mesh(world,new THREE.SphereGeometry(.15,10,8),M(0x20dfff,.1,.1,0x20dfff),[x,4.8,z+7])}}
 for(let i=0;i<50;i++){const side=i%2?-1:1,x=side*(13+Math.random()*25),z=-i*24-Math.random()*20,h=5+Math.random()*22;mesh(world,new THREE.BoxGeometry(4+Math.random()*5,h,4+Math.random()*5),M(0x10182a,.2,.7),[x,h/2,z]);if(i%3===0)mesh(world,new THREE.BoxGeometry(3,.12,.12),M(i%2?0xff29b8:0x20dfff,.1,.1,i%2?0xff29b8:0x20dfff),[x,h*.68,z-2.1])}}
buildRoad();
const cars=[];function spawn(i){const c=makeCar({color:[0xffffff,0x1b2028,0xd93b4f,0xffc62e,0x367bff][i%5],name:'TRAFFIC'},true);c.position.set(lanes[2+Math.floor(Math.random()*3)],0,-60-i*42);c.userData.v=35+Math.random()*45;traffic.add(c);cars.push(c)}for(let i=0;i<18;i++)spawn(i);
function reset(){speed=0;nitro=100;distance=0;score=0;crashed=false;player.position.set(0,0,8);player.rotation.set(0,0,0);cars.forEach((c,i)=>{c.position.x=lanes[2+Math.floor(Math.random()*3)];c.position.z=-60-i*42});document.getElementById('crashOverlay')?.remove()}
function crash(){if(crashed)return;crashed=true;speed*=.15;const d=document.createElement('div');d.id='crashOverlay';d.style.cssText='position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:#0009;color:white;font:900 60px system-ui';d.innerHTML='CRASH<div style="font-size:18px">Press R to restart</div>';document.body.appendChild(d)}
function start(){document.getElementById('menu').style.display='none';document.getElementById('hud').style.display='flex';document.getElementById('back').style.display='block';running=true;reset()}
function stop(){running=false;document.getElementById('menu').style.display='flex';document.getElementById('hud').style.display='none';document.getElementById('back').style.display='none'}
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{if(b.dataset.open==='garage'){const n=prompt('supra / gtr / gt / rally',carType);if(defs[n]){carType=n;scene.remove(player);player=makeCar(defs[n]);player.position.set(0,0,8);scene.add(player)}}else start()});document.getElementById('back')?.addEventListener('click',stop);
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')reset();if(e.code==='KeyC')cam=(cam+1)%3;if(e.code==='Escape')stop()});addEventListener('keyup',e=>keys[e.code]=false);document.querySelectorAll('.touch').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});['pointerup','pointerleave'].forEach(x=>b.addEventListener(x,()=>keys[k]=false))});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
function update(dt){if(!running||crashed)return;const d=defs[carType],gas=keys.KeyW||keys.ArrowUp,brake=keys.KeyS||keys.ArrowDown;if(gas)speed=Math.min(d.max,speed+d.acc*dt);else speed=Math.max(0,speed-18*dt);if(brake)speed=Math.max(0,speed-80*dt);if((keys.ShiftLeft||keys.ShiftRight)&&nitro>0){speed=Math.min(d.max+70,speed+115*dt);nitro-=35*dt}else nitro=Math.min(100,nitro+8*dt);const target=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);steer+=(target-steer)*Math.min(1,dt*9);player.position.x=THREE.MathUtils.clamp(player.position.x+steer*(5.2+speed*.012)*dt,-7.1,7.1);player.rotation.z=-steer*.045;
 // Speed is now physically meaningful: km/h -> m/s, then world scale 1.25.
 const worldSpeed=(speed/3.6)*1.25;distance+=worldSpeed*dt;score+=speed*dt*.3;player.position.z-=worldSpeed*dt;
 for(const c of cars){c.position.z-=c.userData.v*dt;if(c.position.z<player.position.z-70){c.position.z=player.position.z+260+Math.random()*100;c.position.x=lanes[2+Math.floor(Math.random()*3)];c.userData.v=35+Math.random()*45}if(Math.abs(c.position.x-player.position.x)<1.65&&Math.abs(c.position.z-player.position.z)<3.0)crash()}
 const y=cam===1?2.0:cam===2?5.2:3.0,z=player.position.z+(cam===1?6:cam===2?15:11);camera.position.lerp(new THREE.Vector3(player.position.x-steer*.8,y,z),1-Math.pow(.0005,dt));camera.lookAt(player.position.x,1,player.position.z-14);document.getElementById('speed').textContent=Math.round(speed);document.getElementById('score').textContent=Math.floor(score).toLocaleString();document.getElementById('distance').textContent=Math.floor(distance)+' m';document.getElementById('nitro').textContent=Math.round(nitro)+'%'}
let last=performance.now();function loop(t){const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);renderer.render(scene,camera);requestAnimationFrame(loop)}requestAnimationFrame(loop);
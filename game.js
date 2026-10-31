'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s), W=720,H=760, origin={x:360,y:65};
let level=0,score=0,balls=10,pegs=[],ball=null,angle=0,shotScore=0,hits=0,orangeStart=0,bucketX=360,time=0,last=0,phase='intro',guide=0,sound=true,combo=0,particles=[],popup='',popupTime=0, audio;
const palettes=[['#86d9dc','#7baf9d','#476a75'],['#c5b1ea','#958ac2','#555e91'],['#f6c7a5','#d290a5','#795f8b']];
function makeLevel(){pegs=[];let id=0;const rows=9,cols=11;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let x=60+c*60+(r%2?29:0),y=165+r*55;if(x>675)continue; if((r===0&&(c<2||c>8))||(r===8&&(c<2||c>8)))continue;if(level===1){x+=Math.sin(r*.9+c*.6)*17;y+=Math.cos(c*.8)*12}if(level===2){x+=Math.sin(r+c)*18;y+=Math.sin(c*.8+r*.5)*13}pegs.push({x,y,r:10,type:'blue',hit:false,id:id++})}let ordered=[...pegs].sort((a,b)=>((a.id*37+level*13)%97)-((b.id*37+level*13)%97));ordered.slice(0,25).forEach(p=>p.type='orange');ordered.slice(25,27).forEach(p=>p.type='green');ordered[27].type='purple';orangeStart=25;ball=null;balls=10;shotScore=0;hits=0;guide=0;phase='aim';updateUI()}
function updateUI(){$('#level').innerHTML=String(level+1).padStart(2,'0')+' <em>/ 03</em>';let n=pegs.filter(p=>p.type==='orange'&&!p.hit).length;$('#orange').textContent=n;$('#progress').style.width=(100*(orangeStart-n)/orangeStart)+'%';$('#score').textContent=score.toLocaleString();$('#balls').textContent=balls;$('#shot').textContent=shotScore.toLocaleString()}
function beep(freq=400,duration=.09){if(!sound)return;try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function message(t){popup=t;popupTime=1.8}
function shoot(){if(phase!=='aim'||balls<=0)return;shotGuide=getGuide();shotGuideSuper=guide>0;balls--;ball={x:origin.x,y:origin.y+18,vx:Math.sin(angle)*410,vy:Math.cos(angle)*410,r:9,trail:[],age:0};phase='flight';shotScore=0;hits=0;combo=0;if(guide>0)guide--;beep(440);updateUI()}
function endShot(caught){if(!ball)return;ball=null;if(caught){balls++;message('FREE BALL!');beep(750,.2)}pegs=pegs.filter(p=>!p.hit);score+=shotScore;shotScore=0;let orange=pegs.filter(p=>p.type==='orange').length;updateUI();if(!orange){phase='won';showModal(level===2?'YOU DID IT!':'STAGE CLEAR!',level===2?'A perfect party.':'Orange you brilliant?',level===2?'You cleared all three stages! Play again to chase a higher score.':'Every orange peg is gone. Ready for a new board?',level===2?'PLAY AGAIN':'NEXT STAGE')}else if(balls<=0){phase='lost';showModal('SO CLOSE!','One more shot?',`You cleared ${orangeStart-orange} of ${orangeStart} orange pegs. Give this stage another go.`, 'TRY AGAIN')}else phase='aim'}
function showModal(kicker,title,desc,button){$('#overlay .eyebrow').textContent=kicker;$('#overlay h2').textContent=title;$('#overlay .modal p:not(.eyebrow)').textContent=desc;$('#start').innerHTML=button+' <b>→</b>';$('#overlay').classList.remove('hidden')}
function start(){if(phase==='won'){if(level===2){level=0;score=0}else level++}else if(phase==='lost'){score=0}$('#overlay').classList.add('hidden');makeLevel()}
// Shared by the real shot and the Super Guide, including wall and peg response.
function physicsStep(b,dt,board,onPeg){
 let impacts=0;
 b.vy+=330*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x<b.r+9){b.x=b.r+9;b.vx=Math.abs(b.vx)*.98;impacts++}
 if(b.x>W-b.r-9){b.x=W-b.r-9;b.vx=-Math.abs(b.vx)*.98;impacts++}
 if(b.y<b.r+20){b.y=b.r+20;b.vy=Math.abs(b.vy);impacts++}
 for(const p of board){let dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),min=b.r+p.r;if(d<min&&d>0){let nx=dx/d,ny=dy/d;b.x=p.x+nx*min;b.y=p.y+ny*min;let dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.88*dot*nx;b.vy-=1.88*dot*ny;if(Math.abs(b.vx)<35)b.vx=(p.id%2?1:-1)*55;impacts++}if(onPeg)onPeg(p)}}
 return impacts;
}
// Use the exact launch state and substep used by live shots. The normal guide
// shows the first bounce; Super Guide continues through several more impacts.
function predictGuide(shotAngle,board,maxImpacts=2){
 let b={x:origin.x,y:origin.y+18,vx:Math.sin(shotAngle)*410,vy:Math.cos(shotAngle)*410,r:9},points=[{x:b.x,y:b.y,step:0}],impacts=0,impactPoints=[];
 for(let i=0;i<720;i++){
  const count=physicsStep(b,1/240,board);
  if(count){impacts+=count;impactPoints.push({x:b.x,y:b.y});}
  if(count||i%4===3||b.y>=H-55)points.push({x:b.x,y:b.y,step:i+1});
  if(impacts>=maxImpacts||b.y>=H-55)break;
 }
 return {points,impactPoints,firstImpact:impactPoints[0]||null};
}
let guideCacheAngle=null,guideCacheBoard=null,guideCachePower=null,guideCache=null,shotGuide=null,shotGuideSuper=false;
function getGuide(){let power=guide>0;if(guideCacheAngle!==angle||guideCacheBoard!==pegs||guideCachePower!==power){guideCache=predictGuide(angle,pegs,power?5:2);guideCacheAngle=angle;guideCacheBoard=pegs;guideCachePower=power}return guideCache}
function drawGuide(path,powered,inFlight=false){
 if(!path)return;
 ctx.save();ctx.globalAlpha=inFlight?.48:1;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(powered?[7,8]:[3,8]);ctx.lineWidth=powered?3.5:3;ctx.strokeStyle=powered?'#fff0a1':'#fff';ctx.shadowColor=powered?'#c8792a':'#244e72';ctx.shadowBlur=5;ctx.beginPath();ctx.moveTo(path.points[0].x,path.points[0].y);for(const pt of path.points.slice(1))ctx.lineTo(pt.x,pt.y);ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0;
 for(const impact of path.impactPoints){ctx.beginPath();ctx.arc(impact.x,impact.y,11,0,Math.PI*2);ctx.lineWidth=2;ctx.strokeStyle=powered?'#fff0a1':'#fff';ctx.stroke()}
 ctx.restore();
}
function update(dt){time+=dt;bucketX=360+245*Math.sin(time*1.25);particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.life-=dt}popupTime-=dt;if(!ball)return;ball.age+=dt;let steps=4,s=dt/steps;for(let i=0;i<steps&&ball;i++){let b=ball;b.trail.unshift({x:b.x,y:b.y});if(b.trail.length>12)b.trail.pop();physicsStep(b,s,pegs,p=>{if(!p.hit){p.hit=true;hits++;combo++;let remaining=pegs.filter(q=>q.type==='orange'&&!q.hit).length,mult=remaining<=3?10:remaining<=6?5:remaining<=10?3:remaining<=15?2:1;shotScore+=(p.type==='orange'?100:p.type==='purple'?500:10)*mult*hits;if(p.type==='green'){guide=2;message('SUPER GUIDE!')}if(p.type==='orange'&&remaining===0)message('FEVER!');for(let j=0;j<8;j++)particles.push({x:p.x,y:p.y,vx:(Math.random()-.5)*150,vy:(Math.random()-.5)*150,life:.6,color:p.type==='orange'?'#ffd077':'#a8eaff'});beep(p.type==='orange'?620:400,.06);updateUI()}});if(b.y>H-55&&b.y<H-38&&b.vy>0&&Math.abs(b.x-bucketX)<52){endShot(true);break}if(b.y>H+20||b.age>30){endShot(false);break}}}
function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function draw(){let pal=palettes[level];const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,pal[0]);bg.addColorStop(1,'#e2e5ba');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffffff38';for(let i=0;i<13;i++){let x=(i*173+35)%W,y=85+(i*97)%500;circle(x,y,2+(i%3),'#fff9')}ctx.fillStyle=pal[1];ctx.beginPath();ctx.moveTo(0,620);for(let x=0;x<=W;x+=20)ctx.lineTo(x,590+Math.sin(x*.009+level)*25+Math.sin(x*.022)*12);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();ctx.fillStyle=pal[2];ctx.globalAlpha=.36;ctx.beginPath();ctx.moveTo(0,700);for(let x=0;x<=W;x+=20)ctx.lineTo(x,675+Math.sin(x*.012+2)*20);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#ffffff35';ctx.lineWidth=2;ctx.strokeRect(10,10,W-20,H-20);
for(const p of pegs){let color=p.type==='orange'?'#ff9d2f':p.type==='green'?'#6bdc8c':p.type==='purple'?'#df8aff':'#62b8ef';if(p.hit){ctx.shadowColor=color;ctx.shadowBlur=20}circle(p.x,p.y,p.r+3,'#38547777');circle(p.x,p.y,p.r,color);circle(p.x-3,p.y-4,3,'#ffffffa0');ctx.shadowBlur=0}
if(phase==='aim')drawGuide(getGuide(),guide>0);else if(phase==='flight'&&ball&&shotGuide&&ball.age<=shotGuide.points.at(-1).step/240)drawGuide(shotGuide,shotGuideSuper,true);ctx.save();ctx.translate(origin.x,origin.y);ctx.rotate(-angle);ctx.fillStyle='#233b5c';ctx.beginPath();ctx.roundRect(-19,-7,38,61,14);ctx.fill();ctx.fillStyle='#81a9bb';ctx.beginPath();ctx.roundRect(-12,5,24,42,9);ctx.fill();ctx.restore();circle(origin.x,origin.y,28,'#2c4865');circle(origin.x,origin.y,18,'#e2f4f0');circle(origin.x-5,origin.y-6,6,'#fff');
ctx.fillStyle='#f5b65c';ctx.beginPath();ctx.moveTo(bucketX-63,H-53);ctx.lineTo(bucketX+63,H-53);ctx.lineTo(bucketX+49,H-17);ctx.lineTo(bucketX-49,H-17);ctx.closePath();ctx.fill();ctx.fillStyle='#8d5a39';ctx.fillRect(bucketX-61,H-57,122,9);ctx.fillStyle='#fff4d2';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('FREE BALL',bucketX,H-29);
if(ball){for(let i=0;i<ball.trail.length;i++)circle(ball.trail[i].x,ball.trail[i].y,Math.max(1,7-i*.5),`rgba(255,255,255,${.25*(1-i/12)})`);circle(ball.x,ball.y,ball.r+2,'#49637766');circle(ball.x,ball.y,ball.r,'#f8ffff');circle(ball.x-3,ball.y-3,3,'#fff')};for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.6);circle(p.x,p.y,3,p.color)}ctx.globalAlpha=1;if(popupTime>0){ctx.textAlign='center';ctx.font='bold 28px Fredoka, sans-serif';ctx.fillStyle='#fff';ctx.shadowColor='#cf6b29';ctx.shadowBlur=9;ctx.fillText(popup,W/2,125);ctx.shadowBlur=0}}
let accumulator=0;
function frame(t){if(last)accumulator+=Math.min((t-last)/1000,.033);last=t;while(accumulator>=1/60){update(1/60);accumulator-=1/60}draw();requestAnimationFrame(frame)}
function aim(e){if(phase!=='aim')return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;angle=Math.max(-1.28,Math.min(1.28,Math.atan2(x-origin.x,Math.max(20,y-origin.y))))}
canvas.addEventListener('pointermove',aim);canvas.addEventListener('pointerdown',e=>{e.preventDefault();aim(e);shoot()});window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();angle=Math.max(-1.28,Math.min(1.28,angle+(e.key==='ArrowLeft'?-.045:.045)))}if(e.code==='Space'){e.preventDefault();if(phase==='aim')shoot()}});$('#start').addEventListener('click',start);$('#restart').addEventListener('click',()=>{level=0;score=0;$('#overlay').classList.add('hidden');makeLevel()});$('#sound').addEventListener('click',()=>{sound=!sound;$('#sound span').textContent=sound?'Sound on':'Sound off'});makeLevel();phase='intro';requestAnimationFrame(frame);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function game() {
  const elements = {};
  function element(selector) {
    return elements[selector] ??= { textContent: '', innerHTML: '', style: {}, classList: {add(){}, remove(){}}, addEventListener(){}, getContext(){return {}}, getBoundingClientRect(){return {left:0,top:0,width:720,height:760}} };
  }
  const context = vm.createContext({document:{querySelector:element},window:{addEventListener(){}},requestAnimationFrame(){},Math,console});
  vm.runInContext(fs.readFileSync('game.js','utf8'),context);
  return code => vm.runInContext(code,context);
}

test('guide follows an actual shot through its first peg bounce', () => {
  const run = game();
  run('makeLevel(); sound=false; angle=0; phase="aim"; var prediction=predictGuide(angle,pegs); shoot()');
  assert.ok(run('prediction.firstImpact !== null'));
  let sawBounce = false, compared = 0;
  for (let i=1; i<=100 && run('ball !== null'); i++) {
    run('update(1/60)');
    const [x,y,hit] = run('[ball && ball.x,ball && ball.y,hits]');
    if (x === null) break;
    const point = run(`prediction.points.find(p=>p.step===${i*4})`);
    if (!point) break; // prediction ends at the next impact or the catch zone
    assert.ok(Math.hypot(point.x-x,point.y-y)<1e-7, `frame ${i} diverged`);
    compared++;
    if (hit) sawBounce = true;
  }
  assert.ok(compared > 10, 'compared a meaningful segment');
  assert.ok(sawBounce, 'actual shot reached the predicted peg');
  assert.ok(run('prediction.points.length > 8'));
  assert.ok(run('Math.hypot(prediction.points.at(-1).x-prediction.firstImpact.x,prediction.points.at(-1).y-prediction.firstImpact.y) > 10'), 'guide continues past first bounce');
});

test('guide follows a wall bounce and stays within the side walls', () => {
  const run=game();
  run('makeLevel(); pegs=[]; angle=1.28; var prediction=predictGuide(angle,pegs)');
  assert.ok(run('prediction.firstImpact !== null'));
  assert.ok(run('prediction.points.every(p=>p.x>=18 && p.x<=702)'));
  assert.ok(run('prediction.points.at(-1).x < prediction.firstImpact.x'), 'path turns after right-wall impact');
});

test('green peg grants exactly two subsequent guided shots', () => {
  const run=game();
  run('makeLevel(); sound=false; pegs=[{x:360,y:165,r:10,type:"green",hit:false,id:0},{x:60,y:600,r:10,type:"orange",hit:false,id:1}]; angle=0; shoot(); for(let i=0;i<200 && !pegs[0].hit;i++)update(1/60)');
  assert.equal(run('guide'),2);
  run('endShot(false); shoot()'); assert.equal(run('guide'),1);
  run('endShot(false); shoot()'); assert.equal(run('guide'),0);
});

test('both guide modes match the real flight at multiple angles and on a changed board', () => {
  for (const powered of [false, true]) for (const angle of [-1.2,-.65,0,.65,1.2]) for (const changed of [false,true]) {
    const run=game();
    run(`makeLevel(); sound=false; angle=${angle}; guide=${powered?2:0}; ${changed?'pegs=pegs.filter((p,i)=>i%3!==0); time=3.4;':''} var prediction=getGuide(); shoot()`);
    const first=run('prediction.points[0]');
    assert.equal(first.y,83, 'guide begins at the actual launch point');
    let comparisons=0;
    for(let frame=1;frame<180 && run('ball!==null');frame++) {
      run('update(1/60)');
      if(!run('ball!==null'))break;
      const p=run(`prediction.points.find(p=>p.step===${frame*4})`);
      if(!p)break;
      const actual=run('({x:ball.x,y:ball.y})');
      assert.ok(Math.hypot(actual.x-p.x,actual.y-p.y)<1e-7, `diverged: ${angle}, ${powered}, ${changed}, frame ${frame}`);
      comparisons++;
    }
    assert.ok(comparisons>=2);
    assert.ok(run('prediction.impactPoints.length>=1'), 'guide reaches a bounce');
  }
});

test('normal and Super Guide use the same path but Super Guide continues further', () => {
  const run=game();
  run('makeLevel(); angle=-1.08; guide=0; var normal=getGuide(); guide=2; var superPath=getGuide()');
  assert.ok(run('normal.impactPoints.length>=1'));
  assert.ok(run('superPath.points.at(-1).step>normal.points.at(-1).step'));
  assert.deepEqual(JSON.parse(run('JSON.stringify(superPath.points.slice(0,normal.points.length))')),JSON.parse(run('JSON.stringify(normal.points)')));
});

test('aim maps pointer coordinates consistently at different canvas sizes and aspect ratios', () => {
  const run=game();
  run('makeLevel(); canvas.getBoundingClientRect=()=>({left:10,top:20,width:720,height:760}); aim({clientX:550,clientY:400});var reference=angle');
  run('canvas.getBoundingClientRect=()=>({left:80,top:30,width:360,height:380});aim({clientX:350,clientY:220})');
  assert.ok(run('Math.abs(angle-reference)<1e-12'));
  run('canvas.getBoundingClientRect=()=>({left:0,top:0,width:360,height:760});aim({clientX:270,clientY:380})');
  assert.ok(run('Math.abs(angle-reference)<1e-12'));
});

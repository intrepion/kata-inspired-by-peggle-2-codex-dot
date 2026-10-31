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

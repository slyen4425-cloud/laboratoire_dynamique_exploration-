import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatOutcomeHoldV1,CAPTURE_COMBAT_OUTCOME_HOLD_MS_V1} from '../src/encounters/combat-outcome-hold-v1.js';
function harness(){
  let callback=null,delay=null,cancelled=false,results=[];
  const hold=createCombatOutcomeHoldV1({
    onRelease:outcome=>results.push(outcome),
    schedule(fn,ms){callback=fn;delay=ms;return 1;},
    cancel(){cancelled=true;}
  });
  return {hold,run:()=>callback(),get results(){return results;},get delay(){return delay;},get cancelled(){return cancelled;}};
}
test('a native KO stays visible for 3 seconds, then returns once',()=>{
  const h=harness();
  assert.equal(h.hold.start('victory'),true);
  assert.equal(h.delay,CAPTURE_COMBAT_OUTCOME_HOLD_MS_V1);
  assert.deepEqual(h.results,[]);
  assert.equal(h.hold.start('defeat'),false);
  h.run();
  assert.deepEqual(h.results,['victory']);
});
test('a destroyed or hidden battle cannot post a delayed result',()=>{
  const h=harness();h.hold.start('defeat');h.hold.dispose();h.run();
  assert.equal(h.cancelled,true);
  assert.deepEqual(h.results,[]);
  assert.equal(h.hold.start('victory'),false);
});
test('never accepts unvalidated outcomes or zero-length presentation',()=>{
  assert.throws(()=>createCombatOutcomeHoldV1({onRelease:()=>{},delayMs:0}),/duration/);
  const h=harness();assert.throws(()=>h.hold.start('unknown'),/outcome/);
});

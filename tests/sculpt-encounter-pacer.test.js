import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptEncounterPacer} from '../src/encounters/sculpt-encounter-pacer.js';

test('only actual travelled distance advances encounters',()=>{
 const pacer=createSculptEncounterPacer(100);
 assert.equal(pacer.advance(0),false);
 assert.equal(pacer.advance(-10),false);
 assert.equal(pacer.advance(60),false);
 assert.equal(pacer.advance(39),false);
 assert.equal(pacer.advance(1),true);
 assert.equal(pacer.advance(50),false);
 assert.equal(pacer.advance(50),true);
});
test('large movement preserves residual distance and reset clears progress',()=>{
 const pacer=createSculptEncounterPacer(100);
 assert.equal(pacer.advance(175),true);
 assert.equal(pacer.advance(25),true);
 pacer.advance(90);
 pacer.reset();
 assert.equal(pacer.advance(10),false);
});
test('invalid distance cannot create a cadence',()=>{
 assert.throws(()=>createSculptEncounterPacer(0),RangeError);
 assert.throws(()=>createSculptEncounterPacer(NaN),RangeError);
});

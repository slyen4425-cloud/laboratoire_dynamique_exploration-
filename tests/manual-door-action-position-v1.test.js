import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

function block(selector){
 const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const matches=[...html.matchAll(new RegExp(escaped+'\\{([^{}]+)\\}','g'))];
 assert.ok(matches.length,'CSS block missing: '+selector);
 return matches[0][1];
}

test('manual exterior and interior door actions remain centered on the playfield',()=>{
 for(const selector of ['#navigation-area-door.in-game-door-action',
                        '#world-portal-traverse.in-game-door-action']){
  const css=block(selector);
  assert.match(css,/position:absolute/);
  assert.match(css,/top:62%/);
  assert.match(css,/left:50%/);
  assert.match(css,/right:auto/);
  assert.match(css,/bottom:auto/);
  assert.match(css,/transform:translate\(-50%,-50%\)/);
 }
 assert.match(block('body.sculpt-immersive #navigation-area-door.in-game-door-action'),
   /top:62%;left:50%;right:auto;bottom:auto/);
 assert.match(html,/#navigation-area-door\[hidden\]\{display:none!important\}/);
 assert.match(html,/#world-portal-traverse\[hidden\]\{display:none!important\}/);
});

test('narrow mobile CTA stays above the actual movement joystick hit area',()=>{
 assert.match(html,/@media\(max-width:600px\)\{\s*#navigation-area-door\.in-game-door-action,\s*body\.sculpt-immersive #navigation-area-door\.in-game-door-action\{[^}]*top:43%/);
 assert.match(html,/#world-portal-traverse\.in-game-door-action\{\s*top:43%;left:50%;right:auto;bottom:auto;/);
 // At the reviewed 320 x 568 narrow viewport the canvas is about 301px high.
 // The raised 50px CTA ends at y=154, before the joystick starts at y=181.
 assert.ok(301*.43+50/2<181,'door action must never steal joystick touches');
});

test('buttons keep the existing real transition callbacks, not an extra portal handler',()=>{
 assert.match(main,/function updateSculptDoorAction\(\)/);
 assert.match(main,/sculptInteriorTransition\(external,entries,current,navActor\)/);
 assert.match(main,/\$\('navigation-area-door'\)\.addEventListener\('click'/);
 assert.match(main,/isManualBuildingPortal\(sculptWorldDraft,portal\)/);
 assert.match(main,/button\.textContent=target\.kind==='interior'\?'🚪 Entrer':'🚪 Sortir'/);
});

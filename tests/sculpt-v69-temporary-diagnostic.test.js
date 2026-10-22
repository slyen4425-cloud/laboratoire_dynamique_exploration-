import test from 'node:test';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptNavigationRoute,sculptNavigationBlockDetail,sculptBridgeBankHeights} from '../src/core/sculpt-navigation-collision.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
test('Temporary V69 vertical bridge diagnostic',()=>{
 const W=20,H=18,CW=28,CH=21,center={x:9.5*CW,y:8.5*CH};
 const levels=Array.from({length:W*H},(_,i)=>{const row=Math.floor(i/W);return row<6||row>11?6:0});
 const t=createSculptTerrain({width:W,height:H,levels});
 const placements=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',...center,variantId:'vertical',scale:1.1});
 const bridge=resolveWorldObjectPlacements(placements)[0];
 const corridor=bridgeTraversalRect(bridge);
 const c={terrain:t,bridges:[bridge],cellWidth:CW,cellHeight:CH,maxStepUp:2,maxStepDown:2};
 let p={x:center.x,y:4.5*CH,radius:5,locomotion:{modes:['ground']}};
 const dest=14.5*CH;
 const direct=sculptNavigationRoute(c,p,p.x,dest);
 let events=[];
 for(let i=0;i<30;i++){
    const nextY=p.y+8;
    const r=sculptNavigationRoute(c,p,p.x,nextY);
    events.push({y:p.y,to:nextY,reason:r.reason,bridgeId:r.bridgeId});
    if(r.reason)break;
    p={...p,y:nextY,sculptBridgeId:r.bridgeId};
 }
 console.log('V69_DIAG',JSON.stringify({corridor,banks:sculptBridgeBankHeights(t,corridor,{cellWidth:CW,cellHeight:CH}),direct,events}));
});

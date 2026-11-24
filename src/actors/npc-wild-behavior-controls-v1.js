// One UI implementation for a reusable NPC definition or a legacy inline
// placement. Both serialize the same canonical NPC policy, not a new store.
import {normalizeNpcWildBehaviorV1} from './map-actor-npc-settings-v1.js';
export function mountNpcWildBehaviorControlsV1(host,onChange){
 if(!host)return null;
 const doc=host.ownerDocument,fields={};
 function field(key,label,element){
  const wrapper=doc.createElement('label');wrapper.textContent=label;
  wrapper.append(element);host.append(wrapper);fields[key]=element;
 }
 const mode=doc.createElement('select');
 for(const [value,label] of [['pacific','Pacifique — interaction volontaire'],['contact','Réagit au contact'],['aggressive','Agressif — détecte et poursuit']]){
  const option=doc.createElement('option');option.value=value;option.textContent=label;mode.append(option);
 }
 field('mode','Comportement ',mode);
 for(const [key,label,min,max] of [['detectionRadius','Distance de détection ',24,600],['disengageRadius','Distance de désengagement / territoire ',24,1200],['cooldownSeconds','Délai entre combats (s) ',0,300]]){
  const input=doc.createElement('input');input.type='number';input.min=String(min);input.max=String(max);input.step='1';
  field(key,label,input);
 }
 const home=doc.createElement('input');home.type='checkbox';field('returnHome','Retour au point d’origine ',home);
 const hint=doc.createElement('small');hint.textContent='Les distances utilisent les unités de la carte. Les obstacles restent infranchissables.';host.append(hint);
 const read=()=>normalizeNpcWildBehaviorV1({mode:mode.value,detectionRadius:Number(fields.detectionRadius.value),
  disengageRadius:Number(fields.disengageRadius.value),cooldownSeconds:Number(fields.cooldownSeconds.value),returnHome:home.checked});
 const set=(raw)=>{const value=normalizeNpcWildBehaviorV1(raw);for(const [key,el] of Object.entries(fields)){
   if(el.type==='checkbox')el.checked=value[key];else el.value=String(value[key]);}
 };
 for(const el of Object.values(fields))el.addEventListener('change',()=>onChange?.());
 set();
 return Object.freeze({read,set});
}

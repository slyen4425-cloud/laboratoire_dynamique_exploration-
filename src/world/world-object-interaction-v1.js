// Optional authored data only. No inventory, RNG, save, or executable action.
export const WORLD_OBJECT_INTERACTION_ACTIONS_V1=Object.freeze(['message','reward']);
const bounded=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const whole=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export function normalizeWorldObjectInteractionV1(raw){
 if(raw==null||raw.enabled===false)return null;
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.enabled!==true||!WORLD_OBJECT_INTERACTION_ACTIONS_V1.includes(raw.action))
  throw Error('Interaction objet invalide');
 const label=bounded(raw.label,60),message=bounded(raw.message,500);
 if(!label||!message||!whole(raw.radius,16,240)||typeof raw.once!=='boolean')throw Error('Réglages interaction objet invalides');
 const base={enabled:true,action:raw.action,label,message,radius:raw.radius,once:raw.once};
 if(raw.action==='message')return Object.freeze(base);
 // Reward references only; the Capture owner must validate IDs/amounts and commit.
 if(!raw.once||!whole(raw.currency,0,999999)||!Array.isArray(raw.items)||raw.items.length>16)throw Error('Récompense objet invalide');
 const seen=new Set(),items=raw.items.map(entry=>{
  const itemId=bounded(entry?.itemId,160);
  if(!itemId||itemId!==entry.itemId||seen.has(itemId)||!whole(entry.quantity,1,999))throw Error('Objet de récompense invalide');
  seen.add(itemId);return Object.freeze({itemId,quantity:entry.quantity});
 });
 if(!raw.currency&&!items.length)throw Error('Récompense vide');
 return Object.freeze({...base,currency:raw.currency,items:Object.freeze(items)});
}

import {buildObjectLibraryTree} from './object-library-taxonomy.js';
// Presentation only. The existing placement controls remain the sole owner of
// selected definition/kind. No separate object selection model is maintained.
export function createObjectLibraryPicker({root,search,summary,definitions,onSelect,getSelected}){
 if(!root||!search||!summary)return null;
 let buttons=new Map(),previousOpen=new Set();
 function sync({reveal=false}={}){
  const id=getSelected(),selected=definitions.find(d=>d.id===id);
  summary.textContent=selected?.label??'Choisir un objet';
  for(const [key,button] of buttons){
   button.setAttribute('aria-pressed',String(key===id));
   if(reveal&&key===id){
    let parent=button.parentElement;
    while(parent&&parent!==root){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}
   }
  }
 }
 function render(){
  const query=search.value.trim();
  if(!query)previousOpen=new Set([...root.querySelectorAll('details[open]')].map(d=>d.dataset.libraryPath));
  const tree=buildObjectLibraryTree(definitions,query);
  buttons=new Map();
  const create=(node,path)=>{
   const details=document.createElement('details'),key=JSON.stringify([...path,node.label]);
   details.dataset.libraryPath=key;details.open=Boolean(query)||previousOpen.has(key);
   const heading=document.createElement('summary');heading.textContent=node.label+' · '+node.count;details.append(heading);
   for(const child of node.children)details.append(create(child,[...path,node.label]));
   for(const def of node.definitions){
    const button=document.createElement('button');button.type='button';button.dataset.objectDefinition=def.id;
    button.textContent=def.label;button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{onSelect(def);sync();});
    buttons.set(def.id,button);details.append(button);
   }
   return details;
  };
  const nodes=tree.children.map(node=>create(node,[]));
  if(!nodes.length){const empty=document.createElement('p');empty.textContent='Aucun objet trouvé.';nodes.push(empty);}
  root.replaceChildren(...nodes);sync();
 }
 search.addEventListener('input',render);render();
 return Object.freeze({sync,render});
}

import {normalizeObjectLibraryLayout,addObjectLibraryCategory,editObjectLibraryCategory,reorderObjectLibraryCategory,assignObjectLibraryCategory,removeObjectLibraryCategory,objectLibraryCategoryPath} from './object-library-layout-v1.js';
import {createObjectLibraryLayoutStore} from '../storage/object-library-layout-store-v1.js';
export function createObjectLibraryLayoutControls({root,getSelected,onChange,store=createObjectLibraryLayoutStore()}){
 let state={revision:0,layout:normalizeObjectLibraryLayout()},ready=false,busy=false;
 const $=id=>root.querySelector('[data-library-layout="'+id+'"]');
 const category=$('category'),parent=$('parent'),name=$('name'),status=$('status'),target=$('target');
 function populate(select,items,first,preferred){
  const opt=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
  select.replaceChildren(opt('',first),...items.map(c=>opt(c.id,objectLibraryCategoryPath(state.layout,c.id).map(x=>x.label).join(' / '))));
  select.value=items.some(c=>c.id===preferred)?preferred:'';
 }
 function refresh(preferred=category.value){
  const categories=state.layout.categories;
  populate(category,categories,'Nouvelle catégorie',preferred);
  const current=categories.find(c=>c.id===category.value);
  populate(parent,categories.filter(c=>!objectLibraryCategoryPath(state.layout,c.id).some(p=>p.id===current?.id)),'Catégorie principale',current?.parentId??'');
  name.value=current?.label??'';
  populate(target,categories,'Classement natif',state.layout.assignments[getSelected()]??'');
  for(const el of root.querySelectorAll('button,input,select'))el.disabled=!ready||busy;
  $('reload').disabled=busy;
  for(const action of ['rename','move','up','down','remove'])$(action).disabled=!ready||busy||!current;
  $('assign').disabled=!ready||busy||!getSelected();
 }
 async function commit(operation){
  if(!ready||busy)return;
  busy=true;
  for(const el of root.querySelectorAll('button,input,select'))el.disabled=true;
  try{
   const result=operation(state.layout);
   state=await store.save(result.layout,state.revision);
   onChange(state.layout);status.textContent='Classement enregistré.';refresh(result.selected??category.value);
  }catch(e){status.textContent=e.message;}
  finally{busy=false;refresh();}
 }
 category.addEventListener('change',()=>refresh());
 $('add').addEventListener('click',()=>commit(layout=>{
  const next=addObjectLibraryCategory(layout,{name:name.value,parentId:parent.value||null});
  return {layout:next,selected:next.categories.at(-1).id};
 }));
 $('rename').addEventListener('click',()=>commit(layout=>({layout:editObjectLibraryCategory(layout,category.value,{name:name.value})})));
 $('move').addEventListener('click',()=>commit(layout=>({layout:editObjectLibraryCategory(layout,category.value,{parentId:parent.value||null})})));
 $('up').addEventListener('click',()=>commit(layout=>({layout:reorderObjectLibraryCategory(layout,category.value,-1)})));
 $('down').addEventListener('click',()=>commit(layout=>({layout:reorderObjectLibraryCategory(layout,category.value,1)})));
 $('remove').addEventListener('click',()=>commit(layout=>({layout:removeObjectLibraryCategory(layout,category.value),selected:''})));
 $('assign').addEventListener('click',()=>commit(layout=>({layout:assignObjectLibraryCategory(layout,getSelected(),target.value||null)})));
 const load=async()=>{
  if(busy)return;
  busy=true;refresh();
  try{state=await store.load();ready=true;onChange(state.layout);status.textContent='Classement personnel disponible.';}
  catch(e){ready=false;status.textContent=e.message;}
  finally{busy=false;refresh();}
 };
 // Separate reload button stays available after failure; no empty layout is saved.
 $('reload').addEventListener('click',load);
 function sync(){populate(target,state.layout.categories,'Classement natif',state.layout.assignments[getSelected()]??'');$('assign').disabled=!ready||busy||!getSelected();}
 refresh();load();
 return Object.freeze({getLayout:()=>state.layout,sync,reload:load});
}

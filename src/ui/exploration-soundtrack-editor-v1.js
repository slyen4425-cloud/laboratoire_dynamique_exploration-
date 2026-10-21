import {
  createEmptyExplorationSoundtrackBindingsV1,
  normalizeExplorationSoundtrackBindingsV1,
  setExplorationSoundtrackBindingV1,
  resolveExplorationSoundtrackSceneV1,
  createExplorationSoundtrackContextV1
} from "../adapters/exploration-soundtrack-bindings-v1.js";

export function mountExplorationSoundtrackEditorV1({root,documentRef=root?.ownerDocument}){
  if(!root?.querySelector || !documentRef)throw new TypeError("soundtrack editor root required");
  const one=name=>{
    const element=root.querySelector('[data-exploration-soundtrack-'+name+']');
    if(!element)throw new Error("exploration soundtrack control missing: "+name);
    return element;
  };
  const el={
    project:one("project"),kind:one("kind"),context:one("context"),scene:one("scene"),
    status:one("status"),current:one("current-area"),save:one("save"),remove:one("remove"),
    reset:one("new-project"),export:one("export"),import:one("import"),
    preview:one("preview"),bindings:one("bindings")
  };
  let value=createEmptyExplorationSoundtrackBindingsV1(el.project.value || "capture-demo");
  let disposed=false;
  const listeners=[];
  const on=(node,type,fn)=>{node.addEventListener(type,fn);listeners.push([node,type,fn]);};
  const status=(message,okay=true)=>{
    el.status.textContent=message;
    el.status.dataset.tone=okay?"success":"error";
  };
  const guard=fn=>{
    if(disposed)return;
    try{fn();}catch(error){status(error?.message??String(error),false);}
  };
  const kind=()=>el.kind.value;
  const context=()=>["default","combat"].includes(kind())?null:el.context.value.trim();
  function currentScene(){
    if(kind()==="default") return value.defaultSceneId;
    if(kind()==="combat") return value.combatSceneId;
    const map=kind()==="area"?value.areaScenes:value.terrainFamilyScenes;
    return map[context()]??null;
  }
  function render(){
    el.context.disabled=["default","combat"].includes(kind());
    el.scene.value=currentScene()??"";
    el.bindings.replaceChildren();
    const blocks=[
      ["Global",value.defaultSceneId?value.defaultSceneId:"silence"],
      ["Combat",value.combatSceneId],
      ...Object.entries(value.areaScenes).map(([k,v])=>["Area "+k,v]),
      ...Object.entries(value.terrainFamilyScenes).map(([k,v])=>["Terrain "+k,v])
    ];
    for(const [label,scene] of blocks){
      const li=documentRef.createElement("li");
      li.textContent=label+" → "+scene;
      el.bindings.append(li);
    }
    el.preview.textContent="Aperçu du choix : "+(value.defaultSceneId??"silence");
  }
  on(el.kind,"change",()=>guard(render));
  on(el.context,"change",()=>guard(render));
  on(el.current,"click",()=>guard(()=>{
    const active=documentRef.querySelector("#area-select");
    if(!active?.value)throw new Error("Aucune Area sélectionnée dans le World Builder");
    el.kind.value="area";
    el.context.value=active.value;
    render();
  }));
  on(el.save,"click",()=>guard(()=>{
    if(el.project.value.trim()!==value.projectId)throw new Error("Utilise « Nouveau jeu » pour changer de projet");
    const scene=el.scene.value.trim();
    if(kind()==="combat"&&!scene)throw new Error("La scène de combat doit avoir un ID");
    value=setExplorationSoundtrackBindingV1(value,kind(),context(),scene||null);
    render();
    status("Association enregistrée dans le projet ; exporte le JSON pour la conserver.");
  }));
  on(el.remove,"click",()=>guard(()=>{
    if(kind()==="combat")throw new Error("La scène de combat est requise");
    value=setExplorationSoundtrackBindingV1(value,kind(),context(),null);
    render();status("Association supprimée.");
  }));
  on(el.reset,"click",()=>guard(()=>{
    value=createEmptyExplorationSoundtrackBindingsV1(el.project.value.trim());
    render();status("Configuration de jeu indépendante créée.");
  }));
  on(el.preview,"click",()=>guard(()=>{
    const areaId=documentRef.querySelector("#area-select")?.value || "outside";
    const terrainFamilyId=documentRef.querySelector("#terrain-family")?.value || null;
    const scene=resolveExplorationSoundtrackSceneV1(value,{areaId,terrainFamilyId});
    const context=createExplorationSoundtrackContextV1(value);
    el.preview.textContent="Area "+areaId+" → "+(scene??"silence")+" ; Combat → "+context.battleSceneId;
  }));
  on(el.export,"click",()=>guard(()=>{
    value=normalizeExplorationSoundtrackBindingsV1(value);
    const a=documentRef.createElement("a");
    a.download="gensrpg-exploration-soundtrack-"+value.projectId+".json";
    a.href="data:application/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(value,null,2));
    root.append(a);a.click();a.remove();
    status("Associations musicales du jeu exportées : "+value.projectId);
  }));
  on(el.import,"change",async()=>{
    const file=el.import.files?.[0];
    if(!file)return;
    try{
      const imported=normalizeExplorationSoundtrackBindingsV1(JSON.parse(await file.text()));
      if(disposed)return;
      value=imported;
      el.project.value=value.projectId;
      render();status("Associations du jeu « "+value.projectId+" » importées.");
    }catch(error){if(!disposed)status("Import refusé : "+(error?.message??String(error)),false);}
    finally{el.import.value="";}
  });
  render();
  return Object.freeze({snapshot:()=>value,dispose(){if(disposed)return;disposed=true;
    for(const [el,type,fn] of listeners)el.removeEventListener(type,fn);
    listeners.length=0;
  }});
}

if(typeof document!=="undefined"){
  const root=document.querySelector("[data-exploration-soundtrack-editor]");
  if(root)mountExplorationSoundtrackEditorV1({root});
}

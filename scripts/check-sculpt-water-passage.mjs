// Exercise the two native pointer entry points against a disposable heightfield.
export async function checkSculptWaterPassage({send,run,sleep,url}){
  for(const touch of [false,true]){
    await send('Emulation.setDeviceMetricsOverride',{width:touch?873:1366,
      height:touch?393:768,deviceScaleFactor:1,mobile:touch});
    await send('Emulation.setTouchEmulationEnabled',{enabled:touch});
    await send('Page.navigate',{url});
    let ready=false;
    for(let i=0;i<100&&!ready;i++){
      await sleep(100);
      try{ready=await run("typeof __sculptLabProbe==='function' && !!document.querySelector('#nav-zone-support')");}catch{}
    }
    if(!ready)throw Error('Éditeur de passage indisponible');
    const prepare=await run(`(async()=>{
      const q=id=>document.getElementById(id);
      const redraw=()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
      const exportGrid=()=>{q('export').click();return JSON.parse(q('json').value)};
      const load=grid=>{q('json').value=JSON.stringify(grid);q('import').click()};
      const grid=exportGrid();
      grid.levels.fill(2);grid.waterLevels.fill(-1);grid.spheres=[];grid.ramps=[];
      load(grid);
      q('radius').value=1;q('radius').dispatchEvent(new Event('input',{bubbles:true}));
      q('nav-zone-support').value='footbridge';q('nav-zone-support').dispatchEvent(new Event('change'));
      q('nav-zone-visible').checked=true;q('nav-zone-allow').click();
      const canvas=q('sculpt-canvas');canvas.scrollIntoView({block:'center'});
      await redraw();
      const rect=canvas.getBoundingClientRect();
      let pair;
      for(let y=Math.max(10,rect.top+10);y<Math.min(innerHeight-8,rect.bottom-8)&&!pair;y+=19){
        let first;
        for(let x=Math.max(10,rect.left+10);x<Math.min(innerWidth-8,rect.right-8);x+=19){
          if(document.elementFromPoint(x,y)!==canvas)continue;
          const cell=__sculptLabProbe({x,y}).probedCell;
          if(!cell||cell.x<2||cell.y<2||cell.x>grid.width-3||cell.y>grid.height-3)continue;
          if(!first)first={x,y,cell};
          else if(cell.x-first.cell.x>=5){pair=[first,{x,y,cell}];break}
        }
      }
      if(!pair)throw Error('Deux berges visibles requises');
      for(let i=0;i<grid.waterLevels.length;i++){
        const col=i%grid.width;
        if(col>pair[0].cell.x+1 && col<pair[1].cell.x-1)grid.waterLevels[i]=4;
      }
      load(grid);q('nav-zone-allow').click();canvas.scrollIntoView({block:'center'});await redraw();
      return pair;
    })()`);
    for(const {x,y} of prepare){
      if(touch){
        await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      }else{
        await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
        await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
      }
    }
    const result=await run(`(()=>{document.querySelector('#export').click();
      const grid=JSON.parse(document.querySelector('#json').value);
      return {ramp:grid.ramps.at(-1),message:document.querySelector('#nav-zone-count').textContent};
    })()`);
    if(result.ramp?.support!=='footbridge'||result.ramp.visibleInPlay!==true)
      throw Error('Passerelle absente après tracé '+JSON.stringify({touch,prepare,result}));
    console.log('Passerelle tracée et exportée',touch?'tactile paysage':'souris PC',result.ramp.id);
  }
}

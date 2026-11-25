"use strict";
(async () => {
  const {make,imageUrl,priceNode,loadMenu,initialMenu,formatNumber,client}=CF;
  const tabs=document.querySelector("#tabs"), grid=document.querySelector("#products"), heading=document.querySelector("#category-title"), count=document.querySelector("#count"), message=document.querySelector("#menu-message");
  let data,selected;
  const viewer=document.querySelector("#image-viewer"), largeImage=document.querySelector("#image-viewer-photo");
  let photoTrigger=null;
  function openPhoto(img,trigger) {
    if(viewer.open)return;
    photoTrigger=trigger;
    largeImage.src=img.currentSrc||img.src;
    largeImage.alt=img.alt;
    viewer.showModal();
    document.documentElement.classList.add("photo-viewer-open");
  }
  viewer.addEventListener("click",event=>{
    if(event.target!==largeImage)viewer.close();
  });
  viewer.addEventListener("close",()=>{
    document.documentElement.classList.remove("photo-viewer-open");
    largeImage.removeAttribute("src");
    largeImage.alt="";
    if(photoTrigger?.isConnected)photoTrigger.focus({preventScroll:true});
    photoTrigger=null;
  });
  function display() {
    const c=data.categories.find(c=>c.id===selected) || data.categories[0];
    if (!c) { heading.textContent="المنيو"; grid.replaceChildren(make("p","empty","لا توجد أصناف متاحة حاليًا.")); count.textContent=""; tabs.replaceChildren(); return; }
    selected=c.id;
    tabs.replaceChildren(...data.categories.map(c=>{
      const b=make("button","tab"+(c.id===selected?" selected":""),c.name);
      b.type="button"; b.setAttribute("aria-pressed",String(c.id===selected));
      b.addEventListener("click",()=>{selected=c.id;display();tabs.querySelector(".selected")?.scrollIntoView({block:"nearest",inline:"nearest"});if(location.hash!=="#"+encodeURIComponent(c.id))history.replaceState(null,"","#"+encodeURIComponent(c.id));});
      return b;
    }));
    heading.textContent=c.name;
    const products=data.products.filter(p=>p.category_id===selected);
    count.textContent=formatNumber.format(products.length)+" أصناف";
    grid.replaceChildren(...products.map(p=>{
      const card=make("article","card"), url=imageUrl(p.image);
      if(url){
        const photo=make("button","product-photo");
        photo.type="button";
        photo.setAttribute("aria-label","تكبير صورة "+p.name);
        photo.setAttribute("aria-haspopup","dialog");
        const img=make("img","product-image");
        img.src=url;img.alt=p.name;img.loading="lazy";img.decoding="async";
        img.onerror=()=>{photo.remove();card.classList.add("no-photo");};
        const zoom=make("span","photo-zoom");
        zoom.setAttribute("aria-hidden","true");
        zoom.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>';
        photo.append(img,zoom);
        photo.addEventListener("click",()=>openPhoto(img,photo));
        card.append(photo);
      }
      else card.classList.add("no-photo");
      const body=make("div","card-info");
      const text=make("div","product-copy");
      text.append(make("h2","",p.name));
      if(typeof p.note==="string" && p.note.trim())text.append(make("p","product-note",p.note.trim()));
      body.append(text,priceNode(p.price));card.append(body);return card;
    }));
    if(!products.length)grid.append(make("p","empty","لا توجد أصناف متاحة في هذا القسم حاليًا."));
  }
  try {
    if(client){data=await loadMenu(false);try{localStorage.setItem("cf-menu-cache",JSON.stringify(data));}catch{}}
    else{data=initialMenu(); if(CF.connected)throw Error("تعذر تحميل الاتصال");}
  }catch{
    try{data=JSON.parse(localStorage.getItem("cf-menu-cache"))||initialMenu();}catch{data=initialMenu();}
    message.hidden=false;message.textContent="تعذّر تحديث القائمة حاليًا. الأسعار المعروضة من النسخة المتاحة على هذا الجهاز.";
  }
  try{selected=decodeURIComponent(location.hash.slice(1));}catch{}
  display();
  if(client){
    async function refresh(){
      if(document.hidden)return;
      try{const next=await loadMenu(false);if(JSON.stringify(next)!==JSON.stringify(data)){data=next;display();}try{localStorage.setItem("cf-menu-cache",JSON.stringify(data));}catch{}message.hidden=true;}
      catch{message.hidden=false;message.textContent="تعذّر تحديث القائمة حاليًا. الأسعار المعروضة من النسخة المتاحة على هذا الجهاز.";}
    }
    document.addEventListener("visibilitychange",refresh);
    window.addEventListener("focus",refresh);
    setInterval(refresh,60000);
  }
})();

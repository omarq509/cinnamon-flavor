"use strict";
(() => {
  const {client,make,imageUrl,priceNode,formatNumber,loadMenu}=CF;
  const $=id=>document.getElementById(id);
  let data={categories:[],products:[]}, currentUser=null, editingProduct=null, editingCategory=null;
  function error(id,msg){const n=$(id);n.textContent=msg||"";n.hidden=!msg;}
  function notice(msg,failed=false){const n=$("notice");n.className=failed?"error":"success";n.textContent=msg;n.hidden=false;}
  function setBusy(form,yes){for(const b of form.querySelectorAll("button[type=submit]"))b.disabled=yes;}
  function textError(e){return e?.message||"تعذر إتمام العملية. حاول مجددًا.";}
  async function requireOwner(){
    const r=await client.auth.getUser();
    if(r.error||!r.data.user) throw Error("يرجى تسجيل الدخول من جديد.");
    const u=r.data.user;
    const owner=await client.from("cf_menu_owners").select("user_id").eq("user_id",u.id).maybeSingle();
    if(owner.error||!owner.data)throw Error("هذا الحساب لا يملك صلاحية إدارة المنيو.");
    return u;
  }
  function showLogin(){currentUser=null;$("login").hidden=false;$("dashboard").hidden=true;$("logout").hidden=true;}
  async function enter(){
    currentUser=await requireOwner();
    data=await loadMenu(true);
    $("login").hidden=true;$("dashboard").hidden=false;$("logout").hidden=false;render();error("login-error","");
  }
  $("login-form").addEventListener("submit",async e=>{
    e.preventDefault();error("login-error","");setBusy(e.target,true);
    try{
      if(!client)throw Error("لم يتم ربط لوحة التحكم بقاعدة البيانات بعد.");
      const email=$("email").value.trim().toLowerCase();
      const r=await client.auth.signInWithPassword({email,password:$("password").value});
      if(r.error)throw Error("البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير مؤكد.");
      try{await enter();}catch(err){await client.auth.signOut();throw err;}
      $("password").value="";
    }catch(err){error("login-error",textError(err));}
    finally{setBusy(e.target,false);}
  });
  $("logout").addEventListener("click",async()=>{if(client)await client.auth.signOut();showLogin();});
  document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>{for(const t of document.querySelectorAll("[data-panel]")){const yes=t===b;t.classList.toggle("current",yes);$(t.dataset.panel).hidden=!yes;}});
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  function button(label,kind,action){const b=make("button","btn btn-"+kind,label);b.type="button";b.addEventListener("click",async()=>{b.disabled=true;try{await action();}catch(e){notice(textError(e),true);}finally{b.disabled=false;}});return b;}
  function option(value,label){const o=make("option","",label);o.value=value;return o;}
  function categoryOptions(select,all=false,value=""){
    select.replaceChildren(...(all?[option("","كل الأقسام")]:[]),...data.categories.map(c=>option(c.id,c.name)));
    if([...select.options].some(o=>o.value===value))select.value=value;
  }
  function badge(visible){return make("span","badge"+(visible?"":" off"),visible?"متاح":"مخفي");}
  function render(){
    $("metric-products").textContent=formatNumber.format(data.products.length);
    $("metric-visible").textContent=formatNumber.format(data.products.filter(p=>p.visible&&data.categories.some(c=>c.id===p.category_id&&c.visible)).length);
    $("metric-cats").textContent=formatNumber.format(data.categories.length);
    categoryOptions($("category-filter"),true,$("category-filter").value);
    $("add-product").disabled=!data.categories.length;
    renderProducts();renderCategories();
  }
  function renderProducts(){
    const search=$("search").value.trim().toLowerCase(),category=$("category-filter").value;
    const rows=data.products.filter(p=>(!category||p.category_id===category)&&p.name.toLowerCase().includes(search)).map(p=>{
      const row=make("article","admin-row"),url=imageUrl(p.image);
      const img=url?make("img","thumb"):make("div","thumb no-image","—");if(url){img.src=url;img.alt="";img.loading="lazy";}
      const main=make("div","row-main");const c=data.categories.find(c=>c.id===p.category_id);
      main.append(make("h3","",p.name),make("small","",c?.name||""));
      if(typeof p.note==="string"&&p.note.trim())main.append(make("p","product-note admin-note",p.note.trim()));
      main.append(priceNode(p.price),badge(p.visible&&c?.visible));
      const actions=make("div","row-buttons");
      actions.append(button("تعديل","secondary",()=>openProduct(p)),button(p.visible?"إخفاء":"إظهار","secondary",async()=>{
        await mutate(client.from("cf_menu_products").update({visible:!p.visible}).eq("id",p.id));await reload("تم تحديث التوفر.");
      }),button("حذف","danger",async()=>{
        if(!confirm("حذف "+p.name+"؟"))return;
        await mutate(client.from("cf_menu_products").delete().eq("id",p.id));await reload("تم حذف المنتج.");
      }));
      row.append(img,main,actions);return row;
    });
    $("product-list").replaceChildren(...rows);
    if(!rows.length)$("product-list").append(make("p","empty","لا توجد منتجات مطابقة."));
  }
  function renderCategories(){
    $("category-list").replaceChildren(...data.categories.map(c=>{
      const row=make("article","admin-row"),main=make("div","row-main");
      main.append(make("h3","",c.name),make("small","",formatNumber.format(data.products.filter(p=>p.category_id===c.id).length)+" أصناف · ترتيب "+formatNumber.format(c.position)),badge(c.visible));
      const actions=make("div","row-buttons");
      actions.append(button("تعديل","secondary",()=>openCategory(c)),button(c.visible?"إخفاء":"إظهار","secondary",async()=>{
        await mutate(client.from("cf_menu_categories").update({visible:!c.visible}).eq("id",c.id));await reload("تم تحديث القسم.");
      }),button("حذف","danger",async()=>{
        if(data.products.some(p=>p.category_id===c.id))throw Error("انقل منتجات القسم أو احذفها قبل حذف القسم.");
        if(!confirm("حذف قسم "+c.name+"؟"))return;
        await mutate(client.from("cf_menu_categories").delete().eq("id",c.id));await reload("تم حذف القسم.");
      }));
      row.append(main,actions);return row;
    }));
  }
  async function mutate(query){
    const result=await query.select("id");
    if(result.error)throw result.error;
    if(!result.data?.length)throw Error("لم يُحفظ التعديل. تحقق من الصلاحية.");
    return result.data;
  }
  async function reload(msg){data=await loadMenu(true);render();notice(msg);}
  $("search").oninput=renderProducts;$("category-filter").onchange=renderProducts;
  $("add-product").onclick=()=>openProduct(null);$("add-category").onclick=()=>openCategory(null);
  function openProduct(p){
    editingProduct=p;$("product-form").reset();error("product-error","");
    $("product-dialog-title").textContent=p?"تعديل المنتج":"إضافة منتج";
    categoryOptions($("product-category"),false,p?.category_id||$("category-filter").value||data.categories[0]?.id);
    $("product-note").value=p?.note||"";
    $("product-name").value=p?.name||"";$("product-price").value=p?.price??"";
    $("product-position").value=p?.position??Math.max(-1,...data.products.filter(x=>x.category_id===$("product-category").value).map(x=>x.position))+1;
    $("product-visible").checked=p?.visible??true;$("remove-image").checked=false;$("remove-image").disabled=!p?.image;
    const existing=imageUrl(p?.image);$("product-preview").hidden=!existing;if(existing)$("product-preview").src=existing;else $("product-preview").removeAttribute("src");
    $("product-dialog").showModal();
  }
  let previewURL;
  $("product-image").onchange=()=>{
    if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}
    const file=$("product-image").files[0];if(file){previewURL=URL.createObjectURL(file);$("product-preview").src=previewURL;$("product-preview").hidden=false;$("remove-image").checked=false;}
  };
  async function optimize(file){
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>15*1024*1024)throw Error("اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 15 ميجابايت.");
    const bitmap=await createImageBitmap(file);
    try{
      const ratio=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
      canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
      const result=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("تعذر تجهيز الصورة.")),"image/webp",.85));
      if(result.type!=="image/webp"||result.size>2097152)throw Error("تعذر تجهيز الصورة بحجم مناسب.");
      return result;
    }finally{bitmap.close();}
  }
  $("product-form").onsubmit=async e=>{
    e.preventDefault();setBusy(e.target,true);error("product-error","");
    let uploaded=null,committed=false;
    try{
      const name=$("product-name").value.trim(),price=$("product-price").valueAsNumber,position=$("product-position").valueAsNumber;
      if(!name||!Number.isFinite(price)||price<0||!Number.isInteger(position)||position<0)throw Error("تأكد من الاسم والسعر وترتيب العرض.");
      let image=$("remove-image").checked?null:editingProduct?.image||null;
      const file=$("product-image").files[0];
      if(file){
        const blob=await optimize(file),path=crypto.randomUUID()+".webp";
        const up=await client.storage.from("cf-menu-images").upload(path,blob,{contentType:"image/webp",upsert:false,cacheControl:"31536000"});
        if(up.error)throw up.error;
        uploaded=path;image="storage:"+path;
      }
      const note=$("product-note").value.trim();
      if([...note].length>250)throw Error("الملاحظة يجب ألا تتجاوز 250 حرفًا.");
      const values={name,price,position,note:note||null,category_id:$("product-category").value,visible:$("product-visible").checked,image};
      await mutate(editingProduct?client.from("cf_menu_products").update(values).eq("id",editingProduct.id):client.from("cf_menu_products").insert(values));committed=true;
      $("product-dialog").close();await reload("تم حفظ المنتج ونشر التعديلات.");
    }catch(err){if(uploaded&&!committed)await client.storage.from("cf-menu-images").remove([uploaded]);error("product-error",textError(err));if(committed)notice("تم الحفظ، لكن تعذّر تحديث العرض. أعد تحميل الصفحة.",true);}
    finally{setBusy(e.target,false);}
  };
  function openCategory(c){
    editingCategory=c;error("category-error","");$("category-dialog-title").textContent=c?"تعديل القسم":"إضافة قسم";$("category-name").value=c?.name||"";$("category-position").value=c?.position??Math.max(-1,...data.categories.map(x=>x.position))+1;$("category-visible").checked=c?.visible??true;$("category-dialog").showModal();
  }
  $("category-form").onsubmit=async e=>{
    e.preventDefault();setBusy(e.target,true);error("category-error","");
    try{
      const name=$("category-name").value.trim(),position=$("category-position").valueAsNumber;
      if(!name||!Number.isInteger(position)||position<0)throw Error("تأكد من اسم القسم وترتيب العرض.");
      const values={name,position,visible:$("category-visible").checked};
      await mutate(editingCategory?client.from("cf_menu_categories").update(values).eq("id",editingCategory.id):client.from("cf_menu_categories").insert(values));
      $("category-dialog").close();await reload("تم حفظ القسم.");
    }catch(err){error("category-error",textError(err));}finally{setBusy(e.target,false);}
  };
  $("change-password").onsubmit=async e=>{
    e.preventDefault();setBusy(e.target,true);
    try{
      const pwd=$("new-password").value;
      if(pwd!==$("confirm-password").value)throw Error("كلمتا المرور الجديدتان غير متطابقتين.");
      if(pwd.length<12)throw Error("اختر كلمة مرور من 12 حرفًا على الأقل.");
      const u=await requireOwner();
      const reauth=await client.auth.signInWithPassword({email:u.email,password:$("current-password").value});
      if(reauth.error)throw Error("كلمة المرور الحالية غير صحيحة.");
      const result=await client.auth.updateUser({password:pwd});if(result.error)throw result.error;
      e.target.reset();notice("تم تغيير كلمة المرور.");
    }catch(err){notice(textError(err),true);}finally{setBusy(e.target,false);}
  };
  if(client){
    client.auth.getSession().then(async r=>{
      if(r.data.session)try{await enter();}catch(err){await client.auth.signOut();showLogin();error("login-error",textError(err));}
    });
    client.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT")showLogin();});
  }else{error("login-error","لوحة التحكم جاهزة، لكن يلزم ربط مشروع Supabase أولًا.");$("login-button").disabled=true;}
})();

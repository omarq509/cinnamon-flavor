"use strict";
(() => {
  const config = window.CF_CONFIG || {};
  const connected = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.supabaseUrl || "") && !!config.supabaseKey;
  const client = connected && window.supabase ? window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { storageKey: "cf-menu-auth", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  }) : null;
  const formatPrice = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 });
  const formatNumber = new Intl.NumberFormat("ar-SA");
  const isAdmin = location.pathname.includes("/admin/") || location.pathname.endsWith("/admin");
  const root = isAdmin ? "../" : "./";
  function make(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function imageUrl(image) {
    if (typeof image !== "string") return null;
    if (/^local:[a-z0-9-]+\.webp$/.test(image)) return root + "assets/images/" + image.slice(6);
    if (client && /^storage:[a-f0-9-]+\.webp$/.test(image)) return client.storage.from("cf-menu-images").getPublicUrl(image.slice(8)).data.publicUrl;
    return null;
  }
  function priceNode(price) {
    const node = make("span", "price");
    node.setAttribute("aria-label", formatPrice.format(price) + " ريال سعودي");
    const image = make("img");
    image.src = root + "assets/saudi-riyal.svg"; image.alt = "";
    node.append(make("span", "", formatPrice.format(price)), image);
    return node;
  }
  function getError(error) {
    return error?.message || "تعذّر الاتصال. حاول مرة أخرى.";
  }
  async function loadMenu(owner = false) {
    if (!client) throw Error("لم يتم إعداد الاتصال بـ Supabase.");
    let cats = client.from("cf_menu_categories").select("*").order("position").order("id");
    let products = client.from("cf_menu_products").select("*").order("position").order("id");
    if (!owner) { cats = cats.eq("visible",true); products = products.eq("visible",true); }
    const [a,b] = await Promise.all([cats,products]);
    if (a.error) throw a.error;
    if (b.error) throw b.error;
    return { categories:a.data, products:b.data };
  }
  function initialMenu() {
    return {
      categories: window.MENU_DATA.map((c,i)=>({id:c.id,name:c.name,position:i,visible:true})),
      products: window.MENU_DATA.flatMap(c=>c.items.map((p,i)=>({id:c.id+"-"+i,category_id:c.id,name:p.name,price:p.price,note:p.note||null,image:p.image?"local:"+p.image:null,position:i,visible:true})))
    };
  }
  window.CF = {client,connected,make,imageUrl,priceNode,loadMenu,initialMenu,formatNumber,getError};
})();

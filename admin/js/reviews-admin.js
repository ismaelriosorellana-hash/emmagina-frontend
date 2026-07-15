"use strict";
(function(){
 const $=(s)=>document.querySelector(s); let reviews=[],products=[];
 const esc=(v)=>String(v??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
 const stars=(n)=>"★".repeat(Number(n)||0)+"☆".repeat(5-(Number(n)||0));
 function openModal(review=null){
  $("#review-modal").hidden=false; $("#review-modal-title").textContent=review?"Editar reseña":"Nueva reseña";
  $("#review-id").value=review?._id||""; $("#review-product").value=review?.producto?._id||review?.producto||products[0]?._id||"";
  $("#review-name").value=review?.clienteNombre||""; $("#review-email").value=review?.clienteEmail||""; $("#review-stars").value=review?.estrellas||5;
  $("#review-state").value=review?.estado||"pendiente"; $("#review-title").value=review?.titulo||""; $("#review-comment").value=review?.comentario||"";
  $("#review-verified").checked=review?.compraVerificada===true; $("#review-featured").checked=review?.destacada===true;
 }
 function close(){ $("#review-modal").hidden=true; }
 function render(){
  const approved=reviews.filter(r=>r.estado==="aprobada").length,pending=reviews.filter(r=>r.estado==="pendiente").length;
  $("#reviews-summary").innerHTML=`<article><span>Total</span><strong>${reviews.length}</strong></article><article><span>Aprobadas</span><strong>${approved}</strong></article><article><span>Pendientes</span><strong>${pending}</strong></article>`;
  $("#reviews-list").innerHTML=reviews.length?reviews.map(r=>`<article class="review-admin-card"><div><div class="review-admin-head"><strong>${esc(r.producto?.nombre||"Producto")}</strong><span class="review-admin-stars">${stars(r.estrellas)}</span><span class="review-state ${esc(r.estado)}">${esc(r.estado)}</span>${r.compraVerificada?'<span class="review-state aprobada">Compra verificada</span>':''}</div><p><strong>${esc(r.clienteNombre)}</strong>${r.titulo?` · ${esc(r.titulo)}`:""}</p><p>${esc(r.comentario)}</p><div class="review-admin-meta">${new Date(r.createdAt).toLocaleDateString("es-CL")}</div></div><div class="review-admin-actions"><button class="admin-icon-button" data-edit="${r._id}" title="Editar"><i class="fa-solid fa-pen"></i></button><button class="admin-icon-button" data-delete="${r._id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button></div></article>`).join(""):'<div class="admin-empty">Aún no hay reseñas registradas.</div>';
 }
 async function load(){
  const status=$("#review-status").value; const payload=await AdminAPI.request(`/admin/resenas${status?`?estado=${status}`:""}`); reviews=payload.resenas||[]; render();
 }
 async function loadProducts(){
  const payload=await AdminAPI.request("/admin/productos?limit=500"); products=payload.productos||payload.items||payload||[];
  $("#review-product").innerHTML=products.map(p=>`<option value="${p._id||p.id}">${esc(p.nombre)}${p.sku?` · ${esc(p.sku)}`:""}</option>`).join("");
 }
 $("#review-new").addEventListener("click",()=>openModal()); $("#review-refresh").addEventListener("click",load); $("#review-status").addEventListener("change",load);
 document.addEventListener("click",async(e)=>{if(e.target.closest('[data-close-modal="review-modal"]'))close(); const edit=e.target.closest("[data-edit]");if(edit)openModal(reviews.find(r=>r._id===edit.dataset.edit)); const del=e.target.closest("[data-delete]");if(del&&confirm("¿Eliminar esta reseña?")){await AdminAPI.request(`/admin/resenas/${del.dataset.delete}`,{method:"DELETE"});await load();}});
 $("#review-form").addEventListener("submit",async(e)=>{e.preventDefault();const id=$("#review-id").value;const body={producto:$("#review-product").value,clienteNombre:$("#review-name").value,clienteEmail:$("#review-email").value,estrellas:Number($("#review-stars").value),estado:$("#review-state").value,titulo:$("#review-title").value,comentario:$("#review-comment").value,compraVerificada:$("#review-verified").checked,destacada:$("#review-featured").checked};await AdminAPI.request(id?`/admin/resenas/${id}`:"/admin/resenas",{method:id?"PUT":"POST",body});close();await load();});
 Promise.all([loadProducts(),load()]).catch(err=>{console.error(err);$("#reviews-list").innerHTML='<div class="admin-empty">No fue posible cargar las reseñas.</div>';});
})();

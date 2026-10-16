/* Source names remain readable. Only external navigation on redevelopment is disabled. */
(()=>{'use strict';
function isExternal(href,origin){try{const url=new URL(href,origin);return /^https?:$/.test(url.protocol)&&url.origin!==new URL(origin).origin&&!['rent-check.kr','www.rent-check.kr'].includes(url.hostname);}catch{return false;}}
function sync(){const active=document.body.classList.contains('redevelopment-route');document.querySelectorAll('#mapPage a[href],#redevelopmentShell a[href],a[data-redevelopment-href]').forEach(a=>{if(active&&a.hasAttribute('href')&&isExternal(a.getAttribute('href'),location.href)){a.dataset.redevelopmentHref=a.getAttribute('href');a.dataset.redevelopmentTarget=a.getAttribute('target')||'';a.removeAttribute('href');a.removeAttribute('target');a.setAttribute('aria-disabled','true');a.classList.add('source-text');}else if(!active&&a.dataset.redevelopmentHref){a.setAttribute('href',a.dataset.redevelopmentHref);if(a.dataset.redevelopmentTarget)a.setAttribute('target',a.dataset.redevelopmentTarget);delete a.dataset.redevelopmentHref;delete a.dataset.redevelopmentTarget;a.removeAttribute('aria-disabled');a.classList.remove('source-text');}});}
new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','href']});
document.addEventListener('click',e=>{if(document.body.classList.contains('redevelopment-route')&&e.target.closest?.('a[data-redevelopment-href]')){e.preventDefault();e.stopImmediatePropagation();}},true);
window.RentRedevelopmentExternalLinks={isExternal,sync};sync();
})();

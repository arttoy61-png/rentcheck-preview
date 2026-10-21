// Minimal detached DOM for the pilot renderer's template transformations.
// This is a unit-test fixture, not browser or layout emulation.
const voidTags=new Set(['br','hr','img','input','meta','link','wbr','area','base','col','embed','param','source','track']);
class Element {
  constructor(tag='',attrs={},text=''){this.tag=tag;this.attrs=attrs;this.text=text;this.nodes=[];this.parentElement=null;}
  get children(){return this.nodes.filter(n=>n.tag);}
  get firstElementChild(){return this.children[0]||null;}
  get textContent(){return this.tag?this.nodes.map(n=>n.textContent).join(''):this.text;}
  set textContent(text){this.nodes=[];const node=new Element('','',String(text));node.parentElement=this;this.nodes.push(node);}
  get classList(){return {contains:name=>(this.attrs.class||'').split(/\s+/).includes(name)};}
  get innerHTML(){return this.nodes.map(n=>n.outerHTML).join('');}
  set innerHTML(html){this.nodes=[];parse(html,this);}
  get outerHTML(){if(!this.tag)return this.text;const attrs=Object.entries(this.attrs).map(([k,v])=>' '+k+'="'+v+'"').join('');return '<'+this.tag+attrs+'>'+this.innerHTML+(voidTags.has(this.tag)?'':'</'+this.tag+'>');}
  remove(){if(this.parentElement)this.parentElement.nodes=this.parentElement.nodes.filter(n=>n!==this);this.parentElement=null;}
  setAttribute(name,value){this.attrs[name]=String(value);}
  removeAttribute(name){delete this.attrs[name];}
  getAttribute(name){return this.attrs[name]??null;}
  hasAttribute(name){return Object.hasOwn(this.attrs,name);}
  matches(selector){
    if(selector[0]==='.')return this.classList.contains(selector.slice(1));
    if(selector[0]==='#')return this.attrs.id===selector.slice(1);
    const attr=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if(attr)return Object.hasOwn(this.attrs,attr[1])&&(attr[2]===undefined||this.attrs[attr[1]]===attr[2]);
    return this.tag===selector;
  }
  querySelectorAll(selector){
    if(selector.startsWith(':scope > '))return this.children.filter(n=>n.matches(selector.slice(9)));
    const found=[];for(const child of this.children){if(child.matches(selector))found.push(child);found.push(...child.querySelectorAll(selector));}return found;
  }
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
function parse(html,root){
  const stack=[root];
  for(const token of String(html).match(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|[^<]+/g)||[]){
    if(token.startsWith('<!--'))continue;
    if(token.startsWith('</')){const tag=token.slice(2,-1).trim().toLowerCase();while(stack.length>1){if(stack.pop().tag===tag)break;}continue;}
    const parent=stack[stack.length-1];let node;
    if(token[0]==='<'){
      const head=token.match(/^<([^\s/>]+)/),tag=head[1].toLowerCase(),attrs={};
      const body=token.slice(head[0].length,token.length-1).replace(/\/$/,'');
      for(const m of body.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[m[1]]=m[2]??m[3]??m[4]??'';
      node=new Element(tag,attrs);parent.nodes.push(node);node.parentElement=parent;
      if(!voidTags.has(tag)&&!token.endsWith('/>'))stack.push(node);
    }else{node=new Element('',{},token);parent.nodes.push(node);node.parentElement=parent;}
  }
  return root;
}
function createDocument(){return {addEventListener(){},createElement(tag){if(tag==='template'){const content=new Element('fragment');return {content,get innerHTML(){return content.innerHTML;},set innerHTML(html){content.innerHTML=html;}};}return new Element(tag);}};}
module.exports={createDocument,parseFragment:html=>parse(html,new Element('fragment'))};

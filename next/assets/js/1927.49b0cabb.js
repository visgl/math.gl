"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["1927"],{6040(e,t,i){let o;i.d(t,{e:()=>eG});var n,r,a,l,c=i(81413),s=i(1354),u=i(60616),f=0,d=[],p=u.fF,m=p.__b,h=p.__r,g=p.diffed,v=p.__c,w=p.unmount,_=p.__;function y(e,t){p.__h&&p.__h(r,e,f||t),f=0;var i=r.__H||(r.__H={__:[],__h:[]});return e>=i.__.length&&i.__.push({}),i.__[e]}function b(e,t,i){var o=y(n++,2);if(o.t=e,!o.__c&&(o.__=[i?i(t):k(void 0,t),function(e){var t=o.__N?o.__N[0]:o.__[0],i=o.t(t,e);t!==i&&(o.__N=[i,o.__[1]],o.__c.setState({}))}],o.__c=r,!r.__f)){var a=function(e,t,i){if(!o.__c.__H)return!0;var n=!1,r=o.__c.props!==e;if(o.__c.__H.__.some(function(e){if(e.__N){n=!0;var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(r=!0)}}),l){var a=l.call(this,e,t,i);return n?a||r:a}return!n||r};r.__f=!0;var l=r.shouldComponentUpdate,c=r.componentWillUpdate;r.componentWillUpdate=function(e,t,i){if(this.__e){var o=l;l=void 0,a(e,t,i),l=o}c&&c.call(this,e,t,i)},r.shouldComponentUpdate=a}return o.__N||o.__}function C(e,t){var i=y(n++,3);!p.__s&&N(i.__H,t)&&(i.__=e,i.u=t,r.__H.__h.push(i))}function x(e,t){var i=y(n++,4);!p.__s&&N(i.__H,t)&&(i.__=e,i.u=t,r.__h.push(i))}function A(e){return f=5,L(function(){return{current:e}},[])}function L(e,t){var i=y(n++,7);return N(i.__H,t)&&(i.__=e(),i.__H=t,i.__h=e),i.__}function D(e,t){return f=8,L(function(){return e},t)}function M(){for(var e;e=d.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(T),t.__h.some(P),t.__h=[]}catch(i){t.__h=[],p.__e(i,e.__v)}}}p.__b=function(e){r=null,m&&m(e)},p.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),_&&_(e,t)},p.__r=function(e){h&&h(e),n=0;var t=(r=e.__c).__H;t&&(a===r?(t.__h=[],r.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(T),t.__h.some(P),t.__h=[],n=0)),a=r},p.diffed=function(e){g&&g(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(1!==d.push(t)&&l===p.requestAnimationFrame||((l=p.requestAnimationFrame)||function(e){var t,i=function(){clearTimeout(o),S&&cancelAnimationFrame(t),setTimeout(e)},o=setTimeout(i,35);S&&(t=requestAnimationFrame(i))})(M)),t.__H.__.some(function(e){e.u&&(e.__H=e.u,e.u=void 0)})),a=r=null},p.__c=function(e,t){t.some(function(e){try{e.__h.some(T),e.__h=e.__h.filter(function(e){return!e.__||P(e)})}catch(i){t.some(function(e){e.__h&&(e.__h=[])}),t=[],p.__e(i,e.__v)}}),v&&v(e,t)},p.unmount=function(e){w&&w(e);var t,i=e.__c;i&&i.__H&&(i.__H.__.some(function(e){try{T(e)}catch(e){t=e}}),i.__H=void 0,t&&p.__e(t,i.__v))};var S="function"==typeof requestAnimationFrame;function T(e){var t=r,i=e.__c;"function"==typeof i&&(e.__c=void 0,i()),r=t}function P(e){var t=r;e.__c=e.__(),r=t}function N(e,t){return!e||e.length!==t.length||t.some(function(t,i){return t!==e[i]})}function k(e,t){return"function"==typeof t?t(e):t}let B=Math.min,F=Math.max,R=Math.round,E=Math.floor,z=e=>({x:e,y:e}),I={left:"right",right:"left",bottom:"top",top:"bottom"};function O(e,t){return"function"==typeof e?e(t):e}function q(e){return e.split("-")[0]}function H(e){return e.split("-")[1]}function Y(e){return"x"===e?"y":"x"}function W(e){return"y"===e?"height":"width"}function $(e){let t=e[0];return"t"===t||"b"===t?"y":"x"}function j(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}let U=["left","right"],G=["right","left"],V=["top","bottom"],X=["bottom","top"];function K(e){let t=q(e);return I[t]+e.slice(t.length)}function J(e){let{x:t,y:i,width:o,height:n}=e;return{width:o,height:n,top:i,left:t,right:t+o,bottom:i+n,x:t,y:i}}function Q(e,t,i){let o,{reference:n,floating:r}=e,a=$(t),l=Y($(t)),c=W(l),s=q(t),u=n.x+n.width/2-r.width/2,f=n.y+n.height/2-r.height/2,d=n[c]/2-r[c]/2;switch(s){case"top":o={x:u,y:n.y-r.height};break;case"bottom":o={x:u,y:n.y+n.height};break;case"right":o={x:n.x+n.width,y:f};break;case"left":o={x:n.x-r.width,y:f};break;default:o={x:n.x,y:n.y}}let p=H(t);return p&&(o[l]+=d*("end"===p?1:-1)*(i&&"y"===a?-1:1)),o}async function Z(e,t){var i,o,n,r,a;void 0===t&&(t={});let{x:l,y:c,platform:s,rects:u,elements:f,strategy:d}=e,{boundary:p="clippingAncestors",rootBoundary:m="viewport",elementContext:h="floating",altBoundary:g=!1,padding:v=0}=O(t,e),w="number"!=typeof v?{top:null!=(o=v.top)?o:0,right:null!=(n=v.right)?n:0,bottom:null!=(r=v.bottom)?r:0,left:null!=(a=v.left)?a:0}:{top:v,right:v,bottom:v,left:v},_=f[g?"floating"===h?"reference":"floating":h],y=J(await s.getClippingRect({element:null==(i=await (null==s.isElement?void 0:s.isElement(_)))||i?_:_.contextElement||await (null==s.getDocumentElement?void 0:s.getDocumentElement(f.floating)),boundary:p,rootBoundary:m,strategy:d})),b="floating"===h?{x:l,y:c,width:u.floating.width,height:u.floating.height}:u.reference,C=await (null==s.getOffsetParent?void 0:s.getOffsetParent(f.floating)),x=await (null==s.isElement?void 0:s.isElement(C))&&await (null==s.getScale?void 0:s.getScale(C))||{x:1,y:1},A=J(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:f,rect:b,offsetParent:C,strategy:d}):b);return{top:(y.top-A.top+w.top)/x.y,bottom:(A.bottom-y.bottom+w.bottom)/x.y,left:(y.left-A.left+w.left)/x.x,right:(A.right-y.right+w.right)/x.x}}let ee=async(e,t,i)=>{let{placement:o="bottom",strategy:n="absolute",middleware:r=[],platform:a}=i,l=a.detectOverflow?a:{...a,detectOverflow:Z},c=await (null==a.isRTL?void 0:a.isRTL(t)),s=await a.getElementRects({reference:e,floating:t,strategy:n}),{x:u,y:f}=Q(s,o,c),d=o,p=0,m={};for(let i=0;i<r.length;i++){let h=r[i];if(!h)continue;let{name:g,fn:v}=h,{x:w,y:_,data:y,reset:b}=await v({x:u,y:f,initialPlacement:o,placement:d,strategy:n,middlewareData:m,rects:s,platform:l,elements:{reference:e,floating:t}});u=null!=w?w:u,f=null!=_?_:f,m[g]={...m[g],...y},b&&p<50&&(p++,"object"==typeof b&&(b.placement&&(d=b.placement),b.rects&&(s=!0===b.rects?await a.getElementRects({reference:e,floating:t,strategy:n}):b.rects),{x:u,y:f}=Q(s,d,c)),i=-1)}return{x:u,y:f,placement:d,strategy:n,middlewareData:m}},et=new Set(["left","top"]);async function ei(e,t){let{placement:i,platform:o,elements:n}=e,r=await (null==o.isRTL?void 0:o.isRTL(n.floating)),a=q(i),l=H(i),c="y"===$(i),s=et.has(a)?-1:1,u=r&&c?-1:1,f=O(t,e),{mainAxis:d,crossAxis:p,alignmentAxis:m}="number"==typeof f?{mainAxis:f,crossAxis:0,alignmentAxis:null}:{mainAxis:f.mainAxis||0,crossAxis:f.crossAxis||0,alignmentAxis:f.alignmentAxis};return l&&"number"==typeof m&&(p="end"===l?-1*m:m),c?{x:p*u,y:d*s}:{x:d*s,y:p*u}}function eo(){return"u">typeof window}function en(e){return el(e)?(e.nodeName||"").toLowerCase():"#document"}function er(e){var t;return(null==e||null==(t=e.ownerDocument)?void 0:t.defaultView)||window}function ea(e){var t;return null==(t=(el(e)?e.ownerDocument:e.document)||window.document)?void 0:t.documentElement}function el(e){return!!eo()&&(e instanceof Node||e instanceof er(e).Node)}function ec(e){return!!eo()&&(e instanceof Element||e instanceof er(e).Element)}function es(e){return!!eo()&&(e instanceof HTMLElement||e instanceof er(e).HTMLElement)}function eu(e){return!(!eo()||"u"<typeof ShadowRoot)&&(e instanceof ShadowRoot||e instanceof er(e).ShadowRoot)}function ef(e){let{overflow:t,overflowX:i,overflowY:o,display:n}=e_(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+i)&&"inline"!==n&&"contents"!==n}function ed(e){try{if(e.matches(":popover-open"))return!0}catch(e){}try{return e.matches(":modal")}catch(e){return!1}}let ep=/transform|translate|scale|rotate|perspective|filter/,em=/paint|layout|strict|content/,eh=e=>!!e&&"none"!==e;function eg(e){let t=ec(e)?e_(e):e;return eh(t.transform)||eh(t.translate)||eh(t.scale)||eh(t.rotate)||eh(t.perspective)||!ev()&&(eh(t.backdropFilter)||eh(t.filter))||ep.test(t.willChange||"")||em.test(t.contain||"")}function ev(){return null==o&&(o="u">typeof CSS&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),o}function ew(e){return/^(html|body|#document)$/.test(en(e))}function e_(e){return er(e).getComputedStyle(e)}function ey(e){return ec(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function eb(e){if("html"===en(e))return e;let t=e.assignedSlot||e.parentNode||eu(e)&&e.host||ea(e);return eu(t)?t.host:t}function eC(e,t,i){var o;void 0===t&&(t=[]),void 0===i&&(i=!0);let n=function e(t){let i=eb(t);return ew(i)?(t.ownerDocument||t).body:es(i)&&ef(i)?i:e(i)}(e),r=n===(null==(o=e.ownerDocument)?void 0:o.body),a=er(n);if(!r)return t.concat(n,eC(n,[],i));{let e=ex(a);return t.concat(a,a.visualViewport||[],ef(n)?n:[],e&&i?eC(e):[])}}function ex(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function eA(e){let t=e_(e),i=parseFloat(t.width)||0,o=parseFloat(t.height)||0,n=es(e),r=n?e.offsetWidth:i,a=n?e.offsetHeight:o,l=R(i)!==r||R(o)!==a;return l&&(i=r,o=a),{width:i,height:o,$:l}}function eL(e){return ec(e)?e:e.contextElement}function eD(e){let t=eL(e);if(!es(t))return z(1);let i=t.getBoundingClientRect(),{width:o,height:n,$:r}=eA(t),a=(r?R(i.width):i.width)/o,l=(r?R(i.height):i.height)/n;return a&&Number.isFinite(a)||(a=1),l&&Number.isFinite(l)||(l=1),{x:a,y:l}}let eM=z(0);function eS(e){let t=er(e);return ev()&&t.visualViewport?{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}:eM}function eT(e,t,i,o){var n;void 0===t&&(t=!1),void 0===i&&(i=!1);let r=e.getBoundingClientRect(),a=eL(e),l=z(1);t&&(o?ec(o)&&(l=eD(o)):l=eD(e));let c=(void 0===(n=i)&&(n=!1),o&&n&&o===er(a))?eS(a):z(0),s=(r.left+c.x)/l.x,u=(r.top+c.y)/l.y,f=r.width/l.x,d=r.height/l.y;if(a&&o){let e=er(a),t=ec(o)?er(o):o,i=e,n=ex(i);for(;n&&t!==i;){let e=eD(n),t=n.getBoundingClientRect(),o=e_(n),r=t.left+(n.clientLeft+parseFloat(o.paddingLeft))*e.x,a=t.top+(n.clientTop+parseFloat(o.paddingTop))*e.y;s*=e.x,u*=e.y,f*=e.x,d*=e.y,s+=r,u+=a,n=ex(i=er(n))}}return J({width:f,height:d,x:s,y:u})}function eP(e,t){let i=ey(e).scrollLeft;return t?t.left+i:eT(ea(e)).left+i}function eN(e,t){let i=e.getBoundingClientRect();return{x:i.left+t.scrollLeft-eP(e,i),y:i.top+t.scrollTop}}function ek(e,t,i){var o;let n;if("viewport"===t||"layoutViewport"===t)n=function(e,t,i){void 0===i&&(i="viewport");let o="layoutViewport"===i,n=er(e),r=ea(e),a=n.visualViewport,l=r.clientWidth,c=r.clientHeight,s=0,u=0;if(a){let e=!ev()||"fixed"===t;o?e||(s=-a.offsetLeft,u=-a.offsetTop):(l=a.width,c=a.height,e&&(s=a.offsetLeft,u=a.offsetTop))}if(0>=eP(r)){let e=r.ownerDocument,t=e.body,i=getComputedStyle(t),o="CSS1Compat"===e.compatMode&&parseFloat(i.marginLeft)+parseFloat(i.marginRight)||0,n=Math.abs(r.clientWidth-t.clientWidth-o),a="stable both-edges"===getComputedStyle(r).scrollbarGutter?n/2:n;a<=25&&(l-=a)}return{width:l,height:c,x:s,y:u}}(e,i,t);else if("document"===t){let t,i,r,a,l,c;t=ey(o=ea(e)),i=o.ownerDocument.body,r=F(o.scrollWidth,o.clientWidth,i.scrollWidth,i.clientWidth),a=F(o.scrollHeight,o.clientHeight,i.scrollHeight,i.clientHeight),l=-t.scrollLeft+eP(o),c=-t.scrollTop,"rtl"===e_(i).direction&&(l+=F(o.clientWidth,i.clientWidth)-r),n={width:r,height:a,x:l,y:c}}else if(ec(t)){let e,o,r,a,l,c;o=(e=eT(t,!0,"fixed"===i)).top+t.clientTop,r=e.left+t.clientLeft,a=eD(t),l=t.clientWidth*a.x,c=t.clientHeight*a.y,n={width:l,height:c,x:r*a.x,y:o*a.y}}else{let i=eS(e);n={x:t.x-i.x,y:t.y-i.y,width:t.width,height:t.height}}return J(n)}function eB(e){return"static"===e_(e).position}function eF(e,t){if(!es(e)||"fixed"===e_(e).position)return null;if(t)return t(e);let i=e.offsetParent;return ea(e)===i&&(i=i.ownerDocument.body),i}function eR(e,t){var i;let o=er(e);if(ed(e))return o;if(!es(e)){let t=eb(e);for(;t&&!ew(t);){if(ec(t)&&!eB(t))return t;t=eb(t)}return o}let n=eF(e,t);for(;n&&(i=n,/^(table|td|th)$/.test(en(i)))&&eB(n);)n=eF(n,t);return n&&ew(n)&&eB(n)&&!eg(n)?o:n||function(e){let t=eb(e);for(;es(t)&&!ew(t);){if(eg(t))return t;if(ed(t))break;t=eb(t)}return null}(e)||o}let eE=async function(e){let t=this.getOffsetParent||eR,i=this.getDimensions,o=await i(e.floating);return{reference:function(e,t,i){let o=es(t),n=ea(t),r="fixed"===i,a=eT(e,!0,r,t),l={scrollLeft:0,scrollTop:0},c=z(0);if((o||!r)&&(("body"!==en(t)||ef(n))&&(l=ey(t)),o)){let e=eT(t,!0,r,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}!o&&n&&(c.x=eP(n));let s=!n||o||r?z(0):eN(n,l);return{x:a.left+l.scrollLeft-c.x-s.x,y:a.top+l.scrollTop-c.y-s.y,width:a.width,height:a.height}}(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}},ez={convertOffsetParentRelativeRectToViewportRelativeRect:function(e){let{elements:t,rect:i,offsetParent:o,strategy:n}=e,r="fixed"===n,a=ea(o),l=!!t&&ed(t.floating);if(o===a||l&&r)return i;let c={scrollLeft:0,scrollTop:0},s=z(1),u=z(0),f=es(o);if((f||!r)&&(("body"!==en(o)||ef(a))&&(c=ey(o)),f)){let e=eT(o);s=eD(o),u.x=e.x+o.clientLeft,u.y=e.y+o.clientTop}let d=!a||f||r?z(0):eN(a,c);return{width:i.width*s.x,height:i.height*s.y,x:i.x*s.x-c.scrollLeft*s.x+u.x+d.x,y:i.y*s.y-c.scrollTop*s.y+u.y+d.y}},getDocumentElement:ea,getClippingRect:function(e){let{element:t,boundary:i,rootBoundary:o,strategy:n}=e,r=[..."clippingAncestors"===i?ed(t)?[]:function(e,t){let i=t.get(e);if(i)return i;let o=eC(e,[],!1).filter(e=>ec(e)&&"body"!==en(e)),n=null,r="fixed"===e_(e).position,a=r?eb(e):e;for(;ec(a)&&!ew(a);){let e=e_(a),t=eg(a),i=n?n.position:r?"fixed":"";t||"fixed"!==i&&("absolute"!==i||"static"!==e.position)?n=e:o=o.filter(e=>e!==a),a=eb(a)}return t.set(e,o),o}(t,this._c):[].concat(i),o],a=ek(t,r[0],n),l=a.top,c=a.right,s=a.bottom,u=a.left;for(let e=1;e<r.length;e++){let i=ek(t,r[e],n);l=F(i.top,l),c=B(i.right,c),s=B(i.bottom,s),u=F(i.left,u)}return{width:c-u,height:s-l,x:u,y:l}},getOffsetParent:eR,getElementRects:eE,getClientRects:function(e){return e.getClientRects?Array.from(e.getClientRects()):[]},getDimensions:function(e){let{width:t,height:i}=eA(e);return{width:t,height:i}},getScale:eD,isElement:ec,isRTL:function(e){return"rtl"===e_(e).direction}};function eI(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}let eO=({content:e,placement:t="right",children:i})=>{let o=A(null),n=A(null),[r,a]=(f=1,b(k,!1)),l=A(),s=D(()=>{clearTimeout(l.current),a(!0)},[]),u=D(()=>{clearTimeout(l.current),a(!1)},[]),d=D(e=>{"Escape"===e.key&&u()},[u]);C(()=>{let e=n.current,i=o.current?.firstElementChild;if(r&&e&&i)return function(e,t,i,o){let n;void 0===o&&(o={});let{ancestorScroll:r=!0,ancestorResize:a=!0,elementResize:l="function"==typeof ResizeObserver,layoutShift:c="function"==typeof IntersectionObserver,animationFrame:s=!1}=o,u=eL(e),f=r||a?[...u?eC(u):[],...t?eC(t):[]]:[];f.forEach(e=>{r&&e.addEventListener("scroll",i),a&&e.addEventListener("resize",i)});let d=u&&c?function(e,t,i){let o,n=null,r=ea(e);function a(){var e;clearTimeout(o),null==(e=n)||e.disconnect(),n=null}function l(i,c){void 0===i&&(i=!1),void 0===c&&(c=1),a();let s=e.getBoundingClientRect(),{left:u,top:f,width:d,height:p}=s;if(i||t(),!d||!p)return;let m={rootMargin:-E(f)+"px "+-E(r.clientWidth-(u+d))+"px "+-E(r.clientHeight-(f+p))+"px "+-E(u)+"px",threshold:F(0,B(1,c))||1},h=!0;function g(t){let i=t[0].intersectionRatio;if(!eI(s,e.getBoundingClientRect()))return l();if(i!==c){if(!h)return l();i?l(!1,i):o=setTimeout(()=>{l(!1,1e-7)},1e3)}h=!1}try{n=new IntersectionObserver(g,{...m,root:r.ownerDocument})}catch(e){n=new IntersectionObserver(g,m)}n.observe(e)}let c=er(e),s=()=>l(i);return c.addEventListener("resize",s),l(!0),()=>{c.removeEventListener("resize",s),a()}}(u,i,a):null,p=-1,m=null;l&&(m=new ResizeObserver(e=>{let[o]=e;o&&o.target===u&&m&&t&&(m.unobserve(t),cancelAnimationFrame(p),p=requestAnimationFrame(()=>{var e;null==(e=m)||e.observe(t)})),i()}),u&&!s&&m.observe(u),t&&m.observe(t));let h=s?eT(e):null;return s&&function t(){let o=eT(e);h&&!eI(h,o)&&i(),h=o,n=requestAnimationFrame(t)}(),i(),()=>{var e;f.forEach(e=>{r&&e.removeEventListener("scroll",i),a&&e.removeEventListener("resize",i)}),null==d||d(),null==(e=m)||e.disconnect(),m=null,s&&cancelAnimationFrame(n)}}(i,e,()=>{var o,r,a;let l,c,s;(a={placement:t,strategy:"fixed",middleware:[{name:"offset",options:8,async fn(e){var t,i;let{x:o,y:n,placement:r,middlewareData:a}=e,l=await ei(e,8);return r===(null==(t=a.offset)?void 0:t.placement)&&null!=(i=a.arrow)&&i.alignmentOffset?{}:{x:o+l.x,y:n+l.y,data:{...l,placement:r}}}},(void 0===o&&(o={}),{name:"flip",options:o,async fn(e){var t,i,n,r,a,l,c,s;let u,f,d,{placement:p,middlewareData:m,rects:h,initialPlacement:g,platform:v,elements:w}=e,{mainAxis:_=!0,crossAxis:y=!0,fallbackPlacements:b,fallbackStrategy:C="bestFit",fallbackAxisSideDirection:x="none",flipAlignment:A=!0,...L}=O(o,e);if(null!=(t=m.arrow)&&t.alignmentOffset)return{};let D=q(p),M=$(g),S=q(g)===g,T=await (null==v.isRTL?void 0:v.isRTL(w.floating)),P=b||(S||!A?[K(g)]:(u=K(g),[j(g),u,j(u)])),N="none"!==x;!b&&N&&P.push(...(f=H(g),d=function(e,t,i){switch(e){case"top":case"bottom":if(i)return t?G:U;return t?U:G;case"left":case"right":return t?V:X;default:return[]}}(q(g),"start"===x,T),f&&(d=d.map(e=>e+"-"+f),A&&(d=d.concat(d.map(j)))),d));let k=[g,...P],B=await v.detectOverflow(e,L),F=[],R=(null==(i=m.flip)?void 0:i.overflows)||[];if(_&&F.push(B[D]),y){let e,t,i,o,n=(l=p,c=h,void 0===(s=T)&&(s=!1),e=H(l),i=W(t=Y($(l))),o="x"===t?e===(s?"end":"start")?"right":"left":"start"===e?"bottom":"top",c.reference[i]>c.floating[i]&&(o=K(o)),[o,K(o)]);F.push(B[n[0]],B[n[1]])}if(R=[...R,{placement:p,overflows:F}],!F.every(e=>e<=0)){let e=((null==(n=m.flip)?void 0:n.index)||0)+1,t=k[e];if(t&&("alignment"!==y||M===$(t)||R.every(e=>$(e.placement)!==M||e.overflows[0]>0)))return{data:{index:e,overflows:R},reset:{placement:t}};let i=null==(r=R.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0])?void 0:r.placement;if(!i)switch(C){case"bestFit":{let e=null==(a=R.filter(e=>{if(N){let t=$(e.placement);return t===M||"y"===t}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0])?void 0:a[0];e&&(i=e);break}case"initialPlacement":i=g}if(p!==i)return{reset:{placement:i}}}return{}}}),{name:"shift",options:r={padding:4},async fn(e){let{x:t,y:i,placement:o,platform:n}=e,{mainAxis:a=!0,crossAxis:l=!1,limiter:c={fn:e=>{let{x:t,y:i}=e;return{x:t,y:i}}},...s}=O(r,e),u={x:t,y:i},f=await n.detectOverflow(e,s),d=$(o),p=Y(d),m=u[p],h=u[d],g=(e,t)=>F(t+f["y"===e?"top":"left"],B(t,t-f["y"===e?"bottom":"right"]));a&&(m=g(p,m)),l&&(h=g(d,h));let v=c.fn({...e,[p]:m,[d]:h});return{...v,data:{x:v.x-t,y:v.y-i,enabled:{[p]:a,[d]:l}}}}}]},l=new Map,c=null!=a?a:{},s={...ez,...c.platform,_c:l},ee(i,e,{...c,platform:s})).then(({x:t,y:i})=>{n.current===e&&Object.assign(e.style,{left:`${t}px`,top:`${i}px`,opacity:"1"})})})},[r,t]),C(()=>()=>clearTimeout(l.current),[]);let p=D(t=>{t&&e instanceof HTMLElement&&t.replaceChildren(e.cloneNode(!0))},[e]);return null==e||!1===e||""===e?(0,c.Y)(c.FK,{children:i}):(0,c.FD)("div",{ref:o,className:"deck-widget-tooltip-trigger",onPointerEnter:s,onPointerLeave:u,onFocusCapture:s,onBlurCapture:u,onKeyDown:d,children:[i,r&&(0,c.Y)("div",{ref:n,className:"deck-widget-tooltip",role:"tooltip",style:{position:"fixed",opacity:0,fontSize:"12px",padding:"4px 8px"},children:e instanceof HTMLElement?(0,c.Y)("div",{ref:p}):e})]})},eq=e=>{let{className:t="",style:i,color:o,icon:n,label:r,tooltip:a,onClick:l,children:s}=e,u=!1===a?void 0:a??r,f=L(()=>{let e=function(e){if(!e)return;let t=`url("${e.replace(/"/g,"'")}")`;return{maskImage:t,WebkitMaskImage:t}}(n);return o?{...e,backgroundColor:o}:e},[o,n]),d=(0,c.Y)("button",{className:`deck-widget-icon-button ${t}`,type:"button",onClick:l,"aria-label":r,children:s||(0,c.Y)("div",{className:"deck-widget-icon",style:f})});return(0,c.Y)("div",{className:"deck-widget-button",style:i,children:u?(0,c.Y)(eO,{content:u,children:d}):d})},eH={passive:!1},eY=(e,t,i)=>e<t?t:e>i?i:e,eW=(e,t)=>{if(!e||!e.firstElementChild)return[0,0];let i=e.firstElementChild.getBoundingClientRect();return t||t?[i.top,i.height]:[i.left,i.width]},e$=(e,t)=>"number"==typeof e&&!Number.isNaN(e)&&e>0?e:Math.max(1,t/10||1),ej=(e,t)=>"number"==typeof e&&!Number.isNaN(e)&&e>0?e:Math.max(1,t||1);function eU(e){let{className:t="",min:i,max:o,step:n,value:r,orientation:a,pageSize:l,stepButtons:s=!1,startButtonAriaLabel:u,endButtonAriaLabel:d,eventTarget:p,decorations:m=[],onChange:h}=e,g="horizontal"!==a,v=A(null),w=A(null),_=A(null),y=A(null),[M,S]=(f=1,b(k,0)),T=o-i,P=Math.max(0,r[1]-r[0]),N=Math.max(0,T-P),B=eY(r[0],i,i+N),{thumbLength:F,thumbOffset:R}=L(()=>{if(M<=0||T<=0)return{thumbLength:0,thumbOffset:0};if(T<=P)return{thumbLength:1,thumbOffset:0};let e=P/T,t=Math.max(0,1-e);return{thumbLength:Math.max(0,Math.min(e,1)),thumbOffset:t*(N<=0?0:eY((B-i)/N,0,1))}},[M,T,P,N,B,i]),E=D(e=>{if(!h)return;let t=eY(e,i,i+N);h([t,t+P])},[h,i,N,P]),z=D(e=>{e.stopPropagation(),E(B-e$(n,T))},[E,B,n,T]),I=D(e=>{e.stopPropagation(),E(B+e$(n,T))},[E,B,n,T]),O=D(e=>{if(0!==e.button)return;let t=e.target;if(t?.dataset.scrollbarThumb==="true")return;let o=w.current;if(!o)return;e.preventDefault(),e.stopPropagation();let[n]=eW(o,g),r=g?e.clientY-n:e.clientX-n,a=Math.max(1,1-F)*M,l=F/2*M;E(i+(a<=0?0:eY((r-l)/a,0,1))*N)},[g,M,F,E,i,N]),q=D(e=>{let t=y.current;if(!t||t.pointerId!==e.pointerId)return;let[i,o]=eW(w.current,g),n=(g?e.clientY:e.clientX)-t.startCoord;E(eY((t.startRatio+n/o)*(t.max-t.min),0,t.maxStart)+t.min),e.preventDefault()},[E,g]),H=D(e=>{let t=y.current;t&&t.pointerId===e.pointerId&&(y.current=null,_.current?.releasePointerCapture(e.pointerId),e.preventDefault())},[]),Y=D(e=>{switch(e.key){case"ArrowUp":case"ArrowLeft":(g&&"ArrowUp"===e.key||!g&&"ArrowLeft"===e.key)&&(E(B-e$(n,T)),e.preventDefault());break;case"ArrowDown":case"ArrowRight":(g&&"ArrowDown"===e.key||!g&&"ArrowRight"===e.key)&&(E(B+e$(n,T)),e.preventDefault());break;case"PageUp":E(B-ej(l,P)),e.preventDefault();break;case"PageDown":E(B+ej(l,P)),e.preventDefault();break;case"Home":E(i),e.preventDefault();break;case"End":E(i+N),e.preventDefault()}},[g,E,B,n,T,l,P,i,N]),W=D(e=>{if(e.preventDefault(),e.stopPropagation(),0===N)return;let t=g?e.deltaY:e.deltaX;g||0!==t||(t=e.deltaY),e.deltaMode===WheelEvent.DOM_DELTA_LINE?t*=e$(n,T):e.deltaMode===WheelEvent.DOM_DELTA_PAGE&&(t*=ej(l,P)),0!==t&&E(B+t)},[E,B,N,g,n,T,l,P]);x(()=>{S(eW(w.current,g)[1])},[g]),x(()=>{let e=w.current;if(!e)return;let t=()=>{S(eW(e,g)[1])};if(t(),"u">typeof ResizeObserver){let i=new ResizeObserver(t);return i.observe(e),()=>i.disconnect()}if("u">typeof window)return window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[g]),C(()=>{let e=p??v.current;if(e)return e.addEventListener("keydown",Y),e.addEventListener("wheel",W,eH),()=>{e.removeEventListener("keydown",Y),e.removeEventListener("wheel",W,eH)}},[p,Y,W]);let $=L(()=>!m.length||T<=0?[]:m.map((e,t)=>{let[o,n]=e.position,r=(o-i)/T,a=Math.round(1e3*r)/10,l=Math.max(0,Math.round(((n-i)/T-r)*1e3)/10),s=g?{left:"0",width:"100%",top:`${a}%`,height:`${l}%`}:{top:"0",height:"100%",left:`${a}%`,width:`${l}%`};return(0,c.Y)("div",{className:"deck-widget-range__decoration",style:s,children:e.element},`decoration-${t}`)}),[m,T,i,g]);return(0,c.FD)("div",{ref:v,tabIndex:0,role:"scrollbar","aria-valuemin":i,"aria-valuemax":i+N,"aria-valuenow":B,"aria-orientation":a,className:`${t} deck-widget-range deck-widget-range--${a} ${0===N?"deck-widget-range--disabled":""}`,children:[s&&(0,c.Y)("button",{type:"button",className:"deck-widget-range__button deck-widget-range__button--start","aria-label":u,disabled:B<=i,onClick:z,children:(0,c.Y)("span",{className:"deck-widget-icon"})}),(0,c.FD)("div",{className:"deck-widget-range__track",ref:w,onClick:O,children:[(0,c.Y)("div",{className:"deck-widget-range__decorations",children:$}),(0,c.Y)("div",{className:"deck-widget-range__thumb","data-scrollbar-thumb":"true",ref:_,style:g?{height:`${100*F}%`,top:`${100*R}%`}:{width:`${100*F}%`,left:`${100*R}%`},onPointerDown:e=>{0!==e.button||w.current&&(y.current={pointerId:e.pointerId,startCoord:g?e.clientY:e.clientX,startRatio:R,min:i,max:o,maxStart:N},e.currentTarget.setPointerCapture(e.pointerId),e.preventDefault(),e.stopPropagation())},onPointerMove:q,onPointerUp:H,onPointerCancel:H})]}),s&&(0,c.Y)("button",{type:"button",className:"deck-widget-range__button deck-widget-range__button--end","aria-label":d,disabled:B>=i+N,onClick:I,children:(0,c.Y)("span",{className:"deck-widget-icon"})})]})}class eG extends s.x{getTime(){return this.props.time??this.currentTime}getPlaying(){return this.props.playing??this._playing}constructor(e={}){super(e),this.id="timeline",this.className="deck-widget-timeline",this.placement="fill",this._playing=!1,this.timerId=null,this.handlePlayPause=()=>{let e=!this.getPlaying();this.props.onPlayingChange?.(e),void 0===this.props.playing&&(e?this.play():this.stop())},this.handleTimeChange=([e])=>{this.props.onTimeChange(e),void 0===this.props.time&&(this.currentTime=e,this.props.timeline?.setTime(e),this.updateHTML())},this.tick=()=>{let{timeRange:[e,t],step:i,loop:o}=this.props;if(i>0){let n=this.getTime(),r=Math.round(n/i)*i+i;r>t&&(n<t?r=t:o?r=e:(r=t,this._playing=!1,this.props.onPlayingChange?.(!1))),this.props.onTimeChange(r),void 0===this.props.time&&(this.currentTime=r,this.props.timeline?.setTime(r)),this.updateHTML()}this._playing?this.timerId=window.setTimeout(this.tick,this.props.playInterval):this.timerId=null},this.currentTime=this.props.initialTime??this.props.timeRange[0];let t=this.props.time??this.currentTime;this.props.timeline?.setTime(t),this.setProps(this.props)}setProps(e){let{playing:t,time:i}=this.props;this.viewId=e.viewId??this.viewId,super.setProps(e),void 0!==e.time&&e.time!==i&&this.props.timeline?.setTime(e.time),void 0!==e.playing&&e.playing!==t&&(e.playing&&!this._playing?this._startTimer():!e.playing&&this._playing&&this._stopTimer())}onAdd(){this._playing=!1,this.timerId=null,this.props.autoPlay&&(void 0!==this.props.playing?this.props.onPlayingChange?.(!0):this.play())}onRemove(){this.stop()}onRenderHTML(e){let{timeRange:t,step:i,formatLabel:o,playTooltip:n,pauseTooltip:r}=this.props,a=this.getPlaying(),l=this.getTime();e.dataset.placement=this.props.placement,(0,u.XX)((0,c.FD)("div",{className:"deck-widget-button-group",children:[a?(0,c.Y)(eq,{label:"Pause",tooltip:r,className:"deck-widget-timeline-pause",onClick:this.handlePlayPause}):(0,c.Y)(eq,{label:"Play",tooltip:n,className:"deck-widget-timeline-play",onClick:this.handlePlayPause}),(0,c.Y)(eU,{min:t[0],max:t[1],orientation:"horizontal",step:i,value:[l,l],onChange:this.handleTimeChange,decorations:[{position:[l,l+i],element:(0,c.Y)("div",{className:"deck-widget-timeline-label deck-widget-timeline-label--current",children:o(l)})}]})]}),e)}play(){this._playing=!0;let{timeRange:[e,t]}=this.props;void 0===this.props.time&&this.getTime()>=t&&(this.currentTime=e,this.props.onTimeChange(e),this.props.timeline?.setTime(e)),this.updateHTML(),this.tick()}stop(){this._stopTimer(),this.updateHTML()}_startTimer(){this._playing=!0,this.tick()}_stopTimer(){this._playing=!1,null!==this.timerId&&(window.clearTimeout(this.timerId),this.timerId=null)}}eG.defaultProps={...s.x.defaultProps,id:"timeline",placement:"bottom-left",viewId:null,timeline:null,timeRange:[0,100],step:1,initialTime:void 0,time:void 0,onTimeChange:()=>{},autoPlay:!1,loop:!1,playInterval:1e3,playing:void 0,onPlayingChange:()=>{},formatLabel:String,playTooltip:void 0,pauseTooltip:void 0}},15979(e,t,i){i.d(t,{X:()=>c});var o=i(66925);let n=`\
layout(std140) uniform waterMaterialUniforms {
  uniform float time;
  uniform vec3 baseColor;
  uniform float opacity;
  uniform vec3 fresnelColor;
  uniform float fresnelPower;
  uniform float specularIntensity;
  uniform float normalStrength;
  uniform int mappingMode;
  uniform vec2 coordinateScale;
  uniform vec2 coordinateOffset;
  uniform vec2 waveADirection;
  uniform float waveASpeed;
  uniform float waveAFrequency;
  uniform float waveAAmplitude;
  uniform vec2 waveBDirection;
  uniform float waveBSpeed;
  uniform float waveBFrequency;
  uniform float waveBAmplitude;
} waterMaterial;
`,r=`\
layout(std140) uniform waterMaterialUniforms {
  uniform float time;
  uniform vec3 baseColor;
  uniform float opacity;
  uniform vec3 fresnelColor;
  uniform float fresnelPower;
  uniform float specularIntensity;
  uniform float normalStrength;
  uniform int mappingMode;
  uniform vec2 coordinateScale;
  uniform vec2 coordinateOffset;
  uniform vec2 waveADirection;
  uniform float waveASpeed;
  uniform float waveAFrequency;
  uniform float waveAAmplitude;
  uniform vec2 waveBDirection;
  uniform float waveBSpeed;
  uniform float waveBFrequency;
  uniform float waveBAmplitude;
} waterMaterial;

vec2 water_getDirection(vec2 direction) {
  float directionLength = length(direction);
  return directionLength > 0.0 ? direction / directionLength : vec2(1.0, 0.0);
}

vec2 water_getCoordinates(vec3 position_worldspace, vec3 position_objectspace, vec2 uv) {
  vec2 baseCoordinates = uv;
  if (waterMaterial.mappingMode == 1) {
    baseCoordinates = position_worldspace.xz;
  } else if (waterMaterial.mappingMode == 2) {
    vec3 globeDirection = normalize(position_objectspace);
    float longitude = atan(globeDirection.x, globeDirection.z);
    float latitude = asin(clamp(globeDirection.y, -1.0, 1.0));
    baseCoordinates = vec2(longitude, latitude);
  }
  return baseCoordinates * waterMaterial.coordinateScale + waterMaterial.coordinateOffset;
}

vec2 water_getWaveGradient(
  vec2 coordinates,
  vec2 direction,
  float speed,
  float frequency,
  float amplitude
) {
  vec2 normalizedDirection = water_getDirection(direction);
  float phase = dot(coordinates * frequency, normalizedDirection) + waterMaterial.time * speed;
  return cos(phase) * normalizedDirection * frequency * amplitude;
}

vec3 water_getTangent(vec3 normal_worldspace) {
  vec3 referenceAxis = abs(normal_worldspace.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
  return normalize(cross(referenceAxis, normal_worldspace));
}

vec3 water_getNormal(
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec2 coordinates = water_getCoordinates(position_worldspace, position_objectspace, uv);
  vec2 gradient =
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveADirection,
      waterMaterial.waveASpeed,
      waterMaterial.waveAFrequency,
      waterMaterial.waveAAmplitude
    ) +
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveBDirection,
      waterMaterial.waveBSpeed,
      waterMaterial.waveBFrequency,
      waterMaterial.waveBAmplitude
    );

  vec3 tangent = water_getTangent(normal_worldspace);
  vec3 bitangent = normalize(cross(normal_worldspace, tangent));
  vec3 perturbation =
    waterMaterial.normalStrength * (gradient.x * tangent + gradient.y * bitangent);

  return normalize(normal_worldspace + perturbation);
}

vec3 water_getSpecularContribution(
  vec3 light_direction,
  vec3 view_direction,
  vec3 normal_worldspace,
  vec3 light_color,
  float fresnel
) {
  vec3 halfway_direction = normalize(light_direction + view_direction);
  float specular =
    pow(max(dot(normal_worldspace, halfway_direction), 0.0), 72.0) *
    waterMaterial.specularIntensity *
    (0.25 + 0.75 * fresnel);

  return waterMaterial.fresnelColor * light_color * specular;
}

vec4 water_getColorMapped(
  vec3 cameraPosition,
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec3 waterNormal = water_getNormal(
    position_worldspace,
    position_objectspace,
    normalize(normal_worldspace),
    uv
  );
  vec3 viewDirection = normalize(cameraPosition - position_worldspace);
  float fresnel =
    pow(
      1.0 - max(dot(viewDirection, waterNormal), 0.0),
      max(waterMaterial.fresnelPower, 0.0001)
    );
  vec3 surfaceColor = mix(
    waterMaterial.baseColor,
    waterMaterial.fresnelColor,
    clamp(fresnel * 0.6, 0.0, 1.0)
  );

  if (lighting.enabled == 0) {
    return vec4(surfaceColor, waterMaterial.opacity);
  }

  vec3 lightColor = surfaceColor * (0.15 + 0.85 * lighting.ambientColor);

  for (int i = 0; i < lighting.pointLightCount; i++) {
    PointLight pointLight = lighting_getPointLight(i);
    vec3 lightPosition = pointLight.position;
    vec3 lightDirection = normalize(lightPosition - position_worldspace);
    float attenuation =
      getPointLightAttenuation(pointLight, distance(lightPosition, position_worldspace));
    vec3 incidentLight = pointLight.color / attenuation;
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (int i = 0; i < lighting.spotLightCount; i++) {
    SpotLight spotLight = lighting_getSpotLight(i);
    vec3 lightPosition = spotLight.position;
    vec3 lightDirection = normalize(lightPosition - position_worldspace);
    float attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    vec3 incidentLight = spotLight.color / attenuation;
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    vec3 lightDirection = normalize(-directionalLight.direction);
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * directionalLight.color * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      directionalLight.color,
      fresnel
    );
  }

  lightColor = mix(lightColor, waterMaterial.fresnelColor, clamp(fresnel, 0.0, 1.0) * 0.35);
  return vec4(lightColor, waterMaterial.opacity);
}

vec4 water_getColor(
  vec3 cameraPosition,
  vec3 position_worldspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  return water_getColorMapped(
    cameraPosition,
    position_worldspace,
    position_worldspace,
    normal_worldspace,
    uv
  );
}
`,a=`\
struct waterMaterialUniforms {
  time: f32,
  baseColor: vec3<f32>,
  opacity: f32,
  fresnelColor: vec3<f32>,
  fresnelPower: f32,
  specularIntensity: f32,
  normalStrength: f32,
  mappingMode: i32,
  coordinateScale: vec2<f32>,
  coordinateOffset: vec2<f32>,
  waveADirection: vec2<f32>,
  waveASpeed: f32,
  waveAFrequency: f32,
  waveAAmplitude: f32,
  waveBDirection: vec2<f32>,
  waveBSpeed: f32,
  waveBFrequency: f32,
  waveBAmplitude: f32,
};

@group(3) @binding(auto) var<uniform> waterMaterial : waterMaterialUniforms;

fn water_getDirection(direction: vec2<f32>) -> vec2<f32> {
  let directionLength = length(direction);
  if (directionLength > 0.0) {
    return direction / directionLength;
  }

  return vec2<f32>(1.0, 0.0);
}

fn water_getCoordinates(
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  uv: vec2<f32>
) -> vec2<f32> {
  var baseCoordinates = uv;
  if (waterMaterial.mappingMode == 1) {
    baseCoordinates = position_worldspace.xz;
  } else if (waterMaterial.mappingMode == 2) {
    let globeDirection = normalize(position_objectspace);
    let longitude = atan2(globeDirection.x, globeDirection.z);
    let latitude = asin(clamp(globeDirection.y, -1.0, 1.0));
    baseCoordinates = vec2<f32>(longitude, latitude);
  }

  return baseCoordinates * waterMaterial.coordinateScale + waterMaterial.coordinateOffset;
}

fn water_getWaveGradient(
  coordinates: vec2<f32>,
  direction: vec2<f32>,
  speed: f32,
  frequency: f32,
  amplitude: f32
) -> vec2<f32> {
  let normalizedDirection = water_getDirection(direction);
  let phase = dot(coordinates * frequency, normalizedDirection) + waterMaterial.time * speed;
  return cos(phase) * normalizedDirection * frequency * amplitude;
}

fn water_getTangent(normal_worldspace: vec3<f32>) -> vec3<f32> {
  var referenceAxis = vec3<f32>(0.0, 0.0, 1.0);
  if (abs(normal_worldspace.z) >= 0.999) {
    referenceAxis = vec3<f32>(0.0, 1.0, 0.0);
  }

  return normalize(cross(referenceAxis, normal_worldspace));
}

fn water_getNormal(
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec3<f32> {
  let coordinates = water_getCoordinates(position_worldspace, position_objectspace, uv);
  let gradient =
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveADirection,
      waterMaterial.waveASpeed,
      waterMaterial.waveAFrequency,
      waterMaterial.waveAAmplitude
    ) +
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveBDirection,
      waterMaterial.waveBSpeed,
      waterMaterial.waveBFrequency,
      waterMaterial.waveBAmplitude
    );
  let tangent = water_getTangent(normal_worldspace);
  let bitangent = normalize(cross(normal_worldspace, tangent));
  let perturbation =
    waterMaterial.normalStrength * (gradient.x * tangent + gradient.y * bitangent);

  return normalize(normal_worldspace + perturbation);
}

fn water_getSpecularContribution(
  light_direction: vec3<f32>,
  view_direction: vec3<f32>,
  normal_worldspace: vec3<f32>,
  light_color: vec3<f32>,
  fresnel: f32
) -> vec3<f32> {
  let halfwayDirection = normalize(light_direction + view_direction);
  let specular =
    pow(max(dot(normal_worldspace, halfwayDirection), 0.0), 72.0) *
    waterMaterial.specularIntensity *
    (0.25 + 0.75 * fresnel);

  return waterMaterial.fresnelColor * light_color * specular;
}

fn water_getColorMapped(
  cameraPosition: vec3<f32>,
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec4<f32> {
  let waterNormal = water_getNormal(
    position_worldspace,
    position_objectspace,
    normalize(normal_worldspace),
    uv
  );
  let viewDirection = normalize(cameraPosition - position_worldspace);
  let fresnel =
    pow(
      1.0 - max(dot(viewDirection, waterNormal), 0.0),
      max(waterMaterial.fresnelPower, 0.0001)
    );
  let surfaceColor = mix(
    waterMaterial.baseColor,
    waterMaterial.fresnelColor,
    clamp(fresnel * 0.6, 0.0, 1.0)
  );

  if (lighting.enabled == 0) {
    return vec4<f32>(surfaceColor, waterMaterial.opacity);
  }

  var lightColor = surfaceColor * (0.15 + 0.85 * lighting.ambientColor);

  for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
    let pointLight = lighting_getPointLight(i);
    let lightPosition = pointLight.position;
    let lightDirection = normalize(lightPosition - position_worldspace);
    let attenuation = getPointLightAttenuation(
      pointLight,
      distance(lightPosition, position_worldspace)
    );
    let incidentLight = pointLight.color / attenuation;
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
    let spotLight = lighting_getSpotLight(i);
    let lightPosition = spotLight.position;
    let lightDirection = normalize(lightPosition - position_worldspace);
    let attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    let incidentLight = spotLight.color / attenuation;
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight = lighting_getDirectionalLight(i);
    let lightDirection = normalize(-directionalLight.direction);
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * directionalLight.color * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      directionalLight.color,
      fresnel
    );
  }

  lightColor = mix(
    lightColor,
    waterMaterial.fresnelColor,
    clamp(fresnel, 0.0, 1.0) * 0.35
  );
  return vec4<f32>(lightColor, waterMaterial.opacity);
}

fn water_getColor(
  cameraPosition: vec3<f32>,
  position_worldspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec4<f32> {
  return water_getColorMapped(
    cameraPosition,
    position_worldspace,
    position_worldspace,
    normal_worldspace,
    uv
  );
}
`,l={time:0,baseColor:[.04,.18,.31],opacity:.82,fresnelColor:[.86,.95,1],fresnelPower:5,specularIntensity:1.4,normalStrength:.35,mappingMode:0,coordinateScale:[1,1],coordinateOffset:[0,0],waveADirection:[.9805806756909201,.19611613513818402],waveASpeed:.6,waveAFrequency:4,waveAAmplitude:.08,waveBDirection:[.09950371902099893,.9950371902099893],waveBSpeed:-.45,waveBFrequency:7,waveBAmplitude:.04},c={name:"waterMaterial",firstBindingSlot:0,bindingLayout:[{name:"waterMaterial",group:3}],dependencies:[o.x],source:a,vs:n,fs:r,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{time:"f32",baseColor:"vec3<f32>",opacity:"f32",fresnelColor:"vec3<f32>",fresnelPower:"f32",specularIntensity:"f32",normalStrength:"f32",mappingMode:"i32",coordinateScale:"vec2<f32>",coordinateOffset:"vec2<f32>",waveADirection:"vec2<f32>",waveASpeed:"f32",waveAFrequency:"f32",waveAAmplitude:"f32",waveBDirection:"vec2<f32>",waveBSpeed:"f32",waveBFrequency:"f32",waveBAmplitude:"f32"},defaultUniforms:l,getUniforms(e,t=l){var i;let{mapping:o,...n}=e||{},r={time:(i=t).time??l.time,baseColor:i.baseColor?s(i.baseColor):l.baseColor,opacity:i.opacity??l.opacity,fresnelColor:i.fresnelColor?s(i.fresnelColor):l.fresnelColor,fresnelPower:i.fresnelPower??l.fresnelPower,specularIntensity:i.specularIntensity??l.specularIntensity,normalStrength:i.normalStrength??l.normalStrength,mappingMode:i.mappingMode??l.mappingMode,coordinateScale:i.coordinateScale?[Number(i.coordinateScale[0]),Number(i.coordinateScale[1])]:l.coordinateScale,coordinateOffset:i.coordinateOffset?[Number(i.coordinateOffset[0]),Number(i.coordinateOffset[1])]:l.coordinateOffset,waveADirection:i.waveADirection?u(i.waveADirection):l.waveADirection,waveASpeed:i.waveASpeed??l.waveASpeed,waveAFrequency:i.waveAFrequency??l.waveAFrequency,waveAAmplitude:i.waveAAmplitude??l.waveAAmplitude,waveBDirection:i.waveBDirection?u(i.waveBDirection):l.waveBDirection,waveBSpeed:i.waveBSpeed??l.waveBSpeed,waveBFrequency:i.waveBFrequency??l.waveBFrequency,waveBAmplitude:i.waveBAmplitude??l.waveBAmplitude};return void 0!==n.time&&(r.time=n.time),void 0!==n.opacity&&(r.opacity=n.opacity),void 0!==n.fresnelPower&&(r.fresnelPower=n.fresnelPower),void 0!==n.specularIntensity&&(r.specularIntensity=n.specularIntensity),void 0!==n.normalStrength&&(r.normalStrength=n.normalStrength),void 0!==n.coordinateScale&&(r.coordinateScale=[Number(n.coordinateScale[0]),Number(n.coordinateScale[1])]),void 0!==n.coordinateOffset&&(r.coordinateOffset=[Number(n.coordinateOffset[0]),Number(n.coordinateOffset[1])]),void 0!==n.waveASpeed&&(r.waveASpeed=n.waveASpeed),void 0!==n.waveAFrequency&&(r.waveAFrequency=n.waveAFrequency),void 0!==n.waveAAmplitude&&(r.waveAAmplitude=n.waveAAmplitude),void 0!==n.waveBSpeed&&(r.waveBSpeed=n.waveBSpeed),void 0!==n.waveBFrequency&&(r.waveBFrequency=n.waveBFrequency),void 0!==n.waveBAmplitude&&(r.waveBAmplitude=n.waveBAmplitude),n.baseColor&&(r.baseColor=s(n.baseColor)),n.fresnelColor&&(r.fresnelColor=s(n.fresnelColor)),n.waveADirection&&(r.waveADirection=u(n.waveADirection)),n.waveBDirection&&(r.waveBDirection=u(n.waveBDirection)),void 0!==o&&(r.mappingMode="world"===o?1:2*("object"===o)),r}};function s(e){let t=[Number(e[0]),Number(e[1]),Number(e[2])];return Math.max(...t.map(e=>Math.abs(e)))>1&&(t[0]/=255,t[1]/=255,t[2]/=255),t}function u(e){let t=Number(e[0]),i=Number(e[1]),o=Math.hypot(t,i);return 0===o?[1,0]:[t/o,i/o]}}}]);
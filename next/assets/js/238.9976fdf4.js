"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["238"],{43078(e,t,i){i.d(t,{J0:()=>w,Kr:()=>C,NT:()=>D,Nf:()=>b,WO:()=>_,hb:()=>A,li:()=>x,vJ:()=>y});var r,o,n,a,l=i(60616),c=0,s=[],u=l.fF,f=u.__b,d=u.__r,p=u.diffed,m=u.__c,h=u.unmount,g=u.__;function v(e,t){u.__h&&u.__h(o,e,c||t),c=0;var i=o.__H||(o.__H={__:[],__h:[]});return e>=i.__.length&&i.__.push({}),i.__[e]}function w(e){return c=1,_(B,e)}function _(e,t,i){var n=v(r++,2);if(n.t=e,!n.__c&&(n.__=[i?i(t):B(void 0,t),function(e){var t=n.__N?n.__N[0]:n.__[0],i=n.t(t,e);t!==i&&(n.__N=[i,n.__[1]],n.__c.setState({}))}],n.__c=o,!o.__f)){var a=function(e,t,i){if(!n.__c.__H)return!0;var r=!1,o=n.__c.props!==e;if(n.__c.__H.__.some(function(e){if(e.__N){r=!0;var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),l){var a=l.call(this,e,t,i);return r?a||o:a}return!r||o};o.__f=!0;var l=o.shouldComponentUpdate,c=o.componentWillUpdate;o.componentWillUpdate=function(e,t,i){if(this.__e){var r=l;l=void 0,a(e,t,i),l=r}c&&c.call(this,e,t,i)},o.shouldComponentUpdate=a}return n.__N||n.__}function y(e,t){var i=v(r++,3);!u.__s&&T(i.__H,t)&&(i.__=e,i.u=t,o.__H.__h.push(i))}function b(e,t){var i=v(r++,4);!u.__s&&T(i.__H,t)&&(i.__=e,i.u=t,o.__h.push(i))}function x(e){return c=5,C(function(){return{current:e}},[])}function C(e,t){var i=v(r++,7);return T(i.__H,t)&&(i.__=e(),i.__H=t,i.__h=e),i.__}function A(e,t){return c=8,C(function(){return e},t)}function D(e){var t=o.context[e.__c],i=v(r++,9);return i.c=e,t?(null==i.__&&(i.__=!0,t.sub(o)),t.props.value):e.__}function S(){for(var e;e=s.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(P),t.__h.some(M),t.__h=[]}catch(i){t.__h=[],u.__e(i,e.__v)}}}u.__b=function(e){o=null,f&&f(e)},u.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),g&&g(e,t)},u.__r=function(e){d&&d(e),r=0;var t=(o=e.__c).__H;t&&(n===o?(t.__h=[],o.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(P),t.__h.some(M),t.__h=[],r=0)),n=o},u.diffed=function(e){p&&p(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(1!==s.push(t)&&a===u.requestAnimationFrame||((a=u.requestAnimationFrame)||function(e){var t,i=function(){clearTimeout(r),L&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(i,35);L&&(t=requestAnimationFrame(i))})(S)),t.__H.__.some(function(e){e.u&&(e.__H=e.u,e.u=void 0)})),n=o=null},u.__c=function(e,t){t.some(function(e){try{e.__h.some(P),e.__h=e.__h.filter(function(e){return!e.__||M(e)})}catch(i){t.some(function(e){e.__h&&(e.__h=[])}),t=[],u.__e(i,e.__v)}}),m&&m(e,t)},u.unmount=function(e){h&&h(e);var t,i=e.__c;i&&i.__H&&(i.__H.__.some(function(e){try{P(e)}catch(e){t=e}}),i.__H=void 0,t&&u.__e(t,i.__v))};var L="function"==typeof requestAnimationFrame;function P(e){var t=o,i=e.__c;"function"==typeof i&&(e.__c=void 0,i()),o=t}function M(e){var t=o;e.__c=e.__(),o=t}function T(e,t){return!e||e.length!==t.length||t.some(function(t,i){return t!==e[i]})}function B(e,t){return"function"==typeof t?t(e):t}},81413(e,t,i){i.d(t,{FD:()=>n,FK:()=>r.FK,Y:()=>n});var r=i(60616),o=0;function n(e,t,i,n,a,l){t||(t={});var c,s,u=t;if("ref"in u)for(s in u={},t)"ref"==s?c=t[s]:u[s]=t[s];var f={type:e,props:u,key:i,ref:c,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--o,__i:-1,__u:0,__source:a,__self:l};if("function"==typeof e&&(c=e.defaultProps))for(s in c)void 0===u[s]&&(u[s]=c[s]);return r.fF.vnode&&r.fF.vnode(f),f}},50677(e,t,i){e.exports=i.p+"f327bd7c333fcccd.js?url"},43847(e,t,i){let r;i.d(t,{e:()=>ex});var o=i(81413),n=i(1354),a=i(60616),l=i(43078);let c=Math.min,s=Math.max,u=Math.round,f=Math.floor,d=e=>({x:e,y:e}),p={left:"right",right:"left",bottom:"top",top:"bottom"};function m(e,t){return"function"==typeof e?e(t):e}function h(e){return e.split("-")[0]}function g(e){return e.split("-")[1]}function v(e){return"x"===e?"y":"x"}function w(e){return"y"===e?"height":"width"}function _(e){let t=e[0];return"t"===t||"b"===t?"y":"x"}function y(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}let b=["left","right"],x=["right","left"],C=["top","bottom"],A=["bottom","top"];function D(e){let t=h(e);return p[t]+e.slice(t.length)}function S(e){let{x:t,y:i,width:r,height:o}=e;return{width:r,height:o,top:i,left:t,right:t+r,bottom:i+o,x:t,y:i}}function L(e,t,i){let r,{reference:o,floating:n}=e,a=_(t),l=v(_(t)),c=w(l),s=h(t),u=o.x+o.width/2-n.width/2,f=o.y+o.height/2-n.height/2,d=o[c]/2-n[c]/2;switch(s){case"top":r={x:u,y:o.y-n.height};break;case"bottom":r={x:u,y:o.y+o.height};break;case"right":r={x:o.x+o.width,y:f};break;case"left":r={x:o.x-n.width,y:f};break;default:r={x:o.x,y:o.y}}let p=g(t);return p&&(r[l]+=d*("end"===p?1:-1)*(i&&"y"===a?-1:1)),r}async function P(e,t){var i,r,o,n,a;void 0===t&&(t={});let{x:l,y:c,platform:s,rects:u,elements:f,strategy:d}=e,{boundary:p="clippingAncestors",rootBoundary:h="viewport",elementContext:g="floating",altBoundary:v=!1,padding:w=0}=m(t,e),_="number"!=typeof w?{top:null!=(r=w.top)?r:0,right:null!=(o=w.right)?o:0,bottom:null!=(n=w.bottom)?n:0,left:null!=(a=w.left)?a:0}:{top:w,right:w,bottom:w,left:w},y=f[v?"floating"===g?"reference":"floating":g],b=S(await s.getClippingRect({element:null==(i=await (null==s.isElement?void 0:s.isElement(y)))||i?y:y.contextElement||await (null==s.getDocumentElement?void 0:s.getDocumentElement(f.floating)),boundary:p,rootBoundary:h,strategy:d})),x="floating"===g?{x:l,y:c,width:u.floating.width,height:u.floating.height}:u.reference,C=await (null==s.getOffsetParent?void 0:s.getOffsetParent(f.floating)),A=await (null==s.isElement?void 0:s.isElement(C))&&await (null==s.getScale?void 0:s.getScale(C))||{x:1,y:1},D=S(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:f,rect:x,offsetParent:C,strategy:d}):x);return{top:(b.top-D.top+_.top)/A.y,bottom:(D.bottom-b.bottom+_.bottom)/A.y,left:(b.left-D.left+_.left)/A.x,right:(D.right-b.right+_.right)/A.x}}let M=async(e,t,i)=>{let{placement:r="bottom",strategy:o="absolute",middleware:n=[],platform:a}=i,l=a.detectOverflow?a:{...a,detectOverflow:P},c=await (null==a.isRTL?void 0:a.isRTL(t)),s=await a.getElementRects({reference:e,floating:t,strategy:o}),{x:u,y:f}=L(s,r,c),d=r,p=0,m={};for(let i=0;i<n.length;i++){let h=n[i];if(!h)continue;let{name:g,fn:v}=h,{x:w,y:_,data:y,reset:b}=await v({x:u,y:f,initialPlacement:r,placement:d,strategy:o,middlewareData:m,rects:s,platform:l,elements:{reference:e,floating:t}});u=null!=w?w:u,f=null!=_?_:f,m[g]={...m[g],...y},b&&p<50&&(p++,"object"==typeof b&&(b.placement&&(d=b.placement),b.rects&&(s=!0===b.rects?await a.getElementRects({reference:e,floating:t,strategy:o}):b.rects),{x:u,y:f}=L(s,d,c)),i=-1)}return{x:u,y:f,placement:d,strategy:o,middlewareData:m}},T=new Set(["left","top"]);async function B(e,t){let{placement:i,platform:r,elements:o}=e,n=await (null==r.isRTL?void 0:r.isRTL(o.floating)),a=h(i),l=g(i),c="y"===_(i),s=T.has(a)?-1:1,u=n&&c?-1:1,f=m(t,e),{mainAxis:d,crossAxis:p,alignmentAxis:v}="number"==typeof f?{mainAxis:f,crossAxis:0,alignmentAxis:null}:{mainAxis:f.mainAxis||0,crossAxis:f.crossAxis||0,alignmentAxis:f.alignmentAxis};return l&&"number"==typeof v&&(p="end"===l?-1*v:v),c?{x:p*u,y:d*s}:{x:d*s,y:p*u}}function N(){return"u">typeof window}function k(e){return z(e)?(e.nodeName||"").toLowerCase():"#document"}function F(e){var t;return(null==e||null==(t=e.ownerDocument)?void 0:t.defaultView)||window}function R(e){var t;return null==(t=(z(e)?e.ownerDocument:e.document)||window.document)?void 0:t.documentElement}function z(e){return!!N()&&(e instanceof Node||e instanceof F(e).Node)}function E(e){return!!N()&&(e instanceof Element||e instanceof F(e).Element)}function I(e){return!!N()&&(e instanceof HTMLElement||e instanceof F(e).HTMLElement)}function q(e){return!(!N()||"u"<typeof ShadowRoot)&&(e instanceof ShadowRoot||e instanceof F(e).ShadowRoot)}function O(e){let{overflow:t,overflowX:i,overflowY:r,display:o}=V(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+i)&&"inline"!==o&&"contents"!==o}function W(e){try{if(e.matches(":popover-open"))return!0}catch(e){}try{return e.matches(":modal")}catch(e){return!1}}let H=/transform|translate|scale|rotate|perspective|filter/,U=/paint|layout|strict|content/,G=e=>!!e&&"none"!==e;function Y(e){let t=E(e)?V(e):e;return G(t.transform)||G(t.translate)||G(t.scale)||G(t.rotate)||G(t.perspective)||!j()&&(G(t.backdropFilter)||G(t.filter))||H.test(t.willChange||"")||U.test(t.contain||"")}function j(){return null==r&&(r="u">typeof CSS&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),r}function $(e){return/^(html|body|#document)$/.test(k(e))}function V(e){return F(e).getComputedStyle(e)}function X(e){return E(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function K(e){if("html"===k(e))return e;let t=e.assignedSlot||e.parentNode||q(e)&&e.host||R(e);return q(t)?t.host:t}function J(e,t,i){var r;void 0===t&&(t=[]),void 0===i&&(i=!0);let o=function e(t){let i=K(t);return $(i)?(t.ownerDocument||t).body:I(i)&&O(i)?i:e(i)}(e),n=o===(null==(r=e.ownerDocument)?void 0:r.body),a=F(o);if(!n)return t.concat(o,J(o,[],i));{let e=Z(a);return t.concat(a,a.visualViewport||[],O(o)?o:[],e&&i?J(e):[])}}function Z(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Q(e){let t=V(e),i=parseFloat(t.width)||0,r=parseFloat(t.height)||0,o=I(e),n=o?e.offsetWidth:i,a=o?e.offsetHeight:r,l=u(i)!==n||u(r)!==a;return l&&(i=n,r=a),{width:i,height:r,$:l}}function ee(e){return E(e)?e:e.contextElement}function et(e){let t=ee(e);if(!I(t))return d(1);let i=t.getBoundingClientRect(),{width:r,height:o,$:n}=Q(t),a=(n?u(i.width):i.width)/r,l=(n?u(i.height):i.height)/o;return a&&Number.isFinite(a)||(a=1),l&&Number.isFinite(l)||(l=1),{x:a,y:l}}let ei=d(0);function er(e){let t=F(e);return j()&&t.visualViewport?{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}:ei}function eo(e,t,i,r){var o;void 0===t&&(t=!1),void 0===i&&(i=!1);let n=e.getBoundingClientRect(),a=ee(e),l=d(1);t&&(r?E(r)&&(l=et(r)):l=et(e));let c=(void 0===(o=i)&&(o=!1),r&&o&&r===F(a))?er(a):d(0),s=(n.left+c.x)/l.x,u=(n.top+c.y)/l.y,f=n.width/l.x,p=n.height/l.y;if(a&&r){let e=F(a),t=E(r)?F(r):r,i=e,o=Z(i);for(;o&&t!==i;){let e=et(o),t=o.getBoundingClientRect(),r=V(o),n=t.left+(o.clientLeft+parseFloat(r.paddingLeft))*e.x,a=t.top+(o.clientTop+parseFloat(r.paddingTop))*e.y;s*=e.x,u*=e.y,f*=e.x,p*=e.y,s+=n,u+=a,o=Z(i=F(o))}}return S({width:f,height:p,x:s,y:u})}function en(e,t){let i=X(e).scrollLeft;return t?t.left+i:eo(R(e)).left+i}function ea(e,t){let i=e.getBoundingClientRect();return{x:i.left+t.scrollLeft-en(e,i),y:i.top+t.scrollTop}}function el(e,t,i){var r;let o;if("viewport"===t||"layoutViewport"===t)o=function(e,t,i){void 0===i&&(i="viewport");let r="layoutViewport"===i,o=F(e),n=R(e),a=o.visualViewport,l=n.clientWidth,c=n.clientHeight,s=0,u=0;if(a){let e=!j()||"fixed"===t;r?e||(s=-a.offsetLeft,u=-a.offsetTop):(l=a.width,c=a.height,e&&(s=a.offsetLeft,u=a.offsetTop))}if(0>=en(n)){let e=n.ownerDocument,t=e.body,i=getComputedStyle(t),r="CSS1Compat"===e.compatMode&&parseFloat(i.marginLeft)+parseFloat(i.marginRight)||0,o=Math.abs(n.clientWidth-t.clientWidth-r),a="stable both-edges"===getComputedStyle(n).scrollbarGutter?o/2:o;a<=25&&(l-=a)}return{width:l,height:c,x:s,y:u}}(e,i,t);else if("document"===t){let t,i,n,a,l,c;t=X(r=R(e)),i=r.ownerDocument.body,n=s(r.scrollWidth,r.clientWidth,i.scrollWidth,i.clientWidth),a=s(r.scrollHeight,r.clientHeight,i.scrollHeight,i.clientHeight),l=-t.scrollLeft+en(r),c=-t.scrollTop,"rtl"===V(i).direction&&(l+=s(r.clientWidth,i.clientWidth)-n),o={width:n,height:a,x:l,y:c}}else if(E(t)){let e,r,n,a,l,c;r=(e=eo(t,!0,"fixed"===i)).top+t.clientTop,n=e.left+t.clientLeft,a=et(t),l=t.clientWidth*a.x,c=t.clientHeight*a.y,o={width:l,height:c,x:n*a.x,y:r*a.y}}else{let i=er(e);o={x:t.x-i.x,y:t.y-i.y,width:t.width,height:t.height}}return S(o)}function ec(e){return"static"===V(e).position}function es(e,t){if(!I(e)||"fixed"===V(e).position)return null;if(t)return t(e);let i=e.offsetParent;return R(e)===i&&(i=i.ownerDocument.body),i}function eu(e,t){var i;let r=F(e);if(W(e))return r;if(!I(e)){let t=K(e);for(;t&&!$(t);){if(E(t)&&!ec(t))return t;t=K(t)}return r}let o=es(e,t);for(;o&&(i=o,/^(table|td|th)$/.test(k(i)))&&ec(o);)o=es(o,t);return o&&$(o)&&ec(o)&&!Y(o)?r:o||function(e){let t=K(e);for(;I(t)&&!$(t);){if(Y(t))return t;if(W(t))break;t=K(t)}return null}(e)||r}let ef=async function(e){let t=this.getOffsetParent||eu,i=this.getDimensions,r=await i(e.floating);return{reference:function(e,t,i){let r=I(t),o=R(t),n="fixed"===i,a=eo(e,!0,n,t),l={scrollLeft:0,scrollTop:0},c=d(0);if((r||!n)&&(("body"!==k(t)||O(o))&&(l=X(t)),r)){let e=eo(t,!0,n,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}!r&&o&&(c.x=en(o));let s=!o||r||n?d(0):ea(o,l);return{x:a.left+l.scrollLeft-c.x-s.x,y:a.top+l.scrollTop-c.y-s.y,width:a.width,height:a.height}}(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}},ed={convertOffsetParentRelativeRectToViewportRelativeRect:function(e){let{elements:t,rect:i,offsetParent:r,strategy:o}=e,n="fixed"===o,a=R(r),l=!!t&&W(t.floating);if(r===a||l&&n)return i;let c={scrollLeft:0,scrollTop:0},s=d(1),u=d(0),f=I(r);if((f||!n)&&(("body"!==k(r)||O(a))&&(c=X(r)),f)){let e=eo(r);s=et(r),u.x=e.x+r.clientLeft,u.y=e.y+r.clientTop}let p=!a||f||n?d(0):ea(a,c);return{width:i.width*s.x,height:i.height*s.y,x:i.x*s.x-c.scrollLeft*s.x+u.x+p.x,y:i.y*s.y-c.scrollTop*s.y+u.y+p.y}},getDocumentElement:R,getClippingRect:function(e){let{element:t,boundary:i,rootBoundary:r,strategy:o}=e,n=[..."clippingAncestors"===i?W(t)?[]:function(e,t){let i=t.get(e);if(i)return i;let r=J(e,[],!1).filter(e=>E(e)&&"body"!==k(e)),o=null,n="fixed"===V(e).position,a=n?K(e):e;for(;E(a)&&!$(a);){let e=V(a),t=Y(a),i=o?o.position:n?"fixed":"";t||"fixed"!==i&&("absolute"!==i||"static"!==e.position)?o=e:r=r.filter(e=>e!==a),a=K(a)}return t.set(e,r),r}(t,this._c):[].concat(i),r],a=el(t,n[0],o),l=a.top,u=a.right,f=a.bottom,d=a.left;for(let e=1;e<n.length;e++){let i=el(t,n[e],o);l=s(i.top,l),u=c(i.right,u),f=c(i.bottom,f),d=s(i.left,d)}return{width:u-d,height:f-l,x:d,y:l}},getOffsetParent:eu,getElementRects:ef,getClientRects:function(e){return e.getClientRects?Array.from(e.getClientRects()):[]},getDimensions:function(e){let{width:t,height:i}=Q(e);return{width:t,height:i}},getScale:et,isElement:E,isRTL:function(e){return"rtl"===V(e).direction}};function ep(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}let em=({content:e,placement:t="right",children:i})=>{let r=(0,l.li)(null),n=(0,l.li)(null),[a,u]=(0,l.J0)(!1),d=(0,l.li)(),p=(0,l.hb)(()=>{clearTimeout(d.current),u(!0)},[]),S=(0,l.hb)(()=>{clearTimeout(d.current),u(!1)},[]),L=(0,l.hb)(e=>{"Escape"===e.key&&S()},[S]);(0,l.vJ)(()=>{let e=n.current,i=r.current?.firstElementChild;if(a&&e&&i)return function(e,t,i,r){let o;void 0===r&&(r={});let{ancestorScroll:n=!0,ancestorResize:a=!0,elementResize:l="function"==typeof ResizeObserver,layoutShift:u="function"==typeof IntersectionObserver,animationFrame:d=!1}=r,p=ee(e),m=n||a?[...p?J(p):[],...t?J(t):[]]:[];m.forEach(e=>{n&&e.addEventListener("scroll",i),a&&e.addEventListener("resize",i)});let h=p&&u?function(e,t,i){let r,o=null,n=R(e);function a(){var e;clearTimeout(r),null==(e=o)||e.disconnect(),o=null}function l(i,u){void 0===i&&(i=!1),void 0===u&&(u=1),a();let d=e.getBoundingClientRect(),{left:p,top:m,width:h,height:g}=d;if(i||t(),!h||!g)return;let v={rootMargin:-f(m)+"px "+-f(n.clientWidth-(p+h))+"px "+-f(n.clientHeight-(m+g))+"px "+-f(p)+"px",threshold:s(0,c(1,u))||1},w=!0;function _(t){let i=t[0].intersectionRatio;if(!ep(d,e.getBoundingClientRect()))return l();if(i!==u){if(!w)return l();i?l(!1,i):r=setTimeout(()=>{l(!1,1e-7)},1e3)}w=!1}try{o=new IntersectionObserver(_,{...v,root:n.ownerDocument})}catch(e){o=new IntersectionObserver(_,v)}o.observe(e)}let u=F(e),d=()=>l(i);return u.addEventListener("resize",d),l(!0),()=>{u.removeEventListener("resize",d),a()}}(p,i,a):null,g=-1,v=null;l&&(v=new ResizeObserver(e=>{let[r]=e;r&&r.target===p&&v&&t&&(v.unobserve(t),cancelAnimationFrame(g),g=requestAnimationFrame(()=>{var e;null==(e=v)||e.observe(t)})),i()}),p&&!d&&v.observe(p),t&&v.observe(t));let w=d?eo(e):null;return d&&function t(){let r=eo(e);w&&!ep(w,r)&&i(),w=r,o=requestAnimationFrame(t)}(),i(),()=>{var e;m.forEach(e=>{n&&e.removeEventListener("scroll",i),a&&e.removeEventListener("resize",i)}),null==h||h(),null==(e=v)||e.disconnect(),v=null,d&&cancelAnimationFrame(o)}}(i,e,()=>{var r,o,a;let l,u,f;(a={placement:t,strategy:"fixed",middleware:[{name:"offset",options:8,async fn(e){var t,i;let{x:r,y:o,placement:n,middlewareData:a}=e,l=await B(e,8);return n===(null==(t=a.offset)?void 0:t.placement)&&null!=(i=a.arrow)&&i.alignmentOffset?{}:{x:r+l.x,y:o+l.y,data:{...l,placement:n}}}},(void 0===r&&(r={}),{name:"flip",options:r,async fn(e){var t,i,o,n,a,l,c,s;let u,f,d,{placement:p,middlewareData:S,rects:L,initialPlacement:P,platform:M,elements:T}=e,{mainAxis:B=!0,crossAxis:N=!0,fallbackPlacements:k,fallbackStrategy:F="bestFit",fallbackAxisSideDirection:R="none",flipAlignment:z=!0,...E}=m(r,e);if(null!=(t=S.arrow)&&t.alignmentOffset)return{};let I=h(p),q=_(P),O=h(P)===P,W=await (null==M.isRTL?void 0:M.isRTL(T.floating)),H=k||(O||!z?[D(P)]:(u=D(P),[y(P),u,y(u)])),U="none"!==R;!k&&U&&H.push(...(f=g(P),d=function(e,t,i){switch(e){case"top":case"bottom":if(i)return t?x:b;return t?b:x;case"left":case"right":return t?C:A;default:return[]}}(h(P),"start"===R,W),f&&(d=d.map(e=>e+"-"+f),z&&(d=d.concat(d.map(y)))),d));let G=[P,...H],Y=await M.detectOverflow(e,E),j=[],$=(null==(i=S.flip)?void 0:i.overflows)||[];if(B&&j.push(Y[I]),N){let e,t,i,r,o=(l=p,c=L,void 0===(s=W)&&(s=!1),e=g(l),i=w(t=v(_(l))),r="x"===t?e===(s?"end":"start")?"right":"left":"start"===e?"bottom":"top",c.reference[i]>c.floating[i]&&(r=D(r)),[r,D(r)]);j.push(Y[o[0]],Y[o[1]])}if($=[...$,{placement:p,overflows:j}],!j.every(e=>e<=0)){let e=((null==(o=S.flip)?void 0:o.index)||0)+1,t=G[e];if(t&&("alignment"!==N||q===_(t)||$.every(e=>_(e.placement)!==q||e.overflows[0]>0)))return{data:{index:e,overflows:$},reset:{placement:t}};let i=null==(n=$.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0])?void 0:n.placement;if(!i)switch(F){case"bestFit":{let e=null==(a=$.filter(e=>{if(U){let t=_(e.placement);return t===q||"y"===t}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0])?void 0:a[0];e&&(i=e);break}case"initialPlacement":i=P}if(p!==i)return{reset:{placement:i}}}return{}}}),{name:"shift",options:o={padding:4},async fn(e){let{x:t,y:i,placement:r,platform:n}=e,{mainAxis:a=!0,crossAxis:l=!1,limiter:u={fn:e=>{let{x:t,y:i}=e;return{x:t,y:i}}},...f}=m(o,e),d={x:t,y:i},p=await n.detectOverflow(e,f),h=_(r),g=v(h),w=d[g],y=d[h],b=(e,t)=>s(t+p["y"===e?"top":"left"],c(t,t-p["y"===e?"bottom":"right"]));a&&(w=b(g,w)),l&&(y=b(h,y));let x=u.fn({...e,[g]:w,[h]:y});return{...x,data:{x:x.x-t,y:x.y-i,enabled:{[g]:a,[h]:l}}}}}]},l=new Map,u=null!=a?a:{},f={...ed,...u.platform,_c:l},M(i,e,{...u,platform:f})).then(({x:t,y:i})=>{n.current===e&&Object.assign(e.style,{left:`${t}px`,top:`${i}px`,opacity:"1"})})})},[a,t]),(0,l.vJ)(()=>()=>clearTimeout(d.current),[]);let P=(0,l.hb)(t=>{t&&e instanceof HTMLElement&&t.replaceChildren(e.cloneNode(!0))},[e]);return null==e||!1===e||""===e?(0,o.Y)(o.FK,{children:i}):(0,o.FD)("div",{ref:r,className:"deck-widget-tooltip-trigger",onPointerEnter:p,onPointerLeave:S,onFocusCapture:p,onBlurCapture:S,onKeyDown:L,children:[i,a&&(0,o.Y)("div",{ref:n,className:"deck-widget-tooltip",role:"tooltip",style:{position:"fixed",opacity:0,fontSize:"12px",padding:"4px 8px"},children:e instanceof HTMLElement?(0,o.Y)("div",{ref:P}):e})]})},eh=e=>{let{className:t="",style:i,color:r,icon:n,label:a,tooltip:c,onClick:s,children:u}=e,f=!1===c?void 0:c??a,d=(0,l.Kr)(()=>{let e=function(e){if(!e)return;let t=`url("${e.replace(/"/g,"'")}")`;return{maskImage:t,WebkitMaskImage:t}}(n);return r?{...e,backgroundColor:r}:e},[r,n]),p=(0,o.Y)("button",{className:`deck-widget-icon-button ${t}`,type:"button",onClick:s,"aria-label":a,children:u||(0,o.Y)("div",{className:"deck-widget-icon",style:d})});return(0,o.Y)("div",{className:"deck-widget-button",style:i,children:f?(0,o.Y)(em,{content:f,children:p}):p})},eg={passive:!1},ev=(e,t,i)=>e<t?t:e>i?i:e,ew=(e,t)=>{if(!e||!e.firstElementChild)return[0,0];let i=e.firstElementChild.getBoundingClientRect();return t||t?[i.top,i.height]:[i.left,i.width]},e_=(e,t)=>"number"==typeof e&&!Number.isNaN(e)&&e>0?e:Math.max(1,t/10||1),ey=(e,t)=>"number"==typeof e&&!Number.isNaN(e)&&e>0?e:Math.max(1,t||1);function eb(e){let{className:t="",min:i,max:r,step:n,value:a,orientation:c,pageSize:s,stepButtons:u=!1,startButtonAriaLabel:f,endButtonAriaLabel:d,eventTarget:p,decorations:m=[],onChange:h}=e,g="horizontal"!==c,v=(0,l.li)(null),w=(0,l.li)(null),_=(0,l.li)(null),y=(0,l.li)(null),[b,x]=(0,l.J0)(0),C=r-i,A=Math.max(0,a[1]-a[0]),D=Math.max(0,C-A),S=ev(a[0],i,i+D),{thumbLength:L,thumbOffset:P}=(0,l.Kr)(()=>{if(b<=0||C<=0)return{thumbLength:0,thumbOffset:0};if(C<=A)return{thumbLength:1,thumbOffset:0};let e=A/C,t=Math.max(0,1-e);return{thumbLength:Math.max(0,Math.min(e,1)),thumbOffset:t*(D<=0?0:ev((S-i)/D,0,1))}},[b,C,A,D,S,i]),M=(0,l.hb)(e=>{if(!h)return;let t=ev(e,i,i+D);h([t,t+A])},[h,i,D,A]),T=(0,l.hb)(e=>{e.stopPropagation(),M(S-e_(n,C))},[M,S,n,C]),B=(0,l.hb)(e=>{e.stopPropagation(),M(S+e_(n,C))},[M,S,n,C]),N=(0,l.hb)(e=>{if(0!==e.button)return;let t=e.target;if(t?.dataset.scrollbarThumb==="true")return;let r=w.current;if(!r)return;e.preventDefault(),e.stopPropagation();let[o]=ew(r,g),n=g?e.clientY-o:e.clientX-o,a=Math.max(1,1-L)*b,l=L/2*b;M(i+(a<=0?0:ev((n-l)/a,0,1))*D)},[g,b,L,M,i,D]),k=(0,l.hb)(e=>{let t=y.current;if(!t||t.pointerId!==e.pointerId)return;let[i,r]=ew(w.current,g),o=(g?e.clientY:e.clientX)-t.startCoord;M(ev((t.startRatio+o/r)*(t.max-t.min),0,t.maxStart)+t.min),e.preventDefault()},[M,g]),F=(0,l.hb)(e=>{let t=y.current;t&&t.pointerId===e.pointerId&&(y.current=null,_.current?.releasePointerCapture(e.pointerId),e.preventDefault())},[]),R=(0,l.hb)(e=>{switch(e.key){case"ArrowUp":case"ArrowLeft":(g&&"ArrowUp"===e.key||!g&&"ArrowLeft"===e.key)&&(M(S-e_(n,C)),e.preventDefault());break;case"ArrowDown":case"ArrowRight":(g&&"ArrowDown"===e.key||!g&&"ArrowRight"===e.key)&&(M(S+e_(n,C)),e.preventDefault());break;case"PageUp":M(S-ey(s,A)),e.preventDefault();break;case"PageDown":M(S+ey(s,A)),e.preventDefault();break;case"Home":M(i),e.preventDefault();break;case"End":M(i+D),e.preventDefault()}},[g,M,S,n,C,s,A,i,D]),z=(0,l.hb)(e=>{if(e.preventDefault(),e.stopPropagation(),0===D)return;let t=g?e.deltaY:e.deltaX;g||0!==t||(t=e.deltaY),e.deltaMode===WheelEvent.DOM_DELTA_LINE?t*=e_(n,C):e.deltaMode===WheelEvent.DOM_DELTA_PAGE&&(t*=ey(s,A)),0!==t&&M(S+t)},[M,S,D,g,n,C,s,A]);(0,l.Nf)(()=>{x(ew(w.current,g)[1])},[g]),(0,l.Nf)(()=>{let e=w.current;if(!e)return;let t=()=>{x(ew(e,g)[1])};if(t(),"u">typeof ResizeObserver){let i=new ResizeObserver(t);return i.observe(e),()=>i.disconnect()}if("u">typeof window)return window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[g]),(0,l.vJ)(()=>{let e=p??v.current;if(e)return e.addEventListener("keydown",R),e.addEventListener("wheel",z,eg),()=>{e.removeEventListener("keydown",R),e.removeEventListener("wheel",z,eg)}},[p,R,z]);let E=(0,l.Kr)(()=>!m.length||C<=0?[]:m.map((e,t)=>{let[r,n]=e.position,a=(r-i)/C,l=Math.round(1e3*a)/10,c=Math.max(0,Math.round(((n-i)/C-a)*1e3)/10),s=g?{left:"0",width:"100%",top:`${l}%`,height:`${c}%`}:{top:"0",height:"100%",left:`${l}%`,width:`${c}%`};return(0,o.Y)("div",{className:"deck-widget-range__decoration",style:s,children:e.element},`decoration-${t}`)}),[m,C,i,g]);return(0,o.FD)("div",{ref:v,tabIndex:0,role:"scrollbar","aria-valuemin":i,"aria-valuemax":i+D,"aria-valuenow":S,"aria-orientation":c,className:`${t} deck-widget-range deck-widget-range--${c} ${0===D?"deck-widget-range--disabled":""}`,children:[u&&(0,o.Y)("button",{type:"button",className:"deck-widget-range__button deck-widget-range__button--start","aria-label":f,disabled:S<=i,onClick:T,children:(0,o.Y)("span",{className:"deck-widget-icon"})}),(0,o.FD)("div",{className:"deck-widget-range__track",ref:w,onClick:N,children:[(0,o.Y)("div",{className:"deck-widget-range__decorations",children:E}),(0,o.Y)("div",{className:"deck-widget-range__thumb","data-scrollbar-thumb":"true",ref:_,style:g?{height:`${100*L}%`,top:`${100*P}%`}:{width:`${100*L}%`,left:`${100*P}%`},onPointerDown:e=>{0!==e.button||w.current&&(y.current={pointerId:e.pointerId,startCoord:g?e.clientY:e.clientX,startRatio:P,min:i,max:r,maxStart:D},e.currentTarget.setPointerCapture(e.pointerId),e.preventDefault(),e.stopPropagation())},onPointerMove:k,onPointerUp:F,onPointerCancel:F})]}),u&&(0,o.Y)("button",{type:"button",className:"deck-widget-range__button deck-widget-range__button--end","aria-label":d,disabled:S>=i+D,onClick:B,children:(0,o.Y)("span",{className:"deck-widget-icon"})})]})}class ex extends n.x{getTime(){return this.props.time??this.currentTime}getPlaying(){return this.props.playing??this._playing}constructor(e={}){super(e),this.id="timeline",this.className="deck-widget-timeline",this.placement="fill",this._playing=!1,this.timerId=null,this.handlePlayPause=()=>{let e=!this.getPlaying();this.props.onPlayingChange?.(e),void 0===this.props.playing&&(e?this.play():this.stop())},this.handleTimeChange=([e])=>{this.props.onTimeChange(e),void 0===this.props.time&&(this.currentTime=e,this.props.timeline?.setTime(e),this.updateHTML())},this.tick=()=>{let{timeRange:[e,t],step:i,loop:r}=this.props;if(i>0){let o=this.getTime(),n=Math.round(o/i)*i+i;n>t&&(o<t?n=t:r?n=e:(n=t,this._playing=!1,this.props.onPlayingChange?.(!1))),this.props.onTimeChange(n),void 0===this.props.time&&(this.currentTime=n,this.props.timeline?.setTime(n)),this.updateHTML()}this._playing?this.timerId=window.setTimeout(this.tick,this.props.playInterval):this.timerId=null},this.currentTime=this.props.initialTime??this.props.timeRange[0];let t=this.props.time??this.currentTime;this.props.timeline?.setTime(t),this.setProps(this.props)}setProps(e){let{playing:t,time:i}=this.props;this.viewId=e.viewId??this.viewId,super.setProps(e),void 0!==e.time&&e.time!==i&&this.props.timeline?.setTime(e.time),void 0!==e.playing&&e.playing!==t&&(e.playing&&!this._playing?this._startTimer():!e.playing&&this._playing&&this._stopTimer())}onAdd(){this._playing=!1,this.timerId=null,this.props.autoPlay&&(void 0!==this.props.playing?this.props.onPlayingChange?.(!0):this.play())}onRemove(){this.stop()}onRenderHTML(e){let{timeRange:t,step:i,formatLabel:r,playTooltip:n,pauseTooltip:l}=this.props,c=this.getPlaying(),s=this.getTime();e.dataset.placement=this.props.placement,(0,a.XX)((0,o.FD)("div",{className:"deck-widget-button-group",children:[c?(0,o.Y)(eh,{label:"Pause",tooltip:l,className:"deck-widget-timeline-pause",onClick:this.handlePlayPause}):(0,o.Y)(eh,{label:"Play",tooltip:n,className:"deck-widget-timeline-play",onClick:this.handlePlayPause}),(0,o.Y)(eb,{min:t[0],max:t[1],orientation:"horizontal",step:i,value:[s,s],onChange:this.handleTimeChange,decorations:[{position:[s,s+i],element:(0,o.Y)("div",{className:"deck-widget-timeline-label deck-widget-timeline-label--current",children:r(s)})}]})]}),e)}play(){this._playing=!0;let{timeRange:[e,t]}=this.props;void 0===this.props.time&&this.getTime()>=t&&(this.currentTime=e,this.props.onTimeChange(e),this.props.timeline?.setTime(e)),this.updateHTML(),this.tick()}stop(){this._stopTimer(),this.updateHTML()}_startTimer(){this._playing=!0,this.tick()}_stopTimer(){this._playing=!1,null!==this.timerId&&(window.clearTimeout(this.timerId),this.timerId=null)}}ex.defaultProps={...n.x.defaultProps,id:"timeline",placement:"bottom-left",viewId:null,timeline:null,timeRange:[0,100],step:1,initialTime:void 0,time:void 0,onTimeChange:()=>{},autoPlay:!1,loop:!1,playInterval:1e3,playing:void 0,onPlayingChange:()=>{},formatLabel:String,playTooltip:void 0,pauseTooltip:void 0}},34208(e,t,i){i.d(t,{Ij:()=>u});var r=i(9391),o=i(64344);let n="core-features-and-limits",a=["maxTextureDimension1D","maxTextureDimension2D","maxTextureDimension3D","maxTextureArrayLayers","maxBindGroups","maxBindGroupsPlusVertexBuffers","maxBindingsPerBindGroup","maxDynamicUniformBuffersPerPipelineLayout","maxDynamicStorageBuffersPerPipelineLayout","maxSampledTexturesPerShaderStage","maxSamplersPerShaderStage","maxStorageBuffersPerShaderStage","maxStorageBuffersInVertexStage","maxStorageBuffersInFragmentStage","maxStorageTexturesPerShaderStage","maxStorageTexturesInVertexStage","maxStorageTexturesInFragmentStage","maxUniformBuffersPerShaderStage","maxUniformBufferBindingSize","maxStorageBufferBindingSize","minUniformBufferOffsetAlignment","minStorageBufferOffsetAlignment","maxVertexBuffers","maxBufferSize","maxVertexAttributes","maxVertexBufferArrayStride","maxInterStageShaderVariables","maxColorAttachments","maxColorAttachmentBytesPerSample","maxComputeWorkgroupStorageSize","maxComputeInvocationsPerWorkgroup","maxComputeWorkgroupSizeX","maxComputeWorkgroupSizeY","maxComputeWorkgroupSizeZ","maxComputeWorkgroupsPerDimension","maxImmediateSize"];function l(e){return e.featureLevel??"core"}function c(e,t){return("compatibility"===e||"best-available"===e)&&t.has(n)?"core":"best-available"===e?"compatibility":e}class s extends r.Y{type="webgpu";isSupported(){return!!("u">typeof navigator&&navigator.gpu)}isDeviceHandle(e){return!!("u">typeof GPUDevice&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,t){let r,s,u,p;if("u"<typeof navigator||!navigator.gpu)throw Error("WebGPU is not available");let m=l(e),h=(p={featureLevel:"compatibility"===(u=l(e))||"best-available"===u?"compatibility":"core"},e.powerPreference&&"default"!==e.powerPreference&&(p.powerPreference=e.powerPreference),e.xrCompatible&&(p.xrCompatible=!0),p);try{r=await this.requestGPUAdapter(h)}catch(e){throw Error("WebGPU adapter request failed",{cause:e})}if(!r)throw Error("Failed to request WebGPU adapter");let g=await f(r),v={},w=function(e,t,i=[]){if("max"===t)return Array.from(e);let r=[];for(let o of("best-available"===t&&e.has(n)&&r.push(n),i))e.has(o)&&!r.includes(o)&&r.push(o);return r}(r.features,m,e.optionalFeatures);w.length>0&&(v.requiredFeatures=w);let _={..."max"===m?function(e){let t={};for(let i of a){let r=e[i];"number"==typeof r&&(t[i]=r)}return t}(r.limits):{},...e.requiredLimits};Object.keys(_).length>0&&(v.requiredLimits=_);try{s=await r.requestDevice(v)}catch(e){throw Error("WebGPU device request failed",{cause:e})}let y=await d(s);if(y){if(s.destroy(),t&&"destroyed"!==y.reason)return o.R.warn("WebGPU device was returned already lost; retrying with a fresh adapter")(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${y.message?`: ${y.message}`:""}`,{cause:y})}o.R.groupCollapsed(1,"WebGPUDevice created")();try{let t;try{let{WebGPUDevice:o}=await i.e("8653").then(i.bind(i,96028)),n=c(m,s.features),a={...e,featureLevel:n};t=new o(a,s,r,g);let l=o.getCanvasContextProps(a);l&&t.initializeCanvasContext(l)}catch(e){if(t)throw t.destroy(),Error("WebGPU canvas initialization failed",{cause:e});throw s.destroy(),Error("WebGPU wrapper initialization failed",{cause:e})}return o.R.probe(1,"Device created. For more info, set chrome://flags/#enable-webgpu-developer-features")(),o.R.table(1,t.info)(),t}finally{o.R.groupEnd(1)()}}async attach(e,t={}){var r,o;let{WebGPUDevice:n}=await i.e("8653").then(i.bind(i,96028));if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error("Invalid GPUDevice");let a=n.getDeviceFromHandle(e);if(a)return a;let l=await d(e);if(l)throw Error("WebGPU device is already lost",{cause:l});let s=n.getDeviceFromHandle(e);if(s)return s;let u=e.adapterInfo||{},f=(r=t.featureLevel,o=e.features,"core"===r?"core":c("compatibility",o)),p={...t,featureLevel:f,_handle:e},m=new n(p,e,null,u,!1),h=n.getCanvasContextProps(p);if(h)try{m.initializeCanvasContext(h)}catch(e){throw m.destroy(),Error("WebGPU canvas initialization failed",{cause:e})}return m}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}}let u=new s;async function f(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return o.R.warn("WebGPU adapter metadata is unavailable",e)(),{}}}async function d(e){return await Promise.race([e.lost,Promise.resolve(null)])}},23534(e,t,i){i.d(t,{X:()=>c});var r=i(20723);let o=`\
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
`,n=`\
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
`,l={time:0,baseColor:[.04,.18,.31],opacity:.82,fresnelColor:[.86,.95,1],fresnelPower:5,specularIntensity:1.4,normalStrength:.35,mappingMode:0,coordinateScale:[1,1],coordinateOffset:[0,0],waveADirection:[.9805806756909201,.19611613513818402],waveASpeed:.6,waveAFrequency:4,waveAAmplitude:.08,waveBDirection:[.09950371902099893,.9950371902099893],waveBSpeed:-.45,waveBFrequency:7,waveBAmplitude:.04},c={name:"waterMaterial",firstBindingSlot:0,bindingLayout:[{name:"waterMaterial",group:3}],dependencies:[r.x],source:a,vs:o,fs:n,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{time:"f32",baseColor:"vec3<f32>",opacity:"f32",fresnelColor:"vec3<f32>",fresnelPower:"f32",specularIntensity:"f32",normalStrength:"f32",mappingMode:"i32",coordinateScale:"vec2<f32>",coordinateOffset:"vec2<f32>",waveADirection:"vec2<f32>",waveASpeed:"f32",waveAFrequency:"f32",waveAAmplitude:"f32",waveBDirection:"vec2<f32>",waveBSpeed:"f32",waveBFrequency:"f32",waveBAmplitude:"f32"},defaultUniforms:l,getUniforms(e,t=l){var i;let{mapping:r,...o}=e||{},n={time:(i=t).time??l.time,baseColor:i.baseColor?s(i.baseColor):l.baseColor,opacity:i.opacity??l.opacity,fresnelColor:i.fresnelColor?s(i.fresnelColor):l.fresnelColor,fresnelPower:i.fresnelPower??l.fresnelPower,specularIntensity:i.specularIntensity??l.specularIntensity,normalStrength:i.normalStrength??l.normalStrength,mappingMode:i.mappingMode??l.mappingMode,coordinateScale:i.coordinateScale?[Number(i.coordinateScale[0]),Number(i.coordinateScale[1])]:l.coordinateScale,coordinateOffset:i.coordinateOffset?[Number(i.coordinateOffset[0]),Number(i.coordinateOffset[1])]:l.coordinateOffset,waveADirection:i.waveADirection?u(i.waveADirection):l.waveADirection,waveASpeed:i.waveASpeed??l.waveASpeed,waveAFrequency:i.waveAFrequency??l.waveAFrequency,waveAAmplitude:i.waveAAmplitude??l.waveAAmplitude,waveBDirection:i.waveBDirection?u(i.waveBDirection):l.waveBDirection,waveBSpeed:i.waveBSpeed??l.waveBSpeed,waveBFrequency:i.waveBFrequency??l.waveBFrequency,waveBAmplitude:i.waveBAmplitude??l.waveBAmplitude};return void 0!==o.time&&(n.time=o.time),void 0!==o.opacity&&(n.opacity=o.opacity),void 0!==o.fresnelPower&&(n.fresnelPower=o.fresnelPower),void 0!==o.specularIntensity&&(n.specularIntensity=o.specularIntensity),void 0!==o.normalStrength&&(n.normalStrength=o.normalStrength),void 0!==o.coordinateScale&&(n.coordinateScale=[Number(o.coordinateScale[0]),Number(o.coordinateScale[1])]),void 0!==o.coordinateOffset&&(n.coordinateOffset=[Number(o.coordinateOffset[0]),Number(o.coordinateOffset[1])]),void 0!==o.waveASpeed&&(n.waveASpeed=o.waveASpeed),void 0!==o.waveAFrequency&&(n.waveAFrequency=o.waveAFrequency),void 0!==o.waveAAmplitude&&(n.waveAAmplitude=o.waveAAmplitude),void 0!==o.waveBSpeed&&(n.waveBSpeed=o.waveBSpeed),void 0!==o.waveBFrequency&&(n.waveBFrequency=o.waveBFrequency),void 0!==o.waveBAmplitude&&(n.waveBAmplitude=o.waveBAmplitude),o.baseColor&&(n.baseColor=s(o.baseColor)),o.fresnelColor&&(n.fresnelColor=s(o.fresnelColor)),o.waveADirection&&(n.waveADirection=u(o.waveADirection)),o.waveBDirection&&(n.waveBDirection=u(o.waveBDirection)),void 0!==r&&(n.mappingMode="world"===r?1:2*("object"===r)),n}};function s(e){let t=[Number(e[0]),Number(e[1]),Number(e[2])];return Math.max(...t.map(e=>Math.abs(e)))>1&&(t[0]/=255,t[1]/=255,t[2]/=255),t}function u(e){let t=Number(e[0]),i=Number(e[1]),r=Math.hypot(t,i);return 0===r?[1,0]:[t/r,i/r]}}}]);
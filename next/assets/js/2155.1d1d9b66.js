"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["2155"],{43078(e,t,i){i.d(t,{J0:()=>w,Kr:()=>C,NT:()=>A,Nf:()=>y,hb:()=>x,li:()=>b,vJ:()=>_});var o,n,r,a,l=i(60616),c=0,s=[],u=l.fF,f=u.__b,d=u.__r,p=u.diffed,m=u.__c,h=u.unmount,g=u.__;function v(e,t){u.__h&&u.__h(n,e,c||t),c=0;var i=n.__H||(n.__H={__:[],__h:[]});return e>=i.__.length&&i.__.push({}),i.__[e]}function w(e){return c=1,function(e,t){var i=v(o++,2);if(i.t=e,!i.__c&&(i.__=[P(void 0,t),function(e){var t=i.__N?i.__N[0]:i.__[0],o=i.t(t,e);t!==o&&(i.__N=[o,i.__[1]],i.__c.setState({}))}],i.__c=n,!n.__f)){var r=function(e,t,o){if(!i.__c.__H)return!0;var n=!1,r=i.__c.props!==e;if(i.__c.__H.__.some(function(e){if(e.__N){n=!0;var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(r=!0)}}),a){var l=a.call(this,e,t,o);return n?l||r:l}return!n||r};n.__f=!0;var a=n.shouldComponentUpdate,l=n.componentWillUpdate;n.componentWillUpdate=function(e,t,i){if(this.__e){var o=a;a=void 0,r(e,t,i),a=o}l&&l.call(this,e,t,i)},n.shouldComponentUpdate=r}return i.__N||i.__}(P,e)}function _(e,t){var i=v(o++,3);!u.__s&&T(i.__H,t)&&(i.__=e,i.u=t,n.__H.__h.push(i))}function y(e,t){var i=v(o++,4);!u.__s&&T(i.__H,t)&&(i.__=e,i.u=t,n.__h.push(i))}function b(e){return c=5,C(function(){return{current:e}},[])}function C(e,t){var i=v(o++,7);return T(i.__H,t)&&(i.__=e(),i.__H=t,i.__h=e),i.__}function x(e,t){return c=8,C(function(){return e},t)}function A(e){var t=n.context[e.__c],i=v(o++,9);return i.c=e,t?(null==i.__&&(i.__=!0,t.sub(n)),t.props.value):e.__}function L(){for(var e;e=s.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(M),t.__h.some(S),t.__h=[]}catch(i){t.__h=[],u.__e(i,e.__v)}}}u.__b=function(e){n=null,f&&f(e)},u.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),g&&g(e,t)},u.__r=function(e){d&&d(e),o=0;var t=(n=e.__c).__H;t&&(r===n?(t.__h=[],n.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(M),t.__h.some(S),t.__h=[],o=0)),r=n},u.diffed=function(e){p&&p(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(1!==s.push(t)&&a===u.requestAnimationFrame||((a=u.requestAnimationFrame)||function(e){var t,i=function(){clearTimeout(o),D&&cancelAnimationFrame(t),setTimeout(e)},o=setTimeout(i,35);D&&(t=requestAnimationFrame(i))})(L)),t.__H.__.some(function(e){e.u&&(e.__H=e.u,e.u=void 0)})),r=n=null},u.__c=function(e,t){t.some(function(e){try{e.__h.some(M),e.__h=e.__h.filter(function(e){return!e.__||S(e)})}catch(i){t.some(function(e){e.__h&&(e.__h=[])}),t=[],u.__e(i,e.__v)}}),m&&m(e,t)},u.unmount=function(e){h&&h(e);var t,i=e.__c;i&&i.__H&&(i.__H.__.some(function(e){try{M(e)}catch(e){t=e}}),i.__H=void 0,t&&u.__e(t,i.__v))};var D="function"==typeof requestAnimationFrame;function M(e){var t=n,i=e.__c;"function"==typeof i&&(e.__c=void 0,i()),n=t}function S(e){var t=n;e.__c=e.__(),n=t}function T(e,t){return!e||e.length!==t.length||t.some(function(t,i){return t!==e[i]})}function P(e,t){return"function"==typeof t?t(e):t}},81413(e,t,i){i.d(t,{FD:()=>r,FK:()=>o.FK,Y:()=>r});var o=i(60616),n=0;function r(e,t,i,r,a,l){t||(t={});var c,s,u=t;if("ref"in u)for(s in u={},t)"ref"==s?c=t[s]:u[s]=t[s];var f={type:e,props:u,key:i,ref:c,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--n,__i:-1,__u:0,__source:a,__self:l};if("function"==typeof e&&(c=e.defaultProps))for(s in c)void 0===u[s]&&(u[s]=c[s]);return o.fF.vnode&&o.fF.vnode(f),f}},12348(e,t,i){e.exports=i.p+"70b0ee3118bae7d0.js?url"},43847(e,t,i){let o;i.d(t,{e:()=>eC});var n=i(81413),r=i(1354),a=i(60616),l=i(43078);let c=Math.min,s=Math.max,u=Math.round,f=Math.floor,d=e=>({x:e,y:e}),p={left:"right",right:"left",bottom:"top",top:"bottom"};function m(e,t){return"function"==typeof e?e(t):e}function h(e){return e.split("-")[0]}function g(e){return e.split("-")[1]}function v(e){return"x"===e?"y":"x"}function w(e){return"y"===e?"height":"width"}function _(e){let t=e[0];return"t"===t||"b"===t?"y":"x"}function y(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}let b=["left","right"],C=["right","left"],x=["top","bottom"],A=["bottom","top"];function L(e){let t=h(e);return p[t]+e.slice(t.length)}function D(e){let{x:t,y:i,width:o,height:n}=e;return{width:o,height:n,top:i,left:t,right:t+o,bottom:i+n,x:t,y:i}}function M(e,t,i){let o,{reference:n,floating:r}=e,a=_(t),l=v(_(t)),c=w(l),s=h(t),u=n.x+n.width/2-r.width/2,f=n.y+n.height/2-r.height/2,d=n[c]/2-r[c]/2;switch(s){case"top":o={x:u,y:n.y-r.height};break;case"bottom":o={x:u,y:n.y+n.height};break;case"right":o={x:n.x+n.width,y:f};break;case"left":o={x:n.x-r.width,y:f};break;default:o={x:n.x,y:n.y}}let p=g(t);return p&&(o[l]+=d*("end"===p?1:-1)*(i&&"y"===a?-1:1)),o}async function S(e,t){var i,o,n,r,a;void 0===t&&(t={});let{x:l,y:c,platform:s,rects:u,elements:f,strategy:d}=e,{boundary:p="clippingAncestors",rootBoundary:h="viewport",elementContext:g="floating",altBoundary:v=!1,padding:w=0}=m(t,e),_="number"!=typeof w?{top:null!=(o=w.top)?o:0,right:null!=(n=w.right)?n:0,bottom:null!=(r=w.bottom)?r:0,left:null!=(a=w.left)?a:0}:{top:w,right:w,bottom:w,left:w},y=f[v?"floating"===g?"reference":"floating":g],b=D(await s.getClippingRect({element:null==(i=await (null==s.isElement?void 0:s.isElement(y)))||i?y:y.contextElement||await (null==s.getDocumentElement?void 0:s.getDocumentElement(f.floating)),boundary:p,rootBoundary:h,strategy:d})),C="floating"===g?{x:l,y:c,width:u.floating.width,height:u.floating.height}:u.reference,x=await (null==s.getOffsetParent?void 0:s.getOffsetParent(f.floating)),A=await (null==s.isElement?void 0:s.isElement(x))&&await (null==s.getScale?void 0:s.getScale(x))||{x:1,y:1},L=D(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:f,rect:C,offsetParent:x,strategy:d}):C);return{top:(b.top-L.top+_.top)/A.y,bottom:(L.bottom-b.bottom+_.bottom)/A.y,left:(b.left-L.left+_.left)/A.x,right:(L.right-b.right+_.right)/A.x}}let T=async(e,t,i)=>{let{placement:o="bottom",strategy:n="absolute",middleware:r=[],platform:a}=i,l=a.detectOverflow?a:{...a,detectOverflow:S},c=await (null==a.isRTL?void 0:a.isRTL(t)),s=await a.getElementRects({reference:e,floating:t,strategy:n}),{x:u,y:f}=M(s,o,c),d=o,p=0,m={};for(let i=0;i<r.length;i++){let h=r[i];if(!h)continue;let{name:g,fn:v}=h,{x:w,y:_,data:y,reset:b}=await v({x:u,y:f,initialPlacement:o,placement:d,strategy:n,middlewareData:m,rects:s,platform:l,elements:{reference:e,floating:t}});u=null!=w?w:u,f=null!=_?_:f,m[g]={...m[g],...y},b&&p<50&&(p++,"object"==typeof b&&(b.placement&&(d=b.placement),b.rects&&(s=!0===b.rects?await a.getElementRects({reference:e,floating:t,strategy:n}):b.rects),{x:u,y:f}=M(s,d,c)),i=-1)}return{x:u,y:f,placement:d,strategy:n,middlewareData:m}},P=new Set(["left","top"]);async function N(e,t){let{placement:i,platform:o,elements:n}=e,r=await (null==o.isRTL?void 0:o.isRTL(n.floating)),a=h(i),l=g(i),c="y"===_(i),s=P.has(a)?-1:1,u=r&&c?-1:1,f=m(t,e),{mainAxis:d,crossAxis:p,alignmentAxis:v}="number"==typeof f?{mainAxis:f,crossAxis:0,alignmentAxis:null}:{mainAxis:f.mainAxis||0,crossAxis:f.crossAxis||0,alignmentAxis:f.alignmentAxis};return l&&"number"==typeof v&&(p="end"===l?-1*v:v),c?{x:p*u,y:d*s}:{x:d*s,y:p*u}}function k(){return"u">typeof window}function B(e){return E(e)?(e.nodeName||"").toLowerCase():"#document"}function F(e){var t;return(null==e||null==(t=e.ownerDocument)?void 0:t.defaultView)||window}function R(e){var t;return null==(t=(E(e)?e.ownerDocument:e.document)||window.document)?void 0:t.documentElement}function E(e){return!!k()&&(e instanceof Node||e instanceof F(e).Node)}function z(e){return!!k()&&(e instanceof Element||e instanceof F(e).Element)}function I(e){return!!k()&&(e instanceof HTMLElement||e instanceof F(e).HTMLElement)}function O(e){return!(!k()||"u"<typeof ShadowRoot)&&(e instanceof ShadowRoot||e instanceof F(e).ShadowRoot)}function q(e){let{overflow:t,overflowX:i,overflowY:o,display:n}=V(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+i)&&"inline"!==n&&"contents"!==n}function H(e){try{if(e.matches(":popover-open"))return!0}catch(e){}try{return e.matches(":modal")}catch(e){return!1}}let Y=/transform|translate|scale|rotate|perspective|filter/,W=/paint|layout|strict|content/,j=e=>!!e&&"none"!==e;function $(e){let t=z(e)?V(e):e;return j(t.transform)||j(t.translate)||j(t.scale)||j(t.rotate)||j(t.perspective)||!U()&&(j(t.backdropFilter)||j(t.filter))||Y.test(t.willChange||"")||W.test(t.contain||"")}function U(){return null==o&&(o="u">typeof CSS&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),o}function G(e){return/^(html|body|#document)$/.test(B(e))}function V(e){return F(e).getComputedStyle(e)}function K(e){return z(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function X(e){if("html"===B(e))return e;let t=e.assignedSlot||e.parentNode||O(e)&&e.host||R(e);return O(t)?t.host:t}function J(e,t,i){var o;void 0===t&&(t=[]),void 0===i&&(i=!0);let n=function e(t){let i=X(t);return G(i)?(t.ownerDocument||t).body:I(i)&&q(i)?i:e(i)}(e),r=n===(null==(o=e.ownerDocument)?void 0:o.body),a=F(n);if(!r)return t.concat(n,J(n,[],i));{let e=Q(a);return t.concat(a,a.visualViewport||[],q(n)?n:[],e&&i?J(e):[])}}function Q(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Z(e){let t=V(e),i=parseFloat(t.width)||0,o=parseFloat(t.height)||0,n=I(e),r=n?e.offsetWidth:i,a=n?e.offsetHeight:o,l=u(i)!==r||u(o)!==a;return l&&(i=r,o=a),{width:i,height:o,$:l}}function ee(e){return z(e)?e:e.contextElement}function et(e){let t=ee(e);if(!I(t))return d(1);let i=t.getBoundingClientRect(),{width:o,height:n,$:r}=Z(t),a=(r?u(i.width):i.width)/o,l=(r?u(i.height):i.height)/n;return a&&Number.isFinite(a)||(a=1),l&&Number.isFinite(l)||(l=1),{x:a,y:l}}let ei=d(0);function eo(e){let t=F(e);return U()&&t.visualViewport?{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}:ei}function en(e,t,i,o){var n;void 0===t&&(t=!1),void 0===i&&(i=!1);let r=e.getBoundingClientRect(),a=ee(e),l=d(1);t&&(o?z(o)&&(l=et(o)):l=et(e));let c=(void 0===(n=i)&&(n=!1),o&&n&&o===F(a))?eo(a):d(0),s=(r.left+c.x)/l.x,u=(r.top+c.y)/l.y,f=r.width/l.x,p=r.height/l.y;if(a&&o){let e=F(a),t=z(o)?F(o):o,i=e,n=Q(i);for(;n&&t!==i;){let e=et(n),t=n.getBoundingClientRect(),o=V(n),r=t.left+(n.clientLeft+parseFloat(o.paddingLeft))*e.x,a=t.top+(n.clientTop+parseFloat(o.paddingTop))*e.y;s*=e.x,u*=e.y,f*=e.x,p*=e.y,s+=r,u+=a,n=Q(i=F(n))}}return D({width:f,height:p,x:s,y:u})}function er(e,t){let i=K(e).scrollLeft;return t?t.left+i:en(R(e)).left+i}function ea(e,t){let i=e.getBoundingClientRect();return{x:i.left+t.scrollLeft-er(e,i),y:i.top+t.scrollTop}}function el(e,t,i){var o;let n;if("viewport"===t||"layoutViewport"===t)n=function(e,t,i){void 0===i&&(i="viewport");let o="layoutViewport"===i,n=F(e),r=R(e),a=n.visualViewport,l=r.clientWidth,c=r.clientHeight,s=0,u=0;if(a){let e=!U()||"fixed"===t;o?e||(s=-a.offsetLeft,u=-a.offsetTop):(l=a.width,c=a.height,e&&(s=a.offsetLeft,u=a.offsetTop))}if(0>=er(r)){let e=r.ownerDocument,t=e.body,i=getComputedStyle(t),o="CSS1Compat"===e.compatMode&&parseFloat(i.marginLeft)+parseFloat(i.marginRight)||0,n=Math.abs(r.clientWidth-t.clientWidth-o),a="stable both-edges"===getComputedStyle(r).scrollbarGutter?n/2:n;a<=25&&(l-=a)}return{width:l,height:c,x:s,y:u}}(e,i,t);else if("document"===t){let t,i,r,a,l,c;t=K(o=R(e)),i=o.ownerDocument.body,r=s(o.scrollWidth,o.clientWidth,i.scrollWidth,i.clientWidth),a=s(o.scrollHeight,o.clientHeight,i.scrollHeight,i.clientHeight),l=-t.scrollLeft+er(o),c=-t.scrollTop,"rtl"===V(i).direction&&(l+=s(o.clientWidth,i.clientWidth)-r),n={width:r,height:a,x:l,y:c}}else if(z(t)){let e,o,r,a,l,c;o=(e=en(t,!0,"fixed"===i)).top+t.clientTop,r=e.left+t.clientLeft,a=et(t),l=t.clientWidth*a.x,c=t.clientHeight*a.y,n={width:l,height:c,x:r*a.x,y:o*a.y}}else{let i=eo(e);n={x:t.x-i.x,y:t.y-i.y,width:t.width,height:t.height}}return D(n)}function ec(e){return"static"===V(e).position}function es(e,t){if(!I(e)||"fixed"===V(e).position)return null;if(t)return t(e);let i=e.offsetParent;return R(e)===i&&(i=i.ownerDocument.body),i}function eu(e,t){var i;let o=F(e);if(H(e))return o;if(!I(e)){let t=X(e);for(;t&&!G(t);){if(z(t)&&!ec(t))return t;t=X(t)}return o}let n=es(e,t);for(;n&&(i=n,/^(table|td|th)$/.test(B(i)))&&ec(n);)n=es(n,t);return n&&G(n)&&ec(n)&&!$(n)?o:n||function(e){let t=X(e);for(;I(t)&&!G(t);){if($(t))return t;if(H(t))break;t=X(t)}return null}(e)||o}let ef=async function(e){let t=this.getOffsetParent||eu,i=this.getDimensions,o=await i(e.floating);return{reference:function(e,t,i){let o=I(t),n=R(t),r="fixed"===i,a=en(e,!0,r,t),l={scrollLeft:0,scrollTop:0},c=d(0);if((o||!r)&&(("body"!==B(t)||q(n))&&(l=K(t)),o)){let e=en(t,!0,r,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}!o&&n&&(c.x=er(n));let s=!n||o||r?d(0):ea(n,l);return{x:a.left+l.scrollLeft-c.x-s.x,y:a.top+l.scrollTop-c.y-s.y,width:a.width,height:a.height}}(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}},ed={convertOffsetParentRelativeRectToViewportRelativeRect:function(e){let{elements:t,rect:i,offsetParent:o,strategy:n}=e,r="fixed"===n,a=R(o),l=!!t&&H(t.floating);if(o===a||l&&r)return i;let c={scrollLeft:0,scrollTop:0},s=d(1),u=d(0),f=I(o);if((f||!r)&&(("body"!==B(o)||q(a))&&(c=K(o)),f)){let e=en(o);s=et(o),u.x=e.x+o.clientLeft,u.y=e.y+o.clientTop}let p=!a||f||r?d(0):ea(a,c);return{width:i.width*s.x,height:i.height*s.y,x:i.x*s.x-c.scrollLeft*s.x+u.x+p.x,y:i.y*s.y-c.scrollTop*s.y+u.y+p.y}},getDocumentElement:R,getClippingRect:function(e){let{element:t,boundary:i,rootBoundary:o,strategy:n}=e,r=[..."clippingAncestors"===i?H(t)?[]:function(e,t){let i=t.get(e);if(i)return i;let o=J(e,[],!1).filter(e=>z(e)&&"body"!==B(e)),n=null,r="fixed"===V(e).position,a=r?X(e):e;for(;z(a)&&!G(a);){let e=V(a),t=$(a),i=n?n.position:r?"fixed":"";t||"fixed"!==i&&("absolute"!==i||"static"!==e.position)?n=e:o=o.filter(e=>e!==a),a=X(a)}return t.set(e,o),o}(t,this._c):[].concat(i),o],a=el(t,r[0],n),l=a.top,u=a.right,f=a.bottom,d=a.left;for(let e=1;e<r.length;e++){let i=el(t,r[e],n);l=s(i.top,l),u=c(i.right,u),f=c(i.bottom,f),d=s(i.left,d)}return{width:u-d,height:f-l,x:d,y:l}},getOffsetParent:eu,getElementRects:ef,getClientRects:function(e){return e.getClientRects?Array.from(e.getClientRects()):[]},getDimensions:function(e){let{width:t,height:i}=Z(e);return{width:t,height:i}},getScale:et,isElement:z,isRTL:function(e){return"rtl"===V(e).direction}};function ep(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}let em=({content:e,placement:t="right",children:i})=>{let o=(0,l.li)(null),r=(0,l.li)(null),[a,u]=(0,l.J0)(!1),d=(0,l.li)(),p=(0,l.hb)(()=>{clearTimeout(d.current),u(!0)},[]),D=(0,l.hb)(()=>{clearTimeout(d.current),u(!1)},[]),M=(0,l.hb)(e=>{"Escape"===e.key&&D()},[D]);(0,l.vJ)(()=>{let e=r.current,i=o.current?.firstElementChild;if(a&&e&&i)return function(e,t,i,o){let n;void 0===o&&(o={});let{ancestorScroll:r=!0,ancestorResize:a=!0,elementResize:l="function"==typeof ResizeObserver,layoutShift:u="function"==typeof IntersectionObserver,animationFrame:d=!1}=o,p=ee(e),m=r||a?[...p?J(p):[],...t?J(t):[]]:[];m.forEach(e=>{r&&e.addEventListener("scroll",i),a&&e.addEventListener("resize",i)});let h=p&&u?function(e,t,i){let o,n=null,r=R(e);function a(){var e;clearTimeout(o),null==(e=n)||e.disconnect(),n=null}function l(i,u){void 0===i&&(i=!1),void 0===u&&(u=1),a();let d=e.getBoundingClientRect(),{left:p,top:m,width:h,height:g}=d;if(i||t(),!h||!g)return;let v={rootMargin:-f(m)+"px "+-f(r.clientWidth-(p+h))+"px "+-f(r.clientHeight-(m+g))+"px "+-f(p)+"px",threshold:s(0,c(1,u))||1},w=!0;function _(t){let i=t[0].intersectionRatio;if(!ep(d,e.getBoundingClientRect()))return l();if(i!==u){if(!w)return l();i?l(!1,i):o=setTimeout(()=>{l(!1,1e-7)},1e3)}w=!1}try{n=new IntersectionObserver(_,{...v,root:r.ownerDocument})}catch(e){n=new IntersectionObserver(_,v)}n.observe(e)}let u=F(e),d=()=>l(i);return u.addEventListener("resize",d),l(!0),()=>{u.removeEventListener("resize",d),a()}}(p,i,a):null,g=-1,v=null;l&&(v=new ResizeObserver(e=>{let[o]=e;o&&o.target===p&&v&&t&&(v.unobserve(t),cancelAnimationFrame(g),g=requestAnimationFrame(()=>{var e;null==(e=v)||e.observe(t)})),i()}),p&&!d&&v.observe(p),t&&v.observe(t));let w=d?en(e):null;return d&&function t(){let o=en(e);w&&!ep(w,o)&&i(),w=o,n=requestAnimationFrame(t)}(),i(),()=>{var e;m.forEach(e=>{r&&e.removeEventListener("scroll",i),a&&e.removeEventListener("resize",i)}),null==h||h(),null==(e=v)||e.disconnect(),v=null,d&&cancelAnimationFrame(n)}}(i,e,()=>{var o,n,a;let l,u,f;(a={placement:t,strategy:"fixed",middleware:[{name:"offset",options:8,async fn(e){var t,i;let{x:o,y:n,placement:r,middlewareData:a}=e,l=await N(e,8);return r===(null==(t=a.offset)?void 0:t.placement)&&null!=(i=a.arrow)&&i.alignmentOffset?{}:{x:o+l.x,y:n+l.y,data:{...l,placement:r}}}},(void 0===o&&(o={}),{name:"flip",options:o,async fn(e){var t,i,n,r,a,l,c,s;let u,f,d,{placement:p,middlewareData:D,rects:M,initialPlacement:S,platform:T,elements:P}=e,{mainAxis:N=!0,crossAxis:k=!0,fallbackPlacements:B,fallbackStrategy:F="bestFit",fallbackAxisSideDirection:R="none",flipAlignment:E=!0,...z}=m(o,e);if(null!=(t=D.arrow)&&t.alignmentOffset)return{};let I=h(p),O=_(S),q=h(S)===S,H=await (null==T.isRTL?void 0:T.isRTL(P.floating)),Y=B||(q||!E?[L(S)]:(u=L(S),[y(S),u,y(u)])),W="none"!==R;!B&&W&&Y.push(...(f=g(S),d=function(e,t,i){switch(e){case"top":case"bottom":if(i)return t?C:b;return t?b:C;case"left":case"right":return t?x:A;default:return[]}}(h(S),"start"===R,H),f&&(d=d.map(e=>e+"-"+f),E&&(d=d.concat(d.map(y)))),d));let j=[S,...Y],$=await T.detectOverflow(e,z),U=[],G=(null==(i=D.flip)?void 0:i.overflows)||[];if(N&&U.push($[I]),k){let e,t,i,o,n=(l=p,c=M,void 0===(s=H)&&(s=!1),e=g(l),i=w(t=v(_(l))),o="x"===t?e===(s?"end":"start")?"right":"left":"start"===e?"bottom":"top",c.reference[i]>c.floating[i]&&(o=L(o)),[o,L(o)]);U.push($[n[0]],$[n[1]])}if(G=[...G,{placement:p,overflows:U}],!U.every(e=>e<=0)){let e=((null==(n=D.flip)?void 0:n.index)||0)+1,t=j[e];if(t&&("alignment"!==k||O===_(t)||G.every(e=>_(e.placement)!==O||e.overflows[0]>0)))return{data:{index:e,overflows:G},reset:{placement:t}};let i=null==(r=G.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0])?void 0:r.placement;if(!i)switch(F){case"bestFit":{let e=null==(a=G.filter(e=>{if(W){let t=_(e.placement);return t===O||"y"===t}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0])?void 0:a[0];e&&(i=e);break}case"initialPlacement":i=S}if(p!==i)return{reset:{placement:i}}}return{}}}),{name:"shift",options:n={padding:4},async fn(e){let{x:t,y:i,placement:o,platform:r}=e,{mainAxis:a=!0,crossAxis:l=!1,limiter:u={fn:e=>{let{x:t,y:i}=e;return{x:t,y:i}}},...f}=m(n,e),d={x:t,y:i},p=await r.detectOverflow(e,f),h=_(o),g=v(h),w=d[g],y=d[h],b=(e,t)=>s(t+p["y"===e?"top":"left"],c(t,t-p["y"===e?"bottom":"right"]));a&&(w=b(g,w)),l&&(y=b(h,y));let C=u.fn({...e,[g]:w,[h]:y});return{...C,data:{x:C.x-t,y:C.y-i,enabled:{[g]:a,[h]:l}}}}}]},l=new Map,u=null!=a?a:{},f={...ed,...u.platform,_c:l},T(i,e,{...u,platform:f})).then(({x:t,y:i})=>{r.current===e&&Object.assign(e.style,{left:`${t}px`,top:`${i}px`,opacity:"1"})})})},[a,t]),(0,l.vJ)(()=>()=>clearTimeout(d.current),[]);let S=(0,l.hb)(t=>{t&&e instanceof HTMLElement&&t.replaceChildren(e.cloneNode(!0))},[e]);return null==e||!1===e||""===e?(0,n.Y)(n.FK,{children:i}):(0,n.FD)("div",{ref:o,className:"deck-widget-tooltip-trigger",onPointerEnter:p,onPointerLeave:D,onFocusCapture:p,onBlurCapture:D,onKeyDown:M,children:[i,a&&(0,n.Y)("div",{ref:r,className:"deck-widget-tooltip",role:"tooltip",style:{position:"fixed",opacity:0,fontSize:"12px",padding:"4px 8px"},children:e instanceof HTMLElement?(0,n.Y)("div",{ref:S}):e})]})},eh=e=>{let{className:t="",style:i,color:o,icon:r,label:a,tooltip:c,onClick:s,children:u}=e,f=!1===c?void 0:c??a,d=(0,l.Kr)(()=>{let e=function(e){if(!e)return;let t=`url("${e.replace(/"/g,"'")}")`;return{maskImage:t,WebkitMaskImage:t}}(r);return o?{...e,backgroundColor:o}:e},[o,r]),p=(0,n.Y)("button",{className:`deck-widget-icon-button ${t}`,type:"button",onClick:s,"aria-label":a,children:u||(0,n.Y)("div",{className:"deck-widget-icon",style:d})});return(0,n.Y)("div",{className:"deck-widget-button",style:i,children:f?(0,n.Y)(em,{content:f,children:p}):p})},eg={passive:!1},ev=(e,t,i)=>e<t?t:e>i?i:e,ew=(e,t)=>{if(!e||!e.firstElementChild)return[0,0];let i=e.firstElementChild.getBoundingClientRect();return t||t?[i.top,i.height]:[i.left,i.width]},e_=(e,t)=>"number"==typeof e&&!Number.isNaN(e)&&e>0?e:Math.max(1,t/10||1),ey=(e,t)=>"number"==typeof e&&!Number.isNaN(e)&&e>0?e:Math.max(1,t||1);function eb(e){let{className:t="",min:i,max:o,step:r,value:a,orientation:c,pageSize:s,stepButtons:u=!1,startButtonAriaLabel:f,endButtonAriaLabel:d,eventTarget:p,decorations:m=[],onChange:h}=e,g="horizontal"!==c,v=(0,l.li)(null),w=(0,l.li)(null),_=(0,l.li)(null),y=(0,l.li)(null),[b,C]=(0,l.J0)(0),x=o-i,A=Math.max(0,a[1]-a[0]),L=Math.max(0,x-A),D=ev(a[0],i,i+L),{thumbLength:M,thumbOffset:S}=(0,l.Kr)(()=>{if(b<=0||x<=0)return{thumbLength:0,thumbOffset:0};if(x<=A)return{thumbLength:1,thumbOffset:0};let e=A/x,t=Math.max(0,1-e);return{thumbLength:Math.max(0,Math.min(e,1)),thumbOffset:t*(L<=0?0:ev((D-i)/L,0,1))}},[b,x,A,L,D,i]),T=(0,l.hb)(e=>{if(!h)return;let t=ev(e,i,i+L);h([t,t+A])},[h,i,L,A]),P=(0,l.hb)(e=>{e.stopPropagation(),T(D-e_(r,x))},[T,D,r,x]),N=(0,l.hb)(e=>{e.stopPropagation(),T(D+e_(r,x))},[T,D,r,x]),k=(0,l.hb)(e=>{if(0!==e.button)return;let t=e.target;if(t?.dataset.scrollbarThumb==="true")return;let o=w.current;if(!o)return;e.preventDefault(),e.stopPropagation();let[n]=ew(o,g),r=g?e.clientY-n:e.clientX-n,a=Math.max(1,1-M)*b,l=M/2*b;T(i+(a<=0?0:ev((r-l)/a,0,1))*L)},[g,b,M,T,i,L]),B=(0,l.hb)(e=>{let t=y.current;if(!t||t.pointerId!==e.pointerId)return;let[i,o]=ew(w.current,g),n=(g?e.clientY:e.clientX)-t.startCoord;T(ev((t.startRatio+n/o)*(t.max-t.min),0,t.maxStart)+t.min),e.preventDefault()},[T,g]),F=(0,l.hb)(e=>{let t=y.current;t&&t.pointerId===e.pointerId&&(y.current=null,_.current?.releasePointerCapture(e.pointerId),e.preventDefault())},[]),R=(0,l.hb)(e=>{switch(e.key){case"ArrowUp":case"ArrowLeft":(g&&"ArrowUp"===e.key||!g&&"ArrowLeft"===e.key)&&(T(D-e_(r,x)),e.preventDefault());break;case"ArrowDown":case"ArrowRight":(g&&"ArrowDown"===e.key||!g&&"ArrowRight"===e.key)&&(T(D+e_(r,x)),e.preventDefault());break;case"PageUp":T(D-ey(s,A)),e.preventDefault();break;case"PageDown":T(D+ey(s,A)),e.preventDefault();break;case"Home":T(i),e.preventDefault();break;case"End":T(i+L),e.preventDefault()}},[g,T,D,r,x,s,A,i,L]),E=(0,l.hb)(e=>{if(e.preventDefault(),e.stopPropagation(),0===L)return;let t=g?e.deltaY:e.deltaX;g||0!==t||(t=e.deltaY),e.deltaMode===WheelEvent.DOM_DELTA_LINE?t*=e_(r,x):e.deltaMode===WheelEvent.DOM_DELTA_PAGE&&(t*=ey(s,A)),0!==t&&T(D+t)},[T,D,L,g,r,x,s,A]);(0,l.Nf)(()=>{C(ew(w.current,g)[1])},[g]),(0,l.Nf)(()=>{let e=w.current;if(!e)return;let t=()=>{C(ew(e,g)[1])};if(t(),"u">typeof ResizeObserver){let i=new ResizeObserver(t);return i.observe(e),()=>i.disconnect()}if("u">typeof window)return window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[g]),(0,l.vJ)(()=>{let e=p??v.current;if(e)return e.addEventListener("keydown",R),e.addEventListener("wheel",E,eg),()=>{e.removeEventListener("keydown",R),e.removeEventListener("wheel",E,eg)}},[p,R,E]);let z=(0,l.Kr)(()=>!m.length||x<=0?[]:m.map((e,t)=>{let[o,r]=e.position,a=(o-i)/x,l=Math.round(1e3*a)/10,c=Math.max(0,Math.round(((r-i)/x-a)*1e3)/10),s=g?{left:"0",width:"100%",top:`${l}%`,height:`${c}%`}:{top:"0",height:"100%",left:`${l}%`,width:`${c}%`};return(0,n.Y)("div",{className:"deck-widget-range__decoration",style:s,children:e.element},`decoration-${t}`)}),[m,x,i,g]);return(0,n.FD)("div",{ref:v,tabIndex:0,role:"scrollbar","aria-valuemin":i,"aria-valuemax":i+L,"aria-valuenow":D,"aria-orientation":c,className:`${t} deck-widget-range deck-widget-range--${c} ${0===L?"deck-widget-range--disabled":""}`,children:[u&&(0,n.Y)("button",{type:"button",className:"deck-widget-range__button deck-widget-range__button--start","aria-label":f,disabled:D<=i,onClick:P,children:(0,n.Y)("span",{className:"deck-widget-icon"})}),(0,n.FD)("div",{className:"deck-widget-range__track",ref:w,onClick:k,children:[(0,n.Y)("div",{className:"deck-widget-range__decorations",children:z}),(0,n.Y)("div",{className:"deck-widget-range__thumb","data-scrollbar-thumb":"true",ref:_,style:g?{height:`${100*M}%`,top:`${100*S}%`}:{width:`${100*M}%`,left:`${100*S}%`},onPointerDown:e=>{0!==e.button||w.current&&(y.current={pointerId:e.pointerId,startCoord:g?e.clientY:e.clientX,startRatio:S,min:i,max:o,maxStart:L},e.currentTarget.setPointerCapture(e.pointerId),e.preventDefault(),e.stopPropagation())},onPointerMove:B,onPointerUp:F,onPointerCancel:F})]}),u&&(0,n.Y)("button",{type:"button",className:"deck-widget-range__button deck-widget-range__button--end","aria-label":d,disabled:D>=i+L,onClick:N,children:(0,n.Y)("span",{className:"deck-widget-icon"})})]})}class eC extends r.x{getTime(){return this.props.time??this.currentTime}getPlaying(){return this.props.playing??this._playing}constructor(e={}){super(e),this.id="timeline",this.className="deck-widget-timeline",this.placement="fill",this._playing=!1,this.timerId=null,this.handlePlayPause=()=>{let e=!this.getPlaying();this.props.onPlayingChange?.(e),void 0===this.props.playing&&(e?this.play():this.stop())},this.handleTimeChange=([e])=>{this.props.onTimeChange(e),void 0===this.props.time&&(this.currentTime=e,this.props.timeline?.setTime(e),this.updateHTML())},this.tick=()=>{let{timeRange:[e,t],step:i,loop:o}=this.props;if(i>0){let n=this.getTime(),r=Math.round(n/i)*i+i;r>t&&(n<t?r=t:o?r=e:(r=t,this._playing=!1,this.props.onPlayingChange?.(!1))),this.props.onTimeChange(r),void 0===this.props.time&&(this.currentTime=r,this.props.timeline?.setTime(r)),this.updateHTML()}this._playing?this.timerId=window.setTimeout(this.tick,this.props.playInterval):this.timerId=null},this.currentTime=this.props.initialTime??this.props.timeRange[0];let t=this.props.time??this.currentTime;this.props.timeline?.setTime(t),this.setProps(this.props)}setProps(e){let{playing:t,time:i}=this.props;this.viewId=e.viewId??this.viewId,super.setProps(e),void 0!==e.time&&e.time!==i&&this.props.timeline?.setTime(e.time),void 0!==e.playing&&e.playing!==t&&(e.playing&&!this._playing?this._startTimer():!e.playing&&this._playing&&this._stopTimer())}onAdd(){this._playing=!1,this.timerId=null,this.props.autoPlay&&(void 0!==this.props.playing?this.props.onPlayingChange?.(!0):this.play())}onRemove(){this.stop()}onRenderHTML(e){let{timeRange:t,step:i,formatLabel:o,playTooltip:r,pauseTooltip:l}=this.props,c=this.getPlaying(),s=this.getTime();e.dataset.placement=this.props.placement,(0,a.XX)((0,n.FD)("div",{className:"deck-widget-button-group",children:[c?(0,n.Y)(eh,{label:"Pause",tooltip:l,className:"deck-widget-timeline-pause",onClick:this.handlePlayPause}):(0,n.Y)(eh,{label:"Play",tooltip:r,className:"deck-widget-timeline-play",onClick:this.handlePlayPause}),(0,n.Y)(eb,{min:t[0],max:t[1],orientation:"horizontal",step:i,value:[s,s],onChange:this.handleTimeChange,decorations:[{position:[s,s+i],element:(0,n.Y)("div",{className:"deck-widget-timeline-label deck-widget-timeline-label--current",children:o(s)})}]})]}),e)}play(){this._playing=!0;let{timeRange:[e,t]}=this.props;void 0===this.props.time&&this.getTime()>=t&&(this.currentTime=e,this.props.onTimeChange(e),this.props.timeline?.setTime(e)),this.updateHTML(),this.tick()}stop(){this._stopTimer(),this.updateHTML()}_startTimer(){this._playing=!0,this.tick()}_stopTimer(){this._playing=!1,null!==this.timerId&&(window.clearTimeout(this.timerId),this.timerId=null)}}eC.defaultProps={...r.x.defaultProps,id:"timeline",placement:"bottom-left",viewId:null,timeline:null,timeRange:[0,100],step:1,initialTime:void 0,time:void 0,onTimeChange:()=>{},autoPlay:!1,loop:!1,playInterval:1e3,playing:void 0,onPlayingChange:()=>{},formatLabel:String,playTooltip:void 0,pauseTooltip:void 0}},15979(e,t,i){i.d(t,{X:()=>c});var o=i(66925);let n=`\
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
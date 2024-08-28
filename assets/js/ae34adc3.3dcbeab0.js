"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[4109],{5680:(e,n,t)=>{t.d(n,{xA:()=>y,yg:()=>d});var i=t(6540);function r(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function l(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);n&&(i=i.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,i)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?l(Object(t),!0).forEach((function(n){r(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):l(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function a(e,n){if(null==e)return{};var t,i,r=function(e,n){if(null==e)return{};var t,i,r={},l=Object.keys(e);for(i=0;i<l.length;i++)t=l[i],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(i=0;i<l.length;i++)t=l[i],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var p=i.createContext({}),s=function(e){var n=i.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):o(o({},n),e)),t},y=function(e){var n=s(e.components);return i.createElement(p.Provider,{value:n},e.children)},c="mdxType",u={inlineCode:"code",wrapper:function(e){var n=e.children;return i.createElement(i.Fragment,{},n)}},g=i.forwardRef((function(e,n){var t=e.components,r=e.mdxType,l=e.originalType,p=e.parentName,y=a(e,["components","mdxType","originalType","parentName"]),c=s(t),g=r,d=c["".concat(p,".").concat(g)]||c[g]||u[g]||l;return t?i.createElement(d,o(o({ref:n},y),{},{components:t})):i.createElement(d,o({ref:n},y))}));function d(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var l=t.length,o=new Array(l);o[0]=g;var a={};for(var p in n)hasOwnProperty.call(n,p)&&(a[p]=n[p]);a.originalType=e,a[c]="string"==typeof e?e:r,o[1]=a;for(var s=2;s<l;s++)o[s]=t[s];return i.createElement.apply(null,o)}return i.createElement.apply(null,t)}g.displayName="MDXCreateElement"},2084:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>p,contentTitle:()=>o,default:()=>u,frontMatter:()=>l,metadata:()=>a,toc:()=>s});var i=t(8168),r=(t(6540),t(5680));const l={},o="clipPolyline",a={unversionedId:"modules/polygon/api-reference/clip-polyline",id:"modules/polygon/api-reference/clip-polyline",title:"clipPolyline",description:"Clips a polyline with a bounding box.",source:"@site/../docs/modules/polygon/api-reference/clip-polyline.md",sourceDirName:"modules/polygon/api-reference",slug:"/modules/polygon/api-reference/clip-polyline",permalink:"/math.gl/docs/modules/polygon/api-reference/clip-polyline",draft:!1,editUrl:"https://github.com/visgl/math.gl/tree/master/docs/../docs/modules/polygon/api-reference/clip-polyline.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",previous:{title:"clipPolygon",permalink:"/math.gl/docs/modules/polygon/api-reference/clip-polygon"},next:{title:"cutPolygonByGrid",permalink:"/math.gl/docs/modules/polygon/api-reference/cut-polygon-by-grid"}},p={},s=[{value:"Usage",id:"usage",level:2}],y={toc:s},c="wrapper";function u(e){let{components:n,...t}=e;return(0,r.yg)(c,(0,i.A)({},y,t,{components:n,mdxType:"MDXLayout"}),(0,r.yg)("h1",{id:"clippolyline"},"clipPolyline"),(0,r.yg)("p",{class:"badges"},(0,r.yg)("img",{src:"https://img.shields.io/badge/From-v3.2-blue.svg?style=flat-square",alt:"From-v3.2"})),(0,r.yg)("p",null,"Clips a polyline with a bounding box."),(0,r.yg)("pre",null,(0,r.yg)("code",{parentName:"pre",className:"language-js"},"import {clipPolyline} from '@math.gl/polygon';\n\nclipPolyline([-10, -10, 10, 10, 30, -10], [0, 0, 20, 20], {size: 2});\n// returns [[0, 0, 10, 10, 20, 0]]\n")),(0,r.yg)("p",null,"The clipping bounds are defined as an orthoganal rectangle on the XY plane. If a 3D polyline is supplied, it is clipped by the extuded volume from the bounding box."),(0,r.yg)("h2",{id:"usage"},"Usage"),(0,r.yg)("pre",null,(0,r.yg)("code",{parentName:"pre",className:"language-js"},"clipPolyline(positions, bbox, [options]);\n")),(0,r.yg)("p",null,"Arguments:"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"positions")," (Array|TypedArray) - a flat array of the vertex positions that define the polyline."),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"bbox")," (Array) - the bounding box, in ",(0,r.yg)("inlineCode",{parentName:"li"},"[minX, minY, maxX, maxY]")),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"options")," (Object, optional)",(0,r.yg)("ul",{parentName:"li"},(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"size")," (Number) - the number of elements in each vertex. Size ",(0,r.yg)("inlineCode",{parentName:"li"},"2")," will interpret ",(0,r.yg)("inlineCode",{parentName:"li"},"positions")," as ",(0,r.yg)("inlineCode",{parentName:"li"},"[x0, y0, x1, y1, ...]")," and size ",(0,r.yg)("inlineCode",{parentName:"li"},"3")," will interpret ",(0,r.yg)("inlineCode",{parentName:"li"},"positions")," as ",(0,r.yg)("inlineCode",{parentName:"li"},"[x0, y0, z0, x1, y1, z1, ...]"),". Default ",(0,r.yg)("inlineCode",{parentName:"li"},"2"),"."),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"startIndex")," (Number, optional) - the index in ",(0,r.yg)("inlineCode",{parentName:"li"},"positions")," to start reading vertices. Default ",(0,r.yg)("inlineCode",{parentName:"li"},"0"),"."),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"endIndex")," (Number, optional) - the index in ",(0,r.yg)("inlineCode",{parentName:"li"},"positions")," to stop reading vertices. Default ",(0,r.yg)("inlineCode",{parentName:"li"},"positions.length"),".")))),(0,r.yg)("p",null,"Returns:"),(0,r.yg)("p",null,"An array of polylines that are parts of the original polyline and contained by the given bounding box. Each polyline is represented by a positions array that uses the same vertex size as the input."),(0,r.yg)("p",null,"If the input polyline is entirely outside of the bounding box, an empty array will be returned."))}u.isMDXComponent=!0}}]);
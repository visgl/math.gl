"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[7424],{5680:(e,t,a)=>{a.d(t,{xA:()=>s,yg:()=>c});var n=a(6540);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function g(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function l(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?g(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):g(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function i(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},g=Object.keys(e);for(n=0;n<g.length;n++)a=g[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var g=Object.getOwnPropertySymbols(e);for(n=0;n<g.length;n++)a=g[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var o=n.createContext({}),m=function(e){var t=n.useContext(o),a=t;return e&&(a="function"==typeof e?e(t):l(l({},t),e)),a},s=function(e){var t=m(e.components);return n.createElement(o.Provider,{value:t},e.children)},d="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},y=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,g=e.originalType,o=e.parentName,s=i(e,["components","mdxType","originalType","parentName"]),d=m(a),y=r,c=d["".concat(o,".").concat(y)]||d[y]||p[y]||g;return a?n.createElement(c,l(l({ref:t},s),{},{components:a})):n.createElement(c,l({ref:t},s))}));function c(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var g=a.length,l=new Array(g);l[0]=y;var i={};for(var o in t)hasOwnProperty.call(t,o)&&(i[o]=t[o]);i.originalType=e,i[d]="string"==typeof e?e:r,l[1]=i;for(var m=2;m<g;m++)l[m]=a[m];return n.createElement.apply(null,l)}return n.createElement.apply(null,a)}y.displayName="MDXCreateElement"},2215:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>o,contentTitle:()=>l,default:()=>p,frontMatter:()=>g,metadata:()=>i,toc:()=>m});var n=a(8168),r=(a(6540),a(5680));const g={},l="Introduction",i={unversionedId:"README",id:"README",title:"Introduction",description:"Welcome to math.gl!",source:"@site/../docs/README.md",sourceDirName:".",slug:"/",permalink:"/math.gl/docs/",draft:!1,editUrl:"https://github.com/visgl/math.gl/tree/master/docs/../docs/README.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",next:{title:"What's New",permalink:"/math.gl/docs/whats-new"}},o={},m=[{value:"Features",id:"features",level:2},{value:"Modules",id:"modules",level:2},{value:"Supported Browsers and Node Versions",id:"supported-browsers-and-node-versions",level:2},{value:"History",id:"history",level:2},{value:"Attributions",id:"attributions",level:2},{value:"License",id:"license",level:2}],s={toc:m},d="wrapper";function p(e){let{components:t,...g}=e;return(0,r.yg)(d,(0,n.A)({},s,g,{components:t,mdxType:"MDXLayout"}),(0,r.yg)("h1",{id:"introduction"},"Introduction"),(0,r.yg)("p",null,"Welcome to math.gl! "),(0,r.yg)("p",null,"math.gl is TypeScript math library focused on ",(0,r.yg)("strong",{parentName:"p"},"geospatial")," and ",(0,r.yg)("strong",{parentName:"p"},"3D")," use cases. Designed as a composable, ",(0,r.yg)("strong",{parentName:"p"},"modular toolbox"),". math.gl provides a core module with the standard complement of vector and matrix classes, and a suite of optional modules implementing various aspects of geospatial and 3D math."),(0,r.yg)("p",null,"math.gl is  ",(0,r.yg)("strong",{parentName:"p"},"optimized for use with WebGL and WebGPU"),", however it is not a GPU math library, meaning that it has no GPU dependencies and is designed to be usable in any application."),(0,r.yg)("h2",{id:"features"},"Features"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("strong",{parentName:"li"},"Core classes")," - Basic vectors and matrices: ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/types")),", ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/core"))),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("strong",{parentName:"li"},"Geospatial projections")," - Support for a variety of geospatial projections ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/geospatial")),", ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/geoid")),", ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/proj4")),", ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/web-mercator"))),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("strong",{parentName:"li"},"Geospatial utilities")," - Cutting polygons and calculating sun position and direction ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/polygon")),",  ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/sun"))),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("strong",{parentName:"li"},"Discrete Global Grids")," - Standardized interfaces to a number of the major discrete global grids. ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/dggs-geohash")),", ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/dggs-quadkey")),", ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/dggs-s2"))),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("strong",{parentName:"li"},"3D math")," - 3D primitives and culling: ",(0,r.yg)("strong",{parentName:"li"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/culling")))),(0,r.yg)("h2",{id:"modules"},"Modules"),(0,r.yg)("p",null,"math.gl is a toolbox that offers a suite of composable modules."),(0,r.yg)("table",null,(0,r.yg)("thead",{parentName:"table"},(0,r.yg)("tr",{parentName:"thead"},(0,r.yg)("th",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"th"},"Core math libraries")),(0,r.yg)("th",{parentName:"tr",align:null},"Module ",(0,r.yg)("span",{style:{width:300}})),(0,r.yg)("th",{parentName:"tr",align:null},"Description"))),(0,r.yg)("tbody",{parentName:"table"},(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/types"))),(0,r.yg)("td",{parentName:"tr",align:null},"Basic math type helpers (",(0,r.yg)("inlineCode",{parentName:"td"},"NumericArray")," etc)")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("img",{alt:"core",src:a(3806).A,title:"core",width:"722",height:"434"})),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/core"))),(0,r.yg)("td",{parentName:"tr",align:null},"Basic math classes (vectors, matrices, etc)")))),(0,r.yg)("table",null,(0,r.yg)("thead",{parentName:"table"},(0,r.yg)("tr",{parentName:"thead"},(0,r.yg)("th",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"th"},"Geospatial math libraries")),(0,r.yg)("th",{parentName:"tr",align:null},"Module ",(0,r.yg)("span",{style:{width:300}})),(0,r.yg)("th",{parentName:"tr",align:null},"Description"))),(0,r.yg)("tbody",{parentName:"table"},(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("img",{alt:"geospatial",src:a(909).A,title:"geospatial",width:"820",height:"820"})),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/geospatial"))),(0,r.yg)("td",{parentName:"tr",align:null},"Ellipsoidal math for WGS84 coordinates.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("img",{alt:"geoid",src:a(7467).A,title:"geoid",width:"742",height:"468"})),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/geoid"))),(0,r.yg)("td",{parentName:"tr",align:null},"Earth Gravity Model support .")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/polygon"))),(0,r.yg)("td",{parentName:"tr",align:null},"Polygon math, including geospatial cutting etc.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/proj4"))),(0,r.yg)("td",{parentName:"tr",align:null},"Conversion between coordinate reference systems.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/sun"))),(0,r.yg)("td",{parentName:"tr",align:null},"Solar position / direction from position and time.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/web-mercator"))),(0,r.yg)("td",{parentName:"tr",align:null},"Supports 3D Web Mercator (spherical) projections.")))),(0,r.yg)("table",null,(0,r.yg)("thead",{parentName:"table"},(0,r.yg)("tr",{parentName:"thead"},(0,r.yg)("th",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"th"},"DGGS (Discrete global grid support) libraries")),(0,r.yg)("th",{parentName:"tr",align:null},"Module ",(0,r.yg)("span",{style:{width:300}})),(0,r.yg)("th",{parentName:"tr",align:null},"Description"))),(0,r.yg)("tbody",{parentName:"table"},(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("img",{alt:"geohash",src:a(2972).A,title:"geohash",width:"1268",height:"628"})),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/dggs-geohash"))),(0,r.yg)("td",{parentName:"tr",align:null},"Get geometry of GeoHash tokens.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("img",{alt:"quadkey",src:a(4045).A,title:"quadkey",width:"1252",height:"636"})),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/dggs-quadkey"))),(0,r.yg)("td",{parentName:"tr",align:null},"Get geometry of QuadKey tokens")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("img",{alt:"s2",src:a(4308).A,title:"s2",width:"1124",height:"588"})),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/dggs-s2"))),(0,r.yg)("td",{parentName:"tr",align:null},"Get geometry of S2 tokens.")))),(0,r.yg)("table",null,(0,r.yg)("thead",{parentName:"table"},(0,r.yg)("tr",{parentName:"thead"},(0,r.yg)("th",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"th"},"3D math libraries")),(0,r.yg)("th",{parentName:"tr",align:null},"Module ",(0,r.yg)("span",{style:{width:300}})),(0,r.yg)("th",{parentName:"tr",align:null},"Description"))),(0,r.yg)("tbody",{parentName:"table"},(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("img",{alt:"culling",src:a(3399).A,title:"culling",width:"676",height:"572"})),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/culling"))),(0,r.yg)("td",{parentName:"tr",align:null},"Bounding volumes and intersection testing.")))),(0,r.yg)("br",null),"In addition, math.gl provides a few deprecated legacy modules, to avoid breaking older applications.",(0,r.yg)("br",null),(0,r.yg)("br",null),(0,r.yg)("table",null,(0,r.yg)("thead",{parentName:"table"},(0,r.yg)("tr",{parentName:"thead"},(0,r.yg)("th",{parentName:"tr",align:null},"Legacy Module"),(0,r.yg)("th",{parentName:"tr",align:null},"Description"))),(0,r.yg)("tbody",{parentName:"table"},(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"math.gl"))),(0,r.yg)("td",{parentName:"tr",align:null},"Re-exports the API from ",(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/core")),'. An "alias" for ',(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/core"))," to avoid breaking old applications.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"viewport-mercator-project"))),(0,r.yg)("td",{parentName:"tr",align:null},"Re-exports the Web Mercator projection utilities in ",(0,r.yg)("strong",{parentName:"td"},(0,r.yg)("inlineCode",{parentName:"strong"},"@math.gl/web-mercator")),". The ",(0,r.yg)("a",{parentName:"td",href:"https://github.com/uber-common/viewport-mercator-project"},"viewport-mercator-project")," repository was moved to math.gl in Oct 2019.")))),(0,r.yg)("h2",{id:"supported-browsers-and-node-versions"},"Supported Browsers and Node Versions"),(0,r.yg)("p",null,"math.gl is fully supported on:"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"Evergreen browsers: Recent versions of Chrome, Safari, Firefox, Edge etc."),(0,r.yg)("li",{parentName:"ul"},"Node.js: Active and Maintenance ",(0,r.yg)("a",{parentName:"li",href:"https://nodejs.org/en/about/releases/"},"LTS releases"))),(0,r.yg)("h2",{id:"history"},"History"),(0,r.yg)("table",null,(0,r.yg)("thead",{parentName:"table"},(0,r.yg)("tr",{parentName:"thead"},(0,r.yg)("th",{parentName:"tr",align:null},"Year"),(0,r.yg)("th",{parentName:"tr",align:null},"Version"),(0,r.yg)("th",{parentName:"tr",align:null},"Description"))),(0,r.yg)("tbody",{parentName:"table"},(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"2015"),(0,r.yg)("td",{parentName:"tr",align:null},"N/A"),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"@math.gl/core")," classes were created as part of luma.gl v4, as a set of class wrappers for ",(0,r.yg)("inlineCode",{parentName:"td"},"gl-matrix")," for luma.gl and deck.gl frameworks.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"2017"),(0,r.yg)("td",{parentName:"tr",align:null},"v1.0"),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"math.gl")," was broken out into its own repository to manage luma.gl growth. The goal was to  independently usable set of 3D and Geospatial math modules.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"2018"),(0,r.yg)("td",{parentName:"tr",align:null},"v2.0"),(0,r.yg)("td",{parentName:"tr",align:null},"The math.gl API started to mature.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"2019"),(0,r.yg)("td",{parentName:"tr",align:null},"v3.0"),(0,r.yg)("td",{parentName:"tr",align:null},"A collaboration with the Cesium team around 3D Tiles led to parts of the Cesium math library were ported into the ",(0,r.yg)("inlineCode",{parentName:"td"},"math.gl/geospatial")," and ",(0,r.yg)("inlineCode",{parentName:"td"},"@math.gl/culling")," modules.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"2020+"),(0,r.yg)("td",{parentName:"tr",align:null},"v3.x"),(0,r.yg)("td",{parentName:"tr",align:null},"Additional geospatial modules have gradually been added to support more advanced use cases for deck.gl.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"2022"),(0,r.yg)("td",{parentName:"tr",align:null},"v3.6"),(0,r.yg)("td",{parentName:"tr",align:null},"Code base fully rewritten in TypeScript.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"2023"),(0,r.yg)("td",{parentName:"tr",align:null},"v4.0"),(0,r.yg)("td",{parentName:"tr",align:null},"ES module support. gl-matrix was removed as a dependency and math.gl became fully stand-alone.")))),(0,r.yg)("h2",{id:"attributions"},"Attributions"),(0,r.yg)("p",null,"math.gl was inspired by and built upon some of the most proven open source JavaScript math libraries:"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("a",{parentName:"li",href:"http://glmatrix.net/"},(0,r.yg)("inlineCode",{parentName:"a"},"gl-matrix"))," - math.gl classes use gl-matrix under the hood"),(0,r.yg)("li",{parentName:"ul"},"THREE.js math library - math.gl classes are API-compatible with a subset of the THREE.js classes and pass THREE.js test suites."),(0,r.yg)("li",{parentName:"ul"},"The CesiumJS math library (Apache2) - The geospatial and culling modules were ported from Cesium code base.")),(0,r.yg)("h2",{id:"license"},"License"),(0,r.yg)("p",null,"MIT license. The libraries that the core ",(0,r.yg)("inlineCode",{parentName:"p"},"@math.gl/core")," module are built on (e.g. gl-matrix) are also all open source and MIT licensed."),(0,r.yg)("p",null,"The ",(0,r.yg)("inlineCode",{parentName:"p"},"@math.gl/geospatial")," and ",(0,r.yg)("inlineCode",{parentName:"p"},"@math.gl/culling")," modules include Cesium-derived code which is Apache2 licensed."),(0,r.yg)("p",null,"math.gl will never include any code that is not under permissive license."))}p.isMDXComponent=!0},3806:(e,t,a)=>{a.d(t,{A:()=>n});const n=a.p+"assets/images/core-b38178fe628f9615fb32171dab17c500.png"},3399:(e,t,a)=>{a.d(t,{A:()=>n});const n=a.p+"assets/images/culling-d76339cdfadd4583a216f4767abc91f3.png"},2972:(e,t,a)=>{a.d(t,{A:()=>n});const n=a.p+"assets/images/geohash-c0e3daa00779237f6b20605b7db6da44.png"},4045:(e,t,a)=>{a.d(t,{A:()=>n});const n=a.p+"assets/images/quadkey-d0a4bf1a3af21e75bf2379d445f0b851.png"},4308:(e,t,a)=>{a.d(t,{A:()=>n});const n=a.p+"assets/images/s2-7622e8f72c519d9a2bccfc8db662f445.png"},7467:(e,t,a)=>{a.d(t,{A:()=>n});const n=a.p+"assets/images/geoid-2795dc73ac35ee0fa2d28b30d408631b.png"},909:(e,t,a)=>{a.d(t,{A:()=>n});const n="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSItNDEwIC00MTAgODIwIDgyMCI+DQogPHRpdGxlPldHUzg0IG1lYW4gRWFydGggcmFkaXVzPC90aXRsZT4NCiA8ZGVzYz5FcXVhdG9yaWFsICgnJ2EnJyksIHBvbGFyICgnJ2InJykgYW5kIG1lYW4gRWFydGggcmFkaWkgYXMgZGVmaW5lZCBpbiB0aGUgMTk4NCBXb3JsZCBHZW9kZXRpYyBTeXN0ZW0gcmV2aXNpb24sIGlsbHVzdHJhdGVkIGJ5IENNRyBMZWUuPC9kZXNjPg0KIDxkZWZzPg0KICA8cmFkaWFsR3JhZGllbnQgaWQ9ImdyYWRpZW50X3NoYWRlIiBjeD0iNTAlIiBjeT0iNTAlIiByPSI1MCUiIGZ4PSIzMCUiIGZ5PSIyMCUiPg0KICAgPHN0b3Agb2Zmc2V0PSIxMCUiIHN0b3AtY29sb3I9IiNmZmZmZmYiLz4NCiAgIDxzdG9wIG9mZnNldD0iOTklIiBzdG9wLWNvbG9yPSIjY2NlZWZmIi8+DQogIDwvcmFkaWFsR3JhZGllbnQ+DQogIDxwYXRoIGlkPSJhcnJvd2hlYWQiIGQ9Ik0gLTUsMjAgTCAwLDAgTCA1LDIwIiBzdHJva2UtZGFzaGFycmF5PSIxLDAiLz4NCiA8L2RlZnM+DQogPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9Ijk5OTk5IiBmaWxsPSIjZmZmZmZmIi8+DQogPGcgZm9udC1mYW1pbHk9IkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIg0KICAgIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2U9Im5vbmUiIGZpbGw9Im5vbmUiPg0KICA8Zz4NCiAgIDxnIHN0cm9rZT0iIzAwMDBmZiI+DQogICAgPGVsbGlwc2UgY3g9IjAiIGN5PSIwIiByeD0iNDAwIiByeT0iMzAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50X3NoYWRlKSIvPg0KICAgIDxwYXRoIHRyYW5zZm9ybT0ic2NhbGUoOSw3KSIgc3Ryb2tlPSJub25lIiBmaWxsPSIjNjY5OTAwIiBvcGFjaXR5PSIwLjI1Ig0KICAgICAgICAgIGQ9Ik0gMTAsLTUgQSAyMCwyMCAwIDAgMSAyMCwtMzUgQSAzMCwyMCAwIDAgMCAtMjAsLTM1IEEgMzAsMzAgMCAwIDAgMTAsLTUNCiAgICAgICAgICAgICBBIDMwLDMwIDAgMCAxIDAsNDAgQSAyNSwyMSAwIDAgMCAxMiwtNiIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoICAgMCwtMzAwKSIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQwMCwgICAwKSByb3RhdGUoLTkwKSIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoICAgMCwgICAwKSByb3RhdGUoIDkwKSIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoICAgMCwgICAwKSByb3RhdGUoMTgwKSIvPg0KICAgIDxwYXRoIGQ9Ik0gLTQwMCwwIEggMCBWIC0zMDAiLz4NCiAgIDwvZz4NCiAgIDxnIGZpbGw9IiMwMDAwZmYiPg0KICAgIDx0ZXh0IHg9Ii0xODAiIHk9IjQwIiBkeT0iMC42ZXgiDQogICAgID48dHNwYW4gZm9udC1zdHlsZT0iaXRhbGljIj5hPC90c3Bhbj48dHNwYW4+JiMxNjA7PSA2Mzc4LjEzNzAga208L3RzcGFuPjwvdGV4dD4NCiAgICA8dGV4dCB4PSIxMCIgeT0iLTEyMCIgZHk9IjAuNmV4IiB0ZXh0LWFuY2hvcj0ic3RhcnQiDQogICAgID48dHNwYW4gZm9udC1zdHlsZT0iaXRhbGljIj5iPC90c3Bhbj48dHNwYW4+JiMxNjA7JiM4Nzc2OyA2MzU2Ljc1MjMga208L3RzcGFuPjwvdGV4dD4NCiAgIDwvZz4NCiAgPC9nPg0KICA8Zz4NCiAgIDxnIHN0cm9rZT0iI2NjMDAwMCIgc3Ryb2tlLWRhc2hhcnJheT0iMjYsOCI+DQogICAgPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjM2NyIvPg0KICAgIDxwYXRoIGQ9Ik0gMjEwLDMwMCBMIDAsMCIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjEwLDMwMCkgcm90YXRlKDE0NSkiLz4NCiAgIDwvZz4NCiAgIDxnIGZpbGw9IiNjYzAwMDAiPg0KICAgIDx0ZXh0IHg9IjAiIHk9IjEyMCIgZHk9IjAuNmV4Ig0KICAgICA+PHRzcGFuPjI8L3RzcGFuPjx0c3BhbiBmb250LXN0eWxlPSJpdGFsaWMiPmE8L3RzcGFuDQogICAgID48dHNwYW4+JiMxNjA7KyYjMTYwOzwvdHNwYW4+PHRzcGFuIGZvbnQtc3R5bGU9Iml0YWxpYyI+YjwvdHNwYW4NCiAgICAgPjx0c3BhbiB4PSIwIj5fX19fXzwvdHNwYW4+PHRzcGFuIHg9IjAiIGR5PSIxZW0iPiYjMTYwOyAzPC90c3Bhbg0KICAgICA+PHRzcGFuIHg9IjAiIGR5PSIxLjVlbSI+JiM4Nzc2OyA2MzcxLjAwODgga208L3RzcGFuPjwvdGV4dD4NCiAgIDwvZz4NCiAgPC9nPg0KIDwvZz4NCjwvc3ZnPg0K"}}]);
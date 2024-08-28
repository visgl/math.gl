"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[8733],{5680:(e,n,t)=>{t.d(n,{xA:()=>u,yg:()=>d});var l=t(6540);function r(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function a(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);n&&(l=l.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,l)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?a(Object(t),!0).forEach((function(n){r(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function o(e,n){if(null==e)return{};var t,l,r=function(e,n){if(null==e)return{};var t,l,r={},a=Object.keys(e);for(l=0;l<a.length;l++)t=a[l],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(l=0;l<a.length;l++)t=a[l],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var p=l.createContext({}),s=function(e){var n=l.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},u=function(e){var n=s(e.components);return l.createElement(p.Provider,{value:n},e.children)},m="mdxType",c={inlineCode:"code",wrapper:function(e){var n=e.children;return l.createElement(l.Fragment,{},n)}},g=l.forwardRef((function(e,n){var t=e.components,r=e.mdxType,a=e.originalType,p=e.parentName,u=o(e,["components","mdxType","originalType","parentName"]),m=s(t),g=r,d=m["".concat(p,".").concat(g)]||m[g]||c[g]||a;return t?l.createElement(d,i(i({ref:n},u),{},{components:t})):l.createElement(d,i({ref:n},u))}));function d(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var a=t.length,i=new Array(a);i[0]=g;var o={};for(var p in n)hasOwnProperty.call(n,p)&&(o[p]=n[p]);o.originalType=e,o[m]="string"==typeof e?e:r,i[1]=o;for(var s=2;s<a;s++)i[s]=t[s];return l.createElement.apply(null,i)}return l.createElement.apply(null,t)}g.displayName="MDXCreateElement"},2261:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>p,contentTitle:()=>i,default:()=>c,frontMatter:()=>a,metadata:()=>o,toc:()=>s});var l=t(8168),r=(t(6540),t(5680));const a={},i="Plane",o={unversionedId:"modules/culling/api-reference/plane",id:"modules/culling/api-reference/plane",title:"Plane",description:"A plane in Hessian Normal Form defined by ax + by + cz + d = 0 where [a, b, c] is the plane's normal, d is the signed distance to the plane (from the origin along the normal), and [x, y, z] is any point on the plane.",source:"@site/../docs/modules/culling/api-reference/plane.md",sourceDirName:"modules/culling/api-reference",slug:"/modules/culling/api-reference/plane",permalink:"/math.gl/docs/modules/culling/api-reference/plane",draft:!1,editUrl:"https://github.com/visgl/math.gl/tree/master/docs/../docs/modules/culling/api-reference/plane.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",previous:{title:"OrientedBoundingBox",permalink:"/math.gl/docs/modules/culling/api-reference/oriented-bounding-box"},next:{title:"Overview",permalink:"/math.gl/docs/modules/geoid/"}},p={},s=[{value:"Usage",id:"usage",level:2},{value:"Fields",id:"fields",level:2},{value:"normal : Vector3",id:"normal--vector3",level:3},{value:"distance : Number",id:"distance--number",level:3},{value:"Methods",id:"methods",level:2},{value:"constructor(normal : Number3, distance : Number)",id:"constructornormal--number3-distance--number",level:3},{value:"fromPointNormal(point : Number3, normal : Number3) : Plane",id:"frompointnormalpoint--number3-normal--number3--plane",level:3},{value:"Plane.fromCoefficients(coefficients : Number4) : Plane",id:"planefromcoefficientscoefficients--number4--plane",level:3},{value:"clone() : Plane",id:"clone--plane",level:3},{value:"equals(right : Plane) : Boolean",id:"equalsright--plane--boolean",level:3},{value:"getPointDistance(point : Number3) : Number",id:"getpointdistancepoint--number3--number",level:3},{value:"projectPointOntoPlane(point : Number3, result : Number3]) : Number3",id:"projectpointontoplanepoint--number3-result--number3--number3",level:3},{value:"transform(transform : Number16) : Plane",id:"transformtransform--number16--plane",level:3},{value:"Attribution",id:"attribution",level:2}],u={toc:s},m="wrapper";function c(e){let{components:n,...t}=e;return(0,r.yg)(m,(0,l.A)({},u,t,{components:n,mdxType:"MDXLayout"}),(0,r.yg)("h1",{id:"plane"},"Plane"),(0,r.yg)("p",null,"A plane in Hessian Normal Form defined by ",(0,r.yg)("inlineCode",{parentName:"p"},"ax + by + cz + d = 0")," where ",(0,r.yg)("inlineCode",{parentName:"p"},"[a, b, c]")," is the plane's ",(0,r.yg)("inlineCode",{parentName:"p"},"normal"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"d")," is the signed distance to the plane (from the origin along the normal), and ",(0,r.yg)("inlineCode",{parentName:"p"},"[x, y, z]")," is any point on the plane."),(0,r.yg)("h2",{id:"usage"},"Usage"),(0,r.yg)("p",null,"Create the plane ",(0,r.yg)("inlineCode",{parentName:"p"},"x=0")),(0,r.yg)("pre",null,(0,r.yg)("code",{parentName:"pre",className:"language-js"},"import {Plane} from '@math.gl/culling';\nconst plane = new Plane([1, 0, 0], 0.0);\n")),(0,r.yg)("p",null,"Create a tangent plane for a cartographic coordinate"),(0,r.yg)("pre",null,(0,r.yg)("code",{parentName:"pre",className:"language-js"},"import {Plane} from '@math.gl/culling';\nimport {Ellipsoid} from '@math.gl/geospatial';\nconst point = [-72.0, 40.0, 0];\nconst normal = Ellipsoid.WGS84.geodeticSurfaceNormal([-72.0, 40.0]);\nconst tangentPlane = new Plane().fromPointNormal(point, normal);\n")),(0,r.yg)("h2",{id:"fields"},"Fields"),(0,r.yg)("h3",{id:"normal--vector3"},"normal : Vector3"),(0,r.yg)("p",null,"The plane's normal."),(0,r.yg)("h3",{id:"distance--number"},"distance : Number"),(0,r.yg)("p",null,"The shortest distance from the origin to the plane. The sign of ",(0,r.yg)("inlineCode",{parentName:"p"},"distance")," determines which side of the plane the origin is on. If ",(0,r.yg)("inlineCode",{parentName:"p"},"distance")," is positive, the origin is in the half-space in the direction of the normal; if negative, the origin is in the half-space opposite to the normal; if zero, the plane passes through the origin."),(0,r.yg)("h2",{id:"methods"},"Methods"),(0,r.yg)("h3",{id:"constructornormal--number3-distance--number"},"constructor(normal : Number","[3]",", distance : Number)"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"Vector3")," normal The plane's normal (normalized)."),(0,r.yg)("li",{parentName:"ul"},"Number distance The shortest distance from the origin to the plane. The sign of ",(0,r.yg)("inlineCode",{parentName:"li"},"distance")," determines which side of the plane the origin is on. If ",(0,r.yg)("inlineCode",{parentName:"li"},"distance")," is positive, the origin is in the half-space in the direction of the normal; if negative, the origin is in the half-space opposite to the normal; if zero, the plane passes through the origin.")),(0,r.yg)("p",null,"Throws"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"Normal must be normalized")),(0,r.yg)("h3",{id:"frompointnormalpoint--number3-normal--number3--plane"},"fromPointNormal(point : Number","[3]",", normal : Number","[3]",") : Plane"),(0,r.yg)("p",null,"Creates a plane from a normal and a point on the plane."),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"Vector3")," point The point on the plane."),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"Vector3")," normal The plane's normal (normalized)."),(0,r.yg)("li",{parentName:"ul"},"Plane ","[result]"," The object onto which to store the result.")),(0,r.yg)("p",null,"Throws"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"Normal must be normalized")),(0,r.yg)("h3",{id:"planefromcoefficientscoefficients--number4--plane"},"Plane.fromCoefficients(coefficients : Number","[4]",") : Plane"),(0,r.yg)("p",null,"Creates a plane from the general equation"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"coefficients")," The plane coefficients (normalized).")),(0,r.yg)("p",null,"Throws"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"Normal must be normalized")),(0,r.yg)("h3",{id:"clone--plane"},"clone() : Plane"),(0,r.yg)("p",null,"Duplicates a Plane instance."),(0,r.yg)("p",null,"Returns"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"A new Plane instance with the same values")),(0,r.yg)("h3",{id:"equalsright--plane--boolean"},"equals(right : Plane) : Boolean"),(0,r.yg)("p",null,"Compares the provided Planes by normal and distance and returns ",(0,r.yg)("inlineCode",{parentName:"p"},"true")," if they are equal, ",(0,r.yg)("inlineCode",{parentName:"p"},"false")," otherwise."),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"right")," The second plane.")),(0,r.yg)("p",null,"Returns"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"true")," if left and right are equal, ",(0,r.yg)("inlineCode",{parentName:"li"},"false")," otherwise.")),(0,r.yg)("h3",{id:"getpointdistancepoint--number3--number"},"getPointDistance(point : Number","[3]",") : Number"),(0,r.yg)("p",null,"Computes the signed shortest distance of a point to a plane. The sign of the distance determines which side of the plane the point is on. If the distance is positive, the point is in the half-space in the direction of the normal; if negative, the point is in the half-space opposite to the normal; if zero, the plane passes through the point."),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"point")," The point.")),(0,r.yg)("p",null,"Returns"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"Number The signed shortest distance of the point to the plane.")),(0,r.yg)("h3",{id:"projectpointontoplanepoint--number3-result--number3--number3"},"projectPointOntoPlane(point : Number","[3]",", result : Number","[3]","]) : Number","[3]"),(0,r.yg)("p",null,"Projects a point onto the plane."),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"point")," The point to project onto the plane"),(0,r.yg)("li",{parentName:"ul"},(0,r.yg)("inlineCode",{parentName:"li"},"result")," The result point. If undefined, a new ",(0,r.yg)("inlineCode",{parentName:"li"},"Array")," will be created.")),(0,r.yg)("p",null,"Returns"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"The modified result parameter or a new ",(0,r.yg)("inlineCode",{parentName:"li"},"Vector3")," instance if one was not provided.")),(0,r.yg)("h3",{id:"transformtransform--number16--plane"},"transform(transform : Number","[16]",") : Plane"),(0,r.yg)("p",null,"Transforms the plane by the given transformation matrix."),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"Matrix4 transform The transformation matrix."),(0,r.yg)("li",{parentName:"ul"},"Plane ","[result]"," The object into which to store the result.")),(0,r.yg)("p",null,"Returns"),(0,r.yg)("ul",null,(0,r.yg)("li",{parentName:"ul"},"Plane The plane transformed by the given transformation matrix.")),(0,r.yg)("h2",{id:"attribution"},"Attribution"),(0,r.yg)("p",null,"This class was ported from ",(0,r.yg)("a",{parentName:"p",href:"https://github.com/AnalyticalGraphicsInc/cesium"},"Cesium")," under the Apache 2 License."))}c.isMDXComponent=!0}}]);
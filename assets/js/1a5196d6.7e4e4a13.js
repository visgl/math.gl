"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[1680],{5680:(e,t,n)=>{n.d(t,{xA:()=>c,yg:()=>g});var r=n(6540);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var u=r.createContext({}),s=function(e){var t=r.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},c=function(e){var t=s(e.components);return r.createElement(u.Provider,{value:t},e.children)},p="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,u=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),p=s(n),d=o,g=p["".concat(u,".").concat(d)]||p[d]||m[d]||a;return n?r.createElement(g,i(i({ref:t},c),{},{components:n})):r.createElement(g,i({ref:t},c))}));function g(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,i=new Array(a);i[0]=d;var l={};for(var u in t)hasOwnProperty.call(t,u)&&(l[u]=t[u]);l.originalType=e,l[p]="string"==typeof e?e:o,i[1]=l;for(var s=2;s<a;s++)i[s]=n[s];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},794:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>u,contentTitle:()=>i,default:()=>m,frontMatter:()=>a,metadata:()=>l,toc:()=>s});var r=n(8168),o=(n(6540),n(5680));const a={},i="Overview",l={unversionedId:"modules/sun/README",id:"modules/sun/README",title:"Overview",description:"@math.gl/sun is a tiny JavaScript library for calculating sun position for the given location and time.",source:"@site/../docs/modules/sun/README.md",sourceDirName:"modules/sun",slug:"/modules/sun/",permalink:"/math.gl/docs/modules/sun/",draft:!1,editUrl:"https://github.com/visgl/math.gl/tree/master/docs/../docs/modules/sun/README.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",previous:{title:"Proj4Projection",permalink:"/math.gl/docs/modules/proj4/api-reference/proj4-projection"},next:{title:"getSun",permalink:"/math.gl/docs/modules/sun/api-reference/get-sun"}},u={},s=[{value:"Installation",id:"installation",level:2},{value:"Usage",id:"usage",level:2},{value:"Attribution",id:"attribution",level:2}],c={toc:s},p="wrapper";function m(e){let{components:t,...n}=e;return(0,o.yg)(p,(0,r.A)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,o.yg)("h1",{id:"overview"},"Overview"),(0,o.yg)("p",null,(0,o.yg)("inlineCode",{parentName:"p"},"@math.gl/sun")," is a tiny JavaScript library for calculating sun position for the given location and time."),(0,o.yg)("h2",{id:"installation"},"Installation"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-bash"},"npm install @math.gl/sun\n")),(0,o.yg)("h2",{id:"usage"},"Usage"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-js"},"import {getSunDirection} from '@math.gl/sun';\nconst latitude = 37.7749;\nconst longitude = -122.4194;\nconst sunDir = getSunDirection(Date.now(), latitude, longitude);\n")),(0,o.yg)("h2",{id:"attribution"},"Attribution"),(0,o.yg)("p",null,"This module is a fork of @mourner's ",(0,o.yg)("a",{parentName:"p",href:"https://github.com/mourner/suncalc"},"SunCalc")," under BSD 2-clause license."))}m.isMDXComponent=!0}}]);
"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["1028"],{37920(e,t,i){i.d(t,{l:()=>f});var n=i(33631);async function*r(e,t){let i=t?.chunkSize||1048576,n=0;for(;n<e.size;){let t=n+i,r=await e.slice(n,t).arrayBuffer();n=t,yield r}}var a=i(40818);function s(e,t){return a.Bd?o(e,t):l(e,t)}async function*o(e,t){let i,r=e.getReader(),a=!1,s=!1,o=!1;try{for(;;){let e,o=i||r.read();i=void 0;try{e=await o}catch(e){throw s=!0,e}let{done:l,value:u}=e;if(l){a=!0;return}t?._streamReadAhead&&(i=r.read()).catch(()=>{}),yield(0,n.XA)(u)}}catch(e){throw o=!0,e}finally{let e,t=!1;if(!a&&!s)try{await r.cancel()}catch(i){t=!0,e=i}try{r.releaseLock()}catch(i){t||(t=!0,e=i)}if(!o&&t)throw e}}async function*l(e,t){for await(let t of e)yield(0,n.XA)(t)}var u=i(20903);function f(e,t){if("string"==typeof e)return function*(e,t){let i=t?.chunkSize||262144,r=0,a=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,i),s=e.slice(r,r+t);r+=t,yield(0,n.W$)(a.encode(s))}}(e,t);if(e instanceof ArrayBuffer)return function*(e,t={}){let{chunkSize:i=262144}=t,n=0;for(;n<e.byteLength;){let t=Math.min(e.byteLength-n,i),r=new ArrayBuffer(t),a=new Uint8Array(e,n,t);new Uint8Array(r).set(a),n+=t,yield r}}(e,t);if((0,u.qf)(e))return r(e,t);if((0,u.H1)(e))return s(e,t);if((0,u.Sv)(e)){let i=e.body;if(!i)throw Error("Readable stream not available on Response");return s(i,t)}throw Error("makeIterator")}},44681(e,t,i){i.d(t,{k:()=>f});var n=i(76522),r=i(89664),a=i(67075),s=i(17434),o=i(54707),l=i(327),u=i(96458);let f=Object.freeze({fetchFile:n.t2,parse:r.q,parseFile:a.C,parseSync:s.n,parseInBatches:o.L,load:l.H,loadInBatches:u.m})},96458(e,t,i){i.d(t,{m:()=>f});var n=i(66290),r=i(90405),a=i(73968),s=i(8480),o=i(54707),l=i(1351),u=i(63379);function f(e,t,i,n){let a;return(Array.isArray(t)||(0,r.l)(t)?a=t:(i=t,a=void 0),Array.isArray(e))?e.map(e=>c(e,a,i||{})):c(e,a,i||{})}async function c(e,t,i){if("string"==typeof e){let r=await (0,l.M)(e,t,{...i,core:{...i.core,nothrow:!0}}),f=r&&!r.getAuthentications&&i.core?.credentials?.length?await (0,u._T)(r,i,e):r;i=await (0,n.M8)(f,e,i);let c=(0,a.z)(i),d=await c((0,s.b3)(e,i));return Array.isArray(t),await (0,o.L)(d,t,i)}return Array.isArray(t),await (0,o.L)(e,t,i)}},63379(e,t,i){i.d(t,{$P:()=>l,Mf:()=>_,_T:()=>s,pi:()=>o});var n=i(51925);let r=new Map,a=new Map;async function s(e,t,i){if(l(e)||!e.preload&&e.createDataSourceSync)return e;let n=f(e,t),s=a.get(e)?.get(n);if(s)return s;let o=r.get(e);o||(o=new Map,r.set(e,o));let c=o.get(n);return c||(c=u(e,t,i).then(t=>{let i=a.get(e);return i||(i=new Map,a.set(e,i)),i.set(n,t),t}).catch(t=>{throw o.delete(n),0===o.size&&r.delete(e),t}),o.set(n,c)),await c}function o(e,t){if(e.subloaders&&!d.has(e)){let t=p.get(e);if(t)return t;if(!l(e))return null}if(l(e)||!e.preload&&e.createDataSourceSync)return e;let i=f(e,t);return a.get(e)?.get(i)||null}function l(e){return!!(e.parse||e.parseBlob||e.parseUrl||e.parseSync||e.parseInBatches||e.parseText||e.parseTextSync||e.parseFile||e.parseFileInBatches)}async function u(e,t,i){if(e.preload){let n=await e.preload(i||"",t);if(n&&(l(n)||n.createDataSourceSync))return n;throw Error(`${e.id} loader preload() did not return a parser-bearing loader or a source factory`)}let n=function(e,t){if("test"===(t?._workerType||t?.core?._workerType)){let t=`modules/${e.module}/src/${e.id}-loader.ts`;return"u">typeof window?`/${t}`:"u">typeof process&&process.cwd?new URL(t,`file://${process.cwd()}/`).toString():t}throw Error(`${e.id} loader does not provide a parser implementation. Import a parser-bearing loader directly, or use preload() before parse/load.`)}(e,t);return await c(n,e.id)}function f(e,t){let i=t?.[e.id],n=e.options?.[e.id];return String(i?.backend||n?.backend||"")}async function c(e,t){for(let i of Object.values(await import(e)))if(i&&"object"==typeof i&&i.id===t&&l(i))return i;throw Error(`Could not find parser implementation for ${t} in ${e}`)}let d=new WeakSet,p=new WeakMap,h=new WeakMap;async function _(e,t,i){var n,r;return d.has(e)?await s(e,t,i):(n=e,r=t,!function e(t,i){if(i.includes(t))throw Error(`Subloader cycle: ${[...i,t].map(e=>e.id).join(" -> ")}`);for(let n of Object.values(m(t,r)))e(n,[...i,t])}(n,[]),await g(e,t,i))}async function g(e,t,i){if(!t){let t=h.get(e);if(t)return await t}let n=b(e,t,i);t||(h.set(e,n),n.catch(()=>h.delete(e)));let r=await n;return t||p.set(e,r),r}function m(e,t){let i=t?.core?.subloaders||{};return Object.fromEntries(Object.entries(e.subloaders||{}).map(([e,t])=>[e,Object.hasOwn(i,e)?i[e]:t]))}async function b(e,t,i){let[r,a]=await Promise.all([s(e,t,i),Promise.all(Object.entries(m(e,t)).map(async([e,n])=>[e,await g(n,t,i)]))]),o=Object.fromEntries(a),l=(0,n.l)(r.options,t||{});l.core={...l.core,worker:!1};let u={...r,options:l,subloaders:o};for(let i of(delete u.preload,u.worker=!1,["parseBlob","createDataSourceSync","parse","parseSync","parseText","parseTextSync","parseInBatches","parseFile","parseFileInBatches","parseUrl"])){let a=r[i];"function"==typeof a&&(u[i]=(i,s,l)=>{let u=(0,n.l)(t,s||{});return a.call(r,i,{...u,core:{...u.core,subloaders:t?.core?.subloaders||s?.core?.subloaders,worker:!1},[e.id]:{...u[e.id],subloaders:o}},l)})}return d.add(u),u}},327(e,t,i){i.d(t,{H:()=>d});var n=i(20903),r=i(66290),a=i(90405),s=i(75583),o=i(73968),l=i(8480),u=i(89664),f=i(1351),c=i(63379);async function d(e,t,i,d){let p,h;if(Array.isArray(t)||(0,a.l)(t)?(p=t,h=i):(p=[],h=t,d=void 0),h||=(0,l.pp)(),"string"==typeof e||(0,n.qf)(e)){let t=await (0,f.M)(e,p,{...h,core:{...h?.core,nothrow:!0}});if(t&&"string"==typeof e){let i=await (0,c._T)(t,h,e);if(i.createDataSourceSync&&!(0,c.$P)(i))throw Error(`${t.id} creates sources. Use createDataSource() instead of load().`);h=await (0,r.M8)(t.getAuthentications?t:i,e,h||{});let{parseUrl:n}=i;if(n){let i=(0,l.b3)(e,h),r=(0,s.FO)(t,(0,l.a5)(h,t,[t],e)),a=await n(i,r||h,d);return r?(0,s.B_)(a):a}}}h&&(h=(0,r.Bv)(h));let _=(0,o.z)(h),g=e;if("string"==typeof e&&(g=await _((0,l.b3)(e,h))),(0,n.qf)(e)&&(g=await _(e)),"string"==typeof e){let t=(0,l.Rf)(h||{});t.core?.baseUrl||(h={...h,core:{...h?.core,baseUrl:e}})}return Array.isArray(p),await (0,u.q)(g,p,h,d)}},67075(e,t,i){i.d(t,{C:()=>p});var n=i(75583),r=i(66290),a=i(51925),s=i(27912),o=i(90405),l=i(8480),u=i(32429),f=i(63379),c=i(89664),d=i(1351);async function p(e,t,i,a){!t||Array.isArray(t)||(0,o.l)(t)||(a=void 0,i=t,t=void 0),i=i||{},(i.signal||a?.signal)?.throwIfAborted();let s=e.url||"",p=t,_=(0,u.i)(p,a),g=await (0,d.M)(s,_,i);if(!g)return null;let m=(0,l.a5)(i,g,_,s),b=!g.getAuthentications&&m.core?.credentials?.length?await (0,f._T)(g,m,s||a?.url):g,v=await (0,r.M8)(b,s,m),y=(0,n.FO)(g,v,!1);a=(0,u.l)({url:s,_parse:c.q,loaders:_},y||v,a||null);let w=await h(g,e,y||v,a);return y?(0,n.B_)(w):w}async function h(e,t,i,n){(i.signal||n.signal)?.throwIfAborted(),(0,s.z)(e),i=(0,a.l)(e.options,i);let r=await (0,f._T)(e,i,n.url);if(r.parseFile){let e=r.prepareParseOutput?.(i),a=await r.parseFile(t,e?.options??i,n);return e?e.convert(a):a}if(r.parse){let a=t.bigsize>0n?Number(t.bigsize):t.size;if(!a)throw Error(`${e.id} loader - cannot fall back to parse without a file size`);let s=await t.read(0n,a);return await (0,c.q)(s,r,i,n)}if(r.createDataSourceSync)throw Error(`${e.id} has no file parser. Use createDataSource() to open a source.`);throw Error(`${e.id} loader - no file parser found`)}},54707(e,t,i){i.d(t,{L:()=>_});var n=i(75583),r=i(66290),a=i(86964),s=i(42080),o=i(90405),l=i(8480),u=i(32429),f=i(1035),c=i(72548),d=i(63379),p=i(1351),h=i(89664);async function _(e,t,i,a){let s=Array.isArray(t)?t:void 0;Array.isArray(t)||(0,o.l)(t)||(a=void 0,i=t,t=void 0),(i?.signal||a?.signal)?.throwIfAborted(),e=await e,i=i||{},(i.signal||a?.signal)?.throwIfAborted();let f=(0,c.Al)(e),m=await (0,p.M)(e,t,i);if(!m)return[];let b=(0,l.a5)(i,m,s,f),v=!m.getAuthentications&&b.core?.credentials?.length?await (0,d._T)(m,b,f||a?.url):m,y=await (0,r.M8)(v,f||"",b),w=(0,n.FO)(m,y,!0);a=(0,u.l)({url:f,_parseInBatches:_,_parse:h.q,loaders:s},w||y,a||null);let x=await (0,d._T)(m,y,a.url),E=await g(m,x,e,w||y,a);return w?(0,n.Nw)(E):E}async function g(e,t,i,n,r){let a=t.parseInBatches?t.prepareParseBatchOutput?.(n):null,s=await b(t,i,a?.options??n,r),o=a?m(s,a.convert):s;if(!n?.core?.metadata)return o;let l={shape:"metadata",batchType:"metadata",metadata:{_loader:e,_context:r},data:[],bytesUsed:0};return async function*(e){yield l,yield*e}(o)}async function*m(e,t){for await(let i of e)yield t(i)}async function b(e,t,i,n){let r=await (0,f.re)(t,i),s=await y(r,i?.core?.transforms||[]);return e.parseInBatches?(0,a.ZT)(e,i)?(0,a.FR)(e,s,i,n,h.q):e.parseInBatches(s,i,n):v(s,e,i,n)}async function*v(e,t,i,n){var r,a;let o,l=await (0,s.cy)(e),u=(r=await (0,h.q)(l,t,{...i,core:{...i?.core,mimeType:t.mimeTypes[0]}},n),a=t,(o=!function(e){if(!e||"object"!=typeof e||!("shape"in e))return!1;switch(e.shape){case"array-row-table":case"object-row-table":return Array.isArray(e.data);case"geojson-table":return Array.isArray(e.features);case"columnar-table":return!!(e.data&&"object"==typeof e.data);case"arrow-table":return!!(e.data&&"object"==typeof e.data&&"numRows"in e.data);default:return!1}}(r)?{shape:"unknown",batchType:"data",data:r,length:Array.isArray(r)?r.length:1}:{...r,length:function(e){switch(e.shape){case"array-row-table":case"object-row-table":return e.data.length;case"geojson-table":return e.features.length;case"arrow-table":return e.data.numRows;case"columnar-table":for(let t of Object.values(e.data))return t.length||0;return 0}}(r),batchType:"data"}).mimeType=a.mimeTypes[0],o);yield u}async function y(e,t=[]){let i=e;for await(let e of t)i=e(i);return i}},17434(e,t,i){i.d(t,{n:()=>c});var n=i(75583),r=i(1351),a=i(90405),s=i(8480),o=i(1035),l=i(32429),u=i(72548),f=i(63379);function c(e,t,i,c){Array.isArray(t)||(0,a.l)(t)||(c=void 0,i=t,t=void 0),i=i||{};let d=t,p=(0,l.i)(d,c),h=(0,r.p)(e,p,i);if(!h)return null;let _=(0,s.a5)(i,h,p),g=(0,u.Al)(e),m=()=>{throw Error("parseSync called parse (which is async")},b=(0,n.FO)(h,_,!1);c=(0,l.l)({url:g,_parseSync:m,_parse:m,loaders:t},b||_,c||null);let v=function(e,t,i,n){if(t=(0,o.lG)(t,e,i),e.parseTextSync&&"string"==typeof t)return e.parseTextSync(t,i);if(e.parseSync&&t instanceof ArrayBuffer)return e.parseSync(t,i,n);if(e.preload)throw Error(`${e.name} loader: 'parseSync' requires a parser-bearing loader. Import the loader implementation directly, or call preload(loader) before parseSync(). ${n.url||""}`);if(e.createDataSourceSync)throw Error(`${e.id} has no synchronous parser. Use createDataSource() to open a source.`);throw Error(`${e.name} loader: 'parseSync' not supported by this loader, use 'parse' instead. ${n.url||""}`)}((0,f.pi)(h)||h,e,b||_,c);return b?(0,n.B_)(v):v}},89664(e,t,i){i.d(t,{q:()=>g});var n=i(75583),r=i(66290),a=i(51925),s=i(20903),o=i(86964),l=i(27912),u=i(90405),f=i(8480),c=i(1035),d=i(32429),p=i(72548),h=i(63379),_=i(1351);async function g(e,t,i,a){!t||Array.isArray(t)||(0,u.l)(t)||(a=void 0,i=t,t=void 0),(i?.signal||a?.signal)?.throwIfAborted(),e=await e,i=i||{},(i.signal||a?.signal)?.throwIfAborted();let s=(0,p.Al)(e),o=t,l=(0,d.i)(o,a),c=await (0,_.M)(e,l,i);if(!c)return null;let b=(0,f.a5)(i,c,l,s),v=!c.getAuthentications&&b.core?.credentials?.length?await (0,h._T)(c,b,s||a?.url):c,y=await (0,r.M8)(v,s||"",b),w=(0,n.FO)(c,y,!1);a=(0,d.l)({url:s,_parse:g,loaders:l},w||y,a||null);let x=await m(c,e,w||y,a);return w?(0,n.B_)(x):x}async function m(e,t,i,n){let r;if((i.signal||n.signal)?.throwIfAborted(),(0,l.z)(e),i=(0,a.l)(e.options,i),(0,s.Sv)(t)){let{ok:e,redirected:i,status:r,statusText:a,type:s,url:o}=t;n.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:i,status:r,statusText:a,type:s,url:o}}let u=await (0,h._T)(e,i,n.url);if(u.createDataSourceSync&&!(0,h.$P)(u))throw Error(`${e.id} creates sources. Use createDataSource() to open a source.`);let f=u.prepareParseOutput?.(i),d=f?.options??i;return(0,o.L6)(u,t,d,n,e)?(t=await (0,c.Ct)(t,d),r=await (0,o.gm)(u,t,d,n,g)):(0,s.qf)(t)&&u.parseBlob?r=await u.parseBlob(t,d,n):(t=await (0,c.O1)(t,e,d),r=await b(u,t,d,n)),f?f.convert(r):r}async function b(e,t,i,n){if(e.parseText&&"string"==typeof t)return await e.parseText(t,i,n);if(e.parseTextSync&&"string"==typeof t)return e.parseTextSync(t,i,n);if(e.parse)return await e.parse(t,i,n);if(e.parseSync)throw Error(`${e.name} loader: 'parse' not available on parser-bearing sync loader. Add an async 'parse' function to this loader, or call preload(loader) before parseSync(). ${n.url||""}`);if(e.createDataSourceSync)throw Error(`${e.id} creates sources. Use createDataSource() to open a source.`);throw Error(`${e.id} loader - no parser found and worker is disabled`)}},5223(e,t,i){i.d(t,{Ph:()=>o,mk:()=>s,wx:()=>l});var n=i(90405),r=i(8480);let a=()=>{let e=(0,r.K2)();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function s(e){let t=a();for(let i of e=Array.isArray(e)?e:[e]){let e=(0,n.D)(i);t.find(t=>e===t)||t.unshift(e)}}function o(){return a()}function l(){(0,r.K2)().loaderRegistry=[]}},1351(e,t,i){i.d(t,{M:()=>g,p:()=>m});var n=i(20903),r=i(5969),a=i(18553),s=i(58345),o=i(26358),l=i(33631),u=i(90405),f=i(8480),c=i(72548),d=i(42221),p=i(5223),h=i(28071);let _=/\.([^.]+)$/;async function g(e,t=[],i,r,a="parse"){var s;let o,l;if(!v(e))return null;let d=(0,f.Rf)(i||{});if(d.core||={},t&&!Array.isArray(t))return(0,u.D)(t);let h=e instanceof Response&&(s=e,(l=(0,c.z4)(s))&&(l.startsWith("text/")||"application/json"===l||l.endsWith("+json")))?await e.clone().text():null;async function _(t){w(t);let i=null!==h&&b(h,t,d,r,a)||b(e,t,d,r,a);return!i&&(0,n.qf)(e)&&t.length?b(o??=await e.slice(0,10).arrayBuffer(),t,d,r,a):i}let m=await _(t||[]);if(m||d.core.ignoreRegisteredLoaders||(m=await _((0,p.Ph)())),!m&&!d.core.nothrow)throw Error(y(e));return m}function m(e,t=[],i,n,r="parse"){if(!v(e))return null;let a=(0,f.Rf)(i||{});if(a.core||={},t&&!Array.isArray(t))return(0,u.D)(t);let s=t||[];w(s);let o=b(e,s,a,n,r);if(o||a.core.ignoreRegisteredLoaders||(o=b(e,(0,p.Ph)(),a,n,r)),!o&&!a.core.nothrow)throw Error(y(e));return o}function b(e,t,i,s,o="parse"){var l,u;let f,d,p=(0,c.Al)(e),g=(0,c.z4)(e),m=(0,h.S3)(p)||s?.url,v=null,y="",w=i?.core&&"type"in i.core?i.core.type:void 0;w&&"auto"!==w&&(y=(v=function(e,t){for(let i of e)if((0,r.p)(i)&&i.type===t)return i;return null}(t,w))?`match forced by supplied source type ${w}`:""),i?.core?.mimeType&&(v=E(t,i?.core?.mimeType),y=`match forced by supplied MIME type ${i?.core?.mimeType}`),v||"source"!==o||(y=(v=x(t,m))?`matched source url ${m}`:"");let B="source"===o&&m?t.filter(e=>!(0,r.p)(e)):t;return v=v||(l=B,(d=(f=(u=m)&&_.exec(u))&&f[1])?function(e,t){for(let i of(t=t.toLowerCase(),e))for(let e of i.extensions)if(e.toLowerCase()===t)return i;return null}(l,d):null),y=y||(v?`matched url ${m}`:""),v||"parse"!==o||(y=(v=x(t,m))?`matched source url ${m}`:""),v=v||E(B,g),y=y||(v?`matched MIME type ${g}`:""),v=v||function(e,t){if(!t)return null;for(let i of e)if("string"==typeof t){if(function(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}(t,i))return i}else if(ArrayBuffer.isView(t)){if(S(t.buffer,t.byteOffset,i))return i}else if(t instanceof ArrayBuffer&&S(t,0,i))return i;return null}(B,e),y=y||(v?`matched initial data ${A(e)}`:""),!v&&(0,n.qf)(e)&&(v=function(e,t){for(let i of e)if((0,r.p)(i)&&i.testData?.(t))return i;return null}(t,e),y=y||(v?"matched source testData":"")),i?.core?.fallbackMimeType&&(v=v||E(B,i?.core?.fallbackMimeType),y=y||(v?`matched fallback MIME type ${g}`:"")),y&&a.Rm.log(1,`selectLoader selected ${v?.name}: ${y}.`),v}function v(e){return!(e instanceof Response)||204!==e.status}function y(e){let t=(0,c.Al)(e),i=(0,c.z4)(e),n="No valid loader found (";n+=(t?`${s.iW(t)}, `:"no url provided, ")+`MIME type: ${i?`"${i}"`:"not provided"}, `;let r=e?A(e):"";return n+((r?` first bytes: "${r}"`:"first bytes: not available")+")")}function w(e){for(let t of e)(0,u.D)(t)}function x(e,t){if(!t)return null;for(let i of e)if((0,r.p)(i)&&i.testURL(t))return i;return null}function E(e,t){for(let i of e)if(i.mimeTypes?.some(e=>(0,d.JQ)(t,e))||(0,d.JQ)(t,`application/x.${i.id}`))return i;return null}function S(e,t,i){return(Array.isArray(i.tests)?i.tests:[i.tests]).some(i=>(function(e,t,i){if((0,n.B1)(i))return(0,o.YV)(i,e,i.byteLength);switch(typeof i){case"function":return i((0,l.W$)(e));case"string":let r=B(e,t,i.length);return i===r;default:return!1}})(e,t,i))}function A(e,t=5){return"string"==typeof e?e.slice(0,t):ArrayBuffer.isView(e)?B(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?B(e,0,t):""}function B(e,t,i){if(e.byteLength<t+i)return"";let n=new DataView(e),r="";for(let e=0;e<i;e++)r+=String.fromCharCode(n.getUint8(t+e));return r}},41708(e,t,i){i.d(t,{f:()=>n});class n extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response}},76522(e,t,i){i.d(t,{t2:()=>a});var n=i(92537),r=i(41312);async function a(e,t){if("string"==typeof e){var i;let r=(0,n.o1)(e);return!((i=r).startsWith("http:")||i.startsWith("https:"))&&!r.startsWith("data:")&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(r,t):await fetch(r,t)}return await (0,r.wv)(e)}},1035(e,t,i){i.d(t,{Ct:()=>c,O1:()=>f,lG:()=>u,re:()=>d});var n=i(33631),r=i(20903),a=i(42080),s=i(37920),o=i(41312);let l="Cannot convert supplied data type";function u(e,t,i){if(t.text&&"string"==typeof e)return e;if((0,n.Pe)(e)&&(e=e.buffer),(0,r.B1)(e)){let i=(0,n.Q_)(e);return t.text&&!t.binary?new TextDecoder("utf8").decode(i):(0,n.XA)(i)}throw Error(l)}async function f(e,t,i){if("string"==typeof e||(0,r.B1)(e))return u(e,t,i);if((0,r.qf)(e)&&(e=await (0,o.wv)(e)),(0,r.Sv)(e))return await (0,o.Mz)(e),t.binary?await e.arrayBuffer():await e.text();if((0,r.H1)(e)&&(e=(0,s.l)(e,i)),(0,r.xZ)(e)||(0,r.Td)(e))return(0,a.cy)(e);throw Error(l)}async function c(e,t){if("string"==typeof e)return new TextEncoder().encode(e).buffer;if((0,r.B1)(e))return(0,n.XA)((0,n.Q_)(e));if((0,r.qf)(e)&&(e=await (0,o.wv)(e)),(0,r.Sv)(e))return await (0,o.Mz)(e),await e.arrayBuffer();if((0,r.H1)(e)&&(e=(0,s.l)(e,t)),(0,r.xZ)(e)||(0,r.Td)(e))return(0,a.cy)(e);throw Error(l)}async function d(e,t){if((0,r.yL)(e)&&(e=await e),(0,r.Vv)(e))return e;if((0,r.Sv)(e)){await (0,o.Mz)(e);let i=await e.body;if(!i)throw Error(l);return(0,s.l)(i,t)}return(0,r.qf)(e)||(0,r.H1)(e)?(0,s.l)(e,t):(0,r.Td)(e)||(0,r.xZ)(e)?e:function(e){if(ArrayBuffer.isView(e)||(0,r.B1)(e))return function*(){yield(0,n.XA)(e)}();if((0,r.Vv)(e))return e;if((0,r.xZ)(e))return e[Symbol.iterator]();throw Error(l)}(e)}},73968(e,t,i){i.d(t,{z:()=>o});var n=i(20903),r=i(42),a=i(76522),s=i(8480);function o(e,t){let i,o=(0,s.pp)(),l=e||o,u=l.fetch??l.core?.fetch;i="function"==typeof u?u:(0,n.Gv)(u)?t?.fetch||a.t2:t?.fetch?t.fetch:a.t2;let f=l.signal||t?.signal,c=(0,n.Gv)(u)?u:void 0;return(0,r.Wm)({fetch:i,credentials:l.core?.credentials||[],authentications:l.core?.authentications,fetchOptions:f?{...c,signal:f}:c})}},32429(e,t,i){i.d(t,{i:()=>l,l:()=>o});var n=i(73968),r=i(28071),a=i(58345),s=i(44681);function o(e,t,i){if(i)return{...i,signal:t.signal||i.signal,reportProgress:t.onProgress||i.reportProgress,coreApi:i.coreApi||e.coreApi||s.k,_parse:i._parse||e._parse,fetch:(0,n.z)(t,i)};let o={...e,signal:t.signal||e.signal,reportProgress:t.onProgress||e.reportProgress,fetch:(0,n.z)(t,e),coreApi:e.coreApi||s.k};if(o.url){let e=(0,r.S3)(o.url);o.baseUrl=e,o.queryString=(0,r.by)(o.url),o.filename=a.iW(e),o.baseUrl=a.pD(e)}return Array.isArray(o.loaders)||(o.loaders=null),o}function l(e,t){let i;if(e&&!Array.isArray(e))return e;if(e&&(i=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];i=i?[...i,...e]:e}return i&&i.length?i:void 0}},75583(e,t,i){function n(e){let t=Object.keys(e.options||{}).filter(t=>{let i=e.options?.[t];return"core"!==t&&i&&"object"==typeof i&&"shape"in i});return t.includes(e.id)?e.id:1===t.length?t[0]:void 0}function r(e,t,i=!1){let a=n(e),s=a&&t[a];if(!s||"object"!=typeof s||!("shape"in s)||"arrow"!==s.shape)return null;if(i&&t.core?.metadata)throw Error('shape: "arrow" does not support core.metadata; use "arrow-table" for batch metadata');return{...t,core:{...t.core,...t.core?.shape==="arrow"?{shape:"arrow-table"}:{}},[a]:{...s,shape:"arrow-table"}}}function a(e){if(e?.shape!=="arrow-table"||!e.data||!Array.isArray(e.data.batches))throw Error('shape: "arrow" requires a loader that supports "arrow-table" output');return e.data}async function*s(e){for await(let t of e){let e=t?.batchType;"metadata"!==e&&"partial-result"!==e&&"final-result"!==e&&(yield*a(t).batches)}}i.d(t,{B_:()=>a,FO:()=>r,Nw:()=>s,g3:()=>n})},90405(e,t,i){i.d(t,{D:()=>a,l:()=>r});var n=i(85638);function r(e){return!!e&&(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions))}function a(e){let t;return(0,n.v)(e,"null loader"),(0,n.v)(r(e),"invalid loader"),Array.isArray(e)&&(t=e[1],e={...e=e[0],options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}},8480(e,t,i){i.d(t,{a5:()=>m,Rf:()=>b,K2:()=>h,ih:()=>g,b3:()=>p,pp:()=>_});var n=i(13601),r=i(20903),a=i(18553),s=i(58345),o=i(40818);let l={searchParams:void 0,core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,shape:void 0,log:a.Rm,useLocalLibraries:!1,subloaders:void 0,CDN:"https://unpkg.com/@loaders.gl",worker:!0,workerThreshold:.1,workerInBatches:void 0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:o.Bd,_nodeWorkers:!1,_workerType:"",limit:0,_limitMB:0,batchSize:"auto",batchDebounceMs:0,metadata:!1,transforms:[]}},u={baseUri:"core.baseUrl",fetch:"core.fetch",mimeType:"core.mimeType",fallbackMimeType:"core.fallbackMimeType",ignoreRegisteredLoaders:"core.ignoreRegisteredLoaders",nothrow:"core.nothrow",log:"core.log",useLocalLibraries:"core.useLocalLibraries",CDN:"core.CDN",worker:"core.worker",maxConcurrency:"core.maxConcurrency",maxMobileConcurrency:"core.maxMobileConcurrency",reuseWorkers:"core.reuseWorkers",_nodeWorkers:"core.nodeWorkers",_workerType:"core._workerType",_worker:"core._workerType",limit:"core.limit",_limitMB:"core._limitMB",shape:"core.shape",batchSize:"core.batchSize",batchDebounceMs:"core.batchDebounceMs",metadata:"core.metadata",transforms:"core.transforms",throws:"nothrow",dataType:"(no longer used)",uri:"core.baseUrl",method:"core.fetch.method",headers:"core.fetch.headers",body:"core.fetch.body",mode:"core.fetch.mode",credentials:"core.fetch.credentials",cache:"core.fetch.cache",redirect:"core.fetch.redirect",referrer:"core.fetch.referrer",referrerPolicy:"core.fetch.referrerPolicy",integrity:"core.fetch.integrity",keepalive:"core.fetch.keepalive",signal:"core.fetch.signal"};var f=i(75583),c=i(28071);let d=["baseUrl","fetch","mimeType","fallbackMimeType","ignoreRegisteredLoaders","nothrow","log","useLocalLibraries","CDN","worker","workerThreshold","maxConcurrency","maxMobileConcurrency","reuseWorkers","workerTransferBufferCopy","_nodeWorkers","_workerType","limit","_limitMB","shape","batchSize","batchDebounceMs","metadata","transforms"];function p(e,t){let i=t?.searchParams;if(!i||0===Object.keys(i).length||/^(?:data|blob):/i.test(e))return e;let n=e.indexOf("#"),r=n>=0?e.slice(n):"",a=n>=0?e.slice(0,n):e,s=a.indexOf("?"),o=s>=0?a.slice(0,s):a,l=s>=0?a.slice(s+1):"",u=new URLSearchParams(l),f=new URLSearchParams;for(let[e,t]of Object.entries(i))u.has(e)||f.set(e,String(t));let c=f.toString();return`${o}${s>=0?`?${l}`:""}${c?`${s>=0?"&":"?"}${c}`:""}${r}`}function h(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||(e._state={}),e._state}function _(){let e=h();return e.globalOptions=e.globalOptions||{...l,core:{...l.core}},b(e.globalOptions)}function g(e){h().globalOptions=w(_(),e),(0,n.Qz)(e.modules)}function m(e,t,i,n){(function(e,t){for(let i of(y(e,null,l,u,t),t)){let n=e&&e[i.id]||{},r=i.options&&i.options[i.id]||{},a=i.deprecatedOptions&&i.deprecatedOptions[i.id]||{};y(n,i.id,r,a,t)}})(e,i=Array.isArray(i=i||[])?i:[i]),v(e);let r=b(w(t,e,n));return v(r),r}function b(e){var t;let i,n=(i={...t=e},t.core&&(i.core={...t.core}),i);for(let e of(E(n),d))n.core&&void 0!==n.core[e]&&delete n[e];return n.core&&void 0!==n.core._workerType&&delete n._worker,n}function v(e){let t=e.core?.workerThreshold;if(void 0!==t&&(!Number.isFinite(t)||t<0||t>1))throw Error("core.workerThreshold must be a finite number between 0 and 1")}function y(e,t,i,n,s){let o=t||"Top level",l=t?`${t}.`:"";for(let u in e){let f=!t&&(0,r.Gv)(e[u]),c=!t&&["baseUri","signal","onProgress"].includes(u),d="workerUrl"===u&&t;if(!(u in i)&&!c&&!d){if(u in n)a.Rm.level>0&&a.Rm.warn(`${o} loader option '${l}${u}' no longer supported, use '${n[u]}'`)();else if(!f&&a.Rm.level>0){let e=function(e,t){let i=e.toLowerCase(),n="";for(let r of t)for(let t in r.options){if(e===t)return`Did you mean '${r.id}.${t}'?`;let a=t.toLowerCase();(i.startsWith(a)||a.startsWith(i))&&(n=n||`Did you mean '${r.id}.${t}'?`)}return n}(u,s);a.Rm.warn(`${o} loader option '${l}${u}' not recognized. ${e}`)()}}}}function w(e,t,i){var n,o;let l=e.options||{},u={...l};l.core&&(u.core={...l.core}),E(u);let p=e.defaultShape&&(0,f.g3)(e);p&&(u[p]={...l[p],shape:e.defaultShape}),x(u,b(_()));let h=b(t);return x(u,h),function(e,t,i){let n=e.core?.shape;if(void 0===n)return;let a=(0,f.g3)(i);if(!a)return;let s=i.options?.[a];if(!(0,r.aC)(s)||!("shape"in s))return;let o=_()[a];if((0,r.aC)(o)&&"shape"in o)return;let l=t[a];if((0,r.aC)(l)&&"shape"in l)return;let u=e[a];e[a]={...(0,r.aC)(u)?u:{},shape:n}}(u,h,e),u.core?.log===null&&(u.core={...u.core,log:(0,a.Wd)(u)}),n=u,(o=i)&&n.core?.baseUrl===void 0&&(n.core||={},n.core.baseUrl=s.pD((0,c.S3)(o))),function(e){let t=e.core;if(t)for(let i of d)void 0!==t[i]&&(e[i]=t[i])}(u),u}function x(e,t){for(let i in t)if(i in t){let n=t[i];(0,r.aC)(n)&&(0,r.aC)(e[i])?e[i]={...e[i],...t[i]}:e[i]=t[i]}}function E(e){for(let t of(void 0!==e.baseUri&&(e.core||={},void 0===e.core.baseUrl&&(e.core.baseUrl=e.baseUri)),d))if(void 0!==e[t]){e.core||={};let i=e.core;void 0===i[t]&&(i[t]=e[t])}let t=e._worker;void 0!==t&&(e.core||={},void 0===e.core._workerType&&(e.core._workerType=t))}},42221(e,t,i){i.d(t,{JQ:()=>a,OA:()=>s,d_:()=>o});let n=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,r=/^([-\w.]+\/[-\w.+]+)/;function a(e,t){return e.toLowerCase()===t.toLowerCase()}function s(e){let t=r.exec(e);return t?t[1]:e}function o(e){let t=n.exec(e);return t?t[1]:""}},72548(e,t,i){i.d(t,{Al:()=>s,_E:()=>l,z4:()=>o});var n=i(20903),r=i(42221),a=i(28071);function s(e){return(0,n.Sv)(e)?e.url:(0,n.qf)(e)?("name"in e?e.name:"")||"":"string"==typeof e?e:""}function o(e){if((0,n.Sv)(e)){let t=e.headers.get("content-type")||"",i=(0,a.S3)(e.url);return(0,r.OA)(t)||(0,r.d_)(i)}return(0,n.qf)(e)?e.type||"":"string"==typeof e?(0,r.d_)(e):""}function l(e){return(0,n.Sv)(e)?e.headers["content-length"]||-1:(0,n.qf)(e)?e.size:"string"==typeof e?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}},41312(e,t,i){i.d(t,{Mz:()=>l,wv:()=>o});var n=i(20903),r=i(41708),a=i(72548),s=i(28071);async function o(e){if((0,n.Sv)(e))return e;let t={},i=(0,a._E)(e);i>=0&&(t["content-length"]=String(i));let r=(0,a.Al)(e),s=(0,a.z4)(e);s&&(t["content-type"]=s);let o=await f(e);o&&(t["x-first-bytes"]=o),"string"==typeof e&&(e=new TextEncoder().encode(e));let l=new Response(e,{headers:t});return Object.defineProperty(l,"url",{value:r}),l}async function l(e){if(!e.ok)throw await u(e)}async function u(e){let t=(0,s.E1)(e.url),i=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;i=i.length>100?`${i.slice(0,100)}...`:i;let n={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get("Content-Type");n.reason=!e.bodyUsed&&t?.includes("application/json")?await e.json():await e.text()}catch(e){}return new r.f(i,n)}async function f(e){if("string"==typeof e)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let i=new FileReader;i.onload=t=>e(t?.target?.result),i.readAsDataURL(t)})}if(e instanceof ArrayBuffer){let t=function(e){let t=new Uint8Array(e),i=[];for(let e=0;e<t.length;e+=12288)i.push(btoa(String.fromCharCode(...t.subarray(e,e+12288))));return i.join("")}(e.slice(0,5));return`data:base64,${t}`}return null}},28071(e,t,i){i.d(t,{E1:()=>s,S3:()=>a,by:()=>r});let n=/\?.*/;function r(e){let t=e.match(n);return t&&t[0]}function a(e){return e.replace(n,"")}function s(e){if(e.length<50)return e;let t=e.slice(e.length-15),i=e.substr(0,32);return`${i}...${t}`}},26358(e,t,i){function n(e,t,i){if(i=i||e.byteLength,e.byteLength<i||t.byteLength<i)return!1;let n=new Uint8Array(e),r=new Uint8Array(t);for(let e=0;e<n.length;++e)if(n[e]!==r[e])return!1;return!0}function r(...e){var t=e;let i=t.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),n=new Uint8Array(i.reduce((e,t)=>e+t.byteLength,0)),a=0;for(let e of i)n.set(e,a),a+=e.byteLength;return n.buffer}i.d(t,{AQ:()=>r,YV:()=>n})},33631(e,t,i){i.d(t,{XA:()=>a,Q_:()=>l,Pe:()=>r,W$:()=>s});var n=i(20903);function r(e){return e&&"object"==typeof e&&e.isBuffer}function a(e){if(r(e)||e instanceof ArrayBuffer)return e;if((0,n.L8)(e))return o(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return 0===e.byteOffset&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if("string"==typeof e)return new TextEncoder().encode(e).buffer;if(e&&"object"==typeof e&&e._toArrayBuffer)return e._toArrayBuffer();throw Error("toArrayBuffer")}function s(e){if(e instanceof ArrayBuffer)return e;if((0,n.L8)(e))return o(e);let{buffer:t,byteOffset:i,byteLength:r}=e;return t instanceof ArrayBuffer&&0===i&&r===t.byteLength?t:o(t,i,r)}function o(e,t=0,i=e.byteLength-t){let n=new Uint8Array(e,t,i),r=new Uint8Array(n.length);return r.set(n),r.buffer}function l(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}},85638(e,t,i){i.d(t,{v:()=>n});function n(e,t){if(!e)throw Error(t||"loader assertion failed.")}},40818(e,t,i){i.d(t,{Al:()=>o,Bd:()=>l,Sf:()=>s,bg:()=>r,x:()=>a,xD:()=>u});let n={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document},r=n.self||n.window||n.global||{},a=n.window||n.self||n.global||{},s=n.global||n.self||n.window||{},o=n.document||{},l=!!("object"!=typeof process||"[object process]"!==String(process)||process.browser),u="function"==typeof importScripts,f="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);f&&parseFloat(f[1])},42080(e,t,i){i.d(t,{Pb:()=>s,cy:()=>a,jJ:()=>r});var n=i(26358);async function r(e,t){var i,n;let r="function"==typeof(i=e)[Symbol.asyncIterator]?i[Symbol.asyncIterator]():"function"==typeof i[Symbol.iterator]?(n=i[Symbol.iterator](),{next:e=>Promise.resolve(n.next(e)),return:e=>"function"==typeof n.return?Promise.resolve(n.return(e)):Promise.resolve({done:!0,value:e}),throw:e=>"function"==typeof n.throw?Promise.resolve(n.throw(e)):Promise.reject(e)}):i;for(;;){let{done:e,value:i}=await r.next();if(e){r.return&&r.return();return}if(t(i))return}}async function a(e){let t=[];for await(let i of e)t.push(o(i));return(0,n.AQ)(...t)}async function*s(e){for await(let t of e)yield o(t)}function o(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:i,byteLength:n}=e;return l(t,i,n)}return l(e)}function l(e,t=0,i=e.byteLength-t){let n=new Uint8Array(e,t,i),r=new Uint8Array(n.length);return r.set(n),r.buffer}},20903(e,t,i){i.d(t,{B1:()=>s,Gv:()=>n,H1:()=>p,L8:()=>a,PJ:()=>h,Sv:()=>c,Td:()=>u,Vv:()=>f,aC:()=>r,qf:()=>d,xZ:()=>l,yL:()=>o});let n=e=>null!==e&&"object"==typeof e,r=e=>n(e)&&e.constructor===({}).constructor,a=e=>"u">typeof SharedArrayBuffer&&e instanceof SharedArrayBuffer,s=e=>n(e)&&"number"==typeof e.byteLength&&"function"==typeof e.slice,o=e=>n(e)&&"then"in e&&"function"==typeof e.then,l=e=>!!e&&"function"==typeof e[Symbol.iterator],u=e=>!!e&&"function"==typeof e[Symbol.asyncIterator],f=e=>!!e&&"function"==typeof e.next,c=e=>"u">typeof Response&&e instanceof Response||n(e)&&"function"==typeof e.arrayBuffer&&"function"==typeof e.text&&"function"==typeof e.json,d=e=>"u">typeof Blob&&e instanceof Blob,p=e=>{let t,i;return t=e,"u">typeof ReadableStream&&t instanceof ReadableStream||n(t)&&"function"==typeof t.tee&&"function"==typeof t.cancel&&"function"==typeof t.getReader||n(i=e)&&"function"==typeof i.read&&"function"==typeof i.pipe&&"boolean"==typeof i.readable},h=e=>{let t,i;return n(t=e)&&"function"==typeof t.abort&&"function"==typeof t.getWriter||n(i=e)&&"function"==typeof i.end&&"function"==typeof i.write&&"boolean"==typeof i.writable}},18553(e,t,i){let n;i.d(t,{Rm:()=>o,Wd:()=>c,sq:()=>l});var r=i(6431);let a="5.0.0-beta.8",s=a[0]>="0"&&a[0]<="9"?`v${a}`:"",o=(n=new r.tG({id:"loaders.gl"}),globalThis.loaders||={},globalThis.loaders.log=n,globalThis.loaders.version=s,globalThis.probe||={},globalThis.probe.loaders=n,n);class l{log(){return u}info(){return u}once(){return u}warn(){return u}error(){return u}}function u(){}let f=new l;function c(e){let t=e?.core?.log!==void 0?e.core.log:e?.log;return null===t?f:t||o}},13601(e,t,i){i.d(t,{Qz:()=>n});function n(e){globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,e)}},51925(e,t,i){i.d(t,{l:()=>r});var n=i(20903);function r(e,t){return function e(t,i,r=0){if(r>3)return i;let a={...t};for(let[t,s]of Object.entries(i))(0,n.aC)(s)?a[t]=e(a[t]||{},i[t],r+1):a[t]=i[t];return a}(e||{},t)}},92537(e,t,i){i.d(t,{Qj:()=>a,o1:()=>o,yc:()=>s});let n="",r={};function a(e){n=e}function s(){return n}function o(e){for(let t in r)if(e.startsWith(t)){let i=r[t];e=e.replace(t,i)}return e.startsWith("http://")||e.startsWith("https://")||(e=`${n}${e}`),e}},58345(e,t,i){function n(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(t+1):e}function r(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(0,t):""}i.d(t,{iW:()=>n,pD:()=>r})},66290(e,t,i){function n(e,t=[]){return e.every(s)?e:e.map((e,i)=>{let n;if(s(e))return e;let r=t.find(t=>t.type===e?.type);if(!r)throw Error(`No authentication class registered for credential at index ${i}.`);try{n=new r(e)}catch{throw Error(`Invalid authentication configuration at index ${i}.`)}if(!s(n))throw Error(`Authentication class returned an invalid credential at index ${i}.`);return n})}function r(e){if(!e.core?.credentials?.length)return e;let t=n(e.core.credentials,e.core.authentications);return t===e.core.credentials?e:{...e,core:{...e.core,credentials:t}}}async function a(e,t,i){if(!i.core?.credentials?.length||i.core.credentials.every(s))return i;let n=await e?.getAuthentications?.(t,i);return n?.length?r({...i,core:{...i.core,authentications:[...i.core?.authentications||[],...n]}}):r(i)}function s(e){return!!e&&"object"==typeof e&&"string"==typeof e.id&&!!Array.isArray(e.origins)&&("request"===e.type?"function"==typeof e.authenticate:("header"===e.type||"query-parameter"===e.type)&&"string"==typeof e.name&&("string"==typeof e.token||"function"==typeof e.token)&&Array.isArray(e.refreshStatusCodes))}i.d(t,{Bv:()=>r,M8:()=>a,z8:()=>n})},42(e,t,i){i.d(t,{Kt:()=>o,Wm:()=>s});var n=i(66290);let r=Symbol("loaders.gl.authenticated-fetch"),a=new WeakMap;function s(e){let t=e.fetch||((e,t)=>fetch(e,t)),i=t[r],a=new Map(i?.credentialResolutions),s=(0,n.z8)(e.credentials.map(e=>a.get(e)||e),e.authentications);if(e.credentials.forEach((e,t)=>{a.set(e,s[t])}),!e.fetchOptions&&(!s.length||i?.credentials.length===s.length&&s.every((e,t)=>e===i.credentials[t])))return t;let o=i?.fetch||t,f=i?[...new Set([...s,...i.credentials])]:s,h=l(i?.fetchOptions||{},e.fetchOptions),g=f.filter(e=>"request"!==e.type),m=f.filter(e=>"request"===e.type);for(let e of m)c(e.origins);let b=async(e,t={})=>{if(t=l(h,t),t.signal?.throwIfAborted(),!f.length)return o(e,t);let i=function(e){try{let t=new URL(e);return["http:","https:"].includes(t.protocol)?t:null}catch{return null}}(e),n=i?await d(i,t,g):{url:e,options:t,credentials:[]},r=await u(n,m,"request"),a=await o(r.url,r.options),s=[];for(let i of n.credentials){let{credential:n}=i;"function"==typeof n.token&&(_(t)||n.canReplayRequest?.(e,t))&&(_(r.options)||n.canReplayRequest?.(r.url,r.options))&&(n.refreshStatusCodes.includes(a.status)||await n.shouldRefresh?.(a))&&s.push(i)}let c=_(t)&&_(r.options)&&r.credentials.some(e=>e.refreshStatusCodes?.includes(a.status));if(!s.length&&!c)return a;t.signal?.throwIfAborted();let b=new Map;if(await Promise.all(s.map(async({credential:t})=>{let i=await p(t,e,a);i&&b.set(t,i)})),!b.size&&!c)return a;await a.body?.cancel().catch(()=>{}),t.signal?.throwIfAborted();let v=i?await d(i,t,g,b,n.credentials):{url:e,options:t},y=await u(v,m,"retry",a);return o(y.url,y.options)};return Object.defineProperty(b,r,{value:{fetch:o,credentials:f,credentialResolutions:a,fetchOptions:h}}),b}function o(e={}){let t,i=e.fetch??e.core?.fetch;t="function"==typeof i?i:(e,t)=>fetch(e,t);let n="object"==typeof i&&i?i:void 0;return s({fetch:t,fetchOptions:e.signal?{...n,signal:e.signal}:n,credentials:e.core?.credentials||[],authentications:e.core?.authentications})}function l(e,t){let i={...e,...t};if(e.headers||t?.headers){let n=new Headers(e.headers);new Headers(t?.headers).forEach((e,t)=>n.set(t,e)),i.headers=n}return i}async function u(e,t,i,n){let r=[],a=e.options.signal;for(let s of t){let t=f(e.url);if(!t||!c(s.origins).includes(t))continue;a?.throwIfAborted();let o=await s.authenticate({url:e.url,options:{...e.options,headers:new Headers(e.options.headers)},reason:i,response:n?{status:n.status,headers:new Headers(n.headers)}:void 0});if(!o||"string"!=typeof o.url||!o.options||"object"!=typeof o.options)throw Error("Authentication callback returned an invalid request.");e={url:o.url,options:{...o.options,...a?{signal:a}:{}}},r.push(s)}return a?.throwIfAborted(),{...e,credentials:r}}function f(e){try{let t=new URL(e);if(!t.host||t.username||t.password)return null;return"null"!==t.origin?t.origin:`${t.protocol}//${t.host}`}catch{return null}}function c(e){if(!e.length)throw Error("Request authentication requires at least one exact origin.");return e.map(e=>{let t,i=f(e);try{t=new URL(e)}catch{throw Error("Invalid request authentication origin.")}if(!i||t.pathname&&"/"!==t.pathname||t.search||t.hash)throw Error("Invalid request authentication origin.");return i})}async function d(e,t,i,n=new Map,r=[]){let a=new URL(e),s=new Headers(t.headers),o=[],l=new Map(r.map(({credential:e,token:t})=>[e,t]));for(let t of i){if(!t.origins.includes(a.origin))continue;let i=n.get(t),r=l.get(t),u="query-parameter"===t.type&&void 0!==r,f="header"===t.type&&void 0!==r;if("query-parameter"===t.type&&a.searchParams.has(t.name)&&!u||"header"===t.type&&s.has(t.name)&&!f)continue;let c=i??r??await h(t.token,{url:e.toString(),reason:"request"});c&&("query-parameter"===t.type?a.searchParams.set(t.name,c):s.set(t.name,`${t.prefix||""}${c}`),o.push({credential:t,token:c}))}return{url:a.toString(),options:{...t,headers:s},credentials:o}}async function p(e,t,i){let n=a.get(e);if(n)return n;let r=Promise.resolve((0,e.token)({url:t,reason:"refresh",response:{status:i.status,headers:i.headers}})).finally(()=>a.delete(e));return a.set(e,r),r}async function h(e,t){return"function"==typeof e?e(t):e}function _(e){return!!["GET","HEAD","OPTIONS","PUT","DELETE"].includes((e.method||"GET").toUpperCase())&&!(e.body&&"u">typeof ReadableStream&&e.body instanceof ReadableStream)}},86964(e,t,i){i.d(t,{FR:()=>f,L6:()=>l,ZT:()=>o,gm:()=>u,sA:()=>s});var n=i(18553),r=i(73891),a=i(18782);function s(e,t){var i;let n=t?.[e.id]?.workerUrl;if(t?.core?.worker===!1||!(e.worker||e.loadWorker||n)||t?.core?.credentials?.some(e=>"request"===e.type||"token"in e&&"function"==typeof e.token)||"shapefile"===e.id&&("function"==typeof t?.fetch||"function"==typeof t?.core?.fetch))return!1;let s=h(t),o=s._nodeWorkers;return(!!r.Bd||!!o)&&("csv"!==e.id||(i=t,(i?.csv?.shape??i?.core?.shape)==="arrow-table"))&&!!(0,a.$r)(e,s)}function o(e,t){let i=t?.parquet;return("parquet"!==e.id||"function"!=typeof i?.keyRetriever)&&!!(e.workerInBatches&&s(e,t)&&(0,a.Ec)(e,h(t)))}function l(e,t,i,n,r=e){if(!s(e,i))return!1;if(i?.core?.worker!=="auto"||!r.getWorkerEstimate)return!0;try{let e=r.getWorkerEstimate(t,i,n);if(void 0===e||!Number.isFinite(e)||e<0||e>1)return!0;return e>=(i.core?.workerThreshold??.1)}catch{return!0}}async function u(e,t,i,n,r,s){let o=s||c(i)||n?.signal,l=await (0,a.dS)(e,t,{...h(i,e),signal:o,onProgress:i?.onProgress||n?.reportProgress},{process:async(t,a,s,o)=>{if(!r)throw Error("Worker not set up to parse on main thread");let{_loaderIds:l,_loaderIsArray:u,...f}=o||{},c=n||o||s?.signal?{...n,...f,signal:s?.signal??n?.signal}:void 0;return await d(r,t,a,c,p(e,l,u,n,i))}},_(n));return"function"==typeof e.deserializeWorkerResult?e.deserializeWorkerResult(l,i,n):l}async function*f(e,t,i,n,r,s){let o=s||c(i)||n?.signal;for await(let s of(0,a.AO)(e,t,{...h(i,e),signal:o,onProgress:i?.onProgress||n?.reportProgress},{process:async(t,a,s,o)=>{if(!r)throw Error("Worker not set up to parse on main thread");let{_loaderIds:l,_loaderIsArray:u,...f}=o||{},c=n||o||s?.signal?{...n,...f,signal:s?.signal??n?.signal}:void 0;return await d(r,t,a,c,p(e,l,u,n,i))}},_(n)))yield e.deserializeWorkerBatch?e.deserializeWorkerBatch(s,i,n):s}function c(e){if(e?.signal)return e.signal;let t=e?.parquet?.signal;if("u">typeof AbortSignal&&t instanceof AbortSignal)return t}function d(e,t,i,n,r){return!r&&e.length<=2?e(t,i):e(t,r,i,n)}function p(e,t,i,n,r){if(!t)return;let a=new Map,s=new Set;for(let t of[e,...n?.loaders||[]])!function e(t){if(!s.has(t))for(let[i,n]of(s.add(t),a.set(t.id,t),Object.entries(t.subloaders||{}))){let t=r?.core?.subloaders?.[i]||n;e(t),a.set(n.id,t)}}(t);let o=t.map(e=>{let t=a.get(e);if(!t)throw Error(`Worker requested unknown loader "${e}". Declare it in loader.subloaders or pass it in context.loaders.`);return t});return i?o:o[0]}function h(e={},t){let i=t?.serializeWorkerOptions?.(e)||e,n={...i,signal:void 0,onProgress:void 0,log:g(i.log)?null:void 0,...i.core?{core:{...i.core,authentications:void 0,log:g(i.core.log)?null:void 0}}:{}},r=JSON.parse(JSON.stringify(n,(e,t)=>"u">typeof Headers&&t instanceof Headers?Object.fromEntries(t.entries()):"u">typeof AbortSignal&&t instanceof AbortSignal?void 0:"bigint"==typeof t?null:t));!function e(t,i){if(i&&"object"==typeof i)for(let n of Object.keys(i)){let r=t?.[n];"bigint"==typeof r?i[n]=r:e(r,i[n])}}(n,r);let a={...r.core,...r};return"auto"===a.worker&&(a.worker=!0),t&&(a._workerLoaderId=t.id),a}function _(e){if(!e)return{};let{fetch:t,loaders:i,coreApi:n,signal:r,reportProgress:a,_parse:s,_parseSync:o,_parseInBatches:l,...u}=e;return JSON.parse(JSON.stringify(u))}function g(e){return null===e||e instanceof n.sq}},5969(e,t,i){i.d(t,{p:()=>n});function n(e){return!!(e&&"object"==typeof e&&"createDataSourceSync"in e&&"fromUrl"in e&&"testURL"in e)}},25389(e,t,i){i.d(t,{v:()=>n});function n(e,t){if(!e)throw Error(t||"loaders.gl assertion failed.")}},73891(e,t,i){i.d(t,{Bd:()=>r,Fr:()=>a});let n={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};n.self||n.window||n.global,n.window||n.self||n.global,n.global||n.self||n.window,n.document;let r="object"!=typeof process||"[object process]"!==String(process)||process.browser,a="u">typeof window&&void 0!==window.orientation,s="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);s&&parseFloat(s[1])},18782(e,t,i){i.d(t,{dS:()=>g,$r:()=>h,Ec:()=>_,AO:()=>m});var n=i(30331),r=i(18553),a=i(25389),s=i(73891);let o=new Set;function l(e,t={}){let i=s.Bd?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,n=u(e,t),r=t._workerType||t?.core?._workerType;if(!n&&"test"===r)if(s.Bd)n=`modules/${e.module}/dist/${i}`;else{let t="core"===e.module&&e.workerNode?.startsWith("worker-utils/")?"worker-utils/workers":"workers",i=e.workerSourceNode||`${t}/${e.id}-worker-node.ts`;n=`modules/${e.module}/src/${i}`}return n||null}function u(e,t={}){return(t[e.id]||{}).workerUrl||("compression"===e.id?t.workerUrl:null)||null}function f(e){return!!e&&!!(e instanceof ArrayBuffer||"u">typeof MessagePort&&e instanceof MessagePort||"u">typeof ImageBitmap&&e instanceof ImageBitmap||"u">typeof OffscreenCanvas&&e instanceof OffscreenCanvas)}let c=new WeakMap,d=new Set,p=new Map;function h(e,t={}){return!!((s.Bd?"u">typeof Worker:!!t._nodeWorkers)&&t.worker&&(e.worker||e.loadWorker||u(e,t)))}function _(e,t={}){return!!h(e,t)&&(void 0!==t.workerInBatches?t.workerInBatches:!!(e.workerInBatches&&!u(e,t)))}async function g(e,t,i={},n={},r={}){let a=await y(e,i,n,r);try{return(await a.handle.runTask({value:t},{...b(i),options:v(i)})).value}finally{await a.close()}}async function*m(e,t,i={},n={},r={}){var a;let s,o,l,u=(s=Symbol.asyncIterator in(a=t)?a[Symbol.asyncIterator]():a[Symbol.iterator](),o=!1,{[Symbol.asyncIterator](){return this},async next(){if(o)return{done:!0,value:void 0};let e=await s.next();return e.done||o?(o=!0,{done:!0,value:void 0}):{done:!1,value:{value:e.value}}},return:async()=>(o||(o=!0,await s.return?.()),{done:!0,value:void 0})});try{for await(let t of(l=await y(e,i,n,r)).handle.runTaskInBatches(u,{...b(i),options:v(i)}))yield t.value}finally{let e=u.return?.();e?.catch(()=>{}),await l?.close()}}function b(e){return{execution:"worker",signal:e.signal,inputOwnership:e.inputOwnership??"transfer",outputOwnership:e.outputOwnership??"transfer",onProgress:e.onProgress?t=>e.onProgress?.({...t,phase:t.phase??"process",unit:t.unit??"items"}):void 0}}function v(e){let{signal:t,onProgress:i,...n}=e;return function e(t){if(null===t)return{};let i=Object.assign({},t);return Object.keys(i).forEach(n=>{null===t[n]||"object"!=typeof t[n]||ArrayBuffer.isView(t[n])||t[n]instanceof Array?"function"==typeof i[n]||i[n]instanceof RegExp?i[n]={}:i[n]=t[n]:i[n]=e(t[n])}),i}(n)}async function y(e,t,i,u){let h;t.signal?.throwIfAborted();let _=function(e,t){if(t.source||t.core?.source)throw Error("Inline legacy worker source is unsupported; use a TaskRunner worker URL or factory");let i=!l(e,t)&&s.Bd?e.loadWorker:void 0,n=function(e,t={}){let i=l(e,t),n="string"==typeof e.worker?e.worker:null,u=i||n||function(e,t=!1){let i=s.Bd?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,n=e.version;"latest"===n&&(n="beta");let a=n?`@${n}`:"",l=`https://unpkg.com/@loaders.gl/${e.module}${a}/dist/${i}`;return t&&function(e,t){if("latest"!==e.version)return;let i=`${e.module}:${e.id}`;o.has(i)||(o.add(i),r.Rm.warn(`loaders.gl: ${e.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${t} from CDN.`)())}(e,l),l}(e,!0);return(0,a.v)(u),u}(e,t);return{id:`${e.module}:${e.id}`,initialize:e=>e,worker:{...i?{create:()=>i()??function(e){let t=new URL(e,globalThis.document?.baseURI??globalThis.location.href),i=t.href;if(/^https?:$/.test(t.protocol)&&t.origin!==globalThis.location.origin){let e=p.get(t.href);e||(e=URL.createObjectURL(new Blob([`import ${JSON.stringify(t.href)};`],{type:"application/javascript"})),p.set(t.href,e)),i=e}return new Worker(i,{type:"module"})}(n)}:{url:n},capabilities:{atomic:!0,streaming:!0}}}}(e,t),g=c.get(e);g||(g={runner:new n.u({maxConcurrency:s.Fr?t.maxMobileConcurrency??1:t.maxConcurrency??3}),requests:0},c.set(e,g));let m=g,v=i.process?new MessageChannel:void 0,y=new AbortController,w=!1,x=()=>y.abort(t.signal?.reason);t.signal?.addEventListener("abort",x,{once:!0});let E=()=>{w=!0,t.signal?.removeEventListener("abort",x),y.abort(),v?.port1.close(),v?.port2.close()};v&&(v.port1.onmessage=async({data:e})=>{try{let t=await i.process(e.input,e.options,{signal:y.signal,throwIfAborted:()=>y.signal.throwIfAborted()},e.context);w||y.signal.aborted||v.port1.postMessage({identifier:e.identifier,value:t},function e(t,i=!0,n){let r=n||new Set;if(t){if(f(t))r.add(t);else if(f(t.buffer))r.add(t.buffer);else if(ArrayBuffer.isView(t));else if(i&&"object"==typeof t)for(let n in t)e(t[n],i,r)}return void 0===n?Array.from(r):[]}(t))}catch(t){if(w||y.signal.aborted)return;v.port1.postMessage({identifier:e.identifier,error:{name:t instanceof Error?t.name:"Error",message:t instanceof Error?t.message:String(t)}})}},v.port1.start()),m.requests++,d.add(m);let S=!1,A=()=>{!S&&(S=!0,m.requests--,m.requests||d.delete(m))};try{h=await m.runner.initializeTask(_,{context:structuredClone(u),...v?{port:v.port2}:{}},{...b(t),inputOwnership:"transfer"})}catch(e){throw A(),E(),e}return{handle:h,async close(){try{await h.close()}finally{E(),A()}}}}},27912(e,t,i){let n;i.d(t,{z:()=>s});var r=i(25389);let a=(n="5.0.0-beta.8",globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version||=n,n);function s(e,t=a){(0,r.v)(e,"no worker provided");let i=e.version;return!!t&&!!i}},67052(e,t,i){i.d(t,{$:()=>a});var n=i(19205);async function r(){let{ImageLoaderWithParser:e}=await i.e("8261").then(i.bind(i,51124));return e}let a={dataType:null,batchType:null,id:"image",module:"images",name:"Images",encoding:"image",format:"image",mimeTypes:["image/png","image/jpeg","image/gif","image/webp","image/avif","image/bmp","image/vnd.microsoft.icon","image/svg+xml"],extensions:["png","jpg","jpeg","gif","webp","bmp","ico","svg","avif"],tests:[e=>!!(0,n.m)(new DataView(e))],id:"imagebitmap",name:"ImageBitmap",format:"image-bitmap",version:"5.0.0-beta.8",options:{image:{}},preload:r}},19205(e,t,i){function n(e){var t,i;let n,a,s,o,l=r(e);return((n=r(l)).byteLength>=33&&0x89504e47===n.getUint32(0,!1)&&0xd0a1a0a===n.getUint32(4,!1)&&13===n.getUint32(8,!1)&&0x49484452===n.getUint32(12,!1)?{mimeType:"image/png",width:n.getUint32(16,!1),height:n.getUint32(20,!1)}:null)||function(e){let t=r(e);if(!(t.byteLength>=3&&65496===t.getUint16(0,!1)&&255===t.getUint8(2)))return null;let{tableMarkers:i,sofMarkers:n}=function(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}(),a=2;for(;a+9<t.byteLength;){let e=t.getUint16(a,!1);if(n.has(e))return{mimeType:"image/jpeg",height:t.getUint16(a+5,!1),width:t.getUint16(a+7,!1)};if(!i.has(e))break;a+=2,a+=t.getUint16(a,!1)}return null}(l)||((a=r(l)).byteLength>=10&&0x47494638===a.getUint32(0,!1)?{mimeType:"image/gif",width:a.getUint16(6,!0),height:a.getUint16(8,!0)}:null)||((s=r(l)).byteLength>=14&&16973===s.getUint16(0,!1)&&s.getUint32(2,!0)===s.byteLength?{mimeType:"image/bmp",width:s.getUint32(18,!0),height:s.getUint32(22,!0)}:null)||((o=!function(e,t,i=0){let n=[...t].map(e=>e.charCodeAt(0));for(let t=0;t<n.length;++t)if(n[t]!==e[t+i])return!1;return!0}(i=new Uint8Array((t=l)instanceof DataView?t.buffer:t),"ftyp",4)||(96&i[8])==0?null:function(e){switch(String.fromCharCode(...e.slice(8,12)).replace("\0"," ").trim()){case"avif":case"avis":return{extension:"avif",mimeType:"image/avif"};default:return null}}(i))?{mimeType:o.mimeType,width:0,height:0}:null)}function r(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error("toDataView")}i.d(t,{m:()=>n})},34353(e,t,i){function n(e,t=!0){return e??t}function r(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}function a(e,t=!0){let i=r(e.slice(0,3),t),n=Number.isFinite(e[3]),s=n?e[3]:1;return[i[0],i[1],i[2],t&&n?s/255:s]}i.d(t,{eS:()=>n,jI:()=>a,sC:()=>r})},63702(e,t,i){i.d(t,{Wk:()=>a});let n=`\
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`,r=`#version 300 es
${n}`;function a(e){let{input:t,inputChannels:i,output:n}=e||{};if(!t)return r;if(!i)throw Error("inputChannels");let a=function(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`invalid channels: ${e}`)}}(i),s=function(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}(t,i);return`\
#version 300 es
in ${a} ${t};
out vec4 ${n};
void main() {
  ${n} = ${s};
}`}},94256(e,t,i){i.d(t,{q:()=>r});var n=i(34353);let r={props:{},uniforms:{},name:"picking",uniformTypes:{isActive:"f32",isAttribute:"f32",isHighlightActive:"f32",useByteColors:"f32",highlightedObjectColor:"vec3<f32>",highlightColor:"vec4<f32>"},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`\
layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

out vec4 picking_vRGBcolor_Avalid;

// Normalize unsigned byte color to 0-1 range
vec3 picking_normalizeColor(vec3 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

// Normalize unsigned byte color to 0-1 range
vec4 picking_normalizeColor(vec4 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

bool picking_isColorZero(vec3 color) {
  return dot(color, vec3(1.0)) < 0.00001;
}

bool picking_isColorValid(vec3 color) {
  return dot(color, vec3(1.0)) > 0.00001;
}

// Check if this vertex is highlighted 
bool isVertexHighlighted(vec3 vertexColor) {
  vec3 highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
  return
    bool(picking.isHighlightActive) && picking_isColorZero(abs(vertexColor - highlightedObjectColor));
}

// Set the current picking color
void picking_setPickingColor(vec3 pickingColor) {
  pickingColor = picking_normalizeColor(pickingColor);

  if (bool(picking.isActive)) {
    // Use alpha as the validity flag. If pickingColor is [0, 0, 0] fragment is non-pickable
    picking_vRGBcolor_Avalid.a = float(picking_isColorValid(pickingColor));

    if (!bool(picking.isAttribute)) {
      // Stores the picking color so that the fragment shader can render it during picking
      picking_vRGBcolor_Avalid.rgb = pickingColor;
    }
  } else {
    // Do the comparison with selected item color in vertex shader as it should mean fewer compares
    picking_vRGBcolor_Avalid.a = float(isVertexHighlighted(pickingColor));
  }
}

void picking_setPickingAttribute(float value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.r = value;
  }
}

void picking_setPickingAttribute(vec2 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rg = value;
  }
}

void picking_setPickingAttribute(vec3 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rgb = value;
  }
}
`,fs:`\
layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

in vec4 picking_vRGBcolor_Avalid;

/*
 * Returns highlight color if this item is selected.
 */
vec4 picking_filterHighlightColor(vec4 color) {
  // If we are still picking, we don't highlight
  if (picking.isActive > 0.5) {
    return color;
  }

  bool selected = bool(picking_vRGBcolor_Avalid.a);

  if (selected) {
    // Blend in highlight color based on its alpha value
    float highLightAlpha = picking.highlightColor.a;
    float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
    float highLightRatio = highLightAlpha / blendedAlpha;

    vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
    return vec4(blendedRGB, blendedAlpha);
  } else {
    return color;
  }
}

/*
 * Returns picking color if picking enabled else unmodified argument.
 */
vec4 picking_filterPickingColor(vec4 color) {
  if (bool(picking.isActive)) {
    if (picking_vRGBcolor_Avalid.a == 0.0) {
      discard;
    }
    return picking_vRGBcolor_Avalid;
  }
  return color;
}

/*
 * Returns picking color if picking is enabled if not
 * highlight color if this item is selected, otherwise unmodified argument.
 */
vec4 picking_filterColor(vec4 color) {
  vec4 highlightColor = picking_filterHighlightColor(color);
  return picking_filterPickingColor(highlightColor);
}
`,getUniforms:function(e={},t){let i={},r=(0,n.eS)(e.useByteColors,!0);return void 0===e.highlightedObjectColor||(null===e.highlightedObjectColor?i.isHighlightActive=!1:(i.isHighlightActive=!0,i.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(i.highlightColor=(0,n.jI)(e.highlightColor,r)),void 0!==e.isActive&&(i.isActive=!!e.isActive,i.isAttribute=!!e.isAttribute),void 0!==e.useByteColors&&(i.useByteColors=!!e.useByteColors),i}}},23331(e,t,i){i.d(t,{X:()=>o,U:()=>l}),globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}},globalThis.mathgl.config;let n=null,r=new ArrayBuffer(4),a=new Float32Array(r),s=new Uint32Array(r);function o(e){n||=u(),e=function(e,t,i){if(Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)){i=i||(e.clone?e.clone():Array(e.length));for(let n=0;n<i.length&&n<e.length;++n){let r="number"==typeof e?e:e[n];i[n]=t(r,n,i)}return i}return t(e)}(e,e=>Math.max(-65504,Math.min(65504,e))),a[0]=e;let t=s[0],i=t>>23&511;return n.baseTable[i]+((8388607&t)>>n.shiftTable[i])}function l(e){n||=u();let t=e>>10;return s[0]=n.mantissaTable[n.offsetTable[t]+(1023&e)]+n.exponentTable[t],a[0]}function u(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let i=0;i<256;++i){let n=i-127;n<-27?(e[i]=0,e[256|i]=32768,t[i]=24,t[256|i]=24):n<-14?(e[i]=1024>>-n-14,e[256|i]=1024>>-n-14|32768,t[i]=-n-1,t[256|i]=-n-1):n<=15?(e[i]=n+15<<10,e[256|i]=n+15<<10|32768,t[i]=13,t[256|i]=13):n<128?(e[i]=31744,e[256|i]=64512,t[i]=24,t[256|i]=24):(e[i]=31744,e[256|i]=64512,t[i]=13,t[256|i]=13)}let i=new Uint32Array(2048),n=new Uint32Array(64),r=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,n=0;for(;(8388608&t)==0;)t<<=1,n-=8388608;t&=-8388609,n+=0x38800000,i[e]=t|n}for(let e=1024;e<2048;++e)i[e]=0x38000000+(e-1024<<13);for(let e=1;e<31;++e)n[e]=e<<23;n[31]=0x47800000,n[32]=0x80000000;for(let e=33;e<63;++e)n[e]=0x80000000+(e-32<<23);n[63]=0xc7800000;for(let e=1;e<64;++e)32!==e&&(r[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:i,exponentTable:n,offsetTable:r}}},5652(e,t,i){i.d(t,{i:()=>n});let n={name:"fp32",source:`\
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const FP32_TWO_PI: f32 = 6.2831854820251465;
const FP32_PI_2: f32 = 1.5707963705062866;
const FP32_PI_16: f32 = 0.1963495463132858;

const FP32_SIN_TABLE_0: f32 = 0.19509032368659973;
const FP32_SIN_TABLE_1: f32 = 0.3826834261417389;
const FP32_SIN_TABLE_2: f32 = 0.5555702447891235;
const FP32_SIN_TABLE_3: f32 = 0.7071067690849304;

const FP32_COS_TABLE_0: f32 = 0.9807852506637573;
const FP32_COS_TABLE_1: f32 = 0.9238795042037964;
const FP32_COS_TABLE_2: f32 = 0.8314695954322815;
const FP32_COS_TABLE_3: f32 = 0.7071067690849304;

const FP32_INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const FP32_INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const FP32_INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const FP32_INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;
const FP32_OVERFLOW: f32 = 3.402823466e+38;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var sum = a;
  var term = a;

  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_3;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_5;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_7;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_9;

  return sum;
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / FP32_TWO_PI);
  let reduced = a - FP32_TWO_PI * z;

  var quadrantValue = floor(reduced / FP32_PI_2 + 0.5);
  let quadrant = i32(quadrantValue);
  if (quadrant < -2 || quadrant > 2) {
    return FP32_OVERFLOW;
  }

  var angle = reduced - FP32_PI_2 * quadrantValue;
  quadrantValue = floor(angle / FP32_PI_16 + 0.5);
  let tableIndex = i32(quadrantValue);
  let absoluteTableIndex = abs(tableIndex);
  if (absoluteTableIndex > 4) {
    return FP32_OVERFLOW;
  }

  angle = angle - FP32_PI_16 * quadrantValue;
  let sinAngle = sin_taylor_fp32(angle);
  let cosAngle = sqrt(1.0 - sinAngle * sinAngle);

  var tableCos = 0.0;
  var tableSin = 0.0;
  if (absoluteTableIndex == 1) {
    tableCos = FP32_COS_TABLE_0;
    tableSin = FP32_SIN_TABLE_0;
  } else if (absoluteTableIndex == 2) {
    tableCos = FP32_COS_TABLE_1;
    tableSin = FP32_SIN_TABLE_1;
  } else if (absoluteTableIndex == 3) {
    tableCos = FP32_COS_TABLE_2;
    tableSin = FP32_SIN_TABLE_2;
  } else if (absoluteTableIndex == 4) {
    tableCos = FP32_COS_TABLE_3;
    tableSin = FP32_SIN_TABLE_3;
  }

  var sinReduced = sinAngle;
  var cosReduced = cosAngle;
  if (tableIndex > 0) {
    sinReduced = tableCos * sinAngle + tableSin * cosAngle;
    cosReduced = tableCos * cosAngle - tableSin * sinAngle;
  } else if (tableIndex < 0) {
    sinReduced = tableCos * sinAngle - tableSin * cosAngle;
    cosReduced = tableCos * cosAngle + tableSin * sinAngle;
  }

  var sinValue = 0.0;
  var cosValue = 0.0;
  if (quadrant == 0) {
    sinValue = sinReduced;
    cosValue = cosReduced;
  } else if (quadrant == 1) {
    sinValue = cosReduced;
    cosValue = -sinReduced;
  } else if (quadrant == -1) {
    sinValue = -cosReduced;
    cosValue = sinReduced;
  } else {
    sinValue = -sinReduced;
    cosValue = -cosReduced;
  }

  return sinValue / cosValue;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
#else
fn tan_fp32(a: f32) -> f32 {
  return tan(a);
}
#endif
`,vs:`\
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`}},43464(e,t,i){function n(e,t=[],i=0){let r=Math.fround(e),a=e-r;return t[i]=r,t[i+1]=a,t}i.d(t,{d:()=>l});let r=`\

layout(std140) uniform fp64arithmeticUniforms {
  uniform float ONE;
  uniform float SPLIT;
} fp64;

/*
About LUMA_FP64_CODE_ELIMINATION_WORKAROUND

The purpose of this workaround is to prevent shader compilers from
optimizing away necessary arithmetic operations by swapping their sequences
or transform the equation to some 'equivalent' form.

These helpers implement Dekker/Veltkamp-style error tracking. If the compiler
folds constants or reassociates the arithmetic, the high/low split can stop
tracking the rounding error correctly. That failure mode tends to look fine in
simple coordinate setup, but then breaks down inside iterative arithmetic such
as fp64 Mandelbrot loops.

The method is to multiply an artifical variable, ONE, which will be known to
the compiler to be 1 only at runtime. The whole expression is then represented
as a polynomial with respective to ONE. In the coefficients of all terms, only one a
and one b should appear

err = (a + b) * ONE^6 - a * ONE^5 - (a + b) * ONE^4 + a * ONE^3 - b - (a + b) * ONE^2 + a * ONE
*/

float prevent_fp64_optimization(float value) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  return value + fp64.ONE * 0.0;
#else
  return value;
#endif
}

// Divide float number to high and low floats to extend fraction bits
vec2 split(float a) {
  // Keep SPLIT as a runtime uniform so the compiler cannot fold the Dekker
  // split into a constant expression and reassociate the recovery steps.
  float split = prevent_fp64_optimization(fp64.SPLIT);
  float t = prevent_fp64_optimization(a * split);
  float temp = t - a;
  float a_hi = t - temp;
  float a_lo = a - a_hi;
  return vec2(a_hi, a_lo);
}

// Divide float number again when high float uses too many fraction bits
vec2 split2(vec2 a) {
  vec2 b = split(a.x);
  b.y += a.y;
  return b;
}

// Special sum operation when a > b
vec2 quickTwoSum(float a, float b) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float sum = (a + b) * fp64.ONE;
  float err = b - (sum - a) * fp64.ONE;
#else
  float sum = a + b;
  float err = b - (sum - a);
#endif
  return vec2(sum, err);
}

// General sum operation
vec2 twoSum(float a, float b) {
  float s = (a + b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE + (b - v);
#else
  float v = s - a;
  float err = (a - (s - v)) + (b - v);
#endif
  return vec2(s, err);
}

vec2 twoSub(float a, float b) {
  float s = (a - b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE - (b + v);
#else
  float v = s - a;
  float err = (a - (s - v)) - (b + v);
#endif
  return vec2(s, err);
}

vec2 twoSqr(float a) {
  float prod = a * a;
  vec2 a_fp64 = split(a);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err = ((a_fp64.x * a_fp64.x - prod) * fp64.ONE + 2.0 * a_fp64.x *
    a_fp64.y * fp64.ONE * fp64.ONE) + a_fp64.y * a_fp64.y * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err = ((a_fp64.x * a_fp64.x - prod) + 2.0 * a_fp64.x * a_fp64.y) + a_fp64.y * a_fp64.y;
#endif
  return vec2(prod, err);
}

vec2 twoProd(float a, float b) {
  float prod = a * b;
  vec2 a_fp64 = split(a);
  vec2 b_fp64 = split(b);
  // twoProd is especially sensitive because mul_fp64 and div_fp64 both depend
  // on the split terms and cross terms staying in the original evaluation
  // order. If the compiler folds or reassociates them, the low part tends to
  // collapse to zero or NaN on some drivers.
  float highProduct = prevent_fp64_optimization(a_fp64.x * b_fp64.x);
  float crossProduct1 = prevent_fp64_optimization(a_fp64.x * b_fp64.y);
  float crossProduct2 = prevent_fp64_optimization(a_fp64.y * b_fp64.x);
  float lowProduct = prevent_fp64_optimization(a_fp64.y * b_fp64.y);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err1 = (highProduct - prod) * fp64.ONE;
  float err2 = crossProduct1 * fp64.ONE * fp64.ONE;
  float err3 = crossProduct2 * fp64.ONE * fp64.ONE * fp64.ONE;
  float err4 = lowProduct * fp64.ONE * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err1 = highProduct - prod;
  float err2 = crossProduct1;
  float err3 = crossProduct2;
  float err4 = lowProduct;
#endif
  float err = ((err1 + err2) + err3) + err4;
  return vec2(prod, err);
}

vec2 sum_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSum(a.x, b.x);
  t = twoSum(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 sub_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSub(a.x, b.x);
  t = twoSub(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 mul_fp64(vec2 a, vec2 b) {
  vec2 prod = twoProd(a.x, b.x);
  // y component is for the error
  prod.y += a.x * b.y;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  prod.y += a.y * b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

vec2 div_fp64(vec2 a, vec2 b) {
  float xn = 1.0 / b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  vec2 yn = mul_fp64(a, vec2(xn, 0));
#else
  vec2 yn = a * xn;
#endif
  float diff = (sub_fp64(a, mul_fp64(b, yn))).x;
  vec2 prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

vec2 sqrt_fp64(vec2 a) {
  if (a.x == 0.0 && a.y == 0.0) return vec2(0.0, 0.0);
  if (a.x < 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);

  float x = 1.0 / sqrt(a.x);
  float yn = a.x * x;
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  vec2 yn_sqr = twoSqr(yn) * fp64.ONE;
#else
  vec2 yn_sqr = twoSqr(yn);
#endif
  float diff = sub_fp64(a, yn_sqr).x;
  vec2 prod = twoProd(x * 0.5, diff);
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2(yn, 0.0), prod);
#endif
}
`,a=`\
struct Fp64F32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent.
fn fp64_decode_f32_bits(bits: u32) -> Fp64F32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64F32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64F32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64F32Bits(sign, i32(exponentBits) - 150, 0x800000u | fraction, false, false, false);
}

fn fp64_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return exactSign << 31u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;

  // A normal two-sum/two-product residual never needs a shift this large.
  // This guard gives deterministic underflow behavior outside that contract.
  if (exactShift >= 64 || highShift >= 64) {
    return exactSign << 31u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let lowBits = fp64_make_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  return vec2u(highBits, lowBits);
}

fn fp64_two_sum_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u((a.sign & b.sign) << 31u, 0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = select(
    b.baseExponent - a.baseExponent,
    a.baseExponent - b.baseExponent,
    a.baseExponent >= b.baseExponent
  );

  // Beyond half an ulp, rounding cannot change the larger operand. Returning
  // the smaller operand intact also avoids an unbounded integer alignment.
  // At a power-of-two boundary the spacing below the larger operand is half
  // the spacing above it, so an opposite-sign gap-25 operand can still change
  // the rounded high limb. Gap 26 is the first universally safe early-out.
  if (exponentDifference > 25) {
    if (fp64_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u, 0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_accumulator_bits(resultSign, resultMagnitude, commonBaseExponent);
}

fn fp64_two_sum_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_multiply_significands(a: u32, b: u32) -> vec2u {
  let aLow = a & 0xffffu;
  let aHigh = a >> 16u;
  let bLow = b & 0xffffu;
  let bHigh = b >> 16u;
  let lowProduct = aLow * bLow;
  let crossProduct = aLow * bHigh + aHigh * bLow;
  let highProduct = aHigh * bHigh;

  var result = vec2u(0u, lowProduct);
  result = fp64_u64_add(
    result,
    fp64_u64_shift_left(vec2u(0u, crossProduct), 16u)
  );
  result = fp64_u64_add(result, vec2u(highProduct, 0u));
  return result;
}

fn fp64_two_prod_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);
  let resultSign = a.sign ^ b.sign;

  if (a.isNan || b.isNan || ((a.isZero || b.isZero) && (a.isInf || b.isInf))) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    return vec2u((resultSign << 31u) | 0x7f800000u, resultSign << 31u);
  }
  if (a.isZero || b.isZero) {
    return vec2u(resultSign << 31u, resultSign << 31u);
  }

  let magnitude = fp64_multiply_significands(a.significand, b.significand);
  return fp64_split_accumulator_bits(
    resultSign,
    magnitude,
    a.baseExponent + b.baseExponent
  );
}

fn fp64_two_prod_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_prod_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_round_add_integer(a: f32, b: f32) -> f32 {
  return fp64_two_sum_integer(a, b).x;
}

fn fp64_round_mul_integer(a: f32, b: f32) -> f32 {
  return fp64_two_prod_integer(a, b).x;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_finite_exponent(value: Fp64F32Bits) -> i32 {
  let mostSignificantBit = 31u - countLeadingZeros(value.significand);
  return value.baseExponent + i32(mostSignificantBit);
}

fn fp64_scale_f32_integer(value: f32, exponent: i32) -> f32 {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(value));
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return value;
  }
  let resultBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent + exponent
  );
  return bitcast<f32>(resultBits);
}

// Divide normalized significands so the hardware operation cannot overflow,
// underflow, or flush a subnormal result. Reapply the exponent with integer
// packing, which also produces subnormal correction limbs without relying on
// floating-point arithmetic to preserve them.
fn fp64_divide_f32_integer(aValue: f32, bValue: f32) -> f32 {
  let a = fp64_decode_f32_bits(bitcast<u32>(aValue));
  let b = fp64_decode_f32_bits(bitcast<u32>(bValue));
  if (a.isZero || b.isZero || a.isInf || b.isInf || a.isNan || b.isNan) {
    return aValue / bValue;
  }

  let aMostSignificantBit = 31u - countLeadingZeros(a.significand);
  let bMostSignificantBit = 31u - countLeadingZeros(b.significand);
  let normalizedABits = fp64_make_f32_bits_from_u64(
    a.sign,
    vec2u(0u, a.significand),
    -i32(aMostSignificantBit)
  );
  let normalizedBBits = fp64_make_f32_bits_from_u64(
    b.sign,
    vec2u(0u, b.significand),
    -i32(bMostSignificantBit)
  );
  let normalizedQuotient = bitcast<f32>(normalizedABits) / bitcast<f32>(normalizedBBits);
  let quotient = fp64_decode_f32_bits(bitcast<u32>(normalizedQuotient));
  let exponentShift =
    a.baseExponent + i32(aMostSignificantBit) -
    b.baseExponent - i32(bMostSignificantBit);
  let quotientBits = fp64_make_f32_bits_from_u64(
    quotient.sign,
    vec2u(0u, quotient.significand),
    quotient.baseExponent + exponentShift
  );
  return bitcast<f32>(quotientBits);
}
#endif

`,s=`\
${a}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn split(a: f32) -> vec2f {
  let aBits = bitcast<u32>(a);
  let decoded = fp64_decode_f32_bits(aBits);
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return vec2f(a, 0.0);
  }

  var roundedHigh = decoded.significand >> 12u;
  let remainder = decoded.significand & 0xfffu;
  if (remainder > 0x800u || (remainder == 0x800u && (roundedHigh & 1u) == 1u)) {
    roundedHigh = roundedHigh + 1u;
  }
  var highMagnitude = vec2u(0u, roundedHigh << 12u);
  var highBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    highMagnitude,
    decoded.baseExponent
  );
  // Rounding the high limb of a maximum-exponent value can overflow even
  // though the original value is finite. Truncate only in that boundary case
  // so split remains an exact finite decomposition.
  if (fp64_decode_f32_bits(highBits).isInf) {
    roundedHigh = decoded.significand >> 12u;
    highMagnitude = vec2u(0u, roundedHigh << 12u);
    highBits = fp64_make_f32_bits_from_u64(
      decoded.sign,
      highMagnitude,
      decoded.baseExponent
    );
  }
  let lowBits = fp64_make_residual_f32_bits(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent,
    highBits
  );
  return vec2f(bitcast<f32>(highBits), bitcast<f32>(lowBits));
}

fn split2(a: vec2f) -> vec2f {
  var result = split(a.x);
  result.y = fp64_round_add_integer(result.y, a.y);
  return result;
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn quickTwoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}
#endif

fn twoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let bBits = bitcast<u32>(b) ^ 0x80000000u;
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn twoSqr(a: f32) -> vec2f {
  return fp64_two_prod_integer(a, a);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  return fp64_two_prod_integer(a, b);
}
#endif

struct Fp64IntegerAccumulator {
  sign: u32,
  magnitude: vec2u,
};

fn fp64_accumulate_f32_integer(
  accumulator: Fp64IntegerAccumulator,
  value: Fp64F32Bits,
  commonBaseExponent: i32
) -> Fp64IntegerAccumulator {
  if (value.isZero) {
    return accumulator;
  }

  let magnitude = fp64_u64_shift_left(
    vec2u(0u, value.significand),
    u32(value.baseExponent - commonBaseExponent)
  );
  if (fp64_u64_is_zero(accumulator.magnitude)) {
    return Fp64IntegerAccumulator(value.sign, magnitude);
  }
  if (accumulator.sign == value.sign) {
    return Fp64IntegerAccumulator(
      accumulator.sign,
      fp64_u64_add(accumulator.magnitude, magnitude)
    );
  }

  let comparison = fp64_u64_compare(accumulator.magnitude, magnitude);
  if (comparison == 0) {
    return Fp64IntegerAccumulator(0u, vec2u(0u));
  }
  if (comparison > 0) {
    return Fp64IntegerAccumulator(
      accumulator.sign,
      fp64_u64_sub(accumulator.magnitude, magnitude)
    );
  }
  return Fp64IntegerAccumulator(
    value.sign,
    fp64_u64_sub(magnitude, accumulator.magnitude)
  );
}

fn fp64_sum_integer_unfused(a: vec2f, b: vec2f) -> vec2f {
  var sum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = fp64_two_sum_integer(a.y, b.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.x);
  sum = fp64_two_sum_integer(sum.x, sum.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.y);
  return fp64_two_sum_integer(sum.x, sum.y);
}

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  let aHigh = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let aLow = fp64_decode_f32_bits(bitcast<u32>(a.y));
  let bHigh = fp64_decode_f32_bits(bitcast<u32>(b.x));
  let bLow = fp64_decode_f32_bits(bitcast<u32>(b.y));
  if (
    aHigh.isInf || aHigh.isNan || aLow.isInf || aLow.isNan ||
    bHigh.isInf || bHigh.isNan || bLow.isInf || bLow.isNan
  ) {
    return fp64_sum_integer_unfused(a, b);
  }

  var minimumBaseExponent = 2147483647;
  var maximumBaseExponent = -2147483647;
  if (!aHigh.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, aHigh.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, aHigh.baseExponent);
  }
  if (!aLow.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, aLow.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, aLow.baseExponent);
  }
  if (!bHigh.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, bHigh.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, bHigh.baseExponent);
  }
  if (!bLow.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, bLow.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, bLow.baseExponent);
  }
  if (maximumBaseExponent < minimumBaseExponent) {
    return vec2f(0.0, 0.0);
  }

  // Four 24-bit significands spanning at most 38 bits fit in the 64-bit
  // accumulator, including the two extra carry bits needed by their sum.
  if (maximumBaseExponent - minimumBaseExponent > 38) {
    return fp64_sum_integer_unfused(a, b);
  }

  var accumulator = Fp64IntegerAccumulator(0u, vec2u(0u));
  accumulator = fp64_accumulate_f32_integer(accumulator, aHigh, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, aLow, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, bHigh, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, bLow, minimumBaseExponent);
  let resultBits = fp64_split_accumulator_bits(
    accumulator.sign,
    accumulator.magnitude,
    minimumBaseExponent
  );
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  let negatedB = vec2f(
    bitcast<f32>(bitcast<u32>(b.x) ^ 0x80000000u),
    bitcast<f32>(bitcast<u32>(b.y) ^ 0x80000000u)
  );
  return sum_fp64(a, negatedB);
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var product = fp64_two_prod_integer(a.x, b.x);
  let crossProduct1 = fp64_round_mul_integer(a.x, b.y);
  product = sum_fp64(product, vec2f(crossProduct1, 0.0));
  let crossProduct2 = fp64_round_mul_integer(a.y, b.x);
  return sum_fp64(product, vec2f(crossProduct2, 0.0));
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_scale_fp64_integer(value: vec2f, exponent: i32) -> vec2f {
  let high = fp64_scale_f32_integer(value.x, exponent);
  let low = fp64_scale_f32_integer(value.y, exponent);
  return sum_fp64(vec2f(high, 0.0), vec2f(low, 0.0));
}

fn fp64_div_fp64_normalized(a: vec2f, b: vec2f) -> vec2f {
  let quotientHigh = fp64_divide_f32_integer(a.x, b.x);
  var quotient = vec2f(quotientHigh, 0.0);

  let remainder = sub_fp64(a, mul_fp64(b, quotient));
  let quotientLow = fp64_divide_f32_integer(remainder.x, b.x);
  quotient = sum_fp64(quotient, vec2f(quotientLow, 0.0));

  let secondRemainder = sub_fp64(a, mul_fp64(b, quotient));
  let correction = fp64_divide_f32_integer(secondRemainder.x, b.x);
  return sum_fp64(quotient, vec2f(correction, 0.0));
}

fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let decodedA = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedB = fp64_decode_f32_bits(bitcast<u32>(b.x));
  if (
    decodedA.isZero || decodedB.isZero ||
    decodedA.isInf || decodedB.isInf ||
    decodedA.isNan || decodedB.isNan
  ) {
    return fp64_div_fp64_normalized(a, b);
  }

  let exponentA = fp64_f32_finite_exponent(decodedA);
  let exponentB = fp64_f32_finite_exponent(decodedB);
  // Correct the quotient near unity so b * q and the remainder stay clear of
  // both f32 underflow and overflow. The exponent difference is applied once.
  let normalizedA = fp64_scale_fp64_integer(a, -exponentA);
  let normalizedB = fp64_scale_fp64_integer(b, -exponentB);
  let normalizedQuotient = fp64_div_fp64_normalized(normalizedA, normalizedB);
  return fp64_scale_fp64_integer(normalizedQuotient, exponentA - exponentB);
}

fn fp64_sqrt_fp64_normalized(a: vec2f) -> vec2f {
  let estimate = sqrt(a.x);
  let difference = sub_fp64(a, fp64_two_prod_integer(estimate, estimate)).x;
  let denominator = fp64_round_add_integer(estimate, estimate);
  let correction = fp64_divide_f32_integer(difference, denominator);
  return sum_fp64(vec2f(estimate, 0.0), vec2f(correction, 0.0));
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedLow = fp64_decode_f32_bits(bitcast<u32>(a.y));
  if (decoded.isZero && decodedLow.isZero) {
    return vec2f(0.0, 0.0);
  }
  if (decoded.sign == 1u) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  if (decoded.isInf || decoded.isNan) {
    return fp64_sqrt_fp64_normalized(a);
  }
  let exponent = fp64_f32_finite_exponent(decoded);
  // An even scale lets the final square-root rescale use an integer exponent.
  let evenExponent = exponent - (exponent & 1);
  let normalizedA = fp64_scale_fp64_integer(a, -evenExponent);
  let normalizedRoot = fp64_sqrt_fp64_normalized(normalizedA);
  return fp64_scale_fp64_integer(normalizedRoot, evenExponent / 2);
}
#endif
`,o=`\
${a}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn split(a: f32) -> vec2f {
  let aBits = bitcast<u32>(a);
  let decoded = fp64_decode_f32_bits(aBits);
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return vec2f(a, 0.0);
  }

  var roundedHigh = decoded.significand >> 12u;
  let remainder = decoded.significand & 0xfffu;
  if (remainder > 0x800u || (remainder == 0x800u && (roundedHigh & 1u) == 1u)) {
    roundedHigh = roundedHigh + 1u;
  }
  var highMagnitude = vec2u(0u, roundedHigh << 12u);
  var highBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    highMagnitude,
    decoded.baseExponent
  );
  if (fp64_decode_f32_bits(highBits).isInf) {
    roundedHigh = decoded.significand >> 12u;
    highMagnitude = vec2u(0u, roundedHigh << 12u);
    highBits = fp64_make_f32_bits_from_u64(
      decoded.sign,
      highMagnitude,
      decoded.baseExponent
    );
  }
  let lowBits = fp64_make_residual_f32_bits(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent,
    highBits
  );
  return vec2f(bitcast<f32>(highBits), bitcast<f32>(lowBits));
}

fn split2(a: vec2f) -> vec2f {
  var result = split(a.x);
  result.y = result.y + a.y;
  return result;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}
#endif

fn twoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let bBits = bitcast<u32>(b) ^ 0x80000000u;
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn twoSqr(a: f32) -> vec2f {
  return fp64_two_prod_integer(a, a);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  return fp64_two_prod_integer(a, b);
}
#endif

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  let highSum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = prevent_fp64_optimization((a.y + b.y) + highSum.y);
  return fp64_two_sum_integer(highSum.x, lowSum);
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  let highDifference = twoSub(a.x, b.x);
  let lowDifference = prevent_fp64_optimization((a.y - b.y) + highDifference.y);
  return fp64_two_sum_integer(highDifference.x, lowDifference);
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  let highProduct = fp64_two_prod_integer(a.x, b.x);
  let crossTerms = prevent_fp64_optimization(a.x * b.y + a.y * b.x);
  let lowTerms = prevent_fp64_optimization((crossTerms + a.y * b.y) + highProduct.y);
  return fp64_two_sum_integer(highProduct.x, lowTerms);
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let estimate = prevent_fp64_optimization(1.0 / b.x);
  let quotient = mul_fp64(a, vec2f(estimate, fp64_runtime_zero()));
  let remainder = prevent_fp64_optimization(sub_fp64(a, mul_fp64(b, quotient)).x);
  return sum_fp64(quotient, twoProd(estimate, remainder));
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  if (a.x == 0.0 && a.y == 0.0) {
    return vec2f(0.0, 0.0);
  }
  if (a.x < 0.0) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  let reciprocalRoot = prevent_fp64_optimization(1.0 / sqrt(a.x));
  let estimate = prevent_fp64_optimization(a.x * reciprocalRoot);
  let difference = prevent_fp64_optimization(sub_fp64(a, twoSqr(estimate)).x);
  let correction = twoProd(prevent_fp64_optimization(reciprocalRoot * 0.5), difference);
  return sum_fp64(vec2f(estimate, 0.0), correction);
}
#endif
`,l={name:"fp64arithmetic",source:`\
struct Fp64ArithmeticUniforms {
  ONE: f32,
  SPLIT: f32,
};

@group(0) @binding(auto) var<uniform> fp64arithmetic : Fp64ArithmeticUniforms;

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64Bits {
  sign: u32,
  exponent: i32,
  significand: vec2u,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_nan(seed: f32) -> f32 {
  let nanBits = 0x7fc00000u | select(0u, 1u, seed < 0.0);
  return bitcast<f32>(nanBits);
}
#endif

fn fp64_u64_is_zero(value: vec2u) -> bool {
  return value.x == 0u && value.y == 0u;
}

fn fp64_u64_compare(a: vec2u, b: vec2u) -> i32 {
  if (a.x != b.x) {
    return select(-1, 1, a.x > b.x);
  }
  if (a.y != b.y) {
    return select(-1, 1, a.y > b.y);
  }
  return 0;
}

fn fp64_u64_add(a: vec2u, b: vec2u) -> vec2u {
  let low = a.y + b.y;
  let carry = select(0u, 1u, low < a.y);
  return vec2u(a.x + b.x + carry, low);
}

fn fp64_u64_sub(a: vec2u, b: vec2u) -> vec2u {
  let borrow = select(0u, 1u, a.y < b.y);
  return vec2u(a.x - b.x - borrow, a.y - b.y);
}

fn fp64_u64_shift_left(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u((value.x << shift) | (value.y >> (32u - shift)), value.y << shift);
  }
  if (shift == 32u) {
    return vec2u(value.y, 0u);
  }
  if (shift < 64u) {
    return vec2u(value.y << (shift - 32u), 0u);
  }
  return vec2u(0u);
}

fn fp64_u64_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u(value.x >> shift, (value.y >> shift) | (value.x << (32u - shift)));
  }
  if (shift == 32u) {
    return vec2u(0u, value.x);
  }
  if (shift < 64u) {
    return vec2u(0u, value.x >> (shift - 32u));
  }
  return vec2u(0u);
}

fn fp64_u64_get_bit(value: vec2u, bitIndex: u32) -> bool {
  if (bitIndex >= 64u) {
    return false;
  }
  if (bitIndex >= 32u) {
    return ((value.x >> (bitIndex - 32u)) & 1u) != 0u;
  }
  return ((value.y >> bitIndex) & 1u) != 0u;
}

fn fp64_u64_has_bits_below(value: vec2u, bitCount: u32) -> bool {
  if (bitCount == 0u) {
    return false;
  }
  if (bitCount >= 64u) {
    return !fp64_u64_is_zero(value);
  }
  if (bitCount > 32u) {
    let highBitCount = bitCount - 32u;
    let highMask = (1u << highBitCount) - 1u;
    return value.y != 0u || (value.x & highMask) != 0u;
  }
  if (bitCount == 32u) {
    return value.y != 0u;
  }
  let lowMask = (1u << bitCount) - 1u;
  return (value.y & lowMask) != 0u;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_u64_shift_right_sticky(value: vec2u, shift: u32) -> vec2u {
  var shifted = fp64_u64_shift_right(value, shift);
  if (fp64_u64_has_bits_below(value, shift)) {
    shifted.y = shifted.y | 1u;
  }
  return shifted;
}
#endif

fn fp64_u64_count_leading_zeros(value: vec2u) -> u32 {
  if (value.x != 0u) {
    return countLeadingZeros(value.x);
  }
  return 32u + countLeadingZeros(value.y);
}

fn fp64_round_shift_right_to_u32(value: vec2u, shift: u32) -> u32 {
  if (shift == 0u) {
    return value.y;
  }

  let truncated = fp64_u64_shift_right(value, shift);
  var rounded = truncated.y;
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded & 1u) == 1u)) {
    rounded = rounded + 1u;
  }
  return rounded;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_round_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }

  var rounded = fp64_u64_shift_right(value, shift);
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded.y & 1u) == 1u)) {
    rounded = fp64_u64_add(rounded, vec2u(0u, 1u));
  }
  return rounded;
}
#endif

fn fp64_make_f32_bits_from_u64(sign: u32, significand: vec2u, baseExponent: i32) -> u32 {
  if (fp64_u64_is_zero(significand)) {
    return sign << 31u;
  }

  let leadingZeros = fp64_u64_count_leading_zeros(significand);
  let mostSignificantBit = 63u - leadingZeros;
  var exponent = baseExponent + i32(mostSignificantBit);

  if (exponent > 127) {
    return (sign << 31u) | 0x7f800000u;
  }

  if (exponent >= -126) {
    let shift = i32(mostSignificantBit) - 23;
    var significand24: u32;
    if (shift > 0) {
      significand24 = fp64_round_shift_right_to_u32(significand, u32(shift));
    } else {
      significand24 = fp64_u64_shift_left(significand, u32(-shift)).y;
    }

    if (significand24 >= 0x1000000u) {
      significand24 = significand24 >> 1u;
      exponent = exponent + 1;
      if (exponent > 127) {
        return (sign << 31u) | 0x7f800000u;
      }
    }

    return (sign << 31u) | (u32(exponent + 127) << 23u) | (significand24 & 0x7fffffu);
  }

  let scaleExponent = baseExponent + 149;
  var mantissa: u32;
  if (scaleExponent >= 0) {
    mantissa = fp64_u64_shift_left(significand, u32(scaleExponent)).y;
  } else {
    mantissa = fp64_round_shift_right_to_u32(significand, u32(-scaleExponent));
  }

  if (mantissa >= 0x800000u) {
    return (sign << 31u) | 0x00800000u;
  }
  return (sign << 31u) | mantissa;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_decode_bits(bits: vec2u) -> Fp64Bits {
  let sign = bits.x >> 31u;
  let exponentBits = (bits.x >> 20u) & 0x7ffu;
  let fractionHigh = bits.x & 0xfffffu;
  let fractionLow = bits.y;
  let fraction = vec2u(fractionHigh, fractionLow);

  if (exponentBits == 0x7ffu) {
    let isInf = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, 0, vec2u(0u), false, isInf, !isInf);
  }

  if (exponentBits == 0u) {
    let isZero = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, -1022, fraction, isZero, false, false);
  }

  return Fp64Bits(sign, i32(exponentBits) - 1023, vec2u((1u << 20u) | fractionHigh, fractionLow), false, false, false);
}

fn fp64_finite_magnitude_compare(a: Fp64Bits, b: Fp64Bits) -> i32 {
  if (a.exponent != b.exponent) {
    return select(-1, 1, a.exponent > b.exponent);
  }
  return fp64_u64_compare(a.significand, b.significand);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64RawF32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent. This shared
// integer representation lets normalization remain independent of the
// selected double-single arithmetic implementation.
fn fp64_decode_raw_f32_bits(bits: u32) -> Fp64RawF32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64RawF32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64RawF32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64RawF32Bits(
    sign,
    i32(exponentBits) - 150,
    0x800000u | fraction,
    false,
    false,
    false
  );
}

fn fp64_raw_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_raw_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_raw_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return 0u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;
  if (exactShift >= 64 || highShift >= 64) {
    return 0u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_raw_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let rawLowBits = fp64_make_raw_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  let lowBits = select(rawLowBits, 0u, (rawLowBits & 0x7fffffffu) == 0u);
  if ((highBits & 0x7fffffffu) == 0u && (lowBits & 0x7fffffffu) == 0u) {
    return vec2u(0u);
  }
  return vec2u(highBits, lowBits);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
// Round an arithmetic accumulator to binary64 before splitting it. The
// aligned add/subtract paths retain three guard bits plus a sticky bit, which
// is sufficient for round-to-nearest-even at the binary64 boundary.
fn fp64_split_binary64_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }

  let mostSignificantBit = 63u - fp64_u64_count_leading_zeros(magnitude);
  let exponent = baseExponent + i32(mostSignificantBit);
  if (exponent > 1023) {
    return vec2u((sign << 31u) | 0x7f800000u, 0u);
  }

  var roundedMagnitude = magnitude;
  var roundedBaseExponent = baseExponent;
  if (exponent >= -1022) {
    if (mostSignificantBit > 52u) {
      let shift = mostSignificantBit - 52u;
      roundedMagnitude = fp64_round_shift_right(magnitude, shift);
      roundedBaseExponent = baseExponent + i32(shift);
    }
  } else {
    let shift = -1074 - baseExponent;
    if (shift > 0) {
      roundedMagnitude = fp64_round_shift_right(magnitude, u32(shift));
      roundedBaseExponent = -1074;
    }
  }

  if (fp64_u64_is_zero(roundedMagnitude)) {
    return vec2u(0u);
  }
  return fp64_split_raw_accumulator_bits(sign, roundedMagnitude, roundedBaseExponent);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_add_raw_f32_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_raw_f32_bits(aBits);
  let b = fp64_decode_raw_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = abs(a.baseExponent - b.baseExponent);
  if (exponentDifference > 25) {
    if (fp64_raw_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_raw_accumulator_bits(
    resultSign,
    resultMagnitude,
    commonBaseExponent
  );
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_add_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_sub_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_add_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

fn fp64_sub_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

// Subtract two raw binary64 values and round the exact result once to f32.
// The input words are canonical high/low words: .x contains sign/exponent/high
// fraction bits, and .y contains the low 32 fraction bits.
fn sub_fp64u32_to_f32_bits(aBits: vec2u, bBits: vec2u) -> u32 {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return 0x7fc00000u;
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return (a.sign << 31u) | 0x7f800000u;
    }
    return 0x7fc00000u;
  }
  if (a.isInf) {
    return (a.sign << 31u) | 0x7f800000u;
  }
  if (b.isInf) {
    return (bSubtractionSign << 31u) | 0x7f800000u;
  }
  if (a.isZero && b.isZero) {
    return select(0u, 0x80000000u, a.sign == 1u && b.sign == 0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return 0u;
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_f32_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_f32_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_f32(aBits: vec2u, bBits: vec2u) -> f32 {
  return bitcast<f32>(sub_fp64u32_to_f32_bits(aBits, bBits));
}

// Subtract two raw binary64 values, round once to binary64, then split the
// result into normalized f32 limbs. Finite results must fit within the f32
// exponent range; larger magnitudes map to infinity and smaller magnitudes
// map to zero. The input words use canonical high/low word order.
fn sub_fp64u32_to_fp64_bits(aBits: vec2u, bBits: vec2u) -> vec2u {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
    }
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf) {
    return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
  }
  if (b.isInf) {
    return vec2u((bSubtractionSign << 31u) | 0x7f800000u, 0u);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return vec2u(0u);
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_fp64_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_fp64(aBits: vec2u, bBits: vec2u) -> vec2f {
  let resultBits = sub_fp64u32_to_fp64_bits(aBits, bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
// Zero bits the compiler cannot prove are zero: the uniform ONE is 1.0 at runtime.
// Some WGSL backends compile with fast-math flags (e.g. Firefox WebGPU on Windows, where DXC
// runs without IEEE strictness). There, a float barrier such as \`x + ONE * 0.0\` folds away,
// and the error terms of the double-single transforms are re-associated and lost. An integer
// OR is opaque to floating-point simplification, and unlike XOR two nested barriers do not
// cancel. Each rounding step the transforms rely on gets its own barrier.
fn fp64_runtime_zero_bits() -> u32 {
  return bitcast<u32>(fp64arithmetic.ONE) ^ 0x3f800000u;
}

fn fp64_runtime_zero() -> f32 {
  return bitcast<f32>(fp64_runtime_zero_bits());
}

fn prevent_fp64_optimization(value: f32) -> f32 {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  return bitcast<f32>(bitcast<u32>(value) | fp64_runtime_zero_bits());
#else
  return value;
#endif
}
#endif

#ifdef LUMA_FP64_INTEGER_ARITHMETIC
${s}
#else
#ifdef LUMA_FP64_HYBRID_ARITHMETIC
${o}
#else
fn split(a: f32) -> vec2f {
  let splitValue = prevent_fp64_optimization(fp64arithmetic.SPLIT + fp64_runtime_zero());
  let t = prevent_fp64_optimization(a * splitValue);
  let temp = prevent_fp64_optimization(t - a);
  let aHi = prevent_fp64_optimization(t - temp);
  let aLo = prevent_fp64_optimization(a - aHi);
  return vec2f(aHi, aLo);
}

fn split2(a: vec2f) -> vec2f {
  var b = split(a.x);
  b.y = prevent_fp64_optimization(b.y + a.y);
  return b;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
  let sum = prevent_fp64_optimization(a + b);
  let err = prevent_fp64_optimization(b - prevent_fp64_optimization(sum - a));
  return vec2f(sum, err);
}

fn twoSum(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a + b);
  let v = prevent_fp64_optimization(s - a);
  let aErr = prevent_fp64_optimization(a - prevent_fp64_optimization(s - v));
  let bErr = prevent_fp64_optimization(b - v);
  let err = prevent_fp64_optimization(aErr + bErr);
  return vec2f(s, err);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a - b);
  let v = prevent_fp64_optimization(s - a);
  let aErr = prevent_fp64_optimization(a - prevent_fp64_optimization(s - v));
  let bErr = prevent_fp64_optimization(b + v);
  let err = prevent_fp64_optimization(aErr - bErr);
  return vec2f(s, err);
}

fn twoSqr(a: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * a);
  let aFp64 = split(a);
  let highProduct = prevent_fp64_optimization(aFp64.x * aFp64.x);
  let crossProduct = prevent_fp64_optimization(2.0 * aFp64.x * aFp64.y);
  let lowProduct = prevent_fp64_optimization(aFp64.y * aFp64.y);
  let highErr = prevent_fp64_optimization(highProduct - prod);
  let err = prevent_fp64_optimization(
    prevent_fp64_optimization(highErr + crossProduct) + lowProduct
  );
  return vec2f(prod, err);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * b);
  let aFp64 = split(a);
  let bFp64 = split(b);
  let highProduct = prevent_fp64_optimization(aFp64.x * bFp64.x);
  let crossProduct1 = prevent_fp64_optimization(aFp64.x * bFp64.y);
  let crossProduct2 = prevent_fp64_optimization(aFp64.y * bFp64.x);
  let lowProduct = prevent_fp64_optimization(aFp64.y * bFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err1 = (highProduct - prod) * fp64arithmetic.ONE;
  let err2 = crossProduct1 * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err3 = crossProduct2 * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err4 =
    lowProduct *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE;
#else
  let err1 = highProduct - prod;
  let err2 = crossProduct1;
  let err3 = crossProduct2;
  let err4 = lowProduct;
#endif
  let err12InputA = prevent_fp64_optimization(err1);
  let err12InputB = prevent_fp64_optimization(err2);
  let err12 = prevent_fp64_optimization(err12InputA + err12InputB);
  let err123InputA = prevent_fp64_optimization(err12);
  let err123InputB = prevent_fp64_optimization(err3);
  let err123 = prevent_fp64_optimization(err123InputA + err123InputB);
  let err1234InputA = prevent_fp64_optimization(err123);
  let err1234InputB = prevent_fp64_optimization(err4);
  let err = prevent_fp64_optimization(err1234InputA + err1234InputB);
  return vec2f(prod, err);
}

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSum(a.x, b.x);
  let t = twoSum(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSub(a.x, b.x);
  let t = twoSub(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var prod = twoProd(a.x, b.x);
  let crossProduct1 = prevent_fp64_optimization(a.x * b.y);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct1);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  let crossProduct2 = prevent_fp64_optimization(a.y * b.x);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct2);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let xn = prevent_fp64_optimization(1.0 / b.x);
  let yn = mul_fp64(a, vec2f(xn, fp64_runtime_zero()));
  let diff = prevent_fp64_optimization(sub_fp64(a, mul_fp64(b, yn)).x);
  let prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  if (a.x == 0.0 && a.y == 0.0) {
    return vec2f(0.0, 0.0);
  }
  if (a.x < 0.0) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  let x = prevent_fp64_optimization(1.0 / sqrt(a.x));
  let yn = prevent_fp64_optimization(a.x * x);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let ynSqr = twoSqr(yn) * fp64arithmetic.ONE;
#else
  let ynSqr = twoSqr(yn);
#endif
  let diff = prevent_fp64_optimization(sub_fp64(a, ynSqr).x);
  let prod = twoProd(prevent_fp64_optimization(x * 0.5), diff);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2f(yn, 0.0), prod);
#endif
}
#endif
#endif
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_bits_is_nan(bits: u32) -> bool {
  return (bits & 0x7fffffffu) > 0x7f800000u;
}

fn fp64_f32_bits_is_inf(bits: u32) -> bool {
  return (bits & 0x7fffffffu) == 0x7f800000u;
}

fn fp64_compare_f32_bits(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == 0u && bMagnitude == 0u) {
    return 0;
  }
  let aSign = aBits >> 31u;
  let bSign = bBits >> 31u;
  if (aSign != bSign) {
    return select(1, -1, aSign == 1u);
  }
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  let magnitudeComparison = select(-1, 1, aMagnitude > bMagnitude);
  return select(magnitudeComparison, -magnitudeComparison, aSign == 1u);
}

// Normalize an arbitrary pair of finite f32 limbs with integer accumulation.
// This is independent of LUMA_FP64_INTEGER_ARITHMETIC and canonicalizes every
// representation of zero to vec2f(+0.0, +0.0).
fn normalize_fp64(value: vec2f) -> vec2f {
  let resultBits = fp64_add_raw_f32_bits(bitcast<u32>(value.x), bitcast<u32>(value.y));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn is_nan_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  return fp64_f32_bits_is_nan(bitcast<u32>(normalized.x)) ||
    fp64_f32_bits_is_nan(bitcast<u32>(normalized.y));
}

fn is_finite_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  return !fp64_f32_bits_is_nan(highBits) && !fp64_f32_bits_is_nan(lowBits) &&
    !fp64_f32_bits_is_inf(highBits) && !fp64_f32_bits_is_inf(lowBits);
}

// Returns -1, 0, or 1. NaN is unordered and returns 0; call is_nan_fp64 or
// is_finite_fp64 first when 0 must mean a finite zero.
fn sign_fp64(value: vec2f) -> i32 {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  if (fp64_f32_bits_is_nan(highBits) || fp64_f32_bits_is_nan(lowBits)) {
    return 0;
  }
  if ((highBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (highBits >> 31u) == 1u);
  }
  if ((lowBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (lowBits >> 31u) == 1u);
  }
  return 0;
}

// Compares double-single values and returns -1, 0, or 1. NaN is unordered
// and returns 0; callers that require equality semantics must first check
// is_nan_fp64 or is_finite_fp64.
fn compare_fp64(a: vec2f, b: vec2f) -> i32 {
  let normalizedA = normalize_fp64(a);
  let normalizedB = normalize_fp64(b);
  let aHighBits = bitcast<u32>(normalizedA.x);
  let aLowBits = bitcast<u32>(normalizedA.y);
  let bHighBits = bitcast<u32>(normalizedB.x);
  let bLowBits = bitcast<u32>(normalizedB.y);
  if (fp64_f32_bits_is_nan(aHighBits) || fp64_f32_bits_is_nan(aLowBits) ||
      fp64_f32_bits_is_nan(bHighBits) || fp64_f32_bits_is_nan(bLowBits)) {
    return 0;
  }
  let highComparison = fp64_compare_f32_bits(aHighBits, bHighBits);
  if (highComparison != 0) {
    return highComparison;
  }
  return fp64_compare_f32_bits(aLowBits, bLowBits);
}

// Scale by 2^exponent under either arithmetic. The classic path repacks each limb with
// integer operations and no floating-point arithmetic, so hardware that flushes subnormal
// results cannot zero a subnormal limb. Its result has the value of the integer path's,
// which also renormalizes the limbs; that renormalization would flush them here.
fn fp64_scale_fp64(value: vec2f, exponent: i32) -> vec2f {
#ifdef LUMA_FP64_INTEGER_ARITHMETIC
  return fp64_scale_fp64_integer(value, exponent);
#else
  let high = fp64_decode_raw_f32_bits(bitcast<u32>(value.x));
  let low = fp64_decode_raw_f32_bits(bitcast<u32>(value.y));
  var scaledHigh = value.x;
  if (!(high.isZero || high.isInf || high.isNan)) {
    scaledHigh = bitcast<f32>(
      fp64_make_f32_bits_from_u64(high.sign, vec2u(0u, high.significand), high.baseExponent + exponent)
    );
  }
  var scaledLow = value.y;
  if (!(low.isZero || low.isInf || low.isNan)) {
    scaledLow = bitcast<f32>(
      fp64_make_f32_bits_from_u64(low.sign, vec2u(0u, low.significand), low.baseExponent + exponent)
    );
  }
  return vec2f(scaledHigh, scaledLow);
#endif
}
#endif
`,fs:r,vs:r,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:"f32",SPLIT:"f32"},fp64ify:n,fp64LowPart:function(e){return e-Math.fround(e)},fp64ifyMatrix4:function(e){let t=new Float32Array(32);for(let i=0;i<4;++i)for(let r=0;r<4;++r){let a=4*i+r;n(e[4*r+i],t,2*a)}return t}}},26369(e,t,i){i.d(t,{v:()=>n});function n(e,t){if(!e)throw Error(t||"@math.gl/web-mercator: assertion failed.")}},34336(e,t,i){i.d(t,{F:()=>s});var n=i(26369),r=i(231),a=i(88967);function s(e){let{width:t,height:i,bounds:s,minExtent:o=0,maxZoom:l=24,offset:u=[0,0]}=e,[[f,c],[d,p]]=s,h=function(e=0){return"number"==typeof e?{top:e,bottom:e,left:e,right:e}:((0,n.v)(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}(e.padding),_=(0,a.Gw)([f,(0,r.qE)(p,-a.aH,a.aH)]),g=(0,a.Gw)([d,(0,r.qE)(c,-a.aH,a.aH)]),m=[Math.max(Math.abs(g[0]-_[0]),o),Math.max(Math.abs(g[1]-_[1]),o)],b=[t-h.left-h.right-2*Math.abs(u[0]),i-h.top-h.bottom-2*Math.abs(u[1])];(0,n.v)(b[0]>0&&b[1]>0);let v=b[0]/m[0],y=b[1]/m[1],w=Math.min(l,(0,r.p6)(Math.abs(Math.min(v,y))));(0,n.v)(Number.isFinite(w));let x=2**w,E=(h.left-h.right)/2+u[0],S=(h.top-h.bottom)/2+u[1],A=(0,a.iV)([(g[0]+_[0])/2-E/x,(g[1]+_[1])/2+S/x]);return{longitude:A[0],latitude:A[1],zoom:w}}},37925(e,t,i){i.d(t,{g:()=>o});var n=i(46540),r=i(88967),a=i(231);let s=Math.PI/180;function o(e,t=0){let i,n,{width:r,height:a,unproject:u}=e,f={targetZ:t},c=u([0,a],f),d=u([r,a],f);return(e.fovy?.5*e.fovy*s:Math.atan(.5/e.altitude))>(90-e.pitch)*s-.01?(i=l(e,0,t),n=l(e,r,t)):(i=u([0,0],f),n=u([r,0],f)),[c,d,n,i]}function l(e,t,i){let{pixelUnprojectionMatrix:s}=e,o=(0,a._U)(s,[t,0,1,1]),l=(0,a._U)(s,[t,e.height,1,1]),u=(i*e.distanceScales.unitsPerMeter[2]-o[2])/(l[2]-o[2]),f=n.Cc([],o,l,u),c=(0,r.iV)(f);return c.push(i),c}},231(e,t,i){function n(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function r(e,t){var i,n;let r,a,s,o,l=(i=[],r=t[0],a=t[1],s=t[2],o=t[3],i[0]=e[0]*r+e[4]*a+e[8]*s+e[12]*o,i[1]=e[1]*r+e[5]*a+e[9]*s+e[13]*o,i[2]=e[2]*r+e[6]*a+e[10]*s+e[14]*o,i[3]=e[3]*r+e[7]*a+e[11]*s+e[15]*o,i);return n=1/l[3],l[0]=l[0]*n,l[1]=l[1]*n,l[2]=l[2]*n,l[3]=l[3]*n,l}function a(e,t,i){return e<t?t:e>i?i:e}i.d(t,{_U:()=>r,$M:()=>n,qE:()=>a,p6:()=>s});let s=Math.log2||function(e){return Math.log(e)*Math.LOG2E}},88967(e,t,i){i.d(t,{Gw:()=>_,Jh:()=>x,Os:()=>E,VJ:()=>A,XM:()=>h,aH:()=>d,dT:()=>v,h0:()=>p,iV:()=>g,mY:()=>m,nI:()=>b,om:()=>w,rY:()=>y,wZ:()=>S,xJ:()=>B});var n=i(231),r=i(24321),a=i(46540),s=i(46803),o=i(26369);let l=Math.PI,u=l/4,f=l/180,c=180/l,d=85.051129,p=1.5;function h(e){return Math.pow(2,e)}function _(e){let[t,i]=e;(0,o.v)(Number.isFinite(t)),(0,o.v)(Number.isFinite(i)&&i>=-90&&i<=90,"invalid latitude");let n=512*(l+Math.log(Math.tan(u+i*f*.5)))/(2*l);return[512*(t*f+l)/(2*l),n]}function g(e){let[t,i]=e,n=2*(Math.atan(Math.exp(i/512*(2*l)-l))-u);return[(t/512*(2*l)-l)*c,n*c]}function m(e){return 512/4003e4/Math.cos(e*f)}function b(e){let{latitude:t,longitude:i,highPrecision:n=!1}=e;(0,o.v)(Number.isFinite(t)&&Number.isFinite(i));let r=Math.cos(t*f),a=512/360/r,s=512/4003e4/r,l={unitsPerMeter:[s,s,s],metersPerUnit:[1/s,1/s,1/s],unitsPerDegree:[512/360,a,s],degreesPerUnit:[1/(512/360),1/a,1/s]};if(n){let e=f*Math.tan(t*f)/r,i=512/4003e4*e,n=i/a*s;l.unitsPerDegree2=[0,512/360*e/2,i],l.unitsPerMeter2=[n,0,n]}return l}function v(e,t){let[i,n,r]=e,[a,s,o]=t,{unitsPerMeter:l,unitsPerMeter2:u}=b({longitude:i,latitude:n,highPrecision:!0}),f=_(e);f[0]+=a*(l[0]+u[0]*s),f[1]+=s*(l[1]+u[1]*s);let c=g(f);return Number.isFinite(r)||Number.isFinite(o)?[c[0],c[1],(r||0)+(o||0)]:c}function y(e){let{height:t,pitch:i,bearing:a,altitude:o,scale:l,center:u}=e,c=(0,n.$M)();r.Tl(c,c,[0,0,-o]),r.eL(c,c,-i*f),r.Qr(c,c,a*f);let d=l/t;return r.hs(c,c,[d,d,d]),u&&r.Tl(c,c,s.ze([],u)),c}function w(e){let{width:t,height:i,altitude:r,pitch:a=0,offset:s,center:o,scale:l,nearZMultiplier:u=1,farZMultiplier:c=1}=e,{fovy:d=E(p)}=e;void 0!==r&&(d=E(r));let h=d*f,_=a*f,g=S(d),m=g;o&&(m+=o[2]*l/Math.cos(_)/i);let b=h*(.5+(s?s[1]:0)/i),v=Math.sin(b)*m/Math.sin((0,n.qE)(Math.PI/2-_-b,.01,Math.PI-.01));return{fov:h,aspect:t/i,focalDistance:g,near:u,far:Math.min((Math.sin(_)*v+m)*c,10*m)}}function x(e){let{fov:t,aspect:i,near:n,far:a}=w(e);return r.fN([],t,i,n,a)}function E(e){return 2*Math.atan(.5/e)*c}function S(e){return .5/Math.tan(.5*e*f)}function A(e,t){let[i,r,a=0]=e;return(0,o.v)(Number.isFinite(i)&&Number.isFinite(r)&&Number.isFinite(a)),(0,n._U)(t,[i,r,a,1])}function B(e,t,i=0){let[r,s,l]=e;if((0,o.v)(Number.isFinite(r)&&Number.isFinite(s),"invalid pixel coordinate"),Number.isFinite(l))return(0,n._U)(t,[r,s,l,1]);let u=(0,n._U)(t,[r,s,0,1]),f=(0,n._U)(t,[r,s,1,1]),c=u[2],d=f[2];return a.Cc([],u,f,c===d?0:((i||0)-c)/(d-c))}},24321(e,t,i){function n(e,t){let i=t[0],n=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],u=t[7],f=t[8],c=t[9],d=t[10],p=t[11],h=t[12],_=t[13],g=t[14],m=t[15],b=i*o-n*s,v=i*l-r*s,y=i*u-a*s,w=n*l-r*o,x=n*u-a*o,E=r*u-a*l,S=f*_-c*h,A=f*g-d*h,B=f*m-p*h,T=c*g-d*_,M=c*m-p*_,I=d*m-p*g,k=b*I-v*M+y*T+w*B-x*A+E*S;return k?(k=1/k,e[0]=(o*I-l*M+u*T)*k,e[1]=(r*M-n*I-a*T)*k,e[2]=(_*E-g*x+m*w)*k,e[3]=(d*x-c*E-p*w)*k,e[4]=(l*B-s*I-u*A)*k,e[5]=(i*I-r*B+a*A)*k,e[6]=(g*y-h*E-m*v)*k,e[7]=(f*E-d*y+p*v)*k,e[8]=(s*M-o*B+u*S)*k,e[9]=(n*B-i*M-a*S)*k,e[10]=(h*x-_*y+m*b)*k,e[11]=(c*y-f*x-p*b)*k,e[12]=(o*A-s*T-l*S)*k,e[13]=(i*T-n*A+r*S)*k,e[14]=(_*v-h*w-g*b)*k,e[15]=(f*w-c*v+d*b)*k,e):null}function r(e,t,i){let n=t[0],r=t[1],a=t[2],s=t[3],o=t[4],l=t[5],u=t[6],f=t[7],c=t[8],d=t[9],p=t[10],h=t[11],_=t[12],g=t[13],m=t[14],b=t[15],v=i[0],y=i[1],w=i[2],x=i[3];return e[0]=v*n+y*o+w*c+x*_,e[1]=v*r+y*l+w*d+x*g,e[2]=v*a+y*u+w*p+x*m,e[3]=v*s+y*f+w*h+x*b,v=i[4],y=i[5],w=i[6],x=i[7],e[4]=v*n+y*o+w*c+x*_,e[5]=v*r+y*l+w*d+x*g,e[6]=v*a+y*u+w*p+x*m,e[7]=v*s+y*f+w*h+x*b,v=i[8],y=i[9],w=i[10],x=i[11],e[8]=v*n+y*o+w*c+x*_,e[9]=v*r+y*l+w*d+x*g,e[10]=v*a+y*u+w*p+x*m,e[11]=v*s+y*f+w*h+x*b,v=i[12],y=i[13],w=i[14],x=i[15],e[12]=v*n+y*o+w*c+x*_,e[13]=v*r+y*l+w*d+x*g,e[14]=v*a+y*u+w*p+x*m,e[15]=v*s+y*f+w*h+x*b,e}function a(e,t,i){let n,r,a,s,o,l,u,f,c,d,p,h,_=i[0],g=i[1],m=i[2];return t===e?(e[12]=t[0]*_+t[4]*g+t[8]*m+t[12],e[13]=t[1]*_+t[5]*g+t[9]*m+t[13],e[14]=t[2]*_+t[6]*g+t[10]*m+t[14],e[15]=t[3]*_+t[7]*g+t[11]*m+t[15]):(n=t[0],r=t[1],a=t[2],s=t[3],o=t[4],l=t[5],u=t[6],f=t[7],c=t[8],d=t[9],p=t[10],h=t[11],e[0]=n,e[1]=r,e[2]=a,e[3]=s,e[4]=o,e[5]=l,e[6]=u,e[7]=f,e[8]=c,e[9]=d,e[10]=p,e[11]=h,e[12]=n*_+o*g+c*m+t[12],e[13]=r*_+l*g+d*m+t[13],e[14]=a*_+u*g+p*m+t[14],e[15]=s*_+f*g+h*m+t[15]),e}function s(e,t,i){let n=i[0],r=i[1],a=i[2];return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e[4]=t[4]*r,e[5]=t[5]*r,e[6]=t[6]*r,e[7]=t[7]*r,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function o(e,t,i){let n=Math.sin(i),r=Math.cos(i),a=t[4],s=t[5],o=t[6],l=t[7],u=t[8],f=t[9],c=t[10],d=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*r+u*n,e[5]=s*r+f*n,e[6]=o*r+c*n,e[7]=l*r+d*n,e[8]=u*r-a*n,e[9]=f*r-s*n,e[10]=c*r-o*n,e[11]=d*r-l*n,e}function l(e,t,i){let n=Math.sin(i),r=Math.cos(i),a=t[0],s=t[1],o=t[2],l=t[3],u=t[4],f=t[5],c=t[6],d=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*r+u*n,e[1]=s*r+f*n,e[2]=o*r+c*n,e[3]=l*r+d*n,e[4]=u*r-a*n,e[5]=f*r-s*n,e[6]=c*r-o*n,e[7]=d*r-l*n,e}i.d(t,{fN:()=>u,Qr:()=>l,Tl:()=>a,hs:()=>s,B8:()=>n,aI:()=>f,eL:()=>o,lw:()=>r});let u=function(e,t,i,n,r){let a=1/Math.tan(t/2);if(e[0]=a/i,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,null!=r&&r!==1/0){let t=1/(n-r);e[10]=(r+n)*t,e[14]=2*r*n*t}else e[10]=-1,e[14]=-2*n;return e};function f(e,t){let i=e[0],n=e[1],r=e[2],a=e[3],s=e[4],o=e[5],l=e[6],u=e[7],f=e[8],c=e[9],d=e[10],p=e[11],h=e[12],_=e[13],g=e[14],m=e[15],b=t[0],v=t[1],y=t[2],w=t[3],x=t[4],E=t[5],S=t[6],A=t[7],B=t[8],T=t[9],M=t[10],I=t[11],k=t[12],O=t[13],L=t[14],P=t[15];return Math.abs(i-b)<=1e-6*Math.max(1,Math.abs(i),Math.abs(b))&&Math.abs(n-v)<=1e-6*Math.max(1,Math.abs(n),Math.abs(v))&&Math.abs(r-y)<=1e-6*Math.max(1,Math.abs(r),Math.abs(y))&&Math.abs(a-w)<=1e-6*Math.max(1,Math.abs(a),Math.abs(w))&&Math.abs(s-x)<=1e-6*Math.max(1,Math.abs(s),Math.abs(x))&&Math.abs(o-E)<=1e-6*Math.max(1,Math.abs(o),Math.abs(E))&&Math.abs(l-S)<=1e-6*Math.max(1,Math.abs(l),Math.abs(S))&&Math.abs(u-A)<=1e-6*Math.max(1,Math.abs(u),Math.abs(A))&&Math.abs(f-B)<=1e-6*Math.max(1,Math.abs(f),Math.abs(B))&&Math.abs(c-T)<=1e-6*Math.max(1,Math.abs(c),Math.abs(T))&&Math.abs(d-M)<=1e-6*Math.max(1,Math.abs(d),Math.abs(M))&&Math.abs(p-I)<=1e-6*Math.max(1,Math.abs(p),Math.abs(I))&&Math.abs(h-k)<=1e-6*Math.max(1,Math.abs(h),Math.abs(k))&&Math.abs(_-O)<=1e-6*Math.max(1,Math.abs(_),Math.abs(O))&&Math.abs(g-L)<=1e-6*Math.max(1,Math.abs(g),Math.abs(L))&&Math.abs(m-P)<=1e-6*Math.max(1,Math.abs(m),Math.abs(P))}},46540(e,t,i){function n(e,t,i){return e[0]=t[0]+i[0],e[1]=t[1]+i[1],e}function r(e,t){return e[0]=-t[0],e[1]=-t[1],e}function a(e,t,i,n){let r=t[0],a=t[1];return e[0]=r+n*(i[0]-r),e[1]=a+n*(i[1]-a),e}i.d(t,{Cc:()=>a,WQ:()=>n,ze:()=>r})},46803(e,t,i){function n(e,t,i){return e[0]=t[0]+i[0],e[1]=t[1]+i[1],e[2]=t[2]+i[2],e}function r(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e}i.d(t,{WQ:()=>n,lK:()=>a,ze:()=>r});let a=function(e,t,i){return e[0]=t[0]*i[0],e[1]=t[1]*i[1],e[2]=t[2]*i[2],e}},38564(e,t,i){var n,r;function a(){return!("object"==typeof process&&"[object process]"===String(process)&&!process?.browser)||function(){if("u">typeof window&&window.process?.type==="renderer"||"u">typeof process&&process.versions?.electron)return!0;let e="u">typeof navigator&&navigator.userAgent;return!!(e&&e.indexOf("Electron")>=0)}()}i.d(t,{h:()=>v});let s="4.1.2";function o(e,t){if(!e)throw Error(t||"Assertion failed")}function l(e){let t;if(!e)return 0;switch(typeof e){case"number":t=e;break;case"object":t=e.logLevel||e.priority||0;break;default:return 0}return o(Number.isFinite(t)&&t>=0),t}let u=()=>{};class f{constructor({level:e=0}={}){this.userData={},this._onceCache=new Set,this._level=e}set level(e){this.setLevel(e)}get level(){return this.getLevel()}setLevel(e){return this._level=e,this}getLevel(){return this._level}warn(e,...t){return this._log("warn",0,e,t,{once:!0})}error(e,...t){return this._log("error",0,e,t)}log(e,t,...i){return this._log("log",e,t,i)}info(e,t,...i){return this._log("info",e,t,i)}once(e,t,...i){return this._log("once",e,t,i,{once:!0})}_log(e,t,i,n,r={}){let a=function(e){let{logLevel:t,message:i}=e;e.logLevel=l(t);let n=e.args?Array.from(e.args):[];for(;n.length&&n.shift()!==i;);switch(typeof t){case"string":case"function":void 0!==i&&n.unshift(i),e.message=t;break;case"object":Object.assign(e,t)}"function"==typeof e.message&&(e.message=e.message());let r=typeof e.message;return o("string"===r||"object"===r),Object.assign(e,{args:n},e.opts)}({logLevel:t,message:i,args:this._buildArgs(t,i,n),opts:r});return this._createLogFunction(e,a,r)}_buildArgs(e,t,i){return[e,t,...i]}_createLogFunction(e,t,i){if(!this._shouldLog(t.logLevel))return u;let n=this._getOnceTag(i.tag??t.tag??t.message);if((i.once||t.once)&&void 0!==n){if(this._onceCache.has(n))return u;this._onceCache.add(n)}return this._emit(e,t)}_shouldLog(e){return this.getLevel()>=l(e)}_getOnceTag(e){if(void 0!==e)try{return"string"==typeof e?e:String(e)}catch{return}}}class c{constructor(e,t,i="sessionStorage"){this.storage=function(e){try{let t=window[e],i="__storage_test__";return t.setItem(i,i),t.removeItem(i),t}catch(e){return null}}(i),this.id=e,this.config=t,this._loadConfiguration()}getConfiguration(){return this.config}setConfiguration(e){if(Object.assign(this.config,e),this.storage){let e=JSON.stringify(this.config);this.storage.setItem(this.id,e)}}_loadConfiguration(){let e={};if(this.storage){let t=this.storage.getItem(this.id);e=t?JSON.parse(t):{}}return Object.assign(this.config,e),this}}function d(e){return"string"!=typeof e?e:n[e=e.toUpperCase()]||n.WHITE}(r=n||(n={}))[r.BLACK=30]="BLACK",r[r.RED=31]="RED",r[r.GREEN=32]="GREEN",r[r.YELLOW=33]="YELLOW",r[r.BLUE=34]="BLUE",r[r.MAGENTA=35]="MAGENTA",r[r.CYAN=36]="CYAN",r[r.WHITE=37]="WHITE",r[r.BRIGHT_BLACK=90]="BRIGHT_BLACK",r[r.BRIGHT_RED=91]="BRIGHT_RED",r[r.BRIGHT_GREEN=92]="BRIGHT_GREEN",r[r.BRIGHT_YELLOW=93]="BRIGHT_YELLOW",r[r.BRIGHT_BLUE=94]="BRIGHT_BLUE",r[r.BRIGHT_MAGENTA=95]="BRIGHT_MAGENTA",r[r.BRIGHT_CYAN=96]="BRIGHT_CYAN",r[r.BRIGHT_WHITE=97]="BRIGHT_WHITE";let p=globalThis,h=globalThis.process||{};class _{getHighResolutionTimer(){let e;if(a()&&p.performance)e=p?.performance?.now?.();else if("hrtime"in h){let t=h?.hrtime?.();e=1e3*t[0]+t[1]/1e6}else e=Date.now();return e}getMemoryUsageMB(){let e=p?.performance,t=e?.memory?.usedJSHeapSize;return null==t?null:Math.trunc(t/1024/1024)}}let g=new _;globalThis.Probe=_,globalThis.probe=g;let m={debug:a()&&console.debug||console.log,log:console.log,info:console.info,warn:console.warn,error:console.error},b={enabled:!0,level:0};class v extends f{constructor({id:e}={id:""}){super({level:0}),this.VERSION=s,this._startTs=g.getHighResolutionTimer(),this._deltaTs=g.getHighResolutionTimer(),this.userData={},this.LOG_THROTTLE_TIMEOUT=0,this.id=e,this.userData={},this._storage=new c(`__probe-${this.id}__`,{[this.id]:b}),this.timeStamp(`${this.id} started`),function(e,t=["constructor"]){for(let i of Object.getOwnPropertyNames(Object.getPrototypeOf(e))){let n=e[i];"function"!=typeof n||t.find(e=>i===e)||(e[i]=n.bind(e))}}(this),Object.seal(this)}isEnabled(){return this._getConfiguration().enabled}getLevel(){return this._getConfiguration().level}getTotal(){return Number((g.getHighResolutionTimer()-this._startTs).toPrecision(10))}getDelta(){return Number((g.getHighResolutionTimer()-this._deltaTs).toPrecision(10))}set priority(e){this.level=e}get priority(){return this.level}getPriority(){return this.level}enable(e=!0){return this._updateConfiguration({enabled:e}),this}setLevel(e){return this._updateConfiguration({level:e}),this}get(e){return this._getConfiguration()[e]}set(e,t){this._updateConfiguration({[e]:t})}settings(){console.table?console.table(this._storage.config):console.log(this._storage.config)}assert(e,t){if(!e)throw Error(t||"Assertion failed")}warn(e,...t){return this._log("warn",0,e,t,{method:m.warn,once:!0})}error(e,...t){return this._log("error",0,e,t,{method:m.error})}deprecated(e,t){return this.warn(`\`${e}\` is deprecated and will be removed \
in a later version. Use \`${t}\` instead`)}removed(e,t){return this.error(`\`${e}\` has been removed. Use \`${t}\` instead`)}probe(e,t,...i){let n=g.getMemoryUsageMB();if(null!==n){let e=`${n}MB `;"function"==typeof t?t=()=>`${e}${t()}`:"string"==typeof t&&(t=`${e}${t}`)}return this._log("log",e,t,i,{method:m.log,time:!0,once:!0})}log(e,t,...i){return this._log("log",e,t,i,{method:m.debug})}info(e,t,...i){return this._log("info",e,t,i,{method:console.info})}once(e,t,...i){return this._log("once",e,t,i,{method:m.debug||m.info,once:!0})}table(e,t,i){return t?this._log("table",e,t,i&&[i]||[],{method:console.table||u,tag:function(e){for(let t in e)for(let i in e[t])return i||"untitled";return"empty"}(t)}):u}time(e,t){return this._log("time",e,t,[],{method:console.time?console.time:console.info})}timeEnd(e,t){return this._log("time",e,t,[],{method:console.timeEnd?console.timeEnd:console.info})}timeStamp(e,t){return this._log("time",e,t,[],{method:console.timeStamp||u})}group(e,t,i={collapsed:!1}){let n=(i.collapsed?console.groupCollapsed:console.group)||console.info;return this._log("group",e,t,[],{method:n})}groupCollapsed(e,t,i={}){return this.group(e,t,Object.assign({},i,{collapsed:!0}))}groupEnd(e){return this._log("groupEnd",e,"",[],{method:console.groupEnd||u})}withGroup(e,t,i){this.group(e,t)();try{i()}finally{this.groupEnd(e)()}}trace(){console.trace&&console.trace()}_shouldLog(e){return this.isEnabled()&&super._shouldLog(e)}_emit(e,t){let i=t.method;o(i),t.total=this.getTotal(),t.delta=this.getDelta(),this._deltaTs=g.getHighResolutionTimer();let n=function(e,t,i){if("string"==typeof t){var n;let r=i.time?function(e,t=8){let i=Math.max(t-e.length,0);return`${" ".repeat(i)}${e}`}((n=i.total)<10?`${n.toFixed(2)}ms`:n<100?`${n.toFixed(1)}ms`:n<1e3?`${n.toFixed(0)}ms`:`${(n/1e3).toFixed(2)}s`):"";t=function(e,t,i){if(!a&&"string"==typeof e){if(t){let i=d(t);e=`\u001b[${i}m${e}\u001b[39m`}if(i){let t=d(i);e=`\u001b[${t+10}m${e}\u001b[49m`}}return e}(t=i.time?`${e}: ${r}  ${t}`:`${e}: ${t}`,i.color,i.background)}return t}(this.id,t.message,t);return i.bind(console,n,...t.args)}_getConfiguration(){return this._storage.config[this.id]||this._updateConfiguration(b),this._storage.config[this.id]}_updateConfiguration(e){let t=this._storage.config[this.id]||{...b};this._storage.setConfiguration({[this.id]:{...t,...e}})}}v.VERSION=s},29947(e,t,i){function n(){let e;if("u">typeof window&&window.performance)e=window.performance.now();else if("u">typeof process&&process.hrtime){let t=process.hrtime();e=1e3*t[0]+t[1]/1e6}else e=Date.now();return e}i.d(t,{A:()=>a});class r{constructor(e,t){this.sampleSize=1,this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this.name=e,this.type=t,this.reset()}reset(){return this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this}setSampleSize(e){return this.sampleSize=e,this}incrementCount(){return this.addCount(1),this}decrementCount(){return this.subtractCount(1),this}addCount(e){return this._count+=e,this._samples++,this._checkSampling(),this}subtractCount(e){return this._count-=e,this._samples++,this._checkSampling(),this}addTime(e){return this._time+=e,this.lastTiming=e,this._samples++,this._checkSampling(),this}timeStart(){return this._startTime=n(),this._timerPending=!0,this}timeEnd(){return this._timerPending&&(this.addTime(n()-this._startTime),this._timerPending=!1,this._checkSampling()),this}getSampleAverageCount(){return this.sampleSize>0?this.lastSampleCount/this.sampleSize:0}getSampleAverageTime(){return this.sampleSize>0?this.lastSampleTime/this.sampleSize:0}getSampleHz(){return this.lastSampleTime>0?this.sampleSize/(this.lastSampleTime/1e3):0}getAverageCount(){return this.samples>0?this.count/this.samples:0}getAverageTime(){return this.samples>0?this.time/this.samples:0}getHz(){return this.time>0?this.samples/(this.time/1e3):0}_checkSampling(){this._samples===this.sampleSize&&(this.lastSampleTime=this._time,this.lastSampleCount=this._count,this.count+=this._count,this.time+=this._time,this.samples+=this._samples,this._time=0,this._count=0,this._samples=0)}}class a{constructor(e){this.stats={},this.id=e.id,this.stats={},this._initializeStats(e.stats),Object.seal(this)}get(e,t="count"){return this._getOrCreate({name:e,type:t})}get size(){return Object.keys(this.stats).length}reset(){for(let e of Object.values(this.stats))e.reset();return this}forEach(e){for(let t of Object.values(this.stats))e(t)}getTable(){let e={};return this.forEach(t=>{e[t.name]={time:t.time||0,count:t.count||0,average:t.getAverageTime()||0,hz:t.getHz()||0}}),e}_initializeStats(e=[]){e.forEach(e=>this._getOrCreate(e))}_getOrCreate(e){let{name:t,type:i}=e,n=this.stats[t];return n||(n=e instanceof r?e:new r(t,i),this.stats[t]=n),n}}},92767(e,t,i){var n,r,a,s,o,l;i.d(t,{Cx:()=>R,uq:()=>U,Cp:()=>N,EU:()=>en,h1:()=>q}),(s=n||(n={}))[s.Start=1]="Start",s[s.Move=2]="Move",s[s.End=4]="End",s[s.Cancel=8]="Cancel",(o=r||(r={}))[o.None=0]="None",o[o.Left=1]="Left",o[o.Right=2]="Right",o[o.Up=4]="Up",o[o.Down=8]="Down",o[o.Horizontal=3]="Horizontal",o[o.Vertical=12]="Vertical",o[o.All=15]="All",(l=a||(a={}))[l.Possible=1]="Possible",l[l.Began=2]="Began",l[l.Changed=4]="Changed",l[l.Ended=8]="Ended",l[l.Recognized=8]="Recognized",l[l.Cancelled=16]="Cancelled",l[l.Failed=32]="Failed";let u="manipulation";class f{constructor(e,t){this.actions="",this.manager=e,this.set(t)}set(e){"compute"===e&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));var t=e.join(" ");if(t.includes("none"))return"none";let i=t.includes("pan-x"),n=t.includes("pan-y");return i&&n?"none":i||n?i?"pan-x":"pan-y":t.includes(u)?u:"auto"}}function c(e){return e.trim().split(/\s+/g)}function d(e,t,i){if(e)for(let n of c(t))e.addEventListener(n,i,!1)}function p(e,t,i){if(e)for(let n of c(t))e.removeEventListener(n,i,!1)}function h(e){return(e.ownerDocument||e).defaultView}function _(e){let t=e.length;if(1===t)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let i=0,n=0,r=0;for(;r<t;)i+=e[r].clientX,n+=e[r].clientY,r++;return{x:Math.round(i/t),y:Math.round(n/t)}}function g(e){let t=[],i=0;for(;i<e.pointers.length;)t[i]={clientX:Math.round(e.pointers[i].clientX),clientY:Math.round(e.pointers[i].clientY)},i++;return{timeStamp:Date.now(),pointers:t,center:_(t),deltaX:e.deltaX,deltaY:e.deltaY}}function m(e,t){let i=t.x-e.x,n=t.y-e.y;return Math.sqrt(i*i+n*n)}function b(e,t){let i=t.clientX-e.clientX,n=t.clientY-e.clientY;return Math.sqrt(i*i+n*n)}function v(e,t){let i=t.clientX-e.clientX;return 180*Math.atan2(t.clientY-e.clientY,i)/Math.PI}function y(e,t){return e===t?r.None:Math.abs(e)>=Math.abs(t)?e<0?r.Left:r.Right:t<0?r.Up:r.Down}function w(e,t,i){return{x:t/e||0,y:i/e||0}}function x(e,t){return"pointerId"in e?e.pointerId:t}function E(e,t){e.movementOrigin=new Map(t.map((e,t)=>[x(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}class S{constructor(e){this.evEl="",this.evWin="",this.evTarget="",this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){var i;let r,a,s,o,l;i=this.manager,r=t.pointers.length,a=t.changedPointers.length,s=e&n.Start&&r-a==0,o=e&(n.End|n.Cancel)&&r-a==0,t.isFirst=!!s,t.isFinal=!!o,s&&(i.session={}),t.eventType=e,l=function(e,t){var i,r;let a,s,o,l,u,{session:f}=e,{pointers:c}=t,{length:d}=c;f.firstInput||(f.firstInput=g(t)),d>1&&!f.firstMultiple?f.firstMultiple=g(t):1===d&&(f.firstMultiple=!1);let{firstInput:p,firstMultiple:h}=f,S=h?h.center:p.center,A=t.center=_(c);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-p.timeStamp;let B=t.pointers.map(x);if(f.movementOrigin?.size===B.length&&B.every(e=>f.movementOrigin.has(e))||E(f,t.pointers),t.distancePerPointer=t.pointers.map((e,t)=>b(f.movementOrigin.get(B[t]),e)),t.eventType&n.Move&&t.distancePerPointer.some(e=>e>0)&&(f.firstMovementTime??(f.firstMovementTime=t.timeStamp)),t.movementDeltaTime=void 0===f.firstMovementTime?0:t.timeStamp-f.firstMovementTime,t.eventType&(n.End|n.Cancel)){let e=t.changedPointers.map(e=>x(e,t.pointers.indexOf(e)));E(f,t.pointers.filter((t,i)=>!e.includes(B[i])))}a=A.x-S.x,t.angle=180*Math.atan2(A.y-S.y,a)/Math.PI,t.distance=m(S,A);let{deltaX:T,deltaY:M}=(s=t.center,o=f.offsetDelta,l=f.prevDelta,u=f.prevInput,(t.eventType===n.Start||u?.eventType===n.End)&&(l=f.prevDelta={x:u?.deltaX||0,y:u?.deltaY||0},o=f.offsetDelta={x:s.x,y:s.y}),{deltaX:l.x+(s.x-o.x),deltaY:l.y+(s.y-o.y)});t.deltaX=T,t.deltaY=M,t.offsetDirection=y(t.deltaX,t.deltaY);let I=w(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=I.x,t.overallVelocityY=I.y,t.overallVelocity=Math.abs(I.x)>Math.abs(I.y)?I.x:I.y,t.scale=h?(i=h.pointers,b(c[0],c[1])/b(i[0],i[1])):1,t.rotation=h?(r=h.pointers,v(c[1],c[0])-v(r[1],r[0])):0,t.maxPointers=f.prevInput?t.pointers.length>f.prevInput.maxPointers?t.pointers.length:f.prevInput.maxPointers:t.pointers.length;let k=e.element;return function(e,t){let i=e;for(;i;){if(i===t)return!0;i=i.parentNode}return!1}(t.srcEvent.target,k)&&(k=t.srcEvent.target),t.target=k,!function(e,t){let i,r,a,s,o=e.lastInterval||t,l=t.timeStamp-o.timeStamp;if(t.eventType!==n.Cancel&&(l>25||void 0===o.velocity)){let n=t.deltaX-o.deltaX,u=t.deltaY-o.deltaY,f=w(l,n,u);r=f.x,a=f.y,i=Math.abs(f.x)>Math.abs(f.y)?f.x:f.y,s=y(n,u),e.lastInterval=t}else i=o.velocity,r=o.velocityX,a=o.velocityY,s=o.direction;t.velocity=i,t.velocityX=r,t.velocityY=a,t.direction=s}(f,t),t}(i,t),i.emit("hammer.input",l),i.recognize(l),i.session.prevInput=l}init(){d(this.element,this.evEl,this.domHandler),d(this.target,this.evTarget,this.domHandler),d(h(this.element),this.evWin,this.domHandler)}destroy(){p(this.element,this.evEl,this.domHandler),p(this.target,this.evTarget,this.domHandler),p(h(this.element),this.evWin,this.domHandler)}}let A={pointerdown:n.Start,pointermove:n.Move,pointerup:n.End,pointercancel:n.Cancel,pointerout:n.Cancel};class B extends S{constructor(e){super(e),this.evEl="pointerdown",this.evWin="pointermove pointerup pointercancel",this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,i=!1,r=A[e.type],a=e.pointerType,s="touch"===a,o=t.findIndex(t=>t.pointerId===e.pointerId);r&n.Start&&(e.buttons||s)?o<0&&(t.push(e),o=t.length-1):r&(n.End|n.Cancel)&&(i=!0),!(o<0)&&(t[o]=e,this.callback(r,{pointers:t,changedPointers:[e],eventType:r,pointerType:a,srcEvent:e}),i&&t.splice(o,1))}}let T=["","webkit","Moz","MS","ms","o"],M={touchAction:"compute",enable:!0,inputTarget:null,cssProps:{userSelect:"none",userDrag:"none",touchCallout:"none",tapHighlightColor:"rgba(0,0,0,0)"}};class I{constructor(e,t){this.options={...M,...t,cssProps:{...M.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new B(this),this.touchAction=new f(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?2:1}recognize(e){let t,{session:i}=this;if(i.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let{recognizers:n}=this,{curRecognizer:r}=i;(!r||r&&r.state&a.Recognized)&&(r=i.curRecognizer=null);let s=0;for(;s<n.length;)t=n[s],2!==i.stopped&&(!r||t===r||t.canRecognizeWith(r))?t.recognize(e):t.reset(),!r&&t.state&(a.Began|a.Changed|a.Ended)&&(r=i.curRecognizer=t),s++}get(e){let{recognizers:t}=this;for(let i=0;i<t.length;i++)if(t[i].options.event===e)return t[i];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t="string"==typeof e?this.get(e):e;if(t){let{recognizers:e}=this,i=e.indexOf(t);-1!==i&&(e.splice(i,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:i}=this;for(let n of c(e))i[n]=i[n]||[],i[n].push(t)}off(e,t){if(!e)return;let{handlers:i}=this;for(let n of c(e))t?i[n]&&i[n].splice(i[n].indexOf(t),1):delete i[n]}emit(e,t){let i=this.handlers[e]&&this.handlers[e].slice();if(!i||!i.length)return;t.type=e,t.preventDefault=function(){t.srcEvent.preventDefault()};let n=0;for(;n<i.length;)i[n](t),n++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[i,n]of Object.entries(this.options.cssProps)){let r=function(e,t){let i=t[0].toUpperCase()+t.slice(1);for(let n of T){let r=n?n+i:t;if(r in e)return r}}(t.style,i);e?(this.oldCssProps[r]=t.style[r],t.style[r]=n):t.style[r]=this.oldCssProps[r]||""}e||(this.oldCssProps={})}}}let k=1;function O(e){return e&a.Cancelled?"cancel":e&a.Ended?"end":e&a.Changed?"move":e&a.Began?"start":""}class L{constructor(e){this.options=e,this.id=k++,this.state=a.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:i}=this;return i[t.id]||(i[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}return(t="string"==typeof e?this.manager.get(e):e)&&delete this.simultaneous[t.id],this}requireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:i}=this;return -1===i.indexOf(t)&&(i.push(t),t.requireFailure(this)),this}dropRequireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}if(t="string"==typeof e?this.manager.get(e):e){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<a.Ended&&this.manager.emit(this.options.event+O(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=a.Ended&&this.manager.emit(this.options.event+O(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=a.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(a.Failed|a.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=a.Failed;return}this.state&(a.Recognized|a.Cancelled|a.Failed)&&(this.state=a.Possible),this.state=this.process(t),this.state&(a.Began|a.Changed|a.Ended|a.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}}class P extends L{attrTest(e){let t=this.options.pointers;return 0===t||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>{var i,n;return i=e,(void 0===(n=t).distance||i.distance>=n.distance)&&(void 0===n.distancePerPointer||i.distancePerPointer.length>0&&i.distancePerPointer.every(e=>e>=n.distancePerPointer))&&(void 0===n.movementDeltaTime||i.movementDeltaTime>=n.movementDeltaTime)&&(void 0===n.rotation||Math.abs(((i.rotation+180)%360+360)%360-180)>=n.rotation)&&(void 0===n.scale||Math.abs(i.scale-1)>=n.scale)})}process(e){let{state:t}=this,{eventType:i}=e,r=t&(a.Began|a.Changed),s=this.attrTest(e);return r&&(i&n.Cancel||!s)?t|a.Cancelled:r||s?i&n.End?t|a.Ended:t&a.Began?t|a.Changed:a.Began:a.Failed}}let C=["","start","move","end","cancel"];class N extends L{constructor(e={}){super({enable:!0,event:"doubleclickdrag",pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[u]}getEventNames(){return C.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length!==t.pointers?(this.reset(),a.Failed):e.eventType&n.Start?this._handleStart(e):e.eventType&n.Move?this._handleMove(e):e.eventType&n.Cancel?this._handleEnd(e,!0):e.eventType&n.End?this._handleEnd(e,!1):a.Failed}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===a.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===a.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===a.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===a.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,a.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,a.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return a.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?a.Began:(this._drag.active=!0,e.scale=Math.pow(2,t/this.options.pixelsPerScale),this._emittedStart?a.Changed:a.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:i,startCenter:n}=this._drag;if(this._drag=null,this._tapStart=null,this._lastTap=null,!i)return this._emittedStart=!1,a.Failed;let r=n.y-e.center.y;return e.scale=Math.pow(2,r/this.options.pixelsPerScale),t?a.Cancelled:a.Ended}return this._tapStart&&this._isSamePointer(e,this._tapStart.pointerId)?(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null):t&&this.reset(),a.Failed}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&m(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return"pointerId"in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return null===t||this._getPointerId(e)===t}}class R extends L{constructor(e={}){super({enable:!0,event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[u]}process(e){let{options:t}=this,i=e.pointers.length===t.pointers,r=e.distance<t.threshold,s=e.deltaTime<t.time;if(this.reset(),e.eventType&n.Start&&0===this.count)return this.failTimeout();if(r&&s&&i){if(e.eventType!==n.End)return this.failTimeout();let i=!this.pTime||e.timeStamp-this.pTime<t.interval,r=!this.pCenter||m(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,r&&i?this.count+=1:this.count=1,this._input=e,0==this.count%t.taps)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=a.Recognized,this.tryEmit(this._input)},t.interval),a.Began):a.Recognized}return a.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=a.Failed},this.options.interval),a.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===a.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}}class F extends P{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{"trackpad"===e.device&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...i}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(i),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:i}=e,n=t.deltaX??e.deltaX,r=t.deltaY??e.deltaY,a=y(n,r),s=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY);return{pointers:[i,i],changedPointers:[i,i],pointerType:"trackpad",srcEvent:i,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:n,deltaY:r,angle:180*Math.atan2(r,n)/Math.PI,distance:Math.sqrt(n*n+r*r),distancePerPointer:[s,s],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:a,offsetDirection:a,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:i.target||this.manager.element,additionalEvent:"",...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&2===this.options.pointers);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}}let z=["","start","move","end","cancel","up","down","left","right"];class U extends F{constructor(e={}){super({enable:!0,pointers:1,event:"pan",threshold:10,direction:r.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&r.Horizontal&&t.push("pan-y"),e&r.Vertical&&t.push("pan-x"),t}getEventNames(){return z.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,i=!0,{distance:n}=e,{direction:a}=e,s=e.deltaX,o=e.deltaY;return a&t.direction||(t.direction&r.Horizontal?(a=0===s?r.None:s<0?r.Left:r.Right,i=s!==this.pX,n=Math.abs(e.deltaX)):(a=0===o?r.None:o<0?r.Up:r.Down,i=o!==this.pY,n=Math.abs(e.deltaY))),e.direction=a,i&&n>t.threshold&&!!(a&t.direction)}attrTest(e){let t=!!(this.state&a.Began),i=!(this.options.coherent?.length&&e.eventType&(n.End|n.Cancel));return super.attrTest(e)&&(t||i&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=r[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(a.Recognized|a.Cancelled|a.Failed)&&(this.state=a.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}}let D=["","start","move","end","cancel","in","out"];class q extends F{constructor(e={}){super({enable:!0,event:"pinch",threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return["none"]}getEventNames(){return D.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,i=!!(this.state&a.Began),r=!(t&&e.eventType&(n.End|n.Cancel));return super.attrTest(e)&&(i||r&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(1!==e.scale){let t=e.scale<1?"in":"out";e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(a.Recognized|a.Cancelled|a.Failed)&&(this.state=a.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}}class ${constructor(e,t,i){this.element=e,this.callback=t,this.options=i}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}}let H=-1!==("u">typeof navigator&&navigator.userAgent?navigator.userAgent.toLowerCase():"").indexOf("firefox");class W extends ${constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&(H&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=40)),e.shiftKey&&t&&(t*=.25),this.callback({type:"wheel",center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??"unknown",srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen("wheel",!0))}destroy(){this.listen("wheel",!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){"wheel"===e&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen("wheel",t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}}let V={classificationDelay:32,endDelay:80};class j{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{var t,i;let n,r;if(!this.hasSubscribers)return"unknown";let a=(t=e,i=this.pressedControlKeys.size>0,n=t.deltaX,r=t.deltaY,1===t.deltaMode&&(n*=40,r*=40),{event:t,timeStamp:t.timeStamp,deltaX:n,deltaY:r,isControlKeyDown:i}),s=this.session;if(s&&a.timeStamp-s.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return"unknown";s=null}s?(this.scheduleEnd(),this.addSample(s,a)):(s=this.startPendingSession(a),this.scheduleEnd());let{device:o}=s;return"unknown"===o&&"unknown"!==(o=Y(s.samples,!1))&&this.begin(s,o),o},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||"unknown"!==this.session.device)return;let e=this.session,t=Y(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)},this.end=()=>{if(!this.session)return;if("unknown"===this.session.device){let e=this.session,t=Y(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)}if(!this.session)return;let e=this.session;this.emit(n.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{"Control"===e.key&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{"Control"===e.key&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...V,...t},this.element?.addEventListener("wheel",this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??"unknown"}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&"unknown"!==e.device&&this.emit(n.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener("wheel",this.handleEvent)}startPendingSession(e){let t={samples:[e],device:"unknown",firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,"unknown"!==e.device){let i=e.samples[e.samples.length-2],r=t.timeStamp-i.timeStamp;e.velocityX=r>0?t.deltaX/r:0,e.velocityY=r>0?t.deltaY/r:0,this.emit(n.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(n.Start,e.samples[0].event);let i=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=i>0?e.totalDeltaX/i:0,e.velocityY=i>0?e.totalDeltaY/i:0,this.emit(n.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,i){let r=this.session;if(!r||"unknown"===r.device)return;let a=e===n.Start,s=e===n.End||e===n.Cancel,o=a?r.firstTimeStamp:r.lastTimeStamp,l=a?0:Math.max(0,o-r.firstTimeStamp),u=a?0:r.totalDeltaX,f=a?0:r.totalDeltaY,c=l>0?u/l:0,d=l>0?f/l:0,p=a?0:i?.velocityX??r.velocityX,h=a?0:i?.velocityY??r.velocityY,_={eventType:e,device:r.device,srcEvent:t,timeStamp:o,center:{x:t.clientX,y:t.clientY},deltaX:u,deltaY:f,deltaTime:l,velocity:Math.abs(p)>Math.abs(h)?p:h,velocityX:p,velocityY:h,overallVelocity:Math.abs(c)>Math.abs(d)?c:d,overallVelocityX:c,overallVelocityY:d,isFirst:a,isFinal:s};for(let{listener:e}of[...this.subscriptions.values()])e(_)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){null!==this.classificationTimer&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){null!==this.endTimer&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t="u">typeof window?window:globalThis.document?.defaultView;t&&e!==this.listeningForControlKeys&&(this.listeningForControlKeys=e,e?(t.addEventListener("keydown",this.handleKeyDown,!0),t.addEventListener("keyup",this.handleKeyUp,!0),t.addEventListener("blur",this.handleWindowBlur)):(t.removeEventListener("keydown",this.handleKeyDown,!0),t.removeEventListener("keyup",this.handleKeyUp,!0),t.removeEventListener("blur",this.handleWindowBlur),this.pressedControlKeys.clear()))}}function Y(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?"trackpad":e.some(({event:e})=>0!==e.deltaMode)||e.some(X)||e.every(({event:e})=>{let t=e.wheelDelta;return void 0!==t&&Math.abs(t)%40==0})?"mouse":e.some(({deltaX:e})=>0!==e)||e.length>1&&function(e){for(let t=0;t<e.length;t++){let i=e[t];if(Math.abs(i.deltaX)>40||Math.abs(i.deltaY)>40||t>0&&i.timeStamp-e[t-1].timeStamp>40)return!1}return!0}(e)?"trackpad":t?"mouse":"unknown"}function X({event:e,deltaX:t,deltaY:i}){if(0!==t||0===i)return!1;if(Number.isInteger(Math.abs(i/4.000244140625)))return!0;let n=e.wheelDelta;return"number"==typeof n&&0!==n&&n%120==0}let G=["mousedown","mousemove","mouseup","mouseover","mouseout","mouseenter","mouseleave"];class Z extends ${constructor(e,t,i){super(e,t,{enable:!0,...i}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:n=!1}=this.options;this.enableMoveEvent=n,this.enableLeaveEvent=n,this.enableEnterEvent=n,this.enableOutEvent=n,this.enableOverEvent=n,n&&G.forEach(e=>this.listen(e,!0))}destroy(){G.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case"pointermove":this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen("mousedown",t),this.listen("mousemove",t),this.listen("mouseup",t));break;case"pointerover":this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen("mouseover",t));break;case"pointerout":this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen("mouseout",t));break;case"pointerenter":this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen("mouseenter",t));break;case"pointerleave":this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen("mouseleave",t))}}handleOverEvent(e){this.enableOverEvent&&"mouseover"===e.type&&this._emit("pointerover",e)}handleOutEvent(e){this.enableOutEvent&&"mouseout"===e.type&&this._emit("pointerout",e)}handleEnterEvent(e){this.enableEnterEvent&&"mouseenter"===e.type&&this._emit("pointerenter",e)}handleLeaveEvent(e){this.enableLeaveEvent&&"mouseleave"===e.type&&this._emit("pointerleave",e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case"mousedown":e.button>=0&&(this.pressed=!0);break;case"mousemove":0===e.buttons&&(this.pressed=!1),this.pressed||this._emit("pointermove",e);break;case"mouseup":this.pressed=!1}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:"mouse",target:t.target})}}let K=["keydown","keyup"];class Q extends ${constructor(e,t,i){super(e,t,{enable:!0,tabIndex:0,...i}),this.handleEvent=e=>{let t=e.target||e.srcElement;("INPUT"!==t.tagName||"text"!==t.type)&&"TEXTAREA"!==t.tagName&&(this.enableDownEvent&&"keydown"===e.type&&this.callback({type:"keydown",srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&"keyup"===e.type&&this.callback({type:"keyup",srcEvent:e,key:e.key,target:e.target}))};let{enable:n=!1}=this.options;this.enableDownEvent=n,this.enableUpEvent=n,e.tabIndex=this.options.tabIndex,e.style.outline="none",n&&K.forEach(e=>this.listen(e,!0))}destroy(){K.forEach(e=>this.listen(e,!1))}enableEventType(e,t){"keydown"===e&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),"keyup"===e&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}}class J extends ${constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{this.options.enable&&this.callback({type:"contextmenu",center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&this.listen("contextmenu",!0)}destroy(){this.listen("contextmenu",!1)}enableEventType(e,t){"contextmenu"===e&&this.options.enable!==t&&(this.options.enable=t,this.listen("contextmenu",t))}}let ee={pointerdown:1,pointermove:2,pointerup:4,mousedown:1,mousemove:2,mouseup:4},et={srcElement:"root",priority:0};class ei{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),i=e.srcEvent.target;for(;i&&i!==t.rootElement;){if(this._emit(t,i),t.handled)return;i=i.parentNode}this._emit(t,"root")},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,i,n=!1,r=!1){let{handlers:a,handlersByElement:s}=this,o={...et,...i},l=s.get(o.srcElement);l||(l=[],s.set(o.srcElement,l));let u={type:e,handler:t,srcElement:o.srcElement,priority:o.priority};n&&(u.once=!0),r&&(u.passive=!0),a.push(u),this._active=this._active||!u.passive;let f=l.length-1;for(;f>=0&&!(l[f].priority>=u.priority);)f--;l.splice(f+1,0,u)}remove(e,t){let{handlers:i,handlersByElement:n}=this;for(let r=i.length-1;r>=0;r--){let a=i[r];if(a.type===e&&a.handler===t){i.splice(r,1);let e=n.get(a.srcElement);e.splice(e.indexOf(a),1),0===e.length&&n.delete(a.srcElement)}}this._active=i.some(e=>!e.passive)}_emit(e,t){let i=this.handlersByElement.get(t);if(i){let t=!1,n=()=>{e.handled=!0},r=()=>{e.handled=!0,t=!0},a=[];for(let s=0;s<i.length;s++){let{type:o,handler:l,once:u}=i[s];if(l({...e,type:o,stopPropagation:n,stopImmediatePropagation:r}),u&&a.push(i[s]),t)break}for(let e=0;e<a.length;e++){let{type:t,handler:i}=a[e];this.remove(t,i)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...function(e){let t=ee[e.srcEvent.type];if(!t)return null;let{buttons:i,button:n}=e.srcEvent,r=!1,a=!1,s=!1;return 2===t?(r=!!(1&i),a=!!(4&i),s=!!(2&i)):(r=0===n,a=1===n,s=2===n),{leftButton:r,middleButton:a,rightButton:s}}(e),...function(e,t){let i=e.center;if(!i)return null;let n=t.getBoundingClientRect(),r=n.width/t.offsetWidth||1,a=n.height/t.offsetHeight||1,s={x:(i.x-n.left-t.clientLeft)/r,y:(i.y-n.top-t.clientTop)/a};return{center:i,offsetCenter:s}}(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}}class en{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:"compute",tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new j(e),!e)return;for(let t of(this.manager=new I(e,this.options),this.options.recognizers)){let{recognizer:e,recognizeWith:i,requireFailure:n}=function(e){let t;if("recognizer"in e)return e;let i=Array.isArray(e)?[...e]:[e];return{recognizer:t="function"==typeof i[0]?new(i.shift())(i.shift()||{}):i.shift(),recognizeWith:"string"==typeof i[0]?[i[0]]:i[0],requireFailure:"string"==typeof i[1]?[i[1]]:i[1]}}(t);this.manager.add(e),i&&e.recognizeWith(i),n&&e.requireFailure(n)}this.manager.on("hammer.input",this._onBasicInput),this.wheelInput=new W(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new Z(e,this._onOtherEvent,{enable:!1}),this.keyInput=new Q(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new J(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}getElement(){return this.element}destroy(){this.element?(this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()):this.wheelSession.destroy()}on(e,t,i){this._addEventHandler(e,t,i,!1)}once(e,t,i){this._addEventHandler(e,t,i,!0)}watch(e,t,i){this._addEventHandler(e,t,i,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:i}=this;if(!i)return;let n=i.get(e);n&&(n.set({enable:t,wheelSession:this.wheelSession}),i.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,i,n,r){if("string"!=typeof e){for(let[a,s]of(i=t,Object.entries(e)))this._addEventHandler(a,s,i,n,r);return}let{manager:a,events:s}=this;if(!a)return;let o=s.get(e);!o&&(o=new ei(this,this._getRecognizerName(e)||e),s.set(e,o),a&&a.on(e,o.handleEvent)),o.add(e,t,i,n,r),o.isEmpty()||this._toggleRecognizer(o.recognizerName,!0)}_removeEventHandler(e,t){if("string"!=typeof e){for(let[t,i]of Object.entries(e))this._removeEventHandler(t,i);return}let{events:i}=this,n=i.get(e);if(n&&(n.remove(e,t),n.isEmpty())){let{recognizerName:e}=n,t=!1;for(let n of i.values())if(n.recognizerName===e&&!n.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}}}}]);
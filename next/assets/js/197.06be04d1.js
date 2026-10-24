"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["197"],{43078(e,t,n){n.d(t,{J0:()=>k,Kr:()=>C,NT:()=>y,Nf:()=>w,hb:()=>_,li:()=>f,vJ:()=>x});var i,o,r,a,s=n(60616),d=0,l=[],c=s.fF,p=c.__b,h=c.__r,g=c.diffed,u=c.__c,m=c.unmount,b=c.__;function v(e,t){c.__h&&c.__h(o,e,d||t),d=0;var n=o.__H||(o.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({}),n.__[e]}function k(e){return d=1,function(e,t){var n=v(i++,2);if(n.t=e,!n.__c&&(n.__=[T(void 0,t),function(e){var t=n.__N?n.__N[0]:n.__[0],i=n.t(t,e);t!==i&&(n.__N=[i,n.__[1]],n.__c.setState({}))}],n.__c=o,!o.__f)){var r=function(e,t,i){if(!n.__c.__H)return!0;var o=!1,r=n.__c.props!==e;if(n.__c.__H.__.some(function(e){if(e.__N){o=!0;var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(r=!0)}}),a){var s=a.call(this,e,t,i);return o?s||r:s}return!o||r};o.__f=!0;var a=o.shouldComponentUpdate,s=o.componentWillUpdate;o.componentWillUpdate=function(e,t,n){if(this.__e){var i=a;a=void 0,r(e,t,n),a=i}s&&s.call(this,e,t,n)},o.shouldComponentUpdate=r}return n.__N||n.__}(T,e)}function x(e,t){var n=v(i++,3);!c.__s&&M(n.__H,t)&&(n.__=e,n.u=t,o.__H.__h.push(n))}function w(e,t){var n=v(i++,4);!c.__s&&M(n.__H,t)&&(n.__=e,n.u=t,o.__h.push(n))}function f(e){return d=5,C(function(){return{current:e}},[])}function C(e,t){var n=v(i++,7);return M(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function _(e,t){return d=8,C(function(){return e},t)}function y(e){var t=o.context[e.__c],n=v(i++,9);return n.c=e,t?(null==n.__&&(n.__=!0,t.sub(o)),t.props.value):e.__}function z(){for(var e;e=l.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(P),t.__h.some(E),t.__h=[]}catch(n){t.__h=[],c.__e(n,e.__v)}}}c.__b=function(e){o=null,p&&p(e)},c.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),b&&b(e,t)},c.__r=function(e){h&&h(e),i=0;var t=(o=e.__c).__H;t&&(r===o?(t.__h=[],o.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(P),t.__h.some(E),t.__h=[],i=0)),r=o},c.diffed=function(e){g&&g(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(1!==l.push(t)&&a===c.requestAnimationFrame||((a=c.requestAnimationFrame)||function(e){var t,n=function(){clearTimeout(i),H&&cancelAnimationFrame(t),setTimeout(e)},i=setTimeout(n,35);H&&(t=requestAnimationFrame(n))})(z)),t.__H.__.some(function(e){e.u&&(e.__H=e.u,e.u=void 0)})),r=o=null},c.__c=function(e,t){t.some(function(e){try{e.__h.some(P),e.__h=e.__h.filter(function(e){return!e.__||E(e)})}catch(n){t.some(function(e){e.__h&&(e.__h=[])}),t=[],c.__e(n,e.__v)}}),u&&u(e,t)},c.unmount=function(e){m&&m(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{P(e)}catch(e){t=e}}),n.__H=void 0,t&&c.__e(t,n.__v))};var H="function"==typeof requestAnimationFrame;function P(e){var t=o,n=e.__c;"function"==typeof n&&(e.__c=void 0,n()),o=t}function E(e){var t=o;e.__c=e.__(),o=t}function M(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function T(e,t){return"function"==typeof t?t(e):t}},81413(e,t,n){n.d(t,{FD:()=>r,FK:()=>i.FK,Y:()=>r});var i=n(60616),o=0;function r(e,t,n,r,a,s){t||(t={});var d,l,c=t;if("ref"in c)for(l in c={},t)"ref"==l?d=t[l]:c[l]=t[l];var p={type:e,props:c,key:n,ref:d,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--o,__i:-1,__u:0,__source:a,__self:s};if("function"==typeof e&&(d=e.defaultProps))for(l in d)void 0===c[l]&&(c[l]=d[l]);return i.fF.vnode&&i.fF.vnode(p),p}},61307(e,t,n){n.d(t,{G:()=>c});var i=n(81413),o=n(43078),r=n(60616),a=n(77631),s=n(21992);class d extends a.g{static defaultProps={...a.g.defaultProps,id:"panel",title:"Panel",content:null,theme:"inherit",disabled:!1,keepMounted:!1};placement="top-left";className="deck-widget-panel";title;content;theme;disabled;keepMounted;constructor(e){super(e),this.title=this.props.title,this.content=this.props.content,this.theme=this.props.theme,this.disabled=this.props.disabled,this.keepMounted=this.props.keepMounted}setProps(e){let t={...this.props,...e};this.title=t.title,this.content=t.content,this.theme=t.theme,this.disabled=t.disabled,this.keepMounted=t.keepMounted,super.setProps(e)}onRenderHTML(e){(0,r.XX)((0,r.h)(s.U,{panel:this},this.content),e)}onRemove(){this.rootElement&&(0,r.XX)(null,this.rootElement)}}function l({className:e,onRenderHTML:t}){let n=(0,o.li)(null);return(0,o.Nf)(()=>{let e=n.current;if(!e)return;let i=t(e);return()=>{"function"==typeof i&&i()}},[t]),(0,i.Y)("div",{ref:n,className:e})}class c extends d{constructor({id:e,title:t,onRenderHTML:n,disabled:o,keepMounted:r,className:a,theme:s="inherit"}){super({id:e,title:t,theme:s,disabled:o,keepMounted:r,content:(0,i.Y)(l,{className:a,onRenderHTML:n})})}}},73228(e,t,n){n.d(t,{B:()=>l,h:()=>d});let i="data-deck-gl-community-panels-styles",o=`/* Stop at nested scopes so explicit original presets retain their native states. */
@scope ([data-panel-theme-preset^="sleek-"]) to ([data-panel-theme-preset]) {
  :is(button, input, select, textarea):focus-visible {
    outline: var(--panel-focus-color) solid 2px !important;
    outline-offset: -2px;
  }
  input[type='checkbox'] {
    appearance: none;
    -webkit-appearance: none;
    position: relative;
    box-sizing: border-box;
    width: 26px !important;
    height: 14px;
    border: 1px solid var(--panel-accent-color);
    border-radius: 7px;
    background: var(--button-background);
    cursor: pointer;
    transition: background-color 120ms ease, border-color 120ms ease;
  }
  input[type='checkbox']::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 1px;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 1px solid var(--button-icon-idle);
    background: transparent;
    transition: transform 120ms ease, background-color 120ms ease;
  }
  input[type='checkbox']:checked {
    background: var(--button-background);
    border-color: var(--panel-accent-color);
  }
  input[type='checkbox']:checked::before {
    transform: translate(12px, -50%);
    border-color: var(--panel-accent-color);
    background: var(--panel-accent-color);
  }
  @media (prefers-reduced-motion: reduce) {
    input[type='checkbox'], input[type='checkbox']::before { transition: none; }
  }
  @media (forced-colors: active) {
    input[type='checkbox'] { appearance: auto; -webkit-appearance: auto; }
    input[type='checkbox']::before { display: none; }
  }
  input[type='range'] {
    appearance: none;
    -webkit-appearance: none;
    height: 16px;
    background: transparent;
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-runnable-track {
    height: 2px;
    background: var(--range-track-color);
    border-radius: 1px;
  }
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -6px;
    border: 0;
    border-radius: 50%;
    background: var(--panel-accent-color);
  }
  input[type='range']::-moz-range-track {
    height: 2px;
    background: var(--range-track-color);
    border-radius: 1px;
  }
  input[type='range']::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: var(--panel-accent-color);
  }
  button:not(:disabled):not([aria-pressed='true']):not([aria-selected='true']):not([data-panel-active='true']):hover {
    background-color: var(--panel-hover-background) !important;
  }
  :is(button, input, select, textarea):disabled {
    opacity: var(--panel-disabled-opacity);
  }
}
`,r=`.deck-panel-layout {
  position: relative;
  display: grid;
  grid-template-areas: "top top top" "left center right" "bottom bottom bottom";
  grid-template-columns: minmax(0, max-content) minmax(0, 1fr) minmax(0, max-content);
  grid-template-rows: minmax(0, max-content) minmax(0, 1fr) minmax(0, max-content);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.deck-panel-layout-center { grid-area: center; position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.deck-panel-layout-edge { display: flex; min-width: 0; min-height: 0; overflow: auto; }
.deck-panel-layout-edge[data-side="top"] { grid-area: top; }
.deck-panel-layout-edge[data-side="bottom"] { grid-area: bottom; }
.deck-panel-layout-edge[data-side="left"] { grid-area: left; flex-direction: column; }
.deck-panel-layout-edge[data-side="right"] { grid-area: right; flex-direction: column; }
.deck-panel-chrome {
  position: relative; pointer-events: auto; min-width: 0; min-height: 0;
  box-sizing: border-box; flex: 0 1 auto;
  color: var(--menu-text, #18181a); background: var(--menu-background, #fff);
  font: 13px system-ui, sans-serif;
}
.deck-panel-chrome[hidden] { display: none; }
.deck-panel-chrome[data-docked="true"][data-side="left"],
.deck-panel-chrome[data-docked="true"][data-side="right"] { flex: 1 1 auto; }
.deck-panel-chrome-shell { position: relative; display: flex; flex-direction: column; height: 100%; max-height: inherit; min-height: 0; }
.deck-panel-chrome-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px; flex: 0 0 auto; }
.deck-panel-chrome-header button { color: inherit; font: inherit; cursor: pointer; }
.deck-panel-chrome-header button:disabled { cursor: default; }
.deck-panel-chrome-content { overflow: auto; min-width: 0; min-height: 0; flex: 1 1 auto; padding: 8px; }
.deck-panel-chrome[data-pinnable="true"] {
  font-size: 14px;
  line-height: 1.5;
  border-radius: 12px;
  background: var(--menu-background, rgba(255, 255, 255, 0.96));
  backdrop-filter: var(--menu-backdrop-filter, unset);
  box-shadow: var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16));
}
.deck-panel-chrome[data-pinnable="true"][data-docked="true"] {
  border-radius: 0;
  box-shadow: none;
}
.deck-panel-chrome[data-pinnable="true"] > .deck-panel-chrome-shell {
  box-sizing: border-box;
  border: var(--menu-border, 1px solid rgba(148, 163, 184, 0.35));
  border-radius: inherit;
  overflow: hidden;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header {
  padding: 14px 16px 10px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--button-text, currentColor);
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--button-icon-idle, #616166);
  font: 500 12px/1.2 system-ui, sans-serif;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:hover:enabled {
  background: var(--menu-item-hover, rgba(0, 0, 0, 0.08));
  color: var(--button-icon-hover, #18181a);
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:disabled { opacity: 0.45; }
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-content {
  padding: 0 16px 16px;
  overscroll-behavior: contain;
}
.deck-panel-chrome-content[hidden] { display: none; }
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header .deck-panel-chrome-toggle {
  flex: 1 1 auto;
  justify-content: space-between;
  gap: 8px;
  padding: 0;
  color: inherit;
  font: inherit;
  text-align: left;
}
.deck-panel-chrome-header .deck-panel-chrome-hide {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--button-icon-idle, #616166);
}
.deck-panel-chrome-header .deck-panel-chrome-hide:hover,
.deck-panel-chrome-restore:hover {
  background: var(--menu-item-hover, rgba(0, 0, 0, 0.08));
  color: var(--button-icon-hover, #18181a);
}
.deck-panel-chrome-hide:focus-visible,
.deck-panel-chrome-restore:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.deck-panel-chrome-restore {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  pointer-events: auto;
  width: 32px;
  height: 32px;
  border: var(--menu-border, 1px solid #cbd0d6);
  border-radius: 6px;
  background: var(--menu-background, #fff);
  color: var(--menu-text, #18181a);
  box-shadow: var(--menu-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
}
.deck-panel-chrome-divider { position: absolute; touch-action: none; z-index: 1; background: transparent; }
.deck-panel-chrome-divider:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.deck-panel-chrome[data-side="left"] .deck-panel-chrome-divider { right: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.deck-panel-chrome[data-side="right"] .deck-panel-chrome-divider { left: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.deck-panel-chrome[data-side="top"] .deck-panel-chrome-divider { bottom: 0; left: 0; right: 0; height: 6px; cursor: ns-resize; }
.deck-panel-chrome[data-side="bottom"] .deck-panel-chrome-divider { top: 0; left: 0; right: 0; height: 6px; cursor: ns-resize; }
`,a=`.deck-widget {
  margin: var(--widget-margin, 12px);
  box-sizing: border-box;
  font-size: var(--panel-font-size);
}

/* Common button container styles */
.deck-widget-button,
.deck-widget-button-group {
  background: var(--button-stroke, rgba(255, 255, 255, 0.3));
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));

  display: flex;
  align-items: center;
  justify-content: center;
}

/* Single button */
.deck-widget-button {
  width: var(--button-size, 28px);
  height: var(--button-size, 28px);
}

/* Button group */
.deck-widget-button-group {
  width: calc(var(--button-size, 28px) - 2);
  height: calc((var(--button-size, 28px) * 2) - 1);

  flex-direction: row;
  padding: 1px;
  gap: 1px;
}
.deck-widget-button-group > .deck-widget-button {
  display: contents;
}

.deck-widget-button-group.vertical {
  display: inline-flex;
  flex-direction: column;
}

/* Common button background styles */
.deck-widget-button-group button,
.deck-widget-button button {
  width: calc(var(--button-size, 28px) - 2px);
  height: calc(var(--button-size, 28px) - 2px);

  box-sizing: border-box;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);

  pointer-events: auto;
  cursor: pointer;
  outline: none;
  padding: 0;
}

/* Border radius adjustments for grouped buttons */
.deck-widget-button-group.vertical > *:not(:last-child),
.deck-widget-button-group.vertical > *:not(:last-child) > button {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.deck-widget-button-group.vertical > *:not(:first-child),
.deck-widget-button-group.vertical > *:not(:first-child) > button {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.deck-widget-button-group.horizontal > *:not(:last-child),
.deck-widget-button-group.horizontal > *:not(:last-child) > button {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.deck-widget-button-group.horizontal > *:not(:first-child),
.deck-widget-button-group.horizontal > *:not(:first-child) > button {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Icon button foreground styles */
.deck-widget button .deck-widget-icon {
  background-color: var(--button-icon-idle, #616166);
  background-position: 50%;
  background-repeat: no-repeat;
  display: block;
  height: 100%;
  width: 100%;
}

.deck-widget button .deck-widget-icon:hover {
  background-color: var(--button-icon-hover, rgb(24, 24, 26));
}

.deck-widget-button-label {
  white-space: nowrap;
}

.deck-widget-button-with-text {
  width: auto;
}

.deck-widget-button-with-text button {
  display: flex;
  width: auto;
  min-width: var(--button-size, 28px);
  height: calc(var(--button-size, 28px) - 2px);
  align-items: center;
  gap: 6px;
  padding: 0 8px;
}

.deck-widget-button-with-text button > span:first-child {
  width: auto;
  height: auto;
  flex: 0 0 auto;
}

/* Icon menu styles */
.deck-widget .deck-widget-icon-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--menu-gap, 4px);
  z-index: 100;
}

/* Fullscreen styles */
.deck-widget.deck-widget-fullscreen button.deck-widget-fullscreen-enter .deck-widget-icon {
  mask-image: var(
    --icon-fullscreen-enter,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M7.90474 20.0953H10.6286C10.8984 20.0953 11.1246 20.1868 11.3071 20.37C11.4897 20.5532 11.5809 20.7802 11.5809 21.051C11.5809 21.3218 11.4897 21.5476 11.3071 21.7286C11.1246 21.9095 10.8984 22 10.6286 22H6.95237C6.68254 22 6.45635 21.9087 6.2738 21.7262C6.09127 21.5436 6 21.3175 6 21.0476V17.3714C6 17.1016 6.09159 16.8754 6.27477 16.6929C6.45795 16.5103 6.68493 16.4191 6.95571 16.4191C7.2265 16.4191 7.45236 16.5103 7.63331 16.6929C7.81427 16.8754 7.90474 17.1016 7.90474 17.3714V20.0953ZM7.90474 7.90474V10.6286C7.90474 10.8984 7.81315 11.1246 7.62997 11.3071C7.44679 11.4897 7.21981 11.5809 6.94903 11.5809C6.67825 11.5809 6.45238 11.4897 6.27143 11.3071C6.09048 11.1246 6 10.8984 6 10.6286V6.95237C6 6.68254 6.09127 6.45635 6.2738 6.2738C6.45635 6.09127 6.68254 6 6.95237 6H10.6286C10.8984 6 11.1246 6.09159 11.3071 6.27477C11.4897 6.45795 11.5809 6.68493 11.5809 6.95571C11.5809 7.2265 11.4897 7.45236 11.3071 7.63331C11.1246 7.81427 10.8984 7.90474 10.6286 7.90474H7.90474ZM20.0953 20.0953V17.3714C20.0953 17.1016 20.1868 16.8754 20.37 16.6929C20.5532 16.5103 20.7802 16.4191 21.051 16.4191C21.3218 16.4191 21.5476 16.5103 21.7286 16.6929C21.9095 16.8754 22 17.1016 22 17.3714V21.0476C22 21.3175 21.9087 21.5436 21.7262 21.7262C21.5436 21.9087 21.3175 22 21.0476 22H17.3714C17.1016 22 16.8754 21.9084 16.6929 21.7252C16.5103 21.542 16.4191 21.3151 16.4191 21.0443C16.4191 20.7735 16.5103 20.5476 16.6929 20.3667C16.8754 20.1857 17.1016 20.0953 17.3714 20.0953H20.0953ZM20.0953 7.90474H17.3714C17.1016 7.90474 16.8754 7.81315 16.6929 7.62997C16.5103 7.44679 16.4191 7.21981 16.4191 6.94903C16.4191 6.67825 16.5103 6.45238 16.6929 6.27143C16.8754 6.09048 17.1016 6 17.3714 6H21.0476C21.3175 6 21.5436 6.09127 21.7262 6.2738C21.9087 6.45635 22 6.68254 22 6.95237V10.6286C22 10.8984 21.9084 11.1246 21.7252 11.3071C21.542 11.4897 21.3151 11.5809 21.0443 11.5809C20.7735 11.5809 20.5476 11.4897 20.3667 11.3071C20.1857 11.1246 20.0953 10.8984 20.0953 10.6286V7.90474Z" /></svg>')
  );
  -webkit-mask-image: var(
    --icon-fullscreen-enter,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M7.90474 20.0953H10.6286C10.8984 20.0953 11.1246 20.1868 11.3071 20.37C11.4897 20.5532 11.5809 20.7802 11.5809 21.051C11.5809 21.3218 11.4897 21.5476 11.3071 21.7286C11.1246 21.9095 10.8984 22 10.6286 22H6.95237C6.68254 22 6.45635 21.9087 6.2738 21.7262C6.09127 21.5436 6 21.3175 6 21.0476V17.3714C6 17.1016 6.09159 16.8754 6.27477 16.6929C6.45795 16.5103 6.68493 16.4191 6.95571 16.4191C7.2265 16.4191 7.45236 16.5103 7.63331 16.6929C7.81427 16.8754 7.90474 17.1016 7.90474 17.3714V20.0953ZM7.90474 7.90474V10.6286C7.90474 10.8984 7.81315 11.1246 7.62997 11.3071C7.44679 11.4897 7.21981 11.5809 6.94903 11.5809C6.67825 11.5809 6.45238 11.4897 6.27143 11.3071C6.09048 11.1246 6 10.8984 6 10.6286V6.95237C6 6.68254 6.09127 6.45635 6.2738 6.2738C6.45635 6.09127 6.68254 6 6.95237 6H10.6286C10.8984 6 11.1246 6.09159 11.3071 6.27477C11.4897 6.45795 11.5809 6.68493 11.5809 6.95571C11.5809 7.2265 11.4897 7.45236 11.3071 7.63331C11.1246 7.81427 10.8984 7.90474 10.6286 7.90474H7.90474ZM20.0953 20.0953V17.3714C20.0953 17.1016 20.1868 16.8754 20.37 16.6929C20.5532 16.5103 20.7802 16.4191 21.051 16.4191C21.3218 16.4191 21.5476 16.5103 21.7286 16.6929C21.9095 16.8754 22 17.1016 22 17.3714V21.0476C22 21.3175 21.9087 21.5436 21.7262 21.7262C21.5436 21.9087 21.3175 22 21.0476 22H17.3714C17.1016 22 16.8754 21.9084 16.6929 21.7252C16.5103 21.542 16.4191 21.3151 16.4191 21.0443C16.4191 20.7735 16.5103 20.5476 16.6929 20.3667C16.8754 20.1857 17.1016 20.0953 17.3714 20.0953H20.0953ZM20.0953 7.90474H17.3714C17.1016 7.90474 16.8754 7.81315 16.6929 7.62997C16.5103 7.44679 16.4191 7.21981 16.4191 6.94903C16.4191 6.67825 16.5103 6.45238 16.6929 6.27143C16.8754 6.09048 17.1016 6 17.3714 6H21.0476C21.3175 6 21.5436 6.09127 21.7262 6.2738C21.9087 6.45635 22 6.68254 22 6.95237V10.6286C22 10.8984 21.9084 11.1246 21.7252 11.3071C21.542 11.4897 21.3151 11.5809 21.0443 11.5809C20.7735 11.5809 20.5476 11.4897 20.3667 11.3071C20.1857 11.1246 20.0953 10.8984 20.0953 10.6286V7.90474Z" /></svg>')
  );
}

.deck-widget.deck-widget-fullscreen button.deck-widget-fullscreen-exit .deck-widget-icon {
  mask-image: var(
    --icon-fullscreen-exit,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M9.6762 18.3238H6.95237C6.68254 18.3238 6.45635 18.2322 6.2738 18.049C6.09127 17.8658 6 17.6389 6 17.3681C6 17.0973 6.09127 16.8714 6.2738 16.6905C6.45635 16.5095 6.68254 16.4191 6.95237 16.4191H10.6286C10.8984 16.4191 11.1246 16.5103 11.3071 16.6929C11.4897 16.8754 11.5809 17.1016 11.5809 17.3714V21.0476C11.5809 21.3175 11.4894 21.5436 11.3062 21.7262C11.123 21.9087 10.896 22 10.6252 22C10.3544 22 10.1286 21.9087 9.94763 21.7262C9.76668 21.5436 9.6762 21.3175 9.6762 21.0476V18.3238ZM18.3238 18.3238V21.0476C18.3238 21.3175 18.2322 21.5436 18.049 21.7262C17.8658 21.9087 17.6389 22 17.3681 22C17.0973 22 16.8714 21.9087 16.6905 21.7262C16.5095 21.5436 16.4191 21.3175 16.4191 21.0476V17.3714C16.4191 17.1016 16.5103 16.8754 16.6929 16.6929C16.8754 16.5103 17.1016 16.4191 17.3714 16.4191H21.0476C21.3175 16.4191 21.5436 16.5106 21.7262 16.6938C21.9087 16.877 22 17.104 22 17.3748C22 17.6456 21.9087 17.8714 21.7262 18.0524C21.5436 18.2333 21.3175 18.3238 21.0476 18.3238H18.3238ZM9.6762 9.6762V6.95237C9.6762 6.68254 9.76779 6.45635 9.95097 6.2738C10.1342 6.09127 10.3611 6 10.6319 6C10.9027 6 11.1286 6.09127 11.3095 6.2738C11.4905 6.45635 11.5809 6.68254 11.5809 6.95237V10.6286C11.5809 10.8984 11.4897 11.1246 11.3071 11.3071C11.1246 11.4897 10.8984 11.5809 10.6286 11.5809H6.95237C6.68254 11.5809 6.45635 11.4894 6.2738 11.3062C6.09127 11.123 6 10.896 6 10.6252C6 10.3544 6.09127 10.1286 6.2738 9.94763C6.45635 9.76668 6.68254 9.6762 6.95237 9.6762H9.6762ZM18.3238 9.6762H21.0476C21.3175 9.6762 21.5436 9.76779 21.7262 9.95097C21.9087 10.1342 22 10.3611 22 10.6319C22 10.9027 21.9087 11.1286 21.7262 11.3095C21.5436 11.4905 21.3175 11.5809 21.0476 11.5809H17.3714C17.1016 11.5809 16.8754 11.4897 16.6929 11.3071C16.5103 11.1246 16.4191 10.8984 16.4191 10.6286V6.95237C16.4191 6.68254 16.5106 6.45635 16.6938 6.2738C16.877 6.09127 17.104 6 17.3748 6C17.6456 6 17.8714 6.09127 18.0524 6.2738C18.2333 6.45635 18.3238 6.68254 18.3238 6.95237V9.6762Z" /></svg>')
  );
  -webkit-mask-image: var(
    --icon-fullscreen-exit,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M9.6762 18.3238H6.95237C6.68254 18.3238 6.45635 18.2322 6.2738 18.049C6.09127 17.8658 6 17.6389 6 17.3681C6 17.0973 6.09127 16.8714 6.2738 16.6905C6.45635 16.5095 6.68254 16.4191 6.95237 16.4191H10.6286C10.8984 16.4191 11.1246 16.5103 11.3071 16.6929C11.4897 16.8754 11.5809 17.1016 11.5809 17.3714V21.0476C11.5809 21.3175 11.4894 21.5436 11.3062 21.7262C11.123 21.9087 10.896 22 10.6252 22C10.3544 22 10.1286 21.9087 9.94763 21.7262C9.76668 21.5436 9.6762 21.3175 9.6762 21.0476V18.3238ZM18.3238 18.3238V21.0476C18.3238 21.3175 18.2322 21.5436 18.049 21.7262C17.8658 21.9087 17.6389 22 17.3681 22C17.0973 22 16.8714 21.9087 16.6905 21.7262C16.5095 21.5436 16.4191 21.3175 16.4191 21.0476V17.3714C16.4191 17.1016 16.5103 16.8754 16.6929 16.6929C16.8754 16.5103 17.1016 16.4191 17.3714 16.4191H21.0476C21.3175 16.4191 21.5436 16.5106 21.7262 16.6938C21.9087 16.877 22 17.104 22 17.3748C22 17.6456 21.9087 17.8714 21.7262 18.0524C21.5436 18.2333 21.3175 18.3238 21.0476 18.3238H18.3238ZM9.6762 9.6762V6.95237C9.6762 6.68254 9.76779 6.45635 9.95097 6.2738C10.1342 6.09127 10.3611 6 10.6319 6C10.9027 6 11.1286 6.09127 11.3095 6.2738C11.4905 6.45635 11.5809 6.68254 11.5809 6.95237V10.6286C11.5809 10.8984 11.4897 11.1246 11.3071 11.3071C11.1246 11.4897 10.8984 11.5809 10.6286 11.5809H6.95237C6.68254 11.5809 6.45635 11.4894 6.2738 11.3062C6.09127 11.123 6 10.896 6 10.6252C6 10.3544 6.09127 10.1286 6.2738 9.94763C6.45635 9.76668 6.68254 9.6762 6.95237 9.6762H9.6762ZM18.3238 9.6762H21.0476C21.3175 9.6762 21.5436 9.76779 21.7262 9.95097C21.9087 10.1342 22 10.3611 22 10.6319C22 10.9027 21.9087 11.1286 21.7262 11.3095C21.5436 11.4905 21.3175 11.5809 21.0476 11.5809H17.3714C17.1016 11.5809 16.8754 11.4897 16.6929 11.3071C16.5103 11.1246 16.4191 10.8984 16.4191 10.6286V6.95237C16.4191 6.68254 16.5106 6.45635 16.6938 6.2738C16.877 6.09127 17.104 6 17.3748 6C17.6456 6 17.8714 6.09127 18.0524 6.2738C18.2333 6.45635 18.3238 6.68254 18.3238 6.95237V9.6762Z" /></svg>')
  );
}

.deck-pseudo-fullscreen {
  height: 100% !important;
  left: 0 !important;
  position: fixed !important;
  top: 0 !important;
  width: 100% !important;
  z-index: 99999;
}

/* Zoom styles */
.deck-widget.deck-widget-zoom button.deck-widget-zoom-in .deck-widget-icon {
  mask-image: var(
    --icon-zoom-in,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"><path d="M12.1029 13.8971H7.89332C7.64334 13.8971 7.43196 13.8105 7.25918 13.6373C7.08639 13.4641 7 13.2521 7 13.0014C7 12.7508 7.08639 12.5396 7.25918 12.368C7.43196 12.1963 7.64334 12.1105 7.89332 12.1105H12.1029V7.90097C12.1029 7.65161 12.1895 7.43912 12.3627 7.26348C12.5359 7.08783 12.7479 7 12.9986 7C13.2492 7 13.4604 7.08783 13.632 7.26348C13.8037 7.43912 13.8895 7.65161 13.8895 7.90097V12.1105H18.099C18.3484 12.1105 18.5609 12.1971 18.7365 12.3703C18.9122 12.5436 19 12.7555 19 13.0062C19 13.2569 18.9122 13.468 18.7365 13.6397C18.5609 13.8113 18.3484 13.8971 18.099 13.8971H13.8895V18.1067C13.8895 18.3567 13.8029 18.568 13.6297 18.7408C13.4564 18.9136 13.2445 19 12.9938 19C12.7431 19 12.532 18.9136 12.3603 18.7408C12.1887 18.568 12.1029 18.3567 12.1029 18.1067V13.8971Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-zoom-in,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"><path d="M12.1029 13.8971H7.89332C7.64334 13.8971 7.43196 13.8105 7.25918 13.6373C7.08639 13.4641 7 13.2521 7 13.0014C7 12.7508 7.08639 12.5396 7.25918 12.368C7.43196 12.1963 7.64334 12.1105 7.89332 12.1105H12.1029V7.90097C12.1029 7.65161 12.1895 7.43912 12.3627 7.26348C12.5359 7.08783 12.7479 7 12.9986 7C13.2492 7 13.4604 7.08783 13.632 7.26348C13.8037 7.43912 13.8895 7.65161 13.8895 7.90097V12.1105H18.099C18.3484 12.1105 18.5609 12.1971 18.7365 12.3703C18.9122 12.5436 19 12.7555 19 13.0062C19 13.2569 18.9122 13.468 18.7365 13.6397C18.5609 13.8113 18.3484 13.8971 18.099 13.8971H13.8895V18.1067C13.8895 18.3567 13.8029 18.568 13.6297 18.7408C13.4564 18.9136 13.2445 19 12.9938 19C12.7431 19 12.532 18.9136 12.3603 18.7408C12.1887 18.568 12.1029 18.3567 12.1029 18.1067V13.8971Z"/></svg>')
  );
}

.deck-widget.deck-widget-zoom button.deck-widget-zoom-out .deck-widget-icon {
  mask-image: var(
    --icon-zoom-out,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"> wBox="0 0 26 26" fill="none"><path d="M7.89332 13.8866C7.64334 13.8866 7.43196 13.8 7.25918 13.6268C7.08639 13.4535 7 13.2416 7 12.9909C7 12.7403 7.08639 12.5291 7.25918 12.3575C7.43196 12.1858 7.64334 12.1 7.89332 12.1H18.099C18.349 12.1 18.5617 12.1866 18.737 12.3598C18.9123 12.5331 19 12.745 19 12.9957C19 13.2463 18.9123 13.4575 18.737 13.6291C18.5617 13.8008 18.349 13.8866 18.099 13.8866H7.89332Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-zoom-out,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"> wBox="0 0 26 26" fill="none"><path d="M7.89332 13.8866C7.64334 13.8866 7.43196 13.8 7.25918 13.6268C7.08639 13.4535 7 13.2416 7 12.9909C7 12.7403 7.08639 12.5291 7.25918 12.3575C7.43196 12.1858 7.64334 12.1 7.89332 12.1H18.099C18.349 12.1 18.5617 12.1866 18.737 12.3598C18.9123 12.5331 19 12.745 19 12.9957C19 13.2463 18.9123 13.4575 18.737 13.6291C18.5617 13.8008 18.349 13.8866 18.099 13.8866H7.89332Z"/></svg>')
  );
}

/* Screenshot styles */
.deck-widget.deck-widget-screenshot button.deck-widget-camera .deck-widget-icon {
  mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"/></svg>')
  );
}

/* Theme panelContainer styles */
.deck-widget.deck-widget-theme button.deck-widget-sun .deck-widget-icon {
  mask-image: var(
    --icon-sun,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="black" stroke="black"><g ><circle cx="12" cy="12" r="6" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></g></svg>')
  );
}

.deck-widget.deck-widget-theme button.deck-widget-moon .deck-widget-icon {
  mask-image: var(
    --icon-moon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" ><circle cx="12" cy="12" r="6" fill="black" mask="url(%23moon-mask)" /><mask id="moon-mask" viewBox="0 0 24 24" ><rect x="0" y="0" width="24" height="24" fill="white" /><circle cx="24" cy="10" r="12" fill="black"/></mask></svg>')
  );
  -webbit-mask-image: var(
    --icon-moon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24"><circle x="12" cy="12" r="6" /></svg>')
  );
}

/* Reset view styles */
.deck-widget.deck-widget-reset-view button.deck-widget-reset-focus .deck-widget-icon {
  mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M480-320v-100q0-25 17.5-42.5T540-480h100v60H540v100h-60Zm60 240q-25 0-42.5-17.5T480-140v-100h60v100h100v60H540Zm280-240v-100H720v-60h100q25 0 42.5 17.5T880-420v100h-60ZM720-80v-60h100v-100h60v100q0 25-17.5 42.5T820-80H720Zm111-480h-83q-26-88-99-144t-169-56q-117 0-198.5 81.5T200-480q0 72 32.5 132t87.5 98v-110h80v240H160v-80h94q-62-50-98-122.5T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q129 0 226.5 79.5T831-560Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M480-320v-100q0-25 17.5-42.5T540-480h100v60H540v100h-60Zm60 240q-25 0-42.5-17.5T480-140v-100h60v100h100v60H540Zm280-240v-100H720v-60h100q25 0 42.5 17.5T880-420v100h-60ZM720-80v-60h100v-100h60v100q0 25-17.5 42.5T820-80H720Zm111-480h-83q-26-88-99-144t-169-56q-117 0-198.5 81.5T200-480q0 72 32.5 132t87.5 98v-110h80v240H160v-80h94q-62-50-98-122.5T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q129 0 226.5 79.5T831-560Z"/></svg>')
  );
}

/* Timeline panelContainer styles */
.deck-widget.deck-widget-timeline {
  position: absolute;
  margin: var(--widget-margin, 12px);
  left: 0;
  right: 0;
  pointer-events: all;
}
.deck-widget.deck-widget-timeline[data-placement^=top-] {
  top: 0;
}
.deck-widget.deck-widget-timeline[data-placement^=bottom-] {
  bottom: 0;
}
.deck-widget.deck-widget-timeline .deck-widget-button-group {
  box-sizing: border-box;
  gap: var(--widget-margin, 12px);
  padding: var(--widget-margin, 12px);
}
.deck-widget-timeline button.deck-widget-timeline-pause .deck-widget-icon {
  mask-image: var(
    --icon-pause,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-pause,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/></svg>')
  );
}
.deck-widget-timeline button.deck-widget-timeline-play .deck-widget-icon {
  mask-image: var(
    --icon-play,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M320-200v-560l440 280-440 280Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-play,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M320-200v-560l440 280-440 280Z"/></svg>')
  );
}
.deck-widget-timeline-label {
  position: relative;
  pointer-events: none;
  width: fit-content;
  font-size: var(--panel-font-size, 13px);
  color: var(--menu-text, rgb(24, 24, 26));
  white-space: nowrap;
}
.deck-widget-timeline-label--current {
  transform: translate(-50%, -100%);
  border-radius: var(--button-corner-radius, 8px);
  background: var(--menu-background, #fff);
  padding: 4px;
}

/* Loading styles */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.deck-widget.deck-widget-loading button.deck-widget-spinner .deck-widget-icon {
  animation: spin 1s linear infinite;
}

.deck-widget.deck-widget-loading button.deck-widget-spinner .deck-widget-icon {
  mask-image: var(
    --loading-icon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>')
  );
  -webkit-mask-image: var(
    --loading-icon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>')
  );
}

/* Scale styles */
.deck-widget .deck-widget-scale {
  background-color: var(--button-icon-idle, #616166);
  background-position: 50%;
  display: block;
}

/* Geocoder styles */
.deck-widget .deck-widget-geocoder {
  pointer-events: auto;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  background: var(--button-stroke, rgba(255, 255, 255, 0.3));
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  padding: 1px;
  gap: 1px;
}

.deck-widget .deck-widget-geocoder-input {
  flex: 1 1 auto;
  min-width: 200px;
  height: calc(var(--button-size, 28px) - 2px);
  margin: 0;
  padding: 0 8px;
  box-sizing: border-box;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  color: var(--button-text, rgb(24, 24, 26));
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--panel-font-size, 13px);
}

.deck-widget .deck-widget-geocoder-input:focus {
  outline: none;
}

.deck-widget .deck-widget-geocoder-input::placeholder {
  color: var(--button-icon-idle, rgba(97, 97, 102, 1));
}

.deck-widget .deck-widget-geocoder-error {
  position: absolute;
  top: calc(100% + var(--menu-gap, 4px));
  left: 1px;
  right: 1px;
  padding: var(--panel-padding, 6px 10px);
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  color: rgb(220, 80, 80);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--panel-font-size, 12px);
  text-align: center;
}

/* When dropdown is not present, input should have full rounded corners */
.deck-widget .deck-widget-geocoder-input:last-child {
  border-top-right-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-bottom-right-radius: calc(var(--button-corner-radius, 8px) - 1px);
}

/* Dropdown menu styles */
.deck-widget .deck-widget-dropdown-container {
  position: static;
  display: inline-block;
}

.deck-widget .deck-widget-dropdown-button {
  width: calc(var(--button-size, 28px) - 2px);
  height: calc(var(--button-size, 28px) - 2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  outline: none;
}

.deck-widget .deck-widget-dropdown-icon {
  width: 12px;
  height: 12px;
  background-color: var(--button-icon-idle, rgba(97, 97, 102, 1));
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>');
  -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>');
  mask-size: contain;
  -webkit-mask-size: contain;
  transition: transform 0.2s ease;
}

.deck-widget .deck-widget-dropdown-icon.open {
  transform: rotate(180deg);
}

.deck-widget .deck-widget-dropdown-button:hover .deck-widget-dropdown-icon {
  background-color: var(--button-icon-hover, rgba(24, 24, 26, 1));
}

.deck-widget .deck-widget-dropdown-menu {
  top: calc(100% + var(--menu-gap, 4px));
  left: 1px;
  right: 1px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  z-index: 1000;
  background: var(--menu-background, #fff);
  backdrop-filter: var(--menu-backdrop-filter, unset);
  border: var(--menu-border, unset);
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--panel-font-size, 13px);
}

.deck-widget .deck-widget-dropdown-item {
  padding: var(--panel-padding, 8px 12px);
  white-space: nowrap;
  overflow: hidden;
  cursor: default;
  user-select: none;
  text-overflow: ellipsis;
  color: var(--menu-text, rgb(24, 24, 26));
}

.deck-widget .deck-widget-dropdown-item:not(.disabled):hover {
  cursor: pointer;
  background: var(--menu-item-hover, rgba(128, 128, 128, 0.15));
}

.deck-widget .deck-widget-dropdown-item-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: text-bottom;
  background-color: var(--menu-text, rgb(24, 24, 26));
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

/* Stats styles */
.deck-widget.deck-widget-stats button .text {
  color: var(--button-text, rgb(24, 24, 26));
  font-family: monospace;
  font-size: 8px;
  font-weight: 700;
}
.deck-widget-stats-container {
  border-radius: var(--button-corner-radius, 8px);
  display: inline-flex;
  flex-direction: column;
  font-size: 0.7rem;
  /* Approximately 14px */
  line-height: 1.6;
  font-family: monospace;
  background-color: var(--menu-background, #fff);
  color: var(--menu-text, rgb(24, 24, 26));
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
}
.deck-widget-stats-header {
  color: var(--button-icon-idle, rgba(97, 97, 102, 1));
  padding-left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.deck-widget-stats-device {
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 0.65rem;
  line-height: 1.2;
  background: color-mix(in srgb, currentColor 12%, transparent);
  color: inherit;
}
.deck-widget-stats-header:hover {
  color: var(--button-icon-hover, rgb(24, 24, 26));
}
.deck-widget-stats-header .deck-widget-dropdown-button {
  background: none;
  border: none;
}
.deck-widget-stats-content {
  padding: var(--panel-padding, 4px 8px 8px);
}

/* Popup styles */
.deck-widget.deck-widget-popover {
  margin: 0 !important;
}
.deck-widget-popup-content {
  border-radius: var(--button-corner-radius, 8px);
  background: var(--menu-background, #fff);
  color: var(--menu-text, rgb(24, 24, 26));
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  padding: var(--panel-padding, 10px);
}
.deck-widget-popup-content .deck-widget-popup-controls {
  --button-size: 20px;
}
.deck-widget-popup-content .deck-widget-popup-controls .deck-widget-button {
  box-shadow: none;
}
.deck-widget-popup-content button.deck-widget-popup-close-button .deck-widget-icon {
  mask-image: var(
    --icon-close,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -120 120 120" fill="black"><path d="m32-25-7-7 28-28-28-28 7-7 28 28 28-28 7 7-28 28 28 28-7 7-28-28-28 28Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-close,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -120 120 120" fill="black"><path d="m32-25-7-7 28-28-28-28 7-7 28 28 28-28 7 7-28 28 28 28-7 7-28-28-28 28Z"/></svg>')
  );
}

/** Range input */
.deck-widget-range {
  position: relative;
  pointer-events: all;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;
  box-sizing: border-box;
  margin: 0;
}
.deck-widget-range__track {
  position: relative;
  cursor: pointer;
  flex: 1;
  background: var(--range-track-color, #888);
  border-radius: calc(var(--range-track-size, 16px) / 2);
}
.deck-widget-range__decorations {
  position: absolute;
}
.deck-widget-range__decoration {
  position: absolute;
}
.deck-widget-range__decoration:active {
  background-color: var(--range-decoration-active-color, gold) !important;
}
.deck-widget-range__thumb {
  position: relative;
  box-sizing: content-box;
  padding: calc(var(--range-thumb-size, 10px) / 2);
  border-radius: calc(var(--range-thumb-size, 10px) / 2);
  margin: calc(var(--range-thumb-size, 10px) * -0.5);
  background: var(--range-thumb-color, #444);
}
.deck-widget-range__button {
  cursor: pointer;
  opacity: 0.4;
  background-color: transparent;
  width: var(--range-step-button-size, 24px);
  height: var(--range-step-button-size, 24px);
  background-size: cover;
  border: none;
  padding: 0;
}
.deck-widget-range__button:hover {
  opacity: 1;
}
.deck-widget-range:not(.deck-widget-range--disabled) .deck-widget-range__button:disabled {
  pointer-events: none;
  opacity: 0.1;
}
.deck-widget-range--disabled {
  display: none;
}
.deck-widget-range--vertical {
  flex-direction: column;
  height: 100%;
  top: 0;
}
.deck-widget-range--horizontal {
  flex-direction: row;
  width: 100%;
  left: 0;
}
.deck-widget-range--vertical .deck-widget-range__track {
  width: var(--range-track-size, 16px);
  padding-top: calc(var(--range-track-size, 16px) / 2);
  padding-bottom: calc(var(--range-track-size, 16px) / 2);
  height: 100%;
  min-height: calc(var(--range-track-size, 16px) * 3);
}
.deck-widget-range--vertical .deck-widget-range__thumb {
  width: 0;
  left: 50%;
  cursor: ns-resize;
}
.deck-widget-range--vertical .deck-widget-range__decorations {
  top: calc(var(--range-track-size, 16px) / 2);
  bottom: calc(var(--range-track-size, 16px) / 2);
  left: 0;
  right: 0;
}
.deck-widget-range--vertical .deck-widget-range__button--start .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg>');
}
.deck-widget-range--vertical .deck-widget-range__button--end .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>');
}
.deck-widget-range--horizontal .deck-widget-range__track {
  height: var(--range-track-size, 16px);
  padding-left: calc(var(--range-track-size, 16px) / 2);
  padding-right: calc(var(--range-track-size, 16px) / 2);
  width: 100%;
  min-width: calc(var(--range-track-size, 16px) * 3);
}
.deck-widget-range--horizontal .deck-widget-range__thumb {
  height: 0;
  top: 50%;
  cursor: ew-resize;
}
.deck-widget-range--horizontal .deck-widget-range__decorations {
  left: calc(var(--range-track-size, 16px) / 2);
  right: calc(var(--range-track-size, 16px) / 2);
  top: 0;
  bottom: 0;
}
.deck-widget-range--horizontal .deck-widget-range__button--start .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>');
}
.deck-widget-range--horizontal .deck-widget-range__button--end .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>');
}

/** Scrollbar */
.deck-widget-scrollbar .deck-widget-range {
  position: absolute;
}
.deck-widget-scrollbar .deck-widget-range--vertical {
  top: var(--range-step-button-size, 24px);
  height: calc(100% - var(--range-step-button-size, 24px) * 2);
}
.deck-widget-scrollbar[data-placement$=-left] .deck-widget-range--vertical {
  left: 0;
}
.deck-widget-scrollbar[data-placement$=-right] .deck-widget-range--vertical {
  right: 0;
}
.deck-widget-scrollbar .deck-widget-range--horizontal {
  left: var(--range-step-button-size, 24px);
  width: calc(100% - var(--range-step-button-size, 24px) * 2);
}
.deck-widget-scrollbar[data-placement^=top-] .deck-widget-range--horizontal {
  top: 0;
}
.deck-widget-scrollbar[data-placement^=bottom-] .deck-widget-range--horizontal {
  bottom: 0;
}

/** Splitter */
.deck-widget.deck-widget-splitter {
  position: absolute;
  margin: 0;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
.deck-widget-splitter-handle {
  position: absolute;
  background: var(--button-background, #fff);
  z-index: 10;
  pointer-events: auto;
  box-shadow: inset 1px 1px 1px var(--button-icon-idle, #616166);
}
.deck-widget-splitter-handle.active {
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
}
.deck-widget-splitter-handle:before {
  content: ' ';
  display: block;
  position: absolute;
  box-sizing: content-box;
  width: 100%;
  height: 100%;
  padding: 4px;
  margin: -4px;
}
.deck-widget-splitter-handle--horizontal {
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  cursor: col-resize;
}
.deck-widget-splitter-handle--vertical {
  left: 0;
  right: 0;
  height: 2px;
  margin-top: -1px;
  cursor: row-resize;
}
`;function s(e){return"selectorText"in e&&"string"==typeof e.selectorText&&e.selectorText.includes(".deck-widget")}function d(e){if(!e.querySelector("style[data-panel-theme-styles]")){let t=e.createElement("style");t.setAttribute("data-panel-theme-styles","true"),t.textContent=o,e.head.appendChild(t)}if(e.querySelector(`style[${i}]`)||function(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(s))return!0}return!1}(e))return;let t=e.createElement("style");t.setAttribute(i,"true"),t.textContent=a,e.head.appendChild(t)}function l(e){if(e.querySelector("style[data-panel-chrome-styles]"))return;let t=e.createElement("style");t.setAttribute("data-panel-chrome-styles","true"),t.textContent=r,e.head.append(t)}},57957(e,t,n){n.d(t,{A3:()=>p,XH:()=>c,Yl:()=>l,xh:()=>d});let i=["--panel-preset","--panel-font-size","--panel-padding","--panel-control-height","--panel-control-padding","--panel-surface-radius","--panel-input-corner-radius","--panel-content-background","--panel-gap","--panel-corner-radius","--panel-round-radius","--panel-switch-padding","--panel-focus-color","--panel-accent-color","--panel-hover-background","--panel-disabled-opacity","--menu-corner-radius","--menu-weak-background","--menu-divider","--widget-margin","--button-size","--button-corner-radius","--button-background","--button-stroke","--button-inner-stroke","--button-shadow","--button-backdrop-filter","--button-icon-idle","--button-icon-hover","--button-text","--icon-compass-north-color","--icon-compass-south-color","--menu-gap","--menu-background","--menu-backdrop-filter","--menu-border","--menu-border-color","--menu-shadow","--menu-text","--menu-item-hover","--range-step-button-size","--range-track-size","--range-thumb-size","--range-track-color","--range-thumb-color","--range-decoration-active-color"],o={"--panel-preset":"light","--panel-font-size":"initial","--panel-padding":"initial","--panel-control-height":"initial","--panel-control-padding":"initial","--panel-surface-radius":"initial","--panel-input-corner-radius":"initial","--panel-content-background":"initial","--panel-gap":"initial","--panel-corner-radius":"initial","--panel-round-radius":"initial","--panel-switch-padding":"initial","--menu-border-color":"initial","--panel-focus-color":"initial","--panel-accent-color":"initial","--panel-hover-background":"initial","--panel-disabled-opacity":"initial","--menu-corner-radius":"initial","--menu-weak-background":"initial","--menu-divider":"initial","--widget-margin":"12px","--button-size":"28px","--button-corner-radius":"8px","--button-background":"#fff","--button-stroke":"rgba(255, 255, 255, 0.3)","--button-inner-stroke":"unset","--button-shadow":"0px 0px 8px 0px rgba(0, 0, 0, 0.25)","--button-backdrop-filter":"unset","--button-icon-idle":"rgba(97, 97, 102, 1)","--button-icon-hover":"rgba(24, 24, 26, 1)","--button-text":"rgb(24, 24, 26, 1)","--icon-compass-north-color":"rgb(240, 92, 68)","--icon-compass-south-color":"rgb(204, 204, 204)","--menu-gap":"4px","--menu-background":"#fff","--menu-backdrop-filter":"unset","--menu-border":"unset","--menu-shadow":"0px 0px 8px 0px rgba(0, 0, 0, 0.25)","--menu-text":"rgb(24, 24, 26, 1)","--menu-item-hover":"rgba(0, 0, 0, 0.08)","--range-step-button-size":"24px","--range-track-size":"16px","--range-thumb-size":"10px","--range-track-color":"#d8d8e5","--range-thumb-color":"#616166","--range-decoration-active-color":"#f8dd50"},r={"--panel-preset":"dark","--panel-font-size":"initial","--panel-padding":"initial","--panel-control-height":"initial","--panel-control-padding":"initial","--panel-surface-radius":"initial","--panel-input-corner-radius":"initial","--panel-content-background":"initial","--panel-gap":"initial","--panel-corner-radius":"initial","--panel-round-radius":"initial","--panel-switch-padding":"initial","--menu-border-color":"initial","--panel-focus-color":"initial","--panel-accent-color":"initial","--panel-hover-background":"initial","--panel-disabled-opacity":"initial","--menu-corner-radius":"initial","--menu-weak-background":"initial","--menu-divider":"initial","--widget-margin":"12px","--button-size":"28px","--button-corner-radius":"8px","--button-background":"rgba(18, 18, 20, 1)","--button-stroke":"rgba(18, 18, 20, 0.30)","--button-inner-stroke":"unset","--button-shadow":"0px 0px 8px 0px rgba(0, 0, 0, 0.25)","--button-backdrop-filter":"unset","--button-icon-idle":"rgba(158, 157, 168, 1)","--button-icon-hover":"rgba(215, 214, 229, 1)","--button-text":"rgb(215, 214, 229, 1)","--icon-compass-north-color":"rgb(240, 92, 68)","--icon-compass-south-color":"rgb(200, 199, 209)","--menu-gap":"4px","--menu-background":"rgba(18, 18, 20, 1)","--menu-backdrop-filter":"unset","--menu-border":"unset","--menu-shadow":"0px 0px 8px 0px rgba(0, 0, 0, 0.25)","--menu-text":"rgb(215, 214, 229, 1)","--menu-item-hover":"rgba(255, 255, 255, 0.1)","--range-step-button-size":"24px","--range-track-size":"16px","--range-thumb-size":"10px","--range-track-color":"#2c2c30","--range-thumb-color":"#9e9da8","--range-decoration-active-color":"#dd7d2c"},a={"--widget-margin":"8px","--button-size":"20px","--button-corner-radius":"4px","--panel-font-size":"10px","--panel-padding":"4px 6px","--panel-control-height":"20px","--panel-control-padding":"1px 5px","--panel-gap":"3px","--panel-corner-radius":"4px","--panel-round-radius":"999px","--panel-switch-padding":"2px","--panel-surface-radius":"8px","--panel-input-corner-radius":"3px","--panel-content-background":"transparent","--menu-corner-radius":"8px","--menu-backdrop-filter":"none","--button-backdrop-filter":"none","--menu-gap":"4px","--range-step-button-size":"20px","--range-track-size":"12px","--range-thumb-size":"8px"},s={...o,...a,"--panel-preset":"sleek-light","--button-background":"rgba(241, 245, 251, 0.78)","--button-stroke":"rgba(82, 111, 157, 0.28)","--button-inner-stroke":"1px solid rgba(82, 111, 157, 0.28)","--button-shadow":"inset 0 1px 0 rgba(255, 255, 255, 0.7)","--button-text":"#24344c","--button-icon-idle":"#526985","--button-icon-hover":"#16385e","--menu-background":"rgba(248, 251, 255, 0.72)","--menu-text":"#24344c","--menu-border":"1px solid rgba(82, 111, 157, 0.28)","--menu-border-color":"rgba(82, 111, 157, 0.28)","--menu-divider":"1px solid rgba(82, 111, 157, 0.16)","--menu-weak-background":"rgba(210, 225, 245, 0.18)","--menu-item-hover":"rgba(70, 125, 196, 0.12)","--menu-shadow":"0 12px 30px rgba(15, 32, 60, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.65)","--panel-focus-color":"#2563eb","--panel-accent-color":"#167565","--panel-hover-background":"rgba(201, 221, 247, 0.76)","--panel-disabled-opacity":"0.5","--range-track-color":"rgba(111, 137, 173, 0.38)","--range-thumb-color":"#527caa","--range-decoration-active-color":"#267cba"},d={...r,...a,"--panel-preset":"sleek-dark","--button-background":"rgba(15, 23, 42, 0.72)","--button-stroke":"rgba(140, 169, 211, 0.28)","--button-inner-stroke":"initial","--button-shadow":"inset 0 1px 0 rgba(255, 255, 255, 0.04)","--button-text":"#e2e8f0","--button-icon-idle":"#94a3b8","--button-icon-hover":"#eff4fd","--menu-background":"rgba(8, 12, 20, 0.91)","--menu-text":"#e2e8f0","--menu-border":"1px solid rgba(126, 155, 205, 0.26)","--menu-border-color":"rgba(126, 155, 205, 0.26)","--menu-divider":"1px solid rgba(126, 155, 205, 0.18)","--menu-weak-background":"rgba(15, 23, 42, 0.48)","--menu-item-hover":"rgba(125, 211, 252, 0.12)","--menu-shadow":"0 12px 30px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04)","--panel-focus-color":"#8bb4ff","--panel-accent-color":"#86cbbd","--panel-hover-background":"rgba(70, 104, 159, 0.38)","--panel-disabled-opacity":"0.5","--range-track-color":"rgba(71, 85, 105, 0.8)","--range-thumb-color":"#7dd3fc","--range-decoration-active-color":"#86cbbd"},l={light:o,dark:r,"sleek-light":s,"sleek-dark":d};function c(e){return{...l[e.base],...e.variables,"--panel-preset":e.base}}function p(e,t){for(let t of i)e.style.removeProperty(t);for(let[n,i]of Object.entries("base"in t?c(t):t))e.style.setProperty(n,i)}},64843(e,t,n){n.d(t,{X:()=>l});var i,o=n(81413),r=n(60616),a=n(5524),s=n(21992);function d({panel:e,title:t,widthPx:n,maxHeightPx:i,open:r,collapsible:a,onOpenChange:l}){return(0,o.FD)("section",{style:p(n,i),"aria-label":t??"Panel box",onPointerDown:c,onPointerMove:c,onPointerUp:c,onMouseDown:c,onMouseMove:c,onMouseUp:c,onTouchStart:c,onTouchMove:c,onTouchEnd:c,onClick:c,onContextMenu:c,onWheel:c,children:[t?(0,o.Y)("header",{style:h,children:a?(0,o.FD)("button",{type:"button","aria-expanded":r,style:g,onClick:()=>l(!r),children:[(0,o.Y)("span",{children:t}),(0,o.Y)("span",{"aria-hidden":"true",style:u(r),children:r?"\u25BE":"\u25B8"})]}):(0,o.Y)("span",{children:t})}):null,(0,o.Y)("div",{style:m(r),children:e?(0,o.Y)(s.U,{panel:e,children:e.content}):null})]})}class l extends a.y{static defaultProps={...a.y.defaultProps,pinnable:!1,side:"right",pinned:void 0,defaultPinned:!1,onPinnedChange:void 0,offsetPx:0,resizable:!0,id:"box-panel-container",placement:"bottom-left",title:void 0,widthPx:360,collapsible:!0,defaultOpen:!0,open:void 0,onOpenChange:void 0,panel:void 0};className="deck-widget-box";placement=i.defaultProps.placement;title=i.defaultProps.title;widthPx=i.defaultProps.widthPx;collapsible=i.defaultProps.collapsible;isOpen=i.defaultProps.defaultOpen;uncontrolledPinned=!1;#e=i.defaultProps.panel;#t=null;#n=void 0;#i=!1;#o=!1;#r=void 0;constructor(e={}){super({...i.defaultProps,...e}),this.uncontrolledPinned=this.props.defaultPinned,this.setProps(this.props)}get side(){return this.props.side}get isPinned(){return this.props.pinnable&&(this.props.pinned??this.uncontrolledPinned)}get isDocked(){return this.isPinned&&this.isOpen}get isPinnable(){return this.props.pinnable}get floatingOffsetPx(){return Number.isFinite(this.props.offsetPx)?Math.max(0,this.props.offsetPx):0}get isContentOpen(){return this.isOpen}renderHeaderTitle(){let e=this.title??this.#e?.title??"Panel";return this.collapsible?(0,o.FD)("button",{type:"button",className:"deck-panel-chrome-toggle","aria-expanded":this.isOpen,"aria-label":`${this.isOpen?"Collapse":"Expand"} ${e}`,title:`${this.isOpen?"Collapse":"Expand"} ${e}`,onClick:()=>this.#a(!this.isOpen),children:[(0,o.Y)("span",{children:e}),(0,o.Y)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",focusable:"false",children:(0,o.Y)("path",{d:this.isOpen?"m6 9 6 6 6-6":"m9 6 6 6-6 6"})})]}):(0,o.Y)("span",{children:e})}changePinned(e){this.canPin&&this.props.pinnable&&(void 0===this.props.pinned&&(this.uncontrolledPinned=e),this.props.onPinnedChange?.(e),this.updateHTML())}setProps(e){let t;void 0!==this.props.pinned&&"pinned"in e&&void 0===e.pinned&&(this.uncontrolledPinned=this.props.pinned),void 0!==e.placement&&(this.placement=e.placement),"title"in e&&(this.title=e.title),void 0!==e.widthPx&&(this.widthPx=Number.isFinite(t=Math.max(220,Math.floor(e.widthPx)))?t:360),void 0!==e.collapsible&&(this.collapsible=e.collapsible),this.#s(e),"panel"in e&&(this.#e=e.panel),this.#d(),super.setProps(e)}onRemove(){super.onRemove(),this.#t&&(0,r.XX)(null,this.#t)}onRenderHTML(e){this.#t=e,this.#d()}onViewportChange(){this.#d()}#a=e=>{this.#o||(this.isOpen=e),this.#r?.(e),this.#d()};#d=()=>{if(!this.#t)return;let e=this.#t;if(e.classList.toggle("deck-panel-chrome",this.props.pinnable),this.props.pinnable?super.onRenderHTML(e):("true"===e.dataset.pinnable&&(this.panelManager?.updateDockedContainer(this),e.hidden=!1,e.style.width="",e.style.height="",e.style.maxWidth="",e.style.maxHeight="",e.dataset.pinnable="false"),this.#n=function(e){let t=e.parentElement;for(;t;){let n=t.ownerDocument.defaultView?.getComputedStyle(t);if((n?.overflow==="hidden"||n?.overflowX==="hidden"||n?.overflowY==="hidden")&&t.clientHeight>0){let n=t.getBoundingClientRect().bottom-e.getBoundingClientRect().top;return n>0?n:t.clientHeight}t=t.parentElement}}(e)),e.style.margin=this.isDocked?"0":`${this.floatingOffsetPx}px`,this.props.pinnable){this.isOpen||(e.style.width="max-content");return}(0,r.XX)((0,o.Y)(d,{panel:this.#e,title:this.title,widthPx:this.widthPx,maxHeightPx:this.#n,open:this.isOpen,collapsible:this.collapsible,onOpenChange:this.#a}),this.#t)};#s(e){if(this.#o=("open"in e?e.open:this.props.open)!==void 0,void 0!==e.onOpenChange&&(this.#r=e.onOpenChange),void 0!==e.open){this.isOpen=e.open,this.#i=!0;return}this.#i||void 0===e.defaultOpen||(this.isOpen=e.defaultOpen,this.#i=!0)}}function c(e){e.stopPropagation()}i=l;let p=(e,t)=>({width:`${e}px`,maxWidth:`min(84vw, ${e}px)`,...void 0===t?{}:{maxHeight:`${t}px`},boxSizing:"border-box",display:"flex",flexDirection:"column",pointerEvents:"auto",border:"var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))",borderRadius:"var(--panel-surface-radius, var(--panel-corner-radius, 12px))",background:"var(--menu-background, rgba(255, 255, 255, 0.96))",backdropFilter:"var(--menu-backdrop-filter, unset)",WebkitBackdropFilter:"var(--menu-backdrop-filter, unset)",color:"var(--menu-text, rgb(24, 24, 26))",boxShadow:"var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16))",overflow:"hidden"}),h={padding:"var(--panel-padding, 14px 16px 10px)",fontSize:"var(--panel-font-size, 18px)",fontWeight:700,lineHeight:1.2,color:"var(--button-text, currentColor)"},g={width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--panel-gap, 12px)",border:"none",background:"none",color:"inherit",padding:"0",margin:"0",cursor:"pointer",font:"inherit",textAlign:"left"},u=e=>({fontSize:"var(--panel-font-size, 18px)",lineHeight:1,color:"var(--button-icon-idle, #616166)",transform:e?"translateY(1px)":"translateY(-1px)"}),m=e=>({display:e?"block":"none",flex:"1 1 auto",minHeight:0,overflowX:"hidden",overflowY:"auto",touchAction:"pan-y",overscrollBehavior:"contain",padding:"var(--panel-padding, 0 16px 16px)"})},5524(e,t,n){n.d(t,{y:()=>c});var i=n(81413),o=n(60616),r=n(73228),a=n(77631);class s extends a.g{static defaultProps={...a.g.defaultProps,panel:void 0,placement:"top-left"}}var d=n(21992);n(43078);let l=(0,o.q6)(void 0);class c extends s{static defaultProps={...s.defaultProps,title:void 0,widthPx:320,heightPx:240,fitContent:!1,resizable:!1};className="deck-panel-chrome";placement="top-left";resizedWidth;resizedHeight;stopDrag;eventRoot;get isPinned(){return!0}get isDocked(){return this.isPinned}get isPinnable(){return!1}get canPin(){return!!this.panelManager?.contentElement}setProps(e){!0===e.fitContent&&(this.resizedWidth=void 0,this.resizedHeight=void 0),void 0!==e.widthPx&&e.widthPx!==this.props.widthPx&&(this.resizedWidth=void 0),void 0!==e.heightPx&&e.heightPx!==this.props.heightPx&&(this.resizedHeight=void 0),super.setProps(e)}reconcileProps(e){let t={...e};t.fitContent===this.props.fitContent&&delete t.fitContent,this.setProps(t)}onRenderHTML(e){if(this.eventRoot!==e)for(let t of(this.removeEventListeners(),this.eventRoot=e,h))e.addEventListener(t,g);(0,r.B)(e.ownerDocument),e.style.margin=this.isDocked?"0":`${this.floatingOffsetPx}px`,this.panelManager?.updateDockedContainer?.(this),e.hidden=this.isPinned&&!this.canPin;let{panel:t,title:n,fitContent:a,resizable:s}=this.props,c="left"===this.side||"right"===this.side,u=this.resizedWidth??p(this.props.widthPx,320),m=this.resizedHeight??p(this.props.heightPx,240);e.dataset.side=this.side,e.dataset.pinned=String(this.isPinned),e.dataset.docked=String(this.isDocked),e.dataset.pinnable=String(this.isPinnable),e.style.width=this.isDocked&&!c?"100%":a&&void 0===this.resizedWidth?"max-content":`${u}px`,e.style.height=this.isDocked&&!c?a&&void 0===this.resizedHeight?"max-content":`${m}px`:"";let b={pinned:this.isPinned,side:this.side,canPin:this.canPin};(0,o.XX)((0,i.Y)(l.Provider,{value:b,children:(0,i.FD)("section",{className:"deck-panel-chrome-shell","aria-label":n??"Panel",children:[n||this.isPinnable||this.hasHeaderActions?(0,i.FD)("header",{className:"deck-panel-chrome-header",children:[this.renderHeaderTitle(),this.renderHeaderActions(),this.isPinnable?(0,i.Y)("button",{type:"button",disabled:!this.canPin,"aria-label":this.isPinned?"Unpin panel":"Pin panel",title:this.isPinned?"Unpin panel":"Pin panel","aria-pressed":this.isPinned,onClick:()=>this.changePinned(!this.isPinned),children:(0,i.FD)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:this.isPinned?"currentColor":"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",focusable:"false",style:{transform:this.isPinned?"none":"rotate(45deg)"},children:[(0,i.Y)("path",{d:"M9 3h6l-1 7 4 4v2H6v-2l4-4-1-7Z"}),(0,i.Y)("path",{d:"M12 16v5"})]})}):null]}):null,(0,i.Y)("div",{className:"deck-panel-chrome-content",hidden:!this.isContentOpen,children:t?(0,i.Y)(d.U,{panel:t,children:t.content}):null}),this.isDocked&&this.canPin&&s?(0,i.Y)("div",{className:"deck-panel-chrome-divider",role:"separator",tabIndex:0,"aria-label":`Resize ${n??"panel"}`,"aria-orientation":c?"vertical":"horizontal","aria-valuemin":0,"aria-valuemax":Math.floor(this.getSizeLimit()),"aria-valuenow":Math.round(c?e.getBoundingClientRect().width:e.getBoundingClientRect().height),onPointerDown:e=>this.startResize(e),onKeyDown:t=>{let n=(c?{ArrowLeft:-1,ArrowRight:1}:{ArrowUp:-1,ArrowDown:1})[t.key];if(n){t.preventDefault();let i=e.getBoundingClientRect();this.resizePanel((c?i.width:i.height)+10*n*this.getResizeSign())}}}):null]})}),e)}onRemove(){this.stopDrag?.(),this.removeEventListeners(),this.rootElement&&(0,o.XX)(null,this.rootElement)}get floatingOffsetPx(){return 0}get hasHeaderActions(){return!1}renderHeaderActions(){return null}get isContentOpen(){return!0}renderHeaderTitle(){return(0,i.Y)("span",{children:this.props.title})}changePinned(e){}removeEventListeners(){if(this.eventRoot)for(let e of h)this.eventRoot.removeEventListener(e,g);this.eventRoot=void 0}getResizeSign(){return"right"===this.side||"bottom"===this.side?-1:1}getSizeLimit(){let e=this.panelManager?.parentElement;return e?("left"===this.side||"right"===this.side?e.clientWidth:e.clientHeight)*.45:0}resizePanel(e){let t=Math.max(0,Math.min(e,this.getSizeLimit()));"left"===this.side||"right"===this.side?this.resizedWidth=t:this.resizedHeight=t,this.updateHTML()}startResize(e){if(0!==e.button||!this.rootElement)return;e.preventDefault(),this.stopDrag?.();let t=e.currentTarget,n="left"===this.side||"right"===this.side,i=this.rootElement.getBoundingClientRect(),o=n?i.width:i.height,r=n?e.clientX:e.clientY,a=this.side;t.setPointerCapture(e.pointerId);let s=e=>{this.side===a&&this.isDocked?this.resizePanel(o+((n?e.clientX:e.clientY)-r)*this.getResizeSign()):this.stopDrag?.()},d=()=>{t.removeEventListener("pointermove",s),t.removeEventListener("pointerup",d),t.removeEventListener("pointercancel",d),t.removeEventListener("lostpointercapture",d),t.hasPointerCapture(e.pointerId)&&t.releasePointerCapture(e.pointerId),this.stopDrag=void 0};this.stopDrag=d,t.addEventListener("pointermove",s),t.addEventListener("pointerup",d),t.addEventListener("pointercancel",d),t.addEventListener("lostpointercapture",d)}}function p(e,t){return Number.isFinite(e)?Math.max(0,e):t}let h=["pointerdown","pointermove","pointerup","pointercancel","mousedown","mousemove","mouseup","touchstart","touchmove","touchend","touchcancel","click","dblclick","contextmenu","wheel"];function g(e){e.stopPropagation()}},77631(e,t,n){n.d(t,{g:()=>i});class i{static defaultProps={id:"panel-component",style:{},className:"",_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},i=this.rootElement;i&&t.className!==n.className&&(t.className&&i.classList.remove(t.className),n.className&&i.classList.add(n.className)),i&&!function(e,t){if(e===t)return!0;let n=Object.keys(e??{}),i=Object.keys(t??{});return n.length===i.length&&n.every(n=>e?.[n]===t?.[n])}(t.style,n.style)&&(function(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(r(n))}(i,t.style),o(i,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement("div");for(let t of["deck-widget",this.className,this.props.className])t&&e.classList.add(t);return o(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}}function o(e,t){if(t)for(let[n,i]of Object.entries(t))null!=i&&e.style.setProperty(r(n),String(i))}function r(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}},59732(e,t,n){n.d(t,{U:()=>l});var i=n(77631),o=n(5524);class r{parent;content;root;center;edges;marker;originalStyles;observer;constructor(e,t,n){this.parent=e,this.content=t;let i=e.ownerDocument;for(let e of(this.marker=i.createComment("panel-content"),t.before(this.marker),this.root=i.createElement("div"),this.root.className="deck-panel-layout",this.center=i.createElement("div"),this.center.className="deck-panel-layout-center",this.edges={},["top","left","right","bottom"])){let t=i.createElement("div");t.className="deck-panel-layout-edge",t.dataset.side=e,this.edges[e]=t,this.root.append(t)}for(let[e,n]of(this.root.append(this.center),this.marker.after(this.root),this.center.append(t),this.originalStyles=new Map,Object.entries({position:"absolute",top:"0px",right:"0px",bottom:"0px",left:"0px",width:"100%",height:"100%","min-width":"0px","min-height":"0px","margin-top":"0px","margin-right":"0px","margin-bottom":"0px","margin-left":"0px","box-sizing":"border-box"})))this.originalStyles.set(e,{value:t.style.getPropertyValue(e),priority:t.style.getPropertyPriority(e)}),t.style.setProperty(e,n);this.observer=new ResizeObserver(n),this.observer.observe(this.root),this.observer.observe(this.center)}updateLimits(){let{width:e,height:t}=this.root.getBoundingClientRect();for(let n of["top","left","right","bottom"]){let i="left"===n||"right"===n;for(let o of this.edges[n].children){let n=o.style;n.maxWidth=i?`${.45*e}px`:"",n.maxHeight=i?"":`${.45*t}px`}}}finalize(){for(let[e,{value:t,priority:n}]of(this.observer.disconnect(),this.marker.parentNode?this.marker.before(this.content):this.parent.append(this.content),this.originalStyles))t?this.content.style.setProperty(e,t,n):this.content.style.removeProperty(e);this.root.remove(),this.marker.remove()}}var a=n(73228);let s={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},d="root";class l{deck;parentElement;contentElement;layout;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,contentElement:t,deck:n=null,className:i}){if(t&&t.parentElement!==e)throw Error("PanelManager contentElement must be a direct child of parentElement");this.contentElement=t,this.deck=n,this.parentElement=e,this.className=i,(0,a.h)(e.ownerDocument),this.parentElement.classList.add("deck-widget-container"),i&&this.parentElement.classList.add(i)}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!function(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}(e.components,this.components)){let t=e.components.filter(c);this._setComponents(t)}}finalize(){for(let e of this.getComponents())this._removeComponent(e);for(let e in this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={},this.containers)this.containers[e].remove();this.containers={},this.layout?.finalize(),this.layout=void 0,this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove("deck-widget-container")}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let i of this.getComponents())if(i.viewId){let e=n[i.viewId];e&&this._notifyViewportChange(i,[e],t)}else this._notifyViewportChange(i,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:i}=n;i&&i!==e.viewport?.id||n.onHover?.(e,t)}}onEvent(e,t,n){for(let i of this.getComponents()){let{viewId:o}=i;o&&o!==t.viewport?.id||i[e]?.(t,n)}}updateDockedContainer(e){let t=e.rootElement;if(!t)return;if((0,a.B)(this.parentElement.ownerDocument),this.contentElement&&!this.layout)for(let e of(this.layout=new r(this.parentElement,this.contentElement,()=>this._updateContainers()),Object.values(this.containers)))this.layout.center.append(e);t.hidden=e.isPinned&&!this.contentElement;let n=e.isDocked&&this.layout?this.layout.edges[e.side]:this._getContainer(e._container??e.viewId??null,e.placement);if(t.parentElement!==n){let i=t.ownerDocument.activeElement,r=this.resolvedComponents.indexOf(e),a=e.isDocked&&r>=0?this.resolvedComponents.slice(r+1).find(t=>t instanceof o.y&&t.isDocked&&t.side===e.side&&t.rootElement?.parentElement===n):void 0;n.insertBefore(t,a?.rootElement??null),i instanceof HTMLElement&&t.contains(i)&&i.focus({preventScroll:!0})}t.style.maxWidth="",t.style.maxHeight="",this._updateContainers()}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;for(let e of(this.resolvedComponents.length=0,this.defaultComponents))t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e instanceof o.y?e.reconcileProps(n.props):e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}for(let t of(this.components=e,this.resolvedComponents))t instanceof o.y&&t.isDocked&&this.layout&&t.rootElement&&this.layout.edges[t.side].append(t.rootElement);this._updateContainers()}_addComponent(e){let{viewId:t=null,placement:n="top-left"}=e,i=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(i,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&"string"!=typeof e)return e;let n="string"==typeof e?e:d,i=this.containers[n];i||((i=this.parentElement.ownerDocument.createElement("div")).style.pointerEvents="none",i.style.position="absolute",i.style.overflow="hidden",(this.layout?.center??this.parentElement).append(i),this.containers[n]=i);let o=i.querySelector(`.${t}`);return o||((o=this.parentElement.ownerDocument.createElement("div")).className=t,o.style.position="absolute",o.style.zIndex="2",Object.assign(o.style,s[t]),i.append(o)),o}_updateContainers(){let e=this.deck;this.layout?.updateLimits();let t=this.layout?.center.clientWidth??e?.width??this.parentElement.clientWidth,n=this.layout?.center.clientHeight??e?.height??this.parentElement.clientHeight;for(let e of this.resolvedComponents)if(e instanceof o.y&&!e.isDocked&&e.rootElement){let i=e.rootElement.style,o=(parseFloat(i.marginLeft)||0)+(parseFloat(i.marginRight)||0),r=(parseFloat(i.marginTop)||0)+(parseFloat(i.marginBottom)||0);i.maxWidth=`${Math.max(0,t-o)}px`,i.maxHeight=`${Math.max(0,n-r)}px`}for(let e in this.containers){let i=this.lastViewports[e]||null,o=e===d||i,r=this.containers[e];o?(r.style.display="block",r.style.left=`${i?i.x:0}px`,r.style.top=`${i?i.y:0}px`,r.style.width=`${i?i.width:t}px`,r.style.height=`${i?i.height:n}px`):r.style.display="none"}}}function c(e){return e instanceof i.g}},21992(e,t,n){n.d(t,{U:()=>l});var i=n(81413),o=n(60616),r=n(43078),a=n(57957),s=n(73228);let d=(0,o.q6)(void 0);function l({panel:e,children:t}){var n,o;let p=(0,r.NT)(d),h=(0,r.li)(null),[g,u]=(0,r.J0)(!1),[m,b]=(0,r.J0)("light"),v=function(e,t){if("object"==typeof t)return t.base;if(t&&"inherit"!==t&&"invert"!==t)return t;if("invert"===t){let t="dark"===c(e)?"light":"dark";return e.startsWith("sleek-")?`sleek-${t}`:t}return e}(p??m,e.theme);return(0,r.Nf)(()=>{if(h.current&&(0,s.h)(h.current.ownerDocument),!p){let e=h.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=t.ownerDocument.defaultView?.getComputedStyle(t).getPropertyValue("--panel-preset").trim();u(!!(e&&Object.hasOwn(a.Yl,e)));let n=function(e){let t=e.ownerDocument.defaultView;if(!t)return"light";let n=t.getComputedStyle(e),i=n.getPropertyValue("--panel-preset").trim();if(Object.hasOwn(a.Yl,i))return i;let o=function(e){if(!e)return null;if(e.startsWith("#")){let t=e.slice(1);return 3===t.length?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}(n.getPropertyValue("--menu-background").trim());return o&&.5>function([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}(o)?"dark":"light"}(t);b(e=>e===n?e:n)};n();let i=new MutationObserver(()=>{n()});for(let e of function(e){let t=[],n=e,i=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==i);)n=n.parentElement;return t}(t))i.observe(e,{attributes:!0,attributeFilter:["style","class"]});return()=>{i.disconnect()}}},[p]),(0,i.Y)(d.Provider,{value:v,children:(0,i.Y)("div",{ref:h,"data-panel-theme-mode":c(v),"data-panel-theme-preset":v,style:(!e.theme||"inherit"===e.theme)&&(p||g)?void 0:(n=v,{..."object"==typeof(o=e.theme)?(0,a.XH)(o):a.Yl[n]}),children:t})})}function c(e){return"dark"===e||"sleek-dark"===e?"dark":"light"}}}]);
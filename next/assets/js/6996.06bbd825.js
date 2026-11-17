"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["6996"],{8100(e,t,i){function r(e){return 16===e.typeId}function s(e){return 2===e.typeId||3===e.typeId}function n(e,t={}){let{semantic:i="auto",...o}=t;if("position"===i&&(!r(e)||![2,3].includes(e.listSize)))throw Error("Arrow positions must be FixedSizeList[2] or FixedSizeList[3]");if("scalar"===i&&!s(e))throw Error("Arrow scalar input must be numeric");let a=o.format;if(a||("color"===i&&(a="unorm8x4"),"scalar"===i&&(a="float32"),"position"===i&&(a=r(e)&&2===e.listSize?"float32x2":"float32x3")),!a){let t=r(e)?e.listSize:1;a=1===t?"float32":`float32x${t}`}let l="color"===i||"unorm8x4"===a,c="float32"===a?1:Number(/x([234])$/.exec(a)?.[1]);if(!c||(l?"unorm8x4"!==a:!a.startsWith("float32")))throw Error(`Unsupported Arrow output format: ${a}`);let h=r(e),u=h?e.listSize:1;if(!s(h?e.children[0].type:e))throw Error("Arrow input must contain numeric values");if(!l&&!o.transform&&u>c||l&&![3,4].includes(u))throw Error("Arrow input width does not match the requested output format");return a}i.d(t,{H:()=>n})},67619(e,t,i){i.d(t,{_:()=>r});function r(e){return!!(e&&Number.isInteger(e.numRows)&&Array.isArray(e.schema?.fields)&&"function"==typeof e.get&&"function"==typeof e.getChild)}},83989(e,t,i){i.d(t,{A:()=>S});var r=i(69309);let s=()=>{},n={mode:"preserve"},o={mode:"hard"},a=e=>e;class l{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:i,startProps:r,endProps:s,duration:o,easing:a}}=e,l=a(t/o),c=i.interpolateProps(r,s,l);this.propsInTransition=this.getControllerState({...this.props,...c},n).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new r.A(e.timeline),this.onViewStateChange=e.onViewStateChange||s,this.onStateChange=e.onStateChange||s}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,i=this.props;if(this.props=e,!i||this._shouldIgnoreViewportChange(i,e))return!1;if(this._isTransitionEnabled(e)){let r=i;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...i,...2===e?t:this.propsInTransition||i}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:i}=e;return(t>0||"auto"===t)&&!!i}_isUpdateDueToCurrentTransition(e){return!!this.transition.inProgress&&!!this.propsInTransition&&this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition)}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?3===this.transition.settings.interruption||this._isUpdateDueToCurrentTransition(t):!this._isTransitionEnabled(t)||t.transitionInterpolator.arePropsEqual(e,t)}_triggerTransition(e,t){let i=this.getControllerState(e,n),r=this.getControllerState(t,o).shortestPathFrom(i),s=t.transitionInterpolator,l=s.getDuration?s.getDuration(e,t):t.transitionDuration;if(0===l)return;let c=s.initializeProps(e,r);this.propsInTransition={};let h={duration:l,easing:t.transitionEasing||a,interpolator:s,interruption:t.transitionInterruption||1,startProps:c.start,endProps:c.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(h),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}}var c=i(3005),h=i(72594),u=i(88967);let d={transitionDuration:0},f=e=>1-(1-e)*(1-e),p=e=>1===e?1:1-Math.pow(2,-10*e),g=["wheel"],m=["panstart","panmove","panend"],v=["pinchstart","pinchmove","pinchend"],y=["multipanstart","multipanmove","multipanend"],_=["dblclick"],b=["dblclickdragstart","dblclickdragmove","dblclickdragend","dblclickdragcancel"],w=["keydown"],P={};class S{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode="rotate",this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround="pointer",this.keyboard=!0,this.transitionManager=new l({...e,getControllerState:(t,i)=>new this.ControllerState({...t,constraintContext:i,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case"panstart":return!t&&this._onPanStart(e);case"panmove":return this._onPan(e);case"panend":return this._onPanEnd(e);case"pinchstart":return!t&&!!this._isTrackpadGestureAllowed(e)&&this._onPinchStart(e);case"pinchmove":return!!this._isTrackpadGestureAllowed(e)&&this._onPinch(e);case"pinchend":return!!this._isTrackpadGestureAllowed(e)&&this._onPinchEnd(e);case"multipanstart":return!t&&this._onMultiPanStart(e);case"multipanmove":return this._onMultiPan(e);case"multipanend":return this._onMultiPanEnd(e);case"dblclick":return this._onDoubleClick(e);case"dblclickdragstart":return!t&&this._onDoubleClickDragStart(e);case"dblclickdragmove":return this._onDoubleClickDrag(e);case"dblclickdragend":case"dblclickdragcancel":return this._onDoubleClickDragEnd(e);case"wheel":return this._onWheel(e);case"keydown":return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:i}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-i]}getZoomPosition(e){if("pointer"===this.zoomAround)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[i,r]=(0,u.VJ)(t.center,t.pixelProjectionMatrix);return[i,r]}isPointInBounds(e,t){let{width:i,height:r}=this.props;if(t&&t.handled)return!1;let s=e[0]>=0&&e[0]<=i&&e[1]>=0&&e[1]<=r;return s&&t&&t.stopPropagation(),s}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){void 0===e.maxBoundsPadding&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,"transitionInterpolator"in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:i}=e;this.inertia=Number.isFinite(i)?i:300*(!0===i);let{scrollZoom:r=!0,dragPan:s=!0,dragRotate:n=!0,doubleClickZoom:o=!0,doubleClickDragZoom:a=!1,touchZoom:l=!0,touchRotate:c=!1,multiTouchDrag:u=c?"rotate":null,trackpadGesture:d=!1,zoomAround:f="pointer",keyboard:p=!0}=e,P=!!this.onViewStateChange;if(this.toggleEvents(g,P&&r),this.toggleEvents(m,P),this.toggleEvents(v,P&&(l||"rotate"===u)),this.toggleEvents(y,P&&!!u),this.toggleEvents(_,P&&o),this.toggleEvents(b,P&&a),this.toggleEvents(w,P&&p),this.scrollZoom=r,this.dragPan=s,this.dragRotate=n,this.doubleClickZoom=o,this.doubleClickDragZoom=a,this.touchZoom=l,this.touchRotate="rotate"===u,this.multiTouchDrag=u,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),i=t.getViewportProps();Object.keys(i).some(t=>!(0,h.b)(i[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,i={}){let r={...e.getViewportProps(),...t},s=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(i),s){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:"update"===t?"elastic":"end"===t?"rebound":"hard"}:{mode:"hard"}}_getReboundTransition(e,t){if("rebound"!==e.mode)return null;let i=t.getViewportProps();return Object.keys(i).some(e=>!(0,h.b)(this.props[e],i[e],1))?{...this._getTransitionProps(),transitionDuration:300,transitionEasing:p}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||"pan"===this.dragMode)&&(i=!i);let r=i?"pan":"rotate",s=this._getConstraintContext(r,"start"),n=i?this.controllerState.panStart({pos:t},s):this.controllerState.rotateStart({pos:t},s);return this._panMove=i,this.updateViewport(n,d,{isDragging:!0}),!0}_onPan(e){return!!this.isDragging()&&(this._panMove?this._onPanMove(e):this._onPanRotate(e))}_onPanEnd(e){return!!this.isDragging()&&(this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e))}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),i=this.controllerState.pan({pos:t},this._getConstraintContext("pan","update"));return this.updateViewport(i,d,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let i=this.getCenter(e),r=[i[0]+e.velocityX*t/2,i[1]+e.velocityY*t/2],s=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(s,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:f},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext("pan","end"),i=e.panEnd(t),r=this._getReboundTransition(t,i);this.updateViewport(i,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),i=this.controllerState.rotate({pos:t},this._getConstraintContext("rotate","update"));return this.updateViewport(i,d,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let i=this.getCenter(e),r=[i[0]+e.velocityX*t/2,i[1]+e.velocityY*t/2],s=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(s,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:f},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext("rotate","end"),i=e.rotateEnd(t),r=this._getReboundTransition(t,i);this.updateViewport(i,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&"mouse"!==e.device)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:i=.01,smooth:r=!1}=!0===this.scrollZoom?{}:this.scrollZoom,{delta:s}=e,n=2/(1+Math.exp(-Math.abs(s*i)));s<0&&0!==n&&(n=1/n);let o=this.getZoomPosition(t),a=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:d,l=this.controllerState.zoom({pos:o,scale:n});return this.updateViewport(l,a,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let i=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r="trackpad"===e.pointerType,s={x:i.x-(r?0:e.deltaX),y:i.y-(r?0:e.deltaY)},n={...e,offsetCenter:s},o=this.getCenter(n),a="pan"===t?this.controllerState.panStart({pos:o},this._getConstraintContext("pan","start")):this.controllerState.rotateStart({pos:o},this._getConstraintContext("rotate","start"));return this._multiPanMode=t,this._multiPanStartCenter=s,this.updateViewport(a,d,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:i}=this._getMultiPanEvent(e);return!!t&&!!i&&!!this.isDragging()&&("pan"===t?this._onPanMove(i):this._onPanRotate(i))}_onMultiPanEnd(e){let{mode:t,event:i}=this._getMultiPanEvent(e);if(!t||!i||!this.isDragging())return this._resetMultiPan(),!1;let r="pan"===t?this._onPanMoveEnd(i):this._onPanRotateEnd(i);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return"trackpad"!==e.pointerType||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return"trackpad"===e.pointerType?this.trackpadGesture&&("pan"===t?this.dragPan:this.dragRotate):"touch"===e.pointerType&&("pan"===t?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,i=this._multiPanStartCenter;return t&&i?{mode:t,event:{...e,offsetCenter:{x:i.x+e.deltaX,y:i.y+e.deltaY}}}:{mode:null,event:null}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext("zoom","start")).rotateStart({pos:t},this._getConstraintContext("rotate","start"));return P._startPinchRotation=e.rotation,P._lastPinchEvent=e,this.updateViewport(i,d,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:i}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:i},this._getConstraintContext("zoom","update"))}if(this.touchRotate){let{rotation:i}=e;t=t.rotate({deltaAngleX:P._startPinchRotation-i},this._getConstraintContext("rotate","update"))}return this.updateViewport(t,d,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),P._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:i}=P;if(this.touchZoom&&t&&i&&e.scale!==i.scale){let r=this.getCenter(e),s=this.getZoomPosition(r),n=this.controllerState.rotateEnd(),o=Math.log2(e.scale),a=(o-Math.log2(i.scale))/(e.deltaTime-i.deltaTime),l=Math.pow(2,o+a*t/2);n=n.zoom({pos:s,scale:l}).zoomEnd(),this.updateViewport(n,{...this._getTransitionProps({around:s}),transitionDuration:t,transitionEasing:f},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext("zoom","end"),i=this._getConstraintContext("rotate","end"),r=e.zoomEnd(t).rotateEnd(i),s=this._getReboundTransition(this.touchZoom?t:i,r);this.updateViewport(r,s,{isDragging:!1,isPanning:!!s&&this.touchZoom,isZooming:!!s&&this.touchZoom,isRotating:!!s&&this.touchRotate})}return P._startPinchRotation=null,P._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),s=this.controllerState.zoom({pos:r,scale:i?.5:2});return this.updateViewport(s,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let i=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext("zoom","start"));return 1!==e.scale&&(i=i.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext("zoom","update"))),this.updateViewport(i,d,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let i=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext("zoom","update"));return this.updateViewport(i,d,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,i=this._getConstraintContext("zoom","end"),r=t.zoomEnd(i),s=this._getReboundTransition(i,r);return this.updateViewport(r,s,{isDragging:!1,isPanning:!!s,isZooming:!!s}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){let t;if(!this.keyboard)return!1;let i=this.isFunctionKeyPressed(e),{zoomSpeed:r,moveSpeed:s,rotateSpeedX:n,rotateSpeedY:o}=!0===this.keyboard?{}:this.keyboard,{controllerState:a}=this,l={};switch(e.srcEvent.code){case"Minus":t=i?a.zoomOut(r).zoomOut(r):a.zoomOut(r),l.isZooming=!0;break;case"Equal":t=i?a.zoomIn(r).zoomIn(r):a.zoomIn(r),l.isZooming=!0;break;case"ArrowLeft":i?(t=a.rotateLeft(n),l.isRotating=!0):(t=a.moveLeft(s),l.isPanning=!0);break;case"ArrowRight":i?(t=a.rotateRight(n),l.isRotating=!0):(t=a.moveRight(s),l.isPanning=!0);break;case"ArrowUp":i?(t=a.rotateUp(o),l.isRotating=!0):(t=a.moveUp(s),l.isPanning=!0);break;case"ArrowDown":i?(t=a.rotateDown(o),l.isRotating=!0):(t=a.moveDown(s),l.isPanning=!0);break;default:return!1}return this.updateViewport(t,this._getTransitionProps(),l),!0}_getTransitionProps(e){let{transition:t}=this;return t&&t.transitionInterpolator?e?{...t,transitionInterpolator:new c.A({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t:d}}},73708(e,t,i){i.d(t,{CI:()=>n,GT:()=>s,jo:()=>o});var r=i(71329);function s(e,t,i){let r=e-t;return r&&Number.isFinite(r)?t+r*i/(i+Math.abs(r)):t}function n(e,t,i){let s=(0,r.E9)((0,r.rk)(i?.left??0),e),n=(0,r.E9)((0,r.rk)(i?.right??0),e),o=(0,r.E9)((0,r.rk)(i?.top??0),t),a=(0,r.E9)((0,r.rk)(i?.bottom??0),t);return{x:s,y:o,width:e-s-n,height:t-o-a}}function o(e,t,i){let[r,s]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,s=Number.isFinite(s)?s:e.height/2,{left:r-i.x,right:i.x+i.width-r,top:s-i.y,bottom:i.y+i.height-s}}},4124(e,t,i){i.d(t,{A:()=>s,y:()=>r});let r=Symbol("constraintAround");class s{constructor(e,t,i,r){this.makeViewport=i,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}}},24059(e,t,i){i.d(t,{A:()=>o,k:()=>n});var r=i(2555);let s={};function n(e){s=e}function o(e,t,i,n){r.A.level>0&&s[e]&&s[e].call(null,t,i,n)}},62510(e,t,i){i.d(t,{We:()=>o,p5:()=>s,tg:()=>n});var r=i(92767);let s={common:0,meters:1,pixels:2},n={click:"onClick",dblclick:"onClick",panstart:"onDragStart",panmove:"onDrag",panend:"onDragEnd"},o={multipan:[r.uq,{threshold:10,pointers:2,trackpad:!0}],pinch:[r.h1,{trackpad:!0},null,["multipan"]],pan:[r.uq,{threshold:1},["pinch"],["multipan"]],dblclick:[r.Cx,{event:"dblclick",taps:2,enable:!1}],dblclickdrag:[r.Cp,{event:"dblclickdrag",enable:!1},["dblclick"],null],click:[r.Cx,{event:"click"},["dblclickdrag"],["dblclick","dblclickdrag"]]}},3452(e,t,i){i.d(t,{A:()=>tt});let r=1,s=1;class n{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;addChannel(e){let{delay:t=0,duration:i=1/0,rate:s=1,repeat:n=1}=e,o=r++,a={time:0,delay:t,duration:i,rate:s,repeat:n};return this._setChannelTime(a,this.time),this.channels.set(o,a),o}removeChannel(e){for(let[t,i]of(this.channels.delete(e),this.animations))i.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return void 0!==t&&this.time>=t.delay+t.duration*t.repeat}getTime(e){if(void 0===e)return this.time;let t=this.channels.get(e);return void 0===t?-1:t.time}setTime(e){for(let t of(this.time=Math.max(0,e),this.channels.values()))this._setChannelTime(t,this.time);for(let e of this.animations.values()){let{animation:t,channel:i}=e;t.setTime(this.getTime(i))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let i=s++;return this.animations.set(i,{animation:e,channel:t}),e.setTime(this.getTime(t)),i}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(-1===this.lastEngineTime&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let i=t-e.delay;i>=e.duration*e.repeat?e.time=e.duration*e.rate:(e.time=Math.max(0,i)%e.duration,e.time*=e.rate)}}var o=i(3687),a=i(20861),l=i(55077),c=i(90635);let h=[i(42081).A],u=[{name:"DECKGL_FILTER_SIZE",stage:"vertex",glsl:{parameters:"inout vec3 size, VertexGeometry geometry"},wgsl:{parameters:"size: ptr<function, vec3<f32>>, geometry: VertexGeometry"}},{name:"DECKGL_FILTER_GL_POSITION",stage:"vertex",glsl:{parameters:"inout vec4 position, VertexGeometry geometry"},wgsl:{parameters:"position: ptr<function, vec4<f32>>, geometry: VertexGeometry"}},{name:"DECKGL_FILTER_COLOR",stage:"vertex",glsl:{parameters:"inout vec4 color, VertexGeometry geometry"},wgsl:{parameters:"color: ptr<function, vec4<f32>>, geometry: VertexGeometry"}},{name:"DECKGL_FILTER_COLOR",stage:"fragment",glsl:{parameters:"inout vec4 color, FragmentGeometry geometry"},wgsl:{parameters:"color: ptr<function, vec4<f32>>, geometry: FragmentGeometry"}}];function d(e){let t="wgsl"===e?new o.R:new a.U;for(let e of h)t.addDefaultModule(e);for(let e of u)t.addShaderInjectionTarget(e);return t}let f=d("glsl"),p=d("wgsl");l.X.defaultProps.shaderAssembler=f,c.K.defaultProps.shaderAssembler=f;let g=`\
layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,m={name:"layer",source:`\
struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,vs:g,fs:g,getUniforms:e=>({opacity:Math.pow(e.opacity,1/2.2)}),uniformTypes:{opacity:"f32"}};var v=i(2825),y=i(2555),_=i(24059),b=i(7295),w=i(29947),P=i(327);class S{constructor(e,t,i){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=i,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let i=++this._loadCount,r=e;for(let t of("string"==typeof e&&(r=(0,P.H)(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===i&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===i&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e),this._subscribers))t.onChange(this.getData())}}class E{constructor(e){this.protocol=e.protocol||"resource://",this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return!!e.startsWith(this.protocol)||e in this._resources}add({resourceId:e,data:t,forceUpdate:i=!1,persistent:r=!0}){let s=this._resources[e];s?s.setData(t,i):(s=new S(e,t,this._context),this._resources[e]=s),s.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let e in t){let i=t[e],r=this._resources[i.resourceId];r&&r.unsubscribe(i)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:i,requestId:r="default"}){let{_resources:s,protocol:n}=this;e.startsWith(n)&&(s[e=e.replace(n,"")]||this.add({resourceId:e,data:null,persistent:!1}));let o=s[e];if(this._track(i,r,o,t),o)return o.getData()}prune(){this._pruneRequest||(this._pruneRequest=setTimeout(()=>this._prune(),0))}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,i,r){let s=this._consumers,n=s[e]=s[e]||{},o=n[t],a=o&&o.resourceId&&this._resources[o.resourceId];a&&(a.unsubscribe(o),this.prune()),i&&(o?(o.onChange=r,o.resourceId=i.id):o={onChange:r,resourceId:i.id},n[t]=o,i.subscribe(o))}_prune(){for(let e of(this._pruneRequest=null,Object.keys(this._resources))){let t=this._resources[e];t.persistent||t.inUse()||(t.delete(),delete this._resources[e])}}}var x=i(8994),C=i(82811);class A{constructor(e){this.resources=new Map,this.device=e}get(e){if(e.projectionMode!==C.K.CUSTOM_GEOSPATIAL)return;let t=this.resources.get(e.id);if(t?.signature===e.sizeScaleSignature)return t.resource;let i=performance.now(),r=e.getSizeScaleData(),s=performance.now(),n=this.create(r,64),o=performance.now();return y.A.log(3,`Size scale sampler [${e.id}] 64\xd764: generation ${(s-i).toFixed(2)} ms, ${"webgpu"===this.device.type?"buffer":"texture"} creation/upload submission ${(o-s).toFixed(2)} ms, total ${(o-i).toFixed(2)} ms`)(),t?.resource.destroy(),this.resources.set(e.id,{signature:e.sizeScaleSignature,resource:n}),n}delete(e){this.resources.get(e)?.resource.destroy(),this.resources.delete(e)}destroy(){for(let{resource:e}of this.resources.values())e.destroy();this.resources.clear()}create(e,t){return"webgpu"===this.device.type?this.device.createBuffer({id:"project-size-scale",data:e,usage:x.h.STORAGE|x.h.COPY_DST}):this.device.createTexture({id:"project-size-scale",width:t,height:t,format:"rgba32uint",data:new Uint32Array(e.buffer,e.byteOffset,e.length),sampler:{minFilter:"nearest",magFilter:"nearest",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}})}}var L=i(36411);class M{constructor(e,t){this._coordinateSystems=new Map,this._lastRenderedLayers=[],this._viewports=new Map,this._layerFilter=null,this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{(0,_.A)("layerManager.activateViewport",this,e);let t=!this.context.viewport;if(this.context.viewport=e||null,e&&t){for(let t of this.layers){let i=t.internalState;i&&this.isViewportReady(t)&&(i.viewport=e,t.setChangeFlags({viewportChanged:!0}))}this.setNeedsUpdate("viewport available")}};let{deck:i,stats:r,viewport:s,timeline:o}=t||{};this.layers=[],this.resourceManager=new E({device:e,protocol:"deck://"}),this.projectionScaleResources=new A(e),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:i,shaderAssembler:"wgsl"===(e?.info?.shadingLanguage||"glsl")?p:f,defaultShaderModules:[m],defaultShaderPlugins:[],renderPass:void 0,stats:r||new w.A({id:"deck.gl"}),viewport:s||null,timeline:o||new n,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){for(let e of(this.projectionScaleResources.destroy(),this.resourceManager.finalize(),this.layers))this._finalizeLayer(e);this._coordinateSystems.clear()}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;for(let i of(e.clearRedrawFlags&&(this._needsRedraw=!1),this.layers)){let r=i.getNeedsRedraw(e);t=t||r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?"layers changed":this._defaultShaderModulesChanged?"shader modules changed":this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>0===t.id.indexOf(e))):this.layers}setProps(e){"layerFilter"in e&&e.layerFilter!==this._layerFilter&&(this._layerFilter=e.layerFilter,this.setNeedsUpdate("layerFilter changed")),"debug"in e&&(this._debug=e.debug),"userData"in e&&(this.context.userData=e.userData),"layers"in e&&(this._nextLayers=e.layers),"onError"in e&&(this.context.onError=e.onError)}setLayers(e,t){if((0,_.A)("layerManager.setLayers",this,t,e),!this.context.viewport){this._nextLayers=e,this.setNeedsUpdate(t||"viewport pending");return}this._nextLayers=null,this._lastRenderedLayers=e;let i=(0,b.B)(e,Boolean);for(let e of i)e.context=this.context;this._updateLayers(this.layers,i)}updateLayers(){if(!this.context.viewport)return;let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}getViewports(){return this.context.deck?.getViewports()||(this.context.viewport?[this.context.viewport]:[])}setViewports(e,t){for(let i of(this._viewports=new Map(t.map(e=>[e.id,null])),e))this._viewports.set(i.id,i);for(let t of(this.context.viewport=e[0]||null,this.layers)){let e=t.internalState;if(!e?.viewport)continue;let i=this._viewports.get(e.viewport.id);null!==i&&i!==e.viewport&&(e.viewport=i,t.setChangeFlags({viewportChanged:!0}))}this.setNeedsUpdate("viewports changed")}isViewportReady(e){let t=e.internalState?.viewport;return!t||null!==this._viewports.get(t.id)}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,i=t.findIndex(t=>t.name===e.name);i>=0&&(t.splice(i,1),this._defaultShaderModulesChanged=!0)}addDefaultShaderPlugin(e){this.context.defaultShaderPlugins.some(t=>t.name===e.name)||(this.context.defaultShaderPlugins.push(e),e.module&&this.addDefaultShaderModule(e.module),this._defaultShaderModulesChanged=!0)}removeDefaultShaderPlugin(e){let t=this.context.defaultShaderPlugins.findIndex(t=>t.name===e.name);t>=0&&(this.context.defaultShaderPlugins.splice(t,1),e.module&&this.removeDefaultShaderModule(e.module),this._defaultShaderModulesChanged=!0)}_handleError(e,t,i){i.raiseError(t,`${e} of ${i}`)}_updateLayers(e,t){let i={};for(let t of e)i[t.id]?y.A.warn(`Multiple old layers with same id ${t.id}`)():i[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,i,r),this._finalizeOldLayers(i);let s=!1;for(let e of r)if(e.hasUniformTransition()){s=`Uniform transition in ${e}`;break}this._needsUpdate=s,this.layers=r}_updateSublayersRecursively(e,t,i){for(let r of e){r.context=this.context;let e=t[r.id];null===e&&y.A.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let s=null;try{this._debug&&e!==r&&r.validateProps(),e?.internalState&&this._transferLayerState(e,r);let t=r.internalState?void 0:this._getInitialViewport(r);this.isViewportReady(r)&&this._resolveLayerCrs(r,t)&&(r.internalState?this._updateLayer(r):this._initializeLayer(r,t)),i.push(r),s=r.internalState&&r.isComposite?r.getSubLayers():null}catch(e){this._handleError("matching",e,r)}s&&this._updateSublayersRecursively(s,t,i)}}_getInitialViewport(e){for(let t of this._viewports.size?this._viewports.values():[this.context.viewport])if(t&&(!this._layerFilter||this._layerFilter({layer:e.root,viewport:t,isPicking:!1,renderPass:"screen"})))return t}_resolveLayerCrs(e,t){let i=e.internalState?.viewport||t||this.context.viewport,r=(e.props.coordinateSystem??"default")==="default"?i.isGeospatial?"WGS84":"cartesian":e.props.coordinateSystem,s=this._coordinateSystems.get(e.id);if(!s||!(0,L.vk)(s.coordinateSystem,r)){s={coordinateSystem:r,layer:e},this._coordinateSystems.set(e.id,s);let t=r===i.crs?.signature?i.crs:(0,L.rs)(r);if(t instanceof Promise){s.pending=t;let i=s;t.then(t=>{this._coordinateSystems.get(e.id)===i&&(i.sourceCrs=t,i.pending=void 0,this.setNeedsUpdate("source CRS loaded"))},t=>{this._coordinateSystems.get(e.id)===i&&(i.error=t,i.pending=void 0,i.layer.raiseError(t,"loading coordinateSystem"))})}else s.sourceCrs=t}return s.coordinateSystem=r,s.layer=e,e._setSourceCrs(s.pending||s.error?void 0:s.sourceCrs),!s.pending&&!s.error}_finalizeOldLayers(e){for(let t in e){let i=e[t];i&&this._finalizeLayer(i)}}_initializeLayer(e,t){try{e._initialize(t),e.lifecycle=v.VD.INITIALIZED}catch(t){this._handleError("initialization",t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=v.VD.MATCHED,t!==e&&(e.lifecycle=v.VD.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError("update",t,e)}}_finalizeLayer(e){if(this._coordinateSystems.delete(e.id),!e.internalState){e.lifecycle=v.VD.FINALIZED;return}this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=v.VD.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=v.VD.FINALIZED}catch(t){this._handleError("finalization",t,e)}}}var T=i(72594);let O="default-canvas";class j{constructor(e){this._failedViews=new WeakSet,this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw="First render",this._needsUpdate="Initialize",this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange,onViewRemoved:e.onViewRemoved,onError:e.onError},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={},this.views=[]}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let i=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!("x"in e)||t.containsPixel(e);return i&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t="string"==typeof e?this.getView(e):e,i=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(i):i}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t="string"==typeof e?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let i=this.getViewports(),r={x:e[0],y:e[1]};for(let s=i.length-1;s>=0;--s){let n=i[s];if(n.containsPixel(r)){let i=e.slice();return i[0]-=n.x,i[1]-=n.y,n.unproject(i,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),("width"in e||"height"in e)&&this._setSize(e.width,e.height),"pickPosition"in e&&(this._pickPosition=e.pickPosition),"eventManagers"in e&&this._setEventManagers(e.eventManagers||{}),this.updateViewports()}updateViewports(){return!this._isUpdating&&!!this._needsUpdate&&(this._update(),!0)}_update(){this._isUpdating=!0;try{this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports())}finally{this._isUpdating=!1}}_hasViewState(e){let t=e.props.viewState;if(t&&"object"==typeof t&&!t.id||this.viewState[e.getViewStateId()])return!0;let i=Object.values(this.viewState);return 0===i.length||i.some(e=>!e||"object"!=typeof e||Array.isArray(e))}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate("Size changed"))}_setViews(e){e=(0,b.B)(e,Boolean);let t=this.views;if(e=e.map(e=>{let i=t.find(t=>t.id===e.id);return i&&!this._failedViews.has(i)&&i.equals(e)?i:e}),this._diffViews(e,t)){let t=new Set(e.map(e=>e.id));for(let e of this.views)t.has(e.id)||this._eventCallbacks.onViewRemoved?.(e.id);this.setNeedsUpdate("views changed")}for(let i of(this.views=e,e)){if(t.includes(i))continue;this._failedViews.delete(i);let e=e=>{this._failedViews.add(i),this.views.includes(i)&&(this._eventCallbacks.onError?this._eventCallbacks.onError(e):y.A.error(String(e))())};try{let t=i.initialize();t&&t.then(()=>{this.views.includes(i)&&this.setNeedsUpdate("view initialized")}).catch(e)}catch(t){e(t)}}}_setViewState(e){e?((0,T.b)(e,this.viewState,3)||this.setNeedsUpdate("viewState changed"),this.viewState=e):y.A.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate("eventManagers changed"))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||O}_getCanvasDimensions(e){let t=this._getCanvasContext?.(e.id),[i,r]=t?.getCSSSize()||[this.width,this.height];return{width:i,height:r}}_getViewEventManager(e){let t=this.getCanvasId(e)||O;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,i){return e&&(t?.canvasId!==i.canvasId||t?.eventManager!==i.eventManager)?(e.finalize(),null):e}_createController(e,t){return new t.type({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,i)=>this._pickPosition?.(t,i,e.id)})}_updateController(e,t,i,r){let s=e.controller;if(s&&i){let n={...t,...s,id:e.id,x:i.x,y:i.y,width:i.width,height:i.height};return r&&r.constructor===s.type||(r=this._createController(e,n)),r&&r.setProps(n),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:i}=this._startViewportRebuild(),r=!1;for(let s=e.length;s--;){let n=e[s],{width:o,height:a}=this._getCanvasDimensions(n),l=this._getViewEventManager(n);this._viewEventManagers[n.id]=l;let c=this.getViewState(n),h=n.makeViewport({viewState:c,width:o,height:a}),u=this._getReusableController(t[n.id],i[n.id],l),d=!!n.controller&&!!h;d&&!this._hasViewState(n)&&(d=!1),d&&!u&&(r=!0),(r||!d)&&u&&(u.finalize(),u=null),this.controllers[n.id]=d?this._updateController(n,c,h,u):null,h&&this._viewports.unshift(h)}for(let e in t){let i=t[e];i&&!this.controllers[e]&&i.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length!==t.length||e.some((e,i)=>!e.equals(t[i])||e!==t[i]&&this._failedViews.has(t[i]))}}var I=i(53340),R=i(25110),D=i(49105),B=i(83989),k=i(4124),z=i(73708),V=i(88967),U=i(18091),F=i(11579),N=i(3005);let G=[[-1/0,-90],[1/0,90]];function $([e,t]){if(Math.abs(t)>90&&(t=90*Math.sign(t)),Number.isFinite(e)){let[i,r]=(0,V.Gw)([e,t]);return[i,(0,D.qE)(r,0,512)]}let[,i]=(0,V.Gw)([0,t]);return[e,(0,D.qE)(i,0,512)]}class W extends k.A{constructor(e){let{width:t,height:i,latitude:r,longitude:s,zoom:n,bearing:o=0,pitch:a=0,altitude:l=1.5,position:c=[0,0,0],maxZoom:h=20,minZoom:u=0,maxPitch:d=60,minPitch:f=0,startPanLngLat:p,startZoomLngLat:g,startRotatePos:m,startRotateLngLat:v,startBearing:y,startPitch:_,startZoom:b,normalize:w=!0,rubberBand:P=!1}=e,{[k.y]:S}=e;(0,U.A)(Number.isFinite(s)),(0,U.A)(Number.isFinite(r)),(0,U.A)(Number.isFinite(n));let E=e.maxBounds||(w?G:null);super({width:t,height:i,latitude:r,longitude:s,zoom:n,bearing:o,pitch:a,altitude:l,maxZoom:h,minZoom:u,maxPitch:d,minPitch:f,normalize:w,position:c,maxBounds:E,maxBoundsPadding:e.maxBoundsPadding||null,rubberBand:P,...{[k.y]:S}},{startPanLngLat:p,startZoomLngLat:g,startRotatePos:m,startRotateLngLat:v,startBearing:y,startPitch:_,startZoom:b},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},i){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let s=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(s,i)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:void 0!==t?this._unproject3D(e,t):void 0,startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:i=0}){let r,{startRotatePos:s,startRotateLngLat:n,startBearing:o,startPitch:a}=this.getState();if(!s||void 0===o||void 0===a)return this;if(r=e?this._getNewRotation(e,s,a,o):{bearing:o+t,pitch:a+i},n){let e=this.makeViewport({...this.getViewportProps(),...r}),t="panByPosition3D"in e?"panByPosition3D":"panByPosition";return this._getUpdatedState({...r,...e[t](n,s)})}return this._getUpdatedState(r)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:i},r){let{startZoom:s,startZoomLngLat:n}=this.getState();return(n||(s=this.getViewportProps().zoom,n=this._unproject(t)||this._unproject(e)),n)?this._getUpdatedState({zoom:s+Math.log2(i),[k.y]:{position:n,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),i={...this.getViewportProps()},{bearing:r,longitude:s}=i;return Math.abs(r-t.bearing)>180&&(i.bearing=r<0?r+360:r-360),Math.abs(s-t.longitude)>180&&(i.longitude=s<0?s+360:s-360),i}applyConstraints(e,t){let i=e[k.y];delete e[k.y];let{maxPitch:r,minPitch:s,pitch:n,bearing:o,normalize:a,maxBounds:l,rubberBand:c}=e;a&&(o<-180||o>180)&&(e.bearing=(0,F.zi)(o+180,360)-180),e.pitch=(0,D.qE)(n,s,r);let h=this._constrainZoom(e.zoom,e),u=c&&t?.mode==="elastic";if(e.zoom=t?.mode==="preserve"?e.zoom:u?(0,z.GT)(e.zoom,h,1):h,i){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(i.position,i.screenPosition))}if(a&&(e.longitude<-180||e.longitude>180)&&(e.longitude=(0,F.zi)(e.longitude+180,360)-180),l){let i=(0,z.CI)(e.width,e.height,e.maxBoundsPadding),r=this.makeViewport({...e,bearing:0,pitch:0}),s=(0,z.jo)(r,[e.longitude,e.latitude],i),n=$(l[0]),o=$(l[1]),a=2**e.zoom,c=[n[0]+s.left/a,n[1]+s.bottom/a],h=[o[0]-s.right/a,o[1]-s.top/a],d=$([e.longitude,e.latitude]),f=[(0,D.qE)(d[0],c[0],h[0]),(0,D.qE)(d[1],c[1],h[1])],p=d.slice();if(i.width>=0&&(p[0]=t?.mode==="preserve"?d[0]:u?(0,z.GT)(d[0],f[0],i.width/2/a):f[0]),i.height>=0&&(p[1]=t?.mode==="preserve"?d[1]:u?(0,z.GT)(d[1],f[1],i.height/2/a):f[1]),p[0]!==d[0]||p[1]!==d[1]){let[t,i]=(0,V.iV)(p);p[0]!==d[0]&&(e.longitude=t),p[1]!==d[1]&&(e.latitude=i)}}return e}_constrainZoom(e,t){t||(t=this.getViewportProps());let{maxZoom:i,maxBounds:r}=t,s=null!==r&&t.width>0&&t.height>0,{minZoom:n}=t;if(s){let e=(0,z.CI)(t.width,t.height,t.maxBoundsPadding),s=$(r[0]),o=$(r[1]),a=o[0]-s[0],l=o[1]-s[1];e.width>0&&Number.isFinite(a)&&a>0&&(n=Math.max(n,Math.log2(e.width/a))),e.height>0&&Number.isFinite(l)&&l>0&&(n=Math.max(n,Math.log2(e.height/l))),n>i&&(n=i)}return(0,D.qE)(e,n,i)}_zoomFromCenter(e,t){let{width:i,height:r}=this.getViewportProps();return this.zoom({pos:[i/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:i,height:r}=this.getViewportProps();return this.pan({startPos:[i/2,r/2],pos:[i/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,i,r){let s=e[0]-t[0],n=e[1]-t[1],o=e[1],a=t[1],{width:l,height:c}=this.getViewportProps(),h=0;n>0?Math.abs(c-a)>5&&(h=n/(a-c)*1.2):n<0&&a>5&&(h=1-o/a),h=(0,D.qE)(h,-1,1);let{minPitch:u,maxPitch:d}=this.getViewportProps(),f=i;return h>0?f=i+h*(d-i):h<0&&(f=i-h*(u-i)),{pitch:f,bearing:r+s/l*180}}}class Y extends B.A{constructor(){super(...arguments),this.ControllerState=W,this.transition={transitionDuration:300,transitionInterpolator:new N.A({transitionProps:{compare:["longitude","latitude","zoom","bearing","pitch","position"],required:["longitude","latitude","zoom"]}})},this.dragMode="pan",this.rotationPivot="center",this._getAltitude=e=>{if("2d"===this.rotationPivot)return 0;if("3d"===this.rotationPivot&&this.pickPosition){let{x:t,y:i}=this.props,r=this.pickPosition(t+e[0],i+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){"rotationPivot"in e&&(this.rotationPivot=e.rotationPivot||"center"),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(!1===e.normalize?null:G),super.setProps(e)}updateViewport(e,t=null,i={}){let r=e.getState();i.isDragging&&r.startRotateLngLat?i={...i,rotationPivotPosition:r.startRotateLngLat}:!1===i.isDragging&&(i={...i,rotationPivotPosition:void 0}),super.updateViewport(e,t,i)}}class H extends I.A{constructor(e={}){super(e)}getViewportType(){return R.A}get ControllerType(){return Y}}H.displayName="MapView";let q=[255,255,255],J=0;class Z{constructor(e={}){this.type="ambient";let{color:t=q}=e,{intensity:i=1}=e;this.id=e.id||`ambient-${J++}`,this.color=t,this.intensity=i}}var K=i(78861);let X=[255,255,255],Q=[0,0,-1],ee=0;class et{constructor(e={}){this.type="directional";let{color:t=X}=e,{intensity:i=1}=e,{direction:r=Q}=e,{_shadow:s=!1}=e;this.id=e.id||`directional-${ee++}`,this.color=t,this.intensity=i,this.type="directional",this.direction=new K.P(r).normalize().toArray(),this.shadow=s}getProjectedLight(e){return this}}var ei=i(94022);class er{constructor(e,t={id:"pass"}){let{id:i}=t;this.id=i,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}}let es={colorMask:15,depthWriteEnabled:!0,depthCompare:"less-equal",blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one-minus-src-alpha",blendAlphaOperation:"add",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one-minus-src-alpha"};class en extends er{constructor(){super(...arguments),this._lastRenderIndex=-1,this._activatedLayers=new Set}render(e){this._render(e)}_render(e){if("webgl"===this.device.type&&void 0!==e.colorMask){let t=e.colorMask;return this.device.withParametersWebGL({colorMask:[!!(1&t),!!(2&t),!!(4&t),!!(8&t)]},()=>this._renderLayers(e))}return this._renderLayers(e)}_renderLayers(e){this._activatedLayers.clear();let{canvasContext:t=this.device.canvasContext}=e,i=e.target??t.getCurrentFramebuffer(),[r,s]=t.getDrawingBufferSize(),n=e.clearCanvas??!0,o=e.clearColor??(!!n&&[0,0,0,0]),a=!!n&&1,l=!!n&&0,c={viewport:[0,0,r,s]};e.scissorRect&&(c.scissorRect=e.scissorRect);let{shaderModuleProps:h,viewports:u,views:d,onViewportActive:f,clearStack:p=!0}=e,g=e.pass||"unknown",m="webgpu"===this.device.type;p&&(this._lastRenderIndex=-1);let v=[];if(!u.length)return this.device.beginRenderPass({framebuffer:i,parameters:c,clearColor:o,clearDepth:a,clearStencil:l}).end(),this.device.submit(),v;try{for(let r of u){f?.(r);let s=this._getDrawLayerParams(r,e),n=d&&d[r.id],u=r.subViewports||[r];for(let r of m?u.map(e=>[e]):[u]){let u=this.device.beginRenderPass({framebuffer:i,parameters:c,clearColor:o,clearDepth:a,clearStencil:l});try{for(let o of r){let r=this._drawLayersInViewport(u,{target:i,canvasContext:t,shaderModuleProps:h,viewport:o,view:n,pass:g,layers:e.layers,isPicking:e.isPicking},s);v.push(r)}}finally{u.end(),m&&this.device.submit()}o=!1,a=!1,l=!1}}return v}finally{m||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:i,isPicking:r=!1,layerFilter:s,cullRect:n,views:o,effects:a,canvasContext:l=this.device.canvasContext,colorMask:c,shaderModuleProps:h},u=!1){let d=[],f=function e(t=0,i={}){let r={},s=(n,o)=>{let a,l=n.props._offset,c=n.id,h=n.parent&&n.parent.id;if(!h||h in i||s(n.parent,!1),h in r){let t=r[h]=r[h]||e(i[h],i);a=t(n,o),r[c]=t}else Number.isFinite(l)?(a=l+(i[h]||0),r[c]=null):a=t;return o&&a>=t&&(t=a+1),i[c]=a,a};return s}(this._lastRenderIndex+1),p={layer:t[0],viewport:e,isPicking:r,renderPass:i,cullRect:n},g={};for(let r=0;r<t.length;r++){let n=t[r],m=this._shouldDrawLayer(n,p,s,g),v={shouldDrawLayer:m};m&&!u&&(v.shouldDrawLayer=!0,v.layerRenderIndex=f(n,m),v.shaderModuleProps=this._getShaderModuleProps(n,a,i,l,h),v.layerParameters={..."webgpu"===n.context.device.type?es:null,...n.context.deck?.props.parameters,...o?.[e.id]?.props.parameters,...this.getLayerParameters(n,r,e)},void 0!==c&&(v.layerParameters.colorMask=c)),d[r]=v}return d}_drawLayersInViewport(e,{layers:t,shaderModuleProps:i,pass:r,target:s,canvasContext:n,viewport:o,view:a,isPicking:l},c){let h=function(e,{canvasContext:t=e.canvasContext,shaderModuleProps:i,target:r,viewport:s}){let n=i?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),a=r?r.height:o,l="webgpu"===e.type?s.y*n:a-(s.y+s.height)*n;return[s.x*n,l,s.width*n,s.height*n]}(this.device,{canvasContext:n,shaderModuleProps:i,target:s,viewport:o});if(a){let{clear:e,clearColor:t,clearDepth:i,clearStencil:r}=a.props;if(e){let e=[0,0,0,0],n=1,o=0;Array.isArray(t)&&!l?e=[...t.slice(0,3),t[3]||255].map(e=>e/255):!1===t&&(e=!1),void 0!==i&&(n=i),void 0!==r&&(o=r),this.device.beginRenderPass({framebuffer:s,parameters:{viewport:h,scissorRect:h},clearColor:e,clearDepth:n,clearStencil:o}).end()}}let u={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:h});for(let i=0;i<t.length;i++){let s=t[i],n=c[i],{shouldDrawLayer:a}=n;if(a&&s.props.pickable&&u.pickableCount++,s.isComposite&&u.compositeCount++,s.isDrawable&&n.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:i,layerParameters:a}=n;u.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),i.project&&(i.project.viewport=o),s.context.renderPass=e;try{s._drawLayer({renderPass:e,shaderModuleProps:i,uniforms:{layerIndex:t},parameters:a})}catch(e){s.raiseError(e,`drawing ${s} to ${r}`)}}}return u}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,i){return null}getLayerParameters(e,t,i){return e.props.parameters}_shouldDrawLayer(e,t,i,r){if(!e.internalState||!e.isCoordinateSystemLoaded||!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let s=e.parent;for(;s;){if(!s.isCoordinateSystemLoaded||!s.props.visible||!s.filterSubLayer(t))return!1;t.layer=s,s=s.parent}if(i){let e=t.layer.id;if(e in r||(r[e]=i(t)),!r[e])return!1}return t.isPicking||this._activatedLayers.has(e)||(this._activatedLayers.add(e),e.activateViewport(t.viewport)),!0}_getShaderModuleProps(e,t,i,r,s){let n=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,a={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,sizeScale:e.context.layerManager.projectionScaleResources.get(e.context.viewport),devicePixelRatio:n,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,sourceCrs:e.internalState.sourceCrs,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let i of t)eo(a,i.getShaderModuleProps?.(e,a));for(let t of e.context.defaultShaderModules)t.name in a||(a[t.name]={});return eo(a,this.getShaderModuleProps(e,t,a),s)}}function eo(e,...t){for(let i of t)if(i)for(let t in i)e[t]?Object.assign(e[t],i[t]):e[t]=i[t];return e}class ea extends en{constructor(e,t){super(e,t);let i=e.createTexture({format:"rgba8unorm",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}}),r=e.createTexture({format:"depth16unorm",width:1,height:1});this.fbo=e.createFramebuffer({id:"shadowmap",width:1,height:1,colorAttachments:[i],depthStencilAttachment:r})}delete(){this.fbo&&(this.fbo.destroy(),this.fbo=null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,i=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],s=r.width*i,n=r.height*i;(s!==t.width||n!==t.height)&&t.resize({width:s,height:n}),super.render({...e,clearColor:[1,1,1,1],target:t,pass:"shadow"})}getLayerParameters(e,t,i){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:"less-equal",depthBias:0}}shouldDrawLayer(e){return!1!==e.props.shadowEnabled}getShaderModuleProps(e,t,i){return{shadow:{project:i.project,drawToShadowMap:!0},lighting:{enabled:!1}}}}var el=i(91253),ec=i(62585);let eh=`
layout(std140) uniform shadowUniforms {
  bool drawShadowMap;
  bool useShadowMap;
  vec4 color;
  highp int lightId;
  float lightCount;
  mat4 viewProjectionMatrix0;
  mat4 viewProjectionMatrix1;
  vec4 projectCenter0;
  vec4 projectCenter1;
} shadow;
`,eu=`
const int max_lights = 2;

out vec3 shadow_vPosition[max_lights];

vec4 shadow_setVertexPosition(vec4 position_commonspace) {
  mat4 viewProjectionMatrices[max_lights];
  viewProjectionMatrices[0] = shadow.viewProjectionMatrix0;
  viewProjectionMatrices[1] = shadow.viewProjectionMatrix1;
  vec4 projectCenters[max_lights];
  projectCenters[0] = shadow.projectCenter0;
  projectCenters[1] = shadow.projectCenter1;

  if (shadow.drawShadowMap) {
    return project_common_position_to_clipspace(position_commonspace, viewProjectionMatrices[shadow.lightId], projectCenters[shadow.lightId]);
  }
  if (shadow.useShadowMap) {
    for (int i = 0; i < max_lights; i++) {
      if(i < int(shadow.lightCount)) {
        vec4 shadowMap_position = project_common_position_to_clipspace(position_commonspace, viewProjectionMatrices[i], projectCenters[i]);
        shadow_vPosition[i] = (shadowMap_position.xyz / shadowMap_position.w + 1.0) / 2.0;
      }
    }
  }
  return gl_Position;
}
`,ed=`
${eh}
${eu}
`,ef=`
const int max_lights = 2;
uniform sampler2D shadow_uShadowMap0;
uniform sampler2D shadow_uShadowMap1;

in vec3 shadow_vPosition[max_lights];

const vec4 bitPackShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
const vec4 bitUnpackShift = 1.0 / bitPackShift;
const vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0,  0.0);

float shadow_getShadowWeight(vec3 position, sampler2D shadowMap) {
  vec4 rgbaDepth = texture(shadowMap, position.xy);

  float z = dot(rgbaDepth, bitUnpackShift);
  return smoothstep(0.001, 0.01, position.z - z);
}

vec4 shadow_filterShadowColor(vec4 color) {
  if (shadow.drawShadowMap) {
    vec4 rgbaDepth = fract(gl_FragCoord.z * bitPackShift);
    rgbaDepth -= rgbaDepth.gbaa * bitMask;
    return rgbaDepth;
  }
  if (shadow.useShadowMap) {
    float shadowAlpha = 0.0;
    shadowAlpha += shadow_getShadowWeight(shadow_vPosition[0], shadow_uShadowMap0);
    if(shadow.lightCount > 1.0) {
      shadowAlpha += shadow_getShadowWeight(shadow_vPosition[1], shadow_uShadowMap1);
    }
    shadowAlpha *= shadow.color.a / shadow.lightCount;
    float blendedAlpha = shadowAlpha + color.a * (1.0 - shadowAlpha);

    return vec4(
      mix(color.rgb, shadow.color.rgb, shadowAlpha / blendedAlpha),
      blendedAlpha
    );
  }
  return color;
}
`,ep=`
${eh}
${ef}
`,eg=(0,ec.A)(function({viewport:e,center:t}){return new ei.k(e.viewProjectionMatrix).invert().transform(t)}),em=(0,ec.A)(function({viewport:e,shadowMatrices:t}){let i=[],r=function(e){let{width:t,height:i,pixelUnprojectionMatrix:r}=e,s=[[0,0],[t,0],[t,i],[0,i]],n=s.map(([e,t])=>(0,V.xJ)([e,t,-1],r)),o=s.map(([e,t])=>(0,V.xJ)([e,t,1],r));if(!e.isGeospatial)return n.concat(o);let a=n.concat(o).filter(e=>e[2]>=0);for(let e=0;e<4;e++){let t=(e+1)%4;for(let[i,r]of[[n[e],o[e]],[n[e],n[t]],[o[e],o[t]]])if(i[2]<0!=r[2]<0){let e=i[2]/(i[2]-r[2]);a.push([i[0]+(r[0]-i[0])*e,i[1]+(r[1]-i[1])*e,0])}}return a.length>0?a:n.concat(o)}(e);for(let s of t){let t=s.clone().translate(new K.P(e.center).negate()),n=r.map(e=>t.transform(e)),o=new ei.k().ortho({left:Math.min(...n.map(e=>e[0])),right:Math.max(...n.map(e=>e[0])),bottom:Math.min(...n.map(e=>e[1])),top:Math.max(...n.map(e=>e[1])),near:Math.min(...n.map(e=>-e[2])),far:Math.max(...n.map(e=>-e[2]))});i.push(o.multiplyRight(s))}return i}),ev=[0,0,0,1],ey=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],e_={name:"shadow",module:{name:"shadow",dependencies:[el.A],vs:ed,fs:ep,getUniforms:function(e){let{shadowEnabled:t=!0,project:i}=e;if(!t||!i||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=el.A.getUniforms(i),s=eg({viewport:i.viewport,center:r.center}),n=[],o=em({shadowMatrices:e.shadowMatrices,viewport:i.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],a=e.clone().translate(new K.P(i.viewport.center).negate());r.coordinateFrame===C.r.GEODETIC&&r.projectionMode===C.K.WEB_MERCATOR?(o[t]=a,n[t]=s):(o[t]=e.clone().multiplyRight(ey),n[t]=a.transform(s))}let a={drawShadowMap:!!e.drawToShadowMap,useShadowMap:!!e.shadowMaps&&e.shadowMaps.length>0,color:e.shadowColor||ev,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)a[`viewProjectionMatrix${e}`]=o[e],a[`projectCenter${e}`]=n[e];for(let t=0;t<2;t++)a[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return a},uniformTypes:{drawShadowMap:"f32",useShadowMap:"f32",color:"vec4<f32>",lightId:"i32",lightCount:"f32",viewProjectionMatrix0:"mat4x4<f32>",viewProjectionMatrix1:"mat4x4<f32>",projectCenter0:"vec4<f32>",projectCenter1:"vec4<f32>"}},injections:{"glsl:vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"glsl:fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `}},eb={color:[255,255,255],intensity:1},ew=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],eP=[0,0,0,200/255];class eS{constructor(e={}){this.id="lighting-effect",this.shadowColor=eP,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:i}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),i._addDefaultShaderPlugin(e_),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){for(let t in this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[],e){let i=e[t];switch(i.type){case"ambient":this.ambientLight=i;break;case"directional":this.directionalLights.push(i);break;case"point":this.pointLights.push(i)}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&(this.shadow||this.cleanup(this.context),this.setup(this.context)),this.props=e}preRender({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:s}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let n=0;n<this.shadowPasses.length;n++)this.shadowPasses[n].render({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:s,shaderModuleProps:{shadow:{shadowLightId:n,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let i=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,lights:this._getLights(e)},s=e.props.material;return{shadow:i,lighting:r,phongMaterial:s,gouraudMaterial:s}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderPlugin(e_))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let i=new ei.k().lookAt({eye:new K.P(t.direction).negate()});e.push(i)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let i=new ea(e);this.shadowPasses[t]=i}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:i}=this;e||0!==t.length||0!==i.length||(this.ambientLight=new Z(eb),this.directionalLights.push(new et(ew[0]),new et(ew[1])))}_getLights(e){let t=[];for(let i of(this.ambientLight&&t.push(this.ambientLight),this.pointLights))t.push(i.getProjectedLight({layer:e}));for(let i of this.directionalLights)t.push(i.getProjectedLight({layer:e}));return t}}let eE=new eS;class ex{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw="Initial render",this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let i=t.findIndex(t=>(t.order??1/0)-(e.order??1/0)>0);i<0?t.push(e):t.splice(i,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){"effects"in e&&!(0,T.b)(e.effects,this.effects,1)&&this._setEffects(e.effects)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let i=[];for(let r of e){let e=t[r.id],s=r;e&&e!==r?e.setProps?(e.setProps(r.props),s=e):e.cleanup(this._context):e||r.setup(this._context),i.push(s),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=i,this._resolvedEffects=i.concat(this._defaultEffects),e.some(e=>e instanceof eS)||this._resolvedEffects.push(eE),this._needsRedraw="effects changed"}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}}class eC extends en{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes("draw")||t.includes("terrain")}render(e){return this._render(e)}}let eA={blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"zero",blendAlphaOperation:"add",blendAlphaSrcFactor:"constant",blendAlphaDstFactor:"zero"};class eL extends en{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return"pickingFBO"in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:i,viewports:r,onViewportActive:s,pickingFBO:n,deviceRect:{x:o,y:a,width:l,height:c},cullRect:h,effects:u,pass:d="picking",pickZ:f,canvasContext:p,shaderModuleProps:g,clearColor:m}){this.pickZ=f;let v=this._resetColorEncoder(f),y="webgpu"===this.device.type?n.height-a-c:a,_=super._render({target:n,layers:e,layerFilter:t,views:i,viewports:r,onViewportActive:s,cullRect:h,effects:u?.filter(e=>e.useInPicking),pass:d,canvasContext:p,isPicking:!0,shaderModuleProps:g,clearColor:m??[0,0,0,0],colorMask:15,scissorRect:[o,y,l,c]});return this._colorEncoderState=null,{decodePickingColor:v&&eT.bind(null,v),stats:_}}shouldDrawLayer(e){let{pickable:t,operation:i}=e.props;return t&&i.includes("draw")||i.includes("terrain")||i.includes("mask")}getShaderModuleProps(e,t,i){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,i){let r={...e.props.parameters},{pickable:s,operation:n}=e.props;return this._colorEncoderState?s&&n.includes("draw")?(Object.assign(r,eA),r.blend=!0,"webgpu"===this.device.type?r.blendConstant=eM(this._colorEncoderState,e,i):r.blendColor=eM(this._colorEncoderState,e,i),n.includes("terrain")&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor="one")):n.includes("terrain")&&(r.blend=!1):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}}function eM(e,t,i){let r,{byLayer:s,byAlpha:n}=e,o=s.get(t);return o?(o.viewports.push(i),r=o.a):(r=s.size+1)<=255?(o={a:r,layer:t,viewports:[i]},s.set(t,o),n[r]=o):(y.A.warn("Too many pickable layers, only picking the first 255")(),r=0),[0,0,0,r/255]}function eT(e,t){let i=e.byAlpha[t[3]];return i&&{pickedLayer:i.layer,pickedViewports:i.viewports,pickedObjectIndex:i.layer.decodePickingColor(t)}}class eO{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new eC(e),this.pickLayersPass=new eL(e),this.renderCount=0,this._needsRedraw="Initial render",this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw="layerFilter changed"),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw="drawPickingColors changed")}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,i={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let e=t.render(i),r="stats"in e?e.stats:e;this._updateStats(r);return}i.effects&&this._preRender(i.effects,i);let r=this.lastPostProcessEffect?this.renderBuffers[0]:i.target;this.lastPostProcessEffect&&(i.clearColor=[0,0,0,0],i.clearCanvas=!0);let s=t.render({...i,target:r}),n="stats"in s?s.stats:s;i.effects&&(this.lastPostProcessEffect&&(i.clearCanvas=void 0===e.clearCanvas||e.clearCanvas),this._postRender(i.effects,i)),this.renderCount++,(0,_.A)("deckRenderer.renderLayers",this,n,e),this._updateStats(n)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:i}of e)t+=i;this.stats.get("Layers rendered").addCount(t)}_preRender(e,t){for(let i of(this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{},e))t.preRenderStats[i.id]=i.preRender(t),i.postRender&&(this.lastPostProcessEffect=i.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,i=e.getDrawingBufferSize(),[r,s]=i;for(let e of(0===t.length&&[0,1].map(e=>{let i=this.device.createTexture({sampler:{minFilter:"linear",magFilter:"linear"},width:r,height:s});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,colorAttachments:[i]}))}),t))e.resize(i)}_postRender(e,t){let{renderBuffers:i}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,s={...t,inputBuffer:i[0],swapBuffer:i[1]};for(let t of e)if(t.postRender){s.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(s);s.inputBuffer=e,s.swapBuffer=e===i[0]?i[1]:i[0]}}}var ej=i(55861);let eI={pickedColor:null,pickedObjectIndex:-1};function eR({pickedColors:e,decodePickingColor:t,deviceX:i,deviceY:r,deviceRadius:s,deviceRect:n}){let{x:o,y:a,width:l,height:c}=n,h=s*s,u=-1,d=0;for(let t=0;t<c;t++){let s=t+a-r,n=s*s;if(n>h)d+=4*l;else for(let t=0;t<l;t++){if(e[d+3]-1>=0){let e=t+o-i,r=e*e+n;r<=h&&(h=r,u=d)}d+=4}}if(u>=0){let i=e.slice(u,u+4),r=t(i);if(r){let e=Math.floor(u/4/l),t=u/4-e*l;return{...r,pickedColor:i,pickedX:o+t,pickedY:a+e}}y.A.error("Picked non-existent layer. Is picking buffer corrupt?")()}return eI}function eD({pickedColors:e,decodePickingColor:t}){let i=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let s=e.slice(r,r+4),n=s.join(",");if(!i.has(n)){let e=t(s);e?i.set(n,{...e,color:s}):y.A.error("Picked non-existent layer. Is picking buffer corrupt?")()}}}return Array.from(i.values())}function eB({pickInfo:e,viewports:t,pixelRatio:i,x:r,y:s,z:n}){let o,a=t[0];if(t.length>1&&(a=function(e,t){for(let i=e.length-1;i>=0;i--){let r=e[i];if(r.containsPixel(t))return r}return e[0]}(e?.pickedViewports||t,{x:r,y:s})),a){let e=[r-a.x,s-a.y];void 0!==n&&(e[2]=n);try{(o=a.unproject(e)).every(Number.isFinite)||(o=null)}catch{o=null}}return{color:null,layer:null,viewport:a,index:-1,picked:!1,x:r,y:s,pixel:[r,s],coordinate:o,devicePixel:e&&"pickedX"in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:i}}function ek(e){let{pickInfo:t,lastPickedInfo:i,mode:r,layers:s}=e,{pickedColor:n,pickedLayer:o,pickedObjectIndex:a}=t,l=o?[o]:[];if("hover"===r){let e=i.index,t=i.layerId,r=o?o.props.id:null;if(r!==t||a!==e){if(r!==t){let e=s.find(e=>e.props.id===t);e&&l.unshift(e)}i.layerId=r,i.index=a,i.info=null}}let c=eB(e),h=new Map;return h.set(null,c),l.forEach(e=>{let t={...c};e===o&&(t.color=n,t.index=a,t.picked=!0);let s=(t=ez({layer:e,info:t,mode:r})).layer;e===o&&"hover"===r&&(i.info=t),h.set(s.id,t),"hover"===r&&s.updateAutoHighlight(t)}),h}function ez({layer:e,info:t,mode:i}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:i,sourceLayer:r}),e=e.parent}return t}class eV{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new eL(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){"layerFilter"in e&&(this.layerFilter=e.layerFilter),"_pickable"in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:i,viewports:r},s=this.lastPickedInfo.info){let n=s&&s.layer&&s.layer.id,o=s&&s.viewport&&s.viewport.id,a=n?i.find(e=>e.id===n):null,l=o&&r.find(e=>e.id===o)||r[0],c=l&&l.unproject([e-l.x,t-l.y]);return{...s,x:e,y:t,viewport:l,coordinate:c,layer:a}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:"rgba8unorm",width:1,height:1,usage:ej.g.RENDER_ATTACHMENT|ej.g.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:"depth16unorm"}),this.device.isTextureFormatRenderable("rgba32float")){let e=this.device.createTexture({format:"rgba32float",width:1,height:1,usage:ej.g.RENDER_ATTACHMENT|ej.g.COPY_SRC}),t=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:"depth16unorm"});this.depthFBO=t}}let[t,i]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:i}),this.depthFBO?.resize({width:t,height:i})}_getPickable(e){if(!1===this._pickable)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:i,x:r,y:s,radius:n=0,depth:o=1,mode:a="query",unproject3D:l,canvasContext:c=this.device.getDefaultCanvasContext(),onViewportActive:h,effects:u}){let d,f=c.cssToDeviceRatio(),p=this._getPickable(e);if(!p||0===i.length)return{result:[],emptyInfo:eB({viewports:i,x:r,y:s,pixelRatio:f})};this._resizeBuffer(c);let g=c.cssToDevicePixels([r,s],!0),m=[g.x+Math.floor(g.width/2),g.y+Math.floor(g.height/2)],v=Math.round(n*f),{width:y,height:_}=this.pickingFBO,b=this._getPickingRect({deviceX:m[0],deviceY:m[1],deviceRadius:v,deviceWidth:y,deviceHeight:_}),w={x:r-n,y:s-n,width:2*n+1,height:2*n+1},P=[],S=new Set;for(let e=0;e<o;e++){let n,g;if(b){let e=await this._drawAndSampleAsync({layers:p,views:t,viewports:i,onViewportActive:h,deviceRect:b,cullRect:w,effects:u,pass:`picking:${a}`,canvasContext:c});n=eR({...e,deviceX:m[0],deviceY:m[1],deviceRadius:v,deviceRect:b})}else n={pickedColor:null,pickedObjectIndex:-1};let y=this._getDepthLayers(n,p,l);if(y.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:y,views:t,viewports:i,onViewportActive:h,deviceRect:{x:n.pickedX??m[0],y:n.pickedY??m[1],width:1,height:1},cullRect:w,effects:u,pass:`picking:${a}:z`,canvasContext:c},!0);e[3]&&(g=e[0])}for(let t of(n.pickedLayer&&e+1<o&&(S.add(n.pickedLayer),n.pickedLayer.disablePickingIndex(n.pickedObjectIndex)),(d=ek({pickInfo:n,lastPickedInfo:this.lastPickedInfo,mode:a,layers:p,viewports:i,x:r,y:s,z:g,pixelRatio:f})).values()))t.layer&&P.push(t);if(!n.pickedColor)break}for(let e of S)e.restorePickingColors();return{result:P,emptyInfo:d.get(null)}}_pickClosestObject({layers:e,views:t,viewports:i,x:r,y:s,radius:n=0,depth:o=1,mode:a="query",unproject3D:l,canvasContext:c=this.device.getDefaultCanvasContext(),onViewportActive:h,effects:u}){let d,f=c.cssToDeviceRatio(),p=this._getPickable(e);if(!p||0===i.length)return{result:[],emptyInfo:eB({viewports:i,x:r,y:s,pixelRatio:f})};this._resizeBuffer(c);let g=c.cssToDevicePixels([r,s],!0),m=[g.x+Math.floor(g.width/2),g.y+Math.floor(g.height/2)],v=Math.round(n*f),{width:y,height:_}=this.pickingFBO,b=this._getPickingRect({deviceX:m[0],deviceY:m[1],deviceRadius:v,deviceWidth:y,deviceHeight:_}),w={x:r-n,y:s-n,width:2*n+1,height:2*n+1},P=[],S=new Set;for(let e=0;e<o;e++){let n,g;if(b){let e=this._drawAndSample({layers:p,views:t,viewports:i,onViewportActive:h,deviceRect:b,cullRect:w,effects:u,pass:`picking:${a}`,canvasContext:c});n=eR({...e,deviceX:m[0],deviceY:m[1],deviceRadius:v,deviceRect:b})}else n={pickedColor:null,pickedObjectIndex:-1};let y=this._getDepthLayers(n,p,l);if(y.length>0){let{pickedColors:e}=this._drawAndSample({layers:y,views:t,viewports:i,onViewportActive:h,deviceRect:{x:n.pickedX??m[0],y:n.pickedY??m[1],width:1,height:1},cullRect:w,effects:u,pass:`picking:${a}:z`,canvasContext:c},!0);e[3]&&(g=e[0])}for(let t of(n.pickedLayer&&e+1<o&&(S.add(n.pickedLayer),n.pickedLayer.disablePickingIndex(n.pickedObjectIndex)),(d=ek({pickInfo:n,lastPickedInfo:this.lastPickedInfo,mode:a,layers:p,viewports:i,x:r,y:s,z:g,pixelRatio:f})).values()))t.layer&&P.push(t);if(!n.pickedColor)break}for(let e of S)e.restorePickingColors();return{result:P,emptyInfo:d.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:i,x:r,y:s,width:n=1,height:o=1,mode:a="query",maxObjects:l=null,canvasContext:c=this.device.getDefaultCanvasContext(),onViewportActive:h,effects:u}){let d=this._getPickable(e);if(!d||0===i.length)return[];this._resizeBuffer(c);let f=c.cssToDeviceRatio(),p=c.cssToDevicePixels([r,s],!0),g=p.x,m=p.y+p.height,v=c.cssToDevicePixels([r+n,s+o],!0),y=v.x+v.width,_=v.y,b=await this._drawAndSampleAsync({layers:d,views:t,viewports:i,onViewportActive:h,deviceRect:{x:g,y:_,width:y-g,height:m-_},cullRect:{x:r,y:s,width:n,height:o},effects:u,pass:`picking:${a}`,canvasContext:c}),w=eD(b),P=new Map,S=[],E=Number.isFinite(l);for(let e=0;e<w.length&&(!E||!(S.length>=l));e++){let t=w[e],i={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:s,pixelRatio:f},n=(i=ez({layer:t.pickedLayer,info:i,mode:a})).layer.id;P.has(n)||P.set(n,new Set);let o=P.get(n),l=i.object??i.index;o.has(l)||(o.add(l),S.push(i))}return S}_pickVisibleObjects({layers:e,views:t,viewports:i,x:r,y:s,width:n=1,height:o=1,mode:a="query",maxObjects:l=null,canvasContext:c=this.device.getDefaultCanvasContext(),onViewportActive:h,effects:u}){let d=this._getPickable(e);if(!d||0===i.length)return[];this._resizeBuffer(c);let f=c.cssToDeviceRatio(),p=c.cssToDevicePixels([r,s],!0),g=p.x,m=p.y+p.height,v=c.cssToDevicePixels([r+n,s+o],!0),y=v.x+v.width,_=v.y,b=this._drawAndSample({layers:d,views:t,viewports:i,onViewportActive:h,deviceRect:{x:g,y:_,width:y-g,height:m-_},cullRect:{x:r,y:s,width:n,height:o},effects:u,pass:`picking:${a}`,canvasContext:c}),w=eD(b),P=new Map,S=[],E=Number.isFinite(l);for(let e=0;e<w.length&&(!E||!(S.length>=l));e++){let t=w[e],i={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:s,pixelRatio:f},n=(i=ez({layer:t.pickedLayer,info:i,mode:a})).layer.id;P.has(n)||P.set(n,new Set);let o=P.get(n),l=i.object??i.index;o.has(l)||(o.add(l),S.push(i))}return S}async _drawAndSampleAsync({layers:e,views:t,viewports:i,onViewportActive:r,deviceRect:s,cullRect:n,effects:o,pass:a,canvasContext:l},c=!1){let h=c?this.depthFBO:this.pickingFBO,u={layers:e,layerFilter:this.layerFilter,views:t,viewports:i,onViewportActive:r,pickingFBO:h,deviceRect:s,cullRect:n,effects:o,pass:a,canvasContext:l,pickZ:c,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(u.preRenderStats[e.id]=e.preRender(u));let{decodePickingColor:d,stats:f}=this.pickLayersPass.render(u);this._updateStats(f);let{x:p,y:g,width:m,height:v}=s,_=h.colorAttachments[0]?.texture;if(!_)throw Error("Picking framebuffer color attachment is missing");let b=await this._readTextureDataAsync(_,{x:p,y:g,width:m,height:v},c?Float32Array:Uint8Array);if(!c){let e=!1;for(let t=3;t<b.length;t+=4)if(0!==b[t]){e=!0;break}!e&&b.length>0&&y.A.warn("Async pick readback returned only zero alpha values",{deviceRect:s,bytes:Array.from(b.subarray(0,Math.min(b.length,16)))})()}return{pickedColors:b,decodePickingColor:d}}async _readTextureDataAsync(e,t,i){let{width:r,height:s}=t,n=e.computeMemoryLayout(t),o=this.device.createBuffer({byteLength:n.byteLength,usage:x.h.COPY_DST|x.h.MAP_READ});try{let a="webgpu"===this.device.type;e.readBuffer(a?{...t,y:e.height-t.y-s}:t,o);let l=await o.readAsync(0,n.byteLength),c=i.BYTES_PER_ELEMENT;if(n.bytesPerRow%c!=0)throw Error(`Texture readback row stride ${n.bytesPerRow} is not aligned to ${c}-byte elements.`);let h=new i(l.buffer,l.byteOffset,n.byteLength/c),u=4*r,d=n.bytesPerRow/c;if(d<u)throw Error(`Texture readback row stride ${d} is smaller than packed row length ${u}.`);let f=new i(r*s*4);for(let e=0;e<s;e++){let t=(a?s-1-e:e)*d;f.set(h.subarray(t,t+u),e*u)}return f}finally{o.destroy()}}_drawAndSample({layers:e,views:t,viewports:i,onViewportActive:r,deviceRect:s,cullRect:n,effects:o,pass:a,canvasContext:l},c=!1){let h=c?this.depthFBO:this.pickingFBO,u={layers:e,layerFilter:this.layerFilter,views:t,viewports:i,onViewportActive:r,pickingFBO:h,deviceRect:s,cullRect:n,effects:o,pass:a,canvasContext:l,pickZ:c,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(u.preRenderStats[e.id]=e.preRender(u));let{decodePickingColor:d,stats:f}=this.pickLayersPass.render(u);this._updateStats(f);let{x:p,y:g,width:m,height:v}=s,y=new(c?Float32Array:Uint8Array)(m*v*4);return this.device.readPixelsToArrayWebGL(h,{sourceX:p,sourceY:g,sourceWidth:m,sourceHeight:v,target:y}),{pickedColors:y,decodePickingColor:d}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:i}of e)t+=i;this.stats.get("Layers picked").addCount(t)}_getDepthLayers(e,t,i){if(!i||!this.depthFBO)return[];let{pickedLayer:r}=e,s=r?.state?.terrainDrawMode==="drape";return r&&!s?[r]:t.filter(e=>e.props.operation.includes("terrain"))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:i,deviceWidth:r,deviceHeight:s}){let n=Math.max(0,e-i),o=Math.max(0,t-i),a=Math.min(r,e+i+1)-n,l=Math.min(s,t+i+1)-o;return a<=0||l<=0?null:{x:n,y:o,width:a,height:l}}}var eU=i(62510);let eF={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},eN="root";class eG{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add("deck-widget-container"),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!(0,T.b)(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);for(let e in this.defaultWidgets.length=0,this.resolvedWidgets.length=0,this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let i=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getWidgets()){let{viewId:s}=r;if(s){let e=i[s];e&&(r.onViewportChange&&r.onViewportChange(e),r.onRedraw?.({viewports:[e],layers:t}))}else{if(r.onViewportChange)for(let t of e)r.onViewportChange(t);r.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=i,this._updateContainers()}onHover(e,t){for(let i of this.getWidgets()){let{viewId:r}=i;r&&r!==e.viewport?.id||i.onHover?.(e,t)}}getCanvasBounds(e){let t=this.deck?.getCanvas?.(),i=t?.getBoundingClientRect(),r=this.parentElement?.getBoundingClientRect(),s=this.deck?.getCanvasContext?.(e?.id);if(s&&r){s.updatePosition();let[e,t]=s.getPosition(),[i,n]=s.getCSSSize();return{x:e-r.left,y:t-r.top,width:i,height:n}}return{x:i&&r?i.left-r.left:0,y:i&&r?i.top-r.top:0,width:i?.width||this.deck?.width||0,height:i?.height||this.deck?.height||0}}onEvent(e,t){let i=eU.tg[t.type];if(i)for(let r of this.getWidgets()){let{viewId:s}=r;s&&s!==e.viewport?.id||r[i]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;for(let e of(this.resolvedWidgets.length=0,this.defaultWidgets))t[e.id]=null,this.resolvedWidgets.push(e);for(let i of e){let e=t[i.id];e?e.viewId!==i.viewId||e.placement!==i.placement?(this._removeWidget(e),this._addWidget(i)):i!==e&&(e.setProps(i.props),i=e):this._addWidget(i),t[i.id]=null,this.resolvedWidgets.push(i)}for(let e in t){let i=t[e];i&&this._removeWidget(i)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:i="top-left"}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,i).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&"string"!=typeof e)return e;let i=e||eN,r=this.containers[i];r||((r=document.createElement("div")).style.pointerEvents="none",r.style.position="absolute",r.style.overflow="hidden",this.parentElement?.append(r),this.containers[i]=r);let s=r.querySelector(`.${t}`);return s||((s=globalThis.document.createElement("div")).className=t,s.style.position="absolute",s.style.zIndex="2",Object.assign(s.style,eF[t]),r.append(s)),s}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,i=e===eN||t,r=this.containers[e];if(i){let e=this._getContainerBounds(t);r.style.display="block",r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display="none"}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}}function e$(e,t){t&&Object.entries(t).map(([t,i])=>{t.startsWith("--")?e.style.setProperty(t,i):e.style[t]=i})}class eW{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,i=this.rootElement;if(i&&t.className!==e.className&&(t.className&&i.classList.remove(t.className),e.className&&i.classList.add(e.className)),i&&!(0,T.b)(t.style,e.style,1)){var r;(r=t.style)&&Object.keys(r).map(e=>{e.startsWith("--")?i.style.removeProperty(e):i.style[e]=""}),e$(i,e.style)}Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=["deck-widget",this.className,this.props.className],t=document.createElement("div");return e.filter(e=>"string"==typeof e&&e.length>0).forEach(e=>t.classList.add(e)),e$(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}}eW.defaultProps={id:"widget",style:{},_container:null,className:""};let eY={zIndex:"1",position:"absolute",pointerEvents:"none",color:"#a0a7b4",backgroundColor:"#29323c",padding:"10px",top:"0",left:"0",display:"none"};class eH extends eW{constructor(e={}){super(e),this.id="default-tooltip",this.placement="fill",this.className="deck-tooltip",this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement("div");return e.className=this.className,Object.assign(e.style,eY),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,i=t&&t.props.getTooltip;if(!i)return;let r=i(e),s=this.widgetManager?.getCanvasBounds(e.viewport),n=e.x+(s?.x||0),o=e.y+(s?.y||0);this.setTooltip(r,n,o)}setTooltip(e,t,i){let r=this.rootElement;if(r){if("string"==typeof e)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display="none";return}this.isVisible=!0,r.style.display="block",r.style.transform=`translate(${t}px, ${i}px)`,e&&"object"==typeof e&&"style"in e&&Object.assign(r.style,e.style)}}}eH.defaultProps={...eW.defaultProps};class eq{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),i={},r=[],s=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);s.set(t,(s.get(t)||0)+1)}for(let{id:n,canvas:o}of t){let t=this._getEventRoot(o),a=1===s.get(t)?t:o,l=this.targets[n];if(!l||l.device!==e.device||l.canvas!==o||l.eventRoot!==a){l?.eventManager.destroy(),l?.presentationContext.destroy();let t=e.device.createPresentationContext({id:n,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});l={id:n,device:e.device,canvas:o,eventRoot:a,presentationContext:t,eventManager:this._createEventManager(a)}}this._eventRootToCanvasId.set(a,n),this._eventRootToCanvasId.set(o,n),i[n]=l,r.push(n)}for(let[e,t]of Object.entries(this.targets))i[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=i,this.order=r;let n=Object.fromEntries(Object.entries(i).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(n)||(this.eventManagers=n)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||O]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,i)=>{let r,s;return"string"==typeof e?(r=document.getElementById(e),(0,U.A)(r,`Canvas with id ${e} not found`),s=e):s=(r=e).id||`deckgl-canvas-${i}`,(0,U.A)(!t.has(s),`Duplicate canvas id ${s}`),t.add(s),{id:s,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),i=Object.keys(this.eventManagers);return t.length===i.length&&t.every(t=>e[t]===this.eventManagers[t])}}var eJ=i(44379),eZ=i(5223),eK=i(67052);let eX={dataType:null,batchType:null,id:"JSON",name:"JSON",module:"",version:"",options:{},extensions:["json","geojson"],mimeTypes:["application/json","application/geo+json"],testText:function(e){let t=e[0],i=e[e.length-1];return"{"===t&&"}"===i||"["===t&&"]"===i},parseTextSync:JSON.parse},eQ=function(){let e="10.0.0-alpha.1",t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(y.A.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:y.A,_registerLoggers:_.k},(0,eZ.mk)([eX,[eK.$,{imagebitmap:{premultiplyAlpha:"none"}}]])),e}();var e0=i(29159),e1=i(59565),e2=i(63744);let e3=0,e4={requestAnimationFrame:e=>{let t;return(t="u">typeof window?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null)?t.call(window,e):setTimeout(()=>e("u">typeof performance?performance.now():Date.now()),1e3/60)},cancelAnimationFrame:e=>{let t;(t="u">typeof window?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null)?t.call(window,e):clearTimeout(e)}};class e6{static defaultAnimationLoopProps={device:null,mobileQuality:void 0,onAddHTML:()=>"",onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:e4};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw="initialized";_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(e){if(this.props={...e6.defaultAnimationLoopProps,...e},!(e=this.props).device)throw Error("No device provided");this.stats=e.stats||new e2.A({id:`animation-loop-${e3++}`}),this.sharedStats=e0.a.stats.get("Animation Loop"),this.frameRate=this.stats.get("Frame Rate"),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get("CPU Time"),this.gpuTime=this.stats.get("GPU Time"),this.setProps({autoResizeViewport:e.autoResizeViewport,animationFrameProvider:e.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this._stopEventHandling(),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(e){this._error=e,this.props.onError(e),this.props.onError===e6.defaultAnimationLoopProps.onError&&"u">typeof window&&"u">typeof ErrorEvent&&window.dispatchEvent(new ErrorEvent("error",{error:e,message:e.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if("autoResizeViewport"in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),"animationFrameProvider"in e){let t=e.animationFrameProvider||e4;if(t!==this.props.animationFrameProvider){let e=null!==this._animationFrameId;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{let e;if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}if(!this._running)return null;return!1!==e&&(this._cancelAnimationFrame(),this._requestAnimationFrame()),this}catch(t){let e=t instanceof Error?t:Error("Unknown error");throw this.props.onError(e),e}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error||(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&(this._resolveNextFrame(this),this._nextFramePromise=null,this._resolveNextFrame=null),this._endFrameTimers()),this}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw("waitForRender"),this._nextFramePromise||(this._nextFramePromise=new Promise(e=>{this._resolveNextFrame=e})),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw("toDataURL"),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error("OffscreenCanvas")}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){null!==this._animationFrameId&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(t){let e=t instanceof Error?t:Error(String(t));this.reportError(e),this.stop()}}_renderFrame(e){if(this.display)return void this.display._renderFrame(e);let t=this.props.onRender(this._getAnimationProps());this.device&&!1!==t&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error("loop");let t=e?.canvas,i=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:i,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null,mobileQuality:this.props.mobileQuality}}_getAnimationProps(){if(!this.animationProps)throw Error("animationProps");return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:i}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw("drawing buffer resized"),i!==this.animationProps.aspect&&this.setNeedsRedraw("drawing buffer aspect changed"),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=i,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error("No device provided");this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement("div");document.body.appendChild(e),e.style.position="relative";let t=document.createElement("div");t.style.position="absolute",t.style.left="10px",t.style.bottom="10px",t.style.width="300px",t.style.background="white",this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let i=this.props.onAddHTML(t);i&&(t.innerHTML=i)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??("u">typeof performance?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;void 0!==e&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener("mousemove",this._onMousemove),this.canvas.addEventListener("mouseleave",this._onMouseleave))}_stopEventHandling(){this.canvas?.removeEventListener("mousemove",this._onMousemove),this.canvas?.removeEventListener("mouseleave",this._onMouseleave)}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}}var e5=i(92767);function e8(){}function e9(e){return e.deviceProps?.debug??e.debug}let e7={id:"",width:"100%",height:"100%",style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:"auto",layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:"none",eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:e8,onWebGLInitialized:e8,onResize:e8,onViewStateChange:e8,onInteractionStateChange:e8,onBeforeRender:e8,onAfterRender:e8,onLoad:e8,onError:e=>y.A.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:({isDragging:e})=>e?"grabbing":"grab",getTooltip:null,debug:!1,drawPickingColors:!1};class te{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new w.A({id:"deck.gl"}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw="Initial render",this._canvasManager=new eq({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._pickRequest={mode:"hover",x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,i=this._getCanvasIdFromEvent(e);if("pointerleave"===e.type)t.x=-1,t.y=-1,t.radius=0,t.canvasId=i;else{if(e.leftButton||e.rightButton)return;let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=i}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=eU.tg[e.type],i=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!i||!this.layerManager)return;let s=this.layerManager.getLayers(),n=this._getInternalPickingMode();if(n){if("sync"===n){let t="click"===e.type&&this._shouldUnproject3D(s)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(i.x,i.y,{unproject3D:!0,canvasId:r},s))):this._getLastPointerDownPickingInfo(i.x,i.y,r,s);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(i.x,i.y,r,s))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,i=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let s=this.layerManager?.getLayers()||[],n=++this._pointerDownPickSequence;if("sync"===r){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:i,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:i},s)).then(e=>this._getFirstPickedInfo(e)).then(e=>(n===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,i,s):{};return n===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...e7,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&y.A.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let i=this.device;!i&&e.gl&&(e.gl instanceof WebGLRenderingContext&&y.A.error("WebGL1 context not supported.")(),i=e1.l.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps,debug:e9(e)})),i||(i=this._createDevice(e)),this.animationLoop=this._createAnimationLoop(i,e),this.setProps(t),e._typedArrayManagerProps&&eJ.A.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get("setProps Time").timeStart(),"onLayerHover"in e&&y.A.removed("onLayerHover","onHover")(),"onLayerClick"in e&&y.A.removed("onLayerClick","onClick")(),e.initialViewState&&!(0,T.b)(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),(0,U.A)(!("_canvases"in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),this._isMultiCanvasMode()||this.canvas===t.canvas||(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),y.A.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),void 0!==e.useDevicePixels&&this._canvasContext?.setProps)for(let t of(this._canvasContext.setProps({useDevicePixels:e.useDevicePixels}),Object.values(this._canvasManager.targets)))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels});this.layerManager&&(this.viewManager.setProps(t),this.layerManager.setViewports(this.getViewports(),this.viewManager.views),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get("setProps Time").timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return"Deck._animate";let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let i=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),s=this.effectManager.needsRedraw(e),n=this.deckRenderer.needsRedraw(e);return t||i||r||s||n}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});(t=e||t)&&(this.stats.get("Redraw Count").incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return null!==this.viewManager}getViews(){return(0,U.A)(this.viewManager),this.viewManager.views}getView(e){return(0,U.A)(this.viewManager),this.viewManager.getView(e)}getViewports(e){return(0,U.A)(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||O;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync("pickObjectAsync","pickObject Time",e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync("pickObjectsAsync","pickObjects Time",e)}pickObject(e){let t=this._pick("pickObject","pickObject Time",e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick("pickObject","pickMultipleObjects Time",e).result}pickObjects(e){return this._pick("pickObjects","pickObjects Time",e)}_pickPositionForController(e,t,i){return"sync"!==this._getInternalPickingMode()?null:this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:i?this.viewManager?.getCanvasId(i):void 0})}_addResources(e,t=!1){for(let i in e)this.layerManager.resourceManager.add({resourceId:i,data:e[i],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_addDefaultShaderPlugin(e){this.layerManager.addDefaultShaderPlugin(e)}_removeDefaultShaderPlugin(e){this.layerManager?.removeDefaultShaderPlugin(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if("auto"===e)return"webgpu"===t?"async":"sync";if("sync"===e&&"webgpu"===t)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>"3d"===e.props.pickable)}_getPointPickOptions(e,t,i={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:i.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...i}}_pickPointSync(e){return this._pick("pickObject","pickObject Time",e)}_pickPointAsync(e){return this._pickAsync("pickObjectAsync","pickObject Time",e)}_getLastPointerDownPickingInfo(e,t,i,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:i})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},i){if(!this.widgetManager)return;this.cursorState.isHovering=e.length>0;let r=t,s=!1;for(let t of e)r=t,s=t.layer?.onHover(t,i)||s;s||(this.props.onHover?.(r,i),this.widgetManager.onHover(r,i))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let i=eU.tg[t.type];if(!i)return;let{layer:r}=e,s=r&&(r[i]||r.props[i]),n=this.props[i],o=!1;s&&(o=s.call(r,e,t)),o||(n?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,i){(0,U.A)(this.deckPicker);let{stats:r}=this,s=this._isMultiCanvasMode()?i.canvasId||this._getDefaultCanvasId():i.canvasId,n=this._getCanvasContext(s)||void 0;r.get("Pick Count").incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(s);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(i),views:this.viewManager.getViews(),viewports:this.getViewports({...i,canvasId:s}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...i,canvasId:s,canvasContext:n});return r.get(t).timeEnd(),o}_pick(e,t,i){(0,U.A)(this.deckPicker);let{stats:r}=this,s=this._isMultiCanvasMode()?i.canvasId||this._getDefaultCanvasId():i.canvasId,n=this._getCanvasContext(s)||void 0;r.get("Pick Count").incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(s);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(i),views:this.viewManager.getViews(),viewports:this.getViewports({...i,canvasId:s}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...i,canvasId:s,canvasContext:n});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return"string"==typeof t&&(t=document.getElementById(t),(0,U.A)(t)),t?this._ownedCanvas=null:((t=document.createElement("canvas")).id=e.id||"deckgl-overlay",e.width&&"number"==typeof e.width&&(t.width=e.width),e.height&&"number"==typeof e.height&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||O}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&((0,U.A)(!e.canvas),(0,U.A)(!e.gl),(0,U.A)(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new e5.EU(e,{touchAction:this.props.touchAction,recognizers:Object.keys(eU.We).map(e=>{let[t,i,r,s]=eU.We[e],n=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...i,...n,event:e}),recognizeWith:r,requireFailure:s}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in eU.tg)"dblclick"===e?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(".deck-events-root")||this.props.parent?.querySelector(".deck-events-root")||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,"style"in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let i=e.getDefaultCanvasContext();this._setCanvasContext(i),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let i=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=i;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:i}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=e8),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:i}=e;if(t||0===t){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(i||0===i){let t=Number.isFinite(i)?`${i}px`:i;this.canvas.style.position=e.style?.position||"absolute",this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[i,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(i,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t("number"==typeof e.width&&Number.isFinite(e.width)?e.width:1,"number"==typeof e.height&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode())return void this._updateMultiCanvasDimensions();let{canvas:t}=this,[i,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(i!==this.width||r!==this.height)&&(this.width=i,this.height=r,this.viewManager?.setProps({width:i,height:r}),this.layerManager?.setViewports(this.getViewports(),this.viewManager.views),this.props.onResize({width:i,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:i}=e.canvas;e.setDrawingBufferSize(t,i)}this._needsRedraw="Canvas resized",this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw="Canvas resized",this.viewManager?.setNeedsUpdate("Canvas resized"),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:i,onError:r}=t;return new e6({device:e,autoResizeDrawingBuffer:!i&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,i={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps,debug:e9(e)};i.adapters.includes(e1.l)||i.adapters.push(e1.l);let r={alphaMode:this.props.deviceProps?.type==="webgpu"?"premultiplied":void 0};return e0.a.createDevice({_reuseDevices:!0,type:"webgl",...i,createCanvasContext:{...r,..."object"==typeof t?t:void 0,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new H({id:"default-view"})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error("WebGL context is lost"))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,i=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},i),s=this._getInternalPickingMode(),n=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!s)return;if("sync"===s)return void this._applyHoverCallbacks(this._pickPointSync(r),t);this._pickPointAsync(r).then(({result:e,emptyInfo:i})=>{n===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:i},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),"webgl"===this.device.type&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized?.(this.device),"webgl"===this.device.type&&this.props.onWebGLInitialized(this.device.gl);let t=new n;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);(0,U.A)(e),this.eventManager=this._createEventManager(e),this.eventManagers={[O]:this.eventManager}}this.viewManager=new j({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),onViewRemoved:e=>this.layerManager?.projectionScaleResources.delete(e),onError:e=>this.props.onError?.(e),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let i=this.viewManager.getViewports()[0];this.layerManager=new M(this.device,{deck:this,stats:this.stats,viewport:i,timeline:t}),this.effectManager=new ex({deck:this,device:this.device}),this.deckRenderer=new eO(this.device,{stats:this.stats}),this.deckPicker=new eV(this.device,{stats:this.stats});let r=this.props.parent?.querySelector(".deck-widgets-root")||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new eG({deck:this,parentElement:r}),this.widgetManager.addDefault(new eH),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:i,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:i,gl:r});let s={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:"screen",effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&"screen"===s.pass&&!s.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=s.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...s,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let i=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=i.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...s,canvasContext:i.presentationContext,target:r,viewports:t}),i.presentationContext.present()}else this.deckRenderer?.renderLayers(s);"screen"===s.pass&&this.widgetManager.onRedraw({viewports:s.viewports,layers:s.layers}),this.props.onAfterRender({device:i,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),y.A.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.viewManager.updateViewports()&&this.layerManager.setViewports(this.getViewports(),this.viewManager.views),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},!this.props.viewState&&this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get("frameRate").timeEnd(),e.get("frameRate").timeStart();let t=this.animationLoop.stats;e.get("GPU Time").addTime(t.get("GPU Time").lastTiming),e.get("CPU Time").addTime(t.get("CPU Time").lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get("frameRate").getHz(),e.setPropsTime=t.get("setProps Time").time,e.updateAttributesTime=t.get("Update Attributes").time,e.framesRedrawn=t.get("Redraw Count").count,e.pickTime=t.get("pickObject Time").time+t.get("pickMultipleObjects Time").time+t.get("pickObjects Time").time,e.pickCount=t.get("Pick Count").count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get("Layers rendered").lastSampleCount,e.pickLayersCount=t.get("Layers picked").lastSampleCount,e.updateLayersCount=t.get("Layer updates").count,e.updateAttributesCount=t.get("Attributes updated").count,e.gpuTime=t.get("GPU Time").time,e.cpuTime=t.get("CPU Time").time,e.gpuTimePerFrame=t.get("GPU Time").getAverageTime(),e.cpuTimePerFrame=t.get("CPU Time").getAverageTime();let i=e0.a.stats.get("GPU Time and Memory");e.bufferMemory=i.get("Buffer Memory").count,e.textureMemory=i.get("Texture Memory").count,e.renderbufferMemory=i.get("Renderbuffer Memory").count,e.gpuMemory=i.get("GPU Memory").count}}te.defaultProps=e7,te.VERSION=eQ;let tt=te},84960(e,t,i){i.d(t,{A:()=>ty});var r={};i.r(r),i.d(r,{arithmetic:()=>I,castData:()=>R.K,convertColors:()=>D.K,dot:()=>U,equalAll:()=>F,extent:()=>B,fround:()=>k,gather:()=>z,interleave:()=>V,length:()=>N,segmentedMap:()=>G,select:()=>W,sequence:()=>H,swizzle:()=>q});var s=i(8994),n=i(75130),o=i(67619),a=i(57265),l=i(13240),c=i(57285);let h=c.r.getDataType.bind(c.r);function u(e,t,i){if(t.size>4)return null;let r="webgpu"===i&&"uint8"===t.type?"unorm8":t.type,s=t.size,n=!!("webgpu"!==i&&3===s&&r&&["uint8","sint8","unorm8","snorm8","uint16","sint16","unorm16","snorm16"].includes(r));return{attribute:e,format:s>1?`${r}x${s}${n?"-webgl":""}`:t.type,byteOffset:t.offset||0}}function d(e){return e.stride||e.size*e.bytesPerElement}var f=i(44379),p=i(11579),g=i(2555);function m(e,t){t.offset&&g.A.removed("shaderAttribute.offset","vertexOffset, elementOffset")();let i=d(e),r=(void 0!==t.vertexOffset?t.vertexOffset:e.vertexOffset||0)*i+(t.elementOffset||0)*e.bytesPerElement+(e.offset||0);return{...t,offset:r,stride:i}}class v{constructor(e,t,i){let r;this._buffer=null,this.device=e,this.id=t.id||"",this.size=t.size||1;let s=t.logicalType||t.type,n="float64"===s,{defaultValue:o}=t;o=Number.isFinite(o)?[o]:o||Array(this.size).fill(0),r=n?"float32":!s&&t.isIndexed?"uint32":s||"float32";let a=function(e){switch(e){case"float64":return Float64Array;case"uint8":case"unorm8":return Uint8ClampedArray;default:return(0,l.Ak)(e)}}(s||r);this.doublePrecision=n,n&&!1===t.fp64&&(a=Float32Array),this.value=null,this.settings={...t,defaultType:a,defaultValue:o,logicalType:s,type:r,normalized:r.includes("norm"),size:this.size,bytesPerElement:a.BYTES_PER_ELEMENT},this.state={...i,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*d(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&(this._buffer.delete(),this._buffer=null),f.A.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&"webgpu"!==this.device.type?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let i={};if(this.state.constant){let r=this.value;if("webgpu"===this.device.type&&this._buffer)i[e]=this._buffer;else if(t){let s=m(this.getAccessor(),t),n=s.offset/r.BYTES_PER_ELEMENT,o=s.size||this.size;i[e]=r.subarray(n,n+o)}else i[e]=r}else i[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?i[`${e}64Low`]=i[e]:i[`${e}64Low`]=new Float32Array(this.size)),i}_getBufferLayout(e=this.id,t=null){let i=this.getAccessor(),r=[],s={name:this.id,byteStride:"webgpu"===this.device.type&&this.state.constant?0:d(i)};if(this.doublePrecision){let s,n={high:s=m(i,t||{}),low:{...s,offset:s.offset+4*i.size}};r.push(u(e,{...i,...n.high},this.device.type),u(`${e}64Low`,{...i,...n.low},this.device.type))}else if(t){let s=m(i,t);r.push(u(e,{...i,...s},this.device.type))}else r.push(u(e,i,this.device.type));return s.attributes=r.filter(Boolean),s}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:i,size:r}=this,s=i*r;if(t&&s&&t.length>=s){let i=Array(r).fill(1/0),n=Array(r).fill(-1/0);for(let e=0;e<s;)for(let s=0;s<r;s++){let r=t[e++];r<i[s]&&(i[s]=r),r>n[s]&&(n[s]=r)}e=[i,n]}}return this.state.bounds=e,e}setData(e){let t,{state:i}=this;t=ArrayBuffer.isView(e)?{value:e}:e instanceof s.h?{buffer:e}:e;let r={...this.settings,...t};if(ArrayBuffer.isView(t.value)){if(!t.type)if(this.doublePrecision&&t.value instanceof Float64Array)r.type="float32";else{let e=h(t.value);r.type=r.normalized?e.replace("int","norm"):e}r.bytesPerElement=t.value.BYTES_PER_ELEMENT,r.stride=d(r)}if(i.bounds=null,t.constant){let e=t.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!i.constant||!this._areValuesEqual(e,this.value)))return!1;i.externalBuffer=null,i.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(t.buffer)i.externalBuffer=t.buffer,i.constant=!1,this.value=t.value||null;else if(t.value){this._checkExternalBuffer(t);let e=t.value,s=e;i.externalBuffer=null,i.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(s)&&(s=(0,p.cT)(s,r),e instanceof Float32Array&&(r.stride=2*r.size*Float32Array.BYTES_PER_ELEMENT));let{buffer:n}=this,o=d(r),a=(r.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;s.constructor!==e&&(s=new e(s))}let l=s.byteLength+a+2*o;(!n||n.byteLength<l)&&(n=this._createBuffer(l)),n.write(s,a)}return this.setAccessor(r),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:i=0,endOffset:r}=e,s=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(s?(0,p.cT)(t,{size:this.size,startIndex:i,endIndex:r}):t.subarray(i,r),i*(s?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:i}=this,r=i.allocatedValue,s=f.A.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=s;let n=this._shouldSplitDoublePrecisionValue(s),o=n&&s instanceof Float32Array?{...this.settings,stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:a}=this,{buffer:l}=this,c=s.byteLength*(n&&s instanceof Float32Array?2:1);return(!l||l.byteLength<c+a)&&(l=this._createBuffer(c+a),t&&r&&l.write(this._shouldSplitDoublePrecisionValue(r)?(0,p.cT)(r,this):r,a)),i.allocatedValue=s,i.constant=!1,i.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||"webgpu"===this.device.type&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let i=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);t instanceof i||!this.settings.normalized||"normalized"in e||g.A.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case"snorm8":return new Float32Array(e).map(e=>(e+128)/255*2-1);case"snorm16":return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case"unorm8":return new Float32Array(e).map(e=>e/255);case"unorm16":return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,i){let{defaultValue:r,size:s}=this.settings;if(Number.isFinite(e))return t[i]=e,t;if(!e){let e=s;for(;--e>=0;)t[i+e]=r[e];return t}switch(s){case 4:t[i+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[i+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[i+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[i+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let n=s;for(;--n>=0;)t[i+n]=Number.isFinite(e[n])?e[n]:r[n]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:i}=this;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:i}=this.settings,r="webgpu"!==this.device.type||t?(t?s.h.INDEX:s.h.VERTEX)|s.h.COPY_DST:s.h.VERTEX|s.h.STORAGE|s.h.COPY_DST|s.h.COPY_SRC;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:r,indexType:t?i:void 0,byteLength:e}),this._buffer}}var y=i(18091),_=i(42103),b=i(7295);let w=[],P=[[0,1/0]],S={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function E(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:"interpolation",duration:e});let i=e.type||"interpolation";return{...S[i],...t,...e,type:i}}var x=i(18656),C=i(88994),A=i(57703);class L extends v{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:P}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setLayoutChanged(){this.state.layoutChanged=!0}setAccessor(e){var t,i;(t=this.state).layoutChanged||(i=this.getAccessor(),t.layoutChanged=e.type!==i.type||e.size!==i.size||d(e)!==d(i)||(e.offset||0)!==(i.offset||0)),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat("function"!=typeof e&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,i=this.settings.transition;return E(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],i)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:i=1/0}=t;this.state.updateRanges=function(e,t){if(e===P||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let i=[],r=e.length,s=0;for(let n=0;n<r;n++){let r=e[n];r[1]<t[0]?(i.push(r),s=n+1):r[0]>t[1]?i.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return i.splice(s,0,t),i}(this.state.updateRanges,[e,i])}else this.state.updateRanges=P}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=w}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:i}=this;if(i.noAlloc)return!1;if(i.update){let i=this.isConstant;return super.allocate(e,t.updateRanges!==P),t.layoutChanged||(t.layoutChanged=i&&"webgpu"===this.device.type),!0}return!1}updateBuffer({numInstances:e,data:t,props:i,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:s},settings:{update:n,noAlloc:o}}=this,a=!0;if(n){for(let[o,a]of s)n.call(r,this,{data:t,startRow:o,endRow:a,props:i,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,i]of s){let r=Number.isFinite(t)?this.getVertexOffset(t):0,s=Number.isFinite(i)?this.getVertexOffset(i):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:s})}this._checkAttributeArray()}else a=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),a}setConstantValue(e,t){if(void 0===t||"function"==typeof t)return!1;let i=this.settings.transform&&e?this.settings.transform.call(e,t):t;return this.setData({constant:!0,value:i}),!0}setData(e){var t,i;let r=this.isConstant;if(ArrayBuffer.isView(e)||e instanceof s.h||!e.constant){let i=super.setData(e);return this.state.constantValue=null,(t=this.state).layoutChanged||(t.layoutChanged=r&&"webgpu"===this.device.type),i}let n=this.settings.defaultType;this.state.constantValue=this._normalizeValue(e.value,new n(this.size),0);let o=super.setData(e);if("webgpu"===this.device.type){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=(0,p.cT)(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(i=this.state).layoutChanged||(i.layoutChanged=!r),this.constant=!1}return o&&this.setNeedsRedraw(),this.clearNeedsUpdate(),o}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e||(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:i,settings:r}=this;if(!e)return i.binaryValue=null,i.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(e instanceof x.M&&(0,y.A)(e.length>=this.numInstances,"GPUVector attribute is shorter than the draw count"),i.binaryValue===e&&!(r.transform&&this.needsUpdate()))return this.clearNeedsUpdate(),!0;if(i.binaryValue=e,this.setNeedsRedraw(),e instanceof x.M){if(!e.format)throw Error("GPUVector attributes require a format");let t=(0,C.Ft)(e.format),i=t.type;if("float16"===i)throw Error("GPUVector float16 attributes are not supported");(0,y.A)(!t.vertexList&&!t.valueList,"GPUVector attributes require fixed-width values");let r=function(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUVector "${e.name}" requires exactly one GPUData chunk`);return t}(e);(0,y.A)(r.buffer instanceof s.h,"GPUVector attributes require a concrete Buffer"),e={buffer:r.buffer,type:i,size:t.components,offset:r.byteOffset,stride:r.byteStride}}if(r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let s=e;(0,y.A)(ArrayBuffer.isView(s.value),`invalid ${r.accessor}`);let n=!!s.size&&s.size!==this.size;return i.binaryAccessor=(0,_.I)(s.value,{size:s.size||this.size,stride:s.stride,offset:s.offset,startIndices:t,nested:n}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let i in e)Object.assign(t,super.getValue(i,e[i]));return t}getGPUVector(){if(!this.isConstant&&!this.getBuffer())return{};let e=this._getShaderBufferLayout(),t=this.getValue(),i={},r=this.getConstantValue();for(let n of(this.doublePrecision&&(r instanceof Float32Array||r instanceof Float64Array)&&(r="webgpu"===this.device.type?(0,p.cT)(r,{size:this.size}):new Float32Array([...this.value,...new Float32Array(this.size)])),e.attributes||[])){let o=n.attribute,a=t[o],c=(0,C.Ft)(n.format);if(this.isConstant&&r){let e=(0,l.Y0)(c.type),t=(n.byteOffset||0)/r.BYTES_PER_ELEMENT;i[o]=new A.z({format:n.format,value:new e(r.subarray(t,t+c.components))})}else a instanceof s.h?i[o]=new x.M({type:"buffer",name:o,buffer:a,format:n.format,length:this.numInstances,byteOffset:n.byteOffset||0,byteStride:e.byteStride,ownsBuffer:!1}):a&&(i[o]=new A.z({format:n.format,value:new((0,l.Y0)(c.type))(a).subarray(0,c.components)}))}return i}getBufferLayout(e){return this.state.layoutChanged=!1,this._getShaderBufferLayout(e)}_getShaderBufferLayout(e){let t=this.settings.shaderAttributes,i=super._getBufferLayout(),{stepMode:r}=this.settings;if("dynamic"===r?i.stepMode=e?e.isInstanced?"instance":"vertex":"instance":i.stepMode=r??"vertex",!t)return i;for(let e in t){let r=super._getBufferLayout(e,t[e]);i.attributes.push(...r.attributes)}return i}_autoUpdater(e,{data:t,startRow:i,endRow:r,props:s,numInstances:n}){let{settings:o,state:a,value:l,size:c,startIndices:h}=e,{accessor:u,transform:d}=o,f=a.binaryAccessor||("function"==typeof u?u:s[u]);(0,y.A)("function"==typeof f,`accessor "${u}" is not a function`);let p=e.getVertexOffset(i),{iterable:g,objectInfo:m}=(0,_.X)(t,i,r);for(let t of g){m.index++;let i=f(t,m);if(d&&(i=d.call(this,i)),h){let t=(m.index<h.length-1?h[m.index+1]:n)-h[m.index];if(i&&Array.isArray(i[0])){let t=p;for(let r of i)e._normalizeValue(r,l,t),t+=c}else i&&i.length>c?l.set(i,p):(e._normalizeValue(i,m.target,0),(0,b.R)({target:l,source:m.target,start:p,count:t}));p+=t*c}else e._normalizeValue(i,l,p),p+=c}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||"function"==typeof e.update))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let i=!0;switch(t){case 4:i=i&&Number.isFinite(e[3]);case 3:i=i&&Number.isFinite(e[2]);case 2:i=i&&Number.isFinite(e[1]);case 1:i=i&&Number.isFinite(e[0]);break;default:i=!1}if(!i)throw Error(`Illegal attribute generated for ${this.id}`)}}}var M=i(64344),T=i(82447);function O({elementWise:e,func:t,inputs:i,output:r,outputBuffer:s}){let n=Array.isArray(i)?i:Object.values(i);for(let e of n)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,a=r.size,l=new r.ValueType(o*a);for(let i=0;i<o;i++){let r=n.map(e=>j(e,i));if(e)for(let e=0;e<a;e++)l[i*a+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,l.subarray(i*a,i*a+a),...r)}let c=r.ValueType.BYTES_PER_ELEMENT,h=r.offset/c,u=r.stride/c,d=l;if(0!==h||u!==a){d=new r.ValueType(h+r.byteLength/c);for(let e=0;e<o;e++){let t=e*a,i=h+e*u,r=l.subarray(t,t+a);d.set(r,i),s.write(r,i*c)}}else s.write(l);return{success:!0,value:d}}function j(e,t){let i=e.value,r=e.size,s=e.offset/e.ValueType.BYTES_PER_ELEMENT,n=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=s+(e.isConstant?0:t)*n,a=i.slice(o,o+r);if(!e.normalized)return a;let l=new Float32Array(r);for(let t=0;t<r;t++)l[t]=function(e,t){switch(t){case"uint8":return e/255;case"uint16":return e/65535;case"uint32":return e/0xffffffff;case"sint8":return Math.max(e/127,-1);case"sint16":return Math.max(e/32767,-1);case"sint32":return Math.max(e/0x7fffffff,-1);case"float32":return e;default:throw Error(`Unsupported normalized source type ${t}`)}}(a[t],e.type);return l}let I=({inputs:e,output:t,target:i})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let i=0;i<t.length;i++){let s=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,j(t,i)]));for(let n=0;n<t.size;n++)r[i*t.size+n]=function e(t,i,r){switch(t.kind){case"input":{let e=i[t.name];if(r<e.length)return e[r];return 1===e.length?e[0]:0}case"literal":if(Array.isArray(t.value))return t.value[r]??0;return t.value;case"call":{!function(e,t){let i=T.E[e].arity;if(t!==i)throw Error(`Arithmetic op '${e}' expects ${i} args, got ${t}`)}(t.op,t.args.length);let s=t.args.map(t=>e(t,i,r));switch(t.op){case"add":return s[0]+s[1];case"subtract":return s[0]-s[1];case"multiply":return s[0]*s[1];case"divide":return s[0]/s[1];case"pow":return Math.pow(s[0],s[1]);case"sqrt":return Math.sqrt(s[0]);case"abs":return Math.abs(s[0]);case"sin":return Math.sin(s[0]);case"cos":return Math.cos(s[0]);case"tan":return Math.tan(s[0]);case"exp":return Math.exp(s[0]);case"log":return Math.log(s[0]);default:{let e=t.op;throw Error(`Unsupported arithmetic op ${e}`)}}}default:throw Error(`Unsupported expression node ${t.kind}`)}}(e.expression,s,n)}return i.write(r),{success:!0,value:r}};var R=i(45821),D=i(64610);let B=({inputs:e,output:t,target:i})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let s=new t.ValueType(t.length*t.size);if(0===r.length)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let i=j(r,0)[e],n=e*t.size,o=n+1;s[n]=i,s[o]=i;for(let t=1;t<r.length;t++){let i=j(r,t)[e];i<s[n]&&(s[n]=i),i>s[o]&&(s[o]=i)}}return i.write(s),{success:!0,value:s}},k=({inputs:e,output:t,target:i})=>O({func:(e,t)=>{let i=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<i;t++){let s=r[t];e[t]=Math.fround(s),e[t+i]=s-e[t]}return e},inputs:e,output:t,outputBuffer:i}),z=async({inputs:e,output:t,target:i})=>{let{ids:r,sourceValues:s}=e,n=r.value,o=s.value;if(!n)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${s} does not have CPU value`);let a=new t.ValueType(t.length*t.size),l=Array(t.size).fill(0);for(let e=0;e<t.length;e++){var c,h;let i=Number(j(r,e)[0]),n=(c=i,h=s.length,Number.isInteger(c)&&c>=0&&c<h)?j(s,i):l;a.set(n,e*t.size)}return i.write(a),{success:!0,value:a}},V=({inputs:e,output:t,target:i})=>O({func:(e,...t)=>{let i=0;for(let r of t)e.set(r,i),i+=r.length},inputs:e,output:t,outputBuffer:i}),U=({inputs:e,output:t,target:i})=>{let{x:r,y:s}=e,n=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=j(r,e),i=j(s,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*i[e];n[e]=o}return i.write(n),{success:!0,value:n}},F=({inputs:e,output:t,target:i})=>{let{x:r,y:s}=e,n=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=j(r,e),i=j(s,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==i[e]){o=0;break}n[e]=o}return i.write(n),{success:!0,value:n}},N=({inputs:e,output:t,target:i})=>{let{x:r}=e,s=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=j(r,e),i=0;for(let e=0;e<r.size;e++)i+=t[e]*t[e];s[e]=Math.sqrt(i)}return i.write(s),{success:!0,value:s}},G=async({inputs:e,output:t,target:i})=>{let{segments:r,vertexCount:s}=e,n=r.value;if(!n)throw Error(`${r} does not have CPU value`);var o=n,a=r,l=s;if(a.length<1)throw Error("segmentedMap segments must contain at least one segment start");let c=0;for(let e=0;e<a.length;e++){let t=o[$(a,e)];if(0===e&&0!==t)throw Error(`segmentedMap segments must start at 0, got ${t}`);if(e>0&&t<c)throw Error(`segmentedMap segments must be non-decreasing, got ${t} after ${c}`);c=t}if(c>l)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${c} > ${l}`);let h=new t.ValueType(t.length*t.size),u=0;for(let e=0;e<s;e++){for(;u+1<r.length&&n[$(r,u+1)]<=e;)u++;let i=n[$(r,u)],s=e*t.size;h[s]=u,h[s+1]=e-i}return i.write(h),{success:!0,value:h}};function $(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}let W=async({inputs:e,output:t,target:i})=>{let{condition:r,whenTrue:s,whenFalse:n}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let i=j(r,e),a=j(s,e),l=j(n,e);for(let c=0;c<t.size;c++){let h=Y(i,r.size,c);o[e*t.size+c]=0!==h?Y(a,s.size,c):Y(l,n.size,c)}}return i.write(o),{success:!0,value:o}};function Y(e,t,i){return i<t?e[i]:1===t?e[0]:0}let H=({inputs:e,output:t,target:i})=>{let r=new t.ValueType(t.length);for(let i=0;i<t.length;i++)r[i]=e.start+i*e.step;return i.write(r),{success:!0,value:r}},q=({inputs:e,output:t,target:i})=>{let{columns:r}=e;return O({func:(e,t)=>{for(let i=0;i<r.length;i++)e[i]=t[r[i]]},inputs:{x:e.x},output:t,outputBuffer:i})},J=new class{_modules={cpu:r};add(e,t){let i=this._modules[e];if("function"==typeof t.then){let r=Promise.all([Promise.resolve(i||{}),t]).then(([e,t])=>({...e,...t}));return this._modules[e]=r,r.then(t=>{this._modules[e]=t}).catch(t=>{M.R.error(`Failed to register ${e} backend: ${t}`)()}),r}if(i&&"function"==typeof i.then){let r=Promise.resolve(i).then(e=>({...e,...t})).then(t=>(this._modules[e]=t,t)).catch(t=>{throw M.R.error(`Failed to register ${e} backend: ${t}`)(),t});return this._modules[e]=r,r}let r={...i||{},...t};return this._modules[e]=r,Promise.resolve(r)}async get(e,t){let r=this._modules[e];if(!r)if("webgl"===e)r=this.add("webgl",i.e("4808").then(i.bind(i,33227)));else if("webgpu"===e)r=this.add("webgpu",i.e("325").then(i.bind(i,32820)));else throw Error(`${e} backend not registered`);let s=(await r)[t];if("function"!=typeof s&&("webgl"===e?s=(await i.e("4808").then(i.bind(i,33227)))[t]:"webgpu"===e&&(s=(await i.e("325").then(i.bind(i,32820)))[t])),"function"!=typeof s)throw Error(`${e} backend does not implement ${t}`);return s}getSync(e,t){let i=this._modules[e];if(!i)throw Error(`${e} backend not registered`);if("function"==typeof i.then)throw Error(`${e} backend is not loaded yet`);let r=i[t];if("function"!=typeof r)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}};var Z=i(52128);class K{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof Z.GL)}async execute(e,t,i){i||await this._resolveDependencies(e);let r=await J.get(this._getHandlerRegistry(e,i),this.name);if(i&&("webgpu"!==e.type||!r.supportsEvaluationScope))throw Error(`${this.name} does not support deferred-submission evaluation`);return i&&await this._resolveDependencies(e,i),await this._executeWithHandler(r,t,i)}executeSync(e,t){var i;this._resolveDependenciesSync(e);let r=this._executeWithHandler(J.getSync(this._getHandlerRegistry(e),this.name),t);if(i=r,"function"==typeof i?.then)throw Error(`${this.name} returned a Promise in executeSync()`);return r}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e,t){return!t&&this.shouldExecuteOnCPU()?"cpu":e.type}async _resolveDependencies(e,t){for(let i of this.dependencies)await i.evaluate(e,{scope:t});if("cpu"===this._getHandlerRegistry(e,t)||"null"===e.type)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if("cpu"===this._getHandlerRegistry(e)||"null"===e.type)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t,i){return e({scope:i,device:t.device,inputs:this.inputs,output:this.output,target:t})}}class X extends K{name="interleave";output;constructor(e){super(e);let{isConstant:t,type:i,length:r}=function(...e){let t=function(e){let t=0,i=0;for(let r of e){if("f"===r[0])return"float32";let e=r.endsWith("8")?8:r.endsWith("6")?16:32;"u"===r[0]?t=Math.max(t,e):i=Math.max(i,e)}return t&&!i?`uint${t}`:i&&t<32?`sint${Math.max(i,2*t)}`:"float32"}(e.map(e=>e.type));return"f"!==t[0]&&e.some(e=>e.normalized)&&(t="float32"),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}(...e);this.output=new Z.GL({isConstant:t,type:i,size:e.reduce((e,t)=>e+t.size,0),length:r,source:this})}toString(){return`_${this.inputs.join("_")}_`}}var Q=i(7036),ee=i(35018);class et{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;_evaluationScope;static fromGPUVector(e){if(e.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${e.name}"`);if(0===e.data.length)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${e.name}"`);return new et({id:e.name,gpuDataEvaluators:e.data.map(t=>Z.GL.fromGPUData(t,{id:e.name})),gpuVector:e,format:e.format})}static fromGPUDataEvaluators(e,t={}){return new et({id:t.id,gpuDataEvaluators:e,format:t.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:i,format:r}){if(0===t.length)throw Error("GPUVectorEvaluator requires at least one GPUData evaluator");(function(e){let t=e[0];for(let i of e.slice(1))if(i.type!==t.type||i.size!==t.size||i.normalized!==t.normalized||i.format!==t.format)throw Error("GPUVectorEvaluator requires matching GPUData evaluator layouts")})(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=i,this._ownsGPUDataEvaluators=!i}get evaluated(){return!!this._gpuVector}getInspection(){return(0,ee.r)(this.gpuDataEvaluators)}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(e){return et.fromGPUDataEvaluators(this.gpuDataEvaluators.map((t,i)=>e(t,i)),{id:this.id})}async evaluate(e,t={}){let i;if(this.assertScopeAccess(t.scope),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);let r=t.scope;if(r){if(r.assertEvaluating(e),!this._evaluationScope){let e=this._gpuVector;this._evaluationScope=r,r.retain(t=>{this._evaluationScope=void 0,t||(this._gpuVector=e)})}for(let r of(i=[],this.gpuDataEvaluators))i.push(await r.evaluate(e,t));if(this._gpuVector)return this._gpuVector}else{if(this._gpuVector)return this._gpuVector;i=await Promise.all(this.gpuDataEvaluators.map(i=>i.evaluate(e,t)))}let s=i[0],n=i.map(ei),o=t.format??this.format??s.format;return this._gpuVector=new x.M({type:"data",name:t.name??this.id??"vector",format:o,data:n,stride:s.stride,byteStride:s.byteStride,rowByteLength:s.rowByteLength,bufferLayout:s.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(t.scope)throw Error("Use scope.evaluate() for deferred submission");if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let i=this.gpuDataEvaluators.map(i=>i.evaluateSync(e,t)),r=i[0],s=i.map(ei),n=t.format??this.format??r.format;return this._gpuVector=new x.M({type:"data",name:t.name??this.id??"vector",format:n,data:s,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error("Cannot invalidate a destroyed evaluator");this._gpuVector=void 0}destroy(){if(this.assertScopeAccess(),this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error("Evaluator is retained by an unsubmitted scope")}toString(){return this.id??this.constructor.name}}function ei(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}function er(e){return e instanceof Z.GL?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof Q.kL?e.buffer.buffer:e.buffer)}var es=i(52466);class en{constructor(e,{id:t,isTransitionAttribute:i}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=i,"webgpu"===this.device.type&&J.add("webgpu",{interleave:es.C})}hasGroups(e){return"webgpu"===this.device.type&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let i=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,i,t)}getBindings(e,t,i,r){let s=this._getPackedGroups(e,i,{requireValues:!0,excludeAttributes:r}),n={},o=new Set;for(let e of s.values()){let i=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);for(let t of(n[e.id]=this._getPackedBuffer(e,i),e.attributes))o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,s,i).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:n,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:i,excludeAttributes:r}){let s=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let i=s.get(e)||[];i.push(t),s.set(e,i)}let n=new Map;for(let[e,o]of s){let s=this._getPackedGroup(e,o,t,i,r);s&&n.set(e,s)}return n}_getPackedGroup(e,t,i,r,s){if(t.length<2)return null;let n=t.map(e=>e.getBufferLayout(i)),o=n[0].stepMode,a=Math.max(1,t[0].numInstances),l=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let i=t[e],l=i.getAccessor(),c=l.size*l.bytesPerElement;if(s[i.id]||i.settings.isIndexed||i.settings.noAlloc||i.doublePrecision||this.isTransitionAttribute(i.id)||n[e].stepMode!==o||i.numInstances!==t[0].numInstances||0!==(l.offset||0)||0!==(l.vertexOffset||0)||d(l)!==c||r&&(i.isConstant?!i.getConstantValue()||i.getConstantValue().byteLength<c:!ArrayBuffer.isView(i.value)||i.value.byteLength<a*c))return null}let c={},h=[],u=0;for(let e=0;e<t.length;e++){let i=t[e];for(let t of(u=eo(u),c[i.id]=u,n[e].attributes||[]))h.push({...t,byteOffset:u+(t.byteOffset||0)});u+=d(i.getAccessor())}return{id:e,attributes:t,byteStride:u=eo(u),byteOffsets:c,rowCount:a,layout:{name:e,byteStride:l?0:u,stepMode:o,attributes:h}}}_getBufferLayouts(e,t,i){let r=[],s=new Set,n=new Set;for(let e of t.values())for(let t of e.attributes)n.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,a=e&&t.get(e);a&&n.has(o.id)?s.has(a.id)||(r.push(a.layout),s.add(a.id)):r.push(o.getBufferLayout(i))}return r}_getPackedBuffer(e,t){let i=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if(r&&r.layoutKey===i||(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:i},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=function(...e){if(0===e.length)throw Error("interleave() requires at least one input");return 1===e.length?(0,Z.uy)(e[0]):new X(e.map(Z.uy)).output}(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return!function(e,t){let i,r=(function e(t,i,r){var s;if((s=t)instanceof Z.GL||s instanceof et)return void i.add(t);if(!(!t||"object"!=typeof t||r.has(t))){let s;if(r.add(t),Array.isArray(t)){for(let s of t)e(s,i,r);return}if((s=Object.getPrototypeOf(t))===Object.prototype||null===s)for(let s of Object.values(t))e(s,i,r)}}(t,i=new Set,new Set),Array.from(i));for(let t of r)t.evaluateSync(e);var s=r;let n=new Set(s.flatMap(er)),o=new Set;for(let e of s)!function e(t,i){if(t instanceof et){for(let r of t.gpuDataEvaluators)e(r,i);return}let r=t.source;if(r){if(r instanceof Z.GL){i.has(r)||(i.add(r),e(r,i));return}for(let t of r.dependencies)i.has(t)||(i.add(t),e(t,i))}}(e,o);for(let e of o)e.evaluated&&!n.has(e.buffer)&&e.destroy()}(this.device,t),t}_getInterleaveInput(e,t){let i=d(t.getAccessor()),r=e.byteOffsets[t.id];if(ea(`${e.id}.${t.id} rowByteLength`,i),ea(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return ea(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new Z.GL({id:t.id,type:"uint32",size:i/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,i/Uint32Array.BYTES_PER_ELEMENT)})}let s=t.getBuffer(),n=t.byteOffset,o=t.getAccessor().stride||i;if(ea(`${e.id}.${t.id} byteOffset`,n),ea(`${e.id}.${t.id} stride`,o),!s)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new Z.GL({id:t.id,type:"uint32",size:i/4,offset:n,stride:o,length:e.rowCount,buffer:s})}}function eo(e){return 4*Math.ceil(e/4)}function ea(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}var el=i(62585),ec=i(24059),eh=i(58006),eu=i(63702),ed=i(55077),ef=i(9587);class ep{device;model;transformFeedback;outputVectorBindings={};outputBuffers={};static defaultProps={...ed.X.defaultProps,inputVectors:void 0,outputVectors:void 0,feedbackBufferMode:"separate",outputs:void 0,feedbackBuffers:void 0};static isSupported(e){return e?.info?.type==="webgl"}constructor(e,t=ep.defaultProps){if(!ep.isSupported(e))throw Error("BufferTransform not yet implemented on WebGPU");this.device=e,this.outputBuffers=t.feedbackBuffers||{};let{inputVectors:i,outputVectors:r,...s}=t;this.model=new ed.X(this.device,{id:t.id||"buffer-transform-model",fs:t.fs||(0,eu.Wk)(),topology:t.topology||"point-list",varyings:t.outputs||t.varyings,...s,bufferMode:t.bufferMode||("interleaved"===t.feedbackBufferMode?35980:35981)}),this.transformFeedback=this.device.createTransformFeedback({layout:this.model.pipeline.shaderLayout,buffers:t.feedbackBuffers}),this.model.setTransformFeedback(this.transformFeedback),i&&this.model.setGPUVectors(i,{count:"vertex"}),r&&this.setOutputVectors(r)}destroy(){this.model&&this.model.destroy()}delete(){this.destroy()}run(e){let{inputVectors:t,outputVectors:i,inputBuffers:r,outputBuffers:s,...n}=e??{};r&&this.model.setAttributes(r),t&&this.model.setGPUVectors(t,{count:"vertex"}),s&&(this.outputBuffers=s),(s||i||Object.keys(this.outputVectorBindings).length>0)&&this.setOutputVectors(i??this.outputVectorBindings);let o=this.device.beginRenderPass({discard:!0,...n});try{this.model.draw(o)}finally{o.end()}}setOutputVectors(e){let t=(0,ef.t)(this.model.id,e);(0,eh.v)(0===t.length||35980!==this.model.pipeline.props.bufferMode),(0,eh.v)(t.length<=1),this.outputVectorBindings=e,this.transformFeedback.setBuffers({...this.outputBuffers,...Object.fromEntries(Object.entries(t[0]?.data??{}).map(([e,t])=>((0,eh.v)(t.byteStride===t.rowByteLength),[e,{buffer:t.buffer instanceof Q.kL?t.buffer.buffer:t.buffer,byteOffset:t.byteOffset,byteLength:t.length*t.byteStride}])))})}getBuffer(e){return this.transformFeedback.getBuffer(e)}readAsync(e){let t=this.getBuffer(e);if(!t)throw Error("BufferTransform#getBuffer");if(t instanceof s.h)return t.readAsync();let{buffer:i,byteOffset:r=0,byteLength:n=i.byteLength}=t;return i.readAsync(r,n)}}var eg=i(43464);function em(e){let{source:t,target:i,start:r=0,size:s,getData:n}=e,o=e.end||i.length,a=t.length,l=o-r;if(a>l)return void i.set(t.subarray(0,l),r);if(i.set(t,r),!n)return;let c=a;for(;c<l;){let e=n(c,t);for(let t=0;t<s;t++)i[r+c]=e[t]||0,c++}}function ev(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`No defined attribute type for size "${e}"`)}}function ey(e){switch(e){case 1:return"float32";case 2:return"float32x2";case 3:return"float32x3";case 4:return"float32x4";default:throw Error("invalid type size")}}function e_(e){e.push(e.shift())}function eb({device:e,source:t,target:i}){return(!i||i.byteLength<t.byteLength)&&(i?.destroy(),i=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),i}function ew({device:e,buffer:t,attribute:i,fromLength:r,toLength:s,fromStartIndices:n,getData:o=e=>e}){let a=i.isDoublePrecisionBuffer?2:1,l=i.size*a,c=i.byteOffset,h=i.settings.bytesPerElement<4?c/i.settings.bytesPerElement*4:c,u=i.startIndices,d=n&&u,f=i.isConstant;if(!d&&t&&r>=s)return t;let p=i.value instanceof Float64Array?Float32Array:i.value.constructor,g=f?i.value:new p(i.getBuffer().readSyncWebGL(c,s*p.BYTES_PER_ELEMENT).buffer);if(i.settings.normalized&&!f){let e=o;o=(t,r)=>i.normalizeConstant(e(t,r))}let m=f?(e,t)=>o(g,t):(e,t)=>o(g.subarray(e,e+l),t),v=new Float32Array(t?t.readSyncWebGL(h,4*r).buffer:0),y=new Float32Array(s);return!function({source:e,target:t,size:i,getData:r,sourceStartIndices:s,targetStartIndices:n}){if(!s||!n)return em({source:e,target:t,size:i,getData:r});let o=0,a=0,l=r&&((e,t)=>r(e+a,t)),c=Math.min(s.length,n.length);for(let r=1;r<c;r++){let c=s[r]*i,h=n[r]*i;em({source:e.subarray(o,c),target:t,start:a,end:h,size:i,getData:l}),o=c,a=h}a<t.length&&em({source:[],target:t,start:a,size:i,getData:l})}({source:v,target:y,sourceStartIndices:n,targetStartIndices:u,size:l,getData:m}),(!t||t.byteLength<y.byteLength+h)&&(t?.destroy(),t=e.createBuffer({byteLength:y.byteLength+h,usage:35050})),t.write(y,h),t}var eP=i(69309);class eS{constructor({device:e,attribute:t,timeline:i}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new eP.A(i),this.attribute=t,this.attributeInTransition=function(e){let{device:t,settings:i,value:r}=e,s=new L(t,i);return s.setData({value:r instanceof Float64Array?new Float64Array(0):new Float32Array(0),normalized:i.normalized}),s}(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,i=1/0){this.settings=e,this.attributeInTransition.numInstances=this.attribute.numInstances,this.currentStartIndices=this.attribute.startIndices,this.currentLength=function(e,t){let{settings:i,value:r,size:s}=e,n=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:a}=e.settings;if(a)for(let e of Object.values(a))o=Math.max(o,e.vertexOffset??0);return(i.noAlloc?r.length:(t+o)*s)*n}(this.attribute,t),this.transition.start({...e,duration:i})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){for(let e of(this.cancel(),this.buffers))e.destroy();this.buffers.length=0}}let eE={name:"interpolation",vs:`\
layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:"f32"}},ex=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,eC=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aFrom64Low;
in ATTRIBUTE_TYPE aTo;
in ATTRIBUTE_TYPE aTo64Low;
out ATTRIBUTE_TYPE vCurrent;
out ATTRIBUTE_TYPE vCurrent64Low;

vec2 mix_fp64(vec2 a, vec2 b, float x) {
  vec2 range = sub_fp64(b, a);
  return sum_fp64(a, mul_fp64(range, vec2(x, 0.0)));
}

void main(void) {
  for (int i=0; i<ATTRIBUTE_SIZE; i++) {
    vec2 value = mix_fp64(vec2(aFrom[i], aFrom64Low[i]), vec2(aTo[i], aTo64Low[i]), interpolation.time);
    vCurrent[i] = value.x;
    vCurrent64Low[i] = value.y;
  }
  gl_Position = vec4(0.0);
}
`;function eA(e){return e.isDoublePrecisionBuffer}let eL={name:"spring",vs:`\
layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:"f32",stiffness:"f32"}},eM=`\
#version 300 es
#define SHADER_NAME spring-transition-vertex-shader

#define EPSILON 0.00001

in ATTRIBUTE_TYPE aPrev;
in ATTRIBUTE_TYPE aCur;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vNext;
out float vIsTransitioningFlag;

ATTRIBUTE_TYPE getNextValue(ATTRIBUTE_TYPE cur, ATTRIBUTE_TYPE prev, ATTRIBUTE_TYPE dest) {
  ATTRIBUTE_TYPE velocity = cur - prev;
  ATTRIBUTE_TYPE delta = dest - cur;
  ATTRIBUTE_TYPE force = delta * spring.stiffness;
  ATTRIBUTE_TYPE resistance = velocity * spring.damping;
  return force - resistance + velocity + cur;
}

void main(void) {
  bool isTransitioning = length(aCur - aPrev) > EPSILON || length(aTo - aCur) > EPSILON;
  vIsTransitioningFlag = isTransitioning ? 1.0 : 0.0;

  vNext = getNextValue(aCur, aPrev, aTo);
  gl_Position = vec4(0, 0, 0, 1);
  gl_PointSize = 100.0;
}
`,eT=`\
#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`,eO={interpolation:class extends eS{constructor({device:e,attribute:t,timeline:i}){var r,s;let n,o,a,l;super({device:e,attribute:t,timeline:i}),this.type="interpolation",this.hasUpdated=!1,this.transform=(r=e,o=ev(n=(s=t).size),a=ey(n),l=s.getBufferLayout(),eA(s)?new ep(r,{vs:eC,bufferLayout:[{name:"aFrom",byteStride:8*n,attributes:[{attribute:"aFrom",format:a,byteOffset:0},{attribute:"aFrom64Low",format:a,byteOffset:4*n}]},{name:"aTo",byteStride:8*n,attributes:[{attribute:"aTo",format:a,byteOffset:0},{attribute:"aTo64Low",format:a,byteOffset:4*n}]}],modules:[eg.d,eE],defines:{ATTRIBUTE_TYPE:o,ATTRIBUTE_SIZE:n},moduleSettings:{},varyings:["vCurrent","vCurrent64Low"],bufferMode:35980,disableWarnings:!0}):new ep(r,{vs:ex,bufferLayout:[{name:"aFrom",format:a},{name:"aTo",format:l.attributes[0].format}],modules:[eE],defines:{ATTRIBUTE_TYPE:o},varyings:["vCurrent"],disableWarnings:!0}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0)return void this.transition.cancel();let{buffers:s,attribute:n}=this;this.hasUpdated&&e_(s),this.hasUpdated=!1,s[0]=ew({device:this.device,buffer:s[0],attribute:n,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),s[1]=eb({device:this.device,source:s[0],target:s[1]}),this.setBuffer(s[1]);let{transform:o}=this,a=o.model,l=Math.floor(this.currentLength/n.size);eA(n)&&(l/=2),a.setVertexCount(l),n.isConstant?(a.setAttributes({aFrom:s[0]}),a.setConstantAttributes({aTo:n.value})):a.setAttributes({aFrom:s[0],aTo:n.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:s[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:i}=this.transition,r=i/e;t&&(r=t(r));let{model:s}=this.transform,n={time:r};s.shaderInputs.setProps({interpolation:n}),this.transform.run({discard:!0}),this.hasUpdated=!0}delete(){super.delete(),this.transform.destroy()}},spring:class extends eS{constructor({device:e,attribute:t,timeline:i}){var r,s,n,o;let a,l;super({device:e,attribute:t,timeline:i}),this.type="spring",this.texture=e.createTexture({data:new Uint8Array(4),format:"rgba8unorm",width:1,height:1}),this.framebuffer=(r=e,s=this.texture,r.createFramebuffer({id:"spring-transition-is-transitioning-framebuffer",width:1,height:1,colorAttachments:[s]})),this.transform=(n=e,a=ev((o=t).size),new ep(n,{vs:eM,fs:eT,bufferLayout:[{name:"aPrev",format:l=ey(o.size)},{name:"aCur",format:l},{name:"aTo",format:o.getBufferLayout().attributes[0].format}],varyings:["vNext"],modules:[eL],defines:{ATTRIBUTE_TYPE:a},parameters:{depthCompare:"always",blendColorOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:s,attribute:n}=this;for(let t=0;t<2;t++)s[t]=ew({device:this.device,buffer:s[t],attribute:n,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});s[2]=eb({device:this.device,source:s[0],target:s[2]}),this.setBuffer(s[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/n.size)),n.isConstant?o.setConstantAttributes({aTo:n.value}):o.setAttributes({aTo:n.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:i,transition:r}=this,s=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let n={stiffness:s.stiffness,damping:s.damping};t.model.shaderInputs.setProps({spring:n}),t.run({framebuffer:i,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),e_(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(i)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}}};class ej{constructor(e,{id:t,timeline:i}){if(!e)throw Error("AttributeTransitionManager is constructed without device");this.id=t,this.device=e,this.timeline=i,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:i}){for(let r in this.numInstances=i||1,e){let i=e[r],s=i.getTransitionSetting(t);s&&this._updateAttribute(r,i,s)}for(let i in this.transitions){let r=e[i];r&&r.getTransitionSetting(t)||(this._removeTransition(i),r&&(r.setNeedsRedraw(),r.setLayoutChanged()))}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let i=this.transitions[t];i.inProgress&&(e[t]=i.attributeInTransition)}return e}run(){if(0===this.numInstances)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,i){let r=this.transitions[e],s=!r||r.type!==i.type;if(s){r&&this._removeTransition(e);let n=eO[i.type];n?this.transitions[e]=new n({attribute:t,timeline:this.timeline,device:this.device}):(g.A.error(`unsupported transition type '${i.type}'`)(),s=!1)}(s||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(i,this.numInstances))}}let eI="attributeManager.invalidate";class eR{constructor(e,{id:t="attribute-manager",stats:i,timeline:r}={}){this.mergeBoundsMemoized=(0,el.A)(p._Z),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=i,this.attributeTransitionManager=new ej(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups="webgpu"===e.type?new en(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){for(let e in this.attributeBufferGroups?.finalize(),this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:"instance"})}remove(e){for(let t of e)void 0!==this.attributes[t]&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let i=this._invalidateTrigger(e,t);(0,ec.A)(eI,this,e,i)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);(0,ec.A)(eI,this,"all")}update({data:e,numInstances:t,startIndices:i=null,transitions:r,props:s={},buffers:n={},context:o={}}){let a=!1;for(let r in(0,ec.A)("attributeManager.updateStart",this),this.stats&&this.stats.get("Update Attributes").timeStart(),this.attributes){let l=this.attributes[r],c=l.settings.accessor;l.startIndices=i,l.numInstances=t,s[r]&&g.A.removed(`props.${r}`,`data.attributes.${r}`)(),l.setExternalBuffer(n[r])||l.setBinaryValue("string"==typeof c?n[c]:void 0,e.startIndices)||"string"==typeof c&&!n[c]&&l.setConstantValue(o,s[c])||l.needsUpdate()&&(a=!0,this._updateAttribute({attribute:l,numInstances:t,data:e,props:s,context:o})),this.needsRedraw=this.needsRedraw||l.needsRedraw()}a&&(0,ec.A)("attributeManager.updateEnd",this,t),this.stats&&(this.stats.get("Update Attributes").timeEnd(),a&&this.stats.get("Attributes updated").incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getGPUVectors(e=this.getAttributes(),t){let i={};for(let t of Object.values(e))Object.assign(i,t.getGPUVector());if(t)for(let e of t.bufferLayouts){let r=t.buffers[e.name];r&&(i[e.name]=new x.M({type:"interleaved",name:e.name,buffer:r,length:t.length,byteStride:e.byteStride,attributes:e.attributes,ownsBuffer:!1}))}return i}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:i}=this,r={...i.getAttributes()};for(let s in t){let n=t[s];n.needsRedraw(e)&&!i.hasAttribute(s)&&(r[s]=n)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,i={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,i):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let i in e){let r=e[i],s={...r,id:i,size:r.isIndexed&&1||r.size||1,...t};this.attributes[i]=new L(this.device,s)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(i=>{e[i]||(e[i]=[]),e[i].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:i,updateTriggers:r}=this,s=r[e];return s&&s.forEach(e=>{let r=i[e];r&&r.setNeedsUpdate(r.id,t)}),s}_updateAttribute(e){let{attribute:t,numInstances:i}=e;((0,ec.A)("attribute.updateStart",t),t.constant)?t.setConstantValue(e.context,t.value):(t.allocate(i)&&(0,ec.A)("attribute.allocate",t,i),t.updateBuffer(e)&&(this.needsRedraw=!0,(0,ec.A)("attribute.updateEnd",t,i)))}}var eD=i(25359),eB=i(49105);class ek extends eP.A{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:i,duration:r,easing:s}}=this,n=s(e/r);this._value=(0,eB.Cc)(t,i,n)}}function ez(e,t,i,r,s){let n=t-e;return(i-t)*s+-n*r+n+t}function eV(e,t){if(Array.isArray(e)){let i=0;for(let r=0;r<e.length;r++){let s=e[r]-t[r];i+=s*s}return Math.sqrt(i)}return Math.abs(e-t)}class eU extends eP.A{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:i,stiffness:r}=this.settings,{_prevValue:s=e,_currValue:n=e}=this,o=function(e,t,i,r,s){if(Array.isArray(i)){let n=[];for(let o=0;o<i.length;o++)n[o]=ez(e[o],t[o],i[o],r,s);return n}return ez(e,t,i,r,s)}(s,n,t,i,r),a=eV(o,t),l=eV(o,n);a<1e-5&&l<1e-5&&(o=t,this.end()),this._prevValue=n,this._currValue=o}}let eF={interpolation:ek,spring:eU};class eN{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,i,r){let{transitions:s}=this;if(s.has(e)){let i=s.get(e),{value:r=i.settings.fromValue}=i;t=r,this.remove(e)}if(!(r=E(r)))return;let n=eF[r.type];if(!n)return void g.A.error(`unsupported transition type '${r.type}'`)();let o=new n(this.timeline);o.start({...r,fromValue:t,toValue:i}),s.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,i]of this.transitions)i.update(),e[t]=i.value,i.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}}var eG=i(2825);function e$({newProps:e,oldProps:t,ignoreProps:i={},propTypes:r={},triggerName:s="props"}){if(t===e)return!1;if("object"!=typeof e||null===e||"object"!=typeof t||null===t)return`${s} changed shallowly`;for(let n of Object.keys(e))if(!(n in i)){if(!(n in t))return`${s}.${n} added`;let i=eW(e[n],t[n],r[n]);if(i)return`${s}.${n} ${i}`}for(let n of Object.keys(t))if(!(n in i)){if(!(n in e))return`${s}.${n} dropped`;if(!Object.hasOwnProperty.call(e,n)){let i=eW(e[n],t[n],r[n]);if(i)return`${s}.${n} ${i}`}}return!1}function eW(e,t,i){let r=i&&i.equal;return r&&!r(e,t,i)||!r&&(r=e&&t&&e.equals)&&!r.call(e,t)?"changed deeply":r||t===e?null:"changed shallowly"}function eY(e,t,i){let r=e.updateTriggers[i];r=null==r?{}:r;let s=t.updateTriggers[i];return e$({oldProps:s=null==s?{}:s,newProps:r,triggerName:i})}var eH=i(72594);function eq(e,t){if(!t)return e;let i={...e,...t};if("defines"in t&&(i.defines={...e.defines,...t.defines}),"modules"in t&&(i.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>"project64"===e.name))){let e=i.modules.findIndex(e=>"project32"===e.name);e>=0&&i.modules.splice(e,1)}if("plugins"in t&&(i.plugins=[...new Set([...e.plugins||[],...t.plugins||[]])]),"inject"in t)if(e.inject){let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||"")+t.inject[e];i.inject=r}else i.inject=t.inject;return i}var eJ=i(25110),eZ=i(82811),eK=i(40870),eX=i(89043),eQ=i(83122),e0=i(88967);function e1(e,t,i=!1){let r=t.projectPosition(e);if(i&&t instanceof eJ.A){let[i,s,n=0]=e,o=t.getDistanceScales([i,s]);r[2]=n*o.unitsPerMeter[2]}return r}var e2=i(84047),e3=i(55861);let e4={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},e6={},e5={boolean:{validate:(e,t)=>!0,equal:(e,t,i)=>!!e==!!t},number:{validate:(e,t)=>Number.isFinite(e)&&(!("max"in t)||e<=t.max)&&(!("min"in t)||e>=t.min)},color:{validate:(e,t)=>t.optional&&!e||e9(e)&&(3===e.length||4===e.length),equal:(e,t,i)=>(0,eH.b)(e,t,1)},accessor:{validate(e,t){let i=e7(e);return"function"===i||i===e7(t.value)},equal:(e,t,i)=>"function"==typeof t||(0,eH.b)(e,t,1)},array:{validate:(e,t)=>t.optional&&!e||e9(e),equal(e,t,i){let{compare:r}=i,s=Number.isInteger(r)?r:+!!r;return r?(0,eH.b)(e,t,s):e===t}},object:{equal(e,t,i){if(i.ignore)return!0;let{compare:r}=i,s=Number.isInteger(r)?r:+!!r;return r?(0,eH.b)(e,t,s):e===t}},function:{validate:(e,t)=>t.optional&&!e||"function"==typeof e,equal:(e,t,i)=>!i.compare&&!1!==i.ignore||e===t},data:{transform:(e,t,i)=>{if(!e)return e;let{dataTransform:r}=i.props;return r?r(e):"string"==typeof e.shape&&e.shape.endsWith("-table")&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,i)=>{let r=i.context;return r&&r.device?function(e,t,i,r){if(i instanceof e3.g)return i;i.constructor&&"Object"!==i.constructor.name&&(i={data:i});let s=null;i.compressed&&(s={minFilter:"linear",mipmapFilter:i.data.length>1?"nearest":"linear"});let{width:n,height:o}=i.data,a=t.createTexture({...i,sampler:{...e4,...s,...r},mipLevels:t.getMipLevelCount(n,o)});return"webgl"===t.type?a.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(a),e6[a.id]=e,a}(i.id,r.device,e,{...t.parameters,...i.props.textureParameters}):null},release:(e,t,i)=>{var r;r=i.id,e&&e instanceof e3.g&&e6[e.id]===r&&(e.delete(),delete e6[e.id])}}};function e8(e,t){return"type"in t?{name:e,...e5[t.type],...t}:"value"in t?{name:e,type:e7(t.value),...t}:{name:e,type:"object",value:t}}function e9(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function e7(e){return e9(e)?"array":null===e?"null":typeof e}function te(e,t){return Object.prototype.hasOwnProperty.call(e,t)}let tt=0;class ti{constructor(...e){this.props=function(e,t){let i;for(let e=t.length-1;e>=0;e--){let r=t[e];"extensions"in r&&(i=r.extensions)}let r=Object.create(function e(t,i){var r,s;if(!(t instanceof tr.constructor))return{};let n="_mergedDefaultProps";if(i)for(let e of i){let t=e.constructor;t&&(n+=`:${t.extensionName||t.name}`)}let o=te(r=t,s=n)&&r[s];return o||(t[n]=function(t,i){var r;let s;if(!t.prototype)return null;let n=e(Object.getPrototypeOf(t)),o=function(e){let t={},i={},r={};for(let[s,n]of Object.entries(e)){let e=n?.deprecatedFor;if(e)r[s]=Array.isArray(e)?e:[e];else{let e=function(e,t){switch(e7(t)){case"object":return e8(e,t);case"array":return e8(e,{type:"array",value:t,compare:!1});case"boolean":return e8(e,{type:"boolean",value:t});case"number":return e8(e,{type:"number",value:t});case"function":return e8(e,{type:"function",value:t,compare:!0});default:return{name:e,type:"unknown",value:t}}}(s,n);t[s]=e,i[s]=e.value}}return{propTypes:t,defaultProps:i,deprecatedProps:r}}(function(e,t){return te(e,t)&&e[t]}(t,"defaultProps")||{}),a=Object.assign(Object.create(null),n,o.defaultProps),l=Object.assign(Object.create(null),n?.[eG.fW],o.propTypes),c=Object.assign(Object.create(null),n?.[eG.uH],o.deprecatedProps);for(let t of i){let i=e(t.constructor);i&&(Object.assign(a,i),Object.assign(l,i[eG.fW]),Object.assign(c,i[eG.uH]))}return Object.defineProperties(a,{id:{writable:!0,value:((s=(r=t).componentName)||g.A.warn(`${r.name}.componentName not specified`)(),s||r.name)}}),function(e,t){let i={},r={};for(let e in t){let s=t[e],{name:n,value:o}=s;s.async&&(i[n]=o,r[n]=function(e){return{enumerable:!0,set(t){"string"==typeof t||t instanceof Promise||(0,_.Td)(t)?this[eG.YN][e]=t:this[eG.vf][e]=t},get(){if(this[eG.vf]){if(e in this[eG.vf])return this[eG.vf][e]||this[eG.jA][e];if(e in this[eG.YN]){let t=this[eG.r3]&&this[eG.r3].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[eG.jA][e]}}return this[eG.jA][e]}}}(n))}e[eG.jA]=i,e[eG.YN]={},Object.defineProperties(e,r)}(a,l),function(e,t){for(let i in t)Object.defineProperty(e,i,{enumerable:!1,set(e){let r=`${this.id}: ${i}`;for(let r of t[i])te(this,r)||(this[r]=e);g.A.deprecated(r,t[i].join("/"))()}})}(a,c),a[eG.fW]=l,a[eG.uH]=c,0!==i.length||te(t,"_propTypes")||(t._propTypes=l),a}(t,i||[]))}(e.constructor,i));r[eG.r3]=e,r[eG.YN]={},r[eG.vf]={};for(let e=0;e<t.length;++e){let i=t[e];for(let e in i)r[e]=i[e]}return Object.freeze(r),r}(this,e),this.id=this.props.id,this.count=tt++}clone(e){let{props:t}=this,i={};for(let e in t[eG.jA])e in t[eG.vf]?i[e]=t[eG.vf][e]:e in t[eG.YN]&&(i[e]=t[eG.YN][e]);return new this.constructor({...t,...i,...e})}}ti.componentName="Component",ti.defaultProps={};let tr=ti;var ts=i(36411),tn=i(90577);let to=Object.freeze({});class ta{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||to}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[eG.r3]||this.component;let t=e[eG.vf]||{},i=e[eG.YN]||e,r=e[eG.jA]||{};for(let e in t){let i=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,i),t[e]=this.getAsyncProp(e)}for(let e in i){let t=i[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if("string"==typeof t&&(t=this._fetch(e,t)),t instanceof Promise)return void this._watchPromise(e,t);if((0,_.Td)(t))return void this._resolveAsyncIterable(e,t);this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps)for(let e in this.oldAsyncProps=Object.create(this.oldProps),this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}_didAsyncInputValueChange(e,t){let i=this.asyncProps[e];return t!==i.resolvedValue&&t!==i.lastValue&&(i.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let i=this.asyncProps[e];i&&(t=this._postProcessValue(i,t),i.resolvedValue=t,i.pendingLoadCount++,i.resolvedLoadCount=i.pendingLoadCount)}_setAsyncPropValue(e,t,i){let r=this.asyncProps[e];r&&i>=r.resolvedLoadCount&&void 0!==t&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=i,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let i=this.asyncProps[e];if(i){i.pendingLoadCount++;let r=i.pendingLoadCount;t.then(t=>{!this.component||r<i.resolvedLoadCount||(t=this._postProcessValue(i,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if("data"!==e)return void this._setPropValue(e,t);let i=this.asyncProps[e];if(!i)return;i.pendingLoadCount++;let r=i.pendingLoadCount,s=[],n=0;for await(let i of t){if(!this.component)return;let{dataTransform:t}=this.component.props;Object.defineProperty(s=t?t(i,s):s.concat(i),"__diff",{enumerable:!1,value:[{startRow:n,endRow:s.length}]}),n=s.length,this._setAsyncPropValue(e,s,r)}this._onResolve(e,s)}_postProcessValue(e,t){let i=e.type;return i&&this.component&&(i.release&&i.release(e.resolvedValue,i,this.component),i.transform)?i.transform(t,i,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let i=this.component&&this.component.props[eG.fW];this.asyncProps[e]={type:i&&i[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}}class tl extends ta{constructor({attributeManager:e,layer:t}){super(t),this.sourceCrs=null,this.packedCrs=null,this.preproject=null,this.unpreproject=null,this.preprojectionSignature=null,this.preprojectionChanged=!1,this.tessellationSignature=null,this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let i=this.layer,r=i?.props.fetch;return r?r(t,{propName:e,layer:i}):super._fetch(e,t)}_onResolve(e,t){let i=this.layer;if(i){let r=i.props.onDataLoad;"data"===e&&r&&r(t,{propName:e,layer:i})}}_onError(e,t){let i=this.layer;i&&i.raiseError(t,`loading ${e} of ${this.layer}`)}}var tc=i(327);let th=Object.freeze([]),tu=(0,el.A)(({oldViewport:e,viewport:t})=>e.equals(t)),td=new Uint8ClampedArray(0);function tf(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function tp(e){return e.rowIndexes}function tg(e){return e.pickingColors||e.instancePickingColors}let tm={data:{type:"data",value:th,async:!0},dataComparator:{type:"function",value:null,optional:!0},_dataDiff:{type:"function",value:e=>e&&e.__diff,optional:!0},dataTransform:{type:"function",value:null,optional:!0},onDataLoad:{type:"function",value:null,optional:!0},onError:{type:"function",value:null,optional:!0},fetch:{type:"function",value:(e,{propName:t,layer:i,loaders:r,loadOptions:s,signal:n})=>{let{resourceManager:o}=i.context;s=s||i.getLoadOptions(),r=r||i.props.loaders,n&&(s={...s,core:{...s?.core,fetch:{...s?.core?.fetch,signal:n}}});let a=o.contains(e);return(a||s||(o.add({resourceId:e,data:(0,tc.H)(e,r),persistent:!1}),a=!0),a)?o.subscribe({resourceId:e,onChange:e=>i.internalState?.reloadAsyncProp(t,e),consumerId:i.id,requestId:t}):(0,tc.H)(e,r,s)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:"number",min:0,max:1,value:1},operation:"draw",onHover:{type:"function",value:null,optional:!0},onClick:{type:"function",value:null,optional:!0},onDragStart:{type:"function",value:null,optional:!0},onDrag:{type:"function",value:null,optional:!0},onDragEnd:{type:"function",value:null,optional:!0},coordinateSystem:{type:"object",value:"default",validate:e=>"string"==typeof e||!!e&&"object"==typeof e,equal:ts.vk},coordinateOrigin:{type:"array",value:[0,0,0],compare:!0},modelMatrix:{type:"array",value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:"XYZ",colorFormat:"RGBA",parameters:{type:"object",value:{},optional:!0,compare:2},loadOptions:{type:"object",value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:"array",value:[],optional:!0,ignore:!0},getPolygonOffset:{type:"function",value:({layerIndex:e})=>[0,-(100*e)]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:"accessor",value:[0,0,128,128]}};class tv extends tr{constructor(){super(...arguments),this.internalState=null,this.lifecycle=eG.VD.NO_STATE,this._coordinateSystemLoading=!1,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,"layerName")?this.layerName:""}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){let e=this.constructor.layerName||this.constructor.name;return`${e}({id: '${this.props.id}'})`}project(e){(0,y.A)(this.internalState);let t=this.internalState.viewport||this.context.viewport,i=this.projectPosition(e,{autoOffset:!1}),[r,s,n]=(0,e0.VJ)(i,t.pixelProjectionMatrix);return 2===e.length?[r,s]:[r,s,n]}unproject(e){return(0,y.A)(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t={}){(0,y.A)(this.internalState);let{viewport:i=this.internalState.viewport||this.context.viewport,sourceCrs:r=this.internalState.sourceCrs,coordinateSystem:s=t.sourceCrs?.signature??this.props.coordinateSystem,modelMatrix:n=this.props.modelMatrix,coordinateOrigin:o=this.props.coordinateOrigin,autoOffset:a}=t;return function(e,t){let{viewport:i,sourceCrs:r,coordinateSystem:s,coordinateOrigin:n}=t,o=!1===t.autoOffset?null:(0,eK.ow)(i,s,n,r),a=function(e,{sourceCrs:t,viewport:i,modelMatrix:r,coordinateOrigin:s,coordinateSystem:n,offsetMode:o=!1}){let[a,l,c=0]=e;switch(r&&([a,l,c]=eQ.Z0([],[a,l,c,1],r)),n){case"meter-offsets":if(i.projectionMode===eZ.K.CUSTOM_GEOSPATIAL){let e=i.projectPosition(s),t=i.crs.converter.WGS84.from(s),{unitsPerMeter:r}=i.getDistanceScales(t);return[e[0]+a*r[0],e[1]+l*r[1],e[2]+c*r[2]]}return e1((0,e0.dT)(s,[a,l,c]),i,o);case"cartesian":break;default:if(t){let e=[a+s[0],l+s[1],c+(s[2]||0)],{preproject:r}=i.getPreprojection(t),n=r?r(e):e;if(i.projectionMode===eZ.K.CUSTOM_GEOSPATIAL)return n.map((e,t)=>e*i.distanceScales.unitsPerWorldUnit[t]);return e1(n,i,o)}}if(i.projectionMode===eZ.K.CUSTOM_GEOSPATIAL){let e=i.distanceScales.unitsPerWorldUnit;return[(a+s[0])*e[0],(l+s[1])*e[1],(c+s[2])*e[2]]}return i.isGeospatial?[a+s[0],l+s[1],c+s[2]]:i.projectPosition([a,l,c])}(e,{...t,offsetMode:!!o?.offsetMode});if(o?.offsetMode){let e=o.commonOrigin||i.projectPosition(o.geospatialOrigin||o.shaderCoordinateOrigin);eX.jb(a,a,e)}return a}(e,{viewport:i,sourceCrs:r,coordinateSystem:s,modelMatrix:n,coordinateOrigin:o,autoOffset:a})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return!!this.internalState&&!this._coordinateSystemLoading&&!this.internalState.isAsyncPropLoading()}get isCoordinateSystemLoaded(){return!this._coordinateSystemLoading}_setSourceCrs(e){this._coordinateSystemLoading=void 0===e,void 0!==e&&(this._sourceCrs=e,this.internalState&&(this.internalState.sourceCrs=e,this._updatePreprojection(this.internalState.viewport||this.context.viewport)))}_updatePreprojection(e){let t=this.internalState,i=!(0,tn.eN)(e.projectionMode,t.sourceCrs,e.crs),r=JSON.stringify([t.sourceCrs?.signature,i?e.projectionMode===eZ.K.CUSTOM_GEOSPATIAL?e.crs?.signature:"WGS84":null]),s=t.preprojectionSignature!==r;s&&(Object.assign(t,e.getPreprojection(t.sourceCrs)),t.preprojectionSignature=r,t.preprojectionChanged=!0);let n=JSON.stringify([e.crs?.signature,e.projectionSignature]),o=t.tessellationSignature!==n;return t.tessellationSignature=n,Object.assign(this.state,{sourceCrs:t.sourceCrs,packedCrs:t.packedCrs,preproject:t.preproject,unpreproject:t.unpreproject}),(s||o)&&t.changeFlags&&this.setChangeFlags({projectionChanged:!0}),s||o}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}usePositionTransforms(){return{transformSource:"projection",transform:this.internalState?.preproject?t_:null}}getSubdivisionStep(){let e=this.internalState?.sourceCrs;if(!e)return 0;let t=this.context.viewport.getSubdivisionStep(e),{modelMatrix:i}=this.props;if(!t||!i)return t;let r=Math.max(Math.hypot(i[0],i[1],i[2]),Math.hypot(i[4],i[5],i[6]));return r>0?t/r:0}use64bitPositions(){let{coordinateSystem:e}=this.props;return!!this.internalState?.sourceCrs||this.context?.viewport?.projectionMode===eZ.K.CUSTOM_GEOSPATIAL||"default"===e||"lnglat"===e||"cartesian"===e}onHover(e,t){return!!this.props.onHover&&(this.props.onHover(e,t)||!1)}onClick(e,t){return!!this.props.onClick&&(this.props.onClick(e,t)||!1)}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){(0,y.A)(e instanceof Uint8Array);let[t,i,r]=e;return t+256*i+65536*r-1}getNumInstances(){if(Number.isFinite(this.props.numInstances))return this.props.numInstances;if(this.state&&void 0!==this.state.numInstances)return this.state.numInstances;var e,t,i=this.props.data;if(null===(e=i)||"object"!=typeof e)throw Error("count(): argument not an object");if((0,o._)(i))return i.numRows;if("function"==typeof i.count)return i.count();if(Number.isFinite(i.size))return i.size;if(Number.isFinite(i.length))return i.length;if(null!==(t=i)&&"object"==typeof t&&t.constructor===Object)return Object.keys(i).length;throw Error("count(): argument not a container")}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds(["positions","instancePositions"])}resolveColumns(e,t=!1){return(0,a.S)(this.props,e,t)}getShaders(e){for(let t of(e=eq({defines:{USE_EXTERNAL_PROJECTION:this.context.viewport.projectionMode===eZ.K.CUSTOM_GEOSPATIAL}},e),e.modules?.includes(e2.Ay)&&!e.plugins?.includes(e2.lT)&&(e=eq(e,{plugins:[e2.lT]})),e=eq(e,{disableWarnings:!0,modules:this.context.defaultShaderModules,plugins:this.context.defaultShaderPlugins}),this.props.extensions))e=eq(e,t.getShaders.call(this,t));return{...e,shaderAssembler:this.context.shaderAssembler}}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:i}=e.changeFlags;if(i&&t)if(Array.isArray(i))for(let e of i)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:i}=e,r=this.internalState.hasPickingBuffer,s=Number.isInteger(i.highlightedObjectIndex)||!!i.pickable||i.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==s){this.internalState.hasPickingBuffer=s;let e=tf(t.attributes);e&&(s&&e.constant&&(e.constant=!1,t.invalidate(e.id)),e.value||s||(e.constant=!0,e.value=tp(t.attributes)?[e2.Z1]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:i}){let{index:r}=e;return r>=0&&(Array.isArray(this.props.data)?e.object=this.props.data[r]:(0,o._)(this.props.data)&&(e.object=this.props.data.get(r))),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return!!this.internalState&&(this.internalState.needsUpdate||this.internalState.changeFlags.projectionChanged||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()))}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState||!this.context.layerManager.isViewportReady(this))return;let t=this.internalState.viewport;if(this.internalState.viewport=e,this._coordinateSystemLoading)return;let i=this._updatePreprojection(e);t&&tu({oldViewport:t,viewport:e})||(this.setChangeFlags({viewportChanged:!0,projectionChanged:i}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e="all"){let t=this.getAttributeManager();t&&("all"===e?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let i in e)e[i].layoutChanged()&&(t=!0);let i=this.getAttributeManager(),r=!!i?.hasBufferGroups();for(let s of(r&&i.getBufferGroupBindings(e),this.getModels()))this._setModelAttributes(s,e,t,r)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,i=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:i,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let s=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(s)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),i=Object.create(this.props);for(let e in t)Object.defineProperty(i,e,{value:t[e]});return i}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let i=Math.floor(td.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&0===td[0];if(i<t||r){t>0xffffff&&g.A.warn("Layer has too many data objects. Picking might not be able to distinguish all objects.")();let e=Math.floor((td=f.A.allocate(td,t,{size:4,copy:!0,maxCount:Math.max(t,0xffffff)})).length/4),s=[0,0,0],n=r?0:i;for(let t=n;t<e;t++)this.encodePickingColor(t,s),td[4*t+0]=s[0],td[4*t+1]=s[1],td[4*t+2]=s[2],td[4*t+3]=0}e.value=td.subarray(0,4*t)}_setGPUVectorModelAttributes(e,t,i){let r,s=e.userData?.excludeAttributes||{},n=t.getBufferGroupBindings(i,e,s),o={...t.getAttributes()};for(let e in o)s[e]||n.groupedAttributeIds.has(e)?delete o[e]:o[e].settings.isIndexed&&(r=o[e].getBuffer(),delete o[e]);let a=t.getGPUVectors(o,{...n,length:this.getNumInstances()});e.setGPUAttributes(a,n.bufferLayouts),void 0!==r&&e.setIndexBuffer(r)}_setModelAttributes(e,t,i=!1,r=!1){if(!Object.keys(t).length)return;let n=this.getAttributeManager(),o=r?{}:t;if(e instanceof eD.A&&n)return void this._setGPUVectorModelAttributes(e,n,o);if(n?.hasBufferGroups())return void this._setGroupedModelAttributes(e,n,o);if(i){let i=this.getAttributeManager();e.setBufferLayout(i.getBufferLayouts(e)),t=i.getAttributes()}let a=e.userData?.excludeAttributes||{},l={},c={};for(let i in t){if(a[i])continue;let r=t[i].getValue();for(let n in r){let o=r[n];o instanceof s.h?t[i].settings.isIndexed?e.setIndexBuffer(o):l[n]=o:o&&(c[n]=o)}}e.setAttributes(l),e.setConstantAttributes(c)}_setGroupedModelAttributes(e,t,i){let r=e.userData?.excludeAttributes||{},n=t.getBufferGroupBindings(i,e,r);e.setBufferLayout(n.bufferLayouts);let o={...n.buffers},a={},l=t.getAttributes();for(let t in l){if(r[t]||n.groupedAttributeIds.has(t))continue;let i=l[t],c=i.getValue();for(let t in c){let r=c[t];r instanceof s.h?i.settings.isIndexed?e.setIndexBuffer(r):o[t]=r:r&&(a[t]=r)}}e.setAttributes(o),e.setConstantAttributes(a)}disablePickingIndex(e){let t=this.props.data;if(!("attributes"in t)||(0,o._)(t))return void this._disablePickingIndex(e);let i=this.getAttributeManager()?.getAttributes()||{},r=tp(i),s=tg(i),n=r&&t.attributes&&t.attributes[r.id];if(n&&n.value){let i=n.value;for(let s=0;s<t.length;s++)i[r.getVertexOffset(s)]===e&&this._disablePickingIndex(s);return}let a=s&&t.attributes&&t.attributes[s.id];if(a&&a.value){let i=a.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=s.getVertexOffset(e);i[t]===r[0]&&i[t+1]===r[1]&&i[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager()?.getAttributes()||{},i=tp(t);if(i){let t=i.getVertexOffset(e),r=new Uint32Array(i.getVertexOffset(e+1)-t);r.fill(e2.Z1),i.buffer.write(r,t*r.BYTES_PER_ELEMENT);return}let r=tg(t);if(!r){this.internalState&&(0,e2.uz)(this.internalState.disabledPickingIndices,e);return}let s=r.getVertexOffset(e),n=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(n-s),s)}restorePickingColors(){let e=this.getAttributeManager()?.getAttributes()||{},t=tf(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let i=tg(e);this.internalState.usesPickingColorCache&&i&&i.value.buffer!==td.buffer&&(i.value=td.subarray(0,i.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(e){(0,y.A)(!this.internalState);let t=this.context.viewport;this.context.viewport=e||t;try{(0,ec.A)("layer.initialize",this);let t=this._getAttributeManager();this.internalState=new tl({attributeManager:t,layer:this}),this.internalState.viewport=e,this._clearChangeFlags(),this.state={};let i=(this.props.coordinateSystem??"default")==="default"?this.context.viewport.isGeospatial?"WGS84":"cartesian":this.props.coordinateSystem,r=void 0===this._sourceCrs?(0,ts.rs)(i):this._sourceCrs;for(let e of((0,y.A)(!(r instanceof Promise)),this.internalState.sourceCrs=r,this._updatePreprojection(this.context.viewport),Object.defineProperty(this.state,"attributeManager",{get:()=>(g.A.deprecated("layer.state.attributeManager","layer.getAttributeManager()")(),t)}),this.internalState.uniformTransitions=new eN(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context),this.props.extensions))e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:"init",propsChanged:"init",viewportChanged:!0,extensionsChanged:!0}),this._update()}finally{this.context.viewport=t}}_transferState(e){(0,ec.A)("layer.matched",this,this===e);let{state:t,internalState:i}=e;this!==e&&(this.internalState=i,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){if(!this.internalState||this._coordinateSystemLoading||!this.context.layerManager.isViewportReady(this))return;this._updatePreprojection(this.internalState?.viewport||this.context.viewport);let e=this.needsUpdate();if((0,ec.A)("layer.update",this,e),!e)return;this.context.stats.get("Layer updates").incrementCount();let t=this.props,i=this.context,r=this.internalState,s=i.viewport,n=this._updateUniformTransition();r.propsInTransition=n,i.viewport=r.viewport||s,this.props=n;try{let e=this._getUpdateParams(),t=this.getModels(),s=!(0,ts.vk)(e.props.coordinateSystem,e.oldProps.coordinateSystem);if(r.preprojectionChanged||this.internalState.preproject&&(s||!(0,eH.b)(e.props.modelMatrix,e.oldProps.modelMatrix,1)||!(0,eH.b)(e.props.coordinateOrigin,e.oldProps.coordinateOrigin,1))){let e=this.getAttributeManager();for(let[t,i]of Object.entries(e?.attributes||{}))"projection"===i.settings.transformSource&&("transform"in i.settings&&(!i.settings.transform||i.settings.transform===t_)&&(i.settings.transform=this.usePositionTransforms().transform),e.invalidate(t))}if(i.device)this.updateState(e);else try{this.updateState(e)}catch(e){}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let n=this.getModels()[0]!==t[0];this._postUpdate(e,n)}finally{i.viewport=s,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.preprojectionChanged=!1,r.resetOldProps()}}_finalize(){for(let e of((0,ec.A)("layer.finalize",this),this.finalizeState(this.context),this.props.extensions))e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:i={},parameters:r={}}){this._updateAttributeTransition();let s=this.props,o=this.context;this.props=this.internalState.propsInTransition||s;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:s}=this.props,a=s&&s(i)||[0,0];o.device instanceof n.WebGLDevice&&o.device.setParametersWebGL({polygonOffset:a});let l=o.device instanceof n.WebGLDevice?null:function(e){let{blendConstant:t,...i}=e;return t?{pipelineParameters:i,renderPassParameters:{blendConstant:t}}:{pipelineParameters:i}}(r);if(function(e,t,i,r){for(let s of e)"webgpu"===s.device.type?s.setParameters({...s.parameters,...s.topology.startsWith("triangle")&&{depthBias:Math.round(r[1]),depthBiasSlopeScale:r[0]},...i?.pipelineParameters}):s.setParameters(t)}(this.getModels(),r,l,a),o.device instanceof n.WebGLDevice){let{colorMask:s,...n}=r;"number"==typeof s?Object.assign(n,{colorMask:[!!(1&s),!!(2&s),!!(4&s),!!(8&s)]}):s&&Object.assign(n,{colorMask:s}),o.device.withParametersWebGL(n,()=>{let s={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,s,e);this.draw(s)})}else{let s=e.getParameters();try{e.setParameters(l?.renderPassParameters||{});let s={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,s,e);this.draw(s)}finally{e.setParameters(s)}}}finally{this.props=s}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let i in e)if(e[i]){let r=!1;if("dataChanged"===i){let s=e[i],n=t[i];s&&Array.isArray(n)&&(t.dataChanged=Array.isArray(s)?n.concat(s):s,r=!0)}t[i]||(t[i]=e[i],r=!0),r&&(0,ec.A)("layer.changeFlag",this,i,e)}let i=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=i,t.somethingChanged=i||t.viewportChanged||t.projectionChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,projectionChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let i,r,s,n={...(i=e$({newProps:e,oldProps:t,propTypes:e[eG.fW],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=function(e,t){if(null===t)return"oldProps is null, initial diff";let i=!1,{dataComparator:r,_dataDiff:s}=e;return r?r(e.data,t.data)||(i="Data comparator detected a change"):e.data!==t.data&&(i="A new data container was supplied"),i&&s&&(i=s(e.data,t.data)||i),i}(e,t),s=!1,!r&&(s=function(e,t){if(null===t||"all"in e.updateTriggers&&eY(e,t,"all"))return{all:!0};let i={},r=!1;for(let s in e.updateTriggers)"all"!==s&&eY(e,t,s)&&(i[s]=!0,r=!0);return!!r&&i}(e,t)),{dataChanged:r,propsChanged:i,updateTriggersChanged:s,extensionsChanged:function(e,t){if(null===t)return!0;let i=t.extensions,{extensions:r}=e;if(r===i)return!1;if(!i||!r||r.length!==i.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(i[e]))return!0;return!1}(e,t),transitionsChanged:function(e,t){if(!e.transitions)return!1;let i={},r=e[eG.fW],s=!1;for(let n in e.transitions){let o=r[n],a=o&&o.type;("number"===a||"color"===a||"array"===a)&&eW(e[n],t[n],o)&&(i[n]=!0,s=!0)}return!!s&&i}(e,t)}),projectionChanged:!(0,ts.vk)(e.coordinateSystem,t.coordinateSystem)};if(n.updateTriggersChanged)for(let e in n.updateTriggersChanged)n.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(n.transitionsChanged)for(let i in n.transitionsChanged)this.internalState.uniformTransitions.add(i,t[i],e[i],e.transitions?.[i]);return this.setChangeFlags(n)}validateProps(){!function(e){let t=e[eG.fW];for(let i in t){let r=t[i],{validate:s}=r;if(s&&!s(e[i],r))throw Error(`Invalid prop ${i}: ${e[i]}`)}}(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:i}=this.props;e.picked&&"function"==typeof i&&(t.highlightColor=i(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new eR(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:i,oldProps:r}=e,s=this.state.model;s?.isInstanced&&s.setInstanceCount(this.getNumInstances());let{autoHighlight:n,highlightedObjectIndex:o,highlightColor:a}=i;if(t||r.autoHighlight!==n||r.highlightedObjectIndex!==o||r.highlightColor!==a){let e={};Array.isArray(a)&&(e.highlightColor=a),(t||r.autoHighlight!==n||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t=this.internalState.needsRedraw&&this.id;let i=this.getAttributeManager(),r=!!i&&i.getNeedsRedraw(e);if(t=t||r)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}}tv.defaultProps=tm,tv.layerName="Layer";let ty=tv;function t_(e){let t=[e[0],e[1],e[2]??0];this.props.modelMatrix&&(0,eX.Z0)(t,t,this.props.modelMatrix);for(let e=0;e<3;e++)t[e]+=this.props.coordinateOrigin[e];return this.internalState.preproject(t)}},25359(e,t,i){i.d(t,{A:()=>n});var r=i(90635);class s extends r.K{}s.defaultProps={...r.K.defaultProps,enforceMatchingVectorLengths:!1};let n=s},57265(e,t,i){i.d(t,{S:()=>n});var r=i(67619),s=i(8100);function n(e,t,i=!1){let o=i&&(0,r._)(e.data)?e.data:null,a={};for(let[i,r]of Object.entries(t)){if(!1===r.prop)continue;let t=e[i];if(null!=t){a[i]=t;continue}if(!r.semantic)continue;let n=o?.getChild(i);if(n){try{let e=(0,s.H)(n.type,{semantic:"vector"===r.semantic?"numeric":r.semantic});if("vector"===r.semantic&&r.size&&e!==(1===r.size?"float32":`float32x${r.size}`))continue}catch{continue}a[i]=n}}return a}},2825(e,t,i){i.d(t,{VD:()=>r,YN:()=>l,fW:()=>n,jA:()=>a,r3:()=>s,uH:()=>o,vf:()=>c});let r={NO_STATE:"Awaiting state",MATCHED:"Matched. State transferred from previous layer",INITIALIZED:"Initialized",AWAITING_GC:"Discarded. Awaiting garbage collection",AWAITING_FINALIZATION:"No longer matched. Awaiting garbage collection",FINALIZED:"Finalized! Awaiting garbage collection"},s=Symbol.for("component"),n=Symbol.for("propTypes"),o=Symbol.for("deprecatedProps"),a=Symbol.for("asyncPropDefaults"),l=Symbol.for("asyncPropOriginal"),c=Symbol.for("asyncPropResolved")},87983(e,t,i){i.d(t,{A:()=>r});let r={name:"color",dependencies:[],source:`

@must_use
fn deckgl_premultiplied_alpha(fragColor: vec4<f32>) -> vec4<f32> {
    return vec4(fragColor.rgb * fragColor.a, fragColor.a); 
};
`,getUniforms:e=>({})}},42081(e,t,i){i.d(t,{A:()=>s});let r="#define SMOOTH_EDGE_RADIUS 0.5",s={name:"geometry",source:`\
const SMOOTH_EDGE_RADIUS: f32 = 0.5;

struct VertexGeometry {
  position: vec4<f32>,
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry_: VertexGeometry = VertexGeometry(
  vec4<f32>(0.0, 0.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0)
);

struct FragmentGeometry {
  uv: vec2<f32>,
};

var<private> fragmentGeometry: FragmentGeometry;

fn smoothedge(edge: f32, x: f32) -> f32 {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,vs:`\
${r}

struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
  vec3 pickingColor;
} geometry = VertexGeometry(
  vec4(0.0, 0.0, 1.0, 0.0),
  vec3(0.0),
  vec3(0.0),
  vec3(0.0),
  vec2(0.0),
  vec3(0.0)
);
`,fs:`\
${r}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`}},84047(e,t,i){i.d(t,{Ay:()=>f,Z1:()=>n,lT:()=>p,uz:()=>o});var r=i(94256),s=i(2555);let n=0xffffff;function o(e,t){10===e.length?s.A.warn("pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers")():e.push(t)}let a=`\
  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function l(e){return e.replace("  vec4 highlightColor;\n} picking;",`  vec4 highlightColor;
${a}} picking;`)}function c(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}let h=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${n}.0) {
    return vec3(0.0);
  }

  for (int i = 0; i < 10; i++) {
    if (float(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    vec4 disabledIndices = i < 4
      ? picking.disabledPickingIndices0
      : (i < 8 ? picking.disabledPickingIndices1 : picking.disabledPickingIndices2);
    float disabledIndex = disabledIndices[i - (i / 4) * 4];
    if (disabledIndex == objectIndex) {
      return vec3(0.0);
    }
  }

  float encodedIndex = objectIndex + 1.0;
  return vec3(
    mod(encodedIndex, 256.0),
    mod(floor(encodedIndex / 256.0), 256.0),
    mod(floor(encodedIndex / 65536.0), 256.0)
  );
}

vec3 picking_getPickingColorFromIndex(uint objectIndex) {
  return picking_getPickingColorFromIndex(float(objectIndex));
}

vec3 picking_getPickingColorFromInstanceID() {
  return picking_getPickingColorFromIndex(float(gl_InstanceID));
}

void picking_setPickingColorFromInstanceID() {
  picking_setPickingColor(picking_getPickingColorFromInstanceID());
}
`,u=`\
struct pickingUniforms {
  isActive: f32,
  isAttribute: f32,
  isHighlightActive: f32,
  useByteColors: f32,
  highlightedObjectColor: vec3<f32>,
  highlightColor: vec4<f32>,
  disabledPickingIndexCount: f32,
  disabledPickingIndices0: vec4<f32>,
  disabledPickingIndices1: vec4<f32>,
  disabledPickingIndices2: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> picking: pickingUniforms;

fn picking_normalizeColor(color: vec3<f32>) -> vec3<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_normalizeColor4(color: vec4<f32>) -> vec4<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_isColorZero(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) < 0.00001;
}

fn picking_isColorValid(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) > 0.00001;
}

fn picking_getPickingColorFromIndex(objectIndex: u32) -> vec3<f32> {
  if (objectIndex >= ${n}u) {
    return vec3<f32>(0.0);
  }

  for (var i = 0; i < 10; i = i + 1) {
    if (f32(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    let disabledIndices = select(
      picking.disabledPickingIndices2,
      select(picking.disabledPickingIndices1, picking.disabledPickingIndices0, i < 4),
      i < 8
    );
    let disabledIndex = disabledIndices[i % 4];
    if (disabledIndex == f32(objectIndex)) {
      return vec3<f32>(0.0);
    }
  }

  let encodedIndex = objectIndex + 1u;
  return vec3<f32>(
    f32(encodedIndex % 256u),
    f32((encodedIndex / 256u) % 256u),
    f32((encodedIndex / 65536u) % 256u)
  ) / 255.0;
}
`,d={...r.q,vs:`${l(r.q.vs)}
${h}`,fs:l(r.q.fs),source:u,uniformTypes:{...r.q.uniformTypes,disabledPickingIndexCount:"f32",disabledPickingIndices0:"vec4<f32>",disabledPickingIndices1:"vec4<f32>",disabledPickingIndices2:"vec4<f32>"},defaultUniforms:{...r.q.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let i=r.q.getUniforms(e,t),s=e.disabledPickingIndices||[];return i.disabledPickingIndexCount=s.length,i.disabledPickingIndices0=c(s,0),i.disabledPickingIndices1=c(s,4),i.disabledPickingIndices2=c(s,8),i}},f=d,p={name:"picking",module:d,injections:[{stage:"vertex",target:"DECKGL_FILTER_GL_POSITION",glsl:`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `},{stage:"vertex",target:"DECKGL_FILTER_COLOR",glsl:`
  picking_setPickingColor(geometry.pickingColor);
  `},{stage:"fragment",target:"DECKGL_FILTER_COLOR",order:99,glsl:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}]}},82811(e,t,i){i.d(t,{K:()=>s,r:()=>r});let r={IDENTITY:0,GEODETIC:1,PROJECTED:2,GEOCENTRIC:3},s={IDENTITY:0,WEB_MERCATOR:1,GLOBE:2,CUSTOM_GEOSPATIAL:3,WEB_MERCATOR_AUTO_OFFSET:4,METER_OFFSETS:5,GLOBE_METER_OFFSETS:6,GEODETIC_OFFSETS:7}},90577(e,t,i){i.d(t,{eN:()=>n,ic:()=>o});var r=i(36411),s=i(82811);function n(e,t,i){if(!t)return!0;switch(e){case s.K.CUSTOM_GEOSPATIAL:return t.signature===i?.signature;case s.K.WEB_MERCATOR:case s.K.WEB_MERCATOR_AUTO_OFFSET:case s.K.GLOBE:case s.K.IDENTITY:return"WGS84"===t.signature;default:return!1}}function o(e,t,i=function(e,t){if(e??(e="default"),"string"!=typeof e&&"object"!=typeof e)throw Error(`Invalid coordinateSystem: ${e}`);let i=e;if("default"===e&&(i=t.isGeospatial?"WGS84":"cartesian"),i===t.crs?.signature)return t.crs;let s=(0,r.rs)(i);if(s instanceof Promise)throw Error(`Coordinate system not loaded: ${e}`);return s}(e,t)){switch(e){case"cartesian":case"meter-offsets":return{coordinateSystem:e,preprojected:!1}}let a=!n(t.projectionMode,i,t.crs);if(a)if(t.projectionMode===s.K.CUSTOM_GEOSPATIAL)return{coordinateSystem:"cartesian",preprojected:a};else return{coordinateSystem:"lnglat",preprojected:a};switch(e){case"default":return{coordinateSystem:i?"lnglat":"cartesian",preprojected:a};case"lnglat-offsets":return{coordinateSystem:e,preprojected:a}}return i?.signature==="WGS84"?{coordinateSystem:"lnglat",preprojected:a}:{coordinateSystem:"cartesian",preprojected:a}}},91253(e,t,i){i.d(t,{A:()=>_});var r=i(5652),s=i(8994),n=i(42081),o=i(40870),a=i(62510),l=i(82811);let c=Object.entries(l.r).map(([e,t])=>`const COORDINATE_SYSTEM_${e}: i32 = ${t};`).join(""),h=Object.keys(l.K).map(e=>`const PROJECTION_MODE_${e}: i32 = ${l.K[e]};`).join(""),u=Object.keys(a.p5).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${a.p5[e]};`).join(""),d=`\
${c}
${h}
${u}

const TILE_SIZE: f32 = 512.0;
const PI: f32 = 3.1415926536;
const WORLD_SCALE: f32 = TILE_SIZE / (PI * 2.0);
const ZERO_64_LOW: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
const EARTH_RADIUS: f32 = 6370972.0; // meters
const GLOBE_RADIUS: f32 = 256.0;

// -----------------------------------------------------------------------------
// Uniform block (converted from GLSL uniform block)
// -----------------------------------------------------------------------------
struct ProjectUniforms {
  wrapLongitude: i32,
  coordinateFrame: i32,
  commonUnitsPerMeter: vec3<f32>,
  projectionMode: i32,
  scale: f32,
  commonUnitsPerWorldUnit: vec3<f32>,
  commonUnitsPerWorldUnit2: vec3<f32>,
  center: vec4<f32>,
  modelMatrix: mat4x4<f32>,
  viewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  devicePixelRatio: f32,
  focalDistance: f32,
  cameraPosition: vec3<f32>,
  coordinateOrigin: vec3<f32>,
  commonOrigin: vec3<f32>,
  pseudoMeters: i32,
  sizeScaleSize: i32,
  sizeScaleTransform: vec4<f32>,
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

#ifdef USE_EXTERNAL_PROJECTION
@group(0) @binding(auto)
var<storage, read> project_sizeScaleBuffer: array<vec4<f32>>;
#endif

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

alias Geometry = VertexGeometry;
var<private> geometry: Geometry;
`,f=`\
${d}

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

// Returns an adjustment factor for commonUnitsPerMeter
fn _project_size_at_latitude(lat: f32) -> f32 {
  let y = clamp(lat, -89.9, 89.9);
  return 1.0 / cos(radians(y));
}

// Overloaded version: scales a value in meters at a given latitude.
fn _project_size_at_latitude_m(meters: f32, lat: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * _project_size_at_latitude(lat);
}

// Computes a non-linear scale factor based on geometry.
// (Note: This function relies on "geometry" being provided.)
fn project_size() -> f32 {
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
      project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC &&
      project.pseudoMeters == 0) {
    if (geometry.position.w == 0.0) {
      return _project_size_at_latitude(geometry.worldPosition.y);
    }
    let y: f32 = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
    let y2 = y * y;
    let y4 = y2 * y2;
    let y6 = y4 * y2;
    return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
  }
  return 1.0;
}

#ifdef USE_EXTERNAL_PROJECTION
// Nearest-record Taylor reconstruction: x=scalar XY scale, yz=slopes per sampler
// unit, w=Z scale. x=0 marks invalid samples. One load preserves instance aspect ratio.
// Alternatives if discontinuities/accuracy become visible: blend four local Taylor
// estimates for continuity, or use four-fetch bicubic Hermite with a mixed derivative
// for higher accuracy (which would require moving Z scale out of w).
fn project_external_size_scale_at(mapPosition: vec2<f32>) -> vec3<f32> {
  if (project.sizeScaleSize <= 0) { return project.commonUnitsPerMeter; }
  let samplePosition = mapPosition * project.sizeScaleTransform.xy + project.sizeScaleTransform.zw;
  if (any(samplePosition < vec2<f32>(0.0)) || any(samplePosition > vec2<f32>(512.0))) {
    return project.commonUnitsPerMeter;
  }
  let dimensions = vec2<i32>(project.sizeScaleSize);
  let index = clamp(vec2<i32>(floor(samplePosition / 512.0 * vec2<f32>(dimensions))),
    vec2<i32>(0), dimensions - 1);
  let record = project_sizeScaleBuffer[u32(index.y * project.sizeScaleSize + index.x)];
  if (record.x <= 0.0) { return project.commonUnitsPerMeter; }
  let center = (vec2<f32>(index) + 0.5) * 512.0 / vec2<f32>(dimensions);
  var scale = record.x + dot(record.yz, samplePosition - center);
  // This bound rejects non-finite reconstructions without WGSL classification builtins.
  if (!(scale > 0.0 && scale <= 3.4028234663852886e38)) { scale = record.x; }
  return vec3<f32>(scale, scale, record.w * scale / record.x) * project.commonUnitsPerWorldUnit;
}

fn project_external_size_scale() -> vec3<f32> {
  return project_external_size_scale_at(select((project.modelMatrix * vec4<f32>(geometry.worldPosition, 1.0)).xy + project.commonOrigin.xy / project.commonUnitsPerWorldUnit.xy - project.coordinateOrigin.xy,
    (geometry.position.xy + project.commonOrigin.xy) / project.commonUnitsPerWorldUnit.xy, geometry.position.w != 0.0));
}

#endif

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale().z; }
#endif
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale().xy; }
#endif
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale(); }
#endif
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) {
    return vec4<f32>(meters.xyz * project_external_size_scale(), meters.w);
  }
#endif
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z\u{2011}axis with the given up vector.
// On the globe, ux points east and uy north. Longitude 0 lies on -y and the north pole on +z.
// At a pole, ux is the limit of east along the longitude that up retains; it is +x only when up
// lies exactly on the polar axis.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  // Tangent on XY plane
  let horizontalLength = length(uz.xy);
  var ux = vec3<f32>(1.0, 0.0, 0.0);
  if (horizontalLength > 0.0) {
    ux = vec3<f32>(-uz.y, uz.x, 0.0) / horizontalLength;
  }
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return RotationResult(true, project_get_orientation_matrix(commonPosition));
  } else {
    return RotationResult(false, mat3x3<f32>());  // identity alternative if needed
  };
}

// Projects a normal vector from the current coordinate system to world space.
fn project_normal(vector: vec3<f32>) -> vec3<f32> {
  let normal_modelspace = project.modelMatrix * vec4<f32>(vector, 0.0);
  var n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
  let rotResult = project_needs_rotation(geometry.position.xyz);
  if (rotResult.needsRotation) {
    n = rotResult.transform * n;
  }
  return n;
}

// Applies a scale offset based on y-offset (dy)
fn project_offset_(offset: vec4<f32>) -> vec4<f32> {
  let dy: f32 = offset.y;
  let commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
  return vec4<f32>(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}

// Projects lng/lat coordinates to a unit tile [0,1]
fn project_mercator_(lnglat: vec2<f32>) -> vec2<f32> {
  var x = lnglat.x;
  if (project.wrapLongitude != 0) {
    x = ((x + 180.0) % 360.0) - 180.0;
  }
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// Projects lng/lat/z coordinates for a globe projection.
fn project_globe_(lnglatz: vec3<f32>) -> vec3<f32> {
  let lambda = radians(lnglatz.x);
  let phi = radians(lnglatz.y);
  // Preserve longitude at the poles despite GPU cosine rounding to zero or negative.
  var cosPhi = cos(phi);
  if (abs(lnglatz.y) == 90.0) { cosPhi = max(abs(cosPhi), 1e-7); }
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Mercator y of project_mercator_'s latitude clamp: log(tan(PI / 4 + radians(89.9) / 2))
const MAX_MERCATOR_Y: f32 = 7.0439589847;

// Inverse of project_globe_ followed by project_mercator_, without forming lat/lng:
// Mercator y = atanh(sin(lat)) = log((D + |z|) / |xy|), which stays accurate near the poles
fn project_globe_to_mercator_(spherePos: vec3<f32>) -> vec2<f32> {
  let D = length(spherePos);
  let h = max(length(spherePos.xy), 1e-20);
  let y = sign(spherePos.z) * min(log((D + abs(spherePos.z)) / h), MAX_MERCATOR_Y);
  let x = atan2(spherePos.x, -spherePos.y);
  return (vec2<f32>(x, y) + PI) * WORLD_SCALE;
}

// Flat common space (Mercator or cartesian) of a common position; identity except under GLOBE.
// WGSL has no function overloading: pass position.xyz for a vec4. See project.glsl.ts.
fn project_common_position_to_flat(commonPosition: vec3<f32>) -> vec2<f32> {
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return project_globe_to_mercator_(commonPosition);
  }
  return commonPosition.xy;
}

// World copy of a flat x nearest to referenceX
fn project_wrap_flat_x_(x: f32, referenceX: f32) -> f32 {
  return x - TILE_SIZE * floor((x - referenceX) / TILE_SIZE + 0.5);
}

// Flat position in the world copy nearest to referenceX (e.g. a bounds centre); geospatial only
fn project_common_position_to_flat_wrapped(commonPosition: vec3<f32>, referenceX: f32) -> vec2<f32> {
  var flatPosition = project_common_position_to_flat(commonPosition);
  if (project.projectionMode != PROJECTION_MODE_IDENTITY) {
    flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
  }
  return flatPosition;
}

// Flat position continuous across the antimeridian under GLOBE (seam moved opposite referenceX,
// e.g. the camera); identity for flat modes. For periodic patterns.
fn project_common_position_to_flat_continuous(commonPosition: vec3<f32>, referenceX: f32) -> vec2<f32> {
  var flatPosition = project_common_position_to_flat(commonPosition);
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
  }
  return flatPosition;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEOCENTRIC) {
      // Globe-centered Cartesian XYZ are meters, not longitude/latitude.
      let position_low = project.modelMatrix * vec4<f32>(position64Low, 0.0);
      return vec4<f32>(
        position_world.xyz * project.commonUnitsPerMeter + position_low.xyz * project.commonUnitsPerMeter,
        position_world.w
      );
    }
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let offsetCommon = (enuMatrix * position_world.xyz) * project.commonUnitsPerMeter;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
      if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
        return vec4<f32>(
          project_mercator_(position_world.xy) - project.commonOrigin.xy,
          project_size_float(position_world.z),
          position_world.w
        );
      }
    }
  }
  if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
      project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC ||
        project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED))) {
    position_world = vec4f(position_world.xyz - project.coordinateOrigin, position_world.w);
  }

  return project_offset_(position_world) +
         project_offset_(project.modelMatrix * vec4<f32>(position64Low, 0.0));
}

// Overloaded versions for different input types.
fn project_position_vec4_f32(position: vec4<f32>) -> vec4<f32> {
  return project_position_vec4_f64(position, ZERO_64_LOW);
}

fn project_position_vec3_f64(position: vec3<f32>, position64Low: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), position64Low);
  return projected_position.xyz;
}

fn project_position_vec3_f32(position: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), ZERO_64_LOW);
  return projected_position.xyz;
}

fn project_position_vec2_f32(position: vec2<f32>) -> vec2<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 0.0, 1.0), ZERO_64_LOW);
  return projected_position.xy;
}

// Transforms a common space position to clip space.
fn project_common_position_to_clipspace_with_projection(position: vec4<f32>, viewProjectionMatrix: mat4x4<f32>, center: vec4<f32>) -> vec4<f32> {
  var clipPosition = viewProjectionMatrix * position + center;
  // deck.gl projection matrices use WebGL's [-w, w] depth range; WebGPU clips z to [0, w].
  clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
  return clipPosition;
}

// Uses the project viewProjectionMatrix and center.
fn project_common_position_to_clipspace(position: vec4<f32>) -> vec4<f32> {
  return project_common_position_to_clipspace_with_projection(position, project.viewProjectionMatrix, project.center);
}

// Returns a clip space offset corresponding to a given number of screen pixels.
fn project_pixel_size_to_clipspace(pixels: vec2<f32>) -> vec2<f32> {
  let offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
  return offset * project.focalDistance;
}

fn project_meter_size_to_pixel(meters: f32) -> f32 {
  return project_size_float(meters) * project.scale;
}

fn project_unit_size_to_pixel(size: f32, unit: i32) -> f32 {
  if (unit == UNIT_METERS) {
    return project_meter_size_to_pixel(size);
  } else if (unit == UNIT_COMMON) {
    return size * project.scale;
  }
  // UNIT_PIXELS: no scaling applied.
  return size;
}

fn project_pixel_size_float(pixels: f32) -> f32 {
  return pixels / project.scale;
}

fn project_pixel_size_vec2(pixels: vec2<f32>) -> vec2<f32> {
  return pixels / project.scale;
}

// True when the globe hides commonPosition from the camera: the segment from the camera to the
// position passes through the sphere. Exact at any altitude. Always false for flat projections.
fn project_globe_is_occluded(commonPosition: vec3<f32>) -> bool {
  if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return false;
  }
  let eye = project.cameraPosition;
  let ray = commonPosition - eye;
  let rayLength2 = dot(ray, ray);
  if (rayLength2 == 0.0) {
    return false;
  }
  let t = clamp(-dot(eye, ray) / rayLength2, 0.0, 1.0);
  let closest = eye + ray * t;
  return t < 1.0 && dot(closest, closest) < GLOBE_RADIUS * GLOBE_RADIUS;
}

// Distance from eye along the unit direction to the first globe surface point, or fallback
fn project_globe_ray_distance_(eye: vec3<f32>, direction: vec3<f32>, fallback: f32) -> f32 {
  let b = dot(eye, direction);
  let discriminant = b * b - dot(eye, eye) + GLOBE_RADIUS * GLOBE_RADIUS;
  if (discriminant < 0.0) {
    return fallback;
  }
  let distance = -b - sqrt(discriminant);
  return select(fallback, distance, distance > 0.0);
}

// Screen-space radius, in pixels, that a billboard is assumed to cover around its anchor
const GLOBE_BILLBOARD_FOOTPRINT_PIXELS: f32 = 64.0;

// Clip-space position for a billboard anchored at commonPosition. Under GLOBE the billboard is
// moved toward the camera by the amount the globe surface rises within its footprint, so the
// curve of the globe does not clip a sprite whose anchor is visible. The shift is zero where the
// surface faces the camera and grows with the grazing angle, about 1.8 km at zoom 12 with pitch
// 60, so other 3D geometry that is in front of the anchor by less than the shift no longer hides
// the sprite. Pair with project_globe_is_occluded. Identity for flat projections.
fn project_globe_billboard_clipspace(clipPosition: vec4<f32>, commonPosition: vec3<f32>) -> vec4<f32> {
  if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return clipPosition;
  }
  let eye = project.cameraPosition;
  let ray = commonPosition - eye;
  let anchorDistance = length(ray);
  if (anchorDistance == 0.0) {
    return clipPosition;
  }
  let direction = ray / anchorDistance;
  // On screen, the surface is nearest toward the point of the globe below the camera
  let inward = -eye - dot(-eye, direction) * direction;
  let inwardLength = length(inward);
  if (inwardLength == 0.0) {
    return clipPosition;
  }
  // Ray through the inward edge of the footprint
  let footprint = project_pixel_size_float(GLOBE_BILLBOARD_FOOTPRINT_PIXELS);
  let edgeDirection = normalize(ray + inward / inwardLength * footprint);
  let surfaceDistance = project_globe_ray_distance_(eye, direction, anchorDistance);
  let edgeDistance = project_globe_ray_distance_(eye, edgeDirection, surfaceDistance);
  let shift = surfaceDistance - edgeDistance;
  if (shift <= 0.0) {
    return clipPosition;
  }
  let shiftedClip = project_common_position_to_clipspace(vec4<f32>(commonPosition - direction * shift, 1.0));
  return vec4<f32>(clipPosition.xy, shiftedClip.z / shiftedClip.w * clipPosition.w, clipPosition.w);
}
`,p=Object.entries(l.r).map(([e,t])=>`const int COORDINATE_SYSTEM_${e} = ${t};`).join(""),g=Object.keys(l.K).map(e=>`const int PROJECTION_MODE_${e} = ${l.K[e]};`).join(""),m=Object.keys(a.p5).map(e=>`const int UNIT_${e.toUpperCase()} = ${a.p5[e]};`).join(""),v=`\
${p}
${g}
${m}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateFrame;
vec3 commonUnitsPerMeter;
int projectionMode;
float scale;
vec3 commonUnitsPerWorldUnit;
vec3 commonUnitsPerWorldUnit2;
vec4 center;
mat4 modelMatrix;
mat4 viewProjectionMatrix;
vec2 viewportSize;
float devicePixelRatio;
float focalDistance;
vec3 cameraPosition;
vec3 coordinateOrigin;
vec3 commonOrigin;
bool pseudoMeters;
int sizeScaleSize;
vec4 sizeScaleTransform;
} project;
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / (PI * 2.0);
const vec3 ZERO_64_LOW = vec3(0.0);
const float EARTH_RADIUS = 6370972.0;
const float GLOBE_RADIUS = 256.0;
float project_size_at_latitude(float lat) {
float y = clamp(lat, -89.9, 89.9);
return 1.0 / cos(radians(y));
}
float project_size() {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC &&
project.pseudoMeters == false) {
if (geometry.position.w == 0.0) {
return project_size_at_latitude(geometry.worldPosition.y);
}
float y = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
float y2 = y * y;
float y4 = y2 * y2;
float y6 = y4 * y2;
return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
}
return 1.0;
}
#ifdef USE_EXTERNAL_PROJECTION
uniform highp usampler2D project_sizeScaleTexture;
vec3 project_external_size_scale_at(vec2 mapPosition) {
if (project.sizeScaleSize <= 0) return project.commonUnitsPerMeter;
vec2 samplePosition = mapPosition * project.sizeScaleTransform.xy + project.sizeScaleTransform.zw;
if (any(lessThan(samplePosition, vec2(0.0))) || any(greaterThan(samplePosition, vec2(512.0)))) return project.commonUnitsPerMeter;
ivec2 dimensions = textureSize(project_sizeScaleTexture, 0);
ivec2 index = clamp(ivec2(floor(samplePosition / 512.0 * vec2(dimensions))), ivec2(0), dimensions - 1);
vec4 texel = uintBitsToFloat(texelFetch(project_sizeScaleTexture, index, 0));
if (texel.r <= 0.0) return project.commonUnitsPerMeter;
vec2 center = (vec2(index) + 0.5) * 512.0 / vec2(dimensions);
float scale = texel.r + dot(texel.gb, samplePosition - center);
if (!(scale > 0.0) || isinf(scale) || isnan(scale)) scale = texel.r;
return vec3(scale, scale, texel.a * scale / texel.r) * project.commonUnitsPerWorldUnit;
}
vec3 project_external_size_scale() {
return project_external_size_scale_at(geometry.position.w == 0.0
? (project.modelMatrix * vec4(geometry.worldPosition, 1.0)).xy + project.commonOrigin.xy / project.commonUnitsPerWorldUnit.xy - project.coordinateOrigin.xy : (geometry.position.xy + project.commonOrigin.xy) / project.commonUnitsPerWorldUnit.xy);
}
#endif
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale().z;
#endif
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale().xy;
#endif
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale();
#endif
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return vec4(meters.xyz * project_external_size_scale(), meters.w);
#endif
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
float horizontalLength = length(uz.xy);
vec3 ux = horizontalLength > 0.0 ? vec3(-uz.y, uz.x, 0.0) / horizontalLength : vec3(1.0, 0.0, 0.0);
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
transform = project_get_orientation_matrix(commonPosition);
return true;
}
return false;
}
vec3 project_normal(vec3 vector) {
vec4 normal_modelspace = project.modelMatrix * vec4(vector, 0.0);
vec3 n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
mat3 rotation;
if (project_needs_rotation(geometry.position.xyz, rotation)) {
n = rotation * n;
}
return n;
}
vec4 project_offset_(vec4 offset) {
float dy = offset.y;
vec3 commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
return vec4(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}
vec2 project_mercator_(vec2 lnglat) {
float x = lnglat.x;
if (project.wrapLongitude) {
x = mod(x + 180., 360.0) - 180.;
}
float y = clamp(lnglat.y, -89.9, 89.9);
return vec2(
radians(x) + PI,
PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
) * WORLD_SCALE;
}
vec3 project_globe_(vec3 lnglatz) {
float lambda = radians(lnglatz.x);
float phi = radians(lnglatz.y);
float cosPhi = cos(phi);
if (abs(lnglatz.y) == 90.0) cosPhi = max(abs(cosPhi), 1e-7);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
const float MAX_MERCATOR_Y = 7.0439589847;
vec2 project_globe_to_mercator_(vec3 spherePos) {
float D = length(spherePos);
float h = max(length(spherePos.xy), 1e-20);
float y = sign(spherePos.z) * min(log((D + abs(spherePos.z)) / h), MAX_MERCATOR_Y);
float x = atan(spherePos.x, -spherePos.y);
return (vec2(x, y) + PI) * WORLD_SCALE;
}
vec2 project_common_position_to_flat(vec3 commonPosition) {
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return project_globe_to_mercator_(commonPosition);
}
return commonPosition.xy;
}
vec2 project_common_position_to_flat(vec4 commonPosition) {
return project_common_position_to_flat(commonPosition.xyz);
}
float project_wrap_flat_x_(float x, float referenceX) {
return x - TILE_SIZE * floor((x - referenceX) / TILE_SIZE + 0.5);
}
vec2 project_common_position_to_flat_wrapped(vec3 commonPosition, float referenceX) {
vec2 flatPosition = project_common_position_to_flat(commonPosition);
if (project.projectionMode != PROJECTION_MODE_IDENTITY) {
flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
}
return flatPosition;
}
vec2 project_common_position_to_flat_wrapped(vec4 commonPosition, float referenceX) {
return project_common_position_to_flat_wrapped(commonPosition.xyz, referenceX);
}
vec2 project_common_position_to_flat_continuous(vec3 commonPosition, float referenceX) {
vec2 flatPosition = project_common_position_to_flat(commonPosition);
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
}
return flatPosition;
}
vec2 project_common_position_to_flat_continuous(vec4 commonPosition, float referenceX) {
return project_common_position_to_flat_continuous(commonPosition.xyz, referenceX);
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED) {
position_world.xyz += project.coordinateOrigin;
}
}
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEOCENTRIC) {
vec4 position_low = project.modelMatrix * vec4(position64Low, 0.0);
return vec4(
position_world.xyz * project.commonUnitsPerMeter + position_low.xyz * project.commonUnitsPerMeter,
position_world.w
);
}
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
vec3 offsetCommon = (enuMatrix * position_world.xyz) * project.commonUnitsPerMeter;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
return vec4(
project_mercator_(position_world.xy) - project.commonOrigin.xy,
project_size(position_world.z),
position_world.w
);
}
}
}
if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC ||
project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED))) {
position_world.xyz -= project.coordinateOrigin;
}
return project_offset_(position_world) + project_offset_(project.modelMatrix * vec4(position64Low, 0.0));
}
vec4 project_position(vec4 position) {
return project_position(position, ZERO_64_LOW);
}
vec3 project_position(vec3 position, vec3 position64Low) {
vec4 projected_position = project_position(vec4(position, 1.0), position64Low);
return projected_position.xyz;
}
vec3 project_position(vec3 position) {
vec4 projected_position = project_position(vec4(position, 1.0), ZERO_64_LOW);
return projected_position.xyz;
}
vec2 project_position(vec2 position) {
vec4 projected_position = project_position(vec4(position, 0.0, 1.0), ZERO_64_LOW);
return projected_position.xy;
}
vec4 project_common_position_to_clipspace(vec4 position, mat4 viewProjectionMatrix, vec4 center) {
return viewProjectionMatrix * position + center;
}
vec4 project_common_position_to_clipspace(vec4 position) {
return project_common_position_to_clipspace(position, project.viewProjectionMatrix, project.center);
}
vec2 project_pixel_size_to_clipspace(vec2 pixels) {
vec2 offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
return offset * project.focalDistance;
}
float project_size_to_pixel(float meters) {
return project_size(meters) * project.scale;
}
vec2 project_size_to_pixel(vec2 meters) {
return project_size(meters) * project.scale;
}
float project_size_to_pixel(float size, int unit) {
if (unit == UNIT_METERS) return project_size_to_pixel(size);
if (unit == UNIT_COMMON) return size * project.scale;
return size;
}
float project_pixel_size(float pixels) {
return pixels / project.scale;
}
vec2 project_pixel_size(vec2 pixels) {
return pixels / project.scale;
}
bool project_globe_is_occluded(vec3 commonPosition) {
if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return false;
}
vec3 eye = project.cameraPosition;
vec3 ray = commonPosition - eye;
float rayLength2 = dot(ray, ray);
if (rayLength2 == 0.0) {
return false;
}
float t = clamp(-dot(eye, ray) / rayLength2, 0.0, 1.0);
vec3 closest = eye + ray * t;
return t < 1.0 && dot(closest, closest) < GLOBE_RADIUS * GLOBE_RADIUS;
}
float project_globe_ray_distance_(vec3 eye, vec3 direction, float fallback) {
float b = dot(eye, direction);
float discriminant = b * b - dot(eye, eye) + GLOBE_RADIUS * GLOBE_RADIUS;
if (discriminant < 0.0) {
return fallback;
}
float distance = -b - sqrt(discriminant);
return distance > 0.0 ? distance : fallback;
}
#define GLOBE_BILLBOARD_FOOTPRINT_PIXELS 64.0
vec4 project_globe_billboard_clipspace(vec4 clipPosition, vec3 commonPosition) {
if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return clipPosition;
}
vec3 eye = project.cameraPosition;
vec3 ray = commonPosition - eye;
float anchorDistance = length(ray);
if (anchorDistance == 0.0) {
return clipPosition;
}
vec3 direction = ray / anchorDistance;
vec3 inward = -eye - dot(-eye, direction) * direction;
float inwardLength = length(inward);
if (inwardLength == 0.0) {
return clipPosition;
}
float footprint = project_pixel_size(GLOBE_BILLBOARD_FOOTPRINT_PIXELS);
vec3 edgeDirection = normalize(ray + inward / inwardLength * footprint);
float surfaceDistance = project_globe_ray_distance_(eye, direction, anchorDistance);
float edgeDistance = project_globe_ray_distance_(eye, edgeDirection, surfaceDistance);
float shift = surfaceDistance - edgeDistance;
if (shift <= 0.0) {
return clipPosition;
}
vec4 shiftedClip = project_common_position_to_clipspace(vec4(commonPosition - direction * shift, 1.0));
clipPosition.z = shiftedClip.z / shiftedClip.w * clipPosition.w;
return clipPosition;
}
`,y={},_={name:"project",dependencies:[r.i,n.A],source:f,vs:v,getUniforms:function(e=y){return"viewport"in e?{...(0,o.aY)(e),sizeScaleTransform:e.sizeScaleTransform||e.viewport.sizeScaleTransform||[1,1,0,0],...e.sizeScale instanceof s.h?{project_sizeScaleBuffer:e.sizeScale,sizeScaleSize:Math.sqrt(e.sizeScale.byteLength/16)}:e.sizeScale?{project_sizeScaleTexture:e.sizeScale,sizeScaleSize:e.sizeScale.width}:{sizeScaleSize:0}}:{}},isCustomProjection:e=>e.projectionMode===l.K.CUSTOM_GEOSPATIAL,uniformTypes:{wrapLongitude:"f32",coordinateFrame:"i32",commonUnitsPerMeter:"vec3<f32>",projectionMode:"i32",scale:"f32",commonUnitsPerWorldUnit:"vec3<f32>",commonUnitsPerWorldUnit2:"vec3<f32>",center:"vec4<f32>",modelMatrix:"mat4x4<f32>",viewProjectionMatrix:"mat4x4<f32>",viewportSize:"vec2<f32>",devicePixelRatio:"f32",focalDistance:"f32",cameraPosition:"vec3<f32>",coordinateOrigin:"vec3<f32>",commonOrigin:"vec3<f32>",pseudoMeters:"f32",sizeScaleSize:"i32",sizeScaleTransform:"vec4<f32>"}}},40870(e,t,i){i.d(t,{aY:()=>p,ow:()=>f});var r=i(11066),s=i(83122),n=i(82811),o=i(90577),a=i(62585);let l=[0,0,0,0],c=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],h=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],u=[0,0,0],d=(0,a.A)(function({viewport:e,devicePixelRatio:t,coordinateSystem:i,coordinateOrigin:o}){let{projectionCenter:a,viewProjectionMatrix:u,originCommon:d,cameraPosCommon:p,shaderCoordinateOrigin:g,geospatialOrigin:m}=function(e,t,i){let{viewMatrixUncentered:n,projectionMatrix:o}=e,{viewMatrix:a,viewProjectionMatrix:h}=e,u=l,d=l,p=e.cameraPosition,{geospatialOrigin:g,shaderCoordinateOrigin:m,commonOrigin:v,offsetMode:y}=f(e,t,i);return y&&(d=v||e.projectPosition(g||m),p=[p[0]-d[0],p[1]-d[1],p[2]-d[2]],d[3]=1,u=s.Z0([],d,h),a=n||a,h=r.lw([],o,a),h=r.lw([],h,c)),{viewMatrix:a,viewProjectionMatrix:h,projectionCenter:u,originCommon:d,cameraPosCommon:p,shaderCoordinateOrigin:m,geospatialOrigin:g}}(e,i,o),v=e.getDistanceScales(),y=[e.width*t,e.height*t],_=s.Z0([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,b={coordinateFrame:function(e,t){switch(e){case"lnglat":case"lnglat-offsets":return n.r.GEODETIC;case"meter-offsets":return n.r.IDENTITY;case"cartesian":switch(t.crs?.coordinateFrame){case"geographic":return n.r.GEODETIC;case"geocentric":return n.r.GEOCENTRIC;case"projected":return n.r.PROJECTED;default:return n.r.IDENTITY}default:throw Error(`Invalid coordinateSystem: ${e}`)}}(i,e),projectionMode:function(e,t){switch(t){case"meter-offsets":switch(e){case n.K.GLOBE:return n.K.GLOBE_METER_OFFSETS;case n.K.WEB_MERCATOR:case n.K.WEB_MERCATOR_AUTO_OFFSET:case n.K.CUSTOM_GEOSPATIAL:return n.K.METER_OFFSETS}break;case"lnglat-offsets":switch(e){case n.K.WEB_MERCATOR:case n.K.WEB_MERCATOR_AUTO_OFFSET:return n.K.GEODETIC_OFFSETS}}return e}(e.projectionMode,i),coordinateOrigin:g,commonOrigin:d.slice(0,3),center:a,pseudoMeters:!!e._pseudoMeters,sizeScaleSize:1,sizeScaleTransform:[1,1,0,0],viewportSize:y,devicePixelRatio:t,focalDistance:_,commonUnitsPerMeter:v.unitsPerMeter,commonUnitsPerWorldUnit:v.unitsPerWorldUnit,commonUnitsPerWorldUnit2:v.unitsPerWorldUnit2,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:u,modelMatrix:h,cameraPosition:p};if(m){let t=e.projectionMode===n.K.CUSTOM_GEOSPATIAL?e.crs.converter.WGS84.from(m):m,r=e.getDistanceScales(t);switch(i){case"meter-offsets":b.commonUnitsPerWorldUnit=r.unitsPerMeter,b.commonUnitsPerWorldUnit2=r.unitsPerMeter2,e.projectionMode===n.K.CUSTOM_GEOSPATIAL&&(b.commonUnitsPerMeter=r.unitsPerMeter);break;case"lnglat":case"lnglat-offsets":e._pseudoMeters||(b.commonUnitsPerMeter=r.unitsPerMeter),b.commonUnitsPerWorldUnit=r.unitsPerWorldUnit,b.commonUnitsPerWorldUnit2=r.unitsPerWorldUnit2;break;case"cartesian":b.commonUnitsPerWorldUnit=[1,1,r.unitsPerMeter[2]],b.commonUnitsPerWorldUnit2=[0,0,r.unitsPerMeter2[2]]}}if(e.projectionMode===n.K.GLOBE&&"meter-offsets"===i){let e=o[0]*Math.PI/180,t=o[1]*Math.PI/180,i=Math.cos(t),r=((o[2]||0)/6370972+1)*256;b.commonOrigin=[Math.sin(e)*i*r,-Math.cos(e)*i*r,Math.sin(t)*r]}return b});function f(e,t,i=u,r){let s,a;i.length<3&&(i=[i[0],i[1],0]);let l=i,c=(0,o.ic)(t,e,r);t=c.coordinateSystem,c.preprojected&&(i=u);let h=!0;switch(t){case"lnglat-offsets":case"meter-offsets":a=i;break;default:a=e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null}switch(e.projectionMode){case n.K.WEB_MERCATOR:switch(t){case"lnglat":a=[0,0,0],h=!1;break;case"cartesian":h=!1,a=e.unprojectPosition([Math.fround(e.center[0]),Math.fround(e.center[1]),0])}break;case n.K.WEB_MERCATOR_AUTO_OFFSET:switch(t){case"lnglat":l=a;break;case"cartesian":l=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],a=e.unprojectPosition(l),l[0]-=i[0],l[1]-=i[1],l[2]-=i[2]}break;case n.K.IDENTITY:(l=e.position.map(Math.fround))[2]=l[2]||0;break;case n.K.CUSTOM_GEOSPATIAL:{if("meter-offsets"===t){l=u,s=e.projectPosition(i);break}a=null;let r=e.distanceScales.unitsPerWorldUnit;s=(l=e.center.map((e,t)=>Math.fround(e/r[t]-i[t]))).map((e,t)=>(e+i[t])*r[t]);break}case n.K.GLOBE:h=!1,a=null;break;default:h=!1}return{geospatialOrigin:a,shaderCoordinateOrigin:l,commonOrigin:s,offsetMode:h}}function p({viewport:e,devicePixelRatio:t=1,modelMatrix:i=null,coordinateSystem:r="default",coordinateOrigin:s=u,autoWrapLongitude:a=!1,sourceCrs:l}){let c=(0,o.ic)(r,e,l);if("lnglat-offsets"===(r=c.coordinateSystem)&&e.projectionMode===n.K.GLOBE&&(r="lnglat"),!c.preprojected&&"lnglat"===r&&s.some(e=>0!==e)){let e=Array.from(i||h);e[12]+=s[0],e[13]+=s[1],e[14]+=s[2]||0,i=e,s=u}c.preprojected&&(s=u,i=null,a=!1);let f=d({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:s});return f.wrapLongitude=a,f.modelMatrix=i||h,f}},53031(e,t,i){i.d(t,{A:()=>o});var r=i(91253);let s=`\
// Define a structure to hold both the clip-space position and the common position.
struct ProjectResult {
  clipPosition: vec4<f32>,
  commonPosition: vec4<f32>,
};

// This function mimics the GLSL version with the 'out' parameter by returning both values.
fn project_position_to_clipspace_and_commonspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> ProjectResult {
  // Compute the projected position.
  let projectedPosition: vec3<f32> = project_position_vec3_f64(position, position64Low);

  // Start with the provided offset.
  var finalOffset: vec3<f32> = offset;

  // Get whether a rotation is needed and the rotation matrix.
  let rotationResult = project_needs_rotation(projectedPosition);

  // If rotation is needed, update the offset.
  if (rotationResult.needsRotation) {
    finalOffset = rotationResult.transform * offset;
  }

  // Compute the common position.
  let commonPosition: vec4<f32> = vec4<f32>(projectedPosition + finalOffset, 1.0);

  // Convert to clip-space.
  let clipPosition: vec4<f32> = project_common_position_to_clipspace(commonPosition);

  return ProjectResult(clipPosition, commonPosition);
}

// A convenience overload that returns only the clip-space position.
fn project_position_to_clipspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> vec4<f32> {
  return project_position_to_clipspace_and_commonspace(position, position64Low, offset).clipPosition;
}
`,n=`\
vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset, out vec4 commonPosition
) {
  vec3 projectedPosition = project_position(position, position64Low);
  mat3 rotation;
  if (project_needs_rotation(projectedPosition, rotation)) {
    // offset is specified as ENU
    // when in globe projection, rotate offset so that the ground alighs with the surface of the globe
    offset = rotation * offset;
  }
  commonPosition = vec4(projectedPosition + offset, 1.0);
  return project_common_position_to_clipspace(commonPosition);
}

vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset
) {
  vec4 commonPosition;
  return project_position_to_clipspace(position, position64Low, offset, commonPosition);
}
`,o={name:"project32",dependencies:[r.A],source:s,vs:n}},3005(e,t,i){i.d(t,{A:()=>a});var r=i(48115),s=i(49105);let n=["longitude","latitude","zoom","bearing","pitch"],o=["longitude","latitude","zoom"];class a extends r.A{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,i=Array.isArray(e)?{}:e;i.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:n,required:o},super(i.transitionProps),this.opts=i}initializeProps(e,t){let i=super.initializeProps(e,t),{makeViewport:r,around:s}=this.opts;if(r&&s){let n=r(e),o=r(t),a=n.unproject(s);i.start.around=s,Object.assign(i.end,{around:o.project(a),aroundPosition:a,width:t.width,height:t.height})}return i}interpolateProps(e,t,i){let r={};for(let n of this._propsToExtract)r[n]=(0,s.Cc)(e[n]||0,t[n]||0,i);if(t.aroundPosition&&this.opts.makeViewport){let n=this.opts.makeViewport({...t,...r});Object.assign(r,n.panByPosition(t.aroundPosition,(0,s.Cc)(e.around,t.around,i)))}return r}}},48115(e,t,i){i.d(t,{A:()=>n});var r=i(49105),s=i(18091);class n{constructor(e){let{compare:t,extract:i,required:r}=e;this._propsToCompare=t,this._propsToExtract=i||t,this._requiredProps=r}arePropsEqual(e,t){for(let i of this._propsToCompare)if(!(i in e)||!(i in t)||!(0,r.aI)(e[i],t[i]))return!1;return!0}initializeProps(e,t){let i={},r={};for(let s of this._propsToExtract)(s in e||s in t)&&(i[s]=e[s],r[s]=t[s]);return this._checkRequiredProps(i),this._checkRequiredProps(r),{start:i,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let i=e[t];(0,s.A)(Number.isFinite(i)||Array.isArray(i),`${t} is required for transition`)})}}},69309(e,t,i){i.d(t,{A:()=>r});class r{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1)}update(){if(!this._inProgress)return!1;if(null===this._handle){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}}},18091(e,t,i){i.d(t,{A:()=>r});function r(e,t){if(!e)throw Error(t||"deck.gl: assertion failed.")}},36411(e,t,i){i.d(t,{vk:()=>b,rs:()=>w,rz:()=>y});var r=i(35033),s=i(49105),n=i(73314),o=i(89043),a=i(48115),l=i(88967),c=i(98609);let h=Math.PI/180,u=[1,1,1],d={proj:"geocent",R:String(6370972),datum:"none"},f=c.S.create({semiMajorAxis:6370972,semiMinorAxis:6370972,eccentricitySquared:0,parameters:d});function p(e){return(t,i)=>{let r=e(Array.from(t));if(!i)return r;for(let e=0;e<r.length;e++)i[e]=r[e];return i}}let g={signature:"+proj=geocent +R=6370972 +datum=none",coordinateFrame:"geocentric",projection:"geocent",parameters:d,ellipsoid:{semiMajorAxis:6370972,semiMinorAxis:6370972},axis:"enu",xUnit:{name:"meters",metersPerUnit:1},yUnit:{name:"meters",metersPerUnit:1},zUnit:{name:"meters",metersPerUnit:1},lossy:!1,renderingBounds:[[-6370972,-6370972,-6370972],[6370972,6370972,6370972]],renderingScale:u,getRenderingScale:()=>u,converter:{WGS84:{from:p(e=>{let t=f.forward3D([e[0]*h,e[1]*h,e[2]??0]);return[e[0],e[1],e[2]]=t,e}),to:p(e=>{let t=f.inverse3D([e[0],e[1],e[2]]);return e[0]=t[0]/h,e[1]=t[1]/h,e[2]=t[2],e}),normalize:p(e=>{let t=e[0];return e[0]=180>=Math.abs(t)?t:((t+180)%360+360)%360-180,e[1]=Math.max(-90,Math.min(90,e[1])),e})}}};a.A;var m=i(4560);let v=(e,t)=>{if(!t)return Array.from(e);for(let i=0;i<e.length;i++)t[i]=e[i];return t},y={signature:"WGS84",projection:"longlat",parameters:{proj:"longlat",datum:"WGS84"},coordinateFrame:"geographic",ellipsoid:{semiMajorAxis:6378137,semiMinorAxis:6356752.314245179},axis:"enu",xUnit:{name:"degrees",degreesPerUnit:1},yUnit:{name:"degrees",degreesPerUnit:1},zUnit:{name:"meters",metersPerUnit:1},lossy:!1,renderingBounds:[[-180,-90,0],[180,90,0]],renderingScale:()=>null,getRenderingScale:()=>null,converter:{WGS84:{from:v,to:v,normalize:v}}},_=new Map([[y.signature,y],[g.signature,g],[m.C.signature,m.C]]);function b(e,t){return e===t||("string"==typeof e?e:JSON.stringify(e))===("string"==typeof t?t:JSON.stringify(t))}function w(e){let t=e;switch("string"==typeof e?e.toLowerCase():null){case"lnglat":case"longlat":case"wgs84":case"epsg:4326":case"epsg:4979":case"lnglat-offsets":return y;case"globe":return g;case"cartesian":case"meter-offsets":return null;case"epsg:4328":t="EPSG:4978"}let i="string"==typeof t?t:JSON.stringify(t),s=_.get(i);if(s)return s;let n=r.projectionEngine.getCRS(t).then(e=>(_.set(i,e),_.set(e.signature,e),e),e=>{throw _.get(i)===n&&_.delete(i),e});return _.set(i,n),n}},72594(e,t,i){i.d(t,{b:()=>function e(t,i,r){if(t===i)return!0;if(!r||!t||!i)return!1;if(Array.isArray(t)){if(!Array.isArray(i)||t.length!==i.length)return!1;for(let s=0;s<t.length;s++)if(!e(t[s],i[s],r-1))return!1;return!0}if(Array.isArray(i))return!1;if("object"==typeof t&&"object"==typeof i){let s=Object.keys(t),n=Object.keys(i);if(s.length!==n.length)return!1;for(let n of s)if(!i.hasOwnProperty(n)||!e(t[n],i[n],r-1))return!1;return!0}return!1}})},7295(e,t,i){function r(e,t=()=>!0){return Array.isArray(e)?function e(t,i,r){let s=-1;for(;++s<t.length;){let n=t[s];Array.isArray(n)?e(n,i,r):i(n)&&r.push(n)}return r}(e,t,[]):t(e)?[e]:[]}function s({target:e,source:t,start:i=0,count:r=1}){let n=t.length,o=r*n,a=0;for(let r=i;a<n;a++)e[r++]=t[a];for(;a<o;)a<o-a?(e.copyWithin(i+a,i,i+a),a*=2):(e.copyWithin(i+a,i,i+o-a),a=o);return e}i.d(t,{B:()=>r,R:()=>s})},42103(e,t,i){i.d(t,{I:()=>a,Td:()=>o,X:()=>n});let r=[],s=[];function n(e,t=0,i=1/0){let o=r,a={index:-1,data:e,target:[]};return e?"function"==typeof e[Symbol.iterator]?o=e:e.length>0&&(s.length=e.length,o=s):o=r,(t>0||Number.isFinite(i))&&(o=(Array.isArray(o)?o:Array.from(o)).slice(t,i),a.index=t-1),{iterable:o,objectInfo:a}}function o(e){return e&&e[Symbol.asyncIterator]}function a(e,t){let{size:i,stride:r,offset:s,startIndices:n,nested:o}=t,a=e.BYTES_PER_ELEMENT,l=r?r/a:i,c=s?s/a:0,h=Math.floor((e.length-c)/l);return(t,{index:r,target:s})=>{let a;if(!n){let t=r*l+c;for(let r=0;r<i;r++)s[r]=e[t+r];return s}let u=n[r],d=n[r+1]||h;if(o){a=Array(d-u);for(let t=u;t<d;t++){let r=t*l+c;s=Array(i);for(let t=0;t<i;t++)s[t]=e[r+t];a[t-u]=s}}else if(l===i)a=e.subarray(u*i+c,d*i+c);else{a=new e.constructor((d-u)*i);let t=0;for(let r=u;r<d;r++){let s=r*l+c;for(let r=0;r<i;r++)a[t++]=e[s+r]}}return a}}},2555(e,t,i){i.d(t,{A:()=>r});let r=new(i(38564)).h({id:"deck"})},11579(e,t,i){let r;i.d(t,{$M:()=>o,Vl:()=>l,_Z:()=>p,cT:()=>f,om:()=>c,on:()=>h,zi:()=>a});var s=i(44379),n=i(78861);function o(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function a(e,t){let i=e%t;return i<0?t+i:i}function l(e){return[e[12],e[13],e[14]]}function c(e){let t=e[10],i=e[14];return{near:i/(t-1),far:i/(t+1)}}function h(e){return{left:d(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:d(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:d(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:d(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:d(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:d(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}let u=new n.P;function d(e,t,i,r){u.set(e,t,i);let s=u.len();return{distance:r/s,normal:new n.P(-e/s,-t/s,-i/s)}}function f(e,t){let{size:i=1,startIndex:n=0}=t,o=void 0!==t.endIndex?t.endIndex:e.length,a=(o-n)/i;r=s.A.allocate(r,a,{type:Float32Array,size:2*i});let l=n,c=0;for(;l<o;){for(let t=0;t<i;t++){let s=e[l++];r[c+t]=s,r[c+t+i]=s-Math.fround(s)}c+=2*i}return r.subarray(0,a*i*2)}function p(e){let t=null,i=!1;for(let r of e)r&&(t?(i||(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],i=!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}},62585(e,t,i){i.d(t,{A:()=>r});function r(e){let t,i={};return r=>{for(let s in r)if(!function(e,t){if(e===t)return!0;if(Array.isArray(e)){let i=e.length;if(!t||t.length!==i)return!1;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}return!1}(r[s],i[s])){t=e(r),i=r;break}return t}}},71329(e,t,i){i.d(t,{E9:()=>n,rk:()=>s});let r=/^(?:\d+\.?\d*|\.\d+)$/;function s(e){switch(typeof e){case"number":if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:"literal",value:e};case"string":try{let t=function(e){let t=[],i=0;for(;i<e.length;){let s=e[i];if(/\s/.test(s)){i++;continue}if("+"===s||"-"===s||"("===s||")"===s||"%"===s){t.push({type:"symbol",value:s}),i++;continue}if(a(s)||"."===s){let n=i,o="."===s;for(i++;i<e.length;){let t=e[i];if(a(t)){i++;continue}if("."===t&&!o){o=!0,i++;continue}break}let l=e.slice(n,i);if(!r.test(l))throw Error("Invalid number token");t.push({type:"number",value:parseFloat(l)});continue}if(l(s)){let r=i;for(;i<e.length&&l(e[i]);)i++;let s=e.slice(r,i).toLowerCase();t.push({type:"word",value:s});continue}throw Error("Invalid token in position string")}return t}(e);return new o(t).parseExpression()}catch(i){let t=i instanceof Error?i.message:String(i);throw Error(`Could not parse position string ${e}: ${t}`)}default:throw Error(`Could not parse position string ${e}`)}}function n(e,t){return function e(t,i){switch(t.type){case"literal":return t.value;case"percentage":return Math.round(t.value*i);case"binary":let r=e(t.left,i),s=e(t.right,i);return"+"===t.operator?r+s:r-s;default:throw Error("Unknown layout expression type")}}(e,t)}class o{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error("Unexpected token at end of expression");return e}parseBinaryExpression(){var e;let t=this.parseFactor(),i=this.peek();for(;(e=i)&&"symbol"===e.type&&("+"===e.value||"-"===e.value);){this.index++;let e=this.parseFactor();t={type:"binary",operator:i.value,left:t,right:e},i=this.peek()}return t}parseFactor(){let e=this.peek();if(!e)throw Error("Unexpected end of expression");if("symbol"===e.type&&"+"===e.value)return this.index++,this.parseFactor();if("symbol"===e.type&&"-"===e.value)return this.index++,{type:"binary",operator:"-",left:{type:"literal",value:0},right:this.parseFactor()};if("symbol"===e.type&&"("===e.value){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw Error("Missing closing parenthesis");return e}if("word"===e.type&&"calc"===e.value){if(this.index++,!this.consumeSymbol("("))throw Error("Missing opening parenthesis after calc");let e=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw Error("Missing closing parenthesis");return e}if("number"===e.type){this.index++;let t=e.value,i=this.peek();return i&&"symbol"===i.type&&"%"===i.value?(this.index++,{type:"percentage",value:t/100}):(i&&"word"===i.type&&"px"===i.value&&this.index++,{type:"literal",value:t})}throw Error("Unexpected token in expression")}consumeSymbol(e){let t=this.peek();return!!t&&"symbol"===t.type&&t.value===e&&(this.index++,!0)}peek(){return this.tokens[this.index]||null}}function a(e){return e>="0"&&e<="9"}function l(e){return e>="a"&&e<="z"||e>="A"&&e<="Z"}},72085(e,t,i){i.d(t,{A:()=>a});var r=i(42103),s=i(44379),n=i(18091),o=i(8994);class a{constructor(e){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;let{attributes:t={}}=e;this.typedArrayManager=s.A,this.attributes={},this._attributeDefs=t,this.opts=e,this.updateGeometry(e)}updateGeometry(e){Object.assign(this.opts,e);let{data:t,buffers:i={},getGeometry:r,geometryBuffer:s,positionFormat:o,dataChanged:a,normalize:l=!0}=this.opts;if(this.data=t,this.geometryAccessor=r,this.inputPositionSize=s&&s.size||("XY"===o?2:3),this.positionSize=this.opts.transform?3:this.inputPositionSize,this.buffers=i,this.normalize=l,s&&((0,n.A)(t.startIndices),this.geometryAccessor=this.getGeometryFromBuffer(s),l||this.opts.transform||(i.vertexPositions=s)),this.geometryBuffer=i.vertexPositions,Array.isArray(a))for(let e of a)this._rebuildGeometry(e);else this._rebuildGeometry()}updatePartialGeometry({startRow:e,endRow:t}){this._rebuildGeometry({startRow:e,endRow:t})}getGeometry(...e){let t=this.geometryAccessor?.(...e);return t&&this.opts.transform?function e(t,i,r){if("positions"in t)return{...t,positions:e(t.positions,i,r),...t.holeIndices&&{holeIndices:Array.from(t.holeIndices,e=>e/i*3)}};if(!t.length)return[];if("number"!=typeof t[0])return Array.from(t,t=>e(t,i,r));let s=[];for(let e=0;e<t.length;e+=i){let n=r([t[e],t[e+1],3===i?t[e+2]:0]);s.push(n[0],n[1],n[2]??0)}return s}(this.prepareGeometry(t),this.inputPositionSize,this.opts.transform):t??null}prepareGeometry(e){return e}getGeometryFromBuffer(e){let t=e.value||e;return ArrayBuffer.isView(t)?(0,r.I)(t,{size:this.inputPositionSize,offset:e.offset,stride:e.stride,startIndices:this.data.startIndices}):null}_allocate(e,t){let{attributes:i,buffers:r,_attributeDefs:s,typedArrayManager:n}=this;for(let o in s)if(o in r)n.release(i[o]),i[o]=null;else{let r=s[o];r.copy=t,i[o]=n.allocate(i[o],e,r)}}_forEachGeometry(e,t,i){let{data:s}=this,{iterable:n,objectInfo:o}=(0,r.X)(s,t,i);for(let t of n)o.index++,e(this.getGeometry(t,o),o.index)}_rebuildGeometry(e){if(!this.data)return;let{indexStarts:t,vertexStarts:i,instanceCount:r}=this,{data:s,geometryBuffer:n}=this,{startRow:a=0,endRow:l=1/0}=e||{},c={};if(e||(t=[0],i=[0]),this.normalize||!n)this._forEachGeometry((e,t)=>{let r=e&&this.normalizeGeometry(e);c[t]=r,i[t+1]=i[t]+(r?this.getGeometrySize(r):0)},a,l),r=i[i.length-1];else if(r=(i=s.startIndices)[s.length]||0,ArrayBuffer.isView(n))r=r||n.length/this.positionSize;else if(n instanceof o.h){let e=4*this.positionSize;r=r||n.byteLength/e}else if(n.buffer){let e=n.stride||4*this.positionSize;r=r||n.buffer.byteLength/e}else if(n.value){let e=n.value,t=n.stride/e.BYTES_PER_ELEMENT||this.positionSize;r=r||e.length/t}this._allocate(r,!!e),this.indexStarts=t,this.vertexStarts=i,this.instanceCount=r;let h={},u=(e,s)=>{h.vertexStart=i[s],h.indexStart=t[s],h.geometrySize=(i[s+1]??r)-i[s],h.geometryIndex=s,this.updateGeometryAttributes(e,h)};if(this.normalize||!n)for(let e=a;e<Math.min(l,i.length-1);e++)u(c[e],e);else this._forEachGeometry((e,t)=>{u(e,t)},a,l);this.vertexCount=t[t.length-1]}}},44379(e,t,i){i.d(t,{A:()=>r});let r=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:i=1,type:r,padding:s=0,copy:n=!1,initialize:o=!1,maxCount:a}){let l=r||e&&e.constructor||Float32Array,c=t*i+s;if(ArrayBuffer.isView(e)){if(c<=e.length)return e;if(c*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new l(e.buffer,0,c)}let h=1/0;a&&(h=a*i+s);let u=this._allocate(l,c,o,h);return e&&n?u.set(e):o||u.fill(0,0,4),this._release(e),u}release(e){this._release(e)}_allocate(e,t,i,r){let s=Math.max(Math.ceil(t*this.opts.overAlloc),1);s>r&&(s=r);let n=this._pool,o=e.BYTES_PER_ELEMENT*s,a=n.findIndex(e=>e.byteLength>=o);if(a>=0){let t=new e(n.splice(a,1)[0],0,s);return i&&t.fill(0),t}return new e(s)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:i}=e,{byteLength:r}=i,s=t.findIndex(e=>e.byteLength>=r);s<0?t.push(i):(s>0||t.length<this.opts.poolSize)&&t.splice(s,0,i),t.length>this.opts.poolSize&&t.shift()}}},94969(e,t,i){i.d(t,{A:()=>_});var r=i(2555),s=i(18091),n=i(36411),o=i(90577),a=i(11579),l=i(88967),c=i(94022),h=i(49105),u=i(78861),d=i(11066),f=i(82811);let p=Math.PI/180,g=(0,a.$M)(),m=[0,0,0];function v(e={}){let t=e.unitsPerWorldUnit??[1,1,1],i=e.unitsPerMeter??t;return{unitsPerWorldUnit:t,unitsPerMeter:i,unitsPerWorldUnit2:e.unitsPerWorldUnit2??[0,0,0],unitsPerMeter2:e.unitsPerMeter2??[0,0,0],metersPerUnit:[1/i[0],1/i[1],1/i[2]]}}class y{get projectionSignature(){return this.resolution||null}getSubdivisionStep(e){if(!this.resolution||!this.crs||e.signature===this.crs.signature)return 0;switch(this.projectionMode){case f.K.WEB_MERCATOR:case f.K.WEB_MERCATOR_AUTO_OFFSET:if("geographic"===e.coordinateFrame)return 0}let t=e.ellipsoid?.semiMajorAxis??n.rz.ellipsoid.semiMajorAxis,i=2*Math.PI*t/this.resolution;if("geographic"===e.coordinateFrame)return i/(t*Math.PI/180);{let t=e.xUnit.metersPerUnit,r=e.yUnit.metersPerUnit;return(0,s.A)("number"==typeof t&&t>0&&"number"==typeof r&&r>0),i/Math.max(t,r)}}getPreprojection(e){if((0,o.eN)(this.projectionMode,e,this.crs))return{preproject:null,unpreproject:null,packedCrs:e};let t=this.projectionMode===f.K.CUSTOM_GEOSPATIAL,i="WGS84"===e.signature,r=e.converter.WGS84,s=t?this.crs.converter.WGS84:null;return{preproject:e=>{let t=i?e:r.to(e),n=s?s.from(s.normalize(t)):t;return[n[0],n[1],n[2]??0]},unpreproject:e=>{let t=s?s.to(e):e,n=i?t:r.from(t);return[n[0],n[1],n[2]??0]},packedCrs:t?this.crs:n.rz}}constructor(e={}){if(this._frustumPlanes={},this.resolution=e.resolution??0,!Number.isFinite(this.resolution)||this.resolution<0)throw Error("resolution must be finite and non-negative");this.crs=e.crs,e.targetToCommonMatrix&&(this.targetToCommonMatrix=new c.k(e.targetToCommonMatrix),this._commonToTargetMatrix=new c.k(this.targetToCommonMatrix).invert()),this._distanceScaleSampler="function"==typeof e.distanceScales?e.distanceScales:void 0,this.id=e.id||this.constructor.displayName||"viewport",this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding;let t=this.crs?[this.crs.xUnit,this.crs.yUnit,this.crs.zUnit].map(e=>e.metersPerUnit??1):void 0;this.distanceScales=v({unitsPerWorldUnit:t,...this._distanceScaleSampler?this._distanceScaleSampler():e.distanceScales}),this.focalDistance=e.focalDistance||1,this.position=e.position||m,this.modelMatrix=e.modelMatrix||null,this.isGeospatial=!!this.crs,this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return 1/this.distanceScales.unitsPerMeter[2]/this.scale}get projectionMode(){return f.K.IDENTITY}equals(e){return e instanceof y&&(this===e||e.width===this.width&&e.height===this.height&&e.scale===this.scale&&e.projectionMode===this.projectionMode&&e.resolution===this.resolution&&e.projectionSignature===this.projectionSignature&&e.crs?.signature===this.crs?.signature&&(0,h.aI)(e.targetToCommonMatrix||g,this.targetToCommonMatrix||g)&&(0,h.aI)(e.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&(0,h.aI)(e.projectionMatrix,this.projectionMatrix)&&(0,h.aI)(e.viewMatrix,this.viewMatrix))}project(e,{topLeft:t=!0}={}){let i=this.projectPosition(e),r=(0,l.VJ)(i,this.pixelProjectionMatrix),[s,n]=r,o=t?n:this.height-n;return 2===e.length?[s,o]:[s,o,r[2]]}unproject(e,{topLeft:t=!0,targetZ:i}={}){let[r,s,n]=e,o=t?s:this.height-s,a=this.targetToCommonMatrix?this.targetToCommonMatrix.transformAsPoint([0,0,i||0])[2]:i&&i*this.distanceScales.unitsPerWorldUnit[2],c=(0,l.xJ)([r,o,n],this.pixelUnprojectionMatrix,a),[h,u,d]=this.unprojectPosition(c);return Number.isFinite(n)?[h,u,d]:Number.isFinite(i)?[h,u,i]:[h,u]}projectPosition(e,t={}){if(t.sourceCrs)return this._projectPositionFromCRS(e,t.sourceCrs);let i=this.distanceScales.unitsPerWorldUnit;if(this.crs){let t=this.crs.converter.WGS84.from(e);return this._projectTarget([t[0],t[1],t[2]||0])}let[r,s]=this.projectFlat(e);return[r,s,(e[2]||0)*i[2]]}unprojectPosition(e){let t=this.distanceScales.unitsPerWorldUnit;if(this.crs){let t=this.crs.converter.WGS84.to(this._unprojectCommon(e));return[t[0],t[1],t[2]||0]}let[i,r]=this.unprojectFlat(e);return[i,r,(e[2]||0)/t[2]]}projectFlat(e){if(!this.crs)return e;let t=this.crs.converter.WGS84.from(e),i=this._projectTarget([t[0],t[1],0]);return[i[0],i[1]]}unprojectFlat(e){if(!this.crs)return e;let t=this.crs.converter.WGS84.to(this._unprojectCommon([e[0],e[1],0]));return[t[0],t[1]]}getBounds(e={}){let t={targetZ:e.z||0},i=this.unproject([0,0],t),r=this.unproject([this.width,0],t),s=this.unproject([0,this.height],t),n=this.unproject([this.width,this.height],t);return[Math.min(i[0],r[0],s[0],n[0]),Math.min(i[1],r[1],s[1],n[1]),Math.max(i[0],r[0],s[0],n[0]),Math.max(i[1],r[1],s[1],n[1])]}getDistanceScales(e){if(!e)return this.distanceScales;if(this._distanceScaleSampler)return v(this._distanceScaleSampler(e));if(!this.crs)return this.distanceScales;let t=this.crs.getRenderingScale(e);if(!t)return this.distanceScales;let i=this.targetToCommonMatrix,r=t.map((e,t)=>{let r=4*t;return(i?Math.hypot(i[r],i[r+1],i[r+2]):this.distanceScales.unitsPerWorldUnit[t])/e});return v({...this.distanceScales,unitsPerMeter:r})}containsPixel({x:e,y:t,width:i=1,height:r=1}){return e<this.x+this.width&&this.x<e+i&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,(0,a.on)(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,i){return null}_projectPositionFromCRS(e,t){let i=t.signature===n.rz.signature?e:t.converter.WGS84.to(e);return this.projectPosition(i)}_projectTarget(e){return this.targetToCommonMatrix?this.targetToCommonMatrix.transformAsPoint(e,[]):e.map((e,t)=>e*this.distanceScales.unitsPerWorldUnit[t])}_unprojectCommon(e){let t=[e[0],e[1],e[2]||0];return this._commonToTargetMatrix?this._commonToTargetMatrix.transformAsPoint(t,[]):t.map((e,t)=>e/this.distanceScales.unitsPerWorldUnit[t])}_initProps(e){this.crs&&!e.distanceScales&&(this.distanceScales=this.getDistanceScales(this.crs.converter.WGS84.from(this.position)));let t=Math.pow(2,this.zoom);this.scale=t;let{position:i,modelMatrix:r}=e,s=m;i&&(s=r?new c.k(r).transformAsVector(i,[]):i),this.center=this._getCenter(e,s)}_getCenter(e,t){return this.projectPosition(t)}_initMatrices(e){let{viewMatrix:t=g,projectionMatrix:i=null,orthographic:s=!1,fovyRadians:n,fovy:o=75,near:l=.1,far:f=1e3,padding:m=null,focalDistance:v=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new c.k().multiplyRight(t).translate(new u.P(this.center).negate()),this.projectionMatrix=i||function({width:e,height:t,orthographic:i,fovyRadians:r,focalDistance:s,padding:n,near:o,far:a}){let l=e/t,u=i?new c.k().orthographic({fovy:r,aspect:l,focalDistance:s,near:o,far:a}):new c.k().perspective({fovy:r,aspect:l,near:o,far:a});if(n){let{left:i=0,right:r=0,top:s=0,bottom:o=0}=n,a=(0,h.qE)((i+e-r)/2,0,e)-e/2,l=(0,h.qE)((s+t-o)/2,0,t)-t/2;u[8]-=2*a/e,u[9]+=2*l/t}return u}({width:this.width,height:this.height,orthographic:s,fovyRadians:n||o*p,focalDistance:v,padding:m,near:l,far:f});let y=(0,a.$M)();d.lw(y,y,this.projectionMatrix),d.lw(y,y,this.viewMatrix),this.viewProjectionMatrix=y,this.viewMatrixInverse=d.B8([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=(0,a.Vl)(this.viewMatrixInverse);let _=(0,a.$M)(),b=(0,a.$M)();d.hs(_,_,[this.width/2,-this.height/2,1]),d.Tl(_,_,[1,-1,0]),d.lw(b,_,this.viewProjectionMatrix),this.pixelProjectionMatrix=b,this.pixelUnprojectionMatrix=d.B8((0,a.$M)(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||r.A.warn("Pixel project matrix not invertible")()}}y.displayName="Viewport";let _=y},4560(e,t,i){i.d(t,{C:()=>c,l:()=>o});var r=i(88967);let s=(0,r.nI)({longitude:0,latitude:0}).metersPerUnit[0],n=512*s/(2*Math.PI);function o(e,t,i=!1){let s=(0,r.nI)({longitude:e,latitude:t,highPrecision:i});return{unitsPerMeter:s.unitsPerMeter,metersPerUnit:s.metersPerUnit,unitsPerWorldUnit:s.unitsPerDegree,unitsPerMeter2:s.unitsPerMeter2||[0,0,0],unitsPerWorldUnit2:s.unitsPerDegree2||[0,0,0]}}function a(e){return(t,i)=>{let r=e(Array.from(t));if(!i)return r;for(let e=0;e<r.length;e++)i[e]=r[e];return i}}let l=e=>{let[t,i]=(0,r.iV)([e[0],512-e[1]]),{metersPerUnit:s}=(0,r.nI)({longitude:t,latitude:i});return[s[0],s[1],1]},c={signature:"OSMTile512",coordinateFrame:"projected",projection:"merc",parameters:{proj:"merc"},ellipsoid:{semiMajorAxis:n,semiMinorAxis:n},axis:"esu",xUnit:{name:"tile units",metersPerUnit:s},yUnit:{name:"tile units",metersPerUnit:s},zUnit:{name:"meters",metersPerUnit:1},lossy:!1,renderingBounds:[[0,0,0],[512,512,0]],renderingScale:l,getRenderingScale:l,converter:{WGS84:{from:a(e=>{let[t,i]=(0,r.Gw)(e);return e[0]=t,e[1]=512-i,e}),to:a(e=>{let[t,i]=(0,r.iV)([e[0],512-e[1]]);return e[0]=t,e[1]=i,e}),normalize:a(e=>{let t=e[0];return e[0]=180>=Math.abs(t)?t:((t+180)%360+360)%360-180,e[1]=Math.max(-r.aH,Math.min(r.aH,e[1])),e})}}}},25110(e,t,i){i.d(t,{A:()=>p});var r=i(94969),s=i(82811),n=i(4560),o=i(88967),a=i(37925),l=i(34336),c=i(49105),h=i(94022),u=i(78861),d=i(43796);class f extends r.A{constructor(e={}){let t=f._getViewportOptions(e);super(t),this.latitude=t.latitude??0,this.longitude=t.longitude??0,this.zoom=t.zoom??0,this.pitch=t.pitch??0,this.bearing=t.bearing??0,this.altitude=t.altitude??1.5,this.fovy=t.fovy??75,this.orthographic=t.orthographic??!1,this._subViewports=t.repeat?[]:null,this._pseudoMeters=t.legacyMeterSizes??!1,Object.freeze(this)}static _getViewportOptions(e){let t,{latitude:i=0,longitude:r=0,zoom:s=0,pitch:a=0,bearing:l=0,nearZMultiplier:u=.1,farZMultiplier:d=1.01,nearZ:f,farZ:p,orthographic:g=!1,projectionMatrix:m,worldOffset:v=0,position:y,padding:_}=e,{width:b,height:w,altitude:P=1.5}=e,S=Math.pow(2,s);b=b||1,w=w||1;let E=null;if(m)P=m[5]/2,t=(0,o.Os)(P);else{let r;if(e.fovy?(t=e.fovy,P=(0,o.wZ)(t)):t=(0,o.Os)(P),_){let{top:e=0,bottom:t=0}=_;r=[0,(0,c.qE)((e+w-t)/2,0,w)-w/2]}E=(0,o.om)({width:b,height:w,scale:S,center:y&&[0,0,y[2]*(0,o.mY)(i)],offset:r,pitch:a,fovy:t,nearZMultiplier:u,farZMultiplier:d}),Number.isFinite(f)&&(E.near=f),Number.isFinite(p)&&(E.far=p)}let x=(0,o.rY)({height:w,pitch:a,bearing:l,scale:S,altitude:P});v&&(x=new h.k().translate([512*v,0,0]).multiplyLeft(x));let C=Number.isFinite(r)&&Number.isFinite(i);return{...e,crs:C?n.C:void 0,distanceScales:C?(0,n.l)(r,i):void 0,width:b,height:w,viewMatrix:x,longitude:r,latitude:i,zoom:s,...E,fovy:t,focalDistance:P,altitude:P,orthographic:g}}_getCenter(e,t){return this.crs?new u.P(t).scale(this.distanceScales.unitsPerMeter).add(this.projectPosition([e.longitude??0,e.latitude??0,0])):super._getCenter(e,t)}get projectionMode(){return this.crs?this.zoom<12?s.K.WEB_MERCATOR:s.K.WEB_MERCATOR_AUTO_OFFSET:s.K.IDENTITY}projectFlat(e){if(!this.crs)return e;let t=(0,o.Gw)(e);return t[1]=(0,c.qE)(t[1],-318,830),t}unprojectFlat(e){return this.crs?(0,o.iV)(e):e}getDistanceScales(e){return e&&this.crs?(0,n.l)(e[0],e[1],!0):this.distanceScales}get subViewports(){if(this._subViewports&&!this._subViewports.length){let e=this.getBounds(),t=Math.floor((e[0]+180)/360),i=Math.ceil((e[2]-180)/360);for(let e=t;e<=i;e++){let t=e?new f({...this,worldOffset:e}):this;this._subViewports.push(t)}}return this._subViewports}equals(e){return e instanceof f&&e._pseudoMeters===this._pseudoMeters&&super.equals(e)}projectPosition(e,t={}){if(t.sourceCrs)return this._projectPositionFromCRS(e,t.sourceCrs);if(this._pseudoMeters){let[t,i]=this.projectFlat(e);return[t,i,(e[2]||0)*this.distanceScales.unitsPerWorldUnit[2]]}let[i,r]=this.projectFlat(e);return[i,r,(e[2]||0)*(0,o.mY)(e[1])]}unprojectPosition(e){if(this._pseudoMeters){let[t,i]=this.unprojectFlat(e);return[t,i,(e[2]||0)/this.distanceScales.unitsPerWorldUnit[2]]}let[t,i]=this.unprojectFlat(e),r=(e[2]||0)/(0,o.mY)(i);return[t,i,r]}addMetersToLngLat(e,t){return(0,o.dT)(e,t)}panByPosition(e,t,i){let r=(0,o.xJ)(t,this.pixelUnprojectionMatrix),s=this.projectFlat(e),n=d.WQ([],s,d.ze([],r)),a=d.WQ([],this.center,n),[l,c]=this.unprojectFlat(a);return{longitude:l,latitude:c}}panByPosition3D(e,t){let i=e[2]||0,r=d.jb([],e,this.unproject(t,{targetZ:i}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=(0,a.g)(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(e,t={}){let{width:i,height:r}=this,{longitude:s,latitude:n,zoom:o}=(0,l.F)({width:i,height:r,bounds:e,...t});return new f({width:i,height:r,longitude:s,latitude:n,zoom:o})}}f.displayName="WebMercatorViewport";let p=f},53340(e,t,i){i.d(t,{A:()=>n});var r=i(71329),s=i(72594);class n{constructor(e){let{id:t,x:i=0,y:s=0,width:n="100%",height:o="100%",padding:a=null}=e;this.id=t||this.constructor.displayName||"view",this.props={...e,id:this.id},this._x=(0,r.rk)(i),this._y=(0,r.rk)(s),this._width=(0,r.rk)(n),this._height=(0,r.rk)(o),this._padding=a&&{left:(0,r.rk)(a.left||0),right:(0,r.rk)(a.right||0),top:(0,r.rk)(a.top||0),bottom:(0,r.rk)(a.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}initialize(){}equals(e){return this===e||this.constructor===e.constructor&&(0,s.b)(this.props,e.props,2)}clone(e){return new this.constructor({...this.props,...e})}makeViewport({width:e,height:t,viewState:i}){i=this.filterViewState(i);let r=this.getDimensions({width:e,height:t});return r.height&&r.width?new(this.getViewportType(i))({...i,...this.props,...r}):null}getViewStateId(){let{viewState:e}=this.props;return"string"==typeof e?e:e?.id||this.id}filterViewState(e){if(this.props.viewState&&"object"==typeof this.props.viewState){if(!this.props.viewState.id)return this.props.viewState;var t=this.props.viewState;let i={...e};for(let e in t)"id"!==e&&(Array.isArray(i[e])&&Array.isArray(t[e])?i[e]=function(e,t){e=e.slice();for(let i=0;i<t.length;i++){let r=t[i];Number.isFinite(r)&&(e[i]=r)}return e}(i[e],t[e]):i[e]=t[e]);return i}return e}getDimensions({width:e,height:t}){let i={x:(0,r.E9)(this._x,e),y:(0,r.E9)(this._y,t),width:(0,r.E9)(this._width,e),height:(0,r.E9)(this._height,t)};return this._padding&&(i.padding={left:(0,r.E9)(this._padding.left,e),top:(0,r.E9)(this._padding.top,t),right:(0,r.E9)(this._padding.right,e),bottom:(0,r.E9)(this._padding.bottom,t)}),i}get controller(){let e=this.props.controller;return e?!0===e?{type:this.ControllerType}:"function"==typeof e?{type:e}:{type:this.ControllerType,...e}:null}}},27454(e,t,i){i.d(t,{A:()=>j});var r=i(84960);let s={name:"pathShaderPlugin",injectionTargets:[{name:"DECKGL_FILTER_PATH_COLOR_VERTEX",stage:"vertex",wgsl:{parameters:"color: ptr<function, vec4<f32>>, pathPosition: vec2<f32>, pathLength: f32"}},{name:"DECKGL_FILTER_PATH_COLOR",stage:"fragment",wgsl:{parameters:""}},{name:"DECKGL_PATH_STYLE_COORDINATES",stage:"vertex",wgsl:{parameters:"pathPosition: ptr<function, vec2<f32>>, pathLength: ptr<function, f32>, pathBounds: ptr<function, vec2<f32>>, halfWidth: f32"}},{name:"DECKGL_PATH_STYLE_COLOR",stage:"fragment",wgsl:{parameters:"color: ptr<function, vec4<f32>>, pathPosition: vec2<f32>, pathCoverage: f32"}}]},n=function({vertexEntry:e="@vertex\nfn vertexMain(attributes: Attributes) -> Varyings",vertexSetup:t="",vertexOutput:i="",extraVaryings:r="",fragmentFilter:s="",colorFilter:n=""}={}){return`\
const EPSILON: f32 = 0.001;
const ZERO_OFFSET: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);

struct JoinResult {
  offset: vec3<f32>,
  cornerOffset: vec2<f32>,
  miterLength: f32,
  pathPosition: vec2<f32>,
  pathLength: f32,
  jointType: f32,
};

struct Attributes {
  @location(0) positions: vec2<f32>,
  @location(1) instanceTypes: f32,
  @location(2) instanceLeftPositions: vec3<f32>,
  @location(3) instanceStartPositions: vec3<f32>,
  @location(4) instanceEndPositions: vec3<f32>,
  @location(5) instanceRightPositions: vec3<f32>,
  @location(6) instanceLeftPositions64Low: vec3<f32>,
  @location(7) instanceStartPositions64Low: vec3<f32>,
  @location(8) instanceEndPositions64Low: vec3<f32>,
  @location(9) instanceRightPositions64Low: vec3<f32>,
  @location(10) instanceStrokeWidths: f32,
  @location(11) instanceColors: vec4<f32>,
  @location(12) rowIndexes: u32,
};

struct Varyings {
  ${r}
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) vCornerOffset: vec2<f32>,
  @location(2) vMiterLength: f32,
  @location(3) vPathPosition: vec2<f32>,
  @location(4) vPathLength: f32,
  @location(5) vJointType: f32,
#ifdef DASH_ENABLED
  @location(8) vPathBounds: vec2<f32>,
#endif
};

fn flipIfTrue(flag: bool) -> f32 {
  return select(1.0, -1.0, flag);
}

fn clipLine(position: vec4<f32>, refPosition: vec4<f32>) -> vec4<f32> {
  if (position.w < EPSILON) {
    let r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
    return refPosition + (position - refPosition) * r;
  }
  return position;
}

#ifdef DASH_ENABLED
// Return the visible interval of the original segment before clipLine moves either endpoint.
fn getClippedPathRange(startW: f32, endW: f32) -> vec2<f32> {
  let startClipped = startW < EPSILON;
  let endClipped = endW < EPSILON;
  if (startClipped && endClipped) {
    return vec2<f32>(0.0, 0.0);
  }
  if (startClipped || endClipped) {
    let intersection = clamp((EPSILON - startW) / (endW - startW), 0.0, 1.0);
    if (startClipped) {
      return vec2<f32>(intersection, 1.0);
    }
    return vec2<f32>(0.0, intersection);
  }
  return vec2<f32>(0.0, 1.0);
}
#endif

fn getLineJoinOffset(
  prevPoint: vec3<f32>,
  currPoint: vec3<f32>,
  nextPoint: vec3<f32>,
  width: vec2<f32>,
#ifdef DASH_ENABLED
  sourcePathLength: f32,
  sourcePathRange: vec2<f32>,
#endif
#ifdef ANTIALIASING
  coverageScale: f32,
#endif
  positions: vec2<f32>,
  instanceTypes: f32
) -> JoinResult {
  let isEnd = positions.x > 0.0;
  let sideOfPath = positions.y;
  let isJoint = select(0.0, 1.0, sideOfPath == 0.0);

  var deltaA3 = currPoint - prevPoint;
  var deltaB3 = nextPoint - currPoint;

  let rotationResult = project_needs_rotation(currPoint);
  if (path.billboard == 0.0 && rotationResult.needsRotation) {
    deltaA3 = rotationResult.transform * deltaA3;
    deltaB3 = rotationResult.transform * deltaB3;
  }

  let deltaA = deltaA3.xy / width;
  let deltaB = deltaB3.xy / width;

  let lenA = length(deltaA);
  let lenB = length(deltaB);

  let dirA = select(vec2<f32>(0.0, 0.0), normalize(deltaA), lenA > 0.0);
  let dirB = select(vec2<f32>(0.0, 0.0), normalize(deltaB), lenB > 0.0);

  let perpA = vec2<f32>(-dirA.y, dirA.x);
  let perpB = vec2<f32>(-dirB.y, dirB.x);

  var tangent = dirA + dirB;
  tangent = select(perpA, normalize(tangent), length(tangent) > 0.0);
  let miterVec = vec2<f32>(-tangent.y, tangent.x);
  let dir = select(dirB, dirA, isEnd);
  let perp = select(perpB, perpA, isEnd);
#ifdef DASH_ENABLED
  let segmentLength2D = select(lenB, lenA, isEnd);

  // Extrusion happens in the XY plane, so segmentLength2D is a 2D length and pathPosition.y
  // below measures 2D distance along the segment. For a path that also moves in Z the true
  // arc length is longer by this ratio. Scaling pathLength and pathPosition.y by it makes
  // the coordinate measure real 3D distance while leaving the joint tests unchanged, since
  // they compare the two against each other and both are scaled alike. Billboard mode
  // extrudes in clip space, where the perspective divide has already reduced the segment to
  // its screen projection, so its complete common-space length is supplied by the caller.
  // Mirrors path-layer-vertex.glsl.ts.
  let currDelta3 = select(deltaB3, deltaA3, isEnd);
  let currLength2D = length(currDelta3.xy);
  // Do not clamp a valid denominator to EPSILON: high-zoom Web Mercator deltas are often
  // smaller than that in common space, and changing their scale corrupts even flat paths.
  let safeLength2D = select(1.0, currLength2D, currLength2D > 0.0);
  var arcLengthRatio = 1.0;
  var pathPositionOffset = 0.0;
  var pathLength = segmentLength2D;
  if (path.billboard != 0.0) {
    // clipLine may shorten the visible screen-space segment. Preserve the corresponding interval
    // of the complete common-space arclength instead of compressing the full dash period into the
    // visible span. Keep pathLength complete so justification is stable as the camera clips it.
    let visiblePathLength = sourcePathLength * (sourcePathRange.y - sourcePathRange.x);
    arcLengthRatio = 0.0;
    if (segmentLength2D > 0.0) {
      arcLengthRatio = visiblePathLength / segmentLength2D;
    }
    pathPositionOffset = sourcePathLength * sourcePathRange.x;
    pathLength = sourcePathLength;
  } else if (currLength2D > 0.0) {
    arcLengthRatio = length(currDelta3) / safeLength2D;
    pathLength = segmentLength2D * arcLengthRatio;
  }
#else
  let pathLength = select(lenB, lenA, isEnd);
#endif

  let sinHalfA = abs(dot(miterVec, perp));
  let cosHalfA = abs(dot(dirA, miterVec));
  let turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
  let cornerPosition = sideOfPath * turnDirection;

  var miterSize = 1.0 / max(sinHalfA, EPSILON);
  miterSize = mix(
    min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
    miterSize,
    step(0.0, cornerPosition)
  );

  var offsetVec =
    mix(miterVec * miterSize, perp, step(0.5, cornerPosition)) *
    (sideOfPath + isJoint * turnDirection);

  let isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
  let isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
  let isCap = isStartCap || isEndCap;

  var jointType = path.jointType;
  if (isCap) {
    offsetVec = mix(
      perp * sideOfPath,
      dir * path.capType * 4.0 * flipIfTrue(isStartCap),
      isJoint
    );
    jointType = path.capType;
  }

#ifdef ANTIALIASING
  let coverageOffsetVec = offsetVec * coverageScale;
  var miterLength = dot(coverageOffsetVec, miterVec * turnDirection);
#else
  var miterLength = dot(offsetVec, miterVec * turnDirection);
#endif
  miterLength = select(miterLength, isJoint, isCap);

#ifdef ANTIALIASING
  let offsetFromStartOfPath = coverageOffsetVec + deltaA * select(0.0, 1.0, isEnd);
#else
  let offsetFromStartOfPath = offsetVec + deltaA * select(0.0, 1.0, isEnd);
#endif
  let pathPosition = vec2<f32>(
    dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
    pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
    dot(offsetFromStartOfPath, dir)
#endif
  );
  let isValid = step(f32(instanceTypes), 3.5);
#ifdef ANTIALIASING
  var offset = vec3<f32>(coverageOffsetVec * width * isValid, 0.0);
#else
  var offset = vec3<f32>(offsetVec * width * isValid, 0.0);
#endif

  if (path.billboard == 0.0 && rotationResult.needsRotation) {
    offset = rotationResult.transform * offset;
  }

#ifdef ANTIALIASING
  return JoinResult(
    offset, coverageOffsetVec, miterLength, pathPosition, pathLength, jointType
  );
#else
  return JoinResult(offset, offsetVec, miterLength, pathPosition, pathLength, jointType);
#endif
}

${e} {
  ${t}
  var varyings: Varyings;

  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let isEnd = attributes.positions.x;

  let prevPosition = mix(attributes.instanceLeftPositions, attributes.instanceStartPositions, isEnd);
  let prevPosition64Low = mix(
    attributes.instanceLeftPositions64Low,
    attributes.instanceStartPositions64Low,
    isEnd
  );
  let currPosition = mix(attributes.instanceStartPositions, attributes.instanceEndPositions, isEnd);
  let currPosition64Low = mix(
    attributes.instanceStartPositions64Low,
    attributes.instanceEndPositions64Low,
    isEnd
  );
  let nextPosition = mix(attributes.instanceEndPositions, attributes.instanceRightPositions, isEnd);
  let nextPosition64Low = mix(
    attributes.instanceEndPositions64Low,
    attributes.instanceRightPositions64Low,
    isEnd
  );

  geometry.worldPosition = currPosition;

  var widthPixels =
    clamp(
      project_unit_size_to_pixel(attributes.instanceStrokeWidths * path.widthScale, path.widthUnits),
      path.widthMinPixels,
      path.widthMaxPixels
    ) / 2.0;
  var size = vec3<f32>(widthPixels, widthPixels, 0.0);
  DECKGL_FILTER_SIZE(&size, geometry);
  widthPixels = size.x;

  if (path.billboard != 0.0) {
#ifdef DASH_ENABLED
    let prevProjection = project_position_to_clipspace_and_commonspace(
      prevPosition, prevPosition64Low, ZERO_OFFSET
    );
    let nextProjection = project_position_to_clipspace_and_commonspace(
      nextPosition, nextPosition64Low, ZERO_OFFSET
    );
    let prevPositionCommon = prevProjection.commonPosition.xyz;
    let nextPositionCommon = nextProjection.commonPosition.xyz;
    var prevPositionScreen = prevProjection.clipPosition;
    var nextPositionScreen = nextProjection.clipPosition;
#else
    var prevPositionScreen = project_position_to_clipspace(
      prevPosition, prevPosition64Low, ZERO_OFFSET
    );
    var nextPositionScreen = project_position_to_clipspace(
      nextPosition, nextPosition64Low, ZERO_OFFSET
    );
#endif
    let currProjection = project_position_to_clipspace_and_commonspace(
      currPosition, currPosition64Low, ZERO_OFFSET
    );
    geometry.position = currProjection.commonPosition;
    var currPositionScreen = currProjection.clipPosition;
#ifdef DASH_ENABLED
    let currPositionCommon = currProjection.commonPosition.xyz;
    let sourcePathStartScreen = mix(currPositionScreen, prevPositionScreen, isEnd);
    let sourcePathEndScreen = mix(nextPositionScreen, currPositionScreen, isEnd);
    let billboardPathRange = getClippedPathRange(
      sourcePathStartScreen.w, sourcePathEndScreen.w
    );
#endif

    prevPositionScreen = clipLine(prevPositionScreen, currPositionScreen);
    nextPositionScreen = clipLine(nextPositionScreen, currPositionScreen);
    currPositionScreen = clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));

#ifdef ANTIALIASING
    let coverageScale = select(
      1.0,
      (widthPixels + 0.5 / project.devicePixelRatio) / max(widthPixels, 1e-6),
      widthPixels > 0.0
    );
#endif
#ifdef DASH_ENABLED
    let currentDeltaCommon = select(
      nextPositionCommon - currPositionCommon,
      currPositionCommon - prevPositionCommon,
      isEnd > 0.0
    );
    let billboardPathLength = select(
      0.0,
      length(currentDeltaCommon) * project.scale / (widthPixels * project.focalDistance),
      widthPixels > 0.0
    );
#endif
    let join = getLineJoinOffset(
      prevPositionScreen.xyz / prevPositionScreen.w,
      currPositionScreen.xyz / currPositionScreen.w,
      nextPositionScreen.xyz / nextPositionScreen.w,
      project_pixel_size_to_clipspace(vec2<f32>(widthPixels, widthPixels)),
#ifdef DASH_ENABLED
      billboardPathLength,
      billboardPathRange,
#endif
#ifdef ANTIALIASING
      coverageScale,
#endif
      attributes.positions,
      attributes.instanceTypes
    );
#ifdef DASH_ENABLED
    // Phase and justification use the complete source segment, while cap and joint coverage
    // must still recognize the endpoints moved by clipLine.
    varyings.vPathBounds = billboardPathLength * billboardPathRange;
#endif

    geometry.uv = join.pathPosition;
    varyings.position = vec4<f32>(
      currPositionScreen.xyz + join.offset * currPositionScreen.w,
      currPositionScreen.w
    );
    varyings.vCornerOffset = join.cornerOffset;
    varyings.vMiterLength = join.miterLength;
    varyings.vPathPosition = join.pathPosition;
    varyings.vPathLength = join.pathLength;
    varyings.vJointType = join.jointType;
  } else {
    let prevPositionCommon = project_position_vec3_f64(prevPosition, prevPosition64Low);
    let currPositionCommon = project_position_vec3_f64(currPosition, currPosition64Low);
    let nextPositionCommon = project_position_vec3_f64(nextPosition, nextPosition64Low);

    let width = vec2<f32>(
      project_pixel_size_float(widthPixels),
      project_pixel_size_float(widthPixels)
    );
#ifdef ANTIALIASING
    let coverageScale = select(
      1.0,
      (widthPixels + 0.5 / project.devicePixelRatio) / max(widthPixels, 1e-6),
      widthPixels > 0.0
    );
#endif
    let join = getLineJoinOffset(
      prevPositionCommon,
      currPositionCommon,
      nextPositionCommon,
      width,
#ifdef DASH_ENABLED
      1.0,
      vec2<f32>(0.0, 1.0),
#endif
#ifdef ANTIALIASING
      coverageScale,
#endif
      attributes.positions,
      attributes.instanceTypes
    );
#ifdef DASH_ENABLED
    varyings.vPathBounds = vec2<f32>(0.0, join.pathLength);
#endif

    geometry.position = vec4<f32>(currPositionCommon + join.offset, 1.0);
    geometry.uv = join.pathPosition;
    varyings.position = project_common_position_to_clipspace(geometry.position);
    varyings.vCornerOffset = join.cornerOffset;
    varyings.vMiterLength = join.miterLength;
    varyings.vPathPosition = join.pathPosition;
    varyings.vPathLength = join.pathLength;
    varyings.vJointType = join.jointType;
  }

  var pathBounds = vec2<f32>(0.0);
#ifdef DASH_ENABLED
  pathBounds = varyings.vPathBounds;
#endif
  var pathPosition = varyings.vPathPosition;
  var pathLength = varyings.vPathLength;
  DECKGL_PATH_STYLE_COORDINATES(
    &pathPosition, &pathLength, &pathBounds,
    select(project_pixel_size_float(widthPixels), widthPixels, path.billboard != 0)
  );
#ifdef DASH_ENABLED
  varyings.vPathBounds = pathBounds;
#endif
  varyings.vPathPosition = pathPosition;
  varyings.vPathLength = pathLength;
  geometry.uv = pathPosition;

  varyings.vColor = vec4<f32>(
    attributes.instanceColors.rgb,
    attributes.instanceColors.a * layer.opacity
  );
  DECKGL_FILTER_PATH_COLOR_VERTEX(&varyings.vColor, varyings.vPathPosition, varyings.vPathLength);
  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);
  ${i}
  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.vPathPosition;
  fragmentGeometry.uv = geometry.uv;

#ifdef ANTIALIASING
  // Coordinates of the outer silhouette, in units of half-width: rounded joints and caps are
  // bounded by the corner offset, everywhere else by the edge of the stroke. Dividing by the
  // screen-space derivative converts the distance to the boundary into device pixels, which stays
  // correct under perspective foreshortening and under extensions that rescale the stroke.
#ifdef DASH_ENABLED
  let isCorner =
    varyings.vPathPosition.y < varyings.vPathBounds.x ||
    varyings.vPathPosition.y > varyings.vPathBounds.y;
#else
  let isCorner = varyings.vPathPosition.y < 0.0 || varyings.vPathPosition.y > varyings.vPathLength;
#endif
  let isRound = varyings.vJointType > 0.5;

  // Distance to the silhouette in device pixels, from the derivative of the coordinate that
  // bounds it. Computed before the discards below: derivatives need uniform control flow and are
  // undefined after a discard in the quad. See dev-docs/RFCs/v9.4/analytic-antialiasing-rfc.md
  let bodyCoord = abs(varyings.vPathPosition.x);
  let cornerCoord = length(varyings.vCornerOffset);
  // Both evaluated so each derivative stays on one field across the corner/body boundary
  let bodyPixels = (1.0 - bodyCoord) / max(fwidth(bodyCoord), 1e-6);
  let cornerPixels = (1.0 - cornerCoord) / max(fwidth(cornerCoord), 1e-6);
#ifdef PATH_STYLE_OFFSET
  // Rounded corners still intersect the stroke-width envelope. Extensions may remap
  // vPathPosition.x independently of vCornerOffset, as PathStyleExtension does for offsets.
  let edgePixels = select(bodyPixels, min(cornerPixels, bodyPixels), isRound && isCorner);
#else
  let edgePixels = select(bodyPixels, cornerPixels, isRound && isCorner);
#endif

  // Fragments outside the coverage ramp must not write depth or picking colors.
  if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
    discard;
  }

  if (isCorner) {
    if (!isRound && varyings.vMiterLength > path.miterLimit + 1.0) {
      discard;
    }
  }

  var color = varyings.vColor;

  // Feather one device pixel across the width only, before premultiplication. edgePixels is a
  // signed device-pixel distance and SMOOTH_EDGE_RADIUS is 0.5, so this ramps across one pixel.
  let pathCoverage = smoothedge(0.0, edgePixels);
  color.a *= pathCoverage;
#else
#ifdef DASH_ENABLED
  if (
    varyings.vPathPosition.y < varyings.vPathBounds.x ||
    varyings.vPathPosition.y > varyings.vPathBounds.y
  ) {
#else
  if (
    varyings.vPathPosition.y < 0.0 ||
    varyings.vPathPosition.y > varyings.vPathLength
  ) {
#endif
    if (varyings.vJointType > 0.5 && length(varyings.vCornerOffset) > 1.0) {
      discard;
    }
    if (
      varyings.vJointType < 0.5 &&
      varyings.vMiterLength > path.miterLimit + 1.0
    ) {
      discard;
    }
  }
#endif

  // Fragment-layer injections that discard pixels must run after analytic coverage derivatives.
  // See TripsLayer, which rejects fragments outside of the active time window at this anchor.
  ${s}
  DECKGL_FILTER_PATH_COLOR();
#ifndef ANTIALIASING
  var color = varyings.vColor;
  let pathCoverage = 1.0;
#endif
  ${n}
  DECKGL_PATH_STYLE_COLOR(&color, varyings.vPathPosition, pathCoverage);
  DECKGL_FILTER_COLOR(&color, fragmentGeometry);
  return deckgl_premultiplied_alpha(color);
}
`}();var o=i(53031),a=i(87983),l=i(84047);let c=`\
layout(std140) uniform pathUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float jointType;
  float capType;
  float miterLimit;
  bool billboard;
  highp int widthUnits;
} path;
`,h={name:"path",source:`\
struct PathUniforms {
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  jointType: f32,
  capType: f32,
  miterLimit: f32,
  billboard: f32,
  widthUnits: i32,
};

@group(0) @binding(auto)
var<uniform> path: PathUniforms;
`,vs:c,fs:c,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}};var u=i(25110),d=i(91253),f=i(72594),p=i(62510),g=i(25359),m=i(25889),v=i(72085),y=i(86081),_=i(44168);function b(e,t,i,r){let s;if(Array.isArray(e[0])){s=Array(e.length*t);for(let i=0;i<e.length;i++)for(let r=0;r<t;r++)s[i*t+r]=e[i][r]||0}else s=e;return i?(0,y.M)(s,{size:t,gridResolution:i}):r?(0,_.I)(s,{size:t}):s}var w=i(22660);class P extends v.A{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:e.isWebGPU?Float32Array:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getPathSegmentIndices(e){let t=this.attributes.segmentTypes,i=this.vertexStarts[e],r=Math.min(this.vertexStarts[e+1]??this.instanceCount,this.instanceCount),s=[];for(let e=i;e<r-1;e++)(4&t[e])==0&&s.push(e);return s.length&&(4&t[i])!=0&&s.unshift(s.pop()),s}getGeometryFromBuffer(e){return this.normalize||this.opts.transform||this.opts.isWebGPU?super.getGeometryFromBuffer(e):null}prepareGeometry(e){let t=this.normalize?b(e,this.inputPositionSize,this.opts.resolution,this.opts.wrapLongitude):e,{projectionTolerance:i,projectionToleranceScale:r,transform:s}=this.opts;if(!i)return t;if(!this.normalize||!s)throw Error("Projection refinement requires normalized, preprojected paths");let n=r||[1,1,1],o=e=>(0,w.A)(e,{size:this.inputPositionSize,targetSize:3,transform:e=>s(Array.from(e)).map((e,t)=>e*n[t]),tolerance:i}).sourcePositions;return S(t)?t.map(o):o(t)}normalizeGeometry(e){return this.normalize&&!this.opts.transform?b(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(S(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}let t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(0!==t.geometrySize)if(e&&S(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){let i=this.attributes.segmentTypes,r=!!e&&this.isClosed(e),{vertexStart:s,geometrySize:n}=t;i.fill(0,s,s+n),r?(i[s]=4,i[s+n-2]=4):(i[s]+=1,i[s+n-2]+=2),i[s+n-1]=4}_updatePositions(e,t){let{positions:i}=this.attributes;if(!i||!e)return;let{vertexStart:r,geometrySize:s}=t,n=[,,,];for(let t=r,o=0;o<s;t++,o++)this.getPointOnPath(e,o,n),i[3*t]=n[0],i[3*t+1]=n[1],i[3*t+2]=n[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){let{positionSize:r}=this;t*r>=e.length&&(t+=1-e.length/r);let s=t*r;return i[0]=e[s],i[1]=e[s+1],i[2]=3===r&&e[s+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;let{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(2===t||e[2]===e[i+2])}}function S(e){return Array.isArray(e[0])}var E=i(98333);let x=`\
#version 300 es
#define SHADER_NAME path-layer-vertex-shader
in vec2 positions;
in float instanceTypes;
in vec3 instanceStartPositions;
in vec3 instanceEndPositions;
in vec3 instanceLeftPositions;
in vec3 instanceRightPositions;
in vec3 instanceLeftPositions64Low;
in vec3 instanceStartPositions64Low;
in vec3 instanceEndPositions64Low;
in vec3 instanceRightPositions64Low;
in float instanceStrokeWidths;
in vec4 instanceColors;
in float rowIndexes;
uniform float opacity;
out vec4 vColor;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;
#ifdef DASH_ENABLED
out vec2 vPathBounds;
#endif
const float EPSILON = 0.001;
const vec3 ZERO_OFFSET = vec3(0.0);
float flipIfTrue(bool flag) {
return -(float(flag) * 2. - 1.);
}
vec3 getLineJoinOffset(
vec3 prevPoint, vec3 currPoint, vec3 nextPoint,
vec2 width
#ifdef DASH_ENABLED
, float sourcePathLength, vec2 sourcePathRange
#endif
#ifdef ANTIALIASING
, float coverageScale
#endif
) {
bool isEnd = positions.x > 0.0;
float sideOfPath = positions.y;
float isJoint = float(sideOfPath == 0.0);
vec3 deltaA3 = (currPoint - prevPoint);
vec3 deltaB3 = (nextPoint - currPoint);
mat3 rotationMatrix;
bool needsRotation = !path.billboard && project_needs_rotation(currPoint, rotationMatrix);
if (needsRotation) {
deltaA3 = deltaA3 * rotationMatrix;
deltaB3 = deltaB3 * rotationMatrix;
}
vec2 deltaA = deltaA3.xy / width;
vec2 deltaB = deltaB3.xy / width;
float lenA = length(deltaA);
float lenB = length(deltaB);
vec2 dirA = lenA > 0. ? normalize(deltaA) : vec2(0.0, 0.0);
vec2 dirB = lenB > 0. ? normalize(deltaB) : vec2(0.0, 0.0);
vec2 perpA = vec2(-dirA.y, dirA.x);
vec2 perpB = vec2(-dirB.y, dirB.x);
vec2 tangent = dirA + dirB;
tangent = length(tangent) > 0. ? normalize(tangent) : perpA;
vec2 miterVec = vec2(-tangent.y, tangent.x);
vec2 dir = isEnd ? dirA : dirB;
vec2 perp = isEnd ? perpA : perpB;
float L = isEnd ? lenA : lenB;
#ifdef DASH_ENABLED
vec3 currDelta3 = isEnd ? deltaA3 : deltaB3;
float currLength2D = length(currDelta3.xy);
float arcLengthRatio = 1.0;
float pathPositionOffset = 0.0;
float pathLength = L;
if (path.billboard) {
float visiblePathLength = sourcePathLength * (sourcePathRange.y - sourcePathRange.x);
arcLengthRatio = L > 0.0 ? visiblePathLength / L : 0.0;
pathPositionOffset = sourcePathLength * sourcePathRange.x;
pathLength = sourcePathLength;
} else if (currLength2D > 0.0) {
arcLengthRatio = length(currDelta3) / currLength2D;
pathLength = L * arcLengthRatio;
}
#endif
float sinHalfA = abs(dot(miterVec, perp));
float cosHalfA = abs(dot(dirA, miterVec));
float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
float cornerPosition = sideOfPath * turnDirection;
float miterSize = 1.0 / max(sinHalfA, EPSILON);
miterSize = mix(
min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
miterSize,
step(0.0, cornerPosition)
);
vec2 offsetVec = mix(miterVec * miterSize, perp, step(0.5, cornerPosition))
* (sideOfPath + isJoint * turnDirection);
bool isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
bool isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
bool isCap = isStartCap || isEndCap;
if (isCap) {
offsetVec = mix(perp * sideOfPath, dir * path.capType * 4.0 * flipIfTrue(isStartCap), isJoint);
vJointType = path.capType;
} else {
vJointType = path.jointType;
}
#ifdef ANTIALIASING
vec2 coverageOffsetVec = offsetVec * coverageScale;
#ifdef DASH_ENABLED
vPathLength = pathLength;
#else
vPathLength = L;
#endif
vCornerOffset = coverageOffsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = coverageOffsetVec + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
dot(offsetFromStartOfPath, dir)
#endif
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(coverageOffsetVec * width * isValid, 0.0);
#else
#ifdef DASH_ENABLED
vPathLength = pathLength;
#else
vPathLength = L;
#endif
vCornerOffset = offsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
dot(offsetFromStartOfPath, dir)
#endif
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(offsetVec * width * isValid, 0.0);
#endif
if (needsRotation) {
offset = rotationMatrix * offset;
}
return offset;
}
void clipLine(inout vec4 position, vec4 refPosition) {
if (position.w < EPSILON) {
float r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
position = refPosition + (position - refPosition) * r;
}
}
#ifdef DASH_ENABLED
vec2 getClippedPathRange(float startW, float endW) {
bool startClipped = startW < EPSILON;
bool endClipped = endW < EPSILON;
if (startClipped && endClipped) {
return vec2(0.0);
}
if (startClipped || endClipped) {
float intersection = clamp((EPSILON - startW) / (endW - startW), 0.0, 1.0);
return startClipped ? vec2(intersection, 1.0) : vec2(0.0, intersection);
}
return vec2(0.0, 1.0);
}
#endif
void main() {
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
float isEnd = positions.x;
vec3 prevPosition = mix(instanceLeftPositions, instanceStartPositions, isEnd);
vec3 prevPosition64Low = mix(instanceLeftPositions64Low, instanceStartPositions64Low, isEnd);
vec3 currPosition = mix(instanceStartPositions, instanceEndPositions, isEnd);
vec3 currPosition64Low = mix(instanceStartPositions64Low, instanceEndPositions64Low, isEnd);
vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);
vec3 nextPosition64Low = mix(instanceEndPositions64Low, instanceRightPositions64Low, isEnd);
geometry.worldPosition = currPosition;
vec2 widthPixels = vec2(clamp(
project_size_to_pixel(instanceStrokeWidths * path.widthScale, path.widthUnits),
path.widthMinPixels, path.widthMaxPixels) / 2.0);
vec3 width;
if (path.billboard) {
#ifdef DASH_ENABLED
vec4 prevPositionCommon;
vec4 nextPositionCommon;
vec4 prevPositionScreen = project_position_to_clipspace(
prevPosition, prevPosition64Low, ZERO_OFFSET, prevPositionCommon
);
#else
vec4 prevPositionScreen = project_position_to_clipspace(
prevPosition, prevPosition64Low, ZERO_OFFSET
);
#endif
vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);
#ifdef DASH_ENABLED
vec4 nextPositionScreen = project_position_to_clipspace(
nextPosition, nextPosition64Low, ZERO_OFFSET, nextPositionCommon
);
#else
vec4 nextPositionScreen = project_position_to_clipspace(
nextPosition, nextPosition64Low, ZERO_OFFSET
);
#endif
#ifdef DASH_ENABLED
vec4 sourcePathStartScreen = mix(currPositionScreen, prevPositionScreen, isEnd);
vec4 sourcePathEndScreen = mix(nextPositionScreen, currPositionScreen, isEnd);
vec2 billboardPathRange = getClippedPathRange(
sourcePathStartScreen.w, sourcePathEndScreen.w
);
#endif
clipLine(prevPositionScreen, currPositionScreen);
clipLine(nextPositionScreen, currPositionScreen);
clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));
width = vec3(widthPixels, 0.0);
DECKGL_FILTER_SIZE(width, geometry);
#ifdef ANTIALIASING
vec2 coveragePadding = vec2(0.5 / project.devicePixelRatio);
float coverageScale = length(width.xy) > 0.0
? length(width.xy + coveragePadding) / length(width.xy)
: 1.0;
#endif
#ifdef DASH_ENABLED
vec3 currentDeltaCommon = isEnd > 0.0
? geometry.position.xyz - prevPositionCommon.xyz
: nextPositionCommon.xyz - geometry.position.xyz;
float billboardPathLength = width.x > 0.0
? length(currentDeltaCommon) * project.scale / (width.x * project.focalDistance)
: 0.0;
#endif
vec3 offset = getLineJoinOffset(
prevPositionScreen.xyz / prevPositionScreen.w,
currPositionScreen.xyz / currPositionScreen.w,
nextPositionScreen.xyz / nextPositionScreen.w,
project_pixel_size_to_clipspace(width.xy)
#ifdef DASH_ENABLED
,
billboardPathLength, billboardPathRange
#endif
#ifdef ANTIALIASING
,
coverageScale
#endif
);
#ifdef DASH_ENABLED
vPathBounds = billboardPathLength * billboardPathRange;
#endif
DECKGL_FILTER_GL_POSITION(currPositionScreen, geometry);
gl_Position = vec4(currPositionScreen.xyz + offset * currPositionScreen.w, currPositionScreen.w);
} else {
prevPosition = project_position(prevPosition, prevPosition64Low);
currPosition = project_position(currPosition, currPosition64Low);
nextPosition = project_position(nextPosition, nextPosition64Low);
width = vec3(project_pixel_size(widthPixels), 0.0);
DECKGL_FILTER_SIZE(width, geometry);
#ifdef ANTIALIASING
vec2 coveragePadding = project_pixel_size(vec2(0.5 / project.devicePixelRatio));
float coverageScale = length(width.xy) > 0.0
? length(width.xy + coveragePadding) / length(width.xy)
: 1.0;
#endif
vec3 offset = getLineJoinOffset(
prevPosition, currPosition, nextPosition, width.xy
#ifdef DASH_ENABLED
, 1.0, vec2(0.0, 1.0)
#endif
#ifdef ANTIALIASING
, coverageScale
#endif
);
#ifdef DASH_ENABLED
vPathBounds = vec2(0.0, vPathLength);
#endif
geometry.position = vec4(currPosition + offset, 1.0);
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,C=`\
#version 300 es
#define SHADER_NAME path-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
#ifdef DASH_ENABLED
in vec2 vPathBounds;
#endif
out vec4 fragColor;
void main(void) {
geometry.uv = vPathPosition;
#ifdef ANTIALIASING
#ifdef DASH_ENABLED
bool isCorner = vPathPosition.y < vPathBounds.x || vPathPosition.y > vPathBounds.y;
#else
bool isCorner = vPathPosition.y < 0.0 || vPathPosition.y > vPathLength;
#endif
bool isRound = vJointType > 0.5;
float bodyCoord = abs(vPathPosition.x);
float cornerCoord = length(vCornerOffset);
float bodyPixels = (1.0 - bodyCoord) / max(fwidth(bodyCoord), 1e-6);
float cornerPixels = (1.0 - cornerCoord) / max(fwidth(cornerCoord), 1e-6);
#ifdef PATH_STYLE_OFFSET
float edgePixels = isRound && isCorner ? min(cornerPixels, bodyPixels) : bodyPixels;
#else
float edgePixels = isRound && isCorner ? cornerPixels : bodyPixels;
#endif
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
discard;
}
if (isCorner) {
if (!isRound && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
fragColor.a *= smoothedge(0.0, edgePixels);
#else
#ifdef DASH_ENABLED
if (vPathPosition.y < vPathBounds.x || vPathPosition.y > vPathBounds.y) {
#else
if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
#endif
if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
discard;
}
if (vJointType < 0.5 && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,A=[0,0,0,255],L={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},antialiasing:!1,billboard:!1,_pathType:null,_projectionTolerance:{type:"number",value:0,min:0},_projectionNoCut:!1,getPath:{type:"accessor",value:e=>e.path},getColor:{type:"accessor",value:A},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},M={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};function T(e,t){return e===t||!!(e&&t&&e.length===t.length&&e.every((e,i)=>e===t[i]))}class O extends r.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:x,fs:C,source:n,plugins:"webgpu"===this.context.device.type?[s]:[],defines:e?{ANTIALIASING:1}:{},modules:[o.A,a.A,l.Ay,h]})}get wrapLongitude(){return!1}getBounds(){return"webgpu"===this.context.device.type?null:this.getAttributeManager()?.getBounds(["vertexPositions"])}getPathProjectionScale(e){let t=this.props.coordinateSystem;if(!this.getAttributeManager()?.getAttributes().instanceDashOffsets)return null;if(e instanceof u.A&&e.zoom>=12&&"meter-offsets"!==t&&"lnglat-offsets"!==t){let i=d.A.getUniforms({viewport:e,coordinateSystem:t,sourceCrs:this.internalState.sourceCrs,coordinateOrigin:this.props.coordinateOrigin,autoWrapLongitude:this.wrapLongitude});return[e.projectionMode,i.coordinateOrigin[1],i.commonOrigin[1],...i.commonUnitsPerWorldUnit,...i.commonUnitsPerWorldUnit2,i.commonUnitsPerMeter[2]]}let i=function(e){if(e.isGeospatial)return null;let{unitsPerMeter:t}=e.distanceScales;return[t[0],t[1],t[2]]}(e);return i?[e.projectionMode,...i]:[e.projectionMode]}shouldUpdateState(e){let{viewport:t}=this.context;return super.shouldUpdateState(e)||this.state?.subdivisionStep!==this.getSubdivisionStep()||!T(this.state?.pathProjectionScale,this.getPathProjectionScale(t))}initializeState(){let e="webgpu"===this.context.device.type;this.getAttributeManager().addInstanced({...e?{pathPositions:{...this.usePositionTransforms(),size:24,type:"float32",transition:!1,accessor:"getPath",update:this.calculateWebGPUPositions,shaderAttributes:{instanceLeftPositions:{size:3,elementOffset:0},instanceStartPositions:{size:3,elementOffset:3},instanceEndPositions:{size:3,elementOffset:6},instanceRightPositions:{size:3,elementOffset:9},instanceLeftPositions64Low:{size:3,elementOffset:12},instanceStartPositions64Low:{size:3,elementOffset:15},instanceEndPositions64Low:{size:3,elementOffset:18},instanceRightPositions64Low:{size:3,elementOffset:21}},noAlloc:!0}}:{vertexPositions:{...this.usePositionTransforms(),size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:M,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}}},instanceTypes:{size:1,type:e?"float32":"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{transform:null,size:1,accessor:"getWidth",transition:!e&&M,defaultValue:1,bufferGroup:"path-instance-data"},instanceColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:!e&&M,defaultValue:A,bufferGroup:"path-instance-data"},rowIndexes:{size:1,type:"uint32",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"path-instance-data"}}),this.setState({pathTesselator:new P({fp64:this.use64bitPositions(),isWebGPU:e}),subdivisionStep:this.getSubdivisionStep(),pathProjectionScale:this.getPathProjectionScale(this.context.viewport)})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:r}=e,s=this.getAttributeManager(),n=s.attributes;n.instanceStrokeWidths.settings.transform=t._projectionTolerance?I:null,n.instanceColors.settings.transform=t._projectionTolerance?R:null;let{viewport:o}=this.context,a=this.state.subdivisionStep!==this.getSubdivisionStep(),l=this.getPathProjectionScale(o),c=!T(this.state.pathProjectionScale,l),h=r.updateTriggersChanged&&(r.updateTriggersChanged.all||r.updateTriggersChanged.getPath),u=r.projectionChanged||this.state.preproject&&(!(0,f.b)(t.modelMatrix,i.modelMatrix,1)||!(0,f.b)(t.coordinateOrigin,i.coordinateOrigin,1))||h||t._projectionTolerance!==i._projectionTolerance||t._projectionNoCut!==i._projectionNoCut||t._pathType!==i._pathType||t.positionFormat!==i.positionFormat||t.wrapLongitude!==i.wrapLongitude||a;if(r.dataChanged||u){let{pathTesselator:e}=this.state,i=t.data.attributes||{},n=(0,E.A)(this.state.packedCrs);if(t._projectionTolerance&&(!n||!this.usePositionTransforms().transform||t._pathType||i.getPath&&!ArrayBuffer.isView(i.getPath.value??i.getPath)||Object.keys(i).some(e=>"getPath"!==e)))throw Error("Projection refinement requires linear target units, normalized paths and per-object attributes");e.updateGeometry({data:t.data,geometryBuffer:i.getPath,buffers:i,normalize:!t._pathType,loop:"loop"===t._pathType,getGeometry:t.getPath,transform:this.usePositionTransforms().transform?.bind(this),positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",resolution:t._projectionNoCut?0:this.getSubdivisionStep(),projectionTolerance:t._projectionTolerance,projectionToleranceScale:n??void 0,dataChanged:u?void 0:r.dataChanged}),this.setState({numInstances:e.instanceCount,startIndices:e.vertexStarts,subdivisionStep:this.getSubdivisionStep(),pathProjectionScale:l}),!r.dataChanged||u?s.invalidateAll():c&&s.invalidate("instanceDashOffsets")}else c&&(this.setState({pathProjectionScale:l}),s.invalidate("instanceDashOffsets"));(r.extensionsChanged||t.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),s.invalidateAll())}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,r=this.props.data;return r[0]&&r[0].__source&&(t.object=r.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{jointRounded:t,capRounded:i,billboard:r,miterLimit:s,widthUnits:n,widthScale:o,widthMinPixels:a,widthMaxPixels:l}=this.props,c=this.state.model,h={jointType:Number(t),capType:Number(i),billboard:r,widthUnits:p.p5[n],widthScale:o,miterLimit:s,widthMinPixels:a,widthMaxPixels:l};c.shaderInputs.setProps({path:h}),c.draw(this.context.renderPass)}_getModel(){return new g.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new m.V2({topology:"triangle-list",attributes:{indices:new Uint16Array([0,1,2,1,4,2,1,3,4,3,5,4]),positions:{value:new Float32Array([0,0,0,-1,0,1,1,-1,1,1,1,0]),size:2}}}),isInstanced:!0})}calculatePositions(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}calculateWebGPUPositions(e){let{pathTesselator:t}=this.state,i=t.get("positions");if(!i){e.value=null;return}let r=t.instanceCount,s=new Float32Array(24*r),n=[-1,0,1,2];for(let e=0;e<r;e++){let t=24*e;for(let o=0;o<4;o++){let a=e+n[o],l=t+3*o;for(let e=0;e<3;e++){let t=a>=0&&a<r?i[3*a+e]:0,n=Math.fround(t);s[l+e]=n,s[l+e+12]=t-n}}}e.startIndices=t.vertexStarts,e.value=s}}O.defaultProps=L,O.layerName="PathLayer";let j=O;function I(e){if(this.props._projectionTolerance&&"number"!=typeof e)throw Error("Projection refinement requires per-object widths");return e}function R(e){if(this.props._projectionTolerance&&("object"==typeof e?.[0]||e?.length>4))throw Error("Projection refinement requires per-object colors");return this.props._projectionTolerance&&"RGB"===this.props.colorFormat&&e?.length===4?e.slice(0,3):e}},98333(e,t,i){function r(e){if(!e||"projected"!==e.coordinateFrame&&"geocentric"!==e.coordinateFrame)return null;let t=e.xUnit.metersPerUnit,i=e.yUnit.metersPerUnit,r=e.zUnit.metersPerUnit;return"number"!=typeof t||!Number.isFinite(t)||t<=0||"number"!=typeof i||!Number.isFinite(i)||i<=0||"number"!=typeof r||!Number.isFinite(r)||r<=0?null:[t,i,r]}function s({data:e,getIndex:t,dataRange:i,replace:r}){let{startRow:n=0,endRow:o=1/0}=i,a=e.length,l=a,c=a;for(let i=0;i<a;i++){let r=t(e[i]);if(l>i&&r>=n&&(l=i),r>=o){c=i;break}}let h=l,u=c-l!==r.length?e.slice(c):void 0;for(let t=0;t<r.length;t++)e[h++]=r[t];if(u){for(let t=0;t<u.length;t++)e[h++]=u[t];e.length=h}return{startRow:l,endRow:l+r.length}}i.d(t,{A:()=>r,J:()=>s})},25889(e,t,i){i.d(t,{GN:()=>a,V2:()=>n,l2:()=>o});var r=i(21357),s=i(61954);class n extends r.V{bufferLayout;constructor(e){let t={},i=new Map;for(let[r,s]of Object.entries(e.attributes)){let e=o(r),n=i.get(e);n&&delete t[n],i.set(e,r),t[r]=s}let r=e.indices,s=r instanceof Uint8Array?new Uint16Array(r):r&&!ArrayBuffer.isView(r)&&r.value instanceof Uint8Array?{...r,value:new Uint16Array(r.value)}:r;for(let[i,r]of(super({...e,attributes:t,indices:s}),Object.entries(t)))!ArrayBuffer.isView(r)&&Object.isExtensible(r)&&"indices"!==i&&(Object.assign(r,this.attributes[i]),this.attributes[i]=r);this.bufferLayout=e.bufferLayout||a(this.attributes)}}function o(e){switch(e){case"POSITION":return"positions";case"NORMAL":return"normals";case"TEXCOORD_0":return"texCoords";case"TEXCOORD_1":return"texCoords1";case"COLOR_0":return"colors";default:return e}}function a(e){let t=[];for(let[i,r]of Object.entries(e)){if(!r)continue;let{value:e,size:n,normalized:a}=r;if(void 0===n)throw Error(`Attribute ${i} is missing a size`);t.push({name:o(i),format:s.E.getVertexFormatFromAttribute(e,n,a)})}return t}},72855(e,t,i){i.d(t,{N6:()=>l,d3:()=>c});var r=i(8994),s=i(25889),n=i(61954);function o(e,t){return Math.ceil(e/t)*t}var a=i(42860);class l{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||(0,a.L)("geometry"),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&r.h.INDEX))throw Error("Index buffer must have INDEX usage")}destroy(){for(let e of(this.indices?.destroy(),Object.values(this.attributes)))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}}function c(e,t){if(t instanceof l)return t;let i=function(e,t={}){let i=t.bufferName||"geometry";if(function(e,t){if(e.bufferLayout?.length!==1)return!1;let i=e.bufferLayout[0];return i.name===t&&!!i.attributes?.length&&!!e.attributes[t]}(e,i))return e;let r=t.minAttributeAlignment||4,a=function(e,t){let i=new Map;for(let r of t||Object.keys(e.attributes)){let t=e.attributes[r];t&&i.set((0,s.l2)(r),[r,t])}return Array.from(i.values())}(e,t.attributes),l=[],c=0,h=1/0;for(let[e,t]of a){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:i,size:a,normalized:u}=t;if(!ArrayBuffer.isView(i))throw Error(`Attribute ${e} is missing typed array data`);if(void 0===a)throw Error(`Attribute ${e} is missing a size`);let d=n.E.getVertexFormatFromAttribute(i,a,u),f=n.E.getVertexFormatInfo(d);c=o(c,r),l.push({sourceName:e,attributeName:(0,s.l2)(e),value:i,size:a,format:d,byteOffset:c,byteLength:f.byteLength}),c+=f.byteLength;let p=i.length/a;if(!Number.isInteger(p))throw Error(`Attribute ${e} length is not divisible by size`);h=Math.min(h,p)}if(0===l.length||!Number.isFinite(h))throw Error(`Geometry ${e.id} has no interleavable attributes`);let u=o(c,r),d=new ArrayBuffer(h*u);for(let e of l)!function(e,t,i,r){let s=r.value.constructor,n=s.BYTES_PER_ELEMENT;if(r.byteOffset%n!=0||i%n!=0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new s(e),a=r.value,l=r.byteOffset/n,c=i/n;for(let e=0;e<t;e++){let t=e*r.size,i=e*c+l;for(let e=0;e<r.size;e++)o[i+e]=a[t+e]}}(d,h,u,e);return new s.V2({id:e.id,topology:e.topology||"triangle-list",vertexCount:e.vertexCount,indices:e.indices,attributes:{[i]:{value:new Uint8Array(d),size:u,byteStride:u}},bufferLayout:[{name:i,stepMode:"vertex",byteStride:u,attributes:l.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}(t),a=function(e,t){if(!t.indices)return;let i=t.indices.value;return e.createBuffer({usage:r.h.INDEX,data:i})}(e,i),{attributes:c,bufferLayout:h}=function(e,t){let i={};for(let[r,n]of Object.entries(t.attributes)){let o=t.bufferLayout?.find(e=>e.name===r)?.name||(0,s.l2)(r);n&&(i[o]=e.createBuffer({data:n.value,id:`${r}-buffer`}))}return{attributes:i,bufferLayout:t.bufferLayout||(0,s.GN)(t.attributes),vertexCount:t.vertexCount}}(e,i);return new l({topology:i.topology||"triangle-list",bufferLayout:h,vertexCount:i.vertexCount,indices:a,attributes:c})}},8306(e,t,i){i.d(t,{M:()=>o,t:()=>a});var r=i(61954),s=i(72855),n=i(14840);function o(e,t){let i=(0,s.d3)(e,t);try{let e=a(i);return e.destroy=()=>i.destroy(),e}catch(e){throw i.destroy(),e}}function a(e){let t={};for(let[i,s]of Object.entries(e.attributes)){let n=e.bufferLayout.find(e=>e.name===i),o=n?.format,a=n?.byteStride??(o?r.E.getVertexFormatInfo(o).byteLength:0),l=e.indices&&a?Math.floor(s.byteLength/a):e.vertexCount;t[i]={name:i,format:o,length:l,byteStride:a,rowByteLength:a,bufferLayout:n,data:[{buffer:s,byteOffset:0,length:l,format:o,byteStride:a,rowByteLength:a}]}}if(e.indices){let e=Math.min(...Object.values(t).map(e=>e.length));for(let[i,r]of Object.entries(t))t[i]={...r,length:e,data:r.data.map(t=>({...t,length:e}))}}let i=e.indices,s=i?.indexType==="uint32"?4:i?.indexType==="uint8"?1:2,o=i?i.byteLength/s:0,a=i?{name:"indices",format:i.indexType,length:o,byteStride:s,rowByteLength:s,data:[{buffer:i,byteOffset:0,length:o,format:i.indexType,byteStride:s,rowByteLength:s}]}:null;return new n.u({attributes:t,indices:a,topology:e.topology,vertexCount:e.vertexCount,bufferLayout:e.bufferLayout})}},14840(e,t,i){i.d(t,{u:()=>r});class r{attributes;indices;topology;vertexCount;bufferLayout;destroy(){}constructor(e){this.attributes=e.attributes,this.indices=e.indices??null,this.topology=e.topology??"triangle-list",this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout}}},9587(e,t,i){i.d(t,{q:()=>s,t:()=>n});var r=i(61954);function s(e,t,i){for(let[r,s]of Object.entries(t)){if(!s)continue;if(!s.format)throw Error(`${e} GPUVector "${r}" requires a format`);let t=i.find(e=>e.name===r);if(!t)throw Error(`${e} GPUVector "${r}" requires a Model buffer layout`);let n=t.attributes??[];if(n.length>1)throw Error(`${e} GPUVector "${r}" does not support interleaved layouts`);let a=n[0],l=t.format??a?.format,c=o(e,r,s.format),h=t.byteStride??c.byteLength;if(l!==s.format||h!==s.byteStride||s.rowByteLength!==c.byteLength)throw Error(`${e} GPUVector "${r}" must match its Model buffer layout`)}}function n(e,t){let i=Object.entries(t).filter(e=>void 0!==e[1]);if(0===i.length)return[];let[r,s]=i[0];for(let[t,n]of i){if(!n.format)throw Error(`${e} GPUVector "${t}" requires a format`);if(o(e,t,n.format),n.length!==s.length)throw Error(`${e} GPUVector "${t}" rows must match "${r}" rows`);if(n.data.length!==s.data.length)throw Error(`${e} GPUVector chunk counts must align`)}let n=0;return s.data.map((t,r)=>{let s={};for(let[n,o]of i){let i=o.data[r];if(!i||i.length!==t.length)throw Error(`${e} GPUVector chunk ${r} row counts must align`);if(i.format!==o.format||i.byteStride!==o.byteStride||i.rowByteLength!==o.rowByteLength)throw Error(`${e} GPUVector "${n}" chunk layout must be stable`);s[n]=i}let o={batchIndex:r,rowIndexOffset:n,rowCount:t.length,data:s};return n+=t.length,o})}function o(e,t,i){if(i.includes("<"))throw Error(`${e} GPUVector "${t}" requires a fixed-width scalar format`);return r.E.getVertexFormatInfo(i)}},55077(e,t,i){i.d(t,{X:()=>q});var r=i(92648),s=i(93495),n=i(58006),o=i(46779),a=i(64344),l=i(6971),c=i(82873),h=i(9479),u=i(8994),d=i(55861),f=i(62217),p=i(28888),g=i(57285),m=i(95377),v=i(20861),y=i(3687);class _{device;buffer;byteOffset=0;constructor(e){this.device=e}prepare(e){if(!this.buffer||this.buffer.byteLength<e){let t=Math.max(1024,(this.buffer?.byteLength??0)*2,e),i=this.device.createBuffer({id:"batch-uniforms",byteLength:t,usage:u.h.UNIFORM|u.h.COPY_DST});this.buffer?.destroy(),this.buffer=i}this.byteOffset=0}getAlignedByteLength(e){let t=this.device.limits.minUniformBufferOffsetAlignment||1;return Math.ceil(e/t)*t}write(e){(0,n.v)(this.buffer&&this.byteOffset+e.byteLength<=this.buffer.byteLength);let t={buffer:this.buffer,offset:this.byteOffset,size:e.byteLength};return this.buffer.write(e,t.offset),this.byteOffset+=this.getAlignedByteLength(e.byteLength),t}destroy(){this.buffer?.destroy(),this.buffer=void 0,this.byteOffset=0}}let b="__debugFramebufferState";function w(e,t){if(!e)return t;let i=Number.parseInt(e,10);return Number.isFinite(i)?i:t}function P(e,t,i){if(e===t)return!0;if(!i||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!P(e[r],t[r],i-1))return!1;return!0}if(Array.isArray(t))return!1;if("object"==typeof e&&"object"==typeof t){let r=Object.keys(e),s=Object.keys(t);if(r.length!==s.length)return!1;for(let s of r)if(!t.hasOwnProperty(s)||!P(e[s],t[s],i-1))return!1;return!0}return!1}var S=i(91047);class E{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return(0,S.TC)(e)}mergeBufferLayouts(e,t){let i=[...e];for(let e of t){let t=i.findIndex(t=>t.name===e.name);t<0?i.push(e):i[t]=e}return i}}function x(e,t){let i=(0,S.Lv)(e),r=t.slice();return r.sort((e,t)=>(0,S.Ef)((0,S.TC)(e).map(e=>i[e]))-(0,S.Ef)((0,S.TC)(t).map(e=>i[e]))),r}var C=i(25847);function A(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let i={...e,bindings:e.bindings.map(e=>({...e}))};for(let r of("attributes"in(e||{})&&(i.attributes=e?.attributes||[]),t))for(let e of r.bindingLayout||[])for(let t of function(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith("Uniforms")||t.add(`${e}Sampler`),[...t]}(e.name)){let r=i.bindings.find(e=>e.name===t);r?.group===0&&(r.group=e.group),r&&void 0!==e.visibility&&(r.visibility=e.visibility)}return i}function L(e){return!!(e.uniformTypes&&!function(e){for(let t in e)return!1;return!0}(e.uniformTypes))}var M=i(35972),T=i(42860),O=i(9587);function j(e){let t;for(let i of Object.values(e)){if(!i||"isConstant"in i)continue;let e=0;for(let t of i.data)e+=t.length;if((0,n.v)(e===i.length),t){(0,n.v)(i.length===t.length&&i.data.length===t.data.length);for(let e=0;e<i.data.length;e++)(0,n.v)(i.data[e].length===t.data[e].length)}else t=i}}function I(e){let t=0;return e.map(e=>{let i=t;for(let i of Object.values(e))if(i&&"data"in i){t+=i.length;break}return i})}var R=i(61954);class D{device;id;inputs={};sourceLayouts;stepMode="vertex";claimedNames=new Set;layouts=[];buffers={};byteOffsets={};constants={};rowCount;vertexCount;instanceCount;constantBuffers={};constructor(e,t){this.device=e,this.id=t}setInputs(e,t,i,r=!0){if(r)j(e);else for(let t of Object.values(e))t&&!B(t)&&(0,n.v)(1===t.data.length);this.claimedNames.clear(),this.inputs=e,this.sourceLayouts=t,this.stepMode=i,this.rowCount=void 0,this.vertexCount=void 0,this.instanceCount=void 0;let s=t??Object.entries(e).flatMap(([e,t])=>t&&!B(t)&&t.bufferLayout?[{...t.bufferLayout,name:e}]:[]),o=Object.entries(e).flatMap(([e,t])=>{if(!t||s.some(t=>t.name===e||t.attributes?.some(t=>t.attribute===e)))return[];(0,n.v)(t.format);let r=t.format;return[{name:e,stepMode:i,byteStride:B(t)?0:t.byteStride,attributes:[{attribute:e,format:r,byteOffset:0}]}]}),a=[...s,...function(e,t){let i,r=[],s=0;for(let n of[...t].sort((t,i)=>{let r=e[t.name],s=e[i.name];return(r&&!B(r)?r.data[0]?.byteOffset??0:0)-(s&&!B(s)?s.data[0]?.byteOffset??0:0)})){let t=e[n.name],o=n.attributes[0];if(B(t)){i||(i={...n,attributes:[]},r.push(i));let e=Math.min(4,t.byteLength);s=Math.ceil(s/e)*e,i.attributes.push({...o,byteOffset:s}),s+=t.byteLength;continue}let a=r.find(i=>{let r=e[i.name];if(!r||B(r)||!r.data.length||!t.data.length)return!1;let s=t.data[0].byteOffset-r.data[0].byteOffset;return i.stepMode===n.stepMode&&i.byteStride===n.byteStride&&s>=0&&s+t.rowByteLength<=t.byteStride&&t.data.every((e,t)=>{let i=r.data[t];return e.buffer===i.buffer&&e.byteStride===i.byteStride&&e.byteOffset-i.byteOffset===s})});if(a){let i=e[a.name];a.attributes.push({...o,byteOffset:t.data[0].byteOffset-i.data[0].byteOffset})}else r.push({...n,attributes:[...n.attributes]})}return r}(e,o)];for(let[t,s]of Object.entries(e))if(s){if(!B(s)&&!Array.isArray(s.data))throw TypeError(`Expected a GPU vector or constant for ${t}`);if(!B(s)&&r){let e=a.find(e=>e.name===t||e.attributes?.some(e=>e.attribute===t));"instance"===(e?.stepMode??i)?((0,n.v)(void 0===this.instanceCount||this.instanceCount===s.length),this.instanceCount=s.length):((0,n.v)(void 0===this.vertexCount||this.vertexCount===s.length),this.vertexCount=s.length),this.rowCount="instance"===i?this.instanceCount:this.vertexCount}this.claimedNames.add(t)}this.layouts=a.flatMap(t=>{let r=e[t.name],s=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]),n=s.filter(t=>B(e[t.attribute])),o={...t,stepMode:t.stepMode??i};return"webgpu"!==this.device.type||r&&!B(r)&&r.bufferLayout||!n.length||n.length===s.length?[{...o,byteStride:n.length===s.length&&n.length?0:o.byteStride}]:[{...o,attributes:s.filter(t=>!B(e[t.attribute]))},{...o,name:`${t.name}-constants`,byteStride:0,attributes:n}]}),this.buffers={},this.byteOffsets={},this.constants={};let l=new Set;for(let t of this.layouts){this.claimedNames.add(t.name);let i=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]);for(let e of i)this.claimedNames.add(e.attribute);let r=e[t.name];if(r&&!B(r)){let e=r.bufferLayout||!r.format?0:(i.find(e=>e.attribute===t.name)??i[0])?.byteOffset??0;this.bindVector(t.name,r,e)}let s=0;for(let r of i){let i=e[r.attribute]??(r.attribute===t.name?e[t.name]:void 0);i&&((0,n.v)(void 0===i.format||i.format===r.format),B(i)?(this.constants[r.attribute]=function(e){let t=R.E.getVertexFormatInfo(e.format);if("unorm10-10-10-2"===e.format){let t=e.value[0];return new Float32Array([(1023&t)/1023,(t>>>10&1023)/1023,(t>>>20&1023)/1023,(t>>>30)/3])}let i=Array.from(e.value);if("unorm8x4-bgra"===e.format&&([i[0],i[2]]=[i[2],i[0]]),t.normalized){let r=8*e.value.BYTES_PER_ELEMENT,s=2**r-1;return new Float32Array(i.map(e=>t.signed?(e+2**(r-1))/s*2-1:e/s))}return t.integer?t.signed?new Int32Array(i):new Uint32Array(i):new Float32Array(i)}(i),s=Math.max(s,(r.byteOffset??0)+i.byteLength)):this.buffers[t.name]||this.bindVector(t.name,i,r.byteOffset??0))}if("webgpu"===this.device.type&&s&&!this.buffers[t.name]){let r=new Uint8Array(4*Math.ceil(s/4));for(let t of i){let i=e[t.attribute];B(i)&&r.set(new Uint8Array(i.value.buffer,i.value.byteOffset,i.byteLength),t.byteOffset??0)}let n=this.constantBuffers[t.name];(!n||n.byteLength<r.byteLength)&&(n?.destroy(),n=this.device.createBuffer({id:`${this.id}-${t.name}-constant`,byteLength:r.byteLength,usage:u.h.VERTEX|u.h.COPY_DST|u.h.COPY_SRC}),this.constantBuffers[t.name]=n),n.write(r),this.buffers[t.name]=n,l.add(t.name)}}for(let[e,t]of Object.entries(this.constantBuffers))l.has(e)||(t.destroy(),delete this.constantBuffers[e])}get batchCount(){let e=Object.values(this.inputs).find(e=>e&&!B(e));return e&&!B(e)?e.data.length:1}getBatch(e){return Object.fromEntries(Object.entries(this.inputs).map(([t,i])=>{if(!i||B(i))return[t,i];let r=i.data[e];return[t,{...i,length:r?.length??0,data:r?[r]:[]}]}))}destroy(){for(let e of Object.values(this.constantBuffers))e.destroy();this.constantBuffers={}}bindVector(e,t,i){let r=t.data[0];if(!r)return;let s=r.byteOffset-i;(0,n.v)(s>=0),this.buffers[e]=r.buffer,this.byteOffsets[e]=s}}function B(e){return!!(e&&"isConstant"in e&&e.isConstant)}var k=i(37979);class z{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){for(let i of(Object.assign(this.options,t),(0,k.$Q)(Object.values(e).filter(G))))e[i.name]=i;for(let[t,i]of(a.R.log(1,"Creating ShaderInputs with modules",Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={},Object.entries(e)))i&&(this._addModule(i),i.name&&t!==i.name&&!this.options.disableWarnings&&a.R.warn(`Module name: ${t} vs ${i.name}`)())}destroy(){}setProps(e){for(let t of(e.bindings&&Object.assign(this.directBindings,e.bindings),Object.keys(e))){if("bindings"===t)continue;let i=e[t]||{},r=this.modules[t];if(r){let e=this.moduleUniforms[t],s=this.moduleBindings[t],{uniforms:n,bindings:o}=function(e,t={}){let i={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{var s;let n=e[r];Object.prototype.hasOwnProperty.call(t,r)||(Array.isArray(s=n)?0===s.length||"number"==typeof s[0]:ArrayBuffer.isView(s)&&!(s instanceof DataView))||"number"==typeof s||"boolean"==typeof s?i.uniforms[r]=n:i.bindings[r]=n}),i}(r.getUniforms?.(i,e)||i,r.uniformTypes);this.moduleUniforms[t]=V(e,n,r.uniformTypes),this.moduleBindings[t]={...s,...o}}else this.options.disableWarnings||a.R.warn(`Module ${t} not found`)()}}getModules(){return Object.values(this.modules)}addModules(e){for(let t of(0,k.$Q)(e)){let e=t.name;this.modules[e]||(this.modules[e]=t,this._addModule(t))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,i]of Object.entries(this.moduleUniforms))for(let[r,s]of Object.entries(i))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(s)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=V({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}}function V(e={},t={},i={}){let r={...e};for(let[s,n]of Object.entries(t))void 0!==n&&(r[s]=function e(t,i,r){if(!r||"string"==typeof r)return U(i);if(Array.isArray(r)){if(F(i)||!Array.isArray(i))return U(i);let s=Array.isArray(t)&&!F(t)?[...t]:[],n=s.slice();for(let t=0;t<i.length;t++){let o=i[t];void 0!==o&&(n[t]=e(s[t],o,r[0]))}return n}if(!N(i))return U(i);let s=N(t)?t:{},n={...s};for(let[t,o]of Object.entries(i))void 0!==o&&(n[t]=e(s[t],o,r[t]));return n}(e[s],n,i[s]));return r}function U(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?F(e)?e.slice():e.map(e=>void 0===e?void 0:U(e)):N(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,void 0===t?void 0:U(t)])):e}function F(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(0===e.length||"number"==typeof e[0])}function N(e){return!!e&&"object"==typeof e&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function G(e){return!!e?.dependencies}var $=i(7036),W=i(68234);let Y="render pipeline initialization failed",H=["stencil8","depth16unorm","depth24plus","depth24plus-stencil8","depth32float","depth32float-stencil8"];class q{static async createAsync(e,t){let i,s=!r.N.getAsyncCompilation(e),n=s?r.N.beginAsyncCompilation(e):r.N.getAsyncCompilation(e);try{i=new this(e,t)}finally{s&&r.N.endAsyncCompilation(e,n)}try{return s?await Promise.all(n):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}static defaultProps={...s.r.defaultProps,inferDrawCount:"no",enforceMatchingVectorLengths:!0,geometry:null,attributeVectors:void 0,source:void 0,sourceLanguage:void 0,vs:null,fs:null,id:"unnamed",handle:void 0,userData:{},defines:{},modules:[],plugins:[],indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:void 0,debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;_uniformStore;_attributeInfos={};props;batchUniformBuffer;geometryVectorBindings;attributeVectorBindings;explicitBufferLayout=[];constructorDrawCounts;constructorDrawOffsets;drawingVectorBatches=!1;indexVector=null;currentAttributes={};currentAttributeByteOffsets={};_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate="newly created";_needsRedraw="initializing";_drawBlockedReason=!1;_destroyed=!1;_vertexCountSet=!1;_lastDrawTimestamp=-1;_bindingTable=[];_pipelineInitialization;get[Symbol.toStringTag](){return"Model"}toString(){return`Model(${this.id})`}constructor(e,t){this.constructorDrawOffsets={firstVertex:t.firstVertex,firstIndex:t.firstIndex};let i=this.constructor.defaultProps;this.constructorDrawCounts={vertexCount:t.vertexCount??(i.vertexCount||void 0),instanceCount:t.instanceCount??(i.instanceCount||void 0)};let s=i.shaderAssembler,a=Object.hasOwn(t,"vertexCount");this.props={...i,...t,shaderAssembler:t.shaderAssembler??(s&&J(s,e.info.shadingLanguage)?s:"wgsl"===e.info.shadingLanguage?new y.R:new v.U)},this._vertexCountSet=a,t=this.props,this.id=t.id||(0,T.L)("model"),this.device=e,Object.assign(this.userData,t.userData),this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,this.isInstanced=t.isInstanced??(!!t.instanceCount||void 0),this.explicitBufferLayout=this.bufferLayout,this.geometryVectorBindings=new D(e,`${this.id}-geometry`),this.attributeVectorBindings=new D(e,`${this.id}-attributes`);try{this._initializeProps(t);let i=(0,M.O)(e),s=(0,m.r)(this.props.plugins,i.shaderLanguage),a=(0,m.K)(this.props.modules,s.modules),h=Object.fromEntries(a.map(e=>[e.name,e])),u=t.shaderInputs||new z(h,{disableWarnings:this.props.disableWarnings});t.shaderInputs&&s.modules.length>0&&u.addModules(s.modules),this.setShaderInputs(u);let d=function(e,t){let i=[],r=new Set;for(let s of[...e||[],...t||[]])r.has(s.name)||(r.add(s.name),i.push(s));return i}(this.props.modules,u.getModules()),f={...s.defines,...this.props.defines};if("webgl"===this.device.type&&(this.props._uniformBlockLayouts=function(e){let t=[];for(let i of e){let e=(0,C.Uj)(i),r=new Set([i.vs,i.fs].flatMap(e=>e?(0,C.V$)(e).filter(e=>e.isStd140).map(e=>e.blockName):[])),s=r.has(e)?e:1===r.size?r.values().next().value:void 0;L(i)&&s&&t.push({name:s,uniformTypes:i.uniformTypes})}return t}(d)),this.props.shaderLayout=A(this.props.shaderLayout,d)||null,"webgpu"===this.device.type&&this.props.source){var l,c;let t=this.props.shaderAssembler;(0,n.v)(J(t,"wgsl"));let{source:r,getUniforms:o,bindingTable:a,entryPoints:h={},shaderLayout:u}=t.assembleWGSLShader({platformInfo:i,...this.props,modules:d,defines:f,pluginInjectionTargets:s.injectionTargets,pluginInjections:s.injections,pluginVertexInputs:s.vertexInputs,pluginInterStageVariables:s.interStageVariables});this.source=r,this.props.vertexEntryPoint=h.vertex||this.props.vertexEntryPoint,this.props.fragmentEntryPoint=h.fragment||this.props.fragmentEntryPoint,this._getModuleUniforms=o,this._bindingTable=a;let p=(l=u??e.getShaderLayout?.(this.source),c=s.vertexInputs,l&&0!==Object.keys(c).length?{...l,attributes:l.attributes.map(e=>{let t=e.name.startsWith("_luma_")?e.name.slice(6):null;return t&&c[t]?{...e,name:t}:e})}:l),g=function(e,t,i=[]){return e?t?{...e,attributes:e.attributes.length?function(e,t){let i=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),s=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let n=s.get(e.location);if(n)throw Error(`Shader attributes "${n.name}" and "${e.name}" both use location ${e.location}`);i.push({...e})}return i}(e.attributes,t.attributes.filter(e=>i.includes(e.name))):t.attributes,bindings:function(e,t){let i=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),s=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;r.has(e.name)||s.has(t)||i.push({...e})}return i}(e.bindings,t.bindings)}:e:t}(this.props.shaderLayout,p,Object.keys(s.vertexInputs));this.props.shaderLayout=A(g||null,d)||null}else{let e=this.props.shaderAssembler;(0,n.v)(J(e,"glsl"));let{vs:t,fs:r,getUniforms:o}=e.assembleGLSLShaderPair({platformInfo:i,...this.props,modules:d,defines:f,pluginInjectionTargets:s.injectionTargets,pluginInjections:s.injections,pluginVertexInputs:s.vertexInputs,pluginInterStageVariables:s.interStageVariables});this.vs=t,this.fs=r,this._getModuleUniforms=o,this._bindingTable=[]}this.pipelineFactory=t.pipelineFactory||r.N.getDefaultPipelineFactory(this.device),this.shaderFactory=t.shaderFactory||o.g.getDefaultShaderFactory(this.device);let p=r.N.getAsyncCompilation(this.device);p?(this._pipelineInitialization=this._initializePipelineAsync(t),p.push(this._pipelineInitialization)):(this.pipeline=this._updatePipeline(),this._initializePipelineResources(t))}catch(e){try{q.prototype.destroy.call(this)}finally{throw e}}}_initializeProps(e){e.geometry&&this.setGeometry(e.geometry),e.attributeVectors&&this.setAttributeVectors(e.attributeVectors)}_usesManagedUniformBuffer(e){return!0}async _initializePipelineAsync(e){await this._updatePipelineAsync(),this._initializePipelineResources(e)}_initializeAttributes(){this.applyVectorAttributes(),this.indexVector&&this.bindIndexVector()}_initializePipelineResources(e){this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._initializeAttributes(),e.indexBuffer&&this.setIndexBuffer(e.indexBuffer),void 0!==e.indexCount&&this.setIndexCount(e.indexCount),void 0!==this.constructorDrawOffsets.firstVertex&&(this.firstVertex=this.constructorDrawOffsets.firstVertex),void 0!==this.constructorDrawOffsets.firstIndex&&(this.firstIndex=this.constructorDrawOffsets.firstIndex),void 0!==e.isInstanced&&(this.isInstanced=e.isInstanced),void 0!==this.constructorDrawCounts.instanceCount&&this.setInstanceCount(this.constructorDrawCounts.instanceCount),void 0!==this.constructorDrawCounts.vertexCount&&this.setVertexCount(this.constructorDrawCounts.vertexCount),e.attributes&&this.setAttributes(e.attributes),e.constantAttributes&&this.setConstantAttributes(e.constantAttributes),e.bindings&&this.setBindings(e.bindings),e.transformFeedback&&(this.transformFeedback=e.transformFeedback)}destroy(){this._destroyed||(this.pipeline&&(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs)),this.vertexArray?.destroy(),this.geometryVectorBindings.destroy(),this.attributeVectorBindings.destroy(),this._uniformStore?.destroy(),this.batchUniformBuffer?.destroy(),this._destroyed=!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw("contents of bound textures or buffers updated");let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e,t){return t?.parameters?this._withDrawParameters(e,t.parameters,()=>this._draw(e)):this._draw(e)}_withDrawParameters(e,t,i){let r=e.getParameters();try{return e.setParameters(t),i()}finally{e.setParameters(r)}}_draw(e){let t;if(this.indexVector?.length===0)return this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1,!0;if(!this.drawingVectorBatches&&(1!==this.geometryVectorBindings.batchCount||1!==this.attributeVectorBindings.batchCount))return this.drawVectorGroups(e);if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return a.R.info(2,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let i=this._areBindingsLoading();if(i)return a.R.info(2,`>>> DRAWING ABORTED ${this.id}: ${i} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),"webgpu"===this.device.type?(this.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored)a.R.info(2,`>>> DRAWING ABORTED ${this.id}: ${Y}`)(),t=!1;else{let i=this.vertexArray.getDrawValidationError();if(i)a.R.info(2,`>>> DRAWING ABORTED ${this.id}: ${i}`)(),this._drawBlockedReason=i,t=!1;else{let i=this._getCurrentShaderLayout(),r=this._getBindings(i),s=this._getBindGroups(i,r),{indexBuffer:n}=this.vertexArray,o=n?this.indexCount??(this._vertexCountSet?this.vertexCount:n.byteLength/("uint32"===n.indexType?4:2)):void 0;e.setPipeline(this.pipeline),e.setBindings(s,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),t=!0===this.isInstanced&&0===this.instanceCount||e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),t?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=Y,this._drawBlockedReason=Y):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw="waiting for resource initialization",t}setGeometry(e){e&&this.setTopology(e.topology),this.setGeometryVectors(e?.attributes??{},e?.bufferLayout),this.setIndexVector(e?.indices??null),e?.vertexCount!==void 0&&this.setVertexCount(e.vertexCount)}setGeometryVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.geometryVectorBindings.sourceLayouts),this.validateVectorLengthPolicy(),this.props.enforceMatchingVectorLengths&&j(e),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||void 0!==this.attributeVectorBindings.vertexCount)&&j([...Object.values(e),...Object.values(this.attributeVectorBindings.inputs)]),this.geometryVectorBindings.setInputs(e,t,"vertex",this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.geometryVectorBindings),this.syncVectorBindings();let i=this.geometryVectorBindings.rowCount;(0,n.v)(void 0===i||void 0===this.attributeVectorBindings.vertexCount||i===this.attributeVectorBindings.vertexCount),"vertex"===this.props.inferDrawCount&&this.setVertexCount(i??this.attributeVectorBindings.vertexCount??0)}setAttributeVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.attributeVectorBindings.sourceLayouts),void 0===this.isInstanced&&(t?.some(e=>"instance"===e.stepMode)||Object.values(e).some(e=>e&&"data"in e&&e.bufferLayout?.stepMode==="instance"))&&(this.isInstanced=!0);let i=!this.isInstanced||Object.entries(e).some(([e,i])=>i&&"data"in i&&(t?.find(t=>t.name===e||t.attributes?.some(t=>t.attribute===e))?.stepMode??i.bufferLayout?.stepMode)==="vertex");this.validateVectorLengthPolicy(),i&&this.props.enforceMatchingVectorLengths&&j([...Object.values(this.geometryVectorBindings.inputs),...Object.values(e)]),this.attributeVectorBindings.setInputs(e,t,this.isInstanced?"instance":"vertex",this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.attributeVectorBindings),this.syncVectorBindings(),"instance"===this.props.inferDrawCount&&void 0!==this.attributeVectorBindings.instanceCount&&this.setInstanceCount(this.attributeVectorBindings.instanceCount);let r=this.attributeVectorBindings.vertexCount;if(void 0!==r&&"vertex"===this.props.inferDrawCount){let e=this.geometryVectorBindings.rowCount;(0,n.v)(void 0===e||e===r),void 0===e&&this.setVertexCount(r)}}setGPUAttributes(e,t){this.setAttributeVectors(e,t)}setIndexVector(e){e&&((0,n.v)("uint8"===e.format||"uint16"===e.format||"uint32"===e.format),(0,n.v)(e.data.length<=1),(0,n.v)(e.byteStride===("uint32"===e.format?4:"uint16"===e.format?2:1))),this.indexVector=e,this.vertexArray&&this.bindIndexVector()}bindIndexVector(){let e=this.indexVector,t=e?.data[0];if(t&&this.indexVector){let e=t.buffer instanceof $.kL?t.buffer.buffer:t.buffer;(0,n.v)(e.indexType===this.indexVector.format&&t.byteOffset%this.indexVector.byteStride==0)}this.indexVector=null,this.setIndexBuffer(t?.buffer??null),this.indexVector=e,this.indexCount=e?.length,this.setDrawOffsets({firstVertex:t?.byteOffset??0,firstIndex:t?t.byteOffset/this.indexVector.byteStride:0})}claimVectorLayouts(e){this.explicitBufferLayout=this.explicitBufferLayout.filter(t=>!e.claimedNames.has(t.name)&&!t.attributes?.some(t=>e.claimedNames.has(t.attribute)))}getExplicitVectorLayouts(e,t=this.explicitBufferLayout){let i=new Set(Object.keys(e)),r=t.filter(e=>i.has(e.name)||e.attributes?.some(e=>i.has(e.attribute)));return r.length?r:void 0}getVectorBufferLayout(){let e=[this.geometryVectorBindings,this.attributeVectorBindings];return[...this.explicitBufferLayout.filter(t=>!e.some(e=>e.claimedNames.has(t.name)||t.attributes?.some(t=>e.claimedNames.has(t.attribute)))),...this.geometryVectorBindings.layouts,...this.attributeVectorBindings.layouts]}syncVectorBindings(){let e=this.getVectorBufferLayout();this.vertexArray?(this.applyBufferLayout(e),this.applyVectorAttributes()):this.bufferLayout=e}applyVectorAttributes(){let e=new Set(this.bufferLayout.map(e=>e.name));for(let t of Object.keys(this.currentAttributes))e.has(t)||delete this.currentAttributes[t];this.setAttributes({...this.currentAttributes,...this.geometryVectorBindings.buffers,...this.attributeVectorBindings.buffers},{byteOffsets:{...this.currentAttributeByteOffsets,...this.geometryVectorBindings.byteOffsets,...this.attributeVectorBindings.byteOffsets},disableWarnings:!0}),"webgl"===this.device.type&&this.setConstantAttributes({...this.geometryVectorBindings.constants,...this.attributeVectorBindings.constants})}setGPUVectors(e,t){let i=(0,O.t)(this.id,e);(0,n.v)(i.length<=1),(0,O.q)(this.id,e,this.bufferLayout),i[0]&&this.setGPUData(i[0].data),this.setBatchDrawCount(i[0]?.rowCount??0,t?.count)}drawVectorGroups(e){let t=this.drawingVectorBatches,i=this._vertexCountSet;this.drawingVectorBatches=!0;try{let t=function(e,t,i,r,s,n){let o=t.inputs,a=i.inputs,l=t.sourceLayouts,c=i.sourceLayouts,h=t.layouts,u=i.layouts,d=i.stepMode,f=t.batchCount,p=i.batchCount,g=Array.from({length:f},(e,i)=>t.getBatch(i)),m=Array.from({length:p},(e,t)=>i.getBatch(t)),v=I(g),y=I(m),_=e.vertexCount,b=e.instanceCount,w=!0;try{let o=e.isInstanced&&void 0===i.vertexCount,a=o?f*p:Math.max(f,p);if(0===f||0===p)return!0;for(let l=0;l<a;l++){let a=o?Math.floor(l/p):Math.min(l,f-1),c=o?l%p:Math.min(l,p-1);t.setInputs(g[a],h,"vertex"),i.setInputs(m[c],u,d),r();let P=void 0!==t.rowCount?v[a]:void 0!==i.vertexCount?y[c]:0;"vertex"===n&&e.setVertexCount(Math.max(0,Math.min(t.rowCount??i.vertexCount??_,_-P))),"instance"===n&&void 0!==i.instanceCount&&e.setInstanceCount(Math.max(0,Math.min(i.instanceCount,b-y[c]))),(e.indexBuffer||0!==e.vertexCount)&&(!e.isInstanced||0!==e.instanceCount)&&(w=s()&&w)}}finally{t.setInputs(o,l,"vertex"),i.setInputs(a,c,d),r(),e.setVertexCount(_),e.setInstanceCount(b)}return w}(this,this.geometryVectorBindings,this.attributeVectorBindings,()=>this.syncVectorBindings(),()=>q.prototype.draw.call(this,e),this.props.inferDrawCount);return t&&(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1),t}finally{this._vertexCountSet=i,this.drawingVectorBatches=t}}drawBatches(e,{vectors:t,onBatch:i}){let r=(0,O.t)(this.id,t);for(let e of((0,O.q)(this.id,t,this.bufferLayout),Object.keys(t)))(0,n.v)(!t[e]||this.currentAttributes[e]);let s={...this.currentAttributes},o={...this.currentAttributeByteOffsets},a={...this.bindings},c=this.instanceCount,h=this.vertexCount,u=this.isInstanced,d=this._vertexCountSet,f=this.drawingVectorBatches,p="webgpu"===this.device.type&&r.length?new l.K(this.device,this.shaderInputs.modules):void 0;if(p&&this._uniformStore.uniformBuffers.size){this.batchUniformBuffer??=new _(this.device);let e=0;for(let t of this._uniformStore.uniformBuffers.keys())e+=this.batchUniformBuffer.getAlignedByteLength(p.getUniformBufferData(t).byteLength);this.batchUniformBuffer.prepare(e*r.length)}this.drawingVectorBatches=!0;let g=!0;try{for(let t of r){this.setGPUData(t.data),this.setBatchDrawCount(t.rowCount),i?.(t);let r={};try{if(p)for(let[e,t]of(p.setUniforms(this.shaderInputs.getUniformValues()),this._uniformStore.uniformBuffers)){let i=`${e}Uniforms`;this.bindings[i]===t&&(r[i]=t,this.setBindings({[i]:this.batchUniformBuffer.write(p.getUniformBufferData(e))}))}g=q.prototype.draw.call(this,e)&&g}finally{this.setBindings(r)}}}finally{for(let e of(p?.destroy(),this.setAttributes(s,{byteOffsets:o}),Object.keys(this.bindings)))e in a||delete this.bindings[e];this.setBindings(a),this.setInstanceCount(c),this.setVertexCount(h),this.isInstanced=u,this._vertexCountSet=d,this.drawingVectorBatches=f}return g}setGPUData(e){this.setAttributes(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.buffer])),{byteOffsets:Object.fromEntries(Object.entries(e).map(([e,t])=>{let i=this.bufferLayout.find(t=>t.name===e),r=t.byteOffset-(i?.attributes?.[0]?.byteOffset??0);return(0,n.v)(r>=0),[e,r]}))})}validateVectorLengthPolicy(){(0,n.v)(!1!==this.props.enforceMatchingVectorLengths||"no"===this.props.inferDrawCount)}setBatchDrawCount(e,t="no"===this.props.inferDrawCount?"none":this.props.inferDrawCount){"instance"===t?this.setInstanceCount(e):"vertex"===t&&this.setVertexCount(e)}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate("topology"))}setBufferLayout(e){this.explicitBufferLayout=e;let t=this.geometryVectorBindings,i=this.attributeVectorBindings,r=this.getExplicitVectorLayouts(t.inputs)??t.sourceLayouts,s=this.getExplicitVectorLayouts(i.inputs)??i.sourceLayouts;t.setInputs(t.inputs,r,"vertex",this.props.enforceMatchingVectorLengths),i.setInputs(i.inputs,s,this.isInstanced?"instance":"vertex",this.props.enforceMatchingVectorLengths),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||void 0!==i.vertexCount)&&j([...Object.values(t.inputs),...Object.values(i.inputs)]),this.claimVectorLayouts(t),this.claimVectorLayouts(i),this.applyBufferLayout(this.getVectorBufferLayout())}applyBufferLayout(e){if(P(e=x(this.pipeline.shaderLayout,e),this.bufferLayout,-1))return;this.bufferLayout=e,this._setPipelineNeedsUpdate("bufferLayout"),this.pipeline=this._updatePipeline();let t=this.vertexArray;this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),t.destroy(),this._dynamicAttributeBufferSources={},this.applyVectorAttributes(),this.indexBuffer&&this.vertexArray.setIndexBuffer(this.indexBuffer)}setParameters(e){P(e,this.parameters,2)||(this.parameters=e,"webgl"===this.device.type?this.setNeedsRedraw("parameters"):this._setPipelineNeedsUpdate("parameters"))}setInstanceCount(e){this.instanceCount=e,void 0===this.isInstanced&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw("instanceCount")}setVertexCount(e){this.vertexCount=e,this._vertexCountSet=!0,this.setNeedsRedraw("vertexCount")}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw("indexCount")}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw("drawOffsets")}setShaderInputs(e){for(let[t,i]of(this.shaderInputs=e,this._uniformStore=new l.K(this.device,this.shaderInputs.modules),Object.entries(this.shaderInputs.modules)))if(L(i)&&this._usesManagedUniformBuffer(t)){let e=this._uniformStore.getManagedUniformBuffer(t);this.bindings[`${t}Uniforms`]=e}this.setNeedsRedraw("shaderInputs")}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getShaderInputBindings()),this.setNeedsRedraw("shaderInputs")}_getShaderInputBindings(){return this.shaderInputs.getBindingValues()}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw("bindings")}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw("transformFeedback")}setIndexBuffer(e){this.indexVector&&(this.indexCount=void 0,this.firstVertex=0,this.firstIndex=0),this.indexVector=null;let t=e instanceof $.kL?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof $.kL?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw("indexBuffer")}setAttributes(e,t){for(let i of(Object.assign(this.currentAttributes,e),Object.keys(e)))this.currentAttributeByteOffsets[i]=t?.byteOffsets?.[i]??0;this._drawBlockedReason=!1;let i=t?.disableWarnings??this.props.disableWarnings;e.indices&&a.R.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=x(this.pipeline.shaderLayout,this.bufferLayout);let r=new E(this.bufferLayout);for(let[s,n]of Object.entries(e)){let e=n instanceof $.kL?n.buffer:n,o=r.getBufferLayout(s);if(!o){i||a.R.warn(`Model(${this.id}): Missing layout for buffer "${s}".`)();continue}let l=r.getAttributeNamesForBuffer(o),c=!1;for(let r of l){let o=this._attributeInfos[r];if(o){let r="webgpu"===this.device.type?this.vertexArray.getBufferSlot(o.bufferName):o.location;if(null===r){i||a.R.warn(`Model(${this.id}): Missing vertex array slot for buffer "${o.bufferName}".`)();continue}let l=t?.byteOffsets?.[s]??0;this.vertexArray.setBuffer(r,e,l),n instanceof $.kL?this._dynamicAttributeBufferSources[r]={source:n,generation:n.generation,byteOffset:l}:delete this._dynamicAttributeBufferSources[r],c=!0}}c||i||a.R.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${s}"`)()}this.setNeedsRedraw("attributes")}setConstantAttributes(e,t){for(let[i,r]of Object.entries(e)){let e=this._attributeInfos[i];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||a.R.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${i}"`)()}this.setNeedsRedraw("constants")}_areBindingsLoading(){for(let e of Object.values(this.bindings))if((0,W.YT)(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[i,r]of Object.entries(this.bindings)){let s=function(e,t,i){if((0,W.YT)(t)){let r=(0,W.l0)(i,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof $.kL?t.buffer:(0,$.Hd)(t)?(0,$.j8)(t):t}(i,r,e);s&&(t[i]=s)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){return e.bindings.length?(0,c.gO)(e,t):{0:t}}_getBindGroupCacheKeys(){return{}}_getBindingsUpdateTimestamp(){let e=0;for(let t of(this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp)),Object.values(this._dynamicAttributeBufferSources)))e=Math.max(e,t.source.updateTimestamp);for(let t of Object.values(this.bindings))t instanceof h.X?e=Math.max(e,t.texture.updateTimestamp):t instanceof u.h||t instanceof d.g||t instanceof f.r||t instanceof $.kL?e=Math.max(e,t.updateTimestamp):(0,W.YT)(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:(0,$.Hd)(t)&&(e=Math.max(e,(t.buffer instanceof $.kL,t.buffer.updateTimestamp)));return e}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=this.pipelineFactory.createRenderPipeline(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate="pipeline creation failed",t}this._finishPipelineUpdate(e)}return this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createRenderPipelineAsync(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate="asynchronous pipeline creation failed",t}this._finishPipelineUpdate(e)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?.vs??null,t=this.pipeline?.fs??null;this.pipeline&&a.R.log(1,`GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1;let i=null,r=null;try{i=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:"vertex",source:this.source||this.vs,debugShaders:this.props.debugShaders}),this.source?r=i:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:"fragment",source:this.fs,debugShaders:this.props.debugShaders}))}catch(e){throw this._releasePipelineShaders(i,r),this._pipelineNeedsUpdate="shader creation failed",e}return{props:{...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:i,fs:r},vertexShader:i,fragmentShader:r,previousVertexShader:e,previousFragmentShader:t}}_finishPipelineUpdate(e){this._attributeInfos=(0,p.P)(this.pipeline.shaderLayout,this.bufferLayout),this._releasePipelineShaders(e.previousVertexShader,e.previousFragmentShader)}_releasePipelineShaders(e,t){e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=a.R.level>3?0:1e4;a.R.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,a.R.group(2,`>>> DRAWING MODEL ${this.id}`,{collapsed:a.R.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=function(e,t){let i={},r="Values";if(0===e.attributes.length&&!e.varyings?.length)return{"No attributes or varyings":{[r]:"N/A"}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;i[`in ${e}`]={[r]:t.stepMode||"vertex"}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;i[`out ${e}`]={[r]:JSON.stringify(t)}}return i}(this.pipeline.shaderLayout,this.id);a.R.table(2,e)();let t=this.shaderInputs.getDebugTable();a.R.table(2,t)();let i=this._getAttributeDebugTable();a.R.table(2,this._attributeInfos)(),a.R.table(2,i)(),a.R.groupEnd(2)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let i=e.props.framebuffer;!function(e,t,i){var r;if("webgl"!==e.device.type)return;let s=(r=e.device,r.userData[b]||={flushing:!1,queuedFramebuffers:[]},r.userData[b]);if(!s.flushing){let r;if(!(r=e.props.framebuffer)||null===r.handle)return function(e,t,i){if(0===i.queuedFramebuffers.length)return;let{gl:r}=e.device,s=r.getParameter(36010),n=r.getParameter(36006),[o,a]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),l=w(t.top,8),c=w(t.left,8);i.flushing=!0;try{for(let e of i.queuedFramebuffers){let[i,s,n,h,u]=function(e){let{framebuffer:t,targetWidth:i,targetHeight:r,topPx:s,leftPx:n,minimap:o}=e,a=o?Math.max(Math.floor(i/4),1):i,l=o?Math.max(Math.floor(r/4),1):r,c=Math.min(a/t.width,l/t.height),h=Math.max(Math.floor(t.width*c),1),u=Math.max(Math.floor(t.height*c),1),d=Math.max(r-s-u,0);return[n,d,n+h,d+u,u]}({framebuffer:e,targetWidth:o,targetHeight:a,topPx:l,leftPx:c,minimap:t.minimap});r.bindFramebuffer(36008,e.handle),r.bindFramebuffer(36009,null),r.blitFramebuffer(0,0,e.width,e.height,i,s,n,h,16384,9728),l+=u+8}}finally{r.bindFramebuffer(36008,s),r.bindFramebuffer(36009,n),i.flushing=!1}}(e,i,s);t&&"colorAttachments"in t&&null!==t.handle&&!s.queuedFramebuffers.includes(t)&&s.queuedFramebuffers.push(t)}}(e,i,{id:i?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,i]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[i.location];e[i.location]={name:t,type:i.shaderType,values:r?this._getBufferOrConstantValues(r,i.bufferDataType):"null"}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,i="uint32"===t.indexType?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:"indices",type:t.indexType,values:i.toString()}}return e}_getBufferOrConstantValues(e,t){let i=g.r.getTypedArrayConstructor(t);return(e instanceof u.h?new i(e.debugData):e).toString()}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw("dynamic index buffer")}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer,t.byteOffset),t.generation=t.source.generation,this.setNeedsRedraw("dynamic attribute buffer"))}_syncAttachmentFormats(e){var t;if("webgpu"!==this.device.type)return;let i=e.framebuffer||e.props.framebuffer,r=e.props,s=r.colorAttachmentFormats??i?.colorAttachments?.map(e=>{var t;return(t=e?.texture?.format)&&!Z(t)?t:null}),n=!1===r.depthStencilAttachmentFormat?void 0:r.depthStencilAttachmentFormat??((t=i?.depthStencilAttachment?.texture?.format)&&Z(t)?t:void 0);P(this._colorAttachmentFormats,s,1)&&this._depthStencilAttachmentFormat===n||(this._colorAttachmentFormats=s,this._depthStencilAttachmentFormat=n,this._setPipelineNeedsUpdate("attachment formats"))}}function J(e,t){return(void 0===e.shaderLanguage||e.shaderLanguage===t)&&("glsl"===t?"assembleGLSLShaderPair"in e&&"function"==typeof e.assembleGLSLShaderPair:"assembleWGSLShader"in e&&"function"==typeof e.assembleWGSLShader)}function Z(e){return H.includes(e)}},90635(e,t,i){i.d(t,{K:()=>l});var r=i(55077),s=i(72855),n=i(14840),o=i(8306),a=i(68234);class l extends r.X{static defaultProps={...r.X.defaultProps,material:void 0};get sourceGeometry(){return this.sourceGeometryValue}constructor(e,t){let i=void 0===t.geometry?new.target.defaultProps.geometry:t.geometry,r=!i||i instanceof n.u?null:(0,s.d3)(e,i),a=r?(0,o.t)(r):i,l={...t,geometry:a instanceof n.u?a:null};try{super(e,l)}catch(e){throw r?.destroy(),e}this._gpuGeometry=r,this.sourceGeometryValue=i,r&&this.setIndexCount(this.props.indexCount)}_initializeProps(e){this.material=e.material||null,this._gpuGeometry=null,this.sourceGeometryValue=null,super._initializeProps(e)}_initializeAttributes(){super._initializeAttributes(),this._gpuGeometry&&super.setIndexCount(this.indexCountOverride)}destroy(){super.destroy(),this._gpuGeometry?.destroy(),this._gpuGeometry=null,this.sourceGeometryValue=null}setGeometry(e){this._gpuGeometry?.destroy(),this._gpuGeometry=!e||e instanceof n.u?null:(0,s.d3)(this.device,e);let t=this._gpuGeometry?(0,o.t)(this._gpuGeometry):e;super.setGeometry(t instanceof n.u?t:null),e instanceof n.u||super.setIndexCount(this.indexCountOverride),this.sourceGeometryValue=e}setIndexCount(e){this.indexCountOverride=e,super.setIndexCount(e)}setMaterial(e){this.material=e,this.setNeedsRedraw("material")}_usesManagedUniformBuffer(e){return!this.material?.ownsModule(e)}updateShaderInputs(e){super.updateShaderInputs(e),this.material?.updateShaderInputs(e)}_getShaderInputBindings(){let e=super._getShaderInputBindings(),t=this.material;return t?Object.fromEntries(Object.entries(e).filter(([e])=>!t.ownsBinding(e))):e}_areBindingsLoading(){let e=super._areBindingsLoading();if(e)return e;for(let e of Object.values(this.material?.bindings||{}))if((0,a.YT)(e)&&!e.isReady)return e.id;return!1}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let i=super._getBindGroups(e,t);for(let[t,r]of Object.entries(this.material?.getBindingsByGroup(e)||{})){let e=Number(t);i[e]={...i[e]||{},...r}}return i}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){return Math.max(super._getBindingsUpdateTimestamp(),this.material?.getBindingsUpdateTimestamp()||0)}}},42860(e,t,i){i.d(t,{L:()=>s});let r={};function s(e="id"){r[e]=r[e]||1;let t=r[e]++;return`${e}-${t}`}},14590(e,t,i){i.d(t,{M:()=>n});var r=i(92648),s=i(46779);class n{static async createAsync(e,t){let i,s=!r.N.getAsyncCompilation(e),o=s?r.N.beginAsyncCompilation(e):r.N.getAsyncCompilation(e);try{i=new n(e,t)}finally{s&&r.N.endAsyncCompilation(e,o)}try{return s?await Promise.all(o):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if("webgpu"!==e.type)throw Error("Kernel is only supported in WebGPU");let{source:i,pipelineFactory:n,shaderFactory:o,debugShaders:a,...l}=t;this.device=e,this.id=t.id??"kernel",this.source=i,this.pipelineFactory=n??r.N.getDefaultPipelineFactory(e),this.shaderFactory=o??s.g.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:"compute",source:this.source,debugShaders:a});let c={...l,shader:this.shader},h=r.N.getAsyncCompilation(e);if(h){let e=this.pipelineFactory.createComputePipelineAsync(c);this._pipelineInitialization=e,h.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(c)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),this._destroyed=!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}}},35972(e,t,i){i.d(t,{O:()=>r});function r(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}},57703(e,t,i){i.d(t,{z:()=>n});var r=i(13240),s=i(88994);class n{isConstant=!0;format;value;byteLength;constructor({format:e,value:t}){var i;let n=(0,s.Ft)(e);if(n.fixedSizeList)throw Error("GPUConstant cannot represent fixed-size-list storage columns");let o="unorm10-10-10-2"===(i=e)?Uint32Array:(0,r.Y0)((0,s.Ft)(i).type);if(t.constructor!==o)throw Error(`GPUConstant format "${e}" requires ${o.name}, received ${t.constructor.name}`);if(t.byteLength!==n.byteLength)throw Error(`GPUConstant format "${e}" requires exactly ${n.byteLength} bytes, received ${t.byteLength}`);let a=t.constructor;this.format=e,this.value=new a(t),this.byteLength=this.value.byteLength}}},6265(e,t,i){i.d(t,{I:()=>s});var r=i(61954);class s{buffer;format;length;byteOffset;byteStride;constructor(e){let t=r.E.getVertexFormatInfo(e.format).byteLength,i=e.byteOffset??0,s=e.byteStride??t;if(n(e.length,"GPUDataView length"),n(i,"GPUDataView byteOffset"),n(s,"GPUDataView byteStride"),s<t)throw Error(`GPUDataView byteStride ${s} is smaller than ${e.format} byte length ${t}`);let o=0===e.length?0:(e.length-1)*s+t,a=i+o;if(!Number.isSafeInteger(o)||!Number.isSafeInteger(a))throw Error("GPUDataView byte range must use safe integers");if(a>e.buffer.byteLength)throw Error("GPUDataView exceeds its backing buffer byte length");this.buffer=e.buffer,this.format=e.format,this.length=e.length,this.byteOffset=i,this.byteStride=s}get elementByteLength(){return r.E.getVertexFormatInfo(this.format).byteLength}get byteLength(){return 0===this.length?0:(this.length-1)*this.byteStride+this.elementByteLength}}function n(e,t){if(!Number.isSafeInteger(e)||e<0)throw Error(`${t} must be a non-negative safe integer`)}},10404(e,t,i){i.d(t,{L:()=>u});var r=i(6265),s=i(61954),n=i(15506);function o(e){return!!(e&&"object"==typeof e&&"struct"===e.type)}function a(e,t){return 1===t?e:`vec${t}<${e}>`}function l(e,t){return Math.ceil(e/t)*t}var c=i(88994);class h{buffer;ownsDataBuffer;constructor(e,t){this.buffer=e,this.ownsDataBuffer=t}get ownsBuffer(){return this.ownsDataBuffer}transferBufferOwnership(e){if(e.buffer!==this.buffer)throw Error("GPUData ownership can only be transferred to the same buffer");e.ownsDataBuffer=this.ownsDataBuffer,this.ownsDataBuffer=!1}destroy(){this.ownsDataBuffer&&(this.buffer.destroy(),this.ownsDataBuffer=!1)}}let u=class extends h{dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;readbackMetadata;valueOffsets;nullBitmap;valueByteLength;constructor(e){let t,{buffer:i,format:r,length:h,valueLength:u,stride:d,byteOffset:f=0,byteStride:p,rowByteLength:g,ownsBuffer:m=!1,readbackMetadata:v,valueOffsets:y,nullBitmap:_,valueByteLength:b,dataType:w}=e;super(i,m);let P=o(t=r?"string"==typeof r?r:function(e,t){let i=Object.entries(e);if(0===i.length)throw Error("GPUData struct format must declare at least one field");return"packed"===t?function(e){let t=[],i=0,r=0;for(let[n,o]of e){let e=s.E.getVertexFormatInfo(o);if(e.webglOnly)throw Error(`Packed GPUData struct field "${n}" uses WebGL-only format ${o}`);i=l(i,Math.min(4,e.byteLength)),t.push([n,Object.freeze({format:o,byteOffset:i,byteLength:e.byteLength})]),i+=e.byteLength,r+=e.components}return Object.freeze({type:"struct",layout:"packed",fields:Object.freeze(Object.fromEntries(t)),components:r,byteStride:l(i,4),rowByteLength:i})}(i):function(e){let t=Object.fromEntries(e.map(([e,t])=>[e,function(e){let t=s.E.getVertexFormatInfo(e);switch(t.type){case"float32":return a("f32",t.components);case"sint32":return a("i32",t.components);case"uint32":return a("u32",t.components);default:return a("u32",Math.ceil(t.byteLength/4))}}(t)])),i=(0,n.Pr)(t,{layout:"wgsl-storage"}),r=[],o=0,l=0;for(let[t,n]of e){let e=s.E.getVertexFormatInfo(n),a=4*i.fields[t].offset;r.push([t,Object.freeze({format:n,byteOffset:a,byteLength:e.byteLength})]),o=Math.max(o,a+e.byteLength),l+=e.components}return Object.freeze({type:"struct",layout:"wgsl-storage",fields:Object.freeze(Object.fromEntries(r)),components:l,byteStride:i.byteLength,rowByteLength:o})}(i)}(r,e.layout??"wgsl-storage"):void 0)?t:void 0,S="string"==typeof t?(0,c.Ft)(t):void 0;if(this.dataType=w,this.format=t,this.length=h,this.valueLength=u??h*(S?.listSize??1),this.stride=d??(S?S.components*(S.listSize??1):void 0)??P?.components??p??g??1,this.byteOffset=f,this.rowByteLength=g??P?.rowByteLength??S?.byteLength??p??this.stride,this.byteStride=p??P?.byteStride??this.rowByteLength,S?.fixedSizeList){let e=h*S.listSize;if(!Number.isSafeInteger(h)||h<0||!Number.isSafeInteger(e)||!Number.isSafeInteger(this.byteOffset)||this.byteOffset<0||!Number.isSafeInteger(this.byteStride)||!Number.isSafeInteger(this.rowByteLength)||!Number.isSafeInteger(this.stride))throw Error("GPUData fixed-size-list row layout must use safe non-negative integers");if(this.valueLength!==e)throw Error("GPUData fixed-size-list valueLength must equal its flattened row elements");if(this.stride<S.components*S.listSize)throw Error("GPUData fixed-size-list stride cannot truncate its row components");if(this.rowByteLength<S.byteLength)throw Error("GPUData fixed-size-list rowByteLength cannot truncate its row payload");if(this.byteStride<this.rowByteLength)throw Error("GPUData fixed-size-list byteStride cannot overlap its row payload");let t=0===h?0:(h-1)*this.byteStride+this.rowByteLength,r=this.byteOffset+t;if(!Number.isSafeInteger(t)||!Number.isSafeInteger(r))throw Error("GPUData fixed-size-list byte range must use safe integers");if(r>i.byteLength)throw Error("GPUData fixed-size-list exceeds its backing buffer byte length")}if(P){if(this.rowByteLength<P.rowByteLength)throw Error(`GPUData rowByteLength ${this.rowByteLength} is smaller than struct format row byte length ${P.rowByteLength}`);if(this.byteStride<Math.max(P.byteStride,this.rowByteLength))throw Error(`GPUData byteStride ${this.byteStride} is smaller than its struct row layout`)}this.readbackMetadata=v,this.valueOffsets=y,this.nullBitmap=_,this.valueByteLength=b}getChild(e){if(!o(this.format))return null;let t=this.format.fields[e];return t?new r.I({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}getChildAt(e){if(!o(this.format))return null;let t=Object.values(this.format.fields)[e];return t?new r.I({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}}},88994(e,t,i){i.d(t,{Ft:()=>c,Tm:()=>a,u4:()=>l});var r=i(61954);let s=/^vertex-list<([^<>]+)>$/,n=/^value-list<([^<>]+)>$/,o=/^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;function a(e){return s.test(e)}function l(e){return n.test(e)}function c(e){let t=function(e){let t=s.exec(e),i=n.exec(e),o=h(e),a=o?.elementFormat??t?.[1]??i?.[1]??e;try{r.E.getVertexFormatInfo(a)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return a}(e),i=a(e),o=l(e),c=h(e),u=r.E.getVertexFormatInfo(t),d=u.byteLength*(c?.listSize??1);if(!Number.isSafeInteger(d))throw Error(`Unsupported GPUVector format ${e}`);let f=u.type,p=u.normalized,g=function(e,t){if(t)return"f32";switch(e){case"float32":return"f32";case"float16":return"f16";case"uint8":case"uint16":case"uint32":return"u32";case"sint8":case"sint16":case"sint32":return"i32";default:throw Error(`Unsupported GPUVector component type ${e}`)}}(f,p);return{format:e,elementFormat:t,vertexList:i,valueList:o,fixedSizeList:!!c,...c?{listSize:c.listSize}:{},type:f,signedDataType:function(e,t){if("unorm10-10-10-2"===e)return"uint32";switch(t){case"unorm8":return"uint8";case"snorm8":return"sint8";case"unorm16":return"uint16";case"snorm16":return"sint16";default:return t}}(t,f),primitiveType:g,components:u.components,elementByteLength:u.byteLength,byteLength:d,integer:u.integer,signed:u.signed,normalized:p,...u.webglOnly?{webglOnly:!0}:{}}}function h(e){let t=o.exec(e);if(!t)return;let i=Number(t[2]);if(!Number.isSafeInteger(i))return;let s=t[1];try{let e=r.E.getVertexFormatInfo(s);if(!Number.isSafeInteger(i*e.components)||!Number.isSafeInteger(i*e.byteLength))return}catch{return}return{elementFormat:s,listSize:i}}},18656(e,t,i){i.d(t,{M:()=>n});var r=i(10404),s=i(88994);class n{name;dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;bufferLayout;data=[];device;bufferProps;isAppendable=!1;ownsDataChunks=!0;ownedVectors=[];appendableByteLength=0;get chunks(){var e;let t;return e=this.data,t=0,Object.freeze(e.map(e=>{let i=Object.freeze({offset:t,length:e.length,data:e});return t+=e.length,i}))}constructor(e){switch(e.type){case"buffer":{let{name:t,buffer:i,format:s,length:n,valueLength:a,byteOffset:l=0,ownsBuffer:c=!1}=e,{stride:h,byteStride:u,rowByteLength:d,listSize:f}=o(e),p=a??n*(f??1);this.name=t,this.dataType=e.dataType,this.format=s,this.length=n,this.valueLength=p,this.stride=h,this.byteOffset=l,this.byteStride=u,this.rowByteLength=d,this.data.push(new r.L({buffer:i,format:s,length:n,valueLength:p,stride:h,byteOffset:l,byteStride:u,rowByteLength:d,ownsBuffer:c,dataType:e.dataType}));return}case"interleaved":{let{name:t,buffer:i,format:n,length:o,valueLength:a,byteOffset:l=0,byteStride:c,attributes:h,ownsBuffer:u=!1}=e,d=n?(0,s.Ft)(n):void 0,f=a??o*(d?.listSize??1),p=d?.fixedSizeList?d.components*d.listSize:c,g=d?.fixedSizeList?d.byteLength:c;this.name=t,this.dataType=e.dataType,this.format=n,this.length=o,this.valueLength=f,this.stride=p,this.byteOffset=l,this.byteStride=c,this.rowByteLength=g,this.bufferLayout={name:t,byteStride:c,attributes:h},this.data.push(new r.L({buffer:i,format:n,length:o,valueLength:f,stride:p,byteOffset:l,byteStride:c,rowByteLength:g,ownsBuffer:u,dataType:e.dataType}));return}case"data":{var t;let i=e.format??(t=e.data,t[0]?.format),r=i?(0,s.Ft)(i):void 0,{name:n,data:o,stride:a=o[0]?.stride??(r?r.components*(r.listSize??1):1),valueLength:l=o.reduce((e,t)=>e+t.valueLength,0),byteStride:c=o[0]?.byteStride??r?.byteLength,rowByteLength:h=o[0]?.rowByteLength??r?.byteLength,bufferLayout:u,ownsData:d=!1}=e;if(void 0===c||void 0===h)throw Error("GPUVector requires format or explicit byte layout metadata");i&&function(e,t){if(e.find(e=>e.format!==t))throw Error("GPUVector data chunks must share the declared format")}(o,i),this.name=n,this.dataType=e.dataType,this.format=i,this.length=o.reduce((e,t)=>e+t.length,0),this.valueLength=l,this.stride=a,this.byteOffset=1===o.length?o[0].byteOffset:0,this.byteStride=c,this.rowByteLength=h,this.bufferLayout=u,this.ownsDataChunks=d,this.data.push(...o);return}case"appendable":{let{name:t,device:i,format:r,valueLength:s=0,bufferProps:n}=e,{stride:a,byteStride:l,rowByteLength:c}=o(e);this.name=t,this.dataType=e.dataType,this.format=r,this.length=0,this.valueLength=s,this.stride=a,this.byteOffset=0,this.byteStride=l,this.rowByteLength=c,this.device=i,this.bufferProps=n,this.isAppendable=!0;return}}}get ownsBuffer(){return this.ownsDataChunks&&this.data.some(e=>e.ownsBuffer)||this.ownedVectors.some(e=>e.ownsBuffer)}get capacityRows(){return this.isAppendable?this.length:void 0}get appendedByteLength(){return this.appendableByteLength}addData(e){if(this.format&&e.format!==this.format)throw Error("GPUVector.addData() requires matching formats");if(e.byteStride!==this.byteStride)throw Error("GPUVector.addData() requires matching byteStride");if(e.rowByteLength!==this.rowByteLength)throw Error("GPUVector.addData() requires matching rowByteLength");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this}appendDataChunk(e,t=this.appendableByteLength+e.buffer.byteLength){if(!this.isAppendable)throw Error("GPUVector.appendDataChunk() requires appendable vector storage");if(this.format&&e.format!==this.format)throw Error("GPUVector.appendDataChunk() requires matching formats");if(e.byteStride!==this.byteStride||e.rowByteLength!==this.rowByteLength)throw Error("GPUVector.appendDataChunk() requires matching byte layout metadata");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this.appendableByteLength=t,this}resetLastBatch(){if(!this.isAppendable)throw Error("GPUVector.resetLastBatch() requires appendable vector storage");for(let e of this.data.splice(0))e.destroy();return this.length=0,this.valueLength=0,this.appendableByteLength=0,this}retainOwnedVectors(e){return this.ownedVectors.push(...e),this}transferBufferOwnership(e){let t=this.data[0],i=e.data[0];if(!t||!i||t.buffer!==i.buffer)throw Error("GPUVector ownership can only be transferred to the same buffer");t.transferBufferOwnership(i)}destroy(){if(this.ownsDataChunks)for(let e of this.data)e.destroy();for(let e of this.ownedVectors.splice(0))e.destroy()}}function o(e){let t=e.format?(0,s.Ft)(e.format):void 0,i=e.rowByteLength??(t?.fixedSizeList?t.byteLength:e.byteStride)??t?.byteLength;if(void 0===i)throw Error("GPUVector requires format or explicit rowByteLength");return{stride:e.stride??(t?t.components*(t.listSize??1):1),byteStride:e.byteStride??i,rowByteLength:i,...t?.listSize?{listSize:t.listSize}:{}}}},52128(e,t,i){i.d(t,{GL:()=>u,uy:()=>d});var r=i(35018),s=i(13240),n=i(7036),o=i(6265),a=i(18656),l=i(10404),c=i(88994),h=i(82298);class u{static get bufferPoolSize(){return h.R.poolSize}static set bufferPoolSize(e){if(!Number.isSafeInteger(e)||e<0)throw Error("GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer");h.R.poolSize=e,h.R.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_evaluationScope;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership="owned";_targetBuffer;static fromArray(e,{type:t,size:i=1,offset:r=0,stride:n=0,normalized:o=!1}){let a,l=t;return Array.isArray(e)?(l=l||"float32",a=new((0,s.Y0)(l))(e)):e instanceof Float64Array?(l="uint32",i*=2,r*=2,n*=2,a=new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4)):(l=l||(0,s.UE)(e),a=e),new u({id:`<${l} * ${i}>`,type:l,size:i,offset:r,stride:n,normalized:o,value:a})}static fromConstant(e,t="float32"){let i,r=(0,s.Y0)(t);return Array.isArray(e)?i=`[${e.join(",")}]`:(i=String(e),e=[e]),new u({id:i,isConstant:!0,type:t,size:e.length,value:new r(e)})}static fromGPUData(e,t={}){return function(e){if(!e.format)throw Error("GPUDataEvaluator.fromGPUData() requires GPUData format metadata");if((0,c.Tm)(e.format)||(0,c.u4)(e.format))throw Error("GPUDataEvaluator.fromGPUData() does not support variable-length input");let t=(0,c.Ft)(e.format).byteLength;if(e.rowByteLength!==t)throw Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${t} for GPUData`)}(e),new u({...f(new o.I({buffer:e.buffer,format:e.format,length:e.length,byteOffset:e.byteOffset,byteStride:e.byteStride})),id:t.id,gpuData:e})}static fromGPUDataView(e,t={}){return new u({...f(e),id:t.id,buffer:e.buffer})}constructor(e){let{id:t,value:i,buffer:r,gpuData:n,format:o,source:l=null,isConstant:c=!1}=e;if(!l&&!i&&!r&&!n)throw Error("GPUDataEvaluator must have a value source");let{type:h,size:d,offset:f,stride:p,normalized:g,length:m}=e;if(l instanceof u?(h=h??l.type,d=d??l.size,f=f??l.offset,p=p??l.stride,g=g??l.normalized,m=m??l.length):(d=d??1,f=f??0,g=g??!1,m=c?1:m),!h)throw Error("GPUDataEvaluator: type not defined");if(this._id=t,this.type=h,this.size=d,this.ValueType=(0,s.Y0)(this.type),this._offset=f,this._stride=p||this.ValueType.BYTES_PER_ELEMENT*d,this.normalized=g,this.source=l,this.format=o,void 0===m)if(c)m=1;else{if(!i)throw Error("GPUDataEvaluator: length not defined");m=Math.ceil(i.byteLength/this.stride)}this.isConstant=c,this.length=m;let v=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=0===m?0:(m-1)*this.stride+v,this._value=i,this._bufferOwnership=l instanceof u||r||n?"borrowed":"owned",n?this._gpuVector=new a.M({type:"data",name:this._id??"data",format:n.format,data:[n],stride:n.stride,byteStride:n.byteStride,rowByteLength:n.rowByteLength}):r&&(this._gpuVector=this.createGPUVectorView({buffer:r,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof u?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}getInspection(){return(0,r.r)([this])}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return p(this.gpuVector)}setTargetBuffer({buffer:e,byteOffset:t=0,byteStride:i=this.stride}){if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof u)throw Error("GPUDataEvaluator target buffers require a deferred operation source");this._targetBuffer={buffer:e,byteOffset:t,byteStride:i}}async evaluate(e,t={}){let i;if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this.assertScopeAccess(t.scope),t.scope&&(t.scope.assertEvaluating(e),!this._evaluationScope)){let e=!!this._gpuVector,i={offset:this._offset,stride:this._stride,byteLength:this._byteLength,ownership:this._bufferOwnership,target:this._targetBuffer};this._evaluationScope=t.scope,t.scope.retain(t=>{this._evaluationScope=void 0,t||e||!this._gpuVector||("owned"===this._bufferOwnership&&h.R.recycle(p(this._gpuVector)),this._gpuVector=void 0),t||e||(this._offset=i.offset,this._stride=i.stride,this._byteLength=i.byteLength,this._bufferOwnership=i.ownership,this._targetBuffer=i.target)})}if(this._gpuVector){if(t.scope&&this.source instanceof u&&await this.source.evaluate(e,{scope:t.scope}),t.scope&&this.buffer.device!==e)throw Error("Evaluator buffer belongs to a different device");return this._gpuVector}if(this.source instanceof u){let i=await this.source.evaluate(e,{scope:t.scope});return this._gpuVector=this.createGPUVectorView({...t,buffer:p(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(e),this._value)i.write(this._value);else{let r;try{r=await this.source.execute(e,i,t.scope)}catch(e){throw t.scope&&"owned"===this._bufferOwnership&&h.R.recycle(i),e}if(!r.success)throw t.scope&&"owned"===this._bufferOwnership&&h.R.recycle(i),r.error||Error(`${this.source} evaluation failed`);r.value&&(this._value=r.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:i}),this._gpuVector}evaluateSync(e,t={}){let i;if(t.scope)throw Error("Use scope.evaluate() for deferred submission");if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;if(this.source instanceof u){let i=this.source.evaluateSync(e);return this._gpuVector=this.createGPUVectorView({...t,buffer:p(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(e),this._value)i.write(this._value);else{let t=this.source.executeSync(e,i);if(!t.success)throw t.error||Error(`${this.source} evaluation failed`);t.value&&(this._value=t.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:i}),this._gpuVector}createGPUVectorView(e){let t=e.name??this._id??"vector",i=e.format??this.format??function(e,t,i=!1){return t>=1&&t<=4?g(e,t,i):void 0}(this.type,this.size,this.normalized);if(e.interleaved){var r;let i,s="object"==typeof e.interleaved&&e.interleaved.attributes?e.interleaved.attributes:(r=this,function e(t,i,r){let s=t.source;if(s&&!(s instanceof u)&&"interleave"===s.name){for(let t of Object.values(s.inputs))t instanceof u&&e(t,i,r);return}i.push({attribute:t.id??t.toString(),format:g(t.type,t.size,t.normalized),byteOffset:r.byteOffset}),r.byteOffset+=t.ValueType.BYTES_PER_ELEMENT*t.size}(r,i=[],{byteOffset:0}),i);return new a.M({type:"interleaved",name:t,buffer:e.buffer,format:e.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:s,ownsBuffer:!1})}return new a.M({type:"buffer",name:t,buffer:e.buffer,format:i,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(e){let t=this._targetBuffer;if(!t)return h.R.createOrReuse(e,Math.max(this.offset+this.byteLength,this._value?.byteLength??0));if(t.buffer.device!==e)throw Error("GPUDataEvaluator target buffer belongs to a different device");let i=this.ValueType.BYTES_PER_ELEMENT*this.size,r=0===this.length?0:(this.length-1)*t.byteStride+i;if(t.byteOffset+r>t.buffer.byteLength)throw Error("GPUDataEvaluator target buffer is too small for the output layout");return this._offset=t.byteOffset,this._stride=t.byteStride,this._byteLength=r,this._bufferOwnership="borrowed",this._targetBuffer=void 0,t.buffer}async readValue(e=0,t){this.assertScopeAccess();let{ValueType:i}=this,{size:r,offset:s,stride:n,length:o}=this,a=i.BYTES_PER_ELEMENT*r;if(t=t??o,t=Math.max(e=Math.max(0,Math.min(o,e)),Math.min(o,t)),this._value)return function(e,t,i,r){let{ValueType:s,size:n,offset:o,stride:a}=e,l=a/s.BYTES_PER_ELEMENT,c=o/s.BYTES_PER_ELEMENT,h=r-i;if(l===n){let e=c+i*l;return t.subarray(e,e+h*n)}let u=new s(h*n);for(let e=0;e<h;e++){let r=c+(i+e)*l;u.set(t.subarray(r,r+n),e*n)}return u}(this,this._value,e,t);let l=t-e;if(0===l)return new i(0);let c=s+e*n,h=await this.buffer.readAsync(c,n===a?l*a:(l-1)*n+a),u=new i(h.buffer,h.byteOffset,h.byteLength/i.BYTES_PER_ELEMENT);if(n===a)return u;let d=new Uint8Array(a*l);for(let e=0;e<l;e++){let t=e*n;d.set(h.subarray(t,t+a),e*a)}return new i(d.buffer)}async ensureCPUValue(){this.assertScopeAccess();let e=this.value;if(e)return e;let t=await this.buffer.readAsync(0,this.offset+this.byteLength);if(t.byteLength%this.ValueType.BYTES_PER_ELEMENT!=0)throw Error(`${this} backing buffer byte length is not aligned to its scalar type`);let i=t.slice();return this._value=new this.ValueType(i.buffer,i.byteOffset,i.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){this.assertScopeAccess();let e=this.value;if(e)return e;throw Error(`${this} CPU value is not available for synchronous evaluation`)}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error("Evaluator is retained by an unsubmitted scope")}toString(){return this._id??this.source?.toString()??this.constructor.name}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error("Cannot invalidate a destroyed evaluator");if((this.source||"borrowed"===this._bufferOwnership)&&(this._value=void 0),(this.source||"borrowed"!==this._bufferOwnership)&&this._gpuVector){let e=p(this._gpuVector);"owned"===this._bufferOwnership?h.R.recycle(e):this.source instanceof u||(this._targetBuffer={buffer:e,byteOffset:this.offset,byteStride:this.stride}),this._gpuVector=void 0}}destroy(){this.assertScopeAccess(),this._gpuVector&&("owned"===this._bufferOwnership&&h.R.recycle(p(this._gpuVector)),this._gpuVector=void 0),this._targetBuffer=void 0,this._destroyed=!0}}function d(e){if(e instanceof u)return e;if("number"==typeof e||Array.isArray(e))return u.fromConstant(e);if(e instanceof l.L)return u.fromGPUData(e);if(e instanceof o.I)return u.fromGPUDataView(e);throw Error("getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]")}function f(e){let t=(0,c.Ft)(e.format),i=(0,s.Y0)(t.signedDataType),r=i.BYTES_PER_ELEMENT*t.components;if(t.byteLength!==r)throw Error(`GPUDataEvaluator does not support packed vertex format ${e.format}: ${t.byteLength} physical bytes cannot expose ${t.components} ${t.signedDataType} components`);if(e.byteOffset%i.BYTES_PER_ELEMENT!=0||e.byteStride%i.BYTES_PER_ELEMENT!=0)throw Error(`GPUDataEvaluator requires ${e.format} offset and stride aligned to ${i.BYTES_PER_ELEMENT} bytes`);return{type:t.signedDataType,size:t.components,offset:e.byteOffset,stride:e.byteStride,normalized:t.normalized,length:e.length,format:e.format}}function p(e){let t=function(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${e.name}"`);return t}(e).buffer;return t instanceof n.kL?t.buffer:t}function g(e,t,i=!1){if(t<1||t>4)throw Error(`Cannot synthesize a GPUVector vertex format with ${t} components`);if("float16"===e&&3===t&&!i)return"uint16x3-webgl";let r=e;if(i)switch(e){case"uint8":r="unorm8";break;case"sint8":r="snorm8";break;case"uint16":r="unorm16";break;case"sint16":r="snorm16";break;case"float32":r="float32";break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}return("uint8"===r||"sint8"===r||"uint16"===r||"sint16"===r||"unorm8"===r||"snorm8"===r||"unorm16"===r||"snorm16"===r)&&3===t?`${r}x3-webgl`:`${r}${1===t?"":`x${t}`}`}},35018(e,t,i){i.d(t,{r:()=>o});var r=i(58006),s=i(61954),n=i(52128);function o(e,t){let i=new Map,o=[],a=new Set;return Object.freeze({outputs:Object.freeze(e.map(function e(l){(0,r.v)(!a.has(l));let c=i.get(l);if(c)return c;let h=t?.(l,i.size)??`value-${i.size}`;a.add(l),i.set(l,h);let u=l.source,d=u instanceof n.GL,f=(d?[u]:u?.dependencies??[]).map(e);return o.push(Object.freeze({id:h,label:l.id,kind:d?"alias":u?"operation":"source",operation:u&&!d?u.name:void 0,dependencies:Object.freeze(f),type:l.type,size:l.size,format:function(e){if(e.format)return e.format;let t=e.size;if(1===t||2===t||3===t||4===t){if(3===t&&!e.normalized&&("uint8"===e.type||"sint8"===e.type))return"uint8"===e.type?"uint8x3-webgl":"sint8x3-webgl";try{return s.E.makeVertexFormat(e.type,t,e.normalized)}catch{return}}}(l),length:l.length,normalized:l.normalized,isConstant:l.isConstant,offset:l.offset,stride:l.stride,byteLength:l.byteLength,evaluated:l.evaluated})),a.delete(l),h})),nodes:Object.freeze(o)})}},82447(e,t,i){i.d(t,{E:()=>r});let r={add:{arity:2,symbol:"arithmetic_add"},subtract:{arity:2,symbol:"arithmetic_subtract"},multiply:{arity:2,symbol:"arithmetic_multiply"},divide:{arity:2,symbol:"arithmetic_divide"},pow:{arity:2,symbol:"pow"},sqrt:{arity:1,symbol:"sqrt"},abs:{arity:1,symbol:"abs"},sin:{arity:1,symbol:"sin"},cos:{arity:1,symbol:"cos"},tan:{arity:1,symbol:"arithmetic_tan"},exp:{arity:1,symbol:"exp"},log:{arity:1,symbol:"log"}}},45821(e,t,i){i.d(t,{K:()=>n});var r=i(6772),s=i(88994);let n=({inputs:e,output:t,target:i})=>o(e,t,i);async function o(e,t,i){let n=await e.source.ensureCPUValue(),o=(0,s.Ft)(e.inputFormat),l=(0,s.Ft)(e.outputFormat),c=new t.ValueType(t.length*t.size),h=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,u=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let i=0;i<t.length;i++)for(let s=0;s<t.size;s++){let d=function(e,t,i){if("float16"===t)return(0,r.U)(e);if(!i)return e;let{minimum:s,maximum:n}=a(t);return Math.max(e/n,s<0?-1:0)}(n[h+i*u+s],e.source.type,o.normalized);c[i*t.size+s]=function(e,t,i){if("float16"===t.type)return(0,r.X)(e);if(!i&&"float32"===t.type)return e;let{minimum:s,maximum:n}=a(t.type),o=i?e*n:e;return Math.round(Math.min(n,Math.max(s,o)))}(d,t,l.normalized)}return i.write(c),{success:!0,value:c}}function a(e){switch(e){case"sint8":return{minimum:-127,maximum:127};case"sint16":return{minimum:-32767,maximum:32767};case"sint32":return{minimum:-0x80000000,maximum:0x7fffffff};case"uint8":return{minimum:0,maximum:255};case"uint16":return{minimum:0,maximum:65535};case"uint32":return{minimum:0,maximum:0xffffffff};default:throw Error(`castData CPU output does not support ${e}`)}}},64610(e,t,i){i.d(t,{K:()=>a});var r=i(58006),s=i(88994);class n{buffer;format;length;valueLength;byteOffset;byteStride;rowByteLength;valueOffsets;nullBitmap;constructor(e){let t=(0,s.Ft)(e.format),i=ArrayBuffer.isView(e.buffer)?e.buffer:void 0;this.buffer=i?i.buffer:e.buffer,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength??e.length*(t.listSize??1);let n=e.byteOffset??0;this.byteOffset=(i?.byteOffset??0)+n,this.rowByteLength=e.rowByteLength??t.byteLength,this.byteStride=e.byteStride??this.rowByteLength,this.valueOffsets=e.valueOffsets,this.nullBitmap=e.nullBitmap;let o=t.vertexList||t.valueList,a=o?this.valueLength:this.length;(0,r.v)([this.length,this.valueLength,n,this.rowByteLength,this.byteStride].every(e=>Number.isSafeInteger(e)&&e>=0)),(0,r.v)(this.rowByteLength>=t.byteLength&&this.byteStride>=this.rowByteLength),(0,r.v)(o||this.valueLength===this.length*(t.listSize??1)),(0,r.v)(n+(a?(a-1)*this.byteStride+this.rowByteLength:0)<=e.buffer.byteLength)}}var o=i(6772);let a=async({inputs:e,target:t})=>{let{source:i,inputFormat:a,outputFormat:l}=e,c=function(e,t,i){let a=(0,s.Ft)(e.format),l=i?.startsWith("float16")?"float16":a.signedDataType,c=i?.endsWith("x3")?3:a.components;(0,r.v)((3===c||4===c)&&["uint8","float16","float32"].includes(l));let h="uint8"===l?1:"float16"===l?2:4,u=new DataView(e.buffer,e.byteOffset),d="unorm8x4"===t?new Uint8Array(4*e.length):"float16x4"===t?new Uint16Array(4*e.length):new Float32Array(4*e.length),f=new DataView(new ArrayBuffer(4));for(let i=0;i<e.length;i++)for(let r=0;r<4;r++){let s=i*e.byteStride+r*h,n=r>=c?1:"uint8"===l?u.getUint8(s)/255:"float16"===l?(0,o.U)(u.getUint16(s,!0)):u.getFloat32(s,!0);d[4*i+r]="unorm8x4"===t?Math.round(255*Math.min(Math.max(n,0),1)):"float16x4"===t?function(e,t){t.setFloat32(0,e,!0);let i=t.getUint32(0,!0),r=i>>>16&32768,s=i>>>23&255,n=8388607&i;if(255===s)return 31744|r|512*!!n;if(s>142)return 31744|r;if(s<102)return r;let o=s<113?8388608|n:n,a=2**(s<113?126-s:13),l=Math.floor(o/a),c=o%a;return r|(s<113?0:(s-112)*1024)+(l+(c>a/2||c===a/2&&l%2?1:0))}(n,f):n}return new n({buffer:d,format:t,length:e.length,nullBitmap:e.nullBitmap&&new Uint8Array(e.nullBitmap)})}(new n({buffer:await i.ensureCPUValue(),format:i.format??("uint8x3"===a?"uint8x3-webgl":"float16x3"===a?"uint16x3-webgl":a),length:i.length,byteOffset:i.offset,byteStride:i.stride}),l,a),h=new Uint8Array(c.buffer,c.byteOffset,c.length*c.byteStride);return t.write(h),{success:!0}}},70571(e,t,i){function r(e,t){var i;let r=Number.isFinite(i=t)&&i>0?Math.floor(i):65535,s=Math.max(1,Math.ceil(e)),n=Math.min(s,r),o=Math.min(Math.ceil(s/n),r),a=Math.ceil(s/n/o);if(a>r)throw Error(`WebGPU dispatch requires ${s} workgroups, exceeding the 3D dispatch limit of ${r} per dimension`);return{x:n,y:o,z:a}}function s(e,t="workgroupId"){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function n(e,t,i="workgroupId",r="localId"){return`(${s(e,i)} * ${t}u + ${r}.x)`}i.d(t,{B:()=>s,BB:()=>r,vL:()=>n})},29393(e,t,i){function r(e,t){switch(e){case"u32":return`${t}u`;case"f32":return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function s(e,t){switch(e){case"uint32":return r("u32",Math.trunc(t));case"sint32":return`${Math.trunc(t)}`;case"float32":return r("f32",t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function n(e){switch(e){case"uint32":return"0u";case"sint32":return"0";case"float32":return"0.0";default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function o(e){switch(e){case"uint32":return"u32";case"sint32":return"i32";case"float32":return"f32";default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}i.d(t,{C1:()=>s,Lm:()=>r,_1:()=>n,iP:()=>o})},80844(e,t,i){i.d(t,{P:()=>c,g:()=>h});var r=i(14590),s=i(35972),n=i(3687),o=i(70571),a=i(29393);let l=new n.R;function c(e){return!e.isConstant||!e.value}function h({scope:e,module:t,elementWise:i=!1,expression:n,inputs:u,output:d,operationType:f=d.type,outputBuffer:p}){var g,m,v,y;let _,b,w,P;if(!t.source)throw Error(`WebGPU kernel ${t.name} requires WGSL source`);let S=Array.isArray(g=u)?g.map((e,t)=>[`x${t}`,e]):Object.entries(g),E=S.map(([e,t])=>({name:e,input:t})),x=E.filter(({input:e})=>c(e)).map((e,t)=>({...e,index:t})),C=(0,a.iP)(f),A=(0,a.iP)(d.type),L={TYPE:C,RESULT_LEN:d.size.toString()},M=(0,o.BB)(Math.ceil(d.length/64),p.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of S)L[`${e.toUpperCase()}_LEN`]=t.size.toString();let T=`
${function(e,t){for(let i in t)e=e.replaceAll(`{${i}}`,t[i]);return e}(t.source,L)}
${x.map(({name:e,input:t,index:i})=>{var r,s,n;let o;return r=e,s=t,n=i,o=(0,a.iP)(s.type),`@group(0) @binding(${n}) var<storage, read> ${r}: array<${o}>;`}).join("\n")}
${E.map(({name:e,input:t})=>{var i,r,s;let n,o,l,h;return i=e,r=t,s=f,n=(0,a.iP)(s),o=r.type===s?"":n,l=r.stride/r.ValueType.BYTES_PER_ELEMENT,h=r.offset/r.ValueType.BYTES_PER_ELEMENT,c(r)?`fn read_${i}(rowIndex: u32) -> array<${n}, ${r.size}> {
  var value: array<${n}, ${r.size}>;
  let rowOffset = ${h}u + ${r.isConstant?"0u":"rowIndex"} * ${l}u;
${Array.from({length:r.size},(e,t)=>o?`  value[${t}] = ${o}(${i}[rowOffset + ${t}u]);`:`  value[${t}] = ${i}[rowOffset + ${t}u];`).join("\n")}
  return value;
}`:`fn read_${i}(_rowIndex: u32) -> array<${n}, ${r.size}> {
  return array<${n}, ${r.size}>(${function(e,t){let i=e.value;if(!i)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>(0,a.Lm)(t,i[r]??0)).join(", ")}(r,o)});
}`}).join("\n")}
${(m=d,v=x.length,_=(0,a.iP)(m.type),`@group(0) @binding(${v}) var<storage, read_write> result: array<${_}>;`)}
${(b=(y=d).stride/y.ValueType.BYTES_PER_ELEMENT,w=y.offset/y.ValueType.BYTES_PER_ELEMENT,P=(0,a.iP)(y.type),`fn write_result(rowIndex: u32, value: array<${P}, ${y.size}>) {
  let rowOffset = ${w}u + rowIndex * ${b}u;
${Array.from({length:y.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join("\n")}
}`)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${(0,o.vL)(M,64)};
  if (rowIndex >= ${d.length}u) {
    return;
  }

${E.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join("\n")}
  var result: array<${A}, ${d.size}>;
${function(e,t,i,r,s){let n="";if(s)for(let e=0;e<i.size;e++)n+=`  result[${e}] = ${s(e)};
`;else if(r){let r=(0,a._1)(i.type),s=(0,a.iP)(i.type);for(let o=0;o<i.size;o++){let i=t.map(([e,t])=>o<t.size?(0,a.iP)(t.type)===s?`${e}[${o}]`:`${s}(${e}[${o}])`:r);n+=`  result[${o}] = ${e}(${i.join(", ")});
`}}else n+=`result = ${e}(${t.map(([e])=>e).join(", ")});`;return n.trimEnd()}(t.name,S,d,i,n)}
  write_result(rowIndex, result);
}
`,O=l.assembleWGSLShader({platformInfo:(0,s.O)(p.device),source:T,modules:t.dependencies,shaderStage:"compute",scanVertexAttributes:!1}),j=new r.M(p.device,{source:O.source,shaderLayout:{bindings:[...x.map(({name:e},t)=>({name:e,type:"storage",group:0,location:t})),{name:"result",type:"storage",group:0,location:x.length}]}});e&&e.retain(()=>j.destroy());let I=Object.fromEntries(x.map(({name:e,input:t})=>[e,t.buffer]));I.result=p;let R=e?e.commandEncoder.beginComputePass({}):p.device.beginComputePass({});p.device.statsManager.getStats("GPGPU Operation Counts").get("Computation Runs").incrementCount(),j.dispatch(R,{bindings:I,...M}),R.end(),e||(p.device.submit(),j.destroy())}},52466(e,t,i){i.d(t,{C:()=>s});var r=i(80844);let s=({inputs:e,output:t,target:i,scope:s})=>{let n=e.map((e,t)=>[`x${t}`,e]);var o=i.device.limits,a=n;let l=a.filter(([,e])=>(0,r.P)(e)).length+1;if(l>o.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${l} storage buffers, exceeding device limit ${o.maxStorageBuffersPerShaderStage}`);if(l>o.maxBindingsPerBindGroup)throw Error(`interleave() requires ${l} bindings, exceeding bind group limit ${o.maxBindingsPerBindGroup}`);let c=n.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(", "),h=0,u=n.map(([e,t])=>{let i=Array.from({length:t.size},(t,i)=>`  out[${h+i}] = ${e}[${i}];`).join("\n");return h+=t.size,i}).join("\n"),d=`\
fn interleave(${c}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${u}
  return out;
}
`;return(0,r.g)({scope:s,module:{name:"interleave",source:d},inputs:e,output:t,outputBuffer:i}),{success:!0}};s.supportsEvaluationScope=!0},82298(e,t,i){i.d(t,{R:()=>s});var r=i(8994);let s=new class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(e,t){if(t>e.limits.maxBufferSize)throw Error(`Buffer pool cannot allocate ${t} bytes: device.limits.maxBufferSize is ${e.limits.maxBufferSize}`);let i=this.bufferPools.get(e),s=i?i.findIndex(e=>e.byteLength>=t):-1;if(s<0)return e.createBuffer({usage:r.h.VERTEX|r.h.STORAGE|r.h.COPY_DST|r.h.COPY_SRC,byteLength:t});let[n]=i.splice(s,1);return n}recycle(e){let t=e.device;this.bufferPools.has(t)||this.bufferPools.set(t,[]);let i=this.bufferPools.get(t),r=i.findIndex(t=>t.byteLength>e.byteLength);r<0?i.push(e):i.splice(r,0,e),this.purge()}purge(){for(let[e,t]of this.bufferPools){let i=e.isLost?0:this.poolSize;for(;t.length>i;)t.shift().destroy();0===t.length&&this.bufferPools.delete(e)}}}},42621(e,t,i){i.d(t,{A:()=>n});var r=i(60616),s=i(21992);function n(e,t,{showTitle:i=!1}={}){let o=t.ownerDocument.createElement("div");o.dataset.panelHost="",o.style.minWidth="0",t.append(o);let a=!1,l=e=>{a||(0,r.XX)(e?(0,r.h)(s.U,{panel:e,key:e.id},[(0,r.h)("section",{style:{display:"flex",flexDirection:"column",gap:"8px"}},[i&&e.title?(0,r.h)("header",{style:{fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",color:"var(--button-text, rgb(24, 24, 26))"}},e.title):null,(0,r.h)("div",{style:{display:"flex",flexDirection:"column",gap:"8px"}},e.content)])]):null,o)};return l(e),{setPanel:l,finalize:()=>{a||(a=!0,(0,r.XX)(null,o),o.remove())}}}},43023(e,t,i){i.d(t,{R:()=>o,x:()=>a});var r=i(63696);let s={},n=r.createContext(s);function o(e){let t=r.useContext(n);return r.useMemo(function(){return"function"==typeof e?e(t):{...t,...e}},[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),r.createElement(n.Provider,{value:t},e.children)}}}]);
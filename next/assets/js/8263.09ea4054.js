"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["8263"],{46908(e,t,i){function r(e){return 16===e.typeId}function n(e){return 2===e.typeId||3===e.typeId}function s(e,t={}){let{semantic:i="auto",...o}=t;if("position"===i&&(!r(e)||![2,3].includes(e.listSize)))throw Error("Arrow positions must be FixedSizeList[2] or FixedSizeList[3]");if("scalar"===i&&!n(e))throw Error("Arrow scalar input must be numeric");let a=o.format;if(a||("color"===i&&(a="unorm8x4"),"scalar"===i&&(a="float32"),"position"===i&&(a=r(e)&&2===e.listSize?"float32x2":"float32x3")),!a){let t=r(e)?e.listSize:1;a=1===t?"float32":`float32x${t}`}let l="color"===i||"unorm8x4"===a,c="float32"===a?1:Number(/x([234])$/.exec(a)?.[1]);if(!c||(l?"unorm8x4"!==a:!a.startsWith("float32")))throw Error(`Unsupported Arrow output format: ${a}`);let u=r(e),h=u?e.listSize:1;if(!n(u?e.children[0].type:e))throw Error("Arrow input must contain numeric values");if(!l&&!o.transform&&h>c||l&&![3,4].includes(h))throw Error("Arrow input width does not match the requested output format");return a}i.d(t,{H:()=>s})},88203(e,t,i){i.d(t,{_:()=>r});function r(e){return!!(e&&Number.isInteger(e.numRows)&&Array.isArray(e.schema?.fields)&&"function"==typeof e.get&&"function"==typeof e.getChild)}},79433(e,t,i){i.d(t,{A:()=>P});var r=i(2357);let n=()=>{},s={mode:"preserve"},o={mode:"hard"},a=e=>e;class l{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:i,startProps:r,endProps:n,duration:o,easing:a}}=e,l=a(t/o),c=i.interpolateProps(r,n,l);this.propsInTransition=this.getControllerState({...this.props,...c},s).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new r.A(e.timeline),this.onViewStateChange=e.onViewStateChange||n,this.onStateChange=e.onStateChange||n}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,i=this.props;if(this.props=e,!i||this._shouldIgnoreViewportChange(i,e))return!1;if(this._isTransitionEnabled(e)){let r=i;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...i,...2===e?t:this.propsInTransition||i}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:i}=e;return(t>0||"auto"===t)&&!!i}_isUpdateDueToCurrentTransition(e){return!!this.transition.inProgress&&!!this.propsInTransition&&this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition)}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?3===this.transition.settings.interruption||this._isUpdateDueToCurrentTransition(t):!this._isTransitionEnabled(t)||t.transitionInterpolator.arePropsEqual(e,t)}_triggerTransition(e,t){let i=this.getControllerState(e,s),r=this.getControllerState(t,o).shortestPathFrom(i),n=t.transitionInterpolator,l=n.getDuration?n.getDuration(e,t):t.transitionDuration;if(0===l)return;let c=n.initializeProps(e,r);this.propsInTransition={};let u={duration:l,easing:t.transitionEasing||a,interpolator:n,interruption:t.transitionInterruption||1,startProps:c.start,endProps:c.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(u),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}}var c=i(70053),u=i(7914),h=i(41401);let d={transitionDuration:0},f=e=>1-(1-e)*(1-e),p=e=>1===e?1:1-Math.pow(2,-10*e),g=["wheel"],m=["panstart","panmove","panend"],_=["pinchstart","pinchmove","pinchend"],v=["multipanstart","multipanmove","multipanend"],y=["dblclick"],b=["dblclickdragstart","dblclickdragmove","dblclickdragend","dblclickdragcancel"],w=["keydown"],E={};class P{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode="rotate",this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround="pointer",this.keyboard=!0,this.transitionManager=new l({...e,getControllerState:(t,i)=>new this.ControllerState({...t,constraintContext:i,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case"panstart":return!t&&this._onPanStart(e);case"panmove":return this._onPan(e);case"panend":return this._onPanEnd(e);case"pinchstart":return!t&&!!this._isTrackpadGestureAllowed(e)&&this._onPinchStart(e);case"pinchmove":return!!this._isTrackpadGestureAllowed(e)&&this._onPinch(e);case"pinchend":return!!this._isTrackpadGestureAllowed(e)&&this._onPinchEnd(e);case"multipanstart":return!t&&this._onMultiPanStart(e);case"multipanmove":return this._onMultiPan(e);case"multipanend":return this._onMultiPanEnd(e);case"dblclick":return this._onDoubleClick(e);case"dblclickdragstart":return!t&&this._onDoubleClickDragStart(e);case"dblclickdragmove":return this._onDoubleClickDrag(e);case"dblclickdragend":case"dblclickdragcancel":return this._onDoubleClickDragEnd(e);case"wheel":return this._onWheel(e);case"keydown":return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:i}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-i]}getZoomPosition(e){if("pointer"===this.zoomAround)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[i,r]=(0,h.VJ)(t.center,t.pixelProjectionMatrix);return[i,r]}isPointInBounds(e,t){let{width:i,height:r}=this.props;if(t&&t.handled)return!1;let n=e[0]>=0&&e[0]<=i&&e[1]>=0&&e[1]<=r;return n&&t&&t.stopPropagation(),n}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){void 0===e.maxBoundsPadding&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,"transitionInterpolator"in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:i}=e;this.inertia=Number.isFinite(i)?i:300*(!0===i);let{scrollZoom:r=!0,dragPan:n=!0,dragRotate:s=!0,doubleClickZoom:o=!0,doubleClickDragZoom:a=!1,touchZoom:l=!0,touchRotate:c=!1,multiTouchDrag:h=c?"rotate":null,trackpadGesture:d=!1,zoomAround:f="pointer",keyboard:p=!0}=e,E=!!this.onViewStateChange;if(this.toggleEvents(g,E&&r),this.toggleEvents(m,E),this.toggleEvents(_,E&&(l||"rotate"===h)),this.toggleEvents(v,E&&!!h),this.toggleEvents(y,E&&o),this.toggleEvents(b,E&&a),this.toggleEvents(w,E&&p),this.scrollZoom=r,this.dragPan=n,this.dragRotate=s,this.doubleClickZoom=o,this.doubleClickDragZoom=a,this.touchZoom=l,this.touchRotate="rotate"===h,this.multiTouchDrag=h,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),i=t.getViewportProps();Object.keys(i).some(t=>!(0,u.b)(i[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,i={}){let r={...e.getViewportProps(),...t},n=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(i),n){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:"update"===t?"elastic":"end"===t?"rebound":"hard"}:{mode:"hard"}}_getReboundTransition(e,t){if("rebound"!==e.mode)return null;let i=t.getViewportProps();return Object.keys(i).some(e=>!(0,u.b)(this.props[e],i[e],1))?{...this._getTransitionProps(),transitionDuration:300,transitionEasing:p}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||"pan"===this.dragMode)&&(i=!i);let r=i?"pan":"rotate",n=this._getConstraintContext(r,"start"),s=i?this.controllerState.panStart({pos:t},n):this.controllerState.rotateStart({pos:t},n);return this._panMove=i,this.updateViewport(s,d,{isDragging:!0}),!0}_onPan(e){return!!this.isDragging()&&(this._panMove?this._onPanMove(e):this._onPanRotate(e))}_onPanEnd(e){return!!this.isDragging()&&(this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e))}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),i=this.controllerState.pan({pos:t},this._getConstraintContext("pan","update"));return this.updateViewport(i,d,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let i=this.getCenter(e),r=[i[0]+e.velocityX*t/2,i[1]+e.velocityY*t/2],n=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(n,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:f},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext("pan","end"),i=e.panEnd(t),r=this._getReboundTransition(t,i);this.updateViewport(i,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),i=this.controllerState.rotate({pos:t},this._getConstraintContext("rotate","update"));return this.updateViewport(i,d,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let i=this.getCenter(e),r=[i[0]+e.velocityX*t/2,i[1]+e.velocityY*t/2],n=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(n,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:f},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext("rotate","end"),i=e.rotateEnd(t),r=this._getReboundTransition(t,i);this.updateViewport(i,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&"mouse"!==e.device)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:i=.01,smooth:r=!1}=!0===this.scrollZoom?{}:this.scrollZoom,{delta:n}=e,s=2/(1+Math.exp(-Math.abs(n*i)));n<0&&0!==s&&(s=1/s);let o=this.getZoomPosition(t),a=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:d,l=this.controllerState.zoom({pos:o,scale:s});return this.updateViewport(l,a,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let i=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r="trackpad"===e.pointerType,n={x:i.x-(r?0:e.deltaX),y:i.y-(r?0:e.deltaY)},s={...e,offsetCenter:n},o=this.getCenter(s),a="pan"===t?this.controllerState.panStart({pos:o},this._getConstraintContext("pan","start")):this.controllerState.rotateStart({pos:o},this._getConstraintContext("rotate","start"));return this._multiPanMode=t,this._multiPanStartCenter=n,this.updateViewport(a,d,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:i}=this._getMultiPanEvent(e);return!!t&&!!i&&!!this.isDragging()&&("pan"===t?this._onPanMove(i):this._onPanRotate(i))}_onMultiPanEnd(e){let{mode:t,event:i}=this._getMultiPanEvent(e);if(!t||!i||!this.isDragging())return this._resetMultiPan(),!1;let r="pan"===t?this._onPanMoveEnd(i):this._onPanRotateEnd(i);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return"trackpad"!==e.pointerType||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return"trackpad"===e.pointerType?this.trackpadGesture&&("pan"===t?this.dragPan:this.dragRotate):"touch"===e.pointerType&&("pan"===t?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,i=this._multiPanStartCenter;return t&&i?{mode:t,event:{...e,offsetCenter:{x:i.x+e.deltaX,y:i.y+e.deltaY}}}:{mode:null,event:null}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext("zoom","start")).rotateStart({pos:t},this._getConstraintContext("rotate","start"));return E._startPinchRotation=e.rotation,E._lastPinchEvent=e,this.updateViewport(i,d,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:i}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:i},this._getConstraintContext("zoom","update"))}if(this.touchRotate){let{rotation:i}=e;t=t.rotate({deltaAngleX:E._startPinchRotation-i},this._getConstraintContext("rotate","update"))}return this.updateViewport(t,d,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),E._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:i}=E;if(this.touchZoom&&t&&i&&e.scale!==i.scale){let r=this.getCenter(e),n=this.getZoomPosition(r),s=this.controllerState.rotateEnd(),o=Math.log2(e.scale),a=(o-Math.log2(i.scale))/(e.deltaTime-i.deltaTime),l=Math.pow(2,o+a*t/2);s=s.zoom({pos:n,scale:l}).zoomEnd(),this.updateViewport(s,{...this._getTransitionProps({around:n}),transitionDuration:t,transitionEasing:f},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext("zoom","end"),i=this._getConstraintContext("rotate","end"),r=e.zoomEnd(t).rotateEnd(i),n=this._getReboundTransition(this.touchZoom?t:i,r);this.updateViewport(r,n,{isDragging:!1,isPanning:!!n&&this.touchZoom,isZooming:!!n&&this.touchZoom,isRotating:!!n&&this.touchRotate})}return E._startPinchRotation=null,E._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),n=this.controllerState.zoom({pos:r,scale:i?.5:2});return this.updateViewport(n,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let i=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext("zoom","start"));return 1!==e.scale&&(i=i.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext("zoom","update"))),this.updateViewport(i,d,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let i=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext("zoom","update"));return this.updateViewport(i,d,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,i=this._getConstraintContext("zoom","end"),r=t.zoomEnd(i),n=this._getReboundTransition(i,r);return this.updateViewport(r,n,{isDragging:!1,isPanning:!!n,isZooming:!!n}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){let t;if(!this.keyboard)return!1;let i=this.isFunctionKeyPressed(e),{zoomSpeed:r,moveSpeed:n,rotateSpeedX:s,rotateSpeedY:o}=!0===this.keyboard?{}:this.keyboard,{controllerState:a}=this,l={};switch(e.srcEvent.code){case"Minus":t=i?a.zoomOut(r).zoomOut(r):a.zoomOut(r),l.isZooming=!0;break;case"Equal":t=i?a.zoomIn(r).zoomIn(r):a.zoomIn(r),l.isZooming=!0;break;case"ArrowLeft":i?(t=a.rotateLeft(s),l.isRotating=!0):(t=a.moveLeft(n),l.isPanning=!0);break;case"ArrowRight":i?(t=a.rotateRight(s),l.isRotating=!0):(t=a.moveRight(n),l.isPanning=!0);break;case"ArrowUp":i?(t=a.rotateUp(o),l.isRotating=!0):(t=a.moveUp(n),l.isPanning=!0);break;case"ArrowDown":i?(t=a.rotateDown(o),l.isRotating=!0):(t=a.moveDown(n),l.isPanning=!0);break;default:return!1}return this.updateViewport(t,this._getTransitionProps(),l),!0}_getTransitionProps(e){let{transition:t}=this;return t&&t.transitionInterpolator?e?{...t,transitionInterpolator:new c.A({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t:d}}},97564(e,t,i){i.d(t,{A:()=>p,y:()=>f});var r=i(49105),n=i(79433),s=i(60676),o=i(58532),a=i(41401),l=i(24067),c=i(25667),u=i(70053);let h=[[-1/0,-90],[1/0,90]];function d([e,t]){if(Math.abs(t)>90&&(t=90*Math.sign(t)),Number.isFinite(e)){let[i,n]=(0,a.Gw)([e,t]);return[i,(0,r.qE)(n,0,512)]}let[,i]=(0,a.Gw)([0,t]);return[e,(0,r.qE)(i,0,512)]}class f extends s.A{constructor(e){let{width:t,height:i,latitude:r,longitude:n,zoom:o,bearing:a=0,pitch:c=0,altitude:u=1.5,position:d=[0,0,0],maxZoom:f=20,minZoom:p=0,maxPitch:g=60,minPitch:m=0,startPanLngLat:_,startZoomLngLat:v,startRotatePos:y,startRotateLngLat:b,startBearing:w,startPitch:E,startZoom:P,normalize:x=!0,rubberBand:S=!1}=e,{[s.y]:T}=e;(0,l.A)(Number.isFinite(n)),(0,l.A)(Number.isFinite(r)),(0,l.A)(Number.isFinite(o));let M=e.maxBounds||(x?h:null);super({width:t,height:i,latitude:r,longitude:n,zoom:o,bearing:a,pitch:c,altitude:u,maxZoom:f,minZoom:p,maxPitch:g,minPitch:m,normalize:x,position:d,maxBounds:M,maxBoundsPadding:e.maxBoundsPadding||null,rubberBand:S,...{[s.y]:T}},{startPanLngLat:_,startZoomLngLat:v,startRotatePos:y,startRotateLngLat:b,startBearing:w,startPitch:E,startZoom:P},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},i){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let n=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(n,i)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:void 0!==t?this._unproject3D(e,t):void 0,startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:i=0}){let r,{startRotatePos:n,startRotateLngLat:s,startBearing:o,startPitch:a}=this.getState();if(!n||void 0===o||void 0===a)return this;if(r=e?this._getNewRotation(e,n,a,o):{bearing:o+t,pitch:a+i},s){let e=this.makeViewport({...this.getViewportProps(),...r}),t="panByPosition3D"in e?"panByPosition3D":"panByPosition";return this._getUpdatedState({...r,...e[t](s,n)})}return this._getUpdatedState(r)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:i},r){let{startZoom:n,startZoomLngLat:o}=this.getState();return(o||(n=this.getViewportProps().zoom,o=this._unproject(t)||this._unproject(e)),o)?this._getUpdatedState({zoom:n+Math.log2(i),[s.y]:{position:o,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),i={...this.getViewportProps()},{bearing:r,longitude:n}=i;return Math.abs(r-t.bearing)>180&&(i.bearing=r<0?r+360:r-360),Math.abs(n-t.longitude)>180&&(i.longitude=n<0?n+360:n-360),i}applyConstraints(e,t){let i=e[s.y];delete e[s.y];let{maxPitch:n,minPitch:l,pitch:u,bearing:h,normalize:f,maxBounds:p,rubberBand:g}=e;f&&(h<-180||h>180)&&(e.bearing=(0,c.zi)(h+180,360)-180),e.pitch=(0,r.qE)(u,l,n);let m=this._constrainZoom(e.zoom,e),_=g&&t?.mode==="elastic";if(e.zoom=t?.mode==="preserve"?e.zoom:_?(0,o.GT)(e.zoom,m,1):m,i){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(i.position,i.screenPosition))}if(f&&(e.longitude<-180||e.longitude>180)&&(e.longitude=(0,c.zi)(e.longitude+180,360)-180),p){let i=(0,o.CI)(e.width,e.height,e.maxBoundsPadding),n=this.makeViewport({...e,bearing:0,pitch:0}),s=(0,o.jo)(n,[e.longitude,e.latitude],i),l=d(p[0]),c=d(p[1]),u=2**e.zoom,h=[l[0]+s.left/u,l[1]+s.bottom/u],f=[c[0]-s.right/u,c[1]-s.top/u],g=d([e.longitude,e.latitude]),m=[(0,r.qE)(g[0],h[0],f[0]),(0,r.qE)(g[1],h[1],f[1])],v=g.slice();if(i.width>=0&&(v[0]=t?.mode==="preserve"?g[0]:_?(0,o.GT)(g[0],m[0],i.width/2/u):m[0]),i.height>=0&&(v[1]=t?.mode==="preserve"?g[1]:_?(0,o.GT)(g[1],m[1],i.height/2/u):m[1]),v[0]!==g[0]||v[1]!==g[1]){let[t,i]=(0,a.iV)(v);v[0]!==g[0]&&(e.longitude=t),v[1]!==g[1]&&(e.latitude=i)}}return e}_constrainZoom(e,t){t||(t=this.getViewportProps());let{maxZoom:i,maxBounds:n}=t,s=null!==n&&t.width>0&&t.height>0,{minZoom:a}=t;if(s){let e=(0,o.CI)(t.width,t.height,t.maxBoundsPadding),r=d(n[0]),s=d(n[1]),l=s[0]-r[0],c=s[1]-r[1];e.width>0&&Number.isFinite(l)&&l>0&&(a=Math.max(a,Math.log2(e.width/l))),e.height>0&&Number.isFinite(c)&&c>0&&(a=Math.max(a,Math.log2(e.height/c))),a>i&&(a=i)}return(0,r.qE)(e,a,i)}_zoomFromCenter(e,t){let{width:i,height:r}=this.getViewportProps();return this.zoom({pos:[i/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:i,height:r}=this.getViewportProps();return this.pan({startPos:[i/2,r/2],pos:[i/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,i,n){let s=e[0]-t[0],o=e[1]-t[1],a=e[1],l=t[1],{width:c,height:u}=this.getViewportProps(),h=0;o>0?Math.abs(u-l)>5&&(h=o/(l-u)*1.2):o<0&&l>5&&(h=1-a/l),h=(0,r.qE)(h,-1,1);let{minPitch:d,maxPitch:f}=this.getViewportProps(),p=i;return h>0?p=i+h*(f-i):h<0&&(p=i-h*(d-i)),{pitch:p,bearing:n+s/c*180}}}class p extends n.A{constructor(){super(...arguments),this.ControllerState=f,this.transition={transitionDuration:300,transitionInterpolator:new u.A({transitionProps:{compare:["longitude","latitude","zoom","bearing","pitch","position"],required:["longitude","latitude","zoom"]}})},this.dragMode="pan",this.rotationPivot="center",this._getAltitude=e=>{if("2d"===this.rotationPivot)return 0;if("3d"===this.rotationPivot&&this.pickPosition){let{x:t,y:i}=this.props,r=this.pickPosition(t+e[0],i+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){"rotationPivot"in e&&(this.rotationPivot=e.rotationPivot||"center"),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(!1===e.normalize?null:h),super.setProps(e)}updateViewport(e,t=null,i={}){let r=e.getState();i.isDragging&&r.startRotateLngLat?i={...i,rotationPivotPosition:r.startRotateLngLat}:!1===i.isDragging&&(i={...i,rotationPivotPosition:void 0}),super.updateViewport(e,t,i)}}},58532(e,t,i){i.d(t,{CI:()=>s,GT:()=>n,jo:()=>o});var r=i(33945);function n(e,t,i){let r=e-t;return r&&Number.isFinite(r)?t+r*i/(i+Math.abs(r)):t}function s(e,t,i){let n=(0,r.E9)((0,r.rk)(i?.left??0),e),s=(0,r.E9)((0,r.rk)(i?.right??0),e),o=(0,r.E9)((0,r.rk)(i?.top??0),t),a=(0,r.E9)((0,r.rk)(i?.bottom??0),t);return{x:n,y:o,width:e-n-s,height:t-o-a}}function o(e,t,i){let[r,n]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,n=Number.isFinite(n)?n:e.height/2,{left:r-i.x,right:i.x+i.width-r,top:n-i.y,bottom:i.y+i.height-n}}},60676(e,t,i){i.d(t,{A:()=>n,y:()=>r});let r=Symbol("constraintAround");class n{constructor(e,t,i,r){this.makeViewport=i,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}}},43411(e,t,i){i.d(t,{A:()=>o,k:()=>s});var r=i(26391);let n={};function s(e){n=e}function o(e,t,i,s){r.A.level>0&&n[e]&&n[e].call(null,t,i,s)}},9350(e,t,i){i.d(t,{We:()=>o,p5:()=>n,tg:()=>s});var r=i(92767);let n={common:0,meters:1,pixels:2},s={click:"onClick",dblclick:"onClick",panstart:"onDragStart",panmove:"onDrag",panend:"onDragEnd"},o={multipan:[r.uq,{threshold:10,pointers:2,trackpad:!0}],pinch:[r.h1,{trackpad:!0},null,["multipan"]],pan:[r.uq,{threshold:1},["pinch"],["multipan"]],dblclick:[r.Cx,{event:"dblclick",taps:2,enable:!1}],dblclickdrag:[r.Cp,{event:"dblclickdrag",enable:!1},["dblclick"],null],click:[r.Cx,{event:"click"},["dblclickdrag"],["dblclick","dblclickdrag"]]}},40704(e,t,i){i.d(t,{A:()=>eJ});let r=1,n=1;class s{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;addChannel(e){let{delay:t=0,duration:i=1/0,rate:n=1,repeat:s=1}=e,o=r++,a={time:0,delay:t,duration:i,rate:n,repeat:s};return this._setChannelTime(a,this.time),this.channels.set(o,a),o}removeChannel(e){for(let[t,i]of(this.channels.delete(e),this.animations))i.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return void 0!==t&&this.time>=t.delay+t.duration*t.repeat}getTime(e){if(void 0===e)return this.time;let t=this.channels.get(e);return void 0===t?-1:t.time}setTime(e){for(let t of(this.time=Math.max(0,e),this.channels.values()))this._setChannelTime(t,this.time);for(let e of this.animations.values()){let{animation:t,channel:i}=e;t.setTime(this.getTime(i))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let i=n++;return this.animations.set(i,{animation:e,channel:t}),e.setTime(this.getTime(t)),i}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(-1===this.lastEngineTime&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let i=t-e.delay;i>=e.duration*e.repeat?e.time=e.duration*e.rate:(e.time=Math.max(0,i)%e.duration,e.time*=e.rate)}}var o=i(3687),a=i(20861),l=i(86181),c=i(33027);let u=[i(3065).A],h=[{name:"DECKGL_FILTER_SIZE",stage:"vertex",glsl:{parameters:"inout vec3 size, VertexGeometry geometry"},wgsl:{parameters:"size: ptr<function, vec3<f32>>, geometry: VertexGeometry"}},{name:"DECKGL_FILTER_GL_POSITION",stage:"vertex",glsl:{parameters:"inout vec4 position, VertexGeometry geometry"},wgsl:{parameters:"position: ptr<function, vec4<f32>>, geometry: VertexGeometry"}},{name:"DECKGL_FILTER_COLOR",stage:"vertex",glsl:{parameters:"inout vec4 color, VertexGeometry geometry"},wgsl:{parameters:"color: ptr<function, vec4<f32>>, geometry: VertexGeometry"}},{name:"DECKGL_FILTER_COLOR",stage:"fragment",glsl:{parameters:"inout vec4 color, FragmentGeometry geometry"},wgsl:{parameters:"color: ptr<function, vec4<f32>>, geometry: FragmentGeometry"}}];function d(e){let t="wgsl"===e?new o.R:new a.U;for(let e of u)t.addDefaultModule(e);for(let e of h)t.addShaderInjectionTarget(e);return t}let f=d("glsl"),p=d("wgsl");l.X.defaultProps.shaderAssembler=f,c.K.defaultProps.shaderAssembler=f;let g=`\
layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,m={name:"layer",source:`\
struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,vs:g,fs:g,getUniforms:e=>({opacity:Math.pow(e.opacity,1/2.2)}),uniformTypes:{opacity:"f32"}};var _=i(12897),v=i(26391),y=i(43411),b=i(38055),w=i(29947),E=i(327);class P{constructor(e,t,i){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=i,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let i=++this._loadCount,r=e;for(let t of("string"==typeof e&&(r=(0,E.H)(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===i&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===i&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e),this._subscribers))t.onChange(this.getData())}}class x{constructor(e){this.protocol=e.protocol||"resource://",this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return!!e.startsWith(this.protocol)||e in this._resources}add({resourceId:e,data:t,forceUpdate:i=!1,persistent:r=!0}){let n=this._resources[e];n?n.setData(t,i):(n=new P(e,t,this._context),this._resources[e]=n),n.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let e in t){let i=t[e],r=this._resources[i.resourceId];r&&r.unsubscribe(i)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:i,requestId:r="default"}){let{_resources:n,protocol:s}=this;e.startsWith(s)&&(n[e=e.replace(s,"")]||this.add({resourceId:e,data:null,persistent:!1}));let o=n[e];if(this._track(i,r,o,t),o)return o.getData()}prune(){this._pruneRequest||(this._pruneRequest=setTimeout(()=>this._prune(),0))}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,i,r){let n=this._consumers,s=n[e]=n[e]||{},o=s[t],a=o&&o.resourceId&&this._resources[o.resourceId];a&&(a.unsubscribe(o),this.prune()),i&&(o?(o.onChange=r,o.resourceId=i.id):o={onChange:r,resourceId:i.id},s[t]=o,i.subscribe(o))}_prune(){for(let e of(this._pruneRequest=null,Object.keys(this._resources))){let t=this._resources[e];t.persistent||t.inUse()||(t.delete(),delete this._resources[e])}}}var S=i(8994),T=i(60275);class M{constructor(e){this.resources=new Map,this.device=e}get(e){if(e.projectionMode!==T.K.CUSTOM_GEOSPATIAL)return;let t=this.resources.get(e.id);if(t?.signature===e.sizeScaleSignature)return t.resource;let i=performance.now(),r=e.getSizeScaleData(),n=performance.now(),s=this.create(r,64),o=performance.now();return v.A.log(3,`Size scale sampler [${e.id}] 64\xd764: generation ${(n-i).toFixed(2)} ms, ${"webgpu"===this.device.type?"buffer":"texture"} creation/upload submission ${(o-n).toFixed(2)} ms, total ${(o-i).toFixed(2)} ms`)(),t?.resource.destroy(),this.resources.set(e.id,{signature:e.sizeScaleSignature,resource:s}),s}delete(e){this.resources.get(e)?.resource.destroy(),this.resources.delete(e)}destroy(){for(let{resource:e}of this.resources.values())e.destroy();this.resources.clear()}create(e,t){return"webgpu"===this.device.type?this.device.createBuffer({id:"project-size-scale",data:e,usage:S.h.STORAGE|S.h.COPY_DST}):this.device.createTexture({id:"project-size-scale",width:t,height:t,format:"rgba32uint",data:new Uint32Array(e.buffer,e.byteOffset,e.length),sampler:{minFilter:"nearest",magFilter:"nearest",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}})}}var C=i(73499);class A{constructor(e,t){this._coordinateSystems=new Map,this._lastRenderedLayers=[],this._viewports=new Map,this._layerFilter=null,this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{(0,y.A)("layerManager.activateViewport",this,e);let t=!this.context.viewport;if(this.context.viewport=e||null,e&&t){for(let t of this.layers){let i=t.internalState;i&&this.isViewportReady(t)&&(i.viewport=e,t.setChangeFlags({viewportChanged:!0}))}this.setNeedsUpdate("viewport available")}};let{deck:i,stats:r,viewport:n,timeline:o}=t||{};this.layers=[],this.resourceManager=new x({device:e,protocol:"deck://"}),this.projectionScaleResources=new M(e),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:i,shaderAssembler:"wgsl"===(e?.info?.shadingLanguage||"glsl")?p:f,defaultShaderModules:[m],defaultShaderPlugins:[],renderPass:void 0,stats:r||new w.A({id:"deck.gl"}),viewport:n||null,timeline:o||new s,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){for(let e of(this.projectionScaleResources.destroy(),this.resourceManager.finalize(),this.layers))this._finalizeLayer(e);this._coordinateSystems.clear()}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;for(let i of(e.clearRedrawFlags&&(this._needsRedraw=!1),this.layers)){let r=i.getNeedsRedraw(e);t=t||r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?"layers changed":this._defaultShaderModulesChanged?"shader modules changed":this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>0===t.id.indexOf(e))):this.layers}setProps(e){"layerFilter"in e&&e.layerFilter!==this._layerFilter&&(this._layerFilter=e.layerFilter,this.setNeedsUpdate("layerFilter changed")),"debug"in e&&(this._debug=e.debug),"userData"in e&&(this.context.userData=e.userData),"layers"in e&&(this._nextLayers=e.layers),"onError"in e&&(this.context.onError=e.onError)}setLayers(e,t){if((0,y.A)("layerManager.setLayers",this,t,e),!this.context.viewport){this._nextLayers=e,this.setNeedsUpdate(t||"viewport pending");return}this._nextLayers=null,this._lastRenderedLayers=e;let i=(0,b.B)(e,Boolean);for(let e of i)e.context=this.context;this._updateLayers(this.layers,i)}updateLayers(){if(!this.context.viewport)return;let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}getViewports(){return this.context.deck?.getViewports()||(this.context.viewport?[this.context.viewport]:[])}setViewports(e,t){for(let i of(this._viewports=new Map(t.map(e=>[e.id,null])),e))this._viewports.set(i.id,i);for(let t of(this.context.viewport=e[0]||null,this.layers)){let e=t.internalState;if(!e?.viewport)continue;let i=this._viewports.get(e.viewport.id);null!==i&&i!==e.viewport&&(e.viewport=i,t.setChangeFlags({viewportChanged:!0}))}this.setNeedsUpdate("viewports changed")}isViewportReady(e){let t=e.internalState?.viewport;return!t||null!==this._viewports.get(t.id)}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,i=t.findIndex(t=>t.name===e.name);i>=0&&(t.splice(i,1),this._defaultShaderModulesChanged=!0)}addDefaultShaderPlugin(e){this.context.defaultShaderPlugins.some(t=>t.name===e.name)||(this.context.defaultShaderPlugins.push(e),e.module&&this.addDefaultShaderModule(e.module),this._defaultShaderModulesChanged=!0)}removeDefaultShaderPlugin(e){let t=this.context.defaultShaderPlugins.findIndex(t=>t.name===e.name);t>=0&&(this.context.defaultShaderPlugins.splice(t,1),e.module&&this.removeDefaultShaderModule(e.module),this._defaultShaderModulesChanged=!0)}_handleError(e,t,i){i.raiseError(t,`${e} of ${i}`)}_updateLayers(e,t){let i={};for(let t of e)i[t.id]?v.A.warn(`Multiple old layers with same id ${t.id}`)():i[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,i,r),this._finalizeOldLayers(i);let n=!1;for(let e of r)if(e.hasUniformTransition()){n=`Uniform transition in ${e}`;break}this._needsUpdate=n,this.layers=r}_updateSublayersRecursively(e,t,i){for(let r of e){r.context=this.context;let e=t[r.id];null===e&&v.A.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let n=null;try{this._debug&&e!==r&&r.validateProps(),e?.internalState&&this._transferLayerState(e,r);let t=r.internalState?void 0:this._getInitialViewport(r);this.isViewportReady(r)&&this._resolveLayerCrs(r,t)&&(r.internalState?this._updateLayer(r):this._initializeLayer(r,t)),i.push(r),n=r.internalState&&r.isComposite?r.getSubLayers():null}catch(e){this._handleError("matching",e,r)}n&&this._updateSublayersRecursively(n,t,i)}}_getInitialViewport(e){for(let t of this._viewports.size?this._viewports.values():[this.context.viewport])if(t&&(!this._layerFilter||this._layerFilter({layer:e.root,viewport:t,isPicking:!1,renderPass:"screen"})))return t}_resolveLayerCrs(e,t){let i=e.internalState?.viewport||t||this.context.viewport,r=(e.props.coordinateSystem??"default")==="default"?i.isGeospatial?"WGS84":"cartesian":e.props.coordinateSystem,n=this._coordinateSystems.get(e.id);if(!n||!(0,C.vk)(n.coordinateSystem,r)){n={coordinateSystem:r,layer:e},this._coordinateSystems.set(e.id,n);let t=r===i.crs?.signature?i.crs:(0,C.rs)(r);if(t instanceof Promise){n.pending=t;let i=n;t.then(t=>{this._coordinateSystems.get(e.id)===i&&(i.sourceCrs=t,i.pending=void 0,this.setNeedsUpdate("source CRS loaded"))},t=>{this._coordinateSystems.get(e.id)===i&&(i.error=t,i.pending=void 0,i.layer.raiseError(t,"loading coordinateSystem"))})}else n.sourceCrs=t}return n.coordinateSystem=r,n.layer=e,e._setSourceCrs(n.pending||n.error?void 0:n.sourceCrs),!n.pending&&!n.error}_finalizeOldLayers(e){for(let t in e){let i=e[t];i&&this._finalizeLayer(i)}}_initializeLayer(e,t){try{e._initialize(t),e.lifecycle=_.VD.INITIALIZED}catch(t){this._handleError("initialization",t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=_.VD.MATCHED,t!==e&&(e.lifecycle=_.VD.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError("update",t,e)}}_finalizeLayer(e){if(this._coordinateSystems.delete(e.id),!e.internalState){e.lifecycle=_.VD.FINALIZED;return}this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=_.VD.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=_.VD.FINALIZED}catch(t){this._handleError("finalization",t,e)}}}var O=i(7914);let k="default-canvas";class I{constructor(e){this._failedViews=new WeakSet,this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw="First render",this._needsUpdate="Initialize",this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange,onViewRemoved:e.onViewRemoved,onError:e.onError},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={},this.views=[]}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let i=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!("x"in e)||t.containsPixel(e);return i&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t="string"==typeof e?this.getView(e):e,i=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(i):i}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t="string"==typeof e?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let i=this.getViewports(),r={x:e[0],y:e[1]};for(let n=i.length-1;n>=0;--n){let s=i[n];if(s.containsPixel(r)){let i=e.slice();return i[0]-=s.x,i[1]-=s.y,s.unproject(i,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),("width"in e||"height"in e)&&this._setSize(e.width,e.height),"pickPosition"in e&&(this._pickPosition=e.pickPosition),"eventManagers"in e&&this._setEventManagers(e.eventManagers||{}),this.updateViewports()}updateViewports(){return!this._isUpdating&&!!this._needsUpdate&&(this._update(),!0)}_update(){this._isUpdating=!0;try{this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports())}finally{this._isUpdating=!1}}_hasViewState(e){let t=e.props.viewState;if(t&&"object"==typeof t&&!t.id||this.viewState[e.getViewStateId()])return!0;let i=Object.values(this.viewState);return 0===i.length||i.some(e=>!e||"object"!=typeof e||Array.isArray(e))}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate("Size changed"))}_setViews(e){e=(0,b.B)(e,Boolean);let t=this.views;if(e=e.map(e=>{let i=t.find(t=>t.id===e.id);return i&&!this._failedViews.has(i)&&i.equals(e)?i:e}),this._diffViews(e,t)){let t=new Set(e.map(e=>e.id));for(let e of this.views)t.has(e.id)||this._eventCallbacks.onViewRemoved?.(e.id);this.setNeedsUpdate("views changed")}for(let i of(this.views=e,e)){if(t.includes(i))continue;this._failedViews.delete(i);let e=e=>{this._failedViews.add(i),this.views.includes(i)&&(this._eventCallbacks.onError?this._eventCallbacks.onError(e):v.A.error(String(e))())};try{let t=i.initialize();t&&t.then(()=>{this.views.includes(i)&&this.setNeedsUpdate("view initialized")}).catch(e)}catch(t){e(t)}}}_setViewState(e){e?((0,O.b)(e,this.viewState,3)||this.setNeedsUpdate("viewState changed"),this.viewState=e):v.A.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate("eventManagers changed"))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||k}_getCanvasDimensions(e){let t=this._getCanvasContext?.(e.id),[i,r]=t?.getCSSSize()||[this.width,this.height];return{width:i,height:r}}_getViewEventManager(e){let t=this.getCanvasId(e)||k;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,i){return e&&(t?.canvasId!==i.canvasId||t?.eventManager!==i.eventManager)?(e.finalize(),null):e}_createController(e,t){return new t.type({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,i)=>this._pickPosition?.(t,i,e.id)})}_updateController(e,t,i,r){let n=e.controller;if(n&&i){let s={...t,...n,id:e.id,x:i.x,y:i.y,width:i.width,height:i.height};return r&&r.constructor===n.type||(r=this._createController(e,s)),r&&r.setProps(s),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:i}=this._startViewportRebuild(),r=!1;for(let n=e.length;n--;){let s=e[n],{width:o,height:a}=this._getCanvasDimensions(s),l=this._getViewEventManager(s);this._viewEventManagers[s.id]=l;let c=this.getViewState(s),u=s.makeViewport({viewState:c,width:o,height:a}),h=this._getReusableController(t[s.id],i[s.id],l),d=!!s.controller&&!!u;d&&!this._hasViewState(s)&&(d=!1),d&&!h&&(r=!0),(r||!d)&&h&&(h.finalize(),h=null),this.controllers[s.id]=d?this._updateController(s,c,u,h):null,u&&this._viewports.unshift(u)}for(let e in t){let i=t[e];i&&!this.controllers[e]&&i.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length!==t.length||e.some((e,i)=>!e.equals(t[i])||e!==t[i]&&this._failedViews.has(t[i]))}}var L=i(45800);let R=[255,255,255],B=0;class j{constructor(e={}){this.type="ambient";let{color:t=R}=e,{intensity:i=1}=e;this.id=e.id||`ambient-${B++}`,this.color=t,this.intensity=i}}var z=i(78861);let D=[255,255,255],U=[0,0,-1],F=0;class V{constructor(e={}){this.type="directional";let{color:t=D}=e,{intensity:i=1}=e,{direction:r=U}=e,{_shadow:n=!1}=e;this.id=e.id||`directional-${F++}`,this.color=t,this.intensity=i,this.type="directional",this.direction=new z.P(r).normalize().toArray(),this.shadow=n}getProjectedLight(e){return this}}var N=i(94022);class ${constructor(e,t={id:"pass"}){let{id:i}=t;this.id=i,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}}let G={colorMask:15,depthWriteEnabled:!0,depthCompare:"less-equal",blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one-minus-src-alpha",blendAlphaOperation:"add",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one-minus-src-alpha"};class W extends ${constructor(){super(...arguments),this._lastRenderIndex=-1,this._activatedLayers=new Set}render(e){this._render(e)}_render(e){if("webgl"===this.device.type&&void 0!==e.colorMask){let t=e.colorMask;return this.device.withParametersWebGL({colorMask:[!!(1&t),!!(2&t),!!(4&t),!!(8&t)]},()=>this._renderLayers(e))}return this._renderLayers(e)}_renderLayers(e){this._activatedLayers.clear();let{canvasContext:t=this.device.canvasContext}=e,i=e.target??t.getCurrentFramebuffer(),[r,n]=t.getDrawingBufferSize(),s=e.clearCanvas??!0,o=e.clearColor??(!!s&&[0,0,0,0]),a=!!s&&1,l=!!s&&0,c={viewport:[0,0,r,n]};e.scissorRect&&(c.scissorRect=e.scissorRect);let{shaderModuleProps:u,viewports:h,views:d,onViewportActive:f,clearStack:p=!0}=e,g=e.pass||"unknown",m="webgpu"===this.device.type;p&&(this._lastRenderIndex=-1);let _=[];if(!h.length)return this.device.beginRenderPass({framebuffer:i,parameters:c,clearColor:o,clearDepth:a,clearStencil:l}).end(),this.device.submit(),_;try{for(let r of h){f?.(r);let n=this._getDrawLayerParams(r,e),s=d&&d[r.id],h=r.subViewports||[r];for(let r of m?h.map(e=>[e]):[h]){let h=this.device.beginRenderPass({framebuffer:i,parameters:c,clearColor:o,clearDepth:a,clearStencil:l});try{for(let o of r){let r=this._drawLayersInViewport(h,{target:i,canvasContext:t,shaderModuleProps:u,viewport:o,view:s,pass:g,layers:e.layers,isPicking:e.isPicking},n);_.push(r)}}finally{h.end(),m&&this.device.submit()}o=!1,a=!1,l=!1}}return _}finally{m||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:i,isPicking:r=!1,layerFilter:n,cullRect:s,views:o,effects:a,canvasContext:l=this.device.canvasContext,colorMask:c,shaderModuleProps:u},h=!1){let d=[],f=function e(t=0,i={}){let r={},n=(s,o)=>{let a,l=s.props._offset,c=s.id,u=s.parent&&s.parent.id;if(!u||u in i||n(s.parent,!1),u in r){let t=r[u]=r[u]||e(i[u],i);a=t(s,o),r[c]=t}else Number.isFinite(l)?(a=l+(i[u]||0),r[c]=null):a=t;return o&&a>=t&&(t=a+1),i[c]=a,a};return n}(this._lastRenderIndex+1),p={layer:t[0],viewport:e,isPicking:r,renderPass:i,cullRect:s},g={};for(let r=0;r<t.length;r++){let s=t[r],m=this._shouldDrawLayer(s,p,n,g),_={shouldDrawLayer:m};m&&!h&&(_.shouldDrawLayer=!0,_.layerRenderIndex=f(s,m),_.shaderModuleProps=this._getShaderModuleProps(s,a,i,l,u),_.layerParameters={..."webgpu"===s.context.device.type?G:null,...s.context.deck?.props.parameters,...o?.[e.id]?.props.parameters,...this.getLayerParameters(s,r,e)},void 0!==c&&(_.layerParameters.colorMask=c)),d[r]=_}return d}_drawLayersInViewport(e,{layers:t,shaderModuleProps:i,pass:r,target:n,canvasContext:s,viewport:o,view:a,isPicking:l},c){let u=function(e,{canvasContext:t=e.canvasContext,shaderModuleProps:i,target:r,viewport:n}){let s=i?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),a=r?r.height:o,l="webgpu"===e.type?n.y*s:a-(n.y+n.height)*s;return[n.x*s,l,n.width*s,n.height*s]}(this.device,{canvasContext:s,shaderModuleProps:i,target:n,viewport:o});if(a){let{clear:e,clearColor:t,clearDepth:i,clearStencil:r}=a.props;if(e){let e=[0,0,0,0],s=1,o=0;Array.isArray(t)&&!l?e=[...t.slice(0,3),t[3]||255].map(e=>e/255):!1===t&&(e=!1),void 0!==i&&(s=i),void 0!==r&&(o=r),this.device.beginRenderPass({framebuffer:n,parameters:{viewport:u,scissorRect:u},clearColor:e,clearDepth:s,clearStencil:o}).end()}}let h={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:u});for(let i=0;i<t.length;i++){let n=t[i],s=c[i],{shouldDrawLayer:a}=s;if(a&&n.props.pickable&&h.pickableCount++,n.isComposite&&h.compositeCount++,n.isDrawable&&s.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:i,layerParameters:a}=s;h.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),i.project&&(i.project.viewport=o),n.context.renderPass=e;try{n._drawLayer({renderPass:e,shaderModuleProps:i,uniforms:{layerIndex:t},parameters:a})}catch(e){n.raiseError(e,`drawing ${n} to ${r}`)}}}return h}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,i){return null}getLayerParameters(e,t,i){return e.props.parameters}_shouldDrawLayer(e,t,i,r){if(!e.internalState||!e.isCoordinateSystemLoaded||!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let n=e.parent;for(;n;){if(!n.isCoordinateSystemLoaded||!n.props.visible||!n.filterSubLayer(t))return!1;t.layer=n,n=n.parent}if(i){let e=t.layer.id;if(e in r||(r[e]=i(t)),!r[e])return!1}return t.isPicking||this._activatedLayers.has(e)||(this._activatedLayers.add(e),e.activateViewport(t.viewport)),!0}_getShaderModuleProps(e,t,i,r,n){let s=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,a={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,sizeScale:e.context.layerManager.projectionScaleResources.get(e.context.viewport),devicePixelRatio:s,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,sourceCrs:e.internalState.sourceCrs,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let i of t)q(a,i.getShaderModuleProps?.(e,a));for(let t of e.context.defaultShaderModules)t.name in a||(a[t.name]={});return q(a,this.getShaderModuleProps(e,t,a),n)}}function q(e,...t){for(let i of t)if(i)for(let t in i)e[t]?Object.assign(e[t],i[t]):e[t]=i[t];return e}class H extends W{constructor(e,t){super(e,t);let i=e.createTexture({format:"rgba8unorm",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}}),r=e.createTexture({format:"depth16unorm",width:1,height:1});this.fbo=e.createFramebuffer({id:"shadowmap",width:1,height:1,colorAttachments:[i],depthStencilAttachment:r})}delete(){this.fbo&&(this.fbo.destroy(),this.fbo=null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,i=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],n=r.width*i,s=r.height*i;(n!==t.width||s!==t.height)&&t.resize({width:n,height:s}),super.render({...e,clearColor:[1,1,1,1],target:t,pass:"shadow"})}getLayerParameters(e,t,i){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:"less-equal",depthBias:0}}shouldDrawLayer(e){return!1!==e.props.shadowEnabled}getShaderModuleProps(e,t,i){return{shadow:{project:i.project,drawToShadowMap:!0},lighting:{enabled:!1}}}}var Y=i(52948),Z=i(82417),X=i(41401);let K=`
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
`,J=`
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
`,Q=`
${K}
${J}
`,ee=`
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
`,et=`
${K}
${ee}
`,ei=(0,Z.A)(function({viewport:e,center:t}){return new N.k(e.viewProjectionMatrix).invert().transform(t)}),er=(0,Z.A)(function({viewport:e,shadowMatrices:t}){let i=[],r=function(e){let{width:t,height:i,pixelUnprojectionMatrix:r}=e,n=[[0,0],[t,0],[t,i],[0,i]],s=n.map(([e,t])=>(0,X.xJ)([e,t,-1],r)),o=n.map(([e,t])=>(0,X.xJ)([e,t,1],r));if(!e.isGeospatial)return s.concat(o);let a=s.concat(o).filter(e=>e[2]>=0);for(let e=0;e<4;e++){let t=(e+1)%4;for(let[i,r]of[[s[e],o[e]],[s[e],s[t]],[o[e],o[t]]])if(i[2]<0!=r[2]<0){let e=i[2]/(i[2]-r[2]);a.push([i[0]+(r[0]-i[0])*e,i[1]+(r[1]-i[1])*e,0])}}return a.length>0?a:s.concat(o)}(e);for(let n of t){let t=n.clone().translate(new z.P(e.center).negate()),s=r.map(e=>t.transform(e)),o=new N.k().ortho({left:Math.min(...s.map(e=>e[0])),right:Math.max(...s.map(e=>e[0])),bottom:Math.min(...s.map(e=>e[1])),top:Math.max(...s.map(e=>e[1])),near:Math.min(...s.map(e=>-e[2])),far:Math.max(...s.map(e=>-e[2]))});i.push(o.multiplyRight(n))}return i}),en=[0,0,0,1],es=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],eo={name:"shadow",module:{name:"shadow",dependencies:[Y.A],vs:Q,fs:et,getUniforms:function(e){let{shadowEnabled:t=!0,project:i}=e;if(!t||!i||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=Y.A.getUniforms(i),n=ei({viewport:i.viewport,center:r.center}),s=[],o=er({shadowMatrices:e.shadowMatrices,viewport:i.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],a=e.clone().translate(new z.P(i.viewport.center).negate());r.coordinateFrame===T.r.GEODETIC&&r.projectionMode===T.K.WEB_MERCATOR?(o[t]=a,s[t]=n):(o[t]=e.clone().multiplyRight(es),s[t]=a.transform(n))}let a={drawShadowMap:!!e.drawToShadowMap,useShadowMap:!!e.shadowMaps&&e.shadowMaps.length>0,color:e.shadowColor||en,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)a[`viewProjectionMatrix${e}`]=o[e],a[`projectCenter${e}`]=s[e];for(let t=0;t<2;t++)a[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return a},uniformTypes:{drawShadowMap:"f32",useShadowMap:"f32",color:"vec4<f32>",lightId:"i32",lightCount:"f32",viewProjectionMatrix0:"mat4x4<f32>",viewProjectionMatrix1:"mat4x4<f32>",projectCenter0:"vec4<f32>",projectCenter1:"vec4<f32>"}},injections:{"glsl:vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"glsl:fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `}},ea={color:[255,255,255],intensity:1},el=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],ec=[0,0,0,200/255];class eu{constructor(e={}){this.id="lighting-effect",this.shadowColor=ec,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:i}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),i._addDefaultShaderPlugin(eo),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){for(let t in this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[],e){let i=e[t];switch(i.type){case"ambient":this.ambientLight=i;break;case"directional":this.directionalLights.push(i);break;case"point":this.pointLights.push(i)}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&(this.shadow||this.cleanup(this.context),this.setup(this.context)),this.props=e}preRender({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:n}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let s=0;s<this.shadowPasses.length;s++)this.shadowPasses[s].render({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:n,shaderModuleProps:{shadow:{shadowLightId:s,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let i=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,lights:this._getLights(e)},n=e.props.material;return{shadow:i,lighting:r,phongMaterial:n,gouraudMaterial:n}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderPlugin(eo))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let i=new N.k().lookAt({eye:new z.P(t.direction).negate()});e.push(i)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let i=new H(e);this.shadowPasses[t]=i}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:i}=this;e||0!==t.length||0!==i.length||(this.ambientLight=new j(ea),this.directionalLights.push(new V(el[0]),new V(el[1])))}_getLights(e){let t=[];for(let i of(this.ambientLight&&t.push(this.ambientLight),this.pointLights))t.push(i.getProjectedLight({layer:e}));for(let i of this.directionalLights)t.push(i.getProjectedLight({layer:e}));return t}}let eh=new eu;class ed{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw="Initial render",this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let i=t.findIndex(t=>(t.order??1/0)-(e.order??1/0)>0);i<0?t.push(e):t.splice(i,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){"effects"in e&&!(0,O.b)(e.effects,this.effects,1)&&this._setEffects(e.effects)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let i=[];for(let r of e){let e=t[r.id],n=r;e&&e!==r?e.setProps?(e.setProps(r.props),n=e):e.cleanup(this._context):e||r.setup(this._context),i.push(n),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=i,this._resolvedEffects=i.concat(this._defaultEffects),e.some(e=>e instanceof eu)||this._resolvedEffects.push(eh),this._needsRedraw="effects changed"}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}}class ef extends W{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes("draw")||t.includes("terrain")}render(e){return this._render(e)}}let ep={blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"zero",blendAlphaOperation:"add",blendAlphaSrcFactor:"constant",blendAlphaDstFactor:"zero"};class eg extends W{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return"pickingFBO"in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:i,viewports:r,onViewportActive:n,pickingFBO:s,deviceRect:{x:o,y:a,width:l,height:c},cullRect:u,effects:h,pass:d="picking",pickZ:f,canvasContext:p,shaderModuleProps:g,clearColor:m}){this.pickZ=f;let _=this._resetColorEncoder(f),v="webgpu"===this.device.type?s.height-a-c:a,y=super._render({target:s,layers:e,layerFilter:t,views:i,viewports:r,onViewportActive:n,cullRect:u,effects:h?.filter(e=>e.useInPicking),pass:d,canvasContext:p,isPicking:!0,shaderModuleProps:g,clearColor:m??[0,0,0,0],colorMask:15,scissorRect:[o,v,l,c]});return this._colorEncoderState=null,{decodePickingColor:_&&e_.bind(null,_),stats:y}}shouldDrawLayer(e){let{pickable:t,operation:i}=e.props;return t&&i.includes("draw")||i.includes("terrain")||i.includes("mask")}getShaderModuleProps(e,t,i){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,i){let r={...e.props.parameters},{pickable:n,operation:s}=e.props;return this._colorEncoderState?n&&s.includes("draw")?(Object.assign(r,ep),r.blend=!0,"webgpu"===this.device.type?r.blendConstant=em(this._colorEncoderState,e,i):r.blendColor=em(this._colorEncoderState,e,i),s.includes("terrain")&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor="one")):s.includes("terrain")&&(r.blend=!1):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}}function em(e,t,i){let r,{byLayer:n,byAlpha:s}=e,o=n.get(t);return o?(o.viewports.push(i),r=o.a):(r=n.size+1)<=255?(o={a:r,layer:t,viewports:[i]},n.set(t,o),s[r]=o):(v.A.warn("Too many pickable layers, only picking the first 255")(),r=0),[0,0,0,r/255]}function e_(e,t){let i=e.byAlpha[t[3]];return i&&{pickedLayer:i.layer,pickedViewports:i.viewports,pickedObjectIndex:i.layer.decodePickingColor(t)}}class ev{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new ef(e),this.pickLayersPass=new eg(e),this.renderCount=0,this._needsRedraw="Initial render",this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw="layerFilter changed"),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw="drawPickingColors changed")}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,i={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let e=t.render(i),r="stats"in e?e.stats:e;this._updateStats(r);return}i.effects&&this._preRender(i.effects,i);let r=this.lastPostProcessEffect?this.renderBuffers[0]:i.target;this.lastPostProcessEffect&&(i.clearColor=[0,0,0,0],i.clearCanvas=!0);let n=t.render({...i,target:r}),s="stats"in n?n.stats:n;i.effects&&(this.lastPostProcessEffect&&(i.clearCanvas=void 0===e.clearCanvas||e.clearCanvas),this._postRender(i.effects,i)),this.renderCount++,(0,y.A)("deckRenderer.renderLayers",this,s,e),this._updateStats(s)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:i}of e)t+=i;this.stats.get("Layers rendered").addCount(t)}_preRender(e,t){for(let i of(this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{},e))t.preRenderStats[i.id]=i.preRender(t),i.postRender&&(this.lastPostProcessEffect=i.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,i=e.getDrawingBufferSize(),[r,n]=i;for(let e of(0===t.length&&[0,1].map(e=>{let i=this.device.createTexture({sampler:{minFilter:"linear",magFilter:"linear"},width:r,height:n});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,colorAttachments:[i]}))}),t))e.resize(i)}_postRender(e,t){let{renderBuffers:i}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,n={...t,inputBuffer:i[0],swapBuffer:i[1]};for(let t of e)if(t.postRender){n.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(n);n.inputBuffer=e,n.swapBuffer=e===i[0]?i[1]:i[0]}}}var ey=i(55861);let eb={pickedColor:null,pickedObjectIndex:-1};function ew({pickedColors:e,decodePickingColor:t,deviceX:i,deviceY:r,deviceRadius:n,deviceRect:s}){let{x:o,y:a,width:l,height:c}=s,u=n*n,h=-1,d=0;for(let t=0;t<c;t++){let n=t+a-r,s=n*n;if(s>u)d+=4*l;else for(let t=0;t<l;t++){if(e[d+3]-1>=0){let e=t+o-i,r=e*e+s;r<=u&&(u=r,h=d)}d+=4}}if(h>=0){let i=e.slice(h,h+4),r=t(i);if(r){let e=Math.floor(h/4/l),t=h/4-e*l;return{...r,pickedColor:i,pickedX:o+t,pickedY:a+e}}v.A.error("Picked non-existent layer. Is picking buffer corrupt?")()}return eb}function eE({pickedColors:e,decodePickingColor:t}){let i=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let n=e.slice(r,r+4),s=n.join(",");if(!i.has(s)){let e=t(n);e?i.set(s,{...e,color:n}):v.A.error("Picked non-existent layer. Is picking buffer corrupt?")()}}}return Array.from(i.values())}function eP({pickInfo:e,viewports:t,pixelRatio:i,x:r,y:n,z:s}){let o,a=t[0];if(t.length>1&&(a=function(e,t){for(let i=e.length-1;i>=0;i--){let r=e[i];if(r.containsPixel(t))return r}return e[0]}(e?.pickedViewports||t,{x:r,y:n})),a){let e=[r-a.x,n-a.y];void 0!==s&&(e[2]=s);try{(o=a.unproject(e)).every(Number.isFinite)||(o=null)}catch{o=null}}return{color:null,layer:null,viewport:a,index:-1,picked:!1,x:r,y:n,pixel:[r,n],coordinate:o,devicePixel:e&&"pickedX"in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:i}}function ex(e){let{pickInfo:t,lastPickedInfo:i,mode:r,layers:n}=e,{pickedColor:s,pickedLayer:o,pickedObjectIndex:a}=t,l=o?[o]:[];if("hover"===r){let e=i.index,t=i.layerId,r=o?o.props.id:null;if(r!==t||a!==e){if(r!==t){let e=n.find(e=>e.props.id===t);e&&l.unshift(e)}i.layerId=r,i.index=a,i.info=null}}let c=eP(e),u=new Map;return u.set(null,c),l.forEach(e=>{let t={...c};e===o&&(t.color=s,t.index=a,t.picked=!0);let n=(t=eS({layer:e,info:t,mode:r})).layer;e===o&&"hover"===r&&(i.info=t),u.set(n.id,t),"hover"===r&&n.updateAutoHighlight(t)}),u}function eS({layer:e,info:t,mode:i}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:i,sourceLayer:r}),e=e.parent}return t}class eT{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new eg(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){"layerFilter"in e&&(this.layerFilter=e.layerFilter),"_pickable"in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:i,viewports:r},n=this.lastPickedInfo.info){let s=n&&n.layer&&n.layer.id,o=n&&n.viewport&&n.viewport.id,a=s?i.find(e=>e.id===s):null,l=o&&r.find(e=>e.id===o)||r[0],c=l&&l.unproject([e-l.x,t-l.y]);return{...n,x:e,y:t,viewport:l,coordinate:c,layer:a}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:"rgba8unorm",width:1,height:1,usage:ey.g.RENDER_ATTACHMENT|ey.g.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:"depth16unorm"}),this.device.isTextureFormatRenderable("rgba32float")){let e=this.device.createTexture({format:"rgba32float",width:1,height:1,usage:ey.g.RENDER_ATTACHMENT|ey.g.COPY_SRC}),t=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:"depth16unorm"});this.depthFBO=t}}let[t,i]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:i}),this.depthFBO?.resize({width:t,height:i})}_getPickable(e){if(!1===this._pickable)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:i,x:r,y:n,radius:s=0,depth:o=1,mode:a="query",unproject3D:l,canvasContext:c=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:h}){let d,f=c.cssToDeviceRatio(),p=this._getPickable(e);if(!p||0===i.length)return{result:[],emptyInfo:eP({viewports:i,x:r,y:n,pixelRatio:f})};this._resizeBuffer(c);let g=c.cssToDevicePixels([r,n],!0),m=[g.x+Math.floor(g.width/2),g.y+Math.floor(g.height/2)],_=Math.round(s*f),{width:v,height:y}=this.pickingFBO,b=this._getPickingRect({deviceX:m[0],deviceY:m[1],deviceRadius:_,deviceWidth:v,deviceHeight:y}),w={x:r-s,y:n-s,width:2*s+1,height:2*s+1},E=[],P=new Set;for(let e=0;e<o;e++){let s,g;if(b){let e=await this._drawAndSampleAsync({layers:p,views:t,viewports:i,onViewportActive:u,deviceRect:b,cullRect:w,effects:h,pass:`picking:${a}`,canvasContext:c});s=ew({...e,deviceX:m[0],deviceY:m[1],deviceRadius:_,deviceRect:b})}else s={pickedColor:null,pickedObjectIndex:-1};let v=this._getDepthLayers(s,p,l);if(v.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:v,views:t,viewports:i,onViewportActive:u,deviceRect:{x:s.pickedX??m[0],y:s.pickedY??m[1],width:1,height:1},cullRect:w,effects:h,pass:`picking:${a}:z`,canvasContext:c},!0);e[3]&&(g=e[0])}for(let t of(s.pickedLayer&&e+1<o&&(P.add(s.pickedLayer),s.pickedLayer.disablePickingIndex(s.pickedObjectIndex)),(d=ex({pickInfo:s,lastPickedInfo:this.lastPickedInfo,mode:a,layers:p,viewports:i,x:r,y:n,z:g,pixelRatio:f})).values()))t.layer&&E.push(t);if(!s.pickedColor)break}for(let e of P)e.restorePickingColors();return{result:E,emptyInfo:d.get(null)}}_pickClosestObject({layers:e,views:t,viewports:i,x:r,y:n,radius:s=0,depth:o=1,mode:a="query",unproject3D:l,canvasContext:c=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:h}){let d,f=c.cssToDeviceRatio(),p=this._getPickable(e);if(!p||0===i.length)return{result:[],emptyInfo:eP({viewports:i,x:r,y:n,pixelRatio:f})};this._resizeBuffer(c);let g=c.cssToDevicePixels([r,n],!0),m=[g.x+Math.floor(g.width/2),g.y+Math.floor(g.height/2)],_=Math.round(s*f),{width:v,height:y}=this.pickingFBO,b=this._getPickingRect({deviceX:m[0],deviceY:m[1],deviceRadius:_,deviceWidth:v,deviceHeight:y}),w={x:r-s,y:n-s,width:2*s+1,height:2*s+1},E=[],P=new Set;for(let e=0;e<o;e++){let s,g;if(b){let e=this._drawAndSample({layers:p,views:t,viewports:i,onViewportActive:u,deviceRect:b,cullRect:w,effects:h,pass:`picking:${a}`,canvasContext:c});s=ew({...e,deviceX:m[0],deviceY:m[1],deviceRadius:_,deviceRect:b})}else s={pickedColor:null,pickedObjectIndex:-1};let v=this._getDepthLayers(s,p,l);if(v.length>0){let{pickedColors:e}=this._drawAndSample({layers:v,views:t,viewports:i,onViewportActive:u,deviceRect:{x:s.pickedX??m[0],y:s.pickedY??m[1],width:1,height:1},cullRect:w,effects:h,pass:`picking:${a}:z`,canvasContext:c},!0);e[3]&&(g=e[0])}for(let t of(s.pickedLayer&&e+1<o&&(P.add(s.pickedLayer),s.pickedLayer.disablePickingIndex(s.pickedObjectIndex)),(d=ex({pickInfo:s,lastPickedInfo:this.lastPickedInfo,mode:a,layers:p,viewports:i,x:r,y:n,z:g,pixelRatio:f})).values()))t.layer&&E.push(t);if(!s.pickedColor)break}for(let e of P)e.restorePickingColors();return{result:E,emptyInfo:d.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:i,x:r,y:n,width:s=1,height:o=1,mode:a="query",maxObjects:l=null,canvasContext:c=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:h}){let d=this._getPickable(e);if(!d||0===i.length)return[];this._resizeBuffer(c);let f=c.cssToDeviceRatio(),p=c.cssToDevicePixels([r,n],!0),g=p.x,m=p.y+p.height,_=c.cssToDevicePixels([r+s,n+o],!0),v=_.x+_.width,y=_.y,b=await this._drawAndSampleAsync({layers:d,views:t,viewports:i,onViewportActive:u,deviceRect:{x:g,y:y,width:v-g,height:m-y},cullRect:{x:r,y:n,width:s,height:o},effects:h,pass:`picking:${a}`,canvasContext:c}),w=eE(b),E=new Map,P=[],x=Number.isFinite(l);for(let e=0;e<w.length&&(!x||!(P.length>=l));e++){let t=w[e],i={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:n,pixelRatio:f},s=(i=eS({layer:t.pickedLayer,info:i,mode:a})).layer.id;E.has(s)||E.set(s,new Set);let o=E.get(s),l=i.object??i.index;o.has(l)||(o.add(l),P.push(i))}return P}_pickVisibleObjects({layers:e,views:t,viewports:i,x:r,y:n,width:s=1,height:o=1,mode:a="query",maxObjects:l=null,canvasContext:c=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:h}){let d=this._getPickable(e);if(!d||0===i.length)return[];this._resizeBuffer(c);let f=c.cssToDeviceRatio(),p=c.cssToDevicePixels([r,n],!0),g=p.x,m=p.y+p.height,_=c.cssToDevicePixels([r+s,n+o],!0),v=_.x+_.width,y=_.y,b=this._drawAndSample({layers:d,views:t,viewports:i,onViewportActive:u,deviceRect:{x:g,y:y,width:v-g,height:m-y},cullRect:{x:r,y:n,width:s,height:o},effects:h,pass:`picking:${a}`,canvasContext:c}),w=eE(b),E=new Map,P=[],x=Number.isFinite(l);for(let e=0;e<w.length&&(!x||!(P.length>=l));e++){let t=w[e],i={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:n,pixelRatio:f},s=(i=eS({layer:t.pickedLayer,info:i,mode:a})).layer.id;E.has(s)||E.set(s,new Set);let o=E.get(s),l=i.object??i.index;o.has(l)||(o.add(l),P.push(i))}return P}async _drawAndSampleAsync({layers:e,views:t,viewports:i,onViewportActive:r,deviceRect:n,cullRect:s,effects:o,pass:a,canvasContext:l},c=!1){let u=c?this.depthFBO:this.pickingFBO,h={layers:e,layerFilter:this.layerFilter,views:t,viewports:i,onViewportActive:r,pickingFBO:u,deviceRect:n,cullRect:s,effects:o,pass:a,canvasContext:l,pickZ:c,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(h.preRenderStats[e.id]=e.preRender(h));let{decodePickingColor:d,stats:f}=this.pickLayersPass.render(h);this._updateStats(f);let{x:p,y:g,width:m,height:_}=n,y=u.colorAttachments[0]?.texture;if(!y)throw Error("Picking framebuffer color attachment is missing");let b=await this._readTextureDataAsync(y,{x:p,y:g,width:m,height:_},c?Float32Array:Uint8Array);if(!c){let e=!1;for(let t=3;t<b.length;t+=4)if(0!==b[t]){e=!0;break}!e&&b.length>0&&v.A.warn("Async pick readback returned only zero alpha values",{deviceRect:n,bytes:Array.from(b.subarray(0,Math.min(b.length,16)))})()}return{pickedColors:b,decodePickingColor:d}}async _readTextureDataAsync(e,t,i){let{width:r,height:n}=t,s=e.computeMemoryLayout(t),o=this.device.createBuffer({byteLength:s.byteLength,usage:S.h.COPY_DST|S.h.MAP_READ});try{let a="webgpu"===this.device.type;e.readBuffer(a?{...t,y:e.height-t.y-n}:t,o);let l=await o.readAsync(0,s.byteLength),c=i.BYTES_PER_ELEMENT;if(s.bytesPerRow%c!=0)throw Error(`Texture readback row stride ${s.bytesPerRow} is not aligned to ${c}-byte elements.`);let u=new i(l.buffer,l.byteOffset,s.byteLength/c),h=4*r,d=s.bytesPerRow/c;if(d<h)throw Error(`Texture readback row stride ${d} is smaller than packed row length ${h}.`);let f=new i(r*n*4);for(let e=0;e<n;e++){let t=(a?n-1-e:e)*d;f.set(u.subarray(t,t+h),e*h)}return f}finally{o.destroy()}}_drawAndSample({layers:e,views:t,viewports:i,onViewportActive:r,deviceRect:n,cullRect:s,effects:o,pass:a,canvasContext:l},c=!1){let u=c?this.depthFBO:this.pickingFBO,h={layers:e,layerFilter:this.layerFilter,views:t,viewports:i,onViewportActive:r,pickingFBO:u,deviceRect:n,cullRect:s,effects:o,pass:a,canvasContext:l,pickZ:c,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(h.preRenderStats[e.id]=e.preRender(h));let{decodePickingColor:d,stats:f}=this.pickLayersPass.render(h);this._updateStats(f);let{x:p,y:g,width:m,height:_}=n,v=new(c?Float32Array:Uint8Array)(m*_*4);return this.device.readPixelsToArrayWebGL(u,{sourceX:p,sourceY:g,sourceWidth:m,sourceHeight:_,target:v}),{pickedColors:v,decodePickingColor:d}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:i}of e)t+=i;this.stats.get("Layers picked").addCount(t)}_getDepthLayers(e,t,i){if(!i||!this.depthFBO)return[];let{pickedLayer:r}=e,n=r?.state?.terrainDrawMode==="drape";return r&&!n?[r]:t.filter(e=>e.props.operation.includes("terrain"))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:i,deviceWidth:r,deviceHeight:n}){let s=Math.max(0,e-i),o=Math.max(0,t-i),a=Math.min(r,e+i+1)-s,l=Math.min(n,t+i+1)-o;return a<=0||l<=0?null:{x:s,y:o,width:a,height:l}}}var eM=i(9350);let eC={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},eA="root";class eO{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add("deck-widget-container"),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!(0,O.b)(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);for(let e in this.defaultWidgets.length=0,this.resolvedWidgets.length=0,this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let i=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getWidgets()){let{viewId:n}=r;if(n){let e=i[n];e&&(r.onViewportChange&&r.onViewportChange(e),r.onRedraw?.({viewports:[e],layers:t}))}else{if(r.onViewportChange)for(let t of e)r.onViewportChange(t);r.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=i,this._updateContainers()}onHover(e,t){for(let i of this.getWidgets()){let{viewId:r}=i;r&&r!==e.viewport?.id||i.onHover?.(e,t)}}getCanvasBounds(e){let t=this.deck?.getCanvas?.(),i=t?.getBoundingClientRect(),r=this.parentElement?.getBoundingClientRect(),n=this.deck?.getCanvasContext?.(e?.id);if(n&&r){n.updatePosition();let[e,t]=n.getPosition(),[i,s]=n.getCSSSize();return{x:e-r.left,y:t-r.top,width:i,height:s}}return{x:i&&r?i.left-r.left:0,y:i&&r?i.top-r.top:0,width:i?.width||this.deck?.width||0,height:i?.height||this.deck?.height||0}}onEvent(e,t){let i=eM.tg[t.type];if(i)for(let r of this.getWidgets()){let{viewId:n}=r;n&&n!==e.viewport?.id||r[i]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;for(let e of(this.resolvedWidgets.length=0,this.defaultWidgets))t[e.id]=null,this.resolvedWidgets.push(e);for(let i of e){let e=t[i.id];e?e.viewId!==i.viewId||e.placement!==i.placement?(this._removeWidget(e),this._addWidget(i)):i!==e&&(e.setProps(i.props),i=e):this._addWidget(i),t[i.id]=null,this.resolvedWidgets.push(i)}for(let e in t){let i=t[e];i&&this._removeWidget(i)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:i="top-left"}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,i).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&"string"!=typeof e)return e;let i=e||eA,r=this.containers[i];r||((r=document.createElement("div")).style.pointerEvents="none",r.style.position="absolute",r.style.overflow="hidden",this.parentElement?.append(r),this.containers[i]=r);let n=r.querySelector(`.${t}`);return n||((n=globalThis.document.createElement("div")).className=t,n.style.position="absolute",n.style.zIndex="2",Object.assign(n.style,eC[t]),r.append(n)),n}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,i=e===eA||t,r=this.containers[e];if(i){let e=this._getContainerBounds(t);r.style.display="block",r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display="none"}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}}var ek=i(1354);let eI={zIndex:"1",position:"absolute",pointerEvents:"none",color:"#a0a7b4",backgroundColor:"#29323c",padding:"10px",top:"0",left:"0",display:"none"};class eL extends ek.x{constructor(e={}){super(e),this.id="default-tooltip",this.placement="fill",this.className="deck-tooltip",this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement("div");return e.className=this.className,Object.assign(e.style,eI),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,i=t&&t.props.getTooltip;if(!i)return;let r=i(e),n=this.widgetManager?.getCanvasBounds(e.viewport),s=e.x+(n?.x||0),o=e.y+(n?.y||0);this.setTooltip(r,s,o)}setTooltip(e,t,i){let r=this.rootElement;if(r){if("string"==typeof e)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display="none";return}this.isVisible=!0,r.style.display="block",r.style.transform=`translate(${t}px, ${i}px)`,e&&"object"==typeof e&&"style"in e&&Object.assign(r.style,e.style)}}}eL.defaultProps={...ek.x.defaultProps};var eR=i(24067);class eB{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),i={},r=[],n=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);n.set(t,(n.get(t)||0)+1)}for(let{id:s,canvas:o}of t){let t=this._getEventRoot(o),a=1===n.get(t)?t:o,l=this.targets[s];if(!l||l.device!==e.device||l.canvas!==o||l.eventRoot!==a){l?.eventManager.destroy(),l?.presentationContext.destroy();let t=e.device.createPresentationContext({id:s,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});l={id:s,device:e.device,canvas:o,eventRoot:a,presentationContext:t,eventManager:this._createEventManager(a)}}this._eventRootToCanvasId.set(a,s),this._eventRootToCanvasId.set(o,s),i[s]=l,r.push(s)}for(let[e,t]of Object.entries(this.targets))i[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=i,this.order=r;let s=Object.fromEntries(Object.entries(i).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(s)||(this.eventManagers=s)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||k]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,i)=>{let r,n;return"string"==typeof e?(r=document.getElementById(e),(0,eR.A)(r,`Canvas with id ${e} not found`),n=e):n=(r=e).id||`deckgl-canvas-${i}`,(0,eR.A)(!t.has(n),`Duplicate canvas id ${n}`),t.add(n),{id:n,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),i=Object.keys(this.eventManagers);return t.length===i.length&&t.every(t=>e[t]===this.eventManagers[t])}}var ej=i(23459),ez=i(5223),eD=i(67052);let eU={dataType:null,batchType:null,id:"JSON",name:"JSON",module:"",version:"",options:{},extensions:["json","geojson"],mimeTypes:["application/json","application/geo+json"],testText:function(e){let t=e[0],i=e[e.length-1];return"{"===t&&"}"===i||"["===t&&"]"===i},parseTextSync:JSON.parse},eF=function(){let e="10.0.0-alpha.1",t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(v.A.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:v.A,_registerLoggers:y.k},(0,ez.mk)([eU,[eD.$,{imagebitmap:{premultiplyAlpha:"none"}}]])),e}();var eV=i(29159),eN=i(59565),e$=i(63744);let eG=0,eW={requestAnimationFrame:e=>{let t;return(t="u">typeof window?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null)?t.call(window,e):setTimeout(()=>e("u">typeof performance?performance.now():Date.now()),1e3/60)},cancelAnimationFrame:e=>{let t;(t="u">typeof window?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null)?t.call(window,e):clearTimeout(e)}};class eq{static defaultAnimationLoopProps={device:null,mobileQuality:void 0,onAddHTML:()=>"",onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:eW};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw="initialized";_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(e){if(this.props={...eq.defaultAnimationLoopProps,...e},!(e=this.props).device)throw Error("No device provided");this.stats=e.stats||new e$.A({id:`animation-loop-${eG++}`}),this.sharedStats=eV.a.stats.get("Animation Loop"),this.frameRate=this.stats.get("Frame Rate"),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get("CPU Time"),this.gpuTime=this.stats.get("GPU Time"),this.setProps({autoResizeViewport:e.autoResizeViewport,animationFrameProvider:e.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this._stopEventHandling(),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(e){this._error=e,this.props.onError(e),this.props.onError===eq.defaultAnimationLoopProps.onError&&"u">typeof window&&"u">typeof ErrorEvent&&window.dispatchEvent(new ErrorEvent("error",{error:e,message:e.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if("autoResizeViewport"in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),"animationFrameProvider"in e){let t=e.animationFrameProvider||eW;if(t!==this.props.animationFrameProvider){let e=null!==this._animationFrameId;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{let e;if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}if(!this._running)return null;return!1!==e&&(this._cancelAnimationFrame(),this._requestAnimationFrame()),this}catch(t){let e=t instanceof Error?t:Error("Unknown error");throw this.props.onError(e),e}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error||(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&(this._resolveNextFrame(this),this._nextFramePromise=null,this._resolveNextFrame=null),this._endFrameTimers()),this}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw("waitForRender"),this._nextFramePromise||(this._nextFramePromise=new Promise(e=>{this._resolveNextFrame=e})),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw("toDataURL"),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error("OffscreenCanvas")}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){null!==this._animationFrameId&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(t){let e=t instanceof Error?t:Error(String(t));this.reportError(e),this.stop()}}_renderFrame(e){if(this.display)return void this.display._renderFrame(e);let t=this.props.onRender(this._getAnimationProps());this.device&&!1!==t&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error("loop");let t=e?.canvas,i=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:i,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null,mobileQuality:this.props.mobileQuality}}_getAnimationProps(){if(!this.animationProps)throw Error("animationProps");return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:i}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw("drawing buffer resized"),i!==this.animationProps.aspect&&this.setNeedsRedraw("drawing buffer aspect changed"),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=i,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error("No device provided");this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement("div");document.body.appendChild(e),e.style.position="relative";let t=document.createElement("div");t.style.position="absolute",t.style.left="10px",t.style.bottom="10px",t.style.width="300px",t.style.background="white",this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let i=this.props.onAddHTML(t);i&&(t.innerHTML=i)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??("u">typeof performance?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;void 0!==e&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener("mousemove",this._onMousemove),this.canvas.addEventListener("mouseleave",this._onMouseleave))}_stopEventHandling(){this.canvas?.removeEventListener("mousemove",this._onMousemove),this.canvas?.removeEventListener("mouseleave",this._onMouseleave)}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}}var eH=i(92767);function eY(){}function eZ(e){return e.deviceProps?.debug??e.debug}let eX={id:"",width:"100%",height:"100%",style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:"auto",layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:"none",eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:eY,onWebGLInitialized:eY,onResize:eY,onViewStateChange:eY,onInteractionStateChange:eY,onBeforeRender:eY,onAfterRender:eY,onLoad:eY,onError:e=>v.A.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:({isDragging:e})=>e?"grabbing":"grab",getTooltip:null,debug:!1,drawPickingColors:!1};class eK{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new w.A({id:"deck.gl"}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw="Initial render",this._canvasManager=new eB({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._pickRequest={mode:"hover",x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,i=this._getCanvasIdFromEvent(e);if("pointerleave"===e.type)t.x=-1,t.y=-1,t.radius=0,t.canvasId=i;else{if(e.leftButton||e.rightButton)return;let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=i}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=eM.tg[e.type],i=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!i||!this.layerManager)return;let n=this.layerManager.getLayers(),s=this._getInternalPickingMode();if(s){if("sync"===s){let t="click"===e.type&&this._shouldUnproject3D(n)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(i.x,i.y,{unproject3D:!0,canvasId:r},n))):this._getLastPointerDownPickingInfo(i.x,i.y,r,n);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(i.x,i.y,r,n))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,i=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let n=this.layerManager?.getLayers()||[],s=++this._pointerDownPickSequence;if("sync"===r){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:i,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:i},n)).then(e=>this._getFirstPickedInfo(e)).then(e=>(s===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,i,n):{};return s===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...eX,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&v.A.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let i=this.device;!i&&e.gl&&(e.gl instanceof WebGLRenderingContext&&v.A.error("WebGL1 context not supported.")(),i=eN.l.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps,debug:eZ(e)})),i||(i=this._createDevice(e)),this.animationLoop=this._createAnimationLoop(i,e),this.setProps(t),e._typedArrayManagerProps&&ej.A.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get("setProps Time").timeStart(),"onLayerHover"in e&&v.A.removed("onLayerHover","onHover")(),"onLayerClick"in e&&v.A.removed("onLayerClick","onClick")(),e.initialViewState&&!(0,O.b)(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),(0,eR.A)(!("_canvases"in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),this._isMultiCanvasMode()||this.canvas===t.canvas||(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),v.A.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),void 0!==e.useDevicePixels&&this._canvasContext?.setProps)for(let t of(this._canvasContext.setProps({useDevicePixels:e.useDevicePixels}),Object.values(this._canvasManager.targets)))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels});this.layerManager&&(this.viewManager.setProps(t),this.layerManager.setViewports(this.getViewports(),this.viewManager.views),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get("setProps Time").timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return"Deck._animate";let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let i=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),n=this.effectManager.needsRedraw(e),s=this.deckRenderer.needsRedraw(e);return t||i||r||n||s}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});(t=e||t)&&(this.stats.get("Redraw Count").incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return null!==this.viewManager}getViews(){return(0,eR.A)(this.viewManager),this.viewManager.views}getView(e){return(0,eR.A)(this.viewManager),this.viewManager.getView(e)}getViewports(e){return(0,eR.A)(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||k;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync("pickObjectAsync","pickObject Time",e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync("pickObjectsAsync","pickObjects Time",e)}pickObject(e){let t=this._pick("pickObject","pickObject Time",e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick("pickObject","pickMultipleObjects Time",e).result}pickObjects(e){return this._pick("pickObjects","pickObjects Time",e)}_pickPositionForController(e,t,i){return"sync"!==this._getInternalPickingMode()?null:this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:i?this.viewManager?.getCanvasId(i):void 0})}_addResources(e,t=!1){for(let i in e)this.layerManager.resourceManager.add({resourceId:i,data:e[i],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_addDefaultShaderPlugin(e){this.layerManager.addDefaultShaderPlugin(e)}_removeDefaultShaderPlugin(e){this.layerManager?.removeDefaultShaderPlugin(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if("auto"===e)return"webgpu"===t?"async":"sync";if("sync"===e&&"webgpu"===t)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>"3d"===e.props.pickable)}_getPointPickOptions(e,t,i={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:i.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...i}}_pickPointSync(e){return this._pick("pickObject","pickObject Time",e)}_pickPointAsync(e){return this._pickAsync("pickObjectAsync","pickObject Time",e)}_getLastPointerDownPickingInfo(e,t,i,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:i})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},i){if(!this.widgetManager)return;this.cursorState.isHovering=e.length>0;let r=t,n=!1;for(let t of e)r=t,n=t.layer?.onHover(t,i)||n;n||(this.props.onHover?.(r,i),this.widgetManager.onHover(r,i))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let i=eM.tg[t.type];if(!i)return;let{layer:r}=e,n=r&&(r[i]||r.props[i]),s=this.props[i],o=!1;n&&(o=n.call(r,e,t)),o||(s?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,i){(0,eR.A)(this.deckPicker);let{stats:r}=this,n=this._isMultiCanvasMode()?i.canvasId||this._getDefaultCanvasId():i.canvasId,s=this._getCanvasContext(n)||void 0;r.get("Pick Count").incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(n);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(i),views:this.viewManager.getViews(),viewports:this.getViewports({...i,canvasId:n}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...i,canvasId:n,canvasContext:s});return r.get(t).timeEnd(),o}_pick(e,t,i){(0,eR.A)(this.deckPicker);let{stats:r}=this,n=this._isMultiCanvasMode()?i.canvasId||this._getDefaultCanvasId():i.canvasId,s=this._getCanvasContext(n)||void 0;r.get("Pick Count").incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(n);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(i),views:this.viewManager.getViews(),viewports:this.getViewports({...i,canvasId:n}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...i,canvasId:n,canvasContext:s});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return"string"==typeof t&&(t=document.getElementById(t),(0,eR.A)(t)),t?this._ownedCanvas=null:((t=document.createElement("canvas")).id=e.id||"deckgl-overlay",e.width&&"number"==typeof e.width&&(t.width=e.width),e.height&&"number"==typeof e.height&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||k}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&((0,eR.A)(!e.canvas),(0,eR.A)(!e.gl),(0,eR.A)(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new eH.EU(e,{touchAction:this.props.touchAction,recognizers:Object.keys(eM.We).map(e=>{let[t,i,r,n]=eM.We[e],s=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...i,...s,event:e}),recognizeWith:r,requireFailure:n}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in eM.tg)"dblclick"===e?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(".deck-events-root")||this.props.parent?.querySelector(".deck-events-root")||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,"style"in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let i=e.getDefaultCanvasContext();this._setCanvasContext(i),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let i=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=i;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:i}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=eY),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:i}=e;if(t||0===t){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(i||0===i){let t=Number.isFinite(i)?`${i}px`:i;this.canvas.style.position=e.style?.position||"absolute",this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[i,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(i,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t("number"==typeof e.width&&Number.isFinite(e.width)?e.width:1,"number"==typeof e.height&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode())return void this._updateMultiCanvasDimensions();let{canvas:t}=this,[i,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(i!==this.width||r!==this.height)&&(this.width=i,this.height=r,this.viewManager?.setProps({width:i,height:r}),this.layerManager?.setViewports(this.getViewports(),this.viewManager.views),this.props.onResize({width:i,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:i}=e.canvas;e.setDrawingBufferSize(t,i)}this._needsRedraw="Canvas resized",this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw="Canvas resized",this.viewManager?.setNeedsUpdate("Canvas resized"),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:i,onError:r}=t;return new eq({device:e,autoResizeDrawingBuffer:!i&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,i={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps,debug:eZ(e)};i.adapters.includes(eN.l)||i.adapters.push(eN.l);let r={alphaMode:this.props.deviceProps?.type==="webgpu"?"premultiplied":void 0};return eV.a.createDevice({_reuseDevices:!0,type:"webgl",...i,createCanvasContext:{...r,..."object"==typeof t?t:void 0,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new L.A({id:"default-view"})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error("WebGL context is lost"))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,i=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},i),n=this._getInternalPickingMode(),s=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!n)return;if("sync"===n)return void this._applyHoverCallbacks(this._pickPointSync(r),t);this._pickPointAsync(r).then(({result:e,emptyInfo:i})=>{s===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:i},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),"webgl"===this.device.type&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized?.(this.device),"webgl"===this.device.type&&this.props.onWebGLInitialized(this.device.gl);let t=new s;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);(0,eR.A)(e),this.eventManager=this._createEventManager(e),this.eventManagers={[k]:this.eventManager}}this.viewManager=new I({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),onViewRemoved:e=>this.layerManager?.projectionScaleResources.delete(e),onError:e=>this.props.onError?.(e),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let i=this.viewManager.getViewports()[0];this.layerManager=new A(this.device,{deck:this,stats:this.stats,viewport:i,timeline:t}),this.effectManager=new ed({deck:this,device:this.device}),this.deckRenderer=new ev(this.device,{stats:this.stats}),this.deckPicker=new eT(this.device,{stats:this.stats});let r=this.props.parent?.querySelector(".deck-widgets-root")||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new eO({deck:this,parentElement:r}),this.widgetManager.addDefault(new eL),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:i,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:i,gl:r});let n={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:"screen",effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&"screen"===n.pass&&!n.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=n.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...n,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let i=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=i.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...n,canvasContext:i.presentationContext,target:r,viewports:t}),i.presentationContext.present()}else this.deckRenderer?.renderLayers(n);"screen"===n.pass&&this.widgetManager.onRedraw({viewports:n.viewports,layers:n.layers}),this.props.onAfterRender({device:i,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),v.A.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.viewManager.updateViewports()&&this.layerManager.setViewports(this.getViewports(),this.viewManager.views),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},!this.props.viewState&&this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get("frameRate").timeEnd(),e.get("frameRate").timeStart();let t=this.animationLoop.stats;e.get("GPU Time").addTime(t.get("GPU Time").lastTiming),e.get("CPU Time").addTime(t.get("CPU Time").lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get("frameRate").getHz(),e.setPropsTime=t.get("setProps Time").time,e.updateAttributesTime=t.get("Update Attributes").time,e.framesRedrawn=t.get("Redraw Count").count,e.pickTime=t.get("pickObject Time").time+t.get("pickMultipleObjects Time").time+t.get("pickObjects Time").time,e.pickCount=t.get("Pick Count").count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get("Layers rendered").lastSampleCount,e.pickLayersCount=t.get("Layers picked").lastSampleCount,e.updateLayersCount=t.get("Layer updates").count,e.updateAttributesCount=t.get("Attributes updated").count,e.gpuTime=t.get("GPU Time").time,e.cpuTime=t.get("CPU Time").time,e.gpuTimePerFrame=t.get("GPU Time").getAverageTime(),e.cpuTimePerFrame=t.get("CPU Time").getAverageTime();let i=eV.a.stats.get("GPU Time and Memory");e.bufferMemory=i.get("Buffer Memory").count,e.textureMemory=i.get("Texture Memory").count,e.renderbufferMemory=i.get("Renderbuffer Memory").count,e.gpuMemory=i.get("GPU Memory").count}}eK.defaultProps=eX,eK.VERSION=eF;let eJ=eK},64177(e,t,i){i.d(t,{A:()=>tP});var r={};i.r(r),i.d(r,{arithmetic:()=>L,castData:()=>R.K,convertColors:()=>B.K,dot:()=>F,equalAll:()=>V,extent:()=>j,fround:()=>z,gather:()=>D,interleave:()=>U,length:()=>N,segmentedMap:()=>$,select:()=>W,sequence:()=>H,swizzle:()=>Y});var n=i(8994),s=i(75130),o=i(88203),a=i(15465),l=i(13240),c=i(57285);let u=c.r.getDataType.bind(c.r);function h(e,t,i){if(t.size>4)return null;let r="webgpu"===i&&"uint8"===t.type?"unorm8":t.type,n=t.size,s=!!("webgpu"!==i&&3===n&&r&&["uint8","sint8","unorm8","snorm8","uint16","sint16","unorm16","snorm16"].includes(r));return{attribute:e,format:n>1?`${r}x${n}${s?"-webgl":""}`:t.type,byteOffset:t.offset||0}}function d(e){return e.stride||e.size*e.bytesPerElement}var f=i(23459),p=i(25667),g=i(26391);function m(e,t){t.offset&&g.A.removed("shaderAttribute.offset","vertexOffset, elementOffset")();let i=d(e),r=(void 0!==t.vertexOffset?t.vertexOffset:e.vertexOffset||0)*i+(t.elementOffset||0)*e.bytesPerElement+(e.offset||0);return{...t,offset:r,stride:i}}class _{constructor(e,t,i){let r;this._buffer=null,this.device=e,this.id=t.id||"",this.size=t.size||1;let n=t.logicalType||t.type,s="float64"===n,{defaultValue:o}=t;o=Number.isFinite(o)?[o]:o||Array(this.size).fill(0),r=s?"float32":!n&&t.isIndexed?"uint32":n||"float32";let a=function(e){switch(e){case"float64":return Float64Array;case"uint8":case"unorm8":return Uint8ClampedArray;default:return(0,l.Ak)(e)}}(n||r);this.doublePrecision=s,s&&!1===t.fp64&&(a=Float32Array),this.value=null,this.settings={...t,defaultType:a,defaultValue:o,logicalType:n,type:r,normalized:r.includes("norm"),size:this.size,bytesPerElement:a.BYTES_PER_ELEMENT},this.state={...i,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*d(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&(this._buffer.delete(),this._buffer=null),f.A.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&"webgpu"!==this.device.type?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let i={};if(this.state.constant){let r=this.value;if("webgpu"===this.device.type&&this._buffer)i[e]=this._buffer;else if(t){let n=m(this.getAccessor(),t),s=n.offset/r.BYTES_PER_ELEMENT,o=n.size||this.size;i[e]=r.subarray(s,s+o)}else i[e]=r}else i[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?i[`${e}64Low`]=i[e]:i[`${e}64Low`]=new Float32Array(this.size)),i}_getBufferLayout(e=this.id,t=null){let i=this.getAccessor(),r=[],n={name:this.id,byteStride:"webgpu"===this.device.type&&this.state.constant?0:d(i)};if(this.doublePrecision){let n,s={high:n=m(i,t||{}),low:{...n,offset:n.offset+4*i.size}};r.push(h(e,{...i,...s.high},this.device.type),h(`${e}64Low`,{...i,...s.low},this.device.type))}else if(t){let n=m(i,t);r.push(h(e,{...i,...n},this.device.type))}else r.push(h(e,i,this.device.type));return n.attributes=r.filter(Boolean),n}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:i,size:r}=this,n=i*r;if(t&&n&&t.length>=n){let i=Array(r).fill(1/0),s=Array(r).fill(-1/0);for(let e=0;e<n;)for(let n=0;n<r;n++){let r=t[e++];r<i[n]&&(i[n]=r),r>s[n]&&(s[n]=r)}e=[i,s]}}return this.state.bounds=e,e}setData(e){let t,{state:i}=this;t=ArrayBuffer.isView(e)?{value:e}:e instanceof n.h?{buffer:e}:e;let r={...this.settings,...t};if(ArrayBuffer.isView(t.value)){if(!t.type)if(this.doublePrecision&&t.value instanceof Float64Array)r.type="float32";else{let e=u(t.value);r.type=r.normalized?e.replace("int","norm"):e}r.bytesPerElement=t.value.BYTES_PER_ELEMENT,r.stride=d(r)}if(i.bounds=null,t.constant){let e=t.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!i.constant||!this._areValuesEqual(e,this.value)))return!1;i.externalBuffer=null,i.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(t.buffer)i.externalBuffer=t.buffer,i.constant=!1,this.value=t.value||null;else if(t.value){this._checkExternalBuffer(t);let e=t.value,n=e;i.externalBuffer=null,i.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(n)&&(n=(0,p.cT)(n,r),e instanceof Float32Array&&(r.stride=2*r.size*Float32Array.BYTES_PER_ELEMENT));let{buffer:s}=this,o=d(r),a=(r.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;n.constructor!==e&&(n=new e(n))}let l=n.byteLength+a+2*o;(!s||s.byteLength<l)&&(s=this._createBuffer(l)),s.write(n,a)}return this.setAccessor(r),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:i=0,endOffset:r}=e,n=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(n?(0,p.cT)(t,{size:this.size,startIndex:i,endIndex:r}):t.subarray(i,r),i*(n?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:i}=this,r=i.allocatedValue,n=f.A.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=n;let s=this._shouldSplitDoublePrecisionValue(n),o=s&&n instanceof Float32Array?{...this.settings,stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:a}=this,{buffer:l}=this,c=n.byteLength*(s&&n instanceof Float32Array?2:1);return(!l||l.byteLength<c+a)&&(l=this._createBuffer(c+a),t&&r&&l.write(this._shouldSplitDoublePrecisionValue(r)?(0,p.cT)(r,this):r,a)),i.allocatedValue=n,i.constant=!1,i.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||"webgpu"===this.device.type&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let i=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);t instanceof i||!this.settings.normalized||"normalized"in e||g.A.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case"snorm8":return new Float32Array(e).map(e=>(e+128)/255*2-1);case"snorm16":return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case"unorm8":return new Float32Array(e).map(e=>e/255);case"unorm16":return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,i){let{defaultValue:r,size:n}=this.settings;if(Number.isFinite(e))return t[i]=e,t;if(!e){let e=n;for(;--e>=0;)t[i+e]=r[e];return t}switch(n){case 4:t[i+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[i+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[i+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[i+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let s=n;for(;--s>=0;)t[i+s]=Number.isFinite(e[s])?e[s]:r[s]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:i}=this;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:i}=this.settings,r="webgpu"!==this.device.type||t?(t?n.h.INDEX:n.h.VERTEX)|n.h.COPY_DST:n.h.VERTEX|n.h.STORAGE|n.h.COPY_DST|n.h.COPY_SRC;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:r,indexType:t?i:void 0,byteLength:e}),this._buffer}}var v=i(24067),y=i(53439),b=i(38055);let w=[],E=[[0,1/0]],P={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function x(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:"interpolation",duration:e});let i=e.type||"interpolation";return{...P[i],...t,...e,type:i}}var S=i(51002),T=i(35098),M=i(61439);class C extends _{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:E}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setLayoutChanged(){this.state.layoutChanged=!0}setAccessor(e){var t,i;(t=this.state).layoutChanged||(i=this.getAccessor(),t.layoutChanged=e.type!==i.type||e.size!==i.size||d(e)!==d(i)||(e.offset||0)!==(i.offset||0)),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat("function"!=typeof e&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,i=this.settings.transition;return x(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],i)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:i=1/0}=t;this.state.updateRanges=function(e,t){if(e===E||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let i=[],r=e.length,n=0;for(let s=0;s<r;s++){let r=e[s];r[1]<t[0]?(i.push(r),n=s+1):r[0]>t[1]?i.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return i.splice(n,0,t),i}(this.state.updateRanges,[e,i])}else this.state.updateRanges=E}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=w}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:i}=this;if(i.noAlloc)return!1;if(i.update){let i=this.isConstant;return super.allocate(e,t.updateRanges!==E),t.layoutChanged||(t.layoutChanged=i&&"webgpu"===this.device.type),!0}return!1}updateBuffer({numInstances:e,data:t,props:i,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:n},settings:{update:s,noAlloc:o}}=this,a=!0;if(s){for(let[o,a]of n)s.call(r,this,{data:t,startRow:o,endRow:a,props:i,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,i]of n){let r=Number.isFinite(t)?this.getVertexOffset(t):0,n=Number.isFinite(i)?this.getVertexOffset(i):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:n})}this._checkAttributeArray()}else a=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),a}setConstantValue(e,t){if(void 0===t||"function"==typeof t)return!1;let i=this.settings.transform&&e?this.settings.transform.call(e,t):t;return this.setData({constant:!0,value:i}),!0}setData(e){var t,i;let r=this.isConstant;if(ArrayBuffer.isView(e)||e instanceof n.h||!e.constant){let i=super.setData(e);return this.state.constantValue=null,(t=this.state).layoutChanged||(t.layoutChanged=r&&"webgpu"===this.device.type),i}let s=this.settings.defaultType;this.state.constantValue=this._normalizeValue(e.value,new s(this.size),0);let o=super.setData(e);if("webgpu"===this.device.type){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=(0,p.cT)(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(i=this.state).layoutChanged||(i.layoutChanged=!r),this.constant=!1}return o&&this.setNeedsRedraw(),this.clearNeedsUpdate(),o}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e||(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:i,settings:r}=this;if(!e)return i.binaryValue=null,i.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(e instanceof S.M&&(0,v.A)(e.length>=this.numInstances,"GPUVector attribute is shorter than the draw count"),i.binaryValue===e&&!(r.transform&&this.needsUpdate()))return this.clearNeedsUpdate(),!0;if(i.binaryValue=e,this.setNeedsRedraw(),e instanceof S.M){if(!e.format)throw Error("GPUVector attributes require a format");let t=(0,T.Ft)(e.format),i=t.type;if("float16"===i)throw Error("GPUVector float16 attributes are not supported");(0,v.A)(!t.vertexList&&!t.valueList,"GPUVector attributes require fixed-width values");let r=function(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUVector "${e.name}" requires exactly one GPUData chunk`);return t}(e);(0,v.A)(r.buffer instanceof n.h,"GPUVector attributes require a concrete Buffer"),e={buffer:r.buffer,type:i,size:t.components,offset:r.byteOffset,stride:r.byteStride}}if(r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let n=e;(0,v.A)(ArrayBuffer.isView(n.value),`invalid ${r.accessor}`);let s=!!n.size&&n.size!==this.size;return i.binaryAccessor=(0,y.I)(n.value,{size:n.size||this.size,stride:n.stride,offset:n.offset,startIndices:t,nested:s}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let i in e)Object.assign(t,super.getValue(i,e[i]));return t}getGPUVector(){if(!this.isConstant&&!this.getBuffer())return{};let e=this._getShaderBufferLayout(),t=this.getValue(),i={},r=this.getConstantValue();for(let s of(this.doublePrecision&&(r instanceof Float32Array||r instanceof Float64Array)&&(r="webgpu"===this.device.type?(0,p.cT)(r,{size:this.size}):new Float32Array([...this.value,...new Float32Array(this.size)])),e.attributes||[])){let o=s.attribute,a=t[o],c=(0,T.Ft)(s.format);if(this.isConstant&&r){let e=(0,l.Y0)(c.type),t=(s.byteOffset||0)/r.BYTES_PER_ELEMENT;i[o]=new M.z({format:s.format,value:new e(r.subarray(t,t+c.components))})}else a instanceof n.h?i[o]=new S.M({type:"buffer",name:o,buffer:a,format:s.format,length:this.numInstances,byteOffset:s.byteOffset||0,byteStride:e.byteStride,ownsBuffer:!1}):a&&(i[o]=new M.z({format:s.format,value:new((0,l.Y0)(c.type))(a).subarray(0,c.components)}))}return i}getBufferLayout(e){return this.state.layoutChanged=!1,this._getShaderBufferLayout(e)}_getShaderBufferLayout(e){let t=this.settings.shaderAttributes,i=super._getBufferLayout(),{stepMode:r}=this.settings;if("dynamic"===r?i.stepMode=e?e.isInstanced?"instance":"vertex":"instance":i.stepMode=r??"vertex",!t)return i;for(let e in t){let r=super._getBufferLayout(e,t[e]);i.attributes.push(...r.attributes)}return i}_autoUpdater(e,{data:t,startRow:i,endRow:r,props:n,numInstances:s}){let{settings:o,state:a,value:l,size:c,startIndices:u}=e,{accessor:h,transform:d}=o,f=a.binaryAccessor||("function"==typeof h?h:n[h]);(0,v.A)("function"==typeof f,`accessor "${h}" is not a function`);let p=e.getVertexOffset(i),{iterable:g,objectInfo:m}=(0,y.X)(t,i,r);for(let t of g){m.index++;let i=f(t,m);if(d&&(i=d.call(this,i)),u){let t=(m.index<u.length-1?u[m.index+1]:s)-u[m.index];if(i&&Array.isArray(i[0])){let t=p;for(let r of i)e._normalizeValue(r,l,t),t+=c}else i&&i.length>c?l.set(i,p):(e._normalizeValue(i,m.target,0),(0,b.R)({target:l,source:m.target,start:p,count:t}));p+=t*c}else e._normalizeValue(i,l,p),p+=c}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||"function"==typeof e.update))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let i=!0;switch(t){case 4:i=i&&Number.isFinite(e[3]);case 3:i=i&&Number.isFinite(e[2]);case 2:i=i&&Number.isFinite(e[1]);case 1:i=i&&Number.isFinite(e[0]);break;default:i=!1}if(!i)throw Error(`Illegal attribute generated for ${this.id}`)}}}var A=i(64344),O=i(8663);function k({elementWise:e,func:t,inputs:i,output:r,outputBuffer:n}){let s=Array.isArray(i)?i:Object.values(i);for(let e of s)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,a=r.size,l=new r.ValueType(o*a);for(let i=0;i<o;i++){let r=s.map(e=>I(e,i));if(e)for(let e=0;e<a;e++)l[i*a+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,l.subarray(i*a,i*a+a),...r)}let c=r.ValueType.BYTES_PER_ELEMENT,u=r.offset/c,h=r.stride/c,d=l;if(0!==u||h!==a){d=new r.ValueType(u+r.byteLength/c);for(let e=0;e<o;e++){let t=e*a,i=u+e*h,r=l.subarray(t,t+a);d.set(r,i),n.write(r,i*c)}}else n.write(l);return{success:!0,value:d}}function I(e,t){let i=e.value,r=e.size,n=e.offset/e.ValueType.BYTES_PER_ELEMENT,s=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=n+(e.isConstant?0:t)*s,a=i.slice(o,o+r);if(!e.normalized)return a;let l=new Float32Array(r);for(let t=0;t<r;t++)l[t]=function(e,t){switch(t){case"uint8":return e/255;case"uint16":return e/65535;case"uint32":return e/0xffffffff;case"sint8":return Math.max(e/127,-1);case"sint16":return Math.max(e/32767,-1);case"sint32":return Math.max(e/0x7fffffff,-1);case"float32":return e;default:throw Error(`Unsupported normalized source type ${t}`)}}(a[t],e.type);return l}let L=({inputs:e,output:t,target:i})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let i=0;i<t.length;i++){let n=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,I(t,i)]));for(let s=0;s<t.size;s++)r[i*t.size+s]=function e(t,i,r){switch(t.kind){case"input":{let e=i[t.name];if(r<e.length)return e[r];return 1===e.length?e[0]:0}case"literal":if(Array.isArray(t.value))return t.value[r]??0;return t.value;case"call":{!function(e,t){let i=O.E[e].arity;if(t!==i)throw Error(`Arithmetic op '${e}' expects ${i} args, got ${t}`)}(t.op,t.args.length);let n=t.args.map(t=>e(t,i,r));switch(t.op){case"add":return n[0]+n[1];case"subtract":return n[0]-n[1];case"multiply":return n[0]*n[1];case"divide":return n[0]/n[1];case"pow":return Math.pow(n[0],n[1]);case"sqrt":return Math.sqrt(n[0]);case"abs":return Math.abs(n[0]);case"sin":return Math.sin(n[0]);case"cos":return Math.cos(n[0]);case"tan":return Math.tan(n[0]);case"exp":return Math.exp(n[0]);case"log":return Math.log(n[0]);default:{let e=t.op;throw Error(`Unsupported arithmetic op ${e}`)}}}default:throw Error(`Unsupported expression node ${t.kind}`)}}(e.expression,n,s)}return i.write(r),{success:!0,value:r}};var R=i(24789),B=i(76159);let j=({inputs:e,output:t,target:i})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let n=new t.ValueType(t.length*t.size);if(0===r.length)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let i=I(r,0)[e],s=e*t.size,o=s+1;n[s]=i,n[o]=i;for(let t=1;t<r.length;t++){let i=I(r,t)[e];i<n[s]&&(n[s]=i),i>n[o]&&(n[o]=i)}}return i.write(n),{success:!0,value:n}},z=({inputs:e,output:t,target:i})=>k({func:(e,t)=>{let i=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<i;t++){let n=r[t];e[t]=Math.fround(n),e[t+i]=n-e[t]}return e},inputs:e,output:t,outputBuffer:i}),D=async({inputs:e,output:t,target:i})=>{let{ids:r,sourceValues:n}=e,s=r.value,o=n.value;if(!s)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${n} does not have CPU value`);let a=new t.ValueType(t.length*t.size),l=Array(t.size).fill(0);for(let e=0;e<t.length;e++){var c,u;let i=Number(I(r,e)[0]),s=(c=i,u=n.length,Number.isInteger(c)&&c>=0&&c<u)?I(n,i):l;a.set(s,e*t.size)}return i.write(a),{success:!0,value:a}},U=({inputs:e,output:t,target:i})=>k({func:(e,...t)=>{let i=0;for(let r of t)e.set(r,i),i+=r.length},inputs:e,output:t,outputBuffer:i}),F=({inputs:e,output:t,target:i})=>{let{x:r,y:n}=e,s=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=I(r,e),i=I(n,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*i[e];s[e]=o}return i.write(s),{success:!0,value:s}},V=({inputs:e,output:t,target:i})=>{let{x:r,y:n}=e,s=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=I(r,e),i=I(n,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==i[e]){o=0;break}s[e]=o}return i.write(s),{success:!0,value:s}},N=({inputs:e,output:t,target:i})=>{let{x:r}=e,n=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=I(r,e),i=0;for(let e=0;e<r.size;e++)i+=t[e]*t[e];n[e]=Math.sqrt(i)}return i.write(n),{success:!0,value:n}},$=async({inputs:e,output:t,target:i})=>{let{segments:r,vertexCount:n}=e,s=r.value;if(!s)throw Error(`${r} does not have CPU value`);var o=s,a=r,l=n;if(a.length<1)throw Error("segmentedMap segments must contain at least one segment start");let c=0;for(let e=0;e<a.length;e++){let t=o[G(a,e)];if(0===e&&0!==t)throw Error(`segmentedMap segments must start at 0, got ${t}`);if(e>0&&t<c)throw Error(`segmentedMap segments must be non-decreasing, got ${t} after ${c}`);c=t}if(c>l)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${c} > ${l}`);let u=new t.ValueType(t.length*t.size),h=0;for(let e=0;e<n;e++){for(;h+1<r.length&&s[G(r,h+1)]<=e;)h++;let i=s[G(r,h)],n=e*t.size;u[n]=h,u[n+1]=e-i}return i.write(u),{success:!0,value:u}};function G(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}let W=async({inputs:e,output:t,target:i})=>{let{condition:r,whenTrue:n,whenFalse:s}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let i=I(r,e),a=I(n,e),l=I(s,e);for(let c=0;c<t.size;c++){let u=q(i,r.size,c);o[e*t.size+c]=0!==u?q(a,n.size,c):q(l,s.size,c)}}return i.write(o),{success:!0,value:o}};function q(e,t,i){return i<t?e[i]:1===t?e[0]:0}let H=({inputs:e,output:t,target:i})=>{let r=new t.ValueType(t.length);for(let i=0;i<t.length;i++)r[i]=e.start+i*e.step;return i.write(r),{success:!0,value:r}},Y=({inputs:e,output:t,target:i})=>{let{columns:r}=e;return k({func:(e,t)=>{for(let i=0;i<r.length;i++)e[i]=t[r[i]]},inputs:{x:e.x},output:t,outputBuffer:i})},Z=new class{_modules={cpu:r};add(e,t){let i=this._modules[e];if("function"==typeof t.then){let r=Promise.all([Promise.resolve(i||{}),t]).then(([e,t])=>({...e,...t}));return this._modules[e]=r,r.then(t=>{this._modules[e]=t}).catch(t=>{A.R.error(`Failed to register ${e} backend: ${t}`)()}),r}if(i&&"function"==typeof i.then){let r=Promise.resolve(i).then(e=>({...e,...t})).then(t=>(this._modules[e]=t,t)).catch(t=>{throw A.R.error(`Failed to register ${e} backend: ${t}`)(),t});return this._modules[e]=r,r}let r={...i||{},...t};return this._modules[e]=r,Promise.resolve(r)}async get(e,t){let r=this._modules[e];if(!r)if("webgl"===e)r=this.add("webgl",i.e("4376").then(i.bind(i,59403)));else if("webgpu"===e)r=this.add("webgpu",i.e("9923").then(i.bind(i,41422)));else throw Error(`${e} backend not registered`);let n=(await r)[t];if("function"!=typeof n&&("webgl"===e?n=(await i.e("4376").then(i.bind(i,59403)))[t]:"webgpu"===e&&(n=(await i.e("9923").then(i.bind(i,41422)))[t])),"function"!=typeof n)throw Error(`${e} backend does not implement ${t}`);return n}getSync(e,t){let i=this._modules[e];if(!i)throw Error(`${e} backend not registered`);if("function"==typeof i.then)throw Error(`${e} backend is not loaded yet`);let r=i[t];if("function"!=typeof r)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}};var X=i(46296);class K{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof X.GL)}async execute(e,t,i){i||await this._resolveDependencies(e);let r=await Z.get(this._getHandlerRegistry(e,i),this.name);if(i&&("webgpu"!==e.type||!r.supportsEvaluationScope))throw Error(`${this.name} does not support deferred-submission evaluation`);return i&&await this._resolveDependencies(e,i),await this._executeWithHandler(r,t,i)}executeSync(e,t){var i;this._resolveDependenciesSync(e);let r=this._executeWithHandler(Z.getSync(this._getHandlerRegistry(e),this.name),t);if(i=r,"function"==typeof i?.then)throw Error(`${this.name} returned a Promise in executeSync()`);return r}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e,t){return!t&&this.shouldExecuteOnCPU()?"cpu":e.type}async _resolveDependencies(e,t){for(let i of this.dependencies)await i.evaluate(e,{scope:t});if("cpu"===this._getHandlerRegistry(e,t)||"null"===e.type)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if("cpu"===this._getHandlerRegistry(e)||"null"===e.type)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t,i){return e({scope:i,device:t.device,inputs:this.inputs,output:this.output,target:t})}}class J extends K{name="interleave";output;constructor(e){super(e);let{isConstant:t,type:i,length:r}=function(...e){let t=function(e){let t=0,i=0;for(let r of e){if("f"===r[0])return"float32";let e=r.endsWith("8")?8:r.endsWith("6")?16:32;"u"===r[0]?t=Math.max(t,e):i=Math.max(i,e)}return t&&!i?`uint${t}`:i&&t<32?`sint${Math.max(i,2*t)}`:"float32"}(e.map(e=>e.type));return"f"!==t[0]&&e.some(e=>e.normalized)&&(t="float32"),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}(...e);this.output=new X.GL({isConstant:t,type:i,size:e.reduce((e,t)=>e+t.size,0),length:r,source:this})}toString(){return`_${this.inputs.join("_")}_`}}var Q=i(7036),ee=i(89362);class et{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;_evaluationScope;static fromGPUVector(e){if(e.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${e.name}"`);if(0===e.data.length)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${e.name}"`);return new et({id:e.name,gpuDataEvaluators:e.data.map(t=>X.GL.fromGPUData(t,{id:e.name})),gpuVector:e,format:e.format})}static fromGPUDataEvaluators(e,t={}){return new et({id:t.id,gpuDataEvaluators:e,format:t.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:i,format:r}){if(0===t.length)throw Error("GPUVectorEvaluator requires at least one GPUData evaluator");(function(e){let t=e[0];for(let i of e.slice(1))if(i.type!==t.type||i.size!==t.size||i.normalized!==t.normalized||i.format!==t.format)throw Error("GPUVectorEvaluator requires matching GPUData evaluator layouts")})(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=i,this._ownsGPUDataEvaluators=!i}get evaluated(){return!!this._gpuVector}getInspection(){return(0,ee.r)(this.gpuDataEvaluators)}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(e){return et.fromGPUDataEvaluators(this.gpuDataEvaluators.map((t,i)=>e(t,i)),{id:this.id})}async evaluate(e,t={}){let i;if(this.assertScopeAccess(t.scope),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);let r=t.scope;if(r){if(r.assertEvaluating(e),!this._evaluationScope){let e=this._gpuVector;this._evaluationScope=r,r.retain(t=>{this._evaluationScope=void 0,t||(this._gpuVector=e)})}for(let r of(i=[],this.gpuDataEvaluators))i.push(await r.evaluate(e,t));if(this._gpuVector)return this._gpuVector}else{if(this._gpuVector)return this._gpuVector;i=await Promise.all(this.gpuDataEvaluators.map(i=>i.evaluate(e,t)))}let n=i[0],s=i.map(ei),o=t.format??this.format??n.format;return this._gpuVector=new S.M({type:"data",name:t.name??this.id??"vector",format:o,data:s,stride:n.stride,byteStride:n.byteStride,rowByteLength:n.rowByteLength,bufferLayout:n.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(t.scope)throw Error("Use scope.evaluate() for deferred submission");if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let i=this.gpuDataEvaluators.map(i=>i.evaluateSync(e,t)),r=i[0],n=i.map(ei),s=t.format??this.format??r.format;return this._gpuVector=new S.M({type:"data",name:t.name??this.id??"vector",format:s,data:n,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error("Cannot invalidate a destroyed evaluator");this._gpuVector=void 0}destroy(){if(this.assertScopeAccess(),this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error("Evaluator is retained by an unsubmitted scope")}toString(){return this.id??this.constructor.name}}function ei(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}function er(e){return e instanceof X.GL?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof Q.kL?e.buffer.buffer:e.buffer)}var en=i(60138);class es{constructor(e,{id:t,isTransitionAttribute:i}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=i,"webgpu"===this.device.type&&Z.add("webgpu",{interleave:en.C})}hasGroups(e){return"webgpu"===this.device.type&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let i=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,i,t)}getBindings(e,t,i,r){let n=this._getPackedGroups(e,i,{requireValues:!0,excludeAttributes:r}),s={},o=new Set;for(let e of n.values()){let i=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);for(let t of(s[e.id]=this._getPackedBuffer(e,i),e.attributes))o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,n,i).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:s,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:i,excludeAttributes:r}){let n=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let i=n.get(e)||[];i.push(t),n.set(e,i)}let s=new Map;for(let[e,o]of n){let n=this._getPackedGroup(e,o,t,i,r);n&&s.set(e,n)}return s}_getPackedGroup(e,t,i,r,n){if(t.length<2)return null;let s=t.map(e=>e.getBufferLayout(i)),o=s[0].stepMode,a=Math.max(1,t[0].numInstances),l=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let i=t[e],l=i.getAccessor(),c=l.size*l.bytesPerElement;if(n[i.id]||i.settings.isIndexed||i.settings.noAlloc||i.doublePrecision||this.isTransitionAttribute(i.id)||s[e].stepMode!==o||i.numInstances!==t[0].numInstances||0!==(l.offset||0)||0!==(l.vertexOffset||0)||d(l)!==c||r&&(i.isConstant?!i.getConstantValue()||i.getConstantValue().byteLength<c:!ArrayBuffer.isView(i.value)||i.value.byteLength<a*c))return null}let c={},u=[],h=0;for(let e=0;e<t.length;e++){let i=t[e];for(let t of(h=eo(h),c[i.id]=h,s[e].attributes||[]))u.push({...t,byteOffset:h+(t.byteOffset||0)});h+=d(i.getAccessor())}return{id:e,attributes:t,byteStride:h=eo(h),byteOffsets:c,rowCount:a,layout:{name:e,byteStride:l?0:h,stepMode:o,attributes:u}}}_getBufferLayouts(e,t,i){let r=[],n=new Set,s=new Set;for(let e of t.values())for(let t of e.attributes)s.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,a=e&&t.get(e);a&&s.has(o.id)?n.has(a.id)||(r.push(a.layout),n.add(a.id)):r.push(o.getBufferLayout(i))}return r}_getPackedBuffer(e,t){let i=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if(r&&r.layoutKey===i||(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:i},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=function(...e){if(0===e.length)throw Error("interleave() requires at least one input");return 1===e.length?(0,X.uy)(e[0]):new J(e.map(X.uy)).output}(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return!function(e,t){let i,r=(function e(t,i,r){var n;if((n=t)instanceof X.GL||n instanceof et)return void i.add(t);if(!(!t||"object"!=typeof t||r.has(t))){let n;if(r.add(t),Array.isArray(t)){for(let n of t)e(n,i,r);return}if((n=Object.getPrototypeOf(t))===Object.prototype||null===n)for(let n of Object.values(t))e(n,i,r)}}(t,i=new Set,new Set),Array.from(i));for(let t of r)t.evaluateSync(e);var n=r;let s=new Set(n.flatMap(er)),o=new Set;for(let e of n)!function e(t,i){if(t instanceof et){for(let r of t.gpuDataEvaluators)e(r,i);return}let r=t.source;if(r){if(r instanceof X.GL){i.has(r)||(i.add(r),e(r,i));return}for(let t of r.dependencies)i.has(t)||(i.add(t),e(t,i))}}(e,o);for(let e of o)e.evaluated&&!s.has(e.buffer)&&e.destroy()}(this.device,t),t}_getInterleaveInput(e,t){let i=d(t.getAccessor()),r=e.byteOffsets[t.id];if(ea(`${e.id}.${t.id} rowByteLength`,i),ea(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return ea(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new X.GL({id:t.id,type:"uint32",size:i/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,i/Uint32Array.BYTES_PER_ELEMENT)})}let n=t.getBuffer(),s=t.byteOffset,o=t.getAccessor().stride||i;if(ea(`${e.id}.${t.id} byteOffset`,s),ea(`${e.id}.${t.id} stride`,o),!n)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new X.GL({id:t.id,type:"uint32",size:i/4,offset:s,stride:o,length:e.rowCount,buffer:n})}}function eo(e){return 4*Math.ceil(e/4)}function ea(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}var el=i(82417),ec=i(43411),eu=i(58006),eh=i(63702),ed=i(86181),ef=i(11499);class ep{device;model;transformFeedback;outputVectorBindings={};outputBuffers={};static defaultProps={...ed.X.defaultProps,inputVectors:void 0,outputVectors:void 0,feedbackBufferMode:"separate",outputs:void 0,feedbackBuffers:void 0};static isSupported(e){return e?.info?.type==="webgl"}constructor(e,t=ep.defaultProps){if(!ep.isSupported(e))throw Error("BufferTransform not yet implemented on WebGPU");this.device=e,this.outputBuffers=t.feedbackBuffers||{};let{inputVectors:i,outputVectors:r,...n}=t;this.model=new ed.X(this.device,{id:t.id||"buffer-transform-model",fs:t.fs||(0,eh.Wk)(),topology:t.topology||"point-list",varyings:t.outputs||t.varyings,...n,bufferMode:t.bufferMode||("interleaved"===t.feedbackBufferMode?35980:35981)}),this.transformFeedback=this.device.createTransformFeedback({layout:this.model.pipeline.shaderLayout,buffers:t.feedbackBuffers}),this.model.setTransformFeedback(this.transformFeedback),i&&this.model.setGPUVectors(i,{count:"vertex"}),r&&this.setOutputVectors(r)}destroy(){this.model&&this.model.destroy()}delete(){this.destroy()}run(e){let{inputVectors:t,outputVectors:i,inputBuffers:r,outputBuffers:n,...s}=e??{};r&&this.model.setAttributes(r),t&&this.model.setGPUVectors(t,{count:"vertex"}),n&&(this.outputBuffers=n),(n||i||Object.keys(this.outputVectorBindings).length>0)&&this.setOutputVectors(i??this.outputVectorBindings);let o=this.device.beginRenderPass({discard:!0,...s});try{this.model.draw(o)}finally{o.end()}}setOutputVectors(e){let t=(0,ef.t)(this.model.id,e);(0,eu.v)(0===t.length||35980!==this.model.pipeline.props.bufferMode),(0,eu.v)(t.length<=1),this.outputVectorBindings=e,this.transformFeedback.setBuffers({...this.outputBuffers,...Object.fromEntries(Object.entries(t[0]?.data??{}).map(([e,t])=>((0,eu.v)(t.byteStride===t.rowByteLength),[e,{buffer:t.buffer instanceof Q.kL?t.buffer.buffer:t.buffer,byteOffset:t.byteOffset,byteLength:t.length*t.byteStride}])))})}getBuffer(e){return this.transformFeedback.getBuffer(e)}readAsync(e){let t=this.getBuffer(e);if(!t)throw Error("BufferTransform#getBuffer");if(t instanceof n.h)return t.readAsync();let{buffer:i,byteOffset:r=0,byteLength:s=i.byteLength}=t;return i.readAsync(r,s)}}function eg(e,t=[],i=0){let r=Math.fround(e),n=e-r;return t[i]=r,t[i+1]=n,t}let em=`\

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
`,e_=`\
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

`,ev=`\
${e_}

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
`,ey=`\
${e_}

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
`,eb={name:"fp64arithmetic",source:`\
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
${ev}
#else
#ifdef LUMA_FP64_HYBRID_ARITHMETIC
${ey}
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
`,fs:em,vs:em,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:"f32",SPLIT:"f32"},fp64ify:eg,fp64LowPart:function(e){return e-Math.fround(e)},fp64ifyMatrix4:function(e){let t=new Float32Array(32);for(let i=0;i<4;++i)for(let r=0;r<4;++r){let n=4*i+r;eg(e[4*r+i],t,2*n)}return t}};function ew(e){let{source:t,target:i,start:r=0,size:n,getData:s}=e,o=e.end||i.length,a=t.length,l=o-r;if(a>l)return void i.set(t.subarray(0,l),r);if(i.set(t,r),!s)return;let c=a;for(;c<l;){let e=s(c,t);for(let t=0;t<n;t++)i[r+c]=e[t]||0,c++}}function eE(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`No defined attribute type for size "${e}"`)}}function eP(e){switch(e){case 1:return"float32";case 2:return"float32x2";case 3:return"float32x3";case 4:return"float32x4";default:throw Error("invalid type size")}}function ex(e){e.push(e.shift())}function eS({device:e,source:t,target:i}){return(!i||i.byteLength<t.byteLength)&&(i?.destroy(),i=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),i}function eT({device:e,buffer:t,attribute:i,fromLength:r,toLength:n,fromStartIndices:s,getData:o=e=>e}){let a=i.isDoublePrecisionBuffer?2:1,l=i.size*a,c=i.byteOffset,u=i.settings.bytesPerElement<4?c/i.settings.bytesPerElement*4:c,h=i.startIndices,d=s&&h,f=i.isConstant;if(!d&&t&&r>=n)return t;let p=i.value instanceof Float64Array?Float32Array:i.value.constructor,g=f?i.value:new p(i.getBuffer().readSyncWebGL(c,n*p.BYTES_PER_ELEMENT).buffer);if(i.settings.normalized&&!f){let e=o;o=(t,r)=>i.normalizeConstant(e(t,r))}let m=f?(e,t)=>o(g,t):(e,t)=>o(g.subarray(e,e+l),t),_=new Float32Array(t?t.readSyncWebGL(u,4*r).buffer:0),v=new Float32Array(n);return!function({source:e,target:t,size:i,getData:r,sourceStartIndices:n,targetStartIndices:s}){if(!n||!s)return ew({source:e,target:t,size:i,getData:r});let o=0,a=0,l=r&&((e,t)=>r(e+a,t)),c=Math.min(n.length,s.length);for(let r=1;r<c;r++){let c=n[r]*i,u=s[r]*i;ew({source:e.subarray(o,c),target:t,start:a,end:u,size:i,getData:l}),o=c,a=u}a<t.length&&ew({source:[],target:t,start:a,size:i,getData:l})}({source:_,target:v,sourceStartIndices:s,targetStartIndices:h,size:l,getData:m}),(!t||t.byteLength<v.byteLength+u)&&(t?.destroy(),t=e.createBuffer({byteLength:v.byteLength+u,usage:35050})),t.write(v,u),t}var eM=i(2357);class eC{constructor({device:e,attribute:t,timeline:i}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new eM.A(i),this.attribute=t,this.attributeInTransition=function(e){let{device:t,settings:i,value:r}=e,n=new C(t,i);return n.setData({value:r instanceof Float64Array?new Float64Array(0):new Float32Array(0),normalized:i.normalized}),n}(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,i=1/0){this.settings=e,this.attributeInTransition.numInstances=this.attribute.numInstances,this.currentStartIndices=this.attribute.startIndices,this.currentLength=function(e,t){let{settings:i,value:r,size:n}=e,s=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:a}=e.settings;if(a)for(let e of Object.values(a))o=Math.max(o,e.vertexOffset??0);return(i.noAlloc?r.length:(t+o)*n)*s}(this.attribute,t),this.transition.start({...e,duration:i})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){for(let e of(this.cancel(),this.buffers))e.destroy();this.buffers.length=0}}let eA={name:"interpolation",vs:`\
layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:"f32"}},eO=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,ek=`\
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
`;function eI(e){return e.isDoublePrecisionBuffer}let eL={name:"spring",vs:`\
layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:"f32",stiffness:"f32"}},eR=`\
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
`,eB=`\
#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`,ej={interpolation:class extends eC{constructor({device:e,attribute:t,timeline:i}){var r,n;let s,o,a,l;super({device:e,attribute:t,timeline:i}),this.type="interpolation",this.hasUpdated=!1,this.transform=(r=e,o=eE(s=(n=t).size),a=eP(s),l=n.getBufferLayout(),eI(n)?new ep(r,{vs:ek,bufferLayout:[{name:"aFrom",byteStride:8*s,attributes:[{attribute:"aFrom",format:a,byteOffset:0},{attribute:"aFrom64Low",format:a,byteOffset:4*s}]},{name:"aTo",byteStride:8*s,attributes:[{attribute:"aTo",format:a,byteOffset:0},{attribute:"aTo64Low",format:a,byteOffset:4*s}]}],modules:[eb,eA],defines:{ATTRIBUTE_TYPE:o,ATTRIBUTE_SIZE:s},moduleSettings:{},varyings:["vCurrent","vCurrent64Low"],bufferMode:35980,disableWarnings:!0}):new ep(r,{vs:eO,bufferLayout:[{name:"aFrom",format:a},{name:"aTo",format:l.attributes[0].format}],modules:[eA],defines:{ATTRIBUTE_TYPE:o},varyings:["vCurrent"],disableWarnings:!0}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0)return void this.transition.cancel();let{buffers:n,attribute:s}=this;this.hasUpdated&&ex(n),this.hasUpdated=!1,n[0]=eT({device:this.device,buffer:n[0],attribute:s,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),n[1]=eS({device:this.device,source:n[0],target:n[1]}),this.setBuffer(n[1]);let{transform:o}=this,a=o.model,l=Math.floor(this.currentLength/s.size);eI(s)&&(l/=2),a.setVertexCount(l),s.isConstant?(a.setAttributes({aFrom:n[0]}),a.setConstantAttributes({aTo:s.value})):a.setAttributes({aFrom:n[0],aTo:s.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:n[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:i}=this.transition,r=i/e;t&&(r=t(r));let{model:n}=this.transform,s={time:r};n.shaderInputs.setProps({interpolation:s}),this.transform.run({discard:!0}),this.hasUpdated=!0}delete(){super.delete(),this.transform.destroy()}},spring:class extends eC{constructor({device:e,attribute:t,timeline:i}){var r,n,s,o;let a,l;super({device:e,attribute:t,timeline:i}),this.type="spring",this.texture=e.createTexture({data:new Uint8Array(4),format:"rgba8unorm",width:1,height:1}),this.framebuffer=(r=e,n=this.texture,r.createFramebuffer({id:"spring-transition-is-transitioning-framebuffer",width:1,height:1,colorAttachments:[n]})),this.transform=(s=e,a=eE((o=t).size),new ep(s,{vs:eR,fs:eB,bufferLayout:[{name:"aPrev",format:l=eP(o.size)},{name:"aCur",format:l},{name:"aTo",format:o.getBufferLayout().attributes[0].format}],varyings:["vNext"],modules:[eL],defines:{ATTRIBUTE_TYPE:a},parameters:{depthCompare:"always",blendColorOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:n,attribute:s}=this;for(let t=0;t<2;t++)n[t]=eT({device:this.device,buffer:n[t],attribute:s,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});n[2]=eS({device:this.device,source:n[0],target:n[2]}),this.setBuffer(n[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/s.size)),s.isConstant?o.setConstantAttributes({aTo:s.value}):o.setAttributes({aTo:s.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:i,transition:r}=this,n=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let s={stiffness:n.stiffness,damping:n.damping};t.model.shaderInputs.setProps({spring:s}),t.run({framebuffer:i,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),ex(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(i)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}}};class ez{constructor(e,{id:t,timeline:i}){if(!e)throw Error("AttributeTransitionManager is constructed without device");this.id=t,this.device=e,this.timeline=i,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:i}){for(let r in this.numInstances=i||1,e){let i=e[r],n=i.getTransitionSetting(t);n&&this._updateAttribute(r,i,n)}for(let i in this.transitions){let r=e[i];r&&r.getTransitionSetting(t)||(this._removeTransition(i),r&&(r.setNeedsRedraw(),r.setLayoutChanged()))}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let i=this.transitions[t];i.inProgress&&(e[t]=i.attributeInTransition)}return e}run(){if(0===this.numInstances)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,i){let r=this.transitions[e],n=!r||r.type!==i.type;if(n){r&&this._removeTransition(e);let s=ej[i.type];s?this.transitions[e]=new s({attribute:t,timeline:this.timeline,device:this.device}):(g.A.error(`unsupported transition type '${i.type}'`)(),n=!1)}(n||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(i,this.numInstances))}}let eD="attributeManager.invalidate";class eU{constructor(e,{id:t="attribute-manager",stats:i,timeline:r}={}){this.mergeBoundsMemoized=(0,el.A)(p._Z),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=i,this.attributeTransitionManager=new ez(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups="webgpu"===e.type?new es(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){for(let e in this.attributeBufferGroups?.finalize(),this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:"instance"})}remove(e){for(let t of e)void 0!==this.attributes[t]&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let i=this._invalidateTrigger(e,t);(0,ec.A)(eD,this,e,i)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);(0,ec.A)(eD,this,"all")}update({data:e,numInstances:t,startIndices:i=null,transitions:r,props:n={},buffers:s={},context:o={}}){let a=!1;for(let r in(0,ec.A)("attributeManager.updateStart",this),this.stats&&this.stats.get("Update Attributes").timeStart(),this.attributes){let l=this.attributes[r],c=l.settings.accessor;l.startIndices=i,l.numInstances=t,n[r]&&g.A.removed(`props.${r}`,`data.attributes.${r}`)(),l.setExternalBuffer(s[r])||l.setBinaryValue("string"==typeof c?s[c]:void 0,e.startIndices)||"string"==typeof c&&!s[c]&&l.setConstantValue(o,n[c])||l.needsUpdate()&&(a=!0,this._updateAttribute({attribute:l,numInstances:t,data:e,props:n,context:o})),this.needsRedraw=this.needsRedraw||l.needsRedraw()}a&&(0,ec.A)("attributeManager.updateEnd",this,t),this.stats&&(this.stats.get("Update Attributes").timeEnd(),a&&this.stats.get("Attributes updated").incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getGPUVectors(e=this.getAttributes(),t){let i={};for(let t of Object.values(e))Object.assign(i,t.getGPUVector());if(t)for(let e of t.bufferLayouts){let r=t.buffers[e.name];r&&(i[e.name]=new S.M({type:"interleaved",name:e.name,buffer:r,length:t.length,byteStride:e.byteStride,attributes:e.attributes,ownsBuffer:!1}))}return i}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:i}=this,r={...i.getAttributes()};for(let n in t){let s=t[n];s.needsRedraw(e)&&!i.hasAttribute(n)&&(r[n]=s)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,i={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,i):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let i in e){let r=e[i],n={...r,id:i,size:r.isIndexed&&1||r.size||1,...t};this.attributes[i]=new C(this.device,n)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(i=>{e[i]||(e[i]=[]),e[i].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:i,updateTriggers:r}=this,n=r[e];return n&&n.forEach(e=>{let r=i[e];r&&r.setNeedsUpdate(r.id,t)}),n}_updateAttribute(e){let{attribute:t,numInstances:i}=e;((0,ec.A)("attribute.updateStart",t),t.constant)?t.setConstantValue(e.context,t.value):(t.allocate(i)&&(0,ec.A)("attribute.allocate",t,i),t.updateBuffer(e)&&(this.needsRedraw=!0,(0,ec.A)("attribute.updateEnd",t,i)))}}var eF=i(88599),eV=i(49105);class eN extends eM.A{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:i,duration:r,easing:n}}=this,s=n(e/r);this._value=(0,eV.Cc)(t,i,s)}}function e$(e,t,i,r,n){let s=t-e;return(i-t)*n+-s*r+s+t}function eG(e,t){if(Array.isArray(e)){let i=0;for(let r=0;r<e.length;r++){let n=e[r]-t[r];i+=n*n}return Math.sqrt(i)}return Math.abs(e-t)}class eW extends eM.A{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:i,stiffness:r}=this.settings,{_prevValue:n=e,_currValue:s=e}=this,o=function(e,t,i,r,n){if(Array.isArray(i)){let s=[];for(let o=0;o<i.length;o++)s[o]=e$(e[o],t[o],i[o],r,n);return s}return e$(e,t,i,r,n)}(n,s,t,i,r),a=eG(o,t),l=eG(o,s);a<1e-5&&l<1e-5&&(o=t,this.end()),this._prevValue=s,this._currValue=o}}let eq={interpolation:eN,spring:eW};class eH{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,i,r){let{transitions:n}=this;if(n.has(e)){let i=n.get(e),{value:r=i.settings.fromValue}=i;t=r,this.remove(e)}if(!(r=x(r)))return;let s=eq[r.type];if(!s)return void g.A.error(`unsupported transition type '${r.type}'`)();let o=new s(this.timeline);o.start({...r,fromValue:t,toValue:i}),n.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,i]of this.transitions)i.update(),e[t]=i.value,i.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}}var eY=i(12897);function eZ({newProps:e,oldProps:t,ignoreProps:i={},propTypes:r={},triggerName:n="props"}){if(t===e)return!1;if("object"!=typeof e||null===e||"object"!=typeof t||null===t)return`${n} changed shallowly`;for(let s of Object.keys(e))if(!(s in i)){if(!(s in t))return`${n}.${s} added`;let i=eX(e[s],t[s],r[s]);if(i)return`${n}.${s} ${i}`}for(let s of Object.keys(t))if(!(s in i)){if(!(s in e))return`${n}.${s} dropped`;if(!Object.hasOwnProperty.call(e,s)){let i=eX(e[s],t[s],r[s]);if(i)return`${n}.${s} ${i}`}}return!1}function eX(e,t,i){let r=i&&i.equal;return r&&!r(e,t,i)||!r&&(r=e&&t&&e.equals)&&!r.call(e,t)?"changed deeply":r||t===e?null:"changed shallowly"}function eK(e,t,i){let r=e.updateTriggers[i];r=null==r?{}:r;let n=t.updateTriggers[i];return eZ({oldProps:n=null==n?{}:n,newProps:r,triggerName:i})}var eJ=i(7914);function eQ(e,t){if(!t)return e;let i={...e,...t};if("defines"in t&&(i.defines={...e.defines,...t.defines}),"modules"in t&&(i.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>"project64"===e.name))){let e=i.modules.findIndex(e=>"project32"===e.name);e>=0&&i.modules.splice(e,1)}if("plugins"in t&&(i.plugins=[...new Set([...e.plugins||[],...t.plugins||[]])]),"inject"in t)if(e.inject){let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||"")+t.inject[e];i.inject=r}else i.inject=t.inject;return i}var e0=i(69502),e2=i(60275),e1=i(74334),e3=i(89043),e4=i(83122),e6=i(41401);function e5(e,t,i=!1){let r=t.projectPosition(e);if(i&&t instanceof e0.A){let[i,n,s=0]=e,o=t.getDistanceScales([i,n]);r[2]=s*o.unitsPerMeter[2]}return r}var e8=i(19754),e7=i(55861);let e9={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},te={},tt={boolean:{validate:(e,t)=>!0,equal:(e,t,i)=>!!e==!!t},number:{validate:(e,t)=>Number.isFinite(e)&&(!("max"in t)||e<=t.max)&&(!("min"in t)||e>=t.min)},color:{validate:(e,t)=>t.optional&&!e||tr(e)&&(3===e.length||4===e.length),equal:(e,t,i)=>(0,eJ.b)(e,t,1)},accessor:{validate(e,t){let i=tn(e);return"function"===i||i===tn(t.value)},equal:(e,t,i)=>"function"==typeof t||(0,eJ.b)(e,t,1)},array:{validate:(e,t)=>t.optional&&!e||tr(e),equal(e,t,i){let{compare:r}=i,n=Number.isInteger(r)?r:+!!r;return r?(0,eJ.b)(e,t,n):e===t}},object:{equal(e,t,i){if(i.ignore)return!0;let{compare:r}=i,n=Number.isInteger(r)?r:+!!r;return r?(0,eJ.b)(e,t,n):e===t}},function:{validate:(e,t)=>t.optional&&!e||"function"==typeof e,equal:(e,t,i)=>!i.compare&&!1!==i.ignore||e===t},data:{transform:(e,t,i)=>{if(!e)return e;let{dataTransform:r}=i.props;return r?r(e):"string"==typeof e.shape&&e.shape.endsWith("-table")&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,i)=>{let r=i.context;return r&&r.device?function(e,t,i,r){if(i instanceof e7.g)return i;i.constructor&&"Object"!==i.constructor.name&&(i={data:i});let n=null;i.compressed&&(n={minFilter:"linear",mipmapFilter:i.data.length>1?"nearest":"linear"});let{width:s,height:o}=i.data,a=t.createTexture({...i,sampler:{...e9,...n,...r},mipLevels:t.getMipLevelCount(s,o)});return"webgl"===t.type?a.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(a),te[a.id]=e,a}(i.id,r.device,e,{...t.parameters,...i.props.textureParameters}):null},release:(e,t,i)=>{var r;r=i.id,e&&e instanceof e7.g&&te[e.id]===r&&(e.delete(),delete te[e.id])}}};function ti(e,t){return"type"in t?{name:e,...tt[t.type],...t}:"value"in t?{name:e,type:tn(t.value),...t}:{name:e,type:"object",value:t}}function tr(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function tn(e){return tr(e)?"array":null===e?"null":typeof e}function ts(e,t){return Object.prototype.hasOwnProperty.call(e,t)}let to=0;class ta{constructor(...e){this.props=function(e,t){let i;for(let e=t.length-1;e>=0;e--){let r=t[e];"extensions"in r&&(i=r.extensions)}let r=Object.create(function e(t,i){var r,n;if(!(t instanceof tl.constructor))return{};let s="_mergedDefaultProps";if(i)for(let e of i){let t=e.constructor;t&&(s+=`:${t.extensionName||t.name}`)}let o=ts(r=t,n=s)&&r[n];return o||(t[s]=function(t,i){var r;let n;if(!t.prototype)return null;let s=e(Object.getPrototypeOf(t)),o=function(e){let t={},i={},r={};for(let[n,s]of Object.entries(e)){let e=s?.deprecatedFor;if(e)r[n]=Array.isArray(e)?e:[e];else{let e=function(e,t){switch(tn(t)){case"object":return ti(e,t);case"array":return ti(e,{type:"array",value:t,compare:!1});case"boolean":return ti(e,{type:"boolean",value:t});case"number":return ti(e,{type:"number",value:t});case"function":return ti(e,{type:"function",value:t,compare:!0});default:return{name:e,type:"unknown",value:t}}}(n,s);t[n]=e,i[n]=e.value}}return{propTypes:t,defaultProps:i,deprecatedProps:r}}(function(e,t){return ts(e,t)&&e[t]}(t,"defaultProps")||{}),a=Object.assign(Object.create(null),s,o.defaultProps),l=Object.assign(Object.create(null),s?.[eY.fW],o.propTypes),c=Object.assign(Object.create(null),s?.[eY.uH],o.deprecatedProps);for(let t of i){let i=e(t.constructor);i&&(Object.assign(a,i),Object.assign(l,i[eY.fW]),Object.assign(c,i[eY.uH]))}return Object.defineProperties(a,{id:{writable:!0,value:((n=(r=t).componentName)||g.A.warn(`${r.name}.componentName not specified`)(),n||r.name)}}),function(e,t){let i={},r={};for(let e in t){let n=t[e],{name:s,value:o}=n;n.async&&(i[s]=o,r[s]=function(e){return{enumerable:!0,set(t){"string"==typeof t||t instanceof Promise||(0,y.Td)(t)?this[eY.YN][e]=t:this[eY.vf][e]=t},get(){if(this[eY.vf]){if(e in this[eY.vf])return this[eY.vf][e]||this[eY.jA][e];if(e in this[eY.YN]){let t=this[eY.r3]&&this[eY.r3].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[eY.jA][e]}}return this[eY.jA][e]}}}(s))}e[eY.jA]=i,e[eY.YN]={},Object.defineProperties(e,r)}(a,l),function(e,t){for(let i in t)Object.defineProperty(e,i,{enumerable:!1,set(e){let r=`${this.id}: ${i}`;for(let r of t[i])ts(this,r)||(this[r]=e);g.A.deprecated(r,t[i].join("/"))()}})}(a,c),a[eY.fW]=l,a[eY.uH]=c,0!==i.length||ts(t,"_propTypes")||(t._propTypes=l),a}(t,i||[]))}(e.constructor,i));r[eY.r3]=e,r[eY.YN]={},r[eY.vf]={};for(let e=0;e<t.length;++e){let i=t[e];for(let e in i)r[e]=i[e]}return Object.freeze(r),r}(this,e),this.id=this.props.id,this.count=to++}clone(e){let{props:t}=this,i={};for(let e in t[eY.jA])e in t[eY.vf]?i[e]=t[eY.vf][e]:e in t[eY.YN]&&(i[e]=t[eY.YN][e]);return new this.constructor({...t,...i,...e})}}ta.componentName="Component",ta.defaultProps={};let tl=ta;var tc=i(73499),tu=i(97625);let th=Object.freeze({});class td{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||th}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[eY.r3]||this.component;let t=e[eY.vf]||{},i=e[eY.YN]||e,r=e[eY.jA]||{};for(let e in t){let i=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,i),t[e]=this.getAsyncProp(e)}for(let e in i){let t=i[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if("string"==typeof t&&(t=this._fetch(e,t)),t instanceof Promise)return void this._watchPromise(e,t);if((0,y.Td)(t))return void this._resolveAsyncIterable(e,t);this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps)for(let e in this.oldAsyncProps=Object.create(this.oldProps),this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}_didAsyncInputValueChange(e,t){let i=this.asyncProps[e];return t!==i.resolvedValue&&t!==i.lastValue&&(i.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let i=this.asyncProps[e];i&&(t=this._postProcessValue(i,t),i.resolvedValue=t,i.pendingLoadCount++,i.resolvedLoadCount=i.pendingLoadCount)}_setAsyncPropValue(e,t,i){let r=this.asyncProps[e];r&&i>=r.resolvedLoadCount&&void 0!==t&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=i,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let i=this.asyncProps[e];if(i){i.pendingLoadCount++;let r=i.pendingLoadCount;t.then(t=>{!this.component||r<i.resolvedLoadCount||(t=this._postProcessValue(i,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if("data"!==e)return void this._setPropValue(e,t);let i=this.asyncProps[e];if(!i)return;i.pendingLoadCount++;let r=i.pendingLoadCount,n=[],s=0;for await(let i of t){if(!this.component)return;let{dataTransform:t}=this.component.props;Object.defineProperty(n=t?t(i,n):n.concat(i),"__diff",{enumerable:!1,value:[{startRow:s,endRow:n.length}]}),s=n.length,this._setAsyncPropValue(e,n,r)}this._onResolve(e,n)}_postProcessValue(e,t){let i=e.type;return i&&this.component&&(i.release&&i.release(e.resolvedValue,i,this.component),i.transform)?i.transform(t,i,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let i=this.component&&this.component.props[eY.fW];this.asyncProps[e]={type:i&&i[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}}class tf extends td{constructor({attributeManager:e,layer:t}){super(t),this.sourceCrs=null,this.packedCrs=null,this.preproject=null,this.unpreproject=null,this.preprojectionSignature=null,this.preprojectionChanged=!1,this.tessellationSignature=null,this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let i=this.layer,r=i?.props.fetch;return r?r(t,{propName:e,layer:i}):super._fetch(e,t)}_onResolve(e,t){let i=this.layer;if(i){let r=i.props.onDataLoad;"data"===e&&r&&r(t,{propName:e,layer:i})}}_onError(e,t){let i=this.layer;i&&i.raiseError(t,`loading ${e} of ${this.layer}`)}}var tp=i(327);let tg=Object.freeze([]),tm=(0,el.A)(({oldViewport:e,viewport:t})=>e.equals(t)),t_=new Uint8ClampedArray(0);function tv(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function ty(e){return e.rowIndexes}function tb(e){return e.pickingColors||e.instancePickingColors}let tw={data:{type:"data",value:tg,async:!0},dataComparator:{type:"function",value:null,optional:!0},_dataDiff:{type:"function",value:e=>e&&e.__diff,optional:!0},dataTransform:{type:"function",value:null,optional:!0},onDataLoad:{type:"function",value:null,optional:!0},onError:{type:"function",value:null,optional:!0},fetch:{type:"function",value:(e,{propName:t,layer:i,loaders:r,loadOptions:n,signal:s})=>{let{resourceManager:o}=i.context;n=n||i.getLoadOptions(),r=r||i.props.loaders,s&&(n={...n,core:{...n?.core,fetch:{...n?.core?.fetch,signal:s}}});let a=o.contains(e);return(a||n||(o.add({resourceId:e,data:(0,tp.H)(e,r),persistent:!1}),a=!0),a)?o.subscribe({resourceId:e,onChange:e=>i.internalState?.reloadAsyncProp(t,e),consumerId:i.id,requestId:t}):(0,tp.H)(e,r,n)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:"number",min:0,max:1,value:1},operation:"draw",onHover:{type:"function",value:null,optional:!0},onClick:{type:"function",value:null,optional:!0},onDragStart:{type:"function",value:null,optional:!0},onDrag:{type:"function",value:null,optional:!0},onDragEnd:{type:"function",value:null,optional:!0},coordinateSystem:{type:"object",value:"default",validate:e=>"string"==typeof e||!!e&&"object"==typeof e,equal:tc.vk},coordinateOrigin:{type:"array",value:[0,0,0],compare:!0},modelMatrix:{type:"array",value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:"XYZ",colorFormat:"RGBA",parameters:{type:"object",value:{},optional:!0,compare:2},loadOptions:{type:"object",value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:"array",value:[],optional:!0,ignore:!0},getPolygonOffset:{type:"function",value:({layerIndex:e})=>[0,-(100*e)]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:"accessor",value:[0,0,128,128]}};class tE extends tl{constructor(){super(...arguments),this.internalState=null,this.lifecycle=eY.VD.NO_STATE,this._coordinateSystemLoading=!1,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,"layerName")?this.layerName:""}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){let e=this.constructor.layerName||this.constructor.name;return`${e}({id: '${this.props.id}'})`}project(e){(0,v.A)(this.internalState);let t=this.internalState.viewport||this.context.viewport,i=this.projectPosition(e,{autoOffset:!1}),[r,n,s]=(0,e6.VJ)(i,t.pixelProjectionMatrix);return 2===e.length?[r,n]:[r,n,s]}unproject(e){return(0,v.A)(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t={}){(0,v.A)(this.internalState);let{viewport:i=this.internalState.viewport||this.context.viewport,sourceCrs:r=this.internalState.sourceCrs,coordinateSystem:n=t.sourceCrs?.signature??this.props.coordinateSystem,modelMatrix:s=this.props.modelMatrix,coordinateOrigin:o=this.props.coordinateOrigin,autoOffset:a}=t;return function(e,t){let{viewport:i,sourceCrs:r,coordinateSystem:n,coordinateOrigin:s}=t,o=!1===t.autoOffset?null:(0,e1.ow)(i,n,s,r),a=function(e,{sourceCrs:t,viewport:i,modelMatrix:r,coordinateOrigin:n,coordinateSystem:s,offsetMode:o=!1}){let[a,l,c=0]=e;switch(r&&([a,l,c]=e4.Z0([],[a,l,c,1],r)),s){case"meter-offsets":if(i.projectionMode===e2.K.CUSTOM_GEOSPATIAL){let e=i.projectPosition(n),t=i.crs.converter.WGS84.from(n),{unitsPerMeter:r}=i.getDistanceScales(t);return[e[0]+a*r[0],e[1]+l*r[1],e[2]+c*r[2]]}return e5((0,e6.dT)(n,[a,l,c]),i,o);case"cartesian":break;default:if(t){let e=[a+n[0],l+n[1],c+(n[2]||0)],{preproject:r}=i.getPreprojection(t),s=r?r(e):e;if(i.projectionMode===e2.K.CUSTOM_GEOSPATIAL)return s.map((e,t)=>e*i.distanceScales.unitsPerWorldUnit[t]);return e5(s,i,o)}}if(i.projectionMode===e2.K.CUSTOM_GEOSPATIAL){let e=i.distanceScales.unitsPerWorldUnit;return[(a+n[0])*e[0],(l+n[1])*e[1],(c+n[2])*e[2]]}return i.isGeospatial?[a+n[0],l+n[1],c+n[2]]:i.projectPosition([a,l,c])}(e,{...t,offsetMode:!!o?.offsetMode});if(o?.offsetMode){let e=o.commonOrigin||i.projectPosition(o.geospatialOrigin||o.shaderCoordinateOrigin);e3.jb(a,a,e)}return a}(e,{viewport:i,sourceCrs:r,coordinateSystem:n,modelMatrix:s,coordinateOrigin:o,autoOffset:a})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return!!this.internalState&&!this._coordinateSystemLoading&&!this.internalState.isAsyncPropLoading()}get isCoordinateSystemLoaded(){return!this._coordinateSystemLoading}_setSourceCrs(e){this._coordinateSystemLoading=void 0===e,void 0!==e&&(this._sourceCrs=e,this.internalState&&(this.internalState.sourceCrs=e,this._updatePreprojection(this.internalState.viewport||this.context.viewport)))}_updatePreprojection(e){let t=this.internalState,i=!(0,tu.eN)(e.projectionMode,t.sourceCrs,e.crs),r=JSON.stringify([t.sourceCrs?.signature,i?e.projectionMode===e2.K.CUSTOM_GEOSPATIAL?e.crs?.signature:"WGS84":null]),n=t.preprojectionSignature!==r;n&&(Object.assign(t,e.getPreprojection(t.sourceCrs)),t.preprojectionSignature=r,t.preprojectionChanged=!0);let s=JSON.stringify([e.crs?.signature,e.projectionSignature]),o=t.tessellationSignature!==s;return t.tessellationSignature=s,Object.assign(this.state,{sourceCrs:t.sourceCrs,packedCrs:t.packedCrs,preproject:t.preproject,unpreproject:t.unpreproject}),(n||o)&&t.changeFlags&&this.setChangeFlags({projectionChanged:!0}),n||o}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}usePositionTransforms(){return{transformSource:"projection",transform:this.internalState?.preproject?tx:null}}getSubdivisionStep(){let e=this.internalState?.sourceCrs;if(!e)return 0;let t=this.context.viewport.getSubdivisionStep(e),{modelMatrix:i}=this.props;if(!t||!i)return t;let r=Math.max(Math.hypot(i[0],i[1],i[2]),Math.hypot(i[4],i[5],i[6]));return r>0?t/r:0}use64bitPositions(){let{coordinateSystem:e}=this.props;return!!this.internalState?.sourceCrs||this.context?.viewport?.projectionMode===e2.K.CUSTOM_GEOSPATIAL||"default"===e||"lnglat"===e||"cartesian"===e}onHover(e,t){return!!this.props.onHover&&(this.props.onHover(e,t)||!1)}onClick(e,t){return!!this.props.onClick&&(this.props.onClick(e,t)||!1)}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){(0,v.A)(e instanceof Uint8Array);let[t,i,r]=e;return t+256*i+65536*r-1}getNumInstances(){if(Number.isFinite(this.props.numInstances))return this.props.numInstances;if(this.state&&void 0!==this.state.numInstances)return this.state.numInstances;var e,t,i=this.props.data;if(null===(e=i)||"object"!=typeof e)throw Error("count(): argument not an object");if((0,o._)(i))return i.numRows;if("function"==typeof i.count)return i.count();if(Number.isFinite(i.size))return i.size;if(Number.isFinite(i.length))return i.length;if(null!==(t=i)&&"object"==typeof t&&t.constructor===Object)return Object.keys(i).length;throw Error("count(): argument not a container")}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds(["positions","instancePositions"])}resolveColumns(e,t=!1){return(0,a.S)(this.props,e,t)}getShaders(e){for(let t of(e=eQ({defines:{USE_EXTERNAL_PROJECTION:this.context.viewport.projectionMode===e2.K.CUSTOM_GEOSPATIAL}},e),e.modules?.includes(e8.Ay)&&!e.plugins?.includes(e8.lT)&&(e=eQ(e,{plugins:[e8.lT]})),e=eQ(e,{disableWarnings:!0,modules:this.context.defaultShaderModules,plugins:this.context.defaultShaderPlugins}),this.props.extensions))e=eQ(e,t.getShaders.call(this,t));return{...e,shaderAssembler:this.context.shaderAssembler}}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:i}=e.changeFlags;if(i&&t)if(Array.isArray(i))for(let e of i)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:i}=e,r=this.internalState.hasPickingBuffer,n=Number.isInteger(i.highlightedObjectIndex)||!!i.pickable||i.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==n){this.internalState.hasPickingBuffer=n;let e=tv(t.attributes);e&&(n&&e.constant&&(e.constant=!1,t.invalidate(e.id)),e.value||n||(e.constant=!0,e.value=ty(t.attributes)?[e8.Z1]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:i}){let{index:r}=e;return r>=0&&(Array.isArray(this.props.data)?e.object=this.props.data[r]:(0,o._)(this.props.data)&&(e.object=this.props.data.get(r))),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return!!this.internalState&&(this.internalState.needsUpdate||this.internalState.changeFlags.projectionChanged||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()))}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState||!this.context.layerManager.isViewportReady(this))return;let t=this.internalState.viewport;if(this.internalState.viewport=e,this._coordinateSystemLoading)return;let i=this._updatePreprojection(e);t&&tm({oldViewport:t,viewport:e})||(this.setChangeFlags({viewportChanged:!0,projectionChanged:i}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e="all"){let t=this.getAttributeManager();t&&("all"===e?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let i in e)e[i].layoutChanged()&&(t=!0);let i=this.getAttributeManager(),r=!!i?.hasBufferGroups();for(let n of(r&&i.getBufferGroupBindings(e),this.getModels()))this._setModelAttributes(n,e,t,r)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,i=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:i,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let n=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(n)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),i=Object.create(this.props);for(let e in t)Object.defineProperty(i,e,{value:t[e]});return i}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let i=Math.floor(t_.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&0===t_[0];if(i<t||r){t>0xffffff&&g.A.warn("Layer has too many data objects. Picking might not be able to distinguish all objects.")();let e=Math.floor((t_=f.A.allocate(t_,t,{size:4,copy:!0,maxCount:Math.max(t,0xffffff)})).length/4),n=[0,0,0],s=r?0:i;for(let t=s;t<e;t++)this.encodePickingColor(t,n),t_[4*t+0]=n[0],t_[4*t+1]=n[1],t_[4*t+2]=n[2],t_[4*t+3]=0}e.value=t_.subarray(0,4*t)}_setGPUVectorModelAttributes(e,t,i){let r,n=e.userData?.excludeAttributes||{},s=t.getBufferGroupBindings(i,e,n),o={...t.getAttributes()};for(let e in o)n[e]||s.groupedAttributeIds.has(e)?delete o[e]:o[e].settings.isIndexed&&(r=o[e].getBuffer(),delete o[e]);let a=t.getGPUVectors(o,{...s,length:this.getNumInstances()});e.setGPUAttributes(a,s.bufferLayouts),void 0!==r&&e.setIndexBuffer(r)}_setModelAttributes(e,t,i=!1,r=!1){if(!Object.keys(t).length)return;let s=this.getAttributeManager(),o=r?{}:t;if(e instanceof eF.A&&s)return void this._setGPUVectorModelAttributes(e,s,o);if(s?.hasBufferGroups())return void this._setGroupedModelAttributes(e,s,o);if(i){let i=this.getAttributeManager();e.setBufferLayout(i.getBufferLayouts(e)),t=i.getAttributes()}let a=e.userData?.excludeAttributes||{},l={},c={};for(let i in t){if(a[i])continue;let r=t[i].getValue();for(let s in r){let o=r[s];o instanceof n.h?t[i].settings.isIndexed?e.setIndexBuffer(o):l[s]=o:o&&(c[s]=o)}}e.setAttributes(l),e.setConstantAttributes(c)}_setGroupedModelAttributes(e,t,i){let r=e.userData?.excludeAttributes||{},s=t.getBufferGroupBindings(i,e,r);e.setBufferLayout(s.bufferLayouts);let o={...s.buffers},a={},l=t.getAttributes();for(let t in l){if(r[t]||s.groupedAttributeIds.has(t))continue;let i=l[t],c=i.getValue();for(let t in c){let r=c[t];r instanceof n.h?i.settings.isIndexed?e.setIndexBuffer(r):o[t]=r:r&&(a[t]=r)}}e.setAttributes(o),e.setConstantAttributes(a)}disablePickingIndex(e){let t=this.props.data;if(!("attributes"in t)||(0,o._)(t))return void this._disablePickingIndex(e);let i=this.getAttributeManager()?.getAttributes()||{},r=ty(i),n=tb(i),s=r&&t.attributes&&t.attributes[r.id];if(s&&s.value){let i=s.value;for(let n=0;n<t.length;n++)i[r.getVertexOffset(n)]===e&&this._disablePickingIndex(n);return}let a=n&&t.attributes&&t.attributes[n.id];if(a&&a.value){let i=a.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=n.getVertexOffset(e);i[t]===r[0]&&i[t+1]===r[1]&&i[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager()?.getAttributes()||{},i=ty(t);if(i){let t=i.getVertexOffset(e),r=new Uint32Array(i.getVertexOffset(e+1)-t);r.fill(e8.Z1),i.buffer.write(r,t*r.BYTES_PER_ELEMENT);return}let r=tb(t);if(!r){this.internalState&&(0,e8.uz)(this.internalState.disabledPickingIndices,e);return}let n=r.getVertexOffset(e),s=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(s-n),n)}restorePickingColors(){let e=this.getAttributeManager()?.getAttributes()||{},t=tv(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let i=tb(e);this.internalState.usesPickingColorCache&&i&&i.value.buffer!==t_.buffer&&(i.value=t_.subarray(0,i.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(e){(0,v.A)(!this.internalState);let t=this.context.viewport;this.context.viewport=e||t;try{(0,ec.A)("layer.initialize",this);let t=this._getAttributeManager();this.internalState=new tf({attributeManager:t,layer:this}),this.internalState.viewport=e,this._clearChangeFlags(),this.state={};let i=(this.props.coordinateSystem??"default")==="default"?this.context.viewport.isGeospatial?"WGS84":"cartesian":this.props.coordinateSystem,r=void 0===this._sourceCrs?(0,tc.rs)(i):this._sourceCrs;for(let e of((0,v.A)(!(r instanceof Promise)),this.internalState.sourceCrs=r,this._updatePreprojection(this.context.viewport),Object.defineProperty(this.state,"attributeManager",{get:()=>(g.A.deprecated("layer.state.attributeManager","layer.getAttributeManager()")(),t)}),this.internalState.uniformTransitions=new eH(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context),this.props.extensions))e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:"init",propsChanged:"init",viewportChanged:!0,extensionsChanged:!0}),this._update()}finally{this.context.viewport=t}}_transferState(e){(0,ec.A)("layer.matched",this,this===e);let{state:t,internalState:i}=e;this!==e&&(this.internalState=i,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){if(!this.internalState||this._coordinateSystemLoading||!this.context.layerManager.isViewportReady(this))return;this._updatePreprojection(this.internalState?.viewport||this.context.viewport);let e=this.needsUpdate();if((0,ec.A)("layer.update",this,e),!e)return;this.context.stats.get("Layer updates").incrementCount();let t=this.props,i=this.context,r=this.internalState,n=i.viewport,s=this._updateUniformTransition();r.propsInTransition=s,i.viewport=r.viewport||n,this.props=s;try{let e=this._getUpdateParams(),t=this.getModels(),n=!(0,tc.vk)(e.props.coordinateSystem,e.oldProps.coordinateSystem);if(r.preprojectionChanged||this.internalState.preproject&&(n||!(0,eJ.b)(e.props.modelMatrix,e.oldProps.modelMatrix,1)||!(0,eJ.b)(e.props.coordinateOrigin,e.oldProps.coordinateOrigin,1))){let e=this.getAttributeManager();for(let[t,i]of Object.entries(e?.attributes||{}))"projection"===i.settings.transformSource&&("transform"in i.settings&&(!i.settings.transform||i.settings.transform===tx)&&(i.settings.transform=this.usePositionTransforms().transform),e.invalidate(t))}if(i.device)this.updateState(e);else try{this.updateState(e)}catch(e){}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let s=this.getModels()[0]!==t[0];this._postUpdate(e,s)}finally{i.viewport=n,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.preprojectionChanged=!1,r.resetOldProps()}}_finalize(){for(let e of((0,ec.A)("layer.finalize",this),this.finalizeState(this.context),this.props.extensions))e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:i={},parameters:r={}}){this._updateAttributeTransition();let n=this.props,o=this.context;this.props=this.internalState.propsInTransition||n;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:n}=this.props,a=n&&n(i)||[0,0];o.device instanceof s.WebGLDevice&&o.device.setParametersWebGL({polygonOffset:a});let l=o.device instanceof s.WebGLDevice?null:function(e){let{blendConstant:t,...i}=e;return t?{pipelineParameters:i,renderPassParameters:{blendConstant:t}}:{pipelineParameters:i}}(r);if(function(e,t,i,r){for(let n of e)"webgpu"===n.device.type?n.setParameters({...n.parameters,...n.topology.startsWith("triangle")&&{depthBias:Math.round(r[1]),depthBiasSlopeScale:r[0]},...i?.pipelineParameters}):n.setParameters(t)}(this.getModels(),r,l,a),o.device instanceof s.WebGLDevice){let{colorMask:n,...s}=r;"number"==typeof n?Object.assign(s,{colorMask:[!!(1&n),!!(2&n),!!(4&n),!!(8&n)]}):n&&Object.assign(s,{colorMask:n}),o.device.withParametersWebGL(s,()=>{let n={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,n,e);this.draw(n)})}else{let n=e.getParameters();try{e.setParameters(l?.renderPassParameters||{});let n={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,n,e);this.draw(n)}finally{e.setParameters(n)}}}finally{this.props=n}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let i in e)if(e[i]){let r=!1;if("dataChanged"===i){let n=e[i],s=t[i];n&&Array.isArray(s)&&(t.dataChanged=Array.isArray(n)?s.concat(n):n,r=!0)}t[i]||(t[i]=e[i],r=!0),r&&(0,ec.A)("layer.changeFlag",this,i,e)}let i=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=i,t.somethingChanged=i||t.viewportChanged||t.projectionChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,projectionChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let i,r,n,s={...(i=eZ({newProps:e,oldProps:t,propTypes:e[eY.fW],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=function(e,t){if(null===t)return"oldProps is null, initial diff";let i=!1,{dataComparator:r,_dataDiff:n}=e;return r?r(e.data,t.data)||(i="Data comparator detected a change"):e.data!==t.data&&(i="A new data container was supplied"),i&&n&&(i=n(e.data,t.data)||i),i}(e,t),n=!1,!r&&(n=function(e,t){if(null===t||"all"in e.updateTriggers&&eK(e,t,"all"))return{all:!0};let i={},r=!1;for(let n in e.updateTriggers)"all"!==n&&eK(e,t,n)&&(i[n]=!0,r=!0);return!!r&&i}(e,t)),{dataChanged:r,propsChanged:i,updateTriggersChanged:n,extensionsChanged:function(e,t){if(null===t)return!0;let i=t.extensions,{extensions:r}=e;if(r===i)return!1;if(!i||!r||r.length!==i.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(i[e]))return!0;return!1}(e,t),transitionsChanged:function(e,t){if(!e.transitions)return!1;let i={},r=e[eY.fW],n=!1;for(let s in e.transitions){let o=r[s],a=o&&o.type;("number"===a||"color"===a||"array"===a)&&eX(e[s],t[s],o)&&(i[s]=!0,n=!0)}return!!n&&i}(e,t)}),projectionChanged:!(0,tc.vk)(e.coordinateSystem,t.coordinateSystem)};if(s.updateTriggersChanged)for(let e in s.updateTriggersChanged)s.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(s.transitionsChanged)for(let i in s.transitionsChanged)this.internalState.uniformTransitions.add(i,t[i],e[i],e.transitions?.[i]);return this.setChangeFlags(s)}validateProps(){!function(e){let t=e[eY.fW];for(let i in t){let r=t[i],{validate:n}=r;if(n&&!n(e[i],r))throw Error(`Invalid prop ${i}: ${e[i]}`)}}(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:i}=this.props;e.picked&&"function"==typeof i&&(t.highlightColor=i(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new eU(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:i,oldProps:r}=e,n=this.state.model;n?.isInstanced&&n.setInstanceCount(this.getNumInstances());let{autoHighlight:s,highlightedObjectIndex:o,highlightColor:a}=i;if(t||r.autoHighlight!==s||r.highlightedObjectIndex!==o||r.highlightColor!==a){let e={};Array.isArray(a)&&(e.highlightColor=a),(t||r.autoHighlight!==s||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t=this.internalState.needsRedraw&&this.id;let i=this.getAttributeManager(),r=!!i&&i.getNeedsRedraw(e);if(t=t||r)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}}tE.defaultProps=tw,tE.layerName="Layer";let tP=tE;function tx(e){let t=[e[0],e[1],e[2]??0];this.props.modelMatrix&&(0,e3.Z0)(t,t,this.props.modelMatrix);for(let e=0;e<3;e++)t[e]+=this.props.coordinateOrigin[e];return this.internalState.preproject(t)}},88599(e,t,i){i.d(t,{A:()=>s});var r=i(33027);class n extends r.K{}n.defaultProps={...r.K.defaultProps,enforceMatchingVectorLengths:!1};let s=n},15465(e,t,i){i.d(t,{S:()=>s});var r=i(88203),n=i(46908);function s(e,t,i=!1){let o=i&&(0,r._)(e.data)?e.data:null,a={};for(let[i,r]of Object.entries(t)){if(!1===r.prop)continue;let t=e[i];if(null!=t){a[i]=t;continue}if(!r.semantic)continue;let s=o?.getChild(i);if(s){try{let e=(0,n.H)(s.type,{semantic:"vector"===r.semantic?"numeric":r.semantic});if("vector"===r.semantic&&r.size&&e!==(1===r.size?"float32":`float32x${r.size}`))continue}catch{continue}a[i]=s}}return a}},1354(e,t,i){i.d(t,{x:()=>s});var r=i(7914);function n(e,t){t&&Object.entries(t).map(([t,i])=>{t.startsWith("--")?e.style.setProperty(t,i):e.style[t]=i})}class s{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,i=this.rootElement;if(i&&t.className!==e.className&&(t.className&&i.classList.remove(t.className),e.className&&i.classList.add(e.className)),i&&!(0,r.b)(t.style,e.style,1)){var s;(s=t.style)&&Object.keys(s).map(e=>{e.startsWith("--")?i.style.removeProperty(e):i.style[e]=""}),n(i,e.style)}Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=["deck-widget",this.className,this.props.className],t=document.createElement("div");return e.filter(e=>"string"==typeof e&&e.length>0).forEach(e=>t.classList.add(e)),n(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}}s.defaultProps={id:"widget",style:{},_container:null,className:""}},12897(e,t,i){i.d(t,{VD:()=>r,YN:()=>l,fW:()=>s,jA:()=>a,r3:()=>n,uH:()=>o,vf:()=>c});let r={NO_STATE:"Awaiting state",MATCHED:"Matched. State transferred from previous layer",INITIALIZED:"Initialized",AWAITING_GC:"Discarded. Awaiting garbage collection",AWAITING_FINALIZATION:"No longer matched. Awaiting garbage collection",FINALIZED:"Finalized! Awaiting garbage collection"},n=Symbol.for("component"),s=Symbol.for("propTypes"),o=Symbol.for("deprecatedProps"),a=Symbol.for("asyncPropDefaults"),l=Symbol.for("asyncPropOriginal"),c=Symbol.for("asyncPropResolved")},46487(e,t,i){i.d(t,{A:()=>r});let r={name:"color",dependencies:[],source:`

@must_use
fn deckgl_premultiplied_alpha(fragColor: vec4<f32>) -> vec4<f32> {
    return vec4(fragColor.rgb * fragColor.a, fragColor.a); 
};
`,getUniforms:e=>({})}},3065(e,t,i){i.d(t,{A:()=>n});let r="#define SMOOTH_EDGE_RADIUS 0.5",n={name:"geometry",source:`\
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
`}},19754(e,t,i){i.d(t,{lT:()=>g,uz:()=>a,Ay:()=>p,Z1:()=>o});var r=i(34353);let n={props:{},uniforms:{},name:"picking",uniformTypes:{isActive:"f32",isAttribute:"f32",isHighlightActive:"f32",useByteColors:"f32",highlightedObjectColor:"vec3<f32>",highlightColor:"vec4<f32>"},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`\
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
`,getUniforms:function(e={},t){let i={},n=(0,r.eS)(e.useByteColors,!0);return void 0===e.highlightedObjectColor||(null===e.highlightedObjectColor?i.isHighlightActive=!1:(i.isHighlightActive=!0,i.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(i.highlightColor=(0,r.jI)(e.highlightColor,n)),void 0!==e.isActive&&(i.isActive=!!e.isActive,i.isAttribute=!!e.isAttribute),void 0!==e.useByteColors&&(i.useByteColors=!!e.useByteColors),i}};var s=i(26391);let o=0xffffff;function a(e,t){10===e.length?s.A.warn("pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers")():e.push(t)}let l=`\
  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function c(e){return e.replace("  vec4 highlightColor;\n} picking;",`  vec4 highlightColor;
${l}} picking;`)}function u(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}let h=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${o}.0) {
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
`,d=`\
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
  if (objectIndex >= ${o}u) {
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
`,f={...n,vs:`${c(n.vs)}
${h}`,fs:c(n.fs),source:d,uniformTypes:{...n.uniformTypes,disabledPickingIndexCount:"f32",disabledPickingIndices0:"vec4<f32>",disabledPickingIndices1:"vec4<f32>",disabledPickingIndices2:"vec4<f32>"},defaultUniforms:{...n.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let i=n.getUniforms(e,t),r=e.disabledPickingIndices||[];return i.disabledPickingIndexCount=r.length,i.disabledPickingIndices0=u(r,0),i.disabledPickingIndices1=u(r,4),i.disabledPickingIndices2=u(r,8),i}},p=f,g={name:"picking",module:f,injections:[{stage:"vertex",target:"DECKGL_FILTER_GL_POSITION",glsl:`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `},{stage:"vertex",target:"DECKGL_FILTER_COLOR",glsl:`
  picking_setPickingColor(geometry.pickingColor);
  `},{stage:"fragment",target:"DECKGL_FILTER_COLOR",order:99,glsl:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}]}},60275(e,t,i){i.d(t,{K:()=>n,r:()=>r});let r={IDENTITY:0,GEODETIC:1,PROJECTED:2,GEOCENTRIC:3},n={IDENTITY:0,WEB_MERCATOR:1,GLOBE:2,CUSTOM_GEOSPATIAL:3,WEB_MERCATOR_AUTO_OFFSET:4,METER_OFFSETS:5,GLOBE_METER_OFFSETS:6,GEODETIC_OFFSETS:7}},97625(e,t,i){i.d(t,{eN:()=>s,ic:()=>o});var r=i(73499),n=i(60275);function s(e,t,i){if(!t)return!0;switch(e){case n.K.CUSTOM_GEOSPATIAL:return t.signature===i?.signature;case n.K.WEB_MERCATOR:case n.K.WEB_MERCATOR_AUTO_OFFSET:case n.K.GLOBE:case n.K.IDENTITY:return"WGS84"===t.signature;default:return!1}}function o(e,t,i=function(e,t){if(e??(e="default"),"string"!=typeof e&&"object"!=typeof e)throw Error(`Invalid coordinateSystem: ${e}`);let i=e;if("default"===e&&(i=t.isGeospatial?"WGS84":"cartesian"),i===t.crs?.signature)return t.crs;let n=(0,r.rs)(i);if(n instanceof Promise)throw Error(`Coordinate system not loaded: ${e}`);return n}(e,t)){switch(e){case"cartesian":case"meter-offsets":return{coordinateSystem:e,preprojected:!1}}let a=!s(t.projectionMode,i,t.crs);if(a)if(t.projectionMode===n.K.CUSTOM_GEOSPATIAL)return{coordinateSystem:"cartesian",preprojected:a};else return{coordinateSystem:"lnglat",preprojected:a};switch(e){case"default":return{coordinateSystem:i?"lnglat":"cartesian",preprojected:a};case"lnglat-offsets":return{coordinateSystem:e,preprojected:a}}return i?.signature==="WGS84"?{coordinateSystem:"lnglat",preprojected:a}:{coordinateSystem:"cartesian",preprojected:a}}},52948(e,t,i){i.d(t,{A:()=>y});var r=i(5652),n=i(8994),s=i(3065),o=i(74334),a=i(9350),l=i(60275);let c=Object.entries(l.r).map(([e,t])=>`const COORDINATE_SYSTEM_${e}: i32 = ${t};`).join(""),u=Object.keys(l.K).map(e=>`const PROJECTION_MODE_${e}: i32 = ${l.K[e]};`).join(""),h=Object.keys(a.p5).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${a.p5[e]};`).join(""),d=`\
${c}
${u}
${h}

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
`,p=Object.entries(l.r).map(([e,t])=>`const int COORDINATE_SYSTEM_${e} = ${t};`).join(""),g=Object.keys(l.K).map(e=>`const int PROJECTION_MODE_${e} = ${l.K[e]};`).join(""),m=Object.keys(a.p5).map(e=>`const int UNIT_${e.toUpperCase()} = ${a.p5[e]};`).join(""),_=`\
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
`,v={},y={name:"project",dependencies:[r.i,s.A],source:f,vs:_,getUniforms:function(e=v){return"viewport"in e?{...(0,o.aY)(e),sizeScaleTransform:e.sizeScaleTransform||e.viewport.sizeScaleTransform||[1,1,0,0],...e.sizeScale instanceof n.h?{project_sizeScaleBuffer:e.sizeScale,sizeScaleSize:Math.sqrt(e.sizeScale.byteLength/16)}:e.sizeScale?{project_sizeScaleTexture:e.sizeScale,sizeScaleSize:e.sizeScale.width}:{sizeScaleSize:0}}:{}},isCustomProjection:e=>e.projectionMode===l.K.CUSTOM_GEOSPATIAL,uniformTypes:{wrapLongitude:"f32",coordinateFrame:"i32",commonUnitsPerMeter:"vec3<f32>",projectionMode:"i32",scale:"f32",commonUnitsPerWorldUnit:"vec3<f32>",commonUnitsPerWorldUnit2:"vec3<f32>",center:"vec4<f32>",modelMatrix:"mat4x4<f32>",viewProjectionMatrix:"mat4x4<f32>",viewportSize:"vec2<f32>",devicePixelRatio:"f32",focalDistance:"f32",cameraPosition:"vec3<f32>",coordinateOrigin:"vec3<f32>",commonOrigin:"vec3<f32>",pseudoMeters:"f32",sizeScaleSize:"i32",sizeScaleTransform:"vec4<f32>"}}},74334(e,t,i){i.d(t,{aY:()=>p,ow:()=>f});var r=i(11066),n=i(83122),s=i(60275),o=i(97625),a=i(82417);let l=[0,0,0,0],c=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],u=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],h=[0,0,0],d=(0,a.A)(function({viewport:e,devicePixelRatio:t,coordinateSystem:i,coordinateOrigin:o}){let{projectionCenter:a,viewProjectionMatrix:h,originCommon:d,cameraPosCommon:p,shaderCoordinateOrigin:g,geospatialOrigin:m}=function(e,t,i){let{viewMatrixUncentered:s,projectionMatrix:o}=e,{viewMatrix:a,viewProjectionMatrix:u}=e,h=l,d=l,p=e.cameraPosition,{geospatialOrigin:g,shaderCoordinateOrigin:m,commonOrigin:_,offsetMode:v}=f(e,t,i);return v&&(d=_||e.projectPosition(g||m),p=[p[0]-d[0],p[1]-d[1],p[2]-d[2]],d[3]=1,h=n.Z0([],d,u),a=s||a,u=r.lw([],o,a),u=r.lw([],u,c)),{viewMatrix:a,viewProjectionMatrix:u,projectionCenter:h,originCommon:d,cameraPosCommon:p,shaderCoordinateOrigin:m,geospatialOrigin:g}}(e,i,o),_=e.getDistanceScales(),v=[e.width*t,e.height*t],y=n.Z0([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,b={coordinateFrame:function(e,t){switch(e){case"lnglat":case"lnglat-offsets":return s.r.GEODETIC;case"meter-offsets":return s.r.IDENTITY;case"cartesian":switch(t.crs?.coordinateFrame){case"geographic":return s.r.GEODETIC;case"geocentric":return s.r.GEOCENTRIC;case"projected":return s.r.PROJECTED;default:return s.r.IDENTITY}default:throw Error(`Invalid coordinateSystem: ${e}`)}}(i,e),projectionMode:function(e,t){switch(t){case"meter-offsets":switch(e){case s.K.GLOBE:return s.K.GLOBE_METER_OFFSETS;case s.K.WEB_MERCATOR:case s.K.WEB_MERCATOR_AUTO_OFFSET:case s.K.CUSTOM_GEOSPATIAL:return s.K.METER_OFFSETS}break;case"lnglat-offsets":switch(e){case s.K.WEB_MERCATOR:case s.K.WEB_MERCATOR_AUTO_OFFSET:return s.K.GEODETIC_OFFSETS}}return e}(e.projectionMode,i),coordinateOrigin:g,commonOrigin:d.slice(0,3),center:a,pseudoMeters:!!e._pseudoMeters,sizeScaleSize:1,sizeScaleTransform:[1,1,0,0],viewportSize:v,devicePixelRatio:t,focalDistance:y,commonUnitsPerMeter:_.unitsPerMeter,commonUnitsPerWorldUnit:_.unitsPerWorldUnit,commonUnitsPerWorldUnit2:_.unitsPerWorldUnit2,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:h,modelMatrix:u,cameraPosition:p};if(m){let t=e.projectionMode===s.K.CUSTOM_GEOSPATIAL?e.crs.converter.WGS84.from(m):m,r=e.getDistanceScales(t);switch(i){case"meter-offsets":b.commonUnitsPerWorldUnit=r.unitsPerMeter,b.commonUnitsPerWorldUnit2=r.unitsPerMeter2,e.projectionMode===s.K.CUSTOM_GEOSPATIAL&&(b.commonUnitsPerMeter=r.unitsPerMeter);break;case"lnglat":case"lnglat-offsets":e._pseudoMeters||(b.commonUnitsPerMeter=r.unitsPerMeter),b.commonUnitsPerWorldUnit=r.unitsPerWorldUnit,b.commonUnitsPerWorldUnit2=r.unitsPerWorldUnit2;break;case"cartesian":b.commonUnitsPerWorldUnit=[1,1,r.unitsPerMeter[2]],b.commonUnitsPerWorldUnit2=[0,0,r.unitsPerMeter2[2]]}}if(e.projectionMode===s.K.GLOBE&&"meter-offsets"===i){let e=o[0]*Math.PI/180,t=o[1]*Math.PI/180,i=Math.cos(t),r=((o[2]||0)/6370972+1)*256;b.commonOrigin=[Math.sin(e)*i*r,-Math.cos(e)*i*r,Math.sin(t)*r]}return b});function f(e,t,i=h,r){let n,a;i.length<3&&(i=[i[0],i[1],0]);let l=i,c=(0,o.ic)(t,e,r);t=c.coordinateSystem,c.preprojected&&(i=h);let u=!0;switch(t){case"lnglat-offsets":case"meter-offsets":a=i;break;default:a=e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null}switch(e.projectionMode){case s.K.WEB_MERCATOR:switch(t){case"lnglat":a=[0,0,0],u=!1;break;case"cartesian":u=!1,a=e.unprojectPosition([Math.fround(e.center[0]),Math.fround(e.center[1]),0])}break;case s.K.WEB_MERCATOR_AUTO_OFFSET:switch(t){case"lnglat":l=a;break;case"cartesian":l=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],a=e.unprojectPosition(l),l[0]-=i[0],l[1]-=i[1],l[2]-=i[2]}break;case s.K.IDENTITY:(l=e.position.map(Math.fround))[2]=l[2]||0;break;case s.K.CUSTOM_GEOSPATIAL:{if("meter-offsets"===t){l=h,n=e.projectPosition(i);break}a=null;let r=e.distanceScales.unitsPerWorldUnit;n=(l=e.center.map((e,t)=>Math.fround(e/r[t]-i[t]))).map((e,t)=>(e+i[t])*r[t]);break}case s.K.GLOBE:u=!1,a=null;break;default:u=!1}return{geospatialOrigin:a,shaderCoordinateOrigin:l,commonOrigin:n,offsetMode:u}}function p({viewport:e,devicePixelRatio:t=1,modelMatrix:i=null,coordinateSystem:r="default",coordinateOrigin:n=h,autoWrapLongitude:a=!1,sourceCrs:l}){let c=(0,o.ic)(r,e,l);if("lnglat-offsets"===(r=c.coordinateSystem)&&e.projectionMode===s.K.GLOBE&&(r="lnglat"),!c.preprojected&&"lnglat"===r&&n.some(e=>0!==e)){let e=Array.from(i||u);e[12]+=n[0],e[13]+=n[1],e[14]+=n[2]||0,i=e,n=h}c.preprojected&&(n=h,i=null,a=!1);let f=d({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:n});return f.wrapLongitude=a,f.modelMatrix=i||u,f}},84175(e,t,i){i.d(t,{A:()=>o});var r=i(52948);let n=`\
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
`,s=`\
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
`,o={name:"project32",dependencies:[r.A],source:n,vs:s}},70053(e,t,i){i.d(t,{A:()=>a});var r=i(78715),n=i(49105);let s=["longitude","latitude","zoom","bearing","pitch"],o=["longitude","latitude","zoom"];class a extends r.A{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,i=Array.isArray(e)?{}:e;i.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:s,required:o},super(i.transitionProps),this.opts=i}initializeProps(e,t){let i=super.initializeProps(e,t),{makeViewport:r,around:n}=this.opts;if(r&&n){let s=r(e),o=r(t),a=s.unproject(n);i.start.around=n,Object.assign(i.end,{around:o.project(a),aroundPosition:a,width:t.width,height:t.height})}return i}interpolateProps(e,t,i){let r={};for(let s of this._propsToExtract)r[s]=(0,n.Cc)(e[s]||0,t[s]||0,i);if(t.aroundPosition&&this.opts.makeViewport){let s=this.opts.makeViewport({...t,...r});Object.assign(r,s.panByPosition(t.aroundPosition,(0,n.Cc)(e.around,t.around,i)))}return r}}},78715(e,t,i){i.d(t,{A:()=>s});var r=i(49105),n=i(24067);class s{constructor(e){let{compare:t,extract:i,required:r}=e;this._propsToCompare=t,this._propsToExtract=i||t,this._requiredProps=r}arePropsEqual(e,t){for(let i of this._propsToCompare)if(!(i in e)||!(i in t)||!(0,r.aI)(e[i],t[i]))return!1;return!0}initializeProps(e,t){let i={},r={};for(let n of this._propsToExtract)(n in e||n in t)&&(i[n]=e[n],r[n]=t[n]);return this._checkRequiredProps(i),this._checkRequiredProps(r),{start:i,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let i=e[t];(0,n.A)(Number.isFinite(i)||Array.isArray(i),`${t} is required for transition`)})}}},2357(e,t,i){i.d(t,{A:()=>r});class r{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1)}update(){if(!this._inProgress)return!1;if(null===this._handle){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}}},24067(e,t,i){i.d(t,{A:()=>r});function r(e,t){if(!e)throw Error(t||"deck.gl: assertion failed.")}},73499(e,t,i){i.d(t,{rs:()=>u,rz:()=>a,vk:()=>c});var r=i(35033),n=i(94703),s=i(15672);let o=(e,t)=>{if(!t)return Array.from(e);for(let i=0;i<e.length;i++)t[i]=e[i];return t},a={signature:"WGS84",projection:"longlat",parameters:{proj:"longlat",datum:"WGS84"},coordinateFrame:"geographic",ellipsoid:{semiMajorAxis:6378137,semiMinorAxis:6356752.314245179},axis:"enu",xUnit:{name:"degrees",degreesPerUnit:1},yUnit:{name:"degrees",degreesPerUnit:1},zUnit:{name:"meters",metersPerUnit:1},lossy:!1,renderingBounds:[[-180,-90,0],[180,90,0]],renderingScale:()=>null,getRenderingScale:()=>null,converter:{WGS84:{from:o,to:o,normalize:o}}},l=new Map([[a.signature,a],[n.hx.signature,n.hx],[s.C.signature,s.C]]);function c(e,t){return e===t||("string"==typeof e?e:JSON.stringify(e))===("string"==typeof t?t:JSON.stringify(t))}function u(e){let t=e;switch("string"==typeof e?e.toLowerCase():null){case"lnglat":case"longlat":case"wgs84":case"epsg:4326":case"epsg:4979":case"lnglat-offsets":return a;case"globe":return n.hx;case"cartesian":case"meter-offsets":return null;case"epsg:4328":t="EPSG:4978"}let i="string"==typeof t?t:JSON.stringify(t),s=l.get(i);if(s)return s;let o=r.projectionEngine.getCRS(t).then(e=>(l.set(i,e),l.set(e.signature,e),e),e=>{throw l.get(i)===o&&l.delete(i),e});return l.set(i,o),o}},7914(e,t,i){i.d(t,{b:()=>function e(t,i,r){if(t===i)return!0;if(!r||!t||!i)return!1;if(Array.isArray(t)){if(!Array.isArray(i)||t.length!==i.length)return!1;for(let n=0;n<t.length;n++)if(!e(t[n],i[n],r-1))return!1;return!0}if(Array.isArray(i))return!1;if("object"==typeof t&&"object"==typeof i){let n=Object.keys(t),s=Object.keys(i);if(n.length!==s.length)return!1;for(let s of n)if(!i.hasOwnProperty(s)||!e(t[s],i[s],r-1))return!1;return!0}return!1}})},38055(e,t,i){function r(e,t=()=>!0){return Array.isArray(e)?function e(t,i,r){let n=-1;for(;++n<t.length;){let s=t[n];Array.isArray(s)?e(s,i,r):i(s)&&r.push(s)}return r}(e,t,[]):t(e)?[e]:[]}function n({target:e,source:t,start:i=0,count:r=1}){let s=t.length,o=r*s,a=0;for(let r=i;a<s;a++)e[r++]=t[a];for(;a<o;)a<o-a?(e.copyWithin(i+a,i,i+a),a*=2):(e.copyWithin(i+a,i,i+o-a),a=o);return e}i.d(t,{B:()=>r,R:()=>n})},53439(e,t,i){i.d(t,{I:()=>a,Td:()=>o,X:()=>s});let r=[],n=[];function s(e,t=0,i=1/0){let o=r,a={index:-1,data:e,target:[]};return e?"function"==typeof e[Symbol.iterator]?o=e:e.length>0&&(n.length=e.length,o=n):o=r,(t>0||Number.isFinite(i))&&(o=(Array.isArray(o)?o:Array.from(o)).slice(t,i),a.index=t-1),{iterable:o,objectInfo:a}}function o(e){return e&&e[Symbol.asyncIterator]}function a(e,t){let{size:i,stride:r,offset:n,startIndices:s,nested:o}=t,a=e.BYTES_PER_ELEMENT,l=r?r/a:i,c=n?n/a:0,u=Math.floor((e.length-c)/l);return(t,{index:r,target:n})=>{let a;if(!s){let t=r*l+c;for(let r=0;r<i;r++)n[r]=e[t+r];return n}let h=s[r],d=s[r+1]||u;if(o){a=Array(d-h);for(let t=h;t<d;t++){let r=t*l+c;n=Array(i);for(let t=0;t<i;t++)n[t]=e[r+t];a[t-h]=n}}else if(l===i)a=e.subarray(h*i+c,d*i+c);else{a=new e.constructor((d-h)*i);let t=0;for(let r=h;r<d;r++){let n=r*l+c;for(let r=0;r<i;r++)a[t++]=e[n+r]}}return a}}},26391(e,t,i){var r,n;function s(){return!("object"==typeof process&&"[object process]"===String(process)&&!process?.browser)||function(){if("u">typeof window&&window.process?.type==="renderer"||"u">typeof process&&process.versions?.electron)return!0;let e="u">typeof navigator&&navigator.userAgent;return!!(e&&e.indexOf("Electron")>=0)}()}i.d(t,{A:()=>b});let o="4.1.2";function a(e,t){if(!e)throw Error(t||"Assertion failed")}function l(e){let t;if(!e)return 0;switch(typeof e){case"number":t=e;break;case"object":t=e.logLevel||e.priority||0;break;default:return 0}return a(Number.isFinite(t)&&t>=0),t}let c=()=>{};class u{constructor({level:e=0}={}){this.userData={},this._onceCache=new Set,this._level=e}set level(e){this.setLevel(e)}get level(){return this.getLevel()}setLevel(e){return this._level=e,this}getLevel(){return this._level}warn(e,...t){return this._log("warn",0,e,t,{once:!0})}error(e,...t){return this._log("error",0,e,t)}log(e,t,...i){return this._log("log",e,t,i)}info(e,t,...i){return this._log("info",e,t,i)}once(e,t,...i){return this._log("once",e,t,i,{once:!0})}_log(e,t,i,r,n={}){let s=function(e){let{logLevel:t,message:i}=e;e.logLevel=l(t);let r=e.args?Array.from(e.args):[];for(;r.length&&r.shift()!==i;);switch(typeof t){case"string":case"function":void 0!==i&&r.unshift(i),e.message=t;break;case"object":Object.assign(e,t)}"function"==typeof e.message&&(e.message=e.message());let n=typeof e.message;return a("string"===n||"object"===n),Object.assign(e,{args:r},e.opts)}({logLevel:t,message:i,args:this._buildArgs(t,i,r),opts:n});return this._createLogFunction(e,s,n)}_buildArgs(e,t,i){return[e,t,...i]}_createLogFunction(e,t,i){if(!this._shouldLog(t.logLevel))return c;let r=this._getOnceTag(i.tag??t.tag??t.message);if((i.once||t.once)&&void 0!==r){if(this._onceCache.has(r))return c;this._onceCache.add(r)}return this._emit(e,t)}_shouldLog(e){return this.getLevel()>=l(e)}_getOnceTag(e){if(void 0!==e)try{return"string"==typeof e?e:String(e)}catch{return}}}class h{constructor(e,t,i="sessionStorage"){this.storage=function(e){try{let t=window[e],i="__storage_test__";return t.setItem(i,i),t.removeItem(i),t}catch(e){return null}}(i),this.id=e,this.config=t,this._loadConfiguration()}getConfiguration(){return this.config}setConfiguration(e){if(Object.assign(this.config,e),this.storage){let e=JSON.stringify(this.config);this.storage.setItem(this.id,e)}}_loadConfiguration(){let e={};if(this.storage){let t=this.storage.getItem(this.id);e=t?JSON.parse(t):{}}return Object.assign(this.config,e),this}}function d(e){return"string"!=typeof e?e:r[e=e.toUpperCase()]||r.WHITE}(n=r||(r={}))[n.BLACK=30]="BLACK",n[n.RED=31]="RED",n[n.GREEN=32]="GREEN",n[n.YELLOW=33]="YELLOW",n[n.BLUE=34]="BLUE",n[n.MAGENTA=35]="MAGENTA",n[n.CYAN=36]="CYAN",n[n.WHITE=37]="WHITE",n[n.BRIGHT_BLACK=90]="BRIGHT_BLACK",n[n.BRIGHT_RED=91]="BRIGHT_RED",n[n.BRIGHT_GREEN=92]="BRIGHT_GREEN",n[n.BRIGHT_YELLOW=93]="BRIGHT_YELLOW",n[n.BRIGHT_BLUE=94]="BRIGHT_BLUE",n[n.BRIGHT_MAGENTA=95]="BRIGHT_MAGENTA",n[n.BRIGHT_CYAN=96]="BRIGHT_CYAN",n[n.BRIGHT_WHITE=97]="BRIGHT_WHITE";let f=globalThis,p=globalThis.process||{};class g{getHighResolutionTimer(){let e;if(s()&&f.performance)e=f?.performance?.now?.();else if("hrtime"in p){let t=p?.hrtime?.();e=1e3*t[0]+t[1]/1e6}else e=Date.now();return e}getMemoryUsageMB(){let e=f?.performance,t=e?.memory?.usedJSHeapSize;return null==t?null:Math.trunc(t/1024/1024)}}let m=new g;globalThis.Probe=g,globalThis.probe=m;let _={debug:s()&&console.debug||console.log,log:console.log,info:console.info,warn:console.warn,error:console.error},v={enabled:!0,level:0};class y extends u{constructor({id:e}={id:""}){super({level:0}),this.VERSION=o,this._startTs=m.getHighResolutionTimer(),this._deltaTs=m.getHighResolutionTimer(),this.userData={},this.LOG_THROTTLE_TIMEOUT=0,this.id=e,this.userData={},this._storage=new h(`__probe-${this.id}__`,{[this.id]:v}),this.timeStamp(`${this.id} started`),function(e,t=["constructor"]){for(let i of Object.getOwnPropertyNames(Object.getPrototypeOf(e))){let r=e[i];"function"!=typeof r||t.find(e=>i===e)||(e[i]=r.bind(e))}}(this),Object.seal(this)}isEnabled(){return this._getConfiguration().enabled}getLevel(){return this._getConfiguration().level}getTotal(){return Number((m.getHighResolutionTimer()-this._startTs).toPrecision(10))}getDelta(){return Number((m.getHighResolutionTimer()-this._deltaTs).toPrecision(10))}set priority(e){this.level=e}get priority(){return this.level}getPriority(){return this.level}enable(e=!0){return this._updateConfiguration({enabled:e}),this}setLevel(e){return this._updateConfiguration({level:e}),this}get(e){return this._getConfiguration()[e]}set(e,t){this._updateConfiguration({[e]:t})}settings(){console.table?console.table(this._storage.config):console.log(this._storage.config)}assert(e,t){if(!e)throw Error(t||"Assertion failed")}warn(e,...t){return this._log("warn",0,e,t,{method:_.warn,once:!0})}error(e,...t){return this._log("error",0,e,t,{method:_.error})}deprecated(e,t){return this.warn(`\`${e}\` is deprecated and will be removed \
in a later version. Use \`${t}\` instead`)}removed(e,t){return this.error(`\`${e}\` has been removed. Use \`${t}\` instead`)}probe(e,t,...i){let r=m.getMemoryUsageMB();if(null!==r){let e=`${r}MB `;"function"==typeof t?t=()=>`${e}${t()}`:"string"==typeof t&&(t=`${e}${t}`)}return this._log("log",e,t,i,{method:_.log,time:!0,once:!0})}log(e,t,...i){return this._log("log",e,t,i,{method:_.debug})}info(e,t,...i){return this._log("info",e,t,i,{method:console.info})}once(e,t,...i){return this._log("once",e,t,i,{method:_.debug||_.info,once:!0})}table(e,t,i){return t?this._log("table",e,t,i&&[i]||[],{method:console.table||c,tag:function(e){for(let t in e)for(let i in e[t])return i||"untitled";return"empty"}(t)}):c}time(e,t){return this._log("time",e,t,[],{method:console.time?console.time:console.info})}timeEnd(e,t){return this._log("time",e,t,[],{method:console.timeEnd?console.timeEnd:console.info})}timeStamp(e,t){return this._log("time",e,t,[],{method:console.timeStamp||c})}group(e,t,i={collapsed:!1}){let r=(i.collapsed?console.groupCollapsed:console.group)||console.info;return this._log("group",e,t,[],{method:r})}groupCollapsed(e,t,i={}){return this.group(e,t,Object.assign({},i,{collapsed:!0}))}groupEnd(e){return this._log("groupEnd",e,"",[],{method:console.groupEnd||c})}withGroup(e,t,i){this.group(e,t)();try{i()}finally{this.groupEnd(e)()}}trace(){console.trace&&console.trace()}_shouldLog(e){return this.isEnabled()&&super._shouldLog(e)}_emit(e,t){let i=t.method;a(i),t.total=this.getTotal(),t.delta=this.getDelta(),this._deltaTs=m.getHighResolutionTimer();let r=function(e,t,i){if("string"==typeof t){var r;let n=i.time?function(e,t=8){let i=Math.max(t-e.length,0);return`${" ".repeat(i)}${e}`}((r=i.total)<10?`${r.toFixed(2)}ms`:r<100?`${r.toFixed(1)}ms`:r<1e3?`${r.toFixed(0)}ms`:`${(r/1e3).toFixed(2)}s`):"";t=function(e,t,i){if(!s&&"string"==typeof e){if(t){let i=d(t);e=`\u001b[${i}m${e}\u001b[39m`}if(i){let t=d(i);e=`\u001b[${t+10}m${e}\u001b[49m`}}return e}(t=i.time?`${e}: ${n}  ${t}`:`${e}: ${t}`,i.color,i.background)}return t}(this.id,t.message,t);return i.bind(console,r,...t.args)}_getConfiguration(){return this._storage.config[this.id]||this._updateConfiguration(v),this._storage.config[this.id]}_updateConfiguration(e){let t=this._storage.config[this.id]||{...v};this._storage.setConfiguration({[this.id]:{...t,...e}})}}y.VERSION=o;let b=new y({id:"deck"})},25667(e,t,i){let r;i.d(t,{$M:()=>o,Vl:()=>l,_Z:()=>p,cT:()=>f,om:()=>c,on:()=>u,zi:()=>a});var n=i(23459),s=i(78861);function o(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function a(e,t){let i=e%t;return i<0?t+i:i}function l(e){return[e[12],e[13],e[14]]}function c(e){let t=e[10],i=e[14];return{near:i/(t-1),far:i/(t+1)}}function u(e){return{left:d(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:d(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:d(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:d(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:d(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:d(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}let h=new s.P;function d(e,t,i,r){h.set(e,t,i);let n=h.len();return{distance:r/n,normal:new s.P(-e/n,-t/n,-i/n)}}function f(e,t){let{size:i=1,startIndex:s=0}=t,o=void 0!==t.endIndex?t.endIndex:e.length,a=(o-s)/i;r=n.A.allocate(r,a,{type:Float32Array,size:2*i});let l=s,c=0;for(;l<o;){for(let t=0;t<i;t++){let n=e[l++];r[c+t]=n,r[c+t+i]=n-Math.fround(n)}c+=2*i}return r.subarray(0,a*i*2)}function p(e){let t=null,i=!1;for(let r of e)r&&(t?(i||(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],i=!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}},82417(e,t,i){i.d(t,{A:()=>r});function r(e){let t,i={};return r=>{for(let n in r)if(!function(e,t){if(e===t)return!0;if(Array.isArray(e)){let i=e.length;if(!t||t.length!==i)return!1;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}return!1}(r[n],i[n])){t=e(r),i=r;break}return t}}},33945(e,t,i){i.d(t,{E9:()=>s,rk:()=>n});let r=/^(?:\d+\.?\d*|\.\d+)$/;function n(e){switch(typeof e){case"number":if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:"literal",value:e};case"string":try{let t=function(e){let t=[],i=0;for(;i<e.length;){let n=e[i];if(/\s/.test(n)){i++;continue}if("+"===n||"-"===n||"("===n||")"===n||"%"===n){t.push({type:"symbol",value:n}),i++;continue}if(a(n)||"."===n){let s=i,o="."===n;for(i++;i<e.length;){let t=e[i];if(a(t)){i++;continue}if("."===t&&!o){o=!0,i++;continue}break}let l=e.slice(s,i);if(!r.test(l))throw Error("Invalid number token");t.push({type:"number",value:parseFloat(l)});continue}if(l(n)){let r=i;for(;i<e.length&&l(e[i]);)i++;let n=e.slice(r,i).toLowerCase();t.push({type:"word",value:n});continue}throw Error("Invalid token in position string")}return t}(e);return new o(t).parseExpression()}catch(i){let t=i instanceof Error?i.message:String(i);throw Error(`Could not parse position string ${e}: ${t}`)}default:throw Error(`Could not parse position string ${e}`)}}function s(e,t){return function e(t,i){switch(t.type){case"literal":return t.value;case"percentage":return Math.round(t.value*i);case"binary":let r=e(t.left,i),n=e(t.right,i);return"+"===t.operator?r+n:r-n;default:throw Error("Unknown layout expression type")}}(e,t)}class o{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error("Unexpected token at end of expression");return e}parseBinaryExpression(){var e;let t=this.parseFactor(),i=this.peek();for(;(e=i)&&"symbol"===e.type&&("+"===e.value||"-"===e.value);){this.index++;let e=this.parseFactor();t={type:"binary",operator:i.value,left:t,right:e},i=this.peek()}return t}parseFactor(){let e=this.peek();if(!e)throw Error("Unexpected end of expression");if("symbol"===e.type&&"+"===e.value)return this.index++,this.parseFactor();if("symbol"===e.type&&"-"===e.value)return this.index++,{type:"binary",operator:"-",left:{type:"literal",value:0},right:this.parseFactor()};if("symbol"===e.type&&"("===e.value){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw Error("Missing closing parenthesis");return e}if("word"===e.type&&"calc"===e.value){if(this.index++,!this.consumeSymbol("("))throw Error("Missing opening parenthesis after calc");let e=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw Error("Missing closing parenthesis");return e}if("number"===e.type){this.index++;let t=e.value,i=this.peek();return i&&"symbol"===i.type&&"%"===i.value?(this.index++,{type:"percentage",value:t/100}):(i&&"word"===i.type&&"px"===i.value&&this.index++,{type:"literal",value:t})}throw Error("Unexpected token in expression")}consumeSymbol(e){let t=this.peek();return!!t&&"symbol"===t.type&&t.value===e&&(this.index++,!0)}peek(){return this.tokens[this.index]||null}}function a(e){return e>="0"&&e<="9"}function l(e){return e>="a"&&e<="z"||e>="A"&&e<="Z"}},23459(e,t,i){i.d(t,{A:()=>r});let r=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:i=1,type:r,padding:n=0,copy:s=!1,initialize:o=!1,maxCount:a}){let l=r||e&&e.constructor||Float32Array,c=t*i+n;if(ArrayBuffer.isView(e)){if(c<=e.length)return e;if(c*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new l(e.buffer,0,c)}let u=1/0;a&&(u=a*i+n);let h=this._allocate(l,c,o,u);return e&&s?h.set(e):o||h.fill(0,0,4),this._release(e),h}release(e){this._release(e)}_allocate(e,t,i,r){let n=Math.max(Math.ceil(t*this.opts.overAlloc),1);n>r&&(n=r);let s=this._pool,o=e.BYTES_PER_ELEMENT*n,a=s.findIndex(e=>e.byteLength>=o);if(a>=0){let t=new e(s.splice(a,1)[0],0,n);return i&&t.fill(0),t}return new e(n)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:i}=e,{byteLength:r}=i,n=t.findIndex(e=>e.byteLength>=r);n<0?t.push(i):(n>0||t.length<this.opts.poolSize)&&t.splice(n,0,i),t.length>this.opts.poolSize&&t.shift()}}},94703(e,t,i){i.d(t,{C6:()=>h,NY:()=>w,bl:()=>_,bn:()=>b,hx:()=>m,qz:()=>v});var r=i(49105),n=i(73314),s=i(89043),o=i(78715),a=i(41401),l=i(98609);let c=Math.PI/180,u=180/Math.PI,h=6370972,d=[1,1,1],f={proj:"geocent",R:String(6370972),datum:"none"},p=l.S.create({semiMajorAxis:h,semiMinorAxis:h,eccentricitySquared:0,parameters:f});function g(e){return(t,i)=>{let r=e(Array.from(t));if(!i)return r;for(let e=0;e<r.length;e++)i[e]=r[e];return i}}let m={signature:`+proj=geocent +R=${h} +datum=none`,coordinateFrame:"geocentric",projection:"geocent",parameters:f,ellipsoid:{semiMajorAxis:h,semiMinorAxis:h},axis:"enu",xUnit:{name:"meters",metersPerUnit:1},yUnit:{name:"meters",metersPerUnit:1},zUnit:{name:"meters",metersPerUnit:1},lossy:!1,renderingBounds:[[-h,-h,-h],[h,h,h]],renderingScale:d,getRenderingScale:()=>d,converter:{WGS84:{from:g(e=>{let t=p.forward3D([e[0]*c,e[1]*c,e[2]??0]);return[e[0],e[1],e[2]]=t,e}),to:g(e=>{let t=p.inverse3D([e[0],e[1],e[2]]);return e[0]=t[0]/c,e[1]=t[1]/c,e[2]=t[2],e}),normalize:g(e=>{let t=e[0];return e[0]=180>=Math.abs(t)?t:((t+180)%360+360)%360-180,e[1]=Math.max(-90,Math.min(90,e[1])),e})}}};function _(e,t){return t&&(e=Math.max(Math.min(e,a.aH),-a.aH)),Math.log2(Math.PI*Math.cos(e*Math.PI/180))}class v{static toPosition(e,t){let i=t*c,r=e*c,n=Math.cos(i);return[n*Math.cos(r),n*Math.sin(r),Math.sin(i)]}static toLngLat(e){return[Math.atan2(e[1],e[0])*u,Math.asin((0,r.qE)(e[2],-1,1))*u]}static tangentBasis(e,t){let i=t*c,r=e*c,n=Math.sin(i),s=Math.sin(r),o=Math.cos(r);return{N:[-n*o,-n*s,Math.cos(i)],E:[-s,o,0]}}static upVector(e,t,i){let{N:r,E:n}=v.tangentBasis(e,t),s=i*c,o=Math.cos(s),a=Math.sin(s);return[r[0]*o+n[0]*a,r[1]*o+n[1]*a,r[2]*o+n[2]*a]}static bearing(e,t,i){let{N:r,E:n}=v.tangentBasis(t,i);return Math.atan2(s.Om(e,n),s.Om(e,r))*u}static cameraFrame(e,t,i){let r=v.toPosition(e,t),n=v.upVector(e,t,i),{N:o,E:a}=v.tangentBasis(e,t),l=i*c,u=Math.cos(l),h=Math.sin(l),d=[a[0]*u-o[0]*h,a[1]*u-o[1]*h,a[2]*u-o[2]*h];return{position:r,up:n,axisHorizontal:s.$A([],r,d),axisVertical:s.$A([],r,n),longitude:e,latitude:t,bearing:i}}static angularDistance(e,t){let i=v.toPosition(e.longitude,e.latitude),n=v.toPosition(t.longitude,t.latitude);return Math.acos((0,r.qE)(s.Om(i,n),-1,1))}static greatCircleAxis(e,t){let i=v.toPosition(e.longitude,e.latitude),r=v.toPosition(t.longitude,t.latitude);return s.S8([],s.$A([],i,r))}static rotate(e,t,i){let r=new n.P().fromAxisRotation(t,i);return s.gL([],e,r)}static rotateFrame(e,t,i,r){let n=v.rotate(e.position,e.axisHorizontal,t);n=v.rotate(n,e.axisVertical,i);let s=v.rotate(e.up,e.axisHorizontal,t);s=v.rotate(s,e.axisVertical,i);let[o,a]=v.toLngLat(n),l=r?0:v.bearing(s,o,a);return{...e,position:n,up:s,longitude:o,latitude:a,bearing:l}}}let y=1/(1-Math.exp(-5)),b=e=>(1-Math.exp(-5*e))*y;class w extends o.A{constructor(e){let t="axis"in e;super({compare:["longitude","latitude"],extract:t?["longitude","latitude","zoom","bearing"]:["longitude","latitude","zoom"],required:["longitude","latitude"]}),t?(this._mode="rotation",this._axis=e.axis,this._totalAngle=e.totalAngle):(this._mode="linear",this._targetLongitude=e.targetLongitude)}initializeProps(e,t){let i=super.initializeProps(e,t);return this._startZoom=e.zoom,"rotation"===this._mode?this._startFrame={...v.cameraFrame(e.longitude,e.latitude,e.bearing||0),axisHorizontal:this._axis}:i.end.longitude=this._targetLongitude,i}interpolateProps(e,t,i){if("rotation"===this._mode){let{longitude:e,latitude:t,bearing:r}=v.rotateFrame(this._startFrame,this._totalAngle*i,0),n=this._startZoom+_(t,!0)-_(this._startFrame.latitude,!0);return{bearing:r,longitude:e,latitude:t,zoom:n}}let r=e.longitude+(t.longitude-e.longitude)*i,n=e.latitude+(t.latitude-e.latitude)*i,s=this._startZoom+_(n,!0)-_(e.latitude,!0);return{longitude:r,latitude:n,zoom:s}}}},47345(e,t,i){i.d(t,{A:()=>y});var r=i(26391),n=i(24067),s=i(73499),o=i(97625),a=i(25667),l=i(41401),c=i(94022),u=i(49105),h=i(78861),d=i(11066),f=i(60275);let p=Math.PI/180,g=(0,a.$M)(),m=[0,0,0];function _(e={}){let t=e.unitsPerWorldUnit??[1,1,1],i=e.unitsPerMeter??t;return{unitsPerWorldUnit:t,unitsPerMeter:i,unitsPerWorldUnit2:e.unitsPerWorldUnit2??[0,0,0],unitsPerMeter2:e.unitsPerMeter2??[0,0,0],metersPerUnit:[1/i[0],1/i[1],1/i[2]]}}class v{get projectionSignature(){return this.resolution||null}getSubdivisionStep(e){if(!this.resolution||!this.crs||e.signature===this.crs.signature)return 0;switch(this.projectionMode){case f.K.WEB_MERCATOR:case f.K.WEB_MERCATOR_AUTO_OFFSET:if("geographic"===e.coordinateFrame)return 0}let t=e.ellipsoid?.semiMajorAxis??s.rz.ellipsoid.semiMajorAxis,i=2*Math.PI*t/this.resolution;if("geographic"===e.coordinateFrame)return i/(t*Math.PI/180);{let t=e.xUnit.metersPerUnit,r=e.yUnit.metersPerUnit;return(0,n.A)("number"==typeof t&&t>0&&"number"==typeof r&&r>0),i/Math.max(t,r)}}getPreprojection(e){if((0,o.eN)(this.projectionMode,e,this.crs))return{preproject:null,unpreproject:null,packedCrs:e};let t=this.projectionMode===f.K.CUSTOM_GEOSPATIAL,i="WGS84"===e.signature,r=e.converter.WGS84,n=t?this.crs.converter.WGS84:null;return{preproject:e=>{let t=i?e:r.to(e),s=n?n.from(n.normalize(t)):t;return[s[0],s[1],s[2]??0]},unpreproject:e=>{let t=n?n.to(e):e,s=i?t:r.from(t);return[s[0],s[1],s[2]??0]},packedCrs:t?this.crs:s.rz}}constructor(e={}){if(this._frustumPlanes={},this.resolution=e.resolution??0,!Number.isFinite(this.resolution)||this.resolution<0)throw Error("resolution must be finite and non-negative");this.crs=e.crs,e.targetToCommonMatrix&&(this.targetToCommonMatrix=new c.k(e.targetToCommonMatrix),this._commonToTargetMatrix=new c.k(this.targetToCommonMatrix).invert()),this._distanceScaleSampler="function"==typeof e.distanceScales?e.distanceScales:void 0,this.id=e.id||this.constructor.displayName||"viewport",this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding;let t=this.crs?[this.crs.xUnit,this.crs.yUnit,this.crs.zUnit].map(e=>e.metersPerUnit??1):void 0;this.distanceScales=_({unitsPerWorldUnit:t,...this._distanceScaleSampler?this._distanceScaleSampler():e.distanceScales}),this.focalDistance=e.focalDistance||1,this.position=e.position||m,this.modelMatrix=e.modelMatrix||null,this.isGeospatial=!!this.crs,this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return 1/this.distanceScales.unitsPerMeter[2]/this.scale}get projectionMode(){return f.K.IDENTITY}equals(e){return e instanceof v&&(this===e||e.width===this.width&&e.height===this.height&&e.scale===this.scale&&e.projectionMode===this.projectionMode&&e.resolution===this.resolution&&e.projectionSignature===this.projectionSignature&&e.crs?.signature===this.crs?.signature&&(0,u.aI)(e.targetToCommonMatrix||g,this.targetToCommonMatrix||g)&&(0,u.aI)(e.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&(0,u.aI)(e.projectionMatrix,this.projectionMatrix)&&(0,u.aI)(e.viewMatrix,this.viewMatrix))}project(e,{topLeft:t=!0}={}){let i=this.projectPosition(e),r=(0,l.VJ)(i,this.pixelProjectionMatrix),[n,s]=r,o=t?s:this.height-s;return 2===e.length?[n,o]:[n,o,r[2]]}unproject(e,{topLeft:t=!0,targetZ:i}={}){let[r,n,s]=e,o=t?n:this.height-n,a=this.targetToCommonMatrix?this.targetToCommonMatrix.transformAsPoint([0,0,i||0])[2]:i&&i*this.distanceScales.unitsPerWorldUnit[2],c=(0,l.xJ)([r,o,s],this.pixelUnprojectionMatrix,a),[u,h,d]=this.unprojectPosition(c);return Number.isFinite(s)?[u,h,d]:Number.isFinite(i)?[u,h,i]:[u,h]}projectPosition(e,t={}){if(t.sourceCrs)return this._projectPositionFromCRS(e,t.sourceCrs);let i=this.distanceScales.unitsPerWorldUnit;if(this.crs){let t=this.crs.converter.WGS84.from(e);return this._projectTarget([t[0],t[1],t[2]||0])}let[r,n]=this.projectFlat(e);return[r,n,(e[2]||0)*i[2]]}unprojectPosition(e){let t=this.distanceScales.unitsPerWorldUnit;if(this.crs){let t=this.crs.converter.WGS84.to(this._unprojectCommon(e));return[t[0],t[1],t[2]||0]}let[i,r]=this.unprojectFlat(e);return[i,r,(e[2]||0)/t[2]]}projectFlat(e){if(!this.crs)return e;let t=this.crs.converter.WGS84.from(e),i=this._projectTarget([t[0],t[1],0]);return[i[0],i[1]]}unprojectFlat(e){if(!this.crs)return e;let t=this.crs.converter.WGS84.to(this._unprojectCommon([e[0],e[1],0]));return[t[0],t[1]]}getBounds(e={}){let t={targetZ:e.z||0},i=this.unproject([0,0],t),r=this.unproject([this.width,0],t),n=this.unproject([0,this.height],t),s=this.unproject([this.width,this.height],t);return[Math.min(i[0],r[0],n[0],s[0]),Math.min(i[1],r[1],n[1],s[1]),Math.max(i[0],r[0],n[0],s[0]),Math.max(i[1],r[1],n[1],s[1])]}getDistanceScales(e){if(!e)return this.distanceScales;if(this._distanceScaleSampler)return _(this._distanceScaleSampler(e));if(!this.crs)return this.distanceScales;let t=this.crs.getRenderingScale(e);if(!t)return this.distanceScales;let i=this.targetToCommonMatrix,r=t.map((e,t)=>{let r=4*t;return(i?Math.hypot(i[r],i[r+1],i[r+2]):this.distanceScales.unitsPerWorldUnit[t])/e});return _({...this.distanceScales,unitsPerMeter:r})}containsPixel({x:e,y:t,width:i=1,height:r=1}){return e<this.x+this.width&&this.x<e+i&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,(0,a.on)(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,i){return null}_projectPositionFromCRS(e,t){let i=t.signature===s.rz.signature?e:t.converter.WGS84.to(e);return this.projectPosition(i)}_projectTarget(e){return this.targetToCommonMatrix?this.targetToCommonMatrix.transformAsPoint(e,[]):e.map((e,t)=>e*this.distanceScales.unitsPerWorldUnit[t])}_unprojectCommon(e){let t=[e[0],e[1],e[2]||0];return this._commonToTargetMatrix?this._commonToTargetMatrix.transformAsPoint(t,[]):t.map((e,t)=>e/this.distanceScales.unitsPerWorldUnit[t])}_initProps(e){this.crs&&!e.distanceScales&&(this.distanceScales=this.getDistanceScales(this.crs.converter.WGS84.from(this.position)));let t=Math.pow(2,this.zoom);this.scale=t;let{position:i,modelMatrix:r}=e,n=m;i&&(n=r?new c.k(r).transformAsVector(i,[]):i),this.center=this._getCenter(e,n)}_getCenter(e,t){return this.projectPosition(t)}_initMatrices(e){let{viewMatrix:t=g,projectionMatrix:i=null,orthographic:n=!1,fovyRadians:s,fovy:o=75,near:l=.1,far:f=1e3,padding:m=null,focalDistance:_=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new c.k().multiplyRight(t).translate(new h.P(this.center).negate()),this.projectionMatrix=i||function({width:e,height:t,orthographic:i,fovyRadians:r,focalDistance:n,padding:s,near:o,far:a}){let l=e/t,h=i?new c.k().orthographic({fovy:r,aspect:l,focalDistance:n,near:o,far:a}):new c.k().perspective({fovy:r,aspect:l,near:o,far:a});if(s){let{left:i=0,right:r=0,top:n=0,bottom:o=0}=s,a=(0,u.qE)((i+e-r)/2,0,e)-e/2,l=(0,u.qE)((n+t-o)/2,0,t)-t/2;h[8]-=2*a/e,h[9]+=2*l/t}return h}({width:this.width,height:this.height,orthographic:n,fovyRadians:s||o*p,focalDistance:_,padding:m,near:l,far:f});let v=(0,a.$M)();d.lw(v,v,this.projectionMatrix),d.lw(v,v,this.viewMatrix),this.viewProjectionMatrix=v,this.viewMatrixInverse=d.B8([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=(0,a.Vl)(this.viewMatrixInverse);let y=(0,a.$M)(),b=(0,a.$M)();d.hs(y,y,[this.width/2,-this.height/2,1]),d.Tl(y,y,[1,-1,0]),d.lw(b,y,this.viewProjectionMatrix),this.pixelProjectionMatrix=b,this.pixelUnprojectionMatrix=d.B8((0,a.$M)(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||r.A.warn("Pixel project matrix not invertible")()}}v.displayName="Viewport";let y=v},15672(e,t,i){i.d(t,{C:()=>c,l:()=>o});var r=i(41401);let n=(0,r.nI)({longitude:0,latitude:0}).metersPerUnit[0],s=512*n/(2*Math.PI);function o(e,t,i=!1){let n=(0,r.nI)({longitude:e,latitude:t,highPrecision:i});return{unitsPerMeter:n.unitsPerMeter,metersPerUnit:n.metersPerUnit,unitsPerWorldUnit:n.unitsPerDegree,unitsPerMeter2:n.unitsPerMeter2||[0,0,0],unitsPerWorldUnit2:n.unitsPerDegree2||[0,0,0]}}function a(e){return(t,i)=>{let r=e(Array.from(t));if(!i)return r;for(let e=0;e<r.length;e++)i[e]=r[e];return i}}let l=e=>{let[t,i]=(0,r.iV)([e[0],512-e[1]]),{metersPerUnit:n}=(0,r.nI)({longitude:t,latitude:i});return[n[0],n[1],1]},c={signature:"OSMTile512",coordinateFrame:"projected",projection:"merc",parameters:{proj:"merc"},ellipsoid:{semiMajorAxis:s,semiMinorAxis:s},axis:"esu",xUnit:{name:"tile units",metersPerUnit:n},yUnit:{name:"tile units",metersPerUnit:n},zUnit:{name:"meters",metersPerUnit:1},lossy:!1,renderingBounds:[[0,0,0],[512,512,0]],renderingScale:l,getRenderingScale:l,converter:{WGS84:{from:a(e=>{let[t,i]=(0,r.Gw)(e);return e[0]=t,e[1]=512-i,e}),to:a(e=>{let[t,i]=(0,r.iV)([e[0],512-e[1]]);return e[0]=t,e[1]=i,e}),normalize:a(e=>{let t=e[0];return e[0]=180>=Math.abs(t)?t:((t+180)%360+360)%360-180,e[1]=Math.max(-r.aH,Math.min(r.aH,e[1])),e})}}}},69502(e,t,i){i.d(t,{A:()=>p});var r=i(47345),n=i(60275),s=i(15672),o=i(41401),a=i(28483),l=i(21154),c=i(49105),u=i(94022),h=i(78861),d=i(43796);class f extends r.A{constructor(e={}){let t=f._getViewportOptions(e);super(t),this.latitude=t.latitude??0,this.longitude=t.longitude??0,this.zoom=t.zoom??0,this.pitch=t.pitch??0,this.bearing=t.bearing??0,this.altitude=t.altitude??1.5,this.fovy=t.fovy??75,this.orthographic=t.orthographic??!1,this._subViewports=t.repeat?[]:null,this._pseudoMeters=t.legacyMeterSizes??!1,Object.freeze(this)}static _getViewportOptions(e){let t,{latitude:i=0,longitude:r=0,zoom:n=0,pitch:a=0,bearing:l=0,nearZMultiplier:h=.1,farZMultiplier:d=1.01,nearZ:f,farZ:p,orthographic:g=!1,projectionMatrix:m,worldOffset:_=0,position:v,padding:y}=e,{width:b,height:w,altitude:E=1.5}=e,P=Math.pow(2,n);b=b||1,w=w||1;let x=null;if(m)E=m[5]/2,t=(0,o.Os)(E);else{let r;if(e.fovy?(t=e.fovy,E=(0,o.wZ)(t)):t=(0,o.Os)(E),y){let{top:e=0,bottom:t=0}=y;r=[0,(0,c.qE)((e+w-t)/2,0,w)-w/2]}x=(0,o.om)({width:b,height:w,scale:P,center:v&&[0,0,v[2]*(0,o.mY)(i)],offset:r,pitch:a,fovy:t,nearZMultiplier:h,farZMultiplier:d}),Number.isFinite(f)&&(x.near=f),Number.isFinite(p)&&(x.far=p)}let S=(0,o.rY)({height:w,pitch:a,bearing:l,scale:P,altitude:E});_&&(S=new u.k().translate([512*_,0,0]).multiplyLeft(S));let T=Number.isFinite(r)&&Number.isFinite(i);return{...e,crs:T?s.C:void 0,distanceScales:T?(0,s.l)(r,i):void 0,width:b,height:w,viewMatrix:S,longitude:r,latitude:i,zoom:n,...x,fovy:t,focalDistance:E,altitude:E,orthographic:g}}_getCenter(e,t){return this.crs?new h.P(t).scale(this.distanceScales.unitsPerMeter).add(this.projectPosition([e.longitude??0,e.latitude??0,0])):super._getCenter(e,t)}get projectionMode(){return this.crs?this.zoom<12?n.K.WEB_MERCATOR:n.K.WEB_MERCATOR_AUTO_OFFSET:n.K.IDENTITY}projectFlat(e){if(!this.crs)return e;let t=(0,o.Gw)(e);return t[1]=(0,c.qE)(t[1],-318,830),t}unprojectFlat(e){return this.crs?(0,o.iV)(e):e}getDistanceScales(e){return e&&this.crs?(0,s.l)(e[0],e[1],!0):this.distanceScales}get subViewports(){if(this._subViewports&&!this._subViewports.length){let e=this.getBounds(),t=Math.floor((e[0]+180)/360),i=Math.ceil((e[2]-180)/360);for(let e=t;e<=i;e++){let t=e?new f({...this,worldOffset:e}):this;this._subViewports.push(t)}}return this._subViewports}equals(e){return e instanceof f&&e._pseudoMeters===this._pseudoMeters&&super.equals(e)}projectPosition(e,t={}){if(t.sourceCrs)return this._projectPositionFromCRS(e,t.sourceCrs);if(this._pseudoMeters){let[t,i]=this.projectFlat(e);return[t,i,(e[2]||0)*this.distanceScales.unitsPerWorldUnit[2]]}let[i,r]=this.projectFlat(e);return[i,r,(e[2]||0)*(0,o.mY)(e[1])]}unprojectPosition(e){if(this._pseudoMeters){let[t,i]=this.unprojectFlat(e);return[t,i,(e[2]||0)/this.distanceScales.unitsPerWorldUnit[2]]}let[t,i]=this.unprojectFlat(e),r=(e[2]||0)/(0,o.mY)(i);return[t,i,r]}addMetersToLngLat(e,t){return(0,o.dT)(e,t)}panByPosition(e,t,i){let r=(0,o.xJ)(t,this.pixelUnprojectionMatrix),n=this.projectFlat(e),s=d.WQ([],n,d.ze([],r)),a=d.WQ([],this.center,s),[l,c]=this.unprojectFlat(a);return{longitude:l,latitude:c}}panByPosition3D(e,t){let i=e[2]||0,r=d.jb([],e,this.unproject(t,{targetZ:i}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=(0,a.g)(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(e,t={}){let{width:i,height:r}=this,{longitude:n,latitude:s,zoom:o}=(0,l.F)({width:i,height:r,bounds:e,...t});return new f({width:i,height:r,longitude:n,latitude:s,zoom:o})}}f.displayName="WebMercatorViewport";let p=f},45800(e,t,i){i.d(t,{A:()=>a});var r=i(12041),n=i(69502),s=i(97564);class o extends r.A{constructor(e={}){super(e)}getViewportType(){return n.A}get ControllerType(){return s.A}}o.displayName="MapView";let a=o},12041(e,t,i){i.d(t,{A:()=>s});var r=i(33945),n=i(7914);class s{constructor(e){let{id:t,x:i=0,y:n=0,width:s="100%",height:o="100%",padding:a=null}=e;this.id=t||this.constructor.displayName||"view",this.props={...e,id:this.id},this._x=(0,r.rk)(i),this._y=(0,r.rk)(n),this._width=(0,r.rk)(s),this._height=(0,r.rk)(o),this._padding=a&&{left:(0,r.rk)(a.left||0),right:(0,r.rk)(a.right||0),top:(0,r.rk)(a.top||0),bottom:(0,r.rk)(a.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}initialize(){}equals(e){return this===e||this.constructor===e.constructor&&(0,n.b)(this.props,e.props,2)}clone(e){return new this.constructor({...this.props,...e})}makeViewport({width:e,height:t,viewState:i}){i=this.filterViewState(i);let r=this.getDimensions({width:e,height:t});return r.height&&r.width?new(this.getViewportType(i))({...i,...this.props,...r}):null}getViewStateId(){let{viewState:e}=this.props;return"string"==typeof e?e:e?.id||this.id}filterViewState(e){if(this.props.viewState&&"object"==typeof this.props.viewState){if(!this.props.viewState.id)return this.props.viewState;var t=this.props.viewState;let i={...e};for(let e in t)"id"!==e&&(Array.isArray(i[e])&&Array.isArray(t[e])?i[e]=function(e,t){e=e.slice();for(let i=0;i<t.length;i++){let r=t[i];Number.isFinite(r)&&(e[i]=r)}return e}(i[e],t[e]):i[e]=t[e]);return i}return e}getDimensions({width:e,height:t}){let i={x:(0,r.E9)(this._x,e),y:(0,r.E9)(this._y,t),width:(0,r.E9)(this._width,e),height:(0,r.E9)(this._height,t)};return this._padding&&(i.padding={left:(0,r.E9)(this._padding.left,e),top:(0,r.E9)(this._padding.top,t),right:(0,r.E9)(this._padding.right,e),bottom:(0,r.E9)(this._padding.bottom,t)}),i}get controller(){let e=this.props.controller;return e?!0===e?{type:this.ControllerType}:"function"==typeof e?{type:e}:{type:this.ControllerType,...e}:null}}},6053(e,t,i){function r(e){if(!e||"projected"!==e.coordinateFrame&&"geocentric"!==e.coordinateFrame)return null;let t=e.xUnit.metersPerUnit,i=e.yUnit.metersPerUnit,r=e.zUnit.metersPerUnit;return"number"!=typeof t||!Number.isFinite(t)||t<=0||"number"!=typeof i||!Number.isFinite(i)||i<=0||"number"!=typeof r||!Number.isFinite(r)||r<=0?null:[t,i,r]}function n({data:e,getIndex:t,dataRange:i,replace:r}){let{startRow:s=0,endRow:o=1/0}=i,a=e.length,l=a,c=a;for(let i=0;i<a;i++){let r=t(e[i]);if(l>i&&r>=s&&(l=i),r>=o){c=i;break}}let u=l,h=c-l!==r.length?e.slice(c):void 0;for(let t=0;t<r.length;t++)e[u++]=r[t];if(h){for(let t=0;t<h.length;t++)e[u++]=h[t];e.length=u}return{startRow:l,endRow:l+r.length}}i.d(t,{A:()=>r,J:()=>n})},37920(e,t,i){i.d(t,{l:()=>u});var r=i(33631);async function*n(e,t){let i=t?.chunkSize||1048576,r=0;for(;r<e.size;){let t=r+i,n=await e.slice(r,t).arrayBuffer();r=t,yield n}}var s=i(40818);function o(e,t){return s.Bd?a(e,t):l(e,t)}async function*a(e,t){let i,n=e.getReader(),s=!1,o=!1,a=!1;try{for(;;){let e,a=i||n.read();i=void 0;try{e=await a}catch(e){throw o=!0,e}let{done:l,value:c}=e;if(l){s=!0;return}t?._streamReadAhead&&(i=n.read()).catch(()=>{}),yield(0,r.XA)(c)}}catch(e){throw a=!0,e}finally{let e,t=!1;if(!s&&!o)try{await n.cancel()}catch(i){t=!0,e=i}try{n.releaseLock()}catch(i){t||(t=!0,e=i)}if(!a&&t)throw e}}async function*l(e,t){for await(let t of e)yield(0,r.XA)(t)}var c=i(20903);function u(e,t){if("string"==typeof e)return function*(e,t){let i=t?.chunkSize||262144,n=0,s=new TextEncoder;for(;n<e.length;){let t=Math.min(e.length-n,i),o=e.slice(n,n+t);n+=t,yield(0,r.W$)(s.encode(o))}}(e,t);if(e instanceof ArrayBuffer)return function*(e,t={}){let{chunkSize:i=262144}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,i),n=new ArrayBuffer(t),s=new Uint8Array(e,r,t);new Uint8Array(n).set(s),r+=t,yield n}}(e,t);if((0,c.qf)(e))return n(e,t);if((0,c.H1)(e))return o(e,t);if((0,c.Sv)(e)){let i=e.body;if(!i)throw Error("Readable stream not available on Response");return o(i,t)}throw Error("makeIterator")}},44681(e,t,i){i.d(t,{k:()=>u});var r=i(76522),n=i(89664),s=i(67075),o=i(17434),a=i(54707),l=i(327),c=i(96458);let u=Object.freeze({fetchFile:r.t2,parse:n.q,parseFile:s.C,parseSync:o.n,parseInBatches:a.L,load:l.H,loadInBatches:c.m})},96458(e,t,i){i.d(t,{m:()=>u});var r=i(66290),n=i(90405),s=i(73968),o=i(8480),a=i(54707),l=i(1351),c=i(63379);function u(e,t,i,r){let s;return(Array.isArray(t)||(0,n.l)(t)?s=t:(i=t,s=void 0),Array.isArray(e))?e.map(e=>h(e,s,i||{})):h(e,s,i||{})}async function h(e,t,i){if("string"==typeof e){let n=await (0,l.M)(e,t,{...i,core:{...i.core,nothrow:!0}}),u=n&&!n.getAuthentications&&i.core?.credentials?.length?await (0,c._T)(n,i,e):n;i=await (0,r.M8)(u,e,i);let h=(0,s.z)(i),d=await h((0,o.b3)(e,i));return Array.isArray(t),await (0,a.L)(d,t,i)}return Array.isArray(t),await (0,a.L)(e,t,i)}},63379(e,t,i){i.d(t,{$P:()=>l,Mf:()=>g,_T:()=>o,pi:()=>a});var r=i(51925);let n=new Map,s=new Map;async function o(e,t,i){if(l(e)||!e.preload&&e.createDataSourceSync)return e;let r=u(e,t),o=s.get(e)?.get(r);if(o)return o;let a=n.get(e);a||(a=new Map,n.set(e,a));let h=a.get(r);return h||(h=c(e,t,i).then(t=>{let i=s.get(e);return i||(i=new Map,s.set(e,i)),i.set(r,t),t}).catch(t=>{throw a.delete(r),0===a.size&&n.delete(e),t}),a.set(r,h)),await h}function a(e,t){if(e.subloaders&&!d.has(e)){let t=f.get(e);if(t)return t;if(!l(e))return null}if(l(e)||!e.preload&&e.createDataSourceSync)return e;let i=u(e,t);return s.get(e)?.get(i)||null}function l(e){return!!(e.parse||e.parseBlob||e.parseUrl||e.parseSync||e.parseInBatches||e.parseText||e.parseTextSync||e.parseFile||e.parseFileInBatches)}async function c(e,t,i){if(e.preload){let r=await e.preload(i||"",t);if(r&&(l(r)||r.createDataSourceSync))return r;throw Error(`${e.id} loader preload() did not return a parser-bearing loader or a source factory`)}let r=function(e,t){if("test"===(t?._workerType||t?.core?._workerType)){let t=`modules/${e.module}/src/${e.id}-loader.ts`;return"u">typeof window?`/${t}`:"u">typeof process&&process.cwd?new URL(t,`file://${process.cwd()}/`).toString():t}throw Error(`${e.id} loader does not provide a parser implementation. Import a parser-bearing loader directly, or use preload() before parse/load.`)}(e,t);return await h(r,e.id)}function u(e,t){let i=t?.[e.id],r=e.options?.[e.id];return String(i?.backend||r?.backend||"")}async function h(e,t){for(let i of Object.values(await import(e)))if(i&&"object"==typeof i&&i.id===t&&l(i))return i;throw Error(`Could not find parser implementation for ${t} in ${e}`)}let d=new WeakSet,f=new WeakMap,p=new WeakMap;async function g(e,t,i){var r,n;return d.has(e)?await o(e,t,i):(r=e,n=t,!function e(t,i){if(i.includes(t))throw Error(`Subloader cycle: ${[...i,t].map(e=>e.id).join(" -> ")}`);for(let r of Object.values(_(t,n)))e(r,[...i,t])}(r,[]),await m(e,t,i))}async function m(e,t,i){if(!t){let t=p.get(e);if(t)return await t}let r=v(e,t,i);t||(p.set(e,r),r.catch(()=>p.delete(e)));let n=await r;return t||f.set(e,n),n}function _(e,t){let i=t?.core?.subloaders||{};return Object.fromEntries(Object.entries(e.subloaders||{}).map(([e,t])=>[e,Object.hasOwn(i,e)?i[e]:t]))}async function v(e,t,i){let[n,s]=await Promise.all([o(e,t,i),Promise.all(Object.entries(_(e,t)).map(async([e,r])=>[e,await m(r,t,i)]))]),a=Object.fromEntries(s),l=(0,r.l)(n.options,t||{});l.core={...l.core,worker:!1};let c={...n,options:l,subloaders:a};for(let i of(delete c.preload,c.worker=!1,["parseBlob","createDataSourceSync","parse","parseSync","parseText","parseTextSync","parseInBatches","parseFile","parseFileInBatches","parseUrl"])){let s=n[i];"function"==typeof s&&(c[i]=(i,o,l)=>{let c=(0,r.l)(t,o||{});return s.call(n,i,{...c,core:{...c.core,subloaders:t?.core?.subloaders||o?.core?.subloaders,worker:!1},[e.id]:{...c[e.id],subloaders:a}},l)})}return d.add(c),c}},327(e,t,i){i.d(t,{H:()=>d});var r=i(20903),n=i(66290),s=i(90405),o=i(75583),a=i(73968),l=i(8480),c=i(89664),u=i(1351),h=i(63379);async function d(e,t,i,d){let f,p;if(Array.isArray(t)||(0,s.l)(t)?(f=t,p=i):(f=[],p=t,d=void 0),p||=(0,l.pp)(),"string"==typeof e||(0,r.qf)(e)){let t=await (0,u.M)(e,f,{...p,core:{...p?.core,nothrow:!0}});if(t&&"string"==typeof e){let i=await (0,h._T)(t,p,e);if(i.createDataSourceSync&&!(0,h.$P)(i))throw Error(`${t.id} creates sources. Use createDataSource() instead of load().`);p=await (0,n.M8)(t.getAuthentications?t:i,e,p||{});let{parseUrl:r}=i;if(r){let i=(0,l.b3)(e,p),n=(0,o.FO)(t,(0,l.a5)(p,t,[t],e)),s=await r(i,n||p,d);return n?(0,o.B_)(s):s}}}p&&(p=(0,n.Bv)(p));let g=(0,a.z)(p),m=e;if("string"==typeof e&&(m=await g((0,l.b3)(e,p))),(0,r.qf)(e)&&(m=await g(e)),"string"==typeof e){let t=(0,l.Rf)(p||{});t.core?.baseUrl||(p={...p,core:{...p?.core,baseUrl:e}})}return Array.isArray(f),await (0,c.q)(m,f,p,d)}},67075(e,t,i){i.d(t,{C:()=>f});var r=i(75583),n=i(66290),s=i(51925),o=i(27912),a=i(90405),l=i(8480),c=i(32429),u=i(63379),h=i(89664),d=i(1351);async function f(e,t,i,s){!t||Array.isArray(t)||(0,a.l)(t)||(s=void 0,i=t,t=void 0),i=i||{},(i.signal||s?.signal)?.throwIfAborted();let o=e.url||"",f=t,g=(0,c.i)(f,s),m=await (0,d.M)(o,g,i);if(!m)return null;let _=(0,l.a5)(i,m,g,o),v=!m.getAuthentications&&_.core?.credentials?.length?await (0,u._T)(m,_,o||s?.url):m,y=await (0,n.M8)(v,o,_),b=(0,r.FO)(m,y,!1);s=(0,c.l)({url:o,_parse:h.q,loaders:g},b||y,s||null);let w=await p(m,e,b||y,s);return b?(0,r.B_)(w):w}async function p(e,t,i,r){(i.signal||r.signal)?.throwIfAborted(),(0,o.z)(e),i=(0,s.l)(e.options,i);let n=await (0,u._T)(e,i,r.url);if(n.parseFile){let e=n.prepareParseOutput?.(i),s=await n.parseFile(t,e?.options??i,r);return e?e.convert(s):s}if(n.parse){let s=t.bigsize>0n?Number(t.bigsize):t.size;if(!s)throw Error(`${e.id} loader - cannot fall back to parse without a file size`);let o=await t.read(0n,s);return await (0,h.q)(o,n,i,r)}if(n.createDataSourceSync)throw Error(`${e.id} has no file parser. Use createDataSource() to open a source.`);throw Error(`${e.id} loader - no file parser found`)}},54707(e,t,i){i.d(t,{L:()=>g});var r=i(75583),n=i(66290),s=i(86964),o=i(42080),a=i(90405),l=i(8480),c=i(32429),u=i(1035),h=i(72548),d=i(63379),f=i(1351),p=i(89664);async function g(e,t,i,s){let o=Array.isArray(t)?t:void 0;Array.isArray(t)||(0,a.l)(t)||(s=void 0,i=t,t=void 0),(i?.signal||s?.signal)?.throwIfAborted(),e=await e,i=i||{},(i.signal||s?.signal)?.throwIfAborted();let u=(0,h.Al)(e),_=await (0,f.M)(e,t,i);if(!_)return[];let v=(0,l.a5)(i,_,o,u),y=!_.getAuthentications&&v.core?.credentials?.length?await (0,d._T)(_,v,u||s?.url):_,b=await (0,n.M8)(y,u||"",v),w=(0,r.FO)(_,b,!0);s=(0,c.l)({url:u,_parseInBatches:g,_parse:p.q,loaders:o},w||b,s||null);let E=await (0,d._T)(_,b,s.url),P=await m(_,E,e,w||b,s);return w?(0,r.Nw)(P):P}async function m(e,t,i,r,n){let s=t.parseInBatches?t.prepareParseBatchOutput?.(r):null,o=await v(t,i,s?.options??r,n),a=s?_(o,s.convert):o;if(!r?.core?.metadata)return a;let l={shape:"metadata",batchType:"metadata",metadata:{_loader:e,_context:n},data:[],bytesUsed:0};return async function*(e){yield l,yield*e}(a)}async function*_(e,t){for await(let i of e)yield t(i)}async function v(e,t,i,r){let n=await (0,u.re)(t,i),o=await b(n,i?.core?.transforms||[]);return e.parseInBatches?(0,s.ZT)(e,i)?(0,s.FR)(e,o,i,r,p.q):e.parseInBatches(o,i,r):y(o,e,i,r)}async function*y(e,t,i,r){var n,s;let a,l=await (0,o.cy)(e),c=(n=await (0,p.q)(l,t,{...i,core:{...i?.core,mimeType:t.mimeTypes[0]}},r),s=t,(a=!function(e){if(!e||"object"!=typeof e||!("shape"in e))return!1;switch(e.shape){case"array-row-table":case"object-row-table":return Array.isArray(e.data);case"geojson-table":return Array.isArray(e.features);case"columnar-table":return!!(e.data&&"object"==typeof e.data);case"arrow-table":return!!(e.data&&"object"==typeof e.data&&"numRows"in e.data);default:return!1}}(n)?{shape:"unknown",batchType:"data",data:n,length:Array.isArray(n)?n.length:1}:{...n,length:function(e){switch(e.shape){case"array-row-table":case"object-row-table":return e.data.length;case"geojson-table":return e.features.length;case"arrow-table":return e.data.numRows;case"columnar-table":for(let t of Object.values(e.data))return t.length||0;return 0}}(n),batchType:"data"}).mimeType=s.mimeTypes[0],a);yield c}async function b(e,t=[]){let i=e;for await(let e of t)i=e(i);return i}},17434(e,t,i){i.d(t,{n:()=>h});var r=i(75583),n=i(1351),s=i(90405),o=i(8480),a=i(1035),l=i(32429),c=i(72548),u=i(63379);function h(e,t,i,h){Array.isArray(t)||(0,s.l)(t)||(h=void 0,i=t,t=void 0),i=i||{};let d=t,f=(0,l.i)(d,h),p=(0,n.p)(e,f,i);if(!p)return null;let g=(0,o.a5)(i,p,f),m=(0,c.Al)(e),_=()=>{throw Error("parseSync called parse (which is async")},v=(0,r.FO)(p,g,!1);h=(0,l.l)({url:m,_parseSync:_,_parse:_,loaders:t},v||g,h||null);let y=function(e,t,i,r){if(t=(0,a.lG)(t,e,i),e.parseTextSync&&"string"==typeof t)return e.parseTextSync(t,i);if(e.parseSync&&t instanceof ArrayBuffer)return e.parseSync(t,i,r);if(e.preload)throw Error(`${e.name} loader: 'parseSync' requires a parser-bearing loader. Import the loader implementation directly, or call preload(loader) before parseSync(). ${r.url||""}`);if(e.createDataSourceSync)throw Error(`${e.id} has no synchronous parser. Use createDataSource() to open a source.`);throw Error(`${e.name} loader: 'parseSync' not supported by this loader, use 'parse' instead. ${r.url||""}`)}((0,u.pi)(p)||p,e,v||g,h);return v?(0,r.B_)(y):y}},89664(e,t,i){i.d(t,{q:()=>m});var r=i(75583),n=i(66290),s=i(51925),o=i(20903),a=i(86964),l=i(27912),c=i(90405),u=i(8480),h=i(1035),d=i(32429),f=i(72548),p=i(63379),g=i(1351);async function m(e,t,i,s){!t||Array.isArray(t)||(0,c.l)(t)||(s=void 0,i=t,t=void 0),(i?.signal||s?.signal)?.throwIfAborted(),e=await e,i=i||{},(i.signal||s?.signal)?.throwIfAborted();let o=(0,f.Al)(e),a=t,l=(0,d.i)(a,s),h=await (0,g.M)(e,l,i);if(!h)return null;let v=(0,u.a5)(i,h,l,o),y=!h.getAuthentications&&v.core?.credentials?.length?await (0,p._T)(h,v,o||s?.url):h,b=await (0,n.M8)(y,o||"",v),w=(0,r.FO)(h,b,!1);s=(0,d.l)({url:o,_parse:m,loaders:l},w||b,s||null);let E=await _(h,e,w||b,s);return w?(0,r.B_)(E):E}async function _(e,t,i,r){let n;if((i.signal||r.signal)?.throwIfAborted(),(0,l.z)(e),i=(0,s.l)(e.options,i),(0,o.Sv)(t)){let{ok:e,redirected:i,status:n,statusText:s,type:o,url:a}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:i,status:n,statusText:s,type:o,url:a}}let c=await (0,p._T)(e,i,r.url);if(c.createDataSourceSync&&!(0,p.$P)(c))throw Error(`${e.id} creates sources. Use createDataSource() to open a source.`);let u=c.prepareParseOutput?.(i),d=u?.options??i;return(0,a.L6)(c,t,d,r,e)?(t=await (0,h.Ct)(t,d),n=await (0,a.gm)(c,t,d,r,m)):(0,o.qf)(t)&&c.parseBlob?n=await c.parseBlob(t,d,r):(t=await (0,h.O1)(t,e,d),n=await v(c,t,d,r)),u?u.convert(n):n}async function v(e,t,i,r){if(e.parseText&&"string"==typeof t)return await e.parseText(t,i,r);if(e.parseTextSync&&"string"==typeof t)return e.parseTextSync(t,i,r);if(e.parse)return await e.parse(t,i,r);if(e.parseSync)throw Error(`${e.name} loader: 'parse' not available on parser-bearing sync loader. Add an async 'parse' function to this loader, or call preload(loader) before parseSync(). ${r.url||""}`);if(e.createDataSourceSync)throw Error(`${e.id} creates sources. Use createDataSource() to open a source.`);throw Error(`${e.id} loader - no parser found and worker is disabled`)}},5223(e,t,i){i.d(t,{Ph:()=>a,mk:()=>o,wx:()=>l});var r=i(90405),n=i(8480);let s=()=>{let e=(0,n.K2)();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function o(e){let t=s();for(let i of e=Array.isArray(e)?e:[e]){let e=(0,r.D)(i);t.find(t=>e===t)||t.unshift(e)}}function a(){return s()}function l(){(0,n.K2)().loaderRegistry=[]}},1351(e,t,i){i.d(t,{M:()=>m,p:()=>_});var r=i(20903),n=i(5969),s=i(18553),o=i(58345),a=i(26358),l=i(33631),c=i(90405),u=i(8480),h=i(72548),d=i(42221),f=i(5223),p=i(28071);let g=/\.([^.]+)$/;async function m(e,t=[],i,n,s="parse"){var o;let a,l;if(!y(e))return null;let d=(0,u.Rf)(i||{});if(d.core||={},t&&!Array.isArray(t))return(0,c.D)(t);let p=e instanceof Response&&(o=e,(l=(0,h.z4)(o))&&(l.startsWith("text/")||"application/json"===l||l.endsWith("+json")))?await e.clone().text():null;async function g(t){w(t);let i=null!==p&&v(p,t,d,n,s)||v(e,t,d,n,s);return!i&&(0,r.qf)(e)&&t.length?v(a??=await e.slice(0,10).arrayBuffer(),t,d,n,s):i}let _=await g(t||[]);if(_||d.core.ignoreRegisteredLoaders||(_=await g((0,f.Ph)())),!_&&!d.core.nothrow)throw Error(b(e));return _}function _(e,t=[],i,r,n="parse"){if(!y(e))return null;let s=(0,u.Rf)(i||{});if(s.core||={},t&&!Array.isArray(t))return(0,c.D)(t);let o=t||[];w(o);let a=v(e,o,s,r,n);if(a||s.core.ignoreRegisteredLoaders||(a=v(e,(0,f.Ph)(),s,r,n)),!a&&!s.core.nothrow)throw Error(b(e));return a}function v(e,t,i,o,a="parse"){var l,c;let u,d,f=(0,h.Al)(e),m=(0,h.z4)(e),_=(0,p.S3)(f)||o?.url,y=null,b="",w=i?.core&&"type"in i.core?i.core.type:void 0;w&&"auto"!==w&&(b=(y=function(e,t){for(let i of e)if((0,n.p)(i)&&i.type===t)return i;return null}(t,w))?`match forced by supplied source type ${w}`:""),i?.core?.mimeType&&(y=P(t,i?.core?.mimeType),b=`match forced by supplied MIME type ${i?.core?.mimeType}`),y||"source"!==a||(b=(y=E(t,_))?`matched source url ${_}`:"");let T="source"===a&&_?t.filter(e=>!(0,n.p)(e)):t;return y=y||(l=T,(d=(u=(c=_)&&g.exec(c))&&u[1])?function(e,t){for(let i of(t=t.toLowerCase(),e))for(let e of i.extensions)if(e.toLowerCase()===t)return i;return null}(l,d):null),b=b||(y?`matched url ${_}`:""),y||"parse"!==a||(b=(y=E(t,_))?`matched source url ${_}`:""),y=y||P(T,m),b=b||(y?`matched MIME type ${m}`:""),y=y||function(e,t){if(!t)return null;for(let i of e)if("string"==typeof t){if(function(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}(t,i))return i}else if(ArrayBuffer.isView(t)){if(x(t.buffer,t.byteOffset,i))return i}else if(t instanceof ArrayBuffer&&x(t,0,i))return i;return null}(T,e),b=b||(y?`matched initial data ${S(e)}`:""),!y&&(0,r.qf)(e)&&(y=function(e,t){for(let i of e)if((0,n.p)(i)&&i.testData?.(t))return i;return null}(t,e),b=b||(y?"matched source testData":"")),i?.core?.fallbackMimeType&&(y=y||P(T,i?.core?.fallbackMimeType),b=b||(y?`matched fallback MIME type ${m}`:"")),b&&s.Rm.log(1,`selectLoader selected ${y?.name}: ${b}.`),y}function y(e){return!(e instanceof Response)||204!==e.status}function b(e){let t=(0,h.Al)(e),i=(0,h.z4)(e),r="No valid loader found (";r+=(t?`${o.iW(t)}, `:"no url provided, ")+`MIME type: ${i?`"${i}"`:"not provided"}, `;let n=e?S(e):"";return r+((n?` first bytes: "${n}"`:"first bytes: not available")+")")}function w(e){for(let t of e)(0,c.D)(t)}function E(e,t){if(!t)return null;for(let i of e)if((0,n.p)(i)&&i.testURL(t))return i;return null}function P(e,t){for(let i of e)if(i.mimeTypes?.some(e=>(0,d.JQ)(t,e))||(0,d.JQ)(t,`application/x.${i.id}`))return i;return null}function x(e,t,i){return(Array.isArray(i.tests)?i.tests:[i.tests]).some(i=>(function(e,t,i){if((0,r.B1)(i))return(0,a.YV)(i,e,i.byteLength);switch(typeof i){case"function":return i((0,l.W$)(e));case"string":let n=T(e,t,i.length);return i===n;default:return!1}})(e,t,i))}function S(e,t=5){return"string"==typeof e?e.slice(0,t):ArrayBuffer.isView(e)?T(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?T(e,0,t):""}function T(e,t,i){if(e.byteLength<t+i)return"";let r=new DataView(e),n="";for(let e=0;e<i;e++)n+=String.fromCharCode(r.getUint8(t+e));return n}},41708(e,t,i){i.d(t,{f:()=>r});class r extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response}},76522(e,t,i){i.d(t,{t2:()=>s});var r=i(92537),n=i(41312);async function s(e,t){if("string"==typeof e){var i;let n=(0,r.o1)(e);return!((i=n).startsWith("http:")||i.startsWith("https:"))&&!n.startsWith("data:")&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await (0,n.wv)(e)}},1035(e,t,i){i.d(t,{Ct:()=>h,O1:()=>u,lG:()=>c,re:()=>d});var r=i(33631),n=i(20903),s=i(42080),o=i(37920),a=i(41312);let l="Cannot convert supplied data type";function c(e,t,i){if(t.text&&"string"==typeof e)return e;if((0,r.Pe)(e)&&(e=e.buffer),(0,n.B1)(e)){let i=(0,r.Q_)(e);return t.text&&!t.binary?new TextDecoder("utf8").decode(i):(0,r.XA)(i)}throw Error(l)}async function u(e,t,i){if("string"==typeof e||(0,n.B1)(e))return c(e,t,i);if((0,n.qf)(e)&&(e=await (0,a.wv)(e)),(0,n.Sv)(e))return await (0,a.Mz)(e),t.binary?await e.arrayBuffer():await e.text();if((0,n.H1)(e)&&(e=(0,o.l)(e,i)),(0,n.xZ)(e)||(0,n.Td)(e))return(0,s.cy)(e);throw Error(l)}async function h(e,t){if("string"==typeof e)return new TextEncoder().encode(e).buffer;if((0,n.B1)(e))return(0,r.XA)((0,r.Q_)(e));if((0,n.qf)(e)&&(e=await (0,a.wv)(e)),(0,n.Sv)(e))return await (0,a.Mz)(e),await e.arrayBuffer();if((0,n.H1)(e)&&(e=(0,o.l)(e,t)),(0,n.xZ)(e)||(0,n.Td)(e))return(0,s.cy)(e);throw Error(l)}async function d(e,t){if((0,n.yL)(e)&&(e=await e),(0,n.Vv)(e))return e;if((0,n.Sv)(e)){await (0,a.Mz)(e);let i=await e.body;if(!i)throw Error(l);return(0,o.l)(i,t)}return(0,n.qf)(e)||(0,n.H1)(e)?(0,o.l)(e,t):(0,n.Td)(e)||(0,n.xZ)(e)?e:function(e){if(ArrayBuffer.isView(e)||(0,n.B1)(e))return function*(){yield(0,r.XA)(e)}();if((0,n.Vv)(e))return e;if((0,n.xZ)(e))return e[Symbol.iterator]();throw Error(l)}(e)}},73968(e,t,i){i.d(t,{z:()=>a});var r=i(20903),n=i(42),s=i(76522),o=i(8480);function a(e,t){let i,a=(0,o.pp)(),l=e||a,c=l.fetch??l.core?.fetch;i="function"==typeof c?c:(0,r.Gv)(c)?t?.fetch||s.t2:t?.fetch?t.fetch:s.t2;let u=l.signal||t?.signal,h=(0,r.Gv)(c)?c:void 0;return(0,n.Wm)({fetch:i,credentials:l.core?.credentials||[],authentications:l.core?.authentications,fetchOptions:u?{...h,signal:u}:h})}},32429(e,t,i){i.d(t,{i:()=>l,l:()=>a});var r=i(73968),n=i(28071),s=i(58345),o=i(44681);function a(e,t,i){if(i)return{...i,signal:t.signal||i.signal,reportProgress:t.onProgress||i.reportProgress,coreApi:i.coreApi||e.coreApi||o.k,_parse:i._parse||e._parse,fetch:(0,r.z)(t,i)};let a={...e,signal:t.signal||e.signal,reportProgress:t.onProgress||e.reportProgress,fetch:(0,r.z)(t,e),coreApi:e.coreApi||o.k};if(a.url){let e=(0,n.S3)(a.url);a.baseUrl=e,a.queryString=(0,n.by)(a.url),a.filename=s.iW(e),a.baseUrl=s.pD(e)}return Array.isArray(a.loaders)||(a.loaders=null),a}function l(e,t){let i;if(e&&!Array.isArray(e))return e;if(e&&(i=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];i=i?[...i,...e]:e}return i&&i.length?i:void 0}},75583(e,t,i){function r(e){let t=Object.keys(e.options||{}).filter(t=>{let i=e.options?.[t];return"core"!==t&&i&&"object"==typeof i&&"shape"in i});return t.includes(e.id)?e.id:1===t.length?t[0]:void 0}function n(e,t,i=!1){let s=r(e),o=s&&t[s];if(!o||"object"!=typeof o||!("shape"in o)||"arrow"!==o.shape)return null;if(i&&t.core?.metadata)throw Error('shape: "arrow" does not support core.metadata; use "arrow-table" for batch metadata');return{...t,core:{...t.core,...t.core?.shape==="arrow"?{shape:"arrow-table"}:{}},[s]:{...o,shape:"arrow-table"}}}function s(e){if(e?.shape!=="arrow-table"||!e.data||!Array.isArray(e.data.batches))throw Error('shape: "arrow" requires a loader that supports "arrow-table" output');return e.data}async function*o(e){for await(let t of e){let e=t?.batchType;"metadata"!==e&&"partial-result"!==e&&"final-result"!==e&&(yield*s(t).batches)}}i.d(t,{B_:()=>s,FO:()=>n,Nw:()=>o,g3:()=>r})},90405(e,t,i){i.d(t,{D:()=>s,l:()=>n});var r=i(85638);function n(e){return!!e&&(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions))}function s(e){let t;return(0,r.v)(e,"null loader"),(0,r.v)(n(e),"invalid loader"),Array.isArray(e)&&(t=e[1],e={...e=e[0],options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}},8480(e,t,i){i.d(t,{a5:()=>_,Rf:()=>v,K2:()=>p,ih:()=>m,b3:()=>f,pp:()=>g});var r=i(13601),n=i(20903),s=i(18553),o=i(58345),a=i(40818);let l={searchParams:void 0,core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,shape:void 0,log:s.Rm,useLocalLibraries:!1,subloaders:void 0,CDN:"https://unpkg.com/@loaders.gl",worker:!0,workerThreshold:.1,workerInBatches:void 0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:a.Bd,_nodeWorkers:!1,_workerType:"",limit:0,_limitMB:0,batchSize:"auto",batchDebounceMs:0,metadata:!1,transforms:[]}},c={baseUri:"core.baseUrl",fetch:"core.fetch",mimeType:"core.mimeType",fallbackMimeType:"core.fallbackMimeType",ignoreRegisteredLoaders:"core.ignoreRegisteredLoaders",nothrow:"core.nothrow",log:"core.log",useLocalLibraries:"core.useLocalLibraries",CDN:"core.CDN",worker:"core.worker",maxConcurrency:"core.maxConcurrency",maxMobileConcurrency:"core.maxMobileConcurrency",reuseWorkers:"core.reuseWorkers",_nodeWorkers:"core.nodeWorkers",_workerType:"core._workerType",_worker:"core._workerType",limit:"core.limit",_limitMB:"core._limitMB",shape:"core.shape",batchSize:"core.batchSize",batchDebounceMs:"core.batchDebounceMs",metadata:"core.metadata",transforms:"core.transforms",throws:"nothrow",dataType:"(no longer used)",uri:"core.baseUrl",method:"core.fetch.method",headers:"core.fetch.headers",body:"core.fetch.body",mode:"core.fetch.mode",credentials:"core.fetch.credentials",cache:"core.fetch.cache",redirect:"core.fetch.redirect",referrer:"core.fetch.referrer",referrerPolicy:"core.fetch.referrerPolicy",integrity:"core.fetch.integrity",keepalive:"core.fetch.keepalive",signal:"core.fetch.signal"};var u=i(75583),h=i(28071);let d=["baseUrl","fetch","mimeType","fallbackMimeType","ignoreRegisteredLoaders","nothrow","log","useLocalLibraries","CDN","worker","workerThreshold","maxConcurrency","maxMobileConcurrency","reuseWorkers","workerTransferBufferCopy","_nodeWorkers","_workerType","limit","_limitMB","shape","batchSize","batchDebounceMs","metadata","transforms"];function f(e,t){let i=t?.searchParams;if(!i||0===Object.keys(i).length||/^(?:data|blob):/i.test(e))return e;let r=e.indexOf("#"),n=r>=0?e.slice(r):"",s=r>=0?e.slice(0,r):e,o=s.indexOf("?"),a=o>=0?s.slice(0,o):s,l=o>=0?s.slice(o+1):"",c=new URLSearchParams(l),u=new URLSearchParams;for(let[e,t]of Object.entries(i))c.has(e)||u.set(e,String(t));let h=u.toString();return`${a}${o>=0?`?${l}`:""}${h?`${o>=0?"&":"?"}${h}`:""}${n}`}function p(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||(e._state={}),e._state}function g(){let e=p();return e.globalOptions=e.globalOptions||{...l,core:{...l.core}},v(e.globalOptions)}function m(e){p().globalOptions=w(g(),e),(0,r.Qz)(e.modules)}function _(e,t,i,r){(function(e,t){for(let i of(b(e,null,l,c,t),t)){let r=e&&e[i.id]||{},n=i.options&&i.options[i.id]||{},s=i.deprecatedOptions&&i.deprecatedOptions[i.id]||{};b(r,i.id,n,s,t)}})(e,i=Array.isArray(i=i||[])?i:[i]),y(e);let n=v(w(t,e,r));return y(n),n}function v(e){var t;let i,r=(i={...t=e},t.core&&(i.core={...t.core}),i);for(let e of(P(r),d))r.core&&void 0!==r.core[e]&&delete r[e];return r.core&&void 0!==r.core._workerType&&delete r._worker,r}function y(e){let t=e.core?.workerThreshold;if(void 0!==t&&(!Number.isFinite(t)||t<0||t>1))throw Error("core.workerThreshold must be a finite number between 0 and 1")}function b(e,t,i,r,o){let a=t||"Top level",l=t?`${t}.`:"";for(let c in e){let u=!t&&(0,n.Gv)(e[c]),h=!t&&["baseUri","signal","onProgress"].includes(c),d="workerUrl"===c&&t;if(!(c in i)&&!h&&!d){if(c in r)s.Rm.level>0&&s.Rm.warn(`${a} loader option '${l}${c}' no longer supported, use '${r[c]}'`)();else if(!u&&s.Rm.level>0){let e=function(e,t){let i=e.toLowerCase(),r="";for(let n of t)for(let t in n.options){if(e===t)return`Did you mean '${n.id}.${t}'?`;let s=t.toLowerCase();(i.startsWith(s)||s.startsWith(i))&&(r=r||`Did you mean '${n.id}.${t}'?`)}return r}(c,o);s.Rm.warn(`${a} loader option '${l}${c}' not recognized. ${e}`)()}}}}function w(e,t,i){var r,a;let l=e.options||{},c={...l};l.core&&(c.core={...l.core}),P(c);let f=e.defaultShape&&(0,u.g3)(e);f&&(c[f]={...l[f],shape:e.defaultShape}),E(c,v(g()));let p=v(t);return E(c,p),function(e,t,i){let r=e.core?.shape;if(void 0===r)return;let s=(0,u.g3)(i);if(!s)return;let o=i.options?.[s];if(!(0,n.aC)(o)||!("shape"in o))return;let a=g()[s];if((0,n.aC)(a)&&"shape"in a)return;let l=t[s];if((0,n.aC)(l)&&"shape"in l)return;let c=e[s];e[s]={...(0,n.aC)(c)?c:{},shape:r}}(c,p,e),c.core?.log===null&&(c.core={...c.core,log:(0,s.Wd)(c)}),r=c,(a=i)&&r.core?.baseUrl===void 0&&(r.core||={},r.core.baseUrl=o.pD((0,h.S3)(a))),function(e){let t=e.core;if(t)for(let i of d)void 0!==t[i]&&(e[i]=t[i])}(c),c}function E(e,t){for(let i in t)if(i in t){let r=t[i];(0,n.aC)(r)&&(0,n.aC)(e[i])?e[i]={...e[i],...t[i]}:e[i]=t[i]}}function P(e){for(let t of(void 0!==e.baseUri&&(e.core||={},void 0===e.core.baseUrl&&(e.core.baseUrl=e.baseUri)),d))if(void 0!==e[t]){e.core||={};let i=e.core;void 0===i[t]&&(i[t]=e[t])}let t=e._worker;void 0!==t&&(e.core||={},void 0===e.core._workerType&&(e.core._workerType=t))}},42221(e,t,i){i.d(t,{JQ:()=>s,OA:()=>o,d_:()=>a});let r=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,n=/^([-\w.]+\/[-\w.+]+)/;function s(e,t){return e.toLowerCase()===t.toLowerCase()}function o(e){let t=n.exec(e);return t?t[1]:e}function a(e){let t=r.exec(e);return t?t[1]:""}},72548(e,t,i){i.d(t,{Al:()=>o,_E:()=>l,z4:()=>a});var r=i(20903),n=i(42221),s=i(28071);function o(e){return(0,r.Sv)(e)?e.url:(0,r.qf)(e)?("name"in e?e.name:"")||"":"string"==typeof e?e:""}function a(e){if((0,r.Sv)(e)){let t=e.headers.get("content-type")||"",i=(0,s.S3)(e.url);return(0,n.OA)(t)||(0,n.d_)(i)}return(0,r.qf)(e)?e.type||"":"string"==typeof e?(0,n.d_)(e):""}function l(e){return(0,r.Sv)(e)?e.headers["content-length"]||-1:(0,r.qf)(e)?e.size:"string"==typeof e?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}},41312(e,t,i){i.d(t,{Mz:()=>l,wv:()=>a});var r=i(20903),n=i(41708),s=i(72548),o=i(28071);async function a(e){if((0,r.Sv)(e))return e;let t={},i=(0,s._E)(e);i>=0&&(t["content-length"]=String(i));let n=(0,s.Al)(e),o=(0,s.z4)(e);o&&(t["content-type"]=o);let a=await u(e);a&&(t["x-first-bytes"]=a),"string"==typeof e&&(e=new TextEncoder().encode(e));let l=new Response(e,{headers:t});return Object.defineProperty(l,"url",{value:n}),l}async function l(e){if(!e.ok)throw await c(e)}async function c(e){let t=(0,o.E1)(e.url),i=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;i=i.length>100?`${i.slice(0,100)}...`:i;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get("Content-Type");r.reason=!e.bodyUsed&&t?.includes("application/json")?await e.json():await e.text()}catch(e){}return new n.f(i,r)}async function u(e){if("string"==typeof e)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let i=new FileReader;i.onload=t=>e(t?.target?.result),i.readAsDataURL(t)})}if(e instanceof ArrayBuffer){let t=function(e){let t=new Uint8Array(e),i=[];for(let e=0;e<t.length;e+=12288)i.push(btoa(String.fromCharCode(...t.subarray(e,e+12288))));return i.join("")}(e.slice(0,5));return`data:base64,${t}`}return null}},28071(e,t,i){i.d(t,{E1:()=>o,S3:()=>s,by:()=>n});let r=/\?.*/;function n(e){let t=e.match(r);return t&&t[0]}function s(e){return e.replace(r,"")}function o(e){if(e.length<50)return e;let t=e.slice(e.length-15),i=e.substr(0,32);return`${i}...${t}`}},26358(e,t,i){function r(e,t,i){if(i=i||e.byteLength,e.byteLength<i||t.byteLength<i)return!1;let r=new Uint8Array(e),n=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==n[e])return!1;return!0}function n(...e){var t=e;let i=t.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),r=new Uint8Array(i.reduce((e,t)=>e+t.byteLength,0)),s=0;for(let e of i)r.set(e,s),s+=e.byteLength;return r.buffer}i.d(t,{AQ:()=>n,YV:()=>r})},33631(e,t,i){i.d(t,{XA:()=>s,Q_:()=>l,Pe:()=>n,W$:()=>o});var r=i(20903);function n(e){return e&&"object"==typeof e&&e.isBuffer}function s(e){if(n(e)||e instanceof ArrayBuffer)return e;if((0,r.L8)(e))return a(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return 0===e.byteOffset&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if("string"==typeof e)return new TextEncoder().encode(e).buffer;if(e&&"object"==typeof e&&e._toArrayBuffer)return e._toArrayBuffer();throw Error("toArrayBuffer")}function o(e){if(e instanceof ArrayBuffer)return e;if((0,r.L8)(e))return a(e);let{buffer:t,byteOffset:i,byteLength:n}=e;return t instanceof ArrayBuffer&&0===i&&n===t.byteLength?t:a(t,i,n)}function a(e,t=0,i=e.byteLength-t){let r=new Uint8Array(e,t,i),n=new Uint8Array(r.length);return n.set(r),n.buffer}function l(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}},85638(e,t,i){i.d(t,{v:()=>r});function r(e,t){if(!e)throw Error(t||"loader assertion failed.")}},40818(e,t,i){i.d(t,{Al:()=>a,Bd:()=>l,Sf:()=>o,bg:()=>n,x:()=>s,xD:()=>c});let r={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document},n=r.self||r.window||r.global||{},s=r.window||r.self||r.global||{},o=r.global||r.self||r.window||{},a=r.document||{},l=!!("object"!=typeof process||"[object process]"!==String(process)||process.browser),c="function"==typeof importScripts,u="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);u&&parseFloat(u[1])},42080(e,t,i){i.d(t,{Pb:()=>o,cy:()=>s,jJ:()=>n});var r=i(26358);async function n(e,t){var i,r;let n="function"==typeof(i=e)[Symbol.asyncIterator]?i[Symbol.asyncIterator]():"function"==typeof i[Symbol.iterator]?(r=i[Symbol.iterator](),{next:e=>Promise.resolve(r.next(e)),return:e=>"function"==typeof r.return?Promise.resolve(r.return(e)):Promise.resolve({done:!0,value:e}),throw:e=>"function"==typeof r.throw?Promise.resolve(r.throw(e)):Promise.reject(e)}):i;for(;;){let{done:e,value:i}=await n.next();if(e){n.return&&n.return();return}if(t(i))return}}async function s(e){let t=[];for await(let i of e)t.push(a(i));return(0,r.AQ)(...t)}async function*o(e){for await(let t of e)yield a(t)}function a(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:i,byteLength:r}=e;return l(t,i,r)}return l(e)}function l(e,t=0,i=e.byteLength-t){let r=new Uint8Array(e,t,i),n=new Uint8Array(r.length);return n.set(r),n.buffer}},20903(e,t,i){i.d(t,{B1:()=>o,Gv:()=>r,H1:()=>f,L8:()=>s,PJ:()=>p,Sv:()=>h,Td:()=>c,Vv:()=>u,aC:()=>n,qf:()=>d,xZ:()=>l,yL:()=>a});let r=e=>null!==e&&"object"==typeof e,n=e=>r(e)&&e.constructor===({}).constructor,s=e=>"u">typeof SharedArrayBuffer&&e instanceof SharedArrayBuffer,o=e=>r(e)&&"number"==typeof e.byteLength&&"function"==typeof e.slice,a=e=>r(e)&&"then"in e&&"function"==typeof e.then,l=e=>!!e&&"function"==typeof e[Symbol.iterator],c=e=>!!e&&"function"==typeof e[Symbol.asyncIterator],u=e=>!!e&&"function"==typeof e.next,h=e=>"u">typeof Response&&e instanceof Response||r(e)&&"function"==typeof e.arrayBuffer&&"function"==typeof e.text&&"function"==typeof e.json,d=e=>"u">typeof Blob&&e instanceof Blob,f=e=>{let t,i;return t=e,"u">typeof ReadableStream&&t instanceof ReadableStream||r(t)&&"function"==typeof t.tee&&"function"==typeof t.cancel&&"function"==typeof t.getReader||r(i=e)&&"function"==typeof i.read&&"function"==typeof i.pipe&&"boolean"==typeof i.readable},p=e=>{let t,i;return r(t=e)&&"function"==typeof t.abort&&"function"==typeof t.getWriter||r(i=e)&&"function"==typeof i.end&&"function"==typeof i.write&&"boolean"==typeof i.writable}},18553(e,t,i){let r;i.d(t,{Rm:()=>a,Wd:()=>h,sq:()=>l});var n=i(6431);let s="5.0.0-beta.8",o=s[0]>="0"&&s[0]<="9"?`v${s}`:"",a=(r=new n.tG({id:"loaders.gl"}),globalThis.loaders||={},globalThis.loaders.log=r,globalThis.loaders.version=o,globalThis.probe||={},globalThis.probe.loaders=r,r);class l{log(){return c}info(){return c}once(){return c}warn(){return c}error(){return c}}function c(){}let u=new l;function h(e){let t=e?.core?.log!==void 0?e.core.log:e?.log;return null===t?u:t||a}},13601(e,t,i){i.d(t,{Qz:()=>r});function r(e){globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,e)}},51925(e,t,i){i.d(t,{l:()=>n});var r=i(20903);function n(e,t){return function e(t,i,n=0){if(n>3)return i;let s={...t};for(let[t,o]of Object.entries(i))(0,r.aC)(o)?s[t]=e(s[t]||{},i[t],n+1):s[t]=i[t];return s}(e||{},t)}},92537(e,t,i){i.d(t,{Qj:()=>s,o1:()=>a,yc:()=>o});let r="",n={};function s(e){r=e}function o(){return r}function a(e){for(let t in n)if(e.startsWith(t)){let i=n[t];e=e.replace(t,i)}return e.startsWith("http://")||e.startsWith("https://")||(e=`${r}${e}`),e}},58345(e,t,i){function r(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(t+1):e}function n(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(0,t):""}i.d(t,{iW:()=>r,pD:()=>n})},66290(e,t,i){function r(e,t=[]){return e.every(o)?e:e.map((e,i)=>{let r;if(o(e))return e;let n=t.find(t=>t.type===e?.type);if(!n)throw Error(`No authentication class registered for credential at index ${i}.`);try{r=new n(e)}catch{throw Error(`Invalid authentication configuration at index ${i}.`)}if(!o(r))throw Error(`Authentication class returned an invalid credential at index ${i}.`);return r})}function n(e){if(!e.core?.credentials?.length)return e;let t=r(e.core.credentials,e.core.authentications);return t===e.core.credentials?e:{...e,core:{...e.core,credentials:t}}}async function s(e,t,i){if(!i.core?.credentials?.length||i.core.credentials.every(o))return i;let r=await e?.getAuthentications?.(t,i);return r?.length?n({...i,core:{...i.core,authentications:[...i.core?.authentications||[],...r]}}):n(i)}function o(e){return!!e&&"object"==typeof e&&"string"==typeof e.id&&!!Array.isArray(e.origins)&&("request"===e.type?"function"==typeof e.authenticate:("header"===e.type||"query-parameter"===e.type)&&"string"==typeof e.name&&("string"==typeof e.token||"function"==typeof e.token)&&Array.isArray(e.refreshStatusCodes))}i.d(t,{Bv:()=>n,M8:()=>s,z8:()=>r})},42(e,t,i){i.d(t,{Kt:()=>a,Wm:()=>o});var r=i(66290);let n=Symbol("loaders.gl.authenticated-fetch"),s=new WeakMap;function o(e){let t=e.fetch||((e,t)=>fetch(e,t)),i=t[n],s=new Map(i?.credentialResolutions),o=(0,r.z8)(e.credentials.map(e=>s.get(e)||e),e.authentications);if(e.credentials.forEach((e,t)=>{s.set(e,o[t])}),!e.fetchOptions&&(!o.length||i?.credentials.length===o.length&&o.every((e,t)=>e===i.credentials[t])))return t;let a=i?.fetch||t,u=i?[...new Set([...o,...i.credentials])]:o,p=l(i?.fetchOptions||{},e.fetchOptions),m=u.filter(e=>"request"!==e.type),_=u.filter(e=>"request"===e.type);for(let e of _)h(e.origins);let v=async(e,t={})=>{if(t=l(p,t),t.signal?.throwIfAborted(),!u.length)return a(e,t);let i=function(e){try{let t=new URL(e);return["http:","https:"].includes(t.protocol)?t:null}catch{return null}}(e),r=i?await d(i,t,m):{url:e,options:t,credentials:[]},n=await c(r,_,"request"),s=await a(n.url,n.options),o=[];for(let i of r.credentials){let{credential:r}=i;"function"==typeof r.token&&(g(t)||r.canReplayRequest?.(e,t))&&(g(n.options)||r.canReplayRequest?.(n.url,n.options))&&(r.refreshStatusCodes.includes(s.status)||await r.shouldRefresh?.(s))&&o.push(i)}let h=g(t)&&g(n.options)&&n.credentials.some(e=>e.refreshStatusCodes?.includes(s.status));if(!o.length&&!h)return s;t.signal?.throwIfAborted();let v=new Map;if(await Promise.all(o.map(async({credential:t})=>{let i=await f(t,e,s);i&&v.set(t,i)})),!v.size&&!h)return s;await s.body?.cancel().catch(()=>{}),t.signal?.throwIfAborted();let y=i?await d(i,t,m,v,r.credentials):{url:e,options:t},b=await c(y,_,"retry",s);return a(b.url,b.options)};return Object.defineProperty(v,n,{value:{fetch:a,credentials:u,credentialResolutions:s,fetchOptions:p}}),v}function a(e={}){let t,i=e.fetch??e.core?.fetch;t="function"==typeof i?i:(e,t)=>fetch(e,t);let r="object"==typeof i&&i?i:void 0;return o({fetch:t,fetchOptions:e.signal?{...r,signal:e.signal}:r,credentials:e.core?.credentials||[],authentications:e.core?.authentications})}function l(e,t){let i={...e,...t};if(e.headers||t?.headers){let r=new Headers(e.headers);new Headers(t?.headers).forEach((e,t)=>r.set(t,e)),i.headers=r}return i}async function c(e,t,i,r){let n=[],s=e.options.signal;for(let o of t){let t=u(e.url);if(!t||!h(o.origins).includes(t))continue;s?.throwIfAborted();let a=await o.authenticate({url:e.url,options:{...e.options,headers:new Headers(e.options.headers)},reason:i,response:r?{status:r.status,headers:new Headers(r.headers)}:void 0});if(!a||"string"!=typeof a.url||!a.options||"object"!=typeof a.options)throw Error("Authentication callback returned an invalid request.");e={url:a.url,options:{...a.options,...s?{signal:s}:{}}},n.push(o)}return s?.throwIfAborted(),{...e,credentials:n}}function u(e){try{let t=new URL(e);if(!t.host||t.username||t.password)return null;return"null"!==t.origin?t.origin:`${t.protocol}//${t.host}`}catch{return null}}function h(e){if(!e.length)throw Error("Request authentication requires at least one exact origin.");return e.map(e=>{let t,i=u(e);try{t=new URL(e)}catch{throw Error("Invalid request authentication origin.")}if(!i||t.pathname&&"/"!==t.pathname||t.search||t.hash)throw Error("Invalid request authentication origin.");return i})}async function d(e,t,i,r=new Map,n=[]){let s=new URL(e),o=new Headers(t.headers),a=[],l=new Map(n.map(({credential:e,token:t})=>[e,t]));for(let t of i){if(!t.origins.includes(s.origin))continue;let i=r.get(t),n=l.get(t),c="query-parameter"===t.type&&void 0!==n,u="header"===t.type&&void 0!==n;if("query-parameter"===t.type&&s.searchParams.has(t.name)&&!c||"header"===t.type&&o.has(t.name)&&!u)continue;let h=i??n??await p(t.token,{url:e.toString(),reason:"request"});h&&("query-parameter"===t.type?s.searchParams.set(t.name,h):o.set(t.name,`${t.prefix||""}${h}`),a.push({credential:t,token:h}))}return{url:s.toString(),options:{...t,headers:o},credentials:a}}async function f(e,t,i){let r=s.get(e);if(r)return r;let n=Promise.resolve((0,e.token)({url:t,reason:"refresh",response:{status:i.status,headers:i.headers}})).finally(()=>s.delete(e));return s.set(e,n),n}async function p(e,t){return"function"==typeof e?e(t):e}function g(e){return!!["GET","HEAD","OPTIONS","PUT","DELETE"].includes((e.method||"GET").toUpperCase())&&!(e.body&&"u">typeof ReadableStream&&e.body instanceof ReadableStream)}},86964(e,t,i){i.d(t,{FR:()=>u,L6:()=>l,ZT:()=>a,gm:()=>c,sA:()=>o});var r=i(18553),n=i(73891),s=i(18782);function o(e,t){var i;let r=t?.[e.id]?.workerUrl;if(t?.core?.worker===!1||!(e.worker||e.loadWorker||r)||t?.core?.credentials?.some(e=>"request"===e.type||"token"in e&&"function"==typeof e.token)||"shapefile"===e.id&&("function"==typeof t?.fetch||"function"==typeof t?.core?.fetch))return!1;let o=p(t),a=o._nodeWorkers;return(!!n.Bd||!!a)&&("csv"!==e.id||(i=t,(i?.csv?.shape??i?.core?.shape)==="arrow-table"))&&!!(0,s.$r)(e,o)}function a(e,t){let i=t?.parquet;return("parquet"!==e.id||"function"!=typeof i?.keyRetriever)&&!!(e.workerInBatches&&o(e,t)&&(0,s.Ec)(e,p(t)))}function l(e,t,i,r,n=e){if(!o(e,i))return!1;if(i?.core?.worker!=="auto"||!n.getWorkerEstimate)return!0;try{let e=n.getWorkerEstimate(t,i,r);if(void 0===e||!Number.isFinite(e)||e<0||e>1)return!0;return e>=(i.core?.workerThreshold??.1)}catch{return!0}}async function c(e,t,i,r,n,o){let a=o||h(i)||r?.signal,l=await (0,s.dS)(e,t,{...p(i,e),signal:a,onProgress:i?.onProgress||r?.reportProgress},{process:async(t,s,o,a)=>{if(!n)throw Error("Worker not set up to parse on main thread");let{_loaderIds:l,_loaderIsArray:c,...u}=a||{},h=r||a||o?.signal?{...r,...u,signal:o?.signal??r?.signal}:void 0;return await d(n,t,s,h,f(e,l,c,r,i))}},g(r));return"function"==typeof e.deserializeWorkerResult?e.deserializeWorkerResult(l,i,r):l}async function*u(e,t,i,r,n,o){let a=o||h(i)||r?.signal;for await(let o of(0,s.AO)(e,t,{...p(i,e),signal:a,onProgress:i?.onProgress||r?.reportProgress},{process:async(t,s,o,a)=>{if(!n)throw Error("Worker not set up to parse on main thread");let{_loaderIds:l,_loaderIsArray:c,...u}=a||{},h=r||a||o?.signal?{...r,...u,signal:o?.signal??r?.signal}:void 0;return await d(n,t,s,h,f(e,l,c,r,i))}},g(r)))yield e.deserializeWorkerBatch?e.deserializeWorkerBatch(o,i,r):o}function h(e){if(e?.signal)return e.signal;let t=e?.parquet?.signal;if("u">typeof AbortSignal&&t instanceof AbortSignal)return t}function d(e,t,i,r,n){return!n&&e.length<=2?e(t,i):e(t,n,i,r)}function f(e,t,i,r,n){if(!t)return;let s=new Map,o=new Set;for(let t of[e,...r?.loaders||[]])!function e(t){if(!o.has(t))for(let[i,r]of(o.add(t),s.set(t.id,t),Object.entries(t.subloaders||{}))){let t=n?.core?.subloaders?.[i]||r;e(t),s.set(r.id,t)}}(t);let a=t.map(e=>{let t=s.get(e);if(!t)throw Error(`Worker requested unknown loader "${e}". Declare it in loader.subloaders or pass it in context.loaders.`);return t});return i?a:a[0]}function p(e={},t){let i=t?.serializeWorkerOptions?.(e)||e,r={...i,signal:void 0,onProgress:void 0,log:m(i.log)?null:void 0,...i.core?{core:{...i.core,authentications:void 0,log:m(i.core.log)?null:void 0}}:{}},n=JSON.parse(JSON.stringify(r,(e,t)=>"u">typeof Headers&&t instanceof Headers?Object.fromEntries(t.entries()):"u">typeof AbortSignal&&t instanceof AbortSignal?void 0:"bigint"==typeof t?null:t));!function e(t,i){if(i&&"object"==typeof i)for(let r of Object.keys(i)){let n=t?.[r];"bigint"==typeof n?i[r]=n:e(n,i[r])}}(r,n);let s={...n.core,...n};return"auto"===s.worker&&(s.worker=!0),t&&(s._workerLoaderId=t.id),s}function g(e){if(!e)return{};let{fetch:t,loaders:i,coreApi:r,signal:n,reportProgress:s,_parse:o,_parseSync:a,_parseInBatches:l,...c}=e;return JSON.parse(JSON.stringify(c))}function m(e){return null===e||e instanceof r.sq}},5969(e,t,i){i.d(t,{p:()=>r});function r(e){return!!(e&&"object"==typeof e&&"createDataSourceSync"in e&&"fromUrl"in e&&"testURL"in e)}},25389(e,t,i){i.d(t,{v:()=>r});function r(e,t){if(!e)throw Error(t||"loaders.gl assertion failed.")}},73891(e,t,i){i.d(t,{Bd:()=>n,Fr:()=>s});let r={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};r.self||r.window||r.global,r.window||r.self||r.global,r.global||r.self||r.window,r.document;let n="object"!=typeof process||"[object process]"!==String(process)||process.browser,s="u">typeof window&&void 0!==window.orientation,o="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);o&&parseFloat(o[1])},18782(e,t,i){i.d(t,{dS:()=>m,$r:()=>p,Ec:()=>g,AO:()=>_});var r=i(30331),n=i(18553),s=i(25389),o=i(73891);let a=new Set;function l(e,t={}){let i=o.Bd?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=c(e,t),n=t._workerType||t?.core?._workerType;if(!r&&"test"===n)if(o.Bd)r=`modules/${e.module}/dist/${i}`;else{let t="core"===e.module&&e.workerNode?.startsWith("worker-utils/")?"worker-utils/workers":"workers",i=e.workerSourceNode||`${t}/${e.id}-worker-node.ts`;r=`modules/${e.module}/src/${i}`}return r||null}function c(e,t={}){return(t[e.id]||{}).workerUrl||("compression"===e.id?t.workerUrl:null)||null}function u(e){return!!e&&!!(e instanceof ArrayBuffer||"u">typeof MessagePort&&e instanceof MessagePort||"u">typeof ImageBitmap&&e instanceof ImageBitmap||"u">typeof OffscreenCanvas&&e instanceof OffscreenCanvas)}let h=new WeakMap,d=new Set,f=new Map;function p(e,t={}){return!!((o.Bd?"u">typeof Worker:!!t._nodeWorkers)&&t.worker&&(e.worker||e.loadWorker||c(e,t)))}function g(e,t={}){return!!p(e,t)&&(void 0!==t.workerInBatches?t.workerInBatches:!!(e.workerInBatches&&!c(e,t)))}async function m(e,t,i={},r={},n={}){let s=await b(e,i,r,n);try{return(await s.handle.runTask({value:t},{...v(i),options:y(i)})).value}finally{await s.close()}}async function*_(e,t,i={},r={},n={}){var s;let o,a,l,c=(o=Symbol.asyncIterator in(s=t)?s[Symbol.asyncIterator]():s[Symbol.iterator](),a=!1,{[Symbol.asyncIterator](){return this},async next(){if(a)return{done:!0,value:void 0};let e=await o.next();return e.done||a?(a=!0,{done:!0,value:void 0}):{done:!1,value:{value:e.value}}},return:async()=>(a||(a=!0,await o.return?.()),{done:!0,value:void 0})});try{for await(let t of(l=await b(e,i,r,n)).handle.runTaskInBatches(c,{...v(i),options:y(i)}))yield t.value}finally{let e=c.return?.();e?.catch(()=>{}),await l?.close()}}function v(e){return{execution:"worker",signal:e.signal,inputOwnership:e.inputOwnership??"transfer",outputOwnership:e.outputOwnership??"transfer",onProgress:e.onProgress?t=>e.onProgress?.({...t,phase:t.phase??"process",unit:t.unit??"items"}):void 0}}function y(e){let{signal:t,onProgress:i,...r}=e;return function e(t){if(null===t)return{};let i=Object.assign({},t);return Object.keys(i).forEach(r=>{null===t[r]||"object"!=typeof t[r]||ArrayBuffer.isView(t[r])||t[r]instanceof Array?"function"==typeof i[r]||i[r]instanceof RegExp?i[r]={}:i[r]=t[r]:i[r]=e(t[r])}),i}(r)}async function b(e,t,i,c){let p;t.signal?.throwIfAborted();let g=function(e,t){if(t.source||t.core?.source)throw Error("Inline legacy worker source is unsupported; use a TaskRunner worker URL or factory");let i=!l(e,t)&&o.Bd?e.loadWorker:void 0,r=function(e,t={}){let i=l(e,t),r="string"==typeof e.worker?e.worker:null,c=i||r||function(e,t=!1){let i=o.Bd?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=e.version;"latest"===r&&(r="beta");let s=r?`@${r}`:"",l=`https://unpkg.com/@loaders.gl/${e.module}${s}/dist/${i}`;return t&&function(e,t){if("latest"!==e.version)return;let i=`${e.module}:${e.id}`;a.has(i)||(a.add(i),n.Rm.warn(`loaders.gl: ${e.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${t} from CDN.`)())}(e,l),l}(e,!0);return(0,s.v)(c),c}(e,t);return{id:`${e.module}:${e.id}`,initialize:e=>e,worker:{...i?{create:()=>i()??function(e){let t=new URL(e,globalThis.document?.baseURI??globalThis.location.href),i=t.href;if(/^https?:$/.test(t.protocol)&&t.origin!==globalThis.location.origin){let e=f.get(t.href);e||(e=URL.createObjectURL(new Blob([`import ${JSON.stringify(t.href)};`],{type:"application/javascript"})),f.set(t.href,e)),i=e}return new Worker(i,{type:"module"})}(r)}:{url:r},capabilities:{atomic:!0,streaming:!0}}}}(e,t),m=h.get(e);m||(m={runner:new r.u({maxConcurrency:o.Fr?t.maxMobileConcurrency??1:t.maxConcurrency??3}),requests:0},h.set(e,m));let _=m,y=i.process?new MessageChannel:void 0,b=new AbortController,w=!1,E=()=>b.abort(t.signal?.reason);t.signal?.addEventListener("abort",E,{once:!0});let P=()=>{w=!0,t.signal?.removeEventListener("abort",E),b.abort(),y?.port1.close(),y?.port2.close()};y&&(y.port1.onmessage=async({data:e})=>{try{let t=await i.process(e.input,e.options,{signal:b.signal,throwIfAborted:()=>b.signal.throwIfAborted()},e.context);w||b.signal.aborted||y.port1.postMessage({identifier:e.identifier,value:t},function e(t,i=!0,r){let n=r||new Set;if(t){if(u(t))n.add(t);else if(u(t.buffer))n.add(t.buffer);else if(ArrayBuffer.isView(t));else if(i&&"object"==typeof t)for(let r in t)e(t[r],i,n)}return void 0===r?Array.from(n):[]}(t))}catch(t){if(w||b.signal.aborted)return;y.port1.postMessage({identifier:e.identifier,error:{name:t instanceof Error?t.name:"Error",message:t instanceof Error?t.message:String(t)}})}},y.port1.start()),_.requests++,d.add(_);let x=!1,S=()=>{!x&&(x=!0,_.requests--,_.requests||d.delete(_))};try{p=await _.runner.initializeTask(g,{context:structuredClone(c),...y?{port:y.port2}:{}},{...v(t),inputOwnership:"transfer"})}catch(e){throw S(),P(),e}return{handle:p,async close(){try{await p.close()}finally{P(),S()}}}}},27912(e,t,i){let r;i.d(t,{z:()=>o});var n=i(25389);let s=(r="5.0.0-beta.8",globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version||=r,r);function o(e,t=s){(0,n.v)(e,"no worker provided");let i=e.version;return!!t&&!!i}},67052(e,t,i){i.d(t,{$:()=>s});var r=i(19205);async function n(){let{ImageLoaderWithParser:e}=await i.e("8261").then(i.bind(i,51124));return e}let s={dataType:null,batchType:null,id:"image",module:"images",name:"Images",encoding:"image",format:"image",mimeTypes:["image/png","image/jpeg","image/gif","image/webp","image/avif","image/bmp","image/vnd.microsoft.icon","image/svg+xml"],extensions:["png","jpg","jpeg","gif","webp","bmp","ico","svg","avif"],tests:[e=>!!(0,r.m)(new DataView(e))],id:"imagebitmap",name:"ImageBitmap",format:"image-bitmap",version:"5.0.0-beta.8",options:{image:{}},preload:n}},19205(e,t,i){function r(e){var t,i;let r,s,o,a,l=n(e);return((r=n(l)).byteLength>=33&&0x89504e47===r.getUint32(0,!1)&&0xd0a1a0a===r.getUint32(4,!1)&&13===r.getUint32(8,!1)&&0x49484452===r.getUint32(12,!1)?{mimeType:"image/png",width:r.getUint32(16,!1),height:r.getUint32(20,!1)}:null)||function(e){let t=n(e);if(!(t.byteLength>=3&&65496===t.getUint16(0,!1)&&255===t.getUint8(2)))return null;let{tableMarkers:i,sofMarkers:r}=function(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}(),s=2;for(;s+9<t.byteLength;){let e=t.getUint16(s,!1);if(r.has(e))return{mimeType:"image/jpeg",height:t.getUint16(s+5,!1),width:t.getUint16(s+7,!1)};if(!i.has(e))break;s+=2,s+=t.getUint16(s,!1)}return null}(l)||((s=n(l)).byteLength>=10&&0x47494638===s.getUint32(0,!1)?{mimeType:"image/gif",width:s.getUint16(6,!0),height:s.getUint16(8,!0)}:null)||((o=n(l)).byteLength>=14&&16973===o.getUint16(0,!1)&&o.getUint32(2,!0)===o.byteLength?{mimeType:"image/bmp",width:o.getUint32(18,!0),height:o.getUint32(22,!0)}:null)||((a=!function(e,t,i=0){let r=[...t].map(e=>e.charCodeAt(0));for(let t=0;t<r.length;++t)if(r[t]!==e[t+i])return!1;return!0}(i=new Uint8Array((t=l)instanceof DataView?t.buffer:t),"ftyp",4)||(96&i[8])==0?null:function(e){switch(String.fromCharCode(...e.slice(8,12)).replace("\0"," ").trim()){case"avif":case"avis":return{extension:"avif",mimeType:"image/avif"};default:return null}}(i))?{mimeType:a.mimeType,width:0,height:0}:null)}function n(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error("toDataView")}i.d(t,{m:()=>r})},8982(e,t,i){i.d(t,{M:()=>s});var r=i(92648),n=i(46779);class s{static async createAsync(e,t){let i,n=!r.N.getAsyncCompilation(e),o=n?r.N.beginAsyncCompilation(e):r.N.getAsyncCompilation(e);try{i=new s(e,t)}finally{n&&r.N.endAsyncCompilation(e,o)}try{return n?await Promise.all(o):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if("webgpu"!==e.type)throw Error("Kernel is only supported in WebGPU");let{source:i,pipelineFactory:s,shaderFactory:o,debugShaders:a,...l}=t;this.device=e,this.id=t.id??"kernel",this.source=i,this.pipelineFactory=s??r.N.getDefaultPipelineFactory(e),this.shaderFactory=o??n.g.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:"compute",source:this.source,debugShaders:a});let c={...l,shader:this.shader},u=r.N.getAsyncCompilation(e);if(u){let e=this.pipelineFactory.createComputePipelineAsync(c);this._pipelineInitialization=e,u.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(c)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),this._destroyed=!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}}},61439(e,t,i){i.d(t,{z:()=>s});var r=i(13240),n=i(35098);class s{isConstant=!0;format;value;byteLength;constructor({format:e,value:t}){var i;let s=(0,n.Ft)(e);if(s.fixedSizeList)throw Error("GPUConstant cannot represent fixed-size-list storage columns");let o="unorm10-10-10-2"===(i=e)?Uint32Array:(0,r.Y0)((0,n.Ft)(i).type);if(t.constructor!==o)throw Error(`GPUConstant format "${e}" requires ${o.name}, received ${t.constructor.name}`);if(t.byteLength!==s.byteLength)throw Error(`GPUConstant format "${e}" requires exactly ${s.byteLength} bytes, received ${t.byteLength}`);let a=t.constructor;this.format=e,this.value=new a(t),this.byteLength=this.value.byteLength}}},49201(e,t,i){i.d(t,{I:()=>n});var r=i(61954);class n{buffer;format;length;byteOffset;byteStride;constructor(e){let t=r.E.getVertexFormatInfo(e.format).byteLength,i=e.byteOffset??0,n=e.byteStride??t;if(s(e.length,"GPUDataView length"),s(i,"GPUDataView byteOffset"),s(n,"GPUDataView byteStride"),n<t)throw Error(`GPUDataView byteStride ${n} is smaller than ${e.format} byte length ${t}`);let o=0===e.length?0:(e.length-1)*n+t,a=i+o;if(!Number.isSafeInteger(o)||!Number.isSafeInteger(a))throw Error("GPUDataView byte range must use safe integers");if(a>e.buffer.byteLength)throw Error("GPUDataView exceeds its backing buffer byte length");this.buffer=e.buffer,this.format=e.format,this.length=e.length,this.byteOffset=i,this.byteStride=n}get elementByteLength(){return r.E.getVertexFormatInfo(this.format).byteLength}get byteLength(){return 0===this.length?0:(this.length-1)*this.byteStride+this.elementByteLength}}function s(e,t){if(!Number.isSafeInteger(e)||e<0)throw Error(`${t} must be a non-negative safe integer`)}},88461(e,t,i){i.d(t,{L:()=>h});var r=i(49201),n=i(61954),s=i(15506);function o(e){return!!(e&&"object"==typeof e&&"struct"===e.type)}function a(e,t){return 1===t?e:`vec${t}<${e}>`}function l(e,t){return Math.ceil(e/t)*t}var c=i(35098);class u{buffer;ownsDataBuffer;constructor(e,t){this.buffer=e,this.ownsDataBuffer=t}get ownsBuffer(){return this.ownsDataBuffer}transferBufferOwnership(e){if(e.buffer!==this.buffer)throw Error("GPUData ownership can only be transferred to the same buffer");e.ownsDataBuffer=this.ownsDataBuffer,this.ownsDataBuffer=!1}destroy(){this.ownsDataBuffer&&(this.buffer.destroy(),this.ownsDataBuffer=!1)}}let h=class extends u{dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;readbackMetadata;valueOffsets;nullBitmap;valueByteLength;constructor(e){let t,{buffer:i,format:r,length:u,valueLength:h,stride:d,byteOffset:f=0,byteStride:p,rowByteLength:g,ownsBuffer:m=!1,readbackMetadata:_,valueOffsets:v,nullBitmap:y,valueByteLength:b,dataType:w}=e;super(i,m);let E=o(t=r?"string"==typeof r?r:function(e,t){let i=Object.entries(e);if(0===i.length)throw Error("GPUData struct format must declare at least one field");return"packed"===t?function(e){let t=[],i=0,r=0;for(let[s,o]of e){let e=n.E.getVertexFormatInfo(o);if(e.webglOnly)throw Error(`Packed GPUData struct field "${s}" uses WebGL-only format ${o}`);i=l(i,Math.min(4,e.byteLength)),t.push([s,Object.freeze({format:o,byteOffset:i,byteLength:e.byteLength})]),i+=e.byteLength,r+=e.components}return Object.freeze({type:"struct",layout:"packed",fields:Object.freeze(Object.fromEntries(t)),components:r,byteStride:l(i,4),rowByteLength:i})}(i):function(e){let t=Object.fromEntries(e.map(([e,t])=>[e,function(e){let t=n.E.getVertexFormatInfo(e);switch(t.type){case"float32":return a("f32",t.components);case"sint32":return a("i32",t.components);case"uint32":return a("u32",t.components);default:return a("u32",Math.ceil(t.byteLength/4))}}(t)])),i=(0,s.Pr)(t,{layout:"wgsl-storage"}),r=[],o=0,l=0;for(let[t,s]of e){let e=n.E.getVertexFormatInfo(s),a=4*i.fields[t].offset;r.push([t,Object.freeze({format:s,byteOffset:a,byteLength:e.byteLength})]),o=Math.max(o,a+e.byteLength),l+=e.components}return Object.freeze({type:"struct",layout:"wgsl-storage",fields:Object.freeze(Object.fromEntries(r)),components:l,byteStride:i.byteLength,rowByteLength:o})}(i)}(r,e.layout??"wgsl-storage"):void 0)?t:void 0,P="string"==typeof t?(0,c.Ft)(t):void 0;if(this.dataType=w,this.format=t,this.length=u,this.valueLength=h??u*(P?.listSize??1),this.stride=d??(P?P.components*(P.listSize??1):void 0)??E?.components??p??g??1,this.byteOffset=f,this.rowByteLength=g??E?.rowByteLength??P?.byteLength??p??this.stride,this.byteStride=p??E?.byteStride??this.rowByteLength,P?.fixedSizeList){let e=u*P.listSize;if(!Number.isSafeInteger(u)||u<0||!Number.isSafeInteger(e)||!Number.isSafeInteger(this.byteOffset)||this.byteOffset<0||!Number.isSafeInteger(this.byteStride)||!Number.isSafeInteger(this.rowByteLength)||!Number.isSafeInteger(this.stride))throw Error("GPUData fixed-size-list row layout must use safe non-negative integers");if(this.valueLength!==e)throw Error("GPUData fixed-size-list valueLength must equal its flattened row elements");if(this.stride<P.components*P.listSize)throw Error("GPUData fixed-size-list stride cannot truncate its row components");if(this.rowByteLength<P.byteLength)throw Error("GPUData fixed-size-list rowByteLength cannot truncate its row payload");if(this.byteStride<this.rowByteLength)throw Error("GPUData fixed-size-list byteStride cannot overlap its row payload");let t=0===u?0:(u-1)*this.byteStride+this.rowByteLength,r=this.byteOffset+t;if(!Number.isSafeInteger(t)||!Number.isSafeInteger(r))throw Error("GPUData fixed-size-list byte range must use safe integers");if(r>i.byteLength)throw Error("GPUData fixed-size-list exceeds its backing buffer byte length")}if(E){if(this.rowByteLength<E.rowByteLength)throw Error(`GPUData rowByteLength ${this.rowByteLength} is smaller than struct format row byte length ${E.rowByteLength}`);if(this.byteStride<Math.max(E.byteStride,this.rowByteLength))throw Error(`GPUData byteStride ${this.byteStride} is smaller than its struct row layout`)}this.readbackMetadata=_,this.valueOffsets=v,this.nullBitmap=y,this.valueByteLength=b}getChild(e){if(!o(this.format))return null;let t=this.format.fields[e];return t?new r.I({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}getChildAt(e){if(!o(this.format))return null;let t=Object.values(this.format.fields)[e];return t?new r.I({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}}},35098(e,t,i){i.d(t,{Ft:()=>c,Tm:()=>a,u4:()=>l});var r=i(61954);let n=/^vertex-list<([^<>]+)>$/,s=/^value-list<([^<>]+)>$/,o=/^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;function a(e){return n.test(e)}function l(e){return s.test(e)}function c(e){let t=function(e){let t=n.exec(e),i=s.exec(e),o=u(e),a=o?.elementFormat??t?.[1]??i?.[1]??e;try{r.E.getVertexFormatInfo(a)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return a}(e),i=a(e),o=l(e),c=u(e),h=r.E.getVertexFormatInfo(t),d=h.byteLength*(c?.listSize??1);if(!Number.isSafeInteger(d))throw Error(`Unsupported GPUVector format ${e}`);let f=h.type,p=h.normalized,g=function(e,t){if(t)return"f32";switch(e){case"float32":return"f32";case"float16":return"f16";case"uint8":case"uint16":case"uint32":return"u32";case"sint8":case"sint16":case"sint32":return"i32";default:throw Error(`Unsupported GPUVector component type ${e}`)}}(f,p);return{format:e,elementFormat:t,vertexList:i,valueList:o,fixedSizeList:!!c,...c?{listSize:c.listSize}:{},type:f,signedDataType:function(e,t){if("unorm10-10-10-2"===e)return"uint32";switch(t){case"unorm8":return"uint8";case"snorm8":return"sint8";case"unorm16":return"uint16";case"snorm16":return"sint16";default:return t}}(t,f),primitiveType:g,components:h.components,elementByteLength:h.byteLength,byteLength:d,integer:h.integer,signed:h.signed,normalized:p,...h.webglOnly?{webglOnly:!0}:{}}}function u(e){let t=o.exec(e);if(!t)return;let i=Number(t[2]);if(!Number.isSafeInteger(i))return;let n=t[1];try{let e=r.E.getVertexFormatInfo(n);if(!Number.isSafeInteger(i*e.components)||!Number.isSafeInteger(i*e.byteLength))return}catch{return}return{elementFormat:n,listSize:i}}},51002(e,t,i){i.d(t,{M:()=>s});var r=i(88461),n=i(35098);class s{name;dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;bufferLayout;data=[];device;bufferProps;isAppendable=!1;ownsDataChunks=!0;ownedVectors=[];appendableByteLength=0;get chunks(){var e;let t;return e=this.data,t=0,Object.freeze(e.map(e=>{let i=Object.freeze({offset:t,length:e.length,data:e});return t+=e.length,i}))}constructor(e){switch(e.type){case"buffer":{let{name:t,buffer:i,format:n,length:s,valueLength:a,byteOffset:l=0,ownsBuffer:c=!1}=e,{stride:u,byteStride:h,rowByteLength:d,listSize:f}=o(e),p=a??s*(f??1);this.name=t,this.dataType=e.dataType,this.format=n,this.length=s,this.valueLength=p,this.stride=u,this.byteOffset=l,this.byteStride=h,this.rowByteLength=d,this.data.push(new r.L({buffer:i,format:n,length:s,valueLength:p,stride:u,byteOffset:l,byteStride:h,rowByteLength:d,ownsBuffer:c,dataType:e.dataType}));return}case"interleaved":{let{name:t,buffer:i,format:s,length:o,valueLength:a,byteOffset:l=0,byteStride:c,attributes:u,ownsBuffer:h=!1}=e,d=s?(0,n.Ft)(s):void 0,f=a??o*(d?.listSize??1),p=d?.fixedSizeList?d.components*d.listSize:c,g=d?.fixedSizeList?d.byteLength:c;this.name=t,this.dataType=e.dataType,this.format=s,this.length=o,this.valueLength=f,this.stride=p,this.byteOffset=l,this.byteStride=c,this.rowByteLength=g,this.bufferLayout={name:t,byteStride:c,attributes:u},this.data.push(new r.L({buffer:i,format:s,length:o,valueLength:f,stride:p,byteOffset:l,byteStride:c,rowByteLength:g,ownsBuffer:h,dataType:e.dataType}));return}case"data":{var t;let i=e.format??(t=e.data,t[0]?.format),r=i?(0,n.Ft)(i):void 0,{name:s,data:o,stride:a=o[0]?.stride??(r?r.components*(r.listSize??1):1),valueLength:l=o.reduce((e,t)=>e+t.valueLength,0),byteStride:c=o[0]?.byteStride??r?.byteLength,rowByteLength:u=o[0]?.rowByteLength??r?.byteLength,bufferLayout:h,ownsData:d=!1}=e;if(void 0===c||void 0===u)throw Error("GPUVector requires format or explicit byte layout metadata");i&&function(e,t){if(e.find(e=>e.format!==t))throw Error("GPUVector data chunks must share the declared format")}(o,i),this.name=s,this.dataType=e.dataType,this.format=i,this.length=o.reduce((e,t)=>e+t.length,0),this.valueLength=l,this.stride=a,this.byteOffset=1===o.length?o[0].byteOffset:0,this.byteStride=c,this.rowByteLength=u,this.bufferLayout=h,this.ownsDataChunks=d,this.data.push(...o);return}case"appendable":{let{name:t,device:i,format:r,valueLength:n=0,bufferProps:s}=e,{stride:a,byteStride:l,rowByteLength:c}=o(e);this.name=t,this.dataType=e.dataType,this.format=r,this.length=0,this.valueLength=n,this.stride=a,this.byteOffset=0,this.byteStride=l,this.rowByteLength=c,this.device=i,this.bufferProps=s,this.isAppendable=!0;return}}}get ownsBuffer(){return this.ownsDataChunks&&this.data.some(e=>e.ownsBuffer)||this.ownedVectors.some(e=>e.ownsBuffer)}get capacityRows(){return this.isAppendable?this.length:void 0}get appendedByteLength(){return this.appendableByteLength}addData(e){if(this.format&&e.format!==this.format)throw Error("GPUVector.addData() requires matching formats");if(e.byteStride!==this.byteStride)throw Error("GPUVector.addData() requires matching byteStride");if(e.rowByteLength!==this.rowByteLength)throw Error("GPUVector.addData() requires matching rowByteLength");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this}appendDataChunk(e,t=this.appendableByteLength+e.buffer.byteLength){if(!this.isAppendable)throw Error("GPUVector.appendDataChunk() requires appendable vector storage");if(this.format&&e.format!==this.format)throw Error("GPUVector.appendDataChunk() requires matching formats");if(e.byteStride!==this.byteStride||e.rowByteLength!==this.rowByteLength)throw Error("GPUVector.appendDataChunk() requires matching byte layout metadata");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this.appendableByteLength=t,this}resetLastBatch(){if(!this.isAppendable)throw Error("GPUVector.resetLastBatch() requires appendable vector storage");for(let e of this.data.splice(0))e.destroy();return this.length=0,this.valueLength=0,this.appendableByteLength=0,this}retainOwnedVectors(e){return this.ownedVectors.push(...e),this}transferBufferOwnership(e){let t=this.data[0],i=e.data[0];if(!t||!i||t.buffer!==i.buffer)throw Error("GPUVector ownership can only be transferred to the same buffer");t.transferBufferOwnership(i)}destroy(){if(this.ownsDataChunks)for(let e of this.data)e.destroy();for(let e of this.ownedVectors.splice(0))e.destroy()}}function o(e){let t=e.format?(0,n.Ft)(e.format):void 0,i=e.rowByteLength??(t?.fixedSizeList?t.byteLength:e.byteStride)??t?.byteLength;if(void 0===i)throw Error("GPUVector requires format or explicit rowByteLength");return{stride:e.stride??(t?t.components*(t.listSize??1):1),byteStride:e.byteStride??i,rowByteLength:i,...t?.listSize?{listSize:t.listSize}:{}}}},46296(e,t,i){i.d(t,{GL:()=>h,uy:()=>d});var r=i(89362),n=i(13240),s=i(7036),o=i(49201),a=i(51002),l=i(88461),c=i(35098),u=i(96002);class h{static get bufferPoolSize(){return u.R.poolSize}static set bufferPoolSize(e){if(!Number.isSafeInteger(e)||e<0)throw Error("GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer");u.R.poolSize=e,u.R.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_evaluationScope;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership="owned";_targetBuffer;static fromArray(e,{type:t,size:i=1,offset:r=0,stride:s=0,normalized:o=!1}){let a,l=t;return Array.isArray(e)?(l=l||"float32",a=new((0,n.Y0)(l))(e)):e instanceof Float64Array?(l="uint32",i*=2,r*=2,s*=2,a=new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4)):(l=l||(0,n.UE)(e),a=e),new h({id:`<${l} * ${i}>`,type:l,size:i,offset:r,stride:s,normalized:o,value:a})}static fromConstant(e,t="float32"){let i,r=(0,n.Y0)(t);return Array.isArray(e)?i=`[${e.join(",")}]`:(i=String(e),e=[e]),new h({id:i,isConstant:!0,type:t,size:e.length,value:new r(e)})}static fromGPUData(e,t={}){return function(e){if(!e.format)throw Error("GPUDataEvaluator.fromGPUData() requires GPUData format metadata");if((0,c.Tm)(e.format)||(0,c.u4)(e.format))throw Error("GPUDataEvaluator.fromGPUData() does not support variable-length input");let t=(0,c.Ft)(e.format).byteLength;if(e.rowByteLength!==t)throw Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${t} for GPUData`)}(e),new h({...f(new o.I({buffer:e.buffer,format:e.format,length:e.length,byteOffset:e.byteOffset,byteStride:e.byteStride})),id:t.id,gpuData:e})}static fromGPUDataView(e,t={}){return new h({...f(e),id:t.id,buffer:e.buffer})}constructor(e){let{id:t,value:i,buffer:r,gpuData:s,format:o,source:l=null,isConstant:c=!1}=e;if(!l&&!i&&!r&&!s)throw Error("GPUDataEvaluator must have a value source");let{type:u,size:d,offset:f,stride:p,normalized:g,length:m}=e;if(l instanceof h?(u=u??l.type,d=d??l.size,f=f??l.offset,p=p??l.stride,g=g??l.normalized,m=m??l.length):(d=d??1,f=f??0,g=g??!1,m=c?1:m),!u)throw Error("GPUDataEvaluator: type not defined");if(this._id=t,this.type=u,this.size=d,this.ValueType=(0,n.Y0)(this.type),this._offset=f,this._stride=p||this.ValueType.BYTES_PER_ELEMENT*d,this.normalized=g,this.source=l,this.format=o,void 0===m)if(c)m=1;else{if(!i)throw Error("GPUDataEvaluator: length not defined");m=Math.ceil(i.byteLength/this.stride)}this.isConstant=c,this.length=m;let _=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=0===m?0:(m-1)*this.stride+_,this._value=i,this._bufferOwnership=l instanceof h||r||s?"borrowed":"owned",s?this._gpuVector=new a.M({type:"data",name:this._id??"data",format:s.format,data:[s],stride:s.stride,byteStride:s.byteStride,rowByteLength:s.rowByteLength}):r&&(this._gpuVector=this.createGPUVectorView({buffer:r,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof h?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}getInspection(){return(0,r.r)([this])}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return p(this.gpuVector)}setTargetBuffer({buffer:e,byteOffset:t=0,byteStride:i=this.stride}){if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof h)throw Error("GPUDataEvaluator target buffers require a deferred operation source");this._targetBuffer={buffer:e,byteOffset:t,byteStride:i}}async evaluate(e,t={}){let i;if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this.assertScopeAccess(t.scope),t.scope&&(t.scope.assertEvaluating(e),!this._evaluationScope)){let e=!!this._gpuVector,i={offset:this._offset,stride:this._stride,byteLength:this._byteLength,ownership:this._bufferOwnership,target:this._targetBuffer};this._evaluationScope=t.scope,t.scope.retain(t=>{this._evaluationScope=void 0,t||e||!this._gpuVector||("owned"===this._bufferOwnership&&u.R.recycle(p(this._gpuVector)),this._gpuVector=void 0),t||e||(this._offset=i.offset,this._stride=i.stride,this._byteLength=i.byteLength,this._bufferOwnership=i.ownership,this._targetBuffer=i.target)})}if(this._gpuVector){if(t.scope&&this.source instanceof h&&await this.source.evaluate(e,{scope:t.scope}),t.scope&&this.buffer.device!==e)throw Error("Evaluator buffer belongs to a different device");return this._gpuVector}if(this.source instanceof h){let i=await this.source.evaluate(e,{scope:t.scope});return this._gpuVector=this.createGPUVectorView({...t,buffer:p(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(e),this._value)i.write(this._value);else{let r;try{r=await this.source.execute(e,i,t.scope)}catch(e){throw t.scope&&"owned"===this._bufferOwnership&&u.R.recycle(i),e}if(!r.success)throw t.scope&&"owned"===this._bufferOwnership&&u.R.recycle(i),r.error||Error(`${this.source} evaluation failed`);r.value&&(this._value=r.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:i}),this._gpuVector}evaluateSync(e,t={}){let i;if(t.scope)throw Error("Use scope.evaluate() for deferred submission");if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;if(this.source instanceof h){let i=this.source.evaluateSync(e);return this._gpuVector=this.createGPUVectorView({...t,buffer:p(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(e),this._value)i.write(this._value);else{let t=this.source.executeSync(e,i);if(!t.success)throw t.error||Error(`${this.source} evaluation failed`);t.value&&(this._value=t.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:i}),this._gpuVector}createGPUVectorView(e){let t=e.name??this._id??"vector",i=e.format??this.format??function(e,t,i=!1){return t>=1&&t<=4?g(e,t,i):void 0}(this.type,this.size,this.normalized);if(e.interleaved){var r;let i,n="object"==typeof e.interleaved&&e.interleaved.attributes?e.interleaved.attributes:(r=this,function e(t,i,r){let n=t.source;if(n&&!(n instanceof h)&&"interleave"===n.name){for(let t of Object.values(n.inputs))t instanceof h&&e(t,i,r);return}i.push({attribute:t.id??t.toString(),format:g(t.type,t.size,t.normalized),byteOffset:r.byteOffset}),r.byteOffset+=t.ValueType.BYTES_PER_ELEMENT*t.size}(r,i=[],{byteOffset:0}),i);return new a.M({type:"interleaved",name:t,buffer:e.buffer,format:e.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:n,ownsBuffer:!1})}return new a.M({type:"buffer",name:t,buffer:e.buffer,format:i,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(e){let t=this._targetBuffer;if(!t)return u.R.createOrReuse(e,Math.max(this.offset+this.byteLength,this._value?.byteLength??0));if(t.buffer.device!==e)throw Error("GPUDataEvaluator target buffer belongs to a different device");let i=this.ValueType.BYTES_PER_ELEMENT*this.size,r=0===this.length?0:(this.length-1)*t.byteStride+i;if(t.byteOffset+r>t.buffer.byteLength)throw Error("GPUDataEvaluator target buffer is too small for the output layout");return this._offset=t.byteOffset,this._stride=t.byteStride,this._byteLength=r,this._bufferOwnership="borrowed",this._targetBuffer=void 0,t.buffer}async readValue(e=0,t){this.assertScopeAccess();let{ValueType:i}=this,{size:r,offset:n,stride:s,length:o}=this,a=i.BYTES_PER_ELEMENT*r;if(t=t??o,t=Math.max(e=Math.max(0,Math.min(o,e)),Math.min(o,t)),this._value)return function(e,t,i,r){let{ValueType:n,size:s,offset:o,stride:a}=e,l=a/n.BYTES_PER_ELEMENT,c=o/n.BYTES_PER_ELEMENT,u=r-i;if(l===s){let e=c+i*l;return t.subarray(e,e+u*s)}let h=new n(u*s);for(let e=0;e<u;e++){let r=c+(i+e)*l;h.set(t.subarray(r,r+s),e*s)}return h}(this,this._value,e,t);let l=t-e;if(0===l)return new i(0);let c=n+e*s,u=await this.buffer.readAsync(c,s===a?l*a:(l-1)*s+a),h=new i(u.buffer,u.byteOffset,u.byteLength/i.BYTES_PER_ELEMENT);if(s===a)return h;let d=new Uint8Array(a*l);for(let e=0;e<l;e++){let t=e*s;d.set(u.subarray(t,t+a),e*a)}return new i(d.buffer)}async ensureCPUValue(){this.assertScopeAccess();let e=this.value;if(e)return e;let t=await this.buffer.readAsync(0,this.offset+this.byteLength);if(t.byteLength%this.ValueType.BYTES_PER_ELEMENT!=0)throw Error(`${this} backing buffer byte length is not aligned to its scalar type`);let i=t.slice();return this._value=new this.ValueType(i.buffer,i.byteOffset,i.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){this.assertScopeAccess();let e=this.value;if(e)return e;throw Error(`${this} CPU value is not available for synchronous evaluation`)}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error("Evaluator is retained by an unsubmitted scope")}toString(){return this._id??this.source?.toString()??this.constructor.name}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error("Cannot invalidate a destroyed evaluator");if((this.source||"borrowed"===this._bufferOwnership)&&(this._value=void 0),(this.source||"borrowed"!==this._bufferOwnership)&&this._gpuVector){let e=p(this._gpuVector);"owned"===this._bufferOwnership?u.R.recycle(e):this.source instanceof h||(this._targetBuffer={buffer:e,byteOffset:this.offset,byteStride:this.stride}),this._gpuVector=void 0}}destroy(){this.assertScopeAccess(),this._gpuVector&&("owned"===this._bufferOwnership&&u.R.recycle(p(this._gpuVector)),this._gpuVector=void 0),this._targetBuffer=void 0,this._destroyed=!0}}function d(e){if(e instanceof h)return e;if("number"==typeof e||Array.isArray(e))return h.fromConstant(e);if(e instanceof l.L)return h.fromGPUData(e);if(e instanceof o.I)return h.fromGPUDataView(e);throw Error("getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]")}function f(e){let t=(0,c.Ft)(e.format),i=(0,n.Y0)(t.signedDataType),r=i.BYTES_PER_ELEMENT*t.components;if(t.byteLength!==r)throw Error(`GPUDataEvaluator does not support packed vertex format ${e.format}: ${t.byteLength} physical bytes cannot expose ${t.components} ${t.signedDataType} components`);if(e.byteOffset%i.BYTES_PER_ELEMENT!=0||e.byteStride%i.BYTES_PER_ELEMENT!=0)throw Error(`GPUDataEvaluator requires ${e.format} offset and stride aligned to ${i.BYTES_PER_ELEMENT} bytes`);return{type:t.signedDataType,size:t.components,offset:e.byteOffset,stride:e.byteStride,normalized:t.normalized,length:e.length,format:e.format}}function p(e){let t=function(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${e.name}"`);return t}(e).buffer;return t instanceof s.kL?t.buffer:t}function g(e,t,i=!1){if(t<1||t>4)throw Error(`Cannot synthesize a GPUVector vertex format with ${t} components`);if("float16"===e&&3===t&&!i)return"uint16x3-webgl";let r=e;if(i)switch(e){case"uint8":r="unorm8";break;case"sint8":r="snorm8";break;case"uint16":r="unorm16";break;case"sint16":r="snorm16";break;case"float32":r="float32";break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}return("uint8"===r||"sint8"===r||"uint16"===r||"sint16"===r||"unorm8"===r||"snorm8"===r||"unorm16"===r||"snorm16"===r)&&3===t?`${r}x3-webgl`:`${r}${1===t?"":`x${t}`}`}},89362(e,t,i){i.d(t,{r:()=>o});var r=i(58006),n=i(61954),s=i(46296);function o(e,t){let i=new Map,o=[],a=new Set;return Object.freeze({outputs:Object.freeze(e.map(function e(l){(0,r.v)(!a.has(l));let c=i.get(l);if(c)return c;let u=t?.(l,i.size)??`value-${i.size}`;a.add(l),i.set(l,u);let h=l.source,d=h instanceof s.GL,f=(d?[h]:h?.dependencies??[]).map(e);return o.push(Object.freeze({id:u,label:l.id,kind:d?"alias":h?"operation":"source",operation:h&&!d?h.name:void 0,dependencies:Object.freeze(f),type:l.type,size:l.size,format:function(e){if(e.format)return e.format;let t=e.size;if(1===t||2===t||3===t||4===t){if(3===t&&!e.normalized&&("uint8"===e.type||"sint8"===e.type))return"uint8"===e.type?"uint8x3-webgl":"sint8x3-webgl";try{return n.E.makeVertexFormat(e.type,t,e.normalized)}catch{return}}}(l),length:l.length,normalized:l.normalized,isConstant:l.isConstant,offset:l.offset,stride:l.stride,byteLength:l.byteLength,evaluated:l.evaluated})),a.delete(l),u})),nodes:Object.freeze(o)})}},8663(e,t,i){i.d(t,{E:()=>r});let r={add:{arity:2,symbol:"arithmetic_add"},subtract:{arity:2,symbol:"arithmetic_subtract"},multiply:{arity:2,symbol:"arithmetic_multiply"},divide:{arity:2,symbol:"arithmetic_divide"},pow:{arity:2,symbol:"pow"},sqrt:{arity:1,symbol:"sqrt"},abs:{arity:1,symbol:"abs"},sin:{arity:1,symbol:"sin"},cos:{arity:1,symbol:"cos"},tan:{arity:1,symbol:"arithmetic_tan"},exp:{arity:1,symbol:"exp"},log:{arity:1,symbol:"log"}}},24789(e,t,i){i.d(t,{K:()=>s});var r=i(6772),n=i(35098);let s=({inputs:e,output:t,target:i})=>o(e,t,i);async function o(e,t,i){let s=await e.source.ensureCPUValue(),o=(0,n.Ft)(e.inputFormat),l=(0,n.Ft)(e.outputFormat),c=new t.ValueType(t.length*t.size),u=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,h=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let i=0;i<t.length;i++)for(let n=0;n<t.size;n++){let d=function(e,t,i){if("float16"===t)return(0,r.U)(e);if(!i)return e;let{minimum:n,maximum:s}=a(t);return Math.max(e/s,n<0?-1:0)}(s[u+i*h+n],e.source.type,o.normalized);c[i*t.size+n]=function(e,t,i){if("float16"===t.type)return(0,r.X)(e);if(!i&&"float32"===t.type)return e;let{minimum:n,maximum:s}=a(t.type),o=i?e*s:e;return Math.round(Math.min(s,Math.max(n,o)))}(d,t,l.normalized)}return i.write(c),{success:!0,value:c}}function a(e){switch(e){case"sint8":return{minimum:-127,maximum:127};case"sint16":return{minimum:-32767,maximum:32767};case"sint32":return{minimum:-0x80000000,maximum:0x7fffffff};case"uint8":return{minimum:0,maximum:255};case"uint16":return{minimum:0,maximum:65535};case"uint32":return{minimum:0,maximum:0xffffffff};default:throw Error(`castData CPU output does not support ${e}`)}}},76159(e,t,i){i.d(t,{K:()=>a});var r=i(58006),n=i(35098);class s{buffer;format;length;valueLength;byteOffset;byteStride;rowByteLength;valueOffsets;nullBitmap;constructor(e){let t=(0,n.Ft)(e.format),i=ArrayBuffer.isView(e.buffer)?e.buffer:void 0;this.buffer=i?i.buffer:e.buffer,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength??e.length*(t.listSize??1);let s=e.byteOffset??0;this.byteOffset=(i?.byteOffset??0)+s,this.rowByteLength=e.rowByteLength??t.byteLength,this.byteStride=e.byteStride??this.rowByteLength,this.valueOffsets=e.valueOffsets,this.nullBitmap=e.nullBitmap;let o=t.vertexList||t.valueList,a=o?this.valueLength:this.length;(0,r.v)([this.length,this.valueLength,s,this.rowByteLength,this.byteStride].every(e=>Number.isSafeInteger(e)&&e>=0)),(0,r.v)(this.rowByteLength>=t.byteLength&&this.byteStride>=this.rowByteLength),(0,r.v)(o||this.valueLength===this.length*(t.listSize??1)),(0,r.v)(s+(a?(a-1)*this.byteStride+this.rowByteLength:0)<=e.buffer.byteLength)}}var o=i(6772);let a=async({inputs:e,target:t})=>{let{source:i,inputFormat:a,outputFormat:l}=e,c=function(e,t,i){let a=(0,n.Ft)(e.format),l=i?.startsWith("float16")?"float16":a.signedDataType,c=i?.endsWith("x3")?3:a.components;(0,r.v)((3===c||4===c)&&["uint8","float16","float32"].includes(l));let u="uint8"===l?1:"float16"===l?2:4,h=new DataView(e.buffer,e.byteOffset),d="unorm8x4"===t?new Uint8Array(4*e.length):"float16x4"===t?new Uint16Array(4*e.length):new Float32Array(4*e.length),f=new DataView(new ArrayBuffer(4));for(let i=0;i<e.length;i++)for(let r=0;r<4;r++){let n=i*e.byteStride+r*u,s=r>=c?1:"uint8"===l?h.getUint8(n)/255:"float16"===l?(0,o.U)(h.getUint16(n,!0)):h.getFloat32(n,!0);d[4*i+r]="unorm8x4"===t?Math.round(255*Math.min(Math.max(s,0),1)):"float16x4"===t?function(e,t){t.setFloat32(0,e,!0);let i=t.getUint32(0,!0),r=i>>>16&32768,n=i>>>23&255,s=8388607&i;if(255===n)return 31744|r|512*!!s;if(n>142)return 31744|r;if(n<102)return r;let o=n<113?8388608|s:s,a=2**(n<113?126-n:13),l=Math.floor(o/a),c=o%a;return r|(n<113?0:(n-112)*1024)+(l+(c>a/2||c===a/2&&l%2?1:0))}(s,f):s}return new s({buffer:d,format:t,length:e.length,nullBitmap:e.nullBitmap&&new Uint8Array(e.nullBitmap)})}(new s({buffer:await i.ensureCPUValue(),format:i.format??("uint8x3"===a?"uint8x3-webgl":"float16x3"===a?"uint16x3-webgl":a),length:i.length,byteOffset:i.offset,byteStride:i.stride}),l,a),u=new Uint8Array(c.buffer,c.byteOffset,c.length*c.byteStride);return t.write(u),{success:!0}}},14659(e,t,i){function r(e,t){var i;let r=Number.isFinite(i=t)&&i>0?Math.floor(i):65535,n=Math.max(1,Math.ceil(e)),s=Math.min(n,r),o=Math.min(Math.ceil(n/s),r),a=Math.ceil(n/s/o);if(a>r)throw Error(`WebGPU dispatch requires ${n} workgroups, exceeding the 3D dispatch limit of ${r} per dimension`);return{x:s,y:o,z:a}}function n(e,t="workgroupId"){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function s(e,t,i="workgroupId",r="localId"){return`(${n(e,i)} * ${t}u + ${r}.x)`}i.d(t,{B:()=>n,BB:()=>r,vL:()=>s})},70025(e,t,i){function r(e,t){switch(e){case"u32":return`${t}u`;case"f32":return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function n(e,t){switch(e){case"uint32":return r("u32",Math.trunc(t));case"sint32":return`${Math.trunc(t)}`;case"float32":return r("f32",t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function s(e){switch(e){case"uint32":return"0u";case"sint32":return"0";case"float32":return"0.0";default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function o(e){switch(e){case"uint32":return"u32";case"sint32":return"i32";case"float32":return"f32";default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}i.d(t,{C1:()=>n,Lm:()=>r,_1:()=>s,iP:()=>o})},57092(e,t,i){i.d(t,{P:()=>c,g:()=>u});var r=i(8982),n=i(44060),s=i(3687),o=i(14659),a=i(70025);let l=new s.R;function c(e){return!e.isConstant||!e.value}function u({scope:e,module:t,elementWise:i=!1,expression:s,inputs:h,output:d,operationType:f=d.type,outputBuffer:p}){var g,m,_,v;let y,b,w,E;if(!t.source)throw Error(`WebGPU kernel ${t.name} requires WGSL source`);let P=Array.isArray(g=h)?g.map((e,t)=>[`x${t}`,e]):Object.entries(g),x=P.map(([e,t])=>({name:e,input:t})),S=x.filter(({input:e})=>c(e)).map((e,t)=>({...e,index:t})),T=(0,a.iP)(f),M=(0,a.iP)(d.type),C={TYPE:T,RESULT_LEN:d.size.toString()},A=(0,o.BB)(Math.ceil(d.length/64),p.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of P)C[`${e.toUpperCase()}_LEN`]=t.size.toString();let O=`
${function(e,t){for(let i in t)e=e.replaceAll(`{${i}}`,t[i]);return e}(t.source,C)}
${S.map(({name:e,input:t,index:i})=>{var r,n,s;let o;return r=e,n=t,s=i,o=(0,a.iP)(n.type),`@group(0) @binding(${s}) var<storage, read> ${r}: array<${o}>;`}).join("\n")}
${x.map(({name:e,input:t})=>{var i,r,n;let s,o,l,u;return i=e,r=t,n=f,s=(0,a.iP)(n),o=r.type===n?"":s,l=r.stride/r.ValueType.BYTES_PER_ELEMENT,u=r.offset/r.ValueType.BYTES_PER_ELEMENT,c(r)?`fn read_${i}(rowIndex: u32) -> array<${s}, ${r.size}> {
  var value: array<${s}, ${r.size}>;
  let rowOffset = ${u}u + ${r.isConstant?"0u":"rowIndex"} * ${l}u;
${Array.from({length:r.size},(e,t)=>o?`  value[${t}] = ${o}(${i}[rowOffset + ${t}u]);`:`  value[${t}] = ${i}[rowOffset + ${t}u];`).join("\n")}
  return value;
}`:`fn read_${i}(_rowIndex: u32) -> array<${s}, ${r.size}> {
  return array<${s}, ${r.size}>(${function(e,t){let i=e.value;if(!i)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>(0,a.Lm)(t,i[r]??0)).join(", ")}(r,o)});
}`}).join("\n")}
${(m=d,_=S.length,y=(0,a.iP)(m.type),`@group(0) @binding(${_}) var<storage, read_write> result: array<${y}>;`)}
${(b=(v=d).stride/v.ValueType.BYTES_PER_ELEMENT,w=v.offset/v.ValueType.BYTES_PER_ELEMENT,E=(0,a.iP)(v.type),`fn write_result(rowIndex: u32, value: array<${E}, ${v.size}>) {
  let rowOffset = ${w}u + rowIndex * ${b}u;
${Array.from({length:v.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join("\n")}
}`)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${(0,o.vL)(A,64)};
  if (rowIndex >= ${d.length}u) {
    return;
  }

${x.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join("\n")}
  var result: array<${M}, ${d.size}>;
${function(e,t,i,r,n){let s="";if(n)for(let e=0;e<i.size;e++)s+=`  result[${e}] = ${n(e)};
`;else if(r){let r=(0,a._1)(i.type),n=(0,a.iP)(i.type);for(let o=0;o<i.size;o++){let i=t.map(([e,t])=>o<t.size?(0,a.iP)(t.type)===n?`${e}[${o}]`:`${n}(${e}[${o}])`:r);s+=`  result[${o}] = ${e}(${i.join(", ")});
`}}else s+=`result = ${e}(${t.map(([e])=>e).join(", ")});`;return s.trimEnd()}(t.name,P,d,i,s)}
  write_result(rowIndex, result);
}
`,k=l.assembleWGSLShader({platformInfo:(0,n.O)(p.device),source:O,modules:t.dependencies,shaderStage:"compute",scanVertexAttributes:!1}),I=new r.M(p.device,{source:k.source,shaderLayout:{bindings:[...S.map(({name:e},t)=>({name:e,type:"storage",group:0,location:t})),{name:"result",type:"storage",group:0,location:S.length}]}});e&&e.retain(()=>I.destroy());let L=Object.fromEntries(S.map(({name:e,input:t})=>[e,t.buffer]));L.result=p;let R=e?e.commandEncoder.beginComputePass({}):p.device.beginComputePass({});p.device.statsManager.getStats("GPGPU Operation Counts").get("Computation Runs").incrementCount(),I.dispatch(R,{bindings:L,...A}),R.end(),e||(p.device.submit(),I.destroy())}},60138(e,t,i){i.d(t,{C:()=>n});var r=i(57092);let n=({inputs:e,output:t,target:i,scope:n})=>{let s=e.map((e,t)=>[`x${t}`,e]);var o=i.device.limits,a=s;let l=a.filter(([,e])=>(0,r.P)(e)).length+1;if(l>o.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${l} storage buffers, exceeding device limit ${o.maxStorageBuffersPerShaderStage}`);if(l>o.maxBindingsPerBindGroup)throw Error(`interleave() requires ${l} bindings, exceeding bind group limit ${o.maxBindingsPerBindGroup}`);let c=s.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(", "),u=0,h=s.map(([e,t])=>{let i=Array.from({length:t.size},(t,i)=>`  out[${u+i}] = ${e}[${i}];`).join("\n");return u+=t.size,i}).join("\n"),d=`\
fn interleave(${c}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${h}
  return out;
}
`;return(0,r.g)({scope:n,module:{name:"interleave",source:d},inputs:e,output:t,outputBuffer:i}),{success:!0}};n.supportsEvaluationScope=!0},96002(e,t,i){i.d(t,{R:()=>n});var r=i(8994);let n=new class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(e,t){if(t>e.limits.maxBufferSize)throw Error(`Buffer pool cannot allocate ${t} bytes: device.limits.maxBufferSize is ${e.limits.maxBufferSize}`);let i=this.bufferPools.get(e),n=i?i.findIndex(e=>e.byteLength>=t):-1;if(n<0)return e.createBuffer({usage:r.h.VERTEX|r.h.STORAGE|r.h.COPY_DST|r.h.COPY_SRC,byteLength:t});let[s]=i.splice(n,1);return s}recycle(e){let t=e.device;this.bufferPools.has(t)||this.bufferPools.set(t,[]);let i=this.bufferPools.get(t),r=i.findIndex(t=>t.byteLength>e.byteLength);r<0?i.push(e):i.splice(r,0,e),this.purge()}purge(){for(let[e,t]of this.bufferPools){let i=e.isLost?0:this.poolSize;for(;t.length>i;)t.shift().destroy();0===t.length&&this.bufferPools.delete(e)}}}},34353(e,t,i){function r(e,t=!0){return e??t}function n(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}function s(e,t=!0){let i=n(e.slice(0,3),t),r=Number.isFinite(e[3]),o=r?e[3]:1;return[i[0],i[1],i[2],t&&r?o/255:o]}i.d(t,{eS:()=>r,jI:()=>s,sC:()=>n})},63702(e,t,i){i.d(t,{Wk:()=>s});let r=`\
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`,n=`#version 300 es
${r}`;function s(e){let{input:t,inputChannels:i,output:r}=e||{};if(!t)return n;if(!i)throw Error("inputChannels");let s=function(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`invalid channels: ${e}`)}}(i),o=function(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}(t,i);return`\
#version 300 es
in ${s} ${t};
out vec4 ${r};
void main() {
  ${r} = ${o};
}`}},6772(e,t,i){i.d(t,{U:()=>c,X:()=>l});var r=i(49105);let n=null,s=new ArrayBuffer(4),o=new Float32Array(s),a=new Uint32Array(s);function l(e){n||=u(),e=(0,r.qE)(e,-65504,65504),o[0]=e;let t=a[0],i=t>>23&511;return n.baseTable[i]+((8388607&t)>>n.shiftTable[i])}function c(e){n||=u();let t=e>>10;return a[0]=n.mantissaTable[n.offsetTable[t]+(1023&e)]+n.exponentTable[t],o[0]}function u(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let i=0;i<256;++i){let r=i-127;r<-27?(e[i]=0,e[256|i]=32768,t[i]=24,t[256|i]=24):r<-14?(e[i]=1024>>-r-14,e[256|i]=1024>>-r-14|32768,t[i]=-r-1,t[256|i]=-r-1):r<=15?(e[i]=r+15<<10,e[256|i]=r+15<<10|32768,t[i]=13,t[256|i]=13):r<128?(e[i]=31744,e[256|i]=64512,t[i]=24,t[256|i]=24):(e[i]=31744,e[256|i]=64512,t[i]=13,t[256|i]=13)}let i=new Uint32Array(2048),r=new Uint32Array(64),n=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;(8388608&t)==0;)t<<=1,r-=8388608;t&=-8388609,r+=0x38800000,i[e]=t|r}for(let e=1024;e<2048;++e)i[e]=0x38000000+(e-1024<<13);for(let e=1;e<31;++e)r[e]=e<<23;r[31]=0x47800000,r[32]=0x80000000;for(let e=33;e<63;++e)r[e]=0x80000000+(e-32<<23);r[63]=0xc7800000;for(let e=1;e<64;++e)32!==e&&(n[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:i,exponentTable:r,offsetTable:n}}},5652(e,t,i){i.d(t,{i:()=>r});let r={name:"fp32",source:`\
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
`}},29947(e,t,i){function r(){let e;if("u">typeof window&&window.performance)e=window.performance.now();else if("u">typeof process&&process.hrtime){let t=process.hrtime();e=1e3*t[0]+t[1]/1e6}else e=Date.now();return e}i.d(t,{A:()=>s});class n{constructor(e,t){this.sampleSize=1,this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this.name=e,this.type=t,this.reset()}reset(){return this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this}setSampleSize(e){return this.sampleSize=e,this}incrementCount(){return this.addCount(1),this}decrementCount(){return this.subtractCount(1),this}addCount(e){return this._count+=e,this._samples++,this._checkSampling(),this}subtractCount(e){return this._count-=e,this._samples++,this._checkSampling(),this}addTime(e){return this._time+=e,this.lastTiming=e,this._samples++,this._checkSampling(),this}timeStart(){return this._startTime=r(),this._timerPending=!0,this}timeEnd(){return this._timerPending&&(this.addTime(r()-this._startTime),this._timerPending=!1,this._checkSampling()),this}getSampleAverageCount(){return this.sampleSize>0?this.lastSampleCount/this.sampleSize:0}getSampleAverageTime(){return this.sampleSize>0?this.lastSampleTime/this.sampleSize:0}getSampleHz(){return this.lastSampleTime>0?this.sampleSize/(this.lastSampleTime/1e3):0}getAverageCount(){return this.samples>0?this.count/this.samples:0}getAverageTime(){return this.samples>0?this.time/this.samples:0}getHz(){return this.time>0?this.samples/(this.time/1e3):0}_checkSampling(){this._samples===this.sampleSize&&(this.lastSampleTime=this._time,this.lastSampleCount=this._count,this.count+=this._count,this.time+=this._time,this.samples+=this._samples,this._time=0,this._count=0,this._samples=0)}}class s{constructor(e){this.stats={},this.id=e.id,this.stats={},this._initializeStats(e.stats),Object.seal(this)}get(e,t="count"){return this._getOrCreate({name:e,type:t})}get size(){return Object.keys(this.stats).length}reset(){for(let e of Object.values(this.stats))e.reset();return this}forEach(e){for(let t of Object.values(this.stats))e(t)}getTable(){let e={};return this.forEach(t=>{e[t.name]={time:t.time||0,count:t.count||0,average:t.getAverageTime()||0,hz:t.getHz()||0}}),e}_initializeStats(e=[]){e.forEach(e=>this._getOrCreate(e))}_getOrCreate(e){let{name:t,type:i}=e,r=this.stats[t];return r||(r=e instanceof n?e:new n(t,i),this.stats[t]=r),r}}},92767(e,t,i){var r,n,s,o,a,l;i.d(t,{Cx:()=>j,uq:()=>U,Cp:()=>B,EU:()=>er,h1:()=>V}),(o=r||(r={}))[o.Start=1]="Start",o[o.Move=2]="Move",o[o.End=4]="End",o[o.Cancel=8]="Cancel",(a=n||(n={}))[a.None=0]="None",a[a.Left=1]="Left",a[a.Right=2]="Right",a[a.Up=4]="Up",a[a.Down=8]="Down",a[a.Horizontal=3]="Horizontal",a[a.Vertical=12]="Vertical",a[a.All=15]="All",(l=s||(s={}))[l.Possible=1]="Possible",l[l.Began=2]="Began",l[l.Changed=4]="Changed",l[l.Ended=8]="Ended",l[l.Recognized=8]="Recognized",l[l.Cancelled=16]="Cancelled",l[l.Failed=32]="Failed";let c="manipulation";class u{constructor(e,t){this.actions="",this.manager=e,this.set(t)}set(e){"compute"===e&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));var t=e.join(" ");if(t.includes("none"))return"none";let i=t.includes("pan-x"),r=t.includes("pan-y");return i&&r?"none":i||r?i?"pan-x":"pan-y":t.includes(c)?c:"auto"}}function h(e){return e.trim().split(/\s+/g)}function d(e,t,i){if(e)for(let r of h(t))e.addEventListener(r,i,!1)}function f(e,t,i){if(e)for(let r of h(t))e.removeEventListener(r,i,!1)}function p(e){return(e.ownerDocument||e).defaultView}function g(e){let t=e.length;if(1===t)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let i=0,r=0,n=0;for(;n<t;)i+=e[n].clientX,r+=e[n].clientY,n++;return{x:Math.round(i/t),y:Math.round(r/t)}}function m(e){let t=[],i=0;for(;i<e.pointers.length;)t[i]={clientX:Math.round(e.pointers[i].clientX),clientY:Math.round(e.pointers[i].clientY)},i++;return{timeStamp:Date.now(),pointers:t,center:g(t),deltaX:e.deltaX,deltaY:e.deltaY}}function _(e,t){let i=t.x-e.x,r=t.y-e.y;return Math.sqrt(i*i+r*r)}function v(e,t){let i=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(i*i+r*r)}function y(e,t){let i=t.clientX-e.clientX;return 180*Math.atan2(t.clientY-e.clientY,i)/Math.PI}function b(e,t){return e===t?n.None:Math.abs(e)>=Math.abs(t)?e<0?n.Left:n.Right:t<0?n.Up:n.Down}function w(e,t,i){return{x:t/e||0,y:i/e||0}}function E(e,t){return"pointerId"in e?e.pointerId:t}function P(e,t){e.movementOrigin=new Map(t.map((e,t)=>[E(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}class x{constructor(e){this.evEl="",this.evWin="",this.evTarget="",this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){var i;let n,s,o,a,l;i=this.manager,n=t.pointers.length,s=t.changedPointers.length,o=e&r.Start&&n-s==0,a=e&(r.End|r.Cancel)&&n-s==0,t.isFirst=!!o,t.isFinal=!!a,o&&(i.session={}),t.eventType=e,l=function(e,t){var i,n;let s,o,a,l,c,{session:u}=e,{pointers:h}=t,{length:d}=h;u.firstInput||(u.firstInput=m(t)),d>1&&!u.firstMultiple?u.firstMultiple=m(t):1===d&&(u.firstMultiple=!1);let{firstInput:f,firstMultiple:p}=u,x=p?p.center:f.center,S=t.center=g(h);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-f.timeStamp;let T=t.pointers.map(E);if(u.movementOrigin?.size===T.length&&T.every(e=>u.movementOrigin.has(e))||P(u,t.pointers),t.distancePerPointer=t.pointers.map((e,t)=>v(u.movementOrigin.get(T[t]),e)),t.eventType&r.Move&&t.distancePerPointer.some(e=>e>0)&&(u.firstMovementTime??(u.firstMovementTime=t.timeStamp)),t.movementDeltaTime=void 0===u.firstMovementTime?0:t.timeStamp-u.firstMovementTime,t.eventType&(r.End|r.Cancel)){let e=t.changedPointers.map(e=>E(e,t.pointers.indexOf(e)));P(u,t.pointers.filter((t,i)=>!e.includes(T[i])))}s=S.x-x.x,t.angle=180*Math.atan2(S.y-x.y,s)/Math.PI,t.distance=_(x,S);let{deltaX:M,deltaY:C}=(o=t.center,a=u.offsetDelta,l=u.prevDelta,c=u.prevInput,(t.eventType===r.Start||c?.eventType===r.End)&&(l=u.prevDelta={x:c?.deltaX||0,y:c?.deltaY||0},a=u.offsetDelta={x:o.x,y:o.y}),{deltaX:l.x+(o.x-a.x),deltaY:l.y+(o.y-a.y)});t.deltaX=M,t.deltaY=C,t.offsetDirection=b(t.deltaX,t.deltaY);let A=w(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=A.x,t.overallVelocityY=A.y,t.overallVelocity=Math.abs(A.x)>Math.abs(A.y)?A.x:A.y,t.scale=p?(i=p.pointers,v(h[0],h[1])/v(i[0],i[1])):1,t.rotation=p?(n=p.pointers,y(h[1],h[0])-y(n[1],n[0])):0,t.maxPointers=u.prevInput?t.pointers.length>u.prevInput.maxPointers?t.pointers.length:u.prevInput.maxPointers:t.pointers.length;let O=e.element;return function(e,t){let i=e;for(;i;){if(i===t)return!0;i=i.parentNode}return!1}(t.srcEvent.target,O)&&(O=t.srcEvent.target),t.target=O,!function(e,t){let i,n,s,o,a=e.lastInterval||t,l=t.timeStamp-a.timeStamp;if(t.eventType!==r.Cancel&&(l>25||void 0===a.velocity)){let r=t.deltaX-a.deltaX,c=t.deltaY-a.deltaY,u=w(l,r,c);n=u.x,s=u.y,i=Math.abs(u.x)>Math.abs(u.y)?u.x:u.y,o=b(r,c),e.lastInterval=t}else i=a.velocity,n=a.velocityX,s=a.velocityY,o=a.direction;t.velocity=i,t.velocityX=n,t.velocityY=s,t.direction=o}(u,t),t}(i,t),i.emit("hammer.input",l),i.recognize(l),i.session.prevInput=l}init(){d(this.element,this.evEl,this.domHandler),d(this.target,this.evTarget,this.domHandler),d(p(this.element),this.evWin,this.domHandler)}destroy(){f(this.element,this.evEl,this.domHandler),f(this.target,this.evTarget,this.domHandler),f(p(this.element),this.evWin,this.domHandler)}}let S={pointerdown:r.Start,pointermove:r.Move,pointerup:r.End,pointercancel:r.Cancel,pointerout:r.Cancel};class T extends x{constructor(e){super(e),this.evEl="pointerdown",this.evWin="pointermove pointerup pointercancel",this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,i=!1,n=S[e.type],s=e.pointerType,o="touch"===s,a=t.findIndex(t=>t.pointerId===e.pointerId);n&r.Start&&(e.buttons||o)?a<0&&(t.push(e),a=t.length-1):n&(r.End|r.Cancel)&&(i=!0),!(a<0)&&(t[a]=e,this.callback(n,{pointers:t,changedPointers:[e],eventType:n,pointerType:s,srcEvent:e}),i&&t.splice(a,1))}}let M=["","webkit","Moz","MS","ms","o"],C={touchAction:"compute",enable:!0,inputTarget:null,cssProps:{userSelect:"none",userDrag:"none",touchCallout:"none",tapHighlightColor:"rgba(0,0,0,0)"}};class A{constructor(e,t){this.options={...C,...t,cssProps:{...C.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new T(this),this.touchAction=new u(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?2:1}recognize(e){let t,{session:i}=this;if(i.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let{recognizers:r}=this,{curRecognizer:n}=i;(!n||n&&n.state&s.Recognized)&&(n=i.curRecognizer=null);let o=0;for(;o<r.length;)t=r[o],2!==i.stopped&&(!n||t===n||t.canRecognizeWith(n))?t.recognize(e):t.reset(),!n&&t.state&(s.Began|s.Changed|s.Ended)&&(n=i.curRecognizer=t),o++}get(e){let{recognizers:t}=this;for(let i=0;i<t.length;i++)if(t[i].options.event===e)return t[i];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t="string"==typeof e?this.get(e):e;if(t){let{recognizers:e}=this,i=e.indexOf(t);-1!==i&&(e.splice(i,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:i}=this;for(let r of h(e))i[r]=i[r]||[],i[r].push(t)}off(e,t){if(!e)return;let{handlers:i}=this;for(let r of h(e))t?i[r]&&i[r].splice(i[r].indexOf(t),1):delete i[r]}emit(e,t){let i=this.handlers[e]&&this.handlers[e].slice();if(!i||!i.length)return;t.type=e,t.preventDefault=function(){t.srcEvent.preventDefault()};let r=0;for(;r<i.length;)i[r](t),r++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[i,r]of Object.entries(this.options.cssProps)){let n=function(e,t){let i=t[0].toUpperCase()+t.slice(1);for(let r of M){let n=r?r+i:t;if(n in e)return n}}(t.style,i);e?(this.oldCssProps[n]=t.style[n],t.style[n]=r):t.style[n]=this.oldCssProps[n]||""}e||(this.oldCssProps={})}}}let O=1;function k(e){return e&s.Cancelled?"cancel":e&s.Ended?"end":e&s.Changed?"move":e&s.Began?"start":""}class I{constructor(e){this.options=e,this.id=O++,this.state=s.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:i}=this;return i[t.id]||(i[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}return(t="string"==typeof e?this.manager.get(e):e)&&delete this.simultaneous[t.id],this}requireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:i}=this;return -1===i.indexOf(t)&&(i.push(t),t.requireFailure(this)),this}dropRequireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}if(t="string"==typeof e?this.manager.get(e):e){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<s.Ended&&this.manager.emit(this.options.event+k(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=s.Ended&&this.manager.emit(this.options.event+k(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=s.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(s.Failed|s.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=s.Failed;return}this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible),this.state=this.process(t),this.state&(s.Began|s.Changed|s.Ended|s.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}}class L extends I{attrTest(e){let t=this.options.pointers;return 0===t||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>{var i,r;return i=e,(void 0===(r=t).distance||i.distance>=r.distance)&&(void 0===r.distancePerPointer||i.distancePerPointer.length>0&&i.distancePerPointer.every(e=>e>=r.distancePerPointer))&&(void 0===r.movementDeltaTime||i.movementDeltaTime>=r.movementDeltaTime)&&(void 0===r.rotation||Math.abs(((i.rotation+180)%360+360)%360-180)>=r.rotation)&&(void 0===r.scale||Math.abs(i.scale-1)>=r.scale)})}process(e){let{state:t}=this,{eventType:i}=e,n=t&(s.Began|s.Changed),o=this.attrTest(e);return n&&(i&r.Cancel||!o)?t|s.Cancelled:n||o?i&r.End?t|s.Ended:t&s.Began?t|s.Changed:s.Began:s.Failed}}let R=["","start","move","end","cancel"];class B extends I{constructor(e={}){super({enable:!0,event:"doubleclickdrag",pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[c]}getEventNames(){return R.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length!==t.pointers?(this.reset(),s.Failed):e.eventType&r.Start?this._handleStart(e):e.eventType&r.Move?this._handleMove(e):e.eventType&r.Cancel?this._handleEnd(e,!0):e.eventType&r.End?this._handleEnd(e,!1):s.Failed}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===s.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===s.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===s.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===s.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,s.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,s.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return s.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?s.Began:(this._drag.active=!0,e.scale=Math.pow(2,t/this.options.pixelsPerScale),this._emittedStart?s.Changed:s.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:i,startCenter:r}=this._drag;if(this._drag=null,this._tapStart=null,this._lastTap=null,!i)return this._emittedStart=!1,s.Failed;let n=r.y-e.center.y;return e.scale=Math.pow(2,n/this.options.pixelsPerScale),t?s.Cancelled:s.Ended}return this._tapStart&&this._isSamePointer(e,this._tapStart.pointerId)?(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null):t&&this.reset(),s.Failed}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&_(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return"pointerId"in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return null===t||this._getPointerId(e)===t}}class j extends I{constructor(e={}){super({enable:!0,event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[c]}process(e){let{options:t}=this,i=e.pointers.length===t.pointers,n=e.distance<t.threshold,o=e.deltaTime<t.time;if(this.reset(),e.eventType&r.Start&&0===this.count)return this.failTimeout();if(n&&o&&i){if(e.eventType!==r.End)return this.failTimeout();let i=!this.pTime||e.timeStamp-this.pTime<t.interval,n=!this.pCenter||_(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,n&&i?this.count+=1:this.count=1,this._input=e,0==this.count%t.taps)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=s.Recognized,this.tryEmit(this._input)},t.interval),s.Began):s.Recognized}return s.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=s.Failed},this.options.interval),s.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===s.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}}class z extends L{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{"trackpad"===e.device&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...i}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(i),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:i}=e,r=t.deltaX??e.deltaX,n=t.deltaY??e.deltaY,s=b(r,n),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY);return{pointers:[i,i],changedPointers:[i,i],pointerType:"trackpad",srcEvent:i,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:n,angle:180*Math.atan2(n,r)/Math.PI,distance:Math.sqrt(r*r+n*n),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:s,offsetDirection:s,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:i.target||this.manager.element,additionalEvent:"",...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&2===this.options.pointers);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}}let D=["","start","move","end","cancel","up","down","left","right"];class U extends z{constructor(e={}){super({enable:!0,pointers:1,event:"pan",threshold:10,direction:n.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&n.Horizontal&&t.push("pan-y"),e&n.Vertical&&t.push("pan-x"),t}getEventNames(){return D.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,i=!0,{distance:r}=e,{direction:s}=e,o=e.deltaX,a=e.deltaY;return s&t.direction||(t.direction&n.Horizontal?(s=0===o?n.None:o<0?n.Left:n.Right,i=o!==this.pX,r=Math.abs(e.deltaX)):(s=0===a?n.None:a<0?n.Up:n.Down,i=a!==this.pY,r=Math.abs(e.deltaY))),e.direction=s,i&&r>t.threshold&&!!(s&t.direction)}attrTest(e){let t=!!(this.state&s.Began),i=!(this.options.coherent?.length&&e.eventType&(r.End|r.Cancel));return super.attrTest(e)&&(t||i&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=n[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}}let F=["","start","move","end","cancel","in","out"];class V extends z{constructor(e={}){super({enable:!0,event:"pinch",threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return["none"]}getEventNames(){return F.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,i=!!(this.state&s.Began),n=!(t&&e.eventType&(r.End|r.Cancel));return super.attrTest(e)&&(i||n&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(1!==e.scale){let t=e.scale<1?"in":"out";e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(s.Recognized|s.Cancelled|s.Failed)&&(this.state=s.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}}class N{constructor(e,t,i){this.element=e,this.callback=t,this.options=i}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}}let $=-1!==("u">typeof navigator&&navigator.userAgent?navigator.userAgent.toLowerCase():"").indexOf("firefox");class G extends N{constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&($&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=40)),e.shiftKey&&t&&(t*=.25),this.callback({type:"wheel",center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??"unknown",srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen("wheel",!0))}destroy(){this.listen("wheel",!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){"wheel"===e&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen("wheel",t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}}let W={classificationDelay:32,endDelay:80};class q{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{var t,i;let r,n;if(!this.hasSubscribers)return"unknown";let s=(t=e,i=this.pressedControlKeys.size>0,r=t.deltaX,n=t.deltaY,1===t.deltaMode&&(r*=40,n*=40),{event:t,timeStamp:t.timeStamp,deltaX:r,deltaY:n,isControlKeyDown:i}),o=this.session;if(o&&s.timeStamp-o.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return"unknown";o=null}o?(this.scheduleEnd(),this.addSample(o,s)):(o=this.startPendingSession(s),this.scheduleEnd());let{device:a}=o;return"unknown"===a&&"unknown"!==(a=H(o.samples,!1))&&this.begin(o,a),a},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||"unknown"!==this.session.device)return;let e=this.session,t=H(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)},this.end=()=>{if(!this.session)return;if("unknown"===this.session.device){let e=this.session,t=H(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)}if(!this.session)return;let e=this.session;this.emit(r.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{"Control"===e.key&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{"Control"===e.key&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...W,...t},this.element?.addEventListener("wheel",this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??"unknown"}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&"unknown"!==e.device&&this.emit(r.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener("wheel",this.handleEvent)}startPendingSession(e){let t={samples:[e],device:"unknown",firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,"unknown"!==e.device){let i=e.samples[e.samples.length-2],n=t.timeStamp-i.timeStamp;e.velocityX=n>0?t.deltaX/n:0,e.velocityY=n>0?t.deltaY/n:0,this.emit(r.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(r.Start,e.samples[0].event);let i=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=i>0?e.totalDeltaX/i:0,e.velocityY=i>0?e.totalDeltaY/i:0,this.emit(r.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,i){let n=this.session;if(!n||"unknown"===n.device)return;let s=e===r.Start,o=e===r.End||e===r.Cancel,a=s?n.firstTimeStamp:n.lastTimeStamp,l=s?0:Math.max(0,a-n.firstTimeStamp),c=s?0:n.totalDeltaX,u=s?0:n.totalDeltaY,h=l>0?c/l:0,d=l>0?u/l:0,f=s?0:i?.velocityX??n.velocityX,p=s?0:i?.velocityY??n.velocityY,g={eventType:e,device:n.device,srcEvent:t,timeStamp:a,center:{x:t.clientX,y:t.clientY},deltaX:c,deltaY:u,deltaTime:l,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(h)>Math.abs(d)?h:d,overallVelocityX:h,overallVelocityY:d,isFirst:s,isFinal:o};for(let{listener:e}of[...this.subscriptions.values()])e(g)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){null!==this.classificationTimer&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){null!==this.endTimer&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t="u">typeof window?window:globalThis.document?.defaultView;t&&e!==this.listeningForControlKeys&&(this.listeningForControlKeys=e,e?(t.addEventListener("keydown",this.handleKeyDown,!0),t.addEventListener("keyup",this.handleKeyUp,!0),t.addEventListener("blur",this.handleWindowBlur)):(t.removeEventListener("keydown",this.handleKeyDown,!0),t.removeEventListener("keyup",this.handleKeyUp,!0),t.removeEventListener("blur",this.handleWindowBlur),this.pressedControlKeys.clear()))}}function H(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?"trackpad":e.some(({event:e})=>0!==e.deltaMode)||e.some(Y)||e.every(({event:e})=>{let t=e.wheelDelta;return void 0!==t&&Math.abs(t)%40==0})?"mouse":e.some(({deltaX:e})=>0!==e)||e.length>1&&function(e){for(let t=0;t<e.length;t++){let i=e[t];if(Math.abs(i.deltaX)>40||Math.abs(i.deltaY)>40||t>0&&i.timeStamp-e[t-1].timeStamp>40)return!1}return!0}(e)?"trackpad":t?"mouse":"unknown"}function Y({event:e,deltaX:t,deltaY:i}){if(0!==t||0===i)return!1;if(Number.isInteger(Math.abs(i/4.000244140625)))return!0;let r=e.wheelDelta;return"number"==typeof r&&0!==r&&r%120==0}let Z=["mousedown","mousemove","mouseup","mouseover","mouseout","mouseenter","mouseleave"];class X extends N{constructor(e,t,i){super(e,t,{enable:!0,...i}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&Z.forEach(e=>this.listen(e,!0))}destroy(){Z.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case"pointermove":this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen("mousedown",t),this.listen("mousemove",t),this.listen("mouseup",t));break;case"pointerover":this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen("mouseover",t));break;case"pointerout":this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen("mouseout",t));break;case"pointerenter":this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen("mouseenter",t));break;case"pointerleave":this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen("mouseleave",t))}}handleOverEvent(e){this.enableOverEvent&&"mouseover"===e.type&&this._emit("pointerover",e)}handleOutEvent(e){this.enableOutEvent&&"mouseout"===e.type&&this._emit("pointerout",e)}handleEnterEvent(e){this.enableEnterEvent&&"mouseenter"===e.type&&this._emit("pointerenter",e)}handleLeaveEvent(e){this.enableLeaveEvent&&"mouseleave"===e.type&&this._emit("pointerleave",e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case"mousedown":e.button>=0&&(this.pressed=!0);break;case"mousemove":0===e.buttons&&(this.pressed=!1),this.pressed||this._emit("pointermove",e);break;case"mouseup":this.pressed=!1}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:"mouse",target:t.target})}}let K=["keydown","keyup"];class J extends N{constructor(e,t,i){super(e,t,{enable:!0,tabIndex:0,...i}),this.handleEvent=e=>{let t=e.target||e.srcElement;("INPUT"!==t.tagName||"text"!==t.type)&&"TEXTAREA"!==t.tagName&&(this.enableDownEvent&&"keydown"===e.type&&this.callback({type:"keydown",srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&"keyup"===e.type&&this.callback({type:"keyup",srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline="none",r&&K.forEach(e=>this.listen(e,!0))}destroy(){K.forEach(e=>this.listen(e,!1))}enableEventType(e,t){"keydown"===e&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),"keyup"===e&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}}class Q extends N{constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{this.options.enable&&this.callback({type:"contextmenu",center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&this.listen("contextmenu",!0)}destroy(){this.listen("contextmenu",!1)}enableEventType(e,t){"contextmenu"===e&&this.options.enable!==t&&(this.options.enable=t,this.listen("contextmenu",t))}}let ee={pointerdown:1,pointermove:2,pointerup:4,mousedown:1,mousemove:2,mouseup:4},et={srcElement:"root",priority:0};class ei{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),i=e.srcEvent.target;for(;i&&i!==t.rootElement;){if(this._emit(t,i),t.handled)return;i=i.parentNode}this._emit(t,"root")},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,i,r=!1,n=!1){let{handlers:s,handlersByElement:o}=this,a={...et,...i},l=o.get(a.srcElement);l||(l=[],o.set(a.srcElement,l));let c={type:e,handler:t,srcElement:a.srcElement,priority:a.priority};r&&(c.once=!0),n&&(c.passive=!0),s.push(c),this._active=this._active||!c.passive;let u=l.length-1;for(;u>=0&&!(l[u].priority>=c.priority);)u--;l.splice(u+1,0,c)}remove(e,t){let{handlers:i,handlersByElement:r}=this;for(let n=i.length-1;n>=0;n--){let s=i[n];if(s.type===e&&s.handler===t){i.splice(n,1);let e=r.get(s.srcElement);e.splice(e.indexOf(s),1),0===e.length&&r.delete(s.srcElement)}}this._active=i.some(e=>!e.passive)}_emit(e,t){let i=this.handlersByElement.get(t);if(i){let t=!1,r=()=>{e.handled=!0},n=()=>{e.handled=!0,t=!0},s=[];for(let o=0;o<i.length;o++){let{type:a,handler:l,once:c}=i[o];if(l({...e,type:a,stopPropagation:r,stopImmediatePropagation:n}),c&&s.push(i[o]),t)break}for(let e=0;e<s.length;e++){let{type:t,handler:i}=s[e];this.remove(t,i)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...function(e){let t=ee[e.srcEvent.type];if(!t)return null;let{buttons:i,button:r}=e.srcEvent,n=!1,s=!1,o=!1;return 2===t?(n=!!(1&i),s=!!(4&i),o=!!(2&i)):(n=0===r,s=1===r,o=2===r),{leftButton:n,middleButton:s,rightButton:o}}(e),...function(e,t){let i=e.center;if(!i)return null;let r=t.getBoundingClientRect(),n=r.width/t.offsetWidth||1,s=r.height/t.offsetHeight||1,o={x:(i.x-r.left-t.clientLeft)/n,y:(i.y-r.top-t.clientTop)/s};return{center:i,offsetCenter:o}}(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}}class er{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:"compute",tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new q(e),!e)return;for(let t of(this.manager=new A(e,this.options),this.options.recognizers)){let{recognizer:e,recognizeWith:i,requireFailure:r}=function(e){let t;if("recognizer"in e)return e;let i=Array.isArray(e)?[...e]:[e];return{recognizer:t="function"==typeof i[0]?new(i.shift())(i.shift()||{}):i.shift(),recognizeWith:"string"==typeof i[0]?[i[0]]:i[0],requireFailure:"string"==typeof i[1]?[i[1]]:i[1]}}(t);this.manager.add(e),i&&e.recognizeWith(i),r&&e.requireFailure(r)}this.manager.on("hammer.input",this._onBasicInput),this.wheelInput=new G(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new X(e,this._onOtherEvent,{enable:!1}),this.keyInput=new J(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new Q(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}getElement(){return this.element}destroy(){this.element?(this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()):this.wheelSession.destroy()}on(e,t,i){this._addEventHandler(e,t,i,!1)}once(e,t,i){this._addEventHandler(e,t,i,!0)}watch(e,t,i){this._addEventHandler(e,t,i,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:i}=this;if(!i)return;let r=i.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),i.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,i,r,n){if("string"!=typeof e){for(let[s,o]of(i=t,Object.entries(e)))this._addEventHandler(s,o,i,r,n);return}let{manager:s,events:o}=this;if(!s)return;let a=o.get(e);!a&&(a=new ei(this,this._getRecognizerName(e)||e),o.set(e,a),s&&s.on(e,a.handleEvent)),a.add(e,t,i,r,n),a.isEmpty()||this._toggleRecognizer(a.recognizerName,!0)}_removeEventHandler(e,t){if("string"!=typeof e){for(let[t,i]of Object.entries(e))this._removeEventHandler(t,i);return}let{events:i}=this,r=i.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of i.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}}}}]);
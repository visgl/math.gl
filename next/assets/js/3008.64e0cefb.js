"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["3008"],{79433(e,t,i){i.d(t,{A:()=>P});var r=i(2357);let s=()=>{},n={mode:"preserve"},o={mode:"hard"},a=e=>e;class l{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:i,startProps:r,endProps:s,duration:o,easing:a}}=e,l=a(t/o),u=i.interpolateProps(r,s,l);this.propsInTransition=this.getControllerState({...this.props,...u},n).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new r.A(e.timeline),this.onViewStateChange=e.onViewStateChange||s,this.onStateChange=e.onStateChange||s}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,i=this.props;if(this.props=e,!i||this._shouldIgnoreViewportChange(i,e))return!1;if(this._isTransitionEnabled(e)){let r=i;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...i,...2===e?t:this.propsInTransition||i}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:i}=e;return(t>0||"auto"===t)&&!!i}_isUpdateDueToCurrentTransition(e){return!!this.transition.inProgress&&!!this.propsInTransition&&this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition)}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?3===this.transition.settings.interruption||this._isUpdateDueToCurrentTransition(t):!this._isTransitionEnabled(t)||t.transitionInterpolator.arePropsEqual(e,t)}_triggerTransition(e,t){let i=this.getControllerState(e,n),r=this.getControllerState(t,o).shortestPathFrom(i),s=t.transitionInterpolator,l=s.getDuration?s.getDuration(e,t):t.transitionDuration;if(0===l)return;let u=s.initializeProps(e,r);this.propsInTransition={};let h={duration:l,easing:t.transitionEasing||a,interpolator:s,interruption:t.transitionInterruption||1,startProps:u.start,endProps:u.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(h),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}}var u=i(70053),h=i(7914),c=i(78883);let d={transitionDuration:0},f=e=>1-(1-e)*(1-e),p=e=>1===e?1:1-Math.pow(2,-10*e),g=["wheel"],m=["panstart","panmove","panend"],_=["pinchstart","pinchmove","pinchend"],v=["multipanstart","multipanmove","multipanend"],y=["dblclick"],b=["dblclickdragstart","dblclickdragmove","dblclickdragend","dblclickdragcancel"],w=["keydown"],E={};class P{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode="rotate",this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround="pointer",this.keyboard=!0,this.transitionManager=new l({...e,getControllerState:(t,i)=>new this.ControllerState({...t,constraintContext:i,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case"panstart":return!t&&this._onPanStart(e);case"panmove":return this._onPan(e);case"panend":return this._onPanEnd(e);case"pinchstart":return!t&&!!this._isTrackpadGestureAllowed(e)&&this._onPinchStart(e);case"pinchmove":return!!this._isTrackpadGestureAllowed(e)&&this._onPinch(e);case"pinchend":return!!this._isTrackpadGestureAllowed(e)&&this._onPinchEnd(e);case"multipanstart":return!t&&this._onMultiPanStart(e);case"multipanmove":return this._onMultiPan(e);case"multipanend":return this._onMultiPanEnd(e);case"dblclick":return this._onDoubleClick(e);case"dblclickdragstart":return!t&&this._onDoubleClickDragStart(e);case"dblclickdragmove":return this._onDoubleClickDrag(e);case"dblclickdragend":case"dblclickdragcancel":return this._onDoubleClickDragEnd(e);case"wheel":return this._onWheel(e);case"keydown":return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:i}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-i]}getZoomPosition(e){if("pointer"===this.zoomAround)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[i,r]=(0,c.VJ)(t.center,t.pixelProjectionMatrix);return[i,r]}isPointInBounds(e,t){let{width:i,height:r}=this.props;if(t&&t.handled)return!1;let s=e[0]>=0&&e[0]<=i&&e[1]>=0&&e[1]<=r;return s&&t&&t.stopPropagation(),s}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){void 0===e.maxBoundsPadding&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,"transitionInterpolator"in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:i}=e;this.inertia=Number.isFinite(i)?i:300*(!0===i);let{scrollZoom:r=!0,dragPan:s=!0,dragRotate:n=!0,doubleClickZoom:o=!0,doubleClickDragZoom:a=!1,touchZoom:l=!0,touchRotate:u=!1,multiTouchDrag:c=u?"rotate":null,trackpadGesture:d=!1,zoomAround:f="pointer",keyboard:p=!0}=e,E=!!this.onViewStateChange;if(this.toggleEvents(g,E&&r),this.toggleEvents(m,E),this.toggleEvents(_,E&&(l||"rotate"===c)),this.toggleEvents(v,E&&!!c),this.toggleEvents(y,E&&o),this.toggleEvents(b,E&&a),this.toggleEvents(w,E&&p),this.scrollZoom=r,this.dragPan=s,this.dragRotate=n,this.doubleClickZoom=o,this.doubleClickDragZoom=a,this.touchZoom=l,this.touchRotate="rotate"===c,this.multiTouchDrag=c,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),i=t.getViewportProps();Object.keys(i).some(t=>!(0,h.b)(i[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,i={}){let r={...e.getViewportProps(),...t},s=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(i),s){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:"update"===t?"elastic":"end"===t?"rebound":"hard"}:{mode:"hard"}}_getReboundTransition(e,t){if("rebound"!==e.mode)return null;let i=t.getViewportProps();return Object.keys(i).some(e=>!(0,h.b)(this.props[e],i[e],1))?{...this._getTransitionProps(),transitionDuration:300,transitionEasing:p}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||"pan"===this.dragMode)&&(i=!i);let r=i?"pan":"rotate",s=this._getConstraintContext(r,"start"),n=i?this.controllerState.panStart({pos:t},s):this.controllerState.rotateStart({pos:t},s);return this._panMove=i,this.updateViewport(n,d,{isDragging:!0}),!0}_onPan(e){return!!this.isDragging()&&(this._panMove?this._onPanMove(e):this._onPanRotate(e))}_onPanEnd(e){return!!this.isDragging()&&(this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e))}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),i=this.controllerState.pan({pos:t},this._getConstraintContext("pan","update"));return this.updateViewport(i,d,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let i=this.getCenter(e),r=[i[0]+e.velocityX*t/2,i[1]+e.velocityY*t/2],s=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(s,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:f},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext("pan","end"),i=e.panEnd(t),r=this._getReboundTransition(t,i);this.updateViewport(i,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),i=this.controllerState.rotate({pos:t},this._getConstraintContext("rotate","update"));return this.updateViewport(i,d,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let i=this.getCenter(e),r=[i[0]+e.velocityX*t/2,i[1]+e.velocityY*t/2],s=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(s,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:f},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext("rotate","end"),i=e.rotateEnd(t),r=this._getReboundTransition(t,i);this.updateViewport(i,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&"mouse"!==e.device)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:i=.01,smooth:r=!1}=!0===this.scrollZoom?{}:this.scrollZoom,{delta:s}=e,n=2/(1+Math.exp(-Math.abs(s*i)));s<0&&0!==n&&(n=1/n);let o=this.getZoomPosition(t),a=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:d,l=this.controllerState.zoom({pos:o,scale:n});return this.updateViewport(l,a,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let i=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r="trackpad"===e.pointerType,s={x:i.x-(r?0:e.deltaX),y:i.y-(r?0:e.deltaY)},n={...e,offsetCenter:s},o=this.getCenter(n),a="pan"===t?this.controllerState.panStart({pos:o},this._getConstraintContext("pan","start")):this.controllerState.rotateStart({pos:o},this._getConstraintContext("rotate","start"));return this._multiPanMode=t,this._multiPanStartCenter=s,this.updateViewport(a,d,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:i}=this._getMultiPanEvent(e);return!!t&&!!i&&!!this.isDragging()&&("pan"===t?this._onPanMove(i):this._onPanRotate(i))}_onMultiPanEnd(e){let{mode:t,event:i}=this._getMultiPanEvent(e);if(!t||!i||!this.isDragging())return this._resetMultiPan(),!1;let r="pan"===t?this._onPanMoveEnd(i):this._onPanRotateEnd(i);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return"trackpad"!==e.pointerType||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return"trackpad"===e.pointerType?this.trackpadGesture&&("pan"===t?this.dragPan:this.dragRotate):"touch"===e.pointerType&&("pan"===t?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,i=this._multiPanStartCenter;return t&&i?{mode:t,event:{...e,offsetCenter:{x:i.x+e.deltaX,y:i.y+e.deltaY}}}:{mode:null,event:null}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext("zoom","start")).rotateStart({pos:t},this._getConstraintContext("rotate","start"));return E._startPinchRotation=e.rotation,E._lastPinchEvent=e,this.updateViewport(i,d,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:i}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:i},this._getConstraintContext("zoom","update"))}if(this.touchRotate){let{rotation:i}=e;t=t.rotate({deltaAngleX:E._startPinchRotation-i},this._getConstraintContext("rotate","update"))}return this.updateViewport(t,d,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),E._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:i}=E;if(this.touchZoom&&t&&i&&e.scale!==i.scale){let r=this.getCenter(e),s=this.getZoomPosition(r),n=this.controllerState.rotateEnd(),o=Math.log2(e.scale),a=(o-Math.log2(i.scale))/(e.deltaTime-i.deltaTime),l=Math.pow(2,o+a*t/2);n=n.zoom({pos:s,scale:l}).zoomEnd(),this.updateViewport(n,{...this._getTransitionProps({around:s}),transitionDuration:t,transitionEasing:f},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext("zoom","end"),i=this._getConstraintContext("rotate","end"),r=e.zoomEnd(t).rotateEnd(i),s=this._getReboundTransition(this.touchZoom?t:i,r);this.updateViewport(r,s,{isDragging:!1,isPanning:!!s&&this.touchZoom,isZooming:!!s&&this.touchZoom,isRotating:!!s&&this.touchRotate})}return E._startPinchRotation=null,E._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let i=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),s=this.controllerState.zoom({pos:r,scale:i?.5:2});return this.updateViewport(s,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let i=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext("zoom","start"));return 1!==e.scale&&(i=i.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext("zoom","update"))),this.updateViewport(i,d,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let i=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext("zoom","update"));return this.updateViewport(i,d,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,i=this._getConstraintContext("zoom","end"),r=t.zoomEnd(i),s=this._getReboundTransition(i,r);return this.updateViewport(r,s,{isDragging:!1,isPanning:!!s,isZooming:!!s}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){let t;if(!this.keyboard)return!1;let i=this.isFunctionKeyPressed(e),{zoomSpeed:r,moveSpeed:s,rotateSpeedX:n,rotateSpeedY:o}=!0===this.keyboard?{}:this.keyboard,{controllerState:a}=this,l={};switch(e.srcEvent.code){case"Minus":t=i?a.zoomOut(r).zoomOut(r):a.zoomOut(r),l.isZooming=!0;break;case"Equal":t=i?a.zoomIn(r).zoomIn(r):a.zoomIn(r),l.isZooming=!0;break;case"ArrowLeft":i?(t=a.rotateLeft(n),l.isRotating=!0):(t=a.moveLeft(s),l.isPanning=!0);break;case"ArrowRight":i?(t=a.rotateRight(n),l.isRotating=!0):(t=a.moveRight(s),l.isPanning=!0);break;case"ArrowUp":i?(t=a.rotateUp(o),l.isRotating=!0):(t=a.moveUp(s),l.isPanning=!0);break;case"ArrowDown":i?(t=a.rotateDown(o),l.isRotating=!0):(t=a.moveDown(s),l.isPanning=!0);break;default:return!1}return this.updateViewport(t,this._getTransitionProps(),l),!0}_getTransitionProps(e){let{transition:t}=this;return t&&t.transitionInterpolator?e?{...t,transitionInterpolator:new u.A({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t:d}}},97564(e,t,i){i.d(t,{A:()=>p,y:()=>f});var r=i(31609),s=i(79433),n=i(60676),o=i(58532),a=i(78883),l=i(24067),u=i(25667),h=i(70053);let c=[[-1/0,-90],[1/0,90]];function d([e,t]){if(Math.abs(t)>90&&(t=90*Math.sign(t)),Number.isFinite(e)){let[i,s]=(0,a.Gw)([e,t]);return[i,(0,r.qE)(s,0,512)]}let[,i]=(0,a.Gw)([0,t]);return[e,(0,r.qE)(i,0,512)]}class f extends n.A{constructor(e){let{width:t,height:i,latitude:r,longitude:s,zoom:o,bearing:a=0,pitch:u=0,altitude:h=1.5,position:d=[0,0,0],maxZoom:f=20,minZoom:p=0,maxPitch:g=60,minPitch:m=0,startPanLngLat:_,startZoomLngLat:v,startRotatePos:y,startRotateLngLat:b,startBearing:w,startPitch:E,startZoom:P,normalize:x=!0,rubberBand:S=!1}=e,{[n.y]:M}=e;(0,l.A)(Number.isFinite(s)),(0,l.A)(Number.isFinite(r)),(0,l.A)(Number.isFinite(o));let A=e.maxBounds||(x?c:null);super({width:t,height:i,latitude:r,longitude:s,zoom:o,bearing:a,pitch:u,altitude:h,maxZoom:f,minZoom:p,maxPitch:g,minPitch:m,normalize:x,position:d,maxBounds:A,maxBoundsPadding:e.maxBoundsPadding||null,rubberBand:S,...{[n.y]:M}},{startPanLngLat:_,startZoomLngLat:v,startRotatePos:y,startRotateLngLat:b,startBearing:w,startPitch:E,startZoom:P},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},i){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let s=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(s,i)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:void 0!==t?this._unproject3D(e,t):void 0,startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:i=0}){let r,{startRotatePos:s,startRotateLngLat:n,startBearing:o,startPitch:a}=this.getState();if(!s||void 0===o||void 0===a)return this;if(r=e?this._getNewRotation(e,s,a,o):{bearing:o+t,pitch:a+i},n){let e=this.makeViewport({...this.getViewportProps(),...r}),t="panByPosition3D"in e?"panByPosition3D":"panByPosition";return this._getUpdatedState({...r,...e[t](n,s)})}return this._getUpdatedState(r)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:i},r){let{startZoom:s,startZoomLngLat:o}=this.getState();return(o||(s=this.getViewportProps().zoom,o=this._unproject(t)||this._unproject(e)),o)?this._getUpdatedState({zoom:s+Math.log2(i),[n.y]:{position:o,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),i={...this.getViewportProps()},{bearing:r,longitude:s}=i;return Math.abs(r-t.bearing)>180&&(i.bearing=r<0?r+360:r-360),Math.abs(s-t.longitude)>180&&(i.longitude=s<0?s+360:s-360),i}applyConstraints(e,t){let i=e[n.y];delete e[n.y];let{maxPitch:s,minPitch:l,pitch:h,bearing:c,normalize:f,maxBounds:p,rubberBand:g}=e;f&&(c<-180||c>180)&&(e.bearing=(0,u.zi)(c+180,360)-180),e.pitch=(0,r.qE)(h,l,s);let m=this._constrainZoom(e.zoom,e),_=g&&t?.mode==="elastic";if(e.zoom=t?.mode==="preserve"?e.zoom:_?(0,o.GT)(e.zoom,m,1):m,i){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(i.position,i.screenPosition))}if(f&&(e.longitude<-180||e.longitude>180)&&(e.longitude=(0,u.zi)(e.longitude+180,360)-180),p){let i=(0,o.CI)(e.width,e.height,e.maxBoundsPadding),s=this.makeViewport({...e,bearing:0,pitch:0}),n=(0,o.jo)(s,[e.longitude,e.latitude],i),l=d(p[0]),u=d(p[1]),h=2**e.zoom,c=[l[0]+n.left/h,l[1]+n.bottom/h],f=[u[0]-n.right/h,u[1]-n.top/h],g=d([e.longitude,e.latitude]),m=[(0,r.qE)(g[0],c[0],f[0]),(0,r.qE)(g[1],c[1],f[1])],v=g.slice();if(i.width>=0&&(v[0]=t?.mode==="preserve"?g[0]:_?(0,o.GT)(g[0],m[0],i.width/2/h):m[0]),i.height>=0&&(v[1]=t?.mode==="preserve"?g[1]:_?(0,o.GT)(g[1],m[1],i.height/2/h):m[1]),v[0]!==g[0]||v[1]!==g[1]){let[t,i]=(0,a.iV)(v);v[0]!==g[0]&&(e.longitude=t),v[1]!==g[1]&&(e.latitude=i)}}return e}_constrainZoom(e,t){t||(t=this.getViewportProps());let{maxZoom:i,maxBounds:s}=t,n=null!==s&&t.width>0&&t.height>0,{minZoom:a}=t;if(n){let e=(0,o.CI)(t.width,t.height,t.maxBoundsPadding),r=d(s[0]),n=d(s[1]),l=n[0]-r[0],u=n[1]-r[1];e.width>0&&Number.isFinite(l)&&l>0&&(a=Math.max(a,Math.log2(e.width/l))),e.height>0&&Number.isFinite(u)&&u>0&&(a=Math.max(a,Math.log2(e.height/u))),a>i&&(a=i)}return(0,r.qE)(e,a,i)}_zoomFromCenter(e,t){let{width:i,height:r}=this.getViewportProps();return this.zoom({pos:[i/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:i,height:r}=this.getViewportProps();return this.pan({startPos:[i/2,r/2],pos:[i/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,i,s){let n=e[0]-t[0],o=e[1]-t[1],a=e[1],l=t[1],{width:u,height:h}=this.getViewportProps(),c=0;o>0?Math.abs(h-l)>5&&(c=o/(l-h)*1.2):o<0&&l>5&&(c=1-a/l),c=(0,r.qE)(c,-1,1);let{minPitch:d,maxPitch:f}=this.getViewportProps(),p=i;return c>0?p=i+c*(f-i):c<0&&(p=i-c*(d-i)),{pitch:p,bearing:s+n/u*180}}}class p extends s.A{constructor(){super(...arguments),this.ControllerState=f,this.transition={transitionDuration:300,transitionInterpolator:new h.A({transitionProps:{compare:["longitude","latitude","zoom","bearing","pitch","position"],required:["longitude","latitude","zoom"]}})},this.dragMode="pan",this.rotationPivot="center",this._getAltitude=e=>{if("2d"===this.rotationPivot)return 0;if("3d"===this.rotationPivot&&this.pickPosition){let{x:t,y:i}=this.props,r=this.pickPosition(t+e[0],i+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){"rotationPivot"in e&&(this.rotationPivot=e.rotationPivot||"center"),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(!1===e.normalize?null:c),super.setProps(e)}updateViewport(e,t=null,i={}){let r=e.getState();i.isDragging&&r.startRotateLngLat?i={...i,rotationPivotPosition:r.startRotateLngLat}:!1===i.isDragging&&(i={...i,rotationPivotPosition:void 0}),super.updateViewport(e,t,i)}}},58532(e,t,i){i.d(t,{CI:()=>n,GT:()=>s,jo:()=>o});var r=i(33945);function s(e,t,i){let r=e-t;return r&&Number.isFinite(r)?t+r*i/(i+Math.abs(r)):t}function n(e,t,i){let s=(0,r.E9)((0,r.rk)(i?.left??0),e),n=(0,r.E9)((0,r.rk)(i?.right??0),e),o=(0,r.E9)((0,r.rk)(i?.top??0),t),a=(0,r.E9)((0,r.rk)(i?.bottom??0),t);return{x:s,y:o,width:e-s-n,height:t-o-a}}function o(e,t,i){let[r,s]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,s=Number.isFinite(s)?s:e.height/2,{left:r-i.x,right:i.x+i.width-r,top:s-i.y,bottom:i.y+i.height-s}}},60676(e,t,i){i.d(t,{A:()=>s,y:()=>r});let r=Symbol("constraintAround");class s{constructor(e,t,i,r){this.makeViewport=i,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}}},43411(e,t,i){i.d(t,{A:()=>o,k:()=>n});var r=i(3459);let s={};function n(e){s=e}function o(e,t,i,n){r.A.level>0&&s[e]&&s[e].call(null,t,i,n)}},9350(e,t,i){i.d(t,{Kx:()=>o,We:()=>u,p5:()=>a,rf:()=>n,tg:()=>l});var r=i(3459),s=i(92767);let n={DEFAULT:"default",LNGLAT:"lnglat",METER_OFFSETS:"meter-offsets",LNGLAT_OFFSETS:"lnglat-offsets",CARTESIAN:"cartesian"};Object.defineProperty(n,"IDENTITY",{get:()=>(r.A.deprecated("COORDINATE_SYSTEM.IDENTITY","COORDINATE_SYSTEM.CARTESIAN")(),n.CARTESIAN)});let o={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},a={common:0,meters:1,pixels:2},l={click:"onClick",dblclick:"onClick",panstart:"onDragStart",panmove:"onDrag",panend:"onDragEnd"},u={multipan:[s.uq,{threshold:10,pointers:2,trackpad:!0}],pinch:[s.h1,{trackpad:!0},null,["multipan"]],pan:[s.uq,{threshold:1},["pinch"],["multipan"]],dblclick:[s.Cx,{event:"dblclick",taps:2,enable:!1}],dblclickdrag:[s.Cp,{event:"dblclickdrag",enable:!1},["dblclick"],null],click:[s.Cx,{event:"click"},["dblclickdrag"],["dblclick","dblclickdrag"]]}},43927(e,t,i){i.d(t,{A:()=>tr});let r=1,s=1;class n{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;addChannel(e){let{delay:t=0,duration:i=1/0,rate:s=1,repeat:n=1}=e,o=r++,a={time:0,delay:t,duration:i,rate:s,repeat:n};return this._setChannelTime(a,this.time),this.channels.set(o,a),o}removeChannel(e){for(let[t,i]of(this.channels.delete(e),this.animations))i.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return void 0!==t&&this.time>=t.delay+t.duration*t.repeat}getTime(e){if(void 0===e)return this.time;let t=this.channels.get(e);return void 0===t?-1:t.time}setTime(e){for(let t of(this.time=Math.max(0,e),this.channels.values()))this._setChannelTime(t,this.time);for(let e of this.animations.values()){let{animation:t,channel:i}=e;t.setTime(this.getTime(i))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let i=s++;return this.animations.set(i,{animation:e,channel:t}),e.setTime(this.getTime(t)),i}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(-1===this.lastEngineTime&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let i=t-e.delay;i>=e.duration*e.repeat?e.time=e.duration*e.rate:(e.time=Math.max(0,i)%e.duration,e.time*=e.rate)}}var o=i(20361);let a=[i(3065).A],l=["vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)","vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)","vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)","fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)"],u=[],h=`\
layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,c={name:"layer",source:`\
struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,vs:h,fs:h,getUniforms:e=>({opacity:Math.pow(e.opacity,1/2.2)}),uniformTypes:{opacity:"f32"}};var d=i(12897),f=i(3459),p=i(43411),g=i(38055),m=i(29947),_=i(327);class v{constructor(e,t,i){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=i,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let i=++this._loadCount,r=e;for(let t of("string"==typeof e&&(r=(0,_.H)(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===i&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===i&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e),this._subscribers))t.onChange(this.getData())}}class y{constructor(e){this.protocol=e.protocol||"resource://",this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return!!e.startsWith(this.protocol)||e in this._resources}add({resourceId:e,data:t,forceUpdate:i=!1,persistent:r=!0}){let s=this._resources[e];s?s.setData(t,i):(s=new v(e,t,this._context),this._resources[e]=s),s.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let e in t){let i=t[e],r=this._resources[i.resourceId];r&&r.unsubscribe(i)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:i,requestId:r="default"}){let{_resources:s,protocol:n}=this;e.startsWith(n)&&(s[e=e.replace(n,"")]||this.add({resourceId:e,data:null,persistent:!1}));let o=s[e];if(this._track(i,r,o,t),o)return o.getData()}prune(){this._pruneRequest||(this._pruneRequest=setTimeout(()=>this._prune(),0))}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,i,r){let s=this._consumers,n=s[e]=s[e]||{},o=n[t],a=o&&o.resourceId&&this._resources[o.resourceId];a&&(a.unsubscribe(o),this.prune()),i&&(o?(o.onChange=r,o.resourceId=i.id):o={onChange:r,resourceId:i.id},n[t]=o,i.subscribe(o))}_prune(){for(let e of(this._pruneRequest=null,Object.keys(this._resources))){let t=this._resources[e];t.persistent||t.inUse()||(t.delete(),delete this._resources[e])}}}var b=i(47345);class w{constructor(e,t){this._lastRenderedLayers=[],this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{(0,p.A)("layerManager.activateViewport",this,e),e&&(this.context.viewport=e)};let{deck:i,stats:r,viewport:s,timeline:h}=t||{};this.layers=[],this.resourceManager=new y({device:e,protocol:"deck://"}),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:i,shaderAssembler:function(e){let t=o._P.getDefaultShaderAssembler(e);for(let e of a)t.addDefaultModule(e);for(let i of(t._hookFunctions.length=0,"glsl"===e?l:u))t.addShaderHook(i);return t}(e?.info?.shadingLanguage||"glsl"),defaultShaderModules:[c],renderPass:void 0,stats:r||new m.A({id:"deck.gl"}),viewport:s||new b.A({id:"DEFAULT-INITIAL-VIEWPORT"}),timeline:h||new n,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){for(let e of(this.resourceManager.finalize(),this.layers))this._finalizeLayer(e)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;for(let i of(e.clearRedrawFlags&&(this._needsRedraw=!1),this.layers)){let r=i.getNeedsRedraw(e);t=t||r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?"layers changed":this._defaultShaderModulesChanged?"shader modules changed":this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>0===t.id.indexOf(e))):this.layers}setProps(e){"debug"in e&&(this._debug=e.debug),"userData"in e&&(this.context.userData=e.userData),"layers"in e&&(this._nextLayers=e.layers),"onError"in e&&(this.context.onError=e.onError)}setLayers(e,t){(0,p.A)("layerManager.setLayers",this,t,e),this._lastRenderedLayers=e;let i=(0,g.B)(e,Boolean);for(let e of i)e.context=this.context;this._updateLayers(this.layers,i)}updateLayers(){let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,i=t.findIndex(t=>t.name===e.name);i>=0&&(t.splice(i,1),this._defaultShaderModulesChanged=!0)}_handleError(e,t,i){i.raiseError(t,`${e} of ${i}`)}_updateLayers(e,t){let i={};for(let t of e)i[t.id]?f.A.warn(`Multiple old layers with same id ${t.id}`)():i[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,i,r),this._finalizeOldLayers(i);let s=!1;for(let e of r)if(e.hasUniformTransition()){s=`Uniform transition in ${e}`;break}this._needsUpdate=s,this.layers=r}_updateSublayersRecursively(e,t,i){for(let r of e){r.context=this.context;let e=t[r.id];null===e&&f.A.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let s=null;try{this._debug&&e!==r&&r.validateProps(),e?(this._transferLayerState(e,r),this._updateLayer(r)):this._initializeLayer(r),i.push(r),s=r.isComposite?r.getSubLayers():null}catch(e){this._handleError("matching",e,r)}s&&this._updateSublayersRecursively(s,t,i)}}_finalizeOldLayers(e){for(let t in e){let i=e[t];i&&this._finalizeLayer(i)}}_initializeLayer(e){try{e._initialize(),e.lifecycle=d.VD.INITIALIZED}catch(t){this._handleError("initialization",t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=d.VD.MATCHED,t!==e&&(e.lifecycle=d.VD.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError("update",t,e)}}_finalizeLayer(e){this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=d.VD.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=d.VD.FINALIZED}catch(t){this._handleError("finalization",t,e)}}}var E=i(7914);let P="default-canvas";class x{constructor(e){this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw="First render",this._needsUpdate="Initialize",this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={}}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let i=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!("x"in e)||t.containsPixel(e);return i&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t="string"==typeof e?this.getView(e):e,i=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(i):i}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t="string"==typeof e?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let i=this.getViewports(),r={x:e[0],y:e[1]};for(let s=i.length-1;s>=0;--s){let n=i[s];if(n.containsPixel(r)){let i=e.slice();return i[0]-=n.x,i[1]-=n.y,n.unproject(i,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),("width"in e||"height"in e)&&this._setSize(e.width,e.height),"pickPosition"in e&&(this._pickPosition=e.pickPosition),"eventManagers"in e&&this._setEventManagers(e.eventManagers||{}),this._isUpdating||this._update()}_update(){this._isUpdating=!0,this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._isUpdating=!1}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate("Size changed"))}_setViews(e){e=(0,g.B)(e,Boolean),this._diffViews(e,this.views)&&this.setNeedsUpdate("views changed"),this.views=e}_setViewState(e){e?((0,E.b)(e,this.viewState,3)||this.setNeedsUpdate("viewState changed"),this.viewState=e):f.A.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate("eventManagers changed"))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||P}_getCanvasDimensions(e){let t=this._getCanvasContext?.(e.id),[i,r]=t?.getCSSSize()||[this.width,this.height];return{width:i,height:r}}_getViewEventManager(e){let t=this.getCanvasId(e)||P;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,i){return e&&(t?.canvasId!==i.canvasId||t?.eventManager!==i.eventManager)?(e.finalize(),null):e}_createController(e,t){return new t.type({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,i)=>this._pickPosition?.(t,i,e.id)})}_updateController(e,t,i,r){let s=e.controller;if(s&&i){let n={...t,...s,id:e.id,x:i.x,y:i.y,width:i.width,height:i.height};return r&&r.constructor===s.type||(r=this._createController(e,n)),r&&r.setProps(n),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:i}=this._startViewportRebuild(),r=!1;for(let s=e.length;s--;){let n=e[s],{width:o,height:a}=this._getCanvasDimensions(n),l=this._getViewEventManager(n);this._viewEventManagers[n.id]=l;let u=this.getViewState(n),h=n.makeViewport({viewState:u,width:o,height:a}),c=this._getReusableController(t[n.id],i[n.id],l),d=!!n.controller;d&&!c&&(r=!0),(r||!d)&&c&&(c.finalize(),c=null),this.controllers[n.id]=this._updateController(n,u,h,c),h&&this._viewports.unshift(h)}for(let e in t){let i=t[e];i&&!this.controllers[e]&&i.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length!==t.length||e.some((i,r)=>!e[r].equals(t[r]))}}var S=i(12041),M=i(41367),A=i(97564);class C extends S.A{constructor(e={}){super(e)}getViewportType(){return M.A}get ControllerType(){return A.A}}C.displayName="MapView";let T=[255,255,255],k=0;class L{constructor(e={}){this.type="ambient";let{color:t=T}=e,{intensity:i=1}=e;this.id=e.id||`ambient-${k++}`,this.color=t,this.intensity=i}}var I=i(3289);let O=[255,255,255],R=[0,0,-1],B=0;class z{constructor(e={}){this.type="directional";let{color:t=O}=e,{intensity:i=1}=e,{direction:r=R}=e,{_shadow:s=!1}=e;this.id=e.id||`directional-${B++}`,this.color=t,this.intensity=i,this.type="directional",this.direction=new I.P(r).normalize().toArray(),this.shadow=s}getProjectedLight(e){return this}}var j=i(41534);class D{constructor(e,t={id:"pass"}){let{id:i}=t;this.id=i,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}}let F={depthWriteEnabled:!0,depthCompare:"less-equal",blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one-minus-src-alpha",blendAlphaOperation:"add",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one-minus-src-alpha"};class N extends D{constructor(){super(...arguments),this._lastRenderIndex=-1}render(e){this._render(e)}_render(e){let{canvasContext:t=this.device.canvasContext}=e,i=e.target??t.getCurrentFramebuffer(),[r,s]=t.getDrawingBufferSize(),n=e.clearCanvas??!0,o=e.clearColor??(!!n&&[0,0,0,0]),a=!!n&&1,l=!!n&&0,u=e.colorMask??15,h={viewport:[0,0,r,s]};e.colorMask&&(h.colorMask=u),e.scissorRect&&(h.scissorRect=e.scissorRect);let{shaderModuleProps:c,viewports:d,views:f,onViewportActive:p,clearStack:g=!0}=e,m=e.pass||"unknown",_="webgpu"===this.device.type;g&&(this._lastRenderIndex=-1);let v=[];if(!d.length)return this.device.beginRenderPass({framebuffer:i,parameters:h,clearColor:o,clearDepth:a,clearStencil:l}).end(),this.device.submit(),v;try{for(let r of d){p?.(r);let s=this._getDrawLayerParams(r,e),n=f&&f[r.id],u=r.subViewports||[r];for(let r of _?u.map(e=>[e]):[u]){let u=this.device.beginRenderPass({framebuffer:i,parameters:h,clearColor:o,clearDepth:a,clearStencil:l});try{for(let o of r){let r=this._drawLayersInViewport(u,{target:i,canvasContext:t,shaderModuleProps:c,viewport:o,view:n,pass:m,layers:e.layers,isPicking:e.isPicking},s);v.push(r)}}finally{u.end(),_&&this.device.submit()}o=!1,a=!1,l=!1}}return v}finally{_||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:i,isPicking:r=!1,layerFilter:s,cullRect:n,views:o,effects:a,canvasContext:l=this.device.canvasContext,shaderModuleProps:u},h=!1){let c=[],d=function e(t=0,i={}){let r={},s=(n,o)=>{let a,l=n.props._offset,u=n.id,h=n.parent&&n.parent.id;if(!h||h in i||s(n.parent,!1),h in r){let t=r[h]=r[h]||e(i[h],i);a=t(n,o),r[u]=t}else Number.isFinite(l)?(a=l+(i[h]||0),r[u]=null):a=t;return o&&a>=t&&(t=a+1),i[u]=a,a};return s}(this._lastRenderIndex+1),f={layer:t[0],viewport:e,isPicking:r,renderPass:i,cullRect:n},p={};for(let r=0;r<t.length;r++){let n=t[r],g=this._shouldDrawLayer(n,f,s,p),m={shouldDrawLayer:g};g&&!h&&(m.shouldDrawLayer=!0,m.layerRenderIndex=d(n,g),m.shaderModuleProps=this._getShaderModuleProps(n,a,i,l,u),m.layerParameters={..."webgpu"===n.context.device.type?F:null,...n.context.deck?.props.parameters,...o?.[e.id]?.props.parameters,...this.getLayerParameters(n,r,e)}),c[r]=m}return c}_drawLayersInViewport(e,{layers:t,shaderModuleProps:i,pass:r,target:s,canvasContext:n,viewport:o,view:a,isPicking:l},u){let h=function(e,{canvasContext:t=e.canvasContext,shaderModuleProps:i,target:r,viewport:s}){let n=i?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),a=r?r.height:o;return[s.x*n,a-(s.y+s.height)*n,s.width*n,s.height*n]}(this.device,{canvasContext:n,shaderModuleProps:i,target:s,viewport:o});if(a){let{clear:e,clearColor:t,clearDepth:i,clearStencil:r}=a.props;if(e){let e=[0,0,0,0],n=1,o=0;Array.isArray(t)&&!l?e=[...t.slice(0,3),t[3]||255].map(e=>e/255):!1===t&&(e=!1),void 0!==i&&(n=i),void 0!==r&&(o=r),this.device.beginRenderPass({framebuffer:s,parameters:{viewport:h,scissorRect:h},clearColor:e,clearDepth:n,clearStencil:o}).end()}}let c={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:h});for(let i=0;i<t.length;i++){let s=t[i],n=u[i],{shouldDrawLayer:a}=n;if(a&&s.props.pickable&&c.pickableCount++,s.isComposite&&c.compositeCount++,s.isDrawable&&n.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:i,layerParameters:a}=n;c.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),i.project&&(i.project.viewport=o),s.context.renderPass=e;try{s._drawLayer({renderPass:e,shaderModuleProps:i,uniforms:{layerIndex:t},parameters:a})}catch(e){s.raiseError(e,`drawing ${s} to ${r}`)}}}return c}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,i){return null}getLayerParameters(e,t,i){return e.props.parameters}_shouldDrawLayer(e,t,i,r){if(!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let s=e.parent;for(;s;){if(!s.props.visible||!s.filterSubLayer(t))return!1;t.layer=s,s=s.parent}if(i){let e=t.layer.id;if(e in r||(r[e]=i(t)),!r[e])return!1}return e.activateViewport(t.viewport),!0}_getShaderModuleProps(e,t,i,r,s){let n=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,a={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,devicePixelRatio:n,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let i of t)U(a,i.getShaderModuleProps?.(e,a));for(let t of e.context.defaultShaderModules)t.name in a||(a[t.name]={});return U(a,this.getShaderModuleProps(e,t,a),s)}}function U(e,...t){for(let i of t)if(i)for(let t in i)e[t]?Object.assign(e[t],i[t]):e[t]=i[t];return e}class V extends N{constructor(e,t){super(e,t);let i=e.createTexture({format:"rgba8unorm",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}}),r=e.createTexture({format:"depth16unorm",width:1,height:1});this.fbo=e.createFramebuffer({id:"shadowmap",width:1,height:1,colorAttachments:[i],depthStencilAttachment:r})}delete(){this.fbo&&(this.fbo.destroy(),this.fbo=null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,i=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],s=r.width*i,n=r.height*i;(s!==t.width||n!==t.height)&&t.resize({width:s,height:n}),super.render({...e,clearColor:[1,1,1,1],target:t,pass:"shadow"})}getLayerParameters(e,t,i){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:"less-equal"}}shouldDrawLayer(e){return!1!==e.props.shadowEnabled}getShaderModuleProps(e,t,i){return{shadow:{project:i.project,drawToShadowMap:!0}}}}var $=i(9350),W=i(52948),G=i(82417),q=i(78883),Y=i(74334);let H=`
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
`,Z=`
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
`,X=`
${H}
${Z}
`,K=`
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
`,J=`
${H}
${K}
`,Q=(0,G.A)(function({viewport:e,center:t}){return new j.k(e.viewProjectionMatrix).invert().transform(t)}),ee=(0,G.A)(function({viewport:e,shadowMatrices:t}){let i=[],r=e.pixelUnprojectionMatrix,s=e.isGeospatial?void 0:1,n=[[0,0,s],[e.width,0,s],[0,e.height,s],[e.width,e.height,s],[0,0,-1],[e.width,0,-1],[0,e.height,-1],[e.width,e.height,-1]].map(e=>(function(e,t){let[i,r,s]=e,n=(0,q.xJ)([i,r,s],t);return Number.isFinite(s)?n:[n[0],n[1],0]})(e,r));for(let r of t){let t=r.clone().translate(new I.P(e.center).negate()),s=n.map(e=>t.transform(e)),o=new j.k().ortho({left:Math.min(...s.map(e=>e[0])),right:Math.max(...s.map(e=>e[0])),bottom:Math.min(...s.map(e=>e[1])),top:Math.max(...s.map(e=>e[1])),near:Math.min(...s.map(e=>-e[2])),far:Math.max(...s.map(e=>-e[2]))});i.push(o.multiplyRight(r))}return i}),et=[0,0,0,1],ei=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],er={name:"shadow",dependencies:[W.A],vs:X,fs:J,inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `},getUniforms:function(e){let{shadowEnabled:t=!0,project:i}=e;if(!t||!i||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=W.A.getUniforms(i),s=Q({viewport:i.viewport,center:r.center}),n=[],o=ee({shadowMatrices:e.shadowMatrices,viewport:i.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],a=e.clone().translate(new I.P(i.viewport.center).negate());r.coordinateSystem===(0,Y.LB)("lnglat")&&r.projectionMode===$.Kx.WEB_MERCATOR?(o[t]=a,n[t]=s):(o[t]=e.clone().multiplyRight(ei),n[t]=a.transform(s))}let a={drawShadowMap:!!e.drawToShadowMap,useShadowMap:!!e.shadowMaps&&e.shadowMaps.length>0,color:e.shadowColor||et,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)a[`viewProjectionMatrix${e}`]=o[e],a[`projectCenter${e}`]=n[e];for(let t=0;t<2;t++)a[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return a},uniformTypes:{drawShadowMap:"f32",useShadowMap:"f32",color:"vec4<f32>",lightId:"i32",lightCount:"f32",viewProjectionMatrix0:"mat4x4<f32>",viewProjectionMatrix1:"mat4x4<f32>",projectCenter0:"vec4<f32>",projectCenter1:"vec4<f32>"}},es={color:[255,255,255],intensity:1},en=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],eo=[0,0,0,200/255];class ea{constructor(e={}){this.id="lighting-effect",this.shadowColor=eo,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:i}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),i._addDefaultShaderModule(er),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){for(let t in this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[],e){let i=e[t];switch(i.type){case"ambient":this.ambientLight=i;break;case"directional":this.directionalLights.push(i);break;case"point":this.pointLights.push(i)}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&this.setup(this.context),this.props=e}preRender({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:s}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let n=0;n<this.shadowPasses.length;n++)this.shadowPasses[n].render({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:s,shaderModuleProps:{shadow:{shadowLightId:n,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let i=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,lights:this._getLights(e)},s=e.props.material;return{shadow:i,lighting:r,phongMaterial:s,gouraudMaterial:s}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderModule(er))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let i=new j.k().lookAt({eye:new I.P(t.direction).negate()});e.push(i)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let i=new V(e);this.shadowPasses[t]=i}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:i}=this;e||0!==t.length||0!==i.length||(this.ambientLight=new L(es),this.directionalLights.push(new z(en[0]),new z(en[1])))}_getLights(e){let t=[];for(let i of(this.ambientLight&&t.push(this.ambientLight),this.pointLights))t.push(i.getProjectedLight({layer:e}));for(let i of this.directionalLights)t.push(i.getProjectedLight({layer:e}));return t}}let el=new ea;class eu{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw="Initial render",this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let i=t.findIndex(t=>(t.order??1/0)-(e.order??1/0)>0);i<0?t.push(e):t.splice(i,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){"effects"in e&&!(0,E.b)(e.effects,this.effects,1)&&this._setEffects(e.effects)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let i=[];for(let r of e){let e=t[r.id],s=r;e&&e!==r?e.setProps?(e.setProps(r.props),s=e):e.cleanup(this._context):e||r.setup(this._context),i.push(s),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=i,this._resolvedEffects=i.concat(this._defaultEffects),e.some(e=>e instanceof ea)||this._resolvedEffects.push(el),this._needsRedraw="effects changed"}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}}class eh extends N{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes("draw")||t.includes("terrain")}render(e){return this._render(e)}}let ec={blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"zero",blendAlphaOperation:"add",blendAlphaSrcFactor:"constant",blendAlphaDstFactor:"zero"};class ed extends N{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return"pickingFBO"in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:i,viewports:r,onViewportActive:s,pickingFBO:n,deviceRect:{x:o,y:a,width:l,height:u},cullRect:h,effects:c,pass:d="picking",pickZ:f,canvasContext:p,shaderModuleProps:g,clearColor:m}){this.pickZ=f;let _=this._resetColorEncoder(f),v=super._render({target:n,layers:e,layerFilter:t,views:i,viewports:r,onViewportActive:s,cullRect:h,effects:c?.filter(e=>e.useInPicking),pass:d,canvasContext:p,isPicking:!0,shaderModuleProps:g,clearColor:m??[0,0,0,0],colorMask:15,scissorRect:[o,a,l,u]});return this._colorEncoderState=null,{decodePickingColor:_&&ep.bind(null,_),stats:v}}shouldDrawLayer(e){let{pickable:t,operation:i}=e.props;return t&&i.includes("draw")||i.includes("terrain")||i.includes("mask")}getShaderModuleProps(e,t,i){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,i){let r={...e.props.parameters},{pickable:s,operation:n}=e.props;return this._colorEncoderState?s&&n.includes("draw")?(Object.assign(r,ec),r.blend=!0,"webgpu"===this.device.type?r.blendConstant=ef(this._colorEncoderState,e,i):r.blendColor=ef(this._colorEncoderState,e,i),n.includes("terrain")&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor="one")):n.includes("terrain")&&(r.blend=!1):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}}function ef(e,t,i){let r,{byLayer:s,byAlpha:n}=e,o=s.get(t);return o?(o.viewports.push(i),r=o.a):(r=s.size+1)<=255?(o={a:r,layer:t,viewports:[i]},s.set(t,o),n[r]=o):(f.A.warn("Too many pickable layers, only picking the first 255")(),r=0),[0,0,0,r/255]}function ep(e,t){let i=e.byAlpha[t[3]];return i&&{pickedLayer:i.layer,pickedViewports:i.viewports,pickedObjectIndex:i.layer.decodePickingColor(t)}}class eg{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new eh(e),this.pickLayersPass=new ed(e),this.renderCount=0,this._needsRedraw="Initial render",this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw="layerFilter changed"),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw="drawPickingColors changed")}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,i={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let e=t.render(i),r="stats"in e?e.stats:e;this._updateStats(r);return}i.effects&&this._preRender(i.effects,i);let r=this.lastPostProcessEffect?this.renderBuffers[0]:i.target;this.lastPostProcessEffect&&(i.clearColor=[0,0,0,0],i.clearCanvas=!0);let s=t.render({...i,target:r}),n="stats"in s?s.stats:s;i.effects&&(this.lastPostProcessEffect&&(i.clearCanvas=void 0===e.clearCanvas||e.clearCanvas),this._postRender(i.effects,i)),this.renderCount++,(0,p.A)("deckRenderer.renderLayers",this,n,e),this._updateStats(n)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:i}of e)t+=i;this.stats.get("Layers rendered").addCount(t)}_preRender(e,t){for(let i of(this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{},e))t.preRenderStats[i.id]=i.preRender(t),i.postRender&&(this.lastPostProcessEffect=i.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,i=e.getDrawingBufferSize(),[r,s]=i;for(let e of(0===t.length&&[0,1].map(e=>{let i=this.device.createTexture({sampler:{minFilter:"linear",magFilter:"linear"},width:r,height:s});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,colorAttachments:[i]}))}),t))e.resize(i)}_postRender(e,t){let{renderBuffers:i}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,s={...t,inputBuffer:i[0],swapBuffer:i[1]};for(let t of e)if(t.postRender){s.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(s);s.inputBuffer=e,s.swapBuffer=e===i[0]?i[1]:i[0]}}}var em=i(80698),e_=i(26839);let ev={pickedColor:null,pickedObjectIndex:-1};function ey({pickedColors:e,decodePickingColor:t,deviceX:i,deviceY:r,deviceRadius:s,deviceRect:n}){let{x:o,y:a,width:l,height:u}=n,h=s*s,c=-1,d=0;for(let t=0;t<u;t++){let s=t+a-r,n=s*s;if(n>h)d+=4*l;else for(let t=0;t<l;t++){if(e[d+3]-1>=0){let e=t+o-i,r=e*e+n;r<=h&&(h=r,c=d)}d+=4}}if(c>=0){let i=e.slice(c,c+4),r=t(i);if(r){let e=Math.floor(c/4/l),t=c/4-e*l;return{...r,pickedColor:i,pickedX:o+t,pickedY:a+e}}f.A.error("Picked non-existent layer. Is picking buffer corrupt?")()}return ev}function eb({pickedColors:e,decodePickingColor:t}){let i=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let s=e.slice(r,r+4),n=s.join(",");if(!i.has(n)){let e=t(s);e?i.set(n,{...e,color:s}):f.A.error("Picked non-existent layer. Is picking buffer corrupt?")()}}}return Array.from(i.values())}function ew({pickInfo:e,viewports:t,pixelRatio:i,x:r,y:s,z:n}){let o,a=t[0];if(t.length>1&&(a=function(e,t){for(let i=e.length-1;i>=0;i--){let r=e[i];if(r.containsPixel(t))return r}return e[0]}(e?.pickedViewports||t,{x:r,y:s})),a){let e=[r-a.x,s-a.y];void 0!==n&&(e[2]=n),o=a.unproject(e)}return{color:null,layer:null,viewport:a,index:-1,picked:!1,x:r,y:s,pixel:[r,s],coordinate:o,devicePixel:e&&"pickedX"in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:i}}function eE(e){let{pickInfo:t,lastPickedInfo:i,mode:r,layers:s}=e,{pickedColor:n,pickedLayer:o,pickedObjectIndex:a}=t,l=o?[o]:[];if("hover"===r){let e=i.index,t=i.layerId,r=o?o.props.id:null;if(r!==t||a!==e){if(r!==t){let e=s.find(e=>e.props.id===t);e&&l.unshift(e)}i.layerId=r,i.index=a,i.info=null}}let u=ew(e),h=new Map;return h.set(null,u),l.forEach(e=>{let t={...u};e===o&&(t.color=n,t.index=a,t.picked=!0);let s=(t=eP({layer:e,info:t,mode:r})).layer;e===o&&"hover"===r&&(i.info=t),h.set(s.id,t),"hover"===r&&s.updateAutoHighlight(t)}),h}function eP({layer:e,info:t,mode:i}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:i,sourceLayer:r}),e=e.parent}return t}class ex{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new ed(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){"layerFilter"in e&&(this.layerFilter=e.layerFilter),"_pickable"in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:i,viewports:r},s=this.lastPickedInfo.info){let n=s&&s.layer&&s.layer.id,o=s&&s.viewport&&s.viewport.id,a=n?i.find(e=>e.id===n):null,l=o&&r.find(e=>e.id===o)||r[0],u=l&&l.unproject([e-l.x,t-l.y]);return{...s,x:e,y:t,viewport:l,coordinate:u,layer:a}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:"rgba8unorm",width:1,height:1,usage:em.g.RENDER_ATTACHMENT|em.g.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:"depth16unorm"}),this.device.isTextureFormatRenderable("rgba32float")){let e=this.device.createTexture({format:"rgba32float",width:1,height:1,usage:em.g.RENDER_ATTACHMENT|em.g.COPY_SRC}),t=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:"depth16unorm"});this.depthFBO=t}}let[t,i]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:i}),this.depthFBO?.resize({width:t,height:i})}_getPickable(e){if(!1===this._pickable)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:i,x:r,y:s,radius:n=0,depth:o=1,mode:a="query",unproject3D:l,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:h,effects:c}){let d,f=u.cssToDeviceRatio(),p=this._getPickable(e);if(!p||0===i.length)return{result:[],emptyInfo:ew({viewports:i,x:r,y:s,pixelRatio:f})};this._resizeBuffer(u);let g=u.cssToDevicePixels([r,s],!0),m=[g.x+Math.floor(g.width/2),g.y+Math.floor(g.height/2)],_=Math.round(n*f),{width:v,height:y}=this.pickingFBO,b=this._getPickingRect({deviceX:m[0],deviceY:m[1],deviceRadius:_,deviceWidth:v,deviceHeight:y}),w={x:r-n,y:s-n,width:2*n+1,height:2*n+1},E=[],P=new Set;for(let e=0;e<o;e++){let n,g;if(b){let e=await this._drawAndSampleAsync({layers:p,views:t,viewports:i,onViewportActive:h,deviceRect:b,cullRect:w,effects:c,pass:`picking:${a}`,canvasContext:u});n=ey({...e,deviceX:m[0],deviceY:m[1],deviceRadius:_,deviceRect:b})}else n={pickedColor:null,pickedObjectIndex:-1};let v=this._getDepthLayers(n,p,l);if(v.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:v,views:t,viewports:i,onViewportActive:h,deviceRect:{x:n.pickedX??m[0],y:n.pickedY??m[1],width:1,height:1},cullRect:w,effects:c,pass:`picking:${a}:z`,canvasContext:u},!0);e[3]&&(g=e[0])}for(let t of(n.pickedLayer&&e+1<o&&(P.add(n.pickedLayer),n.pickedLayer.disablePickingIndex(n.pickedObjectIndex)),(d=eE({pickInfo:n,lastPickedInfo:this.lastPickedInfo,mode:a,layers:p,viewports:i,x:r,y:s,z:g,pixelRatio:f})).values()))t.layer&&E.push(t);if(!n.pickedColor)break}for(let e of P)e.restorePickingColors();return{result:E,emptyInfo:d.get(null)}}_pickClosestObject({layers:e,views:t,viewports:i,x:r,y:s,radius:n=0,depth:o=1,mode:a="query",unproject3D:l,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:h,effects:c}){let d,f=u.cssToDeviceRatio(),p=this._getPickable(e);if(!p||0===i.length)return{result:[],emptyInfo:ew({viewports:i,x:r,y:s,pixelRatio:f})};this._resizeBuffer(u);let g=u.cssToDevicePixels([r,s],!0),m=[g.x+Math.floor(g.width/2),g.y+Math.floor(g.height/2)],_=Math.round(n*f),{width:v,height:y}=this.pickingFBO,b=this._getPickingRect({deviceX:m[0],deviceY:m[1],deviceRadius:_,deviceWidth:v,deviceHeight:y}),w={x:r-n,y:s-n,width:2*n+1,height:2*n+1},E=[],P=new Set;for(let e=0;e<o;e++){let n,g;if(b){let e=this._drawAndSample({layers:p,views:t,viewports:i,onViewportActive:h,deviceRect:b,cullRect:w,effects:c,pass:`picking:${a}`,canvasContext:u});n=ey({...e,deviceX:m[0],deviceY:m[1],deviceRadius:_,deviceRect:b})}else n={pickedColor:null,pickedObjectIndex:-1};let v=this._getDepthLayers(n,p,l);if(v.length>0){let{pickedColors:e}=this._drawAndSample({layers:v,views:t,viewports:i,onViewportActive:h,deviceRect:{x:n.pickedX??m[0],y:n.pickedY??m[1],width:1,height:1},cullRect:w,effects:c,pass:`picking:${a}:z`,canvasContext:u},!0);e[3]&&(g=e[0])}for(let t of(n.pickedLayer&&e+1<o&&(P.add(n.pickedLayer),n.pickedLayer.disablePickingIndex(n.pickedObjectIndex)),(d=eE({pickInfo:n,lastPickedInfo:this.lastPickedInfo,mode:a,layers:p,viewports:i,x:r,y:s,z:g,pixelRatio:f})).values()))t.layer&&E.push(t);if(!n.pickedColor)break}for(let e of P)e.restorePickingColors();return{result:E,emptyInfo:d.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:i,x:r,y:s,width:n=1,height:o=1,mode:a="query",maxObjects:l=null,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:h,effects:c}){let d=this._getPickable(e);if(!d||0===i.length)return[];this._resizeBuffer(u);let f=u.cssToDeviceRatio(),p=u.cssToDevicePixels([r,s],!0),g=p.x,m=p.y+p.height,_=u.cssToDevicePixels([r+n,s+o],!0),v=_.x+_.width,y=_.y,b=await this._drawAndSampleAsync({layers:d,views:t,viewports:i,onViewportActive:h,deviceRect:{x:g,y:y,width:v-g,height:m-y},cullRect:{x:r,y:s,width:n,height:o},effects:c,pass:`picking:${a}`,canvasContext:u}),w=eb(b),E=new Map,P=[],x=Number.isFinite(l);for(let e=0;e<w.length&&(!x||!(P.length>=l));e++){let t=w[e],i={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:s,pixelRatio:f},n=(i=eP({layer:t.pickedLayer,info:i,mode:a})).layer.id;E.has(n)||E.set(n,new Set);let o=E.get(n),l=i.object??i.index;o.has(l)||(o.add(l),P.push(i))}return P}_pickVisibleObjects({layers:e,views:t,viewports:i,x:r,y:s,width:n=1,height:o=1,mode:a="query",maxObjects:l=null,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:h,effects:c}){let d=this._getPickable(e);if(!d||0===i.length)return[];this._resizeBuffer(u);let f=u.cssToDeviceRatio(),p=u.cssToDevicePixels([r,s],!0),g=p.x,m=p.y+p.height,_=u.cssToDevicePixels([r+n,s+o],!0),v=_.x+_.width,y=_.y,b=this._drawAndSample({layers:d,views:t,viewports:i,onViewportActive:h,deviceRect:{x:g,y:y,width:v-g,height:m-y},cullRect:{x:r,y:s,width:n,height:o},effects:c,pass:`picking:${a}`,canvasContext:u}),w=eb(b),E=new Map,P=[],x=Number.isFinite(l);for(let e=0;e<w.length&&(!x||!(P.length>=l));e++){let t=w[e],i={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:s,pixelRatio:f},n=(i=eP({layer:t.pickedLayer,info:i,mode:a})).layer.id;E.has(n)||E.set(n,new Set);let o=E.get(n),l=i.object??i.index;o.has(l)||(o.add(l),P.push(i))}return P}async _drawAndSampleAsync({layers:e,views:t,viewports:i,onViewportActive:r,deviceRect:s,cullRect:n,effects:o,pass:a,canvasContext:l},u=!1){let h=u?this.depthFBO:this.pickingFBO,c={layers:e,layerFilter:this.layerFilter,views:t,viewports:i,onViewportActive:r,pickingFBO:h,deviceRect:s,cullRect:n,effects:o,pass:a,canvasContext:l,pickZ:u,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(c.preRenderStats[e.id]=e.preRender(c));let{decodePickingColor:d,stats:p}=this.pickLayersPass.render(c);this._updateStats(p);let{x:g,y:m,width:_,height:v}=s,y=h.colorAttachments[0]?.texture;if(!y)throw Error("Picking framebuffer color attachment is missing");let b=await this._readTextureDataAsync(y,{x:g,y:m,width:_,height:v},u?Float32Array:Uint8Array);if(!u){let e=!1;for(let t=3;t<b.length;t+=4)if(0!==b[t]){e=!0;break}!e&&b.length>0&&f.A.warn("Async pick readback returned only zero alpha values",{deviceRect:s,bytes:Array.from(b.subarray(0,Math.min(b.length,16)))})()}return{pickedColors:b,decodePickingColor:d}}async _readTextureDataAsync(e,t,i){let{width:r,height:s}=t,n=e.computeMemoryLayout(t),o=this.device.createBuffer({byteLength:n.byteLength,usage:e_.h.COPY_DST|e_.h.MAP_READ});try{e.readBuffer(t,o);let a=await o.readAsync(0,n.byteLength),l=i.BYTES_PER_ELEMENT;if(n.bytesPerRow%l!=0)throw Error(`Texture readback row stride ${n.bytesPerRow} is not aligned to ${l}-byte elements.`);let u=new i(a.buffer,a.byteOffset,n.byteLength/l),h=4*r,c=n.bytesPerRow/l;if(c<h)throw Error(`Texture readback row stride ${c} is smaller than packed row length ${h}.`);let d=new i(r*s*4);for(let e=0;e<s;e++){let t=e*c;d.set(u.subarray(t,t+h),e*h)}return d}finally{o.destroy()}}_drawAndSample({layers:e,views:t,viewports:i,onViewportActive:r,deviceRect:s,cullRect:n,effects:o,pass:a,canvasContext:l},u=!1){let h=u?this.depthFBO:this.pickingFBO,c={layers:e,layerFilter:this.layerFilter,views:t,viewports:i,onViewportActive:r,pickingFBO:h,deviceRect:s,cullRect:n,effects:o,pass:a,canvasContext:l,pickZ:u,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(c.preRenderStats[e.id]=e.preRender(c));let{decodePickingColor:d,stats:f}=this.pickLayersPass.render(c);this._updateStats(f);let{x:p,y:g,width:m,height:_}=s,v=new(u?Float32Array:Uint8Array)(m*_*4);return this.device.readPixelsToArrayWebGL(h,{sourceX:p,sourceY:g,sourceWidth:m,sourceHeight:_,target:v}),{pickedColors:v,decodePickingColor:d}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:i}of e)t+=i;this.stats.get("Layers picked").addCount(t)}_getDepthLayers(e,t,i){if(!i||!this.depthFBO)return[];let{pickedLayer:r}=e,s=r?.state?.terrainDrawMode==="drape";return r&&!s?[r]:t.filter(e=>e.props.operation.includes("terrain"))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:i,deviceWidth:r,deviceHeight:s}){let n=Math.max(0,e-i),o=Math.max(0,t-i),a=Math.min(r,e+i+1)-n,l=Math.min(s,t+i+1)-o;return a<=0||l<=0?null:{x:n,y:o,width:a,height:l}}}let eS={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},eM="root";class eA{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add("deck-widget-container"),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!(0,E.b)(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);for(let e in this.defaultWidgets.length=0,this.resolvedWidgets.length=0,this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let i=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getWidgets()){let{viewId:s}=r;if(s){let e=i[s];e&&(r.onViewportChange&&r.onViewportChange(e),r.onRedraw?.({viewports:[e],layers:t}))}else{if(r.onViewportChange)for(let t of e)r.onViewportChange(t);r.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=i,this._updateContainers()}onHover(e,t){for(let i of this.getWidgets()){let{viewId:r}=i;r&&r!==e.viewport?.id||i.onHover?.(e,t)}}getCanvasBounds(e){let t=this.deck?.getCanvas?.(),i=t?.getBoundingClientRect(),r=this.parentElement?.getBoundingClientRect(),s=this.deck?.getCanvasContext?.(e?.id);if(s&&r){s.updatePosition();let[e,t]=s.getPosition(),[i,n]=s.getCSSSize();return{x:e-r.left,y:t-r.top,width:i,height:n}}return{x:i&&r?i.left-r.left:0,y:i&&r?i.top-r.top:0,width:i?.width||this.deck?.width||0,height:i?.height||this.deck?.height||0}}onEvent(e,t){let i=$.tg[t.type];if(i)for(let r of this.getWidgets()){let{viewId:s}=r;s&&s!==e.viewport?.id||r[i]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;for(let e of(this.resolvedWidgets.length=0,this.defaultWidgets))t[e.id]=null,this.resolvedWidgets.push(e);for(let i of e){let e=t[i.id];e?e.viewId!==i.viewId||e.placement!==i.placement?(this._removeWidget(e),this._addWidget(i)):i!==e&&(e.setProps(i.props),i=e):this._addWidget(i),t[i.id]=null,this.resolvedWidgets.push(i)}for(let e in t){let i=t[e];i&&this._removeWidget(i)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:i="top-left"}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,i).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&"string"!=typeof e)return e;let i=e||eM,r=this.containers[i];r||((r=document.createElement("div")).style.pointerEvents="none",r.style.position="absolute",r.style.overflow="hidden",this.parentElement?.append(r),this.containers[i]=r);let s=r.querySelector(`.${t}`);return s||((s=globalThis.document.createElement("div")).className=t,s.style.position="absolute",s.style.zIndex="2",Object.assign(s.style,eS[t]),r.append(s)),s}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,i=e===eM||t,r=this.containers[e];if(i){let e=this._getContainerBounds(t);r.style.display="block",r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display="none"}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}}var eC=i(1354);let eT={zIndex:"1",position:"absolute",pointerEvents:"none",color:"#a0a7b4",backgroundColor:"#29323c",padding:"10px",top:"0",left:"0",display:"none"};class ek extends eC.x{constructor(e={}){super(e),this.id="default-tooltip",this.placement="fill",this.className="deck-tooltip",this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement("div");return e.className=this.className,Object.assign(e.style,eT),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,i=t&&t.props.getTooltip;if(!i)return;let r=i(e),s=this.widgetManager?.getCanvasBounds(e.viewport),n=e.x+(s?.x||0),o=e.y+(s?.y||0);this.setTooltip(r,n,o)}setTooltip(e,t,i){let r=this.rootElement;if(r){if("string"==typeof e)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display="none";return}this.isVisible=!0,r.style.display="block",r.style.transform=`translate(${t}px, ${i}px)`,e&&"object"==typeof e&&"style"in e&&Object.assign(r.style,e.style)}}}ek.defaultProps={...eC.x.defaultProps};var eL=i(24067);class eI{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),i={},r=[],s=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);s.set(t,(s.get(t)||0)+1)}for(let{id:n,canvas:o}of t){let t=this._getEventRoot(o),a=1===s.get(t)?t:o,l=this.targets[n];if(!l||l.device!==e.device||l.canvas!==o||l.eventRoot!==a){l?.eventManager.destroy(),l?.presentationContext.destroy();let t=e.device.createPresentationContext({id:n,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});l={id:n,device:e.device,canvas:o,eventRoot:a,presentationContext:t,eventManager:this._createEventManager(a)}}this._eventRootToCanvasId.set(a,n),this._eventRootToCanvasId.set(o,n),i[n]=l,r.push(n)}for(let[e,t]of Object.entries(this.targets))i[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=i,this.order=r;let n=Object.fromEntries(Object.entries(i).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(n)||(this.eventManagers=n)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||P]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,i)=>{let r,s;return"string"==typeof e?(r=document.getElementById(e),(0,eL.A)(r,`Canvas with id ${e} not found`),s=e):s=(r=e).id||`deckgl-canvas-${i}`,(0,eL.A)(!t.has(s),`Duplicate canvas id ${s}`),t.add(s),{id:s,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),i=Object.keys(this.eventManagers);return t.length===i.length&&t.every(t=>e[t]===this.eventManagers[t])}}var eO=i(23459),eR=i(5223);function eB(e,t){if(!e)throw Error(t||"loader assertion failed.")}let ez={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};ez.self||ez.window||ez.global,ez.window||ez.self||ez.global,ez.global||ez.self||ez.window,ez.document;let ej=!!("object"!=typeof process||"[object process]"!==String(process)||process.browser),eD="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);eD&&parseFloat(eD[1]);let eF=globalThis.loaders?.parseImageNode,eN="u">typeof Image,eU="u">typeof ImageBitmap,eV=!!ej||!!eF,e$=/^data:image\/svg\+xml/,eW=/\.svg((\?|#).*)?$/;function eG(e){return e&&(e$.test(e)||eW.test(e))}function eq(e,t){if(eG(t))throw Error("SVG cannot be parsed directly to imagebitmap");return new Blob([new Uint8Array(e)])}async function eY(e,t,i){let r=function(e,t){if(eG(t)){let t=new TextDecoder().decode(e);try{"function"==typeof unescape&&"function"==typeof encodeURIComponent&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return eq(e,t)}(e,i),s=self.URL||self.webkitURL,n="string"!=typeof r&&s.createObjectURL(r);try{return await eH(n||r,t)}finally{n&&s.revokeObjectURL(n)}}async function eH(e,t){let i=new Image;return(i.src=e,t.image&&t.image.decode&&i.decode)?(await i.decode(),i):await new Promise((e,t)=>{try{i.onload=()=>e(i),i.onerror=e=>{let i=e instanceof Error?e.message:"error";t(Error(i))}}catch(e){t(e)}})}let eZ=!0;async function eX(e,t,i){let r;r=eG(i)?await eY(e,t,i):eq(e,i);let s=t&&t.imagebitmap;return await eK(r,s)}async function eK(e,t=null){if((function(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}(t)||!eZ)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),eZ=!1}return await createImageBitmap(e)}function eJ(e){var t,i;let r,s,n,o,a=eQ(e);return((r=eQ(a)).byteLength>=24&&0x89504e47===r.getUint32(0,!1)?{mimeType:"image/png",width:r.getUint32(16,!1),height:r.getUint32(20,!1)}:null)||function(e){let t=eQ(e);if(!(t.byteLength>=3&&65496===t.getUint16(0,!1)&&255===t.getUint8(2)))return null;let{tableMarkers:i,sofMarkers:r}=function(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}(),s=2;for(;s+9<t.byteLength;){let e=t.getUint16(s,!1);if(r.has(e))return{mimeType:"image/jpeg",height:t.getUint16(s+5,!1),width:t.getUint16(s+7,!1)};if(!i.has(e))break;s+=2,s+=t.getUint16(s,!1)}return null}(a)||((s=eQ(a)).byteLength>=10&&0x47494638===s.getUint32(0,!1)?{mimeType:"image/gif",width:s.getUint16(6,!0),height:s.getUint16(8,!0)}:null)||((n=eQ(a)).byteLength>=14&&16973===n.getUint16(0,!1)&&n.getUint32(2,!0)===n.byteLength?{mimeType:"image/bmp",width:n.getUint32(18,!0),height:n.getUint32(22,!0)}:null)||((o=!function(e,t,i=0){let r=[...t].map(e=>e.charCodeAt(0));for(let t=0;t<r.length;++t)if(r[t]!==e[t+i])return!1;return!0}(i=new Uint8Array((t=a)instanceof DataView?t.buffer:t),"ftyp",4)||(96&i[8])==0?null:function(e){switch(String.fromCharCode(...e.slice(8,12)).replace("\0"," ").trim()){case"avif":case"avis":return{extension:"avif",mimeType:"image/avif"};default:return null}}(i))?{mimeType:o.mimeType,width:0,height:0}:null)}function eQ(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error("toDataView")}async function e0(e,t){let{mimeType:i}=eJ(e)||{},r=globalThis.loaders?.parseImageNode;return eB(r),await r(e,i)}let e1={dataType:null,batchType:null,id:"image",module:"images",name:"Images",version:"4.5.2",mimeTypes:["image/png","image/jpeg","image/gif","image/webp","image/avif","image/bmp","image/vnd.microsoft.icon","image/svg+xml"],extensions:["png","jpg","jpeg","gif","webp","bmp","ico","svg","avif"],parse:async function e(e,t,i){let r,s=((t=t||{}).image||{}).type||"auto",{url:n}=i||{};switch(function(e){switch(e){case"auto":case"data":if(eU)return"imagebitmap";if(eN)return"image";if(eV)return"data";throw Error("Install '@loaders.gl/polyfills' to parse images under Node.js");default:return!function(e){switch(e){case"auto":return eU;case"imagebitmap":case"image":case"data":return;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}(e),e}}(s)){case"imagebitmap":r=await eX(e,t,n);break;case"image":r=await eY(e,t,n);break;case"data":r=await e0(e,t);break;default:eB(!1)}return"data"===s&&(r=function(e){switch(function(e){var t;let i=(t=e,"u">typeof ImageBitmap&&t instanceof ImageBitmap?"imagebitmap":"u">typeof Image&&t instanceof Image?"image":t&&"object"==typeof t&&t.data&&t.width&&t.height?"data":null);if(!i)throw Error("Not an image");return i}(e)){case"data":return e;case"image":case"imagebitmap":let t=document.createElement("canvas"),i=t.getContext("2d");if(!i)throw Error("getImageData");return t.width=e.width,t.height=e.height,i.drawImage(e,0,0),i.getImageData(0,0,e.width,e.height);default:throw Error("getImageData")}}(r)),r},tests:[e=>!!eJ(new DataView(e))],options:{image:{type:"auto",decode:!0}}},e2={dataType:null,batchType:null,id:"JSON",name:"JSON",module:"",version:"",options:{},extensions:["json","geojson"],mimeTypes:["application/json","application/geo+json"],testText:function(e){let t=e[0],i=e[e.length-1];return"{"===t&&"}"===i||"["===t&&"]"===i},parseTextSync:JSON.parse},e3=function(){let e="9.4.0",t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(f.A.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:f.A,_registerLoggers:p.k},(0,eR.mk)([e2,[e1,{imagebitmap:{premultiplyAlpha:"none"}}]])),e}();var e4=i(95850),e6=i(81014);let e5=0,e8={requestAnimationFrame:e=>{let t;return(t="u">typeof window?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null)?t.call(window,e):setTimeout(()=>e("u">typeof performance?performance.now():Date.now()),1e3/60)},cancelAnimationFrame:e=>{let t;(t="u">typeof window?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null)?t.call(window,e):clearTimeout(e)}};class e9{static defaultAnimationLoopProps={device:null,onAddHTML:()=>"",onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:e8};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw="initialized";_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(e){if(this.props={...e9.defaultAnimationLoopProps,...e},!(e=this.props).device)throw Error("No device provided");this.stats=e.stats||new m.A({id:`animation-loop-${e5++}`}),this.sharedStats=e4.a.stats.get("Animation Loop"),this.frameRate=this.stats.get("Frame Rate"),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get("CPU Time"),this.gpuTime=this.stats.get("GPU Time"),this.setProps({autoResizeViewport:e.autoResizeViewport,animationFrameProvider:e.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(e){this._error=e,this.props.onError(e),this.props.onError===e9.defaultAnimationLoopProps.onError&&"u">typeof window&&"u">typeof ErrorEvent&&window.dispatchEvent(new ErrorEvent("error",{error:e,message:e.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if("autoResizeViewport"in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),"animationFrameProvider"in e){let t=e.animationFrameProvider||e8;if(t!==this.props.animationFrameProvider){let e=null!==this._animationFrameId;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{let e;if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}if(!this._running)return null;return!1!==e&&(this._cancelAnimationFrame(),this._requestAnimationFrame()),this}catch(t){let e=t instanceof Error?t:Error("Unknown error");throw this.props.onError(e),e}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error||(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&(this._resolveNextFrame(this),this._nextFramePromise=null,this._resolveNextFrame=null),this._endFrameTimers()),this}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw("waitForRender"),this._nextFramePromise||(this._nextFramePromise=new Promise(e=>{this._resolveNextFrame=e})),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw("toDataURL"),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error("OffscreenCanvas")}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){null!==this._animationFrameId&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(t){let e=t instanceof Error?t:Error(String(t));this.reportError(e),this.stop()}}_renderFrame(e){if(this.display)return void this.display._renderFrame(e);let t=this.props.onRender(this._getAnimationProps());this.device&&!1!==t&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error("loop");let t=e?.canvas,i=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:i,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null}}_getAnimationProps(){if(!this.animationProps)throw Error("animationProps");return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:i}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw("drawing buffer resized"),i!==this.animationProps.aspect&&this.setNeedsRedraw("drawing buffer aspect changed"),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=i,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error("No device provided");this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement("div");document.body.appendChild(e),e.style.position="relative";let t=document.createElement("div");t.style.position="absolute",t.style.left="10px",t.style.bottom="10px",t.style.width="300px",t.style.background="white",this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let i=this.props.onAddHTML(t);i&&(t.innerHTML=i)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??("u">typeof performance?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;void 0!==e&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener("mousemove",this._onMousemove.bind(this)),this.canvas.addEventListener("mouseleave",this._onMouseleave.bind(this)))}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}}var e7=i(92767);function te(){}let tt={id:"",width:"100%",height:"100%",style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:"auto",layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:"none",eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:te,onWebGLInitialized:te,onResize:te,onViewStateChange:te,onInteractionStateChange:te,onBeforeRender:te,onAfterRender:te,onLoad:te,onError:e=>f.A.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:({isDragging:e})=>e?"grabbing":"grab",getTooltip:null,debug:!1,drawPickingColors:!1};class ti{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new m.A({id:"deck.gl"}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw="Initial render",this._canvasManager=new eI({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._pickRequest={mode:"hover",x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,i=this._getCanvasIdFromEvent(e);if("pointerleave"===e.type)t.x=-1,t.y=-1,t.radius=0,t.canvasId=i;else{if(e.leftButton||e.rightButton)return;let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=i}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=$.tg[e.type],i=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!i||!this.layerManager)return;let s=this.layerManager.getLayers(),n=this._getInternalPickingMode();if(n){if("sync"===n){let t="click"===e.type&&this._shouldUnproject3D(s)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(i.x,i.y,{unproject3D:!0,canvasId:r},s))):this._getLastPointerDownPickingInfo(i.x,i.y,r,s);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(i.x,i.y,r,s))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,i=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let s=this.layerManager?.getLayers()||[],n=++this._pointerDownPickSequence;if("sync"===r){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:i,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:i},s)).then(e=>this._getFirstPickedInfo(e)).then(e=>(n===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,i,s):{};return n===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...tt,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&f.A.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let i=this.device;!i&&e.gl&&(e.gl instanceof WebGLRenderingContext&&f.A.error("WebGL1 context not supported.")(),i=e6.l.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...this.props.deviceProps})),i||(i=this._createDevice(e)),this.animationLoop=this._createAnimationLoop(i,e),this.setProps(t),e._typedArrayManagerProps&&eO.A.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get("setProps Time").timeStart(),"onLayerHover"in e&&f.A.removed("onLayerHover","onHover")(),"onLayerClick"in e&&f.A.removed("onLayerClick","onClick")(),e.initialViewState&&!(0,E.b)(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),(0,eL.A)(!("_canvases"in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),this._isMultiCanvasMode()||this.canvas===t.canvas||(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),f.A.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),void 0!==e.useDevicePixels&&this._canvasContext?.setProps)for(let t of(this._canvasContext.setProps({useDevicePixels:e.useDevicePixels}),Object.values(this._canvasManager.targets)))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels});this.layerManager&&(this.viewManager.setProps(t),this.layerManager.activateViewport(this.getViewports()[0]),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get("setProps Time").timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return"Deck._animate";let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let i=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),s=this.effectManager.needsRedraw(e),n=this.deckRenderer.needsRedraw(e);return t||i||r||s||n}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});(t=e||t)&&(this.stats.get("Redraw Count").incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return null!==this.viewManager}getViews(){return(0,eL.A)(this.viewManager),this.viewManager.views}getView(e){return(0,eL.A)(this.viewManager),this.viewManager.getView(e)}getViewports(e){return(0,eL.A)(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||P;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync("pickObjectAsync","pickObject Time",e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync("pickObjectsAsync","pickObjects Time",e)}pickObject(e){let t=this._pick("pickObject","pickObject Time",e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick("pickObject","pickMultipleObjects Time",e).result}pickObjects(e){return this._pick("pickObjects","pickObjects Time",e)}_pickPositionForController(e,t,i){return"sync"!==this._getInternalPickingMode()?null:this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:i?this.viewManager?.getCanvasId(i):void 0})}_addResources(e,t=!1){for(let i in e)this.layerManager.resourceManager.add({resourceId:i,data:e[i],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if("auto"===e)return"webgpu"===t?"async":"sync";if("sync"===e&&"webgpu"===t)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>"3d"===e.props.pickable)}_getPointPickOptions(e,t,i={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:i.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...i}}_pickPointSync(e){return this._pick("pickObject","pickObject Time",e)}_pickPointAsync(e){return this._pickAsync("pickObjectAsync","pickObject Time",e)}_getLastPointerDownPickingInfo(e,t,i,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:i})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},i){if(!this.widgetManager)return;this.cursorState.isHovering=e.length>0;let r=t,s=!1;for(let t of e)r=t,s=t.layer?.onHover(t,i)||s;s||(this.props.onHover?.(r,i),this.widgetManager.onHover(r,i))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let i=$.tg[t.type];if(!i)return;let{layer:r}=e,s=r&&(r[i]||r.props[i]),n=this.props[i],o=!1;s&&(o=s.call(r,e,t)),o||(n?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,i){(0,eL.A)(this.deckPicker);let{stats:r}=this,s=this._isMultiCanvasMode()?i.canvasId||this._getDefaultCanvasId():i.canvasId,n=this._getCanvasContext(s)||void 0;r.get("Pick Count").incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(s);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(i),views:this.viewManager.getViews(),viewports:this.getViewports({...i,canvasId:s}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...i,canvasId:s,canvasContext:n});return r.get(t).timeEnd(),o}_pick(e,t,i){(0,eL.A)(this.deckPicker);let{stats:r}=this,s=this._isMultiCanvasMode()?i.canvasId||this._getDefaultCanvasId():i.canvasId,n=this._getCanvasContext(s)||void 0;r.get("Pick Count").incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(s);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(i),views:this.viewManager.getViews(),viewports:this.getViewports({...i,canvasId:s}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...i,canvasId:s,canvasContext:n});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return"string"==typeof t&&(t=document.getElementById(t),(0,eL.A)(t)),t?this._ownedCanvas=null:((t=document.createElement("canvas")).id=e.id||"deckgl-overlay",e.width&&"number"==typeof e.width&&(t.width=e.width),e.height&&"number"==typeof e.height&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||P}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&((0,eL.A)(!e.canvas),(0,eL.A)(!e.gl),(0,eL.A)(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new e7.EU(e,{touchAction:this.props.touchAction,recognizers:Object.keys($.We).map(e=>{let[t,i,r,s]=$.We[e],n=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...i,...n,event:e}),recognizeWith:r,requireFailure:s}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in $.tg)"dblclick"===e?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(".deck-events-root")||this.props.parent?.querySelector(".deck-events-root")||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,"style"in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let i=e.getDefaultCanvasContext();this._setCanvasContext(i),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let i=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=i;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:i}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=te),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:i}=e;if(t||0===t){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(i||0===i){let t=Number.isFinite(i)?`${i}px`:i;this.canvas.style.position=e.style?.position||"absolute",this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[i,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(i,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t("number"==typeof e.width&&Number.isFinite(e.width)?e.width:1,"number"==typeof e.height&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode())return void this._updateMultiCanvasDimensions();let{canvas:t}=this,[i,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(i!==this.width||r!==this.height)&&(this.width=i,this.height=r,this.viewManager?.setProps({width:i,height:r}),this.layerManager?.activateViewport(this.getViewports()[0]),this.props.onResize({width:i,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:i}=e.canvas;e.setDrawingBufferSize(t,i)}this._needsRedraw="Canvas resized",this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw="Canvas resized",this.viewManager?.setNeedsUpdate("Canvas resized"),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:i,onError:r}=t;return new e9({device:e,autoResizeDrawingBuffer:!i&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,i={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps};i.adapters.includes(e6.l)||i.adapters.push(e6.l);let r={alphaMode:this.props.deviceProps?.type==="webgpu"?"premultiplied":void 0};return e4.a.createDevice({_reuseDevices:!0,type:"webgl",...i,createCanvasContext:{...r,..."object"==typeof t?t:void 0,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new C({id:"default-view"})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error("WebGL context is lost"))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,i=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},i),s=this._getInternalPickingMode(),n=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!s)return;if("sync"===s)return void this._applyHoverCallbacks(this._pickPointSync(r),t);this._pickPointAsync(r).then(({result:e,emptyInfo:i})=>{n===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:i},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),"webgl"===this.device.type&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized(this.device),"webgl"===this.device.type&&this.props.onWebGLInitialized(this.device.gl);let t=new n;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);(0,eL.A)(e),this.eventManager=this._createEventManager(e),this.eventManagers={[P]:this.eventManager}}this.viewManager=new x({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let i=this.viewManager.getViewports()[0];this.layerManager=new w(this.device,{deck:this,stats:this.stats,viewport:i,timeline:t}),this.effectManager=new eu({deck:this,device:this.device}),this.deckRenderer=new eg(this.device,{stats:this.stats}),this.deckPicker=new ex(this.device,{stats:this.stats});let r=this.props.parent?.querySelector(".deck-widgets-root")||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new eA({deck:this,parentElement:r}),this.widgetManager.addDefault(new ek),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:i,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:i,gl:r});let s={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:"screen",effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&"screen"===s.pass&&!s.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=s.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...s,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let i=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=i.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...s,canvasContext:i.presentationContext,target:r,viewports:t}),i.presentationContext.present()}else this.deckRenderer?.renderLayers(s);"screen"===s.pass&&this.widgetManager.onRedraw({viewports:s.viewports,layers:s.layers}),this.props.onAfterRender({device:i,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),f.A.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},!this.props.viewState&&this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get("frameRate").timeEnd(),e.get("frameRate").timeStart();let t=this.animationLoop.stats;e.get("GPU Time").addTime(t.get("GPU Time").lastTiming),e.get("CPU Time").addTime(t.get("CPU Time").lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get("frameRate").getHz(),e.setPropsTime=t.get("setProps Time").time,e.updateAttributesTime=t.get("Update Attributes").time,e.framesRedrawn=t.get("Redraw Count").count,e.pickTime=t.get("pickObject Time").time+t.get("pickMultipleObjects Time").time+t.get("pickObjects Time").time,e.pickCount=t.get("Pick Count").count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get("Layers rendered").lastSampleCount,e.pickLayersCount=t.get("Layers picked").lastSampleCount,e.updateLayersCount=t.get("Layer updates").count,e.updateAttributesCount=t.get("Attributes updated").count,e.gpuTime=t.get("GPU Time").time,e.cpuTime=t.get("CPU Time").time,e.gpuTimePerFrame=t.get("GPU Time").getAverageTime(),e.cpuTimePerFrame=t.get("CPU Time").getAverageTime();let i=e4.a.stats.get("GPU Time and Memory");e.bufferMemory=i.get("Buffer Memory").count,e.textureMemory=i.get("Texture Memory").count,e.renderbufferMemory=i.get("Renderbuffer Memory").count,e.gpuMemory=i.get("GPU Memory").count}}ti.defaultProps=tt,ti.VERSION=e3;let tr=ti},41881(e,t,i){i.d(t,{A:()=>tl});var r={};i.r(r),i.d(r,{arithmetic:()=>C,dot:()=>O,equalAll:()=>R,extent:()=>T,fround:()=>k,gather:()=>L,interleave:()=>I,length:()=>B,segmentedMap:()=>z,select:()=>D,sequence:()=>N,swizzle:()=>U});var s=i(26839),n=i(15250),o=i(40462),a=i(57285);let l=a.r.getDataType.bind(a.r);function u(e,t,i){if(t.size>4)return null;let r="webgpu"===i&&"uint8"===t.type?"unorm8":t.type,s=t.size,n=!!("webgpu"!==i&&3===s&&r&&["uint8","sint8","unorm8","snorm8","uint16","sint16","unorm16","snorm16"].includes(r));return{attribute:e,format:s>1?`${r}x${s}${n?"-webgl":""}`:t.type,byteOffset:t.offset||0}}function h(e){return e.stride||e.size*e.bytesPerElement}var c=i(23459),d=i(25667),f=i(3459);function p(e,t){t.offset&&f.A.removed("shaderAttribute.offset","vertexOffset, elementOffset")();let i=h(e),r=(void 0!==t.vertexOffset?t.vertexOffset:e.vertexOffset||0)*i+(t.elementOffset||0)*e.bytesPerElement+(e.offset||0);return{...t,offset:r,stride:i}}class g{constructor(e,t,i){let r;this._buffer=null,this.device=e,this.id=t.id||"",this.size=t.size||1;let s=t.logicalType||t.type,n="float64"===s,{defaultValue:a}=t;a=Number.isFinite(a)?[a]:a||Array(this.size).fill(0),r=n?"float32":!s&&t.isIndexed?"uint32":s||"float32";let l=function(e){switch(e){case"float64":return Float64Array;case"uint8":case"unorm8":return Uint8ClampedArray;default:return(0,o.Ak)(e)}}(s||r);this.doublePrecision=n,n&&!1===t.fp64&&(l=Float32Array),this.value=null,this.settings={...t,defaultType:l,defaultValue:a,logicalType:s,type:r,normalized:r.includes("norm"),size:this.size,bytesPerElement:l.BYTES_PER_ELEMENT},this.state={...i,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*h(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&(this._buffer.delete(),this._buffer=null),c.A.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&"webgpu"!==this.device.type?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let i={};if(this.state.constant){let r=this.value;if("webgpu"===this.device.type&&this._buffer)i[e]=this._buffer;else if(t){let s=p(this.getAccessor(),t),n=s.offset/r.BYTES_PER_ELEMENT,o=s.size||this.size;i[e]=r.subarray(n,n+o)}else i[e]=r}else i[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?i[`${e}64Low`]=i[e]:i[`${e}64Low`]=new Float32Array(this.size)),i}_getBufferLayout(e=this.id,t=null){let i=this.getAccessor(),r=[],s={name:this.id,byteStride:"webgpu"===this.device.type&&this.state.constant?0:h(i)};if(this.doublePrecision){let s,n={high:s=p(i,t||{}),low:{...s,offset:s.offset+4*i.size}};r.push(u(e,{...i,...n.high},this.device.type),u(`${e}64Low`,{...i,...n.low},this.device.type))}else if(t){let s=p(i,t);r.push(u(e,{...i,...s},this.device.type))}else r.push(u(e,i,this.device.type));return s.attributes=r.filter(Boolean),s}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:i,size:r}=this,s=i*r;if(t&&s&&t.length>=s){let i=Array(r).fill(1/0),n=Array(r).fill(-1/0);for(let e=0;e<s;)for(let s=0;s<r;s++){let r=t[e++];r<i[s]&&(i[s]=r),r>n[s]&&(n[s]=r)}e=[i,n]}}return this.state.bounds=e,e}setData(e){let t,{state:i}=this;t=ArrayBuffer.isView(e)?{value:e}:e instanceof s.h?{buffer:e}:e;let r={...this.settings,...t};if(ArrayBuffer.isView(t.value)){if(!t.type)if(this.doublePrecision&&t.value instanceof Float64Array)r.type="float32";else{let e=l(t.value);r.type=r.normalized?e.replace("int","norm"):e}r.bytesPerElement=t.value.BYTES_PER_ELEMENT,r.stride=h(r)}if(i.bounds=null,t.constant){let e=t.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!i.constant||!this._areValuesEqual(e,this.value)))return!1;i.externalBuffer=null,i.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(t.buffer)i.externalBuffer=t.buffer,i.constant=!1,this.value=t.value||null;else if(t.value){this._checkExternalBuffer(t);let e=t.value,s=e;i.externalBuffer=null,i.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(s)&&(s=(0,d.cT)(s,r),e instanceof Float32Array&&(r.stride=2*r.size*Float32Array.BYTES_PER_ELEMENT));let{buffer:n}=this,o=h(r),a=(r.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;s.constructor!==e&&(s=new e(s))}let l=s.byteLength+a+2*o;(!n||n.byteLength<l)&&(n=this._createBuffer(l)),n.write(s,a)}return this.setAccessor(r),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:i=0,endOffset:r}=e,s=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(s?(0,d.cT)(t,{size:this.size,startIndex:i,endIndex:r}):t.subarray(i,r),i*(s?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:i}=this,r=i.allocatedValue,s=c.A.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=s;let n=this._shouldSplitDoublePrecisionValue(s),o=n&&s instanceof Float32Array?{...this.settings,stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:a}=this,{buffer:l}=this,u=s.byteLength*(n&&s instanceof Float32Array?2:1);return(!l||l.byteLength<u+a)&&(l=this._createBuffer(u+a),t&&r&&l.write(this._shouldSplitDoublePrecisionValue(r)?(0,d.cT)(r,this):r,a)),i.allocatedValue=s,i.constant=!1,i.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||"webgpu"===this.device.type&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let i=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);t instanceof i||!this.settings.normalized||"normalized"in e||f.A.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case"snorm8":return new Float32Array(e).map(e=>(e+128)/255*2-1);case"snorm16":return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case"unorm8":return new Float32Array(e).map(e=>e/255);case"unorm16":return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,i){let{defaultValue:r,size:s}=this.settings;if(Number.isFinite(e))return t[i]=e,t;if(!e){let e=s;for(;--e>=0;)t[i+e]=r[e];return t}switch(s){case 4:t[i+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[i+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[i+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[i+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let n=s;for(;--n>=0;)t[i+n]=Number.isFinite(e[n])?e[n]:r[n]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:i}=this;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:i}=this.settings,r="webgpu"!==this.device.type||t?(t?s.h.INDEX:s.h.VERTEX)|s.h.COPY_DST:s.h.VERTEX|s.h.STORAGE|s.h.COPY_DST|s.h.COPY_SRC;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:r,indexType:t?i:void 0,byteLength:e}),this._buffer}}var m=i(24067),_=i(53439),v=i(38055);let y=[],b=[[0,1/0]],w={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function E(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:"interpolation",duration:e});let i=e.type||"interpolation";return{...w[i],...t,...e,type:i}}class P extends g{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:b}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setAccessor(e){var t,i;(t=this.state).layoutChanged||(i=this.getAccessor(),t.layoutChanged=e.type!==i.type||e.size!==i.size||h(e)!==h(i)||(e.offset||0)!==(i.offset||0)),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat("function"!=typeof e&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,i=this.settings.transition;return E(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],i)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:i=1/0}=t;this.state.updateRanges=function(e,t){if(e===b||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let i=[],r=e.length,s=0;for(let n=0;n<r;n++){let r=e[n];r[1]<t[0]?(i.push(r),s=n+1):r[0]>t[1]?i.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return i.splice(s,0,t),i}(this.state.updateRanges,[e,i])}else this.state.updateRanges=b}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=y}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:i}=this;if(i.noAlloc)return!1;if(i.update){let i=this.isConstant;return super.allocate(e,t.updateRanges!==b),t.layoutChanged||(t.layoutChanged=i&&"webgpu"===this.device.type),!0}return!1}updateBuffer({numInstances:e,data:t,props:i,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:s},settings:{update:n,noAlloc:o}}=this,a=!0;if(n){for(let[o,a]of s)n.call(r,this,{data:t,startRow:o,endRow:a,props:i,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,i]of s){let r=Number.isFinite(t)?this.getVertexOffset(t):0,s=Number.isFinite(i)?this.getVertexOffset(i):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:s})}this._checkAttributeArray()}else a=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),a}setConstantValue(e,t){var i;if(void 0===t||"function"==typeof t)return!1;let r=this.isConstant,s=this.settings.transform&&e?this.settings.transform.call(e,t):t,n=this.settings.defaultType;this.state.constantValue=this._normalizeValue(s,new n(this.size),0);let o=this.setData({constant:!0,value:s});if("webgpu"===this.device.type){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=(0,d.cT)(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:2*this.size*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(i=this.state).layoutChanged||(i.layoutChanged=!r),this.constant=!1}return o&&this.setNeedsRedraw(),this.clearNeedsUpdate(),!0}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e||(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:i,settings:r}=this;if(!e)return i.binaryValue=null,i.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(i.binaryValue===e)return this.clearNeedsUpdate(),!0;if(i.binaryValue=e,this.setNeedsRedraw(),r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let s=e;(0,m.A)(ArrayBuffer.isView(s.value),`invalid ${r.accessor}`);let n=!!s.size&&s.size!==this.size;return i.binaryAccessor=(0,_.I)(s.value,{size:s.size||this.size,stride:s.stride,offset:s.offset,startIndices:t,nested:n}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let i in e)Object.assign(t,super.getValue(i,e[i]));return t}getBufferLayout(e){this.state.layoutChanged=!1;let t=this.settings.shaderAttributes,i=super._getBufferLayout(),{stepMode:r}=this.settings;if("dynamic"===r?i.stepMode=e?e.isInstanced?"instance":"vertex":"instance":i.stepMode=r??"vertex",!t)return i;for(let e in t){let r=super._getBufferLayout(e,t[e]);i.attributes.push(...r.attributes)}return i}_autoUpdater(e,{data:t,startRow:i,endRow:r,props:s,numInstances:n}){let{settings:o,state:a,value:l,size:u,startIndices:h}=e,{accessor:c,transform:d}=o,f=a.binaryAccessor||("function"==typeof c?c:s[c]);(0,m.A)("function"==typeof f,`accessor "${c}" is not a function`);let p=e.getVertexOffset(i),{iterable:g,objectInfo:y}=(0,_.X)(t,i,r);for(let t of g){y.index++;let i=f(t,y);if(d&&(i=d.call(this,i)),h){let t=(y.index<h.length-1?h[y.index+1]:n)-h[y.index];if(i&&Array.isArray(i[0])){let t=p;for(let r of i)e._normalizeValue(r,l,t),t+=u}else i&&i.length>u?l.set(i,p):(e._normalizeValue(i,y.target,0),(0,v.R)({target:l,source:y.target,start:p,count:t}));p+=t*u}else e._normalizeValue(i,l,p),p+=u}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||"function"==typeof e.update))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let i=!0;switch(t){case 4:i=i&&Number.isFinite(e[3]);case 3:i=i&&Number.isFinite(e[2]);case 2:i=i&&Number.isFinite(e[1]);case 1:i=i&&Number.isFinite(e[0]);break;default:i=!1}if(!i)throw Error(`Illegal attribute generated for ${this.id}`)}}}var x=i(29651),S=i(78705);function M({elementWise:e,func:t,inputs:i,output:r,outputBuffer:s}){let n=Array.isArray(i)?i:Object.values(i);for(let e of n)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,a=r.size,l=new r.ValueType(o*a);for(let i=0;i<o;i++){let r=n.map(e=>A(e,i));if(e)for(let e=0;e<a;e++)l[i*a+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,l.subarray(i*a,i*a+a),...r)}let u=r.ValueType.BYTES_PER_ELEMENT,h=r.offset/u,c=r.stride/u,d=l;if(0!==h||c!==a){d=new r.ValueType(h+r.byteLength/u);for(let e=0;e<o;e++){let t=e*a,i=h+e*c,r=l.subarray(t,t+a);d.set(r,i),s.write(r,i*u)}}else s.write(l);return{success:!0,value:d}}function A(e,t){let i=e.value,r=e.size,s=e.offset/e.ValueType.BYTES_PER_ELEMENT,n=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=s+(e.isConstant?0:t)*n,a=i.slice(o,o+r);if(!e.normalized)return a;let l=new Float32Array(r);for(let t=0;t<r;t++)l[t]=function(e,t){switch(t){case"uint8":return e/255;case"uint16":return e/65535;case"uint32":return e/0xffffffff;case"sint8":return Math.max(e/127,-1);case"sint16":return Math.max(e/32767,-1);case"sint32":return Math.max(e/0x7fffffff,-1);case"float32":return e;default:throw Error(`Unsupported normalized source type ${t}`)}}(a[t],e.type);return l}let C=({inputs:e,output:t,target:i})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let i=0;i<t.length;i++){let s=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,A(t,i)]));for(let n=0;n<t.size;n++)r[i*t.size+n]=function e(t,i,r){switch(t.kind){case"input":{let e=i[t.name];if(r<e.length)return e[r];return 1===e.length?e[0]:0}case"literal":if(Array.isArray(t.value))return t.value[r]??0;return t.value;case"call":{!function(e,t){let i=S.E[e].arity;if(t!==i)throw Error(`Arithmetic op '${e}' expects ${i} args, got ${t}`)}(t.op,t.args.length);let s=t.args.map(t=>e(t,i,r));switch(t.op){case"add":return s[0]+s[1];case"subtract":return s[0]-s[1];case"multiply":return s[0]*s[1];case"divide":return s[0]/s[1];case"pow":return Math.pow(s[0],s[1]);case"sqrt":return Math.sqrt(s[0]);case"abs":return Math.abs(s[0]);case"sin":return Math.sin(s[0]);case"cos":return Math.cos(s[0]);case"tan":return Math.tan(s[0]);case"exp":return Math.exp(s[0]);case"log":return Math.log(s[0]);default:{let e=t.op;throw Error(`Unsupported arithmetic op ${e}`)}}}default:throw Error(`Unsupported expression node ${t.kind}`)}}(e.expression,s,n)}return i.write(r),{success:!0,value:r}},T=({inputs:e,output:t,target:i})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let s=new t.ValueType(t.length*t.size);if(0===r.length)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let i=A(r,0)[e],n=e*t.size,o=n+1;s[n]=i,s[o]=i;for(let t=1;t<r.length;t++){let i=A(r,t)[e];i<s[n]&&(s[n]=i),i>s[o]&&(s[o]=i)}}return i.write(s),{success:!0,value:s}},k=({inputs:e,output:t,target:i})=>M({func:(e,t)=>{let i=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<i;t++){let s=r[t];e[t]=Math.fround(s),e[t+i]=s-e[t]}return e},inputs:e,output:t,outputBuffer:i}),L=async({inputs:e,output:t,target:i})=>{let{ids:r,sourceValues:s}=e,n=r.value,o=s.value;if(!n)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${s} does not have CPU value`);let a=new t.ValueType(t.length*t.size),l=Array(t.size).fill(0);for(let e=0;e<t.length;e++){var u,h;let i=Number(A(r,e)[0]),n=(u=i,h=s.length,Number.isInteger(u)&&u>=0&&u<h)?A(s,i):l;a.set(n,e*t.size)}return i.write(a),{success:!0,value:a}},I=({inputs:e,output:t,target:i})=>M({func:(e,...t)=>{let i=0;for(let r of t)e.set(r,i),i+=r.length},inputs:e,output:t,outputBuffer:i}),O=({inputs:e,output:t,target:i})=>{let{x:r,y:s}=e,n=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=A(r,e),i=A(s,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*i[e];n[e]=o}return i.write(n),{success:!0,value:n}},R=({inputs:e,output:t,target:i})=>{let{x:r,y:s}=e,n=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=A(r,e),i=A(s,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==i[e]){o=0;break}n[e]=o}return i.write(n),{success:!0,value:n}},B=({inputs:e,output:t,target:i})=>{let{x:r}=e,s=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=A(r,e),i=0;for(let e=0;e<r.size;e++)i+=t[e]*t[e];s[e]=Math.sqrt(i)}return i.write(s),{success:!0,value:s}},z=async({inputs:e,output:t,target:i})=>{let{segments:r,vertexCount:s}=e,n=r.value;if(!n)throw Error(`${r} does not have CPU value`);var o=n,a=r,l=s;if(a.length<1)throw Error("segmentedMap segments must contain at least one segment start");let u=0;for(let e=0;e<a.length;e++){let t=o[j(a,e)];if(0===e&&0!==t)throw Error(`segmentedMap segments must start at 0, got ${t}`);if(e>0&&t<u)throw Error(`segmentedMap segments must be non-decreasing, got ${t} after ${u}`);u=t}if(u>l)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${u} > ${l}`);let h=new t.ValueType(t.length*t.size),c=0;for(let e=0;e<s;e++){for(;c+1<r.length&&n[j(r,c+1)]<=e;)c++;let i=n[j(r,c)],s=e*t.size;h[s]=c,h[s+1]=e-i}return i.write(h),{success:!0,value:h}};function j(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}let D=async({inputs:e,output:t,target:i})=>{let{condition:r,whenTrue:s,whenFalse:n}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let i=A(r,e),a=A(s,e),l=A(n,e);for(let u=0;u<t.size;u++){let h=F(i,r.size,u);o[e*t.size+u]=0!==h?F(a,s.size,u):F(l,n.size,u)}}return i.write(o),{success:!0,value:o}};function F(e,t,i){return i<t?e[i]:1===t?e[0]:0}let N=({inputs:e,output:t,target:i})=>{let r=new t.ValueType(t.length);for(let i=0;i<t.length;i++)r[i]=e.start+i*e.step;return i.write(r),{success:!0,value:r}},U=({inputs:e,output:t,target:i})=>{let{columns:r}=e;return M({func:(e,t)=>{for(let i=0;i<r.length;i++)e[i]=t[r[i]]},inputs:{x:e.x},output:t,outputBuffer:i})},V=new class{_modules={cpu:r};add(e,t){let i=this._modules[e];if("function"==typeof t.then){let r=Promise.all([Promise.resolve(i||{}),t]).then(([e,t])=>({...e,...t}));return this._modules[e]=r,r.then(t=>{this._modules[e]=t}).catch(t=>{x.R.error(`Failed to register ${e} backend: ${t}`)()}),r}if(i&&"function"==typeof i.then){let r=Promise.resolve(i).then(e=>({...e,...t})).then(t=>(this._modules[e]=t,t)).catch(t=>{throw x.R.error(`Failed to register ${e} backend: ${t}`)(),t});return this._modules[e]=r,r}let r={...i||{},...t};return this._modules[e]=r,Promise.resolve(r)}async get(e,t){let r=this._modules[e];if(!r)if("webgl"===e)r=this.add("webgl",i.e("4435").then(i.bind(i,89022)));else if("webgpu"===e)r=this.add("webgpu",i.e("9916").then(i.bind(i,97095)));else throw Error(`${e} backend not registered`);let s=(await r)[t];if("function"!=typeof s)throw Error(`${e} backend does not implement ${t}`);return s}getSync(e,t){let i=this._modules[e];if(!i)throw Error(`${e} backend not registered`);if("function"==typeof i.then)throw Error(`${e} backend is not loaded yet`);let r=i[t];if("function"!=typeof r)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}};var $=i(34010);class W{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof $.GL)}async execute(e,t){return await this._resolveDependencies(e),await this._executeWithHandler(await V.get(this._getHandlerRegistry(e),this.name),t)}executeSync(e,t){var i;this._resolveDependenciesSync(e);let r=this._executeWithHandler(V.getSync(this._getHandlerRegistry(e),this.name),t);if(i=r,"function"==typeof i?.then)throw Error(`${this.name} returned a Promise in executeSync()`);return r}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e){return this.shouldExecuteOnCPU()?"cpu":e.type}async _resolveDependencies(e){for(let t of this.dependencies)await t.evaluate(e);if("cpu"===this._getHandlerRegistry(e)||"null"===e.type)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if("cpu"===this._getHandlerRegistry(e)||"null"===e.type)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t){return e({device:t.device,inputs:this.inputs,output:this.output,target:t})}}class G extends W{name="interleave";output;constructor(e){super(e);let{isConstant:t,type:i,length:r}=function(...e){let t=function(e){let t=0,i=0;for(let r of e){if("f"===r[0])return"float32";let e=r.endsWith("8")?8:r.endsWith("6")?16:32;"u"===r[0]?t=Math.max(t,e):i=Math.max(i,e)}return t&&!i?`uint${t}`:i&&t<32?`sint${Math.max(i,2*t)}`:"float32"}(e.map(e=>e.type));return"f"!==t[0]&&e.some(e=>e.normalized)&&(t="float32"),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}(...e);this.output=new $.GL({isConstant:t,type:i,size:e.reduce((e,t)=>e+t.size,0),length:r,source:this})}toString(){return`_${this.inputs.join("_")}_`}}var q=i(99305),Y=i(65181);class H{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;static fromGPUVector(e){if(e.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${e.name}"`);if(0===e.data.length)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${e.name}"`);return new H({id:e.name,gpuDataEvaluators:e.data.map(t=>$.GL.fromGPUData(t,{id:e.name})),gpuVector:e,format:e.format})}static fromGPUDataEvaluators(e,t={}){return new H({id:t.id,gpuDataEvaluators:e,format:t.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:i,format:r}){if(0===t.length)throw Error("GPUVectorEvaluator requires at least one GPUData evaluator");(function(e){let t=e[0];for(let i of e.slice(1))if(i.type!==t.type||i.size!==t.size||i.normalized!==t.normalized||i.format!==t.format)throw Error("GPUVectorEvaluator requires matching GPUData evaluator layouts")})(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=i,this._ownsGPUDataEvaluators=!i}get evaluated(){return!!this._gpuVector}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(e){return H.fromGPUDataEvaluators(this.gpuDataEvaluators.map((t,i)=>e(t,i)),{id:this.id})}async evaluate(e,t={}){if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let i=await Promise.all(this.gpuDataEvaluators.map(i=>i.evaluate(e,t))),r=i[0],s=i.map(Z),n=t.format??this.format??r.format;return this._gpuVector=new Y.M({type:"data",name:t.name??this.id??"vector",format:n,data:s,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let i=this.gpuDataEvaluators.map(i=>i.evaluateSync(e,t)),r=i[0],s=i.map(Z),n=t.format??this.format??r.format;return this._gpuVector=new Y.M({type:"data",name:t.name??this.id??"vector",format:n,data:s,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}destroy(){if(this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}toString(){return this.id??this.constructor.name}}function Z(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}function X(e){return e instanceof $.GL?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof q.kL?e.buffer.buffer:e.buffer)}var K=i(10924);class J{constructor(e,{id:t,isTransitionAttribute:i}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=i,"webgpu"===this.device.type&&V.add("webgpu",{interleave:K.C})}hasGroups(e){return"webgpu"===this.device.type&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let i=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,i,t)}getBindings(e,t,i,r){let s=this._getPackedGroups(e,i,{requireValues:!0,excludeAttributes:r}),n={},o=new Set;for(let e of s.values()){let i=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);for(let t of(n[e.id]=this._getPackedBuffer(e,i),e.attributes))o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,s,i).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:n,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:i,excludeAttributes:r}){let s=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let i=s.get(e)||[];i.push(t),s.set(e,i)}let n=new Map;for(let[e,o]of s){let s=this._getPackedGroup(e,o,t,i,r);s&&n.set(e,s)}return n}_getPackedGroup(e,t,i,r,s){if(t.length<2)return null;let n=t.map(e=>e.getBufferLayout(i)),o=n[0].stepMode,a=Math.max(1,t[0].numInstances),l=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let i=t[e],l=i.getAccessor(),u=l.size*l.bytesPerElement;if(s[i.id]||i.settings.isIndexed||i.settings.noAlloc||i.doublePrecision||this.isTransitionAttribute(i.id)||n[e].stepMode!==o||i.numInstances!==t[0].numInstances||0!==(l.offset||0)||0!==(l.vertexOffset||0)||h(l)!==u||r&&(i.isConstant?!i.getConstantValue()||i.getConstantValue().byteLength<u:!ArrayBuffer.isView(i.value)||i.value.byteLength<a*u))return null}let u={},c=[],d=0;for(let e=0;e<t.length;e++){let i=t[e];for(let t of(d=Q(d),u[i.id]=d,n[e].attributes||[]))c.push({...t,byteOffset:d+(t.byteOffset||0)});d+=h(i.getAccessor())}return{id:e,attributes:t,byteStride:d=Q(d),byteOffsets:u,rowCount:a,layout:{name:e,byteStride:l?0:d,stepMode:o,attributes:c}}}_getBufferLayouts(e,t,i){let r=[],s=new Set,n=new Set;for(let e of t.values())for(let t of e.attributes)n.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,a=e&&t.get(e);a&&n.has(o.id)?s.has(a.id)||(r.push(a.layout),s.add(a.id)):r.push(o.getBufferLayout(i))}return r}_getPackedBuffer(e,t){let i=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if(r&&r.layoutKey===i||(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:i},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=function(...e){if(0===e.length)throw Error("interleave() requires at least one input");return 1===e.length?(0,$.uy)(e[0]):new G(e.map($.uy)).output}(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return!function(e,t){let i,r=(function e(t,i,r){var s;if((s=t)instanceof $.GL||s instanceof H)return void i.add(t);if(!(!t||"object"!=typeof t||r.has(t))){let s;if(r.add(t),Array.isArray(t)){for(let s of t)e(s,i,r);return}if((s=Object.getPrototypeOf(t))===Object.prototype||null===s)for(let s of Object.values(t))e(s,i,r)}}(t,i=new Set,new Set),Array.from(i));for(let t of r)t.evaluateSync(e);var s=r;let n=new Set(s.flatMap(X)),o=new Set;for(let e of s)!function e(t,i){if(t instanceof H){for(let r of t.gpuDataEvaluators)e(r,i);return}let r=t.source;if(r){if(r instanceof $.GL){i.has(r)||(i.add(r),e(r,i));return}for(let t of r.dependencies)i.has(t)||(i.add(t),e(t,i))}}(e,o);for(let e of o)e.evaluated&&!n.has(e.buffer)&&e.destroy()}(this.device,t),t}_getInterleaveInput(e,t){let i=h(t.getAccessor()),r=e.byteOffsets[t.id];if(ee(`${e.id}.${t.id} rowByteLength`,i),ee(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return ee(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new $.GL({id:t.id,type:"uint32",size:i/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,i/Uint32Array.BYTES_PER_ELEMENT)})}let s=t.getBuffer(),n=t.byteOffset,o=t.getAccessor().stride||i;if(ee(`${e.id}.${t.id} byteOffset`,n),ee(`${e.id}.${t.id} stride`,o),!s)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new $.GL({id:t.id,type:"uint32",size:i/4,offset:n,stride:o,length:e.rowCount,buffer:s})}}function Q(e){return 4*Math.ceil(e/4)}function ee(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}var et=i(82417),ei=i(43411),er=i(91783);function es(e,t=[],i=0){let r=Math.fround(e),s=e-r;return t[i]=r,t[i+1]=s,t}let en=`\

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
`,eo=`\
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

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var sum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = fp64_two_sum_integer(a.y, b.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.x);
  sum = fp64_two_sum_integer(sum.x, sum.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.y);
  return fp64_two_sum_integer(sum.x, sum.y);
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
  product.y = fp64_round_add_integer(product.y, crossProduct1);
  product = fp64_two_sum_integer(product.x, product.y);
  let crossProduct2 = fp64_round_mul_integer(a.y, b.x);
  product.y = fp64_round_add_integer(product.y, crossProduct2);
  return fp64_two_sum_integer(product.x, product.y);
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
`,ea={name:"fp64arithmetic",source:`\
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
fn fp64_runtime_zero() -> f32 {
  return fp64arithmetic.ONE * 0.0;
}

fn prevent_fp64_optimization(value: f32) -> f32 {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  return value + fp64_runtime_zero();
#else
  return value;
#endif
}
#endif

#ifdef LUMA_FP64_INTEGER_ARITHMETIC
${eo}
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
  b.y = b.y + a.y;
  return b;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let sum = prevent_fp64_optimization((a + b) * fp64arithmetic.ONE);
  let err = prevent_fp64_optimization(b - (sum - a) * fp64arithmetic.ONE);
#else
  let sum = prevent_fp64_optimization(a + b);
  let err = prevent_fp64_optimization(b - (sum - a));
#endif
  return vec2f(sum, err);
}

fn twoSum(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a + b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) +
    prevent_fp64_optimization(b - v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) + prevent_fp64_optimization(b - v);
#endif
  return vec2f(s, err);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a - b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) -
    prevent_fp64_optimization(b + v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) - prevent_fp64_optimization(b + v);
#endif
  return vec2f(s, err);
}

fn twoSqr(a: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * a);
  let aFp64 = split(a);
  let highProduct = prevent_fp64_optimization(aFp64.x * aFp64.x);
  let crossProduct = prevent_fp64_optimization(2.0 * aFp64.x * aFp64.y);
  let lowProduct = prevent_fp64_optimization(aFp64.y * aFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err =
    (prevent_fp64_optimization(highProduct - prod) * fp64arithmetic.ONE +
      crossProduct * fp64arithmetic.ONE * fp64arithmetic.ONE) +
    lowProduct * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
#else
  let err = ((prevent_fp64_optimization(highProduct - prod) + crossProduct) + lowProduct);
#endif
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
#endif
`,fs:en,vs:en,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:"f32",SPLIT:"f32"},fp64ify:es,fp64LowPart:function(e){return e-Math.fround(e)},fp64ifyMatrix4:function(e){let t=new Float32Array(32);for(let i=0;i<4;++i)for(let r=0;r<4;++r){let s=4*i+r;es(e[4*r+i],t,2*s)}return t}};function el(e){let{source:t,target:i,start:r=0,size:s,getData:n}=e,o=e.end||i.length,a=t.length,l=o-r;if(a>l)return void i.set(t.subarray(0,l),r);if(i.set(t,r),!n)return;let u=a;for(;u<l;){let e=n(u,t);for(let t=0;t<s;t++)i[r+u]=e[t]||0,u++}}function eu(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`No defined attribute type for size "${e}"`)}}function eh(e){switch(e){case 1:return"float32";case 2:return"float32x2";case 3:return"float32x3";case 4:return"float32x4";default:throw Error("invalid type size")}}function ec(e){e.push(e.shift())}function ed({device:e,source:t,target:i}){return(!i||i.byteLength<t.byteLength)&&(i?.destroy(),i=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),i}function ef({device:e,buffer:t,attribute:i,fromLength:r,toLength:s,fromStartIndices:n,getData:o=e=>e}){let a=i.isDoublePrecisionBuffer?2:1,l=i.size*a,u=i.byteOffset,h=i.settings.bytesPerElement<4?u/i.settings.bytesPerElement*4:u,c=i.startIndices,d=n&&c,f=i.isConstant;if(!d&&t&&r>=s)return t;let p=i.value instanceof Float64Array?Float32Array:i.value.constructor,g=f?i.value:new p(i.getBuffer().readSyncWebGL(u,s*p.BYTES_PER_ELEMENT).buffer);if(i.settings.normalized&&!f){let e=o;o=(t,r)=>i.normalizeConstant(e(t,r))}let m=f?(e,t)=>o(g,t):(e,t)=>o(g.subarray(e+u,e+u+l),t),_=new Float32Array(t?t.readSyncWebGL(h,4*r).buffer:0),v=new Float32Array(s);return!function({source:e,target:t,size:i,getData:r,sourceStartIndices:s,targetStartIndices:n}){if(!s||!n)return el({source:e,target:t,size:i,getData:r});let o=0,a=0,l=r&&((e,t)=>r(e+a,t)),u=Math.min(s.length,n.length);for(let r=1;r<u;r++){let u=s[r]*i,h=n[r]*i;el({source:e.subarray(o,u),target:t,start:a,end:h,size:i,getData:l}),o=u,a=h}a<t.length&&el({source:[],target:t,start:a,size:i,getData:l})}({source:_,target:v,sourceStartIndices:n,targetStartIndices:c,size:l,getData:m}),(!t||t.byteLength<v.byteLength+h)&&(t?.destroy(),t=e.createBuffer({byteLength:v.byteLength+h,usage:35050})),t.write(v,h),t}var ep=i(2357);class eg{constructor({device:e,attribute:t,timeline:i}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new ep.A(i),this.attribute=t,this.attributeInTransition=function(e){let{device:t,settings:i,value:r}=e,s=new P(t,i);return s.setData({value:r instanceof Float64Array?new Float64Array(0):new Float32Array(0),normalized:i.normalized}),s}(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,i=1/0){this.settings=e,this.currentStartIndices=this.attribute.startIndices,this.currentLength=function(e,t){let{settings:i,value:r,size:s}=e,n=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:a}=e.settings;if(a)for(let e of Object.values(a))o=Math.max(o,e.vertexOffset??0);return(i.noAlloc?r.length:(t+o)*s)*n}(this.attribute,t),this.transition.start({...e,duration:i})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){for(let e of(this.cancel(),this.buffers))e.destroy();this.buffers.length=0}}let em={name:"interpolation",vs:`\
layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:"f32"}},e_=`\
#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,ev=`\
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
`;function ey(e){return e.isDoublePrecisionBuffer}let eb={name:"spring",vs:`\
layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:"f32",stiffness:"f32"}},ew=`\
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
`,eE=`\
#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`,eP={interpolation:class extends eg{constructor({device:e,attribute:t,timeline:i}){var r,s;let n,o,a,l;super({device:e,attribute:t,timeline:i}),this.type="interpolation",this.transform=(r=e,o=eu(n=(s=t).size),a=eh(n),l=s.getBufferLayout(),ey(s)?new er.p(r,{vs:ev,bufferLayout:[{name:"aFrom",byteStride:8*n,attributes:[{attribute:"aFrom",format:a,byteOffset:0},{attribute:"aFrom64Low",format:a,byteOffset:4*n}]},{name:"aTo",byteStride:8*n,attributes:[{attribute:"aTo",format:a,byteOffset:0},{attribute:"aTo64Low",format:a,byteOffset:4*n}]}],modules:[ea,em],defines:{ATTRIBUTE_TYPE:o,ATTRIBUTE_SIZE:n},moduleSettings:{},varyings:["vCurrent","vCurrent64Low"],bufferMode:35980,disableWarnings:!0}):new er.p(r,{vs:e_,bufferLayout:[{name:"aFrom",format:a},{name:"aTo",format:l.attributes[0].format}],modules:[em],defines:{ATTRIBUTE_TYPE:o},varyings:["vCurrent"],disableWarnings:!0}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0)return void this.transition.cancel();let{buffers:s,attribute:n}=this;ec(s),s[0]=ef({device:this.device,buffer:s[0],attribute:n,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),s[1]=ed({device:this.device,source:s[0],target:s[1]}),this.setBuffer(s[1]);let{transform:o}=this,a=o.model,l=Math.floor(this.currentLength/n.size);ey(n)&&(l/=2),a.setVertexCount(l),n.isConstant?(a.setAttributes({aFrom:s[0]}),a.setConstantAttributes({aTo:n.value})):a.setAttributes({aFrom:s[0],aTo:n.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:s[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:i}=this.transition,r=i/e;t&&(r=t(r));let{model:s}=this.transform,n={time:r};s.shaderInputs.setProps({interpolation:n}),this.transform.run({discard:!0})}delete(){super.delete(),this.transform.destroy()}},spring:class extends eg{constructor({device:e,attribute:t,timeline:i}){var r,s,n,o;let a,l;super({device:e,attribute:t,timeline:i}),this.type="spring",this.texture=e.createTexture({data:new Uint8Array(4),format:"rgba8unorm",width:1,height:1}),this.framebuffer=(r=e,s=this.texture,r.createFramebuffer({id:"spring-transition-is-transitioning-framebuffer",width:1,height:1,colorAttachments:[s]})),this.transform=(n=e,a=eu((o=t).size),l=eh(o.size),new er.p(n,{vs:ew,fs:eE,bufferLayout:[{name:"aPrev",format:l},{name:"aCur",format:l},{name:"aTo",format:o.getBufferLayout().attributes[0].format}],varyings:["vNext"],modules:[eb],defines:{ATTRIBUTE_TYPE:a},parameters:{depthCompare:"always",blendColorOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}))}start(e,t){let i=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:s,attribute:n}=this;for(let t=0;t<2;t++)s[t]=ef({device:this.device,buffer:s[t],attribute:n,fromLength:i,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});s[2]=ed({device:this.device,source:s[0],target:s[2]}),this.setBuffer(s[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/n.size)),n.isConstant?o.setConstantAttributes({aTo:n.value}):o.setAttributes({aTo:n.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:i,transition:r}=this,s=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let n={stiffness:s.stiffness,damping:s.damping};t.model.shaderInputs.setProps({spring:n}),t.run({framebuffer:i,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),ec(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(i)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}}};class ex{constructor(e,{id:t,timeline:i}){if(!e)throw Error("AttributeTransitionManager is constructed without device");this.id=t,this.device=e,this.timeline=i,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:i}){for(let r in this.numInstances=i||1,e){let i=e[r],s=i.getTransitionSetting(t);s&&this._updateAttribute(r,i,s)}for(let i in this.transitions){let r=e[i];r&&r.getTransitionSetting(t)||this._removeTransition(i)}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let i=this.transitions[t];i.inProgress&&(e[t]=i.attributeInTransition)}return e}run(){if(0===this.numInstances)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,i){let r=this.transitions[e],s=!r||r.type!==i.type;if(s){r&&this._removeTransition(e);let n=eP[i.type];n?this.transitions[e]=new n({attribute:t,timeline:this.timeline,device:this.device}):(f.A.error(`unsupported transition type '${i.type}'`)(),s=!1)}(s||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(i,this.numInstances))}}let eS="attributeManager.invalidate";class eM{constructor(e,{id:t="attribute-manager",stats:i,timeline:r}={}){this.mergeBoundsMemoized=(0,et.A)(d._Z),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=i,this.attributeTransitionManager=new ex(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups="webgpu"===e.type?new J(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){for(let e in this.attributeBufferGroups?.finalize(),this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:"instance"})}remove(e){for(let t of e)void 0!==this.attributes[t]&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let i=this._invalidateTrigger(e,t);(0,ei.A)(eS,this,e,i)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);(0,ei.A)(eS,this,"all")}update({data:e,numInstances:t,startIndices:i=null,transitions:r,props:s={},buffers:n={},context:o={}}){let a=!1;for(let r in(0,ei.A)("attributeManager.updateStart",this),this.stats&&this.stats.get("Update Attributes").timeStart(),this.attributes){let l=this.attributes[r],u=l.settings.accessor;l.startIndices=i,l.numInstances=t,s[r]&&f.A.removed(`props.${r}`,`data.attributes.${r}`)(),l.setExternalBuffer(n[r])||l.setBinaryValue("string"==typeof u?n[u]:void 0,e.startIndices)||"string"==typeof u&&!n[u]&&l.setConstantValue(o,s[u])||l.needsUpdate()&&(a=!0,this._updateAttribute({attribute:l,numInstances:t,data:e,props:s,context:o})),this.needsRedraw=this.needsRedraw||l.needsRedraw()}a&&(0,ei.A)("attributeManager.updateEnd",this,t),this.stats&&(this.stats.get("Update Attributes").timeEnd(),a&&this.stats.get("Attributes updated").incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:i}=this,r={...i.getAttributes()};for(let s in t){let n=t[s];n.needsRedraw(e)&&!i.hasAttribute(s)&&(r[s]=n)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,i={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,i):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let i in e){let r=e[i],s={...r,id:i,size:r.isIndexed&&1||r.size||1,...t};this.attributes[i]=new P(this.device,s)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(i=>{e[i]||(e[i]=[]),e[i].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:i,updateTriggers:r}=this,s=r[e];return s&&s.forEach(e=>{let r=i[e];r&&r.setNeedsUpdate(r.id,t)}),s}_updateAttribute(e){let{attribute:t,numInstances:i}=e;((0,ei.A)("attribute.updateStart",t),t.constant)?t.setConstantValue(e.context,t.value):(t.allocate(i)&&(0,ei.A)("attribute.allocate",t,i),t.updateBuffer(e)&&(this.needsRedraw=!0,(0,ei.A)("attribute.updateEnd",t,i)))}}var eA=i(31609);class eC extends ep.A{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:i,duration:r,easing:s}}=this,n=s(e/r);this._value=(0,eA.Cc)(t,i,n)}}function eT(e,t,i,r,s){let n=t-e;return(i-t)*s+-n*r+n+t}function ek(e,t){if(Array.isArray(e)){let i=0;for(let r=0;r<e.length;r++){let s=e[r]-t[r];i+=s*s}return Math.sqrt(i)}return Math.abs(e-t)}class eL extends ep.A{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:i,stiffness:r}=this.settings,{_prevValue:s=e,_currValue:n=e}=this,o=function(e,t,i,r,s){if(Array.isArray(i)){let n=[];for(let o=0;o<i.length;o++)n[o]=eT(e[o],t[o],i[o],r,s);return n}return eT(e,t,i,r,s)}(s,n,t,i,r),a=ek(o,t),l=ek(o,n);a<1e-5&&l<1e-5&&(o=t,this.end()),this._prevValue=n,this._currValue=o}}let eI={interpolation:eC,spring:eL};class eO{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,i,r){let{transitions:s}=this;if(s.has(e)){let i=s.get(e),{value:r=i.settings.fromValue}=i;t=r,this.remove(e)}if(!(r=E(r)))return;let n=eI[r.type];if(!n)return void f.A.error(`unsupported transition type '${r.type}'`)();let o=new n(this.timeline);o.start({...r,fromValue:t,toValue:i}),s.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,i]of this.transitions)i.update(),e[t]=i.value,i.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}}var eR=i(12897);function eB({newProps:e,oldProps:t,ignoreProps:i={},propTypes:r={},triggerName:s="props"}){if(t===e)return!1;if("object"!=typeof e||null===e||"object"!=typeof t||null===t)return`${s} changed shallowly`;for(let n of Object.keys(e))if(!(n in i)){if(!(n in t))return`${s}.${n} added`;let i=ez(e[n],t[n],r[n]);if(i)return`${s}.${n} ${i}`}for(let n of Object.keys(t))if(!(n in i)){if(!(n in e))return`${s}.${n} dropped`;if(!Object.hasOwnProperty.call(e,n)){let i=ez(e[n],t[n],r[n]);if(i)return`${s}.${n} ${i}`}}return!1}function ez(e,t,i){let r=i&&i.equal;return r&&!r(e,t,i)||!r&&(r=e&&t&&e.equals)&&!r.call(e,t)?"changed deeply":r||t===e?null:"changed shallowly"}function ej(e,t,i){let r=e.updateTriggers[i];r=null==r?{}:r;let s=t.updateTriggers[i];return eB({oldProps:s=null==s?{}:s,newProps:r,triggerName:i})}function eD(e,t){if(!t)return e;let i={...e,...t};if("defines"in t&&(i.defines={...e.defines,...t.defines}),"modules"in t&&(i.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>"project64"===e.name))){let e=i.modules.findIndex(e=>"project32"===e.name);e>=0&&i.modules.splice(e,1)}if("inject"in t)if(e.inject){let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||"")+t.inject[e];i.inject=r}else i.inject=t.inject;return i}var eF=i(74334),eN=i(41367),eU=i(70998),eV=i(29527),e$=i(78883);let eW=[0,0,0];function eG(e,t,i=!1){let r=t.projectPosition(e);if(i&&t instanceof eN.A){let[i,s,n=0]=e,o=t.getDistanceScales([i,s]);r[2]=n*o.unitsPerMeter[2]}return r}function eq(e,{viewport:t,modelMatrix:i,coordinateSystem:r,coordinateOrigin:s,offsetMode:n}){let[o,a,l=0]=e;switch(i&&([o,a,l]=eU.Z0([],[o,a,l,1],i)),r){case"default":return eq(e,{viewport:t,modelMatrix:i,coordinateSystem:t.isGeospatial?"lnglat":"cartesian",coordinateOrigin:s,offsetMode:n});case"lnglat":return eG([o,a,l],t,n);case"lnglat-offsets":return eG([o+s[0],a+s[1],l+(s[2]||0)],t,n);case"meter-offsets":return eG((0,e$.dT)(s,[o,a,l]),t,n);case"cartesian":return t.isGeospatial?[o+s[0],a+s[1],l+s[2]]:t.projectPosition([o,a,l]);default:throw Error(`Invalid coordinateSystem: ${r}`)}}var eY=i(95335),eH=i(80698);let eZ={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},eX={};var eK=i(7914);let eJ={boolean:{validate:(e,t)=>!0,equal:(e,t,i)=>!!e==!!t},number:{validate:(e,t)=>Number.isFinite(e)&&(!("max"in t)||e<=t.max)&&(!("min"in t)||e>=t.min)},color:{validate:(e,t)=>t.optional&&!e||e0(e)&&(3===e.length||4===e.length),equal:(e,t,i)=>(0,eK.b)(e,t,1)},accessor:{validate(e,t){let i=e1(e);return"function"===i||i===e1(t.value)},equal:(e,t,i)=>"function"==typeof t||(0,eK.b)(e,t,1)},array:{validate:(e,t)=>t.optional&&!e||e0(e),equal(e,t,i){let{compare:r}=i,s=Number.isInteger(r)?r:+!!r;return r?(0,eK.b)(e,t,s):e===t}},object:{equal(e,t,i){if(i.ignore)return!0;let{compare:r}=i,s=Number.isInteger(r)?r:+!!r;return r?(0,eK.b)(e,t,s):e===t}},function:{validate:(e,t)=>t.optional&&!e||"function"==typeof e,equal:(e,t,i)=>!i.compare&&!1!==i.ignore||e===t},data:{transform:(e,t,i)=>{if(!e)return e;let{dataTransform:r}=i.props;return r?r(e):"string"==typeof e.shape&&e.shape.endsWith("-table")&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,i)=>{let r=i.context;return r&&r.device?function(e,t,i,r){if(i instanceof eH.g)return i;i.constructor&&"Object"!==i.constructor.name&&(i={data:i});let s=null;i.compressed&&(s={minFilter:"linear",mipmapFilter:i.data.length>1?"nearest":"linear"});let{width:n,height:o}=i.data,a=t.createTexture({...i,sampler:{...eZ,...s,...r},mipLevels:t.getMipLevelCount(n,o)});return"webgl"===t.type?a.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(a),eX[a.id]=e,a}(i.id,r.device,e,{...t.parameters,...i.props.textureParameters}):null},release:(e,t,i)=>{var r;r=i.id,e&&e instanceof eH.g&&eX[e.id]===r&&(e.delete(),delete eX[e.id])}}};function eQ(e,t){return"type"in t?{name:e,...eJ[t.type],...t}:"value"in t?{name:e,type:e1(t.value),...t}:{name:e,type:"object",value:t}}function e0(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function e1(e){return e0(e)?"array":null===e?"null":typeof e}function e2(e,t){return Object.prototype.hasOwnProperty.call(e,t)}let e3=0;class e4{constructor(...e){this.props=function(e,t){let i;for(let e=t.length-1;e>=0;e--){let r=t[e];"extensions"in r&&(i=r.extensions)}let r=Object.create(function e(t,i){var r,s;if(!(t instanceof e6.constructor))return{};let n="_mergedDefaultProps";if(i)for(let e of i){let t=e.constructor;t&&(n+=`:${t.extensionName||t.name}`)}let o=e2(r=t,s=n)&&r[s];return o||(t[n]=function(t,i){var r;let s;if(!t.prototype)return null;let n=e(Object.getPrototypeOf(t)),o=function(e){let t={},i={},r={};for(let[s,n]of Object.entries(e)){let e=n?.deprecatedFor;if(e)r[s]=Array.isArray(e)?e:[e];else{let e=function(e,t){switch(e1(t)){case"object":return eQ(e,t);case"array":return eQ(e,{type:"array",value:t,compare:!1});case"boolean":return eQ(e,{type:"boolean",value:t});case"number":return eQ(e,{type:"number",value:t});case"function":return eQ(e,{type:"function",value:t,compare:!0});default:return{name:e,type:"unknown",value:t}}}(s,n);t[s]=e,i[s]=e.value}}return{propTypes:t,defaultProps:i,deprecatedProps:r}}(function(e,t){return e2(e,t)&&e[t]}(t,"defaultProps")||{}),a=Object.assign(Object.create(null),n,o.defaultProps),l=Object.assign(Object.create(null),n?.[eR.fW],o.propTypes),u=Object.assign(Object.create(null),n?.[eR.uH],o.deprecatedProps);for(let t of i){let i=e(t.constructor);i&&(Object.assign(a,i),Object.assign(l,i[eR.fW]),Object.assign(u,i[eR.uH]))}return Object.defineProperties(a,{id:{writable:!0,value:((s=(r=t).componentName)||f.A.warn(`${r.name}.componentName not specified`)(),s||r.name)}}),function(e,t){let i={},r={};for(let e in t){let s=t[e],{name:n,value:o}=s;s.async&&(i[n]=o,r[n]=function(e){return{enumerable:!0,set(t){"string"==typeof t||t instanceof Promise||(0,_.Td)(t)?this[eR.YN][e]=t:this[eR.vf][e]=t},get(){if(this[eR.vf]){if(e in this[eR.vf])return this[eR.vf][e]||this[eR.jA][e];if(e in this[eR.YN]){let t=this[eR.r3]&&this[eR.r3].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[eR.jA][e]}}return this[eR.jA][e]}}}(n))}e[eR.jA]=i,e[eR.YN]={},Object.defineProperties(e,r)}(a,l),function(e,t){for(let i in t)Object.defineProperty(e,i,{enumerable:!1,set(e){let r=`${this.id}: ${i}`;for(let r of t[i])e2(this,r)||(this[r]=e);f.A.deprecated(r,t[i].join("/"))()}})}(a,u),a[eR.fW]=l,a[eR.uH]=u,0!==i.length||e2(t,"_propTypes")||(t._propTypes=l),a}(t,i||[]))}(e.constructor,i));r[eR.r3]=e,r[eR.YN]={},r[eR.vf]={};for(let e=0;e<t.length;++e){let i=t[e];for(let e in i)r[e]=i[e]}return Object.freeze(r),r}(this,e),this.id=this.props.id,this.count=e3++}clone(e){let{props:t}=this,i={};for(let e in t[eR.jA])e in t[eR.vf]?i[e]=t[eR.vf][e]:e in t[eR.YN]&&(i[e]=t[eR.YN][e]);return new this.constructor({...t,...i,...e})}}e4.componentName="Component",e4.defaultProps={};let e6=e4,e5=Object.freeze({});class e8{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||e5}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[eR.r3]||this.component;let t=e[eR.vf]||{},i=e[eR.YN]||e,r=e[eR.jA]||{};for(let e in t){let i=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,i),t[e]=this.getAsyncProp(e)}for(let e in i){let t=i[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if("string"==typeof t&&(t=this._fetch(e,t)),t instanceof Promise)return void this._watchPromise(e,t);if((0,_.Td)(t))return void this._resolveAsyncIterable(e,t);this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps)for(let e in this.oldAsyncProps=Object.create(this.oldProps),this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}_didAsyncInputValueChange(e,t){let i=this.asyncProps[e];return t!==i.resolvedValue&&t!==i.lastValue&&(i.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let i=this.asyncProps[e];i&&(t=this._postProcessValue(i,t),i.resolvedValue=t,i.pendingLoadCount++,i.resolvedLoadCount=i.pendingLoadCount)}_setAsyncPropValue(e,t,i){let r=this.asyncProps[e];r&&i>=r.resolvedLoadCount&&void 0!==t&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=i,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let i=this.asyncProps[e];if(i){i.pendingLoadCount++;let r=i.pendingLoadCount;t.then(t=>{this.component&&(t=this._postProcessValue(i,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if("data"!==e)return void this._setPropValue(e,t);let i=this.asyncProps[e];if(!i)return;i.pendingLoadCount++;let r=i.pendingLoadCount,s=[],n=0;for await(let i of t){if(!this.component)return;let{dataTransform:t}=this.component.props;Object.defineProperty(s=t?t(i,s):s.concat(i),"__diff",{enumerable:!1,value:[{startRow:n,endRow:s.length}]}),n=s.length,this._setAsyncPropValue(e,s,r)}this._onResolve(e,s)}_postProcessValue(e,t){let i=e.type;return i&&this.component&&(i.release&&i.release(e.resolvedValue,i,this.component),i.transform)?i.transform(t,i,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let i=this.component&&this.component.props[eR.fW];this.asyncProps[e]={type:i&&i[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}}class e9 extends e8{constructor({attributeManager:e,layer:t}){super(t),this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let i=this.layer,r=i?.props.fetch;return r?r(t,{propName:e,layer:i}):super._fetch(e,t)}_onResolve(e,t){let i=this.layer;if(i){let r=i.props.onDataLoad;"data"===e&&r&&r(t,{propName:e,layer:i})}}_onError(e,t){let i=this.layer;i&&i.raiseError(t,`loading ${e} of ${this.layer}`)}}var e7=i(327);let te=Object.freeze([]),tt=(0,et.A)(({oldViewport:e,viewport:t})=>e.equals(t)),ti=new Uint8ClampedArray(0);function tr(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function ts(e){return e.rowIndexes}function tn(e){return e.pickingColors||e.instancePickingColors}let to={data:{type:"data",value:te,async:!0},dataComparator:{type:"function",value:null,optional:!0},_dataDiff:{type:"function",value:e=>e&&e.__diff,optional:!0},dataTransform:{type:"function",value:null,optional:!0},onDataLoad:{type:"function",value:null,optional:!0},onError:{type:"function",value:null,optional:!0},fetch:{type:"function",value:(e,{propName:t,layer:i,loaders:r,loadOptions:s,signal:n})=>{let{resourceManager:o}=i.context;s=s||i.getLoadOptions(),r=r||i.props.loaders,n&&(s={...s,core:{...s?.core,fetch:{...s?.core?.fetch,signal:n}}});let a=o.contains(e);return(a||s||(o.add({resourceId:e,data:(0,e7.H)(e,r),persistent:!1}),a=!0),a)?o.subscribe({resourceId:e,onChange:e=>i.internalState?.reloadAsyncProp(t,e),consumerId:i.id,requestId:t}):(0,e7.H)(e,r,s)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:"number",min:0,max:1,value:1},operation:"draw",onHover:{type:"function",value:null,optional:!0},onClick:{type:"function",value:null,optional:!0},onDragStart:{type:"function",value:null,optional:!0},onDrag:{type:"function",value:null,optional:!0},onDragEnd:{type:"function",value:null,optional:!0},coordinateSystem:"default",coordinateOrigin:{type:"array",value:[0,0,0],compare:!0},modelMatrix:{type:"array",value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:"XYZ",colorFormat:"RGBA",parameters:{type:"object",value:{},optional:!0,compare:2},loadOptions:{type:"object",value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:"array",value:[],optional:!0,ignore:!0},getPolygonOffset:{type:"function",value:({layerIndex:e})=>[0,-(100*e)]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:"accessor",value:[0,0,128,128]}};class ta extends e6{constructor(){super(...arguments),this.internalState=null,this.lifecycle=eR.VD.NO_STATE,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,"layerName")?this.layerName:""}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){let e=this.constructor.layerName||this.constructor.name;return`${e}({id: '${this.props.id}'})`}project(e){(0,m.A)(this.internalState);let t=this.internalState.viewport||this.context.viewport,i=eq(e,{viewport:t,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem}),[r,s,n]=(0,e$.VJ)(i,t.pixelProjectionMatrix);return 2===e.length?[r,s]:[r,s,n]}unproject(e){return(0,m.A)(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t){return(0,m.A)(this.internalState),function(e,t){let{viewport:i,coordinateSystem:r,coordinateOrigin:s,modelMatrix:n,fromCoordinateSystem:o,fromCoordinateOrigin:a}=function(e){let{viewport:t,modelMatrix:i,coordinateOrigin:r}=e,{coordinateSystem:s,fromCoordinateSystem:n,fromCoordinateOrigin:o}=e;return"default"===s&&(s=t.isGeospatial?"lnglat":"cartesian"),void 0===n?n=s:"default"===n&&(n=t.isGeospatial?"lnglat":"cartesian"),void 0===o&&(o=r),{viewport:t,coordinateSystem:s,coordinateOrigin:r,modelMatrix:i,fromCoordinateSystem:n,fromCoordinateOrigin:o}}(t),{autoOffset:l=!0}=t,{geospatialOrigin:u=eW,shaderCoordinateOrigin:h=eW,offsetMode:c=!1}=l?(0,eF.ow)(i,r,s):{},d=eq(e,{viewport:i,modelMatrix:n,coordinateSystem:o,coordinateOrigin:a,offsetMode:c});if(c){let e=i.projectPosition(u||h);eV.jb(d,d,e)}return d}(e,{viewport:this.internalState.viewport||this.context.viewport,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem,...t})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return!!this.internalState&&!this.internalState.isAsyncPropLoading()}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}use64bitPositions(){let{coordinateSystem:e}=this.props;return"default"===e||"lnglat"===e||"cartesian"===e}onHover(e,t){return!!this.props.onHover&&(this.props.onHover(e,t)||!1)}onClick(e,t){return!!this.props.onClick&&(this.props.onClick(e,t)||!1)}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){(0,m.A)(e instanceof Uint8Array);let[t,i,r]=e;return t+256*i+65536*r-1}getNumInstances(){if(Number.isFinite(this.props.numInstances))return this.props.numInstances;if(this.state&&void 0!==this.state.numInstances)return this.state.numInstances;var e,t,i=this.props.data;if(null===(e=i)||"object"!=typeof e)throw Error("count(): argument not an object");if("function"==typeof i.count)return i.count();if(Number.isFinite(i.size))return i.size;if(Number.isFinite(i.length))return i.length;if(null!==(t=i)&&"object"==typeof t&&t.constructor===Object)return Object.keys(i).length;throw Error("count(): argument not a container")}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds(["positions","instancePositions"])}getShaders(e){for(let t of(e=eD(e,{disableWarnings:!0,modules:this.context.defaultShaderModules}),this.props.extensions))e=eD(e,t.getShaders.call(this,t));return e}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:i}=e.changeFlags;if(i&&t)if(Array.isArray(i))for(let e of i)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:i}=e,r=this.internalState.hasPickingBuffer,s=Number.isInteger(i.highlightedObjectIndex)||!!i.pickable||i.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==s){this.internalState.hasPickingBuffer=s;let e=tr(t.attributes);e&&(s&&e.constant&&(e.constant=!1,t.invalidate(e.id)),e.value||s||(e.constant=!0,e.value=ts(t.attributes)?[eY.Z1]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:i}){let{index:r}=e;return r>=0&&Array.isArray(this.props.data)&&(e.object=this.props.data[r]),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return!!this.internalState&&(this.internalState.needsUpdate||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()))}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState)return;let t=this.internalState.viewport;this.internalState.viewport=e,t&&tt({oldViewport:t,viewport:e})||(this.setChangeFlags({viewportChanged:!0}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e="all"){let t=this.getAttributeManager();t&&("all"===e?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let i in e)e[i].layoutChanged()&&(t=!0);for(let i of this.getModels())this._setModelAttributes(i,e,t)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,i=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:i,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let s=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(s)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),i=Object.create(this.props);for(let e in t)Object.defineProperty(i,e,{value:t[e]});return i}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let i=Math.floor(ti.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&0===ti[0];if(i<t||r){t>0xffffff&&f.A.warn("Layer has too many data objects. Picking might not be able to distinguish all objects.")();let e=Math.floor((ti=c.A.allocate(ti,t,{size:4,copy:!0,maxCount:Math.max(t,0xffffff)})).length/4),s=[0,0,0],n=r?0:i;for(let t=n;t<e;t++)this.encodePickingColor(t,s),ti[4*t+0]=s[0],ti[4*t+1]=s[1],ti[4*t+2]=s[2],ti[4*t+3]=0}e.value=ti.subarray(0,4*t)}_setModelAttributes(e,t,i=!1){if(!Object.keys(t).length)return;let r=this.getAttributeManager();if(r?.hasBufferGroups())return void this._setGroupedModelAttributes(e,r,t);if(i){let i=this.getAttributeManager();e.setBufferLayout(i.getBufferLayouts(e)),t=i.getAttributes()}let n=e.userData?.excludeAttributes||{},o={},a={};for(let i in t){if(n[i])continue;let r=t[i].getValue();for(let n in r){let l=r[n];l instanceof s.h?t[i].settings.isIndexed?e.setIndexBuffer(l):o[n]=l:l&&(a[n]=l)}}e.setAttributes(o),e.setConstantAttributes(a)}_setGroupedModelAttributes(e,t,i){let r=e.userData?.excludeAttributes||{},n=t.getBufferGroupBindings(i,e,r);e.setBufferLayout(n.bufferLayouts);let o={...n.buffers},a={},l=t.getAttributes();for(let t in l){if(r[t]||n.groupedAttributeIds.has(t))continue;let i=l[t],u=i.getValue();for(let t in u){let r=u[t];r instanceof s.h?i.settings.isIndexed?e.setIndexBuffer(r):o[t]=r:r&&(a[t]=r)}}e.setAttributes(o),e.setConstantAttributes(a)}disablePickingIndex(e){let t=this.props.data;if(!("attributes"in t))return void this._disablePickingIndex(e);let i=this.getAttributeManager().attributes,r=ts(i),s=tn(i),n=r&&t.attributes&&t.attributes[r.id];if(n&&n.value){let i=n.value;for(let s=0;s<t.length;s++)i[r.getVertexOffset(s)]===e&&this._disablePickingIndex(s);return}let o=s&&t.attributes&&t.attributes[s.id];if(o&&o.value){let i=o.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=s.getVertexOffset(e);i[t]===r[0]&&i[t+1]===r[1]&&i[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager().attributes,i=ts(t);if(i){let t=i.getVertexOffset(e),r=new Uint32Array(i.getVertexOffset(e+1)-t);r.fill(eY.Z1),i.buffer.write(r,t*r.BYTES_PER_ELEMENT);return}let r=tn(t);if(!r){this.internalState&&(0,eY.uz)(this.internalState.disabledPickingIndices,e);return}let s=r.getVertexOffset(e),n=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(n-s),s)}restorePickingColors(){let e=this.getAttributeManager().attributes,t=tr(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let i=tn(e);this.internalState.usesPickingColorCache&&i&&i.value.buffer!==ti.buffer&&(i.value=ti.subarray(0,i.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(){(0,m.A)(!this.internalState),(0,ei.A)("layer.initialize",this);let e=this._getAttributeManager();for(let t of(this.internalState=new e9({attributeManager:e,layer:this}),this._clearChangeFlags(),this.state={},Object.defineProperty(this.state,"attributeManager",{get:()=>(f.A.deprecated("layer.state.attributeManager","layer.getAttributeManager()")(),e)}),this.internalState.uniformTransitions=new eO(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context),this.props.extensions))t.initializeState.call(this,this.context,t);this.setChangeFlags({dataChanged:"init",propsChanged:"init",viewportChanged:!0,extensionsChanged:!0}),this._update()}_transferState(e){(0,ei.A)("layer.matched",this,this===e);let{state:t,internalState:i}=e;this!==e&&(this.internalState=i,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){let e=this.needsUpdate();if((0,ei.A)("layer.update",this,e),!e)return;this.context.stats.get("Layer updates").incrementCount();let t=this.props,i=this.context,r=this.internalState,s=i.viewport,n=this._updateUniformTransition();r.propsInTransition=n,i.viewport=r.viewport||s,this.props=n;try{let e=this._getUpdateParams(),t=this.getModels();if(i.device)this.updateState(e);else try{this.updateState(e)}catch(e){}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let r=this.getModels()[0]!==t[0];this._postUpdate(e,r)}finally{i.viewport=s,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.resetOldProps()}}_finalize(){for(let e of((0,ei.A)("layer.finalize",this),this.finalizeState(this.context),this.props.extensions))e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:i={},parameters:r={}}){this._updateAttributeTransition();let s=this.props,o=this.context;this.props=this.internalState.propsInTransition||s;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:s}=this.props,a=s&&s(i)||[0,0];o.device instanceof n.WebGLDevice&&o.device.setParametersWebGL({polygonOffset:a});let l=o.device instanceof n.WebGLDevice?null:function(e){let{blendConstant:t,...i}=e;return t?{pipelineParameters:i,renderPassParameters:{blendConstant:t}}:{pipelineParameters:i}}(r);if(function(e,t,i,r){for(let s of e)"webgpu"===s.device.type?(function(e,t){let i=t.props.framebuffer||(t.framebuffer??null);if(!i)return;let r=i.colorAttachments.map(e=>e?.texture?.format??null),s=i.depthStencilAttachment?.texture?.format;(!function(e,t){if(e===t)return!0;if(!e||!t||e.length!==t.length)return!1;for(let i=0;i<e.length;i++)if(e[i]!==t[i])return!1;return!0}(e.props.colorAttachmentFormats,r)||e.props.depthStencilAttachmentFormat!==s)&&(e.props.colorAttachmentFormats=r,e.props.depthStencilAttachmentFormat=s,e._setPipelineNeedsUpdate("attachment formats"))}(s,t),s.setParameters({...s.parameters,...r?.pipelineParameters})):s.setParameters(i)}(this.getModels(),e,r,l),o.device instanceof n.WebGLDevice)o.device.withParametersWebGL(r,()=>{let s={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,s,e);this.draw(s)});else{l?.renderPassParameters&&e.setParameters(l.renderPassParameters);let s={renderPass:e,shaderModuleProps:t,uniforms:i,parameters:r,context:o};for(let e of this.props.extensions)e.draw.call(this,s,e);this.draw(s)}}finally{this.props=s}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let i in e)if(e[i]){let r=!1;if("dataChanged"===i){let s=e[i],n=t[i];s&&Array.isArray(n)&&(t.dataChanged=Array.isArray(s)?n.concat(s):s,r=!0)}t[i]||(t[i]=e[i],r=!0),r&&(0,ei.A)("layer.changeFlag",this,i,e)}let i=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=i,t.somethingChanged=i||t.viewportChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let i,r,s,n=(i=eB({newProps:e,oldProps:t,propTypes:e[eR.fW],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=function(e,t){if(null===t)return"oldProps is null, initial diff";let i=!1,{dataComparator:r,_dataDiff:s}=e;return r?r(e.data,t.data)||(i="Data comparator detected a change"):e.data!==t.data&&(i="A new data container was supplied"),i&&s&&(i=s(e.data,t.data)||i),i}(e,t),s=!1,r||(s=function(e,t){if(null===t||"all"in e.updateTriggers&&ej(e,t,"all"))return{all:!0};let i={},r=!1;for(let s in e.updateTriggers)"all"!==s&&ej(e,t,s)&&(i[s]=!0,r=!0);return!!r&&i}(e,t)),{dataChanged:r,propsChanged:i,updateTriggersChanged:s,extensionsChanged:function(e,t){if(null===t)return!0;let i=t.extensions,{extensions:r}=e;if(r===i)return!1;if(!i||!r||r.length!==i.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(i[e]))return!0;return!1}(e,t),transitionsChanged:function(e,t){if(!e.transitions)return!1;let i={},r=e[eR.fW],s=!1;for(let n in e.transitions){let o=r[n],a=o&&o.type;("number"===a||"color"===a||"array"===a)&&ez(e[n],t[n],o)&&(i[n]=!0,s=!0)}return!!s&&i}(e,t)});if(n.updateTriggersChanged)for(let e in n.updateTriggersChanged)n.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(n.transitionsChanged)for(let i in n.transitionsChanged)this.internalState.uniformTransitions.add(i,t[i],e[i],e.transitions?.[i]);return this.setChangeFlags(n)}validateProps(){!function(e){let t=e[eR.fW];for(let i in t){let r=t[i],{validate:s}=r;if(s&&!s(e[i],r))throw Error(`Invalid prop ${i}: ${e[i]}`)}}(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:i}=this.props;e.picked&&"function"==typeof i&&(t.highlightColor=i(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new eM(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:i,oldProps:r}=e,s=this.state.model;s?.isInstanced&&s.setInstanceCount(this.getNumInstances());let{autoHighlight:n,highlightedObjectIndex:o,highlightColor:a}=i;if(t||r.autoHighlight!==n||r.highlightedObjectIndex!==o||r.highlightColor!==a){let e={};Array.isArray(a)&&(e.highlightColor=a),(t||r.autoHighlight!==n||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t=this.internalState.needsRedraw&&this.id;let i=this.getAttributeManager(),r=!!i&&i.getNeedsRedraw(e);if(t=t||r)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}}ta.defaultProps=to,ta.layerName="Layer";let tl=ta},1354(e,t,i){i.d(t,{x:()=>n});var r=i(7914);function s(e,t){t&&Object.entries(t).map(([t,i])=>{t.startsWith("--")?e.style.setProperty(t,i):e.style[t]=i})}class n{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,i=this.rootElement;if(i&&t.className!==e.className&&(t.className&&i.classList.remove(t.className),e.className&&i.classList.add(e.className)),i&&!(0,r.b)(t.style,e.style,1)){var n;(n=t.style)&&Object.keys(n).map(e=>{e.startsWith("--")?i.style.removeProperty(e):i.style[e]=""}),s(i,e.style)}Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=["deck-widget",this.className,this.props.className],t=document.createElement("div");return e.filter(e=>"string"==typeof e&&e.length>0).forEach(e=>t.classList.add(e)),s(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}}n.defaultProps={id:"widget",style:{},_container:null,className:""}},12897(e,t,i){i.d(t,{VD:()=>r,YN:()=>l,fW:()=>n,jA:()=>a,r3:()=>s,uH:()=>o,vf:()=>u});let r={NO_STATE:"Awaiting state",MATCHED:"Matched. State transferred from previous layer",INITIALIZED:"Initialized",AWAITING_GC:"Discarded. Awaiting garbage collection",AWAITING_FINALIZATION:"No longer matched. Awaiting garbage collection",FINALIZED:"Finalized! Awaiting garbage collection"},s=Symbol.for("component"),n=Symbol.for("propTypes"),o=Symbol.for("deprecatedProps"),a=Symbol.for("asyncPropDefaults"),l=Symbol.for("asyncPropOriginal"),u=Symbol.for("asyncPropResolved")},46487(e,t,i){i.d(t,{A:()=>r});let r={name:"color",dependencies:[],source:`

@must_use
fn deckgl_premultiplied_alpha(fragColor: vec4<f32>) -> vec4<f32> {
    return vec4(fragColor.rgb * fragColor.a, fragColor.a); 
};
`,getUniforms:e=>({})}},3065(e,t,i){i.d(t,{A:()=>s});let r="#define SMOOTH_EDGE_RADIUS 0.5",s={name:"geometry",source:`\
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
`}},95335(e,t,i){i.d(t,{Z1:()=>o,Ay:()=>f,uz:()=>a});var r=i(55611);let s={props:{},uniforms:{},name:"picking",uniformTypes:{isActive:"f32",isAttribute:"f32",isHighlightActive:"f32",useByteColors:"f32",highlightedObjectColor:"vec3<f32>",highlightColor:"vec4<f32>"},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`\
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
`,getUniforms:function(e={},t){let i={},s=(0,r.eS)(e.useByteColors,!0);return void 0===e.highlightedObjectColor||(null===e.highlightedObjectColor?i.isHighlightActive=!1:(i.isHighlightActive=!0,i.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(i.highlightColor=(0,r.jI)(e.highlightColor,s)),void 0!==e.isActive&&(i.isActive=!!e.isActive,i.isAttribute=!!e.isAttribute),void 0!==e.useByteColors&&(i.useByteColors=!!e.useByteColors),i}};var n=i(3459);let o=0xffffff;function a(e,t){10===e.length?n.A.warn("pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers")():e.push(t)}let l=`\
  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function u(e){return e.replace("  vec4 highlightColor;\n} picking;",`  vec4 highlightColor;
${l}} picking;`)}function h(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}let c=`\
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
`,f={...s,vs:`${u(s.vs)}
${c}`,fs:u(s.fs),source:d,uniformTypes:{...s.uniformTypes,disabledPickingIndexCount:"f32",disabledPickingIndices0:"vec4<f32>",disabledPickingIndices1:"vec4<f32>",disabledPickingIndices2:"vec4<f32>"},defaultUniforms:{...s.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let i=s.getUniforms(e,t),r=e.disabledPickingIndices||[];return i.disabledPickingIndexCount=r.length,i.disabledPickingIndices0=h(r,0),i.disabledPickingIndices1=h(r,4),i.disabledPickingIndices2=h(r,8),i},inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `,"vs:DECKGL_FILTER_COLOR":`
  picking_setPickingColor(geometry.pickingColor);
  `,"fs:DECKGL_FILTER_COLOR":{order:99,injection:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}}}},52948(e,t,i){i.d(t,{A:()=>_});var r=i(34938),s=i(3065),n=i(74334),o=i(9350);let a=["default","lnglat","meter-offsets","lnglat-offsets","cartesian"].map(e=>`const COORDINATE_SYSTEM_${e.toUpperCase().replaceAll("-","_")}: i32 = ${(0,n.LB)(e)};`).join(""),l=Object.keys(o.Kx).map(e=>`const PROJECTION_MODE_${e}: i32 = ${o.Kx[e]};`).join(""),u=Object.keys(o.p5).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${o.p5[e]};`).join(""),h=`\
${a}
${l}
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
  coordinateSystem: i32,
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
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

// Structure to carry additional geometry data used by deck.gl filters.
struct Geometry {
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  position: vec4<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry: Geometry;
`,c=`\
${h}

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
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
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

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z\u{2011}axis with the given up vector.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  let ux = select(
    vec3<f32>(1.0, 0.0, 0.0),
    normalize(vec3<f32>(uz.y, -uz.x, 0.0)),
    abs(uz.z) == 1.0
  );
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
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
  let cosPhi = cos(phi);
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
      let offsetCommon = (enuMatrix * vec3<f32>(-position_world.x, -position_world.y, position_world.z)) * metersToCommon;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
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
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
        project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
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
`,d=["default","lnglat","meter-offsets","lnglat-offsets","cartesian"].map(e=>`const int COORDINATE_SYSTEM_${e.toUpperCase().replaceAll("-","_")} = ${(0,n.LB)(e)};`).join(""),f=Object.keys(o.Kx).map(e=>`const int PROJECTION_MODE_${e} = ${o.Kx[e]};`).join(""),p=Object.keys(o.p5).map(e=>`const int UNIT_${e.toUpperCase()} = ${o.p5[e]};`).join(""),g=`\
${d}
${f}
${p}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateSystem;
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
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
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
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
vec3 ux = abs(uz.z) == 1.0 ? vec3(1.0, 0.0, 0.0) : normalize(vec3(uz.y, -uz.x, 0));
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
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
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
position_world.xyz += project.coordinateOrigin;
}
}
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
float metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
vec3 offsetCommon = (enuMatrix * vec3(-position_world.xy, position_world.z)) * metersToCommon;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
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
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
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
`,m={},_={name:"project",dependencies:[r.i,s.A],source:c,vs:g,getUniforms:function(e=m){return"viewport"in e?(0,n.aY)(e):{}},uniformTypes:{wrapLongitude:"f32",coordinateSystem:"i32",commonUnitsPerMeter:"vec3<f32>",projectionMode:"i32",scale:"f32",commonUnitsPerWorldUnit:"vec3<f32>",commonUnitsPerWorldUnit2:"vec3<f32>",center:"vec4<f32>",modelMatrix:"mat4x4<f32>",viewProjectionMatrix:"mat4x4<f32>",viewportSize:"vec2<f32>",devicePixelRatio:"f32",focalDistance:"f32",cameraPosition:"vec3<f32>",coordinateOrigin:"vec3<f32>",commonOrigin:"vec3<f32>",pseudoMeters:"f32"}}},74334(e,t,i){i.d(t,{LB:()=>f,aY:()=>m,ow:()=>g});var r=i(70998),s=i(36526),n=i(9350),o=i(82417);let a=[0,0,0,0],l=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],u=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],h=[0,0,0],c=[0,0,0],d={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function f(e){let t=d[e];if(void 0===t)throw Error(`Invalid coordinateSystem: ${e}`);return t}let p=(0,o.A)(function({viewport:e,devicePixelRatio:t,coordinateSystem:i,coordinateOrigin:o}){let{projectionCenter:c,viewProjectionMatrix:d,originCommon:p,cameraPosCommon:m,shaderCoordinateOrigin:_,geospatialOrigin:v}=function(e,t,i){let{viewMatrixUncentered:n,projectionMatrix:o}=e,{viewMatrix:u,viewProjectionMatrix:h}=e,c=a,d=a,f=e.cameraPosition,{geospatialOrigin:p,shaderCoordinateOrigin:m,offsetMode:_}=g(e,t,i);return _&&(d=e.projectPosition(p||m),f=[f[0]-d[0],f[1]-d[1],f[2]-d[2]],d[3]=1,c=r.Z0([],d,h),u=n||u,h=s.lw([],o,u),h=s.lw([],h,l)),{viewMatrix:u,viewProjectionMatrix:h,projectionCenter:c,originCommon:d,cameraPosCommon:f,shaderCoordinateOrigin:m,geospatialOrigin:p}}(e,i,o),y=e.getDistanceScales(),b=[e.width*t,e.height*t],w=r.Z0([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,E={coordinateSystem:f(i),projectionMode:e.projectionMode,coordinateOrigin:_,commonOrigin:p.slice(0,3),center:c,pseudoMeters:!!e._pseudoMeters,viewportSize:b,devicePixelRatio:t,focalDistance:w,commonUnitsPerMeter:y.unitsPerMeter,commonUnitsPerWorldUnit:y.unitsPerMeter,commonUnitsPerWorldUnit2:h,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:d,modelMatrix:u,cameraPosition:m};if(v){let t=e.getDistanceScales(v);switch(i){case"meter-offsets":E.commonUnitsPerWorldUnit=t.unitsPerMeter,E.commonUnitsPerWorldUnit2=t.unitsPerMeter2;break;case"lnglat":case"lnglat-offsets":e._pseudoMeters||(E.commonUnitsPerMeter=t.unitsPerMeter),E.commonUnitsPerWorldUnit=t.unitsPerDegree,E.commonUnitsPerWorldUnit2=t.unitsPerDegree2;break;case"cartesian":E.commonUnitsPerWorldUnit=[1,1,t.unitsPerMeter[2]],E.commonUnitsPerWorldUnit2=[0,0,t.unitsPerMeter2[2]]}}if(e.projectionMode===n.Kx.GLOBE&&"meter-offsets"===i){let e=o[0]*Math.PI/180,t=o[1]*Math.PI/180,i=Math.cos(t),r=((o[2]||0)/6370972+1)*256;E.commonOrigin=[Math.sin(e)*i*r,-Math.cos(e)*i*r,Math.sin(t)*r]}return E});function g(e,t,i=c){let r;i.length<3&&(i=[i[0],i[1],0]);let s=i,o=!0;switch(r="lnglat-offsets"===t||"meter-offsets"===t?i:e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null,e.projectionMode){case n.Kx.WEB_MERCATOR:("lnglat"===t||"cartesian"===t)&&(r=[0,0,0],o=!1);break;case n.Kx.WEB_MERCATOR_AUTO_OFFSET:"lnglat"===t?s=r:"cartesian"===t&&(s=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],r=e.unprojectPosition(s),s[0]-=i[0],s[1]-=i[1],s[2]-=i[2]);break;case n.Kx.IDENTITY:(s=e.position.map(Math.fround))[2]=s[2]||0;break;case n.Kx.GLOBE:o=!1,r=null;break;default:o=!1}return{geospatialOrigin:r,shaderCoordinateOrigin:s,offsetMode:o}}function m({viewport:e,devicePixelRatio:t=1,modelMatrix:i=null,coordinateSystem:r="default",coordinateOrigin:s=c,autoWrapLongitude:n=!1}){"default"===r&&(r=e.isGeospatial?"lnglat":"cartesian");let o=p({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:s});return o.wrapLongitude=n,o.modelMatrix=i||u,o}},84175(e,t,i){i.d(t,{A:()=>o});var r=i(52948);let s=`\
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
`,o={name:"project32",dependencies:[r.A],source:s,vs:n}},70053(e,t,i){i.d(t,{A:()=>a});var r=i(78715),s=i(31609);let n=["longitude","latitude","zoom","bearing","pitch"],o=["longitude","latitude","zoom"];class a extends r.A{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,i=Array.isArray(e)?{}:e;i.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:n,required:o},super(i.transitionProps),this.opts=i}initializeProps(e,t){let i=super.initializeProps(e,t),{makeViewport:r,around:s}=this.opts;if(r&&s){let n=r(e),o=r(t),a=n.unproject(s);i.start.around=s,Object.assign(i.end,{around:o.project(a),aroundPosition:a,width:t.width,height:t.height})}return i}interpolateProps(e,t,i){let r={};for(let n of this._propsToExtract)r[n]=(0,s.Cc)(e[n]||0,t[n]||0,i);if(t.aroundPosition&&this.opts.makeViewport){let n=this.opts.makeViewport({...t,...r});Object.assign(r,n.panByPosition(t.aroundPosition,(0,s.Cc)(e.around,t.around,i)))}return r}}},78715(e,t,i){i.d(t,{A:()=>n});var r=i(31609),s=i(24067);class n{constructor(e){let{compare:t,extract:i,required:r}=e;this._propsToCompare=t,this._propsToExtract=i||t,this._requiredProps=r}arePropsEqual(e,t){for(let i of this._propsToCompare)if(!(i in e)||!(i in t)||!(0,r.aI)(e[i],t[i]))return!1;return!0}initializeProps(e,t){let i={},r={};for(let s of this._propsToExtract)(s in e||s in t)&&(i[s]=e[s],r[s]=t[s]);return this._checkRequiredProps(i),this._checkRequiredProps(r),{start:i,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let i=e[t];(0,s.A)(Number.isFinite(i)||Array.isArray(i),`${t} is required for transition`)})}}},2357(e,t,i){i.d(t,{A:()=>r});class r{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1)}update(){if(!this._inProgress)return!1;if(null===this._handle){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}}},24067(e,t,i){i.d(t,{A:()=>r});function r(e,t){if(!e)throw Error(t||"deck.gl: assertion failed.")}},7914(e,t,i){i.d(t,{b:()=>function e(t,i,r){if(t===i)return!0;if(!r||!t||!i)return!1;if(Array.isArray(t)){if(!Array.isArray(i)||t.length!==i.length)return!1;for(let s=0;s<t.length;s++)if(!e(t[s],i[s],r-1))return!1;return!0}if(Array.isArray(i))return!1;if("object"==typeof t&&"object"==typeof i){let s=Object.keys(t),n=Object.keys(i);if(s.length!==n.length)return!1;for(let n of s)if(!i.hasOwnProperty(n)||!e(t[n],i[n],r-1))return!1;return!0}return!1}})},38055(e,t,i){function r(e,t=()=>!0){return Array.isArray(e)?function e(t,i,r){let s=-1;for(;++s<t.length;){let n=t[s];Array.isArray(n)?e(n,i,r):i(n)&&r.push(n)}return r}(e,t,[]):t(e)?[e]:[]}function s({target:e,source:t,start:i=0,count:r=1}){let n=t.length,o=r*n,a=0;for(let r=i;a<n;a++)e[r++]=t[a];for(;a<o;)a<o-a?(e.copyWithin(i+a,i,i+a),a*=2):(e.copyWithin(i+a,i,i+o-a),a=o);return e}i.d(t,{B:()=>r,R:()=>s})},53439(e,t,i){i.d(t,{I:()=>a,Td:()=>o,X:()=>n});let r=[],s=[];function n(e,t=0,i=1/0){let o=r,a={index:-1,data:e,target:[]};return e?"function"==typeof e[Symbol.iterator]?o=e:e.length>0&&(s.length=e.length,o=s):o=r,(t>0||Number.isFinite(i))&&(o=(Array.isArray(o)?o:Array.from(o)).slice(t,i),a.index=t-1),{iterable:o,objectInfo:a}}function o(e){return e&&e[Symbol.asyncIterator]}function a(e,t){let{size:i,stride:r,offset:s,startIndices:n,nested:o}=t,a=e.BYTES_PER_ELEMENT,l=r?r/a:i,u=s?s/a:0,h=Math.floor((e.length-u)/l);return(t,{index:r,target:s})=>{let a;if(!n){let t=r*l+u;for(let r=0;r<i;r++)s[r]=e[t+r];return s}let c=n[r],d=n[r+1]||h;if(o){a=Array(d-c);for(let t=c;t<d;t++){let r=t*l+u;s=Array(i);for(let t=0;t<i;t++)s[t]=e[r+t];a[t-c]=s}}else if(l===i)a=e.subarray(c*i+u,d*i+u);else{a=new e.constructor((d-c)*i);let t=0;for(let r=c;r<d;r++){let s=r*l+u;for(let r=0;r<i;r++)a[t++]=e[s+r]}}return a}}},3459(e,t,i){i.d(t,{A:()=>r});let r=new(i(19727)).h({id:"deck"})},25667(e,t,i){let r;i.d(t,{$M:()=>o,Vl:()=>l,_Z:()=>p,cT:()=>f,om:()=>u,on:()=>h,zi:()=>a});var s=i(23459),n=i(3289);function o(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function a(e,t){let i=e%t;return i<0?t+i:i}function l(e){return[e[12],e[13],e[14]]}function u(e){let t=e[10],i=e[14];return{near:i/(t-1),far:i/(t+1)}}function h(e){return{left:d(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:d(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:d(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:d(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:d(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:d(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}let c=new n.P;function d(e,t,i,r){c.set(e,t,i);let s=c.len();return{distance:r/s,normal:new n.P(-e/s,-t/s,-i/s)}}function f(e,t){let{size:i=1,startIndex:n=0}=t,o=void 0!==t.endIndex?t.endIndex:e.length,a=(o-n)/i;r=s.A.allocate(r,a,{type:Float32Array,size:2*i});let l=n,u=0;for(;l<o;){for(let t=0;t<i;t++){let s=e[l++];r[u+t]=s,r[u+t+i]=s-Math.fround(s)}u+=2*i}return r.subarray(0,a*i*2)}function p(e){let t=null,i=!1;for(let r of e)r&&(t?(i||(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],i=!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}},82417(e,t,i){i.d(t,{A:()=>r});function r(e){let t,i={};return r=>{for(let s in r)if(!function(e,t){if(e===t)return!0;if(Array.isArray(e)){let i=e.length;if(!t||t.length!==i)return!1;for(let r=0;r<i;r++)if(e[r]!==t[r])return!1;return!0}return!1}(r[s],i[s])){t=e(r),i=r;break}return t}}},33945(e,t,i){i.d(t,{E9:()=>n,rk:()=>s});let r=/^(?:\d+\.?\d*|\.\d+)$/;function s(e){switch(typeof e){case"number":if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:"literal",value:e};case"string":try{let t=function(e){let t=[],i=0;for(;i<e.length;){let s=e[i];if(/\s/.test(s)){i++;continue}if("+"===s||"-"===s||"("===s||")"===s||"%"===s){t.push({type:"symbol",value:s}),i++;continue}if(a(s)||"."===s){let n=i,o="."===s;for(i++;i<e.length;){let t=e[i];if(a(t)){i++;continue}if("."===t&&!o){o=!0,i++;continue}break}let l=e.slice(n,i);if(!r.test(l))throw Error("Invalid number token");t.push({type:"number",value:parseFloat(l)});continue}if(l(s)){let r=i;for(;i<e.length&&l(e[i]);)i++;let s=e.slice(r,i).toLowerCase();t.push({type:"word",value:s});continue}throw Error("Invalid token in position string")}return t}(e);return new o(t).parseExpression()}catch(i){let t=i instanceof Error?i.message:String(i);throw Error(`Could not parse position string ${e}: ${t}`)}default:throw Error(`Could not parse position string ${e}`)}}function n(e,t){return function e(t,i){switch(t.type){case"literal":return t.value;case"percentage":return Math.round(t.value*i);case"binary":let r=e(t.left,i),s=e(t.right,i);return"+"===t.operator?r+s:r-s;default:throw Error("Unknown layout expression type")}}(e,t)}class o{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error("Unexpected token at end of expression");return e}parseBinaryExpression(){var e;let t=this.parseFactor(),i=this.peek();for(;(e=i)&&"symbol"===e.type&&("+"===e.value||"-"===e.value);){this.index++;let e=this.parseFactor();t={type:"binary",operator:i.value,left:t,right:e},i=this.peek()}return t}parseFactor(){let e=this.peek();if(!e)throw Error("Unexpected end of expression");if("symbol"===e.type&&"+"===e.value)return this.index++,this.parseFactor();if("symbol"===e.type&&"-"===e.value)return this.index++,{type:"binary",operator:"-",left:{type:"literal",value:0},right:this.parseFactor()};if("symbol"===e.type&&"("===e.value){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw Error("Missing closing parenthesis");return e}if("word"===e.type&&"calc"===e.value){if(this.index++,!this.consumeSymbol("("))throw Error("Missing opening parenthesis after calc");let e=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw Error("Missing closing parenthesis");return e}if("number"===e.type){this.index++;let t=e.value,i=this.peek();return i&&"symbol"===i.type&&"%"===i.value?(this.index++,{type:"percentage",value:t/100}):(i&&"word"===i.type&&"px"===i.value&&this.index++,{type:"literal",value:t})}throw Error("Unexpected token in expression")}consumeSymbol(e){let t=this.peek();return!!t&&"symbol"===t.type&&t.value===e&&(this.index++,!0)}peek(){return this.tokens[this.index]||null}}function a(e){return e>="0"&&e<="9"}function l(e){return e>="a"&&e<="z"||e>="A"&&e<="Z"}},23459(e,t,i){i.d(t,{A:()=>r});let r=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:i=1,type:r,padding:s=0,copy:n=!1,initialize:o=!1,maxCount:a}){let l=r||e&&e.constructor||Float32Array,u=t*i+s;if(ArrayBuffer.isView(e)){if(u<=e.length)return e;if(u*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new l(e.buffer,0,u)}let h=1/0;a&&(h=a*i+s);let c=this._allocate(l,u,o,h);return e&&n?c.set(e):o||c.fill(0,0,4),this._release(e),c}release(e){this._release(e)}_allocate(e,t,i,r){let s=Math.max(Math.ceil(t*this.opts.overAlloc),1);s>r&&(s=r);let n=this._pool,o=e.BYTES_PER_ELEMENT*s,a=n.findIndex(e=>e.byteLength>=o);if(a>=0){let t=new e(n.splice(a,1)[0],0,s);return i&&t.fill(0),t}return new e(s)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:i}=e,{byteLength:r}=i,s=t.findIndex(e=>e.byteLength>=r);s<0?t.push(i):(s>0||t.length<this.opts.poolSize)&&t.splice(s,0,i),t.length>this.opts.poolSize&&t.shift()}}},47345(e,t,i){i.d(t,{A:()=>m});var r=i(3459),s=i(25667),n=i(41534),o=i(31609),a=i(3289),l=i(36526),u=i(78883),h=i(9350);let c=Math.PI/180,d=(0,s.$M)(),f=[0,0,0],p={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};class g{constructor(e={}){this._frustumPlanes={},this.id=e.id||this.constructor.displayName||"viewport",this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=e.distanceScales||p,this.focalDistance=e.focalDistance||1,this.position=e.position||f,this.modelMatrix=e.modelMatrix||null;let{longitude:t,latitude:i}=e;this.isGeospatial=Number.isFinite(i)&&Number.isFinite(t),this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?h.Kx.WEB_MERCATOR:h.Kx.WEB_MERCATOR_AUTO_OFFSET:h.Kx.IDENTITY}equals(e){return e instanceof g&&(this===e||e.width===this.width&&e.height===this.height&&e.scale===this.scale&&e.projectionMode===this.projectionMode&&e.resolution===this.resolution&&(0,o.aI)(e.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&(0,o.aI)(e.projectionMatrix,this.projectionMatrix)&&(0,o.aI)(e.viewMatrix,this.viewMatrix))}project(e,{topLeft:t=!0}={}){let i=this.projectPosition(e),r=(0,u.VJ)(i,this.pixelProjectionMatrix),[s,n]=r,o=t?n:this.height-n;return 2===e.length?[s,o]:[s,o,r[2]]}unproject(e,{topLeft:t=!0,targetZ:i}={}){let[r,s,n]=e,o=t?s:this.height-s,a=i&&i*this.distanceScales.unitsPerMeter[2],l=(0,u.xJ)([r,o,n],this.pixelUnprojectionMatrix,a),[h,c,d]=this.unprojectPosition(l);return Number.isFinite(n)?[h,c,d]:Number.isFinite(i)?[h,c,i]:[h,c]}projectPosition(e){let[t,i]=this.projectFlat(e);return[t,i,(e[2]||0)*this.distanceScales.unitsPerMeter[2]]}unprojectPosition(e){let[t,i]=this.unprojectFlat(e);return[t,i,(e[2]||0)*this.distanceScales.metersPerUnit[2]]}projectFlat(e){if(this.isGeospatial){let t=(0,u.Gw)(e);return t[1]=(0,o.qE)(t[1],-318,830),t}return e}unprojectFlat(e){return this.isGeospatial?(0,u.iV)(e):e}getBounds(e={}){let t={targetZ:e.z||0},i=this.unproject([0,0],t),r=this.unproject([this.width,0],t),s=this.unproject([0,this.height],t),n=this.unproject([this.width,this.height],t);return[Math.min(i[0],r[0],s[0],n[0]),Math.min(i[1],r[1],s[1],n[1]),Math.max(i[0],r[0],s[0],n[0]),Math.max(i[1],r[1],s[1],n[1])]}getDistanceScales(e){return e&&this.isGeospatial?(0,u.nI)({longitude:e[0],latitude:e[1],highPrecision:!0}):this.distanceScales}containsPixel({x:e,y:t,width:i=1,height:r=1}){return e<this.x+this.width&&this.x<e+i&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,(0,s.on)(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,i){return null}_initProps(e){let t=e.longitude,i=e.latitude;this.isGeospatial&&(Number.isFinite(e.zoom)||(this.zoom=(0,u.fO)({latitude:i})+Math.log2(this.focalDistance)),this.distanceScales=e.distanceScales||(0,u.nI)({latitude:i,longitude:t}));let r=Math.pow(2,this.zoom);this.scale=r;let{position:s,modelMatrix:o}=e,l=f;if(s&&(l=o?new n.k(o).transformAsVector(s,[]):s),this.isGeospatial){let e=this.projectPosition([t,i,0]);this.center=new a.P(l).scale(this.distanceScales.unitsPerMeter).add(e)}else this.center=this.projectPosition(l)}_initMatrices(e){let{viewMatrix:t=d,projectionMatrix:i=null,orthographic:u=!1,fovyRadians:h,fovy:f=75,near:p=.1,far:g=1e3,padding:m=null,focalDistance:_=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new n.k().multiplyRight(t).translate(new a.P(this.center).negate()),this.projectionMatrix=i||function({width:e,height:t,orthographic:i,fovyRadians:r,focalDistance:s,padding:a,near:l,far:u}){let h=e/t,c=i?new n.k().orthographic({fovy:r,aspect:h,focalDistance:s,near:l,far:u}):new n.k().perspective({fovy:r,aspect:h,near:l,far:u});if(a){let{left:i=0,right:r=0,top:s=0,bottom:n=0}=a,l=(0,o.qE)((i+e-r)/2,0,e)-e/2,u=(0,o.qE)((s+t-n)/2,0,t)-t/2;c[8]-=2*l/e,c[9]+=2*u/t}return c}({width:this.width,height:this.height,orthographic:u,fovyRadians:h||f*c,focalDistance:_,padding:m,near:p,far:g});let v=(0,s.$M)();l.lw(v,v,this.projectionMatrix),l.lw(v,v,this.viewMatrix),this.viewProjectionMatrix=v,this.viewMatrixInverse=l.B8([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=(0,s.Vl)(this.viewMatrixInverse);let y=(0,s.$M)(),b=(0,s.$M)();l.hs(y,y,[this.width/2,-this.height/2,1]),l.Tl(y,y,[1,-1,0]),l.lw(b,y,this.viewProjectionMatrix),this.pixelProjectionMatrix=b,this.pixelUnprojectionMatrix=l.B8((0,s.$M)(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||r.A.warn("Pixel project matrix not invertible")()}}g.displayName="Viewport";let m=g},41367(e,t,i){i.d(t,{A:()=>f});var r=i(47345),s=i(78883),n=i(39808),o=i(6597);let a=Math.PI/180;function l(e,t,i){let{pixelUnprojectionMatrix:r}=e,a=(0,o._U)(r,[t,0,1,1]),l=(0,o._U)(r,[t,e.height,1,1]),u=(i*e.distanceScales.unitsPerMeter[2]-a[2])/(l[2]-a[2]),h=n.Cc([],a,l,u),c=(0,s.iV)(h);return c.push(i),c}var u=i(54677),h=i(31609),c=i(41534);class d extends r.A{constructor(e={}){let t,{latitude:i=0,longitude:r=0,zoom:n=0,pitch:o=0,bearing:a=0,nearZMultiplier:l=.1,farZMultiplier:u=1.01,nearZ:d,farZ:f,orthographic:p=!1,projectionMatrix:g,repeat:m=!1,worldOffset:_=0,position:v,padding:y,legacyMeterSizes:b=!1}=e,{width:w,height:E,altitude:P=1.5}=e,x=Math.pow(2,n);w=w||1,E=E||1;let S=null;if(g)P=g[5]/2,t=(0,s.Os)(P);else{let r;if(e.fovy?(t=e.fovy,P=(0,s.wZ)(t)):t=(0,s.Os)(P),y){let{top:e=0,bottom:t=0}=y;r=[0,(0,h.qE)((e+E-t)/2,0,E)-E/2]}S=(0,s.om)({width:w,height:E,scale:x,center:v&&[0,0,v[2]*(0,s.mY)(i)],offset:r,pitch:o,fovy:t,nearZMultiplier:l,farZMultiplier:u}),Number.isFinite(d)&&(S.near=d),Number.isFinite(f)&&(S.far=f)}let M=(0,s.rY)({height:E,pitch:o,bearing:a,scale:x,altitude:P});_&&(M=new c.k().translate([512*_,0,0]).multiplyLeft(M)),super({...e,width:w,height:E,viewMatrix:M,longitude:r,latitude:i,zoom:n,...S,fovy:t,focalDistance:P}),this.latitude=i,this.longitude=r,this.zoom=n,this.pitch=o,this.bearing=a,this.altitude=P,this.fovy=t,this.orthographic=p,this._subViewports=m?[]:null,this._pseudoMeters=b,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let e=this.getBounds(),t=Math.floor((e[0]+180)/360),i=Math.ceil((e[2]-180)/360);for(let e=t;e<=i;e++){let t=e?new d({...this,worldOffset:e}):this;this._subViewports.push(t)}}return this._subViewports}equals(e){return e instanceof d&&e._pseudoMeters===this._pseudoMeters&&super.equals(e)}projectPosition(e){if(this._pseudoMeters)return super.projectPosition(e);let[t,i]=this.projectFlat(e);return[t,i,(e[2]||0)*(0,s.mY)(e[1])]}unprojectPosition(e){if(this._pseudoMeters)return super.unprojectPosition(e);let[t,i]=this.unprojectFlat(e),r=(e[2]||0)/(0,s.mY)(i);return[t,i,r]}addMetersToLngLat(e,t){return(0,s.dT)(e,t)}panByPosition(e,t,i){let r=(0,s.xJ)(t,this.pixelUnprojectionMatrix),o=this.projectFlat(e),a=n.WQ([],o,n.ze([],r)),l=n.WQ([],this.center,a),[u,h]=this.unprojectFlat(l);return{longitude:u,latitude:h}}panByPosition3D(e,t){let i=e[2]||0,r=n.jb([],e,this.unproject(t,{targetZ:i}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=function(e,t=0){let i,r,{width:s,height:n,unproject:o}=e,u={targetZ:t},h=o([0,n],u),c=o([s,n],u);return(e.fovy?.5*e.fovy*a:Math.atan(.5/e.altitude))>(90-e.pitch)*a-.01?(i=l(e,0,t),r=l(e,s,t)):(i=o([0,0],u),r=o([s,0],u)),[h,c,r,i]}(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(e,t={}){let{width:i,height:r}=this,{longitude:n,latitude:a,zoom:l}=function(e){let{width:t,height:i,bounds:r,minExtent:n=0,maxZoom:a=24,offset:l=[0,0]}=e,[[h,c],[d,f]]=r,p=function(e=0){return"number"==typeof e?{top:e,bottom:e,left:e,right:e}:((0,u.v)(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}(e.padding),g=(0,s.Gw)([h,(0,o.qE)(f,-s.aH,s.aH)]),m=(0,s.Gw)([d,(0,o.qE)(c,-s.aH,s.aH)]),_=[Math.max(Math.abs(m[0]-g[0]),n),Math.max(Math.abs(m[1]-g[1]),n)],v=[t-p.left-p.right-2*Math.abs(l[0]),i-p.top-p.bottom-2*Math.abs(l[1])];(0,u.v)(v[0]>0&&v[1]>0);let y=v[0]/_[0],b=v[1]/_[1],w=(p.right-p.left)/2/y,E=(p.top-p.bottom)/2/b,P=[(m[0]+g[0])/2+w,(m[1]+g[1])/2+E],x=(0,s.iV)(P),S=Math.min(a,(0,o.p6)(Math.abs(Math.min(y,b))));return(0,u.v)(Number.isFinite(S)),{longitude:x[0],latitude:x[1],zoom:S}}({width:i,height:r,bounds:e,...t});return new d({width:i,height:r,longitude:n,latitude:a,zoom:l})}}d.displayName="WebMercatorViewport";let f=d},12041(e,t,i){i.d(t,{A:()=>n});var r=i(33945),s=i(7914);class n{constructor(e){let{id:t,x:i=0,y:s=0,width:n="100%",height:o="100%",padding:a=null}=e;this.id=t||this.constructor.displayName||"view",this.props={...e,id:this.id},this._x=(0,r.rk)(i),this._y=(0,r.rk)(s),this._width=(0,r.rk)(n),this._height=(0,r.rk)(o),this._padding=a&&{left:(0,r.rk)(a.left||0),right:(0,r.rk)(a.right||0),top:(0,r.rk)(a.top||0),bottom:(0,r.rk)(a.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}equals(e){return this===e||this.constructor===e.constructor&&(0,s.b)(this.props,e.props,2)}clone(e){return new this.constructor({...this.props,...e})}makeViewport({width:e,height:t,viewState:i}){i=this.filterViewState(i);let r=this.getDimensions({width:e,height:t});return r.height&&r.width?new(this.getViewportType(i))({...i,...this.props,...r}):null}getViewStateId(){let{viewState:e}=this.props;return"string"==typeof e?e:e?.id||this.id}filterViewState(e){if(this.props.viewState&&"object"==typeof this.props.viewState){if(!this.props.viewState.id)return this.props.viewState;var t=this.props.viewState;let i={...e};for(let e in t)"id"!==e&&(Array.isArray(i[e])&&Array.isArray(t[e])?i[e]=function(e,t){e=e.slice();for(let i=0;i<t.length;i++){let r=t[i];Number.isFinite(r)&&(e[i]=r)}return e}(i[e],t[e]):i[e]=t[e]);return i}return e}getDimensions({width:e,height:t}){let i={x:(0,r.E9)(this._x,e),y:(0,r.E9)(this._y,t),width:(0,r.E9)(this._width,e),height:(0,r.E9)(this._height,t)};return this._padding&&(i.padding={left:(0,r.E9)(this._padding.left,e),top:(0,r.E9)(this._padding.top,t),right:(0,r.E9)(this._padding.right,e),bottom:(0,r.E9)(this._padding.bottom,t)}),i}get controller(){let e=this.props.controller;return e?!0===e?{type:this.ControllerType}:"function"==typeof e?{type:e}:{type:this.ControllerType,...e}:null}}},22349(e,t,i){i.d(t,{a:()=>s});var r=i(31609);class s extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let i=0;i<this.ELEMENTS;++i)this[i]=e[i+t];return this.check()}toArray(e=[],t=0){for(let i=0;i<this.ELEMENTS;++i)e[t+i]=this[i];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:(0,r.cy)(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toFloat32Array(){return new Float32Array(this)}toString(){return this.formatString(r.$W)}formatString(e){let t="";for(let i=0;i<this.ELEMENTS;++i)t+=(i>0?", ":"")+(0,r.Fl)(this[i],e);return`${e.printTypes?this.constructor.name:""}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!(0,r.aI)(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,i){if(void 0===i)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let s=e[r],n="number"==typeof t?t:t[r];this[r]=s+i*(n-s)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],e[i]),t[i]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if("number"==typeof e)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(r.$W.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e=e&&Number.isFinite(this[t]);return e}sub(e){return this.subtract(e)}setScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=e;return this.check()}addScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]+=e;return this.check()}subScalar(e){return this.addScalar(-e)}multiplyScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}divideScalar(e){return this.multiplyByScalar(1/e)}clampScalar(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],e),t);return this.check()}get elements(){return this}}},91504(e,t,i){i.d(t,{M:()=>o});var r=i(22349),s=i(89607);function n(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}class o extends r.a{get x(){return this[0]}set x(e){this[0]=(0,s.ws)(e)}get y(){return this[1]}set y(e){this[1]=(0,s.ws)(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let i=0;i<this.ELEMENTS;++i){let r=this[i]-e[i];t+=r*r}return(0,s.ws)(t)}dot(e){let t=0;for(let i=0;i<this.ELEMENTS;++i)t+=this[i]*e[i];return(0,s.ws)(t)}normalize(){let e=this.magnitude();if(0!==e)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return n(e>=0&&e<this.ELEMENTS,"index is out of range"),(0,s.ws)(this[e])}setComponent(e,t){return n(e>=0&&e<this.ELEMENTS,"index is out of range"),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){return this.add(new this.constructor(e).multiplyScalar(t))}}},41534(e,t,i){let r,s;i.d(t,{k:()=>v});var n,o,a=i(22349),l=i(89607),u=i(31609);class h extends a.a{toString(){let e="[";if(u.$W.printRowMajor){e+="row-major:";for(let t=0;t<this.RANK;++t)for(let i=0;i<this.RANK;++i)e+=` ${this[i*this.RANK+t]}`}else{e+="column-major:";for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+"]"}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,i){return this[t*this.RANK+e]=(0,l.ws)(i),this}getColumn(e,t=Array(this.RANK).fill(-0)){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[i+e];return t}setColumn(e,t){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)this[i+e]=t[e];return this}}var c=i(76909),d=i(36526),f=i(39808),p=i(29527),g=i(70998);(n=o||(o={}))[n.COL0ROW0=0]="COL0ROW0",n[n.COL0ROW1=1]="COL0ROW1",n[n.COL0ROW2=2]="COL0ROW2",n[n.COL0ROW3=3]="COL0ROW3",n[n.COL1ROW0=4]="COL1ROW0",n[n.COL1ROW1=5]="COL1ROW1",n[n.COL1ROW2=6]="COL1ROW2",n[n.COL1ROW3=7]="COL1ROW3",n[n.COL2ROW0=8]="COL2ROW0",n[n.COL2ROW1=9]="COL2ROW1",n[n.COL2ROW2=10]="COL2ROW2",n[n.COL2ROW3=11]="COL2ROW3",n[n.COL3ROW0=12]="COL3ROW0",n[n.COL3ROW1=13]="COL3ROW1",n[n.COL3ROW2=14]="COL3ROW2",n[n.COL3ROW3=15]="COL3ROW3";let m=45*Math.PI/180,_=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);class v extends h{static get IDENTITY(){return s||Object.freeze(s=new v),s}static get ZERO(){return r||Object.freeze(r=new v([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),r}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return o}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),1==arguments.length&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,i,r,s,n,o,a,l,u,h,c,d,f,p,g){return this[0]=e,this[1]=t,this[2]=i,this[3]=r,this[4]=s,this[5]=n,this[6]=o,this[7]=a,this[8]=l,this[9]=u,this[10]=h,this[11]=c,this[12]=d,this[13]=f,this[14]=p,this[15]=g,this.check()}setRowMajor(e,t,i,r,s,n,o,a,l,u,h,c,d,f,p,g){return this[0]=e,this[1]=s,this[2]=l,this[3]=d,this[4]=t,this[5]=n,this[6]=u,this[7]=f,this[8]=i,this[9]=o,this[10]=h,this[11]=p,this[12]=r,this[13]=a,this[14]=c,this[15]=g,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(_)}fromObject(e){return this.check()}fromQuaternion(e){return(0,d.I0)(this,e),this.check()}frustum(e){var t,i,r,s,n,o;let{left:a,right:l,bottom:u,top:h,near:c=.1,far:f=500}=e;return f===1/0?(t=this,i=a,r=l,s=u,n=h,o=c,t[0]=2*o/(r-i),t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=2*o/(n-s),t[6]=0,t[7]=0,t[8]=(r+i)/(r-i),t[9]=(n+s)/(n-s),t[10]=-1,t[11]=-1,t[12]=0,t[13]=0,t[14]=-2*o,t[15]=0):(0,d.$h)(this,a,l,u,h,c,f),this.check()}lookAt(e){let{eye:t,center:i=[0,0,0],up:r=[0,1,0]}=e;return(0,d.t5)(this,t,i,r),this.check()}ortho(e){let{left:t,right:i,bottom:r,top:s,near:n=.1,far:o=500}=e;return(0,d.v3)(this,t,i,r,s,n,o),this.check()}orthographic(e){let{fovy:t=m,aspect:i=1,focalDistance:r=1,near:s=.1,far:n=500}=e;y(t);let o=r*Math.tan(t/2),a=o*i;return this.ortho({left:-a,right:a,bottom:-o,top:o,near:s,far:n})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:i=1,near:r=.1,far:s=500}=e;return y(t),(0,d.fN)(this,t,i,r,s),this.check()}determinant(){return(0,d.a4)(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e=e||[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t=t||[-0,-0,-0];let i=this.getScale(t),r=1/i[0],s=1/i[1],n=1/i[2];return e[0]=this[0]*r,e[1]=this[1]*s,e[2]=this[2]*n,e[3]=0,e[4]=this[4]*r,e[5]=this[5]*s,e[6]=this[6]*n,e[7]=0,e[8]=this[8]*r,e[9]=this[9]*s,e[10]=this[10]*n,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e=e||[-0,-0,-0,-0,-0,-0,-0,-0,-0],t=t||[-0,-0,-0];let i=this.getScale(t),r=1/i[0],s=1/i[1],n=1/i[2];return e[0]=this[0]*r,e[1]=this[1]*s,e[2]=this[2]*n,e[3]=this[4]*r,e[4]=this[5]*s,e[5]=this[6]*n,e[6]=this[8]*r,e[7]=this[9]*s,e[8]=this[10]*n,e}transpose(){return(0,d.mg)(this,this),this.check()}invert(){return(0,d.B8)(this,this),this.check()}multiplyLeft(e){return(0,d.lw)(this,e,this),this.check()}multiplyRight(e){return(0,d.lw)(this,this,e),this.check()}rotateX(e){return(0,d.eL)(this,this,e),this.check()}rotateY(e){return(0,d.Z8)(this,this,e),this.check()}rotateZ(e){return(0,d.Qr)(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return(0,d.e$)(this,this,e,t),this.check()}scale(e){return(0,d.hs)(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return(0,d.Tl)(this,this,e),this.check()}transform(e,t){return 4===e.length?(t=(0,g.Z0)(t||[-0,-0,-0,-0],e,this),(0,l.qk)(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let i,{length:r}=e;switch(r){case 2:i=(0,f.Z0)(t||[-0,-0],e,this);break;case 3:i=(0,p.Z0)(t||[-0,-0,-0],e,this);break;default:throw Error("Illegal vector")}return(0,l.qk)(i,e.length),i}transformAsVector(e,t){let i;switch(e.length){case 2:i=(0,c.B$)(t||[-0,-0],e,this);break;case 3:i=(0,c.cL)(t||[-0,-0,-0],e,this);break;default:throw Error("Illegal vector")}return(0,l.qk)(i,e.length),i}transformPoint(e,t){return this.transformAsPoint(e,t)}transformVector(e,t){return this.transformAsPoint(e,t)}transformDirection(e,t){return this.transformAsVector(e,t)}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,i){return this.identity().translate([e,t,i])}}function y(e){if(e>2*Math.PI)throw Error("expected radians")}},3289(e,t,i){let r;i.d(t,{P:()=>h});var s=i(91504),n=i(31609),o=i(89607),a=i(29527),l=i(76909);let u=[0,0,0];class h extends s.M{static get ZERO(){return r||Object.freeze(r=new h(0,0,0)),r}constructor(e=0,t=0,i=0){super(-0,-0,-0),1==arguments.length&&(0,n.cy)(e)?this.copy(e):(n.$W.debug&&((0,o.ws)(e),(0,o.ws)(t),(0,o.ws)(i)),this[0]=e,this[1]=t,this[2]=i)}set(e,t,i){return this[0]=e,this[1]=t,this[2]=i,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return n.$W.debug&&((0,o.ws)(e.x),(0,o.ws)(e.y),(0,o.ws)(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=(0,o.ws)(e)}angle(e){return(0,a.g7)(this,e)}cross(e){return(0,a.$A)(this,this,e),this.check()}rotateX({radians:e,origin:t=u}){return(0,a.eL)(this,this,t,e),this.check()}rotateY({radians:e,origin:t=u}){return(0,a.Z8)(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=u}){return(0,a.x6)(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return(0,a.Z0)(this,this,e),this.check()}transformAsVector(e){return(0,l.cL)(this,this,e),this.check()}transformByMatrix3(e){return(0,a.ei)(this,this,e),this.check()}transformByMatrix2(e){return(0,l.J4)(this,this,e),this.check()}transformByQuaternion(e){return(0,a.gL)(this,this,e),this.check()}}},61449(e,t,i){i.d(t,{p8:()=>r,tb:()=>s});let r=1e-6,s="u">typeof Float32Array?Float32Array:Array},36526(e,t,i){i.d(t,{$h:()=>g,B8:()=>n,I0:()=>p,Qr:()=>f,Tl:()=>l,Z8:()=>d,a4:()=>o,e$:()=>h,eL:()=>c,fN:()=>m,hs:()=>u,lw:()=>a,mg:()=>s,t5:()=>v,v3:()=>_});var r=i(61449);function s(e,t){if(e===t){let i=t[1],r=t[2],s=t[3],n=t[6],o=t[7],a=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=i,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=n,e[11]=t[14],e[12]=s,e[13]=o,e[14]=a}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function n(e,t){let i=t[0],r=t[1],s=t[2],n=t[3],o=t[4],a=t[5],l=t[6],u=t[7],h=t[8],c=t[9],d=t[10],f=t[11],p=t[12],g=t[13],m=t[14],_=t[15],v=i*a-r*o,y=i*l-s*o,b=i*u-n*o,w=r*l-s*a,E=r*u-n*a,P=s*u-n*l,x=h*g-c*p,S=h*m-d*p,M=h*_-f*p,A=c*m-d*g,C=c*_-f*g,T=d*_-f*m,k=v*T-y*C+b*A+w*M-E*S+P*x;return k?(k=1/k,e[0]=(a*T-l*C+u*A)*k,e[1]=(s*C-r*T-n*A)*k,e[2]=(g*P-m*E+_*w)*k,e[3]=(d*E-c*P-f*w)*k,e[4]=(l*M-o*T-u*S)*k,e[5]=(i*T-s*M+n*S)*k,e[6]=(m*b-p*P-_*y)*k,e[7]=(h*P-d*b+f*y)*k,e[8]=(o*C-a*M+u*x)*k,e[9]=(r*M-i*C-n*x)*k,e[10]=(p*E-g*b+_*v)*k,e[11]=(c*b-h*E-f*v)*k,e[12]=(a*S-o*A-l*x)*k,e[13]=(i*A-r*S+s*x)*k,e[14]=(g*y-p*w-m*v)*k,e[15]=(h*w-c*y+d*v)*k,e):null}function o(e){let t=e[0],i=e[1],r=e[2],s=e[3],n=e[4],o=e[5],a=e[6],l=e[7],u=e[8],h=e[9],c=e[10],d=e[11],f=e[12],p=e[13],g=e[14],m=e[15],_=t*o-i*n,v=t*a-r*n,y=i*a-r*o,b=u*p-h*f,w=u*g-c*f,E=h*g-c*p;return l*(t*E-i*w+r*b)-s*(n*E-o*w+a*b)+m*(u*y-h*v+c*_)-d*(f*y-p*v+g*_)}function a(e,t,i){let r=t[0],s=t[1],n=t[2],o=t[3],a=t[4],l=t[5],u=t[6],h=t[7],c=t[8],d=t[9],f=t[10],p=t[11],g=t[12],m=t[13],_=t[14],v=t[15],y=i[0],b=i[1],w=i[2],E=i[3];return e[0]=y*r+b*a+w*c+E*g,e[1]=y*s+b*l+w*d+E*m,e[2]=y*n+b*u+w*f+E*_,e[3]=y*o+b*h+w*p+E*v,y=i[4],b=i[5],w=i[6],E=i[7],e[4]=y*r+b*a+w*c+E*g,e[5]=y*s+b*l+w*d+E*m,e[6]=y*n+b*u+w*f+E*_,e[7]=y*o+b*h+w*p+E*v,y=i[8],b=i[9],w=i[10],E=i[11],e[8]=y*r+b*a+w*c+E*g,e[9]=y*s+b*l+w*d+E*m,e[10]=y*n+b*u+w*f+E*_,e[11]=y*o+b*h+w*p+E*v,y=i[12],b=i[13],w=i[14],E=i[15],e[12]=y*r+b*a+w*c+E*g,e[13]=y*s+b*l+w*d+E*m,e[14]=y*n+b*u+w*f+E*_,e[15]=y*o+b*h+w*p+E*v,e}function l(e,t,i){let r,s,n,o,a,l,u,h,c,d,f,p,g=i[0],m=i[1],_=i[2];return t===e?(e[12]=t[0]*g+t[4]*m+t[8]*_+t[12],e[13]=t[1]*g+t[5]*m+t[9]*_+t[13],e[14]=t[2]*g+t[6]*m+t[10]*_+t[14],e[15]=t[3]*g+t[7]*m+t[11]*_+t[15]):(r=t[0],s=t[1],n=t[2],o=t[3],a=t[4],l=t[5],u=t[6],h=t[7],c=t[8],d=t[9],f=t[10],p=t[11],e[0]=r,e[1]=s,e[2]=n,e[3]=o,e[4]=a,e[5]=l,e[6]=u,e[7]=h,e[8]=c,e[9]=d,e[10]=f,e[11]=p,e[12]=r*g+a*m+c*_+t[12],e[13]=s*g+l*m+d*_+t[13],e[14]=n*g+u*m+f*_+t[14],e[15]=o*g+h*m+p*_+t[15]),e}function u(e,t,i){let r=i[0],s=i[1],n=i[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*s,e[5]=t[5]*s,e[6]=t[6]*s,e[7]=t[7]*s,e[8]=t[8]*n,e[9]=t[9]*n,e[10]=t[10]*n,e[11]=t[11]*n,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function h(e,t,i,s){let n,o,a,l,u,h,c,d,f,p,g,m,_,v,y,b,w,E,P,x,S,M,A,C,T=s[0],k=s[1],L=s[2],I=Math.sqrt(T*T+k*k+L*L);return I<r.p8?null:(T*=I=1/I,k*=I,L*=I,o=Math.sin(i),a=1-(n=Math.cos(i)),l=t[0],u=t[1],h=t[2],c=t[3],d=t[4],f=t[5],p=t[6],g=t[7],m=t[8],_=t[9],v=t[10],y=t[11],b=T*T*a+n,w=k*T*a+L*o,E=L*T*a-k*o,P=T*k*a-L*o,x=k*k*a+n,S=L*k*a+T*o,M=T*L*a+k*o,A=k*L*a-T*o,C=L*L*a+n,e[0]=l*b+d*w+m*E,e[1]=u*b+f*w+_*E,e[2]=h*b+p*w+v*E,e[3]=c*b+g*w+y*E,e[4]=l*P+d*x+m*S,e[5]=u*P+f*x+_*S,e[6]=h*P+p*x+v*S,e[7]=c*P+g*x+y*S,e[8]=l*M+d*A+m*C,e[9]=u*M+f*A+_*C,e[10]=h*M+p*A+v*C,e[11]=c*M+g*A+y*C,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function c(e,t,i){let r=Math.sin(i),s=Math.cos(i),n=t[4],o=t[5],a=t[6],l=t[7],u=t[8],h=t[9],c=t[10],d=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=n*s+u*r,e[5]=o*s+h*r,e[6]=a*s+c*r,e[7]=l*s+d*r,e[8]=u*s-n*r,e[9]=h*s-o*r,e[10]=c*s-a*r,e[11]=d*s-l*r,e}function d(e,t,i){let r=Math.sin(i),s=Math.cos(i),n=t[0],o=t[1],a=t[2],l=t[3],u=t[8],h=t[9],c=t[10],d=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=n*s-u*r,e[1]=o*s-h*r,e[2]=a*s-c*r,e[3]=l*s-d*r,e[8]=n*r+u*s,e[9]=o*r+h*s,e[10]=a*r+c*s,e[11]=l*r+d*s,e}function f(e,t,i){let r=Math.sin(i),s=Math.cos(i),n=t[0],o=t[1],a=t[2],l=t[3],u=t[4],h=t[5],c=t[6],d=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=n*s+u*r,e[1]=o*s+h*r,e[2]=a*s+c*r,e[3]=l*s+d*r,e[4]=u*s-n*r,e[5]=h*s-o*r,e[6]=c*s-a*r,e[7]=d*s-l*r,e}function p(e,t){let i=t[0],r=t[1],s=t[2],n=t[3],o=i+i,a=r+r,l=s+s,u=i*o,h=r*o,c=r*a,d=s*o,f=s*a,p=s*l,g=n*o,m=n*a,_=n*l;return e[0]=1-c-p,e[1]=h+_,e[2]=d-m,e[3]=0,e[4]=h-_,e[5]=1-u-p,e[6]=f+g,e[7]=0,e[8]=d+m,e[9]=f-g,e[10]=1-u-c,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function g(e,t,i,r,s,n,o){let a=1/(i-t),l=1/(s-r),u=1/(n-o);return e[0]=2*n*a,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=2*n*l,e[6]=0,e[7]=0,e[8]=(i+t)*a,e[9]=(s+r)*l,e[10]=(o+n)*u,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*n*2*u,e[15]=0,e}let m=function(e,t,i,r,s){let n=1/Math.tan(t/2);if(e[0]=n/i,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=n,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,null!=s&&s!==1/0){let t=1/(r-s);e[10]=(s+r)*t,e[14]=2*s*r*t}else e[10]=-1,e[14]=-2*r;return e},_=function(e,t,i,r,s,n,o){let a=1/(t-i),l=1/(r-s),u=1/(n-o);return e[0]=-2*a,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*l,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*u,e[11]=0,e[12]=(t+i)*a,e[13]=(s+r)*l,e[14]=(o+n)*u,e[15]=1,e};function v(e,t,i,s){let n,o,a,l,u,h,c,d,f,p,g=t[0],m=t[1],_=t[2],v=s[0],y=s[1],b=s[2],w=i[0],E=i[1],P=i[2];if(Math.abs(g-w)<r.p8&&Math.abs(m-E)<r.p8&&Math.abs(_-P)<r.p8)return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e;return n=1/Math.sqrt((d=g-w)*d+(f=m-E)*f+(p=_-P)*p),d*=n,f*=n,p*=n,(n=Math.sqrt((o=y*p-b*f)*o+(a=b*d-v*p)*a+(l=v*f-y*d)*l))?(o*=n=1/n,a*=n,l*=n):(o=0,a=0,l=0),(n=Math.sqrt((u=f*l-p*a)*u+(h=p*o-d*l)*h+(c=d*a-f*o)*c))?(u*=n=1/n,h*=n,c*=n):(u=0,h=0,c=0),e[0]=o,e[1]=u,e[2]=d,e[3]=0,e[4]=a,e[5]=h,e[6]=f,e[7]=0,e[8]=l,e[9]=c,e[10]=p,e[11]=0,e[12]=-(o*g+a*m+l*_),e[13]=-(u*g+h*m+c*_),e[14]=-(d*g+f*m+p*_),e[15]=1,e}},39808(e,t,i){let r;i.d(t,{Cc:()=>a,WQ:()=>n,Z0:()=>l,jb:()=>u,ze:()=>o});var s=i(61449);function n(e,t,i){return e[0]=t[0]+i[0],e[1]=t[1]+i[1],e}function o(e,t){return e[0]=-t[0],e[1]=-t[1],e}function a(e,t,i,r){let s=t[0],n=t[1];return e[0]=s+r*(i[0]-s),e[1]=n+r*(i[1]-n),e}function l(e,t,i){let r=t[0],s=t[1];return e[0]=i[0]*r+i[4]*s+i[12],e[1]=i[1]*r+i[5]*s+i[13],e}let u=function(e,t,i){return e[0]=t[0]-i[0],e[1]=t[1]-i[1],e};r=new s.tb(2),s.tb!=Float32Array&&(r[0]=0,r[1]=0)},29527(e,t,i){i.d(t,{$A:()=>u,Cc:()=>h,Il:()=>y,Om:()=>l,S8:()=>a,Z0:()=>c,Z8:()=>g,eL:()=>p,ei:()=>d,fA:()=>n,g7:()=>_,gL:()=>f,jb:()=>v,uE:()=>b,vt:()=>s,x6:()=>m,ze:()=>o});var r=i(61449);function s(){let e=new r.tb(3);return r.tb!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function n(e,t,i){let s=new r.tb(3);return s[0]=e,s[1]=t,s[2]=i,s}function o(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e}function a(e,t){let i=t[0],r=t[1],s=t[2],n=i*i+r*r+s*s;return n>0&&(n=1/Math.sqrt(n)),e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e}function l(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function u(e,t,i){let r=t[0],s=t[1],n=t[2],o=i[0],a=i[1],l=i[2];return e[0]=s*l-n*a,e[1]=n*o-r*l,e[2]=r*a-s*o,e}function h(e,t,i,r){let s=t[0],n=t[1],o=t[2];return e[0]=s+r*(i[0]-s),e[1]=n+r*(i[1]-n),e[2]=o+r*(i[2]-o),e}function c(e,t,i){let r=t[0],s=t[1],n=t[2],o=i[3]*r+i[7]*s+i[11]*n+i[15];return o=o||1,e[0]=(i[0]*r+i[4]*s+i[8]*n+i[12])/o,e[1]=(i[1]*r+i[5]*s+i[9]*n+i[13])/o,e[2]=(i[2]*r+i[6]*s+i[10]*n+i[14])/o,e}function d(e,t,i){let r=t[0],s=t[1],n=t[2];return e[0]=r*i[0]+s*i[3]+n*i[6],e[1]=r*i[1]+s*i[4]+n*i[7],e[2]=r*i[2]+s*i[5]+n*i[8],e}function f(e,t,i){let r=i[0],s=i[1],n=i[2],o=i[3],a=t[0],l=t[1],u=t[2],h=s*u-n*l,c=n*a-r*u,d=r*l-s*a,f=s*d-n*c,p=n*h-r*d,g=r*c-s*h,m=2*o;return h*=m,c*=m,d*=m,f*=2,p*=2,g*=2,e[0]=a+h+f,e[1]=l+c+p,e[2]=u+d+g,e}function p(e,t,i,r){let s=[],n=[];return s[0]=t[0]-i[0],s[1]=t[1]-i[1],s[2]=t[2]-i[2],n[0]=s[0],n[1]=s[1]*Math.cos(r)-s[2]*Math.sin(r),n[2]=s[1]*Math.sin(r)+s[2]*Math.cos(r),e[0]=n[0]+i[0],e[1]=n[1]+i[1],e[2]=n[2]+i[2],e}function g(e,t,i,r){let s=[],n=[];return s[0]=t[0]-i[0],s[1]=t[1]-i[1],s[2]=t[2]-i[2],n[0]=s[2]*Math.sin(r)+s[0]*Math.cos(r),n[1]=s[1],n[2]=s[2]*Math.cos(r)-s[0]*Math.sin(r),e[0]=n[0]+i[0],e[1]=n[1]+i[1],e[2]=n[2]+i[2],e}function m(e,t,i,r){let s=[],n=[];return s[0]=t[0]-i[0],s[1]=t[1]-i[1],s[2]=t[2]-i[2],n[0]=s[0]*Math.cos(r)-s[1]*Math.sin(r),n[1]=s[0]*Math.sin(r)+s[1]*Math.cos(r),n[2]=s[2],e[0]=n[0]+i[0],e[1]=n[1]+i[1],e[2]=n[2]+i[2],e}function _(e,t){let i=e[0],r=e[1],s=e[2],n=t[0],o=t[1],a=t[2],u=Math.sqrt((i*i+r*r+s*s)*(n*n+o*o+a*a));return Math.acos(Math.min(Math.max(u&&l(e,t)/u,-1),1))}let v=function(e,t,i){return e[0]=t[0]-i[0],e[1]=t[1]-i[1],e[2]=t[2]-i[2],e},y=function(e){let t=e[0],i=e[1],r=e[2];return Math.sqrt(t*t+i*i+r*r)},b=function(e){let t=e[0],i=e[1],r=e[2];return t*t+i*i+r*r};s()},70998(e,t,i){let r;i.d(t,{Bw:()=>c,C:()=>a,Cc:()=>g,Om:()=>p,S8:()=>f,WQ:()=>u,Z0:()=>m,fA:()=>o,gL:()=>_,hZ:()=>l,hs:()=>h,m3:()=>d,o8:()=>n,t2:()=>v});var s=i(61449);function n(e){let t=new s.tb(4);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t}function o(e,t,i,r){let n=new s.tb(4);return n[0]=e,n[1]=t,n[2]=i,n[3]=r,n}function a(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e}function l(e,t,i,r,s){return e[0]=t,e[1]=i,e[2]=r,e[3]=s,e}function u(e,t,i){return e[0]=t[0]+i[0],e[1]=t[1]+i[1],e[2]=t[2]+i[2],e[3]=t[3]+i[3],e}function h(e,t,i){return e[0]=t[0]*i,e[1]=t[1]*i,e[2]=t[2]*i,e[3]=t[3]*i,e}function c(e){let t=e[0],i=e[1],r=e[2],s=e[3];return Math.sqrt(t*t+i*i+r*r+s*s)}function d(e){let t=e[0],i=e[1],r=e[2],s=e[3];return t*t+i*i+r*r+s*s}function f(e,t){let i=t[0],r=t[1],s=t[2],n=t[3],o=i*i+r*r+s*s+n*n;return o>0&&(o=1/Math.sqrt(o)),e[0]=i*o,e[1]=r*o,e[2]=s*o,e[3]=n*o,e}function p(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]+e[3]*t[3]}function g(e,t,i,r){let s=t[0],n=t[1],o=t[2],a=t[3];return e[0]=s+r*(i[0]-s),e[1]=n+r*(i[1]-n),e[2]=o+r*(i[2]-o),e[3]=a+r*(i[3]-a),e}function m(e,t,i){let r=t[0],s=t[1],n=t[2],o=t[3];return e[0]=i[0]*r+i[4]*s+i[8]*n+i[12]*o,e[1]=i[1]*r+i[5]*s+i[9]*n+i[13]*o,e[2]=i[2]*r+i[6]*s+i[10]*n+i[14]*o,e[3]=i[3]*r+i[7]*s+i[11]*n+i[15]*o,e}function _(e,t,i){let r=t[0],s=t[1],n=t[2],o=i[0],a=i[1],l=i[2],u=i[3],h=u*r+a*n-l*s,c=u*s+l*r-o*n,d=u*n+o*s-a*r,f=-o*r-a*s-l*n;return e[0]=h*u+-(f*o)+-(c*l)- -(d*a),e[1]=c*u+-(f*a)+-(d*o)- -(h*l),e[2]=d*u+-(f*l)+-(h*a)- -(c*o),e[3]=t[3],e}function v(e,t){return e[0]===t[0]&&e[1]===t[1]&&e[2]===t[2]&&e[3]===t[3]}r=new s.tb(4),s.tb!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0,r[3]=0)},31609(e,t,i){i.d(t,{$W:()=>r,Cc:()=>function e(t,i,r){return n(t)?t.map((t,s)=>e(t,i[s],r)):r*i+(1-r)*t},Fl:()=>s,aI:()=>function e(t,i,s){let o=r.EPSILON;s&&(r.EPSILON=s);try{if(t===i)return!0;if(n(t)&&n(i)){if(t.length!==i.length)return!1;for(let r=0;r<t.length;++r)if(!e(t[r],i[r]))return!1;return!0}if(t&&t.equals)return t.equals(i);if(i&&i.equals)return i.equals(t);if("number"==typeof t&&"number"==typeof i)return Math.abs(t-i)<=r.EPSILON*Math.max(1,Math.abs(t),Math.abs(i));return!1}finally{r.EPSILON=o}},cy:()=>n,qE:()=>o}),globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}};let r=globalThis.mathgl.config;function s(e,{precision:t=r.precision}={}){return e=Math.round(e/r.EPSILON)*r.EPSILON,`${parseFloat(e.toPrecision(t))}`}function n(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function o(e,t,i){return function(e,t,i){if(n(e)){i=i||(e.clone?e.clone():Array(e.length));for(let r=0;r<i.length&&r<e.length;++r){let s="number"==typeof e?e:e[r];i[r]=t(s,r,i)}return i}return t(e)}(e,e=>Math.max(t,Math.min(i,e)))}},76909(e,t,i){function r(e,t,i){let r=t[0],s=t[1],n=i[3]*r+i[7]*s||1;return e[0]=(i[0]*r+i[4]*s)/n,e[1]=(i[1]*r+i[5]*s)/n,e}function s(e,t,i){let r=t[0],s=t[1],n=t[2],o=i[3]*r+i[7]*s+i[11]*n||1;return e[0]=(i[0]*r+i[4]*s+i[8]*n)/o,e[1]=(i[1]*r+i[5]*s+i[9]*n)/o,e[2]=(i[2]*r+i[6]*s+i[10]*n)/o,e}function n(e,t,i){let r=t[0],s=t[1];return e[0]=i[0]*r+i[2]*s,e[1]=i[1]*r+i[3]*s,e[2]=t[2],e}function o(e,t,i){let r=t[0],s=t[1];return e[0]=i[0]*r+i[2]*s,e[1]=i[1]*r+i[3]*s,e[2]=t[2],e[3]=t[3],e}function a(e,t,i){let r=t[0],s=t[1],n=t[2];return e[0]=i[0]*r+i[3]*s+i[6]*n,e[1]=i[1]*r+i[4]*s+i[7]*n,e[2]=i[2]*r+i[5]*s+i[8]*n,e[3]=t[3],e}i.d(t,{B$:()=>r,Cg:()=>o,J4:()=>n,cL:()=>s,vE:()=>a})},89607(e,t,i){i.d(t,{qk:()=>n,ws:()=>s});var r=i(31609);function s(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function n(e,t,i=""){if(r.$W.debug&&!function(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}(e,t))throw Error(`math.gl: ${i} some fields set to invalid numbers'`);return e}},54677(e,t,i){i.d(t,{v:()=>r});function r(e,t){if(!e)throw Error(t||"@math.gl/web-mercator: assertion failed.")}},6597(e,t,i){i.d(t,{$M:()=>s,_U:()=>n,p6:()=>a,qE:()=>o});var r=i(70998);function s(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function n(e,t){let i=r.Z0([],t,e);return r.hs(i,i,1/i[3]),i}function o(e,t,i){return e<t?t:e>i?i:e}let a=Math.log2||function(e){return Math.log(e)*Math.LOG2E}},78883(e,t,i){i.d(t,{Gw:()=>f,Os:()=>w,VJ:()=>P,aH:()=>d,dT:()=>v,fO:()=>g,iV:()=>p,mY:()=>m,nI:()=>_,om:()=>b,rY:()=>y,wZ:()=>E,xJ:()=>x});var r=i(6597),s=i(36526),n=i(29527),o=i(39808),a=i(54677);let l=Math.PI,u=l/4,h=l/180,c=180/l,d=85.051129;function f(e){let[t,i]=e;(0,a.v)(Number.isFinite(t)),(0,a.v)(Number.isFinite(i)&&i>=-90&&i<=90,"invalid latitude");let r=512*(l+Math.log(Math.tan(u+i*h*.5)))/(2*l);return[512*(t*h+l)/(2*l),r]}function p(e){let[t,i]=e,r=2*(Math.atan(Math.exp(i/512*(2*l)-l))-u);return[(t/512*(2*l)-l)*c,r*c]}function g(e){var t;let{latitude:i}=e;return(0,a.v)(Number.isFinite(i)),t=4003e4*Math.cos(i*h),(0,r.p6)(t)-9}function m(e){return 512/4003e4/Math.cos(e*h)}function _(e){let{latitude:t,longitude:i,highPrecision:r=!1}=e;(0,a.v)(Number.isFinite(t)&&Number.isFinite(i));let s=Math.cos(t*h),n=512/360/s,o=512/4003e4/s,l={unitsPerMeter:[o,o,o],metersPerUnit:[1/o,1/o,1/o],unitsPerDegree:[512/360,n,o],degreesPerUnit:[1/(512/360),1/n,1/o]};if(r){let e=h*Math.tan(t*h)/s,i=512/4003e4*e,r=i/n*o;l.unitsPerDegree2=[0,512/360*e/2,i],l.unitsPerMeter2=[r,0,r]}return l}function v(e,t){let[i,r,s]=e,[n,o,a]=t,{unitsPerMeter:l,unitsPerMeter2:u}=_({longitude:i,latitude:r,highPrecision:!0}),h=f(e);h[0]+=n*(l[0]+u[0]*o),h[1]+=o*(l[1]+u[1]*o);let c=p(h);return Number.isFinite(s)||Number.isFinite(a)?[c[0],c[1],(s||0)+(a||0)]:c}function y(e){let{height:t,pitch:i,bearing:o,altitude:a,scale:l,center:u}=e,c=(0,r.$M)();s.Tl(c,c,[0,0,-a]),s.eL(c,c,-i*h),s.Qr(c,c,o*h);let d=l/t;return s.hs(c,c,[d,d,d]),u&&s.Tl(c,c,n.ze([],u)),c}function b(e){let{width:t,height:i,altitude:s,pitch:n=0,offset:o,center:a,scale:l,nearZMultiplier:u=1,farZMultiplier:c=1}=e,{fovy:d=w(1.5)}=e;void 0!==s&&(d=w(s));let f=d*h,p=n*h,g=E(d),m=g;a&&(m+=a[2]*l/Math.cos(p)/i);let _=f*(.5+(o?o[1]:0)/i),v=Math.sin(_)*m/Math.sin((0,r.qE)(Math.PI/2-p-_,.01,Math.PI-.01));return{fov:f,aspect:t/i,focalDistance:g,near:u,far:Math.min((Math.sin(p)*v+m)*c,10*m)}}function w(e){return 2*Math.atan(.5/e)*c}function E(e){return .5/Math.tan(.5*e*h)}function P(e,t){let[i,s,n=0]=e;return(0,a.v)(Number.isFinite(i)&&Number.isFinite(s)&&Number.isFinite(n)),(0,r._U)(t,[i,s,n,1])}function x(e,t,i=0){let[s,n,l]=e;if((0,a.v)(Number.isFinite(s)&&Number.isFinite(n),"invalid pixel coordinate"),Number.isFinite(l))return(0,r._U)(t,[s,n,l,1]);let u=(0,r._U)(t,[s,n,0,1]),h=(0,r._U)(t,[s,n,1,1]),c=u[2],d=h[2];return o.Cc([],u,h,c===d?0:((i||0)-c)/(d-c))}},37920(e,t,i){i.d(t,{l:()=>h});var r=i(40936);async function*s(e,t){let i=t?.chunkSize||1048576,r=0;for(;r<e.size;){let t=r+i,s=await e.slice(r,t).arrayBuffer();r=t,yield s}}var n=i(50043);function o(e,t){return n.Bd?a(e,t):l(e,t)}async function*a(e,t){let i,s=e.getReader();try{for(;;){let e=i||s.read();t?._streamReadAhead&&(i=s.read());let{done:n,value:o}=await e;if(n)return;yield(0,r.XA)(o)}}catch(e){s.releaseLock()}}async function*l(e,t){for await(let t of e)yield(0,r.XA)(t)}var u=i(9264);function h(e,t){if("string"==typeof e)return function*(e,t){let i=t?.chunkSize||262144,s=0,n=new TextEncoder;for(;s<e.length;){let t=Math.min(e.length-s,i),o=e.slice(s,s+t);s+=t,yield(0,r.W$)(n.encode(o))}}(e,t);if(e instanceof ArrayBuffer)return function*(e,t={}){let{chunkSize:i=262144}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,i),s=new ArrayBuffer(t),n=new Uint8Array(e,r,t);new Uint8Array(s).set(n),r+=t,yield s}}(e,t);if((0,u.qf)(e))return s(e,t);if((0,u.H1)(e))return o(e,t);if((0,u.Sv)(e)){let i=e.body;if(!i)throw Error("Readable stream not available on Response");return o(i,t)}throw Error("makeIterator")}},327(e,t,i){i.d(t,{H:()=>l});var r=i(9264),s=i(90405),n=i(73968),o=i(62301),a=i(35768);async function l(e,t,i,l){let u,h;Array.isArray(t)||(0,s.l)(t)?(u=t,h=i):(u=[],h=t);let c=(0,n.z)(h),d=e;if("string"==typeof e&&(d=await c(e)),(0,r.qf)(e)&&(d=await c(e)),"string"==typeof e){let t=(0,o.Rf)(h||{});t.core?.baseUrl||(h={...h,core:{...h?.core,baseUrl:e}})}return Array.isArray(u),await (0,a.q)(d,u,h)}},35768(e,t,i){i.d(t,{q:()=>_});var r=i(9264),s=i(28881),n=i(38503),o=i(77146);async function a(e,t,i,r,n){let a=e.id,u=(0,o.q)(e,i),h=s.A.getWorkerFarm(i?.core).getWorkerPool({name:a,url:u});(i=JSON.parse(JSON.stringify(i||{})))._workerLoaderId=e.id,r=JSON.parse(JSON.stringify(r||{}));let c=await h.startJob("process-on-worker",l.bind(null,n));c.postMessage("process",{input:t,options:i,context:r});let d=await c.result;return await d.result}async function l(e,t,i,r){switch(i){case"done":t.done(r);break;case"error":t.error(Error(r.error));break;case"process":let{id:s,input:n,options:o}=r;try{let i=await e(n,o);t.postMessage("done",{id:s,result:i})}catch(i){let e=i instanceof Error?i.message:"unknown error";t.postMessage("error",{id:s,error:e})}break;default:console.warn(`parse-with-worker unknown message ${i}`)}}var u=i(5993),h=i(55607),c=i(90405),d=i(62301),f=i(1035),p=i(32429),g=i(72548),m=i(40002);async function _(e,t,i,r){!t||Array.isArray(t)||(0,c.l)(t)||(r=void 0,i=t,t=void 0),e=await e,i=i||{};let s=(0,g.Al)(e),n=t,o=(0,p.i)(n,r),a=await (0,m.M)(e,o,i);if(!a)return null;let l=(0,d.a5)(i,a,o,s);return r=(0,p.l)({url:s,_parse:_,loaders:o},l,r||null),await v(a,e,l,r)}async function v(e,t,i,o){if(!function(e,t=h.x){(0,u.v)(e,"no worker provided");e.version}(e),i=function e(t,i,r=0){if(r>3)return i;let s={...t};for(let[t,n]of Object.entries(i))n&&"object"==typeof n&&!Array.isArray(n)?s[t]=e(s[t]||{},i[t],r+1):s[t]=i[t];return s}(e.options||{},i),(0,r.Sv)(t)){let{ok:e,redirected:i,status:r,statusText:s,type:n,url:a}=t;o.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:i,status:r,statusText:s,type:n,url:a}}if(t=await (0,f.O1)(t,e,i),e.parseTextSync&&"string"==typeof t)return e.parseTextSync(t,i,o);if(function(e,t){if(!s.A.isSupported())return!1;let i=t?._nodeWorkers??t?.core?._nodeWorkers;if(!n.Bd&&!i)return!1;let r=t?.worker??t?.core?.worker;return!!(e.worker&&r)}(e,i))return await a(e,t,i,o,_);if(e.parseText&&"string"==typeof t)return await e.parseText(t,i,o);if(e.parse)return await e.parse(t,i,o);throw(0,u.v)(!e.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}},5223(e,t,i){i.d(t,{Ph:()=>a,mk:()=>o,wx:()=>l});var r=i(90405),s=i(62301);let n=()=>{let e=(0,s.K2)();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function o(e){let t=n();for(let i of e=Array.isArray(e)?e:[e]){let e=(0,r.D)(i);t.find(t=>e===t)||t.unshift(e)}}function a(){return n()}function l(){(0,s.K2)().loaderRegistry=[]}},40002(e,t,i){let r;i.d(t,{M:()=>y,p:()=>w});var s=i(9264),n=i(19727);let o="4.5.2",a=o[0]>="0"&&o[0]<="9"?`v${o}`:"",l=(r=new n.h({id:"loaders.gl"}),globalThis.loaders||={},globalThis.loaders.log=r,globalThis.loaders.version=a,globalThis.probe||={},globalThis.probe.loaders=r,r);var u=i(11108),h=i(21755),c=i(40936),d=i(90405),f=i(62301),p=i(72548),g=i(42221),m=i(5223),_=i(28071);let v=/\.([^.]+)$/;async function y(e,t=[],i,r){if(!E(e))return null;let n=(0,f.Rf)(i||{});if(n.core||={},e instanceof Response&&b(e)){let i=w(await e.clone().text(),t,{...n,core:{...n.core,nothrow:!0}},r);if(i)return i}let o=w(e,t,{...n,core:{...n.core,nothrow:!0}},r);if(o)return o;if((0,s.qf)(e)&&(o=w(e=await e.slice(0,10).arrayBuffer(),t,n,r)),!o&&e instanceof Response&&b(e)&&(o=w(await e.clone().text(),t,n,r)),!o&&!n.core.nothrow)throw Error(P(e));return o}function b(e){let t=(0,p.z4)(e);return!!(t&&(t.startsWith("text/")||"application/json"===t||t.endsWith("+json")))}function w(e,t=[],i,r){var s,n,o,a,u,h;let c,g,y,b,A,C,T;if(!E(e))return null;let k=(0,f.Rf)(i||{});if(k.core||={},t&&!Array.isArray(t))return(0,d.D)(t);let L=[];t&&(L=L.concat(t)),k.core.ignoreRegisteredLoaders||L.push(...(0,m.Ph)()),function(e){for(let t of e)(0,d.D)(t)}(L);let I=(s=e,n=L,o=k,a=r,c=(0,p.Al)(s),g=(0,p.z4)(s),y=(0,_.S3)(c)||a?.url,b=null,A="",o?.core?.mimeType&&(b=x(n,o?.core?.mimeType),A=`match forced by supplied MIME type ${o?.core?.mimeType}`),b=b||(u=n,(T=(C=(h=y)&&v.exec(h))&&C[1])?function(e,t){for(let i of(t=t.toLowerCase(),e))for(let e of i.extensions)if(e.toLowerCase()===t)return i;return null}(u,T):null),A=A||(b?`matched url ${y}`:""),b=b||x(n,g),A=A||(b?`matched MIME type ${g}`:""),b=b||function(e,t){if(!t)return null;for(let i of e)if("string"==typeof t){if(function(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}(t,i))return i}else if(ArrayBuffer.isView(t)){if(S(t.buffer,t.byteOffset,i))return i}else if(t instanceof ArrayBuffer&&S(t,0,i))return i;return null}(n,s),A=A||(b?`matched initial data ${M(s)}`:""),o?.core?.fallbackMimeType&&(b=b||x(n,o?.core?.fallbackMimeType),A=A||(b?`matched fallback MIME type ${g}`:"")),A&&l.log(1,`selectLoader selected ${b?.name}: ${A}.`),b);if(!I&&!k.core.nothrow)throw Error(P(e));return I}function E(e){return!(e instanceof Response)||204!==e.status}function P(e){let t=(0,p.Al)(e),i=(0,p.z4)(e),r="No valid loader found (";r+=(t?`${u.iW(t)}, `:"no url provided, ")+`MIME type: ${i?`"${i}"`:"not provided"}, `;let s=e?M(e):"";return r+((s?` first bytes: "${s}"`:"first bytes: not available")+")")}function x(e,t){for(let i of e)if(i.mimeTypes?.some(e=>(0,g.JQ)(t,e))||(0,g.JQ)(t,`application/x.${i.id}`))return i;return null}function S(e,t,i){return(Array.isArray(i.tests)?i.tests:[i.tests]).some(i=>(function(e,t,i){if((0,s.B1)(i))return(0,h.YV)(i,e,i.byteLength);switch(typeof i){case"function":return i((0,c.W$)(e));case"string":let r=A(e,t,i.length);return i===r;default:return!1}})(e,t,i))}function M(e,t=5){return"string"==typeof e?e.slice(0,t):ArrayBuffer.isView(e)?A(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?A(e,0,t):""}function A(e,t,i){if(e.byteLength<t+i)return"";let r=new DataView(e),s="";for(let e=0;e<i;e++)s+=String.fromCharCode(r.getUint8(t+e));return s}},41708(e,t,i){i.d(t,{f:()=>r});class r extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response}},76522(e,t,i){i.d(t,{t2:()=>n});var r=i(16656),s=i(46555);async function n(e,t){if("string"==typeof e){var i;let s=(0,r.o1)(e);return!((i=s).startsWith("http:")||i.startsWith("https:"))&&!s.startsWith("data:")&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(s,t):await fetch(s,t)}return await (0,s.wv)(e)}},1035(e,t,i){i.d(t,{O1:()=>h,lG:()=>u,re:()=>c});var r=i(40936),s=i(9264),n=i(39621),o=i(37920),a=i(46555);let l="Cannot convert supplied data type";function u(e,t,i){if(t.text&&"string"==typeof e)return e;if((0,r.Pe)(e)&&(e=e.buffer),(0,s.B1)(e)){let i=(0,r.Q_)(e);return t.text&&!t.binary?new TextDecoder("utf8").decode(i):(0,r.XA)(i)}throw Error(l)}async function h(e,t,i){if("string"==typeof e||(0,s.B1)(e))return u(e,t,i);if((0,s.qf)(e)&&(e=await (0,a.wv)(e)),(0,s.Sv)(e))return await (0,a.Mz)(e),t.binary?await e.arrayBuffer():await e.text();if((0,s.H1)(e)&&(e=(0,o.l)(e,i)),(0,s.xZ)(e)||(0,s.Td)(e))return(0,n.cy)(e);throw Error(l)}async function c(e,t){if((0,s.yL)(e)&&(e=await e),(0,s.Vv)(e))return e;if((0,s.Sv)(e)){await (0,a.Mz)(e);let i=await e.body;if(!i)throw Error(l);return(0,o.l)(i,t)}return(0,s.qf)(e)||(0,s.H1)(e)?(0,o.l)(e,t):(0,s.Td)(e)||(0,s.xZ)(e)?e:function(e){if(ArrayBuffer.isView(e)||(0,s.B1)(e))return function*(){yield(0,r.XA)(e)}();if((0,s.Vv)(e))return e;if((0,s.xZ)(e))return e[Symbol.iterator]();throw Error(l)}(e)}},73968(e,t,i){i.d(t,{z:()=>o});var r=i(9264),s=i(76522),n=i(62301);function o(e,t){let i=(0,n.pp)(),o=e||i,a=o.fetch??o.core?.fetch;return"function"==typeof a?a:(0,r.Gv)(a)?e=>(0,s.t2)(e,a):t?.fetch?t?.fetch:s.t2}},32429(e,t,i){i.d(t,{i:()=>a,l:()=>o});var r=i(73968),s=i(28071),n=i(11108);function o(e,t,i){if(i)return i;let o={fetch:(0,r.z)(t,e),...e};if(o.url){let e=(0,s.S3)(o.url);o.baseUrl=e,o.queryString=(0,s.by)(o.url),o.filename=n.iW(e),o.baseUrl=n.pD(e)}return Array.isArray(o.loaders)||(o.loaders=null),o}function a(e,t){let i;if(e&&!Array.isArray(e))return e;if(e&&(i=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];i=i?[...i,...e]:e}return i&&i.length?i:void 0}},90405(e,t,i){i.d(t,{D:()=>n,l:()=>s});var r=i(89733);function s(e){return!!e&&(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions))}function n(e){let t;return(0,r.v)(e,"null loader"),(0,r.v)(s(e),"invalid loader"),Array.isArray(e)&&(t=e[1],e={...e=e[0],options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}},62301(e,t,i){i.d(t,{a5:()=>g,Rf:()=>m,K2:()=>d,ih:()=>p,pp:()=>f});var r=i(9264),s=i(11108);let n=new(i(19727)).h({id:"loaders.gl"});class o{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}}var a=i(50043);let l={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:"https://unpkg.com/@loaders.gl",worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:a.Bd,_nodeWorkers:!1,_workerType:"",limit:0,_limitMB:0,batchSize:"auto",batchDebounceMs:0,metadata:!1,transforms:[]}},u={baseUri:"core.baseUrl",fetch:"core.fetch",mimeType:"core.mimeType",fallbackMimeType:"core.fallbackMimeType",ignoreRegisteredLoaders:"core.ignoreRegisteredLoaders",nothrow:"core.nothrow",log:"core.log",useLocalLibraries:"core.useLocalLibraries",CDN:"core.CDN",worker:"core.worker",maxConcurrency:"core.maxConcurrency",maxMobileConcurrency:"core.maxMobileConcurrency",reuseWorkers:"core.reuseWorkers",_nodeWorkers:"core.nodeWorkers",_workerType:"core._workerType",_worker:"core._workerType",limit:"core.limit",_limitMB:"core._limitMB",batchSize:"core.batchSize",batchDebounceMs:"core.batchDebounceMs",metadata:"core.metadata",transforms:"core.transforms",throws:"nothrow",dataType:"(no longer used)",uri:"core.baseUrl",method:"core.fetch.method",headers:"core.fetch.headers",body:"core.fetch.body",mode:"core.fetch.mode",credentials:"core.fetch.credentials",cache:"core.fetch.cache",redirect:"core.fetch.redirect",referrer:"core.fetch.referrer",referrerPolicy:"core.fetch.referrerPolicy",integrity:"core.fetch.integrity",keepalive:"core.fetch.keepalive",signal:"core.fetch.signal"};var h=i(28071);let c=["baseUrl","fetch","mimeType","fallbackMimeType","ignoreRegisteredLoaders","nothrow","log","useLocalLibraries","CDN","worker","maxConcurrency","maxMobileConcurrency","reuseWorkers","_nodeWorkers","_workerType","limit","_limitMB","batchSize","batchDebounceMs","metadata","transforms"];function d(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||(e._state={}),e._state}function f(){let e=d();return e.globalOptions=e.globalOptions||{...l,core:{...l.core}},m(e.globalOptions)}function p(e){var t;d().globalOptions=v(f(),e),t=e.modules,globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,t)}function g(e,t,i,r){return function(e,t){for(let i of(_(e,null,l,u,t),t)){let r=e&&e[i.id]||{},s=i.options&&i.options[i.id]||{},n=i.deprecatedOptions&&i.deprecatedOptions[i.id]||{};_(r,i.id,s,n,t)}}(e,i=Array.isArray(i=i||[])?i:[i]),m(v(t,e,r))}function m(e){var t;let i,r=(i={...t=e},t.core&&(i.core={...t.core}),i);for(let e of(b(r),c))r.core&&void 0!==r.core[e]&&delete r[e];return r.core&&void 0!==r.core._workerType&&delete r._worker,r}function _(e,t,i,s,o){let a=t||"Top level",l=t?`${t}.`:"";for(let u in e){let h=!t&&(0,r.Gv)(e[u]),c="baseUri"===u&&!t,d="workerUrl"===u&&t;if(!(u in i)&&!c&&!d){if(u in s)n.level>0&&n.warn(`${a} loader option '${l}${u}' no longer supported, use '${s[u]}'`)();else if(!h&&n.level>0){let e=function(e,t){let i=e.toLowerCase(),r="";for(let s of t)for(let t in s.options){if(e===t)return`Did you mean '${s.id}.${t}'?`;let n=t.toLowerCase();(i.startsWith(n)||n.startsWith(i))&&(r=r||`Did you mean '${s.id}.${t}'?`)}return r}(u,o);n.warn(`${a} loader option '${l}${u}' not recognized. ${e}`)()}}}}function v(e,t,i){var r,n;let a=e.options||{},l={...a};return a.core&&(l.core={...a.core}),b(l),l.core?.log===null&&(l.core={...l.core,log:new o}),y(l,m(f())),y(l,m(t)),r=l,(n=i)&&r.core?.baseUrl===void 0&&(r.core||={},r.core.baseUrl=s.pD((0,h.S3)(n))),function(e){let t=e.core;if(t)for(let i of c)void 0!==t[i]&&(e[i]=t[i])}(l),l}function y(e,t){for(let i in t)if(i in t){let s=t[i];(0,r.aC)(s)&&(0,r.aC)(e[i])?e[i]={...e[i],...t[i]}:e[i]=t[i]}}function b(e){for(let t of(void 0!==e.baseUri&&(e.core||={},void 0===e.core.baseUrl&&(e.core.baseUrl=e.baseUri)),c))if(void 0!==e[t]){let i=e.core=e.core||{};void 0===i[t]&&(i[t]=e[t])}let t=e._worker;void 0!==t&&(e.core||={},void 0===e.core._workerType&&(e.core._workerType=t))}},42221(e,t,i){i.d(t,{JQ:()=>n,OA:()=>o,d_:()=>a});let r=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,s=/^([-\w.]+\/[-\w.+]+)/;function n(e,t){return e.toLowerCase()===t.toLowerCase()}function o(e){let t=s.exec(e);return t?t[1]:e}function a(e){let t=r.exec(e);return t?t[1]:""}},72548(e,t,i){i.d(t,{Al:()=>o,_E:()=>l,z4:()=>a});var r=i(9264),s=i(42221),n=i(28071);function o(e){return(0,r.Sv)(e)?e.url:(0,r.qf)(e)?("name"in e?e.name:"")||"":"string"==typeof e?e:""}function a(e){if((0,r.Sv)(e)){let t=e.headers.get("content-type")||"",i=(0,n.S3)(e.url);return(0,s.OA)(t)||(0,s.d_)(i)}return(0,r.qf)(e)?e.type||"":"string"==typeof e?(0,s.d_)(e):""}function l(e){return(0,r.Sv)(e)?e.headers["content-length"]||-1:(0,r.qf)(e)?e.size:"string"==typeof e?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}},46555(e,t,i){i.d(t,{Mz:()=>l,wv:()=>a});var r=i(9264),s=i(41708),n=i(72548),o=i(28071);async function a(e){if((0,r.Sv)(e))return e;let t={},i=(0,n._E)(e);i>=0&&(t["content-length"]=String(i));let s=(0,n.Al)(e),o=(0,n.z4)(e);o&&(t["content-type"]=o);let a=await h(e);a&&(t["x-first-bytes"]=a),"string"==typeof e&&(e=new TextEncoder().encode(e));let l=new Response(e,{headers:t});return Object.defineProperty(l,"url",{value:s}),l}async function l(e){if(!e.ok)throw await u(e)}async function u(e){let t=(0,o.E1)(e.url),i=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;i=i.length>100?`${i.slice(0,100)}...`:i;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get("Content-Type");r.reason=!e.bodyUsed&&t?.includes("application/json")?await e.json():await e.text()}catch(e){}return new s.f(i,r)}async function h(e){if("string"==typeof e)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let i=new FileReader;i.onload=t=>e(t?.target?.result),i.readAsDataURL(t)})}if(e instanceof ArrayBuffer){let t=function(e){let t="",i=new Uint8Array(e);for(let e=0;e<i.byteLength;e++)t+=String.fromCharCode(i[e]);return btoa(t)}(e.slice(0,5));return`data:base64,${t}`}return null}},28071(e,t,i){i.d(t,{E1:()=>o,S3:()=>n,by:()=>s});let r=/\?.*/;function s(e){let t=e.match(r);return t&&t[0]}function n(e){return e.replace(r,"")}function o(e){if(e.length<50)return e;let t=e.slice(e.length-15),i=e.substr(0,32);return`${i}...${t}`}},21755(e,t,i){function r(e,t,i){if(i=i||e.byteLength,e.byteLength<i||t.byteLength<i)return!1;let r=new Uint8Array(e),s=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==s[e])return!1;return!0}function s(...e){var t=e;let i=t.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),r=new Uint8Array(i.reduce((e,t)=>e+t.byteLength,0)),n=0;for(let e of i)r.set(e,n),n+=e.byteLength;return r.buffer}i.d(t,{AQ:()=>s,YV:()=>r})},40936(e,t,i){i.d(t,{XA:()=>n,Q_:()=>l,Pe:()=>s,W$:()=>o});var r=i(9264);function s(e){return e&&"object"==typeof e&&e.isBuffer}function n(e){if(s(e)||e instanceof ArrayBuffer)return e;if((0,r.L8)(e))return a(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return 0===e.byteOffset&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if("string"==typeof e)return new TextEncoder().encode(e).buffer;if(e&&"object"==typeof e&&e._toArrayBuffer)return e._toArrayBuffer();throw Error("toArrayBuffer")}function o(e){if(e instanceof ArrayBuffer)return e;if((0,r.L8)(e))return a(e);let{buffer:t,byteOffset:i,byteLength:s}=e;return t instanceof ArrayBuffer&&0===i&&s===t.byteLength?t:a(t,i,s)}function a(e,t=0,i=e.byteLength-t){let r=new Uint8Array(e,t,i),s=new Uint8Array(r.length);return s.set(r),s.buffer}function l(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}},89733(e,t,i){i.d(t,{v:()=>r});function r(e,t){if(!e)throw Error(t||"loader assertion failed.")}},50043(e,t,i){i.d(t,{Al:()=>a,Bd:()=>l,Sf:()=>o,bg:()=>s,x:()=>n,xD:()=>u});let r={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document},s=r.self||r.window||r.global||{},n=r.window||r.self||r.global||{},o=r.global||r.self||r.window||{},a=r.document||{},l=!!("object"!=typeof process||"[object process]"!==String(process)||process.browser),u="function"==typeof importScripts,h="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);h&&parseFloat(h[1])},39621(e,t,i){i.d(t,{cy:()=>n,jJ:()=>s});var r=i(21755);async function s(e,t){var i,r;let s="function"==typeof(i=e)[Symbol.asyncIterator]?i[Symbol.asyncIterator]():"function"==typeof i[Symbol.iterator]?(r=i[Symbol.iterator](),{next:e=>Promise.resolve(r.next(e)),return:e=>"function"==typeof r.return?Promise.resolve(r.return(e)):Promise.resolve({done:!0,value:e}),throw:e=>"function"==typeof r.throw?Promise.resolve(r.throw(e)):Promise.reject(e)}):i;for(;;){let{done:e,value:i}=await s.next();if(e){s.return&&s.return();return}if(t(i))return}}async function n(e){let t=[];for await(let i of e)t.push(function(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:i,byteLength:r}=e;return o(t,i,r)}return o(e)}(i));return(0,r.AQ)(...t)}function o(e,t=0,i=e.byteLength-t){let r=new Uint8Array(e,t,i),s=new Uint8Array(r.length);return s.set(r),s.buffer}},9264(e,t,i){i.d(t,{B1:()=>o,Gv:()=>r,H1:()=>f,L8:()=>n,PJ:()=>p,Sv:()=>c,Td:()=>u,Vv:()=>h,aC:()=>s,qf:()=>d,xZ:()=>l,yL:()=>a});let r=e=>null!==e&&"object"==typeof e,s=e=>r(e)&&e.constructor===({}).constructor,n=e=>"u">typeof SharedArrayBuffer&&e instanceof SharedArrayBuffer,o=e=>r(e)&&"number"==typeof e.byteLength&&"function"==typeof e.slice,a=e=>r(e)&&"then"in e&&"function"==typeof e.then,l=e=>!!e&&"function"==typeof e[Symbol.iterator],u=e=>!!e&&"function"==typeof e[Symbol.asyncIterator],h=e=>!!e&&"function"==typeof e.next,c=e=>"u">typeof Response&&e instanceof Response||r(e)&&"function"==typeof e.arrayBuffer&&"function"==typeof e.text&&"function"==typeof e.json,d=e=>"u">typeof Blob&&e instanceof Blob,f=e=>{let t,i;return t=e,"u">typeof ReadableStream&&t instanceof ReadableStream||r(t)&&"function"==typeof t.tee&&"function"==typeof t.cancel&&"function"==typeof t.getReader||r(i=e)&&"function"==typeof i.read&&"function"==typeof i.pipe&&"boolean"==typeof i.readable},p=e=>{let t,i;return r(t=e)&&"function"==typeof t.abort&&"function"==typeof t.getWriter||r(i=e)&&"function"==typeof i.end&&"function"==typeof i.write&&"boolean"==typeof i.writable}},16656(e,t,i){i.d(t,{Qj:()=>n,o1:()=>a,yc:()=>o});let r="",s={};function n(e){r=e}function o(){return r}function a(e){for(let t in s)if(e.startsWith(t)){let i=s[t];e=e.replace(t,i)}return e.startsWith("http://")||e.startsWith("https://")||(e=`${r}${e}`),e}},11108(e,t,i){function r(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(t+1):e}function s(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(0,t):""}i.d(t,{iW:()=>r,pD:()=>s})},5993(e,t,i){i.d(t,{v:()=>r});function r(e,t){if(!e)throw Error(t||"loaders.gl assertion failed.")}},38503(e,t,i){i.d(t,{Bd:()=>s,Fr:()=>n});let r={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};r.self||r.window||r.global,r.window||r.self||r.global,r.global||r.self||r.window,r.document;let s="object"!=typeof process||"[object process]"!==String(process)||process.browser,n="u">typeof window&&void 0!==window.orientation,o="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);o&&parseFloat(o[1])},55607(e,t,i){i.d(t,{x:()=>r});let r=(globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version="4.5.2"),globalThis._loadersgl_.version)},77146(e,t,i){i.d(t,{G:()=>o,q:()=>a});var r=i(5993),s=i(38503),n=i(55607);function o(e){let t=e.version!==n.x?` (worker-utils@${n.x})`:"";return`${e.name}@${e.version}${t}`}function a(e,t={}){let i=t[e.id]||{},n=s.Bd?e.workerFile||`${e.id}-worker.js`:`${e.id}-worker-node.js`,o=i.workerUrl;if(o||"compression"!==e.id||(o=t.workerUrl),"test"===(t._workerType||t?.core?._workerType)&&(o=s.Bd?`modules/${e.module}/dist/${n}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!o){let t=e.version;"latest"===t&&(t="latest");let i=t?`@${t}`:"";o=`https://unpkg.com/@loaders.gl/${e.module}${i}/dist/${n}`}return(0,r.v)(o),o}},28881(e,t,i){i.d(t,{A:()=>p});var r=i(38503);class s{terminate(){}}var n=i(5993);let o=new Map;function a(e){let t=new Blob([e],{type:"application/javascript"});return URL.createObjectURL(t)}var l=i(14797);let u=()=>{};class h{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL="";static isSupported(){return"u">typeof Worker&&r.Bd||!r.Bd}constructor(e){let{name:t,source:i,url:s}=e;(0,n.v)(i||s),this.name=t,this.source=i,this.url=s,this.onMessage=u,this.onError=e=>console.log(e),this.worker=r.Bd?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=u,this.onError=u,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t=t||(0,l.Y)(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t="Failed to load ";return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){var e,t,i;let r;this._loadableURL=(e={source:this.source,url:this.url},(0,n.v)(e.source&&!e.url||!e.source&&e.url),(r=o.get(e.source||e.url))||(e.url&&(r=(t=e.url).startsWith("http")?a((i=t,`\
try {
  importScripts('${i}');
} catch (error) {
  console.error(error);
  throw error;
}`)):t,o.set(e.url,r)),e.source&&(r=a(e.source),o.set(e.source,r))),(0,n.v)(r),r);let s=new Worker(this._loadableURL,{name:this.name});return s.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error("No data received"))},s.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},s.onmessageerror=e=>console.error(e),s}_createNodeWorker(){let e;if(this.url)e=new s(this.url.includes(":/")||this.url.startsWith("/")?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(".ts")||this.url.endsWith(".mjs")?"module":"commonjs"});else if(this.source)e=new s(this.source,{eval:!0});else throw Error("no worker");return e.on("message",e=>{this.onMessage(e)}),e.on("error",e=>{this.onError(e)}),e.on("exit",e=>{}),e}}class c{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:"loaders.gl",type:e,payload:t})}done(e){(0,n.v)(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){(0,n.v)(this.isRunning),this.isRunning=!1,this._reject(e)}}class d{name="unnamed";source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return h.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},void 0!==e.name&&(this.name=e.name),void 0!==e.maxConcurrency&&(this.maxConcurrency=e.maxConcurrency),void 0!==e.maxMobileConcurrency&&(this.maxMobileConcurrency=e.maxMobileConcurrency),void 0!==e.reuseWorkers&&(this.reuseWorkers=e.reuseWorkers),void 0!==e.onDebug&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,i)=>e.done(i),i=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:i,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:"Starting job",name:t.name,workerThread:e,backlog:this.jobQueue.length});let i=new c(t.name,e);e.onMessage=e=>t.onMessage(i,e.type,e.payload),e.onError=e=>t.onError(i,e),t.onStart(i);try{await i.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!r.Bd||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new h({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return r.Fr?this.maxMobileConcurrency:this.maxConcurrency}}let f={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}};class p{props;workerPools=new Map;static _workerFarm;static isSupported(){return h.isSupported()}static getWorkerFarm(e={}){return p._workerFarm=p._workerFarm||new p({}),p._workerFarm.setProps(e),p._workerFarm}constructor(e){this.props={...f},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){for(let t of(this.props={...this.props,...e},this.workerPools.values()))t.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:i,url:r}=e,s=this.workerPools.get(t);return s||((s=new d({name:t,source:i,url:r})).setProps(this._getWorkerPoolProps()),this.workerPools.set(t,s)),s}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}}},14797(e,t,i){i.d(t,{Y:()=>function e(t,i=!0,s){let n=s||new Set;if(t){if(r(t))n.add(t);else if(r(t.buffer))n.add(t.buffer);else if(ArrayBuffer.isView(t));else if(i&&"object"==typeof t)for(let r in t)e(t[r],i,n)}return void 0===s?Array.from(n):[]},i:()=>function e(t){if(null===t)return{};let i=Object.assign({},t);return Object.keys(i).forEach(r=>{"object"!=typeof t[r]||ArrayBuffer.isView(t[r])||t[r]instanceof Array?"function"==typeof i[r]||i[r]instanceof RegExp?i[r]={}:i[r]=t[r]:i[r]=e(t[r])}),i}});function r(e){return!!e&&!!(e instanceof ArrayBuffer||"u">typeof MessagePort&&e instanceof MessagePort||"u">typeof ImageBitmap&&e instanceof ImageBitmap||"u">typeof OffscreenCanvas&&e instanceof OffscreenCanvas)}},91783(e,t,i){i.d(t,{p:()=>a});var r=i(26839);let s=`\
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`,n=`#version 300 es
${s}`;var o=i(95263);class a{device;model;transformFeedback;static defaultProps={...o.K.defaultProps,feedbackBufferMode:"separate",outputs:void 0,feedbackBuffers:void 0};static isSupported(e){return e?.info?.type==="webgl"}constructor(e,t=a.defaultProps){if(!a.isSupported(e))throw Error("BufferTransform not yet implemented on WebGPU");this.device=e,this.model=new o.K(this.device,{id:t.id||"buffer-transform-model",fs:t.fs||function(){let{input:e,inputChannels:t,output:i}={};if(!e)return n;if(!t)throw Error("inputChannels");let r=function(e){switch(e){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw Error(`invalid channels: ${e}`)}}(t),s=function(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}(e,t);return`\
#version 300 es
in ${r} ${e};
out vec4 ${i};
void main() {
  ${i} = ${s};
}`}(),topology:t.topology||"point-list",varyings:t.outputs||t.varyings,...t,bufferMode:t.bufferMode||("interleaved"===t.feedbackBufferMode?35980:35981)}),this.transformFeedback=this.device.createTransformFeedback({layout:this.model.pipeline.shaderLayout,buffers:t.feedbackBuffers}),this.model.setTransformFeedback(this.transformFeedback)}destroy(){this.model&&this.model.destroy()}delete(){this.destroy()}run(e){e?.inputBuffers&&this.model.setAttributes(e.inputBuffers),e?.outputBuffers&&this.transformFeedback.setBuffers(e.outputBuffers);let t=this.device.beginRenderPass({discard:!0,...e});this.model.draw(t),t.end()}getBuffer(e){return this.transformFeedback.getBuffer(e)}readAsync(e){let t=this.getBuffer(e);if(!t)throw Error("BufferTransform#getBuffer");if(t instanceof r.h)return t.readAsync();let{buffer:i,byteOffset:s=0,byteLength:n=i.byteLength}=t;return i.readAsync(s,n)}}},30257(e,t,i){i.d(t,{C:()=>_});var r=i(69499),s=i(52009),n=i(83994),o=i(80979),a=i(94465),l=i(29651),u=i(57285),h=i(26839),c=i(20361),d=i(33823),f=i(52551),p=i(90015),g=i(16698),m=i(4500);class _{static defaultProps={...r.C.defaultProps,id:"unnamed",handle:void 0,userData:{},source:"",modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:c._P.getDefaultShaderAssembler("wgsl"),debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate="newly created";_getModuleUniforms;props;_destroyed=!1;constructor(e,t){var i;if("webgpu"!==e.type)throw Error("Computation is only supported in WebGPU");this.props={..._.defaultProps,...t},t=this.props,this.id=t.id||(0,m.L)("model"),this.device=e,Object.assign(this.userData,t.userData);let r={type:(i=e).type,shaderLanguage:i.info.shadingLanguage,shaderLanguageVersion:i.info.shadingLanguageVersion,gpu:i.info.gpu,limits:i.limits,features:i.features},a=(0,d.r)(this.props.plugins,r.shaderLanguage);if(Object.keys(a.vertexInputs).length>0||Object.keys(a.varyings).length>0)throw Error("Computation does not support ShaderPlugin vertex inputs or varyings");let l=Object.fromEntries((0,d.K)(this.props.modules,a.modules).map(e=>[e.name,e]));this.shaderInputs=t.shaderInputs||new p.l(l),t.shaderInputs&&a.modules.length>0&&this.shaderInputs.addModules(a.modules),this.setShaderInputs(this.shaderInputs);let u=(0,g.jY)(this.props.modules,this.shaderInputs?.getModules()),h={...a.defines,...this.props.defines};this.props.shaderLayout=(0,g.Y$)(this.props.shaderLayout,u)||null,this.pipelineFactory=t.pipelineFactory||s.N.getDefaultPipelineFactory(this.device),this.shaderFactory=t.shaderFactory||n.g.getDefaultShaderFactory(this.device);let f=this.props.shaderAssembler;(0,o.v)(f instanceof c.Ry);let{source:v,getUniforms:y,shaderLayout:b}=f.assembleWGSLShader({platformInfo:r,...this.props,modules:u,defines:h,scanVertexAttributes:!1,pluginInjections:a.injections});this.source=v,this._getModuleUniforms=y;let w=b??e.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=(0,g.Y$)(this.props.shaderLayout||w||null,u)||null,this.pipeline=this._updatePipeline(),t.bindings&&this.setBindings(t.bindings)}destroy(){this._destroyed||(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),this._uniformStore.destroy(),this._destroyed=!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,i,r){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,i,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,i=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,i)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){for(let[t,i]of(this.shaderInputs=e,this._uniformStore=new a.K(this.device,this.shaderInputs.modules),Object.entries(this.shaderInputs.modules)))if((0,g.fX)(i)){let e=this._uniformStore.getManagedUniformBuffer(t);this.bindings[`${t}Uniforms`]=e}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),i=Object.keys(t).filter(e=>{let i=t[e];return!(0,f.H9)(i)&&"number"!=typeof i&&"boolean"!=typeof i}),r={};for(let e of i)r[e]=t[e],delete t[e]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){if(this._pipelineNeedsUpdate){let e=null;this.pipeline&&(l.R.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),e=this.shader),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:"compute",source:this.source,debugShaders:this.props.debugShaders}),this.pipeline=this.pipelineFactory.createComputePipeline({...this.props,shader:this.shader}),e&&this.shaderFactory.release(e)}return this.pipeline}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=l.R.level>3?0:1e4;l.R.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,l.R.group(2,`>>> DRAWING MODEL ${this.id}`,{collapsed:l.R.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();l.R.table(2,e)(),l.R.groupEnd(2)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,t){let i=u.r.getTypedArrayConstructor(t);return(e instanceof h.h?new i(e.debugData):e).toString()}}},84226(e,t,i){i.d(t,{I:()=>s});var r=i(61954);class s{buffer;format;length;byteOffset;byteStride;constructor(e){let t=r.E.getVertexFormatInfo(e.format).byteLength,i=e.byteOffset??0,s=e.byteStride??t;if(n(e.length,"GPUDataView length"),n(i,"GPUDataView byteOffset"),n(s,"GPUDataView byteStride"),s<t)throw Error(`GPUDataView byteStride ${s} is smaller than ${e.format} byte length ${t}`);let o=0===e.length?0:(e.length-1)*s+t,a=i+o;if(!Number.isSafeInteger(o)||!Number.isSafeInteger(a))throw Error("GPUDataView byte range must use safe integers");if(a>e.buffer.byteLength)throw Error("GPUDataView exceeds its backing buffer byte length");this.buffer=e.buffer,this.format=e.format,this.length=e.length,this.byteOffset=i,this.byteStride=s}get elementByteLength(){return r.E.getVertexFormatInfo(this.format).byteLength}get byteLength(){return 0===this.length?0:(this.length-1)*this.byteStride+this.elementByteLength}}function n(e,t){if(!Number.isSafeInteger(e)||e<0)throw Error(`${t} must be a non-negative safe integer`)}},84(e,t,i){i.d(t,{L:()=>c});var r=i(84226),s=i(61954),n=i(50584);function o(e){return!!(e&&"object"==typeof e&&"struct"===e.type)}function a(e,t){return 1===t?e:`vec${t}<${e}>`}function l(e,t){return Math.ceil(e/t)*t}var u=i(6917);class h{buffer;ownsDataBuffer;constructor(e,t){this.buffer=e,this.ownsDataBuffer=t}get ownsBuffer(){return this.ownsDataBuffer}transferBufferOwnership(e){if(e.buffer!==this.buffer)throw Error("GPUData ownership can only be transferred to the same buffer");e.ownsDataBuffer=this.ownsDataBuffer,this.ownsDataBuffer=!1}destroy(){this.ownsDataBuffer&&(this.buffer.destroy(),this.ownsDataBuffer=!1)}}let c=class extends h{dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;readbackMetadata;valueOffsets;nullBitmap;valueByteLength;constructor(e){let t,{buffer:i,format:r,length:h,valueLength:c,stride:d,byteOffset:f=0,byteStride:p,rowByteLength:g,ownsBuffer:m=!1,readbackMetadata:_,valueOffsets:v,nullBitmap:y,valueByteLength:b,dataType:w}=e;super(i,m);let E=o(t=r?"string"==typeof r?r:function(e,t){let i=Object.entries(e);if(0===i.length)throw Error("GPUData struct format must declare at least one field");return"packed"===t?function(e){let t=[],i=0,r=0;for(let[n,o]of e){let e=s.E.getVertexFormatInfo(o);if(e.webglOnly)throw Error(`Packed GPUData struct field "${n}" uses WebGL-only format ${o}`);i=l(i,Math.min(4,e.byteLength)),t.push([n,Object.freeze({format:o,byteOffset:i,byteLength:e.byteLength})]),i+=e.byteLength,r+=e.components}return Object.freeze({type:"struct",layout:"packed",fields:Object.freeze(Object.fromEntries(t)),components:r,byteStride:l(i,4),rowByteLength:i})}(i):function(e){let t=Object.fromEntries(e.map(([e,t])=>[e,function(e){let t=s.E.getVertexFormatInfo(e);switch(t.type){case"float32":return a("f32",t.components);case"sint32":return a("i32",t.components);case"uint32":return a("u32",t.components);default:return a("u32",Math.ceil(t.byteLength/4))}}(t)])),i=(0,n.Pr)(t,{layout:"wgsl-storage"}),r=[],o=0,l=0;for(let[t,n]of e){let e=s.E.getVertexFormatInfo(n),a=4*i.fields[t].offset;r.push([t,Object.freeze({format:n,byteOffset:a,byteLength:e.byteLength})]),o=Math.max(o,a+e.byteLength),l+=e.components}return Object.freeze({type:"struct",layout:"wgsl-storage",fields:Object.freeze(Object.fromEntries(r)),components:l,byteStride:i.byteLength,rowByteLength:o})}(i)}(r,e.layout??"wgsl-storage"):void 0)?t:void 0,P="string"==typeof t?(0,u.Ft)(t):void 0;if(this.dataType=w,this.format=t,this.length=h,this.valueLength=c??h,this.stride=d??P?.components??E?.components??p??g??1,this.byteOffset=f,this.rowByteLength=g??E?.rowByteLength??P?.byteLength??p??this.stride,this.byteStride=p??E?.byteStride??this.rowByteLength,E){if(this.rowByteLength<E.rowByteLength)throw Error(`GPUData rowByteLength ${this.rowByteLength} is smaller than struct format row byte length ${E.rowByteLength}`);if(this.byteStride<Math.max(E.byteStride,this.rowByteLength))throw Error(`GPUData byteStride ${this.byteStride} is smaller than its struct row layout`)}this.readbackMetadata=_,this.valueOffsets=v,this.nullBitmap=y,this.valueByteLength=b}getChild(e){if(!o(this.format))return null;let t=this.format.fields[e];return t?new r.I({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}getChildAt(e){if(!o(this.format))return null;let t=Object.values(this.format.fields)[e];return t?new r.I({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}}},6917(e,t,i){i.d(t,{Ft:()=>l,Tm:()=>o,u4:()=>a});var r=i(61954);let s=/^vertex-list<([^<>]+)>$/,n=/^value-list<([^<>]+)>$/;function o(e){return s.test(e)}function a(e){return n.test(e)}function l(e){let t=function(e){let t=s.exec(e),i=n.exec(e),o=t?.[1]??i?.[1]??e;try{r.E.getVertexFormatInfo(o)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return o}(e),i=o(e),l=a(e),u=r.E.getVertexFormatInfo(t),h=u.type,c=u.normalized,d=function(e,t){if(t)return"f32";switch(e){case"float32":return"f32";case"float16":return"f16";case"uint8":case"uint16":case"uint32":return"u32";case"sint8":case"sint16":case"sint32":return"i32";default:throw Error(`Unsupported GPUVector component type ${e}`)}}(h,c);return{format:e,elementFormat:t,vertexList:i,valueList:l,type:h,signedDataType:function(e,t){if("unorm10-10-10-2"===e)return"uint32";switch(t){case"unorm8":return"uint8";case"snorm8":return"sint8";case"unorm16":return"uint16";case"snorm16":return"sint16";default:return t}}(t,h),primitiveType:d,components:u.components,byteLength:u.byteLength,integer:u.integer,signed:u.signed,normalized:c,...u.webglOnly?{webglOnly:!0}:{}}}},65181(e,t,i){i.d(t,{M:()=>n});var r=i(84),s=i(6917);class n{name;dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;bufferLayout;data=[];device;bufferProps;isAppendable=!1;ownsDataChunks=!0;ownedVectors=[];appendableByteLength=0;constructor(e){switch(e.type){case"buffer":{let{name:t,buffer:i,format:s,length:n,valueLength:a=n,byteOffset:l=0,ownsBuffer:u=!1}=e,{stride:h,byteStride:c,rowByteLength:d}=o(e);this.name=t,this.dataType=e.dataType,this.format=s,this.length=n,this.valueLength=a,this.stride=h,this.byteOffset=l,this.byteStride=c,this.rowByteLength=d,this.data.push(new r.L({buffer:i,format:s,length:n,valueLength:a,stride:h,byteOffset:l,byteStride:c,rowByteLength:d,ownsBuffer:u,dataType:e.dataType}));return}case"interleaved":{let{name:t,buffer:i,format:s,length:n,valueLength:o=n,byteOffset:a=0,byteStride:l,attributes:u,ownsBuffer:h=!1}=e;this.name=t,this.dataType=e.dataType,this.format=s,this.length=n,this.valueLength=o,this.stride=l,this.byteOffset=a,this.byteStride=l,this.rowByteLength=l,this.bufferLayout={name:t,byteStride:l,attributes:u},this.data.push(new r.L({buffer:i,format:s,length:n,valueLength:o,stride:l,byteOffset:a,byteStride:l,rowByteLength:l,ownsBuffer:h,dataType:e.dataType}));return}case"data":{var t;let i=e.format??(t=e.data,t[0]?.format),r=i?(0,s.Ft)(i):void 0,{name:n,data:o,stride:a=o[0]?.stride??r?.components??1,valueLength:l=o.reduce((e,t)=>e+t.valueLength,0),byteStride:u=o[0]?.byteStride??r?.byteLength,rowByteLength:h=o[0]?.rowByteLength??r?.byteLength,bufferLayout:c,ownsData:d=!1}=e;if(void 0===u||void 0===h)throw Error("GPUVector requires format or explicit byte layout metadata");i&&function(e,t){if(e.find(e=>e.format!==t))throw Error("GPUVector data chunks must share the declared format")}(o,i),this.name=n,this.dataType=e.dataType,this.format=i,this.length=o.reduce((e,t)=>e+t.length,0),this.valueLength=l,this.stride=a,this.byteOffset=1===o.length?o[0].byteOffset:0,this.byteStride=u,this.rowByteLength=h,this.bufferLayout=c,this.ownsDataChunks=d,this.data.push(...o);return}case"appendable":{let{name:t,device:i,format:r,valueLength:s=0,bufferProps:n}=e,{stride:a,byteStride:l,rowByteLength:u}=o(e);this.name=t,this.dataType=e.dataType,this.format=r,this.length=0,this.valueLength=s,this.stride=a,this.byteOffset=0,this.byteStride=l,this.rowByteLength=u,this.device=i,this.bufferProps=n,this.isAppendable=!0;return}}}get ownsBuffer(){return this.ownsDataChunks&&this.data.some(e=>e.ownsBuffer)||this.ownedVectors.some(e=>e.ownsBuffer)}get capacityRows(){return this.isAppendable?this.length:void 0}get appendedByteLength(){return this.appendableByteLength}addData(e){if(this.format&&e.format!==this.format)throw Error("GPUVector.addData() requires matching formats");if(e.byteStride!==this.byteStride)throw Error("GPUVector.addData() requires matching byteStride");if(e.rowByteLength!==this.rowByteLength)throw Error("GPUVector.addData() requires matching rowByteLength");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this}appendDataChunk(e,t=this.appendableByteLength+e.buffer.byteLength){if(!this.isAppendable)throw Error("GPUVector.appendDataChunk() requires appendable vector storage");if(this.format&&e.format!==this.format)throw Error("GPUVector.appendDataChunk() requires matching formats");if(e.byteStride!==this.byteStride||e.rowByteLength!==this.rowByteLength)throw Error("GPUVector.appendDataChunk() requires matching byte layout metadata");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this.appendableByteLength=t,this}resetLastBatch(){if(!this.isAppendable)throw Error("GPUVector.resetLastBatch() requires appendable vector storage");for(let e of this.data.splice(0))e.destroy();return this.length=0,this.valueLength=0,this.appendableByteLength=0,this}retainOwnedVectors(e){return this.ownedVectors.push(...e),this}transferBufferOwnership(e){let t=this.data[0],i=e.data[0];if(!t||!i||t.buffer!==i.buffer)throw Error("GPUVector ownership can only be transferred to the same buffer");t.transferBufferOwnership(i)}destroy(){if(this.ownsDataChunks)for(let e of this.data)e.destroy();for(let e of this.ownedVectors.splice(0))e.destroy()}}function o(e){let t=e.format?(0,s.Ft)(e.format):void 0,i=e.rowByteLength??e.byteStride??t?.byteLength;if(void 0===i)throw Error("GPUVector requires format or explicit rowByteLength");return{stride:e.stride??t?.components??1,byteStride:e.byteStride??i,rowByteLength:i}}},34010(e,t,i){i.d(t,{GL:()=>h,uy:()=>c});var r=i(40462),s=i(99305),n=i(84226),o=i(65181),a=i(84),l=i(6917),u=i(65020);class h{static get bufferPoolSize(){return u.R.poolSize}static set bufferPoolSize(e){if(!Number.isSafeInteger(e)||e<0)throw Error("GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer");u.R.poolSize=e,u.R.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership="owned";_targetBuffer;static fromArray(e,{type:t,size:i=1,offset:s=0,stride:n=0,normalized:o=!1}){let a,l=t;return Array.isArray(e)?(l=l||"float32",a=new((0,r.Y0)(l))(e)):e instanceof Float64Array?(l="uint32",i*=2,s*=2,n*=2,a=new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4)):(l=l||(0,r.UE)(e),a=e),new h({id:`<${l} * ${i}>`,type:l,size:i,offset:s,stride:n,normalized:o,value:a})}static fromConstant(e,t="float32"){let i,s=(0,r.Y0)(t);return Array.isArray(e)?i=`[${e.join(",")}]`:(i=String(e),e=[e]),new h({id:i,isConstant:!0,type:t,size:e.length,value:new s(e)})}static fromGPUData(e,t={}){return function(e){if(!e.format)throw Error("GPUDataEvaluator.fromGPUData() requires GPUData format metadata");if((0,l.Tm)(e.format)||(0,l.u4)(e.format))throw Error("GPUDataEvaluator.fromGPUData() does not support variable-length input");let t=(0,l.Ft)(e.format).byteLength;if(e.rowByteLength!==t)throw Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${t} for GPUData`)}(e),new h({...d(new n.I({buffer:e.buffer,format:e.format,length:e.length,byteOffset:e.byteOffset,byteStride:e.byteStride})),id:t.id,gpuData:e})}static fromGPUDataView(e,t={}){return new h({...d(e),id:t.id,buffer:e.buffer})}constructor(e){let{id:t,value:i,buffer:s,gpuData:n,format:a,source:l=null,isConstant:u=!1}=e;if(!l&&!i&&!s&&!n)throw Error("GPUDataEvaluator must have a value source");let{type:c,size:d,offset:f,stride:p,normalized:g,length:m}=e;if(l instanceof h?(c=c??l.type,d=d??l.size,f=f??l.offset,p=p??l.stride,g=g??l.normalized,m=m??l.length):(d=d??1,f=f??0,g=g??!1,m=u?1:m),!c)throw Error("GPUDataEvaluator: type not defined");if(this._id=t,this.type=c,this.size=d,this.ValueType=(0,r.Y0)(this.type),this._offset=f,this._stride=p||this.ValueType.BYTES_PER_ELEMENT*d,this.normalized=g,this.source=l,this.format=a,void 0===m)if(u)m=1;else{if(!i)throw Error("GPUDataEvaluator: length not defined");m=Math.ceil(i.byteLength/this.stride)}this.isConstant=u,this.length=m;let _=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=0===m?0:(m-1)*this.stride+_,this._value=i,this._bufferOwnership=l instanceof h||s||n?"borrowed":"owned",n?this._gpuVector=new o.M({type:"data",name:this._id??"data",format:n.format,data:[n],stride:n.stride,byteStride:n.byteStride,rowByteLength:n.rowByteLength}):s&&(this._gpuVector=this.createGPUVectorView({buffer:s,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof h?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return f(this.gpuVector)}setTargetBuffer({buffer:e,byteOffset:t=0,byteStride:i=this.stride}){if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof h)throw Error("GPUDataEvaluator target buffers require a deferred operation source");this._targetBuffer={buffer:e,byteOffset:t,byteStride:i}}async evaluate(e,t={}){let i;if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;if(this.source instanceof h){let i=await this.source.evaluate(e);return this._gpuVector=this.createGPUVectorView({...t,buffer:f(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(e),this._value)i.write(this._value);else{let t=await this.source.execute(e,i);if(!t.success)throw t.error||Error(`${this.source} evaluation failed`);t.value&&(this._value=t.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:i}),this._gpuVector}evaluateSync(e,t={}){let i;if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;if(this.source instanceof h){let i=this.source.evaluateSync(e);return this._gpuVector=this.createGPUVectorView({...t,buffer:f(i)}),this._gpuVector}if(i=this._getEvaluationBuffer(e),this._value)i.write(this._value);else{let t=this.source.executeSync(e,i);if(!t.success)throw t.error||Error(`${this.source} evaluation failed`);t.value&&(this._value=t.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:i}),this._gpuVector}createGPUVectorView(e){let t=e.name??this._id??"vector",i=e.format??this.format??function(e,t,i=!1){return t>=1&&t<=4?p(e,t,i):void 0}(this.type,this.size,this.normalized);if(e.interleaved){var r;let i,s="object"==typeof e.interleaved&&e.interleaved.attributes?e.interleaved.attributes:(r=this,function e(t,i,r){let s=t.source;if(s&&!(s instanceof h)&&"interleave"===s.name){for(let t of Object.values(s.inputs))t instanceof h&&e(t,i,r);return}i.push({attribute:t.id??t.toString(),format:p(t.type,t.size,t.normalized),byteOffset:r.byteOffset}),r.byteOffset+=t.ValueType.BYTES_PER_ELEMENT*t.size}(r,i=[],{byteOffset:0}),i);return new o.M({type:"interleaved",name:t,buffer:e.buffer,format:e.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:s,ownsBuffer:!1})}return new o.M({type:"buffer",name:t,buffer:e.buffer,format:i,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(e){let t=this._targetBuffer;if(!t)return u.R.createOrReuse(e,this.byteLength);if(t.buffer.device!==e)throw Error("GPUDataEvaluator target buffer belongs to a different device");let i=this.ValueType.BYTES_PER_ELEMENT*this.size,r=0===this.length?0:(this.length-1)*t.byteStride+i;if(t.byteOffset+r>t.buffer.byteLength)throw Error("GPUDataEvaluator target buffer is too small for the output layout");return this._offset=t.byteOffset,this._stride=t.byteStride,this._byteLength=r,this._bufferOwnership="borrowed",this._targetBuffer=void 0,t.buffer}async readValue(e=0,t){let{ValueType:i}=this,{size:r,offset:s,stride:n,length:o}=this,a=i.BYTES_PER_ELEMENT*r;if(t=t??o,t=Math.max(e=Math.max(0,Math.min(o,e)),Math.min(o,t)),this._value)return function(e,t,i,r){let{ValueType:s,size:n,offset:o,stride:a}=e,l=a/s.BYTES_PER_ELEMENT,u=o/s.BYTES_PER_ELEMENT,h=r-i;if(l===n){let e=u+i*l;return t.subarray(e,e+h*n)}let c=new s(h*n);for(let e=0;e<h;e++){let r=u+(i+e)*l;c.set(t.subarray(r,r+n),e*n)}return c}(this,this._value,e,t);let l=t-e;if(0===l)return new i(0);let u=s+e*n,h=await this.buffer.readAsync(u,n===a?l*a:(l-1)*n+a),c=new i(h.buffer,h.byteOffset,h.byteLength/i.BYTES_PER_ELEMENT);if(n===a)return c;let d=new Uint8Array(a*l);for(let e=0;e<l;e++){let t=e*n;d.set(h.subarray(t,t+a),e*a)}return new i(d.buffer)}async ensureCPUValue(){let e=this.value;if(e)return e;let t=await this.buffer.readAsync(0,this.offset+this.byteLength);if(t.byteLength%this.ValueType.BYTES_PER_ELEMENT!=0)throw Error(`${this} backing buffer byte length is not aligned to its scalar type`);let i=t.slice();return this._value=new this.ValueType(i.buffer,i.byteOffset,i.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){let e=this.value;if(e)return e;throw Error(`${this} CPU value is not available for synchronous evaluation`)}toString(){return this._id??this.source?.toString()??this.constructor.name}destroy(){this._gpuVector&&("owned"===this._bufferOwnership&&u.R.recycle(f(this._gpuVector)),this._gpuVector=void 0),this._targetBuffer=void 0,this._destroyed=!0}}function c(e){if(e instanceof h)return e;if("number"==typeof e||Array.isArray(e))return h.fromConstant(e);if(e instanceof a.L)return h.fromGPUData(e);if(e instanceof n.I)return h.fromGPUDataView(e);throw Error("getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]")}function d(e){let t=(0,l.Ft)(e.format),i=(0,r.Y0)(t.signedDataType),s=i.BYTES_PER_ELEMENT*t.components;if(t.byteLength!==s)throw Error(`GPUDataEvaluator does not support packed vertex format ${e.format}: ${t.byteLength} physical bytes cannot expose ${t.components} ${t.signedDataType} components`);if(e.byteOffset%i.BYTES_PER_ELEMENT!=0||e.byteStride%i.BYTES_PER_ELEMENT!=0)throw Error(`GPUDataEvaluator requires ${e.format} offset and stride aligned to ${i.BYTES_PER_ELEMENT} bytes`);return{type:t.signedDataType,size:t.components,offset:e.byteOffset,stride:e.byteStride,normalized:t.normalized,length:e.length,format:e.format}}function f(e){let t=function(e){let[t,...i]=e.data;if(!t||i.length>0)throw Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${e.name}"`);return t}(e).buffer;return t instanceof s.kL?t.buffer:t}function p(e,t,i=!1){if(t<1||t>4)throw Error(`Cannot synthesize a GPUVector vertex format with ${t} components`);let r=e;if(i)switch(e){case"uint8":r="unorm8";break;case"sint8":r="snorm8";break;case"uint16":r="unorm16";break;case"sint16":r="snorm16";break;case"float32":r="float32";break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}return("uint8"===r||"sint8"===r||"uint16"===r||"sint16"===r||"unorm8"===r||"snorm8"===r||"unorm16"===r||"snorm16"===r)&&3===t?`${r}x3-webgl`:`${r}${1===t?"":`x${t}`}`}},78705(e,t,i){i.d(t,{E:()=>r});let r={add:{arity:2,symbol:"arithmetic_add"},subtract:{arity:2,symbol:"arithmetic_subtract"},multiply:{arity:2,symbol:"arithmetic_multiply"},divide:{arity:2,symbol:"arithmetic_divide"},pow:{arity:2,symbol:"pow"},sqrt:{arity:1,symbol:"sqrt"},abs:{arity:1,symbol:"abs"},sin:{arity:1,symbol:"sin"},cos:{arity:1,symbol:"cos"},tan:{arity:1,symbol:"arithmetic_tan"},exp:{arity:1,symbol:"exp"},log:{arity:1,symbol:"log"}}},70049(e,t,i){function r(e,t){var i;let r=Number.isFinite(i=t)&&i>0?Math.floor(i):65535,s=Math.max(1,Math.ceil(e)),n=Math.min(s,r),o=Math.min(Math.ceil(s/n),r),a=Math.ceil(s/n/o);if(a>r)throw Error(`WebGPU dispatch requires ${s} workgroups, exceeding the 3D dispatch limit of ${r} per dimension`);return{x:n,y:o,z:a}}function s(e,t="workgroupId"){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function n(e,t,i="workgroupId",r="localId"){return`(${s(e,i)} * ${t}u + ${r}.x)`}i.d(t,{B:()=>s,BB:()=>r,vL:()=>n})},27611(e,t,i){function r(e,t){switch(e){case"u32":return`${t}u`;case"f32":return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function s(e,t){switch(e){case"uint32":return r("u32",Math.trunc(t));case"sint32":return`${Math.trunc(t)}`;case"float32":return r("f32",t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function n(e){switch(e){case"uint32":return"0u";case"sint32":return"0";case"float32":return"0.0";default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function o(e){switch(e){case"uint32":return"u32";case"sint32":return"i32";case"float32":return"f32";default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}i.d(t,{C1:()=>s,Lm:()=>r,_1:()=>n,iP:()=>o})},26266(e,t,i){i.d(t,{P:()=>l});var r=i(30257),s=i(20361),n=i(70049),o=i(27611);let a=new s.Ry;function l({module:e,elementWise:t=!1,expression:i,inputs:s,output:u,operationType:h=u.type,outputBuffer:c}){var d,f,p,g;let m,_,v,y;if(!e.source)throw Error(`WebGPU computation ${e.name} requires WGSL source`);let b=Array.isArray(d=s)?d.map((e,t)=>[`x${t}`,e]):Object.entries(d),w=b.map(([e,t])=>({name:e,input:t})),E=w.filter(({input:e})=>!e.isConstant).map((e,t)=>({...e,index:t})),P=(0,o.iP)(h),x=(0,o.iP)(u.type),S={TYPE:P,RESULT_LEN:u.size.toString()},M=(0,n.BB)(Math.ceil(u.length/64),c.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of b)S[`${e.toUpperCase()}_LEN`]=t.size.toString();let A=`
${function(e,t){for(let i in t)e=e.replaceAll(`{${i}}`,t[i]);return e}(e.source,S)}
${E.map(({name:e,input:t,index:i})=>(function(e,t,i){if(t.isConstant)return"";let r=(0,o.iP)(t.type);return`@group(0) @binding(${i}) var<storage, read> ${e}: array<${r}>;`})(e,t,i)).join("\n")}
${w.map(({name:e,input:t})=>{var i,r,s;let n,a,l,u;return i=e,r=t,s=h,n=(0,o.iP)(s),a=r.type===s?"":n,l=r.stride/r.ValueType.BYTES_PER_ELEMENT,u=r.offset/r.ValueType.BYTES_PER_ELEMENT,r.isConstant?`fn read_${i}(_rowIndex: u32) -> array<${n}, ${r.size}> {
  return array<${n}, ${r.size}>(${function(e,t){let i=e.value;if(!i)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>(0,o.Lm)(t,i[r]??0)).join(", ")}(r,a)});
}`:`fn read_${i}(rowIndex: u32) -> array<${n}, ${r.size}> {
  var value: array<${n}, ${r.size}>;
  let rowOffset = ${u}u + rowIndex * ${l}u;
${Array.from({length:r.size},(e,t)=>a?`  value[${t}] = ${a}(${i}[rowOffset + ${t}u]);`:`  value[${t}] = ${i}[rowOffset + ${t}u];`).join("\n")}
  return value;
}`}).join("\n")}
${(f=u,p=E.length,m=(0,o.iP)(f.type),`@group(0) @binding(${p}) var<storage, read_write> result: array<${m}>;`)}
${(_=(g=u).stride/g.ValueType.BYTES_PER_ELEMENT,v=g.offset/g.ValueType.BYTES_PER_ELEMENT,y=(0,o.iP)(g.type),`fn write_result(rowIndex: u32, value: array<${y}, ${g.size}>) {
  let rowOffset = ${v}u + rowIndex * ${_}u;
${Array.from({length:g.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join("\n")}
}`)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${(0,n.vL)(M,64)};
  if (rowIndex >= ${u.length}u) {
    return;
  }

${w.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join("\n")}
  var result: array<${x}, ${u.size}>;
${function(e,t,i,r,s){let n="";if(s)for(let e=0;e<i.size;e++)n+=`  result[${e}] = ${s(e)};
`;else if(r){let r=(0,o._1)(i.type),s=(0,o.iP)(i.type);for(let a=0;a<i.size;a++){let i=t.map(([e,t])=>a<t.size?(0,o.iP)(t.type)===s?`${e}[${a}]`:`${s}(${e}[${a}])`:r);n+=`  result[${a}] = ${e}(${i.join(", ")});
`}}else n+=`result = ${e}(${t.map(([e])=>e).join(", ")});`;return n.trimEnd()}(e.name,b,u,t,i)}
  write_result(rowIndex, result);
}
`,C=new r.C(c.device,{source:A,modules:e.dependencies,shaderAssembler:a,shaderLayout:{bindings:[...E.map(({name:e},t)=>({name:e,type:"storage",group:0,location:t})),{name:"result",type:"storage",group:0,location:E.length}]}}),T=Object.fromEntries(E.map(({name:e,input:t})=>[e,t.buffer]));T.result=c,C.setBindings(T);let k=c.device.beginComputePass({});c.device.statsManager.getStats("GPGPU Operation Counts").get("Computation Runs").incrementCount(),C.dispatch(k,M.x,M.y,M.z),k.end(),c.device.submit(),C.destroy()}},10924(e,t,i){i.d(t,{C:()=>s});var r=i(26266);let s=({inputs:e,output:t,target:i})=>{let s=e.map((e,t)=>[`x${t}`,e]);var n=i.device.limits,o=s;let a=o.filter(([,e])=>!e.isConstant).length+1;if(a>n.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${a} storage buffers, exceeding device limit ${n.maxStorageBuffersPerShaderStage}`);if(a>n.maxBindingsPerBindGroup)throw Error(`interleave() requires ${a} bindings, exceeding bind group limit ${n.maxBindingsPerBindGroup}`);let l=s.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(", "),u=0,h=s.map(([e,t])=>{let i=Array.from({length:t.size},(t,i)=>`  out[${u+i}] = ${e}[${i}];`).join("\n");return u+=t.size,i}).join("\n"),c=`\
fn interleave(${l}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${h}
  return out;
}
`;return(0,r.P)({module:{name:"interleave",source:c},inputs:e,output:t,outputBuffer:i}),{success:!0}}},65020(e,t,i){i.d(t,{R:()=>s});var r=i(26839);let s=new class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(e,t){if(t>e.limits.maxBufferSize)throw Error(`Buffer pool cannot allocate ${t} bytes: device.limits.maxBufferSize is ${e.limits.maxBufferSize}`);let i=this.bufferPools.get(e),s=i?i.findIndex(e=>e.byteLength>=t):-1;if(s<0)return e.createBuffer({usage:r.h.VERTEX|r.h.STORAGE|r.h.COPY_DST|r.h.COPY_SRC,byteLength:t});let[n]=i.splice(s,1);return n}recycle(e){let t=e.device;this.bufferPools.has(t)||this.bufferPools.set(t,[]);let i=this.bufferPools.get(t),r=i.findIndex(t=>t.byteLength>e.byteLength);r<0?i.push(e):i.splice(r,0,e),this.purge()}purge(){for(let[e,t]of this.bufferPools){let i=e.isLost?0:this.poolSize;for(;t.length>i;)t.shift().destroy();0===t.length&&this.bufferPools.delete(e)}}}},55611(e,t,i){function r(e,t=!0){return e??t}function s(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}function n(e,t=!0){let i=s(e.slice(0,3),t),r=Number.isFinite(e[3]),o=r?e[3]:1;return[i[0],i[1],i[2],t&&r?o/255:o]}i.d(t,{eS:()=>r,jI:()=>n,sC:()=>s})},34938(e,t,i){i.d(t,{i:()=>r});let r={name:"fp32",source:`\
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
`}},92767(e,t,i){var r,s,n,o,a,l;i.d(t,{Cx:()=>z,uq:()=>F,Cp:()=>B,EU:()=>er,h1:()=>U}),(o=r||(r={}))[o.Start=1]="Start",o[o.Move=2]="Move",o[o.End=4]="End",o[o.Cancel=8]="Cancel",(a=s||(s={}))[a.None=0]="None",a[a.Left=1]="Left",a[a.Right=2]="Right",a[a.Up=4]="Up",a[a.Down=8]="Down",a[a.Horizontal=3]="Horizontal",a[a.Vertical=12]="Vertical",a[a.All=15]="All",(l=n||(n={}))[l.Possible=1]="Possible",l[l.Began=2]="Began",l[l.Changed=4]="Changed",l[l.Ended=8]="Ended",l[l.Recognized=8]="Recognized",l[l.Cancelled=16]="Cancelled",l[l.Failed=32]="Failed";let u="manipulation";class h{constructor(e,t){this.actions="",this.manager=e,this.set(t)}set(e){"compute"===e&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));var t=e.join(" ");if(t.includes("none"))return"none";let i=t.includes("pan-x"),r=t.includes("pan-y");return i&&r?"none":i||r?i?"pan-x":"pan-y":t.includes(u)?u:"auto"}}function c(e){return e.trim().split(/\s+/g)}function d(e,t,i){if(e)for(let r of c(t))e.addEventListener(r,i,!1)}function f(e,t,i){if(e)for(let r of c(t))e.removeEventListener(r,i,!1)}function p(e){return(e.ownerDocument||e).defaultView}function g(e){let t=e.length;if(1===t)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let i=0,r=0,s=0;for(;s<t;)i+=e[s].clientX,r+=e[s].clientY,s++;return{x:Math.round(i/t),y:Math.round(r/t)}}function m(e){let t=[],i=0;for(;i<e.pointers.length;)t[i]={clientX:Math.round(e.pointers[i].clientX),clientY:Math.round(e.pointers[i].clientY)},i++;return{timeStamp:Date.now(),pointers:t,center:g(t),deltaX:e.deltaX,deltaY:e.deltaY}}function _(e,t){let i=t.x-e.x,r=t.y-e.y;return Math.sqrt(i*i+r*r)}function v(e,t){let i=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(i*i+r*r)}function y(e,t){let i=t.clientX-e.clientX;return 180*Math.atan2(t.clientY-e.clientY,i)/Math.PI}function b(e,t){return e===t?s.None:Math.abs(e)>=Math.abs(t)?e<0?s.Left:s.Right:t<0?s.Up:s.Down}function w(e,t,i){return{x:t/e||0,y:i/e||0}}function E(e,t){return"pointerId"in e?e.pointerId:t}function P(e,t){e.movementOrigin=new Map(t.map((e,t)=>[E(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}class x{constructor(e){this.evEl="",this.evWin="",this.evTarget="",this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){var i;let s,n,o,a,l;i=this.manager,s=t.pointers.length,n=t.changedPointers.length,o=e&r.Start&&s-n==0,a=e&(r.End|r.Cancel)&&s-n==0,t.isFirst=!!o,t.isFinal=!!a,o&&(i.session={}),t.eventType=e,l=function(e,t){var i,s;let n,o,a,l,u,{session:h}=e,{pointers:c}=t,{length:d}=c;h.firstInput||(h.firstInput=m(t)),d>1&&!h.firstMultiple?h.firstMultiple=m(t):1===d&&(h.firstMultiple=!1);let{firstInput:f,firstMultiple:p}=h,x=p?p.center:f.center,S=t.center=g(c);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-f.timeStamp;let M=t.pointers.map(E);if(h.movementOrigin?.size===M.length&&M.every(e=>h.movementOrigin.has(e))||P(h,t.pointers),t.distancePerPointer=t.pointers.map((e,t)=>v(h.movementOrigin.get(M[t]),e)),t.eventType&r.Move&&t.distancePerPointer.some(e=>e>0)&&(h.firstMovementTime??(h.firstMovementTime=t.timeStamp)),t.movementDeltaTime=void 0===h.firstMovementTime?0:t.timeStamp-h.firstMovementTime,t.eventType&(r.End|r.Cancel)){let e=t.changedPointers.map(e=>E(e,t.pointers.indexOf(e)));P(h,t.pointers.filter((t,i)=>!e.includes(M[i])))}n=S.x-x.x,t.angle=180*Math.atan2(S.y-x.y,n)/Math.PI,t.distance=_(x,S);let{deltaX:A,deltaY:C}=(o=t.center,a=h.offsetDelta,l=h.prevDelta,u=h.prevInput,(t.eventType===r.Start||u?.eventType===r.End)&&(l=h.prevDelta={x:u?.deltaX||0,y:u?.deltaY||0},a=h.offsetDelta={x:o.x,y:o.y}),{deltaX:l.x+(o.x-a.x),deltaY:l.y+(o.y-a.y)});t.deltaX=A,t.deltaY=C,t.offsetDirection=b(t.deltaX,t.deltaY);let T=w(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=T.x,t.overallVelocityY=T.y,t.overallVelocity=Math.abs(T.x)>Math.abs(T.y)?T.x:T.y,t.scale=p?(i=p.pointers,v(c[0],c[1])/v(i[0],i[1])):1,t.rotation=p?(s=p.pointers,y(c[1],c[0])-y(s[1],s[0])):0,t.maxPointers=h.prevInput?t.pointers.length>h.prevInput.maxPointers?t.pointers.length:h.prevInput.maxPointers:t.pointers.length;let k=e.element;return function(e,t){let i=e;for(;i;){if(i===t)return!0;i=i.parentNode}return!1}(t.srcEvent.target,k)&&(k=t.srcEvent.target),t.target=k,!function(e,t){let i,s,n,o,a=e.lastInterval||t,l=t.timeStamp-a.timeStamp;if(t.eventType!==r.Cancel&&(l>25||void 0===a.velocity)){let r=t.deltaX-a.deltaX,u=t.deltaY-a.deltaY,h=w(l,r,u);s=h.x,n=h.y,i=Math.abs(h.x)>Math.abs(h.y)?h.x:h.y,o=b(r,u),e.lastInterval=t}else i=a.velocity,s=a.velocityX,n=a.velocityY,o=a.direction;t.velocity=i,t.velocityX=s,t.velocityY=n,t.direction=o}(h,t),t}(i,t),i.emit("hammer.input",l),i.recognize(l),i.session.prevInput=l}init(){d(this.element,this.evEl,this.domHandler),d(this.target,this.evTarget,this.domHandler),d(p(this.element),this.evWin,this.domHandler)}destroy(){f(this.element,this.evEl,this.domHandler),f(this.target,this.evTarget,this.domHandler),f(p(this.element),this.evWin,this.domHandler)}}let S={pointerdown:r.Start,pointermove:r.Move,pointerup:r.End,pointercancel:r.Cancel,pointerout:r.Cancel};class M extends x{constructor(e){super(e),this.evEl="pointerdown",this.evWin="pointermove pointerup pointercancel",this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,i=!1,s=S[e.type],n=e.pointerType,o="touch"===n,a=t.findIndex(t=>t.pointerId===e.pointerId);s&r.Start&&(e.buttons||o)?a<0&&(t.push(e),a=t.length-1):s&(r.End|r.Cancel)&&(i=!0),!(a<0)&&(t[a]=e,this.callback(s,{pointers:t,changedPointers:[e],eventType:s,pointerType:n,srcEvent:e}),i&&t.splice(a,1))}}let A=["","webkit","Moz","MS","ms","o"],C={touchAction:"compute",enable:!0,inputTarget:null,cssProps:{userSelect:"none",userDrag:"none",touchCallout:"none",tapHighlightColor:"rgba(0,0,0,0)"}};class T{constructor(e,t){this.options={...C,...t,cssProps:{...C.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new M(this),this.touchAction=new h(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?2:1}recognize(e){let t,{session:i}=this;if(i.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let{recognizers:r}=this,{curRecognizer:s}=i;(!s||s&&s.state&n.Recognized)&&(s=i.curRecognizer=null);let o=0;for(;o<r.length;)t=r[o],2!==i.stopped&&(!s||t===s||t.canRecognizeWith(s))?t.recognize(e):t.reset(),!s&&t.state&(n.Began|n.Changed|n.Ended)&&(s=i.curRecognizer=t),o++}get(e){let{recognizers:t}=this;for(let i=0;i<t.length;i++)if(t[i].options.event===e)return t[i];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t="string"==typeof e?this.get(e):e;if(t){let{recognizers:e}=this,i=e.indexOf(t);-1!==i&&(e.splice(i,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:i}=this;for(let r of c(e))i[r]=i[r]||[],i[r].push(t)}off(e,t){if(!e)return;let{handlers:i}=this;for(let r of c(e))t?i[r]&&i[r].splice(i[r].indexOf(t),1):delete i[r]}emit(e,t){let i=this.handlers[e]&&this.handlers[e].slice();if(!i||!i.length)return;t.type=e,t.preventDefault=function(){t.srcEvent.preventDefault()};let r=0;for(;r<i.length;)i[r](t),r++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[i,r]of Object.entries(this.options.cssProps)){let s=function(e,t){let i=t[0].toUpperCase()+t.slice(1);for(let r of A){let s=r?r+i:t;if(s in e)return s}}(t.style,i);e?(this.oldCssProps[s]=t.style[s],t.style[s]=r):t.style[s]=this.oldCssProps[s]||""}e||(this.oldCssProps={})}}}let k=1;function L(e){return e&n.Cancelled?"cancel":e&n.Ended?"end":e&n.Changed?"move":e&n.Began?"start":""}class I{constructor(e){this.options=e,this.id=k++,this.state=n.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:i}=this;return i[t.id]||(i[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}return(t="string"==typeof e?this.manager.get(e):e)&&delete this.simultaneous[t.id],this}requireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}if("string"==typeof e){if(!(t=this.manager.get(e)))throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:i}=this;return -1===i.indexOf(t)&&(i.push(t),t.requireFailure(this)),this}dropRequireFailure(e){let t;if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}if(t="string"==typeof e?this.manager.get(e):e){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<n.Ended&&this.manager.emit(this.options.event+L(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=n.Ended&&this.manager.emit(this.options.event+L(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=n.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(n.Failed|n.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=n.Failed;return}this.state&(n.Recognized|n.Cancelled|n.Failed)&&(this.state=n.Possible),this.state=this.process(t),this.state&(n.Began|n.Changed|n.Ended|n.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}}class O extends I{attrTest(e){let t=this.options.pointers;return 0===t||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>{var i,r;return i=e,(void 0===(r=t).distance||i.distance>=r.distance)&&(void 0===r.distancePerPointer||i.distancePerPointer.length>0&&i.distancePerPointer.every(e=>e>=r.distancePerPointer))&&(void 0===r.movementDeltaTime||i.movementDeltaTime>=r.movementDeltaTime)&&(void 0===r.rotation||Math.abs(((i.rotation+180)%360+360)%360-180)>=r.rotation)&&(void 0===r.scale||Math.abs(i.scale-1)>=r.scale)})}process(e){let{state:t}=this,{eventType:i}=e,s=t&(n.Began|n.Changed),o=this.attrTest(e);return s&&(i&r.Cancel||!o)?t|n.Cancelled:s||o?i&r.End?t|n.Ended:t&n.Began?t|n.Changed:n.Began:n.Failed}}let R=["","start","move","end","cancel"];class B extends I{constructor(e={}){super({enable:!0,event:"doubleclickdrag",pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[u]}getEventNames(){return R.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length!==t.pointers?(this.reset(),n.Failed):e.eventType&r.Start?this._handleStart(e):e.eventType&r.Move?this._handleMove(e):e.eventType&r.Cancel?this._handleEnd(e,!0):e.eventType&r.End?this._handleEnd(e,!1):n.Failed}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===n.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===n.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===n.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===n.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,n.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,n.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return n.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?n.Began:(this._drag.active=!0,e.scale=Math.pow(2,t/this.options.pixelsPerScale),this._emittedStart?n.Changed:n.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:i,startCenter:r}=this._drag;if(this._drag=null,this._tapStart=null,this._lastTap=null,!i)return this._emittedStart=!1,n.Failed;let s=r.y-e.center.y;return e.scale=Math.pow(2,s/this.options.pixelsPerScale),t?n.Cancelled:n.Ended}return this._tapStart&&this._isSamePointer(e,this._tapStart.pointerId)?(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null):t&&this.reset(),n.Failed}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&_(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return"pointerId"in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return null===t||this._getPointerId(e)===t}}class z extends I{constructor(e={}){super({enable:!0,event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[u]}process(e){let{options:t}=this,i=e.pointers.length===t.pointers,s=e.distance<t.threshold,o=e.deltaTime<t.time;if(this.reset(),e.eventType&r.Start&&0===this.count)return this.failTimeout();if(s&&o&&i){if(e.eventType!==r.End)return this.failTimeout();let i=!this.pTime||e.timeStamp-this.pTime<t.interval,s=!this.pCenter||_(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,s&&i?this.count+=1:this.count=1,this._input=e,0==this.count%t.taps)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=n.Recognized,this.tryEmit(this._input)},t.interval),n.Began):n.Recognized}return n.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=n.Failed},this.options.interval),n.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===n.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}}class j extends O{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{"trackpad"===e.device&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...i}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(i),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:i}=e,r=t.deltaX??e.deltaX,s=t.deltaY??e.deltaY,n=b(r,s),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY);return{pointers:[i,i],changedPointers:[i,i],pointerType:"trackpad",srcEvent:i,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:s,angle:180*Math.atan2(s,r)/Math.PI,distance:Math.sqrt(r*r+s*s),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:n,offsetDirection:n,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:i.target||this.manager.element,additionalEvent:"",...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&2===this.options.pointers);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}}let D=["","start","move","end","cancel","up","down","left","right"];class F extends j{constructor(e={}){super({enable:!0,pointers:1,event:"pan",threshold:10,direction:s.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&s.Horizontal&&t.push("pan-y"),e&s.Vertical&&t.push("pan-x"),t}getEventNames(){return D.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,i=!0,{distance:r}=e,{direction:n}=e,o=e.deltaX,a=e.deltaY;return n&t.direction||(t.direction&s.Horizontal?(n=0===o?s.None:o<0?s.Left:s.Right,i=o!==this.pX,r=Math.abs(e.deltaX)):(n=0===a?s.None:a<0?s.Up:s.Down,i=a!==this.pY,r=Math.abs(e.deltaY))),e.direction=n,i&&r>t.threshold&&!!(n&t.direction)}attrTest(e){let t=!!(this.state&n.Began),i=!(this.options.coherent?.length&&e.eventType&(r.End|r.Cancel));return super.attrTest(e)&&(t||i&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=s[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(n.Recognized|n.Cancelled|n.Failed)&&(this.state=n.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}}let N=["","start","move","end","cancel","in","out"];class U extends j{constructor(e={}){super({enable:!0,event:"pinch",threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return["none"]}getEventNames(){return N.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,i=!!(this.state&n.Began),s=!(t&&e.eventType&(r.End|r.Cancel));return super.attrTest(e)&&(i||s&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(1!==e.scale){let t=e.scale<1?"in":"out";e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(n.Recognized|n.Cancelled|n.Failed)&&(this.state=n.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}}class V{constructor(e,t,i){this.element=e,this.callback=t,this.options=i}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}}let $=-1!==("u">typeof navigator&&navigator.userAgent?navigator.userAgent.toLowerCase():"").indexOf("firefox");class W extends V{constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&($&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=40)),e.shiftKey&&t&&(t*=.25),this.callback({type:"wheel",center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??"unknown",srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen("wheel",!0))}destroy(){this.listen("wheel",!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){"wheel"===e&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen("wheel",t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}}let G={classificationDelay:32,endDelay:80};class q{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{var t,i;let r,s;if(!this.hasSubscribers)return"unknown";let n=(t=e,i=this.pressedControlKeys.size>0,r=t.deltaX,s=t.deltaY,1===t.deltaMode&&(r*=40,s*=40),{event:t,timeStamp:t.timeStamp,deltaX:r,deltaY:s,isControlKeyDown:i}),o=this.session;if(o&&n.timeStamp-o.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return"unknown";o=null}o?(this.scheduleEnd(),this.addSample(o,n)):(o=this.startPendingSession(n),this.scheduleEnd());let{device:a}=o;return"unknown"===a&&"unknown"!==(a=Y(o.samples,!1))&&this.begin(o,a),a},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||"unknown"!==this.session.device)return;let e=this.session,t=Y(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)},this.end=()=>{if(!this.session)return;if("unknown"===this.session.device){let e=this.session,t=Y(e.samples,!0);this.begin(e,"unknown"===t?"mouse":t)}if(!this.session)return;let e=this.session;this.emit(r.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{"Control"===e.key&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{"Control"===e.key&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...G,...t},this.element?.addEventListener("wheel",this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??"unknown"}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&"unknown"!==e.device&&this.emit(r.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener("wheel",this.handleEvent)}startPendingSession(e){let t={samples:[e],device:"unknown",firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,"unknown"!==e.device){let i=e.samples[e.samples.length-2],s=t.timeStamp-i.timeStamp;e.velocityX=s>0?t.deltaX/s:0,e.velocityY=s>0?t.deltaY/s:0,this.emit(r.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(r.Start,e.samples[0].event);let i=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=i>0?e.totalDeltaX/i:0,e.velocityY=i>0?e.totalDeltaY/i:0,this.emit(r.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,i){let s=this.session;if(!s||"unknown"===s.device)return;let n=e===r.Start,o=e===r.End||e===r.Cancel,a=n?s.firstTimeStamp:s.lastTimeStamp,l=n?0:Math.max(0,a-s.firstTimeStamp),u=n?0:s.totalDeltaX,h=n?0:s.totalDeltaY,c=l>0?u/l:0,d=l>0?h/l:0,f=n?0:i?.velocityX??s.velocityX,p=n?0:i?.velocityY??s.velocityY,g={eventType:e,device:s.device,srcEvent:t,timeStamp:a,center:{x:t.clientX,y:t.clientY},deltaX:u,deltaY:h,deltaTime:l,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(c)>Math.abs(d)?c:d,overallVelocityX:c,overallVelocityY:d,isFirst:n,isFinal:o};for(let{listener:e}of[...this.subscriptions.values()])e(g)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){null!==this.classificationTimer&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){null!==this.endTimer&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t="u">typeof window?window:globalThis.document?.defaultView;t&&e!==this.listeningForControlKeys&&(this.listeningForControlKeys=e,e?(t.addEventListener("keydown",this.handleKeyDown,!0),t.addEventListener("keyup",this.handleKeyUp,!0),t.addEventListener("blur",this.handleWindowBlur)):(t.removeEventListener("keydown",this.handleKeyDown,!0),t.removeEventListener("keyup",this.handleKeyUp,!0),t.removeEventListener("blur",this.handleWindowBlur),this.pressedControlKeys.clear()))}}function Y(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?"trackpad":e.some(({event:e})=>0!==e.deltaMode)||e.some(H)||e.every(({event:e})=>{let t=e.wheelDelta;return void 0!==t&&Math.abs(t)%40==0})?"mouse":e.some(({deltaX:e})=>0!==e)||e.length>1&&function(e){for(let t=0;t<e.length;t++){let i=e[t];if(Math.abs(i.deltaX)>40||Math.abs(i.deltaY)>40||t>0&&i.timeStamp-e[t-1].timeStamp>40)return!1}return!0}(e)?"trackpad":t?"mouse":"unknown"}function H({event:e,deltaX:t,deltaY:i}){if(0!==t||0===i)return!1;if(Number.isInteger(Math.abs(i/4.000244140625)))return!0;let r=e.wheelDelta;return"number"==typeof r&&0!==r&&r%120==0}let Z=["mousedown","mousemove","mouseup","mouseover","mouseout","mouseenter","mouseleave"];class X extends V{constructor(e,t,i){super(e,t,{enable:!0,...i}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&Z.forEach(e=>this.listen(e,!0))}destroy(){Z.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case"pointermove":this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen("mousedown",t),this.listen("mousemove",t),this.listen("mouseup",t));break;case"pointerover":this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen("mouseover",t));break;case"pointerout":this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen("mouseout",t));break;case"pointerenter":this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen("mouseenter",t));break;case"pointerleave":this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen("mouseleave",t))}}handleOverEvent(e){this.enableOverEvent&&"mouseover"===e.type&&this._emit("pointerover",e)}handleOutEvent(e){this.enableOutEvent&&"mouseout"===e.type&&this._emit("pointerout",e)}handleEnterEvent(e){this.enableEnterEvent&&"mouseenter"===e.type&&this._emit("pointerenter",e)}handleLeaveEvent(e){this.enableLeaveEvent&&"mouseleave"===e.type&&this._emit("pointerleave",e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case"mousedown":e.button>=0&&(this.pressed=!0);break;case"mousemove":0===e.buttons&&(this.pressed=!1),this.pressed||this._emit("pointermove",e);break;case"mouseup":this.pressed=!1}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:"mouse",target:t.target})}}let K=["keydown","keyup"];class J extends V{constructor(e,t,i){super(e,t,{enable:!0,tabIndex:0,...i}),this.handleEvent=e=>{let t=e.target||e.srcElement;("INPUT"!==t.tagName||"text"!==t.type)&&"TEXTAREA"!==t.tagName&&(this.enableDownEvent&&"keydown"===e.type&&this.callback({type:"keydown",srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&"keyup"===e.type&&this.callback({type:"keyup",srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline="none",r&&K.forEach(e=>this.listen(e,!0))}destroy(){K.forEach(e=>this.listen(e,!1))}enableEventType(e,t){"keydown"===e&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),"keyup"===e&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}}class Q extends V{constructor(e,t,i){i.enable=i.enable??!1,super(e,t,i),this.handleEvent=e=>{this.options.enable&&this.callback({type:"contextmenu",center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:"mouse",target:e.target})},i.enable&&this.listen("contextmenu",!0)}destroy(){this.listen("contextmenu",!1)}enableEventType(e,t){"contextmenu"===e&&this.options.enable!==t&&(this.options.enable=t,this.listen("contextmenu",t))}}let ee={pointerdown:1,pointermove:2,pointerup:4,mousedown:1,mousemove:2,mouseup:4},et={srcElement:"root",priority:0};class ei{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),i=e.srcEvent.target;for(;i&&i!==t.rootElement;){if(this._emit(t,i),t.handled)return;i=i.parentNode}this._emit(t,"root")},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,i,r=!1,s=!1){let{handlers:n,handlersByElement:o}=this,a={...et,...i},l=o.get(a.srcElement);l||(l=[],o.set(a.srcElement,l));let u={type:e,handler:t,srcElement:a.srcElement,priority:a.priority};r&&(u.once=!0),s&&(u.passive=!0),n.push(u),this._active=this._active||!u.passive;let h=l.length-1;for(;h>=0&&!(l[h].priority>=u.priority);)h--;l.splice(h+1,0,u)}remove(e,t){let{handlers:i,handlersByElement:r}=this;for(let s=i.length-1;s>=0;s--){let n=i[s];if(n.type===e&&n.handler===t){i.splice(s,1);let e=r.get(n.srcElement);e.splice(e.indexOf(n),1),0===e.length&&r.delete(n.srcElement)}}this._active=i.some(e=>!e.passive)}_emit(e,t){let i=this.handlersByElement.get(t);if(i){let t=!1,r=()=>{e.handled=!0},s=()=>{e.handled=!0,t=!0},n=[];for(let o=0;o<i.length;o++){let{type:a,handler:l,once:u}=i[o];if(l({...e,type:a,stopPropagation:r,stopImmediatePropagation:s}),u&&n.push(i[o]),t)break}for(let e=0;e<n.length;e++){let{type:t,handler:i}=n[e];this.remove(t,i)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...function(e){let t=ee[e.srcEvent.type];if(!t)return null;let{buttons:i,button:r}=e.srcEvent,s=!1,n=!1,o=!1;return 2===t?(s=!!(1&i),n=!!(4&i),o=!!(2&i)):(s=0===r,n=1===r,o=2===r),{leftButton:s,middleButton:n,rightButton:o}}(e),...function(e,t){let i=e.center;if(!i)return null;let r=t.getBoundingClientRect(),s=r.width/t.offsetWidth||1,n=r.height/t.offsetHeight||1,o={x:(i.x-r.left-t.clientLeft)/s,y:(i.y-r.top-t.clientTop)/n};return{center:i,offsetCenter:o}}(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}}class er{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:"compute",tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new q(e),!e)return;for(let t of(this.manager=new T(e,this.options),this.options.recognizers)){let{recognizer:e,recognizeWith:i,requireFailure:r}=function(e){let t;if("recognizer"in e)return e;let i=Array.isArray(e)?[...e]:[e];return{recognizer:t="function"==typeof i[0]?new(i.shift())(i.shift()||{}):i.shift(),recognizeWith:"string"==typeof i[0]?[i[0]]:i[0],requireFailure:"string"==typeof i[1]?[i[1]]:i[1]}}(t);this.manager.add(e),i&&e.recognizeWith(i),r&&e.requireFailure(r)}this.manager.on("hammer.input",this._onBasicInput),this.wheelInput=new W(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new X(e,this._onOtherEvent,{enable:!1}),this.keyInput=new J(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new Q(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}getElement(){return this.element}destroy(){this.element?(this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()):this.wheelSession.destroy()}on(e,t,i){this._addEventHandler(e,t,i,!1)}once(e,t,i){this._addEventHandler(e,t,i,!0)}watch(e,t,i){this._addEventHandler(e,t,i,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:i}=this;if(!i)return;let r=i.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),i.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,i,r,s){if("string"!=typeof e){for(let[n,o]of(i=t,Object.entries(e)))this._addEventHandler(n,o,i,r,s);return}let{manager:n,events:o}=this;if(!n)return;let a=o.get(e);!a&&(a=new ei(this,this._getRecognizerName(e)||e),o.set(e,a),n&&n.on(e,a.handleEvent)),a.add(e,t,i,r,s),a.isEmpty()||this._toggleRecognizer(a.recognizerName,!0)}_removeEventHandler(e,t){if("string"!=typeof e){for(let[t,i]of Object.entries(e))this._removeEventHandler(t,i);return}let{events:i}=this,r=i.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of i.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}}}}]);
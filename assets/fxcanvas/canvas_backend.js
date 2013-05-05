/*! fxCanvas v0.2(beta4) (20110205)  - Canvas backend */
$Unit(__PATH__,__FILE__,function(e,l,h){e.Import("buz.util.*","buz.fxcanvas.*","joo.object");e.Package("buz.fxcanvas.backend",function(g){var k=Array.prototype.slice;e.lastCanvasID=0;g.CanvasRenderingBackend2D={_invoke:function(b){var a=b[0],d=b[b.length-1],c=k.call(b,1,b.length-1);b=this._ext;if(a=="putImageData"&&!b._useRawImageData)c[0]=c[0].__toCanvasData(this);if(a=="getImageData"){if(c.length==1)c=[c[0].x,c[0].y,c[0].width,c[0].height];a=this[a].apply(this,c);a=b._useRawImageData?new e.ImageData(a.width,
a.height,a.data,b._useRawImageData):(new e.ImageData(1,1)).__fromCanvasData(a)}else a=this[a].apply(this,c);setTimeout(d,this.canvas.__frameDuration,a)},dummy:function(){},appendPath:function(b){for(var a=0;a<b._stack.length;a++)this[b._stack[a][0]].apply(this,b._stack[a][1])}};g.extendContext=function(b){b.__native_getContext=b.getContext;b.__fx_context_2d=null;b.getContext=function(a){if(a!="2d")return this.__native_getContext(a);if(!this.__fx_context_2d){a=this.__native_getContext(a);this.__fx_context_2d=
new e.extCanvasRenderingContext2D(this,a);a._ext=this.__fx_context_2d;e.object.extend(a,g.CanvasRenderingBackend2D)}return this.__fx_context_2d};b.__native_toDataURL=b.toDataURL;b.toDataURL=function(){var a=arguments,d=k.call(a,0,a.length-1);a=a[a.length-1];d=this.__native_toDataURL.apply(this,d);setTimeout(a,this.__frameDuration,d);return null};b.loadImages=function(){if(arguments.length){var a=k.call(arguments,0),d=this,c=a.pop(),f=typeof c=="object"?c.src:c,i=typeof c=="object"?c.id:null;if(c.tagName==
"CANVAS"){typeof d.onload=="function"&&d.onload(c);a.length&&d.loadImages.apply(d,a)}else{var j=new Image;if(i)j.id=i;j.onload=function(){typeof d.onload=="function"&&d.onload(j);a.length&&d.loadImages.apply(d,a)};j.src=f}}};b.__defineSetter__("frameDuration",function(a){this.__frameDuration=Math.abs(parseInt(a));this.oncanvasframe=this.__onFrame});b.__defineGetter__("frameDuration",function(){return this.__frameDuration});b.__defineSetter__("tracePathBounds",function(a){this.__tracePathBounds=a});
b.__defineGetter__("tracePathBounds",function(){return this.__tracePathBounds});b.__onFrame=b.__frameIntId=null;b.__defineSetter__("oncanvasframe",function(a){clearInterval(this.__frameIntId);if(a){var d=this,c=new Date;d.__onFrame=a;var f,i=function(){if(d.__onFrame){if(new Date-c>=d.__frameDuration){d.__onFrame();c=new Date}f(i)}};f=h.webkitRequestAnimationFrame?h.webkitRequestAnimationFrame:h.mozRequestAnimationFrame?h.mozRequestAnimationFrame:function(){d.__frameIntId=setTimeout(i,10)};i()}else this.__onFrame=
null});b.__defineGetter__("oncanvasframe",function(){return this.__onFrame});b.onload=null;b.oncanvasframe=null;b.getBackend=function(a){return this.__native_getContext(a)}};g.initialize=function(){g.extendContext(HTMLCanvasElement.prototype);document.__native_createElement=document.createElement;document.createElement=function(c){c=document.__native_createElement(c);c.nodeName==="CANVAS"&&g.initElement(c);return c};for(var b=document.getElementsByTagName("canvas"),a,d=0;d<b.length;d++){a=b[d];g.initElement(a)}};
g.initElement=function(b){if(!b.id)b.id=e.getCanvasUUID();"__fx_context_2d"in b||g.extendContext(b);var a=function(f){f.oncanvasresize&&f.oncanvasresize()},d,c=function(f){if(f.attrName=="width"||f.attrName=="height"){clearTimeout(d);d=setTimeout(a,10+Math.round(Math.random()*100),b)}};e.propertyChangeListener(b,"width",c);e.propertyChangeListener(b,"height",c);c=e.getCanvasParams(b);b.frameDuration=c.frameDuration||e.config.frameDuration;if(typeof c.tracePathBounds==="boolean")b.tracePathBounds=
c.tracePathBounds;if(c.onload)b.onload=c.onload;if(c.oncanvasframe)b.oncanvasframe=c.oncanvasframe;h.__canvasElement[e.lastCanvasID++]=b};h.__canvasElement=[]})});

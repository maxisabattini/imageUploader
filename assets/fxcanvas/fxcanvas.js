/*! fxCanvas v0.2(beta4) (20110205)
	- copyright 2009-2011, Evgeny Burzak <http://code.google.com/p/fxcanvas/>
	- released under the MIT License <http://www.opensource.org/licenses/mit-license.php>

*/
$Package("buz.util",function(i){i.capitalize=function(l){return l.substr(0,1).toUpperCase()+l.substr(1)};var j=$Import({},"platform");i.propertyChangeListener=function(l,f,q){var p=function(b){b.attrName==f&&q(b)};if(j.platform.webkit){var n=l[f],a;setInterval(function(){a=l[f];if(n!=a){p({target:l,attrName:f,prevValue:n,newValue:a});n=a}},10+Math.round(Math.random()*100))}else l.addEventListener("DOMAttrModified",p,false)}});$Unit(__PATH__,__FILE__,function(i){i.Import("platform");i.Package("buz.fxcanvas.config",function(j){i.Event.once("initialize",function(){j.version="0.2(beta4)";j.enable=true;j.tracePathBounds=i.platform.isIE;j.idleInterval=2E3;j.frameDuration=100;j.contextMenu=[{id:"view",label:{ru:"\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435",en:"View Image"}},{id:"save_as",label:{ru:"\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u043a\u0430\u043a...",
en:"Save Image As..."}},"----",{id:"about",label:{ru:"\u041e \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0435 fxCanvas...",en:"About fxCanvas..."}},{id:"about_flash",label:{ru:"\u041e \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0435 Adobe Flash Player...",en:"About Adobe Flash Player..."}}];j.viewImageURL="view.php";j.saveAsURL="save.php";j.flashBackendJS="flash_backend.js";j.canvasBackendJS="canvas_backend.js";j.projectURL="http://code.google.com/p/fxcanvas/";j.fxcanvas_js="fxcanvas.js";

//  HACK for not include by script tag.
j.script_url="js/fxcanvas/fxcanvas.js";
j.script_url_HACK=function(){for(var l=document.getElementsByTagName("script"),f=0;f<l.length;f++)if(l[f].src.indexOf(j.fxcanvas_js)>-1)return l[f].getAttribute("src",2)}();
//  END HACK

j.script_path=j.script_url.replace(/[^\/]+$/,"");j.imageProxy=j.script_path+"proxy.php";j.useCanvasPath=false;j.useRawImageData=false})})});$Unit(__PATH__,__FILE__,function(i){i.Import("buz.fxcanvas.config","platform","w3c.DOMException");i.Package("buz.fxcanvas",function(j){j.throwException=function(f){throw new i.DOMException(f);};j.throwError=function(f){throw Error(f);};j.defProp={globalAlpha:1,globalCompositeOperation:"source-over",strokeStyle:"rgb(0,0,0)",fillStyle:"rgb(0,0,0)",shadowOffsetX:0,shadowOffsetY:0,shadowBlur:0,shadowColor:"rgba(0,0,0,.5)",lineWidth:1,lineCap:"butt",lineJoin:"miter",miterLimit:10,font:"10px sans-serif",
textAlign:"start",textBaseline:"alphabetic"};var l=0;j.getCanvasUUID=function(){return"canvas-uuid-"+l++};j.getCanvasParams=function(f){var q=f.getAttribute("width"),p=f.getAttribute("height"),n=f.getAttribute("oncanvasframe"),a=f.getAttribute("oncanvasresize"),b=f.getAttribute("onload"),c=f.getAttribute("tracePathBounds"),d=f.getAttribute("frameDuration");if(c){c=c.replace(/\s+/,"");switch(c){case "true":case "yes":case "1":c=true;break;case "false":case "no":case "0":c=false;break;default:c=null;
break}}return{width:q&&Number(q),height:p&&Number(p),id:f.getAttribute("id"),frameDuration:d&&parseInt(d),tracePathBounds:c,oncanvasframe:n&&Function(n),oncanvasresize:a&&Function(a),onload:b&&Function(b),offsetLeft:f.offsetLeft,offsetTop:f.offsetTop}};i.Event.once("initialize",function(){i.config.enable&&j.backend.initialize()});j.initialize=function(){j.backend.initialize()};j.initElement=function(f){j.backend.initElement(f)}})});$Unit(__PATH__,__FILE__,function(i,j,l){i.Import("platform","geom.*","buz.fxcanvas.config");i.Matrix2d.prototype._transform=function(){};i.Matrix2d.prototype._setTransform=function(){};i.Matrix2d.prototype._dump=function(){return[this[0],this[1],this[2],this[3],this[4],this[5]].join(",")};i.Package("buz.fxcanvas",function(f){function q(a,b,c,d){this.set(a,b,c,d);this.knots=0}function p(a,b,c,d){this.__useCache=false;this.__pixel=d&&i.platform.isIE?1:4;this.__cachedData=null;if(a&&b){this.width=a;
this.height=b;if(c){this.data=c;return this}}else{a||f.throwException("NOT_SUPPORTED_ERR");f.assertImageDataIsValid(a);this.width=a.width;this.height=a.height}this.data=i.VectorArray(this.width*this.height,i.Uint(32));for(a=0;a<this.height;a++)for(b=0;b<this.width;b++)this.data[a*this.width+b]=0}function n(){l.detachEvent("onbeforeunload",n);l.extCanvasRenderingContext2D=null;l.ImageData=null;l.CanvasPath=null}f.extCanvasRenderingContext2D=function(a,b){this._isFlashBackend=i.platform.isIE;this._backend=
b;this._bounds=new q;this._xy0=i.Point();this._tracePathBounds=i.config.tracePathBounds;this._stateStack=[];this._pathStack=[];this._useRawImageData=i.config.useRawImageData;this._useCanvasPath=i.config.useCanvasPath;this.canvas=a;this.transformMatrix=new i.Matrix2d;this.transformMatrix.identity();if(!i.platform.isIE)for(var c in f.defProp){this.__defineSetter__(c,function(d){return function(e){this._backend[d]=e}}(c));this.__defineGetter__(c,function(d){return function(){return this._backend[d]}}(c))}};
f.extCanvasRenderingContext2D.prototype={canvas:null,clearRect:function(a,b,c,d){if(arguments.length==1){b=a.y;c=a.width;d=a.height;a=a.x}this._backend.clearRect(a,b,c,d);return this},fillRect:function(a,b,c,d){if(arguments.length==1){b=a.y;c=a.width;d=a.height;a=a.x}this._backend.fillRect(a,b,c,d);return this},strokeRect:function(a,b,c,d){if(arguments.length==1){b=a.y;c=a.width;d=a.height;a=a.x}this._backend.strokeRect(a,b,c,d);return this},closePath:function(){this._path&&this._path.close();this._backend.closePath();
return this},beginPath:function(){if(this._useCanvasPath)this._path=this.createPath();if(this._tracePathBounds){this._bounds.clear();this._xy0.set(0,0)}this._backend.beginPath();return this},moveTo:function(a,b){if(arguments.length==1){b=a.y;a=a.x}this._path&&this._path.moveTo(a,b);if(this._tracePathBounds){this._xy0.set(a,b);this._bounds.addKnot(a,b)}this._backend.moveTo(a,b);return this},lineTo:function(a,b){if(arguments.length==1){b=a.y;a=a.x}this._path&&this._path.lineTo(a,b);if(this._tracePathBounds){this._xy0.set(a,
b);this._bounds.addKnot(a,b)}this._backend.lineTo(a,b);return this},arcTo:function(a,b,c,d,e){this._path&&this._path.arcTo(a,b,c,d,e);if(this._tracePathBounds){this._bounds.addKnot(a,b);this._xy0.set(a,b)}this._backend.arcTo(a,b,c,d,e)},vectorTo:function(a,b,c){if(arguments.length==1){b=a.y;a=a.x}c||(c=10);this._path&&this._path.vectorTo(a,b,c);this._backend.lineTo(a,b);var d=this._xy0.vectorTo(a,b);d=Math.atan2(d.y,d.x);var e,h;e=c*Math.cos(d+2.61);h=c*Math.sin(d+2.61);this._backend.lineTo(a+e,b+
h);e=c*Math.cos(d-2.61);h=c*Math.sin(d-2.61);this._backend.lineTo(a+e,b+h);this._backend.lineTo(a,b);return this},quadraticCurveTo:function(a,b,c,d){this._path&&this._path.quadraticCurveTo(a,b,c,d);if(this._tracePathBounds){var e=this._xy0.vectorTo(c,d);e=i.Point(c+e.x/2,d+e.y/2).vectorTo(a,b);this._bounds.addKnot(c+e.x/2,d+e.y/2);this._bounds.addKnot(c,d);this._xy0.set(c,d)}this._backend.quadraticCurveTo(a,b,c,d);return this},bezierCurveTo:function(a,b,c,d,e,h){this._path&&this._path.bezierCurveTo(a,
b,c,d,e,h);if(this._tracePathBounds){var g=i.Point,k=this._xy0,m=g(e,h),o=k.vectorTo(a,b),r=m.vectorTo(c,d),s=k.vectorTo(e,h),t=g(k.x+o.x/2,k.y+o.y/2),u=g(e+r.x/2,h+r.y/2);r=g(e+o.x/2+r.x/2-s.x/2,h+o.y/2+r.y/2-s.y/2);o=t.vectorTo(r);s=u.vectorTo(r);r=g(t.x+o.x/2,t.y+o.y/2);s=g(u.x+s.x/2,u.y+s.y/2);o=s.vectorTo(r.x,r.y);o=g(s.x+o.x/2,s.y+o.y/2);t=k.vectorTo(t);m=m.vectorTo(u);k=g(k.x+t.x/2,k.y+t.y/2);m=g(e+m.x/2,h+m.y/2);u=k.vectorTo(r);t=m.vectorTo(s);k=g(k.x+u.x/2,k.y+u.y/2);g=g(m.x+t.x/2,m.y+t.y/
2);this._bounds.addKnot(o.x,o.y);this._bounds.addKnot(k.x,k.y);this._bounds.addKnot(g.x,g.y);this._bounds.addKnot(e,h);this._xy0.set(e,h)}this._backend.bezierCurveTo(a,b,c,d,e,h);return this},rect:function(a,b,c,d){if(arguments.length==1){b=a.y;c=a.width;d=a.height;a=a.x}this._path&&this._path.rect(a,b,c,d);if(this._tracePathBounds){this._bounds.expandBox(a,b,c,d);this._xy0.set(a+c,b+d)}this._backend.rect(a,b,c,d);return this},arc:function(a,b,c,d,e,h){this._path&&this._path.arc(a,b,c,d,e,h);if(this._tracePathBounds){var g=
c*2;this._bounds.expandBox(a-c,b-c,g,g);this._xy0.set(a+g,b+g)}this._backend.arc(a,b,c,d,e,h);return this},stroke:function(){this._path&&this._path.length&&this._backend.appendPath(this._path);this._backend.stroke();return this},fill:function(){this._backend.fill();return this},clip:function(){this._backend.clip();return this},createPath:function(a){return new f.CanvasPath(a)},appendPath:function(a){this._path&&this._path.append(a);return this},clonePath:function(){if(this._path)return this._path.clone()},
save:function(){this._path&&this._pathStack.push(this._path.clone());this._stateStack.push(this.transformMatrix.clone());this._backend.save();return this},restore:function(){this._backend.restore();this.globalAlpha=this._backend.globalAlpha;this.globalCompositeOperation=this._backend.globalCompositeOperation;this.strokeStyle=this._backend.strokeStyle;this.fillStyle=this._backend.fillStyle;this.lineWidth=this._backend.lineWidth;this.lineCap=this._backend.lineCap;this.lineJoin=this._backend.lineJoin;
this.miterLimit=this._backend.miterLimit;this.shadowOffsetX=this._backend.shadowOffsetX;this.shadowOffsetY=this._backend.shadowOffsetY;this.shadowBlur=this._backend.shadowBlur;this.shadowColor=this._backend.shadowColor;this.font=this._backend.font;this.textAlign=this._backend.textAlign;this.textBaseline=this._backend.textBaseline;if(this._stateStack.length>0)this.transformMatrix=this._stateStack.pop();if(this._pathStack.length>0)this._path=this._pathStack.pop();return this},translate:function(a,b){this._tracePathBounds&&
this.transformMatrix.translate(a,b);this._backend.translate(a,b);return this},rotate:function(a){this._tracePathBounds&&this.transformMatrix.rotate(a);this._backend.rotate(a);return this},scale:function(a,b){this._tracePathBounds&&this.transformMatrix.scale(a,b);this._backend.scale(a,b);return this},transform:function(a,b,c,d,e,h){this._tracePathBounds&&this.transformMatrix._transform(arguments);this._backend.transform(a,b,c,d,e,h);return this},setTransform:function(a,b,c,d,e,h){this._tracePathBounds&&
this.transformMatrix._setTransform(arguments);this._backend.setTransform(a,b,c,d,e,h);return this},drawImage:function(a,b,c,d,e,h,g,k,m){if(arguments.length===3)this._backend.drawImage(a,b,c);else if(arguments.length===5)this._backend.drawImage(a,b,c,d,e);else arguments.length===9&&this._backend.drawImage(a,b,c,d,e,h,g,k,m);return this},createImageData:function(a,b){return a&&b?new p(a,b,null,this._useRawImageData):new p(a,null,null,this._useRawImageData)},getImageData:function(a,b,c,d){if(arguments.length==
1){b=a.y;c=a.width;d=a.height;a=a.x}if(this._isFlashBackend)return null;var e=this._backend.getImageData(a,b,c,d);return this._useRawImageData?new p(c,d,e):(new p(1,1)).__fromCanvasData(e)},putImageData:function(a,b,c,d,e,h,g){f.assertImageDataIsValid(a);var k;k=this._isFlashBackend?a:this._useRawImageData?a:a.__toCanvasData(this._backend);if(arguments.length==3)this._backend.putImageData(k,b,c);else arguments.length==7&&this._backend.putImageData(k,b,c,d,e,h,g)},createLinearGradient:function(a,b,
c,d){return this._backend.createLinearGradient(a,b,c,d)},createRadialGradient:function(a,b,c,d,e,h){return this._backend.createRadialGradient(a,b,c,d,e,h)},createPattern:function(a,b){b||(b=null);return this._backend.createPattern(a,b)},fillText:function(a,b,c,d){this._backend.fillText(a,b,c,d||null);return this},strokeText:function(a,b,c,d){this._backend.strokeText(a,b,c,d||null);return this},measureText:function(a){return this._backend.measureText(a)},isPointInPath:function(a,b){if(arguments.length==
1){b=a.y;a=a.x}if(this._isFlashBackend)return this._tracePathBounds?this.isPointInPathBounds(a,b):false;else{if(i.platform.isFirefox){this._backend.save();this._backend.setTransform(1,0,0,1,0,0);var c=this._backend.isPointInPath(a,b);this._backend.restore();return c}return this._backend.isPointInPath(a,b)}},isPointInPathBounds:function(a,b){if(arguments.length==1){b=a.y;a=a.x}var c=this._bounds,d=this.transformMatrix.matrix,e={x:a,y:b};d[0]==1&&d[1]==0&&d[2]==0&&d[3]==1&&d[4]==0&&d[5]==0||(e=this.transformMatrix.clone().invert().multiplyPoint(e));
return c.isPointWithin(e)},ifPointInPath:function(a,b,c){c(this.isPointInPath(a,b));return this},getPathBounds:function(){return this._bounds.clone()},set:function(a,b){this[a]=b;return this},globalAlpha:f.defProp.globalAlpha,globalCompositeOperation:f.defProp.globalCompositeOperation,strokeStyle:f.defProp.strokeStyle,fillStyle:f.defProp.fillStyle,shadowOffsetX:f.defProp.shadowOffsetX,shadowOffsetY:f.defProp.shadowOffsetY,shadowBlur:f.defProp.shadowBlur,shadowColor:f.defProp.shadowColor,lineWidth:f.defProp.lineWidth,
lineCap:f.defProp.lineCap,lineJoin:f.defProp.lineJoin,miterLimit:f.defProp.miterLimit,font:f.defProp.font,textAlign:f.defProp.textAlign,textBaseline:f.defProp.textBaseline,setGlobalAlpha:function(a){this.globalAlpha=a;return this},setGlobalCompositeOperation:function(a){this.globalCompositeOperation=a;return this},setStrokeStyle:function(a){this.strokeStyle=a;return this},setFillStyle:function(a){this.fillStyle=a;return this},setShadowOffsetX:function(a){this.shadowOffsetX=a;return this},setShadowOffsetY:function(a){this.shadowOffsetY=
a;return this},setShadowBlur:function(a){this.shadowBlur=a;return this},setShadowColor:function(a){this.shadowColor=a;return this},setLineWidth:function(a){this.lineWidth=a;return this},setLineCap:function(a){this.lineCap=a;return this},setLineJoin:function(a){this.lineJoin=a;return this},setMiterLimit:function(a){this.miterLimit=a;return this},setFont:function(a){this.font=a;return this},setTextAlign:function(a){this.textAlign=a;return this},setTextBaseline:function(a){this.textBaseline=a;return this},
invoke:function(){this._backend._invoke(arguments)},dummy:function(){this._backend.dummy()},__rgbaStyle:function(a,b,c,d){return["rgba(",[a,b,c,d].join(","),")"].join("")},__rgbStyle:function(a,b,c){return["rgb(",[a,b,c].join(","),")"].join("")},setFillStyleRGBA:function(a,b,c,d){this.fillStyle=this.__rgbaStyle(a,b,c,d);return this},setStrokeStyleRGBA:function(a,b,c,d){this.strokeStyle=this.__rgbaStyle(a,b,c,d);return this},setFillStyleRGB:function(a,b,c){this.fillStyle=this.__rgbStyle(a,b,c);return this},
setStrokeStyleRGB:function(a,b,c){this.strokeStyle=this.__rgbStyle(a,b,c);return this},constructor:f.extCanvasRenderingContext2D};q.prototype=i.Rectangle();i.object.extend(q.prototype,{addKnot:function(a,b){var c=i.Point(this.x,this.y).vectorTo(a,b);if(this.knots){if(c.x<0){this.x+=c.x;this.width-=c.x}else if(this.x+c.x>this.x+this.width)this.width=c.x;if(c.y<0){this.y+=c.y;this.height-=c.y}else if(this.y+c.y>this.y+this.height)this.height=c.y}else{this.x=a;this.y=b;this.height=this.width=0}this.knots++},
clear:function(){this.knots=this.x=this.y=this.width=this.height=0},expandBox:function(a,b,c,d){this.addKnot(a,b);this.addKnot(a+c,b+d)},clone:function(){return new q(this.x,this.y,this.width,this.height)}});f.ImageData=p;p.prototype={data:null,__toCanvasData:function(a){if(this.__useCache&&this.__cachedData)return this.__cachedData;a=i.platform.isOpera?{width:this.width,height:this.height,data:Array(this.width*this.height*4)}:a.createImageData(this.width,this.height);for(var b,c,d=0;d<this.height;d++)for(var e=
0;e<this.width;e++){c=d*4*this.width+e*4;b=this.data[d*this.width+e];a.data[c]=b>>24&255;a.data[c+1]=b>>16&255;a.data[c+2]=b>>8&255;a.data[c+3]=b&255}if(this.__useCache)this.__cachedData=a;return a},__fromCanvasData:function(a){this.width=a.width;this.height=a.height;this.data=i.VectorArray(this.width*this.height,i.Uint(32));for(var b,c,d,e,h=0;h<this.height;h++)for(var g=0;g<this.width;g++){b=h*4*this.width+g*4;c=a.data[b];d=a.data[b+1];e=a.data[b+2];b=a.data[b+3];this.data[h*this.width+g]=(c<<24)+
(d<<16)+(e<<8)+b}return this},__destroy:function(){this.width=this.height=this.data=null},toString:function(){return"ImageData["+this.data.length+"]"},clone:function(){var a=new p(this.width,this.height);a.data.set(this.data);return a}};f.assertImageDataIsValid=function(a){a.width&&isFinite(a.width)&&a.height&&isFinite(a.height)&&a.data&&a.data.length||f.throwException("TYPE_MISMATCH_ERR")};f.CanvasPath=function(){this.length=0;this._stack=[];this._serial=[];this._ie=i.platform.ie};f.CanvasPath.prototype=
{__copy:function(a,b){for(var c,d,e,h,g=0;g<a._stack.length;g++){c=a._stack[g][0];e=a._stack[g][1];d=e.length;h=[];for(var k=0;k<d;k++)h[k]=e[k];b._stack[g]=[c,h];if(this._ie)b._serial[g]=a._serial[g]}},pop:function(){this._ie&&this._serial.pop();return this._stack.pop()},push:function(a){this[a[0]].apply(this,a[1])},clone:function(){var a=new f.CanvasPath;this.__copy(this,a);a.length=this.length;return a},append:function(a){this.__copy(a,this);this.length+=a.length},moveTo:function(a,b){var c=[a,
b];if(this._ie)this._serial[this.length]=["B",a,"\u0001",b].join("");this._stack[this.length]=["moveTo",c];this.length++},lineTo:function(a,b){var c=[a,b];if(this._ie)this._serial[this.length]=["C",a,"\u0001",b].join("");this._stack[this.length]=["lineTo",c];this.length++},arcTo:function(a,b,c,d,e){a=[a,b,c,d,e];if(this._ie)this._serial[this.length]=["G",a.join("\u0001")].join("");this._stack[this.length]=["arcTo",a];this.length++},vectorTo:function(a,b,c){a=[a,b,c];if(this._ie)this._serial[this.length]=
["B",a.join("\u0001")].join("");this._stack[this.length]=["vectorTo",a];this.length++},bezierCurveTo:function(a,b,c,d,e,h){a=[a,b,c,d,e,h];if(this._ie)this._serial[this.length]=["E",a.join("\u0001")].join("");this._stack[this.length]=["bezierCurveTo",a];this.length++},quadraticCurveTo:function(a,b,c,d){a=[a,b,c,d];if(this._ie)this._serial[this.length]=["D",a.join("\u0001")].join("");this._stack[this.length]=["quadraticCurveTo",a];this.length++},arc:function(a,b,c,d,e,h){a=[a,b,c,d,e,h];if(this._ie)this._serial[this.length]=
["F",a.join("\u0001")].join("");this._stack[this.length]=["arc",a];this.length++},rect:function(a,b,c,d){a=[a,b,c,d];if(this._ie)this._serial[this.length]=["H",a.join("\u0001")].join("");this._stack[this.length]=["rect",a];this.length++},close:function(){if(this._ie)this._serial[this.length]="K";this._stack[this.length]=["close"];this.length++},toSVGString:function(){},toString:function(a){if(this._ie){if(a==undefined)a="\u0001";return[this._serial.join(a),a].join("")}return"CanvasPath[]"}};f.CanvasEvent=
{FRAME:"1",RESIZE:"2"};if(!l.extCanvasRenderingContext2D)l.extCanvasRenderingContext2D=f.extCanvasRenderingContext2D;if(!l.ImageData)l.ImageData=f.ImageData;if(!l.CanvasPath)l.CanvasPath=f.CanvasPath;l.attachEvent&&l.attachEvent("onbeforeunload",n)})});$Unit(__PATH__,__FILE__,function(i,j){i.Import("platform");i.Package("buz.fxcanvas",function(l){function f(c,d){var e=this.menuEl=j.createElement("CanvasContextMenu");this.config=c;this.handlers=d;var h=0;this.selectedElement=null;this.elements=[];for(var g,k=0;k<c.length;k++){g=c[k];if(typeof g=="string"&&g.match(/[\-]+/)){g=j.createElement("hr");h+=13}else{var m=d[g.id],o=g.label[q]||g.label[p]||"<entry>";g=j.createElement("CanvasContextMenuEntry");g.onmouseenter=function(){this.contextMenu.selectedElement=
this;this.style.background=a.highlight;this.style.color=a.highlightText};g.onmouseleave=function(){this.contextMenu.selectedElement=null;this.style.background=a.background;this.style.color=a.menuText};g.style.background=a.background;g.innerHTML=g.label=o;g.contextMenu=this;g.entryHandler=m;h+=n?20:18}e.appendChild(g);this.elements.push(g)}e.style.height=h+"px"}if(i.platform.isIE){var q=navigator.browserLanguage,p="en",n=i.platform.ie<=6||j.documentMode<7||"",a={background:"Menu",menuText:"MenuText",
greyText:"GreyText",border:"ButtonShadow",highlight:"Highlight",highlightText:"HighlightText",font:"normal 8pt Tahoma, Arial"},b=["CanvasContextMenu{margin:0px;padding:2px;background-color:",a.background,";border:1px solid ",a.border,";position:absolute;top:0px;left:0px;zIndex:999;float:none;overflow:visible;text-align:left;max-width: 300px;display:block;clear:both;color:",a.menuText,";font:",a.font,";height:1px;",n&&"width:0;","}CanvasContextMenuEntry{text-align:left;margin:0px;padding:2px 5px 0px 24px;color:",
a.menuText,";white-space:nowrap;cursor:default;float:none;display:block;overflow:visible;border:0;background-color:",a.background,";height:",n?19:16,"px;font:",a.font,";",n&&"float:left;clear:left;width:0","}",n&&"CanvasContextMenu hr{","float:left;clear:left;padding:0;margin:3px 0px 0px 0px;height:0px}"].join("");j.createStyleSheet().cssText=b;f.prototype={hide:function(){},show:function(c,d){var e=this;if(!e.selectedElement){var h=function(){j.detachEvent("onmousedown",h);var m=e.selectedElement;
if(m){m.entryHandler&&m.entryHandler();m.style.background=a.background;m.style.color=a.menuText;e.selectedElement=null}try{j.body.removeChild(e.menuEl)}catch(o){}};this.menuEl.style.top=d+"px";this.menuEl.style.left=c+"px";j.body.appendChild(this.menuEl);if(n){for(var g=[],k=0;k<this.elements.length;k++)g.push(this.elements[k].offsetWidth);g.sort();maxWidth=g.pop();for(k=0;k<this.elements.length;k++){g=this.elements[k];g.style.minWidth=g.style.width=maxWidth-(g.tagName==="HR"?0:29)+"px"}this.menuEl.style.width=
maxWidth+"px"}j.attachEvent("onmousedown",h)}}};l.ContextMenu=f}})});

/**
 * Base Class for uploaders
 *
 * @param options
 * @constructor
 */
var ImageUploader = function(options){
    jQuery.extend(this, options);
};

ImageUploader.ERROR = {
    UNKNOWN : 0,
    FILE_TYPE : 1,
    FILE_SIZE : 2,
    UPLOAD : 3,
    READING_FILE : 4,
    SCALING_IMAGE : 5,

    RESPONSE : 100
};

ImageUploader.prototype = {

    imageUploaderHolder : 'image-uploader-holder',  //Holder for FileSelector and Dropbox area
    queueHolder : "image-uploader-queue-holder",    //Holder for queue

    queueItemTemplate : "image-uploader-queue-item-template",

    fileSizeLimit :5242880,

    uploaderUrl : "",
    extraHeaders : {},

    maxImageHeight : 625,
    maxImageWidth: 625,

    allowedFileTypes : [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif"
    ],

    backgroundColor : "#FFFFFF",

    buttonClass: 'button',
    buttonText: 'Browse ..',

    dropBoxClass: 'dropbox',
    dropBoxText: 'Drop files here',

    //Protected functions
    initDropBox : function(){},                         //Override
    initFileSelector : function(){},                    //Override

    //Public functions
    onUploadSuccess : function(file, data){},               //Override
    onUploadError : function(file, errorCode){},             //Override
    onUploadAborted : function(file){},                     //Override
    onSelectFile : function(file){ return true; },         //Override for controlling upload

    constructor : ImageUploader,

    init : function() {
        this.initFileSelector();
        this.initDropBox();
    },

    handleFiles : function (files, e){
        for(var i=0; i < files.length; i++ ) {
            var file = files[i];

            if (! this.isValidFileType(file) ){
                this.uploadError(file, ImageUploader.ERROR.FILE_TYPE);
                continue;
            }
            if ( file.size > this.fileSizeLimit ) {
                this.uploadError(file, ImageUploader.ERROR.FILE_SIZE);
                continue;
            }
            if(this.onSelectFile(file)) {
                this.uploadFile(file);
            }
        }
    },

    uploadFile : function(file){
        var self = this;
        var reader = new FileReader();
        reader.onloadend = function(e) {
            self.startProgress(file, { image : e.target.result, percent : -1 } );
            var callback = function(data) {
                if(!data) {
                    self.uploadError(file, ImageUploader.ERROR.SCALING_IMAGE);
                } else {
					if( ImageUploader.detects.supportDataUri ) {
		                var img = jQuery('<img />');
		                jQuery(img).bind({
		                    load: function() {
		                        self.sendFile(file, data);
		                    },
		                    error: function() {
		                        self.uploadError(file, ImageUploader.ERROR.SCALING_IMAGE);
		                    }
		                });
		                jQuery(img).attr('src',data);
					} else {
	                    self.sendFile(file, data);
					}
                }
            };
            self.scaleImage(e.target.result, callback);
        };
        reader.onabort = function(e){
            self.uploadError(file, ImageUploader.ERROR.READING_FILE);
        };
        reader.onerror = function(e){
            self.uploadError(file, ImageUploader.ERROR.READING_FILE);
        };
        reader.readAsDataURL(file);
    },

    scaleImage: function(data, onScaleEnds) {
        var self = this;

        var mimeType = self.getDataURLMimeType(data);

        var img = new Image();
        img.style.display = 'none';

        var canvas = document.createElement("canvas");
        canvas.style.display = 'none';
        var context = canvas.getContext("2d");

        img.onload = function() {

            var canvasCopy = document.createElement("canvas");
            canvasCopy.style.display = 'none';
            var copyContext = canvasCopy.getContext("2d");

            var ratio = 1;
            if( img.width > self.maxImageWidth || img.height > self.maxImageHeight ) {
                var ratio1 = self.maxImageWidth / img.width;
                var ratio2 = self.maxImageHeight / img.height;
                ratio = ratio1 > ratio2 ? ratio1 : ratio2;
            }
            canvasCopy.width = img.width;
            canvasCopy.height = img.height;

            copyContext.drawImage(img, 0, 0);

            canvas.width = parseInt(img.width * ratio, 10);
            canvas.height = parseInt(img.height * ratio, 10);

            context.fillStyle = self.backgroundColor;
            context.fillRect(0,0,canvas.width, canvas.height);

            context.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);

            onScaleEnds(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = function(){
            onScaleEnds(false);
        };
        img.src = data;
    },

    sendFile : function(file, data) {
        var self = this;
        var queueItem = self._queue[file.name];

        var toSend = self.getSendData( data );


        toSend.name = toSend.uploadName = file.name;
        var endsWith = function(string, suffix){
            string.indexOf(suffix, string.length - suffix.length) !== -1
        };
        if( !endsWith(file.name, "jpg") ){
            toSend.uploadName = file.name.substring( 0, file.name.length - 4 ) + ".jpg";
        }

        var getProvider = function(){
            var xhr = jQuery.ajaxSettings.xhr();
            if (xhr.upload) {
                xhr.upload.addEventListener('progress', function (event) {
                    self.updateProgress(file, { percent : 0 } );
                    if (event.lengthComputable) {
                        var percent = parseInt( event.loaded * 100 / event.total , 10);
                        self.updateProgress(file, { percent : percent, bytesLoaded : event.loaded , bytesTotal : event.total } );
                    }
                }, false);
            }
            queueItem.bind("uploadAborted", function(){
                xhr.abort();
            });
            return xhr;
        };
        var onSuccess = function(data, textStatus, jqXHR){
            self.uploadSuccess(toSend, data);
        };
        var onError = function(data, textStatus, jqXHR){
            self.uploadError(toSend, ImageUploader.ERROR.UPLOAD);
        };

        var headers = jQuery.extend(self.extraHeaders, {
            'File-Name' : toSend.uploadName,
            'File-Size': toSend.size,
            'File-Content-Type': toSend.contentType,
            'File-Is-Encoded': ! toSend.binaryData
        });

        jQuery.ajax({
            type: 'POST',
            url: self.uploaderUrl,
            data:  toSend.binaryData ? toSend.binaryData :toSend.encodedData,
            xhr: getProvider,
            cache: false,
            contentType: false,
            dataType:'json',
            headers: headers,
            processData : false,
            success: onSuccess,
            error: onError
        });
    },

    _queue : {},

    startProgress : function(file, params) {
        var self = this;
        var queueItem = jQuery( "#" + this.queueItemTemplate )
            .simpleTmpl( {
                id: file.name,
                fileName : file.name,
                fileSize : parseInt(file.size / 1024, 10)
            });

        if(!params.image) {
            jQuery('.thumbnail', queueItem).css("display", "none");
        } else {
            jQuery('.thumbnail img', queueItem).attr("src", params.image);
        }
        if(params.percent < 0 ){
            jQuery('.progress', queueItem)
                .css("width", "100%")
                .addClass("progress-undet");
            jQuery('.progress-info', queueItem).hide();
        }
        queueItem.appendTo( '#'+ this.queueHolder).slideDown("fast");
        jQuery('.upload_abort', queueItem).bind("click", function(){
            self.abortUpload(file);
        });
        this._queue[file.name] = queueItem;
    },

    updateProgress : function(file , params ) {
        var queueItem = this._queue[file.name];

        if( jQuery(".progress-holder span", queueItem).hasClass("progress-undet") ) {
            jQuery('.progress-undet', queueItem)
                .css("margin-left", 0)
                .css("width", 0)
                .removeClass("progress-undet");
            jQuery('.progress-info', queueItem).show();
        }
        jQuery(".progress", queueItem).css("width", params.percent + "%");
        jQuery(".percents", queueItem).html(" "+( params.percent ).toFixed(0) + "%");

        if( params.bytesLoaded ) {
            jQuery(".up-done", queueItem).html(( parseInt( params.bytesLoaded / 1024, 10)).toFixed(0));
        }
        if( params.bytesTotal ) {
            jQuery(".up-size", queueItem).html(( parseInt( params.bytesTotal / 1024, 10)).toFixed(0));
        }
    },

    uploadSuccess : function(file, data) {
        var self = this;
        var queueItem = self._queue[file.name];

        if( !jQuery(".progress", queueItem).hasClass("progress-undet") ) {
            jQuery(".progress", queueItem).css("width","100%");
        }

        jQuery(".percents", queueItem).html("100%");
        jQuery(".up-done", queueItem).html((parseInt(file.size / 1024, 10)).toFixed(0));

        setTimeout(function(){
            queueItem.fadeOut("slow", function() {
                queueItem.remove();
                if( typeof self.onUploadSuccess === "function" ) {
                    self.onUploadSuccess.call(self, file, data);
                    delete self._queue[file.name];
                }
            });
        }, 100);
    },

    abortUpload : function(file) {
        var self = this;
        var queueItem = self._queue[file.name];

        queueItem.trigger("uploadAborted");
        queueItem.fadeOut("slow", function(){
            queueItem.remove();
            self.onUploadAborted.call(self, file);
            delete self._queue[file.name];
        });
    },

    uploadError : function(file, errorCode) {
        var self = this;
        var queueItem = self._queue[file.name];
        if(queueItem) {
            queueItem.fadeOut("slow", function(){
                queueItem.remove();
                self.onUploadError.call(self, file, errorCode);
                delete self._queue[file.name];
            });
        } else {
            self.onUploadError.call(self, file, errorCode);
        }
    },

    getSendData : function(dataURL) {
        var realDataURL = dataURL.split(',')[1];
        return { encodedData : realDataURL, binaryData : false, size : realDataURL.length, contentType: this.getDataURLMimeType(dataURL) };
    },

    getDataURLMimeType : function(dataURL) {
        var data = dataURL.split(',')[0];
        return data.substr(5).split(';')[0];
    },

    isValidFileType: function(file) {
        return ( jQuery.inArray(file.type, this.allowedFileTypes ) >= 0 );
    },

    _lastInputFileId: 0
};

/**
 * Html5 Uploader
 *
 * @param options
 * @constructor
 */
var ImageUploaderHTML5 = function(options) {
    jQuery.extend(this, options);
    this.init();
};
ImageUploaderHTML5.prototype.parent = new ImageUploader();
jQuery.extend( ImageUploaderHTML5.prototype, ImageUploaderHTML5.prototype.parent, {

    initDropBox : function() {
        var self = this;

        var dEventDefault = function(e) {
            e.stopPropagation();
            e.preventDefault();
        };
        var dEventDragEnter = function(e) {
            jQuery(self._dropBox).addClass("active");
            dEventDefault(e);
        };

        var dEventDragOver = function(e) {
            dEventDefault(e);
        };

        var dEventDragLeave = function(e) {
            var related = e.relatedTarget, inside = false;
            if (related !== this) {
                if (related) {
                    inside = jQuery.contains(this, related);
                }
                if (!inside) {
                    jQuery(self._dropBox).removeClass("active");
                }
            }
            dEventDefault(e);
        };

        var dEventDrop = function(e) {
            jQuery(self._dropBox).removeClass("active");
            dEventDefault(e);

            var dt = e.dataTransfer;
            var files = dt.files;

            self.handleFiles(files,e);
        };

        self._dropBox = jQuery("<div />").addClass(self.dropBoxClass).html(self.dropBoxText);

        jQuery("#" + self.imageUploaderHolder).append(self._dropBox);

        self._dropBox.get(0).addEventListener("dragenter", dEventDragEnter, false);
        self._dropBox.get(0).addEventListener("dragleave", dEventDragLeave, false);
        self._dropBox.get(0).addEventListener("dragover", dEventDragOver, false);
        self._dropBox.get(0).addEventListener("drop", dEventDrop, false);
        self._dropBox.show();
    },

    initFileSelector: function() {
        var self = this;

        self._inputFileId = "imageUploader_" + ++self._lastInputFileId;
        self._inputFile = jQuery("<input />")
            .attr("type", "file")
            .attr("id", self._inputFileId )
            .attr("multiple", "true")
            .attr("accept", "image/*")
            .attr("name", "Filedata")
        ;
        this._inputFile.css(
            {
                left : "-1000px",
                top : 0,
                position : "absolute"
            }
        );
        self._buttonFile = jQuery("<input />")
            .attr("type", "button")
            .attr("value", self.buttonText)
            .addClass(self.buttonClass)
        ;
        var buttonWrap = jQuery("<div class='image-uploader-button-wrap' />")
            .css({
                position : "relative",
                overflow : "hidden",
                display: "inline-block"

            }).append(self._inputFile).append(self._buttonFile);
        jQuery("#" + self.imageUploaderHolder).append(buttonWrap);

        self._buttonFile.bind("click", function(){
            if( jQuery.browser.msie ){
                var curFileInput = self._inputFile;
                var newFileInput = curFileInput.clone(true);
                self._inputFile = newFileInput;
                curFileInput.remove();
            } else {
                self._inputFile.val("");
            }
            self._inputFile.trigger("click");
        });

        self._inputFile.bind('change', function(event){
            self.handleFiles(this.files, event);
        });
    },

    getSendData : function(dataURL) {

        var realDataURL = dataURL.split(',')[1];

        var blob = this.dataURLToBlob(dataURL);

        if(blob && window.FormData){
            var fd = new FormData();
            fd.append('Filedata', blob);
            return { encodedData : realDataURL, binaryData : fd, size : blob.size, contentType: this.getDataURLMimeType(dataURL) };
        } else {
            return { encodedData : realDataURL, binaryData : false, size : realDataURL.length, contentType: this.getDataURLMimeType(dataURL) };
        }
    },

    supportBlobConstructor : (function(){
        try {
            new Blob();
        } catch (e) {
            return false;
        }
        return true;
    })(),

    dataURLToBlob : function(dataURL) {
        var binaryData = this.dataURLToBinary(dataURL);

        if( window.Uint8Array ) {
            //Support here: http://caniuse.com/typedarrays
            var buffer = new ArrayBuffer(binaryData.length);
            var ui8a = new Uint8Array(buffer, 0);
            for (var i = 0; i < binaryData.length; i++) ui8a[i] = (binaryData.charCodeAt(i) & 0xff);

            if( this.supportBlobConstructor ) {
                return new Blob([ui8a], { type: this.getDataURLMimeType(dataURL) });
            } else {
                var foundBlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.OBlobBuilder || window.msBlobBuilder;
                if( foundBlobBuilder ) {
                    var blobBuilder = new (foundBlobBuilder);
                    if(blobBuilder){
                        blobBuilder.append(buffer);
                        return blobBuilder.getBlob(this.getDataURLMimeType(dataURL));
                    }
                }
            }
        }
        return false;
    },

    dataURLToBinary: function(dataURL) {
        var binaryData;
        if (dataURL.split(',')[0].indexOf('base64') >= 0) {
            binaryData = atob(dataURL.split(',')[1]);
        } else {
            binaryData = decodeURIComponent(dataURL.split(',')[1]);
        }
        return binaryData;
    }
});

/**
 * Compat Flash FileReader and fxCanvas
 *
 * @param options
 * @constructor
 */
var ImageUploaderCompat = function(options) {
    jQuery.extend(this, options);
    this.init();
};
ImageUploaderCompat.prototype.parent = new ImageUploader();
jQuery.extend( ImageUploaderCompat.prototype, ImageUploaderCompat.prototype.parent, {

    URLFileReaderJS : "jquery.FileReader.js",
    URLFileReaderSWF : "filereader.swf",
    URLCanvasReplacement : "/imageuploadercanvas.php",

    init : function() {
        var self = this;
        self._loadFileReader().done(function(){
            self.parent.init.call(self);
            if( ! ImageUploader.detects.supportCanvas ) {
                self._initCanvasReplacement();
            }
        });
    },

    initFileSelector : function() {
        var self = this;

        var buttonWrap = jQuery("<div class='image-uploader-button-wrap' />");
        jQuery("#" + self.imageUploaderHolder).append(buttonWrap);

        buttonWrap.css( { display: "inline-block", width: "100%" });

        self._inputFileId = "imageUploader_" + ++self._lastInputFileId;
        self._inputFile = jQuery("<input />")
            .attr("type", "file")
            .attr("id", self._inputFileId )
            .attr("multiple", "true")
            .attr("accept", "image/*")
            .attr("name", "Filedata")
        ;
        this._inputFile.css("display", "none");
        buttonWrap.append(self._inputFile);

        self._buttonFile = jQuery("<input />")
            .attr("type", "button")
            .attr("value", self.buttonText)
            .addClass(self.buttonClass);
        buttonWrap.append(self._buttonFile);

        this._inputFile.fileReader( {
            filereader : this.URLFileReaderSWF,
            button : self._buttonFile,
            callback : function(){
                self._inputFile.bind('change', function(event){
                    self.handleFiles(event.target.files, event);
                });
            }
        });
    },

    _lastDfd : null,

    scaleImage : function(data, onScaleEnds) {
        var self = this;
        if( ! ImageUploader.detects.supportCanvas ) {
            var opts = {
                maxWidth : this.maxImageWidth,
                maxHeight : this.maxImageHeight,
                backgroundColor : this.backgroundColor
            };

            var def = jQuery.Deferred();
            var onScaleEndsReal = function(data){
                onScaleEnds(data);
                def.resolve(true);
            };
            if( ! self._lastDfd ) {
                self._lastDfd = def.promise();
                self._fxCanvasIframe.get(0).contentWindow.imageUploaderScale(data, opts, onScaleEndsReal);
            } else {
                self._lastDfd.then( function(){
                    self._fxCanvasIframe.get(0).contentWindow.imageUploaderScale(data, opts, onScaleEndsReal);
                });
                self._lastDfd = def.promise();
            }
        } else {
            self.parent.scaleImage.call(self, data, onScaleEnds);
        }
    },

    _loadFileReader : function() {
        var deferred = jQuery.Deferred();
        jQuery.ajaxSetup({
            cache: true
        });
        jQuery.getScript( this.URLFileReaderJS ,function(){
            deferred.resolve(true);
        });
        jQuery.ajaxSetup({
            cache: false
        });
        return deferred.promise();
    },

    _initCanvasReplacement : function() {
        this._fxCanvasIframe = jQuery('<iframe src="'+ this.URLCanvasReplacement +'?1" style="width: 1px; height: 1px; display:block; overflow:hidden; z-index: -10;position: absolute; top: 0; left: 0;" ></iframe>');
        this._fxCanvasIframe.appendTo(jQuery("#" + this.imageUploaderHolder));
    }
});


var ImageUploaderDummy = function(options) {
    jQuery.extend(this, options);
    this.init();
};

ImageUploaderDummy.prototype.parent = new ImageUploader();
jQuery.extend( ImageUploaderDummy.prototype, ImageUploaderDummy.prototype.parent, {

    initFileSelector: function() {
        var self = this;

        self._buttonFile = jQuery("<input />")
            .attr("type", "button")
            .attr("value", self.buttonText)
            .attr("disabled", "disabled")
            .addClass(self.buttonClass)
        ;
        jQuery("#" + self.imageUploaderHolder).append(self._buttonFile);
    }
});

/**
 * Detect enviroment
 */

ImageUploader.detects = {
    //supportDataUri : ! ( jQuery.browser.msie && parseInt(jQuery.browser.version) < 9 ),

    supportFileApi : ( typeof FileReader !== "undefined" ),
    supportDnD : 'draggable' in document.createElement('span'),
    supportCanvas : (!!document.createElement('canvas').getContext ),
    supportFlash : ( typeof swfobject !== "undefined" && swfobject.getFlashPlayerVersion().major >= 10 )    
};
//Support dataUri test
(function(detects){
    detects.supportDataUri = true;
    if( jQuery.browser.msie && parseInt(jQuery.browser.version) < 9 ){
        detects.supportDataUri = false;
        return;
    }
    var data = new Image();
    data.onload = data.onerror = function(){
        if(this.width != 1 || this.height != 1){
            detects.supportDataUri = false;
        }
    };
    data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
})(ImageUploader.detects);

ImageUploader.detectAndCreate = function(options) {
    if(ImageUploader.detects.supportFileApi) {
        return new ImageUploaderHTML5(options);
    } else if( ImageUploader.detects.supportFlash ) {
        return new ImageUploaderCompat(options);
    } else {
        return new ImageUploaderDummy(options);
    }
    return false;
};

ImageUploader.getDefault = function(options) {

    var params = jQuery.extend(options, {

        onUploadSuccess : function(file, result) {
            imageUploaderFrontend.decQueue();
            if(result.success) {
				/*
                if( ImageUploader.detects.supportDataUri ) {
                    result.imageUrl="data:" + file.contentType + ";base64," + file.encodedData;
                }
                */
                imageUploaderFrontend.addImage(result);
            } else {
                imageUploaderFrontend.showError(file.name, ImageUploader.ERROR.RESPONSE);
            }
        },
        onSelectFile : function(file) {
            var canUpload = ( imageUploaderFrontend.queueQty + imageUploaderFrontend.imageQty ) < imageUploaderFrontend.maxImagesQty;
            if(!canUpload) {
                imageUploaderFrontend.showMaxExceededError(file.name);
            } else {
                imageUploaderFrontend.incQueue();
            }
            return canUpload;
        },
        onUploadError : function(file, errorCode) {
            imageUploaderFrontend.decQueue();
            imageUploaderFrontend.showError(file.name, errorCode);
        }
    });

    return this.detectAndCreate(params);
};

/**
 * Default imageUploaderFrontend
 */
var imageUploaderFrontend = {
    
    MSG_ERROR : 'Error',
    MSG_ERROR_FILE_TYPE : 'FileType Error',    
    MSG_ERROR_FILE_SIZE : 'File size Error',
    MSG_ERROR_MAX_EXCEEDED : 'Max images exceeded',

    maxImagesQty : 20,

    imageQty : 0,
    queueQty : 0,

    incQueue : function(){
        this.queueQty++;
    },
    decQueue : function(){
        this.queueQty--;
        if(this.queueQty < 0) {
            this.queueQty = 0;
        }
    },

    updateQuantity : function (increment) {
        this.imageQty = this.imageQty + increment;
        jQuery("#imageQty").val(this.imageQty);
    },

    addImage : function(imageData) {
        var self = this;

        var item = jQuery( "#image-uploader-uploaded-item-template" )
            .simpleTmpl( {
                id          : imageData.id,                
                fileName    : imageData.fileName
            });		
		
		$("img", item).attr('src', imageData.imageUrl );
        item.attr("id", 'image-uploader-uploaded-item-' + imageData.id)
            .attr("rel", imageData.id)
            .appendTo('#image-uploader-uploaded-holder').fadeIn();
		
        //Update quantity
        this.updateQuantity(1);
    },

    removeImage : function(imageId, fileName) {

        var self = this;
        var item = jQuery('#'+ imageId);

        var realRemoveImage = function() {
			
			jQuery("#image-queue-holder span[rel='max_exceeded']").fadeOut("slow", function(){
				jQuery(this).remove();
			});			
			
            item.fadeOut("fast", function() {
                item.remove();
            });
            self.updateQuantity(-1);
        };
        
        if( item.length ) {        
            realRemoveImage();
        } else {
            return false;
        }
    },

    showError : function(fileName, errorCode ) {
        var msg;
        if( errorCode === ImageUploader.ERROR.FILE_TYPE ) {
            msg = fileName + " " + this.MSG_ERROR_FILE_TYPE;
        } else {
            msg = fileName + " " + this.MSG_ERROR;
        }
        this.addError(msg);
    },

    showMaxExceededError : function(fileName) {
        if( jQuery("#image-queue-holder span[rel='max_exceeded']").length ) {
            return;
        }
        var item = this.addError(this.MSG_ERROR_MAX_EXCEEDED);
        item.attr("rel", "max_exceeded");
    },

    addError : function(msg) {
        var item = jQuery( "#image-uploader-queue-error-template" )
            .simpleTmpl( {
                errorDesc          : msg
            });

        item.appendTo("#image-queue-holder").fadeIn();

		/*
        jQuery("a.uploaderCloseError", item).bind("click", function(){
            item.fadeOut("slow", function(){
                item.remove();
            });
        });
        */ 
        return item;
    }
};

/**
 * Simple template for jQuery
 * @param tmpl
 * @param data
 */
(function($){
    $.fn.simpleTmpl = function(data) {
        var html = $('<div />').append( $(this).clone().removeAttr("id")).html() ;
        for(var i in data) {
            html = html.replace( new RegExp("\\$\\{"+ i +"\\}", 'g') , data[i]);
        }
        return $(html);
    };
})(jQuery);

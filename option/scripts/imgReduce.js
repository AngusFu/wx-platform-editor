(function () {
  function dataURItoBlob(dataURI) {
    var byteString,
      mimestring;

    if (dataURI.split(',')[0].indexOf('base64') !== -1) {
      byteString = atob(dataURI.split(',')[1])
    } else {
      byteString = decodeURI(dataURI.split(',')[1])
    }

    mimestring = dataURI.split(',')[0].split(':')[1].split(';')[0]

    var content = new Array();
    for (var i = 0; i < byteString.length; i++) {
      content[i] = byteString.charCodeAt(i)
    }

    var blobImg,
      arrays = new Uint8Array(content);
    try {
      blobImg = new Blob([arrays], {
        type: mimestring
      });
    } catch (e) {}
    return blobImg;
  }

  function imgScale(src, opt, cbk) {
    if (!src) return cbk(false)
    var _canvas = document.createElement('canvas')
    var tImg = new Image();
    tImg.onload = function () {
      var _context = _canvas.getContext('2d'),
        tw = this.width * opt.scale,
        th = this.height * opt.scale;
      _canvas.width = tw;
      _canvas.height = th;

      _context.drawImage(tImg, 0, 0, tw, th);

      src = _canvas.toDataURL(opt.type, opt.quality)
      var blob = dataURItoBlob(src)
      cbk(blob)
    };
    tImg.src = src
  }

  /* opt {quality :0-1}*/
  function imageReduce(files, cbk, opts) {
    var opt = {
      scale: 0.9,
      quality: 0.8,
      type: 'image/jpeg'
    };

    Object.assign(opt, (opts || {}))

    if (opt.scale == 1 || 1 == opt.quality) return cbk(files)

    if (Object.prototype.toString.call(files) !== "[object Array]") {
      files = [files];
    }

    var files_count = files.length,
      ret = [];

    for (var i = 0, j = files.length; i < j; i++) {
      var fReader = new FileReader();
      fReader.onload = function (e) {
        var result = e.target.result
        imgScale(result, opt, function (file) {
          file && ret.push(file)
          files_count--
          if (files_count <= 0) cbk && cbk(ret)
        })
      };
      fReader.readAsDataURL(files[i]);
    }
  }

  window.imgReduce = function (files, opt) {
    return new Promise(resolve => {
      imageReduce(files, (files) => {
        resolve(files);
      }, opt);
    });
  };
})();
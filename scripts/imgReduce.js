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

  function imageReduce(file, cbk, opts) {
    var opt = Object.assign({}, {
      scale: .9,
      quality: .99,
      type: 'image/jpeg'
    }, (opts || {}));

    var fReader = new FileReader();
    fReader.onload = function (e) {
      var result = e.target.result
      imgScale(result, opt, function (file) {
        cbk(file);
      });
    };
    fReader.readAsDataURL(file);
  }

  window.imgReduce = function (files, opt) {
    return new Promise(resolve => {
      imageReduce(files, (files) => {
        resolve(files);
      }, opt);
    });
  };
})();
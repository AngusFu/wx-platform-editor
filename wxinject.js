/**
 * basic utils
 */
const qsa = (sel) => Array.from(document.querySelectorAll(sel));
const isVisible = (el) => {
  let rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/**
 * weixin editor element BODY
 */
const getWxEditor = () => {
  let visibleFrames = qsa('iframe[id^=ueditor_]').filter(isVisible);
  if (!visibleFrames.length) {
    return null;
  }
  return visibleFrames[0].contentDocument.body;
};

/**
 * random filename
 * 
 * @retrurn {String}
 */
const guid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toUpperCase();
};

/**
 * random date in the last 50 days
 * 
 * @return {Date}
 */
const getRandomDate = function () {
  return new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 50);
};

/**
 * dataURI to  Blob
 * 
 * @param  {Base64 String} dataURI
 * @return {Blob}
 */
const dataURItoBlob = function (dataURI) {
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
};


/**
 * @method
 * 
 * 通过暴力破解的办法拿到相关参数
 * 然后上传图片
 */
const uploadImage = (function () {
  // 暴力破解
  var scripts = Array.from(document.querySelectorAll('script'));
  var len = scripts.length;
  var content = '';

  while (len--)
    if (content = scripts[len].textContent) {
      if (/try\s*\{\s*window\.wx\s*\=\s*\{\s*\n/m.test(content)) {
        try {
          eval(content);
        } catch (e) {}
        break;
      }
    }

  if (!content || !wx) {
    console.warn('window.wx.data parsing failed!');
    return function () {
      Promise.resolve('{}');
    };
  }

  // groupid=3
  // 默认放到文章配图中去
  // 当然以后也可以通过异步接口拿到所有可用的分组，让用户自己选择
  // https://mp.weixin.qq.com/cgi-bin/filepage?1=1&token=129636898&lang=zh_CN&token=129636898&lang=zh_CN&f=json&ajax=1&random=0.8964656583498374&group_id=0&begin=0&count=10&type=2
  var url = `https://mp.weixin.qq.com/cgi-bin/filetransfer?action=upload_material&f=json&scene=1&writetype=doublewrite&groupid=3&ticket_id=${wx.data.user_name}&ticket=${wx.data.ticket}&svr_time=${wx.data.time}&token=${wx.data.t}&lang=zh_CN&seq=1`;

  return function (base64) {
    var xhr = new XMLHttpRequest();
    var form = new FormData();
    var blob = dataURItoBlob(base64);

    var fileType = blob.type;
    var fileName = guid() + '.' + fileType.replace('image/', '');

    // 直接上传 Blob 对象不可以
    // 修改不了 filename 属性
    // 导致上传失败
    // 估计是微信后台做了验证
    // 
    // File API 出手:
    //  see https://www.w3.org/TR/FileAPI/
    //  
    var file = new File([blob], fileName, {
      type: fileType,
      lastModified: getRandomDate()
    });

    form.append('id', 'WU_FILE_0');
    form.append('name', fileName);
    form.append('type', fileType);
    form.append('lastModifiedDate', file.lastModifiedDate);
    form.append('size', file.size);
    form.append('file', file);
    return new Promise(function (resolve, reject) {

      if (file.size > 2 * 1024 * 1024) {
        console.error('图片大于 2M 请压缩后上传，或使用公众号平台上传！');
        reject();
        return;
      }

      xhr.onreadystatechange = function () {
        if (!/^2\d{2}$/.test(xhr.status) || xhr.readyState < 4) return;
        resolve(xhr.response);
      };

      xhr.onerror = xhr.ontimeout = function () {
        reject();
      };

      xhr.open('POST', url);
      xhr.send(form);
    });

  };
})();

/**
 * error warning images
 */
const ERROR_IMAGES = {
  gif: {
    cdn_url: 'https://mmbiz.qlogo.cn/mmbiz_png/wic3OZ3sEjfwAGmvH7C0ROMb9aAfjvickkJI3TurmjVUd20tGB8fd1kgddYI45OkvcrZlvnu4vAjkS0ibSiafHco5g/0?wx_fmt=png',
    cdn_id: 515897144
  },
  svg: {
    cdn_url: 'https://mmbiz.qlogo.cn/mmbiz_png/wic3OZ3sEjfwAGmvH7C0ROMb9aAfjvickkfIVWBgj34x3hIV71YeDr9S8qCHPZquiaIm5db4jcI4s379QcSyCfAsA/0?wx_fmt=png',
    cdn_id: 515897145
  }
};

const onMessage = {
  noop() {},
  
  shakehands() {
    chrome.runtime.sendMessage(null, {
      type: 'comfirm',
      state: 1
    });
  },

  inject(message) {
    let editor = getWxEditor();
    editor.innerHTML = message.data;
  },

  upload(message) {
    // TODO: fix unsupported types and large pics
    uploadImage(message.data)
      .then(res => JSON.parse(res))
      .then(data => {
        let msg = {
          hash: message.hash,
          type: message.type
        };

        if (data && data['cdn_url']) {
          msg.data = {
            cdn_url: data['cdn_url'],
            cdn_id : data['content']
          };
        } else {
          msg.err = JSON.stringify(data);
        }

        return msg;
      })
      .catch(e => ({ err: e }))
      .then(msg => chrome.runtime.sendMessage(null, msg));
  }
};

chrome.runtime.onMessage.addListener(function (message) {
  console.info(message);
  (onMessage[message.type] || onMessage['noop'])(message);
});

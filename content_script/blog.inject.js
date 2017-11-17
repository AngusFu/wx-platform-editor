/**
 * 1. upload images on notification `upload`
 * 2. inject HTML on notification `inject`
 */

/**
 * basic utils
 */
const qs  = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const isVisible = el => {
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
 * get related params violently
 * so that we can upload images here,
 * all we need are held by `window.wx`,
 * but we don't have access to global vars here,
 * yet we can reach DOMs.
 * and fortunately `window.wx` was assigned in a 
 * inline script, aha, comes the trick!
 */
const uploadImage = (function () {
  // 暴力破解
  var scripts = Array.from(document.querySelectorAll('script[type="text/javascript"]""]')).filter(s => s.src === '')'');
  var len = scripts.length;
  var content = '';

  while (len--)
    if (content = scripts[len].textContent) {
      if (/try\s*\{\s*[\s\S]*window\.wx\s*\=\s*\{\s*\n/m.test(content)) {
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
  // put all images to the category `文章配图`,
  // in this way, we'll get less bothered.
  // by following API, we can get all available categories:
  // https://mp.weixin.qq.com/cgi-bin/filepage?1=1&token=129636898&lang=zh_CN&token=129636898&lang=zh_CN&f=json&ajax=1&random=0.8964656583498374&group_id=0&begin=0&count=10&type=2
  // in this way, customization is no fairy.
  var url = `https://mp.weixin.qq.com/cgi-bin/filetransfer?action=upload_material&f=json&scene=1&writetype=doublewrite&groupid=3&ticket_id=${wx.data.user_name}&ticket=${wx.data.ticket}&svr_time=${wx.data.time}&token=${wx.data.t}&lang=zh_CN&seq=1`;

  return function (base64) {
    var blob = dataURItoBlob(base64);
    var fileType = blob.type;
    var typeName = fileType.replace('image/', '');
    var fileExt  = typeName === 'svg+xml' ? 'svg' : typeName;
    var fileName = `${guid()}.${fileExt}`;

    // why not Blob directly?
    // since the prop `filename` will not change,
    // uploading work fails.
    // show time for File API:
    // see https://www.w3.org/TR/FileAPI/  
    var file = new File([blob], fileName, {
      type: fileType,
      lastModified: getRandomDate()
    });
    var fileSize = file.size;
    
    return new Promise(function (resolve, reject) {
      // validate first
      // 1. invalid type
      if (!/jpeg|png|gif/i.test(fileExt)) {
        resolve(JSON.stringify(ERROR_IMAGES[fileExt] || ERROR_IMAGES['typeError']));
        return;
      }
      // 2. size of image too large
      if (fileSize >= 2 * 1024 * 1024) {
        resolve(JSON.stringify(
          ERROR_IMAGES[fileExt === 'gif' ? 'gif' : 'sizeError']
        ));
        return;
      }

      var form = new FormData();
      form.append('file', file);
      form.append('name', fileName);
      form.append('type', fileType);
      form.append('size', fileSize);
      form.append('id', 'WU_FILE_0');
      form.append('lastModifiedDate', file.lastModifiedDate);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.send(form);
      xhr.onerror = xhr.ontimeout = reject;
      xhr.onreadystatechange = () => {
        if (/^2\d{2}$/.test(xhr.status) && xhr.readyState === 4) {
          resolve(xhr.response);
        }
      };
    });

  };
})();

/**
 * error warning images
 */
const ERROR_IMAGES = {
  gif: {
    cdn_url: 'https://mmbiz.qlogo.cn/mmbiz_png/wic3OZ3sEjfwAGmvH7C0ROMb9aAfjvickkJI3TurmjVUd20tGB8fd1kgddYI45OkvcrZlvnu4vAjkS0ibSiafHco5g/0?wx_fmt=png',
    cdn_id: 515897144,
    is_placeholder: true
  },
  svg: {
    cdn_url: 'https://mmbiz.qlogo.cn/mmbiz_png/wic3OZ3sEjfwAGmvH7C0ROMb9aAfjvickkfIVWBgj34x3hIV71YeDr9S8qCHPZquiaIm5db4jcI4s379QcSyCfAsA/0?wx_fmt=png',
    cdn_id: 515897145,
    is_placeholder: true
  },
  webp: {
    cdn_url: 'https://mmbiz.qlogo.cn/mmbiz_png/wic3OZ3sEjfyrMXEzibBfqZsMhpl1aoibcK5SJ6Aib3exfj1v0UgNrXUvpibU0dwyESN3uHda5PGRwIRnxL8tA8FqSQ/0?wx_fmt=png',
    cdn_id: 515897167,
    is_placeholder: true
  },
  sizeError: {
    cdn_url: 'https://mmbiz.qlogo.cn/mmbiz_png/wic3OZ3sEjfyrMXEzibBfqZsMhpl1aoibcKj4Cvx37S18WjHrvS8TP4eybIhkdr07B3jzsQbeWUia9hIulnUeNDXSQ/0?wx_fmt=png',
    cdn_id: 515897166,
    is_placeholder: true
  },
  typeError: {
    cdn_url: 'https://mmbiz.qlogo.cn/mmbiz_png/wic3OZ3sEjfyrMXEzibBfqZsMhpl1aoibcKE20R9gsYOuiaz5AZ1ezUbT7iaIuliawQowL0Dibj3ElvJr70K6Q1ChyicdA/0?wx_fmt=png',
    cdn_id: 515897169,
    is_placeholder: true
  }
};

const onMessage = {
  noop() {},

  inject(message) {
    // hide editor "placeholder"
    qs('.editor_content_placeholder ').style.display = 'none';

    let editor = getWxEditor();
    editor.innerHTML = message.data;

    // author
    if (message.author) {
      qs('#author').value = message.author.slice(0, 8);
    }

    // url
    if (message.url) {
      if (!qs('.js_url_checkbox').checked) {
        qs('.js_url_checkbox').click();
      }

      qs('.js_url').value = message.url;
    }

    // TODO: we can do more...
  },

  upload(message) {
    uploadImage(message.data)
      .then(res => JSON.parse(res))
      .then(data => {
        let msg = {
          hash: message.hash,
          type: message.type
        };

        if (data && data['cdn_url']) {
          msg.data = {
            is_placeholder: data['is_placeholder'],
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

const log = console.log.bind(console);
const create = (tag) => document.createElement(tag);
const getDOM = (s) => document.querySelector(s);
const getAll = (s, target = document) => {
  return Array.prototype.slice.call(target.querySelectorAll(s));
};

// 插入 loading
const Loading = (function () {
    var html = '<style>.load3{height:60px;margin:100px auto;position:relative;width:60px}\
    .double-bounce1,.double-bounce2{-webkit-animation:bounce 2.0s infinite ease-in-out;animation:bounce 2.0s infinite ease-in-out;background-color:#67CF22;border-radius:50%;height:100%;left:0;opacity:0.6;position:absolute;top:0;width:100%}.double-bounce2{-webkit-animation-delay:-1.0s;animation-delay:-1.0s}@-webkit-keyframes bounce{0%,100%{-webkit-transform:scale(0.0)}50%{-webkit-transform:scale(1.0)}}@keyframes bounce{0%,100%{transform:scale(0.0);-webkit-transform:scale(0.0)}50%{transform:scale(1.0);-webkit-transform:scale(1.0)}}#loading-wx{background:rgba(255,255,255,.9);bottom:0;display:none;left:0;position:fixed;right:0;top:0;z-index:9999999}#loader-wx{bottom:0;height:100px;left:50%;margin-top:-100px;margin-left:-50px;position:absolute;right:0;top:50%;width:100px}</style> <div id="loading-wx"> <div id="loader-wx"> <div class=load3> <div class="double-bounce1"></div> <div class="double-bounce2"></div></div></div> </div>';
    let div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);
    let elem = getAll('#loading-wx', div)[0];

    return {
      show: () => elem.style.display = 'block',
      hide: () => elem.style.display = 'none'
    };
})();

/**
 * md5
 */
const md5 = (function () {
  let cache = new Map();

  return (s) => {
    if (cache.has(s)) {
      return cache.get(s);
    } else {
      let hash = CryptoJS.MD5(String(s)).toString();
      cache.set(s, hash);
      return hash;
    }
  };
})();

/**
 * get/set Object using localStorage 
 */
const store = {
  db: window.localStorage,
  prefix: '__wx__',
  set(key, value) {
    this.db.setItem(this.prefix + key, JSON.stringify(value));
  },

  get(key) {
    return this.has(key) && JSON.parse(this.db.getItem(this.prefix + key)) || null;
  },

  has(key) {
    return !!this.db.getItem(this.prefix + key);
  },

  keys() {
    let prefix = this.prefix;
    return Object.keys(this.db)
      .filter(k => k.indexOf(prefix) === 0)
      .map(k => k.slice(prefix.length));
  }
};

/**
 * dispatch event
 */
const dispatch = (elem, name) => {
  let evt = document.createEvent('HTMLEvents');
  evt.initEvent(name, false, false);
  elem.dispatchEvent(evt);
};

/**
 * copy text
 */
const copy = (element) => {
  let range = document.createRange();
  range.selectNode(element);

  let selection = window.getSelection();
  if (selection.rangeCount > 0) {
    selection.removeAllRanges()
  }
  selection.addRange(range);
  document.execCommand('copy');
  selection.removeAllRanges();
};

/**
 * paste
 */
const paste = () => {
  let textarea = createHelperTextArea();
  textarea.focus();
  document.execCommand('paste');
  textarea.remove();
};

/**
 * helper 
 * create a temp textarea
 */
const createHelperTextArea = () => {
  const helperTextArea = create('textarea');
  helperTextArea.setAttribute('helper', 'true');
  helperTextArea.style.width = 0;
  helperTextArea.style.height = 0;
  document.body.appendChild(helperTextArea);
  return helperTextArea;
};

/**
 * read blob as DataURI
 */
const blobToDataURI = (blob) => new Promise((resolve, reject) => {
  let reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onload = (e) => resolve(e.target.result);
});

/**
 * https://zhitu.isux.us/
 */
const isuxUpload = (blob) => new Promise((resolve, reject) => {
  let fileType = blob.type.replace('image/', '');
  let fileName = Date.now() + '.' + fileType;
  let oriSize = (blob.size / 1024) | 0;

  let file = new File([blob], fileName, {
    type: blob.type,
    lastModified: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 50)
  });

  let data = new FormData();
  data.append('name', fileName);
  // 10,20,30, ..., 100
  // TODO: set options for choosing `compress` param
  data.append('compress', 10);
  data.append('oriSize', oriSize);
  data.append('type', fileType);
  data.append('fileSelect', file);
  data.append('pngLess', 1);
  data.append('isOa', 0);
  data.append('typeChange', 1);

  let xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try {
        let res = JSON.parse(xhr.response);
        if (res.code === 0) {
          console.info('[isux compress]:', res);
          resolve(`https:${res.url}`);
        } else {
          throw res;
        }
      } catch (e) {
        reject({
          error: e,
          text: 'Error occurred: [' + xhr.responseText + ']'
        });
      }
    }
  };

  xhr.open('POST', 'https://zhitu.isux.us/index.php/preview/imgcompress');
  xhr.send(data);
});

/**
 * use `zhitu.isux.us`
 */
const isuxCompress = (blob) => {
  return isuxUpload(blob)
    .then(url => fetch(url))
    .then(res => res.blob());
};

/**
 * fetch image
 * transform it into BASE64
 */
const fetchImage = ({ url, middleware }) => {
  middleware = middleware || function (o) { return o };

  return fetch(url).then(r => r.blob())
    .then(middleware)
    .then(blobToDataURI)
    .catch(e => null);
};

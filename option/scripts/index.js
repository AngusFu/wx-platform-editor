/**
 * send messages to certain tab
 */
const sendMsg = (url, msg) => new Promise((resolve, reject) => {
  chrome.tabs.query({ url }, (tabs) => {
    if (!tabs.length) {
      reject('no tab opened');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, Object.assign(msg || {}, {
      from: location.href
    }));

    resolve(msg);
  });
});

/**
 * wx editor URL pattern
 */
const WX_PATTERN = 'https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit*';

/**
 * no weixin editor tab is opened
 */
const wxPageNotFound = function () {
  alert('请打开微信公众号编辑页面后再进行操作！');
  chrome.tabs.create({ url:'https://mp.weixin.qq.com/', selected: true });
};

/**
 * focus on weixin editor tab
 */
const focusTab = function (url) {
  chrome.tabs.query({ url }, tabs => {
    if (!tabs.length) {
      wxPageNotFound();
    } else {
      chrome.tabs.update(tabs[0].id, { selected: true });
    }
  });
};

/**
 * generate DOM from string
 */
const divWrap = (clipData) => {
  let div = create('div');
  div.innerHTML = clipData;
  return div;
};

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
    return JSON.parse(this.db.getItem(this.prefix + key));
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
 * request weixin editor page to upload file
 */
const requestUpload = (url) => {
  let hash = md5(url);

  if (/^data:image/.test(url)) {
    sendMsg(WX_PATTERN, {
      type: 'upload',
      data: url,
      hash
    });
  }

  if (/^https?:/.test(url)) {
    fetchImage({
      url,
      // TODO: we can use isuxCompress
      middleware: checkAndReduceBlob
    })
    .then(data => data && sendMsg(WX_PATTERN, {
      type: 'upload',
      data,
      hash
    }));
  }

  return Promise.resolve(hash);
};

/**
 * add message listener
 */
const waitUploadDone = (identifier) => new Promise(resolve => {
  let listener = (msg) => {
    let { type, hash, data } = msg;

    if (type === 'upload' && identifier === hash) {
      resolve(msg);
      chrome.runtime.onMessage.removeListener(listener);
    }
  };
  chrome.runtime.onMessage.addListener(listener);
});

// ===================================================================
/**
 * copy html
 * then trigger paste event
 */
document.querySelector('#jsCopy').addEventListener('click', () => {
  copy(getDOM('.md-preview'));
  paste();
}, false);

/**
 * listen for paste event
 * 
 * TODO
 * 1. Inline SVGs
 * 2. see common.js, `checkAndReduceBlob`
 */
document.addEventListener('paste', (e) => {
  // event target must be helper textarea
  if (e.target.getAttribute('helper') !== 'true') {
    return;
  }

  // weixn CDN
  let CDN_REG = /^https?:\/\/mmbiz\./;

  // get clipboard data
  // wrap html into a div
  let divDOM = divWrap(e.clipboardData.getData('text/html'));

  // get image sources
  // but pics from weixn CDN excluded
  // also, cached pics excluded
  let imgsSrc = getAll('img', divDOM)
    .map(img => img.src)
    .filter(src => !CDN_REG.test(src))
    .filter(src => !store.has(md5(src)));
  
  // indentify those imgs
  getAll('img', divDOM)
    .filter(img => !CDN_REG.test(img.src))
    .map(img => img.classList.add(`hash_${md5(img.src)}`));

  // upload imgs
  let promises = Array.from(new Set(imgsSrc)).map(url => requestUpload(url)
    .then(waitUploadDone)
    .then(({ type, hash, data, err }) => {
      if (err) {
        console.err(err);
        return;
      }
      // cache data
      store.set(hash, data);
    })
  );
  
  // replace url
  Promise.all(promises).then(() => {
    store.keys().forEach(hash => {
      let data = store.get(hash);
      getAll(`.hash_${hash}`, divDOM)
        .map(img => img.src = data.cdn_url);
    });
    
    // inject
    sendMsg(WX_PATTERN, { type: 'inject', data: divDOM.innerHTML });
    // focus 
    focusTab(WX_PATTERN);
  });
});

(function init() {
  sendMsg(WX_PATTERN, { type: 'shakehands' }).catch(wxPageNotFound);
  chrome.runtime.onMessage.addListener(i => log(i));
}());


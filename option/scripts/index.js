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
 * fix
 */
const fixSVGBase64 = (img) => {
  if (/^data:image\/svg/.test(img.src)) {
    img.src = ERROR_IMAGES.svg.cdn_url;
  }
  return img;
};

/**
 * weixin API has a limit of 2M for pictures
 */
const checkAndReduceBlob = (blob) => {
  let type = blob.type;
  if (blob.size < 2 * 1024 * 1024) {
    if (/^image\/(png|jpeg|gif)$/.test(type)) {
      return blob;
    }
  }

  // SVGs, WebPs & large GIFs will also do the work
  // we'll deal with this in wexin editor's injected script
  let match = type.match(/^image\/(svg|gif|webp)/);
  if (match) {
    return blob;
  }

  // still remains for some test cases
  return window.imgReduce(blob, {
    scale: 0.8,
    quality: 0.9,
    type: blob.type
  }).then(checkAndReduceBlob);
};

/**
 * request weixin editor page to upload file
 */
const requestUpload = (url) => {
  let hash = md5(url);

  // DataURIs
  // normal pics that can be reduced 
  // using canvas etc.
  // we'll deal with arge gif later
  if (/^image\/$/.test(url)) {
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
// ===================================================================
let previewDOM = getDOM('.md-preview');
let authorDOM  = getDOM('#authorName');
let urlDOM     = getDOM('#articleURL');

let maskDOM    = getDOM('.pop-mask');
let inputDOM   = getDOM('#jsURL');
let tipDOM     = getDOM('.error-tip');
let submitDOM  = getDOM('.submit-btn');
let HTTP_REGEX = /^https?\:\/\/[^\.]+\..+/;

/*********************************************************************
 *                       ICON BUTTONs
 ********************************************************************/
/**
 * change code theme
 */
let themeDOM = getDOM('#jsChangeTheme');
if (themeDOM) {
  let themes = 'default|funky|okaidia|solarizedlight|tomorrow|twilight'.split('|');
  let themesLen = themes.length;
  let currentThemeIndex = -1;

  themeDOM.addEventListener('click', e => {
    currentThemeIndex += 1;
    let type = themes[currentThemeIndex % themesLen];
    type = type === 'default' ? '' : type;
    let url = type ? `/option/styles/prism-${type}.css` : '/option/styles/prism.css';
    getDOM('#prismTheme').setAttribute('href', url);
  });
}

/**
 * wxInject
 */
getDOM('#jsWxInjectBtn').addEventListener('click', (e) => {
  // copy
  copy(previewDOM);
  
  setTimeout(() => {
    paste();
  }, 50);
});

/**
 * reset
 */
getDOM('#jsNewBtn').addEventListener('click', (e) => {
  // location.reload();
  inputDOM.removeAttribute('readonly');
  tipDOM.style.display  = 'none';
  maskDOM.style.display = 'block';
  inputDOM.focus();
  inputDOM.select();
});


/*********************************************************************
 *                       popup 
 ********************************************************************/
/**
 * maskDOM control
 */
maskDOM.addEventListener('click', function (e) {
  if (e.target === this) {
    this.style.display = 'none';
  }
});

/**
 * validation
 */
inputDOM.addEventListener('keyup', function (e) {
  let url = this.value.trim();

  if (url && !HTTP_REGEX.test(url)) {
    tipDOM.innerHTML = '请输入正确格式的 url';
    tipDOM.style.display = 'block';
  } else {
    tipDOM.style.display = 'none';
  }
});

/**
 * fetch content
 */
let isRequestPending = false;
submitDOM.addEventListener('click', function (e) {
  if (isRequestPending) {
    return;
  }

  let url = inputDOM.value.trim();

  if (!HTTP_REGEX.test(url)) {
    if (url) {
      tipDOM.innerHTML = '请输入正确格式的 url';
      tipDOM.style.display = 'block';
    }
    return;
  }

  isRequestPending = true;
  tipDOM.innerHTML = '正在抓取中...请稍后....';
  tipDOM.style.display = 'block';
  inputDOM.setAttribute('readonly', true);
  
  // cache url
  store.set('url_last_time', url);

  getMarkdownContent(url).then(o => {
    if (!o) {
      tipDOM.innerHTML = '抱歉，无法抓取该 url 对应的内容';
      tipDOM.style.display = 'block';
      return;
    }
    // fill editor
    // and trigger input event
    window.mdEditor.val(o.content);
    authorDOM.value = o.author;
    urlDOM.value = o.url;

    // hide mask
    maskDOM.style.display = 'none';
  })
  .catch(e => {
    console.error(e);
    maskDOM.style.display = 'block';
    tipDOM.style.display  = 'block';
    tipDOM.innerHTML = '似乎发生了错误，请检查控制台';
    inputDOM.removeAttribute('readonly');
  })
  .then(() => {
    isRequestPending = false;
  });
});


/*********************************************************************
 *                       inject
 ********************************************************************/
/**
 * listen for paste event on helper textarea
 */
document.addEventListener('paste', (e) => {
  // event target must be helper textarea
  if (e.target.getAttribute('helper') !== 'true') {
    return;
  }

  // get clipboard data
  // wrap html into a div
  let divDOM = divWrap(e.clipboardData.getData('text/html'));
  // weixn CDN
  let CDN_REG = /^https?:\/\/mmbiz\./;

  let domPreview = getAll('.md-preview', divDOM)[0];
  if (domPreview) {
    divDOM = domPreview;
    let { fontSize, color } = divDOM.style;
    Array.from(divDOM.children).forEach(el => {
      let style = el.style;
      style.fontSize = style.fontSize || fontSize;
      style.color    = style.color || color;
    });
  }

  // remove `meta`
  getAll('meta', divDOM).forEach(el => el.remove());

  // deal with Inline SVGs
  getAll('svg', divDOM).forEach(el => {
    let img = new Image();
    img.src = ERROR_IMAGES.svg.cdn_url;
    el.replaceWith(img);
  });

  // indentify imgs
  getAll('img', divDOM)
    .filter(img => !CDN_REG.test(img.src))
    .map(img => img.classList.add(`hash_${md5(img.src)}`));

  // get image sources
  // but pics from weixn CDN excluded
  // also, cached pics excluded
  let imgsSrc = getAll('img', divDOM)
    .map(img => fixSVGBase64(img).src)
    .filter(src => !CDN_REG.test(src) && !store.has(md5(src)));

  // upload imgs
  let promises = Array.from(new Set(imgsSrc)).map(url => {
    return requestUpload(url)
      .then(waitUploadDone)
      .then(({ type, hash, data, err }) => {
        if (err) {
          console.error(err);
          return;
        }
        // cache data
        store.set(hash, data);
      });
  });
  
  // replace url
  Promise.all(promises).then(() => {
    store.keys().forEach(hash => {
      let { cdn_url } = store.get(hash);
      getAll(`.hash_${hash}`, divDOM).forEach(img => img.src = cdn_url);
    });
    
    // inject
    sendMsg(WX_PATTERN, {
      type: 'inject',
      data: divDOM.innerHTML,
      author: authorDOM.value,
      url: urlDOM.value
    });
    // focus 
    focusTab(WX_PATTERN);
  });
});


;(function init() {
  // recover cache url
  inputDOM.value = store.get('url_last_time');
  // check weixin page
  sendMsg(WX_PATTERN, { type: 'shakehands' }).catch(wxPageNotFound);
  // log messages
  chrome.runtime.onMessage.addListener(i => log(i));

  // request demo
  getMarkdownContent('http://www.zcfy.cc/article/the-service-worker-lifecycle-951.html')
    .then(o => window.mdEditor.val(o.content));
}());

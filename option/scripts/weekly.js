
/**
 * 一些数据初始化的工作
 */
const wxInjector = {
  element: getDOM('.pop-form-mask'),
  cache: {},
  abstract: [
    '又到周刊时间啦，快快看本期周刊君为你准备了什么吧~',
    '新一期周刊出炉啦~周末转眼又来到了，周末愉快~',
    '周刊君如约而至~周末愉快~',
    '一周飞逝~周刊君如约而至~周末愉快~',
    '快，奇舞周刊喊你来充电啦~',
  ],
  leading: [
    '约定好的周五又来啦，今天的天空特别蓝，周刊君的心情棒棒哒~ 周末嗨起来~',
    '时间过得好快，转眼又到周五~ 新一期周刊出炉啦，虽然周刊君的 bug 还没改完 TAT，啊快赐予周刊君力量！~',
    '时间过得好快，又到周五啦~ 周刊君赴约来啦~',
    '来来来~ 转眼间又到周五啦~ 周末到啦，不要放弃学习哟~ 加油吧童鞋~',
    '嘿又到周五啦~ 又一个周末即将来临，奇舞周刊如约而至。好开森~',
  ],
  // get random text
  getText: function (key) {
    let data = Array.isArray(this[key]) && this[key] || [];
    return data[~~(data.length * Math.random())];
  },

  // newest index
  fetchNewestIndex: function () {
    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open('get', 'https://weekly.75team.com/rss.php');
      xhr.send(null);

      xhr.onreadystatechange = function () {
        if (!/^2\d{2}$/.test(xhr.status) || xhr.readyState < 4) return;
        let response = xhr.responseText;
        let reNewest = /<link>https?\:\/\/www\.75team.com\/weekly\/issue(\d{1,5})\.html<\/link>/;
        let match = response.match(reNewest);

        if (match && match[1]) {
          resolve(match[1]);
        } else {
          reject();
        }
      };
      
      xhr.onerror = xhr.ontimeout = function () {
        reject();
      };
    });
  },

  /**
   * 抓取周刊数据
   * @param  {Number} index 期数
   * @return {Promise}
   */
  fetchWeekly: function (index) {
    let self = this;
    let cache = this.cache;
    let url = `https://weekly.75team.com/issue${index}.html`;
    let err = {
      error: `第${index}期周刊不存在！`
    };

    this.origin = url;

    if (cache[index]) {
      return Promise.resolve(cache[index]);
    }

    return fetch(url)
      .then(r => r.text())
      .then(function (text) {
        let data = text.match(/<section id="preface"><\/section>\s*<ul>([\s\S]+)<\/ul>\s*<section id="postface">/);

        if (data && data[0]) {
          cache[index] = self.getWeeklyAbstract(data[0]);
          console.info(`第 ${index} 期周刊数据已缓存...`, cache[index]);
          return (cache[index]);
        }

        return err;
      })
      .catch(function (e) {
        console.error(e, err);
        return err;
      });
  },

  /**
   * 从周刊页面中拿到数据摘要
   * @param  {String} data 字符串
   * @return {Object}
   */
  getWeeklyAbstract: function (html) {
    let div = document.createElement('div');
    div.innerHTML = html;

    let listItems = Array.from(div.querySelectorAll('ul li'));
    let data = listItems.reduce(function (prev, curr) {
      let category = '';
      let children = null;
      let link = null;
      let provider = '';

      if (!curr.classList.contains('article')) {
        category = curr.innerText.trim();
        prev[category] = prev[category] || [];
        prev['_last_'] = prev[category];
        prev['_key_'].push(category);
      } else {
        children = curr.children;
        link = children[0].children[0];

        provider = [].filter.call(children[2].children, (function (meta) {
          return meta.classList.contains('provider');
        }))[0];

        prev['_last_'].push({
          title: link.innerText.trim(),
          url: link.href,
          desc: children[1].innerText.trim(),
          provider: provider && provider.innerText.trim() || ''
        });
      }
      return prev;
    }, { '_key_': [] });

    delete data['_last_'];
    return data;
  },

  fileToURL: function (fileId, urlId) {
    let upload = this.upload;
    
    let promise = null;
    let url = getDOM(urlId).value.trim();
    let coverFileDOM = getDOM(fileId);
    if (coverFileDOM.files[0]) {
      promise = blobToDataURI(coverFileDOM.files[0]).then((u) => {
        console.log(u);
        return upload(u);
      });
    } else if (/^https?:\/\//.test(url)) {
      promise = Promise.resolve(url).then(upload);;
    }
    return promise;
  },
  
  upload: function (url) {
    if (!url) {
      return null;
    }
    
    let hash = md5(url);
    if (store.has(hash)) {
      return store.get(hash);
    }

    return requestUpload(url)
      .then(waitUploadDone)
      .then(({ type, hash, data, err }) => {
        if (err) {
          console.error(err);
          return;
        }
        // cache data
        store.set(hash, data);
        return data;
      });
  },

  bindEvents: function () {
    let self = this;

    this.element.addEventListener('click', function (e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });


    // 期数变化的时候
    // 先获取周刊数据缓存下来
    getDOM('#weeklyIndex').addEventListener('change', function () {
      self.index = +this.value;
      self.fetchWeekly(+this.value);
    });

    // 刷新摘要
    getDOM('#randomAbstract').addEventListener('click', function () {
      getDOM('#weeklyAbstract').value = self.getText('abstract');
    });

    // 刷新导语
    getDOM('#randomLeading').addEventListener('click', function () {
      getDOM('#weeklyLeading').value = self.getText('leading');
    });

    // 动图
    getDOM('#weeklyAnimFile').addEventListener('change', function () {
      getDOM('#weeklyAnimURL').value = this.value;
    });
    
    // 封面
    getDOM('#weeklyCoverFile').addEventListener('change', function () {
      getDOM('#weeklyCoverURL').value = this.value;
    });

    // done
    let isSubmiting = false;

    getDOM('#weeklyDone').addEventListener('click', function () { 
      if (isSubmiting) {
        return;
      }
      isSubmiting = true;
      
      let dataStore = {
        index: self.index,
        origin: self.origin,
        author: getDOM('#weeklyAuthor').value,
        dataStore: self.cache[self.index],
        abstract: getDOM('#weeklyAbstract').value,
        leading: getDOM('#weeklyLeading').value,
        animSrc: getDOM('#weeklyAnimSrc').value
        // coverURL: getDOM('#weeklyCoverURL').value,
        // coverID: 100000,
        // animURL: getDOM('#weeklyAnimSrc').value
      };

      Promise.all([
        self.fileToURL('#weeklyCoverFile', '#weeklyCoverURL'),
        self.fileToURL('#weeklyAnimFile', '#weeklyAnimURL')
      ]).then(([cover, anim]) => {
        dataStore.coverURL = cover && cover.cdn_url || '';
        dataStore.coverID  = cover && cover.cdn_id  || 0;
        dataStore.animURL  = anim  && anim.cdn_url  || '';
      })
      .then(() => {
        console.log(dataStore);

        // inject
        sendMsg(WX_EDITOR_PATTERN, {
          type: 'inject_weekly',
          info: dataStore 
        });
        // focus 
        focusTab(WX_EDITOR_PATTERN);
      })
      .then(() => isSubmiting = false)
      .catch(() => isSubmiting = false);
    });
  },

  init: function () {
    this.element.style.display = 'block';

    if (this.__initialized__ === true) {
      return;
    }

    this.__initialized__ = true;
    this.bindEvents();
    Loading.show();

    this.fetchNewestIndex().then(index => {
      let indexDOM = getDOM('#weeklyIndex');
      indexDOM.value = index;
      dispatch(indexDOM, 'change');
    }).catch(e => {
       console.error('通过 rss 获取最新期数失败');
       alert('发生错误，请检查控制台！');
    })
    .then(() => {
      Loading.hide();
    });

    dispatch(getDOM('#randomAbstract'), 'click');
    dispatch(getDOM('#randomLeading'), 'click');
  }
};

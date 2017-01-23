
/**
 * 一些数据初始化的工作
 */
const wxInjector = {
  dataStore: {},
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
      xhr.open('get', 'http://weekly.75team.com/rss.php');
      xhr.send(null);

      xhr.onreadystatechange = function () {
        if (!/^2\d{2}$/.test(xhr.status) || xhr.readyState < 4) return;
        let response = xhr.responseText;
        let reNewest = /<link>http\:\/\/www\.75team.com\/weekly\/issue(\d{1,5})\.html<\/link>/;
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
    let wxInjector = this;
    let dataStore  = wxInjector.dataStore;
    let cache = dataStore.cache;
    let url = `http://weekly.75team.com/issue${index}.html`;
    let err = {
      error: `第${index}期周刊不存在！`
    };

    if (!cache) {
      cache = dataStore.cache = {};
    }

    dataStore.origin = url;

    if (cache[index]) {
      return Promise.resolve(cache[index]);
    }

    return fetch(url)
      .then(r => r.text())
      .then(function (text) {
        let data = text.match(/<section id="content">([\s\S]+)<\/section>/m);
        if (data && data[0]) {
          cache[index] = wxInjector.getWeeklyAbstract(data[0]);
          return (cache[index]);
        }  
        return err;
      })
      .catch(function () {
        return err;
      });
  },
  /**
   * 从周刊页面中拿到数据摘要
   * @param  {String} data 字符串
   * @return {Object}
   */
  getWeeklyAbstract: function (data) {
    let div = document.createElement('div');
    div.innerHTML = data;

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
  // 收集数据
  collectData: function () {
    // 判断必填项
    let allFilled = ['number', 'author', 'abstract', 'hello'].every(function (id) {
      let $id = $('#' + id),
        val = $id.val().trim();
      $id[!val ? 'addClass' : 'removeClass']('warn');
      return !!val;
    });

    if (!allFilled) {
      throw '请确认所有必填字段都已填写完整';
    }

    // 数据填充到对象中
    ['number', 'author', 'gifCopy', 'abstract', 'hello'].forEach(function (item) {
      wxInjector.dataStore[item] = String($('#' + item).val()).trim();
    });
  },

  init: function () {
    // 获取最新一期的期数
    this.fetchNewestIndex()
      .then(function (index) {
        // 手动触发以获取最新
        $('#number').val(index).trigger('change');
      })
      .catch(function () {
        console.error('通过 rss 获取最新期数失败');
      });


    // 期数变化的时候
    // 先获取周刊数据缓存下来
    $('#number').on('change', function () {
      wxInjector.fetchWeekly(+this.value).then(function (data) {
        // JSON 对象
        console.group('获取到周刊数据');
        console.table(data);
        console.groupEnd();
      }).fail(function (err) {
        console.error(err);
      });
    });

    // 刷新摘要
    $('#changeAbs').on('click', function () {
      $('#abstract').val(wxInjector.getText('abstract'));
    }).trigger('click');

    // 刷新导语
    $('#changeHi').on('click', function () {
      $('#hello').val(wxInjector.getText('leading'));
    }).trigger('click');
  }
};
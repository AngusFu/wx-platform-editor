/**
 * @author:      angusfu1126@qq.com
 * @date:        2016-07-16 14:06:11
 */
Promise.prototype.delay = function (onResolve, onReject) {
  let delay = Promise.delay || 200;
  return this.then(function (value) {
    if (delay >= 0) {
      // delay 执行
      return new Promise(function (resolve, reject) {
        setTimeout(resolve, delay);
      }).then(function () {
        onResolve && onResolve(value);
      });
    } else {
      onResolve && onResolve(value);
    }
  }).catch(function (err) {
    onReject && onReject(err);
  });
};

const getDOM = sel => document.querySelector(sel) || document.createElement('div');

const TMPL_MAP = {
  title: '<p><span style="color: rgb(95,95,95);font-weight: 600;">@@title@@</span></p>',
  desc: '<span style="font-size: 14px; color: rgb(68, 68, 68); line-height: 25.6px; background-color: rgb(255, 255, 255);">@@desc@@</span>',
  provider: '<span style="color: rgb(178, 178, 178); font-size: 14px; line-height: 25.6px; white-space: pre-wrap; background-color: rgb(255, 255, 255);">@@provider@@</span>',
  content: '<p style="line-height: 25.6px;">@@content@@</p>',
  centerP: '<p style="line-height: 25.6px;text-align:center;">@@centerP@@</p>',
  leading: '<span style="color: rgb(68, 68, 68); line-height: 25.6px; background-color: rgb(255, 255, 255);">@@leading@@</span>',
  image: '<img src="@@image@@" style="width: auto !important; visibility: visible !important; height: auto !important;">',
  copyright: '<span style="font-size: 12px; color: rgb(136, 136, 136);">(by @@@copyright@@)</span>',
  sectionTitle: '<h2 style="line-height: 25.6px; white-space: normal; max-width: 100%; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; color: rgb(68, 68, 68); font-size: 18px; box-sizing: border-box !important; word-wrap: break-word !important;font-weight: bold;">@@sectionTitle@@</span></h2><h2 style="line-height: 25.6px; white-space: normal; max-width: 100%; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; color: rgb(68, 68, 68); font-size: 18px; box-sizing: border-box !important; word-wrap: break-word !important;"><span style="max-width: 100%; font-family: 微软雅黑; white-space: pre-wrap; line-height: 28.4444px; color: rgb(255, 218, 81); font-size: 12px;">■</span><span style="max-width: 100%; color: rgb(62, 62, 62); font-family: 微软雅黑; white-space: pre-wrap; line-height: 28.4444px; font-size: 12px;"> &nbsp;&nbsp;<span style="max-width: 100%; color: rgb(217, 33, 66); box-sizing: border-box !important; word-wrap: break-word !important;">■</span> &nbsp;&nbsp;</span><span style="max-width: 100%; color: rgb(61, 167, 66); font-family: 微软雅黑; white-space: pre-wrap; line-height: 28.4444px; font-size: 12px;">■</span></span></h2>',
  blank: '<p style="line-height: 25.6px;"><br></p>',
  bottom: '<p style="line-height: 25.6px; max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; color: rgb(68, 68, 68); box-sizing: border-box !important; word-wrap: break-word !important;"><span style="max-width: 100%; line-height: 1.6; color: rgb(178, 178, 178); box-sizing: border-box !important; word-wrap: break-word !important;">​欢迎点击“<span style="max-width: 100%; line-height: 1.6; color: rgb(0, 122, 170); box-sizing: border-box !important; word-wrap: break-word !important;">阅读原文</span>”，学习本周精华文章～</span><span style="max-width: 100%; color: rgb(121, 123, 170); line-height: 1.6; box-sizing: border-box !important; word-wrap: break-word !important;"><br style="max-width: 100%; box-sizing: border-box !important; word-wrap: break-word !important;"></span></span></p><p style="line-height: 25.6px; max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; line-height: 1.6; color: rgb(68, 68, 68); box-sizing: border-box !important; word-wrap: break-word !important;"><br style="max-width: 100%; box-sizing: border-box !important; word-wrap: break-word !important;"></span></p><p style="line-height: 25.6px; max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; line-height: 1.6; color: rgb(68, 68, 68); box-sizing: border-box !important; word-wrap: break-word !important;"></span></p><p style="line-height: 25.6px; max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; color: rgb(68, 68, 68); box-sizing: border-box !important; word-wrap: break-word !important;">奇舞周刊</span></p><p style="line-height: 25.6px; max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; color: rgb(68, 68, 68); box-sizing: border-box !important; word-wrap: break-word !important;">———<span style="max-width: 100%; color: rgb(136, 136, 136); line-height: 25.6px; box-sizing: border-box !important; word-wrap: break-word !important;">————————————</span>———</span></p><p style="line-height: 25.6px; max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; color: rgb(68, 68, 68); box-sizing: border-box !important; word-wrap: break-word !important;">领略前端技术 阅读奇舞周刊</span></p><p style="line-height: 25.6px; max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><br style="max-width: 100%; box-sizing: border-box !important; word-wrap: break-word !important;"></p><p style="max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); text-align: center; line-height: 1.5em; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; font-size: 13px; color: rgb(68, 68, 68); box-sizing: border-box !important; word-wrap: break-word !important;">长按二维码，关注奇舞周刊</span></p><p style="max-width: 100%; min-height: 1em; color: rgb(32, 32, 32); text-align: center; line-height: normal; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; font-size: 10px; color: rgb(68, 68, 68); box-sizing: border-box !important; word-wrap: break-word !important;"><strong style="max-width: 100%; box-sizing: border-box !important; word-wrap: break-word !important;">▼</strong></span></p><p style="white-space: normal; line-height: 25.6px; max-width: 100%; min-height: 1em; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><img data-s="300,640" data-type="jpeg" data-ratio="1" data-w="200" width="auto" src="https://mmbiz.qlogo.cn/mmbiz/d8tibSEfhMMpC84jhdw7cmZFzrDoG5IsHcpRcls0Ahx6PhRMAicM1gc2ZmG68Tb8t3cyaia5lFicoY8kWXWibCb609A/640?wx_fmt=jpeg" style="box-sizing: border-box !important; word-wrap: break-word !important; width: auto !important; visibility: visible !important;" _src="https://mmbiz.qlogo.cn/mmbiz/d8tibSEfhMMpC84jhdw7cmZFzrDoG5IsHcpRcls0Ahx6PhRMAicM1gc2ZmG68Tb8t3cyaia5lFicoY8kWXWibCb609A/640?wx_fmt=jpeg"></p><p><br></p>',
  warning: '<blockquote style="border-left: 4px solid #e56e6e;font-size: 14px;background: rgba(220, 192, 192, 0.4);padding: 10px;"><p style="line-height: 25.6px;">记得点击文章末尾的“<span style="color:#1e8cdc">阅读原文</span>”查看哟~</p><p style="line-height: 25.6px;">下面先一起看下本期周刊<span style="color:#d95454">摘要</span>吧~</span></p></blockquote>'
};

const renderComponent = (key, content = '') => {
  if (!TMPL_MAP[key]) return '';
  if (!content) return '';
  return TMPL_MAP[key].replace(new RegExp(`@@${key}@@`, 'gi'), content || '');
};

const BLANK_PARAGRAPH = renderComponent('blank', true);
const TIP_BLOCK = renderComponent('warning', true);
const FOOTER_BLOCK = renderComponent('bottom', true);

const renderLeading = leading => {
  let content = renderComponent('leading', leading);
  return renderComponent('content', content);
};

// 单篇文章
const rendorSingleArticle = source => {
  let desc = renderComponent('desc', source['desc']);
  let provider = renderComponent('provider', source['provider']);
  return [
    renderComponent('title', source['title']),
    renderComponent('content', desc + provider),
    BLANK_PARAGRAPH,
  ].join('');
};

// 头图片
const renderHeadingImage = (src, copyright = '') => {
  if (!src.trim()) {
    return '';
  }

  let imgContent = renderComponent('image', src.trim());
  let cpContent = renderComponent('copyright', copyright.trim());
  let temp = renderComponent('centerP', imgContent + '<br>' + cpContent);
  return temp + BLANK_PARAGRAPH;
};


const injectWeekly = info => {
  let {
    index,
    origin,
    author,
    abstract,
    leading,
    dataStore,
    animSrc,
    animURL,
    coverID,
    coverURL
  } = info;


  /*取第一条的标题*/
  let title = `奇舞周刊第 ${index} 期 —— ${dataStore[dataStore['_key_'][0]][0]['title']}`;
  title = title.slice(0, 64);
  getDOM('#title').value = title;
  getDOM('.cover_appmsg_item .appmsg_title .js_appmsg_title').innerHTML = title;

  // 作者
  getDOM('#author').value = author.slice(0, 8);
  // 摘要
  getDOM('.js_desc').value = abstract;

  // 原文链接
  if (!getDOM('.js_url_checkbox').checked) {
    getDOM('.js_url_checkbox').click();
  }
  getDOM('.js_url').value = origin;

  // 选中留言
  getDOM('.frm_checkbox.js_comment.js_field').checked = 'checked';
  getDOM('.frm_checkbox_label.comment_checkbox').className += ' selected';

  // 加上封面图
  if (coverID && coverURL) {
    getDOM('input.js_file_id').value = coverID;
    getDOM('input.js_cdn_url').value = coverURL;
    getDOM('.cover_appmsg_item .appmsg_thumb_wrp.js_appmsg_thumb').style.backgroundImage = `url(${coverURL})`;
    getDOM('.cover_preview.js_cover_preview').style.backgroundImage = `url(${coverURL})`;
    getDOM('.cover_appmsg_item .appmsg_thumb_wrp.js_appmsg_thumb .appmsg_thumb').style.display = 'none';
  }

  /**
   * 渲染各部分
   */
  let weeklyBody = dataStore['_key_'].reduce((prev, key) => {
    if (key !== '_key_') {
      let secData = dataStore[key];
      prev += renderComponent('sectionTitle', key);
      prev += secData.reduce((accu, now) => accu + rendorSingleArticle(now), '');
    }
    return prev;
  }, '');

  let html = [
    TIP_BLOCK,
    BLANK_PARAGRAPH,

    renderLeading(leading),
    BLANK_PARAGRAPH,

    renderHeadingImage(animURL, animSrc),
    weeklyBody,

    FOOTER_BLOCK
  ].join('');

  // 写入文本
  getDOM('.editor_content_placeholder').style.display = 'none';
  getDOM('#ueditor_0').contentDocument.body.innerHTML = html;

  // 原创
  Promise.delay = 300;
  Promise.resolve()
    .delay(function () {
      getDOM('#js_original .btn.js_original_apply').click();
    })
    .delay(function () {
      getDOM('.original_dialog .js_btn[data-index="0"]').click();
    })
    .delay(function () {
      getDOM('#js_original_article_type li a[data-name="科技互联网"]').click();
    })
    .delay(function () {
      getDOM('.original_dialog .js_btn[data-index="2"]').click();
    }).catch(function (err) {
      console.log(err);
    });
};

chrome.runtime.onMessage.addListener(function (message) {
  if (message.type === 'inject_weekly') {
    injectWeekly(message.info);
  }
});
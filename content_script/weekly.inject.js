/**
 * @author:      angusfu1126@qq.com
 * @date:        2016-07-16 14:06:11
 */
Promise.prototype.delay = function(onResolve, onReject) {
  let delay = Promise.delay || 200
  return this.then(function(value) {
    if (delay >= 0) {
      // delay 执行
      return new Promise(function(resolve, reject) {
        setTimeout(resolve, delay)
      }).then(function() {
        onResolve && onResolve(value)
      })
    } else {
      onResolve && onResolve(value)
    }
  }).catch(function(err) {
    onReject && onReject(err)
  })
}

const getDOM = sel =>
  document.querySelector(sel) || document.createElement('div')

const TMPL_MAP = {
  title:
    '<p><span style="color: rgb(95,95,95);font-weight: 600;">@@title@@</span></p>',
  desc:
    '<span style="font-size: 14px; color: rgb(68, 68, 68); line-height: 25.6px; background-color: rgb(255, 255, 255);">@@desc@@</span>',
  provider:
    '<span style="color: rgb(178, 178, 178); font-size: 14px; line-height: 25.6px; white-space: pre-wrap; background-color: rgb(255, 255, 255);">@@provider@@</span>',
  content: '<p style="line-height: 25.6px;">@@content@@</p>',
  centerP: '<p style="line-height: 25.6px;text-align:center;">@@centerP@@</p>',
  leading:
    '<span style="color: rgb(68, 68, 68); line-height: 25.6px; background-color: rgb(255, 255, 255);">@@leading@@</span>',
  image:
    '<img src="@@image@@" style="width: auto !important; visibility: visible !important; height: auto !important;">',
  copyright:
    '<span style="font-size: 12px; color: rgb(136, 136, 136);">(by @@@copyright@@)</span>',
  sectionTitle:
    '<h2 style="line-height: 25.6px; white-space: normal; max-width: 100%; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; color: rgb(68, 68, 68); font-size: 18px; box-sizing: border-box !important; word-wrap: break-word !important;font-weight: bold;">@@sectionTitle@@</span></h2><h2 style="line-height: 25.6px; white-space: normal; max-width: 100%; color: rgb(62, 62, 62); text-align: center; box-sizing: border-box !important; word-wrap: break-word !important; background-color: rgb(255, 255, 255);"><span style="max-width: 100%; color: rgb(68, 68, 68); font-size: 18px; box-sizing: border-box !important; word-wrap: break-word !important;"><span style="max-width: 100%; font-family: 微软雅黑; white-space: pre-wrap; line-height: 28.4444px; color: rgb(255, 218, 81); font-size: 12px;">■</span><span style="max-width: 100%; color: rgb(62, 62, 62); font-family: 微软雅黑; white-space: pre-wrap; line-height: 28.4444px; font-size: 12px;"> &nbsp;&nbsp;<span style="max-width: 100%; color: rgb(217, 33, 66); box-sizing: border-box !important; word-wrap: break-word !important;">■</span> &nbsp;&nbsp;</span><span style="max-width: 100%; color: rgb(61, 167, 66); font-family: 微软雅黑; white-space: pre-wrap; line-height: 28.4444px; font-size: 12px;">■</span></span></h2>',
  blank: '<p style="line-height: 25.6px;"><br></p>',
  bottom: `
  <h2 style="margin: 0px; border: 0px; padding: 0px; font-weight: normal; word-break: break-all; word-wrap: break-word; line-height: 110px; height: 110px; font-size: 18px; color: rgb(100, 159, 12); text-align: center; background: url(&quot;https://mmbiz.qpic.cn/mmbiz_png/MpGQUHiaib4ib6j9X9s2kibfaicBLmIm6dUBq1YM6xzAOuiaQW3qCATvwcQCI9Hh21gicUUnZ0FFtbjdVoCQMIZjDBUaA/0?wx_fmt=png&quot;) center center / 150px 110px no-repeat; font-family: &quot;Helvetica Neue&quot;, Arial, &quot;Hiragino Sans GB&quot;, STHeiti, &quot;Microsoft YaHei&quot;; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;">关于奇舞周刊</h2>
  <p class="weekly-end-desc" style="margin: 15px 0px 30px; border: 0px; padding: 0px; line-height: 2; font-size: 14px; text-align: justify; white-space: pre-wrap; word-break: break-all; word-wrap: break-word; color: rgb(136, 136, 136); font-family: &quot;Helvetica Neue&quot;, Arial, &quot;Hiragino Sans GB&quot;, STHeiti, &quot;Microsoft YaHei&quot;; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;">《奇舞周刊》是360公司专业前端团队「<span style="margin: 0px; border: 0px; padding: 0px; font-weight: bold;">奇舞团</span>」运营的前端技术社区。关注公众号后，直接发送链接到后台即可给我们投稿。</p>
  <img class="weekly-end-img" src="https://mmbiz.qlogo.cn/mmbiz_png/MpGQUHiaib4ib6j9X9s2kibfaicBLmIm6dUBqymVmiaKqGFEPn0G3VyVnqQjvognHq4cMibayW2400j4OyEtdz5fkMbmA/0?wx_fmt=png" style="margin: 0px auto 20px; border: 0px; padding: 0px; vertical-align: middle; height: 106px; width: 307px; display: block; color: rgb(51, 51, 51); font-family: &quot;Helvetica Neue&quot;, Arial, &quot;Hiragino Sans GB&quot;, STHeiti, &quot;Microsoft YaHei&quot;; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;">
  `,
  warning:
    '<p class="" style="margin: 0 auto 15px;border-width: 0px;border-style: initial;border-color: initial;line-height: 1.5;white-space: normal;word-break: break-word;hyphens: auto;overflow: hidden;text-align: center;font-size: 16px;max-width: 100%;min-height: 1em;color: rgb(62, 62, 62);"><img class="__bg_gif " data-ratio="0.1388888888888889" data-src="http://mmbiz.qpic.cn/mmbiz_gif/d8tibSEfhMMrjNKjEmoX7KR4FZKdwlrguCicepySoficvu2OMNxXQT0YbHdMcVtVV4P8ZqsqXBnegtw4VibYxhichMQ/0?wx_fmt=gif" data-type="gif" data-w="720" style="border-width: 0px; border-style: initial; border-color: initial; vertical-align: middle; box-sizing: border-box !important; word-wrap: break-word !important; visibility: visible !important; width: auto !important; height: auto !important;" width="auto" _width="auto" src="http://mmbiz.qpic.cn/mmbiz_gif/d8tibSEfhMMrjNKjEmoX7KR4FZKdwlrguCicepySoficvu2OMNxXQT0YbHdMcVtVV4P8ZqsqXBnegtw4VibYxhichMQ/0?wx_fmt=gif&amp;tp=webp&amp;wxfrom=5&amp;wx_lazy=1" data-order="0" data-fail="0"></p><blockquote style="border-left: 4px solid #e56e6e;font-size: 14px;background: rgba(220, 192, 192, 0.4);padding: 10px;"><p style="line-height: 25.6px;">记得点击文章末尾的“<span style="color:#1e8cdc">阅读原文</span>”查看哟~</p><p style="line-height: 25.6px;">下面先一起看下本期周刊<span style="color:#d95454">摘要</span>吧~</span></p></blockquote>'
}

const renderComponent = (key, content = '') => {
  if (!TMPL_MAP[key]) return ''
  if (!content) return ''
  return TMPL_MAP[key].replace(new RegExp(`@@${key}@@`, 'gi'), content || '')
}

const BLANK_PARAGRAPH = renderComponent('blank', true)
const TIP_BLOCK = renderComponent('warning', true)
const FOOTER_BLOCK = renderComponent('bottom', true)

const renderLeading = leading => {
  let content = renderComponent('leading', leading)
  return renderComponent('content', content)
}

// 单篇文章
const rendorSingleArticle = source => {
  let desc = renderComponent('desc', source['desc'])
  let provider = renderComponent('provider', source['provider'])
  return [
    renderComponent('title', source['title']),
    renderComponent('content', desc + provider),
    BLANK_PARAGRAPH
  ].join('')
}

// 头图片
const renderHeadingImage = (src, copyright = '') => {
  if (!src.trim()) {
    return ''
  }

  let imgContent = renderComponent('image', src.trim())
  let cpContent = renderComponent('copyright', copyright.trim())
  let temp = renderComponent('centerP', imgContent + '<br>' + cpContent)
  return temp + BLANK_PARAGRAPH
}

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
  } = info

  /* 取第一条的标题 */
  let title = `奇舞周刊第 ${index} 期 —— ${
    dataStore[dataStore['_key_'][0]][0]['title']
  }`
  title = title.slice(0, 64)
  getDOM('#title').value = title
  getDOM('.cover_appmsg_item .appmsg_title .js_appmsg_title').innerHTML = title

  // 作者
  getDOM('#author').value = author.slice(0, 8)
  // 摘要
  getDOM('.js_desc').value = abstract

  // 原文链接
  if (!getDOM('.js_url_checkbox').checked) {
    getDOM('.js_url_checkbox').click()
  }
  getDOM('.js_url').value = origin

  // 选中留言
  getDOM('.frm_checkbox.js_comment.js_field').checked = 'checked'
  getDOM('.frm_checkbox_label.comment_checkbox').className += ' selected'

  // 加上封面图
  if (coverID && coverURL) {
    getDOM('input.js_file_id').value = coverID
    getDOM('input.js_cdn_url').value = coverURL
    getDOM(
      '.cover_appmsg_item .appmsg_thumb_wrp.js_appmsg_thumb'
    ).style.backgroundImage = `url(${coverURL})`
    getDOM(
      '.cover_preview.js_cover_preview'
    ).style.backgroundImage = `url(${coverURL})`
    getDOM(
      '.cover_appmsg_item .appmsg_thumb_wrp.js_appmsg_thumb .appmsg_thumb'
    ).style.display = 'none'
  }

  /**
   * 渲染各部分
   */
  let weeklyBody = dataStore['_key_'].reduce((prev, key) => {
    if (key !== '_key_') {
      let secData = dataStore[key]
      prev += renderComponent('sectionTitle', key)
      prev += secData.reduce((accu, now) => accu + rendorSingleArticle(now), '')
    }
    return prev
  }, '')

  let html = [
    TIP_BLOCK,
    BLANK_PARAGRAPH,

    renderLeading(leading),
    BLANK_PARAGRAPH,

    renderHeadingImage(animURL, animSrc),
    weeklyBody,

    FOOTER_BLOCK
  ].join('')

  // 写入文本
  getDOM('.editor_content_placeholder').style.display = 'none'
  getDOM('#ueditor_0').contentDocument.body.innerHTML = html

  // 原创
  Promise.delay = 300
  Promise.resolve()
    .delay(function() {
      getDOM('#js_original .btn.js_original_apply').click()
    })
    .delay(function() {
      getDOM('.original_dialog .js_btn[data-index="0"]').click()
    })
    .delay(function() {
      getDOM('#js_original_article_type li a[data-name="科技互联网"]').click()
    })
    .delay(function() {
      getDOM('.original_dialog .js_btn[data-index="2"]').click()
    })
    .catch(function(err) {
      console.log(err)
    })
}

chrome.runtime.onMessage.addListener(function(message) {
  console.log(message)
  if (message.type === 'inject_weekly') {
    injectWeekly(message.info)
  }
})

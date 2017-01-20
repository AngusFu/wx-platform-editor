(function () {
  const changePrismTheme = (type) => {
    let url = './styles/prism.css';

    if (type) {
      url = `./styles/prism-${type}.css`;
    }
    getDOM('#prismTheme').setAttribute('href', url);
  };

  window.marked.setOptions({
    highlight: function (code, lang, callback) {
      lang = lang === 'js' ? 'javascript' : (lang || 'javascript');
      let langConfig = Prism.languages[lang] || Prism.languages.javascript;
      return Prism.highlight(code, langConfig);
    }
  });

  const eidtorDOM = getDOM('.md-editor');
  const previewDOM = getDOM('.md-preview');
  const offlineDIV = create('div');
  const query = (s, cb) => getAll(s, offlineDIV).forEach(el => cb && cb(el));

  /**
   * edit
   */
  eidtorDOM.addEventListener('input', function () {
    let text = this.innerText;
    offlineDIV.innerHTML = window.marked(text);

    /**
     * TODO
     * 能否增加使用图片代码的选项
     * 控制月影的在线站点即可
     * http://code2img.test.h5jun.com/
     */

    // 处理代码换行
    query('pre', function (pre) {
      // pre>code.lang-x
      let codeElem = pre.firstElementChild;
      let lines = codeElem.innerHTML.trim().split('\n');

      let match = codeElem.className.match(/(?:^|\s)lang-([^\s]+)/);
      let lang = match && match[1] || 'javascript';
      lang = Prism.languages[lang] ? lang : 'javascript';

      pre.innerHTML = lines.map((line) => {
        line = line.replace(/(^\s+)/g, m => '&nbsp;'.repeat(m.length));
        return !!line.trim() ? `<p class="line">${line}</p>` : `<p class="lbr"><br></p>`;
      }).join('');

      pre.classList.add(`language-${lang}`);
    });

    // 处理行间 code 样式
    query('code', function (code) {
      let span = create('span');
      span.innerHTML = code.innerHTML;
      span.className = 'code';
      code.parentNode.replaceChild(span, code);
    });

    // blockquote 添加类名
    query('blockquote', function (blockquote) {
      blockquote.className = 'blockquote';

      let lines = blockquote.firstElementChild.innerHTML.trim().split('\n');

      lines = lines.map((line) => {
        line = line.replace(/(^\s+)/g, m => '&nbsp;'.repeat(m.length));
        return !!line.trim() ? `<p>${line}</p>` : `<p><br></p>`;
      });
      blockquote.innerHTML = lines.join('');
    });

    // 所有 pre 外面包裹一层 blockquote
    // 使用 figure 等标签都不行
    // 会导致微信编辑器中粘贴时会多出一个 p 标签
    query('pre', function (pre) {
      let clone = pre.cloneNode();
      clone.innerHTML = pre.innerHTML;

      let wrap = create('blockquote');
      wrap.className = 'code-wrap';
      wrap.appendChild(clone);

      pre.parentNode.replaceChild(wrap, pre);
    });

    // 处理所有 a 链接
    query('a', function (a) {
      let span = create('span');
      span.innerHTML = a.innerHTML;
      span.className = 'link';
      a.parentNode.replaceChild(span, a);
    });

    // img 处理
    // 只针对单个成一段的 img
    query('img', function (img) {
      // <p><img src=""></p>
      if (img.parentNode.innerHTML.trim() === img.outerHTML.trim()) {
        img.parentNode.className += 'img-wrap';
      }
    });

    previewDOM.innerHTML = offlineDIV.innerHTML;
  });

  /**
   * change code theme
   */
  let themes = 'default|funky|okaidia|solarizedlight|tomorrow|twilight'.split('|');
  let themesLen = themes.length;
  let currentThemeIndex = -1;
  getDOM('#jsChangeTheme').addEventListener('click', function () {
    currentThemeIndex += 1;
    let type = themes[currentThemeIndex % themesLen];
    type = type === 'default' ? '' : type;
    changePrismTheme(type);
  });

  /**
   * history
   */
  eidtorDOM.addEventListener('blur', function (e) {
    try {
      localStorage['wx-editor'] = eidtorDOM.innerHTML;
    } catch (e) {
      console.error(e);
    }
  });
  eidtorDOM.innerHTML = localStorage['wx-editor'] || '';
  dispatch(eidtorDOM, 'input');

  // for online HTTP(s) version
  if (/^https?:$/.test(location.protocol)) {
    // add clip 
    getDOM('#jsCopy').addEventListener('click', function() {
      copy(previewDOM);
    });
  }
})();

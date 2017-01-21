(function () {
  const changePrismTheme = type => {
    let url = '/option/styles/prism.css';

    if (type) {
      url = `/option/styles/prism-${type}.css`;
    }
    getDOM('#prismTheme').setAttribute('href', url);
  };

  const eidtorDOM = getDOM('.md-editor');
  const previewDOM = getDOM('.md-preview');
  const offlineDIV = create('div');
  const query = (s, cb) => getAll(s, offlineDIV).forEach(el => cb && cb(el));

  window.marked.setOptions({
    highlight(code, lang, callback) {
      lang = lang === 'js' ? 'javascript' : (lang || 'javascript');
      let langConfig = Prism.languages[lang] || Prism.languages.javascript;
      return Prism.highlight(code, langConfig);
    }
  });
  
  /**
   * edit
   */
  eidtorDOM.addEventListener('input', function () {
    let text = this.innerText;
    offlineDIV.innerHTML = window.marked(text);

    // remove `meta`
    query('meta', a => a.remove());

    // 处理代码换行
    query('pre', pre => {
      // pre>code.lang-x
      let codeElem = pre.firstElementChild;
      let lines = codeElem.innerHTML.trim().split('\n');

      let match = codeElem.className.match(/(?:^|\s)lang-([^\s]+)/);
      let lang = match && match[1] || '';

      pre.innerHTML = lines.map((line) => {
        line = line.replace(/(^\s+)/g, m => '&nbsp;'.repeat(m.length));
        return !!line.trim() ? `<p class="line">${line}</p>` : `<p class="lbr"><br></p>`;
      }).join('');

      pre.classList.add(`language-${lang}`);
    });

    // 处理行间 code 样式
    query('code', code => {
      let span = create('span');
      span.innerHTML = code.innerHTML;
      span.className = 'code';
      code.parentNode.replaceChild(span, code);
    });

    // blockquote 添加类名
    query('blockquote', blockquote => {
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
    query('pre', pre => {
      let clone = pre.cloneNode();
      clone.innerHTML = pre.innerHTML;

      let wrap = create('blockquote');
      wrap.className = 'code-wrap';
      wrap.appendChild(clone);

      pre.parentNode.replaceChild(wrap, pre);
    });

    // 处理所有 a 链接
    query('a', a => {
      let span = create('span');
      span.innerHTML = a.innerHTML;
      span.className = 'link';
      a.parentNode.replaceChild(span, a);
    });

    // img 处理
    // 只针对单个成一段的 img
    query('img', img => {
      // <p><img src=""></p>
      if (img.parentNode.innerHTML.trim() === img.outerHTML.trim()) {
        img.parentNode.className += 'img-wrap';
      }
    });

    previewDOM.innerHTML = offlineDIV.innerHTML;
  });

  /**
   * paste
   * http://www.zcfy.cc/static/js/article.js?v=8d1f3.js
   */
  eidtorDOM.addEventListener('paste', function (e) {
    e.preventDefault();
    
    let data = e.clipboardData.getData('text/html')
    let html = '';

    if (!data) {
      html = e.clipboardData.getData('text/plain');
    } else {
      let divDOM = create('div');
      let query = (s, cb) => getAll(s, divDOM).forEach(el => cb && cb(el));
      divDOM.innerHTML = data;

      query('*', el => {
        el.removeAttribute('style');
        el.removeAttribute('class');
      });

      query('meta', el => el.remove());
      
      html = generateMdText(divDOM.innerHTML.replace(/ /g, '&nbsp;'));
    }

    this.innerText = html;
    dispatch(this, 'input');
  });

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
      changePrismTheme(type);
    });
  }

  /**
   * history
   */
  // eidtorDOM.addEventListener('blur', e => {
  //   try {
  //     localStorage['wx-editor'] = eidtorDOM.innerHTML;
  //   } catch (e) {
  //     console.error(e);
  //   }
  // });
  // eidtorDOM.innerHTML = localStorage['wx-editor'] || '';
  // dispatch(eidtorDOM, 'input');

  // for online HTTP(s) version
  if (/^https?:$/.test(location.protocol)) {
    // add clip 
    getDOM('#jsCopy').addEventListener('click', function() {
      copy(previewDOM);
    });
  }
})();

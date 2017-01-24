/**
 * http://www.zcfy.cc/static/js/article.js?v=8d1f3.js
 */
const generateMdText = content => {
  return toMarkdown(content, {
    gfm: false,
    converters: [{
      filter: 'code',
      replacement: function (t, n) {
        return /\n/.test(t) ? t : '`' + t + '`';
      }
    }, {
      filter: 'pre',
      replacement: function (t, n) {
        let lang = '';
        let result = t;

        let firstChild = n.children[0];
        if (firstChild) {
          let match = firstChild.className.match(/(^|\s)(lang|language)-([^\s]+)/);
          lang = match && match[3] || '';
        }

        switch (lang) {
          case 'js':
          case 'javascript':
            result = js_beautify(t);
            break;
          case 'css':
            result = css_beautify(t);
            break;
          case 'html':
            result = html_beautify(t);
            break;
        }

        return '\n```' + lang + '\n' + result + '\n```\n'
      }
    }, {
      filter: 'span',
      replacement: function (t, n) {
        return t
      }
    }, {
      filter: ['section', 'div'],
      replacement: function (t, n) {
        return '\n\n' + t + '\n\n'
      }
    }]
  });
};

;(function () {
  let previewDOM = getDOM('.md-preview');

  /**
   * configure window.marked
   */
  let configMarked = function () {
    window.marked.setOptions({
      highlight(code, lang, callback) {
        lang = lang === 'js' ? 'javascript' : (lang || 'javascript');
        let langConfig = Prism.languages[lang] || Prism.languages.javascript;
        return Prism.highlight(code, langConfig);
      }
    });
  };

  /**
   * create editor
   */
  let initEditor = () => {
    let editor = new Editor({
      element: getDOM('#jsMdEditor'),
      toolbar: []
    });

    configMarked();
    
    // editor.insertParagraph = function (data) {
    //   let cm = this.codemirror;
    //   let doc = cm.getDoc();
    //   // gets the line number in the cursor position
    //   let cursor = doc.getCursor();
    //   console.log(cursor)
    //   // get the line contents
    //   let line = doc.getLine(cursor.line);
    //   // create a new object to avoid mutation of the original selection
    //   let pos = {
    //       line: cursor.line,
    //       ch: line.length - 1 
    //   };
    //   // set the character position to the end of the line
    //   doc.replaceRange('\n'+data+'\n', pos); // adds a new line
    // };

    editor.insert = function (data) {
      let cm = this.codemirror;
      let doc = cm.getDoc();
      let cursor = doc.getCursor();

      if (doc.somethingSelected()) {
        doc.replaceSelection(data);
      } else {
        doc.replaceRange(data, cursor);
      }
    };

    editor.val = function (val) {
      let cm = this.codemirror;
      let doc = cm.getDoc();

      if (!val) {
        return doc.getValue();
      } else {
        return doc.setValue(val);
      }
    };

    // on change
    editor.codemirror.on('change', function (e) {
      if (editor.onchange) {
        editor.onchange(editor);
      }
    });

    editor.render();
    return editor;
  };

  /**
   * renderPreview
   */
  let renderPreview = function (editor) {
    let offlineDIV = create('div');
    let query = (s, cb) => getAll(s, offlineDIV).forEach(el => cb && cb(el));
    
    let text = editor.val();
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

    // list
    // let listNum = create('img');
    // listNum.src = 'https://p1.ssl.qhimg.com/t01fb3e28751b757288.png';
    // query('li', li => {
    //   li.insertAdjacentElement('afterbegin', listNum.cloneNode());
    // });

    previewDOM.innerHTML = offlineDIV.innerHTML;
  };

  
/********************************************************************
 *            
 ********************************************************************/
  // Editor
  window.mdEditor = initEditor();
  mdEditor.onchange = renderPreview;

  /**
   * paste
   * http://www.zcfy.cc/static/js/article.js?v=8d1f3.js
   */
  getDOM('.md-editor').addEventListener('paste', function (e) {
    e.preventDefault();

    let data = e.clipboardData.getData('text/html')
    let markdown = '';

    if (!data) {
      markdown = e.clipboardData.getData('text/plain');
    } else {
      let divDOM = create('div');
      let query = (s, cb) => getAll(s, divDOM).forEach(el => cb && cb(el));
      divDOM.innerHTML = data;

      query('*', el => {
        el.removeAttribute('style');
        el.removeAttribute('class');
      });
      query('meta', el => el.remove());
      
      markdown = generateMdText(divDOM.innerHTML);
    }

    window.mdEditor.insert(markdown);
  });
})();

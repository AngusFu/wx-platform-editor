/**
 * zcfy related utils
 */
const zcfyRegex = /^https?:\/\/(www\.)?zcfy\.cc\/(article|api)\//;
const isZcfyURL = url => zcfyRegex.test(url);
const wemlionRegex = /^https?:\/\/www\.wemlion\.com\/\d{4}\/([^\/]+)/;
const isWemlionURL = url => wemlionRegex.test(url);

/**
 * 如果可以匹配到相应的 markdown 地址
 * 则直接使用 markdown
 * 否则使用 html, 然后经由 toMarkdown 进行转换
 */
const zcfyURLFix = url => {
  let config = {
    type: 'html',
    origUrl: url,
    url
  };

  // article page
  let r1 = /www\.zcfy\.cc\/article\/.+-(\d+)\.html/;
  let r2 = /www\.zcfy\.cc\/article\/(\d+)/;
  let r3 = /www\.zcfy\.cc\/api\/getarticlemarkdown\?id=\d+/;

  let match = url.match(r1);
  if (match) {
    config.type = 'md';
    config.url = `http://www.zcfy.cc/api/getarticlemarkdown?id=${match[1]}`;
  } else if (match = url.match(r2)) {
    config.type = 'md';
    config.url = `http://www.zcfy.cc/api/getarticlemarkdown?id=${match[1]}`;
  } else if (match = url.match(r4)) {
    config.type = 'md';
  }
  
  return config;
};

/**
 * parse info from zcfy markdown
 */
const zcfyMarkdownParse = md => {
  let title = md.match(/\s*#\s+([^\n\r]+)/)[1];
  let url   = md.match(/>\s+链接：\[([^\[\]]+)\]/)[1];
  let author = '译/' + md.match(/译者：\[([^\]]+)/)[1];
  let content = md.match(/^>\s+原文：\[[^\[\]]*]\([^\(\)]*\)([\w\W]+)$/m)[1].trim();
  return { title, author, content, url, type: 'md'};
};

/**
 * wemlion.com parse
 */
const wemlionFetch = url => {
  let name = url.match(wemlionRegex)[1];
  let md_url = `https://raw.githubusercontent.com/AngusFu/blog/master/source/_posts/${name}.md`;
  
  return fetch(md_url)
    .then(r => r.text())
    .then(md => {
      let title = md.match(/title:\s*([^\n\r]+)/)[1];
      let isTranslation = /from:\s*http/.test(md) && /permission:\s*(0|1)/.test(md);
      let author = isTranslation ? '译/文蔺' : '文蔺';
      let content = md.match(/-{3,}\n\s*([\w\W]+)/)[1];
      return { title, author, content, url, type: 'md'};
    });
};

/**
 * fetch content by postlight
 */
const fetchByPostLight = url => {
  let addr = `https://mercury.postlight.com/parser?url=${url}`;

  return fetch(addr, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '4zZPsARTwZKZpHqMBtyKdMhdbxzI7rrptlu6kA8V'
      }
    })
    .catch(e => {
      console.error(e);
      return null;
    });
};

/**
 * deal with text contents
 */
const getMarkdownContent = url => {
  if (isWemlionURL(url)) {
    return wemlionFetch(url);
  }

  let config = {
    type: 'html',
    origUrl: url,
    url
  };

  if (isZcfyURL(url)) {
    config = zcfyURLFix(url);
  }

  // zcfy article
  if (config.type === 'md') {
    return fetch(config.url)
      .then(r => r.text())
      .catch(e => {
        console.error(e)
        return ''
      })
      .then(zcfyMarkdownParse);
  }

  return fetchByPostLight(url)
    .then(r => r.json())
    .catch(e => {
      console.error(e);
      return null;
    })
    .then(obj => {
      if (!obj) {
        return null;
      }

      let { title, author, content } = obj;

      return {
        title,
        author,
        url: url,
        content: generateMdText(content),
        type: 'html'
      };
    });
};

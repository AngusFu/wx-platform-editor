/**
 * zcfy related utils
 */
const zcfyRegex = /^https?:\/\/(www\.)?zcfy\.cc\/article\//
const isZcfyURL = url => zcfyRegex.test(url)

/**
 * fetch content by postlight
 */
const fetchByPostLight = url => {
  let addr = `https://mercury.postlight.com/parser?url=${url}`

  return fetch(addr, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '4zZPsARTwZKZpHqMBtyKdMhdbxzI7rrptlu6kA8V'
    }
  }).catch(e => {
    console.error(e)
    return null
  })
}

/**
 * deal with text contents
 */
const getMarkdownContent = url => {
  let config = {
    type: 'html',
    origUrl: url,
    url
  }

  if (isZcfyURL(url)) {
    // article page
    let reId = /zcfy\.cc\/article\/([^\/]+)/
    let id = url.match(reId)[1]
    let api = `http://www.zcfy.cc/api/articleDetail?token=7eec4e73-23e3-435f-a1fd-3b7f2368850a&id=${id}`

    return fetch(api)
      .then(r => r.json())
      .then(obj => {
        var data = obj.data

        return {
          title: data.title,
          author: data.translator_nickname || data.translator_name,
          url: data.seo_url_base,
          content: data.content,
          type: 'md'
        }
      })
  }

  return fetchByPostLight(url)
    .then(r => r.json())
    .catch(e => {
      console.error(e)
      return null
    })
    .then(obj => {
      if (!obj) {
        throw 'got null content'
      }

      let { title, author, content } = obj

      return {
        title,
        author,
        url: url,
        content: generateMdText(content),
        type: 'html'
      }
    })
}

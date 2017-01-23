let url = new URL(location.href);
let params = new URLSearchParams(url.search);
let type = params.get('t');
let token = params.get('token');

console.log(token);

// any wexin page that contains token
// except editor page
if (token && !/media\/appmsg_edit/.test(type)) {
  const onMessage = {
    noop() {},

    shakehands() {
      chrome.runtime.sendMessage(null, {
        type: 'token',
        token
      });
    }
  };

  chrome.runtime.onMessage.addListener(function (message) {
    console.info(message);
    (onMessage[message.type] || onMessage['noop'])(message);
  });
  
  chrome.runtime.sendMessage(null, {
    type: 'token',
    token
  });
}

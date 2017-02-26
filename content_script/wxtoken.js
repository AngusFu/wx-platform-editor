/**
 * get wexin token
 * so that we can open editor directly
 * using a template string
 */
let url = new URL(location.href);
let params = new URLSearchParams(url.search);
let type = params.get('t');
let token = params.get('token');
 
let hasError = document.querySelector('.page_error') || document.querySelector('.page_timeout');
let isSendMsg = /masssendpage\?/.test(location.href);
let isEditor = /media\/appmsg_edit/.test(type);

// any wexin page that contains token
// except editor page
if (token && !hasError && !isEditor && !isSendMsg) {
  console.log(token);

  const onMessage = {
    noop() {},

    shakehands() {
      chrome.runtime.sendMessage(null, {
        type: 'token',
        token
      });
    }
  };

  // listen for handshake
  chrome.runtime.onMessage.addListener(function (message) {
    console.info(message);
    (onMessage[message.type] || onMessage['noop'])(message);
  });
  
  // send message at once
  chrome.runtime.sendMessage(null, {
    type: 'token',
    token
  });
}

const log    = console.log.bind(console);
const create = (tag) => document.createElement(tag);
const getDOM = (s) => document.querySelector(s);
const getAll = (s, target = document) => {
  return Array.prototype.slice.call(target.querySelectorAll(s));
};

/**
 * dispatch event
 */
const dispatch = (elem, name) => {
  let evt = document.createEvent('HTMLEvents');
  evt.initEvent(name, false, false);
  elem.dispatchEvent(evt);
};

/**
 * copy text
 */
const copy = (element) => {
  let range = document.createRange();
  range.selectNode(element);

  let selection = window.getSelection();
  if (selection.rangeCount > 0) selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('copy');
  selection.removeAllRanges();
};
/**
 * paste
 */
const paste = () => {
  let textarea = createHelperTextArea();
  textarea.focus();
  document.execCommand('paste');
  textarea.remove();
};

/**
 * helper 
 * create a temp textarea
 */
const createHelperTextArea = () => {
  const helperTextArea = create('textarea');
  helperTextArea.setAttribute('helper', 'true');
  helperTextArea.style.width = 0;
  helperTextArea.style.height = 0;
  document.body.appendChild(helperTextArea);
  return helperTextArea;
};

/**
 * read blob as DataURI
 */
const blobToDataURI = (blob) => new Promise((resolve, reject) => {
  let reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onload = (e) => resolve(e.target.result);
});

/**
 * weixin API has a limit of 2M for pictures
 * 
 * TODO
 * 1. error handling with large GIFs
 * 2. SVGs
 */
const checkAndReduceBlob = (blob) => {
  if (blob.size < 2 * 1024 * 1024 && !/^image\/(png|jpg|jpeg)$/.test(blob.type)) {
    return blob;
  }

  // still remains for some test cases
  return window.imgReduce(blob, {
    scale: 0.9,
    quality: 0.8,
    type: 'image/jpeg'
  }).then(checkAndReduce);
};


/**
 * fetch image
 * transform it into BASE64
 */
const fetchImage = (url) => {
  return fetch(url).then(r => r.blob())
    .then(checkAndReduceBlob)
    .then(blobToDataURI)
    .catch(e => null);
};

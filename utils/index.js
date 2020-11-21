
/**
 *解析url为对象
 *
 * @param {*} href url
 * @returns obj | null
 */
function urlParse(href) {
  if (!href) return;
  const reg = /([^?=&]+)=([^?=&]*)/g;
  let obj = Object.create(null);
  href.replace(reg, function (str, key, val) {
    var k = decodeURIComponent(key),
      v = decodeURIComponent(val);
    obj[k] = v || "";
  });
  return obj;
}

module.exports = {
  urlParse
}
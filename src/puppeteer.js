const fs = require("fs");
const path = require("path");
const isPro =
  process.env.NODE_ENV === "production" ? true : false;
const puppeteer = isPro ?  require('puppeteer') : require("puppeteer-core");
// let request = require('request-promise-native');
const { urlParse } = require("../utils/index");
const executablePath = isPro ? Object.create(null) : {executablePath :path.resolve("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe")}
const puppeteerBrowser = (() => {
  let browser = null;
  return async function () {
    if (!browser) {
      browser = await puppeteer.launch({
        headless: true, //有浏览器界面启动
        slowMo: 100, //放慢浏览器执行速度，方便测试观察
        ...executablePath,
        args: [
          //启动 Chrome 的参数，详见上文中的介绍
          "–no-sandbox",
          "--window-size=1280,960",
        ],
      });
    }
    return browser;
  };
})();

/**
 *headless页面爬取
 *
 * @param {*} entry 网页入口
 * @param {*} selector 选择器
 * @param {*} actions 操作数组，[{ele:'',event:'', value:''}]
 * @returns
 */
async function spiderHeadless(entry, selector, actions) {
  if (!entry) return;
  const browser = await puppeteerBrowser();
  const page = await browser.newPage();
  await page.goto(entry);
  if (actions && actions.length) {
    for (let i = 0; i < actions.length; i++) {
      let action = actions[i];
      await page.$(action.ele);
      if (["select", "type"].includes(action.event)) {
        await page[action.event](action.ele, action.value);
      } else {
        await page[action.event](action.ele);
      }
    }
  }

  let arr = await page.$$eval(selector, function (e) {
    if (!e) return;
    const listArr = [];
    for (let i = 0; i < e.length; i++) {
      const href = e[i].getAttribute("href");
      const title = e[i].getAttribute("title");
      listArr.push({
        href,
        title,
      });
    }
    return listArr;
  });
  if (arr && arr.length) {
    arr = arr.map((item) => {
      const params = urlParse(item.href);
      item = {
        ...params,
        ...item,
      };
      return item;
    });
  }
  await page.close();
  await browser.close();
  console.log("puppetter end");
}

module.exports = {
  puppeteerBrowser,
  spiderHeadless,
};

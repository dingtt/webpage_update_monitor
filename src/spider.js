const cheerio = require("cheerio");
const charset = require("superagent-charset");
const superagent = charset(require("superagent"));
const { Item, Content } = require("../model/dataModel");
const { spiderHeadless } = require("./puppeteer");
const { urlParse } = require("../utils/index");
const { filterUrl, saveContent } = require("./handleData");

async function spiderSuperagent(url) {
  return new Promise((resolve, reject) => {
    superagent
      .get(url)
      .charset("utf-8")
      .buffer(true)
      .end((err, data) => {
        if (err) {
          reject(err);
        }
        if (data) {
          resolve(data);
        }
      });
  });
}

/**
 * cheerio.load
 *
 * @param {*} data 爬取数据
 * @returns
 */
function parsePage(data) {
  if (!data || !data.text) return;
  const $ = cheerio.load(data.text, {
    decodeEntities: false,
    ignoreWhitespace: false,
    xmlMode: false,
    lowerCaseTags: false,
  });
  return $;
}

/**
 * 遍历dom元素
 *
 * @param {*} _$ chario $(html)
 * @param {*} eles 元素
 * @returns
 */
function eachDomLi(_$, eles) {
  if (!eles) return;
  const listArr = [];
  eles.each((index, element) => {
    let $element = _$(element);
    const href = $element.find("a").attr("href");
    const params = urlParse(href);
    // 解析href
    listArr.push({
      ...params,
      href,
      title: $element.find("a").attr('title'),
    });
  });
  return listArr;
}

/**
 *爬取列表
 *
 * @param {*} listUrl 列表url
 * @param {*} selector 列表元素选择器
 * @returns
 */
async function spiderList(listUrl, selector) {
  const data = await spiderSuperagent(listUrl);
  const $html = parsePage(data);
  const eles = $html(selector);
  const arr = eachDomLi($html, eles);
  return arr;
}

/**
 *  爬取
 *
 * @param {*} target 爬取目标对象
 * @returns
 */
async function spider(target) {
  const keywordsArr = target.keywords.length ? target.keywords : [];
  let listData = null;
  if (target.headless) {
    listData = await spiderHeadless(
      target.entry,
      target.entrySelector,
      target.actions
    );
  } else {
    listData = await spiderList(target.entry, target.entrySelector);
  } // 关键这一步不一样
  const updateList = await filterUrl(target, listData);
  console.log('updateList',target.name, updateList && updateList.length)
  if (updateList && updateList.length) handleDetail(target, updateList);
}

/**
 *  抓取符合要求的详情数据入库
 *
 * @param {*} target 目标对象
 * @param {*} updateList 更新的数据
 */
async function handleDetail(target, updateList) {
  for (let i = 0; i < updateList.length; i++) {
    const keywordsArr = target.keywordsArr
    let detailUrl = target.getDetailUrl(updateList[i].href);
    const data = await spiderSuperagent(detailUrl);
    const $ = parsePage(data);
    const detail = target.detailSelector
      ? $(target.detailSelector).html()
      : $("*").html();
   
    // 需要关键词过滤
    if(keywordsArr && keywordsArr.length){
      const haskeywords = keywordsArr.filter((key) => {
        return detail.indexOf(key) > -1;
      });
      if(haskeywords && haskeywords.length){
        await saveContent(target, updateList[i], detail);
      }
    }else{ // 无需过滤
      await saveContent(target, updateList[i], detail);
    }
  }
}

// 处理详情

module.exports = { spider };

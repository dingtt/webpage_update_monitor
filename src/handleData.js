const { Sequelize, sequelize, Item, Content } = require("../model/dataModel");
const { ZhengCaiResource } = require("./resource");
const config = require("../config/index");
const sendMail = require("./email");
const env =
  process.env.NODE_ENV === "production" ? config.build.env : config.dev.env;

/**
 * 初始化爬取对象
 *
 * @returns
 */
function initResource() {
  const httpArr = env.http;
  const headlessArr = env.headless;
  if (!httpArr && !headlessArr) return;
  let allResourceArr = httpArr.concat(headlessArr);
  let allResourceObj = [];
  for (let i = 0; i < allResourceArr.length; i++) {
    let re = allResourceArr[i];
    createItem(re);
    allResourceObj.push(new ZhengCaiResource(re));
  }
  return allResourceObj;
}

/**
 *  爬取对象入库
 *
 * @param {*} item 爬取对象数据
 */
async function createItem(item) {
  const query = {
    where: {
      id: item.id,
    },
  };
  const has = await Item.findAll(query);
  if (has && has.length) {
    Item.update({ name: item.name }, query)
      .then((res) => {})
      .catch((err) => {
        console.log("err", err);
      });
  } else {
    Item.create({ id: item.id, name: item.name })
      .then((res) => {})
      .catch((err) => {
        console.log("err", err);
      });
  }
}

/**
 * 粗过滤已抓取链接
 *
 * @param {*} listData 新抓取url数组
 * @returns  需要爬取详情的url数组
 */
async function filterUrl(target, listData) {
  if (!listData || !listData.length) return;
  let updateList = null;
  let isExist = false;
  // 抓取项目
  const item = await Item.findOne({ where: { id: target.id } });
  if (item && item.dataValues.lasthref) {
    // 项目记录的最后一个url
    const oldLastHref = item.dataValues.lasthref;
    const record = listData.filter((data, index) => {
      isExist = index;
      return data.href === oldLastHref;
    });
    // 新获取url中包含 lasthref，截取比记录新的href
    console.log(record)
    if (record && record.length) {
      updateList = listData.slice(0, isExist);
    } else {
      updateList = listData;
    }
  } else {
    updateList = listData;
  }
  await Item.update(
    { lasthref: listData[0].href },
    { where: { id: target.id } }
  ).then((r) => {});
  return updateList;
}

/**
 *  保存详情数据
 *
 * @param {*} item  url数据
 * @param {*} detail 详情数据
 */
async function saveContent(target, listItem, detail) {
  listItem.text = detail;
  listItem.isavail = 1;
  listItem.isnew = 1;
  Content.bulkCreate([{ ...listItem, itemId: target.id }], {
    updateOnDuplicate: ["isnew", "isavail"],
  })
    .then((res) => {})
    .catch((err) => {});
}

// 获取更新数据
async function getUpdateData(target) {
  const arr = [];
  const contents = await Content.findAll({
    where: {
      isavail: 1,
      item_id: target.id,
    },
    include: [Item],
  });

  return contents;
}

// 发送邮件提醒
async function sendNotice(target) {
  let contents = await getUpdateData(target);
  if (!contents || !contents.length) return;
  const data = tranData(target, contents);
  contents = contents.map((content) => {
    content.isavail = 0;
    content.isnew = 0;
    return content;
  });
  Content.bulkCreate(JSON.parse(JSON.stringify(contents, null, 2)), {
    updateOnDuplicate: ["isnew", "isavail"],
  })
    .then((res) => {})
    .catch((err) => {});
  console.log("send notice");
  sendMail({
    ...env.email,
    subject: `${contents.length}条--${data.title} ` || "未获取到邮件标题",
    msg: `<br> ${data.html}`,
  });
}

// 转换数据
function tranData(target, arr) {
  console.log("tranData", arr.length);
  if (!arr) return;
  let html = "";
  let title = "";
  if (arr && arr.length) {
    title = arr[0].dataValues.title;
    for (let i = 0; i < arr.length; i++) {
      html += `<a href="${target.host}${arr[i].dataValues.href}">${arr[i].dataValues.title}</a><br>`;
      html += `<table cellspacing="0" cellpadding="1" width="100%" style="border-collapse: collapse" border="1">${arr[i].dataValues.text}</table>`;
      // arr[i].dataValues.isavail = 0;
      // arr[i].dataValues.isnew = 0;
    }
  }
  return {
    html,
    len: arr && arr.length,
    title: title,
  };
}

module.exports = {
  initResource,
  filterUrl,
  saveContent,
  sendNotice,
};

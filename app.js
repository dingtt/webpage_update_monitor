const Koa = require("koa");
const Router = require("koa-router");
const cheerio = require("cheerio");
const charset = require("superagent-charset");
const superagent = charset(require("superagent"));
const app = new Koa();
const router = new Router();
let domain = "http://www.baidu.com";
let ListUrl =
  "http://www.baidu.com/sdgp2017/site/listnew.jsp?grade=province&colcode=0302";
let detailUrl =
  "http://www.baidu.com/sdgp2017/site/listcontnew.jsp?colcode=0302&id=";
let keywords = "工程,西楼";
// let keywords = "工1程,西1楼";
// 数据库操作
const Sequelize = require("sequelize"); // 建立连接
const { findOne } = require("sequelize/lib/model");
console.log("seque");
const sequelize = new Sequelize("webwatch", "ding", "xiaoyan106", {
  host: "localhost",
  port: "3307",
  dialect: "mysql",
  dialectOptions: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    supportBigNumbers: true,
    bigNumberStrings: true,
  }, //需在此处配置，否则中文无法插入
  define: {
    underscored: true,
    charset: "utf8mb4",
  },
  // operatorsAliases: false,
}); // 定义模型
console.log("connect database");
const ListModel = sequelize.define(
  "Lists",
  {
    title: { type: Sequelize.CHAR(100), allowNull: false },
    id: { type: Sequelize.STRING(10), defaultValue: 0, primaryKey: true },
    href: { type: Sequelize.STRING(100) }, 
    time: { type: Sequelize.STRING(10) },
    isnew: { type: Sequelize.INTEGER(1), defaultValue: 0 },
    isavail: { type: Sequelize.INTEGER(1), defaultValue: 0 },
  },
  {
    timestamps: false,
  }
); 
// 同步数据库，force: true则会删除已存在表
console.log("create model");
let ret = ListModel.sync({ force: true });
// let ret = ListModel.sync();
console.log("sync1", ret);

const eachListData = (arr) => {
  for (let i of arr) {
    if (!i || !i.id) return;
    console.log("list", i);
    (async () => {
      let res = await ListModel.findOne({ where: { id: i.id } });
      if (res) {
        // 已记录 无需处理
      } else {
        try {
          let ret = await getDetail(
            `${detailUrl}${i.id}`,
            "#NoticeDetail",
            keywords
          );
          if (ret) {
            console.log("ret", ret);
            if (ret.has) {
              i.isavail = 1;
            }
            let insert = ListModel.create(i);
            console.log("insert", insert);
          }
        } catch (err) {}
      }
    })();
  }
};

const listArr = [];

const getDetail = (url, selector, keywords) => {
  // if(!url)return
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
          let html = data.text;
          // console.log("detail", html);
          const $ = cheerio.load(html, {
            decodeEntities: false,
            ignoreWhitespace: false,
            xmlMode: false,
            lowerCaseTags: false,
          });
          let text = $(selector).text();
          let has = false;
          const arr = keywords.replace("，", ",").split(",");
          if (arr && arr.length) {
            for (var v of arr) {
              if (text.indexOf(v) > -1) {
                has = true;
              }
            }
          }
          if (has) {
            resolve({ has: has, text: text });
          } else {
            reject();
          }
        }
      });
  });
};
// id是否已经存在 不存在的再获取详情 查看是否满足要求 修改标识 存入数据库

router.get("/", function (ctx, context) {
  ctx.body = "搭建好了，开始吧";
  // 列表页面
  superagent
    .get(ListUrl)
    .charset("utf-8")
    .buffer(true)
    .end((err, data) => {
      if (err) {
        console.log("页面不存在");
      }
      let html = data.text;
      const $ = cheerio.load(html, {
        decodeEntities: false,
        ignoreWhitespace: false,
        xmlMode: false,
        lowerCaseTags: false,
      }); //用cheerio解析页面数据
      // 查看第一项是否存在
      let lis = $("#preform .news_list2 li");
      let firstLi = $("#preform .news_list2 li").eq(0);
      let firstHref = firstLi.find("a").attr("href");
      let firstId = firstHref.match(/id=([0-9]+)/)[1];
      if (firstId) {
        ListModel.findOne({ where: { id: firstId } }).then((res) => {
          // res首个匹配项，若没有则为null
          if (res) {
            console.log(res.get());
          } else {
            // 遍历所有dom
            console.log("have update");
            // 数据数组
            const arr = eachDomLi($, lis);
            console.log("have update", arr);
            arr && eachListData(arr);
          }
        });
      }
      // 查看最后一条是否存在，没有翻页page，只抓取首页，可能漏掉数据
      // console.log(listArr);
    });
  ctx.body = listArr;
});

// 遍历dom元素
const eachDomLi = function (_$, eles) {
  if (!eles) return;
  const listArr = [];
  eles.each((index, element) => {
    let $element = _$(element);
    // console.log(element , $element)
    // console.log(index);
    listArr.push({
      title: $element.find("a").attr("title"),
      id: $element
        .find("a")
        .attr("href")
        .match(/id=([0-9]+)/)[1],
      isnew: $element.find("img") ? 1 : 0,
      href: $element.find("a").attr("href"),
      time: $element.find(".hits").text(),
      isavail: 0,
    });
  });
  return listArr;
};

app.use(router.routes()).use(router.allowedMethods);

app.listen(3000, () => {
  console.log("服务已开启");
});

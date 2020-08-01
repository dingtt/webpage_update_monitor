const Koa = require("koa");
const Router = require("koa-router");
const cheerio = require("cheerio");
const charset = require("superagent-charset");
const superagent = charset(require("superagent"));
const app = new Koa();
const router = new Router();

let domain = "http://www.weibo.cn";
let ListUrl =
  "http://www.weibo.cn?grade=province&colcode=0302";
let detailUrl =
  "http://www.weibo.cn?colcode=0302&id=";
// let keywords = "工程,西楼";

let keywords = "工1程,西1楼";
// let ret = await Fruit.sync();
// console.log("sync", ret);
// (async () => {
// 数据库操作
const Sequelize = require("sequelize"); // 建立连接
const { findOne } = require("sequelize/lib/model");
console.log("seque");
const sequelize = new Sequelize("webwatch", "ding", "xiaoyan106", {
  host: "localhost",
  port: "3307",
  dialect: "mysql",
  // operatorsAliases: false,
}); // 定义模型
console.log("connect database");
const ListModel = sequelize.define("Lists", {
  title: { type: Sequelize.STRING(100), allowNull: false },
  // href: { type: Sequelize.FLOAT, allowNull: false },
  id: { type: Sequelize.STRING(10), defaultValue: 0, primaryKey: true },
  href: { type: Sequelize.STRING(100) }, // INTEGER FLOAT
  time: { type: Sequelize.STRING(10) },
  isnew: { type: Sequelize.INTEGER(1), defaultValue: 0 },
  isavail: { type: Sequelize.INTEGER(1), defaultValue: 0 },
}); // 同步数据库，force: true则会删除已存在表
console.log("create model");
// let ret = await ListModel.sync();
// let ret = ListModel.sync({force:true});
let ret = ListModel.sync();

console.log("sync1", ret);
// })();

const eachData = (arr) => {
  for (let i of arr) {
    if (!i) return;
    // let isExist = await findOne('id',i)
    // console.log('isExist',isExist)
    (async () => {
      let res = await ListModel.findOne({ where: { id: i } });
      if (res) {
        // 已记录
      } else {
        //
      }
    })();
  }
};

const promisify = (_this, fn) => {
  return function (data) {
    return new Promise((resolve, reject) => {
      fn.call(
        _this,
        data,
        (res) => {
          resolve(res);
        },
        (err) => {
          reject(err);
        }
      );
    });
  };
};

const listArr = [];

const getDetail = (url,selector, keywords ) => {
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
            resolve({has:has,text:text});
          } else {
            reject(null);
          }
        }
      });
  });
};

router.get("/", function (ctx, context) {
  ctx.body = "搭建好了，开始吧";
  // 测试
  // getDetail(`${detailUrl}201601359`, "");
  getDetail(`${detailUrl}201601359`,"#NoticeDetail" , keywords)
    .then(
      (res) => {
        console.log("detail has", res);
      },
      (err) => {
        console.log("has no", err);
      }
    )
    .catch((err) => {
      console.log("err err", err);
    });
  (async () => {

  })()

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
      // const obj = {};
      // const newlistArr = [];
      // 查看第一项是否存在
      let lis = $("#preform .news_list2 li");
      let firstLi = $("#preform .news_list2 li").eq(0);
      //  console.log(firstLi, Object.prototype.toString.call(firstLi))
      let firstHref = firstLi.find("a").attr("href");
      let firstId = firstHref.match(/id=([0-9]+)/)[1];
      console.log(firstId);
      if (firstId) {
        ListModel.findOne({ where: { id: firstId } }).then((res) => {
          // res首个匹配项，若没有则为null
          console.log("findeOne1");
          if (res) {
            console.log(res.get());
          } else {
            // 遍历所有dom
            console.log("have update");
            // const arr = eachAll($, lis);
            // arr && eachData(arr);
          }
        });

        // async function test2() {
        //   console.log("test2 before");
        //   // let data = ListModel.findOne({ where: { id: firstId } })
        //   try {
        //     let data = await ListModel.findOne({ where: { id: firstId } });
        //     console.log("test2 after");
        //     console.log("test2 after2", data);
        //   } catch (err) {
        //     console.log("test2 after3");
        //     console.log("test2 after3", err);
        //   }
        // }
        // test2();
      }

      // 查看最后一条是否存在，没有翻页page，只抓取首页，可能漏掉数据
      // console.log(listArr);
    });
  ctx.body = listArr;
});

// 遍历dom元素
const eachAll = function (_$, eles) {
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

const Koa = require("koa")
const Router = require("koa-router")
const schedule = require("node-schedule")
const cheerio = require("cheerio")
const spider = require("./spider")
const sendMail = require("./email")

const app = new Koa()
const router = new Router()

var monitor1 = null
var monitor2 = null
let keywords2 = "大学,宿舍"
let domain = "http://www.baidu.com"

// 数据库操作
const Sequelize = require("sequelize") // 建立连接
const { findOne } = require("sequelize/lib/model")
const sequelize = new Sequelize("watch", "root", "xiaoyan106", {
  host: "mysql-watch",
  port: "3306",
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
  timezone: "+08:00", //东八时区
  // operatorsAliases: false,
}) // 定义模型

// 测试连接是否成功
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.")
  })
  .catch((err) => {
    console.log("Unable to connect to the database", err)
  })

console.log("connect database")
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
)
// 同步数据库，force: true则会删除已存在表
// let ret = ListModel.sync({ force: true })
let ret = ListModel.sync()

monitor1 = schedule.scheduleJob(
  { hour: 18, minute: (Math.random() * 60).toFixed(0) },
  function () {
    console.log("watch:" + new Date())
  }
)
monitor2 = schedule.scheduleJob(
  { hour: 12, minute: (Math.random() * 60).toFixed(0) },
  function () {
    console.log("watch:" + new Date())
  }
)

const monitor3 = schedule.scheduleJob(
  { minute: 30 },
  function () {
    console.log("do watch:" + new Date())
    spider(ListModel)
    var timer = setTimeout(() => {
      sendNotice()
      clearTimeout(timer)
    }, 5000);
  }
)


// 查找符合要求的数据
const findData = async () => {
  const res = await ListModel.findAll({
    where: {
      isavail: 1,
    },
  })
  return res
  console.log("findres", res, res[0].dataValues)
}

router.get("/begin", function (ctx, context) {
  ctx.body = "bigin monitor"
})
router.get("/cancel", function (ctx, context) {
  if (monitor1) {
    monitor1.cancel()
  }
  if (monitor2) {
    monitor2.cancel()
  }
  ctx.body = "end monitor"
})

router.get("/", function (ctx, context) {
  ctx.body = "搭建好了，开始吧" + keywords2
})
router.get("/ceshi", function (ctx, context) {
  ctx.body = "搭建好了，开始监控"
  spider(ListModel)
})
router.get("/data", function (ctx, context) {
  // const arr = findData()
  sendNotice()
  ctx.body = "数据"
})

const sendNotice = async () => {
  const arr = await findData()
  if(!arr || !arr.length) return
  const data = sendData(arr, ListModel)
  console.log("send data", data)
  return
  sendMail(
    "1129558839@qq.com",
    "盯梢小助手",
    "1018977091@qq.com",
    `${data.title}等` || "为获取到邮件标题",
    `这是正文。<h2> ${data.title}...</h2><br> ${data.html}`
  )
}

const sendData = (arr, ListModel) => {
  console.log("arr", arr.length)
  // setTimeout(() => {
  // console.log('arr',arr)
  // }, 1000);
  let html = ""
  let title = ""
  if (arr && arr.length) {
    title = arr[0].dataValues.title
    for (let i = 0; i < arr.length; i++) {
      html += `<a href="${domain}${arr[i].dataValues.href}">${arr[i].dataValues.title}</a><br>`
      arr[i].dataValues.isavail = 2
      // ListModel.upert(arr[i].dataValues)
      ListModel.update(
        {
          isavail: 2,
        },
        {
          where: {
            id: arr[i].dataValues.id,
            isavail: 1,
          },
        }
      )
      // list.update(arr[i].dataValues)
    }
  }
  console.log("html", html)
  return {
    html,
    len: arr && arr.length,
    title: title,
  }
}

router.get("/changekeywords", function (ctx, context) {
  keywords2 == "济宁"
  ctx.body = "搭建好了，开始吧" + keywords2
})

app.use(router.routes()).use(router.allowedMethods)

app.listen(3000, () => {
  console.log("服务已开启")
})

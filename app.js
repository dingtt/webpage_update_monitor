const Koa = require("koa")
const Router = require("koa-router")
const schedule = require("node-schedule")
const cheerio = require("cheerio")
const spider = require("./spider")

const app = new Koa()
const router = new Router()

var monitor1 = null
var monitor2 = null
let keywords2 = "工1程,西1楼"
// 数据库操作
const Sequelize = require("sequelize") // 建立连接
const { findOne } = require("sequelize/lib/model")
console.log("seque")
const sequelize = new Sequelize("watch", "kab", "60016001", {
  host: "localhost",
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
console.log("create model")
let ret = ListModel.sync({ force: true })
// let ret = ListModel.sync();
console.log("sync1", ret)

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

// 查找符合要求的数据
const findData = () => {
  const res = ListModel.findAll({
    where: {
      authorId: 2,
    },
  })
  console.log('findres',res)
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

router.get("/changekeywords", function (ctx, context) {
  keywords2 == "济宁"
  ctx.body = "搭建好了，开始吧" + keywords2
})

app.use(router.routes()).use(router.allowedMethods)

app.listen(3000, () => {
  console.log("服务已开启")
})

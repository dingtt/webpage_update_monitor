const Koa = require("koa");
const Router = require("koa-router");
const schedule = require("node-schedule");
require("dotenv").config();
const { spider } = require("./src/spider");
const { initResource, sendNotice } = require("./src/handleData");
const app = new Koa();
const router = new Router();
const isPro = process.env.NODE_ENV === "production" ? true : false;

const beginMonitor = function () {
  const monitor1 = schedule.scheduleJob(
    { hour: 18, minute: (Math.random() * 60).toFixed(0) },
    function () {
      monitor();
      console.log("watch 18:" + new Date().toLocaleString());
    }
  );
  const monitor2 = schedule.scheduleJob(
    { hour: 12, minute: (Math.random() * 60).toFixed(0) },
    function () {
      monitor();
      console.log("watch 12:" + new Date().toLocaleString());
    }
  );
  // if (!isPro) {
    const monitorTest = schedule.scheduleJob({ minute: 5 }, function () {
      monitor();
      console.log("do watch:" + new Date().toLocaleString());
    });
  // }
  console.log('beginMonitor')
};

const resource = initResource();
const monitor = async function () {
  console.log("monitor");
  if (resource && resource.length) {
    for (let i = 0; i < resource.length; i++) {
      await spider(resource[i]);
      let timer = setTimeout(async () => {
        await sendNotice(resource[i]);
        clearTimeout(timer);
      }, 5000);
    }
  }
};
monitor()
router.get("/", function (ctx, context) {
  ctx.body = "running";
});

app.use(router.routes()).use(router.allowedMethods);

app.listen(3000, () => {
  // beginMonitor();
  // monitor()
  console.log("服务已开启");
});

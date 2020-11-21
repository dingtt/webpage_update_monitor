const Sequelize = require("sequelize");
const configs = require("../config/index")
// const isPro =  process.env.NODE_ENV === "production" ? true : false

Sequelize.instance = (function () {
  let sequelize = null;
  return function () {
    if (!sequelize) {
      sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
        // host: "watch2-mysql",
        host: process.env.MYSQL_ROOT_HOST,
        port: process.env.MYSQL_PORT,
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
          freezeTableName: true
        },
        timezone: "+08:00", //东八时区
        // operatorsAliases: false,
      });
    }
    // 测试连接是否成功
    sequelize
      .authenticate()
      .then(() => {
        console.log("Connection has been established successfully.");
      })
      .catch((err) => {
        console.log("Unable to connect to the database", err);
      });

    return sequelize;
  };
})();

module.exports = Sequelize;

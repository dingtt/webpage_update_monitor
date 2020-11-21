const Sequelize = require("./sequelize");
const sequelize = Sequelize.instance();
// 内容
const Content = sequelize.define("content", {
  title: { type: Sequelize.CHAR(100) },
  id: { type: Sequelize.INTEGER(10), defaultValue: 0, primaryKey: true },
  href: { type: Sequelize.STRING(100) },
  time: { type: Sequelize.STRING(10) },
  isnew: { type: Sequelize.INTEGER(1), defaultValue: 0 },
  isavail: { type: Sequelize.INTEGER(1), defaultValue: 0 },
  text: { type: Sequelize.STRING(1000) },
});
// 项目
const Item = sequelize.define(
  "item",
  {
    id: {
      type:  Sequelize.INTEGER(10) , //Sequelize.DataTypes.UUID,
      defaultValue: 0,//  Sequelize.DataTypes.UUIDV1,
      primaryKey: true,
    },
    name: { type: Sequelize.STRING(10) },
    type: { type: Sequelize.STRING(10) },
    keywords: { type: Sequelize.STRING(10) },
    lasthref: { type: Sequelize.STRING(200) },
  },
  {
    timestamps: false,
  }
);
// 一对多
Content.belongsTo(Item);
Item.hasMany(Content);

module.exports = {
  Content,
  Item,
  sequelize,
  Sequelize
};

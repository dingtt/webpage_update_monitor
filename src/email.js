const nodemailer = require("nodemailer");
const config = require("../config/index");

/**
 * 发送邮件
 *
 * @param {*} from 发件人
 * @param {*} aliasName 标题别名
 * @param {*} tos 收件人邮箱，多个邮箱地址间用英文逗号隔开
 * @param {*} subject 主题
 * @param {*} msg 正文（支持html格式）
 */
function sendMail({from, aliasName, tos, subject, msg,host, user, pass}) {
  const smtpTransport = getSMTPTransport(host, user, pass);
  if(!from) from = user
  smtpTransport.sendMail(
    {
      from: aliasName + " " + "<" + from + ">",
      to: tos,
      subject: subject,
      //text    : msg,
      html: msg,
    },
    function (err, res) {
      if (err) {
        console.log("error: ", err);
      }
    }
  );
}

/**
 * 建立连接
 *
 * @param {*} host  主机
 * @param {*} from 用户
 * @param {*} pass 密钥
 * @returns
 */
function getSMTPTransport(host, from, pass) {
  const smtpTransport = nodemailer.createTransport({
    host: host,
    secureConnection: true, // use SSL
    secure: true,
    port: 465,
    auth: {
      user: from,
      pass: pass, 
    },
  });
  return smtpTransport;
}

// function nl2br(str, isXhtml) {
//     var breakTag = (isXhtml || typeof isXhtml === 'undefined') ? '<br />' : '<br>';
//     var str = (str + '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
//     return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
// };

module.exports = sendMail;

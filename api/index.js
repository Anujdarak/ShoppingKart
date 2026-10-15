const app = require("../server/app");

const functionPath = "/api/index";

module.exports = (req, res) => {
  if (req.url === functionPath) {
    req.url = "/";
  } else if (req.url.startsWith(`${functionPath}/`)) {
    req.url = req.url.slice(functionPath.length);
  }

  return app(req, res);
};

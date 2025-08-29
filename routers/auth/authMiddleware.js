const JWT = require("jsonwebtoken");
const Users = require("../../database/Models/Users");

const authMiddleware = async (req, res, next) => {
  try {
    const clientSession = req.headers.authorization;
    console.log(req.headers)
    if (!clientSession) {
      return res.status(401).json({
        message: "Unauthorized! No client session found",
        status: "Error",
      });
    }
    //   if client session exist....
    const clientInfo = JWT.decode(clientSession);
    if (!clientInfo) {
      return res.status(401).json({
        message: "Unauthorized! client session expired",
        status: "Error",
      });
    }

    const userInfo = await Users.findById(clientInfo.user).populate('tasks');
    // console.log(userInfo,'userInfo');

    if (!userInfo) {
      return res.status(401).json({
        message: "No User Data Found",
        status: "Error",
      });
    }

    req.user = userInfo;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      message: "Unauthorized! session expired",
      status: "Error",
    });
  }
};

module.exports = authMiddleware;

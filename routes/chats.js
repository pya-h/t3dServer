const express = require('express');
const { Routes } = require('../configs');
const router = express.Router();
const chatsController = require('../controllers/chats');
const authenticate = require("../middlewares/authenticate");

//------------- /chat/single/:playerID
router.get(`/${Routes.SingleChat}/:friendID`, authenticate.token, chatsController.getOurChat);

//------------- /chat/single/:playerID
router.get(`/${Routes.Interactions}`, authenticate.token, chatsController.getMyInteractions);


module.exports = router;
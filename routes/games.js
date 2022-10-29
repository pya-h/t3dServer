const express = require('express');
const { Routes } = require('../configs');
const router = express.Router();
const gamesController = require('../controllers/games');
const authenticate = require("../middlewares/authenticate");

//------------- /games/ GET method
router.get('/', gamesController.getAllGames);

//------------- /games/mine -> get my games only
router.get(`/${Routes.Mine}`, authenticate.token, gamesController.getMyGames);

module.exports = router;
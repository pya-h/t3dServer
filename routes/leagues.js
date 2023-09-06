const express = require('express');
const { Routes } = require('../configs');
const router = express.Router();
const leaguesController = require('../controllers/leagues');
const authenticate = require("../middlewares/authenticate");

//------------- /leagues/leagues
router.get("/", leaguesController.fetch);

//------------ GET/POST Methods:
//------------ /leagues/list/:leagueID -> join a league
router.get(`/${Routes.LeaguesList}/:leagueID`, authenticate.token, leaguesController.load);
router.post(`/${Routes.LeaguesList}/:leagueID`, authenticate.token, leaguesController.join);

// for admin
router.post(`/${Routes.NewLeague}`, authenticate.token, authenticate.admin, authenticate.password, leaguesController.create);

module.exports = router;

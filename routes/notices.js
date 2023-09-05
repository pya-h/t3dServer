const express = require("express");
const router = express.Router();
const noticesController = require("../controllers/notices");
const authenticate = require("../middlewares/authenticate");
const { body } = require("express-validator");
const { Routes, PayloadRequirements } = require("../configs");

//------------- /notices/ GET method ( for common users)
router.get("/", noticesController.getShortNotices);

router.get(
    `/${Routes.NoticeManagement}`,
    authenticate.token,
    authenticate.admin,
    noticesController.getAdvancedNotices
);

//------------- /notices/ POST method
router.post(
    `/${Routes.NoticeManagement}`,
    authenticate.token,
    authenticate.admin, [
        body("title")
        .isString()
        .trim()
        .isLength(PayloadRequirements.Notices.TitleLength)
        .withMessage("title is not valid."),
        body("text").isString().trim().isLength(PayloadRequirements.Notices.TextLength),
        body("startDate").not().isEmpty(), //isDate()
        body("endDate").not().isEmpty(), //isDate()
    ],
    noticesController.createNotice
);

//-------------- /notices/manage/:_id
router.put(
    `/${Routes.NoticeManagement}/:noticeID`,
    authenticate.token,
    authenticate.admin, [
        // how to check -id => is it needed seriously? :|
        body("title")
        .isString()
        .trim()
        .isLength(PayloadRequirements.Notices.TitleLength)
        .withMessage("title is not valid."),
        body("text").isString().trim().isLength(PayloadRequirements.Notices.TextLength),
        body("startDate").not().isEmpty(), //isDate()
        body("endDate").not().isEmpty(), //isDate()
    ],
    noticesController.editNotice
);
module.exports = router;
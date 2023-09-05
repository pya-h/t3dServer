const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/avats/");
    },
    filename: (req, file, cb) => {
        cb(null, req.CurrentUser.id.toString() + '.jpg');
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
        cb(null, true);
    } else {
        cb(new Error("Accepted images: jpeg,png"), false);
    }
};

const upload = multer({ dest: "avats/", storage, fileFilter: fileFilter });

module.exports = upload;
module.exports = {
    Users: {
        FullnameLength: { min: 6 },
        PasswordLength: { min: 6, max: 15 },
        StudenIDLength: { min: 8, max: 8 },
    },
    Notices: {
        TitleLength: { min: 3, max: 30 },
        TextLength: { min: 5, max: 200 },
    }
};
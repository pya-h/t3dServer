const Port = process.env.PORT || 8080,
    // Host = "pheelstyle.ir/t3d",
    Host = "localhost",
    isHttps = true;

//server routes
module.exports = {
    Port,
    Host,
    HttpRoot: `${isHttps ? "https" : "http"}://${Host}:${Port}`,
    Avatars: "avats",
    webSocketRoot: `${isHttps ? "wss" : "ws"}://${Host}:${Port}`,
    webSocketRoute: "ws",
    wsGamePlayRoute: "gameplay",
    wsGlobalRoute: "global",
    SignUp: "signup",
    SignIn: "signin",
    Users: "users",
    Private: "private",
    Credentials: "credentials",
    MyAvatar: "avatar",
    PasswordChange: "password",
    Friends: "friends",
    Records: "records",
    Administrators: "administrators",
    Games: "games",
    Mine: "mine",
    Leagues: "leagues",
    NewLeague: "new",
    LeaguesList: "list",
    Chats: "chats",
    SingleChat: "single",
    Interactions: "interact",
    Notices: "notices",
    NoticeManagement: "manage"
};
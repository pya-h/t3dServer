const Port = 8080,
    Host = "localHost",
    isHttps = true;

// other previously used Host:
// const Host = t3d.iran.liara.runl;
// const Host = t3dweb.herokuapp.com;
// const Host = "onlinepricer.fun:${Port}";

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
    Attend: "attend",
    Chats: "chats",
    SingleChat: "single",
    Interactions: "interact",
    Notices: "notices",
    NoticeManagement: "manage"
};

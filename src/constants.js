export default {
    savePath : "data",
    TIMES : {
        ANSWER: 10,
        BUZZ: 10,
        MULTIPLE_CHOICE: 15
    },
    sessions : {
        SESSION_EXPIRE_HOURS: 24,
        SESSION_COOKIE_NAME: "trivia-session",
        SESSION_CLEAR_DELAY_MIN: 30
    },
    nidgets : {
        SCRIPT_PATH: "./src/client/nidgets"
    },
    locations : {
        HOST : "host.ejs"
    },
    names: {
        HOST : "@HOST"
    }
};

// set SESSION_CLEAR_DELAY_MIN to -1 to disable.
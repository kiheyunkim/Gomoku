const fs = require('fs');
const mysql = require('mysql');

const mysqlInfo = JSON.parse(fs.readFileSync(__dirname + '/AuthInfo/MysqlInfo.json', {encoding: 'UTF-8'}));
const connection = mysql.createConnection({
    host: mysqlInfo.host,
    port: mysqlInfo.port,
    user: mysqlInfo.user,
    password: mysqlInfo.password,
    database: mysqlInfo.database
});

//1시간 마다 의무적으로 쿼리를 보냄 = 끊김 방지
let keepAliveInterval = setInterval(() => {
    connection.query('select 1', (error, results, fields) => {
        if (error)
            throw error;
    })
}, 3600000);


const checkId = (id) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT count(*) FROM user WHERE id = ?', [id], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const checkNickName = (nickname) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT count(*) FROM user WHERE nickname = ?', [nickname], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const signUpAccount = (id, password, nickname) => {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO user(id ,passwd, nickname) VALUES(?,?,?)', [id, password, nickname], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const checkLogin = (id, password) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT nickname FROM user WHERE id = ? AND passwd = ?', [id, password], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const getStatic = (nickname) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT win, lose FROM statistic WHERE nickname = ?', [nickname], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const renewStatic = (nickname, win, lose) => {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE statistic SET win=?, lose=? WHERE nickname=?', [win, lose, nickname], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const setStatic = (nickname) => {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO statistic(nickname) VALUE(?)', [nickname], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const loginCheck = (nickname) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT count(*) FROM preventOverlapLogin WHERE nickname=?', [nickname], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const enRollLogin = (nickname) => {       //check is already Login
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO preventOverlapLogin VALUES(?)', [nickname], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const enRollLogOut = (nickname) => {      //if account logout clear login flag
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM preventOverlapLogin WHERE nickname = ?', [nickname], (error, results, field) => {
            if (error) {
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}

const initPreventOverlapLogin = () => {
    return new Promise((resolve, reject) => {
        connection.query('truncate `preventOverlapLogin`', (error, results, field) => {
            if (error) {
                console.log(error);
                reject('error');
            } else {
                resolve(results);
            }
        });
    });
}


module.exports =
    {
        checkId,
        checkNickName,
        signUpAccount,
        checkLogin,
        getStatic,
        setStatic,
        renewStatic,
        loginCheck,
        enRollLogin,
        enRollLogOut,
        initPreventOverlapLogin
    }

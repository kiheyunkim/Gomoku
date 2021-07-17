CREATE DATABASE IF NOT EXISTS omok;

USE omok;

CREATE TABLE IF NOT EXISTS user(
    id varchar(30) NOT NULL,
    passwd varchar(256) NOT NULL,
    nickname varchar(30) NOT NULL,
    PRIMARY KEY (nickname)
);

CREATE TABLE IF NOT EXISTS statistic (
    nickname varchar(30) NOT NULL,
    win int DEFAULT 0,
    lose int DEFAULT 0,
    PRIMARY KEY (nickname),
    FOREIGN KEY (nickname) REFERENCES user(nickname)
);

CREATE TABLE IF NOT EXISTS preventOverlapLogin(
    nickname varchar(30) NOT NULL,
    PRIMARY KEY (nickname),
    FOREIGN KEY (nickname) REFERENCES user(nickname)
);

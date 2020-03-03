CREATE DATABASE OMOK;

USE OMOK;

DROP TABLE statistic;
DROP TABLE user;


CREATE TABLE user(
    id varchar(30) NOT NULL,
    passwd varchar(256) NOT NULL,
    nickname varchar(30) NOT NULL,
    PRIMARY KEY (nickname)
);

CREATE TABLE statistic (
    nickname varchar(30) NOT NULL,
    win int DEFAULT 0,
    lose int DEFAULT 0,
    PRIMARY KEY (nickname),
    FOREIGN KEY (nickname) REFERENCES user(nickname)
);

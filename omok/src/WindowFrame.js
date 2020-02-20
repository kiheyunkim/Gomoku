import React from "react";
import GameRoom from './GameRoom';
import WaittingRoom from './WaittingRoom';
import LoginRoom from './Login';
import './WindowFrame.css';
import {NavLink, Route, HashRouter} from "react-router-dom";

const socketIo = require('socket.io-client');

class WindowFrame extends React.Component{
    constructor(props){
        super(props);
        this.socket = socketIo('http://127.0.0.1:4000');
        this.socket.emit('EnterNotify','request');//접속 요청
        this.readySocket();

        this.socket.on('disconnect',()=>{
            console.log('disconnected');
        })
    }

    readySocket = () => {
        this.socket.on('Result',(recv)=>{
            if(recv.type === 'Entry'){
                console.log(recv.result);
            }
        })

        this.socket.on('chattingRecv',(recv)=>{
            console.log('돌아온 채팅내용  ' + recv.result);
            //채팅 내용 작성
        });

        this.socket.on('OpponentTurnEnd',()=>{
            console.log('상대의 턴이 끝났습니다');
            this.isMyTurn = true;
            //상대 턴 끝남 알림
        });
    }

    cleanUpSocket = () =>{
        this.socket.off('Result',)
    }

    render(){
        //NavLink를 동적으로 생성하면 좋을듯 함.
        return(
            <HashRouter>
                <div>
                    <ul>
                        <h1>O-MOK!</h1>
                        <li><NavLink exact to='/'>Home</NavLink></li>
                        <li><NavLink to='/Waiting'>Waiting</NavLink></li>
                        <li><NavLink to='/Game'>Game</NavLink></li>
                    </ul>
                    <div>
                        <Route exact path='/' component={()=><LoginRoom socket={this.socket}/>}/>
                        <Route exact path='/Waiting' component={()=><WaittingRoom socket={this.socket}/>}/>
                        <Route exact path='/Game' component={()=><GameRoom socket={this.socket}/>}/>
                    </div>
                </div>
            </HashRouter>
        )
    }
}

export default WindowFrame;
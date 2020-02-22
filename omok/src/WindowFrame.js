import React from "react";
import GameRoom from './Game/GameRoom';
import WaittingRoom from './WaittingRoom';
import LoginRoom from './Login';
import Room from './Room'
import './WindowFrame.css';
import {Route, HashRouter, Redirect} from "react-router-dom";

const socketIo = require('socket.io-client');

class WindowFrame extends React.Component{
    constructor(props){
        super(props);
        this.socket = socketIo('http://127.0.0.1:4000');
        this.socket.emit('RequestWaitingRoom','');//접속 요청
        this.waitingRoomId='';
        this.readySocket();

        this.state={currentPage:'/Waiting'};
    }

    readySocket = () => {
        this.socket.on('Result',(recv)=>{   
            this.waitingRoomId = recv.roomId;
            this.socket.off('Result',()=>{})
        });
    }

    navigateOtherPage = (navTo)=>{
        this.setState({currentPage:navTo});
    }

    render(){
        //NavLink를 동적으로 생성하면 좋을듯 함.
        return(
            <HashRouter>
                <Redirect to = {this.state.currentPage}/>
                <div>
                    <button onClick={()=>this.navigateOtherPage()}>버튼</button>

                    <div>
                        <Route exact path='/' component={()=><LoginRoom socket={this.socket} navTo={this.navigateOtherPage}/>}/>
                        <Route exact path='/Waiting' component={()=><WaittingRoom socket={this.socket} navTo={this.navigateOtherPage} />}/>
                        <Route exact path='/Room' component={()=><Room socket={this.socket} navTo={this.navigateOtherPage}/>}/>
                        <Route exact path='/Game' component={()=><GameRoom socket={this.socket} navTo={this.navigateOtherPage}/>}/>
                    </div>
                </div>
            </HashRouter>
        )
    }
}

export default WindowFrame;
/*
    <ul>
        <h1>O-MOK!</h1>
        <li><NavLink exact to='/'>Home</NavLink></li>
        <li><a href='#/Waiting'>Waiting</a></li>
        <li><NavLink to='/Room'>Room</NavLink></li>
        <li><NavLink to='/Game'>Game</NavLink></li>
    </ul>
*/
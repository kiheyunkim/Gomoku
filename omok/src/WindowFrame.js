import React from "react";
import GameRoom from './Game/GameRoom';
import WaittingRoom from './WaittingRoom';
import LoginRoom from './Login';
import Room from './Room'
import './WindowFrame.css';
import {NavLink, Route, HashRouter} from "react-router-dom";

const socketIo = require('socket.io-client');

class WindowFrame extends React.Component{
    constructor(props){
        super(props);
        this.socket = socketIo('http://127.0.0.1:4000');
        this.socket.emit('RequestWaitingRoom','');//접속 요청
        this.waitingRoomId='';
        this.readySocket();

    }

    readySocket = () => {
        this.socket.on('Result',(recv)=>{   
            this.waitingRoomId = recv.roomId;
            this.socket.off('Result',()=>{})
        });
    }

    next = () =>{
        this.props.history.push('/Waiting');
    }

    next2 = () =>{
        this.props.history.push('/Room');
    }

    render(){
        //NavLink를 동적으로 생성하면 좋을듯 함.
        //<Route exact path='/' component={()=><LoginRoom socket={this.socket} navTo={this.navigateOtherPage}/>}/>
        return(
            <HashRouter>
            <button onClick={()=>this.next()}>버튼1</button>
            <button onClick={()=>this.next2()}>버튼2</button>
                <h1>O-MOK!</h1>
                <NavLink to='/login'></NavLink>
                <NavLink to='/Waiting'></NavLink>
                <NavLink to='/Room'></NavLink>
                <NavLink to='/Game'></NavLink>
                    <div>
                        <Route exact path='/login' component={()=><LoginRoom socket={this.socket}/>}/>
                        <Route exact path='/Waiting' component={()=><WaittingRoom socket={this.socket} navTo={this.navigateOtherPage} />}/>
                        <Route exact path='/Room' component={()=><Room socket={this.socket} navTo={this.navigateOtherPage}/>}/>
                        <Route exact path='/Game' component={()=><GameRoom socket={this.socket} navTo={this.navigateOtherPage}/>}/>
                    </div>
            </HashRouter>
        )
    }
}

export default WindowFrame;
/*
    <ul>
        
                <NavLink to='/login'></NavLink>
                <NavLink to='/Waiting'></NavLink>
                <NavLink to='/Room'></NavLink>
                <NavLink to='/Game'></NavLink>
        <li><NavLink exact to='/'>Home</NavLink></li>
        <li><a href='#/Waiting'>Waiting</a></li>
        <li><NavLink to='/Room'>Room</NavLink></li>
        <li><NavLink to='/Game'>Game</NavLink></li>
    </ul>
*/
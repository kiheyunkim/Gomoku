import React from "react";
import GameRoom from './Game/GameRoom';
import WaittingRoom from './WaittingRoom';
import LoginRoom from './Login';
import Room from './Room'
import './WindowFrame.css';

const socketIo = require('socket.io-client');

class WindowFrame extends React.Component{
    constructor(props){
        super(props);
        this.socket = socketIo('http://127.0.0.1:4000');
        this.readySocket();
        
        this.state={ScreenState:''};
        this.socket.emit('RequestWaitingRoom','');//접속 요청
    }

    readySocket = () => {
        this.socket.on('ScreenChange',(recv)=>{
            this.setState({ScreenState:recv.ScreenType})
        })

        this.socket.on('disconnect',(reason)=>{
            alert('서버가 종료되었습니다 '+reason);
        });
    }

    render(){
        let renderArr = [];
        console.log(this.state.ScreenState);
        if(this.state.ScreenState === 'Login'){
            renderArr.push(<LoginRoom key='1' socket={this.socket}/>);
        }else if(this.state.ScreenState === 'Waiting'){
            renderArr.push(<WaittingRoom key='1' socket={this.socket}/>);
        }else if(this.state.ScreenState === 'WaitingRoomng'){
            renderArr.push(<Room key='1' socket={this.socket}/>);
        }else if(this.state.ScreenState === 'Game'){
            renderArr.push(<GameRoom key='1' socket={this.socket}/>);
        }else{
            //404처리
        }
        
        return(
            <div>
                <button onClick={()=>this.setState({ScreenState:'Game'})}>버튼1</button>
                <button onClick={()=>this.next2()}>버튼2</button>
                {renderArr}
            </div>
        )
    }
}

export default WindowFrame;
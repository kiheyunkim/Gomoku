import React from "react";
import GameRoom from './GameRoom';
import WaittingRoom from './WaittingRoom';
import LoginRoom from './Login';
import Room from './Room'

const socketIo = require('socket.io-client');

class WindowFrame extends React.Component{
    constructor(props){
        super(props);
        this.socket = socketIo('http://121.168.178.27:4000');
        this.readySocket();
        
        this.state={ScreenState:''};
        this.socket.emit('LoginScreenRequest','');//접속 요청
        
        this.roomName = '';
        this.roomNumber = 0;
    }

    readySocket = () => {
        this.socket.on('ScreenChange',(recv)=>{
            if(recv.ScreenType === 'WaitingRoom'){
                this.roomName = recv.roomTitle;
                this.roomNumber = recv.roomNumber;
            }
            this.setState({ScreenState:recv.ScreenType})
        })

        this.socket.on('disconnect',(reason)=>{
            alert('서버가 종료되었습니다 '+reason);
        });
    }

    render(){
        let renderArr = [];;
        if(this.state.ScreenState === 'Login'){
            renderArr.push(<LoginRoom key='1' socket={this.socket}/>);
        }else if(this.state.ScreenState === 'Waiting'){
            renderArr.push(<WaittingRoom key='1' socket={this.socket}/>);
        }else if(this.state.ScreenState === 'WaitingRoom'){
            renderArr.push(<Room key='1' socket={this.socket} roomNumber={this.roomNumber} roomName={this.roomName}/>);
        }else if(this.state.ScreenState === 'Game'){
            renderArr.push(<GameRoom key='1' socket={this.socket}/>);
        }else{
            //404처리
        }
        
        return(
            <div>
                {renderArr}
            </div>
        )
    }
}

export default WindowFrame;
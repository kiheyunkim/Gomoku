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
        this.socket.emit('RequestWaitingRoom','');//접속 요청
        this.waitingRoomId='';
        this.readySocket();

        this.state={ScreenState:'Waiting'};
    }

    readySocket = () => {
        this.socket.on('Result',(recv)=>{   
            this.waitingRoomId = recv.roomId;
            this.socket.off('Result',()=>{})
        });

        this.socket.on('disconnect',(reason)=>{
            console.log('disconnected Reason:'+reason);
            console.log(this.socket.disconnected);
            this.socket.disconnect();
            //this.socket = socketIo('http://127.0.0.1:4000');
        })
    }

    next = () =>{
        this.setState({ScreenState:'Waiting'});
    }

    next2 = () =>{
        this.setState({ScreenState:'WaitingRoomng'});
    }

    navigateOtherPage = (path) =>{
        this.setState({ScreenState:path})
    }

    render(){
        
        let renderArr = [];
        if(this.state.ScreenState === 'Login'){
            renderArr.push(<LoginRoom key='1' socket={this.socket}/>);
        }else if(this.state.ScreenState === 'Waiting'){
            renderArr.push(<WaittingRoom key='1' socket={this.socket} navTo={this.navigateOtherPage} />);
        }else if(this.state.ScreenState === 'WaitingRoomng'){
            renderArr.push(<Room key='1' socket={this.socket} navTo={this.navigateOtherPage}/>);
        }else if(this.state.ScreenState === 'Game')
            renderArr.push(<GameRoom key='1' socket={this.socket} navTo={this.navigateOtherPage}/>);
        
        return(
            <div>
                <button onClick={()=>this.next()}>버튼1</button>
                <button onClick={()=>this.next2()}>버튼2</button>
                {renderArr}
            </div>
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
*/
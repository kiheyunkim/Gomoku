import StoneManager from './StoneManager'
import Chatting  from './Chatting'
const React = require('react');
const socketIo = require('socket.io-client');

class GameRoom extends React.Component{ //각 개인이 접속되어 보이는 창
    constructor(props){     //소켓처리 -> 팀 할당받아야함
        super(props);
        this.team = 'black';
        this.isMyTurn = true;
        this.socket = socketIo('http://127.0.0.1:4000');
        this.readySocket();
        this.socket.emit('EnterNotify','request');//접속 요청
    }

    readySocket = ()=>{
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

    RequestStart = ()=>{
        this.socket.emit('RequstStart','roomName');
    }


    clickTarget = (changfunc, x, y) =>{
        if(!this.isMyTurn){
            alert('당신의 턴이 아닙니다');
            return;
        } 

        //소켓을 통한 올바른 선택인지 확인
        //통과 되면 실행


        changfunc(this.team);

        //소켓을 통한 선택 통보
    }
    render(){
        return(
            <div>
                <StoneManager placeStone = {this.clickTarget}/>   
                <Chatting />
            </div>
        )
    }
}

export default GameRoom;
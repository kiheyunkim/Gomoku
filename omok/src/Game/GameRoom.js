import StoneManager from './StoneManager'
import Chatting  from './Chatting'
const React = require('react');

class GameRoom extends React.Component{ //각 개인이 접속되어 보이는 창
    constructor(props){     //소켓처리 -> 팀 할당받아야함
        super(props);
        this.socket = this.props.socket;
        this.team = 'black';
        this.isMyTurn = true;
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
            <div id ="gameArea">
                <StoneManager placeStone = {this.clickTarget}/>   
                <Chatting />
            </div>
        )
    }
}

export default GameRoom;
import Chatting  from './Chatting'
import Stone from './Stone';
import './StoneManager.css';
const React = require('react');

class GameRoom extends React.Component{ //각 개인이 접속되어 보이는 창
    constructor(props){     //소켓처리 -> 팀 할당받아야함
        super(props);
        this.socket = this.props.socket;
        this.isMyTurn = 0;//0은 시작안함, 1은 자기턴, 2는 대기중

        this.ReadySocket();
        this.socket.emit('RequestGameSetting','');

        let board = [];
        for(let i=0;i<20;++i){
            for(let j=0;j<20;++j){
                board.push(0);
            }
        }
    
        this.state = {team:'blank', board:board};
    }

    ReadySocket = ()=>{
        this.socket.on('GameInitialization',(recv)=>{
            console.log(recv);
            this.isMyTurn = recv.isYourTurn ? 1 : 2;
            this.setState({team:recv.color});
        });

        this.socket.on('PlaceResult',(recv)=>{
            console.log(recv);
            if(recv.Result === 'WrongPos'){
                alert('잘못된 위치입니다.');
                this.isMyTurn = 1;
            }else if(recv.Result === 'YourTurn'){
                this.isMyTurn = 1;
            }
        })

        this.socket.on('PlayResult', (recv)=>{
            if(recv.result === 'Victory'){
                alert('승리하였습니다');
                this.socket.emit('CheckResult','');
            }else if(recv.result === 'Defeat'){
                alert('패배하였습니다');
                this.socket.emit('CheckResult','');
            }
        });

        this.socket.on('PlaceStone',(recv)=>{
            let board = this.state.board;
            board[recv.xPos + 20 * recv.yPos] = recv.team;
            console.log(recv.team);
            this.setState({board:board});
        })
    }

    ClickStone = (x, y)=>{
        if(this.isMyTurn !== 1){
            alert('당신의 턴이 아닙니다');
            return;
        }

        this.isMyTurn = 2;  //이 함수가 호출 되었다는 것은 돌이 놓으려는 시도를 했다는 것. 잠금

        this.socket.emit('StonePlace',{xPos:x, yPos:y});    //서버에 돌 놓기/ 상대에게 돌전달/ 승리 체크 요청함.
    }


    render(){
        let boardRenderList = [];
        for(let i=0;i<20;++i){
            let rowStones =[];
            for(let j=0;j<20;++j){
                let type = 'blank';
                if(this.state.board[j + i*20] === 1){
                    type = 'black';
                }else if(this.state.board[j + i*20] === 2){
                    type = 'white';
                }

                rowStones.push(
                    <td id = 'stones' key ={j+(i*20)}><Stone xPos = {j} yPos = {i} color = {type} click ={this.ClickStone}/></td>
                );
            }

            boardRenderList.push(
                <tr key ={i+400}>
                    {rowStones}
                </tr>
            )
        }
 
        return(
            <div id ="gameArea">
                <table id = 'omokBoard' cellSpacing="0" cellPadding="0">
                    <tbody>
                        {boardRenderList}
                    </tbody>
                </table>
                <Chatting />
            </div>
        )
    }
}

export default GameRoom;
import React from "react";
import ReactModal from 'react-modal';
import './WaitingRoom.css';

class WaittingRoom extends React.Component{
    constructor(props){
        super(props);
        this.state={channelList:[], messageList:[], modalState:false};
        this.socket = this.props.socket;
        this.msgInput = React.createRef();
        this.roomName = React.createRef();
    }
    
    componentDidMount() { 
        this._ismounted = true;
        this.readySocket();
        this.ReloadChannelList();
    }

    componentWillUnmount(){
        this._ismounted = false;
        this.cleanUpSocket();
    }

    readySocket = ()=>{
        this.socket.on('ChannelList',(recv)=>{
            if(!this._ismounted){
                return;
            }

            this.setState({channelList:recv.GameRoomList});
        });

        this.socket.on('WaitingChattingResponse',(recv)=>{
            if(!this._ismounted){
                return;
            }

            this.setState({messageList: this.state.messageList.concat({nickname:recv.nickname, message:recv.message})}); 
        })

        this.socket.on('Result',(recv)=>{
            if(recv.type === 'Entry'){
                if(recv.result === 'FULL'){
                    alert('꽉 차있습니다.')
                }else if(recv.result === 'Invalid'){
                    alert('존재하지 않는 방입니다.');
                }
            }
        })
    };

    cleanUpSocket = ()=>{
        this.socket.off('ChannelList',()=>{});
        this.socket.off('WaitingChattingResponse',()=>{});
    }

    EnterRoom = (roomid) =>{
        this.socket.emit('RequestEnterRoom',{roomid:roomid});
    }

    ReloadChannelList = ()=>{
        this.socket.emit('RequestRoomList','');
    }

    CreateRoomButton = ()=>{
       this.setState({modalState:true});
    }

    CreateRoomRequest = ()=>{
        if(this.roomName.current.value.length === 0){
            alert('방의 제목을 입력해야합니다');
            return;
        }
        this.socket.emit('RequestRoomCreate',{title:this.roomName.current.value});
        this.roomName.current.value= '';
    }

    CloseModal = ()=>{
        this.roomName.current.value= '';
        this.setState({modalState:false});
    }

    sendMessage = (message)=>{//아이디 추가
        this.socket.emit('WaitingChatting',{message:message});
        this.msgInput.current.value ='';
    }

    render(){
        let listArray = this.state.channelList;
        let renderList = [];
        for(let i=0 ; i<listArray.length ; ++i){
            renderList.push(
                <tr className="room btn" onClick={()=>this.EnterRoom(listArray[i].roomid)} key={i+10}>{/*<!-- 채널 방 (기본 클래스명은 'room btn'(2개), 추가 클래스는 'no1','no2','no3'...)  -->*/}
                    <td id="num">{listArray[i].roomNumber}</td>
                    <td id="roomName">{listArray[i].roomName}</td>
                    <td id="member"><span>{listArray[i].member.length}</span>/2</td>
                    <td id="state"><span className= {listArray[i].state === 'Playing' ? 'playing': ''}>{listArray[i].state === 'Playing' ? '진행': '대기 '}</span></td>
                </tr>
            )
        }
        
        let messageList = this.state.messageList;
        let messageRenderList = []; 
        for(let i=0;i<messageList.length;++i){
            messageRenderList.push(
                <li key={i}>{/*<!-- 채팅 메세지 -->*/}
                    <span id="nickname">{messageList[i].nickname}:</span>
                    <p id="message">{messageList[i].message}</p>
                </li>
            )
        }

        return(
            <div id="omokbody">
                <ReactModal id = 'modalbody'
                    isOpen={this.state.modalState}
                    contentLabel="Minimal Modal Example"
                    ariaHideApp={false}
                >
                    <label>방제목</label><input type="text" ref={this.roomName}/><br/>
                    <button id="roomMake" onClick={()=>{this.CreateRoomRequest()}}>만들기</button>
                    <button id="roomCancel" onClick={()=>{this.CloseModal()}}>취소</button>
                </ReactModal>

                <div id = 'channelList'>{/*<!-- 채널 목록  -->*/}
                    <table>
                        <thead className="listHead">{/*<!-- 목록 별 제목  -->*/}
                            <tr>
                                <th scope="cols">방번호</th>
                                <th scope="cols">방제목</th>
                                <th scope="cols">인원</th>
                                <th scope="cols">상태</th>
                            </tr>
                        </thead>
                        <tbody className="listRoom">
                        {renderList}
                        </tbody>
                    </table>
                </div>

                <div id = 'ChatList'>{/*<!-- 채팅 목록  -->*/}
                    <ul>
                        {messageRenderList}
                    </ul>
                    <input type='text' placeholder='chatting' ref={this.msgInput}></input>{/*<!-- 채팅 입력 칸 -->*/}
                    <button onClick={()=>{this.sendMessage(this.msgInput.current.value)}} id="sendMessage">전송</button>{/*<!-- 채팅 전송 버튼 -->*/}
                </div>
                <div id="listBtn">
                    <button onClick={()=>this.CreateRoomButton()} id="create">방생성</button>
                    <button onClick={()=>this.ReloadChannelList()} id="reload">새로고침</button>
                </div>
            </div>
        )
    }
}

export default WaittingRoom;
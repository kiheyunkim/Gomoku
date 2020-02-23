import React from "react";

class WaittingRoom extends React.Component{
    constructor(props){
        super(props);
        this.state={channelList:[], messageList:[]};
        this.socket = this.props.socket;
        this.msgInput = React.createRef();
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

            this.setState({channelList:recv.WaitingRoomList});
        });

        this.socket.on('WaitingMessage',(recv)=>{
            if(!this._ismounted){
                return;
            }

            this.setState({messageList:recv});
        });

        this.socket.on('WaitingChattingResponse',(recv)=>{
            if(!this._ismounted){
                return;
            }

            //채팅 내용 추가.
            console.log(recv);
        })

        this.socket.on('Result',(recv)=>{
            if(recv.type === 'Entry'){
                if(recv.result === 'FULL'){
                    alert('꽉 차있습니다.')
                }
            }
        })
    };

    cleanUpSocket = ()=>{
        this.socket.off('ChannelList',()=>{});
        this.socket.off('WaitingMessage',()=>{});
        this.socket.off('WaitingChattingResponse',()=>{});
    }

    EnterRoom = (roomId) =>{
        this.socket.emit('RequestEnterRoom',{roomId:roomId});
    }

    ReloadChannelList = ()=>{
        this.socket.emit('RequestRoomList','');
    }

    CreateRoom = ()=>{
        this.socket.emit('RequestRoomCreate',{title:'NewRoomName'});
    }

    sendMessage = (message)=>{//아이디 추가
        this.socket.emit('WaitingChatting',message);
        this.msgInput.current.value ='';
    }

    render(){
        let listArray = this.state.channelList;
        let renderList = [];
        for(let i=0 ; i<listArray.length ; ++i){
            renderList.push(<li onClick={()=>this.EnterRoom(i)} key={i+10}>번호: {listArray[i].roomid} 
                방제목: {listArray[i].roomName} 인원: {listArray[i].member.length}/2 현재 상태: {listArray[i].state} </li>)
        }
        
        let messageList = this.state.messageList;
        let messageRenderList = [];
        for(let i=0;i<messageList.length;++i){
            messageRenderList.push(<li key={i}>{messageList[i].name}: {messageList[i].message}</li>)
        }

        return(
            <div>
                <div id = 'channelList'>
                    채널목록
                    <ul>
                        {renderList}
                    </ul>
                </div>
                <div id = 'ChatList'>
                    채팅 목록
                    <ul>
                        {messageList}
                    </ul>
                    <input type='text' placeholder='chatting' ref={this.msgInput}></input>
                    <button onClick={()=>{this.sendMessage(this.msgInput.current.value)}}>전송</button>
                </div>
                <div>
                    <button onClick={()=>this.CreateRoom()}>방생성</button>
                    <button onClick={()=>this.ReloadChannelList()}>새로고침</button>
                </div>

            </div>
        )
    }
}

export default WaittingRoom;
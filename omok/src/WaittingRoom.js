import React from "react";

class WaittingRoom extends React.Component{
    constructor(props){
        super(props);
        this.state={channelList:[], messageList:[]};
        this.socket = this.props.socket;
        

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
    };

    cleanUpSocket = ()=>{
        this.socket.off('ChannelList',()=>{});
        this.socket.off('WaitingMessage',()=>{});
    }

    componentDidMount() { 
        this._ismounted = true;
        this.readySocket();
        this.socket.emit('RequestRoomList','');
    }

    componentWillUnmount(){
        this._ismounted = false;
        this.cleanUpSocket();
    }

    clickRoom = (roomId) =>{
        this.socket.emit('RequestEnterRoom',{roomId:roomId});
    }

    render(){
        let listArray = this.state.channelList;
        let renderList = [];
        for(let i=0 ; i<listArray.length ; ++i){
            renderList.push(<li onClick={()=>{this.clickRoom(i)}} key={i+10}>번호: {listArray[i].roomid} 
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
                </div>
            </div>

        )
    }
}

export default WaittingRoom;



        //this.socket;
/*
        this.socket.on('ChannelList',(recv)=>{
            this.socket.emit('RequestRoomList','');
            if(!this._ismounted) return;
            this.setState({channelList:recv.WaitingRoomList});
            this.waitingRoomId = recv.waitingRoomId;
            
            this.socket.to(this.waitingRoomId).on('Result',(recv)=>{
                if(!this._ismounted) return;
                if(recv.type === 'Entry'){
                    if(recv.result === 'OK'){    //집입 성공
                        alert(recv.socketRoomId+'로 진입');
                        this.props.navTo('/Room');
                    }else if(recv.result === 'FULL'){
                        alert('인원이 꽉 찼습니다');
                    }
                }
            })
        });

        //this.socket.to(this.waitingRoomId).emit('RequestRoomList');
    }
        this.socket.on('Result',(recv)=>{
            if(!this._ismounted) return;
            if(recv.type === 'Entry'){
                if(recv.result === 'OK'){    //집입 성공
                    alert(recv.socketRoomId+'로 진입');
                    this.props.navTo('/Room');
                }else if(recv.result === 'FULL'){
                    alert('인원이 꽉 찼습니다');
                }
            }
        })
        */
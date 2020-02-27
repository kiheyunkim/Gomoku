import React from "react";

class Room extends React.Component{
    constructor(props){
        super(props);
        this.socket = props.socket;
        this.state={members:[],adminState:false};
        this.readySocket();
    }

    componentDidMount() { 
        this._ismounted = true;
    }

    componentWillUnmount(){
        this._ismounted = false;
    }

    readySocket = () =>{
        this.socket.on('RequestedRoomMember',(recv)=>{
            if(!this._ismounted)
                return;
            this.setState({members:recv.members,adminState:recv.isAmIAdmin});
        });

        this.socket.on('ReloadRoomMember',(recv)=>{
            if(!this._ismounted)
                return;
            
            this.socket.emit('RequestRoomMember','');
        });

        this.socket.on('StartFail',()=>{
            alert('모두 준비 되지 않았습니다');
        })

        this.socket.on('NotFull',()=>{
            alert('인원이 부족합니다.');
        })

        this.socket.emit('RequestRoomMember','');
    }
    
    LeaveToWaitingRoom = () =>{
        this.socket.emit('RequestLeaveRoom','');
    }
   
    NotifyReady = ()=>{
        this.socket.emit('ReadyStateChangeRequest','');
    } 

    render(){
        let renderMemberList=[];
        let memberArray = this.state.members;
        for(let i=0;i<memberArray.length;++i){
            renderMemberList.push(<li key = {i}>NickName : {memberArray[i].nickname} / 레디상태 : {memberArray[i].readyState?'레디상태':'안함'} </li>)
        }

        let readyButton = [];
        if(this.state.adminState){
            readyButton.push(<button key={1} onClick={()=>this.NotifyReady()} >Start</button>);
        }else{
            readyButton.push(<button key={1} onClick={()=>this.NotifyReady()} >Ready</button>);
        }

        console.log(this.state.adminState);
        return(

            <div>
                <h1>당신의 상태: {}</h1>
                <ul>
                    {renderMemberList}
                </ul>
                <button onClick={()=>this.LeaveToWaitingRoom()}>방에서 나가기</button>
                {readyButton}
            </div>
        )
    }
}

export default Room;
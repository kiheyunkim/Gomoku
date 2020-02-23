import React from "react";

class Room extends React.Component{
    constructor(props){
        super(props);
        this.socket = props.socket;
    }

    LeaveToWaitingRoom = () =>{
        this.socket.emit('RequestLeaveRoom','');
    }

    ReadyToStartGame = ()=>{
        this.socket.emit();
    }


    render(){
        let renderMemberList=[];

        return(
            <div>
                
                <ul>
                    {renderMemberList}
                </ul>
                <button>방에서 나가기</button>
            </div>
        )
    }
}

export default Room;
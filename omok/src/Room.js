import React from "react";
import './Room.css'

class Room extends React.Component {
    constructor(props) {
        super(props);
        this.socket = props.socket;
        this.state = {members: [], adminState: false, readyBttnState: false, roomName: '', roomNumber: 0};
        this.readySocket();
    }

    componentDidMount() {
        this._ismounted = true;
    }

    componentWillUnmount() {
        this._ismounted = false;
    }

    readySocket = () => {
        this.socket.on('RequestedRoomMember', (recv) => {
            if (!this._ismounted)
                return;
            console.log(recv.members);
            this.setState({members: recv.members, adminState: recv.isAmIAdmin});
        });

        this.socket.on('ReloadRoomMember', (recv) => {
            if (!this._ismounted)
                return;

            this.socket.emit('RequestRoomMember', '');
        });

        this.socket.on('RoomInfo', (recv) => {
            this.setState({roomName: recv.roomTitle, roomNumber: recv.roomNumber});
        })

        this.socket.on('StartFail', () => {
            alert('모두 준비 되지 않았습니다');
        })

        this.socket.on('NotFull', () => {
            alert('인원이 부족합니다.');
        })

        this.socket.emit('RequestRoomMember', '');
        this.socket.emit('RequestRoomInfo', '');
    }

    leaveToWaitingRoom = () => {
        this.socket.emit('RequestLeaveRoom', '');
    }

    notifyReady = () => {
        this.socket.emit('ReadyStateChangeRequest', '');
        this.setState({readyBttnState: (!this.state.readyBttnState)});
    }

    render() {
        let renderMemberList = [];
        let memberArray = this.state.members;
        for (let i = 0; i < memberArray.length; ++i) {
            renderMemberList.push(
                <li key={i}>
                    <div className={i === 0 ? "left" : "right"}>
                        <div>
                            <span id="nickname">{memberArray[i].nickname}</span>
                            <p><span id="gameCnt">{memberArray[i].winCount + memberArray[i].loseCount}</span>전 <span
                                id="winCnt">{memberArray[i].winCount}</span>승 <span
                                id="loseCnt">{memberArray[i].loseCount}</span>패</p>
                            <b className={memberArray[i].readyState ? "waiting" : "preparing"}>{memberArray[i].readyState ? ' 준비완료' : '준비중'}</b>
                        </div>
                    </div>
                </li>
            );
        }

        let readyButton = [];
        if (this.state.adminState) {
            readyButton.push(<button key={1} id="roomBtm" onClick={() => this.NotifyReady()}>시작</button>);
        } else {
            readyButton.push(<button key={1} id="roomBtm" className={this.state.readyBttnState ? "ready" : ""}
                                     onClick={() => this.notifyReady()}>준비</button>);
        }

        return (
            <div id="roombody">
                <header id="roomTop">
                    <span>NO. {this.state.roomNumber}</span>
                    <h2 id="roomName">{this.state.roomName}</h2>
                </header>

                <ul id="roomMid">
                    {renderMemberList}
                </ul>

                <button onClick={() => this.leaveToWaitingRoom()} className="exit">나가기</button>
                {readyButton}
            </div>
        )
    }
}

export default Room;
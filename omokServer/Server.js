const express = require('express');
const app = express();
const Sha256 = require('sha256');

app.use(require('cors')({origin:'http://127.0.0.1:3000',credentials:true}));

const server = app.listen(4000, ()=>console.log('Omok Server Open  ---> 4000'));
const IO = require('socket.io').listen(server);
const waitingRoomId = Sha256((Math.random() * 10000).toString());

let WaitingRoomList = []
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
WaitingRoomList.push({roomid:WaitingRoomList.length, roomName:'방제목입니다 방제목', member:[], state:'NORMAL'});
//대기실은 SHA 256으로 랜덤 생성

IO.on('connection',(socket)=>{
    //접속후 해줄 것
    //socket.id = //id 할당
    //socket.state = 'Waiting';   //접속 브라우저의 상태

    //대기실 번호 요청
    socket.on('RequestWaitingRoom',()=>{
        socket.roomId = waitingRoomId;
        socket.join(socket.roomId);
        IO.sockets.in(socket.roomId).emit('Result',{roomId : socket.roomId});   //같은 roomID에 대해서만 보내는 방법
    });

    //대기실
    socket.on('RequestRoomList',()=>{   //방 목록 요청
        socket.emit('ChannelList',{WaitingRoomList:WaitingRoomList});
    });

    socket.on('chatting',(recv)=>{//대기실에서 채팅 처리
        console.log(recv);
    });


    socket.on('RequestRoomCreate',()=>{ //방 생성 요청 밑 진입
        //소켓 통신용아이디 / 접속 목록 / 방 상태
        WaitingRoomList.push({roomid:WaitingRoomList.length, member:[], state:'NORMAL'})

        socket.emit('Result',{type:'createSuccess',result:'OK'});
    });

    socket.on('RequestEnterRoom',(recv)=>{  //방 진입 요청
        let room = WaitingRoomList.find((element)=>recv.roomId === element.roomid);
        if(room === undefined){
            socket.disconnect();                                //방이 없음 -> 잘못된 접근
        }else if(room.member.length < 2){
            socket.emit('Result',{type:'Entry', result:'OK', socketRoomId:'1'});   //비어있어서 접근.
        }else{
            socket.emit('Result',{type:'Entry', result:'FULL'});   //꽉 차있음.
        }
    });



    socket.on('EnterNotify',(recv)=>{//접속요청
        socket.emit('Result',{type:'Entry',result: 'welcome'});
    });

    socket.on('roomchating',(recv)=>{//방안에서 채팅 처리

    });

    socket.on('RequestLeaveRoom',(recv)=>{  //방 떠나는 것을 요청
        let room = WaitingRoomList.find((element)=>recv.roomid === element.roomid);

        if(room.member.length === 1){   //현재 접속자가 마지막 이면 방 삭제
            //퇴출처리
            WaitingRoomList = WaitingRoomList.filter((element)=>element !== socket.roomid);
        }else if(room.member.lenth === 2){  //접속자가 꽉차있으면 그냥 떠나기만 함

        }
    })

})
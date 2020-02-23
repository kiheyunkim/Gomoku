const express = require('express');
const app = express();
const Sha256 = require('sha256');

app.use(require('cors')({origin:'http://127.0.0.1:3000',credentials:true}));

const server = app.listen(4000, ()=>console.log('Omok Server Open  ---> 4000'));
const IO = require('socket.io').listen(server);
const waitingRoomId = Sha256((Math.random() * 10000).toString());

let waitingRoomList = []
waitingRoomList.push({roomid:waitingRoomList.length, roomName:'방제목입니다1', member:[], state:'NORMAL'});
waitingRoomList.push({roomid:waitingRoomList.length, roomName:'방제목입니다2', member:[], state:'NORMAL'});
waitingRoomList.push({roomid:waitingRoomList.length, roomName:'방제목입니다3', member:[], state:'NORMAL'});
waitingRoomList.push({roomid:waitingRoomList.length, roomName:'방제목입니다4', member:[], state:'NORMAL'});
waitingRoomList.push({roomid:waitingRoomList.length, roomName:'방제목입니다5', member:[], state:'NORMAL'});
waitingRoomList.push({roomid:waitingRoomList.length, roomName:'방제목입니다6', member:[], state:'NORMAL'});

//대기실은 SHA 256으로 랜덤 생성
IO.on('connection',(socket)=>{
    socket.screenState = 'Waiting';                           //이 상태는 소켓의 접속위반 여부를 확인한다. 
    socket.nickname = Sha256((Math.random() * 10000).toString()) ;                              //소켓 구분용 고유값
    socket.roomid = undefined;                                //현재 소켓이 속해있는 roomid

    socket.on('disconnect',(reason)=>{              //소켓 접속상태에 변경을 가한 대상들은 모두 종료시킴    //처리자체는 어느 페이지에서도 해야함. 
        if(socket.screenState ==='WaitingRoom'){  //게임중이거나 게임방 대기실에 있을 때만 처리해주면 됨.
            //게임 대기실에 있는 경우에는 상대에게 반대편이 나갔음을 통보하고 채널목록을 갱신시켜준다.
            let room = waitingRoomList.find(element=> element.roomid === socket.roomid);
            if(room === undefined){
                console.error('Invalid Socket Request ' + socket.nickname);
            }
            
            if(room.member.length === 2){//2명의 경우에는 한명을 내보내고 다른 한명에게 나감을 통보
                room = room.member.filter(element => element === socket.nickname);
                //상태에게 나머지가 나갔음을 통보한다.
            }else if(room.member.length === 1){//한명뿐인 방은 그가 나가면 방이 없어져야함.
                waitingRoomList = waitingRoomList.filter(element => element.roomid !== socket.roomid);
            }
        }else if(socket.screenState === 'Game'){//게임중인경우에는
            let room = waitingRoomList.find(element=> element.roomid === socket.roomid);           
            //상대에게 나갔음을 표시해주고 승리 하나를 올려주고 상대의 화면 상태를 변경, 방의 상태또한 변경시켜준다.
        }
 
        socket.disconnect();
    })

    //로그인 전 첫 접속 대기실 번호 요청 -->
    socket.on('RequestWaitingRoom',()=>{
        socket.roomId = waitingRoomId;  //현재 속해있는 방의 아이디 -> 대기실 아이디 할당
        socket.join(socket.roomId);     //socket io 상으로 대기실에 넣어준다.
        socket.emit('ScreenChange',{ScreenType :'Waiting'});    //처음 화면을 어디로 옮겨줄지?
    });

    /*
    로그인 과정을 넣어줘야함.
    */

    //대기실
    socket.on('RequestRoomList',()=>{   //방 목록 요청
        socket.emit('ChannelList',{WaitingRoomList:waitingRoomList});
    });
    
    socket.on('WaitingChatting',(recv)=>{//대기실에서 채팅 처리
        let newMessage = recv.message.replace(/</g,'&lt;').replace(/>/g,'&gt;');
        IO.sockets.to(socket.roomId).emit('WaitingChattingResponse',{nickname:socket.nickname, message:newMessage});
    });

    socket.on('RequestRoomCreate',(request)=>{ //방 생성 요청 //클라이언트가 요청한 제목으로 개설해줌
        let newTitle = request.title.replace(/</g,'&lt;').replace(/>/g,'&gt;'); //XSS방지

        let newRoom = {roomid:Sha256((new Date().toString())), roomName:newTitle, member:[], state:'NORMAL'};
        newRoom.member.push(socket.nickname);
        waitingRoomList.push(newRoom);

        socket.emit('ScreenChange',{ScreenType :'WaitingRoom'});    //만든방으로 이동시켜줌
    });

    socket.on('RequestEnterRoom',(recv)=>{  //방 진입 요청
        let room = waitingRoomList.find((element)=>recv.roomId === element.roomid);
        if(room === undefined){
            socket.disconnect();                                //방이 없음 -> 잘못된 접근
        }else if(room.member.length < 2){
            //방에 멤버 삽입
            room.member.push(socket.nickname);
            //기존방을 떠나고 새로운 방으로 진입
            socket.leave(socket.roomid);
            socket.join(recv.roomId);
            //새로운 방을 할당하고 화면전환 요청
            socket.roomid = recv.roomId;
            socket.emit('ScreenChange',{ScreenType :'WaitingRoom'});    //만든방으로 이동시켜줌
            socket.screenState = 'WaitingRoom';
        }else{
            socket.emit('Result',{type:'Entry', result:'FULL'});   //꽉 차있음.
        }
    });

    //게임 대기실
    socket.on('roomchating',(recv)=>{//방안에서 채팅 처리

    });

    socket.on('RequestLeaveRoom',()=>{  //방 떠나는 것을 요청
        //게임 대기실에 있는 경우에는 상대에게 반대편이 나갔음을 통보하고 채널목록을 갱신시켜준다.
        let room = waitingRoomList.find(element=> element.roomid === socket.roomid);

        if(room === undefined){
            console.error('Invalid Socket Request ' + socket.nickname);
        }
        
        if(room.member.length === 2){//2명의 경우에는 한명을 내보내고 다른 한명에게 나감을 통보함 -> 참여자 고치기
            room = room.member.filter(element => element === socket.nickname);
            //상태에게 나머지가 나갔음을 통보한다.
        }else if(room.member.length === 1){//한명뿐인 방은 그가 나가면 방이 없어져야함.
            waitingRoomList = waitingRoomList.filter(element => element.roomid !== socket.roomid);
            return;
        }
    })

    //채팅

    //레디

    //시작
})


        //IO.sockets.in(socket.roomId).emit('Result',{roomId : socket.roomId});   //같은 roomID에 대해서만 보내는 방법
        //IO.sockets.in(socket.roomId).emit('ScreenChange',{ScreenType :'Waiting'});    //처음 화면을 어디로 옮겨줄지?
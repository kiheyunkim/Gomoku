const express = require('express');
const fs = require('fs');
const app = express();
const Sha256 = require('sha256');
const mysql = require('./mysql');

app.use(express.static(__dirname + "/public"));
const server = app.listen(3000, ()=>console.log('Omok Server Open  ---> 3000'));

const IO = require('socket.io')(server);
const waitingRoomId = Sha256((Math.random() * 10000).toString());

let GameRoomList = []
let roomNumberCount = 1;

mysql.initPreventOverlapLogin();

//대기실은 SHA 256으로 랜덤 생성
IO.on('connection',(socket)=>{
    socket.screenState = 'Login';                                     //이 상태는 소켓의 접속위반 여부를 확인한다. 
    socket.roomid = undefined;                                        //현재 소켓이 속해있는 roomid

    socket.on('disconnect',async (reason)=>{                          //소켓 접속상태에 변경을 가한 대상들은 모두 종료시킴    //처리자체는 어느 페이지에서도 해야함. 
        if(socket.screenState ==='WaitingRoom'){                      //게임중이거나 게임방 대기실에 있을 때만 처리해주면 됨.
            //게임 대기실에 있는 경우에는 상대에게 반대편이 나갔음을 통보하고 채널목록을 갱신시켜준다.
            let room = GameRoomList.find(element=> element.roomid === socket.roomid);
            if(room === undefined){
                console.error('Invalid Socket Request ' + socket.nickname);
                return;
            }
            if(room.member.length === 2){//2명의 경우에는 한명을 내보내 고 다른 한명에게 나감을 통보
                //나간 사람은 목록에서 제외
                room.member = room.member.filter(element => element.nickname !== socket.nickname);  //소켓이 가진 것과 다른 멤버만 남김
                //만약 나간사람이 방장이 아니었다가 방장이 되면 레디상태를 해제해줌
                room.member.find(element => element.nickname !== socket.nickname).readyState = false;
                //통보 해줌 
                socket.broadcast.to(socket.roomid).emit('ReloadRoomMember','');
            }else if(room.member.length === 1){//한명뿐인 방은 그가 나가면 방이 없어져야함.
                GameRoomList = GameRoomList.filter(element => element.roomid !== socket.roomid);
            }
        }else if(socket.screenState === 'Game'){//게임중인경우에는
            //나간 대상은 없앤다
            let room = GameRoomList.find(element=> element.roomid === socket.roomid);
            room.state = 'NORMAL';
            
            let loser = room.member.find(element=>element.nickname === socket.nickname) //나간 존재는 패배 기록
            loser.loseCount++;
            let loseWrite = mysql.renewStatic(loser.nickname, loser.winCount, loser.loseCount);//패배 기록
            await loseWrite;

            let winner = room.member.find(element=>element.nickname !== socket.nickname) //안나간 존재는 승리 기록
            winner.winCount++;
            let winnerWrite = mysql.renewStatic(winner.nickname, winner.winCount, winner.loseCount);//승리 기록
            await winnerWrite;

            room.member = room.member.filter(element=>element.nickname !== socket.nickname);    //나간 멤버 제외

            //남은 대상들(나간 대상은 이미 방을 떠났다)의 상태를 대기실로 옮겨줌
            let sockets = IO.in(socket.roomid).sockets; //안나간자는 승리기록을 바꿔줌(소켓)
            for(let key in sockets) {
                if(sockets[key] !== socket){
                    sockets[key].winCount++;      //소켓에도 기록
                }
                sockets[key].screenState = 'WaitingRoom';
            }

            //나머지에게 승리를 통보
            IO.to(socket.id).emit('PlayResult',{result:'Victory'});//승리 통보

            //레디상태 초기화
            let members = room.member;
            for(let i=0;i<members.length;++i){
                members[i].readyState = false;
            }

            if(room.member.length === 0){//한명뿐인 방은 그가 나가면 방이 없어져야함.
                GameRoomList = GameRoomList.filter(element => element.roomid !== socket.roomid);
            }
        }
        
        if(socket.nickname!==undefined){ //닉네임이 있다는 것은 로그인 했다는 것
            let disconnectLogout = mysql.enRollLogOut(socket.nickname);
            await disconnectLogout;
        }
        socket.disconnect();
    });

    socket.on('LoginScreenRequest',(recv)=>{           
        socket.emit('ScreenChange',{ScreenType :'Login'});    //처음 화면 지정
    });

    socket.on('LoginRequest',async (recv)=>{
        //로그인 요청
        let id = recv.loginId;
        let pw = recv.loginPasswd;

        //길이 초과하면 오버플로남
        if(id.length >= 15 || pw.length >= 15){
            IO.to(socket.id).emit('Result',{ResultType :'LoginFail'});    //실패 통보
            return;
        }

        //DB에 확인
        let isSuccess = false;
        //###### DB 처리 #############
        let logincheck = mysql.checkLogin(id, Sha256(pw));

        await logincheck.then((value)=>{
            if(value.length === 0){                     //결과 없음
                isSuccess = false;
            }else{
                isSuccess = true;
                socket.nickname = value[0].nickname;    //로그인에 따른 닉네임 등록
            }
        },(reason)=>{
            isSuccess = false;
        });
        //#############################

        if(isSuccess){
            let getStatic = mysql.getStatic(socket.nickname);
            await getStatic.then((value)=>{
                socket.winCount = value[0].win;
                socket.loseCount = value[0].lose;
            },(reason)=>{
                isSuccess = false;
            });
        }

        let alreadyLogin = false;
        if(isSuccess){
            let preventOverlapLogin = mysql.loginCheck(socket.nickname);
            await preventOverlapLogin.then(async (value)=>{
                if(value[0]['count(*)'] === 1){    //이미 있는 경우
                    alreadyLogin=true;
                }else{
                    alreadyLogin=false;
                }
            },(reason)=>{
                isSuccess = false;
            });
        }

        if(alreadyLogin){
            IO.to(socket.id).emit('Result',{ResultType :'AlreadyLogin'});
            return;
        }

        if(isSuccess){
            let registLogin =  mysql.enRollLogin(socket.nickname);   //로그인 등록
            await registLogin.then((value)=>{
            },(reason)=>{
                isSuccess = false;
            });
        }

        if(isSuccess){
            socket.screenState = 'Waiting';                                   //소켓 상태 변경
            IO.to(socket.id).emit('ScreenChange',{ScreenType :'Waiting'});    //처음 화면 지정
            socket.roomid = waitingRoomId;          //현재 속해있는 방의 아이디 -> 대기실 아이디 할당
            socket.join(socket.roomid);             //socket io 상으로 대기실에 넣어준다.
        }else{
            IO.to(socket.id).emit('Result',{ResultType :'LoginFail'});    //실패 통보
        }
    });

    socket.on('SignupRequest', async (recv)=>{
        let id = recv.loginId;
        let passwd1 = recv.loginPasswd;
        let passwd2 = recv.loginPasswd2;
        let nickname = recv.nickName;
        
        //PW 불일치
        if(passwd1 !== passwd2){
            IO.to(socket.id).emit('Result',{ResultType:'PwNotSame'});
            return;
        }

        //길이 초과하면 오버플로남
        if(id.length >= 10){
            IO.to(socket.id).emit('Result',{ResultType :'IdLengthEexceeded'});    //실패 통보
            return;
        }
        if(nickname.length >= 10){
            IO.to(socket.id).emit('Result',{ResultType :'NickLengthEexceeded'});    //실패 통보
            return;
        }

        if(nickname.match(/<|>/g) !== null){ 
            IO.to(socket.id).emit('Result',{ResultType :'NickNameInvalid'});    //실패 통보
            return;
        }
        
        let idCheck = mysql.checkId(id);
        let idCheckRes = false;
        await idCheck.then((value)=>{
            if(value[0]['count(*)'] === 1){                     //이미 있음 오류
                idCheckRes = false;
            }else{
                idCheckRes = true;
            }
        },(reason)=>{
            idCheckRes = false;                              //DB 오류
        });

        if(!idCheckRes){
            IO.to(socket.id).emit('Result',{ResultType:'IdAlreadyExist'});
            return;
        }
        
        let nicknameCheckRes = false;
        let nicknameCheck = mysql.checkNickName(nickname);
        await nicknameCheck.then((value)=>{
            if(value[0]['count(*)'] === 1){                     //이미 있음 오류
                nicknameCheckRes = false;
            }else{
                nicknameCheckRes = true;
            }
        },(reason)=>{
            nicknameCheckRes = false;                              //DB 오류
        });

        //닉네임 체크
        if(!nicknameCheckRes){
            IO.to(socket.id).emit('Result',{ResultType:'NickNameAlreadyExist'});
            return;
        }
        
        //모두 문제없는경우
        //DB에 등록
        let registAccount = mysql.signUpAccount(id, Sha256(passwd1), nickname);
        let registRes = false;
        await registAccount.then((value)=>{
            registRes = true;
        },(reason)=>{
            registRes = false;
        })

        //승률 기록용 DB에도 등록
        if(registRes){
            let SetStatic = mysql.setStatic(nickname);
            await SetStatic.then((value)=>{
                registRes = true;
            },(reason)=>{
                registRes = false;
            });
        }

        if(!registRes){
            IO.to(socket.id).emit('Result',{ResultType:'RegisterFail'});
            return
        }

        IO.to(socket.id).emit('Result',{ResultType:'RegisterOK'});
    })

    //###################대기실
    socket.on('RequestRoomList',()=>{   //방 목록 요청
        socket.emit('ChannelList',{GameRoomList:GameRoomList});
    });
    
    socket.on('WaitingChatting',(recv)=>{//대기실에서 채팅 처리
        let newMessage = recv.message.replace(/</g,'&lt;').replace(/>/g,'&gt;');//XSS방지
        IO.sockets.to(socket.roomid).emit('WaitingChattingResponse',{nickname:socket.nickname, message:newMessage});
    });

    socket.on('RequestRoomCreate',(request)=>{ //방 생성 요청 //클라이언트가 요청한 제목으로 개설해줌
        let newTitle = request.title.replace(/</g,'&lt;').replace(/>/g,'&gt;'); //XSS방지
        let newRoom = {roomid:Sha256((new Date().toString())), roomNumber:roomNumberCount, roomName:newTitle, member:[], state:'NORMAL'};
        roomNumberCount++;
        newRoom.member.push({nickname:socket.nickname, readyState:false, teamColor:'blank', winCount:socket.winCount, loseCount:socket.loseCount });//방 생성
        GameRoomList.push(newRoom);                                      //방 삽입
        socket.leave(socket.roomid);                                     //기존 방 탈출
        socket.roomid = newRoom.roomid;                                  //새로운 방 번호 할당
        socket.join(newRoom.roomid);                                     //새로운 방으로 진입
        socket.screenState = 'WaitingRoom';
        IO.to(socket.id).emit('ScreenChange',{ScreenType :'WaitingRoom'});         //화면상 만든방으로 이동시켜줌
    });
    
    socket.on('RequestEnterRoom',(recv)=>{
        let room = GameRoomList.find(element =>element.roomid === recv.roomid);//해당하는 방을 찾음
        if(room === undefined){
            socket.emit('Result',{type:'Entry', result:'Invalid'});        //방이 없음 -> 잘못된 접근
        }else if(room.member.length < 2){//빈자리는 있음
            //방에 멤버 삽입
            room.member.push({nickname:socket.nickname, readyState:false, teamColor:'blank', winCount:socket.winCount, loseCount:socket.loseCount});
            //기존방에 대한 처리와 새로운 방으로의 진입, 그리고 새로운 방번호 할당
            socket.leave(socket.roomid);
            socket.roomid = recv.roomid;
            socket.join(recv.roomid);
            //기존 방에 있는 사람들에게 방 목록 리로드 요청
            socket.broadcast.to(socket.roomid).emit('ReloadRoomMember','');
            //소켓의 상태 변경
            socket.screenState = 'WaitingRoom';
            //요청한 대상은 화면전환
            socket.emit('ScreenChange',{ScreenType :'WaitingRoom'});    //해당방으로 이동시켜줌
        }else{
            socket.emit('Result',{type:'Entry', result:'FULL'});   //꽉  차있음.
        }
    });

    //###################게임 대기실
    socket.on('RequestRoomInfo',()=>{
        let thisRoom = GameRoomList.find(element => element.roomid === socket.roomid)
        socket.emit('RoomInfo',{roomTitle:thisRoom.roomName, roomNumber:thisRoom.roomNumber});
    })
    socket.on('RequestRoomMember',()=>{
        let members = GameRoomList.find(element => element.roomid === socket.roomid).member;
        //요청한 자에게만 보냄.
        IO.to(socket.id).emit('RequestedRoomMember',{members:members, isAmIAdmin:(members[0].nickname === socket.nickname)});
    });

    socket.on('RequestLeaveRoom',()=>{  //방 떠나는 것을 요청
        //게임 대기실에 있는 경우에는 상대에게 반대편이 나갔음을 통보하고 채널목록을 갱신시켜준다.
        let room = GameRoomList.find(element=> element.roomid === socket.roomid);

        if(room === undefined){ //방을 못찾았을 때
            console.error('Invalid Socket Request ' + socket.nickname);
            return;
        }
        
        if(room.member.length === 2){//2명의 경우에는 한명을 내보내고 다른 한명에게 나감을 통보함 -> 참여자 고치기
            room.member = room.member.filter(element => element.nickname !== socket.nickname);  //나간 사람은 목록에서 제외
            //만약 나간사람이 방장이 아니었다가 방장이 되면 레디상태를 해제해줌
            room.member.find(element => element.nickname !== socket.nickname).readyState = false;
            //소켓이 해당힌 방에 나갔음을 통보해준다.
            socket.broadcast.to(socket.roomid).emit('ReloadRoomMember','');
        }else if(room.member.length === 1){//한명뿐인 방은 그가 나가면 방이 없어져야함.
            GameRoomList = GameRoomList.filter(element => element.roomid !== socket.roomid);
        }
        
        //화면 상태 기록
        socket.screenState = 'Waiting';
        //화면 전환 시켜줌
        socket.emit('ScreenChange',{ScreenType :'Waiting'});
        //기존의 
        socket.leave(socket.roomid);
        socket.roomid = waitingRoomId;
        socket.join(waitingRoomId);
    });

    //채팅
    socket.on('GameRoomChatting',(recv)=>{//방안에서 채팅 처리
        let newMessage = recv.message.replace(/</g,'&lt;').replace(/>/g,'&gt;');
        IO.to(socket.roomid).emit('roomMessage',{nickname:socket.nickname, message:newMessage});
    });

    socket.on('ReadyStateChangeRequest',()=>{
        //소켓에 해당하는 소켓 찾기
        let targetRoom = GameRoomList.find(element=>element.roomid === socket.roomid);
        let selfMember = targetRoom.member.find(element => element.nickname === socket.nickname);
        
        //방장인가 아닌가?
        if(targetRoom.member[0].nickname === socket.nickname){      //방장 인경우
            //상대가 레디상태인가 검사?
            
            if(targetRoom.member.length === 2){
                let otherMember = targetRoom.member.find(element => element.nickname !== socket.nickname);
                if(otherMember.readyState){                             //레디 상태이면 시작
                    //1. 팀할당 -> 색
                    selfMember.teamColor = 'black';
                    otherMember.teamColor = 'white';
                    //2. 턴할당 -> 
                    targetRoom.turn = 0;    //0번부터 시작할 수 있도록. 
    
                    //방에 있는 보드 초기화 
                    targetRoom.board = [];
                    for(let i=0;i<20;++i){
                        for(let j=0;j<20;++j){
                            targetRoom.board.push(0);
                        }
                    }
                    
                    //모든 소켓에 화면 상태를 할당
                    let sockets = IO.in(socket.roomid).sockets
                    for(let key in sockets) {
                        sockets[key].screenState = 'Game';
                    }
    
                    //시작하도록 클라들에게 전달
                    targetRoom.state = 'Playing';
                    IO.to(socket.roomid).emit('ScreenChange',{ScreenType :'Game'});
                    return;

                }else{//시작 불가 - 상대가 아직 레디 하지 않음
                    //레디 안했다는 메세지 전달
                    socket.emit('StartFail','');
                } 
            }else{//2명 미만은 시작할 수 없음
                socket.emit('NotFull','');
            }
        }else{                                                      //아닌 경우엔 방장 아닌 사람이 레디한것.
            //레디 상태만 바꿈
            selfMember.readyState = !selfMember.readyState;

            //방의 모두에게 갱신을 통보
            IO.to(socket.roomid).emit('ReloadRoomMember','');
        }
    });

    //게임 화면 -----------------------------
    socket.on('RequestGameSetting',(recv)=>{
        let targetRoom = GameRoomList.find(element=>element.roomid === socket.roomid);
        let selfMember = targetRoom.member.find(element=>element.nickname === socket.nickname);
        
        IO.to(socket.id).emit('GameInitialization',{color:selfMember.teamColor, isYourTurn: (targetRoom.member[targetRoom.turn].nickname === socket.nickname ? true : false)});
    });

    socket.on('GameRoomChatting',(recv)=>{

    });

    //돌 놓는거 확인
    socket.on('StonePlace',async (recv)=>{
        let targetRoom = GameRoomList.find(element=>element.roomid === socket.roomid);
        //놓는 그 위치에는 돌이 있는가?
        if(targetRoom.board[recv.xPos + recv.yPos * 20] !== 0){
            IO.to(socket.id).emit('PlaceResult',{Result:'WrongPos'});
            return;
        }
        //팀 파악
        let team = 0;
        if(targetRoom.member.find(element=>element.nickname===socket.nickname).teamColor === 'black'){
            team = 1;
        }else{
            team = 2;
        }
        //서버상에 돌을 놓음
        targetRoom.board[recv.xPos + recv.yPos * 20] = team;
        //돌 놓음을 통지
        IO.sockets.to(socket.roomid).emit('PlaceStone',{xPos:recv.xPos,yPos:recv.yPos, team:team});
        
        //승리 했는지 체크
        let isVictory = checkVictory(targetRoom.board, recv.xPos, recv.yPos);
        if(isVictory){//승리했다고 통보
            //방에 있는 모든 레디 상태를 초기화
            let targetRoom = GameRoomList.find(element=>element.roomid === socket.roomid);
            let members = targetRoom.member;
            for(let i=0;i<members.length;++i){
                members[i].readyState = false;
            }
            targetRoom.state = 'NORMAL';

            let loser = targetRoom.member.find(element=>element.nickname !== socket.nickname) //다른 존재는 패배 기록
            loser.loseCount++;
            let loseWrite = mysql.renewStatic(loser.nickname, loser.winCount, loser.loseCount);//패배 기록
            await loseWrite;

            let winner = targetRoom.member.find(element=>element.nickname === socket.nickname) //현재 놓은자는 승리 기록
            winner.winCount++;
            let winnerWrite = mysql.renewStatic(winner.nickname, winner.winCount, winner.loseCount);//승리 기록
            await winnerWrite;

            //남은 대상들(나간 대상은 이미 방을 떠났다)의 상태를 대기실로 옮겨줌
            let sockets = IO.in(socket.roomid).sockets; //안나간자는 승리기록을 바꿔줌(소켓)
            for(let key in sockets) {
                if(sockets[key] === socket){
                    sockets[key].winCount++;      //승리자 승리기록
                }else{
                    sockets[key].loseCount++;
                }
            }
            
            socket.emit('PlayResult',{result:'Victory'});//승리 통보
            console.log(socket.to(socket.roomid))
            socket.to(socket.roomid).emit('PlayResult',{result:'Defeat'});//패배통보
        }else{//다음 턴을 통보
            socket.emit('PlaceResult',{Result:'PlaceOK'});
            socket.broadcast.to(socket.roomid).emit('PlaceResult',{Result:'YourTurn'});
        }
    });

    socket.on('CheckResult',()=>{
        IO.to(socket.id).emit('ScreenChange',{ScreenType :'WaitingRoom'});
        socket.screenState = 'WaitingRoom';
    });
});

let checkVictory=(board,posX,posY)=>{       //로직 검사

    //세로 확인
    //북쪽 조사
    let stdColor = board[posX + posY * 20];  //이 색을 기준으로 조사해야함
    let x = posX, y = posY - 1;
    let count = 1;
    while(y >= 0){
        if(board[x + y*20] !== stdColor || board[x+y*20] === 0)//색이 다르거나 빈칸이면 더이상 전진 X
            break;
        count++;
        y--;
    }

    //남쪽 조사
    x = posX;
    y = posY + 1;
    while(y < 20){
        if(board[x + y*20] !== stdColor || board[x+y*20] === 0)//색이 다르거나 빈칸이면 더이상 전진 X
            break;
        count++
        y++;
    }

    if(count === 5){
        return true;
    }

    //   / 방향 확인
    //북동쪽 조사
    x = posX + 1;
    y = posY - 1;
    count = 1;
    while(y >= 0 && x < 20){
        if(board[x + y*20] !== stdColor || board[x+y*20] === 0)//색이 다르거나 빈칸이면 더이상 전진 X
            break;
        count++
        x++;
        y--;
    }
    
    //남서쪽 조사
    x = posX - 1;
    y = posY + 1;
    while(x >= 0 && y < 20){
        if(board[x + y*20] !== stdColor || board[x+y*20] === 0)//색이 다르거나 빈칸이면 더이상 전진 X
            break;
        count++
        y++;
        x--;
    }
    if(count === 5){
        return true;
    }

    //  \ 방향 조사
    //동남쪽 조사
    x = posX + 1;
    y = posY + 1;
    count = 1;
    while(x < 20 && y < 20){
        if(board[x + y*20] !== stdColor || board[x+y*20] === 0)//색이 다르거나 빈칸이면 더이상 전진 X
            break;
        count++
        x++;
        y++;
    }

    //북서쪽 조사
    x = posX - 1;
    y = posY - 1;
    while(x >= 0 && y >= 0){
        if(board[x + y*20] !== stdColor || board[x+y*20] === 0)//색이 다르거나 빈칸이면 더이상 전진 X
            break;
        count++
        x--;
        y--;
    }

    if(count === 5){
        return true;
    }


    //가로 조사
    //동쪽 조사
    x = posX + 1;
    y = posY;
    count = 1;
    while(x < 20){
        if(board[x + y*20] !== stdColor || board[x+y*20] === 0)//색이 다르거나 빈칸이면 더이상 전진 X
            break;
        count++
        x++;
    }

    //서쪽 조사
    x = posX - 1;
    y = posY;
    while(x >= 0){
        if(board[x + y*20] !== stdColor || board[x+y*20] === 0)//색이 다르거나 빈칸이면 더이상 전진 X
            break;
        count++
        x--;
    }
    if(count === 5){
        return true;
    }

    

    return false;
}
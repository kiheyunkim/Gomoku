import React from "react";
import "./login.css";
class Login extends React.Component{
    constructor(props){
        super(props);
        this.state = {screenState:'Login'};
        this.socket = this.props.socket;

        //For Login
        this.loginId = React.createRef();
        this.loginPasswd = React.createRef();

        //For Signup
        this.signupid = React.createRef();
        this.signupPasswd = React.createRef();
        this.signupPasswd2 = React.createRef();
        this.signupNickName = React.createRef();

        this.ReadySocket();
    }

    componentWillUnmount(){
        this.CloseSocketEvent();
    }

    ChangeSignupScreen = () =>{
        this.setState({screenState:'SignUp'});
    }

    ChangeLoginScreen = () =>{
        this.setState({screenState:'Login'});
    }

    LoginRequest = () =>{
        this.socket.emit('LoginRequest',
        {
            loginId:this.loginId.current.value,
            loginPasswd:this.loginPasswd.current.value
        });
        this.loginId.current.value = '';
        this.loginPasswd.current.value = '';
    }

    SignupRequest = () =>{
        this.socket.emit('SignupRequest',
        {
            loginId:this.signupid.current.value,
            loginPasswd:this.signupPasswd.current.value,
            loginPasswd2:this.signupPasswd2.current.value,
            nickName:this.signupNickName.current.value
        });
        this.signupid.current.value = '';
        this.signupPasswd.current.value = '';
        this.signupPasswd2.current.value = '';
        this.signupNickName.current.value = '';
    }

    ReadySocket = () =>{
        this.socket.on('Result',(recv)=>{
            console.log(recv);
            if(recv.ResultType === 'LoginFail'){
                alert('아이디 또는 비밀번호를 확인하세요.');
            }else if(recv.ResultType === 'IdAlreadyExist'){
                alert('이미 존재하는 ID입니다.');
            }else if(recv.ResultType === 'IdLengthEexceeded'){ 
                alert('ID의 길이는 10자 까지만 허용됩니다.');
            }else if(recv.ResultType === 'NickLengthEexceeded'){
                alert('닉네임의 길이는 10자 까지만 허용됩니다.');
            }else if(recv.ResultType === 'NickNameInvalid'){
                alert('닉네임에 허용되지 않는 문자가 있습니다.');
            }else if(recv.ResultType === 'PwNotSame'){
                alert('비밀번호가 일치하지 않습니다.');
            }else if(recv.ResultType === 'NickNameAlreadyExist'){
                alert('이미 존재하는 닉네임입니다.');
            }else if(recv.ResultType === 'RegisterFail'){
                alert('회원가입에 실패했습니다.');
            }else if(recv.ResultType === 'AlreadyLogin'){
                alert('이미 로그인 중인 계정입니다.');
            }else if(recv.ResultType === 'RegisterOK'){
                alert('회원가입되었습니다.');
                this.ChangeLoginScreen();
            }
        });
    }

    CloseSocketEvent = () =>{
        this.socket.off('Result');
    }

    render(){
        let form = [];
        
        if(this.state.screenState === 'Login'){
            form.push(
                <div id="loginArea" key = {1}>
				    <h1>O-Mok</h1>
				    <input type='text' placeholder='아이디' ref={this.loginId}/>
				    <input type='password' placeholder='비밀번호' ref={this.loginPasswd}/>
				    <button id="loginBtn" onClick={()=>{this.LoginRequest()}}>로그인</button>
				    <button id="signupBtn" onClick={()=>{this.ChangeSignupScreen()}}>회원가입</button>
			    </div>
            );
        }else{
            form.push(
                <div id="signupArea" key = {2}>
                    <h1>O-Mok</h1>
                    <label>아이디</label><input type='text' ref={this.signupid}/>
                    <label>비밀번호</label><input type='password' ref={this.signupPasswd}/>
                    <label>비밀번호 재입력</label><input type='password' ref={this.signupPasswd2}/>
                    <label>닉네임</label><input type='text' ref={this.signupNickName}/>
                    <button id="joinBtn" onClick={()=>this.SignupRequest()}>가입하기</button>
                    <button id="signupBtn" onClick={()=>{this.ChangeLoginScreen()}}>가입취소</button>
			    </div>
            );
        }
        
        return(
            <div>
                {form}
            </div>
        )
    }
}

export default Login;
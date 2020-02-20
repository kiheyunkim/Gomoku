const React = require('react');

class Chatting extends React.Component{
    constructor(props){
        super(props);
        this.state={messages:['1','2','3']};
    }

    render(){
        let messages= this.state.messages;
        return(
            messages
        )
    }
}

export default Chatting;
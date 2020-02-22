import React from "react";

class Room extends React.Component{
    constructor(props){
        super(props);
        this.socket = props.socket;
    }

    render(){
        return(
            <div>
                room
            </div>
        )
    }
}

export default Room;
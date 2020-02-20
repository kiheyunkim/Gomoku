import React from "react";

class WaittingRoom extends React.Component{
    constructor(props){
        super(props);
        console.log('hi Waitting');
    }

    render(){
        return(
            <div>대기실</div>
        )
    }
}

export default WaittingRoom;
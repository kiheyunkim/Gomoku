import GameRoom from './GameRoom';
import './WindowFrame.css';
const React = require('react');

class WindowFrame extends React.Component{


    render(){
        return(
            <div id ="gameArea">
                <GameRoom />
            </div>
        )
    }
}

export default WindowFrame;
import Empty from './img/Empty.jpg';
import White from './img/White.jpg';
import Black from './img/Black.jpg';

const React = require('react');

class Stone extends React.Component {
    constructor(props) {
        super(props);
        this.stoneState = 'blank';
    }

    placeThisStone = () => {
        this.props.click(this.props.xPos, this.props.yPos);
    }

    render() {
        if (this.props.color === 'white' || this.props.color === 'black') {
            this.stoneState = (this.props.color === 'white') ? White : Black;
        } else {
            this.stoneState = Empty;
        }

        return (
            <img id='stoneImg' src={this.stoneState} alt='stone' onClick={() => this.placeThisStone()}/>
        )
    }
}

export default Stone;
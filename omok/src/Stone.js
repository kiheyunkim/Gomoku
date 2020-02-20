import Empty from './Empty.jpg';
import White from './White.jpg';
import Black from './Black.jpg';
const React = require('react');

class Stone extends React.Component{
    constructor(props){
        super(props);
        this.state ={ stoneState : 'E', current:'blank'};
        this.source ={
            blank:Empty,
            white:White,
            black:Black
        }
    }

    componentDidMount(){//처음 올려졌을 때
    }

    shouldComponentUpdate(){//변화시 마다 해야할것. -> 이미지 교체
        //this.setState({stoneState:this.props.stoneState});//부모가 지정해줌.
        //->그에 따른 주소 변경
        return true;
    }

    func = () =>{
        this.props.placeStone(this.placeThisStone, this.props.xPos, this.props.yPos);
        console.log(this.props.xPos + ',' + this.props.yPos)
    }

    placeThisStone = (color)=>{
        this.setState({current:color})
    }
    

    render(){
        //<div></div>
        return(
            <img id = 'stoneImg' src={this.source[this.state.current]} alt='stone' onClick={()=>this.func()}></img>
        )
    }
}

export default Stone;
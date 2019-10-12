import React from 'react';
import './index.css';
import socketIOClient from 'socket.io-client';
import { withCookies } from 'react-cookie';

function Square(props) {
    return (
        <button className={"square " + props.value} onClick={props.onClick}/>
    )
}

class Logger extends React.Component {
  render() {
    return (
      <div className="game-log">
        {this.props.log.map((item, index) => (
          <p key={index}>{item}</p>
        ))}
      </div>
    )
  }
  shouldComponentUpdate(nextProps) {
    return this.props.log.length !== nextProps.log.length;
  }
}

class Header extends React.Component {
  render() {
    return (
      <div className="game-header">
        {this.props.name}
      </div>
    )
  }
}

class Info extends React.Component {
  render() {
    return (
      <div className="game-info">
        <div>Wellcome {this.props.name} !!</div>
        <div className="spacer"></div>
        <div>You are Player {this.props.side}</div>
        <div className="spacer"></div>
        <div>Winns: {this.props.winns}</div>
        <div>Losses: {this.props.losses}</div>
        <div>Draws: {this.props.draws}</div>
        <div><NewGameBtn 
          winner={this.props.winner}
          token={this.props.token}
        /></div>
      </div>
    )
  }
}
  
class Board extends React.Component {
  handleClick(i) {
    fetch("/api/pressbtn", {
      method: 'POST',
      body: JSON.stringify({
        'btnID': i,
        'player': this.props.player
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': this.props.token
      },
    }); 
  } 

  renderSquare(i) {
    return (
      <Square 
          value={this.props.squares[i]} 
          onClick={() => this.handleClick(i)}
      />
    );
  }

  render() {
    if (this.props.game) {
      let status;
      if (this.props.winner) {
          status = 'Winner: ' + this.props.winner;
      } else {
          status = 'Next player: ' + (this.props.xIsNext ?
              'X' : 'O');
      }
      return [
        <div className="game-status">{status}</div>,
        <div className="game-board">
          <div className="board-container">
            <div className="board-row-container">
              <div className="board-row row1">
                {this.renderSquare(0)}
                {this.renderSquare(1)}
                {this.renderSquare(2)}
              </div>
              <div className="board-row row2">
                {this.renderSquare(3)}
                {this.renderSquare(4)}
                {this.renderSquare(5)}
              </div>
              <div className="board-row row3">
                {this.renderSquare(6)}
                {this.renderSquare(7)}
                {this.renderSquare(8)}
              </div>
            </div>
          </div>
        </div>
      ];
    } else {
      return (
        <div className="game-board">
          <center>
            Waiting for opponent ...
          </center>
        </div>
      );
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.started !== nextProps.started ||
        this.props.xIsNext !== nextProps.xIsNext ||
        this.props.game !== nextProps.game ||
        this.props.winner !== nextProps.winner;
  }
}

class NewGameBtn extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.winner !== nextProps.winner;
  }

  render() {
    if (this.props.winner) {
      return(
        <button className="newGameBtn" onClick={() => newGame(this.props.token)}>
          New Game
        </button>
      )
    } else return null;
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      player: null,
      side: null,
      squares: false,
      xIsNext: true,
      winner: null,
      started: false,
      log: [],
      kicked: false
    }
  }

  componentDidMount() {
    const socket = socketIOClient();
    const { cookies } = this.props;
    socket.on('connect', () => {
       if (!cookies.get('token')) {
        fetch("/user/newanonymous", {
          method: 'POST',
          body: JSON.stringify({
            'socket': socket.id
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(res => {
          this.setState({token: res.headers.get("x-auth-token")});
          cookies.set('token', this.state.token, 
            { path: '/', expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000))});
        });
      } else {
        this.setState({
          token: cookies.get('token')
        });
        fetch("/user/connect", {
          method: 'POST',
          body: JSON.stringify({
            'socket': socket.id
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': this.state.token
          }
        });
      } 
    });

    socket.on("FromAPI", data => {
        this.setState(data);
    });
    socket.on("LogAPI", data => {
      this.setState({
        log: this.state.log.reverse().concat(data).reverse()
      });
    });
    socket.on("APIkick", () => {
      this.setState({
        kicked: true
      });
      console.log("kicked");
    });
  }
  
  render() {
    if(this.state.kicked) {
      return (
        <div>Kicked by Server!</div>
      );
    } else {
      return (
        <div className="game">

          <Board 
            squares={this.state.squares}
            xIsNext={this.state.xIsNext}
            winner={this.state.winner}
            started={this.state.started}
            game={this.state.gameName}
            token={this.state.token}
          />

          <Header
            name={this.state.name}
          />

          <Info 
            name={this.state.name}
            side={this.state.side}
            winns={this.state.winns}
            losses={this.state.losses}
            draws={this.state.draws}
            winner={this.state.winner}
            token={this.state.token}
          />

          <Logger
            log={this.state.log}
          />
        </div>
      );
    }
  }
}

function newGame(token) {
  fetch("/api/newgame", {
    method: 'POST',
    body: JSON.stringify({
      'newGame': true
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    },
  });
}

export default withCookies(Game);
import React from 'react';
import './index.css';
import socketIOClient from 'socket.io-client';
import { withCookies } from 'react-cookie';

const API = 'http://localhost:4000/';

function Square(props) {
    return (
        <button className="square" onClick={props.onClick}>
            {props.value}
        </button>
    )
}

class Logger extends React.Component {
  render() {
    return (
      <div>
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
  
class Board extends React.Component {
  handleClick(i) {
    fetch(API + "pressbtn", {
      method: 'POST',
      body: JSON.stringify({
        'btnID': i,
        'player': this.props.player
      }),
      headers: {
        'Content-Type': 'application/json',
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
    if (this.props.started) {
      let status;
      if (this.props.winner) {
          status = 'Winner: ' + this.props.winner;
      } else {
          status = 'Next player: ' + (this.props.xIsNext ?
              'X' : 'O');
      }

      return (
        <div>
          <div className="status">{status}</div>
          <div className="board-row">
            {this.renderSquare(0)}
            {this.renderSquare(1)}
            {this.renderSquare(2)}
          </div>
          <div className="board-row">
            {this.renderSquare(3)}
            {this.renderSquare(4)}
            {this.renderSquare(5)}
          </div>
          <div className="board-row">
            {this.renderSquare(6)}
            {this.renderSquare(7)}
            {this.renderSquare(8)}
          </div>
        </div>
      );
    } else {
      return (
        <div>
          Waiting for opponent ...
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
  newGame() {
    fetch(API + "newgame", {
      method: 'POST',
      body: JSON.stringify({
        'newGame': true,
        'player': this.props.player
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  shouldComponentUpdate(nextProps) {
    return this.props.winner !== nextProps.winner;
  }

  render() {
    if (this.props.winner) {
      return(
        <button className="newGameBtn" onClick={() => this.newGame()}>
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
      endpoint: API,
      log: []
    }
  }

  componentDidMount() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    const { cookies } = this.props;
    socket.on('connect', () => {
      fetch(API + "hello", {
        method: 'POST',
        body: JSON.stringify({
          'socket': socket.id,
          'player': cookies.get('name')
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      });
    });

    socket.on("FromAPI", data => {
        this.setState({
            player: data.player,
            name: data.name,
            side: data.side,
            squares: data.squares,
            xIsNext: data.xIsNext,
            winner: data.winner,
            started: data.started,
            gameName: data.gameName,
            winns: data.winns,
            losses: data.losses,
            draws: data.draws
        });
        cookies.set('name', this.state.player, { path: '/', expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000))});
    });
    socket.on("LogAPI", data => {
      this.setState({
        log: this.state.log.reverse().concat(data).reverse()
      });
    });
  }
  
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board 
            squares={this.state.squares}
            xIsNext={this.state.xIsNext}
            winner={this.state.winner}
            player={this.state.player}
            started={this.state.started}
            game={this.state.gameName}
          />
        </div>
        <div className="game-info">
          <div>Wellcome {this.state.name} !!</div>
          <div>You are Player {this.state.side}</div>
          <div className="spacer"></div>
          <div>Winns: {this.state.winns}</div>
          <div>Losses: {this.state.losses}</div>
          <div>Draws: {this.state.draws}</div>
          <div><NewGameBtn 
            winner={this.state.winner}
            player={this.state.player}
          /></div>
        </div>
        <div className="game-log"><Logger
          log={this.state.log}
        /></div>
      </div>
    );
  }
}

export default withCookies(Game);
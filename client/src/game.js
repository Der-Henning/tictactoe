import React from 'react';
import './index.css';
import socketIOClient from 'socket.io-client';
import { withCookies } from 'react-cookie';
import { Registration, Login } from './user';

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
}

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      regForm: false,
      logForm: false
    }
    this.closeForm = this.closeForm.bind(this);
  }

  openRegForm() {
    if (this.state.regForm) {
      return (
        <div id="formContainer" onClick={()=>this.setState({regForm: false})}>
          <div className="reglogForm" onClick={(e)=>e.stopPropagation()}>
            <button onClick={()=>this.setState({regForm: false})}>X</button>
            <Registration
              name={this.props.name}
              cookies={this.props.cookies}
              closeForm={this.closeForm}
            />
          </div>
        </div>
      )
    } else return null;
  }

  openLogForm() {
    if (this.state.logForm) {
      return (
        <div id="formContainer" onClick={()=>this.setState({logForm: false})}>
          <div className="reglogForm" onClick={(e)=>e.stopPropagation()}>
            <button onClick={()=>this.setState({logForm: false})}>X</button>
            <Login
              cookies={this.props.cookies}
              closeForm={this.closeForm}
              socket={this.props.socket}
            />
          </div>
        </div>
      )
    } else return null;
  }

  closeForm() {
    this.setState({
      regForm: false,
      logForm: false
    });
  }

  render() {
    if (!this.props.email) {
      return (
        <div className="game-header">
          <button onClick={() => this.setState({regForm: true, logForm: false})}>Register</button>
          <button onClick={() => this.setState({regform: false, logForm: true})}>Login</button>
          {this.openRegForm()}
          {this.openLogForm()}
        </div>
      )
    } else {
      return (
        <div className="game-header">
          <button onClick={() => this.props.logout()}>Logout</button>
        </div>
      )
    }
  }
}

class Info extends React.Component {
  render() {
    let status;
    if (this.props.side) {
      status = "You are Player " + this.props.side;
    }
    return (
      <div className="game-info">
        <div>Wellcome {this.props.name} !!</div>
        <div className="spacer"></div>
        <div>{status}</div>
        <div className="spacer"></div>
        <div>Winns: {this.props.winns}</div>
        <div>Losses: {this.props.losses}</div>
        <div>Draws: {this.props.draws}</div>
        <div><NewGameBtn 
          winner={this.props.winner}
          token={this.props.cookies.get('token')}
        /></div>
      </div>
    )
  }
}

class Status extends React.Component {
  render() {
    let status;
    if (this.props.inQueue) {
      status = 'Waiting for opponent ...';
    } else if (this.props.winner) {
      status = 'Winner: ' + this.props.winner;
    } else {
        status = 'Next player: ' + (this.props.xIsNext ?
            'X' : 'O');
    }
    return(
      <div className="game-status">{status}</div>
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
        'x-access-token': this.props.cookies.get('token')
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
    if (this.props.squares && !this.props.inQueue) {
      return (
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
      )
    } else {
      return null;
    }
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
      socket: null,
      log: []
    }
    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    const socket = socketIOClient();
    const { cookies } = this.props;
    socket.on('connect', () => {
      this.setState({socket: socket.id});
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
          cookies.set('token', res.headers.get("x-auth-token"), 
            { path: '/', expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000))});
        });
      } else {
        fetch("/user/connect", {
          method: 'POST',
          body: JSON.stringify({
            'socket': socket.id
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': cookies.get('token')
          }
        });
      } 
    });
    socket.on("Game", data => {
      this.setState(data);
    });
    socket.on("Player", data => {
      this.setState(data);
      if (data.inQueue) {
        this.setState({
          squares: null,
          winner: null,
          game: null,
          side: null
        });
      }
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
  
  logout() {
    const { cookies } = this.props;
    fetch("/user/logout", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': cookies.get('token')
      }
    })
    .then(res => {
      this.setState({email: null});
      this.props.cookies.set('token', res.headers.get("x-auth-token"), 
        { path: '/', expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000))}); 
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
          <Header
            name={this.state.name}
            email={this.state.email}
            cookies={this.props.cookies}
            logout={this.logout}
            socket={this.state.socket}
          />

          <Status
            winner={this.state.winner}
            xIsNext={this.state.xIsNext}
            started={this.state.started}
            inQueue={this.state.inQueue}
          />

          <Board 
            squares={this.state.squares}
            xIsNext={this.state.xIsNext}
            winner={this.state.winner}
            started={this.state.started}
            game={this.state.gameName}
            inQueue={this.state.inQueue}
            cookies={this.props.cookies}
          />

          <Info 
            name={this.state.name}
            side={this.state.side}
            winns={this.state.winns}
            losses={this.state.losses}
            draws={this.state.draws}
            winner={this.state.winner}
            cookies={this.props.cookies}
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
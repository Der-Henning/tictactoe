import React from 'react';

export class Registration extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        error: '',
        name: this.props.name,
        email: '',
        password: ''
      }
      this.handleChange = this.handleChange.bind(this);
      this.register = this.register.bind(this);
    }
    render() {
      //let name = this.props.name;
      return (
        <form name="regForm">
          <label htmlFor="name">Username:</label><br />
          <input type="text" name="name" id="name" value={this.state.name} onChange={this.handleChange} required autoFocus/><br />
          <label htmlFor="email">E-Mail:</label><br />
          <input type="text" name="email" id="email" onChange={this.handleChange} required/><br />
          <label htmlFor="password">Password:</label><br />
          <input type="password" name="password" id="password" onChange={this.handleChange} required/><br />
          <label htmlFor="repPassword">repeat password:</label><br />
          <input type="password" name="repPassword" id="repPassword" onChange={this.handleChange} required/><br /><br />
          <input type="button" value="registrate" onClick={this.register}/><br />
          <div className="error">{this.state.error}</div>
        </form>
      )
    }
  
    handleChange(event) {
      this.setState({[event.target.name]: event.target.value});
    }
  
    register() {
      const { cookies } = this.props;
      this.setState({
        error: ''
      });
      if (this.state.password !== this.state.repPassword){
        this.setState({
          error: 'Passwords don\'t match!'
        });
      } else {
        fetch("/user/registration", {
          method: 'POST',
          body: JSON.stringify({
            'name': this.state.name,
            'email': this.state.email,
            'password': this.state.password
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': cookies.get('token')
          }
        })
        .then(res => {
          if (res.status === 200) {
            this.setState({token: res.headers.get("x-auth-token")});
            cookies.set('token', res.headers.get("x-auth-token"), 
              { path: '/', expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000))});
            this.props.closeForm();
          } else {
            return res.text()
            .then(data => {
                this.setState({error: data});
            })
          }
        });
      }
    }
}

export class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          error: '',
          login: '',
          password: ''
        }
        this.handleChange = this.handleChange.bind(this);
        this.login = this.login.bind(this);
    }
    render() {
        return (
          <form name="logForm">
            <label htmlFor="login">Username:</label><br />
            <input type="text" name="login" id="login" onChange={this.handleChange} required autoFocus/><br />
            <label htmlFor="password">Password:</label><br />
            <input type="password" name="password" id="password" onChange={this.handleChange} required/><br />
            <input type="button" value="login" onClick={this.login}/><br />
            <div className="error">{this.state.error}</div>
          </form>
        )
    }
    
    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
    }

    login() {
        const { cookies } = this.props;
        this.setState({
          error: ''
        });
        fetch("/user/login", {
            method: 'POST',
            body: JSON.stringify({
              'login': this.state.login,
              'password': this.state.password,
              'socket': this.props.socket
            }),
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': cookies.get('token')
            }
        })
        .then(res => {
            if (res.status === 200) {
              this.setState({token: res.headers.get("x-auth-token")});
              cookies.set('token', res.headers.get("x-auth-token"), 
                { path: '/', expires: new Date(Date.now() + (10 * 365 * 24 * 60 * 60 * 1000))});
              this.props.closeForm();
            } else {
              return res.text()
              .then(data => {
                  this.setState({error: data});
              })
            }
        });
    }
}
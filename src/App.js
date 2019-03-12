import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import InputGroup from 'react-bootstrap/InputGroup'
import ListGroup from 'react-bootstrap/ListGroup'
import Tab from 'react-bootstrap/Tab'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'


import './App.css';

class TVShow extends Component {
  render() {
    return (
    <Card bg="secondary" text="white" >
    <Card.Header><Button variant="primary" block>Ajouter à la sélection</Button></Card.Header>
    <Card.Img variant="top" src={this.props.show.image.medium} />
    <Card.Body>
      <Card.Title>{this.props.show.name}</Card.Title>
      <Card.Text>
<div dangerouslySetInnerHTML={{__html: this.props.show.summary}} />
      </Card.Text>
    </Card.Body>
  </Card>
  );
  }
}
class TVShowListTabbed extends Component {
  render(){
    if (this.props.list){
      return (
<Tab.Container>
  <Row>
    <Col sm={6} >
      <ListGroup>{this.props.list.map((element) =>
        <ListGroup.Item
          key={element.show.id.toString()} action
          href={"#"+element.show.id.toString()}>{element.show.name}</ListGroup.Item>)}
      </ListGroup>
    </Col>
    <Col sm={6}>
      <Tab.Content>{this.props.list.map((element) =>
        <Tab.Pane eventKey={"#"+element.show.id.toString()}>
          <TVShow show={element.show}/>
        </Tab.Pane>)}
      </Tab.Content>
    </Col>
  </Row>
</Tab.Container>);
    } else {
      return (<div>Pas de résultat</div>);
    }
  }
}
class TVShowList extends Component {
  render(){
    if (this.props.list){
      return (
        <ListGroup>{this.props.list.map((element) =>
          <ListGroup.Item key={element.show.id.toString()} action>{element.show.name}</ListGroup.Item>)}
        </ListGroup>);
    } else {
      return (<div>Pas de résultat</div>);
    }
  }
}

class TVShowQuery extends Component {
  constructor(props) {
    super(props);
    this.state = {query: '', found : null, selection : []};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {

    fetch(`http://api.tvmaze.com/search/shows?q=`+this.state.query)
      .then(result=>result.json())
      .then((result)=>this.setState({found : result}));
    //alert('A name was submitted: ' + this.state.query);
    event.preventDefault();
  }

  handleChange(event) {
    this.setState({query: event.target.value});
  }

  render() {
    const found = this.state.found;


    return (
<Container>
  <h2>Extracteur de données sur les séries</h2>
  <Row>
    <Col sm={4}>
        <Button variant="primary" block disabled={this.state.selection.length === 0}>
          Exporter la sélection en SQL <Badge variant="light">{this.state.selection.length} séries</Badge>
        </Button>
      <TVShowList list={this.state.selection}/>
    </Col>
    <Col sm={8}>
      <Form onSubmit={this.handleSubmit}  >
        <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>Série</InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control type="text"
          value={this.state.query}
          onChange={this.handleChange} />
        <InputGroup.Append>
          <Button variant="primary" type="submit">Chercher</Button>
        </InputGroup.Append>
        </InputGroup>
      </Form>
      <TVShowListTabbed list={found}/>
    </Col>
  </Row>
</Container>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <TVShowQuery />
      </div>
    )
  }
}

export default App;

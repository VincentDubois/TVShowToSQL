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
import Image from 'react-bootstrap/Image'


import './App.css';

class TVShowMini extends Component {
  render() {
    const onClick = ()=>this.props.onClick(this.props.show);
    const image = this.props.show.image ? (
      <Col sm="4">
        <Image src={this.props.show.image.medium} rounded fluid />
      </Col>
    ) : (<Col sm="4"></Col>);
    return (
      <Row>
        {image}
        <Col sm="8">
          <h3>{this.props.show.name}</h3>
          <Button variant="secondary" onClick={onClick} size="lg">
            Ajouter
          </Button>
        </Col>
      </Row>
    )
  }
}

class TVShow extends Component {
  render() {
    return (
    <Card bg="secondary" text="white" >
    <Card.Header><Card.Title>{this.props.show.name}</Card.Title></Card.Header>
{this.props.show.image?    <Card.Img variant="top" src={this.props.show.image.medium} />
  : <Card.Text>Pas d image</Card.Text>
}
    <Card.Body>
      <Card.Text dangerouslySetInnerHTML={{__html: this.props.show.summary}} />
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
          href={"#"+element.show.id.toString()}>
            <TVShowMini show={element.show} onClick={this.props.onClick}/>
        </ListGroup.Item>)}
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
          <ListGroup.Item key={element.show.id.toString()} action
                          href={"#"+element.show.id.toString()}>
            <TVShowMini show={element.show} onClick = {this.props.onClick}/>
          </ListGroup.Item>)}
        </ListGroup>)
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
    this.handleRemoveShow = this.handleRemoveShow.bind(this);
    this.handleAddShow = this.handleAddShow.bind(this);
    this.downloadSQLFile = this.downloadSQLFile.bind(this);
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

  handleRemoveShow(show) {
    this.setState({selection: this.state.selection.filter((elt) => (elt.show.id !== show.id))});
  }

  handleAddShow(show) {
    this.setState({selection: this.state.selection.concat([{show: show}]),
                   found: this.state.found.filter((elt) => (elt.show.id !== show.id))}
                );
  }
// show  :
//  id
//  name
//  summary
//  genres (array)
//  language
//  premiered
//  rating.average
//  status
//  url
//  image
//    medium
//    original

  addQuotesIfRequired(s){
    s = String(s);
    if (s==="null") return s;
    return "\""+s+"\"";
  }

  showToNuple(elt){
    const show = elt.show;
    const img = show.image ? show.image.medium : "null";
    const t = [show.id,show.name,show.summary,show.language,
        show.rating.average,show.premiered,show.status,show.url,img];
    return "INSERT INTO serie VALUES ("+t.map(this.addQuotesIfRequired).join()+");\n";
  }


  downloadSQLFile() {
      var result = "CREATE TABLE IF NOT EXISTS `serie` (\n"+
  "`id` int(11) NOT NULL,\n"+
  "`nom` varchar(255) NOT NULL,\n"+
  "`resume` text,\n"+
  "`langue` varchar(255),\n"+
  "`note` decimal(4,2),\n"+
  "`sortie` date,\n"+
  "`statut` varchar(64),\n"+
  "`url` varchar(255) NOT NULL,\n"+
  "`urlImage` varchar(255),\n"+
  "PRIMARY KEY (`id`)\n"+
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; \n";
      for (let i=0; i<this.state.selection.length; i++) {
          result += this.showToNuple(this.state.selection[i]);
      }
      const element = document.createElement("a");
      const file = new Blob([result], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "tvshows.sql";
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }

  render() {
    const found = this.state.found;
    return (
<Container>
  <h2>Extracteur de données sur les séries</h2>
  <Row>
    <Col sm={4}>
        <Button variant="primary" block disabled={this.state.selection.length === 0}
          onClick={this.downloadSQLFile}>
          Exporter la sélection en SQL <Badge variant="light">{this.state.selection.length} séries</Badge>
        </Button>
      <TVShowList list={this.state.selection} onClick={this.handleRemoveShow}/>
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
      <TVShowListTabbed list={found} onClick={this.handleAddShow}/>
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

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

class Field {
  constructor(name,type,key){
    this.name = name;
    this.type = type;
    this.key = key.split("."); // handle inner properties s.a. "image.medium"
    this.quote = !this.type.startsWith("int") && !this.type.startsWith("dec");
  }

  getValue(line){
    let result = line;
    for(let i= 0; i < this.key.length; ++i){
        result = result[this.key[i]];
        if (result === null || typeof result === 'undefined') return "null";
    }

    result = String(result);
    result = result.split("\"").join("\\\"");
    if (this.quote) return "\""+result+"\"";
    return result;
  }
}

class Table {
  constructor(name){
    this.keys = [];
    this.name = name;
    this.data = {};
    this.fields = [];
  }

  addField(field){
    this.fields.push(field);
  }

  add(data){
    if (!this.keys.includes(data.id)) {
      this.data[data.id]=data;
      this.keys.push(data.id);
    }
  }


  generateInsert(elt){
    const t = this.fields.map((field)=>field.getValue(elt));
    return "INSERT INTO "+this.name+" VALUES ("+t.join()+");\n";
  }

  generateAllInsert(){
    var result = "";
    this.keys.forEach((key)=>{result += this.generateInsert(this.data[key])});
    return result;
  }

  generateCreateStatement(){
    var result = "CREATE TABLE IF NOT EXISTS "+this.name+" (\n";
    this.fields.forEach(field=>{
      result += "`"+field.name+"` "+field.type+",\n";
    });
    result += "PRIMARY KEY (`id`)\n"; // TODO will not work for all tables...
    result += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n";
  return result;
  }
}

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
      <ListGroup>{this.props.list.map((id) =>
        <ListGroup.Item
          key={id.toString()} action
          href={"#"+id.toString()}>
            <TVShowMini show={this.props.table.data[id]} onClick={this.props.onClick}/>
        </ListGroup.Item>)}
      </ListGroup>
    </Col>
    <Col sm={6}>
      <Tab.Content>{this.props.table.keys.map((id) =>
        <Tab.Pane eventKey={"#"+id.toString()} key={id.toString()}>
          <TVShow show={this.props.table.data[id]}/>
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
        <ListGroup>{this.props.list.map((id) =>
          <ListGroup.Item key={id.toString()} action
                          href={"#"+id.toString()}>
            <TVShowMini show={this.props.table.data[id]} onClick = {this.props.onClick}/>
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
    this.state = {query: '', found: null, selection: []};

    this.serie =  new Table("serie");
    this.serie.addField(new Field("id","int(11) NOT NULL","id"));
    this.serie.addField(new Field("nom","varchar(255) NOT NULL","name"));
    this.serie.addField(new Field("resume","text","summary"));
    this.serie.addField(new Field("langue","varchar(255)","language"));
    this.serie.addField(new Field("note","decimal(4,2)","rating.average"));
    this.serie.addField(new Field("statut","varchar(64)","status"));
    this.serie.addField(new Field("premiere","date","premiered"));
    this.serie.addField(new Field("url","varchar(255)","url"));
    this.serie.addField(new Field("urlImage","varchar(255)","image.medium"));

    this.personnage = new Table("personnage");
    this.personnage.addField(new Field("id","int(11) NOT NULL","id"));
    this.personnage.addField(new Field("nom","varchar(255) NOT NULL","name"));
    this.personnage.addField(new Field("urlImage","varchar(255)","image.medium"));

    this.personne = new Table("personne");
    this.personne.addField(new Field("id","int(11) NOT NULL","id"));
    this.personne.addField(new Field("nom","varchar(255) NOT NULL","name"));
    this.personne.addField(new Field("urlImage","varchar(255)","image.medium"));
    this.personne.addField(new Field("naissance","date","birthday"));
    this.personne.addField(new Field("mort","date","deathday"));
    this.personne.addField(new Field("pays","varchar(255)","country.name"));


    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRemoveShow = this.handleRemoveShow.bind(this);
    this.handleAddShow = this.handleAddShow.bind(this);
    this.downloadSQLFile = this.downloadSQLFile.bind(this);
  }

  handleSubmit(event) {

    fetch(`http://api.tvmaze.com/search/shows?q=`+this.state.query)
      .then(result=>result.json())
      .then((result)=>{
        for(let line in result) {
          this.serie.add(result[line].show);
        }
        this.setState({found : result.map(line=>line.show.id)});
      });
    event.preventDefault();
  }

  handleChange(event) {
    this.setState({query: event.target.value});
  }

  handleRemoveShow(show) {
    this.setState({selection: this.state.selection.filter((elt) => (elt !== show.id))});
  }

  handleAddShow(show) {
    const id = show.id;
    fetch(`http://api.tvmaze.com/shows/`+id+`/cast`)
      .then(result=>result.json())
      .then((result)=>{
        for(var i = 0; i< result.length;++i){
          this.personne.add(result[i].person);
          this.personnage.add(result[i].character);
        }
        this.setState((oldState) => { return {
                      selection: oldState.selection.concat([id]),
                      found: oldState.found.filter((elt) => (elt !== id))
                    }});
      });
  }

  addQuotesIfRequired(s){
    s = String(s);
    if (s==="null") return s;
    return "\""+s+"\"";
  }

  downloadSQLFile() {

    var result = this.serie.generateCreateStatement();
    result+=this.personne.generateCreateStatement();
    result+=this.personnage.generateCreateStatement();

    console.log(this.serie);
    result += this.serie.generateAllInsert();

    console.log(this.personne);
    result+=this.personne.generateAllInsert();

    console.log(this.personnage);
    result+=this.personnage.generateAllInsert();

    console.log(result);

/*      const element = document.createElement("a");
      const file = new Blob([result], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "tvshows.sql";
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();*/
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
      <TVShowList list={this.state.selection} table={this.serie} onClick={this.handleRemoveShow}/>
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
      <TVShowListTabbed list={found} table={this.serie} onClick={this.handleAddShow}/>
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

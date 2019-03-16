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
    this.key = key.split(".");
    this.quote = !this.type.startsWith("int") && !this.type.startsWith("dec");
  }

  getValue(line){
    let result = line;
    for(let i= 0; i < this.key.length; ++i){
        result = result[this.key[i]];
        if (result === null || typeof result === 'undefined') return "null";
    }

    if (this.quote) return "\""+String(result)+"\"";
    return String(result);
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
    result += "PRIMARY KEY (`id`)\n";
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
        this.setState({found : result})
      });
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
//    show.cast="Pending...";
    fetch(`http://api.tvmaze.com/shows/`+show.id+`/cast`)
      .then(result=>result.json())
      .then((result)=>{
        const showElement = {show: Object.assign({cast: result}, show)};

        for(var i = 0; i< result.length;++i){
          this.personne.add(result[i].person);
          this.personnage.add(result[i].character);
        }
//        showElement.show.cast=result
//        console.log(JSON.stringify(showElement));
//        console.log(showElement.show.cast.length);
        this.setState((oldState) => { return {
                      selection: oldState.selection.concat([showElement]),
                      found: oldState.found.filter((elt) => (elt.show.id !== show.id))
                    }
                    });

      });
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

  downloadSQLFile() {

    console.log(this.serie);
    var result = this.serie.generateCreateStatement();
    result += this.serie.generateAllInsert();
//      var personne = new Table();
/*      const selection = this.state.selection;
      for (let i=0; i<selection.length; i++) {
          result += this.showToNuple(selection[i]);
          const tmp = selection[i];
          console.log(tmp);
          if (Array.isArray(tmp.cast)){
            for(let j = 0; j<tmp.cast.length; j++){
              personne.add(tmp.cast[j]);
            }
          }
      }*/

      console.log(this.personne);
      result+=this.personne.generateAllInsert();

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

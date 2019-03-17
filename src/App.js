import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup'
import Tab from 'react-bootstrap/Tab'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import Image from 'react-bootstrap/Image'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'

import logo from './logo.svg';
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
    this.key="`id`";
  }

  addField(field){
    this.fields.push(field);
  }

  setKey(key){
    this.key = key;
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

  generateAllInsert(subset = null){
    var result = "";
    if (subset == null) subset = this.keys;
    subset.forEach((key)=>{result += this.generateInsert(this.data[key])});
    return result;
  }

  generateCreateStatement(){
    var result = "CREATE TABLE IF NOT EXISTS "+this.name+" (\n";
    this.fields.forEach(field=>{
      result += "`"+field.name+"` "+field.type+",\n";
    });
    result += "PRIMARY KEY ("+this.key+")\n";
    result += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";
  return result;
  }
}

class TVShowMini extends Component {
  render() {
    const image = this.props.show.image ? (
      <Col sm="4">
        <Image src={this.props.show.image.medium} rounded fluid />
      </Col>
    ) : (<Col sm="4"></Col>);
    return (
      <Row>
        {image}
        <Col sm="8">
          <h4>{this.props.show.name}</h4>
          {this.props.children}
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
class TVShowSelected extends Component {
  render(){
      return (
      <Tab.Content>{this.props.table.keys.map((id) =>
        <Tab.Pane eventKey={"#"+id.toString()} key={id.toString()}>
          <TVShow show={this.props.table.data[id]}/>
        </Tab.Pane>)}
      </Tab.Content>);
  }
}
class TVShowList extends Component {
  render(){
    if (this.props.list){
      return (
        <ListGroup>{this.props.list.map((id) =>
          <ListGroup.Item key={id.toString()} action
                          href={"#"+id.toString()}>
            <TVShowMini show={this.props.table.data[id]}>
              <Button variant="secondary"
                onClick={()=>this.props.onClick(id)}
                size="lg">
                {this.props.textButton}
              </Button>
            </TVShowMini>
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
    this.state = {found: null, selection: []};
    this.textInput = React.createRef();

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
    this.personne.addField(new Field("url","varchar(255)","url"));
    this.personne.addField(new Field("naissance","date","birthday"));
    this.personne.addField(new Field("mort","date","deathday"));
    this.personne.addField(new Field("pays","varchar(255)","country.name"));

    this.jouer = new Table("jouer");
    this.jouer.addField(new Field("idSerie","int(11) NOT NULL","idSerie"));
    this.jouer.addField(new Field("idPersonnage","int(11) NOT NULL","idPersonnage"));
    this.jouer.addField(new Field("idPersonne","int(11) NOT NULL","idPersonne"));
    this.jouer.setKey("`idSerie`,`idPersonnage`,`idPersonne`");

    this.episode = new Table("episode");
    this.episode.addField(new Field("id","int(11) NOT NULL","id"));
    this.episode.addField(new Field("nom","varchar(255) NOT NULL","name"));
    this.episode.addField(new Field("idSerie","int(11) NOT NULL","idSerie"));
    this.episode.addField(new Field("resume","text","summary"));
    this.episode.addField(new Field("numero","int(11)","number"));
    this.episode.addField(new Field("saison","int(11)","season"));
    this.episode.addField(new Field("premiere","date","airdate"));
    this.episode.addField(new Field("urlImage","varchar(255)","image.medium"));
    this.episode.addField(new Field("url","varchar(255)","url"));


    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRemoveShow = this.handleRemoveShow.bind(this);
    this.handleAddShow = this.handleAddShow.bind(this);
    this.downloadSQLFile = this.downloadSQLFile.bind(this);
  }

  handleSubmit(event) {
    const query = this.textInput.current.value;

    fetch(`https://api.tvmaze.com/search/shows?q=`+query)
      .then(result=>result.json())
      .then((result)=>{
        for(let line in result) {
          this.serie.add(result[line].show);
        }
        this.setState({found : result.map(line=>line.show.id)});
      });
    event.preventDefault();
  }

  handleRemoveShow(id) {
    this.setState({selection: this.state.selection.filter((elt) => (elt !== id))});
  }

  handleAddShow(id) {
//    const id = show.id;
    fetch(`https://api.tvmaze.com/shows/`+id+`?embed[]=cast&embed[]=episodes`)
      .then(result=>result.json())
      .then((result)=>{
        //console.log(result);
        const cast = result._embedded.cast;
        for(let i = 0; i< cast.length;++i){
          this.personne.add(cast[i].person);
          this.personnage.add(cast[i].character);

          const personneId = cast[i].person.id;
          const personnageId = cast[i].character.id;
          this.jouer.add({id:id+"/"+personneId+"/"+personnageId,
            idSerie:id,
            idPersonnage:personnageId,
            idPersonne:personneId});
        }
        const episodes = result._embedded.episodes;
        for(let i = 0; i< episodes.length;++i){
          episodes[i].idSerie = id;
          this.episode.add(episodes[i]);
        }
        this.setState((oldState) => { return {
                      selection: [id].concat(oldState.selection),
                      found: oldState.found.filter((elt) => (elt !== id))
                    }});
      });
  }

  downloadSQLFile() {

    var result = "# Fichier généré avec les données de TVmaze, en CC-BY-SA. https://www.tvmaze.com/api \n";
    result +="# Liste des séries incluses, par id :\n";
    result +="# "+this.state.selection.join(",")+"\n\n\n";

    result+=this.serie.generateCreateStatement();
    result+=this.personne.generateCreateStatement();
    result+=this.personnage.generateCreateStatement();
    result+=this.jouer.generateCreateStatement();
    result+=this.episode.generateCreateStatement();

    result+=this.serie.generateAllInsert(this.state.selection);
    result+=this.personne.generateAllInsert();
    result+=this.personnage.generateAllInsert();
    result+=this.jouer.generateAllInsert();
    result+=this.episode.generateAllInsert();


    console.log(result);

      const element = document.createElement("a");
      const file = new Blob([result], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "tvshows.sql";
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }

  render() {
    return (
  <Tab.Container>

  <Navbar bg="dark" variant="dark">
    <Navbar.Brand href="#home">
    <img src={logo} width="45" height="45" className="d-inline-block align-top"
          alt="Serie2SQL"/>
    </Navbar.Brand>
    <Nav className="mr-auto">
      <Nav.Link href="https://www.tvmaze.com/api">Données : TVMaze API</Nav.Link>
      <Button variant="outline-info" disabled={this.state.selection.length === 0}
        onClick={this.downloadSQLFile}>
        Exporter la sélection en SQL
        </Button>
    </Nav>
    <Form inline onSubmit={this.handleSubmit}>
      <FormControl type="text" placeholder="Nom de la série" className="mr-sm-2"
        ref={this.textInput}
        autoFocus={true} />
      <Button variant="outline-info" type="submit">Rechercher</Button>
    </Form>
  </Navbar>
  <div style={{marginTop:"1em"}} />
  <Row>
    <Col sm={4}>
      <h4>Sélection <Badge pill variant="info">{this.state.selection.length} séries</Badge></h4>
      <TVShowList list={this.state.selection} table={this.serie} onClick={this.handleRemoveShow}
                  textButton="Retirer"/>
    </Col>
    <Col sm={4}>
      <h4>Résultats de recherche</h4>
      <TVShowList list={this.state.found} table={this.serie} onClick={this.handleAddShow}
                  textButton="Ajouter"/>
    </Col>
    <Col sm={4}>
      <h4>Détail de la sélection</h4>
      <TVShowSelected table={this.serie}/>
    </Col>
  </Row>
  </Tab.Container>
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

import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
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


import logoSQL from './logoSQL.png';
import './App.css';


function mysql_real_escape_string (str) {
  // eslint-disable-next-line
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
      switch (char) {
          case "\0":
              return "\\0";
          case "\x08":
              return "\\b";
          case "\x09":
              return "\\t";
          case "\x1a":
              return "\\z";
          case "\n":
              return "\\n";
          case "\r":
              return "\\r";
          case "\"":
            return "&quot;";
          case "'":
            return "&apos;";
          case "\\":
          case "%":
              return "\\"+char; // prepends a backslash to backslash, percent,
                                // and double/single quotes
          default:
              return char;
      }
  });
}

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
    if(result.length === 0) return "null";

    result = mysql_real_escape_string(result);
    //result = result.split("\"").join("\\\"");
    if (this.quote) return "\""+result+"\"";
    return result;
  }
}

class Table {
  constructor(name){
    this.name = name; // nom de la table
    this.keys = []; // id des éléments de la table
    this.data = {}; // {id:ligne}
    this.fields = []; // liste des champs
    this.key="`id`"; // clef primaire à déclarer en SQL
    this.link= {}; // clefs étrangères {nom_du_champ: table}
  }

  addField(field, linkToTable = null){
    this.fields.push(field);
    if (linkToTable) this.link[field.name] = linkToTable;
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

  forEach(f){
    this.keys.forEach((key)=>{f(this.data[key]);});
  }

  filter(condition){
    let toKeep = [];
    let toRemove = [];

    this.keys.forEach((key)=>{
      if (condition(this.data[key])) toKeep.push(key);
      else toRemove.push(key);
    });

    this.keys = toKeep;
    toRemove.forEach((key)=>{delete this.data[key];});
  }


  generateInsert(elt){
    const t = this.fields.map((field)=>field.getValue(elt));
    return "INSERT INTO "+this.name+" VALUES ("+t.join()+");\n";
  }

  generateAllInsert(subset = null){// subset : la liste des ids que l'on garde
    if (subset == null) subset = this.keys; // si pas précisé, on garde tout
    if (!subset.length) return ""; //pas de données, pas de requête...

    const insertInto = "REPLACE INTO "+this.name+" VALUES\n";
    var result = "";
    const data = subset.map((id)=>{ // On associe à chaque id le nuplet correspondant
      const elt = this.data[id]; // en regroupant tous les champs
      return "("+this.fields.map((field)=>field.getValue(elt)).join()+")"
    });
    for(let i=0; i<data.length; i++){
      if (i%100===0) result += insertInto;
      result += data[i] + ((i<data.length-1 && i%100 < 99) ? ",\n" : ";\n");
    }
    result += "\n";
    return result;
  }

  generateCreateStatement(){
    var result = "CREATE TABLE IF NOT EXISTS "+this.name+" (\n";
    this.fields.forEach(field=>{
      result += "`"+field.name+"` "+field.type+",\n";
    });
    result += "PRIMARY KEY ("+this.key+")";
    for(let key in this.link) result += ",\nKEY (`"+key+"`)";
    result += this.generateConstraintStatement();
    result += "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";
    return result;
  }

  generateConstraintStatement(){
    var result = "";
    var constraint = Object.keys(this.link).map((key,i)=>{
      return "CONSTRAINT `"+this.name+"_ibfk_"+(i+1)+
            "` FOREIGN KEY (`"+key+"`) REFERENCES `"+
            this.link[key].name+"` (`id`)";
    })
    if (constraint.length <1) return "";
    result += ",\n"+constraint.join(",\n");

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
    this.state = {found: [], selection: []};
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
    this.jouer.addField(new Field("idSerie","int(11) NOT NULL","idSerie"), this.serie);
    this.jouer.addField(new Field("idPersonnage","int(11) NOT NULL","idPersonnage"), this.personnage);
    this.jouer.addField(new Field("idPersonne","int(11) NOT NULL","idPersonne"), this.personne);
    this.jouer.setKey("`idSerie`,`idPersonnage`,`idPersonne`");

    this.episode = new Table("episode");
    this.episode.addField(new Field("id","int(11) NOT NULL","id"));
    this.episode.addField(new Field("nom","varchar(255) NOT NULL","name"));
    this.episode.addField(new Field("idSerie","int(11) NOT NULL","idSerie"), this.serie);
    this.episode.addField(new Field("resume","text","summary"));
    this.episode.addField(new Field("numero","int(11)","number"));
    this.episode.addField(new Field("saison","int(11)","season"));
    this.episode.addField(new Field("duree","int(11)","runtime"));
    this.episode.addField(new Field("premiere","date","airdate"));
    this.episode.addField(new Field("urlImage","varchar(255)","image.medium"));
    this.episode.addField(new Field("url","varchar(255)","url"));

    this.genre = new Table("genre");
    this.genre.addField(new Field("id","int(11) NOT NULL","id"));
    this.genre.addField(new Field("idSerie","int(11) NOT NULL","idSerie"));
    this.genre.addField(new Field("nom","varchar(255) NOT NULL","name"));

    this.poste = new Table("poste");
    this.poste.addField(new Field("idSerie","int(11) NOT NULL","idSerie"),this.serie);
    this.poste.addField(new Field("idPersonne","int(11) NOT NULL","idPersonne"),this.personne);
    this.poste.addField(new Field("titre","varchar(100) NOT NULL","titre"));
    this.poste.setKey("`idSerie`,`idPersonne`,`titre`");


    
    this.handleRemoveShow = this.handleRemoveShow.bind(this);
    this.handleAddShow = this.handleAddShow.bind(this);
    this.downloadSQLFile = this.downloadSQLFile.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }



  handleSubmit(event) {
    const query = this.textInput.current.value;

    if (query.startsWith("#")){// si la requète commence par # on extrait les ids
      const ids=query.slice(1,query.length).replace(/\s+/g, '').split(",");
      // ex : # 1,2,3    donne [1,2,3]
      for(let i=0; i< ids.length; ++i){
        this.handleAddShow(parseInt(ids[i]));
      }
      event.preventDefault();
    } else {
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
  }

  handleRemoveShow(id) {
    this.setState({selection: this.state.selection.filter((elt) => (elt !== id))});
  }

  handleAddShow(id) {
//    const id = show.id;
    if (!this.state.selection.includes(id)){
      console.log(id)
      fetch(`https://api.tvmaze.com/shows/`+id+
            `?embed[]=cast&embed[]=crew&embed[]=episodes`)
        .then(result=>result.json())
        .then((result)=>{
          console.log(result);
          this.serie.add(result);

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

          const crew = result._embedded.crew;
          for(let i = 0; i< crew.length;++i){
            this.personne.add(crew[i].person);
            const personneId = crew[i].person.id;
            const titre = crew[i].type;
            this.poste.add({id:id+"/"+personneId+"/titre",
              idSerie:id,
              idPersonne:personneId,
              titre:titre});
          }

          const episodes = result._embedded.episodes;
          for(let i = 0; i< episodes.length;++i){
            episodes[i].idSerie = id;
            this.episode.add(episodes[i]);
          }

          const genres = result.genres;
          for(let i = 0; i< genres.length;++i){
            this.genre.add({id:id*10+i,
              idSerie:id,
              name:genres[i]});
          }


          this.setState((oldState) => {
                      const newSelection = oldState.selection.includes(id) ?
                            oldState.selection : [id].concat(oldState.selection);
                      return {
                        selection: newSelection,
                        found: oldState.found.filter((elt) => (elt !== id))
                      }});
          });
    }
  }

  removeUnused(){
    this.episode.filter(episode=>this.state.selection.includes(episode.idSerie)||
                                  this.state.found.includes(episode.idSerie));
    this.jouer.filter(jouer=>this.state.selection.includes(jouer.idSerie));
    this.poste.filter(poste=>this.state.selection.includes(poste.idSerie));
    var personneToKeep = {};
    var personnageToKeep = {};
    this.jouer.forEach((jouer)=>{
      personnageToKeep[jouer.idPersonnage] =true;
      personneToKeep[jouer.idPersonne] = true;
    });
    this.poste.forEach((poste)=>{
      personneToKeep[poste.idPersonne] = true;
    });
    this.personnage.filter(personnage=>personnageToKeep[personnage.id]);
    this.personne.filter(personne=>personneToKeep[personne.id]);
  }

  downloadSQLFile() {
    this.removeUnused();

    var result = "# Fichier généré avec les données de TVmaze, en CC-BY-SA. https://www.tvmaze.com/api \n";
    result +="# Liste des séries incluses, par id :\n";
    result +="# "+this.state.selection.join(",")+"\n\n\n";

    result+=this.serie.generateCreateStatement();
    result+=this.personne.generateCreateStatement();
    result+=this.personnage.generateCreateStatement();
    result+=this.jouer.generateCreateStatement();
    result+=this.episode.generateCreateStatement();
    result+=this.genre.generateCreateStatement();
    result+=this.poste.generateCreateStatement();

    // On désactive les vérifications de clefs étrangères pour utiliser REPLACE
    result +="SET foreign_key_checks = 0;\n\n";

    result+=this.serie.generateAllInsert(this.state.selection);
    result+=this.personne.generateAllInsert();
    result+=this.personnage.generateAllInsert();
    result+=this.jouer.generateAllInsert();
    result+=this.episode.generateAllInsert();
    result+=this.genre.generateAllInsert();
    result+=this.poste.generateAllInsert();

    // On réactive. Ou pas
    //result +="SET foreign_key_checks = 1;\n";

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

  <Navbar className="justify-content-between" bg="dark" data-bs-theme="dark" >
 <Nav >
  <Navbar.Brand href="#home">
    
    <img src={logoSQL} className="mx-3" width="30"  alt="Serie2SQL"/>
    </Navbar.Brand>

    <Nav.Link href="https://www.tvmaze.com/api">Données : TVMaze API</Nav.Link>

    <Nav.Item className="mx-3">
      <Button variant="outline-info" disabled={this.state.selection.length === 0}
        onClick={this.downloadSQLFile}>
        Exporter la sélection en SQL
        </Button>
    </Nav.Item>
   
    </Nav>
    <Form  onSubmit={this.handleSubmit}>
      <Row>
      <Col xs="auto">
        <Form.Control type="text" placeholder="Nom de la série" className="mx-3"
          ref={this.textInput}
          autoFocus={true} />
          </Col>
          <Col xs="auto">
        <Button variant="outline-info" type="submit"  className="mx-3">Rechercher</Button>
        </Col>
      </Row>
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

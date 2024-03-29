//Variables obligatorias
var renderer;
var sceneWidth;
var sceneHeight;
var camera;
var cinematicCamera;
var theta = 0;
var radius = 5;
var inc = 5;
var scene;
var sun;
var container;
var points = 100;
const maxPoints = 100;
var pointElement = document.getElementById("bar");

var c_tree;
var tree1;

//
var fps = 30;
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;

const tilesize =[0.5,0.5,0.5];
//
var bandera = false;
var tweenMovement;
var tweenRotation;

var defaultWidthForText = 450;
var canvasMinSize = 300;
var textMultiplier = 1.2;

var clock;
//Variables auto
var car;
const carSpeed =  Math.PI/64;//204
const carSpeed2 = 1000;
var carBackwardsSpeed = carSpeed*0.01;
var angularSpeed = 0.01;


//Manejo de collisiones
var collideMeshList = [];
var collideMeshListPoints = [];
var collideGoal = [];
var boxCar;
var carPosition;
//
var nextCameraPosition;
var map;
const mapSize = 900;
var stats;
var x = 0, y = 0,z = 0;

// Game States
var lostState = false;
var lose = false;
//Variables Miscelaneas
const degree = (Math.PI/2);
const limitX = Math.sqrt(mapSize)/2;
const limitY = 9.5;
var isMaxRotating = false;
var isfacingMap = true;
var carAngle = -Math.PI/2;

var carControl = {
  isMovingForward: false,
  isMovingBackwards: false,
  isRotatingLeft: false,
  isRotatingRight: false,
  isStoping: false
};
//semaphoreLights
var semaphoreColors;
var redLightMesh = [];
var yellowLightMesh = [];
var greenLightMesh = [];
var blackColor;
//semaphore control
var preSecond = 0;
var currentSecond = 0;
//Human
var humans = [] ;
var humanMaterial = [];
var humansHitBox = [];
var humanSpawn = [];
var humansCreated = 0;
var hMove;
var humanWalkAnimation;
var humanDeathAnimation;
var humanprevAction;
var humanActiveAction;
var isHumanCreated = false;
var mixer;
//Truck
var truckSpawnBox = [];
var truckCollisionBox = [];

//COLLISIONS
//Semaphore Collisions
var collisionBoxFront = [];
var noFrontBox = [];



var GameStart = false;

var effectComposer;
var ssaoPass;
const offset = {
  NORTH: [-1,0],
  WEST: [0, -1],
  EAST: [0, 1],
  SOUTH: [1, 0]
};
//Clock
var treeMin  = 60 * 1;
var clockLabel = document.getElementById('clock');
var forward_button = document.getElementById('forward');
var left_button = document.getElementById('left');
var right_button = document.getElementById('right');
left_button.disabled = true;
right_button.disabled = true;

var min;
var sec;

var streetGroup;
//Goal
var mainMenuState = true;
var goal;
var cameraAferStart = [-0.5, 0.2, 0];
var centerLookAtMatrix = [14,0,14];

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

const loadingManager = new THREE.LoadingManager( () =>{
const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.classList.add('fade-out');
  loadingScreen.addEventListener('transitionend', onTransitionEnd);
 });

 init();
/*
* 'Clase' que crea una matriz para generar el mapa.
*   Esta generacion sigue los siguientes pasos:
*     1.- Se inicia con una matriz rellenada con 0's
*     2.- Se crea un camino principal.
*     3.- Una vez creado el camino principal, se recorre este camino. Cada 'nodos' o 'celdas' del camino principal
*         se crea otro camino secundario siguiendo las mismas reglas del camino pricipal, estos nuevos caminos pueden ir
*         del lado izquierdo o del lado derecho.*
*   Ademas de los pasos del algoritmo se siguen algunas reglas para evitar lo mas posible que los caminos se crucen,
*   es decir, que el grosor de los caminos de mayor que dos.
*
*/
function City(){
  this.matrix = undefined;
  /*
  *   La matriz pude no ser cuadrada, pero no ha sido probada, sin embargo estos dos parametros pueden ser
  *   modificados  para cambiar el numero de columnas y de filas.
  */
  this.columns = 30;
  this.rows = 30;
  /*
  *   El objeto siguiente no debe ser modificado, debido a que utiliza para la
  *    deteccion de los vecidos de la celda
  */
  this.offset = {
    NORTHWEST: [-1,-1],
    NORTH: [-1,0],
    NORTHEAST: [-1,1],
    WEST: [0, -1],
    EAST: [0, 1],
    SOUTHWEST:  [1, -1],
    SOUTH: [1, 0],
    SOUTHEAST: [1, 1]
  }
  //Funcion que revisa si la celda evaluada existe
  this.isAlive = function(x,y){
    return x >= 0 && y >= 0 && x < this.columns && y < this.rows &&  this.matrix[x][y] !== 'undefined';
  }
  //Funcion que rellena la matriz de 0's
  this.fillMatrix = function(){
    this.matrix = [];
    for (var i = 0; i < this.rows; i++) {
    this.matrix[i] =  [];
    for (var j = 0; j < this.columns; j++) {
      this.matrix[i][j] = 0;
    }
    }
    this.matrix[0][0] = 1;
    this.matrix[this.rows-1][this.columns-1] = 1;
  }
  //Funcion que muestra la matriz y la funcion que la devuelve.
  this.showMatrix = function (){
    var temp;
    for (var i = 0; i < this.rows; i++) {
      temp = this.matrix[i].toString()
      console.log(temp);
    }
  }
  this.getMatrix = function(){
    return this.matrix;
  }
  //Funcion que revisa si el nodo a moverse no esta 'rodeado'
  this.isSurrounded = function(x,y){
    var cont = 0;
    for (let pos in this.offset) {
      var e = Object.getOwnPropertyDescriptor(this.offset,pos);// regresa la descripcion del objecto

      if(typeof pos !== 'undefined'){
        var tmp = pos.toString();
      }
      // tmp != 'SOUTHEAST' &&tmp != 'NORTHEAST' && tmp != 'NORTHWEST' && tmp != 'SOUTHWEST'
      if (this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1 ) {
        cont++;
      }
    }
    if(cont >= 9){
      return true;
    }else if(cont>4) {
      return true;
    }else false

    }
  this.isSurrounded2 = function(x,y){
      var cont = true;
      for (let pos in this.offset) {
        var e = Object.getOwnPropertyDescriptor(this.offset,pos);
        if(typeof pos !== 'undefined'){
          var tmp = pos.toString();
        }
        switch (pos) {
          case 'NORTH':
            if (this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1 ) {
              return true
            }
            break;
          case 'SOUTH':
            if (this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1 ) {
              return true
            }
            break;
          case 'EAST':
            if (this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1 ) {
              return true
            }
            break;
          case 'WEST':
            if (this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1 ) {
              return true;
            }
            break;
          default:
            //cont = false;

        }

      }
      return false;

      }
  /*
    Funcion encargade de crear el camino, no importa cual, solamente necesita la posicion donde incia, y la posicion
    donde quiere llegar.
    Funcionamiento:
      1.- Agrega a una pila la posicion incial e inicia otro arreglo vacio.
      2.- Revisa los vecinos utilizando la funcion 'checkNeighbors2' la cual regresa al mejor vecino..
      3.- Una vez que tiene el mejor vecino, revisa que la celda donde quiere ir es 0 o si esta 'rodeada'.
      4.- Sino esta rodeada, agrega cambia el valor de la celda de 0 a 1 y agrega la posicion al arreglo vacio.
      5.- Regresa el arreglo, con el nuevo camino.
  */
  this.createPath = function(x,y,goalx,goaly){
    var pila = [];
    pila.push([x,y])
    var bPath = [];
    while(pila){
      var value = pila.pop();
      if(!value){
        break;
      }
      var nextPos = [];
      nextPos = this.checkNeighbors(value[0],value[1],goalx,goaly);
      if(this.matrix[nextPos[0]][nextPos[1]] === 0 && !this.isSurrounded(nextPos[0],nextPos[1])){
          switch (nextPos[2]){
            case 'SOUTHEAST':
              break;
            case 'SOUTHWEST':
              break;
            case 'NORTHEAST':
              break;
            case 'NORTHWEST':
              break;
            default:
            this.matrix[nextPos[0]][nextPos[1]] = 1;
            pila.push([nextPos[0],nextPos[1]]);
            bPath.push(value);
          }
        }

      }
      return bPath;
    }
  //Funcion que revisa si la posicion x esta a la izquierda o no.
  this.isLeftSide = function(x){
    if(x == 24){
      return true;
    }else {
      return false;
    }
  }
  /*
    Funcion principal donde se genera el codigo.
    Sigue el algoritmo descrito arriba en la descripcion de la clase.

  */
  this.createCity = function(){
    this.fillMatrix();
    var mainPath = this.createPath(0,0,this.columns,this.rows);
    var cont = 0;
    var ry = 0;
     while(mainPath){
       var p = mainPath.pop();
       cont++;
       if(!p){
         break;
       }
       if(cont >= 4){
          var rx = this.randomSide();
          ry = cont+ry;
          if(this.isLeftSide(rx)){
            var nPath = this.createPath(p[0],p[1],x,ry);
            if(nPath.length > 0){
              this.newPath(nPath);
            }
            cont = 0;
           }
           else{
            var nPath = this.createPath(p[0],p[1],this.columns,0);
            if(nPath.length > 0){
              this.newPath(nPath);
            }
           cont = 0;
        }
     }
   }
    this.addBuilds();
    this.addSigns();

  }
  /*
  * Esta funcion aunque parecida es distinta a la funcion 'createPath' debido a que esta funcion crea un camino
  * a costa de otro camino.
  */
  this.newPath = function(path){
      var cont2 = 0;
      while(path){
        var n = path.pop();
        cont2++;
        if(!n)
          break;
        if(cont2 >= 4){
           var rx2 = this.randomSide();
           var ry2 = this.randomPosition();
           while(this.matrix[rx2][ry2] == 1 && !this.isSurrounded2(rx2[0],ry2[1]) ){
             rx2 =  this.randomSide();
             ry2 = this.randomPosition();
           }
           this.createPath(n[0],n[1],rx2,ry2);
           cont2 = 0;
         }
         con2 = 0;
       }
  }
  //Funcion que regresa una valor aleatorio de cada lado.
  this.randomSide = function () {
    var rand = Math.round(Math.random())
    if(rand < 0.5){
      return 0;
    }
    else {
      return 24;
    }
  }
  //Funcion que regresa una valor aleatorio, aumentando 10 si el valor es muy pequeño.
  this.randomPosition = function(){
    var rx = Math.floor(Math.random()*(this.columns-1)+1);//Minimo incluido maximo incluido
    if(rx + 10 > this.columns){
      return rx;
    }else{
      return rx+10;
    }

  }
  /*
    Funcion que revisa los vecidos de una posicion dada, utilizando la posicion final.
    Se utiliza un valor heuristico(distancia de Manhattan), para darle un peso a la distancia y asi escoger
    el camino mas corto.
    Ademas se niega el acceso si el movimiento es diagonal.
  */
  this.checkNeighbors2 = function(x,y,goalx,goaly){
    var best = 99999999;
    var bPos = [];
    var bscore = 0;
    for (let pos in this.offset) {
      var e = Object.getOwnPropertyDescriptor(this.offset,pos);// regresa la descripcion del objecto
      if(typeof pos !== 'undefined'){
        var tmp = pos.toString();
      }
      // tmp != 'SOUTHEAST' &&tmp != 'NORTHEAST' && tmp != 'NORTHWEST' && tmp != 'SOUTHWEST'
      if (this.isAlive(x + e.value[1], y + e.value[0])  && tmp != 'SOUTHEAST' &&tmp != 'NORTHEAST' && tmp != 'NORTHWEST' && tmp != 'SOUTHWEST' ) {
        bscore = this.checkDistance(x + e.value[1], y + e.value[0],goalx,goaly);
        if((bscore <= best) ){
          best = bscore;
          bPos = [x + e.value[1],y + e.value[0],tmp];
        }
      }
    }
    return bPos;
  }
  this.checkNeighbors = function(x,y,goalx,goaly){
    var best = 99999999;
    var bPos = [];
    var bscore = 0;
    for (let pos in this.offset) {
      var e = Object.getOwnPropertyDescriptor(this.offset,pos);
      if(typeof pos !== 'undefined'){
        var tmp = pos.toString();
      }
      switch (pos) {
        case 'NORTH':
            if (this.isAlive(x + e.value[1], y + e.value[0])){
              bscore = this.checkDistance(x + e.value[1], y + e.value[0],goalx,goaly);
              if((bscore <= best) ){
                best = bscore;
                bPos = [x + e.value[1],y + e.value[0],tmp];
              }
            }
          break;
        case 'SOUTH':
          if (this.isAlive(x + e.value[1], y + e.value[0]) ){
            bscore = this.checkDistance(x + e.value[1], y + e.value[0],goalx,goaly);
            if((bscore <= best) ){
              best = bscore;
              bPos = [x + e.value[1],y + e.value[0],tmp];
            }
          }
          break;
        case 'WEST':
          if (this.isAlive(x + e.value[1], y + e.value[0])   ){
            bscore = this.checkDistance(x + e.value[1], y + e.value[0],goalx,goaly);
            if((bscore <= best) ){
              best = bscore;
              bPos = [x + e.value[1],y + e.value[0],tmp];
            }
          }
        break;
        case 'EAST':
            if (this.isAlive(x + e.value[1], y + e.value[0]) ){
              bscore = this.checkDistance(x + e.value[1], y + e.value[0],goalx,goaly);
              if((bscore <= best) ){
                best = bscore;
                bPos = [x + e.value[1],y + e.value[0],tmp];
              }
            }
          break;
        default:

      }

    }
    return bPos;
    //bPos = [x + e.value[1],y + e.value[0],tmp];

  }
  //Funcion que calcula la distancia de Manhattan
  this.checkDistance = function(x,y,goalx,goaly) {
    var h;
    h = Math.abs(x - goalx) + Math.abs(y - goaly);
    return h;
  }
  this.isEmpty = function(x,y){
    var cont = 0;
    for (let pos in this.offset) {
      var e = Object.getOwnPropertyDescriptor(this.offset,pos);// regresa la descripcion del objecto
      if(typeof pos !== 'undefined'){
        var tmp = pos.toString();
      }
      // tmp != 'SOUTHEAST' &&tmp != 'NORTHEAST' && tmp != 'NORTHWEST' && tmp != 'SOUTHWEST'
      if (this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 0 ) {
        cont++;
      }
    }
    if(cont > 3){
      return true;
    }else {
      return false;
    }
  }
  this.addBuilds = function(){
    //// TODO: Eliminar la condicion para cambiar de edificio, se manejara desde la creacion del modelo
    for (var x = 0; x < this.columns; x++) {
      for (var y = 0; y < this.rows; y++) {
        if(this.matrix[x][y] === 0 && this.isEmpty(x,y)){
          var rand = Math.round(Math.random());
          if(rand > 0.5){
            this.matrix[x][y] = 3;
            }else{
            this.matrix[x][y] = 3;
          }
        }

      }
    }
  }
  this.addSigns = function(){
    for (var x = 0; x < this.columns; x++) {

      for (var y = 0; y < this.rows; y++) {
        // cont3++;
        if (this.matrix[x][y] == 1) {
            var cont = 0;
            var cont2 = 0;
            var cont3 = 0;
            for (var pos in this.offset) {
                var e = Object.getOwnPropertyDescriptor(this.offset,pos);
                switch (pos) {
                  case 'NORTH':
                      if(this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1){
                        cont++;
                        //cont3++;
                      }
                    break;
                  case 'SOUTH':
                      if(this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1){
                        cont++;
                        cont3++;
                      }
                    break;
                  case 'EAST':
                      if(this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1){
                        cont++;
                        //cont3++;
                      }
                    break;
                  case 'WEST':
                      if(this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1){
                        cont++;
                        //cont3++;
                      }
                    break;
                  default:
                    if(this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 1){
                      cont2++;
                    }
                    if(this.isAlive(x + e.value[1], y + e.value[0]) && this.matrix[x + e.value[1]][y + e.value[0]] == 0){
                      cont3++;
                    }
                }
            }
            if(cont >= 4 && cont2 == 0 ){
              this.matrix[x][y] = 4;//4 intersection
            }else if (cont == 3 && cont2 == 0) {
              this.matrix[x][y] = 5; // 3 intersection
            }
            // if(cont3 >= 10 && cont2 == 0){
            //   this.matrix[x][y] = 5;
            //   cont3=0;
            // }


        }
      }

    }
  }
}
function init() {
  createScene();
  update()
}
function MainMenuAnimation(state){
  if(state){
    var startRotation = new THREE.Euler.copy(camera.rotation);

  }

}
function createScene() {
  //Escena
  sceneWidth = window.innerWidth;
  sceneHeight = window.innerHeight;
  scene = new THREE.Scene();
  //scene.fog = new THREE.FogExp2(0xffffff,.5);
  var textLoader = new THREE.TextureLoader(loadingManager);
  const textcube =  textLoader.load('Models/Textures/sky1.jpg');
  scene.background = textcube;

  //scene.background = new THREE.Color( 0xaa55ff);
  //Camara
  camera = new THREE.PerspectiveCamera(60, sceneWidth / sceneHeight, 0.1, 1000);
  camera.position.set(-0.5, 0.2, 0);

  //Cinematic Camera
  cinematicCamera = new THREE.CinematicCamera(75, sceneWidth / sceneHeight, 1, 1000);
  //cinematicCamera.setLens(5);
  cinematicCamera.position.set(14,5, 14);
  //camera.position.set(0,0.2,-0.5);
  //camera.lookAt(scene.position);
  //camera.lookAt(scene.position.x,15,5);
  nextCameraPosition = new THREE.Vector3();
  //Reloj
  clock = new THREE.Clock();
  clock.stop();
  //console.log(clock.getElapsedTime());
  //renderer
  renderer = new THREE.WebGLRenderer({  antialias: true,alpha:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container = document.getElementById("container");
  container.appendChild(renderer.domElement);
  // //Control de Camara
  orbitControl              = new THREE.OrbitControls(camera, renderer.domElement);
  orbitControl.addEventListener('change', render);
  orbitControl.enableZoom   = true;
  orbitControl.update();
  streetGroup = new THREE.Group();
  //createCity
  var city = new City();
  city.createCity();
  map = city.getMatrix();
  createMap(map);
  //CarPositionVector and camera.
  CVector = new THREE.Vector3(0,-2.5,0);
  //lights
  loadLights();
  loadCar(CVector.x,CVector.y,CVector.z);
  tweenMovement = new TWEEN.Tween(carBox.position);
  tweenRotation = new TWEEN.Tween(carBox.rotation);
  //stats
  stats = new Stats();
  container.appendChild(stats.dom);
  //createInstances(city.getMatrix
  createSephore2(0,0,0);
  //WindowResize
  window.addEventListener('resize', onWindowsResize, false);
  onWindowsResize();
  //document.addEventListener('keydown',onKeyDown, false);
  document.addEventListener('keyup',onKeyUp, false);
  var start = document.getElementById('start');
  start.addEventListener('click', onStart,false);
  forward_button.addEventListener('click', onForwardButton,false);
  left_button.addEventListener('click', onLeftButton, false);
  right_button.addEventListener('click', onRightButton, false);

}
function Evaluate(x,y,z){
  var moves =  [];
  for(let pos in offset){
    var e = Object.getOwnPropertyDescriptor(offset,pos);
    switch (pos) {
      case 'NORTH':
        if(exist(x+e.value[1],z+e.value[0],map) && (map[x+e.value[1]][z+e.value[0]] == 1 ||  map[x+e.value[1]][z+e.value[0]] == 4 || map[x+e.value[1]][z+e.value[0]] == 5 )  ){
          moves.push('SOUTH'); //Cambio la direccion para coincidir con la perspevtiva del juego
        }
        break;
      case 'SOUTH':
        if(exist(x+e.value[1],z+e.value[0],map) && (map[x+e.value[1]][z+e.value[0]] == 1 ||  map[x+e.value[1]][z+e.value[0]] == 4 || map[x+e.value[1]][z+e.value[0]] == 5 )){//||  map[x+e.value[1]][z+e.value[0]] == 5
          moves.push('NORTH');
        }
        break;
      case 'WEST':
        if(exist(x+e.value[1],z+e.value[0],map) && (map[x+e.value[1]][z+e.value[0]] == 1 ||  map[x+e.value[1]][z+e.value[0]] == 5  || map[x+e.value[1]][z+e.value[0]] == 4 )){
          moves.push('EAST');
        }
        break;
      case 'EAST':
        if(exist(x+e.value[1],z+e.value[0],map) && (map[x+e.value[1]][z+e.value[0]] == 1 ||  map[x+e.value[1]][z+e.value[0]] == 4 ||  map[x+e.value[1]][z+e.value[0]] == 5)){
          moves.push('WEST');
        }
        break;
      default:
    }
  }

  return moves;
}
function moveTarjet(dx,dy,dz){
  var inc = 0;
  var tarjetPosition = new THREE.Vector3(dx,dy,dz);
  tweenMovement.to(tarjetPosition,carSpeed2).easing(TWEEN.Easing.Quadratic.Out).onUpdate(function(){
    forward_button.disabled = true;
    left_button.disabled = true;
    right_button.disabled =  true;
    points -= 0.05;
    pointElement.style.width = points+ '%';

  }).onComplete(function(){
    forward_button.disabled = false;
    left_button.disabled = false;
    right_button.disabled =  false;

  }).start();
  //if(carControl.isRotatingLeft) tweenMovement.onUpdate(function(){ carBox.rotation.y += (Math.PI/2)/5});
  //tweenMovement.start();
}
function RotateTarjet(dx,dy,dz,direction){
  var d = (direction) ? Math.PI/2 : -Math.PI/2;
  var degree = carBox.rotation.y * 180/Math.PI;
  var tarjetPosition = new THREE.Vector3(dx,dy,dz);
  tweenMovement.to(tarjetPosition,carSpeed2).easing(TWEEN.Easing.Quadratic.Out);
  tweenRotation.to({ y:carAngle+d}, 1000).easing(TWEEN.Easing.Quadratic.Out).onUpdate(function(){
    forward_button.disabled = true;
    left_button.disabled = true;
    right_button.disabled =  true;

  }).
  onComplete(function(){
    if(carAngle >= Math.PI && direction) carBox.rotation.y = -Math.PI/2;
    if(carAngle >= Math.PI && !direction)  carBox.rotation.y = Math.PI/2;
    carAngle = carBox.rotation.y;
    if(carAngle == -Math.PI){carBox.rotation.y = Math.PI; carAngle = carBox.rotation.y};
    if(carAngle >= 2 * Math.PI){carBox.rotation.y = 0; carAngle = carBox.rotation.y};
  }).chain(tweenMovement).
  start();
}
function onStart(event){
  var startScreen = document.getElementById('blocker');
  var info = document.getElementById('info');
  info.classList.add('fade-in');
  startScreen.classList.add('fade-out');
  startScreen.addEventListener('transitionend', onTransitionEnd, false);
  clock.start();
  event.target.removeEventListener('click', onStart,false);

  mainMenuState = false;
  GameStart = true;
  bandera = true;

}
function onForwardButton(event){
  forward_button.disabled = true;
  carControl.isMovingForward = true;
}
function onLeftButton(event){
  carControl.isRotatingLeft = true;
  left_button.disabled = true;
}
function onRightButton(event){
  carControl.isRotatingRight = true;
  right_button.disabled = true;
}
function onWin(){
  clock.stop();
  var winScreen = document.getElementById('win-screen');
  var finalPoints = document.getElementById('TotalPoints');
  finalPoints.innerHTML = points;
  winScreen.classList.add('fade-in');
}
function createMap(matrix){
  var textLoader = new THREE.TextureLoader(loadingManager);
  var stopSignTex = textLoader.load('Models/Textures/cylinderTexture2.png');

  //Collidable point
  var collidableCube = new THREE.BoxGeometry(2,.5,2);
  var collidableCubeMaterial = new THREE.MeshBasicMaterial({color: 0xff00ff, wireframe: true});

  //goalCollision
  var goalMaterial = new THREE.MeshBasicMaterial({color:0xff0000, wireframe:true, visible:false})
  var goalHitBox = new THREE.BoxBufferGeometry(0.2,0.2,0.2);

  var maxStopSign = 2;
  var stopSignCount = 0;


  var isGoalAdded = false;
  var goalHitMesh = new THREE.Mesh(goalHitBox, goalMaterial);

  var evaluate_position;

  var treePos = [];
  var treeType2Pos = [];
  var treeType3Pos =[];
  var streePos = [];
  var grassPos = [];
  var build1Pos = [];
  var build2Pos = [];
  var build3Pos = [];
  var stopPos = [];
  var schoolPos = [];
  var fuelPos = [];
  var semaphorePos = [];
  var noFrontPos = [];
  var rand1;


  for (var x = 0; x < matrix.length; x++) {
    var cont = 0;
    for (var y = 0; y < matrix.length; y++) {
      switch (matrix[x][y]) {
        case 0:
          if(cont>=0){
            rand1 = Math.random();
            if(rand1 < 0.5){
                treeType2Pos.push([x,-2.29,y]);
            }
            else if (rand1 < 0.7  ){
                treePos.push([x,-2.24,y]);
            }else{
              treeType3Pos.push([x,-2.45,y]);
            }
            cont = 0;
          }
          grassPos.push([x,-2.5,y])
          cont++;
          break;
        case 1:
          streePos.push([x,-2.5,y]);
          //rand1 = Math.floor(Math.random()*(30-19)+19);
          rand1 = Math.random();
          if(rand1 < 0.3){
            fuelPos.push([x,-2.45,y]);
          }
          if(rand1 == y && x > 15 && !isGoalAdded){
            goal = createGoal();
            goalHitMesh.add(goal);
            goalHitMesh.position.set(x,-2.4, rand1);
            collideGoal.push(goalHitMesh);
            //scene.add(goalHitMesh);
            isGoalAdded = true;
          }
          break;
        case 2:
        // TODO: El dos que hace??
        //  loadBuild('Models/Buildings/lowpolybuild7.glb',x,-1,y);

          break;
        case 3:
          rand1   = Math.random();
          if(rand1 < 0.5){
            //loadBuild('Models/Buildings/lowPolyBuild8.glb',x,-2.5,y);
            build1Pos.push([x,-2.5,y])
          }else if (rand1 < 0.7  ){
            build2Pos.push([x,-2.5,y])
          //// TODO: descomentar esto  loadBuild('Models/Buildings/lowpolybuild7.glb',x,-2.5,y);
          } else {
            build3Pos.push([x,-2.5,y])
            //loadBuild('Models/Buildings/lowPolyBuild6.glb',x,-2.5,y);
          }

          break;
        case 4:
          streePos.push([x,-2.5,y]);
          //var semaphore = createSemaphore(x,0,y);
          var semaphore = createSephore2();
          semaphore.position.set( x-0.5, -2.2, y-0.5);
          var nPole = semaphore.clone();
          semaphorePos.push([x,-2.38,y]);
          nPole.rotation.y = degree*2;
          nPole.position.x = x+.5;
          nPole.position.z = y+.5;
          scene.add(nPole);
          scene.add(semaphore);
          break;
        case 5:
          streePos.push([x,-2.5,y]);

          evaluate_position = Evaluate(x,-2.5,y);
        if(evaluate_position[0] == 'SOUTH' && evaluate_position[1] == 'WEST' && evaluate_position[2] == 'NORTH' ){

            schoolPos.push([x+.5,-2.38,y-.5]);
            stopPos.push([x+.5,-2.38,y+.5]);
          }


          if(evaluate_position[0] == 'EAST' && evaluate_position[1] == 'WEST' && evaluate_position[2] == 'NORTH' ){
               var randP = Math.random();
               if(randP>0.5){
                 noFrontPos.push([x-0.5,-2.38,y+0.5]);
               }


            }

          break;
        default:

      }
      if(!isGoalAdded){
        goal = createGoal()
        var goalHitMesh = new THREE.Mesh(goalHitBox, goalMaterial);
        goalHitMesh.add(goal);
        goalHitMesh.position.set(29,-2.4, 29);
        collideGoal.push(goalHitMesh);
        scene.add(goalHitMesh)
        isGoalAdded = true;
      }
      if(x == 0){
        rand1 = Math.random();
        if(rand1 < 0.5){
        //  loadModel("Models/Trees/tree1.glb",x,-2.25,y);
            build1Pos.push([x-1,-2.5,y]);
        }
        else if (rand1 < 0.7  ){
            //cloneTree(c_tree,x,-2.1,y);
            build2Pos.push([x-1,-2.5,y]);
        }else{
          //loadModel("Models/Trees/bush.glb",x,-2.4,y);
          build3Pos.push([x-1,-2.5,y]);
        }

      }
       if(y == 0){
        rand1 = Math.random();
        if(rand1 < 0.5){
        //  loadModel("Models/Trees/tree1.glb",x,-2.25,y);
            build1Pos.push([x,-2.5,y-1]);
        }
        else if (rand1 < 0.7  ){
            //cloneTree(c_tree,x,-2.1,y);
            build2Pos.push([x,-2.5,y-1]);
        }else{
          //loadModel("Models/Trees/bush.glb",x,-2.4,y);
          build3Pos.push([x,-2.5,y-1]);
        }
      }
       if (x == matrix.length-1) {
        rand1 = Math.random();
        if(rand1 < 0.5){
        //  loadModel("Models/Trees/tree1.glb",x,-2.25,y);
            build1Pos.push([x+1,-2.5,y]);
        }
        else if (rand1 < 0.7  ){
            //cloneTree(c_tree,x,-2.1,y);
            build2Pos.push([x+1,-2.5,y]);
        }else{
          //loadModel("Models/Trees/bush.glb",x,-2.4,y);
          build3Pos.push([x+1,-2.5,y]);
        }

      }
       if(y == matrix.length-1){

        rand1 = Math.random();
        if(rand1 < 0.5){
        //  loadModel("Models/Trees/tree1.glb",x,-2.25,y);
            build1Pos.push([x,-2.5,y+1]);
        }
        else if (rand1 < 0.7  ){
            //cloneTree(c_tree,x,-2.1,y);
            build2Pos.push([x,-2.5,y+1]);
        }else{
          //loadModel("Models/Trees/bush.glb",x,-2.4,y);
          build3Pos.push([x,-2.5,y+1]);
        }
      }

    }

  }

  rand1 = (Math.random() > 0.5) ? Math.PI/2 : -Math.PI/2;
  loadModelMerge("Models/Signals/stopsign.glb", stopPos,[0.009,0.009,0.009], Math.PI/2);
  loadModel("Models/Items/fuelTank.glb", fuelPos,[0.1/2,0.1/2,0.05/2]);
  loadModelMerge("Models/Signals/NoFront.glb", noFrontPos,[0.1/20,2.0/15,0.1/15], -Math.PI/2);
  loadModelMerge("Models/Signals/peaton.glb", schoolPos,[0.1/15,2.0/15,0.1/15]);
  loadModelMerge("Models/Trees/tree1.glb", treePos,[0.1,1/4,0.1]);
  loadModelMerge("Models/Trees/tree3.glb",treeType2Pos,[0.05,0.05,0.05],rand1);
  loadModelMerge("Models/Trees/bush.glb",treeType3Pos,[0.1,0.1,0.1]);
  loadModelMerge('Models/Trees/STREET.glb',streePos,tilesize);
  loadModelMerge('Models/Trees/GRASS.glb',grassPos,tilesize);
  loadModelMerge('Models/Buildings/lowPolyBuild8.glb',build1Pos,tilesize,rand1);
  loadModelMerge('Models/Buildings/lowpolybuild7.glb',build2Pos,tilesize,rand1);
  loadModelMerge('Models/Buildings/lowPolyBuild6.glb',build3Pos,tilesize,rand1);
  addCollisionBox(schoolPos,[-0.5,-0.5],0x55aaff,humanSpawn);
  addCollisionBox(stopPos,[0.5,-0.5],0xffaabb,truckSpawnBox);
  addCollisionBox(semaphorePos,[0,-1],0x88eebb, collisionBoxFront);
  addCollisionBox(noFrontPos,[1.5,-0.5],0x25eefa,noFrontBox)
  //console.log('HUMANS',humanSpawn.length);
  loadHumanModel('Models/human/Animated_Human.glb',[0.2,-2.5,0],[0.02,0.02,0.02]);
  loadTruckModel('Models/lowPolyTruck.glb',[0.1,0.1,0.1]);




}
function addCollisionBox(pos,offset,color,collisionArray){
  var cubeGeometry = new THREE.BoxBufferGeometry(0.2,0.2,0.2);
  var wireMaterial = new THREE.MeshBasicMaterial({color:color , wireframe: true});
  wireMaterial.visible = false;
  var spawn = new THREE.Mesh(cubeGeometry, wireMaterial);
  pos.forEach(function(value){
    var n_spawn = spawn.clone();
    n_spawn.position.x = value[0]+offset[0];
    n_spawn.position.y = value[1];
    n_spawn.position.z = value[2]+offset[1];
    scene.add(n_spawn);
    collisionArray.push(n_spawn);
  });
}
function exist(x,y,matrix){
  return x >= 0 && y >= 0 && x < 30 && y < 30 &&  matrix[x][y] !== 'undefined';
}
function createGoal(){
  var goal = new THREE.BoxBufferGeometry(0.1,0.1,0.1);
  var goalMaterial = new THREE.MeshPhongMaterial({color:0xFFD700});
  var goalMesh = new THREE.Mesh(goal,goalMaterial);

  goalMesh.rotation.set(degree/2, degree/2, degree/4);
  var goalObject = new THREE.Group();
  goalObject.add(goalMesh);

  return goalObject;

}
function collisionDectection(){
  let originPoint = carBox.position.clone();
  for(var vertex = 0; vertex < carBox.geometry.vertices.length; vertex++ ){
    var localVertex = carBox.geometry.vertices[vertex].clone();
    var globalVertex = localVertex.applyMatrix4(carBox.matrix);
    var directionVector = globalVertex.sub(carBox.position);

    var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
    var collisionResult = ray.intersectObjects(collideMeshList);
    var collisionResultPoints = ray.intersectObjects(humanSpawn);
    var collisionHuman = ray.intersectObjects(humansHitBox);
    var collisionTruck = ray.intersectObjects(truckSpawnBox);
    var collisionSemaphoreFront = ray.intersectObjects(collisionBoxFront);
    var collisionsNoFront = ray.intersectObjects(noFrontBox);
    if(collisionResult.length > 0 && collisionResult[0].distance < directionVector.length()){
        console.log('hit,1');
        var index = collideMeshList.indexOf(collisionResult[0].object);
        if(index > -1){ collideMeshList.splice(index,1)}
        scene.remove(collisionResult[0].object)
        console.log(collideMeshList.length);
        return [true,1];
    }
    if(collisionResultPoints.length > 0 && collisionResultPoints[0].distance < directionVector.length() ){ //scene.getObjectById(collideMeshListPoints[0].id
        console.log('hit,2');
        var pos = collisionResultPoints[0].object.position;
        var index = humanSpawn.indexOf(collisionResultPoints[0].object);
        if(index > -1){ humanSpawn.splice(index,1)}
        scene.remove(collisionResultPoints[0].object)
        return [true,2,pos];
    }
    if(collisionHuman.length > 0 && collisionHuman[0].distance < directionVector.length() ){ //scene.getObjectById(collideMeshListPoints[0].id
        console.log('hit,3');
        var index = humansHitBox.indexOf(collisionHuman[0].object);
        if(index > -1){ humansHitBox.splice(index,1)}
        //scene.remove(collisionHuman[0].object)
        lostState = true;
        return [true,3,collisionHuman[0].object];
    }
    if(collisionTruck.length > 0 && collisionTruck[0].distance < directionVector.length() ){
      console.log('hit,4');
      var pos = collisionTruck[0].object.position;
      var index = truckSpawnBox.indexOf(collisionTruck[0].object);
      if(index > -1){ truckSpawnBox.splice(index,1)}
      scene.remove(collisionTruck[0].object)
      return [true,4,pos];
    }
    if(collisionSemaphoreFront.length > 0 && collisionSemaphoreFront[0].distance < directionVector.length()){
      console.log('hit,5');
      var pos = collisionSemaphoreFront[0].object.position;
      var index = collisionBoxFront.indexOf(collisionSemaphoreFront[0].object);
      if(index > -1){ collisionBoxFront.splice(index,1)}
      scene.remove(collisionSemaphoreFront[0].object)
      console.log(collisionBoxFront.length);
      return [true,5,pos];
    }
    if(collisionsNoFront.length > 0 && collisionsNoFront[0].distance < directionVector.length()){
      console.log('hit,6');
      var index = noFrontBox.indexOf(collisionsNoFront[0].object);
      if(index > -1){ noFrontBox.splice(index,1)}
      scene.remove(collisionsNoFront[0].object)
      console.log(noFrontBox.length);
      return [true,6];
    }
  }
  //console.log('not hit');
  //carControl.isStoping = false;
  return [false,1];
}
function onKeyUp(event){
  switch(event.keyCode){
    case 87: //adelante
            //console.log('W down');
            //carControl.isMovingForward = false;

            carControl.isMovingForward = true;
            // carControl.isRotatingLeft = false;
            // carControl.isStoping = false;
            bandera = true;
            break;
    case 83: //atras
            // console.log('S down');
            carControl.isMovingBackwards = false;
            break;
    case 65: //izquierda
            //onsole.log('A down');
            // carControl.isMovingForward = false;
             carControl.isRotatingLeft = true;
            // carControl.isStoping = false;
            // bandera = true;
            break;
    case 68: //derecha
            //console.log('D down');
            carControl.isRotatingRight = true;
            break;
    case 32: //stop
            //console.log('SPACE down');
            bandera = true;
            carControl.isStoping = false;
            // carControl.isStoping = true ;
            carControl.isMovingForward = true;
            // carControl.isMovingBackwards = false;
            carControl.isRotatingLeft =  false;
            carControl.isRotatingRight = false;
            // carControl.isRotatingRight = false;
            break;

  }
  // carControl.isMovingForward = false;
  // carControl.isMovingBackwards = false;
  // carControl.isRotatingLeft =  false;
  // carControl.isRotatingRight = false;
  // carControl.isStoping = false;
}
function moveHuman(mesh,target){
  hMove = new TWEEN.Tween(mesh.position)
  hMove.to(target,carSpeed2*3).easing(TWEEN.Easing.Quadratic.Out).onComplete(function(){
     scene.remove(mesh);
   }).start();
}
function moveTruck(mesh,target, collision){
  hMove = new TWEEN.Tween(mesh.position)
 hMove.to(target,carSpeed2*3).easing(TWEEN.Easing.Quadratic.Out).repeat(3).onComplete(function(){
    scene.remove(mesh);
  }).start();
}
function updateCarTEMP(){
  var ox = Math.round(carBox.position.x);
  var oy = carBox.position.y;
  var oz = Math.round(carBox.position.z);
  moves = Evaluate(ox, oy, oz);
  var nPos = [];

  var collide = collisionDectection();

  if(collide[0]== true && collide[1] == 1){
    points += 5;
    pointElement.style.width = points+ '%';
  }
  if(collide[0]== true && collide[1] == 2){
      var tarjetPos = new THREE.Vector3();
      var tmp_human = humans.pop();
      mixer = new THREE.AnimationMixer(tmp_human)
      tmp_human.position.x = collide[2].x +2;
      tmp_human.position.y = collide[2].y -.12;
      tmp_human.position.z = collide[2].z +.5;
      tmp_human.children[0].rotation.y = -Math.PI/2;

      mixer.clipAction(humanWalkAnimation).setDuration(0.6).play();
      tmp_human.updateMatrix();
      scene.add(tmp_human);
      tarjetPos.x = collide[2].x -1;
      tarjetPos.y = collide[2].y -.12;
      tarjetPos.z = collide[2].z +.5;
      humansHitBox.push(tmp_human);
      moveHuman(tmp_human, tarjetPos);
      //tmp_human.position.set(tarjetPos);
     // loadHumanModel('Models/human/Animated_Human.glb',
     // [collide[2].x+.8,collide[2].y-.12,collide[2].z+.5],[0.02,0.02,0.02],-Math.PI/2,tarjetPos);
  }
  if(collide[0]== true && collide[1] == 3){
    hMove.stop();
    mixer.stopAllAction();
    humanActiveAction = mixer.clipAction(humanDeathAnimation);
    console.log(humanActiveAction);
    humanActiveAction.clampWhenFinished = true;
    humanActiveAction.loop = THREE.LoopOnce;
    humanActiveAction.play();
    mixer.addEventListener( 'finished', function( e ) {scene.remove(collide[2])} ); // properties of e: type, action
  }
  if(collide[0]== true && collide[1] == 4){
     var tarjetPos = new THREE.Vector3();
     var tmp_truck = truckCollisionBox.pop();
    // mixer = new THREE.AnimationMixer(tmp_human)
     tmp_truck.position.x = collide[2].x-1;
     tmp_truck.position.y = collide[2].y-.12;
     tmp_truck.position.z = collide[2].z-1;
     tmp_truck.rotation.y = -Math.PI/2;
    //
    // mixer.clipAction(humanWalkAnimation).setDuration(1).play();
    //
     scene.add(tmp_truck);
     tarjetPos.x = collide[2].x -1;
     tarjetPos.y = collide[2].y -.12;
     tarjetPos.z = collide[2].z +2;
    // humansHitBox.push(tmp_human);
    moveHuman(tmp_truck, tarjetPos);
  }
  if(collide[0]== true && collide[1] == 5){
     var tarjetPos = new THREE.Vector3();
     var tmp_truck = truckCollisionBox[0].clone();
    // mixer = new THREE.AnimationMixer(tmp_human)
    console.log(tmp_truck)
     tmp_truck.position.x = collide[2].x-1;
     tmp_truck.position.y = collide[2].y-.12;
     tmp_truck.position.z = collide[2].z+1;

     scene.add(tmp_truck);
     tarjetPos.x = collide[2].x +2;
     tarjetPos.y = collide[2].y -0.12 ;
     tarjetPos.z = collide[2].z+1 ;
    // humansHitBox.push(tmp_human);
    moveTruck(tmp_truck, tarjetPos);
  }
  // NORTH: [-1,0],
  // WEST: [0, -1],
  // EAST: [0, 1],
  // SOUTH: [1, 0]
  //El auto no puede in reversa
  switch (moves.length) {
    case 1:
      if(moves[0] == 'NORTH' ){// [1,0,0] SUR EN EL OFFSET
        if(carControl.isMovingForward) moveTarjet(ox+0, oy+0, oz+1);
        if(tweenMovement.onComplete) {/*console.log('click',forward_button.disabled);*/carControl.isMovingForward = false; forward_button.disabled = false; }
      }
      left_button.disabled = true;
      right_button.disabled = true;

      break;
    case 2:
      if(moves[0] == 'SOUTH' && moves[1]=='WEST' && carAngle == -Math.PI/2){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+1, oy+0, oz+0,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        forward_button.disabled = true;
        right_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1]=='WEST' && carAngle == Math.PI){
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+0, oy+0, oz-1,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        forward_button.disabled = true;
        left_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1]=='NORTH' && carAngle == -Math.PI/2){
        if(carControl.isMovingForward) moveTarjet(ox+0, oy+0, oz+1);
        if(tweenMovement.onComplete) {carControl.isMovingForward = false; forward_button.disabled = false;}

        left_button.disabled = true;
        right_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1]=='NORTH' && carAngle == Math.PI/2){
        if(carControl.isMovingForward) moveTarjet(ox+0, oy+0, oz-1);
        if(tweenMovement.onComplete) {carControl.isMovingForward = false; forward_button.disabled = false;}

        left_button.disabled = true;
        right_button.disabled = true;
      }
      if(moves[0] == 'EAST' && moves[1] == 'WEST' && carAngle == 0){
         if(carControl.isMovingForward) moveTarjet(ox+1, oy+0, oz+0);
          if(tweenMovement.onComplete) carControl.isMovingForward = false;
          left_button.disabled = true;
          right_button.disabled = true;
      }
      if(moves[0] == 'EAST' && moves[1] == 'WEST' && carAngle == Math.PI){
         if(carControl.isMovingForward) moveTarjet(ox-1, oy+0, oz+0);
          if(tweenMovement.onComplete) carControl.isMovingForward = false;
          left_button.disabled = true;
          right_button.disabled = true;
      }
      if(moves[0] == 'EAST' && moves[1] == 'NORTH' && carAngle == Math.PI/2){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox-1, oy+0, oz+0,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
      }
      if(moves[0] == 'EAST' && moves[1] == 'NORTH' && carAngle == 0){
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+0, oy+0, oz+1,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
      }
      break;
    case 3:
      if(moves[0] == 'SOUTH' && moves[1] == 'WEST' && moves[2] == 'NORTH' && carAngle == -Math.PI/2 ){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+1, oy+0, oz+0,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox+0, oy+0, oz+1);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;

        }
        right_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'WEST' && moves[2] == 'NORTH' && carAngle == Math.PI ){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+0, oy+0, oz+1,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+0, oy+0, oz-1,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        forward_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'WEST' && moves[2] == 'NORTH' && carAngle == Math.PI/2){
        if(carControl.isMovingForward){
            moveTarjet(ox+0, oy+0, oz-1);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+1, oy+0, oz+0,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }

        left_button.disabled = true;
      }
      if(moves[0] == 'EAST' && moves[1] == 'WEST' && moves[2] == 'NORTH' && carAngle == 0){
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+0, oy+0, oz+1,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox+1, oy+0, oz+0);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
        left_button.disabled = true;
      }
      if(moves[0] == 'EAST' && moves[1] == 'WEST' && moves[2] == 'NORTH' && carAngle == Math.PI/2 ){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox-1, oy+0, oz+0,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+1, oy+0, oz+0,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        forward_button.disabled = true;
      }
      if(moves[0] == 'EAST' && moves[1] == 'WEST' && moves[2] == 'NORTH' && carAngle == Math.PI ){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+0, oy+0, oz+1,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox-1, oy+0, oz+0);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
        right_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'WEST' && carAngle == -Math.PI/2){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+1, oy+0, oz+0,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox-1, oy+0, oz+0,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        forward_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'WEST' && carAngle == 0){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+0, oy+0, oz-1,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox+1, oy+0, oz+0);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
        right_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'WEST' && carAngle == Math.PI){
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+0, oy+0, oz-1,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox-1, oy+0, oz+0);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
        left_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'NORTH' && carAngle == 0){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+0, oy+0, oz-1,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+0, oy+0, oz+1,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        forward_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'NORTH' && carAngle == -Math.PI/2){
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox-1, oy+0, oz+0,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox+0, oy+0, oz+1);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
        left_button.disabled = true;
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'NORTH' && carAngle == Math.PI/2){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox-1, oy+0, oz+0,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox+0, oy+0, oz-1);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
        right_button.disabled = true;
      }

      break;
    case 4:
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'WEST' && moves[3] == 'NORTH' && carAngle == 0){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+0, oy+0, oz-1,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+0, oy+0, oz+1,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox+1, oy+0, oz+0);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'WEST' && moves[3] == 'NORTH' && carAngle == -Math.PI/2){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+1, oy+0, oz+0,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox-1, oy+0, oz+0,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox+0, oy+0, oz+1);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'WEST' && moves[3] == 'NORTH' && carAngle == Math.PI/2){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox-1, oy+0, oz+0,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+1, oy+0, oz+0,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox+0, oy+0, oz-1);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
      }
      if(moves[0] == 'SOUTH' && moves[1] == 'EAST' && moves[2] == 'WEST' && moves[3] == 'NORTH' && carAngle == Math.PI){
        if(carControl.isRotatingLeft){
          RotateTarjet(ox+0, oy+0, oz+1,true);
          if(tweenRotation.onComplete) carControl.isRotatingLeft = false;
        }
        if(carControl.isRotatingRight && !carControl.isMovingForward){
            RotateTarjet(ox+0, oy+0, oz-1,false);
            if(tweenRotation.onComplete) carControl.isRotatingRight = false;
        }
        if(carControl.isMovingForward){
            moveTarjet(ox-1, oy+0, oz+0);
            if(tweenMovement.onComplete) carControl.isMovingForward = false;
        }
      }

      break;
    default:

  }
}
function onKeyDown(event){
  switch(event.keyCode){
    case 87: //adelante
            console.log('W down');
            //carControl.isMovingForward = true;
            // carControl.isMovingForward = true;
            // carControl.isRotatingLeft = false;
            // carControl.isStoping = false;
            // bandera = true;
            break;
    case 83: //atras
            console.log('S down');
            carControl.isMovingBackwards = true;
            break;
    case 65: //izquierda
            console.log('A down');
            // carControl.isMovingForward = false;
            // carControl.isRotatingLeft = true;
            // carControl.isStoping = false;
            // bandera = true;
          //  carControl.isRotatingLeft = true;
            break;
    case 68: //derecha
            console.log('D down');
            carControl.isRotatingRight = true;
            break;
    case 32: //stop
            console.log('SPACE down');
             carControl.isStoping = true ;
             carControl.isMovingForward = false;

            break;
    case 50:// 2
          try {
            ssaoPass.enabled = false;
            console.log('00')
          } catch (e) {
            console.log('undefined')
          }
          break;

  }
}
function getSecond() {
  return new Date().getSeconds();
}
function updateLights(currentSecond){
  try {
    if(currentSecond >= 0 && currentSecond < 30){
      for (var i = 0; i < redLightMesh.length; i++) {
        greenLightMesh[i].material.color.setHex(0x00ff00);
        redLightMesh[i].material.color.setHex(0x303030);
        //preSecond = currentSecond;
        collisionBoxFront.forEach(function (mesh) {
          scene.remove(mesh);
        });
      }
      return true;
    }else if (currentSecond >= 30 && currentSecond < 35) {
      for (var i = 0; i < redLightMesh.length; i++) {
        yellowLightMesh[i].material.color.setHex(0xffff00);
        greenLightMesh[i].material.color.setHex(0x303030);
        redLightMesh[i].material.color.setHex(0x303030);

        //preSecond = currentSecond;
      }
      return true;
    }else if (currentSecond >= 35) {
      for (var i = 0; i < redLightMesh.length; i++) {
        yellowLightMesh[i].material.color.setHex(0x303030);
        redLightMesh[i].material.color.setHex(0xff0000);
        collisionBoxFront.forEach(function (mesh) {
          scene.add(mesh);
        });
        //preSecond = 0;
      }
      return true;
    }
}catch(e){}

}
function loadTruckModel(path, size){
  var cubeGeometry = new THREE.BoxGeometry(0.4,.1,.1);
  var wireMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});
  wireMaterial.visible = true;
  var loader = new THREE.GLTFLoader(loadingManager);
  loader.load(path, function(gltf){
    var mesh = gltf.scene;
    truckSpawnBox.forEach(function(value){
      var n_mesh = mesh.clone();
      var collisionBox = new THREE.Mesh(cubeGeometry, wireMaterial);
      n_mesh.scale.set(size[0],size[1],size[2]);
      collisionBox.updateMatrix();
      collisionBox.add(n_mesh);
      truckCollisionBox.push(collisionBox);
    });
  });
}
function loadMerge(path,pos,scale) {
  var loader = new THREE.GLTFLoader(loadingManager);
  var group = new THREE.Group();
  var geoPos = [];

  loader.load(path, function(gltf){
    var mesh = gltf.scene;
    var mgeo =new THREE.Geometry() ;
    var offset = 1;
    var geo;
     pos.forEach(function(value){
      n_mesh = mesh.clone();
      n_mesh.position.x = value[0];
      n_mesh.position.y = value[1];
      n_mesh.position.z = value[2];
      n_mesh.scale.set(scale[0],scale[1],scale[2]);
      n_mesh.traverse(function (node) {
        if (node.isMesh) {
          geo = new THREE.Geometry().fromBufferGeometry( node.geometry );
        }
        });
      n_mesh.updateMatrix();
      mgeo.merge(geo, n_mesh.matrix);
     });
     var mergeMesh = new THREE.Mesh(mgeo, gltf.scene.children[0].material);
     scene.add(mergeMesh);
     collideMeshList.push(mergeMesh);
  });
}
function loadModelMerge(path, pos, size, rotation){
  var loader = new THREE.GLTFLoader(loadingManager);
  var group = new THREE.Group();
  var geoPos = [];

  loader.load(path, function(gltf){
    var mesh = gltf.scene;
    var mgeo =new THREE.Geometry() ;
    var offset = 1;
    var geo;
     pos.forEach(function(value){
      n_mesh = mesh.clone();
      n_mesh.position.x = value[0];
      n_mesh.position.y = value[1];
      n_mesh.position.z = value[2];
      if(size)n_mesh.scale.set(size[0],size[1],size[2]);
      if(rotation){
        n_mesh.rotation.y = rotation;
      }
      n_mesh.traverse(function (node) {
        if (node.isMesh) {
          geo = new THREE.Geometry().fromBufferGeometry( node.geometry );
        }
        });
      n_mesh.updateMatrix();
      mgeo.merge(geo, n_mesh.matrix);
     });
     var mergeMesh = new THREE.Mesh(mgeo, gltf.scene.children[0].material);
     scene.add(mergeMesh);
  });
}
function loadTile(path,pos) {
  var loader = new THREE.GLTFLoader(loadingManager);
  loader.load(path, function(gltf){
    var mesh = gltf.scene;
    var geo = new THREE.Geometry();
    pos.forEach(function(value){
      var n_mesh = mesh.clone();
      n_mesh.position.x = value[0];
      n_mesh.position.y = value[1];
      n_mesh.position.z = value[2];
      n_mesh.scale.set(0.5,0.5,0.5);
      scene.add(n_mesh);
    });
  });
}
function loadModel(path, pos, size) {
  var cubeGeometry = new THREE.BoxGeometry(0.1,.1,.1);
  var wireMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});
  wireMaterial.visible = false;
  var loader = new THREE.GLTFLoader(loadingManager);
  loader.load(path, function(gltf){
    var mesh = gltf.scene;
    pos.forEach(function(value){
      var n_mesh = mesh.clone();
      var collisionBox = new THREE.Mesh(cubeGeometry, wireMaterial);
      collisionBox.position.x = value[0];
      collisionBox.position.y = value[1];
      collisionBox.position.z = value[2];
      n_mesh.scale.set(size[0],size[1],size[2]);
      collisionBox.updateMatrix();
      collisionBox.add(n_mesh);
      collideMeshList.push(collisionBox);
      scene.add(collisionBox);
    });
  });

}
function loadHumanModel(path, pos, size, rotation, target){
  var cubeGeometry = new THREE.BoxGeometry(0.2,.1,.1);
  var wireMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});
  wireMaterial.visible = false;
  var hitBox = new THREE.Mesh(cubeGeometry, wireMaterial);
  var loader = new THREE.GLTFLoader(loadingManager);
  humanSpawn.forEach(function(value){
    loader.load(path, function(gltf){
        var n_hitBox = hitBox.clone();
        var mesh = gltf.scene;
        mesh.scale.set(size[0],size[1],size[2])
        n_hitBox.add(mesh);
        if(!humanWalkAnimation) humanWalkAnimation = gltf.animations[1];
        if(!humanDeathAnimation) humanDeathAnimation = gltf.animations[2];
        humans.push(n_hitBox);
       });
   });
}
function loadCar(x,y,z) {
  var cubeGeometry = new THREE.BoxGeometry(.15,.1,.09);
  var wireMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
  wireMaterial.visible = false;
  carBox = new THREE.Mesh(cubeGeometry, wireMaterial);
  var loader = new THREE.GLTFLoader(loadingManager);
  loader.load('Models/lowPolyCar2.glb', function(gltf){
    car = gltf.scene;
    carBox.position.y    = y+0.05;
    carBox.rotation.y    = -Math.PI/2;
    car.position.y    -= .05;
    car.scale.set(0.05,0.05,0.05);
    carBox.add(camera);
    carBox.add(car);
    scene.add(carBox);
  });
}
function loadLights() {
  var ambient = new THREE.AmbientLight(0xffffff,0.5);
  scene.add( ambient );
  sun = new THREE.DirectionalLight(0xffffff,1.5);//1.5
  var sunhelper = new THREE.DirectionalLightHelper(sun,5,0xff0000);
  sun.position.set(-1.5,5,-1);
  //sun.position.set(Math.floor(25/2),25,5);
  sun.rotation.set(30,0,0);
  sun.position.multiplyScalar( 30 );
  var hemiLight = new THREE.HemisphereLight(0xfffafa,0x000000,0.9);
  var hemiligtHelper = new THREE.HemisphereLightHelper(hemiLight,5, 0xff0000);
	hemiLight.position.set( 15, 15, 15 );
  scene.add(sun);
  scene.add(hemiLight);
}
function removeFace(geometry){
  var n = [];
  for(var i= 0, jl = geometry.faces.length; i<jl;i++ ){
    if(geometry.faces[i].materialIndex !==3) n.push(geometry.faces[i]);
  }
  geometry.faces = n;
}
function updateTimer(time){

  min = parseInt(time / 60, 10);
  sec = parseInt(time % 60, 10);

  minGoal = parseInt(treeMin / 60, 10);
  // secGoal = treeMin/2 - 1 ;
  secGoal = 59;

  minGoal -= min;
  secGoal -= sec;

  minGoal = Math.abs(minGoal) < 10 ? "0" + minGoal : minGoal;
  secGoal = Math.abs(secGoal) < 10 ? "0" + secGoal : secGoal;
  //console.log(secGoal);

  clockLabel.innerHTML =  minGoal + ':'+ secGoal;
}
function update() {

  requestAnimationFrame(update)
  // now = Date.now();
  // delta = now - then;
  // if(delta > interval){
  //   then = now - (delta%interval);
  //   //carBox.quaternion.multiplyQuaternions(autoRotationQuaternion, carBox.quaternion);
  //   render();
  //   TWEEN.update();
  //   stats.update();
  // }
  render();
  //console.log("POINTS",points);
  points = (points>=maxPoints) ? maxPoints : points;
  collideMeshList.forEach(function(value){
    value.children[0].rotation.y += 0.01;
  });
  ifLose();
  TWEEN.update();
  stats.update();
  }
function createSemaphore(x,y,z){


  var material = new THREE.MeshPhongMaterial({color: 0xc1ab00, flatShading:true});
  var redlightMaterial = new THREE.MeshBasicMaterial({color: 0x303030});
  var yellowlightMaterial = new THREE.MeshBasicMaterial({color: 0x303030});
  var greedlightMaterial = new THREE.MeshBasicMaterial({color: 0x303030});

  var geometry = new THREE.Geometry();

  var poleGeometry = new THREE.BoxGeometry(0.10/2,1.2/2,0.10/2);
  //poleGeometry.computeFlatVertexNormals();
  removeFace(poleGeometry);
  var supportGeometry = new THREE.BoxGeometry(0.05/2,0.8/2,0.05/2);
  //supportGeometry.computeFlatVertexNormals();
  var semaphoreBox = new THREE.BoxGeometry(0.10/2,0.5/2,0.10/2)
  //semaphoreBox.computeFlatVertexNormals();
  var semaphoreLightBox = new THREE.CylinderBufferGeometry(0.02/2,0.05/2,0.02/2,6);
  //semaphoreLights.computeFlatVertexNormals();
  semaphoreLightBox.addAttribute('color', new THREE.BufferAttribute(new Float32Array(semaphoreColors), 3));
  //var redLight = new THREE.PointLight(0xff0000, 1, 50);
  //var yellowLight = new THREE.PointLight(0xffff00, 1, 50);


  var poleMesh = new THREE.Mesh(poleGeometry, material);
  var supportMesh = new THREE.Mesh(supportGeometry, material);
  var semaphoreMesh = new THREE.Mesh(semaphoreBox, material);

  redLightMesh.push(new THREE.Mesh(semaphoreLightBox,redlightMaterial));
  yellowLightMesh.push(new THREE.Mesh(semaphoreLightBox,yellowlightMaterial));
  greenLightMesh.push(new THREE.Mesh(semaphoreLightBox, greedlightMaterial));

  //Object Collidable

  redLightMesh[redLightMesh.length-1].rotation.x = degree;
  redLightMesh[redLightMesh.length-1].position.z -= (0.10/2)/2;
  redLightMesh[redLightMesh.length-1].position.y += (0.10/2)/2;

  yellowLightMesh[yellowLightMesh.length-1].rotation.x = degree;
  yellowLightMesh[yellowLightMesh.length-1].position.z -= (0.10/2)/2;
  yellowLightMesh[yellowLightMesh.length-1].position.y -= (0.10/2)/2;

  greenLightMesh[greenLightMesh.length-1].rotation.x = degree;
  greenLightMesh[greenLightMesh.length-1].position.z -= (0.10/2)/2;
  greenLightMesh[greenLightMesh.length-1].position.y -= (0.10/2)+((0.10/2)/2);
  //redLight.add(redLightMesh);
  //yellowLight.add(yellowLightMesh);
  //poleMesh.receiveShadow = true;
  //poleMesh.castShadow = true;
  poleMesh.position.x = x-.5;
  poleMesh.position.y = -2.5+(1.2/2)/2;
  poleMesh.position.z = z-.5;
  poleMesh.updateMatrix();
  geometry.merge(poleMesh.geometry, poleMesh.matrix );

  // supportMesh.castShadow = true;
  // supportMesh.receiveShadow = true;
  supportMesh.position.y += (1.2/2)/2;
  supportMesh.position.x += (0.8/2)/2;
  supportMesh.rotation.z = degree;
  supportMesh.updateMatrix();
  geometry.merge( supportMesh.geometry, supportMesh.matrix );

  // semaphoreMesh.castShadow = true;
  // semaphoreMesh.receiveShadow = true;
  semaphoreMesh.position.x -= (0.10/2)/2;
  semaphoreMesh.position.y -= (0.10/2)/2;
  semaphoreMesh.updateMatrix();
  geometry.merge( semaphoreMesh.geometry, semaphoreMesh.matrix );

  //geometry.merge( semaphoreMesh.geometry, semaphoreMesh.matrix );

  //scene.add(poleMesh);

  poleMesh.add(supportMesh);
  supportMesh.add(semaphoreMesh);
  semaphoreMesh.add(redLightMesh[redLightMesh.length-1]);
  semaphoreMesh.add(yellowLightMesh[yellowLightMesh.length-1]);
  semaphoreMesh.add(greenLightMesh[greenLightMesh.length-1]);

  var mMesh = new THREE.Mesh( geometry, material );
  return poleMesh;
  /***/

}

function colorGeometry( color, geometry ){

  geometry.faces.forEach( (value) =>{

    value.color.set( color );

  } );

  return geometry;

}
function createSephore2(){

   var mergeGeo = new THREE.Geometry();
   var poleGeometry = new THREE.BoxGeometry(0.10/2,1.2/2,0.10/2);
   removeFace(poleGeometry);
   var supportGeometry = new THREE.BoxGeometry(0.05/2,0.8/2,0.05/2);
   var semaphoreBox = new THREE.BoxGeometry(0.10/2,0.5/2,0.10/2);

   colorGeometry( 0xc1ab00, poleGeometry );
   colorGeometry( 0xc1ab00 , supportGeometry);
   colorGeometry( 0xc1ab00 , semaphoreBox);

   mergeGeo.merge(poleGeometry);
   supportGeometry.rotateZ(-Math.PI/2);
   supportGeometry.translate( (0.8/2)/2,(1.2/2)/2, 0 );
   mergeGeo.merge(supportGeometry);

   semaphoreBox.rotateZ(-Math.PI/2);
   semaphoreBox.translate( (0.7)/3, (1.1/2)/2, 0 );
   mergeGeo.merge( semaphoreBox );

   //lights
   var redlightMaterial = new THREE.MeshBasicMaterial({color: 0x303030});
   var yellowlightMaterial = new THREE.MeshBasicMaterial({color: 0x303030});
   var greedlightMaterial = new THREE.MeshBasicMaterial({color: 0x303030});

   var redLightGeo = new THREE.CylinderBufferGeometry(0.02/2,0.05/2,0.02/2,6);
   redLightGeo.addAttribute('color', new THREE.BufferAttribute(new Float32Array(semaphoreColors), 3));
   var yellowLightGeo = new THREE.CylinderBufferGeometry(0.02/2,0.05/2,0.02/2,6);
   yellowLightGeo.addAttribute('color', new THREE.BufferAttribute(new Float32Array(semaphoreColors), 3));
   var greenLightGeo = new THREE.CylinderBufferGeometry(0.02/2,0.05/2,0.02/2,6);
   greenLightGeo.addAttribute('color', new THREE.BufferAttribute(new Float32Array(semaphoreColors), 3));

   redLightGeo.rotateX(degree);
   redLightGeo.translate( (0.5)/3 ,(1.1/2)/2 , -(0.10/2)/2 );

   yellowLightGeo.rotateX(degree);
   yellowLightGeo.translate( (0.7)/3 ,(1.1/2)/2 , -(0.10/2)/2 );

   greenLightGeo.rotateX(degree);
   greenLightGeo.translate( (0.9)/3 ,(1.1/2)/2 , -(0.10/2)/2 );

   redLightMesh.push(new THREE.Mesh(redLightGeo,redlightMaterial));
   yellowLightMesh.push(new THREE.Mesh(yellowLightGeo,yellowlightMaterial));
   greenLightMesh.push(new THREE.Mesh(greenLightGeo, greedlightMaterial));

   var material = new THREE.MeshLambertMaterial( { vertexColors: THREE.VertexColors } );
   var m_se = new THREE.Mesh( mergeGeo,material )
   m_se.add( redLightMesh[redLightMesh.length-1 ] )
   m_se.add( yellowLightMesh[redLightMesh.length-1 ] )
   m_se.add( greenLightMesh[redLightMesh.length-1 ] )

   return m_se;

}
function render() {
  var delta = clock.getElapsedTime();
  var time = Date.now()
  updateTimer(delta);
  updateGoal();
  //updateCar();
  if(bandera) updateCarTEMP();
  currentSecond = getSecond();

  updateLights(currentSecond);
  if(mixer){
    mixer.update((time-then)*0.001);
    then = time;
  }

  if(mainMenuState){
    theta += 0.1;
      cinematicCamera.position.x = radius * -Math.cos( THREE.Math.degToRad( -theta ) );
      //cinematicCamera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
      cinematicCamera.position.z = radius * Math.sin( THREE.Math.degToRad( -theta ) );
      cinematicCamera.lookAt( 14,0,14);
      cinematicCamera.updateMatrixWorld();
      renderer.render(scene,cinematicCamera);
  }
  else  renderer.render(scene,camera);

  console.log(renderer.info.render.calls);
}
function onTransitionEnd(event){
  event.target.remove();
}
function updateGoal(){
  try {
    goal.rotation.y += 0.01;
    goal.rotation.x += 0.0005;
    //goal.position.y
  } catch (e) {
    console.log('goal doesnt  exist');
  }
}
function onlose(){
  clock.stop();
  var loseScreen = document.getElementById('lose-screen');
  var ui = document.getElementById('info');
  ui.classList.remove('fade-in');
  ui.classList.add('fade-out');
  bandera = false;
  //loseScreen.classList.add('fade-in');

}
function ifLose(){
  if(checkifLose()){
   console.log('You lose');
    onlose();
  }
}
function checkifLose(){
  if(points < 0){
    return true;
  }
  if(minGoal <= 0 && secGoal <= 0){
    return true;
  }

  if(lostState === true){
    return true;
  }
  return false;
}
function onWindowsResize(){
  sceneHeight = window.innerHeight;
  sceneWidth  = window.innerWidth;
  renderer.setSize(sceneWidth, sceneHeight);
  camera.aspect = sceneWidth/sceneHeight;
  camera.updateProjectionMatrix();
  if(mainMenuState){
    cinematicCamera.aspect = sceneWidth/sceneHeight;
    cinematicCamera.updateProjectionMatrix();
  }
}

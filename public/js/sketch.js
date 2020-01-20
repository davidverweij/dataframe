//P5.js sketch

/*

TODOs:

- control drawing to lower performance load


*/

let sketch = function(p){

  let paths = [], LEDS = [], interactivity = [];  // All the paths, leds and connected interactivities

  let painting = false; // Are we painting?
  let paintmargin = 10; //avoids loads of points at the same spot

  let next = 500;       // How long until the next circle

  let current_point;    // Where are we now and where were we?

  let WINDOWsize = [];             // size of the canvas
  let LEDspacing;
  let LEDmatrixSize = [0,0];  // size of the LED matrix we are configuring
  let LEDmatrixString = "";  // keep a latest version of the STRING from the database, so we can re-render the matrix when needed.
  let LEDmatrixLength = 0;
  let LEDsize = .8;

  let resizeMatrix;       // variable to set timeout to recalc matrix (with delay)

  const triggers = document.getElementById('triggers');

  p.setup = function() {
    WINDOWsize = p.getCanvasSize();
    let canvas = p.createCanvas(WINDOWsize[0], WINDOWsize[1]);
    canvas.id('p5Canvas');
    current_point = p.createVector(0, 0);
  }

  p.getCanvasSize = function (){
    let div = document.getElementById('main');
    return [div.offsetWidth,div.offsetHeight];
  }

  p.draw = function() {
    p.background(255);
    p.fill(0);
    p.noStroke();

    // If it's time for a new point
    if (painting && p.millis() > next && (p.abs(p.mouseX-current_point.x)>paintmargin || p.abs(p.mouseY-current_point.y)>paintmargin)) {
      current_point.x = p.mouseX;
      current_point.y =  p.mouseY;   // Grab mouse position
      paths[paths.length - 1].add(p.relativeToMatrix(current_point));   // create new point
    }

    for (let i = 0; i < LEDS.length; i++) LEDS[i].display();    // Draw all LEDs

    // p.noStroke();
    // p.fill(255,255,255,150);
    // p.rectMode(p.CORNER);
    // p.rect(0,0,WINDOWsize[0],WINDOWsize[1]);

    for (let i = 0; i < paths.length; i++) paths[i].display();  // Draw all paths

  }

  p.mousePressed = function(){
    p.screenPressed();
  }
  p.touchStarted = function(){
    p.screenPressed();
    console.log("touch!!");
  }

  p.mouseReleased = function(){
    p.screenReleased();
  }

  p.touchEnded = function(){
    p.screenReleased();
    console.log("touch!!");
  }

  p.relativeToMatrix = function(position){
    let rel_x = (position.x - WINDOWsize[0]/2) / LEDspacing;
    let rel_y = (position.y - WINDOWsize[1]/2) / LEDspacing;
    return p.createVector(rel_x, rel_y);
  }

  p.relativeToView = function(position){
    let rel_x = position.x * LEDspacing + WINDOWsize[0]/2;
    let rel_y = position.y * LEDspacing + WINDOWsize[1]/2;
    return p.createVector(rel_x, rel_y);
  }

  p.updateMatrix = function(new_size = LEDmatrixSize, new_string = LEDmatrixString, new_window = false){    // default values if undefined: [], "", boolean
    let new_array = new_string.match(/.{1,6}/g);
    // if we get new metrics (e.g. the first time)
    if (new_size[0] != LEDmatrixSize[0] || new_size[1] != LEDmatrixSize[1] /* matrix dimensions changed */
      || new_array.length != LEDmatrixLength             /* number of LEDs changed, though new_size should then also flag*/
      || new_window  /* window is resized, easier to recalc instead of adjust positions */
    ){

      LEDmatrixSize = new_size;
      LEDmatrixString = new_string;
      LEDmatrixLength = new_array.length;
      WINDOWsize = p.getCanvasSize();
      LEDspacing = p.min(WINDOWsize[0]/(LEDmatrixSize[0]+2),WINDOWsize[1]/(LEDmatrixSize[1]+2));

      p.resizeCanvas(WINDOWsize[0], WINDOWsize[1]);

      let topleft_x = WINDOWsize[0]/2 - (LEDmatrixSize[0]*LEDspacing)/2 + LEDspacing/2;
      let topleft_y = WINDOWsize[1]/2 - (LEDmatrixSize[1]*LEDspacing)/2 + LEDspacing/2;

      LEDS = [];  // empty array, then create a new one based on this data
      let iterator = 0;
      for (let x = 0; x < LEDmatrixSize[0]; x++){
        for (let y = 0; y < LEDmatrixSize[1]; y++){
          LEDS.push(new LED(x - (LEDmatrixSize[0]/2), y - (LEDmatrixSize[1]/2), new_array[iterator]));
          iterator++;
        }
        x++;
        if (x < LEDmatrixSize[0]){
          for (let y = LEDmatrixSize[1]-1; y >= 0; y--){
            LEDS.push(new LED(x - (LEDmatrixSize[0]/2), y - (LEDmatrixSize[1]/2), new_array[iterator]));
            iterator++;
          }
        }
      }
    } else if (!new_string.equals(LEDmatrixString)){      // only the colours changed! Update colour of LEDs
      LEDmatrixString = new_string;
      for (let i = 0; i < LEDmatrixLength; i++){
        LEDS[i].updateColor(new_array[i]);
      }
    }
  }

  p.windowResized = function(){
    // wait 1 second for any windowsize changes (by overriding any ongoing windowchanges)
    window.clearTimeout(resizeMatrix);
    resizeMatrix = window.setTimeout(function(){
        p.updateMatrix(LEDmatrixSize, LEDmatrixString, true);
    }, 500);
  }

  // create a new element for in the DOM - I am not checking for duplicates at the moment
  p.createTrigger = function(name, id){

    let toggle = document.createElement("li");
    let input = document.createElement("INPUT");
    input.setAttribute("type","checkbox");
    input.name = name;
    input.value = id;
    let label = document.createElement("LABEL")
    label.htmlFor = name;
    let innerLabel = document.createTextNode(name);
    label.appendChild(innerLabel);
    toggle.appendChild(input);
    toggle.appendChild(label);

    let list  = document.getElementById("triggers");
    list.appendChild(toggle);

    input.addEventListener('change', () => {
      for (let i = 0; i < interactivity.length; i++){
        if (interactivity[i].id == input.value){
          interactivity[i].active = input.checked;

          for (let q = 0; q < LEDS.length; q++){
            LEDS[i].updateTrigger(interactivity[i].id, interactivity[i].active);
          }

        }
      }

    })
  }


  p.screenPressed = function() {
    painting = true;
    paths.push(new Path(paths.length)); // start new drawing
  }

  p.screenReleased = function() {
    if (painting) {

      //if the drawing has less than 4 points, we assume click (configure) instead of draw
      if (paths[paths.length - 1].particles.length < 5) {
        paths.splice([paths.length - 1], 1); //remove recently added path

        // if there are paths, configure clicked area (if clicked in area)
        if (paths.length > 0) {
          let gotIt = -1;
          let point = p.createVector(p.mouseX, p.mouseY);
          // work backwards through all areas (so the ones on top are checked first)
          for (let i = paths.length - 1; i > -1; i--) {
            // check if the click point is within the area
            if (paths[i].contains(point)) {
              gotIt = i;
              break;
            }
          }

          // yes, clicked on an existing area
          if (gotIt > -1) {
            // ask for interactable input
            let interactInput = prompt("key", "");
            if (interactInput == null || interactInput == "") {
              console.log("User cancelled the prompt.");
            } else {

              //let colorInput = prompt("color", "");
              let colorInput = p.createColorPicker();
              colorInput.click();

              // See for how to click a DOM HTML element https://stackoverflow.com/questions/29676017/open-browser-standard-colorpicker-with-javascript-without-type-color

              if (colorInput == null || colorInput == "") {
                console.log("User cancelled the prompt.");
              } else {
                let newInteract = {
                  'id': gotIt,
                  'key': interactInput,
                  'color': p.color(colorInput),
                  'active' :false,
                }

                interactivity.push(newInteract);

                p.createTrigger(interactInput, gotIt);
                for (let i = 0; i < LEDS.length; i++) {
                  if (LEDS[i].contains(paths[gotIt])){
                    LEDS[i].connect(newInteract); // update the LED to keep track of this new interactivity
                  }
                }
              }
            }
          }
        }

      } else {
        // finish shape
        paths[paths.length - 1].finishShape();
        let foundLEDs = false;
        for (let i = 0; i < LEDS.length; i++) {
          if (LEDS[i].contains(paths[paths.length - 1])){
            foundLEDs = true;
            break;
          }
        }
        if (!foundLEDs) {   // if the path is not drawn on some LEDS, remove it
          //paths.splice([paths.length - 1], 1);
        }
      }
      painting = false;
    }
  }

  // A Path is a list of particles
  class Path {
    constructor(id) {
      this.particles = [];
      this.finished = false;
      this.id = id;
      this.interactivity = 1;
    }

    add(position) {
      this.particles.push(position);
    }

    // close the path
    finishShape() {
      this.finished = true;
    }

    // Display plath
    display() {
      if (this.finished) p.fill(255, 150);
      else p.noFill();
      p.strokeWeight(1);
      p.stroke(0);
      p.beginShape();
      for (let i = this.particles.length - 1; i >= 0; i--) {
        let windowPos = p.relativeToView(this.particles[i]);
        p.vertex(windowPos.x, windowPos.y);
      }
      if (this.finished) p.endShape(p.CLOSE);
      else p.endShape();
    }

    // based on https://stackoverflow.com/a/8721483/7053198
    contains(point) {
      let i, j, result = false;
      for (i = 0, j = this.particles.length - 1; i < this.particles.length; j = i++) {
        if ((this.particles[i].y > point.y) != (this.particles[j].y > point.y) &&
        (point.x < (this.particles[j].x - this.particles[i].x) * (point.y - this.particles[i].y) / (this.particles[j].y - this.particles[i].y) + this.particles[i].x)) {
          result = !result;
        }
      }
      return result;
    }

  }

  // LED's in view
  class LED {

    constructor(x, y, rgbmatrix) {
      this.position = p.createVector(x, y);
      this.triggerList = [];
      this.color = p.color('#' + rgbmatrix);
    }

    updateTrigger(id, active){
      console.log(this.triggerList.length);
      if (this.triggerList.length > 0){
        for (let i = 0; i < this.triggerList.length; i++){
          if (this.triggerList[i].id == id){  //found it
            this.triggerList[i].active = active;
            break;
          }
        }
      }
      this.updateColor();
    }

    updateColor(rgbmatrix){
      this.color = p.color('#' + rgbmatrix);
    }

    // Draw LED
    display() {
      let marg = (LEDspacing*(1-LEDsize)/2);
      let windowPos = p.relativeToView(this.position);

      p.noStroke();
      p.fill(this.color);
      p.rectMode(p.CORNER); // Set rectMode to RADIUS

      p.rect(windowPos.x + marg, windowPos.y + marg, LEDspacing*LEDsize, LEDspacing*LEDsize, LEDspacing/10);

      p.stroke(0, 100);
      p.strokeWeight(1);
      p.fill(255);
      p.ellipse(windowPos.x + LEDspacing/2, windowPos.y + LEDspacing/2, 2, 2);

    }


    // based on https://stackoverflow.com/a/8721483/7053198
    contains(shape) {
      let particleList = shape.particles;
      let i, j, result = false;
      for (i = 0, j = particleList.length - 1; i < particleList.length; j = i++) {
        if ((particleList[i].y > this.position.y) != (particleList[j].y > this.position.y) &&
        (this.position.x < (particleList[j].x - particleList[i].x) * (this.position.y - particleList[i].y) / (particleList[j].y - particleList[i].y) + particleList[i].x)) {
          result = !result;
        }
      }
      return result;
    }

    connect(interactivity){
      this.triggerList.push({'id':interactivity.id, 'color':interactivity.color, 'active':interactivity.active});
    }
  }
}

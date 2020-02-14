//P5.js sketch

/*

TODOs:

- control drawing to lower performance load


*/

let sketch = function(p){

  let paths = [], LEDS = [], interactivity = [];  // All the paths, leds and connected interactivities

  let painting = false; // Are we painting?
  let paintmargin = 5; //avoids loads of points at the same spot

  let next = 500;       // How long until the next circle

  let current_point;    // Where are we now and where were we?

  let WINDOWsize = [];             // size of the canvas
  let LEDspacing;
  let LEDmatrixSize = [0,0];  // size of the LED matrix we are configuring
  let LEDmatrixString = "";  // keep a latest version of the STRING from the database, so we can re-render the matrix when needed.
  let LEDmatrixLength = 0;
  let LEDsize = .7;

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
    p.background(230);
    p.fill(0);
    p.noStroke();

    // If it's time for a new point
    if (painting && p.millis() > next && (p.abs(p.mouseX-current_point.x)>paintmargin || p.abs(p.mouseY-current_point.y)>paintmargin)) {
      current_point.x = p.mouseX;
      current_point.y =  p.mouseY;   // Grab mouse position
      paths[paths.length - 1].add(p.relativeToMatrix(current_point));   // create new point
    }

    for (let i = 0; i < LEDS.length; i++) LEDS[i].display();    // Draw all LEDs
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
    let rel_x = (position.x - WINDOWsize[0]/2 - LEDspacing/2) / LEDspacing;
    let rel_y = (position.y - WINDOWsize[1]/2 - LEDspacing/2) / LEDspacing;
    return p.createVector(rel_x, rel_y);
  }

  p.relativeToView = function(position){   // margin is overridden for LEDs
    let rel_x = position.x * LEDspacing + WINDOWsize[0]/2 + LEDspacing/2;
    let rel_y = position.y * LEDspacing + WINDOWsize[1]/2 + LEDspacing/2;
    return p.createVector(rel_x, rel_y);
  }

  p.highlightLedsInPath = function(path){
    let foundSomeLEDS = false;
    let checkPath = true;

    if (typeof(path) === 'undefined') checkPath = false;      // turn on all LEDS

    for (let i = 0; i < LEDS.length; i++) {
      if (!checkPath || LEDS[i].contains(path)){
        foundSomeLEDS = true;
        // this LED is in the shape - let's indicate we are working with this one!
        LEDS[i].highlighting(true); // boolean highlightmode, boolean active
      } else {
        // make 'dim'
        LEDS[i].highlighting(false); // highlight mode, but not active
      }
    }
    return foundSomeLEDS;
  }

  p.highlightPaths = function(pathID){
    let checkId = true;
    if (typeof(pathID) === 'undefined') checkID = false;

    for (let i = 0; i < paths.length; i++) {       // work backwards through all areas (so the ones on top are checked first)
      if (!checkId) paths[i].highlighting(0);           // default
      else if (i == pathID) paths[i].highlighting(1);   // 1 = highlight
      else paths[i].highlighting(-1);                   // de-emphasize
    }
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
          LEDS.push(new LED(x - (LEDmatrixSize[0]/2), y - (LEDmatrixSize[1]/2), new_array[iterator], LEDsize, LEDspacing, p));
          iterator++;
        }
        x++;
        if (x < LEDmatrixSize[0]){
          for (let y = LEDmatrixSize[1]-1; y >= 0; y--){
            LEDS.push(new LED(x - (LEDmatrixSize[0]/2), y - (LEDmatrixSize[1]/2), new_array[iterator], LEDsize, LEDspacing, p));
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
    paths.push(new Path(paths.length, p));                  // start new path
  }

  p.screenReleased = function() {
    if (painting) {

      if (paths[paths.length - 1].particles.length < 5) {    // if the drawing has less than 4 points, we assume click (configure) instead of draw
        paths.splice([paths.length - 1], 1);                 // remove recently added path

        if (paths.length > 0) {                              // if there are paths, configure clicked area (if clicked in area)
          let gotIt = -1;
          let point = p.relativeToMatrix(p.createVector(p.mouseX, p.mouseY));

          for (let i = paths.length - 1; i > -1; i--) {       // work backwards through all areas (so the ones on top are checked first)
            if (paths[i].contains(point) && !gotIt > -1) {    // check if the click point is within the path, and only act upon the zone 'on top'
              gotIt = i;
              p.highlightLedsInPath(paths[i]);                // highlight zone and it's LED's
            }
          }

          if (gotIt > -1) {                         // yes, clicked on an existing area
            p.highlightPaths(gotIt);                // (pathID) highlight this path, de-emphasize others
            p.highlightLedsInPath(paths[gotIt]);    // highlight the LEDS in this path
          } else {                                  // we clicked away from any zones!

          }
        }

      } else {

        paths[paths.length - 1].finishShape();  // finish shape
        let foundLEDs = false;
        foundLEDs = p.highlightLedsInPath(paths[paths.length-1]); // highlight zone and it's LED's, returns false if none is found
        if (!foundLEDs) {   // if the path is not drawn on some LEDS, remove it
          paths.splice([paths.length - 1], 1);
          p.highlightLedsInPath();  // leave empty = turn all LEDS on again.
        }
      }
      painting = false;

    } else {
      // we are not painting
    }
  }
}

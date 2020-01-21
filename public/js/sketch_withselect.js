//P5.js sketch

/*

TODOs:

- control drawing to lower performance load


*/

let sketch = function(p){

  let paths = [], LEDS = [], interactivity = [];  // All the paths (or zones), leds and connected interactivities

  let selecting = 0;;           // Are we selecting LEDs? (use millis to indicate unique identifyer)
  let previous_selecting = 0;   // to see if we have a new click
  let selectingmode = 0;        // 0 is not yet defined (depends on first LED that is selected), 1 is selecting, -1 is deselecting (as kind of eraser mode)
  let selectingPath = -1;       // which 'zone' / path we are working with

  let lastDrawn = 0;            // keep track of when drawn
  let drawnRate = 100;          // 'framerate' for drawing LEDs

  let selectmargin = 5;         // in pixels. Avoids loads of checks at the same spot

  let current_point;             // Where are we now and where were we?
  let previous_point;            // where were we?
  let missed_points = [];        // extrapolate points if we move faster than the frame rate

  let WINDOWsize = [];             // size of the canvas
  let LEDspacing;
  let LEDmatrixSize = [0,0];  // size of the LED matrix we are configuring
  let LEDmatrixString = "";  // keep a latest version of the STRING from the database, so we can re-render the matrix when needed.
  let LEDmatrixLength = 0;
  let LEDsize = .8;
  let LEDmatrixName = "unknown";

  let resizeMatrix;       // variable to set timeout to recalc matrix (with delay)

  const triggers = document.getElementById('triggers');

  p.setup = function() {
    WINDOWsize = p.getCanvasSize();
    let canvas = p.createCanvas(WINDOWsize[0], WINDOWsize[1]);
    canvas.id('p5Canvas');
    //canvas.mouseMoved(function(){p.checkLEDhit();}); // attach listener for // activity on canvas only

    current_point = p.createVector(0, 0);

    // testing with one zone and first zone selected
    paths.push([]);   // first path to start with for now
    selectingPath = 0;
  }


  p.getCanvasSize = function (){
    let div = document.getElementById('main');
    return [div.offsetWidth,div.offsetHeight];
  }

  p.draw = function() {

    if (p.millis()-lastDrawn > drawnRate) {
      lastDrawn = p.millis();
      p.drawView();
    }

    current_point.set(p.mouseX, p.mouseY);

    if (selecting > 0){   // only check if we substantially changed position or selecting has been false ( we have released)
      let distance = current_point.dist(previous_point);
      if (current_point.dist(previous_point) > selectmargin) {
        let steps = Math.ceil(distance/selectmargin);

        for(let i = 0; i < steps; i++) missed_points.push(p5.Vector.lerp(previous_point, current_point, (i/steps)));     // extrapolate between current and 
        for (let i = 0; i < missed_points.length; i++) p.selectLEDS(missed_points[i]);


        missed_points = [];
        previous_point = current_point.copy();
      }
    }
  }

  /* Checking the input on every few pixel moves was jittery when drawing every frame. Now, we only draw the changes */

  p.drawView = function(){
    p.background(200);
    p.fill(0);
    p.noStroke();

    for (let i = 0; i < LEDS.length; i++) LEDS[i].display();    // Draw all LEDs
  }

  p.selectLEDS = function(position){
    for (let i = 0; i < LEDS.length; i++) {
      if (LEDS[i].select(position)){        // returns boolean if found

        let ledIsAt = paths[selectingPath].indexOf(i); // returns -1 if not found

        if (ledIsAt > -1 && selectingmode <= 0) {   // we already have it, so we will delete it
          selectingmode = -1;
          paths[selectingPath].splice(ledIsAt, 1);
          LEDS[i].highlighting(false);
        } else if (ledIsAt == -1 && selectingmode >= 0){              // we don't have it, so add it and go in adding mode
          selectingmode = 1;
          paths[selectingPath].push(i);
          LEDS[i].highlighting(true);
        }
        //return true;  // break the loop if found
      }
    }
    return false;
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

  p.updateMatrix = function(matrixref = LEDmatrixName, new_size = LEDmatrixSize, new_string = LEDmatrixString, new_window = false){    // default values if undefined: [], "", boolean
    let new_array = new_string.match(/.{1,6}/g);
    // if we get new metrics (e.g. the first time)
    if (new_size[0] != LEDmatrixSize[0] || new_size[1] != LEDmatrixSize[1] /* matrix dimensions changed */
      || new_array.length != LEDmatrixLength             /* number of LEDs changed, though new_size should then also flag*/
      || new_window  /* window is resized, easier to recalc instead of adjust positions */
    ){
      LEDmatrixName = matrixref;
      LEDmatrixSize = new_size;
      LEDmatrixString = new_string;
      LEDmatrixLength = LEDmatrixSize[0] * LEDmatrixSize[1];
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
    } else {
      console.log(new_string);
      if (new_string.localeCompare(LEDmatrixString) != 0){      // only the colours changed! Update colour of LEDs
        LEDmatrixString = new_string;
        for (let i = 0; i < LEDmatrixLength-1; i++){
          LEDS[i].updateColor(new_array[i]);
        }
      }
    }
  }

  p.windowResized = function(){
    // wait 1 second for any windowsize changes (by overriding any ongoing windowchanges)
    window.clearTimeout(resizeMatrix);
    resizeMatrix = window.setTimeout(function(){
      p.updateMatrix(LEDmatrixName, LEDmatrixSize, LEDmatrixString, true);
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
    selecting = p.millis();

    current_point.x = p.mouseX;
    current_point.y =  p.mouseY;   // Grab mouse position
    previous_point = current_point.copy();

    p.selectLEDS(current_point);
  }

  p.checkLEDhit = function(){
    current_point.set(p.mouseX, p.mouseY);

    if (selecting > 0){   // only check if we substantially changed position or selecting has been false ( we have released)
      let distance = current_point.dist(previous_point);
      if (current_point.dist(previous_point) > selectmargin) {
        p.selectLEDS(current_point);
        previous_point = current_point.copy();
      }
    }
  }

  p.screenReleased = function() {
    if (selecting) {
      // for (let i = 0; i < drawingsize; i++){
      //     p.selectLEDS(drawingpath[i]);   // see if the coordinates are on a LED (assuming only 1 led can be selected ever and add it
      // }

      //
      // if (paths[paths.length - 1].particles.length < 5) {    // if the drawing has less than 4 points, we assume click (configure) instead of draw
      //   paths.splice([paths.length - 1], 1);                 // remove recently added path
      //
      //   if (paths.length > 0) {                              // if there are paths, configure clicked area (if clicked in area)
      //     let gotIt = -1;
      //     let point = p.relativeToMatrix(p.createVector(p.mouseX, p.mouseY));
      //
      //     for (let i = paths.length - 1; i > -1; i--) {       // work backwards through all areas (so the ones on top are checked first)
      //       if (paths[i].contains(point) && !gotIt > -1) {    // check if the click point is within the path, and only act upon the zone 'on top'
      //         gotIt = i;
      //         p.highlightLedsInPath(paths[i]);                // highlight zone and it's LED's
      //       }
      //     }
      //
      //     if (gotIt > -1) {                         // yes, clicked on an existing area
      //       p.highlightPaths(gotIt);                // (pathID) highlight this path, de-emphasize others
      //       p.highlightLedsInPath(paths[gotIt]);    // highlight the LEDS in this path
      //     } else {                                  // we clicked away from any zones!
      //
      //     }
      //   }
      //
      // } else {

      // let foundLEDs = false;
      // foundLEDs = p.highlightLedsInPath(paths[paths.length-1]); // highlight zone and it's LED's, returns false if none is found
      // if (!foundLEDs) {   // if the path is not drawn on some LEDS, remove it
      //   paths.splice([paths.length - 1], 1);
      //   p.highlightLedsInPath();  // leave empty = turn all LEDS on again.
      // }
      // }

      // reset modes

      selecting = 0;
      selectingmode = 0;

      p.updateFirebase();

    }
  }

  p.updateLEDstring = function(){
    let stringArray = [];
    for (let i = 0; i < LEDS.length; i++) {
      stringArray.push(LEDS[i].toString());
    }
    //console.log(stringArray.join(""));
  }

  p.updateFirebase = function(){
    p.updateLEDstring();
    //updateMatrixDatabase(LEDmatrixName, LEDmatrixString);
  }
}

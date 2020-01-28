//P5.js sketch

/*

TODOs:

- control drawing to lower performance load


*/

let sketch = function(p) {
  let paths = [],
    LEDS = [],
    interactivity = []; // All the paths (or zones), leds and connected interactivities

  let touch = false; // on setup we check if we work with a mobile device.
  let selecting = 0; // Are we selecting LEDs? (use millis to indicate unique identifyer)
  let previous_selecting = 0; // to see if we have a new click
  let selectingmode = 0; // based on drawmode toggle button
  let selectingPath = [[]]; // selectable zones will be LEDmatrixLength long (adjusting values in an array is more efficient than adding / splicing)

  let lastDrawn = 0; // keep track of when drawn
  let drawnRate = 100; // 'framerate' for drawing LEDs

  let selectmargin = 10; // in pixels. Avoids loads of checks at the same spot. Is calculated as LEDspacing / x (see updateMatrix);

  let current_point; // Where are we now and where were we?
  let previous_point; // where were we?
  let missed_points = []; // extrapolate points if we move faster than the frame rate

  let WINDOWsize = []; // size of the canvas
  let LEDspacing;
  let LEDmatrixSize = [0, 0]; // size of the LED matrix we are configuring
  let LEDmatrixString = ""; // keep a latest version of the STRING from the database, so we can re-render the matrix when needed.
  let LEDmatrixLength = 0;
  let LEDsize = 0.8;
  let LEDmatrixName = "unknown";

  let resizeMatrix; // variable to set timeout to recalc matrix (with delay)

  let triggers, drawcolor, testmode, zonesmode, updatemode, drawmode = []; // UI listeners

  p.setup = function() {
    WINDOWsize = p.getCanvasSize();
    let canvas = p.createCanvas(WINDOWsize[0], WINDOWsize[1]);
    canvas.id("p5Canvas");

    current_point = p.createVector(0, 0);

    // testing with one zone and first zone selected
    paths.push([]); // first path to start with for now
    selectingPath = 0;

    touch = isMobileDevice(); // function in the iotcanvas.js
    console.log("touchmode: " + touch);

    p.attachUI();
  };

  p.draw = function() {
    if (p.millis() - lastDrawn > drawnRate) {
      lastDrawn = p.millis();
      p.drawView();
    }

    if (selecting > 0) {
      current_point.set(p.mouseX, p.mouseY);
      let distance = current_point.dist(previous_point);
      if (distance > selectmargin) {
        // only check if we substantially changed position or selecting has been false ( we have released)

        let steps = Math.ceil(distance / selectmargin);
        for (let i = 0; i < steps; i++) {
          p.checkLEDhit(
            p5.Vector.lerp(previous_point, current_point, i / steps)
          ); // extrapolate between current and previous points to ensure we get all possible led's hit
        }

        previous_point = current_point.copy();
      }
    }
  };

  /* Checking the input on every few pixel moves was jittery when drawing every frame. Now, we only draw the changes */

  p.drawView = function() {
    p.background(200);
    p.fill(0);
    p.noStroke();

    for (let i = 0; i < LEDS.length; i++) LEDS[i].display(); // Draw all LEDs with their default color;
  };

  p.mousePressed = function() {
    if (!touch) p.screenPressed();
  };
  p.touchStarted = function() {
    p.screenPressed();
  };

  p.mouseReleased = function() {
    if (!touch) p.screenReleased();
    return false;
  };

  p.touchEnded = function() {
    p.screenReleased();
  };

  p.relativeToMatrix = function(position) {
    let rel_x = (position.x - WINDOWsize[0] / 2 - LEDspacing / 2) / LEDspacing;
    let rel_y = (position.y - WINDOWsize[1] / 2 - LEDspacing / 2) / LEDspacing;
    return p.createVector(rel_x, rel_y);
  };

  p.relativeToView = function(position) {
    // margin is overridden for LEDs
    let rel_x = position.x * LEDspacing + WINDOWsize[0] / 2 + LEDspacing / 2;
    let rel_y = position.y * LEDspacing + WINDOWsize[1] / 2 + LEDspacing / 2;
    return p.createVector(rel_x, rel_y);
  };

  p.windowResized = function() {
    // wait 1 second for any windowsize changes (by overriding any ongoing windowchanges)
    window.clearTimeout(resizeMatrix);
    resizeMatrix = window.setTimeout(function() {
      p.updateMatrix(LEDmatrixName, LEDmatrixSize, LEDmatrixString, true);
    }, 500);
  };

  p.getCanvasSize = function() {
    let div = document.getElementById("main");
    return [div.offsetWidth, div.offsetHeight];
  };

  p.attachUI = function() {
    //triggers = document.getElementById("triggers");
    drawcolor = document.getElementById("drawcolor");
    testmode = document.getElementById("testmode");
    zonesmode = document.getElementById("zonesmode");
    updatemode = document.getElementById("updatemode");

    drawmode[0] = document.getElementById("switch-toggle-add");
    drawmode[1] = document.getElementById("switch-toggle-remove");
    drawmode[2] = document.getElementById("switch-toggle-color");

    selectingcolor = drawcolor.value; // set the first time;
    selectingmode = 0;
    //testmode = testmode.checked;
    //zonesmode = zonesmode.options[zonesmode.selectedIndex].value;

    drawmode[0].addEventListener("change", () => {
      if (drawmode[0].checked) selectingmode = 0;
    });
    drawmode[1].addEventListener("change", () => {
      if (drawmode[1].checked) selectingmode = 1;
    });
    drawmode[2].addEventListener("change", () => {
      if (drawmode[2].checked) selectingmode = 2;
    });
    drawcolor.addEventListener("input", () => {
      selectingcolor = drawcolor.value;
      let pathValue = zonesmode.options[zonesmode.selectedIndex].value;
      for(let i = 0; i < paths[pathValue].length; i++){

        LEDS[selectedLED].highlighting(true);
      }

    });
    testmode.addEventListener("change", () => {
      // change to realtime database data here!
    });
    zonesmode.addEventListener("change", () => {
      // change to selecting zones here!
      console.log("zone: " + zonesmode.options[zonesmode.selectedIndex].value + " is selected");
    });
    updatemode.addEventListener("click", () => {
      let pathValue = zonesmode.options[zonesmode.selectedIndex].value;
      console.log("Current selected path is " + pathValue + ", data:")
      console.log(paths[pathValue]);
    });
  };

  // create a new element for in the DOM - I am not checking for duplicates at the moment
  p.createTrigger = function(name, id) {
    let toggle = document.createElement("li");
    let input = document.createElement("INPUT");
    input.setAttribute("type", "checkbox");
    input.name = name;
    input.value = id;
    let label = document.createElement("LABEL");
    label.htmlFor = name;
    let innerLabel = document.createTextNode(name);
    label.appendChild(innerLabel);
    toggle.appendChild(input);
    toggle.appendChild(label);

    let list = document.getElementById("triggers");
    list.appendChild(toggle);

    input.addEventListener("change", () => {
      for (let i = 0; i < interactivity.length; i++) {
        if (interactivity[i].id == input.value) {
          interactivity[i].active = input.checked;

          for (let q = 0; q < LEDS.length; q++) {
            LEDS[i].updateTrigger(interactivity[i].id, interactivity[i].active);
          }
        }
      }
    });
  };

  p.screenPressed = function() {
    selecting = p.millis();

    current_point.x = p.mouseX;
    current_point.y = p.mouseY; // Grab mouse position
    previous_point = current_point.copy();

    p.checkLEDhit(current_point);
  };

  p.checkLEDhit = function(clicked) {
    let point = p.relativeToMatrix(clicked);
    let x = Math.round(point.x + LEDmatrixSize[0] / 2);
    let y = Math.round(point.y + LEDmatrixSize[1] / 2);
    if (x >= 0 && x < LEDmatrixSize[0] && y >= 0 && y < LEDmatrixSize[1]) {
      // we are within the grid! this should result in one possible anwer due to our rounding
      let selectedLED;
      if (x % 2) selectedLED = x * LEDmatrixSize[1] + LEDmatrixSize[1] - y - 1;
      // = 1, so we are in even row (0, 1, 2, 3, 4, etc..)
      else selectedLED = x * LEDmatrixSize[1] + y; // = 0, so we are in an uneven row.

      if (selectingmode) {
        paths[selectingPath][selectedLED] = 1;
        LEDS[selectedLED].updateColorHex(selectingcolor);
        LEDS[selectedLED].highlighting(true);
      } else {
        paths[selectingPath][selectedLED] = 0;
        LEDS[selectedLED].highlighting(false);
      }
    }
  };

  p.screenReleased = function() {
    if (selecting > 0) {
      selecting = 0;
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

      p.updateFirebase();
    }
  };

  p.updateLEDstring = function() {
    let stringArray = [];
    for (let i = 0; i < LEDS.length; i++) {
      stringArray.push(LEDS[i].toString());
    }
    //console.log(stringArray.join(""));
  };

  p.updateFirebase = function() {
    p.updateLEDstring();
    //updateMatrixDatabase(LEDmatrixName, LEDmatrixString);
  };

  p.updateMatrix = function(
    matrixref = LEDmatrixName,
    new_size = LEDmatrixSize,
    new_string = LEDmatrixString,
    new_window = false
  ) {
    // default values if undefined: [], "", boolean
    let new_array = new_string.match(/.{1,6}/g);
    // if we get new metrics (e.g. the first time)
    if (
      new_size[0] != LEDmatrixSize[0] ||
      new_size[1] != LEDmatrixSize[1] /* matrix dimensions changed */ ||
      new_array.length !=
        LEDmatrixLength /* number of LEDs changed, though new_size should then also flag*/ ||
      new_window /* window is resized, easier to recalc instead of adjust positions */
    ) {
      LEDmatrixName = matrixref;
      LEDmatrixSize = new_size;
      LEDmatrixString = new_string;
      LEDmatrixLength = LEDmatrixSize[0] * LEDmatrixSize[1];
      WINDOWsize = p.getCanvasSize();
      LEDspacing = p.min(
        WINDOWsize[0] / (LEDmatrixSize[0] + 2),
        WINDOWsize[1] / (LEDmatrixSize[1] + 2)
      );

      // fill our temporary selecting Array! TODO make this dynamic!
      paths[0] = new Array(LEDmatrixLength);
      for (let i = 0; i < LEDmatrixLength; i++) paths[0][i] = 0;

      selectmargin = Math.ceil(LEDspacing / 4); // through trial and error, this seems to get the most promising results (almost never misses a LED if touched)

      p.resizeCanvas(WINDOWsize[0], WINDOWsize[1]);

      let topleft_x =
        WINDOWsize[0] / 2 -
        (LEDmatrixSize[0] * LEDspacing) / 2 +
        LEDspacing / 2;
      let topleft_y =
        WINDOWsize[1] / 2 -
        (LEDmatrixSize[1] * LEDspacing) / 2 +
        LEDspacing / 2;

      LEDS = []; // empty array, then create a new one based on this data
      let iterator = 0;
      for (let x = 0; x < LEDmatrixSize[0]; x++) {
        for (let y = 0; y < LEDmatrixSize[1]; y++) {
          LEDS.push(
            new LED(
              x - LEDmatrixSize[0] / 2,
              y - LEDmatrixSize[1] / 2,
              new_array[iterator],
              LEDsize,
              LEDspacing,
              p
            )
          );
          iterator++;
        }
        x++;
        if (x < LEDmatrixSize[0]) {
          for (let y = LEDmatrixSize[1] - 1; y >= 0; y--) {
            LEDS.push(
              new LED(
                x - LEDmatrixSize[0] / 2,
                y - LEDmatrixSize[1] / 2,
                new_array[iterator],
                LEDsize,
                LEDspacing,
                p
              )
            );
            iterator++;
          }
        }
      }
    } else {
      console.log(new_string);
      if (new_string.localeCompare(LEDmatrixString) != 0) {
        // only the colours changed! Update colour of LEDs
        LEDmatrixString = new_string;
        for (let i = 0; i < LEDmatrixLength - 1; i++) {
          LEDS[i].updateColor(new_array[i]);
        }
      }
    }
  };
};

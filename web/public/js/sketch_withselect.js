//P5.js sketch

/*

TODOs:

- control drawing to lower performance load


*/

let sketch = function(p) {
  let paths = [],
    colors = [],
    triggers = [],
    LEDS = []; // All the paths (or zones), leds etc

  let touch = false; // on setup we check if we work with a mobile device.
  let selecting = 0; // Are we selecting LEDs? (use millis to indicate unique identifyer)
  let selectingcolor = "#000000";
  let previous_selecting = 0; // to see if we have a new click
  let selectingmode = 0; // based on drawmode toggle button
  let selectingPath = 0; // selectable zones will be LEDmatrixLength long (adjusting values in an array is more efficient than adding / splicing)
  let currentPath = -1; // the path / zone we are currently working with.

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

  let ZONES = {}; // will store all zones and triggers - if any;

  let resizeMatrix; // variable to set timeout to recalc matrix (with delay)

  let totalzonesTEXT,
    zonesmodeSELECT,
    zoneselectorBLOCK,
    noZonesBLOCK,
    addZoneBUTTON,
    updatemodeBUTTON,
    editorBLOCK,
    addLEDRADIO,
    removeLEDRADIO,
    selectallBUTTON,
    deselectallBUTTON,
    ifthisSELECT,
    drawcolorCOLORPICKER,
    statusTEXT; // all DOM elements and listeners

  p.setup = function() {
    WINDOWsize = p.getCanvasSize();
    let canvas = p.createCanvas(WINDOWsize[0], WINDOWsize[1]);
    canvas.id("p5Canvas");

    current_point = p.createVector(0, 0);

    // testing with one zone and first zone selected
    //paths.push([]); // first path to start with for now

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
    p.background(211);
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
    totalzonesTEXT = document.getElementById("totalzones");
    zonesmodeSELECT = document.getElementById("zonesmode");
    zoneselectorBLOCK = document.getElementById("zoneselector");
    noZonesBLOCK = document.getElementById("noZones");
    addZoneBUTTON = document.getElementById("addZone");
    updatemodeBUTTON = document.getElementById("updatemode");
    editorBLOCK = document.getElementById("editor");
    addLEDRADIO = document.getElementById("addLED");
    removeLEDRADIO = document.getElementById("removeLED");
    selectallBUTTON = document.getElementById("selectall");
    deselectallBUTTON = document.getElementById("deselectall");
    ifthisSELECT = document.getElementById("ifthis");
    drawcolorCOLORPICKER = document.getElementById("drawcolor");
    statusTEXT = document.getElementById("status");

    selectingmode = 0;
    zoneselectorBLOCK.style.display = "none";
    noZonesBLOCK.style.display = "none";
    editorBLOCK.style.display = "none";
    statusTEXT.innerHTML = "LOADING";

    zonesmodeSELECT.addEventListener("change", () => {
      // change to selecting zones here!
      currentPath =
        zonesmodeSELECT.options[zonesmodeSELECT.selectedIndex].value;
      if (currentPath > -1) {
        editorBLOCK.style.display = "inherit";
        statusTEXT.innerHTML = "ZONE " + currentPath;
        ifthisSELECT.value = triggers[currentPath];
        drawcolorCOLORPICKER.value = colors[currentPath];
      } else {
        editorBLOCK.style.display = "none";
        statusTEXT.innerHTML = "ALL ZONES";
      }
      p.renderZone(currentPath);
    });

    addZoneBUTTON.addEventListener("click", () => {
      console.log("Add a zone!");
      let lastZone = -1;
      for (let zone in ZONES) {
        lastZone = parseInt(zone);
      }
      lastZone++;

      // fill our temporary selecting Array! TODO make this dynamic!
      paths[lastZone] = new Array(LEDmatrixLength);
      for (let i = 0; i < LEDmatrixLength; i++) paths[lastZone][i] = 0;

      ZONES[lastZone] = {
        LEDS: paths[lastZone].join(""),
        color: "#000000",
        trigger: "nothing"
      };

      let updatefield = "/zones/" + lastZone + "/";

      updateMatrix(LEDmatrixName, { [updatefield]: ZONES[lastZone] });

      paths.push([...ZONES[lastZone].LEDS]); // assuming we have zone 0, 1, 2 etc...
      colors.push(ZONES[lastZone].color);
      triggers.push(ZONES[lastZone].trigger);
      let opt = document.createElement("option");
      opt.appendChild(document.createTextNode(lastZone));
      opt.value = lastZone;
      zonesmodeSELECT.appendChild(opt);
      zonesmodeSELECT.value = lastZone;

    });
    updatemodeBUTTON.addEventListener("click", () => {
      p.updateFirebase();
      console.log("Update Database!");
    });
    addLEDRADIO.addEventListener("change", () => {
      console.log("Draw mode ADD");
      selectingmode = 0;
    });
    removeLEDRADIO.addEventListener("change", () => {
      console.log("Draw mode REMOVE");
      selectingmode = 1;
    });
    selectallBUTTON.addEventListener("click", () => {
      console.log("add all LEDS!");
    });
    deselectallBUTTON.addEventListener("click", () => {
      console.log("remove all LEDS!");
    });
    ifthisSELECT.addEventListener("change", () => {
      // change to selecting zones here!
      let chosenTrigger =
        ifthisSELECT.options[ifthisSELECT.selectedIndex].value;
      console.log("chosen trigger = " + chosenTrigger);
    });
    drawcolorCOLORPICKER.addEventListener("input", () => {
      selectingcolor = drawcolor.value;
      colors[currentPath] = selectingcolor;
      if (currentPath > -1) {
        for (let i = 0; i < paths[currentPath].length; i++) {
          if (paths[currentPath][i] == 1) {
            LEDS[i].updateColorHex(selectingcolor);
          }
        }
      }
    });
  };

  p.screenPressed = function() {
    if (currentPath > -1) {
      selecting = p.millis();

      current_point.x = p.mouseX;
      current_point.y = p.mouseY; // Grab mouse position
      previous_point = current_point.copy();

      p.checkLEDhit(current_point);
    }
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

      if (selectingmode == 0) {
        paths[currentPath][selectedLED] = 1;
        LEDS[selectedLED].updateColorHex(selectingcolor);
        LEDS[selectedLED].highlighting(true);
      } else if (selectingmode == 1) {
        paths[currentPath][selectedLED] = 0;
        LEDS[selectedLED].highlighting(false);
      }
    }
  };

  p.screenReleased = function() {
    if (selecting > 0) {
      selecting = 0;
    }
  };

  p.updateLEDstring = function() {
    let stringArray = [];
    for (let i = 0; i < LEDS.length; i++) {
      stringArray.push(LEDS[i].toString());
    }
    LEDmatrixString = stringArray.join("");
    //console.log(stringArray.join(""));
  };

  p.updateFirebase = function() {
    //p.updateLEDstring();
    //updateMatrixDatabase(LEDmatrixName, LEDmatrixString);
    let updates = {};
    for(let i = 0; i < paths.length; i++){
      ZONES[i].LEDS = paths[i].join("");
      ZONES[i].color = colors[i];
      ZONES[i].trigger = triggers[i];
      updates["/zones/" + i + "/"] = ZONES[i];
    }

    p.renderZone(-1);
    p.updateLEDstring();
    updates["/LED/"] = LEDmatrixString;
    updates["/updated/"] = moment().unix();
    updateMatrix(LEDmatrixName, updates);
  };

  p.renderZone = function(chosenZone) {
    if (chosenZone == -1) {
      let totalpaths = paths.length;
      for (let i = 0; i < LEDmatrixLength; i++) {
        let mixcolor = [];
        for (let i2 = 0; i2 < totalpaths; i2++) {
          if (paths[i2][i] == 1) mixcolor.push(colors[i2]);
        }
        let mixlength = mixcolor.length;
        if (mixlength == 0) {
          LEDS[i].highlighting(false);
        } else if (mixlength == 1) {
          LEDS[i].updateColorHex(mixcolor[0]);
          LEDS[i].highlighting(true);
        } else {
          let r = 0,
            g = 0,
            b = 0;

          for (let i3 = 0; i3 < mixlength; i3++) {
            // start at 1, skip the #
            r =
              r +
              p.decodeNibble(mixcolor[i3].charCodeAt(1)) * 16 +
              p.decodeNibble(mixcolor[i3].charCodeAt(2));
            g =
              g +
              p.decodeNibble(mixcolor[i3].charCodeAt(3)) * 16 +
              p.decodeNibble(mixcolor[i3].charCodeAt(4));
            b =
              b +
              p.decodeNibble(mixcolor[i3].charCodeAt(5)) * 16 +
              p.decodeNibble(mixcolor[i3].charCodeAt(6));
          }
          r = parseInt(r / mixlength);
          b = parseInt(b / mixlength);
          g = parseInt(g / mixlength);
          let result = '#' + fullColorHex(r, g, b);
          LEDS[i].updateColorHex(result);

          LEDS[i].highlighting(true);
        }
      }
    } else {
      for (let i = 0; i < LEDmatrixLength; i++) {
        if (paths[chosenZone][i] == 1) {
          LEDS[i].updateColorHex(colors[chosenZone]);
          LEDS[i].highlighting(true);
        } else {
          LEDS[i].highlighting(false);
        }
      }
    }
  };

  p.decodeNibble = function(value) {
    if (value >= 48 && value <= 57) return value - 48;
    if (value >= 65 && value <= 90) return value - 65;
    if (value >= 97 && value <= 122) return value - 97;
    return -1;
  };

  p.updateUI = function() {
    let totalzones = paths.length;
    totalzonesTEXT.innerHTML = totalzones;

    zoneselectorBLOCK.style.display = "inherit";
    noZonesBLOCK.style.display = "none";

    for (let i = -1; i < totalzones; i++) {
      let opt = document.createElement("option");
      if (i == -1) {
        opt.appendChild(document.createTextNode("show all"));
        opt.value = -1;
      } else {
        opt.appendChild(document.createTextNode(i));
        opt.value = i;
      }
      zonesmodeSELECT.appendChild(opt);
    }

    zonesmodeSELECT.value = -1;
    editorBLOCK.style.display = "none";
    statusTEXT.innerHTML = "ALL ZONES";
    p.renderZone(currentPath);
  };

  p.updateZones = function(zonesData) {
    if (typeof zonesData != "undefined") {
      ZONES = { ...zonesData }; //copy the data for local keepin
      paths = [];
      colors = [];
      triggers = [];

      let zonecount = -1;
      for (let property in ZONES) {
        zonecount++;
        paths.push([...ZONES[property].LEDS]); // assuming we have zone 0, 1, 2 etc...
        colors.push(ZONES[property].color);
        triggers.push(ZONES[property].trigger);
      }
      if (zonecount > -1) {
        p.updateUI();
      }
    } else {
      console.log("zones data is empty - assuming no zones stored");
      totalzonesTEXT.innerHTML = 0;
      zoneselectorBLOCK.style.display = "none";
      noZonesBLOCK.style.display = "inherit";
    }
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

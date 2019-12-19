let sketch = function(p) {

  // All the paths
  let paths = [];
  let LEDS = [];
  // Are we painting?
  let painting = false;
  // How long until the next circle
  let next = 500;
  // Where are we now and where were we?
  let current;
  // Size of the canvas
  let size = [600, 400];
  // Size of a popup
  let popupSize;
  // spacing between LEDs
  let spacing = 50;
  // header and footer space
  let header = 80;
  // modes: 0 (idle), 1 (drawing), 2 (configuring), 3 (test)
  let mode = 0;
  let modeT = ["IDLE", "DRAW", "CONFIGURE", "TEST"];
  // list of set interactivity
  let interactivity = [];
  let selectAction;


  p.setup = function() {
    popupSize = [Math.round(size[0]*0.9), Math.round(size[1]*0.9)];
    p.createCanvas(size[0], size[1] + header);
    current = p.createVector(0, 0);


    //header
    button2 = p.createButton('mode');
    button2.position(20, 20);
    button2.mousePressed(p.increaseMode);

    selectAction = p.createSelect();
    selectAction.changed(p.executeInteract);
    selectAction.position(250, 20);
    selectAction.hide();
    button3 = p.createButton('execute');
    button3.position(150, 20);
    button3.mousePressed(p.triggerInteractivity);
    button3.hide();

    //create all LEDs
    let border = [size[0] % spacing, size[1] % spacing];
    if (border[0] == 0) border[0] = spacing / 2;
    if (border[1] == 0) border[1] = spacing / 2;
    for (let y = border[1]; y < size[1]; y += spacing) {
      for (let x = border[0]; x < size[0]; x += spacing) {
        LEDS.push(new LED(x, y + header));
      }
    }



  }

  p.increaseMode = function() {
    mode = (mode + 1) % modeT.length;
    if (mode == 3) {
      selectAction.show();
      button3.show();
    } else {
      selectAction.hide();
      button3.hide();
    }
  }

  p.executeInteract = function() {

    // do something
  }


  p.draw = function() {
    p.background(200);
    p.fill(0);
    p.noStroke();

    p.text(modeT[mode], 100, 32);


    // If it's time for a new point
    if (p.millis() > next && painting) {

      // Grab mouse position
      current.x = p.mouseX;
      current.y = p.mouseY;

      // Add new particle
      paths[paths.length - 1].add(current);
    }

    // Draw all paths
    if (mode == 1 || mode == 2) {
      for (let i = 0; i < paths.length; i++) {
        paths[i].display();
      }
    }
    // Draw all LEDs
    for (let i = 0; i < LEDS.length; i++) {
      LEDS[i].display();
    }

  }

  // Start it up
  p.mousePressed = function() {
    if (mode == 1 && p.mouseY > header) {
      painting = true;
      paths.push(new Path(paths.length));
    } else if (mode == 2 && p.mouseY > header && p.mouseY < (header + size[1]) && paths.length > 0) {
      let gotIt = -1;
      for (let i = paths.length - 1; i > -1; i--) {
        let point = p.createVector(p.mouseX, p.mouseY);
        if (paths[i].contains(point)) {
          gotIt = i;
          break;
        }
      }
      if (gotIt > -1) {
        let interactInput = prompt("key", "");
        if (interactInput == null || interactInput == "") {
          console.log("User cancelled the prompt.");
        } else {
          let colorInput = prompt("color", "");
          if (colorInput == null || colorInput == "") {
            console.log("User cancelled the prompt.");
          } else {
            // add this 'link' to the list of interactivity options

            interactivity.push({
              'id': gotIt,
              'key': interactInput,
              'color': colorInput,
              'active' :false,
            });

            paths[gotIt].interactivity++;
            selectAction.option(interactInput);
          }
        }
      }
    }

  }

  p.triggerInteractivity = function(){
    let key = selectAction.value();
    for (let i = 0; i < interactivity.length; i++){
      if (interactivity[i].key == key){
        interactivity[i].active = !interactivity[i].active;

        // now let's find all the LED's that are linked with this id
        for (let q = 0; q < LEDS.length; q++){
          if (LEDS[q].areas.length > 0){
            for (let w = 0; w < LEDS[q].areas.length; w++){
              if (LEDS[q].areas[w] == interactivity[i].id){
                if (interactivity[i].active) LEDS[q].color = interactivity[i].color;    // ideally we average out the color intended to be displayed
                else LEDS[q].color = 'white';
              }
            }
          }
        }
      }
    }
  }

  p.mouseReleased = function() {

    if (painting) {
      // close shape if more than 5 points
      let length = paths[paths.length - 1].particles.length;
      if (length < 5) {
        paths.splice([paths.length - 1], 1);
      } else {
        paths[paths.length - 1].finishShape();
        for (let i = 0; i < LEDS.length; i++) {
          LEDS[i].contains(paths[paths.length - 1]);
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
      // Add a new particle with a position
      this.particles.push(new Particle(position));
    }

    // close the path
    finishShape() {
      this.finished = true;
    }

    // Display plath
    display() {
      if (!this.finished) {
        // Loop through backwards
        for (let i = this.particles.length - 1; i >= 0; i--) {
          this.particles[i].display(this.particles[i + 1]);
        }
      } else {
        p.fill(255, 100);
        p.stroke(0, 100);
        let averagePos = [0, 0];
        p.beginShape();
        for (let i = this.particles.length - 1; i >= 0; i--) {
          p.vertex(this.particles[i].position.x, this.particles[i].position.y);
          averagePos[0] += this.particles[i].position.x;
          averagePos[1] += this.particles[i].position.y;
        }
        p.endShape(p.CLOSE);
        averagePos[0] = averagePos[0] / this.particles.length;
        averagePos[1] = averagePos[1] / this.particles.length;
        p.textAlign(p.CENTER);
        p.noStroke();
        p.fill(255);

        p.text(this.interactivity, averagePos[0], averagePos[1]);
        p.textAlign(p.LEFT);
      }
    }

    // based on https://stackoverflow.com/a/8721483/7053198
    contains(point) {
      let i, j, result = false;
      for (i = 0, j = this.particles.length - 1; i < this.particles.length; j = i++) {
        if ((this.particles[i].position.y > point.y) != (this.particles[j].position.y > point.y) &&
        (point.x < (this.particles[j].position.x - this.particles[i].position.x) * (point.y - this.particles[i].position.y) / (this.particles[j].position.y - this.particles[i].position.y) + this.particles[i].position.x)) {
          result = !result;
        }
      }
      return result;
    }

  }


  // Particles along the path
  class Particle {
    constructor(position) {
      this.position = p.createVector(position.x, position.y);
    }

    // Draw particle and connect it with a line
    // Draw a line to another
    display(other) {
      p.fill(255, 0);
      p.ellipse(this.position.x, this.position.y, 8, 8);
      // If we need to draw a line
      if (other) {
        p.stroke(0);
        p.line(this.position.x, this.position.y, other.position.x, other.position.y);
      }
    }
  }


  // LED's in view
  class LED {

    constructor(x, y) {
      this.position = p.createVector(x, y);
      this.areas = [];
      this.color = 'white';
    }

    // Draw LED
    display() {
      if (this.on) p.fill(255, 255, 0);
      else p.fill(this.color);
      p.stroke(0);
      p.ellipse(this.position.x, this.position.y, 8, 8);
    }

    // based on https://stackoverflow.com/a/8721483/7053198
    contains(shape) {
      let particleList = shape.particles;
      let i, j, result = false;
      for (i = 0, j = particleList.length - 1; i < particleList.length; j = i++) {
        if ((particleList[i].position.y > this.position.y) != (particleList[j].position.y > this.position.y) &&
        (this.position.x < (particleList[j].position.x - particleList[i].position.x) * (this.position.y - particleList[i].position.y) / (particleList[j].position.y - particleList[i].position.y) + particleList[i].position.x)) {
          result = !result;
        }
      }
      if (result) this.areas.push(shape.id);

    }
  }

};

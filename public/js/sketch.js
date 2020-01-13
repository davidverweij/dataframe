//P5.js sketch
let sketch = function(p){
  // All the paths, leds and connected interactivities
  let paths = [], LEDS = [], interactivity = [];
  // Are we painting?
  let painting = false;
  let paintmargin = 10; //avoids loads of points at the same spot
  // How long until the next circle
  let next = 500;
  // Where are we now and where were we?
  let current_point;
  // Size of the canvas
  let size;
  // spacing between LEDs
  let spacing = 50; // scale is 3 : 1 (one LED has 16.667 spacing)
  // current LED setup for prototyping
  let LEDmatrix = [matrixsize.width, matrixsize.height];

  let selectAction;

  const triggers = document.getElementById('triggers');


  p.setup = function() {
    size = [window.innerWidth, window.innerHeight];
    let canvas = p.createCanvas(size[0], size[1]);
    canvas.id('p5Canvas');
    current_point = p.createVector(0, 0);
    previous_point = p.createVector(0, 0);

    console.log(matrix);

    document.getElementById('p5Canvas').addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, false);

    //create all LEDs
    //let border = [size[0] % spacing, size[1] % spacing];
    //if (border[0] == 0) border[0] = spacing / 2;
    //if (border[1] == 0) border[1] = spacing / 2;
    // for (let y = border[1]; y < size[1]; y += spacing) {
    //   for (let x = border[0]; x < size[0]; x += spacing) {
    //     LEDS.push(new LED(x, y));
    //   }
    // }
    let iterator = 0;
    for (let x = 0; x < LEDmatrix[0]; x++){
      for (let y = 0; y < LEDmatrix[1]; y++){
        let ledX = x*spacing + (size[0] - (LEDmatrix[0]*spacing))/2;
        let ledY = y*spacing + (size[1] - (LEDmatrix[1]*spacing))/2;
        LEDS.push(new LED(ledX, ledY, matrix[iterator]));
        iterator++;
      }
      x++
      if (x < LEDmatrix[0]){
        for (let y = LEDmatrix[1]-1; y >= 0; y--){
          let ledX = x*spacing + (size[0] - (LEDmatrix[0]*spacing))/2;
          let ledY = y*spacing + (size[1] - (LEDmatrix[1]*spacing))/2;
          LEDS.push(new LED(ledX, ledY, matrix[iterator]));
          iterator++;
        }
      }
    }
/*
    for (let y = 0; y < LEDmatrix[1]; y++){
      for (let x = 0; x < LEDmatrix[0]; x++){
        let ledX = x*spacing + (size[0] - (LEDmatrix[0]*spacing))/2;
        let ledY = y*spacing + (size[1] - (LEDmatrix[1]*spacing))/2;
        LEDS.push(new LED(ledX, ledY));
      }
    }
    */
  }

  p.draw = function() {
    p.background(255);
    p.fill(0);
    p.noStroke();



    // If it's time for a new point
    if (painting && p.millis() > next && (p.abs(p.mouseX-current_point.x)>paintmargin || p.abs(p.mouseY-current_point.y)>paintmargin)) {

      // Grab mouse position
      current_point.x = p.mouseX;
      current_point.y = p.mouseY;

      paths[paths.length - 1].add(current_point);


    }

    // Draw all paths
    for (let i = 0; i < paths.length; i++) paths[i].display();
    // Draw all LEDs
    for (let i = 0; i < LEDS.length; i++) LEDS[i].display();

  }

  p.mousePressed = function() {
    // start new drawing
    painting = true;
    paths.push(new Path(paths.length));
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

  p.mouseReleased = function() {

    if (painting) {

      //if the drawing has less than 4 points, we assume click (configure) instead of draw
      if (paths[paths.length - 1].particles.length < 5) {
        paths.splice([paths.length - 1], 1); //remove recently added path

        // if there are path, configure clicked area (if clicked in area)
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
              let colorInput = prompt("color", "");
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
        p.fill(100, 100);
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

    constructor(x, y, rgbmatrix) {
      this.position = p.createVector(x, y);
      this.triggerList = [];
      this.color = p.color('rgba(' + rgbmatrix[0] + ',' + rgbmatrix[1]+','+rgbmatrix[2]+',' +rgbmatrix[3]+ ')');
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

    updateColor(){
      let size = this.triggerList.length;
      let newColor = p.color(0,0,0,0);
      if (size > 0){
        let r = 0, g = 0, b = 0, num = 0; // the colors to 'mix'
        for (let i = 0; i<size; i++){
          if (this.triggerList[i].active){
            num++
            // mixing RGB by sum of squares - following https://sighack.com/post/averaging-rgb-colors-the-right-way
            r += p.pow(p.red(this.triggerList[i].color),2);
            g += p.pow(p.green(this.triggerList[i].color),2);
            b += p.pow(p.blue(this.triggerList[i].color),2);
          }
        }
        if (num!= 0) newColor = p.color(p.sqrt(r/num),p.sqrt(g/num),p.sqrt(b/num),1);
        console.log("updated color to: " + newColor);
      }
      this.color = newColor;
    }

    // Draw LED
    display() {

        p.noStroke();
        p.fill(this.color);
        p.rectMode(p.RADIUS); // Set rectMode to RADIUS
        p.rect(this.position.x, this.position.y, spacing/2*.9, spacing/2*.9, spacing/6);

        p.stroke(0, 100);
        p.ellipse(this.position.x, this.position.y, 2, 2);

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
      return result;
    }

    connect(interactivity){
      this.triggerList.push({'id':interactivity.id, 'color':interactivity.color, 'active':interactivity.active});
    }
  }
}

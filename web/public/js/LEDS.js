
// LED's in view
class LED {

  constructor(x, y, rgbmatrix, size, spacing, p5) {
    this.p = p5;

    this.position = this.p.createVector(x, y);
    this.color = this.p.color('#' + rgbmatrix);
    this.spacing = spacing;
    this.size = size;

    this.highlight = false;   // false is de-emphasize,
    this.triggerList = [];

    this.timestampLastSelect = 0;

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
    this.color = this.p.color('#' + rgbmatrix);
  }

  updateColorHex(hexcolor){
    this.color = this.p.color(hexcolor);
  }

  highlighting(mode) {  // false is dim, true is default
    this.highlight = mode;
  }

  // Draw LED
  display() {
    let p = this.p;
    let windowPos = p.relativeToView(this.position);

    if (this.highlight){
p.strokeWeight(2);
      p.stroke(0);
    } else {
      p.strokeWeight(1);
      p.stroke(255);
    }

    //p.fill(this.color);
    p.noFill();


    p.rectMode(p.CENTER);
    // or do we want a circle?....
    p.rect(windowPos.x, windowPos.y, this.spacing*this.size, this.spacing*this.size, this.spacing/5);

    // p.fill(255);
    // p.noStroke();
    // p.ellipse(windowPos.x, windowPos.y, 4, 4);

  }

  select(position){
    let windowPos = this.p.relativeToView(this.position);
    let distance = this.spacing*this.size/2;
    if (position.x >= windowPos.x - distance && position.x <= windowPos.x + distance){
      if (position.y >= windowPos.y - distance && position.y <= windowPos.y + distance){
        return true;
      }
    }

    return false;
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

  toString(){
    return this.color.toString('#rrggbb').substring(1);
  }

  connect(interactivity){
    this.triggerList.push({'id':interactivity.id, 'color':interactivity.color, 'active':interactivity.active});
  }
}

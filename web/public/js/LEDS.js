// LED's in view
class LED {
  constructor(x, y, rgbmatrix, size, spacing, p5) {
    this.p = p5;

    this.position = this.p.createVector(x, y);
    this.color = this.p.color("#" + rgbmatrix);
    this.multicolor = [];
    this.isMulticolor = false;
    this.spacing = spacing;
    this.size = size;

    this.multicolor = [];

    this.highlight = false; // false is de-emphasize,
    this.triggerList = [];

    this.timestampLastSelect = 0;
  }

  updateTrigger(id, active) {
    console.log(this.triggerList.length);
    if (this.triggerList.length > 0) {
      for (let i = 0; i < this.triggerList.length; i++) {
        if (this.triggerList[i].id == id) {
          //found it
          this.triggerList[i].active = active;
          break;
        }
      }
    }
    this.updateColor();
  }

  updateColor(rgbmatrix) {
    this.updateColorHex("#" + rgbmatrix);
  }

  updateColorHex(hexcolor) {
    let p = this.p;
    this.isMulticolor = false;
    this.color = p.color(hexcolor);
    //this.color.setAlpha((p.lightness(this.color)*2.55));  // gets lightness value (Hue Saturation *Lightness*) -- use to increase transparency for darker colors.
  }

  updateMulticolor(colorarray){    //
    let p = this.p;
    this.multicolor = [];
    for (let i = 0; i < colorarray.length; i++){
      this.multicolor.push(p.color(colorarray[i]));
    }
    this.isMulticolor = true;

  }

  highlighting(mode) {
    // false is dim, true is default
    this.highlight = mode;
  }

  // Draw LED
  display() {
    let p = this.p;
    let windowPos = p.relativeToView(this.position);

    p.rectMode(p.CENTER);
    let size = this.spacing * this.size;
    let radius = this.spacing / 5;

    if (this.highlight) {
      p.strokeWeight(2);
      p.stroke(0);

      if (!this.isMulticolor){
        p.fill(this.color);
        p.rect(windowPos.x, windowPos.y,size, size, radius);
      } else {

        let length = this.multicolor.length;

        // left half
        p.fill(this.multicolor[0]);
        p.rect(windowPos.x - size/4, windowPos.y, size/2, size, radius, 0, 0, radius);
        // right half
        p.fill(this.multicolor[1]);
        p.rect(windowPos.x + size/4, windowPos.y, size/2, size, 0, radius, radius, 0);

        if (length > 3) { // assuming 4
          // add bottom left half
          p.fill(this.multicolor[2]);
          p.rect(windowPos.x - size/4, windowPos.y + size/4, size/2, size/2, 0, 0, 0, radius);
          // right half
          p.fill(this.multicolor[3]);
          p.rect(windowPos.x + size/4, windowPos.y + size/4, size/2, size/2, 0, 0, radius, 0);
        } else if (length == 3){          // assuming 3
          // add middle section
          p.fill(this.multicolor[2]);
          p.rect(windowPos.x, windowPos.y, size/3, size, 0, 0, 0, 0);

        }

        p.strokeWeight(2);
        p.stroke(0);
        p.noFill();

        // or do we want a circle?....
        p.rect(windowPos.x, windowPos.y,size, size, radius);
      }

    } else {
      p.strokeWeight(1);
      p.stroke(255);
      p.noFill();
      p.rectMode(p.CENTER);
      // or do we want a circle?....
      p.rect(
        windowPos.x,
        windowPos.y,
        this.spacing * this.size,
        this.spacing * this.size,
        this.spacing / 5
      );
    }

  }

  select(position) {
    let windowPos = this.p.relativeToView(this.position);
    let distance = (this.spacing * this.size) / 2;
    if (
      position.x >= windowPos.x - distance &&
      position.x <= windowPos.x + distance
    ) {
      if (
        position.y >= windowPos.y - distance &&
        position.y <= windowPos.y + distance
      ) {
        return true;
      }
    }

    return false;
  }

  // based on https://stackoverflow.com/a/8721483/7053198
  contains(shape) {
    let particleList = shape.particles;
    let i,
    j,
    result = false;
    for (i = 0, j = particleList.length - 1; i < particleList.length; j = i++) {
      if (
        particleList[i].y > this.position.y !=
        particleList[j].y > this.position.y &&
        this.position.x <
        ((particleList[j].x - particleList[i].x) *
        (this.position.y - particleList[i].y)) /
        (particleList[j].y - particleList[i].y) +
        particleList[i].x
      ) {
        result = !result;
      }
    }
    return result;
  }

  toString() {
    if (this.highlight) return this.color.toString("#rrggbb").substring(1);
    else return "000000";
  }

  connect(interactivity) {
    this.triggerList.push({
      id: interactivity.id,
      color: interactivity.color,
      active: interactivity.active
    });
  }
}

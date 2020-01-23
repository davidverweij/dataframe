// A Path is a list of particles
class Path {
  constructor(id, p5) {
    this.id = id;
    this.p = p5;

    this.particles = [];
    this.finished = false;
    this.interactivity = 1;
    this.highlight = false;

  }

  add(position) {
    this.particles.push(position);
  }

  // close the path
  finishShape() {
    this.finished = true;
  }

  highlighting(mode) {
    this.highlight = mode;
  }

  // Display plath
  display() {
    let p = this.p;


    if (this.highlight) {
      p.strokeWeight(2);
      p.noFill();
    } else {
      p.strokeWeight(1);
      if (this.finished) p.fill(255, 150);
      else p.noFill();
    }

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

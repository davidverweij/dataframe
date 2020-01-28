let p5sketch; //  global reference to P5js sketch

loadData = function() {
  p5sketch = new p5(sketch, "main");

  let tempMatrix =
    "ff0000551a8bff0000ff0100551a8b551a8bff0000ff0100ff0000ff0000ff0000ff000000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff000000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ffff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff000000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff000000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ffff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff000000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff000000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ffff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff000000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff000000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff0000ff";
  let tempSize = [9, 13];
  p5sketch.updateMatrix("something", tempSize, tempMatrix, false);
};

getMatrixFromDatabase = function() {
  var user = firebase.auth().currentUser;

  return firebase
    .database()
    .ref("users/" + user.uid)
    .once("value")
    .then(function(snapshot) {
      if (snapshot.val() == null) {
        // create new user

        //populate matrix array (just once?)
        let temp = [];
        for (let i = 0; i < 120; i++) temp[i] = [0, 0, 0, 0];
        console.log(JSON.stringify(temp));
      } else {
        return snapshot.val().matrixref;
      }
    })
    .then(function(matrixref) {
      console.log(matrixref);
      if (matrixref != "") {
        // Attach a listener to the Matrix state. This way, we update the database and the webpage and LED matrix should update at similar speeds
        // This is alternative to update the visual on screen and then update the database.

        return firebase
          .database()
          .ref("matrices/" + matrixref)
          .on("value", function(snapshot) {
            let content = snapshot.val();

            p5sketch.updateMatrix(
              matrixref,
              [content.size.width, content.size.height],
              content.LED
            );

            let matrixsize = content.size;
          });
      }
    });
};

updateMatrixDatabase = function(matrixref, newMatrixString) {
  return firebase
    .database()
    .ref("matrices/" + matrixref)
    .update(
      {
        LED: newMatrixString
      },
      function(error) {
        if (error) {
          alert("Data could not be saved." + error);
        } else {
          alert("Data saved successfully.");
        }
      }
    );
};

isMobileDevice = function() {
  return (
    typeof window.orientation !== "undefined" ||
    navigator.userAgent.indexOf("IEMobile") !== -1
  );
};

/*  HELPER FUNCTIONS  */

// convert int (0 - 254) to 2 letter hex (always 2 letters!)
// based on https://campushippo.com/lessons/how-to-convert-rgb-colors-to-hexadecimal-with-javascript-78219fdb
let rgbToHex = function(colorvalue) {
  var hex = Number(colorvalue).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
};

// convert three int values into a 6 letter HEX string
// based on https://campushippo.com/lessons/how-to-convert-rgb-colors-to-hexadecimal-with-javascript-78219fdb
let fullColorHex = function(r, g, b) {
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return red + green + blue;
};

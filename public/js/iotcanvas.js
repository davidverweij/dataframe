

/*
TODO: Convert RGBW to 2 character HEX values, to be stored in the database.

Arduino code:



// RRGGBBRRGGBBRRGGBBRRGGBBRRGGBBRRGGBBRRGGBBRRGGBBRRGGBBRRGGBB



int decodeNibble(char value) {
if (value >= '0' && value <= '9') return value - '0';
if (value >= 'A' && value <= 'Z') return value - 'A';
if (value >= 'a' && value <= 'z') return value - 'a';
return -1;
}

int numLeds = strlen(data) / 6;

for (i = 0; i < numLeds; i++) {
int offset = i * 6;
led[i].r = decodeNibble(data[offset + 0]) * 16 + decodeNibble(data[offset + 1]);
led[i].g = decodeNibble(data[offset + 2]) * 16 + decodeNibble(data[offset + 3]);
led[i].b = decodeNibble(data[offset + 4]) * 16 + decodeNibble(data[offset + 5]);
}

*/

let matrix = [];
let matrixsize = {};

loadData = function(){

  var user = firebase.auth().currentUser;

  return firebase.database().ref('users/' + user.uid).once('value')
  .then(function(snapshot) {
    if (snapshot.val() == null) { // create new user


      //populate matrix array (just once?)
      let temp = [];
      for (let i = 0; i < 120; i++) temp[i] = [0,0,0,0];
      console.log(JSON.stringify(temp));

    } else {
      return snapshot.val().matrixref;
    }
  })
  .then(function(matrixref){
    console.log(matrixref)
    if (matrixref != ""){
      return firebase.database().ref('matrices/' + matrixref).once('value').then(function(snapshot){
        let content = snapshot.val();
        matrixsize = content.size;

        // splits the combined string into 6 character HEX values (which we can directly apply appending a #);
        matrix = content.LED.match(/.{1,6}/g);

        new p5(sketch, 'main');

        //console.log("LED " + data.key + ' will be ' + data.val());
      });


    }
  });
};

/*  HELPER FUNCTIONS  */

// convert int (0 - 254) to 2 letter hex (always 2 letters!)
// based on https://campushippo.com/lessons/how-to-convert-rgb-colors-to-hexadecimal-with-javascript-78219fdb
let rgbToHex = function (colorvalue) {
  var hex = Number(colorvalue).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};

// convert three int values into a 6 letter HEX string
// based on https://campushippo.com/lessons/how-to-convert-rgb-colors-to-hexadecimal-with-javascript-78219fdb
let fullColorHex = function(r,g,b) {
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return red+green+blue;
};


/*
return firebase.database().ref('matrices/tell-degree-stop').set({
LED: temp,
size: {width: 9, height: 13},
}).then(
firebase.database().ref('users/' + user.uid).set({
email: user.email,
matrixref: "tell-degree-stop",
})
).then(function() {return "";});
*/

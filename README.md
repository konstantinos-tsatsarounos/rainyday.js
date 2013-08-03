rainyday.js
===========
A simple script for simulating raindrops falling on a glass surface. Features a clear API to easily control most of the script variables in order to achieve the most realistic effect - either specify the rain intensity and draw a static picture or run it as an animation with collision detection and complete rain physics.

The first step of the approach is to draw the original picture on the HTML5 canvas and applying the blur effect¹. In the next phase a second (transparent) canvas is added to the DOM over the original one in order to emulate the glass surface. Randomly distributed raindrops are then placed on the glass. The effect is improved by having the drops take irregular shapes² as well as a reflection of the original image in the raindrop, based on previously calculated miniatures.

Let's start with the API by going through a simple example (to view the results just run the 'light rain' demo). Have a look at the following code:


var settings = {};
settings.collisions = false;
settings.trail = true;
settings.gravitythreshold = 3;

var rd =  new RainyDay('canvas','forest', settings);
var presets = [];
presets[0] = rd.preset(0, 2, 0.88);
presets[1] = rd.preset(3, 3, 1);
rd.rain(presets, 10);



In the first step we create the settings object (scroll down for details on what options can be used here) which is fairly straight-forward:
- the drop collisions are disabled
- the drop trail is enabled
- gravity works on drops 3px in radius and larger

Afterwards we create the main object of the RainyDay class, passing as parameters:
- glassopacity - the opacity of the glass surface over the original image; defaults to 0.9
- imageblur - blur radius applied to the original image; defaults to 20
- collisions - if true the collisions between drops will be enabled; defaults to true
- gravity - if true the gravity will be enabled; defaults to true
- gravitythreshold - drop size in pixels above which the drops are a subject of the gravityl defaults to 5
- trail - if true moving drops will leave a trail behind; default to true

What follows afterwards is basically the invocation of the rain() method of the main object. Whether the script works in animation or picture mode is decided based on the secong argument, which is the animation speed (in miliseconds). If the value is not provided or <=0 the output will be a static picture. Otherwise an animation thread will be started.

In both cases the final result will strongly depend on the presets passed as the first argument. A preset consists of 3 numbers:
- minimal size of the drop
- base size of the drop
- for picture mode: the amount of drops that follow the preset; in animation mode: the probability of producing a drop following the preset

By using the above code as an example what we're going for is rain drops added every 10ms to the canvas, 88% being size 0-2 and the other 12% size 3. Gravity threshold in settings is set to 3, therefore all the larger drops will have the gravity enabled while the smaller drops will remain in place.

As for the settings object the following attributes can be used:
- minimal size of the drop
- base size of the drop
- for picture mode: the amount of drops that follow the preset; in animation mode: the probability of producing a drop following the preset

The order of the presets in animation mode is important as the probability entered as the 3rd argument is an incremental value.
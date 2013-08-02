var rainyday = { twoPi: Math.PI*2 }; // TODO make a prototype 
this.drops = [];

rainyday.loadsettings = function(settings, image) {
	settings = settings ? settings : {};
	if (settings.glassopacity === undefined) settings.glassopacity = 0.9;
	if (settings.imageblur  === undefined) settings.imageblur = 20;
	if (settings.maxdropsize === undefined) settings.maxdropsize = 13;
	if (settings.collisions === undefined) settings.collisions = true;
	if (settings.gravity === undefined) settings.gravity = true;
	if (settings.acceleration === undefined) settings.acceleration = 9;
	this.settings = settings;
	return settings;
};

rainyday.makeitrain = function(canvasid, sourceid, settings) {
	this.loadsettings(settings);

	// draw & blur the image
	stackBlurImage(sourceid, canvasid, this.settings.imageblur, window.innerWidth, window.innerHeight);

	// prepare miniature for drop fill
	this.prepareMiniatures(sourceid);

	// create glass canvas
	this.prepareGlass(canvasid, this.settings);

	// populate glass with raindrops
	if (true) { // TODO externalize
		setInterval(function() {
			if (Math.random() > 0.88) {
				rainyday.drop(Math.random()*rainyday.glass.width, Math.random()*rainyday.glass.height, 5, rainyday.settings.maxdropsize - 5);			
			} else {
				rainyday.drop(Math.random()*rainyday.glass.width, Math.random()*rainyday.glass.height, 2, 3);	
			}
		}, 200);
	} else {
		for (var i = 0; i < 40; i++) {
			this.drop(Math.random()*this.glass.width, Math.random()*this.glass.height, 5, this.settings.maxdropsize - 5);
		}
		for (var i = 0; i < 225; i++) {
			this.drop(Math.random()*this.glass.width, Math.random()*this.glass.height, 0, 3);
		}
	}
};

rainyday.prepareMiniatures = function(sourceid) { // TODO prepare multiple miniatures
	this.mini = document.createElement('canvas');
	var size = 2 * this.settings.maxdropsize;
	this.width = size;
	this.height = size;

	this.miniContext = this.mini.getContext('2d');
	this.miniContext.translate(size/2, size/2);
	this.miniContext.rotate(Math.PI);

	this.img = document.getElementById(sourceid);
	this.miniContext.drawImage(this.img, -size/2, -size/2, size, size);
};

rainyday.prepareGlass = function(canvasid, settings) {
	this.canvas = document.getElementById(canvasid);
	this.glass = document.createElement('canvas');
	this.glass.width = this.canvas.width;
	this.glass.height = this.canvas.height;
	this.glass.style = this.canvas.style; // TODO doesn't quite work
	this.canvas.parentNode.appendChild(this.glass);
	this.context = this.glass.getContext('2d');
	this.glass.style.opacity = settings.glassopacity;
};

rainyday.drop = function(centerX, centerY, min, base) {
	var drop = {};
	drop.x = centerX;
	drop.y = centerY;
	drop.maxRad = Math.random()*base+min;;
	drop.minRad = 0.78*drop.maxRad;
	drop.rainyday = this;

	this.drawDrop(drop);

	if (this.settings.collisions) {
		// TODO this.drops.add(drop);
	}

	if (this.settings.gravity) {
		if (drop.maxRad > 8) { // TODO
			drop.intid = setInterval(
				(function(self) {
					return function() {
						self.rainyday.context.clearRect(self.x - self.maxRad - 1, self.y - self.maxRad - 1, 2*self.maxRad + 2, 2*self.maxRad + 2);
						if (self.y - self.maxRad > self.rainyday.glass.height) {
							clearInterval(drop.intid);
							return;
						}
						self.y += self.rainyday.settings.acceleration / 5;
						self.rainyday.drawDrop(self);
					}
				})(drop),
				10
			);
		}
	}
};

rainyday.drawDrop = function(drop) {
	var phase = Math.random()*this.twoPi;
	var point;
	var rad, theta;
	var x0,y0;

	this.context.save();
	this.context.beginPath();
	point = this.setLinePoints(10).first;
	theta = phase;
	rad = drop.minRad + point.y*(drop.maxRad - drop.minRad);
	x0 = drop.x + rad*Math.cos(theta);
	y0 = drop.y + rad*Math.sin(theta);
	this.context.lineTo(x0, y0);
	while (point.next != null) {
		point = point.next;
		theta = this.twoPi*point.x + phase;
		rad = drop.minRad + point.y*(drop.maxRad - drop.minRad);
		x0 = drop.x + rad*Math.cos(theta);
		y0 = drop.y + rad*Math.sin(theta);
		this.context.lineTo(x0, y0);
	}
	this.context.stroke();
	
	this.context.clip();
	this.context.drawImage(this.mini, drop.x - drop.maxRad, drop.y - drop.maxRad); // TODO select correct miniature based on the position 
	
	this.context.restore();
};

rainyday.setLinePoints = function(iterations) {
	var pointList = {};
	pointList.first = {x:0, y:1};
	var lastPoint = {x:1, y:1}
	var minY = 1;
	var maxY = 1;
	var point;
	var nextPoint;
	var dx, newX, newY;

	pointList.first.next = lastPoint;
	for (var i = 0; i < iterations; i++) {
		point = pointList.first;
		while (point.next != null) {
			nextPoint = point.next;
			
			dx = nextPoint.x - point.x;
			newX = 0.5*(point.x + nextPoint.x);
			newY = 0.5*(point.y + nextPoint.y);
			newY += dx*(Math.random()*2 - 1);
				
			var newPoint = {x:newX, y:newY};
				
			//min, max
			if (newY < minY) {
				minY = newY;
			} else if (newY > maxY) {
				maxY = newY;
			}
				
			//put between points
			newPoint.next = nextPoint;
			point.next = newPoint;
				
			point = nextPoint;
		}
	}
		
	//normalize to values between 0 and 1
	if (maxY != minY) {
		var normalizeRate = 1/(maxY - minY);
		point = pointList.first;
		while (point != null) {
			point.y = normalizeRate*(point.y - minY);
			point = point.next;
		}
	}
	//unlikely that max = min, but could happen if using zero iterations. In this case, set all points equal to 1.
	else {
		point = pointList.first;
		while (point != null) {
			point.y = 1;
			point = point.next;
		}
	}
		
	return pointList;		
};


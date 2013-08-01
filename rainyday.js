var rainyday = {}; // TODO make a prototype 

rainyday.loadsettings = function(settings, image) {
	settings = settings ? settings : {};
	if (settings.glassopacity === undefined) settings.glassopacity = 0.9;
	if (settings.imageblur  === undefined) settings.imageblur = 20;
	if (settings.maxdropsize === undefined) settings.maxdropsize = 13;
	if (settings.gravity === undefined) settings.gravity = true;
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
	
	this.points = this.setLinePoints(10);
	this.x = this.glass.width/2;
	this.y = 10;
	this.a = 1;
	setInterval(function() {
		rainyday.drop(rainyday.x, rainyday.y, -1, 13);
		rainyday.y = rainyday.y + rainyday.a;
	}, 10);


	if (true) {
		return;
	}
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
	var maxRad = Math.random()*base+min;
	if (min == -1) {
		maxRad = base;
	}

	if (centerY > this.glass.height) {
		centerY = 10;
		this.y = centerY;
	}

	this.a = 1 + Math.floor(centerY / 100);

	var minRad = 0.78*maxRad;
	var phase = Math.random()*Math.PI*2;
	var point;
	var rad, theta;
	var twoPi = 2*Math.PI;
	var x0,y0;

	this.context.clearRect(centerX - 2*maxRad, centerY - 2*maxRad, centerX + 2*maxRad, centerY + 2*maxRad);
		
	//generate the random function that will be used to vary the radius, 9 iterations of subdivision
	//var pointList = this.setLinePoints(10);

	this.context.save();
	this.context.beginPath();
	point = this.points.first;
	theta = phase;
	rad = minRad + point.y*(maxRad - minRad);
	x0 = centerX + rad*Math.cos(theta);
	y0 = centerY + rad*Math.sin(theta);
	this.context.lineTo(x0, y0);
	while (point.next != null) {
		point = point.next;
		theta = twoPi*point.x + phase;
		rad = minRad + point.y*(maxRad - minRad);
		x0 = centerX + rad*Math.cos(theta);
		y0 = centerY + rad*Math.sin(theta);
		this.context.lineTo(x0, y0);
	}
	this.context.stroke();
	
	this.context.clip();
	this.context.drawImage(this.mini, centerX - maxRad, centerY - maxRad); // TODO select correct miniature based on the position 
	
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


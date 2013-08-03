function RainyDay(canvasid, sourceid, settings)
{
	this.canvasid = canvasid;
	this.canvas = document.getElementById(canvasid);

	this.sourceid = sourceid;
	this.img = document.getElementById(sourceid);

	this.settings = this.loadSettings(settings);

	this.prepareBackground();
	this.w = this.canvas.width;
	this.h = this.canvas.height;

	if (this.settings.collisions) {
		this.drops = [];
		for (var i = 0; i < this.w; ++i) {
			this.drops[i] = [];
		}
	}
this
	.prepareMiniatures();
	this.prepareGlass();
}

RainyDay.prototype.loadSettings = function(settings)
{
	settings = settings ? settings : {};
	if (settings.glassopacity === undefined) settings.glassopacity = 0.9;
	if (settings.imageblur  === undefined) settings.imageblur = 20;
	if (settings.maxdropsize === undefined) settings.maxdropsize = 10;
	if (settings.collisions === undefined) settings.collisions = true;
	if (settings.gravity === undefined) settings.gravity = true;
	if (settings.acceleration === undefined) settings.acceleration = 9;
	if (settings.collisions === undefined) settings.collisions = true;
	if (settings.trail === undefined) settings.trail = false;
	return settings;
};

RainyDay.prototype.prepareBackground = function()
{
	// TODO proper size and position
	stackBlurImage(this.sourceid, this.canvasid, this.settings.imageblur, window.innerWidth, window.innerHeight);
};

RainyDay.prototype.prepareMiniatures = function()
{
	this.minis = [];

	// TODO multiple miniatures
	this.minis[0] = document.createElement('canvas');
	var size = 2 * this.settings.maxdropsize;
	this.width = size;
	this.height = size;

	var miniContext = this.minis[0].getContext('2d');
	miniContext.translate(size/2, size/2);
	miniContext.rotate(Math.PI);

	miniContext.drawImage(this.img, -size/2, -size/2, size, size);
};

RainyDay.prototype.prepareGlass = function()
{
	this.glass = document.createElement('canvas');
	this.glass.width = this.canvas.width;
	this.glass.height = this.canvas.height;
	this.glass.style = this.canvas.style; // TODO doesn't quite work
	this.canvas.parentNode.appendChild(this.glass);
	this.context = this.glass.getContext('2d');
	this.glass.style.opacity = this.settings.glassopacity;
};

RainyDay.prototype.pic = function()
{
	for (var i = 0; i < 225; i++) {
		// small drops
		this.putDrop(new Drop(this, Math.random()*this.w, Math.random()*this.h, 2, 3));
	}
	for (var i = 0; i < 40; i++) {
		// larger drops
		this.putDrop(new Drop(this, Math.random()*this.w, Math.random()*this.h, 5, this.settings.maxdropsize - 5));
	}
};

RainyDay.prototype.rain = function(frequency)
{
	this.intid = setInterval(
		(function(self) {
			return function() {
				if (Math.random() > 0.88) {
					self.putDrop(new Drop(self, Math.random()*self.w, Math.random()*self.h, 5, self.settings.maxdropsize - 5));			
				} else {
					self.putDrop(new Drop(self, Math.random()*self.w, Math.random()*self.h, 0, 3));	
				}
			}
		})(this),
		frequency === undefined ? 100 : frequency
	);
};

RainyDay.prototype.putDrop = function(drop)
{
	drop.draw();
	if (this.settings.collisions) {
		this.drops[drop.x].push(drop);
	}
	if (this.settings.gravity) {
		if (drop.r1 > 7) { // TODO
			drop.animate(this.w);
		}
	}
};

RainyDay.prototype.getLinepoints = function(iterations)
{
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
	} else {
		point = pointList.first;
		while (point != null) {
			point.y = 1;
			point = point.next;
		}
	}

	return pointList;		
};

function Drop(rainyday, centerX, centerY, min, base)
{
	this.x = Math.floor(centerX);
	this.y = centerY;
	this.r1 = (Math.random() * base) + min;
	this.r2 = 0.6 * this.r1;
	this.rainyday = rainyday;
	this.linepoints = rainyday.getLinepoints(3); // TODO less for smaller?
	this.context = rainyday.context;
	this.minis = rainyday.minis;
}

Drop.prototype.draw = function() 
{
	var phase = Math.random()*Math.PI*2;
	var point;
	var rad, theta;
	var x0,y0;

	this.context.save();
	this.context.beginPath();
	point = this.linepoints.first;
	theta = phase;
	rad = this.r2 + point.y*(this.r1 - this.r2);
	x0 = this.x + rad*Math.cos(theta);
	y0 = this.y + rad*Math.sin(theta);
	this.context.lineTo(x0, y0);
	while (point.next != null) {
		point = point.next;
		theta = (Math.PI*2*point.x) + phase;
		rad = this.r2 + point.y*(this.r1 - this.r2);
		x0 = this.x + rad*Math.cos(theta);
		y0 = this.y + rad*Math.sin(theta);
		this.context.lineTo(x0, y0);
	}
	this.context.stroke();
	
	this.context.clip();

	// TODO select correct miniature based on the position 
	this.context.drawImage(this.minis[0], this.x - this.r1, this.y - this.r1);
	
	this.context.restore();
};

Drop.prototype.animate = function(maxY)
{
	this.intid = setInterval(
		(function(self) {
			return function() {
				self.context.clearRect(self.x - self.r1 - 1, self.y - self.r1 - 1, 2*self.r1 + 2, 2*self.r1 + 2);
				if (self.y - self.r1 > maxY) {
					clearInterval(self.intid);
					return;
				}
				if (self.speed) {
					self.speed += 0.02;
				} else {
					self.speed = 0.1;
				}
				self.y += self.speed; // TODO
				self.draw();

				if (self.rainyday.settings.trail) {
					// leave trail
					if (!self.trail || self.y - self.trail >= Math.random()*10*self.r1) {
						self.trail = self.y;
						self.rainyday.putDrop(new Drop(self.rainyday, self.x, self.y - self.r1 - 5, 0, 3));
					}
				}

				var margin = 0;

				if (self.rainyday.settings.collisions) {
					for (var i = Math.floor(self.x - self.r1 - margin); i < Math.ceil(self.x + self.r1 + margin), ++i) {
						var drops = self.rainyday.drops[i];

					}
				}
			}
		})(this),
		10
	);
};

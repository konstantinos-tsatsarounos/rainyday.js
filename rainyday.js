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
	this.stackBlurImage(this.settings.imageblur, window.innerWidth, window.innerHeight);
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

				}
			}
		})(this),
		10
	);
};

var mul_table = [
        512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
        454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
        482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
        437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
        497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
        320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
        446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
        329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
        505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
        399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
        324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
        268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
        451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
        385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
        332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
        289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];

var shg_table = [
	     9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 
		17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 
		19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
		20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 
		23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];

RainyDay.prototype.stackBlurImage = function(radius, width, height)
{
    this.canvas.style.width  = width + "px";
    this.canvas.style.height = height + "px";
    this.canvas.width = width;
    this.canvas.height = height;

    var context = this.canvas.getContext("2d");
    context.clearRect(0, 0, width, height );
    context.drawImage(this.img, 0, 0, width, height);

	if ( isNaN(radius) || radius < 1 ) return;

	this.stackBlurCanvasRGB(0, 0, width, height, radius);
};

RainyDay.prototype.stackBlurCanvasRGB = function(top_x, top_y, width, height, radius)
{
	if ( isNaN(radius) || radius < 1 ) return;
	radius |= 0;
	
	var context = this.canvas.getContext("2d");
	var imageData;
	
	try {
	  try {
		imageData = context.getImageData(top_x, top_y, width, height);
	  } catch(e) {
	  
		// NOTE: this part is supposedly only needed if you want to work with local files
		// so it might be okay to remove the whole try/catch block and just use
		// imageData = context.getImageData( top_x, top_y, width, height );
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
			imageData = context.getImageData(top_x, top_y, width, height);
		} catch(e) {
			alert("Cannot access local image");
			throw new Error("unable to access local image data: " + e);
			return;
		}
	  }
	} catch(e) {
	  alert("Cannot access image");
	  throw new Error("unable to access image data: " + e);
	}
			
	var pixels = imageData.data;
			
	var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum,
	r_out_sum, g_out_sum, b_out_sum,
	r_in_sum, g_in_sum, b_in_sum,
	pr, pg, pb, rbs;
			
	var div = radius + radius + 1;
	var w4 = width << 2;
	var widthMinus1  = width - 1;
	var heightMinus1 = height - 1;
	var radiusPlus1  = radius + 1;
	var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;
	
	var stackStart = new BlurStack();
	var stack = stackStart;
	for ( i = 1; i < div; i++ )
	{
		stack = stack.next = new BlurStack();
		if ( i == radiusPlus1 ) var stackEnd = stack;
	}
	stack.next = stackStart;
	var stackIn = null;
	var stackOut = null;
	
	yw = yi = 0;
	
	var mul_sum = mul_table[radius];
	var shg_sum = shg_table[radius];
	
	for ( y = 0; y < height; y++ )
	{
		r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;
		
		r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
		g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
		b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
		
		r_sum += sumFactor * pr;
		g_sum += sumFactor * pg;
		b_sum += sumFactor * pb;
		
		stack = stackStart;
		
		for( i = 0; i < radiusPlus1; i++ )
		{
			stack.r = pr;
			stack.g = pg;
			stack.b = pb;
			stack = stack.next;
		}
		
		for( i = 1; i < radiusPlus1; i++ )
		{
			p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
			r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
			g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
			b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
			
			r_in_sum += pr;
			g_in_sum += pg;
			b_in_sum += pb;
			
			stack = stack.next;
		}
		
		
		stackIn = stackStart;
		stackOut = stackEnd;
		for ( x = 0; x < width; x++ )
		{
			pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
			pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
			pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;
			
			r_sum -= r_out_sum;
			g_sum -= g_out_sum;
			b_sum -= b_out_sum;
			
			r_out_sum -= stackIn.r;
			g_out_sum -= stackIn.g;
			b_out_sum -= stackIn.b;
			
			p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;
			
			r_in_sum += ( stackIn.r = pixels[p]);
			g_in_sum += ( stackIn.g = pixels[p+1]);
			b_in_sum += ( stackIn.b = pixels[p+2]);
			
			r_sum += r_in_sum;
			g_sum += g_in_sum;
			b_sum += b_in_sum;
			
			stackIn = stackIn.next;
			
			r_out_sum += ( pr = stackOut.r );
			g_out_sum += ( pg = stackOut.g );
			b_out_sum += ( pb = stackOut.b );
			
			r_in_sum -= pr;
			g_in_sum -= pg;
			b_in_sum -= pb;
			
			stackOut = stackOut.next;

			yi += 4;
		}
		yw += width;
	}

	
	for ( x = 0; x < width; x++ )
	{
		g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;
		
		yi = x << 2;
		r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
		g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
		b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
		
		r_sum += sumFactor * pr;
		g_sum += sumFactor * pg;
		b_sum += sumFactor * pb;
		
		stack = stackStart;
		
		for( i = 0; i < radiusPlus1; i++ )
		{
			stack.r = pr;
			stack.g = pg;
			stack.b = pb;
			stack = stack.next;
		}
		
		yp = width;
		
		for( i = 1; i <= radius; i++ )
		{
			yi = ( yp + x ) << 2;
			
			r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
			g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
			b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
			
			r_in_sum += pr;
			g_in_sum += pg;
			b_in_sum += pb;
			
			stack = stack.next;
		
			if( i < heightMinus1 )
			{
				yp += width;
			}
		}
		
		yi = x;
		stackIn = stackStart;
		stackOut = stackEnd;
		for ( y = 0; y < height; y++ )
		{
			p = yi << 2;
			pixels[p]   = (r_sum * mul_sum) >> shg_sum;
			pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
			pixels[p+2] = (b_sum * mul_sum) >> shg_sum;
			
			r_sum -= r_out_sum;
			g_sum -= g_out_sum;
			b_sum -= b_out_sum;
			
			r_out_sum -= stackIn.r;
			g_out_sum -= stackIn.g;
			b_out_sum -= stackIn.b;
			
			p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;
			
			r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
			g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
			b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
			
			stackIn = stackIn.next;
			
			r_out_sum += ( pr = stackOut.r );
			g_out_sum += ( pg = stackOut.g );
			b_out_sum += ( pb = stackOut.b );
			
			r_in_sum -= pr;
			g_in_sum -= pg;
			b_in_sum -= pb;
			
			stackOut = stackOut.next;
			
			yi += width;
		}
	}
	
	context.putImageData(imageData, top_x, top_y);
	
}

function BlurStack()
{
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 0;
	this.next = null;
}

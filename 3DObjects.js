
var canvas;
var context;
var screenWidth;
var screenHeight;
var oldMousePos = {x: 0, y: 0};

var objects;

var camera = new Camera3D();
var light = new Light3D();

//add html loaded listener
if (document.addEventListener) {
	document.addEventListener("DOMContentLoaded", init, false);
}

function init()
{

	//remove html loaded listener
	document.removeEventListener("DOMContentLoaded", init);

	//Get a handle to the 2d context of the canvas
	canvas = document.getElementById('canvas');
    context = canvas.getContext('2d')
	
	objects = new Vector();
	
	//add object
	var obj1 = new Object3D();
	obj1.initMesh(torus);
	obj1.rotateMesh(3,0,0);
	
	objects.push(obj1);
	
	//add listeners
	canvas.addEventListener("mousemove",handleMouseMove);
	
	window.onresize = function()
	{
		canvas.width = parseInt(window.innerWidth)*0.9;
		canvas.height = parseInt(window.innerHeight)*0.9;
		screenWidth = canvas.width;
		screenHeight = canvas.height;
	}
	
	//Calulate screen height and width
	canvas.width = parseInt(window.innerWidth)*0.9;
	canvas.height = parseInt(window.innerHeight)*0.9;
	
    screenWidth = canvas.width;
    screenHeight = canvas.height;
	
	//start main loop
    setInterval(update, 20);
}


function applyProjection(point,cam)
{
	var scale=cam.focalLength/(point.z+cam.focalLength);
	var point2D={x: (screenWidth/2)+(point.x*scale), y: (screenHeight/2)+(point.y*scale)};
	return point2D
}



function update()
{
	//clear the screen
	context.fillStyle = "rgb(200,200,200)";
	context.fillRect(0, 0, screenWidth, screenHeight);
	
	
	//DRAW OBJECTS
	for(var i = 0; i < objects.index; i++)
	{
		var object = objects.members[i];
		
		//update
		object.update();
		
		object.translateMesh(object.meshPosition.x,object.meshPosition.y,object.meshPosition.z,false);
		
		//sort polygons by z depth
		object.mesh.members.sort(
			function(polyA,polyB){
			
				var vA1 = object.vertices.members[polyA.a];
				var vA2 = object.vertices.members[polyA.b];
				var vA3 = object.vertices.members[polyA.c];
				
				var vB1 = object.vertices.members[polyB.a];
				var vB2 = object.vertices.members[polyB.b];
				var vB3 = object.vertices.members[polyB.c];
				
				var maxX = Math.max(vA1.x, Math.max(vA2.x,vA3.x));
				var minX = Math.min(vA1.x, Math.min(vA2.x,vA3.x));
				var maxY = Math.max(vA1.y, Math.max(vA2.y,vA3.y));
				var minY = Math.min(vA1.y, Math.min(vA2.y,vA3.y));
				var maxZ = Math.max(vA1.z, Math.max(vA2.z,vA3.z));
				var minZ = Math.min(vA1.z, Math.min(vA2.z,vA3.z));
				
				var centroidA = { x: (minX+maxX)/2, y: (minY+maxY)/2, z: (minZ+maxZ)/2 };
				
				var maxX = Math.max(vB1.x, Math.max(vB2.x,vB3.x));
				var minX = Math.min(vB1.x, Math.min(vB2.x,vB3.x));
				var maxY = Math.max(vB1.y, Math.max(vB2.y,vB3.y));
				var minY = Math.min(vB1.y, Math.min(vB2.y,vB3.y));
				var maxZ = Math.max(vB1.z, Math.max(vB2.z,vB3.z));
				var minZ = Math.min(vB1.z, Math.min(vB2.z,vB3.z));
				
				var centroidB = { x: (minX+maxX)/2, y: (minY+maxY)/2, z: (minZ+maxZ)/2 };

				//return centroidB.z - centroidA.z;
				return object.euclidianDistance(centroidB,camera.position) - object.euclidianDistance(centroidA,camera.position);
			}
		);

		//draw polygons
		for(var i = 0; i < object.mesh.index; i++)
		{
			var polygon = object.mesh.members[i];
		
			var v1 = object.vertices.members[polygon.a];
			var v2 = object.vertices.members[polygon.b];
			var v3 = object.vertices.members[polygon.c];
			
			var normal = object.calculateNormal(v1,v2,v3);
			
			//cull backfacing polygons
			if(object.isFacingCamera(normal,v1,v2,v3,camera))
			{
			
				var p1 = applyProjection(v1,camera);
				var p2 = applyProjection(v2,camera);
				var p3 = applyProjection(v3,camera);
						
				context.beginPath(); 
						
				context.moveTo(p1.x, p1.y);
				context.lineTo(p2.x, p2.y);
				context.lineTo(p3.x, p3.y);
				context.lineTo(p1.x, p1.y);

				context.closePath();
				
				var colour = object.calculatePolygonIllumination(polygon.colour,normal,v1,v2,v3,light);

				context.fillStyle = "rgba("+Math.round(colour.r)+", "+Math.round(colour.g)+", "+Math.round(colour.b)+", 1.0)";
				context.fill();
				context.lineWidth = 1.0;
				context.strokeStyle = "rgba("+Math.round(colour.r)+", "+Math.round(colour.g)+", "+Math.round(colour.b)+", 1.0)";
				context.stroke();
				
			}
		}
		
		object.translateMesh(-object.meshPosition.x,-object.meshPosition.y,-object.meshPosition.z,false);

	}



}


function handleMouseMove(e)
{
	//objects.members[0].meshPosition.x = e.x - screenWidth/2;
	//objects.members[0].meshPosition.y = e.y - screenHeight/2;
	var dx = oldMousePos.x - e.x;
	var dy = oldMousePos.y - e.y;
	
	objects.members[0].rotateMesh(-dy/100,dx/100,0);
	
	oldMousePos.x = e.x;
	oldMousePos.y = e.y;
}





//Classes


//Camera
function Camera3D()
{
	this.position = {x: 0, y: 0, z: -500};
	this.focalLength = 1000;
}

//Light
function Light3D()
{
	this.position = {x: 0, y: 0, z: -300};
	this.ambientColour = {r: 0, g: 0, b: 0};
	this.diffuseColour = {r: 255, g: 100, b: 0};
}

//Game Object
function Object3D()
{
	this.vertices = new Vector();
	this.mesh = new Vector();
	this.meshPosition = {x:0,y:0,z:0};
	this.cull = true;

	this.initMesh = function(data)
	{
		if(data != null)
		{
			this.parseOBJLines(data);
		}
		else
		{
			this.cull = false;
			this.createCubeMesh();
		}
	}
	
	
	
	this.update = function()
	{
		//this.rotateMesh(0.005,0.005,0.005);
	}
	
	
	this.calculatePolygonIllumination = function(polyColour,normal,v1,v2,v3,lightSrc)
	{
		//calculate light to surface vector
		var maxX = Math.max(v1.x, Math.max(v2.x,v3.x));
		var minX = Math.min(v1.x, Math.min(v2.x,v3.x));
		var maxY = Math.max(v1.y, Math.max(v2.y,v3.y));
		var minY = Math.min(v1.y, Math.min(v2.y,v3.y));
		var maxZ = Math.max(v1.z, Math.max(v2.z,v3.z));
		var minZ = Math.min(v1.z, Math.min(v2.z,v3.z));
		var centroid = { x: (minX+maxX)/2, y: (minY+maxY)/2, z: (minZ+maxZ)/2 };
		var lightToSurface = {x: (lightSrc.position.x - centroid.x), y: (lightSrc.position.y - centroid.y), z: (lightSrc.position.z - centroid.z)};
		
		//calculate light intensity based on light to surface vectors similarity with the normal of the polygon
		var intensity = this.cosSimilarity(normal,lightToSurface);
		
		//generate the new colour based on the base colours and the light intensity
		var colour = {r:0,g:0,b:0};
		colour.r = polyColour.r + lightSrc.ambientColour.r + intensity*lightSrc.diffuseColour.r;
		colour.g = polyColour.g + lightSrc.ambientColour.g + intensity*lightSrc.diffuseColour.g;
		colour.b = polyColour.b + lightSrc.ambientColour.b + intensity*lightSrc.diffuseColour.b;
		
		return colour;
	}
	

	this.crossProduct = function(A, B)
	{
		var V = {x:0, y:0, z:0};
		V.x = (A.y*B.z)-(A.z*B.y);
		V.y = (A.z*B.x)-(A.x*B.z);
		V.z = (A.x*B.y)-(A.y*B.x);
		return V;
	}

	this.dotProduct = function(A, B)
	{
		var sum = ((A.x*B.x)+(A.y*B.y)+(A.z*B.z));
		return sum;
	}

	this.vectorSum = function(A)
	{
		var sum = (Math.abs(A.x)+Math.abs(A.y)+Math.abs(A.z));
		return sum;
	}

	this.euclidianDistance = function(A, B)
	{
		var x2 = Math.pow(B.x-A.x,2);
		var y2 = Math.pow(B.y-A.y,2);
		var z2 = Math.pow(B.z-A.z,2);
		var val = Math.sqrt(x2+y2+z2);
		return val;
	}

	this.calculateNormal = function(A, B, C)
	{
		var P = {x:0,y:0,z:0};
		var Q = {x:0,y:0,z:0};

		P.x = B.x - A.x;
		P.y = B.y - A.y;
		P.z = B.z - A.z;

		Q.x = C.x - A.x;
		Q.y = C.y - A.y;
		Q.z = C.z - A.z;

		var N = this.crossProduct(P,Q);
		return N;
	}


	this.cosSimilarity = function(P,Q)
	{
		var sim = (this.dotProduct(P,Q)/(this.vectorSum(P)*this.vectorSum(Q)));
		return sim;
	}

	this.isFacingCamera = function(N,v1,v2,v3,Cam)
	{
		if(!this.cull){return true}; 

		var maxX = Math.max(v1.x, Math.max(v2.x,v3.x));
		var minX = Math.min(v1.x, Math.min(v2.x,v3.x));
		var maxY = Math.max(v1.y, Math.max(v2.y,v3.y));
		var minY = Math.min(v1.y, Math.min(v2.y,v3.y));
		var maxZ = Math.max(v1.z, Math.max(v2.z,v3.z));
		var minZ = Math.min(v1.z, Math.min(v2.z,v3.z));	
		var centroid = { x: (minX+maxX)/2, y: (minY+maxY)/2, z: (minZ+maxZ)/2 };
		
		var cameraToPolygon = { x: Cam.position.x - centroid.x, y: Cam.position.y-centroid.y, z: Cam.position.z-centroid.z };

		if(N.z > 0 && this.cosSimilarity(N,cameraToPolygon) <= 0.0)
		{
			return false;
		}
		else
		{
			return true;
		}
	}



	this.translateMesh = function(DX,DY,DZ,update)
	{
		for (var i = 0; i < this.vertices.index; i++)  
		{
			var point = this.vertices.members[i];
			var newPoint = {x: (point.x+DX), y: (point.y+DY), z: (point.z+DZ)};
			this.vertices.members[i] = newPoint;
		}
		
		if(update)
		{
			this.meshPosition.x += DX;
			this.meshPosition.y += DY;
			this.meshPosition.z += DZ;
		}
	}

	this.scaleMesh = function(SX,SY,SZ)
	{
		for (var i = 0; i < this.vertices.index; i++)  
		{
			var point = this.vertices.members[i];
			var newPoint = {x: (point.x*SX), y: (point.y*SY), z: (point.z*SZ)};
			this.vertices.members[i] = newPoint;
		}
	}

	this.rotateMesh = function(AX,AY,AZ)
	{
		var x;
		var y;
		var z;
		var newX;
		var newY;
		var newZ;

		this.translateMesh(-this.meshPosition.x, -this.meshPosition.y, -this.meshPosition.z, false); //translate to origin

		for (var i = 0 ; i < this.vertices.index; i++)  
		{
			var point = this.vertices.members[i];

			x = point.x;
			y = point.y;
			z = point.z;

			//Z rotation
			newY = y*Math.cos(AX) - z*Math.sin(AX);
			newZ = z*Math.cos(AX) + y*Math.sin(AX);
			y = newY;
			z = newZ;

			//Y rotation
			newZ = z*Math.cos(AY) - x*Math.sin(AY);
			newX = x*Math.cos(AY) + z*Math.sin(AY);
			x = newX;

			//X rotation
			newX = x*Math.cos(AZ) - y*Math.sin(AZ);
			newY = y*Math.cos(AZ) + x*Math.sin(AZ);

			var newPoint = {x: newX,y: newY,z: newZ};

			this.vertices.members[i] = newPoint;
		}

		this.translateMesh(this.meshPosition.x, this.meshPosition.y, this.meshPosition.z, false); //retranslate
		
	}
	
	
	

	
	this.parseOBJLines = function(data)
	{
	
		var minX = Infinity;
		var maxX = -Infinity;
	
		var lines = data.split("\n");
		for(var i = 0; i < lines.length; i++)
		{
			var values = lines[i].split(' ');
			if(values[0] == 'v')
			{
				var px = parseFloat(values[2]);
				var py = parseFloat(values[3]);
				var pz = parseFloat(values[4]);

				if(px < minX) minX = px;
				if(px > maxX) maxX = px;
				
				this.vertices.push({x: px, y: py, z: pz} );
			}
			else if(values[0] == 'f')
			{
				this.mesh.push({a: parseInt(values[1])-1, b: parseInt(values[2])-1, c: parseInt(values[3])-1, colour:{r: 0,g: 0, b: 0} } );
			}
		}
		
		//normalise and scale mesh
		var factor = 1/(maxX - minX);
		this.scaleMesh(factor*500,factor*500,factor*500);
	}
	
	
	
	this.createCubeMesh = function()
	{
		this.vertices.push({x: -100, y: -100, z: -100});
		this.vertices.push({x:  100, y: -100, z: -100});
		this.vertices.push({x:  100, y:  100, z: -100});
		this.vertices.push({x: -100, y:  100, z: -100});
		
		this.vertices.push({x: -100, y: -100, z: 100});
		this.vertices.push({x:  100, y: -100, z: 100});
		this.vertices.push({x:  100, y:  100, z: 100});
		this.vertices.push({x: -100, y:  100, z: 100});
		
		this.mesh.push({a: 0, b: 1, c: 2, colour:{r:255,g:0,b:0}});
		this.mesh.push({a: 0, b: 2, c: 3, colour:{r:255,g:0,b:0}});
		
		this.mesh.push({a: 4, b: 5, c: 6, colour:{r:0,g:255,b:0}});
		this.mesh.push({a: 4, b: 6, c: 7, colour:{r:0,g:255,b:0}});
		
		this.mesh.push({a: 0, b: 4, c: 5, colour:{r:255,g:0,b:255}});
		this.mesh.push({a: 0, b: 1, c: 5, colour:{r:255,g:0,b:255}});

		this.mesh.push({a: 2, b: 6, c: 7, colour:{r:0,g:0,b:255}});
		this.mesh.push({a: 2, b: 3, c: 7, colour:{r:0,g:0,b:255}});
		
		this.mesh.push({a: 1, b: 2, c: 5, colour:{r:255,g:255,b:0}});
		this.mesh.push({a: 2, b: 5, c: 6, colour:{r:255,g:255,b:0}});
		
		this.mesh.push({a: 0, b: 3, c: 4, colour:{r:0,g:255,b:255}});
		this.mesh.push({a: 3, b: 4, c: 7, colour:{r:0,g:255,b:255}});
	}
	

}


//Vector Data Type
function Vector()
{
	this.size = 10;
	this.members = new Array(this.size);
	this.index = 0;
	
	this.push = function(elem)
	{
		if(this.index < this.size)
		{
			this.members[this.index] = elem;
			this.index++;
		}
		else
		{
			this.resize();
			this.members[this.index] = elem;
			this.index++;
		}
	}
	
	this.removeElement = function(elem)
	{
		var elemindex = this.members.indexOf(elem);
		this.members.splice(elemindex,1);
		delete elem;
		this.size--;
		this.index--;
	}
	
	this.resize = function()
	{
		this.size += 10;
		var newMembers = new Array(this.size);
		for(var i = 0; i <= this.index; i++)
		{
			newMembers[i] = this.members[i];
		}
		delete this.members;
		this.members = newMembers;
	}
}


var torus = "v  0.0998 32.7159 0.0000\nv  7.9997 29.7774 7.0850\nv  8.4911 31.6112 0.0000\nv  0.0998 30.8175 7.0850\nv  6.6573 24.7676 12.2716\nv  0.0998 25.6309 12.2716\nv  4.8236 17.9240 14.1700\nv  0.0998 18.5459 14.1700\nv  2.9899 11.0804 12.2716\nv  0.0998 11.4609 12.2716\nv  1.6475 6.0706 7.0850\nv  0.0998 6.2743 7.0850\nv  1.1561 4.2368 0.0000\nv  0.0998 4.3759 0.0000\nv  1.6475 6.0706 -7.0850\nv  0.0998 6.2743 -7.0850\nv  2.9899 11.0804 -12.2716\nv  0.0998 11.4609 -12.2716\nv  4.8236 17.9240 -14.1700\nv  0.0998 18.5459 -14.1700\nv  6.6573 24.7676 -12.2716\nv  0.0998 25.6309 -12.2716\nv  7.9997 29.7774 -7.0850\nv  0.0998 30.8175 -7.0850\nv  15.3613 26.7282 7.0850\nv  16.3105 28.3723 0.0000\nv  12.7680 22.2365 12.2716\nv  9.2255 16.1007 14.1700\nv  5.6830 9.9649 12.2716\nv  3.0897 5.4732 7.0850\nv  2.1405 3.8291 0.0000\nv  3.0897 5.4732 -7.0850\nv  5.6830 9.9649 -12.2716\nv  9.2255 16.1007 -14.1700\nv  12.7680 22.2365 -12.2716\nv  15.3613 26.7282 -7.0850\nv  21.6828 21.8775 7.0850\nv  23.0252 23.2199 0.0000\nv  18.0153 18.2101 12.2716\nv  13.0055 13.2002 14.1700\nv  7.9956 8.1904 12.2716\nv  4.3282 4.5229 7.0850\nv  2.9858 3.1805 0.0000\nv  4.3282 4.5229 -7.0850\nv  7.9956 8.1904 -12.2716\nv  13.0055 13.2002 -14.1700\nv  18.0153 18.2101 -12.2716\nv  21.6828 21.8775 -7.0850\nv  26.5335 15.5560 7.0850\nv  28.1775 16.5052 0.0000\nv  22.0417 12.9627 12.2716\nv  15.9060 9.4202 14.1700\nv  9.7702 5.8777 12.2716\nv  5.2785 3.2844 7.0850\nv  3.6344 2.3352 0.0000\nv  5.2785 3.2844 -7.0850\nv  9.7702 5.8777 -12.2716\nv  15.9060 9.4202 -14.1700\nv  22.0417 12.9627 -12.2716\nv  26.5335 15.5560 -7.0850\nv  29.5827 8.1945 7.0850\nv  31.4164 8.6858 0.0000\nv  24.5729 6.8521 12.2716\nv  17.7293 5.0183 14.1700\nv  10.8857 3.1846 12.2716\nv  5.8758 1.8422 7.0850\nv  4.0421 1.3509 0.0000\nv  5.8758 1.8422 -7.0850\nv  10.8857 3.1846 -12.2716\nv  17.7293 5.0183 -14.1700\nv  24.5729 6.8521 -12.2716\nv  29.5827 8.1945 -7.0850\nv  30.6228 0.2945 7.0850\nv  32.5212 0.2945 0.0000\nv  25.4362 0.2945 12.2716\nv  18.3512 0.2945 14.1700\nv  11.2662 0.2945 12.2716\nv  6.0796 0.2945 7.0850\nv  4.1812 0.2945 0.0000\nv  6.0796 0.2945 -7.0850\nv  11.2662 0.2945 -12.2716\nv  18.3512 0.2945 -14.1700\nv  25.4362 0.2945 -12.2716\nv  30.6228 0.2945 -7.0850\nv  29.5827 -7.6054 7.0850\nv  31.4164 -8.0967 0.0000\nv  24.5729 -6.2630 12.2716\nv  17.7293 -4.4293 14.1700\nv  10.8857 -2.5955 12.2716\nv  5.8758 -1.2532 7.0850\nv  4.0421 -0.7618 0.0000\nv  5.8758 -1.2532 -7.0850\nv  10.8857 -2.5955 -12.2716\nv  17.7293 -4.4293 -14.1700\nv  24.5729 -6.2630 -12.2716\nv  29.5827 -7.6054 -7.0850\nv  26.5335 -14.9669 7.0850\nv  28.1775 -15.9162 0.0000\nv  22.0417 -12.3737 12.2716\nv  15.9060 -8.8312 14.1700\nv  9.7702 -5.2887 12.2716\nv  5.2785 -2.6954 7.0850\nv  3.6344 -1.7462 0.0000\nv  5.2785 -2.6954 -7.0850\nv  9.7702 -5.2887 -12.2716\nv  15.9060 -8.8312 -14.1700\nv  22.0417 -12.3737 -12.2716\nv  26.5335 -14.9669 -7.0850\nv  21.6828 -21.2885 7.0850\nv  23.0252 -22.6308 0.0000\nv  18.0153 -17.6210 12.2716\nv  13.0055 -12.6111 14.1700\nv  7.9956 -7.6013 12.2716\nv  4.3282 -3.9338 7.0850\nv  2.9858 -2.5914 0.0000\nv  4.3282 -3.9338 -7.0850\nv  7.9956 -7.6013 -12.2716\nv  13.0055 -12.6111 -14.1700\nv  18.0153 -17.6210 -12.2716\nv  21.6828 -21.2885 -7.0850\nv  15.3613 -26.1391 7.0850\nv  16.3105 -27.7832 0.0000\nv  12.7680 -21.6474 12.2716\nv  9.2255 -15.5116 14.1700\nv  5.6830 -9.3758 12.2716\nv  3.0897 -4.8841 7.0850\nv  2.1405 -3.2401 0.0000\nv  3.0897 -4.8841 -7.0850\nv  5.6830 -9.3758 -12.2716\nv  9.2255 -15.5116 -14.1700\nv  12.7680 -21.6474 -12.2716\nv  15.3613 -26.1391 -7.0850\nv  7.9997 -29.1884 7.0850\nv  8.4911 -31.0221 0.0000\nv  6.6573 -24.1785 12.2716\nv  4.8236 -17.3349 14.1700\nv  2.9899 -10.4914 12.2716\nv  1.6475 -5.4815 7.0850\nv  1.1561 -3.6478 0.0000\nv  1.6475 -5.4815 -7.0850\nv  2.9899 -10.4914 -12.2716\nv  4.8236 -17.3349 -14.1700\nv  6.6573 -24.1785 -12.2716\nv  7.9997 -29.1884 -7.0850\nv  0.0998 -30.2284 7.0850\nv  0.0998 -32.1268 0.0000\nv  0.0998 -25.0418 12.2716\nv  0.0998 -17.9569 14.1700\nv  0.0998 -10.8719 12.2716\nv  0.0998 -5.6853 7.0850\nv  0.0998 -3.7869 0.0000\nv  0.0998 -5.6853 -7.0850\nv  0.0998 -10.8718 -12.2716\nv  0.0998 -17.9568 -14.1700\nv  0.0998 -25.0418 -12.2716\nv  0.0998 -30.2284 -7.0850\nv  -7.8001 -29.1884 7.0850\nv  -8.2915 -31.0221 0.0000\nv  -6.4577 -24.1785 12.2716\nv  -4.6240 -17.3349 14.1700\nv  -2.7903 -10.4914 12.2716\nv  -1.4479 -5.4815 7.0850\nv  -0.9565 -3.6478 0.0000\nv  -1.4479 -5.4815 -7.0850\nv  -2.7903 -10.4914 -12.2716\nv  -4.6240 -17.3349 -14.1700\nv  -6.4577 -24.1785 -12.2716\nv  -7.8001 -29.1884 -7.0850\nv  -15.1617 -26.1391 7.0850\nv  -16.1109 -27.7832 0.0000\nv  -12.5684 -21.6474 12.2716\nv  -9.0259 -15.5116 14.1700\nv  -5.4834 -9.3758 12.2716\nv  -2.8901 -4.8841 7.0850\nv  -1.9409 -3.2401 0.0000\nv  -2.8901 -4.8841 -7.0850\nv  -5.4834 -9.3758 -12.2716\nv  -9.0259 -15.5116 -14.1700\nv  -12.5684 -21.6474 -12.2716\nv  -15.1617 -26.1391 -7.0850\nv  -21.4832 -21.2885 7.0850\nv  -22.8256 -22.6308 0.0000\nv  -17.8157 -17.6210 12.2716\nv  -12.8059 -12.6111 14.1700\nv  -7.7960 -7.6013 12.2716\nv  -4.1286 -3.9338 7.0850\nv  -2.7862 -2.5914 0.0000\nv  -4.1286 -3.9338 -7.0850\nv  -7.7960 -7.6013 -12.2716\nv  -12.8059 -12.6111 -14.1700\nv  -17.8157 -17.6210 -12.2716\nv  -21.4832 -21.2885 -7.0850\nv  -26.3339 -14.9670 7.0850\nv  -27.9779 -15.9162 0.0000\nv  -21.8421 -12.3737 12.2716\nv  -15.7064 -8.8312 14.1700\nv  -9.5706 -5.2887 12.2716\nv  -5.0789 -2.6954 7.0850\nv  -3.4348 -1.7462 0.0000\nv  -5.0789 -2.6954 -7.0850\nv  -9.5706 -5.2887 -12.2716\nv  -15.7064 -8.8312 -14.1700\nv  -21.8421 -12.3737 -12.2716\nv  -26.3339 -14.9670 -7.0850\nv  -29.3831 -7.6054 7.0850\nv  -31.2168 -8.0967 0.0000\nv  -24.3733 -6.2630 12.2716\nv  -17.5297 -4.4293 14.1700\nv  -10.6861 -2.5955 12.2716\nv  -5.6763 -1.2532 7.0850\nv  -3.8425 -0.7618 0.0000\nv  -5.6763 -1.2532 -7.0850\nv  -10.6861 -2.5955 -12.2716\nv  -17.5297 -4.4293 -14.1700\nv  -24.3733 -6.2630 -12.2716\nv  -29.3831 -7.6054 -7.0850\nv  -30.4232 0.2945 7.0850\nv  -32.3216 0.2945 0.0000\nv  -25.2366 0.2945 12.2716\nv  -18.1516 0.2945 14.1700\nv  -11.0666 0.2945 12.2716\nv  -5.8800 0.2945 7.0850\nv  -3.9816 0.2945 0.0000\nv  -5.8800 0.2945 -7.0850\nv  -11.0666 0.2945 -12.2716\nv  -18.1516 0.2945 -14.1700\nv  -25.2366 0.2945 -12.2716\nv  -30.4232 0.2945 -7.0850\nv  -29.3831 8.1944 7.0850\nv  -31.2169 8.6858 0.0000\nv  -24.3733 6.8521 12.2716\nv  -17.5297 5.0183 14.1700\nv  -10.6861 3.1846 12.2716\nv  -5.6763 1.8422 7.0850\nv  -3.8425 1.3509 0.0000\nv  -5.6763 1.8422 -7.0850\nv  -10.6861 3.1846 -12.2716\nv  -17.5297 5.0183 -14.1700\nv  -24.3733 6.8521 -12.2716\nv  -29.3831 8.1944 -7.0850\nv  -26.3339 15.5560 7.0850\nv  -27.9779 16.5052 0.0000\nv  -21.8422 12.9627 12.2716\nv  -15.7064 9.4202 14.1700\nv  -9.5706 5.8777 12.2716\nv  -5.0789 3.2844 7.0850\nv  -3.4348 2.3352 0.0000\nv  -5.0789 3.2844 -7.0850\nv  -9.5706 5.8777 -12.2716\nv  -15.7064 9.4202 -14.1700\nv  -21.8422 12.9627 -12.2716\nv  -26.3339 15.5560 -7.0850\nv  -21.4832 21.8775 7.0850\nv  -22.8256 23.2199 0.0000\nv  -17.8157 18.2100 12.2716\nv  -12.8059 13.2002 14.1700\nv  -7.7960 8.1904 12.2716\nv  -4.1286 4.5229 7.0850\nv  -2.7862 3.1805 0.0000\nv  -4.1286 4.5229 -7.0850\nv  -7.7960 8.1904 -12.2716\nv  -12.8059 13.2002 -14.1700\nv  -17.8157 18.2100 -12.2716\nv  -21.4832 21.8775 -7.0850\nv  -15.1617 26.7282 7.0850\nv  -16.1109 28.3723 0.0000\nv  -12.5684 22.2365 12.2716\nv  -9.0259 16.1007 14.1700\nv  -5.4834 9.9649 12.2716\nv  -2.8901 5.4732 7.0850\nv  -1.9409 3.8291 0.0000\nv  -2.8901 5.4732 -7.0850\nv  -5.4834 9.9649 -12.2716\nv  -9.0259 16.1007 -14.1700\nv  -12.5684 22.2365 -12.2716\nv  -15.1617 26.7282 -7.0850\nv  -7.8001 29.7774 7.0850\nv  -8.2915 31.6112 0.0000\nv  -6.4578 24.7676 12.2716\nv  -4.6240 17.9240 14.1700\nv  -2.7903 11.0804 12.2716\nv  -1.4479 6.0706 7.0850\nv  -0.9565 4.2368 0.0000\nv  -1.4479 6.0706 -7.0850\nv  -2.7903 11.0804 -12.2716\nv  -4.6240 17.9240 -14.1700\nv  -6.4578 24.7676 -12.2716\nv  -7.8001 29.7774 -7.0850\n# 288 vertices\n\ng Torus001\nf 1 2 3 \nf 1 4 2 \nf 4 5 2 \nf 4 6 5 \nf 6 7 5 \nf 6 8 7 \nf 8 9 7 \nf 8 10 9 \nf 10 11 9 \nf 10 12 11 \nf 12 13 11 \nf 12 14 13 \nf 14 15 13 \nf 14 16 15 \nf 16 17 15 \nf 16 18 17 \nf 18 19 17 \nf 18 20 19 \nf 20 21 19 \nf 20 22 21 \nf 22 23 21 \nf 22 24 23 \nf 24 3 23 \nf 24 1 3 \nf 3 25 26 \nf 3 2 25 \nf 2 27 25 \nf 2 5 27 \nf 5 28 27 \nf 5 7 28 \nf 7 29 28 \nf 7 9 29 \nf 9 30 29 \nf 9 11 30 \nf 11 31 30 \nf 11 13 31 \nf 13 32 31 \nf 13 15 32 \nf 15 33 32 \nf 15 17 33 \nf 17 34 33 \nf 17 19 34 \nf 19 35 34 \nf 19 21 35 \nf 21 36 35 \nf 21 23 36 \nf 23 26 36 \nf 23 3 26 \nf 26 37 38 \nf 26 25 37 \nf 25 39 37 \nf 25 27 39 \nf 27 40 39 \nf 27 28 40 \nf 28 41 40 \nf 28 29 41 \nf 29 42 41 \nf 29 30 42 \nf 30 43 42 \nf 30 31 43 \nf 31 44 43 \nf 31 32 44 \nf 32 45 44 \nf 32 33 45 \nf 33 46 45 \nf 33 34 46 \nf 34 47 46 \nf 34 35 47 \nf 35 48 47 \nf 35 36 48 \nf 36 38 48 \nf 36 26 38 \nf 38 49 50 \nf 38 37 49 \nf 37 51 49 \nf 37 39 51 \nf 39 52 51 \nf 39 40 52 \nf 40 53 52 \nf 40 41 53 \nf 41 54 53 \nf 41 42 54 \nf 42 55 54 \nf 42 43 55 \nf 43 56 55 \nf 43 44 56 \nf 44 57 56 \nf 44 45 57 \nf 45 58 57 \nf 45 46 58 \nf 46 59 58 \nf 46 47 59 \nf 47 60 59 \nf 47 48 60 \nf 48 50 60 \nf 48 38 50 \nf 50 61 62 \nf 50 49 61 \nf 49 63 61 \nf 49 51 63 \nf 51 64 63 \nf 51 52 64 \nf 52 65 64 \nf 52 53 65 \nf 53 66 65 \nf 53 54 66 \nf 54 67 66 \nf 54 55 67 \nf 55 68 67 \nf 55 56 68 \nf 56 69 68 \nf 56 57 69 \nf 57 70 69 \nf 57 58 70 \nf 58 71 70 \nf 58 59 71 \nf 59 72 71 \nf 59 60 72 \nf 60 62 72 \nf 60 50 62 \nf 62 73 74 \nf 62 61 73 \nf 61 75 73 \nf 61 63 75 \nf 63 76 75 \nf 63 64 76 \nf 64 77 76 \nf 64 65 77 \nf 65 78 77 \nf 65 66 78 \nf 66 79 78 \nf 66 67 79 \nf 67 80 79 \nf 67 68 80 \nf 68 81 80 \nf 68 69 81 \nf 69 82 81 \nf 69 70 82 \nf 70 83 82 \nf 70 71 83 \nf 71 84 83 \nf 71 72 84 \nf 72 74 84 \nf 72 62 74 \nf 74 85 86 \nf 74 73 85 \nf 73 87 85 \nf 73 75 87 \nf 75 88 87 \nf 75 76 88 \nf 76 89 88 \nf 76 77 89 \nf 77 90 89 \nf 77 78 90 \nf 78 91 90 \nf 78 79 91 \nf 79 92 91 \nf 79 80 92 \nf 80 93 92 \nf 80 81 93 \nf 81 94 93 \nf 81 82 94 \nf 82 95 94 \nf 82 83 95 \nf 83 96 95 \nf 83 84 96 \nf 84 86 96 \nf 84 74 86 \nf 86 97 98 \nf 86 85 97 \nf 85 99 97 \nf 85 87 99 \nf 87 100 99 \nf 87 88 100 \nf 88 101 100 \nf 88 89 101 \nf 89 102 101 \nf 89 90 102 \nf 90 103 102 \nf 90 91 103 \nf 91 104 103 \nf 91 92 104 \nf 92 105 104 \nf 92 93 105 \nf 93 106 105 \nf 93 94 106 \nf 94 107 106 \nf 94 95 107 \nf 95 108 107 \nf 95 96 108 \nf 96 98 108 \nf 96 86 98 \nf 98 109 110 \nf 98 97 109 \nf 97 111 109 \nf 97 99 111 \nf 99 112 111 \nf 99 100 112 \nf 100 113 112 \nf 100 101 113 \nf 101 114 113 \nf 101 102 114 \nf 102 115 114 \nf 102 103 115 \nf 103 116 115 \nf 103 104 116 \nf 104 117 116 \nf 104 105 117 \nf 105 118 117 \nf 105 106 118 \nf 106 119 118 \nf 106 107 119 \nf 107 120 119 \nf 107 108 120 \nf 108 110 120 \nf 108 98 110 \nf 110 121 122 \nf 110 109 121 \nf 109 123 121 \nf 109 111 123 \nf 111 124 123 \nf 111 112 124 \nf 112 125 124 \nf 112 113 125 \nf 113 126 125 \nf 113 114 126 \nf 114 127 126 \nf 114 115 127 \nf 115 128 127 \nf 115 116 128 \nf 116 129 128 \nf 116 117 129 \nf 117 130 129 \nf 117 118 130 \nf 118 131 130 \nf 118 119 131 \nf 119 132 131 \nf 119 120 132 \nf 120 122 132 \nf 120 110 122 \nf 122 133 134 \nf 122 121 133 \nf 121 135 133 \nf 121 123 135 \nf 123 136 135 \nf 123 124 136 \nf 124 137 136 \nf 124 125 137 \nf 125 138 137 \nf 125 126 138 \nf 126 139 138 \nf 126 127 139 \nf 127 140 139 \nf 127 128 140 \nf 128 141 140 \nf 128 129 141 \nf 129 142 141 \nf 129 130 142 \nf 130 143 142 \nf 130 131 143 \nf 131 144 143 \nf 131 132 144 \nf 132 134 144 \nf 132 122 134 \nf 134 145 146 \nf 134 133 145 \nf 133 147 145 \nf 133 135 147 \nf 135 148 147 \nf 135 136 148 \nf 136 149 148 \nf 136 137 149 \nf 137 150 149 \nf 137 138 150 \nf 138 151 150 \nf 138 139 151 \nf 139 152 151 \nf 139 140 152 \nf 140 153 152 \nf 140 141 153 \nf 141 154 153 \nf 141 142 154 \nf 142 155 154 \nf 142 143 155 \nf 143 156 155 \nf 143 144 156 \nf 144 146 156 \nf 144 134 146 \nf 146 157 158 \nf 146 145 157 \nf 145 159 157 \nf 145 147 159 \nf 147 160 159 \nf 147 148 160 \nf 148 161 160 \nf 148 149 161 \nf 149 162 161 \nf 149 150 162 \nf 150 163 162 \nf 150 151 163 \nf 151 164 163 \nf 151 152 164 \nf 152 165 164 \nf 152 153 165 \nf 153 166 165 \nf 153 154 166 \nf 154 167 166 \nf 154 155 167 \nf 155 168 167 \nf 155 156 168 \nf 156 158 168 \nf 156 146 158 \nf 158 169 170 \nf 158 157 169 \nf 157 171 169 \nf 157 159 171 \nf 159 172 171 \nf 159 160 172 \nf 160 173 172 \nf 160 161 173 \nf 161 174 173 \nf 161 162 174 \nf 162 175 174 \nf 162 163 175 \nf 163 176 175 \nf 163 164 176 \nf 164 177 176 \nf 164 165 177 \nf 165 178 177 \nf 165 166 178 \nf 166 179 178 \nf 166 167 179 \nf 167 180 179 \nf 167 168 180 \nf 168 170 180 \nf 168 158 170 \nf 170 181 182 \nf 170 169 181 \nf 169 183 181 \nf 169 171 183 \nf 171 184 183 \nf 171 172 184 \nf 172 185 184 \nf 172 173 185 \nf 173 186 185 \nf 173 174 186 \nf 174 187 186 \nf 174 175 187 \nf 175 188 187 \nf 175 176 188 \nf 176 189 188 \nf 176 177 189 \nf 177 190 189 \nf 177 178 190 \nf 178 191 190 \nf 178 179 191 \nf 179 192 191 \nf 179 180 192 \nf 180 182 192 \nf 180 170 182 \nf 182 193 194 \nf 182 181 193 \nf 181 195 193 \nf 181 183 195 \nf 183 196 195 \nf 183 184 196 \nf 184 197 196 \nf 184 185 197 \nf 185 198 197 \nf 185 186 198 \nf 186 199 198 \nf 186 187 199 \nf 187 200 199 \nf 187 188 200 \nf 188 201 200 \nf 188 189 201 \nf 189 202 201 \nf 189 190 202 \nf 190 203 202 \nf 190 191 203 \nf 191 204 203 \nf 191 192 204 \nf 192 194 204 \nf 192 182 194 \nf 194 205 206 \nf 194 193 205 \nf 193 207 205 \nf 193 195 207 \nf 195 208 207 \nf 195 196 208 \nf 196 209 208 \nf 196 197 209 \nf 197 210 209 \nf 197 198 210 \nf 198 211 210 \nf 198 199 211 \nf 199 212 211 \nf 199 200 212 \nf 200 213 212 \nf 200 201 213 \nf 201 214 213 \nf 201 202 214 \nf 202 215 214 \nf 202 203 215 \nf 203 216 215 \nf 203 204 216 \nf 204 206 216 \nf 204 194 206 \nf 206 217 218 \nf 206 205 217 \nf 205 219 217 \nf 205 207 219 \nf 207 220 219 \nf 207 208 220 \nf 208 221 220 \nf 208 209 221 \nf 209 222 221 \nf 209 210 222 \nf 210 223 222 \nf 210 211 223 \nf 211 224 223 \nf 211 212 224 \nf 212 225 224 \nf 212 213 225 \nf 213 226 225 \nf 213 214 226 \nf 214 227 226 \nf 214 215 227 \nf 215 228 227 \nf 215 216 228 \nf 216 218 228 \nf 216 206 218 \nf 218 229 230 \nf 218 217 229 \nf 217 231 229 \nf 217 219 231 \nf 219 232 231 \nf 219 220 232 \nf 220 233 232 \nf 220 221 233 \nf 221 234 233 \nf 221 222 234 \nf 222 235 234 \nf 222 223 235 \nf 223 236 235 \nf 223 224 236 \nf 224 237 236 \nf 224 225 237 \nf 225 238 237 \nf 225 226 238 \nf 226 239 238 \nf 226 227 239 \nf 227 240 239 \nf 227 228 240 \nf 228 230 240 \nf 228 218 230 \nf 230 241 242 \nf 230 229 241 \nf 229 243 241 \nf 229 231 243 \nf 231 244 243 \nf 231 232 244 \nf 232 245 244 \nf 232 233 245 \nf 233 246 245 \nf 233 234 246 \nf 234 247 246 \nf 234 235 247 \nf 235 248 247 \nf 235 236 248 \nf 236 249 248 \nf 236 237 249 \nf 237 250 249 \nf 237 238 250 \nf 238 251 250 \nf 238 239 251 \nf 239 252 251 \nf 239 240 252 \nf 240 242 252 \nf 240 230 242 \nf 242 253 254 \nf 242 241 253 \nf 241 255 253 \nf 241 243 255 \nf 243 256 255 \nf 243 244 256 \nf 244 257 256 \nf 244 245 257 \nf 245 258 257 \nf 245 246 258 \nf 246 259 258 \nf 246 247 259 \nf 247 260 259 \nf 247 248 260 \nf 248 261 260 \nf 248 249 261 \nf 249 262 261 \nf 249 250 262 \nf 250 263 262 \nf 250 251 263 \nf 251 264 263 \nf 251 252 264 \nf 252 254 264 \nf 252 242 254 \nf 254 265 266 \nf 254 253 265 \nf 253 267 265 \nf 253 255 267 \nf 255 268 267 \nf 255 256 268 \nf 256 269 268 \nf 256 257 269 \nf 257 270 269 \nf 257 258 270 \nf 258 271 270 \nf 258 259 271 \nf 259 272 271 \nf 259 260 272 \nf 260 273 272 \nf 260 261 273 \nf 261 274 273 \nf 261 262 274 \nf 262 275 274 \nf 262 263 275 \nf 263 276 275 \nf 263 264 276 \nf 264 266 276 \nf 264 254 266 \nf 266 277 278 \nf 266 265 277 \nf 265 279 277 \nf 265 267 279 \nf 267 280 279 \nf 267 268 280 \nf 268 281 280 \nf 268 269 281 \nf 269 282 281 \nf 269 270 282 \nf 270 283 282 \nf 270 271 283 \nf 271 284 283 \nf 271 272 284 \nf 272 285 284 \nf 272 273 285 \nf 273 286 285 \nf 273 274 286 \nf 274 287 286 \nf 274 275 287 \nf 275 288 287 \nf 275 276 288 \nf 276 278 288 \nf 276 266 278 \nf 278 4 1 \nf 278 277 4 \nf 277 6 4 \nf 277 279 6 \nf 279 8 6 \nf 279 280 8 \nf 280 10 8 \nf 280 281 10 \nf 281 12 10 \nf 281 282 12 \nf 282 14 12 \nf 282 283 14 \nf 283 16 14 \nf 283 284 16 \nf 284 18 16 \nf 284 285 18 \nf 285 20 18 \nf 285 286 20 \nf 286 22 20 \nf 286 287 22 \nf 287 24 22 \nf 287 288 24 \nf 288 1 24 \nf 288 278 1 \n"
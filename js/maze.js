var ctx, stolpci, vrstice, w=30, mazeSize=600;
var grid= [];
var current;
var stack= [];
var player;
var keepTraceMark= false, won= false;
var showAllGrid= true, showFruits=false, lightWidth=5, lightOpaciry=255, totalMaps=1;
var soundFruit1= null, soundFruit2=null, soundFruitM1=null, soundFruitMap=null;
var showCreatMaze= false, screenShotTaken=0 ;
var timeStart=0, timeNow=0, winTime=0, mute= false;
var drone, showPath;

function setup() {
	
	ctx = createCanvas(mazeSize-(mazeSize-(floor(mazeSize/w)*w))+1,mazeSize-(mazeSize-(floor(mazeSize/w)*w))+1);
	ctx.parent('canvasContainer');
	stolpci=Math.floor(mazeSize/w);
	vrstice=Math.floor(mazeSize/w);
	for(j=0; j<vrstice; j++) {
		for(i=0; i<stolpci; i++) {
			var cell= new Cell(i,j);
			grid.push(cell);
		}
	}
	current= grid[0];
	try{
		soundFruit1= new Audio('res/fruit1.ogg');
		soundFruit2= new Audio('res/fruit2.wav');
		soundFruitM1= new Audio('res/fruitm1.wav');
		soundFruitMap= new Audio('res/fruitmap.wav');
	}
	catch(e) {
		console.error('Unable to load sound');
	}

	player= new bot(stolpci-1, vrstice-1);

	//frameRate(.5);
}

function draw() {
	background(51);

		for(var i=0; i<grid.length; i++) {
			grid[i].show();
		}

		if(!showAllGrid) {
			hideOtherGrids(lightWidth);
		}

	player.show();

	if(player.hasFruit()) {
		player.eatFruit();
	}

	if(player.hasMap()) {
		totalMaps++;
	}

	if(lightWidth>5) {
		lightWidth-=.008;
	}
	else if(lightWidth<5) {
		lightWidth+=.005;
	}
	if(lightOpaciry<255) {
		lightOpaciry+=.5;
	}

	if(!showCreatMaze) {
		makeMaze();
		showCreatMaze= true;
	}

	if(timeStart>0)
		timeNow= Math.floor((millis()-timeStart)/1000);
	drawExtra();

	if(showPath) {
		drone.show();
	}



	if(current) {

		current.visited= true;
		current.highLight();
		var next= current.cheakNeighbors();
		if(next) {
			next.visited= true;

			stack.push(current);

			removeWall(current, next);

			current= next;
		}
		else if(stack.length>0){
			var cell= stack.pop();
			current= cell;
		}
		else {
			current= null;
			next= null;
			showAllGrid= false;
			showFruits= true;
			lightWidth=6;
		}
	}
}

function makeMaze() {
	while(current) {

		current.visited= true;
		var next= current.cheakNeighbors();
		if(next) {
			next.visited= true;

			stack.push(current);

			removeWall(current, next);

			current= next;
		}
		else if(stack.length>0){
			var cell= stack.pop();
			current= cell;
		}
		else {
			current= null;
			next= null;
			showAllGrid= false;
			showFruits= true;
			lightWidth=6;
		}
	}
}

function keyPressed() {

	if(keyCode==27) { // esc 
		won = true;
	}

	if(won) {
		
		var score=Math.floor((stolpci+1) * (vrstice+1)-player.totalSteps-winTime +(40*totalMaps));
		Swal.fire({
			html: '<span style="color:white; font-weight: bold; font-size: 20px;line-height:2;">GREATE JOB</span><br /><span style="color:white;line-height:0.8;">Total Steps: '+player.totalSteps+'</span><br /><span style="color:white;line-height:0.8;">Finish time: '+timeNow+'s</span><br /><span style="color:white;line-height:0.8;">Score: '+score+'</span>',
			icon: "success",
			allowOutsideClick:false,
			allowEscapeKey:false,
			allowEnterKey:false,
			background:'rgb(61,61,61)',
			backdrop: 'rgba(12, 12, 12, 0.7)',
			confirmButtonColor:'rgb(30,30,30)',
			confirmButtonText:'play again'
		  })
		  .then((playAgain)=>{
			  if(true){
				location.reload();  
			  }
		  });	
		score++;
		return ;
	}
	else {
		if(timeStart==0) {
			timeStart= millis();
		}
	}

	if(keyCode==38) { //arrow-up
		player.moveUp();
	}
	else if(keyCode==39) { //arrow-right
		player.moveRight();
	}
	else if(keyCode==40) { //arrow-down
		player.moveDown();
	}
	else if(keyCode==37) { //arrow-left
		player.moveLeft();
	}
	
	if(keyCode== 32) { //space
		if(totalMaps>0) {
			totalMaps--;
			lightOpaciry=0;
		}
	}
	else if(keyCode==84) { //t
		if(keepTraceMark)
			keepTraceMark= false;
		else
			keepTraceMark= true;
		grid[index(player.x, player.y)].walked= false;
	}
	else if(keyCode== 77) { //m
		if(mute)
			mute= false;
		else
			mute= true;
	}
}


function drawExtra() {
	fill(51);
	strokeWeight(2);
	stroke(255);
	if(!won) {
		line(4, 4, w-4, w-4);
		line(w-4, 4, 4, w-4);
	}

	document.getElementById("steps").textContent="Steps: "+player.totalSteps;
	document.getElementById("time").textContent="Time: "+timeNow+"s";
	document.getElementById("highlights").textContent="Highlights (SPACE): "+totalMaps;
	
	
	if(mute) {
		document.getElementById("mute").textContent="Mute (M): On ";
	}
	else {	
		document.getElementById("mute").textContent="Mute (M): Off";
	}

	if(keepTraceMark) {
		document.getElementById("trace").textContent="Trace (T): On";
	}
	else {
		document.getElementById("trace").textContent="Trace (T): Off";
	}

}

function Cell(i, j ) {
	this.i=i;
	this.j=j;
	var x=this.i*w;
	var y=this.j*w;
	this.walls=[true, true, true, true];
	this.visited=false;

	this.walked= false;
	this.hasFruit= 0;
	this.hasMap= false;

	var r= Math.floor(random(60))
	if(r<5 && (i!=0 || j!=0)) {
		if(r==4) {
			this.hasFruit= 2;
		}
		else if(r==2 || r==3) {
			this.hasFruit= 1;
		}
		else {
			this.hasFruit= -1;
		}
	}
	else {
		if(random(100)<1)
			if(this.i!=0 || this.j!=0)
				if(this.i!=stolpci-1 || this.j!=vrstice-1)
					this.hasMap= true;
	}


	this.show= function() {
		stroke(255);
		if(this.walls[0])
			line(x, y, x+w, y);
		if(this.walls[1])
			line(x+w, y, x+w, y+w);
		if(this.walls[2])
			line(x+w, y+w, x, y+w);
		if(this.walls[3])
			line(x, y+w, x, y);

		if(this.visited) {
			noStroke();
			fill(94, 115, 190, 10);
			rect(x, y, w, w );
			if(this.walked) {
				fill(150, 150, 150, 70);
				rect(x+7, y+7, w-14, w-14);
				fill(54, 75, 150, 10);
			}
		}
		if(showFruits && this.hasFruit==2) {
			fill(124, 228, 255, 255);
			ellipse(x+w/2, y+w/2, 10, 10);
		}
		else if(showFruits && this.hasFruit==1) {
			fill(255, 240, 86, 255);
			ellipse(x+w/2, y+w/2, 8.5, 8.5);
		}
		else if(showFruits && this.hasFruit==-1) {
			fill(255, 86, 86, 255);
			ellipse(x+w/2, y+w/2, 7, 7);
		}
		else if(showFruits && this.hasMap) {
			fill(255, 255, 255, 255);
			push();
			rectMode(CENTER);
			translate(x+w/2, y+w/2);
			rotate(PI/4);
			rect(0, 0, w-19, w-19);
			pop();
		}
	}

	this.highLight= function() {
			noStroke();
			fill(0, 200, 100, 100);
			rect(x, y, w, w);
	}

	this.cheakNeighbors= function() {
		var neighbors= [];

		var top= grid[index(i, j-1)];
		var right= grid[index(i+1, j)];
		var bottom= grid[index(i, j+1)];
		var left= grid[index(i-1, j)];

		if(top && !top.visited) {
			neighbors.push(top);
		}
		if(right && !right.visited) {
			neighbors.push(right);
		}
		if(bottom && !bottom.visited) {
			neighbors.push(bottom);
		}
		if(left && !left.visited) {
			neighbors.push(left);
		}

		if(neighbors.length>0){
			var r= Math.floor(random(0, neighbors.length));
			return neighbors[r];
		}
		else {
			return undefined;
		}

	}
}

function index(i, j) {
	if(i<0 || j<0 || i>stolpci-1 || j>vrstice-1)
		return -1;
	return i+(j*stolpci);
}

function removeWall(c, n) {
	var t1= c.i-n.i;
	//console.log(c);
	if(t1=== 1) {
		c.walls[3]= false;
		n.walls[1]= false;
	}
	else if(t1=== -1) {
		c.walls[1]= false;
		n.walls[3]= false;
	}
	var t2= c.j-n.j;
	if(t2=== 1) {
		c.walls[0]= false;
		n.walls[2]= false;
	}
	else if(t2=== -1) {
		c.walls[2]= false;
		n.walls[0]= false;
	}
}


function playSound(track) {
	if(mute) {
		return ;
	}
	var tSound= track.cloneNode();
	tSound.play();
	delete tSound;
}

function bot(x, y) {
	this.x=x;
	this.y=y;
	this.totalSteps=0;

	this.hero= false;
	this.heroGlow=0;

	this.moveRight= function() {
		if(!grid[index(this.x, this.y)].walls[1]){
			this.x++;
			this.totalSteps++;
			this.cheakWin();
			return true;
		}
		else if(this.hero && this.x<(vrstice-1)) {
			grid[index(this.x, this.y)].walls[1]= false;
			grid[index(this.x+1, this.y)].walls[3]= false;
			this.x++;
			this.totalSteps++;
			this.cheakWin();
			return true;
		}
		return false;
	}
	this.moveLeft= function() {
		if(!grid[index(this.x, this.y)].walls[3]) {
			this.x--;
			this.totalSteps++;
			this.cheakWin();
			return true;
		}
		else if(this.hero && this.x>0) {
			grid[index(this.x, this.y)].walls[3]= false;
			grid[index(this.x-1, this.y)].walls[1]= false;
			this.x--;
			this.totalSteps++;
			this.cheakWin();
			return true;
		}
		return false;
	}
	this.moveUp= function() {
		if(!grid[index(this.x, this.y)].walls[0]) {
			this.y--;
			this.totalSteps++;
			this.cheakWin();
			return true;
		}
		else if(this.hero && this.y>0) {
			grid[index(this.x, this.y)].walls[0]= false;
			grid[index(this.x, this.y-1)].walls[2]= false;
			this.y--;
			this.totalSteps++;
			this.cheakWin();
			return true;
		}
		return false;
	}
	this.moveDown= function() {
		if(!grid[index(this.x, this.y)].walls[2]) {
			this.y++;
			this.totalSteps++;
			this.cheakWin();
			return true;
		}
		else if(this.hero && this.y<(stolpci-1)) {
			grid[index(this.x, this.y)].walls[2]= false;
			grid[index(this.x, this.y+1)].walls[0]= false;
			this.y++;
			this.totalSteps++;
			this.cheakWin();
			return true;
		}
		return false;
	}

	this.hasFruit= function() {
		if(grid[index(this.x, this.y)].hasFruit==0)
			return false;
		else
			return true;
	}

	this.eatFruit= function() {
		lightWidth+=grid[index(this.x, this.y)].hasFruit;
		if(soundFruit1 && grid[index(this.x, this.y)].hasFruit==1) {
			playSound(soundFruit1);
		}
		else if(soundFruit2 && grid[index(this.x, this.y)].hasFruit==2) {
			playSound(soundFruit2);
		}
		else if(soundFruitM1 && grid[index(this.x, this.y)].hasFruit==-1) {
			lightWidth-=.5;
			playSound(soundFruitM1);
		}
		grid[index(this.x, this.y)].hasFruit=0;
	}

	this.hasMap= function() {
		if(grid[index(this.x, this.y)].hasMap) {
			if(soundFruitMap) {
				playSound(soundFruitMap);
			}
			grid[index(this.x, this.y)].hasMap= false;
			return true;
		}
		return false;
	}

	this.show= function() {
		if(this.hero) {
			strokeWeight(this.heroGlow%25-10);
			this.heroGlow++;
			stroke(104, 252, 255, 100);
			fill(255, 255, 255, 0);
			ellipse((w*this.x)+w/2, (w*this.y)+w/2, w/2, w/2);
		}

		noStroke();
		fill(255, 255, 255, 200);
		rect((w*this.x)+5, (w*this.y)+5, w-10, w-10);

		if(keepTraceMark) {
			grid[index(this.x, this.y)].walked= true;
		}
	}

	this.cheakWin= function() {
		if(this.x==0 && this.y==0) {
			console.log("won");
			won= true;
			winTime= timeNow;
			timeStart= 0;
			return true;
		}
		won= false;
		return false;
	}

	this.moveTo= function(tx, ty) {
		if((tx>=0 && ty>=0) && (tx<=stolpci-1 && ty<=vrstice-1)) {
			this.x=tx;
			this.y=ty;
			return "Moved...";
		}
		else {
			console.error("Invalid X & Y ...");
			return "Cannot Move...";
		}
	}

	this.showAll= function() {
		if(showAllGrid) {
			showAllGrid= false;
			return("All Grids Have Been Hidden...");
		}
		else {
			showAllGrid= true;
			return("All Grids Have Been Shown...");
		}
	}

	this.findWay= function() {
		if(showPath) {
			showPath= false;
			return "done";
		}
		else {
			drone= new searchBot(this.x, this.y);
			drone.search();
			showPath= true;
			return "Length- " +drone.foundWay.length;
		}
	}
}

function searchBot(x, y) {
	this.x= x;
	this.y= y;

	this.foundWay= [];

	this.poped=false;

	this.canMoveRight= function() {
		if(!grid[index(this.x, this.y)].walls[1]){
			return true;
		}
		return false;
	}
	this.canMoveLeft= function() {
		if(!grid[index(this.x, this.y)].walls[3]) {
			return true;
		}
		return false;
	}
	this.canMoveUp= function() {
		if(!grid[index(this.x, this.y)].walls[0]) {
			return true;
		}
		return false;
	}
	this.canMoveDown= function() {
		if(!grid[index(this.x, this.y)].walls[2]) {
			return true;
		}
		return false;
	}

	this.show= function() {
		if(this.foundWay.length>0) {
			for(var i=0; i<this.foundWay.length-1; i++) {
				var cx= this.foundWay[i]%vrstice;
				var cy= Math.floor(this.foundWay[i]/vrstice);
				var nx= this.foundWay[i+1]%vrstice;
				var ny= Math.floor(this.foundWay[i+1]/vrstice);
				var px= this.foundWay[i-1]%vrstice;
				var py= Math.floor(this.foundWay[i-1]/vrstice);

				stroke(255, 255, 255, 40);
				strokeWeight(1);
				fill(0,0,0,0);

				if(cy==ny && cy==py) {
					line(cx*w, cy*w+w/2, (cx+1)*w, cy*w+w/2);
				}
				else if(cx==nx && cx==px) {
					line(cx*w+w/2, cy*w, cx*w+w/2, (cy+1)*w);
				}
				else if((nx-cx==1 && cy-py==1) || (ny-cy==-1 && cx-px==-1)) { //For Lower Left
					line(cx*w+w/2, cy*w, cx*w+w/2, cy*w+w/2);
					line(cx*w+w/2, cy*w+w/2, (cx+1)*w, cy*w+w/2);
				}
				else if((nx-cx==-1 && cy-py==1) || (ny-cy==-1 && cx-px==1)) { //For Lower Right
					line(cx*w+w/2, cy*w, cx*w+w/2, cy*w+w/2);
					line(cx*w+w/2, cy*w+w/2, cx*w, cy*w+w/2);
				}
				else if((nx-cx==1 && cy-py==-1) || (ny-cy==1 && cx-px==-1)) { //For Upper Left
					line(cx*w+w/2, cy*w+w/2, (cx+1)*w, cy*w+w/2);
					line(cx*w+w/2, cy*w+w/2, cx*w+w/2, (cy+1)*w);
				}
				else if((nx-cx==-1 && cy-py==-1) || (ny-cy==1 && cx-px==1)) { //For Upper Right
					line(cx*w, cy*w+w/2, cx*w+w/2, cy*w+w/2);		
					line(cx*w+w/2, cy*w+w/2, cx*w+w/2, (cy+1)*w);
				}
			}
		}
	}

}

function hideOtherGrids(n) {
	var cx= (w*player.x)+(w/2);
	var cy= (w*player.y)+(w/2);
	var toHide=10000;
	strokeWeight(toHide);
	stroke(51, 51, 51, Math.ceil(lightOpaciry));
	fill(0, 0, 0, 0);
	ellipse(cx, cy, toHide+n*w, toHide+n*w);
}

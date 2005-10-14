dojo.provide("dojo.widget.FisheyeList");
dojo.provide("dojo.widget.HtmlFisheyeList");
dojo.provide("dojo.widget.HtmlFisheyeListItem");

//
// TODO
// deal with moving/resizing correctly
// fix really long labels in vertical mode
// create widget correctly from source
// allow proper styling of widget
//

dojo.require("dojo.widget.*");
dojo.require("dojo.dom");

dojo.widget.HtmlFisheyeList = function() {

	dojo.widget.HtmlWidget.call(this);

	this.templateCssPath = dojo.uri.dojoUri("src/widget/templates/HtmlFisheyeList.css");
	this.widgetType = "FisheyeList";

	this.EDGE_CENTER = 0;
	this.EDGE_LEFT   = 1;
	this.EDGE_RIGHT  = 2;
	this.EDGE_TOP    = 3;
	this.EDGE_BOTTOM = 4;

	//this.isContainer = true;
	//this.containerNode = ...something...;

	/////////////////////////////////////////////////////////////////
	//
	// i spy OPTIONS!!!!
	//

	this.itemWidth  = 40;
	this.itemHeight = 40;

	this.itemMaxWidth  = 150;
	this.itemMaxHeight = 150;

	this.orientation = 'horizontal';

	this.effectUnits = 2;
	this.itemPadding = 10;

	this.attachEdge = 'center';
	this.labelEdge = 'bottom';

	//
	//
	//
	/////////////////////////////////////////////////////////////////

	this.buildRendering = function(args, frag) {

		//dojo.debug(this.orientation);

		var self = this;

		if (this.templateCssPath) {
			dojo.style.insertCssFile(this.templateCssPath, null, true);
		}

		this.domNode = frag["dojo:"+this.widgetType.toLowerCase()]["nodeRef"];
		this.domNode.style.display = 'none';

		this.isHorizontal = (this.orientation == 'horizontal') ? 1 : 0;
		this.selectedNode = -1;

		this.isOver = 0;
		this.hitX1 = -1;
		this.hitY1 = -1;
		this.hitX2 = -1;
		this.hitY2 = -1;


		//
		// only some edges make sense...
		//

		this.anchorEdge = this.toEdge(this.attachEdge, this.EDGE_CENTER);
		this.labelEdge  = this.toEdge(this.labelEdge,  this.EDGE_TOP);

		if ( this.isHorizontal && (this.anchorEdge == this.EDGE_LEFT  )) this.anchorEdge = this.EDGE_CENTER;
		if ( this.isHorizontal && (this.anchorEdge == this.EDGE_RIGHT )) this.anchorEdge = this.EDGE_CENTER;
		if (!this.isHorizontal && (this.anchorEdge == this.EDGE_TOP   )) this.anchorEdge = this.EDGE_CENTER;
		if (!this.isHorizontal && (this.anchorEdge == this.EDGE_BOTTOM)) this.anchorEdge = this.EDGE_CENTER;

		if (this.labelEdge == this.EDGE_CENTER){ this.labelEdge = this.EDGE_TOP; }
		if ( this.isHorizontal && (this.labelEdge == this.EDGE_LEFT  )){ this.labelEdge = this.EDGE_TOP; }
		if ( this.isHorizontal && (this.labelEdge == this.EDGE_RIGHT )){ this.labelEdge = this.EDGE_TOP; }
		if (!this.isHorizontal && (this.labelEdge == this.EDGE_TOP   )){ this.labelEdge = this.EDGE_LEFT; }
		if (!this.isHorizontal && (this.labelEdge == this.EDGE_BOTTOM)){ this.labelEdge = this.EDGE_LEFT; }


		//
		// figure out the proximity size
		//

		this.proximityLeft   = this.itemWidth  * (this.effectUnits - 0.5);
		this.proximityRight  = this.itemWidth  * (this.effectUnits - 0.5);
		this.proximityTop    = this.itemHeight * (this.effectUnits - 0.5);
		this.proximityBottom = this.itemHeight * (this.effectUnits - 0.5);


		if (this.anchorEdge == this.EDGE_LEFT){
			this.proximityLeft = 0;
		}
		if (this.anchorEdge == this.EDGE_RIGHT){
			this.proximityRight = 0;
		}
		if (this.anchorEdge == this.EDGE_TOP){
			this.proximityTop = 0;
		}
		if (this.anchorEdge == this.EDGE_BOTTOM){
			this.proximityBottom = 0;
		}
		if (this.anchorEdge == this.EDGE_CENTER){
			this.proximityLeft   /= 2;
			this.proximityRight  /= 2;
			this.proximityTop    /= 2;
			this.proximityBottom /= 2;
		}


		//
		// find the items
		//

		this.items = [];

		var c = 0;

		var subs = this.domNode.getElementsByTagName("div");
		for(var i=0; i<subs.length; i++){

			if (dojo.dom.getTagName(subs[i]) == 'dojo:fisheyelistitem'){

				//
				// we've found a list item - create it
				//

				var item = new Object();

				item.index = c++;
				item.srcDiv = subs[i];
				item.labelText = null;


				//
				// find the img node
				//

				item.imgNode = item.srcDiv.getElementsByTagName('img')[0];

				if (item.imgNode){

					//
					// find a label if one exists
					//

					item.labelNode = item.srcDiv.getElementsByTagName('label')[0];
					if (item.labelNode){

						item.labelText = dojo.dom.textContent(item.labelNode);
					}

					//dojo.debug(item.imgNode.src + " : " + item.labelText);

					this.items[item.index] = item;

				}else{
					dojo.debug("can't find an img node inside this dojo:fisheyelisitem");
				}
			}
		}


		this.itemCount = this.items.length;

		this.barWidth  = (this.isHorizontal ? this.itemCount : 1) * this.itemWidth;
		this.barHeight = (this.isHorizontal ? 1 : this.itemCount) * this.itemHeight;

		this.totalWidth  = this.proximityLeft + this.proximityRight  + this.barWidth;
		this.totalHeight = this.proximityTop  + this.proximityBottom + this.barHeight;


		//
		// calculate effect ranges for each item
		//

		for (var i=0; i<this.itemCount; i++){

			this.items[i].posX = this.itemWidth  * (this.isHorizontal ? i : 0);
			this.items[i].posY = this.itemHeight * (this.isHorizontal ? 0 : i);

			this.items[i].cenX = this.items[i].posX + (this.itemWidth  / 2);
			this.items[i].cenY = this.items[i].posY + (this.itemHeight / 2);

			var isz = this.isHorizontal ? this.itemWidth : this.itemHeight;
			var r = this.effectUnits * isz;
			var c = this.isHorizontal ? this.items[i].cenX : this.items[i].cenY;
			var lhs = this.isHorizontal ? this.proximityLeft : this.proximityTop;
			var rhs = this.isHorizontal ? this.proximityRight : this.proximityBottom;
			var siz = this.isHorizontal ? this.barWidth : this.barHeight;

			var range_lhs = r;
			var range_rhs = r;

			if (range_lhs > c+lhs){ range_lhs = c+lhs; }
			if (range_rhs > (siz-c+rhs)){ range_rhs = siz-c+rhs; }

			this.items[i].effectRangeLeft = range_lhs / isz;
			this.items[i].effectRangeRght = range_rhs / isz;

			//dojo.debug('effect range for '+i+' is '+range_lhs+'/'+range_rhs);
		}


		//
		// create the bar
		//

		this.barElm = document.createElement('div');
		this.barElm.style.position = 'relative';
		this.barElm.style.left = '0px';
		this.barElm.style.top = '0px';
		this.barElm.style.width = this.barWidth + 'px';
		this.barElm.style.height = this.barHeight + 'px';
		this.barElm.style.border = '1px solid blue';

		dojo.dom.insertAfter(this.barElm, this.domNode);


		//
		// create the listitems
		//

		for (var i=0; i<this.itemCount; i++){

			var itm = this.items[i];

			var elm = document.createElement('div');
			elm.style.position = 'absolute';
			elm.style.left   = itm.posX + 'px';
			elm.style.top    = itm.posY + 'px';
			elm.style.width  = this.itemWidth + 'px';
			elm.style.height = this.itemHeight + 'px';
			//elm.style.backgroundColor = (i%2==0)?'#eee':'#ccc';
			//elm.appendChild(document.createTextNode('ITEM '+i));			
			elm.style.zIndex = 2;

			itm.elm = elm;

			this.barElm.appendChild(elm);


			//
			// create the 'a' tags
			//

			itm.linkNode = document.createElement('a');
			itm.linkNode.href = "#"+i;
			itm.linkNode.onclick = (function(){ var src=itm.srcDiv.getAttribute("onclickicon"); return function(){ eval(src); return false; }})();
			elm.appendChild(itm.linkNode);


			//
			// move the img tag around
			//

			dojo.dom.removeNode(itm.imgNode);
			itm.linkNode.appendChild(itm.imgNode);

			itm.imgNode.style.position = 'absolute';
			itm.imgNode.style.left = this.itemPadding+'%';
			itm.imgNode.style.top = this.itemPadding+'%';
			itm.imgNode.style.width = (100 - 2 * this.itemPadding) + '%';
			itm.imgNode.style.heigh = (100 - 2 * this.itemPadding) + '%';
			itm.imgNode.style.border = '0px';


			//
			// create a label
			//

			if (itm.labelText){

				itm.hasLabel = 1;

				itm.lblNode = document.createElement('div');
				itm.lblNode.style.position = 'absolute';
				//itm.lblNode.style.backgroundColor = 'pink';
				itm.lblNode.style.left   = '0px';
				itm.lblNode.style.top    = '0px';
				itm.lblNode.appendChild(document.createTextNode(itm.labelText));

				this.barElm.appendChild(itm.lblNode);

				itm.labelW = itm.lblNode.offsetWidth;
				itm.labelH = itm.lblNode.offsetHeight;

				itm.lblNode.style.width = itm.labelW + 'px';
				itm.lblNode.style.height = itm.labelH + 'px';
				itm.lblNode.style.top = -itm.labelH + 'px';
				itm.lblNode.style.display = 'none';

				elm.appendChild(itm.lblNode);


				//
				// set up label handlers
				//

				var h1 = (function(){ var node = itm.lblNode; return function(){ node.style.display = 'block'; } })();
				var h2 = (function(){ var node = itm.lblNode; return function(){ node.style.display = 'none'; } })();

				dojo.event.connect(itm.imgNode, "onmouseover", h1);
				dojo.event.connect(itm.imgNode, "onmouseout",  h2);

			}else{
				itm.hasLabel = 0;
			}
			
		}


		//
		// calc the grid
		//

		this.calcHitGrid();

		//this.debugElm = document.createElement('div');
		//this.debugElm.appendChild(document.createTextNode('DEBUGGER!'));
		//dojo.dom.insertAfter(this.debugElm, this.barElm);


		//
		// connect the event proc
		//

		dojo.event.connect(document.documentElement, "onmousemove", function(e) {

			var p = self.getCursorPos(e);

			if ((p.x >= self.hitX1) && (p.x <= self.hitX2) &&
				(p.y >= self.hitY1) && (p.y <= self.hitY2)){

				self.isOver = 1;
				self.onGridMouseMove(p.x-self.hitX1, p.y-self.hitY1);
			}else{
				if (self.isOver){
					self.isOver = 0;
					self.onGridMouseMove(-1, -1);
				}
			}

		});
	}

	this.onGridMouseMove = function(x, y){

		//
		// figure out our main index
		//

		var pos = this.isHorizontal ? x : y;
		var prx = this.isHorizontal ? this.proximityLeft : this.proximityTop;
		var siz = this.isHorizontal ? this.itemWidth : this.itemHeight;
		var sim = this.isHorizontal ? this.itemMaxWidth : this.itemMaxHeight;

		var cen = ((pos - prx) / siz) - 0.5;
		var max_off_cen = (sim / siz) - 0.5;

		if (max_off_cen > this.effectUnits){ max_off_cen = this.effectUnits; }


		//
		// figure out our off-axis weighting
		//

		var off_weight = 0;

		if (this.anchorEdge == this.EDGE_BOTTOM){
			var cen2 = (y - this.proximityTop) / this.itemHeight;
			off_weight = (cen2 > 0.5) ? 1 : y / (this.proximityTop + (this.itemHeight / 2));
		}
		if (this.anchorEdge == this.EDGE_TOP){
			var cen2 = (y - this.proximityTop) / this.itemHeight;
			off_weight = (cen2 < 0.5) ? 1 : (this.totalHeight - y) / (this.proximityBottom + (this.itemHeight / 2));
		}
		if (this.anchorEdge == this.EDGE_RIGHT){
			var cen2 = (x - this.proximityLeft) / this.itemWidth;
			off_weight = (cen2 > 0.5) ? 1 : x / (this.proximityLeft + (this.itemWidth / 2));
		}
		if (this.anchorEdge == this.EDGE_LEFT){
			var cen2 = (x - this.proximityLeft) / this.itemWidth;
			off_weight = (cen2 < 0.5) ? 1 : (this.totalWidth - x) / (this.proximityRight + (this.itemWidth / 2));
		}
		if (this.anchorEdge == this.EDGE_CENTER){

			if (this.isHorizontal){
				off_weight = y / (this.totalHeight);
			}else{
				off_weight = x / (this.totalWidth);
			}

			if (off_weight > 0.5){
				off_weight = 1 - off_weight;
			}

			off_weight *= 2;
		}


		//
		// set the sizes
		//

		for(var i=0; i<this.itemCount; i++){

			var weight = this.weightAt(cen, i);

			if (weight < 0){weight = 0;}

			this.setItemSize(i, weight * off_weight);
		}


		//
		// set the positions
		//

		var main_p = Math.round(cen);
		var offset = 0;

		if (cen < 0){
			main_p = 0;

		}else if (cen > this.itemCount - 1){

			main_p = this.itemCount -1;

		}else{

			offset = (cen - main_p) * ((this.isHorizontal ? this.itemWidth : this.itemHeight) - this.items[main_p].sizeMain);
		}

		this.positionElementsFrom(main_p, offset);
	}

	this.weightAt = function(cen, i){

		var dist = Math.abs(cen - i);

		var limit = ((cen - i) > 0) ? this.items[i].effectRangeRght : this.items[i].effectRangeLeft;

		return (dist > limit) ? 0 : (1 - dist / limit);
	}

	this.positionFromNode = function(p, w){

		//
		// we need to grow all the nodes growing out from node 'i'
		//

		this.setItemSize(p, w);

		var wx = w;
		for(var i=p; i<this.itemCount; i++){
			wx = 0.8 * wx;
			this.setItemSize(i, wx);
		}

		var wx = w;
		for(var i=p; i>=0; i--){
			wx = 0.8 * wx;
			this.setItemSize(i, wx);
		}
	}



	this.setItemSize = function(p, scale){

		var w = Math.round(this.itemWidth  + ((this.itemMaxWidth  - this.itemWidth ) * scale));
		var h = Math.round(this.itemHeight + ((this.itemMaxHeight - this.itemHeight) * scale));

		if (this.isHorizontal){

			this.items[p].sizeW = w;
			this.items[p].sizeH = h;

			this.items[p].sizeMain = w;
			this.items[p].sizeOff  = h;

			var y = 0;

			if (this.anchorEdge == this.EDGE_TOP){

				y = (this.items[p].cenY - (this.itemHeight / 2));

			}else if (this.anchorEdge == this.EDGE_BOTTOM){

				y = (this.items[p].cenY - (h - (this.itemHeight / 2)));

			}else{

				y = (this.items[p].cenY - (h / 2));
			}

			this.items[p].usualX = Math.round(this.items[p].cenX - (w / 2));
			this.items[p].elm.style.top  = y + 'px';

			this.items[p].elm.style.left  = this.items[p].usualX + 'px';

		}else{

			this.items[p].sizeW = w;
			this.items[p].sizeH = h;

			this.items[p].sizeOff  = w;
			this.items[p].sizeMain = h;

			var x = 0;

			if (this.anchorEdge == this.EDGE_LEFT){

				x = this.items[p].cenX - (this.itemWidth / 2);

			}else if (this.anchorEdge == this.EDGE_RIGHT){

				x = this.items[p].cenX - (w - (this.itemWidth / 2));
			}else{

				x = this.items[p].cenX - (w / 2);
			}

			this.items[p].elm.style.left = x + 'px';
			this.items[p].usualY = Math.round(this.items[p].cenY - (h / 2));

			this.items[p].elm.style.top  = this.items[p].usualY + 'px';
		}

		this.items[p].elm.style.width  = w + 'px';
		this.items[p].elm.style.height = h + 'px';

		//this.setLabelPosition(this.items[p]);
	}


	this.positionElementsFrom = function(p, offset){

		var pos = 0;

		if (this.isHorizontal){
			pos = Math.round(this.items[p].usualX + offset);
			this.items[p].elm.style.left = pos + 'px';
		}else{
			pos = Math.round(this.items[p].usualY + offset);
			this.items[p].elm.style.top = pos + 'px';
		}
		this.positionLabel(p);


		//
		// position before
		//

		var bpos = pos;

		for(var i=p-1; i>=0; i--){

			bpos -= this.items[i].sizeMain;

			if (this.isHorizontal){
				this.items[i].elm.style.left = bpos + 'px';
			}else{
				this.items[i].elm.style.top = bpos + 'px';
			}
			this.positionLabel(i);
		}

		//
		// position after
		//

		var apos = pos;

		for(var i=p+1; i<this.itemCount; i++){

			apos += this.items[i-1].sizeMain;

			if (this.isHorizontal){
				this.items[i].elm.style.left = apos + 'px';
			}else{
				this.items[i].elm.style.top = apos + 'px';
			}
			this.positionLabel(i);
		}

	}

	this.positionLabel = function(i){
		if (!this.items[i].hasLabel){ return; }
		if (this.items[i].lblNode.style.display == 'none'){ return; }

		this.setLabelPosition(this.items[i]);
	}

	this.setLabelPosition = function(itm){

		if (!itm.hasLabel){ return; }

		var x = 0;
		var y = 0;

		if (this.labelEdge == this.EDGE_TOP){

			x = Math.round((itm.sizeW / 2) - (itm.labelW / 2));
			y = -itm.labelH;
		}

		if (this.labelEdge == this.EDGE_BOTTOM){

			x = Math.round((itm.sizeW / 2) - (itm.labelW / 2));
			y = itm.sizeH;
		}

		if (this.labelEdge == this.EDGE_LEFT){

			x = -itm.labelW;
			y = Math.round((itm.sizeH / 2) - (itm.labelH / 2));
		}

		if (this.labelEdge == this.EDGE_RIGHT){

			x = itm.sizeW;
			y = Math.round((itm.sizeH / 2) - (itm.labelH / 2));
		}

		itm.lblNode.style.left = x + 'px';
		itm.lblNode.style.top  = y + 'px';
	}

	this.findPos = function(obj){

		var x = 0;
		var y = 0;
		if (obj.offsetParent){
			while (obj.offsetParent){
				x += obj.offsetLeft;
				y += obj.offsetTop;
				obj = obj.offsetParent;
			}
		}else{
			if (obj.x) x += obj.x;
			if (obj.y) y += obj.y;
		}

		return {'x':x, 'y':y};
	}

	this.getCursorPos = function(e){

		var x = 0;
		var y = 0;

		if (e.pageX || e.pageY){

			x = e.pageX;
			y = e.pageY;

		}else if (e.clientX || e.clientY){

			x = e.clientX;
			y = e.clientY;

		}else if (e.clientX || e.clientY){

			x = e.clientX;
			y = e.clientY;

			if (this.isIE){

				x += document.body.scrollLeft;
				y += document.body.scrollTop;
			}
		}

		return {'x':x, 'y':y};
	}


	this.calcHitGrid = function(){

		var pos = this.findPos(this.barElm);

		this.hitX1 = pos.x - this.proximityLeft;
		this.hitY1 = pos.y - this.proximityTop;
		this.hitX2 = this.hitX1 + this.totalWidth;
		this.hitY2 = this.hitY1 + this.totalHeight;

		//dojo.debug(this.hitX1+','+this.hitY1+' // '+this.hitX2+','+this.hitY2);
	}

	this.toEdge = function(inp, def){
		var out = def;
		if (inp == 'left'  ){ out = this.EDGE_LEFT;   }
		if (inp == 'right' ){ out = this.EDGE_RIGHT;  }
		if (inp == 'top'   ){ out = this.EDGE_TOP;    }
		if (inp == 'bottom'){ out = this.EDGE_BOTTOM; }
		return out;
	}

	this.debug = function(text){

		dojo.dom.replaceChildren(this.debugElm, document.createTextNode(text));
	}
}

dojo.inherits(dojo.widget.HtmlFisheyeList, dojo.widget.HtmlWidget);

dojo.widget.tags.addParseTreeHandler("dojo:FisheyeList");
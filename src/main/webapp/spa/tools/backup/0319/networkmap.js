class NetworkMap{
	constructor(){
		this.graph=new NetworkMapGraph('network-map-canvas');
		this.grid=new NetworkMapGrid('#networkmap-side-table-domain-grid');
		this.chartUrl=new NetworkMapMenuMap('networkmap-insight-tot-url', 'totUrls');
		// this.chartUrl=new NetworkMapSunBurst('networkmap-insight-tot-url', 'totUrls');
		// this.chartSize=new NetworkMapTreeMap('networkmap-insight-tot-size', 'totSize');
		this.data={};
	}


	init(jobId, harvestResultNumber){
		var sourceUrlDomains="/curator/networkmap/get/common?job=" + jobId + "&harvestResultNumber=" + harvestResultNumber + "&key=keyGroupByDomain";
        var that=this;
        fetch(sourceUrlDomains).then((response) => {
        	// $('#popup-window-loading').hide();

            // console.log(response.status); // Will show you the status

            return response.json();
        })
        .then((data) => {
        	that.formatData(data);
            that.initDraw(data);		 
    	});
	}

	initDraw(node){
		this.graph.draw(node.children);
        this.grid.initialDataGrid(node);

        this.chartUrl.drawContentType(node);
        // this.chartSize.draw(node);
        // Load the Visualization API and the corechart package.
	    // google.charts.load('current', {'packages':['corechart', 'bar']});

	    // Set a callback to run when the Google Visualization API is loaded.
	    // var that=this;
	    // google.charts.setOnLoadCallback(function(){
	    //   chartUrl.draw();
	    //   chartSize.draw();
	    // });
	}

	formatData(node){
		if(!node){
			return;
		}
		this.data[node.id]=node;

		var children=node.children;
		for (var i = 0; i<children.length; i++) {
			this.formatData(children[i]);
		}
	}

	reset(){
		this.switchNode(0);
	}

	switchNode(nodeId){
		var node=this.data[nodeId];
		this._switchNode(node);
	}

	_switchNode(node){
		this.grid.draw(node);
		this.chartUrl.drawContentType(node);
		// this.chartSize.draw(node);

		var title='Root';
		if(node.title){
			title=node.title;
		}

		if(title.length > 50){
			title=title.substr(0, 50) + '...';
		}

		$('#networkmap-side-title').text('Domain: ' + title);
	}
}



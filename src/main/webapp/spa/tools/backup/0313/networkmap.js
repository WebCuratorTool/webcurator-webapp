var chartUrl, chartSize;
class NetworkMap{
	constructor(graphContainer, gridContainer, chartUrlContainer, chartUrlStatusCodeContainer, chartSizeContainer, chartSizeStatusCodeContainer){
		this.graph=new NetworkMapGraph(graphContainer);
		this.grid=new NetworkMapGrid(gridContainer);
		chartUrl=new NetworkMapTreeMap(chartUrlContainer, chartUrlStatusCodeContainer, 'totUrls');
		chartSize=new NetworkMapTreeMap(chartSizeContainer, chartSizeStatusCodeContainer, 'totSize');
		this.data={};
	}


	init=function(jobId, harvestResultNumber){
		var sourceUrlDomains="/curator/networkmap/get/common?job=" + jobId + "&harvestResultNumber=" + harvestResultNumber + "&key=keyGroupByDomain";
        var that=this;
        fetch(sourceUrlDomains)
            .then((response) => {
                // console.log(response.status); // Will show you the status
                return response.json();
            })
            .then((data) => {
            	that.data=that.formatData(data);
                that.initDraw(data);		 
        	});
	}

	initDraw=function(node){
		this.graph.draw(node.children);
        this.grid.initialDataGrid(node);

        chartUrl.setData(node);
        chartSize.setData(node);
        // Load the Visualization API and the corechart package.
	    // google.charts.load('current', {'packages':['corechart', 'bar']});

	    // Set a callback to run when the Google Visualization API is loaded.
	    // var that=this;
	    // google.charts.setOnLoadCallback(function(){
	    //   chartUrl.draw();
	    //   chartSize.draw();
	    // });

	    chartUrl.draw();

	}

	formatData=function(node){
		if(!node){
			return;
		}
		this.data[node.id]=node;

		var children=node.children;
		for (var i = 0; i<children.length; i++) {
			this.formatData(children[i]);
		}
	}
}



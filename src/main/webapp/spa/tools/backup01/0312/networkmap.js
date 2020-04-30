class NetworkMap{
	constructor(graphContainer, gridContainer, chartUrlContainer, chartUrlStatusCodeContainer, chartSizeContainer, chartSizeStatusCodeContainer){
		this.graph=new NetworkMapGraph(graphContainer);
		this.grid=new NetworkMapGrid(gridContainer);
		this.chartUrl=new NetworkMapChart(chartUrlContainer, chartUrlStatusCodeContainer, 'totUrls');
		this.chartSize=new NetworkMapChart(chartSizeContainer, chartSizeStatusCodeContainer, 'totSize');
		this.data={};
	}


	init=function(jobId, harvestResultNumber){
		var sourceUrlDomains="/curator/networkmap/get/common?job=" + jobId + "&harvestResultNumber=" + harvestResultNumber + "&key=keyGroupByDomain";
        var that=this;
        fetch(sourceUrlDomains)
            .then((response) => {
                console.log(response.status); // Will show you the status
                return response.json();
            })
            .then((data) => {
            	that.data=that.formatData(data);
                that.initDraw(data);

                // Load the Visualization API and the corechart package.
        google.charts.load('current', {'packages':['corechart']});

        // Set a callback to run when the Google Visualization API is loaded.
        google.charts.setOnLoadCallback(drawChart);

        // Callback that creates and populates a data table,
        // instantiates the pie chart, passes in the data and
        // draws it.
        function drawChart() {

          // Create the data table.
          var data = new google.visualization.DataTable();
          data.addColumn('string', 'Topping');
          data.addColumn('number', 'Slices');
          data.addRows([
            ['Mushrooms', 3],
            ['Onions', 1],
            ['Olives', 1],
            ['Zucchini', 1],
            ['Pepperoni', 2]
          ]);

          // Set chart options
          var options = {'title':'How Much Pizza I Ate Last Night',
                         'width':400,
                         'height':300};

          // Instantiate and draw our chart, passing in some options.
          var chart = new google.visualization.PieChart(document.getElementById('networkmap-pie-size-contenttype'));
          chart.draw(data, options);
        }


        
        });
	}

	initDraw=function(node){
		this.graph.draw(node.children);
        this.grid.initialDataGrid(node);

        this.chartUrl.draw(node);
        this.chartSize.draw(node);
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
class NetworkMapGrid{
  	constructor(container){
	  	this.container=container;

	  	this.columnDefs = [
			{headerName: "Domain", field: "title", width: 200, pinned: "left"},
			{headerName: "TotSize(Bytes)", field: "totSize", width: 120, filter: 'agNumberColumnFilter'},
			{headerName: "TotSuccess", field: "totSuccess", width: 100, filter: 'agNumberColumnFilter'},
			{headerName: "TotFailed", field: "totFailed", width: 100, filter: 'agNumberColumnFilter'},
			{headerName: "TotURLs", field: "totUrls", width: 100, filter: 'agNumberColumnFilter'}
	    ];

	    this.gridOptions = {
		  // suppressRowClickSelection: true,
		  // rowSelection: 'single',
		  defaultColDef: {
		    resizable: true,
		    filter: true,
		    sortable: true
		  },
		  columnDefs: this.columnDefs,
		  rowData: []
		};
  	}

  	initialDataGrid = function(node){
		// lookup the container we want the Grid to use
		var eGridDiv = document.querySelector(this.container);

		// create the grid passing in the div to use together with the columns & data we want to use
		this.grid = new agGrid.Grid(eGridDiv, this.gridOptions);

		this.draw(node);
	}

	draw = function(node){
		if(!node){
			return;
		}

		var dataset=[];
		if (node.level===0 || node.level===1) {
			dataset=node.children;
		}else{
			dataset.push(node);
		}

		if (this.grid) {
			this.grid.gridOptions.api.setRowData(dataset);
		}
	}
}


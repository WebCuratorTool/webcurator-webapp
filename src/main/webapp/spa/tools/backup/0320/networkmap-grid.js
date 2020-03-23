
class NetworkMapGrid{
  	constructor(container){
	  	this.container=container;

	  	this.columnDefs = [
	  		{headerName: "", width:45, pinned: "left", headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, checkboxSelection: true},
			{headerName: "ContentType", field: "contentType", width: 180},
			{headerName: "StatusCode", field: "statusCode", width: 120, filter: 'agNumberColumnFilter'},
			{headerName: "TotSize", field: "totSize", width: 120, filter: 'agNumberColumnFilter'},
			// {headerName: "TotSuccess", field: "totSuccess", width: 100, filter: 'agNumberColumnFilter'},
			// {headerName: "TotFailed", field: "totFailed", width: 100, filter: 'agNumberColumnFilter'},
			{headerName: "TotURLs", field: "totUrls", width: 100, filter: 'agNumberColumnFilter'}
	    ];

	    this.gridOptions = {
		  // suppressRowClickSelection: true,
		  rowSelection: 'multiple',
		  defaultColDef: {
		    resizable: true,
		    filter: true,
		    sortable: true
		  },
		  columnDefs: this.columnDefs,
		  rowData: []
		};


		this.contextMenuItemsGrid={
		    "modifyHarvestCurrent": {name: "Modify Harvest Current", icon: "far fa-edit"},
		    "modifyHarvestSelected": {name: "Modify Harvest Selected", icon: "fas fa-edit"},
		    "sep1": "---------",
			"urlHierarchyCurrent": {name: "URL Hierarchy Current", icon: "fab fa-think-peaks"},
		    "urlHierarchySelected": {name: "URL Hierarchy Selected", icon: "fab fa-think-peaks"},
		};

		var that=this;
		$.contextMenu({
            selector: that.container + ' .ag-row', 
            callback: function(key, options) {
                var rowId=$(this).attr('row-id');
				that.contentMenuCallback(key, rowId);
            },
            items: that.contextMenuItemsGrid
        });
  	}

  	initialDataGrid(node){
		// lookup the container we want the Grid to use
		var eGridDiv = document.querySelector(this.container);

		// create the grid passing in the div to use together with the columns & data we want to use
		this.grid = new agGrid.Grid(eGridDiv, this.gridOptions);

		this.draw(node);
	}

	draw(statNodes){
		if(!statNodes){
			return;
		}

		var dataMap={};
	    for(var i=0; i<statNodes.statData.length; i++){
	      var statNode=statNodes.statData[i];
	      var contentType=statNode.contentType;
	      var statusCode=statNode.statusCode;

	      var key=contentType + '@' + statusCode;

	      var node=dataMap[key];
	      if(!node){
	      	node={
	      		contentType: contentType,
	      		statusCode: statusCode,
	      		totUrls: 0,
	      		totSize: 0
	      	}
	      	dataMap[key]=node;
	      }

	      node.totUrls=node.totUrls+statNode.totUrls;
	      node.totSize=node.totSize+statNode.totSize;
	    }

		var dataset=[];
		for(var key in dataMap){
			dataset.push(dataMap[key]);
		}

		if (this.grid) {
			this.grid.gridOptions.api.setRowData(dataset);
		}
	}

	contentMenuCallback(operationKey, rowId){
		var rowNode = this.grid.gridOptions.api.getDisplayedRowAtIndex(rowId);
		if (operationKey==='hoppath') {
			fetchHopPath(rowNode.data.id);
		}else if (operationKey==='import') {
			$('#popup-window-import-input').show();
		}
	}
}


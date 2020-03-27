
class NetworkMapGrid{
  	constructor(container, key){
	  	this.container=container;
	  	this.key=key;

	  	var headerNameValue;
	  	if(key === 'statusCode'){
	  		headerNameValue='StatusCode';
	  	}else{
	  		headerNameValue='ContentType';
	  	}

	  	this.columnDefs=[
	  		{headerName: "", width:45, pinned: "left", headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, checkboxSelection: true},
			{headerName: headerNameValue, field: "name", width: 160, filter: 'agNumberColumnFilter'},
			{headerName: "TotSize", field: "totSize", width: 120, type: "numericColumn", filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg},
			{headerName: "TotURLs", field: "totUrls", width: 100, type: "numericColumn", filter: 'agNumberColumnFilter'}
	    ];

	    this.gridOptions = {
		  suppressRowClickSelection: true,
		  rowSelection: 'multiple',
		  defaultColDef: {
		    resizable: true,
		    filter: true,
		    sortable: true
		  },
		  columnDefs: this.columnDefs,
		  rowData: []
		};

		var that=this;
		$.contextMenu({
            selector: that.container + ' .ag-row', 
            callback: function(key, options) {
                var rowId=$(this).attr('row-id');
				that.contentMenuCallback(key, rowId);
            },
            items: NetworkMap.contextMenuItems
        });


        // lookup the container we want the Grid to use
		var eGridDiv = document.querySelector(this.container);

		// create the grid passing in the div to use together with the columns & data we want to use
		this.grid = new agGrid.Grid(eGridDiv, this.gridOptions);
  	}

	draw(dataNode){
		if(!dataNode || !this.grid){
			return;
		}

		var dataset=this.summary(dataNode);
		this.grid.gridOptions.api.setRowData(dataset);
	}

	contentMenuCallback(operationKey, rowId){
		var rowNode = this.grid.gridOptions.api.getDisplayedRowAtIndex(rowId);
		if (operationKey==='hoppath') {
			fetchHopPath(rowNode.data.id);
		}else if (operationKey==='import') {
			$('#popup-window-import-input').show();
		}
	}


	summary(node){
	    var statMap={};
	    for(var i=0; i<node.statData.length; i++){
	      var statNode=node.statData[i];
	      var key=statNode[this.key];
	      var totUrls=statNode['totUrls'];
	      var totSize=statNode['totSize'];

	      var statNode=statMap[key];
	      if(!statNode){
	        statNode={
	          name: key,
	          totUrls: 0,
	          totSize: 0,
	        };
	        statMap[key]=statNode;
	      }
	      statNode.totUrls=statNode.totUrls + totUrls;
	      statNode.totSize=statNode.totSize + totSize;
	    }

	    var statList=[];
	    for(var key in statMap){
	    	statList.push(statMap[key]);
	    }

	    return statList;
	}
}


function renderHopPathIcon(params){
	var id=params.data.id;
	return "<a href='javascript: fetchHopPath(" + id + ");'><i class='fas fa-link'></i></a>";
}

var gridOptionsCandidate={
	suppressRowClickSelection: true,
	rowSelection: 'multiple',
	defaultColDef: {
		resizable: true,
		filter: true,
		sortable: true
	},
	rowData: [],
	components: {
		renderHopPathIcon: renderHopPathIcon
	},
	columnDefs: [
		// {headerName: "Action", field: "id", width: 100, cellRenderer: 'renderHopPathIcon'},
		{headerName: "", width:45, pinned: "left", headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, checkboxSelection: true},
		{headerName: "URL", field: "url", width: 1200, filter: true},
		{headerName: "Type", field: "contentType", width: 120, filter: true, pinned: 'right'},
		{headerName: "Status", field: "statusCode", width: 100, filter: 'agNumberColumnFilter', pinned: 'right'},
		{headerName: "Length", field: "contentLength", width: 100, filter: 'agNumberColumnFilter', pinned: 'right'}
	]
};

var gridOptionsPrune={
	// suppressRowClickSelection: true,
	rowSelection: 'multiple',
	defaultColDef: {
		resizable: true,
		filter: true,
		sortable: true
	},
	rowData: [],
	components: {
		renderHopPathIcon: renderHopPathIcon
	},
	columnDefs: [
		// {headerName: "Action", field: "id", width: 100, pinned: "left", cellRenderer: 'renderHopPathIcon'},
		{headerName: "URL", field: "url", width: 200},
		{headerName: "ContentType", field: "contentType", width: 120},
		{headerName: "StatusCode", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
		{headerName: "ContentLength", field: "contentLength", width: 100, filter: 'agNumberColumnFilter'}
	]
};

var gridOptionsImport={
	// suppressRowClickSelection: true,
	// rowSelection: 'single',
	defaultColDef: {
	resizable: true,
	filter: true,
	sortable: true
	},
	rowData: [],
	columnDefs: [
		{headerName: "Action", field: "id", width: 100},
		{headerName: "URL", field: "url", width: 200, pinned: "left"},
		{headerName: "ContentType", field: "contentType", width: 120},
		{headerName: "StatusCode", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
		{headerName: "Size", field: "size", width: 100, filter: 'agNumberColumnFilter'},
		{headerName: "Date", field: "size", width: 100}
	]
};


class CustomizedAgGrid{
	constructor(jobId, harvestResultNumber, gridContainer, gridOptions, menuItems){
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
		this.gridContainer=gridContainer;
		this.gridOptions=gridOptions;
		this.menuItems=menuItems;

		this.grid=new agGrid.Grid(document.querySelector(this.gridContainer), this.gridOptions);
		this.dataMap={};

		if(menuItems){
			var that=this;
			$.contextMenu({
	            selector: that.gridContainer + ' .ag-row', 
	            callback: function(key, options) {
					var rowId=$(this).attr('row-id');
					// var rowNode = that.grid.gridOptions.api.getDisplayedRowAtIndex(rowId);
					var rowNode = that.grid.gridOptions.api.getRowNode(rowId);
					contextMenuCallback(key, rowNode.data, that, gPopupModifyHarvest);
	            },
	            items: that.menuItems
	        });
		}
	}

	processResponse(data){
		for(var i=0; i<data.length; i++){
			var node=data[i];
			if(!this.dataMap[node.id]){
				this.dataMap[node.id]=node;
			}
		}

		var dataset=[];
		for(var key in this.dataMap){
			var node=this.dataMap[key];
			dataset.push(node);
		}

		//Draw grid data
		this.grid.gridOptions.api.setRowData(dataset);
	}


	getSelectedNodes(){
		return this.grid.gridOptions.api.getSelectedRows();
	}
}

class HierarchyTree{
	constructor(container, jobId, harvestResultNumber){
		this.container=container;
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
		this.sourceUrlRootUrls="/curator/networkmap/get/root/urls?job=" + jobId + "&harvestResultNumber=" + harvestResultNumber;

		this.options={
			extensions: ["table", "wide"],
			checkbox: true,
			// autoScroll: true,
			// selectMode: 3,
			table: {checkboxColumnIdx: 0, nodeColumnIdx: 1},
			// viewport: {enabled: true, count: 3200},
			source: [],
			
			lazyLoad: function(event, data) {
				// data.result = {url: "domain.json", debugDelay: 1000};
				var dfd = new $.Deferred();
				data.result = dfd.promise();
				var outlinks="/curator/networkmap/get/outlinks?job=" + jobId + "&harvestResultNumber=" + harvestResultNumber + "&id=" + data.node.data.id;
				fetch(outlinks).then((response) => {
				    return response.json();
				}).then((lazydata) => {
				    lazydata=formatStringArrayToJsonArray(lazydata);
				    lazydata=formatDataForTreeGrid(lazydata);
				    dfd.resolve(lazydata);
				});
			},
			renderColumns: function(event, data) {
				var node = data.node;
				var $tdList = $(node.tr).find(">td");
				$tdList.eq(2).text(node.data.contentType);
				$tdList.eq(3).text(node.data.statusCode);
				$tdList.eq(4).text(formatContentLength(node.data.contentLength));
				$tdList.eq(5).text(node.data.totUrls);
				$tdList.eq(6).text(node.data.totSuccess);
				$tdList.eq(7).text(node.data.totFailed);
				$tdList.eq(8).text(formatContentLength(node.data.totSize));

				$(node.tr).attr("data", JSON.stringify(node.data));
			},
			
	    };

	    var that=this;
        $.contextMenu({
		        selector: this.container + ' tr', 
		        trigger: 'right',
		        reposition: true,
		        callback: function(key, options) {
		            var node=JSON.parse($(this).attr('data'));
		            // that.contentMenuCallback(key, rowId);
		            // console.log(options);
		            // console.log(node);
		            contextMenuCallback(key, node, that, gPopupModifyHarvest);
		        },
		        items: contextMenuItemsUrlBasic
    	});
	} 

	draw(){
		var that=this;
		fetch(this.sourceUrlRootUrls).then((response) => {
		    if(response.status==200){
		      if (response.redirected) {
		        alert("Please login!")
		        return null;
		      }else{
		        return response.json();
		      }
		    }
		}).then((data)=>{
		  if(data!=null){
		  	data=formatStringArrayToJsonArray(data);
  			data=formatDataForTreeGrid(data);
  			that.options.source=data;
  			$(that.container).fancytree(that.options);
		  }
		});
	}

	getSelectedNodes(){
		var selData=[];
		var selNodes = $.ui.fancytree.getTree(this.container).getSelectedNodes();
		for(var i=0; i<selNodes.length; i++){
			selData.push(selNodes[i].data);
		}

		console.log(selData);
		return selData;
	}
}

class PopupModifyHarvest{
	constructor(jobId, harvestResultNumber){
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
		this.hierarchyTree=new HierarchyTree("#hierachy-tree", jobId, harvestResultNumber);
		this.gridCandidate=new CustomizedAgGrid(jobId, harvestResultNumber, '#grid-modify-candidate', gridOptionsCandidate, contextMenuItemsUrlBasic);
		this.gridPrune=new CustomizedAgGrid(jobId, harvestResultNumber, '#grid-modify-prune', gridOptionsPrune, contextMenuItemsPrune);
		this.gridImport=new CustomizedAgGrid(jobId, harvestResultNumber, '#grid-modify-import', gridOptionsImport, contextMenuItemsImport);
	}

	addPruneUrlsViaDomain(domainNode){
		this.checkUrls(domainNode.title);
	}

	addPruneUrlsViaQueryCondition(){

	}

	addImportUrlsViaInputPage(){

	}

	addImportUrlsViaInputFile(){
		
	}


	pruneHarvest(data){
		this.gridPrune.gridOptions.api.updateRowData({ add: data});
	}


	checkUrls(domainName, contentType, statusCode){
		var aryDomainName=[];
		if (domainName && domainName!==null && domainName!=="null") {
			aryDomainName.push(domainName);
		}

		var aryContentType=[];
		if(contentType && contentType!==null && contentType!=="null"){
			aryContentType.push(contentType);
		}

		var aryStatusCode=[];
		if(statusCode && statusCode > 0){
			aryStatusCode.push(statusCode);
		}

		var searchCondition={
			"domainNames": aryDomainName,
			"contentTypes": aryContentType,
			"statusCodes": aryStatusCode
		}

		var that=this;
		var sourceUrl="/curator/networkmap/search/urls?job=" + this.jobId + "&harvestResultNumber=" + this.harvestResultNumber;
		fetch(sourceUrl, {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify(searchCondition)
		}).then((response) => {
			return response.json();
		}).then((rawData) => {
			var data=formatStringArrayToJsonArray(rawData);
			that.gridCandidate.processResponse(data);
			$('#popup-window-modify-harvest').show();
		});
	}
}



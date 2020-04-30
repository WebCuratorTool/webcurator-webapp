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

var contextMenuItemsCandidate={
    "hoppath": {name: "HopPath", icon: "fas fa-link"},
    "import": {name: "Import", icon: "fas fa-file-import"},
    "sep1": "---------",
    "pruneCurrent": {name: "Prune Current", icon: "cut"},
    "pruneSelected": {name: "Prune Selected", icon: "cut"},
    "sep2": "---------",
    "clearCurrent": {name: "Clear Current", icon: "delete"},
    "clearSelected": {name: "Clear Selected", icon: "delete"},
    "clearAll": {name: "Clear All", icon: "delete"},
    "sep3": "---------",
    "review": {name: "Review this Harvest", icon: "fas fa-dice-one"},
    "reviewInAccessTool": {name: "Review in Access Tool", icon: "fas fa-dice-two"},
    "liveSite": {name: "Live Site", icon: "fas fa-dice-three"},
    "archiveOne": {name: "Archive One", icon: "fas fa-dice-four"},
    "archiveTwo": {name: "Archive Two", icon: "fas fa-dice-five"},
    "webArchive": {name: "Web Archive", icon: "fas fa-dice-six"},
};

var contextMenuItemsPrune={
    "hoppath": {name: "HopPath", icon: "fas fa-link"},
    "sep1": "---------",
    "undoCurrent": {name: "Undo Current", icon: "fas fa-undo"},
    "undoSelected": {name: "Undo Selected", icon: "fas fa-undo"},
    "undoAll": {name: "Undo All", icon: "fas fa-undo"},
    "sep2": "---------",
    "review": {name: "Review this Harvest", icon: "fas fa-dice-one"},
    "reviewInAccessTool": {name: "Review in Access Tool", icon: "fas fa-dice-two"},
    "liveSite": {name: "Live Site", icon: "fas fa-dice-three"},
    "archiveOne": {name: "Archive One", icon: "fas fa-dice-four"},
    "archiveTwo": {name: "Archive Two", icon: "fas fa-dice-five"},
    "webArchive": {name: "Web Archive", icon: "fas fa-dice-six"},
};

var contextMenuItemsImport={
	"undoCurrent": {name: "Undo Current", icon: "fas fa-undo"},
    "undoSelected": {name: "Undo Selected", icon: "fas fa-undo"},
    "undoAll": {name: "Undo All", icon: "fas fa-undo"}
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
	                // var m = "clicked: " + key;
	                // window.console && console.log(m) || alert(m);
					var rowId=$(this).attr('row-id');
					// console.log(rowId);
					// console.log(this);

					// var rowNode = that.grid.gridOptions.api.getDisplayedRowAtIndex(rowId);
					// console.log(rowNode);
					that.contentMenuCallback(key, rowId);
	            },
	            items: that.menuItems
	        });
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
}

class PopupModifyHarvest{
	constructor(jobId, harvestResultNumber){
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;

		this.gridCandidate=new CustomizedAgGrid(jobId, harvestResultNumber, '#grid-modify-candidate', gridOptionsCandidate, contextMenuItemsCandidate);
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



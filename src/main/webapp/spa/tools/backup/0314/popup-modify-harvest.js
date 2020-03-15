function renderHopPathIcon(params){
	var id=params.data.id;
	return "<a href='javascript: fetchHopPath(" + id + ");'><i class='fas fa-link'></i></a>";
}

class PopupModifyHarvest{
	constructor(jobId, harvestResultNumber){
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
		this.containerPruneLeft='#grid-modify-prune-left';
		this.containerPruneRight='#grid-modify-prune-right';
		this.containerImportLeft='#grid-modify-import-left';
		this.containerImportRight='#grid-modify-import-right';

		this.columnDefsPrune = [
			{headerName: "Action", field: "id", width: 100, pinned: "left", cellRenderer: 'renderHopPathIcon'},
			{headerName: "URL", field: "url", width: 200},
			{headerName: "ContentType", field: "contentType", width: 120},
			{headerName: "StatusCode", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
			{headerName: "ContentLength", field: "contentLength", width: 100, filter: 'agNumberColumnFilter'}
	    ];

		this.optionsPrune={
			// suppressRowClickSelection: true,
			// rowSelection: 'single',
			defaultColDef: {
			resizable: true,
			filter: true,
			sortable: true
			},
			columnDefs: this.columnDefsPrune,
			rowData: [],
			components: {
				renderHopPathIcon: renderHopPathIcon
			}
		};

		this.columnDefsImport = [
			{headerName: "Action", field: "id", width: 100},
			{headerName: "URL", field: "url", width: 200, pinned: "left"},
			{headerName: "ContentType", field: "contentType", width: 120},
			{headerName: "StatusCode", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
			{headerName: "Size", field: "size", width: 100, filter: 'agNumberColumnFilter'},
			{headerName: "Date", field: "size", width: 100}
	    ];

		this.optionsImport={
			// suppressRowClickSelection: true,
			// rowSelection: 'single',
			defaultColDef: {
			resizable: true,
			filter: true,
			sortable: true
			},
			columnDefs: this.columnDefsImport,
			rowData: []
		};

		this.pruneDataLeft={};
		this.pruneDataRight={};
		this.importDataLeft={};
		this.importDataRight={};


		this.pruneGridLeft=new agGrid.Grid(document.querySelector(this.containerPruneLeft), this.optionsPrune);
		// this.pruneGridRight=new agGrid.Grid(document.querySelector(this.containerPruneRight), JSON.parse(JSON.stringify(this.optionsPrune)));
		this.importgGridLeft=new agGrid.Grid(document.querySelector(this.containerImportLeft), JSON.parse(JSON.stringify(this.optionsImport)));
		this.importGridRight=new agGrid.Grid(document.querySelector(this.containerImportRight), JSON.parse(JSON.stringify(this.optionsImport)));
	}


	init=function(){

	}


	addPruneUrlsViaDomain=function(domainNode){
		this.checkUrls(domainNode.title);
	}

	addPruneUrlsViaQueryCondition=function(){

	}

	addImportUrlsViaInputPage=function(){

	}

	addImportUrlsViaInputFile=function(){
		
	}

	checkUrls=function(domainName, contentType, statusCode){
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
			that.processResponse(data);
		});
	}

	processResponse=function(data){
		for(var i=0; i<data.length; i++){
			var node=data[i];
			if(!this.pruneDataLeft[node.id]){
				this.pruneDataLeft[node.id]=node;
			}
		}

		var dataset=[];
		for(var key in this.pruneDataLeft){
			var node=this.pruneDataLeft[key];
			dataset.push(node);
		}

		//Draw grid
		this.pruneGridLeft.gridOptions.api.setRowData(dataset);

		$('#popup-window-modify-harvest').show();
	}
}



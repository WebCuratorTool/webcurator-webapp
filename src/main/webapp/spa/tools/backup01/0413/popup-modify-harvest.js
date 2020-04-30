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

	getSelectedNodes(){
		var rows=this.grid.gridOptions.api.getSelectedRows();
		if(!rows || rows.length === 0){
			alert("Please select some rows!")
			return;
		}
		return rows;
	}

	getAllNodes(){
		var data=[];
		this.grid.gridOptions.api.forEachNode(function(node, index){
			data.push(node.data);
		});
		return data;
	}

	clearAll(){
		this.grid.gridOptions.api.setRowData([]);
	}

	clear(dataset){
		this.grid.gridOptions.api.updateRowData({remove: dataset});
	}

	remove(dataMap){
		var dataset=[];
		this.grid.gridOptions.api.forEachNode(function(node, index){
			if(dataMap[node.data.id]){
				dataset.push(node.data);
			}
		});
		this.grid.gridOptions.api.updateRowData({remove: dataset});
	}

	filter(keyWord){
		this.grid.gridOptions.api.setQuickFilter(keyWord);
	}

	setRowData(dataset){
		this.grid.gridOptions.api.setRowData(dataset);
	}

	deselectAll(){
		this.grid.gridOptions.api.deselectAll();
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
		this.uriSeedUrl="/curator/networkmap/get/root/urls?job=" + this.jobId + "&harvestResultNumber=" + this.harvestResultNumber;
		this.uriInvalidUrl="/curator/networkmap/get/malformed/urls?job=" + this.jobId + "&harvestResultNumber=" + this.harvestResultNumber;
	}

	undo(data, source){
		source.clear(data);

		var map={};
		for(var i=0; i< data.length; i++){
			var node=data[i];
			map[node.id]=node;
		}

		this.gridCandidate.gridOptions.api.forEachNode(function(node, index){
			if(map[node.data.id]){
				node.data.flag='normal';
			}	
		});
		this.gridCandidate.gridOptions.api.redrawRows(true);
	}

	pruneHarvest(data){
		$('#tab-btn-prune').trigger('click');

		if(!data){
			return;
		}

		var map={};
		for(var i=0; i< data.length; i++){
			var node=data[i];
			node.flag='prune';
			map[node.id]=node;
		}

		// this.gridCandidate.remove(map);
		this.gridCandidate.gridOptions.api.redrawRows(true);


		// Add to 'to be pruned' grid, and marked as new
		this.gridPrune.gridOptions.api.forEachNode(function(node, index){
			if(map[node.data.id]){
				delete map[node.data.id];
				node.data.flag='new';
			}else{
				node.data.flag='normal';
			}
		});
		this.gridPrune.gridOptions.api.redrawRows(true);

		map=JSON.parse(JSON.stringify(map));
		var dataset=[];
		for(var key in map){
			var node=map[key];
			node.flag='new';
			dataset.push(node);
		}
		this.gridPrune.gridOptions.api.updateRowData({ add: dataset});
	}

	pruneHarvestCascade(data){
		$('#tab-btn-prune').trigger('click');

		if(!data){
			return;
		}

		var map={};
		for(var i=0; i< data.length; i++){
			var node=data[i];
			node.flagNew=true;
			node.flagCascade=true;
			map[node.id]=node;			
		}

		this.gridCandidate.remove(map);

		// Add to 'to be pruned' grid, and marked as new
		this.gridPrune.gridOptions.api.forEachNode(function(node, index){
			if(map[node.data.id]){
				delete map[node.data.id];
				node.data.flagNew=true;
			}else{
				node.data.flagNew=false;
			}		
			
		});
		this.gridPrune.gridOptions.api.redrawRows(true);

		var dataset=[];
		for(var key in map){
			var node=map[key];
			node.flagNew=true;
			dataset.push(node);
		}
		this.gridPrune.gridOptions.api.updateRowData({ add: dataset});
	}

	inspectHarvest(data){
		if(!data){
			return;
		}
		
		var map={};
		for(var i=0; i< data.length; i++){
			var node=data[i];
			map[node.id]=node;
		}

		this.gridPrune.gridOptions.api.forEachNode(function(node, index){
			if(map[node.data.id]){
				// delete map[node.data.id];
				map[node.data.id].flag='prune';
			}
		});
		this.gridImport.gridOptions.api.forEachNode(function(node, index){
			if(map[node.data.id]){
				// delete map[node.data.id];
				map[node.data.id].flag='import';
			}
		});

		var dataset=[];
		for(var key in map){
			var node=map[key];
			dataset.push(node);
		}
		// this.gridCandidate.gridOptions.api.updateRowData({ add: dataset});
		this.gridCandidate.setRowData(dataset)
	}

	checkUrls(searchCondition, flag){
		if(!searchCondition || !flag){
			console.log('Invalid input, searchCondition='+searchCondition+', flag='+flag);
			return;
		}

		$('#popup-window-loading').show();
		var that=this;
		var sourceUrl="/curator/networkmap/search/urls?job=" + this.jobId + "&harvestResultNumber=" + this.harvestResultNumber;
		fetch(sourceUrl, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(searchCondition)
		}).then((response) => {
			return response.json();
		}).then((rawData) => {
			var data=formatStringArrayToJsonArray(rawData);
			if(flag==='prune'){
				that.pruneHarvest(data);
			}else if(flag==='inspect'){
				that.inspectHarvest(data);
			}
			$('#popup-window-loading').hide();
			$('#popup-window-modify-harvest').show();
		});
	}

	loadUrls(uri){
		var decision=confirm("The current candidates will be removed before loading URL. \n Please confirm you want to load data?");
		if(!decision){
			return;
		}

		$('#popup-window-loading').show();
		var that=this;
		fetch(uri, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
		}).then((response) => {
			return response.json();
		}).then((rawData) => {
			var data=formatStringArrayToJsonArray(rawData);
			that.gridCandidate.setRowData(data);
			$('#popup-window-loading').hide();
		});
	}

	loadSeedUrls(){
		this.loadUrls(this.uriSeedUrl);
	}

	loadInvalidUrls(){
		this.loadUrls(this.uriInvalidUrl);
	}
}

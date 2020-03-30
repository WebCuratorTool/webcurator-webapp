class NetworkMap{
	constructor(){
		this.graph=new NetworkMapGraph('network-map-canvas');
		this.gridStatusCode=new NetworkMapGrid('#networkmap-side-table-group-by-status-code', 'statusCode');
		this.gridContentType=new NetworkMapGrid('#networkmap-side-table-group-by-content-type', 'contentType');
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
        this.gridStatusCode.draw(node);
        this.gridContentType.draw(node);
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
		this.gridStatusCode.draw(node);
        this.gridContentType.draw(node);

		var title='Root';
		if(node.title){
			title=node.title;
		}

		if(title.length > 60){
			title=title.substr(0, 60) + '...';
		}

		$('#networkmap-side-title').text('Domain: ' + title);
	}

	contextMenuCallback(key, condition, source){
		if (key==='pruneHarvestCurrent') {
			gPopupModifyHarvest.checkUrls(condition, 'prune');
		}else if(key==='pruneHarvestSelected'){
			var c=source.getSelectedNodes();
			gPopupModifyHarvest.checkUrls(c, 'prune');
		}else if(key==='modifyHarvestCurrent'){
			gPopupModifyHarvest.checkUrls(condition, 'modify');
		}else if(key==='modifyHarvestSelected'){
			var c=source.getSelectedNodes();
			gPopupModifyHarvest.checkUrls(c, 'modify');
		}
	}

	static contextMenuItemsGrid={
        "pruneHarvestCurrent": {"name": "Prune Current", icon: "far fa-trash-alt"},
		"pruneHarvestSelected": {"name": "Prune Selected", icon: "fas fa-trash-alt"},
    	"sep1": "---------",
    	"modifyHarvestCurrent": {"name": "Modify Current", icon: "far fa-edit"},
		"modifyHarvestSelected": {"name": "Modify Selected", icon: "fas fa-edit"}
    };

    static contextMenuItemsGraph={
        "pruneHarvestCurrent": {"name": "Prune", icon: "far fa-trash-alt"},
    	"sep1": "---------",
    	"modifyHarvestCurrent": {"name": "Modify", icon: "far fa-edit"},
    };
}



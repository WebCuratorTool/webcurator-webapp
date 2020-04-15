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
		var keyItems=key.split('-');
		var action=keyItems[0], scope=keyItems[1];
		if(scope==='selected'){
			condition=source.getSelectedNodes();
		}

		gPopupModifyHarvest.checkUrls(condition, action);
	}

	static contextMenuItemsGrid={
        "prune-current": {"name": "Prune Current", icon: "far fa-trash-alt"},
		"prune-selected": {"name": "Prune Selected", icon: "fas fa-trash-alt"},
    	"sep1": "---------",
    	"inspect-current": {"name": "Inspect Current", icon: "far fa-eye"},
		"inspect-selected": {"name": "Inspect Selected", icon: "fas fa-eye"}
    };

    static contextMenuItemsGraph={
        "prune-current": {"name": "Prune", icon: "far fa-trash-alt"},
    	"sep1": "---------",
    	"inspect-current": {"name": "Inspect", icon: "far fa-eye"},
    };
}



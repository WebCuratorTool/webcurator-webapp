class HierarchyTree{
	constructor(container, jobId, harvestResultNumber){
		this.container=container;
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
		this.sourceUrlRootUrls="/curator/networkmap/get/root/urls?job=" + jobId + "&harvestResultNumber=" + harvestResultNumber;

		this.options={
			extensions: ["filter", "grid"],
			checkbox: true,
			selectMode: 3,
			table: {checkboxColumnIdx: 0, nodeColumnIdx: 1},
			viewport: {enabled: true, count: 32},
			source: [],
			preInit: function(event, data) {
			  var tree = data.tree;
			  tree.verticalScrollbar = new PlainScrollbar({
			    alwaysVisible: true,
			    arrows: true,
			    orientation: "vertical",
			    onSet: function(numberOfItems) {
			      tree.debug("verticalScrollbar:onSet", numberOfItems);
			      tree.setViewport({
			        start: Math.round(numberOfItems.start),
			        // count: tree.viewport.count,
			      });
			    },
			    scrollbarElement: document.getElementById("verticalScrollbar"),
			  });
			},
			postProcess: function(event, data) {
			// assuming the Ajax response contains a list of child nodes:
			// data.response[0].title += " - hello from postProcess";
			// data.response=formatStringArrayToJsonArray(data.response);
			// data.response=formatDataForTreeGrid(data.response);
			// console.log(data.response);
			},
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
				var node = data.node,
				$tdList = $(node.tr).find(">td");
				$tdList.eq(2).text(node.data.contentType);
				$tdList.eq(3).text(node.data.statusCode);
				$tdList.eq(4).text(node.data.contentLength);
				$tdList.eq(5).text(node.data.totUrls);
				$tdList.eq(6).text(node.data.totSuccess);
				$tdList.eq(7).text(node.data.totFailed);
				$tdList.eq(8).text(node.data.totSize);
			},
			updateViewport: function(event, data) {
				var tree = data.tree;

				// Handle PlainScrollbar events
				tree.verticalScrollbar.set({
				  start: tree.viewport.start,
				  total: tree.visibleNodeList.length,
				  visible: tree.viewport.count,
				}, true);  // do not trigger `onSet`
			}
	    }
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
}
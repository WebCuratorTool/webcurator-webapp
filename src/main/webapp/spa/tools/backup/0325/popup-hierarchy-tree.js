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
			},
			
	    };


        $.contextMenu({
		        selector: this.container + ' tr', 
		        trigger: 'right',
		        reposition: true,
		        callback: function(key, options) {
		            // var rowId=$(this).attr('row-id');
		            // that.contentMenuCallback(key, rowId);
		            console.log(options);
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
}
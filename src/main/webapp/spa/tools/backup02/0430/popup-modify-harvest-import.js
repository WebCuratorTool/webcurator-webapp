class ImportModifyHarvestProcessor{
	constructor(jobId, harvestResultNumber){
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
	}

	// setNode(node){
	// 	this.targetNode=JSON.parse(JSON.stringify(node));
	// }

	uploadFile(cmd, content){
		var url="../../curator/tools/upload-file-stream?fileName="+cmd.srcName+"&replaceFlag=true";
		var that=this;
		fetch(url, { 
			method: 'POST',
			headers: {'Content-Type': 'application/octet-stream'},
			body: content
		}).then((response) => {
			return response.json();
		}).then((response) => {
			that.callback(response, cmd);
		});
	}

	callback(resp, node){
		//Check result
		if(resp && resp.respCode!=0){
			alert(resp.respMsg);
			return;
		}

		node.url=node.targetUrl;
		node.progress=1;
		
		$('#tab-btn-import').trigger('click');
		if(this.tobeReplaceNode){
			gPopupModifyHarvest.gridImport.gridOptions.api.updateRowData({remove: [this.tobeReplaceNode]});
		}
		gPopupModifyHarvest.gridImport.insert([node]);
		$('#popup-window-import-input').hide();

		if(node.pruneFlag){
			gPopupModifyHarvest.pruneHarvestByUrls([node]);
		}
	}

	insertRecrawlItem(){
		var that=this;
		var node={
			targetUrl: $("#specifyTargetUrlInput").val(),
		};

		// Check if targetURL exist in "to be imported" table
		this.tobeReplaceNode=null;
		gPopupModifyHarvest.gridImport.gridOptions.api.forEachNode(function(row, index){
			if(node.targetUrl===row.data.url){
				that.tobeReplaceNode=row.data;
			}
		});
		if (this.tobeReplaceNode) {
			var decision=confirm("The targetUrl has been exist in the ToBeImported table. \n Would you replace it?");
			if(!decision){
				return;
			}
		}

		node.pruneFlag=$("#checkbox-prune-of-single-import").is(":checked");

		// var option=$("#customRadio1").attr("");
		node.option=$("input[type='radio']:checked").attr("flag");
		if(node.option==='File'){
			if(!node.targetUrl.toLowerCase().startsWith("http://")){
				alert("You must specify a valid target URL. Starts with: http://");
				return;
			}
			var file=$('#sourceFile')[0].files[0];
			if(!file){
				alert("You must specify a source file name to import.");
				return;
			}
			node.srcName=file.name;
			node.srcSize=file.size;
			node.srcType=file.type;
			node.srcLastModified=file.lastModified;
			// reqBody.file=file;

			var reader = new FileReader();
			reader.addEventListener("loadend", function () {
				// reqBody.content=reader.result;
				that.uploadFile(node, reader.result);
			});

			// reader.readAsDataURL(file);
			reader.readAsArrayBuffer(file);
		}else{
			if(!node.targetUrl.toLowerCase().startsWith("http://") &&
				!node.targetUrl.toLowerCase().startsWith("https://")){
				alert("You must specify a valid target URL.");
				return;
			}

			node.srcName=$('#importFromUrlInput').val();
			if(!node.srcName.toLowerCase().startsWith("http://") &&
				!node.srcName.toLowerCase().startsWith("https://")){
				alert("You must specify a valid source URL.");
				return;
			}

			// that.uploadFile(cmd);
			this.callback(null, node);
		}
	}
}
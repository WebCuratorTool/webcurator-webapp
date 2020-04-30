class ImportModifyHarvestProcessor{
	constructor(jobId, harvestResultNumber){
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
	}

	setNode(node){
		this.targetNode=JSON.parse(JSON.stringify(node));
	}

	uploadFile(reqBody){
		var that=this;
		fetch("../../curator/tools/modify-import", { 
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(reqBody) 
		}).then((response) => {
			return response.json();
		}).then((response) => {
			that.callback(response);
		});
	}

	callback(resp){
		//Check result
		if(resp.respCode!=0){
			alert(resp.respMsg);
			return;
		}

		var node;
		if(this.targetNode){
			node=this.targetNode;
			node.option=resp.option;
			node.srcName=resp.srcName;
			node.srcSize=resp.srcSize;
			node.srcType=resp.srcType;
			node.srcLastModified=resp.srcLastModified;
			node.tmpFileName=resp.tmpFileName;
		}else{
			node=resp;
		}
		$('#tab-btn-import').trigger('click');
		if(this.tobeReplaceNode){
			gPopupModifyHarvest.gridImport.gridOptions.api.updateRowData({remove: [this.tobeReplaceNode]});
		}
		gPopupModifyHarvest.gridImport.insert([node]);
		$('#popup-window-import-input').hide();
	}

	insertRecrawlItem(){
		var that=this;
		var reqBody={
			targetUrl: $("#specifyTargetUrlInput").val(),
		};

		// Check if targetURL exist in "to be imported" table
		this.tobeReplaceNode=null;
		gPopupModifyHarvest.gridImport.gridOptions.api.forEachNode(function(node, index){
			if(reqBody.targetUrl===node.data.url){
				that.tobeReplaceNode=node.data;
			}
		});
		if (this.tobeReplaceNode) {
			var decision=confirm("The targetUrl has been exist in the ToBeImported table. \n Would you replace it?");
			if(!decision){
				return;
			}
		}

		// var option=$("#customRadio1").attr("");
		reqBody.option=$("input[type='radio']:checked").attr("flag");
		if(reqBody.option==='File'){
			if(!reqBody.targetUrl.toLowerCase().startsWith("http://")){
				alert("You must specify a valid target URL.");
				return;
			}
			var file=$('#sourceFile')[0].files[0];
			if(!file){
				alert("You must specify a source file name to import.");
				return;
			}
			reqBody.srcName=file.name;
			reqBody.srcSize=file.size;
			reqBody.srcType=file.type;
			reqBody.srcLastModified=file.lastModified;
			// reqBody.file=file;

			var reader = new FileReader();
			reader.addEventListener("loadend", function () {
				reqBody.content=reader.result;
				that.uploadFile(reqBody);
			});

			reader.readAsDataURL(file);
		}else{
			if(!reqBody.targetUrl.toLowerCase().startsWith("http://") &&
				!reqBody.targetUrl.toLowerCase().startsWith("https://")){
				alert("You must specify a valid target URL.");
				return;
			}

			reqBody.srcName=$('#importFromUrlInput').val();
			if(!reqBody.srcName.toLowerCase().startsWith("http://") &&
				!reqBody.srcName.toLowerCase().startsWith("https://")){
				alert("You must specify a valid source URL.");
				return;
			}

			that.uploadFile(reqBody);
		}
	}
}
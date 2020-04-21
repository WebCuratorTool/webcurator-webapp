class ImportModifyHarvest{
	constructor(jobId, harvestResultNumber){
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
	}

	setUrl(node){
		this.node=JSON.parse(JSON.stringify(node));
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
		var node=this.node;
		if(node){
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
		gPopupModifyHarvest.gridImport.insert([node]);
	}

	insertRecrawlItem(){
		var that=this;
		var reqBody={
			targetUrl: $("#specifyTargetUrlInput").val(),
		};
		var option=$("#customRadio1").val();
		if(option==='on'){
			reqBody.option='doc';
			var file=$('#sourceFile')[0].files[0];
			reqBody.srcName=file.name;
			reqBody.srcSize=file.size;
			reqBody.srcType=file.type;
			reqBody.srcLastModified=file.lastModified;
			// reqBody.file=file;

			var reader = new FileReader();
			reader.addEventListener("loadend", function () {
				reqBody.content=reader.result;
				that.uploadFile(reqBody);
				reader.removeEventListener("loadend");
			});

			reader.readAsDataURL(file);

		}else{
			reqBody.option='url';
			reqBody.srcName=$('#importFromUrlInput').val();
			uploadFile(reqBody);
		}
	}
}
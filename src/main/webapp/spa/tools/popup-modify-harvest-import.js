class ImportModifyHarvestProcessor{
	constructor(jobId, harvestResultNumber){
		this.jobId=jobId;
		this.harvestResultNumber=harvestResultNumber;
	}

	uploadFile(cmd, file, callback){
		var that=this;
		var reader = new FileReader();
		reader.addEventListener("loadend", function () {
			var url="/curator/tools/upload-file-stream?fileName="+cmd.srcName+"&replaceFlag=true";
			fetch(url, { 
				method: 'POST',
				headers: {'Content-Type': 'application/octet-stream'},
				body: reader.result
			}).then((response) => {
				return response.json();
			}).then((response) => {
				callback(response);
			});
		});

		// reader.readAsDataURL(file);
		reader.readAsArrayBuffer(file);
	}

	singleImport(resp, node){
		//Check result
		if(resp && resp.respCode!=0){
			alert(resp.respMsg);
			return;
		}

		node.url=node.targetUrl;
		node.uploadedFlag=1;
		
		$('#tab-btn-import').trigger('click');
		if(this.tobeReplaceNode){
			gPopupModifyHarvest.gridImport.gridOptions.api.updateRowData({remove: [this.tobeReplaceNode]});
		}
		gPopupModifyHarvest.gridImport.insert([node]);
		$('#popup-window-single-import').hide();

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

			var that=this;
			this.uploadFile(node, file, function(resp){
				that.singleImport(resp, node);
			});
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
			this.singleImport(null, node);
		}
	}


	bulkUploadFiles(){
		var dataset=gPopupModifyHarvest.gridImportPrepare.getAllNodes();
		var bulkFileNameMap={};
		for(var j=0; j<dataset.length; j++){
			var node=dataset[j];
			if(node.option.toLowerCase()!=='file'){
				continue;
			}
			var ary=bulkFileNameMap[node.srcName];
			if(!ary){
				ary=[node];
				bulkFileNameMap[node.srcName]=ary;
			}else{
				ary.push(node);
			}
		}

		var that=this;
		var files=$('#bulkImportContentFile')[0].files;
		for(var i=0; i<files.length; i++){
			var file=files[i];
			var cmd={srcName: file.name};

			var ary=bulkFileNameMap[cmd.srcName];
			if(!ary){
				console.log("Selected file not match any item to be bulk imported. Selected file name: " + cmd.srcName);
				continue;
			}

			for(var j=0; j<ary.length; j++){
				ary[j].srcSize=file.size;
				ary[j].srcType=file.type;
				ary[j].srcLastModified=file.lastModified;
				ary[j].uploadedFlag=0;
			}

			this.uploadFile(cmd, file, function(response){
				if(response.respCode!=0){
					alert(respMsg);
					return;
				}

				var ary=bulkFileNameMap[response.srcName];
				if(!ary){
					console.log("Response srcName not match any item to be bulk imported. Selected file name: " + response.srcName);
					return;
				}

				for(var j=0; j<ary.length; j++){
					ary[j].uploadedFlag=1;
				}
				gPopupModifyHarvest.gridImportPrepare.gridOptions.api.redrawRows(true);

				delete bulkFileNameMap[response.srcName];
				
				if(bulkFileNameMap.length>0){
					var html=$('#tip-bulk-import-prepare-invalid').html();
					$('#tip-bulk-import-prepare').html(html);
				}else{
					$('#tip-bulk-import-prepare').html('All rows are valid.');
				}
			});
		}

		gPopupModifyHarvest.gridImportPrepare.gridOptions.api.redrawRows(true);
		$('#bulkImportContentFile').val(null);
	}

	bulkImportStep0(){
		var file=$('#bulkImportMetadataFile')[0].files[0];
		if(!file){
			alert("You must specify a metadata file name to import.");
			return;
		}
		var that=this;
		var reader = new FileReader();
		reader.addEventListener("loadend", function () {
			var newBulkTargetUrlMap={}; //Using a map to check duplicated target urls;
			var dataset=[];
			var text=reader.result;
			var columnSeparator=$('#bulk-import-column-separator').val();
			if(columnSeparator==='Tab'){
				columnSeparator='\t';
			}

			var lines=text.split('\n');
			for(var i=0;i<lines.length;i++){
				var line=lines[i].trim();

				console.log(line);

				var columns=line.split(columnSeparator); //Type, Target, Source, Datetime
				if(columns.length!==4){
					alert("Invalid metadata format");
					return;
				}

				var type=columns[0].trim(), target=columns[1].trim(), source=columns[2].trim(), modifydatetime=columns[3].trim();
				var node={
					option: type,
					targetUrl: target,
					srcName: source,
					srcLastModified: modifydatetime,
					uploadedFlag: -1
				}

				if(newBulkTargetUrlMap[target]){
					alert("Duplicated target URL at line: " + (i+1));
					return;
				}else{
					newBulkTargetUrlMap[target]=i;
				}


				if(type.toLowerCase()==="file"){
					node.option="File";
					if(!target.toLowerCase().startsWith("http://")){
						alert("You must specify a valid target URL at line:" + (i+1) + ". URL starts with: http://");
						return;
					}
					dataset.push(node);
				}else if(type.toLowerCase()==='url'){
					node.option='URL';
					if(!target.toLowerCase().startsWith("http://") &&
						!target.toLowerCase().startsWith("https://")){
						alert("You must specify a valid target URL at line:" + (i+1));
						return;
					}

					if(!source.toLowerCase().startsWith("http://") &&
						!source.toLowerCase().startsWith("https://")){
						alert("You must specify a valid source URL at line:" + (i+1));
						return;
					}
					dataset.push(node);
				}else{
					//alert("Import type must be 'file' or 'url' at line: " + (i+1));
					//return;
					console.log('Skip invalid line: ' + line);
				}

				var d=new Date(modifydatetime);
				if(!d){
					alert("Invalid modification datetime at line: " + (i+1));
					return;
				}

				node.srcLastModified=d.getTime();
			}


			that.checkFilesExistAtServerSide(dataset, function(unUploadedNumber, response){
				that.nextBulkImportTab(0);
				gPopupModifyHarvest.gridImportPrepare.setRowData(response);
			});

		});

		// reader.readAsDataURL(file);
		reader.readAsText(file);

	}

	bulkImportStep1(){
		var that=this;
		var dataset=gPopupModifyHarvest.gridImportPrepare.getAllNodes();
		this.checkFilesExistAtServerSide(dataset, function(unUploadedNumber, response){
			if(unUploadedNumber>0){
				gPopupModifyHarvest.gridImportPrepare.setRowData(response);
				alert('Some files are missing. Can not proceed.');
				return;
			}else{
				$('#popup-window-bulk-import').hide();
				$('#tab-btn-import').trigger('click');
				that.nextBulkImportTab(1);
				gPopupModifyHarvest.insertImportData(response);
				var pruneFlag=$("#checkbox-prune-of-bulk-import").is(":checked");
				if(pruneFlag){
					gPopupModifyHarvest.pruneHarvestByUrls(response);					
				}
			}
		});
		
	}


	checkFilesExistAtServerSide(dataset, callback){
		var that=this;
		fetch("/curator/tools/check-files", { 
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(dataset)
		}).then((response) => {
			return response.json();
		}).then((response) => {
			var unUploadedNumber=0;
			for(var i=0; i<response.length; i++){
				var element=response[i];
				if(element.uploadedFlag!==1){
					unUploadedNumber++;
					break;
				}
			}
			if(unUploadedNumber>0){
				var html=$('#tip-bulk-import-prepare-invalid').html();
				$('#tip-bulk-import-prepare').html(html);
			}else{
				$('#tip-bulk-import-prepare').html('All rows are valid.');
			}

			callback(unUploadedNumber, response);
			
		});
	}

	nextBulkImportTab(step){
      step=(step+1) % 2;
      $('.tab-bulk-import').hide();
      $('#tab-bulk-import-'+step).show();
      $('#btn-bulk-import-submit').attr('step', step);
      if(step===0){
        $('#bulkImportMetadataFile').val(null);
        $('#label-bulk-import-metadata-file').html('Choose file');
        $('#bulkImportContentFile').val(null);
        $('#btn-bulk-import-submit').html('Next');        
      }else{
        $('#btn-bulk-import-submit').html('Re-crawl');
        $('#btn-bulk-import-submit').attr('status', 'recrawl');
      }
    }

}
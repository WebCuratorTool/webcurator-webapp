function formatStringArrayToJsonArray(listStr){
	var listObj=[];
	for(var i=0;i<listStr.length;i++){
		var elementStr=listStr[i];
		var elementObj=JSON.parse(elementStr);
		listObj.push(elementObj);
	}

	return listObj;
}


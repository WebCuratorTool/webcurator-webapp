function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

var status='on';
function toggleNetworkMapGrid(){
  if (status === 'on') {
    $('#network-map-canvas').width('calc(100vw - 22px)');
    $('#networkmap-side-container').hide();
    status='off';
  }else{
    $('#network-map-canvas').width('75vw');
    $('#networkmap-side-container').show();
    status='on';
  }
}


function spNetworkMapSideTab(key){
  $(".networkmap-insight").hide();
  $("#"+key).show();
}


function formatStringArrayToJsonArray(listStr){
  var listObj=[];
  for(var i=0;i<listStr.length;i++){
    var elementStr=listStr[i];
    var elementObj=JSON.parse(elementStr);
    listObj.push(elementObj);
  }

  return listObj;
}


function sp(id){
  $(".main-nav-link").removeClass("active");
  $("#"+id).addClass("active");

  $(".subnav").hide();
  $("#navbar-nav-"+id).show();

  $(".content-page").hide();
  $("#page-"+id).show();
}


function checkUrls(domainName, contentType, statusCode){
  var aryDomainName=[];
  if (domainName && domainName!==null && domainName!=="null") {
    aryDomainName.push(domainName);
  }

  var aryContentType=[];
  if(contentType && contentType!==null && contentType!=="null"){
    aryContentType.push(contentType);
  }

  var aryStatusCode=[];
  if(statusCode && statusCode > 0){
    aryStatusCode.push(statusCode);
  }

  var searchCondition={
    "domainNames": aryDomainName,
    "contentTypes": aryContentType,
    "statusCodes": aryStatusCode
  }

  var sourceUrl="/curator/networkmap/search/urls?job=" + jobId + "&harvestResultNumber=" + harvestResultNumber;
  fetch(sourceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchCondition)
  }).then((response) => {
      return response.json();
  }).then((rawData) => {
      var data=formatStringArrayToJsonArray(rawData);
      drawNetworkUrlGrid(data);

      sp("urls");
  });
}

function formatDataForTreeGrid(listObj){
  for(var i=0;i<listObj.length;i++){
    var e=listObj[i];
    e.title=e.url;
    if (e.outlinks.length>0) {
      e.lazy=true;
    }else{
      e.lazy=false;
    }
    delete e["children"];
    delete e["outlinks"];
    //addTitleForTreeGrid(e.children);
  }
  return listObj;
}

// function drawHopPathFromSelectedURLs(){
//   var selectedRows = grid.gridOptions.api.getSelectedRows();
//   if (selectedRows.length==1) {
//     sp("hoppath");
//     visHopPath.draw(selectedRows[0].id);
//   }else{
//     alert("Please select one and only one row!");
//   }
// }


var K=1024, M=K*1024, G=M*1024;
function formatContentLength(l){
  if(l>G){
    return Math.round(l/G)+'G';
  }else if(l>M){
    return Math.round(l/M)+'M';
  }else if(l>K){
    return Math.round(l/K)+'K';
  }else{
    return l;
  }
}

function formatContentLengthAg(params){
    return formatContentLength(params.value);
}



function contextMenuCallback(key, data, source, target){
  if (key==='pruneHarvestCurrent') {
    target.pruneHarvest([data]);
  }else if(key==='pruneHarvestSelected'){
    var dataset=source.getSelectedNodes();
    target.pruneHarvest(dataset);
  }else if(key==='modifyHarvestCurrent'){
    target.modifyHarvestCurrent(data);
  }else if(key==='modifyHarvestSelected'){
    var dataset=source.getSelectedNodes();
    target.modifyHarvestSelected(dataset);
  }else if(key==='hoppath'){
    visHopPath.draw(data.id);
  }else if(key==='import'){
    $('#specifyTargetUrlInput').text(data.url);
    $('#popup-window-import-input').show();
  }else if(key==='reviewUrl'){
    
  }else if(key==='reviewInAccessTool'){
    
  }else if(key==='liveSite'){
    
  }else if(key==='archiveOne'){
    
  }else if(key==='archiveTwo'){
    
  }else if(key==='webArchive'){
    
  }
}



var itemsPruneHarvest={
                  "pruneHarvestCurrent": {"name": "Current"},
                  "pruneHarvestSelected": {"name": "Selected"}
              };
var itemsModifyHarvest={
                  "modifyHarvestCurrent": {"name": "Current"},
                  "modifyHarvestSelected": {"name": "Selected"}
              };
var itemsBrowse={
                  "reviewUrl": {name: "Review this URL", icon: "fas fa-dice-one"},
                  "reviewInAccessTool": {name: "Review in Access Tool", icon: "fas fa-dice-two"},
                  "liveSite": {name: "Live Site", icon: "fas fa-dice-three"},
                  "archiveOne": {name: "Archive One", icon: "fas fa-dice-four"},
                  "archiveTwo": {name: "Archive Two", icon: "fas fa-dice-five"},
                  "webArchive": {name: "Web Archive", icon: "fas fa-dice-six"}
                };

var contextMenuItemsUrlBasic={
                  "hoppath": {name: "HopPath", icon: "fas fa-link"},
                  "import": {name: "Import", icon: "fas fa-file-import"},
                  "sep1": "---------",
                  "pruneHarvest": {name: "Prune", icon: "cut", items: itemsPruneHarvest},
                  "sep2": "---------",
                  "modifyHarvest": {name: "Modify", icon: "far fa-edit", items: itemsModifyHarvest},
                  "sep3": "---------",
                  "browseUrl": {name: "Browse", icon: "fab fa-chrome", items: itemsBrowse}
                };

var contextMenuItemsPrune={
    "hoppath": {name: "HopPath", icon: "fas fa-link"},
    "sep1": "---------",
    "undo": {name: "Undo", icon: "fas fa-undo", items: {
                  "undoPruneCurrent": {name: "Current"},
                  "undoPruneSelected": {name: "Selected"},
                  "undoPruneAll": {name: "All"}
            }
    },
    "sep2": "---------",
    "browseUrl": {name: "Browse", icon: "fab fa-chrome", items: itemsBrowse}
};

var contextMenuItemsImport={
  "undo": {name: "Undo", icon: "fas fa-undo", items: {
                  "undoImportCurrent": {name: "Current"},
                  "undoImportSelected": {name: "Selected"},
                  "undoImportAll": {name: "All"}
            }
    },
};

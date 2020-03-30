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

function renderCascadeIcon(params){
  if(params.data.flagCascade){
    return "<i class='fab fa-gg text-failed'></i>";
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
  }else if (key==='pruneHarvestCurrentCascade') {
    target.pruneHarvestCascade([data]);
  }else if(key==='pruneHarvestSelectedCascade'){
    var dataset=source.getSelectedNodes();
    target.pruneHarvestCascade(dataset);
  }else if(key==='hoppath'){
    visHopPath.draw(data.id);
  }else if(key==='import'){
    $('#specifyTargetUrlInput').val(data.url);
    $('#popup-window-import-input').show();
  }else if(key==='reviewUrl'){
    
  }else if(key==='reviewInAccessTool'){
    
  }else if(key==='liveSite'){
    
  }else if(key==='archiveOne'){
    
  }else if(key==='archiveTwo'){
    
  }else if(key==='webArchive'){
    
  }else if(key==='undoCurrent'){
    target.undo([data], source);
  }else if(key==='undoSelected'){
    var dataset=source.getSelectedNodes();
    target.undo(dataset, source);
  }else if(key==='undoAll'){
    var dataset=source.getAllNodes();
    target.undo(dataset, source);
  }else if(key==='clearHarvestCurrent'){
    source.remove([data]);
  }else if(key==='clearHarvestSelected'){
    var dataset=source.getSelectedNodes();
    source.remove(dataset);
  }else if(key==='clearHarvestAll'){
    source.clear();
  }
}

var itemsPruneHarvest={
                  "pruneHarvestCurrent": {"name": "Current"},
                  "pruneHarvestSelected": {"name": "Selected"}
              };
var itemsPruneHarvestCascade={
                  "pruneHarvestCurrentCascade": {"name": "Current"},
                  "pruneHarvestSelectedCascade": {"name": "Selected"}
              };
var itemsClearHarvest={
                  "clearHarvestCurrent": {"name": "Current"},
                  "clearHarvestSelected": {"name": "Selected"},
                  "clearHarvestAll": {"name": "All"},
              };
var itemsBrowse={
                  "reviewUrl": {name: "Review this URL", icon: "fas fa-dice-one"},
                  "reviewInAccessTool": {name: "Review in Access Tool", icon: "fas fa-dice-two"},
                  "liveSite": {name: "Live Site", icon: "fas fa-dice-three"},
                  "archiveOne": {name: "Archive One", icon: "fas fa-dice-four"},
                  "archiveTwo": {name: "Archive Two", icon: "fas fa-dice-five"},
                  "webArchive": {name: "Web Archive", icon: "fas fa-dice-six"}
                };
var itemsUndo={
                  "undoCurrent": {name: "Current"},
                  "undoSelected": {name: "Selected"},
                  "undoAll": {name: "All"}
                };

var contextMenuItemsUrlBasic={
                  "hoppath": {name: "HopPath", icon: "fas fa-link"},
                  "import": {name: "Import", icon: "fas fa-file-import"},
                  "sep1": "---------",
                  "pruneHarvest": {name: "Prune", icon: "far fa-times-circle", items: itemsPruneHarvest},
                  "pruneHarvestCascade": {name: "Cascade Prune", icon: "fas fa-times-circle", items: itemsPruneHarvestCascade},
                  "sep2": "---------",
                  "clearHarvest": {name: "Clear", icon: "delete", items: itemsClearHarvest},
                  "sep3": "---------",
                  "browseUrl": {name: "Browse", icon: "fab fa-chrome", items: itemsBrowse}
                };

var contextMenuItemsPrune={
    "hoppath": {name: "HopPath", icon: "fas fa-link"},
    "sep1": "---------",
    "undo": {name: "Undo", icon: "fas fa-undo", items: itemsUndo},
    "sep2": "---------",
    "browseUrl": {name: "Browse", icon: "fab fa-chrome", items: itemsBrowse}
};

var contextMenuItemsImport={
  "undo": {name: "Undo", icon: "fas fa-undo", items: itemsUndo},
};

function formatModifyHavestGridRow(params){
  // console.log(this.gridContainer);
  // console.log(params);
  if (params.data.flagDelete) {
    return 'grid-row-delete';
  }else if (params.data.flagNew) {
    return 'grid-row-new';
  }else{
    // return 'grid-row-normal';
    return null;
  }
};

var gridRowClassRules={
  'grid-row-normal': function(params){return !params.data.flagDelete && !params.data.flagNew},
  'grid-row-delete': function(params){return params.data.flagDelete},
  'grid-row-new': function(params){return params.data.flagNew}
}

var gridOptionsCandidate={
  suppressRowClickSelection: true,
  rowSelection: 'multiple',
  defaultColDef: {
    resizable: true,
    filter: true,
    sortable: true
  },
  rowData: [],
  columnDefs: [
    {headerName: "", width:45, pinned: "left", headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, checkboxSelection: true},
    {headerName: "URL", field: "url", width: 400, filter: true},
    {headerName: "Type", field: "contentType", width: 120, filter: true},
    {headerName: "Status", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "Size", field: "contentLength", width: 100, filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg},
    {headerName: "TotUrls", field: "totUrls", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "Failed", field: "totFailed", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "Success", field: "totSuccess", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "TotSize", field: "totSize", width: 100, filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg}
  ],
  // rowClassRules: gridRowClassRules,
  getRowClass: formatModifyHavestGridRow
};

var gridOptionsPrune={
  suppressRowClickSelection: true,
  rowSelection: 'multiple',
  defaultColDef: {
    resizable: true,
    filter: true,
    sortable: true
  },
  rowData: [],
  components: {
    renderCascadeIcon: renderCascadeIcon
  },
  columnDefs: [
    {headerName: "", width:45, pinned: "left", headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, checkboxSelection: true},
    {headerName: "URL", field: "url", width: 400, filter: true},
    {headerName: "Type", field: "contentType", width: 120, filter: true},
    {headerName: "Status", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "Size", field: "contentLength", width: 100, filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg},
    {headerName: "TotUrls", field: "totUrls", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "Failed", field: "totFailed", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "Success", field: "totSuccess", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "TotSize", field: "totSize", width: 100, filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg},
    {headerName: "Cascade", field: "flagCascade", width: 40, filter: true, pinned: 'right', cellRenderer: 'renderCascadeIcon', cellClass: 'grid-cell-centered'}
  ],
  rowClassRules: gridRowClassRules
};

var gridOptionsImport={
  suppressRowClickSelection: true,
  rowSelection: 'multiple',
  defaultColDef: {
    resizable: true,
    filter: true,
    sortable: true
  },
  rowData: [],
  columnDefs: [
    {headerName: "", width:45, pinned: "left", headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, checkboxSelection: true},
    {headerName: "URL", field: "url", width: 400},
    {headerName: "ContentType", field: "contentType", width: 120},
    {headerName: "StatusCode", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "Size", field: "size", width: 100, filter: 'agNumberColumnFilter'},
    {headerName: "Date", field: "size", width: 100}
  ],
  // getRowClass: formatModifyHavestGridRow
};

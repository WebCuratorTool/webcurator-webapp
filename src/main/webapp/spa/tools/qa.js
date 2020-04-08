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
  var keyItems=key.split('-');
  var action=keyItems[0], scope=keyItems[1];
  var dataset;
  if(scope==='current'){
    dataset=[data];
  }else if(scope==='selected'){
    dataset=source.getSelectedNodes();
    source.deselectAll();
  }else if(scope==='all'){
    dataset=source.getAllNodes();
  }

  if(action==='hoppath'){
    visHopPath.draw(data.id);
  }else if(action==='import'){
    $('#specifyTargetUrlInput').val(data.url);
    $('#popup-window-import-input').show();
  }else if(action==='outlinks'){

  }else if(action==='prune'){
    target.pruneHarvest(dataset);
  }else if(action==='browse'){
    // 
  }else if(action==='undo'){
    target.undo(dataset, source);
  }else if(action==='clear'){
    source.clear(dataset);
  }
}

var itemsPruneHarvest={
                  "prune-current": {"name": "Current"},
                  "prune-selected": {"name": "Selected"}
              };
var itemsPruneHarvestCascade={
                  "pruneHarvestCurrentCascade": {"name": "Current"},
                  "pruneHarvestSelectedCascade": {"name": "Selected"}
              };
var itemsClearHarvest={
                  "clear-current": {"name": "Current"},
                  "clear-selected": {"name": "Selected"},
                  "clear-all": {"name": "All"},
              };
var itemsBrowse={
                  "browse-Url": {name: "Review this URL", icon: "fas fa-dice-one"},
                  "browse-InAccessTool": {name: "Review in Access Tool", icon: "fas fa-dice-two"},
                  "browse-LiveSite": {name: "Live Site", icon: "fas fa-dice-three"},
                  "browse-ArchiveOne": {name: "Archive One", icon: "fas fa-dice-four"},
                  "browse-ArchiveTwo": {name: "Archive Two", icon: "fas fa-dice-five"},
                  "browse-WebArchive": {name: "Web Archive", icon: "fas fa-dice-six"}
                };
var itemsUndo={
                  "undo-current": {name: "Current"},
                  "undo-selected": {name: "Selected"},
                  "undo-all": {name: "All"}
                };

var contextMenuItemsUrlBasic={
                  "hoppath-current": {name: "HopPath", icon: "fas fa-link"},
                  "import-current": {name: "Import", icon: "fas fa-file-import"},
                  "outlinks-current": {name: "Inspect Outlinks", icon: "fab fa-think-peaks"},
                  "sep1": "---------",
                  "pruneHarvest": {name: "Prune", icon: "far fa-times-circle", items: itemsPruneHarvest},
                  "sep2": "---------",
                  "clearHarvest": {name: "Clear", icon: "delete", items: itemsClearHarvest},
                  "sep3": "---------",
                  "browseUrl": {name: "Browse", icon: "fab fa-chrome", items: itemsBrowse}
                };

var contextMenuItemsPrune={
    "hoppath-current": {name: "HopPath", icon: "fas fa-link"},
    "sep1": "---------",
    "undo": {name: "Undo", icon: "fas fa-undo", items: itemsUndo},
    "sep2": "---------",
    "browseUrl": {name: "Browse", icon: "fab fa-chrome", items: itemsBrowse}
};

var contextMenuItemsImport={
  "undo": {name: "Undo", icon: "fas fa-undo", items: itemsUndo},
};

function formatModifyHavestGridRow(params){
  if(!params.data.flag){
    return 'grid-row-normal';
  }

  if (params.data.flag==='prune') {
    return 'grid-row-delete';
  }else if (params.data.flag==='import') {
    return 'grid-row-import';
  }else if (params.data.flag==='new') {
    return 'grid-row-new';
  }

  return 'grid-row-normal';
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
    {headerName: "Normal", children:[
      {headerName: "URL", field: "url", width: 400, filter: true},
      {headerName: "Type", field: "contentType", width: 120, filter: true},
      {headerName: "Status", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
      {headerName: "Size", field: "contentLength", width: 100, filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg},
    ]},
    {headerName: "Outlinks", children:[
        {headerName: "TotUrl", field: "totUrls", width: 100, filter: 'agNumberColumnFilter'},
        {headerName: "Failed", field: "totFailed", width: 100, filter: 'agNumberColumnFilter'},
        {headerName: "Success", field: "totSuccess", width: 100, filter: 'agNumberColumnFilter'},
        {headerName: "TotSize", field: "totSize", width: 100, filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg},
    ]},
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
    {headerName: "Normal", children:[
      {headerName: "URL", field: "url", width: 400, filter: true},
      {headerName: "Type", field: "contentType", width: 120, filter: true},
      {headerName: "Status", field: "statusCode", width: 100, filter: 'agNumberColumnFilter'},
      {headerName: "Size", field: "contentLength", width: 100, filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg},
    ]},
    {headerName: "Outlinks", children:[
        {headerName: "Tot", field: "totUrls", width: 100, filter: 'agNumberColumnFilter'},
        {headerName: "Failed", field: "totFailed", width: 100, filter: 'agNumberColumnFilter'},
        {headerName: "Success", field: "totSuccess", width: 100, filter: 'agNumberColumnFilter'},
        {headerName: "Size", field: "totSize", width: 100, filter: 'agNumberColumnFilter', valueFormatter: formatContentLengthAg},
    ]},
    // {headerName: "Cascade", field: "flagCascade", width: 40, filter: true, pinned: 'right', cellRenderer: 'renderCascadeIcon', cellClass: 'grid-cell-centered'}
  ],
  // rowClassRules: gridRowClassRules
  getRowClass: formatModifyHavestGridRow
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
  getRowClass: formatModifyHavestGridRow
};

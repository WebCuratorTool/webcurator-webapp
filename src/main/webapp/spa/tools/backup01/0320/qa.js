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
    $('#network-map-canvas').width('80vw');
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

var mapDomainStat={};





// Add Title field to Node to show tree grid
function addTitleForTreeGrid(listObj){
  for(var i=0;i<listObj.length;i++){
    var e=listObj[i];
    e.title=e.url;
    addTitleForTreeGrid(e.children);
  }
  return listObj;
}

function drawNetworkDomainGrid(networkGridContainer, dataset){
  $(networkGridContainer).fancytree({
          extensions: ["filter", "grid"],
          checkbox: false,
          quicksearch: false,
          autoScroll: true,
          debugLevel: 3,
          // minExpandLevel: 3,
          table: {
            indentation: 20,       // indent 20px per node level
            nodeColumnIdx: 1,      // render the node title into the nodeColumnIdx column
            checkboxColumnIdx: 0,  // render the checkboxes into the checkboxColumnIdx column
          },
          viewport: {
            enabled: true,
            count: 80
          },
          source: dataset,
          tooltip: function(event, data){
            return data.node.data.author;
          },
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
          filter: {
            autoExpand: true,
          },
          init: function(event, data) {
            data.tree.adjustViewportSize();
          },
          lazyLoad: function(event, data) {
            data.result = {url: "ajax-sub2.json"}
          },
          activateCell: function(event, data) {
            data.node.debug(event.type, data);
          },
          defaultGridAction: function( event, data ) {
            // Called when ENTER is pressed in cell-mode.
            data.node.debug(event.type, data);
          },
          renderColumns: function(event, data) {
            var node = data.node,
              $tdList = $(node.tr).find(">td");
            // (index #0 is rendered by fancytree by adding the checkbox)
            //$tdList.eq(4).html("<input type='checkbox' name='like' value='" + node.key + "'>");
            if (node.data.id>0) {
              var $span = $(node.span);
              $span.find("> span.fancytree-title").css({
                fontWeight: "bold"
              });
            }
            
            $tdList.eq(0).html("<a href='javascript:checkUrls(\"" + node.data.url +"\", \"" + node.data.contentType + "\"," + node.data.statusCode + ")'>Links</a>");
            $tdList.eq(2).text(node.data.totUrls);
            $tdList.eq(3).text(node.data.totSuccess);
            $tdList.eq(4).text(node.data.totFailed);
            $tdList.eq(5).text(node.data.totSize);
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
    });

    $.ui.fancytree.getTree(networkGridContainer).expandAll();
    return $(networkGridContainer).fancytree("getTree");

    // $.contextMenu({
    //     selector: networkGridContainer,
    //     items: {
    //       "details": {name: "URLs", icon: "paste",
    //           callback: function(key, opt){
    //             var node = $.ui.fancytree.getNode(opt.$trigger);
    //             alert("Clicked on " + key + " on " + node);
    //           }
    //         }  
    //     },
    //     callback: function(itemKey, opt) {
    //       var node = $.ui.fancytree.getNode(opt.$trigger);
    //       alert("select " + itemKey + " on " + node);
    //     }
    // });
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


var layoutColStatus=1;
function toggleLayoutCol(){
  if(layoutColStatus==1){
    layoutColStatus=2;
    $("#col-left").removeClass("col-xl-8");
    $("#col-left").addClass("col-xl-6");
    $("#col-right").removeClass("col-xl-4");
    $("#col-right").addClass("col-xl-6");
  }else{
    layoutColStatus=1;
    $("#col-left").removeClass("col-xl-6");
    $("#col-left").addClass("col-xl-8");
    $("#col-right").removeClass("col-xl-6");
    $("#col-right").addClass("col-xl-4");
  }
}

var columnDefs = [
          {headerName: "URL", field: "url", pinned: 'left',width: 1600, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, checkboxSelection: true},
          {headerName: "MimeType", field: "contentType", width: 200},
          {headerName: "StatusCode", field: "statusCode", width: 80},
          {headerName: "Size(Bytes)", field: "contentLength", width: 80},
          {headerName: "TotURLs", field: "totUrls", width: 80},
          {headerName: "TotSuccess", field: "totSuccess", width: 80},
          {headerName: "TotFailed", field: "totFailed", width: 80},
          {headerName: "TotSize(Bytes)", field: "totSize", width: 80}
    ];

var gridOptions = {
  // suppressRowClickSelection: true,
  rowSelection: 'single',
  defaultColDef: {
    resizable: true
  },
  columnDefs: columnDefs,
  rowData: []
};


var grid;
function initNetworkUrlGrid(networkGridContainer){
  // lookup the container we want the Grid to use
  var eGridDiv = document.querySelector(networkGridContainer);

  // create the grid passing in the div to use together with the columns & data we want to use
  grid = new agGrid.Grid(eGridDiv, gridOptions);
}
function drawNetworkUrlGrid(dataset){
  grid.gridOptions.api.setRowData(dataset);
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

function drawNetworkTree(networkTreeContainer, dataset){
  dataset=formatStringArrayToJsonArray(dataset);
  dataset=formatDataForTreeGrid(dataset);

  $(networkTreeContainer).fancytree({
          extensions: ["table", "wide"],
          checkbox: true,
          selectMode: 3,
          table: {
            checkboxColumnIdx: 0,
            nodeColumnIdx: 1
          },
          viewport: {
            enabled: true,
            count: 50,
          },
          source: dataset,
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
          }
    });
}



function drawHopPathFromSelectedURLs(){
  var selectedRows = grid.gridOptions.api.getSelectedRows();
  if (selectedRows.length==1) {
    sp("hoppath");
    fetchHopPath(selectedRows[0].id);
  }else{
    alert("Please select one and only one row!");
  }
}

function fetchHopPath(nodeId){
  var sourceUrl="/curator/networkmap/get/hop/path?job=" + jobId + "&harvestResultNumber=" + harvestResultNumber + "&id=" + nodeId;
  fetch(sourceUrl)
      .then((response) => {
          return response.json();
      })
      .then((data) => {
      drawHopPath(data);
      $('#popup-window-hop-path').show();
  });
}

var mapHopPath={};
function drawHopPath(data){
  var dataSet={
    nodes:[],
    edges:[]
  };

  for(var i=0; i<data.length;i++){
    var dataNode=data[i];
    var node={
      id: dataNode.id,
      label: dataNode.url+"\n (Outlinks:" + dataNode.outlinks.length + " )",
      size: 5 + Math.log(dataNode.totSize+1)
    }

    if(dataNode.seed){
      // node.color='#A18648';
      node.shape='star';
      // node.color='#2A4B7C';
      // node.shape='hexagon';
    }else if(i===0){
      node.color='#00bfee';
      node.shape="box";
    }

    dataSet.nodes.push(node);
    mapHopPath[dataNode.id]=dataNode;

    if(dataNode.parentId>0){
      var edge={
          from: dataNode.parentId,
          to: dataNode.id
      }
      dataSet.edges.push(edge);
    }
  }


  var networkMapOptions = {
      nodes: {
          shape: 'dot',
          // size: 10,
          borderWidth: 2,
          color: '#98AFC7'
       },
      edges: {
          width: 1,
          arrows: 'to',
          color: '#98AFC7'
      },
      layout: {
          hierarchical: {
              direction: "UD"
          }
      }
  };

  var hopPathContainer = document.getElementById('hoppath-canvas');

  visHopPath = new vis.Network(hopPathContainer, dataSet, networkMapOptions);
 }



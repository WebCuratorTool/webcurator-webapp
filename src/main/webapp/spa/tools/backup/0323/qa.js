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



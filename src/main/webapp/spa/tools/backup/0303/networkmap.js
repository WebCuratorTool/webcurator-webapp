function formatNetworkMapDomains(data){
  var dataSet={
    nodes:[],
    edges:[]
  };

  for(var i=0; i<data.length;i++){
    var domain=data[i];
    var node={
      id: domain.id,
      label: domain.url,
      size: 5 + Math.log(domain.totSize+1)
    }

    if(domain.seed){
      node.color='#A18648';
      node.shape='star';
    }

    dataSet.nodes.push(node);

    for(var j=0;j<domain.outlinks.length;j++){
      var edge={
        from: domain.id,
        to: domain.outlinks[j]
      }

      dataSet.edges.push(edge);
    }
    node.from=domain.id;
  }

  return dataSet;
}


function drawNetworkMap(networkMapContainer, data){
  var networkMapOptions = {
      
      nodes: {
          shape: 'dot',
          size: 10,
          borderWidth: 2,
          color: '#98AFC7'
       },
      edges: {
          width: 1,
          arrows: 'to'
      }
  };

  var network = new vis.Network(networkMapContainer, formatNetworkMapDomains(data), networkMapOptions);
  network.on("click", function (params) {
      params.event = "[original event]";
      console.log('click event, getNodeAt returns: ' + this.getNodeAt(params.pointer.DOM));
  });
  network.on("doubleClick", function (params) {
      params.event = "[original event]";
  });
  return network;
}

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

    // $.ui.fancytree.getTree().expandAll();
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
  $("#fancytree-container").hide();
  $("#fancytree-container-urls").show();

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

  var sourceUrl="/curator/networkmap/search/urls?job=36&harvestResultNumber=1";
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
      drawNetworkUrlGrid("#url-grid-continer", data);
  });
}


var layoutColStatus=1;
function toggleLayoutCol(){
  if(layoutColStatus==1){
    layoutColStatus=2;
    $("#col-left").removeClass("col-xl-9");
    $("#col-left").addClass("col-xl-6");
    $("#col-right").removeClass("col-xl-3");
    $("#col-right").addClass("col-xl-6");
  }else{
    layoutColStatus=1;
    $("#col-left").removeClass("col-xl-6");
    $("#col-left").addClass("col-xl-9");
    $("#col-right").removeClass("col-xl-6");
    $("#col-right").addClass("col-xl-3");
  }
}


function drawNetworkUrlGrid(networkGridContainer, dataset){
  for(var i=0;i<dataset.length;i++){
    var e=dataset[i];
    e.title=e.url;
    delete e["children"];
    delete e["outlinks"];
    //addTitleForTreeGrid(e.children);
  }

  $(networkGridContainer).fancytree({
          extensions: ["filter", "grid"],
          checkbox: true,
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
                scrollbarElement: document.getElementById("verticalScrollbarUrls"),
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
            $tdList.eq(2).text(node.data.contentType);
            $tdList.eq(3).text(node.data.statusCode);
            $tdList.eq(4).text(node.data.contentLength);
            $tdList.eq(5).text(node.data.totUrls);
            $tdList.eq(6).text(node.data.totSuccess);
            $tdList.eq(7).text(node.data.totFailed);
            $tdList.eq(8).text(node.data.totSize);
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

    // $.ui.fancytree.getTree().expandAll();
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
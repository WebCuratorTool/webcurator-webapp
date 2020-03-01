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

function drawNetworkDomainGrid(networkGridContainer, data){
  var dataset=addTitleForTreeGrid(data);
  $(networkGridContainer).fancytree({
          extensions: ["grid"],
          checkbox: false,
          quicksearch: false,
          autoScroll: true,
          debugLevel: 3,
          // minExpandLevel: 3,
          table: {
            indentation: 20,       // indent 20px per node level
            nodeColumnIdx: 0,      // render the node title into the 2nd column
            checkboxColumnIdx: 0,  // render the checkboxes into the 1st column
          },
          viewport: {
            enabled: true,
            count: 50,
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
            // $tdList.eq(1).text(node.getIndexHier());
            // (index #2 is rendered by fancytree)
            //$tdList.eq(4).html("<input type='checkbox' name='like' value='" + node.key + "'>");
            $tdList.eq(1).text(node.data.totUrls);
            $tdList.eq(2).text(node.data.totSuccess);
            $tdList.eq(3).text(node.data.totFailed);
            $tdList.eq(4).text(node.data.totSize);
          },
          updateViewport: function(event, data) {
            var tree = data.tree;
            // ,
            //   topNode = tree.visibleNodeList[tree.viewport.start],
            //   path = (topNode && !topNode.isTopLevel()) ? topNode.getPath(false) + "/..." : "";

            // tree.debug(event.type, data, tree.isVpUpdating);

            // Display breadcrumb/parent-path in header
            // tree.$container.find("thead th.parent-path").text(path);

            
            // Handle PlainScrollbar events
            tree.verticalScrollbar.set({
              start: tree.viewport.start,
              total: tree.visibleNodeList.length,
              visible: tree.viewport.count,
            }, true);  // do not trigger `onSet`
          }
    });

    $.ui.fancytree.getTree().expandAll();
}
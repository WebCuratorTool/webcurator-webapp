function formatNetworkMapDomains(data){
  var dataSet={
    nodes:[],
    edges:[]
  };

  for(var i=0; i<data.length;i++){
    var domain=data[i];
    var node={
      id: domain.key,
      label: domain.title,
      title: 'I have a popup',
      size: 5 + Math.log(domain.totSize+1)
    }

    if(domain.seed){
      node.color='#A18648';
      node.shape='star';
    }

    dataSet.nodes.push(node);

    for(var j=0;j<domain.outlinks.length;j++){
      var edge={
        from: domain.key,
        to: domain.outlinks[j]
      }

      dataSet.edges.push(edge);
    }
    node.from=domain.key;
  }

  return dataSet;
}


function drawNetworkMap(networkMapContainer, data){
  var networkMapOptions = {
      interaction:{hover:true},
      manipulation: {
          enabled: true
      },
      layout:{
          improvedLayout: true,
          clusterThreshold: 2
      },
      nodes: {
          shape: 'dot',
          size: 10,
          borderWidth: 2,
          color: '#98AFC7'
       },
      edges: {
          width: 1,
          arrows: 'to',
          color:'rgba(30,30,30,0.5)'
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


function drawNetworkTree(networkTreeContainer, data){
  var modelCount = 0;

  $(networkTreeContainer).fancytree({
          extensions: ["clones", "dnd5", "edit", "filter", "grid", "ariagrid"],
          // checkbox: true,
          quicksearch: true,
          autoScroll: true,
          debugLevel: 5,
          ariagrid: {
            // Internal behavior flags
            activateCellOnDoubelclick: true,
            cellFocus: $( "#optionsForm [name=cellFocus]" ).find( ":selected" ).val(),
            // TODO: use a global tree option `name` or `title` instead?:
            label: "Tree Grid", // Added as `aria-label` attribute
          },
          dnd5: {
            autoExpandMS: 1500,
            dragStart: function(node, data) {
              return true;
            },
            dragEnter: function(node, data) {
              return true;
            },
            dragDrop: function(node, data) {
              var transfer = data.dataTransfer;

              if( data.otherNode ) {
                data.otherNode.moveTo(node, data.hitMode);
              } else {
                node.addNode({
                  title: transfer.getData("text")
                }, data.hitMode);
              }
              // Expand target node when a child was created:
              if (data.hitMode === "over") {
                node.setExpanded();
              }
            },
          },
          edit: {
            // triggerStart: ["f2", "mac+enter", "shift+click"],
          },
          filter: {
            autoExpand: true,
          },
          table: {
            indentation: 20,       // indent 20px per node level
            nodeColumnIdx: 2,      // render the node title into the 2nd column
            checkboxColumnIdx: 0,  // render the checkboxes into the 1st column
          },
          viewport: {
            enabled: true,
            count: 30,
          },
          // source: dataset,
          source: data,
          postProcess: function(event, data) {
            
          },
          tooltip: function(event, data){
            return data.node.data.author;
          },
          init: function(event, data) {
            modelCount = data.tree.count();
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
            $tdList.eq(1).text(node.getIndexHier());  //.addClass("alignRight");
            // (index #2 is rendered by fancytree)
            //$tdList.eq(3).text(node._rowIdx);
            // $tdList.eq(3).text(node.data.qty);
            //$tdList.eq(4).html("<input type='checkbox' name='like' value='" + node.key + "'>");
            $tdList.eq(3).text(node.data.totUrls);
            $tdList.eq(4).text(node.data.totSuccess);
            $tdList.eq(5).text(node.data.totFailed);
            $tdList.eq(6).text(node.data.totSize);

          },
          updateViewport: function(event, data) {
            // var tree = data.tree,
            //   topNode = tree.visibleNodeList[tree.viewport.start],
            //   path = (topNode && !topNode.isTopLevel()) ? topNode.getPath(false) + "/..." : "";

            // tree.debug(event.type, data);

            // // Display breadcrumb/parent-path in header
            // tree.$container.find("thead th.parent-path").text(path);

            // // Update edit controls
            // if (!tree.isVpUpdating ) {
            //   $("input#vpStart").val(tree.viewport.start);
            //   $("input#vpCount").val(tree.viewport.count);
            //   $("span.statistics").text(
            //     ", rows: " +
            //     (tree.visibleNodeList ? tree.visibleNodeList.length : "-") +
            //     "/" +
            //     modelCount
            //   );
            // }
          }
    });
}
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


function drawNetworkDomainGrid(networkGridContainer, data){
    var columnDefs = [
      {headerName: "Domain", field: "title", pinned: 'left'},
      {headerName: "Size(Bytes)", field: "totSize", width: 80},
      {headerName: "URLs", field: "totUrls", width: 80},
      {headerName: "Success", field: "totSuccess", width: 80},
      {headerName: "Failed", field: "totFailed", width: 80}
    ];

    // specify the data
    var rowData = data;

    // let the grid know which columns and what data to use
    var gridOptions = {
      defaultColDef: {
        resizable: true
      },
      columnDefs: columnDefs,
      rowData: rowData
    };

  // lookup the container we want the Grid to use
  var eGridDiv = document.querySelector(networkGridContainer);

  // create the grid passing in the div to use together with the columns & data we want to use
  new agGrid.Grid(eGridDiv, gridOptions);
}
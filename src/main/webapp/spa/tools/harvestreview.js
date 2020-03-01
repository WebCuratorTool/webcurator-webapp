// Add Title,Lazy field to Node to show tree grid
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
            var outlinks="/curator/networkmap/get/outlinks?job=36&harvestResultNumber=1&id=" + data.node.data.id;
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
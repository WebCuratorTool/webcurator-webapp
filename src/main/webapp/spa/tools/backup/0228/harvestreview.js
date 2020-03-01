function drawNetworkTree(networkTreeContainer, data){
  var modelCount = 0;

  $(networkTreeContainer).fancytree({
          extensions: ["glyph", "table", "wide"],
          checkbox: true,
          selectMode: 3,
          glyph: {
            preset: "material",
            map: {}
          },
          table: {
            checkboxColumnIdx: 0,
            nodeColumnIdx: 1
          },
          // source: dataset,
          source: data,
          renderColumns: function(event, data) {
            var node = data.node,
              $tdList = $(node.tr).find(">td");
            // (index #0 is rendered by fancytree by adding the checkbox)
            // $tdList.eq(1).text(node.getIndexHier());  //.addClass("alignRight");
            // (index #2 is rendered by fancytree)
            //$tdList.eq(3).text(node._rowIdx);
            // $tdList.eq(3).text(node.data.qty);
            //$tdList.eq(4).html("<input type='checkbox' name='like' value='" + node.key + "'>");
            $tdList.eq(2).text(node.data.totUrls);
            $tdList.eq(3).text(node.data.totSuccess);
            $tdList.eq(4).text(node.data.totFailed);
            $tdList.eq(5).text(node.data.totSize);

          }
    });
}
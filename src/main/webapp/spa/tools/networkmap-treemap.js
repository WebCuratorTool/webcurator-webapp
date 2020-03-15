// d3 = require("d3@5");

width=1200;
height=500;
treemap = data => d3.treemap()
    .size([width, height])
    .padding(1)
    .round(true)
  (d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value));

  format = d3.format(",d");

  color = d3.scaleOrdinal(d3.schemeCategory10);


class NetworkMapTreeMap{
  constructor(containerContentType, containerStatusCode, statKey){
  	this.containerContentType=containerContentType;
  	this.containerStatusCode=containerStatusCode;
  	this.statKey=statKey;
    this.maxContentType;
    this.node;
  }

  setData=function(node){
    this.node=node;
  }

  draw=function(){
    var node=this.node;
    var statMap={};
    for(var i=0; i<node.statData.length; i++){
      var statNode=node.statData[i];
      var contentType=statNode.contentType;
      var statusCode=statNode.statusCode;
      var value=statNode[this.statKey];

      var contentTypeNode=statMap[contentType];
      if(!contentTypeNode){
        contentTypeNode={
          'self': {'value':0}
        };
        statMap[contentType]=contentTypeNode;
      }

      var selfNode=contentTypeNode['self'];
      selfNode.value=selfNode.value + value;


      var statusCodeNode=contentTypeNode[statusCode];
      if(!statusCodeNode){
        statusCodeNode={'value': 0};
        contentTypeNode[statusCode]=statusCodeNode;
      }
      statusCodeNode.value = statusCodeNode.value + value;
    }


    var treeData={name: 'root', children:[]};
    for(var contentType in statMap){
        var contentTypeNode=statMap[contentType];
        var contentTypeTreeNode={
          'name': contentType + '(' + contentTypeNode.self.value + ')',
          'children': [],
          'colname': 'level2'
        }
        treeData.children.push(contentTypeTreeNode);

        for(var statusCode in contentTypeNode){
          if(statusCode === 'self'){
            continue;
          }

          var statusCodeNode=contentTypeNode[statusCode];
          var statusCodeTreeNode={
            'name': statusCode,
            'value': statusCodeNode.value,
            'colname': 'level3'
          }

          contentTypeTreeNode.children.push(statusCodeTreeNode);
        }
    }

    this.drawTreeMap(treeData);
  }



  drawTreeMap2(data){
      const root = treemap(data);
      // const root = d3.hierarchy(data).sum(function(d){ return d.value}) // Here the size of each leave is given in the 'value' field in input data


      // set the dimensions and margins of the graph
      var margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = 1245 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      var svg = d3.select("#" + this.containerContentType)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");




        const leaf = svg.selectAll("g")
          .data(root.leaves())
          .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        leaf.append("title")
            .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${format(d.value)}`);

        leaf.append("rect")
            .attr("id", d => (d.leafUid = DOM.uid("leaf")).id)
            .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
            .attr("fill-opacity", 0.6)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

        leaf.append("clipPath")
            .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
          .append("use")
            .attr("xlink:href", d => d.leafUid.href);

        leaf.append("text")
            .attr("clip-path", d => d.clipUid)
          .selectAll("tspan")
          .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value)))
          .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .text(d => d);
  }


  drawTreeMap(data){
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 1245 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#" + this.containerContentType)
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // read json data
    // Give the data to this cluster layout:
      var root = d3.hierarchy(data).sum(function(d){ return d.value}) // Here the size of each leave is given in the 'value' field in input data

      // Then d3.treemap computes the position of each element of the hierarchy
      d3.treemap()
        .size([width, height])
        .paddingTop(28)
        .paddingRight(7)
        .paddingInner(3)      // Padding between each rectangle
        //.paddingOuter(6)
        //.padding(20)
        (root);

      // prepare a color scale
      var color = d3.scaleOrdinal()
        .domain(["boss1", "boss2", "boss3"])
        .range([ "#402D54", "#D18975", "#8FD175"]);

      // And a opacity scale
      var opacity = d3.scaleLinear()
        .domain([10, 30])
        .range([.5,1]);

      // use this information to add rectangles:
      svg
        .selectAll("rect")
        .data(root.leaves())
        .enter()
        .append("rect")
          .attr('x', function (d) { return d.x0; })
          .attr('y', function (d) { return d.y0; })
          .attr('width', function (d) { return d.x1 - d.x0; })
          .attr('height', function (d) { return d.y1 - d.y0; })
          .style("stroke", "black")
          .style("fill", function(d){ return color(d.parent.data.name)} )
          .style("opacity", function(d){ return opacity(d.data.value)});

      // and to add the text labels
      svg
        .selectAll("text")
        .data(root.leaves())
        .enter()
        .append("text")
          .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
          .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
          .text(function(d){ return d.data.name.replace('mister_','') })
          .attr("font-size", "19px")
          .attr("fill", "white");

      // and to add the text labels
      svg
        .selectAll("vals")
        .data(root.leaves())
        .enter()
        .append("text")
          .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
          .attr("y", function(d){ return d.y0+35})    // +20 to adjust position (lower)
          .text(function(d){ return d.data.value })
          .attr("font-size", "11px")
          .attr("fill", "white");

      // Add title for the 3 groups
      svg
        .selectAll("titles")
        .data(root.descendants().filter(function(d){return d.depth==1}))
        .enter()
        .append("text")
          .attr("x", function(d){ return d.x0})
          .attr("y", function(d){ return d.y0+21})
          .text(function(d){ return d.data.name })
          .attr("font-size", "19px")
          .attr("fill",  function(d){ return color(d.data.name)} );

      // Add title for the 3 groups
      svg
        .append("text")
          .attr("x", 0)
          .attr("y", 14)    // +20 to adjust position (lower)
          .text("Three group leaders and 14 employees")
          .attr("font-size", "19px")
          .attr("fill",  "grey" );



  }
}


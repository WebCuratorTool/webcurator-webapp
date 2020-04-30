


// format = d3.format(",d");

function format(d){
  // return d3.format(",d");
  return '';
}

class NetworkMapMenuMap{
  constructor(container, key1, key2){
  	this.container=container;
  	this.key1=key1;
    this.key2=key2;

    this.defaultHeight=2100;
    this.width=800;
    this.height=2100;
    this.minCellHeight=100;
    this.maxLines=0;

    this.partition = data => {
        const root = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.height - a.height || b.value - a.value);  
        return d3.partition()
            .size([this.height, (root.height + 1) * this.width / 2])
          (root);
      };
    this.format = d3.format(",d");

    this.svg = d3.select(this.container).append("svg");
  }
  
  draw(node){
    this.height=this.defaultHeight;
    this.maxLines=0;
    var statMap=this.summary(node);
    this.dataset=this.map2list(statMap);
    this.height=Math.max(this.height, this.maxLines*this.minCellHeight);
    this.appendPosition(this.dataset, 0);

    // append the svg object to the body of the page

    this.svg.attr("viewBox", [0, 0, this.width, this.height])
            .style("font", "24px sans-serif");

    this.color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.dataset.length));

    this.drawMenuMap(this.dataset, this.dataset[0].children);
  }

  
  drawMenuMap(dataLevel1, dataLevel2){
    var data=[];
    data=data.concat(dataLevel1);
    data=data.concat(dataLevel2);
    console.log(data);
    this.svg.selectAll("g").remove();

    const cell = this.svg
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

    const rect = cell.append("rect")
    .attr("width", d => d.x1 - d.x0 - 1)
    .attr("height", d => d.y1 - d.y0 -1)
    .attr("fill-opacity", 0.6)
    .attr("fill", d =>this.color(d.colorName))
    .style("cursor", "pointer")
    .on("click", clicked);

    const text = cell.append("text")
    .style("user-select", "none")
    .attr("pointer-events", "none")
    .attr("x", 4)
    .attr("y", 30);

    text.append("tspan")
    .text(d => d.name)
    .append("tspan").attr('dy', '1.2em').attr('x', '0')
    .text(d => 'URLs: ' + d.totUrls)
    .append("tspan").attr('dy', '1.2em').attr('x', '0')
    .text(d => 'Size: ' + d.totSize);

    const that=this;
    function clicked(p){
      if(!p.children || p.children.length<=0){
        return;
      }

      that.drawMenuMap(that.dataset, p.children);
    }
  }


  summary(node){
    var statMap={};
    for(var i=0; i<node.statData.length; i++){
      var statNode=node.statData[i];
      var label1=statNode[this.key1];
      var label2=statNode[this.key2];
      var totUrls=statNode['totUrls'];
      var totSize=statNode['totSize'];

      var nodeLevel1=statMap[label1];
      if(!nodeLevel1){
        nodeLevel1={
          name: label1,
          totUrls: 0,
          totSize: 0,
          children: {},
          length: 0
        };
        statMap[label1]=nodeLevel1;
      }
      nodeLevel1.totUrls=nodeLevel1.totUrls + totUrls;
      nodeLevel1.totSize=nodeLevel1.totSize + totSize;


      var nodeLevel2=nodeLevel1.children[label2];
      if(!nodeLevel2){
        nodeLevel2={
          name: label2,
          totUrls: 0,
          totSize: 0,
        };
        nodeLevel1.children[label2]=nodeLevel2;
        nodeLevel1.length=nodeLevel1.length+1;
      }
      nodeLevel2.totUrls=nodeLevel2.totUrls + totUrls;
      nodeLevel2.totSize=nodeLevel2.totSize + totSize;
    }

    return statMap;
  }


  map2list(statMap){
    var dataset=[];
    
    for(var label1 in statMap){
      var nodeLevel1={
        name: label1,
        totUrls: statMap[label1].totUrls,
        totSize: statMap[label1].totSize,
        children: [],
        colorName: label1
      };

      dataset.push(nodeLevel1);

      for (var label2 in statMap[label1].children) {
        var nodeLevel2=statMap[label1].children[label2];
        nodeLevel1.children.push({
          name: label2,
          totUrls: nodeLevel2.totUrls,
          totSize: nodeLevel2.totSize,
          children: [],
          colorName: label1
        });
      }

      this.maxLines=Math.max(this.maxLines, nodeLevel1.children.length);
    }

    this.maxLines=Math.max(this.maxLines, dataset.length);

    return dataset;
  }

  appendPosition(dataset, wOffset){
    if(!dataset || dataset.length===0){
      return;
    }

    var sliceHeight=this.height/dataset.length;
    for(var i=0;i<dataset.length;i++){
      var node=dataset[i];
      node['x0']=wOffset;
      node['x1']=wOffset+this.width/2;
      node['y0']=i*sliceHeight;
      node['y1']=(i+1)*sliceHeight;
      this.appendPosition(node.children, wOffset+this.width/2);
    }
  }
}


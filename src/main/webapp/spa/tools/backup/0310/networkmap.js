class NetworkMap{
  constructor(container){
    this.container=container;
    this.options={
      nodes: {shape: 'dot', size: 10, borderWidth: 1, color: '#98AFC7'},
      edges: {width: 1, arrows: 'to', color: '#98AFC7'},
      physics: {
        enabled: true,
        forceAtlas2Based: {
            gravitationalConstant: -26,
            centralGravity: 0.005,
            springLength: 70,
            springConstant: 0.18
        },
        minVelocity: 0.75,
        maxVelocity: 146,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: {
            enabled:true,
            iterations:100,
            updateInterval:25,
            onlyDynamicEdges: false,
            fit: true
        }
      },
      groups:{
        
      }
    };

    this.stabilized=false;

    this.colors={
      "seed": "#2A4B7C",
      "high": "#98AFC7",
      "lower": "#ffbf00",
      "expand": "#C24125"
    }

    this.viewOptions={
      scale: -1,
      position: {x:0, y:0}
    };

    this.scale=-1;
  }

  draw=function(data){
    this.dataMap=this.initialDataSet(data);
    this.createNetwork(dataset, this.options);
  }

  createNetwork=function(options){
    var dataset=this.formatDataSet();

    if(this.network){
      this.network.destroy();
    }
    this.network = new vis.Network(this.container, dataset, options);

    var that=this;

    //Event: doubleClic
    this.network.on("click", function (params) {
        if(params.nodes.length<=0){
          return;
        }

        var nodeId=params.nodes[0];
        var node=that.dataMap[nodeId];
        console.log("x="+node.x+", y="+node.y);
    });

    //Event: doubleClic
    this.network.on("doubleClick", function (params) {
        if(params.nodes.length<=0){
          return;
        }

        var nodeId=params.nodes[0];

        // var node=mapDomainStat[nodeId];
        // checkUrls(node.url);
        that.toggleParentNode(nodeId);
    });

    //Event: statbilized
    this.network.on("stabilized", function(){
      if(!that.stabilized){
        console.log("stabilized");
        // that.network.setOptions({physics: false});
        that.options.physics.stabilization.iterations=1;
        that.network.setOptions(that.options);
        that.attachPositions();
        that.originalDataMap=JSON.parse(JSON.stringify(that.dataMap));
        that.stabilized=true;
      }
    });

    //========Revover the scale and position after pyhsics simulation========
    this.network.on("release", function(params){
      that.viewOptions.scale=that.network.getScale();
      that.viewOptions.position=that.network.getViewPosition();
    });
    this.network.on("initRedraw", function(){
      if(that.viewOptions.scale > 0){
        that.network.moveTo(that.viewOptions);
        that.viewOptions.scale = -1;
      }    
    });
    //========================================================================
  }

  /**Initial data*/
  initialDataSet=function(data){
    var dataMap={};
    for(var i=0; i<data.length;i++){
      var node=data[i];
      var level="high";
      if(node.children.length===1){
        node=node.children[0];
        level="lower";
      }
      node.level=level;
      dataMap[node.id]=node;
    }
    return dataMap;
  }

  /**Format data to dataset acceptable to vis network*/
  formatDataSet=function(){
    var dataSet={
          nodes:[],
          edges:[]
        };

    for(var key in this.dataMap){
      var dataNode=this.dataMap[key];
      var node={
        id: dataNode.id,
        label: dataNode.title,
        size: 5 + Math.log(dataNode.totSize+1)
        // group: dataNode.parentId
      }

      if (dataNode.x && dataNode.y) {
        node.x=dataNode.x;
        node.y=dataNode.y;
      }

      node.color=this.colors[dataNode.level];

      if(dataNode.seed){
        node.color=this.colors['seed'];
        node.shape='hexagon';
      }

      dataSet.nodes.push(node);

      this.dataMap[dataNode.id]=dataNode;

      for(var j=0;j<dataNode.outlinks.length;j++){
        var outlinkNode=this.dataMap[dataNode.outlinks[j]];
        if(outlinkNode){
          var edge;
          if (outlinkNode.parentId===dataNode.id) {
            edge={
              from: dataNode.id,
              to: outlinkNode.id,
              dashes: true,
              width: 0.5,
              color:{color: 'rgba(30,30,30,0.5)'}
            }
          }else{
            edge={
              from: dataNode.id,
              to: outlinkNode.id            
            }
          }

          dataSet.edges.push(edge);
        }
      }
      // node.from=dataNode.id;
    }

    return dataSet;
  }

  /**Set position to data set*/
  attachPositions=function(){
    var dataPositionArray=this.network.getPositions();
    for(var key in dataPositionArray){
      var pos=dataPositionArray[key];
      var node=this.dataMap[key];
      node.x=pos.x;
      node.y=pos.y;
    }
    // console.log(this.dataMap);
  }

  toggleParentNode(parentId){
    var parentNode=this.dataMap[parentId];
    if (!parentNode) {
      console.log("Node does not exist, parentId="+parentId);
      return;
    }

    if (parentNode.expanded) {
      this.collapseParentNode(parentNode);
    }else{
      this.expandParentNode(parentNode);
    }
  }

  collapseParentNode(parentNode){
     var children=parentNode.children;
     for(var i=0;i<children.length;i++){
        var child=children[i];
        delete this.dataMap[child.id];
     }

    var dataset=this.formatDataSet();
    this.network.setData(dataset);
    parentNode["expanded"]=false;
  }

  /**Expand a high level node*/
  expandParentNode(parentNode){
    console.log("Selected node:");
    console.log();

    if (parentNode.children.length<=1) { //Nothing to expand
      return;
    }


    var minX=parentNode.x, minY=parentNode.y, maxX=parentNode.x, maxY=parentNode.y;
    for(var key in this.dataMap){
      var node=this.dataMap[key];
      if(node.x<minX){
        minX=node.x;
      }
      if(node.y<minY){
        minY=node.y;
      }
      if(node.x>maxX){
        maxX=node.x;
      }
      if(node.y>maxY){
        maxY=node.y;
      }
    }


    //To empty 10% for children
    var width=maxX - minX, height=maxY - minY;
    
    if (parentNode.x===0 || parentNode.y===0) {
      this.windFromCenter(width, height, parentNode);
    }else{
      this.windToSigleDirection(width, height, parentNode);
    }

    parentNode["expanded"]=true;

    // this.scale=this.network.getScale();

    var dataset=this.formatDataSet();
    this.network.setData(dataset);
  }


  //Move the existing from center
  windFromCenter=function(width, height, parentNode){
    var subWidth=width/5, subHeight=height/5;
    var halfSubWidth=subWidth/2, halfSubHeight=subHeight/2;

    //Moving other nodes
    // for(var key in this.dataMap){
    //   var node=this.dataMap[key];
    //   if(node.x<parentNode.x){
    //     node.x=node.x - halfSubWidth;
    //   }else{
    //     node.x=node.x + halfSubWidth; 
    //   }

    //   if(node.y<parentNode.y){
    //     node.y=node.y - halfSubHeight;
    //   }else{
    //     node.y=node.y + halfSubHeight;
    //   }
    // }

    // var scale=this.network.getScale();
    var children=parentNode.children;
    
    parentNode.x=parentNode.x - subWidth;
    parentNode.y=parentNode.y - subHeight;
    for(var i=0;i<children.length;i++){
      var child=children[i];
      var pos=generateRandomPosition(subWidth, subHeight);
      child.x=parentNode.x+pos.w;
      child.y=parentNode.y+pos.h;
      child.level="lower";
      this.dataMap[child.id]=child;
    }
  }


  //Moving the existing to one direct
  windToSigleDirection(width, height, parentNode){
    var signX=parentNode.x/Math.abs(parentNode.x), signY=parentNode.y/Math.abs(parentNode.y);
    var subWidth=signX*width/5, subHeight=signY*height/5;

    //Moving other nodes
    // for(var key in this.dataMap){
    //   var node=this.dataMap[key];
    //   var signXX=node.x/Math.abs(node.x), signYY=node.y/Math.abs(node.y);
    //   if(signX===signXX && signY===signYY && Math.abs(node.x)>Math
    //     .abs(parentNode.x) && Math.abs(node.y)>Math.abs(parentNode.y)){
    //     node.x=node.x + subWidth; 
    //     node.y=node.y + subHeight;
    //   }
    // }

    var children=parentNode.children;
    for(var i=0;i<children.length;i++){
      var child=children[i];
      var pos=generateRandomPosition(subWidth, subHeight);
      child.x=parentNode.x+pos.w+5*signX;
      child.y=parentNode.y+pos.h+5*signY;
      child.level="expand";
      this.dataMap[child.id]=child;
    }

  }
}

//Genereate the position for children node
function generateRandomPosition(width, height){
  var node={};
  node.w=Math.floor(Math.random() * width);
  node.h=Math.floor(Math.random() * height);  
  return node;
}



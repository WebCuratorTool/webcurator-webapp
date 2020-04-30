class NetworkMapChart{
  constructor(containerContentType, containerStatusCode, statKey){
  	this.containerContentType=containerContentType;
  	this.containerStatusCode=containerStatusCode;
  	this.statKey=statKey;
  	this.options={
  		// title: title
  	};
  }

  draw=function(node){
    google.charts.load('current', {'packages':['corechart']});

    // google.load('visualization', '1' , {'packages':['corechart']});
    google.charts.setOnLoadCallback(this.redraw(this, node));
  }

  redraw=function(that, node){
    that.ctx=setInterval(that.drawContentType(node), 1000);
  }

  drawContentType=function(node){
     console.log('visualization initialed');
    if(google.visualization){
      console.log('visualization initialed');
      clearInterval(this.ctx); 

      var stat={};
      var maxKey=null, maxValue=0;
      for(var i=0; i<node.statData.length; i++){
        var statNode=node.statData[i];
        var contentType=statNode.contentType;
        var value=statNode[this.statKey];
        if(stat[contentType]){
          stat[contentType]=stat[contentType] + value;
        }else{
          stat[contentType]=value;
        }

        if(stat[contentType] > maxValue){
          maxValue=stat[contentType];
          maxKey=contentType;
        }
      }

      var chartContainer=document.getElementById(this.containerContentType);
      var chart = new google.visualization.PieChart(chartContainer);
      chart.draw(formatGoogleChartData(stat), this.options);


      this.drawStatusCode(node, maxKey);
    }
  	
  }

  drawStatusCode=function(node, contentType){
  	var stat={};
  	for(var i=0; i<node.statData.length; i++){
  		var statNode=node.statData[i];
  		var statusCode=statNode.statusCode;
  		var value=statNode[this.statKey];
  		if(stat[statusCode]){
  			stat[statusCode]=stat[statusCode] + value;
  		}else{
  			stat[statusCode]=value;
  		}
  	}

	  var chart = new google.visualization.PieChart(document.getElementById(this.containerStatusCode));
    chart.draw(formatGoogleChartData(stat), this.options);
  }
}


formatGoogleChartData=function(data){
  var list=[];
  list.push(['key','value']);
  for(var key in data){
    var value=data[key];
    list.push([key,value]);
  }

  return new google.visualization.arrayToDataTable(list);
}
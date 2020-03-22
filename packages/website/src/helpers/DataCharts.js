import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import {formatNumber, dashboardColors} from "./Util";

am4core.useTheme(am4themes_animated);


var timeLineChart;
export let renderTimeline = (home, caseData) => {
        
    let days = caseData.length;
    
    if (!timeLineChart) {
        timeLineChart = am4core.create("timelinediv", am4charts.XYChart);
    
        var dateAxis = timeLineChart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.minGridDistance = 50;
        
        timeLineChart.yAxes.push(new am4charts.ValueAxis());
        timeLineChart.legend = new am4charts.Legend();

        let addSeries = (field, name, color, snap) => {
            // Create series
            var series = timeLineChart.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = field;
            series.dataFields.dateX = "date";
            series.strokeWidth = 2;
            series.minBulletDistance = 10;
            series.name = name;
            series.tooltipText = "{name}: [bold]{valueY}[/]";
            
            series.tooltip.getFillFromObject = false;
            series.tooltip.background.fill = am4core.color("#ccc");
            series.tooltip.autoTextColor = false;
            series.tooltip.label.fill = am4core.color("black");
            series.tooltip.getStrokeFromObject = false;
            series.tooltip.background.strokeWidth = 3;
            series.stroke = color;

            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12,12,12,12);
            series.fillOpacity = 0.3;
            series.fill = color;
            series.stacked = false;
            
            if (snap) {
                // Add scrollbar
                let scrollBar = timeLineChart.scrollbarX = new am4charts.XYChartScrollbar();
    
                var day;
                scrollBar.events.on("up", function(ev) {
                    home.onDayChange({day: day});
                });
    
                scrollBar.events.on("rangechanged", function(ev) {
                    day = Math.round(days * ev.target.end);
                });
    
                timeLineChart.scrollbarX.series.push(series);
            }
            return series; 
        };

        addSeries("active", "Active Cases", dashboardColors.activeCases, true);
        addSeries("deaths", "Deaths", dashboardColors.deaths);
        addSeries("recoveries", "Recoveries", dashboardColors.recoveries);
    
        timeLineChart.cursor = new am4charts.XYCursor();
    }

    timeLineChart.data = caseData;
};

var statusChart = null;
var statusLabel = null;
export let renderStatus = (status) => {

    if (!statusChart) {
        // Create chart instance
        statusChart = am4core.create("statusdiv", am4charts.PieChart);
        statusChart.startAngle = 160;
        statusChart.endAngle = 380;

                // Add label
        statusChart.innerRadius = 150;
        statusLabel = statusChart.seriesContainer.createChild(am4core.Label);

        statusLabel.horizontalCenter = "middle";
        statusLabel.verticalCenter = "middle";
        statusLabel.textAlign = "middle";
        statusLabel.fontSize = 35;
        statusLabel.fill = "#999999";

        // Add and configure Series
        var pieSeries = statusChart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "size";
        pieSeries.dataFields.category = "sector";
        pieSeries.labels.template.disabled = true;
        pieSeries.ticks.template.disabled = true;

        var colorSet = new am4core.ColorSet();
            colorSet.list = [dashboardColors.deaths, dashboardColors.recoveries, dashboardColors.activeCases].map(function(color) {
            let c = new am4core.color(color);
            c.alpha = 0.7;
            return c;
        });
        pieSeries.colors = colorSet;
    }

    let record = status[status.length-1];
    statusLabel.text = "Total Cases \n"+formatNumber(record.cases);

    // Add data
    statusChart.data = [
        {sector: "Deaths", size: record.deaths }, 
        {sector: "Recoveries", size: record.recoveries },
        {sector: "Active Cases", size: record.cases }
    ];
};

var summaryChart;
export let renderSummary = (summary) => {

    if (!summaryChart) {
        summaryChart = am4core.create("summarydiv", am4charts.XYChart);
        summaryChart.hiddenState.properties.opacity = 0; // this creates initial fade-in
    
        let title = summaryChart.titles.create();
        title.text = "Top 20 Regions by Active Cases";
        title.fontSize = 16;
        title.marginBottom = 4;
        title.fontWeight = "700";
        title.align = "left";

        summaryChart.colors.step = 2;
        summaryChart.padding(30, 30, 10, 30);
        summaryChart.legend = new am4charts.Legend();
    
        var categoryAxis = summaryChart.xAxes.push(new am4charts.CategoryAxis());
        categoryAxis.dataFields.category = "category";
        categoryAxis.renderer.grid.template.location = 0;
    
        var valueAxis = summaryChart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.strictMinMax = false;
        valueAxis.calculateTotals = true;
        valueAxis.renderer.minWidth = 50;
    
        let addSeries = (name, color, value) => { 
            var series1 = summaryChart.series.push(new am4charts.ColumnSeries());
            series1.columns.template.width = am4core.percent(80);
            series1.columns.template.tooltipText =
            "{name}: {valueY.formatNumber('#,###')}";
            series1.name = name;
            series1.dataFields.categoryX = "category";
            series1.dataFields.valueY = value;
            series1.dataFields.valueYShow = "total";
            series1.dataItems.template.locations.categoryX = 0.5;
            series1.stacked = true;
            series1.tooltip.pointerOrientation = "vertical";
            series1.fill = am4core.color(color);
            series1.fillOpacity = 0.7;
            series1.strokeWidth = 0;
    
            var bullet1 = series1.bullets.push(new am4charts.LabelBullet());
            bullet1.interactionsEnabled = false;
            bullet1.label.text = "{valueY.formatNumber('#,###')}";
            bullet1.label.fill = am4core.color("#ffffff");
            bullet1.locationY = 0.5;
        }

        addSeries("Active Cases", dashboardColors.activeCases, "value1");
        addSeries("Deaths", dashboardColors.deaths, "value2");
        addSeries("Recoveries", dashboardColors.recoveries, "value3");

        summaryChart.scrollbarX = new am4core.Scrollbar();
    }

    summaryChart.data = summary;
};

var mortalityRateChart;
export let renderMortalityRates = (mortalityRates) => {

    if (!mortalityRateChart) {
        mortalityRateChart = am4core.create("mortalitydiv", am4charts.XYChart);

        let title = mortalityRateChart.titles.create();
        title.text = "Observed Mortality Against Recovery Rates";
        title.fontSize = 16;
        title.marginBottom = 4;
        title.fontWeight = "700";
        title.align = "left";

        var legend = new am4charts.Legend();
        legend.useDefaultMarker = true;
        legend.position = "bottom";
        mortalityRateChart.legend = legend;

        var valueAxisX = mortalityRateChart.xAxes.push(new am4charts.ValueAxis());
        valueAxisX.renderer.ticks.template.disabled = true;
        valueAxisX.renderer.axisFills.template.disabled = true;
    
        var valueAxisY = mortalityRateChart.yAxes.push(new am4charts.ValueAxis());
        valueAxisY.renderer.ticks.template.disabled = true;
        valueAxisY.renderer.axisFills.template.disabled = true;
    
        let addSeries = (name, xval, yval, val, color) => {
            var series = mortalityRateChart.series.push(new am4charts.LineSeries());
            series.dataFields.valueX = xval;
            series.dataFields.valueY = yval;
            series.dataFields.value = val;
            series.strokeOpacity = 0;
            series.sequencedInterpolation = true;
            series.tooltip.pointerOrientation = "vertical";
            series.hiddenInLegend = false;
            series.legendSettings.valueText = name;
            series.fill = am4core.color(color);

            var bullet = series.bullets.push(new am4core.Circle());
            bullet.fill = am4core.color(color);
            bullet.strokeOpacity = 0;
            bullet.strokeWidth = 2;
            bullet.fillOpacity = 0.5;
            bullet.stroke = am4core.color("#ffffff");
            bullet.hiddenState.properties.opacity = 0;
            bullet.tooltipText = "[bold]{title}:[/]\nTotal Cases: {value.value.formatNumber('#,###')}\nMortality Rate: {valueX.value.formatNumber('#.00')}%\nRecovery Rate: {valueY.value.formatNumber('#.00')}%";
        
            var outline = mortalityRateChart.plotContainer.createChild(am4core.Circle);
            outline.fillOpacity = 0;
            outline.strokeOpacity = 0.8;
            outline.stroke = am4core.color("#ff0000");
            outline.strokeWidth = 0;
            outline.hide(0);
        
            var blurFilter = new am4core.BlurFilter();
            outline.filters.push(blurFilter);
        
            bullet.events.on("over", function(event) {
                var target = event.target;
                outline.radius = target.pixelRadius + 2;
                outline.x = target.pixelX;
                outline.y = target.pixelY;
                outline.show();
            });
        
            bullet.events.on("out", function(event) {
                outline.hide();
            });
        
            var hoverState = bullet.states.create("hover");
            hoverState.properties.fillOpacity = 1;
            hoverState.properties.strokeOpacity = 1;
        
            series.heatRules.push({ target: bullet, min: 2, max: 60, property: "radius" });
        
            bullet.adapter.add("tooltipY", function (tooltipY, target) {
                return -target.radius;
            });

        };
        
        mortalityRateChart.cursor = new am4charts.XYCursor();
        mortalityRateChart.cursor.behavior = "zoomXY";

    
        mortalityRateChart.scrollbarX = new am4core.Scrollbar();
        mortalityRateChart.scrollbarY = new am4core.Scrollbar();

        addSeries("Declining", "dx", "dy", "dvalue", dashboardColors.recoveries);
        addSeries("Increasing", "ix", "iy", "ivalue", dashboardColors.deaths);
    }

    mortalityRateChart.data = mortalityRates.map((x) => {
        if (x.rate === "Declining") {
            return {
                title: x.title,
                dx: x.x,
                dy: x.y,
                dvalue: x.value
            };
        } else {
            return {
                title: x.title,
                ix: x.x,
                iy: x.y,
                ivalue: x.value
            };
        }
    });
};
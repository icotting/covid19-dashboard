import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import {formatNumber} from "./Util";

am4core.useTheme(am4themes_animated);

export let renderTimeline = (caseData) => {
        
        // Create chart instance
        var chart = am4core.create("timelinediv", am4charts.XYChart);
        
        // Add data
        chart.data = caseData;
        
        // Create axes
        var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.minGridDistance = 50;
        
        var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        
        
        let addSeries = (field, name, snap) => {
            // Create series
            var series = chart.series.push(new am4charts.LineSeries());
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

            series.tooltip.getStrokeFromObject = true;
            series.tooltip.background.strokeWidth = 3;

            series.tooltip.pointerOrientation = "vertical";
            series.tooltip.background.cornerRadius = 20;
            series.tooltip.background.fillOpacity = 0.5;
            series.tooltip.label.padding(12,12,12,12);
            series.fillOpacity = 0.3;
            series.stacked = false;
            
            if (snap) {
                // Add scrollbar
                chart.scrollbarX = new am4charts.XYChartScrollbar();
                chart.scrollbarX.series.push(series);
            }
        };

        addSeries("active", "Active Cases", true);
        addSeries("deaths", "Deaths");
        addSeries("recoveries", "Recoveries");

        chart.cursor = new am4charts.XYCursor();
};

export let renderStatus = (status) => {
    // Create chart instance
    var chart = am4core.create("statusdiv", am4charts.PieChart);
    chart.startAngle = 160;
    chart.endAngle = 380;

    let record = status[status.length-1];
    // Add data
    chart.data = [
        {sector: "Deaths", size: record.deaths }, 
        {sector: "Recoveries", size: record.recoveries }
    ];

    // Add label
    chart.innerRadius = 150;
    var label = chart.seriesContainer.createChild(am4core.Label);
    label.text = "Total Cases \n"+formatNumber(record.cases);
    label.horizontalCenter = "middle";
    label.verticalCenter = "middle";
    label.textAlign = "middle";
    label.fontSize = 35;

    // Add and configure Series
    var pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "size";
    pieSeries.dataFields.category = "sector";
    pieSeries.labels.template.disabled = true;
    pieSeries.ticks.template.disabled = true;
};

export let renderSummary = (summary) => {
    var chart = am4core.create("summarydiv", am4charts.XYChart);
    chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

    chart.data = summary;

    chart.colors.step = 2;
    chart.padding(30, 30, 10, 30);
    chart.legend = new am4charts.Legend();

    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "category";
    categoryAxis.renderer.grid.template.location = 0;

    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.strictMinMax = false;
    valueAxis.calculateTotals = true;
    valueAxis.renderer.minWidth = 50;

    var series1 = chart.series.push(new am4charts.ColumnSeries());
    series1.columns.template.width = am4core.percent(80);
    series1.columns.template.tooltipText =
    "{name}: {valueY.formatNumber('#,###')}";
    series1.name = "Active Cases";
    series1.dataFields.categoryX = "category";
    series1.dataFields.valueY = "value1";
    series1.dataFields.valueYShow = "total";
    series1.dataItems.template.locations.categoryX = 0.5;
    series1.stacked = true;
    series1.tooltip.pointerOrientation = "vertical";

    var bullet1 = series1.bullets.push(new am4charts.LabelBullet());
    bullet1.interactionsEnabled = false;
    bullet1.label.text = "{valueY.formatNumber('#,###')}";
    bullet1.label.fill = am4core.color("#ffffff");
    bullet1.locationY = 0.5;

    var series2 = chart.series.push(new am4charts.ColumnSeries());
    series2.columns.template.width = am4core.percent(80);
    series2.columns.template.tooltipText =
    "{name}: {valueY.formatNumber('#,###')}";
    series2.name = "Deaths";
    series2.dataFields.categoryX = "category";
    series2.dataFields.valueY = "value2";
    series2.dataFields.valueYShow = "total";
    series2.dataItems.template.locations.categoryX = 0.5;
    series2.stacked = true;
    series2.tooltip.pointerOrientation = "vertical";

    var bullet2 = series2.bullets.push(new am4charts.LabelBullet());
    bullet2.interactionsEnabled = false;
    bullet2.label.text = "{valueY.formatNumber('#,###')}";
    bullet2.locationY = 0.5;
    bullet2.label.fill = am4core.color("#ffffff");

    var series3 = chart.series.push(new am4charts.ColumnSeries());
    series3.columns.template.width = am4core.percent(80);
    series3.columns.template.tooltipText =
    "{name}: {valueY.formatNumber('#,###')}";
    series3.name = "Recoveries";
    series3.dataFields.categoryX = "category";
    series3.dataFields.valueY = "value3";
    series3.dataFields.valueYShow = "total";
    series3.dataItems.template.locations.categoryX = 0.5;
    series3.stacked = true;
    series3.tooltip.pointerOrientation = "vertical";

    var bullet3 = series3.bullets.push(new am4charts.LabelBullet());
    bullet3.interactionsEnabled = false;
    bullet3.label.text = "{valueY.formatNumber('#,###')}";
    bullet3.locationY = 0.5;
    bullet3.label.fill = am4core.color("#ffffff");

    chart.scrollbarX = new am4core.Scrollbar();
};

export let renderMortalityRates = (mortalityRates) => {
    var chart = am4core.create("mortalitydiv", am4charts.XYChart);

    var valueAxisX = chart.xAxes.push(new am4charts.ValueAxis());
    valueAxisX.renderer.ticks.template.disabled = true;
    valueAxisX.renderer.axisFills.template.disabled = true;

    var valueAxisY = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxisY.renderer.ticks.template.disabled = true;
    valueAxisY.renderer.axisFills.template.disabled = true;

    var series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueX = "x";
    series.dataFields.valueY = "y";
    series.dataFields.value = "value";
    series.strokeOpacity = 0;
    series.sequencedInterpolation = true;
    series.tooltip.pointerOrientation = "vertical";

    var bullet = series.bullets.push(new am4core.Circle());
    bullet.fill = am4core.color("#ff0000");
    bullet.propertyFields.fill = "color";
    bullet.strokeOpacity = 0;
    bullet.strokeWidth = 2;
    bullet.fillOpacity = 0.5;
    bullet.stroke = am4core.color("#ffffff");
    bullet.hiddenState.properties.opacity = 0;
    bullet.tooltipText = "[bold]{title}:[/]\nTotal Cases: {value.value.formatNumber('#,###')}\nMortality Rate: {valueX.value.formatNumber('#.00')}%\nRecovery Rate: {valueY.value.formatNumber('#.00')}%";

    var outline = chart.plotContainer.createChild(am4core.Circle);
    outline.fillOpacity = 0;
    outline.strokeOpacity = 0.8;
    outline.stroke = am4core.color("#ff0000");
    outline.strokeWidth = 2;
    outline.hide(0);

    var blurFilter = new am4core.BlurFilter();
    outline.filters.push(blurFilter);

    bullet.events.on("over", function(event) {
        var target = event.target;
        outline.radius = target.pixelRadius + 2;
        outline.x = target.pixelX;
        outline.y = target.pixelY;
        outline.show();
    })

    bullet.events.on("out", function(event) {
        outline.hide();
    })

    var hoverState = bullet.states.create("hover");
    hoverState.properties.fillOpacity = 1;
    hoverState.properties.strokeOpacity = 1;

    series.heatRules.push({ target: bullet, min: 2, max: 60, property: "radius" });

    bullet.adapter.add("tooltipY", function (tooltipY, target) {
        return -target.radius;
    })

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.behavior = "zoomXY";
    chart.cursor.snapToSeries = series;

    chart.scrollbarX = new am4core.Scrollbar();
    chart.scrollbarY = new am4core.Scrollbar();

    chart.data = mortalityRates;
}
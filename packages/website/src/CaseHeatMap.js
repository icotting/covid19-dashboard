import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import {formatNumber} from "./Util";

am4core.useTheme(am4themes_animated);

export let renderMap = (home, caseMapData, maxValue, markers, zoomCountry) => {

    let chart = am4core.create("mapdiv", am4maps.MapChart);

    chart.geodata = am4geodata_worldLow;
    chart.projection = new am4maps.projections.Mercator();

    var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

    polygonSeries.heatRules.push({
        property: "fill",
        target: polygonSeries.mapPolygons.template,
        min: am4core.color("white"),
        max: am4core.color("red").brighten(1)
    });

    polygonSeries.exclude = ["AQ"];

    polygonSeries.useGeodata = true;
    polygonSeries.tooltip.background.fill = am4core.color("#ccc");

    if (!markers) {
        polygonSeries.mapPolygons.template.stroke = am4core.color("#cccccc");
        polygonSeries.mapPolygons.template.fill = am4core.color("#F4F4F4");

        polygonSeries.data = caseMapData;

        let heatLegend = chart.createChild(am4maps.HeatLegend);
        heatLegend.series = polygonSeries;
        heatLegend.align = "right";
        heatLegend.valign = "bottom";
        heatLegend.width = am4core.percent(20);
        heatLegend.marginRight = am4core.percent(4);
        heatLegend.minValue = 0;
        heatLegend.maxValue = formatNumber(maxValue);

        var minRange = heatLegend.valueAxis.axisRanges.create();
        minRange.value = heatLegend.minValue;
        minRange.label.text = heatLegend.minValue;
        var maxRange = heatLegend.valueAxis.axisRanges.create();
        maxRange.value = heatLegend.maxValue;
        maxRange.label.text = heatLegend.maxValue;

        heatLegend.valueAxis.renderer.labels.template.adapter.add("text", function(labelText) {
            return "";
        });

        var polygonTemplate = polygonSeries.mapPolygons.template;
        polygonTemplate.tooltipText = "{name}: {value}";
        polygonTemplate.nonScalingStroke = true;
        polygonTemplate.strokeWidth = 0.5;

        polygonTemplate.events.on("hit", function(ev) {
            // implement smooth page update here    
        });
    } else {
        polygonSeries.mapPolygons.template.fill = am4core.color("#AAAAAA");
        polygonSeries.calculateVisualCenter = true;

        var imageSeries = chart.series.push(new am4maps.MapImageSeries());
        imageSeries.data = caseMapData;
        imageSeries.dataFields.value = "value";

        var imageTemplate = imageSeries.mapImages.template;
        imageTemplate.nonScaling = true;
        imageTemplate.propertyFields.latitude = "latitude";
        imageTemplate.propertyFields.longitude = "longitude";

        var circle = imageTemplate.createChild(am4core.Circle);
        circle.fillOpacity = 0.7;
        circle.propertyFields.fill = "color";
        circle.tooltipText = "{id}: [bold]{value}[/]";

        circle.stroke = am4core.color("#363636");

        imageSeries.heatRules.push({
            target: circle,
            property: "fill", 
            min: am4core.color("white").brighten(1),
            max: am4core.color("red").brighten(0)
          });

        imageSeries.heatRules.push({
            target: circle,
            property: "radius",
            min: 4,
            max: 30,
            dataField: "value",
        });
    }

    if (zoomCountry) {
        chart.events.on("ready", function(ev) {
            chart.zoomToMapObject(polygonSeries.getPolygonById(zoomCountry));
        });
    }

    return chart;
}

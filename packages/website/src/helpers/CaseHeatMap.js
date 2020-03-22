import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import {formatNumber, dashboardColors} from "./Util";

am4core.useTheme(am4themes_animated);

var chart = null; 
var polygonSeries = null;
var legend = null;
var legendMin = null;
var legendMax = null;
var markerSeries = null;
var currentCountry = null;

export let renderMap = (home, caseMapData, maxValue, markers, zoomCountry) => {
    if (!chart) {
        chart = am4core.create("mapdiv", am4maps.MapChart);
        chart.geodata = am4geodata_worldLow;
        chart.projection = new am4maps.projections.Mercator();

        polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

        polygonSeries.heatRules.push({
            property: "fill",
            target: polygonSeries.mapPolygons.template,
            min: am4core.color("white"),
            max: am4core.color(dashboardColors.activeCases).brighten(1)
        });
    
        polygonSeries.exclude = ["AQ"];
    
        polygonSeries.useGeodata = true;
        polygonSeries.tooltip.background.fill = am4core.color("#ccc");

        polygonSeries.mapPolygons.template.stroke = am4core.color("#cccccc");
        polygonSeries.mapPolygons.template.fill = am4core.color("#F4F4F4");

        legend = chart.createChild(am4maps.HeatLegend);
        legend.series = polygonSeries;
        legend.align = "right";
        legend.valign = "bottom";
        legend.width = am4core.percent(20);

        legendMin = legend.valueAxis.axisRanges.create();
        legendMax = legend.valueAxis.axisRanges.create();

        legend.valueAxis.renderer.labels.template.adapter.add("text", function(labelText) {
            return "";
        });

        var polygonTemplate = polygonSeries.mapPolygons.template;
        polygonTemplate.tooltipText = "{name}: {value}";
        polygonTemplate.nonScalingStroke = true;
        polygonTemplate.strokeWidth = 0.5;

        polygonTemplate.events.on("hit", function(ev) {
            // implement smooth page update here    
        });

        polygonSeries.events.on("dataitemsvalidated", function(ev) {
            if (currentCountry) {
                chart.zoomToMapObject(polygonSeries.getPolygonById(currentCountry));
            } else {
                chart.goHome();
            }
        });
    }

    legend.marginRight = am4core.percent(4);
    legend.minValue = 0;
    legend.maxValue = formatNumber(maxValue);

    legendMin.value = legend.minValue;
    legendMin.label.text = legend.minValue;

    legendMax.value = legend.maxValue;
    legendMax.label.text = legend.maxValue;


    if (markerSeries) {
        chart.series.removeIndex(
            chart.series.indexOf(markerSeries)
        );
        markerSeries = null;
    }

    if (!markers) {
        polygonSeries.data = caseMapData;
    } else {        
        polygonSeries.data = [{id: zoomCountry, value: 0, madeFromGeoData: true}];

        markerSeries = chart.series.push(new am4maps.MapImageSeries());
        markerSeries.data = caseMapData;
        markerSeries.dataFields.value = "value";

        var imageTemplate = markerSeries.mapImages.template;
        imageTemplate.nonScaling = true;
        imageTemplate.propertyFields.latitude = "latitude";
        imageTemplate.propertyFields.longitude = "longitude";

        var circle = imageTemplate.createChild(am4core.Circle);
        circle.fillOpacity = 0.7;
        circle.propertyFields.fill = "color";
        circle.tooltipText = "{id}: [bold]{value}[/]";

        circle.stroke = am4core.color("#363636");

        markerSeries.heatRules.push({
            target: circle,
            property: "fill", 
            min: am4core.color("white").brighten(1),
            max: am4core.color(dashboardColors.activeCases).brighten(0)
          });

          markerSeries.heatRules.push({
            target: circle,
            property: "radius",
            min: 4,
            max: 30,
            dataField: "value",
        });
    }

    currentCountry = zoomCountry ? zoomCountry : null;
};

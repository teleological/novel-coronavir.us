import React from "react";
import { geoCentroid } from "d3-geo";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Annotation,
    Graticule
} from "react-simple-maps";

import allStates from "./data/allStates.json";
// https://covidtracking.com/api/v1/states/daily.json
import covidStates from "./data/daily-covidtracking.json";
// https://opendata.ecdc.europa.eu/covid19/casedistribution/json/
import covidCountries from "./data/daily-eucovid.json";

const usGeoUrl =
    "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const euGeoUrl =
    "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

const offsets = {
    VT: [-60, -30],
    NH: [-30, -30],
    MA: [40, -20],
    RI: [30, 0],
    CT: [20, 20],
    NJ: [20, 10],
    DE: [20, 10],
    MD: [40, 35],
    DC: [40, 60]
};

// keyed by geo.properties.ISO_A2
const countryConfig = {
    FR: { recenter: [8,5] },
    GB: { id: "UK" },
    GR: { id: "EL", label: "GR" },
    RU: { recenter: [-50,-7] }
};

const UsMapChart = () => {
    return (
        <ComposableMap projection="geoAlbersUsa" width={900}>
            <Geographies geography={usGeoUrl}>
                {({ geographies }) => (
                    <>
                    {geographies.map(geo => {
                        const centroid = geoCentroid(geo);
                        const cur = allStates.find(s => s.val === geo.id);
                        const covid = covidStates.find(s => s.state === cur.id);

                        const popMill = cur.pop / 1000000;
                        const deathPerMill = covid.death / popMill;
                        //const increasePerMill = covid.deathIncrease / popMill;

                        //const urbanPop = cur.pop * (cur.urban / 100);
                        //const urbanMill = urbanPop / 1000000;
                        //const deathPerUrbanMill = covid.death / urbanMill;
                        //const increasePerUrbanMill = covid.deathIncrease / urbanMill;

                        var growthFactor = (covid.deathIncrease / covid.death) * 100;
                        if (isNaN(growthFactor)) {
                            growthFactor = 0;
                        }

                        var fill = "#9998A3";
                        if (deathPerMill >= 200) {
                            fill = "#CC0808";
                        } else if (deathPerMill >= 100) {
                            fill = "#CC6666";
                        } else if (deathPerMill >= 50) {
                            fill = "#CC8888";
                        } else if (deathPerMill >= 25) {
                            fill = "#CCAAAA";
                        }

                        return (
                            <>
                            <Geography
                                key={geo.rsmKey}
                                stroke="#FFF"
                                geography={geo}
                                fill={fill}
                            />
                            <g key={geo.rsmKey + "-name"}>
                                {cur && covid &&
                                    centroid[0] > -160 &&
                                    centroid[0] < -67 &&
                                    (Object.keys(offsets).indexOf(cur.id) === -1 ? (
                                    <Marker coordinates={centroid}>
                                        <text y="2" fontSize={14} textAnchor="middle">
                                            {cur.id}
                                        </text>
                                        <text y="14" fontSize={9} textAnchor="middle">
                                            {deathPerMill.toFixed(1)}
                                        </text>
                                            <text y="26" fontSize={9} textAnchor="middle">
                                        {growthFactor.toFixed(0)}%
                                        </text>
                                    </Marker>
                                ) : (
                                    <Annotation
                                        subject={centroid}
                                        dx={offsets[cur.id][0]}
                                        dy={offsets[cur.id][1]}
                                    >
                                        <text x={4} fontSize={14} alignmentBaseline="middle">
                                            {cur.id}
                                        </text>
                                        <text x="32" y="-4" fontSize={9} textAnchor="middle">
                                            {deathPerMill.toFixed(1)}
                                        </text>
                                        <text x="32" y="8" fontSize={9} textAnchor="middle">
                                            {growthFactor.toFixed(0)}%
                                        </text>
                                    </Annotation>
                                ))}
                            </g>
                            </>
                        );
                    })}
                    </>
                )}
            </Geographies>
        </ComposableMap>
    );
};

const EuMapChart = () => {
    return (
        <ComposableMap
            projection="geoAzimuthalEqualArea"
            projectionConfig={{ rotate: [-20.0, -52.0, 0], scale: 700 }} >
            <Graticule stroke="#EAEAEC" />
            <Geographies geography={euGeoUrl}>
                {({ geographies }) => (
                    <>
                    {geographies.map(geo => {
                        const centroid = geoCentroid(geo);
                        //console.log(geo.properties.NAME, geo.properties.ISO_A2);
                        //console.log(centroid);

                        const iso = geo.properties.ISO_A2;
                        const key = (iso === "-99") ? geo.properties.ABBREV : iso;

                        const config = countryConfig[key] || {};
                        if (!config.id) {
                            config.id = key;
                        }

                        if (config.recenter) {
                            centroid[0] += config.recenter[0];
                            centroid[1] += config.recenter[1];
                        }

                        const cur = covidCountries.records.
                        filter(c => c.geoId === config.id).
                            reduce(function (acc, c) {
                                if (! acc.popData2018) {
                                    acc.popData2018 = parseInt(c.popData2018);
                                    acc.deathIncrease = parseInt(c.deaths);
                                }
                                acc.deaths += parseInt(c.deaths);
                                return acc;
                            }, { id: config.id, deaths: 0});

                            const popMill = cur.popData2018 / 1000000;
                            const deathPerMill = cur.deaths / popMill;
                            if (!cur.popData2018) {
                                console.log(geo.properties);
                                config.hide = true;
                            }

                            var growthFactor = (cur.deathIncrease / cur.deaths) * 100;
                            if (isNaN(growthFactor)) {
                                growthFactor = 0;
                            }

                            var fill = "#9998A3";
                            if (deathPerMill >= 200) {
                                fill = "#CC0808";
                            } else if (deathPerMill >= 100) {
                                fill = "#CC6666";
                            } else if (deathPerMill >= 50) {
                                fill = "#CC8888";
                            } else if (deathPerMill >= 25) {
                                fill = "#CCAAAA";
                            }

                            return config.hide ? "" : (
                                <>
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={fill}
                                    stroke="#EAEAEC"
                                />
                                <g key={geo.rsmKey + "-name"}>
                                    <Marker coordinates={centroid}>
                                        <text y="2" fontSize={11} textAnchor="middle">
                                            {config.label || config.id}
                                        </text>
                                        <text y="14" fontSize={9} textAnchor="middle">
                                            {deathPerMill.toFixed(1)}
                                        </text>
                                        <text y="26" fontSize={9} textAnchor="middle">
                                            {growthFactor.toFixed(0)}%
                                        </text>
                                    </Marker>
                                </g>
                                </>
                            );
                        })}
                        </>
                  )}
              </Geographies>
         </ComposableMap>
    );
};

//export default UsMapChart;
export { UsMapChart, EuMapChart };

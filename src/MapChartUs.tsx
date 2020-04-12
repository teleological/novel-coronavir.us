import React from "react";
import { geoCentroid } from "d3-geo";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Annotation,
    Point
} from "react-simple-maps";

import { IndexedStateData, CovidDaily, findDatum } from "./CovidTracking";

// mapping of fips-postal abbrev, pop, etc.
import STATES from "./data/allStates.json";

// https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json
import SHAPES from "./data/us-atlas-3-states-10m.json";

interface StateConfig {
    id: string;  // abbrev
    val: string; // fips
    pop: number;
    urban: number;
    offset?: number[]; // can't be read from json as a Point tuple
}

type IndexedStateConfigs = { [fips: string] : StateConfig };

interface UsMapChartProps {
    shapes: any;
    width: number;
    projection: string;
    stateConfigs: IndexedStateConfigs;
    stateData: IndexedStateData;
    date: Date;
}

class UsMapChart extends React.Component<UsMapChartProps> {

    static defaultProps:Partial<UsMapChartProps> = {
        shapes: SHAPES,
        width: 900,
        projection: "geoAlbersUsa",
        stateConfigs: buildIndexedStateConfigs(STATES)
    };

    render() {
        return (
            <ComposableMap
                projection={this.props.projection}
                width={this.props.width}>
                <Geographies geography={this.props.shapes}>
                    {({ geographies }) => (
                        <>
                        {
                            geographies.map(geo => {
                                let fips = geo.id;
                                let config = this.props.stateConfigs[fips];
                                let data = this.props.stateData[fips];
                                let datum = findDatum(data, this.props.date);
                                return config ? (
                                    <StateShape
                                        key={geo.rsmKey + "-shape"}
                                        geo={geo}
                                        config={config}
                                        datum={datum} />
                                ) : null;
                            })
                        }
                        // markup has to be rendered after Geography components
                        // or neighboring states paint over markup
                        {
                            geographies.map(geo => {
                                let fips = geo.id;
                                let config = this.props.stateConfigs[fips];
                                let data = this.props.stateData[fips];
                                let datum = findDatum(data, this.props.date);
                                return renderStateMarkup(geo, config, datum);
                            })
                        }
                        </>
                    )}
                </Geographies>
            </ComposableMap>
        );
    }
}

function buildIndexedStateConfigs(stateConfigs:StateConfig[]) {
    const stateConfigByFips:IndexedStateConfigs = {};
    stateConfigs.forEach(config => stateConfigByFips[config.val] = config);
    return stateConfigByFips;
}

interface StateDatumProps {
    config: StateConfig;
    datum?: CovidDaily;
}

class StateDatumComponent<T extends StateDatumProps> extends React.Component<T> {
    deathsPerMillion() {
        let deaths;
        if (this.props.datum && this.props.datum.death) {
            const popMill = this.props.config.pop / 1000000;
            deaths = this.props.datum.death / popMill;
        } else {
            deaths = 0;
        }
        return deaths;
    }

    growthFactor() {
        return (!this.props.datum || this.props.datum.death === 0) ?
            0 : (this.props.datum.deathIncrease! / this.props.datum.death!) * 100;
    }
}

interface StateShapeProps {
    geo: any;
    config: StateConfig;
    datum?: CovidDaily;
}

class StateShape extends StateDatumComponent<StateShapeProps> {
    render () {
        return (
            <Geography
                key={this.props.geo.rsmKey + "-shape"}
                stroke="#FFF"
                geography={this.props.geo}
                fill={calculateFill(this.deathsPerMillion())}
            />
        );
    }
}

function calculateFill(deathPerMill:number) {
    if (deathPerMill >= 800) {
        return "#C00";
    } else if (deathPerMill >= 400) {
        return "#C22";
    } else if (deathPerMill >= 200) {
        return "#C44";
    } else if (deathPerMill >= 100) {
        return "#C66";
    } else if (deathPerMill >= 50) {
        return "#C88";
    } else if (deathPerMill >= 25) {
        return "#CAA";
    } else if (deathPerMill >= 12.5) {
        return "#CBB";
    } else {
        return "#9998A3";
    }
}

function renderStateMarkup(geo:any, config:StateConfig, datum?:CovidDaily) {
    const centroid = geoCentroid(geo);
    return (centroid[0] > -160 && centroid[0] < -67) ? (
        <StateMarkup
            key={geo.rsmKey + "-markup"}
            config={config}
            centroid={centroid}
            datum={datum} />
    ) : null;
}

interface StateMarkupProps {
    config: StateConfig;
    centroid: Point;
    datum?: CovidDaily;
}

class StateMarkup extends React.Component<StateMarkupProps> {
    useAnnotation() {
        const offset = this.props.config.offset;
        return offset && ((offset[0] !== 0) || (offset[1] !== 0));
    }

    render() {
        return this.useAnnotation() ?
            (<StateAnnotation
                centroid={this.props.centroid}
                config={this.props.config}
                datum={this.props.datum} />) :
            (<StateMarker
                centroid={this.props.centroid}
                config={this.props.config}
                datum={this.props.datum} />);
    }
}

interface StateMarkerProps {
    centroid: Point;
    config: StateConfig;
    datum?: CovidDaily;
}

class StateMarker extends StateDatumComponent<StateMarkerProps> {
    render() {
        return (
            <g>
                <Marker coordinates={this.props.centroid}>
                    <text y="2" fontSize={14} textAnchor="middle">
                        {this.props.config.id}
                    </text>
                    <text y="14" fontSize={9} textAnchor="middle">
                        {this.deathsPerMillion().toFixed(0)}
                    </text>
                </Marker>
            </g>
        );
    }
}

interface StateAnnotationProps {
    centroid: Point;
    config: StateConfig;
    datum?: CovidDaily;
}

class StateAnnotation extends StateDatumComponent<StateAnnotationProps> {

    offset() {
        const offset = this.props.config.offset;
        return offset ? [offset[0], offset[1]] : [0, 0];
    }

    render() {
        return (
            <g>
                <Annotation
                    subject={this.props.centroid}
                    dx={this.offset()[0]}
                    dy={this.offset()[1]}
                    curve={0}
                    connectorProps={{}}
                >
                    <text x={4} fontSize={14} alignmentBaseline="middle">
                        {this.props.config.id}
                    </text>
                    <text x="16" y="16" fontSize={9} textAnchor="middle">
                        {this.deathsPerMillion().toFixed(0)}
                    </text>
                </Annotation>
            </g>
        );
    }
}

export default UsMapChart;

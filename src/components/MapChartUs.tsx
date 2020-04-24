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

import { IndexedStateData, CovidDaily, findDatumForDate, findDatumForDeaths, parseDate } from "../CovidTracking";

// mapping of fips-postal abbrev, pop, etc.
import STATES from "../data/allStates.json";

// https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json
import SHAPES from "../data/us-atlas-3-states-10m.json";

interface StateConfig {
    id: string;  // abbrev
    val: string; // fips
    pop: number;
    urban: number;
    offset?: number[]; // can't be read from json as a Point tuple
    partial?: number | null;
    partialStart?: Date;
    stay: number | null;
    stayStart?: Date;
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

    static defaultProps : Partial<UsMapChartProps> = {
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

                                let datum = findDatumForDate(data, this.props.date);
                                let half = (datum && datum.death) ?
                                    findDatumForDeaths(data, datum.death * 0.5) : undefined;

                                return config ? (
                                    <StateShape
                                        key={geo.rsmKey + "-shape"}
                                        geo={geo}
                                        config={config}
                                        datum={datum}
                                        half={half} />
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

                                let datum = findDatumForDate(data, this.props.date);
                                let half = (datum && datum.death) ?
                                    findDatumForDeaths(data, (datum.death * 0.5)) : undefined;

                                let orders;
                                if (config && config.stayStart! && this.props.date >= config.stayStart!) {
                                    orders = "🛑";
                                } else if (config && config.partialStart! && this.props.date >= config.partialStart!) {
                                    orders = "⚠️";
                                }
                                return SelectStateMarkup(geo, config, datum, half, orders);
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
    stateConfigs.forEach(config => {
        config.partialStart = config.partial ?
            parseDate(config.partial) : undefined;
        config.stayStart = config.stay ?
            parseDate(config.stay) : undefined;
        stateConfigByFips[config.val] = config
    });
    return stateConfigByFips;
}

interface StateDatumProps {
    config: StateConfig;
    datum?: CovidDaily;
    half?: CovidDaily;
}

function deathsPerMillion(props:StateDatumProps) {
    let deaths;
    if (props.datum && props.datum.death) {
        const popMill = props.config.pop / 1000000;
        deaths = props.datum.death / popMill;
    } else {
        deaths = 0;
    }
    return deaths;
}

function displayDeaths(props:StateDatumProps) {
    const deaths = deathsPerMillion(props);
    if (deaths > 0.5) {
        return deaths.toFixed(0);
    } else if (deaths > 0) {
        return "<1";
    } else {
        return "0";
    }
}

function doubledInDays(props:StateDatumProps) {
    if (props.datum && props.half) {
        const dt2 = parseDate(props.datum.date);
        const dt1 = parseDate(props.half.date);
        return Math.floor(
            (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) -
                 Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()))
            / (1000 * 60 * 60 * 24)
        );
    } else {
        return 0;
    }
}

interface StateShapeProps {
    geo: any;
    config: StateConfig;
    datum?: CovidDaily;
    half?: CovidDaily;
}

const StateShape : React.FC<StateShapeProps> = (props) => (
    <Geography
        key={props.geo.rsmKey + "-shape"}
        geography={props.geo}
        stroke="#FFF"
        fill={calculateFill(deathsPerMillion(props))}
    />
);

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

const SelectStateMarkup = (geo:any, config:StateConfig, datum?:CovidDaily, half?:CovidDaily, orders?:string) => {
    const centroid = geoCentroid(geo);
    return (centroid[0] > -160 && centroid[0] < -67) ? (
        <StateMarkup
            key={geo.rsmKey + "-markup"}
            config={config}
            centroid={centroid}
            datum={datum}
            half={half}
            orders={orders} />
    ) : null;
};

interface StateMarkupProps {
    config: StateConfig;
    centroid: Point;
    datum?: CovidDaily;
    half?: CovidDaily;
    orders?: string
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
                datum={this.props.datum}
                half={this.props.half}
                orders={this.props.orders} />) :
            (<StateMarker
                centroid={this.props.centroid}
                config={this.props.config}
                datum={this.props.datum}
                half={this.props.half}
                orders={this.props.orders} />);
    }
}

interface StateMarkerProps {
    centroid: Point;
    config: StateConfig;
    datum?: CovidDaily;
    half?: CovidDaily;
    orders?: string;
}

const StateMarker : React.FC<StateMarkerProps> = (props) => {
    const fontClass = labelFontClass(doubledInDays(props));
    return (
        <g>
            <Marker coordinates={props.centroid}>
                <text y="2" fontSize={12} textAnchor="middle" className={fontClass}>
                    {props.config.id} {props.orders}
                </text>
                <text y="14" fontSize={9} textAnchor="middle" className={fontClass}>
                    {displayDeaths(props)}
                </text>
            </Marker>
        </g>
    );
};

function labelFontClass(doubledDays:number) {
    if (doubledDays > 0 && doubledDays <= 7) {
        return "heavy";
    } else if (doubledDays >= 14) {
        return "light";
    } else {
        return "normal";
    }
}

interface StateAnnotationProps {
    centroid: Point;
    config: StateConfig;
    datum?: CovidDaily;
    half?: CovidDaily;
    orders?: string;
}

class StateAnnotation extends React.Component<StateAnnotationProps> {

    offset() {
        const offset = this.props.config.offset;
        return offset ? [offset[0], offset[1]] : [0, 0];
    }

    render() {
        const fontClass = labelFontClass(doubledInDays(this.props));
        return (
            <g>
                <Annotation
                    subject={this.props.centroid}
                    dx={this.offset()[0]}
                    dy={this.offset()[1]}
                    curve={0}
                    connectorProps={{}}
                >
                    <text x={4} fontSize={12} alignmentBaseline="middle" className={fontClass}>
                        {this.props.config.id} {this.props.orders}
                    </text>
                    <text x="16" y="16" fontSize={9} textAnchor="middle" className={fontClass}>
                        {displayDeaths(this.props)}
                    </text>
                </Annotation>
            </g>
        );
    }
}

export default UsMapChart;

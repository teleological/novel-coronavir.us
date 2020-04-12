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

// mapping of fips-postal abbrev, pop, etc.
import stateConfig from "./data/allStates.json";

// https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json
import statesGeo from "./data/us-atlas-3-states-10m.json";

// No CORS :(
// https://covidtracking.com/api/v1/states/daily.json
import covidDaily from "./data/daily-covidtracking.json";

interface StateConfig {
    id: string;  // abbrev
    val: string; // fips
    pop: number;
    urban: number;
    offset?: number[];
}

interface CovidDaily {
    hash: string;
    date: number;
    dateChecked: string;
    state: string;
    fips: string;

    positiveIncrease?: number | null;
    positive?: number | null;
    negativeIncrease?: number | null;
    negative?: number | null;
    posNeg?: number | null;
    pending?: number | null;

    totalTestResultsIncrease?: number | null;
    totalTestResults?: number | null;
    total?: number | null;

    hospitalizedCurrently?: number | null;
    hospitalizedCumulative?: number | null;
    hospitalizedIncrease?: number | null;
    hospitalized?: number | null;
    inIcuCurrently?: number | null;
    inIcuCumulative?: number | null;
    onVentilatorCurrently?: number | null;
    onVentilatorCumulative?: number | null;
    recovered?: number | null;

    deathIncrease?: number | null;
    death?: number | null;
}

class CovidState {
    fips: string;
    abbrev: string;
    offset: Point;
    pop: number;
    deaths: number;
    deathsIncrease: number;

    constructor(fips:string,
                abbrev:string,
                offset:Point,
                pop:number,
                deaths:number,
                deathsIncrease:number) {
        this.fips = fips;
        this.abbrev = abbrev;
        this.offset = offset;
        this.pop = pop;
        this.deaths = deaths;
        this.deathsIncrease = deathsIncrease;
    }

    useAnnotation() {
        return (this.offset[0] * this.offset[1]) !== 0;
    }

    deathsPerMillion() {
        const popMill = this.pop / 1000000;
        return this.deaths / popMill;
    }

    growthFactor() {
        return this.deaths === 0 ?
            0 : (this.deathsIncrease / this.deaths) * 100;
    }
}

function buildCovidByState(stateConfig:StateConfig[], covidDaily:CovidDaily[]) {
    const covidByState:{ [fips: string] : CovidState } = {};
    stateConfig.forEach(config => {
        // ASSUME: first value found for state is newest
        const covid:CovidDaily | undefined =
            covidDaily.find(s => s.state === config!.id);

        const offset:Point =
            config.offset ? [config.offset[0], config.offset[1]] : [0, 0];

        const state =
            new CovidState(config.val, config.id, offset, config.pop,
                           (covid ? covid.death : null) || 0,
                           (covid ? covid.deathIncrease : null) || 0)
        covidByState[state.fips] = state;
    });
    return covidByState;
}

const covidByState = buildCovidByState(stateConfig, covidDaily);

class UsMapChart extends React.Component {

    render() {
        return (
            <ComposableMap projection="geoAlbersUsa" width={900}>
                <Geographies geography={statesGeo}>
                    {({ geographies }) => (
                        <>
                        {
                            geographies.map(geo => {
                                const state = covidByState[geo.id];
                                return (
                                    <StateShape
                                        key={geo.rsmKey + "-shape"}
                                        geo={geo}
                                        state={state}/>
                                );
                            })
                        }
                        // markup has to be rendered after states
                        // (or neighboring states paint over markup)
                        {
                            geographies.map(geo => {
                                const centroid = geoCentroid(geo);
                                const state = covidByState[geo.id];
                                return (centroid[0] > -160 && centroid[0] < -67) ? (
                                    <StateMarkup
                                        key={geo.rsmKey + "-markup"}
                                        label={state.abbrev}
                                        centroid={centroid}
                                        state={state} />
                                ) : null;
                            })
                        }
                        </>
                    )}
                </Geographies>
            </ComposableMap>
        );
    }
};

interface StateShapeProps {
    geo: any;
    state: CovidState;
}

interface StateShapeState {
    deaths: number;
}

class StateShape extends React.Component<StateShapeProps, StateShapeState> {

    constructor(props:StateShapeProps) {
        super(props);
        this.state = {
            deaths: props.state ? props.state.deathsPerMillion() : 0
        };
    }

    render() {
        return (
            <Geography
                key={this.props.geo.rsmKey}
                stroke="#FFF"
                geography={this.props.geo}
                fill={calculateFill(this.state.deaths)}
            />
        );
    }

}

function calculateFill(deathPerMill:number) {
    if (deathPerMill >= 200) {
        return "#CC0808";
    } else if (deathPerMill >= 100) {
        return "#CC6666";
    } else if (deathPerMill >= 50) {
        return "#CC8888";
    } else if (deathPerMill >= 25) {
        return "#CCAAAA";
    } else if (deathPerMill >= 12.5) {
        return "#CCBBBB";
    } else {
        return "#9998A3";
    }
}

interface StateMarkupProps {
    label: string;
    centroid: Point;
    state: CovidState;
}

class StateMarkup extends React.Component<StateMarkupProps> {
    render() {
        return this.props.state.useAnnotation() ?
            (<StateAnnotation
                label={this.props.label}
                centroid={this.props.centroid}
                offset={this.props.state.offset}
                state={this.props.state} />) :
            (<StateMarker
                label={this.props.label}
                centroid={this.props.centroid}
                state={this.props.state} />);
    }
}

interface StateMarkerProps {
    label: string;
    centroid: Point;
    state: CovidState;
}

interface StateMarkerState {
    deaths: number;
    growthFactor: number;
}

class StateMarker extends React.Component<StateMarkerProps,StateMarkerState> {
    constructor(props:StateMarkerProps) {
        super(props);
        this.state = {
            deaths: props.state.deathsPerMillion(),
            growthFactor: props.state.growthFactor()
        };
    }

    render() {
        return (
            <g>
                <Marker coordinates={this.props.centroid}>
                    <text y="2" fontSize={14} textAnchor="middle">
                        {this.props.label}
                    </text>
                    <text y="14" fontSize={9} textAnchor="middle">
                        {this.state.deaths.toFixed(0)}
                    </text>
                    <text y="26" fontSize={9} textAnchor="middle">
                        {this.state.growthFactor.toFixed(1)}%
                    </text>
                </Marker>
            </g>
        );
    }
}

interface StateAnnotationProps {
    label: string;
    centroid: Point;
    offset: Point;
    state: CovidState;
}

interface StateAnnotationState {
    deaths: number;
    growthFactor: number;
}

class StateAnnotation extends React.Component<StateAnnotationProps, StateAnnotationState> {
    constructor(props:StateAnnotationProps) {
        super(props);
        this.state = {
            deaths: props.state.deathsPerMillion(),
            growthFactor: props.state.growthFactor()
        };
    }

    render() {
        return (
            <Annotation
                subject={this.props.centroid}
                dx={this.props.offset[0]}
                dy={this.props.offset[1]}
                curve={0}
                connectorProps={{}}
            >
                <text x={4} fontSize={14} alignmentBaseline="middle">
                    {this.props.label}
                </text>
                <text x="32" y="-4" fontSize={9} textAnchor="middle">
                    {this.state.deaths.toFixed(1)}
                </text>
                <text x="32" y="8" fontSize={9} textAnchor="middle">
                    {this.state.growthFactor.toFixed(0)}%
                </text>
            </Annotation>
        );
    }
}

export default UsMapChart;

import React from "react";
import { ExtendedFeature, geoCentroid } from "d3-geo";
import { ComposableMap, Geographies } from "react-simple-maps";

import { IndexedStates } from "../CovidState";
import StateShape from "./StateShape";
import StateDecoration from "./StateDecoration";

// US Atlas TopoJSON
// https://www.npmjs.com/package/us-atlas
// https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json
import SHAPES from "../data/us-atlas-3-states-10m.json";

interface SimpleFeature extends ExtendedFeature {
    rsmKey: string;
}

interface UsMapProps {
    shapes: any;
    width: number;
    height: number;
    projection: string;
    longitudeMin: number;
    longitudeMax: number;

    states: IndexedStates;
    date: Date;
}

const WIDTH_DEFAULT = 975;
const HEIGHT_DEFAULT = 600;
const PROJECTION_DEFAULT = "geoAlbersUsa";
const LONGITUDE_MIN = -160;
const LONGITUDE_MAX = -67;

class UsMap extends React.Component<UsMapProps> {

    static defaultProps : Partial<UsMapProps> = {
        shapes: SHAPES,
        width: WIDTH_DEFAULT,
        height: HEIGHT_DEFAULT,
        projection: PROJECTION_DEFAULT,
        longitudeMin: LONGITUDE_MIN, // open bounds (exclusive)
        longitudeMax: LONGITUDE_MAX
    };

    render() : JSX.Element {
        return (
            <ComposableMap
                projection={this.props.projection}
                width={this.props.width}
                height={this.props.height}>
                <Geographies geography={this.props.shapes}>
                    {({ geographies }) => (
                        <>
                        { geographies.map(geo => this.renderConfiguredShape(geo)) }
                        // markup has to be rendered after Geography components
                        // or neighboring states paint over markup
                        { geographies.map(geo => this.renderConfiguredMarkup(geo)) }
                        </>
                    )}
                </Geographies>
            </ComposableMap>
        );
    }

    renderConfiguredShape(geo:SimpleFeature) : JSX.Element | null {
        const state = this.includeGeo(geo) ?
            this.props.states[geo.id!] : undefined;
        return state ? (
            <StateShape
                key={geo.rsmKey + "-shape"}
                geo={geo}
                state={state}
                date={this.props.date} />
        ) : null;
    }

    includeGeo(geo:SimpleFeature) : boolean {
        let includeIt = false;
        const state = this.props.states[geo.id!];
        if (state) {
            const centroid = geoCentroid(geo);
            includeIt =
                (centroid[0] > this.props.longitudeMin) &&
                (centroid[0] < this.props.longitudeMax);
        }
        return includeIt;
    }

    renderConfiguredMarkup(geo:SimpleFeature) : JSX.Element | null {
        const state = this.includeGeo(geo) ?
            this.props.states[geo.id!] : undefined;
        return state ? (
            <StateDecoration
                key={geo.rsmKey + "-markup"}
                centroid={geoCentroid(geo)}
                state={state}
                date={this.props.date} />
        ) : null;
    }

}

export default UsMap;

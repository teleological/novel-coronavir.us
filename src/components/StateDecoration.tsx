import React from "react";
import { Point } from "react-simple-maps";

import CovidState from "../CovidState";

import StateAnnotation from "./StateAnnotation";
import StateMarker from "./StateMarker";

interface StateDecorationProps {
    centroid: Point;
    state: CovidState;
    date: Date;
}

const StateDecoration : React.FC<StateDecorationProps> = ({centroid, state, date}) => (
    state.annotate() ?
        (<StateAnnotation centroid={centroid} state={state} date={date} />) :
        (<StateMarker centroid={centroid} state={state} date={date} />)
);

export default StateDecoration;

import React from "react";
import { Marker, Point } from "react-simple-maps";

import CovidState from "../CovidState";
import { labelFontClass } from "../utils";

interface StateMarkerProps {
    centroid: Point;
    state: CovidState;
    date: Date;
}

const OFFSET_ID_Y = 2;
const OFFSET_STATS_Y = 14;

const FONT_SIZE_ID = 12;
const FONT_SIZE_STATS = 9;

const StateMarker : React.FC<StateMarkerProps> = ({ centroid, state, date }) => {
    const fontClass = labelFontClass(state.doubledInDays(date));
    return (
        <g>
            <Marker coordinates={centroid}>
                <text y={OFFSET_ID_Y}
                    fontSize={FONT_SIZE_ID}
                    textAnchor="middle"
                    className={fontClass}>
                    {state.label}
                    {state.ordersForDate(date)}
                </text>
                <text y={OFFSET_STATS_Y}
                    fontSize={FONT_SIZE_STATS}
                    textAnchor="middle"
                    className={fontClass}>
                    {state.displayDeaths(date)}
                </text>
            </Marker>
        </g>
    );
};

export default StateMarker;

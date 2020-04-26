import React from "react";
import { Geography } from "react-simple-maps";

import CovidState from "../CovidState";

interface StateShapeProps {
    geo: any;
    state: CovidState;
    date: Date;
}

const STROKE = "#FFF";

const StateShape : React.FC<StateShapeProps> = ({ geo, state, date }) => {

    const calculateFill = (deathPerMill:number) => {
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
    };

    const key = geo.rsmKey + "-shape";
    const fill = calculateFill(state.deathsPerMillion(date));

    return (
        <Geography key={key} geography={geo} stroke={STROKE} fill={fill} />
    );
};

export default StateShape;

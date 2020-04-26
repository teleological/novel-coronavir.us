import { Point } from "react-simple-maps";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";

import {
    CovidDaily,
    IndexedCovidDaily,
    parseCovidDate,
    formatCovidDate
} from "./CovidTracking";

// mapping of fips-postal abbrev, pop, etc.
import STATES from "./data/allStates.json";

interface StateConfig {
    id: string;  // abbrev
    val: string; // fips
    pop: number;
    urban: number;
    offset?: Point | number[];
    partial?: number | null;
    partialStart?: Date;
    stay: number | null;
    stayStart?: Date;
    lifted?: number | null;
    liftedStart?: Date;
}

class CovidState {
    label: string;
    offset?: Point;

    pop: number;

    partialStart?: Date;
    stayStart?: Date;
    liftedStart?: Date;

    days: CovidDaily[];

    static buildStates(dailyByFips:IndexedCovidDaily) : IndexedStates {
        const statesByFips:IndexedStates = {};
        STATES.forEach((config:StateConfig) => {
            const fips = config.val;
            const days = dailyByFips[fips] || [];
            statesByFips[fips] = new CovidState(config, days);
        });
        return statesByFips;
    }

    constructor(config:StateConfig, days:CovidDaily[]) {
        this.label = config.id;
        this.offset = config.offset as Point;

        this.pop = config.pop;

        this.partialStart = config.partial ?
            parseCovidDate(config.partial) : undefined;
        this.stayStart = config.stay ?
            parseCovidDate(config.stay) : undefined;
        this.liftedStart = config.lifted ?
            parseCovidDate(config.lifted) : undefined;

        this.days = days;
    }

    annotate() : boolean {
        return this.offset !== undefined;
    }

    covidForDate(date:Date) : CovidDaily | undefined {
        const covidDate = formatCovidDate(date);
        return this.days.find(day => day.date === covidDate);
    }

    covidForDeaths(deaths:number) : CovidDaily | undefined {
        return this.days.find(day => {
            return day.death ? (day.death <= deaths) : undefined;
        });
    }

    halfCovidForDate(date:Date) : CovidDaily | undefined {
        const current = this.covidForDate(date);
        return (current && current.death) ?
            this.covidForDeaths(current.death * 0.5) : undefined;
    }

    ordersForDate(date:Date) : string {
        let orders = "";
        if (this.liftedStart! && date >= this.liftedStart!) {
            orders = "🏁";
        } else if (this.stayStart! && date >= this.stayStart!) {
            orders = "🛑";
        } else if (this.partialStart! && date >= this.partialStart!) {
            orders = "⚠️";
        }
        return orders;
    }

    doubledInDays(date:Date) : number {
        const day = this.covidForDate(date);
        const half = this.halfCovidForDate(date);
        return (day && half) ?
            differenceInCalendarDays(parseCovidDate(day.date),
                                     parseCovidDate(half.date)) : 0;
    }

    displayDeaths(date:Date) : string {
        const deaths = this.deathsPerMillion(date);
        if (deaths > 0.5) {
            return deaths.toFixed(0);
        } else if (deaths > 0) {
            return "<1";
        } else {
            return "0";
        }
    }

    deathsPerMillion(date:Date) : number {
        const day = this.covidForDate(date);
        if (day && day.death) {
            const popMill = this.pop / 1000000;
            return day.death / popMill;
        } else {
            return 0;
        }
    }

}

export type IndexedStates = { [fips:string] : CovidState };

export default CovidState;

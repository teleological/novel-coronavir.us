import parse from "date-fns/parse";

export interface CovidDaily {
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

export type IndexedCovidDaily = { [fips:string] : CovidDaily[] };

const URL_COVID = "https://covidtracking.com/api/v1/states/daily.json";
const DATE_MIN = new Date(2020, 2-1, 21);

function fetchCovidTrackingDailyData() : Promise<IndexedCovidDaily> {
    const headers = { "Accept": "application/json" };
    return fetch(URL_COVID, { headers: headers }).
        then(response => {
            if (response.status === 200) {
                return response.json().then(data => indexDataByFips(data));
            } else {
                console.log("Failed to fetch data: " + response.status);
                return Promise.reject(response);
            }
        });
}

function indexDataByFips(days:CovidDaily[]) : IndexedCovidDaily {
    const daysByFips:IndexedCovidDaily = {};
    days.forEach(day => {
        daysByFips[day.fips] || (daysByFips[day.fips] = []);
        daysByFips[day.fips].push(day);
    });
    return daysByFips;
}

function formatCovidDate(date:Date) : number {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateString = date.getFullYear().toString() +
        (month > 9 ? month.toString() : "0" + month.toString()) +
        (day > 9 ? day.toString() : "0" + day.toString());
    return parseInt(dateString);
}

function parseCovidDate(date:number) : Date {
    return parse(`${date}`, "yyyyMMdd", new Date());
}

export { DATE_MIN, fetchCovidTrackingDailyData, parseCovidDate, formatCovidDate };


const URL_COVID = "https://covidtracking.com/api/v1/states/daily.json";

// no data before March 4
const DATE_MIN = new Date(2020, 2-1, 21);

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

function fetchCovidTrackingDailyData() : Promise<IndexedStateData> {
    const headers:any = { "Accept": "application/json" };
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

export type IndexedStateData = { [fips:string] : CovidDaily[] };

function indexDataByFips(data:CovidDaily[]) : IndexedStateData {
    const dataByFips:IndexedStateData = {};
    data.forEach(datum => {
        dataByFips[datum.fips] || (dataByFips[datum.fips] = []);
        dataByFips[datum.fips].push(datum);
    });
    return dataByFips;
}

function findDatumForDate(data:CovidDaily[], date:Date) : CovidDaily | undefined {
    if (data) {
        const covidDate = formatCovidDate(date);
        return data.find(datum => datum.date === covidDate);
    }
}

function formatCovidDate(date:Date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateString = date.getFullYear().toString() +
        (month > 9 ? month.toString() : "0" + month.toString()) +
        (day > 9 ? day.toString() : "0" + day.toString());
    return parseInt(dateString);
}

function findDatumForDeaths(data:CovidDaily[], deaths:number) : CovidDaily | undefined {
    if (data) {
        return data.find(datum => {
            if (datum.death) {
                return datum.death <= deaths;
            }
        });
    }
}

function parseDate(date:number) : Date {
    const dateString = date.toString();
    return new Date(parseInt(dateString.substr(0,4)),
                    parseInt(dateString.substr(4,2)) - 1,
                    parseInt(dateString.substr(6,2)));
}

export { DATE_MIN, fetchCovidTrackingDailyData, findDatumForDate, findDatumForDeaths, parseDate, formatCovidDate };

// Helper variables
const baseUrl = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";
const years = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018].map(year => `&time=${year}`).join('');
const countries = ["BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"].map(country => `&geo=${country}`).join('');
const btnGenerateAnalysis = document.querySelector(".btn_generate_analysis");
const btnGenerateBubble = document.querySelector(".btn_generate_bubble");
const btnGenerateTable = document.querySelector(".btn_generate_table");

let PIBData;
let SperantaViataData;
let PopulatieData;

// Event listener pt. apasare butoane
btnGenerateAnalysis.addEventListener("click", function() {
    document.getElementById("analysis").scrollIntoView({ behavior: "smooth" });
});
btnGenerateBubble.addEventListener("click", e => {
    document.getElementById("bubble").scrollIntoView({ behavior: "smooth" });
})
btnGenerateTable.addEventListener("click", e => {
    document.getElementById("table").scrollIntoView({ behavior: "smooth" });
})

// Apel functii preluare date la incarcarea paginii
document.addEventListener('DOMContentLoaded', function() {
    fetchDataPIB();
    fetchDataSperantaViata();
    fetchDataPopulatie();
});

// Functie pentru preluare radio selectate
function getSelectedRadioValue(name) {
    const radios = document.querySelectorAll(`input[name="${name}"]:checked`);
    return radios.length > 0 ? radios[0].value : null;
}

// Functie preluare date PIB
function fetchDataPIB() {
    const indicator = "PIB";
    const query = `sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB${years}${countries}`;

    fetch(baseUrl + query)
        .then(response => response.json())
        .then(data => {
            PIBData = processData(data, indicator);
            console.log('Date Procesate PIB:', PIBData);
        })
        .catch(error => console.error("Eroare: ", error));
}

// Functie preluare date Speranta Viata
function fetchDataSperantaViata() {
    const indicator = "SV";
    const query = `demo_mlexpec?sex=T&age=Y1${years}${countries}`;

    fetch(baseUrl + query)
        .then(response => response.json())
        .then(data => {
            SperantaViataData = processData(data, indicator);
            console.log('Date Procesate Speranta Viata:', SperantaViataData);
        })
        .catch(error => console.error("Eroare: ", error));
}

// Functie preluare date Populatie
function fetchDataPopulatie() {
    const indicator = "POP";
    const query = `demo_pjan?sex=T&age=TOTAL${years}${countries}`;

    fetch(baseUrl + query)
        .then(response => response.json())
        .then(data => {
            PopulatieData = processData(data, indicator);
            console.log('Date Procesate Populatie:', PopulatieData);
        })
        .catch(error => console.error("Eroare: ", error));
}

// Functie formatare date
function processData(responseJson, indicator) {
    const processedData = [];
    const { dimension, value } = responseJson;

    const countries = Object.keys(dimension.geo.category.index);
    const years = Object.keys(dimension.time.category.index);

    let valueIndex = 0;
    countries.forEach(country => {
        years.forEach(year => {
            const val = value[valueIndex];
            const dataEntry = {
                tara: country,
                an: year,
                indicator: indicator,
                valoare: val
            };
            processedData.push(dataEntry);
            valueIndex++;
        });
    });

    return processedData;
}

// Functie pentru filtrarea datelor
function filterDataWithoutYear(country, indicator) {
    let processedData;
    indicator === "PIB" ? processedData=PIBData : indicator === "SV" ? processedData=SperantaViataData : processedData=PopulatieData;
    return processedData.filter(item => {
        const matchCountry = country ? item.tara === country : true;
        const matchIndicator = indicator ? item.indicator === indicator : true;

        return matchCountry && matchIndicator;
    });
}

function filterDataWithoutIndicator(country, year) {
    let allData = [...PIBData, ...SperantaViataData, ...PopulatieData];
    return allData.filter(item => {
        const matchCountry = country ? item.tara === country : true;
        const matchYear = year ? item.an === year.toString() : true;

        return matchCountry && matchYear;
    });
}

function filterData(country, indicator, year) {
    let processedData;
    indicator === "PIB" ? processedData=PIBData : indicator === "SV" ? processedData=SperantaViataData : processedData=PopulatieData;
    return processedData.filter(item => {
        const matchCountry = country ? item.tara === country : true;
        const matchIndicator = indicator ? item.indicator === indicator : true;
        const matchYear = year ? item.an === year.toString() : true;

        return matchCountry && matchIndicator && matchYear;
    });
}

/* Functie pentru apasarea butonului de generare */
btnGenerateAnalysis.addEventListener("click", e => {
    const selectedIndicator = getSelectedRadioValue("indicator");
    const selectedCountry = getSelectedRadioValue("country");

    const data = filterDataWithoutYear(selectedCountry, selectedIndicator);
    drawChart(data, 600, 350);
})

function drawChart(data, svgWidth, svgHeight, country, indicator) {
    const svg = d3.select("#grafic_evolutie")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    svg.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;

    const indicatorTitle = data[0].indicator;
    const countryTitle = data[0].tara;

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.an))
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.valoare)])
        .range([innerHeight, 0]);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    g.append("g").call(yAxis);
    g.append("g").call(xAxis)
        .attr("transform", `translate(0,${innerHeight})`);

    const line = d3.line()
        .x(d => xScale(d.an))
        .y(d => yScale(d.valoare));

    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "var(--color-green-dark)")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Adaugare titlu
    svg.append("text")
        .attr("x", svgWidth / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`${indicatorTitle} pentru ${countryTitle}`);

    // Adaugare etichete pe axe
    svg.append("text")
        .attr("x", svgWidth / 2)
        .attr("y", svgHeight - margin.bottom / 4)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Anul");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", -svgHeight / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(indicatorTitle);

    // Adaugare chenar
    svg.append("rect")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("fill", "none")
        .attr("stroke", "black");
}

btnGenerateBubble.addEventListener("click", e => {
    const selectedCountry = getSelectedRadioValue("country");
    const selectedYear = getSelectedRadioValue("year");

    const data = filterDataWithoutIndicator(selectedCountry, selectedYear);
    drawBubbleChart(data);
})

function drawBubbleChart(data) {
    const canvas = document.getElementById('bubble_canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stabilește o scală pentru dimensiunile bulelor
    const maxValue = Math.max(...data.map(d => d.valoare));
    console.log(maxValue)
    const radiusScale = d3.scaleSqrt().domain([0, maxValue]).range([40, 60]);

    let xOffset = 100;

    data.forEach((item, index) => {
        const radius = radiusScale(item.valoare);
        console.log(`Radius for ${item.indicator}:`, radius);
        const x = xOffset;
        const y = canvas.height / 2;

        // Desenează bule
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#C3ACD0"
        ctx.fill();
        ctx.stroke();

        // Adaugă textul (indicatorul și valoarea)
        ctx.fillStyle = "#674188";
        ctx.font = "14px Open Sans";
        ctx.fillText(`${item.indicator}: ${item.valoare}`,  x - radius / 1.5, y + radius / 6);

        xOffset += radius * 4;
    });
}
// Helper variables
const base_url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";

const years = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018].map(year => `&time=${year}`).join('');
const countries = ["BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"].map(country => `&geo=${country}`).join('');

const btn_generate_analysis = document.querySelector(".btn_generate_analysis");
const btn_generate_bubble = document.querySelector(".btn_generate_bubble");
const btn_generate_table = document.querySelector(".btn_generate_table");
const btn_move_top = document.querySelector(".btn_move_top");
const go_to_filters = document.querySelector(".go_to_filters");
const go_to_analysis = document.querySelector(".go_to_analysis");
const go_to_chart = document.querySelector(".go_to_chart");
const go_to_table = document.querySelector(".go_to_table");
const go_to_info = document.querySelector(".go_to_info");


let PIB_data;
let speranta_viata_data;
let populatie_data;

// Preluarea datelor la incarcarea paginii
document.addEventListener('DOMContentLoaded', function() {
    fetchDataPIB();
    fetchDataSperantaViata();
    fetchDataPopulatie();
});
// Functie preluare date PIB
function fetchDataPIB() {
    const indicator = "PIB";
    const query = `sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB${years}${countries}`;

    fetch(base_url + query)
        .then(response => response.json())
        .then(data => {
            PIB_data = processData(data, indicator);
            console.log("Date Procesate PIB:", PIB_data);
        })
        .catch(error => console.error("Eroare: ", error));
}
// Functie preluare date Speranta Viata
function fetchDataSperantaViata() {
    const indicator = "SV";
    const query = `demo_mlexpec?sex=T&age=Y1${years}${countries}`;

    fetch(base_url + query)
        .then(response => response.json())
        .then(data => {
            speranta_viata_data = processData(data, indicator);
            console.log("Date Procesate Speranta Viata:", speranta_viata_data);
        })
        .catch(error => console.error("Eroare: ", error));
}
// Functie preluare date Populatie
function fetchDataPopulatie() {
    const indicator = "POP";
    const query = `demo_pjan?sex=T&age=TOTAL${years}${countries}`;

    fetch(base_url + query)
        .then(response => response.json())
        .then(data => {
            populatie_data = processData(data, indicator);
            console.log("Date Procesate Populatie:", populatie_data);
        })
        .catch(error => console.error("Eroare: ", error));
}

// Functie pentru preluare radio selectate
function getSelectedRadioValue(name) {
    const radios = document.querySelectorAll(`input[name="${name}"]:checked`);
    return radios.length > 0 ? radios[0].value : null;
}

// Functie formatare date
function processData(response_json, indicator) {
    const processed_data = [];
    const { dimension, value } = response_json;

    const countries = Object.keys(dimension.geo.category.index);
    const years = Object.keys(dimension.time.category.index);

    let value_index = 0;
    countries.forEach(country => {
        years.forEach(year => {
            const val = value[value_index];
            const data_entry = {
                tara: country,
                an: year,
                indicator: indicator,
                valoare: val
            };
            processed_data.push(data_entry);
            value_index++;
        });
    });

    return processed_data;
}

// Functii pentru filtrarea datelor
function filterDataWithoutYear(country, indicator) {
    let processed_data;
    indicator === "PIB" ? processed_data = PIB_data : indicator === "SV" ? processed_data = speranta_viata_data : processed_data = populatie_data;
    return processed_data.filter(item => {
        const match_dountry = country ? item.tara === country : true;
        const match_indicator = indicator ? item.indicator === indicator : true;

        return match_dountry && match_indicator;
    });
}

function filterDataWithoutIndicator(country, year) {
    let all_data = [...PIB_data, ...speranta_viata_data, ...populatie_data];
    return all_data.filter(item => {
        const match_country = country ? item.tara === country : true;
        const match_year = year ? item.an === year.toString() : true;

        return match_country && match_year;
    });
}

// Functie grupare date pe tara si an pentru tabel
function groupDataByCountry(data, year) {
    const grouped_data = {};

    data.forEach(item => {
        if (item.an === year) {
            if (!grouped_data[item.tara]) {
                grouped_data[item.tara] = { tara: item.tara, PIB: null, SV: null, POP: null };
            }
            grouped_data[item.tara][item.indicator] = item.valoare;
        }
    });

    return Object.values(grouped_data);
}

// Functie generare culoare celula pentru tabel
function getColorBasedOnAverage(value, average) {
    // Dacă nu există o valoare, returnează culoarea gri pentru celulele fără date
    if (value === null || value === undefined || isNaN(value)) {
        return "#EAD7BB";
    }

    // Stabilește saturația și luminozitatea
    const saturation = 80; // Saturația la 100% pentru culori pline
    const lightness = 60; // O luminozitate standard de 50%

    let percentage = (value - average) / average;
    percentage = Math.max(-1, Math.min(1, percentage)); // Limităm procentajul la intervalul [-1, 1]

    // Calculează nuanța (hue) între 0 (roșu) și 120 (verde) pe baza procentajului
    const hue = percentage < 0 ? 120 + percentage * 120 : 120 - percentage * 120;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Functie calculare medie pe indicator
function calculateAverage(data, indicator) {
    const relevant_values = data.filter(item => item.indicator === indicator && item.valoare != null).map(item => item.valoare);

    if (relevant_values.length === 0) {
        return null; // Returnează null dacă nu există valori
    }

    const sum = relevant_values.reduce((acc, value) => acc + value, 0);
    return sum / relevant_values.length;
}

// Event listeners pentru apasare butoane nav
go_to_filters.addEventListener("click", function () {
    document.getElementById("filters").scrollIntoView({ behavior: "smooth" });
})
go_to_analysis.addEventListener("click", function () {
    document.getElementById("analysis").scrollIntoView({ behavior: "smooth" });
})
go_to_chart.addEventListener("click", function () {
    document.getElementById("bubble").scrollIntoView({ behavior: "smooth" });
})
go_to_table.addEventListener("click", function () {
    document.getElementById("table").scrollIntoView({ behavior: "smooth" });
})
go_to_info.addEventListener("click", function () {
    document.getElementById("footer_info").scrollIntoView({ behavior: "smooth" });
})

// Event listeners pentru apasarea butoanelor de generate
btn_generate_analysis.addEventListener("click", e => {
    document.getElementById("analysis").scrollIntoView({ behavior: "smooth" });

    const selected_indicator = getSelectedRadioValue("indicator");
    const selected_country = getSelectedRadioValue("country");

    const data = filterDataWithoutYear(selected_country, selected_indicator);
    drawChart(data, 600, 350);
});
btn_generate_bubble.addEventListener("click", e => {
    document.getElementById("bubble").scrollIntoView({ behavior: "smooth" });

    const selected_country = getSelectedRadioValue("country");
    const selected_year = getSelectedRadioValue("year");

    const data = filterDataWithoutIndicator(selected_country, selected_year);
    drawBubbleChart(data);
})
btn_generate_table.addEventListener("click", e => {
    document.getElementById("table").scrollIntoView({ behavior: "smooth" });

    const selected_year = getSelectedRadioValue("year");

    const data = [...PIB_data, ...speranta_viata_data, ...populatie_data];
    createTable(data, selected_year);
})
btn_move_top.addEventListener("click", e => {
    document.getElementById("navbar").scrollIntoView({ behavior: "smooth" });
} )

// Functii desenare
function drawChart(data, svg_width, svg_height, country, indicator) {
    const svg = d3.select("#grafic_evolutie")
        .attr("width", svg_width)
        .attr("height", svg_height);

    const placeholder = document.getElementById("analysis_placeholder");
    placeholder.style.display = "none";

    svg.style("display", "inline-block");

    svg.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const inner_width = svg_width - margin.left - margin.right;
    const inner_height = svg_height - margin.top - margin.bottom;

    const indicator_title = data[0].indicator;
    const country_title = data[0].tara;

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => parseInt(d.an)))
        .range([0, inner_width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.valoare)])
        .range([inner_height, 0]);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    g.append("g").call(yAxis);
    g.append("g").call(xAxis)
        .attr("transform", `translate(0,${inner_height})`);

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
        .attr("x", svg_width / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .style("font-family", "Open Sans")
        .style("font-size", "16px")
        .text(`${indicator_title} pentru ${country_title}`);

    // Adaugare etichete pe axe
    svg.append("text")
        .attr("x", svg_width / 2)
        .attr("y", svg_height - margin.bottom / 4)
        .attr("text-anchor", "middle")
        .style("font-family", "Open Sans")
        .style("font-size", "12px")
        .text("Anul");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", -svg_height / 2)
        .attr("text-anchor", "middle")
        .style("font-family", "Open Sans")
        .style("font-size", "12px")
        .text(indicator_title);

    // Adaugare chenar
    svg.append("rect")
        .attr("width", svg_width)
        .attr("height", svg_height)
        .attr("fill", "none")
        .attr("stroke", "black");

    const tooltip = d3.select("#tooltip");

    // Adăugarea unor cercuri pentru fiecare dată în parte pe grafic
    g.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.an))
        .attr("cy", d => yScale(d.valoare))
        .attr("r", 5)  // raza cercului
        .attr("fill", "#674188")
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html(`An: ${d.an}<br>${d.indicator}: ${d.valoare}`);
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });
}
function drawBubbleChart(data) {
    const canvas = document.getElementById("bubble_canvas");
    canvas.style.display = "inline-block";
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const placeholder = document.getElementById("bubble_placeholder");
    placeholder.style.display = "none";

    document.querySelector(".porneste_animatia").disabled = false;

    ctx.fillStyle = "black";
    ctx.font = "20px Open Sans";
    const title_text = `Bubble chart pentru ${data[0].tara} pentru anul ${data[0].an}`;
    const text_width = ctx.measureText(title_text).width;
    const x_position = (canvas.width - text_width) / 2; // Centrează pe orizontală
    const y_position = 30; // O poziție y arbitrară care să se afle în partea de sus a canvas-ului

    // Desenează titlul
    ctx.fillText(title_text, x_position, y_position);

    // Stabilește o scală pentru dimensiunile bulelor
    const max_value = Math.max(...data.map(d => d.valoare));
    const radius_scale = d3.scaleSqrt().domain([0, max_value]).range([40, 60]);

    let x_offset = 100;

    data.forEach((item, index) => {
        const radius = radius_scale(item.valoare);
        const x = x_offset;
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

        x_offset += radius * 4;
    });

    const border_padding = 20; // Spațiu suplimentar în jurul bulelor
    const border_left = 50 - border_padding; // X-ul de start al chenarului
    const border_top = 0; // Y-ul de start al chenarului
    const border_right = Math.min(x_offset, canvas.width - border_padding);
    const border_bottom = canvas.height; // Y-ul de sfârșit al chenarului

    // Desenează chenarul
    ctx.beginPath();
    ctx.rect(border_left, border_top, border_right - border_left, border_bottom);
    ctx.strokeStyle = "black"; // Culoarea chenarului
    ctx.stroke();
}
function createTable(data, year) {
    const table_container = document.querySelector(".container_table");
    if (table_container.firstChild) {
        table_container.removeChild(table_container.firstChild);
    }

    table_container.style.height = "auto";
    table_container.style.display = "inline-block";

    document.getElementById("table_placeholder").style.display = "none";

    const table = document.createElement("table");
    table.style.borderCollapse = 'collapse';
    const thead = table.createTHead();
    const row_head = thead.insertRow();

    // Adaugă antetele coloanelor
    ["Țară", "PIB", "Speranța de Viață", "Populație"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        row_head.appendChild(th);
    });

    const grouped_data = groupDataByCountry(data, year);

    // Creăm rândurile pe baza datelor grupate
    grouped_data.forEach(item => {
        const row = table.insertRow();
        ["tara", "PIB", "SV", "POP"].forEach(indicator => {
            const cell = row.insertCell();
            const value = item[indicator];
            cell.textContent = value !== null ? value : "N/A"; // Afisam N/A daca valoarea lipseste

            cell.style.border = '1px solid black';
            cell.style.padding = '5px';

            // Aplicăm culoarea pentru celulele cu valori
            if (indicator !== "tara") {
                const average = calculateAverage(data, indicator, year);

                // Dacă nu există medie (toate valorile lipsesc), celula va fi gri
                cell.style.backgroundColor = average !== null ? getColorBasedOnAverage(value, average) : "#EAD7BB";
            }
        });
    });

    table_container.appendChild(table);
}

// Functie pentru animatie bubble
function animateBubbleChart(data, ani) {
    let indexAn = 0;

    function updateChart() {
        if (indexAn < ani.length) {
            const an = ani[indexAn];
            const selected_country = getSelectedRadioValue("country");
            const data = filterDataWithoutIndicator(selected_country, an);

            if (data.length > 0) {
                drawBubbleChart(data);
            } else {
                console.error("Nu există date valide pentru anul " + an);
            }

            indexAn++;
            if (indexAn < ani.length) {
                setTimeout(updateChart, 2000);
            } else {
                document.querySelector(".porneste_animatia").disabled = false;
            }
        }
    }

    updateChart();
}
document.querySelector(".porneste_animatia").addEventListener("click", function() {
    this.disabled = true;
    const data = [...PIB_data, ...speranta_viata_data, ...populatie_data];
    const ani = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018]
    animateBubbleChart(data, ani);
});


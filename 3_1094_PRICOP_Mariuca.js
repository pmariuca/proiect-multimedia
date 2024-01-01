// Helper variables
const base_url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";

const years = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018].map(year => `&time=${year}`).join('');
const countries = ["BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"].map(country => `&geo=${country}`).join('');

const btn_generate_analysis = document.querySelector(".btn_generate_analysis");
const btn_generate_bubble = document.querySelector(".btn_generate_bubble");
const btn_generate_table = document.querySelector(".btn_generate_table");
const btn_move_top = document.querySelector(".btn_move_top");
const btn_start_animation = document.querySelector(".start_animation");
const go_to_filters = document.querySelector(".go_to_filters");
const go_to_analysis = document.querySelector(".go_to_analysis");
const go_to_chart = document.querySelector(".go_to_chart");
const go_to_table = document.querySelector(".go_to_table");
const go_to_info = document.querySelector(".go_to_info");

let PIB_data;
let speranta_viata_data;
let populatie_data;

// Event listeners pentru apasare butoane nav
go_to_filters.addEventListener("click", function () {
    document.getElementById("filters").scrollIntoView({ behavior: "smooth" });
});
go_to_analysis.addEventListener("click", function () {
    document.getElementById("analysis").scrollIntoView({ behavior: "smooth" });
});
go_to_chart.addEventListener("click", function () {
    document.getElementById("bubble").scrollIntoView({ behavior: "smooth" });
});
go_to_table.addEventListener("click", function () {
    document.getElementById("table").scrollIntoView({ behavior: "smooth" });
});
go_to_info.addEventListener("click", function () {
    document.getElementById("footer_info").scrollIntoView({ behavior: "smooth" });
});


// Event listeners pentru apasarea butoanelor de generate si a celui de animatie
btn_generate_analysis.addEventListener("click", e => {
    document.getElementById("analysis").scrollIntoView({ behavior: "smooth" });

    const selected_indicator = getSelectedRadioValue("indicator");
    const selected_country = getSelectedRadioValue("country");

    const data = filterDataWithoutYear(selected_country, selected_indicator);
    drawChart(data, 600, 350, selected_country, selected_indicator);
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
btn_start_animation.addEventListener("click", function() {
    this.disabled = true;
    const data = [...PIB_data, ...speranta_viata_data, ...populatie_data];
    const ani = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018]
    animateBubbleChart(data, ani);
});


// Preluarea datelor la incarcarea paginii folosind DOMContentLoaded
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

// Functie formatare date din fisier JSON - primeste fisierul json si indicatorul cu care lucram
function processData(data_json, indicator) {
    const processed_data = [];
    // destructuram obiectul de date pentru a lua numarul de date si valorile
    const { dimension, value } = data_json;

    // exragem tarile si anii pentru a putea itera prin date
    const countries = Object.keys(dimension.geo.category.index);
    const years = Object.keys(dimension.time.category.index);

    let value_index = 0;
    // pentru fiecare tara - pentru fiecare an luam datele si le adaugam in array-ul final
    countries.forEach(country => {
        years.forEach(year => {
            const val = value[value_index];
            const data_entry = {
                tara: country,
                an: year,
                indicator: indicator,
                value: val
            };
            processed_data.push(data_entry);
            // incrementam indexul pentru a lua urmatoarea valoare din obiectul de values
            value_index++;
        });
    });

    return processed_data;
}

// Functii pentru filtrarea datelor
// filtram in functie de tara si indicator
function filterDataWithoutYear(country, indicator) {
    let processed_data;
    // atribuim datele pentru indicatorul corect
    indicator === "PIB" ? processed_data = PIB_data : indicator === "SV" ? processed_data = speranta_viata_data : processed_data = populatie_data;
    // filtram datele in functie de tara si indicator
    return processed_data.filter(item => {
        const match_country = country ? item.tara === country : true;
        const match_indicator = indicator ? item.indicator === indicator : true;

        // returnam numai ce este true si pentru tara si pentru indicator
        return match_country && match_indicator;
    });
}

// filtram in functie de tara si an
function filterDataWithoutIndicator(country, year) {
    // pentru ca nu avem indicator vom combina datele
    let all_data = [...PIB_data, ...speranta_viata_data, ...populatie_data];
    // filtram datele in functie de tara si an
    return all_data.filter(item => {
        const match_country = country ? item.tara === country : true;
        const match_year = year ? item.an === year.toString() : true;

        // returnam numai ce este true si pentru tara si pentru an
        return match_country && match_year;
    });
}

// Functie grupare date pe tara si an pentru tabel
function groupDataByCountry(data, year) {
    const grouped_data = {};

    // pentru toate datele primite vom itera si daca anul este corect verificam daca avem deja in map valorile pentru acea tara - daca nu le adaugam
    data.forEach(item => {
        if (item.an === year) {
            if (!grouped_data[item.tara]) {
                grouped_data[item.tara] = { tara: item.tara, PIB: null, SV: null, POP: null };
            }
            grouped_data[item.tara][item.indicator] = item.value;
        }
    });

    return Object.values(grouped_data);
}

// Functii desenare
// functia de desenare pentru graficul SVG
function drawChart(data, svg_width, svg_height, country, indicator) {
    // cream un element svg si ii setam atributele de width height viewBox si display-ul la block pentru a fi vizibil
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svg_width);
    svg.setAttribute("height", svg_height);
    svg.setAttribute("viewBox", `0 0 ${svg_width} ${svg_height}`);
    svg.style.display = "block";

    // ascundem placeholder-ul
    const placeholder = document.getElementById("analysis_placeholder");
    placeholder.style.display = "none";

    // adaugam svg-ul la container dupa ce stergem ce era initial in el
    const evolution = document.getElementById("evolution_graphic");
    evolution.style.display = "inline-block";
    evolution.setAttribute("width", svg_width);
    evolution.setAttribute("height", svg_height);
    evolution.innerHTML = '';
    evolution.appendChild(svg);

    // folosim margini pentru a crea spatii - astfel putem adauga titlul si apoi calculam dimensiunile interioare din chenar avand in vedere aceste margini
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const inner_width = svg_width - margin.left - margin.right;
    const inner_height = svg_height - margin.top - margin.bottom;

    // calculam limitele minime si maxime ce vor fi pe axe
    const xMin = Math.min(...data.map(d => parseInt(d.an)));
    const xMax = Math.max(...data.map(d => parseInt(d.an)));
    const yMax = Math.max(...data.map(d => d.value));

    // convertim valorile din date pentru a le putea folosi in impartirea pe axe
    const xScale = d => (d - xMin) / (xMax - xMin) * inner_width;
    const yScale = d => inner_height - (d / yMax) * inner_height;

    // cream un element g pentru a grupa toate elementele in svg
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${margin.left},${margin.top})`);
    svg.appendChild(g);

    // cream un element de tip line pentru axa x
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", margin.left);
    xAxis.setAttribute("y1", inner_height + margin.top);
    xAxis.setAttribute("x2", svg_width - margin.right);
    xAxis.setAttribute("y2", inner_height + margin.top);
    xAxis.setAttribute("stroke", "black");
    svg.appendChild(xAxis);

    // setam axa y pentru a fi fix la inceputul graficului
    const yAxisX = margin.left;
    // cream un element de tip line pentru axa y
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", yAxisX);
    yAxis.setAttribute("y1", margin.top);
    yAxis.setAttribute("x2", yAxisX);
    yAxis.setAttribute("y2", svg_height - margin.bottom);
    yAxis.setAttribute("stroke", "black");
    svg.appendChild(yAxis);

    // prelucram fiecare obiect si aplicam scalarea x si y pentru a le ajusta pe dimensiunile svg-ului si a obtine coordonate
    // coordonatele le concatenam cu L (=line to) pt a crea un sir continuu de coordonate - reprezinta calea liniei graficului
    let values = data.map(d => [xScale(d.an), yScale(d.value)]).join("L");
    // M (=move to) si specifica punctul de pornire a liniei
    let starting = `M${values}`;

    // cream un element de tip path care va reprezenta linia graficului
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", starting);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--color-green-dark)");
    path.setAttribute("stroke-width", 1.5);
    g.appendChild(path);

    // cream un div pentru a afisa tooltip-ul atunci cand facem hover pe o biluta
    const tooltip = document.createElement("div");
    tooltip.id = "tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    // luam fiecare element din data ce este afisat
    data.forEach(d => {
        // pentru fiecare afisam o bulinuta - creata cu elementul circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", xScale(d.an));
        circle.setAttribute("cy", yScale(d.value));
        circle.setAttribute("r", 5);
        circle.setAttribute("fill", "#674188");
        // cand facem hover e bulinuta afisam tooltip-ul
        circle.addEventListener("mouseover", function(event) {
            tooltip.style.display = "block";
            tooltip.style.left = (event.pageX + 10) + "px";
            tooltip.style.top = (event.pageY - 10) + "px";
            tooltip.innerHTML = `An: ${d.an}<br>${indicator}: ${d.value}`;
        });
        // cand scoatem hover-ul de pe bulinuta div-ul cu tooltip dispare
        circle.addEventListener("mouseout", function() {
            tooltip.style.display = "none";
        });
        g.appendChild(circle);
    });

    // cream un element de tip text pentru a stoca titlul
    const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
    title.setAttribute("x", svg_width / 2);
    title.setAttribute("y", margin.top / 2);
    title.setAttribute("text-anchor", "middle");
    title.textContent = `${indicator} pentru ${country}`;
    svg.appendChild(title);
}

// functia de desenare pentru graficul canvas raster
function drawBubbleChart(data) {
    // luam elementul de tip canvas si il facem vizibil - selectam si contextul si eliminam orice este in el
    const canvas = document.getElementById("bubble_canvas");
    canvas.style.display = "inline-block";
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ascundem placeholder-ul
    const placeholder = document.getElementById("bubble_placeholder");
    placeholder.style.display = "none";

    // facem butonul de animatie apasabil
    btn_start_animation.disabled = false;

    // adaugam titlul la canvas putin mai jos de partea de sus si centrat pe x
    ctx.fillStyle = "black";
    ctx.font = "20px Open Sans";
    const title_text = `Bubble chart pentru ${data[0].tara} pentru anul ${data[0].an}`;
    const text_width = ctx.measureText(title_text).width;
    const x_position = (canvas.width - text_width) / 2; // centram pe orizontala
    const y_position = 30;

    ctx.fillText(title_text, x_position, y_position);

    // dam un radius pentru cercuri
    const fixed_radius = 60;

    // setam distantele astfel incat bulele sa nu se suprapuna, sa fie pe mijloc pe axa y si pentru ca titlul sa nu fie peste acestea
    let x_offset = 100;
    const y_offset = canvas.height / 2;
    const text_spacing = 20;

    // iteram prin datele disponibile
    data.forEach((item, index) => {
        // setam radius si coordonatele x si y - la x vom adauga la offset si radius
        const radius = fixed_radius;
        const x = x_offset + radius;
        const y = y_offset;

        // incepem sa desenam un cerc
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#C3ACD0";
        ctx.fill();
        ctx.stroke();

        // adaugam scrisul cu datele
        ctx.fillStyle = "#674188";
        ctx.font = "14px Open Sans";
        const text = `${item.indicator}: ${item.value}`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, x - textWidth / 2, y + radius + text_spacing);

        // incrementam offset pentru ca nimic sa nu se suprapuna
        x_offset += (radius * 2) + textWidth / 2 + text_spacing;
    });

    // punem niste padding pentru a putea introduce totul intr-un chenar
    const border_padding = 20;
    const border_top = 50;
    ctx.beginPath();
    ctx.rect(border_padding, border_top, canvas.width - border_padding * 2, canvas.height - border_padding - border_top);
    ctx.strokeStyle = "black";
    ctx.stroke();
}

// Functie pentru animatie bubble
function animateBubbleChart(data, ani) {
    let indexAn = 0;

    function updateChart() {
        // daca anul este mai mic decat maximul efectuam animatia
        if (indexAn < ani.length) {
            // luam anul tara si filtram datele fara indicator
            const an = ani[indexAn];
            const selected_country = getSelectedRadioValue("country");
            const data = filterDataWithoutIndicator(selected_country, an);

            // daca avem date apelam functia de desenare bubble
            if (data.length > 0) {
                drawBubbleChart(data);
            } else {
                console.error("Nu există date valide pentru anul " + an);
            }

            // incrementam anul si dupa asteptam pentru a fi vizibile datele
            indexAn++;
            if (indexAn < ani.length) {
                setTimeout(updateChart, 2000);
            } else {
                btn_start_animation.disabled = false;
            }
        }
    }

    updateChart();
}

// functia pentru crearea tabelului
function createTable(data, year) {
    // selectam containerul de tabel
    const table_container = document.querySelector(".container_table");

    // ascundem placeholder-ul
    const placeholder = document.getElementById("table_placeholder");
    if(placeholder) {
        placeholder.style.display = "none";
    }

    // cat timp se afla elemente in tabel le stergem
    while (table_container.firstChild) {
        table_container.removeChild(table_container.firstChild);
    }

    // setam height-ul si display-ul pentru ca tabelul sa fie vizibil
    table_container.style.height = "auto";
    table_container.style.display = "inline-block";

    // cream un element de tipul tabel
    const table = document.createElement("table");
    table.style.borderCollapse = 'collapse';
    const thead = table.createTHead();
    const row_head = thead.insertRow();

    // adaugam titlurile coloanelor
    ["Țară", "PIB", "Speranța de Viață", "Populație"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        row_head.appendChild(th);
    });

    // luam datele grupate pe tari
    const grouped_data = groupDataByCountry(data, year);

    // cream randurile pe baza datelor grupate
    grouped_data.forEach(item => {
        const row = table.insertRow();
        ["tara", "PIB", "SV", "POP"].forEach(indicator => {
            const cell = row.insertCell();
            const value = item[indicator];
            cell.textContent = value !== null ? value : "N/A"; // daca o valoare lipseste afisam n/a

            cell.style.border = '1px solid black';
            cell.style.padding = '5px';

            // aplicam la fiecare celula culoarea in functie de valoare
            if (indicator !== "tara") {
                const average = calculateAverage(data, indicator, year);

                // daca toate valorile lipsesc si nu avem medie celula va fi de culoarea background-ului
                cell.style.backgroundColor = average !== null ? getColorBasedOnAverage(value, average) : "#EAD7BB";
            }
        });
    });

    // adaugam tabelul
    table_container.appendChild(table);
}

// Functie generare culoare celula pentru tabel
function getColorBasedOnAverage(value, average) {
    // daca nu exista o valoare vom returna nuanta de background pentru celulele respective
    if (value === null || value === undefined || isNaN(value)) {
        return "#EAD7BB";
    }

    // stabilim saturatia si luminozitatea
    const saturation = 80;
    const lightness = 60;

    let percentage = (value - average) / average; // calculam diferenta procentuala intre valoarea curenta si cea average
    percentage = Math.max(-1, Math.min(1, percentage)); // limitam procentajul intre -1 si 1 pentru a ramane valid

    // calculam o nuanta intre verde (120) si rosu (0) in functie de procentaj
    const hue = percentage < 0 ? 120 + percentage * 120 : 120 - percentage * 120;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Functie calculare medie pe indicator
function calculateAverage(data, indicator) {
    // filtram datele pentru a obtine doar date pentru indicatorul pe care il vrem
    const relevant_values = data.filter(item => item.indicator === indicator && item.value != null).map(item => item.value);

    if (relevant_values.length === 0) {
        return null; // returnam null daca nu exista valori
    }

    // calculam suma valorilor relevante si apoi media
    // folosim reduce pentru a lua toate elementele si a obtine apoi un singur rezultat -> acc va stoca mereu rezultatul partial
    const sum = relevant_values.reduce((acc, value) => acc + value, 0);
    return sum / relevant_values.length;
}
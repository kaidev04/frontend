const searchInput = document.getElementsByClassName('search-bar-input')[0];
const searchBar = document.getElementsByClassName('search-bar')[0];
const resultsContainer = document.getElementsByClassName('results-container')[0];
const resultsList = document.getElementsByClassName('results-list')[0];

const meterIndicator = document.getElementById('meter-indicator');
const scoreText = document.getElementById('score-text');
const sentimentLabel = document.getElementById('sentiment-label');
const placeholderText = document.getElementById('data-placeholder-text');

const loader = document.getElementsByClassName('loader')[0];

const dataContainer = document.getElementById('data-container');

var getData = true;

const socket = io('http://localhost:8080');

socket.on('connect', () => {
    console.log("You connected to server");
})

socket.on('disable-submit', () => {
    getData = false;
})

socket.on('return-data', data => {
    console.log("retreived from server");
    console.log(data);

    loader.style.display = 'none';
    dataContainer.style.display = 'block';

    let score = data['score'];
    let positive = data['positive'];
    let negative = data['negative'];
    let neutral = data['neutral'];
    let dataLength = data['length'];
    let sentiment = data['sentiment'];

    // Sentiment meter
    // Calculate score difference from bottom value to actual value
    // Convert to percent for css styling
    var distance = (score + 5)/10 * 100;
    meterIndicator.style.left = `${distance}%`;
    scoreText.innerHTML = score.toFixed(2);
    scoreText.style.display = 'inline';

    switch (sentiment) {
        case 'Positive':
            sentimentLabel.style.color = '#53fc56';
            break;
        case 'Negative':
            sentimentLabel.style.color = '#ff5c4a';
            break;
        case 'Neutral':
            sentimentLabel.style.color = '#f3ff4d';
            break;
        default:
            sentimentLabel.style.color = 'white';
    }

    sentimentLabel.innerHTML = sentiment;

    // Pie chart
    //Remove previous chart to make room for new chart
    document.getElementById("pie-chart-container").innerHTML = '<canvas id="pie-chart"></canvas>';

    const pieChart = document.getElementById('pie-chart').getContext('2d');
    const piechartObject = new Chart(pieChart, {
        type: 'pie',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                label: 'Sentiment Quantity',
                data: [positive, negative, neutral],
                backgroundColor: ['#8c67ff', '#b5a0f6', '#c1bad6'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });

    // Line chart
    const lineChartContainer = document.getElementById("line-chart-container");

    //Remove previous chart to make room for new chart
    lineChartContainer.innerHTML = '<canvas id="line-chart"></canvas>';

    const lineChart = document.getElementById('line-chart').getContext('2d');
    let lineChartGradient = lineChart.createLinearGradient(0, 0, 0, lineChartContainer.offsetHeight);
    lineChartGradient.addColorStop(0, "rgba(140, 103, 255, 1)");
    lineChartGradient.addColorStop(1, "rgba(27, 27, 31, 0.5)")

    const lineChartObject = new Chart(lineChart, {
        type: 'line',
        data: {
            labels: ['August', 'September', 'October', 'November', 'December'],
            datasets: [{
                label: 'Sentiment Progression',
                data: [2, 1.7, 2.3, 2.2, 1.8],
                backgroundColor: lineChartGradient,
                borderColor: '#eee8ff',
                borderWidth: 1.5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            radius: 5,
            hitRadius: 20,
            hoverRadius: 7,
            responsive: true,
            maintainAspectRatio: false
        }
    });
        
    getData = true;
})

let tickerSymbols = [];

// Taken from internet
// Get ticker symbol from csv file and append to array
Papa.parse('nasdaq_screener_1670971439167.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
        for(i = 0; i < results.data.length; i++) {
            tickerSymbols.push(results.data[i].Symbol);
        }
    }
})

// Taken from internet
// Matches key events with ticker symbols from array
searchInput.addEventListener('keyup', (e) => {
    let results = [];
    let input = searchInput.value;
    if(input.length) {
        results = tickerSymbols.filter((item) => {
            return item.toLowerCase().includes(input.toLowerCase());
        })
    }

    if (!results.length) {
        resultsContainer.classList.remove('show-results');
    }
    else {
        let content = results.map((item) => {
            return `<li class="result-item">${item}</li>`
        }).join('');
    
        resultsContainer.classList.add('show-results');
        resultsList.innerHTML = content;
    }

})

searchBar.addEventListener('submit', e => {
    e.preventDefault();
    let input = searchInput.value;

    if(getData && input.length > 0 && tickerSymbols.map(item => item.toLowerCase()).includes(input.toLowerCase())) {
        placeholderText.style.display = 'none';
        dataContainer.style.display = 'none';
        loader.style.display = 'block';
        socket.emit('get-data', '$' + input);
        console.log("sent to server");
    }
})
// Data generation (Simulating Taichung open data from 2022 to 2026)
function generateMockData() {
    const data = [];
    const years = [2022, 2023, 2024, 2025, 2026];
    const categories = [
        { id: "A1", name: "Fatal", baseCount: 5 },
        { id: "A2", name: "Injury", baseCount: 150 },
        { id: "A3", name: "Property Damage", baseCount: 300 }
    ];

    years.forEach(year => {
        for (let month = 1; month <= 12; month++) {
            categories.forEach(cat => {
                // Add some randomness to simulate real data
                const randomFactor = 0.7 + Math.random() * 0.6; 
                // Slight downward trend over the years for simulation realism
                const yearTrend = 1 - ((year - 2022) * 0.05); 
                
                let count = Math.floor(cat.baseCount * randomFactor * yearTrend);
                
                // Stop generating future data past Sep 2026
                if (year === 2026 && month > 9) return;
                
                data.push({
                    year,
                    month,
                    category: cat.id,
                    count
                });
            });
        }
    });
    return data;
}

const accidentData = generateMockData();

// Chart instances
let trendChartInstance = null;
let categoryChartInstance = null;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();

    // Event listeners for filters
    document.getElementById("yearFilter").addEventListener("change", updateDashboard);
    document.getElementById("categoryFilter").addEventListener("change", updateDashboard);
});

function updateDashboard() {
    const yearFilter = document.getElementById("yearFilter").value;
    const categoryFilter = document.getElementById("categoryFilter").value;

    // Filter Data
    let filteredData = accidentData.filter(d => {
        const matchYear = yearFilter === "all" || d.year.toString() === yearFilter;
        const matchCategory = categoryFilter === "all" || d.category === categoryFilter;
        return matchYear && matchCategory;
    });

    // Update KPIs
    const total = filteredData.reduce((sum, d) => sum + d.count, 0);
    const fatal = filteredData.filter(d => d.category === "A1").reduce((sum, d) => sum + d.count, 0);
    const injury = filteredData.filter(d => d.category === "A2").reduce((sum, d) => sum + d.count, 0);

    document.getElementById("totalAccidents").innerText = total.toLocaleString();
    document.getElementById("totalFatalities").innerText = fatal.toLocaleString();
    document.getElementById("totalInjuries").innerText = injury.toLocaleString();

    // Update Charts
    renderTrendChart(filteredData, yearFilter);
    renderCategoryChart(filteredData);
}

function renderTrendChart(data, yearFilter) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Group data by time (Year-Month or just Month if specific year is selected)
    const timeMap = new Map();
    
    data.forEach(d => {
        let label = yearFilter === "all" 
            ? `${d.year}-${String(d.month).padStart(2, '0')}` 
            : `Month ${d.month}`;
            
        timeMap.set(label, (timeMap.get(label) || 0) + d.count);
    });

    const labels = Array.from(timeMap.keys());
    // Sort labels if they are YYYY-MM
    if (yearFilter === "all") labels.sort(); 
    else labels.sort((a, b) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]));

    const values = labels.map(l => timeMap.get(l));

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Accident Count',
                data: values,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    const catMap = new Map();
    catMap.set('A1 (Fatal)', 0);
    catMap.set('A2 (Injury)', 0);
    catMap.set('A3 (Property)', 0);

    data.forEach(d => {
        let label = d.category === 'A1' ? 'A1 (Fatal)' : 
                    d.category === 'A2' ? 'A2 (Injury)' : 'A3 (Property)';
        catMap.set(label, catMap.get(label) + d.count);
    });

    const labels = Array.from(catMap.keys());
    const values = Array.from(catMap.values());

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#e74c3c', // A1 Red
                    '#f1c40f', // A2 Yellow
                    '#95a5a6'  // A3 Gray
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

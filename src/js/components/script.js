// Konfiguration
const people = ["Max", "Kevin", "David"];

// Wöchentliche Aufgaben
const weeklyTasks = [
    "Bad und Klo putzen",
    "Küche putzen",
    "Gang, Ankleide und Wohnzimmer putzen",
    "Müll runterbringen",
    "Spülmaschine ein- und ausräumen",
    "Rasen mähen (Garten)" // Alle 2 Wochen (wird später gefiltert)
];

// Monatliche Aufgaben
const monthlyTasks = [
    "Speicher rechte Hausseite reinigen"
];

// Saisonale Aufgaben
const seasonalTasks = [
    { 
        task: "Fenster im 1. Stock reinigen",
        type: "monthly",
        activeMonths: [3, 9] // März & September
    },
    { 
        task: "Fenster im Keller (rechte Hausseite) reinigen",
        type: "monthly",
        activeMonths: [3, 9] // März & September
    },
    { 
        task: "Rasen mähen (Vorplatz)",
        type: "biweekly",
        activeMonths: [3, 4, 5, 6, 7, 8] // März-August
    },
    { 
        task: "Boden kehren (Vorplatz)",
        type: "weekly",
        activeMonths: [3, 4, 5, 6, 7, 8] // März-August
    },
    { 
        task: "Schneeräumen (Vorplatz & Garagenzugang)",
        type: "weekly",
        activeMonths: [12, 1, 2] // Dezember-Februar
    },
    { 
        task: "Vorplatz bis Garage streuen", 
        type: "weekly",
        activeMonths: [12, 1, 2] // Dezember-Februar
    }
];

// Zustandsmanagement
let currentWeek = getCurrentWeek();
let currentYear = new Date().getFullYear();
let currentDate = getDateOfWeek(currentWeek, currentYear);
let currentMonth = currentDate.getMonth() + 1;
let currentDay = currentDate.getDay();

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    updateDateDisplay();
    updateAllTasks();
    setupEventListeners();
});

// Event-Handler
function setupEventListeners() {
    document.getElementById('prevWeek').addEventListener('click', () => changeWeek(-1));
    document.getElementById('nextWeek').addEventListener('click', () => changeWeek(1));
    document.getElementById('resetBtn').addEventListener('click', resetAllTasks);
}

// Hauptfunktionen
function changeWeek(offset) {
    currentWeek += offset;
    currentDate = getDateOfWeek(currentWeek, currentYear);
    currentMonth = currentDate.getMonth() + 1;
    currentDay = currentDate.getDay();
    updateDateDisplay();
    updateAllTasks();
}

function updateDateDisplay() {
    const weekStart = currentDate;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    document.getElementById('dateDisplay').textContent = 
        `KW ${currentWeek} | ${formatDate(weekStart)} - ${formatDate(weekEnd)} | ${getSeason(currentMonth)}`;
}

function updateAllTasks() {
    updateWeeklyTasks();
    updateMonthlyTasks();
    updateSeasonalTasks();
}

// Wöchentliche Aufgaben
function updateWeeklyTasks() {
    const tbody = document.getElementById('weeklyTasks');
    tbody.innerHTML = '';
    weeklyTasks.forEach((task, index) => {
        // Rasenmähen nur alle 2 Wochen anzeigen
        if (task.includes("Rasen mähen") && currentWeek % 2 !== 0) return;
        const personIndex = (currentWeek + index) % people.length;
        createTaskRow(
            tbody,
            task,
            people[personIndex],
            `weekly_${currentWeek}_${index}`,
            index
        );
    });
}

// Monatliche Aufgaben
function updateMonthlyTasks() {
    const tbody = document.getElementById('monthlyTasks');
    tbody.innerHTML = '';
    monthlyTasks.forEach((task, index) => {
        const personIndex = currentMonth % people.length;
        createTaskRow(
            tbody,
            task,
            people[personIndex],
            `monthly_${currentMonth}_${index}`,
            index
        );
    });
}

// Saisonale Aufgaben
function updateSeasonalTasks() {
    const tbody = document.getElementById('seasonalTasks');
    tbody.innerHTML = '';
    
    seasonalTasks.forEach((item, index) => {
        // Nur anzeigen wenn aktueller Monat in activeMonths ist
        if (!item.activeMonths.includes(currentMonth)) return;
        
        // Für 2-wöchige Aufgaben: Nur jede 2. Woche anzeigen
        if (item.type === "biweekly" && currentWeek % 2 !== 0) return;
        
        // Zuständige Person wöchentlich rotieren lassen
        const personIndex = currentWeek % people.length;
        
        createTaskRow(
            tbody,
            item.task,
            people[personIndex],
            `seasonal_${item.type}_${index}`,
            index
        );
        tbody.lastChild.classList.add('seasonal-task');
    });
}

// Hilfsfunktionen
function createTaskRow(tbody, task, person, storageKey, index) {
    // Firebase Referenz für diese Aufgabe
    const tasksRef = firebase.database().ref('tasks/' + storageKey);
    const taskId = `task_${index}`;
    const row = document.createElement('tr');
    
    // Checkbox
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    
    // Lade den aktuellen Status aus Firebase
    tasksRef.child(taskId).once('value', (snapshot) => {
        const isCompleted = snapshot.val() || false;
        checkbox.checked = isCompleted;
        if (isCompleted) row.classList.add('completed');
    });
    
    // Höre auf Änderungen in Firebase
    tasksRef.child(taskId).on('value', (snapshot) => {
        const isCompleted = snapshot.val() || false;
        checkbox.checked = isCompleted;
        row.classList.toggle('completed', isCompleted);
    });
    
    // Checkbox Event-Handler
    checkbox.onchange = () => {
        tasksRef.child(taskId).set(checkbox.checked);
    };
    
    checkboxCell.appendChild(checkbox);
    
    // Aufgabe
    const taskCell = document.createElement('td');
    taskCell.textContent = task;
    
    // Zuständig
    const personCell = document.createElement('td');
    personCell.textContent = person;
    
    row.append(checkboxCell, taskCell, personCell);
    tbody.appendChild(row);
    return row;
}

function resetAllTasks() {
    if (confirm('Alle Aufgaben zurücksetzen?')) {
        localStorage.clear();
        updateAllTasks();
    }
}

function getSeason(month) {
    if (month >= 3 && month <= 5) return "Frühling";
    if (month >= 6 && month <= 8) return "Sommer";
    if (month >= 9 && month <= 11) return "Herbst";
    return "Winter";
}

function getCurrentWeek() {
    const date = new Date();
    date.setHours(0,0,0,0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getDateOfWeek(week, year) {
    const date = new Date(year, 0, 1 + (week - 1) * 7);
    const day = date.getDay();
    return new Date(date.setDate(date.getDate() - day + 1));
}

function formatDate(date) {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

// Debug-Hilfsfunktionen
function getMonthName(month) {
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                   'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return months[month - 1] || month;
}

function getDayName(day) {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[day] || day;
}

// Whiteboard Functionality mit Firebase Integration
document.addEventListener('DOMContentLoaded', () => {
    const whiteboard = document.getElementById('whiteboard');
    const newItemText = document.getElementById('newItemText');
    const itemCategory = document.getElementById('itemCategory');
    const addItemBtn = document.getElementById('addItemBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    // Firebase Referenz
    console.log('Firebase initialisieren...');
    const notesRef = firebase.database().ref('whiteboardNotes');
    console.log('Firebase Referenz erstellt:', notesRef);
    
    // Lade gespeicherte Notizen
    loadNotes();
    
    // Event-Listener für Hinzufügen-Button
    addItemBtn.addEventListener('click', addNewNote);
    
    // Event-Listener für Enter-Taste im Textfeld
    newItemText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewNote();
        }
    });
    
    // Event-Listener für Alle-Löschen-Button
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Wirklich alle Notizen löschen?')) {
            notesRef.remove();
            whiteboard.innerHTML = '';
        }
    });
    
    // Firebase Listener für Änderungen
    notesRef.on('child_added', (snapshot) => {
        const noteData = snapshot.val();
        noteData.id = snapshot.key;
        // Nur erstellen, wenn das Element noch nicht existiert
        if (!document.getElementById(noteData.id)) {
            createNoteElement(noteData);
        }
    });
    
    notesRef.on('child_removed', (snapshot) => {
        const noteId = snapshot.key;
        const noteElement = document.getElementById(noteId);
        if (noteElement) {
            noteElement.remove();
        }
    });
    
    notesRef.on('child_changed', (snapshot) => {
        const noteData = snapshot.val();
        noteData.id = snapshot.key;
        const noteElement = document.getElementById(noteData.id);
        
        if (noteElement && noteData.position) {
            noteElement.style.transform = `translate(${noteData.position.x}px, ${noteData.position.y}px)`;
        }
    });
    
    // Funktion zum Hinzufügen einer neuen Notiz
    function addNewNote() {
        console.log('addNewNote aufgerufen');
        const text = newItemText.value.trim();
        if (text === '') {
            console.log('Text ist leer, keine Notiz hinzugefügt');
            return;
        }
        
        const category = itemCategory.value;
        const date = new Date();
        console.log('Neue Notiz:', text, category);
        
        const noteData = {
            text: text,
            category: category,
            date: date.toISOString(),
            position: { x: 0, y: 0 },
            createdBy: getUserIdentifier()
        };
        
        console.log('Notiz-Daten:', noteData);
        
        try {
            // In Firebase speichern
            console.log('Versuche in Firebase zu speichern...');
            const newNoteRef = notesRef.push();
            newNoteRef.set(noteData)
                .then(() => {
                    console.log('Notiz erfolgreich gespeichert:', newNoteRef.key);
                })
                .catch(error => {
                    console.error('Fehler beim Speichern der Notiz:', error);
                    alert('Fehler beim Speichern: ' + error.message);
                });
        } catch (error) {
            console.error('Fehler beim Erstellen der Notiz:', error);
            alert('Fehler: ' + error.message);
        }
        
        // Eingabefeld zurücksetzen
        newItemText.value = '';
        newItemText.focus();
    }
    
    // Funktion zum Erstellen eines Notiz-Elements
    function createNoteElement(noteData) {
        const note = document.createElement('div');
        note.className = `sticky-note ${noteData.category}`;
        note.id = noteData.id;
        note.dataset.category = noteData.category;
        
        // Position setzen, falls vorhanden
        if (noteData.position && (noteData.position.x !== 0 || noteData.position.y !== 0)) {
            note.style.transform = `translate(${noteData.position.x}px, ${noteData.position.y}px)`;
        }
        
        // Formatiere das Datum
        const noteDate = new Date(noteData.date);
        const formattedDate = noteDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        
        // Notiz-Inhalt
        note.innerHTML = `
            <div class="note-content">${noteData.text}</div>
            <div class="note-footer">
                <span class="note-category">${getCategoryName(noteData.category)}</span>
                <span class="note-date">${formattedDate}</span>
            </div>
            <div class="delete-note" title="Löschen">✕</div>
        `;
        
        // Lösch-Button Event-Listener
        const deleteBtn = note.querySelector('.delete-note');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(noteData.id);
        });
        
        // Drag & Drop Funktionalität
        makeDraggable(note);
        
        // Füge die Notiz zum Whiteboard hinzu
        whiteboard.appendChild(note);
        
        return note;
    }
    
    // Funktion zum Laden aller Notizen
    function loadNotes() {
        whiteboard.innerHTML = '';
        // Notizen werden automatisch durch den Firebase-Listener geladen
    }
    
    // Funktion zum Löschen einer Notiz
    function deleteNote(noteId) {
        notesRef.child(noteId).remove();
    }
    
    // Funktion zum Aktualisieren der Position einer Notiz
    function updateNotePosition(noteId, position) {
        notesRef.child(noteId).update({ position: position });
    }
    
    // Generiere eine eindeutige Benutzer-ID für dieses Gerät
    function getUserIdentifier() {
        let userId = localStorage.getItem('wg_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('wg_user_id', userId);
        }
        return userId;
    }
    
    // Funktion zum Umwandeln der Kategorie-ID in einen lesbaren Namen
    function getCategoryName(category) {
        const categories = {
            'einkauf': 'Einkauf',
            'haushalt': 'Haushalt',
            'idee': 'Idee',
            'sonstiges': 'Sonstiges'
        };
        
        return categories[category] || category;
    }
    
    // Funktion zum Hinzufügen von Drag & Drop Funktionalität
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        element.addEventListener('mousedown', dragMouseDown);
        
        function dragMouseDown(e) {
            e.preventDefault();
            // Bringe die Notiz in den Vordergrund
            element.style.zIndex = 1000;
            
            // Hole die Mausposition beim Start
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Füge die Event-Listener für Bewegung und Loslassen hinzu
            document.addEventListener('mousemove', elementDrag);
            document.addEventListener('mouseup', closeDragElement);
        }
        
        function elementDrag(e) {
            e.preventDefault();
            
            // Berechne die neue Position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Setze die neue Position
            element.style.transform = `translate(${element.offsetLeft - pos1}px, ${element.offsetTop - pos2}px)`;
        }
        
        function closeDragElement() {
            // Entferne die Event-Listener
            document.removeEventListener('mousemove', elementDrag);
            document.removeEventListener('mouseup', closeDragElement);
            
            // Setze den z-index zurück
            element.style.zIndex = '';
            
            // Speichere die neue Position
            const position = {
                x: element.offsetLeft,
                y: element.offsetTop
            };
            
            updateNotePosition(element.id, position);
        }
    }
});

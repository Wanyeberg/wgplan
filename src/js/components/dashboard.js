// Dashboard Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialisierung des Dashboards
    console.log('Dashboard geladen');
    
    // Event-Listener für Widgets
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach(widget => {
        if (!widget.classList.contains('widget-placeholder')) {
            widget.addEventListener('click', (e) => {
                const link = widget.getAttribute('data-link');
                if (link) {
                    window.location.href = link;
                }
            });
        }
    });
    
    // Platzhalter für zukünftige Dashboard-Funktionalität
});

// Select sidebar and toggle button
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-btn');

// Open/Close sidebar on toggle button click
toggleBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    sidebar.classList.toggle('open');
    toggleBtn.textContent = isOpen ? '☰' : '✖';
});

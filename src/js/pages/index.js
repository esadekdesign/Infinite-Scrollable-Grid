import '../../index.css';
import { InfiniteGrid } from '../components/infinite-grid.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('grid-container');
    const grid = new InfiniteGrid(container);

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.classList.add('loading');
            await grid.refresh();
            refreshBtn.classList.remove('loading');
        });
    }

    // Prevent default drag behavior on images
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') e.preventDefault();
    });
});

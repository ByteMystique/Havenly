// Loading State Manager

class LoadingManager {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        // Create loading overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay hidden';
        this.overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading...</div>
        `;
        document.body.appendChild(this.overlay);
    }

    show(text = 'Loading...') {
        if (this.overlay) {
            this.overlay.querySelector('.loading-text').textContent = text;
            this.overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Simulate loading for demo purposes
    simulate(duration = 1000, text = 'Loading...') {
        return new Promise((resolve) => {
            this.show(text);
            setTimeout(() => {
                this.hide();
                resolve();
            }, duration);
        });
    }
}

// Create global instance
const loader = new LoadingManager();

// Progress bar for page loads
class ProgressBar {
    constructor() {
        this.bar = null;
        this.init();
    }

    init() {
        this.bar = document.createElement('div');
        this.bar.className = 'progress-bar';
        document.body.appendChild(this.bar);
    }

    start() {
        if (this.bar) {
            this.bar.style.width = '0%';
            this.bar.style.display = 'block';
            this.animate();
        }
    }

    animate() {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
            } else {
                width += Math.random() * 10;
                this.bar.style.width = Math.min(width, 90) + '%';
            }
        }, 200);
    }

    complete() {
        if (this.bar) {
            this.bar.style.width = '100%';
            setTimeout(() => {
                this.bar.style.width = '0%';
            }, 300);
        }
    }
}

// Create global instance
const progressBar = new ProgressBar();

// Auto-start progress bar on page load
window.addEventListener('load', () => {
    progressBar.complete();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loader, progressBar };
}

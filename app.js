// ==========================================================================
// Supabase & App Configuration
// ==========================================================================
const SUPABASE_URL = 'https://lvspugkfgaxtfidzlqrc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ukYYuq9mlAVGjuoi8kQTxg_xpYHlzCu';

// Initialize Supabase Client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const cloudContainer = document.getElementById('cloud-container');
const emptyState = document.getElementById('empty-state');
const wordForm = document.getElementById('word-form');
const wordInput = document.getElementById('word-input');
const toggleCloudBtn = document.getElementById('toggle-cloud-btn');
const clearCloudBtn = document.getElementById('clear-cloud-btn');
const qrcodeCanvas = document.getElementById('qrcode-canvas');
const currentUrlSpan = document.getElementById('current-url');
const btnCopy = document.getElementById('btn-copy');

// State Variables
let isCloudVisible = true;
let wordsList = []; // Track loaded words to prevent local duplication

// Grid System for layout to avoid text collisions
// Total viewport grid cells (columns x rows)
const GRID_COLS = 10;
const GRID_ROWS = 7;
const gridOccupation = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(false));

// Define areas that we should avoid (like the bottom-right for the QR code card)
// The share-card is roughly in the bottom-right corner: cols 7-9, rows 5-6
function isRestrictedCell(row, col) {
    return row >= 5 && col >= 7;
}

// Find a random unoccupied cell on the grid
function getUnoccupiedCell() {
    const availableCells = [];
    for (let r = 1; r < GRID_ROWS - 1; r++) { // Avoid exact top/bottom boundaries
        for (let c = 1; c < GRID_COLS - 1; c++) { // Avoid exact left/right boundaries
            if (!gridOccupation[r][c] && !isRestrictedCell(r, c)) {
                availableCells.push({ r, c });
            }
        }
    }

    if (availableCells.length === 0) {
        // Grid is completely full, reset occupation grid to make space
        clearGrid();
        return getUnoccupiedCell();
    }

    // Pick a random available cell
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    const cell = availableCells[randomIndex];
    
    // Mark cell and its immediate neighbors as occupied to prevent overlap
    markCellOccupied(cell.r, cell.c);
    return cell;
}

function markCellOccupied(row, col) {
    // Occupy the chosen cell and surrounding buffer cells
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
                gridOccupation[nr][nc] = true;
            }
        }
    }
}

function clearGrid() {
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            gridOccupation[r][c] = false;
        }
    }
}

// ==========================================================================
// Word Cloud Rendering Logic
// ==========================================================================

// Add a word to the screen with beautiful animations and layout positioning
function renderWord(wordText) {
    if (!wordText) return;
    
    // Prevent duplicate rendering
    if (wordsList.includes(wordText)) return;
    wordsList.push(wordText);

    // Hide the empty state if it's visible
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    const cell = getUnoccupiedCell();
    const cellWidth = 100 / GRID_COLS;
    const cellHeight = 100 / GRID_ROWS;

    // Jitter coordinates within the selected cell to make it look organic
    const jitterX = (Math.random() - 0.5) * 5; // -2.5% to +2.5%
    const jitterY = (Math.random() - 0.5) * 5; 
    
    const posX = (cell.c * cellWidth) + (cellWidth / 2) + jitterX;
    const posY = (cell.r * cellHeight) + (cellHeight / 2) + jitterY;

    // Create the DOM element
    const wordEl = document.createElement('div');
    wordEl.className = 'word-cloud-item';
    wordEl.textContent = wordText;

    // Generate style attributes
    const size = (1.2 + Math.random() * 2.2).toFixed(2); // Font size between 1.2rem and 3.4rem
    const hue = Math.floor(Math.random() * 360); // Random vibrant HSL color
    const color = `hsla(${hue}, 85%, 65%, 0.95)`;
    const glowColor = `rgba(${hslToRgb(hue / 360, 0.85, 0.65).join(',')}, 0.3)`;

    wordEl.style.fontSize = `${size}rem`;
    wordEl.style.color = color;
    wordEl.style.left = `${posX}%`;
    wordEl.style.top = `${posY}%`;
    wordEl.style.textShadow = `0 0 15px ${glowColor}`;

    // Apply random floating animation
    const floatType = Math.floor(Math.random() * 3) + 1; // float-1, float-2, float-3
    const duration = (4 + Math.random() * 5).toFixed(1); // 4s to 9s duration
    const delay = (Math.random() * -5).toFixed(1); // Random starting delay
    wordEl.style.animation = `popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, float-${floatType} ${duration}s infinite ease-in-out ${delay}s`;

    // Click interactive pop effect
    wordEl.addEventListener('click', () => {
        wordEl.style.transform = 'scale(1.4) rotate(15deg)';
        setTimeout(() => {
            wordEl.style.transform = '';
        }, 800);
    });

    cloudContainer.appendChild(wordEl);
}

// Convert HSL to RGB for shadow color transparency mapping
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// ==========================================================================
// Database Interaction Functions (Supabase API)
// ==========================================================================

// Fetch existing words from the database
async function loadHistoricalWords() {
    try {
        const { data, error } = await _supabase
            .from('words')
            .select('word')
            .order('created_at', { ascending: false })
            .limit(60);

        if (error) throw error;

        if (data && data.length > 0) {
            // Reverse list to render oldest to newest (for popIn sequence visualization)
            const words = data.reverse();
            words.forEach(row => {
                renderWord(row.word);
            });
        }
    } catch (err) {
        console.error('Error fetching historical words:', err);
    }
}

// Insert new word to the database
async function submitWord(event) {
    event.preventDefault();
    const word = wordInput.value.trim();
    if (!word) return;

    // Disable input and button temporarily to prevent spamming
    wordInput.disabled = true;
    const submitBtn = wordForm.querySelector('.btn-submit');
    submitBtn.disabled = true;

    try {
        const { error } = await _supabase
            .from('words')
            .insert([{ word: word }]);

        if (error) throw error;
        
        // Optimistic UI: Render the word immediately on successful submit
        renderWord(word);
        
        // Success: Clear input
        wordInput.value = '';
    } catch (err) {
        console.error('Error submitting word:', err);
        alert('提交失敗，請檢查網路連線或重試！');
    } finally {
        wordInput.disabled = false;
        submitBtn.disabled = false;
        wordInput.focus();
    }
}

// Subscribe to Realtime notifications from Supabase Database
function setupRealtimeSubscription() {
    _supabase
        .channel('public:words')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'words' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newWord = payload.new.word;
                if (newWord) {
                    renderWord(newWord);
                }
            } else if (payload.eventType === 'DELETE') {
                // Synchronize clear cloud event across all clients in real-time
                wordsList = [];
                clearGrid();
                cloudContainer.querySelectorAll('.word-cloud-item').forEach(el => el.remove());
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
            }
        })
        .subscribe((status) => {
            console.log('Realtime channel subscription status:', status);
        });
}

// Clear all words from both database and local UI
async function clearCloud() {
    if (!confirm('確定要清空所有的詞彙嗎？這會刪除資料庫中的所有資料且無法復原！')) return;

    clearCloudBtn.disabled = true;
    try {
        const { error } = await _supabase
            .from('words')
            .delete()
            .neq('id', 0); // Delete all rows

        if (error) throw error;

        // Local UI Cleanup
        wordsList = [];
        clearGrid();
        cloudContainer.querySelectorAll('.word-cloud-item').forEach(el => el.remove());
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    } catch (err) {
        console.error('Error clearing words:', err);
        alert('清空失敗，請重試！');
    } finally {
        clearCloudBtn.disabled = false;
    }
}

// ==========================================================================
// UI Control Panel Interactions
// ==========================================================================

// Toggle Word Cloud visibility with fade out/in animation
function toggleCloudVisibility() {
    isCloudVisible = !isCloudVisible;
    if (isCloudVisible) {
        cloudContainer.classList.remove('hidden');
        toggleCloudBtn.querySelector('.icon').textContent = '👁️';
        toggleCloudBtn.querySelector('.text').textContent = '隱藏文字雲';
    } else {
        cloudContainer.classList.add('hidden');
        toggleCloudBtn.querySelector('.icon').textContent = '👁️‍🗨️';
        toggleCloudBtn.querySelector('.text').textContent = '顯示文字雲';
    }
}

// Dynamic Sharing QR Code and URL display
function setupSharingInfo() {
    const currentUrl = window.location.href;
    currentUrlSpan.textContent = currentUrl;

    // Generate high quality QR code
    QRCode.toCanvas(qrcodeCanvas, currentUrl, {
        width: 180,
        margin: 1,
        color: {
            dark: '#070710',
            light: '#ffffff'
        }
    }, function (error) {
        if (error) {
            console.error('QR Code generation error:', error);
        }
    });

    // Copy to clipboard event listener
    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(currentUrl)
            .then(() => {
                btnCopy.textContent = '✅';
                setTimeout(() => {
                    btnCopy.textContent = '📋';
                }, 2000);
            })
            .catch(err => {
                console.error('Copy URL failed:', err);
            });
    });
}

// ==========================================================================
// Initialization
// ==========================================================================
function init() {
    // 1. Attach Event Listeners FIRST to guarantee UI interactions work
    wordForm.addEventListener('submit', submitWord);
    toggleCloudBtn.addEventListener('click', toggleCloudVisibility);
    clearCloudBtn.addEventListener('click', clearCloud);

    // 2. Safely initialize background features
    try {
        loadHistoricalWords();
    } catch (e) { console.error("loadHistoricalWords failed", e); }

    try {
        setupRealtimeSubscription();
    } catch (e) { console.error("setupRealtimeSubscription failed", e); }

    try {
        setupSharingInfo();
    } catch (e) { console.error("setupSharingInfo failed", e); }
}

// Run initial loading
window.addEventListener('DOMContentLoaded', init);

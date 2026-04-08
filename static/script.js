/* ============================================================
   BRAINROT AI — script.js (UPGRADED v2.0)
   Cursor · Particles · Emojis · Generate · Typing · Ripple
   NEW: Translation toggle + AI Image generation display
   ============================================================ */

/* ---- CUSTOM CURSOR (unchanged) ---- */
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0;
let glowX = 0, glowY = 0;

const dot = document.createElement('div');
dot.style.cssText = `
  position:fixed; width:10px; height:10px; border-radius:50%;
  background:#f472b6; pointer-events:none; z-index:10001;
  transform:translate(-50%,-50%); box-shadow:0 0 12px #ec4899, 0 0 24px #ec4899;
  transition:transform 0.08s ease; mix-blend-mode:screen;
`;
document.body.appendChild(dot);

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = mouseX + 'px';
  dot.style.top = mouseY + 'px';
});

(function animateGlow() {
  glowX += (mouseX - glowX) * 0.08;
  glowY += (mouseY - glowY) * 0.08;
  cursorGlow.style.left = glowX + 'px';
  cursorGlow.style.top  = glowY + 'px';
  requestAnimationFrame(animateGlow);
})();

document.querySelectorAll('button, textarea, .tag, .action-btn, .translation-btn, .image-container').forEach(el => {
  el.addEventListener('mouseenter', () => { dot.style.transform = 'translate(-50%,-50%) scale(2.5)'; dot.style.opacity = '0.6'; });
  el.addEventListener('mouseleave', () => { dot.style.transform = 'translate(-50%,-50%) scale(1)'; dot.style.opacity = '1'; });
});

/* ---- CARD TILT (unchanged) ---- */
const mainCard = document.getElementById('mainCard');
let cardRect = mainCard.getBoundingClientRect();

window.addEventListener('resize', () => { cardRect = mainCard.getBoundingClientRect(); });

document.addEventListener('mousemove', e => {
  const cx = cardRect.left + cardRect.width / 2;
  const cy = cardRect.top  + cardRect.height / 2;
  const dx = (e.clientX - cx) / (cardRect.width  / 2);
  const dy = (e.clientY - cy) / (cardRect.height / 2);
  const maxTilt = 5;
  mainCard.style.transform = `perspective(1000px) rotateY(${dx * maxTilt}deg) rotateX(${-dy * maxTilt}deg)`;
});
document.addEventListener('mouseleave', () => {
  mainCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
});

/* ---- PARTICLE CANVAS (unchanged) ---- */
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const PARTICLE_COLORS = ['rgba(168,85,247,', 'rgba(236,72,153,', 'rgba(59,130,246,', 'rgba(6,182,212,'];

function createParticle() {
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.4,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.5 + 0.1,
    color,
  };
}

for (let i = 0; i < 100; i++) particles.push(createParticle());

let animFrame;
function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color + p.alpha + ')';
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;

    const dx = p.x - mouseX, dy = p.y - mouseY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 120) {
      const force = (120 - dist) / 120;
      p.x += (dx / dist) * force * 1.5;
      p.y += (dy / dist) * force * 1.5;
    }

    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
  });
  animFrame = requestAnimationFrame(drawParticles);
}
drawParticles();

/* ---- FLOATING EMOJIS (unchanged) ---- */
const EMOJIS = ['🧠','💀','🌀','✨','👾','🔮','🫠','💫','🤯','⚡','🌙','🦋','🎭','🔥','👁️','🌊','🎨','🖼️'];
const emojiContainer = document.getElementById('floatingEmojis');

function spawnEmoji() {
  const el = document.createElement('div');
  el.className = 'float-emoji';
  el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  el.style.left = Math.random() * 100 + 'vw';
  el.style.bottom = '-3rem';
  const duration = 12 + Math.random() * 16;
  el.style.animationDuration = duration + 's';
  el.style.animationDelay = '0s';
  emojiContainer.appendChild(el);
  setTimeout(() => el.remove(), duration * 1000);
}

for (let i = 0; i < 8; i++) {
  setTimeout(spawnEmoji, i * 800);
}
setInterval(spawnEmoji, 2200);

/* ---- CHAR COUNT (unchanged) ---- */
const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
inputText.addEventListener('input', () => {
  charCount.textContent = inputText.value.length;
});

/* ---- TAG INJECT (unchanged) ---- */
function injectPrompt(text) {
  inputText.value = text;
  charCount.textContent = text.length;
  inputText.focus();
  inputText.dispatchEvent(new Event('input'));
}

/* ---- RIPPLE (unchanged) ---- */
function createRipple(e) {
  const btn = document.getElementById('generateBtn');
  const container = document.getElementById('rippleContainer');
  const rect = btn.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const rip = document.createElement('span');
  rip.className = 'ripple';
  rip.style.left = x + 'px';
  rip.style.top  = y + 'px';
  rip.style.width = rip.style.height = '60px';
  rip.style.marginLeft = '-30px';
  rip.style.marginTop  = '-30px';
  container.appendChild(rip);
  setTimeout(() => rip.remove(), 700);
}
document.getElementById('generateBtn').addEventListener('click', createRipple);

/* ---- CHAOS COUNTER (unchanged) ---- */
let chaosCount = parseInt(localStorage.getItem('brainrotChaos') || '0');
const chaosEl = document.getElementById('chaosCount');
chaosEl.textContent = chaosCount.toLocaleString();

function incrementChaos() {
  chaosCount++;
  localStorage.setItem('brainrotChaos', chaosCount);
  animateCounter(chaosEl, chaosCount - 1, chaosCount);
}

function animateCounter(el, from, to) {
  const steps = 12;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(from + (to - from) * (step / steps)).toLocaleString();
    if (step >= steps) clearInterval(timer);
  }, 40);
}

/* ---- TYPING ANIMATION (unchanged) ---- */
async function typeText(el, text, speed = 22) {
  el.classList.add('typing');
  el.textContent = '';
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await new Promise(r => setTimeout(r, speed + Math.random() * 18));
  }
  el.classList.remove('typing');
}

/* ============================================================
   NEW: Translation toggle functionality
   ============================================================ */
let currentTranslation = '';
let showingTranslation = false;

function toggleTranslation() {
  const outputTextEl = document.getElementById('outputText');
  const brainrotText = document.getElementById('brainrotText');
  const translationBtn = document.getElementById('translationBtn');
  const btnText = translationBtn.querySelector('span:last-child');
  
  if (!currentTranslation) return;
  
  showingTranslation = !showingTranslation;
  
  if (showingTranslation) {
    // Save current brainrot text
    if (!brainrotText.value) {
      brainrotText.value = outputTextEl.textContent;
    }
    outputTextEl.textContent = currentTranslation;
    translationBtn.classList.add('active');
    btnText.textContent = 'Show Chaos';
  } else {
    outputTextEl.textContent = brainrotText.value;
    translationBtn.classList.remove('active');
    btnText.textContent = 'Translate';
  }
}

/* ============================================================
   NEW: Image loading and display
   ============================================================ */
// In script.js, update the displayImage function:
function displayImage(imageUrl, imagePrompt) {
  const imageContainer = document.getElementById('imageContainer');
  const generatedImage = document.getElementById('generatedImage');
  const imagePromptEl = document.getElementById('imagePrompt');
  const imageLoader = document.getElementById('imageLoader');
  
  if (!imageUrl) {
    imageContainer.style.display = 'none';
    return;
  }
  
  // Show container and loader
  imageContainer.style.display = 'block';
  imageLoader.style.display = 'flex';
  generatedImage.style.display = 'none';
  
  // Set image prompt
  if (imagePrompt) {
    imagePromptEl.textContent = imagePrompt;
  }
  
  // Use proxy endpoint to bypass CORS
  const proxiedUrl = `/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  
  // Load image through proxy
  generatedImage.onload = () => {
    imageLoader.style.display = 'none';
    generatedImage.style.display = 'block';
  };
  
  generatedImage.onerror = () => {
    imageLoader.style.display = 'none';
    // Fallback: open in new tab
    imagePromptEl.innerHTML = `Failed to load image. <a href="${imageUrl}" target="_blank" style="color: #a855f7; text-decoration: underline;">Click here to view</a> 😢`;
  };
  
  generatedImage.src = proxiedUrl;
  generatedImage.alt = imagePrompt || 'AI generated image';
}

/* ============================================================
   UPGRADED: Generate function with new response structure
   ============================================================ */
async function generate() {
  const text = inputText.value.trim();
  if (!text) {
    inputText.focus();
    shakeInput();
    return;
  }

  const loadingState  = document.getElementById('loadingState');
  const outputBubble  = document.getElementById('outputBubble');
  const outputTextEl  = document.getElementById('outputText');
  const generateBtn   = document.getElementById('generateBtn');
  const btnText       = generateBtn.querySelector('.btn-text');
  const glitchText    = document.getElementById('glitchText');
  const translationBtn = document.getElementById('translationBtn');
  const imageContainer = document.getElementById('imageContainer');
  const brainrotText = document.getElementById('brainrotText');

  // Reset state
  outputBubble.classList.remove('active');
  outputBubble.style.display = 'none';
  imageContainer.style.display = 'none';
  translationBtn.style.display = 'none';
  currentTranslation = '';
  showingTranslation = false;
  translationBtn.classList.remove('active');
  translationBtn.querySelector('span:last-child').textContent = 'Translate';

  // Show loading
  loadingState.classList.add('active');
  btnText.textContent = 'Spiraling…';
  generateBtn.disabled = true;

  const phrases = ['Generating chaos', 'Corrupting neurons', 'Fetching unhinged thoughts', 'Breaking the matrix', 'Painting pixels...'];
  let phraseIdx = 0;
  const phraseTimer = setInterval(() => {
    phraseIdx = (phraseIdx + 1) % phrases.length;
    glitchText.textContent = phrases[phraseIdx];
  }, 1200);

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    clearInterval(phraseTimer);

    loadingState.classList.remove('active');
    btnText.textContent = 'Generate Chaos';
    generateBtn.disabled = false;

    // Check for error
    if (data.error) {
      outputBubble.style.display = 'flex';
      outputBubble.classList.add('active');
      outputTextEl.textContent = `⚠️ ${data.error}`;
      return;
    }

    // Extract the new structured response
    const brainrot = data.brainrot || 'the chaos escaped... 💀';
    const translation = data.translation || '';
    const imagePrompt = data.image_prompt || '';
    const imageUrl = data.image_url || null;

    // Store for translation toggle
    currentTranslation = translation;
    brainrotText.value = brainrot;

    // Show output bubble
    outputBubble.style.display = 'flex';
    outputBubble.classList.add('active');

    // Type out the brainrot text
    await typeText(outputTextEl, brainrot, 20);

    // Show translation button if translation exists
    if (translation && translation !== 'Translation unavailable') {
      translationBtn.style.display = 'flex';
    }

    // Display image if URL exists
    if (imageUrl) {
      displayImage(imageUrl, imagePrompt);
    } else if (imagePrompt) {
      // Show that image is being skipped
      console.log('No image URL received, but prompt exists:', imagePrompt);
    }

    incrementChaos();

  } catch (err) {
    clearInterval(phraseTimer);
    loadingState.classList.remove('active');
    btnText.textContent = 'Generate Chaos';
    generateBtn.disabled = false;

    const fallbacks = [
      "your overthinking is so loud even my servers can't connect 💀",
      "error 404: sanity not found. but honestly same.",
      "the chaos escaped before i could bottle it. try again?",
      "connection failed but your thoughts are still valid (unfortunately)"
    ];
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    outputBubble.style.display = 'flex';
    outputBubble.classList.add('active');
    outputTextEl.textContent = '';
    await typeText(outputTextEl, `⚠️ ${fallback}`, 20);
  }
}

/* ---- SHAKE INPUT (unchanged) ---- */
function shakeInput() {
  const wrapper = document.getElementById('inputWrapper');
  wrapper.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-8px)' },
    { transform: 'translateX(8px)' },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' },
    { transform: 'translateX(0)' },
  ], { duration: 400, easing: 'ease-out' });
}

/* ---- COPY (unchanged) ---- */
async function copyResult() {
  const text = document.getElementById('outputText').textContent;
  const btn  = document.getElementById('copyBtn');
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    btn.classList.add('copied');
    btn.querySelector('span:last-child').textContent = 'Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('span:last-child').textContent = 'Copy';
    }, 2000);
  } catch {
    btn.querySelector('span:last-child').textContent = 'Failed';
    setTimeout(() => { btn.querySelector('span:last-child').textContent = 'Copy'; }, 1500);
  }
}

/* ---- ENTER KEY (unchanged) ---- */
inputText.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    generate();
  }
});

/* ---- SCROLL PARALLAX BLOBS (unchanged) ---- */
window.addEventListener('scroll', () => {
  const s = window.scrollY;
  document.querySelector('.blob-1').style.transform = `translate(${s * 0.04}px, ${s * -0.06}px)`;
  document.querySelector('.blob-2').style.transform = `translate(${s * -0.04}px, ${s * 0.05}px)`;
});
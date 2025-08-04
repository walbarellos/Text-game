const canvas = document.getElementById('etereal-fog');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

const particles = [];

for (let i = 0; i < 60; i++) {
    particles.push({
        x: Math.random() * width,
                   y: Math.random() * height,
                   radius: 30 + Math.random() * 40,
                   alpha: 0.1 + Math.random() * 0.2,
                   dx: -0.3 + Math.random() * 0.6,
                   dy: -0.2 + Math.random() * 0.4
    });
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;

        // rebote ou reinício sutil
        if (p.x < -p.radius || p.x > width + p.radius ||
            p.y < -p.radius || p.y > height + p.radius) {
            p.x = Math.random() * width;
        p.y = Math.random() * height;
            }
    }

    requestAnimationFrame(animate);
}

animate();

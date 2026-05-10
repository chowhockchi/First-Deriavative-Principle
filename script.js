// 💖 THE GENIUS MATH PARSER 💖
function parseMath(s) {
    s = s.toLowerCase().replace(/sqrt/g,'Math.sqrt').replace(/pi/g,'Math.PI').replace(/\be\b/g,'Math.E');
    try { return Function('"use strict";return ('+s+')')(); } catch(e){ return NaN; }
}

function toFrac(v) {
    for(let d=1; d<=100; d++){
        let n=Math.round(v*d);
        if(Math.abs(v-n/d)<1e-6) return d===1 ? `${n}` : `${n}/${d}`;
    }
    return v.toFixed(3);
}

// 💖 天才专属的安全幂函数 (教 JS 做人) 💖
function safePow(x, n) {
    if (x >= 0) return Math.pow(x, n); // 正数直接算
    if (Number.isInteger(n)) return Math.pow(x, n); // 整数直接算
    
    // 既然你非要玩变态大数字，本天才把搜索范围扩大到 10000，并且提高匹配精度！
    for (let d = 1; d <= 10000; d++) {
        let num = Math.round(n * d);
        if (Math.abs(n - num/d) < 1e-8) { // 精度提高到 1e-8，防止大分数误判
            if (d % 2 !== 0) { 
                // 分母是奇数，允许负数开根！
                let res = Math.pow(Math.abs(x), n);
                return (num % 2 === 0) ? res : -res; 
            }
            return NaN; // 分母是偶数，返回 NaN
        }
    }
    return NaN; // 实在找不到，安全丢弃
}

let chart = null, currentA=1, currentN=2, currentDx=1, selectedX=2;

const DOM = {
    a: document.getElementById('inputA'),
    n: document.getElementById('inputN'),
    dx: document.getElementById('dxSlider'),
    dxV: document.getElementById('dxValue'),
    derivEq: document.getElementById('derivEq'),
    pointP: document.getElementById('pointP'),
    pointQ: document.getElementById('pointQ'),
    secantEq: document.getElementById('secantEq'),
    subX: document.getElementById('subX'),
    evalResult: document.getElementById('evalResult')
};

function updateFormulas(a, n) {
    let derivA = toFrac(a*n);
    let derivN = toFrac(n-1);
    DOM.derivEq.innerText = `${derivA}x^(${derivN})`;
    return { derivA, derivN };
}

function drawGraph() {
    let a = parseMath(DOM.a.value);
    let n = parseMath(DOM.n.value);
    let dx = parseFloat(DOM.dx.value);
    
    if(isNaN(a) || isNaN(n)) return;

    // 💖 天才防呆机制：绝对不让分母为 0！💖
    if (dx === 0) {
        dx = 0.001;
        DOM.dx.value = dx;
    }
    
    currentA = a; currentN = n; currentDx = dx;

    let { derivA, derivN } = updateFormulas(a, n);

    let dataF = [], dataSecant = [];
    let x0 = selectedX, x1 = x0 + dx;
    
    // 换成天才的 safePow
    let y0 = a * safePow(x0, n);
    let y1 = a * safePow(x1, n);
    
    let mSec = (y1 - y0) / dx;
    let cSec = y0 - mSec * x0;
    
    // 导数也换成 safePow
    let mTan = a * n * safePow(x0, n - 1);

    // 💖 重构为严谨的 {x, y} 坐标对象体系 💖
    for(let x = -20; x <= 20; x += 0.05) {
        let yVal = a * safePow(x, n);
        dataF.push({ x: x, y: yVal });
        dataSecant.push({ x: x, y: mSec * x + cSec }); 
    }

    if(chart) chart.destroy();

    const ctx = document.getElementById('fpdChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'f(x)', data: dataF, borderColor: '#1e293b', borderWidth: 3, pointRadius: 0, showLine: true, fill: false, tension: 0
                },
                {
                    label: 'Secant Line', data: dataSecant, borderColor: '#10b981', borderWidth: 2, borderDash: [6, 6], pointRadius: 0, showLine: true, fill: false, tension: 0
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { 
                x: { type: 'linear', min: -5, max: 10 }, 
                y: { type: 'linear', min: -5, max: 25 } 
            },
            plugins: {
                zoom: { zoom: { wheel: { enabled: false }, pinch: { enabled: false } }, pan: { enabled: true, mode: 'xy' } }
            },
            onClick: (e) => {
                const canvasPosition = Chart.helpers.getRelativePosition(e, chart);
                const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
                selectedX = dataX; 
                drawGraph(); 
            }
        },
        plugins: [{
            id: 'pointLabels',
            afterDatasetsDraw(chart) {
                const {ctx, scales: {x, y}} = chart;
                ctx.save();
                ctx.font = "bold 14px Consolas, monospace";

                // Point P
                let px = x.getPixelForValue(x0), py = y.getPixelForValue(y0);
                if (!isNaN(px) && !isNaN(py)) {
                    ctx.fillStyle = "#ef4444";
                    ctx.beginPath(); ctx.arc(px, py, 7, 0, 2*Math.PI); ctx.fill();
                    ctx.fillText(`P(${x0.toFixed(2)}, ${y0.toFixed(2)})`, px - 60, py - 15);
                }

                // Point Q
                let qx = x.getPixelForValue(x1), qy = y.getPixelForValue(y1);
                if (!isNaN(qx) && !isNaN(qy)) {
                    ctx.fillStyle = "#2563eb";
                    ctx.beginPath(); ctx.arc(qx, qy, 7, 0, 2*Math.PI); ctx.fill();
                    ctx.fillText(`Q(${x1.toFixed(2)}, ${y1.toFixed(2)})`, qx + 15, qy + 20);
                }
                
                ctx.restore();
            }
        }]
    });

    // Update Info Panels
    DOM.pointP.innerText = `P(x, f(x)) = P(${x0.toFixed(3)}, ${isNaN(y0) ? 'NaN' : y0.toFixed(3)})`;
    DOM.pointQ.innerText = `Q(x+δx, f(x+δx)) = Q(${x1.toFixed(3)}, ${isNaN(y1) ? 'NaN' : y1.toFixed(3)})`;
    
    let sign = cSec >= 0 ? "+" : "-";
    DOM.secantEq.innerText = `Eq: y = ${isNaN(mSec) ? 'NaN' : mSec.toFixed(3)}x ${sign} ${isNaN(cSec) ? 'NaN' : Math.abs(cSec).toFixed(3)}`;

    // Evaluate Derivative
    DOM.subX.innerText = x0.toFixed(3);
    DOM.evalResult.innerText = isNaN(mTan) ? 'NaN' : mTan.toFixed(4);
}

// Button Zoom Logic
document.getElementById('btnZoomIn').onclick = () => chart.zoom(1.2);
document.getElementById('btnZoomOut').onclick = () => chart.zoom(0.8);
document.getElementById('btnReset').onclick = () => chart.resetZoom();

// Form Actions
document.getElementById('updateFuncBtn').onclick = drawGraph;
DOM.dx.oninput = () => { DOM.dxV.innerText = parseFloat(DOM.dx.value).toFixed(3); drawGraph(); };

// Init
drawGraph();
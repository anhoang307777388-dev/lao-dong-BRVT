/* Dữ liệu và biểu đồ. Nguồn: Cục Thống kê, bảng số liệu tỉnh BR-VT (2023 là số sơ bộ). */

const COLORS = {
  nong: '#5BA55B',   // Nông – lâm – thủy sản
  cn: '#F28C28',     // Công nghiệp – xây dựng
  dv: '#1C6E9B',     // Dịch vụ
  navy: '#0B2E4F',
  ink: '#1E2A33',
  grid: 'rgba(11,46,79,.10)'
};

const DATA = {
  years: ['2019', '2020', '2021', '2022', '2023'],
  laoDong: [611.7, 577.7, 564.9, 623.3, 612.5],          // nghìn người
  thatNghiep: [2.08, 3.56, 9.18, 2.81, 2.89],            // %
  thieuViecLam: [0.64, 2.44, 2.70, 1.33, 3.29],          // %
  coCau2023: { dv: 45.9, cn: 35.9, nong: 18.2 },         // %
  coCau: { nong: [20.9, 18.2], cn: [32.7, 35.9], dv: [46.4, 45.9] } // 2019, 2023
};

const fmt = (v, d) => Number(v).toLocaleString('vi-VN', d ? { minimumFractionDigits: d, maximumFractionDigits: d } : {});

Chart.defaults.font.family = "'Be Vietnam Pro', sans-serif";
Chart.defaults.font.size = 20;
Chart.defaults.color = COLORS.ink;
Chart.defaults.plugins.tooltip.enabled = false;
Chart.defaults.animation.duration = 1200;

/* Ghi giá trị lên điểm / cột / phần tròn */
const valueLabels = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts || !opts.enabled) return;
    const { ctx } = chart;
    chart.data.datasets.forEach((ds, di) => {
      const meta = chart.getDatasetMeta(di);
      if (meta.hidden) return;
      meta.data.forEach((el, i) => {
        if ((opts.skip || []).some(([sd, si]) => sd === di && si === i)) return;
        const text = fmt(ds.data[i], opts.decimals) + (opts.suffix || '');
        ctx.save();
        ctx.font = `700 ${opts.size || 20}px 'Be Vietnam Pro', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let x, y;
        if (chart.config.type === 'doughnut') {
          const p = el.tooltipPosition();
          x = p.x; y = p.y; ctx.fillStyle = '#fff';
        } else if (chart.config.type === 'bar') {
          const p = el.getCenterPoint();
          x = p.x; y = p.y; ctx.fillStyle = '#fff';
        } else {
          // điểm thấp hơn đường khác thì ghi số bên dưới để khỏi đè nhau
          const lower = chart.data.datasets.some((o, oi) => oi !== di && o.data[i] > ds.data[i]);
          x = el.x; y = lower ? el.y + 28 : el.y - 24; ctx.fillStyle = ds.borderColor;
        }
        ctx.fillText(text, x, y);
        ctx.restore();
      });
    });
  }
};

/* Chú thích một điểm: { dataset, index, text, color, dy } */
const callout = {
  id: 'callout',
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts || !opts.text) return;
    const el = chart.getDatasetMeta(opts.dataset || 0).data[opts.index];
    if (!el) return;
    const { ctx } = chart;
    const dy = opts.dy || 70;
    ctx.save();
    ctx.strokeStyle = opts.color; ctx.fillStyle = opts.color; ctx.lineWidth = 2;
    if (dy > 0) {
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(el.x, el.y + 14); ctx.lineTo(el.x, el.y + dy); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath(); ctx.arc(el.x, el.y, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "700 19px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = dy > 0 ? 'top' : 'bottom';
    ctx.fillText(opts.text, el.x, el.y + dy + (dy > 0 ? 6 : 0));
    ctx.restore();
  }
};

Chart.register(valueLabels, callout);

const lineDataset = (label, data, color) => ({
  label, data,
  borderColor: color, backgroundColor: color,
  borderWidth: 5, pointRadius: 7, pointHoverRadius: 7, tension: .25
});

const BUILDERS = {
  /* Slide 3: lao động có việc làm */
  laoDong: (ctx) => new Chart(ctx, {
    type: 'line',
    data: { labels: DATA.years, datasets: [lineDataset('Lao động có việc làm (nghìn người)', DATA.laoDong, COLORS.dv)] },
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 34, left: 20, right: 30 } },
      scales: {
        y: { min: 480, max: 660, ticks: { display: false }, grid: { color: COLORS.grid }, border: { display: false },
             title: { display: true, text: 'nghìn người', font: { size: 18 } } },
        x: { grid: { display: false }, ticks: { font: { size: 20, weight: 600 } } }
      },
      plugins: {
        legend: { display: false },
        valueLabels: { enabled: true, size: 20 },
        callout: { index: 2, text: 'Ảnh hưởng dịch COVID-19', color: COLORS.cn, dy: 64 }
      }
    }
  }),

  /* Slide 6: cơ cấu 2023 */
  coCau2023: (ctx) => new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Dịch vụ', 'Công nghiệp – xây dựng', 'Nông – lâm – thủy sản'],
      datasets: [{
        data: [DATA.coCau2023.dv, DATA.coCau2023.cn, DATA.coCau2023.nong],
        backgroundColor: [COLORS.dv, COLORS.cn, COLORS.nong],
        borderColor: '#F6EFE4', borderWidth: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '52%',
      animation: { animateRotate: true, duration: 1400 },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 19 }, boxWidth: 20, padding: 18 } },
        valueLabels: { enabled: true, suffix: '%', size: 24 }
      }
    }
  }),

  /* Slide 7: chuyển dịch cơ cấu 2019 → 2023 */
  chuyenDich: (ctx) => new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['2019', '2023'],
      datasets: [
        { label: 'Nông – lâm – thủy sản', data: DATA.coCau.nong, backgroundColor: COLORS.nong },
        { label: 'Công nghiệp – xây dựng', data: DATA.coCau.cn, backgroundColor: COLORS.cn },
        { label: 'Dịch vụ', data: DATA.coCau.dv, backgroundColor: COLORS.dv }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      datasets: { bar: { barPercentage: .7, categoryPercentage: .8, borderColor: '#F6EFE4', borderWidth: { top: 3 } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 22, weight: 700 } } },
        y: { stacked: true, max: 100, display: false }
      },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 18 }, boxWidth: 18, padding: 16 } },
        valueLabels: { enabled: true, suffix: '%', size: 22 }
      }
    }
  }),

  /* Slide 10: thất nghiệp và thiếu việc làm */
  viecLam: (ctx) => new Chart(ctx, {
    type: 'line',
    data: {
      labels: DATA.years,
      datasets: [
        lineDataset('Tỉ lệ thất nghiệp (%)', DATA.thatNghiep, COLORS.cn),
        lineDataset('Tỉ lệ thiếu việc làm (%)', DATA.thieuViecLam, COLORS.dv)
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 30, left: 10, right: 30 } },
      scales: {
        y: { min: -0.8, max: 11, ticks: { display: false }, grid: { color: COLORS.grid }, border: { display: false },
             title: { display: true, text: '%', font: { size: 18 } } },
        x: { grid: { display: false }, ticks: { font: { size: 20, weight: 600 } } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 18 }, boxWidth: 18, padding: 16 } },
        valueLabels: { enabled: true, size: 18, decimals: 2, skip: [[0, 2]] },
        callout: { dataset: 0, index: 2, text: 'Đỉnh 9,18% (COVID-19)', color: COLORS.cn, dy: -20 }
      }
    }
  })
};

/* Vẽ lại biểu đồ mỗi lần slide hiện ra để có hiệu ứng chạy */
const live = new Map();
function drawChartsIn(slide) {
  if (!slide) return;
  // chờ font tải xong để chữ trong biểu đồ đúng Be Vietnam Pro
  if (document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.ready.then(() => drawChartsIn(slide));
    return;
  }
  slide.querySelectorAll('canvas[data-chart]').forEach((cv) => {
    if (live.has(cv)) live.get(cv).destroy();
    const build = BUILDERS[cv.dataset.chart];
    if (build) live.set(cv, build(cv.getContext('2d')));
  });
}

/**
 * CK Viagens — Hover Button Effect
 * Ports the React HoverButton component to vanilla JS.
 * Applies to every .btn-outline element on the page.
 *
 * On pointer move: injects gold gradient circles that fade in, then fade out,
 * creating a luminous trail that follows the cursor across the button surface.
 */
(function () {
  'use strict';

  // Brand gold gradient — light gold on the left, rich gold on the right
  var COLOR_START = '#e8c870';
  var COLOR_END   = '#c9a047';

  function initHoverButton(btn) {
    var isOver   = false;
    var lastTime = 0;

    btn.addEventListener('pointerenter', function () { isOver = true; });
    btn.addEventListener('pointerleave', function () { isOver = false; });

    btn.addEventListener('pointermove', function (e) {
      if (!isOver) return;

      var now = Date.now();
      if (now - lastTime < 100) return;   // throttle: one circle per 100ms
      lastTime = now;

      var rect  = btn.getBoundingClientRect();
      var x     = e.clientX - rect.left;
      var y     = e.clientY - rect.top;
      var xPos  = x / (btn.offsetWidth || 1); // 0→1 across the button width

      // Gradient colour shifts with horizontal cursor position
      var pct = (xPos * 100).toFixed(1);
      var gradient = 'linear-gradient(to right, '
        + COLOR_START + ' ' + pct + '%, '
        + COLOR_END   + ' ' + pct + '%)';

      var circle = document.createElement('div');
      circle.className = 'btn-hover-circle';
      circle.style.left       = x + 'px';
      circle.style.top        = y + 'px';
      circle.style.background = gradient;
      btn.appendChild(circle);

      // Double rAF so the browser registers the initial opacity:0 before transitioning
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          circle.classList.add('fade-in');
        });
      });

      // Begin fade-out after 1 second
      setTimeout(function () {
        circle.classList.remove('fade-in');
        circle.classList.add('fade-out');
      }, 1000);

      // Remove element after transition completes (300 + 1000 + 1200ms safety margin)
      setTimeout(function () {
        if (circle.parentNode === btn) {
          btn.removeChild(circle);
        }
      }, 2400);
    });
  }

  function init() {
    document.querySelectorAll('.btn-outline').forEach(initHoverButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function(){
'use strict';

var ham = document.getElementById('hamburger');
var mob = document.getElementById('mobile-nav');
if (ham && mob) {
  ham.addEventListener('click', function () {
    var o = mob.classList.toggle('open');
    ham.classList.toggle('open');
    ham.setAttribute('aria-expanded', String(o));
  });
  document.addEventListener('click', function (e) {
    if (!mob.contains(e.target) && !ham.contains(e.target)) {
      mob.classList.remove('open');
      ham.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      mob.classList.remove('open');
      ham.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
    }
  });
  mob.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mob.classList.remove('open');
      ham.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
    });
  });
}

var btt = document.getElementById('btt');
if (btt) {
  window.addEventListener('scroll', function () {
    btt.classList.toggle('show', window.scrollY > 480);
  }, { passive: true });
  btt.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var io;
  function observe(el) {
    if (io) { io.observe(el); } else { el.classList.add('in'); }
  }
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
  }
  document.querySelectorAll('.reveal').forEach(observe);

  function stagger() {
    document.querySelectorAll('.r-grid,.awards-timeline,.event-grid,.pub-list,.talk-list,.mem-list,.contact-stack-grid').forEach(function (parent) {
      Array.from(parent.children).forEach(function (child, i) {
        child.style.transitionDelay = (i * 0.055) + 's';
      });
    });
  }
  stagger();

  window.__refreshReveals = function (root) {
    (root || document).querySelectorAll('.reveal').forEach(function (el) {
      if (!el.classList.contains('in')) observe(el);
    });
    stagger();
  };
});

}());

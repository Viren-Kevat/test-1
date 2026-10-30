/* ==========================================================================
   Shared site chrome — header, full-screen menu, footer, cursor, transitions.
   Injected into every page so it only has to be edited in one place.
   ========================================================================== */
(function () {
  'use strict';

  var page = document.body.getAttribute('data-page') || 'home';

  var seen = false;
  try { seen = !!sessionStorage.getItem('vk_seen'); } catch (e) {}
  var showPreloader = page === 'home' && !seen;

  var nav = [
    ['home',     'index.html',    'Home'],
    ['about',    'about.html',    'About'],
    ['journey',  'journey.html',  'Journey'],
    ['company',  'company.html',  'Nexora'],
    ['insights', 'insights.html', 'Insights'],
    ['contact',  'contact.html',  'Contact']
  ];

  var cur = function (key) { return key === page ? ' aria-current="page"' : ''; };

  var headerLinks = nav.slice(1).map(function (n) {
    return '<a href="' + n[1] + '"' + cur(n[0]) + '>' + n[2] + '</a>';
  }).join('');

  var menuLinks = nav.map(function (n, i) {
    return '<li><a href="' + n[1] + '"' + cur(n[0]) + '><em>0' + (i + 1) + '</em><span>' + n[2] + '</span></a></li>';
  }).join('');

  var footerLinks = nav.map(function (n) {
    return '<li><a href="' + n[1] + '">' + n[2] + '</a></li>';
  }).join('');

  var top =
    (showPreloader
      ? '<div class="preloader" id="preloader" aria-hidden="true"><div class="preloader__inner">' +
        '<span class="preloader__label">Nexora Technologies</span>' +
        '<span class="preloader__name">Viren Kevat</span>' +
        '<span class="preloader__count"><span id="loadCount">0</span>%</span></div></div>'
      : '') +
    '<div class="page-transition' + (showPreloader ? '' : ' is-cover') + '" id="pageTransition" aria-hidden="true">' +
      '<span>Viren <i>Kevat</i></span></div>' +
    '<div class="cursor" id="cursor" aria-hidden="true"><span class="cursor__label"></span></div>' +

    '<header class="site-header" id="header">' +
      '<a href="index.html" class="brand" aria-label="Viren Kevat — home">' +
        '<span class="brand__mark">V<i>K</i></span><span class="brand__text">Viren Kevat</span></a>' +
      '<nav class="header-links d-none d-lg-flex" aria-label="Primary">' + headerLinks + '</nav>' +
      '<button class="menu-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#menu" aria-controls="menu" aria-label="Open menu">' +
        '<span class="menu-btn__text">Menu</span><span class="menu-btn__lines"><i></i><i></i></span></button>' +
    '</header>' +

    '<div class="offcanvas offcanvas-top menu" tabindex="-1" id="menu" aria-label="Site menu">' +
      '<div class="menu__head"><span class="eyebrow">Navigation</span>' +
        '<button type="button" class="menu-btn menu-btn--close" data-bs-dismiss="offcanvas" aria-label="Close menu">' +
        '<span class="menu-btn__text">Close</span><span class="menu-btn__lines is-open"><i></i><i></i></span></button></div>' +
      '<div class="menu__body">' +
        '<ol class="menu__list">' + menuLinks + '</ol>' +
        '<div class="menu__side"><p class="eyebrow">Office of the CEO</p>' +
          '<a href="mailto:office@nexora.example">office@nexora.example</a>' +
          '<a href="tel:+14155550142">+1 (415) 555 0142</a>' +
          '<div class="menu__social">' +
            '<a href="#" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>' +
            '<a href="#" aria-label="X"><i class="bi bi-twitter-x"></i></a>' +
            '<a href="#" aria-label="YouTube"><i class="bi bi-youtube"></i></a>' +
          '</div></div>' +
      '</div></div>';

  var footer =
    '<footer class="footer">' +
      '<div class="container">' +
        '<div class="footer__cta">' +
          '<span class="eyebrow">Have a question or an invitation?</span>' +
          '<a href="contact.html" class="footer__mail"><span>Say hello</span><i class="bi bi-arrow-up-right"></i></a>' +
        '</div>' +
        '<div class="row gy-4 footer__cols">' +
          '<div class="col-6 col-md-3"><h4>Navigate</h4><ul>' + footerLinks + '</ul></div>' +
          '<div class="col-6 col-md-3"><h4>Connect</h4><ul>' +
            '<li><a href="#">LinkedIn</a></li><li><a href="#">X / Twitter</a></li><li><a href="#">YouTube</a></li><li><a href="#">Newsletter</a></li></ul></div>' +
          '<div class="col-md-6"><h4>Office of the CEO</h4>' +
            '<p>Nexora Tower, 400 Market Street<br>San Francisco, CA 94111</p>' +
            '<p><a href="mailto:office@nexora.example">office@nexora.example</a><br><a href="tel:+14155550142">+1 (415) 555 0142</a></p></div>' +
        '</div>' +
        '<div class="footer__top">' +
          '<p>© 2026 Viren Kevat. All rights reserved.<br><small>Fictional portfolio for demonstration. Images via Unsplash.</small></p>' +
          '<a href="#top" class="footer__up" data-top>Back to top <i class="bi bi-arrow-up"></i></a>' +
        '</div>' +
      '</div>' +
      '<div class="footer__big" aria-hidden="true">Viren Kevat</div>' +
    '</footer>';

  var topSlot = document.querySelector('[data-component="top"]');
  var footSlot = document.querySelector('[data-component="footer"]');
  if (topSlot) topSlot.outerHTML = top;
  if (footSlot) footSlot.outerHTML = footer;
})();

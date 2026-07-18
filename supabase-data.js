(function () {
  'use strict';

  var SUPABASE_URL      = 'https://paxznobhptoceuhgvrbt.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnV1Z25mbG1laXZ6ZHJuaXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzQxNzMsImV4cCI6MjA5NzExMDE3M30.x9bShnoTHONKkiWKFi_kZCrxY-WDMFXkzWbhIgaSDbE';

  var path = window.location.pathname;
  var page = path.substring(path.lastIndexOf('/') + 1).replace('.html', '') || 'index';

  function el(id)       { return document.getElementById(id); }
  function qs(sel)      { return document.querySelector(sel); }
  function qsa(sel)     { return Array.from(document.querySelectorAll(sel)); }
  function esc(str)     { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function text(el, v)  { if (el) el.textContent = v || ''; }
  function attr(el, a, v) { if (el) el.setAttribute(a, v || ''); }

  function fetchTable(table, params) {
    var url = SUPABASE_URL + '/rest/v1/' + table + '?select=*';
    if (params) url += '&' + params;
    return fetch(url, {
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type':  'application/json'
      }
    }).then(function (r) {
      if (!r.ok) throw new Error('Supabase fetch failed: ' + table + ' ' + r.status);
      return r.json();
    });
  }

  function setLoading(selector, isLoading) {
    qsa(selector).forEach(function (el) {
      el.classList.toggle('data-loading', isLoading);
    });
  }

  function injectProfile(p) {
    qsa('.nav-brand-name').forEach(function (e) { text(e, p.name); });
    qsa('.nav-brand-sub').forEach(function (e) {
      text(e, p.institute_short + ' · ' + p.department.split(' ')[0] + ' Engineering');
    });

    var greeting = qs('.intro-greeting');
    if (greeting) greeting.innerHTML = 'Hello, I am <em>' + esc(p.name) + '</em>';

    var bio = qs('.bio');
    if (bio) {
      var ps = bio.querySelectorAll('p');
      if (ps[0]) ps[0].innerHTML = p.bio_p1;
      if (ps[1]) ps[1].innerHTML = p.bio_p2;
      if (ps[2]) ps[2].innerHTML = p.bio_p3;
    }

    var rows = qsa('.info-row');
    var map = {
      'Designation': p.title,
      'Department':  p.department + ', ' + p.institute_short,
      'Education':   p.phd_info,
      'Gymkhana':    p.gymkhana_role
    };
    rows.forEach(function (row) {
      var labelEl = row.querySelector('.info-label');
      var valEl   = row.querySelector('.info-val');
      if (!labelEl || !valEl) return;
      var label = labelEl.textContent.trim();
      if (label === 'Email') {
        valEl.innerHTML = '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>';
      } else if (label === 'Phone') {
        valEl.innerHTML = '<a href="tel:' + esc(p.phone.replace(/\s/g,'')) + '">' + esc(p.phone) + '</a>';
      } else if (label === 'LinkedIn') {
        valEl.innerHTML = '<a href="' + esc(p.linkedin_url) + '" target="_blank" rel="noopener noreferrer">View Profile ↗</a>';
      } else if (label === 'Google Scholar') {
        valEl.innerHTML = '<a href="' + esc(p.scholar_url) + '" target="_blank" rel="noopener noreferrer">Open Profile ↗</a>';
      } else if (map[label] !== undefined) {
        text(valEl, map[label]);
      }
    });

    var coursesList = qs('.courses-list');
    if (coursesList && p.courses) {
      coursesList.innerHTML = p.courses.split('|').map(function (c) {
        return '<div class="course-item">' + esc(c.trim()) + '</div>';
      }).join('');
    }

    var chipList = qs('.chip-list');
    if (chipList && p.interests) {
      chipList.innerHTML = p.interests.split('|').map(function (i) {
        return '<span class="chip">' + esc(i.trim()) + '</span>';
      }).join('');
    }

    var navCta = qs('a.nav-cta[href^="mailto:"]');
    if (navCta) attr(navCta, 'href', 'mailto:' + p.email);

    var ftl = qs('.ft-l');
    if (ftl) text(ftl, p.name + ' · ' + p.institute_short);
  }

  function injectContact(p) {
    var phoneLink = qs('a[href^="tel:"]');
    if (phoneLink) {
      attr(phoneLink, 'href', 'tel:' + p.phone.replace(/[\s-]/g,''));
      text(phoneLink, p.phone);
    }
    var emailLink = qs('a[href^="mailto:"]');
    if (emailLink) {
      attr(emailLink, 'href', 'mailto:' + p.email);
      text(emailLink, p.email);
    }
    var deptEl = qs('.contact-row .c-val[data-field="dept"]');
    if (deptEl) deptEl.innerHTML = esc(p.department) + '<br>' + esc(p.institute);
    var addrEl = qs('address');
    if (addrEl) addrEl.innerHTML = esc(p.institute) + '<br>' + esc(p.address);
    var linksContainer = qs('.profile-links');
    if (linksContainer) linksContainer.innerHTML = [
      { label: 'LinkedIn Profile ↗',          url: p.linkedin_url },
      { label: 'IIT Patna Faculty Profile ↗', url: p.faculty_url  },
      { label: 'Google Scholar ↗',            url: p.scholar_url  }
    ].map(function (l) {
      return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + '</a>';
    }).join('');
  }

  function injectPublications(pubs) {
    var journals = pubs.filter(function (p) { return p.type === 'journal'; });
    var books    = pubs.filter(function (p) { return p.type === 'book'; });
    var confs    = pubs.filter(function (p) { return p.type === 'conference'; });

    function buildItem(p) {
      var doi = p.doi_url
        ? '<div class="pub-doi"><a href="' + esc(p.doi_url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.doi) + ' ↗</a></div>'
        : '';
      var badge = p.badge
        ? '<div class="pub-badge">' + esc(p.badge) + '</div>'
        : '';
      return '<article class="pub-item" role="listitem" data-year="' + p.year + '">' +
        '<div class="pub-num-col"><div class="pub-n">' + esc(p.number) + '</div><div class="pub-yr">' + p.year + '</div></div>' +
        '<div class="pub-body">' +
          '<div class="pub-title">' + esc(p.title) + '</div>' +
          '<div class="pub-authors">' + esc(p.authors) + '</div>' +
          '<div class="pub-venue">' + esc(p.venue) + '</div>' +
          doi + badge +
        '</div></article>';
    }

    var jList = el('journal-list');
    if (jList && journals.length) jList.innerHTML = journals.map(buildItem).join('');

    var bList = el('book-list');
    if (bList && books.length) bList.innerHTML = books.map(buildItem).join('');

    var cList = el('conf-list');
    if (cList && confs.length) cList.innerHTML = confs.map(buildItem).join('');

    if (window.__pubFilterInit) window.__pubFilterInit();
  }

  function injectTalks(talks) {
    var list = qs('.talk-list');
    if (!list) return;
    list.innerHTML = talks.map(function (t) {
      return '<div class="talk-item reveal" role="listitem">' +
        '<div><div class="talk-year">' + t.year + '</div>' +
        '<div class="talk-venue">' + esc(t.venue) + '</div></div>' +
        '<div>' +
          '<div class="talk-type">' + esc(t.type_label) + '</div>' +
          '<div class="talk-title">' + esc(t.title) + '</div>' +
          '<div class="talk-desc">' + esc(t.description) + '</div>' +
        '</div></div>';
    }).join('');
    if (window.__refreshReveals) window.__refreshReveals();
  }

  function injectAwards(awards) {
    var timeline = qs('.awards-timeline');
    if (!timeline) return;
    timeline.innerHTML = awards.map(function (a) {
      var featured = a.is_featured ? ' featured' : '';
      var tag  = a.tag ? '<div class="awt-tag">' + esc(a.tag) + '</div>' : '';
      var chip = a.is_featured ? '<div style="margin-top:1rem"><span class="chip">Flagship Award</span></div>' : '';
      return '<div class="awt-item' + featured + '" role="listitem">' +
        '<div class="awt-year">' + a.year + '</div>' +
        '<div class="awt-dot-col"><div class="awt-dot"></div></div>' +
        '<div class="awt-body">' + tag +
          '<div class="awt-name">' + esc(a.name) + '</div>' +
          '<div class="awt-org">' + esc(a.org) + '</div>' + chip +
        '</div></div>';
    }).join('');
  }

  function injectExperience(exp) {
    var wrap = qs('.tl-wrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="tl-spine" aria-hidden="true"></div>' +
      exp.map(function (e) {
        return '<div class="tl-entry">' +
          '<div class="tl-dot"></div>' +
          '<div class="tl-date">' + esc(e.date_range) + '</div>' +
          '<div class="tl-role">' + esc(e.role) + '</div>' +
          '<div class="tl-org">' + esc(e.organisation) + '</div>' +
        '</div>';
      }).join('');
  }

  function injectMemberships(mems) {
    var list = qs('.mem-list');
    if (!list) return;
    list.innerHTML = mems.map(function (m, i) {
      var num = String(i + 1).padStart(2, '0');
      return '<div class="mem-item" role="listitem">' +
        '<span class="mem-num">' + num + '</span>' +
        '<span class="mem-text">' + esc(m.name) + '</span></div>';
    }).join('');
  }

  function injectLeadership(events) {
    var byYear = {};
    events.forEach(function (e) {
      if (!byYear[e.year]) byYear[e.year] = [];
      byYear[e.year].push(e);
    });
    var years = Object.keys(byYear).sort(function (a, b) { return b - a; });
    var sec = qs('section.sec');
    if (!sec) return;

    qsa('.yr-header, .event-grid').forEach(function (e) { e.remove(); });

    var cta = qs('.cta-row');
    years.forEach(function (yr) {
      var evts = byYear[yr];
      var hdr  = document.createElement('div');
      hdr.className = 'yr-header reveal';
      hdr.innerHTML = '<div class="yr-num">' + yr + '</div><div class="yr-line"></div>' +
        '<div class="yr-count">' + evts.length + ' event' + (evts.length > 1 ? 's' : '') + '</div>';
      var grid = document.createElement('div');
      grid.className = 'event-grid reveal';
      grid.setAttribute('role', 'list');
      grid.innerHTML = evts.map(function (e) {
        return '<div class="event-card" role="listitem">' +
          '<div class="event-role">' + esc(e.role) + '</div>' +
          '<div class="event-title">' + esc(e.title) + '</div>' +
          '<div class="event-venue">' + esc(e.venue) + '</div></div>';
      }).join('');
      if (cta) { sec.insertBefore(hdr, cta); sec.insertBefore(grid, cta); }
      else { sec.appendChild(hdr); sec.appendChild(grid); }
    });
    if (window.__refreshReveals) window.__refreshReveals();
  }

  function injectResearch(areas) {
    var grid = qs('.r-grid');
    if (grid) grid.innerHTML = areas.map(function (a) {
      return '<div class="r-card" role="listitem">' +
        '<div class="r-num">' + esc(a.number) + '</div>' +
        '<div class="r-title">' + esc(a.title) + '</div></div>';
    }).join('');
  }

  function injectEditorial(roles) {
    var board    = roles.filter(function (r) { return r.role_type === 'board'; });
    var reviewer = roles.filter(function (r) { return r.role_type === 'reviewer'; });
    function buildItems(arr) {
      return arr.map(function (r) {
        var detail = r.detail ? ' — ' + esc(r.detail) : '';
        return '<div class="mem-item"><span class="mem-num">—</span>' +
          '<span class="mem-text"><strong style="color:var(--ink);font-weight:600">' +
          esc(r.journal) + '</strong>' + detail + '</span></div>';
      }).join('');
    }
    var cols = qsa('.about-grid.editorial-grid > div');
    if (cols[0]) cols[0].querySelector('.mem-list').innerHTML = buildItems(board);
    if (cols[1]) cols[1].querySelector('.mem-list').innerHTML = buildItems(reviewer);
  }

  function init() {
    switch (page) {
      case 'index':
        setLoading('.bio, .info-panel', true);
        fetchTable('profile', 'limit=1').then(function (rows) {
          if (rows[0]) injectProfile(rows[0]);
          setLoading('.bio, .info-panel', false);
        }).catch(console.error);
        break;

      case 'publications':
        setLoading('.pub-list', true);
        fetchTable('publications', 'order=type.asc,sort_order.asc').then(function (pubs) {
          injectPublications(pubs);
          setLoading('.pub-list', false);
        }).catch(console.error);
        break;

      case 'talks':
        setLoading('.talk-list', true);
        fetchTable('talks', 'order=sort_order.asc').then(function (talks) {
          injectTalks(talks);
          setLoading('.talk-list', false);
        }).catch(console.error);
        break;

      case 'awards':
        setLoading('.awards-timeline', true);
        fetchTable('awards', 'order=sort_order.asc').then(function (awards) {
          injectAwards(awards);
          setLoading('.awards-timeline', false);
        }).catch(console.error);
        break;

      case 'experience':
        setLoading('.tl-wrap, .mem-list', true);
        Promise.all([
          fetchTable('experience',  'order=sort_order.asc'),
          fetchTable('memberships', 'order=sort_order.asc')
        ]).then(function (results) {
          injectExperience(results[0]);
          injectMemberships(results[1]);
          setLoading('.tl-wrap, .mem-list', false);
        }).catch(console.error);
        break;

      case 'leadership':
        setLoading('.event-grid', true);
        fetchTable('leadership_events', 'order=year.desc,sort_order.asc').then(function (evts) {
          injectLeadership(evts);
          setLoading('.event-grid', false);
        }).catch(console.error);
        break;

      case 'research':
        setLoading('.r-grid', true);
        Promise.all([
          fetchTable('research_areas',  'order=sort_order.asc'),
          fetchTable('editorial_roles', 'order=sort_order.asc')
        ]).then(function (results) {
          injectResearch(results[0]);
          injectEditorial(results[1]);
          setLoading('.r-grid', false);
        }).catch(console.error);
        break;

      case 'contact':
        fetchTable('profile', 'limit=1').then(function (rows) {
          if (rows[0]) injectContact(rows[0]);
        }).catch(console.error);
        break;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());

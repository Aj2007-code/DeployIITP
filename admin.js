(function () {
  'use strict';

  
  var SUPABASE_URL      = 'https://paxznobhptoceuhgvrbt.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheHpub2JocHRvY2V1aGd2cmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjgxMzYsImV4cCI6MjA5NzEwNDEzNn0.SbLn5eMPW_RzhEtcHzWYbEArPdvs9HZynXZ6Y9fczhE';

    
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function el(id)   { return document.getElementById(id); }
  function esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function flash(container, ok, msg) {
    var span = container.querySelector('.save-msg');
    if (!span) return;
    span.textContent = msg;
    span.className = 'save-msg show ' + (ok ? 'ok' : 'err');
    setTimeout(function () { span.classList.remove('show'); }, 2200);
  }

  function renderError(container, err) {
    container.innerHTML = '<div class="empty-state">Could not load data: ' + esc(err.message || String(err)) + '</div>';
  }

  var loginScreen = el('login-screen');
  var adminShell  = el('admin-shell');
  var loginForm   = el('login-form');
  var loginBtn    = el('login-btn');
  var loginError  = el('login-error');

  function showAdmin(session) {
    loginScreen.style.display = 'none';
    adminShell.style.display  = 'block';
    el('admin-user-email').textContent = session.user.email;
    loadAllPanels();
  }

  function showLogin() {
    loginScreen.style.display = 'flex';
    adminShell.style.display  = 'none';
  }

  sb.auth.getSession().then(function (res) {
    if (res.data.session) {
      showAdmin(res.data.session);
    } else {
      showLogin();
    }
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginError.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in…';

    var email    = el('login-email').value.trim();
    var password = el('login-password').value;

    sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
      if (res.error) {
        loginError.textContent = res.error.message;
        loginError.style.display = 'block';
        return;
      }
      showAdmin(res.data.session);
    });
  });

  el('logout-btn').addEventListener('click', function () {
    sb.auth.signOut().then(function () {
      showLogin();
      loginForm.reset();
    });
  });

  qsa('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      qsa('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      qsa('.panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      el('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  function loadAllPanels() {
    loadProfile();
    loadPublications();
    loadTalks();
    loadAwards();
    loadExperience();
    loadLeadership();
    loadResearch();
  }

  function loadProfile() {
    var container = el('profile-content');
    sb.from('profile').select('*').eq('id', 1).single().then(function (res) {
      if (res.error) { renderError(container, res.error); return; }
      renderProfileForm(container, res.data);
    });
  }

  var PROFILE_FIELDS = [
    { key: 'name',           label: 'Full Name',                      type: 'text'     },
    { key: 'title',          label: 'Designation',                    type: 'text'     },
    { key: 'department',     label: 'Department',                     type: 'text'     },
    { key: 'institute',      label: 'Institute (full name)',           type: 'text'     },
    { key: 'institute_short',label: 'Institute (short name)',          type: 'text'     },
    { key: 'address',        label: 'Campus Address',                  type: 'text'     },
    { key: 'email',          label: 'Email',                           type: 'email'    },
    { key: 'phone',          label: 'Phone',                           type: 'text'     },
    { key: 'phd_info',       label: 'Education / PhD Info',            type: 'text'     },
    { key: 'gymkhana_role',  label: 'Gymkhana Role',                   type: 'text'     },
    { key: 'linkedin_url',   label: 'LinkedIn URL',                    type: 'text'     },
    { key: 'scholar_url',    label: 'Google Scholar URL',              type: 'text'     },
    { key: 'faculty_url',    label: 'IIT Patna Faculty Profile URL',   type: 'text'     },
    { key: 'iitp_url',       label: 'Institute Website URL',           type: 'text'     },
    { key: 'bio_p1',         label: 'Bio — Paragraph 1',               type: 'textarea' },
    { key: 'bio_p2',         label: 'Bio — Paragraph 2',               type: 'textarea' },
    { key: 'bio_p3',         label: 'Bio — Paragraph 3',               type: 'textarea' },
    { key: 'courses',        label: 'Courses Taught (one per line)',    type: 'lines'    },
    { key: 'interests',      label: 'Other Interests (one per line)',   type: 'lines'    }
  ];

  function renderProfileForm(container, profile) {
    var html = '<div class="card"><div class="card-head">' +
      '<div class="card-badge">Profile</div>' +
      '<div class="card-actions"><span class="save-msg"></span><button class="btn-sm btn-save" id="profile-save">Save Changes</button></div>' +
      '</div><form id="profile-form">';

    PROFILE_FIELDS.forEach(function (f) {
      var raw = profile[f.key] || '';
      html += '<div class="field">';
      html += '<label for="pf-' + f.key + '">' + esc(f.label) + '</label>';
      if (f.type === 'textarea') {
        html += '<textarea id="pf-' + f.key + '" data-key="' + f.key + '" data-type="text" style="min-height:110px">' + esc(raw) + '</textarea>';
      } else if (f.type === 'lines') {
        var lines = raw.split('|').map(function (s) { return s.trim(); }).filter(Boolean).join('\n');
        html += '<textarea id="pf-' + f.key + '" data-key="' + f.key + '" data-type="lines" style="min-height:90px">' + esc(lines) + '</textarea>';
      } else {
        html += '<input type="' + f.type + '" id="pf-' + f.key + '" data-key="' + f.key + '" data-type="text" value="' + esc(raw) + '">';
      }
      html += '</div>';
    });

    html += '</form></div>';
    container.innerHTML = html;

    var card = container.querySelector('.card');
    el('profile-save').addEventListener('click', function () {
      saveProfile(card);
    });
  }

  function saveProfile(card) {
    var btn = el('profile-save');
    btn.disabled = true;
    var update = {};
    qsa('#profile-form [data-key]').forEach(function (input) {
      var key  = input.dataset.key;
      var type = input.dataset.type;
      var val  = input.value;
      if (type === 'lines') {
        val = val.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).join('|');
      }
      update[key] = val;
    });

    sb.from('profile').update(update).eq('id', 1).then(function (res) {
      btn.disabled = false;
      if (res.error) { flash(card, false, 'Error: ' + res.error.message); return; }
      flash(card, true, 'Saved ✓');
    });
  }

  function renderListEditor(opts) {
    var container = opts.container;
    var rows = opts.rows || [];

    if (!rows.length) {
      container.innerHTML =
        '<div class="empty-state">' + esc(opts.emptyLabel || 'No entries yet.') + '</div>' +
        '<div style="margin-top:1rem"><button class="btn-add" data-action="add">+ ' + esc(opts.addLabel || 'Add Entry') + '</button></div>';
    } else {
      container.innerHTML = rows.map(function (row) {
        return buildCard(row, opts);
      }).join('') +
        '<div style="margin-top:.5rem"><button class="btn-add" data-action="add">+ ' + esc(opts.addLabel || 'Add Entry') + '</button></div>';
    }

    qsa('[data-action="add"]', container).forEach(function (btn) {
      btn.addEventListener('click', function () { addRow(opts); });
    });

    qsa('.card', container).forEach(function (card) {
      bindCardEvents(card, opts);
    });
  }

  function buildCard(row, opts) {
    var id = row.id != null ? row.id : 'new-' + Math.random().toString(36).slice(2);
    var html = '<div class="card" data-id="' + id + '" data-existing="' + (row.id != null ? '1' : '0') + '">';
    html += '<div class="card-head"><div class="card-badge">' + esc(opts.badge) + '</div>';
    html += '<div class="card-actions"><span class="save-msg"></span>';
    html += '<button class="btn-sm btn-save" data-action="save">Save</button>';
    html += '<button class="btn-sm btn-delete" data-action="delete">Delete</button>';
    html += '</div></div>';

    opts.schema.forEach(function (f) {
      var raw = row[f.key];
      if (raw == null) raw = f.default != null ? f.default : '';
      html += renderField(f, raw, id);
    });

    html += '</div>';
    return html;
  }

  function renderField(f, raw, rowId) {
    var fid = 'f-' + rowId + '-' + f.key;
    if (f.type === 'checkbox') {
      return '<div class="checkbox-field">' +
        '<input type="checkbox" id="' + fid + '" data-key="' + f.key + '" data-type="checkbox"' + (raw ? ' checked' : '') + '>' +
        '<label for="' + fid + '">' + esc(f.label) + '</label></div>';
    }
    var html = '<div class="field">';
    html += '<label for="' + fid + '">' + esc(f.label) + '</label>';
    if (f.type === 'textarea') {
      html += '<textarea id="' + fid + '" data-key="' + f.key + '" data-type="text">' + esc(raw) + '</textarea>';
    } else if (f.type === 'select') {
      html += '<select id="' + fid + '" data-key="' + f.key + '" data-type="text">';
      f.options.forEach(function (o) {
        html += '<option value="' + esc(o.value) + '"' + (String(raw) === String(o.value) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
      });
      html += '</select>';
    } else {
      var inputType = f.type === 'number' ? 'number' : 'text';
      html += '<input type="' + inputType + '" id="' + fid + '" data-key="' + f.key + '" data-type="' + (f.type === 'number' ? 'number' : 'text') + '" value="' + esc(raw) + '">';
    }
    html += '</div>';
    return html;
  }

  function readCardValues(card, schema) {
    var update = {};
    schema.forEach(function (f) {
      var input = card.querySelector('[data-key="' + f.key + '"]');
      if (!input) return;
      if (f.type === 'checkbox') {
        update[f.key] = input.checked;
      } else if (f.type === 'number') {
        update[f.key] = input.value === '' ? null : Number(input.value);
      } else {
        var v = input.value;
        update[f.key] = v === '' && f.nullable ? null : v;
      }
    });
    return update;
  }

  function bindCardEvents(card, opts) {
    var saveBtn = card.querySelector('[data-action="save"]');
    var delBtn  = card.querySelector('[data-action="delete"]');

    saveBtn.addEventListener('click', function () {
      saveBtn.disabled = true;
      var values   = readCardValues(card, opts.schema);
      var existing = card.dataset.existing === '1';
      var id       = card.dataset.id;

      if (existing) {
        sb.from(opts.table).update(values).eq('id', id).then(function (res) {
          saveBtn.disabled = false;
          if (res.error) { flash(card, false, 'Error: ' + res.error.message); return; }
          flash(card, true, 'Saved ✓');
          if (opts.afterSave) opts.afterSave();
        });
      } else {
        sb.from(opts.table).insert(values).select().then(function (res) {
          saveBtn.disabled = false;
          if (res.error) { flash(card, false, 'Error: ' + res.error.message); return; }
          if (res.data && res.data[0]) {
            card.dataset.id       = res.data[0].id;
            card.dataset.existing = '1';
          }
          flash(card, true, 'Created ✓');
          if (opts.afterSave) opts.afterSave();
        });
      }
    });

    delBtn.addEventListener('click', function () {
      var existing = card.dataset.existing === '1';
      if (!existing) { card.remove(); return; }
      if (!window.confirm('Delete this entry? This cannot be undone.')) return;
      var id = card.dataset.id;
      delBtn.disabled = true;
      sb.from(opts.table).delete().eq('id', id).then(function (res) {
        if (res.error) { flash(card, false, 'Error: ' + res.error.message); delBtn.disabled = false; return; }
        card.remove();
        if (opts.afterSave) opts.afterSave();
      });
    });
  }

  function addRow(opts) {
    var newRow   = Object.assign({}, opts.defaults || {});
    var cardHtml = buildCard(newRow, opts);
    var addBtn   = opts.container.querySelector('[data-action="add"]');
    var wrapper  = addBtn ? addBtn.parentElement : null;

    var tmp  = document.createElement('div');
    tmp.innerHTML = cardHtml;
    var card = tmp.firstElementChild;

    var emptyState = opts.container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    if (wrapper) {
      opts.container.insertBefore(card, wrapper);
    } else {
      opts.container.appendChild(card);
    }
    bindCardEvents(card, opts);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  var PUB_SCHEMA = [
    { key: 'type',       label: 'Type',                                  type: 'select', options: [
      { value: 'journal',    label: 'Journal'      },
      { value: 'book',       label: 'Book Chapter' },
      { value: 'conference', label: 'Conference'   }
    ]},
    { key: 'sort_order', label: 'Sort Order',                            type: 'number'   },
    { key: 'number',     label: 'Display Number',                        type: 'text'     },
    { key: 'year',       label: 'Year',                                  type: 'number'   },
    { key: 'title',      label: 'Title',                                 type: 'textarea' },
    { key: 'authors',    label: 'Authors',                               type: 'text'     },
    { key: 'venue',      label: 'Venue / Journal',                       type: 'textarea' },
    { key: 'doi',        label: 'DOI Display Text (e.g. doi: 10.xxxx)', type: 'text', nullable: true },
    { key: 'doi_url',    label: 'DOI URL',                               type: 'text', nullable: true },
    { key: 'badge',      label: 'Badge Text (optional)',                  type: 'text', nullable: true }
  ];

  function loadPublications() {
    var container = el('publications-content');
    sb.from('publications').select('*').order('type', { ascending: true }).order('sort_order', { ascending: true }).then(function (res) {
      if (res.error) { renderError(container, res.error); return; }
      renderListEditor({
        container:  container,
        table:      'publications',
        rows:       res.data,
        schema:     PUB_SCHEMA,
        badge:      'Publication',
        emptyLabel: 'No publications yet.',
        addLabel:   'Add Publication',
        defaults:   { type: 'journal', sort_order: 0, number: '', year: new Date().getFullYear(), title: '', authors: '', venue: '' }
      });
    });
  }

  var TALK_SCHEMA = [
    { key: 'sort_order',  label: 'Sort Order',                          type: 'number'   },
    { key: 'year',        label: 'Year',                                type: 'number'   },
    { key: 'venue',       label: 'Venue / Location',                    type: 'textarea' },
    { key: 'type_label',  label: 'Type Label (e.g. Keynote Address)',   type: 'text'     },
    { key: 'title',       label: 'Title',                               type: 'textarea' },
    { key: 'description', label: 'Description',                         type: 'textarea' }
  ];

  function loadTalks() {
    var container = el('talks-content');
    sb.from('talks').select('*').order('sort_order', { ascending: true }).then(function (res) {
      if (res.error) { renderError(container, res.error); return; }
      renderListEditor({
        container:  container,
        table:      'talks',
        rows:       res.data,
        schema:     TALK_SCHEMA,
        badge:      'Talk',
        emptyLabel: 'No talks yet.',
        addLabel:   'Add Talk',
        defaults:   { sort_order: 0, year: new Date().getFullYear(), venue: '', type_label: '', title: '', description: '' }
      });
    });
  }

  var AWARD_SCHEMA = [
    { key: 'sort_order',  label: 'Sort Order',                                    type: 'number'   },
    { key: 'year',        label: 'Year',                                           type: 'number'   },
    { key: 'tag',         label: 'Tag (optional)',                                 type: 'text', nullable: true },
    { key: 'name',        label: 'Award Name',                                    type: 'text'     },
    { key: 'org',         label: 'Organisation / Description',                    type: 'textarea' },
    { key: 'is_featured', label: 'Featured (highlighted as flagship award)',       type: 'checkbox' }
  ];

  function loadAwards() {
    var container = el('awards-content');
    sb.from('awards').select('*').order('sort_order', { ascending: true }).then(function (res) {
      if (res.error) { renderError(container, res.error); return; }
      renderListEditor({
        container:  container,
        table:      'awards',
        rows:       res.data,
        schema:     AWARD_SCHEMA,
        badge:      'Award',
        emptyLabel: 'No awards yet.',
        addLabel:   'Add Award',
        defaults:   { sort_order: 0, year: new Date().getFullYear(), tag: '', name: '', org: '', is_featured: false }
      });
    });
  }

  var EXPERIENCE_SCHEMA = [
    { key: 'sort_order',   label: 'Sort Order',                                    type: 'number'   },
    { key: 'date_range',   label: 'Date Range (e.g. November 2019 — Present)',     type: 'text'     },
    { key: 'role',         label: 'Role',                                           type: 'text'     },
    { key: 'organisation', label: 'Organisation',                                  type: 'textarea' }
  ];

  var MEMBERSHIP_SCHEMA = [
    { key: 'sort_order', label: 'Sort Order',              type: 'number' },
    { key: 'name',       label: 'Membership / Body Name',  type: 'text'   }
  ];

  function loadExperience() {
    var container = el('experience-content');
    Promise.all([
      sb.from('experience').select('*').order('sort_order',  { ascending: true }),
      sb.from('memberships').select('*').order('sort_order', { ascending: true })
    ]).then(function (results) {
      var expRes = results[0];
      var memRes = results[1];
      if (expRes.error) { renderError(container, expRes.error); return; }
      if (memRes.error) { renderError(container, memRes.error); return; }

      container.innerHTML =
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:1.2rem;margin-bottom:1rem">Career Timeline</h3>' +
        '<div id="experience-list"></div>' +
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:1.2rem;margin:2rem 0 1rem">Professional Memberships</h3>' +
        '<div id="membership-list"></div>';

      renderListEditor({
        container:  el('experience-list'),
        table:      'experience',
        rows:       expRes.data,
        schema:     EXPERIENCE_SCHEMA,
        badge:      'Position',
        emptyLabel: 'No experience entries yet.',
        addLabel:   'Add Position',
        defaults:   { sort_order: 0, date_range: '', role: '', organisation: '' }
      });

      renderListEditor({
        container:  el('membership-list'),
        table:      'memberships',
        rows:       memRes.data,
        schema:     MEMBERSHIP_SCHEMA,
        badge:      'Membership',
        emptyLabel: 'No memberships yet.',
        addLabel:   'Add Membership',
        defaults:   { sort_order: 0, name: '' }
      });
    });
  }

  var LEADERSHIP_SCHEMA = [
    { key: 'sort_order', label: 'Sort Order (within year)',              type: 'number'   },
    { key: 'year',       label: 'Year',                                  type: 'number'   },
    { key: 'role',       label: 'Role (e.g. Convenor, Session Chair)',   type: 'text'     },
    { key: 'title',      label: 'Event Title',                           type: 'textarea' },
    { key: 'venue',      label: 'Venue / Date',                          type: 'textarea' }
  ];

  function loadLeadership() {
    var container = el('leadership-content');
    sb.from('leadership_events').select('*').order('year', { ascending: false }).order('sort_order', { ascending: true }).then(function (res) {
      if (res.error) { renderError(container, res.error); return; }
      renderListEditor({
        container:  container,
        table:      'leadership_events',
        rows:       res.data,
        schema:     LEADERSHIP_SCHEMA,
        badge:      'Event',
        emptyLabel: 'No leadership events yet.',
        addLabel:   'Add Event',
        defaults:   { sort_order: 0, year: new Date().getFullYear(), role: '', title: '', venue: '' },
        afterSave:  function () { loadLeadership(); }
      });
    });
  }

  var RESEARCH_AREA_SCHEMA = [
    { key: 'sort_order', label: 'Sort Order',                    type: 'number' },
    { key: 'number',     label: 'Display Number (e.g. 01)',      type: 'text'   },
    { key: 'title',      label: 'Research Area Title',            type: 'text'   }
  ];

  var EDITORIAL_SCHEMA = [
    { key: 'sort_order', label: 'Sort Order',              type: 'number' },
    { key: 'role_type',  label: 'Role Type',               type: 'select', options: [
      { value: 'board',    label: 'Editorial Board Member' },
      { value: 'reviewer', label: 'Peer Reviewer'          }
    ]},
    { key: 'journal',    label: 'Journal / Publication Name', type: 'text'             },
    { key: 'detail',     label: 'Detail (e.g. eISSN, publisher)', type: 'text', nullable: true }
  ];

  function loadResearch() {
    var container = el('research-content');
    Promise.all([
      sb.from('research_areas').select('*').order('sort_order',  { ascending: true }),
      sb.from('editorial_roles').select('*').order('sort_order', { ascending: true })
    ]).then(function (results) {
      var areaRes = results[0];
      var roleRes = results[1];
      if (areaRes.error) { renderError(container, areaRes.error); return; }
      if (roleRes.error) { renderError(container, roleRes.error); return; }

      container.innerHTML =
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:1.2rem;margin-bottom:1rem">Research Areas</h3>' +
        '<div id="research-area-list"></div>' +
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:1.2rem;margin:2rem 0 1rem">Editorial &amp; Peer Review Roles</h3>' +
        '<div id="editorial-role-list"></div>';

      renderListEditor({
        container:  el('research-area-list'),
        table:      'research_areas',
        rows:       areaRes.data,
        schema:     RESEARCH_AREA_SCHEMA,
        badge:      'Research Area',
        emptyLabel: 'No research areas yet.',
        addLabel:   'Add Research Area',
        defaults:   { sort_order: 0, number: '', title: '' }
      });

      renderListEditor({
        container:  el('editorial-role-list'),
        table:      'editorial_roles',
        rows:       roleRes.data,
        schema:     EDITORIAL_SCHEMA,
        badge:      'Editorial Role',
        emptyLabel: 'No editorial roles yet.',
        addLabel:   'Add Editorial Role',
        defaults:   { sort_order: 0, role_type: 'reviewer', journal: '', detail: '' }
      });
    });
  }

}());

/* ShowReady Build 111: the Promo Campaign posting plan, inside the Promote tab.
   Built from the event date and what's on. Each post has a date, a suggested time, platforms, an image in the
   right size (drawn by /promo.js), a caption, hashtags, steps and a To do / Posted tick.
   Saved on the event as e.promo.campaign = { items: [...], email: true }.
   Auto posts keep "rel" (days from the event) so they move when the event date changes; posted ones stay put.
   Spotlight posts are added by the organiser on any date.
   Access: pilot and Promo Campaign get the live plan; Promo Pack gets a fixed printable plan; free users see a preview.
   The weekly "posts ready" email and the missed-post nudge are sent by the promo-campaign-mail edge function. */
(function () {
  'use strict';
  if (window.SRCampaign) return;
  var C = window.SRCampaign = { view: 'list', month: null, open: {} };
  function M() { return window.SRPromote || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function iso(d) { return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function diff(a, b) { return Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / 86400000); }
  function nice(s) { var d = new Date(s + 'T12:00:00Z'); return DAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
  function dow(s) { return new Date(s + 'T12:00:00Z').getUTCDay(); }

  // ---- the countdown. rel = days from the event day. when(f) decides whether a post applies to this event.
  var PLAT = { fb: 'Facebook', ig: 'Instagram', story: 'Stories', group: 'Facebook groups', wa: 'WhatsApp', nd: 'Nextdoor' };
  var AUTO = [
    { kind: 'announce', rel: -42, name: 'Save the date', kicker: 'Save the date', size: 'portrait', plat: ['fb', 'ig', 'group'] },
    { kind: 'fbevent', rel: -41, name: 'Make your Facebook event', kicker: '', size: 'fbcover', plat: ['fb'] },
    { kind: 'whatson', rel: -28, name: 'What’s on', kicker: 'What’s on', size: 'portrait', plat: ['fb', 'ig'] },
    { kind: 'lineup', rel: -21, name: 'The line-up', kicker: 'The line-up', size: 'portrait', plat: ['fb', 'ig'], when: function (f) { return !!f.lineup; } },
    { kind: 'traders', rel: -17, name: 'Meet our traders', kicker: 'Meet our traders', size: 'square', plat: ['fb', 'ig', 'group'], when: function (f, x) { return x.traders.length > 0; } },
    { kind: 'tickets', rel: -14, name: 'Get your tickets', kicker: 'Tickets on sale', size: 'portrait', plat: ['fb', 'ig', 'story'], when: function (f) { return !!f.url; } },
    { kind: 'charity', rel: -10, name: 'Our good cause', kicker: 'In aid of ' , size: 'square', plat: ['fb', 'ig'], when: function (f) { return !!f.charity; } },
    { kind: 'week', rel: -7, name: 'One week to go', kicker: 'One week to go', size: 'portrait', plat: ['fb', 'ig', 'group', 'wa', 'nd'] },
    { kind: 'three', rel: -3, name: '3 days to go', kicker: '3 days to go', size: 'story', plat: ['story'] },
    { kind: 'tomorrow', rel: -1, name: 'Tomorrow', kicker: 'See you tomorrow', size: 'story', plat: ['story', 'fb'] },
    { kind: 'today', rel: 0, name: 'It’s today', kicker: 'It’s today', size: 'story', plat: ['story', 'fb'] },
    { kind: 'thanks', rel: 1, name: 'Thank you', kicker: '', size: null, plat: ['fb', 'ig'] }
  ];
  var SPOT = {
    traders: { name: 'Spotlight: our traders', kicker: 'Meet our traders', size: 'square' },
    acts: { name: 'Spotlight: an act', kicker: 'Coming to the stage', size: 'portrait' },
    sponsors: { name: 'Thank you to our sponsors', kicker: 'With thanks to our sponsors', size: 'portrait' },
    tickets: { name: 'Spotlight: tickets', kicker: 'Get your tickets', size: 'portrait' },
    volunteers: { name: 'Volunteers wanted', kicker: 'Volunteers wanted', size: 'square' },
    access: { name: 'Accessibility information', kicker: 'Everyone welcome', size: 'square' },
    custom: { name: 'Your own post', kicker: '', size: 'square' }
  };
  function def(it) { if (it.manual) return SPOT[it.kind] || SPOT.custom; for (var i = 0; i < AUTO.length; i++) if (AUTO[i].kind === it.kind) return AUTO[i]; return SPOT.custom; }

  // Suggested times are a rule of thumb (evenings in the week, mornings at the weekend), not taken from anyone's figures.
  function bestTime(date, kind) {
    if (kind === 'today') return '08:00'; if (kind === 'thanks') return '12:00'; if (kind === 'tomorrow') return '18:00';
    var d = dow(date); return (d === 0 || d === 6) ? '10:00' : '19:30';
  }

  function camp() { var p = M().api.pr(); if (!p.campaign || typeof p.campaign !== 'object') p.campaign = { items: [], email: true }; if (!Array.isArray(p.campaign.items)) p.campaign.items = []; return p.campaign; }
  function evDate() { var e = M().api.ev(); return /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') ? e.date : ''; }
  function evEnd() { var e = M().api.ev(), d = evDate(); return d ? addDays(d, Math.max(1, Number(e.days) || 1) - 1) : ''; }

  // ---- rebuild: posted items stay, unposted auto items follow the event, auto items that no longer apply go
  C.rebuild = function () {
    var c = camp(), d = evDate(), f = M().api.facts(), now = today(), changed = false;
    if (!d) return false;
    var keep = [], have = {};
    c.items.forEach(function (it) {
      if (it.manual) { keep.push(it); return; }
      var a = AUTO.filter(function (x) { return x.kind === it.kind; })[0];
      if (!a) { if (it.posted) keep.push(it); else changed = true; return; }
      if (it.posted) { keep.push(it); have[it.kind] = 1; return; }
      if (a.when && !a.when(f, C.extra)) { changed = true; return; }
      var want = place(a, d, now);
      if (!want) { changed = true; return; }
      if (it.date !== want || it.evd !== d) { it.date = want; it.time = bestTime(want, it.kind); it.evd = d; changed = true; }
      keep.push(it); have[it.kind] = 1;
    });
    AUTO.forEach(function (a) {
      if (have[a.kind] || (a.when && !a.when(f, C.extra))) return;
      var dt = place(a, d, now); if (!dt) return;
      // don't add a brand-new post for a date that has already gone
      keep.push({ id: 'a-' + a.kind, kind: a.kind, rel: a.rel, date: dt, time: bestTime(dt, a.kind), evd: d, posted: false }); changed = true;
    });
    keep.sort(function (x, y) { return (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')); });
    c.items = keep;
    return changed;
  };
  function place(a, d, now) {
    var end = addDays(d, Math.max(1, Number(M().api.ev().days) || 1) - 1);
    var dt = a.rel > 0 ? addDays(end, a.rel) : addDays(d, a.rel);
    if (dt >= now) return dt;
    // the announcement and the Facebook event still matter if the plan starts late, so they move to today
    if (a.kind === 'announce' && diff(d, now) >= 3) return now;
    if (a.kind === 'fbevent' && diff(d, now) >= 4) return addDays(now, 1);
    return '';
  }
  C.extra = { traders: [] };
  function loadTraders() {
    var A = window.SRAccount || {}, mk = M().market;
    if (!A.client || !mk || !mk.code) return Promise.resolve();
    return A.client.from('markets').select('id').eq('plan_id', M().planId).maybeSingle().then(function (r) {
      if (!r || !r.data) return;
      return A.client.from('market_applications').select('business,status').eq('market_id', r.data.id).eq('status', 'approved').limit(40).then(function (q) {
        C.extra.traders = ((q && q.data) || []).map(function (x) { return x.business; }).filter(Boolean);
      });
    }).catch(function () {});
  }

  // ---- captions
  function tag(f) { var t = '#' + String(f.title || '').replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join(''); return t.length > 2 && t.length < 40 ? t : ''; }
  function list(a) { return a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function when(f) { return (f.date ? f.date : '') + (f.time ? ', ' + f.time : '') + (f.venue ? ', at ' + f.venue : ''); }
  function caption(it) {
    if (it.caption) return it.caption;
    var f = M().api.facts(), on = list(f.on.map(function (o) { return o[1]; })), price = [f.priceMain].concat(f.priceLines).join(' · ');
    var tix = f.url ? '\n\nTickets: ' + f.url : '', cause = f.charity ? '\n\nAll in aid of ' + f.charity + '.' : '';
    var lu = String(f.lineup || '').split(/\s*[,\n]\s*/).filter(Boolean), tr = C.extra.traders;
    var t = {
      announce: 'Save the date! ' + f.title + ' is coming on ' + when(f) + '.' + (on ? '\n\n' + on + '.' : '') + '\n\n' + price + '.' + tix + cause + '\n\nShare this with anyone who’d love a day out.',
      fbevent: 'We’ve made a Facebook event for ' + f.title + '. Tap “Interested” or “Going” to get reminders, and invite your friends.\n\n' + when(f) + '.',
      whatson: 'Here’s what’s on at ' + f.title + ':\n\n' + (on || 'More news soon') + '.\n\n' + when(f) + '. ' + price + '.' + tix,
      lineup: 'The line-up for ' + f.title + ':\n\n' + lu.join('\n') + '\n\n' + when(f) + '.' + tix,
      traders: 'Meet our traders! Coming to ' + f.title + ':\n\n' + tr.join('\n') + '\n\n' + when(f) + '. Please give them a follow.',
      tickets: 'Tickets for ' + f.title + ' are on sale now. ' + price + '.' + tix + '\n\n' + when(f) + '.',
      charity: f.title + ' is raising money for ' + f.charity + '. Every ticket, stall and raffle prize helps.\n\n' + when(f) + '.' + tix,
      week: 'One week to go until ' + f.title + '!\n\n' + when(f) + '.' + (on ? '\n\n' + on + '.' : '') + '\n\n' + price + '.' + tix,
      three: 'Just 3 days until ' + f.title + '. ' + when(f) + '.' + tix,
      tomorrow: 'See you tomorrow at ' + f.title + '! ' + when(f) + '.' + (f.extra ? '\n\n' + f.extra + '.' : '') + '\n\n' + price + '.',
      today: 'It’s today! ' + f.title + (f.time ? ', ' + f.time : '') + (f.venue ? ', at ' + f.venue : '') + '. Come and join us.' + (f.extra ? '\n\n' + f.extra + '.' : ''),
      thanks: 'Thank you to everyone who came to ' + f.title + ', and to our volunteers, traders and sponsors.' + (f.charity ? ' We’ll share the total raised for ' + f.charity + ' soon.' : '') + '\n\nSee you next time!',
      s_traders: 'Meet our traders at ' + f.title + (tr.length ? ':\n\n' + tr.join('\n') : '. [Add the trader names here]') + '\n\n' + when(f) + '.',
      s_acts: 'Coming to ' + f.title + ': [act name]. [One line about them.]\n\n' + when(f) + '.' + tix,
      s_sponsors: 'A big thank you to our sponsors for supporting ' + f.title + ': [sponsor names].\n\n' + when(f) + '.',
      s_tickets: 'Have you got your tickets for ' + f.title + '? ' + price + '.' + tix + '\n\n' + when(f) + '.',
      s_volunteers: 'Can you spare a couple of hours on the day? We’re looking for volunteers to help at ' + f.title + '. Message us to find out more.\n\n' + when(f) + '.',
      s_access: 'Planning your visit to ' + f.title + '? [Accessible parking, toilets, quiet area, step-free routes, assistance dogs: add what you have.]\n\nAny questions, message us.',
      s_custom: '[Write your post here.]\n\n' + f.title + ', ' + when(f) + '.'
    };
    var body = t[it.manual ? 's_' + it.kind : it.kind] || t.s_custom;
    return body + (cause && it.kind !== 'charity' && it.kind !== 'thanks' && !it.manual && it.kind !== 'fbevent' && body.indexOf(f.charity) === -1 ? cause : '');
  }
  function hashtags(it) {
    var f = M().api.facts(), h = [tag(f)];
    var extra = { announce: '#SaveTheDate', whatson: '#WhatsOn', lineup: '#LiveMusic', traders: '#ShopLocal', tickets: '#Tickets', charity: '#Fundraising', week: '#OneWeekToGo', today: '#WhatsOnToday', volunteers: '#Volunteering' }[it.kind];
    if (extra) h.push(extra);
    return h.filter(Boolean).join(' ');
  }
  function steps(it) {
    var d = def(it), out = [];
    if (it.kind === 'fbevent') return ['On your Facebook page tap Events, then Create event.', 'Add the name, date, times and venue. Paste the caption into the description.', 'For the cover photo upload the Facebook event cover image (Download image below).', 'Publish, then invite your friends and share it to your page.'];
    if (it.kind === 'thanks') return ['Use your own best photo from the day (with permission from anyone clearly shown).', 'Post it on Facebook and Instagram with the caption.', 'Tag your traders, acts and sponsors if they have pages.'];
    (d.plat || ['fb', 'ig']).forEach(function (k) {
      if (k === 'fb') out.push('Facebook: Create post, Photo, choose the image, paste the caption.');
      if (k === 'ig') out.push('Instagram: tap +, Post, pick the image, paste the caption. Put the ticket link in your bio.');
      if (k === 'story') out.push('Stories: add the image to your story' + (M().api.facts().url ? ', then add a Link sticker with your ticket link.' : '.'));
      if (k === 'group') out.push('Facebook groups: share the post to local groups that allow event posts. Check each group’s rules first.');
      if (k === 'wa') out.push('WhatsApp: send the image and caption to your groups, or post it as your status.');
      if (k === 'nd') out.push('Nextdoor: Post, Event or General, add the image and caption.');
    });
    if (!d.plat) out = ['Facebook: Create post, Photo, choose the image, paste the caption.', 'Instagram: tap +, Post, pick the image, paste the caption.'];
    return out;
  }
  function facts(it) {
    var f = Object.assign({}, M().api.facts()), d = def(it);
    if (d.kicker) f.kicker = it.kind === 'charity' ? 'In aid of ' + f.charity : d.kicker;
    if (it.kind === 'traders' || (it.manual && it.kind === 'traders' && C.extra.traders.length)) {
      f.on = [['food', C.extra.traders.length + ' trader' + (C.extra.traders.length === 1 ? '' : 's') + ' booked']].concat(f.on.slice(0, 3));
    }
    return f;
  }
  function size(it) { return it.size || def(it).size; }

  // ---- access
  function mode() { var a = M().access; return (a === 'pilot' || a === 'campaign') ? 'live' : a === 'pack' ? 'pack' : 'free'; }
  function due(it) { return !it.posted && it.date < today(); }

  // ---- render
  C.draw = function (el) {
    C.el = el; var d = evDate();
    if (!d) { el.innerHTML = '<div class="pm-card"><h3>Posting plan</h3><p>Add your event date in your plan first. The posting plan is built from it.</p></div>'; return; }
    loadTraders().then(function () {
      if (C.rebuild() && mode() !== 'free') M().api.saveSoon();
      paint();
    });
  };
  function paint() {
    var el = C.el, c = camp(), m = mode(), items = c.items, now = today(), d = evDate();
    var h = '';
    if (m === 'free') return paintFree(el, items);
    var missed = items.filter(due), done = items.filter(function (x) { return x.posted; }).length;
    h += '<div class="pm-card"><h3>Posting plan</h3>';
    h += '<p class="pm-small">' + items.length + ' posts from now until the day after the event. ' + done + ' posted. Posts move by themselves if the date, times or line-up change; ones you’ve posted stay as they are.</p>';
    if (m === 'pack') h += '<div class="pm-acc">With the Promo Pack you get this plan to print. The <strong>Promo Campaign</strong> (£11 a month, VAT included) keeps it live: tick posts off, add spotlight posts, get a Monday email with the week’s posts and a nudge if one is missed.</div>';
    if (missed.length && m === 'live') h += '<div class="pm-acc" role="status"><span class="pm-err">' + missed.length + ' post' + (missed.length === 1 ? '' : 's') + ' missed:</span> ' + missed.map(function (x) { return esc(def(x).name) + ' (' + nice(x.date) + ')'; }).join(', ') + '. Post now, or tick it off if you’ve done it.</div>';
    h += '<div class="pm-row" style="margin:8px 0"><div class="pm-chips" role="group" aria-label="View"><button type="button" class="pm-chip" data-cv="list" aria-pressed="' + (C.view === 'list') + '">List</button><button type="button" class="pm-chip" data-cv="cal" aria-pressed="' + (C.view === 'cal') + '">Calendar</button></div>';
    if (m === 'live') h += '<button type="button" class="btn small" data-ca="ics">Add to my calendar (.ics)</button>';
    h += '<button type="button" class="btn small" data-ca="print">Print the plan</button></div>';
    if (m === 'live') h += '<label class="ck" style="display:flex;gap:8px;font-weight:400;font-size:14px"><input type="checkbox" id="cmEmail"' + (c.email !== false ? ' checked' : '') + '> Email me each Monday with that week’s posts, and if a post is missed</label>';
    h += '</div>';
    if (m === 'live') h += spotHtml();
    h += C.view === 'cal' ? calHtml(items) : listHtml(items, m);
    el.innerHTML = h; wire();
  }
  function paintFree(el, items) {
    var show = items.slice(0, 2);
    el.innerHTML = '<div class="pm-card"><h3>Posting plan</h3><p>A ready-made plan of ' + items.length + ' posts for this event, from “Save the date” to “Thank you”, each with its image, caption, hashtags, best time and how to post it.</p>' +
      show.map(function (it) { return '<p><strong>' + nice(it.date) + '</strong> · ' + esc(def(it).name) + '</p>'; }).join('') +
      (items.length > 2 ? '<p class="pm-small">and ' + (items.length - 2) + ' more posts.</p>' : '') +
      '<div class="pm-acc">' + (window.SRAccount && window.SRAccount.user ? 'The live posting plan comes with the <strong>Promo Campaign</strong> (£11 a month, VAT included, all your events). The <strong>Promo Pack</strong> (£14.99 per event) includes a printable copy. <a href="mailto:hello@beshowready.co.uk?subject=Promo%20Campaign">Ask us to switch it on</a>.' : '<button type="button" class="btn small primary" data-demo-signup>Sign up free</button> to see the full plan.') + '</div></div>';
  }
  function spotHtml() {
    var d = evDate(), now = today();
    return '<details class="pm-card"><summary><strong>Add a spotlight post</strong></summary><p class="pm-small">Push one thing on the date you choose: traders, an act, sponsors, tickets, volunteers or accessibility.</p>' +
      '<label for="cmKind">Post</label><select id="cmKind">' + Object.keys(SPOT).map(function (k) { return '<option value="' + k + '">' + esc(SPOT[k].name) + '</option>'; }).join('') + '</select>' +
      '<label for="cmDate">Date</label><input type="date" id="cmDate" min="' + now + '" max="' + addDays(evEnd() || d, 1) + '" value="' + (now < d ? addDays(now, 1) : now) + '" style="min-height:44px;border:1px solid var(--line);border-radius:12px;padding:8px 12px;font:inherit">' +
      '<p><button type="button" class="btn small primary" data-ca="addSpot">Add to the plan</button> <span class="pm-small" id="cmSpotMsg" aria-live="polite"></span></p></details>';
  }
  function listHtml(items, m) {
    var now = today(), h = '', wk = '';
    items.forEach(function (it, i) {
      var d = def(it), k = weekOf(it.date);
      if (k !== wk) { wk = k; h += '<h4 style="margin:16px 0 6px">' + esc(weekLabel(it.date)) + '</h4>'; }
      var open = !!C.open[it.id], late = due(it);
      h += '<div class="pm-card" data-item="' + esc(it.id) + '" style="' + (it.posted ? 'opacity:.7;' : '') + (late ? 'border-color:#B3261E;' : '') + '">' +
        '<div class="pm-row" style="justify-content:space-between"><div><strong>' + nice(it.date) + (it.time ? ', ' + esc(it.time) : '') + '</strong> · ' + esc(d.name) +
        '<div class="pm-small">' + (d.plat || ['fb', 'ig']).map(function (p) { return PLAT[p]; }).join(', ') + (it.time ? ' · suggested time' : '') + '</div></div>' +
        (m === 'live' ? '<label class="ck" style="display:flex;gap:6px;align-items:center;font-weight:700;white-space:nowrap"><input type="checkbox" data-ca="posted"' + (it.posted ? ' checked' : '') + '> ' + (it.posted ? 'Posted' : 'To do') + '</label>' : '') + '</div>' +
        '<p><button type="button" class="btn small" data-ca="toggle" aria-expanded="' + open + '">' + (open ? 'Hide the post' : 'Show the post') + '</button>' +
        (m === 'live' && it.manual ? ' <button type="button" class="btn small" data-ca="del">Remove</button>' : '') + '</p>' +
        (open ? itemBody(it, m) : '') + '</div>';
    });
    return h || '<p class="pm-small">Nothing left to post for this event.</p>';
  }
  function itemBody(it, m) {
    var sz = size(it), P = window.SRPromo;
    return '<div class="pm-wrap" style="grid-template-columns:minmax(0,1fr) minmax(160px,240px)"><div>' +
      '<label>Caption</label>' + (m === 'live' ? '<textarea data-ca="cap" maxlength="2000" style="min-height:140px">' + esc(caption(it)) + '</textarea>' : '<div class="pm-cap">' + esc(caption(it)) + '</div>') +
      '<p class="pm-small">' + esc(hashtags(it)) + '</p>' +
      '<p><button type="button" class="btn small" data-ca="copy">Copy caption and hashtags</button>' + (m === 'live' && it.caption ? ' <button type="button" class="btn small" data-ca="resetCap">Go back to the suggested caption</button>' : '') + ' <span class="pm-small" data-msg aria-live="polite"></span></p>' +
      '<details><summary><strong>How to post it</strong></summary><ol class="pm-small">' + steps(it).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></details></div>' +
      '<div>' + (sz ? '<canvas data-thumb style="width:100%;height:auto;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.15)"></canvas><p class="pm-small">' + esc(P.SIZES[sz][2]) + '</p><p><button type="button" class="btn small primary" data-ca="img">Download image</button></p>' : '<p class="pm-small">Use your own photo from the day.</p>') + '</div></div>';
  }
  function weekOf(s) { var d = new Date(s + 'T12:00:00Z'), w = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - w); return iso(d); }
  function weekLabel(s) {
    var mon = weekOf(s), cur = weekOf(today());
    if (mon === cur) return 'This week'; if (mon === addDays(cur, 7)) return 'Next week';
    var d = new Date(mon + 'T12:00:00Z'); return 'Week of ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
  }
  function calHtml(items) {
    var first = items.length ? items[0].date : today(), last = items.length ? items[items.length - 1].date : today();
    var m = C.month || first.slice(0, 7); if (m < first.slice(0, 7)) m = first.slice(0, 7); if (m > last.slice(0, 7)) m = last.slice(0, 7); C.month = m;
    var y = +m.slice(0, 4), mo = +m.slice(5, 7) - 1, start = new Date(Date.UTC(y, mo, 1)), lead = (start.getUTCDay() + 6) % 7, n = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    var prev = iso(new Date(Date.UTC(y, mo - 1, 1))).slice(0, 7), next = iso(new Date(Date.UTC(y, mo + 1, 1))).slice(0, 7), ed = evDate();
    var h = '<div class="pm-card"><div class="pm-row" style="justify-content:space-between"><button type="button" class="btn small" data-cm="' + prev + '"' + (prev < first.slice(0, 7) ? ' disabled' : '') + ' aria-label="Previous month">‹</button><strong>' + MONTHS[mo] + ' ' + y + '</strong><button type="button" class="btn small" data-cm="' + next + '"' + (next > last.slice(0, 7) ? ' disabled' : '') + ' aria-label="Next month">›</button></div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-top:8px" role="grid">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<div class="pm-small" style="text-align:center;font-weight:700">' + x + '</div>'; }).join('');
    for (var i = 0; i < lead; i++) h += '<div></div>';
    for (var dd = 1; dd <= n; dd++) {
      var ds = m + '-' + ('0' + dd).slice(-2), its = items.filter(function (x) { return x.date === ds; });
      h += '<div style="min-height:64px;border:1px solid var(--line);border-radius:8px;padding:4px;font-size:12px;' + (ds === ed ? 'background:var(--surface-2);' : '') + (ds === today() ? 'box-shadow:0 0 0 2px var(--brand);' : '') + '"><div style="font-weight:700">' + dd + (ds === ed ? ' ★' : '') + '</div>' +
        its.map(function (x) { return '<button type="button" data-goitem="' + esc(x.id) + '" style="display:block;width:100%;text-align:left;border:0;border-radius:6px;padding:2px 4px;margin-top:2px;font:inherit;font-size:11px;cursor:pointer;background:' + (x.posted ? '#DDEBE3' : due(x) ? '#F9DEDC' : 'var(--brand)') + ';color:' + (x.posted || due(x) ? 'var(--ink)' : 'var(--brand-ink,#fff)') + '">' + esc(def(x).name) + '</button>'; }).join('') + '</div>';
    }
    return h + '</div><p class="pm-small">★ is your event day. Tap a post to open it in the list.</p></div>';
  }

  function find(id) { return camp().items.filter(function (x) { return x.id === id; })[0]; }
  function renderItem(it) { var c = document.createElement('canvas'); window.SRPromo.draw(c, facts(it), M().api.styleId(), size(it), M().api.drawOpts(1)); return c; }
  function thumbs() {
    var P = window.SRPromo;
    P.loadFonts(P.fontsFor(M().api.styleId(), M().api.fontOpt())).then(function () {
      C.el.querySelectorAll('[data-item]').forEach(function (box) {
        var cv = box.querySelector('[data-thumb]'); if (!cv) return; var it = find(box.getAttribute('data-item')); if (!it) return;
        var big = renderItem(it); cv.width = Math.round(big.width / 4); cv.height = Math.round(big.height / 4); cv.getContext('2d').drawImage(big, 0, 0, cv.width, cv.height);
      });
    });
  }
  function wire() {
    var root = C.el, c = camp();
    thumbs();
    var em = document.getElementById('cmEmail'); if (em) em.addEventListener('change', function () { c.email = em.checked; M().api.saveSoon(); });
    root.querySelectorAll('textarea[data-ca=cap]').forEach(function (t) {
      t.addEventListener('input', function () { var it = find(t.closest('[data-item]').getAttribute('data-item')); if (!it) return; it.caption = t.value; M().api.saveSoon(); });
    });
    root.addEventListener('change', function (e) {
      var t = e.target; if (t.getAttribute('data-ca') !== 'posted') return;
      var it = find(t.closest('[data-item]').getAttribute('data-item')); if (!it) return;
      it.posted = t.checked; if (t.checked) it.postedAt = new Date().toISOString(); else delete it.postedAt;
      M().api.saveSoon(); paint();
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      if (b.hasAttribute('data-cv')) { C.view = b.getAttribute('data-cv'); paint(); return; }
      if (b.hasAttribute('data-cm')) { C.month = b.getAttribute('data-cm'); paint(); return; }
      if (b.hasAttribute('data-goitem')) { var gid = b.getAttribute('data-goitem'); C.view = 'list'; C.open[gid] = true; paint(); var el = root.querySelector('[data-item="' + gid + '"]'); if (el) el.scrollIntoView({ block: 'center' }); return; }
      var a = b.getAttribute('data-ca'), box = b.closest('[data-item]'), it = box ? find(box.getAttribute('data-item')) : null;
      if (a === 'toggle' && it) { C.open[it.id] = !C.open[it.id]; paint(); }
      else if (a === 'del' && it) { c.items = c.items.filter(function (x) { return x !== it; }); M().api.saveSoon(); paint(); }
      else if (a === 'resetCap' && it) { delete it.caption; M().api.saveSoon(); paint(); }
      else if (a === 'copy' && it) {
        var txt = caption(it) + '\n\n' + hashtags(it), msg = box.querySelector('[data-msg]');
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { msg.textContent = 'Copied.'; }, function () { msg.textContent = 'Select the text and copy it.'; });
      }
      else if (a === 'img' && it) {
        b.disabled = true; var P = window.SRPromo;
        P.loadFonts(P.fontsFor(M().api.styleId(), M().api.fontOpt())).then(function () { return P.toBlob(renderItem(it)); }).then(function (bl) { M().api.save(bl, fileName(it) + '.png'); b.disabled = false; }, function () { b.disabled = false; });
      }
      else if (a === 'addSpot') {
        var k = document.getElementById('cmKind').value, dt = document.getElementById('cmDate').value, sm = document.getElementById('cmSpotMsg');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dt) || dt < today()) { sm.textContent = 'Choose a date from today onwards.'; return; }
        var id = 's-' + Date.now().toString(36); c.items.push({ id: id, kind: k, manual: true, date: dt, time: bestTime(dt, k), posted: false });
        c.items.sort(function (x, y) { return (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')); });
        C.open[id] = true; M().api.saveSoon(); paint();
      }
      else if (a === 'ics') M().api.save(new Blob([ics()], { type: 'text/calendar' }), fileName({ kind: 'posting-plan' }) + '.ics');
      else if (a === 'print') printPlan();
    });
  }
  function fileName(it) { return (String(M().api.facts().title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event') + '-' + String(it.kind).replace(/[^a-z0-9-]/g, ''); }

  // ---- calendar file (times are UK local; no time zone block, so calendars use the phone's own time)
  function icsEsc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) { var out = [], s = line; while (s.length > 74) { out.push(s.slice(0, 74)); s = ' ' + s.slice(74); } out.push(s); return out.join('\r\n'); }
  function ics() {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'), f = M().api.facts(), L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ShowReady//Posting plan//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + icsEsc('Posts: ' + f.title)];
    camp().items.filter(function (x) { return !x.posted; }).forEach(function (it) {
      var t = (it.time || '10:00').replace(':', ''), ds = it.date.replace(/-/g, ''), end = String(+t.slice(0, 2) * 60 + +t.slice(2) + 15);
      var eh = ('0' + Math.floor(end / 60)).slice(-2), emn = ('0' + (end % 60)).slice(-2);
      [ 'BEGIN:VEVENT', 'UID:' + it.id + '-' + (M().planId || 'plan') + '@beshowready.co.uk', 'DTSTAMP:' + stamp, 'DTSTART:' + ds + 'T' + t + '00', 'DTEND:' + ds + 'T' + eh + emn + '00',
        'SUMMARY:' + icsEsc('Post: ' + def(it).name + ' (' + f.title + ')'),
        'DESCRIPTION:' + icsEsc(caption(it) + '\n\n' + hashtags(it) + '\n\nOpen the post: https://beshowready.co.uk/app/?tab=promote&view=campaign'),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Time to post: ' + def(it).name), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT' ].forEach(function (x) { L.push(fold(x)); });
    });
    L.push('END:VCALENDAR'); return L.join('\r\n') + '\r\n';
  }
  function printPlan() {
    var f = M().api.facts(), w = window.open('', '_blank'); if (!w) return;
    var rows = camp().items.map(function (it) { return '<tr><td>' + nice(it.date) + (it.time ? '<br>' + esc(it.time) : '') + '</td><td><strong>' + esc(def(it).name) + '</strong><br><small>' + (def(it).plat || ['fb', 'ig']).map(function (p) { return PLAT[p]; }).join(', ') + '</small></td><td style="white-space:pre-wrap">' + esc(caption(it)) + '\n\n' + esc(hashtags(it)) + '</td><td>☐</td></tr>'; }).join('');
    w.document.write('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Posting plan: ' + esc(f.title) + '</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:6px;vertical-align:top;text-align:left}th{background:#eee}h1{font-size:20px}@media print{tr{page-break-inside:avoid}}</style></head><body>' +
      '<h1>Posting plan: ' + esc(f.title) + '</h1><p>' + esc(when(f)) + '. Suggested times are a rule of thumb: weekday evenings and weekend mornings. Images are in the Promote tab of ShowReady.</p><table><thead><tr><th>When</th><th>Post</th><th>Caption</th><th>Done</th></tr></thead><tbody>' + rows + '</tbody></table><p><small>Made with ShowReady · beshowready.co.uk</small></p><script>window.onload=function(){window.print()}<\/script></body></html>');
    w.document.close();
  }
  C._test = { caption: caption, ics: ics, AUTO: AUTO, place: place, bestTime: bestTime };
})();

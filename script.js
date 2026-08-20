(function () {
  'use strict';

  var PLAY = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#8ecdfb"><polygon points="8,4 20,12 8,20"></polygon></svg>';
  var PAUSE = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#8ecdfb"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
  var MUTE = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8ecdfb" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
  var UNMUTE = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8ecdfb" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 010 7.07"></path><path d="M19.07 4.93a10 10 0 010 14.14"></path></svg>';
  var TRACKS = [
    { name: 'Love Sick', url: 'https://soundcloud.com/phoenixrox/love-sick-pt-1', art: 'assets/love-sick-album-art.jpg' },
    { name: 'Light Side of the Moon', url: 'https://soundcloud.com/phoenixrox/light-side-of-the-moon-phoenix' },
    { name: 'Stars & Pipes', url: '', clip: true },
    { name: 'Welcome to the Zoo', url: 'https://soundcloud.com/phoenixrox/welcome-to-the-zoo' },
    { name: 'I am Your Creative Avenger', url: 'https://soundcloud.com/americandreamingmagazine/im-your-creative-avenger' },
    { name: 'Whaaaat!', url: 'https://soundcloud.com/phoenixrox/whaaaa', art: 'assets/whaat-album-art.jpg' },
    { name: 'Do That Shit Then', url: 'https://soundcloud.com/phoenixrox/do-that-then' }
  ];
  var PAGES = { about: 'About', music: 'Music by', cv: 'Experience Work by', booking: 'Contact' };
  var NAV = {
    home: [['About','about'],['Music','music'],['CV','cv'],['Contact','booking']],
    about: [['Home','home'],['Music','music'],['CV','cv'],['Contact','booking']],
    music: [['Home','home'],['About','about'],['CV','cv'],['Contact','booking']],
    cv: [['Home','home'],['About','about'],['Music','music'],['Contact','booking']],
    booking: [['About','about'],['Music','music'],['CV','cv']]
  };
  var state = { page: 'home', track: TRACKS[1], playing: false, duration: 0, time: '0:00', progress: 0, muted: false };
  var el = {}, sc = null, player = null, playerId = null, endTimer = null;

  document.addEventListener('DOMContentLoaded', init);
  function init() {
    el.black = document.getElementById('bg-black-overlay');
    el.image = document.getElementById('bg-image');
    el.plain = document.getElementById('bg-image-plain');
    el.stack = document.getElementById('bg-image-stack');
    el.overlay = document.getElementById('bg-image-overlay');
    el.video = document.getElementById('bg-video');
    el.frame = document.getElementById('bg-vimeo-iframe');
    el.mute = document.getElementById('bg-mute-btn');
    el.prefix = document.getElementById('prefix');
    el.content = document.getElementById('content');
    el.nav = document.getElementById('nav-list');
    if (el.mute) { el.mute.innerHTML = UNMUTE; el.mute.addEventListener('click', toggleMute); }
    initSoundCloud();
    render();
  }
  function initSoundCloud() {
    if (sc || !window.SC || !window.SC.Widget) return setTimeout(initSoundCloud, 300);
    var frame = document.getElementById('sc-iframe'); if (!frame) return;
    sc = SC.Widget(frame);
    sc.bind(SC.Widget.Events.READY, function () { sc.getDuration(function (d) { state.duration = d; }); });
    sc.bind(SC.Widget.Events.PLAY_PROGRESS, function (d) { if (state.duration) { state.progress = d.currentPosition / state.duration * 100; state.time = clock(d.currentPosition); updatePlayer(); } });
    sc.bind(SC.Widget.Events.FINISH, function () { state.playing = false; updatePlayer(); });
  }
  function clock(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function stopMusic() { if (sc) sc.pause(); state.playing = false; updatePlayer(); }
  function toggleMusic() { if (!sc) return; if (state.playing) sc.pause(); else sc.play(); state.playing = !state.playing; updatePlayer(); }
  function chooseTrack(track) {
    if (track.clip) { playStarsPipes(); return; }
    if (!sc || track === state.track) return;
    sc.load(track.url, { auto_play: true, callback: function () { sc.getDuration(function (d) { state.duration = d; }); } });
    state.track = track; state.playing = true; state.progress = 0; state.time = '0:00'; render();
  }
  function updatePlayer() {
    var button = document.getElementById('play-btn'), fill = document.getElementById('progress-fill'), time = document.getElementById('time-label');
    if (button) button.innerHTML = state.playing ? PAUSE : PLAY;
    if (fill) fill.style.width = state.progress + '%';
    if (time) time.textContent = state.time;
  }
  function seek(e) { if (!sc || !state.duration) return; var r = e.currentTarget.getBoundingClientRect(); sc.seekTo((e.clientX - r.left) / r.width * state.duration); }

  function clearEndTimer() { if (endTimer) { clearTimeout(endTimer); endTimer = null; } }
  function hideImage() { if (el.image) { el.image.classList.remove('active'); el.image.style.opacity = '0'; } }
  function hideVideo() { if (el.video) { el.video.classList.remove('active'); el.video.style.opacity = '0'; } if (el.mute) el.mute.classList.remove('active'); }
  function showStack(src) {
    stopMusic(); clearEndTimer(); hideVideo();
    el.stack.style.display = 'flex'; el.plain.style.display = 'none';
    [1,2,3].forEach(function (n) { document.getElementById('stack-item-' + n).style.backgroundImage = "url('" + src + "')"; });
    el.overlay.style.background = 'rgba(0,0,0,.65)'; el.image.classList.add('active'); el.image.style.opacity = '0'; requestAnimationFrame(function () { el.image.style.opacity = '1'; });
  }
  function showImage(src, size, overlay) {
    stopMusic(); clearEndTimer(); hideVideo(); el.stack.style.display = 'none'; el.plain.style.display = 'block';
    el.plain.style.backgroundImage = "url('" + src + "')"; el.plain.style.backgroundSize = size || 'contain'; el.plain.style.backgroundPosition = size === 'cover' ? 'center' : 'center right';
    el.overlay.style.background = 'rgba(0,0,0,' + (overlay == null ? .65 : overlay) + ')'; el.image.classList.add('active'); el.image.style.opacity = '0'; requestAnimationFrame(function () { el.image.style.opacity = '1'; });
  }
  function playStarsPipes(e) { if (e) e.preventDefault(); playVideo('10589479', 0, 42, false); }
  function playVideo(id, start, end, loop) {
    stopMusic(); hideImage(); clearEndTimer(); state.muted = false; if (el.mute) el.mute.innerHTML = UNMUTE;
    function startClip() {
      var seekTo = start ? player.setCurrentTime(start).catch(function () {}) : Promise.resolve();
      Promise.race([seekTo, new Promise(function (r) { setTimeout(r, 800); })]).then(function () { player.setVolume(0); var p = player.play(); Promise.resolve(p).catch(function () {}).then(function () { if (!state.muted) player.setVolume(.4); }); });
      endTimer = setTimeout(function () {
        if (loop) playVideo(id, start, end, true);
        else { player.pause().catch(function () {}); }
      }, Math.max(0, (end - start) * 1000));
    }
    if (player && playerId === id) startClip();
    else {
      if (player) player.loadVideo(id).then(function () { playerId = id; startClip(); });
      else {
        el.frame.src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&muted=0&controls=0&dnt=1&background=0';
        waitForVimeo(function () { playerId = id; startClip(); });
      }
    }
    el.video.classList.add('active'); el.video.style.opacity = '0'; if (el.mute) el.mute.classList.add('active'); requestAnimationFrame(function () { el.video.style.opacity = '1'; });
  }
  function waitForVimeo(done) { if (!window.Vimeo || !window.Vimeo.Player) return setTimeout(function () { waitForVimeo(done); }, 250); player = new Vimeo.Player(el.frame); player.ready().then(done); }
  function toggleMute() { if (!player) return; state.muted = !state.muted; player.setVolume(state.muted ? 0 : .4); el.mute.innerHTML = state.muted ? MUTE : UNMUTE; }

  function navigate(page) {
    if (page === state.page) return;
    stopMusic();
    if (state.page === 'cv' && page !== 'cv') { clearEndTimer(); if (player) player.pause().catch(function () {}); hideVideo(); hideImage(); }
    fadeEyebrow(function () { state.page = page; if (page === 'cv' && state.page !== 'cv' && !player) playReel(); render(); });
  }
  function fadeEyebrow(done) { if (!el.prefix) return done(); el.prefix.style.transition = 'opacity .45s ease'; el.prefix.style.opacity = '0'; setTimeout(function () { done(); el.prefix.style.opacity = '1'; }, 450); }
  function playReel() { playVideo('90561744', 0, 75, true); }

  function render() { renderHeader(); renderNav(); el.content.innerHTML = state.page === 'about' ? aboutHTML() : state.page === 'music' ? musicHTML() : state.page === 'cv' ? cvHTML() : ''; bind(); }
  function renderHeader() { el.prefix.textContent = PAGES[state.page] || 'Home'; el.prefix.style.visibility = state.page === 'home' ? 'hidden' : 'visible'; }
  function renderNav() { el.nav.innerHTML = (NAV[state.page] || NAV.home).map(function (i) { return '<li><button type="button" data-page="' + i[1] + '">' + i[0] + '</button></li>'; }).join(''); el.nav.querySelectorAll('[data-page]').forEach(function (b) { b.addEventListener('click', function () { navigate(b.getAttribute('data-page')); }); }); }
  function aboutHTML() { return '<div class="about-block"><p>Phoenix engages audiences by crafting unique listening experiences by blending beats and harmonies, mixing genres; conveying a bevy of feelings and moods. Incorporating user experience design methods Phoenix stands out and leaves people asking &ldquo;Oooh, what song is this?!&rdquo;</p><p>Phoenix is currently working on a book with her music mentor, <a href="https://www.kennedy-center.org/artists/l/lo-lz/adrian-loving/" target="_blank" rel="noopener">Adrian Loving</a> and legendary celebrity hair stylist Diamond Ken.</p></div>'; }
  function musicHTML() {
    var art = state.track.art ? '<img class="album-art album-art--fade" src="' + state.track.art + '" alt="' + state.track.name + ' album art">' : '';
    var tracks = TRACKS.map(function (t) { return '<li><button type="button" class="' + (t === state.track ? 'active' : '') + '" data-track="' + t.name + '">' + t.name + '</button></li>'; }).join('');
    return '<div class="music-block">' + art + '<div class="player-row"><button type="button" class="play-btn" id="play-btn">' + (state.playing ? PAUSE : PLAY) + '</button><div class="progress-track" id="progress-track"><div class="progress-fill" id="progress-fill" style="width:' + state.progress + '%"></div></div><span class="time-label" id="time-label">' + state.time + '</span></div><ul class="track-list">' + tracks + '</ul></div>';
  }
  function cvHTML() { return '<div class="cv-block"><div class="cv-col"><span class="cv-label">Work</span><ul><li><a href="#" data-action="paradise">Music Director, Paradise City Documentary</a></li><li><a href="#" data-action="american">Music Director, American Dreaming Magazine</a></li><li><a href="#" data-action="forgiato">Forgiato Commercial</a></li><li><a href="#" data-action="kami">Music Director, Kami Designs</a></li><li><a href="#" data-action="stars">Curator, Stars &amp; Pipes: An Exploration of Drugs in America</a></li><li>DC Commission on the Arts &amp; Humanities, grant recipient</li></ul><span class="cv-label">Media</span><ul><li>DC Modern Luxury Magazine</li><li>American Dreaming Magazine</li></ul></div><div class="cv-col"><span class="cv-label">Performance</span><ul><li>Warner Music Group &amp; Six Flags</li><li>Hello Stranger w/ Mind Motion</li><li>The Smugger</li><li><a href="#" data-action="mighty">Mighty Aphrodite</a></li><li>Recess DC</li><li>Oakland Unified Public School District</li><li>DC Fashion Council</li><li>The Pink Line Project</li></ul><span class="cv-label">Resident Music Selector</span><ul><li><a href="#" data-action="guess">Guess Clothing Brand</a></li><li>The Smithsonian Textile Museum</li><li><a href="#" data-action="lamont">Lamont Bishop Gallery</a></li><li>Vince Gray for (DC) Mayor Campaign</li><li>Ben&rsquo;s Next Door</li></ul></div></div>'; }
  function bind() {
    if (state.page === 'music') { document.getElementById('play-btn').addEventListener('click', toggleMusic); document.getElementById('progress-track').addEventListener('click', seek); el.content.querySelectorAll('[data-track]').forEach(function (b) { b.addEventListener('click', function () { chooseTrack(TRACKS.filter(function (t) { return t.name === b.getAttribute('data-track'); })[0]); }); }); }
    if (state.page === 'cv') {
      var actions = { paradise: function () { playVideo('33052855',11,56,true); }, american: function () { showImage('assets/american-dreaming.png','cover',.72); }, forgiato: function () { playVideo('39578046',81,114,true); }, kami: function () { playVideo('90561744',0,92,true); }, stars: playStarsPipes, mighty: function () { showStack('assets/mighty-aphrodite.png'); }, guess: function () { showStack('assets/guess-dj.jpg'); }, lamont: function () { showImage('assets/lamont-bishop.png','contain',.65); } };
      Object.keys(actions).forEach(function (name) { var target = el.content.querySelector('[data-action="' + name + '"]'); if (target) target.addEventListener('click', function (e) { e.preventDefault(); actions[name](); }); });
    }
    var art = el.content.querySelector('.album-art--fade'); if (art) requestAnimationFrame(function () { art.classList.add('is-visible'); });
  }
})();

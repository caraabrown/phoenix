(function () {
  'use strict';

  var PLAY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#8ecdfb"><polygon points="8,4 20,12 8,20"></polygon></svg>';
  var PAUSE_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#8ecdfb"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
  var MUTE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8ecdfb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
  var UNMUTE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8ecdfb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 010 7.07"></path><path d="M19.07 4.93a10 10 0 010 14.14"></path></svg>';
  var SMS_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f0e6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>';
  var MAIL_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f0e6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><polyline points="22,6 12,13 2,6"></polyline></svg>';
  var IG_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f0e6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>';

  var TRACKS = [
    { name: 'Love Sick', url: 'https://soundcloud.com/phoenixrox/love-sick-pt-1' },
    { name: 'Light Side of the Moon', url: 'https://soundcloud.com/phoenixrox/light-side-of-the-moon-phoenix' },
    { name: 'Stars & Pipes', url: '' },
    { name: 'Welcome to the Zoo', url: 'https://soundcloud.com/phoenixrox/welcome-to-the-zoo' },
    { name: 'I am Your Creative Avenger', url: 'https://soundcloud.com/americandreamingmagazine/im-your-creative-avenger' },
    { name: 'Whaaaat!', url: 'https://soundcloud.com/phoenixrox/whaaaa' },
    { name: 'Do That Shit Then', url: 'https://soundcloud.com/phoenixrox/do-that-then' }
  ];

  var BG_PAGES = { music: 'assets/bg-music.jpg', about: 'assets/bg-about.png' };
  var PREFIXES = { about: 'About', music: 'Music by', cv: 'Experience Work by', booking: 'Contact' };
  var NAV_MAP = {
    home: [['About', 'about'], ['Music', 'music'], ['CV', 'cv'], ['Contact', 'booking']],
    about: [['Home', 'home'], ['Music', 'music'], ['CV', 'cv'], ['Contact', 'booking']],
    music: [['Home', 'home'], ['About', 'about'], ['CV', 'cv'], ['Contact', 'booking']],
    cv: [['Home', 'home'], ['About', 'about'], ['Music', 'music'], ['Contact', 'booking']],
    booking: [['About', 'about'], ['Music', 'music'], ['CV', 'cv']]
  };
  var CONTENT_FADE_MS = 2000;

  var state = { page: 'home', transitioning: false, scPlaying: false, scProgress: 0, scTime: '0:00', scDuration: 0, currentTrackUrl: TRACKS[1].url, bgMuted: false };
  var el = {};
  var scWidget = null, scInitAttempts = 0;
  var bgPlayer = null, bgInitAttempts = 0, bgCurrentId = null, reel = null, reelIndex = 0;
  var bgAdvanceTimer = null;
  var contactAudioTimer = null, contactAudioFadeRAF = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el.bgBlackOverlay = document.getElementById('bg-black-overlay');
    el.bgImage = document.getElementById('bg-image');
    el.bgImagePlain = document.getElementById('bg-image-plain');
    el.bgImageStack = document.getElementById('bg-image-stack');
    el.bgImageOverlay = document.getElementById('bg-image-overlay');
    el.bgVideo = document.getElementById('bg-video');
    el.bgVimeoIframe = document.getElementById('bg-vimeo-iframe');
    el.bgMuteBtn = document.getElementById('bg-mute-btn');
    el.prefix = document.getElementById('prefix');
    el.content = document.getElementById('content');
    el.nav = document.getElementById('nav-list');
    el.pageFade = document.getElementById('page-fade');

    el.bgMuteBtn.innerHTML = UNMUTE_ICON;
    el.bgMuteBtn.addEventListener('click', toggleBgMute);

    initSC();
    renderPage();
  }

  function fmt(ms) {
    var t = Math.floor(ms / 1000), m = Math.floor(t / 60), s = t % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function initSC() {
    if (scWidget || scInitAttempts > 20) return;
    scInitAttempts++;
    if (!window.SC || !window.SC.Widget) { setTimeout(initSC, 500); return; }
    var iframe = document.getElementById('sc-iframe');
    if (!iframe) { setTimeout(initSC, 500); return; }
    try {
      scWidget = SC.Widget(iframe);
      scWidget.bind(SC.Widget.Events.READY, function () {
        scWidget.getDuration(function (d) { state.scDuration = d; });
      });
      scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function (data) {
        if (state.scDuration) {
          state.scProgress = (data.currentPosition / state.scDuration) * 100;
          state.scTime = fmt(data.currentPosition);
          updatePlayerUI();
        }
      });
      scWidget.bind(SC.Widget.Events.FINISH, function () { state.scPlaying = false; updatePlayerUI(); });
    } catch (e) {
      scWidget = null;
      setTimeout(initSC, 1000);
    }
  }

  function pauseMainPlayer() {
    if (scWidget && state.scPlaying) { scWidget.pause(); state.scPlaying = false; updatePlayerUI(); }
  }

  function togglePlay() {
    if (!scWidget) return;
    if (state.scPlaying) scWidget.pause(); else scWidget.play();
    state.scPlaying = !state.scPlaying;
    updatePlayerUI();
  }

  function seekTo(e) {
    if (!scWidget || !state.scDuration) return;
    var rect = e.currentTarget.getBoundingClientRect();
    scWidget.seekTo(((e.clientX - rect.left) / rect.width) * state.scDuration);
  }

  function loadTrack(track) {
    if (track.name === 'Stars & Pipes') { showStarsAndPipesImage(); return; }
    if (!track.url || track.url === state.currentTrackUrl || !scWidget) return;
    scWidget.load(track.url, { auto_play: true, callback: function () {
      scWidget.getDuration(function (d) { state.scDuration = d; });
    } });
    state.currentTrackUrl = track.url;
    state.scPlaying = true;
    state.scProgress = 0;
    state.scTime = '0:00';
    el.content.innerHTML = musicHTML();
    attachPageListeners();
  }

  function updatePlayerUI() {
    var btn = document.getElementById('play-btn');
    if (!btn) return;
    btn.innerHTML = state.scPlaying ? PAUSE_ICON : PLAY_ICON;
    var fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = state.scProgress + '%';
    var time = document.getElementById('time-label');
    if (time) time.textContent = state.scTime;
  }

  function playContactAudio() {
    var audio = document.getElementById('contact-audio');
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 1;
    audio.play().catch(function () {});
    if (contactAudioTimer) clearTimeout(contactAudioTimer);
    if (contactAudioFadeRAF) cancelAnimationFrame(contactAudioFadeRAF);
    var totalMs = 29000, fadeMs = 2000;
    contactAudioTimer = setTimeout(function () {
      var startVol = audio.volume;
      var startTime = performance.now();
      function step(now) {
        var t = Math.min(1, (now - startTime) / fadeMs);
        audio.volume = startVol * (1 - t);
        if (t < 1) contactAudioFadeRAF = requestAnimationFrame(step);
        else audio.pause();
      }
      contactAudioFadeRAF = requestAnimationFrame(step);
    }, totalMs - fadeMs);
  }

  function stopStarsAndPipesAudio() {
    var audio = document.getElementById('stars-pipes-audio');
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }

  function clearBgAdvanceTimer() { if (bgAdvanceTimer) { clearTimeout(bgAdvanceTimer); bgAdvanceTimer = null; } }

  function hideBgImage() {
    el.bgImage.classList.remove('active');
    el.bgImage.style.opacity = '0';
  }
  function hideBgVideo() {
    el.bgVideo.classList.remove('active');
    el.bgVideo.style.opacity = '0';
    el.bgMuteBtn.classList.remove('active');
  }
  function resetBgVideoState() {
    reel = null;
    bgPlayer = null;
    bgCurrentId = null;
    clearBgAdvanceTimer();
    hideBgVideo();
  }

  function showCvBgImage(url, opts) {
    opts = opts || {};
    el.bgImageStack.style.display = opts.stacked ? 'flex' : 'none';
    el.bgImagePlain.style.display = opts.stacked ? 'none' : 'block';
    if (opts.stacked) {
      [1, 2, 3].forEach(function (i) {
        document.getElementById('stack-item-' + i).style.backgroundImage = "url('" + url + "')";
      });
    } else {
      el.bgImagePlain.style.backgroundImage = "url('" + url + "')";
      el.bgImagePlain.style.backgroundSize = opts.size || 'contain';
      el.bgImagePlain.style.backgroundPosition = opts.size === 'cover' ? 'center center' : 'center right';
    }
    el.bgImageOverlay.style.background = 'rgba(0,0,0,' + (opts.overlay != null ? opts.overlay : 0.65) + ')';
    el.bgImage.style.transition = 'opacity 1500ms ease-in-out';
    el.bgImage.classList.add('active');
    el.bgImage.style.opacity = '0';
    setTimeout(function () { el.bgImage.style.opacity = '1'; }, 50);
    if (opts.sequence) runBgSequence();
  }

  function runBgSequence() {
    el.pageFade.style.transition = 'opacity 2.5s ease-in-out';
    el.pageFade.style.opacity = '0';
    setTimeout(function () { el.pageFade.style.opacity = '1'; }, 3000);
  }

  function showMightyAphroditeImage(e) { if (e) e.preventDefault(); pauseMainPlayer(); stopStarsAndPipesAudio(); resetBgVideoState(); showCvBgImage('assets/mighty-aphrodite.png', { stacked: true, overlay: 0.65 }); }
  function showLamontBishopImage(e) { if (e) e.preventDefault(); pauseMainPlayer(); stopStarsAndPipesAudio(); resetBgVideoState(); showCvBgImage('assets/lamont-bishop.png', { size: 'contain', overlay: 0.65 }); }
  function showAmericanDreamingImage(e) { if (e) e.preventDefault(); pauseMainPlayer(); stopStarsAndPipesAudio(); resetBgVideoState(); showCvBgImage('assets/american-dreaming.png', { size: 'cover', overlay: 0.72 }); }
  function showStarsAndPipesImage(e) {
    if (e) e.preventDefault();
    pauseMainPlayer();
    resetBgVideoState();
    var audio = document.getElementById('stars-pipes-audio');
    if (audio) { audio.currentTime = 0; audio.play().catch(function () {}); }
    showCvBgImage('assets/stars-and-pipes.jpg', { size: 'cover', overlay: 0.65, sequence: true });
  }

  function setBgVideoIframeSrc(id) {
    el.bgVimeoIframe.src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&muted=0&controls=0&dnt=1&background=0';
  }

  function playBgVideo(id, start, end) {
    reel = null;
    pauseMainPlayer();
    stopStarsAndPipesAudio();
    state.bgMuted = false;
    el.bgMuteBtn.innerHTML = UNMUTE_ICON;
    playClip(id, start, end, true);
  }

  function playReel(e) {
    if (e) e.preventDefault();
    pauseMainPlayer();
    stopStarsAndPipesAudio();
    state.bgMuted = false;
    el.bgMuteBtn.innerHTML = UNMUTE_ICON;
    reel = [
      { id: '90561744', start: 0, end: 75 },
      { id: '33052855', start: 11, end: 41 },
      { id: '39578046', start: 81, end: 114 },
      { id: '10589479', start: 9, end: 69 }
    ];
    reelIndex = 0;
    var first = reel[0];
    playClip(first.id, first.start, first.end, true);
  }

  function playClip(id, start, end, isFirstFade) {
    var startPlayback = function () {
      var player = bgPlayer;
      player.setVolume(0);
      var proceed = function () {
        var p = player.play();
        var unmute = function () { if (!state.bgMuted) player.setVolume(0.4); };
        var playDone = (p && p.then) ? p.catch(function () {}) : Promise.resolve();
        var playTimeout = new Promise(function (res) { setTimeout(res, 500); });
        Promise.race([playDone, playTimeout]).then(unmute);
      };
      var seek = start > 0 ? player.setCurrentTime(start).catch(function () {}) : Promise.resolve();
      var timeout = new Promise(function (res) { setTimeout(res, 800); });
      Promise.race([seek, timeout]).then(proceed);
      scheduleAdvance(id, start, end);
    };
    if (bgPlayer && bgCurrentId) {
      if (bgCurrentId === id) startPlayback();
      else bgPlayer.loadVideo(id).then(function () { bgCurrentId = id; startPlayback(); });
      if (isFirstFade) {
        hideBgImage();
        el.bgVideo.classList.add('active');
        el.bgVideo.style.transition = 'opacity 2000ms ease-in-out';
        el.bgVideo.style.opacity = '0';
        el.bgMuteBtn.classList.add('active');
        requestAnimationFrame(function () { requestAnimationFrame(function () { el.bgVideo.style.opacity = '1'; }); });
        runBgSequence();
      }
    } else {
      bgInitAttempts = 0;
      hideBgImage();
      setBgVideoIframeSrc(id);
      el.bgVideo.classList.add('active');
      el.bgVideo.style.transition = 'opacity 2000ms ease-in-out';
      el.bgVideo.style.opacity = '0';
      el.bgMuteBtn.classList.add('active');
      initBgPlayer(function () { bgCurrentId = id; startPlayback(); });
      if (isFirstFade) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { el.bgVideo.style.opacity = '1'; }); });
        runBgSequence();
      }
    }
  }

  function fadeVolume(from, to, duration, cb) {
    var steps = 10, stepMs = duration / steps, i = 0;
    function run() {
      i++;
      var v = from + (to - from) * (i / steps);
      if (bgPlayer) bgPlayer.setVolume(Math.max(0, v));
      if (i < steps) setTimeout(run, stepMs); else if (cb) cb();
    }
    run();
  }

  function scheduleAdvance(id, start, end) {
    clearBgAdvanceTimer();
    var total = (end - start) * 1000;
    var fadeMs = Math.min(1000, total / 3);
    bgAdvanceTimer = setTimeout(function () {
      var next;
      if (reel) { reelIndex = (reelIndex + 1) % reel.length; next = reel[reelIndex]; }
      else next = { id: id, start: start, end: end };
      crossfadeTo(next.id, next.start, next.end, fadeMs);
    }, Math.max(total - fadeMs, 0));
  }

  function crossfadeTo(id, start, end, fadeMs) {
    fadeMs = fadeMs || 1000;
    var targetVol = state.bgMuted ? 0 : 0.4;
    fadeVolume(targetVol, 0, fadeMs, function () {
      el.bgVideo.style.transition = 'opacity 500ms ease-in-out';
      el.bgVideo.style.opacity = '0';
      setTimeout(function () {
        var seekAndPlay = function () {
          var player = bgPlayer;
          player.setVolume(0);
          var proceed = function () {
            var p = player.play();
            var unmute = function () { if (!state.bgMuted) fadeVolume(0, 0.4, fadeMs); };
            var playDone = (p && p.then) ? p.catch(function () {}) : Promise.resolve();
            var playTimeout = new Promise(function (res) { setTimeout(res, 500); });
            Promise.race([playDone, playTimeout]).then(unmute);
            el.bgVideo.style.opacity = '1';
          };
          var seek = start > 0 ? player.setCurrentTime(start).catch(function () {}) : Promise.resolve();
          var timeout = new Promise(function (res) { setTimeout(res, 800); });
          Promise.race([seek, timeout]).then(proceed);
          scheduleAdvance(id, start, end);
        };
        if (bgCurrentId === id) seekAndPlay();
        else bgPlayer.loadVideo(id).then(function () { bgCurrentId = id; seekAndPlay(); });
      }, 500);
    });
  }

  function initBgPlayer(onReady) {
    if (bgPlayer || bgInitAttempts > 20) return;
    bgInitAttempts++;
    if (!window.Vimeo || !window.Vimeo.Player) { setTimeout(function () { initBgPlayer(onReady); }, 250); return; }
    try {
      bgPlayer = new Vimeo.Player(el.bgVimeoIframe);
      bgPlayer.ready().then(onReady).catch(function () {
        bgPlayer = null;
        setTimeout(function () { initBgPlayer(onReady); }, 500);
      });
    } catch (e) {
      bgPlayer = null;
      setTimeout(function () { initBgPlayer(onReady); }, 500);
    }
  }

  function toggleBgMute() {
    if (!bgPlayer) return;
    var next = !state.bgMuted;
    fadeVolume(next ? 0.4 : 0, next ? 0 : 0.4, 300);
    state.bgMuted = next;
    el.bgMuteBtn.innerHTML = next ? MUTE_ICON : UNMUTE_ICON;
  }

  function bgImageIsActive() { return el.bgImage.classList.contains('active'); }

  function navigate(page) {
    if (page === state.page || state.transitioning) return;
    var enteringBooking = page === 'booking' && state.page !== 'booking';
    var wasCv = state.page === 'cv';
    var leavingMusic = state.page === 'music' && page !== 'music';
    var leavingBg = BG_PAGES[state.page] && !BG_PAGES[page] && bgImageIsActive();
    var enteringBg = BG_PAGES[page] && page !== state.page;

    if (page === 'cv') playReel();

    state.transitioning = true;
    el.pageFade.style.transition = 'opacity ' + CONTENT_FADE_MS + 'ms ease-in-out';
    el.pageFade.style.opacity = '0';
    if (leavingBg || wasCv) hideBgImage();

    setTimeout(function () {
      state.page = page;
      state.transitioning = false;
      if (leavingBg || wasCv) {
        resetBgVideoState();
        stopStarsAndPipesAudio();
        el.bgBlackOverlay.style.opacity = '0';
      }
      if (leavingMusic) el.bgBlackOverlay.style.opacity = '0';
      if (enteringBg) {
        pauseMainPlayer();
        showCvBgImage(BG_PAGES[page], { size: 'cover', overlay: 0.65 });
      }
      renderPage();
      el.pageFade.style.opacity = '1';
      if (enteringBooking) playContactAudio();
    }, CONTENT_FADE_MS);
  }

  function updateHeader() {
    var p = state.page;
    el.prefix.textContent = PREFIXES[p] || 'Home';
    el.prefix.style.visibility = p !== 'home' ? 'visible' : 'hidden';
  }

  function updateNav() {
    var p = state.page;
    var items = NAV_MAP[p] || NAV_MAP.home;
    var html = items.map(function (i) {
      return '<li><button type="button" data-nav-target="' + i[1] + '">' + i[0] + '</button></li>';
    }).join('');
    if (p === 'booking') {
      html += '<li><a href="sms:2024899901" class="icon-link" aria-label="Send text message">' + SMS_ICON + '</a></li>';
      html += '<li><a href="mailto:phoenixroxme@gmail.com" class="icon-link" aria-label="Send email">' + MAIL_ICON + '</a></li>';
      html += '<li><a href="https://www.instagram.com/phoenixrox.me/" target="_blank" rel="noopener" class="icon-link" aria-label="Instagram">' + IG_ICON + '<span style="font-family:Raleway, sans-serif; font-weight:300; font-size:13px; letter-spacing:1px">@phoenixrox.me</span></a></li>';
    }
    el.nav.innerHTML = html;
    el.nav.querySelectorAll('[data-nav-target]').forEach(function (btn) {
      btn.addEventListener('click', function () { navigate(btn.getAttribute('data-nav-target')); });
    });
  }

  function aboutHTML() {
    return '<div class="about-block">' +
      '<p>Phoenix engages audiences by crafting unique listening experiences by blending beats and harmonies, mixing genres; conveying a bevy of feelings and moods. Incorporating user experience design methods Phoenix stands out and leaves people asking &ldquo;Oooh, what song is this?!&rdquo;</p>' +
      '<p>Phoenix is currently working on a book with her music mentor, <a href="https://www.kennedy-center.org/artists/l/lo-lz/adrian-loving/" target="_blank" rel="noopener" title="linktr.ee/soulbrother71">Adrian Loving</a> and legendary celebrity hair stylist Diamond Ken.</p>' +
      '<div class="signup">' +
        '<p>Get notified when it&rsquo;s released</p>' +
        '<form id="signup-form">' +
          '<input type="email" id="signup-email" placeholder="Email">' +
          '<input type="tel" id="signup-phone" placeholder="Phone (for text updates)">' +
          '<button type="submit">Sign Up</button>' +
        '</form>' +
        '<p class="signup-thanks" id="signup-thanks" style="display:none">Thanks &mdash; you&rsquo;re on the list.</p>' +
      '</div>' +
    '</div>';
  }

  function musicHTML() {
    var loveSickUrl = TRACKS[0].url;
    var isLoveSick = state.currentTrackUrl === loveSickUrl;
    el.bgBlackOverlay.style.opacity = isLoveSick ? '1' : '0';
    var albumArt = isLoveSick ? '<img src="assets/love-sick-album-art.jpg" alt="Love Sick album art" class="album-art">' : '';
    var tracksHtml = TRACKS.map(function (t) {
      var hasUrl = !!t.url || t.name === 'Stars & Pipes';
      var active = t.url === state.currentTrackUrl;
      var cls = active ? 'active' : (hasUrl ? '' : 'disabled');
      return '<li><button type="button" class="' + cls + '" data-track="' + t.name + '">' + t.name + '</button></li>';
    }).join('');
    return '<div class="music-block">' + albumArt +
      '<div class="player-row">' +
        '<button type="button" class="play-btn" id="play-btn" aria-label="Play or pause">' + (state.scPlaying ? PAUSE_ICON : PLAY_ICON) + '</button>' +
        '<div class="progress-track" id="progress-track"><div class="progress-fill" id="progress-fill" style="width:' + state.scProgress + '%"></div></div>' +
        '<span class="time-label" id="time-label">' + state.scTime + '</span>' +
      '</div>' +
      '<ul class="track-list">' + tracksHtml + '</ul>' +
    '</div>';
  }

  function cvHTML() {
    return '<div class="cv-block">' +
      '<div class="cv-col">' +
        '<span class="cv-label">Work</span>' +
        '<ul>' +
          '<li><a href="https://vimeo.com/33052855?fl=pl&fe=sh" data-action="paradise" rel="noopener">Music Director, Paradise City Documentary</a></li>' +
          '<li><a href="#" data-action="american-dreaming" rel="noopener">Music Director, American Dreaming Magazine</a></li>' +
          '<li><a href="https://vimeo.com/manage/videos/39578046" data-action="forgiato" rel="noopener">Forgiato Commercial</a>, <em>Director <a href="https://www.avicohen.tv/" target="_blank" rel="noopener">Avi Cohen</a></em></li>' +
          '<li><a href="https://vimeo.com/90561744?fl=pl&fe=sh" data-action="kami" rel="noopener">Music Director, Kami Designs</a></li>' +
          '<li><a href="#" data-action="stars-pipes" rel="noopener">Curator, Stars &amp; Pipes: An Exploration of Drugs in America</a>, <em>w/ photographer <a href="https://vimeo.com/7495158?fl=pl&fe=sh" data-action="thi-chien" rel="noopener">Thi Chien</a></em></li>' +
          '<li>DC Commission on the Arts &amp; Humanities, grant recipient</li>' +
        '</ul>' +
        '<span class="cv-label">Media</span>' +
        '<ul>' +
          '<li>DC Modern Luxury Magazine</li>' +
          '<li>American Dreaming Magazine</li>' +
        '</ul>' +
      '</div>' +
      '<div class="cv-col">' +
        '<span class="cv-label">Performance</span>' +
        '<ul>' +
          '<li>Warner Music Group &amp; Six Flags</li>' +
          '<li>Hello Stranger w/ <a href="https://www.instagram.com/djmindmotion1/" target="_blank" rel="noopener">Mind Motion</a></li>' +
          '<li>The Smugger</li>' +
          '<li><a href="#" data-action="mighty-aphrodite" rel="noopener">Mighty Aphrodite</a></li>' +
          '<li>Recess DC</li>' +
          '<li>Oakland Unified Public School District</li>' +
          '<li>DC Fashion Council</li>' +
          '<li><a href="https://www.instagram.com/pinklineproject/" target="_blank" rel="noopener">The Pink Line Project</a></li>' +
        '</ul>' +
        '<span class="cv-label">Resident Music Selector</span>' +
        '<ul>' +
          '<li>Guess Clothing Brand</li>' +
          '<li>The Smithsonian Textile Museum</li>' +
          '<li><a href="#" data-action="lamont-bishop" rel="noopener">Lamont Bishop Gallery</a></li>' +
          '<li>Vince Gray for (DC) Mayor Campaign</li>' +
          '<li><a href="https://www.instagram.com/bensnextdoordc/?hl=en" target="_blank" rel="noopener">Ben&rsquo;s Next Door</a></li>' +
        '</ul>' +
      '</div>' +
    '</div>';
  }

  function bindAction(name, handler) {
    var target = el.content.querySelector('[data-action="' + name + '"]');
    if (target) target.addEventListener('click', handler);
  }

  function submitSignup(e) {
    e.preventDefault();
    var email = document.getElementById('signup-email').value;
    var phone = document.getElementById('signup-phone').value;
    if (!email && !phone) return;
    var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx1sgJzVv8jAgAuQq7YL1bah7zXlTUfIif9AX2WzYu9gSyPrZBwYxsYwUnPfCS-94pZ6w/exec';
    fetch(WEB_APP_URL, {
      method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ email: email, phone: phone })
    }).catch(function () {});
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('signup-thanks').style.display = 'block';
  }

  function attachPageListeners() {
    var page = state.page;
    if (page === 'about') {
      document.getElementById('signup-form').addEventListener('submit', submitSignup);
    } else if (page === 'music') {
      document.getElementById('play-btn').addEventListener('click', togglePlay);
      document.getElementById('progress-track').addEventListener('click', seekTo);
      el.content.querySelectorAll('[data-track]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var track = TRACKS.filter(function (t) { return t.name === btn.getAttribute('data-track'); })[0];
          if (track) loadTrack(track);
        });
      });
    } else if (page === 'cv') {
      bindAction('paradise', function (e) { e.preventDefault(); playBgVideo('33052855', 11, 56); });
      bindAction('american-dreaming', showAmericanDreamingImage);
      bindAction('forgiato', function (e) { e.preventDefault(); playBgVideo('39578046', 81, 114); });
      bindAction('kami', function (e) { e.preventDefault(); playBgVideo('90561744', 0, 92); });
      bindAction('stars-pipes', showStarsAndPipesImage);
      bindAction('thi-chien', function (e) { e.preventDefault(); playBgVideo('7495158', 18, 56); });
      bindAction('mighty-aphrodite', showMightyAphroditeImage);
      bindAction('lamont-bishop', showLamontBishopImage);
    }
  }

  function renderPage() {
    updateNav();
    updateHeader();
    var page = state.page;
    if (page === 'about') el.content.innerHTML = aboutHTML();
    else if (page === 'music') el.content.innerHTML = musicHTML();
    else if (page === 'cv') el.content.innerHTML = cvHTML();
    else el.content.innerHTML = '';
    attachPageListeners();
  }
})();
